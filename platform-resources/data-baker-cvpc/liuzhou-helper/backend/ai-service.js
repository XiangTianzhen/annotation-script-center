"use strict";

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
const DEFAULT_LISTEN_PROMPT = [
  "请严格只根据当前段音频输出原始柳州话听音结果。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：audioDialectText, specialTags, needHumanReview, notes。",
  "audioDialectText 只写音频里的柳州话文本，不要输出普通话，不要做修正，不要自由推断。",
  "听不清必须保守，并把 needHumanReview 设为 true。",
  "有效标签只允许：#um、#hmm、#ah、#eh、<SPK/>、<NPS/>。",
  "标签直接内联写在柳州话文本里，例如：都七十岁了#eh，明日古稀了。",
  "如果标签前后同时出现标点，只保留标签后的标点，不要输出“，#eh，”这种双侧标点。",
  "只允许使用中文句末标点：，。？！；不允许使用《》。",
].join("\n");
const DEFAULT_REFINE_PROMPT = [
  "请同时收口柳州话文本和普通话文本，但仍以听音结果与词表草稿为主。",
  "只输出 JSON，不要输出 Markdown、解释或多余文字。",
  "JSON 字段固定为：refinedDialectText, refinedMandarinText, needHumanReview, notes。",
  "你会收到原始听音柳州话、词表优先生成的普通话草稿、页面字段上下文和词表命中片段。",
  "只做标点、断句、明显错字和顺滑修正，不做自由改写，不要偏离词表含义。",
  "若拿不准或需要保留歧义，必须把 needHumanReview 设为 true。",
  "refinedDialectText 里的有效标签只允许：#um、#hmm、#ah、#eh、<SPK/>、<NPS/>。",
  "refinedMandarinText 必须是纯文本，禁止输出任何标签。",
  "如果标签前后同时出现标点，只保留标签后的标点，不要输出“，#eh，”这种双侧标点。",
  "只允许使用中文句末标点：，。？！；不允许使用《》。",
].join("\n");
let warnedLexiconReferenceOnly = false;

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

function pushTagToken(target, content) {
  const tag = normalizeSpecialTag(content);
  if (!tag) {
    return;
  }
  const list = Array.isArray(target) ? target : [];
  list.push({
    type: "tag",
    content: tag,
  });
}

function compactInlineTagTokens(tokens) {
  const result = [];
  (Array.isArray(tokens) ? tokens : []).forEach(function (token) {
    if (!token || typeof token !== "object") {
      return;
    }
    if (token.type === "tag") {
      pushTagToken(result, token.content);
      return;
    }
    pushTextToken(result, token.content);
  });
  return result.filter(function (token) {
    return normalizeText(token.content) || token.type === "tag" || String(token.content || "").length > 0;
  });
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
    pushTagToken(result, placeholderMap.get(matched[0]));
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
  const punctuationResult = normalizeTagAdjacentPunctuation(tokenized);
  const tokens = punctuationResult.tokens;
  const specialTags = normalizeSpecialTags(
    collectSpecialTagsFromTokens(tokens).concat(normalizeSpecialTags(extraTags))
  );
  return {
    text: joinInlineTagTokens(tokens),
    tokens,
    specialTags,
    removedUnsupportedTags: unsupportedTags,
    fixedAdjacentPunctuation: punctuationResult.changed,
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
  return {
    text: normalizeAllowedPunctuation(withoutTags),
    removedTags,
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
    audioDialectTokens: normalizedDialect.tokens,
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
  const notes = appendRequiredNotes(
    source.notes,
    buildTagNormalizationNotes(normalizedDialect, {
      removedMandarinTags: normalizedMandarin.removedTags,
    })
  );
  return {
    refinedDialectText: normalizedDialect.text,
    refinedDialectTokens: normalizedDialect.tokens,
    refinedMandarinText: normalizedMandarin.text,
    specialTags: normalizedDialect.specialTags,
    needHumanReview:
      source.needHumanReview === true ||
      !normalizedDialect.text ||
      !normalizedMandarin.text ||
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
      };
    })
    .filter(function (row) {
      return row.normalized && row.display && row.mandarin;
    });
}

function buildAssetsContext(assets) {
  const source = assets && typeof assets === "object" ? assets : {};
  let lexiconRows = [];
  let lexiconStatus = "missing";
  let lexiconWarning = "";
  const hasReferenceCsv = normalizeText(source.lexiconReferenceCsv).length > 0;
  try {
    if (source.lexiconJson) {
      lexiconRows = buildLexiconRows(source.lexiconJson);
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
    lexiconStatus,
    lexiconWarning,
  };
}

function buildRelevantLexiconContext(assetsContext, hintTexts) {
  const rows = Array.isArray(assetsContext?.lexiconRows) ? assetsContext.lexiconRows : [];
  const hintText = (Array.isArray(hintTexts) ? hintTexts : [])
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
  const matches = rows.filter(function (row) {
    const dialectWord = normalizeText(row?.display || row?.normalized);
    const meaning = normalizeText(row?.mandarin);
    if (!hintText) {
      return false;
    }
    return (
      (dialectWord && hintText.indexOf(dialectWord) >= 0) ||
      (meaning && hintText.indexOf(meaning) >= 0)
    );
  });
  const shortlist = (matches.length > 0 ? matches : rows).slice(0, 24);
  return shortlist
    .map(function (row) {
      return {
        id: normalizeText(row?.id),
        dialectWord: normalizeText(row?.display || row?.normalized),
        meaning: normalizeText(row?.mandarin),
        aliases: normalizeList(row?.aliases || [], 20),
        notes: normalizeList(row?.notes || [], 20),
        tags: normalizeList(row?.tags || [], 20),
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
        "有效标签只允许：#um、#hmm、#ah、#eh、<SPK/>、<NPS/>。",
        "如果标签前后同时出现标点，只保留标签后的标点。",
      ]
    ),
    userPrompt: promptLines.join("\n"),
  };
}

function buildRefinePrompt(request, assetsContext, listenResult) {
  const mandarinDraft = normalizeAllowedPunctuation(
    listenResult.mandarinDraft ||
      buildMandarinDraftFromLexicon(assetsContext, listenResult.audioDialectText)
  );
  const lexiconContext = buildRelevantLexiconContext(assetsContext, [
    listenResult.audioDialectText,
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
          mandarinDraft: mandarinDraft,
          fieldContext: request.fieldContext,
          selectedEntry: request.editorContext?.selectedEntry || null,
        },
        null,
        2
      ),
      "请同时输出 refinedDialectText 与 refinedMandarinText。",
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
  const parsed = deps.parseModelJsonText(result.rawText || "", {
    requestId: request.requestId || "liuzhou-cvpc",
    stage: "listen",
  });
  const normalized = normalizeListenStageOutput(parsed);
  return {
    audioDialectText: normalized.audioDialectText,
    audioDialectTokens: normalized.audioDialectTokens,
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
      buildMandarinDraftFromLexicon(assetsContext, listenResult.audioDialectText)
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
  const parsed = deps.parseModelJsonText(result.rawText || "", {
    requestId: request.requestId || "liuzhou-cvpc",
    stage: "refine",
  });
  const normalized = normalizeRefineStageOutput(parsed);
  const refinedDialectText = normalizeAllowedPunctuation(
    normalized.refinedDialectText || listenResult.audioDialectText
  );
  const refinedMandarinText = normalizeAllowedPunctuation(
    normalized.refinedMandarinText || mandarinDraft
  );
  return {
    refinedDialectText,
    refinedDialectTokens: normalized.refinedDialectTokens,
    refinedMandarinText,
    specialTags: normalized.specialTags,
    needHumanReview:
      normalized.needHumanReview === true || !refinedDialectText || !refinedMandarinText,
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
  const listenResult = await runListenStage(request, assetsContext || {}, deps);
  listenResult.mandarinDraft = buildMandarinDraftFromLexicon(
    assetsContext || {},
    listenResult.audioDialectText
  );
  const refineResult = await runRefineStage(request, assetsContext || {}, listenResult, deps);
  const audioDialectText = normalizeAllowedPunctuation(listenResult.audioDialectText);
  const refinedDialectText = normalizeAllowedPunctuation(
    refineResult.refinedDialectText || listenResult.audioDialectText
  );
  const refinedMandarinText = normalizeAllowedPunctuation(
    refineResult.refinedMandarinText || listenResult.mandarinDraft
  );
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
    specialTags: normalizeSpecialTags(
      [].concat(refineResult.specialTags || [], listenResult.specialTags || [])
    ),
    needHumanReview:
      listenResult.needHumanReview === true ||
      refineResult.needHumanReview === true ||
      !audioDialectText ||
      !refinedDialectText ||
      !refinedMandarinText,
    notes: normalizeNotes([].concat(listenResult.notes || [], refineResult.notes || [])),
    timing: Object.assign({}, listenResult.timing || {}, refineResult.timing || {}, {
      totalMs: Math.max(0, deps.now() - startedAt),
    }),
    models: Object.assign({}, listenResult.models || {}, refineResult.models || {}),
    usage: Object.assign({}, listenResult.usage || {}, refineResult.usage || {}),
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
    audioDialectText: normalizeText(result.audioDialectText),
    audioDialectTokens: Array.isArray(result.audioDialectTokens) ? result.audioDialectTokens.slice() : [],
    audioMandarinText: normalizeText(result.audioMandarinText || result.refinedMandarinText || result.mandarinText),
    refinedDialectText: normalizeText(result.refinedDialectText || result.dialectText),
    refinedDialectTokens: Array.isArray(result.refinedDialectTokens) ? result.refinedDialectTokens.slice() : [],
    refinedMandarinText: normalizeText(result.refinedMandarinText || result.mandarinText || result.audioMandarinText),
    dialectText: normalizeText(result.refinedDialectText || result.dialectText),
    mandarinText: normalizeText(result.refinedMandarinText || result.mandarinText || result.audioMandarinText),
    specialTags: normalizeList(result.specialTags, 8),
    needHumanReview: result.needHumanReview === true,
    notes: normalizeNotes(result.notes),
    timing: result.timing && typeof result.timing === "object" ? result.timing : {},
    models: result.models && typeof result.models === "object" ? result.models : {},
    usage: result.usage && typeof result.usage === "object" ? result.usage : {},
  };
}

function buildRecommendErrorBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const error = source.error || {};
  const body = {
    success: false,
    requestId: normalizeText(source.requestId || error.requestId),
    code: normalizeText(error.code),
    message: normalizeText(error.safeMessage || error.message || "柳州话 AI 推荐失败。"),
  };
  const rawResponse = normalizeErrorDebugObject(error.debugRawAiResponse || error.rawResponse);
  const debugRawJson = normalizeErrorDebugObject(error.debugRawJson);
  const usage = normalizeErrorDebugObject(error.usage);
  const models = normalizeErrorDebugObject(error.models);
  const timing = normalizeErrorDebugObject(error.timing);
  const specialTags = normalizeSpecialTags(error.specialTags);
  const notes = normalizeNotes(error.notes);
  const audioDialectText = normalizeText(error.audioDialectText || error.dialectText);
  const audioDialectTokens = Array.isArray(error.audioDialectTokens) ? error.audioDialectTokens.slice() : [];
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
  if (specialTags.length > 0) {
    body.specialTags = specialTags;
  }
  if (error.needHumanReview === true || error.needHumanReview === false) {
    body.needHumanReview = error.needHumanReview === true;
  }
  if (notes.length > 0) {
    body.notes = notes;
  }
  if (audioDialectText) {
    body.audioDialectText = audioDialectText;
  }
  if (audioDialectTokens.length > 0) {
    body.audioDialectTokens = audioDialectTokens;
  }
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
    normalizeAllowedPunctuation,
    normalizeInlineTaggedDialectText,
    normalizeListenStageOutput,
    normalizeRefineStageOutput,
    normalizeSpecialTags,
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
