import { buildBackendUrl, getConstants } from "@/services/globals";
import { clone, deepGet, deepSet } from "@/utils/clone";

const SCRIPT_IDS = {
  cvpc: "dataBakerCvpcLiuzhouAssistant",
  suzhou: "bytedanceAidpSuzhouHelper",
  jinhua: "bytedanceAidpJinhuaHelper",
  taizhou: "bytedanceAidpTaizhouHelper",
  hangzhou: "magicDataHangzhouAssistant",
};

const DEFAULT_ENDPOINTS = {
  [SCRIPT_IDS.cvpc]: "/api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults",
  [SCRIPT_IDS.suzhou]: "/api/bytedance-aidp/suzhou-helper/ai/recommend/defaults",
  [SCRIPT_IDS.jinhua]: "/api/bytedance-aidp/jinhua-helper/ai/recommend/defaults",
  [SCRIPT_IDS.taizhou]: "/api/bytedance-aidp/taizhou-helper/ai/recommend/defaults",
  [SCRIPT_IDS.hangzhou]: "/api/magic-data/hangzhou-helper/ai/defaults",
};

const DEFAULT_BRANCHES = {
  [SCRIPT_IDS.cvpc]: "platforms.dataBakerCvpc.scripts.liuzhouAssistant",
  [SCRIPT_IDS.suzhou]: "platforms.bytedanceAidp.scripts.suzhouHelper",
  [SCRIPT_IDS.jinhua]: "platforms.bytedanceAidp.scripts.jinhuaHelper",
  [SCRIPT_IDS.taizhou]: "platforms.bytedanceAidp.scripts.taizhouHelper",
  [SCRIPT_IDS.hangzhou]: "platforms.magicData.scripts.hangzhouHelper",
};

const STAGE_PARAM_DEFINITIONS = [
  { suffix: "Temperature", apiKey: "temperature", label: "temperature", min: 0, max: 2 },
  { suffix: "TopP", apiKey: "top_p", label: "top_p", min: 0, max: 1 },
  { suffix: "MaxTokens", apiKey: "max_tokens", label: "max_tokens", min: 1, max: 8192, integer: true },
  { suffix: "MaxCompletionTokens", apiKey: "max_completion_tokens", label: "max_completion_tokens", min: 1, max: 8192, integer: true },
  { suffix: "PresencePenalty", apiKey: "presence_penalty", label: "presence_penalty", min: -2, max: 2 },
  { suffix: "FrequencyPenalty", apiKey: "frequency_penalty", label: "frequency_penalty", min: -2, max: 2 },
  { suffix: "Seed", apiKey: "seed", label: "seed", min: 0, max: 2147483647, integer: true },
];

const STATIC_LOCAL_DEFAULTS = {
  [SCRIPT_IDS.cvpc]: {
    config: {
      segmentContextPaddingMs: 200,
      segmentSilenceThresholdDbfs: -27,
      segmentSilenceThresholdUnit: "db",
      aiRecommendRequestTimeoutMs: 60000,
      aiRecommendListenModel: "qwen3.5-omni-flash",
      aiRecommendListenPrompt: "",
      aiRecommendListenIncludeLexiconReference: false,
      aiRecommendRefineModel: "qwen3.5-plus",
      aiRecommendRefinePrompt: "",
    },
    options: {
      listenModels: ["qwen3.5-omni-flash", "qwen3.5-omni-plus"],
      refineModels: ["qwen3.5-plus", "qwen3.5-flash"],
    },
  },
  [SCRIPT_IDS.suzhou]: {
    config: {
      platformAiEnabled: false,
      segmentContextPaddingMs: 300,
      segmentSilenceThresholdDbfs: -31,
      mergeContiguousSuggestedSegmentsEnabled: true,
      segmentPreviewAutoApplyEnabled: true,
      aiRecommendEnabled: true,
      aiRecommendAutoFillEnabled: true,
      aiRecommendRequestTimeoutMs: 60000,
      aiRecommendListenModel: "qwen3.5-omni-flash",
      aiRecommendListenPrompt: "",
      aiRecommendRefineModel: "qwen3.5-plus",
      aiRecommendRefinePrompt: "",
      defaultPlaybackRate: 1,
      fixedWaveZoom: 2,
    },
    options: {
      listenModels: ["qwen3.5-omni-flash", "qwen3.5-omni-plus"],
      refineModels: ["qwen3.5-plus", "qwen3.5-flash"],
    },
  },
  [SCRIPT_IDS.jinhua]: {
    config: {
      platformAiEnabled: false,
      segmentContextPaddingMs: 300,
      segmentSilenceThresholdDbfs: -31,
      mergeContiguousSuggestedSegmentsEnabled: true,
      segmentPreviewAutoApplyEnabled: true,
      aiRecommendEnabled: false,
      aiRecommendAutoFillEnabled: true,
      aiRecommendRequestTimeoutMs: 60000,
      aiRecommendListenModel: "qwen3.5-omni-flash",
      aiRecommendListenPrompt: "",
      aiRecommendRefineModel: "qwen3.5-plus",
      aiRecommendRefinePrompt: "",
      defaultPlaybackRate: 1,
      fixedWaveZoom: 2,
    },
    options: {
      listenModels: ["qwen3.5-omni-flash", "qwen3.5-omni-plus"],
      refineModels: ["qwen3.5-plus", "qwen3.5-flash"],
    },
  },
  [SCRIPT_IDS.taizhou]: {
    config: {
      platformAiEnabled: false,
      segmentContextPaddingMs: 300,
      segmentSilenceThresholdDbfs: -31,
      mergeContiguousSuggestedSegmentsEnabled: true,
      segmentPreviewAutoApplyEnabled: true,
      aiRecommendEnabled: false,
      aiRecommendAutoFillEnabled: true,
      aiRecommendRequestTimeoutMs: 60000,
      aiRecommendOmniModel: "qwen3.5-omni-plus",
      aiRecommendOmniPrompt: "",
      defaultPlaybackRate: 1,
      fixedWaveZoom: 2,
    },
    options: {
      omniModels: ["qwen3.5-omni-plus", "qwen3.5-omni-flash"],
    },
  },
  [SCRIPT_IDS.hangzhou]: {
    config: {
      aiReviewModelMode: "two_stage",
      aiReviewRecognitionStrategy: "direct_dialect",
      aiReviewListenModel: "qwen3.5-omni-flash",
      aiReviewCompareModel: "qwen3.5-flash",
      aiReviewSingleModel: "qwen3.5-omni-flash",
      aiReviewEnableThinking: false,
      aiReviewRequestTimeoutMs: 60000,
      aiReviewListenPrompt: "",
      aiReviewComparePrompt: "",
    },
    options: {
      modelModes: [
        { value: "two_stage", label: "双模型：听音模型 + 比较模型" },
        { value: "omni_single", label: "单模型：Omni 单模型" },
      ],
      recognitionStrategies: [
        { value: "direct_dialect", label: "直接识别方言文本" },
        { value: "mandarin_to_dialect", label: "先识别普通话，再按词表转方言" },
      ],
      listenModels: [
        "qwen3.5-omni-flash",
        "qwen3.5-omni-plus",
        "qwen3.5-omni-flash-2026-03-15",
        "qwen3-omni-flash",
        "qwen3-omni-flash-2025-12-01",
        "qwen3-omni-flash-2025-09-15",
      ],
      compareModels: ["qwen3.5-flash", "qwen3.6-plus", "qwen3.5-plus", "qwen3.6-flash"],
      singleModels: [
        "qwen3.5-omni-flash",
        "qwen3.5-omni-plus",
        "qwen3.5-omni-flash-2026-03-15",
        "qwen3-omni-flash",
        "qwen3-omni-flash-2025-12-01",
        "qwen3-omni-flash-2025-09-15",
      ],
    },
  },
};

function text(value) {
  return String(value ?? "").trim();
}

function isAidpScript(scriptId) {
  return scriptId === SCRIPT_IDS.suzhou || scriptId === SCRIPT_IDS.jinhua || scriptId === SCRIPT_IDS.taizhou;
}

function isPresent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

function toTextValue(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function normalizeStopValue(value) {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n|,/)
      : [];
  return Array.from(new Set(items.map(text).filter(Boolean))).join("\n");
}

function toOptions(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => {
      if (value && typeof value === "object") {
        const optionValue = text(value.value ?? value.id ?? value.model);
        return optionValue
          ? { value: optionValue, label: text(value.label ?? optionValue) || optionValue }
          : null;
      }
      const optionValue = text(value);
      return optionValue ? { value: optionValue, label: optionValue } : null;
    })
    .filter(Boolean);
}

function mergeOptions(base, patch) {
  const result = clone(base || {});
  Object.entries(patch || {}).forEach(([key, value]) => {
    const normalized = toOptions(value);
    if (normalized.length) result[key] = normalized;
  });
  return result;
}

function getLocalDefaults(scriptId) {
  const staticDefaults = clone(STATIC_LOCAL_DEFAULTS[scriptId] || { config: {}, options: {} });
  const sharedDefaults = getConstants().DEFAULT_SETTINGS || {};
  const branch = DEFAULT_BRANCHES[scriptId];
  const sharedConfig = branch ? clone(deepGet(sharedDefaults, branch, {}) || {}) : {};
  return {
    config: { ...staticDefaults.config, ...sharedConfig },
    options: mergeOptions({}, staticDefaults.options),
  };
}

function getStageParams(stage) {
  if (!stage || typeof stage !== "object") return {};
  return stage.params && typeof stage.params === "object" ? stage.params : stage;
}

function mapTwoStagePayload(scriptId, payload, local) {
  const defaults = payload?.defaults || {};
  const listen = defaults?.stages?.listen || {};
  const refine = defaults?.stages?.refine || {};
  const config = {
    ...local.config,
    aiRecommendRequestTimeoutMs: Number(defaults.timeoutMs) || local.config.aiRecommendRequestTimeoutMs,
    aiRecommendListenModel: text(listen.model) || local.config.aiRecommendListenModel,
    aiRecommendListenPrompt: text(listen.prompt),
    aiRecommendRefineModel: text(refine.model) || local.config.aiRecommendRefineModel,
    aiRecommendRefinePrompt: text(refine.prompt),
  };
  if (scriptId === SCRIPT_IDS.cvpc) {
    config.aiRecommendListenIncludeLexiconReference = listen.includeLexiconReference === true;
  }
  [
    ["Listen", getStageParams(listen)],
    ["Refine", getStageParams(refine)],
  ].forEach(([prefix, params]) => {
    STAGE_PARAM_DEFINITIONS.forEach((definition) => {
      config[`aiRecommend${prefix}${definition.suffix}`] = toTextValue(
        params[definition.apiKey]
      );
    });
    config[`aiRecommend${prefix}StopSequences`] = normalizeStopValue(params.stop);
  });
  return {
    config,
    options: mergeOptions(local.options, {
      listenModels: payload?.supportedModels?.listen || listen.modelOptions,
      refineModels: payload?.supportedModels?.refine || refine.modelOptions,
    }),
  };
}

function mapOmniPayload(payload, local) {
  const defaults = payload?.defaults || {};
  const omni = defaults?.omni || {};
  const params = getStageParams(omni);
  const config = {
    ...local.config,
    aiRecommendRequestTimeoutMs:
      Number(defaults.timeoutMs) || local.config.aiRecommendRequestTimeoutMs,
    aiRecommendOmniModel: text(omni.model) || local.config.aiRecommendOmniModel,
    aiRecommendOmniPrompt: text(omni.prompt),
  };
  STAGE_PARAM_DEFINITIONS.forEach((definition) => {
    config[`aiRecommendOmni${definition.suffix}`] = toTextValue(params[definition.apiKey]);
  });
  config.aiRecommendOmniStopSequences = normalizeStopValue(params.stop);
  return {
    config,
    options: mergeOptions(local.options, {
      omniModels: payload?.supportedModels?.omni || omni.modelOptions,
    }),
  };
}

function mapMagicPayload(payload, local) {
  const defaults = payload?.defaults || {};
  const comparePrompt = text(defaults.comparePrompt) || text(defaults.reviewPrompt);
  const config = {
    ...local.config,
    aiReviewModelMode: text(defaults.modelMode) || local.config.aiReviewModelMode,
    aiReviewRecognitionStrategy:
      text(defaults.recognitionStrategy) || local.config.aiReviewRecognitionStrategy,
    aiReviewListenModel: text(defaults.listenModel) || local.config.aiReviewListenModel,
    aiReviewCompareModel: text(defaults.compareModel) || local.config.aiReviewCompareModel,
    aiReviewSingleModel: text(defaults.singleModel) || local.config.aiReviewSingleModel,
    aiReviewEnableThinking: false,
    aiReviewRequestTimeoutMs:
      Number(defaults.timeoutMs) || local.config.aiReviewRequestTimeoutMs,
    aiReviewListenPrompt: text(defaults.listenPrompt),
    aiReviewComparePrompt: comparePrompt,
    aiReviewTemperature: toTextValue(defaults.temperature),
    aiReviewTopP: toTextValue(defaults.top_p),
    aiReviewMaxTokens: toTextValue(defaults.max_tokens),
    aiReviewMaxCompletionTokens: toTextValue(defaults.max_completion_tokens),
    aiReviewPresencePenalty: toTextValue(defaults.presence_penalty),
    aiReviewFrequencyPenalty: toTextValue(defaults.frequency_penalty),
    aiReviewSeed: toTextValue(defaults.seed),
    aiReviewStopSequences: normalizeStopValue(defaults.stop),
  };
  return {
    config,
    options: mergeOptions(local.options, {
      modelModes: defaults.modelModeOptions,
      recognitionStrategies: defaults.recognitionStrategyOptions,
      listenModels: defaults.listenModelOptions,
      compareModels: defaults.compareModelOptions,
      singleModels: defaults.singleModelOptions,
    }),
  };
}

function normalizeError(error) {
  return text(error?.message || error) || "后端默认配置读取失败";
}

export async function loadScriptDefaults(scriptId, settings, fetchImpl = globalThis.fetch) {
  const normalizedScriptId = text(scriptId);
  const local = getLocalDefaults(normalizedScriptId);
  const endpointPath = DEFAULT_ENDPOINTS[normalizedScriptId];
  if (!endpointPath || typeof fetchImpl !== "function") {
    return { status: "fallback", config: local.config, options: local.options, error: "当前脚本没有可用的 defaults 接口。" };
  }
  const endpoint = buildBackendUrl(endpointPath, settings || {});
  try {
    const response = await fetchImpl(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!response?.ok) {
      throw new Error(`defaults 请求失败（HTTP ${response?.status || 0}）`);
    }
    const payload = await response.json();
    if (payload?.success === false) {
      throw new Error(payload?.error?.message || payload?.message || "defaults 返回失败状态");
    }
    const mapped = normalizedScriptId === SCRIPT_IDS.hangzhou
      ? mapMagicPayload(payload, local)
      : normalizedScriptId === SCRIPT_IDS.taizhou
        ? mapOmniPayload(payload, local)
        : mapTwoStagePayload(normalizedScriptId, payload, local);
    return {
      status: "loaded",
      endpoint,
      config: mapped.config,
      options: mapped.options,
      error: "",
    };
  } catch (error) {
    return {
      status: "fallback",
      endpoint,
      config: local.config,
      options: local.options,
      error: normalizeError(error),
    };
  }
}

function effectiveConfig(scriptId, storedConfig, defaults) {
  const local = getLocalDefaults(scriptId).config;
  const backend = defaults?.config && typeof defaults.config === "object" ? defaults.config : {};
  const stored = storedConfig && typeof storedConfig === "object" ? storedConfig : {};
  const result = { ...clone(local), ...clone(backend), ...clone(stored) };
  Object.keys({ ...local, ...backend }).forEach((key) => {
    if (isPresent(stored[key])) result[key] = clone(stored[key]);
    else if (isPresent(backend[key])) result[key] = clone(backend[key]);
    else result[key] = clone(local[key]);
  });
  return result;
}

function normalizeMagicModelMode(value) {
  const normalized = text(value);
  if (normalized === "single") return "omni_single";
  return normalized === "omni_single" ? "omni_single" : "two_stage";
}

function normalizeMagicRecognitionStrategy(value) {
  const normalized = text(value);
  if (normalized === "mandarin_bridge") return "mandarin_to_dialect";
  return normalized === "mandarin_to_dialect"
    ? "mandarin_to_dialect"
    : "direct_dialect";
}

function normalizeThresholdUnit(value) {
  const normalized = text(value).toLowerCase();
  return ["db", "ratio", "value"].includes(normalized) ? normalized : "db";
}

function round(value, precision = 3) {
  const factor = 10 ** precision;
  return Math.round(Number(value) * factor) / factor;
}

function dbfsToDisplay(dbfs, unit) {
  const normalizedDbfs = Number.isFinite(Number(dbfs)) ? Number(dbfs) : -27;
  if (unit === "ratio") return round(100 * 10 ** (normalizedDbfs / 20), 2);
  if (unit === "value") return Math.max(1, Math.round(32768 * 10 ** (normalizedDbfs / 20)));
  return round(normalizedDbfs, 2);
}

function displayToDbfs(value, unit) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return NaN;
  if (unit === "ratio") return 20 * Math.log10(numeric / 100);
  if (unit === "value") return 20 * Math.log10(numeric / 32768);
  return numeric;
}

export function hydrateScriptDraft(scriptId, storedConfig, defaults = {}) {
  const normalizedScriptId = text(scriptId);
  const draft = effectiveConfig(normalizedScriptId, storedConfig, defaults);
  if (isAidpScript(normalizedScriptId)) {
    draft.platformAiEnabled = draft.platformAiEnabled !== true;
    draft.segmentContextPaddingMs = round(Number(draft.segmentContextPaddingMs || 0) / 1000, 3);
    draft.aiRecommendRequestTimeoutMs = round(Number(draft.aiRecommendRequestTimeoutMs || 60000) / 1000, 3);
    draft.aiRecommendEnableThinking = false;
  } else if (normalizedScriptId === SCRIPT_IDS.cvpc) {
    draft.segmentContextPaddingMs = round(Number(draft.segmentContextPaddingMs || 0) / 1000, 3);
    draft.segmentSilenceThresholdUnit = normalizeThresholdUnit(draft.segmentSilenceThresholdUnit);
    draft.segmentSilenceThresholdDbfs = dbfsToDisplay(
      draft.segmentSilenceThresholdDbfs,
      draft.segmentSilenceThresholdUnit
    );
    draft.aiRecommendEnableThinking = false;
  } else if (normalizedScriptId === SCRIPT_IDS.hangzhou) {
    draft.aiReviewModelMode = normalizeMagicModelMode(draft.aiReviewModelMode);
    draft.aiReviewRecognitionStrategy = normalizeMagicRecognitionStrategy(
      draft.aiReviewRecognitionStrategy
    );
    draft.aiReviewEnableThinking = false;
    draft.enableThinking = false;
  }
  return draft;
}

export function applyScriptDraftFieldUpdate(scriptId, draftConfig, field, value) {
  const next = clone(draftConfig || {});
  const path = text(field?.path);
  if (!path) return next;
  if (
    scriptId === SCRIPT_IDS.cvpc &&
    path === "segmentSilenceThresholdUnit"
  ) {
    const previousUnit = normalizeThresholdUnit(next.segmentSilenceThresholdUnit);
    const nextUnit = normalizeThresholdUnit(value);
    const dbfs = displayToDbfs(next.segmentSilenceThresholdDbfs, previousUnit);
    next.segmentSilenceThresholdUnit = nextUnit;
    next.segmentSilenceThresholdDbfs = dbfsToDisplay(dbfs, nextUnit);
    return next;
  }
  deepSet(next, path, value);
  return next;
}

function requiredNumber(value, label, min, max, integer = false) {
  if (value === "" || value === null || value === undefined) {
    throw new Error(`${label}不能为空。`);
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    throw new Error(`${label}必须在 ${min} 到 ${max} 之间。`);
  }
  if (integer && !Number.isInteger(numeric)) {
    throw new Error(`${label}必须是整数。`);
  }
  return numeric;
}

function optionalNumberText(value, definition) {
  if (value === "" || value === null || value === undefined) return "";
  const numeric = requiredNumber(
    value,
    definition.label,
    definition.min,
    definition.max,
    definition.integer
  );
  return String(numeric);
}

function sameValue(left, right, stop = false) {
  return stop
    ? normalizeStopValue(left) === normalizeStopValue(right)
    : text(left) === text(right);
}

function clearDefaultOverrides(result, defaults, definitions) {
  const backend = defaults?.config && typeof defaults.config === "object" ? defaults.config : {};
  definitions.forEach((definition) => {
    const value = result[definition.path];
    if (definition.kind === "number") {
      const normalized = optionalNumberText(value, definition);
      result[definition.path] = sameValue(normalized, backend[definition.path]) ? "" : normalized;
      return;
    }
    const normalized = definition.stop ? normalizeStopValue(value) : text(value);
    result[definition.path] = sameValue(normalized, backend[definition.path], definition.stop)
      ? ""
      : normalized;
  });
}

function buildStageOverrideDefinitions(prefix) {
  return [
    { path: `${prefix}Prompt`, kind: "text" },
    ...STAGE_PARAM_DEFINITIONS.map((definition) => ({
      ...definition,
      path: `${prefix}${definition.suffix}`,
      kind: "number",
    })),
    { path: `${prefix}StopSequences`, kind: "text", stop: true },
  ];
}

const MAGIC_OVERRIDE_DEFINITIONS = [
  { path: "aiReviewListenPrompt", kind: "text" },
  { path: "aiReviewComparePrompt", kind: "text" },
  ...STAGE_PARAM_DEFINITIONS.map((definition) => ({
    ...definition,
    path: `aiReview${definition.suffix}`,
    kind: "number",
  })),
  { path: "aiReviewStopSequences", kind: "text", stop: true },
];

export function serializeScriptDraft(scriptId, draftConfig, defaults = {}) {
  const normalizedScriptId = text(scriptId);
  const result = clone(draftConfig || {});
  if (isAidpScript(normalizedScriptId)) {
    result.platformAiEnabled = result.platformAiEnabled !== true;
    result.segmentContextPaddingMs = Math.round(
      requiredNumber(result.segmentContextPaddingMs, "前后静音时长（秒）", 0, 0.5) * 1000
    );
    result.segmentSilenceThresholdDbfs = requiredNumber(
      result.segmentSilenceThresholdDbfs,
      "静音阈值",
      -80,
      -5
    );
    result.aiRecommendRequestTimeoutMs = Math.round(
      requiredNumber(result.aiRecommendRequestTimeoutMs, "请求超时时间（秒）", 1, 60) * 1000
    );
    result.aiRecommendEnableThinking = false;
    clearDefaultOverrides(
      result,
      defaults,
      normalizedScriptId === SCRIPT_IDS.taizhou
        ? buildStageOverrideDefinitions("aiRecommendOmni")
        : [
            ...buildStageOverrideDefinitions("aiRecommendListen"),
            ...buildStageOverrideDefinitions("aiRecommendRefine"),
          ]
    );
  } else if (normalizedScriptId === SCRIPT_IDS.cvpc) {
    result.segmentContextPaddingMs = Math.round(
      requiredNumber(result.segmentContextPaddingMs, "前后静音时长（秒）", 0, 1.5) * 1000
    );
    const unit = normalizeThresholdUnit(result.segmentSilenceThresholdUnit);
    const unitRange = unit === "ratio" ? [0.01, 56.23] : unit === "value" ? [3, 18427] : [-80, -5];
    requiredNumber(result.segmentSilenceThresholdDbfs, "静音阈值", unitRange[0], unitRange[1]);
    result.segmentSilenceThresholdUnit = unit;
    result.segmentSilenceThresholdDbfs = round(Math.max(
      -80,
      Math.min(-5, displayToDbfs(result.segmentSilenceThresholdDbfs, unit))
    ), 4);
    result.aiRecommendRequestTimeoutMs = Math.round(
      requiredNumber(result.aiRecommendRequestTimeoutMs, "请求超时时间（毫秒）", 1000, 60000)
    );
    result.aiRecommendEnableThinking = false;
    clearDefaultOverrides(result, defaults, [
      ...buildStageOverrideDefinitions("aiRecommendListen"),
      ...buildStageOverrideDefinitions("aiRecommendRefine"),
    ]);
  } else if (normalizedScriptId === SCRIPT_IDS.hangzhou) {
    result.aiReviewModelMode = normalizeMagicModelMode(result.aiReviewModelMode);
    result.aiReviewRecognitionStrategy = normalizeMagicRecognitionStrategy(
      result.aiReviewRecognitionStrategy
    );
    result.aiReviewRequestTimeoutMs = Math.round(
      requiredNumber(result.aiReviewRequestTimeoutMs, "请求超时时间（毫秒）", 1000, 60000)
    );
    result.aiReviewEnableThinking = false;
    result.enableThinking = false;
    clearDefaultOverrides(result, defaults, MAGIC_OVERRIDE_DEFINITIONS);
  }
  return result;
}

export const SCRIPT_DEFAULT_ENDPOINTS = clone(DEFAULT_ENDPOINTS);
