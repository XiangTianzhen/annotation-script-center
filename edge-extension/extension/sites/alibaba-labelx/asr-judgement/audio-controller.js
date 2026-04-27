(function () {
  const LOG_PREFIX = "[ASR Edge][judgement-audio-controller]";
  const detector = globalThis.__ASREdgeAlibabaLabelxJudgementPageDetector || null;
  const volumeController = globalThis.__ASREdgeAlibabaLabelxJudgementVolumeController || null;
  const rateController = globalThis.__ASREdgeAlibabaLabelxJudgementRateController || null;
  const playbackController = globalThis.__ASREdgeAlibabaLabelxJudgementPlaybackController || null;
  const audioNodes = new WeakMap();
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
    seekStepSeconds: 0.5,
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
    const defaultPlaybackRate = clampNumber(
      input.resetRateValue ?? input.playbackRateValue,
      1.0,
      0.25,
      5,
      2
    );
    const allowedRateSteps = [0.1, 0.25, 0.5, 1];
    const inputRateStep = Number(input.rateStepValue);
    const rateStepValue =
      allowedRateSteps.indexOf(inputRateStep) >= 0 ? inputRateStep : 0.25;
    return {
      autoPlay: input.autoPlay !== false,
      autoResetRate: true,
      resetRateValue: defaultPlaybackRate,
      playbackRateValue: defaultPlaybackRate,
      rateStepValue: rateStepValue,
      seekStepSeconds: clampNumber(input.seekStepSeconds, 0.5, 0.1, 30, 2),
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
        setLastError(error && error.message ? error.message : String(error));
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
        volumeValue: runtimeVolumeValue,
        playbackRateValue: runtimePlaybackRateValue,
      };
      audioNodes.set(audio, meta);
    }
    return meta;
  }

  function getAudioSourceSignature(audio) {
    return audio.currentSrc || audio.src || audio.querySelector("source")?.src || "inline-audio";
  }

  function getDefaultVolume() {
    return clampNumber(config.volumeValue, 100, 0, 1000, 0);
  }

  function getDefaultPlaybackRate() {
    return clampNumber(config.resetRateValue ?? config.playbackRateValue, 1.0, 0.25, 5, 2);
  }

  function resetAudioMetaToDefaults(meta) {
    meta.volumeValue = getDefaultVolume();
    meta.playbackRateValue = getDefaultPlaybackRate();
    meta.lastApplySignature = "";
  }

  function ensureAudioMetaValues(meta) {
    if (!Number.isFinite(Number(meta.volumeValue))) {
      meta.volumeValue = getDefaultVolume();
    }

    if (!Number.isFinite(Number(meta.playbackRateValue))) {
      meta.playbackRateValue = getDefaultPlaybackRate();
    }
  }

  function getAudioVolumeValue(audio) {
    if (!audio) {
      return getDefaultVolume();
    }

    const meta = getAudioMeta(audio);
    ensureAudioMetaValues(meta);
    return clampNumber(meta.volumeValue, getDefaultVolume(), 0, 1000, 0);
  }

  function getAudioPlaybackRateValue(audio) {
    if (!audio) {
      return getDefaultPlaybackRate();
    }

    const meta = getAudioMeta(audio);
    ensureAudioMetaValues(meta);
    return clampNumber(meta.playbackRateValue, getDefaultPlaybackRate(), 0.25, 5, 2);
  }

  function setAudioVolumeValue(audio, volumeValue, reason) {
    if (!audio) {
      return getDefaultVolume();
    }

    const meta = getAudioMeta(audio);
    meta.volumeValue = clampNumber(volumeValue, getDefaultVolume(), 0, 1000, 0);
    meta.lastApplySignature = "";
    applyAudio(audio, reason || "volume");
    updateCurrentAudioState(audio);
    return meta.volumeValue;
  }

  function setAudioPlaybackRateValue(audio, playbackRateValue, reason) {
    if (!audio) {
      return getDefaultPlaybackRate();
    }

    const meta = getAudioMeta(audio);
    meta.playbackRateValue = clampNumber(playbackRateValue, getDefaultPlaybackRate(), 0.25, 5, 2);
    meta.lastApplySignature = "";
    applyAudio(audio, reason || "rate");
    updateCurrentAudioState(audio);
    return meta.playbackRateValue;
  }

  function getAudioApplySignature(audio) {
    const meta = getAudioMeta(audio);
    ensureAudioMetaValues(meta);
    return [
      getAudioSourceSignature(audio),
      getAudioVolumeValue(audio),
      getAudioPlaybackRateValue(audio),
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

  function setLastError(message) {
    state.lastError = message;
  }

  function setLastAutoplay(nextAutoplay) {
    state.lastAutoplay = clone(nextAutoplay);
  }

  function getActionDeps() {
    return {
      applyAudio: applyAudio,
      buildActionResult: buildActionResult,
      clampNumber: clampNumber,
      getAudioContext: getAudioContext,
      getAudioMeta: getAudioMeta,
      getAudios: getAudios,
      getAudioSourceSignature: getAudioSourceSignature,
      getConfig: function () {
        return config;
      },
      getCurrentAudioIndex: function () {
        return state.currentAudioIndex;
      },
      getCurrentItemLabel: getCurrentItemLabel,
      getItemAudio: getItemAudio,
      getItemForAudio: getItemForAudio,
      getRuntimePlaybackRate: function () {
        return runtimePlaybackRateValue;
      },
      getRuntimeVolume: function () {
        return runtimeVolumeValue;
      },
      getDefaultPlaybackRate: getDefaultPlaybackRate,
      getDefaultVolume: getDefaultVolume,
      getSeekStepSeconds: function () {
        return config.seekStepSeconds;
      },
      getCurrentAudioPlaybackRate: function (audio) {
        return getAudioPlaybackRateValue(audio || resolveCurrentAudio());
      },
      getCurrentAudioVolume: function (audio) {
        return getAudioVolumeValue(audio || resolveCurrentAudio());
      },
      getTaskItems: getTaskItems,
      pauseOtherAudios: pauseOtherAudios,
      resolveCurrentAudio: resolveCurrentAudio,
      setLastAutoplay: setLastAutoplay,
      setLastError: setLastError,
      setCurrentAudioPlaybackRate: function (audio, rateValue, reason) {
        return setAudioPlaybackRateValue(audio, rateValue, reason);
      },
      setCurrentAudioVolume: function (audio, volumeValue, reason) {
        return setAudioVolumeValue(audio, volumeValue, reason);
      },
      setRuntimePlaybackRate: function (rateValue) {
        runtimePlaybackRateValue = rateValue;
      },
      setRuntimeVolume: function (volumeValue) {
        runtimeVolumeValue = volumeValue;
      },
      updateCurrentAudioState: updateCurrentAudioState,
    };
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
      meta.playbackRateValue = clampNumber(
        audio.playbackRate,
        meta.playbackRateValue || getDefaultPlaybackRate(),
        0.25,
        5,
        2
      );
      meta.lastApplySignature = "";
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
      resetAudioMetaToDefaults(meta);
    }
    ensureAudioMetaValues(meta);
    meta.lastSourceSignature = sourceSignature;

    const applySignature = getAudioApplySignature(audio);
    const audioPlaybackRate = getAudioPlaybackRateValue(audio);
    const needsRateApply = Math.abs(audio.playbackRate - audioPlaybackRate) > 0.001;
    if (meta.lastApplySignature === applySignature && !needsRateApply) {
      return;
    }

    if (volumeController && typeof volumeController.setAudioVolume === "function") {
      volumeController.setAudioVolume(audio, getAudioVolumeValue(audio), getActionDeps());
    }

    if (needsRateApply) {
      meta.resettingRate = true;
      audio.playbackRate = audioPlaybackRate;
      if (rateController && typeof rateController.updateVisibleRate === "function") {
        rateController.updateVisibleRate(audio, audioPlaybackRate);
      }
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

  function resetVisibleAudioDefaults() {
    getAudios().forEach(function (audio) {
      resetAudioMetaToDefaults(getAudioMeta(audio));
    });
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

    if (playbackController && typeof playbackController.autoplay === "function") {
      playbackController.autoplay(
        playbackController.resolveAutoplayTarget(audios),
        reason || "scan",
        getActionDeps()
      );
    }
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
    runtimePlaybackRateValue = getDefaultPlaybackRate();
    resetVisibleAudioDefaults();

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
    runtimePlaybackRateValue = getDefaultPlaybackRate();
    resetVisibleAudioDefaults();
    scheduleScan("config-update");
  }

  function buildMissingModuleResult(actionKey, moduleName) {
    return Promise.resolve(
      buildActionResult(actionKey || "unknown", false, {
        reason: "required-module-missing",
        message: "音频控制模块未加载：" + moduleName,
      })
    );
  }

  function runAction(actionKey) {
    const deps = getActionDeps();
    if (actionKey === "volumeUp") {
      if (!volumeController || typeof volumeController.adjustVolume !== "function") {
        return buildMissingModuleResult(actionKey, "volume");
      }
      return Promise.resolve(volumeController.adjustVolume(1, deps));
    }
    if (actionKey === "volumeDown") {
      if (!volumeController || typeof volumeController.adjustVolume !== "function") {
        return buildMissingModuleResult(actionKey, "volume");
      }
      return Promise.resolve(volumeController.adjustVolume(-1, deps));
    }
    if (actionKey === "volumeReset") {
      if (!volumeController || typeof volumeController.resetVolume !== "function") {
        return buildMissingModuleResult(actionKey, "volume");
      }
      return Promise.resolve(volumeController.resetVolume(deps));
    }
    if (actionKey === "rateUp") {
      if (!rateController || typeof rateController.adjustRate !== "function") {
        return buildMissingModuleResult(actionKey, "rate");
      }
      return Promise.resolve(rateController.adjustRate(1, deps));
    }
    if (actionKey === "rateDown") {
      if (!rateController || typeof rateController.adjustRate !== "function") {
        return buildMissingModuleResult(actionKey, "rate");
      }
      return Promise.resolve(rateController.adjustRate(-1, deps));
    }
    if (actionKey === "rateReset") {
      if (!rateController || typeof rateController.resetRate !== "function") {
        return buildMissingModuleResult(actionKey, "rate");
      }
      return Promise.resolve(rateController.resetRate(deps));
    }
    if (actionKey === "seekBackward") {
      if (!playbackController || typeof playbackController.seekCurrent !== "function") {
        return buildMissingModuleResult(actionKey, "playback");
      }
      return playbackController.seekCurrent(-1, deps);
    }
    if (actionKey === "seekForward") {
      if (!playbackController || typeof playbackController.seekCurrent !== "function") {
        return buildMissingModuleResult(actionKey, "playback");
      }
      return playbackController.seekCurrent(1, deps);
    }
    if (actionKey === "playPause") {
      if (!playbackController || typeof playbackController.playPauseCurrent !== "function") {
        return buildMissingModuleResult(actionKey, "playback");
      }
      return playbackController.playPauseCurrent(deps);
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
      defaultVolumeValue: getDefaultVolume(),
      defaultPlaybackRateValue: getDefaultPlaybackRate(),
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
