(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-audio-controller]";
  const activeItemTracker = window.__ASREdgeAlibabaLabelxAnnotationActiveItem;
  const runtimeConfig = window.__ASREdgeAlibabaLabelxAnnotationRuntimeConfig;
  const listeners = [];
  let currentAudio = null;
  let audioContext = null;
  let started = false;
  let configSnapshot = runtimeConfig && typeof runtimeConfig.getSnapshot === "function"
    ? runtimeConfig.getSnapshot()
    : {
        autoPlay: true,
        autoResetRate: false,
        resetRateValue: 1.0,
        playbackRateValue: 1.0,
        rateStepValue: 0.1,
        seekStepSeconds: 1.0,
        volumeValue: 100,
      };

  if (!activeItemTracker || !runtimeConfig) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function notify(reason) {
    const snapshot = getState();
    listeners.slice().forEach(function (listener) {
      try {
        listener(snapshot, reason || "manual");
      } catch (error) {
        console.warn(LOG_PREFIX, "Audio subscriber failed:", error);
      }
    });
  }

  function getAudioContext() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    }

    if (audioContext && audioContext.state === "suspended") {
      void audioContext.resume();
    }

    return audioContext;
  }

  function setAudioVolume(audio, volumePercent) {
    if (!audio) {
      return;
    }

    try {
      if (!audio._asrGainNode) {
        const context = getAudioContext();
        if (!context) {
          throw new Error("AudioContext not supported");
        }

        const source = context.createMediaElementSource(audio);
        const gainNode = context.createGain();
        source.connect(gainNode);
        gainNode.connect(context.destination);
        audio._asrGainNode = gainNode;
      }

      audio._asrGainNode.gain.value = Math.max(0, volumePercent) / 100;
    } catch (error) {
      audio.volume = Math.max(0, Math.min(volumePercent / 100, 1.0));
    }
  }

  function resolveActiveAudio() {
    const activeItem = activeItemTracker.getActiveItem();
    const activeAudio = activeItem ? activeItem.querySelector("audio") : null;

    if (activeAudio) {
      currentAudio = activeAudio;
      return activeAudio;
    }

    if (currentAudio && currentAudio.isConnected) {
      return currentAudio;
    }

    return null;
  }

  function applyActiveAudioConfig(audio, reason) {
    if (!audio) {
      return;
    }

    setAudioVolume(audio, configSnapshot.volumeValue);

    if (configSnapshot.autoResetRate === true) {
      const resetRate = 
        typeof configSnapshot.playbackRateValue === "number" && configSnapshot.playbackRateValue > 0
          ? configSnapshot.playbackRateValue
          : typeof configSnapshot.resetRateValue === "number" && configSnapshot.resetRateValue > 0
            ? configSnapshot.resetRateValue
          : 1.0;
      audio.playbackRate = resetRate;
      updateVisibleRate(audio, resetRate);
    }

    console.info(LOG_PREFIX, "Applied audio config:", {
      reason: reason || "manual",
      autoPlay: configSnapshot.autoPlay === true,
      autoResetRate: configSnapshot.autoResetRate === true,
      resetRateValue: configSnapshot.resetRateValue,
      volumeValue: configSnapshot.volumeValue,
    });
  }

  function autoplayActiveAudio(audio, reason) {
    if (!audio || configSnapshot.autoPlay !== true) {
      return;
    }

    Promise.resolve(audio.play()).catch(function (error) {
      console.warn(LOG_PREFIX, "Autoplay failed:", {
        reason: reason || "active-item-change",
        error: error && error.message ? error.message : String(error),
      });
    });
  }

  function updateVisibleRate(audio, rate) {
    const container = audio?.closest ? audio.closest(".labelRender-item") : null;
    if (!container) {
      return;
    }

    const speedNode = container.querySelector(".ant-v5-select-selection-item");
    if (speedNode && String(speedNode.textContent || "").includes("x")) {
      speedNode.textContent = rate.toFixed(1) + "x";
      speedNode.title = rate.toFixed(1) + "x";
    }
  }

  function ensureAudioTarget() {
    const audio = resolveActiveAudio();

    if (!audio) {
      return {
        ok: false,
        reason: "audio-not-found",
        summaryText: "当前没有可操作的音频。",
      };
    }

    setAudioVolume(audio, configSnapshot.volumeValue);
    return {
      ok: true,
      audio: audio,
    };
  }

  async function playPause() {
    const audioTarget = ensureAudioTarget();
    if (!audioTarget.ok) {
      return audioTarget;
    }

    const audio = audioTarget.audio;
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }

    console.info(LOG_PREFIX, "Play/pause toggled:", {
      paused: audio.paused,
      playbackRate: audio.playbackRate,
      currentTime: audio.currentTime,
    });
    notify("play-pause");
    return {
      ok: true,
      reason: "ok",
      paused: audio.paused,
      summaryText: audio.paused ? "已暂停当前音频。" : "已播放当前音频。",
      playbackRate: audio.playbackRate,
      currentTime: audio.currentTime,
    };
  }

  function seek(deltaSeconds) {
    const audioTarget = ensureAudioTarget();
    if (!audioTarget.ok) {
      return audioTarget;
    }

    const audio = audioTarget.audio;
    const nextTime = Math.max(0, Math.min(audio.currentTime + deltaSeconds, audio.duration || 9999));
    audio.currentTime = nextTime;
    console.info(LOG_PREFIX, "Seeked audio:", {
      deltaSeconds: deltaSeconds,
      currentTime: audio.currentTime,
      duration: audio.duration,
    });
    notify("seek");

    return {
      ok: true,
      reason: "ok",
      currentTime: audio.currentTime,
      duration: audio.duration,
      deltaSeconds: deltaSeconds,
      summaryText:
        (deltaSeconds >= 0 ? "已前进 " : "已后退 ") + Math.abs(deltaSeconds).toFixed(1) + " 秒。",
    };
  }

  function adjustRate(delta, absoluteRate) {
    const audioTarget = ensureAudioTarget();
    if (!audioTarget.ok) {
      return audioTarget;
    }

    const audio = audioTarget.audio;
    let nextRate =
      typeof absoluteRate === "number" && absoluteRate > 0
        ? absoluteRate
        : Math.round((audio.playbackRate + delta) * 10) / 10;
    nextRate = Math.max(0.1, Math.min(nextRate, 8.0));
    audio.playbackRate = nextRate;
    updateVisibleRate(audio, nextRate);
    console.info(LOG_PREFIX, "Adjusted playback rate:", {
      playbackRate: nextRate,
    });
    notify("rate");

    return {
      ok: true,
      reason: "ok",
      playbackRate: nextRate,
      summaryText: "当前倍速已调整为 " + nextRate.toFixed(1) + "x。",
    };
  }

  function adjustVolume(delta, absoluteVolume) {
    const nextVolume =
      typeof absoluteVolume === "number"
        ? absoluteVolume
        : Math.max(0, Math.min(1000, configSnapshot.volumeValue + delta));

    configSnapshot.volumeValue = nextVolume;
    const audio = resolveActiveAudio();
    if (audio) {
      setAudioVolume(audio, nextVolume);
    }
    console.info(LOG_PREFIX, "Adjusted volume:", {
      volumeValue: nextVolume,
    });
    notify("volume");

    return {
      ok: true,
      reason: "ok",
      volumeValue: nextVolume,
      summaryText: "当前音量已调整为 " + nextVolume + "%。",
    };
  }

  function handlePlayEvent(event) {
    const target = event?.target;
    if (!target || target.tagName !== "AUDIO") {
      return;
    }

    if (currentAudio && currentAudio !== target) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentAudio = target;
    setAudioVolume(target, configSnapshot.volumeValue);
    notify("audio-play");
  }

  function handlePauseEvent(event) {
    const target = event?.target;
    if (!target || target.tagName !== "AUDIO" || currentAudio !== target) {
      return;
    }

    notify("audio-pause");
  }

  function handleActiveItemChange(snapshot) {
    const item = snapshot?.item || activeItemTracker.getActiveItem();
    const audio = item && typeof item.querySelector === "function" ? item.querySelector("audio") : null;

    if (!audio) {
      notify("active-item-change");
      return;
    }

    currentAudio = audio;
    applyActiveAudioConfig(audio, snapshot?.reason || "active-item-change");
    autoplayActiveAudio(audio, snapshot?.reason || "active-item-change");
    notify("active-item-change");
  }

  function start() {
    if (started) {
      notify("start-repeat");
      return getState();
    }

    started = true;
    runtimeConfig.subscribe(function (nextConfig) {
      configSnapshot = nextConfig;
      const audio = resolveActiveAudio();
      if (audio) {
        applyActiveAudioConfig(audio, "config-change");
      }
      notify("config-change");
    });
    activeItemTracker.subscribe(handleActiveItemChange);
    document.addEventListener("play", handlePlayEvent, true);
    document.addEventListener("pause", handlePauseEvent, true);
    handleActiveItemChange(activeItemTracker.getSnapshot());
    notify("start");
    return getState();
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

  function getState() {
    const audio = resolveActiveAudio();
    return {
      hasAudio: Boolean(audio),
      paused: audio ? audio.paused : true,
      currentTime: audio ? audio.currentTime : 0,
      duration: audio && Number.isFinite(audio.duration) ? audio.duration : 0,
      playbackRate:
        audio
          ? audio.playbackRate
          : configSnapshot.playbackRateValue || configSnapshot.resetRateValue,
      volumeValue: configSnapshot.volumeValue,
      activeItemIndex: activeItemTracker.getActiveIndex(),
    };
  }

  window.__ASREdgeAlibabaLabelxAnnotationAudioController = {
    start: start,
    subscribe: subscribe,
    getState: getState,
    playPause: playPause,
    seek: seek,
    adjustRate: adjustRate,
    adjustVolume: adjustVolume,
    setAudioVolume: setAudioVolume,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
