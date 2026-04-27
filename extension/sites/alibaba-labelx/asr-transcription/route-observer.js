(function () {
  const LOG_PREFIX = "[ASR Edge][route-observer]";
  const siteContract = window.__ASREdgeAlibabaLabelxSiteContract;

  if (!siteContract) {
    console.warn(LOG_PREFIX, "Site contract is not loaded.");
    return;
  }

  function getRouteInfo() {
    return siteContract.getRouteInfo(location);
  }

  function createRouteObserver(callback) {
    let lastRouteKey = null;
    let lastPathname = null;
    let lastSearch = null;

    function onRouteChange(trigger) {
      const routeInfo = getRouteInfo();

      if (
        routeInfo.pathname === lastPathname &&
        routeInfo.search === lastSearch &&
        routeInfo.routeKey === lastRouteKey
      ) {
        return;
      }

      lastPathname = routeInfo.pathname;
      lastSearch = routeInfo.search;
      lastRouteKey = routeInfo.routeKey;

      console.info(LOG_PREFIX, `Route changed (${trigger}):`, routeInfo);

      if (typeof callback === "function") {
        callback(routeInfo, trigger);
      }
    }

    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      onRouteChange("pushState");
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      onRouteChange("replaceState");
    };

    window.addEventListener("popstate", function () {
      onRouteChange("popstate");
    });

    window.addEventListener("hashchange", function () {
      onRouteChange("hashchange");
    });

    return {
      triggerInitial: function () {
        onRouteChange("initial");
      },
      getCurrentRoute: getRouteInfo,
      getLastRouteKey: function () {
        return lastRouteKey;
      },
      getLastSearch: function () {
        return lastSearch;
      },
    };
  }

  window.__ASREdgeRouteObserver = {
    createRouteObserver,
    getRouteInfo,
  };
})();
