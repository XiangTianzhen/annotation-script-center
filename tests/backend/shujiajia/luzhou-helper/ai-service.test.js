"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const servicePath = resolveRepo("platform-resources", "shujiajia", "luzhou-helper", "backend", "ai-service.js");

test("Shujiajia request accepts only data audio and clamps timeout to 60000ms", () => {
  const service = require(servicePath);
  const request = service.normalizeRecommendRequest({
    audioDataUrl: "data:audio/wav;base64,AAAA",
    timeoutMs: 90000,
    requestId: "safe-request",
  });
  assert.equal(request.audioDataUrl, "data:audio/wav;base64,AAAA");
  assert.equal(request.timeoutMs, 60000);
  assert.equal(request.listenModel, "qwen3.5-omni-flash");
  assert.equal(request.refineModel, undefined);
});

test("Shujiajia request rejects remote audio URLs and malformed data URLs", () => {
  const service = require(servicePath);
  assert.throws(() => service.normalizeRecommendRequest({ audioUrl: "https://example.com/a.wav" }), /audioDataUrl/);
  assert.throws(() => service.normalizeRecommendRequest({ audioDataUrl: "data:text/plain;base64,AAAA" }), /audioDataUrl/);
});

test("Shujiajia recommendation returns one dialect stage with a compatibility alias", async () => {
  const service = require(servicePath);
  const request = service.normalizeRecommendRequest({ audioDataUrl: "data:audio/wav;base64,AAAA", requestId: "safe" });
  let now = 100;
  const result = await service.recommend(request, {}, {
    now: () => (now += 5),
    requestOmniInputAudio: async () => ({ rawText: "我今天切赶场。", model: "qwen3.5-omni-flash", usage: { input_tokens: 10, output_tokens: 2 } }),
    requestTextCompareJson: async () => { throw new Error("single-stage flow must not call the text model"); },
  });
  assert.equal(result.dialectText, "我今天切赶场。");
  assert.equal(result.refinedText, "我今天切赶场。");
  assert.equal(result.usage.listen.totalTokens, 12);
  assert.equal(result.usage.refine, undefined);
  assert.ok(result.cost && typeof result.cost === "object");
  assert.deepEqual(result.raw, { listen: "我今天切赶场。" });
  assert.equal(result.models.refineModel, undefined);
});

test("Shujiajia default request sends the optimized transcription rules with a plain-text output contract", async () => {
  const service = require(servicePath);
  const request = service.normalizeRecommendRequest({
    audioDataUrl: "data:audio/wav;base64,AAAA",
    requestId: "prompt-contract",
  });
  let systemPrompt = "";
  await service.recommend(request, {}, {
    requestOmniInputAudio: async (_audioDataUrl, prompts) => {
      systemPrompt = prompts.systemPrompt;
      return { rawText: "最终转写", model: "qwen3.5-omni-flash", usage: {} };
    },
  });

  assert.match(systemPrompt, /禁止同义替换/);
  assert.match(systemPrompt, /只删除能够确定且可以独立区分的普通话片段/);
  assert.match(systemPrompt, /不得输出“无法标注”“音频无效”/);
  assert.match(systemPrompt, /只输出最终转写文本/);
  assert.doesNotMatch(systemPrompt, /\{"text"/);
  assert.doesNotMatch(systemPrompt, /【听不清】/);

  assert.match(systemPrompt, /你是一名精通泸州话、四川话的语音逐字转写人员。用户会提供一段音频，你须直接依据原音生成最终转写，并在输出前内部复听核对一次。本任务不是翻译、释义、普通话化或方言化。/);
  const rules = systemPrompt.split("\n").filter((line) => /^\d+\.\s/.test(line));
  assert.deepEqual(rules, [
    "1. 原音优先：每个输出字词和音节都必须有原音依据。不根据句意补字，不润色，不改写，不调整语序，不修改说话人的用词或语法。",
    "2. 禁止同义替换：只有同一个词因口音产生音变时，才按该词的正确字形记录；意思相同但发音不同的词不得互换。听到“孩子”不得改成“娃儿”，听到“不清楚”不得改成“不晓得”；原音实际读出“娃儿”或“晓得”时则照实记录。",
    "3. 保留方言原音：真正的泸州方言词、虚词、助词和衔接音均按实际发音记录，不翻译、不省略。听到“嘞”就写“嘞”，不得改成“的”；实际读出“安”等音节时必须保留。",
    "4. 普通话与方言：明确属于普通话和方言混合的音频，只删除能够确定且可以独立区分的普通话片段，按原顺序保留方言内容；整条音频均为普通话时，完整转写普通话；无法确定时优先保留，避免误删。",
    "5. 尽力听写：不得输出“无法标注”“音频无效”等判断。能听清发音但不能确定具体字词时，结合读音和泸州话语境，选用读音最接近的常用汉字合理音译，不添加“疑似”“待确认”“听不清”等标记。",
    "6. 保持完整：保留重复、口吃、倒装、填充词、语气词和儿化音，不得漏写、合并或删减。两个泸州话说话人同时说话时，只转写声音最大的说话人，其他较小的重叠声音不转写。例如听到“我是北北京人”，写作“我是北，北京人”。",
    "7. 人名和地名：知名人名、地名使用通行写法；泸州知名地名使用标准名称，如“张坝漫道、国窖大桥、茜草、蓝田、小市、大山坪、龙透关、沱江二桥”；不知名的人名、地名按读音选用常用汉字音译，不添加标记。",
    "8. 数字：按实际读法写成简体汉字，不使用阿拉伯数字。读“幺”写“幺”，读“一”写“一”，不得漏字。",
    "9. 网络用语和儿化音：网络用语按原音记录；实际读出儿化音时写“儿”，未读出时不添加。",
    "10. 英文：逐字母拼读或缩写使用小写字母并以空格分隔；英文单词或句子按正常英文拼写，句首字母小写，单词间留一个空格；品牌、商标、邮箱和网址在能够确认时保留专有写法。读出“dot”写“dot”，读出“点”写“点”。纯英文内容使用英文标点，中英混合内容使用中文标点。",
    "11. 标点：根据中文语法、说话人的语气、停顿和上下文断句。中文内容只使用逗号、句号、叹号、问号和中文双引号，即，。！？“”。书名使用中文双引号；句子未说完时不强行添加句号。",
  ]);
});

test("Shujiajia custom listen prompt remains the complete provider system prompt", async () => {
  const service = require(servicePath);
  const customPrompt = "这是用户保存的完整自定义 Prompt。\n只按用户规则执行。";
  const request = service.normalizeRecommendRequest({
    audioDataUrl: "data:audio/wav;base64,AAAA",
    aiStages: { listen: { prompt: customPrompt } },
  });
  let systemPrompt = "";
  await service.recommend(request, {}, {
    requestOmniInputAudio: async (_audioDataUrl, prompts) => {
      systemPrompt = prompts.systemPrompt;
      return { rawText: "结果", model: "qwen3.5-omni-flash", usage: {} };
    },
  });

  assert.equal(systemPrompt, customPrompt);
  assert.doesNotMatch(systemPrompt, /禁止同义替换/);
});

test("Shujiajia defaults expose the no-lexicon single-stage contract", () => {
  const service = require(servicePath);
  const payload = service.createDefaultsPayload();
  assert.equal(payload.success, true);
  assert.deepEqual(payload.contract.stages, ["listen"]);
  assert.equal(payload.contract.lexicon, false);
  assert.equal(payload.contract.writeMode, "optional-auto-fill");
  assert.equal(payload.defaults.stages.refine, undefined);
  assert.equal(payload.supportedModels.refine, undefined);
  assert.equal(payload.defaults.timeoutMs, 60000);
});

test("Shujiajia AI call log exposes only the dialect recognition stage", () => {
  const { aiCallLogger } = require(resolveRepo("platform-resources", "shujiajia", "luzhou-helper", "backend", "ai-call-log.js"));
  const row = aiCallLogger.buildRow({
    execution: { projectResult: {
      usage: { listen: { promptTokens: 10, completionTokens: 2, totalTokens: 12 } },
      models: { listenModel: "qwen3.5-omni-flash" },
      cost: { listen: { estimatedCostCny: 0.001 }, totalEstimatedCostCny: 0.001 },
    } },
  });
  assert.equal(row.listenPromptTokens, "10");
  assert.equal(row.listenCompletionTokens, "2");
  assert.equal(row.listenTotalTokens, "12");
  assert.equal(Object.hasOwn(row, "refinePromptTokens"), false);
  assert.equal(aiCallLogger.schema.some((column) => column.header.includes("整理")), false);
});

test("Shujiajia error response redacts URLs and credential-like values", () => {
  const service = require(servicePath);
  const body = service.buildRecommendErrorBody({
    requestId: "safe",
    error: { code: "provider-error", message: "failed https://example.invalid/private/audio.wav authorization=fake-value" },
  });
  assert.equal(body.success, false);
  assert.equal(body.message.includes("https://"), false);
  assert.equal(body.message.includes("fake-value"), false);
});

test("Shujiajia provider errors expose sanitized upstream diagnostics", () => {
  const service = require(servicePath);
  const body = service.buildRecommendErrorBody({
    requestId: "safe-request",
    error: {
      code: "provider-http-error",
      message: "Qwen 接口请求失败（HTTP 400）。",
      summary: '{"error":{"code":"invalid_parameter","message":"bad audio https://example.invalid/private.wav?token=secret"}}',
      providerStatus: 400,
      debugRawAiResponse: {
        provider: "qwen",
        model: "qwen3.5-omni-flash",
        stage: "omni_single",
        providerStatus: 400,
        responseBody: '{"error":{"code":"invalid_parameter","message":"bad audio https://example.invalid/private.wav?token=secret","authorization":"Bearer secret-value"}}',
      },
    },
  });

  assert.equal(body.providerStatus, 400);
  assert.equal(body.providerCode, "invalid_parameter");
  assert.match(body.summary, /invalid_parameter/);
  assert.deepEqual(
    {
      provider: body.rawResponse.provider,
      model: body.rawResponse.model,
      stage: body.rawResponse.stage,
      providerStatus: body.rawResponse.providerStatus,
    },
    {
      provider: "qwen",
      model: "qwen3.5-omni-flash",
      stage: "omni_single",
      providerStatus: 400,
    }
  );
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes("private.wav"), false);
  assert.equal(serialized.includes("secret-value"), false);
  assert.equal(serialized.includes("Bearer secret-value"), false);
});

test("Shujiajia provider raw response is capped at 20000 characters", () => {
  const service = require(servicePath);
  const body = service.buildRecommendErrorBody({
    error: {
      code: "provider-http-error",
      message: "Qwen failed",
      debugRawAiResponse: {
        provider: "qwen",
        providerStatus: 400,
        responseBody: "x".repeat(25000),
      },
    },
  });

  assert.equal(body.rawResponse.responseBody.length, 20000);
});
