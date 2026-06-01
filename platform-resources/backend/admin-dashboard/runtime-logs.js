"use strict";

const { listRuntimeLogs } = require("../runtime-log-store");

function buildAdminDashboardRuntimeLogs(options) {
  const config = options && typeof options === "object" ? options : {};
  const limit = Math.max(1, Math.min(100, Number(config.limit || 20) || 20));
  return {
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      items: listRuntimeLogs({
        limit,
      }),
    },
  };
}

module.exports = {
  buildAdminDashboardRuntimeLogs,
};
