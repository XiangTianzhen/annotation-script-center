(function () {
  const BLOCKED_TEXTS = {
    newTab: "您正在编辑该作业,不能打开新的Tab页",
    pauseState: "系统进入暂停状态",
  };

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, "");
  }

  function getEnabledBlockedTexts(options) {
    const source = options && typeof options === "object" ? options : {};
    if (source.enabled === false) {
      return [];
    }
    const blockedTexts = [];
    if (source.blockNewTabEditingTips !== false) {
      blockedTexts.push(BLOCKED_TEXTS.newTab);
    }
    if (source.blockPauseStateTips !== false) {
      blockedTexts.push(BLOCKED_TEXTS.pauseState);
    }
    return blockedTexts;
  }

  function isBlockedEditingTabTipNode(node, blockedTexts) {
    if (!node || typeof node !== "object") {
      return false;
    }
    const text = normalizeText(node.textContent);
    return (blockedTexts || []).some(function (blockedText) {
      return text.indexOf(blockedText) >= 0;
    });
  }

  function collectTipsNodes(root) {
    if (!root || typeof root.querySelectorAll !== "function") {
      return [];
    }
    try {
      return Array.from(root.querySelectorAll(".tips"));
    } catch (_error) {
      return [];
    }
  }

  function removeBlockedTipsFromRoot(root, blockedTexts) {
    const targets = [];

    if (isBlockedEditingTabTipNode(root, blockedTexts)) {
      targets.push(root);
    }

    collectTipsNodes(root).forEach(function (node) {
      if (targets.indexOf(node) < 0 && isBlockedEditingTabTipNode(node, blockedTexts)) {
        targets.push(node);
      }
    });

    targets.forEach(function (node) {
      if (node && typeof node.remove === "function") {
        node.remove();
      }
    });

    return targets.length;
  }

  function createEditingTabTipGuard(options) {
    const deps = options && typeof options === "object" ? options : {};
    const doc = deps.document || globalThis.document || null;
    const MutationObserverCtor =
      deps.MutationObserver || globalThis.MutationObserver || null;
    const blockedTexts = getEnabledBlockedTexts(deps);
    const enabled = blockedTexts.length > 0;
    let observer = null;

    function scan() {
      if (!enabled || !doc) {
        return 0;
      }
      const root = doc.body || doc.documentElement || doc;
      return removeBlockedTipsFromRoot(root, blockedTexts);
    }

    function start() {
      if (!enabled || !doc) {
        return false;
      }
      scan();
      if (!MutationObserverCtor || observer) {
        return Boolean(MutationObserverCtor);
      }
      const root = doc.body || doc.documentElement;
      if (!root) {
        return false;
      }
      observer = new MutationObserverCtor(function (mutations) {
        mutations.forEach(function (mutation) {
          const addedNodes = Array.isArray(mutation?.addedNodes)
            ? mutation.addedNodes
            : Array.from(mutation?.addedNodes || []);
          addedNodes.forEach(function (node) {
            removeBlockedTipsFromRoot(node, blockedTexts);
          });
        });
      });
      observer.observe(root, {
        childList: true,
        subtree: true,
      });
      return true;
    }

    function stop() {
      if (observer && typeof observer.disconnect === "function") {
        observer.disconnect();
      }
      observer = null;
    }

    return {
      start,
      stop,
      scan,
      get observer() {
        return observer;
      },
    };
  }

  const api = {
    BLOCKED_TEXTS,
    createEditingTabTipGuard,
    isBlockedEditingTabTipNode,
    getEnabledBlockedTexts,
    removeBlockedTipsFromRoot,
  };

  globalThis.ASREdgeDataBakerCvpcEditingTabTipGuard = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
