"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const childProcess = require("child_process");

const APP_NAME = "annotation-script-center";
const REPO_ROOT = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(REPO_ROOT, "extension");
const MANIFEST_PATH = path.join(EXTENSION_DIR, "manifest.json");
const DIST_DIR = path.join(REPO_ROOT, "dist");
const KEY_PATH = path.join(REPO_ROOT, "config", "secrets", `${APP_NAME}.pem`);
const DEFAULT_DOWNLOAD_BASE_URL = "https://script.xiangtianzhen.store/downloads/";
const UPDATE_XML_FILENAME = `${APP_NAME}-update.xml`;
const DEFAULT_UPDATE_XML_URL = `${DEFAULT_DOWNLOAD_BASE_URL}${UPDATE_XML_FILENAME}`;
const CRX_LATEST_FILENAME = `${APP_NAME}-crx-latest.json`;
const DEFAULT_MIN_AGENT_VERSION = "0.1.0";

const BROWSER_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
];

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

function ensureFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${description} 不存在：${filePath}`);
  }
}

function safeUnlink(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function readManifestMeta() {
  const manifestText = fs.readFileSync(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(manifestText);
  const version = typeof manifest.version === "string" ? manifest.version.trim() : "";
  if (!version) {
    throw new Error("extension/manifest.json 缺少有效 version");
  }
  if (!manifest.update_url || typeof manifest.update_url !== "string") {
    throw new Error("extension/manifest.json 缺少 update_url，无法用于企业更新");
  }
  if (manifest.update_url.trim() !== DEFAULT_UPDATE_XML_URL) {
    console.warn(
      `[crx-release] 警告：manifest.update_url 当前为 ${manifest.update_url}，建议使用 ${DEFAULT_UPDATE_XML_URL}`
    );
  }
  return { version, updateUrl: manifest.update_url.trim() };
}

function resolveBrowserExecutable() {
  const envPath = (process.env.ASC_CHROME_EXE || "").trim();
  if (envPath) {
    ensureFileExists(envPath, "ASC_CHROME_EXE 指定的浏览器");
    return envPath;
  }

  for (const candidate of BROWSER_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "未找到可用 Chrome/Edge。请设置 ASC_CHROME_EXE 指向 chrome.exe 或 msedge.exe。"
  );
}

function runPackExtension(browserExe, keyPathOrNull) {
  const args = [`--pack-extension=${EXTENSION_DIR}`];
  if (keyPathOrNull) {
    args.push(`--pack-extension-key=${keyPathOrNull}`);
  }
  const result = childProcess.spawnSync(browserExe, args, {
    cwd: REPO_ROOT,
    encoding: "utf8"
  });
  if (result.error) {
    throw new Error(`执行浏览器打包失败：${result.error.message}`);
  }
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    throw new Error(
      `浏览器打包返回非 0（${result.status}）。${stderr || stdout || "无额外输出"}`
    );
  }
}

function ensureCrxAndKey(browserExe) {
  const tempCrxPath = path.join(REPO_ROOT, "extension.crx");
  const tempPemPath = path.join(REPO_ROOT, "extension.pem");
  safeUnlink(tempCrxPath);
  safeUnlink(tempPemPath);

  const keyExists = fs.existsSync(KEY_PATH);
  if (keyExists) {
    runPackExtension(browserExe, KEY_PATH);
    ensureFileExists(tempCrxPath, "浏览器打包输出 extension.crx");
    if (fs.existsSync(tempPemPath)) {
      safeUnlink(tempPemPath);
    }
    return { tempCrxPath, generatedNewKey: false };
  }

  fs.mkdirSync(path.dirname(KEY_PATH), { recursive: true });
  runPackExtension(browserExe, null);
  ensureFileExists(tempCrxPath, "浏览器打包输出 extension.crx");
  ensureFileExists(tempPemPath, "浏览器打包输出 extension.pem");
  if (fs.existsSync(KEY_PATH)) {
    throw new Error(`检测到密钥文件已存在，已中止覆盖：${KEY_PATH}`);
  }
  fs.renameSync(tempPemPath, KEY_PATH);
  return { tempCrxPath, generatedNewKey: true };
}

function nibbleToIdChar(nibble) {
  return String.fromCharCode(97 + nibble);
}

function computeExtensionIdFromPrivateKeyPem(pemPath) {
  const privatePem = fs.readFileSync(pemPath, "utf8");
  const privateKey = crypto.createPrivateKey(privatePem);
  const publicDer = crypto.createPublicKey(privateKey).export({
    type: "spki",
    format: "der"
  });
  const digest = crypto.createHash("sha256").update(publicDer).digest();
  let extensionId = "";
  for (let index = 0; index < 16; index += 1) {
    const value = digest[index];
    extensionId += nibbleToIdChar((value >> 4) & 0x0f);
    extensionId += nibbleToIdChar(value & 0x0f);
  }
  return extensionId;
}

function sha256File(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function buildUpdateXml(extensionId, codebaseUrl, version) {
  return [
    "<?xml version='1.0' encoding='UTF-8'?>",
    "<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>",
    `  <app appid='${extensionId}'>`,
    `    <updatecheck codebase='${codebaseUrl}' version='${version}' />`,
    "  </app>",
    "</gupdate>",
    ""
  ].join("\n");
}

function validateCrxLatestPayload(payload) {
  const required = [
    "name",
    "release_type",
    "latest_version",
    "extension_id",
    "filename",
    "download_url",
    "update_xml_url",
    "sha256",
    "size_bytes",
    "created_at",
    "min_agent_version",
    "release_notes"
  ];
  for (const key of required) {
    if (!payload[key]) {
      throw new Error(`crx latest json 缺少字段：${key}`);
    }
  }
  if (!/^[a-f0-9]{64}$/i.test(String(payload.sha256))) {
    throw new Error("crx latest json 的 sha256 不是 64 位 hex");
  }
}

function validateUpdateXml(xmlText, extensionId, codebaseUrl, version) {
  const requiredSnippets = [
    "<gupdate",
    "<app ",
    "<updatecheck ",
    `appid='${extensionId}'`,
    `codebase='${codebaseUrl}'`,
    `version='${version}'`
  ];
  for (const snippet of requiredSnippets) {
    if (!xmlText.includes(snippet)) {
      throw new Error(`update.xml 缺少关键片段：${snippet}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { version } = readManifestMeta();
  const browserExe = resolveBrowserExecutable();
  const downloadBaseUrl = normalizeBaseUrl(process.env.ASC_DOWNLOAD_BASE_URL);
  const releaseNotes = typeof args.notes === "string" && args.notes.trim()
    ? args.notes.trim()
    : `${APP_NAME} release ${version}`;

  fs.mkdirSync(DIST_DIR, { recursive: true });
  const crxFilename = `${APP_NAME}-v${version}.crx`;
  const crxOutputPath = path.join(DIST_DIR, crxFilename);
  const updateXmlPath = path.join(DIST_DIR, UPDATE_XML_FILENAME);
  const crxLatestPath = path.join(DIST_DIR, CRX_LATEST_FILENAME);

  const { tempCrxPath, generatedNewKey } = ensureCrxAndKey(browserExe);
  safeUnlink(crxOutputPath);
  fs.renameSync(tempCrxPath, crxOutputPath);
  ensureFileExists(KEY_PATH, "CRX 私钥文件");

  const extensionId = computeExtensionIdFromPrivateKeyPem(KEY_PATH);
  const downloadUrl = `${downloadBaseUrl}${crxFilename}`;
  const updateXmlUrl = `${downloadBaseUrl}${UPDATE_XML_FILENAME}`;
  const updateXml = buildUpdateXml(extensionId, downloadUrl, version);
  validateUpdateXml(updateXml, extensionId, downloadUrl, version);
  fs.writeFileSync(updateXmlPath, updateXml, "utf8");

  const stat = fs.statSync(crxOutputPath);
  const crxLatestPayload = {
    name: APP_NAME,
    release_type: "crx",
    latest_version: version,
    extension_id: extensionId,
    filename: crxFilename,
    download_url: downloadUrl,
    update_xml_url: updateXmlUrl,
    sha256: sha256File(crxOutputPath),
    size_bytes: stat.size,
    created_at: new Date().toISOString(),
    min_agent_version: DEFAULT_MIN_AGENT_VERSION,
    release_notes: releaseNotes
  };
  validateCrxLatestPayload(crxLatestPayload);
  fs.writeFileSync(crxLatestPath, `${JSON.stringify(crxLatestPayload, null, 2)}\n`, "utf8");

  console.log(`crx release generated: ${crxOutputPath}`);
  console.log(`update xml generated: ${updateXmlPath}`);
  console.log(`crx latest json generated: ${crxLatestPath}`);
  console.log(`extension id: ${extensionId}`);
  console.log("请上传到 downloads 目录的文件：");
  console.log(`1. ${crxOutputPath}`);
  console.log(`2. ${updateXmlPath}`);
  console.log(`3. ${crxLatestPath}`);
  if (generatedNewKey) {
    console.log(
      `首次生成私钥：${KEY_PATH}。请离线备份该 pem；丢失会导致 extension ID 变化并需要重配企业策略。`
    );
  }
}

try {
  main();
} catch (error) {
  console.error(`[crx-release] ${error.message}`);
  process.exitCode = 1;
}
