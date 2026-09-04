(function () {
  "use strict";
  function editable(target) {
    const tag = String(target?.tagName || "").toUpperCase();
    return target?.isContentEditable === true || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }
  function transcriptInput(target) {
    const tag = String(target?.tagName || "").toUpperCase();
    if (tag !== "INPUT" && tag !== "TEXTAREA") return false;
    return target?.classList?.contains?.("transfer-input") === true
      || String(target?.getAttribute?.("placeholder") || "").includes("转写");
  }
  function matches(event, shortcut) {
    if (!shortcut || typeof shortcut !== "object" || !shortcut.key) return false;
    return String(event.key || "").toLowerCase() === String(shortcut.key).toLowerCase()
      && (event.ctrlKey === true) === (shortcut.ctrl === true)
      && (event.altKey === true) === (shortcut.alt === true)
      && (event.shiftKey === true) === (shortcut.shift === true)
      && (event.metaKey === true) === (shortcut.meta === true);
  }
  async function handleKeydown(event, map, actions) {
    const entries = Object.entries(map || {}).filter(([, shortcut]) => matches(event, shortcut));
    if (entries.length !== 1) return false;
    const entry = entries[0];
    if (typeof actions?.[entry[0]] !== "function") return false;
    const editableOverlapAction = (entry[0] === "insertOverlapStart" || entry[0] === "insertOverlapEnd")
      && transcriptInput(event?.target);
    if (editable(event?.target) && !editableOverlapAction) return false;
    event.preventDefault?.();
    await actions[entry[0]]();
    return true;
  }
  function createRuntime(options) {
    const config = options || {};
    const listener = (event) => { void handleKeydown(event, config.shortcuts || {}, config.actions || {}); };
    return {
      start() { (config.target || globalThis.document)?.addEventListener?.("keydown", listener, true); },
      stop() { (config.target || globalThis.document)?.removeEventListener?.("keydown", listener, true); },
    };
  }
  const api = { createRuntime, handleKeydown, isEditableTarget: editable, isTranscriptInput: transcriptInput, matchesShortcut: matches };
  globalThis.__ASREdgeShujiajiaShortcuts = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
