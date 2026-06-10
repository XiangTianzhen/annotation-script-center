(function () {
  const META_PATH = "/httpapi/annotation/meta";
  const USER_META_PATH = "/httpapi/user/meta";
  const ANNOS_PATH = "/httpapi/annotation/annos";
  const OBSERVER_SOURCE = "ASR_EDGE_DATABAKER_CVPC_LIUZHOU_AUDIO_OBSERVER";
  const OBSERVER_MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_AUDIO_MAPPING";
  const OBSERVER_META_MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_META_SNAPSHOT";
  const MISSING_AUDIO_MESSAGE =
    "未拿到当前音频签名 URL，请先点击当前音频或播放一次后重试；如仍失败请刷新页面。";
  const VALID_LABELS = ["是（Valid）", "是(Valid)", "Valid"];
  const INVALID_LABELS = ["否（Invalid）", "否(Invalid)", "Invalid"];
  const APPLY_TOLERANCE_MS = 80;
  const PREVIEW_STALE_MESSAGE = "当前音频或段选择已变化，旧画段建议已失效，请重新生成。";
  const PREVIEW_LIVE_MISMATCH_MESSAGE = "当前页面分段状态已变化，旧画段建议已失效，请重新生成。";
  const PREVIEW_EMPTY_MESSAGE = "当前还没有可应用的画段建议，请先生成画段建议。";
  const PREVIEW_NOTHING_TO_APPLY_MESSAGE = "当前音频没有需要应用的拆分建议。";
  const PREVIEW_READONLY_MESSAGE =
    "当前整条音频预览暂不支持自动应用，请人工参考后手动画段。";
  const PREVIEW_UNSAFE_MESSAGE = "未检测到稳定的波形画段区域或拆分控件，请人工处理当前建议。";
  const PREVIEW_APPLY_SUCCESS_MESSAGE = "建议已画到页面，请人工复核后点击平台保存。";

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

  function getEnvironment(deps) {
    const source = deps && typeof deps === "object" ? deps : {};
    return {
      document: source.document || globalThis.document,
      fetch: source.fetch || globalThis.fetch,
      HTMLElement: source.HTMLElement || globalThis.HTMLElement,
      HTMLInputElement: source.HTMLInputElement || globalThis.HTMLInputElement,
      HTMLTextAreaElement: source.HTMLTextAreaElement || globalThis.HTMLTextAreaElement,
      location: source.location || globalThis.location || {},
      performance: source.performance || globalThis.performance,
      window: source.window || globalThis.window || globalThis,
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

  async function fetchJson(pathname, query, fetchImpl) {
    const params = query instanceof URLSearchParams ? query : buildMetaQuery(query);
    const url = pathname + (String(params || "").trim() ? "?" + String(params) : "");
    const request = fetchImpl || globalThis.fetch;
    const response = await request(url, {
      credentials: "include",
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
    const candidates = Array.from(doc.querySelectorAll("body *"))
      .map(function (node) {
        return normalizeText(node.textContent || "");
      })
      .filter(function (text) {
        return /\.mp3$/i.test(text);
      });
    return candidates[0] || "";
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
      try {
        const annos = await fetchJson(
          ANNOS_PATH,
          buildAnnosQueryFromParts(query, selectedEntry),
          env.fetch
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
      };
      return cachedContext;
    }

    async function getEditorContext(options) {
      const force = options && options.force === true;
      return loadContext(force);
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
          message: "当前段已切换，旧推荐已失效，请重新生成当前段 AI 推荐。",
        };
      }
      const dialectField = findFieldTarget(["标注文本", "柳州话", "转写文本"], env);
      const mandarinField = findFieldTarget(["普通话顺滑", "普通话", "顺滑"], env);
      const dialectText = String(
        source.refinedDialectText || source.dialectText || source.audioDialectText || ""
      );
      const mandarinText = String(
        source.refinedMandarinText || source.mandarinText || source.audioMandarinText || ""
      );
      const wroteDialect = dialectText
        ? setTextFieldValue(dialectField, dialectText, env)
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
          message: "当前段已切换，旧推荐已失效，请重新生成当前段 AI 推荐。",
        };
      }
      const targetField = normalizeText(source.targetField).toLowerCase();
      const text = String(source.text || "");
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
      const wrote = setTextFieldValue(field, text, env);
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

    async function applySegmentPreview(preview) {
      const source = preview && typeof preview === "object" ? preview : null;
      if (!source) {
        return {
          ok: false,
          message: PREVIEW_EMPTY_MESSAGE,
        };
      }
      if (
        source?.meta?.applyAllowed === false ||
        normalizeText(source?.meta?.previewMode) === "whole-audio-fallback"
      ) {
        return {
          ok: false,
          message: PREVIEW_READONLY_MESSAGE,
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
      if (changes.length === 0) {
        return {
          ok: false,
          message: PREVIEW_NOTHING_TO_APPLY_MESSAGE,
        };
      }
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
        message: PREVIEW_APPLY_SUCCESS_MESSAGE,
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
      getLiveSelectionSnapshot: function () {
        return getLiveSelectionSnapshot(env.document);
      },
      isEditorPage,
      setCurrentValidity,
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
