(function () {
  const LOG_PREFIX = "[ASR Edge][transcription]";
  const constants = globalThis.ASREdgeConstants || {};
  const configApi = globalThis.__ASREdgeAlibabaLabelxTranscriptionRuntimeConfig || null;
  const activeItemApi = globalThis.__ASREdgeAlibabaLabelxTranscriptionActiveItem || null;
  const itemActions = globalThis.__ASREdgeAlibabaLabelxTranscriptionItemActions || null;
  const audioApi = globalThis.__ASREdgeAlibabaLabelxTranscriptionAudioController || null;
  const messageTypes = constants.MESSAGE_TYPES || {};
  const PANEL_PING = messageTypes.PANEL_PING || "ASR_EDGE_SETTINGS_PANEL_PING";
  const PROJECT_ID = configApi?.PROJECT_ID || "transcription";
  const TARGET_HOST = constants?.TARGET_PLATFORM?.host || "labelx.alibaba-inc.com";

  const runtime = {
    injected: true,
    enabled: false,
    matched: false,
    reason: "waiting-for-transcription-detail",
    config: null,
    toolbarNode: null,
    autoPlayObserver: null,
    refreshTimer: null,
    refreshInFlight: false,
    refreshQueued: false,
    mutationObserver: null,
    pollTimer: null,
    lastHref: String(location.href || ""),
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

  function isVisibleEditableTextarea(node) {
    if (!(node instanceof HTMLTextAreaElement) || node.disabled || node.readOnly) {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function hasJudgementHint() {
    if (document.querySelector("#asr-edge-judgement-toolbar")) {
      return true;
    }
    const nodes = Array.from(document.querySelectorAll(".mark-toolbox, .labelRender-item, body")).slice(0, 8);
    return nodes.some(function (node) {
      const text = String(node.textContent || "").replace(/\s+/g, "");
      return text.includes("哪个ASR更优");
    });
  }

  function evaluatePageMatch() {
    if (location.hostname !== TARGET_HOST) {
      return { matched: false, reason: "host-not-matched" };
    }

    const path = String(location.pathname || "").toLowerCase();
    if (!path.includes("/corpora/labeling/")) {
      return { matched: false, reason: "waiting-for-transcription-detail" };
    }

    if (hasJudgementHint()) {
      return { matched: false, reason: "judgement-page" };
    }

    const hasItemTextarea = Boolean(document.querySelector(".labelRender-item textarea"));
    const hasEditableTextarea = Array.from(document.querySelectorAll("textarea")).some(
      isVisibleEditableTextarea
    );

    if (!hasItemTextarea && !hasEditableTextarea) {
      return { matched: false, reason: "waiting-for-transcription-detail" };
    }

    return { matched: true, reason: "matched" };
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
      void runAction(action);
    });
    return button;
  }

  function mountToolbar() {
    if (runtime.toolbarNode && document.contains(runtime.toolbarNode)) {
      return;
    }

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
    ].forEach(function (entry) {
      host.appendChild(createToolbarButton(entry[0], entry[1]));
    });

    document.documentElement.appendChild(host);
    runtime.toolbarNode = host;
  }

  async function runAction(action) {
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
      void audioApi.autoPlayCurrentAudioIfNeeded(true);
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    runtime.autoPlayObserver = observer;
  }

  function disableRuntime(reason) {
    runtime.enabled = false;
    runtime.autoPlayObserver?.disconnect();
    runtime.autoPlayObserver = null;
    clearToolbar();
    runtime.reason = reason || runtime.reason || "waiting-for-transcription-detail";
  }

  function enableRuntime() {
    runtime.enabled = true;
    runtime.reason = "matched";
    mountToolbar();
    bindAutoPlay();
    void audioApi.autoPlayCurrentAudioIfNeeded(runtime.config?.autoPlay === true);
  }

  function scheduleRefresh(trigger, delay) {
    clearTimeout(runtime.refreshTimer);
    runtime.refreshTimer = setTimeout(function () {
      void refreshRuntime(trigger || "retry");
    }, typeof delay === "number" ? delay : 120);
  }

  async function refreshRuntime(trigger) {
    if (runtime.refreshInFlight) {
      runtime.refreshQueued = true;
      return;
    }
    runtime.refreshInFlight = true;

    try {
      if (!configApi || !activeItemApi || !itemActions || !audioApi) {
        disableRuntime("module-missing");
        warn("required module missing");
        return;
      }

      const loaded = await configApi.loadConfig();
      runtime.config = loaded.config;

      if (loaded.enabledBySettings !== true) {
        runtime.matched = false;
        disableRuntime("script-disabled");
        return;
      }

      if (loaded.activeProjectId !== PROJECT_ID) {
        runtime.matched = false;
        disableRuntime("inactive-project");
        return;
      }

      const page = evaluatePageMatch();
      runtime.matched = page.matched;
      runtime.reason = page.reason;

      if (!page.matched) {
        disableRuntime(page.reason);
        return;
      }

      enableRuntime();
    } catch (error) {
      disableRuntime("runtime-error");
      warn("runtime refresh failed", {
        trigger: trigger,
        message: error && error.message ? error.message : String(error),
      });
    } finally {
      runtime.refreshInFlight = false;
      if (runtime.refreshQueued) {
        runtime.refreshQueued = false;
        scheduleRefresh("queued-refresh", 0);
      }
    }
  }

  function patchHistoryForSpa() {
    if (window.__asrEdgeTranscriptionHistoryPatched) {
      return;
    }
    window.__asrEdgeTranscriptionHistoryPatched = true;

    ["pushState", "replaceState"].forEach(function (methodName) {
      const original = history[methodName];
      if (typeof original !== "function") {
        return;
      }

      history[methodName] = function () {
        const result = original.apply(this, arguments);
        scheduleRefresh("history-" + methodName, 30);
        return result;
      };
    });

    window.addEventListener("popstate", function () {
      scheduleRefresh("history-popstate", 30);
    });
  }

  function startRetryWatchers() {
    document.addEventListener("DOMContentLoaded", function () {
      scheduleRefresh("dom-content-loaded", 0);
    });

    window.addEventListener("load", function () {
      scheduleRefresh("window-load", 0);
    });

    if (runtime.mutationObserver) {
      runtime.mutationObserver.disconnect();
    }

    runtime.mutationObserver = new MutationObserver(function () {
      scheduleRefresh("dom-mutated", 80);
    });

    runtime.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    patchHistoryForSpa();

    runtime.pollTimer = setInterval(function () {
      const href = String(location.href || "");
      if (href !== runtime.lastHref) {
        runtime.lastHref = href;
        scheduleRefresh("href-changed", 30);
      }
    }, 1200);
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
        sendResponse({
          ok: true,
          scriptId: PROJECT_ID,
          injected: true,
          enabled: runtime.enabled === true,
          matched: runtime.matched === true,
          reason:
            runtime.matched === true
              ? "matched"
              : runtime.reason || "waiting-for-transcription-detail",
        });
        return false;
      }

      return undefined;
    });
  }

  bindMessageBridge();
  startRetryWatchers();
  scheduleRefresh("script-load", 0);
})();
