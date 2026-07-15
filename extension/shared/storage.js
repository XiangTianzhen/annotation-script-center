(function () {
  "use strict";

  const constants = globalThis.ASREdgeConstants || {};
  const STORAGE_KEY = constants.STORAGE_KEY || "asrEdgeSettings";
  const EXTENSION_CONTEXT_INVALIDATED_CODE = "extension-context-invalidated";

  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function deepMerge(base, patch) {
    const result = clone(object(base));
    Object.entries(object(patch)).forEach(([key, value]) => {
      result[key] = value && typeof value === "object" && !Array.isArray(value)
        ? deepMerge(result[key], value) : clone(value);
    });
    return result;
  }
  function bool(value, fallback) { return typeof value === "boolean" ? value : fallback; }
  function numberInRange(value, fallback, min, max) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
  }
  function text(value, fallback = "") {
    return typeof value === "string" ? value.trim() : fallback;
  }
  function option(value, allowed, fallback) {
    const normalized = text(value);
    return allowed.includes(normalized) ? normalized : fallback;
  }
  function numericText(value, fallback, min, max) {
    if (value === "" || value === undefined || value === null) return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return String(Math.max(min, Math.min(max, parsed)));
  }
  function stopSequences(value, fallback) {
    if (typeof value !== "string") return fallback;
    return Array.from(new Set(value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))).join("\n");
  }
  function normalizeShortcutMap(value, fallback, aidpMigration) {
    const source = object(value);
    if (!aidpMigration) return clone(source);
    const result = clone(fallback);
    Object.keys(result).forEach((key) => {
      if (source[key] === null || (source[key] && typeof source[key] === "object")) result[key] = clone(source[key]);
    });
    const space = source.togglePlayPause;
    const hasOtherCustom = Object.entries(source).some(([key, shortcut]) => key !== "togglePlayPause" && shortcut && typeof shortcut === "object");
    if (space && space.key === "Space" && !hasOtherCustom) result.togglePlayPause = null;
    return result;
  }

  function normalizeMeta(rawMeta) {
    const source = object(rawMeta);
    const baseUrls = constants.getBackendBaseUrlsFromSettings({ meta: { backendBaseUrls: source.backendBaseUrls } });
    const allowedOrder = ["dataBakerCvpc", "bytedanceAidp", "magicData"];
    const seen = new Set();
    const publicCenterPlatformOrder = (Array.isArray(source.publicCenterPlatformOrder) ? source.publicCenterPlatformOrder : [])
      .filter((id) => allowedOrder.includes(id) && !seen.has(id) && seen.add(id));
    return {
      schemaVersion: constants.SCHEMA_VERSION || 30,
      backendEndpointMode: constants.normalizeBackendEndpointMode(source.backendEndpointMode, "server"),
      backendBaseUrls: baseUrls,
      aiUsageOperatorName: text(source.aiUsageOperatorName),
      aiCallLogDownloadOperatorName: text(source.aiCallLogDownloadOperatorName),
      publicCenterPlatformOrder,
      lastBootstrapReason: source.lastBootstrapReason == null ? null : text(source.lastBootstrapReason),
      lastBootstrappedAt: source.lastBootstrappedAt == null ? null : text(source.lastBootstrappedAt),
    };
  }

  function normalizeCvpc(raw, meta) {
    const defaults = constants.DEFAULT_SETTINGS.platforms.dataBakerCvpc;
    const sourcePlatform = object(raw);
    const source = object(sourcePlatform.scripts?.liuzhouAssistant);
    const fallback = defaults.scripts.liuzhouAssistant;
    const legacyTip = typeof source.blockEditingTabTips === "boolean" ? source.blockEditingTabTips : null;
    const modeSettings = { meta };
    const next = {
      ...clone(fallback),
      enabled: bool(source.enabled, fallback.enabled),
      segmentPreviewEnabled: bool(source.segmentPreviewEnabled, fallback.segmentPreviewEnabled),
      segmentPreviewAutoApplyEnabled: bool(source.segmentPreviewAutoApplyEnabled, fallback.segmentPreviewAutoApplyEnabled),
      aiRecommendAutoFillEnabled: bool(source.aiRecommendAutoFillEnabled, fallback.aiRecommendAutoFillEnabled),
      recommendationValidityAutoCorrectEnabled: bool(source.recommendationValidityAutoCorrectEnabled, fallback.recommendationValidityAutoCorrectEnabled),
      segmentContextPaddingMs: numberInRange(source.segmentContextPaddingMs, fallback.segmentContextPaddingMs, 0, 1500),
      segmentSilenceThresholdDbfs: numberInRange(source.segmentSilenceThresholdDbfs, fallback.segmentSilenceThresholdDbfs, -80, -5),
      segmentSilenceThresholdUnit: option(source.segmentSilenceThresholdUnit, ["db", "ratio", "value"], fallback.segmentSilenceThresholdUnit),
      blockNewTabEditingTips: bool(source.blockNewTabEditingTips, legacyTip ?? fallback.blockNewTabEditingTips),
      blockPauseStateTips: bool(source.blockPauseStateTips, legacyTip ?? fallback.blockPauseStateTips),
      segmentPreviewEndpoint: constants.buildBackendUrl(constants.DATA_BAKER_CVPC_SEGMENT_PREVIEW_PATH, modeSettings),
      aiRecommendEnabled: bool(source.aiRecommendEnabled, fallback.aiRecommendEnabled),
      aiRecommendEndpoint: constants.buildBackendUrl(constants.DATA_BAKER_CVPC_AI_RECOMMEND_PATH, modeSettings),
      aiRecommendRequestTimeoutMs: numberInRange(source.aiRecommendRequestTimeoutMs, fallback.aiRecommendRequestTimeoutMs, 1000, 60000),
      aiRecommendListenModel: option(source.aiRecommendListenModel || source.aiRecommendModel, ["qwen3.5-omni-flash", "qwen3.5-omni-plus"], fallback.aiRecommendListenModel),
      aiRecommendRefineModel: option(source.aiRecommendRefineModel, ["qwen3.5-plus", "qwen3.5-flash"], fallback.aiRecommendRefineModel),
      aiRecommendListenPrompt: text(source.aiRecommendListenPrompt, fallback.aiRecommendListenPrompt),
      aiRecommendRefinePrompt: text(source.aiRecommendRefinePrompt, fallback.aiRecommendRefinePrompt),
      aiRecommendListenIncludeLexiconReference: bool(source.aiRecommendListenIncludeLexiconReference, fallback.aiRecommendListenIncludeLexiconReference),
      aiRecommendListenTemperature: numericText(source.aiRecommendListenTemperature, fallback.aiRecommendListenTemperature, 0, 2),
      aiRecommendListenTopP: numericText(source.aiRecommendListenTopP, fallback.aiRecommendListenTopP, 0, 1),
      aiRecommendListenMaxTokens: numericText(source.aiRecommendListenMaxTokens, fallback.aiRecommendListenMaxTokens, 1, 65536),
      aiRecommendListenMaxCompletionTokens: numericText(source.aiRecommendListenMaxCompletionTokens, fallback.aiRecommendListenMaxCompletionTokens, 1, 65536),
      aiRecommendListenPresencePenalty: numericText(source.aiRecommendListenPresencePenalty, fallback.aiRecommendListenPresencePenalty, -2, 2),
      aiRecommendListenFrequencyPenalty: numericText(source.aiRecommendListenFrequencyPenalty, fallback.aiRecommendListenFrequencyPenalty, -2, 2),
      aiRecommendListenSeed: numericText(source.aiRecommendListenSeed, fallback.aiRecommendListenSeed, -2147483648, 2147483647),
      aiRecommendListenStopSequences: stopSequences(source.aiRecommendListenStopSequences, fallback.aiRecommendListenStopSequences),
      aiRecommendRefineTemperature: numericText(source.aiRecommendRefineTemperature, fallback.aiRecommendRefineTemperature, 0, 2),
      aiRecommendRefineTopP: numericText(source.aiRecommendRefineTopP, fallback.aiRecommendRefineTopP, 0, 1),
      aiRecommendRefineMaxTokens: numericText(source.aiRecommendRefineMaxTokens, fallback.aiRecommendRefineMaxTokens, 1, 65536),
      aiRecommendRefineMaxCompletionTokens: numericText(source.aiRecommendRefineMaxCompletionTokens, fallback.aiRecommendRefineMaxCompletionTokens, 1, 65536),
      aiRecommendRefinePresencePenalty: numericText(source.aiRecommendRefinePresencePenalty, fallback.aiRecommendRefinePresencePenalty, -2, 2),
      aiRecommendRefineFrequencyPenalty: numericText(source.aiRecommendRefineFrequencyPenalty, fallback.aiRecommendRefineFrequencyPenalty, -2, 2),
      aiRecommendRefineSeed: numericText(source.aiRecommendRefineSeed, fallback.aiRecommendRefineSeed, -2147483648, 2147483647),
      aiRecommendRefineStopSequences: stopSequences(source.aiRecommendRefineStopSequences, fallback.aiRecommendRefineStopSequences),
      contractMode: "dom-guarded",
      shortcuts: normalizeShortcutMap(source.shortcuts, {}, false),
    };
    return { enabled: bool(sourcePlatform.enabled, defaults.enabled), scripts: { liuzhouAssistant: next } };
  }

  function normalizeAidpScript(raw, fallback, meta, legacySchema) {
    const source = object(raw);
    const isJinhua = fallback.id === constants.BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID;
    const isTaizhou = fallback.id === constants.BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID;
    const endpointPath = fallback.id === constants.BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID
      ? constants.BYTEDANCE_AIDP_JINHUA_AI_RECOMMEND_PATH
      : fallback.id === constants.BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID
        ? constants.BYTEDANCE_AIDP_TAIZHOU_AI_RECOMMEND_PATH
        : constants.BYTEDANCE_AIDP_SUZHOU_AI_RECOMMEND_PATH;
    const migratedShortcuts = normalizeShortcutMap(source.shortcuts, fallback.shortcuts, legacySchema <= 27);
    const common = {
      ...clone(fallback),
      enabled: bool(source.enabled, fallback.enabled),
      platformAiEnabled: legacySchema < 25 ? false : bool(source.platformAiEnabled, fallback.platformAiEnabled),
      segmentContextPaddingMs: legacySchema <= 25 ? fallback.segmentContextPaddingMs : numberInRange(source.segmentContextPaddingMs, fallback.segmentContextPaddingMs, 0, 500),
      segmentSilenceThresholdDbfs: numberInRange(source.segmentSilenceThresholdDbfs, fallback.segmentSilenceThresholdDbfs, -80, -5),
      mergeContiguousSuggestedSegmentsEnabled: bool(source.mergeContiguousSuggestedSegmentsEnabled, fallback.mergeContiguousSuggestedSegmentsEnabled),
      segmentPreviewAutoApplyEnabled: bool(source.segmentPreviewAutoApplyEnabled, fallback.segmentPreviewAutoApplyEnabled),
      aiRecommendEnabled: bool(source.aiRecommendEnabled, fallback.aiRecommendEnabled),
      aiRecommendAutoFillEnabled: bool(source.aiRecommendAutoFillEnabled, fallback.aiRecommendAutoFillEnabled),
      aiRecommendEndpoint: constants.buildBackendUrl(endpointPath, { meta }),
      aiRecommendRequestTimeoutMs: numberInRange(source.aiRecommendRequestTimeoutMs, fallback.aiRecommendRequestTimeoutMs, 1000, 60000),
      defaultPlaybackRate: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].includes(Number(source.defaultPlaybackRate)) ? Number(source.defaultPlaybackRate) : fallback.defaultPlaybackRate,
      fixedWaveZoom: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(Number(source.fixedWaveZoom)) ? Number(source.fixedWaveZoom) : fallback.fixedWaveZoom,
      contractMode: "dom-guarded",
      shortcuts: migratedShortcuts,
    };
    if (isTaizhou) {
      return {
        ...common,
        aiRecommendOmniModel: option(
          source.aiRecommendOmniModel || source.aiRecommendListenModel,
          ["qwen3.5-omni-plus", "qwen3.5-omni-flash"],
          fallback.aiRecommendOmniModel
        ),
        aiRecommendOmniPrompt: text(source.aiRecommendOmniPrompt, fallback.aiRecommendOmniPrompt),
        aiRecommendOmniTemperature: numericText(source.aiRecommendOmniTemperature, fallback.aiRecommendOmniTemperature, 0, 2),
        aiRecommendOmniTopP: numericText(source.aiRecommendOmniTopP, fallback.aiRecommendOmniTopP, 0, 1),
        aiRecommendOmniMaxTokens: numericText(source.aiRecommendOmniMaxTokens, fallback.aiRecommendOmniMaxTokens, 1, 65536),
        aiRecommendOmniMaxCompletionTokens: numericText(source.aiRecommendOmniMaxCompletionTokens, fallback.aiRecommendOmniMaxCompletionTokens, 1, 65536),
        aiRecommendOmniPresencePenalty: numericText(source.aiRecommendOmniPresencePenalty, fallback.aiRecommendOmniPresencePenalty, -2, 2),
        aiRecommendOmniFrequencyPenalty: numericText(source.aiRecommendOmniFrequencyPenalty, fallback.aiRecommendOmniFrequencyPenalty, -2, 2),
        aiRecommendOmniSeed: numericText(source.aiRecommendOmniSeed, fallback.aiRecommendOmniSeed, 0, 2147483647),
        aiRecommendOmniStopSequences: stopSequences(source.aiRecommendOmniStopSequences, fallback.aiRecommendOmniStopSequences),
      };
    }
    const next = {
      ...common,
      aiRecommendListenModel: option(source.aiRecommendListenModel, ["qwen3.5-omni-flash", "qwen3.5-omni-plus"], fallback.aiRecommendListenModel),
      aiRecommendRefineModel: option(source.aiRecommendRefineModel, ["qwen3.5-plus", "qwen3.5-flash"], fallback.aiRecommendRefineModel),
      aiRecommendListenPrompt: text(source.aiRecommendListenPrompt, fallback.aiRecommendListenPrompt),
      aiRecommendRefinePrompt: text(source.aiRecommendRefinePrompt, fallback.aiRecommendRefinePrompt),
      aiRecommendListenTemperature: numericText(source.aiRecommendListenTemperature, fallback.aiRecommendListenTemperature, 0, 2),
      aiRecommendListenTopP: numericText(source.aiRecommendListenTopP, fallback.aiRecommendListenTopP, 0, 1),
      aiRecommendListenMaxTokens: numericText(source.aiRecommendListenMaxTokens, fallback.aiRecommendListenMaxTokens, 1, 65536),
      aiRecommendListenMaxCompletionTokens: numericText(source.aiRecommendListenMaxCompletionTokens, fallback.aiRecommendListenMaxCompletionTokens, 1, 65536),
      aiRecommendListenPresencePenalty: numericText(source.aiRecommendListenPresencePenalty, fallback.aiRecommendListenPresencePenalty, -2, 2),
      aiRecommendListenFrequencyPenalty: numericText(source.aiRecommendListenFrequencyPenalty, fallback.aiRecommendListenFrequencyPenalty, -2, 2),
      aiRecommendListenSeed: numericText(source.aiRecommendListenSeed, fallback.aiRecommendListenSeed, 0, 2147483647),
      aiRecommendListenStopSequences: stopSequences(source.aiRecommendListenStopSequences, fallback.aiRecommendListenStopSequences),
      aiRecommendRefineTemperature: numericText(source.aiRecommendRefineTemperature, fallback.aiRecommendRefineTemperature, 0, 2),
      aiRecommendRefineTopP: numericText(source.aiRecommendRefineTopP, fallback.aiRecommendRefineTopP, 0, 1),
      aiRecommendRefineMaxTokens: numericText(source.aiRecommendRefineMaxTokens, fallback.aiRecommendRefineMaxTokens, 1, 65536),
      aiRecommendRefineMaxCompletionTokens: numericText(source.aiRecommendRefineMaxCompletionTokens, fallback.aiRecommendRefineMaxCompletionTokens, 1, 65536),
      aiRecommendRefinePresencePenalty: numericText(source.aiRecommendRefinePresencePenalty, fallback.aiRecommendRefinePresencePenalty, -2, 2),
      aiRecommendRefineFrequencyPenalty: numericText(source.aiRecommendRefineFrequencyPenalty, fallback.aiRecommendRefineFrequencyPenalty, -2, 2),
      aiRecommendRefineSeed: numericText(source.aiRecommendRefineSeed, fallback.aiRecommendRefineSeed, 0, 2147483647),
      aiRecommendRefineStopSequences: stopSequences(source.aiRecommendRefineStopSequences, fallback.aiRecommendRefineStopSequences),
    };
    if (isJinhua) {
      const omniModel = source.aiRecommendOmniModel || source.aiRecommendListenModel;
      Object.assign(next, {
        aiRecommendOmniModel: option(
          omniModel,
          ["qwen3.5-omni-plus", "qwen3.5-omni-flash"],
          fallback.aiRecommendOmniModel
        ),
        aiRecommendOmniPrompt: text(source.aiRecommendOmniPrompt, fallback.aiRecommendOmniPrompt),
        aiRecommendOmniTemperature: numericText(source.aiRecommendOmniTemperature, fallback.aiRecommendOmniTemperature, 0, 2),
        aiRecommendOmniTopP: numericText(source.aiRecommendOmniTopP, fallback.aiRecommendOmniTopP, 0, 1),
        aiRecommendOmniMaxTokens: numericText(source.aiRecommendOmniMaxTokens, fallback.aiRecommendOmniMaxTokens, 1, 65536),
        aiRecommendOmniMaxCompletionTokens: numericText(source.aiRecommendOmniMaxCompletionTokens, fallback.aiRecommendOmniMaxCompletionTokens, 1, 65536),
        aiRecommendOmniPresencePenalty: numericText(source.aiRecommendOmniPresencePenalty, fallback.aiRecommendOmniPresencePenalty, -2, 2),
        aiRecommendOmniFrequencyPenalty: numericText(source.aiRecommendOmniFrequencyPenalty, fallback.aiRecommendOmniFrequencyPenalty, -2, 2),
        aiRecommendOmniSeed: numericText(source.aiRecommendOmniSeed, fallback.aiRecommendOmniSeed, 0, 2147483647),
        aiRecommendOmniStopSequences: stopSequences(source.aiRecommendOmniStopSequences, fallback.aiRecommendOmniStopSequences),
      });
    }
    return next;
  }

  function normalizeAidp(raw, meta, legacySchema) {
    const defaults = constants.DEFAULT_SETTINGS.platforms.bytedanceAidp;
    const source = object(raw);
    const sourceScripts = object(source.scripts);
    const suzhou = normalizeAidpScript(sourceScripts.suzhouHelper, defaults.scripts.suzhouHelper, meta, legacySchema);
    const jinhua = normalizeAidpScript(sourceScripts.jinhuaHelper, defaults.scripts.jinhuaHelper, meta, legacySchema);
    const taizhou = normalizeAidpScript(sourceScripts.taizhouHelper, defaults.scripts.taizhouHelper, meta, legacySchema);
    const scripts = [suzhou, jinhua, taizhou];
    const allowed = [
      constants.BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID,
      constants.BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID,
      constants.BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID,
    ];
    let activeScriptId = allowed.includes(source.activeScriptId) ? source.activeScriptId : "";
    if (!activeScriptId) {
      activeScriptId = [
        [constants.BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID, sourceScripts.suzhouHelper],
        [constants.BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID, sourceScripts.jinhuaHelper],
        [constants.BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID, sourceScripts.taizhouHelper],
      ].find((entry) => object(entry[1]).enabled === true)?.[0] || scripts.find((script) => script.enabled)?.id || "";
    }
    scripts.forEach((script) => {
      if (activeScriptId && script.id !== activeScriptId) script.enabled = false;
    });
    return {
      enabled: bool(source.enabled, defaults.enabled),
      activeScriptId,
      scripts: { suzhouHelper: suzhou, jinhuaHelper: jinhua, taizhouHelper: taizhou },
    };
  }

  function normalizeMagic(raw) {
    const defaults = constants.DEFAULT_SETTINGS.platforms.magicData;
    const source = object(raw);
    const scriptSource = object(source.scripts?.hangzhouHelper);
    const fallback = defaults.scripts.hangzhouHelper;
    const next = { ...clone(fallback) };
    Object.keys(fallback).forEach((key) => {
      if (key === "shortcuts") next[key] = normalizeShortcutMap(scriptSource[key], {}, false);
      else if (typeof fallback[key] === "boolean") next[key] = bool(scriptSource[key], fallback[key]);
      else if (typeof fallback[key] === "number") next[key] = numberInRange(scriptSource[key], fallback[key], 1000, 60000);
      else if (typeof scriptSource[key] === "string") next[key] = text(scriptSource[key], fallback[key]);
    });
    const legacyModelMode = text(scriptSource.aiReviewModelMode);
    const legacyRecognitionStrategy = text(scriptSource.aiReviewRecognitionStrategy);
    next.aiReviewModelMode = option(
      legacyModelMode === "single" ? "omni_single" : legacyModelMode,
      ["two_stage", "omni_single"],
      fallback.aiReviewModelMode
    );
    next.aiReviewRecognitionStrategy = option(
      legacyRecognitionStrategy === "mandarin_bridge"
        ? "mandarin_to_dialect"
        : legacyRecognitionStrategy,
      ["direct_dialect", "mandarin_to_dialect"],
      fallback.aiReviewRecognitionStrategy
    );
    next.aiReviewEnableThinking = false;
    next.enableThinking = false;
    const activeScriptId = source.activeScriptId === constants.MAGIC_DATA_HANGZHOU_SCRIPT_ID && next.enabled ? constants.MAGIC_DATA_HANGZHOU_SCRIPT_ID : "";
    return { enabled: bool(source.enabled, defaults.enabled), activeScriptId, scripts: { hangzhouHelper: next } };
  }

  function normalizeSettings(input) {
    const source = object(input);
    const legacySchema = Number(source.meta?.schemaVersion || 0);
    const meta = normalizeMeta(source.meta);
    const magicData = normalizeMagic(source.platforms?.magicData);
    return {
      platforms: {
        dataBakerCvpc: normalizeCvpc(source.platforms?.dataBakerCvpc, meta),
        bytedanceAidp: normalizeAidp(source.platforms?.bytedanceAidp, meta, legacySchema),
        magicData,
      },
      meta,
      scriptCenter: { projects: { [constants.MAGIC_DATA_HANGZHOU_SCRIPT_ID]: clone(magicData.scripts.hangzhouHelper) } },
    };
  }

  function chromeGet() {
    return new Promise((resolve, reject) => {
      try { chrome.storage.local.get(STORAGE_KEY, (result) => chrome.runtime?.lastError ? reject(chrome.runtime.lastError) : resolve(result?.[STORAGE_KEY] || {})); }
      catch (error) { reject(error); }
    });
  }
  function chromeSet(settings) {
    return new Promise((resolve, reject) => {
      try { chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => chrome.runtime?.lastError ? reject(chrome.runtime.lastError) : resolve(settings)); }
      catch (error) { reject(error); }
    });
  }
  async function getSettings() { const next = normalizeSettings(await chromeGet()); await chromeSet(next); return clone(next); }
  async function saveSettings(settings) { const next = normalizeSettings(settings); await chromeSet(next); return clone(next); }
  async function patchSettings(patch) { return saveSettings(deepMerge(await getSettings(), patch)); }
  async function setScriptEnabled(scriptId, enabled) {
    const settings = await getSettings();
    const next = enabled === true;
    if (scriptId === constants.DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID) {
      settings.platforms.dataBakerCvpc.enabled = next;
      Object.assign(settings.platforms.dataBakerCvpc.scripts.liuzhouAssistant, { enabled: next, segmentPreviewEnabled: next, aiRecommendEnabled: next });
    } else if (
      scriptId === constants.BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID ||
      scriptId === constants.BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID ||
      scriptId === constants.BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID
    ) {
      const aidpScriptKeys = {
        [constants.BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID]: "suzhouHelper",
        [constants.BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID]: "jinhuaHelper",
        [constants.BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID]: "taizhouHelper",
      };
      const activeScriptKey = aidpScriptKeys[scriptId];
      settings.platforms.bytedanceAidp.enabled = next;
      settings.platforms.bytedanceAidp.activeScriptId = next ? scriptId : "";
      Object.keys(aidpScriptKeys).forEach((id) => {
        settings.platforms.bytedanceAidp.scripts[aidpScriptKeys[id]].enabled = next && id === scriptId;
      });
    } else if (scriptId === constants.MAGIC_DATA_HANGZHOU_SCRIPT_ID) {
      settings.platforms.magicData.enabled = true;
      settings.platforms.magicData.activeScriptId = next ? scriptId : "";
      Object.assign(settings.platforms.magicData.scripts.hangzhouHelper, { enabled: next, aiReviewEnabled: next });
    } else return settings;
    return saveSettings(settings);
  }
  function isChromeExtensionContextAvailable() { try { return Boolean(chrome?.runtime?.id); } catch (_error) { return false; } }
  function isExtensionContextInvalidatedError(error) { return /Extension context invalidated/i.test(String(error?.message || error || "")); }

  globalThis.ASREdgeStorage = {
    getSettings, saveSettings, patchSettings, setScriptEnabled,
    isPlatformEnabled: async (id) => Boolean((await getSettings()).platforms?.[id]?.enabled),
    setDebugMode: async () => getSettings(), clearRuntimeCache: async () => getSettings(),
    resetSettings: async () => saveSettings(constants.DEFAULT_SETTINGS),
    setActiveProject: async () => getSettings(), saveProjectSettings: async () => getSettings(),
    EXTENSION_CONTEXT_INVALIDATED_CODE, isExtensionContextInvalidatedError, isChromeExtensionContextAvailable,
  };
})();
