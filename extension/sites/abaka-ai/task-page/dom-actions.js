(function () {
  const FIELD_SAME_FONT = "same_font";
  const FIELD_IMAGE_B_TEXTS_REMOVED = "image_b_texts_removed";
  const FIELD_OTHER_CHANGES = "other_changes";
  const OPTION_TRUE = "true";
  const OPTION_FALSE = "false";
  const OPTION_ARTISTIC = "same underlying font+artistic effect";
  const OPTION_SPECIFY = "specify";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function normalizeExact(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function isVisible(node) {
    if (!(node instanceof Element)) {
      return false;
    }
    const style = window.getComputedStyle(node);
    if (!style || style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getAllVisibleTextElements() {
    const nodes = document.querySelectorAll("div,span,label,strong,b,p,h1,h2,h3,h4,h5,h6");
    return Array.from(nodes).filter(function (node) {
      return isVisible(node) && normalizeExact(node.textContent || "").length > 0;
    });
  }

  function findFieldTitleNode(fieldName) {
    const target = normalizeText(fieldName);
    const candidates = getAllVisibleTextElements().filter(function (node) {
      return normalizeText(node.textContent || "") === target;
    });
    return candidates[0] || null;
  }

  function findOptionTextNode(container, optionText) {
    if (!(container instanceof Element)) {
      return null;
    }
    const target = normalizeText(optionText);
    const nodes = container.querySelectorAll(
      "label,button,[role='radio'],[role='button'],input[type='radio'],span,div,p"
    );
    const candidates = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (!isVisible(node)) {
        continue;
      }
      const text = normalizeText(node.textContent || "");
      if (!text || text !== target) {
        continue;
      }
      candidates.push(node);
    }
    if (candidates.length === 0) {
      return null;
    }
    candidates.sort(function (a, b) {
      const al = normalizeExact(a.textContent || "").length;
      const bl = normalizeExact(b.textContent || "").length;
      return al - bl;
    });
    return candidates[0];
  }

  function findFieldContainer(fieldName, optionText) {
    const titleNode = findFieldTitleNode(fieldName);
    if (!titleNode) {
      return null;
    }

    const maxDepth = 8;
    let current = titleNode;
    for (let depth = 0; depth < maxDepth && current && current !== document.body; depth += 1) {
      if (findOptionTextNode(current, optionText)) {
        return current;
      }
      current = current.parentElement;
    }

    const broad = titleNode.closest("section,article,form,[role='group'],[class*='item'],[class*='field'],[class*='question']");
    if (broad && findOptionTextNode(broad, optionText)) {
      return broad;
    }
    return null;
  }

  function findClickableElement(node) {
    if (!(node instanceof Element)) {
      return null;
    }

    if (node.matches("input[type='radio']")) {
      return node;
    }

    const radio = node.querySelector("input[type='radio']");
    if (radio) {
      return radio;
    }

    const direct = node.closest("label,button,[role='radio'],[role='button'],.radio-item,.ant-radio-wrapper,.el-radio");
    if (direct) {
      return direct;
    }

    let current = node;
    while (current && current !== document.body) {
      if (
        current.matches &&
        current.matches("label,button,[role='radio'],[role='button'],.radio-item,.ant-radio-wrapper,.el-radio")
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return node;
  }

  function dispatchClickSequence(target) {
    if (!(target instanceof Element)) {
      return;
    }
    if (target instanceof HTMLInputElement && target.type === "radio") {
      target.click();
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    target.click();
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function selectFieldOption(fieldName, optionText) {
    const container = findFieldContainer(fieldName, optionText);
    if (!container) {
      return {
        ok: false,
        message: "未找到字段：" + fieldName,
      };
    }

    const optionNode = findOptionTextNode(container, optionText);
    if (!optionNode) {
      return {
        ok: false,
        message: "未找到选项：" + fieldName + " -> " + optionText,
      };
    }

    const clickable = findClickableElement(optionNode);
    if (!clickable) {
      return {
        ok: false,
        message: "选项不可点击：" + fieldName + " -> " + optionText,
      };
    }
    dispatchClickSequence(clickable);
    return {
      ok: true,
      message: "已选择 " + fieldName + "=" + optionText,
    };
  }

  function waitForField(fieldName, timeoutMs) {
    const timeout = Number(timeoutMs) > 0 ? Number(timeoutMs) : 1500;
    const intervalMs = 100;
    const startedAt = Date.now();
    return new Promise(function (resolve) {
      function check() {
        const node = findFieldTitleNode(fieldName);
        if (node) {
          resolve({
            ok: true,
            node: node,
          });
          return;
        }
        if (Date.now() - startedAt >= timeout) {
          resolve({
            ok: false,
            node: null,
          });
          return;
        }
        window.setTimeout(check, intervalMs);
      }
      check();
    });
  }

  function hasSameFontField() {
    return Boolean(findFieldTitleNode(FIELD_SAME_FONT));
  }

  function createRuntime(options) {
    const config = options && typeof options === "object" ? options : {};
    function shouldAutoSelectSpecify() {
      if (typeof config.getAutoSelectSpecifyOnSameFontTrue === "function") {
        return config.getAutoSelectSpecifyOnSameFontTrue() !== false;
      }
      return config.autoSelectSpecifyOnSameFontTrue !== false;
    }

    async function selectSameFontTrue() {
      const primary = selectFieldOption(FIELD_SAME_FONT, OPTION_TRUE);
      if (!primary.ok) {
        return primary;
      }

      if (!shouldAutoSelectSpecify()) {
        return primary;
      }

      const waitImage = await waitForField(FIELD_IMAGE_B_TEXTS_REMOVED, 1500);
      const waitOther = await waitForField(FIELD_OTHER_CHANGES, 1500);
      if (!waitImage.ok || !waitOther.ok) {
        return {
          ok: false,
          message: "same_font=true 已选择，但派生字段未在 1500ms 内渲染",
        };
      }

      const imageRes = selectFieldOption(FIELD_IMAGE_B_TEXTS_REMOVED, OPTION_SPECIFY);
      const otherRes = selectFieldOption(FIELD_OTHER_CHANGES, OPTION_SPECIFY);
      if (!imageRes.ok || !otherRes.ok) {
        return {
          ok: false,
          message:
            "same_font=true 已选择，但自动联动失败：" +
            [imageRes.message, otherRes.message].filter(Boolean).join("；"),
        };
      }
      return {
        ok: true,
        message:
          "已选择 same_font=true；已自动选择 image_b_texts_removed=specify、other_changes=specify",
      };
    }

    async function selectSameFontFalse() {
      return selectFieldOption(FIELD_SAME_FONT, OPTION_FALSE);
    }

    async function selectSameFontArtisticEffect() {
      return selectFieldOption(FIELD_SAME_FONT, OPTION_ARTISTIC);
    }

    async function selectImageBTextsRemovedSpecify() {
      return selectFieldOption(FIELD_IMAGE_B_TEXTS_REMOVED, OPTION_SPECIFY);
    }

    async function selectOtherChangesSpecify() {
      return selectFieldOption(FIELD_OTHER_CHANGES, OPTION_SPECIFY);
    }

    return {
      hasSameFontField: hasSameFontField,
      selectSameFontTrue: selectSameFontTrue,
      selectSameFontFalse: selectSameFontFalse,
      selectSameFontArtisticEffect: selectSameFontArtisticEffect,
      selectImageBTextsRemovedSpecify: selectImageBTextsRemovedSpecify,
      selectOtherChangesSpecify: selectOtherChangesSpecify,
      selectFieldOption: selectFieldOption,
      waitForField: waitForField,
    };
  }

  globalThis.__ASCEdgeAbakaAiDomActions = {
    createRuntime: createRuntime,
    selectFieldOption: selectFieldOption,
    waitForField: waitForField,
  };
})();
