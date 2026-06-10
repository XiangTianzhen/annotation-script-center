"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const contentModulePath = path.resolve(__dirname, "content.js");
const concurrentStreamFactory = require("../../../shared/concurrent-ai-request-stream.js");

function loadContentModule() {
  delete require.cache[contentModulePath];
  delete globalThis.ASREdgeDataBakerCvpcLiuzhouContent;
  delete globalThis.__ASREdgeDataBakerCvpcLiuzhouInstalled;
  return require(contentModulePath);
}

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise(function (innerResolve, innerReject) {
    resolve = innerResolve;
    reject = innerReject;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

function createLockedContext(overrides) {
  return Object.assign(
    {
      audioUrl: "https://oss.example.com/sample-a.mp3?Signature=batch",
      audioUrlHintMessage: "",
      selectedEntry: {
        name: "sample-a.mp3",
      },
      query: {
        projectId: "1453",
        taskId: "12099",
        processId: "4946",
        dataId: "17896",
        jobId: "1520",
        terminal: "group@1134",
      },
      fieldContext: {},
      editorContext: {
        template: {
          attrs: [],
          entry_attrs: [],
          moment_attrs: [],
        },
      },
      platformUserName: "柳州标注员",
      platformUserId: "9527",
    },
    overrides || {}
  );
}

function createBatchPlan(total) {
  return {
    selectedEntryName: "sample-a.mp3",
    totalSegments: total,
    allSegmentUniqueIds: Array.from({ length: total }, function (_item, index) {
      return "region-" + String(index + 1);
    }),
    segments: Array.from({ length: total }, function (_item, index) {
      const startMs = index * 1000;
      const endMs = startMs + 800;
      return {
        segmentNumber: index + 1,
        uniqueId: "region-" + String(index + 1),
        startMs: startMs,
        endMs: endMs,
        selectionKey: "sample-a.mp3|" + String(startMs) + "|" + String(endMs),
      };
    }),
  };
}

test("CVPC batch controller stops launching new AI requests after stop and saves only finished successes", async function () {
  const contentModule = loadContentModule();
  const deferreds = Array.from({ length: 20 }, createDeferred);
  const started = [];
  const savedPayloads = [];
  let reloadCount = 0;
  let contextReadCount = 0;
  const lockedContext = createLockedContext();

  const controller = contentModule.createBatchRecommendController({
    concurrentRequestStreamFactory: concurrentStreamFactory,
    reloadPage: function () {
      reloadCount += 1;
    },
    ui: {
      renderBatchState: function () {},
      setStatus: function () {},
    },
    dataApi: {
      getEditorContext: async function () {
        contextReadCount += 1;
        return lockedContext;
      },
      getBatchSegments: async function () {
        return createBatchPlan(20);
      },
      applyBatchTextRecommendations: async function (payload) {
        savedPayloads.push(payload);
        return {
          ok: true,
          savedCount: payload.results.length,
          message: "saved",
        };
      },
    },
    ai: {
      createSharedAudioSource: function () {
        return {};
      },
      recommendForSegment: function (task) {
        started.push(task.segmentNumber);
        return deferreds[task.segmentNumber - 1].promise;
      },
    },
  });

  const startPromise = controller.start("");
  await wait(320);
  assert.equal(started.length, 5);

  const stopResult = controller.stop();
  assert.deepEqual(stopResult, {
    ok: true,
    message: "已请求停止，将在当前已发起段完成后结束本轮批量识别。",
  });

  await wait(160);
  assert.equal(started.length, 5);

  for (let index = 0; index < 5; index += 1) {
    deferreds[index].resolve({
      refinedDialectText: "柳州话" + String(index + 1),
      refinedMandarinText: "普通话" + String(index + 1),
    });
  }

  const result = await startPromise;
  assert.deepEqual(result, {
    ok: true,
    savedCount: 5,
    message: "saved",
  });
  assert.equal(savedPayloads.length, 1);
  assert.equal(savedPayloads[0].results.length, 5);
  assert.equal(savedPayloads[0].results[0].uniqueId, "region-1");
  assert.equal(savedPayloads[0].results[4].uniqueId, "region-5");
  assert.equal(reloadCount, 1);
  assert.equal(contextReadCount, 1);
});

test("CVPC batch controller reloads exactly once after a successful full batch save", async function () {
  const contentModule = loadContentModule();
  let reloadCount = 0;
  let saveCount = 0;
  const lockedContext = createLockedContext();

  const controller = contentModule.createBatchRecommendController({
    concurrentRequestStreamFactory: concurrentStreamFactory,
    reloadPage: function () {
      reloadCount += 1;
    },
    ui: {
      renderBatchState: function () {},
      setStatus: function () {},
    },
    dataApi: {
      getEditorContext: async function () {
        return lockedContext;
      },
      getBatchSegments: async function () {
        return createBatchPlan(2);
      },
      applyBatchTextRecommendations: async function (payload) {
        saveCount += 1;
        return {
          ok: true,
          savedCount: payload.results.length,
          message: "saved",
        };
      },
    },
    ai: {
      createSharedAudioSource: function () {
        return {};
      },
      recommendForSegment: async function (task) {
        return {
          refinedDialectText: "柳州话" + String(task.segmentNumber),
          refinedMandarinText: "普通话" + String(task.segmentNumber),
        };
      },
    },
  });

  const result = await controller.start("");
  assert.deepEqual(result, {
    ok: true,
    savedCount: 2,
    message: "saved",
  });
  assert.equal(saveCount, 1);
  assert.equal(reloadCount, 1);
});

test("CVPC batch controller aborts save when current entry changes before write-back", async function () {
  const contentModule = loadContentModule();
  let saveCalled = false;

  const controller = contentModule.createBatchRecommendController({
    concurrentRequestStreamFactory: concurrentStreamFactory,
    reloadPage: function () {
      throw new Error("reload should not happen");
    },
    ui: {
      renderBatchState: function () {},
      setStatus: function () {},
    },
    dataApi: {
      getEditorContext: async function () {
        return createLockedContext();
      },
      getLiveSelectionSnapshot: function () {
        return {
          selectedEntryName: "sample-b.mp3",
        };
      },
      getBatchSegments: async function () {
        return createBatchPlan(1);
      },
      applyBatchTextRecommendations: async function () {
        saveCalled = true;
        return {
          ok: true,
          savedCount: 1,
          message: "saved",
        };
      },
    },
    ai: {
      createSharedAudioSource: function () {
        return {};
      },
      recommendForSegment: async function () {
        return {
          refinedDialectText: "柳州话1",
          refinedMandarinText: "普通话1",
        };
      },
    },
  });

  const result = await controller.start("");
  assert.deepEqual(result, {
    ok: false,
    message: "当前音频或条目已变化，已停止批量写回，请刷新后重试。",
  });
  assert.equal(saveCalled, false);
});

test("CVPC content failure helper forwards recommendation payload to ui renderRecommendation", function () {
  const contentModule = loadContentModule();
  const rendered = [];
  const statuses = [];

  contentModule.__testOnly.handleRecommendationFailure(
    {
      ui: {
        renderRecommendation: function (payload) {
          rendered.push(payload);
        },
        setStatus: function (message, tone) {
          statuses.push([message, tone]);
        },
      },
    },
    {
      message: "模型输出 JSON 解析失败，可查看原始 AI 返回。",
      payload: {
        success: false,
        debugRawJson: {
          rawResponseText: "{\"foo\":\"bar\"}",
        },
      },
    }
  );

  assert.deepEqual(rendered, [
    {
      success: false,
      debugRawJson: {
        rawResponseText: "{\"foo\":\"bar\"}",
      },
    },
  ]);
  assert.deepEqual(statuses, [["当前段 AI 推荐失败：模型输出 JSON 解析失败，可查看原始 AI 返回。", "error"]]);
});

test("CVPC content exposes updated recognition and segment copy", function () {
  const contentModule = loadContentModule();

  assert.deepEqual(contentModule.__testOnly.copy, {
    recommendReady: "当前段识别结果已生成。",
    recommendRequired: "请先完成当前段识别。",
    previewBusy: "正在生成当前音频分段建议...",
    previewReady: "分段建议已生成，请先复核后再应用到页面。",
    previewFailedPrefix: "生成分段建议失败：",
  });
});

test("CVPC content auto-apply helper skips apply when preview auto-apply is disabled", async function () {
  const contentModule = loadContentModule();
  let applyCalled = false;
  const statuses = [];

  const result = await contentModule.__testOnly.maybeAutoApplyPreview(
    {
      config: {
        segmentPreviewAutoApplyEnabled: false,
      },
      dataApi: {
        applySegmentPreview: async function () {
          applyCalled = true;
          return {
            ok: true,
            message: "should not run",
          };
        },
      },
      ui: {
        setStatus: function (message, tone) {
          statuses.push([message, tone]);
        },
        renderPreview: function () {},
      },
      segment: {
        clearPreview: function () {},
      },
      reloadPage: function () {
        throw new Error("reload should not happen");
      },
    },
    {
      proposedSegments: [{ startMs: 0, endMs: 1200 }],
    }
  );

  assert.deepEqual(result, {
    attempted: false,
    ok: false,
    reason: "disabled",
  });
  assert.equal(applyCalled, false);
  assert.deepEqual(statuses, []);
});

test("CVPC content auto-apply helper applies preview, clears preview, and reloads once on success", async function () {
  const contentModule = loadContentModule();
  const statuses = [];
  const previews = [];
  let clearCount = 0;
  let reloadCount = 0;

  const result = await contentModule.__testOnly.maybeAutoApplyPreview(
    {
      config: {
        segmentPreviewAutoApplyEnabled: true,
      },
      dataApi: {
        applySegmentPreview: async function () {
          return {
            ok: true,
            message: "已通过平台保存接口应用分段建议，请刷新页面复核；本次无需再点平台保存。",
          };
        },
      },
      ui: {
        setStatus: function (message, tone) {
          statuses.push([message, tone]);
        },
        renderPreview: function (value) {
          previews.push(value);
        },
      },
      segment: {
        clearPreview: function () {
          clearCount += 1;
        },
      },
      reloadPage: function () {
        reloadCount += 1;
      },
    },
    {
      proposedSegments: [{ startMs: 0, endMs: 1200 }],
    }
  );

  assert.deepEqual(result, {
    attempted: true,
    ok: true,
    result: {
      ok: true,
      message: "已通过平台保存接口应用分段建议，请刷新页面复核；本次无需再点平台保存。",
    },
  });
  assert.equal(clearCount, 1);
  assert.deepEqual(previews, [null]);
  assert.deepEqual(statuses, [["已通过平台保存接口应用分段建议，请刷新页面复核；本次无需再点平台保存。", "success"]]);
  assert.equal(reloadCount, 1);
});

test("CVPC content auto-apply helper keeps preview and skips reload when apply fails", async function () {
  const contentModule = loadContentModule();
  const statuses = [];
  const previews = [];
  let clearCount = 0;
  let reloadCount = 0;

  const result = await contentModule.__testOnly.maybeAutoApplyPreview(
    {
      config: {
        segmentPreviewAutoApplyEnabled: true,
      },
      dataApi: {
        applySegmentPreview: async function () {
          return {
            ok: false,
            message: "当前分段建议生成了重复 unique_id，已停止自动应用，请重新生成或人工处理。",
          };
        },
      },
      ui: {
        setStatus: function (message, tone) {
          statuses.push([message, tone]);
        },
        renderPreview: function (value) {
          previews.push(value);
        },
      },
      segment: {
        clearPreview: function () {
          clearCount += 1;
        },
      },
      reloadPage: function () {
        reloadCount += 1;
      },
    },
    {
      proposedSegments: [{ startMs: 0, endMs: 1200 }],
    }
  );

  assert.deepEqual(result, {
    attempted: true,
    ok: false,
    result: {
      ok: false,
      message: "当前分段建议生成了重复 unique_id，已停止自动应用，请重新生成或人工处理。",
    },
  });
  assert.equal(clearCount, 0);
  assert.deepEqual(previews, []);
  assert.deepEqual(statuses, [[
    "分段建议已生成，但自动应用失败：当前分段建议生成了重复 unique_id，已停止自动应用，请重新生成或人工处理。",
    "error",
  ]]);
  assert.equal(reloadCount, 0);
});
