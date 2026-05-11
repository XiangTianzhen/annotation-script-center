(function () {
  const GENDER_OPTIONS = ["男", "女"];
  const AGE_OPTIONS = ["0-5", "6-12", "13-18", "19-25", "26-36", "37-50", "51-65", "65以上"];

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
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
      return true;
    }
    if (element.isContentEditable) {
      element.focus();
      element.textContent = nextText;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    return false;
  }

  function findTextNodeElementByKeyword(keyword) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      return null;
    }
    const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
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

  function findProjectName() {
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
            node,
            index,
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

  function parseSpeaker() {
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

  function collectCurrentItem() {
    const detector = globalThis.__ASREdgeMagicDataAnnotatorPageDetector;
    const routeParams = detector?.parseHashParams ? detector.parseHashParams() : {};
    const textFields = pickDialectAndMandarinFields();
    const dialectText = normalizeText(getEditableValue(textFields.dialectField));
    const mandarinText = normalizeText(getEditableValue(textFields.mandarinField));
    const audioUrl = findAudioUrlFromDom() || findAudioUrlFromPerformance();
    const audioHostname = parseAudioHostname(audioUrl);

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
      projectName: findProjectName(),
      audioUrl: audioUrl,
      audioHostname,
      audioDuration: toNumberOrNull(audioDuration),
      effectiveStartTime: toNumberOrNull(effectiveStartTime),
      effectiveEndTime: toNumberOrNull(effectiveEndTime),
      effectiveTime: toNumberOrNull(effectiveTime),
      platformDialectText: dialectText,
      platformMandarinText: mandarinText,
      speaker: parseSpeaker(),
      fields: {
        dialectAvailable: Boolean(textFields.dialectField),
        mandarinAvailable: Boolean(textFields.mandarinField),
      },
    };
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
      message: success ? "已填入第一行，但未保存、未提交，请人工确认。" : "填入第一行失败。",
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
      message: success ? "已填入第二行，但未保存、未提交，请人工确认。" : "填入第二行失败。",
    };
  }

  globalThis.__ASREdgeMagicDataAnnotatorDataCollector = {
    collectCurrentItem,
    fillDialectLine,
    fillMandarinLine,
    normalizeText,
  };
})();
