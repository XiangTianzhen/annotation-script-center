(function () {
  const SOURCE = "ASR_EDGE_DATABAKER_ROUND_ONE_QUALITY_PAGE";
  const MESSAGE_TYPE = "DATABAKER_ROUND_ONE_QUALITY_COLLECT_RESPONSE";
  const TARGET_PATH = "/cms/tbAudioUserTask/queryCollectStatementByCondtion";
  const CACHE_LIMIT = 8;

  if (window.__ASREdgeDataBakerRoundOneNetworkObserverInstalled) {
    return;
  }
  window.__ASREdgeDataBakerRoundOneNetworkObserverInstalled = true;

  const state = {
    entries: [],
  };

  function isTargetUrl(rawUrl) {
    try {
      const url = new URL(String(rawUrl || ""), location.href);
      return url.hostname === location.hostname && url.pathname === TARGET_PATH;
    } catch (error) {
      return false;
    }
  }

  function readParams(rawUrl) {
    try {
      const url = new URL(String(rawUrl || ""), location.href);
      return {
        collectId: String(url.searchParams.get("collectId") || ""),
        pageNum: Number(url.searchParams.get("pageNum") || 1) || 1,
        pageSize: Number(url.searchParams.get("pageSize") || 10) || 10,
        audioText: String(url.searchParams.get("audioText") || ""),
        sentenceNumber: String(url.searchParams.get("sentenceNumber") || ""),
        vadStatus: String(url.searchParams.get("vadStatus") || ""),
      };
    } catch (error) {
      return {
        collectId: "",
        pageNum: 1,
        pageSize: 10,
        audioText: "",
        sentenceNumber: "",
        vadStatus: "",
      };
    }
  }

  function extractRecords(payload) {
    const candidates = [
      payload?.data?.list,
      payload?.data?.records,
      payload?.data?.rows,
      payload?.data?.data,
      payload?.data,
      payload?.records,
      payload?.rows,
      payload?.list,
    ];

    for (let index = 0; index < candidates.length; index += 1) {
      if (Array.isArray(candidates[index])) {
        return candidates[index];
      }
    }

    return [];
  }

  function extractTotal(payload, records) {
    const candidates = [
      payload?.data?.total,
      payload?.data?.count,
      payload?.data?.totalCount,
      payload?.total,
      payload?.count,
      payload?.totalCount,
    ];

    for (let index = 0; index < candidates.length; index += 1) {
      const value = Number(candidates[index]);
      if (Number.isFinite(value)) {
        return value;
      }
    }

    return Array.isArray(records) ? records.length : 0;
  }

  function normalizeRecord(record, index) {
    const sourceRecord = record && typeof record === "object" ? record : {};
    return {
      id: sourceRecord.id,
      audioUrl: sourceRecord.audioUrl,
      audioText: sourceRecord.audioText,
      sentenceNumber: sourceRecord.sentenceNumber,
      readRequire: sourceRecord.readRequire,
      effectiveStartTime: sourceRecord.effectiveStartTime,
      effectiveEndTime: sourceRecord.effectiveEndTime,
      effectiveTime: sourceRecord.effectiveTime,
      audioDuration: sourceRecord.audioDuration,
      vad: sourceRecord.vad,
      statusName: sourceRecord.statusName,
      collectId: sourceRecord.collectId,
      textId: sourceRecord.textId,
      snr: sourceRecord.snr,
      volume: sourceRecord.volume,
      noise: sourceRecord.noise,
      __index: index,
    };
  }

  function notify(entry) {
    try {
      window.postMessage(
        {
          source: SOURCE,
          type: MESSAGE_TYPE,
          payload: entry,
        },
        location.origin
      );
    } catch (error) {
      // Keep observer silent; content script can fall back to DOM.
    }
  }

  function storeResponse(rawUrl, payload) {
    const params = readParams(rawUrl);
    const records = extractRecords(payload).map(normalizeRecord);
    const entry = {
      at: Date.now(),
      params,
      total: extractTotal(payload, records),
      records,
    };

    state.entries.unshift(entry);
    state.entries = state.entries.slice(0, CACHE_LIMIT);
    window.__ASREdgeDataBakerRoundOneCollectCache = {
      entries: state.entries,
      latest: state.entries[0] || null,
    };
    notify(entry);
  }

  function observeResponse(rawUrl, responseText) {
    if (!isTargetUrl(rawUrl)) {
      return;
    }

    try {
      storeResponse(rawUrl, JSON.parse(String(responseText || "{}")));
    } catch (error) {
      // ignore non-json or partial responses
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

      return nativeFetch.apply(this, args).then(function (response) {
        if (!isTargetUrl(rawUrl)) {
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
          // ignore clone/read errors
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
      this.__asrEdgeDataBakerRequestUrl = String(url || "");
      return nativeOpen.apply(this, arguments);
    };

    NativeXhr.prototype.send = function () {
      const xhr = this;
      const rawUrl = xhr.__asrEdgeDataBakerRequestUrl || "";
      if (isTargetUrl(rawUrl)) {
        xhr.addEventListener("load", function () {
          observeResponse(rawUrl, xhr.responseText);
        });
      }
      return nativeSend.apply(this, arguments);
    };
  }
})();
