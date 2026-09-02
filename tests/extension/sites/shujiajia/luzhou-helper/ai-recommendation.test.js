"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const client = require(resolveRepo("extension", "sites", "shujiajia", "luzhou-helper", "ai-recommendation.js"));

test("AI client serializes only temporary audio data and two-stage settings", () => {
  const payload = client.buildRequestPayload({
    audioDataUrl: "data:audio/wav;base64,AAAA",
    requestId: "safe",
    aiUsageOperatorName: "测试人员",
    settings: {
      aiRecommendListenModel: "qwen3.5-omni-plus",
      aiRecommendRefineModel: "qwen3.5-flash",
      aiRecommendListenPrompt: "听写",
      aiRecommendRefinePrompt: "整理",
    },
  });
  assert.equal(payload.audioDataUrl, "data:audio/wav;base64,AAAA");
  assert.equal(payload.audioUrl, undefined);
  assert.equal(payload.aiUsageOperatorName, "测试人员");
  assert.equal(payload.aiStages.listen.model, "qwen3.5-omni-plus");
  assert.equal(payload.aiStages.refine.prompt, "整理");
  assert.equal(JSON.stringify(payload).includes("cookie"), false);
});

test("AI client preserves the backend error code and request id", async () => {
  await assert.rejects(
    client.recognize({
      audioDataUrl: "data:audio/wav;base64,AAAA",
      requestId: "client-request",
      settings: { enabled: true },
      settingsRoot: { meta: { aiUsageOperatorName: "测试人员" } },
      fetchImpl: async () => ({
        ok: false,
        json: async () => ({ success: false, code: "provider-timeout", requestId: "server-request", message: "识别超时" }),
      }),
    }),
    (error) => error.code === "provider-timeout" && error.requestId === "server-request"
  );
});
