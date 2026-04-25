(function () {
  function formatRate(rate) {
    return Number.isInteger(rate)
      ? String(rate) + "x"
      : Number(rate).toFixed(2).replace(/0$/, "").replace(/0$/, "") + "x";
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

  function setRuntimeRate(rateValue, reason, deps) {
    const nextRateValue = deps.clampNumber(rateValue, deps.getRuntimePlaybackRate(), 0.25, 5, 2);
    deps.setRuntimePlaybackRate(nextRateValue);

    deps.getAudios().forEach(function (audio) {
      deps.applyAudio(audio, reason || "rate");
    });

    return deps.buildActionResult(reason || "rate", true, {
      playbackRateValue: nextRateValue,
      message:
        reason === "rate-reset"
          ? "倍速已重置为 " + formatRate(nextRateValue)
          : "倍速已调整为 " + formatRate(nextRateValue),
    });
  }

  function adjustRate(direction, deps) {
    const nextRate = deps.getRuntimePlaybackRate() + direction * deps.getConfig().rateStepValue;
    return setRuntimeRate(nextRate, direction > 0 ? "rate-up" : "rate-down", deps);
  }

  function resetRate(deps) {
    return setRuntimeRate(deps.getConfig().resetRateValue, "rate-reset", deps);
  }

  globalThis.__ASREdgeAlibabaLabelxJudgementRateController = {
    formatRate: formatRate,
    updateVisibleRate: updateVisibleRate,
    setRuntimeRate: setRuntimeRate,
    adjustRate: adjustRate,
    resetRate: resetRate,
  };
})();
