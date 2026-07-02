(function () {
  const SOURCE = "ASR_EDGE_BYTEDANCE_AIDP_SUZHOU_OBSERVER";
  const RECEIVE_TYPE = "BYTEDANCE_AIDP_SUZHOU_RECEIVE_SNAPSHOT";
  const SUBMIT_TYPE = "BYTEDANCE_AIDP_SUZHOU_SUBMIT_SNAPSHOT";
  const RECEIVE_PATH = "/api/dispatch/Receive";
  const SUBMIT_PATH = "/api/dispatch/SubmitTempItemAnswer";
  const ALLOWED_SUBMIT_HEADERS = ["accept", "content-type", "x-secsdk-csrf-token"];

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function getUrl(rawUrl, locationLike) {
    try {
      return new URL(String(rawUrl || ""), locationLike?.href || "https://aidp.bytedance.com/");
    } catch (_error) {
      return null;
    }
  }

  function isReceiveUrl(rawUrl, locationLike) {
    return getUrl(rawUrl, locationLike)?.pathname === RECEIVE_PATH;
  }

  function isSubmitUrl(rawUrl, locationLike) {
    return getUrl(rawUrl, locationLike)?.pathname === SUBMIT_PATH;
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
      source.forEach(function (item) {
        if (Array.isArray(item) && item.length >= 2) {
          result.push([item[0], item[1]]);
        }
      });
      return result;
    }
    if (typeof source === "object") {
      Object.keys(source).forEach(function (key) {
        result.push([key, source[key]]);
      });
    }
    return result;
  }

  function sanitizeSubmitHeaders(headers) {
    const result = {};
    readHeaderEntries(headers).forEach(function (entry) {
      const name = normalizeText(entry[0]).toLowerCase();
      if (ALLOWED_SUBMIT_HEADERS.indexOf(name) < 0) {
        return;
      }
      const value = normalizeText(entry[1]);
      if (!value) {
        return;
      }
      result[name] = value;
    });
    if (!result["content-type"]) {
      result["content-type"] = "application/json";
    }
    return result;
  }

  function mergeHeaderSources(left, right) {
    const merged = {};
    readHeaderEntries(left).forEach(function (entry) {
      merged[String(entry[0] || "")] = entry[1];
    });
    readHeaderEntries(right).forEach(function (entry) {
      merged[String(entry[0] || "")] = entry[1];
    });
    return merged;
  }

  function parseJsonSafely(value) {
    if (!value) {
      return null;
    }
    if (typeof value === "object") {
      return value;
    }
    try {
      return JSON.parse(String(value));
    } catch (_error) {
      return null;
    }
  }

  function stringifyBodyCandidate(value) {
    if (typeof value === "string") {
      return value;
    }
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (_error) {
        return "";
      }
    }
    return String(value || "");
  }

  function postMessage(windowLike, locationLike, type, payload) {
    if (!windowLike || typeof windowLike.postMessage !== "function") {
      return;
    }
    windowLike.postMessage(
      {
        source: SOURCE,
        type: type,
        payload: payload,
      },
      locationLike?.origin || "*"
    );
  }

  async function readFetchBodyText(input, init) {
    if (typeof init?.body === "string") {
      return init.body;
    }
    if (init?.body && typeof init.body === "object") {
      return stringifyBodyCandidate(init.body);
    }
    if (input && typeof input.clone === "function") {
      try {
        return await input.clone().text();
      } catch (_error) {
        return "";
      }
    }
    return "";
  }

  function createObserver(options) {
    const deps = options && typeof options === "object" ? options : {};
    const windowLike = deps.window || globalThis.window || globalThis;
    const locationLike = deps.location || windowLike.location || globalThis.location || {};
    let installed = false;

    function notifyReceive(rawUrl, payload) {
      postMessage(windowLike, locationLike, RECEIVE_TYPE, {
        url: getUrl(rawUrl, locationLike)?.href || String(rawUrl || ""),
        response: payload,
      });
    }

    function notifySubmit(rawUrl, headers, body) {
      postMessage(windowLike, locationLike, SUBMIT_TYPE, {
        url: getUrl(rawUrl, locationLike)?.href || String(rawUrl || ""),
        headers: sanitizeSubmitHeaders(headers),
        body: parseJsonSafely(body) || {},
      });
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
        if (isSubmitUrl(rawUrl, locationLike)) {
          void readFetchBodyText(input, init).then(function (bodyText) {
            notifySubmit(rawUrl, mergeHeaderSources(input?.headers, init?.headers), bodyText);
          });
        }
        return nativeFetch.apply(this, args).then(function (response) {
          if (!isReceiveUrl(rawUrl, locationLike)) {
            return response;
          }
          try {
            response
              .clone()
              .text()
              .then(function (text) {
                const payload = parseJsonSafely(text);
                if (payload) {
                  notifyReceive(rawUrl, payload);
                }
              })
              .catch(function () {});
          } catch (_error) {
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
        this.__ascAidpRawUrl = String(url || "");
        this.__ascAidpHeaders = {};
        return nativeOpen.apply(this, arguments);
      };

      NativeXhr.prototype.setRequestHeader = function (name, value) {
        if (!this.__ascAidpHeaders || typeof this.__ascAidpHeaders !== "object") {
          this.__ascAidpHeaders = {};
        }
        this.__ascAidpHeaders[String(name || "")] = value;
        return nativeSetRequestHeader.apply(this, arguments);
      };

      NativeXhr.prototype.send = function (body) {
        const xhr = this;
        const rawUrl = xhr.__ascAidpRawUrl || "";
        if (isSubmitUrl(rawUrl, locationLike)) {
          notifySubmit(rawUrl, xhr.__ascAidpHeaders, stringifyBodyCandidate(body));
        }
        if (isReceiveUrl(rawUrl, locationLike) && typeof xhr.addEventListener === "function") {
          xhr.addEventListener("load", function () {
            const payload = parseJsonSafely(xhr.responseText);
            if (payload) {
              notifyReceive(rawUrl, payload);
            }
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

    return {
      install,
    };
  }

  const api = {
    createObserver,
    constants: {
      SOURCE: SOURCE,
      RECEIVE_TYPE: RECEIVE_TYPE,
      SUBMIT_TYPE: SUBMIT_TYPE,
    },
  };

  globalThis.ASREdgeBytedanceAidpSuzhouNetworkObserverPage = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof window !== "undefined") {
    const flag = "__ASREdgeBytedanceAidpSuzhouNetworkObserverInstalled";
    if (!window[flag]) {
      window[flag] = true;
      createObserver({ window, location: window.location }).install();
    }
  }
})();
