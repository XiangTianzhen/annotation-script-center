(function () {
  const TARGET_FIELDS = ["same_font", "image_b_texts_removed", "other_changes"];
  const IMAGE_FIELDS = ["image_a", "image_b", "image_b_removed"];

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeLower(value) {
    return normalizeText(value).toLowerCase();
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

  function isItemsPage() {
    const pathname = String(location.pathname || "");
    return pathname === "/items" || pathname.indexOf("/items") >= 0;
  }

  function isViewMode() {
    const params = new URLSearchParams(location.search || "");
    return params.get("viewMode") === "true";
  }

  function findVisibleTextNodeExact(text) {
    const target = normalizeLower(text);
    if (!target) {
      return null;
    }
    const nodes = document.querySelectorAll("div,span,label,strong,b,p,h1,h2,h3,h4,h5,h6,td,th");
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      if (!isVisible(node)) {
        continue;
      }
      if (normalizeLower(node.textContent || "") === target) {
        return node;
      }
    }
    return null;
  }

  function findFieldContainer(fieldName) {
    const titleNode = findVisibleTextNodeExact(fieldName);
    if (!titleNode) {
      return null;
    }
    let current = titleNode;
    for (let depth = 0; depth < 8 && current && current !== document.body; depth += 1) {
      const hasInput = current.querySelector(
        "input[type='radio'],input[type='checkbox'],textarea,[role='radio'],[role='checkbox'],[contenteditable='true'],[contenteditable=''],input[type='text']"
      );
      if (hasInput) {
        return current;
      }
      current = current.parentElement;
    }
    return titleNode.parentElement || null;
  }

  function extractOptionTextFromNode(node) {
    if (!(node instanceof Element)) {
      return "";
    }
    if (node instanceof HTMLInputElement) {
      const label = node.closest("label");
      return normalizeText(label ? label.textContent : node.value || "");
    }
    const text = normalizeText(node.textContent || node.getAttribute("aria-label") || "");
    if (text) {
      return text;
    }
    const labelledBy = node.getAttribute("aria-labelledby");
    if (labelledBy) {
      const linked = document.getElementById(labelledBy);
      return normalizeText(linked ? linked.textContent : "");
    }
    return "";
  }

  function findSelectedOptionText(container) {
    if (!(container instanceof Element)) {
      return "";
    }

    const checkedInput = container.querySelector("input[type='radio']:checked,input[type='checkbox']:checked");
    if (checkedInput) {
      const text = extractOptionTextFromNode(checkedInput);
      if (text) {
        return text;
      }
    }

    const ariaChecked = container.querySelector("[role='radio'][aria-checked='true'],[role='checkbox'][aria-checked='true']");
    if (ariaChecked) {
      const text = extractOptionTextFromNode(ariaChecked);
      if (text) {
        return text;
      }
    }

    const classMarked = container.querySelector(
      ".is-checked,.checked,.selected,.active,.ant-radio-wrapper-checked,.el-radio.is-checked,[data-checked='true'],[data-selected='true']"
    );
    if (classMarked) {
      const text = extractOptionTextFromNode(classMarked);
      if (text) {
        return text;
      }
    }

    return "";
  }

  function collectTextInputValue(container) {
    if (!(container instanceof Element)) {
      return "";
    }
    const textareas = container.querySelectorAll("textarea,input[type='text'],[contenteditable='true'],[contenteditable='']");
    for (let index = 0; index < textareas.length; index += 1) {
      const node = textareas[index];
      if (!isVisible(node)) {
        continue;
      }
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        const value = normalizeText(node.value || "");
        if (value) {
          return value.slice(0, 2000);
        }
        continue;
      }
      const value = normalizeText(node.textContent || "");
      if (value) {
        return value.slice(0, 2000);
      }
    }
    return "";
  }

  function collectFieldValue(fieldName) {
    const container = findFieldContainer(fieldName);
    if (!container) {
      return {
        exists: false,
        selectedOption: "",
        textValue: "",
      };
    }
    return {
      exists: true,
      selectedOption: findSelectedOptionText(container),
      textValue: collectTextInputValue(container),
    };
  }

  function collectCurrentPageValues() {
    const sameFont = collectFieldValue("same_font");
    const removed = collectFieldValue("image_b_texts_removed");
    const other = collectFieldValue("other_changes");
    return {
      same_font: sameFont.selectedOption,
      image_b_texts_removed: removed.textValue || removed.selectedOption,
      other_changes: other.textValue || other.selectedOption,
      same_font_exists: sameFont.exists,
      image_b_texts_removed_exists: removed.exists,
      other_changes_exists: other.exists,
    };
  }

  function findImageByLabel(labelText) {
    const labelNode = findVisibleTextNodeExact(labelText);
    if (!labelNode) {
      return null;
    }

    let current = labelNode;
    for (let depth = 0; depth < 6 && current && current !== document.body; depth += 1) {
      const image = Array.from(current.querySelectorAll("img")).find(function (item) {
        return isVisible(item);
      });
      if (image) {
        return image;
      }
      current = current.parentElement;
    }
    return null;
  }

  function collectVisibleImages() {
    return Array.from(document.querySelectorAll("img")).filter(function (img) {
      return isVisible(img);
    });
  }

  function guessMimeFromImageSource(source) {
    const text = String(source || "").trim();
    if (text.indexOf("data:image/") === 0) {
      const matched = text.match(/^data:(image\/[^;]+);/i);
      return matched ? matched[1].toLowerCase() : "image/unknown";
    }
    const lower = text.toLowerCase();
    if (lower.indexOf(".png") >= 0) {
      return "image/png";
    }
    if (lower.indexOf(".jpg") >= 0 || lower.indexOf(".jpeg") >= 0) {
      return "image/jpeg";
    }
    if (lower.indexOf(".webp") >= 0) {
      return "image/webp";
    }
    if (lower.indexOf(".gif") >= 0) {
      return "image/gif";
    }
    return "image/unknown";
  }

  function estimateDataUrlBytes(dataUrl) {
    const text = String(dataUrl || "");
    const marker = text.indexOf(",");
    if (marker < 0) {
      return null;
    }
    const base64 = text.slice(marker + 1).replace(/\s+/g, "");
    if (!base64) {
      return 0;
    }
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    const size = Math.floor((base64.length * 3) / 4) - padding;
    return size > 0 ? size : 0;
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function () {
        reject(reader.error || new Error("read-blob-failed"));
      };
      reader.readAsDataURL(blob);
    });
  }

  async function tryBuildDataUrl(imageNode, sourceUrl) {
    const source = String(sourceUrl || "").trim();
    if (!source) {
      return {
        dataUrl: "",
        sourceKind: "unknown",
        bytes: null,
      };
    }
    if (source.indexOf("data:image/") === 0) {
      return {
        dataUrl: source,
        sourceKind: "dataUrl",
        bytes: estimateDataUrlBytes(source),
      };
    }

    try {
      const response = await fetch(source, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("fetch-image-failed");
      }
      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);
      return {
        dataUrl: dataUrl,
        sourceKind: "dataUrl",
        bytes: Number(blob.size) || estimateDataUrlBytes(dataUrl),
      };
    } catch (error) {
      return {
        dataUrl: "",
        sourceKind: "url",
        bytes: null,
      };
    }
  }

  async function serializeImageField(fieldName, imageNode) {
    if (!(imageNode instanceof HTMLImageElement)) {
      return {
        fieldName: fieldName,
        dataUrl: "",
        imageUrl: "",
        mime: "unknown",
        width: "unknown",
        height: "unknown",
        bytes: "unknown",
        sourceKind: "unknown",
      };
    }
    const src = String(imageNode.currentSrc || imageNode.src || "").trim();
    const dataUrlResult = await tryBuildDataUrl(imageNode, src);
    const width = Number(imageNode.naturalWidth || imageNode.width || 0) || "unknown";
    const height = Number(imageNode.naturalHeight || imageNode.height || 0) || "unknown";
    const mime = dataUrlResult.dataUrl
      ? guessMimeFromImageSource(dataUrlResult.dataUrl)
      : guessMimeFromImageSource(src);

    return {
      fieldName: fieldName,
      dataUrl: dataUrlResult.dataUrl,
      imageUrl: dataUrlResult.dataUrl ? "" : src,
      mime: mime || "unknown",
      width: width,
      height: height,
      bytes:
        dataUrlResult.bytes !== null && dataUrlResult.bytes !== undefined
          ? dataUrlResult.bytes
          : "unknown",
      sourceKind: dataUrlResult.sourceKind,
    };
  }

  async function collectImages() {
    const mapping = {};

    IMAGE_FIELDS.forEach(function (fieldName) {
      const image = findImageByLabel(fieldName);
      if (image) {
        mapping[fieldName] = image;
      }
    });

    const fallbackImages = collectVisibleImages();
    let fallbackCursor = 0;
    IMAGE_FIELDS.forEach(function (fieldName) {
      if (mapping[fieldName]) {
        return;
      }
      while (fallbackCursor < fallbackImages.length) {
        const candidate = fallbackImages[fallbackCursor];
        fallbackCursor += 1;
        const alreadyUsed = IMAGE_FIELDS.some(function (key) {
          return mapping[key] === candidate;
        });
        if (!alreadyUsed) {
          mapping[fieldName] = candidate;
          break;
        }
      }
    });

    const results = [];
    for (let index = 0; index < IMAGE_FIELDS.length; index += 1) {
      const fieldName = IMAGE_FIELDS[index];
      const record = await serializeImageField(fieldName, mapping[fieldName] || null);
      results.push(record);
    }
    return results;
  }

  function collectTextByFieldName(fieldName) {
    const container = findFieldContainer(fieldName);
    if (!container) {
      return "";
    }
    return collectTextInputValue(container);
  }

  function collectTextPositions() {
    return {};
  }

  function sanitizeQueryValue(value) {
    const text = normalizeText(value);
    if (!text) {
      return "";
    }
    return text.slice(0, 120);
  }

  function collectRouteContext() {
    const params = new URLSearchParams(location.search || "");
    return {
      taskId: sanitizeQueryValue(params.get("taskId")),
      itemId: sanitizeQueryValue(params.get("itemId")),
      nodeId: sanitizeQueryValue(params.get("nodeId")),
      viewMode: sanitizeQueryValue(params.get("viewMode")),
      path: String(location.pathname || ""),
    };
  }

  function hasSameFontField() {
    return Boolean(findFieldContainer("same_font"));
  }

  function collectWarnings(context) {
    const warnings = [];
    if (!context.imageATexts) {
      warnings.push("未读取到 image_a_texts，已按空文本发送。");
    }
    if (!context.imageBTexts) {
      warnings.push("未读取到 image_b_texts，已按空文本发送。");
    }
    return warnings;
  }

  async function collectTask21Payload() {
    const currentPageValues = collectCurrentPageValues();
    const images = await collectImages();

    const context = {
      imageATexts: collectTextByFieldName("image_a_texts"),
      imageBTexts: collectTextByFieldName("image_b_texts"),
      textPositions: collectTextPositions(),
      currentValues: {
        same_font: currentPageValues.same_font || "",
        image_b_texts_removed: currentPageValues.image_b_texts_removed || "",
        other_changes: currentPageValues.other_changes || "",
      },
      route: collectRouteContext(),
    };

    const imageStats = images.map(function (item) {
      return {
        fieldName: item.fieldName,
        mime: item.mime || "unknown",
        width: item.width || "unknown",
        height: item.height || "unknown",
        bytes: item.bytes || "unknown",
        sourceKind: item.sourceKind || "unknown",
      };
    });

    return {
      ok: true,
      page: {
        isItemsPage: isItemsPage(),
        hasSameFontField: hasSameFontField(),
        isViewMode: isViewMode(),
      },
      context: context,
      images: images,
      imageStats: imageStats,
      warnings: collectWarnings(context),
    };
  }

  globalThis.__ASCEdgeAbakaAiTask21DataCollector = {
    collectTask21Payload: collectTask21Payload,
    collectCurrentPageValues: collectCurrentPageValues,
    hasSameFontField: hasSameFontField,
    isItemsPage: isItemsPage,
    isViewMode: isViewMode,
    TARGET_FIELDS: TARGET_FIELDS.slice(),
    IMAGE_FIELDS: IMAGE_FIELDS.slice(),
  };
})();
