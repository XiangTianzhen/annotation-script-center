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
  assert.equal(request.refineModel, "qwen3.5-plus");
});

test("Shujiajia request rejects remote audio URLs and malformed data URLs", () => {
  const service = require(servicePath);
  assert.throws(() => service.normalizeRecommendRequest({ audioUrl: "https://example.com/a.wav" }), /audioDataUrl/);
  assert.throws(() => service.normalizeRecommendRequest({ audioDataUrl: "data:text/plain;base64,AAAA" }), /audioDataUrl/);
});

test("Shujiajia recommendation returns two stages with usage and cost", async () => {
  const service = require(servicePath);
  const request = service.normalizeRecommendRequest({ audioDataUrl: "data:audio/wav;base64,AAAA", requestId: "safe" });
  let now = 100;
  const result = await service.recommend(request, {}, {
    now: () => (now += 5),
    requestOmniInputAudio: async () => ({ rawText: "我今天切赶场。", model: "qwen3.5-omni-flash", usage: { input_tokens: 10, output_tokens: 2 } }),
    requestTextCompareJson: async () => ({ rawText: '{"text":"我今天去赶场。"}', model: "qwen3.5-plus", usage: { input_tokens: 6, output_tokens: 3 } }),
  });
  assert.equal(result.listenText, "我今天切赶场。");
  assert.equal(result.refinedText, "我今天去赶场。");
  assert.equal(result.usage.listen.totalTokens, 12);
  assert.equal(result.usage.refine.totalTokens, 9);
  assert.ok(result.cost && typeof result.cost === "object");
  assert.deepEqual(result.raw, { listen: "我今天切赶场。", refine: '{"text":"我今天去赶场。"}' });
});

test("Shujiajia defaults expose the no-lexicon two-stage contract", () => {
  const service = require(servicePath);
  const payload = service.createDefaultsPayload();
  assert.equal(payload.success, true);
  assert.deepEqual(payload.contract.stages, ["listen", "refine"]);
  assert.equal(payload.contract.lexicon, false);
  assert.equal(payload.defaults.timeoutMs, 60000);
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
