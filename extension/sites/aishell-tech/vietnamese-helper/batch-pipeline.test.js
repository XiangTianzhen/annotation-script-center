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
    deferredMap.get(launchedId)?.resolve();
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
    deferredMap.get(launchedId)?.resolve();
  }

  await stream.whenProducersDone;
  assert.deepEqual(launches, [1, 2, 3]);
});

function loadAiRecommendationApi(runJobLifecycle) {
  delete require.cache[aiRecommendationModulePath];
  delete globalThis.__ASREdgeAishellTechVietnameseAiRecommendationInstalled;
  delete globalThis.__ASREdgeAishellTechVietnameseAiRecommendation;
  delete globalThis.ASREdgeConstants;
  delete globalThis.ASREdgeAiJobClient;
  delete globalThis.ASREdgeAiUsageMeta;
  delete globalThis.chrome;

  globalThis.ASREdgeConstants = {};
  globalThis.ASREdgeAiJobClient = {
    runJobLifecycle:
      typeof runJobLifecycle === "function"
        ? runJobLifecycle
        : async function (input) {
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
        platformUserName: "aishell-user",
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
      delete globalThis.__ASREdgeAishellTechVietnameseAiRecommendationInstalled;
      delete globalThis.__ASREdgeAishellTechVietnameseAiRecommendation;
      delete globalThis.ASREdgeConstants;
      delete globalThis.ASREdgeAiJobClient;
      delete globalThis.ASREdgeAiUsageMeta;
      delete globalThis.chrome;
    },
  };
}

test("Aishell Vietnamese AI runtime sends only recognize stage to backend", async function () {
  const harness = loadAiRecommendationApi();

  try {
    const runtime = harness.api.createRuntime({
      endpoint: "https://example.com/api/aishell-tech/vietnamese-helper/ai/recommend",
      timeoutMs: 60000,
      settings: {
        meta: {
          aiUsageOperatorName: "tester",
        },
      },
      aiStages: {
        recognize: {
          model: "qwen3.5-omni-flash",
          prompt: "recognize-prompt",
          params: {
            temperature: 0.2,
            max_tokens: 256,
          },
        },
      },
    });
    const result = await runtime.recommend({
      taskId: "task-1",
      packageId: "package-1",
      taskItemId: "item-1",
      fileName: "1.wav",
      audioUrl: "https://example.com/audio.wav",
      referenceText: "Tiếng từ máy chiếu.",
      existingMarkText: "",
      duration: 1200,
      number: 1,
      frontConcurrency: 5,
    });

    assert.deepEqual(result.echoedBody?.aiStages, {
      recognize: {
        model: "qwen3.5-omni-flash",
        prompt: "recognize-prompt",
        params: {
          temperature: 0.2,
          max_tokens: 256,
        },
      },
    });
    assert.equal(result.echoedBody?.enableThinking, false);
    assert.equal(result.echoedBody?.singleModel, undefined);
    assert.equal(result.echoedBody?.aiStages?.convert, undefined);
    assert.equal(result.echoedBody?.aiStages?.listen, undefined);
    assert.equal(result.echoedBody?.aiStages?.compare, undefined);
  } finally {
    harness.cleanup();
  }
});

test("Aishell Vietnamese AI runtime does not require referenceText", async function () {
  const harness = loadAiRecommendationApi();

  try {
    const runtime = harness.api.createRuntime({
      endpoint: "https://example.com/api/aishell-tech/vietnamese-helper/ai/recommend",
      timeoutMs: 60000,
      settings: {
        meta: {
          aiUsageOperatorName: "tester",
        },
      },
      aiStages: {
        recognize: {
          model: "qwen3.5-omni-flash",
          prompt: "",
          params: {},
        },
      },
    });
    const result = await runtime.recommend({
      taskId: "task-2",
      packageId: "package-2",
      taskItemId: "item-2",
      fileName: "2.wav",
      audioUrl: "https://example.com/audio-2.wav",
      referenceText: "",
      existingMarkText: "Xin chào",
      duration: 900,
      number: 2,
    });

    assert.equal(result.echoedBody?.referenceText, "");
    assert.equal(result.echoedBody?.existingMarkText, "Xin chào");
  } finally {
    harness.cleanup();
  }
});
