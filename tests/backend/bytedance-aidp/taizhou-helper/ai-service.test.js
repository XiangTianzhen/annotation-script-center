"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const aiService = require(resolveRepo(
  "platform-resources",
  "bytedance-aidp",
  "taizhou-helper",
  "backend",
  "ai-service.js"
));

function createRequest(overrides) {
  return aiService.normalizeRecommendRequest(Object.assign({
    requestId: "req-taizhou-omni",
    audioDataUrl: "data:audio/wav;base64,ZmFrZQ==",
    startMs: 0,
    endMs: 1000,
    segmentNumber: 2,
    fieldContext: { text: "" },
    editorContext: { query: { taskId: "task-1" } },
  }, overrides || {}));
}

test("Taizhou omni result preserves a raw text string byte-for-byte and omits conversion fields", function () {
  const result = aiService.__testOnly.normalizeOmniOutput("  第3段：3、2、1！！！哈哈哈哈  ");

  assert.deepEqual(result, {
    listenText: "  第3段：3、2、1！！！哈哈哈哈  ",
  });
});

test("Taizhou defaults expose one Qwen Omni configuration with Plus selected", function () {
  const payload = aiService.createDefaultsPayload();
  const omni = payload.defaults?.omni || {};

  assert.equal(omni.model, "qwen3.5-omni-plus");
  assert.match(String(omni.prompt || ""), /只输出当前片段的最终转写文本/);
  assert.doesNotMatch(String(omni.prompt || ""), /(?:只|仅)输出 JSON|JSON 字段固定为|listenText|finalMandarinText|普通话转换|阿拉伯数字|标点只允许/);
  assert.deepEqual(payload.supportedModels?.omni, ["qwen3.5-omni-plus", "qwen3.5-omni-flash"]);
  assert.deepEqual(payload.contract?.stages, ["omni"]);
});

test("Taizhou request accepts only the supported Omni models", function () {
  const flash = createRequest({
    aiOmni: { model: "qwen3.5-omni-flash" },
  });
  const unsupported = createRequest({
    aiOmni: { model: "qwen3.5-plus" },
  });

  assert.equal(flash.aiOmni.model, "qwen3.5-omni-flash");
  assert.equal(unsupported.aiOmni.model, "qwen3.5-omni-plus");
});

test("Taizhou request defaults thinking to false and accepts only a strict true value", function () {
  assert.equal(createRequest().aiOmni.enableThinking, false);
  assert.equal(
    createRequest({ aiOmni: { enableThinking: true } }).aiOmni.enableThinking,
    true
  );
  assert.equal(
    createRequest({ aiOmni: { enableThinking: "true" } }).aiOmni.enableThinking,
    false
  );
});

test("Taizhou recommendation invokes Qwen Omni once and returns one cost record", async function () {
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
        rawText: "第3段：3、2、1！！！",
        usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
      };
    },
    requestTextCompareJson: async function () {
      throw new Error("single Omni flow must not invoke a text provider");
    },
  });

  assert.equal(callCount, 1);
  assert.equal(receivedPrompt.systemPrompt, "自定义全模态 Prompt");
  assert.doesNotMatch(receivedPrompt.systemPrompt, /(?:只|仅)输出 JSON|JSON 字段固定为|listenText|普通话转换|阿拉伯数字|标点只允许/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /只返回最终转写文本/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /不得翻译|原样记录/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /不编造方言映射/);
  assert.match(receivedPrompt.userPrompt, /单次全模态识别上下文/);
  assert.match(receivedPrompt.userPrompt, /参考资料已加载：taizhou-rules\.md/);
  assert.match(receivedPrompt.userPrompt, /"segment"/);
  assert.equal(receivedOptions.model, "qwen3.5-omni-plus");
  assert.equal(receivedOptions.enableThinking, false);
  assert.equal(result.listenText, "第3段：3、2、1！！！");
  assert.equal(Object.hasOwn(result, "finalMandarinText"), false);
  assert.deepEqual(result.models, { omniModel: "qwen3.5-omni-plus" });
  assert.equal(result.usage.omni.total_tokens, 30);
  assert.ok(result.cost.omni);
  assert.equal(result.raw.omni, "第3段：3、2、1！！！");
  assert.equal(Object.hasOwn(result.debug, "omni"), false);
});

test("Taizhou blank custom prompt falls back to the backend default without appended rules", async function () {
  const defaultPrompt = aiService.createDefaultsPayload().defaults?.omni?.prompt;
  const request = createRequest({
    aiOmni: {
      prompt: "  \n  ",
    },
  });
  let receivedPrompt = null;

  await aiService.recommend(request, {}, {
    normalizeUsage: function (usage) {
      return usage || {};
    },
    requestOmniInputAudio: async function (_input, prompt) {
      receivedPrompt = prompt;
      return {
        model: "qwen3.5-omni-plus",
        rawText: "默认 Prompt 转写结果",
        usage: {},
      };
    },
  });

  assert.equal(receivedPrompt.systemPrompt, defaultPrompt);
  assert.match(receivedPrompt.systemPrompt, /不要翻译成普通话/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /不得翻译|原样记录|只返回最终转写文本/);
  assert.match(receivedPrompt.userPrompt, /单次全模态识别上下文/);
});

test("Taizhou maps every raw text response byte-for-byte to listenText", async function () {
  const rawTexts = [
    "  台州话原文\n保留空格  ",
    "**转写结果**：这是解释文字",
    "{\"listenText\":\"旧 JSON 文本\"}",
  ];

  for (const rawText of rawTexts) {
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

    assert.equal(result.listenText, rawText);
    assert.equal(result.raw.omni, rawText);
    assert.equal(Object.hasOwn(result, "finalMandarinText"), false);
  }
});

test("Taizhou keeps an empty raw text response empty", async function () {
  const result = await aiService.recommend(createRequest(), {}, {
    normalizeUsage: function (usage) {
      return usage || {};
    },
    requestOmniInputAudio: async function () {
      return { model: "qwen3.5-omni-plus", rawText: "", usage: {} };
    },
  });

  assert.equal(result.listenText, "");
  assert.equal(result.raw.omni, "");
});

test("Taizhou safely degrades non-string raw output to empty text", async function () {
  for (const rawText of [undefined, null, { listenText: "不应读取对象字段" }]) {
    const result = await aiService.recommend(createRequest(), {}, {
      normalizeUsage: function (usage) {
        return usage || {};
      },
      requestOmniInputAudio: async function () {
        return { model: "qwen3.5-omni-plus", rawText, usage: {} };
      },
    });

    assert.equal(result.listenText, "");
    assert.equal(result.raw.omni, "");
  }
});

test("Taizhou Omni call clamps the timeout at sixty seconds", async function () {
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
        rawText: "普通话文本。",
        usage: {},
      };
    },
  });

  assert.equal(request.timeoutMs, aiService.DEFAULT_TIMEOUT_MS);
  assert.deepEqual(timeouts, [aiService.DEFAULT_TIMEOUT_MS]);
});
