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
  registerRoutes: registerBytedanceAidpTaizhouRoutes,
} = require("../bytedance-aidp/taizhou-helper/backend");
const {
  registerRoutes: registerMagicDataHangzhouRoutes,
} = require("../magic-data/hangzhou-helper/backend");
const { registerRoutes: registerAdminSessionRoutes } = require("./admin-session");
const { registerAdminAiKeySlotRoutes } = require("./admin-ai-key-slots");
const { registerRoutes: registerAdminDashboardRoutes } = require("./admin-dashboard");
const { registerRoutes: registerAdminDownloadCenterRoutes } = require("./admin-download-center");
const { registerRoutes: registerAiCallLogDownloadRoutes } = require("./ai-call-log-download");

function registerProjectRoutes(router, options) {
  const config = options && typeof options === "object" ? options : {};
  registerDataBakerCvpcLiuzhouRoutes(router, config.dataBakerCvpcLiuzhouHelper || {});
  registerBytedanceAidpSuzhouRoutes(router, config.bytedanceAidpSuzhouHelper || {});
  registerBytedanceAidpJinhuaRoutes(router, config.bytedanceAidpJinhuaHelper || {});
  registerBytedanceAidpTaizhouRoutes(router, config.bytedanceAidpTaizhouHelper || {});
  registerMagicDataHangzhouRoutes(router, config.magicDataHangzhouHelper || {});
  registerAdminSessionRoutes(router, config.adminSession || {});
  registerAdminAiKeySlotRoutes(router, config.aiKeySlots || {});
  registerAdminDashboardRoutes(router, {
    aiCallLogDownload: config.aiCallLogDownload || {},
  });
  registerAdminDownloadCenterRoutes(router, config.adminDownloadCenter || {});
  registerAiCallLogDownloadRoutes(router, config.aiCallLogDownload || {});
}

module.exports = {
  registerProjectRoutes,
};
