"use strict";

const { createAuthManager } = require("./export-auth");

function toPositiveInt(value, fallbackValue) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallbackValue;
  }
  return Math.floor(numericValue);
}

function trimText(value) {
  return String(value || "").trim();
}

function getExportClientConfig() {
  return {
    baseUrl: trimText(process.env.DATABAKER_EXPORT_BASE_URL || "https://datafactory.data-baker.com"),
    queryPath: trimText(process.env.DATABAKER_EXPORT_QUERY_PATH || "/cms/tbAudioUserTask/queryByCondition"),
    pageSize: toPositiveInt(process.env.DATABAKER_EXPORT_PAGE_SIZE, 100),
    maxPages: toPositiveInt(process.env.DATABAKER_EXPORT_MAX_PAGES, 10000),
  };
}

function readList(payload) {
  const candidates = [
    payload?.data?.list,
    payload?.data?.records,
    payload?.data?.rows,
    payload?.data?.data,
    payload?.data,
    payload?.records,
    payload?.rows,
    payload?.list,
  ];
  for (let index = 0; index < candidates.length; index += 1) {
    if (Array.isArray(candidates[index])) {
      return candidates[index];
    }
  }
  return [];
}

function readTotal(payload, rows) {
  const candidates = [
    payload?.data?.total,
    payload?.data?.count,
    payload?.data?.totalCount,
    payload?.total,
    payload?.count,
    payload?.totalCount,
  ];
  for (let index = 0; index < candidates.length; index += 1) {
    const value = Number(candidates[index]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return Array.isArray(rows) ? rows.length : 0;
}

function buildQueryParams(taskId, pageNum, pageSize, queryOverrides) {
  const params = new URLSearchParams();
  params.set("collectName", "");
  params.set("mobile", "");
  params.set("status", "");
  params.set("startTime", "");
  params.set("endTime", "");
  params.set("retrieveStatus", "");
  params.set("forceRecover", "");
  params.set("textNumber", "");
  params.set("checkName", "");
  params.set("acceptCheckName", "");
  params.set("noPassType", "");
  params.set("taskId", String(taskId || ""));
  params.set("pageSize", String(pageSize));
  params.set("pageNum", String(pageNum));
  params.set("submitOrder", "");
  const extra = queryOverrides && typeof queryOverrides === "object" ? queryOverrides : {};
  Object.keys(extra).forEach(function (key) {
    if (!key || key === "taskId" || key === "pageNum" || key === "pageSize") {
      return;
    }
    const value = extra[key];
    if (value === undefined || value === null) {
      return;
    }
    params.set(key, String(value));
  });
  return params;
}

function createExportClient() {
  const authManager = createAuthManager();

  function isUnauthorizedBody(body) {
    const code = String(body?.code || body?.status || "").toLowerCase();
    const message = String(body?.message || body?.msg || "").toLowerCase();
    if (code === "401" || code === "403" || code === "unauthorized") {
      return true;
    }
    if (message.includes("token") && (message.includes("expired") || message.includes("invalid"))) {
      return true;
    }
    return false;
  }

  async function requestPage(taskId, pageNum, pageSize, options) {
    const clientConfig = getExportClientConfig();
    const forceRefresh = options?.forceRefresh === true;
    const queryOverrides = options?.queryOverrides || {};
    const token = await authManager.ensureAccessToken({ forceRefresh: forceRefresh });
    const cookieHeader = authManager.getCookieHeader ? authManager.getCookieHeader() : "";
    const requestUrl = new URL(clientConfig.queryPath || "/cms/tbAudioUserTask/queryByCondition", clientConfig.baseUrl);
    requestUrl.search = buildQueryParams(taskId, pageNum, pageSize, queryOverrides).toString();

    const response = await fetch(requestUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        language: trimText(process.env.DATABAKER_EXPORT_LANGUAGE || "zh"),
        Authorization: "Bearer " + token,
        access_token: token,
        token: token,
        Cookie: cookieHeader || "",
      },
    });

    if ((response.status === 401 || response.status === 403) && !forceRefresh) {
      authManager.invalidateTokens();
      return requestPage(taskId, pageNum, pageSize, { forceRefresh: true });
    }
    if (!response.ok) {
      const error = new Error(
        "queryByCondition 请求失败（HTTP " + String(response.status) + "，pageNum=" + String(pageNum) + "）。"
      );
      error.code = "query-by-condition-http-error";
      error.statusCode = response.status;
      throw error;
    }

    const responseBody = await response.json().catch(function () {
      return {};
    });
    if (isUnauthorizedBody(responseBody) && !forceRefresh) {
      authManager.invalidateTokens();
      return requestPage(taskId, pageNum, pageSize, {
        forceRefresh: true,
        queryOverrides,
      });
    }
    const rows = readList(responseBody);
    const total = readTotal(responseBody, rows);

    console.info("[DataBaker][export] queryByCondition page", {
      taskId: String(taskId || ""),
      pageNum: pageNum,
      pageSize: pageSize,
      rows: rows.length,
    });
    return {
      rows,
      total,
    };
  }

  async function queryTaskAllRows(taskId, options) {
    const queryOptions = options && typeof options === "object" ? options : {};
    const clientConfig = getExportClientConfig();
    const effectivePageSize = toPositiveInt(queryOptions.pageSize, clientConfig.pageSize);
    const maxPages = toPositiveInt(queryOptions.maxPages, clientConfig.maxPages);
    const queryOverrides = queryOptions.queryOverrides || {};
    const allRows = [];
    let pageNum = 1;
    let total = 0;
    while (true) {
      const pageResult = await requestPage(taskId, pageNum, effectivePageSize, {
        forceRefresh: false,
        queryOverrides,
      });
      total = Number(pageResult.total || 0);
      if (Array.isArray(pageResult.rows) && pageResult.rows.length > 0) {
        allRows.push.apply(allRows, pageResult.rows);
      }
      if (pageResult.rows.length < effectivePageSize) {
        break;
      }
      if (total > 0 && allRows.length >= total) {
        break;
      }
      pageNum += 1;
      if (pageNum > maxPages) {
        break;
      }
    }

    return {
      total: total,
      rows: allRows,
      pageSize: effectivePageSize,
      pages: Math.max(1, pageNum),
      maxPages: maxPages,
      authSnapshot: authManager.getSnapshot(),
    };
  }

  return {
    getExportClientConfig,
    getAuthSnapshot: authManager.getSnapshot,
    queryTaskAllRows,
  };
}

module.exports = {
  createExportClient,
  getExportClientConfig,
};
