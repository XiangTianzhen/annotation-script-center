(function () {
  const BLOCKED_TEXT = "您正在编辑该作业,不能打开新的Tab页";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, "");
  }

  function isBlockedEditingTabTipNode(node) {
    if (!node || typeof node !== "object") {
      return false;
    }
    return normalizeText(node.textContent).indexOf(BLOCKED_TEXT) >= 0;
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

  function removeBlockedTipsFromRoot(root) {
    const targets = [];

    if (isBlockedEditingTabTipNode(root)) {
      targets.push(root);
    }

    collectTipsNodes(root).forEach(function (node) {
      if (targets.indexOf(node) < 0 && isBlockedEditingTabTipNode(node)) {
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
    const enabled = deps.enabled !== false;
    let observer = null;

    function scan() {
      if (!enabled || !doc) {
        return 0;
      }
      const root = doc.body || doc.documentElement || doc;
      return removeBlockedTipsFromRoot(root);
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
            removeBlockedTipsFromRoot(node);
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
    BLOCKED_TEXT,
    createEditingTabTipGuard,
    isBlockedEditingTabTipNode,
    removeBlockedTipsFromRoot,
  };

  globalThis.ASREdgeDataBakerCvpcEditingTabTipGuard = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
