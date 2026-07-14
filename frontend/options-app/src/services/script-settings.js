import { clone, deepGet } from "@/utils/clone";
import { getConstants } from "@/services/globals";

const SCRIPT_BRANCHES = {
  dataBakerCvpcLiuzhouAssistant: ["platforms", "dataBakerCvpc", "scripts", "liuzhouAssistant"],
  bytedanceAidpSuzhouHelper: ["platforms", "bytedanceAidp", "scripts", "suzhouHelper"],
  bytedanceAidpJinhuaHelper: ["platforms", "bytedanceAidp", "scripts", "jinhuaHelper"],
  bytedanceAidpTaizhouHelper: ["platforms", "bytedanceAidp", "scripts", "taizhouHelper"],
  magicDataHangzhouAssistant: ["platforms", "magicData", "scripts", "hangzhouHelper"],
};

const SCRIPT_IDS = {
  cvpc: "dataBakerCvpcLiuzhouAssistant",
  suzhou: "bytedanceAidpSuzhouHelper",
  jinhua: "bytedanceAidpJinhuaHelper",
  taizhou: "bytedanceAidpTaizhouHelper",
  hangzhou: "magicDataHangzhouAssistant",
};

const FIELD_KIND_PRIORITY = {
  boolean: 0,
  select: 1,
  number: 2,
  text: 2,
  textarea: 3,
  notice: 4,
};

const PLAYBACK_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((value) => ({
  value: String(value),
  label: `${value.toFixed(2)} 倍速`,
}));

const WAVE_ZOOM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => ({
  value: String(value),
  label: String(value),
}));

const CVPC_THRESHOLD_UNIT_OPTIONS = [
  { value: "db", label: "dB" },
  { value: "ratio", label: "%" },
  { value: "value", label: "Val" },
];

const MAGIC_MODE_OPTIONS = [
  { value: "two_stage", label: "双模型：听音模型 + 比较模型" },
  { value: "omni_single", label: "单模型：Omni 单模型" },
];

const MAGIC_RECOGNITION_OPTIONS = [
  { value: "direct_dialect", label: "直接识别方言文本" },
  { value: "mandarin_to_dialect", label: "先识别普通话，再按词表转方言" },
];

const LISTEN_MODEL_OPTIONS = [
  { value: "qwen3.5-omni-flash", label: "qwen3.5-omni-flash" },
  { value: "qwen3.5-omni-plus", label: "qwen3.5-omni-plus" },
];

const CVPC_LISTEN_MODEL_OPTIONS = [
  { value: "qwen3.5-omni-flash", label: "qwen3.5-omni-flash" },
  { value: "qwen3.5-omni-plus", label: "qwen3.5-omni-plus" },
];

const REFINE_MODEL_OPTIONS = [
  { value: "qwen3.5-plus", label: "qwen3.5-plus" },
  { value: "qwen3.5-flash", label: "qwen3.5-flash" },
];

const MAGIC_COMPARE_MODEL_OPTIONS = [
  { value: "qwen3.5-flash", label: "qwen3.5-flash" },
];

function text(value) {
  return String(value || "").trim();
}

function buildPatch(pathParts, value) {
  const root = {};
  let cursor = root;
  pathParts.forEach((part, index) => {
    if (index === pathParts.length - 1) cursor[part] = clone(value);
    else cursor = cursor[part] = {};
  });
  return root;
}

function pathLabel(scriptId) {
  return (SCRIPT_BRANCHES[text(scriptId)] || []).join(".");
}

export function getScriptConfig(settings, scriptId) {
  const path = pathLabel(scriptId);
  return path ? clone(deepGet(settings, path, {}) || {}) : {};
}

export function getScriptJsonPathLabel(scriptId) {
  return pathLabel(scriptId);
}

export async function saveScriptConfig(settingsStore, scriptId, nextConfig) {
  const branch = SCRIPT_BRANCHES[text(scriptId)];
  if (!branch) throw new Error("当前脚本缺少可保存的配置映射。");
  return settingsStore.persistPatch(buildPatch(branch, nextConfig || {}));
}

const CVPC_SHORTCUT_ACTIONS = [
  { key: "valid", label: "当前段设为 Valid" },
  { key: "invalid", label: "当前段设为 Invalid" },
  { key: "fillAllValid", label: "当前音频内未填写段落补为 Valid" },
  { key: "preview", label: "生成当前音频画段建议" },
  { key: "applyPreview", label: "应用当前画段建议" },
  { key: "recommend", label: "生成当前段 AI 推荐" },
  { key: "applyDialectText", label: "填入标注文本" },
  { key: "applyMandarinText", label: "填入普通话顺滑" },
  { key: "applyRecommend", label: "填入当前段 AI 推荐" },
  { key: "labelSpk", label: "<SPK/>" },
  { key: "labelNps", label: "<NPS/>" },
  { key: "labelUm", label: "#um" },
  { key: "labelHmm", label: "#hmm" },
  { key: "labelAh", label: "#ah" },
  { key: "labelEh", label: "#eh" },
  { key: "labelUnintelligible", label: "<Unintelligible>" },
  { key: "labelMeaningless", label: "<Meaningless>" },
  { key: "labelSilence", label: "<Silence>" },
];

const MAGIC_SHORTCUT_ACTIONS = [
  { key: "reviewCurrent", label: "AI 质检当前条" },
  { key: "fillAllAiSuggestions", label: "全部填入 AI 推荐" },
  { key: "toggleAutoRun", label: "开启/关闭全自动" },
  { key: "copySummary", label: "复制 AI 质检摘要" },
  { key: "showRawAiOutput", label: "显示 AI 原始输出" },
  { key: "toggleSpeakerDetail", label: "展开/收起说话人属性详情" },
  { key: "toggleDialectDetail", label: "展开/收起方言内容详情" },
  { key: "toggleMandarinDetail", label: "展开/收起普通话文本详情" },
  { key: "refreshCollection", label: "刷新采集" },
  { key: "resetPanelHeight", label: "重置高度" },
  { key: "save", label: "保存" },
  { key: "submit", label: "提交" },
  { key: "genderMale", label: "性别男" },
  { key: "genderFemale", label: "性别女" },
  { key: "age0To5", label: "年龄 0-5" },
  { key: "age6To12", label: "年龄 6-12" },
  { key: "age13To18", label: "年龄 13-18" },
  { key: "age19To25", label: "年龄 19-25" },
  { key: "age26To36", label: "年龄 26-36" },
  { key: "age37To50", label: "年龄 37-50" },
  { key: "age51To65", label: "年龄 51-65" },
  { key: "age65Plus", label: "年龄 65 以上" },
];

const AIDP_SHORTCUT_FALLBACK = [
  { key: "togglePlayPause", label: "播放/暂停切换" },
  { key: "playSelection", label: "区间播放" },
  { key: "jumpToFirstFrame", label: "回到首帧" },
  { key: "deleteCurrentSelection", label: "删除当前选区" },
  { key: "clearSegments", label: "清空画段" },
  { key: "previewSegments", label: "生成分段建议" },
  { key: "applyPreviewSegments", label: "应用分段建议" },
];

export function getScriptShortcutActions(scriptId) {
  const constants = getConstants();
  if (scriptId === SCRIPT_IDS.cvpc) return clone(CVPC_SHORTCUT_ACTIONS);
  if (scriptId === SCRIPT_IDS.suzhou) {
    return clone(constants.BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS || AIDP_SHORTCUT_FALLBACK);
  }
  if (scriptId === SCRIPT_IDS.jinhua) {
    return clone(
      constants.BYTEDANCE_AIDP_JINHUA_SHORTCUT_ACTIONS ||
        constants.BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS ||
        AIDP_SHORTCUT_FALLBACK
    );
  }
  if (scriptId === SCRIPT_IDS.taizhou) {
    return clone(
      constants.BYTEDANCE_AIDP_TAIZHOU_SHORTCUT_ACTIONS ||
        constants.BYTEDANCE_AIDP_JINHUA_SHORTCUT_ACTIONS ||
        constants.BYTEDANCE_AIDP_SUZHOU_SHORTCUT_ACTIONS ||
        AIDP_SHORTCUT_FALLBACK
    );
  }
  if (scriptId === SCRIPT_IDS.hangzhou) return clone(MAGIC_SHORTCUT_ACTIONS);
  return [];
}

export function normalizeShortcut(shortcut) {
  if (!shortcut || typeof shortcut !== "object") return null;
  const hasKey = typeof shortcut.key === "string" && shortcut.key.length > 0;
  const hasButton = typeof shortcut.button === "number";
  if (!hasKey && !hasButton) return null;
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
  if (!normalized) return "未设置";
  const parts = [];
  if (normalized.ctrl) parts.push("Ctrl");
  if (normalized.alt) parts.push("Alt");
  if (normalized.shift) parts.push("Shift");
  if (normalized.meta) parts.push("Meta");
  parts.push(
    typeof normalized.button === "number"
      ? `Mouse${normalized.button}`
      : normalized.key === " "
        ? "Space"
        : normalized.key
  );
  return parts.join(" + ");
}

export function getShortcutFromKeyboardEvent(event) {
  if (event.key === "Escape") return null;
  if (["Control", "Alt", "Shift", "Meta"].includes(event.key)) return false;
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

function generationNumberFields(prefix) {
  return [
    { suffix: "Temperature", label: "temperature", min: 0, max: 2, step: 0.1 },
    { suffix: "TopP", label: "top_p", min: 0, max: 1, step: 0.05 },
    { suffix: "MaxTokens", label: "max_tokens", min: 1, max: 8192, step: 1 },
    { suffix: "MaxCompletionTokens", label: "max_completion_tokens", min: 1, max: 8192, step: 1 },
    { suffix: "PresencePenalty", label: "presence_penalty", min: -2, max: 2, step: 0.1 },
    { suffix: "FrequencyPenalty", label: "frequency_penalty", min: -2, max: 2, step: 0.1 },
    { suffix: "Seed", label: "seed", min: 0, max: 2147483647, step: 1 },
  ].map((field) => ({
    kind: "number",
    path: `${prefix}${field.suffix}`,
    label: field.label,
    min: field.min,
    max: field.max,
    step: field.step,
    optional: true,
    defaultPath: `${prefix}${field.suffix}`,
    help: "清空后使用后端默认值。",
  }));
}

function stageFields(options) {
  const prefix = options.prefix;
  const fields = [];
  if (options.lexicon) {
    fields.push({
      kind: "boolean",
      path: `${prefix}IncludeLexiconReference`,
      label: "附带词表参考（听音辅助）",
      help: "关闭时仅按当前段音频听写；开启后才附带柳州话词表参考片段。",
    });
  }
  fields.push({
    kind: "select",
    path: `${prefix}Model`,
    label: options.modelLabel,
    optionsKey: options.optionsKey,
    options: options.modelOptions,
    defaultPath: `${prefix}Model`,
    help: options.modelHelp,
  });
  fields.push(...generationNumberFields(prefix));
  fields.push({
    kind: "textarea",
    path: `${prefix}Prompt`,
    label: options.promptLabel,
    rows: 9,
    maxLength: 8000,
    defaultPath: `${prefix}Prompt`,
    help: "留空或内容等于后端默认值时，保存为空 override。",
  });
  fields.push({
    kind: "textarea",
    path: `${prefix}StopSequences`,
    label: "stop sequences",
    rows: 4,
    maxLength: 960,
    defaultPath: `${prefix}StopSequences`,
    help: "每行一个停止序列；清空后使用后端默认值。",
  });
  return fields;
}

function aidpSections(scriptId) {
  const isTaizhou = scriptId === SCRIPT_IDS.taizhou;
  const usesMandarinTranslation =
    scriptId === SCRIPT_IDS.jinhua || scriptId === SCRIPT_IDS.taizhou;
  return [
    {
      key: "basic",
      title: "基础设置",
      help: "配置平台 AI 显隐、分段建议、播放和波形行为。",
      groups: [
        {
          key: "page-behavior",
          title: "基础设置",
          layout: "two",
          fields: [
            {
              kind: "boolean",
              path: "platformAiEnabled",
              label: "隐藏平台 AI 功能",
              adapter: "inverted-boolean",
              help: "开启后隐藏 AIDP 页面原生 AI 区域；关闭后恢复显示。",
            },
            {
              kind: "boolean",
              path: "segmentPreviewAutoApplyEnabled",
              label: "画段后自动应用建议",
              help: "生成画段建议后直接应用到当前音频，不触发保存或提交。",
            },
            {
              kind: "boolean",
              path: "aiRecommendEnabled",
              label: "启用 AI 功能",
              help: "保存为关闭后，右侧 AI 设置面板和运行时 AI 功能一并隐藏。",
            },
            {
              kind: "boolean",
              path: "mergeContiguousSuggestedSegmentsEnabled",
              label: "连续相接画段自动合并",
              help: "相邻建议段首尾相接时合并为连续区间。",
            },
            {
              kind: "select",
              path: "defaultPlaybackRate",
              label: "默认播放倍数",
              options: PLAYBACK_OPTIONS,
              valueType: "number",
            },
            {
              kind: "select",
              path: "fixedWaveZoom",
              label: "固定缩放倍数",
              options: WAVE_ZOOM_OPTIONS,
              valueType: "number",
            },
            {
              kind: "number",
              path: "segmentContextPaddingMs",
              label: "前后静音时长（秒）",
              min: 0,
              max: 0.5,
              step: 0.001,
              adapter: "milliseconds-to-seconds",
            },
            {
              kind: "number",
              path: "segmentSilenceThresholdDbfs",
              label: "静音阈值（dB）",
              min: -80,
              max: -5,
              step: 1,
            },
          ],
        },
      ],
    },
    {
      key: "ai",
      title: "AI 设置",
      help: isTaizhou
        ? "配置单次全模态识别的模型、Prompt 和生成参数。"
        : `配置听音与${usesMandarinTranslation ? "普通话翻译" : "普通话听写"}收口两阶段参数。`,
      groups: [
        {
          key: "ai-base",
          title: "基础设置",
          layout: "two",
          fields: [
            {
              kind: "boolean",
              path: "aiRecommendAutoFillEnabled",
              label: "识别完成后自动填入",
              help: "识别成功后填入当前输入框，不触发平台保存、提交或切题。",
            },
            {
              kind: "boolean",
              path: "aiRecommendEnableThinking",
              label: "思考开关",
              disabled: true,
              defaultValue: false,
              help: "thinking 已固定关闭。",
            },
            {
              kind: "number",
              path: "aiRecommendRequestTimeoutMs",
              label: "请求超时时间（秒）",
              min: 1,
              max: 60,
              step: 0.001,
              adapter: "milliseconds-to-seconds",
            },
          ],
        },
        ...(isTaizhou
          ? [
              {
                key: "omni",
                title: "全模态识别",
                layout: "two",
                fields: stageFields({
                  prefix: "aiRecommendOmni",
                  modelLabel: "全模态模型",
                  promptLabel: "全模态 Prompt",
                  optionsKey: "omniModels",
                  modelOptions: LISTEN_MODEL_OPTIONS,
                  modelHelp: "每段音频仅调用一次 Qwen Omni，同时返回原始听音、最终普通话和风险判断。",
                }),
              },
            ]
          : [
              {
                key: "listen",
                title: "听音",
                layout: "two",
                fields: stageFields({
                  prefix: "aiRecommendListen",
                  modelLabel: "听音模型",
                  promptLabel: "听音 Prompt",
                  optionsKey: "listenModels",
                  modelOptions: LISTEN_MODEL_OPTIONS,
                  modelHelp: "只根据当前段音频生成保守的原始听写草稿。",
                }),
              },
              {
                key: "refine",
                title: usesMandarinTranslation ? "普通话翻译收口" : "普通话听写收口",
                layout: "two",
                fields: stageFields({
                  prefix: "aiRecommendRefine",
                  modelLabel: "收口模型",
                  promptLabel: "收口 Prompt",
                  optionsKey: "refineModels",
                  modelOptions: REFINE_MODEL_OPTIONS,
                  modelHelp: usesMandarinTranslation
                    ? "将听音草稿收口为普通话翻译，不做语义润色。"
                    : "将听音草稿收口为普通话听写稿，不做语义润色。",
                }),
              },
            ]),
      ],
    },
  ];
}

function cvpcSections() {
  return [
    {
      key: "basic",
      title: "基础设置",
      help: "配置画段建议、自动填入、有效性修正与页面提示屏蔽。",
      groups: [
        {
          key: "page-behavior",
          title: "基础设置",
          layout: "two",
          fields: [
            { kind: "boolean", path: "segmentPreviewEnabled", label: "启用画段建议" },
            { kind: "boolean", path: "segmentPreviewAutoApplyEnabled", label: "生成后自动应用当前建议" },
            { kind: "boolean", path: "aiRecommendAutoFillEnabled", label: "识别完成后自动填入" },
            { kind: "boolean", path: "recommendationValidityAutoCorrectEnabled", label: "标签与有效性不一致时直接修正" },
            { kind: "boolean", path: "blockNewTabEditingTips", label: "屏蔽“不能打开新的 Tab”提示" },
            { kind: "boolean", path: "blockPauseStateTips", label: "屏蔽“系统进入暂停状态”提示" },
            {
              kind: "select",
              path: "segmentSilenceThresholdUnit",
              label: "静音阈值单位",
              options: CVPC_THRESHOLD_UNIT_OPTIONS,
              adapter: "cvpc-threshold-unit",
            },
            {
              kind: "number",
              path: "segmentContextPaddingMs",
              label: "前后静音时长（秒）",
              min: 0,
              max: 1.5,
              step: 0.001,
              adapter: "milliseconds-to-seconds",
            },
            {
              kind: "number",
              path: "segmentSilenceThresholdDbfs",
              label: "静音阈值",
              adapter: "cvpc-threshold",
              ranges: {
                db: { min: -80, max: -5, step: 1 },
                ratio: { min: 0.01, max: 56.23, step: 0.01 },
                value: { min: 3, max: 18427, step: 1 },
              },
              help: "可在 dB、百分比和 Val 三种显示单位间切换；内部始终保存为 dBFS。",
            },
          ],
        },
      ],
    },
    {
      key: "ai",
      title: "AI 设置",
      help: "配置柳州话听音与文本修正两阶段模型、Prompt 和生成参数。",
      groups: [
        {
          key: "ai-base",
          title: "基础设置",
          layout: "two",
          fields: [
            { kind: "boolean", path: "aiRecommendEnabled", label: "启用 AI 推荐文本" },
            {
              kind: "boolean",
              path: "aiRecommendEnableThinking",
              label: "思考开关",
              disabled: true,
              defaultValue: false,
              help: "thinking 已固定关闭。",
            },
            {
              kind: "number",
              path: "aiRecommendRequestTimeoutMs",
              label: "请求超时时间（毫秒）",
              min: 1000,
              max: 60000,
              step: 1000,
            },
          ],
        },
        {
          key: "listen",
          title: "听音",
          layout: "two",
          fields: stageFields({
            prefix: "aiRecommendListen",
            modelLabel: "听音模型",
            promptLabel: "听音 Prompt",
            optionsKey: "listenModels",
            modelOptions: CVPC_LISTEN_MODEL_OPTIONS,
            modelHelp: "根据当前段音频生成柳州话听写草稿。",
            lexicon: true,
          }),
        },
        {
          key: "refine",
          title: "文本修正",
          layout: "two",
          fields: stageFields({
            prefix: "aiRecommendRefine",
            modelLabel: "文本修正模型",
            promptLabel: "文本修正 Prompt",
            optionsKey: "refineModels",
            modelOptions: REFINE_MODEL_OPTIONS,
            modelHelp: "结合听音结果、普通话文本和词表修正柳州话文本。",
          }),
        },
      ],
    },
  ];
}

function magicGenerationFields() {
  return [
    ...generationNumberFields("aiReview"),
    {
      kind: "textarea",
      path: "aiReviewListenPrompt",
      label: "听音 Prompt（可选）",
      rows: 9,
      maxLength: 8000,
      defaultPath: "aiReviewListenPrompt",
      help: "内容等于后端默认值时保存为空 override。",
    },
    {
      kind: "textarea",
      path: "aiReviewComparePrompt",
      label: "比较模型 Prompt（可选）",
      rows: 9,
      maxLength: 8000,
      defaultPath: "aiReviewComparePrompt",
      help: "内容等于后端默认值时保存为空 override。",
    },
    {
      kind: "textarea",
      path: "aiReviewStopSequences",
      label: "stop sequences",
      rows: 4,
      maxLength: 960,
      defaultPath: "aiReviewStopSequences",
      help: "每行一个停止序列；清空后使用后端默认值。",
    },
  ];
}

function hangzhouSections() {
  return [
    {
      key: "basic",
      title: "基础设置",
      help: "当前仅保留 AI 质检设置入口，Prompt 和生成参数统一在右侧配置。",
      groups: [
        {
          key: "assistant-note",
          title: "AI 质检助手",
          layout: "single",
          fields: [
            {
              kind: "notice",
              path: "hangzhouAiReviewNotice",
              label: "AI 质检助手",
              lines: [
                "AI 质检模型、Prompt 和生成参数统一放在右侧 AI 设置工作区。",
                "当前页面不会自动保存或自动提交平台数据。",
              ],
            },
          ],
        },
      ],
    },
    {
      key: "ai",
      title: "AI 设置",
      help: "配置杭州话 AI 质检的模型方案、识别策略、Prompt 和生成参数。",
      groups: [
        {
          key: "ai-base",
          title: "基础设置",
          layout: "two",
          fields: [
            { kind: "boolean", path: "aiReviewEnabled", label: "启用 AI 质检助手" },
            {
              kind: "boolean",
              path: "aiReviewEnableThinking",
              label: "思考开关",
              disabled: true,
              defaultValue: false,
              help: "thinking 已固定关闭；杭州话不允许开启 Omni 思考模式。",
            },
            { kind: "boolean", path: "showHeardText", label: "显示 AI 听音文本" },
            { kind: "boolean", path: "showEstimatedIncome", label: "显示预估人民币" },
            {
              kind: "select",
              path: "aiReviewModelMode",
              label: "模型方案",
              optionsKey: "modelModes",
              options: MAGIC_MODE_OPTIONS,
            },
            {
              kind: "select",
              path: "aiReviewRecognitionStrategy",
              label: "识别策略",
              optionsKey: "recognitionStrategies",
              options: MAGIC_RECOGNITION_OPTIONS,
            },
            {
              kind: "select",
              path: "aiReviewListenModel",
              label: "听音模型",
              optionsKey: "listenModels",
              options: LISTEN_MODEL_OPTIONS,
              visibleWhen: { path: "aiReviewModelMode", equals: "two_stage" },
            },
            {
              kind: "select",
              path: "aiReviewCompareModel",
              label: "比较模型",
              optionsKey: "compareModels",
              options: MAGIC_COMPARE_MODEL_OPTIONS,
              visibleWhen: { path: "aiReviewModelMode", equals: "two_stage" },
            },
            {
              kind: "select",
              path: "aiReviewSingleModel",
              label: "单模型",
              optionsKey: "singleModels",
              options: LISTEN_MODEL_OPTIONS,
              visibleWhen: { path: "aiReviewModelMode", equals: "omni_single" },
            },
            {
              kind: "number",
              path: "aiReviewRequestTimeoutMs",
              label: "请求超时时间（毫秒）",
              min: 1000,
              max: 60000,
              step: 1000,
            },
          ],
        },
        {
          key: "prompt-params",
          title: "Prompt 与生成参数",
          layout: "three",
          fields: magicGenerationFields(),
        },
      ],
    },
  ];
}

function fieldHelp(field, sectionTitle) {
  if (field.help) return field.help;
  if (field.kind === "notice") return "";
  return `这里用于配置“${field.label}”；保存后仅作用于当前脚本的${sectionTitle}。`;
}

function resolveFieldOptions(field, defaultsState) {
  const options = field.optionsKey ? defaultsState?.options?.[field.optionsKey] : null;
  return Array.isArray(options) && options.length ? clone(options) : clone(field.options || []);
}

function normalizeFields(fields, sectionTitle, defaultsState) {
  return (Array.isArray(fields) ? fields : [])
    .map((field, index) => ({
      field: {
        ...clone(field),
        options: field.kind === "select" ? resolveFieldOptions(field, defaultsState) : field.options,
        help: fieldHelp(field, sectionTitle),
      },
      index,
      priority: FIELD_KIND_PRIORITY[field?.kind] ?? 9,
    }))
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .map((item) => item.field);
}

function normalizeSections(sections, defaultsState) {
  return (Array.isArray(sections) ? sections : []).map((section) => ({
    ...clone(section),
    groups: (section.groups || []).map((group) => ({
      ...clone(group),
      fields: normalizeFields(group.fields, section.title, defaultsState),
    })),
  }));
}

export function getScriptFieldGroups(scriptId, defaultsState = {}) {
  const normalizedScriptId = text(scriptId);
  if (normalizedScriptId === SCRIPT_IDS.cvpc) {
    return normalizeSections(cvpcSections(), defaultsState);
  }
  if (
    normalizedScriptId === SCRIPT_IDS.suzhou ||
    normalizedScriptId === SCRIPT_IDS.jinhua ||
    normalizedScriptId === SCRIPT_IDS.taizhou
  ) {
    return normalizeSections(aidpSections(normalizedScriptId), defaultsState);
  }
  if (normalizedScriptId === SCRIPT_IDS.hangzhou) {
    return normalizeSections(hangzhouSections(), defaultsState);
  }
  return [];
}

function isAidpScript(scriptId) {
  return (
    scriptId === SCRIPT_IDS.suzhou ||
    scriptId === SCRIPT_IDS.jinhua ||
    scriptId === SCRIPT_IDS.taizhou
  );
}

export function getScriptDetailSections(scriptId, savedConfig, defaultsState = {}) {
  const normalizedScriptId = text(scriptId);
  const sections = getScriptFieldGroups(normalizedScriptId, defaultsState)
    .filter((section) => {
      if (section.key !== "ai") return true;
      if (!isAidpScript(normalizedScriptId)) return true;
      return savedConfig?.aiRecommendEnabled !== false;
    })
    .map((section) => ({
      ...section,
      layout: "single",
      fields: section.groups.flatMap((group) => group.fields || []),
    }));
  const actions = getScriptShortcutActions(normalizedScriptId);
  if (actions.length) {
    sections.push({
      key: "shortcuts",
      title: "快捷键",
      help: "默认全部未设置；录制后点击“保存设置”才会生效。",
      actions,
    });
  }
  return sections;
}
