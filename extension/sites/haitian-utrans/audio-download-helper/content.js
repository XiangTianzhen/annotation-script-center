(function () {
  if (globalThis.ASREdgeHaitianUtransAudioDownloadHelper) {
    if (typeof module !== "undefined" && module.exports) {
      module.exports = globalThis.ASREdgeHaitianUtransAudioDownloadHelper;
    }
    return;
  }

  const STYLE_ID = "asc-haitian-utrans-audio-download-style";
  const ROOT_ATTR = "data-asc-haitian-utrans-audio-download";
  const BUTTON_ATTR = "data-asc-haitian-utrans-audio-download-button";
  const TITLE_ATTR = "data-asc-haitian-utrans-audio-download-title";
  const STATUS_ATTR = "data-asc-haitian-utrans-audio-download-status";
  const BRIDGE_SCRIPT_ID = "asc-haitian-utrans-audio-download-bridge";
  const REQUEST_EVENT = "asc-haitian-utrans-download-request";
  const RESPONSE_EVENT = "asc-haitian-utrans-download-response";
  const INSTALL_FLAG = "__ASREdgeHaitianUtransAudioDownloadHelperInstalled";
  const GLOBAL_KEY = "ASREdgeHaitianUtransAudioDownloadHelper";
  const ROUTE_CHECK_INTERVAL_MS = 1500;

  let rootNode = null;
  let buttonNode = null;
  let titleNode = null;
  let statusNode = null;
  let routeTimer = null;
  let activeRequestId = "";

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function ensureWavFileName(value, fallbackAudioId) {
    const fallbackId = normalizeText(fallbackAudioId);
    const raw = normalizeText(value)
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ");
    const baseName = raw || (fallbackId ? "audio-" + fallbackId : "audio");
    if (/\.wav$/i.test(baseName)) {
      return baseName;
    }
    return baseName.replace(/\.[a-z0-9]{1,8}$/i, "") + ".wav";
  }

  function parseUrl(input) {
    try {
      return new URL(String(input || ""), globalThis.location?.href || "http://127.0.0.1/");
    } catch (_error) {
      return null;
    }
  }

  function isTargetPageUrl(input) {
    const url = parseUrl(input);
    if (!url) {
      return false;
    }
    if (!/\/index\.php$/i.test(url.pathname || "")) {
      return false;
    }
    return (
      normalizeText(url.searchParams.get("d")).toLowerCase() === "worker" &&
      normalizeText(url.searchParams.get("c")).toLowerCase() === "work"
    );
  }

  function extractIdFromCandidate(input, key) {
    const text = normalizeText(input);
    if (!text) {
      return "";
    }
    const fromUrl = parseUrl(text);
    if (fromUrl) {
      const direct = normalizeText(fromUrl.searchParams.get(key));
      if (direct) {
        return direct;
      }
    }
    const match = text.match(new RegExp(key + "=([^&#\\s\"']+)", "i"));
    return match ? normalizeText(match[1]) : "";
  }

  function extractVisibleFileName(visibleTexts) {
    const candidates = Array.isArray(visibleTexts) ? visibleTexts : [];
    for (let index = 0; index < candidates.length; index += 1) {
      const text = normalizeText(candidates[index]);
      if (!text) {
        continue;
      }
      const directMatch = text.match(/([^\/\\\s:："'<>|?*]+\.(?:wav|mp3|ogg|m4a|aac|flac))/i);
      if (directMatch) {
        return ensureWavFileName(directMatch[1], "");
      }
    }
    return "";
  }

  function buildDownloadUrl(origin, projectId, batchId, audioId) {
    const baseOrigin = normalizeText(origin);
    const project = normalizeText(projectId);
    const batch = normalizeText(batchId);
    const audio = normalizeText(audioId);
    if (!baseOrigin || !project || !batch || !audio) {
      return "";
    }
    const url = new URL("/index.php", baseOrigin);
    url.searchParams.set("d", "worker");
    url.searchParams.set("c", "audio");
    url.searchParams.set("m", "audio_path");
    url.searchParams.set("projectid", project);
    url.searchParams.set("batchid", batch);
    url.searchParams.set("audioid", audio);
    return String(url);
  }

  function readFirstValue(map, keys) {
    const source = map && typeof map === "object" ? map : {};
    for (let index = 0; index < keys.length; index += 1) {
      const key = String(keys[index] || "").toLowerCase();
      const value = normalizeText(source[key]);
      if (value) {
        return value;
      }
    }
    return "";
  }

  function resolveAudioRequestContext(options) {
    const source = options && typeof options === "object" ? options : {};
    const url = parseUrl(source.href);
    if (!url || !isTargetPageUrl(url.href)) {
      return {
        ok: false,
        reason: "not-target-page",
        message: "当前不是 uTrans 任务详情页。",
      };
    }

    const hiddenFields = source.hiddenFields && typeof source.hiddenFields === "object" ? source.hiddenFields : {};
    const audioCandidates = Array.isArray(source.audioCandidates) ? source.audioCandidates : [];
    const visibleTexts = Array.isArray(source.visibleTexts) ? source.visibleTexts : [];

    const projectId =
      normalizeText(url.searchParams.get("project_id")) ||
      normalizeText(url.searchParams.get("projectid")) ||
      readFirstValue(hiddenFields, ["projectid", "project_id"]);
    const batchId =
      readFirstValue(hiddenFields, ["batchid", "batch_id"]) ||
      audioCandidates.map(function (item) {
        return extractIdFromCandidate(item, "batchid");
      }).find(Boolean) ||
      normalizeText(url.searchParams.get("batchid"));
    const audioId =
      readFirstValue(hiddenFields, ["audioid", "audio_id"]) ||
      audioCandidates.map(function (item) {
        return extractIdFromCandidate(item, "audioid");
      }).find(Boolean) ||
      normalizeText(url.searchParams.get("audioid"));

    if (!projectId || !batchId || !audioId) {
      return {
        ok: false,
        reason: "missing-params",
        message: "未能从当前页面取到完整音频参数，请确认页面已加载到任务详情。",
      };
    }

    const fileName =
      extractVisibleFileName(visibleTexts) ||
      ensureWavFileName("", audioId);
    const downloadUrl = buildDownloadUrl(url.origin, projectId, batchId, audioId);
    if (!downloadUrl) {
      return {
        ok: false,
        reason: "invalid-download-url",
        message: "当前音频下载地址组装失败。",
      };
    }

    return {
      ok: true,
      projectId: projectId,
      batchId: batchId,
      audioId: audioId,
      fileName: fileName,
      downloadUrl: downloadUrl,
    };
  }

  function collectHiddenFields(doc) {
    const documentLike = doc || globalThis.document;
    const result = {};
    if (!documentLike || typeof documentLike.querySelectorAll !== "function") {
      return result;
    }
    const nodes = documentLike.querySelectorAll("input[type='hidden'], input[name], input[id]");
    Array.from(nodes || []).forEach(function (node) {
      const value = normalizeText(node?.value);
      if (!value) {
        return;
      }
      const keys = [
        normalizeText(node?.name).toLowerCase(),
        normalizeText(node?.id).toLowerCase(),
        normalizeText(node?.getAttribute?.("data-name")).toLowerCase(),
      ].filter(Boolean);
      keys.forEach(function (key) {
        if (!result[key]) {
          result[key] = value;
        }
      });
    });
    return result;
  }

  function collectAudioCandidates(doc) {
    const documentLike = doc || globalThis.document;
    if (!documentLike || typeof documentLike.querySelectorAll !== "function") {
      return [];
    }
    const result = [];
    const selectors = [
      "a[href*='c=audio'][href*='audio_path']",
      "audio[src]",
      "source[src]",
      "[data-audioid]",
      "[data-audio-id]",
      "[onclick*='audio_path']",
    ];
    selectors.forEach(function (selector) {
      Array.from(documentLike.querySelectorAll(selector) || []).forEach(function (node) {
        const texts = [
          normalizeText(node?.href),
          normalizeText(node?.src),
          normalizeText(node?.getAttribute?.("data-audio-url")),
          normalizeText(node?.getAttribute?.("data-url")),
          normalizeText(node?.getAttribute?.("onclick")),
          normalizeText(node?.getAttribute?.("data-audioid")),
          normalizeText(node?.getAttribute?.("data-audio-id")),
        ].filter(Boolean);
        texts.forEach(function (text) {
          result.push(text);
        });
      });
    });
    return result;
  }

  function collectVisibleTexts(doc) {
    const documentLike = doc || globalThis.document;
    if (!documentLike) {
      return [];
    }
    const texts = [];
    const titleText = normalizeText(documentLike.title);
    if (titleText) {
      texts.push(titleText);
    }
    const bodyText = normalizeText(documentLike.body?.innerText || documentLike.body?.textContent || "");
    if (bodyText) {
      bodyText.split(/\r?\n/).forEach(function (line) {
        const normalized = normalizeText(line);
        if (normalized) {
          texts.push(normalized);
        }
      });
    }
    return texts;
  }

  function ensureStyle() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "[" + ROOT_ATTR + "]{position:fixed;right:24px;bottom:24px;z-index:2147483000;width:220px;padding:12px 14px;border:1px solid rgba(15,23,42,.14);border-radius:14px;background:rgba(255,255,255,.97);box-shadow:0 14px 32px rgba(15,23,42,.18);font:12px/1.5 'Microsoft YaHei','PingFang SC',sans-serif;color:#1f2937;}",
      "[" + TITLE_ATTR + "]{font-size:13px;font-weight:700;color:#0f172a;}",
      "[" + BUTTON_ATTR + "]{width:100%;margin-top:10px;padding:9px 12px;border:0;border-radius:10px;background:#0f766e;color:#fff;font:600 12px/1.2 'Microsoft YaHei','PingFang SC',sans-serif;cursor:pointer;}",
      "[" + BUTTON_ATTR + "]:disabled{cursor:not-allowed;opacity:.6;}",
      "[" + STATUS_ATTR + "]{margin-top:8px;color:#475569;white-space:pre-wrap;word-break:break-word;}",
      "[" + STATUS_ATTR + "][data-tone='error']{color:#b91c1c;}",
      "[" + STATUS_ATTR + "][data-tone='success']{color:#0f766e;}",
    ].join("");
    (document.head || document.documentElement).appendChild(style);
  }

  function setStatus(message, tone) {
    if (!(statusNode instanceof HTMLElement)) {
      return;
    }
    statusNode.textContent = normalizeText(message) || "准备就绪。";
    if (tone) {
      statusNode.setAttribute("data-tone", tone);
    } else {
      statusNode.removeAttribute("data-tone");
    }
  }

  function setDownloading(isDownloading) {
    if (!(buttonNode instanceof HTMLButtonElement)) {
      return;
    }
    buttonNode.disabled = isDownloading === true;
    buttonNode.textContent = isDownloading === true ? "正在下载..." : "下载当前音频";
  }

  function ensureBridge() {
    if (typeof document === "undefined") {
      return false;
    }
    if (document.getElementById(BRIDGE_SCRIPT_ID)) {
      return true;
    }
    const script = document.createElement("script");
    script.id = BRIDGE_SCRIPT_ID;
    script.textContent = [
      "(function(){",
      "if(window.__ascHaitianUtransDownloadBridgeInstalled){return;}",
      "window.__ascHaitianUtransDownloadBridgeInstalled=true;",
      "document.addEventListener(" + JSON.stringify(REQUEST_EVENT) + ",async function(event){",
      "var detail=event&&event.detail&&typeof event.detail==='object'?event.detail:{};",
      "var requestId=String(detail.requestId||'');",
      "var downloadUrl=String(detail.downloadUrl||'');",
      "var fileName=String(detail.fileName||'audio.wav');",
      "function emit(payload){document.dispatchEvent(new CustomEvent(" + JSON.stringify(RESPONSE_EVENT) + ",{detail:Object.assign({requestId:requestId},payload||{})}));}",
      "if(!requestId||!downloadUrl){emit({ok:false,message:'页内下载参数缺失。'});return;}",
      "try{",
      "var response=await fetch(downloadUrl,{credentials:'include',cache:'no-store'});",
      "if(!response||!response.ok){emit({ok:false,message:'下载请求失败，状态 '+String(response&&response.status||'unknown')+'。'});return;}",
      "var buffer=await response.arrayBuffer();",
      "if(!buffer||buffer.byteLength<=0){emit({ok:false,message:'音频响应为空，可能是登录态失效或参数不完整。'});return;}",
      "var blob=new Blob([buffer],{type:'audio/wav'});",
      "var objectUrl=URL.createObjectURL(blob);",
      "var link=document.createElement('a');",
      "link.href=objectUrl;",
      "link.download=fileName;",
      "link.style.display='none';",
      "(document.body||document.documentElement).appendChild(link);",
      "link.click();",
      "setTimeout(function(){if(link.parentNode){link.parentNode.removeChild(link);}URL.revokeObjectURL(objectUrl);},0);",
      "emit({ok:true,message:'已开始下载 '+fileName+'。'});",
      "}catch(error){emit({ok:false,message:'下载失败：'+String(error&&error.message||error||'unknown')});}",
      "});",
      "})();",
    ].join("");
    (document.documentElement || document.head || document.body).appendChild(script);
    return true;
  }

  function createPanel() {
    if (typeof document === "undefined" || !document.body) {
      return null;
    }
    ensureStyle();
    if (rootNode instanceof HTMLElement && rootNode.isConnected) {
      return rootNode;
    }
    rootNode = document.createElement("section");
    rootNode.setAttribute(ROOT_ATTR, "true");

    titleNode = document.createElement("div");
    titleNode.setAttribute(TITLE_ATTR, "true");
    titleNode.textContent = "音频下载";

    buttonNode = document.createElement("button");
    buttonNode.type = "button";
    buttonNode.setAttribute(BUTTON_ATTR, "true");
    buttonNode.textContent = "下载当前音频";
    buttonNode.addEventListener("click", function () {
      void handleDownloadClick();
    });

    statusNode = document.createElement("div");
    statusNode.setAttribute(STATUS_ATTR, "true");
    statusNode.textContent = "准备就绪。";

    rootNode.appendChild(titleNode);
    rootNode.appendChild(buttonNode);
    rootNode.appendChild(statusNode);
    document.body.appendChild(rootNode);
    return rootNode;
  }

  function destroyPanel() {
    if (rootNode && rootNode.parentNode) {
      rootNode.parentNode.removeChild(rootNode);
    }
    rootNode = null;
    buttonNode = null;
    titleNode = null;
    statusNode = null;
    activeRequestId = "";
  }

  function syncPanel() {
    if (!isTargetPageUrl(globalThis.location?.href || "")) {
      destroyPanel();
      return false;
    }
    createPanel();
    const context = resolveAudioRequestContext({
      href: globalThis.location?.href || "",
      hiddenFields: collectHiddenFields(document),
      audioCandidates: collectAudioCandidates(document),
      visibleTexts: collectVisibleTexts(document),
    });
    if (!(titleNode instanceof HTMLElement)) {
      return true;
    }
    if (context.ok) {
      titleNode.textContent = "音频下载 · " + context.fileName;
      if (!activeRequestId) {
        setStatus("点击按钮下载当前任务音频。", "");
      }
    } else {
      titleNode.textContent = "音频下载";
      if (!activeRequestId) {
        setStatus(context.message, "error");
      }
    }
    return true;
  }

  function waitForBridgeResult(requestId) {
    return new Promise(function (resolve) {
      function onResponse(event) {
        const detail = event && event.detail && typeof event.detail === "object" ? event.detail : {};
        if (String(detail.requestId || "") !== requestId) {
          return;
        }
        document.removeEventListener(RESPONSE_EVENT, onResponse, true);
        resolve(detail);
      }
      document.addEventListener(RESPONSE_EVENT, onResponse, true);
    });
  }

  async function handleDownloadClick() {
    const context = resolveAudioRequestContext({
      href: globalThis.location?.href || "",
      hiddenFields: collectHiddenFields(document),
      audioCandidates: collectAudioCandidates(document),
      visibleTexts: collectVisibleTexts(document),
    });
    if (!context.ok) {
      setStatus(context.message, "error");
      return;
    }
    if (!ensureBridge()) {
      setStatus("页内下载桥接初始化失败。", "error");
      return;
    }

    activeRequestId = "utrans-" + Date.now() + "-" + Math.random().toString(16).slice(2, 8);
    setDownloading(true);
    setStatus("正在请求当前音频...", "");

    const resultPromise = waitForBridgeResult(activeRequestId);
    document.dispatchEvent(
      new CustomEvent(REQUEST_EVENT, {
        detail: {
          requestId: activeRequestId,
          downloadUrl: context.downloadUrl,
          fileName: context.fileName,
        },
      })
    );

    const result = await resultPromise;
    activeRequestId = "";
    setDownloading(false);
    setStatus(
      normalizeText(result.message) || (result.ok ? "已开始下载。" : "下载失败。"),
      result.ok ? "success" : "error"
    );
  }

  function startRouteWatcher() {
    if (routeTimer || typeof window === "undefined" || !window) {
      return;
    }
    routeTimer = window.setInterval(function () {
      syncPanel();
    }, ROUTE_CHECK_INTERVAL_MS);
  }

  const api = {
    __testOnly: {
      isTargetPageUrl: isTargetPageUrl,
      resolveAudioRequestContext: resolveAudioRequestContext,
      extractVisibleFileName: extractVisibleFileName,
      ensureWavFileName: ensureWavFileName,
      buildDownloadUrl: buildDownloadUrl,
    },
  };

  globalThis[GLOBAL_KEY] = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (
    typeof window !== "undefined" &&
    window &&
    typeof document !== "undefined" &&
    globalThis[INSTALL_FLAG] !== true
  ) {
    globalThis[INSTALL_FLAG] = true;
    syncPanel();
    startRouteWatcher();
  }
})();
