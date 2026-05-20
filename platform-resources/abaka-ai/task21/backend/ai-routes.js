"use strict";

const { sendJson } = require("../../../backend/response");
const {
  DEFAULT_ANALYSIS_MODE,
  DEFAULT_OCR_MODEL,
  DEFAULT_REASONING_MODEL,
  DEFAULT_SINGLE_MODEL,
  DEFAULT_VISION_MODEL,
  THINKING_PARAM_NAME,
  THINKING_PARAM_LOCATION,
  analyzeTask21,
  getClientConfig,
  normalizeAnalysisMode,
  sanitizeModelName,
} = require("./ai-client");
const {
  OCR_EXTRACT_SYSTEM_PROMPT,
  REASONING_DECIDE_SYSTEM_PROMPT,
  SINGLE_MODEL_SYSTEM_PROMPT,
  TASK21_AI_RULE_VERSION,
  VISION_EXTRACT_SYSTEM_PROMPT,
  buildOcrExtractUserPrompt,
  buildReasoningDecideUserPrompt,
  buildReasoningDecideUserPromptWithOcr,
  buildSingleModelUserPrompt,
  buildVisionExtractUserPrompt,
} = require("./prompt");
const { estimateUsageFromTexts, normalizeUsage } = require("./usage");

const AI_BASE_PATH = "/api/abaka-ai/task21/ai/analyze";
const AI_HEALTH_PATH = "/api/abaka-ai/task21/ai/health";
const AI_DEFAULTS_PATH = "/api/abaka-ai/task21/ai/defaults";
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const ALLOWED_TARGETS = ["same_font", "image_b_texts_removed", "other_changes", "overall"];
const ALLOWED_IMAGE_FIELDS = ["image_a", "image_b", "image_b_removed"];
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 300000;

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

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
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

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeString(value, maxLength) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, maxLength || 6000);
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

function normalizeStringArray(value, maxItems, maxLengthPerItem) {
  if (!Array.isArray(value)) {
    return [];
  }
  const result = [];
  value.forEach(function (item) {
    const text = normalizeString(item, maxLengthPerItem || 300);
    if (!text || result.indexOf(text) >= 0) {
      return;
    }
    result.push(text);
  });
  return result.slice(0, maxItems || 12);
}

function normalizeStringArrayPreserveDuplicates(value, maxItems, maxLengthPerItem) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(function (item) {
      return normalizeString(item, maxLengthPerItem || 300);
    })
    .filter(Boolean)
    .slice(0, maxItems || 12);
}

function normalizeTimeoutMs(value, fallback) {
  const number = Number(value);
  const base = Number.isFinite(number) ? number : Number(fallback);
  const safe = Number.isFinite(base) ? base : 60000;
  return Math.max(MIN_TIMEOUT_MS, Math.min(MAX_TIMEOUT_MS, Math.floor(safe)));
}

function normalizeTarget(value) {
  const text = String(value || "").trim();
  if (ALLOWED_TARGETS.indexOf(text) >= 0) {
    return text;
  }
  return "";
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
    dataUrl,
    imageUrl,
    mime,
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
    const exists = normalized.some(function (entry) {
      return entry.fieldName === row.fieldName;
    });
    if (!exists) {
      normalized.push(row);
    }
  });
  ALLOWED_IMAGE_FIELDS.forEach(function (fieldName) {
    const exists = normalized.some(function (entry) {
      return entry.fieldName === fieldName;
    });
    if (exists) {
      return;
    }
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
      targetRemovalTextHints: normalizeStringArrayPreserveDuplicates(context.targetRemovalTextHints, 12, 240),
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

function resolveRuntimeOptions(requestBody, config) {
  const source = normalizeObject(requestBody);
  const options = normalizeObject(source.options);
  const debugConfig = normalizeObject(source.debugConfig);

  const analysisMode = normalizeAnalysisMode(
    source.analysisMode || options.analysisMode || debugConfig.analysisMode,
    DEFAULT_ANALYSIS_MODE
  );
  const ocrEnabledValue =
    typeof source.ocrEnabled === "boolean"
      ? source.ocrEnabled
      : typeof options.ocrEnabled === "boolean"
        ? options.ocrEnabled
        : typeof debugConfig.ocrEnabled === "boolean"
          ? debugConfig.ocrEnabled
          : config.ocrEnabled === true;
  const enableThinkingValue =
    typeof source.enableThinking === "boolean"
      ? source.enableThinking
      : typeof options.enableThinking === "boolean"
        ? options.enableThinking
        : typeof debugConfig.enableThinking === "boolean"
          ? debugConfig.enableThinking
          : false;
  const timeoutMs = normalizeTimeoutMs(
    source.timeoutMs || options.timeoutMs || debugConfig.timeoutMs,
    config.timeoutMs || 60000
  );
  const allowClientModelOverride = config.allowClientModelOverride === true;

  function resolveModel(fieldName, defaultModel, allowedModels) {
    const requested = sanitizeModelName(
      source[fieldName] || options[fieldName] || debugConfig[fieldName] || "",
      ""
    );
    if (!allowClientModelOverride) {
      return defaultModel;
    }
    const allowed = Array.isArray(allowedModels) ? allowedModels : [];
    if (requested && allowed.indexOf(requested) >= 0) {
      return requested;
    }
    return defaultModel;
  }

  const visionModel = resolveModel("visionModel", config.visionModel || DEFAULT_VISION_MODEL, config.allowedVisionModels);
  const ocrModel = resolveModel("ocrModel", config.ocrModel || DEFAULT_OCR_MODEL, config.allowedOcrModels);
  const reasoningModel = resolveModel(
    "reasoningModel",
    config.reasoningModel || DEFAULT_REASONING_MODEL,
    config.allowedReasoningModels
  );
  const singleModel = resolveModel(
    "singleModel",
    config.singleModel || DEFAULT_SINGLE_MODEL,
    config.allowedSingleModels
  );

  let thinkingSource = "server-default";
  if (
    typeof source.enableThinking === "boolean" ||
    typeof options.enableThinking === "boolean" ||
    typeof debugConfig.enableThinking === "boolean"
  ) {
    thinkingSource = enableThinkingValue === true ? "options-enabled" : "options-default";
  }

  return {
    analysisMode,
    visionModel,
    ocrEnabled: ocrEnabledValue === true,
    ocrModel,
    reasoningModel,
    singleModel,
    enableThinking: enableThinkingValue === true,
    timeoutMs,
    thinkingSource,
    allowClientModelOverride,
    allowedVisionModels: config.allowedVisionModels,
    allowedOcrModels: config.allowedOcrModels,
    allowedReasoningModels: config.allowedReasoningModels,
    allowedSingleModels: config.allowedSingleModels,
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

function normalizeChoiceText(value) {
  return String(value || "").trim().toLowerCase();
}

function countEnglishWords(value) {
  const text = String(value || "").trim();
  if (!text) {
    return 0;
  }
  const tokens = text.match(/[A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)*/g);
  return tokens ? tokens.length : 0;
}

function normalizeRemovedLines(sourceLines, warnings) {
  const safeWarnings = Array.isArray(warnings) ? warnings : [];
  const result = [];
  const inputLines = Array.isArray(sourceLines)
    ? sourceLines
    : String(sourceLines || "")
        .split(/\r?\n/)
        .map(function (line) {
          return String(line || "").trim();
        })
        .filter(Boolean);
  inputLines.forEach(function (line) {
    const original = String(line || "").trim();
    if (!original) {
      return;
    }
    if (/^(\d+[\).]|[-*•·●])\s+/i.test(original)) {
      safeWarnings.push("image_b_texts_removed: 禁止 bullet/编号格式，已忽略非法行。");
      return;
    }
    const cleanTail = original.replace(/[.,;:!?。；：！？]+$/g, "").trim();
    const normalizedLine = cleanTail.replace(/\s+/g, " ").trim();
    const allLooseMatch = normalizedLine.match(/^all\s+([A-Za-z]+)\s+of\s+(.+)$/i);
    if (allLooseMatch) {
      const nounToken = String(allLooseMatch[1] || "").toLowerCase();
      const allText = String(allLooseMatch[2] || "").replace(/\s+/g, " ").trim();
      if (!allText) {
        safeWarnings.push("image_b_texts_removed: all instances 文本内容为空，已忽略。");
        return;
      }
      if (nounToken !== "instance" && nounToken !== "instances" && nounToken !== "intance" && nounToken !== "intances") {
        safeWarnings.push("image_b_texts_removed: 非法标准答案格式，已忽略：" + sanitizeText(original, 120));
        return;
      }
      if (nounToken !== "instances") {
        safeWarnings.push("image_b_texts_removed: all instance(s) 前缀已自动修正为 all instances of。");
      }
      result.push("all instances of " + allText);
      return;
    }
    const looseMatch = normalizedLine.match(/^([1-9]\d*)\s+([A-Za-z]+)\s+of\s+(.+)$/i);
    if (!looseMatch) {
      safeWarnings.push("image_b_texts_removed: 非法标准答案格式，已忽略：" + sanitizeText(original, 120));
      return;
    }
    const count = Number(looseMatch[1]);
    const noun = String(looseMatch[2] || "").toLowerCase();
    const text = String(looseMatch[3] || "").replace(/\s+/g, " ").trim();
    if (!text) {
      safeWarnings.push("image_b_texts_removed: 文本内容为空，已忽略。");
      return;
    }
    if (noun !== "instance" && noun !== "instances" && noun !== "intance" && noun !== "intances") {
      safeWarnings.push("image_b_texts_removed: 非法标准答案格式，已忽略：" + sanitizeText(original, 120));
      return;
    }
    const expectedNoun = count === 1 ? "instance" : "instances";
    if (noun !== expectedNoun) {
      safeWarnings.push(
        "image_b_texts_removed: instance 单复数已自动修正（" + String(count) + " -> " + expectedNoun + "）。"
      );
    }
    result.push(String(count) + " " + expectedNoun + " of " + text);
  });
  return result.slice(0, 200);
}

function normalizeSameFontSection(section, target) {
  const source = normalizeObject(section);
  const defaultApplicable = target === "same_font" || target === "overall";
  const allowed = ["true", "false", "unsure", "error", "same underlying font+artistic effect", "not_applicable"];
  const rawChoice = normalizeChoiceText(source.choice || source.value);
  let choice = allowed.indexOf(rawChoice) >= 0 ? rawChoice : defaultApplicable ? "unsure" : "not_applicable";
  if (!defaultApplicable) {
    choice = "not_applicable";
  }
  return {
    applicable: source.applicable !== false && defaultApplicable,
    choice: choice,
    value: choice,
    confidence: Number.isFinite(Number(source.confidence)) ? Number(source.confidence) : 0,
    reason_cn: sanitizeText(source.reason_cn || "", 500),
    evidence: normalizeArray(source.evidence),
    warnings: normalizeArray(source.warnings),
  };
}

function normalizeRemovedSection(section, target) {
  const source = normalizeObject(section);
  const applicable = target !== "same_font";
  const warnings = normalizeArray(source.warnings);
  const rawValue = String(source.value || "").trim();
  const rawChoice = normalizeChoiceText(source.choice);
  const shouldNormalizeLines =
    rawChoice === "specify" ||
    (!rawChoice &&
      rawValue &&
      normalizeChoiceText(rawValue) !== "true" &&
      normalizeChoiceText(rawValue) !== "null" &&
      normalizeChoiceText(rawValue) !== "not_applicable");
  const inferredLines = Array.isArray(source.lines) ? source.lines : rawValue.split(/\r?\n/);
  const normalizedLines = shouldNormalizeLines ? normalizeRemovedLines(inferredLines, warnings) : [];
  let choice = "";
  if (rawChoice === "specify" || rawChoice === "true" || rawChoice === "null" || rawChoice === "not_applicable") {
    choice = rawChoice;
  } else if (normalizeChoiceText(rawValue) === "true") {
    choice = "true";
  } else if (normalizedLines.length > 0) {
    choice = "specify";
  } else {
    choice = applicable ? "null" : "not_applicable";
  }
  if (!applicable) {
    choice = "not_applicable";
  }
  let valueType = "blank";
  let value = "";
  let lines = [];
  if (choice === "specify") {
    if (normalizedLines.length <= 0) {
      warnings.push("image_b_texts_removed: choice=specify 但无合法标准答案，已降级为 null。");
      choice = "null";
    } else {
      lines = normalizedLines;
      value = lines.join("\n").slice(0, 6000);
      valueType = "list";
    }
  }
  if (choice === "true") {
    value = "true";
    lines = [];
    valueType = "true";
  }
  if (choice === "null") {
    value = "";
    lines = [];
    valueType = "blank";
  }
  if (choice === "not_applicable") {
    value = "";
    lines = [];
    valueType = "not_applicable";
  }

  return {
    applicable,
    choice: choice,
    value_type: valueType,
    value,
    lines,
    segment_count: Number.isFinite(Number(source.segment_count))
      ? Math.max(0, Math.floor(Number(source.segment_count)))
      : lines.length,
    reason_cn: sanitizeText(source.reason_cn || "", 500),
    evidence: normalizeArray(source.evidence),
    warnings: warnings,
  };
}

function normalizeOtherSection(section, target) {
  const source = normalizeObject(section);
  const applicable = target !== "same_font";
  const warnings = normalizeArray(source.warnings);
  const rawValue = String(source.value || "").trim();
  const rawChoice = normalizeChoiceText(source.choice);
  let choice = "";
  if (rawChoice === "specify" || rawChoice === "unsure" || rawChoice === "null" || rawChoice === "not_applicable") {
    choice = rawChoice;
  } else if (normalizeChoiceText(rawValue) === "unsure") {
    choice = "unsure";
  } else if (rawValue) {
    choice = "specify";
  } else {
    choice = applicable ? "null" : "not_applicable";
  }
  if (!applicable) {
    choice = "not_applicable";
  }
  let value = "";
  let valueType = "blank";
  if (choice === "specify") {
    value = rawValue.slice(0, 4000);
    valueType = "text";
  } else if (choice === "unsure") {
    value = "unsure";
    valueType = "unsure";
  } else if (choice === "not_applicable") {
    value = "";
    valueType = "not_applicable";
  }
  if (choice === "specify" && /[\u4e00-\u9fa5]/.test(value)) {
    warnings.push("other_changes: 检测到中文内容，建议使用英文短句。");
  }
  return {
    applicable,
    choice: choice,
    value_type: valueType,
    value,
    word_count: Number.isFinite(Number(source.word_count))
      ? Math.max(0, Math.floor(Number(source.word_count)))
      : countEnglishWords(value),
    reason_cn: sanitizeText(source.reason_cn || "", 500),
    evidence: normalizeArray(source.evidence),
    warnings: warnings,
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
  const normalized = {
    target,
    same_font: normalizeSameFontSection(source.same_font, target),
    image_b_texts_removed: normalizeRemovedSection(source.image_b_texts_removed, target),
    other_changes: normalizeOtherSection(source.other_changes, target),
    workflow: normalizeWorkflowSection(source.workflow),
  };
  const sameFontChoice = normalizeChoiceText(normalized.same_font.choice || normalized.same_font.value);
  if (target === "overall" && (sameFontChoice === "false" || sameFontChoice === "unsure" || sameFontChoice === "error")) {
    normalized.image_b_texts_removed.choice = "not_applicable";
    normalized.image_b_texts_removed.value_type = "not_applicable";
    normalized.image_b_texts_removed.value = "";
    normalized.image_b_texts_removed.lines = [];
    normalized.image_b_texts_removed.segment_count = 0;
    normalized.other_changes.choice = "not_applicable";
    normalized.other_changes.value_type = "not_applicable";
    normalized.other_changes.value = "";
    normalized.other_changes.word_count = 0;
    normalized.workflow.skip_later_fields = true;
    if (!normalized.workflow.skip_reason) {
      normalized.workflow.skip_reason = "same_font_false_unsure_or_error";
    }
  }
  return normalized;
}

function normalizeStagePayload(stages) {
  const source = normalizeObject(stages);
  const result = {};
  ["vision", "reasoning", "single"].forEach(function (stageKey) {
    const stage = normalizeObject(source[stageKey]);
    if (!stage.model && !stage.usage && !stage.elapsedMs) {
      return;
    }
    result[stageKey] = {
      model: String(stage.model || "").trim(),
      callMode: String(stage.callMode || "").trim() || "openai-compatible-chat",
      elapsedMs: Number.isFinite(Number(stage.elapsedMs)) ? Math.max(0, Math.floor(Number(stage.elapsedMs))) : 0,
      usage: normalizeUsage(stage.usage || {}, { source: "unavailable" }),
      thinking: normalizeObject(stage.thinking),
    };
  });
  return result;
}

function buildUsagePayload(totalUsage, stages) {
  const total = normalizeUsage(totalUsage || {}, { source: "unavailable" });
  const usagePayload = Object.assign({}, total, {
    total: Object.assign({}, total),
  });
  if (stages.single) {
    usagePayload.single = Object.assign({}, stages.single.usage || normalizeUsage({}, { source: "unavailable" }));
  }
  if (stages.vision) {
    usagePayload.vision = Object.assign({}, stages.vision.usage || normalizeUsage({}, { source: "unavailable" }));
  }
  if (stages.reasoning) {
    usagePayload.reasoning = Object.assign(
      {},
      stages.reasoning.usage || normalizeUsage({}, { source: "unavailable" })
    );
  }
  return usagePayload;
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
    analysisMode: config.analysisMode || DEFAULT_ANALYSIS_MODE,
    visionModel: config.visionModel || DEFAULT_VISION_MODEL,
    ocrEnabled: config.ocrEnabled === true,
    ocrModel: config.ocrModel || DEFAULT_OCR_MODEL,
    reasoningModel: config.reasoningModel || DEFAULT_REASONING_MODEL,
    singleModel: config.singleModel || DEFAULT_SINGLE_MODEL,
    modelOptions: {
      vision: config.allowedVisionModels,
      ocr: config.allowedOcrModels,
      reasoning: config.allowedReasoningModels,
      single: config.allowedSingleModels,
    },
    enableThinkingDefault: false,
    timeoutMs: config.timeoutMs,
    allowClientModelOverride: config.allowClientModelOverride === true,
    allowThinkingParamFallback: config.allowThinkingParamFallback === true,
    thinkingParam: {
      paramName: THINKING_PARAM_NAME,
      paramLocation: THINKING_PARAM_LOCATION,
      defaultEnabled: false,
      explicitDisableRequired: true,
    },
  };
}

function buildDefaultsResponse() {
  const config = getClientConfig();
  return {
    success: true,
    service: "abaka-ai-task21-ai-analysis",
    scriptId: "abakaAiTaskPageCapture",
    analysisMode: config.analysisMode || DEFAULT_ANALYSIS_MODE,
    visionModel: config.visionModel || DEFAULT_VISION_MODEL,
    ocrEnabled: config.ocrEnabled === true,
    ocrModel: config.ocrModel || DEFAULT_OCR_MODEL,
    reasoningModel: config.reasoningModel || DEFAULT_REASONING_MODEL,
    singleModel: config.singleModel || DEFAULT_SINGLE_MODEL,
    modelOptions: {
      vision: config.allowedVisionModels,
      ocr: config.allowedOcrModels,
      reasoning: config.allowedReasoningModels,
      single: config.allowedSingleModels,
    },
    enableThinkingDefault: false,
    requestTimeoutMs: config.timeoutMs,
    allowClientModelOverride: config.allowClientModelOverride === true,
    allowThinkingParamFallback: config.allowThinkingParamFallback === true,
    thinkingParam: {
      paramName: THINKING_PARAM_NAME,
      paramLocation: THINKING_PARAM_LOCATION,
      defaultEnabled: false,
      explicitDisableRequired: true,
    },
    defaults: {
      analysisMode: config.analysisMode || DEFAULT_ANALYSIS_MODE,
      visionModel: config.visionModel || DEFAULT_VISION_MODEL,
      ocrEnabled: config.ocrEnabled === true,
      ocrModel: config.ocrModel || DEFAULT_OCR_MODEL,
      reasoningModel: config.reasoningModel || DEFAULT_REASONING_MODEL,
      singleModel: config.singleModel || DEFAULT_SINGLE_MODEL,
      enableThinkingDefault: false,
      timeoutMs: config.timeoutMs,
      allowClientModelOverride: config.allowClientModelOverride === true,
      allowThinkingParamFallback: config.allowThinkingParamFallback === true,
      prompts: {
        single: {
          system: SINGLE_MODEL_SYSTEM_PROMPT,
        },
          twoStageVision: {
            system: VISION_EXTRACT_SYSTEM_PROMPT,
          },
          twoStageOcr: {
            system: OCR_EXTRACT_SYSTEM_PROMPT,
          },
          twoStageReasoning: {
            system: REASONING_DECIDE_SYSTEM_PROMPT,
          },
      },
    },
    notes: {
      promptOverride: "Prompt 模板由后端维护；前端不保存 API Key。",
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
      throw createHttpError(400, "invalid-json", "请求体 JSON 解析失败。");
    }

    const normalizedRequest = normalizeAnalyzeRequest(jsonBody);
    const config = getClientConfig();
    const runtimeOptions = resolveRuntimeOptions(jsonBody, config);

    if (!config.mockEnabled && !config.hasApiKey) {
      throw createHttpError(
        503,
        "missing-api-key",
        "后端缺少 DASHSCOPE_API_KEY。可先开启 ABAKA_TASK21_AI_MOCK=1 调试。"
      );
    }

    const singleUserPrompt = buildSingleModelUserPrompt({
      target: normalizedRequest.target,
      context: normalizedRequest.context,
    });
    const visionUserPrompt = buildVisionExtractUserPrompt({
      target: normalizedRequest.target,
      context: normalizedRequest.context,
    });
    const ocrUserPrompt = buildOcrExtractUserPrompt({
      target: normalizedRequest.target,
      context: normalizedRequest.context,
    });

    const aiResponse = await analyzeTask21(
      {
        target: normalizedRequest.target,
        context: normalizedRequest.context,
        images: normalizedRequest.images,
      },
      {
        singleSystemPrompt: SINGLE_MODEL_SYSTEM_PROMPT,
        singleUserPrompt: singleUserPrompt,
        visionSystemPrompt: VISION_EXTRACT_SYSTEM_PROMPT,
        visionUserPrompt: visionUserPrompt,
        ocrSystemPrompt: OCR_EXTRACT_SYSTEM_PROMPT,
        ocrUserPrompt: ocrUserPrompt,
        reasoningSystemPrompt: REASONING_DECIDE_SYSTEM_PROMPT,
        buildReasoningUserPrompt: function (visualObservations, ocrObservations) {
          if (ocrObservations && Object.keys(ocrObservations).length > 0) {
            return buildReasoningDecideUserPromptWithOcr(
              {
                target: normalizedRequest.target,
                context: normalizedRequest.context,
              },
              visualObservations,
              ocrObservations
            );
          }
          return buildReasoningDecideUserPrompt(
            {
              target: normalizedRequest.target,
              context: normalizedRequest.context,
            },
            visualObservations
          );
        },
      },
        {
          analysisMode: runtimeOptions.analysisMode,
          visionModel: runtimeOptions.visionModel,
          ocrEnabled: runtimeOptions.ocrEnabled,
          ocrModel: runtimeOptions.ocrModel,
          reasoningModel: runtimeOptions.reasoningModel,
          singleModel: runtimeOptions.singleModel,
          allowClientModelOverride: runtimeOptions.allowClientModelOverride,
          allowedVisionModels: runtimeOptions.allowedVisionModels,
          allowedOcrModels: runtimeOptions.allowedOcrModels,
          allowedReasoningModels: runtimeOptions.allowedReasoningModels,
        allowedSingleModels: runtimeOptions.allowedSingleModels,
        enableThinking: runtimeOptions.enableThinking,
        timeoutMs: runtimeOptions.timeoutMs,
      }
    );

    const rawText = extractJsonObjectText(aiResponse.rawText || "");
    const parsedResult = safeParseJson(rawText);
    if (!parsedResult) {
      throw createHttpError(502, "provider-invalid-json", "模型返回非 JSON，无法解析。");
    }

    const normalizedResult = normalizeResultSchema(normalizedRequest.target, parsedResult);
      const totalUsage = aiResponse.usage
        ? normalizeUsage(aiResponse.usage, { source: "provider" })
        : normalizeUsage(
            estimateUsageFromTexts(
              singleUserPrompt + "\n" + visionUserPrompt + "\n" + ocrUserPrompt,
              rawText
            ),
            {
            source: "estimated",
            }
          );
    const stages = normalizeStagePayload(aiResponse.stages || {});
    const usage = buildUsagePayload(totalUsage, stages);
    const thinkingPayload = normalizeObject(aiResponse.thinking);

    sendJson(response, 200, {
      success: true,
      requestId,
      target: normalizedRequest.target,
      analysisMode: aiResponse.analysisMode || runtimeOptions.analysisMode,
      model: aiResponse.model || "",
      visionModel:
        String(aiResponse.selectedModels?.visionModel || runtimeOptions.visionModel || ""),
      ocrEnabled: runtimeOptions.ocrEnabled === true,
      ocrModel: String(aiResponse.selectedModels?.ocrModel || runtimeOptions.ocrModel || ""),
      reasoningModel:
        String(aiResponse.selectedModels?.reasoningModel || runtimeOptions.reasoningModel || ""),
      singleModel: String(aiResponse.selectedModels?.singleModel || runtimeOptions.singleModel || ""),
      selectedModel:
        aiResponse.analysisMode === "single_model"
          ? String(aiResponse.selectedModels?.singleModel || runtimeOptions.singleModel || "")
          : String(aiResponse.selectedModels?.reasoningModel || runtimeOptions.reasoningModel || ""),
      elapsedMs: Date.now() - startedAt,
      result: normalizedResult,
      usage,
      stages,
      imageStats: sanitizeImageStats(normalizedRequest.images),
      visualObservations:
        aiResponse.analysisMode === "two_stage" ? aiResponse.visualObservations || {} : undefined,
      ocrObservations:
        aiResponse.analysisMode === "two_stage" ? aiResponse.ocrObservations || {} : undefined,
      thinking: {
        enableThinking: runtimeOptions.enableThinking === true,
        requested: runtimeOptions.enableThinking === true,
        explicitDisableSent:
          thinkingPayload.explicitDisableSent === true || runtimeOptions.enableThinking !== true,
        paramName: THINKING_PARAM_NAME,
        paramLocation: THINKING_PARAM_LOCATION,
        fallbackUsed: thinkingPayload.fallbackUsed === true,
        notApplicable: thinkingPayload.notApplicable === true,
        reason: thinkingPayload.reason || "",
        source: runtimeOptions.thinkingSource,
        timeoutMs: runtimeOptions.timeoutMs,
      },
      warnings: normalizeArray(normalizedResult.same_font.warnings)
        .concat(normalizeArray(normalizedResult.image_b_texts_removed.warnings))
        .concat(normalizeArray(normalizedResult.other_changes.warnings)),
      mock: aiResponse.mock === true,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || (error?.code === "timeout" ? 504 : 500);
    const errorBody = {
      success: false,
      requestId,
      code: String(error?.code || "internal-error"),
      message: sanitizeText(error?.message || "Task21 AI analyze 请求失败。", 300),
      elapsedMs: Date.now() - startedAt,
    };
    if (error?.summary) {
      errorBody.summary = sanitizeText(error.summary, 300);
    }
    sendJson(response, statusCode, errorBody);
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
  normalizeResultSchema,
  registerAiRoutes,
};
