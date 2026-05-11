(function () {
  const SOURCE = "ASC_MAGIC_DATA_MAIN";
  const DETAIL_TYPE = "ASC_MAGIC_DATA_ANNOTATE_DETAIL_RESPONSE";
  const DETAIL_PATH_PREFIX = "/api/management-service/annotateTask/annotateDetailInfo/";
  const CACHE_LIMIT = 20;

  if (window.__ASREdgeMagicDataNetworkObserverInstalled) {
    return;
  }
  window.__ASREdgeMagicDataNetworkObserverInstalled = true;

  const cache = [];

  function safeToObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toText(value) {
    return String(value || "").trim();
  }

  function toNumberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function resolveTarget(rawUrl) {
    try {
      const url = new URL(String(rawUrl || ""), location.href);
      if (url.hostname !== location.hostname) {
        return null;
      }
      if (url.pathname.indexOf(DETAIL_PATH_PREFIX) !== 0) {
        return null;
      }
      const taskItemIdFromPath = decodeURIComponent(url.pathname.slice(DETAIL_PATH_PREFIX.length));
      return {
        url: url,
        taskItemIdFromPath: toText(taskItemIdFromPath),
      };
    } catch (error) {
      return null;
    }
  }

  function sanitizePayload(rawPayload, target) {
    const payload = safeToObject(rawPayload);
    const data = safeToObject(payload.data);
    const markInfo = Array.isArray(data.mark_info) ? data.mark_info : [];
    const taskItemId =
      toText(data.taskItemId) ||
      toText(payload.taskItemId) ||
      toText(target?.taskItemIdFromPath);

    return {
      at: Date.now(),
      taskItemId: taskItemId,
      path: toText(data.path),
      wav_name: toText(data.wav_name),
      start_time: toNumberOrNull(data.start_time),
      end_time: toNumberOrNull(data.end_time),
      mark_info: markInfo.map(function (item) {
        const source = safeToObject(item);
        return {
          mark_text: toText(source.mark_text),
          speak_people: source.speak_people,
          mark_type: toText(source.mark_type),
        };
      }),
      statistics: data.statistics,
      is_valid: data.is_valid,
      base_speak: data.base_speak,
      duration: toNumberOrNull(
        data.duration !== undefined
          ? data.duration
          : data.audio_duration !== undefined
            ? data.audio_duration
            : data.total_duration
      ),
    };
  }

  function notify(entry) {
    try {
      window.postMessage(
        {
          source: SOURCE,
          type: DETAIL_TYPE,
          payload: entry,
        },
        location.origin
      );
    } catch (error) {
      // Keep silent. ISOLATED side has fallback collection.
    }
  }

  function remember(entry) {
    cache.unshift(entry);
    cache.splice(CACHE_LIMIT);
    window.__ASREdgeMagicDataAnnotateDetailCache = {
      latest: cache[0] || null,
      entries: cache,
    };
    notify(entry);
  }

  function observeResponse(rawUrl, responseText) {
    const target = resolveTarget(rawUrl);
    if (!target) {
      return;
    }
    try {
      const payload = JSON.parse(String(responseText || "{}"));
      const entry = sanitizePayload(payload, target);
      if (!entry.taskItemId) {
        return;
      }
      remember(entry);
    } catch (error) {
      // ignore non-json body
    }
  }

  const nativeFetch = window.fetch;
  if (typeof nativeFetch === "function") {
    window.fetch = function () {
      const args = Array.from(arguments);
      const rawUrl =
        typeof args[0] === "string"
          ? args[0]
          : args[0] && typeof args[0].url === "string"
            ? args[0].url
            : "";
      const target = resolveTarget(rawUrl);
      return nativeFetch.apply(this, args).then(function (response) {
        if (!target) {
          return response;
        }
        try {
          response
            .clone()
            .text()
            .then(function (text) {
              observeResponse(rawUrl, text);
            })
            .catch(function () {});
        } catch (error) {
          // ignore clone/read failures
        }
        return response;
      });
    };
  }

  const NativeXhr = window.XMLHttpRequest;
  if (typeof NativeXhr === "function") {
    const nativeOpen = NativeXhr.prototype.open;
    const nativeSend = NativeXhr.prototype.send;

    NativeXhr.prototype.open = function (method, url) {
      this.__ascMagicDataRequestUrl = String(url || "");
      return nativeOpen.apply(this, arguments);
    };

    NativeXhr.prototype.send = function () {
      const xhr = this;
      const rawUrl = xhr.__ascMagicDataRequestUrl || "";
      if (resolveTarget(rawUrl)) {
        xhr.addEventListener("load", function () {
          observeResponse(rawUrl, xhr.responseText);
        });
      }
      return nativeSend.apply(this, arguments);
    };
  }
})();
