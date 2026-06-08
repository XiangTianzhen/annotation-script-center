(function () {
  const DEFAULT_SHORTCUTS = {};

  function normalizeShortcut(shortcut) {
    if (!shortcut || typeof shortcut !== "object") {
      return null;
    }
    const key = String(shortcut.key || "").trim();
    if (!key) {
      return null;
    }
    return {
      ctrl: shortcut.ctrl === true,
      alt: shortcut.alt === true,
      shift: shortcut.shift === true,
      meta: shortcut.meta === true,
      key: key,
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

  function matchesShortcut(event, shortcut) {
    const config = shortcut && typeof shortcut === "object" ? shortcut : {};
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
    return String(event.key || "").toLowerCase() === String(config.key || "").toLowerCase();
  }

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    const actions = deps.actions || {};
    const shortcutMap = normalizeShortcutMap(deps.shortcuts);
    let onKeydown = null;

    function bind() {
      if (onKeydown) {
        return;
      }
      onKeydown = function (event) {
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
      window.addEventListener("keydown", onKeydown, true);
    }

    function destroy() {
      if (onKeydown) {
        window.removeEventListener("keydown", onKeydown, true);
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

  globalThis.ASREdgeDataBakerCvpcLiuzhouShortcuts = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
