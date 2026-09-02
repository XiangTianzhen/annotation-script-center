"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

test("Shujiajia backend registers health defaults and recommend routes", () => {
  const routes = [];
  const router = {
    get(path, handler) { routes.push({ method: "GET", path, handler }); },
    post(path, handler) { routes.push({ method: "POST", path, handler }); },
  };
  const backend = require(resolveRepo("platform-resources", "shujiajia", "luzhou-helper", "backend"));
  backend.registerRoutes(router, {});
  assert.deepEqual(routes.map(({ method, path }) => `${method} ${path}`), [
    "GET /api/shujiajia/luzhou-helper/ai/recommend/health",
    "GET /api/shujiajia/luzhou-helper/ai/recommend/defaults",
    "POST /api/shujiajia/luzhou-helper/ai/recommend",
  ]);
});

test("Shujiajia defaults route returns the public two-stage contract", () => {
  let body = null;
  const response = {
    writeHead() {},
    end(value) { body = JSON.parse(value); },
  };
  const routes = [];
  const router = {
    get(path, handler) { routes.push({ method: "GET", path, handler }); },
    post(path, handler) { routes.push({ method: "POST", path, handler }); },
  };
  require(resolveRepo("platform-resources", "shujiajia", "luzhou-helper", "backend")).registerRoutes(router, {});
  routes.find((route) => route.path.endsWith("/defaults")).handler({ response });
  assert.equal(body.scriptId, "shujiajiaLuzhouHelper");
  assert.equal(body.contract.writeMode, "manual-fill");
});
