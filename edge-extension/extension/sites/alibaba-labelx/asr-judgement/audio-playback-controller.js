(function () {
  function playAudio(audio, reason, deps) {
    if (!audio) {
      return Promise.resolve(
        deps.buildActionResult(reason || "play", false, {
          reason: "audio-not-found",
          message: "未找到可播放的音频。",
        })
      );
    }

    deps.applyAudio(audio, reason || "play");
    deps.pauseOtherAudios(audio);
    deps.updateCurrentAudioState(audio);

    return Promise.resolve(audio.play())
      .then(function () {
        return deps.buildActionResult(reason || "play", true, {
          currentAudioIndex: deps.getCurrentAudioIndex(),
          message: deps.getCurrentItemLabel() + "开始播放",
        });
      })
      .catch(function (error) {
        const result = deps.buildActionResult(reason || "play", false, {
          currentAudioIndex: deps.getCurrentAudioIndex(),
          reason: error && error.message ? error.message : String(error),
          message: "播放失败：" + (error && error.message ? error.message : String(error)),
        });
        deps.setLastError(result.reason);
        return result;
      });
  }

  function autoplay(audio, reason, deps) {
    if (!audio || deps.getConfig().autoPlay !== true) {
      return;
    }

    const meta = deps.getAudioMeta(audio);
    const signature = deps.getAudioSourceSignature(audio);
    if (meta.lastAutoplaySignature === signature) {
      return;
    }

    meta.lastAutoplaySignature = signature;
    void playAudio(audio, reason || "autoplay", deps).then(function (result) {
      deps.setLastAutoplay(
        Object.assign({}, result, {
          src: signature,
        })
      );
    });
  }

  function resolveAutoplayTarget(audios) {
    const selectedItem = document.querySelector(".labelRender-item-selected audio[controls]");
    if (selectedItem && audios.indexOf(selectedItem) >= 0) {
      return selectedItem;
    }

    return audios[0] || null;
  }

  function playPauseCurrent(deps) {
    const audio = deps.resolveCurrentAudio();
    if (!audio) {
      return Promise.resolve({
        ok: false,
        reason: "audio-not-found",
        message: "未找到可控制的音频。",
      });
    }

    if (audio.paused || audio.ended) {
      return playAudio(audio, "play-pause", deps);
    }

    audio.pause();
    deps.updateCurrentAudioState(audio);
    return Promise.resolve(
      deps.buildActionResult("play-pause", true, {
        paused: true,
        currentAudioIndex: deps.getCurrentAudioIndex(),
        message: deps.getCurrentItemLabel() + "已暂停",
      })
    );
  }

  function playRelative(offset, deps) {
    const items = deps.getTaskItems();
    if (items.length === 0) {
      return Promise.resolve({
        ok: false,
        reason: "item-not-found",
      });
    }

    const currentAudio = deps.resolveCurrentAudio();
    const currentItem = deps.getItemForAudio(currentAudio);
    let currentIndex = items.indexOf(currentItem);
    if (currentIndex < 0) {
      currentIndex = offset > 0 ? -1 : 0;
    }

    const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + offset));
    const nextAudio = deps.getItemAudio(items[nextIndex]);
    return playAudio(nextAudio, offset > 0 ? "play-next" : "play-previous", deps);
  }

  globalThis.__ASREdgeAlibabaLabelxJudgementPlaybackController = {
    playAudio: playAudio,
    autoplay: autoplay,
    resolveAutoplayTarget: resolveAutoplayTarget,
    playPauseCurrent: playPauseCurrent,
    playRelative: playRelative,
  };
})();
