"use strict";

const path = require("path");
const { createAiCallLogger } = require("../../../backend/ai-call-log");
const { createStageLogSupport } = require("../../../backend/ai-call-log/stage-log-support");
const { SCRIPT_ID } = require("./ai-service");

const stageSupport = createStageLogSupport({
  stages: [
    { key: "listen", label: "泸州方言识别", modelKeys: ["listenModel"] },
  ],
});

const aiCallLogger = createAiCallLogger({
  logDir: process.env.SHUJIAJIA_LUZHOU_AI_CALL_LOG_DIR || path.join(__dirname, "logs"),
  platformId: "shujiajia",
  scriptId: SCRIPT_ID,
  extraColumns: stageSupport.extraColumns,
  buildExtendedRow(context) {
    return stageSupport.buildRow(context);
  },
});

module.exports = { aiCallLogger };
