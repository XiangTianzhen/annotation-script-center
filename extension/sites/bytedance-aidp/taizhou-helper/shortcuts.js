(function () {
  const DEFAULT_SHORTCUTS = {};

  function normalizeShortcut(shortcut) {
    if (!shortcut || typeof shortcut !== "object") {
      return null;
    }
    const key = String(shortcut.key || "").trim();
    const button =
      typeof shortcut.button === "number" && Number.isFinite(shortcut.button)
        ? Number(shortcut.button)
        : null;
    if (!key && button === null) {
      return null;
    }
    return {
      ctrl: shortcut.ctrl === true,
      alt: shortcut.alt === true,
      shift: shortcut.shift === true,
      meta: shortcut.meta === true,
      key: key,
      button: button,
    };
  }

  function normalizeShortcutMap(shortcuts) {
    const source = shortcuts && typeof shortcuts === "object" ? shortcuts : {};
    const result = {};
    Object.keys(source).forEach(function (actionKey) {
      const shortcut = normalizeShortcut(source[actionKey]);
      if (!shortcut) {
        return;
      }
      result[actionKey] = shortcut;
    });
    return result;
  }

  function getEventKeyCandidates(event) {
    const candidates = [];
    const rawKey = String(event?.key || "").toLowerCase();
    const rawCode = String(event?.code || "");

    if (rawKey) {
      candidates.push(rawKey);
    }
    if (rawKey === " ") {
      candidates.push("space");
    }
    if (/^digit[0-9]$/i.test(rawCode)) {
      candidates.push(rawCode.slice(-1).toLowerCase());
    }
    if (/^numpad[0-9]$/i.test(rawCode)) {
      candidates.push(rawCode.slice(-1).toLowerCase());
    }
    if (/^key[a-z]$/i.test(rawCode)) {
      candidates.push(rawCode.slice(-1).toLowerCase());
    }
    if (/^space$/i.test(rawCode)) {
      candidates.push("space");
    }

    return Array.from(new Set(candidates));
  }

  function matchesShortcut(event, shortcut) {
    const config = shortcut && typeof shortcut === "object" ? shortcut : {};
    if (typeof config.button === "number") {
      return false;
    }
    if (Boolean(config.alt) !== event.altKey) {
      return false;
    }
    if (Boolean(config.shift) !== event.shiftKey) {
      return false;
    }
    if (Boolean(config.ctrl) !== event.ctrlKey) {
      return false;
    }
    if (Boolean(config.meta) !== event.metaKey) {
      return false;
    }
    return getEventKeyCandidates(event).indexOf(String(config.key || "").toLowerCase()) >= 0;
  }

  function isEditableTarget(node) {
    if (!node || typeof node !== "object") {
      return false;
    }
    if (node.isContentEditable === true) {
      return true;
    }
    const tagName = String(node.tagName || "").toUpperCase();
    if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
      return true;
    }
    if (typeof node.closest === "function") {
      return Boolean(
        node.closest(
          "input, textarea, select, [contenteditable='true'], [role='textbox'], [role='combobox'], .arco-select, .arco-select-popup, .arco-select-view-input"
        )
      );
    }
    return false;
  }

  function shouldIgnoreEvent(event) {
    if (isEditableTarget(event?.target || null)) {
      return true;
    }
    try {
      return isEditableTarget(globalThis.document?.activeElement || null);
    } catch (_error) {
      return false;
    }
  }

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    const actions = deps.actions || {};
    const shortcutMap = normalizeShortcutMap(deps.shortcuts);
    let onKeydown = null;

    function bind() {
      if (onKeydown || !globalThis.window || typeof globalThis.window.addEventListener !== "function") {
        return;
      }
      onKeydown = function (event) {
        if (shouldIgnoreEvent(event)) {
          return;
        }
        const matchedAction = Object.keys(shortcutMap).find(function (key) {
          return matchesShortcut(event, shortcutMap[key]);
        });
        if (!matchedAction || typeof actions[matchedAction] !== "function") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        actions[matchedAction]();
      };
      globalThis.window.addEventListener("keydown", onKeydown, true);
    }

    function destroy() {
      if (onKeydown && globalThis.window && typeof globalThis.window.removeEventListener === "function") {
        globalThis.window.removeEventListener("keydown", onKeydown, true);
      }
      onKeydown = null;
    }

    return {
      bind,
      destroy,
      defaults: DEFAULT_SHORTCUTS,
    };
  }

  const api = {
    createRuntime,
    DEFAULT_SHORTCUTS,
    normalizeShortcutMap,
  };

  globalThis.ASREdgeBytedanceAidpTaizhouShortcuts = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
