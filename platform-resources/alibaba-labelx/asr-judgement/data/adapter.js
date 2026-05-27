"use strict";

function isBlank(value) {
  return String(value === undefined || value === null ? "" : value).trim() === "";
}

function pickRow(rows, role, subTaskId) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) {
    return null;
  }
  const subTaskIdText = String(subTaskId || "").trim();
  if (role === "audit") {
    if (subTaskIdText) {
      const byId = list.find(function (row) {
        return String(row["审核子任务ID"] || "").trim() === subTaskIdText;
      });
      if (byId) {
        return byId;
      }
    }
    return (
      list.find(function (row) {
        return !isBlank(row["审核子任务ID"]);
      }) || list[0]
    );
  }

  if (!subTaskIdText) {
    return list[0];
  }

  const slotFields = ["标注员1子任务ID", "标注员2子任务ID", "标注员3子任务ID"];
  for (let index = 0; index < list.length; index += 1) {
    const row = list[index];
    const matched = slotFields.some(function (field) {
      return String(row[field] || "").trim() === subTaskIdText;
    });
    if (matched) {
      return row;
    }
  }
  return list[0];
}

function evaluateCompletion(row, role, subTaskId) {
  const target = row || {};
  const missingFields = [];
  ["分包ID", "任务名称", "任务ID", "题数"].forEach(function (field) {
    if (isBlank(target[field])) {
      missingFields.push(field);
    }
  });
  if (role === "audit") {
    if (isBlank(target["审核子任务ID"])) {
      missingFields.push("审核子任务ID");
    }
    const complete = missingFields.length === 0;
    return {
      complete,
      missingFields: complete ? [] : missingFields,
    };
  }

  const slotFields = ["标注员1子任务ID", "标注员2子任务ID", "标注员3子任务ID"];
  const targetSubTaskId = String(subTaskId || "").trim();
  const hasAnyLabelSlot = slotFields.some(function (field) {
    return !isBlank(target[field]);
  });
  const hasExactSlot = targetSubTaskId
    ? slotFields.some(function (field) {
        return String(target[field] || "").trim() === targetSubTaskId;
      })
    : hasAnyLabelSlot;
  const complete = hasExactSlot || hasAnyLabelSlot;
  if (complete && missingFields.length === 0) {
    return {
      complete: true,
      missingFields: [],
    };
  }
  if (!complete) {
    missingFields.push("标注员子任务ID");
  }
  return {
    complete: false,
    missingFields,
  };
}

function getMissingFieldsForAbsentBatch(role) {
  return role === "audit" ? ["审核子任务ID"] : ["标注员1子任务ID"];
}

function getBatchIdFromRow(row) {
  return String(row?.["分包ID"] || "").trim();
}

module.exports = {
  datasetId: "asr-judgement-statistics",
  downloadFilePrefix: "asr-judgement",
  getBatchIdFromRow,
  getMissingFieldsForAbsentBatch,
  pickRow,
  evaluateCompletion,
};
