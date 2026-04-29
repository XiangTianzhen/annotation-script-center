(function () {
  const ACTION_LABELS = {
    aiRecommendCurrentItem: "AI 推荐文本",
    copyAiHeardText: "复制 AI 听音文本",
    copyRecommendedText: "复制 AI 推荐文本",
    fillRecommendedText: "填入推荐文本",
    ignoreAiResult: "忽略 AI 推荐结果",
    sentenceQualified: "句子判定：合格",
    sentenceUnqualified: "句子判定：不合格",
    taskPass: "任务判定：通过",
    taskPartialReject: "任务判定：部分驳回",
    taskFullReject: "任务判定：全部驳回",
  };
  const HANDLED_FLAG = "__asrEdgeDataBakerShortcutHandled";
  const FOCUS_SENTINEL_ID = "asr-edge-data-baker-focus-sentinel";

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
      key: hasKey ? normalizeKey(shortcut.key) : null,
      button: hasButton ? shortcut.button : null,
    };
  }

  function normalizeKey(key) {
    const text = String(key || "");
    if (text === " ") {
      return "Space";
    }
    return text.length === 1 ? text.toLowerCase() : text;
  }

  function normalizeShortcutMap(shortcuts) {
    const source = shortcuts && typeof shortcuts === "object" ? shortcuts : {};
    const result = {};
    Object.keys(ACTION_LABELS).forEach(function (actionKey) {
      result[actionKey] = normalizeShortcut(source[actionKey]);
    });
    return result;
  }

  function isEditableTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }
    const tagName = String(target.tagName || "").toLowerCase();
    if (tagName === "input" || tagName === "textarea" || tagName === "select") {
      return true;
    }
    if (target.isContentEditable) {
      return true;
    }
    return Boolean(target.closest("[contenteditable='true'], [contenteditable='']"));
  }

  function focusSafeBody() {
    try {
      let focusNode = document.getElementById(FOCUS_SENTINEL_ID);
      if (!focusNode) {
        focusNode = document.createElement("button");
        focusNode.id = FOCUS_SENTINEL_ID;
        focusNode.type = "button";
        focusNode.setAttribute("aria-hidden", "true");
        focusNode.tabIndex = -1;
        focusNode.style.position = "fixed";
        focusNode.style.left = "-9999px";
        focusNode.style.top = "-9999px";
        focusNode.style.width = "1px";
        focusNode.style.height = "1px";
        focusNode.style.opacity = "0";
        document.documentElement.appendChild(focusNode);
      }

      focusNode.focus({ preventScroll: true });

      if (document.body instanceof HTMLElement) {
        if (!document.body.hasAttribute("tabindex")) {
          document.body.setAttribute("tabindex", "-1");
        }
        document.body.focus({ preventScroll: true });
      }
    } catch (error) {
      // Ignore focus restoration failures; the shortcut action can still run.
    }
  }

  function blurActiveElementForShortcut() {
    const activeElement = document.activeElement;

    if (
      activeElement &&
      activeElement instanceof HTMLElement &&
      activeElement !== document.body &&
      typeof activeElement.blur === "function"
    ) {
      activeElement.blur();
    }

    try {
      const nextActiveElement = document.activeElement;
      if (
        isEditableTarget(nextActiveElement) &&
        nextActiveElement instanceof HTMLElement &&
        typeof nextActiveElement.blur === "function"
      ) {
        nextActiveElement.blur();
      }
    } catch (error) {
      // Ignore focus restoration failures; the shortcut action can still run.
    }

    focusSafeBody();
  }

  function shortcutMatchesEvent(shortcut, event) {
    if (!shortcut || shortcut.button !== null) {
      return false;
    }
    return (
      shortcut.ctrl === event.ctrlKey &&
      shortcut.alt === event.altKey &&
      shortcut.shift === event.shiftKey &&
      shortcut.meta === event.metaKey &&
      shortcut.key === normalizeKey(event.key)
    );
  }

  function isDisabledButton(button) {
    return (
      !button ||
      button.disabled === true ||
      button.classList.contains("is-disabled") ||
      button.getAttribute("disabled") !== null ||
      button.getAttribute("aria-disabled") === "true"
    );
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, "").trim();
  }

  function findButtonInContainers(containerSelector, headingText, buttonText) {
    const heading = normalizeText(headingText);
    const target = normalizeText(buttonText);
    const containers = Array.from(document.querySelectorAll(containerSelector));
    for (let index = containers.length - 1; index >= 0; index -= 1) {
      const container = containers[index];
      if (heading && normalizeText(container.textContent).indexOf(heading) < 0) {
        continue;
      }
      const buttons = Array.from(container.querySelectorAll("button"));
      const button = buttons.find(function (item) {
        return normalizeText(item.textContent) === target;
      });
      if (button) {
        return button;
      }
    }
    return null;
  }

  function clickButton(button, failureMessage, actions) {
    if (!button) {
      showStatus(failureMessage || "未找到对应按钮。", "error", actions);
      return false;
    }
    if (isDisabledButton(button)) {
      showStatus("对应按钮当前不可用，未绕过平台限制。", "error", actions);
      return false;
    }
    button.click();
    showStatus("已触发：" + normalizeText(button.textContent), "success", actions);
    return true;
  }

  function showStatus(message, tone, actions) {
    if (actions && typeof actions.showStatus === "function") {
      actions.showStatus(message, tone);
      return;
    }
    if (typeof console !== "undefined" && typeof console.debug === "function") {
      console.debug("[DataBaker][round-one-quality][shortcut] " + String(message || ""));
    }
  }

  function runPromiseAction(promise, actions) {
    Promise.resolve(promise).catch(function (error) {
      showStatus(error?.message || String(error), "error", actions);
    });
  }

  function runAction(actionKey, actions) {
    const safeActions = actions && typeof actions === "object" ? actions : {};

    if (actionKey === "aiRecommendCurrentItem") {
      if (typeof safeActions.requestAiRecommend !== "function") {
        showStatus("AI 推荐工具卡未就绪。", "error", safeActions);
        return;
      }
      runPromiseAction(safeActions.requestAiRecommend(), safeActions);
      return;
    }
    if (actionKey === "copyAiHeardText") {
      runPromiseAction(safeActions.copyHeardText?.() || Promise.resolve(), safeActions);
      return;
    }
    if (actionKey === "copyRecommendedText") {
      runPromiseAction(safeActions.copyRecommendedText?.() || Promise.resolve(), safeActions);
      return;
    }
    if (actionKey === "fillRecommendedText") {
      if (typeof safeActions.fillRecommendedText === "function") {
        safeActions.fillRecommendedText();
      } else {
        showStatus("暂无 AI 推荐文本。", "error", safeActions);
      }
      return;
    }
    if (actionKey === "ignoreAiResult") {
      if (typeof safeActions.ignoreAiResult === "function") {
        safeActions.ignoreAiResult();
      } else {
        showStatus("暂无 AI 推荐结果。", "error", safeActions);
      }
      return;
    }
    if (actionKey === "sentenceQualified") {
      clickButton(findButtonInContainers(".submit-btn", "句子判定", "合格"), "未找到句子判定合格按钮。", safeActions);
      return;
    }
    if (actionKey === "sentenceUnqualified") {
      clickButton(findButtonInContainers(".submit-btn", "句子判定", "不合格"), "未找到句子判定不合格按钮。", safeActions);
      return;
    }
    if (actionKey === "taskPass") {
      clickButton(findButtonInContainers(".operate-btn", "任务判定", "通过"), "未找到任务判定通过按钮。", safeActions);
      return;
    }
    if (actionKey === "taskPartialReject") {
      clickButton(findButtonInContainers(".operate-btn", "任务判定", "部分驳回"), "未找到任务判定部分驳回按钮。", safeActions);
      return;
    }
    if (actionKey === "taskFullReject") {
      clickButton(findButtonInContainers(".operate-btn", "任务判定", "全部驳回"), "未找到任务判定全部驳回按钮。", safeActions);
    }
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};
    let shortcuts = normalizeShortcutMap(config.shortcuts);
    let actions = config.actions || {};
    let started = false;

    function findMatchedAction(event) {
      return Object.keys(shortcuts).find(function (key) {
        return shortcutMatchesEvent(shortcuts[key], event);
      });
    }

    function handleKeydown(event) {
      if (event[HANDLED_FLAG]) {
        return;
      }

      const actionKey = findMatchedAction(event);
      if (!actionKey) {
        return;
      }

      event[HANDLED_FLAG] = true;
      blurActiveElementForShortcut();
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      runAction(actionKey, actions);
    }

    function handleDocumentClick(event) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || !target.closest(".sentence-list .sentence-item")) {
        return;
      }

      window.setTimeout(blurActiveElementForShortcut, 80);
      window.setTimeout(blurActiveElementForShortcut, 200);
    }

    function start() {
      if (started) {
        return;
      }
      started = true;
      window.addEventListener("keydown", handleKeydown, true);
      document.addEventListener("keydown", handleKeydown, true);
      document.addEventListener("click", handleDocumentClick, true);
    }

    function stop() {
      if (!started) {
        return;
      }
      started = false;
      window.removeEventListener("keydown", handleKeydown, true);
      document.removeEventListener("keydown", handleKeydown, true);
      document.removeEventListener("click", handleDocumentClick, true);
    }

    function refresh(nextOptions) {
      const next = nextOptions && typeof nextOptions === "object" ? nextOptions : {};
      shortcuts = normalizeShortcutMap(next.shortcuts || shortcuts);
      actions = next.actions || actions;
    }

    return {
      refresh,
      start,
      stop,
    };
  }

  globalThis.__ASREdgeDataBakerRoundOneShortcuts = {
    blurActiveElementForShortcut,
    createRuntime,
    focusSafeBody,
    normalizeShortcut,
  };
})();
