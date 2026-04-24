(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-save-coordinator]";
  const legacyBridge = window.__ASREdgeAlibabaLabelxLegacyBridge;
  const runtimeGate = window.__ASREdgeAlibabaLabelxRuntimeGate;

  let manualSaveLock = false;

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value));
  }

  async function getSafetySettings() {
    const settings = runtimeGate && typeof runtimeGate.getSettings === "function"
      ? await runtimeGate.getSettings()
      : {};
    return settings?.platforms?.alibabaLabelx?.safety || {};
  }

  function normalizeText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.replace(/[\u200B-\u200D\uFEFF]/g, "");
  }

  function readMarkResultEntry(item, title) {
    const markResult = Array.isArray(item?.result?.markResult) ? item.result.markResult : [];
    return markResult.find(function (entry) {
      return entry && entry.title === title;
    }) || null;
  }

  function readCachedValidity(item) {
    const entry = readMarkResultEntry(item, "是否有效");
    const value = entry?.value;
    if (Array.isArray(value) && value.length > 0) {
      return String(value[0]);
    }

    return typeof value === "string" ? value : "";
  }

  function readCachedText(item) {
    const entry = readMarkResultEntry(item, "转写文本");
    const value = entry?.value;
    return typeof value === "string" ? value : "";
  }

  function writeMarkResultEntry(item, title, value) {
    if (!item.result || typeof item.result !== "object") {
      item.result = {};
    }

    if (!Array.isArray(item.result.markResult)) {
      item.result.markResult = [];
    }

    const existing = item.result.markResult.find(function (entry) {
      return entry && entry.title === title;
    });
    if (existing) {
      existing.value = value;
      return;
    }

    item.result.markResult.push({
      title: title,
      value: value,
    });
  }

  function getItemFilename(item) {
    const rawAudioPath = item?.data?.raw_audio_path;
    if (!rawAudioPath) {
      return "";
    }

    return String(rawAudioPath).split("/").pop().split("?")[0];
  }

  function buildFilenameToDomSnapshotMap() {
    const map = {};
    Array.from(document.querySelectorAll(".labelRender-item")).forEach(function (item) {
      const audio = item.querySelector("audio");
      const src = audio ? audio.currentSrc || audio.src || "" : "";
      const filename = src ? src.split("/").pop().split("?")[0] : "";
      if (!filename) {
        return;
      }

      const checkedRadio = Array.from(item.querySelectorAll('input[type="radio"]')).find(function (radio) {
        return radio.checked;
      });
      const textarea = item.querySelector("textarea");
      map[filename] = {
        item: item,
        selectedValidity: checkedRadio ? String(checkedRadio.value || "") : "",
        targetText: textarea ? normalizeText(textarea.value || "") : "",
      };
    });
    return map;
  }

  function buildAndInjectPayloadFromDOM() {
    const cachedDataList =
      legacyBridge && typeof legacyBridge.getCachedDataList === "function"
        ? legacyBridge.getCachedDataList()
        : [];

    if (!Array.isArray(cachedDataList) || cachedDataList.length === 0) {
      return {
        success: false,
        reason: "cached-data-missing",
        count: 0,
        changedItems: [],
      };
    }

    const domMap = buildFilenameToDomSnapshotMap();
    const changedItems = [];
    let matchedCount = 0;
    let missingAudioCount = 0;
    let missingDomCount = 0;

    cachedDataList.forEach(function (cachedItem) {
      const filename = getItemFilename(cachedItem);
      if (!filename) {
        missingAudioCount += 1;
        return;
      }

      const domSnapshot = domMap[filename];
      if (!domSnapshot) {
        missingDomCount += 1;
        return;
      }

      matchedCount += 1;
      const nextValidity = domSnapshot.selectedValidity || readCachedValidity(cachedItem);
      const nextText = domSnapshot.targetText;
      const cachedValidity = readCachedValidity(cachedItem);
      const cachedText = normalizeText(readCachedText(cachedItem));

      if (cachedValidity === nextValidity && cachedText === nextText) {
        return;
      }

      const nextItem = clone(cachedItem);
      writeMarkResultEntry(nextItem, "是否有效", [nextValidity || "无效"]);
      writeMarkResultEntry(nextItem, "转写文本", nextText);
      changedItems.push(nextItem);
    });

    if (changedItems.length > 0 && legacyBridge && typeof legacyBridge.injectPendingSaves === "function") {
      legacyBridge.injectPendingSaves({
        dataList: changedItems,
      });
    }

    return {
      success: true,
      reason: changedItems.length > 0 ? "pending-saves-built" : "no-dom-delta",
      count: changedItems.length,
      matchedCount: matchedCount,
      missingAudioCount: missingAudioCount,
      missingDomCount: missingDomCount,
      changedItems: changedItems,
      pendingSaveCountAfter:
        legacyBridge && typeof legacyBridge.getPendingSaveCount === "function"
          ? legacyBridge.getPendingSaveCount()
          : changedItems.length,
    };
  }

  function withAutosaveCapture(callback) {
    const hadAttribute = document.documentElement.getAttribute("data-asr-disable-autosave") === "true";
    if (!hadAttribute) {
      document.documentElement.setAttribute("data-asr-disable-autosave", "true");
    }

    return Promise.resolve()
      .then(callback)
      .finally(function () {
        if (!hadAttribute) {
          document.documentElement.removeAttribute("data-asr-disable-autosave");
        }
      });
  }

  async function blurActiveFieldIfNeeded(blurFirst) {
    const activeElement = document.activeElement;
    if (!blurFirst || !activeElement) {
      return false;
    }

    const tagName = String(activeElement.tagName || "").toLowerCase();
    if (tagName !== "textarea" && tagName !== "input") {
      return false;
    }

    activeElement.blur();
    await new Promise(function (resolve) {
      window.setTimeout(resolve, 250);
    });
    return true;
  }

  async function performManualSave(request) {
    if (!legacyBridge || typeof legacyBridge.requestManualSave !== "function") {
      return {
        success: false,
        reason: "legacy-bridge-missing",
      };
    }

    if (manualSaveLock) {
      return {
        success: false,
        reason: "manual-save-locked",
      };
    }

    manualSaveLock = true;

    try {
      const options = request && typeof request === "object" ? request : {};
      const safetySettings = await getSafetySettings();
      const blurFirst = options.blurFirst !== false && safetySettings.blurBeforeManualSave !== false;
      const reloadAfter = options.reloadAfter === true;

      const result = await withAutosaveCapture(async function () {
        await blurActiveFieldIfNeeded(blurFirst);

        const buildResult =
          options.buildPayload === false
            ? {
                success: true,
                reason: "build-skipped",
                count: 0,
                changedItems: [],
              }
            : buildAndInjectPayloadFromDOM();
        const pendingSaveCountBefore = legacyBridge.getPendingSaveCount();
        const manualSaveResult = await legacyBridge.requestManualSave({
          reason: options.reason || "manual-save",
        });
        const summary = {
          success: manualSaveResult.success === true,
          reason: manualSaveResult.success === true ? "manual-save-success" : "manual-save-failed",
          count: Number.isFinite(manualSaveResult.count) ? manualSaveResult.count : 0,
          pendingSaveCountBefore: pendingSaveCountBefore,
          buildResult: buildResult,
          manualSaveResult: manualSaveResult,
          reloadScheduled: reloadAfter && manualSaveResult.success === true && manualSaveResult.count > 0,
        };

        if (summary.reloadScheduled) {
          const reloadDelay = Number.parseInt(safetySettings.saveReloadDelayMs, 10) || 1200;
          window.setTimeout(function () {
            location.reload();
          }, reloadDelay);
        }

        return summary;
      });

      return result;
    } finally {
      manualSaveLock = false;
    }
  }

  async function flushValidationChanges(request) {
    const options = request && typeof request === "object" ? request : {};

    return withAutosaveCapture(async function () {
      const buildResult = buildAndInjectPayloadFromDOM();
      const hasPendingChanges =
        (buildResult && buildResult.count > 0) ||
        (legacyBridge && typeof legacyBridge.getPendingSaveCount === "function"
          ? legacyBridge.getPendingSaveCount() > 0
          : false);

      if (!hasPendingChanges) {
        return {
          success: true,
          flushed: false,
          reason: "no-pending-changes",
          buildResult: buildResult,
        };
      }

      const manualSaveResult = await performManualSave({
        buildPayload: false,
        blurFirst: options.blurFirst !== false,
        reloadAfter: options.reloadAfter === true,
        reason: options.reason || "flush-validation-changes",
      });

      return {
        success: manualSaveResult.success === true,
        flushed: manualSaveResult.success === true,
        reason: manualSaveResult.reason,
        buildResult: buildResult,
        manualSaveResult: manualSaveResult,
      };
    });
  }

  window.__ASREdgeAlibabaLabelxLegacySaveCoordinator = {
    buildAndInjectPayloadFromDOM: buildAndInjectPayloadFromDOM,
    performManualSave: performManualSave,
    flushValidationChanges: flushValidationChanges,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
