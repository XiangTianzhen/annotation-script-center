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

function resolveDirectory(value, fallbackDirectory) {
  const rawValue = String(value || "").trim();
  return rawValue ? path.resolve(rawValue) : fallbackDirectory;
}

function cleanDistDirectory(distDirectory) {
  fs.mkdirSync(distDirectory, { recursive: true });
  fs.readdirSync(distDirectory).forEach(function (entry) {
    fs.rmSync(path.join(distDirectory, entry), { recursive: true, force: true });
  });
}

function createZip(zipPath, extensionDirectory) {
  if (process.platform === "win32") {
    const command = [
      "$ErrorActionPreference='Stop'",
      "Add-Type -AssemblyName System.IO.Compression",
      "Add-Type -AssemblyName System.IO.Compression.FileSystem",
      `$source='${escapePowerShell(extensionDirectory)}'`,
      `$destination='${escapePowerShell(zipPath)}'`,
      "if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Force }",
      "$zip=[System.IO.Compression.ZipFile]::Open($destination,[System.IO.Compression.ZipArchiveMode]::Create)",
      "try {",
      "  Get-ChildItem -LiteralPath $source -Recurse -File | ForEach-Object {",
      "    $relative=$_.FullName.Substring($source.Length).TrimStart('\\')",
      "    $entryName=$relative.Replace('\\','/')",
      "    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$_.FullName,$entryName) | Out-Null",
      "  }",
      "} finally {",
      "  $zip.Dispose()",
      "}",
    ].join("; ");
    runCommand("powershell.exe", ["-NoProfile", "-Command", command]);
    return "powershell-ziparchive";
  }

  runCommand("zip", ["-r", zipPath, "."], { cwd: extensionDirectory });
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

function collectManifestScriptPaths(manifest) {
  const scriptPaths = [];
  if (manifest?.background?.service_worker) {
    scriptPaths.push(manifest.background.service_worker);
  }
  (manifest?.content_scripts || []).forEach(function (contentScript) {
    (contentScript?.js || []).forEach(function (scriptPath) {
      scriptPaths.push(scriptPath);
    });
  });
  return [...new Set(scriptPaths.map((scriptPath) => String(scriptPath || "").trim()).filter(Boolean))];
}

function validateZipEntries(entries, manifest) {
  const entryList = Array.isArray(entries) ? entries : [];
  if (entryList.some((entry) => entry.includes("\\"))) {
    throw new Error("ZIP 校验失败：包内路径必须使用 /，不能使用 \\\\。");
  }

  const entrySet = new Set(entryList);
  if (!entrySet.has("manifest.json")) {
    throw new Error("ZIP 校验失败：根目录缺少 manifest.json");
  }

  const missingScriptPaths = collectManifestScriptPaths(manifest).filter(
    (scriptPath) => !entrySet.has(scriptPath)
  );
  if (missingScriptPaths.length > 0) {
    throw new Error(`ZIP 校验失败：manifest 引用脚本缺失：${missingScriptPaths.join(", ")}`);
  }
}

function packageExtensionZip(options) {
  const config = options && typeof options === "object" ? options : {};
  const extensionDirectory = resolveDirectory(config.sourceDir, EXTENSION_DIR);
  const distDirectory = resolveDirectory(config.outputDir, DIST_DIR);
  if (config.skipBuild !== true) {
    if (extensionDirectory !== EXTENSION_DIR) {
      throw new Error("使用 sourceDir 隔离打包时必须传入 skipBuild: true。");
    }
    buildOptionsApp();
  }

  const manifestPath = path.join(extensionDirectory, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const filename = buildZipFilename(manifest.version);
  cleanDistDirectory(distDirectory);

  const outputPath = path.join(distDirectory, filename);
  const tool = createZip(outputPath, extensionDirectory);
  const stat = fs.statSync(outputPath);
  const entries = listZipEntries(outputPath);
  if (stat.size <= 0) {
    throw new Error("ZIP 校验失败：产物为空");
  }
  validateZipEntries(entries, manifest);

  return {
    filename,
    outputPath,
    sizeBytes: stat.size,
    entriesCount: entries.length,
    entries,
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
