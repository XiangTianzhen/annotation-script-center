(function () {
  const INSTALL_FLAG = "__ASCEdgeAbakaAiTaskPageContentInstalled";
  if (window[INSTALL_FLAG]) {
    return;
  }
  window[INSTALL_FLAG] = true;

  const storage = globalThis.ASREdgeStorage || {};
  const toast = globalThis.__ASCEdgeAbakaAiToast || {};
  const domActionsFactory = globalThis.__ASCEdgeAbakaAiDomActions || {};
  const shortcutFactory = globalThis.__ASCEdgeAbakaAiTask21Shortcuts || {};
  const dataCollector = globalThis.__ASCEdgeAbakaAiTask21DataCollector || {};
  const aiClient = globalThis.__ASCEdgeAbakaAiTask21AiClient || {};
  const aiPanelFactory = globalThis.__ASCEdgeAbakaAiTask21AiPanel || {};
  const pricing = globalThis.__ASCEdgeAbakaAiTask21Pricing || {};
  const TASK21_ASSISTANT_RUNTIME_VERSION = String(
    aiPanelFactory.runtimeVersion || domActionsFactory.runtimeVersion || "task21-assistant-runtime-unknown"
  );

  if (
    typeof storage.getSettings !== "function" ||
    typeof domActionsFactory.createRuntime !== "function" ||
    typeof shortcutFactory.createRuntime !== "function"
  ) {
    console.warn("[ASC][Abaka AI] Task21 shortcuts skipped: runtime dependencies missing.");
    return;
  }

  let settingsCache = null;
  let shortcutRuntime = null;
  let domActionsRuntime = null;
  let aiPanelRuntime = null;

  function showToast(message, tone) {
    if (typeof toast.show === "function") {
      toast.show(message, tone || "info");
      return;
    }
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("[ASC][Abaka AI] " + String(message || ""));
    }
  }

  function getCurrentAbakaScriptConfig() {
    const source = settingsCache?.platforms?.abakaAi?.scripts?.taskPageCapture || {};
    return {
      autoSelectSpecifyOnSameFontTrue: source.autoSelectSpecifyOnSameFontTrue !== false,
    };
  }

  async function bootstrap() {
    settingsCache = await storage.getSettings();

    domActionsRuntime = domActionsFactory.createRuntime({
      getAutoSelectSpecifyOnSameFontTrue: function () {
        return getCurrentAbakaScriptConfig().autoSelectSpecifyOnSameFontTrue;
      },
    });

    shortcutRuntime = shortcutFactory.createRuntime({
      settings: settingsCache,
      showToast: showToast,
      hasSameFontField: function () {
        return domActionsRuntime && domActionsRuntime.hasSameFontField
          ? domActionsRuntime.hasSameFontField()
          : false;
      },
      actions: {
        sameFontTrue: function () {
          return domActionsRuntime.selectSameFontTrue();
        },
        sameFontFalse: function () {
          return domActionsRuntime.selectSameFontFalse();
        },
        sameFontArtisticEffect: function () {
          return domActionsRuntime.selectSameFontArtisticEffect();
        },
        imageBTextsRemovedSpecify: function () {
          return domActionsRuntime.selectImageBTextsRemovedSpecify();
        },
        otherChangesSpecify: function () {
          return domActionsRuntime.selectOtherChangesSpecify();
        },
        stashSave: function () {
          return domActionsRuntime.clickStashSave();
        },
        submitReview: function () {
          return domActionsRuntime.clickSubmitReview();
        },
        aiAnalyzeSameFont: function () {
          if (!aiPanelRuntime || typeof aiPanelRuntime.runAnalysis !== "function") {
            return { ok: false, message: "AI 分析功能未就绪。" };
          }
          return aiPanelRuntime.runAnalysis("same_font", { source: "shortcut" });
        },
        aiAnalyzeImageBTextsRemoved: function () {
          if (!aiPanelRuntime || typeof aiPanelRuntime.runAnalysis !== "function") {
            return { ok: false, message: "AI 分析功能未就绪。" };
          }
          return aiPanelRuntime.runAnalysis("image_b_texts_removed", { source: "shortcut" });
        },
        aiAnalyzeOtherChanges: function () {
          if (!aiPanelRuntime || typeof aiPanelRuntime.runAnalysis !== "function") {
            return { ok: false, message: "AI 分析功能未就绪。" };
          }
          return aiPanelRuntime.runAnalysis("other_changes", { source: "shortcut" });
        },
        aiAnalyzeOverall: function () {
          if (!aiPanelRuntime || typeof aiPanelRuntime.runAnalysis !== "function") {
            return { ok: false, message: "AI 分析功能未就绪。" };
          }
          return aiPanelRuntime.runAnalysis("overall", { source: "shortcut" });
        },
      },
    });

    shortcutRuntime.start();
    console.info(
      "[ASC][Abaka AI] Task21 assistant runtime version: " + TASK21_ASSISTANT_RUNTIME_VERSION
    );
    console.info("[ASC][Abaka AI] Task21 shortcuts ready");

    try {
      if (
        typeof dataCollector.collectTask21Payload !== "function" ||
        typeof aiClient.analyze !== "function" ||
        typeof aiPanelFactory.createRuntime !== "function"
      ) {
        console.warn("[ASC][Abaka AI] Task21 AI panel skipped: runtime dependencies missing.");
        return;
      }

      aiPanelRuntime = aiPanelFactory.createRuntime({
        collector: dataCollector,
        client: aiClient,
        pricing: pricing,
        settings: settingsCache,
        showToast: showToast,
        actions: domActionsRuntime,
      });
      const aiStarted = aiPanelRuntime.start();
      if (aiStarted && aiStarted.ok === true) {
        console.info("[ASC][Abaka AI] Task21 AI panel ready");
      }
    } catch (error) {
      console.warn(
        "[ASC][Abaka AI] Task21 AI panel init failed:",
        error && error.message ? error.message : error
      );
    }
  }

  bootstrap().catch(function (error) {
    console.warn(
      "[ASC][Abaka AI] Task21 shortcuts init failed:",
      error && error.message ? error.message : error
    );
  });
})();
