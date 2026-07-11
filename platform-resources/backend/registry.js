"use strict";

const {
  registerRoutes: registerDataBakerCvpcLiuzhouRoutes,
} = require("../data-baker-cvpc/liuzhou-helper/backend");
const {
  registerRoutes: registerBytedanceAidpSuzhouRoutes,
} = require("../bytedance-aidp/suzhou-helper/backend");
const {
  registerRoutes: registerBytedanceAidpJinhuaRoutes,
} = require("../bytedance-aidp/jinhua-helper/backend");
const {
  registerRoutes: registerMagicDataHangzhouRoutes,
} = require("../magic-data/hangzhou-helper/backend");
const { registerRoutes: registerAdminSessionRoutes } = require("./admin-session");
const { registerRoutes: registerAdminDashboardRoutes } = require("./admin-dashboard");
const { registerRoutes: registerAdminDownloadCenterRoutes } = require("./admin-download-center");
const { registerRoutes: registerAiCallLogDownloadRoutes } = require("./ai-call-log-download");

function registerProjectRoutes(router, options) {
  const config = options && typeof options === "object" ? options : {};
  registerDataBakerCvpcLiuzhouRoutes(router, config.dataBakerCvpcLiuzhouHelper || {});
  registerBytedanceAidpSuzhouRoutes(router, config.bytedanceAidpSuzhouHelper || {});
  registerBytedanceAidpJinhuaRoutes(router, config.bytedanceAidpJinhuaHelper || {});
  registerMagicDataHangzhouRoutes(router, config.magicDataHangzhouHelper || {});
  registerAdminSessionRoutes(router, config.adminSession || {});
  registerAdminDashboardRoutes(router, {
    aiCallLogDownload: config.aiCallLogDownload || {},
  });
  registerAdminDownloadCenterRoutes(router, config.adminDownloadCenter || {});
  registerAiCallLogDownloadRoutes(router, config.aiCallLogDownload || {});
}

module.exports = {
  registerProjectRoutes,
};
