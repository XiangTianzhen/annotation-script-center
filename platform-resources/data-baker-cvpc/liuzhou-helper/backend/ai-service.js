"use strict";

const path = require("path");

const {
  requestOmniInputAudio,
  requestTextCompareJson,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const {
  ensureChineseSentencePunctuation,
  normalizeUsage,
  parseModelJsonText,
} = require("../../../data-baker/round-one-quality/backend/ai-service");
const { validateBusinessLexiconDocument } = require("../../../backend/business-lexicon");
const {
  buildPricingAvailabilitySummary,
  estimateProjectCost,
} = require("../../../backend/ai/model-pricing");

const SCRIPT_ID = "dataBakerCvpcLiuzhouAssistant";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_LISTEN_MODEL = "qwen3.5-omni-flash";
const DEFAULT_REFINE_MODEL = "qwen3.5-plus";
const SUPPORTED_LISTEN_MODELS = ["qwen3.5-omni-plus", "qwen3.5-omni-flash"];
const SUPPORTED_REFINE_MODELS = ["qwen3.5-plus", "qwen3.5-flash"];
const DEFAULT_STAGE_PARAMS = {
  temperature: 0.1,
  top_p: 0.8,
  max_tokens: 1200,
  max_completion_tokens: "",
  presence_penalty: "",
  frequency_penalty: "",
  seed: "",
  stop: "",
};
const SUPPORTED_SPECIAL_TAGS = [
  "#um",
  "#hmm",
  "#ah",
  "#eh",
  "<SPK/>",
  "<NPS/>",
];
const SUPPORTED_SPECIAL_TAG_MAP = {
  "#um": "#um",
  "#hmm": "#hmm",
  "#ah": "#ah",
  "#eh": "#eh",
  "<spk/>": "<SPK/>",
  "<nps/>": "<NPS/>",
};
const INLINE_TAG_MATCHER = /#[a-zA-Z][a-zA-Z0-9_-]*|<[^>\r\n]+>/g;
const INLINE_TAG_PLACEHOLDER_PREFIX = "ASCTAGTOKEN";
const TAG_ADJACENT_PUNCTUATION_PATTERN = /[，。？！；]+$/;
const TAG_LEADING_PUNCTUATION_PATTERN = /^[，。？！；]+/;
const NOISE_BOUNDARY_PUNCTUATION_TRAILING_PATTERN = /[，；]+$/;
const NOISE_BOUNDARY_PUNCTUATION_LEADING_PATTERN = /^[，；]+/;
const REPEATED_LAUGHTER_MATCHER = /(呵{2,}|哈{2,}|嘿{2,}|嘻{2,})/g;
const DIALECT_TAG_INFERENCE_MATCHER = /(呵{2,}|哈{2,}|嘿{2,}|嘻{2,}|呃|诶|欸|啊|嗯)/g;
const MANDARIN_PARTICLE_MAP = {
  "#eh": "诶",
  "#ah": "啊",
  "#um": "嗯",
  "#hmm": "嗯",
};
const FINAL_DIALECT_STANDARD_FORM_RULES = [
  {
    pattern: /更要紧/g,
    replacement: "哏要紧",
  },
  {
    pattern: /更子/g,
    replacement: "哏子",
  },
  {
    pattern: /去找/g,
    replacement: "克找",
  },
  {
    pattern: /哩/g,
    replacement: "滴",
  },
  {
    pattern: /去(?=[啊呀啦咯啵嘛呢呗哇喔哦诶欸哈，。？！；]|$)/g,
    replacement: "克",
  },
];
const MANDARIN_STUTTER_PHRASES = ["这个", "那个"];
const DEFAULT_LISTEN_PROMPT = [
  "请严格只根据当前段音频输出原始柳州话听音结果。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：audioDialectText, candidatePhrases, specialTags, needHumanReview, notes。",
  "audioDialectText 只写音频里的柳州话文本，不要输出普通话，不要做修正，不要自由推断。",
  "candidatePhrases 用于记录近音但不完全确定的柳州话候选，最多 3 个，按可能性排序；不要重复 audioDialectText。",
  "如果某个词存在 2~3 个近音可能，audioDialectText 先保留最可能的一条，其余写进 candidatePhrases，供下一阶段结合句意判断。",
  "听不清必须保守，并把 needHumanReview 设为 true。",
  "有效标签只允许：#um、#hmm、#ah、#eh、<SPK/>、<NPS/>。",
  "独立口语词“呃/诶/欸”优先写为 #eh，“啊”优先写为 #ah，“嗯”优先写为 #um。",
  "主说话人的笑声或明显非语义人声优先写为 <SPK/>。",
  "标签直接内联写在柳州话文本里，例如：都七十岁了#eh，明日古稀了。",
  "如果标签前后同时出现标点，只保留标签后的标点，不要输出“，#eh，”这种双侧标点。",
  "只允许使用中文句末标点：，。？！；不允许使用《》。",
].join("\n");
const DEFAULT_REFINE_PROMPT = [
  "请同时收口柳州话文本和普通话文本，但仍以听音结果与词表草稿为主。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：refinedDialectText, refinedMandarinText, candidateAlternatives, needHumanReview, notes。",
  "你会收到原始听音柳州话、听音近音候选、词表优先生成的普通话草稿、页面字段上下文和词表命中片段。",
  "可以结合页面已有文本、词表释义、读音说明和近音候选，在发音接近的词之间做保守纠正。",
  "只做标点、断句、明显错字和顺滑修正，不做自由改写，不要偏离词表含义。",
  "词表没有直接命中时，可以参考上下文句意和近音候选，把明显更合理的柳州话词语或普通话译法修正出来；拿不准时保留到 candidateAlternatives。",
  "candidateAlternatives 最多输出 3 个，用于人工复核；每个元素固定包含 dialectText, mandarinText, reason。",
  "若拿不准或需要保留歧义，必须把 needHumanReview 设为 true。",
  "refinedDialectText 最终标准写法优先使用：克、滴、哏；例如 去->克、哩->滴、更子->哏子、更要紧->哏要紧。",
  "refinedDialectText 里的有效标签只允许：#um、#hmm、#ah、#eh、<SPK/>、<NPS/>。",
  "refinedMandarinText 必须是纯文本，禁止输出任何标签。",
  "如果 refinedDialectText 保留了口语词标签，refinedMandarinText 必须保留对应纯文本语气词。",
  "笑声或明显非语义噪音在 refinedMandarinText 里必须删除，不写标签，不写“呵呵呵”等字面笑声。",
  "refinedMandarinText 需要删除结巴、拉长重复、口误类非必要内容，只保留顺滑普通话表达。",
  "例如：这个这个->这个，辣辣辣辣的->辣的；但不要删除像“吃得，吃得”这类仍可能有语义或节奏作用的重复。",
  "如果标签前后同时出现标点，只保留标签后的标点，不要输出“，#eh，”这种双侧标点。",
  "只允许使用中文句末标点：，。？！；不允许使用《》。",
].join("\n");
const RECOMMEND_FAILURE_FALLBACK_NOTE =
  "模型结构化输出失败，以下柳州话/普通话为保守兜底参考，请人工复核。";
let warnedLexiconReferenceOnly = false;
const PRICING_SUMMARY = Object.freeze(
  buildPricingAvailabilitySummary({
    listen: SUPPORTED_LISTEN_MODELS,
    refine: SUPPORTED_REFINE_MODELS,
  })
);

function normalizeText(value) {
  return String(value || "").trim();
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

function normalizeList(value, limit) {
  const result = [];
  (Array.isArray(value) ? value : [value]).forEach(function (item) {
    const text = normalizeText(item);
    if (!text || result.indexOf(text) >= 0) {
      return;
    }
    result.push(text);
  });
  return typeof limit === "number" && limit > 0 ? result.slice(0, limit) : result;
}

function normalizeLineText(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[《》]/g, "")
    .replace(/[；;：:]/g, "，")
    .replace(/[“”"「」『』（）()[\]{}]/g, "")
    .replace(/,/g, "，")
    .replace(/\?/g, "？")
    .replace(/!/g, "！")
    .replace(/\./g, "。")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAllowedPunctuation(text) {
  const value = normalizeLineText(text);
  if (!value) {
    return "";
  }
  const withEnding = ensureChineseSentencePunctuation(value);
  return withEnding
    .replace(/[；;：:]/g, "，")
    .replace(/[…]/g, "。")
    .replace(/。+/g, "。")
    .replace(/，+/g, "，")
    .replace(/？+/g, "？")
    .replace(/！+/g, "！");
}

function normalizeSpecialTag(tag) {
  const text = normalizeText(tag);
  return SUPPORTED_SPECIAL_TAG_MAP[text] || SUPPORTED_SPECIAL_TAG_MAP[text.toLowerCase()] || "";
}

function normalizeSpecialTags(value) {
  const result = [];
  (Array.isArray(value) ? value : [value]).forEach(function (item) {
    const normalized = normalizeSpecialTag(item);
    if (!normalized || result.indexOf(normalized) >= 0) {
      return;
    }
    result.push(normalized);
  });
  return result;
}

function extractSupportedTagsFromText(text) {
  const value = String(text || "");
  return SUPPORTED_SPECIAL_TAGS.filter(function (tag) {
    return value.indexOf(tag) >= 0;
  });
}

function collectSpecialTagsFromTokens(tokens) {
  const result = [];
  (Array.isArray(tokens) ? tokens : []).forEach(function (token) {
    const tag = token && token.type === "tag" ? normalizeSpecialTag(token.content) : "";
    if (!tag || result.indexOf(tag) >= 0) {
      return;
    }
    result.push(tag);
  });
  return result;
}

function isNoiseTag(tag) {
  const normalized = normalizeSpecialTag(tag);
  return normalized === "<SPK/>" || normalized === "<NPS/>";
}

function isChineseWordCharacter(char) {
  return /[\u3400-\u9fffA-Za-z0-9]/.test(String(char || ""));
}

function isInferenceBoundaryCharacter(char) {
  const value = String(char || "");
  return !value || /[\s，。？！；,.!?;:"'“”‘’()（）[\]{}<>]/.test(value);
}

function isStandaloneInferenceMatch(text, index, length) {
  const source = String(text || "");
  const start = Math.max(0, Number(index || 0) || 0);
  const matchLength = Math.max(0, Number(length || 0) || 0);
  const previousChar = start > 0 ? source.charAt(start - 1) : "";
  const nextChar = source.charAt(start + matchLength);
  return (
    !isChineseWordCharacter(previousChar) &&
    (isInferenceBoundaryCharacter(nextChar) || !nextChar)
  );
}

function inferSpecialTagFromLiteral(text) {
  const source = String(text || "");
  if (/^(呵{2,}|哈{2,}|嘿{2,}|嘻{2,})$/.test(source)) {
    return "<SPK/>";
  }
  if (/^(呃|诶|欸)$/.test(source)) {
    return "#eh";
  }
  if (source === "啊") {
    return "#ah";
  }
  if (source === "嗯") {
    return "#um";
  }
  return "";
}

function joinInlineTagTokens(tokens) {
  return (Array.isArray(tokens) ? tokens : [])
    .map(function (token) {
      if (!token || typeof token !== "object") {
        return "";
      }
      return String(token.content || "");
    })
    .join("");
}

function pushTextToken(target, content) {
  const text = String(content || "");
  if (!text) {
    return;
  }
  const list = Array.isArray(target) ? target : [];
  const previous = list[list.length - 1];
  if (previous && previous.type === "text") {
    previous.content = String(previous.content || "") + text;
    return;
  }
  list.push({
    type: "text",
    content: text,
  });
}

function pushTagToken(target, content, inferred) {
  const tag = normalizeSpecialTag(content);
  if (!tag) {
    return;
  }
  const list = Array.isArray(target) ? target : [];
  list.push({
    type: "tag",
    content: tag,
    inferred: inferred === true,
  });
}

function stripTokenMetadata(tokens) {
  return (Array.isArray(tokens) ? tokens : [])
    .map(function (token) {
      if (!token || typeof token !== "object") {
        return null;
      }
      const type = normalizeText(token.type).toLowerCase();
      if (type !== "text" && type !== "tag") {
        return null;
      }
      return {
        type: type,
        content: String(token.content || ""),
      };
    })
    .filter(Boolean);
}

function compactInlineTagTokens(tokens) {
  const result = [];
  (Array.isArray(tokens) ? tokens : []).forEach(function (token) {
    if (!token || typeof token !== "object") {
      return;
    }
    if (token.type === "tag") {
      pushTagToken(result, token.content, token.inferred === true);
      return;
    }
    pushTextToken(result, token.content);
  });
  return result.filter(function (token) {
    return normalizeText(token.content) || token.type === "tag" || String(token.content || "").length > 0;
  });
}

function inferSupportedTagsFromText(text) {
  const source = String(text || "");
  if (!source) {
    return [];
  }
  const result = [];
  let cursor = 0;
  let matched;
  DIALECT_TAG_INFERENCE_MATCHER.lastIndex = 0;
  while ((matched = DIALECT_TAG_INFERENCE_MATCHER.exec(source))) {
    const literal = String(matched[0] || "");
    const index = matched.index;
    const inferredTag = inferSpecialTagFromLiteral(literal);
    const isNoise = isNoiseTag(inferredTag);
    if (!inferredTag || (!isNoise && !isStandaloneInferenceMatch(source, index, literal.length))) {
      continue;
    }
    if (index > cursor) {
      pushTextToken(result, source.slice(cursor, index));
    }
    pushTagToken(result, inferredTag, true);
    cursor = index + literal.length;
    if (isNoise) {
      const rest = source.slice(cursor);
      const leadingNoisePunctuation = rest.match(NOISE_BOUNDARY_PUNCTUATION_LEADING_PATTERN);
      if (leadingNoisePunctuation) {
        cursor += leadingNoisePunctuation[0].length;
      }
    }
  }
  if (cursor < source.length) {
    pushTextToken(result, source.slice(cursor));
  }
  return compactInlineTagTokens(result);
}

function tokenizeInlineTagText(text, placeholders) {
  const source = String(text || "");
  const tagPlaceholders = Array.isArray(placeholders) ? placeholders : [];
  if (!source) {
    return [];
  }
  const placeholderMap = new Map(
    tagPlaceholders.map(function (item) {
      return [String(item.placeholder || ""), normalizeSpecialTag(item.tag)];
    })
  );
  const placeholderPattern = new RegExp(INLINE_TAG_PLACEHOLDER_PREFIX + "\\d+__", "g");
  const result = [];
  let cursor = 0;
  let matched;
  while ((matched = placeholderPattern.exec(source))) {
    if (matched.index > cursor) {
      pushTextToken(result, source.slice(cursor, matched.index));
    }
    pushTagToken(result, placeholderMap.get(matched[0]), false);
    cursor = matched.index + matched[0].length;
  }
  if (cursor < source.length) {
    pushTextToken(result, source.slice(cursor));
  }
  return compactInlineTagTokens(result);
}

function normalizeTagAdjacentPunctuation(tokens) {
  const source = compactInlineTagTokens(tokens);
  let changed = false;
  for (let index = 1; index < source.length - 1; index += 1) {
    const current = source[index];
    if (!current || current.type !== "tag") {
      continue;
    }
    const previous = source[index - 1];
    const next = source[index + 1];
    if (!previous || previous.type !== "text" || !next || next.type !== "text") {
      continue;
    }
    const previousText = String(previous.content || "");
    const nextText = String(next.content || "");
    if (!TAG_ADJACENT_PUNCTUATION_PATTERN.test(previousText) || !TAG_LEADING_PUNCTUATION_PATTERN.test(nextText)) {
      continue;
    }
    const trimmedPrevious = previousText.replace(TAG_ADJACENT_PUNCTUATION_PATTERN, "");
    if (trimmedPrevious !== previousText) {
      previous.content = trimmedPrevious;
      changed = true;
    }
  }
  return {
    changed,
    tokens: compactInlineTagTokens(source),
  };
}

function normalizeNoiseTagBoundaries(tokens) {
  const source = compactInlineTagTokens(tokens);
  let changed = false;
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    if (!current || current.type !== "tag" || !isNoiseTag(current.content)) {
      continue;
    }
    const previous = source[index - 1];
    const next = source[index + 1];
    if (previous && previous.type === "text") {
      const previousText = String(previous.content || "");
      const trimmedPrevious = previousText.replace(NOISE_BOUNDARY_PUNCTUATION_TRAILING_PATTERN, "");
      if (trimmedPrevious !== previousText) {
        previous.content = trimmedPrevious;
        changed = true;
      }
    }
    if (next && next.type === "text") {
      const nextText = String(next.content || "");
      const trimmedNext = nextText.replace(NOISE_BOUNDARY_PUNCTUATION_LEADING_PATTERN, "");
      if (trimmedNext !== nextText) {
        next.content = trimmedNext;
        changed = true;
      }
    }
  }
  return {
    changed,
    tokens: compactInlineTagTokens(source),
  };
}

function normalizeInlineTaggedDialectText(text, extraTags) {
  const unsupportedTags = [];
  const placeholders = [];
  const placeholderText = String(text || "").replace(INLINE_TAG_MATCHER, function (match) {
    const normalizedTag = normalizeSpecialTag(match);
    if (!normalizedTag) {
      unsupportedTags.push(normalizeText(match) || String(match || ""));
      return "";
    }
    const placeholder = INLINE_TAG_PLACEHOLDER_PREFIX + String(placeholders.length) + "__";
    placeholders.push({
      placeholder,
      tag: normalizedTag,
    });
    return placeholder;
  });
  const normalizedText = normalizeAllowedPunctuation(placeholderText);
  const tokenized = tokenizeInlineTagText(normalizedText, placeholders);
  const inferredTokens = compactInlineTagTokens(
    tokenized.flatMap(function (token, index, list) {
      if (!token || token.type !== "text") {
        return [token];
      }
      const previous = list[index - 1];
      const next = list[index + 1];
      if (
        (previous && previous.type === "tag" && previous.inferred !== true) ||
        (next && next.type === "tag" && next.inferred !== true)
      ) {
        return [token];
      }
      return inferSupportedTagsFromText(token.content);
    })
  );
  const punctuationResult = normalizeTagAdjacentPunctuation(inferredTokens);
  const noiseBoundaryResult = normalizeNoiseTagBoundaries(punctuationResult.tokens);
  const secondPunctuationResult = normalizeTagAdjacentPunctuation(noiseBoundaryResult.tokens);
  const tokens = secondPunctuationResult.tokens;
  const specialTags = normalizeSpecialTags(
    collectSpecialTagsFromTokens(tokens).concat(normalizeSpecialTags(extraTags))
  );
  return {
    text: joinInlineTagTokens(tokens),
    tokens,
    specialTags,
    removedUnsupportedTags: unsupportedTags,
    fixedAdjacentPunctuation:
      punctuationResult.changed === true ||
      noiseBoundaryResult.changed === true ||
      secondPunctuationResult.changed === true,
  };
}

function normalizeMandarinPlainText(text) {
  const removedTags = [];
  const withoutTags = String(text || "").replace(INLINE_TAG_MATCHER, function (match) {
    const normalizedTag = normalizeSpecialTag(match);
    if (normalizedTag) {
      removedTags.push(normalizedTag);
    }
    return "";
  });
  const withoutLaughter = withoutTags
    .replace(REPEATED_LAUGHTER_MATCHER, "")
    .replace(/^[，；]+/g, "")
    .replace(/[，；]+([。？！])/g, "$1")
    .replace(/([。？！])[，；]+/g, "$1");
  return {
    text: normalizeAllowedPunctuation(withoutLaughter),
    removedTags,
  };
}

function applyFinalDialectStandardFormRules(text) {
  return FINAL_DIALECT_STANDARD_FORM_RULES.reduce(function (current, rule) {
    return String(current || "").replace(rule.pattern, rule.replacement);
  }, String(text || ""));
}

function normalizeFinalDialectStandardForms(tokens, fallbackText) {
  const sourceTokens = compactInlineTagTokens(
    Array.isArray(tokens) && tokens.length > 0
      ? tokens
      : [
          {
            type: "text",
            content: String(fallbackText || ""),
          },
        ]
  );
  let changed = false;
  const normalizedTokens = sourceTokens.map(function (token) {
    if (!token || token.type !== "text") {
      return token;
    }
    const original = String(token.content || "");
    const content = applyFinalDialectStandardFormRules(original);
    if (content !== original) {
      changed = true;
    }
    return {
      type: "text",
      content: content,
    };
  });
  const compacted = compactInlineTagTokens(normalizedTokens);
  return {
    text: joinInlineTagTokens(compacted),
    tokens: stripTokenMetadata(compacted),
    changed,
  };
}

function smoothMandarinDisfluencies(text) {
  let result = normalizeAllowedPunctuation(text);
  const original = result;
  if (!result) {
    return {
      text: "",
      changed: false,
    };
  }
  MANDARIN_STUTTER_PHRASES.forEach(function (phrase) {
    result = result.replace(new RegExp("(" + phrase + "){2,}", "g"), phrase);
  });
  result = result.replace(/([\u3400-\u9fff])\1{2,}(的|地|得)/g, "$1$2");
  result = normalizeAllowedPunctuation(result);
  return {
    text: result,
    changed: result !== original,
  };
}

function appendRequiredNotes(baseNotes, additions) {
  return normalizeNotes([].concat(baseNotes || [], additions || []));
}

function buildTagNormalizationNotes(result, options) {
  const source = result && typeof result === "object" ? result : {};
  const currentOptions = options && typeof options === "object" ? options : {};
  const notes = [];
  if (Array.isArray(source.removedUnsupportedTags) && source.removedUnsupportedTags.length > 0) {
    notes.push(
      "已移除不支持的标签：" +
        normalizeList(source.removedUnsupportedTags, 8).join("、")
    );
  }
  if (source.fixedAdjacentPunctuation) {
    notes.push("已修正标签前后重复标点，仅保留标签后的标点。");
  }
  if (Array.isArray(currentOptions.removedMandarinTags) && currentOptions.removedMandarinTags.length > 0) {
    notes.push("普通话顺滑中检测到标签，已自动移除。");
  }
  return notes;
}

function appendPromptRequirements(prompt, requiredLines) {
  const lines = [String(prompt || "").trim()]
    .concat(Array.isArray(requiredLines) ? requiredLines : [])
    .map(function (item) {
      return String(item || "").trim();
    })
    .filter(Boolean);
  return lines.join("\n");
}

function normalizeNotes(value) {
  return normalizeList(
    (Array.isArray(value) ? value : [value]).map(function (item) {
      return normalizeLineText(item);
    }),
    8
  );
}

function normalizeErrorDebugObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function buildRecommendCost(models, usage) {
  const normalizedModels = models && typeof models === "object" ? models : {};
  const normalizedUsage = usage && typeof usage === "object" ? usage : {};
  return estimateProjectCost({
    listen: {
      modelId: normalizedModels.listenModel,
      usage: normalizedUsage.listen,
      outputMode: "text",
    },
    refine: {
      modelId: normalizedModels.refineModel,
      usage: normalizedUsage.refine,
    },
  });
}

function parseCsvLine(text) {
  const source = String(text || "");
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source.charAt(index);
    if (char === '"') {
      if (inQuotes && source.charAt(index + 1) === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}

function normalizeAttributesMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const result = {};
  Object.keys(value).forEach(function (key) {
    const normalizedKey = normalizeText(key);
    if (!normalizedKey) {
      return;
    }
    const currentValue = value[key];
    if (Array.isArray(currentValue)) {
      const normalizedList = normalizeList(currentValue, 20);
      if (normalizedList.length > 0) {
        result[normalizedKey] = normalizedList;
      }
      return;
    }
    const normalizedValue = normalizeText(currentValue);
    if (normalizedValue) {
      result[normalizedKey] = normalizedValue;
    }
  });
  return result;
}

function buildReferenceRowsFromCsv(csvText) {
  const lines = String(csvText || "")
    .split(/\r?\n/)
    .map(function (line) {
      return String(line || "");
    })
    .filter(function (line) {
      return normalizeText(line).length > 0;
    });
  if (lines.length <= 1) {
    return [];
  }
  return lines
    .slice(1)
    .map(function (line) {
      const columns = parseCsvLine(line);
      return {
        pronunciation: normalizeText(columns[0]),
        dialectWord: normalizeText(columns[1]),
        meaning: normalizeText(columns[2]),
        aliases: [],
        source: "liuzhou-pronunciation-reference.csv",
      };
    })
    .filter(function (row) {
      return row.dialectWord && row.meaning;
    });
}

function normalizeCandidatePhrases(value, currentText) {
  const current = normalizeText(currentText);
  const seen = new Set();
  return (Array.isArray(value) ? value : [value])
    .map(function (item) {
      return normalizeInlineTaggedDialectText(item || "", []).text;
    })
    .filter(function (text) {
      const normalized = normalizeText(text);
      if (!normalized || normalized === current || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    })
    .slice(0, 3);
}

function normalizeCandidateAlternatives(value, fallbackReason) {
  const seen = new Set();
  return (Array.isArray(value) ? value : [value])
    .map(function (item) {
      const source =
        item && typeof item === "object"
          ? item
          : {
              dialectText: item,
            };
      const normalizedDialect = normalizeInlineTaggedDialectText(
        source.dialectText || source.text || source.candidateText || "",
        source.specialTags
      );
      const normalizedMandarin = normalizeMandarinPlainText(
        source.mandarinText || source.meaning || source.translationText || ""
      );
      const reason = normalizeLineText(source.reason || fallbackReason || "");
      return {
        dialectText: normalizedDialect.text,
        dialectTokens: stripTokenMetadata(normalizedDialect.tokens),
        mandarinText: normalizedMandarin.text,
        reason,
      };
    })
    .filter(function (item) {
      const key = normalizeText(item.dialectText);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function mergeCandidateAlternatives(refineCandidates, listenResult, assetsContext, finalDialectText, finalMandarinText) {
  const finalDialect = normalizeText(finalDialectText);
  const seen = new Set([finalDialect]);
  const result = [];

  function appendCandidate(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const dialectText = normalizeText(source.dialectText);
    if (!dialectText || seen.has(dialectText) || result.length >= 3) {
      return;
    }
    seen.add(dialectText);
    result.push({
      dialectText: source.dialectText,
      dialectTokens: Array.isArray(source.dialectTokens) ? source.dialectTokens.slice() : [],
      mandarinText: source.mandarinText,
      reason: normalizeLineText(source.reason || ""),
    });
  }

  normalizeCandidateAlternatives(refineCandidates).forEach(appendCandidate);

  if (listenResult && normalizeText(listenResult.audioDialectText) !== finalDialect) {
    appendCandidate(
      normalizeCandidateAlternatives(
        [
          {
            dialectText: listenResult.audioDialectText,
            mandarinText: normalizeMandarinPlainText(
              buildMandarinDraftForDialect(
                assetsContext,
                listenResult.audioDialectText,
                listenResult.audioDialectTokens
              )
            ).text,
            reason: "原始听音",
          },
        ],
        "原始听音"
      )[0]
    );
  }

  (Array.isArray(listenResult?.candidatePhrases) ? listenResult.candidatePhrases : []).forEach(function (text) {
    appendCandidate(
      normalizeCandidateAlternatives(
        [
          {
            dialectText: text,
            mandarinText: normalizeMandarinPlainText(
              buildMandarinDraftForDialect(assetsContext, text, [])
            ).text,
            reason: "听音近音候选",
          },
        ],
        "听音近音候选"
      )[0]
    );
  });

  return result;
}

function normalizeListenStageOutput(value) {
  const source = value && typeof value === "object" ? value : {};
  const normalizedDialect = normalizeInlineTaggedDialectText(
    source.audioDialectText || source.dialectText || source.heardText || source.text || source.transcript || "",
    source.specialTags
  );
  const notes = appendRequiredNotes(
    source.notes,
    buildTagNormalizationNotes(normalizedDialect)
  );
  return {
    audioDialectText: normalizedDialect.text,
    audioDialectTokens: stripTokenMetadata(normalizedDialect.tokens),
    candidatePhrases: normalizeCandidatePhrases(source.candidatePhrases, normalizedDialect.text),
    audioMandarinText: "",
    specialTags: normalizedDialect.specialTags,
    needHumanReview:
      source.needHumanReview === true ||
      !normalizedDialect.text ||
      normalizedDialect.removedUnsupportedTags.length > 0 ||
      normalizedDialect.fixedAdjacentPunctuation === true,
    notes: notes,
  };
}

function normalizeRefineStageOutput(value) {
  const source = value && typeof value === "object" ? value : {};
  const normalizedDialect = normalizeInlineTaggedDialectText(
    source.refinedDialectText || source.dialectText || source.recommendedDialectText || source.recommendedText || "",
    source.specialTags
  );
  const normalizedMandarin = normalizeMandarinPlainText(
    source.refinedMandarinText ||
      source.mandarinText ||
      source.recommendedMandarinText ||
      source.translationText ||
      source.plainMandarinText ||
      ""
  );
  const finalDialect = normalizeFinalDialectStandardForms(
    normalizedDialect.tokens,
    normalizedDialect.text
  );
  const smoothedMandarin = smoothMandarinDisfluencies(normalizedMandarin.text);
  const restoredMandarinText = restoreMandarinParticlesFromDialectTokens(
    smoothedMandarin.text,
    finalDialect.tokens
  );
  const notes = appendRequiredNotes(
    source.notes,
    buildTagNormalizationNotes(normalizedDialect, {
      removedMandarinTags: normalizedMandarin.removedTags,
    })
  );
  return {
    refinedDialectText: finalDialect.text,
    refinedDialectTokens: finalDialect.tokens,
    refinedMandarinText: restoredMandarinText,
    candidateAlternatives: normalizeCandidateAlternatives(source.candidateAlternatives),
    specialTags: normalizeSpecialTags(
      collectSpecialTagsFromTokens(finalDialect.tokens).concat(normalizedDialect.specialTags)
    ),
    needHumanReview:
      source.needHumanReview === true ||
      !finalDialect.text ||
      !restoredMandarinText ||
      normalizedDialect.removedUnsupportedTags.length > 0 ||
      normalizedDialect.fixedAdjacentPunctuation === true ||
      normalizedMandarin.removedTags.length > 0,
    notes: notes,
  };
}

function buildStageDefaults() {
  return {
    listen: Object.assign(
      {
        model: DEFAULT_LISTEN_MODEL,
        prompt: DEFAULT_LISTEN_PROMPT,
        includeLexiconReference: false,
        modelOptions: SUPPORTED_LISTEN_MODELS.slice(),
      },
      DEFAULT_STAGE_PARAMS
    ),
    refine: Object.assign(
      {
        model: DEFAULT_REFINE_MODEL,
        prompt: DEFAULT_REFINE_PROMPT,
        modelOptions: SUPPORTED_REFINE_MODELS.slice(),
      },
      DEFAULT_STAGE_PARAMS
    ),
  };
}

function normalizeStageParams(params) {
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
  const stop = stopSource
    .map(function (item) {
      return normalizeText(item);
    })
    .filter(Boolean)
    .slice(0, 8);
  if (stop.length > 0) {
    result.stop = stop;
  }
  return result;
}

function normalizeStageConfig(rawStage, fallbackModel, fallbackPrompt, supportedModels) {
  const source = rawStage && typeof rawStage === "object" ? rawStage : {};
  const requestedModel = normalizeText(source.model || fallbackModel);
  const result = {
    model:
      supportedModels.indexOf(requestedModel) >= 0
        ? requestedModel
        : normalizeText(fallbackModel),
    prompt: String(source.prompt || fallbackPrompt || ""),
    params: normalizeStageParams(source.params),
  };
  if (source.includeLexiconReference === true || source.includeLexiconReference === false) {
    result.includeLexiconReference = source.includeLexiconReference === true;
  }
  return result;
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
  const stageDefaults = buildStageDefaults();
  const aiStages = source.aiStages && typeof source.aiStages === "object" ? source.aiStages : {};
  const listenStage = normalizeStageConfig(
    aiStages.listen,
    source.model || source.aiRecommendModel || stageDefaults.listen.model,
    stageDefaults.listen.prompt,
    SUPPORTED_LISTEN_MODELS
  );
  const refineStage = normalizeStageConfig(
    aiStages.refine,
    stageDefaults.refine.model,
    stageDefaults.refine.prompt,
    SUPPORTED_REFINE_MODELS
  );

  return {
    audioUrl,
    audioDataUrl,
    startMs,
    endMs,
    durationMs: Math.max(0, endMs - startMs),
    selectionKey: normalizeText(source.selectionKey),
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
      Math.min(300000, Math.round(toFiniteNumber(source.timeoutMs, DEFAULT_TIMEOUT_MS)))
    ),
    listenModel: listenStage.model,
    refineModel: refineStage.model,
    aiStages: {
      listen: listenStage,
      refine: refineStage,
    },
  };
}

function buildLexiconRows(document) {
  const normalizedDocument = validateBusinessLexiconDocument(document || {});
  const entries = Array.isArray(normalizedDocument.entries) ? normalizedDocument.entries : [];
  if (entries.length <= 0) {
    return [];
  }
  return entries
    .map(function (entry) {
      return {
        id: normalizeText(entry.id),
        normalized: normalizeText(entry.normalized),
        display: normalizeText(entry.display),
        mandarin: normalizeText(entry.mandarin),
        aliases: normalizeList(entry.aliases || [], 20),
        notes: normalizeList(entry.notes || [], 20),
        tags: normalizeList(entry.tags || [], 20),
        attributes: normalizeAttributesMap(entry.attributes),
      };
    })
    .filter(function (row) {
      return row.normalized && row.display && row.mandarin;
    });
}

function buildAssetsContext(assets) {
  const source = assets && typeof assets === "object" ? assets : {};
  let lexiconRows = [];
  let referenceRows = [];
  let lexiconStatus = "missing";
  let lexiconWarning = "";
  const hasReferenceCsv = normalizeText(source.lexiconReferenceCsv).length > 0;
  try {
    if (source.lexiconJson) {
      lexiconRows = buildLexiconRows(source.lexiconJson);
      if (hasReferenceCsv) {
        referenceRows = buildReferenceRowsFromCsv(source.lexiconReferenceCsv);
      }
      lexiconStatus = "ready";
    } else if (hasReferenceCsv) {
      lexiconStatus = "reference_only";
      lexiconWarning = "没有字词对应表";
    }
  } catch (_error) {
    lexiconRows = [];
    lexiconStatus = "invalid";
  }
  if (lexiconStatus === "reference_only") {
    if (!warnedLexiconReferenceOnly) {
      warnedLexiconReferenceOnly = true;
      console.warn("[DataBaker][cvpc][liuzhou][ai] 没有字词对应表，检测到本地参考 CSV，已按无词表模式继续返回。", {
        referenceFileName: "liuzhou-pronunciation-reference.csv",
      });
    }
  }
  return {
    rulesText: String(source.ruleText || "").trim(),
    lexiconRows,
    referenceRows,
    lexiconStatus,
    lexiconWarning,
  };
}

function buildRelevantLexiconContext(assetsContext, hintTexts) {
  const lexiconRows = Array.isArray(assetsContext?.lexiconRows) ? assetsContext.lexiconRows : [];
  const referenceRows = Array.isArray(assetsContext?.referenceRows) ? assetsContext.referenceRows : [];
  const hintText = (Array.isArray(hintTexts) ? hintTexts : [])
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
  const combinedRows = lexiconRows
    .map(function (row) {
      return Object.assign({}, row, {
        dialectWord: normalizeText(row?.display || row?.normalized),
        meaning: normalizeText(row?.mandarin),
        pronunciation: normalizeText(row?.attributes?.pronunciation),
        mandarinVariants: normalizeList(row?.attributes?.mandarinVariants || [], 20),
        usageContext: normalizeText(row?.attributes?.usageContext),
        source: "liuzhou-lexicon.json",
      });
    })
    .concat(
      referenceRows.map(function (row, index) {
        return {
          id: normalizeText(row?.id) || "reference-" + String(index + 1),
          dialectWord: normalizeText(row?.dialectWord),
          meaning: normalizeText(row?.meaning),
          aliases: normalizeList(row?.aliases || [], 20),
          notes: [],
          tags: [],
          pronunciation: normalizeText(row?.pronunciation),
          mandarinVariants: [],
          usageContext: "",
          source: normalizeText(row?.source || "liuzhou-pronunciation-reference.csv"),
        };
      })
    );
  const matches = combinedRows.filter(function (row) {
    const dialectWord = normalizeText(row?.dialectWord);
    const meaning = normalizeText(row?.meaning);
    const aliases = normalizeList(row?.aliases || [], 20);
    if (!hintText) {
      return false;
    }
    return (
      (dialectWord && hintText.indexOf(dialectWord) >= 0) ||
      (meaning && hintText.indexOf(meaning) >= 0) ||
      aliases.some(function (alias) {
        return hintText.indexOf(alias) >= 0;
      })
    );
  });
  const shortlist = (matches.length > 0 ? matches : combinedRows).slice(0, 24);
  return shortlist
    .map(function (row) {
      return {
        id: normalizeText(row?.id),
        dialectWord: normalizeText(row?.dialectWord || row?.display || row?.normalized),
        meaning: normalizeText(row?.meaning || row?.mandarin),
        aliases: normalizeList(row?.aliases || [], 20),
        notes: normalizeList(row?.notes || [], 20),
        tags: normalizeList(row?.tags || [], 20),
        pronunciation: normalizeText(row?.pronunciation),
        mandarinVariants: normalizeList(row?.mandarinVariants || [], 20),
        usageContext: normalizeText(row?.usageContext),
        source: normalizeText(row?.source),
      };
    })
    .filter(function (row) {
      return row.dialectWord || row.meaning;
    });
}

function buildMandarinDraftFromLexicon(assetsContext, dialectText) {
  const sourceText = normalizeAllowedPunctuation(dialectText);
  const rows = Array.isArray(assetsContext?.lexiconRows) ? assetsContext.lexiconRows : [];
  if (!sourceText || rows.length <= 0) {
    return sourceText;
  }
  const dictionary = rows
    .map(function (row) {
      return {
        dialectWord: normalizeText(row?.display || row?.normalized),
        meaning: normalizeText(row?.mandarin),
      };
    })
    .filter(function (row) {
      return row.dialectWord && row.meaning;
    })
    .sort(function (left, right) {
      return right.dialectWord.length - left.dialectWord.length;
    });
  if (dictionary.length <= 0) {
    return sourceText;
  }
  const segments = [];
  let cursor = 0;
  while (cursor < sourceText.length) {
    const matched = dictionary.find(function (row) {
      return sourceText.slice(cursor, cursor + row.dialectWord.length) === row.dialectWord;
    });
    if (matched) {
      segments.push(matched.meaning);
      cursor += matched.dialectWord.length;
      continue;
    }
    segments.push(sourceText.charAt(cursor));
    cursor += 1;
  }
  return normalizeAllowedPunctuation(segments.join("") || sourceText);
}

function buildPlainDialectTextFromTokens(tokens, fallbackText) {
  const sourceTokens = Array.isArray(tokens) ? tokens : [];
  if (sourceTokens.length <= 0) {
    return normalizeAllowedPunctuation(fallbackText);
  }
  return normalizeAllowedPunctuation(
    sourceTokens
      .map(function (token) {
        if (!token || typeof token !== "object") {
          return "";
        }
        if (token.type !== "tag") {
          return String(token.content || "");
        }
        const normalizedTag = normalizeSpecialTag(token.content);
        if (!normalizedTag) {
          return "";
        }
        return MANDARIN_PARTICLE_MAP[normalizedTag] || "";
      })
      .join("")
  );
}

function buildMandarinDraftForDialect(assetsContext, dialectText, dialectTokens) {
  return buildMandarinDraftFromLexicon(
    assetsContext,
    buildPlainDialectTextFromTokens(dialectTokens, dialectText)
  );
}

function buildMandarinParticleGuidesFromDialectTokens(tokens) {
  const source = Array.isArray(tokens) ? tokens : [];
  return source
    .map(function (token, index) {
      if (!token || token.type !== "tag") {
        return null;
      }
      const normalizedTag = normalizeSpecialTag(token.content);
      const particle = MANDARIN_PARTICLE_MAP[normalizedTag];
      if (!particle) {
        return null;
      }
      const previous = source[index - 1];
      const next = source[index + 1];
      const previousText = previous && previous.type === "text" ? String(previous.content || "") : "";
      const nextText = next && next.type === "text" ? String(next.content || "") : "";
      const previousAnchor = previousText.replace(TAG_ADJACENT_PUNCTUATION_PATTERN, "");
      const nextLeadingPunctuation = (nextText.match(TAG_LEADING_PUNCTUATION_PATTERN) || [""])[0];
      return {
        particle,
        previousAnchorTail: previousAnchor.slice(-12),
        nextLeadingPunctuation,
      };
    })
    .filter(Boolean);
}

function replaceFirstLiteral(text, searchValue, replacement) {
  const source = String(text || "");
  const target = String(searchValue || "");
  if (!target) {
    return source;
  }
  const index = source.indexOf(target);
  if (index < 0) {
    return source;
  }
  return source.slice(0, index) + String(replacement || "") + source.slice(index + target.length);
}

function restoreMandarinParticlesFromDialectTokens(text, dialectTokens) {
  const guides = buildMandarinParticleGuidesFromDialectTokens(dialectTokens);
  let result = normalizeAllowedPunctuation(text);
  guides.forEach(function (guide) {
    const particle = guide.particle;
    const previousAnchorTail = String(guide.previousAnchorTail || "");
    const nextLeadingPunctuation = String(guide.nextLeadingPunctuation || "");
    if (!previousAnchorTail) {
      const expectedPrefix = particle + nextLeadingPunctuation;
      if (result.startsWith(expectedPrefix) || result.startsWith(particle)) {
        return;
      }
      if (nextLeadingPunctuation && result.startsWith(nextLeadingPunctuation)) {
        result = particle + result;
        return;
      }
      result = expectedPrefix + result;
      return;
    }
    if (result.indexOf(previousAnchorTail + particle) >= 0) {
      return;
    }
    if (
      nextLeadingPunctuation &&
      result.indexOf(previousAnchorTail + nextLeadingPunctuation) >= 0
    ) {
      result = replaceFirstLiteral(
        result,
        previousAnchorTail + nextLeadingPunctuation,
        previousAnchorTail + particle + nextLeadingPunctuation
      );
      return;
    }
    if (result.indexOf(previousAnchorTail) >= 0) {
      result = replaceFirstLiteral(result, previousAnchorTail, previousAnchorTail + particle);
      return;
    }
    if (!result.startsWith(particle)) {
      result = particle + nextLeadingPunctuation + result;
    }
  });
  return normalizeAllowedPunctuation(result);
}

function attachStageExecutionMeta(error, stageName, requestModel, result, deps, stageStartedAt) {
  if (!error || typeof error !== "object") {
    return error;
  }
  const stage = normalizeText(stageName) === "refine" ? "refine" : "listen";
  const usageKey = stage;
  const modelKey = stage === "refine" ? "refineModel" : "listenModel";
  const timingKey = stage === "refine" ? "refineMs" : "listenMs";
  const usage = deps.normalizeUsage(result?.usage);
  error.usage = Object.assign({}, error.usage || {}, {
    [usageKey]: usage,
  });
  error.models = Object.assign({}, error.models || {}, {
    [modelKey]: normalizeText(result?.model) || normalizeText(requestModel),
  });
  error.timing = Object.assign({}, error.timing || {}, {
    [timingKey]: Math.max(0, deps.now() - stageStartedAt),
  });
  if (!error.rawResponse && result && typeof result === "object") {
    error.rawResponse = {
      rawText: String(result.rawText || ""),
      model: normalizeText(result.model) || normalizeText(requestModel),
      usage: usage,
      durationMs: Math.max(0, Math.round(toFiniteNumber(result.durationMs, 0))),
    };
  }
  return error;
}

function buildListenFailureFallback(rawModelText, assetsContext, options) {
  const rawText = normalizeText(rawModelText);
  if (!rawText) {
    return null;
  }
  const source = options && typeof options === "object" ? options : {};
  const normalized = normalizeListenStageOutput({
    audioDialectText: rawText,
    specialTags: source.specialTags,
    notes: source.notes,
  });
  const mandarinDraft = buildMandarinDraftForDialect(
    assetsContext,
    normalized.audioDialectText,
    normalized.audioDialectTokens
  );
  return {
    audioDialectText: normalized.audioDialectText,
    audioDialectTokens: Array.isArray(normalized.audioDialectTokens)
      ? normalized.audioDialectTokens.slice()
      : [],
    candidateAlternatives: [],
    audioMandarinText: mandarinDraft,
    refinedDialectText: normalized.audioDialectText,
    refinedDialectTokens: Array.isArray(normalized.audioDialectTokens)
      ? normalized.audioDialectTokens.slice()
      : [],
    refinedMandarinText: mandarinDraft,
    dialectText: normalized.audioDialectText,
    mandarinText: mandarinDraft,
    specialTags: normalizeSpecialTags(
      [].concat(source.specialTags || [], normalized.specialTags || [])
    ),
    needHumanReview: true,
    notes: appendRequiredNotes(
      [].concat(source.notes || [], normalized.notes || []),
      [RECOMMEND_FAILURE_FALLBACK_NOTE]
    ),
  };
}

function buildRefineFailureFallback(listenResult, assetsContext, options) {
  const source = options && typeof options === "object" ? options : {};
  const heardDialectText = normalizeAllowedPunctuation(listenResult?.audioDialectText || "");
  const heardDialectTokens = Array.isArray(listenResult?.audioDialectTokens)
    ? listenResult.audioDialectTokens.slice()
    : [];
  const mandarinDraft = normalizeAllowedPunctuation(
    listenResult?.mandarinDraft ||
      buildMandarinDraftForDialect(assetsContext, heardDialectText, heardDialectTokens)
  );
  return {
    audioDialectText: heardDialectText,
    audioDialectTokens: heardDialectTokens,
    candidateAlternatives: mergeCandidateAlternatives([], listenResult, assetsContext, heardDialectText, mandarinDraft),
    audioMandarinText: mandarinDraft,
    refinedDialectText: heardDialectText,
    refinedDialectTokens: heardDialectTokens.slice(),
    refinedMandarinText: mandarinDraft,
    dialectText: heardDialectText,
    mandarinText: mandarinDraft,
    specialTags: normalizeSpecialTags(
      [].concat(
        source.specialTags || [],
        listenResult?.specialTags || [],
        collectSpecialTagsFromTokens(heardDialectTokens)
      )
    ),
    needHumanReview: true,
    notes: appendRequiredNotes(
      [].concat(listenResult?.notes || [], source.notes || []),
      [RECOMMEND_FAILURE_FALLBACK_NOTE]
    ),
  };
}

function buildRulesExcerpt(assetsContext) {
  return String(assetsContext?.rulesText || "")
    .split(/\r?\n/)
    .slice(0, 60)
    .join("\n");
}

function buildListenPrompt(request, assetsContext) {
  const promptLines = [];
  if (request.aiStages?.listen?.includeLexiconReference === true) {
    const lexiconContext = buildRelevantLexiconContext(assetsContext, [
      request.fieldContext?.dialectText,
      request.fieldContext?.mandarinText,
      request.editorContext?.selectedEntry?.name,
    ]);
    promptLines.push("词表参考（只作辅助，不可压过听音）：");
    promptLines.push(JSON.stringify(lexiconContext, null, 2));
  }
  promptLines.push("请仅根据当前段音频输出 JSON。");
  return {
    systemPrompt: appendPromptRequirements(
      request.aiStages?.listen?.prompt || DEFAULT_LISTEN_PROMPT,
      [
        "candidatePhrases 最多 3 个；若无明显近音歧义则返回空数组。",
        "有效标签只允许：#um、#hmm、#ah、#eh、<SPK/>、<NPS/>。",
        "独立口语词“呃/诶/欸”优先写为 #eh，“啊”优先写为 #ah，“嗯”优先写为 #um。",
        "主说话人的笑声或明显非语义人声优先写为 <SPK/>。",
        "如果标签前后同时出现标点，只保留标签后的标点。",
      ]
    ),
    userPrompt: promptLines.join("\n"),
  };
}

function buildRefinePrompt(request, assetsContext, listenResult) {
  const mandarinDraft = normalizeAllowedPunctuation(
    listenResult.mandarinDraft ||
      buildMandarinDraftForDialect(
        assetsContext,
        listenResult.audioDialectText,
        listenResult.audioDialectTokens
      )
  );
  const lexiconContext = buildRelevantLexiconContext(assetsContext, [
    listenResult.audioDialectText,
    [].concat(listenResult.candidatePhrases || []).join(" "),
    mandarinDraft,
    request.fieldContext?.dialectText,
    request.fieldContext?.mandarinText,
    request.editorContext?.selectedEntry?.name,
  ]);
  return {
    systemPrompt: appendPromptRequirements(
      request.aiStages?.refine?.prompt || DEFAULT_REFINE_PROMPT,
      [
        "refinedDialectText 有效标签只允许：#um、#hmm、#ah、#eh、<SPK/>、<NPS/>。",
        "refinedMandarinText 必须是纯文本，禁止输出标签。",
        "如果 refinedDialectText 保留了口语词标签，refinedMandarinText 必须保留对应纯文本语气词。",
        "笑声或明显非语义噪音在 refinedMandarinText 里必须删除，不写标签，也不写“呵呵呵”等字面笑声。",
        "如果标签前后同时出现标点，只保留标签后的标点。",
      ]
    ),
    userPrompt: [
      "项目规则摘要：",
      buildRulesExcerpt(assetsContext),
      "词表命中参考：",
      JSON.stringify(lexiconContext, null, 2),
      "当前上下文：",
      JSON.stringify(
        {
          segment: {
            startMs: request.startMs,
            endMs: request.endMs,
            durationMs: request.durationMs,
          },
          audioDialectText: listenResult.audioDialectText,
          candidatePhrases: Array.isArray(listenResult.candidatePhrases)
            ? listenResult.candidatePhrases.slice()
            : [],
          mandarinDraft: mandarinDraft,
          fieldContext: request.fieldContext,
          selectedEntry: request.editorContext?.selectedEntry || null,
        },
        null,
        2
      ),
      "请同时输出 refinedDialectText、refinedMandarinText 和 candidateAlternatives。",
    ].join("\n"),
  };
}

function createHealthPayload(assetsContext) {
  const rows = Array.isArray(assetsContext?.lexiconRows) ? assetsContext.lexiconRows : [];
  return {
    success: true,
    route: "data-baker-cvpc/liuzhou-helper/ai/recommend",
    scriptId: SCRIPT_ID,
    defaults: {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      stages: buildStageDefaults(),
    },
    supportedModels: {
      listen: SUPPORTED_LISTEN_MODELS.slice(),
      refine: SUPPORTED_REFINE_MODELS.slice(),
    },
    reference: {
      lexiconRowCount: rows.length,
      lexiconStatus: normalizeText(assetsContext?.lexiconStatus || "missing"),
      lexiconWarning: normalizeText(assetsContext?.lexiconWarning || ""),
      lexiconSource: "liuzhou-lexicon.json",
      lexiconReferenceSource: "liuzhou-pronunciation-reference.csv",
      rulesSource: "liuzhou-rules.md",
    },
    contract: {
      writeContractCaptured: false,
      fillMode: "manual-confirm",
      stages: ["listen", "refine"],
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
      stages: buildStageDefaults(),
    },
    supportedModels: {
      listen: SUPPORTED_LISTEN_MODELS.slice(),
      refine: SUPPORTED_REFINE_MODELS.slice(),
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
      enable_thinking: false,
    },
    pricing: Object.assign({}, PRICING_SUMMARY),
  };
}

function createRuntimeDeps(overrides) {
  const source = overrides && typeof overrides === "object" ? overrides : {};
  return {
    now: typeof source.now === "function" ? source.now : Date.now,
    parseModelJsonText:
      typeof source.parseModelJsonText === "function" ? source.parseModelJsonText : parseModelJsonText,
    normalizeUsage:
      typeof source.normalizeUsage === "function" ? source.normalizeUsage : normalizeUsage,
    requestOmniInputAudio:
      typeof source.requestOmniInputAudio === "function" ? source.requestOmniInputAudio : requestOmniInputAudio,
    requestTextCompareJson:
      typeof source.requestTextCompareJson === "function" ? source.requestTextCompareJson : requestTextCompareJson,
  };
}

async function runListenStage(request, assetsContext, deps) {
  const stageStartedAt = deps.now();
  const result = await deps.requestOmniInputAudio(
    {
      audioUrl: request.audioUrl,
      audioDataUrl: request.audioDataUrl,
      aiOptions: request.aiStages.listen.params,
    },
    buildListenPrompt(request, assetsContext),
    {
      model: request.listenModel,
      timeoutMs: request.timeoutMs,
    }
  );
  let parsed;
  try {
    parsed = deps.parseModelJsonText(result.rawText || "", {
      requestId: request.requestId || "liuzhou-cvpc",
      stage: "listen",
    });
  } catch (error) {
    attachStageExecutionMeta(error, "listen", request.listenModel, result, deps, stageStartedAt);
    throw error;
  }
  const normalized = normalizeListenStageOutput(parsed);
  return {
    audioDialectText: normalized.audioDialectText,
    audioDialectTokens: normalized.audioDialectTokens,
    candidatePhrases: Array.isArray(normalized.candidatePhrases) ? normalized.candidatePhrases.slice() : [],
    audioMandarinText: "",
    specialTags: normalized.specialTags,
    needHumanReview: normalized.needHumanReview,
    notes: normalized.notes,
    timing: {
      listenMs: Math.max(0, deps.now() - stageStartedAt),
    },
    models: {
      listenModel: normalizeText(result.model) || request.listenModel,
    },
    usage: {
      listen: deps.normalizeUsage(result.usage),
    },
  };
}

async function runRefineStage(request, assetsContext, listenResult, deps) {
  const stageStartedAt = deps.now();
  const mandarinDraft = normalizeAllowedPunctuation(
    listenResult.mandarinDraft ||
      buildMandarinDraftForDialect(
        assetsContext,
        listenResult.audioDialectText,
        listenResult.audioDialectTokens
      )
  );
  const result = await deps.requestTextCompareJson(
    {
      pageText: request.fieldContext?.dialectText || "",
      heardText: listenResult.audioDialectText,
      mandarinDraft: mandarinDraft,
      aiOptions: request.aiStages.refine.params,
    },
    buildRefinePrompt(request, assetsContext, listenResult),
    {
      model: request.refineModel,
      timeoutMs: request.timeoutMs,
      stage: "refine",
    }
  );
  let parsed;
  try {
    parsed = deps.parseModelJsonText(result.rawText || "", {
      requestId: request.requestId || "liuzhou-cvpc",
      stage: "refine",
    });
  } catch (error) {
    attachStageExecutionMeta(error, "refine", request.refineModel, result, deps, stageStartedAt);
    throw error;
  }
  const normalized = normalizeRefineStageOutput(parsed);
  const refinedDialectText = normalizeAllowedPunctuation(
    normalized.refinedDialectText || listenResult.audioDialectText
  );
  const refinedMandarinText = normalizeAllowedPunctuation(
    normalized.refinedMandarinText || mandarinDraft
  );
  const candidateAlternatives = mergeCandidateAlternatives(
    normalized.candidateAlternatives,
    listenResult,
    assetsContext,
    refinedDialectText,
    refinedMandarinText
  );
  return {
    refinedDialectText,
    refinedDialectTokens: normalized.refinedDialectTokens,
    refinedMandarinText,
    candidateAlternatives,
    specialTags: normalized.specialTags,
    needHumanReview:
      normalized.needHumanReview === true ||
      candidateAlternatives.length > 0 ||
      !refinedDialectText ||
      !refinedMandarinText,
    notes: normalized.notes,
    timing: {
      refineMs: Math.max(0, deps.now() - stageStartedAt),
    },
    models: {
      refineModel: normalizeText(result.model) || request.refineModel,
    },
    usage: {
      refine: deps.normalizeUsage(result.usage),
    },
  };
}

async function recommend(request, assetsContext, overrides) {
  const deps = createRuntimeDeps(overrides);
  const startedAt = deps.now();
  const normalizedAssetsContext = assetsContext || {};
  let listenResult = null;
  try {
    listenResult = await runListenStage(request, normalizedAssetsContext, deps);
    listenResult.mandarinDraft = buildMandarinDraftForDialect(
      normalizedAssetsContext,
      listenResult.audioDialectText,
      listenResult.audioDialectTokens
    );
    const refineResult = await runRefineStage(
      request,
      normalizedAssetsContext,
      listenResult,
      deps
    );
    const audioDialectText = normalizeAllowedPunctuation(listenResult.audioDialectText);
    const refinedDialectText = normalizeAllowedPunctuation(
      refineResult.refinedDialectText || listenResult.audioDialectText
    );
    const refinedMandarinText = normalizeAllowedPunctuation(
      refineResult.refinedMandarinText || listenResult.mandarinDraft
    );
    const models = Object.assign({}, listenResult.models || {}, refineResult.models || {});
    const usage = Object.assign({}, listenResult.usage || {}, refineResult.usage || {});
    const lexicon = buildRecommendLexiconMeta(normalizedAssetsContext, request);
    return {
      audioDialectText,
      audioDialectTokens: Array.isArray(listenResult.audioDialectTokens)
        ? listenResult.audioDialectTokens.slice()
        : [],
      audioMandarinText: refinedMandarinText,
      refinedDialectText,
      refinedDialectTokens: Array.isArray(refineResult.refinedDialectTokens)
        ? refineResult.refinedDialectTokens.slice()
        : [],
      refinedMandarinText,
      dialectText: refinedDialectText,
      mandarinText: refinedMandarinText,
      candidateAlternatives: Array.isArray(refineResult.candidateAlternatives)
        ? refineResult.candidateAlternatives.slice()
        : [],
      specialTags: normalizeSpecialTags(
        [].concat(refineResult.specialTags || [], listenResult.specialTags || [])
      ),
      needHumanReview:
        listenResult.needHumanReview === true ||
        refineResult.needHumanReview === true ||
        (Array.isArray(refineResult.candidateAlternatives) &&
          refineResult.candidateAlternatives.length > 0) ||
        !audioDialectText ||
        !refinedDialectText ||
        !refinedMandarinText,
      notes: normalizeNotes([].concat(listenResult.notes || [], refineResult.notes || [])),
      timing: Object.assign({}, listenResult.timing || {}, refineResult.timing || {}, {
        totalMs: Math.max(0, deps.now() - startedAt),
      }),
      models,
      usage,
      cost: buildRecommendCost(models, usage),
      lexicon,
    };
  } catch (error) {
    const currentError =
      error && typeof error === "object"
        ? error
        : new Error(String(error || "柳州话 AI 推荐失败。"));
    if (listenResult) {
      currentError.models = Object.assign({}, listenResult.models || {}, currentError.models || {});
      currentError.usage = Object.assign({}, listenResult.usage || {}, currentError.usage || {});
      currentError.timing = Object.assign({}, listenResult.timing || {}, currentError.timing || {});
    }
    currentError.cost = buildRecommendCost(currentError.models, currentError.usage);
    if (currentError.code === "model-json-parse-failed") {
      const fallback = listenResult
        ? buildRefineFailureFallback(listenResult, normalizedAssetsContext, {
            specialTags: currentError.specialTags,
            notes: currentError.notes,
          })
        : buildListenFailureFallback(
            currentError.rawModelText || currentError.debugRawJson?.rawModelText,
            normalizedAssetsContext,
            {
              specialTags: currentError.specialTags,
              notes: currentError.notes,
            }
          );
      if (fallback) {
        Object.assign(currentError, fallback);
      }
    }
    currentError.timing = Object.assign({}, currentError.timing || {}, {
      totalMs: Math.max(0, deps.now() - startedAt),
    });
    throw currentError;
  }
}

function buildRecommendLexiconMeta(assetsContext, normalizedRequest) {
  const source = assetsContext && typeof assetsContext === "object" ? assetsContext : {};
  const request = normalizedRequest && typeof normalizedRequest === "object" ? normalizedRequest : {};
  return {
    status: normalizeText(source.lexiconStatus || "missing") || "missing",
    source: "json",
    sourceFile: path.basename("liuzhou-lexicon.json"),
    referenceSourceFile: path.basename("liuzhou-pronunciation-reference.csv"),
    rowCount: Array.isArray(source.lexiconRows) ? source.lexiconRows.length : 0,
    warningMessage: normalizeText(source.lexiconWarning || ""),
    listenReferenceEnabled: request.aiStages?.listen?.includeLexiconReference === true,
  };
}

function buildRecommendSuccessBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const result =
    source.data && typeof source.data === "object"
      ? source.data
      : source.execution?.projectResult || {};
  const body = {
    success: true,
    requestId: normalizeText(source.requestId || source.normalizedRequest?.requestId),
    audioDialectText: normalizeText(result.audioDialectText),
    audioDialectTokens: Array.isArray(result.audioDialectTokens) ? result.audioDialectTokens.slice() : [],
    audioMandarinText: normalizeText(result.audioMandarinText || result.refinedMandarinText || result.mandarinText),
    refinedDialectText: normalizeText(result.refinedDialectText || result.dialectText),
    refinedDialectTokens: Array.isArray(result.refinedDialectTokens) ? result.refinedDialectTokens.slice() : [],
    refinedMandarinText: normalizeText(result.refinedMandarinText || result.mandarinText || result.audioMandarinText),
    dialectText: normalizeText(result.refinedDialectText || result.dialectText),
    mandarinText: normalizeText(result.refinedMandarinText || result.mandarinText || result.audioMandarinText),
    candidateAlternatives: normalizeCandidateAlternatives(result.candidateAlternatives),
    specialTags: normalizeList(result.specialTags, 8),
    needHumanReview: result.needHumanReview === true,
    notes: normalizeNotes(result.notes),
    timing: result.timing && typeof result.timing === "object" ? result.timing : {},
    models: result.models && typeof result.models === "object" ? result.models : {},
    usage: result.usage && typeof result.usage === "object" ? result.usage : {},
    lexicon:
      result.lexicon && typeof result.lexicon === "object"
        ? {
            status: normalizeText(result.lexicon.status || "missing") || "missing",
            source: normalizeText(result.lexicon.source || "json") || "json",
            sourceFile: normalizeText(result.lexicon.sourceFile || "liuzhou-lexicon.json"),
            referenceSourceFile: normalizeText(
              result.lexicon.referenceSourceFile || "liuzhou-pronunciation-reference.csv"
            ),
            rowCount: Number(result.lexicon.rowCount || 0) || 0,
            warningMessage: normalizeText(result.lexicon.warningMessage || ""),
            listenReferenceEnabled: result.lexicon.listenReferenceEnabled === true,
          }
        : buildRecommendLexiconMeta(source.assetsContext, source.normalizedRequest),
  };
  if (result.cost && typeof result.cost === "object") {
    body.cost = result.cost;
  }
  return body;
}

function resolveRecommendErrorMessage(error) {
  const source = error && typeof error === "object" ? error : {};
  const providerCode = normalizeText(
    source.providerCode ||
      source.debugRawAiResponse?.providerCode ||
      source.rawResponse?.providerCode ||
      source.debugRawJson?.providerCode
  ).toLowerCase();
  const providerMessage = normalizeText(
    source.debugRawAiResponse?.error?.message ||
      source.rawResponse?.error?.message ||
      source.summary ||
      source.message
  ).toLowerCase();
  if (
    providerCode === "data_inspection_failed" ||
    providerMessage.indexOf("datainspectionfailed") >= 0 ||
    providerMessage.indexOf("inappropriate content") >= 0
  ) {
    return "Qwen 输出触发内容风控（内容审查拦截），请人工复核或重试。";
  }
  return normalizeText(source.safeMessage || source.message || "柳州话 AI 推荐失败。");
}

function buildRecommendErrorBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const error = source.error || {};
  const body = {
    success: false,
    requestId: normalizeText(source.requestId || error.requestId),
    code: normalizeText(error.code),
    message: resolveRecommendErrorMessage(error),
  };
  const rawResponse = normalizeErrorDebugObject(error.debugRawAiResponse || error.rawResponse);
  const debugRawJson = normalizeErrorDebugObject(error.debugRawJson);
  const usage = normalizeErrorDebugObject(error.usage);
  const models = normalizeErrorDebugObject(error.models);
  const timing = normalizeErrorDebugObject(error.timing);
  const cost = normalizeErrorDebugObject(error.cost);
  const specialTags = normalizeSpecialTags(error.specialTags);
  const notes = normalizeNotes(error.notes);
  const audioDialectText = normalizeText(
    error.audioDialectText || error.dialectText || error.refinedDialectText
  );
  const audioDialectTokens = Array.isArray(error.audioDialectTokens) ? error.audioDialectTokens.slice() : [];
  const audioMandarinText = normalizeText(
    error.audioMandarinText || error.refinedMandarinText || error.mandarinText
  );
  const refinedDialectText = normalizeText(
    error.refinedDialectText || error.dialectText || audioDialectText
  );
  const refinedDialectTokens = Array.isArray(error.refinedDialectTokens)
    ? error.refinedDialectTokens.slice()
    : audioDialectTokens.slice();
  const refinedMandarinText = normalizeText(
    error.refinedMandarinText || error.mandarinText || error.audioMandarinText
  );
  const dialectText = normalizeText(error.dialectText || refinedDialectText || audioDialectText);
  const mandarinText = normalizeText(
    error.mandarinText || refinedMandarinText || audioMandarinText
  );
  const candidateAlternatives = normalizeCandidateAlternatives(error.candidateAlternatives);
  if (rawResponse) {
    body.rawResponse = rawResponse;
  }
  if (debugRawJson) {
    body.debugRawJson = debugRawJson;
  }
  if (usage) {
    body.usage = usage;
  }
  if (models) {
    body.models = models;
  }
  if (timing) {
    body.timing = timing;
  }
  if (cost) {
    body.cost = cost;
  }
  if (specialTags.length > 0) {
    body.specialTags = specialTags;
  }
  if (error.needHumanReview === true || error.needHumanReview === false) {
    body.needHumanReview = error.needHumanReview === true;
  }
  if (notes.length > 0) {
    body.notes = notes;
  }
  if (candidateAlternatives.length > 0) {
    body.candidateAlternatives = candidateAlternatives;
  }
  body.audioDialectText = audioDialectText;
  body.audioDialectTokens = audioDialectTokens;
  body.audioMandarinText = audioMandarinText;
  body.refinedDialectText = refinedDialectText;
  body.refinedDialectTokens = refinedDialectTokens;
  body.refinedMandarinText = refinedMandarinText;
  body.dialectText = dialectText;
  body.mandarinText = mandarinText;
  return body;
}

module.exports = {
  DEFAULT_LISTEN_MODEL,
  DEFAULT_REFINE_MODEL,
  DEFAULT_TIMEOUT_MS,
  SCRIPT_ID,
  SUPPORTED_LISTEN_MODELS,
  SUPPORTED_REFINE_MODELS,
  SUPPORTED_SPECIAL_TAGS,
  __testOnly: {
    buildMandarinDraftFromLexicon,
    collectSpecialTagsFromTokens,
    normalizeFinalDialectStandardForms,
    normalizeAllowedPunctuation,
    normalizeInlineTaggedDialectText,
    normalizeListenStageOutput,
    normalizeRefineStageOutput,
    normalizeSpecialTags,
    smoothMandarinDisfluencies,
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
