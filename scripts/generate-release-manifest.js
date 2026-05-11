"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const REPO_ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(REPO_ROOT, "extension", "manifest.json");
const DIST_DIR = path.join(REPO_ROOT, "dist");
const APP_NAME = "annotation-script-center";
const DEFAULT_DOWNLOAD_BASE_URL = "https://script.xiangtianzhen.store/downloads/";
const DEFAULT_MIN_AGENT_VERSION = "0.1.0";

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const [key, inlineValue] = token.split("=", 2);
    const normalizedKey = key.slice(2);
    if (!normalizedKey) {
      continue;
    }

    if (typeof inlineValue === "string") {
      result[normalizedKey] = inlineValue;
      continue;
    }

    const nextToken = argv[index + 1];
    if (typeof nextToken === "string" && !nextToken.startsWith("--")) {
      result[normalizedKey] = nextToken;
      index += 1;
      continue;
    }

    result[normalizedKey] = "true";
  }
  return result;
}

function normalizeBaseUrl(input) {
  const raw = (input || "").trim();
  const base = raw || DEFAULT_DOWNLOAD_BASE_URL;
  return base.endsWith("/") ? base : `${base}/`;
}

function readExtensionVersion() {
  const manifestText = fs.readFileSync(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(manifestText);
  if (!manifest || typeof manifest.version !== "string" || !manifest.version.trim()) {
    throw new Error("extension/manifest.json 缺少有效 version 字段");
  }
  return manifest.version.trim();
}

function sha256File(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = readExtensionVersion();
  const zipFilename = `${APP_NAME}-v${version}.zip`;
  const zipPath = path.join(DIST_DIR, zipFilename);

  if (!fs.existsSync(zipPath)) {
    throw new Error(`未找到扩展压缩包：${zipPath}`);
  }

  const stat = fs.statSync(zipPath);
  if (!stat.isFile()) {
    throw new Error(`压缩包路径不是文件：${zipPath}`);
  }

  const downloadBaseUrl = normalizeBaseUrl(process.env.ASC_DOWNLOAD_BASE_URL);
  const releaseNotes = typeof args.notes === "string" && args.notes.trim()
    ? args.notes.trim()
    : `${APP_NAME} release ${version}`;

  const payload = {
    name: APP_NAME,
    latest_version: version,
    filename: zipFilename,
    download_url: `${downloadBaseUrl}${zipFilename}`,
    sha256: sha256File(zipPath),
    size_bytes: stat.size,
    created_at: new Date().toISOString(),
    min_agent_version: DEFAULT_MIN_AGENT_VERSION,
    release_notes: releaseNotes
  };

  fs.mkdirSync(DIST_DIR, { recursive: true });
  const outputPath = path.join(DIST_DIR, `${APP_NAME}-latest.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`release manifest generated: ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(`[release-manifest] ${error.message}`);
  process.exitCode = 1;
}
