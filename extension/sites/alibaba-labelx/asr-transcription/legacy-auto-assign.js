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
    const options = request && typeof request === "object" ? request : {};
    const settings = await getAutomationSettings();
    const isManual = options.manual === true;

    if (!isManual && settings.autoAssignCheckTasks !== true) {
      return {
        success: false,
        reason: "auto-assign-disabled",
      };
    }

    if (!isCheckTaskListPage()) {
      return {
        success: false,
        reason: "not-check-task-list",
      };
    }

    if (isRunning) {
      return {
        success: false,
        reason: "auto-assign-already-running",
        summaryText: "自动抢单正在执行中，请稍后重试。",
      };
    }

    const targetUsers = normalizeTargetUsers(settings);
    const keywords = normalizeKeywords(settings);

    if (targetUsers.length === 0) {
      return {
        success: false,
        reason: "target-users-missing",
        summaryText: "自动抢单目标人员为空，请先在设置中填写目标人员。",
      };
    }

    if (settings.autoAssignAllTasks !== true && keywords.length === 0) {
      return {
        success: false,
        reason: "task-keywords-missing",
        summaryText: "自动抢单关键词为空，请先配置关键词或开启全部任务。",
      };
    }

    isRunning = true;

    try {
      const taskResponse = await fetch(
        "/api/v1/label/center/tasks?subTaskType=check&keyword=&appId=" +
          encodeURIComponent(getAppId()) +
          "&page=1&pageSize=50&_=" +
          Date.now(),
        { cache: "no-store" }
      );
      const taskJson = taskResponse.ok ? await taskResponse.json() : null;
      let tasks = Array.isArray(taskJson?.data?.data) ? taskJson.data.data : [];

      if (settings.autoAssignAllTasks !== true) {
        tasks = tasks.filter(function (task) {
          const taskName = String(task?.name || "");
          const taskId = String(task?.taskId || "");
          return keywords.some(function (keyword) {
            return taskName.includes(keyword) || taskId === keyword;
          });
        });
      }

      let assignedCount = 0;
      let checkedTaskCount = 0;

      for (const task of tasks) {
        const detailResponse = await fetch(
          "/api/v1/label/center/" + encodeURIComponent(task.taskId) + "/check/filter-detail",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            },
            body: "id=" + encodeURIComponent(task.taskId) + "&_=" + Date.now(),
          }
        );
        const detailJson = detailResponse.ok ? await detailResponse.json() : null;
        const userProcesses = Array.isArray(detailJson?.data?.userProcesses)
          ? detailJson.data.userProcesses
          : null;
        if (!detailJson?.success || !userProcesses) {
          continue;
        }

        checkedTaskCount += 1;
        const matchedUsers = userProcesses.filter(function (entry) {
          const name = String(entry?.operator?.name || "");
          const nickName = String(entry?.operator?.nickName || "");
          return targetUsers.some(function (targetUser) {
            return name.includes(targetUser) || nickName.includes(targetUser);
          });
        });

        if (matchedUsers.length === 0) {
          continue;
        }

        const batchSize = settings.autoAssignFetchAll === true
          ? 99999
          : Number.parseInt(settings.autoAssignBatchSize, 10) || 1;
        const assignResponse = await fetch(
          "/api/v1/label/center/batch/check_batch?taskId=" + encodeURIComponent(task.taskId),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=UTF-8",
            },
            body: JSON.stringify({
              taskId: task.taskId,
              userList: matchedUsers.map(function (entry) {
                return {
                  userId: entry.operator.userId,
                  batchSize: batchSize,
                };
              }),
            }),
          }
        );
        const assignJson = assignResponse.ok ? await assignResponse.json() : null;
        if (assignJson?.success && assignJson?.data !== false) {
          assignedCount += 1;
        }
      }

      return {
        success: true,
        checkedTaskCount: checkedTaskCount,
        assignedCount: assignedCount,
        summaryText:
          assignedCount > 0
            ? "自动抢单已成功分派 " + assignedCount + " 个任务。"
            : "自动抢单检查完成，但没有新的可分派任务。",
      };
    } finally {
      isRunning = false;
    }
  }

  async function startPolling() {
    const settings = await getAutomationSettings();
    const intervalMs = Number.parseInt(settings.autoAssignPollIntervalMs, 10) || 60000;
    const precheckResult = getPollingPrecheckResult(settings);

    if (!precheckResult.success) {
      clearPollTimer();
      return precheckResult;
    }

    if (pollTimer) {
      return createFailureResult("poll-already-started", {
        intervalMs: intervalMs,
      });
    }

    if (isRunning) {
      return createFailureResult("auto-assign-already-running");
    }

    const firstResult = await execute({ manual: false });

    if (!firstResult?.success) {
      clearPollTimer();
      return Object.assign(
        createFailureResult(firstResult?.reason || "poll-not-started"),
        firstResult || {}
      );
    }

    pollTimer = window.setInterval(function () {
      void execute({ manual: false });
    }, intervalMs);

    return {
      success: true,
      started: true,
      reason: "poll-started",
      intervalMs: intervalMs,
      firstResult: firstResult,
      checkedTaskCount: firstResult.checkedTaskCount,
      assignedCount: firstResult.assignedCount,
      summaryText:
        "自动抢单轮询已启动（间隔 " +
        intervalMs +
        "ms），首次检查已完成。" +
        (typeof firstResult.summaryText === "string" && firstResult.summaryText
          ? " " + firstResult.summaryText
          : ""),
    };
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
