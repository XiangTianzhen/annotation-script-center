(function () {
  "use strict";

  function normalizedText(value) {
    return String(value || "").replace(/\s+/g, " ").replace(/\s*\([^)]*\)\s*$/, "").trim();
  }
  function visible(node) {
    return Boolean(node && node.disabled !== true && node.hidden !== true && (!node.getClientRects || node.getClientRects().length > 0));
  }
  function clickUniqueVisibleControl(options) {
    const exactText = normalizedText(options?.exactText);
    const matches = Array.from(options?.controls || []).filter((node) => visible(node) && normalizedText(node.textContent) === exactText);
    if (matches.length !== 1) return { ok: false, code: matches.length ? "ambiguous-control" : "control-not-found" };
    matches[0].click();
    return { ok: true, code: "clicked" };
  }
  function fillTranscript(options) {
    const input = options?.input;
    const value = String(options?.text == null ? "" : options.text);
    if (!input || input.disabled || input.readOnly) return { ok: false, code: "transcript-readonly" };
    const EventCtor = options?.EventCtor || globalThis.Event;
    const prototype = String(input.tagName || "").toUpperCase() === "TEXTAREA"
      ? globalThis.HTMLTextAreaElement?.prototype
      : globalThis.HTMLInputElement?.prototype;
    const setter = prototype && Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    ["input", "change", "blur"].forEach((type) => input.dispatchEvent(new EventCtor(type, { bubbles: true })));
    if (options.state) options.state.dirty = true;
    return { ok: true, code: "transcript-filled" };
  }
  function submitNext(options) {
    if (options?.state?.dirty === true) return { ok: false, code: "temporary-save-required" };
    const buttons = Array.from(options?.buttons || []).filter((button) => button?.classList?.contains?.("submit") || normalizedText(button?.textContent) === "提交进入下一条");
    if (buttons.length !== 1 || !visible(buttons[0])) return { ok: false, code: buttons.length > 1 ? "ambiguous-control" : "control-not-found" };
    buttons[0].click();
    return { ok: true, code: "clicked" };
  }
  function documents(rootDocument) {
    const result = [];
    const add = (value) => { if (value && !result.includes(value)) result.push(value); };
    add(rootDocument || globalThis.document);
    try { add(globalThis.window?.parent?.document); } catch (_error) {}
    try { add(globalThis.window?.top?.document); } catch (_error) {}
    return result;
  }
  function queryAll(selector, rootDocument, includeParents = true) {
    const scopes = includeParents ? documents(rootDocument) : [rootDocument || globalThis.document];
    return scopes.flatMap((doc) => Array.from(doc?.querySelectorAll?.(selector) || []));
  }
  function findTranscriptInput(rootDocument) {
    const inputs = queryAll("textarea[placeholder*='转写'], input[placeholder*='转写']", rootDocument, false).filter(visible);
    return inputs.length === 1 ? inputs[0] : null;
  }
  function editableTranscriptInputs(rootDocument) {
    return queryAll(".el-table__row input.transfer-input, .el-table__row textarea.transfer-input", rootDocument, false)
      .filter((input) => visible(input) && input.disabled !== true && input.readOnly !== true);
  }
  function findSelectedTranscriptInput(rootDocument) {
    const rows = queryAll(".el-table__row.current-row", rootDocument, false);
    if (rows.length !== 1) return null;
    const inputs = Array.from(rows[0].querySelectorAll?.("input.transfer-input, textarea.transfer-input") || [])
      .filter((input) => visible(input) && input.disabled !== true && input.readOnly !== true);
    return inputs.length === 1 ? inputs[0] : null;
  }
  function findSingleTranscriptInput(rootDocument) {
    const inputs = editableTranscriptInputs(rootDocument);
    return inputs.length === 1 ? inputs[0] : null;
  }
  function getTranscriptInputCount(rootDocument) {
    return editableTranscriptInputs(rootDocument).length;
  }
  function clickOverlapSymbol(symbol, rootDocument) {
    const groups = queryAll(".special-container.with-group-head .symbol-group", rootDocument, false).filter((group) => {
      const title = group.querySelector?.(".symbol-group-title");
      return normalizedText(title?.getAttribute?.("title") || title?.textContent) === "Category1（多选）";
    });
    if (groups.length !== 1) return { ok: false, code: groups.length ? "ambiguous-symbol-group" : "symbol-group-not-found" };
    const items = Array.from(groups[0].querySelectorAll?.(".symbol-item") || []).filter((item) => {
      const key = item.querySelector?.(".key");
      const disabled = item.disabled === true || item.getAttribute?.("aria-disabled") === "true" || item.classList?.contains?.("is-disabled");
      return !disabled && visible(item) && normalizedText(key?.getAttribute?.("title") || key?.textContent) === normalizedText(symbol);
    });
    if (items.length !== 1) return { ok: false, code: items.length ? "ambiguous-symbol-control" : "symbol-control-not-found" };
    items[0].click();
    return { ok: true, code: "clicked" };
  }
  function markValidity(effective, rootDocument) {
    const targetText = effective ? "有效" : "无效";
    const controls = queryAll("label,button,[role='radio']", rootDocument, false).filter((node) => normalizedText(node.textContent) === targetText);
    return clickUniqueVisibleControl({ controls, exactText: targetText });
  }
  function temporarySave(rootDocument) {
    return clickUniqueVisibleControl({ controls: queryAll("button,[role='button']", rootDocument), exactText: "暂存" });
  }
  function submitFromPage(state, rootDocument) {
    return submitNext({ state, buttons: queryAll("button.submit", rootDocument) });
  }
  function togglePlayPause(rootDocument) {
    const media = queryAll("audio,video", rootDocument, false).find(Boolean);
    if (media) {
      if (media.paused) void media.play(); else media.pause();
      return { ok: true, code: "media-toggled" };
    }
    const nativeToggle = queryAll(".center .pause", rootDocument, false).filter(visible);
    if (nativeToggle.length === 1) { nativeToggle[0].click(); return { ok: true, code: "clicked" }; }
    const controls = queryAll("button,[role='button']", rootDocument, false).filter((node) => /播放|暂停/.test(normalizedText(node.textContent) + " " + String(node.getAttribute?.("aria-label") || "")));
    if (controls.length !== 1) return { ok: false, code: "control-not-found" };
    controls[0].click();
    return { ok: true, code: "clicked" };
  }
  const api = {
    clickOverlapSymbol, clickUniqueVisibleControl, fillTranscript, findSelectedTranscriptInput,
    findSingleTranscriptInput, findTranscriptInput, getTranscriptInputCount, markValidity,
    normalizedText, queryAll, submitFromPage, submitNext, temporarySave, togglePlayPause,
  };
  globalThis.__ASREdgeShujiajiaDataApi = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
