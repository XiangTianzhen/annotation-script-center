(function () {
  const activeItemApi = globalThis.__ASREdgeAlibabaLabelxTranscriptionActiveItem || null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function resolveCurrentAudio() {
    if (!activeItemApi) {
      return null;
    }
    const context = activeItemApi.getCurrentContext();
    if (context && context.audio) {
      return context.audio;
    }
    const playingAudio = Array.from(document.querySelectorAll("audio")).find(function (audio) {
      return !audio.paused;
    });
    if (playingAudio) {
      return playingAudio;
    }
    const fallback = Array.from(document.querySelectorAll(".labelRender-item audio")).find(function (audio) {
      return audio instanceof HTMLAudioElement;
    });
    return fallback || null;
  }

  async function safePlay(audio) {
    try {
      await audio.play();
      return { ok: true, message: "音频开始播放。" };
    } catch (error) {
      return {
        ok: false,
        message: "播放失败，可能被浏览器自动播放策略拦截。",
        reason: error && error.message ? error.message : String(error),
      };
    }
  }

  async function playPauseCurrentAudio() {
    const audio = resolveCurrentAudio();
    if (!audio) {
      return { ok: false, message: "未定位到当前音频。" };
    }
    if (audio.paused) {
      return safePlay(audio);
    }
    audio.pause();
    return { ok: true, message: "音频已暂停。" };
  }

  function seekCurrentAudio(seconds) {
    const audio = resolveCurrentAudio();
    if (!audio) {
      return { ok: false, message: "未定位到当前音频。" };
    }
    const step = toNumber(seconds, 1);
    const duration = Number.isFinite(audio.duration) ? audio.duration : Number.MAX_SAFE_INTEGER;
    audio.currentTime = clamp(audio.currentTime + step, 0, duration);
    return { ok: true, message: step >= 0 ? "当前音频已前进。" : "当前音频已后退。" };
  }

  function setPlaybackRate(rate) {
    const audio = resolveCurrentAudio();
    if (!audio) {
      return { ok: false, message: "未定位到当前音频。" };
    }
    const nextRate = clamp(toNumber(rate, 1), 0.25, 5);
    audio.playbackRate = nextRate;
    return { ok: true, message: "当前音频倍速已更新。", value: nextRate };
  }

  function adjustPlaybackRate(step) {
    const audio = resolveCurrentAudio();
    if (!audio) {
      return { ok: false, message: "未定位到当前音频。" };
    }
    const delta = toNumber(step, 0.1);
    const nextRate = clamp(audio.playbackRate + delta, 0.25, 5);
    audio.playbackRate = nextRate;
    return { ok: true, message: "当前音频倍速已更新。", value: nextRate };
  }

  function setVolumePercent(volumePercent) {
    const audio = resolveCurrentAudio();
    if (!audio) {
      return { ok: false, message: "未定位到当前音频。" };
    }
    const next = clamp(toNumber(volumePercent, 100), 0, 1000);
    audio.volume = clamp(next / 100, 0, 1);
    return { ok: true, message: "当前音频音量已更新。", value: next };
  }

  function adjustVolumePercent(stepPercent) {
    const audio = resolveCurrentAudio();
    if (!audio) {
      return { ok: false, message: "未定位到当前音频。" };
    }
    const current = Math.round(audio.volume * 100);
    const next = clamp(current + toNumber(stepPercent, 10), 0, 1000);
    audio.volume = clamp(next / 100, 0, 1);
    return { ok: true, message: "当前音频音量已更新。", value: next };
  }

  async function copyCurrentAudioDuration() {
    const audio = resolveCurrentAudio();
    if (!audio || !Number.isFinite(audio.duration)) {
      return { ok: false, message: "当前音频时长不可用。" };
    }
    const value = String(Number(audio.duration.toFixed(3)));
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(value);
      return { ok: true, message: "当前音频时长已复制。", value: value };
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    return { ok: true, message: "当前音频时长已复制。", value: value };
  }

  async function autoPlayCurrentAudioIfNeeded(enabled) {
    if (enabled !== true) {
      return { ok: false, skipped: true };
    }
    const audio = resolveCurrentAudio();
    if (!audio) {
      return { ok: false, skipped: true };
    }
    if (!audio.paused) {
      return { ok: true, skipped: true };
    }
    return safePlay(audio);
  }

  function getCurrentAudioSnapshot() {
    const audio = resolveCurrentAudio();
    if (!audio) {
      return { found: false };
    }
    const duration = Number.isFinite(audio.duration) ? Number(audio.duration.toFixed(3)) : null;
    const currentTime = Number.isFinite(audio.currentTime) ? Number(audio.currentTime.toFixed(3)) : null;
    return {
      found: true,
      paused: audio.paused === true,
      playbackRate: Number(audio.playbackRate || 1),
      volumePercent: Math.round(Number(audio.volume || 0) * 100),
      duration: duration,
      currentTime: currentTime,
    };
  }

  globalThis.__ASREdgeAlibabaLabelxTranscriptionAudioController = {
    resolveCurrentAudio: resolveCurrentAudio,
    playPauseCurrentAudio: playPauseCurrentAudio,
    seekCurrentAudio: seekCurrentAudio,
    adjustPlaybackRate: adjustPlaybackRate,
    setPlaybackRate: setPlaybackRate,
    adjustVolumePercent: adjustVolumePercent,
    setVolumePercent: setVolumePercent,
    copyCurrentAudioDuration: copyCurrentAudioDuration,
    autoPlayCurrentAudioIfNeeded: autoPlayCurrentAudioIfNeeded,
    getCurrentAudioSnapshot: getCurrentAudioSnapshot,
  };
})();
