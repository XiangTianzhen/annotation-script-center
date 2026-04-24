(function () {
  const LOG_PREFIX = "[ASR Edge][judgement-content]";
  const constants = globalThis.ASREdgeConstants || {};
  const storage = globalThis.ASREdgeStorage || null;
  const detector = globalThis.__ASREdgeAlibabaLabelxJudgementPageDetector || null;
  const audioController = globalThis.__ASREdgeAlibabaLabelxJudgementAudioController || null;
  const messageTypes = constants.MESSAGE_TYPES || {};
  const storageKey = constants.STORAGE_KEY || "asrEdgeSettings";
  const judgementProjectId = constants.JUDGEMENT_PROJECT_ID || "judgement";
  const judgementChoiceActions = [
    {
      key: "choiceFirstBetter",
      label: "第一个更好",
      shortLabel: "1 第一个",
      value: "第一个更好",
      index: 0,
    },
    {
      key: "choiceSecondBetter",
      label: "第二个更好",
      shortLabel: "2 第二个",
      value: "第二个更好",
      index: 1,
    },
    {
      key: "choiceBothBad",
      label: "都不好",
      shortLabel: "3 都不好",
      value: "都不好",
      index: 2,
    },
    {
      key: "choiceUnsure",
      label: "不确定或差不多",
      shortLabel: "4 不确定",
      value: "不确定或差不多",
      index: 3,
    },
    {
      key: "choiceOtherDialect",
      label: "其他方言或语种",
      shortLabel: "5 其他",
      value: "其他方言或语种",
      index: 4,
    },
  ];
  const audioActionLabels = {
    volumeUp: "音量 +",
    volumeDown: "音量 -",
    volumeReset: "重置音量",
    rateUp: "倍速 +",
    rateDown: "倍速 -",
    rateReset: "重置倍速",
  };
  const shortcutActionOrder = [
    "choiceFirstBetter",
    "choiceSecondBetter",
    "choiceBothBad",
    "choiceUnsure",
    "choiceOtherDialect",
    "volumeUp",
    "volumeDown",
    "volumeReset",
    "rateUp",
    "rateDown",
    "rateReset",
    "playPause",
  ];
  let settings = null;
  let runtimeEnabled = false;
  let messageBridgeBound = false;
  let shortcutListenersBound = false;
  let lastMouseShortcutSuppression = null;
  let refreshPromise = null;
  let toastContainer = null;
  let toastTimer = null;
  let toolbarRoot = null;
  let toolbarObserver = null;
  let toolbarMountTimer = null;
  let suppressedKeyupShortcuts = [];
  let lastStatus = {
    ok: false,
    scriptId: judgementProjectId,
    pageType: "not-started",
    enabled: false,
    reason: "not-started",
  };

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function isTopLevelContext() {
    return window.top === window.self;
  }

  function deepMerge(base, override) {
    const source = base && typeof base === "object" && !Array.isArray(base) ? base : {};
    const patch = override && typeof override === "object" && !Array.isArray(override) ? override : {};
    const result = Object.assign({}, source);

    Object.keys(patch).forEach(function (key) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        patch[key] &&
        typeof patch[key] === "object" &&
        !Array.isArray(patch[key])
      ) {
        result[key] = deepMerge(source[key], patch[key]);
      } else {
        result[key] = clone(patch[key]);
      }
    });

    return result;
  }

  function getPlatformSettings(nextSettings) {
    return nextSettings?.platforms?.alibabaLabelx || {};
  }

  function getActiveProjectId(nextSettings) {
    return (
      getPlatformSettings(nextSettings)?.scriptCenter?.activeProjectId ||
      constants.TRANSCRIPTION_PROJECT_ID ||
      "transcription"
    );
  }

  function getJudgementConfig(nextSettings) {
    const defaults = constants.DEFAULT_JUDGEMENT_ASR_CONFIG || {
      autoPlay: true,
      autoResetRate: true,
      resetRateValue: 1.0,
      volumeValue: 100,
      shortcuts: {
        playPause: {
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
          key: "Space",
          button: null,
        },
      },
    };
    const projectConfig =
      getPlatformSettings(nextSettings)?.scriptCenter?.projects?.[judgementProjectId]?.asrConfig || {};

    return deepMerge(defaults, projectConfig);
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
      key: hasKey ? normalizeKeyName(shortcut.key) : null,
      button: hasButton ? shortcut.button : null,
    };
  }

  function normalizeKeyName(key) {
    if (key === " ") {
      return "Space";
    }
    return String(key || "");
  }

  function isEditableNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    const element = node;
    const tagName = String(element.tagName || "").toLowerCase();
    const inputType = String(element.getAttribute?.("type") || "").toLowerCase();
    const nonTextInputTypes = [
      "button",
      "checkbox",
      "color",
      "file",
      "hidden",
      "image",
      "radio",
      "range",
      "reset",
      "submit",
    ];
    return (
      (tagName === "input" && nonTextInputTypes.indexOf(inputType) < 0) ||
      tagName === "textarea" ||
      tagName === "select" ||
      element.isContentEditable === true ||
      Boolean(element.closest && element.closest("[contenteditable='true']"))
    );
  }

  function isEditableEventTarget(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    if (path.some(isEditableNode)) {
      return true;
    }

    return isEditableNode(event.target);
  }

  function isToolbarEventTarget(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    if (
      path.some(function (node) {
        return node?.getAttribute?.("data-asr-edge-judgement-toolbar") === "true";
      })
    ) {
      return true;
    }

    return Boolean(
      event.target?.closest &&
        event.target.closest("[data-asr-edge-judgement-toolbar='true']")
    );
  }

  function isShortcutMatch(event, shortcut) {
    const normalized = normalizeShortcut(shortcut);
    if (!normalized) {
      return false;
    }

    if (
      normalized.ctrl !== event.ctrlKey ||
      normalized.alt !== event.altKey ||
      normalized.shift !== event.shiftKey ||
      normalized.meta !== event.metaKey
    ) {
      return false;
    }

    if (event.type === "keydown") {
      return normalized.button === null && normalized.key === normalizeKeyName(event.key);
    }

    if (
      event.type === "mousedown" ||
      event.type === "mouseup" ||
      event.type === "auxclick" ||
      event.type === "contextmenu"
    ) {
      return normalized.key === null && normalized.button === event.button;
    }

    return false;
  }

  function findShortcutAction(event) {
    const shortcuts = getJudgementConfig(settings).shortcuts || {};
    return shortcutActionOrder.find(function (actionKey) {
      return isShortcutMatch(event, shortcuts[actionKey]);
    }) || null;
  }

  function getChoiceAction(actionKey) {
    return judgementChoiceActions.find(function (choice) {
      return choice.key === actionKey;
    }) || null;
  }

  function getTaskItems() {
    return Array.from(document.querySelectorAll(".labelRender-item[data-index]")).sort(function (left, right) {
      const leftIndex = Number(left.getAttribute("data-index"));
      const rightIndex = Number(right.getAttribute("data-index"));
      return (Number.isFinite(leftIndex) ? leftIndex : 0) - (Number.isFinite(rightIndex) ? rightIndex : 0);
    });
  }

  function getItemLabel(item) {
    const index = item ? Number(item.getAttribute("data-index")) : -1;
    return Number.isFinite(index) && index >= 0 ? "第 " + String(index + 1) + " 条题卡" : "当前题卡";
  }

  function resolveCurrentItem() {
    const selectedItem = document.querySelector(".labelRender-item-selected.labelRender-item[data-index]");
    if (selectedItem) {
      return selectedItem;
    }

    const playingAudio = Array.from(document.querySelectorAll("audio[controls]")).find(function (audio) {
      return audio && !audio.paused && !audio.ended;
    });
    const playingItem = playingAudio?.closest ? playingAudio.closest(".labelRender-item[data-index]") : null;
    if (playingItem) {
      return playingItem;
    }

    return getTaskItems()[0] || null;
  }

  function getChoiceInputs(item) {
    if (!item) {
      return [];
    }

    const answerWraps = Array.from(item.querySelectorAll(".labelRender-item-answer-wrap"));
    const targetWrap = answerWraps.find(function (wrap) {
      const title = wrap.querySelector(".labelRender-item-answer-title");
      return String(title?.textContent || "").indexOf("哪个ASR更优") >= 0;
    });
    const scope = targetWrap || item;
    return Array.from(scope.querySelectorAll(".ant-v5-radio-wrapper input[type='radio'], input[type='radio']"));
  }

  function getInputLabel(input) {
    const label = input?.closest ? input.closest("label") : null;
    const labelNode = label ? label.querySelector(".ant-v5-radio-label") : null;
    return String(labelNode?.textContent || input?.value || "").trim();
  }

  function resolveChoiceInput(item, choice) {
    const inputs = getChoiceInputs(item);
    if (inputs.length === 0) {
      return null;
    }

    return (
      inputs.find(function (input) {
        return input.value === choice.value || getInputLabel(input) === choice.value;
      }) ||
      inputs[choice.index] ||
      null
    );
  }

  function forceRadioChange(input) {
    const checkedDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
    if (checkedDescriptor && typeof checkedDescriptor.set === "function") {
      checkedDescriptor.set.call(input, true);
    } else {
      input.checked = true;
    }

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function buildActionResult(action, ok, extra) {
    return Object.assign(
      {
        action: action,
        ok: ok === true,
        at: new Date().toISOString(),
      },
      extra || {}
    );
  }

  function selectJudgementChoice(actionKey) {
    const choice = getChoiceAction(actionKey);
    if (!choice) {
      return buildActionResult(actionKey, false, {
        reason: "unknown-choice-action",
        message: "未识别的判别选项动作：" + String(actionKey),
      });
    }

    const item = resolveCurrentItem();
    if (!item) {
      return buildActionResult(actionKey, false, {
        reason: "item-not-found",
        message: "未找到可选择的题卡。",
      });
    }

    const input = resolveChoiceInput(item, choice);
    if (!input) {
      return buildActionResult(actionKey, false, {
        reason: "radio-not-found",
        message: getItemLabel(item) + "未找到“" + choice.label + "”选项。",
      });
    }

    if (input.disabled) {
      return buildActionResult(actionKey, false, {
        reason: "radio-disabled",
        message: getItemLabel(item) + "的“" + choice.label + "”不可选择。",
      });
    }

    if (input.checked) {
      return buildActionResult(actionKey, true, {
        choice: choice.value,
        itemIndex: Number(item.getAttribute("data-index")),
        message: getItemLabel(item) + "已是：" + choice.label,
      });
    }

    const label = input.closest ? input.closest("label") : null;
    if (typeof input.click === "function") {
      input.click();
    } else if (label && typeof label.click === "function") {
      label.click();
    }

    if (!input.checked) {
      forceRadioChange(input);
    }

    return buildActionResult(actionKey, true, {
      choice: choice.value,
      itemIndex: Number(item.getAttribute("data-index")),
      message: getItemLabel(item) + "已选择：" + choice.label,
    });
  }

  function runRuntimeAction(actionKey, source) {
    if (getChoiceAction(actionKey)) {
      return Promise.resolve(selectJudgementChoice(actionKey));
    }

    if (audioController && typeof audioController.runAction === "function") {
      return audioController.runAction(actionKey);
    }

    return Promise.resolve(
      buildActionResult(actionKey, false, {
        reason: "action-controller-missing",
        source: source || "unknown",
        message: "当前动作控制器不可用。",
      })
    );
  }

  function ensureToastContainer() {
    if (toastContainer && toastContainer.isConnected) {
      return toastContainer;
    }

    toastContainer = document.createElement("div");
    toastContainer.setAttribute("data-asr-edge-judgement-toast", "true");
    Object.assign(toastContainer.style, {
      position: "fixed",
      top: "18px",
      right: "18px",
      zIndex: "2147483647",
      maxWidth: "320px",
      padding: "10px 14px",
      borderRadius: "12px",
      background: "rgba(15, 23, 42, 0.92)",
      color: "#f8fafc",
      fontSize: "13px",
      lineHeight: "1.5",
      boxShadow: "0 10px 28px rgba(15, 23, 42, 0.28)",
      pointerEvents: "none",
      opacity: "0",
      transform: "translateY(-6px)",
      transition: "opacity 140ms ease, transform 140ms ease",
    });

    (document.body || document.documentElement || document).appendChild(toastContainer);
    return toastContainer;
  }

  function showRuntimeToast(message, tone) {
    if (!message || !isTopLevelContext()) {
      return;
    }

    const node = ensureToastContainer();
    node.textContent = String(message);
    node.style.background =
      tone === "error" ? "rgba(185, 28, 28, 0.94)" : "rgba(15, 23, 42, 0.92)";
    node.style.opacity = "1";
    node.style.transform = "translateY(0)";

    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }

    toastTimer = window.setTimeout(function () {
      node.style.opacity = "0";
      node.style.transform = "translateY(-6px)";
      toastTimer = null;
    }, 1600);
  }

  function haltShortcutEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
  }

  function getKeyboardShortcutSignature(event) {
    return {
      key: normalizeKeyName(event.key),
      ctrl: event.ctrlKey === true,
      alt: event.altKey === true,
      shift: event.shiftKey === true,
      meta: event.metaKey === true,
    };
  }

  function isSameKeyboardShortcut(left, right) {
    return Boolean(
      left &&
        right &&
        left.key === right.key &&
        left.ctrl === right.ctrl &&
        left.alt === right.alt &&
        left.shift === right.shift &&
        left.meta === right.meta
    );
  }

  function rememberKeyboardShortcutSuppression(event) {
    if (event.type !== "keydown") {
      return;
    }

    const now = Date.now();
    const signature = getKeyboardShortcutSignature(event);
    suppressedKeyupShortcuts = suppressedKeyupShortcuts
      .filter(function (entry) {
        return entry.expiresAt > now && !isSameKeyboardShortcut(entry, signature);
      })
      .concat([
        Object.assign({}, signature, {
          expiresAt: now + 1200,
        }),
      ]);
  }

  function shouldSuppressKeyboardFollowup(event) {
    const now = Date.now();
    const signature = getKeyboardShortcutSignature(event);
    const matched = suppressedKeyupShortcuts.some(function (entry) {
      return entry.expiresAt > now && isSameKeyboardShortcut(entry, signature);
    });

    suppressedKeyupShortcuts = suppressedKeyupShortcuts.filter(function (entry) {
      return entry.expiresAt > now && !isSameKeyboardShortcut(entry, signature);
    });

    if (!matched) {
      return false;
    }

    return true;
  }

  function rememberMouseShortcutSuppression(event) {
    if (event.type !== "mousedown") {
      return;
    }

    lastMouseShortcutSuppression = {
      button: event.button,
      ctrl: event.ctrlKey === true,
      alt: event.altKey === true,
      shift: event.shiftKey === true,
      meta: event.metaKey === true,
      expiresAt: Date.now() + 800,
    };
  }

  function shouldSuppressMouseFollowup(event) {
    if (!lastMouseShortcutSuppression || Date.now() > lastMouseShortcutSuppression.expiresAt) {
      lastMouseShortcutSuppression = null;
      return false;
    }

    return (
      event.button === lastMouseShortcutSuppression.button &&
      event.ctrlKey === lastMouseShortcutSuppression.ctrl &&
      event.altKey === lastMouseShortcutSuppression.alt &&
      event.shiftKey === lastMouseShortcutSuppression.shift &&
      event.metaKey === lastMouseShortcutSuppression.meta
    );
  }

  function runActionWithFeedback(actionKey, source, statusReason, statusKey) {
    void runRuntimeAction(actionKey, source)
      .then(function (result) {
        lastStatus = buildStatus(statusReason + actionKey);
        lastStatus[statusKey] = {
          actionKey: actionKey,
          result: result || null,
        };
        showRuntimeToast(
          result?.message || (source === "shortcut" ? "快捷键已执行。" : "操作已执行。"),
          result?.ok === false ? "error" : "info"
        );
      })
      .catch(function (error) {
        showRuntimeToast(
          (source === "shortcut" ? "快捷键执行失败：" : "操作失败：") +
            (error && error.message ? error.message : String(error)),
          "error"
        );
      });
  }

  function scheduleShortcutAction(actionKey) {
    const run = function () {
      window.setTimeout(function () {
        runActionWithFeedback(actionKey, "shortcut", "shortcut-", "lastShortcutAction");
      }, 0);
    };

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(run);
      return;
    }

    window.setTimeout(run, 16);
  }

  function handleShortcutEvent(event) {
    if (!runtimeEnabled || !settings || isEditableEventTarget(event) || isToolbarEventTarget(event)) {
      return;
    }

    const actionKey = findShortcutAction(event);
    if (!actionKey) {
      return;
    }

    haltShortcutEvent(event);
    rememberKeyboardShortcutSuppression(event);
    rememberMouseShortcutSuppression(event);

    if (event.repeat === true) {
      return;
    }

    scheduleShortcutAction(actionKey);
  }

  function handleKeyupFollowupEvent(event) {
    if (!runtimeEnabled || !settings || isToolbarEventTarget(event)) {
      return;
    }

    if (shouldSuppressKeyboardFollowup(event)) {
      haltShortcutEvent(event);
    }
  }

  function handleMouseFollowupEvent(event) {
    if (!runtimeEnabled || !settings || isEditableEventTarget(event) || isToolbarEventTarget(event)) {
      return;
    }

    if (shouldSuppressMouseFollowup(event) || findShortcutAction(event)) {
      haltShortcutEvent(event);
    }
  }

  function bindShortcutListeners() {
    if (shortcutListenersBound) {
      return;
    }

    window.addEventListener("keydown", handleShortcutEvent, true);
    window.addEventListener("keyup", handleKeyupFollowupEvent, true);
    window.addEventListener("mousedown", handleShortcutEvent, true);
    window.addEventListener("mouseup", handleMouseFollowupEvent, true);
    window.addEventListener("auxclick", handleMouseFollowupEvent, true);
    window.addEventListener("contextmenu", handleMouseFollowupEvent, true);
    shortcutListenersBound = true;
  }

  function shouldShowToolbar() {
    const pageInfo = detector && typeof detector.detect === "function" ? detector.detect() : null;
    return Boolean(
      runtimeEnabled &&
        isTopLevelContext() &&
        location.hostname === constants?.TARGET_PLATFORM?.host &&
        String(location.pathname || "").toLowerCase().indexOf("/corpora/labeling/sdk") >= 0 &&
        (!pageInfo || pageInfo.isJudgementDetail || pageInfo.pageType === "judgement-detail-pending")
    );
  }

  function styleToolbarButton(button) {
    Object.assign(button.style, {
      minHeight: "26px",
      padding: "0 8px",
      border: "1px solid #d6e4ff",
      borderRadius: "6px",
      background: "#ffffff",
      color: "#0958d9",
      fontSize: "12px",
      lineHeight: "24px",
      fontWeight: "600",
      cursor: "pointer",
      whiteSpace: "nowrap",
    });
  }

  function createToolbarButton(actionKey, label, title) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.title = title || label;
    button.setAttribute("data-asr-edge-judgement-action", actionKey);
    styleToolbarButton(button);
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      runActionWithFeedback(actionKey, "toolbar", "toolbar-", "lastToolbarAction");
    });
    return button;
  }

  function createToolbarGroup(label, actions) {
    const group = document.createElement("div");
    Object.assign(group.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      flexWrap: "wrap",
    });

    const title = document.createElement("span");
    title.textContent = label;
    Object.assign(title.style, {
      color: "#475569",
      fontSize: "12px",
      fontWeight: "700",
      marginRight: "2px",
      whiteSpace: "nowrap",
    });
    group.appendChild(title);

    actions.forEach(function (action) {
      group.appendChild(createToolbarButton(action.key, action.shortLabel || action.label, action.label));
    });
    return group;
  }

  function removeToolbar() {
    if (toolbarRoot && toolbarRoot.parentNode) {
      toolbarRoot.parentNode.removeChild(toolbarRoot);
    }
    toolbarRoot = null;
  }

  function ensureToolbar() {
    if (!shouldShowToolbar()) {
      removeToolbar();
      return;
    }

    const toolbox = document.querySelector(".mark-toolbox");
    if (!toolbox) {
      return;
    }

    if (toolbarRoot && toolbarRoot.isConnected && toolbarRoot.parentNode === toolbox) {
      return;
    }

    removeToolbar();
    toolbarRoot = document.createElement("div");
    toolbarRoot.setAttribute("data-asr-edge-judgement-toolbar", "true");
    Object.assign(toolbarRoot.style, {
      display: "flex",
      alignItems: "center",
      flex: "1 1 520px",
      gap: "8px",
      flexWrap: "wrap",
      minWidth: "280px",
      maxWidth: "760px",
      margin: "4px 12px",
      padding: "4px 6px",
      border: "1px solid #dbeafe",
      borderRadius: "8px",
      background: "rgba(248, 250, 252, 0.92)",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
    });

    toolbarRoot.appendChild(createToolbarGroup("判别", judgementChoiceActions));
    toolbarRoot.appendChild(
      createToolbarGroup("音量", [
        { key: "volumeDown", label: audioActionLabels.volumeDown },
        { key: "volumeUp", label: audioActionLabels.volumeUp },
        { key: "volumeReset", label: audioActionLabels.volumeReset },
      ])
    );
    toolbarRoot.appendChild(
      createToolbarGroup("倍速", [
        { key: "rateDown", label: audioActionLabels.rateDown },
        { key: "rateUp", label: audioActionLabels.rateUp },
        { key: "rateReset", label: audioActionLabels.rateReset },
      ])
    );

    const breadcrumb = toolbox.querySelector(".mark-toolbox-breadcrumb-wrapper");
    if (breadcrumb && breadcrumb.nextSibling) {
      toolbox.insertBefore(toolbarRoot, breadcrumb.nextSibling);
      return;
    }

    if (breadcrumb) {
      toolbox.appendChild(toolbarRoot);
      return;
    }

    toolbox.insertBefore(toolbarRoot, toolbox.firstChild);
  }

  function scheduleToolbarMount() {
    if (toolbarMountTimer) {
      window.clearTimeout(toolbarMountTimer);
    }

    toolbarMountTimer = window.setTimeout(function () {
      toolbarMountTimer = null;
      ensureToolbar();
    }, 120);
  }

  function startToolbar() {
    scheduleToolbarMount();
    if (toolbarObserver) {
      return;
    }

    toolbarObserver = new MutationObserver(function () {
      scheduleToolbarMount();
    });
    toolbarObserver.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  function stopToolbar() {
    if (toolbarMountTimer) {
      window.clearTimeout(toolbarMountTimer);
      toolbarMountTimer = null;
    }
    if (toolbarObserver) {
      toolbarObserver.disconnect();
      toolbarObserver = null;
    }
    removeToolbar();
  }

  async function loadSettings() {
    if (storage && typeof storage.getSettings === "function") {
      return storage.getSettings();
    }

    return constants.DEFAULT_SETTINGS || {};
  }

  function buildStatus(reason) {
    const pageInfo = detector && typeof detector.detect === "function"
      ? detector.detect()
      : {
          isTargetSite: location.hostname === constants?.TARGET_PLATFORM?.host,
          pageType: "unknown",
          reason: "page-detector-missing",
          counts: {},
        };
    const platformEnabled = getPlatformSettings(settings).enabled !== false;
    const activeProjectId = getActiveProjectId(settings);
    const active = activeProjectId === judgementProjectId;
    const enabled = Boolean(platformEnabled && active && runtimeEnabled);

    return {
      ok: active,
      scriptId: judgementProjectId,
      pageType: pageInfo.pageType || "unknown",
      enabled: enabled,
      reason:
        reason ||
        (!platformEnabled
          ? "platform-disabled"
          : !active
          ? "active-project-" + activeProjectId
          : enabled
          ? "judgement-runtime-active"
          : "judgement-runtime-not-started"),
      platformEnabled: platformEnabled,
      activeProjectId: activeProjectId,
      page: {
        isTargetSite: pageInfo.isTargetSite === true,
        isJudgementDetail: pageInfo.isJudgementDetail === true,
        reason: pageInfo.reason || "",
        counts: pageInfo.counts || {},
      },
      audio: audioController && typeof audioController.getState === "function"
        ? audioController.getState()
        : null,
    };
  }

  function stopRuntime(reason) {
    runtimeEnabled = false;
    stopToolbar();
    if (audioController && typeof audioController.stop === "function") {
      audioController.stop();
    }
    lastStatus = buildStatus(reason || "runtime-stopped");
  }

  async function refreshRuntime(reason) {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = loadSettings()
      .then(function (nextSettings) {
        settings = nextSettings;

        if (!isTopLevelContext()) {
          stopRuntime("iframe-context");
          return lastStatus;
        }

        const platformEnabled = getPlatformSettings(settings).enabled !== false;
        const activeProjectId = getActiveProjectId(settings);
        if (!platformEnabled) {
          stopRuntime("platform-disabled");
          return lastStatus;
        }

        if (activeProjectId !== judgementProjectId) {
          stopRuntime("active-project-" + activeProjectId);
          return lastStatus;
        }

        if (!detector || !audioController) {
          runtimeEnabled = false;
          lastStatus = buildStatus("required-module-missing");
          return lastStatus;
        }

        runtimeEnabled = true;
        audioController.start(getJudgementConfig(settings));
        bindShortcutListeners();
        startToolbar();
        lastStatus = buildStatus(reason || "runtime-started");
        console.info(LOG_PREFIX, "Judgement runtime refreshed.", lastStatus);
        return lastStatus;
      })
      .catch(function (error) {
        runtimeEnabled = false;
        lastStatus = Object.assign({}, lastStatus, {
          ok: false,
          enabled: false,
          reason: "settings-load-failed",
          message: error && error.message ? error.message : String(error),
        });
        console.warn(LOG_PREFIX, "Failed to refresh runtime:", error);
        return lastStatus;
      })
      .finally(function () {
        refreshPromise = null;
      });

    return refreshPromise;
  }

  function bindMessageBridge() {
    if (
      messageBridgeBound ||
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      !chrome.runtime.onMessage
    ) {
      return;
    }

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (!message || typeof message !== "object") {
        return undefined;
      }

      if (message.type !== messageTypes.PANEL_PING) {
        return undefined;
      }

      if (lastStatus.activeProjectId !== judgementProjectId && !runtimeEnabled) {
        return undefined;
      }

      sendResponse(buildStatus("panel-ping"));
      return false;
    });

    messageBridgeBound = true;
  }

  function bindStorageRefresh() {
    if (
      typeof chrome === "undefined" ||
      !chrome.storage ||
      !chrome.storage.onChanged
    ) {
      return;
    }

    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName !== "local" || !changes || !changes[storageKey]) {
        return;
      }

      void refreshRuntime("storage-changed");
    });
  }

  bindMessageBridge();
  bindStorageRefresh();
  void refreshRuntime("script-load");

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        void refreshRuntime("dom-content-loaded");
      },
      { once: true }
    );
  } else {
    void refreshRuntime("dom-ready");
  }
})();
