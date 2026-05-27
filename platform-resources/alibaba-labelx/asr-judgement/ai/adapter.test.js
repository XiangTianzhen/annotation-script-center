"use strict";

const assert = require("assert");
const test = require("node:test");

const adapter = require("./adapter");

test("ASR judgement adapter normalizes suggest request into framework payload", function () {
  const normalized = adapter.normalizeInput({
    projectId: "project-1",
    subTaskId: "subtask-1",
    itemId: "item-1",
    itemIndex: "5",
    audioUrl: "https://example.com/audio.wav",
    asrText1: " 候选一 ",
    asrText2: " 候选二 ",
    contextText: " 上文提示 ",
    includeContext: false,
    aiOptions: {
      listenModel: "qwen3.5-omni-flash",
      compareModel: "qwen3.5-plus",
      temperature: 0.2,
      enable_thinking: true,
      webSearchEnabled: false,
    },
  });

  assert.equal(normalized.input.projectId, "project-1");
  assert.equal(normalized.input.subTaskId, "subtask-1");
  assert.equal(normalized.input.itemId, "item-1");
  assert.equal(normalized.input.itemIndex, 5);
  assert.equal(normalized.input.audioUrl, "https://example.com/audio.wav");
  assert.equal(normalized.input.asrText1, "候选一");
  assert.equal(normalized.input.asrText2, "候选二");
  assert.equal(normalized.input.contextText, "上文提示");
  assert.equal(normalized.input.contextAvailable, true);
  assert.equal(normalized.input.includeContext, false);
  assert.equal(normalized.projectOptions.listenModel, "qwen3.5-omni-flash");
  assert.equal(normalized.projectOptions.compareModel, "qwen3.5-plus");
  assert.equal(normalized.projectOptions.enableThinking, true);
  assert.equal(normalized.projectOptions.webSearchEnabled, false);
  assert.equal(normalized.projectOptions.timeoutMs, 120000);
  assert.equal(normalized.projectOptions.allowClientModelOverride, true);
  assert.equal(normalized.projectOptions.aiOptions.temperature, 0.2);
});

test("ASR judgement adapter builds legacy success body", function () {
  const responseBody = adapter.buildSuggestSuccessBody({
    execution: {
      pipelineResult: {
        requestId: "req-1",
        answer: "first_better",
        choiceActionKey: "choiceFirstBetter",
      },
    },
  });

  assert.deepEqual(responseBody, {
    success: true,
    data: {
      requestId: "req-1",
      answer: "first_better",
      choiceActionKey: "choiceFirstBetter",
    },
  });
});

test("ASR judgement adapter builds legacy error body", function () {
  const error = new Error("AI suggest 请求失败。");
  error.code = "provider-http-error";
  error.requestId = "request-3";
  error.providerStatus = 502;
  error.summary = "上游接口异常";

  const responseBody = adapter.buildSuggestErrorBody({
    error,
    requestId: "request-3",
  });

  assert.equal(responseBody.success, false);
  assert.equal(responseBody.requestId, "request-3");
  assert.equal(responseBody.code, "provider-http-error");
  assert.equal(responseBody.message, "AI suggest 请求失败。");
  assert.equal(responseBody.providerStatus, 502);
  assert.equal(responseBody.summary, "上游接口异常");
});
