(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-apply-policy]";
  const VALIDITY_OPTIONS = ["有效", "无效", "特殊"];
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;
  const annotationItemValidator = window.__ASREdgeAlibabaLabelxAnnotationItemValidator;
  const annotationFeedback = window.__ASREdgeAlibabaLabelxAnnotationFeedback;
  const annotationTextPipeline = window.__ASREdgeAlibabaLabelxAnnotationTextPipeline;

  if (
    !annotationItemCollector ||
    !annotationItemValidator ||
    !annotationFeedback ||
    !annotationTextPipeline
  ) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function normalizeValidity(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    return VALIDITY_OPTIONS.includes(normalized) ? normalized : null;
  }

  function normalizeRequest(policyRequest) {
    const request = policyRequest && typeof policyRequest === "object" ? policyRequest : {};

    return {
      itemIndex: Number.isInteger(request.itemIndex) ? request.itemIndex : -1,
    };
  }

  function createBasePolicyResult(locateResult, itemIndex) {
    return {
      pageType:
        locateResult && typeof locateResult.pageType === "string"
          ? locateResult.pageType
          : "unknown",
      routeKey:
        locateResult && typeof locateResult.routeKey === "string"
          ? locateResult.routeKey
          : "non-target",
      taskId:
        locateResult && typeof locateResult.taskId === "string" ? locateResult.taskId : null,
      itemIndex: itemIndex,
      matched: false,
      actionable: false,
      reason:
        locateResult && locateResult.routeKey !== "non-target" ? "item-not-found" : "non-target",
      reasonDetails: null,
      currentSnapshot: null,
      currentValidationIssues: [],
      recommendedQuickfill: false,
      recommendedValidity: null,
      suggestedApplyInput: null,
    };
  }

  function filterIssuesForItem(validationResult, itemIndex) {
    const issues = Array.isArray(validationResult && validationResult.issues)
      ? validationResult.issues
      : [];

    return issues.filter(function (issue) {
      return issue && issue.index === itemIndex;
    });
  }

  function hasIssue(issues, code) {
    return issues.some(function (issue) {
      return issue && issue.code === code;
    });
  }

  function createSuggestedApplyInput(itemIndex, doQuickfill, targetValidity) {
    const result = {
      itemIndex: itemIndex,
      targetValidity: normalizeValidity(targetValidity),
    };

    if (doQuickfill === true) {
      result.doQuickfill = true;
      result.textAction = "quickfill";
    }

    return result;
  }

  function createSuggestedTextWriteInput(itemIndex, textAction, targetValidity, targetText) {
    const result = {
      itemIndex: itemIndex,
      targetValidity: normalizeValidity(targetValidity),
      textAction: textAction,
    };

    if (textAction === "clear") {
      result.clearTargetText = true;
    }

    if (typeof targetText === "string") {
      result.targetText = targetText;
    }

    return result;
  }

  function buildValidationArtifacts(pageStateInput, itemIndex) {
    const snapshotResult =
      typeof annotationItemCollector.collect === "function"
        ? annotationItemCollector.collect(pageStateInput)
        : null;
    const validationResult =
      typeof annotationItemValidator.validate === "function"
        ? annotationItemValidator.validate(snapshotResult || pageStateInput)
        : null;
    const feedbackSummary =
      typeof annotationFeedback.summarize === "function"
        ? annotationFeedback.summarize(validationResult)
        : null;

    return {
      validationResult: validationResult,
      feedbackSummary: feedbackSummary,
      currentValidationIssues: filterIssuesForItem(validationResult, itemIndex),
    };
  }

  function recommendAnnotationAction(policyRequest, pageStateInput) {
    const request = normalizeRequest(policyRequest);
    const locateResult =
      typeof annotationItemCollector.locate === "function"
        ? annotationItemCollector.locate(request.itemIndex, pageStateInput)
        : null;
    const result = createBasePolicyResult(locateResult, request.itemIndex);

    try {
      const validationArtifacts = buildValidationArtifacts(pageStateInput, request.itemIndex);
      const currentValidationIssues = validationArtifacts.currentValidationIssues;
      const feedbackSummary = validationArtifacts.feedbackSummary;

      result.currentValidationIssues = currentValidationIssues;

      if (!locateResult || locateResult.routeKey === "non-target") {
        result.reason = "non-target";
        result.reasonDetails =
          feedbackSummary && typeof feedbackSummary.summaryText === "string"
            ? feedbackSummary.summaryText
            : "当前页面未命中目标站点，策略层不生成建议动作。";
        return result;
      }

      if (locateResult.pageType !== "task-detail") {
        result.reason = "non-task-detail";
        result.reasonDetails =
          feedbackSummary && typeof feedbackSummary.summaryText === "string"
            ? feedbackSummary.summaryText
            : "当前页面不是 task-detail，策略层不生成单条建议动作。";
        return result;
      }

      if (!locateResult.matched || !locateResult.item || !locateResult.snapshot) {
        result.reason = "item-not-found";
        result.reasonDetails = "当前 itemIndex 未命中有效标注项，策略层不生成建议动作。";
        return result;
      }

      result.matched = true;
      result.currentSnapshot = locateResult.snapshot;

      const sourceText =
        typeof locateResult.snapshot.sourceText === "string" ? locateResult.snapshot.sourceText : null;
      if (!sourceText) {
        result.reason = "missing-source-text";
        result.reasonDetails = "当前标注项缺少 sourceText，无法生成安全的 quickfill 建议。";
        return result;
      }

      if (!locateResult.snapshot.hasTargetTextarea || !locateResult.targetTextarea) {
        result.reason = "textarea-not-found";
        result.reasonDetails = "当前标注项不存在目标 textarea，策略层不生成写入建议。";
        return result;
      }

      const pipelineResult =
        typeof annotationTextPipeline.run === "function"
          ? annotationTextPipeline.run(sourceText)
          : null;
      const generatedText =
        pipelineResult && typeof pipelineResult.generatedText === "string"
          ? pipelineResult.generatedText
          : "";
      const normalizedTargetText =
        typeof annotationItemValidator.normalizeTargetText === "function"
          ? annotationItemValidator.normalizeTargetText(locateResult.snapshot.targetText)
          : "";
      const selectedValidity = normalizeValidity(locateResult.snapshot.selectedValidity);
      const canGenerateQuickfill = generatedText.length > 0;
      const targetTextIsEmpty = normalizedTargetText.length === 0;
      const missingValidityIssue = hasIssue(currentValidationIssues, "missing-validity");
      const validEmptyTextIssue = hasIssue(currentValidationIssues, "valid-empty-text");
      const invalidHasTextIssue = hasIssue(currentValidationIssues, "invalid-has-text");
      const specialSelectedIssue = hasIssue(currentValidationIssues, "special-selected");

      if (selectedValidity === "特殊" || specialSelectedIssue) {
        result.reason = "special-selected";
        result.reasonDetails = "当前标注项选择了“特殊”，策略层不自动覆盖为其他动作。";
        return result;
      }

      if (selectedValidity === "有效") {
        if (targetTextIsEmpty && canGenerateQuickfill && validEmptyTextIssue) {
          result.actionable = true;
          result.reason = "ok";
          result.reasonDetails =
            "当前标注项已选“有效”且目标文本为空，现有 quickfill 规则可生成非空文本，保守建议只执行 quickfill，不覆盖 validity。";
          result.recommendedQuickfill = true;
          result.recommendedValidity = null;
          result.suggestedApplyInput = createSuggestedApplyInput(request.itemIndex, true, null);
          return result;
        }

        result.reason = "no-safe-action";
        result.reasonDetails = "当前标注项已选“有效”，且没有命中可安全自动修复的问题。";
        return result;
      }

      if (selectedValidity === "无效") {
        if (!targetTextIsEmpty || invalidHasTextIssue) {
          result.actionable = true;
          result.reason = "ok";
          result.reasonDetails =
            "当前标注项已选“无效”但目标文本非空，保守建议只清空文本，不覆盖 validity。";
          result.recommendedQuickfill = false;
          result.recommendedValidity = null;
          result.suggestedApplyInput = createSuggestedTextWriteInput(
            request.itemIndex,
            "clear",
            null
          );
          return result;
        }

        result.reason = "no-safe-action";
        result.reasonDetails = "当前标注项已选“无效”，且没有命中可安全自动修复的问题。";
        return result;
      }

      if (targetTextIsEmpty && !canGenerateQuickfill) {
        result.reason = "no-safe-action";
        result.reasonDetails =
          "现有 quickfill 文本规则无法为当前 sourceText 生成非空文本，首轮策略不给出安全建议。";
        return result;
      }

      if (!missingValidityIssue) {
        result.reason = "no-safe-action";
        result.reasonDetails =
          "当前标注项没有命中可安全建议的校验问题，首轮策略不硬凑动作计划。";
        return result;
      }

      if (targetTextIsEmpty) {
        result.actionable = true;
        result.reason = "ok";
        result.reasonDetails =
          "当前标注项未选 validity，目标文本为空，现有 quickfill 规则可生成非空文本，保守建议执行 quickfill 并将 validity 设为“有效”。";
        result.recommendedQuickfill = true;
        result.recommendedValidity = "有效";
        result.suggestedApplyInput = createSuggestedApplyInput(request.itemIndex, true, "有效");
        return result;
      }

      result.actionable = true;
      result.reason = "ok";
      result.reasonDetails =
        "当前标注项未选 validity，但目标文本已非空，保守建议只补一个“有效”切换，不重复 quickfill。";
      result.recommendedQuickfill = false;
      result.recommendedValidity = "有效";
      result.suggestedApplyInput = createSuggestedApplyInput(request.itemIndex, false, "有效");
      return result;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to build annotation apply policy:", error);
      result.reason = "policy-error";
      result.reasonDetails = "策略层在生成建议动作计划时发生异常。";
      return result;
    }
  }

  function logPolicyResult(policyResult) {
    const logMethod = policyResult.actionable ? console.info : console.warn;

    logMethod(LOG_PREFIX, "Annotation apply policy result:", {
      pageType: policyResult.pageType,
      routeKey: policyResult.routeKey,
      taskId: policyResult.taskId,
      itemIndex: policyResult.itemIndex,
      matched: policyResult.matched,
      actionable: policyResult.actionable,
      reason: policyResult.reason,
      reasonDetails: policyResult.reasonDetails,
      currentSnapshot: policyResult.currentSnapshot,
      currentValidationIssues: policyResult.currentValidationIssues,
      recommendedQuickfill: policyResult.recommendedQuickfill,
      recommendedValidity: policyResult.recommendedValidity,
      suggestedApplyInput: policyResult.suggestedApplyInput,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationApplyPolicy = {
    plan: recommendAnnotationAction,
    log: logPolicyResult,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
