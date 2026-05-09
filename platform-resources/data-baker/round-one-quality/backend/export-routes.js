"use strict";

const fs = require("fs");
const path = require("path");
const { createCorsHeaders, sendJson } = require("../../../backend/response");
const { MAX_CSV_BYTES, createExportStore } = require("./export-store");

const EXPORT_BASE_PATH = "/api/data-baker/round-one-quality/export";
const EXPORT_HEALTH_PATH = EXPORT_BASE_PATH + "/health";
const EXPORT_CONFIG_PATH = EXPORT_BASE_PATH + "/config";
const EXPORT_UPLOAD_PATH = EXPORT_BASE_PATH + "/upload";
const EXPORT_DOWNLOAD_PATH = EXPORT_BASE_PATH + "/download";
const EXPORT_LIST_PATH = EXPORT_BASE_PATH + "/list";
const MAX_BODY_BYTES = MAX_CSV_BYTES + 1024 * 1024;

function createRequestId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        reject(new Error("请求体超过限制。"));
        request.destroy();
      }
    });
    request.on("end", function () {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function createCsvDownloadHeaders(filePath, fileSize) {
  const fallbackName = "data-baker-round-one-quality-latest.csv";
  const fileName = path.basename(filePath || fallbackName) || fallbackName;
  return createCorsHeaders({
    "Cache-Control": "no-store",
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Length": String(fileSize),
    "Content-Disposition":
      'attachment; filename="' +
      fileName.replace(/"/g, "") +
      '"; filename*=UTF-8\'\'' +
      encodeURIComponent(fileName),
  });
}

function sendHealth(response, store) {
  sendJson(response, 200, {
    success: true,
    service: "data-baker-round-one-quality-export",
    uploadPath: EXPORT_UPLOAD_PATH,
    downloadPath: EXPORT_DOWNLOAD_PATH,
    configPath: EXPORT_CONFIG_PATH,
    dataDir: store.getPaths().dataDir,
    latestCsvPath: store.getPaths().latestCsvPath,
  });
}

function sendConfig(response, store) {
  const paths = store.getPaths();
  sendJson(response, 200, {
    success: true,
    data: {
      exportEnabled: true,
      dataDir: paths.dataDir,
      latestCsvPath: paths.latestCsvPath,
      latestMetaPath: paths.latestMetaPath,
      historyDirPath: paths.historyDirPath || "",
      maxCsvBytes: MAX_CSV_BYTES,
    },
  });
}

function handleDownload(request, response, store) {
  const latestCsvPath = store.getPaths().latestCsvPath;
  if (!fs.existsSync(latestCsvPath)) {
    sendJson(response, 404, {
      success: false,
      message: "latest.csv 不存在，请先上传导出数据。",
    });
    return;
  }

  const stat = fs.statSync(latestCsvPath);
  if (!stat.isFile()) {
    sendJson(response, 404, {
      success: false,
      message: "latest.csv 路径不是文件。",
    });
    return;
  }

  response.writeHead(200, createCsvDownloadHeaders(latestCsvPath, stat.size));
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  const stream = fs.createReadStream(latestCsvPath);
  stream.on("error", function (error) {
    if (!response.headersSent) {
      sendJson(response, 500, {
        success: false,
        message: error && error.message ? error.message : String(error),
      });
      return;
    }
    response.destroy(error);
  });
  stream.pipe(response);
}

function handleList(response, store) {
  const paths = store.getPaths();
  const historyDir = paths.historyDirPath;
  if (!historyDir || !fs.existsSync(historyDir)) {
    sendJson(response, 200, {
      success: true,
      data: [],
    });
    return;
  }
  const files = fs
    .readdirSync(historyDir)
    .map(function (name) {
      const filePath = path.join(historyDir, name);
      const stat = fs.statSync(filePath);
      return {
        name: name,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    })
    .filter(function (entry) {
      return /\.csv$/i.test(entry.name);
    })
    .sort(function (a, b) {
      return String(b.modifiedAt).localeCompare(String(a.modifiedAt));
    });
  sendJson(response, 200, {
    success: true,
    data: files,
  });
}

function normalizeUploadPayload(value) {
  const body = value && typeof value === "object" ? value : {};
  const csvText = String(body.csvText || "");
  if (!csvText.trim()) {
    throw new Error("csvText 不能为空。");
  }
  const csvBytes = Buffer.byteLength(csvText, "utf8");
  if (csvBytes > MAX_CSV_BYTES) {
    throw new Error("csvText 超过 20MB 限制。");
  }
  return {
    schemaVersion: Number(body.schemaVersion) || 1,
    source: String(body.source || ""),
    project: String(body.project || ""),
    exportedAt: String(body.exportedAt || ""),
    fileName: String(body.fileName || ""),
    csvText: csvText,
    rowCount: Number(body.rowCount),
    taskId: String(body.taskId || ""),
    route: body.route && typeof body.route === "object" ? body.route : {},
    summary: body.summary && typeof body.summary === "object" ? body.summary : {},
  };
}

async function handleUpload(request, response, store) {
  const requestId = createRequestId();
  try {
    const contentType = String(request.headers["content-type"] || "").toLowerCase();
    if (contentType.indexOf("application/json") < 0) {
      throw new Error("仅支持 application/json 请求体。");
    }
    const rawBody = await readRequestBody(request);
    const payload = normalizeUploadPayload(JSON.parse(rawBody || "{}"));
    const saved = store.saveUpload(payload);
    const baseUrl = "http://" + String(request.headers.host || "127.0.0.1:3333");
    const downloadUrl = baseUrl + EXPORT_DOWNLOAD_PATH;

    console.info(
      "[DataBaker Export][upload]",
      JSON.stringify(
        {
          requestId: requestId,
          rowCount: saved.rowCount,
          fileName: saved.fileName,
          csvPath: saved.csvPath,
          uploadedAt: saved.uploadedAt,
        },
        null,
        0
      )
    );

    sendJson(response, 200, {
      success: true,
      data: {
        requestId: requestId,
        fileName: saved.fileName,
        rowCount: saved.rowCount,
        csvPath: saved.csvPath,
        downloadUrl: downloadUrl,
        uploadedAt: saved.uploadedAt,
      },
    });
  } catch (error) {
    sendJson(response, 400, {
      success: false,
      message: error && error.message ? error.message : String(error),
      requestId: requestId,
    });
  }
}

function registerExportRoutes(router, options) {
  const store = createExportStore(options);
  store.ensureDataDir();

  router.get(EXPORT_HEALTH_PATH, function ({ response }) {
    sendHealth(response, store);
  });

  router.get(EXPORT_CONFIG_PATH, function ({ response }) {
    sendConfig(response, store);
  });

  router.post(EXPORT_UPLOAD_PATH, function ({ request, response }) {
    return handleUpload(request, response, store);
  });

  router.get(EXPORT_DOWNLOAD_PATH, function ({ request, response }) {
    handleDownload(request, response, store);
  });

  router.head(EXPORT_DOWNLOAD_PATH, function ({ request, response }) {
    handleDownload(request, response, store);
  });

  router.get(EXPORT_LIST_PATH, function ({ response }) {
    handleList(response, store);
  });
}

module.exports = {
  EXPORT_BASE_PATH,
  EXPORT_CONFIG_PATH,
  EXPORT_DOWNLOAD_PATH,
  EXPORT_HEALTH_PATH,
  EXPORT_LIST_PATH,
  EXPORT_UPLOAD_PATH,
  registerExportRoutes,
};
