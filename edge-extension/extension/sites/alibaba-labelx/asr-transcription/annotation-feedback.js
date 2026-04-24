(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-feedback]";
  const annotationItemValidator = window.__ASREdgeAlibabaLabelxAnnotationItemValidator;

  function createEmptyValidationResult() {
    return {
      pageType: "unknown",
      routeKey: "non-target",
      taskId: null,
      matched: false,
      valid: true,
      itemCount: 0,
      issueCount: 0,
      issues: [],
    };
  }

  function resolveValidationResult(validationInput) {
    if (
      validationInput &&
      typeof validationInput === "object" &&
      typeof validationInput.pageType === "string" &&
      typeof validationInput.routeKey === "string" &&
      Array.isArray(validationInput.issues)
    ) {
      return validationInput;
    }

    if (annotationItemValidator && typeof annotationItemValidator.validate === "function") {
      return annotationItemValidator.validate(validationInput);
    }

    return createEmptyValidationResult();
  }

  function createIssueLine(issue) {
    const index = typeof issue?.index === "number" ? issue.index + 1 : "?";
    const code = typeof issue?.code === "string" ? issue.code : "unknown-issue";
    const message = typeof issue?.message === "string" ? issue.message : "存在未识别问题。";

    return "#" + index + " [" + code + "] " + message;
  }

  function resolveFeedbackStatus(validationResult) {
    if (
      validationResult.pageType === "unknown" ||
      validationResult.routeKey === "non-target"
    ) {
      return "non-target";
    }

    if (validationResult.pageType !== "task-detail") {
      return "non-task-detail";
    }

    if (!validationResult.matched || validationResult.itemCount === 0) {
      return "empty-task-detail";
    }

    if (validationResult.issueCount > 0) {
      return "has-issues";
    }

    return "ok";
  }

  function createSummaryText(validationResult, status) {
    if (status === "non-target") {
      return "当前页面未命中 Alibaba LabelX task-detail 只读反馈场景。";
    }

    if (status === "non-task-detail") {
      return "当前页面不是 task-detail，未生成 item 校验反馈。";
    }

    if (status === "empty-task-detail") {
      return "当前 task-detail 页面未命中标注项，暂无可读反馈。";
    }

    if (status === "ok") {
      return (
        "当前 task-detail 页面已命中 " +
        validationResult.itemCount +
        " 个标注项，未发现只读校验问题。"
      );
    }

    return (
      "当前 task-detail 页面已命中 " +
      validationResult.itemCount +
      " 个标注项，发现 " +
      validationResult.issueCount +
      " 个只读校验问题。"
    );
  }

  function summarizeValidationResult(validationInput) {
    const validationResult = resolveValidationResult(validationInput);
    const issues = Array.isArray(validationResult.issues) ? validationResult.issues : [];
    const status = resolveFeedbackStatus(validationResult);
    const issueSummaries = issues.map(function (issue) {
      return {
        index: typeof issue?.index === "number" ? issue.index : -1,
        code: typeof issue?.code === "string" ? issue.code : "unknown-issue",
        severity: issue?.severity === "error" ? "error" : "error",
        message: typeof issue?.message === "string" ? issue.message : "存在未识别问题。",
      };
    });

    return {
      pageType: validationResult.pageType,
      routeKey: validationResult.routeKey,
      taskId: typeof validationResult.taskId === "string" ? validationResult.taskId : null,
      matched: Boolean(validationResult.matched),
      valid: Boolean(validationResult.valid),
      itemCount:
        typeof validationResult.itemCount === "number" ? validationResult.itemCount : 0,
      issueCount:
        typeof validationResult.issueCount === "number"
          ? validationResult.issueCount
          : issueSummaries.length,
      status: status,
      summaryText: createSummaryText(validationResult, status),
      issueLines: issueSummaries.map(createIssueLine),
      issues: issueSummaries,
    };
  }

  function logFeedbackSummary(validationInput) {
    const summary = summarizeValidationResult(validationInput);
    const logMethod = summary.status === "has-issues" ? console.warn : console.info;

    logMethod(LOG_PREFIX, summary.summaryText, {
      pageType: summary.pageType,
      routeKey: summary.routeKey,
      taskId: summary.taskId,
      matched: summary.matched,
      valid: summary.valid,
      itemCount: summary.itemCount,
      issueCount: summary.issueCount,
      status: summary.status,
      issues: summary.issues,
      issueLines: summary.issueLines,
    });

    return summary;
  }

  window.__ASREdgeAlibabaLabelxAnnotationFeedback = {
    summarize: summarizeValidationResult,
    log: logFeedbackSummary,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
