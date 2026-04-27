(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-user-context]";
  const legacyBridge = window.__ASREdgeAlibabaLabelxLegacyBridge;
  const legacyApiClient = window.__ASREdgeAlibabaLabelxLegacyApiClient;

  let cachedUserName = "";

  function getCurrentUserName() {
    return cachedUserName;
  }

  function normalizeText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.replace(/\s+/g, " ").trim();
  }

  function getUserNameElement() {
    return document.querySelector(
      '[data-menu-id$="-userAvatar"] .ant-v5-dropdown-menu-title-content, li[class*="userAvatar"] .ant-v5-dropdown-menu-title-content'
    );
  }

  async function ensureUserName() {
    if (cachedUserName) {
      return cachedUserName;
    }

    const directElement = getUserNameElement();
    if (directElement) {
      cachedUserName = normalizeText(directElement.textContent || "");
      if (cachedUserName) {
        return cachedUserName;
      }
    }

    const globalInitialState = window.INITIAL_STATE;
    const initialStateName = normalizeText(globalInitialState?.user?.nickName || "");
    if (initialStateName) {
      cachedUserName = initialStateName;
      return cachedUserName;
    }

    const trigger = document.querySelector(".ant-v5-dropdown-trigger.avatar, .avatar");
    if (!trigger) {
      return "";
    }

    try {
      const eventConfig = { bubbles: true, cancelable: true };
      trigger.dispatchEvent(new MouseEvent("mouseenter", eventConfig));
      trigger.dispatchEvent(new MouseEvent("mouseover", eventConfig));
      trigger.dispatchEvent(new MouseEvent("mousedown", eventConfig));
      trigger.dispatchEvent(new MouseEvent("click", eventConfig));
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to trigger user menu for username extraction:", error);
    }

    for (let index = 0; index < 10; index += 1) {
      await new Promise(function (resolve) {
        window.setTimeout(resolve, 150);
      });

      const element = getUserNameElement();
      if (element) {
        cachedUserName = normalizeText(element.textContent || "");
        break;
      }
    }

    try {
      document.body.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        })
      );
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to close user menu after username extraction:", error);
    }

    return cachedUserName || "";
  }

  function getItemDurationByFilename(filename) {
    const durations = legacyBridge && typeof legacyBridge.getItemDurations === "function"
      ? legacyBridge.getItemDurations()
      : {};
    const duration = durations && filename ? durations[filename] : null;
    return Number.isFinite(duration) ? duration : 0;
  }

  function calcDurationFromDOM() {
    let total = 0;

    Array.from(document.querySelectorAll(".labelRender-item")).forEach(function (item) {
      const isValid = Array.from(item.querySelectorAll('input[type="radio"]')).some(function (radio) {
        return radio.checked && radio.value === "有效";
      });
      if (!isValid) {
        return;
      }

      const audio = item.querySelector("audio");
      if (!audio) {
        return;
      }

      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        total += audio.duration;
        return;
      }

      const src = audio.currentSrc || audio.src || "";
      const filename = src ? src.split("/").pop().split("?")[0] : "";
      total += getItemDurationByFilename(filename);
    });

    return total;
  }

  async function resolveReviewModeAnnotator(subTaskId) {
    if (!subTaskId) {
      return "";
    }

    try {
      const url =
        "/api/v1/label/center/subTask/" +
        encodeURIComponent(subTaskId) +
        "/data?page=1&pageSize=1&filterPassedVote=false&filter=%7B%22questions%22%3A%5B%5D%2C%22dataStatus%22%3A%22ALL%22%2C%22questionsQueryConditions%22%3A%22AND%22%7D&_=" +
        Date.now();
      const response = await fetch(url, { cache: "no-store" });
      const json = response.ok ? await response.json() : null;
      const historyMap = json?.data?.dataResultHistory;
      const firstKey = historyMap ? Object.keys(historyMap)[0] : null;
      const historyArray = firstKey ? historyMap[firstKey] : null;
      const userName = historyArray && historyArray.length > 0 ? historyArray[historyArray.length - 1].userName : "";
      return normalizeText(userName || "");
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to resolve review-mode annotator:", error);
      return "";
    }
  }

  async function uploadCurrentTaskStats() {
    if (!legacyApiClient || typeof legacyApiClient.postJson !== "function") {
      return {
        success: false,
        reason: "legacy-api-client-missing",
      };
    }

    const snapshot = legacyBridge && typeof legacyBridge.getSnapshot === "function"
      ? legacyBridge.getSnapshot()
      : {};
    const meta = snapshot.subTaskMeta || {};
    const searchParams = new URLSearchParams(location.search);
    const subTaskId = meta.subTaskId || searchParams.get("subTaskId");
    const missionType = searchParams.get("missionType") || "";
    const isCheckMode = missionType === "check" || location.pathname.toLowerCase().includes("checktask");
    const duration = calcDurationFromDOM();

    if (!(duration > 0)) {
      return {
        success: false,
        reason: "invalid-duration",
        duration: duration,
      };
    }

    let annotator = "";
    if (isCheckMode) {
      annotator = await resolveReviewModeAnnotator(subTaskId);
    } else {
      annotator = await ensureUserName();
    }

    if (!annotator) {
      return {
        success: false,
        reason: "annotator-missing",
      };
    }

    const batchId = meta.batchId || "";
    if (!batchId) {
      return {
        success: false,
        reason: "batch-id-missing",
      };
    }

    const now = new Date();
    const commitDate = now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0") +
      " " +
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");

    await legacyApiClient.postJson("/asr/upload-stats", [
      {
        annotator: annotator,
        duration: duration,
        batchId: batchId,
        commitDate: commitDate,
      },
    ]);

    return {
      success: true,
      annotator: annotator,
      duration: duration,
      batchId: batchId,
      commitDate: commitDate,
    };
  }

  window.__ASREdgeAlibabaLabelxLegacyUserContext = {
    ensureUserName: ensureUserName,
    getCurrentUserName: getCurrentUserName,
    calcDurationFromDOM: calcDurationFromDOM,
    uploadCurrentTaskStats: uploadCurrentTaskStats,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
