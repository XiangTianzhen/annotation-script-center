(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-toolbar]";
  const HOST_ID = "asr-edge-annotation-toolbar";
  const interactionRunner = window.__ASREdgeAlibabaLabelxAnnotationInteractionRunner;
  const audioController = window.__ASREdgeAlibabaLabelxAnnotationAudioController;
  const durationController = window.__ASREdgeAlibabaLabelxAnnotationDurationController;
  const runtimeConfig = window.__ASREdgeAlibabaLabelxAnnotationRuntimeConfig;
  let started = false;
  let observer = null;
  let ui = null;

  if (!interactionRunner || !audioController || !durationController || !runtimeConfig) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function findPlacement() {
    const firstAnnotationItem = document.querySelector(".labelRender-item");
    if (firstAnnotationItem?.parentNode) {
      return {
        parent: firstAnnotationItem.parentNode,
        before: firstAnnotationItem,
      };
    }

    const headerAnchor =
      document.querySelector(".mark-toolbox-statistic") ||
      document.querySelector("[class*='mark-toolbox']") ||
      document.querySelector("[class*='toolbox']") ||
      document.querySelector("[class*='detail-header']") ||
      document.querySelector("[class*='pagination']") ||
      document.querySelector("header");

    if (headerAnchor?.parentNode) {
      return {
        parent: headerAnchor.parentNode,
        after: headerAnchor,
      };
    }

    const main = document.querySelector("main");
    if (main instanceof HTMLElement) {
      return {
        parent: main,
        prepend: true,
      };
    }

    return null;
  }

  function getControlPanelApi() {
    return window.__ASREdgeAlibabaLabelxAnnotationControlPanelApi || null;
  }

  function getSettingsPanelApi() {
    const settingsPanel = window.__ASREdgeAlibabaLabelxSettingsPanel;
    return settingsPanel && typeof settingsPanel.getMountedPanel === "function"
      ? settingsPanel.getMountedPanel()
      : null;
  }

  function ensureHost() {
    const existing = document.getElementById(HOST_ID);
    if (existing) {
      return existing;
    }

    const host = document.createElement("div");
    host.id = HOST_ID;
    const placement = findPlacement();

    if (placement?.before) {
      placement.parent.insertBefore(host, placement.before);
    } else if (placement?.after && placement.after.parentNode) {
      placement.after.parentNode.insertBefore(host, placement.after.nextSibling);
    } else if (placement?.prepend && placement.parent) {
      placement.parent.insertBefore(host, placement.parent.firstChild);
    } else {
      document.documentElement.appendChild(host);
    }

    return host;
  }

  function updateDurationButton() {
    if (!ui?.durationButton) {
      return;
    }

    const durationState = durationController.getSnapshot();
    ui.durationButton.textContent = "复制时长 " + durationState.secondsText + "s";
  }

  function updateAudioStatus() {
    if (!ui?.audioStatus) {
      return;
    }

    const audioState = audioController.getState();
    ui.audioStatus.textContent = audioState.hasAudio
      ? "音频 " +
        (audioState.paused ? "暂停" : "播放") +
        " | " +
        audioState.playbackRate.toFixed(1) +
        "x | " +
        audioState.volumeValue +
        "%"
      : "当前没有活跃音频";
  }

  function updateStatus(summaryText) {
    if (!ui?.status) {
      return;
    }

    ui.status.textContent = summaryText || "等待页面动作。";
  }

  function renderHost() {
    const host = ensureHost();
    if (host.shadowRoot) {
      ui = {
        status: host.shadowRoot.querySelector("[data-role='status']"),
        audioStatus: host.shadowRoot.querySelector("[data-role='audio-status']"),
        durationButton: host.shadowRoot.querySelector("[data-action='copy-duration']"),
      };
      updateDurationButton();
      updateAudioStatus();
      return host;
    }

    const shadowRoot = host.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = [
      "<style>",
      ":host { all: initial; }",
      ".toolbar { margin: 12px 0 0; display: grid; gap: 8px; padding: 10px 12px; border-radius: 12px; background: rgba(248, 250, 252, 0.96); border: 1px solid rgba(148, 163, 184, 0.24); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); font: 500 12px/1.4 'Segoe UI', sans-serif; color: #0f172a; }",
      ".row { display: flex; flex-wrap: wrap; gap: 6px; }",
      ".button { all: unset; display: inline-flex; align-items: center; justify-content: center; min-height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid rgba(15, 23, 42, 0.12); background: #ffffff; color: #0f172a; cursor: pointer; }",
      ".button:hover { border-color: #1677ff; color: #1677ff; }",
      ".status { padding: 8px 10px; border-radius: 10px; background: #e2e8f0; color: #0f172a; }",
      ".audio-status { color: #475569; }",
      "</style>",
      '<div class="toolbar">',
      '  <div class="row">',
      '    <button type="button" class="button" data-action="quickfill-active">当前快速填入</button>',
      '    <button type="button" class="button" data-action="set-valid-active">当前标有效</button>',
      '    <button type="button" class="button" data-action="set-invalid-active">当前标无效</button>',
      '    <button type="button" class="button" data-action="remove-active-spaces">当前去空格</button>',
      '    <button type="button" class="button" data-action="convert-active-numbers">当前数字转换</button>',
      '    <button type="button" class="button" data-action="toggle-focus">切换焦点</button>',
      "  </div>",
      '  <div class="row">',
      '    <button type="button" class="button" data-action="mark-all-valid-fill">全页标有效并填充</button>',
      '    <button type="button" class="button" data-action="remove-all-spaces">全页去空格</button>',
      '    <button type="button" class="button" data-action="validate-page">全页校验</button>',
      '    <button type="button" class="button" data-action="copy-duration">复制时长</button>',
      "  </div>",
      '  <div class="row">',
      '    <button type="button" class="button" data-action="manual-save">安全保存</button>',
      '    <button type="button" class="button" data-action="smart-submit">智能提交</button>',
      '    <button type="button" class="button" data-action="ai-punctuation">AI 标点</button>',
      '    <button type="button" class="button" data-action="leaderboard">排行榜</button>',
      '    <button type="button" class="button" data-action="open-settings">设置</button>',
      "  </div>",
      '  <div class="row">',
      '    <button type="button" class="button" data-action="play-pause">播放/暂停</button>',
      '    <button type="button" class="button" data-action="seek-backward">后退1s</button>',
      '    <button type="button" class="button" data-action="seek-forward">前进1s</button>',
      '    <button type="button" class="button" data-action="speed-down">倍速-0.1</button>',
      '    <button type="button" class="button" data-action="speed-up">倍速+0.1</button>',
      '    <button type="button" class="button" data-action="speed-reset">重置倍速</button>',
      '    <button type="button" class="button" data-action="volume-down">音量-50%</button>',
      '    <button type="button" class="button" data-action="volume-up">音量+50%</button>',
      '    <button type="button" class="button" data-action="volume-reset">重置音量</button>',
      "  </div>",
      '  <div class="status" data-role="status">等待页面动作。</div>',
      '  <div class="audio-status" data-role="audio-status">当前没有活跃音频</div>',
      "</div>",
    ].join("");

    ui = {
      status: shadowRoot.querySelector("[data-role='status']"),
      audioStatus: shadowRoot.querySelector("[data-role='audio-status']"),
      durationButton: shadowRoot.querySelector("[data-action='copy-duration']"),
    };

    Array.from(shadowRoot.querySelectorAll("[data-action]")).forEach(function (button) {
      button.addEventListener("click", function () {
        void handleAction(button.getAttribute("data-action"));
      });
    });

    updateDurationButton();
    updateAudioStatus();
    return host;
  }

  async function runPanelAction(actionKey) {
    const controlPanel = getControlPanelApi();
    if (!controlPanel || typeof controlPanel.runAction !== "function") {
      throw new Error("Control panel action API is unavailable.");
    }

    return controlPanel.runAction(actionKey);
  }

  async function handleAction(actionName) {
    try {
      if (
        actionName === "quickfill-active" ||
        actionName === "set-valid-active" ||
        actionName === "set-invalid-active" ||
        actionName === "remove-active-spaces" ||
        actionName === "convert-active-numbers" ||
        actionName === "toggle-focus" ||
        actionName === "mark-all-valid-fill" ||
        actionName === "remove-all-spaces" ||
        actionName === "validate-page"
      ) {
        const result = await interactionRunner.execute(actionName);
        updateStatus(result.summaryText);
        updateDurationButton();
        updateAudioStatus();
        return;
      }

      if (actionName === "manual-save") {
        const result = await runPanelAction("save");
        updateStatus(result?.summaryText || "已触发安全保存。");
        return;
      }

      if (actionName === "smart-submit") {
        const result = await runPanelAction("smartSubmit");
        updateStatus(result?.summaryText || "已触发智能提交。");
        return;
      }

      if (actionName === "ai-punctuation") {
        const result = await runPanelAction("aiPunctuation");
        updateStatus(result?.summaryText || "已触发 AI 标点修复。");
        return;
      }

      if (actionName === "leaderboard") {
        const result = await runPanelAction("leaderboard");
        updateStatus(result?.summaryText || "已切换排行榜。");
        return;
      }

      if (actionName === "open-settings") {
        const settingsPanel = getSettingsPanelApi();
        if (!settingsPanel || typeof settingsPanel.toggle !== "function") {
          throw new Error("Settings panel is unavailable.");
        }
        await settingsPanel.toggle();
        updateStatus("已切换设置面板。");
        return;
      }

      if (actionName === "copy-duration") {
        const result = await durationController.copyCurrentDuration();
        updateStatus(result.summaryText);
        updateDurationButton();
        return;
      }

      if (actionName === "play-pause") {
        const result = await audioController.playPause();
        updateStatus(result.summaryText || "已切换播放状态。");
        updateAudioStatus();
        return;
      }

      if (actionName === "seek-backward") {
        const result = audioController.seek(-1);
        updateStatus(result.summaryText || "已后退 1 秒。");
        updateAudioStatus();
        return;
      }

      if (actionName === "seek-forward") {
        const result = audioController.seek(1);
        updateStatus(result.summaryText || "已前进 1 秒。");
        updateAudioStatus();
        return;
      }

      if (actionName === "speed-down") {
        const result = audioController.adjustRate(-0.1);
        updateStatus(result.summaryText || "已降低倍速。");
        updateAudioStatus();
        return;
      }

      if (actionName === "speed-up") {
        const result = audioController.adjustRate(0.1);
        updateStatus(result.summaryText || "已提高倍速。");
        updateAudioStatus();
        return;
      }

      if (actionName === "speed-reset") {
        const result = audioController.adjustRate(0, runtimeConfig.getSnapshot().resetRateValue);
        updateStatus(result.summaryText || "已重置倍速。");
        updateAudioStatus();
        return;
      }

      if (actionName === "volume-down") {
        const result = audioController.adjustVolume(-50);
        updateStatus(result.summaryText || "已降低音量。");
        updateAudioStatus();
        return;
      }

      if (actionName === "volume-up") {
        const result = audioController.adjustVolume(50);
        updateStatus(result.summaryText || "已提高音量。");
        updateAudioStatus();
        return;
      }

      if (actionName === "volume-reset") {
        const result = audioController.adjustVolume(0, 100);
        updateStatus(result.summaryText || "已重置音量。");
        updateAudioStatus();
      }
    } catch (error) {
      console.warn(LOG_PREFIX, "Toolbar action failed:", actionName, error);
      updateStatus("工具栏动作失败: " + actionName);
    }
  }

  function startObserver() {
    if (observer || !document.body || !window.MutationObserver) {
      return;
    }

    observer = new MutationObserver(function () {
      renderHost();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function start() {
    if (started) {
      renderHost();
      return true;
    }

    started = true;
    renderHost();
    interactionRunner.subscribe(function (result) {
      updateStatus(result.summaryText);
      updateDurationButton();
      updateAudioStatus();
    });
    durationController.subscribe(function () {
      updateDurationButton();
    });
    audioController.subscribe(function () {
      updateAudioStatus();
    });
    startObserver();
    console.info(LOG_PREFIX, "Toolbar mounted.");
    return true;
  }

  function refresh() {
    renderHost();
    updateDurationButton();
    updateAudioStatus();
    updateStatus(interactionRunner.getLastActionResult().summaryText);
    return true;
  }

  window.__ASREdgeAlibabaLabelxAnnotationToolbar = {
    start: start,
    refresh: refresh,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
