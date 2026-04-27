(function () {
  const runtimeContract =
    globalThis.__ASREdgeAlibabaLabelxRuntimeContract || {
      PAGE_WORLD_BRIDGE: {
        channel: "alibaba-labelx",
        version: "1",
        globalKey: "__ASREdgeAlibabaLabelxPageBridge",
        readyEvent: "ASREdge:AlibabaLabelx:PageBridgeReady",
        requestEvent: "ASREdge:AlibabaLabelx:PageBridgeRequest",
        responseEvent: "ASREdge:AlibabaLabelx:PageBridgeResponse",
        statusAttribute: "data-asr-edge-page-bridge",
      },
    };
  const bridgeConfig = runtimeContract.PAGE_WORLD_BRIDGE;
  const existingBridge = window[bridgeConfig.globalKey];

  if (existingBridge) {
    return;
  }

  const state = {
    status: "bootstrapping",
    readyAt: null,
    supports: [
      "document-start-main-world",
      "custom-event-bridge",
      "page-world-fetch-hook-slot",
    ],
    lastRequestId: null,
    lastRequestType: null,
  };

  function cloneState() {
    return {
      status: state.status,
      readyAt: state.readyAt,
      supports: state.supports.slice(),
      lastRequestId: state.lastRequestId,
      lastRequestType: state.lastRequestType,
    };
  }

  function writeStatusAttribute(status) {
    if (!document.documentElement) {
      return;
    }

    document.documentElement.setAttribute(bridgeConfig.statusAttribute, status);
  }

  function dispatch(eventName, detail) {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: detail,
      })
    );
  }

  function emitResponse(requestId, type, extraDetail) {
    const detail = {
      channel: bridgeConfig.channel,
      requestId: requestId || null,
      type: type,
      bridge: cloneState(),
    };

    if (extraDetail && typeof extraDetail === "object") {
      Object.keys(extraDetail).forEach(function (key) {
        detail[key] = extraDetail[key];
      });
    }

    dispatch(bridgeConfig.responseEvent, detail);
  }

  function handleRequest(event) {
    const detail = event && event.detail && typeof event.detail === "object" ? event.detail : null;
    if (!detail || detail.channel !== bridgeConfig.channel) {
      return;
    }

    state.lastRequestId = typeof detail.requestId === "string" ? detail.requestId : null;
    state.lastRequestType = typeof detail.type === "string" ? detail.type : null;

    if (detail.type === "ping") {
      emitResponse(detail.requestId, "pong", {
        ok: true,
      });
      return;
    }

    if (detail.type === "get-state") {
      emitResponse(detail.requestId, "state", {
        ok: true,
      });
      return;
    }

    emitResponse(detail.requestId, "unsupported-request", {
      ok: false,
      reason: "unsupported-request",
      requestedType: detail.type || null,
    });
  }

  Object.defineProperty(window, bridgeConfig.globalKey, {
    value: {
      getState: function () {
        return cloneState();
      },
      emitResponse: function (requestId, type, extraDetail) {
        emitResponse(requestId, type, extraDetail);
      },
      CONFIG: bridgeConfig,
    },
    configurable: false,
    enumerable: false,
    writable: false,
  });

  window.addEventListener(bridgeConfig.requestEvent, handleRequest);

  state.status = "ready";
  state.readyAt = new Date().toISOString();
  writeStatusAttribute(state.status);

  dispatch(bridgeConfig.readyEvent, {
    channel: bridgeConfig.channel,
    bridge: cloneState(),
  });
})();
