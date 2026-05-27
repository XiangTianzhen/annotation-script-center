"use strict";

const assert = require("assert");
const test = require("node:test");

const adapter = require("./adapter");

test("ASR transcription adapter normalizes suggest request into framework payload", function () {
  const normalized = adapter.normalizeInput({
    taskItemId: "task-item-1",
    itemIndex: "3",
    projectName: "demo-project",
    audioCandidates: [
      {
        id: "a",
        url: "https://example.com/audio-a.wav",
        format: "wav",
      },
      {
        id: "dup",
        url: "https://example.com/audio-a.wav",
        format: "wav",
      },
      {
        id: "bad",
        url: "invalid-url",
        format: "mp3",
      },
    ],
    textCandidates: [
      {
        id: "a",
        text: " 第一条候选 ",
      },
      {
        id: "b",
        text: "第一条候选",
      },
      {
        id: "c",
        text: "第二条候选",
      },
    ],
    currentText: " 当前文本 ",
    aiOptions: {
      listenModel: "qwen3.5-omni-flash",
      compareModel: "qwen3.5-plus",
      temperature: 0.2,
      enable_thinking: true,
    },
  });

  assert.equal(normalized.input.taskItemId, "task-item-1");
  assert.equal(normalized.input.itemIndex, 3);
  assert.equal(normalized.input.projectName, "demo-project");
  assert.equal(normalized.input.audioCandidates.length, 1);
  assert.equal(normalized.input.audioCandidates[0].url, "https://example.com/audio-a.wav");
  assert.equal(normalized.input.invalidAudioCount, 1);
  assert.equal(normalized.input.textCandidates.length, 2);
  assert.equal(normalized.input.textCandidates[0].text, "第一条候选");
  assert.equal(normalized.input.textCandidates[1].text, "第二条候选");
  assert.equal(normalized.input.currentText, "当前文本");
  assert.equal(normalized.projectOptions.listenModel, "qwen3.5-omni-flash");
  assert.equal(normalized.projectOptions.compareModel, "qwen3.5-plus");
  assert.equal(normalized.projectOptions.enableThinking, true);
  assert.equal(normalized.projectOptions.timeoutMs, 120000);
  assert.equal(normalized.projectOptions.allowClientModelOverride, true);
  assert.equal(normalized.projectOptions.aiOptions.temperature, 0.2);
});

test("ASR transcription adapter builds legacy success body", function () {
  const responseBody = adapter.buildSuggestSuccessBody({
    execution: {
      pipelineResult: {
        requestId: "req-1",
        decision: "candidate_a",
        recommendedText: "推荐文本",
      },
    },
  });

  assert.deepEqual(responseBody, {
    success: true,
    data: {
      requestId: "req-1",
      decision: "candidate_a",
      recommendedText: "推荐文本",
    },
  });
});

test("ASR transcription adapter builds legacy error body", function () {
  const error = new Error("AI 推荐请求失败。");
  error.code = "provider-http-error";
  error.requestId = "request-9";
  error.summary = "上游返回异常";

  const responseBody = adapter.buildSuggestErrorBody({
    error,
    requestId: "request-9",
  });

  assert.equal(responseBody.success, false);
  assert.equal(responseBody.requestId, "request-9");
  assert.equal(responseBody.code, "provider-http-error");
  assert.equal(responseBody.message, "AI 推荐请求失败。");
  assert.equal(responseBody.summary, "上游返回异常");
});
