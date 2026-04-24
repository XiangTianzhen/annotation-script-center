(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-page-report]";

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function looksLikePageApplyResult(value) {
    if (!isObject(value)) {
      return false;
    }

    return (
      Array.isArray(value.results) &&
      hasOwn(value, "plannedCount") &&
      hasOwn(value, "executedCount") &&
      hasOwn(value, "successCount") &&
      hasOwn(value, "failedCount")
    );
  }

  function looksLikeExecutionResult(value) {
    if (!isObject(value)) {
      return false;
    }

    return (
      hasOwn(value, "itemIndex") ||
      hasOwn(value, "executed") ||
      hasOwn(value, "executable") ||
      hasOwn(value, "reason") ||
      hasOwn(value, "applyResult") ||
      hasOwn(value, "plan")
    );
  }

  function normalizeMeta(reportInput) {
    if (!isObject(reportInput)) {
      return {
        pageType: "unknown",
        routeKey: "non-target",
        taskId: null,
        matched: false,
      };
    }

    return {
      pageType: typeof reportInput.pageType === "string" ? reportInput.pageType : "unknown",
      routeKey: typeof reportInput.routeKey === "string" ? reportInput.routeKey : "non-target",
      taskId: typeof reportInput.taskId === "string" ? reportInput.taskId : null,
      matched: typeof reportInput.matched === "boolean" ? reportInput.matched : false,
    };
  }

  function extractResults(reportInput) {
    if (Array.isArray(reportInput)) {
      return {
        meta: normalizeMeta(null),
        results: reportInput,
        sourceType: "result-array",
        counts: null,
      };
    }

    if (!isObject(reportInput)) {
      return {
        meta: normalizeMeta(null),
        results: [],
        sourceType: "empty",
        counts: null,
      };
    }

    const meta = normalizeMeta(reportInput);

    if (looksLikePageApplyResult(reportInput)) {
      return {
        meta: meta,
        results: reportInput.results,
        sourceType: "page-apply-result",
        counts: {
          itemCount:
            typeof reportInput.itemCount === "number" ? reportInput.itemCount : reportInput.results.length,
          plannedCount:
            typeof reportInput.plannedCount === "number" ? reportInput.plannedCount : reportInput.results.length,
          executedCount:
            typeof reportInput.executedCount === "number"
              ? reportInput.executedCount
              : reportInput.results.length,
          successCount:
            typeof reportInput.successCount === "number" ? reportInput.successCount : 0,
          failedCount:
            typeof reportInput.failedCount === "number" ? reportInput.failedCount : 0,
        },
      };
    }

    const candidateKeys = ["executionResults", "results", "applyResults", "itemResults"];

    for (let index = 0; index < candidateKeys.length; index += 1) {
      const key = candidateKeys[index];
      if (Array.isArray(reportInput[key])) {
        return {
          meta: meta,
          results: reportInput[key],
          sourceType: "page-result",
          counts: null,
        };
      }
    }

    if (looksLikeExecutionResult(reportInput)) {
      return {
        meta: {
          pageType:
            typeof reportInput.pageType === "string" ? reportInput.pageType : meta.pageType,
          routeKey:
            typeof reportInput.routeKey === "string" ? reportInput.routeKey : meta.routeKey,
          taskId: typeof reportInput.taskId === "string" ? reportInput.taskId : meta.taskId,
          matched:
            typeof reportInput.matched === "boolean" ? reportInput.matched : Boolean(meta.matched),
        },
        results: [reportInput],
        sourceType: "single-result",
        counts: null,
      };
    }

    return {
      meta: meta,
      results: [],
      sourceType: "unknown-object",
      counts: null,
    };
  }

  function deriveReasonDetails(entry) {
    if (typeof entry.reasonDetails === "string" && entry.reasonDetails) {
      return entry.reasonDetails;
    }

    if (isObject(entry.applyResult) && typeof entry.applyResult.reason === "string") {
      return "applyResult.reason=" + entry.applyResult.reason;
    }

    if (isObject(entry.feedbackAfter) && typeof entry.feedbackAfter.summaryText === "string") {
      return "feedbackAfter.summaryText=" + entry.feedbackAfter.summaryText;
    }

    if (isObject(entry.plan) && typeof entry.plan.reasonDetails === "string") {
      return entry.plan.reasonDetails;
    }

    return null;
  }

  function normalizeResultEntry(resultEntry, fallbackIndex) {
    const entry = isObject(resultEntry) ? resultEntry : {};
    const reason = typeof entry.reason === "string" ? entry.reason : "unknown";
    const attempted =
      Boolean(entry.executed) ||
      reason === "apply-failed" ||
      reason === "execute-error" ||
      reason === "ok";
    const succeeded = Boolean(entry.executed) && reason === "ok";

    return {
      pageType: typeof entry.pageType === "string" ? entry.pageType : "unknown",
      routeKey: typeof entry.routeKey === "string" ? entry.routeKey : "non-target",
      taskId: typeof entry.taskId === "string" ? entry.taskId : null,
      itemIndex: Number.isInteger(entry.itemIndex) ? entry.itemIndex : fallbackIndex,
      matched: Boolean(entry.matched),
      executable: Boolean(entry.executable),
      executed: Boolean(entry.executed),
      attempted: attempted,
      succeeded: succeeded,
      failed: attempted && !succeeded,
      reason: reason,
      reasonDetails: deriveReasonDetails(entry),
    };
  }

  function createBaseReport(meta, sourceType, counts) {
    return {
      pageType: meta.pageType,
      routeKey: meta.routeKey,
      taskId: meta.taskId,
      matched: meta.matched,
      sourceType: sourceType,
      itemCount: counts && typeof counts.itemCount === "number" ? counts.itemCount : 0,
      plannedCount: counts && typeof counts.plannedCount === "number" ? counts.plannedCount : 0,
      resultCount: 0,
      executedCount: counts && typeof counts.executedCount === "number" ? counts.executedCount : 0,
      successCount: counts && typeof counts.successCount === "number" ? counts.successCount : 0,
      failedCount: counts && typeof counts.failedCount === "number" ? counts.failedCount : 0,
      summaryText: "",
      lines: [],
    };
  }

  function formatLine(entry) {
    const itemLabel = "item[" + entry.itemIndex + "]";

    if (entry.succeeded) {
      return itemLabel + " executed successfully (reason=ok).";
    }

    if (entry.failed) {
      const detailSuffix = entry.reasonDetails ? " detail=" + entry.reasonDetails : "";
      return itemLabel + " execution failed (reason=" + entry.reason + ")." + detailSuffix;
    }

    if (entry.executable) {
      return itemLabel + " was executable but no successful execution result was confirmed.";
    }

    const detailSuffix = entry.reasonDetails ? " detail=" + entry.reasonDetails : "";
    return itemLabel + " not executed (reason=" + entry.reason + ")." + detailSuffix;
  }

  function summarize(report) {
    if (!report.matched || report.routeKey === "non-target" || report.pageType === "unknown") {
      return "当前结果未命中目标页面，报告层未生成有效执行摘要。";
    }

    if (report.resultCount === 0) {
      if (report.sourceType === "page-apply-result") {
        return "当前整页执行结果中没有可报告的执行项，报告层返回空摘要。";
      }

      return "当前没有可消费的执行结果，报告层返回空摘要。";
    }

    if (report.executedCount === 0) {
      if (report.sourceType === "page-apply-result") {
        return (
          "当前整页执行结果共计划 " +
          report.plannedCount +
          " 条，主线返回执行计数 0 条；成功 0 条，失败 0 条。"
        );
      }

      return (
        "当前共消费 " +
        report.resultCount +
        " 条执行结果，但没有确认任何已执行项；成功 0 条，失败 0 条。"
      );
    }

    if (report.sourceType === "page-apply-result") {
      return (
        "当前整页执行结果共计划 " +
        report.plannedCount +
        " 条，主线返回执行计数 " +
        report.executedCount +
        " 条，成功 " +
        report.successCount +
        " 条，失败 " +
        report.failedCount +
        " 条。"
      );
    }

    return (
      "当前共消费 " +
      report.resultCount +
      " 条执行结果，其中实际执行 " +
      report.executedCount +
      " 条，成功 " +
      report.successCount +
      " 条，失败 " +
      report.failedCount +
      " 条。"
    );
  }

  function createReport(reportInput) {
    const extracted = extractResults(reportInput);
    const report = createBaseReport(extracted.meta, extracted.sourceType, extracted.counts);

    try {
      const normalizedEntries = extracted.results.map(function (entry, index) {
        return normalizeResultEntry(entry, index);
      });

      if (!report.matched && normalizedEntries.length > 0) {
        report.matched = normalizedEntries.some(function (entry) {
          return entry.matched;
        });
      }

      if (report.pageType === "unknown" && normalizedEntries.length > 0) {
        report.pageType = normalizedEntries[0].pageType;
      }

      if (report.routeKey === "non-target" && normalizedEntries.length > 0) {
        report.routeKey = normalizedEntries[0].routeKey;
      }

      if (report.taskId === null && normalizedEntries.length > 0) {
        report.taskId = normalizedEntries[0].taskId;
      }

      report.resultCount = normalizedEntries.length;
      if (report.sourceType !== "page-apply-result") {
        report.executedCount = normalizedEntries.filter(function (entry) {
          return entry.attempted;
        }).length;
        report.successCount = normalizedEntries.filter(function (entry) {
          return entry.succeeded;
        }).length;
        report.failedCount = normalizedEntries.filter(function (entry) {
          return entry.failed;
        }).length;
      }
      report.lines = normalizedEntries.map(formatLine);
      report.summaryText = summarize(report);
      return report;
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to create page report:", error);
      report.summaryText = "整页执行结果报告生成失败。";
      return report;
    }
  }

  function logReport(reportResult) {
    const logMethod = reportResult.failedCount > 0 ? console.warn : console.info;

    logMethod(LOG_PREFIX, reportResult.summaryText, {
      pageType: reportResult.pageType,
      routeKey: reportResult.routeKey,
      taskId: reportResult.taskId,
      matched: reportResult.matched,
      sourceType: reportResult.sourceType,
      resultCount: reportResult.resultCount,
      executedCount: reportResult.executedCount,
      successCount: reportResult.successCount,
      failedCount: reportResult.failedCount,
      lines: reportResult.lines,
    });
  }

  window.__ASREdgeAlibabaLabelxAnnotationPageReport = {
    report: createReport,
    log: logReport,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
