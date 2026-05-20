"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const {
  DEFAULT_FUN_ASR_MODEL,
  getFunAsrPythonConfig,
} = require("../config");
const {
  createPythonRuntimeError,
} = require("../errors");
const { sanitizeProviderErrorSummary } = require("../sanitizer");

function resolvePythonBin() {
  const config = getFunAsrPythonConfig();
  if (config.pythonBin) {
    return {
      pythonBin: config.pythonBin,
      source: "env",
      exists: fs.existsSync(config.pythonBin),
    };
  }
  const candidate = config.defaultPythonCandidates.find(function (item) {
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
  const config = getFunAsrPythonConfig();
  const pythonResolution = resolvePythonBin();
  return Object.assign({}, config, {
    pythonBin: pythonResolution.pythonBin,
    pythonSource: pythonResolution.source,
    pythonExists: pythonResolution.exists,
    pythonScriptPath: config.defaultScriptPath,
  });
}

function createPythonEnvironmentMissingError() {
  return createPythonRuntimeError(
    "Fun-ASR Python 环境未配置，请在 platform-resources/backend/.venv 创建统一 Python 虚拟环境，并执行 .venv\\Scripts\\python.exe -m pip install -r ai\\python\\requirements.txt。",
    "fun-asr-python-not-configured",
    503
  );
}

function createJsonParseError(stdoutText, stderrText) {
  return createPythonRuntimeError(
    "Fun-ASR Python 输出解析失败。",
    "fun-asr-python-invalid-output",
    502,
    stdoutText || stderrText || ""
  );
}

function normalizeFailureMessage(code, providerStatus, message) {
  if (code === "fun-asr-python-not-configured") {
    return "Fun-ASR Python 环境未配置，请在 platform-resources/backend/.venv 创建统一 Python 虚拟环境，并执行 .venv\\Scripts\\python.exe -m pip install -r ai\\python\\requirements.txt。";
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
      createPythonRuntimeError(
        "DATABAKER_FUNASR_PYTHON_BIN 指向的 Python 不存在，请检查路径。",
        "fun-asr-python-not-configured",
        503
      )
    );
  }
  return new Promise(function (resolve, reject) {
    const child = spawn(config.pythonBin, [config.pythonScriptPath], {
      cwd: path.dirname(config.pythonScriptPath),
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
      reject(
        createPythonRuntimeError("Fun-ASR Python 调用超时。", "timeout", 504, stderrText)
      );
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
      reject(
        createPythonRuntimeError(
          "Fun-ASR Python 进程启动失败。",
          "fun-asr-python-launch-failed",
          502,
          error?.message || stderrText
        )
      );
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
        reject(
          createPythonRuntimeError(
            "Fun-ASR Python 进程执行失败。",
            "fun-asr-python-process-failed",
            502,
            stderrText || stdoutText
          )
        );
        return;
      }
      resolve({
        payload: parsed,
        stderrText: sanitizeProviderErrorSummary(stderrText),
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
    throw createPythonRuntimeError("缺少 DASHSCOPE_API_KEY。", "missing-api-key", 503);
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
    const error = createPythonRuntimeError(
      normalizeFailureMessage(code, providerStatus, payload.message),
      code,
      providerStatus > 0 ? providerStatus : 502,
      payload.message || result.stderrText || ""
    );
    if (providerStatus > 0) {
      error.providerStatus = providerStatus;
    }
    throw error;
  }
  const heardText = String(payload.heardText || "").trim();
  if (!heardText) {
    throw createPythonRuntimeError(
      "Fun-ASR 未返回可用转写文本。",
      "fun-asr-empty-text",
      502,
      result.stderrText
    );
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
