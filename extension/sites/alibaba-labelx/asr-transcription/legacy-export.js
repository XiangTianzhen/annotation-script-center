(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-export]";
  const legacyApiClient = window.__ASREdgeAlibabaLabelxLegacyApiClient;

  function getMissionType() {
    const pathname = location.pathname.toLowerCase();
    if (pathname.includes("checktask")) {
      return "check";
    }

    return "label";
  }

  function getAppId() {
    const search = new URLSearchParams(location.search);
    return search.get("projectId") || search.get("appId") || "1023";
  }

  async function fetchTaskListPage(page, pageSize) {
    const url =
      "/api/v1/label/center/subTasks?type=" +
      encodeURIComponent(getMissionType()) +
      "&keyword=&appId=" +
      encodeURIComponent(getAppId()) +
      "&finished=false&page=" +
      encodeURIComponent(page) +
      "&pageSize=" +
      encodeURIComponent(pageSize) +
      "&_=" +
      Date.now();
    const response = await fetch(url, { cache: "no-store" });
    const json = response.ok ? await response.json() : null;
    const records = Array.isArray(json?.data?.data) ? json.data.data : [];
    return {
      success: Boolean(json?.success),
      records: records,
    };
  }

  async function fetchAllTaskRows() {
    const rows = [];
    const pageSize = 100;

    for (let page = 1; page <= 20; page += 1) {
      const result = await fetchTaskListPage(page, pageSize);
      if (!result.success || result.records.length === 0) {
        break;
      }

      rows.push.apply(rows, result.records);
      if (result.records.length < pageSize) {
        break;
      }
    }

    return rows;
  }

  function getRowDuration(row) {
    const candidates = [
      row.duration,
      row.validDuration,
      row.effectiveDuration,
      row.totalDuration,
    ];
    const matched = candidates.find(function (entry) {
      return Number.isFinite(Number(entry));
    });
    return Number(matched || 0);
  }

  function buildCsv(rows) {
    const header = [
      "任务名称",
      "任务ID",
      "子任务ID",
      "分包ID",
      "标注员",
      "领取时间",
      "提交时间",
      "是否完成",
      "有效时长(秒)",
    ];
    const lines = rows.map(function (row) {
      return [
        '"' + String(row.taskName || row.name || "").replace(/"/g, '""') + '"',
        row.taskId || "",
        row.id || row.subTaskId || "",
        row.batchId || "",
        row.annotator || row.operatorName || "",
        row.gmtCreate || "",
        row.gmtCommit || "",
        row.finished === true ? "是" : "否",
        getRowDuration(row).toFixed(2),
      ].join(",");
    });
    return "\uFEFF" + header.join(",") + "\n" + lines.join("\n");
  }

  function triggerCsvDownload(filename, csvContent) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(link.href);
    }, 1000);
  }

  async function uploadRowsToLegacyServer(rows) {
    if (!legacyApiClient || typeof legacyApiClient.postJson !== "function") {
      return {
        success: false,
        reason: "legacy-api-client-missing",
      };
    }

    const payload = rows
      .filter(function (row) {
        return row.batchId && getRowDuration(row) > 0;
      })
      .map(function (row) {
        return {
          annotator: row.annotator || row.operatorName || "",
          duration: getRowDuration(row),
          batchId: row.batchId,
          commitDate: row.gmtCommit || row.gmtCreate || "",
        };
      });

    if (payload.length === 0) {
      return {
        success: false,
        reason: "no-uploadable-rows",
      };
    }

    const result = await legacyApiClient.postJson("/asr/upload-stats", payload);
    return {
      success: Boolean(result?.success !== false),
      count: payload.length,
    };
  }

  async function exportTasks(request) {
    const options = request && typeof request === "object" ? request : {};
    const rows = await fetchAllTaskRows();
    const csvContent = buildCsv(rows);
    const today = new Date();
    const filename =
      "ASR-" +
      getMissionType() +
      "-tasks-" +
      today.getFullYear() +
      String(today.getMonth() + 1).padStart(2, "0") +
      String(today.getDate()).padStart(2, "0") +
      ".csv";

    triggerCsvDownload(filename, csvContent);

    let uploadResult = null;
    if (options.uploadToServer === true) {
      uploadResult = await uploadRowsToLegacyServer(rows);
    }

    return {
      success: true,
      count: rows.length,
      filename: filename,
      uploadResult: uploadResult,
    };
  }

  window.__ASREdgeAlibabaLabelxLegacyExport = {
    exportTasks: exportTasks,
    fetchAllTaskRows: fetchAllTaskRows,
    uploadRowsToLegacyServer: uploadRowsToLegacyServer,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
