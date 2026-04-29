(function () {
  const ROOT_ATTR = "data-asr-edge-databaker-group-export";
  const STYLE_ID = "asr-edge-databaker-group-export-style";
  const BACKEND_BASE_URL = "http://127.0.0.1:3333";
  const EXPORT_API_PATH = "/api/data-baker/round-one-quality/export/task";
  const STATUS_POLL_MS = 1000;

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
      "  min-width: 180px;",
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

  function resolveDownloadUrl(downloadUrl) {
    try {
      return new URL(String(downloadUrl || ""), BACKEND_BASE_URL).toString();
    } catch (error) {
      return "";
    }
  }

  function triggerDownload(downloadUrl, fileName) {
    const link = document.createElement("a");
    link.href = downloadUrl;
    if (fileName) {
      link.download = fileName;
    }
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleExportClick() {
    const taskId = readTaskId();
    if (!taskId) {
      setStatus("未找到 taskId，无法导出。", "error");
      return;
    }

    exportButton.disabled = true;
    setStatus("正在导出，请稍候...", "info");
    try {
      const response = await fetch(BACKEND_BASE_URL + EXPORT_API_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: taskId,
          pageSize: 100,
        }),
      });
      const responseBody = await response.json().catch(function () {
        return null;
      });
      if (!response.ok || responseBody?.success !== true || !responseBody?.data) {
        throw new Error(
          responseBody?.message ||
            "导出失败（HTTP " + String(response.status) + "），请检查本地后端配置。"
        );
      }

      const data = responseBody.data;
      const downloadUrl = resolveDownloadUrl(data.downloadUrl);
      if (!downloadUrl) {
        throw new Error("导出完成但下载地址无效。");
      }
      triggerDownload(downloadUrl, data.fileName || "");
      setStatus(
        "已导出 " +
          String(Number(data.rows || 0)) +
          " 条（total " +
          String(Number(data.total || 0)) +
          "），已触发下载。",
        "success"
      );
    } catch (error) {
      setStatus(String(error?.message || "导出失败。"), "error");
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
    statusNode.textContent = "按 taskId 全量翻页导出 CSV。";

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
