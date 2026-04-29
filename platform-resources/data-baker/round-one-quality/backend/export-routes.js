"use strict";

const fs = require("fs");
const path = require("path");
const { sendJson } = require("../../../backend/response");
const { getExportAuthConfig, getMissingRequiredConfig } = require("./export-auth");
const { createExportClient, getExportClientConfig } = require("./export-client");
const { writeExportCsv } = require("./export-csv");

const EXPORT_BASE_PATH = "/api/data-baker/round-one-quality/export";
const EXPORT_HEALTH_PATH = EXPORT_BASE_PATH + "/health";
const EXPORT_TASK_PATH = EXPORT_BASE_PATH + "/task";
const EXPORT_DOWNLOAD_PATH = EXPORT_BASE_PATH + "/download";
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_PAGE_SIZE = 500;
const MAX_MAX_PAGES = 100000;

const exportClient = createExportClient();

function toPositiveInt(value, fallbackValue, maxValue) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallbackValue;
  }
  const safeValue = Math.floor(numericValue);
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return safeValue;
  }
  return Math.min(safeValue, Math.floor(maxValue));
}

function trimText(value) {
  return String(value || "").trim();
}

function createHttpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code || "";
  return error;
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        const error = new Error("请求体超过 2MB。");
        error.statusCode = 413;
        error.code = "payload-too-large";
        reject(error);
        request.destroy();
      }
    });
    request.on("end", function () {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function normalizeQueryOverrides(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return {};
  }
  const result = {};
  Object.keys(source).forEach(function (key) {
    const value = source[key];
    if (!key || value === undefined || value === null) {
      return;
    }
    result[key] = value;
  });
  return result;
}

function normalizeExportTaskRequest(body) {
  const payload = body && typeof body === "object" ? body : {};
  const taskId = trimText(payload.taskId || payload.collectId);
  if (!taskId) {
    throw createHttpError(400, "taskId 不能为空。", "invalid-task-id");
  }
  return {
    taskId,
    pageSize: toPositiveInt(payload.pageSize, getExportClientConfig().pageSize, MAX_PAGE_SIZE),
    maxPages: toPositiveInt(payload.maxPages, getExportClientConfig().maxPages, MAX_MAX_PAGES),
    fileLabel: trimText(payload.fileLabel),
    query: normalizeQueryOverrides(payload.query),
  };
}

function sendHealth(response) {
  const authConfig = getExportAuthConfig();
  const clientConfig = getExportClientConfig();
  const missing = getMissingRequiredConfig(authConfig);
  const exportDir = path.join(__dirname, "exports");
  const authSnapshot = exportClient.getAuthSnapshot ? exportClient.getAuthSnapshot() : {};

  sendJson(response, 200, {
    success: true,
    service: "data-baker-round-one-quality-export",
    status: missing.length === 0 ? "ready" : "missing-config",
    missingConfig: missing,
    auth: {
      hasUsername: Boolean(authConfig.username),
      hasPassword: Boolean(authConfig.password),
      loginUrlConfigured: authSnapshot.loginUrlConfigured === true,
      hasCachedAccessToken: authSnapshot.hasAccessToken === true,
      hasCachedRefreshToken: authSnapshot.hasRefreshToken === true,
      expiresAt: authSnapshot.expiresAt || 0,
      lastLoginAt: authSnapshot.lastLoginAt || 0,
      tokenRefreshMs: authSnapshot.tokenRefreshMs || 0,
      tokenRefreshSkewMs: authSnapshot.tokenRefreshSkewMs || 0,
    },
    queryByCondition: {
      baseUrl: clientConfig.baseUrl,
      queryPath: clientConfig.queryPath,
      defaultPageSize: clientConfig.pageSize,
      defaultMaxPages: clientConfig.maxPages,
    },
    exportDir: exportDir,
    endpoints: {
      health: EXPORT_HEALTH_PATH,
      exportTask: EXPORT_TASK_PATH,
      download: EXPORT_DOWNLOAD_PATH,
    },
  });
}

function resolveDownloadFilePath(fileName) {
  const safeName = path.basename(trimText(fileName));
  if (!safeName) {
    return null;
  }
  const exportDir = path.resolve(path.join(__dirname, "exports"));
  const filePath = path.resolve(path.join(exportDir, safeName));
  if (!filePath.startsWith(exportDir + path.sep) && filePath !== exportDir) {
    return null;
  }
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return filePath;
}

function handleDownload(query, response) {
  const filePath = resolveDownloadFilePath(query?.fileName);
  if (!filePath) {
    sendJson(response, 404, {
      success: false,
      message: "导出文件不存在。",
    });
    return;
  }

  response.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS,HEAD",
    "Access-Control-Allow-Headers": "Content-Type,Accept",
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition":
      "attachment; filename*=UTF-8''" + encodeURIComponent(path.basename(filePath)),
  });
  fs.createReadStream(filePath).pipe(response);
}

async function handleExportTask(request, response) {
  const startedAt = Date.now();
  try {
    const rawBody = await readRequestBody(request);
    let requestBody = {};
    try {
      requestBody = JSON.parse(rawBody || "{}");
    } catch (error) {
      throw createHttpError(400, "请求体 JSON 解析失败。", "invalid-json");
    }

    const normalized = normalizeExportTaskRequest(requestBody);
    const queryResult = await exportClient.queryTaskAllRows(normalized.taskId, {
      pageSize: normalized.pageSize,
      maxPages: normalized.maxPages,
      queryOverrides: normalized.query,
    });
    const csvResult = writeExportCsv(normalized.taskId, queryResult.rows, {
      baseDir: __dirname,
      fileLabel: normalized.fileLabel,
    });

    const downloadUrl = EXPORT_DOWNLOAD_PATH + "?fileName=" + encodeURIComponent(csvResult.fileName);
    sendJson(response, 200, {
      success: true,
      data: {
        taskId: normalized.taskId,
        total: queryResult.total,
        rows: queryResult.rows.length,
        fileName: csvResult.fileName,
        downloadUrl: downloadUrl,
        durationMs: Date.now() - startedAt,
        pageSize: queryResult.pageSize,
        pages: queryResult.pages,
      },
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    sendJson(response, statusCode, {
      success: false,
      code: String(error?.code || ""),
      message: String(error?.message || "导出任务失败。").slice(0, 240),
      durationMs: Date.now() - startedAt,
    });
  }
}

function registerExportRoutes(router) {
  router.get(EXPORT_HEALTH_PATH, function ({ response }) {
    sendHealth(response);
  });

  router.post(EXPORT_TASK_PATH, function ({ request, response }) {
    return handleExportTask(request, response);
  });

  router.get(EXPORT_DOWNLOAD_PATH, function ({ query, response }) {
    handleDownload(query, response);
  });
}

module.exports = {
  EXPORT_BASE_PATH,
  EXPORT_DOWNLOAD_PATH,
  EXPORT_HEALTH_PATH,
  EXPORT_TASK_PATH,
  handleExportTask,
  normalizeExportTaskRequest,
  registerExportRoutes,
};
