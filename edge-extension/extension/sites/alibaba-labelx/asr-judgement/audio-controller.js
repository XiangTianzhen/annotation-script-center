(function () {
  const LOG_PREFIX = "[ASR Edge][judgement-audio-controller]";
  const detector = globalThis.__ASREdgeAlibabaLabelxJudgementPageDetector || null;
  const audioNodes = new WeakMap();
  const VOLUME_STEP_VALUE = 50;
  let audioContext = null;
  let observer = null;
  let scanTimer = null;
  let started = false;
  let runtimeVolumeValue = 100;
  let runtimePlaybackRateValue = 1.0;
  let config = {
    autoPlay: true,
    autoResetRate: true,
    resetRateValue: 1.0,
    playbackRateValue: 1.0,
    rateStepValue: 0.25,
    volumeValue: 100,
  };
  let state = {
    audioCount: 0,
    currentAudioIndex: -1,
    lastApplyAt: null,
    lastApplyReason: "",
    lastAction: null,
    lastAutoplay: null,
    lastError: null,
  };

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function clampNumber(value, fallback, min, max, precision) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return fallback;
    }

    const clamped = Math.max(min, Math.min(max, numericValue));
    return typeof precision === "number" ? Number(clamped.toFixed(precision)) : clamped;
  }

  function normalizeConfig(nextConfig) {
    const input = nextConfig && typeof nextConfig === "object" ? nextConfig : {};
    return {
      autoPlay: input.autoPlay !== false,
      autoResetRate: true,
      resetRateValue: clampNumber(input.resetRateValue, 1.0, 0.25, 5, 2),
      playbackRateValue: clampNumber(input.playbackRateValue, 1.0, 0.25, 5, 2),
      rateStepValue: clampNumber(input.rateStepValue, 0.25, 0.05, 1, 2),
      volumeValue: clampNumber(input.volumeValue, 100, 0, 1000, 0),
    };
  }

  function getAudioContext() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(function (error) {
        state.lastError = error && error.message ? error.message : String(error);
      });
    }

    return audioContext;
  }

  function getAudioMeta(audio) {
    let meta = audioNodes.get(audio);
    if (!meta) {
      meta = {
        gainNode: null,
        sourceNode: null,
        lastApplySignature: "",
        lastAutoplaySignature: "",
        lastSourceSignature: "",
        resettingRate: false,
        listenersBound: false,
      };
      audioNodes.set(audio, meta);
    }
    return meta;
  }

  function setAudioVolume(audio, volumePercent) {
    const normalizedVolume = clampNumber(volumePercent, 100, 0, 1000, 0);
    const meta = getAudioMeta(audio);

    if (!meta.gainNode && normalizedVolume <= 100) {
      audio.volume = Math.max(0, Math.min(normalizedVolume / 100, 1));
      return;
    }

    try {
      if (!meta.gainNode) {
        const context = getAudioContext();
        if (!context) {
          throw new Error("AudioContext not supported");
        }

        meta.sourceNode = context.createMediaElementSource(audio);
        meta.gainNode = context.createGain();
        meta.sourceNode.connect(meta.gainNode);
        meta.gainNode.connect(context.destination);
      }

      audio.volume = 1;
      meta.gainNode.gain.value = normalizedVolume / 100;
    } catch (error) {
      audio.volume = Math.max(0, Math.min(normalizedVolume / 100, 1));
      state.lastError = error && error.message ? error.message : String(error);
    }
  }

  function formatRate(rate) {
    return Number.isInteger(rate) ? String(rate) + "x" : Number(rate).toFixed(2).replace(/0$/, "").replace(/0$/, "") + "x";
  }

  function updateVisibleRate(audio, rate) {
    const container = audio.closest ? audio.closest(".dt-audio-base-container") : null;
    const speedNode = container ? container.querySelector(".ant-v5-select-selection-item") : null;
    if (!speedNode) {
      return;
    }

    const label = formatRate(rate);
    speedNode.textContent = label;
    speedNode.title = label;
  }

  function getAudioSourceSignature(audio) {
    return audio.currentSrc || audio.src || audio.querySelector("source")?.src || "inline-audio";
  }

  function getAudioApplySignature(audio) {
    return [
      getAudioSourceSignature(audio),
      runtimeVolumeValue,
      runtimePlaybackRateValue,
      config.autoPlay === true ? "autoplay" : "manual",
    ].join("|");
  }

  function buildActionResult(action, ok, extra) {
    const result = Object.assign(
      {
        action: action,
        ok: ok === true,
        at: new Date().toISOString(),
      },
      extra || {}
    );
    state.lastAction = clone(result);
    return clone(result);
  }

  function getCurrentItemLabel() {
    return state.currentAudioIndex >= 0 ? "第 " + String(state.currentAudioIndex + 1) + " 条音频" : "当前音频";
  }

  function bindAudioListeners(audio) {
    const meta = getAudioMeta(audio);
    if (meta.listenersBound) {
      return;
    }

    audio.addEventListener("loadedmetadata", function () {
      scheduleScan("loadedmetadata");
    });
    audio.addEventListener("canplay", function () {
      scheduleScan("canplay");
    });
    audio.addEventListener("emptied", function () {
      scheduleScan("emptied");
    });
    audio.addEventListener("ratechange", function () {
      if (meta.resettingRate) {
        return;
      }
      runtimePlaybackRateValue = clampNumber(audio.playbackRate, runtimePlaybackRateValue, 0.25, 5, 2);
      scheduleScan("ratechange");
    });

    meta.listenersBound = true;
  }

  function applyAudio(audio, reason) {
    if (!audio || !audio.isConnected) {
      return;
    }

    bindAudioListeners(audio);
    const meta = getAudioMeta(audio);
    const sourceSignature = getAudioSourceSignature(audio);

    if (meta.lastSourceSignature && meta.lastSourceSignature !== sourceSignature) {
      runtimePlaybackRateValue = config.resetRateValue;
    }
    meta.lastSourceSignature = sourceSignature;

    const applySignature = getAudioApplySignature(audio);
    const needsRateApply = Math.abs(audio.playbackRate - runtimePlaybackRateValue) > 0.001;
    if (meta.lastApplySignature === applySignature && !needsRateApply) {
      return;
    }

    setAudioVolume(audio, runtimeVolumeValue);

    if (needsRateApply) {
      meta.resettingRate = true;
      audio.playbackRate = runtimePlaybackRateValue;
      updateVisibleRate(audio, runtimePlaybackRateValue);
      window.setTimeout(function () {
        meta.resettingRate = false;
      }, 0);
    }

    meta.lastApplySignature = applySignature;
    state.lastApplyAt = new Date().toISOString();
    state.lastApplyReason = reason || "scan";
  }

  function getAudios() {
    return Array.from(document.querySelectorAll(".dt-audio-base-container audio[controls], audio[controls]")).filter(
      function (audio) {
        return audio && audio.isConnected;
      }
    );
  }

  function getTaskItems() {
    return Array.from(document.querySelectorAll(".labelRender-item[data-index]")).sort(function (left, right) {
      const leftIndex = Number(left.getAttribute("data-index"));
      const rightIndex = Number(right.getAttribute("data-index"));
      return (Number.isFinite(leftIndex) ? leftIndex : 0) - (Number.isFinite(rightIndex) ? rightIndex : 0);
    });
  }

  function getItemAudio(item) {
    return item ? item.querySelector(".dt-audio-base-container audio[controls], audio[controls]") : null;
  }

  function getItemForAudio(audio) {
    return audio && audio.closest ? audio.closest(".labelRender-item[data-index]") : null;
  }

  function resolveCurrentAudio() {
    const selectedAudio = document.querySelector(".labelRender-item-selected audio[controls]");
    if (selectedAudio) {
      return selectedAudio;
    }

    const playingAudio = getAudios().find(function (audio) {
      return !audio.paused && !audio.ended;
    });
    if (playingAudio) {
      return playingAudio;
    }

    return getAudios()[0] || null;
  }

  function pauseOtherAudios(targetAudio) {
    getAudios().forEach(function (audio) {
      if (audio !== targetAudio && !audio.paused) {
        audio.pause();
      }
    });
  }

  function updateCurrentAudioState(audio) {
    const item = getItemForAudio(audio);
    const index = item ? Number(item.getAttribute("data-index")) : -1;
    state.currentAudioIndex = Number.isFinite(index) ? index : -1;
  }

  function playAudio(audio, reason) {
    if (!audio) {
      return Promise.resolve(
        buildActionResult(reason || "play", false, {
          reason: "audio-not-found",
          message: "未找到可播放的音频。",
        })
      );
    }

    applyAudio(audio, reason || "play");
    pauseOtherAudios(audio);
    updateCurrentAudioState(audio);

    return Promise.resolve(audio.play())
      .then(function () {
        return buildActionResult(reason || "play", true, {
          currentAudioIndex: state.currentAudioIndex,
          message: getCurrentItemLabel() + "开始播放",
        });
      })
      .catch(function (error) {
        const result = buildActionResult(reason || "play", false, {
          currentAudioIndex: state.currentAudioIndex,
          reason: error && error.message ? error.message : String(error),
          message: "播放失败：" + (error && error.message ? error.message : String(error)),
        });
        state.lastError = result.reason;
        return result;
      });
  }

  function autoplay(audio, reason) {
    if (!audio || config.autoPlay !== true) {
      return;
    }

    const meta = getAudioMeta(audio);
    const signature = getAudioSourceSignature(audio);
    if (meta.lastAutoplaySignature === signature) {
      return;
    }

    meta.lastAutoplaySignature = signature;
    void playAudio(audio, reason || "autoplay").then(function (result) {
      state.lastAutoplay = Object.assign({}, result, {
        src: signature,
      });
    });
  }

  function resolveAutoplayTarget(audios) {
    const selectedItem = document.querySelector(".labelRender-item-selected audio[controls]");
    if (selectedItem && audios.indexOf(selectedItem) >= 0) {
      return selectedItem;
    }

    return audios[0] || null;
  }

  function scan(reason) {
    if (!started) {
      return;
    }

    const pageInfo = detector && typeof detector.detect === "function" ? detector.detect() : null;
    const audios = getAudios();
    state.audioCount = audios.length;

    if (pageInfo && !pageInfo.isTargetSite) {
      return;
    }

    audios.forEach(function (audio) {
      applyAudio(audio, reason || "scan");
    });

    autoplay(resolveAutoplayTarget(audios), reason || "scan");
  }

  function scheduleScan(reason) {
    if (!started) {
      return;
    }

    if (scanTimer) {
      window.clearTimeout(scanTimer);
    }

    scanTimer = window.setTimeout(function () {
      scanTimer = null;
      scan(reason || "mutation");
    }, 120);
  }

  function start(nextConfig) {
    config = normalizeConfig(nextConfig || config);
    runtimeVolumeValue = config.volumeValue;
    runtimePlaybackRateValue = config.playbackRateValue;

    if (started) {
      scheduleScan("config-update");
      return;
    }

    started = true;
    observer = new MutationObserver(function () {
      scheduleScan("mutation");
    });
    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "class"],
    });
    scheduleScan("start");
  }

  function stop() {
    started = false;
    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function updateConfig(nextConfig) {
    config = normalizeConfig(nextConfig || config);
    runtimeVolumeValue = config.volumeValue;
    runtimePlaybackRateValue = config.playbackRateValue;
    scheduleScan("config-update");
  }

  function setRuntimeVolume(volumeValue, reason) {
    runtimeVolumeValue = clampNumber(volumeValue, runtimeVolumeValue, 0, 1000, 0);
    getAudios().forEach(function (audio) {
      applyAudio(audio, reason || "volume");
    });
    return buildActionResult(reason || "volume", true, {
      volumeValue: runtimeVolumeValue,
      message:
        reason === "volume-reset"
          ? "音量已重置为 " + String(runtimeVolumeValue) + "%"
          : "音量已调整为 " + String(runtimeVolumeValue) + "%",
    });
  }

  function adjustVolume(direction) {
    return setRuntimeVolume(
      runtimeVolumeValue + direction * VOLUME_STEP_VALUE,
      direction > 0 ? "volume-up" : "volume-down"
    );
  }

  function resetVolume() {
    return setRuntimeVolume(config.volumeValue, "volume-reset");
  }

  function setRuntimeRate(rateValue, reason) {
    runtimePlaybackRateValue = clampNumber(rateValue, runtimePlaybackRateValue, 0.25, 5, 2);
    getAudios().forEach(function (audio) {
      applyAudio(audio, reason || "rate");
    });
    return buildActionResult(reason || "rate", true, {
      playbackRateValue: runtimePlaybackRateValue,
      message:
        reason === "rate-reset"
          ? "倍速已重置为 " + formatRate(runtimePlaybackRateValue)
          : "倍速已调整为 " + formatRate(runtimePlaybackRateValue),
    });
  }

  function adjustRate(direction) {
    const nextRate = runtimePlaybackRateValue + direction * config.rateStepValue;
    return setRuntimeRate(nextRate, direction > 0 ? "rate-up" : "rate-down");
  }

  function resetRate() {
    return setRuntimeRate(config.resetRateValue, "rate-reset");
  }

  function playPauseCurrent() {
    const audio = resolveCurrentAudio();
    if (!audio) {
      return Promise.resolve({
        ok: false,
        reason: "audio-not-found",
        message: "未找到可控制的音频。",
      });
    }

    if (audio.paused || audio.ended) {
      return playAudio(audio, "play-pause");
    }

    audio.pause();
    updateCurrentAudioState(audio);
    return Promise.resolve(
      buildActionResult("play-pause", true, {
        paused: true,
        currentAudioIndex: state.currentAudioIndex,
        message: getCurrentItemLabel() + "已暂停",
      })
    );
  }

  function playRelative(offset) {
    const items = getTaskItems();
    if (items.length === 0) {
      return Promise.resolve({
        ok: false,
        reason: "item-not-found",
      });
    }

    const currentAudio = resolveCurrentAudio();
    const currentItem = getItemForAudio(currentAudio);
    let currentIndex = items.indexOf(currentItem);
    if (currentIndex < 0) {
      currentIndex = offset > 0 ? -1 : 0;
    }

    const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + offset));
    const nextAudio = getItemAudio(items[nextIndex]);
    return playAudio(nextAudio, offset > 0 ? "play-next" : "play-previous");
  }

  function runAction(actionKey) {
    if (actionKey === "volumeUp") {
      return Promise.resolve(adjustVolume(1));
    }
    if (actionKey === "volumeDown") {
      return Promise.resolve(adjustVolume(-1));
    }
    if (actionKey === "volumeReset") {
      return Promise.resolve(resetVolume());
    }
    if (actionKey === "rateUp") {
      return Promise.resolve(adjustRate(1));
    }
    if (actionKey === "rateDown") {
      return Promise.resolve(adjustRate(-1));
    }
    if (actionKey === "rateReset") {
      return Promise.resolve(resetRate());
    }
    if (actionKey === "playPause") {
      return playPauseCurrent();
    }

    return Promise.resolve({
      ok: false,
      reason: "unknown-action",
      actionKey: actionKey,
      message: "未识别的快捷键动作：" + String(actionKey),
    });
  }

  function getState() {
    return Object.assign({}, clone(state), {
      started: started,
      config: clone(config),
      runtimeVolumeValue: runtimeVolumeValue,
      runtimePlaybackRateValue: runtimePlaybackRateValue,
    });
  }

  globalThis.__ASREdgeAlibabaLabelxJudgementAudioController = {
    start: start,
    stop: stop,
    updateConfig: updateConfig,
    scan: scan,
    runAction: runAction,
    getState: getState,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
