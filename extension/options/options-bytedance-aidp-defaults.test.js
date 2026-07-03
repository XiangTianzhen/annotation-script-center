"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function extractFunctionSource(source, functionName) {
  const signature = "function " + String(functionName || "").trim() + "(";
  const startIndex = String(source || "").indexOf(signature);
  if (startIndex < 0) {
    throw new Error("未找到函数：" + functionName);
  }
  const bodyStart = source.indexOf("{", startIndex);
  if (bodyStart < 0) {
    throw new Error("未找到函数体：" + functionName);
  }

  let index = bodyStart;
  let depth = 0;
  let quote = "";
  let inLineComment = false;
  let inBlockComment = false;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (current === "\n") {
        inLineComment = false;
      }
      index += 1;
      continue;
    }
    if (inBlockComment) {
      if (current === "*" && next === "/") {
        inBlockComment = false;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }
    if (quote) {
      if (current === "\\") {
        index += 2;
        continue;
      }
      if (current === quote) {
        quote = "";
      }
      index += 1;
      continue;
    }
    if (current === "/" && next === "/") {
      inLineComment = true;
      index += 2;
      continue;
    }
    if (current === "/" && next === "*") {
      inBlockComment = true;
      index += 2;
      continue;
    }
    if (current === "'" || current === '"' || current === "`") {
      quote = current;
      index += 1;
      continue;
    }
    if (current === "{") {
      depth += 1;
    } else if (current === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
    index += 1;
  }

  throw new Error("函数未正常闭合：" + functionName);
}

function loadBuildFallbackAsrVoiceAiDefaults() {
  const source = fs.readFileSync(path.resolve(__dirname, "options.js"), "utf8");
  const functionSource = extractFunctionSource(source, "buildFallbackAsrVoiceAiDefaults");
  const context = {
    dataBakerRoundOneQualityScriptId: "dataBakerRoundOneQuality",
    dataBakerCvpcLiuzhouScriptId: "dataBakerCvpcLiuzhouAssistant",
    bytedanceAidpSuzhouScriptId: "bytedanceAidpSuzhouHelper",
    magicDataAnnotatorScriptId: "magicDataAnnotatorAiReview",
    magicDataMinnanScriptId: "magicDataMinnanAssistant",
    aishellTechMinnanScriptId: "aishellTechMinnanAssistant",
    aishellTechVietnameseScriptId: "aishellTechVietnameseAssistant",
    judgementProjectId: "judgement",
    transcriptionProjectId: "transcription",
    DEFAULT_AI_REQUEST_TIMEOUT_MS: 60000,
    dataBakerDefaultListenPrompt: "listen-default-prompt",
    dataBakerDefaultComparePrompt: "compare-default-prompt",
    aishellTechVietnameseDefaultSinglePrompt: "vietnamese-single-prompt",
    dataBakerListenModelOptions: [{ value: "listen-model", label: "listen-model" }],
    dataBakerCompareModelOptions: [{ value: "compare-model", label: "compare-model" }],
    dataBakerSingleModelOptions: [{ value: "single-model", label: "single-model" }],
    dataBakerCvpcListenModelOptions: [{ value: "cvpc-listen-model", label: "cvpc-listen-model" }],
    clone: function (value) {
      return JSON.parse(JSON.stringify(value));
    },
    isMagicDataScript: function (scriptId) {
      return (
        scriptId === "magicDataAnnotatorAiReview" || scriptId === "magicDataMinnanAssistant"
      );
    },
    isAishellTechScript: function (scriptId) {
      return (
        scriptId === "aishellTechMinnanAssistant" ||
        scriptId === "aishellTechVietnameseAssistant"
      );
    },
    isAishellTechVietnameseScript: function (scriptId) {
      return scriptId === "aishellTechVietnameseAssistant";
    },
    isDataBakerCvpcScript: function (scriptId) {
      return scriptId === "dataBakerCvpcLiuzhouAssistant";
    },
  };
  vm.createContext(context);
  vm.runInContext(
    functionSource + "\nthis.buildFallbackAsrVoiceAiDefaults = buildFallbackAsrVoiceAiDefaults;",
    context
  );
  return context.buildFallbackAsrVoiceAiDefaults;
}

test("ByteDance AIDP fallback defaults build without throwing and expose two stages", function () {
  const buildFallbackAsrVoiceAiDefaults = loadBuildFallbackAsrVoiceAiDefaults();

  const result = buildFallbackAsrVoiceAiDefaults("bytedanceAidpSuzhouHelper");

  assert.ok(result);
  assert.equal(result.loadedFromBackend, false);
  assert.equal(result.error, "");
  assert.equal(result.defaults.stages.listen.model, "qwen3.5-omni-flash");
  assert.equal(result.defaults.stages.refine.model, "qwen3.5-plus");
  assert.deepEqual(result.defaults.stages.listen.modelOptions, [
    { value: "cvpc-listen-model", label: "cvpc-listen-model" },
  ]);
  assert.deepEqual(result.defaults.stages.refine.modelOptions, [
    { value: "compare-model", label: "compare-model" },
  ]);
  assert.equal(result.defaults.stages.listen.prompt, "");
  assert.equal(result.defaults.stages.refine.prompt, "");
});
