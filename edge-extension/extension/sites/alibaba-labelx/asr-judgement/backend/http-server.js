"use strict";

const http = require("http");
const url = require("url");
const { createStatisticsStore } = require("./file-store");
const { mergeUploadPayloads } = require("./payload-merge");

const UPLOAD_PATH = "/api/asr-judgement/statistics/upload";
const CONFIG_PATH = "/api/asr-judgement/statistics/config";
const HEALTH_PATH = "/api/asr-judgement/statistics/health";
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const DEFAULT_UPLOAD_TIMES = ["10:00", "16:00"];
const DEFAULT_JITTER_MINUTES = 10;

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept",
  });
  response.end(JSON.stringify(body || {}));
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

function createLocalServer(options) {
  const store = createStatisticsStore(options);

  return http.createServer(function (request, response) {
    const parsedUrl = url.parse(request.url || "", true);
    const pathname = parsedUrl.pathname || "/";
    const purpose = String(parsedUrl.query?.purpose || "").toLowerCase();
    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method === "GET" && (pathname === "/" || pathname === HEALTH_PATH)) {
      sendJson(response, 200, {
        success: true,
        service: "asr-judgement-statistics",
        uploadPath: UPLOAD_PATH,
        configPath: CONFIG_PATH,
        csvPath: store.getPaths().csvPath,
      });
      return;
    }

    if (
      request.method === "GET" &&
      (pathname === CONFIG_PATH || (pathname === UPLOAD_PATH && purpose === "schedule"))
    ) {
      sendJson(response, 200, {
        success: true,
        data: createScheduleConfig(),
      });
      return;
    }

    if (request.method === "POST" && pathname === UPLOAD_PATH) {
      void handleUpload(request, response, store);
      return;
    }

    sendJson(response, 404, {
      success: false,
      message: "接口不存在。",
    });
  });
}

module.exports = {
  CONFIG_PATH,
  HEALTH_PATH,
  UPLOAD_PATH,
  createScheduleConfig,
  createLocalServer,
  readRequestBody,
  sendJson,
};
