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
      throw new Error(mediaLabel + "超过 100MB 限制，无法导入。");
    }
    const contentType = getContentType(response);
    if (!SAFE_MEDIA_TYPES[normalizedKind].has(contentType)) {
      throw new Error(mediaLabel + "类型不受支持，无法导入。");
    }
    const bytes = await response.arrayBuffer();
    const actualLength = Number(bytes?.byteLength);
    if (!Number.isFinite(actualLength) || actualLength <= 0) {
      throw new Error(mediaLabel + "内容为空，无法导入。");
    }
    if (actualLength > MAX_MEDIA_BYTES) {
      throw new Error(mediaLabel + "超过 100MB 限制，无法导入。");
    }
    return {
      bytes: bytes,
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
    const autoRefreshedKeys = new Set();
    let importFlight = null;
    let lastSourceItemId = "";

    function mappingKey(sourceItemId) {
      return recordingTaskId + "\n" + normalizeText(sourceItemId);
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
      lastSourceItemId = normalizeText(context.sourceItemId);
      const existing = await findMapping(lastSourceItemId);
      if (existing) {
        return {
          ok: true,
          replayed: true,
          message: "当前完整题目已导入录音任务：" + existing.itemCode,
          mapping: existing,
        };
      }

      try {
        const createBody = await prepareCreateBody(context);
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
          throw new Error("创建录音任务数据失败，请稍后重试。");
        }
        const mapping = {
          recordingTaskId: recordingTaskId,
          sourceItemId: lastSourceItemId,
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
        pendingCreates.delete(mappingKey(lastSourceItemId));
        return {
          ok: true,
          replayed: response.status === 200,
          message: "已导入录音任务：" + itemCode,
          mapping: mapping,
        };
      } catch (error) {
        return {
          ok: false,
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

    async function refreshMapping(mapping) {
      if (!mapping?.syncToken) {
        throw new Error("当前题目还没有可用的录音同步映射。");
      }
      const response = await fetchImpl(buildBackendUrl(RESULT_PATH), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncToken: mapping.syncToken }),
      });
      const body = await readJsonResponse(response);
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
      if (result.audioAvailable && audioUrl) {
        result.audioUrl = /^https?:\/\//i.test(audioUrl)
          ? audioUrl
          : buildBackendUrl(audioUrl);
      }
      return result;
    }

    async function refreshCurrentResult() {
      if (!lastSourceItemId && dataApi?.getRecordingImportContext) {
        const context = await dataApi.getRecordingImportContext();
        if (context?.ok) lastSourceItemId = normalizeText(context.sourceItemId);
      }
      const mapping = await findMapping(lastSourceItemId);
      return refreshMapping(mapping);
    }

    async function autoRefreshForCurrentItem(sourceItemId) {
      lastSourceItemId = normalizeText(sourceItemId);
      const key = mappingKey(lastSourceItemId);
      if (!recordingTaskId || !lastSourceItemId || autoRefreshedKeys.has(key)) {
        return null;
      }
      const mapping = await findMapping(lastSourceItemId);
      if (!mapping) return null;
      autoRefreshedKeys.add(key);
      return refreshMapping(mapping);
    }

    return {
      get recordingTaskId() {
        return recordingTaskId;
      },
      importCurrentItem,
      findMapping,
      refreshCurrentResult,
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
