(function () {
  const LOG_PREFIX = "[ASR Edge][runtime-debug]";
  const BADGE_ID = "asr-edge-presence-badge";

  function createFallbackActionHistory() {
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

    return {
      push: function (actionName, result) {
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
      },
      list: function () {
        return records.map(cloneRecord);
      },
      clear: function () {
        const clearedCount = records.length;
        records = [];
        return { clearedCount: clearedCount };
      },
      exportText: function () {
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
      },
      DEFAULT_LIMIT: DEFAULT_LIMIT,
      LOG_PREFIX: "[ASR Edge][annotation-action-history]",
    };
  }

  function injectDebugBadge() {
    if (!document.documentElement || document.getElementById(BADGE_ID)) {
      return false;
    }

    const host = document.createElement("div");
    host.id = BADGE_ID;
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.right = "10px";
    host.style.bottom = "10px";
    host.style.zIndex = "2147483647";
    host.style.pointerEvents = "none";

    const shadowRoot = host.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = [
      "<style>",
      ":host { all: initial; }",
      ".badge {",
      "  display: inline-flex;",
      "  align-items: center;",
      "  gap: 4px;",
      "  padding: 4px 8px;",
      "  border-radius: 999px;",
      "  background: rgba(17, 24, 39, 0.76);",
      "  color: #f8fafc;",
      "  font: 500 11px/1.2 'Segoe UI', sans-serif;",
      "  letter-spacing: 0.02em;",
      "  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);",
      "  opacity: 0.84;",
      "}",
      "</style>",
      '<div class="badge" title="ASR Edge extension is active on this page.">ASR Edge</div>',
    ].join("");

    document.documentElement.appendChild(host);
    console.info(LOG_PREFIX, "Debug badge injected.");
    return true;
  }

  function exposeRuntime(runtime) {
    const annotationActionHistory =
      window.__ASREdgeAlibabaLabelxAnnotationActionHistory || createFallbackActionHistory();
    const annotationDebugSnapshot = window.__ASREdgeAlibabaLabelxAnnotationDebugSnapshot || null;
    const runtimeContract =
      runtime && runtime.contract ? runtime.contract : window.__ASREdgeAlibabaLabelxRuntimeContract || null;
    const pageBridge = runtime && runtime.pageBridge ? runtime.pageBridge : null;
    const legacyBridge =
      runtime && runtime.legacyBridge
        ? runtime.legacyBridge
        : window.__ASREdgeAlibabaLabelxLegacyBridge || null;

    window.__ASREdgeAlibabaLabelxRuntime = {
      getRuntimeContract: function () {
        return runtimeContract;
      },
      getPageBridge: function () {
        return pageBridge;
      },
      getLegacyBridge: function () {
        return legacyBridge;
      },
      getRouteObserver: function () {
        return runtime && runtime.observer ? runtime.observer : null;
      },
      getStateCollector: function () {
        return runtime && runtime.stateCollector ? runtime.stateCollector : null;
      },
      getAnnotationRuntimeConfig: function () {
        return runtime && runtime.annotationRuntimeConfig ? runtime.annotationRuntimeConfig : null;
      },
      getAnnotationActiveItem: function () {
        return runtime && runtime.annotationActiveItem ? runtime.annotationActiveItem : null;
      },
      getAnnotationDurationController: function () {
        return runtime && runtime.annotationDurationController
          ? runtime.annotationDurationController
          : null;
      },
      getAnnotationAudioController: function () {
        return runtime && runtime.annotationAudioController ? runtime.annotationAudioController : null;
      },
      getAnnotationInteractionRunner: function () {
        return runtime && runtime.annotationInteractionRunner
          ? runtime.annotationInteractionRunner
          : null;
      },
      getAnnotationToolbar: function () {
        return runtime && runtime.annotationToolbar ? runtime.annotationToolbar : null;
      },
      getAnnotationShortcutBus: function () {
        return runtime && runtime.annotationShortcutBus ? runtime.annotationShortcutBus : null;
      },
      getLegacyApiClient: function () {
        return runtime && runtime.legacyApiClient ? runtime.legacyApiClient : null;
      },
      getLegacyUserContext: function () {
        return runtime && runtime.legacyUserContext ? runtime.legacyUserContext : null;
      },
      getLegacyDictionarySync: function () {
        return runtime && runtime.legacyDictionarySync ? runtime.legacyDictionarySync : null;
      },
      getLegacyVersionCheck: function () {
        return runtime && runtime.legacyVersionCheck ? runtime.legacyVersionCheck : null;
      },
      getAnnotationItemCollector: function () {
        return runtime && runtime.annotationItemCollector ? runtime.annotationItemCollector : null;
      },
      getAnnotationItemValidator: function () {
        return runtime && runtime.annotationItemValidator ? runtime.annotationItemValidator : null;
      },
      getAnnotationFeedback: function () {
        return runtime && runtime.annotationFeedback ? runtime.annotationFeedback : null;
      },
      getAnnotationItemWriter: function () {
        return runtime && runtime.annotationItemWriter ? runtime.annotationItemWriter : null;
      },
      getAnnotationValidityWriter: function () {
        return runtime && runtime.annotationValidityWriter ? runtime.annotationValidityWriter : null;
      },
      getAnnotationQuickfillRunner: function () {
        return runtime && runtime.annotationQuickfillRunner ? runtime.annotationQuickfillRunner : null;
      },
      getAnnotationApplyRunner: function () {
        return runtime && runtime.annotationApplyRunner ? runtime.annotationApplyRunner : null;
      },
      getAnnotationApplyPolicy: function () {
        return runtime && runtime.annotationApplyPolicy ? runtime.annotationApplyPolicy : null;
      },
      getAnnotationPolicyExecutor: function () {
        return runtime && runtime.annotationPolicyExecutor
          ? runtime.annotationPolicyExecutor
          : null;
      },
      getAnnotationPagePlanPreview: function () {
        return runtime && runtime.annotationPagePlanPreview
          ? runtime.annotationPagePlanPreview
          : null;
      },
      getAnnotationPageReport: function () {
        return runtime && runtime.annotationPageReport ? runtime.annotationPageReport : null;
      },
      getAnnotationPageApplyRunner: function () {
        return runtime && runtime.annotationPageApplyRunner
          ? runtime.annotationPageApplyRunner
          : null;
      },
      getAnnotationFlowReport: function () {
        return runtime && runtime.annotationFlowReport ? runtime.annotationFlowReport : null;
      },
      getAnnotationControlPanel: function () {
        return runtime && runtime.annotationControlPanel ? runtime.annotationControlPanel : null;
      },
      getSettingsPanel: function () {
        return runtime && runtime.settingsPanel ? runtime.settingsPanel : null;
      },
      getAnnotationActionHistory: function () {
        return annotationActionHistory;
      },
      getAnnotationDebugSnapshot: function () {
        if (
          !annotationDebugSnapshot ||
          typeof annotationDebugSnapshot.capture !== "function" ||
          typeof annotationDebugSnapshot.exportText !== "function"
        ) {
          return null;
        }

        return {
          capture: function (request) {
            return annotationDebugSnapshot.capture(request, runtime, annotationActionHistory);
          },
          exportText: function (snapshot) {
            return annotationDebugSnapshot.exportText(snapshot);
          },
          captureText: function (request) {
            return annotationDebugSnapshot.exportText(
              annotationDebugSnapshot.capture(request, runtime, annotationActionHistory)
            );
          },
          DEFAULT_HISTORY_LIMIT:
            annotationDebugSnapshot.DEFAULT_HISTORY_LIMIT || annotationActionHistory.DEFAULT_LIMIT || 5,
          LOG_PREFIX:
            typeof annotationDebugSnapshot.LOG_PREFIX === "string"
              ? annotationDebugSnapshot.LOG_PREFIX
              : "[ASR Edge][annotation-debug-snapshot]",
        };
      },
    };
  }

  window.__ASREdgeAlibabaLabelxRuntimeDebug = {
    injectDebugBadge: injectDebugBadge,
    exposeRuntime: exposeRuntime,
    BADGE_ID: BADGE_ID,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
