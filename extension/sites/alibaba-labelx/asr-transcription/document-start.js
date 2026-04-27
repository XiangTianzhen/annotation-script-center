(function () {
  const LOG_PREFIX = "[ASR Edge][document-start]";
  const PAGE_EVENT = "ASR_EDGE_PAGE_EVENT";
  const PAGE_COMMAND = "ASR_EDGE_PAGE_COMMAND";
  const PAGE_SCRIPT_PATH = "sites/alibaba-labelx/asr-transcription/page-world-hook.js";
  const BRIDGE_KEY = "__ASREdgeAlibabaLabelxLegacyBridge";
  const constants = globalThis.ASREdgeConstants || {};

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function createInitialState() {
    return {
      ready: false,
      pendingSaveCount: 0,
      pendingSaveUrl: null,
      pendingSaves: {},
      cachedDataList: [],
      currentPageTasks: [],
      subTaskMeta: null,
      itemDurations: {},
      lastTimerEventAt: null,
      lastDataLoadedAt: null,
      lastWarning: null,
      autosaveInterceptionEnabled: true,
    };
  }

  function injectPageScript() {
    if (!document.documentElement || document.getElementById("asr-edge-page-world-hook")) {
      return;
    }

    const script = document.createElement("script");
    script.id = "asr-edge-page-world-hook";
    script.src = chrome.runtime.getURL(PAGE_SCRIPT_PATH);
    script.async = false;
    script.dataset.asrEdgePageHook = "true";
    script.addEventListener("load", function () {
      script.remove();
    });
    (document.head || document.documentElement).appendChild(script);
  }

  function dispatchCommand(type, payload) {
    window.dispatchEvent(
      new CustomEvent(PAGE_COMMAND, {
        detail: {
          type: type,
          payload: payload || null,
        },
      })
    );
  }

  function createBridge() {
    const listeners = new Set();
    const manualSaveResolvers = new Map();
    const state = createInitialState();
    let nextRequestId = 1;

    function notify(detail) {
      listeners.forEach(function (listener) {
        try {
          listener(clone(detail), clone(state));
        } catch (error) {
          console.warn(LOG_PREFIX, "Bridge listener failed:", error);
        }
      });
    }

    function updateState(detail) {
      const type = detail && detail.type;
      const payload = detail && detail.payload ? detail.payload : {};

      if (type === "bridge-ready") {
        state.ready = true;
      } else if (type === "pending-save-count") {
        state.pendingSaveCount = Number.isFinite(payload.count) ? payload.count : 0;
        state.pendingSaveUrl = typeof payload.url === "string" ? payload.url : state.pendingSaveUrl;
      } else if (type === "pending-saves-snapshot") {
        state.pendingSaves = payload.pendingSaves && typeof payload.pendingSaves === "object" ? payload.pendingSaves : {};
        state.pendingSaveCount = Object.keys(state.pendingSaves).length;
        state.pendingSaveUrl = typeof payload.pendingSaveUrl === "string" ? payload.pendingSaveUrl : state.pendingSaveUrl;
      } else if (type === "manual-save-result") {
        state.pendingSaveCount = payload.success ? 0 : state.pendingSaveCount;
        if (payload.success) {
          state.pendingSaves = {};
        }
        const resolver = manualSaveResolvers.get(payload.requestId);
        if (resolver) {
          manualSaveResolvers.delete(payload.requestId);
          resolver.resolve(clone(payload));
        }
      } else if (type === "data-list-ready") {
        state.cachedDataList = Array.isArray(payload.dataList) ? payload.dataList : [];
        state.pendingSaveUrl = typeof payload.pendingSaveUrl === "string" ? payload.pendingSaveUrl : state.pendingSaveUrl;
      } else if (type === "subtask-meta-ready") {
        state.subTaskMeta = payload.meta || null;
      } else if (type === "current-page-tasks-ready") {
        state.currentPageTasks = Array.isArray(payload.tasks) ? payload.tasks : [];
      } else if (type === "item-durations-ready") {
        state.itemDurations = payload.itemDurations && typeof payload.itemDurations === "object" ? payload.itemDurations : {};
      } else if (type === "timer-triggered") {
        state.lastTimerEventAt = payload.timestamp || new Date().toISOString();
      } else if (type === "data-loaded") {
        state.lastDataLoadedAt = payload.timestamp || new Date().toISOString();
      } else if (type === "warning") {
        state.lastWarning = payload;
      } else if (type === "autosave-config-updated") {
        state.autosaveInterceptionEnabled = payload.enabled !== false;
      }

      notify(detail);
    }

    window.addEventListener(PAGE_EVENT, function (event) {
      const detail = event && event.detail ? event.detail : null;
      if (!detail || typeof detail.type !== "string") {
        return;
      }

      updateState(detail);
    });

    return {
      subscribe: function (listener) {
        if (typeof listener !== "function") {
          return function () {
            return false;
          };
        }

        listeners.add(listener);
        return function () {
          return listeners.delete(listener);
        };
      },
      getSnapshot: function () {
        return clone(state);
      },
      getCachedDataList: function () {
        return clone(state.cachedDataList);
      },
      getCurrentPageTasks: function () {
        return clone(state.currentPageTasks);
      },
      getSubTaskMeta: function () {
        return clone(state.subTaskMeta);
      },
      getItemDurations: function () {
        return clone(state.itemDurations);
      },
      getPendingSaveCount: function () {
        return state.pendingSaveCount;
      },
      injectPendingSaves: function (payload) {
        dispatchCommand("inject-pending-saves", payload || {});
      },
      clearPendingSaves: function (reason) {
        dispatchCommand("clear-pending-saves", { reason: reason || "manual-clear" });
      },
      setAutosaveInterceptionEnabled: function (enabled) {
        state.autosaveInterceptionEnabled = enabled !== false;
        dispatchCommand("set-autosave-interception", { enabled: enabled !== false });
      },
      requestManualSave: function (payload) {
        const requestId = nextRequestId;
        nextRequestId += 1;

        return new Promise(function (resolve, reject) {
          const timeoutId = window.setTimeout(function () {
            manualSaveResolvers.delete(requestId);
            reject(new Error("Manual save request timed out."));
          }, 30000);

          manualSaveResolvers.set(requestId, {
            resolve: function (result) {
              window.clearTimeout(timeoutId);
              resolve(result);
            },
          });

          dispatchCommand(
            "manual-save-request",
            Object.assign({}, payload || {}, { requestId: requestId })
          );
        });
      },
      LOG_PREFIX: LOG_PREFIX,
    };
  }

  if (window.top !== window.self) {
    return;
  }

  function isTranscriptionRuntimeEnabled(settings) {
    const platform = settings?.platforms?.alibabaLabelx || {};
    const activeProjectId =
      platform?.scriptCenter?.activeProjectId ||
      constants.TRANSCRIPTION_PROJECT_ID ||
      "transcription";

    return (
      platform.enabled !== false &&
      activeProjectId === (constants.TRANSCRIPTION_PROJECT_ID || "transcription")
    );
  }

  function startBridge(settings) {
    if (!isTranscriptionRuntimeEnabled(settings)) {
      console.info(LOG_PREFIX, "Document-start bridge skipped because transcription is not active.");
      return;
    }

    injectPageScript();

    const bridge = createBridge();
    window[BRIDGE_KEY] = bridge;
    const enabled =
      settings?.platforms?.alibabaLabelx?.safety?.interceptPlatformAutosave !== false;
    bridge.setAutosaveInterceptionEnabled(enabled);

    console.info(LOG_PREFIX, "Document-start bridge initialized.");
  }

  const storage = globalThis.ASREdgeStorage || null;
  if (storage && typeof storage.getSettings === "function") {
    storage
      .getSettings()
      .then(function (settings) {
        startBridge(settings);
      })
      .catch(function (error) {
        console.warn(LOG_PREFIX, "Failed to read storage for document-start bridge:", error);
        startBridge(constants.DEFAULT_SETTINGS || {});
      });
  } else {
    startBridge(constants.DEFAULT_SETTINGS || {});
  }
})();
