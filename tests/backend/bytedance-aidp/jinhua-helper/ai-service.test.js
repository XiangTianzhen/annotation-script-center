"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const aiService = require(resolveRepo(
  "platform-resources",
  "bytedance-aidp",
  "jinhua-helper",
  "backend",
  "ai-service.js"
));
const qwenProvider = require(resolveRepo(
  "platform-resources",
  "backend",
  "ai",
  "providers",
  "qwen-openai-compatible.js"
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

test("Jinhua Omni result preserves raw text byte-for-byte and omits conversion fields", function () {
  const rawText = "  raw text with spaces  \nnext line  ";
  const result = aiService.__testOnly.normalizeOmniOutput(rawText);

  assert.deepEqual(result, {
    listenText: rawText,
  });
});

test("Jinhua defaults expose the configured dialect-to-Mandarin prompt", function () {
  const payload = aiService.createDefaultsPayload();
  const omni = payload.defaults?.omni || {};
  const defaultPrompt = String(omni.prompt || "");

  assert.equal(omni.model, "qwen3.5-omni-plus");
  assert.match(String(omni.prompt || ""), /你是一位精通\*\*金华地区方言\*\*（吴语金衢片）与普通话转换的语言专家/);
  assert.match(String(omni.prompt || ""), /“我金华上班”必须保留为 \*\*“我金华上班”\*\*/);
  assert.match(String(omni.prompt || ""), /- `\[强制翻译\]`：无视方言归属，强制执行翻译/);
  assert.match(String(omni.prompt || ""), /如 `luo`\/>?`luan` → `卵`/);
  assert.match(String(omni.prompt || ""), /标点符号仅允许使用 `, \. \? ! ;`/);
  assert.match(String(omni.prompt || ""), /\*\*最终输出\*\*：`1\. 我金华上班。`/);
  assert.match(String(omni.prompt || ""), /请等待用户输入音频文本或指令，即刻开始执行上述流程/);
  assert.doesNotMatch(String(omni.prompt || ""), /JSON 字段固定为：listenText/);
  assert.doesNotMatch(defaultPrompt, /(?:JSON|listenText)/i);
  assert.deepEqual(payload.supportedModels?.omni, ["qwen3.5-omni-plus", "qwen3.5-omni-flash"]);
  assert.deepEqual(payload.contract?.stages, ["omni"]);
});

test("Jinhua rule reference identifies the editable Prompt as the only conversion authority", function () {
  const rules = fs.readFileSync(resolveRepo(
    "platform-resources",
    "bytedance-aidp",
    "jinhua-helper",
    "ai",
    "assets",
    "jinhua-rules.md"
  ), "utf8");

  assert.match(rules, /当前有效转写规则/);
  assert.match(rules, /不直接作为模型 systemPrompt/);
  assert.doesNotMatch(rules, /不翻译成普通话/);
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

test("Jinhua request defaults thinking to false and accepts only a strict true value", function () {
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

test("Qwen Omni forwards an explicitly enabled thinking switch to the Bailian request", async function (t) {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.DASHSCOPE_API_KEY;
  let requestBody = null;

  process.env.DASHSCOPE_API_KEY = "test-key";
  global.fetch = async function (_url, options) {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      text: async function () {
        return JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ listenText: "测试结果" }) } }],
          usage: {},
        });
      },
    };
  };
  t.after(function () {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.DASHSCOPE_API_KEY;
    } else {
      process.env.DASHSCOPE_API_KEY = originalApiKey;
    }
  });

  await qwenProvider.requestOmniInputAudio(
    { audioDataUrl: "data:audio/wav;base64,ZmFrZQ==" },
    { systemPrompt: "测试 system Prompt", userPrompt: "测试 user Prompt" },
    { model: "qwen3.5-omni-plus", enableThinking: true, timeoutMs: 1000 }
  );

  assert.equal(requestBody.enable_thinking, true);
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
        rawText: "raw model transcription",
        usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
      };
    },
    requestTextCompareJson: async function () {
      throw new Error("single Omni flow must not invoke a text provider");
    },
  });

  assert.equal(callCount, 1);
  assert.equal(receivedPrompt.systemPrompt, "自定义全模态 Prompt");
  assert.doesNotMatch(receivedPrompt.userPrompt, /只返回 JSON/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /仅包含 listenText/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /只输出当前音频片段的最终转写文本/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /不得输出 JSON/);
  assert.match(receivedPrompt.userPrompt, /单次全模态识别上下文/);
  assert.match(receivedPrompt.userPrompt, /参考资料已加载：jinhua-rules\.md/);
  assert.match(receivedPrompt.userPrompt, /"segment"/);
  assert.equal(receivedOptions.model, "qwen3.5-omni-plus");
  assert.equal(receivedOptions.enableThinking, false);
  assert.equal(result.listenText, "raw model transcription");
  assert.equal(Object.hasOwn(result, "finalMandarinText"), false);
  assert.deepEqual(result.models, { omniModel: "qwen3.5-omni-plus" });
  assert.equal(result.usage.omni.total_tokens, 30);
  assert.ok(result.cost.omni);
  assert.equal(result.raw.omni, "raw model transcription");
  assert.equal(Object.hasOwn(result.debug, "omni"), false);
});

test("Jinhua blank custom prompt falls back to the backend default without a JSON envelope", async function () {
  const defaultPrompt = aiService.createDefaultsPayload().defaults?.omni?.prompt;
  const request = createRequest({
    aiOmni: {
      prompt: "  \n  ",
    },
  });
  let receivedPrompt = null;

  const result = await aiService.recommend(request, {}, {
    normalizeUsage: function (usage) {
      return usage || {};
    },
    requestOmniInputAudio: async function (_input, prompt) {
      receivedPrompt = prompt;
      return {
        model: "qwen3.5-omni-plus",
        rawText: "default Prompt transcription",
        usage: {},
      };
    },
  });

  assert.equal(receivedPrompt.systemPrompt, defaultPrompt);
  assert.doesNotMatch(receivedPrompt.systemPrompt, /(?:JSON|listenText)/i);
  assert.doesNotMatch(receivedPrompt.userPrompt, /只返回 JSON/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /仅包含 listenText/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /只输出当前音频片段的最终转写文本/);
  assert.doesNotMatch(receivedPrompt.userPrompt, /不得输出 JSON/);
  assert.match(receivedPrompt.userPrompt, /单次全模态识别上下文/);
  assert.equal(result.listenText, "default Prompt transcription");
});

test("Jinhua maps every Omni text response to listenText byte-for-byte", async function () {
  const rawTexts = [
    "  raw text with spaces  \nnext line  ",
    "**Markdown result**\n\nExplanation: model output",
    JSON.stringify({ listenText: "legacy JSON result" }),
    "",
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
    assert.equal(Object.hasOwn(result, "finalMandarinText"), false);
  }
});

test("Jinhua converts non-string Omni responses into empty text without throwing", async function () {
  for (const rawText of [undefined, null, { unexpected: "object" }]) {
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
    assert.equal(result.raw.omni, "");
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
