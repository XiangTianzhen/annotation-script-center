(function () {
  const LOG_PREFIX = "[ASR Edge][page-detector]";
  const siteContract = window.__ASREdgeAlibabaLabelxSiteContract;

  if (!siteContract) {
    console.warn(LOG_PREFIX, "Site contract is not loaded.");
    return;
  }

  function detectPage() {
    return siteContract.getPageInfo(location);
  }

  function logDetection(pageInfo) {
    if (pageInfo.isTargetSite) {
      console.info(
        LOG_PREFIX,
        "Page detected:",
        pageInfo
      );
    } else {
      console.info(
        LOG_PREFIX,
        "Non-target site detected:",
        pageInfo.hostname
      );
    }
  }

  window.__ASREdgePageDetector = {
    detectPage,
    logDetection,
    PLATFORM_HOST: siteContract.PLATFORM_HOST,
  };

  void (function initialDetect() {
    const pageInfo = detectPage();
    logDetection(pageInfo);
  })();
})();
