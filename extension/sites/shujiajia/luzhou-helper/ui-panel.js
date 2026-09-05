(function () {
  "use strict";

  const ROOT_ATTR = "data-asc-shujiajia-luzhou-helper";
  const DRAWER_ATTR = "data-asc-shujiajia-luzhou-drawer";
  const RESULT_HOST_ATTR = "data-asc-shujiajia-luzhou-result-host";
  const PANEL_ACTIONS = ["createWholeSegment", "recognizeWhole", "fillRecognition"];

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function buildResultView(result) {
    const source = result && typeof result === "object" ? result : {};
    const inputTokens = number(source.usage?.listen?.promptTokens);
    const outputTokens = number(source.usage?.listen?.completionTokens);
    const totalTokens = number(source.usage?.listen?.totalTokens || inputTokens + outputTokens);
    const cost = source.cost?.totalEstimatedCostCny;
    return {
      dialectText: String(source.dialectText || source.refinedText || ""),
      usageText: `输入 ${inputTokens} / 输出 ${outputTokens} / 总计 ${totalTokens} Token`,
      costText: cost === null || cost === undefined || !Number.isFinite(Number(cost))
        ? "预估人民币 没有数据源"
        : `预估人民币 ${Number(cost).toFixed(6).replace(/0+$/, "").replace(/\.$/, "")} 元`,
    };
  }
  function createButton(documentLike, label, action) {
    const button = documentLike.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.ascAction = action;
    button.className = "asc-sjj-btn";
    return button;
  }
  function findMountHosts(documentLike) {
    const formTabs = documentLike.querySelector(".form-tabs");
    const primaryControls = documentLike.querySelector(".form-tabs .tabs-container") || documentLike.querySelector(".tabs-container");
    const operateContainer = documentLike.querySelector(".operate-container");
    const primaryResults = documentLike.querySelector(".operate-container .transfer") || documentLike.querySelector(".transfer");
    let resultHost = primaryResults;
    if (!resultHost && operateContainer) {
      resultHost = operateContainer.querySelector(`[${RESULT_HOST_ATTR}]`);
      if (!resultHost) {
        resultHost = documentLike.createElement("div");
        resultHost.setAttribute(RESULT_HOST_ATTR, "");
        const paragraph = operateContainer.querySelector(".paragraph");
        operateContainer.insertBefore(resultHost, paragraph || operateContainer.firstChild);
      }
    }
    return {
      controls: primaryControls || formTabs,
      primaryControls,
      results: resultHost,
      primaryResults,
    };
  }
  function createPanel(options) {
    const config = options || {};
    const doc = config.document || globalThis.document;
    let actions = {};
    let root = null;
    let drawer = null;
    let statusNode = null;
    let dialectNode = null;
    let metaNode = null;
    let errorDiagnosticNode = null;
    let errorMetaNode = null;
    let errorRawNode = null;
    let copyErrorButtonNode = null;
    let errorCopyText = "";
    let observer = null;
    let removed = false;
    const MutationObserverClass = config.MutationObserver || doc.defaultView?.MutationObserver || globalThis.MutationObserver;
    function observeMount() {
      if (observer || typeof MutationObserverClass !== "function" || !doc.body) return;
      observer = new MutationObserverClass(() => {
        if (removed) return;
        const hosts = findMountHosts(doc);
        if (!root?.isConnected || !drawer?.isConnected || root.parentElement !== hosts.controls || drawer.parentElement !== hosts.results) ensureMounted();
      });
      observer.observe(doc.body, { childList: true, subtree: true });
    }
    function installStyle() {
      if (doc.querySelector("style[data-asc-shujiajia-luzhou-style]")) return;
      const style = doc.createElement("style");
      style.dataset.ascShujiajiaLuzhouStyle = "";
      style.textContent = [
        "[data-asc-shujiajia-luzhou-helper]{width:100%;box-sizing:border-box;margin-top:8px;padding:10px;border:1px solid #606266;border-radius:6px;background:#303133;color:#f2f3f5;font:14px/1.45 'Microsoft YaHei',sans-serif}",
        "[data-asc-shujiajia-luzhou-helper] .asc-sjj-title{font-weight:600;margin-bottom:8px}",
        "[data-asc-shujiajia-luzhou-helper] .asc-sjj-btn,[data-asc-shujiajia-luzhou-drawer] .asc-sjj-btn{display:block;width:100%;margin:6px 0;padding:7px 9px;border:1px solid #606266;border-radius:4px;background:#3a3b3d;color:#f2f3f5;cursor:pointer}",
        "[data-asc-shujiajia-luzhou-helper] .asc-sjj-btn:first-of-type,[data-asc-shujiajia-luzhou-drawer] .asc-sjj-primary{border-color:#409eff;background:#409eff;color:#fff}",
        "[data-asc-shujiajia-luzhou-helper] .asc-sjj-status{margin-top:8px;color:#909399;white-space:normal}",
        "[data-asc-shujiajia-luzhou-result-host]{flex:0 0 40%;width:40%;height:100%;box-sizing:border-box;overflow:auto;margin-right:4px}",
        "[data-asc-shujiajia-luzhou-drawer]{width:100%;box-sizing:border-box;margin-top:10px;padding:12px;border:1px solid #606266;border-radius:6px;background:#303133;color:#f2f3f5;font:14px/1.5 'Microsoft YaHei',sans-serif}",
        "[data-asc-shujiajia-luzhou-drawer] .asc-sjj-result-grid{display:grid;grid-template-columns:1fr;gap:10px}",
        "[data-asc-shujiajia-luzhou-drawer] .asc-sjj-result{min-height:72px;padding:9px;background:#252629;border-radius:4px;white-space:pre-wrap;word-break:break-word}",
        "[data-asc-shujiajia-luzhou-drawer] .asc-sjj-meta{margin:8px 0;color:#909399}",
        "[data-asc-shujiajia-luzhou-drawer] .asc-sjj-error{margin-top:12px;padding:10px;border:1px solid #f56c6c;border-radius:4px;background:#3a2929}",
        "[data-asc-shujiajia-luzhou-drawer] .asc-sjj-error-meta{margin:6px 0;white-space:pre-wrap;word-break:break-word}",
        "[data-asc-shujiajia-luzhou-drawer] .asc-sjj-error-raw{max-height:260px;overflow:auto;margin:6px 0;padding:8px;background:#252629;white-space:pre-wrap;word-break:break-all;font:12px/1.5 Consolas,monospace}",
        "@media(max-width:700px){[data-asc-shujiajia-luzhou-drawer] .asc-sjj-result-grid{grid-template-columns:1fr}}",
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }
    function wire(button) {
      button.addEventListener("click", () => { void actions[button.dataset.ascAction]?.(); });
      return button;
    }
    function mountControls(hosts) {
      if (hosts.primaryControls) {
        hosts.controls.appendChild(root);
        return;
      }
      const divider = hosts.controls?.querySelector?.(".border-line");
      if (divider?.parentElement === hosts.controls) divider.insertAdjacentElement("afterend", root);
      else hosts.controls?.appendChild(root);
    }
    function ensureMounted() {
      if (removed) return false;
      const hosts = findMountHosts(doc);
      if (!hosts.controls || !hosts.results) return false;
      if (root?.isConnected && drawer?.isConnected && root.parentElement === hosts.controls && drawer.parentElement === hosts.results) { observeMount(); return true; }
      installStyle();
      if (root && drawer) {
        if (root.parentElement !== hosts.controls) mountControls(hosts);
        if (drawer.parentElement !== hosts.results) hosts.results.appendChild(drawer);
        if (hosts.primaryResults) doc.querySelector(`[${RESULT_HOST_ATTR}]`)?.remove();
        observeMount();
        return true;
      }
      root = doc.querySelector(`[${ROOT_ATTR}]`) || doc.createElement("section");
      root.setAttribute(ROOT_ATTR, "");
      root.innerHTML = "";
      const title = doc.createElement("div");
      title.className = "asc-sjj-title";
      title.textContent = "泸州话助手";
      root.append(title,
        wire(createButton(doc, "整音频划一段", "createWholeSegment")),
        wire(createButton(doc, "识别整段", "recognizeWhole"))
      );
      statusNode = doc.createElement("div");
      statusNode.className = "asc-sjj-status";
      statusNode.textContent = "等待操作";
      root.appendChild(statusNode);
      mountControls(hosts);

      drawer = doc.querySelector(`[${DRAWER_ATTR}]`) || doc.createElement("section");
      drawer.setAttribute(DRAWER_ATTR, "");
      drawer.hidden = false;
      drawer.innerHTML = "<div class='asc-sjj-title'>AI 识别结果</div><div class='asc-sjj-result-grid'><div><b>泸州方言文本</b><div class='asc-sjj-result' data-role='dialect'></div></div></div><div class='asc-sjj-meta' data-role='meta'>尚未识别</div><section class='asc-sjj-error' data-role='error-diagnostic' hidden><b>AI 错误诊断</b><div class='asc-sjj-error-meta' data-role='error-meta'></div><pre class='asc-sjj-error-raw' data-role='error-raw'></pre><button type='button' class='asc-sjj-btn' data-role='copy-error'>复制错误信息</button></section>";
      const fill = wire(createButton(doc, "填入转写", "fillRecognition"));
      fill.classList.add("asc-sjj-primary");
      drawer.append(fill);
      dialectNode = drawer.querySelector("[data-role='dialect']");
      metaNode = drawer.querySelector("[data-role='meta']");
      errorDiagnosticNode = drawer.querySelector("[data-role='error-diagnostic']");
      errorMetaNode = drawer.querySelector("[data-role='error-meta']");
      errorRawNode = drawer.querySelector("[data-role='error-raw']");
      copyErrorButtonNode = drawer.querySelector("[data-role='copy-error']");
      copyErrorButtonNode.addEventListener("click", async () => {
        const writeClipboard = config.writeClipboard || globalThis.navigator?.clipboard?.writeText?.bind(globalThis.navigator.clipboard);
        if (!errorCopyText || typeof writeClipboard !== "function") return;
        await writeClipboard(errorCopyText);
      });
      hosts.results.appendChild(drawer);
      observeMount();
      return Boolean(root.isConnected && drawer.isConnected);
    }
    function setActions(next) { actions = next || {}; }
    function setMessage(message) { if (ensureMounted()) statusNode.textContent = String(message || ""); }
    function setResult(result) {
      if (!ensureMounted()) return;
      if (!result || typeof result !== "object") {
        dialectNode.textContent = "";
        metaNode.textContent = "尚未识别";
        drawer.hidden = false;
        return;
      }
      const view = buildResultView(result);
      dialectNode.textContent = view.dialectText || "（空）";
      metaNode.textContent = view.usageText + " · " + view.costText;
    }
    function setError(error) {
      if (!ensureMounted()) return;
      if (!error || typeof error !== "object") {
        errorCopyText = "";
        errorMetaNode.textContent = "";
        errorRawNode.textContent = "";
        errorDiagnosticNode.hidden = true;
        return;
      }
      const providerStatus = number(error.providerStatus || error.rawResponse?.providerStatus);
      const lines = [
        `错误：${String(error.code || "recognition-failed")} · HTTP ${providerStatus || "未知"}`,
      ];
      if (error.providerCode) lines.push(`百炼错误码：${String(error.providerCode)}`);
      if (error.summary) lines.push(`错误摘要：${String(error.summary)}`);
      if (error.requestId) lines.push(`requestId：${String(error.requestId)}`);
      errorMetaNode.textContent = lines.join("\n");
      errorCopyText = JSON.stringify(error, null, 2);
      errorRawNode.textContent = errorCopyText;
      errorDiagnosticNode.hidden = false;
    }
    function remove() {
      removed = true;
      observer?.disconnect?.();
      observer = null;
      root?.remove();
      drawer?.remove();
      doc.querySelector(`[${RESULT_HOST_ATTR}]`)?.remove();
      root = drawer = null;
    }
    return { ensureMounted, remove, setActions, setError, setMessage, setResult };
  }
  const api = { PANEL_ACTIONS, buildResultView, createPanel };
  globalThis.__ASREdgeShujiajiaUiPanel = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
