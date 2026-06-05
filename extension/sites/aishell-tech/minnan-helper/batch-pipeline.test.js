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

test("Aishell AI runtime sends audio-first recognition strategy to backend", async function () {
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
      modelMode: "two_stage",
      recognitionMode: "two_stage",
      recognitionStrategy: "audio_first_reference",
      listenModel: "fun-asr",
      compareModel: "qwen3.5-plus",
      singleModel: "qwen3.5-omni-flash",
      aiOptions: {
        candidateModel: "qwen3.5-plus",
        candidatePrompt: "candidate-prompt",
        listenPrompt: "listen-prompt",
        comparePrompt: "compare-prompt",
        audioFirstReferenceCorrectionThreshold: 0.75,
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

    assert.equal(result.echoedBody?.recognitionStrategy, "audio_first_reference");
    assert.equal(result.echoedBody?.compareModel, "qwen3.5-plus");
    assert.equal(result.echoedBody?.listenModel, "fun-asr");
    assert.equal(result.echoedBody?.aiOptions?.candidateModel, "qwen3.5-plus");
    assert.equal(result.echoedBody?.aiOptions?.candidatePrompt, "candidate-prompt");
    assert.equal(
      result.echoedBody?.aiOptions?.audioFirstReferenceCorrectionThreshold,
      0.75
    );
  } finally {
    harness.cleanup();
  }
});
