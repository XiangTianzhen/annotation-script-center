(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-action-history]";
  const DEFAULT_LIMIT = 20;
  let nextRecordId = 1;
  let records = [];

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function cloneValue(value, depth) {
    if (depth >= 4) {
      return "[Truncated]";
    }

    if (Array.isArray(value)) {
      const limited = value.slice(0, 10).map(function (entry) {
        return cloneValue(entry, depth + 1);
      });

      if (value.length > 10) {
        limited.push("... +" + (value.length - 10) + " more");
      }

      return limited;
    }

    if (!isObject(value)) {
      return value;
    }

    const result = {};
    const keys = Object.keys(value).slice(0, 20);

    keys.forEach(function (key) {
      result[key] = cloneValue(value[key], depth + 1);
    });

    if (Object.keys(value).length > keys.length) {
      result.__extraKeys = Object.keys(value).length - keys.length;
    }

    return result;
  }

  function normalizeActionName(actionName) {
    if (typeof actionName !== "string") {
      return "unknown-action";
    }

    const normalized = actionName.trim();
    return normalized.length > 0 ? normalized : "unknown-action";
  }

  function deriveReason(result) {
    if (isObject(result) && typeof result.reason === "string") {
      return result.reason;
    }

    return null;
  }

  function deriveSummaryText(result) {
    if (isObject(result) && typeof result.summaryText === "string" && result.summaryText) {
      return result.summaryText;
    }

    const reason = deriveReason(result);
    return reason ? "reason=" + reason : null;
  }

  function cloneRecord(record) {
    return {
      id: record.id,
      recordedAt: record.recordedAt,
      actionName: record.actionName,
      reason: record.reason,
      summaryText: record.summaryText,
      result: cloneValue(record.result, 0),
    };
  }

  function push(actionName, result) {
    const record = {
      id: nextRecordId,
      recordedAt: new Date().toISOString(),
      actionName: normalizeActionName(actionName),
      reason: deriveReason(result),
      summaryText: deriveSummaryText(result),
      result: cloneValue(result, 0),
    };

    nextRecordId += 1;
    records.unshift(record);

    if (records.length > DEFAULT_LIMIT) {
      records = records.slice(0, DEFAULT_LIMIT);
    }

    return cloneRecord(record);
  }

  function list() {
    return records.map(cloneRecord);
  }

  function clear() {
    const clearedCount = records.length;
    records = [];

    return {
      clearedCount: clearedCount,
    };
  }

  function exportText() {
    if (records.length === 0) {
      return "ASR Action History\n(no records)";
    }

    const lines = ["ASR Action History", "limit=" + DEFAULT_LIMIT, ""];

    records.forEach(function (record, index) {
      lines.push("#" + (index + 1) + " " + record.actionName);
      lines.push("recordedAt: " + record.recordedAt);
      if (record.reason) {
        lines.push("reason: " + record.reason);
      }
      if (record.summaryText) {
        lines.push("summaryText: " + record.summaryText);
      }
      lines.push("result:");
      lines.push(JSON.stringify(record.result, null, 2));
      lines.push("");
    });

    return lines.join("\n");
  }

  window.__ASREdgeAlibabaLabelxAnnotationActionHistory = {
    push: push,
    list: list,
    clear: clear,
    exportText: exportText,
    DEFAULT_LIMIT: DEFAULT_LIMIT,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
