"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const {
  createAdminSessionToken,
  createPasswordSha256,
} = require(resolveRepo("platform-resources", "backend", "admin-auth.js"));
const {
  REQUEST_PATH,
  listAiCallLogDatasets,
  registerAiCallLogDownloadRoutes,
} = require(resolveRepo(
  "platform-resources",
  "backend",
  "ai-call-log-download",
  "routes.js"
));

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

test("ai call log request accepts admin bearer token without password", async function (t) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "asc-ai-call-log-"));
  const envKeys = [
    "ASC_AI_CALL_LOG_DOWNLOAD_PASSWORD_SHA256",
    "ASC_AI_CALL_LOG_DOWNLOAD_JWT_SECRET",
    "ASC_ADMIN_JWT_SECRET",
  ];
  const previousEnv = new Map(envKeys.map((key) => [key, process.env[key]]));
  t.after(function () {
    fs.rmSync(tempDir, { force: true, recursive: true });
    for (const [key, value] of previousEnv) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  const csvPath = path.join(tempDir, "ai-calls-2026-05-31.csv");
  fs.writeFileSync(csvPath, "\uFEFFcreatedAt,requestId,success\n2026-05-31T10:00:00.000Z,req-1,true\n", "utf8");

  process.env.ASC_AI_CALL_LOG_DOWNLOAD_PASSWORD_SHA256 = createPasswordSha256("download-pass");
  process.env.ASC_AI_CALL_LOG_DOWNLOAD_JWT_SECRET = "secret-ai-call-log";
  process.env.ASC_ADMIN_JWT_SECRET = "secret-ai-call-log";

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

test("ai call log options expose exactly the five 1.0 scripts", function () {
  const datasets = listAiCallLogDatasets({});
  const target = datasets.find(function (item) {
    return item.id === "data-baker-cvpc-liuzhou-helper-ai";
  });

  assert.ok(target);
  assert.equal(target.label, "DataBaker CVPC 柳州话助手 AI 调用记录");
  assert.deepEqual(datasets.map((item) => item.id), [
    "data-baker-cvpc-liuzhou-helper-ai",
    "bytedance-aidp-suzhou-helper-ai",
    "bytedance-aidp-jinhua-helper-ai",
    "bytedance-aidp-taizhou-helper-ai",
    "magic-data-hangzhou-helper-ai",
  ]);
  assert.equal(datasets.some((item) => "visibility" in item), false);
});
