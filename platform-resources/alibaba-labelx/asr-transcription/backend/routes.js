"use strict";

const fs = require("fs");
const path = require("path");
const { createCorsHeaders, sendJson } = require("../../../backend/response");
const { createStatisticsStore } = require("./file-store");
const { mergeUploadPayloads } = require("./payload-merge");
const { resolveSupplierInfo, sanitizeSupplierPathSegment } = require("../../supplier-utils");

const API_BASE_PATH = "/api/alibaba-labelx/asr-transcription/statistics";
const LEGACY_API_BASE_PATH = "/api/asr-transcription/statistics";
const UPLOAD_PATH = API_BASE_PATH + "/upload";
const CONFIG_PATH = API_BASE_PATH + "/config";
const HEALTH_PATH = API_BASE_PATH + "/health";
const DOWNLOAD_PATH = API_BASE_PATH + "/download";
const SUPPLIERS_PATH = API_BASE_PATH + "/suppliers";
const LEGACY_UPLOAD_PATH = LEGACY_API_BASE_PATH + "/upload";
const LEGACY_CONFIG_PATH = LEGACY_API_BASE_PATH + "/config";
const LEGACY_HEALTH_PATH = LEGACY_API_BASE_PATH + "/health";
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const DEFAULT_UPLOAD_TIMES = ["10:00", "16:00"];
const DEFAULT_JITTER_MINUTES = 10;

function createRequestId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        reject(new Error("请求体超过 20MB。"));
        request.destroy();
      }
    });
    request.on("end", function () {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function extractLogInfo(payload, result) {
  const payloads = Array.isArray(payload?.payloads)
    ? payload.payloads
    : Array.isArray(payload)
      ? payload
      : [payload];
  const firstPayload = payloads[0] || {};
  return {
    projectId: String(payload?.mergeKey?.projectId || firstPayload?.url?.projectId || ""),
    batchId: String(
      firstPayload?.mergeKey?.batchId ||
        firstPayload?.roleRecord?.batchId ||
        firstPayload?.csvPatch?.["分包ID"] ||
        ""
    ),
    supplierName: String(
      firstPayload?.supplier?.name ||
        firstPayload?.mergeKey?.supplierName ||
        firstPayload?.csvPatch?.["供应商"] ||
        ""
    ),
    payloadCount: payloads.filter(function (item) {
      return item && typeof item === "object";
    }).length,
    rowCount: Number(result?.rowCount || 0),
  };
}

async function handleUpload(request, response, store) {
  const requestId = createRequestId();
  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const result = mergeUploadPayloads(payload, store);
    const logInfo = extractLogInfo(payload, result);
    console.info(
      "[ASR Transcription Stats][upload]",
      JSON.stringify(
        {
          requestId: requestId,
          projectId: logInfo.projectId,
          supplierName: logInfo.supplierName,
          batchId: logInfo.batchId,
          payloadCount: logInfo.payloadCount,
          rowCount: logInfo.rowCount,
          suppliersDir: store.getPaths().suppliersDir,
        },
        null,
        0
      )
    );

    sendJson(response, 200, {
      success: true,
      data: Object.assign({ requestId: requestId }, result),
    });
  } catch (error) {
    sendJson(response, 400, {
      success: false,
      message: error && error.message ? error.message : String(error),
      requestId: requestId,
    });
  }
}

function createScheduleConfig() {
  return {
    enabled: true,
    times: DEFAULT_UPLOAD_TIMES.slice(),
    uploadTimes: DEFAULT_UPLOAD_TIMES.slice(),
    scheduleTimes: DEFAULT_UPLOAD_TIMES.slice(),
    jitterMinutes: DEFAULT_JITTER_MINUTES,
  };
}

function sendHealth(response, store) {
  const paths = store.getPaths();
  sendJson(response, 200, {
    success: true,
    service: "asr-transcription-statistics",
    uploadPath: UPLOAD_PATH,
    legacyUploadPath: LEGACY_UPLOAD_PATH,
    configPath: CONFIG_PATH,
    legacyConfigPath: LEGACY_CONFIG_PATH,
    downloadPath: DOWNLOAD_PATH,
    suppliersPath: SUPPLIERS_PATH,
    downloadRequiresSupplier: true,
    suppliersDir: paths.suppliersDir,
    csvPath: "",
    deprecatedCsvPath: paths.legacyCsvPath,
  });
}

function createCsvDownloadHeaders(csvPath, fileSize) {
  const filename = path.basename(csvPath) || "statistics-merged.csv";
  return createCorsHeaders({
    "Cache-Control": "no-store",
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Length": String(fileSize),
    "Content-Disposition":
      'attachment; filename="' +
      filename.replace(/"/g, "") +
      '"; filename*=UTF-8\'\'' +
      encodeURIComponent(filename),
  });
}

function findSupplierEntry(store, supplierQuery) {
  const requested = String(supplierQuery || "").trim();
  if (!requested) {
    return null;
  }
  const requestedSafe = sanitizeSupplierPathSegment(requested);
  const requestedInfo = resolveSupplierInfo({
    supplier: requested,
    taskName: requested,
    csvPatch: { 供应商: requested },
  });
  const requestedKey = String(requestedInfo.key || "");
  return store.listSuppliers().find(function (item) {
    const entryInfo = resolveSupplierInfo({
      supplier: item.supplier,
      csvPatch: { 供应商: item.supplier },
    });
    return (
      item.supplier === requested ||
      item.safeSupplier === requested ||
      item.safeSupplier === requestedSafe ||
      String(entryInfo.key || "") === requestedKey
    );
  });
}

function handleSuppliers(response, store) {
  const data = store.listSuppliers().map(function (item) {
    return {
      supplier: item.supplier,
      safeSupplier: item.safeSupplier,
      rowCount: item.rowCount,
      csvPath: item.csvPath,
      downloadPath:
        DOWNLOAD_PATH + "?supplier=" + encodeURIComponent(String(item.supplier || "")),
    };
  });
  sendJson(response, 200, {
    success: true,
    data: data,
  });
}

function handleDownloadCsv(request, response, query, store) {
  const supplierQuery = String(query?.supplier || "").trim();
  if (!supplierQuery) {
    sendJson(response, 400, {
      success: false,
      message:
        "请通过 supplier 参数指定供应商，例如 /download?supplier=棋燊。",
      suppliersPath: SUPPLIERS_PATH,
    });
    return;
  }

  const supplierEntry = findSupplierEntry(store, supplierQuery);
  if (!supplierEntry) {
    sendJson(response, 404, {
      success: false,
      message: "未找到指定供应商对应的 CSV。",
      supplier: supplierQuery,
      suppliersPath: SUPPLIERS_PATH,
    });
    return;
  }

  if (!fs.existsSync(supplierEntry.csvPath)) {
    sendJson(response, 404, {
      success: false,
      message: "供应商 CSV 文件不存在，请先上传或生成统计数据。",
      supplier: supplierEntry.supplier,
      csvPath: supplierEntry.csvPath,
    });
    return;
  }

  const stat = fs.statSync(supplierEntry.csvPath);
  if (!stat.isFile()) {
    sendJson(response, 404, {
      success: false,
      message: "供应商 CSV 路径不是文件。",
      supplier: supplierEntry.supplier,
      csvPath: supplierEntry.csvPath,
    });
    return;
  }

  response.writeHead(200, createCsvDownloadHeaders(supplierEntry.csvPath, stat.size));
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = fs.createReadStream(supplierEntry.csvPath);
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

function addAliases(router, method, paths, handler) {
  paths.forEach(function (routePath) {
    router.add(method, routePath, handler);
  });
}

function registerAsrTranscriptionRoutes(router, options) {
  const store = createStatisticsStore(options);
  store.ensureDataDir();

  addAliases(router, "GET", [HEALTH_PATH, LEGACY_HEALTH_PATH], function ({ response }) {
    sendHealth(response, store);
  });

  addAliases(router, "GET", [CONFIG_PATH, LEGACY_CONFIG_PATH], function ({ response }) {
    sendJson(response, 200, {
      success: true,
      data: createScheduleConfig(),
    });
  });

  addAliases(router, "GET", [UPLOAD_PATH, LEGACY_UPLOAD_PATH], function ({ query, response }) {
    const purpose = String(query?.purpose || "").toLowerCase();
    if (purpose !== "schedule") {
      sendHealth(response, store);
      return;
    }
    sendJson(response, 200, {
      success: true,
      data: createScheduleConfig(),
    });
  });

  addAliases(router, "POST", [UPLOAD_PATH, LEGACY_UPLOAD_PATH], function ({ request, response }) {
    return handleUpload(request, response, store);
  });

  addAliases(router, "GET", [SUPPLIERS_PATH], function ({ response }) {
    handleSuppliers(response, store);
  });

  addAliases(router, "GET", [DOWNLOAD_PATH], function ({ request, response, query }) {
    handleDownloadCsv(request, response, query, store);
  });

  addAliases(router, "HEAD", [DOWNLOAD_PATH], function ({ request, response, query }) {
    handleDownloadCsv(request, response, query, store);
  });
}

module.exports = {
  API_BASE_PATH,
  CONFIG_PATH,
  DOWNLOAD_PATH,
  HEALTH_PATH,
  LEGACY_API_BASE_PATH,
  LEGACY_CONFIG_PATH,
  LEGACY_HEALTH_PATH,
  LEGACY_UPLOAD_PATH,
  SUPPLIERS_PATH,
  UPLOAD_PATH,
  createScheduleConfig,
  handleDownloadCsv,
  readRequestBody,
  registerAsrTranscriptionRoutes,
};
