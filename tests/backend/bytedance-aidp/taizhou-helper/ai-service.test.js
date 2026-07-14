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

test("Taizhou omni result keeps raw listening text and forcibly cleans final Mandarin", function () {
  const result = aiService.__testOnly.normalizeOmniOutput({
    listenText: " 第3段：3、2、1！！！哈哈哈哈 ",
    finalMandarinText: "他说：今天有3个问题；先看1、2、3! 这这这这个。",
  });

  assert.equal(result.listenText, "第3段：3、2、1！！！哈哈哈哈");
  assert.equal(result.finalMandarinText, "他说，今天有三个问题，先看一，二，三！这这这个。");
});

test("Taizhou omni result preserves meaningful repeated clauses and unknown entity wrappers", function () {
  const result = aiService.__testOnly.normalizeOmniOutput({
    finalMandarinText: "吃得，吃得我肚子痛。##阿布公司##?",
  });

  assert.equal(result.finalMandarinText, "吃得，吃得我肚子痛。##阿布公司##？");
});

test("Taizhou omni result compresses obvious consecutive repeated short words", function () {
  const result = aiService.__testOnly.normalizeOmniOutput({
    finalMandarinText: "这个这个这个这个事情要说清楚。",
  });

  assert.equal(result.finalMandarinText, "这个这个这个事情要说清楚。");
});

test("Taizhou omni result returns an empty final text for silence", function () {
  const result = aiService.__testOnly.normalizeOmniOutput({
    finalMandarinText: "完全听不清",
  });

  assert.equal(result.finalMandarinText, "");
});

test("Taizhou defaults expose one Qwen Omni configuration with Plus selected", function () {
  const payload = aiService.createDefaultsPayload();
  const omni = payload.defaults?.omni || {};

  assert.equal(omni.model, "qwen3.5-omni-plus");
  assert.match(String(omni.prompt || ""), /listenText, finalMandarinText/);
  assert.match(String(omni.prompt || ""), /不要使用阿拉伯数字/);
  assert.match(String(omni.prompt || ""), /标点只允许使用 ，。？！不允许其他标点/);
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
        rawText: JSON.stringify({
          listenText: "第3段：3、2、1！！！",
          finalMandarinText: "第3段：3、2、1！！！",
          isSinging: false,
          isNonTaizhouDialect: false,
          blockAutoFill: false,
          needHumanReview: false,
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
  assert.match(receivedPrompt.systemPrompt, /不要使用阿拉伯数字/);
  assert.equal(receivedOptions.model, "qwen3.5-omni-plus");
  assert.equal(receivedOptions.enableThinking, false);
  assert.equal(result.listenText, "第3段：3、2、1！！！");
  assert.equal(result.finalMandarinText, "第三段，三，二，一！");
  assert.deepEqual(result.models, { omniModel: "qwen3.5-omni-plus" });
  assert.equal(result.usage.omni.total_tokens, 30);
  assert.ok(result.cost.omni);
  assert.equal(result.raw.omni.includes("finalMandarinText"), true);
});

test("Taizhou blocks auto fill when the single Omni response is not valid JSON", async function () {
  const result = await aiService.recommend(createRequest(), {}, {
    normalizeUsage: function (usage) {
      return usage || {};
    },
    requestOmniInputAudio: async function () {
      return {
        model: "qwen3.5-omni-plus",
        rawText: "不是 JSON 的模型输出",
        usage: {},
      };
    },
  });

  assert.equal(result.needHumanReview, true);
  assert.equal(result.blockAutoFill, true);
  assert.match(result.notes.join("\n"), /标准 JSON/);
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
        rawText: JSON.stringify({ finalMandarinText: "普通话文本。" }),
        usage: {},
      };
    },
  });

  assert.equal(request.timeoutMs, aiService.DEFAULT_TIMEOUT_MS);
  assert.deepEqual(timeouts, [aiService.DEFAULT_TIMEOUT_MS]);
});
