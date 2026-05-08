(function () {
  function normalizeKey(key) {
    const text = String(key || "").trim();
    if (!text) {
      return "";
    }
    if (text.length === 1) {
      return text.toLowerCase();
    }
    return text.toLowerCase();
  }

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    if (target.isContentEditable) {
      return true;
    }
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function isPrintableKey(key) {
    return key.length === 1 && /[a-z0-9`~!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/i.test(key);
  }

  function matchesShortcut(event, shortcut) {
    if (!shortcut) {
      return false;
    }
    const expectedKey = normalizeKey(shortcut.key);
    const actualKey = normalizeKey(event.key);
    if (expectedKey && expectedKey !== actualKey) {
      return false;
    }
    if (typeof shortcut.button === "number") {
      return false;
    }
    if (Boolean(shortcut.ctrl) !== Boolean(event.ctrlKey)) {
      return false;
    }
    if (Boolean(shortcut.alt) !== Boolean(event.altKey)) {
      return false;
    }
    if (Boolean(shortcut.shift) !== Boolean(event.shiftKey)) {
      return false;
    }
    if (Boolean(shortcut.meta) !== Boolean(event.metaKey)) {
      return false;
    }
    return true;
  }

  function createRuntime(options) {
    const getConfig = options?.getConfig;
    const onAction = options?.onAction;
    let bound = false;

    function resolveShortcutActions(config) {
      const map = [
        ["shortcutPanel", "togglePanel"],
        ["shortcutPlayPause", "playPause"],
        ["shortcutValid", "markValid"],
        ["shortcutInvalid", "markInvalid"],
        ["shortcutFill", "quickFill"],
        ["shortcutRemoveSpaces", "removeSpaces"],
        ["shortcutConvertNum", "convertNumbers"],
        ["shortcutToggleFocus", "toggleFocus"],
        ["shortcutCopyDuration", "copyDuration"],
        ["shortcutForward", "seekForward"],
        ["shortcutBackward", "seekBackward"],
        ["shortcutSpeedUp", "speedUp"],
        ["shortcutSpeedDown", "speedDown"],
        ["shortcutResetSpeed", "speedReset"],
        ["shortcutVolUp", "volumeUp"],
        ["shortcutVolDown", "volumeDown"],
        ["shortcutResetVol", "volumeReset"],
      ];
      const list = [];
      map.forEach(function (entry) {
        const shortcut = config?.[entry[0]];
        if (shortcut) {
          list.push({
            shortcut: shortcut,
            action: entry[1],
          });
        }
      });
      (config?.customRates || []).forEach(function (entry) {
        if (!entry || !entry.shortcut) {
          return;
        }
        list.push({
          shortcut: entry.shortcut,
          action: "setRate",
          payload: { rate: entry.rate },
        });
      });
      return list;
    }

    function onKeydown(event) {
      if (typeof getConfig !== "function" || typeof onAction !== "function") {
        return;
      }
      const config = getConfig() || {};
      const actions = resolveShortcutActions(config);
      if (actions.length === 0) {
        return;
      }
      const target = event.target;
      const editable = isEditableTarget(target);
      for (let i = 0; i < actions.length; i += 1) {
        const item = actions[i];
        if (!matchesShortcut(event, item.shortcut)) {
          continue;
        }

        const key = normalizeKey(event.key);
        const hasModifier = event.ctrlKey || event.altKey || event.metaKey;
        if (editable && !hasModifier && isPrintableKey(key)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onAction(item.action, item.payload || null);
        return;
      }
    }

    return {
      bind: function () {
        if (bound) {
          return;
        }
        document.addEventListener("keydown", onKeydown, true);
        bound = true;
      },
      unbind: function () {
        if (!bound) {
          return;
        }
        document.removeEventListener("keydown", onKeydown, true);
        bound = false;
      },
    };
  }

  globalThis.__ASREdgeAlibabaLabelxTranscriptionShortcutBus = {
    createRuntime: createRuntime,
  };
})();
