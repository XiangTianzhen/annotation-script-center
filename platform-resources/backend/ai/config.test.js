"use strict";

const assert = require("assert");
const test = require("node:test");

const configModulePath = require.resolve("./config");

function withEnv(overrides, run) {
  const previous = {};
  Object.keys(overrides).forEach(function (key) {
    previous[key] = process.env[key];
    const value = overrides[key];
    if (value === null) {
      delete process.env[key];
      return;
    }
    process.env[key] = String(value);
  });
  delete require.cache[configModulePath];
  try {
    return run(require("./config"));
  } finally {
    delete require.cache[configModulePath];
    Object.keys(overrides).forEach(function (key) {
      if (previous[key] === undefined) {
        delete process.env[key];
        return;
      }
      process.env[key] = previous[key];
    });
  }
}

test("ai config prefers ASC job overrides over legacy DataBaker job envs", function () {
  withEnv(
    {
      ASC_AI_JOB_TIMEOUT_MS: "120000",
      ASC_AI_JOB_TTL_MS: "600000",
      DATABAKER_AI_JOB_TIMEOUT_MS: "61000",
      DATABAKER_AI_JOB_TTL_MS: "1800000",
    },
    function (config) {
      assert.equal(config.parseDataBakerJobTimeoutMs(), 120000);
      assert.equal(config.parseDataBakerJobTtlMs(), 600000);
    }
  );
});

test("ai config falls back to code defaults when shared job overrides are missing", function () {
  withEnv(
    {
      ASC_AI_JOB_TIMEOUT_MS: null,
      ASC_AI_JOB_TTL_MS: null,
      DATABAKER_AI_JOB_TIMEOUT_MS: null,
      DATABAKER_AI_JOB_TTL_MS: null,
    },
    function (config) {
      assert.equal(config.parseDataBakerJobTimeoutMs(), 60000);
      assert.equal(config.parseDataBakerJobTtlMs(), 1800000);
    }
  );
});
