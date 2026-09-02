(function () {
  "use strict";
  function editable(target) {
    const tag = String(target?.tagName || "").toUpperCase();
    return target?.isContentEditable === true || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
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
    if (editable(event?.target)) return false;
    const entry = Object.entries(map || {}).find(([, shortcut]) => matches(event, shortcut));
    if (!entry || typeof actions?.[entry[0]] !== "function") return false;
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
  const api = { createRuntime, handleKeydown, isEditableTarget: editable, matchesShortcut: matches };
  globalThis.__ASREdgeShujiajiaShortcuts = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
