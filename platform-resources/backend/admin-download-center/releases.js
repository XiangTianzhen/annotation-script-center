"use strict";

const FALLBACK_DOWNLOAD_BASE_URL =
  "https://annotation-script-center.xiangtianzhen.store/downloads/";
const VERSION_FILE_PATTERN = /^annotation-script-center-v([0-9A-Za-z.-]+)\.zip$/i;

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeBaseUrl(value) {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }
  return text.endsWith("/") ? text : `${text}/`;
}

function resolveDownloadBaseUrl(options) {
  const config = options && typeof options === "object" ? options : {};
  return (
    normalizeBaseUrl(config.downloadBaseUrl) ||
    normalizeBaseUrl(process.env.ASC_DOWNLOAD_BASE_URL) ||
    FALLBACK_DOWNLOAD_BASE_URL
  );
}

function normalizeVersion(value) {
  return normalizeText(value).replace(/^v/i, "");
}

function compareVersionSegment(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }
  return String(left).localeCompare(String(right), "en");
}

function compareVersionsDescending(left, right) {
  const leftSegments = normalizeVersion(left).split(/[.-]/).filter(Boolean);
  const rightSegments = normalizeVersion(right).split(/[.-]/).filter(Boolean);
  const size = Math.max(leftSegments.length, rightSegments.length);
  for (let index = 0; index < size; index += 1) {
    const compared = compareVersionSegment(
      leftSegments[index] ?? "0",
      rightSegments[index] ?? "0"
    );
    if (compared !== 0) {
      return compared > 0 ? -1 : 1;
    }
  }
  return 0;
}

function parseDirectoryIndex(htmlText, baseUrl) {
  const normalizedBase = normalizeBaseUrl(baseUrl) || FALLBACK_DOWNLOAD_BASE_URL;
  const items = [];
  const seenVersions = new Set();
  const pattern = /href\s*=\s*"([^"]+)"/gi;
  let matched;

  while ((matched = pattern.exec(String(htmlText || "")))) {
    const href = normalizeText(matched[1]);
    const fileName = decodeURIComponent(href.split("/").pop() || "");
    const versionMatch = VERSION_FILE_PATTERN.exec(fileName);
    if (!versionMatch) {
      continue;
    }
    const version = normalizeVersion(versionMatch[1]);
    if (!version || seenVersions.has(version)) {
      continue;
    }
    seenVersions.add(version);
    items.push({
      version,
      zipUrl: new URL(href, normalizedBase).toString(),
      createdAt: "",
      isLatest: false,
    });
  }

  return items.sort(function (left, right) {
    return compareVersionsDescending(left.version, right.version);
  });
}

async function fetchDirectoryIndex(fetchImpl, url) {
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "text/html, text/plain;q=0.9, */*;q=0.8",
    },
  });
  if (!response || response.ok !== true) {
    throw new Error(`获取下载目录失败：${response ? response.status : "unknown"}`);
  }
  return response.text();
}

async function loadAdminDownloadCenterReleases(options) {
  const config = options && typeof options === "object" ? options : {};
  const fetchImpl =
    typeof config.fetchImpl === "function"
      ? config.fetchImpl
      : typeof fetch === "function"
        ? fetch.bind(globalThis)
        : null;
  if (!fetchImpl) {
    throw new Error("当前运行环境不支持 fetch。");
  }

  const downloadBaseUrl = resolveDownloadBaseUrl(config);
  const directoryIndexUrl = normalizeBaseUrl(config.directoryIndexUrl) || downloadBaseUrl;
  const directoryHtml = await fetchDirectoryIndex(fetchImpl, directoryIndexUrl);
  const items = parseDirectoryIndex(directoryHtml, directoryIndexUrl);
  if (items.length === 0) {
    throw new Error("下载目录中没有可用的 ZIP 发布包。");
  }
  items[0].isLatest = true;

  return {
    latestVersion: items[0].version,
    latestCreatedAt: items[0].createdAt,
    source: {
      directoryIndexUrl,
    },
    items,
  };
}

module.exports = {
  FALLBACK_DOWNLOAD_BASE_URL,
  compareVersionsDescending,
  loadAdminDownloadCenterReleases,
  parseDirectoryIndex,
  resolveDownloadBaseUrl,
};
