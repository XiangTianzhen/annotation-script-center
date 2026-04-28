"use strict";

const fs = require("fs");
const path = require("path");
const { createCorsHeaders, sendJson } = require("../../../backend/response");
const { createStatisticsStore } = require("./file-store");
const { mergeUploadPayloads } = require("./payload-merge");
const { registerAiRoutes } = require("./ai-routes");

const API_BASE_PATH = "/api/alibaba-labelx/asr-judgement/statistics";
const LEGACY_API_BASE_PATH = "/api/asr-judgement/statistics";
const UPLOAD_PATH = API_BASE_PATH + "/upload";
const CONFIG_PATH = API_BASE_PATH + "/config";
const HEALTH_PATH = API_BASE_PATH + "/health";
const DOWNLOAD_PATH = API_BASE_PATH + "/download";
const LEGACY_UPLOAD_PATH = LEGACY_API_BASE_PATH + "/upload";
const LEGACY_CONFIG_PATH = LEGACY_API_BASE_PATH + "/config";
const LEGACY_HEALTH_PATH = LEGACY_API_BASE_PATH + "/health";
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const DEFAULT_UPLOAD_TIMES = ["10:00", "16:00"];
const DEFAULT_JITTER_MINUTES = 10;

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

async function handleUpload(request, response, store) {
  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const result = mergeUploadPayloads(payload, store);
    sendJson(response, 200, {
      success: true,
      data: result,
    });
  } catch (error) {
    sendJson(response, 400, {
      success: false,
      message: error && error.message ? error.message : String(error),
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
  sendJson(response, 200, {
    success: true,
    service: "asr-judgement-statistics",
    uploadPath: UPLOAD_PATH,
    legacyUploadPath: LEGACY_UPLOAD_PATH,
    configPath: CONFIG_PATH,
    legacyConfigPath: LEGACY_CONFIG_PATH,
    downloadPath: DOWNLOAD_PATH,
    csvPath: store.getPaths().csvPath,
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

function handleDownloadCsv(request, response, store) {
  const csvPath = store.getPaths().csvPath;
  if (!fs.existsSync(csvPath)) {
    sendJson(response, 404, {
      success: false,
      message: "CSV 文件不存在，请先上传或生成统计数据。",
      csvPath,
    });
    return;
  }

  const stat = fs.statSync(csvPath);
  if (!stat.isFile()) {
    sendJson(response, 404, {
      success: false,
      message: "CSV 路径不是文件。",
      csvPath,
    });
    return;
  }

  response.writeHead(200, createCsvDownloadHeaders(csvPath, stat.size));
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = fs.createReadStream(csvPath);
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

function registerAsrJudgementRoutes(router, options) {
  const store = createStatisticsStore(options);
  store.ensureDataDir();
  registerAiRoutes(router);

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

  addAliases(
    router,
    "GET",
    [DOWNLOAD_PATH],
    function ({ request, response }) {
      handleDownloadCsv(request, response, store);
    }
  );
  addAliases(
    router,
    "HEAD",
    [DOWNLOAD_PATH],
    function ({ request, response }) {
      handleDownloadCsv(request, response, store);
    }
  );
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
  UPLOAD_PATH,
  createScheduleConfig,
  handleDownloadCsv,
  readRequestBody,
  registerAsrJudgementRoutes,
};
