(function () {
  "use strict";

  const ROOT_ATTR = "data-asc-shujiajia-luzhou-helper";
  const DRAWER_ATTR = "data-asc-shujiajia-luzhou-drawer";
  const PANEL_ACTIONS = ["createWholeSegment", "recognizeWhole", "toggleDrawer", "fillRecognition"];

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function buildResultView(result) {
    const source = result && typeof result === "object" ? result : {};
    const listenTokens = number(source.usage?.listen?.totalTokens);
    const refineTokens = number(source.usage?.refine?.totalTokens);
    const cost = source.cost?.totalEstimatedCostCny;
    return {
      listenText: String(source.listenText || ""),
      refinedText: String(source.refinedText || ""),
      usageText: `听音 ${listenTokens} / 整理 ${refineTokens} / 总计 ${listenTokens + refineTokens} Token`,
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
  function findPropertyAnchor(documentLike) {
    return Array.from(documentLike.querySelectorAll("body *")).find((node) =>
      node.childElementCount === 0 && String(node.textContent || "").replace(/\s+/g, "").trim() === "段落属性"
    ) || null;
  }
  function createPanel(options) {
    const config = options || {};
    const doc = config.document || globalThis.document;
    let actions = {};
    let root = null;
    let drawer = null;
    let statusNode = null;
    let listenNode = null;
    let refineNode = null;
    let metaNode = null;
    let observer = null;
    let removed = false;
    const MutationObserverClass = config.MutationObserver || doc.defaultView?.MutationObserver || globalThis.MutationObserver;
    function observeMount() {
      if (observer || typeof MutationObserverClass !== "function" || !doc.body) return;
      observer = new MutationObserverClass(() => {
        if (!removed && (!root?.isConnected || !drawer?.isConnected)) ensureMounted();
      });
      observer.observe(doc.body, { childList: true, subtree: true });
    }
    function installStyle() {
      if (doc.querySelector("style[data-asc-shujiajia-luzhou-style]")) return;
      const style = doc.createElement("style");
      style.dataset.ascShujiajiaLuzhouStyle = "";
      style.textContent = [
        "[data-asc-shujiajia-luzhou-helper]{position:fixed;right:12px;bottom:12px;z-index:2147483001;width:min(210px,calc(100vw - 24px));box-sizing:border-box;padding:10px;border:1px solid #606266;border-radius:8px;background:#303133;color:#f2f3f5;box-shadow:0 8px 28px rgba(0,0,0,.42);font:14px/1.45 'Microsoft YaHei',sans-serif}",
        "[data-asc-shujiajia-luzhou-helper] .asc-sjj-title{font-weight:600;margin-bottom:8px}",
        "[data-asc-shujiajia-luzhou-helper] .asc-sjj-btn,[data-asc-shujiajia-luzhou-drawer] .asc-sjj-btn{display:block;width:100%;margin:6px 0;padding:7px 9px;border:1px solid #606266;border-radius:4px;background:#3a3b3d;color:#f2f3f5;cursor:pointer}",
        "[data-asc-shujiajia-luzhou-helper] .asc-sjj-btn:first-of-type,[data-asc-shujiajia-luzhou-drawer] .asc-sjj-primary{border-color:#409eff;background:#409eff;color:#fff}",
        "[data-asc-shujiajia-luzhou-helper] .asc-sjj-status{margin-top:8px;color:#909399;white-space:normal}",
        "[data-asc-shujiajia-luzhou-drawer]{position:fixed;top:12px;right:234px;bottom:12px;z-index:2147483000;width:min(520px,calc(100vw - 258px));box-sizing:border-box;overflow:auto;padding:12px;border:1px solid #606266;border-radius:8px;background:#303133;color:#f2f3f5;box-shadow:0 8px 28px rgba(0,0,0,.42);font:14px/1.5 'Microsoft YaHei',sans-serif}",
        "[data-asc-shujiajia-luzhou-drawer][hidden]{display:none!important}",
        "[data-asc-shujiajia-luzhou-drawer] .asc-sjj-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
        "[data-asc-shujiajia-luzhou-drawer] .asc-sjj-result{min-height:72px;padding:9px;background:#252629;border-radius:4px;white-space:pre-wrap;word-break:break-word}",
        "[data-asc-shujiajia-luzhou-drawer] .asc-sjj-meta{margin:8px 0;color:#909399}",
        "@media(max-width:700px){[data-asc-shujiajia-luzhou-drawer]{right:12px;bottom:230px;width:calc(100vw - 24px)}[data-asc-shujiajia-luzhou-drawer] .asc-sjj-result-grid{grid-template-columns:1fr}}",
      ].join("");
      (doc.head || doc.documentElement).appendChild(style);
    }
    function wire(button) {
      button.addEventListener("click", () => { void actions[button.dataset.ascAction]?.(); });
      return button;
    }
    function ensureMounted() {
      if (removed) return false;
      if (root?.isConnected && drawer?.isConnected) { observeMount(); return true; }
      const anchor = findPropertyAnchor(doc);
      if (!anchor) return false;
      installStyle();
      if (root && drawer) {
        if (!root.isConnected) doc.body.appendChild(root);
        if (!drawer.isConnected) doc.body.appendChild(drawer);
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
        wire(createButton(doc, "识别整段", "recognizeWhole")),
        wire(createButton(doc, "展开识别结果", "toggleDrawer"))
      );
      statusNode = doc.createElement("div");
      statusNode.className = "asc-sjj-status";
      statusNode.textContent = "等待操作";
      root.appendChild(statusNode);
      doc.body.appendChild(root);

      drawer = doc.querySelector(`[${DRAWER_ATTR}]`) || doc.createElement("section");
      drawer.setAttribute(DRAWER_ATTR, "");
      drawer.hidden = true;
      drawer.innerHTML = "<div class='asc-sjj-title'>AI 识别结果</div><div class='asc-sjj-result-grid'><div><b>原始听写</b><div class='asc-sjj-result' data-role='listen'></div></div><div><b>泸州话整理</b><div class='asc-sjj-result' data-role='refine'></div></div></div><div class='asc-sjj-meta' data-role='meta'>尚未识别</div>";
      const close = wire(createButton(doc, "关闭结果", "toggleDrawer"));
      const fill = wire(createButton(doc, "填入转写", "fillRecognition"));
      fill.classList.add("asc-sjj-primary");
      drawer.append(close, fill);
      listenNode = drawer.querySelector("[data-role='listen']");
      refineNode = drawer.querySelector("[data-role='refine']");
      metaNode = drawer.querySelector("[data-role='meta']");
      doc.body.appendChild(drawer);
      observeMount();
      return Boolean(root.isConnected && drawer.isConnected);
    }
    function setActions(next) { actions = next || {}; }
    function setMessage(message) { if (ensureMounted()) statusNode.textContent = String(message || ""); }
    function setResult(result) {
      if (!ensureMounted()) return;
      const view = buildResultView(result);
      listenNode.textContent = view.listenText || "（空）";
      refineNode.textContent = view.refinedText || "（空）";
      metaNode.textContent = view.usageText + " · " + view.costText;
      drawer.hidden = false;
    }
    function toggleDrawer() { if (ensureMounted()) drawer.hidden = !drawer.hidden; }
    function remove() {
      removed = true;
      observer?.disconnect?.();
      observer = null;
      root?.remove();
      drawer?.remove();
      root = drawer = null;
    }
    return { ensureMounted, remove, setActions, setMessage, setResult, toggleDrawer };
  }
  const api = { PANEL_ACTIONS, buildResultView, createPanel };
  globalThis.__ASREdgeShujiajiaUiPanel = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
