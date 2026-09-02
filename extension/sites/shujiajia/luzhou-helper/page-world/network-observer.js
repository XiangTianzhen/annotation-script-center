(function () {
  "use strict";

  const SOURCE = "asc-shujiajia-luzhou";
  const AUDIO_READY = "ASC_SHUJIAJIA_AUDIO_READY";
  const CONTEXT_READY = "ASC_SHUJIAJIA_CONTEXT_READY";
  const TEMP_SAVE_SUCCEEDED = "ASC_SHUJIAJIA_TEMP_SAVE_SUCCEEDED";
  const OBSERVER_ENABLE = "ASC_SHUJIAJIA_OBSERVER_ENABLE";
  const OBSERVER_DISABLE = "ASC_SHUJIAJIA_OBSERVER_DISABLE";
  const SAVE_INTENT = "ASC_SHUJIAJIA_SAVE_INTENT";
  const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
  const AUDIO_SOURCE_HOST = "storage.shujiajia.com";
  const AUDIO_MIME_BY_EXTENSION = Object.freeze({
    wav: "audio/wav",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    aac: "audio/aac",
    flac: "audio/flac",
    ogg: "audio/ogg",
    webm: "audio/webm",
  });

  function bytesToBase64(bytes) {
    if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  }
  function pathname(value) {
    try { return new URL(String(value || ""), "https://www.shujiajia.com/").pathname; }
    catch (_error) { return ""; }
  }
  function isTempSaveUrl(value) { return pathname(value) === "/web-task-alone-api/task/piece/execute/tempsave"; }
  function isExecuteUrl(value) { return pathname(value) === "/web-task-alone-api/task/piece/execute"; }
  function normalizeAudioSourceUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" && url.hostname.toLowerCase() === AUDIO_SOURCE_HOST ? url.href : "";
    } catch (_error) {
      return "";
    }
  }
  function getAudioMime(rawMime, rawUrl) {
    const mime = String(rawMime || "").split(";")[0].trim().toLowerCase();
    if (mime.startsWith("audio/")) return mime;
    if (mime && mime !== "application/octet-stream" && mime !== "binary/octet-stream") return "";
    const extension = pathname(rawUrl).split(".").pop()?.toLowerCase() || "";
    return AUDIO_MIME_BY_EXTENSION[extension] || "";
  }
  function bufferToAudioDataUrl(buffer, mime) {
    if (!buffer || buffer.byteLength <= 0 || buffer.byteLength > MAX_AUDIO_BYTES || !mime) return "";
    return "data:" + mime + ";base64," + bytesToBase64(new Uint8Array(buffer));
  }
  async function responseToAudioDataUrl(response, rawUrl, preserveBody) {
    if (!response || response.ok === false) return "";
    const headers = response.headers;
    const declaredLength = Number(headers?.get?.("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_AUDIO_BYTES) return "";
    const mime = getAudioMime(headers?.get?.("content-type"), rawUrl);
    if (!mime) return "";
    const body = preserveBody ? response.clone?.() : response;
    if (typeof body?.arrayBuffer !== "function") return "";
    try { return bufferToAudioDataUrl(await body.arrayBuffer(), mime); }
    catch (_error) { return ""; }
  }
  function isBusinessSuccess(value) {
    return Boolean(value && typeof value === "object" && (
      value.success === true || value.code === 0 || value.code === 200 || String(value.status || "").toLowerCase() === "success"
    ));
  }
  function findIdentity(value, depth) {
    if (!value || typeof value !== "object" || depth > 6) return null;
    if (value.taskId != null && value.dataId != null) return { taskId: String(value.taskId), dataId: String(value.dataId) };
    for (const item of Object.values(value)) {
      const found = findIdentity(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  function makeContextId(value) {
    const identity = findIdentity(value, 0);
    return identity ? identity.taskId + ":" + identity.dataId : "";
  }

  function createObserver(options) {
    const config = options && typeof options === "object" ? options : {};
    const emit = typeof config.emit === "function" ? config.emit : function (message) {
      const target = globalThis.window?.top || globalThis.window;
      target?.postMessage?.(message, globalThis.location?.origin || "*");
    };
    let enabled = false;
    let wrapped = false;
    let contextId = "";
    let latestAudioDataUrl = "";
    let saveIntent = null;
    let fetchAudio = typeof config.fetchAudio === "function" ? config.fetchAudio : null;
    let audioFetchContextId = "";
    let audioAbortController = null;

    function setContext(nextContextId) {
      const next = String(nextContextId || "");
      if (!next || next === contextId) return;
      try { audioAbortController?.abort?.(); } catch (_error) {}
      contextId = next;
      latestAudioDataUrl = "";
      audioFetchContextId = "";
      audioAbortController = null;
      saveIntent = null;
      emit({ source: SOURCE, type: CONTEXT_READY, payload: { contextId } });
    }
    async function captureFileFolder(body, requestContextId) {
      const expectedContextId = String(requestContextId || "");
      const sourceUrl = normalizeAudioSourceUrl(body?.data?.detail?.fileFolder);
      if (!expectedContextId || expectedContextId !== contextId || !sourceUrl || typeof fetchAudio !== "function") return false;
      if (audioFetchContextId === expectedContextId) return Boolean(latestAudioDataUrl);
      audioFetchContextId = expectedContextId;
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      audioAbortController = controller;
      let captured = false;
      try {
        const response = await fetchAudio(sourceUrl, {
          credentials: "omit",
          referrerPolicy: "no-referrer",
          ...(controller ? { signal: controller.signal } : {}),
        });
        const audioDataUrl = await responseToAudioDataUrl(response, sourceUrl, false);
        if (!audioDataUrl || expectedContextId !== contextId) return false;
        latestAudioDataUrl = audioDataUrl;
        captured = true;
        emit({ source: SOURCE, type: AUDIO_READY, payload: { contextId: expectedContextId, audioDataUrl } });
        return true;
      } catch (_error) {
        return false;
      } finally {
        if (audioAbortController === controller) audioAbortController = null;
        if (!captured && audioFetchContextId === expectedContextId && contextId === expectedContextId) audioFetchContextId = "";
      }
    }
    function setSaveIntent(intent) {
      if (intent?.cancel === true) {
        if (saveIntent?.contextId === String(intent.contextId || "") && saveIntent?.dirtyToken === String(intent.dirtyToken || "")) saveIntent = null;
        return true;
      }
      if (!intent || String(intent.contextId || "") !== contextId || !intent.dirtyToken) return false;
      saveIntent = { contextId, dirtyToken: String(intent.dirtyToken) };
      return true;
    }
    async function parseJson(response) {
      try { return await response?.clone?.().json?.(); } catch (_error) { return null; }
    }
    async function captureResponse(rawUrl, response, requestMeta) {
      const meta = requestMeta || {};
      const method = String(meta.method || "GET").toUpperCase();
      if (!enabled && !config.captureWhenDisabled) return;
      if (isExecuteUrl(rawUrl) && method === "GET" && response?.ok === true) {
        const body = await parseJson(response);
        const nextContextId = makeContextId(body);
        if (nextContextId) {
          setContext(nextContextId);
          await captureFileFolder(body, nextContextId);
        }
        return;
      }
      if (isTempSaveUrl(rawUrl)) {
        const intent = saveIntent;
        const body = response?.ok === true ? await parseJson(response) : null;
        if (intent && intent.contextId === contextId && isBusinessSuccess(body)) {
          saveIntent = null;
          emit({ source: SOURCE, type: TEMP_SAVE_SUCCEEDED, payload: { ok: true, contextId, dirtyToken: intent.dirtyToken } });
        }
        return;
      }
      const requestContextId = String(meta.requestContextId || contextId);
      if (!requestContextId || requestContextId !== contextId) return;
      const audioDataUrl = await responseToAudioDataUrl(response, rawUrl, true);
      if (!audioDataUrl || requestContextId !== contextId) return;
      latestAudioDataUrl = audioDataUrl;
      audioFetchContextId = requestContextId;
      emit({ source: SOURCE, type: AUDIO_READY, payload: { contextId: requestContextId, audioDataUrl: latestAudioDataUrl } });
    }
    async function handleJsonResponse(rawUrl, status, body, method) {
      if (!enabled || status < 200 || status >= 300) return;
      if (isExecuteUrl(rawUrl) && String(method || "GET").toUpperCase() === "GET") {
        const nextContextId = makeContextId(body);
        if (nextContextId) {
          setContext(nextContextId);
          await captureFileFolder(body, nextContextId);
        }
      } else if (isTempSaveUrl(rawUrl) && saveIntent?.contextId === contextId && isBusinessSuccess(body)) {
        const intent = saveIntent;
        saveIntent = null;
        emit({ source: SOURCE, type: TEMP_SAVE_SUCCEEDED, payload: { ok: true, contextId, dirtyToken: intent.dirtyToken } });
      }
    }
    function wrapRequests(target) {
      if (wrapped || !target) return;
      wrapped = true;
      const nativeFetch = target.fetch;
      if (typeof nativeFetch === "function") {
        if (!fetchAudio) fetchAudio = function (url, options) { return nativeFetch.call(target, url, options); };
        target.fetch = function () {
          const args = Array.from(arguments);
          const rawUrl = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
          const method = String(args[1]?.method || args[0]?.method || "GET").toUpperCase();
          const requestContextId = contextId;
          return nativeFetch.apply(this, args).then(function (response) {
            void captureResponse(rawUrl, response, { method, requestContextId });
            return response;
          });
        };
      }
      const NativeXhr = target.XMLHttpRequest;
      if (NativeXhr?.prototype) {
        const open = NativeXhr.prototype.open;
        const send = NativeXhr.prototype.send;
        NativeXhr.prototype.open = function (_method, url) {
          this.__ascShujiajiaUrl = String(url || "");
          this.__ascShujiajiaMethod = String(_method || "GET").toUpperCase();
          return open.apply(this, arguments);
        };
        NativeXhr.prototype.send = function () {
          const xhr = this;
          xhr.__ascShujiajiaContextId = contextId;
          xhr.addEventListener?.("load", function () {
            if (!enabled) return;
            const rawUrl = xhr.__ascShujiajiaUrl;
            if ((isExecuteUrl(rawUrl) && xhr.__ascShujiajiaMethod === "GET") || isTempSaveUrl(rawUrl)) {
              let body = null;
              try { body = typeof xhr.response === "object" ? xhr.response : JSON.parse(xhr.responseText || "null"); } catch (_error) {}
              void handleJsonResponse(rawUrl, xhr.status, body, xhr.__ascShujiajiaMethod);
              return;
            }
            const mime = getAudioMime(xhr.getResponseHeader?.("content-type"), rawUrl);
            const requestContextId = String(xhr.__ascShujiajiaContextId || "");
            if (!requestContextId || requestContextId !== contextId || !mime) return;
            const value = xhr.response;
            const promise = value instanceof ArrayBuffer ? Promise.resolve(value) : value?.arrayBuffer ? value.arrayBuffer() : Promise.resolve(null);
            void promise.then(function (buffer) {
              const audioDataUrl = bufferToAudioDataUrl(buffer, mime);
              if (!audioDataUrl) return;
              latestAudioDataUrl = audioDataUrl;
              audioFetchContextId = requestContextId;
              if (requestContextId !== contextId) return;
              emit({ source: SOURCE, type: AUDIO_READY, payload: { contextId: requestContextId, audioDataUrl: latestAudioDataUrl } });
            }).catch(function () {});
          });
          return send.apply(this, arguments);
        };
      }
    }
    function enable(windowLike) {
      enabled = true;
      wrapRequests(windowLike || globalThis.window);
    }
    function disable() {
      enabled = false;
      try { audioAbortController?.abort?.(); } catch (_error) {}
      latestAudioDataUrl = "";
      audioFetchContextId = "";
      audioAbortController = null;
      saveIntent = null;
    }
    function installController(windowLike) {
      const target = windowLike || globalThis.window;
      if (!target || target.__ascShujiajiaObserverControllerInstalled) return;
      target.__ascShujiajiaObserverControllerInstalled = true;
      wrapRequests(target);
      target.addEventListener?.("message", function (event) {
        if (event.origin && event.origin !== target.location?.origin) return;
        const data = event.data;
        if (!data || data.source !== SOURCE) return;
        if (data.type === OBSERVER_ENABLE) enable(target);
        else if (data.type === OBSERVER_DISABLE) disable();
        else if (data.type === CONTEXT_READY) setContext(data.payload?.contextId);
        else if (data.type === SAVE_INTENT) setSaveIntent(data.payload);
      });
    }
    function install(windowLike) { enable(windowLike); }
    return { captureResponse, disable, enable, getLatestAudioDataUrl: () => latestAudioDataUrl, install, installController, setContext, setSaveIntent };
  }

  const api = { createObserver, constants: { SOURCE, AUDIO_READY, CONTEXT_READY, TEMP_SAVE_SUCCEEDED, OBSERVER_ENABLE, OBSERVER_DISABLE, SAVE_INTENT } };
  globalThis.__ASREdgeShujiajiaNetworkObserver = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") createObserver({}).installController(window);
})();
