"use strict";

const path = require("path");
const { registerRoutes: registerAsrJudgementRoutes } = require("../alibaba-labelx/asr-judgement/backend");
const {
  registerRoutes: registerAsrTranscriptionRoutes,
} = require("../alibaba-labelx/asr-transcription/backend");
const { registerRoutes: registerDataBakerRoundOneRoutes } = require("../data-baker/round-one-quality/backend");

function registerProjectRoutes(router, options) {
  const config = options && typeof options === "object" ? options : {};
  registerAsrJudgementRoutes(router, {
    dataDir:
      config.asrJudgement?.dataDir ||
      process.env.ASR_JUDGEMENT_STATS_DIR ||
      path.join(__dirname, "..", "alibaba-labelx", "asr-judgement", "backend", "statistics-data"),
    persistRowsJson:
      config.asrJudgement?.persistRowsJson ||
      process.env.ASR_JUDGEMENT_PERSIST_ROWS_JSON === "1",
    persistUploadEvents:
      config.asrJudgement?.persistUploadEvents ||
      process.env.ASR_JUDGEMENT_PERSIST_UPLOAD_EVENTS === "1",
  });
  registerAsrTranscriptionRoutes(router, {
    dataDir:
      config.asrTranscription?.dataDir ||
      process.env.ASR_TRANSCRIPTION_STATS_DIR ||
      path.join(
        __dirname,
        "..",
        "alibaba-labelx",
        "asr-transcription",
        "backend",
        "statistics-data"
      ),
    persistRowsJson:
      config.asrTranscription?.persistRowsJson ||
      process.env.ASR_TRANSCRIPTION_PERSIST_ROWS_JSON === "1",
    persistUploadEvents:
      config.asrTranscription?.persistUploadEvents ||
      process.env.ASR_TRANSCRIPTION_PERSIST_UPLOAD_EVENTS === "1",
  });
  registerDataBakerRoundOneRoutes(router, config.dataBakerRoundOneQuality || {});
}

module.exports = {
  registerProjectRoutes,
};
