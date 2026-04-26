"use strict";

const url = require("url");
const { sendEmpty, sendJson } = require("./response");

function normalizeMethod(method) {
  return String(method || "GET").trim().toUpperCase();
}

function createRouter() {
  const routes = [];

  function add(method, path, handler) {
    routes.push({
      method: normalizeMethod(method),
      path: String(path || "/"),
      handler,
    });
  }

  function findRoute(method, pathname) {
    return routes.find(function (route) {
      return route.method === method && route.path === pathname;
    });
  }

  async function handle(request, response) {
    const parsedUrl = url.parse(request.url || "", true);
    const method = normalizeMethod(request.method);
    const pathname = parsedUrl.pathname || "/";

    if (method === "OPTIONS") {
      sendEmpty(response, 204);
      return;
    }

    const route = findRoute(method, pathname);
    if (!route) {
      sendJson(response, 404, {
        success: false,
        message: "接口不存在。",
      });
      return;
    }

    try {
      await route.handler({
        method,
        parsedUrl,
        pathname,
        query: parsedUrl.query || {},
        request,
        response,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        message: error && error.message ? error.message : String(error),
      });
    }
  }

  return {
    add,
    get: add.bind(null, "GET"),
    post: add.bind(null, "POST"),
    head: add.bind(null, "HEAD"),
    handle,
    routes,
  };
}

module.exports = {
  createRouter,
};
