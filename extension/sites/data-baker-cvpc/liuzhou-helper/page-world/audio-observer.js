(function () {
  const SOURCE = "ASR_EDGE_DATABAKER_CVPC_LIUZHOU_AUDIO_OBSERVER";
  const MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_AUDIO_MAPPING";
  const META_MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_META_SNAPSHOT";
  const AUTH_MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_REQUEST_AUTH";
  const META_PATH = "/httpapi/annotation/meta";
  const USER_META_PATH = "/httpapi/user/meta";
  const ANNOTATION_PATH_PREFIX = "/httpapi/annotation/";
  const AUTH_HEADER_NAMES = ["authorization", "baker-terminal", "baker-lang"];
  const MAX_ENTRIES = 30;
  const AUDIO_EXT_PATTERN = /\.(mp3|wav|m4a|aac|ogg)(?:$|\?)/i;
  const AUDIO_URL_PATTERN = /https?:\/\/[^\s"'<>]+?\.(?:mp3|wav|m4a|aac|ogg)(?:\?[^\s"'<>]*)?/gi;

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

  function getMetaUrlType(rawUrl, locationLike) {
    const url = getUrl(rawUrl, locationLike);
    if (!url) {
      return "";
    }
    if (url.pathname === META_PATH) {
      return "annotation";
    }
    if (url.pathname === USER_META_PATH) {
      return "user";
    }
    return "";
  }

  function extractQuery(rawUrl, locationLike) {
    const url = getUrl(rawUrl, locationLike);
    const result = {};
    if (!url) {
      return result;
    }
    url.searchParams.forEach(function (value, key) {
      result[key] = value;
    });
    return result;
  }

  function readHeaderEntries(source) {
    const result = [];
    if (!source) {
      return result;
    }
    if (typeof source.forEach === "function") {
      try {
        source.forEach(function (value, key) {
          result.push([key, value]);
        });
        return result;
      } catch (_error) {
        // Ignore unsupported Headers-like objects.
      }
    }
    if (Array.isArray(source)) {
      source.forEach(function (pair) {
        if (Array.isArray(pair) && pair.length >= 2) {
          result.push([pair[0], pair[1]]);
        }
      });
      return result;
    }
    if (source && typeof source === "object") {
      Object.keys(source).forEach(function (key) {
        result.push([key, source[key]]);
      });
    }
    return result;
  }

  function sanitizeRequestHeaders(source) {
    const result = {};
    readHeaderEntries(source).forEach(function (entry) {
      const key = normalizeText(entry[0]).toLowerCase();
      if (AUTH_HEADER_NAMES.indexOf(key) < 0) {
        return;
      }
      const value = normalizeText(entry[1]);
      if (!value) {
        return;
      }
      result[key] = value;
    });
    return result;
  }

  function isAudioUrl(rawUrl, locationLike) {
    const url = getUrl(rawUrl, locationLike);
    if (!url) {
      return false;
    }
    return AUDIO_EXT_PATTERN.test(url.pathname);
  }

  function isCvpcDataAudioPath(rawUrl, locationLike) {
    const url = getUrl(rawUrl, locationLike);
    return Boolean(url && /^\/?databaker\/data\//i.test(normalizePath(url.pathname)));
  }

  function isAnnotationApiUrl(rawUrl, locationLike) {
    const url = getUrl(rawUrl, locationLike);
    return Boolean(url && url.pathname.indexOf(ANNOTATION_PATH_PREFIX) === 0);
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

  function sanitizeUserMeta(payload) {
    const source = payload && typeof payload === "object" ? payload : {};
    const data = source.data && typeof source.data === "object" ? source.data : source;
    const result = {};
    if (Object.prototype.hasOwnProperty.call(data, "name")) {
      result.name = normalizeText(data.name);
    }
    if (Object.prototype.hasOwnProperty.call(data, "user_id")) {
      const userId = String(data.user_id || "").trim();
      if (userId) {
        result.user_id = data.user_id;
      }
    }
    return result;
  }

  function shouldInstallConsoleObserver(windowLike, locationLike) {
    const href = String(locationLike?.href || "").toLowerCase();
    const isIframeWindow = Boolean(windowLike?.parent && windowLike.parent !== windowLike);
    if (!isIframeWindow) {
      return false;
    }
    return href.indexOf("/app/xaudio/") >= 0;
  }

  function createObserver(options) {
    const deps = options && typeof options === "object" ? options : {};
    const windowLike = deps.window || globalThis.window || globalThis;
    const locationLike = deps.location || windowLike.location || globalThis.location || {};
    const entries = [];
    const mappings = new Map();
    const pendingAudioUrls = [];
    let installed = false;

    function getMessageTarget() {
      return windowLike.parent && windowLike.parent !== windowLike ? windowLike.parent : windowLike;
    }

    function notify(mapping) {
      const target = getMessageTarget();
      if (!mapping || typeof target.postMessage !== "function") {
        return;
      }
      target.postMessage(
        {
          source: SOURCE,
          type: MESSAGE_TYPE,
          payload: mapping,
        },
        locationLike.origin || "*"
      );
    }

    function notifyMeta(rawUrl, meta) {
      const target = getMessageTarget();
      if (!meta || typeof meta !== "object" || typeof target.postMessage !== "function") {
        return;
      }
      target.postMessage(
        {
          source: SOURCE,
          type: META_MESSAGE_TYPE,
          payload: {
            meta,
            query: extractQuery(rawUrl, locationLike),
            at: Date.now(),
          },
        },
        locationLike.origin || "*"
      );
    }

    function notifyRequestAuth(rawUrl, headers) {
      const target = getMessageTarget();
      const sanitizedHeaders = sanitizeRequestHeaders(headers);
      if (!Object.keys(sanitizedHeaders).length || typeof target.postMessage !== "function") {
        return;
      }
      target.postMessage(
        {
          source: SOURCE,
          type: AUTH_MESSAGE_TYPE,
          payload: {
            path: getUrl(rawUrl, locationLike)?.pathname || "",
            query: extractQuery(rawUrl, locationLike),
            headers: sanitizedHeaders,
            at: Date.now(),
          },
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
      pendingAudioUrls.slice().forEach(function (url) {
        rememberAudioUrl(url);
      });
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
        if (!isCvpcDataAudioPath(audioUrl, locationLike)) {
          return null;
        }
        const url = getUrl(audioUrl, locationLike);
        const relativePath = url ? normalizePath(url.pathname) : "";
        const fileName = extractFileName(relativePath || audioUrl);
        notify({
          relativePath,
          fileName,
          entryId: "",
          entryIndex: "",
          audioUrl,
          at: Date.now(),
        });
        pendingAudioUrls.unshift(audioUrl);
        pendingAudioUrls.splice(MAX_ENTRIES);
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

    function collectAudioUrlsFromValue(value, results, depth) {
      if (depth > 3 || results.length >= MAX_ENTRIES) {
        return;
      }
      if (typeof value === "string") {
        const matches = value.match(AUDIO_URL_PATTERN) || [];
        matches.forEach(function (item) {
          if (results.indexOf(item) < 0) {
            results.push(item);
          }
        });
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(function (item) {
          collectAudioUrlsFromValue(item, results, depth + 1);
        });
        return;
      }
      if (value && typeof value === "object") {
        Object.keys(value)
          .slice(0, MAX_ENTRIES)
          .forEach(function (key) {
            collectAudioUrlsFromValue(value[key], results, depth + 1);
          });
      }
    }

    function observeConsoleArgs(args) {
      const urls = [];
      Array.from(args || []).forEach(function (item) {
        collectAudioUrlsFromValue(item, urls, 0);
      });
      urls.forEach(function (url) {
        observeAudioUrl(url);
      });
    }

    function observeResponse(rawUrl, responseText) {
      const metaType = getMetaUrlType(rawUrl, locationLike);
      if (!metaType) {
        return;
      }
      try {
        const payload = JSON.parse(String(responseText || "{}"));
        let meta = payload && typeof payload === "object" && payload.data ? payload.data : payload;
        if (metaType === "annotation") {
          rememberEntries(extractEntries(payload));
        } else if (metaType === "user") {
          meta = sanitizeUserMeta(payload);
        }
        notifyMeta(rawUrl, meta);
      } catch (error) {
        // Ignore partial or non-JSON responses.
      }
    }

    function observeAudioUrl(rawUrl) {
      return rememberAudioUrl(rawUrl);
    }

    function observeRequestAuth(rawUrl, headers) {
      if (!isAnnotationApiUrl(rawUrl, locationLike)) {
        return;
      }
      notifyRequestAuth(rawUrl, headers);
    }

    function installFetchObserver() {
      const nativeFetch = windowLike.fetch;
      if (typeof nativeFetch !== "function") {
        return;
      }
      windowLike.fetch = function () {
        const args = Array.from(arguments);
        const input = args[0];
        const init = args[1];
        const rawUrl =
          typeof input === "string"
            ? input
            : input && typeof input.url === "string"
              ? input.url
              : "";
        observeAudioUrl(rawUrl);
        observeRequestAuth(rawUrl, Object.assign({}, sanitizeRequestHeaders(input?.headers), sanitizeRequestHeaders(init?.headers)));
        return nativeFetch.apply(this, args).then(function (response) {
          if (!getMetaUrlType(rawUrl, locationLike)) {
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
      const nativeSetRequestHeader = NativeXhr.prototype.setRequestHeader;
      if (
        typeof nativeOpen !== "function" ||
        typeof nativeSend !== "function" ||
        typeof nativeSetRequestHeader !== "function"
      ) {
        return;
      }
      NativeXhr.prototype.open = function (method, url) {
        this.__ascCvpcLiuzhouAudioUrl = String(url || "");
        this.__ascCvpcLiuzhouHeaders = {};
        observeAudioUrl(this.__ascCvpcLiuzhouAudioUrl);
        return nativeOpen.apply(this, arguments);
      };
      NativeXhr.prototype.setRequestHeader = function (name, value) {
        if (!this.__ascCvpcLiuzhouHeaders || typeof this.__ascCvpcLiuzhouHeaders !== "object") {
          this.__ascCvpcLiuzhouHeaders = {};
        }
        this.__ascCvpcLiuzhouHeaders[String(name || "")] = value;
        return nativeSetRequestHeader.apply(this, arguments);
      };
      NativeXhr.prototype.send = function () {
        const xhr = this;
        const rawUrl = xhr.__ascCvpcLiuzhouAudioUrl || "";
        observeRequestAuth(rawUrl, xhr.__ascCvpcLiuzhouHeaders);
        if (getMetaUrlType(rawUrl, locationLike) && typeof xhr.addEventListener === "function") {
          xhr.addEventListener("load", function () {
            observeResponse(rawUrl, xhr.responseText);
          });
        }
        return nativeSend.apply(this, arguments);
      };
    }

    function installConsoleObserver() {
      const consoleLike = windowLike.console;
      if (!consoleLike) {
        return;
      }
      ["log", "info", "debug"].forEach(function (method) {
        if (typeof consoleLike[method] !== "function") {
          return;
        }
        const nativeMethod = consoleLike[method];
        consoleLike[method] = function () {
          try {
            observeConsoleArgs(arguments);
          } catch (error) {
            // Keep platform console behavior unchanged.
          }
          return nativeMethod.apply(this, arguments);
        };
      });
    }

    function install() {
      if (installed) {
        return;
      }
      installed = true;
      installFetchObserver();
      installXhrObserver();
      if (shouldInstallConsoleObserver(windowLike, locationLike)) {
        installConsoleObserver();
      }
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
      observeConsoleArgs,
      observeRequestAuth,
      observeResponse,
    };
  }

  const api = {
    createObserver,
    constants: {
      MESSAGE_TYPE,
      SOURCE,
      META_MESSAGE_TYPE,
      AUTH_MESSAGE_TYPE,
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
