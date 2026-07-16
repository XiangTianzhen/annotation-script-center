"use strict";

const {
  requestOmniInputAudio,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const {
  normalizeUsage,
} = require("../../../backend/ai/model-response-utils");
const {
  buildPricingAvailabilitySummary,
  estimateProjectCost,
} = require("../../../backend/ai/model-pricing");

const SCRIPT_ID = "bytedanceAidpJinhuaHelper";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_OMNI_MODEL = "qwen3.5-omni-plus";
const SUPPORTED_OMNI_MODELS = ["qwen3.5-omni-plus", "qwen3.5-omni-flash"];
const DEFAULT_OMNI_PARAMS = {
  temperature: 0.1,
  top_p: 0.8,
  max_tokens: 1200,
  max_completion_tokens: "",
  presence_penalty: "",
  frequency_penalty: "",
  seed: "",
  stop: "",
};
const DEFAULT_OMNI_PROMPT = [
  "## 1. 角色设定",
  "",
  "你是一位精通**金华地区方言**（吴语金衢片）与普通话转换的语言专家。你具备以下核心能力：",
  "- **多方言辨识能力**：精准区分金华话与其他吴语片区及非吴语方言。",
  "- **深层语境逻辑推理**：结合上下文、地域背景和说话人情绪进行深度推断。",
  "- **修辞隐喻解析**：准确识别方言特有的比喻、夸张、反讽及网络梗。",
  "- **语义忠实转写能力**：核心使命是将方言音频转化为普通话表述版本。",
  "",
  "---",
  "",
  "## 2. 核心转写原则（最高优先级）",
  "",
  "**默认规则（严格执行）：**",
  "- 以说话人实际发出的内容和音节为依据进行转写。",
  "- **禁止**因为普通话语法需要完整、句子更流畅或语境清楚，而凭空添加任何词语（尤其是介词、连词、助词等）。",
  "- 示例：“我金华上班”必须保留为 **“我金华上班”**，不能添加“在”。",
  "",
  "**唯一例外（允许语义转换）：**",
  "- 当遇到**方言特有的词汇、缩略表达或惯用语**时，如果其真实含义在普通话中需要用不同结构或更多字才能准确表达（即“说话人的意思和发音是‘xx’，但普通话要表述为‘xxxx’”），则可以进行语义层面的转换，不再严格逐音节对应。",
  "- 判断主要依靠语境识别。",
  "- 示例：",
  "  - “蛮好”“卡好” → “非常好”“很好”",
  "  - “一记睏了” → “刚睡着”",
  "  - “空头经实足” → “空话连篇却说得一本正经”",
  "  - “格个” → “这个”",
  "",
  "**其他严格要求：**",
  "- 说话人所有的重复必须**全部保留**（不漏写任何一个字）。",
  "- 语气词、填充词（啊、呃、这个、那个、好好好、解解解等）也必须**全部保留**。",
  "- 严禁添加原文未出现的新信息或改变原意。",
  "",
  "---",
  "",
  "## 3. 核心任务流程",
  "",
  "### 第一步：参数解析与方言地域识别",
  "- **分析输入**：检测发音特征、词汇习惯及语法结构。",
  "- **指令解析**：",
  "    - `[强制翻译]`：无视方言归属，强制执行翻译。",
  "    - `[语气模式：XX]`：指定输出风格（默认：中性；可选：幽默、正式）。",
  "    - `[参考字幕]`：若有字幕，作为参考，但**必须以音频发音逻辑为最终裁决依据**。",
  "",
  "#### 情况 A：未发送强制指令",
  "- **若确认为金华地区方言**：直接进入第二步。",
  "- **若识别为非金华地区方言**：",
  "    > “立即停止翻译”，仅输出：“经识别，这段音频并非金华地区方言，而是【XX地区】方言。由于我的核心专长是金华话，建议您确认来源。如需强制转写，请在输入前加上‘[强制翻译]'。”",
  "",
  "#### 情况 B：发送了强制指令",
  "- **无视方言归属判断**，直接进入第二步。",
  "",
  "---",
  "",
  "### 第二步：深度语境自适应与多重逻辑校验",
  "",
  "#### 2.1 专项识别与基础校验",
  "- **时间词校正**：精准转换“前日/后日/今朝/昨日/明朝”等。",
  "- **地域闭环校验**：",
  "    - 当音频中出现发音疑似地名，且前文存在明显地域对比语境时，优先将句末存疑音节与前文提及的地名进行匹配。",
  "- **状态词捕捉**：高度敏感于“火哇”、“灵光”等状态词。",
  "- **句式框架转换**：将方言特有的虚词、补语结构、语序转换为标准普通话表达框架（仅框架转换，不添加新实词）。",
  "",
  "#### 2.2 方言特有表达的语义转换规则（核心机制）",
  "- **触发条件**：当检测到方言特有的词汇、缩略结构或惯用语，且字面直译在普通话中不通顺或无法准确传达原意时。",
  "- **执行方式**：",
  "    - 默认优先尝试在普通话中找到语义最接近的自然表达。",
  "    - 仅在必要时进行语义转换，严禁过度扩写或添加新信息。",
  "    - 转换后必须确保与音频原意完全一致。",
  "- **禁止行为**：将普通方言语法省略（如介词省略）强制添加词语；仅对方言特有“意思与表述不对应”的情况适用本规则。",
  "",
  "#### 2.3 模糊发音主动复核机制",
  "- 遇到音近字误写、非常规搭配或语义存疑的发音片段时，必须执行“存疑→查证→修正”流程。",
  "- **三步处理**：",
  "    1. 内部标记为存疑。",
  "    2. 结合前后文逻辑、方言发音规律进行推导。",
  "    3. 输出修正后的准确版本；极高不确定性时在文末备注说明。",
  "- 高置信度音译策略：仅在无法通过语境确定时使用，并标注 `[音译存疑]`。",
  "",
  "#### 2.4 粗俗语与敏感词如实记录原则",
  "- 涉及性器官隐喻、诅咒、贬低性称呼的方言词汇，必须**本字还原**（如 `luo`/`luan` → `卵`）。",
  "- **严禁净化**：不得将脏话替换为文明用语。",
  "- 默认开启如实输出；用户可通过 `[关闭敏感词输出]` 临时关闭。",
  "",
  "#### 2.5 场景逻辑预判机制",
  "- 遇到模糊发音时，先判断音频场景属性（带货、日常聊天、身体描述等），提高符合场景逻辑的释义置信度。",
  "",
  "---",
  "",
  "### 第三步：语气风格化输出",
  "- **默认模式（全真还原）**：",
  "    - 像镜子一样反射音频内容，包括口癖、停顿词、重复强调和情绪起伏。",
  "    - **严禁去除冗余**：必须保留所有口语化冗余成分（啊、呃、好好好等）。",
  "    - **严禁主观润色**：不得为通顺而合并重复词或简化句式。",
  "- **幽默模式**：保留调侃、夸张、反讽。",
  "- **正式模式**：仅在用户明确指定时使用。",
  "",
  "---",
  "",
  "### 第四步：格式严格约束",
  "1. 标点符号仅允许使用 `, . ? ! ;`。",
  "2. 数字全部转换为汉字（如“三十八度”）。",
  "3. 说话人重复的字词必须严格按照次数保留。",
  "4. 语义停顿超过 3 秒或情绪/话题转折，视为新段落并重新编号。",
  "5. 连续笑声需独立成句编号。",
  "",
  "---",
  "",
  "### 第五步：输出禁忌（红线规则）",
  "- ❌ 严禁拒绝输出（除非是非金华话且无强制指令）。",
  "- ❌ 严禁在非例外情况下凭空添加实词或介词。",
  "- ❌ 严禁删除清晰的语气词、重复词、填充词。",
  "- ❌ 严禁改变原意或添加原文未出现的新信息。",
  "- ❌ 严禁跳过复核直接输出逻辑不通的内容。",
  "- ✅ 仅在方言特有表达的语义转换场景下，允许突破逐音节对应。",
  "",
  "---",
  "",
  "## 4. 输入示例与处理逻辑",
  "",
  "### 示例场景：地域对比吐槽（严格保留方言结构）",
  "- **音频内容**：\"...东北供暖了...赶紧到义乌来...现在还是三十八度了，现在我金华（wo jin hua）...\"",
  "- **正确处理**：",
  "    1. 语境校验：前文提到“东北”，结尾回归本地。",
  "    2. 发音匹配：`wo jin hua` ≈ “我金华”。",
  "    3. 严格执行：保留方言省略结构，不添加“在”。",
  "    4. **最终输出**：`1. 现在还是三十八度了，现在我金华。`",
  "",
  "### 示例场景：高频方言词语义转换（例外适用）",
  "- **音频内容**：“格个美女姐条件**卡**好（ka hao）的啊。”",
  "- **正确处理**：",
  "    1. 识别“格个”“卡好”为金华话高频表达。",
  "    2. 语义转换：“这个”“非常好”。",
  "    3. **最终输出**：`1. 这个美女姐条件非常好的啊。`",
  "",
  "### 示例场景：时间状语 + 动作（例外适用）",
  "- **音频内容**：“一记睏了要爬起，一记睏了要爬起。”",
  "- **正确处理**：",
  "    1. 识别“一记睏了”为方言时间状语 + 动作。",
  "    2. 语义转换：“刚睡着要爬起”。",
  "    3. 重复必须保留。",
  "    4. **最终输出**：`1. 刚睡着要爬起，刚睡着要爬起。`",
  "",
  "### 示例场景：严禁添加介词（默认规则）",
  "- **音频内容**：“我金华（wo jin hua）上班。”",
  "- **正确处理**：严格保留方言结构。",
  "- **最终输出**：`1. 我金华上班。`",
  "",
  "### 示例场景：粗俗语本字还原",
  "- **音频内容**：“诶个罗都混跌不的里，混啊个裸啊。”",
  "- **正确处理**：",
  "    1. 句式框架转换。",
  "    2. 词汇还原：`罗`/`裸` → `卵`。",
  "    3. **最终输出**：`1. 那个卵都混不下去了。` `2. 还混个卵啊！`",
  "",
  "### 示例场景：方言缩略语语义转换（例外适用）",
  "- **音频内容**：\"...空头经实足，闲的欢给我养个3000只鸡...\"",
  "- **正确处理**：",
  "    1. “空头经实足”按语义转写为“空话连篇却说得一本正经”。",
  "    2. “闲的欢”复核为“闲得慌”。",
  "    3. 数字规范：3000 → 三千。",
  "    4. **最终输出**：`1. 空话连篇却说得一本正经，闲得慌给我养个三千只鸡。`",
  "",
  "---",
  "",
  "## 5. 启动指令",
  "",
  "请等待用户输入音频文本或指令，即刻开始执行上述流程。",
].join("\n");
const PRICING_SUMMARY = Object.freeze(
  buildPricingAvailabilitySummary({
    omni: SUPPORTED_OMNI_MODELS,
  })
);

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeListenText(value) {
  return typeof value === "string" ? value : "";
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function createHttpError(statusCode, message, code) {
  const error = new Error(String(message || "请求失败。"));
  error.statusCode = Number(statusCode) || 500;
  error.code = normalizeText(code) || "request-failed";
  return error;
}

function normalizeErrorDebugObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function buildOmniDefaults() {
  return {
    model: DEFAULT_OMNI_MODEL,
    prompt: DEFAULT_OMNI_PROMPT,
    params: Object.assign({}, DEFAULT_OMNI_PARAMS),
  };
}

function normalizeOmniParams(params) {
  const source = params && typeof params === "object" ? params : {};
  const result = {};
  [
    ["temperature", false],
    ["top_p", false],
    ["max_tokens", true],
    ["max_completion_tokens", true],
    ["presence_penalty", false],
    ["frequency_penalty", false],
    ["seed", true],
  ].forEach(function (definition) {
    const value = source[definition[0]];
    if (value === "" || value === null || value === undefined) {
      return;
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return;
    }
    result[definition[0]] = definition[1] ? Math.round(number) : number;
  });
  const stopSource = Array.isArray(source.stop)
    ? source.stop
    : typeof source.stop === "string"
      ? source.stop.split(/\r?\n|,/)
      : [];
  const stop = stopSource.map(normalizeText).filter(Boolean).slice(0, 8);
  if (stop.length > 0) {
    result.stop = stop;
  }
  return result;
}

function normalizeOmniConfig(rawOmni) {
  const defaults = buildOmniDefaults();
  const source = rawOmni && typeof rawOmni === "object" ? rawOmni : {};
  const requestedModel = normalizeText(source.model || defaults.model);
  const requestedPrompt = typeof source.prompt === "string" ? source.prompt : "";
  return {
    model:
      SUPPORTED_OMNI_MODELS.indexOf(requestedModel) >= 0
        ? requestedModel
        : defaults.model,
    prompt: normalizeText(requestedPrompt) ? requestedPrompt : defaults.prompt,
    params: normalizeOmniParams(source.params),
    enableThinking: source.enableThinking === true,
  };
}

function normalizeRecommendRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const audioUrl = normalizeText(source.audioUrl);
  const audioDataUrl = normalizeText(source.audioDataUrl);
  if (!audioUrl && !audioDataUrl) {
    throw createHttpError(400, "缺少 audioUrl 或 audioDataUrl。", "missing-audio-input");
  }
  const startMs = Math.max(0, Math.round(toFiniteNumber(source.startMs, source.segment?.startMs || 0)));
  const endMs = Math.max(
    startMs,
    Math.round(toFiniteNumber(source.endMs, source.segment?.endMs || startMs))
  );
  return {
    audioUrl,
    audioDataUrl,
    startMs,
    endMs,
    durationMs: Math.max(0, endMs - startMs),
    selectionKey: normalizeText(source.selectionKey),
    segmentNumber: Math.max(0, Math.round(Number(source.segmentNumber || 0)) || 0),
    fieldContext:
      source.fieldContext && typeof source.fieldContext === "object" ? source.fieldContext : {},
    editorContext:
      source.editorContext && typeof source.editorContext === "object" ? source.editorContext : {},
    requestId: normalizeText(source.requestId),
    aiUsageOperatorName: normalizeText(source.aiUsageOperatorName),
    platformUserName: normalizeText(source.platformUserName),
    platformUserId: normalizeText(source.platformUserId),
    timeoutMs: Math.max(
      1000,
      Math.min(DEFAULT_TIMEOUT_MS, Math.round(toFiniteNumber(source.timeoutMs, DEFAULT_TIMEOUT_MS)))
    ),
    aiOmni: normalizeOmniConfig(source.aiOmni),
  };
}

function buildAssetsContext(assets) {
  const source = assets && typeof assets === "object" ? assets : {};
  return {
    rulesText: normalizeText(source.ruleText),
  };
}

function normalizeOmniOutput(value) {
  return {
    listenText: normalizeListenText(value),
  };
}

function buildOmniPrompt(request, assetsContext) {
  return {
    systemPrompt: String(request.aiOmni?.prompt || DEFAULT_OMNI_PROMPT),
    userPrompt: [
      "单次全模态识别上下文：",
      normalizeText(assetsContext?.rulesText)
        ? "参考资料已加载：jinhua-rules.md（按当前 Prompt 处理）。"
        : "",
      JSON.stringify(
        {
          segment: {
            startMs: request.startMs,
            endMs: request.endMs,
            durationMs: request.durationMs,
            segmentNumber: request.segmentNumber,
          },
          fieldContext: request.fieldContext,
          editorContext: request.editorContext,
        },
        null,
        2
      ),
    ].filter(Boolean).join("\n"),
  };
}

function createRuntimeDeps(overrides) {
  const source = overrides && typeof overrides === "object" ? overrides : {};
  return {
    now: typeof source.now === "function" ? source.now : Date.now,
    normalizeUsage:
      typeof source.normalizeUsage === "function" ? source.normalizeUsage : normalizeUsage,
    requestOmniInputAudio:
      typeof source.requestOmniInputAudio === "function" ? source.requestOmniInputAudio : requestOmniInputAudio,
  };
}

async function runOmni(request, assetsContext, deps) {
  const startedAt = deps.now();
  const result = await deps.requestOmniInputAudio(
    {
      audioUrl: request.audioUrl,
      audioDataUrl: request.audioDataUrl,
      aiOptions: request.aiOmni.params,
    },
    buildOmniPrompt(request, assetsContext),
    {
      model: request.aiOmni.model,
      timeoutMs: request.timeoutMs,
      enableThinking: request.aiOmni.enableThinking,
    }
  );
  const rawText = typeof result.rawText === "string" ? result.rawText : "";
  const normalized = normalizeOmniOutput(rawText);
  return {
    listenText: normalized.listenText,
    rawText,
    timing: {
      omniMs: Math.max(0, deps.now() - startedAt),
    },
    models: {
      omniModel: normalizeText(result.model) || request.aiOmni.model,
    },
    usage: {
      omni: deps.normalizeUsage(result.usage),
    },
  };
}

function buildRecommendCost(models, usage) {
  return estimateProjectCost({
    omni: {
      modelId: models?.omniModel,
      usage: usage?.omni,
      outputMode: "text",
    },
  });
}

async function recommend(request, assetsContext, overrides) {
  const deps = createRuntimeDeps(overrides);
  const startedAt = deps.now();
  const omniResult = await runOmni(request, assetsContext || {}, deps);
  return {
    listenText: normalizeListenText(omniResult.listenText),
    timing: {
      omniMs: Number(omniResult.timing?.omniMs || 0) || 0,
      totalMs: Math.max(0, deps.now() - startedAt),
    },
    models: omniResult.models,
    usage: omniResult.usage,
    cost: buildRecommendCost(omniResult.models, omniResult.usage),
    raw: {
      omni: omniResult.rawText,
    },
    debug: {
      rulesSource: "jinhua-rules.md",
    },
  };
}

function createHealthPayload(assetsContext) {
  return {
    success: true,
    route: "bytedance-aidp/jinhua-helper/ai/recommend",
    scriptId: SCRIPT_ID,
    defaults: {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      omni: buildOmniDefaults(),
    },
    supportedModels: {
      omni: SUPPORTED_OMNI_MODELS.slice(),
    },
    contract: {
      writeField: "TempAnswer.Content.data.regions[*].txt",
      stages: ["omni"],
      writeMode: "direct-current-or-batch-temp-answer",
    },
    reference: {
      rulesSource: "jinhua-rules.md",
      rulesLoaded: Boolean(normalizeText(assetsContext?.rulesText)),
    },
    pricing: Object.assign({}, PRICING_SUMMARY),
  };
}

function createDefaultsPayload() {
  return {
    success: true,
    scriptId: SCRIPT_ID,
    defaults: {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      omni: buildOmniDefaults(),
    },
    supportedModels: {
      omni: SUPPORTED_OMNI_MODELS.slice(),
    },
    supportedParams: {
      temperature: true,
      top_p: true,
      max_tokens: true,
      max_completion_tokens: true,
      presence_penalty: true,
      frequency_penalty: true,
      seed: true,
      stop: true,
      enable_thinking: true,
    },
    contract: {
      stages: ["omni"],
      outputMode: "text",
      enableThinking: false,
      supportsThinking: true,
    },
    pricing: Object.assign({}, PRICING_SUMMARY),
  };
}

function buildRecommendSuccessBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const result =
    source.data && typeof source.data === "object"
      ? source.data
      : source.execution?.projectResult || {};
  return {
    success: true,
    requestId: normalizeText(source.requestId || source.normalizedRequest?.requestId),
    listenText: normalizeListenText(result.listenText),
    usage: result.usage && typeof result.usage === "object" ? result.usage : {},
    cost: result.cost && typeof result.cost === "object" ? result.cost : {},
    timing: result.timing && typeof result.timing === "object" ? result.timing : {},
    models: result.models && typeof result.models === "object" ? result.models : {},
    raw: result.raw && typeof result.raw === "object" ? result.raw : {},
    debug: result.debug && typeof result.debug === "object" ? result.debug : {},
  };
}

function buildRecommendErrorBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const error = source.error && typeof source.error === "object" ? source.error : {};
  const body = {
    success: false,
    requestId: normalizeText(source.requestId || error.requestId),
    code: normalizeText(error.code),
    message: normalizeText(error.message) || "金华话 AI 识别失败。",
  };
  ["usage", "timing", "models", "cost", "raw", "debug"].forEach(function (key) {
    const value = normalizeErrorDebugObject(error[key]);
    if (value) {
      body[key] = value;
    }
  });
  return body;
}

module.exports = {
  DEFAULT_OMNI_MODEL,
  DEFAULT_TIMEOUT_MS,
  SCRIPT_ID,
  SUPPORTED_OMNI_MODELS,
  __testOnly: {
    normalizeListenText,
    normalizeOmniOutput,
  },
  buildAssetsContext,
  buildRecommendErrorBody,
  buildRecommendSuccessBody,
  createDefaultsPayload,
  createHealthPayload,
  createHttpError,
  normalizeRecommendRequest,
  recommend,
};
