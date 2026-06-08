(function () {
  const SOURCE = "ASR_EDGE_DATABAKER_CVPC_LIUZHOU_AUDIO_OBSERVER";
  const MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_AUDIO_MAPPING";
  const META_PATH = "/httpapi/annotation/meta";
  const MAX_ENTRIES = 30;
  const AUDIO_EXT_PATTERN = /\.(mp3|wav|m4a|aac|ogg)(?:$|\?)/i;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizePath(value) {
    return normalizeText(value)
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/^\//, "");
  }

  function getUrl(rawUrl, locationLike) {
    try {
      return new URL(String(rawUrl || ""), locationLike?.href || "https://cvpc.data-baker.com/");
    } catch (error) {
      return null;
    }
  }

  function isMetaUrl(rawUrl, locationLike) {
    const url = getUrl(rawUrl, locationLike);
    return Boolean(url && url.pathname === META_PATH);
  }

  function isAudioUrl(rawUrl, locationLike) {
    const url = getUrl(rawUrl, locationLike);
    if (!url) {
      return false;
    }
    return AUDIO_EXT_PATTERN.test(url.pathname);
  }

  function extractFileName(value) {
    const path = normalizePath(value).split("?")[0];
    return normalizeText(path.split("/").pop());
  }

  function extractEntries(payload) {
    const source = payload && typeof payload === "object" ? payload : {};
    const datas = Array.isArray(source?.data?.datas)
      ? source.data.datas
      : Array.isArray(source?.datas)
        ? source.datas
        : [];
    return datas
      .map(function (item) {
        const row = item && typeof item === "object" ? item : {};
        const relativePath = normalizePath(row.content);
        const fileName = normalizeText(row.name) || extractFileName(relativePath);
        return {
          entryId: normalizeText(row.entry_id),
          entryIndex: normalizeText(row.entry_index),
          relativePath,
          fileName,
        };
      })
      .filter(function (item) {
        return item.relativePath || item.fileName;
      });
  }

  function createObserver(options) {
    const deps = options && typeof options === "object" ? options : {};
    const windowLike = deps.window || globalThis.window || globalThis;
    const locationLike = deps.location || windowLike.location || globalThis.location || {};
    const entries = [];
    const mappings = new Map();
    let installed = false;

    function notify(mapping) {
      if (!mapping || typeof windowLike.postMessage !== "function") {
        return;
      }
      windowLike.postMessage(
        {
          source: SOURCE,
          type: MESSAGE_TYPE,
          payload: mapping,
        },
        locationLike.origin || "*"
      );
    }

    function rememberEntries(nextEntries) {
      const list = Array.isArray(nextEntries) ? nextEntries : [];
      list.forEach(function (entry) {
        entries.unshift(entry);
      });
      entries.splice(MAX_ENTRIES);
    }

    function matchEntry(rawAudioUrl) {
      const url = getUrl(rawAudioUrl, locationLike);
      if (!url) {
        return null;
      }
      const audioPath = normalizePath(url.pathname);
      const audioFileName = extractFileName(url.pathname);
      return (
        entries.find(function (entry) {
          return entry.relativePath && audioPath.endsWith(entry.relativePath);
        }) ||
        entries.find(function (entry) {
          return entry.fileName && audioFileName === entry.fileName;
        }) ||
        null
      );
    }

    function rememberAudioUrl(rawAudioUrl) {
      const audioUrl = normalizeText(rawAudioUrl);
      if (!audioUrl || !isAudioUrl(audioUrl, locationLike)) {
        return null;
      }
      const entry = matchEntry(audioUrl);
      if (!entry) {
        return null;
      }
      const key = entry.relativePath || entry.fileName;
      const mapping = {
        relativePath: entry.relativePath,
        fileName: entry.fileName,
        entryId: entry.entryId,
        entryIndex: entry.entryIndex,
        audioUrl,
        at: Date.now(),
      };
      mappings.set(key, mapping);
      notify(mapping);
      return mapping;
    }

    function observeResponse(rawUrl, responseText) {
      if (!isMetaUrl(rawUrl, locationLike)) {
        return;
      }
      try {
        rememberEntries(extractEntries(JSON.parse(String(responseText || "{}"))));
      } catch (error) {
        // Ignore partial or non-JSON responses.
      }
    }

    function observeAudioUrl(rawUrl) {
      return rememberAudioUrl(rawUrl);
    }

    function installFetchObserver() {
      const nativeFetch = windowLike.fetch;
      if (typeof nativeFetch !== "function") {
        return;
      }
      windowLike.fetch = function () {
        const args = Array.from(arguments);
        const input = args[0];
        const rawUrl =
          typeof input === "string"
            ? input
            : input && typeof input.url === "string"
              ? input.url
              : "";
        observeAudioUrl(rawUrl);
        return nativeFetch.apply(this, args).then(function (response) {
          if (!isMetaUrl(rawUrl, locationLike)) {
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
            // Keep page behavior unchanged if response cloning fails.
          }
          return response;
        });
      };
    }

    function installXhrObserver() {
      const NativeXhr = windowLike.XMLHttpRequest;
      if (typeof NativeXhr !== "function") {
        return;
      }
      const nativeOpen = NativeXhr.prototype.open;
      const nativeSend = NativeXhr.prototype.send;
      if (typeof nativeOpen !== "function" || typeof nativeSend !== "function") {
        return;
      }
      NativeXhr.prototype.open = function (method, url) {
        this.__ascCvpcLiuzhouAudioUrl = String(url || "");
        observeAudioUrl(this.__ascCvpcLiuzhouAudioUrl);
        return nativeOpen.apply(this, arguments);
      };
      NativeXhr.prototype.send = function () {
        const xhr = this;
        const rawUrl = xhr.__ascCvpcLiuzhouAudioUrl || "";
        if (isMetaUrl(rawUrl, locationLike) && typeof xhr.addEventListener === "function") {
          xhr.addEventListener("load", function () {
            observeResponse(rawUrl, xhr.responseText);
          });
        }
        return nativeSend.apply(this, arguments);
      };
    }

    function install() {
      if (installed) {
        return;
      }
      installed = true;
      installFetchObserver();
      installXhrObserver();
    }

    function getSnapshot() {
      return {
        entries: entries.slice(),
        mappings: Array.from(mappings.values()).sort(function (left, right) {
          return Number(right.at || 0) - Number(left.at || 0);
        }),
      };
    }

    return {
      getSnapshot,
      install,
      observeAudioUrl,
      observeResponse,
    };
  }

  const api = {
    createObserver,
    constants: {
      MESSAGE_TYPE,
      SOURCE,
    },
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouAudioObserverPage = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof window !== "undefined") {
    const flag = "__ASREdgeDataBakerCvpcLiuzhouAudioObserverInstalled";
    if (!window[flag]) {
      window[flag] = true;
      createObserver({ window, location: window.location }).install();
    }
  }
})();
