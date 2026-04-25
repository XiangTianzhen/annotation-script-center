(function () {
  const constants = globalThis.ASREdgeConstants || {};
  const storage = globalThis.ASREdgeStorage || null;
  const settingsPanel = globalThis.__ASREdgeAlibabaLabelxSettingsPanel || null;
  const messageTypes = constants.MESSAGE_TYPES || {};
  const platformLibrary = constants.PLATFORM_LIBRARY || {};
  const scriptLibrary = constants.SCRIPT_LIBRARY || {};
  const transcriptionProjectId = constants.TRANSCRIPTION_PROJECT_ID || "transcription";
  const judgementProjectId = constants.JUDGEMENT_PROJECT_ID || "judgement";
  const lightwheelScriptId = constants.LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID || "lightwheelViewPanel";
  const judgementStatsServerEndpoint =
    "http://47.108.254.138:3333/api/asr-judgement/statistics/upload";
  const judgementStatsLocalEndpoint =
    "http://127.0.0.1:3333/api/asr-judgement/statistics/upload";
  const judgementShortcutActions = constants.JUDGEMENT_SHORTCUT_ACTIONS || [
    { key: "choiceFirstBetter", label: "选择：第一个更好" },
    { key: "choiceSecondBetter", label: "选择：第二个更好" },
    { key: "choiceBothBad", label: "选择：都不好" },
    { key: "choiceUnsure", label: "选择：不确定或差不多" },
    { key: "choiceOtherDialect", label: "选择：其他方言或语种" },
    { key: "volumeUp", label: "增大音量" },
    { key: "volumeDown", label: "减小音量" },
    { key: "volumeReset", label: "重置音量" },
    { key: "rateUp", label: "提高倍速" },
    { key: "rateDown", label: "降低倍速" },
    { key: "rateReset", label: "重置倍速" },
    { key: "playPause", label: "播放/暂停当前音频" },
  ];
  const judgementItemsPerPageOptions = [
    { value: "1 条/页", label: "1 条/页" },
    { value: "2 条/页", label: "2 条/页" },
    { value: "3 条/页", label: "3 条/页" },
    { value: "4 条/页", label: "4 条/页" },
    { value: "5 条/页", label: "5 条/页" },
    { value: "10 条/页", label: "10 条/页" },
    { value: "20 条/页", label: "20 条/页" },
    { value: "30 条/页", label: "30 条/页" },
    { value: "40 条/页", label: "40 条/页" },
    { value: "50 条/页", label: "50 条/页" },
  ];
  const mouseButtonLabels = {
    0: "MouseLeft",
    1: "MouseMiddle",
    2: "MouseRight",
    3: "MouseBack",
    4: "MouseForward",
  };
  let currentSettings = null;
  let transcriptionPanelHandle = null;
  let judgementShortcutsDraft = {};
  let judgementRecordingKey = null;
  let stopJudgementRecordingListeners = null;

  function getElement(id) {
    return document.getElementById(id);
  }

  function getSearchParams() {
    return new URLSearchParams(location.search || "");
  }

  function getCurrentDetailScriptId() {
    const scriptId = getSearchParams().get("script");
    return typeof scriptId === "string" && scriptLibrary[scriptId] ? scriptId : null;
  }

  function navigateToScript(scriptId) {
    const nextUrl = new URL(location.href);
    if (scriptId) {
      nextUrl.searchParams.set("script", scriptId);
    } else {
      nextUrl.searchParams.delete("script");
    }

    history.replaceState({}, "", nextUrl.toString());
    renderCurrentView();
  }

  function queryTabs(queryInfo) {
    return new Promise(function (resolve) {
      if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
        resolve([]);
        return;
      }

      chrome.tabs.query(queryInfo, function (tabs) {
        resolve(Array.isArray(tabs) ? tabs : []);
      });
    });
  }

  function sendMessageToTab(tabId, message) {
    return new Promise(function (resolve) {
      if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.sendMessage) {
        resolve({ ok: false, message: "当前扩展版本不支持向 LabelX 页面发送消息。" });
        return;
      }

      chrome.tabs.sendMessage(tabId, message, function (response) {
        const error = chrome.runtime && chrome.runtime.lastError;
        if (error) {
          resolve({ ok: false, message: error.message });
          return;
        }

        resolve(response || { ok: false, message: "未收到快判页面响应。" });
      });
    });
  }

  function showError(message) {
    const node = getElement("options-error");
    node.textContent = String(message || "脚本中心加载失败。");
    node.classList.remove("hidden");
  }

  function hideError() {
    getElement("options-error").classList.add("hidden");
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clampNumber(value, fallback, min, max, precision) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return fallback;
    }

    const clamped = Math.max(min, Math.min(max, numericValue));
    return typeof precision === "number" ? Number(clamped.toFixed(precision)) : clamped;
  }

  function normalizeJudgementItemsPerPage(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    if (
      text === "all" ||
      text === "全部" ||
      text === "全部/400条" ||
      text === "全部（400 条）" ||
      text === "全部（400条）" ||
      text === "100 条/页" ||
      text === "100条/页" ||
      text === "150 条/页" ||
      text === "150条/页" ||
      text === "200 条/页" ||
      text === "200条/页" ||
      text === "400 条/页" ||
      text === "400条/页"
    ) {
      return "50 条/页";
    }

    const validValues = judgementItemsPerPageOptions.map(function (option) {
      return option.value;
    });
    if (validValues.indexOf(text) >= 0) {
      return text;
    }

    return validValues.indexOf(fallback) >= 0 ? fallback : "50 条/页";
  }

  function normalizeHexColor(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    if (/^#[0-9a-fA-F]{6}$/.test(text)) {
      return text.toLowerCase();
    }

    return fallback;
  }

  function normalizeJudgementDiffColors(value, defaults) {
    const colorDefaults = defaults || {
      changeBackground: "#fef3c7",
      gapBackground: "#fee2e2",
      punctuationBackground: "#ede9fe",
    };
    const source = value && typeof value === "object" ? value : {};
    return {
      changeBackground: normalizeHexColor(
        source.changeBackground,
        colorDefaults.changeBackground || "#fef3c7"
      ),
      gapBackground: normalizeHexColor(
        source.gapBackground,
        colorDefaults.gapBackground || "#fee2e2"
      ),
      punctuationBackground: normalizeHexColor(
        source.punctuationBackground,
        colorDefaults.punctuationBackground || "#ede9fe"
      ),
    };
  }

  function normalizeTimeList(value, fallback) {
    const source = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(/[,，\n]/)
        : Array.isArray(fallback)
          ? fallback
          : [];
    const result = [];

    source.forEach(function (item) {
      const text = String(item || "").trim();
      const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!match) {
        return;
      }

      const normalized = String(Number(match[1])).padStart(2, "0") + ":" + match[2];
      if (result.indexOf(normalized) < 0) {
        result.push(normalized);
      }
    });

    return result.length > 0 ? result : ["10:00", "16:00"];
  }

  function normalizeJudgementStatsEndpoint(value) {
    const text = typeof value === "string" ? value.trim() : "";
    if (text.indexOf("127.0.0.1:3333") >= 0 || text.indexOf("localhost:3333") >= 0) {
      return judgementStatsLocalEndpoint;
    }
    return judgementStatsServerEndpoint;
  }

  function hasOwn(target, key) {
    return Boolean(target) && Object.prototype.hasOwnProperty.call(target, key);
  }

  function isLabelxScript(scriptId) {
    return scriptId === transcriptionProjectId || scriptId === judgementProjectId;
  }

  function getLabelxActiveScriptId(settings) {
    return settings?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId || transcriptionProjectId;
  }

  function isScriptEnabled(settings, scriptId) {
    if (scriptId === lightwheelScriptId) {
      return Boolean(
        settings?.platforms?.lightwheel?.enabled &&
          settings?.platforms?.lightwheel?.scripts?.viewPanel?.enabled
      );
    }

    if (isLabelxScript(scriptId)) {
      return Boolean(
        settings?.platforms?.alibabaLabelx?.enabled &&
          getLabelxActiveScriptId(settings) === scriptId
      );
    }

    return false;
  }

  function getScriptStatus(settings, scriptId) {
    if (scriptId === lightwheelScriptId) {
      return isScriptEnabled(settings, scriptId)
        ? { text: "已启用", tone: "enabled" }
        : { text: "未启用", tone: "disabled" };
    }

    const labelxEnabled = Boolean(settings?.platforms?.alibabaLabelx?.enabled);
    const activeScriptId = getLabelxActiveScriptId(settings);

    if (!labelxEnabled) {
      return { text: "未启用", tone: "disabled" };
    }

    if (activeScriptId === scriptId) {
      return { text: "当前生效", tone: "enabled" };
    }

    const activeScript = scriptLibrary[activeScriptId] || {};
    return {
      text: "同平台当前为 " + String(activeScript.shortLabel || activeScript.label || activeScriptId),
      tone: "pending",
    };
  }

  function getScriptHostText(scriptId) {
    if (scriptId === lightwheelScriptId) {
      return "https://label-cloud.lightwheel.net/w/video3/index.html?access=1";
    }

    return "https://labelx.alibaba-inc.com/corpora/labeling/*";
  }

  function setScriptStatusNode(node, status) {
    node.textContent = status.text;
    node.className = "script-pill " + status.tone;
  }

  function unmountTranscriptionPanel() {
    if (settingsPanel && typeof settingsPanel.unmount === "function") {
      settingsPanel.unmount();
    }
    transcriptionPanelHandle = null;
    const root = getElement("transcription-settings-root");
    if (root) {
      root.innerHTML = "";
    }
  }

  function mountTranscriptionPanel() {
    if (!settingsPanel || typeof settingsPanel.mount !== "function") {
      showError("语音转写设置面板未加载，无法显示脚本详情。");
      return null;
    }

    if (transcriptionPanelHandle) {
      return transcriptionPanelHandle;
    }

    const container = getElement("transcription-settings-root");
    if (!(container instanceof HTMLElement)) {
      return null;
    }

    transcriptionPanelHandle = settingsPanel.mount({
      mode: "page",
      container: container,
    });
    return transcriptionPanelHandle;
  }

  function normalizeJudgementConfig(settings) {
    const projectState =
      settings?.platforms?.alibabaLabelx?.scriptCenter?.projects?.[judgementProjectId] || {};
    const asrConfig = projectState.asrConfig || {};
    const defaults = constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {
      autoPlay: true,
      autoResetRate: true,
      resetRateValue: 1.0,
      playbackRateValue: 1.0,
      rateStepValue: 0.25,
      volumeValue: 100,
      itemsPerPage: "50 条/页",
      virtualWindowEnabled: false,
      asrDiffViewEnabled: true,
      asrDiffColors: {
        changeBackground: "#fef3c7",
        gapBackground: "#fee2e2",
        punctuationBackground: "#ede9fe",
      },
      compactCardEnabled: true,
      autoAdvanceAfterChoice: false,
      statsUploadEnabled: true,
      statsUploadEndpoint: judgementStatsServerEndpoint,
      statsScheduleUrl: "",
      statsUploadTimes: ["10:00", "16:00"],
      statsUploadJitterMinutes: 10,
      statsAutoUploadOnSubtaskOpen: false,
      statsAutoUploadOnSchedule: true,
      statsUploadRequestTimeoutMs: 20000,
      shortcuts: {
        volumeUp: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "[",
          button: null,
        },
        volumeDown: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "]",
          button: null,
        },
        volumeReset: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "\\",
          button: null,
        },
      },
    };
    const shortcuts = {};
    const asrDiffColors = normalizeJudgementDiffColors(
      asrConfig.asrDiffColors,
      defaults.asrDiffColors
    );

    judgementShortcutActions.forEach(function (action) {
      const shortcut = hasOwn(asrConfig.shortcuts || {}, action.key)
        ? asrConfig.shortcuts[action.key]
        : hasOwn(defaults.shortcuts || {}, action.key)
        ? defaults.shortcuts[action.key]
        : null;
      shortcuts[action.key] = normalizeShortcut(shortcut);
    });

    return {
      autoPlay: asrConfig.autoPlay !== false,
      autoResetRate: true,
      resetRateValue:
        typeof asrConfig.resetRateValue === "number" && asrConfig.resetRateValue > 0
          ? asrConfig.resetRateValue
          : defaults.resetRateValue,
      playbackRateValue:
        typeof asrConfig.playbackRateValue === "number" && asrConfig.playbackRateValue > 0
          ? asrConfig.playbackRateValue
          : defaults.playbackRateValue,
      rateStepValue:
        typeof asrConfig.rateStepValue === "number" && asrConfig.rateStepValue > 0
          ? asrConfig.rateStepValue
          : defaults.rateStepValue,
      volumeValue:
        typeof asrConfig.volumeValue === "number" && asrConfig.volumeValue >= 0
          ? asrConfig.volumeValue
          : defaults.volumeValue,
      itemsPerPage: normalizeJudgementItemsPerPage(
        asrConfig.itemsPerPage,
        defaults.itemsPerPage || "50 条/页"
      ),
      virtualWindowEnabled: false,
      asrDiffViewEnabled: asrConfig.asrDiffViewEnabled !== false,
      asrDiffColors: asrDiffColors,
      compactCardEnabled: asrConfig.compactCardEnabled !== false,
      autoAdvanceAfterChoice: asrConfig.autoAdvanceAfterChoice === true,
      statsUploadEnabled: asrConfig.statsUploadEnabled !== false,
      statsUploadEndpoint: normalizeJudgementStatsEndpoint(
        typeof asrConfig.statsUploadEndpoint === "string"
          ? asrConfig.statsUploadEndpoint
          : defaults.statsUploadEndpoint
      ),
      statsScheduleUrl:
        typeof asrConfig.statsScheduleUrl === "string" ? asrConfig.statsScheduleUrl.trim() : "",
      statsUploadTimes: normalizeTimeList(
        asrConfig.statsUploadTimes,
        defaults.statsUploadTimes
      ),
      statsUploadJitterMinutes: clampNumber(
        asrConfig.statsUploadJitterMinutes,
        defaults.statsUploadJitterMinutes || 10,
        0,
        120,
        0
      ),
      statsAutoUploadOnSubtaskOpen: false,
      statsAutoUploadOnSchedule: asrConfig.statsAutoUploadOnSchedule !== false,
      statsUploadRequestTimeoutMs: clampNumber(
        asrConfig.statsUploadRequestTimeoutMs,
        defaults.statsUploadRequestTimeoutMs || 20000,
        1000,
        120000,
        0
      ),
      shortcuts: shortcuts,
    };
  }

  function normalizeShortcut(shortcut) {
    if (!shortcut || typeof shortcut !== "object") {
      return null;
    }

    const hasKey = typeof shortcut.key === "string" && shortcut.key.length > 0;
    const hasButton = typeof shortcut.button === "number";
    if (!hasKey && !hasButton) {
      return null;
    }

    return {
      ctrl: shortcut.ctrl === true,
      alt: shortcut.alt === true,
      shift: shortcut.shift === true,
      meta: shortcut.meta === true,
      key: hasKey ? shortcut.key : null,
      button: hasButton ? shortcut.button : null,
    };
  }

  function normalizeKeyName(key) {
    if (key === " ") {
      return "Space";
    }
    return String(key || "");
  }

  function formatShortcut(shortcut) {
    const normalized = normalizeShortcut(shortcut);
    if (!normalized) {
      return "未设置";
    }

    const parts = [];
    if (normalized.ctrl) {
      parts.push("Ctrl");
    }
    if (normalized.alt) {
      parts.push("Alt");
    }
    if (normalized.shift) {
      parts.push("Shift");
    }
    if (normalized.meta) {
      parts.push("Meta");
    }

    if (typeof normalized.button === "number") {
      parts.push(mouseButtonLabels[normalized.button] || "Mouse" + normalized.button);
    } else {
      parts.push(normalizeKeyName(normalized.key));
    }

    return parts.join(" + ");
  }

  function isModifierOnlyKey(key) {
    return ["Control", "Alt", "Shift", "Meta"].indexOf(key) >= 0;
  }

  function shortcutFromKeyboardEvent(event) {
    if (event.key === "Escape") {
      return null;
    }

    if (isModifierOnlyKey(event.key)) {
      return false;
    }

    return {
      ctrl: event.ctrlKey === true,
      alt: event.altKey === true,
      shift: event.shiftKey === true,
      meta: event.metaKey === true,
      key: event.key === " " ? "Space" : String(event.key),
      button: null,
    };
  }

  function shortcutFromMouseEvent(event) {
    return {
      ctrl: event.ctrlKey === true,
      alt: event.altKey === true,
      shift: event.shiftKey === true,
      meta: event.metaKey === true,
      key: null,
      button: event.button,
    };
  }

  function ensureShortcutDraft() {
    judgementShortcutActions.forEach(function (action) {
      if (!Object.prototype.hasOwnProperty.call(judgementShortcutsDraft, action.key)) {
        judgementShortcutsDraft[action.key] = null;
      }
    });
  }

  function renderJudgementShortcutGrid() {
    const grid = getElement("judgement-shortcut-grid");
    if (!grid) {
      return;
    }

    ensureShortcutDraft();
    grid.innerHTML = judgementShortcutActions
      .map(function (action) {
        const recording = judgementRecordingKey === action.key;
        return [
          '<div class="shortcut-row">',
          '<span class="shortcut-label">' + escapeHtml(action.label) + "</span>",
          '<span class="shortcut-value">' +
            escapeHtml(recording ? "录制中..." : formatShortcut(judgementShortcutsDraft[action.key])) +
            "</span>",
          '<button type="button" class="secondary-button" data-record-judgement-shortcut="' +
            escapeHtml(action.key) +
            '">' +
            (recording ? "录制中" : "录制") +
            "</button>",
          '<button type="button" class="ghost-button" data-clear-judgement-shortcut="' +
            escapeHtml(action.key) +
            '">删除</button>',
          "</div>",
        ].join("");
      })
      .join("");

    Array.from(grid.querySelectorAll("[data-record-judgement-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        startJudgementShortcutRecording(button.getAttribute("data-record-judgement-shortcut"));
      });
    });

    Array.from(grid.querySelectorAll("[data-clear-judgement-shortcut]")).forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.getAttribute("data-clear-judgement-shortcut");
        judgementShortcutsDraft[key] = null;
        if (judgementRecordingKey === key) {
          stopJudgementShortcutRecording("快捷键录制已取消。");
          return;
        }
        setJudgementRecordingStatus("快捷键已删除，保存后生效。");
        renderJudgementShortcutGrid();
      });
    });
  }

  function setJudgementRecordingStatus(text) {
    const node = getElement("judgement-recording-status");
    if (!node) {
      return;
    }

    node.textContent = text || "";
    node.classList.toggle("hidden", !text);
  }

  function stopJudgementShortcutRecording(statusText) {
    if (typeof stopJudgementRecordingListeners === "function") {
      stopJudgementRecordingListeners();
      stopJudgementRecordingListeners = null;
    }

    judgementRecordingKey = null;
    setJudgementRecordingStatus(statusText || "");
    renderJudgementShortcutGrid();
  }

  function applyRecordedJudgementShortcut(shortcut) {
    if (!judgementRecordingKey || shortcut === false) {
      return;
    }

    if (!shortcut) {
      stopJudgementShortcutRecording("已取消快捷键录制。");
      return;
    }

    judgementShortcutsDraft[judgementRecordingKey] = normalizeShortcut(shortcut);
    stopJudgementShortcutRecording("快捷键已录制，保存后生效。");
  }

  function startJudgementShortcutRecording(actionKey) {
    if (!actionKey) {
      return;
    }

    if (typeof stopJudgementRecordingListeners === "function") {
      stopJudgementRecordingListeners();
    }

    judgementRecordingKey = actionKey;
    const action = judgementShortcutActions.find(function (item) {
      return item.key === actionKey;
    });

    setJudgementRecordingStatus(
      "正在录制「" + String(action?.label || actionKey) + "」：按键盘组合或鼠标按键，Esc 取消。"
    );

    function preventMouseDefaultOnce(event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    }

    function suppressMouseFollowup() {
      ["mouseup", "auxclick", "contextmenu"].forEach(function (eventName) {
        window.addEventListener(eventName, preventMouseDefaultOnce, {
          capture: true,
          once: true,
        });
      });
      window.setTimeout(function () {
        ["mouseup", "auxclick", "contextmenu"].forEach(function (eventName) {
          window.removeEventListener(eventName, preventMouseDefaultOnce, true);
        });
      }, 800);
    }

    const keydownListener = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      applyRecordedJudgementShortcut(shortcutFromKeyboardEvent(event));
    };
    const mousedownListener = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      suppressMouseFollowup();
      applyRecordedJudgementShortcut(shortcutFromMouseEvent(event));
    };

    window.addEventListener("keydown", keydownListener, true);
    window.addEventListener("mousedown", mousedownListener, true);
    stopJudgementRecordingListeners = function () {
      window.removeEventListener("keydown", keydownListener, true);
      window.removeEventListener("mousedown", mousedownListener, true);
    };

    renderJudgementShortcutGrid();
  }

  function applyJudgementForm(settings) {
    const config = normalizeJudgementConfig(settings);
    judgementShortcutsDraft = clone(config.shortcuts) || {};
    getElement("judgement-volume").value = String(config.volumeValue);
    getElement("judgement-playback-rate").value = String(config.playbackRateValue);
    getElement("judgement-rate-step").value = String(config.rateStepValue);
    getElement("judgement-reset-rate").value = String(config.resetRateValue);
    getElement("judgement-items-per-page").value = config.itemsPerPage;
    getElement("judgement-auto-play").checked = config.autoPlay === true;
    getElement("judgement-asr-diff-view").checked = config.asrDiffViewEnabled !== false;
    getElement("judgement-diff-change-bg").value = config.asrDiffColors.changeBackground;
    getElement("judgement-diff-gap-bg").value = config.asrDiffColors.gapBackground;
    getElement("judgement-diff-punctuation-bg").value =
      config.asrDiffColors.punctuationBackground;
    getElement("judgement-compact-card").checked = config.compactCardEnabled !== false;
    getElement("judgement-auto-advance").checked = config.autoAdvanceAfterChoice === true;
    getElement("judgement-stats-upload-enabled").checked = config.statsUploadEnabled !== false;
    getElement("judgement-stats-upload-endpoint").value = config.statsUploadEndpoint || "";
    getElement("judgement-stats-schedule-url").value = config.statsScheduleUrl || "";
    getElement("judgement-stats-auto-schedule").checked =
      config.statsAutoUploadOnSchedule !== false;
    stopJudgementShortcutRecording("");
    renderJudgementShortcutGrid();
  }

  function renderScriptCenter(settings) {
    const center = getElement("script-center-view");
    const platformIds = Object.keys(platformLibrary);

    center.innerHTML = platformIds
      .map(function (platformId) {
        const platform = platformLibrary[platformId] || {};
        const scriptIds = Object.keys(scriptLibrary).filter(function (scriptId) {
          return scriptLibrary[scriptId]?.platformId === platformId;
        });

        const scriptMarkup = scriptIds
          .map(function (scriptId) {
            const script = scriptLibrary[scriptId] || {};
            const status = getScriptStatus(settings, scriptId);
            const active = status.tone === "enabled";

            return [
              '<article class="script-card' + (active ? " active" : "") + '">',
              '<div class="script-head">',
              '<div class="script-title">',
              "<h3>" + String(script.label || scriptId) + "</h3>",
              '<div class="meta-row">',
              '<span class="script-pill info">' + String(script.statusLabel || "脚本") + "</span>",
              '<span class="script-pill ' + status.tone + '">' + status.text + "</span>",
              "</div>",
              "</div>",
              "</div>",
              '<p class="script-copy">' + String(script.description || "") + "</p>",
              '<p class="script-copy">匹配 URL：' + getScriptHostText(scriptId) + "</p>",
              '<div class="script-actions">',
              '<button type="button" class="primary-button" data-open-script="' + scriptId + '">打开设置</button>',
              isScriptEnabled(settings, scriptId)
                ? '<button type="button" class="danger-button" data-disable-script="' + scriptId + '">关闭脚本</button>'
                : '<button type="button" class="secondary-button" data-enable-script="' + scriptId + '">启用脚本</button>',
              "</div>",
              "</article>",
            ].join("");
          })
          .join("");

        return [
          '<section class="platform-section">',
          '<div class="platform-head">',
          "<div>",
          "<h2>" + String(platform.label || platformId) + "</h2>",
          '<p class="platform-copy">' + String(platform.description || "") + "</p>",
          "</div>",
          '<div class="status-row">',
          '<span class="pill info">' + String(platform.host || "") + "</span>",
          "</div>",
          "</div>",
          '<div class="script-grid">' + scriptMarkup + "</div>",
          "</section>",
        ].join("");
      })
      .join("");

    Array.from(center.querySelectorAll("[data-open-script]")).forEach(function (button) {
      button.addEventListener("click", function () {
        navigateToScript(button.getAttribute("data-open-script"));
      });
    });

    Array.from(center.querySelectorAll("[data-enable-script]")).forEach(function (button) {
      button.addEventListener("click", function () {
        void toggleScript(button.getAttribute("data-enable-script"), true);
      });
    });

    Array.from(center.querySelectorAll("[data-disable-script]")).forEach(function (button) {
      button.addEventListener("click", function () {
        void toggleScript(button.getAttribute("data-disable-script"), false);
      });
    });
  }

  function renderDetailHeader(settings, scriptId) {
    const script = scriptLibrary[scriptId] || {};
    const platform = platformLibrary[script.platformId] || {};
    const status = getScriptStatus(settings, scriptId);

    getElement("detail-script-name").textContent = script.label || scriptId;
    getElement("detail-script-description").textContent = script.description || "";
    getElement("detail-script-note").textContent =
      script.note ||
      (isLabelxScript(scriptId)
        ? "同平台脚本互斥：启用这个脚本后，另一个 LabelX 脚本会自动切换为非生效状态。"
        : "当前脚本属于独立平台。");

    const statusNode = getElement("detail-script-status");
    statusNode.textContent = status.text;
    statusNode.className = "pill " + status.tone;

    const platformNode = getElement("detail-platform-pill");
    platformNode.textContent = String(platform.label || script.platformId || "未知平台");

    const enableButton = getElement("detail-enable-button");
    const disableButton = getElement("detail-disable-button");
    const enabled = isScriptEnabled(settings, scriptId);

    enableButton.disabled = enabled;
    disableButton.disabled = !enabled;
  }

  function showDetailPanel(scriptId) {
    getElement("detail-transcription-panel").classList.toggle("hidden", scriptId !== transcriptionProjectId);
    getElement("detail-judgement-panel").classList.toggle("hidden", scriptId !== judgementProjectId);
    getElement("detail-lightwheel-panel").classList.toggle("hidden", scriptId !== lightwheelScriptId);
  }

  function renderDetail(settings, scriptId) {
    renderDetailHeader(settings, scriptId);
    showDetailPanel(scriptId);
    setStatus("detail-status", "");

    if (scriptId === transcriptionProjectId) {
      const handle = mountTranscriptionPanel();
      if (handle && typeof handle.refresh === "function") {
        void handle.refresh();
      }
      return;
    }

    unmountTranscriptionPanel();

    if (scriptId === judgementProjectId) {
      applyJudgementForm(settings);
      setStatus("judgement-status", "");
      return;
    }

    if (scriptId === lightwheelScriptId) {
      const enabled = isScriptEnabled(settings, scriptId);
      setStatus(
        "lightwheel-status",
        enabled
          ? "当前只启用了脚本中心状态位；Lightwheel 扩展运行时还没有迁入。"
          : "当前脚本未启用。启用后会先纳入 URL 检测和脚本中心管理。"
      );
    }
  }

  function setStatus(targetId, text) {
    const node = getElement(targetId);
    if (node) {
      node.textContent = text || "";
    }
  }

  async function loadSettings() {
    if (!storage || typeof storage.getSettings !== "function") {
      throw new Error("扩展存储不可用。");
    }

    currentSettings = await storage.getSettings();
    return currentSettings;
  }

  async function toggleScript(scriptId, enabled) {
    if (!storage || typeof storage.setScriptEnabled !== "function") {
      setStatus("detail-status", "当前扩展版本不支持脚本启停。");
      return;
    }

    const script = scriptLibrary[scriptId] || {};
    const targetStatus = enabled ? "启用" : "关闭";
    setStatus("detail-status", "正在" + targetStatus + " " + String(script.label || scriptId) + "...");

    try {
      currentSettings = await storage.setScriptEnabled(scriptId, enabled);
      renderCurrentView();
      setStatus(
        "detail-status",
        String(script.label || scriptId) +
          (enabled
            ? " 已启用。如当前平台页面已打开，建议刷新一次。"
            : " 已关闭。")
      );
    } catch (error) {
      setStatus(
        "detail-status",
        targetStatus + "失败：" + (error && error.message ? error.message : String(error))
      );
    }
  }

  async function saveJudgementSettings() {
    if (!storage || typeof storage.saveProjectSettings !== "function") {
      setStatus("judgement-status", "当前扩展版本不支持保存语音判别设置。");
      return false;
    }

    const volumeValue = Number(getElement("judgement-volume").value);
    const playbackRateValue = Number(getElement("judgement-playback-rate").value);
    const rateStepValue = Number(getElement("judgement-rate-step").value);
    const resetRateValue = Number(getElement("judgement-reset-rate").value);
    const itemsPerPage = normalizeJudgementItemsPerPage(
      getElement("judgement-items-per-page").value,
      "50 条/页"
    );
    const autoPlay = Boolean(getElement("judgement-auto-play").checked);
    const asrDiffViewEnabled = Boolean(getElement("judgement-asr-diff-view").checked);
    const asrDiffColors = normalizeJudgementDiffColors(
      {
        changeBackground: getElement("judgement-diff-change-bg").value,
        gapBackground: getElement("judgement-diff-gap-bg").value,
        punctuationBackground: getElement("judgement-diff-punctuation-bg").value,
      },
      constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.asrDiffColors
    );
    const compactCardEnabled = Boolean(getElement("judgement-compact-card").checked);
    const autoAdvanceAfterChoice = Boolean(getElement("judgement-auto-advance").checked);
    const statsUploadEnabled = Boolean(getElement("judgement-stats-upload-enabled").checked);
    const statsUploadEndpoint = normalizeJudgementStatsEndpoint(
      getElement("judgement-stats-upload-endpoint").value
    );
    const statsScheduleUrl = String(getElement("judgement-stats-schedule-url").value || "").trim();
    const statsAutoUploadOnSchedule = Boolean(getElement("judgement-stats-auto-schedule").checked);
    const shortcuts = {};

    ensureShortcutDraft();
    judgementShortcutActions.forEach(function (action) {
      shortcuts[action.key] = normalizeShortcut(judgementShortcutsDraft[action.key]);
    });

    setStatus("judgement-status", "正在保存语音判别设置...");

    try {
      currentSettings = await storage.saveProjectSettings(judgementProjectId, {
        volumeValue: clampNumber(volumeValue, 100, 0, 1000, 0),
        playbackRateValue: clampNumber(playbackRateValue, 1.0, 0.25, 5, 2),
        rateStepValue: clampNumber(rateStepValue, 0.25, 0.05, 1, 2),
        autoResetRate: true,
        resetRateValue: clampNumber(resetRateValue, 1.0, 0.25, 5, 2),
        itemsPerPage: itemsPerPage,
        autoPlay: autoPlay,
        virtualWindowEnabled: false,
        asrDiffViewEnabled: asrDiffViewEnabled,
        asrDiffColors: asrDiffColors,
        compactCardEnabled: compactCardEnabled,
        autoAdvanceAfterChoice: autoAdvanceAfterChoice,
        statsUploadEnabled: statsUploadEnabled,
        statsUploadEndpoint: statsUploadEndpoint,
        statsScheduleUrl: statsScheduleUrl,
        statsUploadTimes: constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.statsUploadTimes || ["10:00", "16:00"],
        statsUploadJitterMinutes: constants.DEFAULT_JUDGEMENT_ASR_CONFIG?.statsUploadJitterMinutes || 10,
        statsAutoUploadOnSubtaskOpen: false,
        statsAutoUploadOnSchedule: statsAutoUploadOnSchedule,
        statsUploadRequestTimeoutMs: 20000,
        shortcuts: shortcuts,
      });
      renderCurrentView();
      setStatus("judgement-status", "语音判别设置已保存；已打开的 LabelX 页面会尽量实时同步，未生效时请刷新页面。");
      return true;
    } catch (error) {
      setStatus(
        "judgement-status",
        "保存失败：" + (error && error.message ? error.message : String(error))
      );
      return false;
    }
  }

  function isJudgementDetailTab(tab) {
    if (!tab || !tab.url) {
      return false;
    }

    try {
      const url = new URL(tab.url);
      return (
        url.hostname === "labelx.alibaba-inc.com" &&
        url.pathname.toLowerCase().startsWith("/corpora/labeling/") &&
        Boolean(url.searchParams.get("subTaskId"))
      );
    } catch (error) {
      return false;
    }
  }

  async function findJudgementDetailTab() {
    const tabs = await queryTabs({
      url: "https://labelx.alibaba-inc.com/corpora/labeling/*",
    });
    const detailTabs = tabs.filter(isJudgementDetailTab);
    return (
      detailTabs.find(function (tab) {
        return tab.active === true && tab.highlighted === true;
      }) ||
      detailTabs.find(function (tab) {
        return tab.active === true;
      }) ||
      detailTabs[0] ||
      null
    );
  }

  async function uploadJudgementStatsFromOptions() {
    const saved = await saveJudgementSettings();
    if (saved === false) {
      return;
    }

    setStatus("judgement-status", "正在查找已打开的快判详情页...");
    const tab = await findJudgementDetailTab();
    if (!tab || typeof tab.id !== "number") {
      setStatus("judgement-status", "未找到已打开的快判详情页，请先打开 LabelX 快判子任务详情页。");
      return;
    }

    setStatus("judgement-status", "正在请求快判详情页上传统计...");
    const response = await sendMessageToTab(tab.id, {
      type: messageTypes.JUDGEMENT_STATS_UPLOAD || "ASR_EDGE_JUDGEMENT_STATS_UPLOAD",
      source: "options-panel",
    });

    if (response && response.ok === true) {
      const payload = response.payload || {};
      setStatus(
        "judgement-status",
        "统计上传已触发：分包ID " +
          String(payload.batchId || "--") +
          "，子任务ID " +
          String(payload.subTaskId || "--") +
          "。"
      );
      return;
    }

    setStatus(
      "judgement-status",
      "上传失败：" + String(response?.message || response?.error || "快判页面未返回成功状态。")
    );
  }

  async function renderCurrentView() {
    hideError();
    const scriptId = getCurrentDetailScriptId();
    const settings = currentSettings || (await loadSettings());

    document.title = (constants.EXTENSION_NAME || "标注脚本中心") + " - 设置";
    getElement("extension-name").textContent = constants.EXTENSION_NAME || "标注脚本中心";
    getElement("stage-label").textContent = constants.STAGE_LABEL || "脚本中心";

    if (!scriptId) {
      getElement("script-center-view").classList.remove("hidden");
      getElement("script-detail-view").classList.add("hidden");
      unmountTranscriptionPanel();
      renderScriptCenter(settings);
      return;
    }

    getElement("script-center-view").classList.add("hidden");
    getElement("script-detail-view").classList.remove("hidden");
    renderDetail(settings, scriptId);
  }

  document.addEventListener("DOMContentLoaded", async function () {
    getElement("back-to-center").addEventListener("click", function () {
      navigateToScript(null);
    });

    getElement("detail-enable-button").addEventListener("click", function () {
      const scriptId = getCurrentDetailScriptId();
      if (scriptId) {
        void toggleScript(scriptId, true);
      }
    });

    getElement("detail-disable-button").addEventListener("click", function () {
      const scriptId = getCurrentDetailScriptId();
      if (scriptId) {
        void toggleScript(scriptId, false);
      }
    });

    getElement("save-judgement-settings").addEventListener("click", function () {
      void saveJudgementSettings();
    });

    getElement("judgement-stats-upload-now").addEventListener("click", function () {
      void uploadJudgementStatsFromOptions();
    });

    try {
      await loadSettings();
      await renderCurrentView();
    } catch (error) {
      showError(error && error.message ? error.message : String(error));
    }
  });
})();
