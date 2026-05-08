(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-shortcut-bus]";
  const runtimeConfig = window.__ASREdgeAlibabaLabelxAnnotationRuntimeConfig;
  const interactionRunner = window.__ASREdgeAlibabaLabelxAnnotationInteractionRunner;
  const audioController = window.__ASREdgeAlibabaLabelxAnnotationAudioController;
  const durationController = window.__ASREdgeAlibabaLabelxAnnotationDurationController;
  let started = false;

  if (!runtimeConfig || !interactionRunner || !audioController || !durationController) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function haltEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  function isTextInputTarget(target) {
    if (!target) {
      return false;
    }

    if (target.tagName === "TEXTAREA" || target.isContentEditable) {
      return true;
    }

    if (target.tagName !== "INPUT") {
      return false;
    }

    return !["radio", "checkbox", "button", "submit"].includes(target.type);
  }

  function isShortcutMatch(event, shortcut) {
    if (!shortcut) {
      return false;
    }

    const eventKey = typeof event.key === "string" ? event.key.toLowerCase() : null;
    const shortcutKey = typeof shortcut.key === "string" ? shortcut.key.toLowerCase() : null;
    const isKeyMatch =
      event.type === "keydown" &&
      shortcut.button === null &&
      shortcutKey !== null &&
      eventKey === shortcutKey;
    const isMouseMatch =
      event.type === "mousedown" &&
      typeof shortcut.button === "number" &&
      shortcut.key === null &&
      event.button === shortcut.button;

    return (
      (isKeyMatch || isMouseMatch) &&
      shortcut.ctrl === event.ctrlKey &&
      shortcut.alt === event.altKey &&
      shortcut.shift === event.shiftKey &&
      shortcut.meta === event.metaKey
    );
  }

  function getControlPanelApi() {
    return window.__ASREdgeAlibabaLabelxAnnotationControlPanelApi || null;
  }

  function getSettingsPanelApi() {
    const settingsPanel = window.__ASREdgeAlibabaLabelxSettingsPanel;
    return settingsPanel && typeof settingsPanel.getMountedPanel === "function"
      ? settingsPanel.getMountedPanel()
      : null;
  }

  async function runPanelAction(actionKey) {
    const controlPanel = getControlPanelApi();
    if (!controlPanel || typeof controlPanel.runAction !== "function") {
      return null;
    }

    return controlPanel.runAction(actionKey);
  }

  function handleGlobalInput(event) {
    const config = runtimeConfig.getSnapshot();
    const shortcuts = config.shortcuts || {};
    const rateStepValue =
      typeof config.rateStepValue === "number" && config.rateStepValue > 0
        ? config.rateStepValue
        : 0.1;
    const seekStepSeconds =
      typeof config.seekStepSeconds === "number" && config.seekStepSeconds > 0
        ? config.seekStepSeconds
        : 1.0;
    const resetVolumeValue =
      typeof config.volumeValue === "number" && config.volumeValue >= 0
        ? config.volumeValue
        : 100;

    if (isShortcutMatch(event, shortcuts.removeSpaces)) {
      haltEvent(event);
      void interactionRunner.execute("remove-active-spaces");
      return;
    }

    if (isShortcutMatch(event, shortcuts.toggleFocus)) {
      haltEvent(event);
      void interactionRunner.execute("toggle-focus");
      return;
    }

    if (isShortcutMatch(event, shortcuts.copyDuration)) {
      haltEvent(event);
      void durationController.copyCurrentDuration();
      return;
    }

    if (isShortcutMatch(event, shortcuts.convertNumbers)) {
      haltEvent(event);
      void interactionRunner.execute("convert-active-numbers");
      return;
    }

    if (isShortcutMatch(event, shortcuts.panel)) {
      haltEvent(event);
      const settingsPanel = getSettingsPanelApi();
      if (settingsPanel && typeof settingsPanel.toggle === "function") {
        void settingsPanel.toggle();
        return;
      }

      const controlPanel = getControlPanelApi();
      if (controlPanel && typeof controlPanel.toggle === "function") {
        controlPanel.toggle();
      }
      return;
    }

    const activeElement = document.activeElement;
    if (isTextInputTarget(activeElement) && !event.ctrlKey && !event.altKey && !event.metaKey) {
      return;
    }

    if (Array.isArray(config.customRates)) {
      for (let index = 0; index < config.customRates.length; index += 1) {
        const entry = config.customRates[index];
        if (entry?.shortcut && isShortcutMatch(event, entry.shortcut)) {
          haltEvent(event);
          audioController.adjustRate(0, entry.rate);
          return;
        }
      }
    }

    if (isShortcutMatch(event, shortcuts.playPause)) {
      haltEvent(event);
      void audioController.playPause();
      return;
    }

    if (isShortcutMatch(event, shortcuts.forward)) {
      haltEvent(event);
      audioController.seek(seekStepSeconds);
      return;
    }

    if (isShortcutMatch(event, shortcuts.backward)) {
      haltEvent(event);
      audioController.seek(-seekStepSeconds);
      return;
    }

    if (isShortcutMatch(event, shortcuts.speedUp)) {
      haltEvent(event);
      if (!event.repeat) {
        audioController.adjustRate(rateStepValue);
      }
      return;
    }

    if (isShortcutMatch(event, shortcuts.speedDown)) {
      haltEvent(event);
      if (!event.repeat) {
        audioController.adjustRate(-rateStepValue);
      }
      return;
    }

    if (isShortcutMatch(event, shortcuts.resetSpeed)) {
      haltEvent(event);
      audioController.adjustRate(0, config.playbackRateValue || config.resetRateValue);
      return;
    }

    if (isShortcutMatch(event, shortcuts.volumeUp)) {
      haltEvent(event);
      audioController.adjustVolume(50);
      return;
    }

    if (isShortcutMatch(event, shortcuts.volumeDown)) {
      haltEvent(event);
      audioController.adjustVolume(-50);
      return;
    }

    if (isShortcutMatch(event, shortcuts.resetVolume)) {
      haltEvent(event);
      audioController.adjustVolume(0, resetVolumeValue);
      return;
    }

    if (isShortcutMatch(event, shortcuts.quickfill)) {
      haltEvent(event);
      void interactionRunner.execute("quickfill-active");
      return;
    }

    if (isShortcutMatch(event, shortcuts.valid)) {
      haltEvent(event);
      void interactionRunner.execute("set-valid-active");
      return;
    }

    if (isShortcutMatch(event, shortcuts.invalid)) {
      haltEvent(event);
      void interactionRunner.execute("set-invalid-active");
    }
  }

  function start() {
    if (started) {
      return true;
    }

    started = true;
    window.addEventListener("keydown", handleGlobalInput, { capture: true });
    window.addEventListener("mousedown", handleGlobalInput, { capture: true });
    console.info(LOG_PREFIX, "Shortcut bus started.");
    return true;
  }

  window.__ASREdgeAlibabaLabelxAnnotationShortcutBus = {
    start: start,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
