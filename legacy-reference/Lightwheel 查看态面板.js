// ==UserScript==
// @name         Lightwheel 查看态面板（access=1 安全跳转）- Pro+Key+Edit
// @namespace    https://label-cloud.lightwheel.net/
// @version      1.5.0
// @description  access=1查看态面板：状态筛选+名称列表+点击跳转(仅改package_id,强制access=1)；支持分页、持久化缓存、当前项高亮、面板显示隐藏；支持access-key自动抓取/手动设置/过期提示；✅保持页码状态；✅按钮嵌入tabs右侧；✅新增上下条跳转；✅新增编辑按钮(仅待处理)；✅编辑态检测PERMISSION_DENIED自动回退；✅面板可拖拽调尺寸。
// @match        https://label-cloud.lightwheel.net/w/video3/index.html*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(() => {
    "use strict";

    /** ---------------------------
   *  0) 解析URL参数
   * --------------------------- */
    const url = new URL(location.href);
    const access = url.searchParams.get("access") || "";

    /** ---------------------------
   *  1) 常量/工具
   * --------------------------- */
    const API_LIST = "https://label-cloud.lightwheel.net/api/label/v2/task/list-package-and-node";
    const API_GET_PACKAGE = "https://label-cloud.lightwheel.net/api/label/v2/task/get-package";

    const STATUS_TABS = [
        { key: "all", label: "全部", status: null },
        { key: "1",   label: "待处理", status: 1 },
        { key: "2",   label: "进行中", status: 2 },
        { key: "3",   label: "已通过", status: 3 },
        { key: "4",   label: "已驳回", status: 4 },
    ];
    const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 300, 400, 500];

    const qs = (sel, root=document) => root.querySelector(sel);
    const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    function toast(msg, ms=1800) {
        const t = document.createElement("div");
        t.className = "lwvp-toast";
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.classList.add("show"), 10);
        setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, ms);
    }

    function escapeHtml(str) {
        return String(str || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function buildViewUrlByPackageId(packageId, desiredStatus /* nullable */) {
        const u = new URL(location.href);
        u.searchParams.set("access", "1");
        u.searchParams.set("package_id", String(packageId));
        if (desiredStatus != null) u.searchParams.set("status", String(desiredStatus));
        // 清理可能的提示参数
        u.searchParams.delete("lwvp_msg");
        return u.toString();
    }

    function buildEditUrlForCurrent() {
        const u = new URL(location.href);
        u.searchParams.set("access", "3");
        // 进入编辑态时带一个标记，便于回退提示更准确
        u.searchParams.set("lwvp_try_edit", "1");
        return u.toString();
    }

    /** ---------------------------
   *  2) access=3：仅做“PERMISSION_DENIED 自动回退”检测
   * --------------------------- */
    if (access === "3") {
        // 只做拦截 + 检测 get-package 的响应体，不做面板，不干扰正常编辑
        const rawFetch = window.fetch;

        window.fetch = async function(input, init) {
            const res = await rawFetch.apply(this, arguments);

            try {
                const reqUrl = typeof input === "string" ? input : (input && input.url) || "";
                const urlStr = String(reqUrl || "");

                // 只关心 get-package
                if (urlStr.includes("/api/label/v2/task/get-package") || urlStr.startsWith(API_GET_PACKAGE)) {
                    // clone 读取json不影响原页面消费
                    const cloned = res.clone();
                    let data = null;
                    try { data = await cloned.json(); } catch {}

                    const code = data?.reply?.code || data?.code || "";
                    const msg  = data?.reply?.message || data?.message || "";

                    if (code === "PERMISSION_DENIED" || String(msg).includes("该题已经被其他人领取")) {
                        const back = new URL(location.href);
                        back.searchParams.set("access", "1");
                        back.searchParams.set("lwvp_msg", "claimed");
                        back.searchParams.delete("lwvp_try_edit");
                        location.replace(back.toString());
                    }
                }
            } catch {}

            return res;
        };

        // XHR 也拦一下（以防站点走XHR）
        (function hookXHRForDenied() {
            const XHR = window.XMLHttpRequest;
            const open = XHR.prototype.open;
            const send = XHR.prototype.send;

            XHR.prototype.open = function(method, urlStr) {
                this.__lwvp_url = urlStr;
                return open.apply(this, arguments);
            };

            XHR.prototype.send = function(body) {
                this.addEventListener("load", () => {
                    try {
                        const u = String(this.__lwvp_url || "");
                        if (!u.includes("/api/label/v2/task/get-package")) return;
                        const txt = this.responseText || "";
                        if (!txt) return;

                        let data = null;
                        try { data = JSON.parse(txt); } catch { return; }

                        const code = data?.reply?.code || data?.code || "";
                        const msg  = data?.reply?.message || data?.message || "";

                        if (code === "PERMISSION_DENIED" || String(msg).includes("该题已经被其他人领取")) {
                            const back = new URL(location.href);
                            back.searchParams.set("access", "1");
                            back.searchParams.set("lwvp_msg", "claimed");
                            back.searchParams.delete("lwvp_try_edit");
                            location.replace(back.toString());
                        }
                    } catch {}
                });
                return send.apply(this, arguments);
            };
        })();

        return; // access=3 到此结束
    }

    /** ---------------------------
   *  3) 只在 access=1 启用面板
   * --------------------------- */
    if (access !== "1") return;

    /** ---------------------------
   *  4) 解析必要参数
   * --------------------------- */
    const taskKey = url.searchParams.get("task_key") || "";
    const projectKey = url.searchParams.get("project_key") || "";
    const stage = Number(url.searchParams.get("stage") || "1");
    const workflowId = url.searchParams.get("workflow_id") || "Lang";
    const nodeId = url.searchParams.get("node_id") || "Lang-1";
    const currentPackageId = url.searchParams.get("package_id") || "";

    let nodeIds = GM_getValue("lwvp_node_ids_v1", null);
    if (!Array.isArray(nodeIds) || !nodeIds.length) nodeIds = [nodeId];

    if (!taskKey || !projectKey) {
        console.warn("[LWVP] 缺少 task_key / project_key，脚本停止。");
        return;
    }

    /** ---------------------------
   *  5) access-key：自动抓取 + 手动设置 + 过期处理
   * --------------------------- */
    const KEY_STORE = "lwvp_access_key_v2";
    const KEY_TS_STORE = "lwvp_access_key_ts_v2";

    let accessKey = GM_getValue(KEY_STORE, "") || "";
    let accessKeyTs = GM_getValue(KEY_TS_STORE, 0) || 0;

    if (!accessKey) {
        const candidates = [
            localStorage.getItem("access-key"),
            localStorage.getItem("access_key"),
            sessionStorage.getItem("access-key"),
            sessionStorage.getItem("access_key"),
        ].filter(Boolean);
        if (candidates.length) {
            accessKey = String(candidates[0]);
            accessKeyTs = Date.now();
            GM_setValue(KEY_STORE, accessKey);
            GM_setValue(KEY_TS_STORE, accessKeyTs);
        }
    }

    function setAccessKey(newKey, source = "manual") {
        const k = String(newKey || "").trim();
        if (!k) return false;
        accessKey = k;
        accessKeyTs = Date.now();
        GM_setValue(KEY_STORE, accessKey);
        GM_setValue(KEY_TS_STORE, accessKeyTs);
        store.keyInvalid = false;
        store.keySource = source;
        toast(`已更新 access-key（${source}）`);
        return true;
    }

    function getHeaderValue(headers, name) {
        if (!headers) return "";
        const n = String(name).toLowerCase();

        if (typeof headers.get === "function") {
            return headers.get(name) || headers.get(n) || headers.get(name.toUpperCase()) || "";
        }
        if (Array.isArray(headers)) {
            for (const kv of headers) {
                if (Array.isArray(kv) && String(kv[0]).toLowerCase() === n) return kv[1];
            }
            return "";
        }
        if (typeof headers === "object") {
            for (const k of Object.keys(headers)) {
                if (String(k).toLowerCase() === n) return headers[k];
            }
        }
        return "";
    }

    // ✅ 自动抓取：拦截 fetch & XHR，只要发现请求头里带 access-key 就保存
    // ✅ 更强的 fetch 拦截：请求头 + 响应头 双抓
    const rawFetch = window.fetch;

    function pickAccessKeyFromHeaders(headers) {
        try {
            if (!headers) return "";
            // Headers 对象
            if (typeof headers.get === "function") {
                return (
                    headers.get("access-key") ||
                    headers.get("Access-Key") ||
                    headers.get("access_key") ||
                    headers.get("Access_Key") ||
                    ""
                );
            }
            // 数组形式
            if (Array.isArray(headers)) {
                for (const kv of headers) {
                    if (!Array.isArray(kv)) continue;
                    const k = String(kv[0] || "").toLowerCase();
                    if (k === "access-key" || k === "access_key") return String(kv[1] || "");
                }
                return "";
            }
            // 普通对象
            if (typeof headers === "object") {
                for (const k of Object.keys(headers)) {
                    const lk = String(k).toLowerCase();
                    if (lk === "access-key" || lk === "access_key") return String(headers[k] || "");
                }
            }
        } catch {}
        return "";
    }

    // ✅ 额外兜底：从 localStorage/sessionStorage/cookie 找可能的 key
    function tryFindKeyFromStorage() {
        const candidates = [];

        const pushIf = (v) => {
            const s = String(v || "").trim();
            // 你之前 key 类似 32 位 hex，这里做个宽松过滤（防止误判也别太严）
            if (s.length >= 16 && s.length <= 128) candidates.push(s);
        };

        try {
            pushIf(localStorage.getItem("access-key"));
            pushIf(localStorage.getItem("access_key"));
            pushIf(sessionStorage.getItem("access-key"));
            pushIf(sessionStorage.getItem("access_key"));

            // 扫描 local/session storage 里所有字段名包含 access/key 的
            for (const st of [localStorage, sessionStorage]) {
                for (let i = 0; i < st.length; i++) {
                    const k = st.key(i);
                    if (!k) continue;
                    const lk = k.toLowerCase();
                    if (lk.includes("access") && lk.includes("key")) pushIf(st.getItem(k));
                }
            }

            // cookie 兜底
            const ck = document.cookie || "";
            ck.split(";").forEach(part => {
                const [k, ...rest] = part.split("=");
                const lk = String(k || "").trim().toLowerCase();
                if (lk.includes("access") && lk.includes("key")) pushIf(rest.join("=").trim());
            });
        } catch {}

        return candidates[0] || "";
    }

    window.fetch = async function(input, init) {
        // 1) 先抓请求头里的 access-key
        try {
            const reqUrl = typeof input === "string" ? input : (input && input.url) || "";
            const urlStr = String(reqUrl || "");

            let ak = "";

            // input 是 Request
            if (!ak && input && typeof input === "object" && input.headers) {
                ak = pickAccessKeyFromHeaders(input.headers);
            }
            // init.headers
            if (!ak && init && init.headers) {
                ak = pickAccessKeyFromHeaders(init.headers);
            }

            if (!ak) {
                const stKey = tryFindKeyFromStorage();
                if (stKey) ak = stKey;
            }

            if (ak && urlStr.includes("/api/")) {
                const cleaned = String(ak).trim();
                if (cleaned && cleaned !== accessKey) setAccessKey(cleaned, "auto(fetch:req)");
            }
        } catch {}

        const res = await rawFetch.apply(this, arguments);

        // 2) 再抓响应头里的 access-key（很多系统会在响应头下发新 key）
        try {
            const rAk =
                  res.headers.get("access-key") ||
                  res.headers.get("Access-Key") ||
                  res.headers.get("access_key") ||
                  res.headers.get("Access_Key") ||
                  "";

            if (rAk) {
                const cleaned = String(rAk).trim();
                if (cleaned && cleaned !== accessKey) setAccessKey(cleaned, "auto(fetch:res)");
            }
        } catch {}

        return res;
    };


    (function hookXHR() {
        const XHR = window.XMLHttpRequest;
        const open = XHR.prototype.open;
        const setRequestHeader = XHR.prototype.setRequestHeader;

        XHR.prototype.open = function(method, urlStr) {
            this.__lwvp_url = urlStr;
            return open.apply(this, arguments);
        };

        XHR.prototype.setRequestHeader = function(name, value) {
            try {
                const n = String(name || "").toLowerCase();
                if (n === "access-key" || n === "access_key") {
                    const cleaned = String(value || "").trim();
                    if (cleaned && cleaned !== accessKey) setAccessKey(cleaned, "auto(xhr:req)");
                }
            } catch {}
            return setRequestHeader.apply(this, arguments);
        };
    })();


    /** ---------------------------
   *  6) ✅ 持久化缓存（跨页面保留：数据缓存 + UI状态）
   * --------------------------- */
    const CACHE_KEY = `lwvp_cache_v2::${projectKey}::${taskKey}::${stage}::${workflowId}::${nodeIds.join(",")}`;
    const UI_KEY_VISIBLE = `lwvp_ui_visible_v1::${projectKey}::${taskKey}`;
    const UI_KEY_PAGESIZE = `lwvp_ui_pagesize_v1::${projectKey}::${taskKey}`;
    const UI_KEY_ACTIVETAB = `lwvp_ui_activetab_v1::${projectKey}::${taskKey}`;

    function loadCache() {
        const c = GM_getValue(CACHE_KEY, null);
        if (!c || typeof c !== "object") return null;
        return c;
    }
    function saveCache(cacheObj) { GM_setValue(CACHE_KEY, cacheObj); }
    function clearCache() { GM_setValue(CACHE_KEY, null); }

    function getPanelCtxKey() {
        const u = new URL(location.href);
        const tk = u.searchParams.get("task_key") || "";
        const nd = u.searchParams.get("node_id") || "";
        const tab = store.activeTabKey || "1";
        return `lwvp:panel_state:${tk}:${nd}:${tab}`;
    }

    function savePanelState() {
        const payload = {
            uiVisible: !!store.uiVisible,
            activeTabKey: store.activeTabKey,
            uiPage: store.uiPage,
            uiPageSize: store.uiPageSize,
            keyword: store.keyword || "",
            showKeyBox: !!store.showKeyBox,
            ts: Date.now(),
        };
        const key = getPanelCtxKey();
        sessionStorage.setItem(key, JSON.stringify(payload));
        sessionStorage.setItem(`lwvp:panel_last:${taskKey}:${nodeId}`, JSON.stringify(payload));
    }

    function loadPanelStatePreferLast() {
        const lastRaw = sessionStorage.getItem(`lwvp:panel_last:${taskKey}:${nodeId}`);
        if (!lastRaw) return null;
        try { return JSON.parse(lastRaw); } catch { return null; }
    }

    /** ---------------------------
   *  7) 状态
   * --------------------------- */
    const store = {
        uiVisible: GM_getValue(UI_KEY_VISIBLE, true),
        activeTabKey: GM_getValue(UI_KEY_ACTIVETAB, "1"),

        itemsByTab: new Map(),
        counts: new Map(),
        fetchedAllByTab: new Map(),
        loading: false,

        uiPage: 1,
        uiPageSize: GM_getValue(UI_KEY_PAGESIZE, 20),
        keyword: "",

        lastCacheAt: 0,

        // key UI
        keyInvalid: false,
        keySource: accessKey ? "stored" : "none",
        showKeyBox: false,

        // 上下条导航
        navIds: [],
        navIndex: -1,
        navStatusForJump: null,
    };

    const restored = loadPanelStatePreferLast();
    if (restored && typeof restored === "object") {
        if (restored.activeTabKey) store.activeTabKey = String(restored.activeTabKey);
        if (Number.isFinite(restored.uiPage)) store.uiPage = Math.max(1, Number(restored.uiPage));
        if (Number.isFinite(restored.uiPageSize) && PAGE_SIZE_OPTIONS.includes(Number(restored.uiPageSize))) {
            store.uiPageSize = Number(restored.uiPageSize);
        }
        if (typeof restored.keyword === "string") store.keyword = restored.keyword;
        if (typeof restored.uiVisible === "boolean") store.uiVisible = restored.uiVisible;
        if (typeof restored.showKeyBox === "boolean") store.showKeyBox = restored.showKeyBox;
    }

    const cached = loadCache();
    if (cached) {
        store.lastCacheAt = cached.ts || 0;
        if (cached.counts && typeof cached.counts === "object") {
            for (const [k, v] of Object.entries(cached.counts)) store.counts.set(k, v);
        }
        if (cached.itemsByTab && typeof cached.itemsByTab === "object") {
            for (const [tabKey, arr] of Object.entries(cached.itemsByTab)) {
                if (Array.isArray(arr)) store.itemsByTab.set(tabKey, arr);
            }
        }
        if (cached.fetchedAllByTab && typeof cached.fetchedAllByTab === "object") {
            for (const [k, v] of Object.entries(cached.fetchedAllByTab)) store.fetchedAllByTab.set(k, !!v);
        }
    }

    function persistStateToCache() {
        const obj = {
            ts: Date.now(),
            counts: Object.fromEntries(store.counts.entries()),
            itemsByTab: Object.fromEntries(store.itemsByTab.entries()),
            fetchedAllByTab: Object.fromEntries(store.fetchedAllByTab.entries()),
        };
        saveCache(obj);
        store.lastCacheAt = obj.ts;
    }

    /** ---------------------------
   *  8) API
   * --------------------------- */
    function normalizeItems(resp) {
        const arr = [];
        const list = resp && resp.package_and_nodes ? resp.package_and_nodes : [];
        for (const x of list) {
            const pkg = x.package || {};
            const id = pkg.id;
            const name = pkg.data_seg_name || String(id || "");
            if (!id) continue;
            arr.push({ packageId: id, name });
        }
        return arr;
    }

    function updateCountsFromResp(resp) {
        const sc = resp && resp.status_counts ? resp.status_counts : [];
        for (const x of sc) {
            if (x && typeof x.status === "number") store.counts.set(String(x.status), Number(x.count || 0));
        }
    }

    async function apiList({ status, pageNo, pageSize }) {
        if (!accessKey) throw new Error("缺少 access-key（可点击“强制刷新(抓取key)”或手动粘贴）");

        const body = {
            page: { page_no: pageNo, page_size: pageSize },
            task_key: taskKey,
            project_key: projectKey,
            stage,
            is_not_export: false,
            node_ids: nodeIds,
        };
        if (status != null) body.status = status;

        const res = await rawFetch(API_LIST, {
            method: "POST",
            mode: "cors",
            credentials: "omit",
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "access-key": accessKey,
                "time": String(Date.now()),
            },
            body: JSON.stringify(body),
        });

        if (res.status === 401) {
            store.keyInvalid = true;
            render();
            throw new Error("401 Unauthorized：access-key 已失效/过期。点击“强制刷新(抓取key)”让页面重新发请求并自动抓取新 key，或手动更新。");
        }

        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`接口错误: ${res.status} ${res.statusText} ${txt.slice(0,200)}`);
        }
        return res.json();
    }

    async function ensureFirstPage(tabKey) {
        if (store.itemsByTab.has(tabKey)) return;

        const tab = STATUS_TABS.find(t => t.key === tabKey);
        const status = tab ? tab.status : 1;

        store.loading = true; render();
        try {
            const resp = await apiList({ status, pageNo: 1, pageSize: 500 });
            updateCountsFromResp(resp);
            const items = normalizeItems(resp);
            store.itemsByTab.set(tabKey, items);

            const total = resp?.page_meta?.total ?? null;
            if (typeof total === "number" && total <= 500) store.fetchedAllByTab.set(tabKey, true);

            persistStateToCache();
        } finally {
            store.loading = false; render();
        }
    }

    async function fetchAll(tabKey) {
        const tab = STATUS_TABS.find(t => t.key === tabKey);
        const status = tab ? tab.status : 1;

        store.loading = true; render();
        try {
            let all = store.itemsByTab.get(tabKey);
            let total = null;

            if (!all) {
                const r1 = await apiList({ status, pageNo: 1, pageSize: 500 });
                updateCountsFromResp(r1);
                all = normalizeItems(r1);
                store.itemsByTab.set(tabKey, all);
                total = r1?.page_meta?.total ?? null;
            } else {
                const rMeta = await apiList({ status, pageNo: 1, pageSize: 1 });
                total = rMeta?.page_meta?.total ?? null;
                updateCountsFromResp(rMeta);
            }

            if (typeof total !== "number") {
                toast("无法确定总数，已保留当前已加载数据");
                store.fetchedAllByTab.set(tabKey, false);
                persistStateToCache();
                return;
            }

            const pages = Math.ceil(total / 500);
            if (pages <= 1) {
                store.fetchedAllByTab.set(tabKey, true);
                toast("已是全量");
                persistStateToCache();
                return;
            }

            const seen = new Set(all.map(x => x.packageId));
            for (let p = 2; p <= pages; p++) {
                const rp = await apiList({ status, pageNo: p, pageSize: 500 });
                const items = normalizeItems(rp);
                for (const it of items) {
                    if (!seen.has(it.packageId)) { all.push(it); seen.add(it.packageId); }
                }
                store.itemsByTab.set(tabKey, all);
                render();
                await sleep(120);
            }

            store.fetchedAllByTab.set(tabKey, true);
            persistStateToCache();
            toast(`已加载全部：${all.length} 条`);
        } catch (e) {
            console.error(e);
            toast(String(e.message || e), 2600);
        } finally {
            store.loading = false; render();
        }
    }

    /** ---------------------------
   *  9) ✅ 上/下条跳转（基于当前tab + 关键字筛选后的全列表）
   * --------------------------- */
    function jumpNeighbor(delta) {
        if (!store.navIds || !store.navIds.length) { toast("当前列表为空/未加载"); return; }
        if (store.navIndex < 0) { toast("当前 package_id 不在列表内（可能未加载到该tab）"); return; }
        const nextIdx = store.navIndex + delta;
        if (nextIdx < 0) { toast("已经是第一条"); return; }
        if (nextIdx >= store.navIds.length) { toast("已经是最后一条"); return; }

        const pkg = store.navIds[nextIdx];
        const desiredStatus = store.navStatusForJump;
        savePanelState();
        location.href = buildViewUrlByPackageId(pkg, desiredStatus);
    }

    /** ---------------------------
   *  10) ✅ 编辑当前条目（仅待处理tab显示）
   * --------------------------- */
    function canShowEditBtn() {
        // 仅当当前tab=待处理(status=1) 才显示
        return store.activeTabKey === "1" && !!currentPackageId;
    }

    function gotoEditCurrent() {
        if (!currentPackageId) { toast("当前没有 package_id"); return; }
        savePanelState();
        location.href = buildEditUrlForCurrent();
    }

    /** ---------------------------
   *  11) UI 样式
   * --------------------------- */
    GM_addStyle(`
    .lwvp-root{
      position:fixed; right:16px; top:80px;
      width:460px; height:calc(100vh - 120px);
      min-width:360px; min-height:360px;
      max-width:70vw; max-height:calc(100vh - 40px);
      z-index:999999;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,"PingFang SC","Microsoft YaHei",sans-serif;
      color:#1f2328;
      resize:both; overflow:hidden;
    }
    .lwvp-key-indicator{
      cursor:pointer; user-select:none;
      font-size:12px; padding:2px 10px; border-radius:999px;
      border:1px solid rgba(0,0,0,.10);
      background:#eef2ff; color:#3730a3; font-weight:800;
    }
    .lwvp-key-indicator.bad{ background:#fff7ed; color:#9a3412; border-color:rgba(251,146,60,.45); }
    .lwvp-key-indicator.none{ background:#f3f4f6; color:#374151; }
    .lwvp-hidden{ display:none !important; }
    .lwvp-card{
      width:100%; height:100%;
      background:#fff; border:1px solid rgba(0,0,0,.08); border-radius:14px;
      box-shadow:0 14px 40px rgba(0,0,0,.14);
      overflow:hidden; display:flex; flex-direction:column;
    }
    .lwvp-header{
      padding:10px 12px; display:flex; align-items:center; justify-content:space-between;
      background:#f8fafc; border-bottom:1px solid rgba(0,0,0,.06);
    }
    .lwvp-title{ font-size:13px; font-weight:800; display:flex; gap:8px; align-items:center; }
    .lwvp-actions{ display:flex; gap:10px; align-items:center; }
    .lwvp-btn{
      cursor:pointer; user-select:none;
      border:1px solid rgba(0,0,0,.12);
      background:#fff; border-radius:999px;
      padding:7px 12px; font-size:12px; line-height:1;
    }
    .lwvp-btn:hover{ background:#f3f4f6; }
    .lwvp-btn.icon{
      width:34px; height:30px; padding:0;
      display:inline-flex; align-items:center; justify-content:center;
      font-weight:900;
    }
    .lwvp-select{
      font-size:12px; padding:7px 12px; border-radius:999px;
      border:1px solid rgba(0,0,0,.12);
      background:#fff; outline:none;
    }
    .lwvp-tabs{
      padding:10px 10px; display:flex; flex-wrap:wrap; gap:8px;
      border-bottom:1px solid rgba(0,0,0,.06); background:#fff;
    }
    .lwvp-tab{
      cursor:pointer; user-select:none;
      font-size:12px; padding:7px 12px;
      border-radius:999px; border:1px solid rgba(0,0,0,.12);
      background:#fff;
    }
    .lwvp-tab.active{ background:#111827; color:#fff; border-color:#111827; }
    .lwvp-tab small{ opacity:.85; margin-left:6px; font-weight:800; }
    .lwvp-tools{
      padding:10px 10px; display:flex; gap:8px; align-items:center;
      border-bottom:1px solid rgba(0,0,0,.06); background:#fff;
    }
    .lwvp-input{
      flex:1; font-size:12px; padding:8px 12px;
      border-radius:10px; border:1px solid rgba(0,0,0,.12); outline:none;
    }
    .lwvp-input:focus{ border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.15); }
    .lwvp-body{ flex:1; overflow:auto; background:#fff; }
    .lwvp-list{ padding:10px 10px; display:flex; flex-direction:column; gap:8px; }
    .lwvp-item{
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      padding:9px 12px; border:1px solid rgba(0,0,0,.10);
      border-radius:12px; cursor:pointer; background:#fff;
    }
    .lwvp-item:hover{ background:#f9fafb; border-color:rgba(0,0,0,.18); }
    .lwvp-name{ font-size:12px; line-height:1.25; color:#111827; word-break:break-all; }
    .lwvp-item.current{
      border-color: rgba(37,99,235,.85);
      box-shadow: 0 0 0 3px rgba(37,99,235,.15);
      background: #eff6ff;
    }
    .lwvp-item.current .lwvp-name{ font-weight: 900; }
    .lwvp-foot{
      padding:10px 10px; border-top:1px solid rgba(0,0,0,.06);
      background:#f8fafc;
      display:flex; align-items:center; justify-content:space-between; gap:10px;
    }
    .lwvp-pager{ display:flex; gap:8px; align-items:center; }
    .lwvp-muted{ font-size:12px; color:#6b7280; }

    .lwvp-toast{
      position:fixed; right:18px; bottom:22px; z-index:1000000; padding:10px 12px;
      background:rgba(17,24,39,.92); color:#fff; border-radius:10px;
      opacity:0; transform:translateY(6px);
      transition:.25s ease; font-size:12px; max-width:520px;
    }
    .lwvp-toast.show{ opacity:1; transform:translateY(0); }

    .lwvp-keybox{
      padding:10px; background:#fff7ed;
      border:1px solid rgba(251,146,60,.35);
      border-radius:12px; margin:10px;
    }
    .lwvp-keybox b{ color:#9a3412; }
    .lwvp-row{ display:flex; gap:8px; margin-top:8px; align-items:center; }
    .lwvp-mini{ font-size:12px; color:#7c2d12; opacity:.9; margin-top:6px; }
    .lwvp-pill{ font-size:11px; padding:2px 10px; border-radius:999px; border:1px solid rgba(0,0,0,.12); background:#fff; color:#111827; }

    .lwvp-tabs-btn-wrap{
      position:absolute;
      right:10px;
      top:50%;
      transform:translateY(-50%);
      display:inline-flex; align-items:center; gap:10px;
      padding-left:10px;
      background:transparent;
    }
    .lwvp-tabs-btn{
      border:1px solid rgba(0,0,0,.12);
      background:#111827; color:#fff;
      border-radius:999px;
      padding:7px 12px; font-size:12px;
      cursor:pointer; user-select:none;
      box-shadow:0 6px 18px rgba(0,0,0,.12);
    }
    .lwvp-tabs-btn:hover{ filter:brightness(1.05); }
    .lwvp-tabs-btn.icon{
      width:34px; height:30px;
      padding:0; display:inline-flex; align-items:center; justify-content:center;
      font-weight:900;
    }

    .lwvp-float-toggle{
      position:fixed; right:16px; top:28px; z-index:1000001;
      border:1px solid rgba(0,0,0,.12); background:#111827; color:#fff;
      border-radius:999px; padding:8px 12px; font-size:12px; cursor:pointer;
      box-shadow:0 10px 30px rgba(0,0,0,.12);
      user-select:none;
    }
    .lwvp-float-toggle:hover{ filter:brightness(1.05); }
  `);

    /** ---------------------------
   *  12) DOM：面板容器
   * --------------------------- */
    const root = document.createElement("div");
    root.className = "lwvp-root";
    document.body.appendChild(root);

    /** ---------------------------
   *  12.1) tabs最右侧按钮：编辑 / 上一条 / 下一条 / 显示隐藏
   * --------------------------- */
    let tabsBtn = null;
    let btnPrevItem = null;
    let btnNextItem = null;
    let btnEditItem = null;
    let fallbackFloatBtn = null;

    function ensureToggleButton() {
        if (tabsBtn && document.contains(tabsBtn) && btnPrevItem && btnNextItem) return;

        const header = qs('.el-tabs__header.is-top');
        if (header) {
            const st = getComputedStyle(header);
            if (st.position === "static") header.style.position = "relative";

            let wrap = qs('.lwvp-tabs-btn-wrap', header);
            if (!wrap) {
                wrap = document.createElement("div");
                wrap.className = "lwvp-tabs-btn-wrap";
                header.appendChild(wrap);
            } else {
                wrap.innerHTML = "";
            }

            // ✅ 编辑按钮（仅待处理tab显示）
            btnEditItem = document.createElement("button");
            btnEditItem.type = "button";
            btnEditItem.className = "lwvp-tabs-btn icon";
            btnEditItem.textContent = "✎";
            btnEditItem.title = "编辑该条目（仅待处理）";
            wrap.appendChild(btnEditItem);

            btnEditItem.addEventListener("click", (e) => {
                e.stopPropagation();
                if (!canShowEditBtn()) return;
                gotoEditCurrent();
            });

            // ✅ 上一条 / 下一条
            btnPrevItem = document.createElement("button");
            btnPrevItem.type = "button";
            btnPrevItem.className = "lwvp-tabs-btn icon";
            btnPrevItem.textContent = "⬆";
            btnPrevItem.title = "上一条（按当前tab+筛选列表）";
            wrap.appendChild(btnPrevItem);

            btnNextItem = document.createElement("button");
            btnNextItem.type = "button";
            btnNextItem.className = "lwvp-tabs-btn icon";
            btnNextItem.textContent = "⬇";
            btnNextItem.title = "下一条（按当前tab+筛选列表）";
            wrap.appendChild(btnNextItem);

            btnPrevItem.addEventListener("click", (e) => { e.stopPropagation(); jumpNeighbor(-1); });
            btnNextItem.addEventListener("click", (e) => { e.stopPropagation(); jumpNeighbor(+1); });

            // ✅ 显示/隐藏面板
            tabsBtn = document.createElement("button");
            tabsBtn.type = "button";
            tabsBtn.className = "lwvp-tabs-btn";
            tabsBtn.textContent = store.uiVisible ? "隐藏面板" : "显示面板";
            wrap.appendChild(tabsBtn);

            tabsBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                setVisible(!store.uiVisible);
            });

            if (fallbackFloatBtn) {
                fallbackFloatBtn.remove();
                fallbackFloatBtn = null;
            }

            // 根据当前tab实时显示/隐藏编辑按钮
            syncEditBtnVisibility();

            return;
        }

        if (!fallbackFloatBtn) {
            fallbackFloatBtn = document.createElement("div");
            fallbackFloatBtn.className = "lwvp-float-toggle";
            fallbackFloatBtn.textContent = store.uiVisible ? "隐藏面板" : "显示面板";
            document.body.appendChild(fallbackFloatBtn);
            fallbackFloatBtn.addEventListener("click", () => setVisible(!store.uiVisible));
        }
    }

    function syncEditBtnVisibility() {
        if (!btnEditItem) return;
        btnEditItem.style.display = canShowEditBtn() ? "" : "none";
    }

    const mo = new MutationObserver(() => ensureToggleButton());
    mo.observe(document.documentElement, { childList: true, subtree: true });

    /** ---------------------------
   *  13) 可见性 + 渲染
   * --------------------------- */
    function setVisible(v) {
        store.uiVisible = !!v;
        GM_setValue(UI_KEY_VISIBLE, store.uiVisible);

        if (tabsBtn) tabsBtn.textContent = store.uiVisible ? "隐藏面板" : "显示面板";
        if (fallbackFloatBtn) fallbackFloatBtn.textContent = store.uiVisible ? "隐藏面板" : "显示面板";

        root.classList.toggle("lwvp-hidden", !store.uiVisible);
        savePanelState();

        if (store.uiVisible) setTimeout(scrollToCurrentIfAny, 60);
    }

    function scrollToCurrentIfAny() {
        const el = qs('.lwvp-item.current', root);
        const body = qs('.lwvp-body', root);
        if (el && body) {
            const top = el.offsetTop - body.clientHeight * 0.35;
            body.scrollTop = Math.max(0, top);
        }
    }

    function render() {
        const tab = STATUS_TABS.find(t => t.key === store.activeTabKey) || STATUS_TABS[1];
        const tabKey = tab.key;
        const status = tab.status;

        const allItems = store.itemsByTab.get(tabKey) || [];
        const keyword = (store.keyword || "").trim().toLowerCase();
        const filtered = keyword
        ? allItems.filter(x => (x.name || "").toLowerCase().includes(keyword))
        : allItems;

        // ✅ 上下条导航列表
        store.navIds = filtered.map(x => String(x.packageId));
        store.navIndex = currentPackageId ? store.navIds.indexOf(String(currentPackageId)) : -1;
        store.navStatusForJump = (status == null ? null : Number(status));

        // ✅ 同步编辑按钮显示/隐藏
        syncEditBtnVisibility();

        const total = filtered.length;
        const pageSize = store.uiPageSize;
        const pages = Math.max(1, Math.ceil(total / pageSize));
        store.uiPage = clamp(store.uiPage, 1, pages);

        const start = (store.uiPage - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);

        const keyInfo = accessKey
        ? `key:${accessKey.slice(0,6)}…${accessKey.slice(-4)}`
      : "key:未获取";
      const keyAge = accessKeyTs ? Math.floor((Date.now() - accessKeyTs)/1000) : 0;

      root.innerHTML = `
      <div class="lwvp-card">
        <div class="lwvp-header">
          <div class="lwvp-title">
            查看态面板
            <span
              class="lwvp-key-indicator ${store.keyInvalid ? "bad" : (accessKey ? "" : "none")}"
              data-act="toggleKeyBox"
              title="点击展开/收起 access-key 设置"
            >
              ${store.keyInvalid ? "access-key：已失效" : (accessKey ? "access-key：可用/待验证" : "access-key：未获取")}
            </span>
          </div>
          <div class="lwvp-actions">
            <select class="lwvp-select" data-act="pageSize">
              ${PAGE_SIZE_OPTIONS.map(n => `<option value="${n}" ${n===pageSize?"selected":""}>${n}/页</option>`).join("")}
            </select>
            <button class="lwvp-btn" data-act="reload">刷新</button>
          </div>
        </div>

        <div class="lwvp-tabs">
          ${STATUS_TABS.map(t => {
        const c = t.status == null ? null : store.counts.get(String(t.status));
        const suffix = (typeof c === "number") ? `<small>${c}</small>` : "";
        return `<div class="lwvp-tab ${t.key===store.activeTabKey ? "active" : ""}" data-tab="${t.key}">${t.label}${suffix}</div>`;
    }).join("")}
        </div>

        <div class="lwvp-tools">
          <input class="lwvp-input" placeholder="筛选：输入名称关键字（data_seg_name）" value="${escapeHtml(store.keyword)}" />
          <button class="lwvp-btn" data-act="loadAll">${store.fetchedAllByTab.get(tabKey) ? "已全量" : "加载全部"}</button>
        </div>

        <div class="lwvp-body">
          ${store.showKeyBox ? `
          <div class="lwvp-keybox">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
              <div>
                <b>${store.keyInvalid ? "access-key 已失效" : "access-key 状态"}</b>
                <div class="lwvp-mini">
                  ${escapeHtml(keyInfo)} · 来源:${escapeHtml(store.keySource)} · 已保存:${accessKeyTs? new Date(accessKeyTs).toLocaleString() : "无"} · 约 ${keyAge}s 前
                </div>
              </div>
              <span class="lwvp-pill">${store.keyInvalid ? "需要更新" : (accessKey ? "可用/待验证" : "等待获取")}</span>
            </div>

            <div class="lwvp-row">
              <input class="lwvp-input" data-key-input placeholder="手动粘贴新的 access-key（会覆盖旧值）" />
              <button class="lwvp-btn" data-act="saveKey">更新</button>
              <button class="lwvp-btn" data-act="autoGetKey">自动获取</button>
            </div>
            <div class="lwvp-mini">
              自动获取说明：你只要刷新页面（或点“强制刷新”），页面会发起接口请求并携带 access-key；脚本会自动拦截请求头并保存。
              若过期出现 401，说明 key 失效：刷新一次通常即可抓到新 key（或手动粘贴更新）。
            </div>
          </div>
          ` : ``}

          <div class="lwvp-list">
            ${store.loading ? `<div class="lwvp-muted" style="padding:8px 2px;">正在加载…</div>` : ""}
            ${(!store.loading && total===0) ? `<div class="lwvp-muted" style="padding:8px 2px;">暂无数据 / 未加载</div>` : ""}

            ${pageItems.map(it => {
        const isCurrent = currentPackageId && String(it.packageId) === String(currentPackageId);
        return `
                <div class="lwvp-item ${isCurrent ? "current" : ""}" data-pkg="${it.packageId}" data-status="${status==null ? "" : status}">
                  <div class="lwvp-name" title="package_id=${it.packageId}">${escapeHtml(it.name)}</div>
                </div>
              `;
    }).join("")}
          </div>
        </div>

        <div class="lwvp-foot">
          <div class="lwvp-muted">
            ${total ? `共 ${total} 条 · 第 ${store.uiPage}/${pages} 页` : `未加载`}
          </div>
          <div class="lwvp-pager">
            <button class="lwvp-btn" data-act="prev">上一页</button>
            <button class="lwvp-btn" data-act="next">下一页</button>
          </div>
        </div>
      </div>
    `;

      // access-key 状态点击：展开/收起 KeyBox
      const keyToggle = qs('[data-act="toggleKeyBox"]', root);
      if (keyToggle) {
          keyToggle.addEventListener("click", (e) => {
              e.stopPropagation();
              store.showKeyBox = !store.showKeyBox;
              savePanelState();
              render();
          });
      }

      // tabs
      qsa(".lwvp-tab", root).forEach(el => {
          el.addEventListener("click", async () => {
              const k = el.getAttribute("data-tab");
              store.activeTabKey = k;
              GM_setValue(UI_KEY_ACTIVETAB, store.activeTabKey);

              store.uiPage = 1;
              savePanelState();
              render();

              try {
                  await ensureFirstPage(k);
                  setTimeout(scrollToCurrentIfAny, 60);
              } catch (e) {
                  toast(String(e.message || e), 2400);
              }
          });
      });

      // keyword
      const input = qs(".lwvp-tools .lwvp-input", root);
      if (input) {
          input.addEventListener("input", () => {
              store.keyword = input.value || "";
              store.uiPage = 1;
              savePanelState();
              render();
          });
      }

      // item click -> jump
      qsa(".lwvp-item", root).forEach(el => {
          el.addEventListener("click", () => {
              const pkg = el.getAttribute("data-pkg");
              const st = el.getAttribute("data-status");
              const desiredStatus = st === "" ? null : Number(st);

              savePanelState();
              location.href = buildViewUrlByPackageId(pkg, desiredStatus);
          });
      });

      // buttons
      qsa(".lwvp-btn", root).forEach(btn => {
          btn.addEventListener("click", async () => {
              const act = btn.getAttribute("data-act");
              if (act === "prev") {
                  store.uiPage = Math.max(1, store.uiPage - 1);
                  savePanelState();
                  render(); setTimeout(scrollToCurrentIfAny, 30);
              } else if (act === "next") {
                  store.uiPage = store.uiPage + 1;
                  savePanelState();
                  render(); setTimeout(scrollToCurrentIfAny, 30);
              } else if (act === "loadAll") {
                  if (store.fetchedAllByTab.get(store.activeTabKey)) { toast("已是全量"); return; }
                  await fetchAll(store.activeTabKey);
                  savePanelState();
                  setTimeout(scrollToCurrentIfAny, 60);
              } else if (act === "reload") {
                  clearCache();
                  store.itemsByTab.clear();
                  store.fetchedAllByTab.clear();
                  store.counts.clear();

                  toast("缓存已清空，重新拉取中…");
                  render();

                  try {
                      if (accessKey) await ensureFirstPage(store.activeTabKey);
                      savePanelState();
                      setTimeout(scrollToCurrentIfAny, 60);
                  } catch (e) {
                      toast(String(e.message||e), 2600);
                  }
              } else if (act === "saveKey") {
                  const kInput = qs('[data-key-input]', root);
                  const val = (kInput && kInput.value || "").trim();
                  if (!val) { toast("access-key 不能为空"); return; }
                  if (setAccessKey(val, "manual")) {
                      try { await ensureFirstPage(store.activeTabKey); } catch (e) { toast(String(e.message||e), 2600); }
                      savePanelState();
                      render();
                  }
              } else if (act === "autoGetKey") {
                  // 不刷新：提示用户触发一次接口请求即可（切换标注点/翻页/点任意条目）
                  // 同时尝试从 storage/cookie 兜底提取一次
                  try {
                      const stKey = tryFindKeyFromStorage();
                      if (stKey) {
                          setAccessKey(stKey, "auto(storage)");
                          try { await ensureFirstPage(store.activeTabKey); } catch {}
                          render();
                          return;
                      }
                  } catch {}

                  toast("已开启自动获取：请在页面做一次会请求接口的操作（如切换条目/翻页/切换tab），脚本将自动捕获 access-key", 2600);
              }
          });
      });

      // pageSize dropdown
      const sel = qs('select[data-act="pageSize"]', root);
      if (sel) {
          sel.addEventListener("change", () => {
              const v = Number(sel.value);
              if (!PAGE_SIZE_OPTIONS.includes(v)) return;
              store.uiPageSize = v;
              GM_setValue(UI_KEY_PAGESIZE, store.uiPageSize);
              store.uiPage = 1;
              savePanelState();
              render();
              setTimeout(scrollToCurrentIfAny, 30);
          });
      }

      ensureToggleButton();
      if (store.uiVisible) setTimeout(scrollToCurrentIfAny, 60);
  }

    /** ---------------------------
   *  14) 初始化
   * --------------------------- */

    (async () => {
        // 如果是从编辑态回退来的提示
        const msg = url.searchParams.get("lwvp_msg");
        if (msg === "claimed") {
            toast("该题已经被其他人领取，已回到查看状态", 2600);
            url.searchParams.delete("lwvp_msg");
            history.replaceState({}, "", url.toString());
        }

        if (!PAGE_SIZE_OPTIONS.includes(store.uiPageSize)) store.uiPageSize = 20;

        render();
        root.classList.toggle("lwvp-hidden", !store.uiVisible);

        try {
            if (accessKey) await ensureFirstPage(store.activeTabKey);
        } catch (e) {
            toast(String(e.message || e), 2400);
        }

        savePanelState();
        if (store.uiVisible) setTimeout(scrollToCurrentIfAny, 120);
    })();

})();