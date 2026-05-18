"use strict";

const fs = require("fs");
const { createCorsHeaders, sendJson } = require("../../../backend/response");
const { createStatisticsStore } = require("./file-store");
const { mergeUploadPayloads } = require("./payload-merge");
const { createMergedCsvContent } = require("./csv-writer");
const { resolveSupplierInfo, sanitizeSupplierPathSegment } = require("../../supplier-utils");

const API_BASE_PATH = "/api/alibaba-labelx/asr-transcription/statistics";
const LEGACY_API_BASE_PATH = "/api/asr-transcription/statistics";
const UPLOAD_PATH = API_BASE_PATH + "/upload";
const CONFIG_PATH = API_BASE_PATH + "/config";
const HEALTH_PATH = API_BASE_PATH + "/health";
const DOWNLOAD_PATH = API_BASE_PATH + "/download";
const SUPPLIERS_PATH = API_BASE_PATH + "/suppliers";
const EXISTING_PATH = API_BASE_PATH + "/existing";
const LEGACY_UPLOAD_PATH = LEGACY_API_BASE_PATH + "/upload";
const LEGACY_CONFIG_PATH = LEGACY_API_BASE_PATH + "/config";
const LEGACY_HEALTH_PATH = LEGACY_API_BASE_PATH + "/health";
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const DEFAULT_UPLOAD_TIMES = ["10:00", "16:00"];
const DEFAULT_JITTER_MINUTES = 0;
const DEFAULT_RANDOM_DELAY_MAX_SECONDS = 300;
const DEFAULT_RANDOM_DELAY_STEP_MS = 100;

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
          csvPath: store.getPaths().csvPath,
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
    randomDelayMaxSeconds: DEFAULT_RANDOM_DELAY_MAX_SECONDS,
    randomDelayStepMs: DEFAULT_RANDOM_DELAY_STEP_MS,
  };
}

function isBlank(value) {
  return String(value === undefined || value === null ? "" : value).trim() === "";
}

function normalizeRole(role) {
  const text = String(role || "").trim().toLowerCase();
  if (text === "audit" || text === "check") {
    return "audit";
  }
  return "label";
}

function buildRowsByBatchId(store) {
  const rowsByBatch = {};
  const rows = store.loadRows() || {};
  Object.keys(rows).forEach(function (mergeRowId) {
    const row = rows[mergeRowId] || {};
    const batchId = String(row["分包ID"] || "").trim();
    if (!batchId) {
      return;
    }
    if (!rowsByBatch[batchId]) {
      rowsByBatch[batchId] = [];
    }
    rowsByBatch[batchId].push(row);
  });
  return rowsByBatch;
}

function pickTranscriptionRowByRole(rows, role, subTaskId) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) {
    return null;
  }
  const subTaskIdText = String(subTaskId || "").trim();
  if (role === "audit") {
    if (subTaskIdText) {
      const byId = list.find(function (row) {
        return String(row["审核子任务ID"] || "").trim() === subTaskIdText;
      });
      if (byId) {
        return byId;
      }
    }
    return (
      list.find(function (row) {
        return !isBlank(row["审核子任务ID"]);
      }) || list[0]
    );
  }
  if (subTaskIdText) {
    const byId = list.find(function (row) {
      return String(row["标注子任务ID"] || "").trim() === subTaskIdText;
    });
    if (byId) {
      return byId;
    }
  }
  return (
    list.find(function (row) {
      return !isBlank(row["标注子任务ID"]);
    }) || list[0]
  );
}

function evaluateTranscriptionCompletion(row, role) {
  const target = row || {};
  const missingFields = [];
  ["分包ID", "任务名称", "任务ID", "题数"].forEach(function (field) {
    if (isBlank(target[field])) {
      missingFields.push(field);
    }
  });
  if (role === "audit") {
    if (isBlank(target["审核子任务ID"])) {
      missingFields.push("审核子任务ID");
    }
    const complete = missingFields.length === 0;
    return {
      complete: complete,
      missingFields: complete ? [] : missingFields,
    };
  }
  if (isBlank(target["标注子任务ID"])) {
    missingFields.push("标注子任务ID");
  }
  const complete = missingFields.length === 0;
  return {
    complete: complete,
    missingFields: complete ? [] : missingFields,
  };
}

async function handleExisting(request, response, store) {
  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const rowsByBatch = buildRowsByBatchId(store);
    const resultItems = items.map(function (item) {
      const batchId = String(item?.batchId || "").trim();
      const role = normalizeRole(item?.role || "label");
      const subTaskId = String(item?.subTaskId || "").trim();
      if (!batchId) {
        return {
          batchId: "",
          role: role,
          subTaskId: subTaskId,
          exists: false,
          complete: false,
          missingFields: ["分包ID"],
        };
      }

      const rows = rowsByBatch[batchId] || [];
      if (rows.length === 0) {
        return {
          batchId: batchId,
          role: role,
          subTaskId: subTaskId,
          exists: false,
          complete: false,
          missingFields: role === "audit" ? ["审核子任务ID"] : ["标注子任务ID"],
        };
      }

      const matchedRow = pickTranscriptionRowByRole(rows, role, subTaskId) || {};
      const check = evaluateTranscriptionCompletion(matchedRow, role);
      return {
        batchId: batchId,
        role: role,
        subTaskId: subTaskId,
        exists: true,
        complete: check.complete,
        missingFields: check.missingFields,
      };
    });

    sendJson(response, 200, {
      success: true,
      data: {
        items: resultItems,
      },
    });
  } catch (error) {
    sendJson(response, 400, {
      success: false,
      message: error && error.message ? error.message : String(error),
    });
  }
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
    existingPath: EXISTING_PATH,
    downloadRequiresSupplier: false,
    csvPath: paths.csvPath,
    deprecatedCsvPath: "",
  });
}

function formatDownloadTimestamp(date) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach(function (part) {
    map[part.type] = part.value;
  });
  return (
    String(map.year || "") +
    String(map.month || "") +
    String(map.day || "") +
    "-" +
    String(map.hour || "") +
    String(map.minute || "")
  );
}

function createDownloadFilename(supplierName) {
  const stamp = formatDownloadTimestamp(new Date());
  if (!supplierName) {
    return "asr-transcription-statistics-merged-" + stamp + ".csv";
  }
  const safeName = sanitizeSupplierPathSegment(supplierName);
  return "asr-transcription-" + safeName + "-statistics-" + stamp + ".csv";
}

function createCsvDownloadHeaders(filename, fileSize) {
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

function matchesSupplier(row, requestedInfo, requestedSafe) {
  const rowInfo = resolveSupplierInfo({
    csvPatch: row || {},
    taskName: row?.["任务名称"] || "",
  });
  return (
    String(rowInfo.key || "") === String(requestedInfo.key || "") ||
    String(rowInfo.safeName || "") === requestedSafe ||
    String(rowInfo.name || "") === String(requestedInfo.name || "")
  );
}

function buildSupplierRows(store, supplierQuery) {
  const requested = String(supplierQuery || "").trim();
  const requestedSafe = sanitizeSupplierPathSegment(requested);
  const requestedInfo = resolveSupplierInfo({
    supplier: requested,
    taskName: requested,
    csvPatch: { 供应商: requested },
  });

  const rows = store.loadRows() || {};
  const filteredRows = {};
  Object.keys(rows).forEach(function (mergeRowId) {
    const row = rows[mergeRowId] || {};
    if (matchesSupplier(row, requestedInfo, requestedSafe)) {
      filteredRows[mergeRowId] = row;
    }
  });
  return {
    filteredRows: filteredRows,
    requestedInfo: requestedInfo,
  };
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
    const targetCsvPath = String(store.getPaths().csvPath || "");
    if (!targetCsvPath || !fs.existsSync(targetCsvPath)) {
      sendJson(response, 404, {
        success: false,
        message: "统计 CSV 文件不存在，请先上传或生成统计数据。",
        csvPath: targetCsvPath,
      });
      return;
    }
    const stat = fs.statSync(targetCsvPath);
    if (!stat.isFile()) {
      sendJson(response, 404, {
        success: false,
        message: "统计 CSV 路径不是文件。",
        csvPath: targetCsvPath,
      });
      return;
    }
    const filename = createDownloadFilename("");
    response.writeHead(200, createCsvDownloadHeaders(filename, stat.size));
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    fs.createReadStream(targetCsvPath).pipe(response);
    return;
  }

  const supplierRowsResult = buildSupplierRows(store, supplierQuery);
  const supplierRows = supplierRowsResult.filteredRows || {};
  if (Object.keys(supplierRows).length === 0) {
    sendJson(response, 404, {
      success: false,
      message: "未找到该供应商数据。",
      supplier: supplierQuery,
    });
    return;
  }
  const csvContent = createMergedCsvContent(supplierRows, store.csvColumns);
  const bodyBuffer = Buffer.from(csvContent, "utf8");
  const supplierFilename = createDownloadFilename(supplierRowsResult.requestedInfo?.safeName || supplierQuery);
  response.writeHead(200, createCsvDownloadHeaders(supplierFilename, bodyBuffer.length));
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  response.end(bodyBuffer);
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

  addAliases(router, "POST", [EXISTING_PATH], function ({ request, response }) {
    return handleExisting(request, response, store);
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
  EXISTING_PATH,
  UPLOAD_PATH,
  createScheduleConfig,
  handleDownloadCsv,
  readRequestBody,
  registerAsrTranscriptionRoutes,
};
