(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-active-item]";
  const ITEM_SELECTOR = ".labelRender-item";
  const SELECTED_ITEM_SELECTOR = ".labelRender-item-selected";
  const listeners = [];
  let activeItem = null;
  let activeIndex = -1;
  let observer = null;
  let started = false;

  function resolveItems() {
    return Array.from(document.querySelectorAll(ITEM_SELECTOR));
  }

  function resolveItemIndex(item) {
    if (!item || !item.isConnected) {
      return -1;
    }

    return resolveItems().indexOf(item);
  }

  function findFocusedItem() {
    try {
      return document.activeElement ? document.activeElement.closest(ITEM_SELECTOR) : null;
    } catch (error) {
      return null;
    }
  }

  function findActiveCandidate() {
    return document.querySelector(SELECTED_ITEM_SELECTOR) || findFocusedItem() || null;
  }

  function emit(reason) {
    const snapshot = {
      item: activeItem,
      index: activeIndex,
      reason: reason || "manual",
    };

    listeners.slice().forEach(function (listener) {
      try {
        listener(snapshot);
      } catch (error) {
        console.warn(LOG_PREFIX, "Active item subscriber failed:", error);
      }
    });
  }

  function setActiveItem(nextItem, reason) {
    const nextIndex = resolveItemIndex(nextItem);
    const changed = activeItem !== nextItem || activeIndex !== nextIndex;

    activeItem = nextItem && nextIndex >= 0 ? nextItem : null;
    activeIndex = activeItem ? nextIndex : -1;

    if (!changed) {
      return {
        item: activeItem,
        index: activeIndex,
        changed: false,
      };
    }

    console.info(LOG_PREFIX, "Active item updated:", {
      reason: reason || "manual",
      index: activeIndex,
    });
    emit(reason || "manual");

    return {
      item: activeItem,
      index: activeIndex,
      changed: true,
    };
  }

  function refresh(reason) {
    const candidate = findActiveCandidate();

    if (!candidate && activeItem && activeItem.isConnected) {
      return {
        item: activeItem,
        index: activeIndex,
        changed: false,
      };
    }

    return setActiveItem(candidate, reason || "refresh");
  }

  function handlePointerEvent(event) {
    const candidate = event?.target?.closest ? event.target.closest(ITEM_SELECTOR) : null;
    if (!candidate) {
      return;
    }

    setActiveItem(candidate, "pointer");
  }

  function handleFocusEvent(event) {
    const candidate = event?.target?.closest ? event.target.closest(ITEM_SELECTOR) : null;
    if (!candidate) {
      return;
    }

    setActiveItem(candidate, "focus");
  }

  function startObserver() {
    if (observer || !document.body || !window.MutationObserver) {
      return;
    }

    observer = new MutationObserver(function () {
      refresh("mutation");
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  function start() {
    if (started) {
      return refresh("start-repeat");
    }

    started = true;
    document.addEventListener("click", handlePointerEvent, true);
    document.addEventListener("mousedown", handlePointerEvent, true);
    document.addEventListener("focusin", handleFocusEvent, true);
    startObserver();
    return refresh("start");
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return function () {
        return false;
      };
    }

    listeners.push(listener);
    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
        return true;
      }

      return false;
    };
  }

  function getSnapshot() {
    return {
      item: activeItem,
      index: activeIndex,
    };
  }

  window.__ASREdgeAlibabaLabelxAnnotationActiveItem = {
    start: start,
    refresh: refresh,
    subscribe: subscribe,
    getSnapshot: getSnapshot,
    getActiveItem: function () {
      return activeItem;
    },
    getActiveIndex: function () {
      return activeIndex;
    },
    ITEM_SELECTOR: ITEM_SELECTOR,
    SELECTED_ITEM_SELECTOR: SELECTED_ITEM_SELECTOR,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
