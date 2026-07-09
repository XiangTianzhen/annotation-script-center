import { clone, deepGet } from "@/utils/clone";
import { getConstants } from "@/services/globals";

const SCRIPT_BRANCHES = {
  transcription: {
    type: "project",
    projectId: "transcription",
    jsonPath: "platforms.alibabaLabelx.scriptCenter.projects.transcription.asrConfig",
  },
  judgement: {
    type: "project",
    projectId: "judgement",
    jsonPath: "platforms.alibabaLabelx.scriptCenter.projects.judgement.asrConfig",
  },
  lightwheelViewPanel: {
    type: "patch",
    patchPath: ["platforms", "lightwheel", "scripts", "viewPanel"],
    jsonPath: "platforms.lightwheel.scripts.viewPanel",
  },
  dataBakerRoundOneQuality: {
    type: "patch",
    patchPath: ["platforms", "dataBaker", "scripts", "roundOneQuality"],
    jsonPath: "platforms.dataBaker.scripts.roundOneQuality",
  },
  dataBakerCvpcLiuzhouAssistant: {
    type: "patch",
    patchPath: ["platforms", "dataBakerCvpc", "scripts", "liuzhouAssistant"],
    jsonPath: "platforms.dataBakerCvpc.scripts.liuzhouAssistant",
  },
  bytedanceAidpSuzhouHelper: {
    type: "patch",
    patchPath: ["platforms", "bytedanceAidp", "scripts", "suzhouHelper"],
    jsonPath: "platforms.bytedanceAidp.scripts.suzhouHelper",
  },
  bytedanceAidpJinhuaHelper: {
    type: "patch",
    patchPath: ["platforms", "bytedanceAidp", "scripts", "jinhuaHelper"],
    jsonPath: "platforms.bytedanceAidp.scripts.jinhuaHelper",
  },
  aishellTechMinnanAssistant: {
    type: "patch",
    patchPath: ["platforms", "aishellTech", "scripts", "minnanHelper"],
    jsonPath: "platforms.aishellTech.scripts.minnanHelper",
  },
  aishellTechVietnameseAssistant: {
    type: "patch",
    patchPath: ["platforms", "aishellTech", "scripts", "vietnameseHelper"],
    jsonPath: "platforms.aishellTech.scripts.vietnameseHelper",
  },
  aishellTechThaiAssistant: {
    type: "patch",
    patchPath: ["platforms", "aishellTech", "scripts", "thaiHelper"],
    jsonPath: "platforms.aishellTech.scripts.thaiHelper",
  },
  aishellTechCnEnShortDrama: {
    type: "patch",
    patchPath: ["platforms", "aishellTech", "scripts", "cnEnShortDrama"],
    jsonPath: "platforms.aishellTech.scripts.cnEnShortDrama",
  },
  magicDataAnnotatorAiReview: {
    type: "patch",
    patchPath: ["platforms", "magicData", "scripts", "hakkaHelper"],
    jsonPath: "platforms.magicData.scripts.hakkaHelper",
  },
  magicDataMinnanAssistant: {
    type: "patch",
    patchPath: ["platforms", "magicData", "scripts", "minnanHelper"],
    jsonPath: "platforms.magicData.scripts.minnanHelper",
  },
  magicDataHangzhouAssistant: {
    type: "patch",
    patchPath: ["platforms", "magicData", "scripts", "hangzhouHelper"],
    jsonPath: "platforms.magicData.scripts.hangzhouHelper",
  },
  abakaAiTaskPageCapture: {
    type: "patch",
    patchPath: ["platforms", "abakaAi", "scripts", "taskPageCapture"],
    jsonPath: "platforms.abakaAi.scripts.taskPageCapture",
  },
  haitianUtransAudioDownloadHelper: {
    type: "patch",
    patchPath: ["platforms", "haitianUtrans", "scripts", "audioDownloadHelper"],
    jsonPath: "platforms.haitianUtrans.scripts.audioDownloadHelper",
  },
};

function text(value) {
  return String(value || "").trim();
}

function listToOptions(list) {
  return (Array.isArray(list) ? list : []).map((item) => {
    if (item && typeof item === "object") {
      return {
        value: String(item.value ?? ""),
        label: String(item.label ?? item.value ?? ""),
      };
    }
    return {
      value: String(item ?? ""),
      label: String(item ?? ""),
    };
  });
}

function buildPatchFromPath(pathParts, value) {
  const parts = Array.isArray(pathParts) ? pathParts : [];
  const root = {};
  let current = root;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = clone(value);
      return;
    }
    current[part] = {};
    current = current[part];
  });
  return root;
}

function getBranchDefinition(scriptId) {
  return SCRIPT_BRANCHES[text(scriptId)] || null;
}

function getAishellShortcutActions(constants, scriptId) {
  if (scriptId === "aishellTechVietnameseAssistant") {
    return clone(constants.AISHELL_TECH_VIETNAMESE_SHORTCUT_ACTIONS || []);
  }
  if (scriptId === "aishellTechThaiAssistant") {
    return clone(constants.AISHELL_TECH_THAI_SHORTCUT_ACTIONS || []);
  }
  if (scriptId === "aishellTechCnEnShortDrama") {
    return clone(constants.AISHELL_TECH_CN_EN_SHORT_DRAMA_SHORTCUT_ACTIONS || []);
  }
  return clone(constants.AISHELL_TECH_MINNAN_SHORTCUT_ACTIONS || []);
}

export function getScriptConfig(settings, scriptId) {
  const definition = getBranchDefinition(scriptId);
  if (!definition) {
    return {};
  }
  if (definition.type === "project") {
    return clone(
      deepGet(
        settings,
        `platforms.alibabaLabelx.scriptCenter.projects.${definition.projectId}.asrConfig`,
        {}
      ) || {}
    );
  }
  return clone(deepGet(settings, definition.jsonPath, {}) || {});
}

export function getScriptJsonPathLabel(scriptId) {
  return getBranchDefinition(scriptId)?.jsonPath || "";
}

export async function saveScriptConfig(settingsStore, scriptId, nextConfig) {
  const definition = getBranchDefinition(scriptId);
  if (!definition) {
    throw new Error("当前脚本缺少可保存的配置映射。");
  }
  if (definition.type === "project") {
    return settingsStore.persistProject(definition.projectId, clone(nextConfig || {}));
  }
  return settingsStore.persistPatch(buildPatchFromPath(definition.patchPath, nextConfig || {}));
}

export function getScriptShortcutActions(scriptId) {
  const constants = getConstants();
  if (scriptId === "transcription") {
    return clone(constants.TRANSCRIPTION_SHORTCUT_ACTIONS || []);
  }
  if (scriptId === "judgement") {
    return clone(constants.JUDGEMENT_SHORTCUT_ACTIONS || []);
  }
  if (scriptId === "dataBakerRoundOneQuality") {
    return clone(constants.DATABAKER_ROUND_ONE_SHORTCUT_ACTIONS || []);
  }
  if (scriptId === "aishellTechMinnanAssistant" || scriptId === "aishellTechVietnameseAssistant" || scriptId === "aishellTechThaiAssistant" || scriptId === "aishellTechCnEnShortDrama") {
    return getAishellShortcutActions(constants, scriptId);
  }
  if (scriptId === "abakaAiTaskPageCapture") {
    return clone(constants.ABAKA_AI_TASK21_SHORTCUT_ACTIONS || []);
  }
  if (scriptId === "dataBakerCvpcLiuzhouAssistant") {
    return [
      { key: "valid", label: "当前段设为 Valid" },
      { key: "invalid", label: "当前段设为 Invalid" },
      { key: "fillAllValid", label: "当前音频内未填写段落补为 Valid" },
      { key: "preview", label: "生成当前音频画段建议" },
      { key: "applyPreview", label: "应用当前画段建议（实验）" },
      { key: "recommend", label: "生成当前段 AI 推荐" },
      { key: "applyDialectText", label: "填入标注文本" },
      { key: "applyMandarinText", label: "填入普通话顺滑" },
      { key: "applyRecommend", label: "填入当前段 AI 推荐" },
    ];
  }
  if (scriptId === "bytedanceAidpSuzhouHelper" || scriptId === "bytedanceAidpJinhuaHelper") {
    return clone(constants.BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS || [
      { key: "togglePlayPause", label: "播放/暂停切换" },
      { key: "playSelection", label: "区间播放" },
      { key: "jumpToFirstFrame", label: "回到首帧" },
      { key: "deleteCurrentSelection", label: "删除当前选区" },
      { key: "clearSegments", label: "清空画段" },
      { key: "previewSegments", label: "生成分段建议" },
      { key: "applyPreviewSegments", label: "应用分段建议" },
    ]);
  }
  if (scriptId === "magicDataAnnotatorAiReview" || scriptId === "magicDataMinnanAssistant" || scriptId === "magicDataHangzhouAssistant") {
    return [
      { key: "reviewCurrent", label: "AI 质检当前条" },
      { key: "fillAllAiSuggestions", label: "全部填入 AI 推荐" },
      { key: "toggleAutoRun", label: "开启/关闭全自动" },
      { key: "copySummary", label: "复制 AI 质检摘要" },
      { key: "showRawAiOutput", label: "显示 AI 原始输出" },
      { key: "save", label: "保存" },
      { key: "submit", label: "提交" },
    ];
  }
  return [];
}

export function normalizeShortcut(shortcut) {
  if (!shortcut || typeof shortcut !== "object") {
    return null;
  }
  const hasKey = typeof shortcut.key === "string" && shortcut.key.length > 0;
  const hasButton = typeof shortcut.button === "number";
  if (!hasKey && !hasButton) {
    return null;
  }
  return {
    ctrl: shortcut.ctrl === true,
    alt: shortcut.alt === true,
    shift: shortcut.shift === true,
    meta: shortcut.meta === true,
    key: hasKey ? shortcut.key : null,
    button: hasButton ? shortcut.button : null,
  };
}

export function formatShortcut(shortcut) {
  const normalized = normalizeShortcut(shortcut);
  if (!normalized) {
    return "未设置";
  }
  const parts = [];
  if (normalized.ctrl) {
    parts.push("Ctrl");
  }
  if (normalized.alt) {
    parts.push("Alt");
  }
  if (normalized.shift) {
    parts.push("Shift");
  }
  if (normalized.meta) {
    parts.push("Meta");
  }
  if (typeof normalized.button === "number") {
    parts.push(`Mouse${normalized.button}`);
  } else {
    parts.push(normalized.key === " " ? "Space" : normalized.key);
  }
  return parts.join(" + ");
}

export function getShortcutFromKeyboardEvent(event) {
  if (event.key === "Escape") {
    return null;
  }
  if (["Control", "Alt", "Shift", "Meta"].includes(event.key)) {
    return false;
  }
  return {
    ctrl: event.ctrlKey === true,
    alt: event.altKey === true,
    shift: event.shiftKey === true,
    meta: event.metaKey === true,
    key: event.key === " " ? "Space" : String(event.key),
    button: null,
  };
}

export function getShortcutFromMouseEvent(event) {
  return {
    ctrl: event.ctrlKey === true,
    alt: event.altKey === true,
    shift: event.shiftKey === true,
    meta: event.metaKey === true,
    key: null,
    button: event.button,
  };
}

export function getScriptFieldGroups(scriptId) {
  const constants = getConstants();
  const dataBakerPageSizeOptions = listToOptions(constants.DATABAKER_PAGE_SIZE_OPTIONS || []);
  const dataBakerPipelineOptions = listToOptions(constants.DATABAKER_AI_PIPELINE_MODE_OPTIONS || []);
  const magicModeOptions = listToOptions(constants.MAGIC_DATA_HELPER_MODEL_MODE_OPTIONS || [
    { value: "two_stage", label: "双模型：听音模型 + 比较/转换模型" },
    { value: "omni_single", label: "单模型：Omni 单模型" },
  ]);
  const magicRecognitionOptions = listToOptions(constants.MAGIC_DATA_HELPER_RECOGNITION_STRATEGY_OPTIONS || [
    { value: "direct_dialect", label: "直接识别方言文本" },
    { value: "mandarin_to_dialect", label: "先识别普通话，再按词表转方言" },
  ]);
  const analysisModeOptions = listToOptions(constants.ABAKA_AI_TASK21_AI_ANALYSIS_MODES || [
    { value: "two_stage", label: "双模型方案（默认）" },
    { value: "single_model", label: "单模型方案" },
  ]);
  const compareFamilyOptions = [
    { value: "qwen", label: "Qwen 文本比较" },
    { value: "omni", label: "Omni 听音比较" },
  ];
  const playbackRateOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((item) => ({
    value: String(item),
    label: String(item),
  }));
  const waveZoomOptions = Array.from({ length: 10 }, (_, index) => ({
    value: String(index + 1),
    label: String(index + 1),
  }));

  const schemas = {
    dataBakerRoundOneQuality: [
      {
        title: "识别与页面行为",
        fields: [
          { kind: "boolean", path: "aiRecommendEnabled", label: "启用 AI 推荐文本" },
          { kind: "boolean", path: "autoPageSizeEnabled", label: "自动设置页容量" },
          { kind: "select", path: "defaultPageSize", label: "默认页容量", options: dataBakerPageSizeOptions },
          { kind: "select", path: "aiRecommendPipelineMode", label: "识别方案", options: dataBakerPipelineOptions },
          { kind: "number", path: "aiQualifiedAutofillConcurrency", label: "AI 连续填入并发数", min: 1, max: 50, step: 1 },
          { kind: "number", path: "aiRecommendRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
        ],
      },
      {
        title: "模型与提示词",
        fields: [
          { kind: "text", path: "aiRecommendListenModel", label: "听音模型" },
          { kind: "text", path: "aiRecommendSingleModel", label: "单模型方案模型" },
          { kind: "text", path: "aiRecommendCompareModel", label: "比较模型" },
          { kind: "textarea", path: "aiRecommendListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiRecommendComparePrompt", label: "比较 Prompt" },
        ],
      },
    ],
    dataBakerCvpcLiuzhouAssistant: [
      {
        title: "段落建议与编辑辅助",
        fields: [
          { kind: "boolean", path: "segmentPreviewEnabled", label: "启用分段建议" },
          { kind: "boolean", path: "segmentPreviewAutoApplyEnabled", label: "自动应用分段建议" },
          { kind: "boolean", path: "aiRecommendAutoFillEnabled", label: "允许 AI 结果辅助填入" },
          { kind: "boolean", path: "recommendationValidityAutoCorrectEnabled", label: "自动修正 Valid/Invalid" },
          { kind: "boolean", path: "blockEditingTabTips", label: "屏蔽编辑页提示" },
          { kind: "number", path: "segmentContextPaddingMs", label: "上下文补白（毫秒）", min: 0, max: 5000, step: 100 },
          { kind: "number", path: "segmentSilenceThresholdDbfs", label: "静音阈值", min: -90, max: 0, step: 1 },
        ],
      },
      {
        title: "AI 配置",
        fields: [
          { kind: "boolean", path: "aiRecommendEnabled", label: "启用当前段 AI 推荐" },
          { kind: "number", path: "aiRecommendRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "text", path: "aiRecommendListenModel", label: "听音模型" },
          { kind: "text", path: "aiRecommendRefineModel", label: "修正模型" },
          { kind: "textarea", path: "aiRecommendListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiRecommendRefinePrompt", label: "修正 Prompt" },
        ],
      },
    ],
    bytedanceAidpSuzhouHelper: [
      {
        title: "AIDP 页面行为",
        fields: [
          { kind: "boolean", path: "platformAiEnabled", label: "平台 AI 总开关" },
          { kind: "boolean", path: "mergeContiguousSuggestedSegmentsEnabled", label: "合并连续建议段落" },
          { kind: "boolean", path: "segmentPreviewAutoApplyEnabled", label: "自动应用分段建议" },
          { kind: "boolean", path: "aiRecommendEnabled", label: "启用 AI 结果" },
          { kind: "boolean", path: "aiRecommendAutoFillEnabled", label: "允许 AI 结果辅助填入" },
          { kind: "number", path: "segmentContextPaddingMs", label: "上下文补白（毫秒）", min: 0, max: 5000, step: 100 },
          { kind: "number", path: "segmentSilenceThresholdDbfs", label: "静音阈值", min: -90, max: 0, step: 1 },
          { kind: "select", path: "defaultPlaybackRate", label: "默认播放倍速", options: playbackRateOptions },
          { kind: "select", path: "fixedWaveZoom", label: "固定缩放倍数", options: waveZoomOptions },
        ],
      },
      {
        title: "AIDP AI 配置",
        fields: [
          { kind: "number", path: "aiRecommendRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "text", path: "aiRecommendListenModel", label: "听音模型" },
          { kind: "text", path: "aiRecommendRefineModel", label: "修正模型" },
          { kind: "textarea", path: "aiRecommendListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiRecommendRefinePrompt", label: "修正 Prompt" },
        ],
      },
    ],
    bytedanceAidpJinhuaHelper: [
      {
        title: "AIDP 页面行为",
        fields: [
          { kind: "boolean", path: "platformAiEnabled", label: "平台 AI 总开关" },
          { kind: "boolean", path: "mergeContiguousSuggestedSegmentsEnabled", label: "合并连续建议段落" },
          { kind: "boolean", path: "segmentPreviewAutoApplyEnabled", label: "自动应用分段建议" },
          { kind: "boolean", path: "aiRecommendEnabled", label: "启用 AI 结果" },
          { kind: "boolean", path: "aiRecommendAutoFillEnabled", label: "允许 AI 结果辅助填入" },
          { kind: "number", path: "segmentContextPaddingMs", label: "上下文补白（毫秒）", min: 0, max: 5000, step: 100 },
          { kind: "number", path: "segmentSilenceThresholdDbfs", label: "静音阈值", min: -90, max: 0, step: 1 },
          { kind: "select", path: "defaultPlaybackRate", label: "默认播放倍速", options: playbackRateOptions },
          { kind: "select", path: "fixedWaveZoom", label: "固定缩放倍数", options: waveZoomOptions },
        ],
      },
      {
        title: "AIDP AI 配置",
        fields: [
          { kind: "number", path: "aiRecommendRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "text", path: "aiRecommendListenModel", label: "听音模型" },
          { kind: "text", path: "aiRecommendRefineModel", label: "修正模型" },
          { kind: "textarea", path: "aiRecommendListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiRecommendRefinePrompt", label: "修正 Prompt" },
        ],
      },
    ],
    aishellTechMinnanAssistant: [
      {
        title: "Aishell 行为与并发",
        fields: [
          { kind: "boolean", path: "aiRecommendEnabled", label: "启用 AI 推荐文本" },
          { kind: "number", path: "aiQualifiedAutofillConcurrency", label: "批量并发数", min: 1, max: 50, step: 1 },
          { kind: "number", path: "aiRecommendRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "select", path: "aiRecommendCompareFamily", label: "比较策略", options: compareFamilyOptions },
        ],
      },
      {
        title: "Aishell 模型",
        fields: [
          { kind: "text", path: "aiRecommendConvertModel", label: "转换模型" },
          { kind: "text", path: "aiRecommendListenModel", label: "听音模型" },
          { kind: "text", path: "aiRecommendCompareModel", label: "比较模型" },
          { kind: "textarea", path: "aiRecommendConvertPrompt", label: "转换 Prompt" },
          { kind: "textarea", path: "aiRecommendListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiRecommendCompareQwenPrompt", label: "Qwen 比较 Prompt" },
        ],
      },
    ],
    aishellTechVietnameseAssistant: [
      {
        title: "越南语助手",
        fields: [
          { kind: "boolean", path: "aiRecommendEnabled", label: "启用 AI 推荐文本" },
          { kind: "number", path: "aiQualifiedAutofillConcurrency", label: "批量并发数", min: 1, max: 50, step: 1 },
          { kind: "number", path: "aiRecommendRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "text", path: "aiRecommendListenModel", label: "识别模型" },
          { kind: "textarea", path: "aiRecommendListenPrompt", label: "识别 Prompt" },
        ],
      },
    ],
    aishellTechThaiAssistant: [
      {
        title: "泰语助手",
        fields: [
          { kind: "boolean", path: "aiRecommendEnabled", label: "启用 AI 推荐文本" },
          { kind: "number", path: "aiQualifiedAutofillConcurrency", label: "批量并发数", min: 1, max: 50, step: 1 },
          { kind: "number", path: "aiRecommendRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "text", path: "aiRecommendListenModel", label: "识别模型" },
          { kind: "textarea", path: "aiRecommendListenPrompt", label: "识别 Prompt" },
        ],
      },
    ],
    magicDataAnnotatorAiReview: [
      {
        title: "Magic Data AI 质检",
        fields: [
          { kind: "boolean", path: "aiReviewEnabled", label: "启用 AI 质检助手" },
          { kind: "select", path: "aiReviewModelMode", label: "模型方案", options: magicModeOptions },
          { kind: "select", path: "aiReviewRecognitionStrategy", label: "识别策略", options: magicRecognitionOptions },
          { kind: "boolean", path: "showHeardText", label: "显示听音文本" },
          { kind: "boolean", path: "showEstimatedIncome", label: "显示预估人民币" },
          { kind: "number", path: "aiReviewRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "text", path: "aiReviewListenModel", label: "听音模型" },
          { kind: "text", path: "aiReviewCompareModel", label: "比较模型" },
          { kind: "textarea", path: "aiReviewListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiReviewComparePrompt", label: "比较 Prompt" },
        ],
      },
    ],
    magicDataMinnanAssistant: [
      {
        title: "Magic Data AI 质检",
        fields: [
          { kind: "boolean", path: "aiReviewEnabled", label: "启用 AI 质检助手" },
          { kind: "select", path: "aiReviewModelMode", label: "模型方案", options: magicModeOptions },
          { kind: "select", path: "aiReviewRecognitionStrategy", label: "识别策略", options: magicRecognitionOptions },
          { kind: "boolean", path: "showHeardText", label: "显示听音文本" },
          { kind: "boolean", path: "showEstimatedIncome", label: "显示预估人民币" },
          { kind: "number", path: "aiReviewRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "text", path: "aiReviewListenModel", label: "听音模型" },
          { kind: "text", path: "aiReviewCompareModel", label: "比较模型" },
          { kind: "textarea", path: "aiReviewListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiReviewComparePrompt", label: "比较 Prompt" },
        ],
      },
    ],
    magicDataHangzhouAssistant: [
      {
        title: "Magic Data AI 质检",
        fields: [
          { kind: "boolean", path: "aiReviewEnabled", label: "启用 AI 质检助手" },
          { kind: "select", path: "aiReviewModelMode", label: "模型方案", options: magicModeOptions },
          { kind: "select", path: "aiReviewRecognitionStrategy", label: "识别策略", options: magicRecognitionOptions },
          { kind: "boolean", path: "showHeardText", label: "显示听音文本" },
          { kind: "boolean", path: "showEstimatedIncome", label: "显示预估人民币" },
          { kind: "number", path: "aiReviewRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "text", path: "aiReviewListenModel", label: "听音模型" },
          { kind: "text", path: "aiReviewCompareModel", label: "比较模型" },
          { kind: "textarea", path: "aiReviewListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiReviewComparePrompt", label: "比较 Prompt" },
        ],
      },
    ],
    abakaAiTaskPageCapture: [
      {
        title: "Task21 AI 辅助",
        fields: [
          { kind: "boolean", path: "autoSelectSpecifyOnSameFontTrue", label: "same_font:true 自动选择 specify" },
          { kind: "select", path: "aiAnalysisMode", label: "分析方案", options: analysisModeOptions },
          { kind: "boolean", path: "aiOcrEnabled", label: "启用 OCR 模型" },
          { kind: "boolean", path: "aiEnableThinking", label: "允许 thinking" },
          { kind: "number", path: "aiRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 60000, step: 1000 },
          { kind: "text", path: "aiVisionModel", label: "视觉模型" },
          { kind: "text", path: "aiOcrModel", label: "OCR 模型" },
          { kind: "text", path: "aiReasoningModel", label: "推理模型" },
          { kind: "text", path: "aiSingleModel", label: "单模型方案模型" },
        ],
      },
    ],
  };

  return clone(schemas[text(scriptId)] || []);
}
