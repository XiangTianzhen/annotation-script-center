"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const {
  FALLBACK_DOWNLOAD_BASE_URL,
  loadAdminDownloadCenterReleases,
  parseDirectoryIndex,
  resolveDownloadBaseUrl,
} = require(resolveRepo(
  "platform-resources",
  "backend",
  "admin-download-center",
  "releases.js"
));

test("parseDirectoryIndex only returns versioned zip packages", function () {
  const html = [
    '<a href="annotation-script-center-v1.0.0.zip">1.0.0 zip</a>',
    '<a href="annotation-script-center-v1.0.0.crx">legacy crx</a>',
    '<a href="annotation-script-center-v0.9.0.zip">0.9.0 zip</a>',
    '<a href="annotation-script-center-update.xml">legacy metadata</a>',
  ].join("\n");
  const items = parseDirectoryIndex(
    html,
    "https://annotation-script-center.xiangtianzhen.store/downloads/"
  );
  assert.deepEqual(
    items.map((item) => item.version),
    ["1.0.0", "0.9.0"]
  );
  assert.match(items[0].zipUrl, /v1\.0\.0\.zip$/);
  assert.equal("crxUrl" in items[0], false);
});

test("loadAdminDownloadCenterReleases reads the directory once and marks the newest zip", async function () {
  const requestedUrls = [];
  const result = await loadAdminDownloadCenterReleases({
    directoryIndexUrl: "https://example.test/downloads/",
    fetchImpl: async function fetchImpl(url) {
      requestedUrls.push(url);
      return {
        ok: true,
        text: async function () {
          return [
            '<a href="annotation-script-center-v0.9.0.zip">0.9.0 zip</a>',
            '<a href="annotation-script-center-v1.0.0.zip">1.0.0 zip</a>',
          ].join("\n");
        },
      };
    },
  });

  assert.deepEqual(requestedUrls, ["https://example.test/downloads/"]);
  assert.equal(result.latestVersion, "1.0.0");
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].isLatest, true);
  assert.equal(result.items[1].isLatest, false);
  assert.deepEqual(result.source, {
    directoryIndexUrl: "https://example.test/downloads/",
  });
});

test("loadAdminDownloadCenterReleases rejects an empty zip directory", async function () {
  await assert.rejects(
    loadAdminDownloadCenterReleases({
      directoryIndexUrl: "https://example.test/downloads/",
      fetchImpl: async function fetchImpl() {
        return {
          ok: true,
          text: async function () {
            return '<a href="annotation-script-center-v1.0.0.crx">legacy crx</a>';
          },
        };
      },
    }),
    /没有可用的 ZIP 发布包/
  );
});

test("resolveDownloadBaseUrl prefers explicit option and normalizes trailing slash", function () {
  assert.equal(
    FALLBACK_DOWNLOAD_BASE_URL,
    "https://annotation-script-center.xiangtianzhen.store/downloads/"
  );
  assert.equal(
    resolveDownloadBaseUrl({ downloadBaseUrl: "http://47.109.197.170/downloads" }),
    "http://47.109.197.170/downloads/"
  );
  assert.equal(resolveDownloadBaseUrl({}), FALLBACK_DOWNLOAD_BASE_URL);
});
