"use strict";

const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const zipScriptPath = resolveRepo("scripts", "package-extension-zip.js");
const retiredPaths = [
  resolveRepo("scripts", "package-crx-release.js"),
  resolveRepo("scripts", "package-crx-build-profile.js"),
  resolveRepo("config", "package-crx-release.json"),
];

function runCommand(command, args, options) {
  const result = childProcess.spawnSync(command, args, {
    cwd: options?.cwd || resolveRepo(),
    encoding:
      options && Object.prototype.hasOwnProperty.call(options, "encoding")
        ? options.encoding
        : "utf8",
    maxBuffer: options?.maxBuffer,
  });
  const output =
    typeof result.stderr === "string"
      ? result.stderr
      : typeof result.stdout === "string"
        ? result.stdout
        : result.error?.message || "";
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")}\n${output}`
  );
  return result;
}

function listZipEntries(zipPath) {
  if (process.platform === "win32") {
    const escapedPath = String(zipPath).replace(/'/g, "''");
    const command = [
      "Add-Type -AssemblyName System.IO.Compression.FileSystem",
      `$archive=[System.IO.Compression.ZipFile]::OpenRead('${escapedPath}')`,
      "$archive.Entries | ForEach-Object { $_.FullName }",
      "$archive.Dispose()",
    ].join("; ");
    return runCommand("powershell.exe", ["-NoProfile", "-Command", command]).stdout
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return runCommand("unzip", ["-Z", "-1", zipPath]).stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function collectManifestScriptPaths(manifest) {
  const paths = [];
  if (manifest.background?.service_worker) {
    paths.push(manifest.background.service_worker);
  }
  (manifest.content_scripts || []).forEach(function (contentScript) {
    (contentScript.js || []).forEach(function (scriptPath) {
      paths.push(scriptPath);
    });
  });
  return [...new Set(paths)];
}

function createCleanPackagerFixture(t) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "annotation-script-center-zip-test-"));
  const archivePath = path.join(fixtureRoot, "source.tar");
  const archiveResult = runCommand(
    "git",
    ["archive", "--format=tar", "HEAD", "extension", "scripts"],
    { encoding: null, maxBuffer: 64 * 1024 * 1024 }
  );
  fs.writeFileSync(archivePath, archiveResult.stdout);
  runCommand("tar", ["-xf", archivePath, "-C", fixtureRoot]);
  fs.rmSync(archivePath, { force: true });
  fs.copyFileSync(
    zipScriptPath,
    path.join(fixtureRoot, "scripts", "package-extension-zip.js")
  );
  t.after(function () {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });
  return fixtureRoot;
}

test("ZIP-only release exposes one versioned ZIP packager and retires CRX files", function () {
  assert.equal(fs.existsSync(zipScriptPath), true);
  retiredPaths.forEach(function (filePath) {
    assert.equal(fs.existsSync(filePath), false, path.relative(resolveRepo(), filePath));
  });
});

test("ZIP-only packager exports the versioned filename contract", function () {
  delete require.cache[zipScriptPath];
  const packager = require(zipScriptPath);

  assert.equal(
    packager.buildZipFilename("1.0.0"),
    "annotation-script-center-v1.0.0.zip"
  );
  assert.deepEqual(Object.keys(packager).sort(), ["buildZipFilename", "packageExtensionZip"]);
});

test("ZIP-only release source contains no CRX signing or update metadata workflow", function () {
  const source = fs.readFileSync(zipScriptPath, "utf8");
  assert.doesNotMatch(source, /\.crx\b|update\.xml|crx-latest|KEY_PATH|privateKey|extensionId/i);
});

test("ZIP package uses manifest-compatible slash paths and contains every manifest script", function (t) {
  const fixtureRoot = createCleanPackagerFixture(t);
  const fixturePackagerPath = path.join(fixtureRoot, "scripts", "package-extension-zip.js");
  const fixtureManifestPath = path.join(fixtureRoot, "extension", "manifest.json");
  const fixturePackager = require(fixturePackagerPath);
  const result = fixturePackager.packageExtensionZip({ skipBuild: true });
  const entries = listZipEntries(result.outputPath);
  const manifest = JSON.parse(fs.readFileSync(fixtureManifestPath, "utf8"));

  assert.equal(entries.includes("manifest.json"), true);
  assert.equal(entries.some((entry) => entry.includes("\\")), false);
  collectManifestScriptPaths(manifest).forEach(function (scriptPath) {
    assert.equal(entries.includes(scriptPath), true, scriptPath);
  });
});

test("ZIP packager supports isolated source and output directories", function (t) {
  const fixtureRoot = createCleanPackagerFixture(t);
  const fixturePackagerPath = path.join(fixtureRoot, "scripts", "package-extension-zip.js");
  const sourceDir = path.join(fixtureRoot, "release-extension");
  const outputDir = path.join(fixtureRoot, "release-output");
  fs.renameSync(path.join(fixtureRoot, "extension"), sourceDir);

  const fixturePackager = require(fixturePackagerPath);
  const fixtureManifest = JSON.parse(
    fs.readFileSync(path.join(sourceDir, "manifest.json"), "utf8")
  );
  const result = fixturePackager.packageExtensionZip({
    skipBuild: true,
    sourceDir,
    outputDir,
  });

  assert.equal(
    result.outputPath,
    path.join(outputDir, fixturePackager.buildZipFilename(fixtureManifest.version))
  );
});
