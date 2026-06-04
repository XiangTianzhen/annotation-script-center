const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createConcurrentAiRequestStream,
} = require("../../../shared/concurrent-ai-request-stream.js");

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
