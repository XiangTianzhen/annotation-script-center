"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildJobDebugEndpoint,
  buildJobDetailEndpoint,
  buildJobsEndpoint,
  getJobDebug,
  runJobLifecycle,
} = require("./ai-job-client");

function createJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(body);
    },
  };
}

test("build job endpoints from base endpoint", function () {
  assert.equal(
    buildJobsEndpoint("https://example.com/api/demo"),
    "https://example.com/api/demo/jobs"
  );
  assert.equal(
    buildJobDetailEndpoint("https://example.com/api/demo", "job-1"),
    "https://example.com/api/demo/jobs/job-1"
  );
  assert.equal(
    buildJobDebugEndpoint("https://example.com/api/demo", "job-1"),
    "https://example.com/api/demo/jobs/job-1/debug"
  );
});

test("runJobLifecycle resolves succeeded job after polling", async function () {
  const calls = [];
  const fetchImpl = async function (url) {
    calls.push(url);
    if (calls.length === 1) {
      return createJsonResponse(202, {
        success: true,
        jobId: "job-1",
        requestId: "req-1",
        status: "pending",
      });
    }
    return createJsonResponse(200, {
      success: true,
      jobId: "job-1",
      requestId: "req-1",
      status: "succeeded",
      data: {
        result: 1,
      },
    });
  };

  const result = await runJobLifecycle({
    endpoint: "https://example.com/api/demo",
    body: {
      value: 1,
    },
    fetchImpl,
    timeoutMs: 5000,
    pollIntervalMs: 1,
  });

  assert.equal(result.job.status, "succeeded");
  assert.deepEqual(result.data, {
    result: 1,
  });
  assert.equal(calls.length, 2);
});

test("runJobLifecycle throws terminal error for failed job", async function () {
  const fetchImpl = async function () {
    return createJsonResponse(202, {
      success: true,
      jobId: "job-2",
      requestId: "req-2",
      status: "failed",
      error: {
        code: "provider-rate-limited",
        message: "rate limited",
      },
    });
  };

  await assert.rejects(
    runJobLifecycle({
      endpoint: "https://example.com/api/demo",
      fetchImpl,
      timeoutMs: 5000,
    }),
    function (error) {
      assert.equal(error.code, "provider-rate-limited");
      assert.equal(error.phase, "job");
      return true;
    }
  );
});

test("getJobDebug resolves debug payload", async function () {
  const debug = await getJobDebug({
    endpoint: "https://example.com/api/demo",
    jobId: "job-3",
    fetchImpl: async function (url) {
      assert.equal(url, "https://example.com/api/demo/jobs/job-3/debug");
      return createJsonResponse(200, {
        success: true,
        debug: {
          raw: true,
        },
      });
    },
  });
  assert.deepEqual(debug, {
    raw: true,
  });
});
