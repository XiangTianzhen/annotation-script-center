(function () {
  const SOURCE = "ASR_EDGE_DATABAKER_ROUND_ONE_QUALITY_PAGE";
  const MESSAGE_TYPE = "DATABAKER_ROUND_ONE_QUALITY_COLLECT_RESPONSE";
  const API_PATH = "/cms/tbAudioUserTask/queryCollectStatementByCondtion";

  function isRoundOneCollectPage() {
    return (
      location.hostname === "datafactory.data-baker.com" &&
      String(location.hash || "").indexOf("/quality/roundOneCollect") >= 0
    );
  }

  function parseHashParams() {
    const hash = String(location.hash || "");
    const queryIndex = hash.indexOf("?");
    const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : "");
    return {
      collectId: String(params.get("collectId") || "").trim(),
      checkType: String(params.get("checkType") || "").trim(),
    };
  }

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function normalizeSentenceText(text) {
    return normalizeText(text).replace(/^\d+\s*/, "").trim();
  }

  function ensureChineseSentencePunctuation(text) {
    const value = String(text || "").trim();
    if (!value) {
      return "";
    }
    const last = value[value.length - 1];
    if ("。！？；…".indexOf(last) >= 0) {
      return value;
    }
    if (last === ".") {
      return value.slice(0, -1) + "。";
    }
    if (last === "?") {
      return value.slice(0, -1) + "？";
    }
    if (last === "!") {
      return value.slice(0, -1) + "！";
    }
    if (last === ";") {
      return value.slice(0, -1) + "；";
    }
    return value + "。";
  }

  function exitEditingFocus(element) {
    if (element && typeof element.blur === "function") {
      element.blur();
    }

    try {
      if (document.body instanceof HTMLElement) {
        if (!document.body.hasAttribute("tabindex")) {
          document.body.setAttribute("tabindex", "-1");
        }
        document.body.focus({ preventScroll: true });
      }
    } catch (error) {
      // Ignore focus restoration failures; text has already been filled.
    }
  }

  function toNumberOrNull(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  function parseFirstNumber(text) {
    const match = String(text || "").match(/(-?\d+(?:\.\d+)?)/);
    if (!match) {
      return null;
    }
    return toNumberOrNull(match[1]);
  }

  function parseSentenceNumberFromTitle(text) {
    const match = String(text || "").match(/^\s*(\d+)\s+/);
    if (!match) {
      return null;
    }
    return toNumberOrNull(match[1]);
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

  function createRuntime() {
    const networkEntries = [];

    function rememberNetworkEntry(entry) {
      if (!entry || typeof entry !== "object") {
        return;
      }
      networkEntries.unshift(entry);
      networkEntries.splice(8);
    }

    function handleMessage(event) {
      if (event.source !== window || event.origin !== location.origin) {
        return;
      }
      const data = event.data || {};
      if (data.source !== SOURCE || data.type !== MESSAGE_TYPE) {
        return;
      }
      rememberNetworkEntry(data.payload);
    }

    function start() {
      window.addEventListener("message", handleMessage);
    }

    function stop() {
      window.removeEventListener("message", handleMessage);
      networkEntries.splice(0);
    }

    function getActiveSentenceItem() {
      return (
        document.querySelector(".sentence-list .sentence-item.active") ||
        document.querySelector(".sentence-list .sentence-item")
      );
    }

    function getActiveListIndex() {
      const active = getActiveSentenceItem();
      const items = Array.from(document.querySelectorAll(".sentence-list .sentence-item"));
      return Math.max(0, items.indexOf(active));
    }

    function getPageTextArea() {
      const textBox = Array.from(document.querySelectorAll(".waver-page .text-box")).find(function (
        node
      ) {
        return normalizeText(node.textContent).indexOf("本句话文本") >= 0;
      });
      return (
        textBox?.querySelector("textarea.el-textarea__inner, textarea") ||
        document.querySelector(".waver-page .text-box textarea.el-textarea__inner") ||
        null
      );
    }

    function getPageText() {
      const textarea = getPageTextArea();
      const value = textarea ? String(textarea.value || "").trim() : "";
      if (value) {
        return value;
      }

      const title = getActiveSentenceItem()?.querySelector(".title");
      return normalizeSentenceText(title?.textContent || "");
    }

    function getSentenceNumber() {
      const title = getActiveSentenceItem()?.querySelector(".title");
      return parseSentenceNumberFromTitle(title?.textContent || "");
    }

    function getReadRequire() {
      const nodes = Array.from(document.querySelectorAll(".waver-page *"));
      const node = nodes.find(function (item) {
        return Array.from(item.childNodes || []).some(function (child) {
          return child.nodeType === Node.TEXT_NODE && normalizeText(child.textContent).indexOf("朗读要求：") >= 0;
        });
      });
      const text = normalizeText(node?.textContent || "");
      return text.replace(/^.*?朗读要求：/, "").trim();
    }

    function getDurationInfoFromDom() {
      const container = document.querySelector(".timeform_left_time");
      const text = normalizeText(container?.textContent || "");
      return {
        audioDuration: parseFirstNumber((text.match(/总时长：[^截]+/) || [""])[0]),
        effectiveTime: parseFirstNumber((text.match(/截取时长：[^有]+/) || [""])[0]),
        effectiveStartTime: parseFirstNumber((text.match(/有效开始时间：[^有]+/) || [""])[0]),
        effectiveEndTime: parseFirstNumber((text.match(/有效结束时间：.*/) || [""])[0]),
      };
    }

    function getPageInfoFromDom() {
      const activePage = document.querySelector(".roundOneCollect-el-pagination .el-pager li.active");
      const selectedSize = document.querySelector(
        ".roundOneCollect-el-pagination .el-select-dropdown__item.selected span"
      );
      const pageSizeText = normalizeText(selectedSize?.textContent || "");
      const pageSize = parseFirstNumber(pageSizeText);
      const pageNum = parseFirstNumber(activePage?.textContent || "");
      return {
        pageNum: pageNum || 1,
        pageSize: pageSize || 10,
      };
    }

    function findBestNetworkEntry(routeParams) {
      const collectId = String(routeParams.collectId || "");
      return (
        networkEntries.find(function (entry) {
          return String(entry?.params?.collectId || "") === collectId;
        }) ||
        networkEntries[0] ||
        null
      );
    }

    function findRecord(entry, domState) {
      const records = Array.isArray(entry?.records) ? entry.records : [];
      const sentenceNumber = toNumberOrNull(domState.sentenceNumber);
      const pageText = normalizeText(domState.pageText);
      const listIndex = getActiveListIndex();

      return (
        records.find(function (record) {
          return toNumberOrNull(record.sentenceNumber) === sentenceNumber;
        }) ||
        records.find(function (record) {
          return normalizeText(record.audioText) === pageText;
        }) ||
        records[listIndex] ||
        null
      );
    }

    async function fetchCurrentPageData(routeParams, pageInfo) {
      const url = new URL(API_PATH, location.origin);
      url.searchParams.set("pageSize", String(pageInfo.pageSize || 10));
      url.searchParams.set("pageNum", String(pageInfo.pageNum || 1));
      url.searchParams.set("collectId", String(routeParams.collectId || ""));
      url.searchParams.set("audioText", "");
      url.searchParams.set("sentenceNumber", "");
      url.searchParams.set("vadStatus", "");

      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("读取当前列表接口失败（HTTP " + String(response.status) + "）。");
      }
      const payload = await response.json();
      const records = extractRecords(payload).map(normalizeRecord);
      const entry = {
        at: Date.now(),
        params: {
          collectId: routeParams.collectId,
          pageNum: pageInfo.pageNum,
          pageSize: pageInfo.pageSize,
        },
        total: extractTotal(payload, records),
        records,
      };
      rememberNetworkEntry(entry);
      return entry;
    }

    function getAudioUrlFromDom() {
      const audio = document.querySelector("audio");
      if (audio?.currentSrc || audio?.src) {
        return String(audio.currentSrc || audio.src || "").trim();
      }

      const iframe = document.querySelector("#iframeBox iframe#myIframe, #iframeBox iframe");
      try {
        const iframeAudio = iframe?.contentDocument?.querySelector("audio");
        return String(iframeAudio?.currentSrc || iframeAudio?.src || "").trim();
      } catch (error) {
        return "";
      }
    }

    function canFillPageText() {
      const textarea = getPageTextArea();
      return Boolean(textarea && !textarea.disabled && !textarea.readOnly);
    }

    function fillPageText(text) {
      const textarea = getPageTextArea();
      if (!textarea || textarea.disabled || textarea.readOnly) {
        return {
          ok: false,
          message: "无法安全定位可编辑的“本句话文本”输入框。",
        };
      }

      const nextText = ensureChineseSentencePunctuation(text);
      textarea.focus();
      textarea.value = nextText;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
      exitEditingFocus(textarea);
      return {
        ok: true,
        message: "已填入推荐文本，并退出输入框。",
      };
    }

    async function getCurrentItem(options) {
      const runtimeOptions = options && typeof options === "object" ? options : {};
      const routeParams = parseHashParams();
      const pageInfo = getPageInfoFromDom();
      const domDurations = getDurationInfoFromDom();
      const domState = {
        collectId: routeParams.collectId,
        checkType: routeParams.checkType,
        pageNum: pageInfo.pageNum,
        pageSize: pageInfo.pageSize,
        sentenceNumber: getSentenceNumber(),
        pageText: getPageText(),
        readRequire: getReadRequire(),
        audioUrl: getAudioUrlFromDom(),
        effectiveStartTime: domDurations.effectiveStartTime,
        effectiveEndTime: domDurations.effectiveEndTime,
        effectiveTime: domDurations.effectiveTime,
        audioDuration: domDurations.audioDuration,
      };

      let entry = findBestNetworkEntry(routeParams);
      if (!entry && routeParams.collectId && runtimeOptions.allowFetch !== false) {
        entry = await fetchCurrentPageData(routeParams, pageInfo);
      }

      const record = findRecord(entry, domState);
      const item = Object.assign({}, domState, {
        itemId: String(record?.id || ""),
        textId: String(record?.textId || ""),
        sentenceNumber: toNumberOrNull(record?.sentenceNumber) || domState.sentenceNumber,
        pageText: String(record?.audioText || domState.pageText || ""),
        readRequire: String(record?.readRequire || domState.readRequire || ""),
        audioUrl: String(record?.audioUrl || domState.audioUrl || ""),
        effectiveStartTime:
          toNumberOrNull(record?.effectiveStartTime) ?? domState.effectiveStartTime,
        effectiveEndTime: toNumberOrNull(record?.effectiveEndTime) ?? domState.effectiveEndTime,
        effectiveTime: toNumberOrNull(record?.effectiveTime) ?? domState.effectiveTime,
        audioDuration: toNumberOrNull(record?.audioDuration) ?? domState.audioDuration,
        record,
      });

      item.key = [
        item.collectId,
        item.itemId,
        item.textId,
        item.sentenceNumber,
        normalizeText(item.pageText),
      ].join("|");
      return item;
    }

    return {
      canFillPageText,
      fillPageText,
      getCurrentItem,
      isRoundOneCollectPage,
      parseHashParams,
      start,
      stop,
    };
  }

  globalThis.__ASREdgeDataBakerRoundOneDataApi = {
    createRuntime,
    ensureChineseSentencePunctuation,
    exitEditingFocus,
    isRoundOneCollectPage,
    parseHashParams,
  };
})();
