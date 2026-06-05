const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
  createConcurrentAiRequestStream,
} = require("../../../shared/concurrent-ai-request-stream.js");

const aiRecommendationModulePath = path.resolve(__dirname, "ai-recommendation.js");

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function createDeferred() {
  let resolve = null;
  let reject = null;
  const promise = new Promise(function (res, rej) {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

test("Aishell batch refills request window before serial save finishes", async function () {
  const tasks = Array.from({ length: 18 }, function (_, index) {
    return {
      id: index + 1,
      displayName: String(index + 1),
    };
  });
  const launches = [];
  const deferredMap = new Map();

  const stream = createConcurrentAiRequestStream({
    tasks,
    concurrency: 15,
    staggerMs: 50,
    runTask: function (task) {
      launches.push(task.id);
      const deferred = createDeferred();
      deferredMap.set(task.id, deferred);
      return deferred.promise.then(function () {
        return { recommendedText: "item-" + task.id };
      });
    },
  });

  await wait(980);
  assert.equal(launches.length, 15);
  assert.deepEqual(launches.slice(0, 15), [
    1, 2, 3, 4, 5,
    6, 7, 8, 9, 10,
    11, 12, 13, 14, 15,
  ]);

  const firstResultPromise = stream.nextResult();
  deferredMap.get(2).resolve();
  const firstEntry = await firstResultPromise;
  assert.equal(firstEntry.task.id, 2);

  const serialSavePromise = (async function () {
    await wait(150);
  })();

  await wait(80);
  assert.equal(launches.length, 16);
  assert.equal(launches[15], 16);

  deferredMap.get(1).resolve();
  await wait(80);
  assert.equal(launches.length, 17);
  assert.equal(launches[16], 17);

  await serialSavePromise;
  const secondEntry = await stream.nextResult();
  assert.equal(secondEntry.task.id, 1);

  stream.cancelPending("test-cleanup");
  for (const launchedId of launches) {
    const deferred = deferredMap.get(launchedId);
    if (deferred) {
      deferred.resolve();
    }
  }
  await stream.whenProducersDone;
});

test("Aishell batch stop does not launch new requests after cancel", async function () {
  const tasks = Array.from({ length: 6 }, function (_, index) {
    return {
      id: index + 1,
    };
  });
  const launches = [];
  const deferredMap = new Map();

  const stream = createConcurrentAiRequestStream({
    tasks,
    concurrency: 3,
    staggerMs: 50,
    runTask: function (task) {
      launches.push(task.id);
      const deferred = createDeferred();
      deferredMap.set(task.id, deferred);
      return deferred.promise.then(function () {
        return { recommendedText: "item-" + task.id };
      });
    },
  });

  await wait(180);
  assert.deepEqual(launches, [1, 2, 3]);

  stream.cancelPending("manual-stop");
  for (const launchedId of launches) {
    deferredMap.get(launchedId).resolve();
  }

  await stream.whenProducersDone;
  assert.deepEqual(launches, [1, 2, 3]);
});

function loadAiRecommendationApi() {
  delete require.cache[aiRecommendationModulePath];
  delete globalThis.__ASREdgeAishellTechMinnanAiRecommendationInstalled;
  delete globalThis.__ASREdgeAishellTechMinnanAiRecommendation;
  delete globalThis.ASREdgeConstants;
  delete globalThis.ASREdgeAiJobClient;
  delete globalThis.ASREdgeAiUsageMeta;
  delete globalThis.chrome;

  globalThis.ASREdgeConstants = {};
  globalThis.ASREdgeAiJobClient = {
    runJobLifecycle: async function (input) {
      return {
        data: {
          echoedBody: input?.body || {},
          meta: {},
        },
      };
    },
  };
  globalThis.ASREdgeAiUsageMeta = {
    buildAiUsageRequestMeta: function () {
      return {
        aiUsageOperatorName: "tester",
        platformUserName: "ASmnbz001",
        platformUserId: "user-1",
      };
    },
    assertAiUsageOperatorConfigured: function (requestMeta) {
      return requestMeta;
    },
  };
  globalThis.chrome = {
    runtime: {
      getManifest: function () {
        return {
          version: "0.4.0",
        };
      },
    },
  };

  const api = require(aiRecommendationModulePath);
  return {
    api,
    cleanup: function () {
      delete require.cache[aiRecommendationModulePath];
      delete globalThis.__ASREdgeAishellTechMinnanAiRecommendationInstalled;
      delete globalThis.__ASREdgeAishellTechMinnanAiRecommendation;
      delete globalThis.ASREdgeConstants;
      delete globalThis.ASREdgeAiJobClient;
      delete globalThis.ASREdgeAiUsageMeta;
      delete globalThis.chrome;
    },
  };
}

test("Aishell AI runtime sends standalone convert/listen/compare stages to backend", async function () {
  const harness = loadAiRecommendationApi();

  try {
    const runtime = harness.api.createRuntime({
      endpoint: "https://example.com/api/aishell-tech/minnan-helper/ai/recommend",
      timeoutMs: 60000,
      settings: {
        meta: {
          aiUsageOperatorName: "tester",
        },
      },
      aiStages: {
        convert: {
          model: "qwen3.5-plus",
          prompt: "convert-prompt",
          params: {
            temperature: 0.2,
          },
        },
        listen: {
          model: "fun-asr",
          prompt: "listen-prompt",
          params: {
            max_tokens: 256,
          },
        },
        compare: {
          family: "qwen",
          model: "qwen3.5-plus",
          prompt: "compare-prompt",
          params: {
            top_p: 0.8,
          },
          adoptionThreshold: 0.75,
        },
      },
    });
    const result = await runtime.recommend({
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      fileName: "1.wav",
      audioUrl: "https://example.com/audio.wav",
      referenceText: "拍着声音闷闷的，纹路清晰的西瓜一般都挺甜的。",
      existingMarkText: "",
      duration: 1200,
      number: 1,
      frontConcurrency: 5,
    });

    assert.equal(result.echoedBody?.aiStages?.convert?.model, "qwen3.5-plus");
    assert.equal(result.echoedBody?.aiStages?.convert?.prompt, "convert-prompt");
    assert.equal(result.echoedBody?.aiStages?.listen?.model, "fun-asr");
    assert.equal(result.echoedBody?.aiStages?.listen?.prompt, "listen-prompt");
    assert.equal(result.echoedBody?.aiStages?.compare?.family, "qwen");
    assert.equal(result.echoedBody?.aiStages?.compare?.model, "qwen3.5-plus");
    assert.equal(result.echoedBody?.aiStages?.compare?.prompt, "compare-prompt");
    assert.equal(
      result.echoedBody?.aiStages?.compare?.adoptionThreshold,
      0.75
    );
  } finally {
    harness.cleanup();
  }
});

test("Aishell AI runtime sends Omni compare stage separately from listen stage", async function () {
  const harness = loadAiRecommendationApi();

  try {
    const runtime = harness.api.createRuntime({
      endpoint: "https://example.com/api/aishell-tech/minnan-helper/ai/recommend",
      timeoutMs: 60000,
      settings: {
        meta: {
          aiUsageOperatorName: "tester",
        },
      },
      aiStages: {
        convert: {
          model: "qwen3.5-plus",
          prompt: "convert-prompt",
          params: {},
        },
        listen: {
          model: "qwen3.5-omni-flash",
          prompt: "listen-prompt",
          params: {},
        },
        compare: {
          family: "omni",
          model: "qwen3.5-omni-flash",
          prompt: "omni-compare-prompt",
          params: {
            temperature: 0.1,
          },
          adoptionThreshold: 0.75,
        },
      },
    });
    const result = await runtime.recommend({
      taskId: "task-2",
      packageId: "package-2",
      taskItemId: "item-2",
      fileName: "2.wav",
      audioUrl: "https://example.com/audio-2.wav",
      referenceText: "路况良好，主要是高速和省道，跟着导航走即可。",
      duration: 1200,
      number: 2,
      frontConcurrency: 5,
    });

    assert.equal(result.echoedBody?.aiStages?.listen?.model, "qwen3.5-omni-flash");
    assert.equal(result.echoedBody?.aiStages?.compare?.family, "omni");
    assert.equal(result.echoedBody?.aiStages?.compare?.model, "qwen3.5-omni-flash");
    assert.equal(result.echoedBody?.aiStages?.compare?.prompt, "omni-compare-prompt");
    assert.equal(result.echoedBody?.aiStages?.compare?.params?.temperature, 0.1);
  } finally {
    harness.cleanup();
  }
});
