(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-interaction-runner]";
  const activeItemTracker = window.__ASREdgeAlibabaLabelxAnnotationActiveItem;
  const runtimeConfig = window.__ASREdgeAlibabaLabelxAnnotationRuntimeConfig;
  const durationController = window.__ASREdgeAlibabaLabelxAnnotationDurationController;
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;
  const annotationItemWriter = window.__ASREdgeAlibabaLabelxAnnotationItemWriter;
  const annotationValidityWriter = window.__ASREdgeAlibabaLabelxAnnotationValidityWriter;
  const annotationTextPipeline = window.__ASREdgeAlibabaLabelxAnnotationTextPipeline;
  const annotationQuickfillRunner = window.__ASREdgeAlibabaLabelxAnnotationQuickfillRunner;
  const annotationItemValidator = window.__ASREdgeAlibabaLabelxAnnotationItemValidator;
  const annotationFeedback = window.__ASREdgeAlibabaLabelxAnnotationFeedback;
  const listeners = [];
  let started = false;
  let isBulkMode = false;
  let observer = null;
  let lastActionResult = {
    actionName: "idle",
    reason: "idle",
    summaryText: "等待页面交互动作。",
  };

  if (
    !activeItemTracker ||
    !runtimeConfig ||
    !durationController ||
    !annotationItemCollector ||
    !annotationItemWriter ||
    !annotationValidityWriter ||
    !annotationTextPipeline ||
    !annotationQuickfillRunner ||
    !annotationItemValidator ||
    !annotationFeedback
  ) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function getActionHistory() {
    return window.__ASREdgeAlibabaLabelxAnnotationActionHistory || null;
  }

  function getSnapshotResult() {
    return typeof annotationItemCollector.collect === "function"
      ? annotationItemCollector.collect()
      : {
          itemCount: 0,
          items: [],
        };
  }

  function getConfigSnapshot() {
    return runtimeConfig.getSnapshot();
  }

  function toActionResult(actionName, payload) {
    const result = Object.assign(
      {
        actionName: actionName,
        reason: "ok",
        summaryText: actionName + " 已完成。",
      },
      payload || {}
    );

    return result;
  }

  function emit(result) {
    lastActionResult = result;
    listeners.slice().forEach(function (listener) {
      try {
        listener(result);
      } catch (error) {
        console.warn(LOG_PREFIX, "Interaction subscriber failed:", error);
      }
    });
  }

  function publishResult(result, options) {
    const finalResult = result && typeof result === "object" ? result : {};
    const actionHistory = getActionHistory();
    const logMethod =
      finalResult.reason === "ok" ||
      finalResult.reason === "already-selected" ||
      finalResult.reason === "already-synced"
        ? console.info
        : console.warn;

    logMethod(LOG_PREFIX, finalResult.actionName + ":", finalResult);

    if (!options?.silentHistory && actionHistory && typeof actionHistory.push === "function") {
      actionHistory.push(finalResult.actionName, finalResult);
    }

    if (!options?.silentNotify) {
      emit(finalResult);
    }

    return finalResult;
  }

  function blurItemTextarea(itemIndex) {
    const locateResult =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(itemIndex)
        : null;
    const textarea = locateResult?.targetTextarea || null;

    if (textarea) {
      textarea.blur();
    }

    if (document.body && typeof document.body.focus === "function") {
      document.body.focus();
    }
  }

  function getItemIndexFromElement(item) {
    if (!item) {
      return -1;
    }

    const items = Array.from(document.querySelectorAll(".labelRender-item"));
    return items.indexOf(item);
  }

  function highlightItem(itemIndex, message) {
    const locateResult =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(itemIndex)
        : null;
    const item = locateResult?.item || null;

    if (!item) {
      return;
    }

    item.scrollIntoView({ behavior: "smooth", block: "center" });
    item.style.boxShadow = "0 0 0 3px #ff4d4f";
    item.style.transition = "box-shadow 0.3s";
    window.setTimeout(function () {
      item.style.boxShadow = "";
    }, 3000);

    console.warn(LOG_PREFIX, "Highlighted item:", {
      itemIndex: itemIndex,
      message: message,
    });
  }

  function resolveActiveItemIndex() {
    const directIndex = activeItemTracker.getActiveIndex();
    if (directIndex >= 0) {
      return directIndex;
    }

    const activeItem = activeItemTracker.getActiveItem();
    return getItemIndexFromElement(activeItem);
  }

  function createMissingActiveItemResult(actionName) {
    return toActionResult(actionName, {
      reason: "active-item-missing",
      summaryText: "当前没有可操作的 active item。",
      itemIndex: -1,
      ok: false,
    });
  }

  function ensureActiveItemIndex(actionName) {
    const itemIndex = resolveActiveItemIndex();
    if (itemIndex < 0) {
      return {
        ok: false,
        result: createMissingActiveItemResult(actionName),
      };
    }

    return {
      ok: true,
      itemIndex: itemIndex,
    };
  }

  async function quickfillItem(itemIndex, options) {
    const quickfillResult =
      typeof annotationQuickfillRunner.run === "function"
        ? annotationQuickfillRunner.run({ itemIndex: itemIndex })
        : null;
    const result = toActionResult("quickfill-item", {
      itemIndex: itemIndex,
      ok: Boolean(quickfillResult?.filled),
      reason: quickfillResult?.reason || "quickfill-unavailable",
      quickfillResult: quickfillResult,
      summaryText: quickfillResult?.filled
        ? "第 " + (itemIndex + 1) + " 条已执行快速填入。"
        : "第 " + (itemIndex + 1) + " 条快速填入失败，reason=" + (quickfillResult?.reason || "unknown") + "。",
    });

    if (quickfillResult?.filled) {
      blurItemTextarea(itemIndex);
      durationController.refresh("quickfill-item");
    }

    return publishResult(result, options);
  }

  async function clearItemText(itemIndex, options) {
    const writeResult =
      typeof annotationItemWriter.write === "function"
        ? annotationItemWriter.write({
            itemIndex: itemIndex,
            targetText: "",
          })
        : null;
    const result = toActionResult("clear-item-text", {
      itemIndex: itemIndex,
      ok: Boolean(writeResult?.wrote),
      reason: writeResult?.reason || "text-write-failed",
      writeResult: writeResult,
      summaryText: writeResult?.wrote
        ? "第 " + (itemIndex + 1) + " 条文本已清空。"
        : "第 " + (itemIndex + 1) + " 条文本清空失败，reason=" + (writeResult?.reason || "unknown") + "。",
    });

    if (writeResult?.wrote) {
      blurItemTextarea(itemIndex);
      durationController.refresh("clear-item-text");
    }

    return publishResult(result, options);
  }

  async function setValidity(itemIndex, targetValidity, options) {
    const config = getConfigSnapshot();
    const validityResult =
      typeof annotationValidityWriter.toggle === "function"
        ? annotationValidityWriter.toggle({
            itemIndex: itemIndex,
            targetValidity: targetValidity,
          })
        : null;
    const result = toActionResult("set-validity", {
      itemIndex: itemIndex,
      targetValidity: targetValidity,
      ok: Boolean(validityResult?.toggled),
      reason: validityResult?.reason || "validity-failed",
      validityResult: validityResult,
      linkedResult: null,
      summaryText:
        "第 " +
        (itemIndex + 1) +
        " 条有效性切换" +
        (validityResult?.toggled ? "已完成" : "失败") +
        "，reason=" +
        (validityResult?.reason || "unknown") +
        "。",
    });

    if (!validityResult?.toggled) {
      durationController.refresh("set-validity-failed");
      return publishResult(result, options);
    }

    blurItemTextarea(itemIndex);

    if (targetValidity === "有效" && config.fillOnValid) {
      result.linkedResult = await quickfillItem(itemIndex, {
        silentHistory: true,
        silentNotify: true,
      });
      result.summaryText =
        "第 " + (itemIndex + 1) + " 条已切到“有效”并执行联动填充。";
    } else if (targetValidity === "无效" && config.clearOnInvalid) {
      result.linkedResult = await clearItemText(itemIndex, {
        silentHistory: true,
        silentNotify: true,
      });
      result.summaryText = "第 " + (itemIndex + 1) + " 条已切到“无效”并联动清空文本。";
    } else {
      result.summaryText = "第 " + (itemIndex + 1) + " 条有效性已切到“" + targetValidity + "”。";
    }

    durationController.refresh("set-validity");
    return publishResult(result, options);
  }

  async function removeSpacesForItem(itemIndex, options) {
    const locateResult =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(itemIndex)
        : null;
    const currentText = locateResult?.snapshot?.targetText || "";
    const removeResult = annotationTextPipeline.removeSpaces(currentText);

    if (!removeResult.changed) {
      return publishResult(
        toActionResult("remove-item-spaces", {
          itemIndex: itemIndex,
          ok: true,
          reason: "already-synced",
          removeResult: removeResult,
          summaryText: "第 " + (itemIndex + 1) + " 条当前文本没有可去除的空格。",
        }),
        options
      );
    }

    const writeResult =
      typeof annotationItemWriter.write === "function"
        ? annotationItemWriter.write({
            itemIndex: itemIndex,
            targetText: removeResult.outputText,
          })
        : null;
    const result = toActionResult("remove-item-spaces", {
      itemIndex: itemIndex,
      ok: Boolean(writeResult?.wrote),
      reason: writeResult?.reason || "text-write-failed",
      removeResult: removeResult,
      writeResult: writeResult,
      summaryText: writeResult?.wrote
        ? "第 " + (itemIndex + 1) + " 条文本已去除空格。"
        : "第 " + (itemIndex + 1) + " 条文本去空格失败，reason=" + (writeResult?.reason || "unknown") + "。",
    });

    if (writeResult?.wrote) {
      blurItemTextarea(itemIndex);
      durationController.refresh("remove-item-spaces");
    }

    return publishResult(result, options);
  }

  async function convertNumbersForItem(itemIndex, options) {
    const locateResult =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(itemIndex)
        : null;
    const currentText = locateResult?.snapshot?.targetText || "";
    const convertResult = annotationTextPipeline.convertTextNumbers(currentText);

    if (!convertResult.changed) {
      return publishResult(
        toActionResult("convert-item-numbers", {
          itemIndex: itemIndex,
          ok: true,
          reason: "already-synced",
          convertResult: convertResult,
          summaryText:
            "第 " +
            (itemIndex + 1) +
            " 条未发现可按【" +
            convertResult.mode +
            "】转换的中文数字。",
        }),
        options
      );
    }

    const writeResult =
      typeof annotationItemWriter.write === "function"
        ? annotationItemWriter.write({
            itemIndex: itemIndex,
            targetText: convertResult.outputText,
          })
        : null;
    const result = toActionResult("convert-item-numbers", {
      itemIndex: itemIndex,
      ok: Boolean(writeResult?.wrote),
      reason: writeResult?.reason || "text-write-failed",
      convertResult: convertResult,
      writeResult: writeResult,
      summaryText: writeResult?.wrote
        ? "第 " + (itemIndex + 1) + " 条已按【" + convertResult.mode + "】完成数字转换。"
        : "第 " + (itemIndex + 1) + " 条数字转换失败，reason=" + (writeResult?.reason || "unknown") + "。",
    });

    if (writeResult?.wrote) {
      blurItemTextarea(itemIndex);
    }

    return publishResult(result, options);
  }

  function toggleFocus(options) {
    const activeInfo = ensureActiveItemIndex("toggle-focus");
    if (!activeInfo.ok) {
      return publishResult(activeInfo.result, options);
    }

    const locateResult =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(activeInfo.itemIndex)
        : null;
    const textarea = locateResult?.targetTextarea || null;
    if (!textarea) {
      return publishResult(
        toActionResult("toggle-focus", {
          itemIndex: activeInfo.itemIndex,
          ok: false,
          reason: "textarea-not-found",
          summaryText: "当前 active item 不存在可聚焦的文本框。",
        }),
        options
      );
    }

    if (document.activeElement === textarea) {
      textarea.blur();
      if (document.body && typeof document.body.focus === "function") {
        document.body.focus();
      }
      return publishResult(
        toActionResult("toggle-focus", {
          itemIndex: activeInfo.itemIndex,
          ok: true,
          reason: "ok",
          summaryText: "当前焦点已从文本框切回页面。",
        }),
        options
      );
    }

    textarea.focus({ preventScroll: true });
    textarea.selectionStart = textarea.value.length;
    textarea.selectionEnd = textarea.value.length;
    return publishResult(
      toActionResult("toggle-focus", {
        itemIndex: activeInfo.itemIndex,
        ok: true,
        reason: "ok",
        summaryText: "当前焦点已切到 active item 文本框。",
      }),
      options
    );
  }

  async function markAllValidFill(options) {
    const snapshotResult = getSnapshotResult();
    const totalItems = snapshotResult?.itemCount || 0;

    if (totalItems <= 0) {
      return publishResult(
        toActionResult("mark-all-valid-fill", {
          ok: false,
          reason: "no-items",
          summaryText: "当前页面没有可执行的标注项。",
        }),
        options
      );
    }

    const result = toActionResult("mark-all-valid-fill", {
      ok: true,
      reason: "ok",
      itemCount: totalItems,
      successCount: 0,
      failedCount: 0,
      results: [],
      summaryText: "",
    });

    isBulkMode = true;

    try {
      for (let itemIndex = 0; itemIndex < totalItems; itemIndex += 1) {
        const validityResult =
          typeof annotationValidityWriter.toggle === "function"
            ? annotationValidityWriter.toggle({
                itemIndex: itemIndex,
                targetValidity: "有效",
              })
            : null;
        const quickfillResult =
          typeof annotationQuickfillRunner.run === "function"
            ? annotationQuickfillRunner.run({ itemIndex: itemIndex })
            : null;
        const entryOk = Boolean(validityResult?.toggled) && Boolean(quickfillResult?.filled);

        if (entryOk) {
          blurItemTextarea(itemIndex);
          result.successCount += 1;
        } else {
          result.failedCount += 1;
        }

        result.results.push({
          itemIndex: itemIndex,
          validityResult: validityResult,
          quickfillResult: quickfillResult,
          ok: entryOk,
        });
      }
    } finally {
      isBulkMode = false;
      durationController.refresh("mark-all-valid-fill");
    }

    result.ok = result.failedCount === 0;
    result.reason = result.ok ? "ok" : "partial-failure";
    result.summaryText =
      "全页标有效并填充已执行，共 " +
      totalItems +
      " 条，成功 " +
      result.successCount +
      " 条，失败 " +
      result.failedCount +
      " 条。";

    return publishResult(result, options);
  }

  async function removeAllSpaces(options) {
    const snapshotResult = getSnapshotResult();
    const totalItems = snapshotResult?.itemCount || 0;
    const result = toActionResult("remove-all-spaces", {
      ok: true,
      reason: "ok",
      itemCount: totalItems,
      changedCount: 0,
      failedCount: 0,
      results: [],
      summaryText: "",
    });

    for (let itemIndex = 0; itemIndex < totalItems; itemIndex += 1) {
      const locateResult =
        typeof annotationItemCollector.locate === "function"
          ? annotationItemCollector.locate(itemIndex)
          : null;
      const currentText = locateResult?.snapshot?.targetText || "";
      if (!currentText) {
        continue;
      }

      const removeResult = annotationTextPipeline.removeSpaces(currentText);
      if (!removeResult.changed) {
        continue;
      }

      const writeResult =
        typeof annotationItemWriter.write === "function"
          ? annotationItemWriter.write({
              itemIndex: itemIndex,
              targetText: removeResult.outputText,
            })
          : null;

      if (writeResult?.wrote) {
        blurItemTextarea(itemIndex);
        result.changedCount += 1;
      } else {
        result.failedCount += 1;
      }

      result.results.push({
        itemIndex: itemIndex,
        removeResult: removeResult,
        writeResult: writeResult,
      });
    }

    durationController.refresh("remove-all-spaces");
    result.ok = result.failedCount === 0;
    result.reason = result.ok ? "ok" : "partial-failure";
    result.summaryText =
      result.changedCount > 0
        ? "全页去空格完成，共处理 " + result.changedCount + " 条，失败 " + result.failedCount + " 条。"
        : "全页没有发现需要去除的空格。";

    return publishResult(result, options);
  }

  async function validatePage(options) {
    const config = getConfigSnapshot();
    const snapshotResult = getSnapshotResult();
    const result = toActionResult("validate-page", {
      ok: true,
      reason: "ok",
      itemCount: snapshotResult?.itemCount || 0,
      modifiedCount: 0,
      stoppedAtIndex: -1,
      validationAfter: null,
      feedbackAfter: null,
      issue: null,
      summaryText: "",
    });

    for (let itemIndex = 0; itemIndex < (snapshotResult?.items || []).length; itemIndex += 1) {
      const item = snapshotResult.items[itemIndex];
      const selectedValidity = item?.selectedValidity || null;
      const targetText = annotationItemValidator.normalizeTargetText(item?.targetText);

      if (!selectedValidity) {
        result.ok = false;
        result.reason = "missing-validity";
        result.stoppedAtIndex = itemIndex;
        result.issue = {
          index: itemIndex,
          code: "missing-validity",
          message: "当前标注项未选择有效性。",
        };
        highlightItem(itemIndex, result.issue.message);
        break;
      }

      if (selectedValidity === "特殊") {
        result.ok = false;
        result.reason = "special-selected";
        result.stoppedAtIndex = itemIndex;
        result.issue = {
          index: itemIndex,
          code: "special-selected",
          message: "当前标注项不能保持“特殊”。",
        };
        highlightItem(itemIndex, result.issue.message);
        break;
      }

      if (selectedValidity === "无效" && targetText) {
        if (!config.autoClearInvalidValidation) {
          result.ok = false;
          result.reason = "invalid-has-text";
          result.stoppedAtIndex = itemIndex;
          result.issue = {
            index: itemIndex,
            code: "invalid-has-text",
            message: "当前标注项选择“无效”时文本必须为空。",
          };
          highlightItem(itemIndex, result.issue.message);
          break;
        }

        const clearResult = await clearItemText(itemIndex, {
          silentHistory: true,
          silentNotify: true,
        });
        if (!clearResult.ok) {
          result.ok = false;
          result.reason = "invalid-clear-failed";
          result.stoppedAtIndex = itemIndex;
          result.issue = {
            index: itemIndex,
            code: "invalid-clear-failed",
            message: "自动清空无效文本失败。",
          };
          highlightItem(itemIndex, result.issue.message);
          break;
        }

        result.modifiedCount += 1;
        continue;
      }

      if (selectedValidity === "有效" && !targetText) {
        if (!config.autoFillOnValidValidation) {
          result.ok = false;
          result.reason = "valid-empty-text";
          result.stoppedAtIndex = itemIndex;
          result.issue = {
            index: itemIndex,
            code: "valid-empty-text",
            message: "当前标注项选择“有效”时文本不能为空。",
          };
          highlightItem(itemIndex, result.issue.message);
          break;
        }

        const fillResult = await quickfillItem(itemIndex, {
          silentHistory: true,
          silentNotify: true,
        });
        if (!fillResult.ok) {
          result.ok = false;
          result.reason = "valid-fill-failed";
          result.stoppedAtIndex = itemIndex;
          result.issue = {
            index: itemIndex,
            code: "valid-fill-failed",
            message: "自动填充有效文本失败。",
          };
          highlightItem(itemIndex, result.issue.message);
          break;
        }

        result.modifiedCount += 1;
      }
    }

    result.validationAfter =
      typeof annotationItemValidator.validate === "function"
        ? annotationItemValidator.validate()
        : null;
    result.feedbackAfter =
      typeof annotationFeedback.summarize === "function"
        ? annotationFeedback.summarize(result.validationAfter)
        : null;
    durationController.refresh("validate-page");

    if (result.ok) {
      result.summaryText =
        result.modifiedCount > 0
          ? "全页校验通过，并自动修复了 " + result.modifiedCount + " 条数据。"
          : "全页校验通过，未发现需要修复的问题。";
    } else {
      result.summaryText =
        "全页校验在第 " +
        (result.stoppedAtIndex + 1) +
        " 条停止，reason=" +
        result.reason +
        "。";
    }

    return publishResult(result, options);
  }

  function getTargetTitleNode(item) {
    const directTitle = item.querySelector(".labelRender-item-answer-title");
    if (directTitle) {
      return directTitle;
    }

    const textarea = item.querySelector("textarea");
    if (!textarea) {
      return null;
    }

    const wrap = textarea.closest(".labelRender-item-answer-wrap");
    return wrap ? wrap.querySelector(".labelRender-item-answer-title") : null;
  }

  function injectQuickfillButton(item) {
    const titleNode = getTargetTitleNode(item);
    if (!titleNode || titleNode.querySelector(".asr-edge-quickfill-button")) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "asr-edge-quickfill-button";
    button.textContent = "快速填入";
    button.style.cssText =
      "margin-left: 12px; padding: 2px 8px; cursor: pointer; background: #e6f4ff; color: #1677ff; border: 1px solid #91caff; border-radius: 4px; font-size: 12px; transition: all 0.2s;";
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      const currentIndex = getItemIndexFromElement(item);
      if (currentIndex >= 0) {
        void quickfillItem(currentIndex);
      }
    });
    titleNode.appendChild(button);
  }

  function scanItems() {
    const items = Array.from(document.querySelectorAll(".labelRender-item"));
    items.forEach(function (item) {
      injectQuickfillButton(item);
    });
  }

  function scheduleRadioSideEffects(item) {
    if (!item || isBulkMode) {
      return;
    }

    const config = getConfigSnapshot();
    const itemIndex = getItemIndexFromElement(item);
    if (itemIndex < 0) {
      return;
    }

    if (item._asrEdgeRadioTimer) {
      window.clearTimeout(item._asrEdgeRadioTimer);
    }

    item._asrEdgeRadioTimer = window.setTimeout(function () {
      item._asrEdgeRadioTimer = null;
      const checkedRadio =
        item.querySelector('.ant-v5-radio-wrapper-checked input[type="radio"]') ||
        item.querySelector('input[type="radio"]:checked');

      if (!checkedRadio) {
        durationController.refresh("radio-change-empty");
        return;
      }

      if (checkedRadio.value === "有效" && config.fillOnValid) {
        void quickfillItem(itemIndex, {
          silentHistory: true,
          silentNotify: true,
        });
      }

      if (checkedRadio.value === "无效" && config.clearOnInvalid) {
        [0, 80, 220, 500].forEach(function (delay) {
          window.setTimeout(function () {
            const latestRadio =
              item.querySelector('.ant-v5-radio-wrapper-checked input[type="radio"]') ||
              item.querySelector('input[type="radio"]:checked');
            if (latestRadio?.value === "无效") {
              void clearItemText(itemIndex, {
                silentHistory: true,
                silentNotify: true,
              });
            }
          }, delay);
        });
      }

      durationController.refresh("radio-change");
    }, 50);
  }

  function handleChangeEvent(event) {
    const target = event?.target;
    if (!target || target.tagName !== "INPUT" || target.type !== "radio") {
      return;
    }

    const item = target.closest(".labelRender-item");
    if (!item) {
      return;
    }

    scheduleRadioSideEffects(item);
  }

  function startObserver() {
    if (observer || !document.body || !window.MutationObserver) {
      return;
    }

    observer = new MutationObserver(function () {
      scanItems();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function start() {
    if (started) {
      scanItems();
      return lastActionResult;
    }

    started = true;
    activeItemTracker.start();
    durationController.start();
    document.addEventListener("change", handleChangeEvent, true);
    startObserver();
    scanItems();
    return lastActionResult;
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return function () {
        return false;
      };
    }

    listeners.push(listener);
    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
        return true;
      }

      return false;
    };
  }

  async function execute(actionName, payload) {
    if (actionName === "quickfill-active") {
      const activeInfo = ensureActiveItemIndex(actionName);
      return activeInfo.ok
        ? quickfillItem(activeInfo.itemIndex, payload)
        : publishResult(activeInfo.result, payload);
    }

    if (actionName === "set-valid-active") {
      const activeInfo = ensureActiveItemIndex(actionName);
      return activeInfo.ok
        ? setValidity(activeInfo.itemIndex, "有效", payload)
        : publishResult(activeInfo.result, payload);
    }

    if (actionName === "set-invalid-active") {
      const activeInfo = ensureActiveItemIndex(actionName);
      return activeInfo.ok
        ? setValidity(activeInfo.itemIndex, "无效", payload)
        : publishResult(activeInfo.result, payload);
    }

    if (actionName === "remove-active-spaces") {
      const activeInfo = ensureActiveItemIndex(actionName);
      return activeInfo.ok
        ? removeSpacesForItem(activeInfo.itemIndex, payload)
        : publishResult(activeInfo.result, payload);
    }

    if (actionName === "convert-active-numbers") {
      const activeInfo = ensureActiveItemIndex(actionName);
      return activeInfo.ok
        ? convertNumbersForItem(activeInfo.itemIndex, payload)
        : publishResult(activeInfo.result, payload);
    }

    if (actionName === "toggle-focus") {
      return toggleFocus(payload);
    }

    if (actionName === "mark-all-valid-fill") {
      return markAllValidFill(payload);
    }

    if (actionName === "remove-all-spaces") {
      return removeAllSpaces(payload);
    }

    if (actionName === "validate-page") {
      return validatePage(payload);
    }

    return publishResult(
      toActionResult(actionName, {
        ok: false,
        reason: "unknown-action",
        summaryText: "未识别的页面交互动作: " + actionName,
      }),
      payload
    );
  }

  window.__ASREdgeAlibabaLabelxAnnotationInteractionRunner = {
    start: start,
    subscribe: subscribe,
    execute: execute,
    getLastActionResult: function () {
      return lastActionResult;
    },
    isBulkMode: function () {
      return isBulkMode;
    },
    LOG_PREFIX: LOG_PREFIX,
  };
})();
