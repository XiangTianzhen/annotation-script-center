"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  createAdminSessionToken,
  createPasswordSha256,
} = require("../admin-auth");
const {
  REQUEST_PATH,
  registerAiCallLogDownloadRoutes,
} = require("./routes");

function createRouter() {
  const routes = [];
  return {
    routes,
    get(pathname, handler) {
      routes.push({ method: "GET", pathname, handler });
    },
    post(pathname, handler) {
      routes.push({ method: "POST", pathname, handler });
    },
    head(pathname, handler) {
      routes.push({ method: "HEAD", pathname, handler });
    },
  };
}

function createRequest(body, headers) {
  return {
    headers: headers || {},
    on(eventName, handler) {
      if (eventName === "data") {
        handler(Buffer.from(body, "utf8"));
        return;
      }
      if (eventName === "end") {
        process.nextTick(handler);
      }
    },
    destroy() {},
  };
}

function createResponse() {
  return {
    statusCode: 0,
    body: "",
    headers: {},
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers || {};
    },
    end(body) {
      this.body = String(body || "");
    },
  };
}

test("ai call log request accepts admin bearer token without password", async function () {
  const tempDir = fs.mkdtempSync(path.join(__dirname, "tmp-ai-call-log-"));
  const csvPath = path.join(tempDir, "ai-calls-2026-05-31.csv");
  fs.writeFileSync(csvPath, "\uFEFFcreatedAt,requestId,success\n2026-05-31T10:00:00.000Z,req-1,true\n", "utf8");

  process.env.ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256 = createPasswordSha256("download-pass");
  process.env.ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET = "secret-ai-call-log";

  const issued = createAdminSessionToken(
    {
      operatorName: "管理员",
    },
    {
      jwtSecret: "secret-ai-call-log",
    }
  );

  const router = createRouter();
  registerAiCallLogDownloadRoutes(router, {
    datasets: [
      {
        id: "test-ai-log",
        label: "测试 AI 调用日志",
        defaultFileName: "test-ai-log.csv",
        getLogger() {
          return {
            filePrefix: "ai-calls",
            getLogDir() {
              return tempDir;
            },
          };
        },
      },
    ],
  });

  const route = router.routes.find(function (item) {
    return item.method === "POST" && item.pathname === REQUEST_PATH;
  });

  const response = createResponse();
  await route.handler({
    request: createRequest(
      JSON.stringify({
        dataset: "test-ai-log",
        operatorName: "傅成林",
      }),
      {
        authorization: "Bearer " + issued.token,
      }
    ),
    response,
  });

  const body = JSON.parse(response.body);
  assert.equal(response.statusCode, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.downloadUrl);
});
