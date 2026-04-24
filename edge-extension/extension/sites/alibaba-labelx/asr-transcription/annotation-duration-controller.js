(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-duration-controller]";
  const ITEM_SELECTOR = ".labelRender-item";
  const listeners = [];
  let audioDurationByFilename = {};
  let totalDuration = 0;
  let started = false;
  let observer = null;

  function resolveFilenameFromAudio(audio) {
    const source = audio?.currentSrc || audio?.src || "";
    if (!source) {
      return null;
    }

    const lastSegment = source.split("/").pop() || "";
    const filename = lastSegment.split("?")[0] || null;
    return filename || null;
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return "0.00s";
    }

    if (seconds < 60) {
      return seconds.toFixed(2) + "s";
    }

    const minutes = Math.floor(seconds / 60);
    const restSeconds = (seconds % 60).toFixed(2);
    return minutes + "m" + restSeconds + "s";
  }

  function getAudioDuration(audio) {
    if (!audio) {
      return 0;
    }

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      return audio.duration;
    }

    const filename = resolveFilenameFromAudio(audio);
    if (!filename) {
      return 0;
    }

    return Number(audioDurationByFilename[filename] || 0);
  }

  function calculatePageDuration() {
    let nextTotal = 0;
    const items = document.querySelectorAll(ITEM_SELECTOR);

    items.forEach(function (item) {
      const isValid = Array.from(item.querySelectorAll('input[type="radio"]')).some(function (input) {
        return input.checked && input.value === "有效";
      });

      if (!isValid) {
        return;
      }

      const audio = item.querySelector("audio");
      nextTotal += getAudioDuration(audio);
    });

    return nextTotal;
  }

  function emit(reason) {
    const snapshot = getSnapshot();
    listeners.slice().forEach(function (listener) {
      try {
        listener(snapshot, reason || "manual");
      } catch (error) {
        console.warn(LOG_PREFIX, "Duration subscriber failed:", error);
      }
    });
  }

  function refresh(reason) {
    const nextTotal = calculatePageDuration();
    const changed = Math.abs(nextTotal - totalDuration) > 0.0001;
    totalDuration = nextTotal;

    if (changed) {
      console.info(LOG_PREFIX, "Page duration refreshed:", {
        reason: reason || "manual",
        totalSeconds: totalDuration.toFixed(2),
      });
      emit(reason || "manual");
    }

    return getSnapshot();
  }

  function storeAudioDuration(audio) {
    const filename = resolveFilenameFromAudio(audio);
    if (!filename || !Number.isFinite(audio?.duration) || audio.duration <= 0) {
      return false;
    }

    audioDurationByFilename[filename] = audio.duration;
    return true;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async function copyCurrentDuration() {
    const secondsText = totalDuration.toFixed(2);
    await copyText(secondsText);
    console.info(LOG_PREFIX, "Copied page duration:", secondsText);
    return {
      copied: totalDuration > 0,
      totalSeconds: totalDuration,
      secondsText: secondsText,
      formattedText: formatDuration(totalDuration),
      reason: totalDuration > 0 ? "ok" : "zero-duration",
      summaryText:
        totalDuration > 0
          ? "已复制本页有效时长 " + secondsText + " 秒。"
          : "本页当前有效时长为 0 秒，已复制 0.00。",
    };
  }

  function handleMetadataEvent(event) {
    const target = event?.target;
    if (!target || target.tagName !== "AUDIO") {
      return;
    }

    if (storeAudioDuration(target)) {
      refresh("audio-metadata");
    }
  }

  function handleChangeEvent(event) {
    const target = event?.target;
    if (!target) {
      return;
    }

    if (
      (target.tagName === "INPUT" && target.type === "radio") ||
      target.tagName === "TEXTAREA"
    ) {
      refresh("form-change");
    }
  }

  function handleDurationCacheEvent(event) {
    const detail = event?.detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    audioDurationByFilename = Object.assign({}, audioDurationByFilename, detail);
    refresh("duration-cache");
  }

  function startObserver() {
    if (observer || !document.body || !window.MutationObserver) {
      return;
    }

    observer = new MutationObserver(function () {
      refresh("mutation");
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function start() {
    if (started) {
      return refresh("start-repeat");
    }

    started = true;
    document.addEventListener("change", handleChangeEvent, true);
    document.addEventListener("loadedmetadata", handleMetadataEvent, true);
    document.addEventListener("durationchange", handleMetadataEvent, true);
    window.addEventListener("ASR_ItemDurationsReady", handleDurationCacheEvent);
    startObserver();
    return refresh("start");
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return function () {
        return false;
      };
    }

    listeners.push(listener);
    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
        return true;
      }

      return false;
    };
  }

  function getSnapshot() {
    return {
      totalSeconds: totalDuration,
      secondsText: totalDuration.toFixed(2),
      formattedText: formatDuration(totalDuration),
    };
  }

  window.__ASREdgeAlibabaLabelxAnnotationDurationController = {
    start: start,
    refresh: refresh,
    subscribe: subscribe,
    copyCurrentDuration: copyCurrentDuration,
    getSnapshot: getSnapshot,
    formatDuration: formatDuration,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
