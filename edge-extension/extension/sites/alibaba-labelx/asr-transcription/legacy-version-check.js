(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-version-check]";
  const legacyApiClient = window.__ASREdgeAlibabaLabelxLegacyApiClient;

  async function checkNow() {
    if (!legacyApiClient || typeof legacyApiClient.checkForUpdates !== "function") {
      throw new Error("Legacy API client is unavailable.");
    }

    const result = await legacyApiClient.checkForUpdates();
    const runtimeStatus = result?.runtimeCheck?.status || "unknown";
    let summaryText = "未拿到更新检查结果。";

    if (runtimeStatus === "update_available") {
      summaryText =
        "浏览器报告扩展已有可用更新版本 " +
        (result?.runtimeCheck?.version || "(unknown)") +
        "。";
    } else if (runtimeStatus === "no_update") {
      summaryText = "浏览器未报告新的扩展更新。";
    } else if (runtimeStatus === "throttled") {
      summaryText = "浏览器暂时限制了频繁更新检查。";
    } else if (runtimeStatus === "error") {
      summaryText = "浏览器更新检查失败。";
    }

    if (result?.remoteManifest?.version) {
      summaryText +=
        " 远端版本清单返回版本 " + result.remoteManifest.version + "。";
    } else if (result?.remoteManifestUrl && result?.remoteManifestError) {
      summaryText +=
        " 远端版本清单读取失败(" + result.remoteManifestError + ")。";
    }

    return {
      success: true,
      currentVersion: result.currentVersion,
      runtimeStatus: runtimeStatus,
      runtimeVersion: result?.runtimeCheck?.version || null,
      remoteManifestUrl: result.remoteManifestUrl,
      remoteManifest: result.remoteManifest || null,
      remoteManifestError: result.remoteManifestError || null,
      summaryText: summaryText,
    };
  }

  window.__ASREdgeAlibabaLabelxLegacyVersionCheck = {
    checkNow: checkNow,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
