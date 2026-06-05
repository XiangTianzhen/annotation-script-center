(function () {
  const DEFAULT_SHORTCUTS = {
    preview: { alt: true, shift: true, key: "4" },
    applyPreview: { alt: true, shift: true, key: "5" },
    recommend: { alt: true, shift: true, key: "6" },
    applyRecommend: { alt: true, shift: true, key: "7" },
    valid: { alt: true, shift: true, key: "1" },
    invalid: { alt: true, shift: true, key: "2" },
    fillAllValid: { alt: true, shift: true, key: "3" },
  };

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
    let onKeydown = null;

    function bind() {
      if (onKeydown) {
        return;
      }
      onKeydown = function (event) {
        const matchedAction = Object.keys(DEFAULT_SHORTCUTS).find(function (key) {
          return matchesShortcut(event, DEFAULT_SHORTCUTS[key]);
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
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouShortcuts = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
