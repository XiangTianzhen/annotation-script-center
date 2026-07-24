(function () {
  "use strict";

  const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
  const MEDIA_UPLOAD_PATH =
    "/api/bytedance-aidp/taizhou-helper/recording-media/";
  const ITEM_CREATE_PATH =
    "/api/bytedance-aidp/taizhou-helper/recording-items";
  const RESULT_PATH =
    "/api/bytedance-aidp/taizhou-helper/recording-items/result";
  const SAFE_MEDIA_TYPES = {
    audio: new Set([
      "audio/mpeg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
    ]),
    video: new Set(["video/mp4", "video/webm"]),
  };

  function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function getContentType(response) {
    return normalizeText(response?.headers?.get?.("content-type"))
      .split(";")[0]
      .trim()
      .toLowerCase();
  }

  function getContentLength(response) {
    const value = Number(response?.headers?.get?.("content-length"));
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  function isSafeMediaUrl(value) {
    try {
      const url = new URL(normalizeText(value));
      return (
        url.protocol === "https:" &&
        Boolean(url.hostname) &&
        !url.username &&
        !url.password
      );
    } catch (_error) {
      return false;
    }
  }

  async function cancelResponseBody(response, reader) {
    try {
      if (reader && typeof reader.cancel === "function") {
        await reader.cancel();
        return;
      }
      if (response?.body && typeof response.body.cancel === "function") {
        await response.body.cancel();
      }
    } catch (_error) {
      // Cancellation is best-effort after the response is already rejected.
    }
  }

  async function downloadMedia(kind, url, fetchImpl) {
    const normalizedKind = normalizeText(kind).toLowerCase();
    const mediaLabel = normalizedKind === "video" ? "视频" : "音频";
    if (!SAFE_MEDIA_TYPES[normalizedKind] || !isSafeMediaUrl(url)) {
      throw new Error(mediaLabel + "地址无效，无法安全下载。");
    }
    const response = await fetchImpl(normalizeText(url), {
      method: "GET",
      credentials: "include",
      headers: {},
    });
    if (!response?.ok) {
      throw new Error(mediaLabel + "下载失败，请确认当前页面登录状态后重试。");
    }
    const declaredLength = getContentLength(response);
    if (declaredLength !== null && declaredLength > MAX_MEDIA_BYTES) {
      await cancelResponseBody(response);
      throw new Error(mediaLabel + "超过 100MB 限制，无法导入。");
    }
    const contentType = getContentType(response);
    if (!SAFE_MEDIA_TYPES[normalizedKind].has(contentType)) {
      throw new Error(mediaLabel + "类型不受支持，无法导入。");
    }
    const reader = response?.body?.getReader?.();
    if (!reader) {
      throw new Error(mediaLabel + "响应无法安全流式读取。");
    }
    const chunks = [];
    let actualLength = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk?.done) {
        break;
      }
      const bytes = chunk?.value instanceof Uint8Array
        ? chunk.value
        : new Uint8Array(chunk?.value || []);
      actualLength += bytes.byteLength;
      if (actualLength > MAX_MEDIA_BYTES) {
        await cancelResponseBody(response, reader);
        throw new Error(mediaLabel + "超过 100MB 限制，无法导入。");
      }
      chunks.push(bytes);
    }
    if (actualLength <= 0) {
      throw new Error(mediaLabel + "内容为空，无法导入。");
    }
    const combined = new Uint8Array(actualLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return {
      bytes: combined,
      contentType: contentType,
    };
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

    async function uploadMedia(kind, media) {
      const response = await fetchImpl(
        buildBackendUrl(MEDIA_UPLOAD_PATH + kind),
        {
          method: "POST",
          headers: {
            "Content-Type": media.contentType,
            "X-Recording-Task-Id": recordingTaskId,
          },
          body: media.bytes,
        }
      );
      const body = await readJsonResponse(response);
      const uploadId = normalizeText(body.uploadId);
      if (!response?.ok || !uploadId) {
        throw new Error(
          (kind === "video" ? "视频" : "音频") +
            "上传失败，请稍后重试。"
        );
      }
      return uploadId;
    }

    async function prepareCreateBody(context) {
      const key = mappingKey(context.sourceItemId);
      if (pendingCreates.has(key)) {
        return pendingCreates.get(key);
      }
      let audioUploadId = null;
      let videoUploadId = null;
      if (normalizeText(context.audioUrl)) {
        audioUploadId = await uploadMedia(
          "audio",
          await downloadMedia("audio", context.audioUrl, fetchImpl)
        );
      }
      if (normalizeText(context.videoUrl)) {
        videoUploadId = await uploadMedia(
          "video",
          await downloadMedia("video", context.videoUrl, fetchImpl)
        );
      }
      const body = {
        recordingTaskId: recordingTaskId,
        sourceItemId: normalizeText(context.sourceItemId),
        referenceText: normalizeText(context.referenceText) || null,
        audioUploadId: audioUploadId,
        videoUploadId: videoUploadId,
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
    __testOnly: {
      downloadMedia,
      MAX_MEDIA_BYTES,
    },
  };

  globalThis.ASREdgeBytedanceAidpTaizhouRecordingIntegration = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
