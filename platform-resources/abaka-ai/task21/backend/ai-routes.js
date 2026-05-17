"use strict";

const { sendJson } = require("../../../backend/response");
const { analyzeTask21, DEFAULT_MODEL, getClientConfig } = require("./ai-client");
const { buildUserPrompt, SYSTEM_PROMPT, TASK21_AI_RULE_VERSION, USER_PROMPT_TEMPLATE } = require("./prompt");
const { estimateUsageFromTexts, normalizeUsage } = require("./usage");

const AI_BASE_PATH = "/api/abaka-ai/task21/ai/analyze";
const AI_HEALTH_PATH = "/api/abaka-ai/task21/ai/health";
const AI_DEFAULTS_PATH = "/api/abaka-ai/task21/ai/defaults";
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const ALLOWED_TARGETS = ["same_font", "image_b_texts_removed", "other_changes", "overall"];
const ALLOWED_IMAGE_FIELDS = ["image_a", "image_b", "image_b_removed"];

function createRequestId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  const random = Math.random().toString(36).slice(2, 8);
  return "abaka-task21-" + yyyy + mm + dd + "-" + hh + mi + ss + ms + "-" + random;
}

function createHttpError(statusCode, code, message) {
  const error = new Error(String(message || "request-error"));
  error.statusCode = statusCode;
  error.code = String(code || "request-error");
  return error;
}

function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, "[url-redacted]")
    .replace(
      /(access_token|refresh_token|authorization|token|cookie|password|secret|signature|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[redacted]"
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength || 240);
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        reject(createHttpError(413, "payload-too-large", "请求体超过 20MB。"));
        request.destroy();
      }
    });
    request.on("end", function () {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function extractJsonObjectText(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    return "";
  }
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }
  return raw;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function normalizeTarget(value) {
  const text = String(value || "").trim();
  if (ALLOWED_TARGETS.indexOf(text) >= 0) {
    return text;
  }
  return "";
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeString(value, maxLength) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, maxLength || 6000);
}

function normalizeImageRecord(record) {
  const source = normalizeObject(record);
  const fieldName = String(source.fieldName || "").trim();
  const safeFieldName = ALLOWED_IMAGE_FIELDS.indexOf(fieldName) >= 0 ? fieldName : "";
  const dataUrl = String(source.dataUrl || "").trim();
  const imageUrl = String(source.imageUrl || "").trim();
  const mime = String(source.mime || "").trim().slice(0, 80) || "unknown";
  const width = Number(source.width);
  const height = Number(source.height);
  const bytes = Number(source.bytes);

  return {
    fieldName: safeFieldName,
    dataUrl: dataUrl,
    imageUrl: imageUrl,
    mime: mime,
    width: Number.isFinite(width) && width > 0 ? Math.floor(width) : "unknown",
    height: Number.isFinite(height) && height > 0 ? Math.floor(height) : "unknown",
    bytes: Number.isFinite(bytes) && bytes >= 0 ? Math.floor(bytes) : "unknown",
    sourceKind: dataUrl ? "dataUrl" : imageUrl ? "url" : "unknown",
  };
}

function normalizeImages(images) {
  const source = Array.isArray(images) ? images : [];
  const normalized = [];
  source.forEach(function (item) {
    const row = normalizeImageRecord(item);
    if (!row.fieldName) {
      return;
    }
    const duplicate = normalized.find(function (existing) {
      return existing.fieldName === row.fieldName;
    });
    if (!duplicate) {
      normalized.push(row);
    }
  });

  ALLOWED_IMAGE_FIELDS.forEach(function (fieldName) {
    if (!normalized.find(function (item) {
      return item.fieldName === fieldName;
    })) {
      normalized.push({
        fieldName,
        dataUrl: "",
        imageUrl: "",
        mime: "unknown",
        width: "unknown",
        height: "unknown",
        bytes: "unknown",
        sourceKind: "unknown",
      });
    }
  });

  return normalized;
}

function normalizeAnalyzeRequest(body) {
  const source = normalizeObject(body);
  const target = normalizeTarget(source.target);
  if (!target) {
    throw createHttpError(400, "unsupported-target", "target 不受支持。");
  }

  const context = normalizeObject(source.context);
  const currentValues = normalizeObject(context.currentValues);

  return {
    target,
    debug: source.debug === true,
    context: {
      imageATexts: normalizeString(context.imageATexts, 12000),
      imageBTexts: normalizeString(context.imageBTexts, 12000),
      textPositions: normalizeObject(context.textPositions),
      currentValues: {
        same_font: normalizeString(currentValues.same_font, 300),
        image_b_texts_removed: normalizeString(currentValues.image_b_texts_removed, 3000),
        other_changes: normalizeString(currentValues.other_changes, 3000),
      },
      route: normalizeObject(context.route),
    },
    images: normalizeImages(source.images),
  };
}

function sanitizeImageStats(images) {
  return images.map(function (item) {
    return {
      fieldName: item.fieldName,
      mime: item.mime || "unknown",
      width: item.width || "unknown",
      height: item.height || "unknown",
      bytes: item.bytes || "unknown",
      sourceKind: item.sourceKind || "unknown",
    };
  });
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
        .map(function (item) {
          return sanitizeText(item, 180);
        })
        .filter(Boolean)
        .slice(0, 12)
    : [];
}

function normalizeSameFontSection(section, target) {
  const source = normalizeObject(section);
  const defaultApplicable = target === "same_font" || target === "overall";
  const value = sanitizeText(source.value || (defaultApplicable ? "unsure" : "not_applicable"), 120);
  return {
    applicable: source.applicable !== false && defaultApplicable,
    value: value || (defaultApplicable ? "unsure" : "not_applicable"),
    confidence: Number.isFinite(Number(source.confidence)) ? Number(source.confidence) : 0,
    reason_cn: sanitizeText(source.reason_cn || "", 500),
    evidence: normalizeArray(source.evidence),
    warnings: normalizeArray(source.warnings),
  };
}

function normalizeRemovedSection(section, target) {
  const source = normalizeObject(section);
  const applicable = target !== "same_font";
  const valueType = sanitizeText(source.value_type || (applicable ? "blank" : "not_applicable"), 80);
  const value = String(source.value || "").slice(0, 6000);
  const lines = Array.isArray(source.lines)
    ? source.lines
        .map(function (line) {
          return String(line || "").trim();
        })
        .filter(Boolean)
        .slice(0, 200)
    : value
        .split(/\r?\n/)
        .map(function (line) {
          return String(line || "").trim();
        })
        .filter(Boolean)
        .slice(0, 200);

  return {
    applicable,
    value_type: valueType || (applicable ? "blank" : "not_applicable"),
    value,
    lines,
    segment_count: Number.isFinite(Number(source.segment_count))
      ? Math.max(0, Math.floor(Number(source.segment_count)))
      : lines.length,
    reason_cn: sanitizeText(source.reason_cn || "", 500),
    evidence: normalizeArray(source.evidence),
    warnings: normalizeArray(source.warnings),
  };
}

function normalizeOtherSection(section, target) {
  const source = normalizeObject(section);
  const applicable = target !== "same_font";
  const value = String(source.value || "").slice(0, 4000);
  return {
    applicable,
    value_type: sanitizeText(source.value_type || (applicable ? "blank" : "not_applicable"), 80),
    value,
    word_count: Number.isFinite(Number(source.word_count))
      ? Math.max(0, Math.floor(Number(source.word_count)))
      : 0,
    reason_cn: sanitizeText(source.reason_cn || "", 500),
    evidence: normalizeArray(source.evidence),
    warnings: normalizeArray(source.warnings),
  };
}

function normalizeWorkflowSection(section) {
  const source = normalizeObject(section);
  return {
    skip_later_fields: source.skip_later_fields === true,
    skip_reason: sanitizeText(source.skip_reason || "", 300),
  };
}

function normalizeResultSchema(target, parsed) {
  const source = normalizeObject(parsed);
  return {
    target,
    same_font: normalizeSameFontSection(source.same_font, target),
    image_b_texts_removed: normalizeRemovedSection(source.image_b_texts_removed, target),
    other_changes: normalizeOtherSection(source.other_changes, target),
    workflow: normalizeWorkflowSection(source.workflow),
  };
}

function buildHealthResponse() {
  const config = getClientConfig();
  return {
    success: true,
    service: "abaka-ai-task21-ai-analysis",
    ruleVersion: TASK21_AI_RULE_VERSION,
    status: config.mockEnabled || config.hasApiKey ? "ready" : "missing-api-key",
    mockEnabled: config.mockEnabled,
    hasApiKey: config.hasApiKey,
    model: config.model || DEFAULT_MODEL,
    timeoutMs: config.timeoutMs,
    allowClientModelOverride: config.allowClientModelOverride === true,
  };
}

function buildDefaultsResponse() {
  const config = getClientConfig();
  return {
    success: true,
    service: "abaka-ai-task21-ai-analysis",
    scriptId: "abakaAiTaskPageCapture",
    defaults: {
      model: config.model || DEFAULT_MODEL,
      timeoutMs: config.timeoutMs,
      debug: true,
      systemPrompt: SYSTEM_PROMPT,
      userPromptTemplate: USER_PROMPT_TEMPLATE,
    },
    notes: {
      promptOverride: "本接口仅返回后端默认 Prompt 模板，前端不保存 API Key。",
      safety: "AI 仅返回建议，不自动写入/保存/提交。",
    },
  };
}

async function handleAnalyze(request, response) {
  const startedAt = Date.now();
  let requestId = createRequestId();
  try {
    const rawBody = await readRequestBody(request);
    const jsonBody = safeParseJson(rawBody || "{}");
    if (!jsonBody) {
      throw createHttpError(400, "invalid-json", "请求体 JSON 解析失败。 ");
    }

    const normalizedRequest = normalizeAnalyzeRequest(jsonBody);
    const config = getClientConfig();
    if (!config.mockEnabled && !config.hasApiKey) {
      throw createHttpError(503, "missing-api-key", "后端缺少 DASHSCOPE_API_KEY。可先开启 ABAKA_TASK21_AI_MOCK=1 调试。");
    }

    const promptInput = {
      target: normalizedRequest.target,
      context: normalizedRequest.context,
    };

    const userPrompt = buildUserPrompt(promptInput);
    const aiResponse = await analyzeTask21(
      {
        target: normalizedRequest.target,
        context: normalizedRequest.context,
        images: normalizedRequest.images,
      },
      {
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
      },
      {
        timeoutMs: config.timeoutMs,
      }
    );

    const rawText = extractJsonObjectText(aiResponse.rawText || "");
    const parsedResult = safeParseJson(rawText);
    if (!parsedResult) {
      throw createHttpError(502, "provider-invalid-json", "模型返回非 JSON，无法解析。");
    }

    const normalizedResult = normalizeResultSchema(normalizedRequest.target, parsedResult);
    const usage = aiResponse.usage
      ? normalizeUsage(aiResponse.usage, { source: "provider" })
      : normalizeUsage(estimateUsageFromTexts(userPrompt, rawText), { source: "estimated" });

    sendJson(response, 200, {
      success: true,
      requestId,
      target: normalizedRequest.target,
      model: aiResponse.model || config.model || DEFAULT_MODEL,
      elapsedMs: Date.now() - startedAt,
      result: normalizedResult,
      usage,
      imageStats: sanitizeImageStats(normalizedRequest.images),
      warnings: normalizeArray(normalizedResult.same_font.warnings)
        .concat(normalizeArray(normalizedResult.image_b_texts_removed.warnings))
        .concat(normalizeArray(normalizedResult.other_changes.warnings)),
      mock: aiResponse.mock === true,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    sendJson(response, statusCode, {
      success: false,
      requestId,
      code: String(error?.code || "internal-error"),
      message: sanitizeText(error?.message || "Task21 AI analyze 请求失败。", 260),
      elapsedMs: Date.now() - startedAt,
    });
  }
}

function registerAiRoutes(router) {
  router.get(AI_HEALTH_PATH, function ({ response }) {
    sendJson(response, 200, buildHealthResponse());
  });

  router.get(AI_DEFAULTS_PATH, function ({ response }) {
    sendJson(response, 200, buildDefaultsResponse());
  });

  router.post(AI_BASE_PATH, function ({ request, response }) {
    return handleAnalyze(request, response);
  });
}

module.exports = {
  AI_BASE_PATH,
  AI_DEFAULTS_PATH,
  AI_HEALTH_PATH,
  registerAiRoutes,
};
