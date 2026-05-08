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
    return {
      success: false,
      reason: "disabled-in-basic-stage",
      count: 0,
      changedItems: [],
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
    return {
      success: false,
      reason: "disabled-in-basic-stage",
      count: 0,
      buildResult: buildAndInjectPayloadFromDOM(),
      manualSaveResult: null,
      reloadScheduled: false,
    };
  }

  async function flushValidationChanges(request) {
    return {
      success: false,
      flushed: false,
      reason: "disabled-in-basic-stage",
      buildResult: buildAndInjectPayloadFromDOM(),
      manualSaveResult: null,
    };
  }

  window.__ASREdgeAlibabaLabelxLegacySaveCoordinator = {
    buildAndInjectPayloadFromDOM: buildAndInjectPayloadFromDOM,
    performManualSave: performManualSave,
    flushValidationChanges: flushValidationChanges,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
