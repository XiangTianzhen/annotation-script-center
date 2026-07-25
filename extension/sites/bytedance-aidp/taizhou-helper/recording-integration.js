(function () {
  "use strict";

  const ITEM_CREATE_PATH =
    "/api/bytedance-aidp/taizhou-helper/recording-items";
  const RESULT_PATH =
    "/api/bytedance-aidp/taizhou-helper/recording-items/result";
  function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  async function readJsonResponse(response) {
    try {
      const body = await response.json();
      return body && typeof body === "object" ? body : {};
    } catch (_error) {
      return {};
    }
  }

  function createRuntime(options) {
    const deps = options && typeof options === "object" ? options : {};
    const dataApi = deps.dataApi || null;
    const storage = deps.storage || null;
    const settings = deps.settings && typeof deps.settings === "object" ? deps.settings : {};
    const fetchImpl =
      typeof deps.fetch === "function" ? deps.fetch : globalThis.fetch;
    const buildBackendUrl =
      typeof deps.buildBackendUrl === "function"
        ? deps.buildBackendUrl
        : function (path) {
            return String(path || "");
          };
    const now = typeof deps.now === "function" ? deps.now : Date.now;
    const recordingTaskId = normalizeText(
      settings?.platforms?.bytedanceAidp?.scripts?.taizhouHelper
        ?.recordingImportTaskId
    );
    const pendingCreates = new Map();
    let importFlight = null;
    let lastSourceItemId = "";
    let resultGeneration = 0;
    let autoRefreshedGeneration = 0;

    function mappingKey(sourceItemId) {
      return recordingTaskId + "\n" + normalizeText(sourceItemId);
    }

    function beginResultEntry(sourceItemId) {
      const normalized = normalizeText(sourceItemId);
      if (normalized !== lastSourceItemId) {
        lastSourceItemId = normalized;
        resultGeneration += 1;
        autoRefreshedGeneration = 0;
      }
      return {
        sourceItemId: normalized,
        generation: resultGeneration,
      };
    }

    function isCurrentResultEntry(expected) {
      return (
        expected?.sourceItemId === lastSourceItemId &&
        expected?.generation === resultGeneration
      );
    }

    function isRetryableCreateFailure(response, body) {
      const status = Number(response?.status || 0);
      const code = normalizeText(body?.code);
      return (
        status >= 500 ||
        status === 408 ||
        status === 429 ||
        (status === 409 &&
          (code === "RECORDING_PLATFORM_IN_PROGRESS" ||
            code === "OPERATION_IN_PROGRESS"))
      );
    }

    async function findMapping(sourceItemId) {
      if (
        !recordingTaskId ||
        !normalizeText(sourceItemId) ||
        typeof storage?.findTaizhouRecordingSyncMapping !== "function"
      ) {
        return null;
      }
      return storage.findTaizhouRecordingSyncMapping(
        recordingTaskId,
        normalizeText(sourceItemId)
      );
    }

    async function prepareCreateBody(context) {
      const key = mappingKey(context.sourceItemId);
      if (pendingCreates.has(key)) {
        return pendingCreates.get(key);
      }
      const body = {
        recordingTaskId: recordingTaskId,
        sourceItemId: normalizeText(context.sourceItemId),
        referenceText: normalizeText(context.referenceText) || null,
        referenceAudioUrl: normalizeText(context.audioUrl) || null,
        referenceVideoUrl: normalizeText(context.videoUrl) || null,
      };
      pendingCreates.set(key, body);
      return body;
    }

    async function performImport() {
      if (!recordingTaskId) {
        return {
          ok: false,
          message: "请先在 Options 基础设置中填写录音平台数据库内部 taskId。",
        };
      }
      if (
        !dataApi ||
        typeof dataApi.getRecordingImportContext !== "function"
      ) {
        return {
          ok: false,
          message: "当前完整题目数据尚未就绪，请稍后重试。",
        };
      }
      const context = await dataApi.getRecordingImportContext();
      if (!context?.ok) {
        return {
          ok: false,
          reason: context?.reason || "waiting",
          message:
            normalizeText(context?.message) ||
            "当前完整题目数据尚未就绪，请稍后重试。",
        };
      }
      const importTaskId = recordingTaskId;
      const importSourceItemId = normalizeText(context.sourceItemId);
      const importEntry = beginResultEntry(importSourceItemId);
      const importKey = mappingKey(importSourceItemId);
      const importContext = {
        ...context,
        sourceItemId: importSourceItemId,
      };
      const existing = await findMapping(importSourceItemId);
      if (existing) {
        return {
          ok: true,
          current: isCurrentResultEntry(importEntry),
          replayed: true,
          message: "当前完整题目已导入录音任务：" + existing.itemCode,
          mapping: existing,
        };
      }

      try {
        const createBody = await prepareCreateBody(importContext);
        const response = await fetchImpl(buildBackendUrl(ITEM_CREATE_PATH), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createBody),
        });
        const body = await readJsonResponse(response);
        const syncToken = normalizeText(body.syncToken);
        const item = body.item && typeof body.item === "object" ? body.item : {};
        const recordingItemId = normalizeText(item.itemId);
        const itemCode = normalizeText(item.itemCode);
        if (!response?.ok || !syncToken || !recordingItemId || !itemCode) {
          if (
            response &&
            !response.ok &&
            Number(response.status) >= 400 &&
            Number(response.status) < 500 &&
            !isRetryableCreateFailure(response, body)
          ) {
            pendingCreates.delete(importKey);
          }
          throw new Error("创建录音任务数据失败，请稍后重试。");
        }
        const mapping = {
          recordingTaskId: importTaskId,
          sourceItemId: importSourceItemId,
          recordingItemId: recordingItemId,
          itemCode: itemCode,
          syncToken: syncToken,
          updatedAt: Math.max(1, Math.round(Number(now()) || Date.now())),
        };
        if (
          !storage ||
          typeof storage.saveTaizhouRecordingSyncMapping !== "function"
        ) {
          throw new Error("录音同步映射保存失败，请重新加载扩展后重试。");
        }
        await storage.saveTaizhouRecordingSyncMapping(mapping);
        pendingCreates.delete(importKey);
        return {
          ok: true,
          current: isCurrentResultEntry(importEntry),
          replayed: response.status === 200,
          message: "已导入录音任务：" + itemCode,
          mapping: mapping,
        };
      } catch (error) {
        return {
          ok: false,
          current: isCurrentResultEntry(importEntry),
          message:
            normalizeText(error?.message) ||
            "导入录音任务失败，请稍后重试。",
        };
      }
    }

    function importCurrentItem() {
      if (importFlight) return importFlight;
      const promise = performImport();
      importFlight = promise;
      return promise.finally(function () {
        if (importFlight === promise) importFlight = null;
      });
    }

    function isAllowedResultAudioPath(value) {
      return /^\/api\/bytedance-aidp\/taizhou-helper\/recording-items\/audio\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
        normalizeText(value)
      );
    }

    async function refreshMapping(mapping, expected) {
      if (!mapping?.syncToken) {
        throw new Error("当前题目还没有可用的录音同步映射。");
      }
      let response;
      let body;
      try {
        response = await fetchImpl(buildBackendUrl(RESULT_PATH), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ syncToken: mapping.syncToken }),
        });
        body = await readJsonResponse(response);
      } catch (error) {
        if (expected && !isCurrentResultEntry(expected)) {
          return null;
        }
        throw error;
      }
      if (expected && !isCurrentResultEntry(expected)) {
        return null;
      }
      if (!response?.ok) {
        throw new Error("刷新录音结果失败，请稍后重试。");
      }
      const result = {
        sourceItemId: mapping.sourceItemId,
        itemCode: normalizeText(body.itemCode) || mapping.itemCode,
        status: normalizeText(body.status),
        updatedAt: normalizeText(body.updatedAt),
        text: typeof body.text === "string" ? body.text : null,
        audioAvailable: body.audioAvailable === true,
      };
      const audioUrl = normalizeText(body.audioUrl);
      if (result.audioAvailable && isAllowedResultAudioPath(audioUrl)) {
        result.audioUrl = buildBackendUrl(audioUrl);
      }
      return result;
    }

    async function refreshCurrentResult() {
      if (!lastSourceItemId && dataApi?.getRecordingImportContext) {
        const context = await dataApi.getRecordingImportContext();
        if (context?.ok) beginResultEntry(context.sourceItemId);
      }
      const expected = {
        sourceItemId: lastSourceItemId,
        generation: resultGeneration,
      };
      const mapping = await findMapping(expected.sourceItemId);
      if (!isCurrentResultEntry(expected)) {
        return null;
      }
      return refreshMapping(mapping, expected);
    }

    async function autoRefreshForEntry(expected, knownMapping) {
      if (
        !recordingTaskId ||
        !expected?.sourceItemId ||
        !isCurrentResultEntry(expected) ||
        autoRefreshedGeneration === expected.generation
      ) {
        return null;
      }
      const mapping =
        arguments.length >= 2
          ? knownMapping
          : await findMapping(expected.sourceItemId);
      if (!isCurrentResultEntry(expected)) {
        return null;
      }
      if (!mapping) return null;
      autoRefreshedGeneration = expected.generation;
      return refreshMapping(mapping, expected);
    }

    async function autoRefreshForCurrentItem(sourceItemId) {
      return autoRefreshForEntry(beginResultEntry(sourceItemId));
    }

    return {
      get recordingTaskId() {
        return recordingTaskId;
      },
      importCurrentItem,
      beginResultEntry,
      isCurrentResultEntry,
      findMapping,
      refreshCurrentResult,
      autoRefreshForEntry,
      autoRefreshForCurrentItem,
    };
  }

  const api = {
    createRuntime,
  };

  globalThis.ASREdgeBytedanceAidpTaizhouRecordingIntegration = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
