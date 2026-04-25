(function () {
  const LOG_PREFIX = "[ASR Edge][judgement-stats]";
  const DEFAULT_PAGE_SIZE = 400;
  const DEFAULT_UPLOAD_PATH = "/api/asr-judgement/statistics/upload";
  const DEFAULT_SERVER_UPLOAD_ENDPOINT =
    "http://47.108.254.138:3333" + DEFAULT_UPLOAD_PATH;
  const DEFAULT_UPLOAD_TIMES = ["10:00", "16:00"];
  const DEFAULT_UPLOAD_JITTER_MINUTES = 10;
  const CSV_COLUMNS = [
    "任务名称",
    "任务ID",
    "标注员1子任务ID",
    "标注员2子任务ID",
    "标注员3子任务ID",
    "审核子任务ID",
    "分包ID",
    "题数",
    "有效时长(秒)",
    "标注员1",
    "标注员2",
    "标注员3",
    "审核员",
    "标注员1领取时间",
    "标注员1提交时间",
    "标注员2领取时间",
    "标注员2提交时间",
    "标注员3领取时间",
    "标注员3提交时间",
    "审核领取时间",
    "审核提交时间",
    "标注员1是否完成",
    "标注员2是否完成",
    "标注员3是否完成",
    "审核是否完成",
  ];

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function normalizeUrlParam(value) {
    try {
      return decodeURIComponent(String(value || "")).trim();
    } catch (error) {
      return String(value || "").trim();
    }
  }

  function getUrlParams() {
    const params = new URLSearchParams(location.search || "");
    return {
      projectId: normalizeUrlParam(params.get("projectId") || ""),
      subTaskId: normalizeUrlParam(params.get("subTaskId") || ""),
      missionType: normalizeUrlParam(params.get("missionType") || ""),
    };
  }

  function trimSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function normalizeEndpoint(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }

    try {
      return new URL(text, location.origin).toString();
    } catch (error) {
      return "";
    }
  }

  function resolveUploadEndpoint(config) {
    const explicitEndpoint = normalizeEndpoint(config?.statsUploadEndpoint);
    if (explicitEndpoint) {
      return explicitEndpoint;
    }

    const server = config?.legacyServer || {};
    const baseUrl = server.useDebugApiBaseUrl === true ? server.debugApiBaseUrl : server.apiBaseUrl;
    const normalizedBaseUrl = normalizeEndpoint(baseUrl);
    return normalizedBaseUrl ? trimSlash(normalizedBaseUrl) + DEFAULT_UPLOAD_PATH : DEFAULT_SERVER_UPLOAD_ENDPOINT;
  }

  function normalizeTimeList(value) {
    const source = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(/[,，\n]/)
        : DEFAULT_UPLOAD_TIMES;
    const result = [];

    source.forEach(function (item) {
      const text = String(item || "").trim();
      const match = text.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!match) {
        return;
      }

      const normalized = String(Number(match[1])).padStart(2, "0") + ":" + match[2];
      if (result.indexOf(normalized) < 0) {
        result.push(normalized);
      }
    });

    return result.length > 0 ? result : DEFAULT_UPLOAD_TIMES.slice();
  }

  function parseScheduleResponse(body, fallbackConfig) {
    const data = body && typeof body === "object" ? body.data || body : {};
    const times = normalizeTimeList(
      data.times || data.uploadTimes || data.scheduleTimes || fallbackConfig.statsUploadTimes
    );
    const jitterMinutes = Number(data.jitterMinutes || data.randomDelayMinutes);

    return {
      enabled: data.enabled !== false,
      times: times,
      jitterMinutes: Number.isFinite(jitterMinutes)
        ? Math.max(0, Math.min(120, jitterMinutes))
        : Math.max(
            0,
            Math.min(
              120,
              Number(fallbackConfig.statsUploadJitterMinutes) || DEFAULT_UPLOAD_JITTER_MINUTES
            )
          ),
      source: body && typeof body === "object" ? "remote" : "local",
      fetchedAt: new Date().toISOString(),
    };
  }

  function buildSubtaskDataUrl(subTaskId, pageSize, page) {
    const url = new URL(
      "/api/v1/label/center/subTask/" + encodeURIComponent(subTaskId) + "/data",
      location.origin
    );
    url.searchParams.set("page", String(page || 1));
    url.searchParams.set("pageSize", String(pageSize || DEFAULT_PAGE_SIZE));
    url.searchParams.set("filterPassedVote", "false");
    url.searchParams.set(
      "filter",
      JSON.stringify({
        questions: [],
        dataStatus: "ALL",
        questionsQueryConditions: "AND",
      })
    );
    url.searchParams.set("_", String(Date.now()));
    return url;
  }

  async function fetchJson(url, init) {
    const response = await fetch(url.toString(), init || {});
    if (!response.ok) {
      throw new Error("请求失败：" + String(response.status));
    }

    const body = await response.json();
    if (body?.success === false || (body?.code !== undefined && body.code !== 0)) {
      throw new Error(body?.message || "业务响应失败。");
    }

    return body;
  }

  async function fetchSubtaskData(subTaskId) {
    const body = await fetchJson(buildSubtaskDataUrl(subTaskId, DEFAULT_PAGE_SIZE, 1), {
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });
    return body?.data || {};
  }

  function sumDurationSeconds(dataList) {
    return (Array.isArray(dataList) ? dataList : []).reduce(function (total, item) {
      const duration = Number(item?.data?.duration);
      return Number.isFinite(duration) && duration >= 0 ? total + duration : total;
    }, 0);
  }

  function formatDurationForCsv(totalSeconds) {
    const seconds = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    const decimal = Math.round((seconds - Math.floor(seconds)) * 10);
    return String(minutes) + ":" + String(rest).padStart(2, "0") + "." + String(decimal);
  }

  function getCurrentUserText() {
    const candidates = Array.from(
      document.querySelectorAll(
        ".header-component-container .ant-v5-select-selection-item, .header-component-container [title], .header-component-container"
      )
    );

    for (let index = 0; index < candidates.length; index += 1) {
      const text = String(candidates[index].textContent || candidates[index].getAttribute("title") || "")
        .replace(/\s+/g, " ")
        .trim();
      if (text && text !== "填写问卷" && text.length <= 40) {
        return text;
      }
    }

    return "";
  }

  function inferRole(subtaskData) {
    const type = String(subtaskData?.type || "").toUpperCase();
    if (type.indexOf("CHECK") >= 0 || type.indexOf("REVIEW") >= 0 || type.indexOf("AUDIT") >= 0) {
      return "audit";
    }

    return "label";
  }

  function getCompletionText(subtaskData) {
    if (subtaskData?.gmtCommit) {
      return "已完成";
    }

    const status = Number(subtaskData?.status);
    return Number.isFinite(status) && status > 0 ? "已完成" : "未完成";
  }

  function buildCsvBasePatch(subtaskData, durationSeconds) {
    return {
      任务名称: String(subtaskData?.taskName || ""),
      任务ID: String(subtaskData?.taskId || ""),
      分包ID: String(subtaskData?.batchId || ""),
      题数: String(subtaskData?.size || ""),
      "有效时长(秒)": formatDurationForCsv(durationSeconds),
    };
  }

  function buildPayload(subtaskData, durationSeconds, reason) {
    const urlParams = getUrlParams();
    const dataList = Array.isArray(subtaskData?.dataList) ? subtaskData.dataList : [];
    const firstItem = dataList[0] || {};
    const role = inferRole(subtaskData);
    const batchId = String(subtaskData?.batchId || "");
    const subTaskId = String(subtaskData?.id || urlParams.subTaskId || "");
    const userName = getCurrentUserText();
    const completed = getCompletionText(subtaskData);
    const now = new Date().toISOString();

    return {
      schemaVersion: 1,
      source: "edge-extension",
      project: "alibaba-labelx/asr-judgement",
      reason: reason || "manual",
      uploadedAt: now,
      mergeKey: {
        batchId: batchId,
      },
      url: {
        projectId: urlParams.projectId,
        subTaskId: urlParams.subTaskId,
        missionType: urlParams.missionType,
      },
      csvColumns: CSV_COLUMNS.slice(),
      csvPatch: buildCsvBasePatch(subtaskData, durationSeconds),
      roleRecord: {
        role: role,
        subTaskId: subTaskId,
        taskId: String(subtaskData?.taskId || ""),
        batchId: batchId,
        userId: String(firstItem?.userId || ""),
        userName: userName,
        receiveTime: String(subtaskData?.gmtCreate || ""),
        submitTime: String(subtaskData?.gmtCommit || ""),
        completed: completed,
      },
      metrics: {
        itemCount: Number(subtaskData?.size) || dataList.length,
        fetchedItemCount: dataList.length,
        durationSeconds: durationSeconds,
        durationText: formatDurationForCsv(durationSeconds),
        answeredCount: dataList.filter(function (item) {
          return Array.isArray(item?.result?.markResult) && item.result.markResult.some(Boolean);
        }).length,
      },
      rawKeys: {
        subTaskType: String(subtaskData?.type || ""),
        status: subtaskData?.status ?? null,
        labelModel: String(subtaskData?.labelModel || ""),
      },
      dedupeKey: [
        batchId,
        subTaskId,
        reason || "manual",
        new Date().toISOString().slice(0, 10),
      ].join("|"),
    };
  }

  function createState() {
    return {
      started: false,
      uploading: false,
      lastUploadAt: null,
      lastUploadReason: "",
      lastUploadOk: null,
      lastMessage: "",
      nextScheduleAt: null,
      schedule: {
        enabled: true,
        times: DEFAULT_UPLOAD_TIMES.slice(),
        jitterMinutes: DEFAULT_UPLOAD_JITTER_MINUTES,
        source: "local",
      },
    };
  }

  function createRuntime(deps) {
    const options = deps && typeof deps === "object" ? deps : {};
    let state = createState();
    let scheduleTimer = null;

    function getConfig() {
      return typeof options.getConfig === "function" ? options.getConfig() || {} : {};
    }

    function shouldApply() {
      return typeof options.shouldApply === "function" ? options.shouldApply() === true : false;
    }

    function notify() {
      if (typeof options.onStateChange === "function") {
        options.onStateChange(clone(state));
      }
    }

    function setMessage(ok, reason, message) {
      state.lastUploadOk = ok;
      state.lastUploadReason = reason || "";
      state.lastMessage = message || "";
      state.lastUploadAt = new Date().toISOString();
      notify();
    }

    function showToast(message, tone) {
      if (typeof options.showToast === "function") {
        options.showToast(message, tone || "info");
      }
    }

    function clearScheduleTimer() {
      if (scheduleTimer) {
        window.clearTimeout(scheduleTimer);
        scheduleTimer = null;
      }
    }

    async function refreshSchedule() {
      const config = getConfig();
      const fallback = {
        times: normalizeTimeList(config.statsUploadTimes),
        jitterMinutes: Math.max(
          0,
          Math.min(120, Number(config.statsUploadJitterMinutes) || DEFAULT_UPLOAD_JITTER_MINUTES)
        ),
      };
      const scheduleUrl = normalizeEndpoint(config.statsScheduleUrl);
      if (!scheduleUrl) {
        state.schedule = Object.assign({ enabled: true, source: "local" }, fallback);
        notify();
        return state.schedule;
      }

      const url = new URL(scheduleUrl);
      const params = getUrlParams();
      if (params.projectId) {
        url.searchParams.set("projectId", params.projectId);
      }
      if (params.subTaskId) {
        url.searchParams.set("subTaskId", params.subTaskId);
      }

      try {
        const body = await fetchJson(url, {
          cache: "no-store",
          credentials: "omit",
          headers: {
            Accept: "application/json",
          },
        });
        state.schedule = parseScheduleResponse(body, config);
      } catch (error) {
        state.schedule = Object.assign({ enabled: true, source: "local-fallback" }, fallback);
        console.warn(LOG_PREFIX, "Failed to fetch schedule config:", error);
      }

      notify();
      return state.schedule;
    }

    function getNextScheduleDelay(schedule) {
      const times = normalizeTimeList(schedule?.times || DEFAULT_UPLOAD_TIMES);
      const now = new Date();
      let bestTime = null;

      times.forEach(function (timeText) {
        const parts = timeText.split(":");
        const target = new Date(now.getTime());
        target.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
        if (target.getTime() <= now.getTime()) {
          target.setDate(target.getDate() + 1);
        }

        if (!bestTime || target.getTime() < bestTime.getTime()) {
          bestTime = target;
        }
      });

      const jitterMs = Math.floor(Math.random() * ((Number(schedule?.jitterMinutes) || 0) * 60000 + 1));
      return {
        targetTime: bestTime,
        delayMs: Math.max(1000, bestTime.getTime() - now.getTime() + jitterMs),
      };
    }

    function scheduleNextUpload() {
      clearScheduleTimer();
      const config = getConfig();
      if (
        !state.started ||
        !shouldApply() ||
        config.statsUploadEnabled === false ||
        config.statsAutoUploadOnSchedule === false ||
        state.schedule.enabled === false
      ) {
        state.nextScheduleAt = null;
        notify();
        return;
      }

      const next = getNextScheduleDelay(state.schedule);
      state.nextScheduleAt = next.targetTime.toISOString();
      notify();
      scheduleTimer = window.setTimeout(function () {
        scheduleTimer = null;
        void uploadNow("schedule").finally(function () {
          void refreshSchedule().finally(scheduleNextUpload);
        });
      }, next.delayMs);
    }

    async function collectPayload(reason) {
      const params = getUrlParams();
      if (!params.subTaskId) {
        throw new Error("当前 URL 中没有 subTaskId，无法上传统计。");
      }

      const subtaskData = await fetchSubtaskData(params.subTaskId);
      const durationSeconds = sumDurationSeconds(subtaskData.dataList);
      return buildPayload(subtaskData, durationSeconds, reason);
    }

    async function postPayload(payload) {
      const config = getConfig();
      const endpoint = resolveUploadEndpoint(config);
      if (!endpoint) {
        throw new Error("统计上传地址未配置。");
      }

      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timeoutMs = Math.max(1000, Number(config.statsUploadRequestTimeoutMs) || 20000);
      const timeoutId = controller
        ? window.setTimeout(function () {
            controller.abort();
          }, timeoutMs)
        : null;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          cache: "no-store",
          credentials: "omit",
          signal: controller ? controller.signal : undefined,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
          },
          body: JSON.stringify(payload),
        });
        const contentType = response.headers.get("content-type") || "";
        const body = contentType.indexOf("application/json") >= 0 ? await response.json() : await response.text();
        if (!response.ok) {
          throw new Error("上传失败：" + String(response.status));
        }
        if (body && typeof body === "object" && body.success === false) {
          throw new Error(body.message || "统计上传业务失败。");
        }
        return body;
      } finally {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      }
    }

    async function uploadNow(reason) {
      const uploadReason = reason || "manual";
      const config = getConfig();
      if (!shouldApply()) {
        return {
          ok: false,
          reason: "runtime-disabled",
          message: "当前不是快判详情运行态，未上传统计。",
        };
      }
      if (config.statsUploadEnabled === false) {
        return {
          ok: false,
          reason: "stats-upload-disabled",
          message: "统计上传已关闭。",
        };
      }
      if (state.uploading) {
        return {
          ok: false,
          reason: "uploading",
          message: "统计上传正在进行中。",
        };
      }

      state.uploading = true;
      notify();
      try {
        const payload = await collectPayload(uploadReason);
        await postPayload(payload);
        setMessage(true, uploadReason, "统计数据已上传。");
        showToast("统计数据已上传。", "info");
        return {
          ok: true,
          reason: uploadReason,
          message: "统计数据已上传。",
          payload: {
            batchId: payload.mergeKey.batchId,
            subTaskId: payload.roleRecord.subTaskId,
            itemCount: payload.metrics.itemCount,
          },
        };
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        setMessage(false, uploadReason, message);
        showToast("统计上传失败：" + message, "error");
        return {
          ok: false,
          reason: uploadReason,
          message: message,
        };
      } finally {
        state.uploading = false;
        notify();
      }
    }

    function start() {
      state.started = true;
      void refreshSchedule().finally(scheduleNextUpload);
      notify();
    }

    function stop() {
      state.started = false;
      state.nextScheduleAt = null;
      clearScheduleTimer();
      notify();
    }

    function getState() {
      return clone(state);
    }

    return {
      start: start,
      stop: stop,
      uploadNow: uploadNow,
      getState: getState,
    };
  }

  globalThis.__ASREdgeAlibabaLabelxJudgementServer = {
    createRuntime: createRuntime,
    buildPayload: buildPayload,
    CSV_COLUMNS: CSV_COLUMNS.slice(),
  };
})();
