"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { TextDecoder } = require("util");

const {
  getDefaultPythonCandidates,
  parseTimeoutMs,
} = require("../../../backend/ai/config");
const { createPythonRuntimeError } = require("../../../backend/ai/errors");

const DEFAULT_SCRIPT_PATH = path.join(__dirname, "python", "segment_audio_client.py");
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: false });

function decodeUtf8Chunks(chunks) {
  const buffers = Array.isArray(chunks) ? chunks.filter(Buffer.isBuffer) : [];
  if (buffers.length <= 0) {
    return "";
  }
  return UTF8_DECODER.decode(Buffer.concat(buffers));
}

function resolvePythonBin() {
  const explicitPythonBin = String(process.env.DATABAKER_CVPC_SEGMENT_PYTHON_BIN || "").trim();
  if (explicitPythonBin) {
    return {
      pythonBin: explicitPythonBin,
      source: "env",
      exists: fs.existsSync(explicitPythonBin),
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

function getSegmentPythonClientConfig() {
  const pythonResolution = resolvePythonBin();
  return {
    pythonBin: pythonResolution.pythonBin,
    pythonSource: pythonResolution.source,
    pythonExists: pythonResolution.exists,
    pythonScriptPath: DEFAULT_SCRIPT_PATH,
    timeoutMs: parseTimeoutMs(),
  };
}

function createEnvironmentMissingError() {
  return createPythonRuntimeError(
    "CVPC 画段 Python 环境未配置，请在 platform-resources/backend/.venv 执行 .venv\\Scripts\\python.exe -m pip install -r ai\\python\\requirements.txt。",
    "cvpc-segment-python-not-configured",
    503
  );
}

function createJsonParseError(stdoutText, stderrText) {
  return createPythonRuntimeError(
    "CVPC 画段 Python 输出解析失败。",
    "cvpc-segment-python-invalid-output",
    502,
    stdoutText || stderrText || ""
  );
}

function runPythonClient(payload, timeoutMs, clientConfig) {
  const config =
    clientConfig && typeof clientConfig === "object"
      ? clientConfig
      : getSegmentPythonClientConfig();
  if (!config.pythonBin) {
    return Promise.reject(createEnvironmentMissingError());
  }
  if (config.pythonSource === "env" && !config.pythonExists) {
    return Promise.reject(
      createPythonRuntimeError(
        "DATABAKER_CVPC_SEGMENT_PYTHON_BIN 指向的 Python 不存在，请检查路径。",
        "cvpc-segment-python-not-configured",
        503
      )
    );
  }
  return new Promise(function (resolve, reject) {
    const stdoutChunks = [];
    const stderrChunks = [];
    let settled = false;
    const child = spawn(config.pythonBin, [config.pythonScriptPath], {
      cwd: path.dirname(config.pythonScriptPath),
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      env: Object.assign({}, process.env, {
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      }),
    });

    const timer = setTimeout(function () {
      if (settled) {
        return;
      }
      settled = true;
      child.kill("SIGTERM");
      reject(
        createPythonRuntimeError(
          "CVPC 画段 Python 调用超时。",
          "timeout",
          504,
          decodeUtf8Chunks(stderrChunks)
        )
      );
    }, Math.max(1000, Number(timeoutMs) || config.timeoutMs));

    child.stdout.on("data", function (chunk) {
      stdoutChunks.push(Buffer.from(chunk || ""));
    });
    child.stderr.on("data", function (chunk) {
      stderrChunks.push(Buffer.from(chunk || ""));
    });
    child.on("error", function (error) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (error?.code === "ENOENT") {
        reject(createEnvironmentMissingError());
        return;
      }
      reject(
        createPythonRuntimeError(
          "CVPC 画段 Python 进程启动失败。",
          "cvpc-segment-python-launch-failed",
          502,
          error?.message || decodeUtf8Chunks(stderrChunks)
        )
      );
    });
    child.on("close", function (code) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      const stdoutText = decodeUtf8Chunks(stdoutChunks).trim();
      const stderrText = decodeUtf8Chunks(stderrChunks).trim();
      let parsed = null;
      try {
        parsed = JSON.parse(stdoutText || "{}");
      } catch (_error) {
        reject(createJsonParseError(stdoutText, stderrText));
        return;
      }
      if (code !== 0 && parsed?.success !== false) {
        reject(
          createPythonRuntimeError(
            "CVPC 画段 Python 进程执行失败。",
            "cvpc-segment-python-process-failed",
            502,
            stderrText || stdoutText
          )
        );
        return;
      }
      resolve({
        payload: parsed,
        stderrText: stderrText,
      });
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

async function analyzeAudioSegments(input, options) {
  const source = input && typeof input === "object" ? input : {};
  const clientConfig =
    options && options.clientConfig && typeof options.clientConfig === "object"
      ? options.clientConfig
      : getSegmentPythonClientConfig();
  const timeoutMs = Math.max(
    1000,
    Number(options?.timeoutMs) || clientConfig.timeoutMs || parseTimeoutMs()
  );
  const result = await runPythonClient(
    {
      audioUrl: String(source.audioUrl || ""),
      silenceThresholdDbfs: Number(source.silenceThresholdDbfs),
      minSilenceMs: Number(source.minSilenceMs),
      windowMs: Number(source.windowMs),
      smoothingFrameRadius: Number(source.smoothingFrameRadius),
      maxSpeechBridgeMs: Number(source.maxSpeechBridgeMs),
      requestId: String(source.requestId || ""),
    },
    timeoutMs,
    clientConfig
  );
  const payload = result.payload && typeof result.payload === "object" ? result.payload : {};
  if (payload.success !== true) {
    throw createPythonRuntimeError(
      String(payload.message || "CVPC 画段后端音频分析失败。"),
      String(payload.code || "cvpc-segment-python-error"),
      Math.max(400, Number(payload.statusCode || payload.providerStatus) || 502),
      payload.summary || result.stderrText || ""
    );
  }
  return {
    audioDurationMs: Math.max(0, Math.round(Number(payload.audioDurationMs || 0)) || 0),
    silentRanges: Array.isArray(payload.silentRanges) ? payload.silentRanges : [],
    analysisMeta:
      payload.analysisMeta && typeof payload.analysisMeta === "object"
        ? payload.analysisMeta
        : null,
    analysisSource: "backend-python-audio-url",
  };
}

module.exports = {
  DEFAULT_SCRIPT_PATH,
  analyzeAudioSegments,
  getSegmentPythonClientConfig,
};
