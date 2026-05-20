"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const DEFAULT_FUN_ASR_MODEL = "fun-asr";
const DEFAULT_TIMEOUT_MS = 120000;
const PYTHON_SCRIPT_PATH = path.join(__dirname, "funasr_client.py");

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

function sanitizeSummary(text) {
  return String(text || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, "[url-redacted]")
    .replace(/(access_token["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(signature["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(ossaccesskeyid["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(api[_-]?key["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function buildSdkBaseHttpApiUrl() {
  const baseUrl = trimSlash(process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1");
  try {
    const parsedUrl = new URL(baseUrl);
    return parsedUrl.origin + "/api/v1";
  } catch (error) {
    return "https://dashscope.aliyuncs.com/api/v1";
  }
}

function getDefaultPythonCandidates() {
  return [
    path.join(__dirname, ".venv-funasr", "Scripts", "python.exe"),
    path.join(__dirname, ".venv-funasr", "bin", "python"),
  ];
}

function resolvePythonBin() {
  const configured = String(process.env.DATABAKER_FUNASR_PYTHON_BIN || "").trim();
  if (configured) {
    return {
      pythonBin: configured,
      source: "env",
      exists: fs.existsSync(configured),
    };
  }
  const candidate = getDefaultPythonCandidates().find(function (item) {
    return fs.existsSync(item);
  });
  if (candidate) {
    return {
      pythonBin: candidate,
      source: "venv",
      exists: true,
    };
  }
  return {
    pythonBin: "",
    source: "missing",
    exists: false,
  };
}

function getFunAsrClientConfig() {
  const apiKey = String(process.env.DASHSCOPE_API_KEY || "").trim();
  const model = String(process.env.DATABAKER_AI_FUN_ASR_MODEL || DEFAULT_FUN_ASR_MODEL).trim();
  const pythonResolution = resolvePythonBin();
  return {
    apiKey,
    model: model || DEFAULT_FUN_ASR_MODEL,
    timeoutMs: parseTimeoutMs(),
    mockEnabled: isMockEnabled(),
    hasApiKey: Boolean(apiKey),
    languageHints: parseLanguageHints(),
    pythonBin: pythonResolution.pythonBin,
    pythonSource: pythonResolution.source,
    pythonExists: pythonResolution.exists,
    sdkBaseHttpApiUrl: buildSdkBaseHttpApiUrl(),
  };
}

function createConfiguredError(message, code, statusCode) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function createPythonEnvironmentMissingError() {
  return createConfiguredError(
    "Fun-ASR Python 环境未配置，请先创建 .venv-funasr 并安装 requirements-funasr.txt。",
    "fun-asr-python-not-configured",
    503
  );
}

function createJsonParseError(stdoutText, stderrText) {
  const error = createConfiguredError("Fun-ASR Python 输出解析失败。", "fun-asr-python-invalid-output", 502);
  error.summary = sanitizeSummary(stdoutText || stderrText || "");
  return error;
}

function normalizeFailureMessage(code, providerStatus, message) {
  if (code === "fun-asr-python-not-configured") {
    return "Fun-ASR Python 环境未配置，请先创建 .venv-funasr 并安装 requirements-funasr.txt。";
  }
  if (code === "invalid-fun-asr-model") {
    return "Fun-ASR 模型名应为 fun-asr。";
  }
  if (code === "fun-asr-audio-url-unreachable") {
    return "Fun-ASR 调用被拒绝。当前更像是平台音频 URL 对模型服务不可访问，可先切回 Omni 单模型恢复使用。";
  }
  if (providerStatus === 403 || code === "fun-asr-forbidden") {
    return "Fun-ASR 调用被拒绝。可能是 DashScope 权限/地域未开通、API Key 无权限，或平台音频 URL 无法被 Fun-ASR 服务访问。可先切换到 Omni 单模型恢复使用。";
  }
  return String(message || "Fun-ASR 调用失败。").slice(0, 240);
}

function runPythonClient(payload, timeoutMs) {
  const config = getFunAsrClientConfig();
  if (!config.pythonBin) {
    return Promise.reject(createPythonEnvironmentMissingError());
  }
  if (config.pythonSource === "env" && !config.pythonExists) {
    return Promise.reject(
      createConfiguredError(
        "DATABAKER_FUNASR_PYTHON_BIN 指向的 Python 不存在，请检查路径。",
        "fun-asr-python-not-configured",
        503
      )
    );
  }
  return new Promise(function (resolve, reject) {
    const child = spawn(config.pythonBin, [PYTHON_SCRIPT_PATH], {
      cwd: __dirname,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      env: process.env,
    });
    let stdoutText = "";
    let stderrText = "";
    let settled = false;
    const timer = setTimeout(function () {
      if (settled) {
        return;
      }
      settled = true;
      child.kill("SIGTERM");
      const error = createConfiguredError("Fun-ASR Python 调用超时。", "timeout", 504);
      error.summary = sanitizeSummary(stderrText);
      reject(error);
    }, Math.max(1000, Number(timeoutMs) || config.timeoutMs));

    child.stdout.on("data", function (chunk) {
      stdoutText += String(chunk || "");
    });
    child.stderr.on("data", function (chunk) {
      stderrText += String(chunk || "");
    });
    child.on("error", function (error) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (error?.code === "ENOENT") {
        reject(createPythonEnvironmentMissingError());
        return;
      }
      const nextError = createConfiguredError(
        "Fun-ASR Python 进程启动失败。",
        "fun-asr-python-launch-failed",
        502
      );
      nextError.summary = sanitizeSummary(error?.message || stderrText);
      reject(nextError);
    });
    child.on("close", function (code) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      let parsed = null;
      try {
        parsed = JSON.parse(String(stdoutText || "").trim() || "{}");
      } catch (error) {
        reject(createJsonParseError(stdoutText, stderrText));
        return;
      }
      if (code !== 0 && parsed?.success !== false) {
        const processError = createConfiguredError(
          "Fun-ASR Python 进程执行失败。",
          "fun-asr-python-process-failed",
          502
        );
        processError.summary = sanitizeSummary(stderrText || stdoutText);
        reject(processError);
        return;
      }
      resolve({
        payload: parsed,
        stderrText: sanitizeSummary(stderrText),
      });
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

async function requestFunAsrRecognition(input, options) {
  const config = getFunAsrClientConfig();
  const model = String(options?.model || config.model || DEFAULT_FUN_ASR_MODEL).trim() || DEFAULT_FUN_ASR_MODEL;
  if (config.mockEnabled) {
    return {
      model,
      heardText: String(input?.pageText || "").trim() || "mock 听音文本",
      confidence: 0.82,
      usage: {},
      mock: true,
      taskId: "mock-task",
      rawStatus: "MOCK",
    };
  }
  if (!config.hasApiKey) {
    throw createConfiguredError("缺少 DASHSCOPE_API_KEY。", "missing-api-key", 503);
  }
  const timeoutMs = Math.max(1000, Number(options?.timeoutMs) || config.timeoutMs);
  const result = await runPythonClient(
    {
      audioUrl: String(input?.audioUrl || ""),
      model,
      languageHints: config.languageHints,
      timeoutMs,
      baseHttpApiUrl: config.sdkBaseHttpApiUrl,
    },
    timeoutMs
  );
  const payload = result.payload && typeof result.payload === "object" ? result.payload : {};
  if (payload.success !== true) {
    const providerStatus = Number(payload.providerStatus) || 0;
    const code = String(payload.code || "fun-asr-python-error");
    const error = createConfiguredError(
      normalizeFailureMessage(code, providerStatus, payload.message),
      code,
      providerStatus > 0 ? providerStatus : 502
    );
    error.providerStatus = providerStatus > 0 ? providerStatus : undefined;
    error.summary = sanitizeSummary(payload.message || result.stderrText || "");
    throw error;
  }
  const heardText = String(payload.heardText || "").trim();
  if (!heardText) {
    const error = createConfiguredError("Fun-ASR 未返回可用转写文本。", "fun-asr-empty-text", 502);
    error.summary = sanitizeSummary(result.stderrText);
    throw error;
  }
  return {
    model: String(payload.model || model).trim() || model,
    heardText,
    confidence: Number(payload.confidence || 0),
    usage: {},
    mock: false,
    taskId: String(payload.taskId || "").trim(),
    rawStatus: String(payload.rawStatus || "").trim(),
  };
}

module.exports = {
  DEFAULT_FUN_ASR_MODEL,
  getFunAsrClientConfig,
  requestFunAsrRecognition,
};
