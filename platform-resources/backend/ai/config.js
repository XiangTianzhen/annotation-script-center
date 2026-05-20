"use strict";

const path = require("path");

const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_OMNI_MODEL = "qwen3.5-omni-flash";
const DEFAULT_COMPARE_MODEL = "qwen3.5-plus";
const DEFAULT_FUN_ASR_MODEL = "fun-asr";
const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_REQUEST_PARAMS = {
  temperature: 0.1,
  top_p: 0.8,
  max_tokens: 1200,
  max_completion_tokens: "",
  presence_penalty: 0,
  frequency_penalty: 0,
  seed: "",
  stop: "",
};
const SUPPORTED_REQUEST_PARAMS = {
  temperature: true,
  top_p: true,
  max_tokens: true,
  max_completion_tokens: true,
  presence_penalty: true,
  frequency_penalty: true,
  seed: true,
  stop: true,
  enable_thinking: true,
  reasoning_effort: false,
  response_format: false,
};
const DEFAULT_VENV_DIR = path.join(__dirname, "..", ".venv");
const DEFAULT_FUNASR_PYTHON_SCRIPT = path.join(__dirname, "python", "funasr_client.py");

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function parseTimeoutMs() {
  const value = Number(process.env.DATABAKER_AI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(value)) {
    return DEFAULT_TIMEOUT_MS;
  }
  return Math.max(1000, Math.min(300000, Math.floor(value)));
}

function isMockEnabled() {
  return String(process.env.DATABAKER_AI_MOCK || "").trim() === "1";
}

function parseEnableThinkingDefault() {
  return String(process.env.DATABAKER_AI_ENABLE_THINKING || "0").trim() === "1";
}

function parseLanguageHints() {
  const raw = String(process.env.DATABAKER_AI_FUN_ASR_LANGUAGE_HINTS || "zh").trim();
  const values = raw
    .split(/[,\s]+/)
    .map(function (item) {
      return String(item || "").trim();
    })
    .filter(Boolean)
    .slice(0, 8);
  return values.length > 0 ? values : ["zh"];
}

function buildSdkBaseHttpApiUrl() {
  const baseUrl = trimSlash(process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL);
  try {
    const parsedUrl = new URL(baseUrl);
    return parsedUrl.origin + "/api/v1";
  } catch (error) {
    return "https://dashscope.aliyuncs.com/api/v1";
  }
}

function getDefaultPythonCandidates() {
  return [
    path.join(DEFAULT_VENV_DIR, "Scripts", "python.exe"),
    path.join(DEFAULT_VENV_DIR, "bin", "python"),
  ];
}

function getQwenProviderConfig() {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || "").trim();
  const baseUrl = trimSlash(process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL);
  const omniModel = String(process.env.DATABAKER_AI_OMNI_MODEL || DEFAULT_OMNI_MODEL).trim();
  const compareModel = String(process.env.DATABAKER_AI_COMPARE_MODEL || DEFAULT_COMPARE_MODEL).trim();
  return {
    apiKey,
    baseUrl,
    omniModel: omniModel || DEFAULT_OMNI_MODEL,
    compareModel: compareModel || DEFAULT_COMPARE_MODEL,
    timeoutMs: parseTimeoutMs(),
    mockEnabled: isMockEnabled(),
    hasApiKey: Boolean(apiKey),
    enableThinkingDefault: parseEnableThinkingDefault(),
  };
}

function getFunAsrPythonConfig() {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || "").trim();
  const model = String(process.env.DATABAKER_AI_FUN_ASR_MODEL || DEFAULT_FUN_ASR_MODEL).trim();
  const pythonBin = String(process.env.DATABAKER_FUNASR_PYTHON_BIN || "").trim();
  return {
    apiKey,
    model: model || DEFAULT_FUN_ASR_MODEL,
    timeoutMs: parseTimeoutMs(),
    mockEnabled: isMockEnabled(),
    hasApiKey: Boolean(apiKey),
    languageHints: parseLanguageHints(),
    pythonBin,
    sdkBaseHttpApiUrl: buildSdkBaseHttpApiUrl(),
    defaultVenvDir: DEFAULT_VENV_DIR,
    defaultScriptPath: DEFAULT_FUNASR_PYTHON_SCRIPT,
    defaultPythonCandidates: getDefaultPythonCandidates(),
  };
}

module.exports = {
  DEFAULT_BASE_URL,
  DEFAULT_COMPARE_MODEL,
  DEFAULT_FUN_ASR_MODEL,
  DEFAULT_OMNI_MODEL,
  DEFAULT_REQUEST_PARAMS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_VENV_DIR,
  DEFAULT_FUNASR_PYTHON_SCRIPT,
  SUPPORTED_REQUEST_PARAMS,
  buildSdkBaseHttpApiUrl,
  getDefaultPythonCandidates,
  getFunAsrPythonConfig,
  getQwenProviderConfig,
  isMockEnabled,
  parseEnableThinkingDefault,
  parseLanguageHints,
  parseTimeoutMs,
  trimSlash,
};
