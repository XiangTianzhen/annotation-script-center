(function () {
  const HIDDEN_CLASS = "asr-edge-judgement-window-hidden";
  const STYLE_ID = "asr-edge-judgement-virtual-window-style";
  const DEFAULT_RADIUS = 5;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "." + HIDDEN_CLASS + " {",
      "  height: 0 !important;",
      "  min-height: 0 !important;",
      "  max-height: 0 !important;",
      "  margin-top: 0 !important;",
      "  margin-bottom: 0 !important;",
      "  padding-top: 0 !important;",
      "  padding-bottom: 0 !important;",
      "  border-top-width: 0 !important;",
      "  border-bottom-width: 0 !important;",
      "  overflow: hidden !important;",
      "  opacity: 0 !important;",
      "  pointer-events: none !important;",
      "}",
      "." + HIDDEN_CLASS + " > * {",
      "  visibility: hidden !important;",
      "}",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function parseQuestionNumber(text) {
    const match = String(text || "").match(/第\s*(\d+)\s*题/);
    return match ? Number(match[1]) : NaN;
  }

  function getItemQuestionNumber(item) {
    const status = item.querySelector(".labelRender-answerNav-status");
    const statusNumber = parseQuestionNumber(status?.textContent || "");
    if (Number.isFinite(statusNumber) && statusNumber > 0) {
      return statusNumber;
    }

    const indexNumber = Number(item.getAttribute("data-index"));
    return Number.isFinite(indexNumber) && indexNumber >= 0 ? indexNumber + 1 : NaN;
  }

  function getItems() {
    return Array.from(document.querySelectorAll(".labelRender-item[data-index]"));
  }

  function findCurrentItem(items) {
    const selected = document.querySelector(".labelRender-item-selected[data-index]");
    if (selected && items.indexOf(selected) >= 0) {
      return selected;
    }

    const viewportMiddle = window.innerHeight / 2;
    let bestItem = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    items.forEach(function (item) {
      if (item.classList.contains(HIDDEN_CLASS)) {
        return;
      }

      const rect = item.getBoundingClientRect();
      if (rect.height <= 0) {
        return;
      }

      const itemMiddle = rect.top + rect.height / 2;
      const distance = Math.abs(itemMiddle - viewportMiddle);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestItem = item;
      }
    });

    return bestItem || items[0] || null;
  }

  function clearHidden(items) {
    items.forEach(function (item) {
      item.classList.remove(HIDDEN_CLASS);
      item.removeAttribute("data-asr-edge-window-hidden");
    });
  }

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    let enabled = false;
    let radius = DEFAULT_RADIUS;
    let observer = null;
    let timer = null;
    let lastState = {
      enabled: false,
      currentQuestionNumber: null,
      visibleFrom: null,
      visibleTo: null,
      itemCount: 0,
      hiddenCount: 0,
      updatedAt: null,
    };

    function applyWindow() {
      timer = null;
      const items = getItems();

      if (!enabled || (deps.shouldApply && !deps.shouldApply())) {
        clearHidden(items);
        lastState = {
          enabled: false,
          currentQuestionNumber: null,
          visibleFrom: null,
          visibleTo: null,
          itemCount: items.length,
          hiddenCount: 0,
          updatedAt: new Date().toISOString(),
        };
        return;
      }

      const currentItem = findCurrentItem(items);
      const currentQuestionNumber = currentItem ? getItemQuestionNumber(currentItem) : NaN;
      if (!Number.isFinite(currentQuestionNumber)) {
        clearHidden(items);
        lastState = {
          enabled: true,
          currentQuestionNumber: null,
          visibleFrom: null,
          visibleTo: null,
          itemCount: items.length,
          hiddenCount: 0,
          updatedAt: new Date().toISOString(),
        };
        return;
      }

      const visibleFrom = Math.max(1, currentQuestionNumber - radius);
      const visibleTo = currentQuestionNumber + radius;
      let hiddenCount = 0;

      items.forEach(function (item) {
        const questionNumber = getItemQuestionNumber(item);
        const shouldHide =
          Number.isFinite(questionNumber) &&
          (questionNumber < visibleFrom || questionNumber > visibleTo);

        item.classList.toggle(HIDDEN_CLASS, shouldHide);
        if (shouldHide) {
          item.setAttribute("data-asr-edge-window-hidden", "true");
          hiddenCount += 1;
        } else {
          item.removeAttribute("data-asr-edge-window-hidden");
        }
      });

      lastState = {
        enabled: true,
        currentQuestionNumber: currentQuestionNumber,
        visibleFrom: visibleFrom,
        visibleTo: visibleTo,
        itemCount: items.length,
        hiddenCount: hiddenCount,
        updatedAt: new Date().toISOString(),
      };
    }

    function scheduleApply() {
      if (timer) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(applyWindow, 120);
    }

    function bindObserver() {
      if (observer) {
        return;
      }

      observer = new MutationObserver(scheduleApply);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "data-index"],
        characterData: true,
      });
      window.addEventListener("scroll", scheduleApply, true);
    }

    function unbindObserver() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }

      window.removeEventListener("scroll", scheduleApply, true);
    }

    function start(config) {
      enabled = config?.virtualWindowEnabled === true;
      radius = DEFAULT_RADIUS;

      if (!enabled) {
        stop();
        return;
      }

      ensureStyle();
      bindObserver();
      scheduleApply();
    }

    function stop() {
      enabled = false;
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }

      unbindObserver();
      clearHidden(getItems());
      lastState = {
        enabled: false,
        currentQuestionNumber: null,
        visibleFrom: null,
        visibleTo: null,
        itemCount: getItems().length,
        hiddenCount: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    function getState() {
      return Object.assign({}, lastState);
    }

    return {
      start: start,
      stop: stop,
      getState: getState,
    };
  }

  globalThis.__ASREdgeAlibabaLabelxJudgementVirtualWindow = {
    createRuntime: createRuntime,
    parseQuestionNumber: parseQuestionNumber,
    getItemQuestionNumber: getItemQuestionNumber,
  };
})();
