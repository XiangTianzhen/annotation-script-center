(function () {
  const META_PATH = "/httpapi/annotation/meta";
  const VALID_LABELS = ["是（Valid）", "是(Valid)", "Valid"];
  const INVALID_LABELS = ["否（Invalid）", "否(Invalid)", "Invalid"];

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function isEditorPage() {
    return (
      location.hostname === "cvpc.data-baker.com" &&
      String(location.pathname || "").toLowerCase() === "/app/editor/asr/"
    );
  }

  function parseEditorQuery() {
    const query = new URLSearchParams(location.search || "");
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

  async function fetchJson(pathname, query) {
    const params = query instanceof URLSearchParams ? query : buildMetaQuery(query);
    const url = pathname + (String(params || "").trim() ? "?" + String(params) : "");
    const response = await fetch(url, {
      credentials: "include",
      method: "GET",
    });
    const payload = await response.json().catch(function () {
      return null;
    });
    if (!response.ok || !payload || Number(payload.code) !== 0) {
      throw new Error("CVPC 读取接口失败：" + pathname);
    }
    return payload.data || {};
  }

  function extractAudioUrl(entry) {
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

  function extractVisibleEntryName() {
    const candidates = Array.from(document.querySelectorAll("body *"))
      .map(function (node) {
        return normalizeText(node.textContent || "");
      })
      .filter(function (text) {
        return /\.mp3$/i.test(text);
      });
    return candidates[0] || "";
  }

  function getSelectedEntry(meta) {
    const entries = Array.isArray(meta?.datas) ? meta.datas : [];
    const visibleName = extractVisibleEntryName();
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

  function findLabelTarget(labelMatchers) {
    const items = Array.from(document.querySelectorAll(".el-form-item, .ant-form-item, label, div"));
    for (let index = 0; index < items.length; index += 1) {
      const node = items[index];
      const text = normalizeText(node.textContent || "");
      const matched = labelMatchers.find(function (matcher) {
        return text.indexOf(matcher) >= 0;
      });
      if (!matched) {
        continue;
      }
      const scope = node.closest(".el-form-item, .ant-form-item, .el-card, .ant-card, body") || node;
      const field = scope.querySelector("textarea, input[type='text'], input:not([type])");
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        return field;
      }
    }
    return null;
  }

  function setTextFieldValue(field, value) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      return false;
    }
    field.focus();
    field.value = String(value || "");
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.blur();
    return true;
  }

  function clickLabelByTexts(labelTexts) {
    const all = Array.from(document.querySelectorAll("label, span, div"));
    const target = all.find(function (node) {
      const text = normalizeText(node.textContent || "");
      return labelTexts.indexOf(text) >= 0;
    });
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    target.click();
    return true;
  }

  function collectFieldContext(template) {
    const fields = mapTemplateFieldNames(template);
    return {
      attrs: fields.attrs,
      entryAttrs: fields.entryAttrs,
      momentAttrs: fields.momentAttrs,
      dialectText: findLabelTarget(["标注文本", "柳州话", "转写文本"])?.value || "",
      mandarinText: findLabelTarget(["普通话顺滑", "普通话", "顺滑"])?.value || "",
    };
  }

  function createRuntime() {
    let cachedMeta = null;
    let cachedContext = null;

    async function loadContext(force) {
      if (!force && cachedContext) {
        return cachedContext;
      }
      const query = parseEditorQuery();
      const meta = await fetchJson(META_PATH, query);
      cachedMeta = meta;
      const selectedEntry = getSelectedEntry(meta);
      const currentAnn = getCurrentAnn(meta, selectedEntry);
      const template = meta.template && typeof meta.template === "object" ? meta.template : {};
      cachedContext = {
        query,
        meta,
        template,
        selectedEntry,
        currentAnn,
        currentSegments: extractSegmentsFromAnnData(currentAnn?.ann_data),
        fieldContext: collectFieldContext(template),
        audioUrl: extractAudioUrl(selectedEntry),
        audioDurationMs: extractAudioDurationMs(currentAnn, selectedEntry),
      };
      return cachedContext;
    }

    async function getEditorContext(options) {
      const force = options && options.force === true;
      return loadContext(force);
    }

    async function setCurrentValidity(valid) {
      const ok = clickLabelByTexts(valid ? VALID_LABELS : INVALID_LABELS);
      return ok
        ? { ok: true, message: valid ? "当前段已尝试切换为 Valid。" : "当前段已尝试切换为 Invalid。" }
        : { ok: false, message: "未找到当前页的 Valid / Invalid 选择入口。" };
    }

    async function fillCurrentSegmentRecommendation(recommendation) {
      const source = recommendation && typeof recommendation === "object" ? recommendation : {};
      const dialectField = findLabelTarget(["标注文本", "柳州话", "转写文本"]);
      const mandarinField = findLabelTarget(["普通话顺滑", "普通话", "顺滑"]);
      const wroteDialect = source.dialectText ? setTextFieldValue(dialectField, source.dialectText) : false;
      const wroteMandarin = source.mandarinText ? setTextFieldValue(mandarinField, source.mandarinText) : false;
      if (!wroteDialect && !wroteMandarin) {
        return {
          ok: false,
          message: "未检测到稳定的当前段文本输入框；真实字段写入契约仍待补采。",
        };
      }
      return {
        ok: true,
        message: "已尝试把当前段 AI 建议填入页面；如页面未同步，请刷新后复核。",
      };
    }

    async function applySegmentPreview(_preview) {
      return {
        ok: false,
        message: "当前环境未检测到安全的画段写入桥；建议已生成，但仍需人工按建议画段。",
      };
    }

    async function fillUnresolvedSegmentsValid() {
      const ok = clickLabelByTexts(VALID_LABELS);
      return ok
        ? { ok: true, message: "已尝试把当前页可见未填写段落补为 Valid；请人工复核。", limited: true }
        : { ok: false, message: "未检测到可安全补写的段落有效性入口。" };
    }

    return {
      getEditorContext,
      isEditorPage,
      setCurrentValidity,
      fillCurrentSegmentRecommendation,
      applySegmentPreview,
      fillUnresolvedSegmentsValid,
    };
  }

  const api = {
    createRuntime,
    isEditorPage,
    parseEditorQuery,
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouDataApi = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
