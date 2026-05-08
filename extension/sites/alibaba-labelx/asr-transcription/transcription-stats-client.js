(function () {
  const LOG_PREFIX = "[ASR Edge][transcription-stats]";
  const TRANSCRIPTION_DETAIL_PAGE_SIZE = 10;
  const TRANSCRIPTION_DETAIL_MAX_PAGES = 20;
  const DEFAULT_HOME_PAGE_SIZE = 100;
  const DEFAULT_UPLOAD_PATH = "/api/alibaba-labelx/asr-transcription/statistics/upload";
  const DEFAULT_SERVER_UPLOAD_ENDPOINT =
    "https://script.xiangtianzhen.store" + DEFAULT_UPLOAD_PATH;
  const DEFAULT_UPLOAD_TIMES = ["10:00", "16:00"];
  const DEFAULT_UPLOAD_JITTER_MINUTES = 10;
  const TRANSCRIPTION_LABEL_MODEL = "single";
  const JUDGEMENT_LABEL_MODEL = "vote";
  const TRANSCRIPTION_TASK_SIZE = 50;
  const JUDGEMENT_TASK_SIZE = 400;
  const HOME_TASK_KINDS = [
    {
      key: "label",
      role: "label",
      route: "/corpora/labeling/labelingtask",
      listType: "label",
      taskType: "label",
      label: "标注",
    },
    {
      key: "check",
      role: "audit",
      route: "/corpora/labeling/checktask",
      listType: "check",
      taskType: "check",
      label: "审核",
    },
  ];
  const CSV_COLUMNS = [
    "任务名称",
    "任务ID",
    "标注子任务ID",
    "审核子任务ID",
    "分包ID",
    "题数",
    "有效时长(秒)",
    "标注员",
    "审核员",
    "标注领取时间",
    "标注提交时间",
    "审核领取时间",
    "审核提交时间",
    "标注是否完成",
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

  function sanitizeSubTaskId(value) {
    let decoded = "";
    try {
      decoded = decodeURIComponent(String(value || ""));
    } catch (error) {
      decoded = String(value || "");
    }
    return decoded.replace(/[\s\u3000]+/g, "").trim();
  }

  function getUrlParams() {
    const params = new URLSearchParams(location.search || "");
    return {
      projectId: normalizeUrlParam(params.get("projectId") || ""),
      subTaskId: sanitizeSubTaskId(params.get("subTaskId") || ""),
      missionType: normalizeUrlParam(params.get("missionType") || ""),
    };
  }

  function getProjectIdFromUrl() {
    return getUrlParams().projectId || "";
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

  function summarizeUploadResponseBody(body) {
    if (!body) {
      return "";
    }
    const text =
      typeof body === "string"
        ? body
        : body.message
          ? body.message
          : JSON.stringify(body);
    return String(text || "").replace(/\s+/g, " ").trim().slice(0, 300);
  }

  function getEndpointLabel(endpoint) {
    try {
      const url = new URL(endpoint);
      return url.origin + url.pathname;
    } catch (error) {
      return String(endpoint || "").trim();
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

  function resolveScheduleEndpoint(config) {
    const uploadEndpoint = resolveUploadEndpoint(config);
    if (!uploadEndpoint) {
      return "";
    }
    try {
      const url = new URL(uploadEndpoint);
      url.searchParams.set("purpose", "schedule");
      return url.toString();
    } catch (error) {
      return "";
    }
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
    url.searchParams.set("pageSize", String(pageSize || TRANSCRIPTION_DETAIL_PAGE_SIZE));
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

  function getHomeTaskKind(pathname) {
    const routeText = String(pathname || location.pathname || "").toLowerCase();
    return (
      HOME_TASK_KINDS.find(function (kind) {
        return routeText.indexOf(kind.route) >= 0;
      }) || null
    );
  }

  function getHomeTaskKindsToFetch() {
    return HOME_TASK_KINDS.slice();
  }

  function buildHomeTasksUrl(projectId, page, pageSize, kind) {
    const url = new URL("/api/v1/label/center/tasks", location.origin);
    url.searchParams.set("subTaskType", String(kind?.taskType || "label"));
    url.searchParams.set("keyword", "");
    url.searchParams.set("appId", String(projectId || ""));
    url.searchParams.set("page", String(page || 1));
    url.searchParams.set("pageSize", String(pageSize || DEFAULT_HOME_PAGE_SIZE));
    url.searchParams.set("_", String(Date.now()));
    return url;
  }

  function buildHomeSubTasksUrl(projectId, finished, page, pageSize, kind) {
    const url = new URL("/api/v1/label/center/subTasks", location.origin);
    url.searchParams.set("type", String(kind?.listType || "label"));
    url.searchParams.set("keyword", "");
    url.searchParams.set("appId", String(projectId || ""));
    url.searchParams.set("finished", finished ? "true" : "false");
    url.searchParams.set("page", String(page || 1));
    url.searchParams.set("pageSize", String(pageSize || DEFAULT_HOME_PAGE_SIZE));
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

  async function fetchSubtaskDataPage(cleanSubTaskId, page, pageSize) {
    const requestPage = Math.max(1, Number(page) || 1);
    const requestPageSize = Math.max(1, Number(pageSize) || TRANSCRIPTION_DETAIL_PAGE_SIZE);
    try {
      const body = await fetchJson(buildSubtaskDataUrl(cleanSubTaskId, requestPageSize, requestPage), {
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
      });
      const data = body?.data && typeof body.data === "object" ? body.data : {};
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data.list) ? data.list : [];
      const recordCount = Number(data.recordCount ?? data.total ?? list.length);
      return {
        list: list,
        recordCount: Number.isFinite(recordCount) && recordCount >= 0 ? recordCount : list.length,
        raw: data,
      };
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      throw new Error(
        "子任务详情请求失败（subTaskId=" +
          cleanSubTaskId +
          ", page=" +
          String(requestPage) +
          "）：" +
          message
      );
    }
  }

  async function fetchSubtaskDataPages(subTaskId) {
    const cleanSubTaskId = sanitizeSubTaskId(subTaskId);
    if (!cleanSubTaskId) {
      console.warn(LOG_PREFIX, "Skip subtask data fetch: empty sanitized subTaskId.");
      return {
        subTaskId: "",
        dataList: [],
        recordCount: 0,
        fetchedItemCount: 0,
        rawPageData: [],
      };
    }

    const allItems = [];
    const rawPageData = [];
    let recordCount = 0;
    for (let page = 1; page <= TRANSCRIPTION_DETAIL_MAX_PAGES; page += 1) {
      const pageResult = await fetchSubtaskDataPage(
        cleanSubTaskId,
        page,
        TRANSCRIPTION_DETAIL_PAGE_SIZE
      );
      rawPageData.push({
        page: page,
        itemCount: pageResult.list.length,
        recordCount: pageResult.recordCount,
      });
      if (page === 1) {
        recordCount = pageResult.recordCount;
      } else if (recordCount <= 0 && pageResult.recordCount > 0) {
        recordCount = pageResult.recordCount;
      }

      if (pageResult.list.length === 0) {
        break;
      }
      allItems.push.apply(allItems, pageResult.list);

      if ((recordCount > 0 && allItems.length >= recordCount) || pageResult.list.length < TRANSCRIPTION_DETAIL_PAGE_SIZE) {
        break;
      }
    }

    return {
      subTaskId: cleanSubTaskId,
      dataList: allItems,
      recordCount: recordCount > 0 ? recordCount : allItems.length,
      fetchedItemCount: allItems.length,
      rawPageData: rawPageData,
    };
  }

  async function fetchSubtaskDetail(summary) {
    const safeSummary = summary && typeof summary === "object" ? summary : {};
    const cleanSubTaskId = sanitizeSubTaskId(getSummarySubTaskId(safeSummary));
    if (!cleanSubTaskId) {
      console.warn(LOG_PREFIX, "Skip subtask detail: invalid subTaskId in summary.");
      return Object.assign({}, safeSummary, {
        id: "",
        dataList: [],
        recordCount: 0,
        fetchedItemCount: 0,
      });
    }

    const pageResult = await fetchSubtaskDataPages(cleanSubTaskId);
    return Object.assign({}, safeSummary, {
      id: cleanSubTaskId,
      dataList: pageResult.dataList,
      recordCount: pageResult.recordCount,
      fetchedItemCount: pageResult.fetchedItemCount,
      rawPageData: pageResult.rawPageData,
    });
  }

  function normalizeListPage(body) {
    const data = body?.data && typeof body.data === "object" ? body.data : {};
    const list = Array.isArray(data.data) ? data.data : Array.isArray(data.list) ? data.list : [];
    const recordCount = Number(data.recordCount ?? data.total ?? list.length);
    return {
      list: list,
      recordCount: Number.isFinite(recordCount) && recordCount >= 0 ? recordCount : list.length,
    };
  }

  async function fetchPagedList(buildUrl, pageSize) {
    const normalizedPageSize = pageSize || DEFAULT_HOME_PAGE_SIZE;
    const result = [];
    let page = 1;
    let recordCount = 0;

    while (page <= 50) {
      const body = await fetchJson(buildUrl(page, normalizedPageSize), {
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });
      const normalized = normalizeListPage(body);
      recordCount = normalized.recordCount;
      result.push.apply(result, normalized.list);
      if (result.length >= recordCount || normalized.list.length < normalizedPageSize) {
        break;
      }
      page += 1;
    }

    return {
      list: result,
      recordCount: recordCount || result.length,
    };
  }

  async function fetchHomeTasks(projectId, kind) {
    return fetchPagedList(function (page, pageSize) {
      return buildHomeTasksUrl(projectId, page, pageSize, kind);
    }, DEFAULT_HOME_PAGE_SIZE);
  }

  async function fetchHomeSubTasks(projectId, finished, kind) {
    return fetchPagedList(function (page, pageSize) {
      return buildHomeSubTasksUrl(projectId, finished, page, pageSize, kind);
    }, DEFAULT_HOME_PAGE_SIZE);
  }

  function roundDurationSeconds(totalSeconds) {
    const seconds = Math.max(0, Number(totalSeconds) || 0);
    return Math.round((seconds + Number.EPSILON) * 10000) / 10000;
  }

  function formatDurationForCsv(totalSeconds) {
    const text = roundDurationSeconds(totalSeconds).toFixed(4);
    return text.replace(/\.?0+$/, "");
  }

  function getItemDurationSeconds(item) {
    const candidates = [
      item?.data?.duration,
      item?.duration,
      item?.audioDuration,
      item?.data?.audioDuration,
      item?.data?.audio?.duration,
    ];

    for (let index = 0; index < candidates.length; index += 1) {
      const duration = Number(candidates[index]);
      if (Number.isFinite(duration) && duration >= 0) {
        return duration;
      }
    }
    return 0;
  }

  function sumDurationSeconds(dataList) {
    const total = (Array.isArray(dataList) ? dataList : []).reduce(function (sum, item) {
      return sum + getItemDurationSeconds(item);
    }, 0);
    return roundDurationSeconds(total);
  }

  function getFirstRecordValue(records, keys) {
    const recordList = Array.isArray(records) ? records : [records];
    for (let recordIndex = 0; recordIndex < recordList.length; recordIndex += 1) {
      const record = recordList[recordIndex];
      if (!record || typeof record !== "object") {
        continue;
      }

      for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        const value = record[keys[keyIndex]];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          return value;
        }
      }
    }

    return "";
  }

  function normalizeTaskName(value) {
    return String(value || "").replace(/\s+/g, "").toLowerCase();
  }

  function getTaskSizeFromRecords(records) {
    const size = Number(getFirstRecordValue(records, ["size", "total", "itemCount"]));
    return Number.isFinite(size) ? size : null;
  }

  function hasJudgementTaskName(name) {
    const normalized = normalizeTaskName(name);
    return (
      normalized.indexOf("asr更优结果判断") >= 0 ||
      normalized.indexOf("asr更优") >= 0 ||
      normalized.indexOf("更优结果判断") >= 0 ||
      normalized.indexOf("更优判断") >= 0
    );
  }

  function hasTranscriptionTaskName(name) {
    const normalized = normalizeTaskName(name);
    return (
      normalized.indexOf("中文普通话asr任务") >= 0 ||
      normalized.indexOf("中文普通话asr") >= 0 ||
      normalized.indexOf("asr任务") >= 0 ||
      normalized.indexOf("普通话asr") >= 0
    );
  }

  function getTaskIdentityRecords(record, linkedTask) {
    return [record || {}, linkedTask || {}];
  }

  function isAsrTranscriptionTaskRecord(record, linkedTask) {
    const records = getTaskIdentityRecords(record, linkedTask);
    const labelModel = String(getFirstRecordValue(records, ["labelModel"]) || "").toLowerCase();
    const taskName = getFirstRecordValue(records, ["taskName", "name"]);
    const size = getTaskSizeFromRecords(records);
    const hasJudgementName = hasJudgementTaskName(taskName);
    const hasTranscriptionName = hasTranscriptionTaskName(taskName);
    const normalizedTaskName = normalizeTaskName(taskName);

    if (labelModel === JUDGEMENT_LABEL_MODEL) {
      return false;
    }
    if (hasJudgementName) {
      return false;
    }
    if (
      size === JUDGEMENT_TASK_SIZE &&
      (normalizedTaskName.indexOf("更优") >= 0 || normalizedTaskName.indexOf("判断") >= 0)
    ) {
      return false;
    }
    if (labelModel === TRANSCRIPTION_LABEL_MODEL) {
      return true;
    }
    if (hasTranscriptionName) {
      return true;
    }
    if (size === TRANSCRIPTION_TASK_SIZE && !hasJudgementName) {
      return true;
    }
    return false;
  }

  function isIgnoredUserText(text) {
    return (
      !text ||
      text === "填写问卷" ||
      text === "退出登录" ||
      text === "标注中心" ||
      text === "帮助文档" ||
      text === "智能标注" ||
      text.indexOf("总时长") >= 0 ||
      text.indexOf("上传统计") >= 0 ||
      text.indexOf("上传转写统计") >= 0
    );
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
      if (!isIgnoredUserText(text) && text.length <= 40) {
        return text;
      }
    }

    return "";
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function getVisibleText(node) {
    return String(node?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function dispatchMouseEvent(element, type) {
    if (!element) {
      return;
    }

    element.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  }

  function findAvatarTrigger() {
    return (
      document.querySelector(
        ".ant-v5-dropdown-trigger[class*='NavAvatar-module__userInfoWrapper'], .ant-v5-dropdown-trigger.avatar, [class*='NavAvatar-module__userInfoWrapper'], .header-component-container .ant-v5-avatar"
      ) || null
    );
  }

  function readVisibleAvatarDropdownUserText() {
    const menuItems = Array.from(
      document.querySelectorAll(
        ".ant-v5-dropdown:not(.ant-v5-dropdown-hidden) .ant-v5-dropdown-menu-item, .ant-v5-dropdown-menu:not(.ant-v5-dropdown-menu-hidden) .ant-v5-dropdown-menu-item"
      )
    );

    const userItem =
      menuItems.find(function (item) {
        return String(item.className || "").indexOf("NavAvatar-module__userAvatar") >= 0;
      }) || menuItems[0] || null;
    const candidates = userItem
      ? Array.from(
          userItem.querySelectorAll(
            ".ant-v5-dropdown-menu-title-content, [class*='title-content'], span, div"
          )
        )
      : [];
    if (userItem) {
      candidates.unshift(userItem);
    }

    for (let index = 0; index < candidates.length; index += 1) {
      const text = getVisibleText(candidates[index]);
      if (!isIgnoredUserText(text) && text.length <= 50) {
        return text;
      }
    }

    return "";
  }

  async function resolveCurrentUserText() {
    const avatar = findAvatarTrigger();
    if (avatar) {
      dispatchMouseEvent(avatar, "mouseenter");
      dispatchMouseEvent(avatar, "mouseover");
      dispatchMouseEvent(avatar, "mousemove");
      await delay(180);
      const dropdownText = readVisibleAvatarDropdownUserText();
      dispatchMouseEvent(avatar, "mouseleave");
      if (dropdownText) {
        return dropdownText;
      }
    }

    return getCurrentUserText();
  }

  function inferRole(subtaskData, overrideRole) {
    if (overrideRole === "audit" || overrideRole === "label") {
      return overrideRole;
    }

    const currentKind = getHomeTaskKind();
    if (currentKind?.role) {
      return currentKind.role;
    }

    const missionType = String(getUrlParams().missionType || "").toLowerCase();
    if (missionType === "check" || missionType === "audit" || missionType === "review") {
      return "audit";
    }

    const type = String(subtaskData?.type || "").toUpperCase();
    const sourceType = String(subtaskData?.sourceType || "").toUpperCase();
    if (
      type.indexOf("CHECK") >= 0 ||
      type.indexOf("REVIEW") >= 0 ||
      type.indexOf("AUDIT") >= 0 ||
      sourceType.indexOf("CHECK") >= 0
    ) {
      return "audit";
    }

    return "label";
  }

  function getCompletionText(subtaskData) {
    if (subtaskData?.gmtCommit || subtaskData?.commitTime || subtaskData?.submitTime) {
      return "已完成";
    }
    const status = Number(subtaskData?.status);
    if (Number.isFinite(status)) {
      return status > 0 ? "已完成" : "未完成";
    }
    return "未完成";
  }

  function formatDateTime(value) {
    if (value === undefined || value === null || value === "") {
      return "";
    }
    let date = null;
    if (typeof value === "number") {
      date = new Date(value);
    } else {
      const text = String(value).trim();
      const numeric = Number(text);
      if (Number.isFinite(numeric) && text.length >= 10) {
        date = new Date(numeric);
      } else {
        const normalized = text.replace(/-/g, "/");
        const parsed = new Date(normalized);
        if (!Number.isNaN(parsed.getTime())) {
          date = parsed;
        } else {
          return text;
        }
      }
    }

    if (!date || Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, "0");
    return (
      String(year) +
      "/" +
      String(month) +
      "/" +
      String(day) +
      " " +
      String(hour) +
      ":" +
      minute
    );
  }

  function buildCsvBasePatch(subtaskData, durationSeconds) {
    const role = inferRole(subtaskData);
    const completed = getCompletionText(subtaskData);
    const receiveTime = formatDateTime(
      subtaskData?.gmtCreate || subtaskData?.receiveTime || subtaskData?.createTime
    );
    const submitTime = formatDateTime(
      subtaskData?.gmtCommit || subtaskData?.submitTime || subtaskData?.commitTime
    );
    return {
      任务名称: String(subtaskData?.taskName || ""),
      任务ID: String(subtaskData?.taskId || ""),
      标注子任务ID: role === "label" ? String(subtaskData?.id || "") : "",
      审核子任务ID: role === "audit" ? String(subtaskData?.id || "") : "",
      分包ID: String(subtaskData?.batchId || ""),
      题数: String(subtaskData?.size || ""),
      "有效时长(秒)": formatDurationForCsv(durationSeconds),
      标注员: "",
      审核员: "",
      标注领取时间: role === "label" ? receiveTime : "",
      标注提交时间: role === "label" ? submitTime : "",
      审核领取时间: role === "audit" ? receiveTime : "",
      审核提交时间: role === "audit" ? submitTime : "",
      标注是否完成: role === "label" ? completed : "",
      审核是否完成: role === "audit" ? completed : "",
    };
  }

  function getUserNameFromRecord(record) {
    return String(
      record?.userName ||
        record?.operatorName ||
        record?.operator ||
        record?.nickName ||
        record?.displayName ||
        ""
    ).trim();
  }

  function buildPayload(subtaskData, durationSeconds, reason, context) {
    const payloadContext = context && typeof context === "object" ? context : {};
    const urlParams = getUrlParams();
    const dataList = Array.isArray(subtaskData?.dataList) ? subtaskData.dataList : [];
    const firstItem = dataList[0] || {};
    const normalizedDurationSeconds = roundDurationSeconds(durationSeconds);
    const role = inferRole(subtaskData, payloadContext.role);
    const batchId = String(subtaskData?.batchId || "");
    const subTaskId = sanitizeSubTaskId(subtaskData?.id || urlParams.subTaskId || "");
    const userName =
      payloadContext.userName ||
      getUserNameFromRecord(subtaskData) ||
      getUserNameFromRecord(firstItem) ||
      "";
    const completed = getCompletionText(subtaskData);

    return {
      schemaVersion: 1,
      source: "chromium-extension",
      project: "alibaba-labelx/asr-transcription",
      reason: reason || "manual",
      uploadedAt: new Date().toISOString(),
      mergeKey: {
        batchId: batchId,
      },
      url: {
        projectId: urlParams.projectId,
        subTaskId: urlParams.subTaskId,
        missionType: urlParams.missionType,
      },
      csvColumns: CSV_COLUMNS.slice(),
      csvPatch: buildCsvBasePatch(subtaskData, normalizedDurationSeconds),
      roleRecord: {
        role: role,
        subTaskId: subTaskId,
        taskId: String(subtaskData?.taskId || ""),
        batchId: batchId,
        userId: String(firstItem?.userId || ""),
        userName: userName,
        receiveTime: formatDateTime(
          subtaskData?.gmtCreate || subtaskData?.receiveTime || subtaskData?.createTime
        ),
        submitTime: formatDateTime(
          subtaskData?.gmtCommit || subtaskData?.submitTime || subtaskData?.commitTime
        ),
        completed: completed,
      },
      metrics: {
        itemCount: Number(subtaskData?.size) || dataList.length,
        fetchedItemCount: dataList.length,
        durationSeconds: normalizedDurationSeconds,
        durationText: formatDurationForCsv(normalizedDurationSeconds),
        answeredCount: dataList.filter(function (item) {
          return item?.answer !== undefined && item?.answer !== null;
        }).length,
      },
      rawKeys: {
        taskName: String(subtaskData?.taskName || ""),
        taskId: String(subtaskData?.taskId || ""),
        batchId: batchId,
        subTaskId: subTaskId,
      },
      dedupeKey: [batchId, role, subTaskId].join(":"),
    };
  }

  function getSummarySubTaskId(summary) {
    return sanitizeSubTaskId(
      summary?.id || summary?.subTaskId || summary?.subtaskId || summary?.subtaskID || ""
    );
  }

  function enrichSubtaskData(detailData, summary, taskMap, kind) {
    const summaryTaskId = String(summary?.taskId || "").trim();
    const linkedTask = summaryTaskId ? taskMap[summaryTaskId] || {} : {};
    const detailDataList = Array.isArray(detailData?.dataList) ? detailData.dataList : [];
    const resolvedSize =
      Number(summary?.size) ||
      Number(detailData?.recordCount) ||
      detailDataList.length ||
      Number(detailData?.size) ||
      0;
    return Object.assign({}, detailData || {}, {
      id: sanitizeSubTaskId(detailData?.id || getSummarySubTaskId(summary)),
      taskId: String(summaryTaskId || detailData?.taskId || ""),
      batchId: String(summary?.batchId || detailData?.batchId || ""),
      gmtCreate: summary?.gmtCreate || detailData?.gmtCreate,
      gmtCommit: summary?.gmtCommit || detailData?.gmtCommit,
      taskName: summary?.taskName || detailData?.taskName || linkedTask?.name || "",
      size: resolvedSize > 0 ? resolvedSize : "",
      recordCount: Number(detailData?.recordCount) || resolvedSize || detailDataList.length,
      labelModel: summary?.labelModel || detailData?.labelModel || linkedTask?.labelModel,
      sourceType: summary?.sourceType || kind?.key || "",
      status:
        summary?.status !== undefined && summary?.status !== null
          ? summary.status
          : detailData?.status,
    });
  }

  async function mapLimit(items, limit, handler) {
    const result = [];
    let cursor = 0;
    const workers = new Array(Math.max(1, Math.min(limit, items.length || 1)))
      .fill(null)
      .map(async function () {
        while (cursor < items.length) {
          const index = cursor;
          cursor += 1;
          result[index] = await handler(items[index], index);
        }
      });
    await Promise.all(workers);
    return result;
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
    let uploadButtonTimer = null;
    let uploadButtonRoot = null;

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

    function clearUploadButtonTimer() {
      if (uploadButtonTimer) {
        window.clearInterval(uploadButtonTimer);
        uploadButtonTimer = null;
      }
    }

    function removeUploadButton() {
      if (uploadButtonRoot && uploadButtonRoot.parentNode) {
        uploadButtonRoot.parentNode.removeChild(uploadButtonRoot);
      }
      uploadButtonRoot = null;
    }

    function setUploadButtonStatus(message, tone) {
      const button = uploadButtonRoot?.querySelector("button");
      if (!button) {
        return;
      }
      button.title = message || "上传转写统计";
      button.style.borderColor =
        tone === "error" ? "#fecaca" : tone === "success" ? "#bbf7d0" : "#bfdbfe";
      button.style.background =
        tone === "error" ? "#fef2f2" : tone === "success" ? "#f0fdf4" : "#eff6ff";
      button.style.color =
        tone === "error" ? "#b91c1c" : tone === "success" ? "#047857" : "#0958d9";
    }

    function resolveTopNavUploadMountPoint() {
      const avatar = findAvatarTrigger();
      if (avatar && avatar.parentNode) {
        return {
          host: avatar.parentNode,
          before: avatar,
        };
      }
      const header = document.querySelector(".header-component-container");
      return header ? { host: header, before: null } : null;
    }

    function ensureUploadButton() {
      if (!state.started || getConfig().statsUploadEnabled === false || !isStatsPage()) {
        removeUploadButton();
        return;
      }

      const mountPoint = resolveTopNavUploadMountPoint();
      if (!mountPoint || !mountPoint.host) {
        return;
      }

      if (
        uploadButtonRoot &&
        uploadButtonRoot.isConnected &&
        uploadButtonRoot.parentNode === mountPoint.host
      ) {
        return;
      }

      removeUploadButton();
      uploadButtonRoot = document.createElement("span");
      uploadButtonRoot.id = "asr-edge-transcription-stats-upload-entry";
      Object.assign(uploadButtonRoot.style, {
        display: "flex",
        alignItems: "center",
        flex: "0 0 auto",
        marginLeft: "8px",
        marginRight: "8px",
      });

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "上传转写统计";
      Object.assign(button.style, {
        border: "1px solid rgba(22, 119, 255, 0.42)",
        borderRadius: "6px",
        minHeight: "28px",
        padding: "0 12px",
        background: "#eff6ff",
        color: "#0958d9",
        fontSize: "12px",
        fontWeight: "700",
        lineHeight: "26px",
        cursor: "pointer",
        whiteSpace: "nowrap",
      });
      button.addEventListener("click", function () {
        button.disabled = true;
        button.style.opacity = "0.72";
        button.textContent = "上传中";
        setUploadButtonStatus("正在上传转写统计数据...", "info");
        void uploadNow(isHomePage() ? "home-manual" : "detail-manual")
          .then(function (result) {
            if (result?.ok === true) {
              setUploadButtonStatus(
                "已上传 " + String(result.payload?.payloadCount || 0) + " 个子任务",
                "success"
              );
              return;
            }
            setUploadButtonStatus(result?.message || "上传失败。", "error");
          })
          .catch(function (error) {
            setUploadButtonStatus(error && error.message ? error.message : String(error), "error");
          })
          .finally(function () {
            button.disabled = false;
            button.style.opacity = "1";
            button.textContent = "上传转写统计";
          });
      });

      uploadButtonRoot.appendChild(button);
      if (mountPoint.before && mountPoint.before.parentNode === mountPoint.host) {
        mountPoint.host.insertBefore(uploadButtonRoot, mountPoint.before);
      } else {
        mountPoint.host.appendChild(uploadButtonRoot);
      }
    }

    function startUploadButton() {
      clearUploadButtonTimer();
      ensureUploadButton();
      uploadButtonTimer = window.setInterval(ensureUploadButton, 1500);
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
      const scheduleUrl = normalizeEndpoint(resolveScheduleEndpoint(config));
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
      if (isHomePage()) {
        return collectHomePayloads(reason);
      }
      return collectDetailPayload(reason);
    }

    async function collectHomePayloads(reason) {
      const projectId = getProjectIdFromUrl();
      if (!projectId) {
        throw new Error("当前页面 URL 中没有 projectId，无法上传全量统计。");
      }

      const userName = await resolveCurrentUserText();
      const kinds = getHomeTaskKindsToFetch();
      const kindPages = [];
      const errors = [];
      let skippedSubTaskCount = 0;
      let skippedDetailCount = 0;

      for (let index = 0; index < kinds.length; index += 1) {
        const kind = kinds[index];
        try {
          const tasksPage = await fetchHomeTasks(projectId, kind);
          const taskMap = {};
          tasksPage.list.forEach(function (task) {
            const taskId = String(task?.taskId || "");
            if (taskId) {
              taskMap[taskId] = task;
            }
          });

          const unfinishedPage = await fetchHomeSubTasks(projectId, false, kind);
          const finishedPage = await fetchHomeSubTasks(projectId, true, kind);
          kindPages.push({
            kind: kind,
            tasksPage: tasksPage,
            taskMap: taskMap,
            unfinishedPage: unfinishedPage,
            finishedPage: finishedPage,
          });
        } catch (error) {
          errors.push({
            kind: kind.key,
            message: error && error.message ? error.message : String(error),
          });
        }
      }

      const subtasks = [];
      kindPages.forEach(function (pageGroup) {
        const subtaskMap = {};
        pageGroup.unfinishedPage.list.concat(pageGroup.finishedPage.list).forEach(function (subtask) {
          const id = getSummarySubTaskId(subtask);
          if (!id) {
            return;
          }

          const linkedTask = pageGroup.taskMap[String(subtask?.taskId || "")] || {};
          if (!isAsrTranscriptionTaskRecord(subtask, linkedTask)) {
            skippedSubTaskCount += 1;
            return;
          }

          subtaskMap[pageGroup.kind.key + ":" + id] = subtask;
        });
        Object.keys(subtaskMap).forEach(function (id) {
          subtasks.push({
            summary: subtaskMap[id],
            pageGroup: pageGroup,
          });
        });
      });

      if (subtasks.length === 0) {
        throw new Error(
          "首页未读取到 ASR 转写子任务，已跳过 ASR 更优判断或其他项目数据。" +
            (errors.length
              ? " 失败：" +
                errors
                  .map(function (item) {
                    return item.kind + "=" + item.message;
                  })
                  .join("；")
              : "")
        );
      }

      const payloads = (
        await mapLimit(subtasks, 3, async function (entry) {
          const summary = entry.summary;
          const pageGroup = entry.pageGroup;
          const kind = pageGroup.kind;
          const linkedTask = pageGroup.taskMap[String(summary?.taskId || "")] || {};
          const detailData = await fetchSubtaskDetail(summary);
          if (!detailData?.id) {
            skippedDetailCount += 1;
            return null;
          }
          const enrichedData = enrichSubtaskData(detailData, summary, pageGroup.taskMap, kind);
          if (!isAsrTranscriptionTaskRecord(enrichedData, linkedTask)) {
            skippedDetailCount += 1;
            return null;
          }
          const durationSeconds = sumDurationSeconds(enrichedData.dataList);
          const payload = buildPayload(enrichedData, durationSeconds, reason || "home-manual", {
            role: kind.role,
            userName: userName || getUserNameFromRecord(summary),
          });
          payload.homeContext = {
            projectId: projectId,
            kind: kind.key,
            role: kind.role,
            kindLabel: kind.label,
            taskCount: pageGroup.tasksPage.recordCount,
            subTaskCount: subtasks.length,
            unfinishedCount: pageGroup.unfinishedPage.recordCount,
            finishedCount: pageGroup.finishedPage.recordCount,
            source: kind.route + " tasks/subTasks + subTask data",
          };
          return payload;
        })
      ).filter(Boolean);

      if (payloads.length === 0) {
        throw new Error("首页列表中没有可上传的 ASR 转写统计数据。");
      }

      return {
        schemaVersion: 1,
        source: "chromium-extension",
        project: "alibaba-labelx/asr-transcription",
        reason: reason || "home-manual",
        uploadedAt: new Date().toISOString(),
        mode: "project-batch",
        mergeKey: {
          projectId: projectId,
        },
        payloads: payloads,
        summary: {
          projectId: projectId,
          taskCount: kindPages.reduce(function (total, item) {
            return total + (Number(item.tasksPage.recordCount) || 0);
          }, 0),
          subTaskCount: subtasks.length,
          payloadCount: payloads.length,
          skippedSubTaskCount: skippedSubTaskCount,
          skippedDetailCount: skippedDetailCount,
          kinds: kindPages.map(function (item) {
            return {
              kind: item.kind.key,
              role: item.kind.role,
              taskCount: item.tasksPage.recordCount,
              unfinishedCount: item.unfinishedPage.recordCount,
              finishedCount: item.finishedPage.recordCount,
            };
          }),
          errors: errors,
        },
      };
    }

    async function collectDetailPayload(reason) {
      const params = getUrlParams();
      const cleanSubTaskId = sanitizeSubTaskId(params.subTaskId || "");
      if (!cleanSubTaskId) {
        throw new Error("详情页缺少有效 subTaskId，无法上传转写统计。");
      }

      const detailData = await fetchSubtaskDetail({ id: cleanSubTaskId });
      const userName = await resolveCurrentUserText();
      const durationSeconds = sumDurationSeconds(detailData.dataList);
      const payload = buildPayload(
        Object.assign({}, detailData, {
          id: cleanSubTaskId,
          size:
            Number(detailData?.size) ||
            Number(detailData?.recordCount) ||
            Number(detailData?.fetchedItemCount) ||
            (Array.isArray(detailData?.dataList) ? detailData.dataList.length : 0),
        }),
        durationSeconds,
        reason || "detail-manual",
        {
          role: inferRole(detailData),
          userName: userName,
        }
      );
      return payload;
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
          const responseSummary = summarizeUploadResponseBody(body);
          throw new Error(
            "上传失败：" +
              String(response.status) +
              (response.statusText ? " " + response.statusText : "") +
              "；地址：" +
              getEndpointLabel(endpoint) +
              (responseSummary ? "；响应：" + responseSummary : "")
          );
        }
        if (body && typeof body === "object" && body.success === false) {
          throw new Error(
            (body.message || "统计上传业务失败。") +
              "；地址：" +
              getEndpointLabel(endpoint)
          );
        }
        return body;
      } catch (error) {
        if (error && error.name === "AbortError") {
          throw new Error(
            "上传请求超时：" +
              String(timeoutMs) +
              "ms；地址：" +
              getEndpointLabel(endpoint)
          );
        }
        if (error instanceof TypeError) {
          throw new Error(
            "上传请求未发出或被浏览器/网络拦截：" +
              (error.message || String(error)) +
              "；地址：" +
              getEndpointLabel(endpoint)
          );
        }
        throw error;
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
          message: "当前不是转写统计运行态，未上传统计。",
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
        setMessage(true, uploadReason, "转写统计数据已上传。");
        showToast("转写统计数据已上传。", "info");
        const uploadPayload = Array.isArray(payload.payloads) ? payload.payloads : [payload];
        return {
          ok: true,
          reason: uploadReason,
          message: "转写统计数据已上传。",
          payload: {
            batchId: uploadPayload[0]?.mergeKey?.batchId || "",
            subTaskId: uploadPayload[0]?.roleRecord?.subTaskId || "",
            itemCount: uploadPayload.reduce(function (total, item) {
              return total + (Number(item?.metrics?.itemCount) || 0);
            }, 0),
            payloadCount: uploadPayload.length,
          },
        };
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        setMessage(false, uploadReason, message);
        showToast("转写统计上传失败：" + message, "error");
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
      startUploadButton();
      void refreshSchedule().finally(scheduleNextUpload);
      notify();
    }

    function stop() {
      state.started = false;
      state.nextScheduleAt = null;
      clearScheduleTimer();
      clearUploadButtonTimer();
      removeUploadButton();
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

  function isStatsPage() {
    if (location.hostname !== "labelx.alibaba-inc.com") {
      return false;
    }
    const routeText = String(location.pathname || "").toLowerCase();
    if (routeText.indexOf("/corpora/labeling/") < 0) {
      return false;
    }
    const text = String(document.body?.textContent || "").replace(/\s+/g, "");
    return text.indexOf("哪个ASR更优") < 0;
  }

  function isHomePage() {
    const routeText = String(location.pathname || "").toLowerCase();
    return routeText.indexOf("/corpora/labeling/labelingtask") >= 0 || routeText.indexOf("/corpora/labeling/checktask") >= 0;
  }

  globalThis.__ASREdgeAlibabaLabelxTranscriptionStatsClient = {
    createRuntime: createRuntime,
    CSV_COLUMNS: CSV_COLUMNS.slice(),
    isAsrTranscriptionTaskRecord: isAsrTranscriptionTaskRecord,
    sanitizeSubTaskId: sanitizeSubTaskId,
  };
})();
