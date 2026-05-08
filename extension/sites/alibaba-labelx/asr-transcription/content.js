(function () {
  const LOG_PREFIX = "[ASR Edge][transcription]";
  const constants = globalThis.ASREdgeConstants || {};
  const configApi = globalThis.__ASREdgeAlibabaLabelxTranscriptionRuntimeConfig || null;
  const activeItemApi = globalThis.__ASREdgeAlibabaLabelxTranscriptionActiveItem || null;
  const itemActions = globalThis.__ASREdgeAlibabaLabelxTranscriptionItemActions || null;
  const audioApi = globalThis.__ASREdgeAlibabaLabelxTranscriptionAudioController || null;
  const shortcutBus = globalThis.__ASREdgeAlibabaLabelxTranscriptionShortcutBus || null;
  const settingsPanel = globalThis.__ASREdgeAlibabaLabelxSettingsPanel || null;
  const messageTypes = constants.MESSAGE_TYPES || {};
  const PANEL_PING = messageTypes.PANEL_PING || "ASR_EDGE_SETTINGS_PANEL_PING";
  const OPEN_SETTINGS_PANEL = messageTypes.OPEN_SETTINGS_PANEL || "ASR_EDGE_OPEN_SETTINGS_PANEL";
  const TOGGLE_SETTINGS_PANEL = messageTypes.TOGGLE_SETTINGS_PANEL || "ASR_EDGE_TOGGLE_SETTINGS_PANEL";
  const PROJECT_ID = configApi?.PROJECT_ID || "transcription";
  const TARGET_HOST = constants?.TARGET_PLATFORM?.host || "labelx.alibaba-inc.com";

  let runtime = {
    enabled: false,
    config: null,
    shortcutRuntime: null,
    overlayRuntime: null,
    toolbarNode: null,
    autoPlayObserver: null,
    stopStorageListen: null,
  };

  function warn(message, extra) {
    if (extra) {
      console.warn(LOG_PREFIX, message, extra);
      return;
    }
    console.warn(LOG_PREFIX, message);
  }

  function createToast() {
    let node = document.getElementById("asr-edge-transcription-toast");
    if (!node) {
      node = document.createElement("div");
      node.id = "asr-edge-transcription-toast";
      node.style.position = "fixed";
      node.style.top = "16px";
      node.style.right = "16px";
      node.style.zIndex = "2147483647";
      node.style.background = "rgba(17,24,39,.9)";
      node.style.color = "#fff";
      node.style.fontSize = "12px";
      node.style.padding = "8px 10px";
      node.style.borderRadius = "6px";
      node.style.display = "none";
      document.documentElement.appendChild(node);
    }
    return node;
  }

  function showToast(message) {
    const node = createToast();
    node.textContent = String(message || "");
    node.style.display = "block";
    clearTimeout(node.__hideTimer);
    node.__hideTimer = setTimeout(function () {
      node.style.display = "none";
    }, 1600);
  }

  function isTranscriptionDetailPage() {
    if (location.hostname !== TARGET_HOST) {
      return false;
    }
    const path = String(location.pathname || "").toLowerCase();
    if (!path.includes("/corpora/labeling/sdk")) {
      return false;
    }
    const hasTextareaInItem = Boolean(document.querySelector(".labelRender-item textarea"));
    if (!hasTextareaInItem) {
      return false;
    }
    const judgementHint = Array.from(document.querySelectorAll(".labelRender-item, .mark-toolbox, body"))
      .slice(0, 8)
      .some(function (node) {
        const text = String(node.textContent || "").replace(/\s+/g, "");
        return text.includes("哪个ASR更优");
      });
    if (judgementHint) {
      return false;
    }
    return true;
  }

  function clearToolbar() {
    if (runtime.toolbarNode) {
      runtime.toolbarNode.remove();
      runtime.toolbarNode = null;
    }
  }

  function createToolbarButton(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.border = "1px solid #d1d5db";
    button.style.background = "#fff";
    button.style.fontSize = "12px";
    button.style.padding = "4px 8px";
    button.style.borderRadius = "6px";
    button.style.cursor = "pointer";
    button.addEventListener("click", function () {
      runAction(action);
    });
    return button;
  }

  function mountToolbar() {
    clearToolbar();
    const host = document.createElement("div");
    host.id = "asr-edge-transcription-toolbar";
    host.style.position = "fixed";
    host.style.top = "14px";
    host.style.left = "50%";
    host.style.transform = "translateX(-50%)";
    host.style.zIndex = "2147483646";
    host.style.display = "flex";
    host.style.flexWrap = "wrap";
    host.style.gap = "6px";
    host.style.padding = "8px";
    host.style.maxWidth = "92vw";
    host.style.background = "rgba(255,255,255,.95)";
    host.style.border = "1px solid #d1d5db";
    host.style.borderRadius = "10px";
    host.style.boxShadow = "0 4px 20px rgba(0,0,0,.12)";

    [
      ["填入", "quickFill"],
      ["有效", "markValid"],
      ["无效", "markInvalid"],
      ["去空格", "removeSpaces"],
      ["转数字", "convertNumbers"],
      ["焦点", "toggleFocus"],
      ["播/停", "playPause"],
      ["后退", "seekBackward"],
      ["前进", "seekForward"],
      ["减速", "speedDown"],
      ["加速", "speedUp"],
      ["重置倍速", "speedReset"],
      ["减音", "volumeDown"],
      ["加音", "volumeUp"],
      ["重置音量", "volumeReset"],
      ["复制时长", "copyDuration"],
      ["设置", "togglePanel"],
    ].forEach(function (entry) {
      host.appendChild(createToolbarButton(entry[0], entry[1]));
    });

    document.documentElement.appendChild(host);
    runtime.toolbarNode = host;
  }

  async function runAction(action, payload) {
    if (!runtime.config) {
      return;
    }
    let result = null;
    switch (action) {
      case "quickFill":
        result = itemActions.quickFillCurrentItem();
        break;
      case "markValid":
        result = itemActions.markCurrentItemValid();
        break;
      case "markInvalid":
        result = itemActions.markCurrentItemInvalid();
        break;
      case "removeSpaces":
        result = itemActions.removeSpacesCurrentItem();
        break;
      case "convertNumbers":
        result = itemActions.convertNumberCurrentItem(runtime.config);
        break;
      case "toggleFocus":
        result = itemActions.toggleFocusCurrentItem();
        break;
      case "playPause":
        result = await audioApi.playPauseCurrentAudio();
        break;
      case "seekForward":
        result = audioApi.seekCurrentAudio(runtime.config.seekStepSeconds);
        break;
      case "seekBackward":
        result = audioApi.seekCurrentAudio(-runtime.config.seekStepSeconds);
        break;
      case "speedUp":
        result = audioApi.adjustPlaybackRate(runtime.config.rateStepValue);
        break;
      case "speedDown":
        result = audioApi.adjustPlaybackRate(-runtime.config.rateStepValue);
        break;
      case "speedReset":
        result = audioApi.setPlaybackRate(
          Number(runtime.config.playbackRateValue || runtime.config.resetRateValue || 1)
        );
        break;
      case "setRate":
        result = audioApi.setPlaybackRate(payload?.rate);
        break;
      case "volumeUp":
        result = audioApi.adjustVolumePercent(10);
        break;
      case "volumeDown":
        result = audioApi.adjustVolumePercent(-10);
        break;
      case "volumeReset":
        result = audioApi.setVolumePercent(runtime.config.volumeValue);
        break;
      case "copyDuration":
        result = await audioApi.copyCurrentAudioDuration();
        break;
      case "togglePanel":
        runtime.overlayRuntime?.toggle();
        result = { ok: true, message: "设置面板已切换。" };
        break;
      default:
        result = { ok: false, message: "未知动作。" };
        break;
    }
    if (result && result.message) {
      showToast(result.message);
    }
  }

  function bindAutoPlay() {
    if (runtime.autoPlayObserver) {
      runtime.autoPlayObserver.disconnect();
      runtime.autoPlayObserver = null;
    }
    const observer = new MutationObserver(function () {
      if (!runtime.enabled || !runtime.config?.autoPlay) {
        return;
      }
      audioApi.autoPlayCurrentAudioIfNeeded(true);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    runtime.autoPlayObserver = observer;
  }

  function stopRuntime(reason) {
    runtime.enabled = false;
    runtime.shortcutRuntime?.unbind();
    runtime.shortcutRuntime = null;
    runtime.overlayRuntime?.stop();
    runtime.overlayRuntime = null;
    runtime.autoPlayObserver?.disconnect();
    runtime.autoPlayObserver = null;
    runtime.stopStorageListen?.();
    runtime.stopStorageListen = null;
    clearToolbar();
    if (reason) {
      warn("runtime stopped", { reason: reason });
    }
  }

  async function startRuntime() {
    if (!configApi || !activeItemApi || !itemActions || !audioApi || !shortcutBus || !settingsPanel) {
      warn("required module missing");
      return;
    }

    const loaded = await configApi.loadConfig();
    runtime.config = loaded.config;
    if (loaded.activeProjectId !== PROJECT_ID) {
      stopRuntime("inactive-project");
      return;
    }
    if (!isTranscriptionDetailPage()) {
      stopRuntime("not-matched");
      warn("未命中转写详情页，转写运行时不启动。");
      return;
    }

    runtime.enabled = true;
    mountToolbar();
    runtime.overlayRuntime = settingsPanel.createOverlayRuntime({
      onSaved: function (nextConfig) {
        runtime.config = clone(nextConfig);
      },
    });
    runtime.overlayRuntime.start();

    runtime.shortcutRuntime = shortcutBus.createRuntime({
      getConfig: function () {
        return runtime.config;
      },
      onAction: function (action, payload) {
        runAction(action, payload);
      },
    });
    runtime.shortcutRuntime.bind();
    bindAutoPlay();
    audioApi.autoPlayCurrentAudioIfNeeded(runtime.config.autoPlay);
    runtime.stopStorageListen = configApi.subscribeStorage(function () {
      startRuntime();
    });
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function bindMessageBridge() {
    if (!chrome?.runtime?.onMessage) {
      return;
    }
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (!message || typeof message !== "object") {
        return undefined;
      }
      if (message.type === PANEL_PING) {
        if (!runtime.enabled) {
          return undefined;
        }
        sendResponse({
          ok: true,
          scriptId: PROJECT_ID,
          enabled: runtime.enabled,
        });
        return false;
      }
      if (message.type === OPEN_SETTINGS_PANEL) {
        runtime.overlayRuntime?.open();
        sendResponse({ ok: true });
        return false;
      }
      if (message.type === TOGGLE_SETTINGS_PANEL) {
        runtime.overlayRuntime?.toggle();
        sendResponse({ ok: true });
        return false;
      }
      return undefined;
    });
  }

  bindMessageBridge();
  startRuntime().catch(function (error) {
    warn("runtime start failed", {
      message: error && error.message ? error.message : String(error),
    });
  });
})();
