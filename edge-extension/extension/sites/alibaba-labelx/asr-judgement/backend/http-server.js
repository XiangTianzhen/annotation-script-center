"use strict";

const http = require("http");
const url = require("url");
const { createStatisticsStore } = require("./file-store");
const { mergeUploadPayload } = require("./payload-merge");

const UPLOAD_PATH = "/api/asr-judgement/statistics/upload";
const HEALTH_PATH = "/api/asr-judgement/statistics/health";
const MAX_BODY_BYTES = 20 * 1024 * 1024;

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
    const result = mergeUploadPayload(payload, store);
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

function createLocalServer(options) {
  const store = createStatisticsStore(options);

  return http.createServer(function (request, response) {
    const pathname = url.parse(request.url || "").pathname || "/";
    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method === "GET" && (pathname === "/" || pathname === HEALTH_PATH)) {
      sendJson(response, 200, {
        success: true,
        service: "asr-judgement-statistics",
        uploadPath: UPLOAD_PATH,
        csvPath: store.getPaths().csvPath,
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
  HEALTH_PATH,
  UPLOAD_PATH,
  createLocalServer,
  readRequestBody,
  sendJson,
};
