(function () {
  const OBSERVER_SOURCE = "ASR_EDGE_BYTEDANCE_AIDP_SUZHOU_OBSERVER";
  const RECEIVE_TYPE = "BYTEDANCE_AIDP_SUZHOU_RECEIVE_SNAPSHOT";
  const SUBMIT_TYPE = "BYTEDANCE_AIDP_SUZHOU_SUBMIT_SNAPSHOT";
  const APPLY_SUCCESS_MESSAGE = "已通过平台暂存接口应用分段建议，请刷新页面复核。";
  const FILL_LANGUAGE_SUCCESS_MESSAGE = "已通过平台暂存接口填充空语言种类，请刷新页面复核。";
  const FILL_LANGUAGE_EMPTY_MESSAGE = "当前没有空的语言种类需要填充。";
  const WRITE_CURRENT_TEXT_SUCCESS_MESSAGE =
    "已通过平台暂存接口写回当前段普通话听写稿，请刷新页面复核。";
  const WRITE_BATCH_TEXT_SUCCESS_MESSAGE =
    "已通过平台暂存接口批量写回普通话听写稿，请刷新页面复核。";
  const WRITE_CURRENT_TEXT_SKIP_EXISTING_MESSAGE = "当前段 AI 结果为空，已保留原有文本。";
  const WRITE_CURRENT_TEXT_SKIP_EMPTY_MESSAGE = "当前段 AI 结果为空，未写入任何文本。";
  const WRITE_BATCH_TEXT_EMPTY_MESSAGE = "当前没有可写回的普通话听写稿。";
  const PREVIEW_EMPTY_MESSAGE = "当前还没有可应用的分段建议。";
  const PREVIEW_STALE_MESSAGE = "当前页面分段状态已变化，旧分段建议已失效，请重新生成。";
  const UNSAFE_TABLE_MESSAGE = "当前分段表里已有文本或语音种类，自动应用可能覆盖现有标注。";
  const SUBMIT_AUTH_MISSING_MESSAGE =
    "未获取到平台暂存请求的访问凭据，请刷新页面或手动暂存一次后重试。";
  const DETAIL_CONTEXT_MISSING_MESSAGE = "当前页详情上下文尚未就绪，请刷新后重试。";
  const ACTIVE_SEGMENT_MISSING_MESSAGE = "请先在当前题里激活要识别的段。";
  const KNOWN_REGION_FIELDS = new Set(["no", "id", "start", "end", "disabled", "txt", "ms"]);

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function toFiniteNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function parseJsonSafely(value, fallback) {
    if (!value) {
      return fallback;
    }
    if (typeof value === "object") {
      return value;
    }
    try {
      return JSON.parse(String(value));
    } catch (_error) {
      return fallback;
    }
  }

  function getUrl(rawUrl, locationLike) {
    try {
      return new URL(
        String(rawUrl || ""),
        locationLike?.href || "https://aidp.bytedance.com/"
      );
    } catch (_error) {
      return null;
    }
  }

  function queryAll(root, selector) {
    if (!root || typeof root.querySelectorAll !== "function") {
      return [];
    }
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (_error) {
      return [];
    }
  }

  function getNodeText(node) {
    return normalizeText(node?.textContent || node?.innerText || "");
  }

  function secondsToMs(value) {
    return Math.max(0, Math.round(toFiniteNumber(value, 0) * 1000));
  }

  function msToSeconds(value) {
    return Number((Math.max(0, Math.round(toFiniteNumber(value, 0))) / 1000).toFixed(3));
  }

  function buildRegionId(index) {
    return (
      "region_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8) +
      "_" +
      String(index + 1)
    );
  }

  function normalizeRegion(item, index) {
    const source = item && typeof item === "object" ? item : {};
    const startMs = secondsToMs(source.start);
    const endMs = Math.max(startMs, secondsToMs(source.end));
    return {
      regionId: normalizeText(source.id),
      segmentNumber: Math.max(1, Math.round(toFiniteNumber(source.no, index + 1))),
      startMs: startMs,
      endMs: endMs,
      disabled: source.disabled === true,
      text: normalizeText(source.txt),
      language: normalizeText(source.ms),
      raw: clone(source),
    };
  }

  function normalizeRegions(value) {
    return (Array.isArray(value) ? value : [])
      .map(normalizeRegion)
      .filter(function (item) {
        return item.endMs > item.startMs;
      })
      .sort(function (left, right) {
        return left.startMs - right.startMs;
      });
  }

  function buildRegionSignature(regions) {
    return (Array.isArray(regions) ? regions : [])
      .map(function (item) {
        return [
          item.segmentNumber,
          item.startMs,
          item.endMs,
          normalizeText(item.text),
          normalizeText(item.language),
        ].join(":");
      })
      .join("|");
  }

  function extractReceiveItems(response) {
    if (Array.isArray(response?.Items)) {
      return response.Items;
    }
    if (Array.isArray(response?.Data?.Items)) {
      return response.Data.Items;
    }
    if (Array.isArray(response?.data?.items)) {
      return response.data.items;
    }
    return [];
  }

  function parseReceiveSnapshot(payload) {
    const response = payload?.response || payload?.Response || payload || {};
    const items = extractReceiveItems(response);
    const firstItem = items[0] && typeof items[0] === "object" ? items[0] : {};
    const item = firstItem.Item && typeof firstItem.Item === "object" ? firstItem.Item : {};
    const tempAnswerWrapper =
      firstItem.TempAnswer && typeof firstItem.TempAnswer === "object" ? firstItem.TempAnswer : {};
    const itemContent = parseJsonSafely(item.Content, {});
    const tempAnswer = parseJsonSafely(tempAnswerWrapper.Content, {});
    const currentRegions = normalizeRegions(
      tempAnswer?.data?.regions || tempAnswer?.dataMap?.regions || []
    );
    return {
      at: Date.now(),
      rawResponse: clone(response),
      itemId: normalizeText(item.ItemID || tempAnswer?.itemID),
      entryId: normalizeText(itemContent?.id || tempAnswer?.item?.id),
      templateID: normalizeText(tempAnswer?.templateID),
      audioUrl: normalizeText(itemContent?.audio || tempAnswer?.item?.audio),
      itemContent: itemContent && typeof itemContent === "object" ? itemContent : {},
      tempAnswer: tempAnswer && typeof tempAnswer === "object" ? tempAnswer : {},
      currentSegments: currentRegions,
      currentSignature: buildRegionSignature(currentRegions),
    };
  }

  function sanitizeSubmitHeaders(headers) {
    const source = headers && typeof headers === "object" ? headers : {};
    const result = {};
    ["accept", "content-type", "x-secsdk-csrf-token"].forEach(function (name) {
      const value = normalizeText(source[name] || source[name.toLowerCase()] || source[name.toUpperCase()]);
      if (value) {
        result[name] = value;
      }
    });
    if (!result["content-type"]) {
      result["content-type"] = "application/json";
    }
    return result;
  }

  function parseSubmitSnapshot(payload) {
    const body = parseJsonSafely(payload?.body, {});
    const firstAnswer = Array.isArray(body?.AuditAnswers) ? body.AuditAnswers[0] || {} : {};
    const tempAnswer = parseJsonSafely(firstAnswer?.Content, {});
    return {
      at: Date.now(),
      url: normalizeText(payload?.url),
      headers: sanitizeSubmitHeaders(payload?.headers),
      body: body && typeof body === "object" ? body : {},
      tempAnswer: tempAnswer && typeof tempAnswer === "object" ? tempAnswer : {},
      itemId: normalizeText(firstAnswer?.ItemID || tempAnswer?.itemID),
    };
  }

  function resolveDetailRoute(locationLike) {
    const pathname = normalizeText(locationLike?.pathname || "");
    const matched = pathname.match(/^\/management\/task-v2\/([^/]+)\/mark-v3\/([^/?#]+)/i);
    const searchParams = new URLSearchParams(String(locationLike?.search || ""));
    return {
      taskId: normalizeText(matched?.[1]),
      markIndex: normalizeText(matched?.[2]),
      templateID: normalizeText(searchParams.get("templateID")),
      templateType: normalizeText(searchParams.get("templateType")),
      fromPathname: normalizeText(searchParams.get("from_pathname")),
    };
  }

  function findSegmentTableRoot(documentLike) {
    const tables = queryAll(documentLike, "table");
    for (let index = 0; index < tables.length; index += 1) {
      const text = getNodeText(tables[index]);
      if (
        text.includes("序号") &&
        text.includes("区间") &&
        text.includes("转写文本") &&
        text.includes("语音种类")
      ) {
        return tables[index];
      }
    }
    const containers = queryAll(documentLike, "div,section,article");
    for (let index = 0; index < containers.length; index += 1) {
      const text = getNodeText(containers[index]);
      if (
        text.includes("序号") &&
        text.includes("区间") &&
        text.includes("转写文本") &&
        text.includes("语音种类")
      ) {
        return containers[index];
      }
    }
    return null;
  }

  function normalizeLanguageValue(selectNode) {
    if (!selectNode) {
      return "";
    }
    const selectedText =
      normalizeText(selectNode.value) ||
      normalizeText(selectNode.selectedOptions?.[0]?.textContent) ||
      normalizeText(selectNode.options?.[selectNode.selectedIndex]?.textContent);
    if (!selectedText || selectedText === "请选择") {
      return "";
    }
    return selectedText;
  }

  function defaultReadCurrentTableState(documentLike) {
    const tableRoot = findSegmentTableRoot(documentLike);
    if (!tableRoot) {
      return {
        rows: [],
        activeSegmentNumber: 0,
        hasUnsafeData: false,
        unsafeReason: "",
      };
    }
    const textareas = queryAll(tableRoot, "textarea");
    const selects = queryAll(tableRoot, "select");
    const totalRows = Math.max(textareas.length, selects.length);
    const rows = [];
    for (let index = 0; index < totalRows; index += 1) {
      rows.push({
        segmentNumber: index + 1,
        text: normalizeText(textareas[index]?.value || textareas[index]?.textContent),
        language: normalizeLanguageValue(selects[index]),
      });
    }
    const hasUnsafeData = rows.some(function (row) {
      return Boolean(normalizeText(row.text) || normalizeText(row.language));
    });
    return {
      rows: rows,
      activeSegmentNumber: resolveActiveSegmentNumber(tableRoot, rows, documentLike),
      hasUnsafeData: hasUnsafeData,
      unsafeReason: hasUnsafeData ? UNSAFE_TABLE_MESSAGE : "",
    };
  }

  function resolveActiveSegmentNumber(tableRoot, rows, documentLike) {
    const tableRows = queryAll(tableRoot, "tr");
    const activeElement = documentLike?.activeElement || null;
    const activeRow =
      activeElement && typeof activeElement.closest === "function"
        ? activeElement.closest("tr")
        : null;
    if (activeRow) {
      const rowIndex = tableRows.indexOf(activeRow);
      if (rowIndex >= 0 && rows[rowIndex]) {
        return Number(rows[rowIndex].segmentNumber || rowIndex + 1) || 0;
      }
    }
    const selectedRow = tableRows.find(function (node) {
      const className = normalizeText(node?.className || "").toLowerCase();
      return (
        normalizeText(node?.getAttribute?.("aria-selected")).toLowerCase() === "true" ||
        normalizeText(node?.getAttribute?.("data-selected")).toLowerCase() === "true" ||
        className.includes("active") ||
        className.includes("selected") ||
        className.includes("current")
      );
    });
    if (selectedRow) {
      const rowIndex = tableRows.indexOf(selectedRow);
      if (rowIndex >= 0 && rows[rowIndex]) {
        return Number(rows[rowIndex].segmentNumber || rowIndex + 1) || 0;
      }
    }
    if (rows.length === 1) {
      return Number(rows[0].segmentNumber || 1) || 1;
    }
    return Math.max(0, Math.round(Number(documentLike?.activeSegmentNumber || 0)) || 0);
  }

  function hasMeaningfulRegionExtras(region) {
    const raw = region?.raw && typeof region.raw === "object" ? region.raw : {};
    return Object.keys(raw).some(function (key) {
      if (KNOWN_REGION_FIELDS.has(String(key))) {
        return false;
      }
      const value = raw[key];
      if (value === null || value === undefined) {
        return false;
      }
      if (typeof value === "string") {
        return normalizeText(value).length > 0;
      }
      if (typeof value === "number") {
        return Number.isFinite(value);
      }
      if (typeof value === "boolean") {
        return value === true;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === "object") {
        return Object.keys(value).length > 0;
      }
      return false;
    });
  }

  function hasStructuredAnswerValues(answer) {
    const tempAnswer = answer && typeof answer === "object" ? answer : {};
    const regionGroups = [
      normalizeRegions(tempAnswer?.data?.regions || []),
      normalizeRegions(tempAnswer?.dataMap?.regions || []),
    ];
    if (
      regionGroups.some(function (items) {
        return items.some(function (item) {
          return (
            normalizeText(item.text).length > 0 ||
            normalizeText(item.language).length > 0 ||
            hasMeaningfulRegionExtras(item)
          );
        });
      })
    ) {
      return true;
    }
    const candidateGroups = [
      tempAnswer?.data?.regionsResult,
      tempAnswer?.dataMap?.regionsResult,
    ];
    return candidateGroups.some(function (group) {
      return (Array.isArray(group) ? group : []).some(function (item) {
        if (!item || typeof item !== "object") {
          return normalizeText(item).length > 0;
        }
        return Object.keys(item).some(function (key) {
          return normalizeText(item[key]).length > 0;
        });
      });
    });
  }

  function resolveCurrentAnswerSnapshot(receiveSnapshot, submitSnapshot) {
    if (
      submitSnapshot &&
      submitSnapshot.tempAnswer &&
      Object.keys(submitSnapshot.tempAnswer).length > 0 &&
      Number(submitSnapshot.at || 0) >= Number(receiveSnapshot?.at || 0)
    ) {
      return submitSnapshot.tempAnswer;
    }
    return receiveSnapshot?.tempAnswer || {};
  }

  function resolveCurrentSegments(receiveSnapshot, submitSnapshot) {
    const answer = resolveCurrentAnswerSnapshot(receiveSnapshot, submitSnapshot);
    return normalizeRegions(answer?.data?.regions || answer?.dataMap?.regions || []);
  }

  function buildCurrentContext(receiveSnapshot, submitSnapshot, route, tableState) {
    const currentAnswer = resolveCurrentAnswerSnapshot(receiveSnapshot, submitSnapshot);
    const currentSegments = resolveCurrentSegments(receiveSnapshot, submitSnapshot);
    const durationSeconds = toFiniteNumber(
      currentAnswer?.data?.duration,
      toFiniteNumber(currentAnswer?.dataMap?.duration, 0)
    );
    const activeSegmentNumber = Math.max(
      0,
      Math.round(Number(tableState?.activeSegmentNumber || 0)) || 0
    );
    const activeSegment =
      currentSegments.find(function (item) {
        return Number(item.segmentNumber || 0) === activeSegmentNumber;
      }) || null;
    return {
      taskId: normalizeText(submitSnapshot?.body?.TaskID || route?.taskId),
      nodeId: normalizeText(submitSnapshot?.body?.NodeID || route?.markIndex || "1"),
      stagingTime: normalizeText(submitSnapshot?.body?.StagingTime || "604800"),
      itemId: normalizeText(
        submitSnapshot?.itemId || receiveSnapshot?.itemId || currentAnswer?.itemID
      ),
      entryId: normalizeText(
        receiveSnapshot?.entryId || currentAnswer?.item?.id || receiveSnapshot?.itemContent?.id
      ),
      templateID: normalizeText(
        currentAnswer?.templateID || receiveSnapshot?.templateID || route?.templateID
      ),
      audioUrl: normalizeText(
        receiveSnapshot?.audioUrl || receiveSnapshot?.itemContent?.audio || currentAnswer?.item?.audio
      ),
      audioDurationMs: Math.max(0, Math.round(durationSeconds * 1000)),
      discard: normalizeText(
        currentAnswer?.data?.discard || currentAnswer?.dataMap?.discard || "保留"
      ),
      currentSegments: currentSegments,
      currentSignature: buildRegionSignature(currentSegments),
      activeSegmentNumber: activeSegmentNumber,
      activeSegment: activeSegment,
      selectionKey: normalizeText(
        submitSnapshot?.itemId || receiveSnapshot?.itemId || currentAnswer?.itemID
      ),
      tempAnswer: currentAnswer,
      tableState: tableState,
    };
  }

  function buildUnsafeReason(context) {
    if (context?.tableState?.hasUnsafeData) {
      return normalizeText(context.tableState.unsafeReason) || UNSAFE_TABLE_MESSAGE;
    }
    if (hasStructuredAnswerValues(context?.tempAnswer)) {
      return UNSAFE_TABLE_MESSAGE;
    }
    return "";
  }

  function normalizePreviewSourceSegments(value) {
    return (Array.isArray(value) ? value : [])
      .map(function (item, index) {
        const source = item && typeof item === "object" ? item : {};
        return {
          regionId: normalizeText(source.regionId || source.uniqueId || source.id),
          segmentNumber: Math.max(
            1,
            Math.round(toFiniteNumber(source.segmentNumber, source.sourceSegmentNumber || index + 1))
          ),
          startMs: Math.max(0, Math.round(toFiniteNumber(source.startMs, 0))),
          endMs: Math.max(0, Math.round(toFiniteNumber(source.endMs, 0))),
          text: normalizeText(source.text),
          language: normalizeText(source.language),
        };
      })
      .filter(function (item) {
        return item.endMs > item.startMs;
      });
  }

  function normalizeProposedSegments(value) {
    return (Array.isArray(value) ? value : [])
      .map(function (item, index) {
        const source = item && typeof item === "object" ? item : {};
        const startMs = Math.max(0, Math.round(toFiniteNumber(source.startMs, 0)));
        const endMs = Math.max(startMs, Math.round(toFiniteNumber(source.endMs, startMs)));
        return {
          index: index,
          startMs: startMs,
          endMs: endMs,
        };
      })
      .filter(function (item) {
        return item.endMs > item.startMs;
      })
      .sort(function (left, right) {
        return left.startMs - right.startMs;
      });
  }

  function buildUpdatedRegions(proposedSegments) {
    return normalizeProposedSegments(proposedSegments).map(function (item, index) {
      return {
        no: index + 1,
        id: buildRegionId(index),
        start: msToSeconds(item.startMs),
        end: msToSeconds(item.endMs),
        disabled: false,
        ms: "目标方言",
      };
    });
  }

  function buildValidDurationSeconds(regions) {
    const totalMs = (Array.isArray(regions) ? regions : []).reduce(function (sum, item) {
      return sum + Math.max(0, secondsToMs(item.end) - secondsToMs(item.start));
    }, 0);
    return Number((totalMs / 1000).toFixed(3));
  }

  function updateTempAnswerWithRegions(answer, regions, context) {
    const nextAnswer = clone(answer && typeof answer === "object" ? answer : {}) || {};
    if (!nextAnswer.data || typeof nextAnswer.data !== "object") {
      nextAnswer.data = {};
    }
    if (!nextAnswer.dataMap || typeof nextAnswer.dataMap !== "object") {
      nextAnswer.dataMap = {};
    }
    nextAnswer.templateID = normalizeText(nextAnswer.templateID || context.templateID);
    nextAnswer.itemID = normalizeText(nextAnswer.itemID || context.itemId);
    nextAnswer.isAbandoned = nextAnswer.isAbandoned === true;
    nextAnswer.data.regions = clone(regions);
    nextAnswer.dataMap.regions = clone(regions);
    if (!normalizeText(nextAnswer.data.discard)) {
      nextAnswer.data.discard = normalizeText(context.discard || "保留");
    }
    if (!normalizeText(nextAnswer.dataMap.discard)) {
      nextAnswer.dataMap.discard = normalizeText(context.discard || "保留");
    }
    const durationSeconds =
      toFiniteNumber(nextAnswer.data.duration, NaN) ||
      toFiniteNumber(nextAnswer.dataMap.duration, NaN) ||
      Number((Math.max(...regions.map(function (item) {
        return Number(item.end || 0);
      }), 0)).toFixed(3));
    nextAnswer.data.duration = durationSeconds;
    nextAnswer.dataMap.duration = durationSeconds;
    const validDurationSeconds = buildValidDurationSeconds(regions);
    nextAnswer.data.valid_duration = validDurationSeconds;
    nextAnswer.dataMap.valid_duration = validDurationSeconds;
    return nextAnswer;
  }

  function fillEmptyLanguageValuesInRegions(regions, targetLanguage) {
    const source = Array.isArray(regions) ? regions : [];
    const nextRegions = source.map(function (item) {
      if (!item || typeof item !== "object") {
        return item;
      }
      const nextItem = clone(item) || {};
      const currentLanguage = normalizeText(nextItem.ms);
      if (!currentLanguage || currentLanguage === "请选择") {
        nextItem.ms = targetLanguage;
      }
      return nextItem;
    });
    const filledCount = nextRegions.reduce(function (count, item, index) {
      const previous = source[index] && typeof source[index] === "object" ? source[index] : {};
      const previousLanguage = normalizeText(previous.ms);
      const nextLanguage =
        item && typeof item === "object" ? normalizeText(item.ms) : "";
      return (!previousLanguage || previousLanguage === "请选择") &&
        nextLanguage === targetLanguage
        ? count + 1
        : count;
    }, 0);
    return {
      regions: nextRegions,
      filledCount: filledCount,
    };
  }

  function updateTempAnswerWithFilledLanguages(answer, context, targetLanguage) {
    const nextAnswer = clone(answer && typeof answer === "object" ? answer : {}) || {};
    if (!nextAnswer.data || typeof nextAnswer.data !== "object") {
      nextAnswer.data = {};
    }
    if (!nextAnswer.dataMap || typeof nextAnswer.dataMap !== "object") {
      nextAnswer.dataMap = {};
    }
    nextAnswer.templateID = normalizeText(nextAnswer.templateID || context.templateID);
    nextAnswer.itemID = normalizeText(nextAnswer.itemID || context.itemId);
    nextAnswer.isAbandoned = nextAnswer.isAbandoned === true;

    const baseDataRegions = Array.isArray(nextAnswer.data.regions) ? nextAnswer.data.regions : [];
    const baseDataMapRegions = Array.isArray(nextAnswer.dataMap.regions)
      ? nextAnswer.dataMap.regions
      : [];
    const primarySource = baseDataRegions.length > 0 ? baseDataRegions : baseDataMapRegions;
    const primaryResult = fillEmptyLanguageValuesInRegions(primarySource, targetLanguage);
    const dataResult =
      baseDataRegions.length > 0
        ? fillEmptyLanguageValuesInRegions(baseDataRegions, targetLanguage)
        : {
            regions: clone(primaryResult.regions),
            filledCount: primaryResult.filledCount,
          };
    const dataMapResult =
      baseDataMapRegions.length > 0
        ? fillEmptyLanguageValuesInRegions(baseDataMapRegions, targetLanguage)
        : {
            regions: clone(primaryResult.regions),
            filledCount: primaryResult.filledCount,
          };

    nextAnswer.data.regions = dataResult.regions;
    nextAnswer.dataMap.regions = dataMapResult.regions;

    return {
      nextAnswer: nextAnswer,
      filledCount: primaryResult.filledCount,
    };
  }

  function buildSubmitRequestBody(submitSnapshot, context, nextAnswer) {
    const baseBody = clone(submitSnapshot?.body || {}) || {};
    const baseAnswers = Array.isArray(baseBody.AuditAnswers) ? baseBody.AuditAnswers : [];
    const firstAnswer = Object.assign({}, baseAnswers[0] || {});
    firstAnswer.ItemID = normalizeText(firstAnswer.ItemID || context.itemId);
    firstAnswer.Content = JSON.stringify(nextAnswer);
    if (!normalizeText(firstAnswer.ControlData)) {
      firstAnswer.ControlData = JSON.stringify({
        Discard: normalizeText(context.discard) === "丢弃",
        extraAnswer: [],
      });
    }
    baseBody.AuditAnswers = [firstAnswer];
    baseBody.NodeID = normalizeText(baseBody.NodeID || context.nodeId || "1");
    baseBody.StagingTime = normalizeText(baseBody.StagingTime || context.stagingTime || "604800");
    baseBody.TaskID = normalizeText(baseBody.TaskID || context.taskId);
    return baseBody;
  }

  function normalizeRegionTextUpdates(value) {
    const updates = Array.isArray(value) ? value : [value];
    const seen = new Set();
    return updates
      .map(function (item) {
        const source = item && typeof item === "object" ? item : {};
        const segmentNumber = Math.max(0, Math.round(Number(source.segmentNumber || 0)) || 0);
        const regionId = normalizeText(source.regionId || source.id);
        const key = regionId || String(segmentNumber || "");
        if (!key || seen.has(key)) {
          return null;
        }
        seen.add(key);
        return {
          segmentNumber: segmentNumber,
          regionId: regionId,
          finalMandarinText: normalizeText(source.finalMandarinText || source.text),
        };
      })
      .filter(Boolean);
  }

  function matchRegionUpdate(region, update) {
    if (!region || !update) {
      return false;
    }
    if (update.regionId && normalizeText(region.id) === update.regionId) {
      return true;
    }
    return Number(region.no || 0) === Number(update.segmentNumber || 0);
  }

  function applyRegionTextUpdates(regions, updates) {
    const source = Array.isArray(regions) ? regions : [];
    const normalizedUpdates = normalizeRegionTextUpdates(updates);
    let writtenCount = 0;
    let skippedCount = 0;
    const nextRegions = source.map(function (item) {
      const region = item && typeof item === "object" ? clone(item) || {} : {};
      const matchedUpdate = normalizedUpdates.find(function (update) {
        return matchRegionUpdate(region, update);
      });
      if (!matchedUpdate) {
        return region;
      }
      const nextText = normalizeText(matchedUpdate.finalMandarinText);
      if (!nextText) {
        skippedCount += 1;
        return region;
      }
      region.txt = nextText;
      writtenCount += 1;
      return region;
    });
    return {
      regions: nextRegions,
      writtenCount: writtenCount,
      skippedCount: skippedCount,
    };
  }

  function updateTempAnswerWithRegionTexts(answer, context, updates) {
    const nextAnswer = clone(answer && typeof answer === "object" ? answer : {}) || {};
    if (!nextAnswer.data || typeof nextAnswer.data !== "object") {
      nextAnswer.data = {};
    }
    if (!nextAnswer.dataMap || typeof nextAnswer.dataMap !== "object") {
      nextAnswer.dataMap = {};
    }
    nextAnswer.templateID = normalizeText(nextAnswer.templateID || context.templateID);
    nextAnswer.itemID = normalizeText(nextAnswer.itemID || context.itemId);
    nextAnswer.isAbandoned = nextAnswer.isAbandoned === true;

    const baseDataRegions = Array.isArray(nextAnswer.data.regions) ? nextAnswer.data.regions : [];
    const baseDataMapRegions = Array.isArray(nextAnswer.dataMap.regions)
      ? nextAnswer.dataMap.regions
      : [];
    const primaryRegions = baseDataRegions.length > 0 ? baseDataRegions : baseDataMapRegions;
    const primaryResult = applyRegionTextUpdates(primaryRegions, updates);
    const dataResult =
      baseDataRegions.length > 0
        ? applyRegionTextUpdates(baseDataRegions, updates)
        : {
            regions: clone(primaryResult.regions),
            writtenCount: primaryResult.writtenCount,
            skippedCount: primaryResult.skippedCount,
          };
    const dataMapResult =
      baseDataMapRegions.length > 0
        ? applyRegionTextUpdates(baseDataMapRegions, updates)
        : {
            regions: clone(primaryResult.regions),
            writtenCount: primaryResult.writtenCount,
            skippedCount: primaryResult.skippedCount,
          };

    nextAnswer.data.regions = dataResult.regions;
    nextAnswer.dataMap.regions = dataMapResult.regions;
    return {
      nextAnswer: nextAnswer,
      writtenCount: primaryResult.writtenCount,
      skippedCount: primaryResult.skippedCount,
    };
  }

  async function postSubmit(fetchImpl, submitSnapshot, requestBody) {
    let response;
    try {
      response = await fetchImpl(submitSnapshot.url, {
        method: "POST",
        credentials: "include",
        headers: Object.assign(
          {
            accept: "application/json, text/plain, */*",
            "content-type": "application/json",
          },
          submitSnapshot.headers || {}
        ),
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      return {
        ok: false,
        message:
          "平台暂存请求失败：" +
          (error && error.message ? error.message : String(error || "未知错误")),
      };
    }
    const payload = await response.json().catch(function () {
      return null;
    });
    const statusCode = Number(payload?.BaseResp?.StatusCode);
    if (!response.ok || (Number.isFinite(statusCode) && statusCode !== 0)) {
      return {
        ok: false,
        message:
          normalizeText(payload?.BaseResp?.StatusMessage) ||
          normalizeText(payload?.message) ||
          "平台暂存失败。",
      };
    }
    return {
      ok: true,
      message: APPLY_SUCCESS_MESSAGE,
    };
  }

  function createRuntime(options) {
    const env = options && typeof options === "object" ? options : {};
    const windowLike = env.window || globalThis.window || null;
    const locationLike = env.location || globalThis.location || {};
    const fetchImpl = typeof env.fetch === "function" ? env.fetch : globalThis.fetch;
    const readCurrentTableState =
      typeof env.readCurrentTableState === "function"
        ? env.readCurrentTableState
        : function () {
            return defaultReadCurrentTableState(env.document || globalThis.document || null);
          };
    let receiveSnapshot = null;
    let submitSnapshot = null;

    function handleObserverMessage(event) {
      if (!event || event.origin !== locationLike.origin) {
        return;
      }
      const data = event.data || {};
      if (data.source !== OBSERVER_SOURCE) {
        return;
      }
      if (data.type === RECEIVE_TYPE) {
        receiveSnapshot = parseReceiveSnapshot(data.payload);
        return;
      }
      if (data.type === SUBMIT_TYPE) {
        submitSnapshot = parseSubmitSnapshot(data.payload);
      }
    }

    if (windowLike && typeof windowLike.addEventListener === "function") {
      windowLike.addEventListener("message", handleObserverMessage);
    }

    async function getCurrentContext() {
      const route = resolveDetailRoute(locationLike);
      const tableState = readCurrentTableState();
      const context = buildCurrentContext(receiveSnapshot, submitSnapshot, route, tableState);
      context.unsafeReason = buildUnsafeReason(context);
      return context;
    }

    async function applySegmentPreview(preview) {
      const source = preview && typeof preview === "object" ? preview : {};
      const proposedSegments = normalizeProposedSegments(source.proposedSegments);
      if (proposedSegments.length <= 0) {
        return {
          ok: false,
          message: PREVIEW_EMPTY_MESSAGE,
        };
      }
      const context = await getCurrentContext();
      if (!context.itemId || !context.tempAnswer || Object.keys(context.tempAnswer).length <= 0) {
        return {
          ok: false,
          message: DETAIL_CONTEXT_MISSING_MESSAGE,
        };
      }
      if (normalizeText(source.selectionKey) !== normalizeText(context.selectionKey)) {
        return {
          ok: false,
          message: PREVIEW_STALE_MESSAGE,
        };
      }
      if (context.unsafeReason) {
        return {
          ok: false,
          message: context.unsafeReason,
        };
      }
      const previewSignature = buildRegionSignature(
        normalizePreviewSourceSegments(source.sourceSegments)
      );
      if (previewSignature && previewSignature !== context.currentSignature) {
        return {
          ok: false,
          message: PREVIEW_STALE_MESSAGE,
        };
      }
      if (!normalizeText(submitSnapshot?.url)) {
        return {
          ok: false,
          message: SUBMIT_AUTH_MISSING_MESSAGE,
        };
      }
      const nextRegions = buildUpdatedRegions(proposedSegments);
      const nextAnswer = updateTempAnswerWithRegions(context.tempAnswer, nextRegions, context);
      const requestBody = buildSubmitRequestBody(submitSnapshot, context, nextAnswer);
      const result = await postSubmit(fetchImpl, submitSnapshot, requestBody);
      if (result.ok) {
        submitSnapshot = parseSubmitSnapshot({
          url: submitSnapshot.url,
          headers: submitSnapshot.headers,
          body: requestBody,
        });
      }
      return result;
    }

    async function clearCurrentSegments() {
      const context = await getCurrentContext();
      if (!context.itemId || !context.tempAnswer || Object.keys(context.tempAnswer).length <= 0) {
        return {
          ok: false,
          message: DETAIL_CONTEXT_MISSING_MESSAGE,
        };
      }
      if (!normalizeText(submitSnapshot?.url)) {
        return {
          ok: false,
          message: SUBMIT_AUTH_MISSING_MESSAGE,
        };
      }
      const nextAnswer = updateTempAnswerWithRegions(context.tempAnswer, [], context);
      const requestBody = buildSubmitRequestBody(submitSnapshot, context, nextAnswer);
      const result = await postSubmit(fetchImpl, submitSnapshot, requestBody);
      if (result.ok) {
        submitSnapshot = parseSubmitSnapshot({
          url: submitSnapshot.url,
          headers: submitSnapshot.headers,
          body: requestBody,
        });
      }
      return result;
    }

    async function fillEmptyRegionLanguages() {
      const context = await getCurrentContext();
      if (!context.itemId || !context.tempAnswer || Object.keys(context.tempAnswer).length <= 0) {
        return {
          ok: false,
          message: DETAIL_CONTEXT_MISSING_MESSAGE,
          filledCount: 0,
        };
      }
      if (!normalizeText(submitSnapshot?.url)) {
        return {
          ok: false,
          message: SUBMIT_AUTH_MISSING_MESSAGE,
          filledCount: 0,
        };
      }
      const fillResult = updateTempAnswerWithFilledLanguages(
        context.tempAnswer,
        context,
        "目标方言"
      );
      if (fillResult.filledCount <= 0) {
        return {
          ok: false,
          message: FILL_LANGUAGE_EMPTY_MESSAGE,
          filledCount: 0,
        };
      }
      const requestBody = buildSubmitRequestBody(submitSnapshot, context, fillResult.nextAnswer);
      const result = await postSubmit(fetchImpl, submitSnapshot, requestBody);
      if (result.ok) {
        submitSnapshot = parseSubmitSnapshot({
          url: submitSnapshot.url,
          headers: submitSnapshot.headers,
          body: requestBody,
        });
        return {
          ok: true,
          message: FILL_LANGUAGE_SUCCESS_MESSAGE,
          filledCount: fillResult.filledCount,
        };
      }
      return {
        ok: false,
        message: result.message,
        filledCount: 0,
      };
    }

    async function writeCurrentRegionText(input) {
      const source = input && typeof input === "object" ? input : {};
      const context = await getCurrentContext();
      if (!context.itemId || !context.tempAnswer || Object.keys(context.tempAnswer).length <= 0) {
        return {
          ok: false,
          message: DETAIL_CONTEXT_MISSING_MESSAGE,
          writtenCount: 0,
          skippedCount: 0,
        };
      }
      if (normalizeText(source.selectionKey) !== normalizeText(context.selectionKey)) {
        return {
          ok: false,
          message: PREVIEW_STALE_MESSAGE,
          writtenCount: 0,
          skippedCount: 0,
        };
      }
      if (!normalizeText(submitSnapshot?.url)) {
        return {
          ok: false,
          message: SUBMIT_AUTH_MISSING_MESSAGE,
          writtenCount: 0,
          skippedCount: 0,
        };
      }
      const targetSegmentNumber = Math.max(
        0,
        Math.round(Number(source.segmentNumber || context.activeSegmentNumber || 0)) || 0
      );
      if (targetSegmentNumber <= 0) {
        return {
          ok: false,
          message: ACTIVE_SEGMENT_MISSING_MESSAGE,
          writtenCount: 0,
          skippedCount: 0,
        };
      }
      const updateResult = updateTempAnswerWithRegionTexts(context.tempAnswer, context, {
        segmentNumber: targetSegmentNumber,
        finalMandarinText: source.finalMandarinText,
      });
      if (updateResult.writtenCount <= 0) {
        const targetRegion = (Array.isArray(context.tempAnswer?.data?.regions)
          ? context.tempAnswer.data.regions
          : []
        ).find(function (item) {
          return Number(item?.no || 0) === targetSegmentNumber;
        }) || null;
        const existingText = normalizeText(targetRegion?.txt);
        return {
          ok: true,
          message: existingText
            ? WRITE_CURRENT_TEXT_SKIP_EXISTING_MESSAGE
            : WRITE_CURRENT_TEXT_SKIP_EMPTY_MESSAGE,
          writtenCount: 0,
          skippedCount: updateResult.skippedCount > 0 ? updateResult.skippedCount : 1,
        };
      }
      const requestBody = buildSubmitRequestBody(submitSnapshot, context, updateResult.nextAnswer);
      const result = await postSubmit(fetchImpl, submitSnapshot, requestBody);
      if (!result.ok) {
        return {
          ok: false,
          message: result.message,
          writtenCount: 0,
          skippedCount: updateResult.skippedCount,
        };
      }
      submitSnapshot = parseSubmitSnapshot({
        url: submitSnapshot.url,
        headers: submitSnapshot.headers,
        body: requestBody,
      });
      return {
        ok: true,
        message: WRITE_CURRENT_TEXT_SUCCESS_MESSAGE,
        writtenCount: updateResult.writtenCount,
        skippedCount: updateResult.skippedCount,
      };
    }

    async function writeBatchRegionTexts(input) {
      const source = input && typeof input === "object" ? input : {};
      const context = await getCurrentContext();
      if (!context.itemId || !context.tempAnswer || Object.keys(context.tempAnswer).length <= 0) {
        return {
          ok: false,
          message: DETAIL_CONTEXT_MISSING_MESSAGE,
          writtenCount: 0,
          skippedCount: 0,
        };
      }
      if (normalizeText(source.selectionKey) !== normalizeText(context.selectionKey)) {
        return {
          ok: false,
          message: PREVIEW_STALE_MESSAGE,
          writtenCount: 0,
          skippedCount: 0,
        };
      }
      if (
        normalizeText(source.currentSignature) &&
        normalizeText(source.currentSignature) !== normalizeText(context.currentSignature)
      ) {
        return {
          ok: false,
          message: PREVIEW_STALE_MESSAGE,
          writtenCount: 0,
          skippedCount: 0,
        };
      }
      if (!normalizeText(submitSnapshot?.url)) {
        return {
          ok: false,
          message: SUBMIT_AUTH_MISSING_MESSAGE,
          writtenCount: 0,
          skippedCount: 0,
        };
      }
      const updateResult = updateTempAnswerWithRegionTexts(
        context.tempAnswer,
        context,
        source.updates
      );
      if (updateResult.writtenCount <= 0) {
        return {
          ok: true,
          message: WRITE_BATCH_TEXT_EMPTY_MESSAGE,
          writtenCount: 0,
          skippedCount: updateResult.skippedCount,
        };
      }
      const requestBody = buildSubmitRequestBody(submitSnapshot, context, updateResult.nextAnswer);
      const result = await postSubmit(fetchImpl, submitSnapshot, requestBody);
      if (!result.ok) {
        return {
          ok: false,
          message: result.message,
          writtenCount: 0,
          skippedCount: updateResult.skippedCount,
        };
      }
      submitSnapshot = parseSubmitSnapshot({
        url: submitSnapshot.url,
        headers: submitSnapshot.headers,
        body: requestBody,
      });
      return {
        ok: true,
        message: WRITE_BATCH_TEXT_SUCCESS_MESSAGE,
        writtenCount: updateResult.writtenCount,
        skippedCount: updateResult.skippedCount,
      };
    }

    function destroy() {
      if (windowLike && typeof windowLike.removeEventListener === "function") {
        windowLike.removeEventListener("message", handleObserverMessage);
      }
    }

    return {
      getCurrentContext,
      applySegmentPreview,
      clearCurrentSegments,
      fillEmptyRegionLanguages,
      writeCurrentRegionText,
      writeBatchRegionTexts,
      destroy,
    };
  }

  const api = {
    createRuntime,
    __testOnly: {
      parseReceiveSnapshot,
      parseSubmitSnapshot,
      buildRegionSignature,
      buildUpdatedRegions,
      defaultReadCurrentTableState,
      updateTempAnswerWithRegionTexts,
    },
  };

  globalThis.ASREdgeBytedanceAidpSuzhouDataApi = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
