"use strict";

const assert = require("assert");
const test = require("node:test");

const client = require("./dashscope-omni-client");

test("Aishell DashScope omni client builds non-thinking stream request", function () {
  const requestBody = client.buildDashScopeOmniRequestBody({
    model: "qwen3-omni-flash",
    audioUrl: "https://example.com/audio.wav",
    systemPrompt: "system prompt",
    userPrompt: "这段音频在说什么",
  });

  assert.equal(requestBody.model, "qwen3-omni-flash");
  assert.equal(requestBody.stream, true);
  assert.equal(requestBody.stream_options?.include_usage, true);
  assert.deepEqual(requestBody.modalities, ["text"]);
  assert.equal(requestBody.enable_thinking, false);
  assert.equal(requestBody.messages[0].role, "system");
  assert.equal(requestBody.messages[1].role, "user");
  assert.equal(requestBody.messages[1].content[0].type, "input_audio");
  assert.equal(requestBody.messages[1].content[0].input_audio.format, "wav");
  assert.equal(requestBody.messages[1].content[1].type, "text");
});
