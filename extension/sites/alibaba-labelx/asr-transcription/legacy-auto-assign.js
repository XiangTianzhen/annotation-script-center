(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-auto-assign]";
  const runtimeGate = window.__ASREdgeAlibabaLabelxRuntimeGate;

  let pollTimer = null;
  let isRunning = false;

  async function getAutomationSettings() {
    const settings = runtimeGate && typeof runtimeGate.getSettings === "function"
      ? await runtimeGate.getSettings()
      : {};
    return settings?.platforms?.alibabaLabelx?.automation || {};
  }

  function getAppId() {
    const search = new URLSearchParams(location.search);
    return search.get("projectId") || search.get("appId") || "1023";
  }

  function isCheckTaskListPage() {
    return location.pathname.toLowerCase().includes("checktask");
  }

  function normalizeTargetUsers(settings) {
    return String(settings?.autoAssignTargetUser || "")
      .split(/[,，|]/)
      .map(function (entry) {
        return entry.trim();
      })
      .filter(Boolean);
  }

  function normalizeKeywords(settings) {
    return String(settings?.autoAssignTaskKeyword || "")
      .split(/[,，|]/)
      .map(function (entry) {
        return entry.trim();
      })
      .filter(Boolean);
  }

  function clearPollTimer() {
    if (!pollTimer) {
      return false;
    }

    window.clearInterval(pollTimer);
    pollTimer = null;
    return true;
  }

  function buildReasonSummary(reason) {
    if (reason === "auto-assign-disabled") {
      return "自动抢单轮询未启动：自动抢单开关未开启。";
    }

    if (reason === "not-check-task-list") {
      return "自动抢单轮询未启动：当前页面不是审核任务列表。";
    }

    if (reason === "target-users-missing") {
      return "自动抢单轮询未启动：目标人员为空，请先配置目标人员。";
    }

    if (reason === "task-keywords-missing") {
      return "自动抢单轮询未启动：关键词为空，请先配置关键词或开启全部任务。";
    }

    if (reason === "auto-assign-already-running") {
      return "自动抢单轮询未启动：当前已有一次自动抢单执行正在进行。";
    }

    if (reason === "poll-already-started") {
      return "自动抢单轮询已在运行，无需重复启动。";
    }

    if (reason === "poll-not-running") {
      return "自动抢单轮询当前未运行。";
    }

    if (reason === "poll-stopped") {
      return "自动抢单轮询已停止。";
    }

    return "自动抢单轮询状态未知，reason=" + reason;
  }

  function createFailureResult(reason, extra) {
    return Object.assign(
      {
        success: false,
        started: false,
        reason: reason,
        summaryText: buildReasonSummary(reason),
      },
      extra || {}
    );
  }

  function getPollingPrecheckResult(settings) {
    const targetUsers = normalizeTargetUsers(settings);
    const keywords = normalizeKeywords(settings);

    if (settings?.autoAssignCheckTasks !== true) {
      return createFailureResult("auto-assign-disabled");
    }

    if (!isCheckTaskListPage()) {
      return createFailureResult("not-check-task-list");
    }

    if (targetUsers.length === 0) {
      return createFailureResult("target-users-missing");
    }

    if (settings?.autoAssignAllTasks !== true && keywords.length === 0) {
      return createFailureResult("task-keywords-missing");
    }

    return {
      success: true,
      started: false,
      targetUsers: targetUsers,
      keywords: keywords,
    };
  }

  async function execute(request) {
    return {
      success: false,
      reason: "disabled-in-basic-stage",
      summaryText: "当前基础转写阶段已禁用自动抢单。",
    };
  }

  async function startPolling() {
    clearPollTimer();
    return createFailureResult("disabled-in-basic-stage", {
      summaryText: "当前基础转写阶段已禁用自动抢单。",
    });
  }

  function stopPolling() {
    const stopped = clearPollTimer();
    return {
      success: true,
      stopped: stopped,
      reason: stopped ? "poll-stopped" : "poll-not-running",
      summaryText: buildReasonSummary(stopped ? "poll-stopped" : "poll-not-running"),
    };
  }

  window.__ASREdgeAlibabaLabelxLegacyAutoAssign = {
    execute: execute,
    startPolling: startPolling,
    stopPolling: stopPolling,
    isCheckTaskListPage: isCheckTaskListPage,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
