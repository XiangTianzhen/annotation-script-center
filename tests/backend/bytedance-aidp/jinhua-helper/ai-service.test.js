"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const aiService = require(resolveRepo(
  "platform-resources",
  "bytedance-aidp",
  "jinhua-helper",
  "backend",
  "ai-service.js"
));

function createRequest(overrides) {
  return aiService.normalizeRecommendRequest(Object.assign({
    requestId: "req-jinhua-omni",
    audioDataUrl: "data:audio/wav;base64,ZmFrZQ==",
    startMs: 0,
    endMs: 1000,
    segmentNumber: 2,
    fieldContext: { text: "" },
    editorContext: { query: { taskId: "task-1" } },
  }, overrides || {}));
}

test("Jinhua Omni result preserves listenText byte-for-byte and omits conversion fields", function () {
  const result = aiService.__testOnly.normalizeOmniOutput({
    listenText: "  第3段：3、2、1！！！哈哈哈哈  ",
  });

  assert.deepEqual(result, {
    listenText: "  第3段：3、2、1！！！哈哈哈哈  ",
  });
});

test("Jinhua defaults expose one Qwen Omni configuration with Plus selected", function () {
  const payload = aiService.createDefaultsPayload();
  const omni = payload.defaults?.omni || {};

  assert.equal(omni.model, "qwen3.5-omni-plus");
  assert.match(String(omni.prompt || ""), /JSON 字段固定为：listenText/);
  assert.doesNotMatch(String(omni.prompt || ""), /finalMandarinText|普通话转换|阿拉伯数字|标点只允许/);
  assert.deepEqual(payload.supportedModels?.omni, ["qwen3.5-omni-plus", "qwen3.5-omni-flash"]);
  assert.deepEqual(payload.contract?.stages, ["omni"]);
});

test("Jinhua request accepts only the supported Omni models", function () {
  const flash = createRequest({
    aiOmni: { model: "qwen3.5-omni-flash" },
  });
  const unsupported = createRequest({
    aiOmni: { model: "qwen3.5-plus" },
  });

  assert.equal(flash.aiOmni.model, "qwen3.5-omni-flash");
  assert.equal(unsupported.aiOmni.model, "qwen3.5-omni-plus");
});

test("Jinhua recommendation invokes Qwen Omni once and returns one cost record", async function () {
  const request = createRequest({
    aiOmni: {
      model: "qwen3.5-omni-plus",
      prompt: "自定义全模态 Prompt",
      params: { temperature: 0.2, stop: ["结束"] },
    },
  });
  let callCount = 0;
  let receivedPrompt = null;
  let receivedOptions = null;

  const result = await aiService.recommend(request, { rulesText: "规则" }, {
    normalizeUsage: function (usage) {
      return usage || {};
    },
    requestOmniInputAudio: async function (_input, prompt, options) {
      callCount += 1;
      receivedPrompt = prompt;
      receivedOptions = options;
      return {
        model: "qwen3.5-omni-plus",
        rawText: JSON.stringify({
          listenText: "第3段：3、2、1！！！",
        }),
        usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
      };
    },
    requestTextCompareJson: async function () {
      throw new Error("single Omni flow must not invoke a text provider");
    },
  });

  assert.equal(callCount, 1);
  assert.match(receivedPrompt.systemPrompt, /自定义全模态 Prompt/);
  assert.doesNotMatch(receivedPrompt.systemPrompt, /普通话转换|阿拉伯数字|标点只允许/);
  assert.equal(receivedOptions.model, "qwen3.5-omni-plus");
  assert.equal(receivedOptions.enableThinking, false);
  assert.equal(result.listenText, "第3段：3、2、1！！！");
  assert.equal(Object.hasOwn(result, "finalMandarinText"), false);
  assert.deepEqual(result.models, { omniModel: "qwen3.5-omni-plus" });
  assert.equal(result.usage.omni.total_tokens, 30);
  assert.ok(result.cost.omni);
  assert.equal(result.raw.omni.includes("listenText"), true);
});

test("Jinhua ignores non-JSON output and an empty listenText instead of returning fillable text", async function () {
  for (const rawText of ["不是 JSON 的模型输出", JSON.stringify({ listenText: "" })]) {
    const result = await aiService.recommend(createRequest(), {}, {
      normalizeUsage: function (usage) {
        return usage || {};
      },
      requestOmniInputAudio: async function () {
        return {
          model: "qwen3.5-omni-plus",
          rawText,
          usage: {},
        };
      },
    });

    assert.equal(result.listenText, "");
    assert.equal(Object.hasOwn(result, "finalMandarinText"), false);
  }
});

test("Jinhua Omni call clamps the timeout at sixty seconds", async function () {
  const request = createRequest({ timeoutMs: aiService.DEFAULT_TIMEOUT_MS + 1 });
  const timeouts = [];

  await aiService.recommend(request, {}, {
    normalizeUsage: function (usage) {
      return usage || {};
    },
    requestOmniInputAudio: async function (_input, _prompt, options) {
      timeouts.push(options.timeoutMs);
      return {
        model: "qwen3.5-omni-plus",
        rawText: JSON.stringify({ listenText: "金华话原始听音。" }),
        usage: {},
      };
    },
  });

  assert.equal(request.timeoutMs, aiService.DEFAULT_TIMEOUT_MS);
  assert.deepEqual(timeouts, [aiService.DEFAULT_TIMEOUT_MS]);
});

test("Jinhua success body exposes only the original listenText business field", function () {
  const body = aiService.buildRecommendSuccessBody({
    requestId: "req-jinhua-success",
    data: {
      listenText: "金华话原始听音。",
      usage: {},
      cost: {},
      timing: {},
      models: {},
      raw: {},
      debug: {},
    },
  });

  assert.equal(body.listenText, "金华话原始听音。");
  assert.equal(Object.hasOwn(body, "finalMandarinText"), false);
  assert.equal(Object.hasOwn(body, "blockAutoFill"), false);
});
