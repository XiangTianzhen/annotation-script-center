"use strict";

const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { buildOptionsApp } = require("./build-options-app");

const APP_NAME = "annotation-script-center";
const REPO_ROOT = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(REPO_ROOT, "extension");
const MANIFEST_PATH = path.join(EXTENSION_DIR, "manifest.json");
const DIST_DIR = path.join(REPO_ROOT, "dist");

function buildZipFilename(version) {
  const normalizedVersion = String(version || "").trim();
  if (!normalizedVersion) {
    throw new Error("extension/manifest.json 缺少有效 version");
  }
  return `${APP_NAME}-v${normalizedVersion}.zip`;
}

function runCommand(command, args, options) {
  const result = childProcess.spawnSync(command, args, {
    cwd: options?.cwd || REPO_ROOT,
    encoding: "utf8",
  });
  if (result.error) {
    throw new Error(`执行命令失败：${command} ${args.join(" ")} | ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `命令退出码非 0：${command} ${args.join(" ")} | ${(result.stderr || result.stdout || "").trim()}`
    );
  }
  return result;
}

function escapePowerShell(value) {
  return String(value || "").replace(/'/g, "''");
}

function cleanDistDirectory() {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.readdirSync(DIST_DIR).forEach(function (entry) {
    fs.rmSync(path.join(DIST_DIR, entry), { recursive: true, force: true });
  });
}

function createZip(zipPath) {
  if (process.platform === "win32") {
    const command = [
      `Set-Location -LiteralPath '${escapePowerShell(EXTENSION_DIR)}'`,
      `Compress-Archive -Path * -DestinationPath '${escapePowerShell(zipPath)}' -Force`,
    ].join("; ");
    runCommand("powershell.exe", ["-NoProfile", "-Command", command]);
    return "powershell";
  }

  runCommand("zip", ["-r", zipPath, "."], { cwd: EXTENSION_DIR });
  return "zip";
}

function listZipEntries(zipPath) {
  if (process.platform === "win32") {
    const command = [
      "Add-Type -AssemblyName System.IO.Compression.FileSystem",
      `$archive=[System.IO.Compression.ZipFile]::OpenRead('${escapePowerShell(zipPath)}')`,
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

function packageExtensionZip(options) {
  const config = options && typeof options === "object" ? options : {};
  if (config.skipBuild !== true) {
    buildOptionsApp();
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const filename = buildZipFilename(manifest.version);
  cleanDistDirectory();

  const outputPath = path.join(DIST_DIR, filename);
  const tool = createZip(outputPath);
  const stat = fs.statSync(outputPath);
  const entries = listZipEntries(outputPath);
  if (stat.size <= 0 || !entries.includes("manifest.json")) {
    throw new Error("ZIP 校验失败：产物为空或根目录缺少 manifest.json");
  }

  return {
    filename,
    outputPath,
    sizeBytes: stat.size,
    entriesCount: entries.length,
    tool,
  };
}

module.exports = {
  buildZipFilename,
  packageExtensionZip,
};

if (require.main === module) {
  try {
    const result = packageExtensionZip();
    console.log("ZIP generated:");
    console.log(`  file: ${result.outputPath}`);
    console.log(`  size: ${result.sizeBytes} bytes`);
    console.log(`  entries: ${result.entriesCount}`);
    console.log(`  tool: ${result.tool}`);
  } catch (error) {
    console.error(`[zip-release] ${error.message}`);
    process.exitCode = 1;
  }
}
