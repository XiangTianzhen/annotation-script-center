(function () {
  const ROOT_ATTR = "data-asr-edge-databaker-group-export";
  const STYLE_ID = "asr-edge-databaker-group-export-style";
  const STATUS_POLL_MS = 1000;
  const SOURCE = "ASR_EDGE_DATABAKER_ROUND_ONE_QUALITY_PAGE";
  const GROUP_MESSAGE_TYPE = "DATABAKER_ROUND_ONE_QUALITY_GROUP_QUERY_RESPONSE";
  const GROUP_QUERY_PATH = "/cms/tbAudioUserTask/queryByCondition";
  const WAIT_RESPONSE_TIMEOUT_MS = 15000;
  const PENDING_STORAGE_KEY = "ASR_EDGE_DATABAKER_GROUP_EXPORT_PENDING";
  const PENDING_MAX_AGE_MS = 60000;

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
  let exportInProgress = false;
  let resumeStarted = false;
  let waiter = null;

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function toPositiveInt(value, fallbackValue) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallbackValue;
    }
    return Math.floor(parsed);
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

  function isElementVisible(element) {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isElementDisabled(element) {
    if (!element) {
      return true;
    }
    const anyElement = element;
    if (anyElement.disabled === true) {
      return true;
    }
    if (normalizeText(element.getAttribute("aria-disabled")) === "true") {
      return true;
    }
    const className = normalizeText(element.className || "");
    return className.indexOf("is-disabled") >= 0 || className.indexOf("disabled") >= 0;
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

  function extractPayloadTaskId(payload) {
    return normalizeText(
      payload?.params?.taskId ||
        payload?.records?.[0]?.taskId ||
        payload?.rawData?.taskId ||
        ""
    );
  }

  function clearWaiter() {
    if (waiter && waiter.timer) {
      window.clearTimeout(waiter.timer);
    }
    waiter = null;
  }

  function waitForGroupResponse(taskId, timeoutMs) {
    clearWaiter();

    return new Promise(function (resolve, reject) {
      const context = {
        taskId: normalizeText(taskId),
        resolve: resolve,
        reject: reject,
        timer: window.setTimeout(function () {
          if (waiter !== context) {
            return;
          }
          waiter = null;
          reject(new Error("未捕获到平台 queryByCondition 响应，请点击页面查询按钮后重试。"));
        }, Math.max(1000, Number(timeoutMs) || WAIT_RESPONSE_TIMEOUT_MS)),
      };
      waiter = context;
    });
  }

  function notifyWaiter(payload) {
    if (!waiter) {
      return;
    }

    const waitingTaskId = normalizeText(waiter.taskId);
    const payloadTaskId = extractPayloadTaskId(payload);
    if (waitingTaskId && payloadTaskId && payloadTaskId !== waitingTaskId) {
      return;
    }

    const current = waiter;
    clearWaiter();
    current.resolve(payload);
  }

  function readPendingExport() {
    try {
      const raw = sessionStorage.getItem(PENDING_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      const startedAt = Number(parsed?.startedAt || 0);
      const taskId = normalizeText(parsed?.taskId);
      const mode = normalizeText(parsed?.mode);
      if (!startedAt || !taskId || mode !== "group-export") {
        sessionStorage.removeItem(PENDING_STORAGE_KEY);
        return null;
      }
      if (Date.now() - startedAt > PENDING_MAX_AGE_MS) {
        sessionStorage.removeItem(PENDING_STORAGE_KEY);
        return null;
      }
      return {
        taskId: taskId,
        startedAt: startedAt,
      };
    } catch (error) {
      sessionStorage.removeItem(PENDING_STORAGE_KEY);
      return null;
    }
  }

  function setPendingExport(taskId) {
    try {
      sessionStorage.setItem(
        PENDING_STORAGE_KEY,
        JSON.stringify({
          taskId: normalizeText(taskId),
          startedAt: Date.now(),
          mode: "group-export",
        })
      );
    } catch (error) {
      // ignore sessionStorage write failure
    }
  }

  function clearPendingExport() {
    try {
      sessionStorage.removeItem(PENDING_STORAGE_KEY);
    } catch (error) {
      // ignore sessionStorage remove failure
    }
  }

  function clickElement(element) {
    if (!element) {
      return false;
    }

    try {
      element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
      element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      if (typeof element.click === "function") {
        element.click();
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function findQueryButton() {
    const nodes = Array.from(document.querySelectorAll("button, .el-button"));
    let best = null;

    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const text = normalizeText(node.textContent || "").replace(/\s+/g, "");
      if (text !== "查询") {
        continue;
      }
      if (!isElementVisible(node) || isElementDisabled(node)) {
        continue;
      }

      let score = 0;
      if (String(node.className || "").indexOf("el-button--primary") >= 0) {
        score += 3;
      }
      if (node.closest && node.closest(".filter-screen")) {
        score += 2;
      }
      if (node.tagName === "BUTTON") {
        score += 1;
      }

      if (!best || score > best.score) {
        best = { score: score, element: node };
      }
    }

    return best ? best.element : null;
  }

  function triggerPagerRefresh() {
    const selectors = [
      ".el-pagination .el-pager li.number.active",
      ".el-pagination .el-pager li.active",
      ".el-pagination .number.active",
    ];

    for (let index = 0; index < selectors.length; index += 1) {
      const target = document.querySelector(selectors[index]);
      if (!target) {
        continue;
      }
      if (!isElementVisible(target) || isElementDisabled(target)) {
        continue;
      }
      if (clickElement(target)) {
        return true;
      }
    }

    return false;
  }

  function triggerNativeGroupQuery(taskId) {
    const queryButton = findQueryButton();
    if (queryButton) {
      if (clickElement(queryButton)) {
        setStatus("已触发页面查询，正在等待平台响应...", "info");
        return "query";
      }
    }

    if (triggerPagerRefresh()) {
      setStatus("已触发分页刷新，正在等待平台响应...", "info");
      return "pager";
    }

    setPendingExport(taskId);
    setStatus("未找到查询控件，正在刷新页面并等待平台响应...", "info");
    location.reload();
    return "reload";
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

  function exportCurrentPageByPayload(payload, taskId) {
    const code = Number(payload?.code);
    const message = normalizeText(payload?.message);
    if (Number.isFinite(code) && code !== 0) {
      throw new Error(message || "平台返回异常（code=" + String(code) + "）。");
    }

    const records = Array.isArray(payload?.records) ? payload.records : [];
    const total = toPositiveInt(payload?.total, records.length);
    const pageNum = toPositiveInt(payload?.pageNum, toPositiveInt(payload?.params?.pageNum, 1));

    const csv = buildCsv(records);
    const safeTaskId = normalizeText(taskId) || "unknown";
    const fileName =
      "data-baker-task-" + safeTaskId + "-page-" + String(pageNum) + "-" + formatTimeStamp(new Date()) + ".csv";
    triggerCsvDownload(fileName, csv);

    if (records.length === 0) {
      setStatus(
        "已导出当前页 0 条 / 总计 " + String(total) + " 条（空数据）。已下载 CSV。",
        "success"
      );
      return;
    }

    setStatus(
      "已导出当前页 " + String(records.length) + " 条 / 总计 " + String(total) + " 条。已下载 CSV。",
      "success"
    );
  }

  async function runPendingResume(taskId) {
    if (resumeStarted || exportInProgress) {
      return;
    }

    const pendingExport = readPendingExport();
    if (!pendingExport) {
      return;
    }

    if (taskId && pendingExport.taskId && pendingExport.taskId !== taskId) {
      clearPendingExport();
      return;
    }

    resumeStarted = true;
    exportInProgress = true;
    if (exportButton) {
      exportButton.disabled = true;
    }
    setStatus("页面已刷新，正在等待平台数据响应...", "info");

    try {
      const payload = await waitForGroupResponse(taskId, WAIT_RESPONSE_TIMEOUT_MS);
      exportCurrentPageByPayload(payload, taskId);
      clearPendingExport();
    } catch (error) {
      setStatus(normalizeText(error?.message || "导出失败，请重试。"), "error");
    } finally {
      exportInProgress = false;
      resumeStarted = false;
      if (exportButton) {
        exportButton.disabled = false;
      }
    }
  }

  async function handleExportClick() {
    if (exportInProgress) {
      return;
    }

    const taskId = readTaskId();
    if (!taskId) {
      setStatus("未找到 taskId，无法导出。", "error");
      return;
    }

    clearPendingExport();
    exportInProgress = true;
    exportButton.disabled = true;
    setStatus("正在刷新页面数据，请稍候...", "info");

    try {
      const waitingPromise = waitForGroupResponse(taskId, WAIT_RESPONSE_TIMEOUT_MS);
      const triggerMode = triggerNativeGroupQuery(taskId);
      if (triggerMode === "reload") {
        return;
      }

      const payload = await waitingPromise;
      exportCurrentPageByPayload(payload, taskId);
    } catch (error) {
      setStatus(normalizeText(error?.message || "导出失败，请重试。"), "error");
    } finally {
      if (location && typeof location.href === "string") {
        exportInProgress = false;
        if (exportButton) {
          exportButton.disabled = false;
        }
      }
    }
  }

  function handlePageMessage(event) {
    if (!event || event.source !== window) {
      return;
    }
    if (event.origin !== location.origin) {
      return;
    }

    const data = event.data;
    if (!data || data.source !== SOURCE || data.type !== GROUP_MESSAGE_TYPE) {
      return;
    }

    const payload = data.payload;
    if (!payload || payload.path !== GROUP_QUERY_PATH) {
      return;
    }

    notifyWaiter(payload);
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
    title.textContent = "DataBaker 当前页导出";

    exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.className = "asr-edge-db-export-btn";
    exportButton.textContent = "导出当前页数据";
    exportButton.addEventListener("click", handleExportClick);

    statusNode = document.createElement("div");
    statusNode.className = "asr-edge-db-export-status";
    statusNode.textContent = "通过拦截平台原生请求导出当前页 CSV。";

    root.appendChild(title);
    root.appendChild(exportButton);
    root.appendChild(statusNode);
    document.documentElement.appendChild(root);
    return root;
  }

  function remove() {
    clearWaiter();
    clearPendingExport();
    exportInProgress = false;
    resumeStarted = false;

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
        return;
      }

      if (!exportInProgress) {
        setStatus("taskId: " + taskId, "info");
      }

      void runPendingResume(taskId);
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
    window.addEventListener("message", handlePageMessage);

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
