"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildOptionsRouteHref,
  parseOptionsRoute,
} = require("./options-route-state");

const scriptLibrary = {
  judgement: {
    label: "阿里ASR语音判别",
  },
  dataBakerRoundOneQuality: {
    label: "标贝易采一检质检",
  },
};

test("options route defaults to public center", function () {
  const route = parseOptionsRoute("", scriptLibrary);

  assert.equal(route.view, "center");
  assert.equal(route.scriptId, null);
  assert.equal(route.adminTab, "overview");
});

test("options route resolves script detail view from query", function () {
  const route = parseOptionsRoute("?view=script&script=judgement", scriptLibrary);

  assert.equal(route.view, "script");
  assert.equal(route.scriptId, "judgement");
  assert.equal(route.adminTab, "overview");
});

test("options route falls back to overview tab for invalid admin tab", function () {
  const route = parseOptionsRoute("?view=admin&tab=unknown", scriptLibrary);

  assert.equal(route.view, "admin");
  assert.equal(route.adminTab, "overview");
});

test("options route builds href with admin tab and without stale script query", function () {
  const href = buildOptionsRouteHref(
    "chrome-extension://extension-id/options/options.html?view=script&script=judgement",
    {
      view: "admin",
      adminTab: "stats",
    }
  );

  assert.equal(
    href,
    "chrome-extension://extension-id/options/options.html?view=admin&tab=stats"
  );
});
