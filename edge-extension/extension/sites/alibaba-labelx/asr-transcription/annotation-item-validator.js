(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-item-validator]";
  const annotationItemCollector = window.__ASREdgeAlibabaLabelxAnnotationItemCollector;
  const VALIDITY_OPTIONS = ["有效", "无效", "特殊"];

  function createEmptySnapshotResult() {
    return {
      pageType: "unknown",
      routeKey: "non-target",
      taskId: null,
      matched: false,
      itemCount: 0,
      items: [],
    };
  }

  function resolveSnapshotResult(snapshotInput) {
    if (snapshotInput && typeof snapshotInput === "object" && Array.isArray(snapshotInput.items)) {
      return snapshotInput;
    }

    if (Array.isArray(snapshotInput)) {
      return {
        pageType: "unknown",
        routeKey: "non-target",
        taskId: null,
        matched: snapshotInput.length > 0,
        itemCount: snapshotInput.length,
        items: snapshotInput,
      };
    }

    if (annotationItemCollector && typeof annotationItemCollector.collect === "function") {
      return annotationItemCollector.collect(snapshotInput);
    }

    return createEmptySnapshotResult();
  }

  function normalizeValidationText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  }

  function normalizeValidity(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalizedValue = value.trim();
    return VALIDITY_OPTIONS.includes(normalizedValue) ? normalizedValue : null;
  }

  function createBaseValidationResult(snapshotResult) {
    const items = Array.isArray(snapshotResult && snapshotResult.items) ? snapshotResult.items : [];
    const itemCount =
      typeof snapshotResult?.itemCount === "number" ? snapshotResult.itemCount : items.length;

    return {
      pageType:
        snapshotResult && typeof snapshotResult.pageType === "string"
          ? snapshotResult.pageType
          : "unknown",
      routeKey:
        snapshotResult && typeof snapshotResult.routeKey === "string"
          ? snapshotResult.routeKey
          : "non-target",
      taskId:
        snapshotResult && typeof snapshotResult.taskId === "string" ? snapshotResult.taskId : null,
      matched:
        snapshotResult && typeof snapshotResult.matched === "boolean"
          ? snapshotResult.matched
          : itemCount > 0,
      itemCount: itemCount,
      valid: true,
      issueCount: 0,
      issues: [],
    };
  }

  function createValidationIssue(item, code, message, selectedValidity) {
    return {
      index: typeof item?.index === "number" ? item.index : -1,
      code: code,
      severity: "error",
      message: message,
      sourceText: typeof item?.sourceText === "string" ? item.sourceText : null,
      selectedValidity: selectedValidity,
      hasTargetTextarea: Boolean(item && item.hasTargetTextarea),
    };
  }

  function validateSnapshotItem(item) {
    const selectedValidity = normalizeValidity(item && item.selectedValidity);
    const normalizedTargetText = normalizeValidationText(item && item.targetText);
    const hasTargetTextarea = Boolean(item && item.hasTargetTextarea);
    const issues = [];

    if (!selectedValidity) {
      issues.push(
        createValidationIssue(item, "missing-validity", "当前标注项未选择有效性。", null)
      );
      return issues;
    }

    if (selectedValidity === "特殊") {
      issues.push(
        createValidationIssue(
          item,
          "special-selected",
          "当前标注项选择了“特殊”，需要人工确认。",
          selectedValidity
        )
      );
      return issues;
    }

    if (selectedValidity === "无效" && normalizedTargetText.length > 0) {
      issues.push(
        createValidationIssue(
          item,
          "invalid-has-text",
          "当前标注项选择“无效”但目标文本非空。",
          selectedValidity
        )
      );
      return issues;
    }

    if (selectedValidity === "有效" && !hasTargetTextarea) {
      issues.push(
        createValidationIssue(
          item,
          "valid-missing-textarea",
          "当前标注项选择“有效”但不存在目标文本框。",
          selectedValidity
        )
      );
      return issues;
    }

    if (selectedValidity === "有效" && normalizedTargetText.length === 0) {
      issues.push(
        createValidationIssue(
          item,
          "valid-empty-text",
          "当前标注项选择“有效”但目标文本为空。",
          selectedValidity
        )
      );
    }

    return issues;
  }

  function validateAnnotationItems(snapshotInput) {
    const snapshotResult = resolveSnapshotResult(snapshotInput);
    const result = createBaseValidationResult(snapshotResult);

    if (result.pageType !== "task-detail" || !Array.isArray(snapshotResult.items)) {
      return result;
    }

    result.issues = snapshotResult.items.flatMap(function (item) {
      return validateSnapshotItem(item);
    });
    result.issueCount = result.issues.length;
    result.valid = result.issueCount === 0;

    return result;
  }

  function logValidationResult(validationResult) {
    console.debug(LOG_PREFIX, "Annotation validation result:", {
      pageType: validationResult.pageType,
      routeKey: validationResult.routeKey,
      taskId: validationResult.taskId,
      matched: validationResult.matched,
      itemCount: validationResult.itemCount,
      valid: validationResult.valid,
      issueCount: validationResult.issueCount,
      issues: validationResult.issues,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationItemValidator = {
    validate: validateAnnotationItems,
    log: logValidationResult,
    normalizeTargetText: normalizeValidationText,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
