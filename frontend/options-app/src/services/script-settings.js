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

const DETAIL_SECTION_TITLE_MAP = {
  basic: "基础设置",
  ai: "AI 设置",
  shortcuts: "快捷键",
};

const DETAIL_SECTION_HELP_MAP = {
  bytedanceAidpSuzhouHelper: {
    basic: "当前支持分段建议、波形控件、快捷键和平台 AI 显隐。",
    ai: "调试听音、修正与超时参数，仅影响当前脚本 AI 辅助链路。",
    shortcuts: "默认全部未设置；录制时按 Esc 取消，输入框聚焦时不会触发。",
  },
  bytedanceAidpJinhuaHelper: {
    basic: "当前支持分段建议、波形控件、快捷键和平台 AI 显隐。",
    ai: "调试听音、修正与超时参数，仅影响当前脚本 AI 辅助链路。",
    shortcuts: "默认全部未设置；录制时按 Esc 取消，输入框聚焦时不会触发。",
  },
  transcription: {
    basic: "保留旧版转写页的常用音频行为和页面辅助能力。",
    ai: "继续沿用旧版当前题 AI 推荐的模型、超时和提示词设置。",
    shortcuts: "默认全部未设置；录制成功后保存即可生效。",
  },
  judgement: {
    basic: "保留旧版快判页的播放、列表密度和差异展示能力。",
    ai: "继续沿用旧版 AI 分析模型、超时和提示词设置。",
    shortcuts: "默认全部未设置；录制成功后保存即可生效。",
  },
};

const AI_GROUP_TITLE_PATTERN = /(AI 配置|AI 分析|AI 推荐|模型|Prompt|Task21)/;

const FIELD_KIND_PRIORITY = {
  boolean: 0,
  select: 1,
  number: 2,
  text: 2,
  color: 2,
  textarea: 3,
  notice: 4,
};

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

function isProjectScriptId(scriptId) {
  return text(scriptId) === "transcription" || text(scriptId) === "judgement";
}

function buildProjectShortcutDraft(scriptId, rawConfig) {
  const source = rawConfig && typeof rawConfig === "object" ? rawConfig : {};
  const shortcuts = {};
  getScriptShortcutActions(scriptId).forEach((action) => {
    const key = text(action?.key);
    if (!key) {
      return;
    }
    shortcuts[key] = clone(source[key] ?? null);
  });
  return shortcuts;
}

function normalizeProjectScriptConfig(scriptId, rawConfig) {
  const nextConfig = clone(rawConfig || {}) || {};
  const shortcutKeys = new Set();
  getScriptShortcutActions(scriptId).forEach((action) => {
    const key = text(action?.key);
    if (!key) {
      return;
    }
    shortcutKeys.add(key);
  });
  nextConfig.shortcuts = buildProjectShortcutDraft(scriptId, rawConfig);
  shortcutKeys.forEach((key) => {
    delete nextConfig[key];
  });
  return nextConfig;
}

function serializeProjectScriptConfig(scriptId, nextConfig) {
  const source = clone(nextConfig || {}) || {};
  const shortcuts = source.shortcuts && typeof source.shortcuts === "object" ? source.shortcuts : {};
  delete source.shortcuts;
  getScriptShortcutActions(scriptId).forEach((action) => {
    const key = text(action?.key);
    if (!key) {
      return;
    }
    source[key] = clone(shortcuts[key] ?? null);
  });
  return source;
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
    const projectConfig = clone(
      deepGet(
        settings,
        `platforms.alibabaLabelx.scriptCenter.projects.${definition.projectId}.asrConfig`,
        {}
      ) || {}
    );
    return isProjectScriptId(scriptId)
      ? normalizeProjectScriptConfig(scriptId, projectConfig)
      : projectConfig;
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
    const payload = isProjectScriptId(scriptId)
      ? serializeProjectScriptConfig(scriptId, nextConfig)
      : clone(nextConfig || {});
    return settingsStore.persistProject(definition.projectId, payload);
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

function normalizeFieldOrder(fields) {
  return (Array.isArray(fields) ? fields : [])
    .map((field, index) => ({
      field,
      index,
      priority: FIELD_KIND_PRIORITY[field?.kind] ?? 9,
    }))
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return left.index - right.index;
    })
    .map((item) => clone(item.field));
}

function isAiGroup(group) {
  const title = text(group?.title);
  if (!title) {
    return false;
  }
  if (/页面行为|行为与并发|基础设置|脚本说明|段落建议|识别与页面行为/.test(title)) {
    return false;
  }
  return AI_GROUP_TITLE_PATTERN.test(title);
}

function resolveDetailSectionHelp(scriptId, sectionKey, fallbackDescription) {
  return (
    DETAIL_SECTION_HELP_MAP[scriptId]?.[sectionKey] ||
    text(fallbackDescription)
  );
}

function resolveDetailSectionLayout(fields) {
  const normalizedFields = Array.isArray(fields) ? fields : [];
  if (
    normalizedFields.length <= 1 ||
    normalizedFields.every((field) => field?.kind === "notice")
  ) {
    return "single";
  }
  return "two";
}

function shouldShowAiDetailSection(scriptId, config, fields) {
  if (!Array.isArray(fields) || fields.length <= 0) {
    return false;
  }
  if (scriptId === "bytedanceAidpJinhuaHelper") {
    return Boolean(config?.aiRecommendEnabled);
  }
  return true;
}

export function getScriptDetailSections(scriptId, config) {
  const groups = getScriptFieldGroups(scriptId);
  if (!Array.isArray(groups) || groups.length <= 0) {
    return [];
  }

  const basicFields = [];
  const aiFields = [];
  let basicDescription = "";
  let aiDescription = "";

  groups.forEach((group) => {
    if (isAiGroup(group)) {
      aiFields.push(...(group.fields || []));
      if (!aiDescription) {
        aiDescription = text(group.description);
      }
      return;
    }
    basicFields.push(...(group.fields || []));
    if (!basicDescription) {
      basicDescription = text(group.description);
    }
  });

  const sections = [];

  if (basicFields.length > 0) {
    sections.push({
      key: "basic",
      title: DETAIL_SECTION_TITLE_MAP.basic,
      help: resolveDetailSectionHelp(scriptId, "basic", basicDescription),
      layout: resolveDetailSectionLayout(basicFields),
      fields: normalizeFieldOrder(basicFields),
    });
  }

  if (shouldShowAiDetailSection(scriptId, config, aiFields)) {
    sections.push({
      key: "ai",
      title: DETAIL_SECTION_TITLE_MAP.ai,
      help: resolveDetailSectionHelp(scriptId, "ai", aiDescription),
      layout: resolveDetailSectionLayout(aiFields),
      fields: normalizeFieldOrder(aiFields),
    });
  }

  const shortcutActions = getScriptShortcutActions(scriptId);
  if (shortcutActions.length > 0) {
    sections.push({
      key: "shortcuts",
      title: DETAIL_SECTION_TITLE_MAP.shortcuts,
      help: resolveDetailSectionHelp(scriptId, "shortcuts", ""),
      actions: clone(shortcutActions),
    });
  }

  return sections;
}

export function getScriptFieldGroups(scriptId) {
  const constants = getConstants();
  const dataBakerPageSizeOptions = listToOptions(constants.DATABAKER_PAGE_SIZE_OPTIONS || []);
  const dataBakerPipelineOptions = listToOptions(constants.DATABAKER_AI_PIPELINE_MODE_OPTIONS || []);
  const transcriptionRateStepOptions = [
    { value: "0.1", label: "0.1" },
    { value: "0.25", label: "0.25" },
    { value: "0.5", label: "0.5" },
    { value: "1", label: "1" },
  ];
  const transcriptionSeekStepOptions = [
    { value: "0.5", label: "0.5 秒" },
    { value: "1", label: "1 秒" },
    { value: "2", label: "2 秒" },
    { value: "3", label: "3 秒" },
    { value: "5", label: "5 秒" },
  ];
  const judgementSeekStepOptions = [
    { value: "0.1", label: "0.1 秒" },
    { value: "0.25", label: "0.25 秒" },
    { value: "0.5", label: "0.5 秒" },
    { value: "1", label: "1 秒" },
  ];
  const judgementItemsPerPageOptions = [
    "1 条/页",
    "2 条/页",
    "3 条/页",
    "4 条/页",
    "5 条/页",
    "10 条/页",
    "20 条/页",
    "30 条/页",
    "40 条/页",
    "50 条/页",
    "400 条/页",
  ].map((item) => ({
    value: item,
    label: item,
  }));
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
    transcription: [
      {
        title: "基础设置",
        description: "保留旧版转写页的常用音频行为和页面辅助能力。",
        layout: "two",
        fields: [
          { kind: "boolean", path: "autoPlay", label: "启用自动播放", help: "进入当前题时尝试自动播放当前音频。" },
          { kind: "number", path: "volumeValue", label: "默认音量（0~1000%）", min: 0, max: 1000, step: 10, help: "重置音量和新音频默认使用此值。" },
          { kind: "number", path: "playbackRateValue", label: "默认倍速", min: 0.25, max: 5, step: 0.05, help: "新音频和重置倍速时使用该值。" },
          { kind: "number", path: "resetRateValue", label: "重置倍速", min: 0.25, max: 5, step: 0.05, help: "点击“重置倍速”时使用该值。" },
          { kind: "select", path: "rateStepValue", label: "倍速步进", options: transcriptionRateStepOptions, help: "用于“提高倍速 / 降低倍速”。" },
          { kind: "select", path: "seekStepSeconds", label: "前进 / 后退步长", options: transcriptionSeekStepOptions, help: "用于当前音频前进、后退。" },
          { kind: "boolean", path: "defaultValid", label: "默认有效行为", help: "仅影响当前题动作。" },
          { kind: "boolean", path: "fillOnValid", label: "标有效时自动填入当前题文本" },
          { kind: "boolean", path: "clearOnInvalid", label: "标无效时清空当前题文本" },
        ],
      },
      {
        title: "AI 推荐",
        description: "保留旧版转写当前题 AI 推荐所需的模型与提示词映射。",
        layout: "two",
        fields: [
          { kind: "number", path: "aiSuggestionRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 180000, step: 1000 },
          { kind: "text", path: "aiSuggestionListenModel", label: "听音模型" },
          { kind: "text", path: "aiSuggestionCompareModel", label: "比较模型" },
          { kind: "textarea", path: "aiSuggestionListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiSuggestionComparePrompt", label: "比较 Prompt" },
        ],
      },
    ],
    judgement: [
      {
        title: "基础设置",
        description: "管理快判的播放、页面密度和差异展示规则。",
        layout: "two",
        fields: [
          { kind: "number", path: "volumeValue", label: "默认音量（0~1000%）", min: 0, max: 1000, step: 50 },
          { kind: "number", path: "resetRateValue", label: "默认倍速", min: 0.25, max: 5, step: 0.05 },
          { kind: "select", path: "rateStepValue", label: "倍速步进", options: transcriptionRateStepOptions },
          { kind: "select", path: "seekStepSeconds", label: "前进 / 后退步长", options: judgementSeekStepOptions },
          { kind: "select", path: "itemsPerPage", label: "默认每页条数", options: judgementItemsPerPageOptions },
          { kind: "boolean", path: "autoPlay", label: "启用自动播放" },
          { kind: "boolean", path: "asrDiffViewEnabled", label: "启用 ASR 差异高亮" },
          { kind: "color", path: "asrDiffColors.changeBackground", label: "替换 / 不同字高亮" },
          { kind: "color", path: "asrDiffColors.gapBackground", label: "缺字 / 多字高亮" },
          { kind: "color", path: "asrDiffColors.punctuationBackground", label: "标点差异高亮" },
          { kind: "boolean", path: "compactCardEnabled", label: "紧凑卡片模式" },
          { kind: "boolean", path: "thunderQuestionEnabled", label: "启用雷题提示" },
          { kind: "boolean", path: "autoAdvanceAfterChoice", label: "选择后自动下一题" },
        ],
      },
      {
        title: "AI 分析",
        description: "保留快判链路的模型、提示词与请求超时映射。",
        layout: "two",
        fields: [
          { kind: "number", path: "aiSuggestionRequestTimeoutMs", label: "请求超时（毫秒）", min: 1000, max: 180000, step: 1000 },
          { kind: "text", path: "aiSuggestionListenModel", label: "听音模型" },
          { kind: "text", path: "aiSuggestionCompareModel", label: "比较模型" },
          { kind: "textarea", path: "aiSuggestionListenPrompt", label: "听音 Prompt" },
          { kind: "textarea", path: "aiSuggestionComparePrompt", label: "比较 Prompt" },
        ],
      },
    ],
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
    aishellTechCnEnShortDrama: [
      {
        title: "脚本说明",
        description: "第一版只接入当前媒体信息面板，不提供 AI、自动保存或自动提交能力。",
        layout: "single",
        fields: [
          {
            kind: "notice",
            label: "中英短剧脚本",
            lines: [
              "启用后会在页面右侧标注表单区域顶部显示只读“当前媒体信息”面板。",
              "当前版本无额外设置项，也不会自动写回或自动提交。",
            ],
          },
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
    haitianUtransAudioDownloadHelper: [
      {
        title: "基础设置",
        description: "当前只控制 uTrans 任务详情页是否显示悬浮下载按钮。",
        layout: "single",
        fields: [
          {
            kind: "boolean",
            path: "enabled",
            label: "开启悬浮窗下载功能",
            help: "开启后，在 uTrans 任务详情页显示“下载当前音频”悬浮窗；关闭后不显示。",
          },
        ],
      },
    ],
  };

  return clone(schemas[text(scriptId)] || []);
}
