(function () {
  const LOG_PREFIX = "[ASR Edge][page-world-hook]";
  const PAGE_EVENT = "ASR_EDGE_PAGE_EVENT";
  const PAGE_COMMAND = "ASR_EDGE_PAGE_COMMAND";
  const HOOK_KEY = "__ASREdgeAlibabaLabelxPageWorldHook";

  if (window[HOOK_KEY]) {
    return;
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function dispatch(type, payload) {
    window.dispatchEvent(
      new CustomEvent(PAGE_EVENT, {
        detail: {
          type: type,
          payload: payload || null,
        },
      })
    );
  }

  function readHeadersValue(headers, key) {
    if (!headers || typeof key !== "string") {
      return null;
    }

    if (typeof headers.get === "function") {
      return headers.get(key);
    }

    if (typeof Headers !== "undefined" && headers instanceof Headers) {
      return headers.get(key);
    }

    const lookupKey = key.toLowerCase();
    const matchedKey = Object.keys(headers).find(function (headerKey) {
      return String(headerKey).toLowerCase() === lookupKey;
    });
    return matchedKey ? headers[matchedKey] : null;
  }

  function createSuccessResponse() {
    return new Response(JSON.stringify({ code: 0, data: true, success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  function createInitialState() {
    return {
      origFetch: window.fetch.bind(window),
      pendingSaves: {},
      pendingSaveUrl: "",
      cachedDataList: [],
      subTaskMeta: null,
      currentPageTasks: [],
      itemDurations: {},
      autosaveInterceptionEnabled: true,
      lastTaskDataSignature: null,
    };
  }

  function getPendingSaveKey(item, index) {
    if (!item || typeof item !== "object") {
      return "unknown:" + index;
    }

    if (item.dataId !== undefined && item.dataId !== null) {
      return String(item.dataId);
    }

    if (item.id !== undefined && item.id !== null) {
      return String(item.id);
    }

    if (item.data && item.data.raw_audio_path) {
      return String(item.data.raw_audio_path);
    }

    return "index:" + index;
  }

  function extractTaskDataSignature(data) {
    if (!data || typeof data !== "object") {
      return null;
    }

    const subTaskId = data.id || data.subTaskId || "";
    const batchId = data.batchId || "";
    return String(subTaskId) + ":" + String(batchId);
  }

  function computeItemDurations(dataList) {
    const durations = {};

    if (!Array.isArray(dataList)) {
      return durations;
    }

    dataList.forEach(function (item) {
      const rawAudioPath = item?.data?.raw_audio_path;
      const duration = item?.data?.duration;

      if (!rawAudioPath || duration === undefined || duration === null) {
        return;
      }

      const filename = String(rawAudioPath).split("/").pop().split("?")[0];
      const numericDuration = Number.parseFloat(duration);
      if (filename && Number.isFinite(numericDuration)) {
        durations[filename] = numericDuration;
      }
    });

    return durations;
  }

  function shouldInterceptAutosave(state, isManualRequest) {
    if (isManualRequest) {
      return false;
    }

    if (state.autosaveInterceptionEnabled === false) {
      return false;
    }

    return document.documentElement.getAttribute("data-asr-disable-autosave") === "true";
  }

  function mergePendingSaves(state, dataList, url) {
    if (typeof url === "string" && url.length > 0) {
      state.pendingSaveUrl = url;
    }

    if (!Array.isArray(dataList)) {
      return 0;
    }

    dataList.forEach(function (item, index) {
      state.pendingSaves[getPendingSaveKey(item, index)] = clone(item);
    });

    const count = Object.keys(state.pendingSaves).length;
    dispatch("pending-saves-snapshot", {
      pendingSaves: clone(state.pendingSaves),
      pendingSaveUrl: state.pendingSaveUrl,
    });
    dispatch("pending-save-count", {
      count: count,
      url: state.pendingSaveUrl,
    });

    return count;
  }

  function clearPendingSaves(state, reason) {
    state.pendingSaves = {};
    dispatch("pending-saves-snapshot", {
      pendingSaves: {},
      pendingSaveUrl: state.pendingSaveUrl,
    });
    dispatch("pending-save-count", {
      count: 0,
      url: state.pendingSaveUrl,
    });

    if (reason) {
      dispatch("warning", {
        code: "pending-saves-cleared",
        reason: reason,
      });
    }
  }

  async function handleManualSaveRequest(state, payload) {
    const requestId = payload?.requestId;
    const saveKeys = Object.keys(state.pendingSaves);

    if (!state.pendingSaveUrl) {
      dispatch("manual-save-result", {
        requestId: requestId,
        success: false,
        count: 0,
        msg: "Missing pending save URL.",
      });
      return;
    }

    if (saveKeys.length === 0) {
      dispatch("manual-save-result", {
        requestId: requestId,
        success: true,
        count: 0,
        msg: "",
      });
      return;
    }

    try {
      const response = await state.origFetch(state.pendingSaveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Manual-Save": "true",
          accept: "application/json, text/plain",
        },
        body: JSON.stringify({
          dataList: Object.values(state.pendingSaves),
          timestamp: Date.now(),
        }),
      });
      const result = await response.json();
      const success = Boolean(result?.success || result?.code === 0);

      if (success) {
        const count = saveKeys.length;
        clearPendingSaves(state, null);
        dispatch("manual-save-result", {
          requestId: requestId,
          success: true,
          count: count,
          msg: "",
        });
        return;
      }

      dispatch("manual-save-result", {
        requestId: requestId,
        success: false,
        count: saveKeys.length,
        msg: result?.message || "Unknown save failure.",
      });
    } catch (error) {
      dispatch("manual-save-result", {
        requestId: requestId,
        success: false,
        count: saveKeys.length,
        msg: error && error.message ? error.message : String(error),
      });
    }
  }

  function handleTaskDataResponse(state, json, requestUrl) {
    const data = json?.data;
    const dataList = Array.isArray(data?.dataList) ? data.dataList : null;

    if (!dataList) {
      return;
    }

    const nextSignature = extractTaskDataSignature(data);
    if (
      state.lastTaskDataSignature &&
      nextSignature &&
      state.lastTaskDataSignature !== nextSignature &&
      Object.keys(state.pendingSaves).length > 0
    ) {
      dispatch("warning", {
        code: "task-context-changed-with-pending-saves",
        previousTaskDataSignature: state.lastTaskDataSignature,
        nextTaskDataSignature: nextSignature,
        droppedPendingSaveCount: Object.keys(state.pendingSaves).length,
      });
      clearPendingSaves(state, "task-context-changed");
    }

    state.lastTaskDataSignature = nextSignature;
    state.cachedDataList = clone(dataList);
    state.pendingSaveUrl = requestUrl;
    state.subTaskMeta = {
      subTaskId: data.id || null,
      taskId: data.taskId || null,
      batchId: data.batchId || null,
      taskName: data.taskName || "",
      gmtCreate: data.gmtCreate || "",
    };
    state.itemDurations = computeItemDurations(dataList);

    dispatch("data-loaded", {
      timestamp: new Date().toISOString(),
    });
    dispatch("subtask-meta-ready", {
      meta: clone(state.subTaskMeta),
    });
    dispatch("item-durations-ready", {
      itemDurations: clone(state.itemDurations),
    });
    dispatch("data-list-ready", {
      dataList: clone(state.cachedDataList),
      pendingSaveUrl: state.pendingSaveUrl,
    });
  }

  function handleCurrentPageTasksResponse(state, json) {
    const tasks = Array.isArray(json?.data?.data) ? json.data.data : null;
    if (!tasks) {
      return;
    }

    state.currentPageTasks = clone(tasks);
    dispatch("current-page-tasks-ready", {
      tasks: clone(state.currentPageTasks),
    });
  }

  function maybeHandleResponse(state, requestUrl, method, response) {
    if (!response || typeof response.clone !== "function") {
      return;
    }

    const loweredUrl = requestUrl.toLowerCase();

    if (loweredUrl.includes("/api/v1/label/tasks/getlabeltaskinfo")) {
      dispatch("data-loaded", {
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (loweredUrl.includes("/api/v1/label/center/timer")) {
      dispatch("timer-triggered", {
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      loweredUrl.includes("/api/v1/label/center/subtask/") &&
      loweredUrl.includes("/data") &&
      method === "GET"
    ) {
      response
        .clone()
        .json()
        .then(function (json) {
          handleTaskDataResponse(state, json, requestUrl);
        })
        .catch(function (error) {
          dispatch("warning", {
            code: "task-data-parse-failed",
            message: error && error.message ? error.message : String(error),
          });
        });
      return;
    }

    if (loweredUrl.includes("/api/v1/label/center/subtasks?type=") && method === "GET") {
      response
        .clone()
        .json()
        .then(function (json) {
          handleCurrentPageTasksResponse(state, json);
        })
        .catch(function (error) {
          dispatch("warning", {
            code: "current-page-tasks-parse-failed",
            message: error && error.message ? error.message : String(error),
          });
        });
    }
  }

  function installCommandListener(state) {
    window.addEventListener(PAGE_COMMAND, function (event) {
      const detail = event && event.detail ? event.detail : null;
      if (!detail || typeof detail.type !== "string") {
        return;
      }

      if (detail.type === "manual-save-request") {
        void handleManualSaveRequest(state, detail.payload || {});
        return;
      }

      if (detail.type === "inject-pending-saves") {
        mergePendingSaves(state, detail.payload?.dataList, detail.payload?.url);
        return;
      }

      if (detail.type === "clear-pending-saves") {
        clearPendingSaves(state, detail.payload?.reason || "manual-clear");
        return;
      }

      if (detail.type === "set-autosave-interception") {
        state.autosaveInterceptionEnabled = detail.payload?.enabled !== false;
        dispatch("autosave-config-updated", {
          enabled: state.autosaveInterceptionEnabled,
        });
      }
    });
  }

  function installFetchHook(state) {
    window.fetch = async function (input, init) {
      const requestUrl =
        typeof input === "string" ? input : input && typeof input.url === "string" ? input.url : "";
      const method = String(init?.method || (input && input.method) || "GET").toUpperCase();
      const isManualRequest = readHeadersValue(init?.headers || input?.headers, "X-Manual-Save") === "true";

      if (
        requestUrl.includes("/api/v1/label/center/subTask/") &&
        requestUrl.includes("/data") &&
        method === "POST" &&
        shouldInterceptAutosave(state, isManualRequest)
      ) {
        try {
          const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
          mergePendingSaves(state, body?.dataList, requestUrl);
          return createSuccessResponse();
        } catch (error) {
          dispatch("warning", {
            code: "autosave-payload-parse-failed",
            message: error && error.message ? error.message : String(error),
          });
          return createSuccessResponse();
        }
      }

      const response = await state.origFetch(input, init);
      maybeHandleResponse(state, requestUrl, method, response);
      return response;
    };
  }

  const state = createInitialState();
  window[HOOK_KEY] = state;
  installCommandListener(state);
  installFetchHook(state);

  dispatch("bridge-ready", {
    timestamp: new Date().toISOString(),
  });
  dispatch("autosave-config-updated", {
    enabled: state.autosaveInterceptionEnabled,
  });

  console.info(LOG_PREFIX, "Page-world hook installed.");
})();
