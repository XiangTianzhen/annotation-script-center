(function () {
  const ROOT_ATTR = "data-asr-edge-databaker-group-export";
  const STYLE_ID = "asr-edge-databaker-group-export-style";
  const STATUS_POLL_MS = 1000;
  const QUERY_API_PATH = "/cms/tbAudioUserTask/queryByCondition";
  const DEFAULT_PAGE_SIZE = 100;
  const MAX_PAGES = 10000;

  const REQUEST_HEADERS = {
    accept: "application/json, text/plain, */*",
    language: "zh",
    "cache-control": "no-cache",
    pragma: "no-cache",
  };

  const CSV_COLUMNS = [
    { title: "采集ID", keys: ["collectId"] },
    { title: "任务ID", keys: ["taskId"] },
    { title: "项目名称", keys: ["projectName"] },
    { title: "任务名称", keys: ["taskName"] },
    { title: "团队名称", keys: ["teamName"] },
    { title: "采集人", keys: ["userName", "collectName"] },
    { title: "手机号", keys: ["mobile"] },
    { title: "年龄", keys: ["collectAge"] },
    { title: "性别", keys: ["collectSexName", "collectSex"] },
    { title: "省", keys: ["collectProvince"] },
    { title: "市", keys: ["collectCity"] },
    { title: "区县", keys: ["collectTown"] },
    { title: "文本编号", keys: ["textNumber"] },
    { title: "文本数量", keys: ["audioTextNum"] },
    { title: "上传音频数", keys: ["uploadAudioNum"] },
    { title: "状态", keys: ["statusName", "status"] },
    { title: "驳回类型", keys: ["noPassType"] },
    { title: "质检人", keys: ["checkName"] },
    { title: "质检时间", keys: ["checkTime"] },
    { title: "提交时间", keys: ["submitTime"] },
    { title: "更新时间", keys: ["updateTime"] },
    { title: "有效总时长", keys: ["effectiveTotalTime"] },
    { title: "有效合格时长", keys: ["effectivePassTotalTime"] },
    { title: "有效不合格时长", keys: ["effectiveNoPassTotalTime"] },
    { title: "文件名", keys: ["fileName"] },
    { title: "段编号", keys: ["segmentNumber"] },
    { title: "手机型号", keys: ["phoneModel"] },
    { title: "版本", keys: ["version"] },
    { title: "质检驳回原因", keys: ["checkRejectReason"] },
    { title: "验收驳回原因", keys: ["acceptCheckRejectReason"] },
  ];

  const RAW_JSON_COLUMN = "原始JSON";
  const SENSITIVE_KEYWORDS = ["token", "cookie", "authorization", "signature", "ossaccesskeyid"];

  let root = null;
  let statusNode = null;
  let exportButton = null;
  let evaluating = false;
  let pending = false;
  let observer = null;
  let observerTimer = null;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function parseHashRoute() {
    const hash = String(location.hash || "");
    const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
    const pathAndQuery = cleaned.startsWith("/") ? cleaned : "/" + cleaned;
    const queryIndex = pathAndQuery.indexOf("?");
    const pathname = queryIndex >= 0 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery;
    const queryString = queryIndex >= 0 ? pathAndQuery.slice(queryIndex + 1) : "";
    return {
      pathname: pathname,
      params: new URLSearchParams(queryString),
    };
  }

  function isGroupDetailPage() {
    const route = parseHashRoute();
    return route.pathname.indexOf("/group/detail") >= 0;
  }

  function readTaskId() {
    const route = parseHashRoute();
    return normalizeText(route.params.get("taskId"));
  }

  async function loadScriptEnabled() {
    const storage = globalThis.ASREdgeStorage || null;
    if (!storage || typeof storage.getSettings !== "function") {
      return true;
    }
    try {
      const settings = await storage.getSettings();
      const platformEnabled = settings?.platforms?.dataBaker?.enabled !== false;
      const scriptEnabled =
        settings?.platforms?.dataBaker?.scripts?.roundOneQuality?.enabled !== false;
      return platformEnabled && scriptEnabled;
    } catch (error) {
      return true;
    }
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "[" + ROOT_ATTR + "] {",
      "  position: fixed;",
      "  right: 16px;",
      "  bottom: 20px;",
      "  z-index: 2147483647;",
      "  min-width: 220px;",
      "  max-width: 360px;",
      "  padding: 10px 12px;",
      "  border-radius: 8px;",
      "  border: 1px solid #bfdbfe;",
      "  background: #f8fbff;",
      "  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);",
      "  font-size: 12px;",
      "  color: #1f2937;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-export-title {",
      "  margin: 0 0 6px;",
      "  font-weight: 700;",
      "  color: #1d4ed8;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-export-btn {",
      "  width: 100%;",
      "  height: 30px;",
      "  border-radius: 6px;",
      "  border: 1px solid #1d4ed8;",
      "  background: #1d4ed8;",
      "  color: #fff;",
      "  cursor: pointer;",
      "  font-weight: 700;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-export-btn:disabled {",
      "  opacity: 0.65;",
      "  cursor: not-allowed;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-export-status {",
      "  margin-top: 8px;",
      "  min-height: 16px;",
      "  color: #475569;",
      "  white-space: pre-wrap;",
      "  overflow-wrap: anywhere;",
      "}",
      "[" + ROOT_ATTR + "] .asr-edge-db-export-status[data-tone='error'] { color: #b91c1c; }",
      "[" + ROOT_ATTR + "] .asr-edge-db-export-status[data-tone='success'] { color: #047857; }",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function setStatus(message, tone) {
    if (!statusNode) {
      return;
    }
    statusNode.textContent = String(message || "");
    statusNode.setAttribute("data-tone", String(tone || "info"));
  }

  function toPositiveInt(value, fallbackValue) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallbackValue;
    }
    return Math.floor(parsed);
  }

  function buildQueryParams(taskId, pageNum, pageSize) {
    const params = new URLSearchParams();
    params.set("collectName", "");
    params.set("mobile", "");
    params.set("status", "");
    params.set("startTime", "");
    params.set("endTime", "");
    params.set("retrieveStatus", "");
    params.set("forceRecover", "");
    params.set("textNumber", "");
    params.set("checkName", "");
    params.set("acceptCheckName", "");
    params.set("noPassType", "");
    params.set("taskId", taskId);
    params.set("pageSize", String(pageSize));
    params.set("pageNum", String(pageNum));
    params.set("submitOrder", "");
    return params;
  }

  function buildPageUrl(taskId, pageNum, pageSize) {
    const params = buildQueryParams(taskId, pageNum, pageSize);
    return QUERY_API_PATH + "?" + params.toString();
  }

  function isLikelyLoginExpired(message) {
    const text = normalizeText(message).toLowerCase();
    if (!text) {
      return false;
    }
    return (
      text.indexOf("登录") >= 0 ||
      text.indexOf("token") >= 0 ||
      text.indexOf("unauthorized") >= 0 ||
      text.indexOf("forbidden") >= 0 ||
      text.indexOf("请先登录") >= 0
    );
  }

  async function fetchQueryPage(taskId, pageNum, pageSize) {
    const response = await fetch(buildPageUrl(taskId, pageNum, pageSize), {
      method: "GET",
      credentials: "include",
      headers: REQUEST_HEADERS,
      cache: "no-store",
    });
    const body = await response.json().catch(function () {
      return null;
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("请求失败，登录态可能已失效，请重新登录后重试。");
      }
      throw new Error("请求失败（HTTP " + String(response.status) + "）。");
    }

    const success = body?.success === true || Number(body?.code) === 0;
    if (!success || !body || typeof body !== "object") {
      const message = normalizeText(body?.message || body?.msg || "");
      if (isLikelyLoginExpired(message)) {
        throw new Error("导出失败：登录态可能已失效，请刷新页面后重新登录。");
      }
      throw new Error(message || "导出失败：接口返回异常。");
    }

    const data = body.data || {};
    const list = Array.isArray(data.list) ? data.list : [];
    return {
      total: toPositiveInt(data.total, 0),
      pages: toPositiveInt(data.pages, 0),
      pageNum: toPositiveInt(data.pageNum, pageNum),
      pageSize: toPositiveInt(data.pageSize, pageSize),
      list: list,
    };
  }

  function redactUrlString(value) {
    const text = normalizeText(value);
    if (!/^https?:\/\//i.test(text)) {
      return value;
    }
    try {
      const parsed = new URL(text);
      return "[url:" + parsed.hostname + "]";
    } catch (error) {
      return "[url-redacted]";
    }
  }

  function shouldDropKey(key) {
    const lowerKey = normalizeText(key).toLowerCase();
    if (!lowerKey) {
      return false;
    }
    for (let index = 0; index < SENSITIVE_KEYWORDS.length; index += 1) {
      if (lowerKey.indexOf(SENSITIVE_KEYWORDS[index]) >= 0) {
        return true;
      }
    }
    return false;
  }

  function sanitizeValue(value, key) {
    if (shouldDropKey(key)) {
      return undefined;
    }

    if (Array.isArray(value)) {
      const result = [];
      for (let index = 0; index < value.length; index += 1) {
        const sanitized = sanitizeValue(value[index], key);
        if (sanitized !== undefined) {
          result.push(sanitized);
        }
      }
      return result;
    }

    if (value && typeof value === "object") {
      const output = {};
      const objectKeys = Object.keys(value);
      for (let index = 0; index < objectKeys.length; index += 1) {
        const objectKey = objectKeys[index];
        const sanitized = sanitizeValue(value[objectKey], objectKey);
        if (sanitized !== undefined) {
          output[objectKey] = sanitized;
        }
      }
      return output;
    }

    if (typeof value === "string") {
      return redactUrlString(value);
    }

    return value;
  }

  function sanitizeRawJson(row) {
    try {
      return JSON.stringify(sanitizeValue(row, "") || {});
    } catch (error) {
      return "{}";
    }
  }

  function readFieldValue(row, keys) {
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const value = row ? row[key] : "";
      if (value !== undefined && value !== null && String(value) !== "") {
        if (typeof value === "string") {
          return redactUrlString(value);
        }
        return value;
      }
    }
    return "";
  }

  function toCsvCell(value) {
    if (value === undefined || value === null) {
      return "";
    }
    const text = String(value);
    if (text.indexOf("\"") >= 0 || text.indexOf(",") >= 0 || text.indexOf("\n") >= 0) {
      return "\"" + text.replace(/\"/g, "\"\"") + "\"";
    }
    return text;
  }

  function buildCsv(rows) {
    const headers = CSV_COLUMNS.map(function (column) {
      return column.title;
    }).concat([RAW_JSON_COLUMN]);
    const lines = [headers.map(toCsvCell).join(",")];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] || {};
      const values = CSV_COLUMNS.map(function (column) {
        return readFieldValue(row, column.keys);
      });
      values.push(sanitizeRawJson(row));
      lines.push(values.map(toCsvCell).join(","));
    }

    return lines.join("\n");
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatTimeStamp(date) {
    return (
      String(date.getFullYear()) +
      pad2(date.getMonth() + 1) +
      pad2(date.getDate()) +
      "-" +
      pad2(date.getHours()) +
      pad2(date.getMinutes()) +
      pad2(date.getSeconds())
    );
  }

  function triggerCsvDownload(fileName, csvText) {
    const withBom = "\uFEFF" + String(csvText || "");
    const blob = new Blob([withBom], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  async function exportByTaskId(taskId) {
    const pageSize = DEFAULT_PAGE_SIZE;
    const firstPage = await fetchQueryPage(taskId, 1, pageSize);
    const rows = firstPage.list.slice();
    const total = toPositiveInt(firstPage.total, rows.length);

    let pages = toPositiveInt(firstPage.pages, 0);
    if (pages <= 0) {
      if (total > 0) {
        pages = Math.ceil(total / pageSize);
      } else {
        pages = rows.length > 0 ? 1 : 0;
      }
    }
    pages = Math.min(Math.max(pages, rows.length > 0 ? 1 : 0), MAX_PAGES);

    setStatus(
      "正在导出：第 1 / " +
        String(Math.max(pages, 1)) +
        " 页，已获取 " +
        String(rows.length) +
        " / " +
        String(total) +
        " 条",
      "info"
    );

    if (pages >= MAX_PAGES) {
      setStatus(
        "正在导出：页数超过上限，已按 " + String(MAX_PAGES) + " 页截断继续处理。",
        "info"
      );
    }

    for (let pageNum = 2; pageNum <= pages; pageNum += 1) {
      const pageData = await fetchQueryPage(taskId, pageNum, pageSize);
      if (Array.isArray(pageData.list) && pageData.list.length > 0) {
        rows.push.apply(rows, pageData.list);
      }

      setStatus(
        "正在导出：第 " +
          String(pageNum) +
          " / " +
          String(pages) +
          " 页，已获取 " +
          String(rows.length) +
          " / " +
          String(total) +
          " 条",
        "info"
      );
    }

    return {
      total: total,
      rows: rows,
    };
  }

  async function handleExportClick() {
    const taskId = readTaskId();
    if (!taskId) {
      setStatus("未找到 taskId，无法导出。", "error");
      return;
    }

    exportButton.disabled = true;
    setStatus("正在导出：准备拉取第 1 页。", "info");

    try {
      const startedAt = Date.now();
      const result = await exportByTaskId(taskId);
      const csv = buildCsv(result.rows);
      const fileName = "data-baker-task-" + taskId + "-" + formatTimeStamp(new Date()) + ".csv";
      triggerCsvDownload(fileName, csv);

      const durationMs = Date.now() - startedAt;
      setStatus(
        "已导出 " +
          String(result.rows.length) +
          " 条，已下载 CSV。耗时 " +
          String(durationMs) +
          " ms。",
        "success"
      );
    } catch (error) {
      const message = normalizeText(error?.message || "导出失败，请稍后重试。");
      setStatus(message, "error");
    } finally {
      exportButton.disabled = false;
    }
  }

  function ensureMounted() {
    if (root && document.documentElement.contains(root)) {
      return root;
    }

    ensureStyle();
    root = document.createElement("div");
    root.setAttribute(ROOT_ATTR, "true");

    const title = document.createElement("div");
    title.className = "asr-edge-db-export-title";
    title.textContent = "DataBaker 任务总表导出";

    exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.className = "asr-edge-db-export-btn";
    exportButton.textContent = "导出数据总表";
    exportButton.addEventListener("click", handleExportClick);

    statusNode = document.createElement("div");
    statusNode.className = "asr-edge-db-export-status";
    statusNode.textContent = "按 taskId 全量翻页导出 CSV（同源登录态）。";

    root.appendChild(title);
    root.appendChild(exportButton);
    root.appendChild(statusNode);
    document.documentElement.appendChild(root);
    return root;
  }

  function remove() {
    if (observerTimer) {
      window.clearTimeout(observerTimer);
      observerTimer = null;
    }
    if (root) {
      root.remove();
    }
    root = null;
    statusNode = null;
    exportButton = null;
  }

  async function evaluatePage() {
    if (evaluating) {
      pending = true;
      return;
    }
    evaluating = true;
    try {
      if (!isGroupDetailPage()) {
        remove();
        return;
      }
      const enabled = await loadScriptEnabled();
      if (!enabled) {
        remove();
        return;
      }
      const taskId = readTaskId();
      ensureMounted();
      if (!taskId) {
        setStatus("当前页面缺少 taskId，无法导出。", "error");
      } else if (exportButton && exportButton.disabled) {
        return;
      } else {
        setStatus("taskId: " + taskId, "info");
      }
    } finally {
      evaluating = false;
      if (pending) {
        pending = false;
        window.setTimeout(function () {
          void evaluatePage();
        }, 0);
      }
    }
  }

  function scheduleEvaluate() {
    void evaluatePage();
  }

  function installWatchers() {
    window.addEventListener("hashchange", scheduleEvaluate);
    window.addEventListener("popstate", scheduleEvaluate);
    window.setInterval(scheduleEvaluate, STATUS_POLL_MS);
    observer = new MutationObserver(function () {
      if (observerTimer) {
        window.clearTimeout(observerTimer);
      }
      observerTimer = window.setTimeout(scheduleEvaluate, 160);
    });
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleEvaluate, { once: true });
  } else {
    scheduleEvaluate();
  }
  installWatchers();
})();
