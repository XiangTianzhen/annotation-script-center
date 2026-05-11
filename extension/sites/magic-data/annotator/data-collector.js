(function () {
  const MAIN_SOURCE = "ASC_MAGIC_DATA_MAIN";
  const MAIN_DETAIL_TYPE = "ASC_MAGIC_DATA_ANNOTATE_DETAIL_RESPONSE";
  const API_DETAIL_PATH_PREFIX = "/api/management-service/annotateTask/annotateDetailInfo/";
  const DETAIL_FETCH_RETRY_INTERVAL_MS = 1500;
  const GENDER_OPTIONS = ["男", "女"];
  const AGE_OPTIONS = ["0-5", "6-12", "13-18", "19-25", "26-36", "37-50", "51-65", "65以上"];
  const REJECT_BUTTON_TEXTS = ["清除结果", "清除文本", "挂起", "驳回", "拒绝"];
  const FOCUS_SENTINEL_ATTR = "data-asc-magic-data-shortcut-focus-sentinel";

  const detailCacheByTaskItemId = new Map();
  const detailFetchInflightByTaskItemId = new Map();
  const detailFetchAtByTaskItemId = new Map();
  let focusSentinel = null;

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeCompactText(value) {
    return String(value || "").replace(/\s+/g, "").trim();
  }

  function toNumberOrNull(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function parseFirstNumber(value) {
    const match = String(value || "").match(/(-?\d+(?:\.\d+)?)/);
    return match ? toNumberOrNull(match[1]) : null;
  }

  function isVisible(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    if (element.getClientRects().length === 0) {
      return false;
    }
    const style = window.getComputedStyle(element);
    return style.visibility !== "hidden" && style.display !== "none";
  }

  function isEditableElement(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    const tagName = String(element.tagName || "").toLowerCase();
    if (tagName === "textarea" || tagName === "input") {
      return !element.disabled && !element.readOnly;
    }
    if (element.isContentEditable) {
      return true;
    }
    return false;
  }

  function getEditableValue(element) {
    if (!(element instanceof HTMLElement)) {
      return "";
    }
    const tagName = String(element.tagName || "").toLowerCase();
    if (tagName === "textarea" || tagName === "input") {
      return String(element.value || "");
    }
    return String(element.innerText || element.textContent || "");
  }

  function setEditableValue(element, text) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    const nextText = String(text || "");
    const tagName = String(element.tagName || "").toLowerCase();
    if (tagName === "textarea" || tagName === "input") {
      element.focus();
      element.value = nextText;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      restoreShortcutFocusAfterAction();
      return true;
    }
    if (element.isContentEditable) {
      element.focus();
      element.textContent = nextText;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      restoreShortcutFocusAfterAction();
      return true;
    }
    return false;
  }

  function ensureFocusSentinel() {
    if (focusSentinel && document.documentElement?.contains(focusSentinel)) {
      return focusSentinel;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(FOCUS_SENTINEL_ATTR, "true");
    button.tabIndex = -1;
    button.setAttribute("aria-hidden", "true");
    button.style.position = "fixed";
    button.style.left = "-9999px";
    button.style.top = "-9999px";
    button.style.width = "1px";
    button.style.height = "1px";
    button.style.opacity = "0";
    button.style.pointerEvents = "none";
    (document.body || document.documentElement).appendChild(button);
    focusSentinel = button;
    return focusSentinel;
  }

  function blurActiveElementSafe() {
    const active = document.activeElement;
    if (active && typeof active.blur === "function") {
      try {
        active.blur();
      } catch (error) {
        // keep stable
      }
    }
  }

  function focusSafeBody() {
    const body = document.body || document.documentElement;
    if (!body) {
      return;
    }
    if (body instanceof HTMLElement) {
      if (!body.hasAttribute("tabindex")) {
        body.setAttribute("tabindex", "-1");
      }
      try {
        body.focus({ preventScroll: true });
      } catch (error) {
        try {
          body.focus();
        } catch (ignoreError) {
          // keep stable
        }
      }
    }
  }

  function restoreShortcutFocusAfterAction() {
    const intervals = [0, 50, 180];
    intervals.forEach(function (delay) {
      window.setTimeout(function () {
        blurActiveElementSafe();
        const sentinel = ensureFocusSentinel();
        if (sentinel && typeof sentinel.focus === "function") {
          try {
            sentinel.focus({ preventScroll: true });
          } catch (error) {
            try {
              sentinel.focus();
            } catch (ignoreError) {
              // keep stable
            }
          }
        }
        focusSafeBody();
      }, delay);
    });
  }

  function findTextNodeElementByKeyword(keyword) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      return null;
    }
    const root = document.body || document.documentElement;
    if (!root) {
      return null;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const text = normalizeText(current.textContent || "");
      if (text && text.indexOf(normalizedKeyword) >= 0) {
        return current.parentElement || null;
      }
      current = walker.nextNode();
    }
    return null;
  }

  function findNearbyNumberByKeyword(keyword) {
    const anchor = findTextNodeElementByKeyword(keyword);
    if (!anchor) {
      return null;
    }
    const localText = normalizeText(anchor.textContent || "");
    const localNumber = parseFirstNumber(localText.slice(localText.indexOf(keyword)));
    if (localNumber !== null) {
      return localNumber;
    }
    const parentText = normalizeText(anchor.parentElement?.textContent || "");
    const parentNumber = parseFirstNumber(parentText.slice(parentText.indexOf(keyword)));
    if (parentNumber !== null) {
      return parentNumber;
    }
    return null;
  }

  function findProjectNameFromDom() {
    const anchor = findTextNodeElementByKeyword("项目名称");
    if (!anchor) {
      return "";
    }
    const text = normalizeText(anchor.textContent || anchor.parentElement?.textContent || "");
    return text.replace(/^.*?项目名称[:：]/, "").trim().slice(0, 120);
  }

  function findAudioUrlFromDom() {
    const audios = Array.from(document.querySelectorAll("audio"));
    for (let index = 0; index < audios.length; index += 1) {
      const url = String(audios[index].currentSrc || audios[index].src || "").trim();
      if (url) {
        return url;
      }
    }
    return "";
  }

  function findAudioUrlFromPerformance() {
    const performanceApi = globalThis.performance;
    if (!performanceApi || typeof performanceApi.getEntriesByType !== "function") {
      return "";
    }
    const entries = performanceApi.getEntriesByType("resource");
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entryName = String(entries[index]?.name || "");
      if (!entryName) {
        continue;
      }
      const lower = entryName.toLowerCase();
      const isAudio =
        lower.indexOf("magicdatacloud") >= 0 ||
        lower.indexOf(".wav") >= 0 ||
        lower.indexOf(".mp3") >= 0 ||
        lower.indexOf(".m4a") >= 0 ||
        lower.indexOf(".aac") >= 0;
      if (isAudio) {
        return entryName;
      }
    }
    return "";
  }

  function parseAudioHostname(audioUrl) {
    try {
      return new URL(String(audioUrl || "")).hostname || "";
    } catch (error) {
      return "";
    }
  }

  function collectEditableFieldsInContainer(container) {
    if (!(container instanceof Element)) {
      return [];
    }
    const candidates = Array.from(
      container.querySelectorAll(
        "textarea, input[type='text'], input:not([type]), [contenteditable='true'], [contenteditable='']"
      )
    );
    return candidates.filter(function (node) {
      return isEditableElement(node) && isVisible(node);
    });
  }

  function collectGlobalEditableFields() {
    const candidates = Array.from(
      document.querySelectorAll(
        "textarea, input[type='text'], input:not([type]), [contenteditable='true'], [contenteditable='']"
      )
    );
    return candidates.filter(function (node) {
      return isEditableElement(node) && isVisible(node);
    });
  }

  function pickDialectAndMandarinFields() {
    const anchor = findTextNodeElementByKeyword("说话内容");
    let fields = [];
    if (anchor) {
      const container =
        anchor.closest(".el-table, table, [class*='table'], [class*='mark']") ||
        anchor.closest("[class*='content']") ||
        anchor.parentElement;
      fields = collectEditableFieldsInContainer(container);
    }
    if (fields.length < 2) {
      fields = collectGlobalEditableFields();
    }
    if (fields.length > 2) {
      const ranked = fields
        .map(function (node, index) {
          return {
            node: node,
            index: index,
            score: normalizeText(getEditableValue(node)).length,
          };
        })
        .sort(function (left, right) {
          if (right.score !== left.score) {
            return right.score - left.score;
          }
          return left.index - right.index;
        })
        .slice(0, 4)
        .sort(function (left, right) {
          const posA = left.node.getBoundingClientRect();
          const posB = right.node.getBoundingClientRect();
          if (Math.abs(posA.top - posB.top) > 6) {
            return posA.top - posB.top;
          }
          return posA.left - posB.left;
        });
      fields = ranked.map(function (item) {
        return item.node;
      });
    }

    return {
      dialectField: fields[0] || null,
      mandarinField: fields[1] || null,
    };
  }

  function parseSpeakerFromDom() {
    const section = findTextNodeElementByKeyword("说话人属性");
    const scope = section?.closest("[class*='form'], [class*='panel'], [class*='card']") || document.body;
    const text = normalizeText(scope?.textContent || "");
    const speaker = {};

    for (let index = 0; index < GENDER_OPTIONS.length; index += 1) {
      const value = GENDER_OPTIONS[index];
      if (text.indexOf(value) >= 0) {
        speaker.gender = value;
        break;
      }
    }

    for (let index = 0; index < AGE_OPTIONS.length; index += 1) {
      const value = AGE_OPTIONS[index];
      if (text.indexOf(value) >= 0) {
        speaker.ageRange = value;
        break;
      }
    }
    return speaker;
  }

  function getRouteParams() {
    const detector = globalThis.__ASREdgeMagicDataAnnotatorPageDetector;
    return detector?.parseHashParams ? detector.parseHashParams() : {};
  }

  function getCurrentTaskItemId() {
    return normalizeText(getRouteParams().taskItemId);
  }

  function normalizeDetailEntry(input) {
    const source = input && typeof input === "object" ? input : {};
    const markInfo = Array.isArray(source.mark_info) ? source.mark_info : [];
    return {
      at: Number(source.at) || Date.now(),
      taskItemId: normalizeText(source.taskItemId),
      path: String(source.path || "").trim(),
      wav_name: normalizeText(source.wav_name),
      start_time: toNumberOrNull(source.start_time),
      end_time: toNumberOrNull(source.end_time),
      mark_info: markInfo.map(function (item) {
        const row = item && typeof item === "object" ? item : {};
        return {
          mark_text: normalizeText(row.mark_text),
          speak_people: row.speak_people,
          mark_type: normalizeText(row.mark_type),
        };
      }),
      statistics: source.statistics && typeof source.statistics === "object" ? source.statistics : null,
      is_valid: source.is_valid,
      base_speak: source.base_speak,
      duration: toNumberOrNull(source.duration),
    };
  }

  function rememberDetailEntry(entry) {
    if (!entry || !entry.taskItemId) {
      return;
    }
    detailCacheByTaskItemId.set(entry.taskItemId, normalizeDetailEntry(entry));
  }

  function parseDetailResponsePayload(payload, fallbackTaskItemId) {
    const data = payload && typeof payload === "object" ? payload.data : {};
    const normalized = normalizeDetailEntry({
      taskItemId: normalizeText(data?.taskItemId || fallbackTaskItemId),
      path: data?.path,
      wav_name: data?.wav_name,
      start_time: data?.start_time,
      end_time: data?.end_time,
      mark_info: data?.mark_info,
      statistics: data?.statistics,
      is_valid: data?.is_valid,
      base_speak: data?.base_speak,
      duration:
        data?.duration !== undefined
          ? data.duration
          : data?.audio_duration !== undefined
            ? data.audio_duration
            : data?.total_duration,
    });
    return normalized.taskItemId ? normalized : null;
  }

  async function requestAnnotateDetail(taskItemId) {
    const response = await fetch(
      location.origin + API_DETAIL_PATH_PREFIX + encodeURIComponent(taskItemId),
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Accept: "application/json, text/plain, */*",
          "md-language": "zh",
        },
        body: JSON.stringify({
          taskItemId: taskItemId,
        }),
      }
    );
    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }
    return {
      response: response,
      payload: payload,
    };
  }

  async function fetchAnnotateDetail(taskItemId) {
    const normalizedTaskItemId = normalizeText(taskItemId);
    if (!normalizedTaskItemId) {
      return null;
    }

    const lastFetchAt = Number(detailFetchAtByTaskItemId.get(normalizedTaskItemId) || 0);
    if (Date.now() - lastFetchAt < DETAIL_FETCH_RETRY_INTERVAL_MS) {
      return detailCacheByTaskItemId.get(normalizedTaskItemId) || null;
    }
    detailFetchAtByTaskItemId.set(normalizedTaskItemId, Date.now());

    const inflight = detailFetchInflightByTaskItemId.get(normalizedTaskItemId);
    if (inflight) {
      return inflight;
    }

    const requestPromise = requestAnnotateDetail(normalizedTaskItemId)
      .then(function (result) {
        if (!result.response.ok || !result.payload || !result.payload.data) {
          return null;
        }
        const entry = parseDetailResponsePayload(result.payload, normalizedTaskItemId);
        if (!entry) {
          return null;
        }
        rememberDetailEntry(entry);
        return entry;
      })
      .catch(function () {
        return null;
      })
      .finally(function () {
        detailFetchInflightByTaskItemId.delete(normalizedTaskItemId);
      });

    detailFetchInflightByTaskItemId.set(normalizedTaskItemId, requestPromise);
    return requestPromise;
  }

  function getCachedDetail(taskItemId) {
    const normalizedTaskItemId = normalizeText(taskItemId);
    if (!normalizedTaskItemId) {
      return null;
    }
    return detailCacheByTaskItemId.get(normalizedTaskItemId) || null;
  }

  function parseSpeakerFromDetail(detail, fallbackSpeaker) {
    const speaker = Object.assign({}, fallbackSpeaker || {});
    const markInfo = Array.isArray(detail?.mark_info) ? detail.mark_info : [];
    const firstSpeakPeople = markInfo
      .map(function (row) {
        return row?.speak_people;
      })
      .find(function (value) {
        return value !== undefined && value !== null && value !== "";
      });
    const candidates = [detail?.base_speak, firstSpeakPeople];
    candidates.forEach(function (item) {
      if (!item) {
        return;
      }
      if (typeof item === "string") {
        const text = normalizeText(item);
        if (!speaker.gender && (text.indexOf("男") >= 0 || text.indexOf("女") >= 0)) {
          speaker.gender = text.indexOf("女") >= 0 ? "女" : "男";
        }
        if (!speaker.ageRange) {
          const matchedAge = AGE_OPTIONS.find(function (ageRange) {
            return text.indexOf(ageRange) >= 0;
          });
          if (matchedAge) {
            speaker.ageRange = matchedAge;
          }
        }
        return;
      }
      if (typeof item === "object") {
        const genderText = normalizeText(item.gender || item.sex || "");
        if (!speaker.gender && (genderText === "男" || genderText === "女")) {
          speaker.gender = genderText;
        }
        const ageRangeText = normalizeText(item.ageRange || item.age || "");
        if (!speaker.ageRange) {
          const matchedAge = AGE_OPTIONS.find(function (ageRange) {
            return ageRange === ageRangeText;
          });
          if (matchedAge) {
            speaker.ageRange = matchedAge;
          }
        }
      }
    });
    return speaker;
  }

  function pickTextFromMarkInfo(detail, index, fallbackText) {
    const markInfo = Array.isArray(detail?.mark_info) ? detail.mark_info : [];
    const direct = normalizeText(markInfo[index]?.mark_text || "");
    if (direct) {
      return direct;
    }
    const list = markInfo
      .map(function (row) {
        return normalizeText(row?.mark_text || "");
      })
      .filter(Boolean);
    return list[index] || normalizeText(fallbackText || "");
  }

  function collectDomSnapshot() {
    const routeParams = getRouteParams();
    const textFields = pickDialectAndMandarinFields();
    const dialectText = normalizeText(getEditableValue(textFields.dialectField));
    const mandarinText = normalizeText(getEditableValue(textFields.mandarinField));
    const audioUrl = findAudioUrlFromDom() || findAudioUrlFromPerformance();

    const effectiveTime =
      findNearbyNumberByKeyword("有效句子时长") ??
      findNearbyNumberByKeyword("截取时长") ??
      null;
    const audioDuration = findNearbyNumberByKeyword("音频总时长");
    const effectiveStartTime =
      findNearbyNumberByKeyword("有效开始时间") ?? findNearbyNumberByKeyword("开始时间");
    const effectiveEndTime =
      findNearbyNumberByKeyword("有效结束时间") ?? findNearbyNumberByKeyword("结束时间");

    return {
      taskItemId: normalizeText(routeParams.taskItemId),
      samplingRecordId: normalizeText(routeParams.samplingRecordId),
      projectName: findProjectNameFromDom(),
      audioUrl: audioUrl,
      audioHostname: parseAudioHostname(audioUrl),
      audioDuration: toNumberOrNull(audioDuration),
      effectiveStartTime: toNumberOrNull(effectiveStartTime),
      effectiveEndTime: toNumberOrNull(effectiveEndTime),
      effectiveTime: toNumberOrNull(effectiveTime),
      platformDialectText: dialectText,
      platformMandarinText: mandarinText,
      speaker: parseSpeakerFromDom(),
      fields: {
        dialectAvailable: Boolean(textFields.dialectField),
        mandarinAvailable: Boolean(textFields.mandarinField),
      },
    };
  }

  function mergeSnapshotWithDetail(domSnapshot, detail) {
    const snapshot = Object.assign({}, domSnapshot || {});
    if (!detail) {
      return snapshot;
    }
    const startTime = toNumberOrNull(detail.start_time);
    const endTime = toNumberOrNull(detail.end_time);
    const effectiveTime =
      startTime !== null && endTime !== null && endTime >= startTime ? Number((endTime - startTime).toFixed(3)) : null;
    const audioUrl = String(detail.path || "").trim();
    snapshot.taskItemId = normalizeText(detail.taskItemId || snapshot.taskItemId);
    snapshot.audioUrl = audioUrl || snapshot.audioUrl || "";
    snapshot.audioHostname = parseAudioHostname(snapshot.audioUrl);
    snapshot.audioDuration = toNumberOrNull(detail.duration) ?? snapshot.audioDuration;
    snapshot.effectiveStartTime = startTime ?? snapshot.effectiveStartTime;
    snapshot.effectiveEndTime = endTime ?? snapshot.effectiveEndTime;
    snapshot.effectiveTime = effectiveTime ?? snapshot.effectiveTime;
    snapshot.platformDialectText = pickTextFromMarkInfo(detail, 0, snapshot.platformDialectText);
    snapshot.platformMandarinText = pickTextFromMarkInfo(detail, 1, snapshot.platformMandarinText);
    snapshot.speaker = parseSpeakerFromDetail(detail, snapshot.speaker);
    return snapshot;
  }

  function collectCurrentItem() {
    const domSnapshot = collectDomSnapshot();
    const detail = getCachedDetail(domSnapshot.taskItemId);
    return mergeSnapshotWithDetail(domSnapshot, detail);
  }

  async function refreshCurrentItem(options) {
    const config = options && typeof options === "object" ? options : {};
    const domSnapshot = collectDomSnapshot();
    const taskItemId = normalizeText(config.taskItemId || domSnapshot.taskItemId || getCurrentTaskItemId());
    if (!taskItemId) {
      return domSnapshot;
    }
    const detail = await fetchAnnotateDetail(taskItemId);
    return mergeSnapshotWithDetail(domSnapshot, detail);
  }

  function fillDialectLine(text) {
    const fields = pickDialectAndMandarinFields();
    if (!fields.dialectField) {
      return {
        ok: false,
        message: "未定位到第一行文本框，无法填入。",
      };
    }
    const success = setEditableValue(fields.dialectField, normalizeText(text));
    return {
      ok: success,
      message: success
        ? "已填入第一行，但未保存、未提交，请人工确认。快捷键焦点已恢复。"
        : "填入第一行失败。",
    };
  }

  function fillMandarinLine(text) {
    const fields = pickDialectAndMandarinFields();
    if (!fields.mandarinField) {
      return {
        ok: false,
        message: "未定位到第二行文本框，无法填入。",
      };
    }
    const success = setEditableValue(fields.mandarinField, normalizeText(text));
    return {
      ok: success,
      message: success
        ? "已填入第二行，但未保存、未提交，请人工确认。快捷键焦点已恢复。"
        : "填入第二行失败。",
    };
  }

  function findVisibleButtonsByExactText(text) {
    const targetText = normalizeCompactText(text);
    return Array.from(document.querySelectorAll("button, .el-button, [role='button']"))
      .filter(isVisible)
      .filter(function (node) {
        return normalizeCompactText(node.textContent || "") === targetText;
      });
  }

  function clickOperationButton(text) {
    const targetText = normalizeCompactText(text);
    const candidates = findVisibleButtonsByExactText(text).filter(function (node) {
      const currentText = normalizeCompactText(node.textContent || "");
      if (currentText !== targetText) {
        return false;
      }
      return !REJECT_BUTTON_TEXTS.some(function (rejectText) {
        return currentText === normalizeCompactText(rejectText);
      });
    });
    const button = candidates[0] || null;
    if (!button) {
      return {
        ok: false,
        message: "未找到“" + text + "”按钮。",
      };
    }
    button.click();
    restoreShortcutFocusAfterAction();
    return {
      ok: true,
      message: "检测到" + text + "快捷键，已触发平台" + text + "按钮。快捷键焦点已恢复。",
    };
  }

  function findSpeakerScope() {
    const anchor = findTextNodeElementByKeyword("说话人属性");
    return anchor?.closest("[class*='form'], [class*='panel'], [class*='card'], .el-form") || null;
  }

  function findClickableNodeByText(scope, text) {
    if (!scope) {
      return null;
    }
    const targetText = normalizeCompactText(text);
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const currentText = normalizeCompactText(current.textContent || "");
      if (currentText === targetText) {
        const parent = current.parentElement;
        const clickable =
          parent?.closest("label, button, [role='radio'], .el-radio, .el-checkbox, li, span, div") || null;
        if (clickable && isVisible(clickable)) {
          return clickable;
        }
      }
      current = walker.nextNode();
    }
    return null;
  }

  function selectSpeakerValue(text) {
    const scope = findSpeakerScope();
    if (!scope) {
      return {
        ok: false,
        message: "未找到说话人属性区域。",
      };
    }
    const target = findClickableNodeByText(scope, text);
    if (!target) {
      return {
        ok: false,
        message: "未找到“" + text + "”选项。",
      };
    }
    target.click();
    restoreShortcutFocusAfterAction();
    return {
      ok: true,
      message: "已选择" + text + "，快捷键焦点已恢复。未自动保存。",
    };
  }

  function handleMainWorldMessage(event) {
    if (event.source !== window || event.origin !== location.origin) {
      return;
    }
    const data = event.data || {};
    if (data.source !== MAIN_SOURCE || data.type !== MAIN_DETAIL_TYPE) {
      return;
    }
    const entry = normalizeDetailEntry(data.payload || {});
    if (!entry.taskItemId) {
      return;
    }
    rememberDetailEntry(entry);
  }

  window.addEventListener("message", handleMainWorldMessage);

  globalThis.__ASREdgeMagicDataAnnotatorDataCollector = {
    clickOperationButton,
    collectCurrentItem,
    fillDialectLine,
    fillMandarinLine,
    getCachedDetail,
    normalizeText,
    refreshCurrentItem,
    restoreShortcutFocusAfterAction,
    selectSpeakerValue,
  };
})();
