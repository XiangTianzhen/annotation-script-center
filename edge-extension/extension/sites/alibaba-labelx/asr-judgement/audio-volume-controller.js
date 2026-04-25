(function () {
  const VOLUME_STEP_VALUE = 50;

  function setAudioVolume(audio, volumePercent, deps) {
    const normalizedVolume = deps.clampNumber(volumePercent, 100, 0, 1000, 0);
    const meta = deps.getAudioMeta(audio);

    if (!meta.gainNode && normalizedVolume <= 100) {
      audio.volume = Math.max(0, Math.min(normalizedVolume / 100, 1));
      return;
    }

    try {
      if (!meta.gainNode) {
        const context = deps.getAudioContext();
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
      deps.setLastError(error && error.message ? error.message : String(error));
    }
  }

  function setRuntimeVolume(volumeValue, reason, deps) {
    const nextVolumeValue = deps.clampNumber(volumeValue, deps.getRuntimeVolume(), 0, 1000, 0);
    deps.setRuntimeVolume(nextVolumeValue);

    deps.getAudios().forEach(function (audio) {
      deps.applyAudio(audio, reason || "volume");
    });

    return deps.buildActionResult(reason || "volume", true, {
      volumeValue: nextVolumeValue,
      message:
        reason === "volume-reset"
          ? "音量已重置为 " + String(nextVolumeValue) + "%"
          : "音量已调整为 " + String(nextVolumeValue) + "%",
    });
  }

  function adjustVolume(direction, deps) {
    return setRuntimeVolume(
      deps.getRuntimeVolume() + direction * VOLUME_STEP_VALUE,
      direction > 0 ? "volume-up" : "volume-down",
      deps
    );
  }

  function resetVolume(deps) {
    return setRuntimeVolume(deps.getConfig().volumeValue, "volume-reset", deps);
  }

  globalThis.__ASREdgeAlibabaLabelxJudgementVolumeController = {
    VOLUME_STEP_VALUE: VOLUME_STEP_VALUE,
    setAudioVolume: setAudioVolume,
    setRuntimeVolume: setRuntimeVolume,
    adjustVolume: adjustVolume,
    resetVolume: resetVolume,
  };
})();
