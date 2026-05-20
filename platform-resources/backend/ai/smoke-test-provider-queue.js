"use strict";

const {
  enqueueProviderTask,
  getQueueSnapshots,
} = require("./provider-queue");

function getFunAsrSnapshot() {
  return getQueueSnapshots().find(function (item) {
    return item.groupName === "fun_asr";
  }) || null;
}

async function runOneTask(index, delayMs) {
  return enqueueProviderTask("fun_asr", function () {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({
          index,
          finishedAt: Date.now(),
        });
      }, delayMs);
    });
  });
}

async function main() {
  const concurrency = String(process.env.DATABAKER_AI_FUN_ASR_CONCURRENCY || "");
  const rpmLimit = String(process.env.DATABAKER_AI_FUN_ASR_RPM_LIMIT || "");
  const startedAt = Date.now();
  const before = getFunAsrSnapshot();
  console.info("[Smoke][ProviderQueue] before", {
    concurrency,
    rpmLimit,
    snapshot: before,
  });
  const tasks = [];
  for (let index = 0; index < 5; index += 1) {
    tasks.push(runOneTask(index, 1000));
  }
  const results = await Promise.all(tasks);
  const elapsedMs = Date.now() - startedAt;
  const after = getFunAsrSnapshot();
  console.info("[Smoke][ProviderQueue] after", {
    elapsedMs,
    snapshot: after,
  });
  console.log(JSON.stringify({
    success: true,
    elapsedMs,
    concurrency,
    rpmLimit,
    results: results.map(function (item) {
      return {
        index: item?.value?.index,
        queueMeta: item?.queueMeta,
      };
    }),
  }, null, 2));
}

main().catch(function (error) {
  console.error("[Smoke][ProviderQueue] failed", error?.message || String(error));
  process.exitCode = 1;
});
