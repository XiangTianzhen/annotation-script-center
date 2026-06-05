"use strict";

const {
  requestOmniInputAudio,
} = require("../../../backend/ai/providers/qwen-openai-compatible");
const {
  ensureChineseSentencePunctuation,
  parseLexiconCsv,
  parseModelJsonText,
} = require("../../../data-baker/round-one-quality/backend/ai-service");

const SCRIPT_ID = "dataBakerCvpcLiuzhouAssistant";
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_OMNI_MODEL = "qwen3.5-omni-flash";
const SUPPORTED_SPECIAL_TAGS = [
  "#um",
  "#hmm",
  "#ah",
  "#eh",
  "<SPK/>",
  "<NPS/>",
  "<Unintelligible>",
  "<Meaningless>",
];

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
  (Array.isArray(value) ? value : []).forEach(function (item) {
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
  return SUPPORTED_SPECIAL_TAGS.indexOf(text) >= 0 ? text : "";
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

function normalizeNotes(value) {
  return normalizeList(
    (Array.isArray(value) ? value : [value]).map(function (item) {
      return normalizeLineText(item);
    }),
    8
  );
}

function normalizeRecommendationOutput(value) {
  const source = value && typeof value === "object" ? value : {};
  const dialectText = normalizeAllowedPunctuation(source.dialectText || source.heardText || "");
  const mandarinText = normalizeAllowedPunctuation(source.mandarinText || source.translationText || "");
  const specialTags = normalizeSpecialTags(source.specialTags).concat(
    extractSupportedTagsFromText(dialectText),
    extractSupportedTagsFromText(mandarinText)
  );
  return {
    dialectText,
    mandarinText,
    specialTags: normalizeSpecialTags(specialTags),
    needHumanReview: source.needHumanReview === true,
    notes: normalizeNotes(source.notes),
  };
}

function normalizeRecommendRequest(body) {
  const source = body && typeof body === "object" ? body : {};
  const audioUrl = normalizeText(source.audioUrl);
  if (!audioUrl) {
    throw createHttpError(400, "缺少 audioUrl。", "missing-audio-url");
  }

  const startMs = Math.max(0, Math.round(toFiniteNumber(source.startMs, source.segment?.startMs || 0)));
  const endMs = Math.max(
    startMs,
    Math.round(toFiniteNumber(source.endMs, source.segment?.endMs || startMs))
  );

  return {
    audioUrl,
    startMs,
    endMs,
    durationMs: Math.max(0, endMs - startMs),
    fieldContext: source.fieldContext && typeof source.fieldContext === "object"
      ? source.fieldContext
      : {},
    editorContext: source.editorContext && typeof source.editorContext === "object"
      ? source.editorContext
      : {},
    requestId: normalizeText(source.requestId),
    aiUsageOperatorName: normalizeText(source.aiUsageOperatorName),
    platformUserName: normalizeText(source.platformUserName),
    platformUserId: normalizeText(source.platformUserId),
    timeoutMs: Math.max(1000, Math.min(300000, Math.round(toFiniteNumber(source.timeoutMs, DEFAULT_TIMEOUT_MS)))),
    model: normalizeText(source.model) || DEFAULT_OMNI_MODEL,
  };
}

function buildLexiconRows(text) {
  try {
    return parseLexiconCsv(String(text || ""));
  } catch (_error) {
    return [];
  }
}

function buildAssetsContext(assets) {
  const source = assets && typeof assets === "object" ? assets : {};
  const lexiconRows = buildLexiconRows(source.lexiconCsv);
  return {
    rulesText: String(source.ruleText || "").trim(),
    lexiconRows,
  };
}

function buildRelevantLexiconContext(assetsContext, request) {
  const rows = Array.isArray(assetsContext?.lexiconRows) ? assetsContext.lexiconRows : [];
  const hintText = [
    request.fieldContext?.dialectText,
    request.fieldContext?.mandarinText,
    request.editorContext?.selectedEntry?.name,
  ]
    .map(normalizeText)
    .join(" ");
  const matches = rows.filter(function (row) {
    const reading = normalizeText(row?.["柳州话读音"]);
    const dialectWord = normalizeText(row?.["柳州字转写用字"]);
    const meaning = normalizeText(row?.["释义"]);
    if (!hintText) {
      return false;
    }
    return (
      (dialectWord && hintText.indexOf(dialectWord) >= 0) ||
      (meaning && hintText.indexOf(meaning) >= 0) ||
      (reading && hintText.indexOf(reading) >= 0)
    );
  });
  const shortlist = (matches.length > 0 ? matches : rows).slice(0, 24);
  return shortlist
    .map(function (row) {
      return {
        reading: normalizeText(row?.["柳州话读音"]),
        dialectWord: normalizeText(row?.["柳州字转写用字"]),
        meaning: normalizeText(row?.["释义"]),
      };
    })
    .filter(function (row) {
      return row.reading || row.dialectWord || row.meaning;
    });
}

function buildPrompt(request, assetsContext) {
  const lexiconContext = buildRelevantLexiconContext(assetsContext, request);
  const ruleExcerpt = String(assetsContext?.rulesText || "")
    .split(/\r?\n/)
    .slice(0, 60)
    .join("\n");
  return {
    systemPrompt: [
      "你是 DataBaker CVPC 柳州话标注助手。",
      "你必须只输出 JSON，不要输出 Markdown、解释或多余文字。",
      "你要输出的 JSON 字段固定为：dialectText, mandarinText, specialTags, needHumanReview, notes。",
      "dialectText 要按实际发音转写；mandarinText 要顺滑、删除结巴口误。",
      "只允许使用中文句末标点：，。？！",
      "不允许使用《》。",
      "可用特殊标签只有：#um, #hmm, #ah, #eh, <SPK/>, <NPS/>, <Unintelligible>, <Meaningless>。",
      "不确定时必须把 needHumanReview 设为 true。",
    ].join("\n"),
    userPrompt: [
      "项目规则摘要：",
      ruleExcerpt,
      "相关发音对照：",
      JSON.stringify(lexiconContext, null, 2),
      "当前上下文：",
      JSON.stringify(
        {
          segment: {
            startMs: request.startMs,
            endMs: request.endMs,
            durationMs: request.durationMs,
          },
          fieldContext: request.fieldContext,
          selectedEntry: request.editorContext?.selectedEntry || null,
        },
        null,
        2
      ),
      "请仅根据音频和这些规则输出 JSON。",
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
      model: DEFAULT_OMNI_MODEL,
      timeoutMs: DEFAULT_TIMEOUT_MS,
      punctuation: "，。？！",
      specialTags: SUPPORTED_SPECIAL_TAGS.slice(),
    },
    reference: {
      lexiconRowCount: rows.length,
      lexiconSource: "liuzhou-pronunciation-reference.csv",
      rulesSource: "liuzhou-rules.md",
    },
    contract: {
      writeContractCaptured: false,
      fillMode: "manual-confirm",
    },
  };
}

function createDefaultsPayload() {
  return {
    success: true,
    scriptId: SCRIPT_ID,
    defaults: {
      model: DEFAULT_OMNI_MODEL,
      timeoutMs: DEFAULT_TIMEOUT_MS,
      punctuation: "，。？！",
      specialTags: SUPPORTED_SPECIAL_TAGS.slice(),
    },
    supportedParams: {
      model: true,
      timeoutMs: true,
      temperature: true,
      top_p: true,
      max_tokens: true,
      enable_thinking: false,
    },
  };
}

async function recommend(request, assetsContext) {
  const prompt = buildPrompt(request, assetsContext || {});
  const result = await requestOmniInputAudio(
    {
      audioUrl: request.audioUrl,
      aiOptions: {
        temperature: 0.1,
        top_p: 0.8,
        max_tokens: 1200,
      },
    },
    prompt,
    {
      model: request.model || DEFAULT_OMNI_MODEL,
      timeoutMs: request.timeoutMs || DEFAULT_TIMEOUT_MS,
    }
  );
  const parsed = parseModelJsonText(result.rawText || "", request.requestId || "liuzhou-cvpc");
  const normalized = normalizeRecommendationOutput(parsed);
  return {
    dialectText: normalized.dialectText,
    mandarinText: normalized.mandarinText,
    specialTags: normalized.specialTags,
    needHumanReview: normalized.needHumanReview || !normalized.dialectText || !normalized.mandarinText,
    notes: normalized.notes,
    timing: {
      totalMs: Math.max(0, Math.round(toFiniteNumber(result.durationMs, 0))),
    },
    models: {
      omniModel: normalizeText(result.model) || DEFAULT_OMNI_MODEL,
    },
    raw: {
      rawTextLength: String(result.rawText || "").length,
    },
  };
}

function buildRecommendSuccessBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const result = source.data && typeof source.data === "object"
    ? source.data
    : source.execution?.projectResult || {};
  return {
    success: true,
    requestId: normalizeText(source.requestId || source.normalizedRequest?.requestId),
    dialectText: normalizeText(result.dialectText),
    mandarinText: normalizeText(result.mandarinText),
    specialTags: normalizeList(result.specialTags, 8),
    needHumanReview: result.needHumanReview === true,
    notes: normalizeNotes(result.notes),
    timing: result.timing && typeof result.timing === "object" ? result.timing : {},
    models: result.models && typeof result.models === "object" ? result.models : {},
  };
}

function buildRecommendErrorBody(context) {
  const source = context && typeof context === "object" ? context : {};
  const error = source.error || {};
  return {
    success: false,
    requestId: normalizeText(source.requestId || error.requestId),
    code: normalizeText(error.code),
    message: normalizeText(error.safeMessage || error.message || "柳州话 AI 推荐失败。"),
  };
}

module.exports = {
  DEFAULT_OMNI_MODEL,
  DEFAULT_TIMEOUT_MS,
  SCRIPT_ID,
  SUPPORTED_SPECIAL_TAGS,
  __testOnly: {
    normalizeAllowedPunctuation,
    normalizeRecommendationOutput,
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
