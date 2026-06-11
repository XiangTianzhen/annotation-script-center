(function () {
  const META_PATH = "/httpapi/annotation/meta";
  const USER_META_PATH = "/httpapi/user/meta";
  const ANNOS_PATH = "/httpapi/annotation/annos";
  const SAVE_INCREMENT_PATH = "/httpapi/annotation/save_increment";
  const OBSERVER_SOURCE = "ASR_EDGE_DATABAKER_CVPC_LIUZHOU_AUDIO_OBSERVER";
  const OBSERVER_MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_AUDIO_MAPPING";
  const OBSERVER_META_MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_META_SNAPSHOT";
  const OBSERVER_AUTH_MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_REQUEST_AUTH";
  const MISSING_AUDIO_MESSAGE =
    "未拿到当前音频签名 URL，请先点击当前音频或播放一次后重试；如仍失败请刷新页面。";
  const VALID_LABELS = ["是（Valid）", "是(Valid)", "Valid"];
  const INVALID_LABELS = ["否（Invalid）", "否(Invalid)", "Invalid"];
  const APPLY_TOLERANCE_MS = 80;
  const FALLBACK_BATCH_TEXT_ATTR_DEFINITIONS = {
    dialectDescriptor: {
      uniqueId: "e274c2ef-0cf1-4ffd-89a9-b5ed1956f1b0",
      name: "标注文本",
      inputType: "text",
    },
    mandarinDescriptor: {
      uniqueId: "aa56b471-439c-40c8-a312-ffed964d20ad",
      name: "普通话顺滑",
      inputType: "text",
    },
  };
  const PREVIEW_STALE_MESSAGE = "当前音频或段选择已变化，旧分段建议已失效，请重新生成。";
  const PREVIEW_LIVE_MISMATCH_MESSAGE = "当前页面分段状态已变化，旧分段建议已失效，请重新生成。";
  const PREVIEW_EMPTY_MESSAGE = "当前还没有可应用的分段建议，请先生成分段建议。";
  const PREVIEW_NOTHING_TO_APPLY_MESSAGE = "当前音频没有需要应用的拆分建议。";
  const PREVIEW_DIRECT_SAVE_AUTH_MISSING_MESSAGE =
    "未获取到平台保存请求的访问凭据，暂时无法直写保存接口。";
  const PREVIEW_DIRECT_SAVE_SUCCESS_MESSAGE =
    "已通过平台保存接口应用分段建议，请刷新页面复核；本次无需再点平台保存。";
  const PREVIEW_DUPLICATE_UNIQUE_ID_MESSAGE =
    "当前分段建议生成了重复 unique_id，已停止自动应用，请重新生成或人工处理。";
  const PREVIEW_DIRECT_SAVE_DUPLICATE_UNIQUE_ID_MESSAGE =
    "平台保存接口返回 unique_id重复；分段建议已保留，请重新生成或人工处理。";
  const PREVIEW_UNSAFE_MESSAGE = "未检测到稳定的波形分段区域或拆分控件，请人工处理当前分段建议。";
  const PREVIEW_APPLY_SUCCESS_MESSAGE = "分段建议已写到页面，请人工复核后点击平台保存。";
  const BATCH_SAVE_AUTH_MISSING_MESSAGE = "未获取到平台保存请求的访问凭据，已停止批量写回。";
  const BATCH_SAVE_STALE_MESSAGE = "当前音频或条目已变化，已停止批量写回，请刷新后重试。";
  const BATCH_SAVE_MISMATCH_MESSAGE = "当前页面分段状态已变化，已停止批量写回，请刷新后重试。";
  const BATCH_SAVE_EMPTY_MESSAGE = "当前没有可写回的批量识别结果。";
  const DIALECT_TAG_MAP = {
    "#um": "#um",
    "#hmm": "#hmm",
    "#ah": "#ah",
    "#eh": "#eh",
    "<spk/>": "<SPK/>",
    "<nps/>": "<NPS/>",
  };
  const DIALECT_TAG_MATCHER = /#(?:um|hmm|ah|eh)|<(?:SPK\/|NPS\/)>/gi;
  const STRUCTURED_TAG_FIELD_RESYNC_DELAYS_MS = [0, 30, 90];
  let dialectTagSerial = 0;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizePath(value) {
    const text = normalizeText(value);
    if (!text) {
      return "";
    }
    try {
      const parsed = /^https?:\/\//i.test(text) ? new URL(text) : null;
      return normalizeText(parsed ? parsed.pathname : text).replace(/^\//, "");
    } catch (error) {
      return text.replace(/^\//, "");
    }
  }

  function getFileName(value) {
    const path = normalizePath(value).split("?")[0];
    return normalizeText(path.split("/").pop());
  }

  function isHttpUrl(value) {
    return /^https?:\/\//i.test(normalizeText(value));
  }

  function isAudioUrl(value) {
    const text = normalizeText(value);
    if (!isHttpUrl(text)) {
      return false;
    }
    try {
      return /\.(mp3|wav|m4a|aac|ogg)$/i.test(new URL(text).pathname);
    } catch (error) {
      return /\.(mp3|wav|m4a|aac|ogg)(?:$|\?)/i.test(text);
    }
  }

  function isUrlForEntry(value, entry) {
    const urlPath = normalizePath(value);
    const relativePath = normalizePath(entry?.content);
    const fileName = normalizeText(entry?.name) || getFileName(relativePath);
    if (relativePath && urlPath.endsWith(relativePath)) {
      return true;
    }
    if (fileName && getFileName(urlPath) === fileName) {
      return true;
    }
    return false;
  }

  function bindFetch(fetchImpl, owner) {
    if (typeof fetchImpl !== "function") {
      return fetchImpl;
    }
    const receiver = owner || globalThis.window || globalThis;
    if (typeof fetchImpl.bind === "function") {
      return fetchImpl.bind(receiver);
    }
    return function () {
      return fetchImpl.apply(receiver, arguments);
    };
  }

  function getEnvironment(deps) {
    const source = deps && typeof deps === "object" ? deps : {};
    const windowLike = source.window || globalThis.window || globalThis;
    const fetchImpl = source.fetch || windowLike.fetch || globalThis.fetch;
    return {
      document: source.document || globalThis.document,
      fetch: bindFetch(fetchImpl, windowLike),
      HTMLElement: source.HTMLElement || globalThis.HTMLElement,
      HTMLInputElement: source.HTMLInputElement || globalThis.HTMLInputElement,
      HTMLTextAreaElement: source.HTMLTextAreaElement || globalThis.HTMLTextAreaElement,
      location: source.location || globalThis.location || {},
      performance: source.performance || globalThis.performance,
      window: windowLike,
    };
  }

  function isEditorPage(locationLike) {
    const current = locationLike || globalThis.location || {};
    return (
      current.hostname === "cvpc.data-baker.com" &&
      String(current.pathname || "").toLowerCase() === "/app/editor/asr/"
    );
  }

  function parseEditorQuery(locationLike) {
    const current = locationLike || globalThis.location || {};
    const query = new URLSearchParams(current.search || "");
    return {
      projectId: normalizeText(query.get("project_id")),
      taskId: normalizeText(query.get("task_id")),
      processId: normalizeText(query.get("process_id")),
      dataId: normalizeText(query.get("data_id")),
      jobId: normalizeText(query.get("job_id")),
      mode: normalizeText(query.get("mode")),
      next: normalizeText(query.get("next")),
      jobStatus: normalizeText(query.get("job_status")),
      nextJobStatus: normalizeText(query.get("next_job_status")),
      terminal: normalizeText(query.get("terminal")),
    };
  }

  function buildMetaQuery(query) {
    const result = new URLSearchParams();
    Object.keys(query || {}).forEach(function (key) {
      const value = normalizeText(query[key]);
      if (!value) {
        return;
      }
      result.set(
        key === "projectId" ? "project_id"
          : key === "taskId" ? "task_id"
          : key === "processId" ? "process_id"
          : key === "dataId" ? "data_id"
          : key === "jobId" ? "job_id"
          : key,
        value
      );
    });
    return result;
  }

  function normalizeUserMeta(value) {
    const source = value && typeof value === "object" ? value : {};
    return {
      platformUserName: normalizeText(source.name),
      platformUserId: normalizeText(source.user_id),
    };
  }

  function hasUserMeta(value) {
    const meta = normalizeUserMeta(value);
    return Boolean(meta.platformUserName || meta.platformUserId);
  }

  async function fetchJson(pathname, query, fetchImpl, requestOptions) {
    const params = query instanceof URLSearchParams ? query : buildMetaQuery(query);
    const url = pathname + (String(params || "").trim() ? "?" + String(params) : "");
    const request = fetchImpl || globalThis.fetch;
    const options = requestOptions && typeof requestOptions === "object" ? requestOptions : {};
    const response = await request(url, {
      credentials: "include",
      headers: options.headers,
      method: "GET",
    });
    const payload = await response.json().catch(function () {
      return null;
    });
    const code = Number(payload?.code);
    if (!response.ok || !payload || (code !== 0 && code !== 200)) {
      throw new Error("CVPC 读取接口失败：" + pathname);
    }
    return payload.data || {};
  }

  function extractAudioUrlFromMeta(entry) {
    const source = entry && typeof entry === "object" ? entry : {};
    const extra = source.extra && typeof source.extra === "object" ? source.extra : {};
    const candidates = [
      source.content,
      source.audioUrl,
      source.audio_url,
      source.url,
      extra.audioUrl,
      extra.audio_url,
      extra.url,
      extra.resource_url,
    ];
    for (let index = 0; index < candidates.length; index += 1) {
      const text = normalizeText(candidates[index]);
      if (/^https?:\/\//i.test(text)) {
        return text;
      }
    }
    return "";
  }

  function extractAudioDurationMs(ann, entry) {
    const annSource = ann && typeof ann === "object" ? ann : {};
    const entrySource = entry && typeof entry === "object" ? entry : {};
    const candidates = [
      annSource.audio_duration,
      annSource.section_duration,
      annSource.duration,
      annSource.audioDuration,
      entrySource.duration,
      entrySource.audio_duration,
      entrySource.extra?.duration,
      entrySource.extra?.audio_duration,
    ];
    for (let index = 0; index < candidates.length; index += 1) {
      const number = Number(candidates[index]);
      if (Number.isFinite(number) && number > 0) {
        return number > 1000 ? Math.round(number) : Math.round(number * 1000);
      }
    }
    return 0;
  }

  function extractVisibleEntryName(documentLike) {
    const doc = documentLike || globalThis.document;
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return "";
    }
    function isDescendantOf(node, parentNode) {
      let current = node;
      while (current) {
        if (current === parentNode) {
          return true;
        }
        current = current.parentNode || null;
      }
      return false;
    }

    function isInsideAudioList(node, hostNode) {
      if (!node || !hostNode) {
        return false;
      }
      return isDescendantOf(node, hostNode) || isDescendantOf(hostNode, node);
    }

    function resolveAudioListHost() {
      if (typeof doc.querySelector === "function") {
        const searchInput = doc.querySelector('input[placeholder="请输入音频名称"]');
        if (searchInput) {
          return searchInput.parentNode || null;
        }
      }
      const nodes = Array.from(doc.querySelectorAll("body *"));
      const titleNode = nodes.find(function (node) {
        return normalizeText(node.textContent || "") === "音频列表";
      });
      return titleNode ? titleNode.parentNode || null : null;
    }

    const audioListHost = resolveAudioListHost();
    const candidates = Array.from(doc.querySelectorAll("body *"))
      .map(function (node) {
        return {
          node: node,
          text: normalizeText(node.textContent || ""),
        };
      })
      .filter(function (item) {
        return /\.mp3$/i.test(item.text);
      });
    const preferred = candidates.find(function (item) {
      return !audioListHost || !isInsideAudioList(item.node, audioListHost);
    });
    return preferred?.text || candidates[0]?.text || "";
  }

  function parseSelectedRangeFromText(text) {
    const source = String(text || "").replace(/\s+/g, " ").trim();
    if (!source) {
      return null;
    }
    const startMatch = source.match(/开始：\s*(\d+(?:\.\d+)?)\s*秒/i);
    const endMatch = source.match(/结束：\s*(\d+(?:\.\d+)?)\s*秒/i);
    if (!startMatch || !endMatch) {
      return null;
    }
    const startMs = Math.max(0, Math.round(Number(startMatch[1]) * 1000));
    const endMs = Math.max(startMs, Math.round(Number(endMatch[1]) * 1000));
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return null;
    }
    return {
      startMs,
      endMs,
      durationMs: Math.max(0, endMs - startMs),
    };
  }

  function extractSelectedRange(documentLike) {
    const doc = documentLike || globalThis.document;
    if (!doc || typeof doc.querySelector !== "function") {
      return null;
    }
    const node = doc.querySelector(".xaudio_time");
    return parseSelectedRangeFromText(node?.textContent || node?.innerText || "");
  }

  function buildSelectionKey(entryName, selectedRange) {
    const name = normalizeText(entryName);
    const range = selectedRange && typeof selectedRange === "object" ? selectedRange : null;
    if (!name || !range || !Number.isFinite(range.startMs) || !Number.isFinite(range.endMs)) {
      return "";
    }
    return name + "|" + String(range.startMs) + "|" + String(range.endMs);
  }

  function getLiveSelectionSnapshot(documentLike) {
    const entryName = extractVisibleEntryName(documentLike);
    const selectedRange = extractSelectedRange(documentLike);
    const currentSegmentNumber = extractCurrentSegmentNumber(documentLike);
    return {
      selectedEntryName: entryName,
      selectedRange,
      currentSegmentNumber,
      selectionKey: buildSelectionKey(entryName, selectedRange),
    };
  }

  function getSelectedEntry(meta, documentLike) {
    const entries = Array.isArray(meta?.datas) ? meta.datas : [];
    const visibleName = extractVisibleEntryName(documentLike);
    if (visibleName) {
      const matched = entries.find(function (entry) {
        return normalizeText(entry?.name) === visibleName;
      });
      if (matched) {
        return matched;
      }
    }
    return entries[0] || null;
  }

  function getCurrentAnn(meta, selectedEntry) {
    const anns = Array.isArray(meta?.anns) ? meta.anns : [];
    const entryId = String(selectedEntry?.entry_id || "");
    const entryIndex = String(selectedEntry?.entry_index || "");
    return (
      anns.find(function (item) {
        return (
          String(item?.entry_id || "") === entryId ||
          String(item?.entry_index || "") === entryIndex
        );
      }) ||
      anns[0] ||
      null
    );
  }

  function normalizeSegmentItem(item, index) {
    const source = item && typeof item === "object" ? item : {};
    const startMs = Math.max(
      0,
      Math.round(
        Number(
          source.startMs ??
            source.start ??
            source.begin ??
            source.from ??
            source.offset ??
            0
        ) || 0
      )
    );
    const endMs = Math.max(
      startMs,
      Math.round(
        Number(
          source.endMs ??
            source.end ??
            source.finish ??
            source.to ??
            source.offset_end ??
            source.offsetEnd ??
            startMs
        ) || startMs
      )
    );
    return {
      index,
      uniqueId: normalizeText(source.uniqueId || source.unique_id || source.id),
      sourceSegmentNumber: Math.max(
        1,
        Math.round(
          Number(
            source.sourceSegmentNumber ??
              source.segmentNumber ??
              source.order ??
              source.index ??
              index + 1
          ) || index + 1
        )
      ),
      startMs,
      endMs,
      raw: source,
    };
  }

  function extractSegmentsFromAnnData(annData) {
    const source = annData && typeof annData === "object" ? annData : {};
    const keys = ["moments", "segments", "sections", "ranges", "items", "result"];
    for (let index = 0; index < keys.length; index += 1) {
      const value = source[keys[index]];
      if (Array.isArray(value)) {
        return value.map(normalizeSegmentItem).filter(function (item) {
          return item.endMs > item.startMs;
        });
      }
    }
    return [];
  }

  function normalizeBoundaryToMs(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return NaN;
    }
    return Math.abs(number) > 1000 ? Math.round(number) : Math.round(number * 1000);
  }

  function extractSegmentsFromAnnos(annos) {
    return (Array.isArray(annos) ? annos : [])
      .filter(function (row) {
        return normalizeText(row?.ann_scope) === "instance";
      })
      .map(function (row, index) {
        const startMs = normalizeBoundaryToMs(
          row?.start_second ?? row?.startSecond ?? row?.start_ms ?? row?.startMs
        );
        const endMs = normalizeBoundaryToMs(
          row?.end_second ?? row?.endSecond ?? row?.end_ms ?? row?.endMs
        );
        return {
          index,
          uniqueId: normalizeText(row?.unique_id || row?.uniqueId || row?.id),
          sourceSegmentNumber: index + 1,
          startMs,
          endMs,
          raw: row,
        };
      })
      .filter(function (item) {
        return Number.isFinite(item.startMs) && Number.isFinite(item.endMs) && item.endMs > item.startMs;
      });
  }

  function clonePlainData(value) {
    if (value === null || value === undefined) {
      return value;
    }
    return JSON.parse(JSON.stringify(value));
  }

  function toSecondsFromMs(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return null;
    }
    return number / 1000;
  }

  function readFirstAttrValue(attr) {
    const source = attr && typeof attr === "object" ? attr : {};
    if (Object.prototype.hasOwnProperty.call(source, "value")) {
      return source.value;
    }
    const values = Array.isArray(source.values) ? source.values : [];
    if (values.length === 0) {
      return undefined;
    }
    const firstValue = values[0];
    if (firstValue && typeof firstValue === "object") {
      if (Object.prototype.hasOwnProperty.call(firstValue, "unique_id")) {
        return firstValue.unique_id;
      }
      if (Object.prototype.hasOwnProperty.call(firstValue, "value")) {
        return firstValue.value;
      }
      if (Object.prototype.hasOwnProperty.call(firstValue, "name")) {
        return firstValue.name;
      }
      return "";
    }
    return firstValue;
  }

  function normalizeTemplateAttrDefinitions(templateAttrs, rowAttrs) {
    const seen = new Set();
    const result = [];
    function appendAttr(attr) {
      const source = attr && typeof attr === "object" ? attr : {};
      const uniqueId = normalizeText(source.unique_id || source.id);
      if (!uniqueId || seen.has(uniqueId)) {
        return;
      }
      seen.add(uniqueId);
      result.push({
        uniqueId,
        name: normalizeText(source.name),
        inputType: normalizeText(source.input_type || source.inputType).toLowerCase(),
      });
    }
    (Array.isArray(templateAttrs) ? templateAttrs : []).forEach(appendAttr);
    (Array.isArray(rowAttrs) ? rowAttrs : []).forEach(appendAttr);
    return result;
  }

  function buildSnapshotAttrs(templateAttrs, rowAttrs) {
    const definitions = normalizeTemplateAttrDefinitions(templateAttrs, rowAttrs);
    const rowMap = new Map();
    (Array.isArray(rowAttrs) ? rowAttrs : []).forEach(function (attr) {
      const uniqueId = normalizeText(attr?.unique_id || attr?.id);
      if (!uniqueId) {
        return;
      }
      rowMap.set(uniqueId, readFirstAttrValue(attr));
    });
    return definitions.map(function (definition) {
      const attr = {
        unique_id: definition.uniqueId,
      };
      if (rowMap.has(definition.uniqueId)) {
        const rawValue = rowMap.get(definition.uniqueId);
        if (rawValue !== undefined && rawValue !== null && String(rawValue) !== "") {
          attr.value = String(rawValue);
          return attr;
        }
      }
      if (definition.inputType === "text") {
        attr.value = "";
      }
      return attr;
    });
  }

  function isTextAttr(attr) {
    const source = attr && typeof attr === "object" ? attr : {};
    return normalizeText(source.input_type || source.inputType).toLowerCase() === "text";
  }

  function stripTextAttrs(attrs) {
    return (Array.isArray(attrs) ? attrs : []).filter(function (attr) {
      return !isTextAttr(attr);
    });
  }

  function buildPlatformRequestHeaders(authSnapshot, context, extraHeaders) {
    const source = authSnapshot && typeof authSnapshot === "object" ? authSnapshot : {};
    const extras = extraHeaders && typeof extraHeaders === "object" ? extraHeaders : {};
    const headers = Object.assign(
      {
        accept: "application/json, text/plain, */*",
      },
      extras
    );
    const authorization = normalizeText(source.authorization);
    const bakerTerminal = normalizeText(source.bakerTerminal || context?.query?.terminal);
    const bakerLang = normalizeText(source.bakerLang) || "zh";
    if (authorization) {
      headers.authorization = authorization;
    }
    if (bakerTerminal) {
      headers["baker-terminal"] = bakerTerminal;
    }
    if (bakerLang) {
      headers["baker-lang"] = bakerLang;
    }
    return headers;
  }

  function buildSnapshotEntryRow(entryRow, template) {
    const source = entryRow && typeof entryRow === "object" ? entryRow : {};
    const entryAttrs = Array.isArray(template?.entry_attrs) ? template.entry_attrs : [];
    const annData = source.ann_data && typeof source.ann_data === "object" ? source.ann_data : {};
    const result = {
      unique_id: normalizeText(source.unique_id || source.uniqueId || source.id),
      entry_index: source.entry_index,
      entry_id: source.entry_id,
      ann_data: {
        attrs: buildSnapshotAttrs(entryAttrs, annData.attrs),
        attr_version: normalizeText(annData.attr_version) || "v1",
      },
    };
    const traceId = normalizeText(source.trace_id || source.traceId);
    if (traceId) {
      result.trace_id = traceId;
    }
    return result;
  }

  function buildSnapshotInstanceRow(row, template) {
    const source = row && typeof row === "object" ? row : {};
    const annData = source.ann_data && typeof source.ann_data === "object" ? source.ann_data : {};
    return {
      unique_id: normalizeText(source.unique_id || source.uniqueId || source.id),
      start_second: source.start_second,
      end_second: source.end_second,
      ann_data: {
        attrs: buildSnapshotAttrs(template?.moment_attrs, annData.attrs),
        attr_version: normalizeText(annData.attr_version) || "v1",
      },
    };
  }

  function buildEntrySaveRow(entryRow, proposedSegments) {
    const source = clonePlainData(entryRow) || {};
    const totalDurationSeconds = (Array.isArray(proposedSegments) ? proposedSegments : []).reduce(function (
      total,
      segment
    ) {
      return total + Math.max(0, Number(segment?.end_second || 0) - Number(segment?.start_second || 0));
    }, 0);
    source.section_duration = totalDurationSeconds;
    source.is_update_position = 0;
    source.is_update_labelattr = 0;
    return source;
  }

  function buildUpdatedInstanceRow(row, segment) {
    const source = clonePlainData(row) || {};
    source.start_second = segment.start_second;
    source.end_second = segment.end_second;
    source.is_update_position =
      Math.abs(Number(row?.start_second || 0) - Number(segment.start_second || 0)) > 0.000001 ||
      Math.abs(Number(row?.end_second || 0) - Number(segment.end_second || 0)) > 0.000001
        ? 1
        : Number(row?.is_update_position || 0) || 0;
    source.is_update_labelattr = Number(row?.is_update_labelattr || 0) || 0;
    return source;
  }

  function createGeneratedUniqueId() {
    return createGeneratedUniqueIdWithSet(new Set());
  }

  function createGeneratedUniqueIdWithSet(reservedUniqueIds) {
    const reserved = reservedUniqueIds instanceof Set ? reservedUniqueIds : new Set();
    const cryptoApi =
      globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function"
        ? globalThis.crypto
        : null;

    function buildCandidate() {
      const bytes = new Uint8Array(16);
      if (cryptoApi) {
        cryptoApi.getRandomValues(bytes);
      } else {
        for (let index = 0; index < bytes.length; index += 1) {
          bytes[index] = Math.floor(Math.random() * 256);
        }
      }
      const hex = Array.from(bytes, function (value) {
        return value.toString(16).padStart(2, "0");
      }).join("");
      return (
        hex.slice(0, 8) +
        "-" +
        hex.slice(8, 12) +
        "-" +
        hex.slice(12, 16) +
        "-" +
        hex.slice(16, 20) +
        "-" +
        hex.slice(20, 32) +
        "-" +
        String(Date.now())
      );
    }

    for (let attempt = 0; attempt < 64; attempt += 1) {
      const nextUniqueId = buildCandidate();
      if (!reserved.has(nextUniqueId)) {
        reserved.add(nextUniqueId);
        return nextUniqueId;
      }
    }
    throw new Error(PREVIEW_DUPLICATE_UNIQUE_ID_MESSAGE);
  }

  function createGeneratedCameraName() {
    return Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  }

  function buildInsertedInstanceRow(sourceRow, context, segment, reservedUniqueIds) {
    const prototypeRow = clonePlainData(sourceRow) || {};
    const annData = prototypeRow.ann_data && typeof prototypeRow.ann_data === "object"
      ? prototypeRow.ann_data
      : {};
    return {
      ann_data: Object.assign({}, annData, {
        attrs: stripTextAttrs(annData.attrs),
      }),
      asr_is_done: prototypeRow.asr_is_done ?? 1,
      end_second: segment.end_second,
      shape: normalizeText(prototypeRow.shape) || "section",
      start_second: segment.start_second,
      unique_id: createGeneratedUniqueIdWithSet(reservedUniqueIds),
      track_id: normalizeText(prototypeRow.track_id) || "-1",
      camera_name: normalizeText(prototypeRow.camera_name) || createGeneratedCameraName(),
      entry_id: prototypeRow.entry_id ?? context?.selectedEntry?.entry_id ?? context?.currentAnn?.entry_id ?? null,
      entry_index:
        prototypeRow.entry_index ?? context?.selectedEntry?.entry_index ?? context?.currentAnn?.entry_index ?? 1,
      ann_scope: "instance",
      source: normalizeText(prototypeRow.source) || "manual",
    };
  }

  function getEntryRowFromAnnos(annos, context) {
    const entryRow = (Array.isArray(annos) ? annos : []).find(function (row) {
      return normalizeText(row?.ann_scope) === "entry";
    });
    if (entryRow) {
      return entryRow;
    }
    const currentAnn = context?.currentAnn && typeof context.currentAnn === "object" ? context.currentAnn : {};
    return {
      entry_index: context?.selectedEntry?.entry_index ?? currentAnn.entry_index ?? 1,
      entry_id: context?.selectedEntry?.entry_id ?? currentAnn.entry_id ?? 0,
      unique_id: normalizeText(currentAnn.unique_id || currentAnn.uniqueId),
      ann_scope: "entry",
      ann_data: clonePlainData(currentAnn.ann_data) || { attrs: [] },
      source: normalizeText(currentAnn.source) || "manual",
      status: normalizeText(currentAnn.status) || "valid",
      version: normalizeText(currentAnn.version),
      track_id: currentAnn.track_id ?? null,
      shape: currentAnn.shape ?? null,
      camera_name: currentAnn.camera_name ?? null,
      audio_duration: currentAnn.audio_duration ?? toSecondsFromMs(context?.audioDurationMs),
      section_duration: 0,
      entry_status: currentAnn.entry_status ?? null,
      entry_done: currentAnn.entry_done ?? null,
      start_second: null,
      end_second: null,
      asr_is_done: null,
      is_update_position: 0,
      is_update_labelattr: 0,
    };
  }

  function getInstanceRowsFromAnnos(annos) {
    return (Array.isArray(annos) ? annos : [])
      .filter(function (row) {
        return normalizeText(row?.ann_scope) === "instance";
      })
      .map(function (row) {
        return Object.assign({}, row, {
          start_second: Number(row?.start_second ?? 0) || 0,
          end_second: Number(row?.end_second ?? row?.start_second ?? 0) || 0,
        });
      })
      .sort(function (left, right) {
        return (
          Number(left?.start_second || 0) - Number(right?.start_second || 0) ||
          Number(left?.end_second || 0) - Number(right?.end_second || 0)
        );
      });
  }

  function buildSavePlan(currentRows, proposedSegments, context, reservedUniqueIds) {
    const rows = Array.isArray(currentRows) ? currentRows : [];
    const reserved = reservedUniqueIds instanceof Set ? new Set(reservedUniqueIds) : new Set();
    const segments = (Array.isArray(proposedSegments) ? proposedSegments : [])
      .map(function (segment, index) {
        const normalized = normalizeSegmentItem(segment, index);
        return {
          startMs: normalized.startMs,
          endMs: normalized.endMs,
          start_second: toSecondsFromMs(normalized.startMs),
          end_second: toSecondsFromMs(normalized.endMs),
        };
      })
      .filter(function (segment) {
        return Number.isFinite(segment.start_second) && Number.isFinite(segment.end_second) && segment.end_second > segment.start_second;
      })
      .sort(function (left, right) {
        return left.startMs - right.startMs;
      });
    const matchesByRow = rows.map(function () {
      return [];
    });
    const insertsBeforeRow = rows.map(function () {
      return [];
    });
    const insertsAfterAll = [];

    segments.forEach(function (segment, segmentIndex) {
      let bestRowIndex = -1;
      let bestOverlapMs = 0;
      rows.forEach(function (row, rowIndex) {
        const rowStartMs = normalizeBoundaryToMs(row?.start_second);
        const rowEndMs = normalizeBoundaryToMs(row?.end_second);
        if (!Number.isFinite(rowStartMs) || !Number.isFinite(rowEndMs) || rowEndMs <= rowStartMs) {
          return;
        }
        const overlapMs = Math.max(0, Math.min(rowEndMs, segment.endMs) - Math.max(rowStartMs, segment.startMs));
        if (overlapMs > bestOverlapMs) {
          bestOverlapMs = overlapMs;
          bestRowIndex = rowIndex;
        }
      });
      if (bestRowIndex >= 0 && bestOverlapMs > 0) {
        matchesByRow[bestRowIndex].push(Object.assign({ index: segmentIndex }, segment));
        return;
      }
      const insertionIndex = rows.findIndex(function (row) {
        return normalizeBoundaryToMs(row?.start_second) > segment.startMs;
      });
      if (insertionIndex >= 0) {
        insertsBeforeRow[insertionIndex].push(Object.assign({ index: segmentIndex }, segment));
        return;
      }
      insertsAfterAll.push(Object.assign({ index: segmentIndex }, segment));
    });

    const updateRows = [];
    const insertRows = [];
    const deleteRows = [];
    const finalRows = [];

    function emitInsertedSegment(segment, sourceRow) {
      const insertedRow = buildInsertedInstanceRow(sourceRow, context, segment, reserved);
      insertRows.push(insertedRow);
      finalRows.push(insertedRow);
    }

    rows.forEach(function (row, rowIndex) {
      insertsBeforeRow[rowIndex]
        .sort(function (left, right) {
          return left.startMs - right.startMs;
        })
        .forEach(function (segment) {
          emitInsertedSegment(segment, row);
        });

      const matchedSegments = matchesByRow[rowIndex]
        .slice()
        .sort(function (left, right) {
          return left.startMs - right.startMs;
        });
      if (matchedSegments.length === 0) {
        deleteRows.push(clonePlainData(row));
        return;
      }
      const updatedRow = buildUpdatedInstanceRow(row, matchedSegments[0]);
      updateRows.push(updatedRow);
      finalRows.push(updatedRow);
      matchedSegments.slice(1).forEach(function (segment) {
        emitInsertedSegment(segment, row);
      });
    });

    insertsAfterAll
      .slice()
      .sort(function (left, right) {
        return left.startMs - right.startMs;
      })
      .forEach(function (segment) {
        emitInsertedSegment(segment, rows[rows.length - 1] || null);
      });

    return {
      updateRows,
      insertRows,
      deleteRows,
      finalRows,
    };
  }

  function collectReservedUniqueIds(rows) {
    const result = new Set();
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      const uniqueId = normalizeText(row?.unique_id || row?.uniqueId || row?.id);
      if (uniqueId) {
        result.add(uniqueId);
      }
    });
    return result;
  }

  function isDuplicateUniqueIdMessage(message) {
    return normalizeText(message).replace(/\s+/g, "").indexOf("unique_id重复") >= 0;
  }

  function findDuplicateUniqueIdInSavePayload(body) {
    const payload = body && typeof body === "object" ? body : {};
    const operationSeen = new Set();
    const snapshotSeen = new Set();

    function visitRows(rows, seenSet) {
      const source = Array.isArray(rows) ? rows : [];
      for (let index = 0; index < source.length; index += 1) {
        const uniqueId = normalizeText(source[index]?.unique_id || source[index]?.uniqueId || source[index]?.id);
        if (!uniqueId) {
          continue;
        }
        if (seenSet.has(uniqueId)) {
          return uniqueId;
        }
        seenSet.add(uniqueId);
      }
      return "";
    }

    const duplicated =
      visitRows(payload.insert, operationSeen) ||
      visitRows(payload.update, operationSeen) ||
      visitRows(payload.delete, operationSeen);
    if (duplicated) {
      return duplicated;
    }
    let webSnapshotRows = [];
    if (typeof payload.web_snapshot === "string") {
      try {
        webSnapshotRows = JSON.parse(payload.web_snapshot);
      } catch (_error) {
        webSnapshotRows = [];
      }
    } else if (Array.isArray(payload.web_snapshot)) {
      webSnapshotRows = payload.web_snapshot;
    }
    return visitRows(webSnapshotRows, snapshotSeen);
  }

  function buildSaveIncrementBody(context, annos, preview) {
    const source = preview && typeof preview === "object" ? preview : {};
    const proposedSegments = Array.isArray(source.proposedSegments) ? source.proposedSegments : [];
    if (proposedSegments.length === 0) {
      return null;
    }
    const entryRow = getEntryRowFromAnnos(annos, context);
    const currentRows = getInstanceRowsFromAnnos(annos);
    const plan = buildSavePlan(
      currentRows,
      proposedSegments,
      context,
      collectReservedUniqueIds(annos)
    );
    const updatedEntryRow = buildEntrySaveRow(entryRow, plan.finalRows);
    const webSnapshot = plan.finalRows.map(function (row) {
      return buildSnapshotInstanceRow(row, context?.template || {});
    });
    webSnapshot.push(buildSnapshotEntryRow(updatedEntryRow, context?.template || {}));
    const body = {
      project_id: String(context?.query?.projectId || ""),
      task_id: String(context?.query?.taskId || ""),
      process_id: String(context?.query?.processId || ""),
      job_id: String(context?.query?.jobId || ""),
      data_id: String(context?.query?.dataId || ""),
      insert: plan.insertRows,
      update: plan.updateRows.concat([updatedEntryRow]),
      delete: plan.deleteRows,
      web_snapshot: JSON.stringify(webSnapshot),
    };
    if (findDuplicateUniqueIdInSavePayload(body)) {
      throw new Error(PREVIEW_DUPLICATE_UNIQUE_ID_MESSAGE);
    }
    return body;
  }

  function findMomentAttrDescriptor(template, rowAttrs, labelMatchers) {
    const matchers = Array.isArray(labelMatchers) ? labelMatchers.map(normalizeText).filter(Boolean) : [];
    if (matchers.length === 0) {
      return null;
    }
    const definitions = normalizeTemplateAttrDefinitions(template?.moment_attrs, rowAttrs);
    return (
      definitions.find(function (definition) {
        const name = normalizeText(definition.name);
        return matchers.some(function (matcher) {
          return name.indexOf(matcher) >= 0;
        });
      }) || null
    );
  }

  function findRowAttrByUniqueId(rowAttrs, uniqueId) {
    const targetId = normalizeText(uniqueId);
    return (Array.isArray(rowAttrs) ? rowAttrs : []).find(function (attr) {
      return normalizeText(attr?.unique_id || attr?.id) === targetId;
    }) || null;
  }

  function decodeStructuredTextValue(value) {
    const text = String(value || "");
    if (!text) {
      return "";
    }
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        return text;
      }
      const joined = parsed
        .map(function (item) {
          if (item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "content")) {
            return String(item.content || "");
          }
          return "";
        })
        .join("");
      return joined || text;
    } catch (_error) {
      return text;
    }
  }

  function parseStructuredTextItems(value) {
    const text = String(value || "");
    if (!text) {
      return [];
    }
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map(function (item) {
          const source = item && typeof item === "object" ? item : {};
          const type = normalizeText(source.type).toLowerCase();
          const content = String(source.content || "");
          if (type === "single") {
            const normalizedTag = normalizeDialectTag(content);
            if (!normalizedTag) {
              return null;
            }
            return {
              type: "single",
              id: normalizeText(source.id) || nextDialectTagId(),
              content: normalizedTag,
            };
          }
          if (type === "text") {
            return {
              type: "text",
              content: content,
            };
          }
          return null;
        })
        .filter(Boolean);
    } catch (_error) {
      return [];
    }
  }

  function normalizeDialectTag(value) {
    const text = normalizeText(value);
    return DIALECT_TAG_MAP[text] || DIALECT_TAG_MAP[text.toLowerCase()] || "";
  }

  function pushDialectTextToken(target, content) {
    const text = String(content || "");
    if (!text) {
      return;
    }
    const list = Array.isArray(target) ? target : [];
    const previous = list[list.length - 1];
    if (previous && previous.type === "text") {
      previous.content = String(previous.content || "") + text;
      return;
    }
    list.push({
      type: "text",
      content: text,
    });
  }

  function normalizeDialectTokenItem(item) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const type = normalizeText(item.type).toLowerCase();
    const content = String(item.content || "");
    const normalizedTag = normalizeDialectTag(content);
    if ((type === "tag" || type === "single") && normalizedTag) {
      return {
        type: "tag",
        content: normalizedTag,
      };
    }
    if (type === "text") {
      return {
        type: "text",
        content: content,
      };
    }
    if (normalizedTag) {
      return {
        type: "tag",
        content: normalizedTag,
      };
    }
    if (content) {
      return {
        type: "text",
        content: content,
      };
    }
    return null;
  }

  function compactDialectTokens(tokens) {
    const result = [];
    (Array.isArray(tokens) ? tokens : []).forEach(function (item) {
      const normalized = normalizeDialectTokenItem(item);
      if (!normalized) {
        return;
      }
      if (normalized.type === "tag") {
        result.push(normalized);
        return;
      }
      pushDialectTextToken(result, normalized.content);
    });
    return result;
  }

  function joinDialectTokens(tokens) {
    return compactDialectTokens(tokens)
      .map(function (item) {
        return String(item.content || "");
      })
      .join("");
  }

  function parseDialectTokensFromInlineText(text) {
    const source = String(text || "");
    if (!source) {
      return [];
    }
    const result = [];
    let cursor = 0;
    let matched;
    DIALECT_TAG_MATCHER.lastIndex = 0;
    while ((matched = DIALECT_TAG_MATCHER.exec(source))) {
      if (matched.index > cursor) {
        pushDialectTextToken(result, source.slice(cursor, matched.index));
      }
      result.push({
        type: "tag",
        content: normalizeDialectTag(matched[0]),
      });
      cursor = matched.index + matched[0].length;
    }
    if (cursor < source.length) {
      pushDialectTextToken(result, source.slice(cursor));
    }
    return compactDialectTokens(result);
  }

  function normalizeDialectTokensInput(tokens, fallbackText) {
    const normalized = compactDialectTokens(tokens);
    if (normalized.length > 0) {
      return normalized;
    }
    return parseDialectTokensFromInlineText(fallbackText);
  }

  function nextDialectTagId() {
    dialectTagSerial += 1;
    return "asc-lz-tag-" + String(Date.now()) + "-" + String(dialectTagSerial);
  }

  function buildDialectStructuredItems(value) {
    const tokens = Array.isArray(value)
      ? normalizeDialectTokensInput(value, "")
      : normalizeDialectTokensInput([], value);
    if (tokens.length <= 0) {
      return [
        {
          type: "text",
          content: String(Array.isArray(value) ? "" : value || ""),
        },
      ];
    }
    return tokens.map(function (token) {
      if (token.type === "tag") {
        return {
          type: "single",
          id: nextDialectTagId(),
          content: token.content,
        };
      }
      return {
        type: "text",
        content: String(token.content || ""),
      };
    });
  }

  function buildDialectStructuredValue(value) {
    return JSON.stringify(buildDialectStructuredItems(value));
  }

  function buildDialectEditorHtml(value) {
    const items =
      Array.isArray(value) &&
      value.every(function (item) {
        const type = normalizeText(item?.type).toLowerCase();
        return type === "text" || type === "single";
      })
        ? value
        : buildDialectStructuredItems(value);
    const contentHtml = items
      .map(function (item) {
        if (String(item.type || "") !== "single") {
          return escapeHtml(item.content);
        }
        const tagId = escapeHtml(item.id || nextDialectTagId());
        const tagLabel = escapeHtml(item.content);
        return (
          '<span data-tag-id="' +
          tagId +
          '" data-tag-label="' +
          tagLabel +
          '" data-type="single" class="tiptap-tag biaoqian_tag single-tag tiptap-tag biaoqian_tag tag-uuid-' +
          tagId +
          ' tag-uuid-' +
          tagId +
          '" contenteditable="false" style="background-color: rgb(254, 240, 215); color: white;">' +
          '<span class="tag-display" style="pointer-events: none;">' +
          tagLabel +
          '</span><span class="tag-close biaoqian_tag_x" data-tag-close="true">×</span></span>'
        );
      })
      .join("");
    if (!contentHtml) {
      return '<p><br class="ProseMirror-trailingBreak"></p>';
    }
    return (
      "<p>" +
      contentHtml +
      '<img class="ProseMirror-separator" alt=""><br class="ProseMirror-trailingBreak"></p>'
    );
  }

  function findStructuredTextareaHost(field, env) {
    if (!isElementNode(field, env)) {
      return null;
    }
    if (normalizeText(field.className || "").split(/\s+/).indexOf("textarea_class") >= 0) {
      return field;
    }
    if (typeof field.closest === "function") {
      const matched = field.closest(".textarea_class");
      if (isElementNode(matched, env)) {
        return matched;
      }
    }
    return isElementNode(field.parentNode, env) ? field.parentNode : null;
  }

  function hasStructuredTagItems(items) {
    return (Array.isArray(items) ? items : []).some(function (item) {
      return normalizeText(item?.type).toLowerCase() === "single";
    });
  }

  function isStructuredEditorViewMissingTags(field, structuredItems) {
    if (!hasStructuredTagItems(structuredItems)) {
      return false;
    }
    const html = String(field?.innerHTML || "");
    const plainText = normalizeText(field?.textContent || field?.innerText || "");
    if (!html) {
      return true;
    }
    if (html.indexOf("data-tag-id=") >= 0) {
      return false;
    }
    return !plainText || html === '<p><br class="ProseMirror-trailingBreak"></p>';
  }

  function renderStructuredTagEditor(field, structuredItems) {
    if (!field) {
      return;
    }
    field.innerHTML = buildDialectEditorHtml(structuredItems);
  }

  function scheduleStructuredTagFieldResync(field, structuredHost, structuredItems, env) {
    if (
      !isContentEditableNode(field, env) ||
      !isElementNode(structuredHost, env) ||
      !hasStructuredTagItems(structuredItems)
    ) {
      return;
    }
    STRUCTURED_TAG_FIELD_RESYNC_DELAYS_MS.forEach(function (delayMs) {
      setTimeout(function () {
        if (!isContentEditableNode(field, env) || !isElementNode(structuredHost, env)) {
          return;
        }
        const currentItems = parseStructuredTextItems(structuredHost.getAttribute("modelvalue"));
        const nextItems = currentItems.length > 0 ? currentItems : structuredItems;
        if (!isStructuredEditorViewMissingTags(field, nextItems)) {
          return;
        }
        renderStructuredTagEditor(field, nextItems);
      }, delayMs);
    });
  }

  function extractBatchSegmentTexts(row, template) {
    const currentRow = row && typeof row === "object" ? row : {};
    const annData = currentRow.ann_data && typeof currentRow.ann_data === "object" ? currentRow.ann_data : {};
    const rowAttrs = Array.isArray(annData.attrs) ? annData.attrs : [];
    const dialectDescriptor = findMomentAttrDescriptor(template, rowAttrs, ["标注文本", "柳州话", "转写文本"]);
    const mandarinDescriptor = findMomentAttrDescriptor(template, rowAttrs, ["普通话顺滑", "普通话", "顺滑"]);
    const dialectAttr = dialectDescriptor ? findRowAttrByUniqueId(rowAttrs, dialectDescriptor.uniqueId) : null;
    const mandarinAttr = mandarinDescriptor ? findRowAttrByUniqueId(rowAttrs, mandarinDescriptor.uniqueId) : null;
    return {
      dialectDescriptor,
      mandarinDescriptor,
      dialectText: decodeStructuredTextValue(readFirstAttrValue(dialectAttr)),
      mandarinText: String(readFirstAttrValue(mandarinAttr) || ""),
    };
  }

  function resolveBatchTextDescriptors(template, rows, preferredRow) {
    const rowQueue = [];
    if (preferredRow && typeof preferredRow === "object") {
      rowQueue.push(preferredRow);
    }
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      if (!row || row === preferredRow) {
        return;
      }
      rowQueue.push(row);
    });

    let dialectDescriptor = findMomentAttrDescriptor(template, [], ["标注文本", "柳州话", "转写文本"]);
    let mandarinDescriptor = findMomentAttrDescriptor(template, [], ["普通话顺滑", "普通话", "顺滑"]);
    if (dialectDescriptor && mandarinDescriptor) {
      return {
        dialectDescriptor,
        mandarinDescriptor,
      };
    }

    for (let index = 0; index < rowQueue.length; index += 1) {
      const currentRow = rowQueue[index] && typeof rowQueue[index] === "object" ? rowQueue[index] : {};
      const annData = currentRow.ann_data && typeof currentRow.ann_data === "object" ? currentRow.ann_data : {};
      const rowAttrs = Array.isArray(annData.attrs) ? annData.attrs : [];
      if (!dialectDescriptor) {
        dialectDescriptor = findMomentAttrDescriptor(template, rowAttrs, ["标注文本", "柳州话", "转写文本"]);
      }
      if (!mandarinDescriptor) {
        mandarinDescriptor = findMomentAttrDescriptor(template, rowAttrs, ["普通话顺滑", "普通话", "顺滑"]);
      }
      if (dialectDescriptor && mandarinDescriptor) {
        break;
      }
    }

    if (!dialectDescriptor) {
      dialectDescriptor = Object.assign({}, FALLBACK_BATCH_TEXT_ATTR_DEFINITIONS.dialectDescriptor);
    }
    if (!mandarinDescriptor) {
      mandarinDescriptor = Object.assign({}, FALLBACK_BATCH_TEXT_ATTR_DEFINITIONS.mandarinDescriptor);
    }

    return {
      dialectDescriptor,
      mandarinDescriptor,
    };
  }

  function ensureTextAttr(rowAttrs, descriptor, value) {
    const attrs = Array.isArray(rowAttrs) ? rowAttrs : [];
    const currentDescriptor = descriptor && typeof descriptor === "object" ? descriptor : null;
    if (!currentDescriptor || !normalizeText(currentDescriptor.uniqueId)) {
      throw new Error("未找到当前段文本字段定义。");
    }
    let attr = findRowAttrByUniqueId(attrs, currentDescriptor.uniqueId);
    if (!attr) {
      attr = {
        unique_id: currentDescriptor.uniqueId,
        name: currentDescriptor.name,
        input_type: "text",
        values: [String(value || "")],
      };
      attrs.push(attr);
      return attrs;
    }
    attr.name = normalizeText(attr.name || currentDescriptor.name);
    attr.input_type = normalizeText(attr.input_type || "text") || "text";
    attr.values = [String(value || "")];
    if (Object.prototype.hasOwnProperty.call(attr, "value")) {
      delete attr.value;
    }
    return attrs;
  }

  function buildUpdatedBatchTextRow(row, template, result, descriptorHints) {
    const sourceRow = clonePlainData(row) || {};
    const annData = sourceRow.ann_data && typeof sourceRow.ann_data === "object" ? sourceRow.ann_data : {};
    const rowAttrs = Array.isArray(annData.attrs) ? annData.attrs.map(clonePlainData) : [];
    const textMeta = extractBatchSegmentTexts(sourceRow, template);
    const descriptorSource = descriptorHints && typeof descriptorHints === "object" ? descriptorHints : {};
    const dialectDescriptor = textMeta.dialectDescriptor || descriptorSource.dialectDescriptor || null;
    const mandarinDescriptor = textMeta.mandarinDescriptor || descriptorSource.mandarinDescriptor || null;
    if (!dialectDescriptor || !mandarinDescriptor) {
      throw new Error("未找到当前段文本字段定义。");
    }
    ensureTextAttr(
      rowAttrs,
      dialectDescriptor,
      buildDialectStructuredValue(
        Array.isArray(result.dialectTokens) && result.dialectTokens.length > 0
          ? result.dialectTokens
          : result.dialectText || ""
      )
    );
    ensureTextAttr(rowAttrs, mandarinDescriptor, String(result.mandarinText || ""));
    sourceRow.ann_data = Object.assign({}, annData, {
      attrs: rowAttrs,
      attr_version: normalizeText(annData.attr_version) || "v1",
    });
    sourceRow.is_update_position = Number(sourceRow.is_update_position || 0) || 0;
    sourceRow.is_update_labelattr = 1;
    return sourceRow;
  }

  function normalizeBatchResultItem(item) {
    const source = item && typeof item === "object" ? item : {};
    const fallbackDialectTokens = normalizeDialectTokensInput(
      source.dialectTokens || source.refinedDialectTokens || source.audioDialectTokens,
      ""
    );
    const dialectText = String(
      source.dialectText ||
        source.refinedDialectText ||
        source.audioDialectText ||
        source.dialect ||
        joinDialectTokens(fallbackDialectTokens)
    );
    return {
      uniqueId: normalizeText(source.uniqueId || source.unique_id),
      segmentNumber: Math.max(0, Math.round(Number(source.segmentNumber || 0)) || 0),
      selectionKey: normalizeText(source.selectionKey),
      dialectText: dialectText,
      dialectTokens: normalizeDialectTokensInput(fallbackDialectTokens, dialectText),
      mandarinText: String(
        source.mandarinText ||
          source.refinedMandarinText ||
          source.audioMandarinText ||
          source.mandarin ||
          ""
      ),
    };
  }

  function parseBatchSelectionKey(selectionKey) {
    const text = normalizeText(selectionKey);
    if (!text) {
      return null;
    }
    const parts = text.split("|");
    if (parts.length < 3) {
      return null;
    }
    const startMs = Math.round(Number(parts[parts.length - 2]) || 0);
    const endMs = Math.round(Number(parts[parts.length - 1]) || 0);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return null;
    }
    return {
      entryName: normalizeText(parts.slice(0, -2).join("|")),
      startMs: startMs,
      endMs: endMs,
    };
  }

  function buildBatchRowRange(row) {
    const startMs = normalizeBoundaryToMs(row?.start_second);
    const endMs = normalizeBoundaryToMs(row?.end_second);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return null;
    }
    return {
      startMs: startMs,
      endMs: endMs,
    };
  }

  function matchBatchResultToRow(resultItem, rows, selectedEntryName, usedIndexes) {
    const source = resultItem && typeof resultItem === "object" ? resultItem : {};
    const candidates = (Array.isArray(rows) ? rows : [])
      .map(function (row, index) {
        return {
          index: index,
          row: row,
          uniqueId: normalizeText(row?.unique_id || row?.uniqueId || row?.id),
          range: buildBatchRowRange(row),
        };
      })
      .filter(function (candidate) {
        return !usedIndexes?.has(candidate.index);
      });
    if (candidates.length <= 0) {
      return null;
    }

    const targetUniqueId = normalizeText(source.uniqueId);
    if (targetUniqueId) {
      const matchedById = candidates.find(function (candidate) {
        return candidate.uniqueId === targetUniqueId;
      });
      if (matchedById) {
        return matchedById;
      }
    }

    const targetRange = parseBatchSelectionKey(source.selectionKey);
    if (targetRange) {
      const matchedByKey = candidates.find(function (candidate) {
        return candidate.range && hasApproxRangeMatch(candidate.range, targetRange, APPLY_TOLERANCE_MS);
      });
      if (matchedByKey) {
        return matchedByKey;
      }
    }

    const targetSegmentNumber = Math.max(0, Math.round(Number(source.segmentNumber || 0)) || 0);
    if (targetSegmentNumber > 0 && targetSegmentNumber <= candidates.length) {
      const matchedByNumber = candidates.find(function (candidate) {
        if (candidate.index !== targetSegmentNumber - 1) {
          return false;
        }
        if (!targetRange || !candidate.range) {
          return true;
        }
        return hasApproxRangeMatch(candidate.range, targetRange, APPLY_TOLERANCE_MS);
      });
      if (matchedByNumber) {
        return matchedByNumber;
      }
    }

    const targetEntryName = normalizeText(selectedEntryName);
    if (targetEntryName && normalizeText(targetRange?.entryName) && normalizeText(targetRange?.entryName) !== targetEntryName) {
      return null;
    }

    return null;
  }

  function parseBatchSelectionSpec(selectionSpec, totalSegments) {
    const total = Math.max(0, Math.round(Number(totalSegments || 0)) || 0);
    if (total <= 0) {
      throw new Error("当前音频没有可批量处理的段落。");
    }
    const text = String(selectionSpec || "").trim();
    if (!text) {
      return Array.from({ length: total }, function (_item, index) {
        return index + 1;
      });
    }
    const numbers = new Set();
    const tokens = text
      .split(",")
      .map(function (item) {
        return String(item || "").trim();
      })
      .filter(Boolean);
    if (tokens.length === 0) {
      throw new Error("批量范围不能为空。");
    }
    tokens.forEach(function (token) {
      const rangeMatch = token.match(/^(\d+)\s*[-~]\s*(\d+)$/);
      if (rangeMatch) {
        const start = Math.round(Number(rangeMatch[1]) || 0);
        const end = Math.round(Number(rangeMatch[2]) || 0);
        if (start <= 0 || end <= 0 || end < start) {
          throw new Error("批量范围格式无效：" + token);
        }
        for (let current = start; current <= end; current += 1) {
          if (current > total) {
            throw new Error("批量范围超出当前音频段数：" + token);
          }
          numbers.add(current);
        }
        return;
      }
      if (/^\d+$/.test(token)) {
        const value = Math.round(Number(token) || 0);
        if (value <= 0 || value > total) {
          throw new Error("批量范围超出当前音频段数：" + token);
        }
        numbers.add(value);
        return;
      }
      throw new Error("批量范围格式无效：" + token);
    });
    const result = Array.from(numbers).sort(function (left, right) {
      return left - right;
    });
    if (result.length <= 0) {
      throw new Error("当前没有命中任何可批量处理的段落。");
    }
    return result;
  }

  function mapTemplateFieldNames(template) {
    const current = template && typeof template === "object" ? template : {};
    const attrs = Array.isArray(current.attrs) ? current.attrs : [];
    const entryAttrs = Array.isArray(current.entry_attrs) ? current.entry_attrs : [];
    const momentAttrs = Array.isArray(current.moment_attrs) ? current.moment_attrs : [];
    return {
      attrs,
      entryAttrs,
      momentAttrs,
    };
  }

  function isElementNode(node, env) {
    return Boolean(node && env && node instanceof env.HTMLElement);
  }

  function isTextInputNode(node, env) {
    return Boolean(
      node &&
        env &&
        (node instanceof env.HTMLInputElement || node instanceof env.HTMLTextAreaElement)
    );
  }

  function isContentEditableNode(node, env) {
    return Boolean(
      isElementNode(node, env) &&
        (String(node.getAttribute?.("contenteditable") || "").toLowerCase() === "true" ||
          String(node.getAttribute?.("role") || "").toLowerCase() === "textbox" ||
          normalizeText(node.className || "").indexOf("ProseMirror") >= 0)
    );
  }

  function createBubbledEvent(type) {
    try {
      return new Event(type, { bubbles: true });
    } catch (error) {
      return { type };
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function findFieldBlock(labelMatchers, env) {
    const doc = env?.document || globalThis.document;
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return null;
    }
    const items = Array.from(
      doc.querySelectorAll(".item-name, .quest-span, .el-only-child__content, .el-form-item, .ant-form-item, label, span")
    );
    for (let index = 0; index < items.length; index += 1) {
      const node = items[index];
      const text = normalizeText(node.textContent || "");
      const matched = labelMatchers.find(function (matcher) {
        return text.indexOf(matcher) >= 0;
      });
      if (!matched) {
        continue;
      }
      let scope = isElementNode(node, env) ? node : null;
      for (let depth = 0; scope && depth < 6; depth += 1) {
        if (
          typeof scope.querySelector === "function" &&
          scope.querySelector(
            "textarea, input[type='text'], input:not([type]), [contenteditable='true'], .tiptap.ProseMirror, [role='textbox'], .el-radio-group, [role='radiogroup']"
          )
        ) {
          return scope;
        }
        scope =
          scope.closest?.(".el-form-item, .ant-form-item, .el-card, .ant-card, .field-block") ||
          (isElementNode(scope.parentNode, env) ? scope.parentNode : null);
      }
    }
    return null;
  }

  function findFieldTarget(labelMatchers, env) {
    const scope = findFieldBlock(labelMatchers, env);
    if (!isElementNode(scope, env) || typeof scope.querySelector !== "function") {
      return null;
    }
    const field = scope.querySelector(
      "textarea, input[type='text'], input:not([type]), [contenteditable='true'], .tiptap.ProseMirror, [role='textbox']"
    );
    if (isTextInputNode(field, env) || isContentEditableNode(field, env)) {
      return field;
    }
    return null;
  }

  function getFieldValue(field, env) {
    if (isTextInputNode(field, env)) {
      return String(field.value || "");
    }
    if (isContentEditableNode(field, env)) {
      const structuredHost = findStructuredTextareaHost(field, env);
      const modelValue = normalizeText(structuredHost?.getAttribute?.("modelvalue"));
      if (modelValue) {
        return decodeStructuredTextValue(modelValue);
      }
      return normalizeText(field.textContent || field.innerText || "");
    }
    return "";
  }

  function setTextFieldValue(field, value, env) {
    if (!isTextInputNode(field, env) && !isContentEditableNode(field, env)) {
      return false;
    }
    const nextValue = String(value || "");
    field.focus();
    if (isTextInputNode(field, env)) {
      field.value = nextValue;
    } else if (isContentEditableNode(field, env)) {
      field.innerHTML = nextValue
        ? "<p>" + escapeHtml(nextValue) + "</p>"
        : '<p><br class="ProseMirror-trailingBreak"></p>';
    }
    field.dispatchEvent(createBubbledEvent("input"));
    field.dispatchEvent(createBubbledEvent("change"));
    field.blur();
    return true;
  }

  function setStructuredTagFieldValue(field, value, env) {
    if (!isTextInputNode(field, env) && !isContentEditableNode(field, env)) {
      return false;
    }
    const tokens = Array.isArray(value)
      ? normalizeDialectTokensInput(value, "")
      : normalizeDialectTokensInput([], value);
    const plainText = Array.isArray(value) ? joinDialectTokens(tokens) : String(value || "");
    if (isTextInputNode(field, env)) {
      return setTextFieldValue(field, plainText, env);
    }
    const structuredItems = buildDialectStructuredItems(tokens.length > 0 ? tokens : plainText);
    const structuredHost = findStructuredTextareaHost(field, env);
    if (structuredHost && typeof structuredHost.setAttribute === "function") {
      structuredHost.setAttribute("modelvalue", JSON.stringify(structuredItems));
    }
    field.focus();
    renderStructuredTagEditor(field, structuredItems);
    field.dispatchEvent(createBubbledEvent("input"));
    field.dispatchEvent(createBubbledEvent("change"));
    field.blur();
    scheduleStructuredTagFieldResync(field, structuredHost, structuredItems, env);
    return true;
  }

  function clickLabelByTexts(labelTexts, env, scope) {
    const root = scope && typeof scope.querySelectorAll === "function"
      ? scope
      : env?.document || globalThis.document;
    if (!root || typeof root.querySelectorAll !== "function") {
      return false;
    }
    const all = Array.from(root.querySelectorAll("label, span, div"));
    const target = all.find(function (node) {
      const text = normalizeText(node.textContent || "");
      return labelTexts.indexOf(text) >= 0;
    });
    if (!(target instanceof env.HTMLElement)) {
      return false;
    }
    target.click();
    return true;
  }

  function isDisabledElement(node) {
    if (!node) {
      return true;
    }
    if (node.disabled === true) {
      return true;
    }
    if (typeof node.getAttribute === "function") {
      const ariaDisabled = normalizeText(node.getAttribute("aria-disabled")).toLowerCase();
      if (ariaDisabled === "true") {
        return true;
      }
      if (node.hasAttribute("disabled")) {
        return true;
      }
    }
    return normalizeText(node.className || "").indexOf("is-disabled") >= 0;
  }

  function findCommonLabelButton(labelText, env) {
    const targetText = normalizeText(labelText);
    const root = env?.document || globalThis.document;
    if (!targetText || !root || typeof root.querySelectorAll !== "function") {
      return null;
    }
    const buttons = Array.from(root.querySelectorAll(".common_label_show"));
    return buttons.find(function (node) {
      return (
        normalizeText(node?.textContent || "") === targetText &&
        typeof node?.closest === "function" &&
        node.closest(".block_label") &&
        node.closest(".common_label")
      );
    }) || null;
  }

  function applyCommonLabel(labelText, env) {
    if (!isEditorPage(env?.location)) {
      return {
        ok: false,
        message: "当前不在编辑页。",
      };
    }
    const targetText = normalizeText(labelText);
    const button = findCommonLabelButton(targetText, env);
    if (!isElementNode(button, env)) {
      return {
        ok: false,
        message: "未找到标签按钮：" + targetText + "。",
      };
    }
    if (isDisabledElement(button)) {
      return {
        ok: false,
        message: "当前标签按钮不可用：" + targetText + "。",
      };
    }
    button.click();
    return {
      ok: true,
      message: "已点击标签按钮：" + targetText + "。",
    };
  }

  function getCurrentValidityState(env) {
    const scope = findFieldBlock(["是否有效（Valid or Not）", "是否有效"], env);
    if (!isElementNode(scope, env) || typeof scope.querySelectorAll !== "function") {
      return "";
    }
    const inputs = Array.from(scope.querySelectorAll("input"));
    const checkedInput = inputs.find(function (node) {
      return node && node.checked === true;
    });
    const checkedLabel =
      checkedInput?.closest?.("label") ||
      Array.from(scope.querySelectorAll("label")).find(function (node) {
        return normalizeText(node.className || "").indexOf("is-checked") >= 0;
      }) ||
      null;
    const labelText = normalizeText(checkedLabel?.textContent || "");
    if (VALID_LABELS.some(function (text) { return labelText.indexOf(text) >= 0; })) {
      return "valid";
    }
    if (INVALID_LABELS.some(function (text) { return labelText.indexOf(text) >= 0; })) {
      return "invalid";
    }
    return "";
  }

  function summarizeInstanceValidity(annos) {
    const rows = Array.isArray(annos) ? annos : [];
    const instanceRows = rows.filter(function (row) {
      return normalizeText(row?.ann_scope) === "instance";
    });
    const items = instanceRows.map(function (row, index) {
      const attrs = Array.isArray(row?.ann_data?.attrs) ? row.ann_data.attrs : [];
      const validityAttr = attrs.find(function (attr) {
        return normalizeText(attr?.name).indexOf("是否有效") >= 0;
      }) || null;
      const values = Array.isArray(validityAttr?.values) ? validityAttr.values : [];
      const valueText = normalizeText(
        values
          .map(function (item) {
            return item?.name || "";
          })
          .join(" ")
      );
      let state = "missing";
      if (VALID_LABELS.some(function (text) { return valueText.indexOf(text) >= 0; })) {
        state = "valid";
      } else if (INVALID_LABELS.some(function (text) { return valueText.indexOf(text) >= 0; })) {
        state = "invalid";
      }
      return {
        index: index + 1,
        state,
        row,
      };
    });
    const stats = {
      total: items.length,
      valid: items.filter(function (item) { return item.state === "valid"; }).length,
      invalid: items.filter(function (item) { return item.state === "invalid"; }).length,
      missing: items.filter(function (item) { return item.state === "missing"; }).length,
    };
    return {
      items,
      stats,
      missingIndexes: items
        .filter(function (item) {
          return item.state === "missing";
        })
        .map(function (item) {
          return item.index;
        }),
    };
  }

  function formatValidityStats(stats) {
    const source = stats && typeof stats === "object" ? stats : {};
    return (
      "当前音频共 " +
      String(Number(source.total || 0)) +
      " 段：已填 Valid " +
      String(Number(source.valid || 0)) +
      " 段，已填 Invalid " +
      String(Number(source.invalid || 0)) +
      " 段，未填写 " +
      String(Number(source.missing || 0)) +
      " 段"
    );
  }

  function readSegmentListNodes(env) {
    const doc = env?.document || globalThis.document;
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return [];
    }
    const seen = new Set();
    return Array.from(
      doc.querySelectorAll(".list-content .segment-content, .list-content .grey-seg, .segment-content, .grey-seg")
    )
      .filter(function (node) {
        if (!isElementNode(node, env) || seen.has(node)) {
          return false;
        }
        seen.add(node);
        const matched = normalizeText(node.textContent || "").match(/^\d+$/);
        return Boolean(matched);
      })
      .map(function (node) {
        return {
          index: Number(normalizeText(node.textContent || "")) || 0,
          node,
        };
      })
      .filter(function (item) {
        return item.index > 0;
      });
  }

  function extractCurrentSegmentNumber(documentLike) {
    const doc = documentLike || globalThis.document;
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return 0;
    }
    const nodes = Array.from(
      doc.querySelectorAll(".list-content .segment-content, .list-content .grey-seg, .segment-content, .grey-seg")
    );
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      const number = Number(normalizeText(node?.textContent || ""));
      if (number > 0 && isSegmentSelected(node)) {
        return number;
      }
    }
    return 0;
  }

  function isSegmentSelected(node) {
    const current = node && typeof node === "object" ? node : null;
    if (!current) {
      return false;
    }
    if (String(current.getAttribute?.("data-selected") || "").toLowerCase() === "true") {
      return true;
    }
    if (String(current.getAttribute?.("aria-selected") || "").toLowerCase() === "true") {
      return true;
    }
    const className = normalizeText(current.className || "").toLowerCase();
    if (/(active|selected|current)/.test(className)) {
      return true;
    }
    const styleText = normalizeText(current.getAttribute?.("style") || current.style || "");
    return styleText.indexOf("82, 106, 255") >= 0 || styleText.toLowerCase().indexOf("#526aff") >= 0;
  }

  function wait(delayMs) {
    return new Promise(function (resolve) {
      setTimeout(resolve, Math.max(0, Number(delayMs || 0)));
    });
  }

  async function focusSegmentIndex(targetIndex, env) {
    const item = readSegmentListNodes(env).find(function (row) {
      return row.index === Number(targetIndex || 0);
    });
    if (!item || !isElementNode(item.node, env)) {
      return false;
    }
    item.node.click();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (isSegmentSelected(item.node)) {
        return true;
      }
      await wait(20);
    }
    return false;
  }

  function buildAnnosQueryFromParts(query, selectedEntry) {
    const params = new URLSearchParams();
    const pairs = [
      ["project_id", query.projectId],
      ["task_id", query.taskId],
      ["process_id", query.processId],
      ["data_id", query.dataId],
      ["job_id", query.jobId],
      ["entry_index", selectedEntry?.entry_index],
      ["terminal", query.terminal],
    ];
    pairs.forEach(function (pair) {
      const value = normalizeText(pair[1]);
      if (value) {
        params.set(pair[0], value);
      }
    });
    return params;
  }

  function buildAnnosQuery(context) {
    const current = context && typeof context === "object" ? context : {};
    return buildAnnosQueryFromParts(current.query || {}, current.selectedEntry);
  }

  function isLiveSelectionStale(selectionKey, env) {
    const liveSelection = getLiveSelectionSnapshot(env?.document || globalThis.document);
    return (
      normalizeText(selectionKey) &&
      normalizeText(selectionKey) !== normalizeText(liveSelection.selectionKey)
    );
  }

  function collectFieldContext(template, env) {
    const fields = mapTemplateFieldNames(template);
    return {
      attrs: fields.attrs,
      entryAttrs: fields.entryAttrs,
      momentAttrs: fields.momentAttrs,
      dialectText: getFieldValue(findFieldTarget(["标注文本", "柳州话", "转写文本"], env), env),
      mandarinText: getFieldValue(findFieldTarget(["普通话顺滑", "普通话", "顺滑"], env), env),
    };
  }

  function findObserverAudioUrl(entry, mappings) {
    const list = Array.isArray(mappings) ? mappings : [];
    const relativePath = normalizePath(entry?.content);
    const fileName = normalizeText(entry?.name) || getFileName(relativePath);
    const matched = list.find(function (item) {
      const row = item && typeof item === "object" ? item : {};
      if (!isAudioUrl(row.audioUrl)) {
        return false;
      }
      if (relativePath && normalizePath(row.relativePath) === relativePath) {
        return true;
      }
      if (fileName && normalizeText(row.fileName) === fileName) {
        return true;
      }
      return isUrlForEntry(row.audioUrl, entry);
    });
    return normalizeText(matched?.audioUrl);
  }

  function findAudioUrlFromDom(entry, env) {
    const doc = env.document;
    if (!doc || typeof doc.querySelector !== "function") {
      return "";
    }
    const audio = doc.querySelector("audio");
    const url = normalizeText(audio?.currentSrc || audio?.src);
    return isAudioUrl(url) && isUrlForEntry(url, entry) ? url : "";
  }

  function findAudioUrlFromPerformance(entry, env) {
    const performanceApi = env.performance;
    if (!performanceApi || typeof performanceApi.getEntriesByType !== "function") {
      return "";
    }
    const entries = performanceApi.getEntriesByType("resource");
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const url = normalizeText(entries[index]?.name);
      if (isAudioUrl(url) && isUrlForEntry(url, entry)) {
        return url;
      }
    }
    return "";
  }

  function findAudioUrlFromIframe(entry, env) {
    const doc = env.document;
    if (!doc || typeof doc.querySelector !== "function") {
      return "";
    }
    const iframe = doc.querySelector("#iframeBox iframe#myIframe, #iframeBox iframe");
    try {
      const audio = iframe?.contentDocument?.querySelector("audio");
      const url = normalizeText(audio?.currentSrc || audio?.src);
      return isAudioUrl(url) && isUrlForEntry(url, entry) ? url : "";
    } catch (error) {
      return "";
    }
  }

  function resolveAudioUrl(entry, env, observerMappings) {
    const candidates = [
      ["observer", findObserverAudioUrl(entry, observerMappings)],
      ["meta", extractAudioUrlFromMeta(entry)],
      ["dom-audio", findAudioUrlFromDom(entry, env)],
      ["performance", findAudioUrlFromPerformance(entry, env)],
      ["iframe-audio", findAudioUrlFromIframe(entry, env)],
    ];
    for (let index = 0; index < candidates.length; index += 1) {
      if (normalizeText(candidates[index][1])) {
        return {
          audioUrl: normalizeText(candidates[index][1]),
          audioUrlSource: candidates[index][0],
        };
      }
    }
    return {
      audioUrl: "",
      audioUrlSource: "",
    };
  }

  function parseTimeTokenToMs(value) {
    const text = normalizeText(value);
    if (!text) {
      return NaN;
    }
    const parts = text.split(":");
    if (parts.length === 1) {
      const secondsOnly = Number(parts[0]);
      return Number.isFinite(secondsOnly) ? Math.round(secondsOnly * 1000) : NaN;
    }
    const seconds = Number(parts.pop());
    const minutes = Number(parts.pop() || 0);
    const hours = Number(parts.pop() || 0);
    if (!Number.isFinite(seconds) || !Number.isFinite(minutes) || !Number.isFinite(hours)) {
      return NaN;
    }
    return Math.round(((hours * 60 + minutes) * 60 + seconds) * 1000);
  }

  function parseRegionTitleRange(title) {
    const text = normalizeText(title);
    if (!text || text.indexOf("-") < 0) {
      return null;
    }
    const parts = text.split("-");
    if (parts.length !== 2) {
      return null;
    }
    const startMs = parseTimeTokenToMs(parts[0]);
    const endMs = parseTimeTokenToMs(parts[1]);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return null;
    }
    return {
      startMs,
      endMs,
    };
  }

  function parseStylePxValue(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : NaN;
    }
    const text = String(value || "");
    const matched = text.match(/-?\d+(?:\.\d+)?/);
    return matched ? Number(matched[0]) : NaN;
  }

  function readNodeStyleValue(node, key) {
    const propertyName = String(key || "");
    if (!node) {
      return "";
    }
    const objectStyle = node.style;
    if (objectStyle && typeof objectStyle === "object" && objectStyle[propertyName] !== undefined) {
      return objectStyle[propertyName];
    }
    const styleText = String(node.getAttribute?.("style") || objectStyle || "");
    const matched = styleText.match(
      new RegExp(propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:\\s*([^;]+)", "i")
    );
    return matched ? matched[1] : "";
  }

  function readNodePixelValue(node, key) {
    return parseStylePxValue(readNodeStyleValue(node, key));
  }

  function readNodeWidth(node) {
    const candidates = [
      Number(node?.scrollWidth),
      Number(node?.clientWidth),
      Number(node?.offsetWidth),
      Number(node?.getBoundingClientRect?.().width),
      parseStylePxValue(readNodeStyleValue(node, "width")),
    ];
    for (let index = 0; index < candidates.length; index += 1) {
      if (Number.isFinite(candidates[index]) && candidates[index] > 0) {
        return candidates[index];
      }
    }
    return 0;
  }

  function readNodeLeft(node) {
    const rectLeft = Number(node?.getBoundingClientRect?.().left);
    if (Number.isFinite(rectLeft)) {
      return rectLeft;
    }
    const styleLeft = readNodePixelValue(node, "left");
    return Number.isFinite(styleLeft) ? styleLeft : 0;
  }

  function getXaudioDocument(env) {
    const doc = env?.document || globalThis.document;
    if (!doc || typeof doc.querySelector !== "function") {
      return null;
    }
    const iframe = doc.querySelector("#iframeBox iframe#myIframe, #iframeBox iframe");
    try {
      return iframe?.contentDocument || null;
    } catch (error) {
      return null;
    }
  }

  function findSplitActionButton(env) {
    const doc = env?.document || globalThis.document;
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return null;
    }
    return (
      Array.from(doc.querySelectorAll("button, span, div"))
        .find(function (node) {
          return normalizeText(node?.textContent || "") === "开启拆分";
        }) || null
    );
  }

  function buildWaveformInfo(iframeDocument, liveRegions, audioDurationMs) {
    const doc = iframeDocument;
    if (!doc || typeof doc.querySelector !== "function") {
      return null;
    }
    const container =
      doc.querySelector("#wave-waveform") ||
      doc.querySelector("rectwrapper") ||
      doc.querySelector("markpoints") ||
      null;
    const scrollContainer = doc.querySelector("rectwrapper") || container;
    const drawLayer = doc.querySelector("markpoints") || scrollContainer || container;
    const regionRight = (Array.isArray(liveRegions) ? liveRegions : []).reduce(function (maxValue, region) {
      return Math.max(maxValue, Number(region?.rightPx || 0) || 0);
    }, 0);
    const contentWidth = Math.max(
      readNodeWidth(drawLayer),
      readNodeWidth(scrollContainer),
      readNodeWidth(container),
      regionRight
    );
    const contentLeft =
      readNodeLeft(drawLayer) ||
      readNodeLeft(scrollContainer) ||
      readNodeLeft(container) ||
      0;
    const effectiveDurationMs = Math.max(
      0,
      Number(audioDurationMs || 0) || 0,
      (Array.isArray(liveRegions) ? liveRegions : []).reduce(function (maxValue, region) {
        return Math.max(maxValue, Number(region?.endMs || 0) || 0);
      }, 0)
    );
    if (!drawLayer || contentWidth <= 0 || effectiveDurationMs <= 0) {
      return null;
    }
    return {
      container,
      scrollContainer,
      drawLayer,
      contentWidth,
      contentLeft,
      audioDurationMs: effectiveDurationMs,
    };
  }

  function extractRegionNumber(regionNode) {
    if (!regionNode || typeof regionNode.querySelectorAll !== "function") {
      return 0;
    }
    const labelNode = Array.from(regionNode.querySelectorAll("div")).find(function (node) {
      return /^\d+$/.test(normalizeText(node?.textContent || ""));
    });
    return Number(normalizeText(labelNode?.textContent || "")) || 0;
  }

  function readLiveWaveformRegions(iframeDocument, audioDurationMs) {
    const doc = iframeDocument;
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return [];
    }
    const regionNodes = Array.from(doc.querySelectorAll("region.waveform-region, .waveform-region"));
    const preliminary = regionNodes.map(function (node, index) {
      const titleRange = parseRegionTitleRange(node.getAttribute?.("title") || "");
      const leftPx = readNodePixelValue(node, "left");
      const widthPx = readNodePixelValue(node, "width");
      return {
        index,
        node,
        dataId: normalizeText(node.getAttribute?.("data-id") || node.getAttribute?.("id")),
        titleRange,
        leftPx,
        widthPx,
        rightPx:
          (Number.isFinite(leftPx) ? leftPx : 0) +
          Math.max(0, Number.isFinite(widthPx) ? widthPx : 0),
        segmentNumber: extractRegionNumber(node) || index + 1,
        startHandle:
          node.querySelector?.("handle.waveform-handle-start, .waveform-handle-start") || null,
        endHandle:
          node.querySelector?.("handle.waveform-handle-end, .waveform-handle-end") || null,
      };
    });
    const waveformInfo = buildWaveformInfo(doc, preliminary, audioDurationMs);
    return preliminary
      .map(function (item) {
        const pixelRange =
          waveformInfo &&
          Number.isFinite(item.leftPx) &&
          Number.isFinite(item.widthPx) &&
          item.widthPx > 0
            ? {
                startMs: Math.round((item.leftPx / waveformInfo.contentWidth) * waveformInfo.audioDurationMs),
                endMs: Math.round(
                  ((item.leftPx + item.widthPx) / waveformInfo.contentWidth) * waveformInfo.audioDurationMs
                ),
              }
            : null;
        let startMs = NaN;
        let endMs = NaN;
        if (pixelRange && item.titleRange) {
          const delta =
            Math.abs(pixelRange.startMs - item.titleRange.startMs) +
            Math.abs(pixelRange.endMs - item.titleRange.endMs);
          startMs = delta <= 4000 ? pixelRange.startMs : item.titleRange.startMs;
          endMs = delta <= 4000 ? pixelRange.endMs : item.titleRange.endMs;
        } else if (pixelRange) {
          startMs = pixelRange.startMs;
          endMs = pixelRange.endMs;
        } else if (item.titleRange) {
          startMs = item.titleRange.startMs;
          endMs = item.titleRange.endMs;
        }
        return {
          index: item.index,
          node: item.node,
          dataId: item.dataId,
          segmentNumber: item.segmentNumber,
          startHandle: item.startHandle,
          endHandle: item.endHandle,
          startMs,
          endMs,
          leftPx: item.leftPx,
          widthPx: item.widthPx,
          rightPx: item.rightPx,
        };
      })
      .filter(function (item) {
        return Number.isFinite(item.startMs) && Number.isFinite(item.endMs) && item.endMs > item.startMs;
      })
      .sort(function (left, right) {
        return left.startMs - right.startMs;
      });
  }

  function hasApproxRangeMatch(left, right, toleranceMs) {
    const tolerance = Math.max(0, Number(toleranceMs || 0) || 0);
    return (
      Math.abs(Number(left?.startMs || 0) - Number(right?.startMs || 0)) <= tolerance &&
      Math.abs(Number(left?.endMs || 0) - Number(right?.endMs || 0)) <= tolerance
    );
  }

  function getPreviewSourceSegments(preview) {
    const source = preview && typeof preview === "object" ? preview : {};
    const segments = Array.isArray(source.sourceSegments)
      ? source.sourceSegments
      : Array.isArray(source.currentSegments)
        ? source.currentSegments
        : [];
    return segments.map(function (item, index) {
      return normalizeSegmentItem(item, index);
    });
  }

  function isPreviewApplicableToLive(preview, liveRegions) {
    const sourceSegments = getPreviewSourceSegments(preview);
    if (sourceSegments.length === 0) {
      return Array.isArray(liveRegions) && liveRegions.length > 0;
    }
    if (!Array.isArray(liveRegions) || liveRegions.length !== sourceSegments.length) {
      return false;
    }
    return sourceSegments.every(function (segment, index) {
      const liveRegion = liveRegions[index];
      if (!liveRegion) {
        return false;
      }
      if (segment.uniqueId && liveRegion.dataId) {
        return (
          segment.uniqueId === liveRegion.dataId &&
          hasApproxRangeMatch(segment, liveRegion, APPLY_TOLERANCE_MS)
        );
      }
      if (
        Number(segment.sourceSegmentNumber) > 0 &&
        Number(liveRegion.segmentNumber) > 0 &&
        segment.sourceSegmentNumber !== liveRegion.segmentNumber
      ) {
        return false;
      }
      return hasApproxRangeMatch(segment, liveRegion, APPLY_TOLERANCE_MS);
    });
  }

  function matchLiveRegionForChange(liveRegions, change, usedIndexes) {
    const source = change && typeof change === "object" ? change : {};
    const used = usedIndexes instanceof Set ? usedIndexes : new Set();
    const candidates = (Array.isArray(liveRegions) ? liveRegions : []).filter(function (region) {
      return !used.has(region.index);
    });
    if (normalizeText(source.sourceUniqueId)) {
      const matchedById = candidates.find(function (region) {
        return region.dataId === normalizeText(source.sourceUniqueId);
      });
      if (matchedById) {
        return matchedById;
      }
    }
    if (Number(source.sourceSegmentNumber) > 0) {
      const matchedByNumber = candidates.find(function (region) {
        return Number(region.segmentNumber) === Number(source.sourceSegmentNumber);
      });
      if (matchedByNumber) {
        return matchedByNumber;
      }
    }
    return candidates.find(function (region) {
      return hasApproxRangeMatch(
        region,
        {
          startMs: source.originalStartMs,
          endMs: source.originalEndMs,
        },
        APPLY_TOLERANCE_MS
      );
    }) || null;
  }

  function buildTargetClientX(targetMs, waveformInfo) {
    const ms = Math.max(0, Math.min(waveformInfo.audioDurationMs, Number(targetMs || 0) || 0));
    return waveformInfo.contentLeft + (ms / waveformInfo.audioDurationMs) * waveformInfo.contentWidth;
  }

  function createPointerLikeEvent(type, clientX, clientY, view) {
    const eventInit = {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      button: 0,
      buttons: /up$/i.test(type) ? 0 : 1,
      pointerId: 1,
      pointerType: "mouse",
      view,
    };
    try {
      if (/^pointer/i.test(type) && typeof view?.PointerEvent === "function") {
        return new view.PointerEvent(type, eventInit);
      }
      if (typeof view?.MouseEvent === "function") {
        return new view.MouseEvent(type, eventInit);
      }
    } catch (_error) {
      return null;
    }
    return Object.assign({ type }, eventInit);
  }

  function dispatchPointerSequence(target, moveTarget, startX, endX, env) {
    const primaryTarget = target || moveTarget;
    const secondaryTarget = moveTarget || target;
    if (!primaryTarget || typeof primaryTarget.dispatchEvent !== "function") {
      return false;
    }
    const view = env?.window || globalThis.window || globalThis;
    const clientY = 80;
    [
      [primaryTarget, "pointerdown", startX],
      [primaryTarget, "mousedown", startX],
      [secondaryTarget, "pointermove", endX],
      [secondaryTarget, "mousemove", endX],
      [secondaryTarget, "pointerup", endX],
      [secondaryTarget, "mouseup", endX],
    ].forEach(function (step) {
      const event = createPointerLikeEvent(step[1], step[2], clientY, view);
      if (event && step[0] && typeof step[0].dispatchEvent === "function") {
        step[0].dispatchEvent(event);
      }
    });
    return true;
  }

  function createRuntime(deps) {
    const env = getEnvironment(deps);
    let cachedMeta = null;
    let cachedContext = null;
    let bridgedMeta = null;
    let bridgedUserMeta = null;
    let bridgedAuth = null;
    let cachedUserMeta = null;
    const observerMappings = [];

    function rememberObserverMapping(mapping) {
      const source = mapping && typeof mapping === "object" ? mapping : {};
      if (!isAudioUrl(source.audioUrl)) {
        return;
      }
      observerMappings.unshift({
        relativePath: normalizePath(source.relativePath),
        fileName: normalizeText(source.fileName),
        entryId: normalizeText(source.entryId),
        entryIndex: normalizeText(source.entryIndex),
        audioUrl: normalizeText(source.audioUrl),
        at: Number(source.at) || Date.now(),
      });
      observerMappings.splice(30);
    }

    function isBridgeQueryForCurrentPage(query) {
      const source = query && typeof query === "object" ? query : {};
      const current = parseEditorQuery(env.location);
      const pairs = [
        ["project_id", current.projectId],
        ["task_id", current.taskId],
        ["process_id", current.processId],
        ["data_id", current.dataId],
        ["job_id", current.jobId],
      ];
      return pairs.every(function (pair) {
        const expected = normalizeText(pair[1]);
        const actual = normalizeText(source[pair[0]]);
        return !expected || !actual || actual === expected;
      });
    }

    function rememberBridgedMeta(payload) {
      const source = payload && typeof payload === "object" ? payload : {};
      const meta = source.meta && typeof source.meta === "object" ? source.meta : source;
      if (hasUserMeta(meta)) {
        bridgedUserMeta = normalizeUserMeta(meta);
        cachedUserMeta = Object.assign(
          {
            platformUserMetaSource: "observer-user-meta",
          },
          bridgedUserMeta
        );
        cachedContext = null;
        return;
      }
      if (!Array.isArray(meta?.datas) || !isBridgeQueryForCurrentPage(source.query)) {
        return;
      }
      bridgedMeta = meta;
      cachedMeta = meta;
      cachedContext = null;
    }

    function rememberBridgedAuth(payload) {
      const source = payload && typeof payload === "object" ? payload : {};
      const headers = source.headers && typeof source.headers === "object" ? source.headers : {};
      const authorization = normalizeText(headers.authorization);
      const bakerTerminal = normalizeText(headers["baker-terminal"]);
      const bakerLang = normalizeText(headers["baker-lang"]);
      if (!authorization && !bakerTerminal && !bakerLang) {
        return;
      }
      bridgedAuth = {
        authorization,
        bakerTerminal,
        bakerLang,
        at: Number(source.at || 0) || Date.now(),
        path: normalizeText(source.path),
      };
      cachedContext = null;
    }

    function handleObserverMessage(event) {
      if (!event || event.origin !== env.location.origin) {
        return;
      }
      const data = event.data || {};
      if (data.source !== OBSERVER_SOURCE) {
        return;
      }
      if (data.type === OBSERVER_MESSAGE_TYPE) {
        rememberObserverMapping(data.payload);
        cachedContext = null;
        return;
      }
      if (data.type === OBSERVER_META_MESSAGE_TYPE) {
        rememberBridgedMeta(data.payload);
        return;
      }
      if (data.type === OBSERVER_AUTH_MESSAGE_TYPE) {
        rememberBridgedAuth(data.payload);
      }
    }

    if (env.window && typeof env.window.addEventListener === "function") {
      env.window.addEventListener("message", handleObserverMessage);
    }

    async function loadPlatformUserMeta() {
      if (cachedUserMeta) {
        return cachedUserMeta;
      }
      if (bridgedUserMeta) {
        cachedUserMeta = Object.assign(
          {
            platformUserMetaSource: "observer-user-meta",
          },
          bridgedUserMeta
        );
        return cachedUserMeta;
      }
      try {
        const directMeta = normalizeUserMeta(await fetchJson(USER_META_PATH, null, env.fetch));
        cachedUserMeta = Object.assign(
          {
            platformUserMetaSource:
              directMeta.platformUserName || directMeta.platformUserId ? "direct-user-meta" : "",
          },
          directMeta
        );
      } catch (_error) {
        cachedUserMeta = {
          platformUserName: "",
          platformUserId: "",
          platformUserMetaSource: "",
        };
      }
      return cachedUserMeta;
    }

    async function loadContext(force) {
      if (!force && cachedContext) {
        return cachedContext;
      }
      const query = parseEditorQuery(env.location);
      let meta = bridgedMeta;
      if (!meta) {
        try {
          meta = await fetchJson(META_PATH, query, env.fetch);
        } catch (error) {
          if (!bridgedMeta) {
            throw error;
          }
          meta = bridgedMeta;
        }
      }
      cachedMeta = meta;
      const selectedEntry = getSelectedEntry(meta, env.document);
      const liveSelection = getLiveSelectionSnapshot(env.document);
      const currentAnn = getCurrentAnn(meta, selectedEntry);
      let currentSegments = [];
      const platformRequestHeaders = buildPlatformRequestHeaders(bridgedAuth, {
        query,
      });
      try {
        const annos = await fetchJson(
          ANNOS_PATH,
          buildAnnosQueryFromParts(query, selectedEntry),
          env.fetch,
          {
            headers:
              normalizeText(platformRequestHeaders.authorization) ||
              normalizeText(platformRequestHeaders["baker-terminal"])
                ? platformRequestHeaders
                : undefined,
          }
        );
        currentSegments = extractSegmentsFromAnnos(annos);
      } catch (_error) {
        currentSegments = [];
      }
      if (currentSegments.length === 0) {
        currentSegments = extractSegmentsFromAnnData(currentAnn?.ann_data);
      }
      const template = meta.template && typeof meta.template === "object" ? meta.template : {};
      const audio = resolveAudioUrl(selectedEntry, env, observerMappings);
      const userMeta = await loadPlatformUserMeta();
      cachedContext = {
        query,
        meta,
        template,
        selectedEntry,
        currentAnn,
        currentSegments: currentSegments,
        fieldContext: collectFieldContext(template, env),
        selectedRange: liveSelection.selectedRange,
        currentSegmentNumber: Number(liveSelection.currentSegmentNumber || 0) || 0,
        selectionKey: buildSelectionKey(
          selectedEntry?.name || liveSelection.selectedEntryName,
          liveSelection.selectedRange
        ),
        audioUrl: audio.audioUrl,
        audioUrlHintMessage: audio.audioUrl ? "" : MISSING_AUDIO_MESSAGE,
        audioUrlSource: audio.audioUrlSource,
        audioDurationMs: extractAudioDurationMs(currentAnn, selectedEntry),
        platformUserName: userMeta.platformUserName,
        platformUserId: userMeta.platformUserId,
        platformUserMetaSource: userMeta.platformUserMetaSource,
        platformRequestAuth: bridgedAuth
          ? {
              authorization: bridgedAuth.authorization,
              bakerTerminal: bridgedAuth.bakerTerminal,
              bakerLang: bridgedAuth.bakerLang,
            }
          : null,
      };
      return cachedContext;
    }

    async function getEditorContext(options) {
      const force = options && options.force === true;
      return loadContext(force);
    }

    async function fetchLatestAnnosForContext(context) {
      const requestHeaders = buildPlatformRequestHeaders(context?.platformRequestAuth, context);
      const hasScopedHeaders =
        normalizeText(requestHeaders.authorization) ||
        normalizeText(requestHeaders["baker-terminal"]);
      return fetchJson(ANNOS_PATH, buildAnnosQuery(context), env.fetch, {
        headers: hasScopedHeaders ? requestHeaders : undefined,
      });
    }

    async function getBatchSegments(selectionSpec, contextOverride) {
      const context =
        contextOverride && typeof contextOverride === "object"
          ? contextOverride
          : await getEditorContext({ force: true });
      if (!normalizeText(context?.selectedEntry?.name)) {
        throw new Error("未读取到当前音频条目，请刷新页面后重试。");
      }
      const annos = await fetchLatestAnnosForContext(context);
      const rows = getInstanceRowsFromAnnos(annos);
      if (rows.length <= 0) {
        throw new Error("当前音频没有可批量处理的段落。");
      }
      const selectedNumbers = parseBatchSelectionSpec(selectionSpec, rows.length);
      const normalizedSelectionSpec = selectedNumbers.join(",");
      return {
        selectedEntryName: normalizeText(context.selectedEntry?.name),
        totalSegments: rows.length,
        selectionSpec: String(selectionSpec || ""),
        normalizedSelectionSpec: normalizedSelectionSpec,
        allSegmentUniqueIds: rows.map(function (row) {
          return normalizeText(row?.unique_id || row?.uniqueId || row?.id);
        }),
        segments: selectedNumbers.map(function (segmentNumber) {
          const row = rows[segmentNumber - 1];
          const startMs = normalizeBoundaryToMs(row?.start_second);
          const endMs = normalizeBoundaryToMs(row?.end_second);
          const textMeta = extractBatchSegmentTexts(row, context.template || {});
          return {
            segmentNumber: segmentNumber,
            uniqueId: normalizeText(row?.unique_id || row?.uniqueId || row?.id),
            startMs: startMs,
            endMs: endMs,
            durationMs: Math.max(0, endMs - startMs),
            dialectText: textMeta.dialectText,
            mandarinText: textMeta.mandarinText,
            selectionKey: buildSelectionKey(context.selectedEntry?.name, {
              startMs: startMs,
              endMs: endMs,
            }),
          };
        }),
      };
    }

    async function applyBatchTextRecommendations(request, contextOverride) {
      const source = request && typeof request === "object" ? request : {};
      const normalizedResults = (Array.isArray(source.results) ? source.results : [])
        .map(normalizeBatchResultItem)
        .filter(function (item) {
          return item.uniqueId && (item.dialectText || item.mandarinText || item.dialectTokens.length > 0);
        });
      if (normalizedResults.length <= 0) {
        return {
          ok: false,
          message: BATCH_SAVE_EMPTY_MESSAGE,
        };
      }
      const context =
        contextOverride && typeof contextOverride === "object"
          ? contextOverride
          : await getEditorContext({ force: true });
      if (
        normalizeText(source.selectedEntryName) &&
        normalizeText(source.selectedEntryName) !== normalizeText(context.selectedEntry?.name)
      ) {
        return {
          ok: false,
          message: BATCH_SAVE_STALE_MESSAGE,
        };
      }
      if (!normalizeText(context?.platformRequestAuth?.authorization)) {
        return {
          ok: false,
          message: BATCH_SAVE_AUTH_MISSING_MESSAGE,
        };
      }
      let annos = [];
      try {
        annos = await fetchLatestAnnosForContext(context);
      } catch (_error) {
        return {
          ok: false,
          message: BATCH_SAVE_MISMATCH_MESSAGE,
        };
      }
      const entryRow = getEntryRowFromAnnos(annos, context);
      const currentRows = getInstanceRowsFromAnnos(annos);
      const descriptorHints = resolveBatchTextDescriptors(context.template || {}, currentRows);
      const resultMap = new Map();
      const usedIndexes = new Set();
      let failedAlignment = false;
      normalizedResults.forEach(function (item) {
        const matched = matchBatchResultToRow(
          item,
          currentRows,
          context.selectedEntry?.name,
          usedIndexes
        );
        if (!matched) {
          failedAlignment = true;
          return;
        }
        usedIndexes.add(matched.index);
        resultMap.set(matched.index, item);
      });
      const updatedRows = [];
      const snapshotRows = currentRows.map(function (row, index) {
        const resultItem = resultMap.get(index);
        if (!resultItem) {
          return buildSnapshotInstanceRow(row, context.template || {});
        }
        let updatedRow;
        try {
          updatedRow = buildUpdatedBatchTextRow(
            row,
            context.template || {},
            resultItem,
            descriptorHints
          );
        } catch (_error) {
          failedAlignment = true;
          return buildSnapshotInstanceRow(row, context.template || {});
        }
        updatedRows.push(updatedRow);
        return buildSnapshotInstanceRow(updatedRow, context.template || {});
      });
      if (failedAlignment || updatedRows.length !== normalizedResults.length) {
        return {
          ok: false,
          message: BATCH_SAVE_MISMATCH_MESSAGE,
        };
      }
      const requestHeaders = buildPlatformRequestHeaders(context?.platformRequestAuth, context, {
        "content-type": "application/json;charset=UTF-8",
      });
      const body = {
        project_id: String(context?.query?.projectId || ""),
        task_id: String(context?.query?.taskId || ""),
        process_id: String(context?.query?.processId || ""),
        job_id: String(context?.query?.jobId || ""),
        data_id: String(context?.query?.dataId || ""),
        insert: [],
        update: updatedRows,
        delete: [],
        web_snapshot: JSON.stringify(
          snapshotRows.concat([buildSnapshotEntryRow(entryRow, context.template || {})])
        ),
      };
      const response = await env.fetch(SAVE_INCREMENT_PATH, {
        credentials: "include",
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(function () {
        return null;
      });
      const code = Number(payload?.code);
      if (!response.ok || !payload || (code !== 0 && code !== 200)) {
        return {
          ok: false,
          message: normalizeText(payload?.msg || payload?.message) || "平台保存接口返回失败。",
        };
      }
      cachedContext = null;
      cachedMeta = null;
      return {
        ok: true,
        savedCount: updatedRows.length,
        message:
          "已通过平台保存接口写回 " +
          String(updatedRows.length) +
          " 段批量识别结果，页面即将刷新。",
      };
    }

    async function setCurrentValidity(valid) {
      const currentState = getCurrentValidityState(env);
      const targetState = valid ? "valid" : "invalid";
      if (currentState === targetState) {
        return {
          ok: true,
          message: valid ? "当前段已是 Valid，无需重复点击。" : "当前段已是 Invalid，无需重复点击。",
          skipped: true,
        };
      }
      const scope = findFieldBlock(["是否有效（Valid or Not）", "是否有效"], env);
      const ok = clickLabelByTexts(valid ? VALID_LABELS : INVALID_LABELS, env, scope);
      cachedContext = null;
      return ok
        ? { ok: true, message: valid ? "当前段已切换为 Valid。" : "当前段已切换为 Invalid。" }
        : { ok: false, message: "未找到当前页的 Valid / Invalid 选择入口。" };
    }

    async function fillCurrentSegmentRecommendation(recommendation) {
      const source = recommendation && typeof recommendation === "object" ? recommendation : {};
      if (isLiveSelectionStale(source.selectionKey, env)) {
        return {
          ok: false,
          message: "当前段已切换，旧识别结果已失效，请重新执行当前段识别。",
        };
      }
      const dialectField = findFieldTarget(["标注文本", "柳州话", "转写文本"], env);
      const mandarinField = findFieldTarget(["普通话顺滑", "普通话", "顺滑"], env);
      const dialectText = String(
        source.refinedDialectText || source.dialectText || source.audioDialectText || ""
      );
      const dialectTokens = normalizeDialectTokensInput(
        source.refinedDialectTokens || source.audioDialectTokens,
        dialectText
      );
      const mandarinText = String(
        source.refinedMandarinText || source.mandarinText || source.audioMandarinText || ""
      );
      const wroteDialect = dialectText || dialectTokens.length > 0
        ? setStructuredTagFieldValue(
            dialectField,
            dialectTokens.length > 0 ? dialectTokens : dialectText,
            env
          )
        : false;
      const wroteMandarin = mandarinText
        ? setTextFieldValue(mandarinField, mandarinText, env)
        : false;
      if (!wroteDialect && !wroteMandarin) {
        return {
          ok: false,
          message: "未检测到稳定的当前段文本输入框；真实字段写入契约仍待补采。",
        };
      }
      cachedContext = null;
      return {
        ok: true,
        message: "已尝试把当前段 AI 建议填入页面；如页面未同步，请刷新后复核。",
      };
    }

    async function fillCurrentSegmentField(request) {
      const source = request && typeof request === "object" ? request : {};
      if (isLiveSelectionStale(source.selectionKey, env)) {
        return {
          ok: false,
          message: "当前段已切换，旧识别结果已失效，请重新执行当前段识别。",
        };
      }
      const targetField = normalizeText(source.targetField).toLowerCase();
      const tokens = normalizeDialectTokensInput(source.tokens, source.text || "");
      const text = String(source.text || joinDialectTokens(tokens));
      if (!text) {
        return {
          ok: false,
          message: "当前结果没有可填入的文本。",
        };
      }
      const isDialectTarget = targetField === "dialect";
      const field = findFieldTarget(
        isDialectTarget ? ["标注文本", "柳州话", "转写文本"] : ["普通话顺滑", "普通话", "顺滑"],
        env
      );
      const wrote = isDialectTarget
        ? setStructuredTagFieldValue(field, tokens.length > 0 ? tokens : text, env)
        : setTextFieldValue(field, text, env);
      if (!wrote) {
        return {
          ok: false,
          message: "未检测到稳定的当前段文本输入框；真实字段写入契约仍待补采。",
        };
      }
      cachedContext = null;
      return {
        ok: true,
        message: isDialectTarget
          ? "已尝试把当前段建议填入标注文本；如页面未同步，请刷新后复核。"
          : "已尝试把当前段建议填入普通话顺滑；如页面未同步，请刷新后复核。",
      };
    }

    async function applySegmentPreviewByRequest(source, context) {
      const requestHeaders = buildPlatformRequestHeaders(context?.platformRequestAuth, context, {
        "content-type": "application/json;charset=UTF-8",
      });
      if (!normalizeText(requestHeaders.authorization)) {
        throw new Error(PREVIEW_DIRECT_SAVE_AUTH_MISSING_MESSAGE);
      }
      let annos = [];
      try {
        annos = await fetchJson(ANNOS_PATH, buildAnnosQuery(context), env.fetch, {
          headers: buildPlatformRequestHeaders(context?.platformRequestAuth, context),
        });
      } catch (_error) {
        throw new Error("未能读取当前页面的分段数据，无法构造平台保存请求。");
      }
      const body = buildSaveIncrementBody(context, annos, source);
      if (!body) {
        return {
          ok: false,
          message: PREVIEW_NOTHING_TO_APPLY_MESSAGE,
        };
      }
      const response = await env.fetch(SAVE_INCREMENT_PATH, {
        credentials: "include",
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(function () {
        return null;
      });
      const code = Number(payload?.code);
      if (!response.ok || !payload || (code !== 0 && code !== 200)) {
        if (isDuplicateUniqueIdMessage(payload?.msg || payload?.message)) {
          throw new Error(PREVIEW_DIRECT_SAVE_DUPLICATE_UNIQUE_ID_MESSAGE);
        }
        throw new Error(
          normalizeText(payload?.msg || payload?.message) || "平台保存接口返回失败。"
        );
      }
      cachedContext = null;
      cachedMeta = null;
      return {
        ok: true,
        appliedBy: "request",
        message: PREVIEW_DIRECT_SAVE_SUCCESS_MESSAGE,
      };
    }

    async function applySegmentPreviewByDom(source, context, changes) {
      const iframeDocument = getXaudioDocument(env);
      if (!iframeDocument) {
        return {
          ok: false,
          message: PREVIEW_UNSAFE_MESSAGE,
        };
      }
      let liveRegions = readLiveWaveformRegions(iframeDocument, context.audioDurationMs);
      if (liveRegions.length === 0 || !isPreviewApplicableToLive(source, liveRegions)) {
        return {
          ok: false,
          message: PREVIEW_LIVE_MISMATCH_MESSAGE,
        };
      }
      const splitButton = findSplitActionButton(env);
      const usedOriginalIndexes = new Set();

      function normalizePreviewTargetSegments(value) {
        return (Array.isArray(value) ? value : [])
          .map(function (item, index) {
            const normalized = normalizeSegmentItem(item, index);
            return {
              startMs: normalized.startMs,
              endMs: normalized.endMs,
            };
          })
          .filter(function (item) {
            return item.endMs > item.startMs;
          });
      }

      for (let changeIndex = 0; changeIndex < changes.length; changeIndex += 1) {
        const change = changes[changeIndex];
        const targets = normalizePreviewTargetSegments(change?.suggestedSegments);
        if (targets.length === 0) {
          continue;
        }
        liveRegions = readLiveWaveformRegions(iframeDocument, context.audioDurationMs);
        const waveformInfo = buildWaveformInfo(iframeDocument, liveRegions, context.audioDurationMs);
        if (!waveformInfo) {
          return {
            ok: false,
            message: PREVIEW_UNSAFE_MESSAGE,
          };
        }
        const originalRegion = matchLiveRegionForChange(liveRegions, change, usedOriginalIndexes);
        if (
          !originalRegion ||
          !originalRegion.startHandle ||
          !originalRegion.endHandle ||
          typeof originalRegion.startHandle.dispatchEvent !== "function" ||
          typeof originalRegion.endHandle.dispatchEvent !== "function"
        ) {
          return {
            ok: false,
            message: PREVIEW_LIVE_MISMATCH_MESSAGE,
          };
        }
        usedOriginalIndexes.add(originalRegion.index);

        if (
          !dispatchPointerSequence(
            originalRegion.startHandle,
            waveformInfo.drawLayer,
            buildTargetClientX(originalRegion.startMs, waveformInfo),
            buildTargetClientX(targets[0].startMs, waveformInfo),
            env
          )
        ) {
          return {
            ok: false,
            message: PREVIEW_UNSAFE_MESSAGE,
          };
        }
        await wait(10);

        liveRegions = readLiveWaveformRegions(iframeDocument, context.audioDurationMs);
        const resizedAfterStart = matchLiveRegionForChange(liveRegions, change, new Set());
        if (
          !resizedAfterStart ||
          !dispatchPointerSequence(
            resizedAfterStart.endHandle,
            waveformInfo.drawLayer,
            buildTargetClientX(resizedAfterStart.endMs, waveformInfo),
            buildTargetClientX(targets[0].endMs, waveformInfo),
            env
          )
        ) {
          return {
            ok: false,
            message: PREVIEW_UNSAFE_MESSAGE,
          };
        }
        await wait(10);

        liveRegions = readLiveWaveformRegions(iframeDocument, context.audioDurationMs);
        const adjustedRegion = matchLiveRegionForChange(liveRegions, change, new Set());
        if (!adjustedRegion || !hasApproxRangeMatch(adjustedRegion, targets[0], APPLY_TOLERANCE_MS)) {
          return {
            ok: false,
            message: PREVIEW_LIVE_MISMATCH_MESSAGE,
          };
        }

        if (targets.length > 1) {
          if (!splitButton || typeof splitButton.click !== "function") {
            return {
              ok: false,
              message: PREVIEW_UNSAFE_MESSAGE,
            };
          }
          splitButton.click();
        }

        for (let targetIndex = 1; targetIndex < targets.length; targetIndex += 1) {
          const target = targets[targetIndex];
          liveRegions = readLiveWaveformRegions(iframeDocument, context.audioDurationMs);
          const currentWaveformInfo = buildWaveformInfo(
            iframeDocument,
            liveRegions,
            context.audioDurationMs
          );
          if (!currentWaveformInfo) {
            return {
              ok: false,
              message: PREVIEW_UNSAFE_MESSAGE,
            };
          }
          const knownKeys = new Set(
            liveRegions.map(function (region) {
              return normalizeText(region.dataId) || "i:" + String(region.index);
            })
          );
          if (
            !dispatchPointerSequence(
              currentWaveformInfo.drawLayer,
              currentWaveformInfo.drawLayer,
              buildTargetClientX(target.startMs, currentWaveformInfo),
              buildTargetClientX(target.endMs, currentWaveformInfo),
              env
            )
          ) {
            return {
              ok: false,
              message: PREVIEW_UNSAFE_MESSAGE,
            };
          }
          await wait(10);
          liveRegions = readLiveWaveformRegions(iframeDocument, context.audioDurationMs);
          const createdRegion = liveRegions.find(function (region) {
            const key = normalizeText(region.dataId) || "i:" + String(region.index);
            return !knownKeys.has(key) && hasApproxRangeMatch(region, target, APPLY_TOLERANCE_MS);
          });
          if (!createdRegion) {
            return {
              ok: false,
              message: PREVIEW_LIVE_MISMATCH_MESSAGE,
            };
          }
        }
      }

      const expectedFinalSegments = normalizePreviewTargetSegments(source.proposedSegments);
      const finalLiveRegions = readLiveWaveformRegions(iframeDocument, context.audioDurationMs);
      if (
        expectedFinalSegments.length > 0 &&
        (finalLiveRegions.length !== expectedFinalSegments.length ||
          !expectedFinalSegments.every(function (segment, index) {
            return hasApproxRangeMatch(segment, finalLiveRegions[index], APPLY_TOLERANCE_MS);
          }))
      ) {
        return {
          ok: false,
          message: PREVIEW_LIVE_MISMATCH_MESSAGE,
        };
      }
      cachedContext = null;
      return {
        ok: true,
        appliedBy: "dom",
        message: PREVIEW_APPLY_SUCCESS_MESSAGE,
      };
    }

    async function applySegmentPreview(preview) {
      const source = preview && typeof preview === "object" ? preview : null;
      if (!source) {
        return {
          ok: false,
          message: PREVIEW_EMPTY_MESSAGE,
        };
      }
      const proposedSegments = Array.isArray(source.proposedSegments) ? source.proposedSegments : [];
      if (proposedSegments.length === 0) {
        return {
          ok: false,
          message: PREVIEW_NOTHING_TO_APPLY_MESSAGE,
        };
      }
      const changes = (Array.isArray(source.changes) ? source.changes : [])
        .slice()
        .sort(function (left, right) {
          return (
            Number(left?.originalStartMs || 0) - Number(right?.originalStartMs || 0) ||
            Number(left?.sourceSegmentNumber || 0) - Number(right?.sourceSegmentNumber || 0)
          );
        });
      if (normalizeText(source.selectionKey) && isLiveSelectionStale(source.selectionKey, env)) {
        return {
          ok: false,
          message: PREVIEW_STALE_MESSAGE,
        };
      }
      const context = await getEditorContext({ force: true });
      if (
        normalizeText(source.selectedEntryName) &&
        normalizeText(source.selectedEntryName) !== normalizeText(context.selectedEntry?.name)
      ) {
        return {
          ok: false,
          message: PREVIEW_STALE_MESSAGE,
        };
      }
      let requestError = null;
      try {
        return await applySegmentPreviewByRequest(source, context);
      } catch (error) {
        requestError = error;
      }
      if (
        requestError &&
        (requestError.message === PREVIEW_DUPLICATE_UNIQUE_ID_MESSAGE ||
          requestError.message === PREVIEW_DIRECT_SAVE_DUPLICATE_UNIQUE_ID_MESSAGE)
      ) {
        return {
          ok: false,
          message: requestError.message,
        };
      }
      const canFallbackToDom =
        normalizeText(source?.meta?.previewMode) !== "whole-audio-fallback" &&
        source?.meta?.applyAllowed !== false &&
        changes.length > 0;
      if (canFallbackToDom) {
        const domResult = await applySegmentPreviewByDom(source, context, changes);
        return domResult;
      }
      return {
        ok: false,
        message:
          requestError && requestError.message
            ? requestError.message
            : PREVIEW_UNSAFE_MESSAGE,
      };
    }

    async function fillUnresolvedSegmentsValid() {
      const context = await getEditorContext({ force: true });
      const annos = await fetchJson(ANNOS_PATH, buildAnnosQuery(context), env.fetch);
      const summary = summarizeInstanceValidity(annos);
      if (summary.stats.total <= 0) {
        return {
          ok: false,
          message: "未读取到当前音频的段级标注数据，已停止补写。",
          filledCount: 0,
          stats: summary.stats,
          processedIndexes: [],
        };
      }
      const segmentNodes = readSegmentListNodes(env);
      if (segmentNodes.length < summary.stats.total) {
        return {
          ok: false,
          message:
            "左侧段落编号与 annotation/annos 数量不一致，已停止补写。 " +
            formatValidityStats(summary.stats) +
            "。",
          filledCount: 0,
          stats: summary.stats,
          processedIndexes: [],
        };
      }
      if (summary.stats.missing === 0) {
        return {
          ok: true,
          message: formatValidityStats(summary.stats) + "；无需补写。",
          filledCount: 0,
          stats: summary.stats,
        };
      }
      const processedIndexes = [];
      let filledCount = 0;
      for (let index = 0; index < summary.missingIndexes.length; index += 1) {
        const targetIndex = summary.missingIndexes[index];
        const switched = await focusSegmentIndex(targetIndex, env);
        if (!switched) {
          return {
            ok: false,
            message:
              "第 " +
              String(targetIndex) +
              " 段切换失败，已补写 " +
              String(filledCount) +
              " 段。" +
              formatValidityStats(summary.stats) +
              "。",
            filledCount,
            failedIndex: targetIndex,
            stats: summary.stats,
            processedIndexes,
          };
        }
        const result = await setCurrentValidity(true);
        if (!result.ok) {
          return {
            ok: false,
            message:
              "第 " +
              String(targetIndex) +
              " 段设为 Valid 失败，已补写 " +
              String(filledCount) +
              " 段。" +
              formatValidityStats(summary.stats) +
              "。",
            filledCount,
            failedIndex: targetIndex,
            stats: summary.stats,
            processedIndexes,
          };
        }
        processedIndexes.push(targetIndex);
        if (result.skipped !== true) {
          filledCount += 1;
        }
      }
      return {
        ok: true,
        message:
          "当前音频共 " +
          String(summary.stats.total) +
          " 段：已填 Valid " +
          String(summary.stats.valid) +
          " 段，已填 Invalid " +
          String(summary.stats.invalid) +
          " 段，补写 " +
          String(filledCount) +
          " 段。",
        filledCount,
        stats: summary.stats,
        processedIndexes,
      };
    }

    return {
      getEditorContext,
      getBatchSegments,
      getLiveSelectionSnapshot: function () {
        return getLiveSelectionSnapshot(env.document);
      },
      isEditorPage,
      applyBatchTextRecommendations,
      setCurrentValidity,
      applyCommonLabel: function (labelText) {
        return applyCommonLabel(labelText, env);
      },
      fillCurrentSegmentRecommendation,
      fillCurrentSegmentField,
      applySegmentPreview,
      fillUnresolvedSegmentsValid,
    };
  }

  const api = {
    createRuntime,
    isEditorPage,
    MISSING_AUDIO_MESSAGE,
    parseEditorQuery,
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouDataApi = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
