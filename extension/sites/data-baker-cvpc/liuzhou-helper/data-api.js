(function () {
  const META_PATH = "/httpapi/annotation/meta";
  const OBSERVER_SOURCE = "ASR_EDGE_DATABAKER_CVPC_LIUZHOU_AUDIO_OBSERVER";
  const OBSERVER_MESSAGE_TYPE = "DATABAKER_CVPC_LIUZHOU_AUDIO_MAPPING";
  const MISSING_AUDIO_MESSAGE =
    "未拿到当前音频签名 URL，请先点击当前音频或播放一次后重试；如仍失败请刷新页面。";
  const VALID_LABELS = ["是（Valid）", "是(Valid)", "Valid"];
  const INVALID_LABELS = ["否（Invalid）", "否(Invalid)", "Invalid"];

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
    if (!response.ok || !payload || Number(payload.code) !== 0) {
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

  function findLabelTarget(labelMatchers, env) {
    const doc = env?.document || globalThis.document;
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return null;
    }
    const items = Array.from(doc.querySelectorAll(".el-form-item, .ant-form-item, label, div"));
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
      if (field instanceof env.HTMLInputElement || field instanceof env.HTMLTextAreaElement) {
        return field;
      }
    }
    return null;
  }

  function setTextFieldValue(field, value, env) {
    if (!(field instanceof env.HTMLInputElement || field instanceof env.HTMLTextAreaElement)) {
      return false;
    }
    field.focus();
    field.value = String(value || "");
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.blur();
    return true;
  }

  function clickLabelByTexts(labelTexts, env) {
    const doc = env?.document || globalThis.document;
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return false;
    }
    const all = Array.from(doc.querySelectorAll("label, span, div"));
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

  function collectFieldContext(template, env) {
    const fields = mapTemplateFieldNames(template);
    return {
      attrs: fields.attrs,
      entryAttrs: fields.entryAttrs,
      momentAttrs: fields.momentAttrs,
      dialectText: findLabelTarget(["标注文本", "柳州话", "转写文本"], env)?.value || "",
      mandarinText: findLabelTarget(["普通话顺滑", "普通话", "顺滑"], env)?.value || "",
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

  function createRuntime(deps) {
    const env = getEnvironment(deps);
    let cachedMeta = null;
    let cachedContext = null;
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

    function handleObserverMessage(event) {
      if (!event || event.source !== env.window || event.origin !== env.location.origin) {
        return;
      }
      const data = event.data || {};
      if (data.source !== OBSERVER_SOURCE || data.type !== OBSERVER_MESSAGE_TYPE) {
        return;
      }
      rememberObserverMapping(data.payload);
    }

    if (env.window && typeof env.window.addEventListener === "function") {
      env.window.addEventListener("message", handleObserverMessage);
    }

    async function loadContext(force) {
      if (!force && cachedContext) {
        return cachedContext;
      }
      const query = parseEditorQuery(env.location);
      const meta = await fetchJson(META_PATH, query, env.fetch);
      cachedMeta = meta;
      const selectedEntry = getSelectedEntry(meta, env.document);
      const currentAnn = getCurrentAnn(meta, selectedEntry);
      const template = meta.template && typeof meta.template === "object" ? meta.template : {};
      const audio = resolveAudioUrl(selectedEntry, env, observerMappings);
      cachedContext = {
        query,
        meta,
        template,
        selectedEntry,
        currentAnn,
        currentSegments: extractSegmentsFromAnnData(currentAnn?.ann_data),
        fieldContext: collectFieldContext(template, env),
        audioUrl: audio.audioUrl,
        audioUrlHintMessage: audio.audioUrl ? "" : MISSING_AUDIO_MESSAGE,
        audioUrlSource: audio.audioUrlSource,
        audioDurationMs: extractAudioDurationMs(currentAnn, selectedEntry),
      };
      return cachedContext;
    }

    async function getEditorContext(options) {
      const force = options && options.force === true;
      return loadContext(force);
    }

    async function setCurrentValidity(valid) {
      const ok = clickLabelByTexts(valid ? VALID_LABELS : INVALID_LABELS, env);
      return ok
        ? { ok: true, message: valid ? "当前段已尝试切换为 Valid。" : "当前段已尝试切换为 Invalid。" }
        : { ok: false, message: "未找到当前页的 Valid / Invalid 选择入口。" };
    }

    async function fillCurrentSegmentRecommendation(recommendation) {
      const source = recommendation && typeof recommendation === "object" ? recommendation : {};
      const dialectField = findLabelTarget(["标注文本", "柳州话", "转写文本"], env);
      const mandarinField = findLabelTarget(["普通话顺滑", "普通话", "顺滑"], env);
      const wroteDialect = source.dialectText
        ? setTextFieldValue(dialectField, source.dialectText, env)
        : false;
      const wroteMandarin = source.mandarinText
        ? setTextFieldValue(mandarinField, source.mandarinText, env)
        : false;
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
      const ok = clickLabelByTexts(VALID_LABELS, env);
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
    MISSING_AUDIO_MESSAGE,
    parseEditorQuery,
  };

  globalThis.ASREdgeDataBakerCvpcLiuzhouDataApi = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
