(function () {
  const FIELD_SAME_FONT = "same_font";
  const FIELD_IMAGE_B_TEXTS_REMOVED = "image_b_texts_removed";
  const FIELD_OTHER_CHANGES = "other_changes";
  const OPTION_TRUE = "true";
  const OPTION_FALSE = "false";
  const OPTION_ARTISTIC = "same underlying font+artistic effect";
  const OPTION_SPECIFY = "specify";
  const OPTION_UNSURE = "unsure";
  const OPTION_NULL = "null";
  const STASH_BUTTON_TEXTS = ["暂存", "save", "stash"];
  const SUBMIT_REVIEW_BUTTON_TEXTS = ["送审", "submit review", "submit"];
  const REVIEW_ROLE_SIGNAL_TEXTS = ["标注内审", "领取审核", "claim review", "reviewer", "review team"];

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function normalizeExact(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeCompactText(value) {
    return String(value || "").replace(/\s+/g, "").trim().toLowerCase();
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

  function isMonacoTextarea(node) {
    return (
      node instanceof HTMLTextAreaElement &&
      (node.classList.contains("inputarea") ||
        node.classList.contains("monaco-mouse-cursor-text") ||
        Boolean(node.closest(".monaco-editor")))
    );
  }

  function isNodeVisibleForTextInput(node) {
    if (!(node instanceof Element)) {
      return false;
    }
    if (isVisible(node)) {
      return true;
    }
    if (isMonacoTextarea(node)) {
      const monacoRoot = node.closest(".monaco-editor,.custom-md-editor");
      return monacoRoot ? isVisible(monacoRoot) : false;
    }
    return false;
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

  function findFieldItem(fieldName) {
    const titleNode = findFieldTitleNode(fieldName);
    if (!titleNode) {
      return null;
    }
    const item = titleNode.closest(".l-item");
    if (item) {
      return item;
    }
    return titleNode.closest(
      "section,article,form,[role='group'],[class*='item'],[class*='field'],[class*='question']"
    );
  }

  function findFieldLabelContainers(fieldName) {
    const results = [];
    const seen = new Set();
    function pushNode(node) {
      if (!(node instanceof Element) || seen.has(node)) {
        return;
      }
      seen.add(node);
      results.push(node);
    }

    const fieldItem = findFieldItem(fieldName);
    const titleNode = findFieldTitleNode(fieldName);
    if (fieldItem) {
      pushNode(fieldItem);
      const labels = fieldItem.querySelectorAll(".l-label");
      for (let i = 0; i < labels.length; i += 1) {
        pushNode(labels[i]);
      }
    }
    if (titleNode) {
      const titleParents = [
        titleNode.parentElement,
        titleNode.closest(".l-header"),
        titleNode.closest(".l-item"),
      ].filter(Boolean);
      for (let i = 0; i < titleParents.length; i += 1) {
        const parent = titleParents[i];
        pushNode(parent);
        const labels = parent.querySelectorAll ? parent.querySelectorAll(".l-label") : [];
        for (let j = 0; j < labels.length; j += 1) {
          pushNode(labels[j]);
        }
      }
      let sibling = titleNode.closest(".l-header")?.nextElementSibling || titleNode.parentElement?.nextElementSibling;
      let steps = 0;
      while (sibling && steps < 6) {
        pushNode(sibling);
        const labels = sibling.querySelectorAll ? sibling.querySelectorAll(".l-label") : [];
        for (let j = 0; j < labels.length; j += 1) {
          pushNode(labels[j]);
        }
        sibling = sibling.nextElementSibling;
        steps += 1;
      }
    }
    return results;
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

    const broad = findFieldItem(fieldName);
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

  function isElementDisabled(node) {
    if (!(node instanceof Element)) {
      return true;
    }
    if (node.hasAttribute("disabled")) {
      return true;
    }
    if (node.getAttribute("aria-disabled") === "true") {
      return true;
    }
    const classText = String(node.className || "").toLowerCase();
    if (
      classText.indexOf("disabled") >= 0 ||
      classText.indexOf("is-disabled") >= 0 ||
      classText.indexOf("ant-btn-disabled") >= 0
    ) {
      return true;
    }
    return false;
  }

  function isTextInputWritable(node) {
    if (!(node instanceof Element) || !isNodeVisibleForTextInput(node) || isElementDisabled(node)) {
      return false;
    }
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
      if (node.readOnly) {
        return false;
      }
      return true;
    }
    if (node.getAttribute("contenteditable") === "true" || node.getAttribute("role") === "textbox") {
      return node.getAttribute("aria-readonly") !== "true";
    }
    return false;
  }

  function findFieldTextInput(fieldName) {
    const fieldItem = findFieldItem(fieldName);
    const titleNode = findFieldTitleNode(fieldName);
    const searchRoots = [];
    const seen = new Set();
    function addRoot(node) {
      if (!(node instanceof Element) || seen.has(node)) {
        return;
      }
      seen.add(node);
      searchRoots.push(node);
    }
    if (fieldItem) {
      addRoot(fieldItem);
    }
    const labels = findFieldLabelContainers(fieldName);
    for (let i = 0; i < labels.length; i += 1) {
      addRoot(labels[i]);
    }
    if (titleNode) {
      addRoot(titleNode.parentElement);
    }
    if (searchRoots.length === 0) {
      return {
        ok: false,
        message: "未找到完整字段容器：" + fieldName,
        node: null,
      };
    }

    const selectors = [
      "textarea.n-input__textarea-el",
      ".custom-md-editor textarea.inputarea",
      ".monaco-editor textarea.inputarea",
      ".n-input--textarea textarea",
      "textarea",
      "input[type='text']",
      "input:not([type])",
      "[contenteditable='true']",
      "[role='textbox']",
    ];

    for (let s = 0; s < selectors.length; s += 1) {
      const selector = selectors[s];
      for (let r = 0; r < searchRoots.length; r += 1) {
        const root = searchRoots[r];
        const nodes = root.querySelectorAll(selector);
        for (let i = 0; i < nodes.length; i += 1) {
          const node = nodes[i];
          if (isTextInputWritable(node)) {
            return {
              ok: true,
              node: node,
              message: "已找到输入控件",
            };
          }
        }
      }
    }
    return {
      ok: false,
      message: "找到字段容器但未找到 Naive UI textarea / Monaco editor 输入区：" + fieldName,
      node: null,
    };
  }

  function findMonacoEditorInstanceForNode(node, fieldName) {
    const monacoRoot =
      (node instanceof Element && node.closest(".monaco-editor")) || findFieldItem(fieldName)?.querySelector(".monaco-editor");
    if (!monacoRoot || !window.monaco || !window.monaco.editor) {
      return null;
    }
    const editorApi = window.monaco.editor;
    if (typeof editorApi.getEditors === "function") {
      try {
        const editors = editorApi.getEditors();
        for (let i = 0; i < editors.length; i += 1) {
          const editor = editors[i];
          if (!editor || typeof editor.getDomNode !== "function") {
            continue;
          }
          const dom = editor.getDomNode();
          if (dom === monacoRoot || (dom instanceof Element && monacoRoot.contains(dom))) {
            return editor;
          }
        }
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  function tryWriteMonacoByExecCommand(node, text) {
    const monacoRoot = node.closest(".monaco-editor,.custom-md-editor");
    if (!(monacoRoot instanceof Element)) {
      return { ok: false, message: "未找到 Monaco 编辑器容器。" };
    }
    const focusTarget = monacoRoot.querySelector(".view-lines,.monaco-scrollable-element") || monacoRoot;
    if (focusTarget && typeof focusTarget.click === "function") {
      focusTarget.click();
    }
    if (typeof node.focus === "function") {
      node.focus();
    }
    try {
      document.execCommand("selectAll");
      const inserted = document.execCommand("insertText", false, text);
      node.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, data: text, inputType: "insertText" }));
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
      node.dispatchEvent(new Event("compositionend", { bubbles: true }));
      if (inserted) {
        return { ok: true, message: "Monaco execCommand 写入成功。" };
      }
    } catch (error) {
      // continue fallback
    }
    return { ok: false, message: "Monaco execCommand 写入失败。" };
  }

  function setTextValue(node, value) {
    if (!isTextInputWritable(node)) {
      return {
        ok: false,
        message: "输入控件不可写或不可见。",
      };
    }
    const text = String(value || "");
    if (isMonacoTextarea(node)) {
      const fieldName = node.getAttribute("data-asc-field-name") || "";
      const editor = findMonacoEditorInstanceForNode(node, fieldName);
      if (editor) {
        try {
          if (typeof editor.setValue === "function") {
            editor.setValue(text);
          } else if (editor.getModel && editor.getModel() && typeof editor.getModel().setValue === "function") {
            editor.getModel().setValue(text);
          } else {
            return { ok: false, message: "Monaco editor instance 不支持 setValue。" };
          }
          return { ok: true, message: "Monaco API 写入成功。", node: node };
        } catch (error) {
          // fallback next
        }
      }
      const execRes = tryWriteMonacoByExecCommand(node, text);
      if (execRes.ok) {
        return { ok: true, message: execRes.message, node: node };
      }
      const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
      if (descriptor && typeof descriptor.set === "function") {
        descriptor.set.call(node, text);
      } else {
        node.value = text;
      }
      node.dispatchEvent(
        new InputEvent("beforeinput", { bubbles: true, data: text, inputType: "insertText" })
      );
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
      node.dispatchEvent(new Event("compositionend", { bubbles: true }));
      return { ok: false, message: "Monaco 写入失败：fallback 未确认模型已更新。", node: node };
    }
    if (node instanceof HTMLTextAreaElement) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
      if (descriptor && typeof descriptor.set === "function") {
        descriptor.set.call(node, text);
      } else {
        node.value = text;
      }
      if (typeof node.focus === "function") {
        node.focus();
      }
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
      node.dispatchEvent(new Event("compositionend", { bubbles: true }));
      return { ok: true, message: "已写入文本。", node: node };
    }
    if (node instanceof HTMLInputElement) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
      if (descriptor && typeof descriptor.set === "function") {
        descriptor.set.call(node, text);
      } else {
        node.value = text;
      }
      if (typeof node.focus === "function") {
        node.focus();
      }
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
      node.dispatchEvent(new Event("compositionend", { bubbles: true }));
      return { ok: true, message: "已写入文本。", node: node };
    }
    node.textContent = text;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("compositionend", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: true, message: "已写入文本。", node: node };
  }

  function fillFieldText(fieldName, value) {
    const found = findFieldTextInput(fieldName);
    if (!found || !found.node) {
      return {
        ok: false,
        message: found && found.message ? found.message : "未找到可填写输入框：" + fieldName,
      };
    }
    found.node.setAttribute("data-asc-field-name", fieldName);
    const result = setTextValue(found.node, value);
    if (!result.ok) {
      return { ok: false, message: result.message || "输入框不可写。", node: result.node || found.node };
    }
    return {
      ok: true,
      message: "已填写 " + fieldName,
      node: result.node,
    };
  }

  function waitForFieldTextInput(fieldName, timeoutMs) {
    const timeout = Number(timeoutMs) > 0 ? Number(timeoutMs) : 2000;
    const intervalMs = 90;
    const startedAt = Date.now();
    return new Promise(function (resolve) {
      function check() {
        const found = findFieldTextInput(fieldName);
        if (found && found.ok && found.node) {
          found.node.setAttribute("data-asc-field-name", fieldName);
          resolve({ ok: true, node: found.node, message: "已找到输入框。" });
          return;
        }
        if (Date.now() - startedAt >= timeout) {
          resolve({
            ok: false,
            node: null,
            message:
              (found && found.message ? found.message : "未找到输入框。") +
              "（" +
              String(timeout) +
              "ms）",
          });
          return;
        }
        window.setTimeout(check, intervalMs);
      }
      check();
    });
  }

  function getActionButtonText(node) {
    if (!(node instanceof Element)) {
      return "";
    }
    if (node instanceof HTMLInputElement) {
      return normalizeExact(node.value || node.getAttribute("aria-label") || "");
    }
    return normalizeExact(
      node.textContent || node.getAttribute("aria-label") || node.getAttribute("title") || ""
    );
  }

  function getVisibleActionButtons() {
    const selectors = [
      "button",
      "[role='button']",
      ".ant-btn",
      ".el-button",
      "input[type='button']",
      "input[type='submit']",
    ];
    const nodes = document.querySelectorAll(selectors.join(","));
    const result = [];
    const seen = new Set();
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (!(node instanceof Element) || !isVisible(node)) {
        continue;
      }
      const clickable = findClickableElement(node) || node;
      if (!(clickable instanceof Element) || !isVisible(clickable)) {
        continue;
      }
      if (seen.has(clickable)) {
        continue;
      }
      seen.add(clickable);
      result.push(clickable);
    }
    return result;
  }

  function isItemsPage() {
    const pathname = String(location.pathname || "");
    if (pathname === "/items") {
      return true;
    }
    if (pathname.indexOf("/data-task/v2") === 0 || pathname.indexOf("/task-v2/data-item") === 0) {
      return false;
    }
    return pathname.indexOf("/items") >= 0;
  }

  function isViewMode() {
    const params = new URLSearchParams(location.search || "");
    return params.get("viewMode") === "true";
  }

  function containsRoleSignal(text) {
    const normalized = normalizeText(text);
    if (!normalized) {
      return false;
    }
    return REVIEW_ROLE_SIGNAL_TEXTS.some(function (signal) {
      return normalized.indexOf(normalizeText(signal)) >= 0;
    });
  }

  function isLikelyReviewRole() {
    const params = new URLSearchParams(location.search || "");
    const roleText = normalizeText(params.get("role") || "");
    const nodeText = normalizeText(params.get("nodeId") || "");
    if (roleText.indexOf("review") >= 0 || nodeText.indexOf("review") >= 0) {
      return true;
    }

    const signalSelectors = [
      "header",
      "nav",
      "aside",
      ".ant-breadcrumb",
      ".breadcrumb",
      ".ant-menu",
      ".ant-layout-sider",
      ".ant-tabs-nav",
      "[class*='breadcrumb']",
      "[class*='menu']",
      "[class*='sider']",
      "[class*='header']",
      "[class*='role']",
      "[class*='tab']",
      "h1",
      "h2",
      "h3",
    ];
    const signalNodes = document.querySelectorAll(signalSelectors.join(","));
    for (let i = 0; i < signalNodes.length; i += 1) {
      const node = signalNodes[i];
      if (!(node instanceof Element) || !isVisible(node)) {
        continue;
      }
      if (containsRoleSignal(node.textContent || "")) {
        return true;
      }
    }
    return false;
  }

  function clickActionButtonByTexts(texts, options) {
    const runtimeOptions = options && typeof options === "object" ? options : {};
    const targets = Array.isArray(texts)
      ? texts
          .map(function (item) {
            return normalizeText(item);
          })
          .filter(Boolean)
      : [];
    if (targets.length === 0) {
      return {
        ok: false,
        message: "未提供按钮文案匹配规则。",
      };
    }

    const buttons = getVisibleActionButtons();
    const exactMatches = [];
    const fuzzyMatches = [];
    for (let i = 0; i < buttons.length; i += 1) {
      const button = buttons[i];
      const normalizedText = normalizeText(getActionButtonText(button));
      const compactText = normalizeCompactText(getActionButtonText(button));
      if (!normalizedText && !compactText) {
        continue;
      }
      for (let j = 0; j < targets.length; j += 1) {
        const target = targets[j];
        const compactTarget = normalizeCompactText(target);
        if (normalizedText === target || compactText === compactTarget) {
          exactMatches.push(button);
          break;
        }
        if (
          (normalizedText.indexOf(target) >= 0 && target.length >= 2) ||
          (compactText.indexOf(compactTarget) >= 0 && compactTarget.length >= 2)
        ) {
          fuzzyMatches.push(button);
          break;
        }
      }
    }

    const matches = exactMatches.length > 0 ? exactMatches : fuzzyMatches;
    if (matches.length === 0) {
      return {
        ok: false,
        message: runtimeOptions.notFoundMessage || "未找到目标按钮。",
      };
    }

    const firstEnabled = matches.find(function (item) {
      return !isElementDisabled(item);
    });
    if (!firstEnabled) {
      return {
        ok: false,
        message: runtimeOptions.disabledMessage || "目标按钮不可用（disabled）。",
      };
    }

    dispatchClickSequence(firstEnabled);
    return {
      ok: true,
      message: runtimeOptions.successMessage || "已点击目标按钮。",
    };
  }

  function hasSelectedLikeClass(node) {
    if (!(node instanceof Element)) {
      return false;
    }
    const classText = String(node.className || "").toLowerCase();
    if (!classText) {
      return false;
    }
    return (
      classText.indexOf("selected") >= 0 ||
      classText.indexOf("checked") >= 0 ||
      classText.indexOf("active") >= 0 ||
      classText.indexOf("is-checked") >= 0 ||
      classText.indexOf("ant-radio-wrapper-checked") >= 0 ||
      classText.indexOf("el-radio is-checked") >= 0
    );
  }

  function isNodeMarkedSelected(node) {
    if (!(node instanceof Element)) {
      return false;
    }
    if (node instanceof HTMLInputElement) {
      const inputType = String(node.type || "").toLowerCase();
      if (inputType === "radio" || inputType === "checkbox") {
        return node.checked === true;
      }
    }

    const role = String(node.getAttribute("role") || "").toLowerCase();
    if ((role === "radio" || role === "checkbox") && node.getAttribute("aria-checked") === "true") {
      return true;
    }
    if (node.getAttribute("aria-checked") === "true") {
      return true;
    }
    if (node.getAttribute("data-checked") === "true") {
      return true;
    }
    if (node.getAttribute("data-selected") === "true") {
      return true;
    }
    if (hasSelectedLikeClass(node)) {
      return true;
    }
    return false;
  }

  function isOptionSelected(optionNode, clickable) {
    const candidateRoots = [clickable, optionNode].filter(function (node) {
      return node instanceof Element;
    });

    for (let i = 0; i < candidateRoots.length; i += 1) {
      const root = candidateRoots[i];
      if (isNodeMarkedSelected(root)) {
        return true;
      }
      const roleNode = root.closest("[role='radio'],[role='checkbox']");
      if (isNodeMarkedSelected(roleNode)) {
        return true;
      }
      const selectedAncestor = root.closest(
        ".is-checked,.checked,.selected,.active,.ant-radio-wrapper-checked,.el-radio.is-checked"
      );
      if (selectedAncestor) {
        return true;
      }
      const checkedInput = root.querySelector("input[type='radio']:checked,input[type='checkbox']:checked");
      if (checkedInput) {
        return true;
      }
      const checkedRole = root.querySelector(
        "[role='radio'][aria-checked='true'],[role='checkbox'][aria-checked='true']"
      );
      if (checkedRole) {
        return true;
      }
      const selectedDataNode = root.querySelector("[data-checked='true'],[data-selected='true']");
      if (selectedDataNode) {
        return true;
      }
    }
    return false;
  }

  function selectFieldOption(fieldName, optionText, options) {
    const runtimeOptions = options && typeof options === "object" ? options : {};
    const ensureSelected = runtimeOptions.ensureSelected === true;
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

    if (ensureSelected && isOptionSelected(optionNode, clickable)) {
      return {
        ok: true,
        skipped: true,
        message: "已保持 " + fieldName + "=" + optionText,
      };
    }

    dispatchClickSequence(clickable);
    return {
      ok: true,
      skipped: false,
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

    async function ensureDerivedSpecifyFields(reason) {
      const waitImage = await waitForField(FIELD_IMAGE_B_TEXTS_REMOVED, 1500);
      const waitOther = await waitForField(FIELD_OTHER_CHANGES, 1500);
      if (!waitImage.ok || !waitOther.ok) {
        return {
          ok: false,
          message:
            String(reason || "same_font 联动") + "失败：派生字段未在 1500ms 内渲染",
        };
      }

      const imageRes = selectFieldOption(FIELD_IMAGE_B_TEXTS_REMOVED, OPTION_SPECIFY, {
        ensureSelected: true,
      });
      const otherRes = selectFieldOption(FIELD_OTHER_CHANGES, OPTION_SPECIFY, {
        ensureSelected: true,
      });

      if (!imageRes.ok || !otherRes.ok) {
        return {
          ok: false,
          message:
            String(reason || "same_font 联动") +
            "失败：" +
            [imageRes.message, otherRes.message].filter(Boolean).join("；"),
        };
      }

      const allSkipped = imageRes.skipped === true && otherRes.skipped === true;
      return {
        ok: true,
        message: allSkipped
          ? "已保持 image_b_texts_removed=specify、other_changes=specify"
          : "已确保 image_b_texts_removed=specify、other_changes=specify",
      };
    }

    async function selectSameFontTrue() {
      const primary = selectFieldOption(FIELD_SAME_FONT, OPTION_TRUE, {
        ensureSelected: true,
      });
      if (!primary.ok) {
        return primary;
      }

      if (!shouldAutoSelectSpecify()) {
        return primary;
      }

      const derived = await ensureDerivedSpecifyFields("same_font=true 联动");
      if (!derived.ok) {
        return derived;
      }
      return {
        ok: true,
        message: "已选择 same_font=true；" + derived.message,
      };
    }

    async function selectSameFontFalse() {
      return selectFieldOption(FIELD_SAME_FONT, OPTION_FALSE, {
        ensureSelected: true,
      });
    }

    async function selectSameFontArtisticEffect() {
      const primary = selectFieldOption(FIELD_SAME_FONT, OPTION_ARTISTIC, {
        ensureSelected: true,
      });
      if (!primary.ok) {
        return primary;
      }
      if (!shouldAutoSelectSpecify()) {
        return primary;
      }
      const derived = await ensureDerivedSpecifyFields(
        "same_font=same underlying font+artistic effect 联动"
      );
      if (!derived.ok) {
        return derived;
      }
      return {
        ok: true,
        message:
          "已选择 same_font=same underlying font+artistic effect；" + derived.message,
      };
    }

    async function selectImageBTextsRemovedSpecify() {
      return selectFieldOption(FIELD_IMAGE_B_TEXTS_REMOVED, OPTION_SPECIFY, {
        ensureSelected: true,
      });
    }

    async function selectOtherChangesSpecify() {
      return selectFieldOption(FIELD_OTHER_CHANGES, OPTION_SPECIFY, {
        ensureSelected: true,
      });
    }

    async function clickStashSave() {
      if (!isItemsPage()) {
        return {
          ok: false,
          message: "当前页面不是 /items，未执行“暂存”。",
        };
      }
      if (isViewMode()) {
        return {
          ok: false,
          message: "当前为 viewMode=true 查看页，未执行“暂存”。",
        };
      }
      if (!hasSameFontField()) {
        return {
          ok: false,
          message: "当前页面未检测到 same_font 字段，未执行“暂存”。",
        };
      }

      return clickActionButtonByTexts(STASH_BUTTON_TEXTS, {
        notFoundMessage: "未找到“暂存”按钮。",
        disabledMessage: "“暂存”按钮当前不可用。",
        successMessage: "已点击“暂存”按钮。",
      });
    }

    async function clickSubmitReview() {
      if (!isItemsPage()) {
        return {
          ok: false,
          message: "当前页面不是 /items，未执行“送审”。",
        };
      }
      if (isViewMode()) {
        return {
          ok: false,
          message: "当前为 viewMode=true 查看页，未执行“送审”。",
        };
      }
      if (!hasSameFontField()) {
        return {
          ok: false,
          message: "当前页面未检测到 same_font 字段，未执行“送审”。",
        };
      }
      if (isLikelyReviewRole()) {
        return {
          ok: false,
          message: "当前疑似标注内审环境，已阻止送审快捷键。",
        };
      }

      const result = clickActionButtonByTexts(SUBMIT_REVIEW_BUTTON_TEXTS, {
        notFoundMessage: "未找到“送审”按钮。",
        disabledMessage: "“送审”按钮当前不可用。",
        successMessage: "已点击“送审”按钮；若出现二次确认弹窗，请手动确认。",
      });
      return result;
    }

    return {
      hasSameFontField: hasSameFontField,
      selectSameFontTrue: selectSameFontTrue,
      selectSameFontFalse: selectSameFontFalse,
      selectSameFontArtisticEffect: selectSameFontArtisticEffect,
      selectImageBTextsRemovedSpecify: selectImageBTextsRemovedSpecify,
      selectOtherChangesSpecify: selectOtherChangesSpecify,
      clickStashSave: clickStashSave,
      clickSubmitReview: clickSubmitReview,
      selectFieldOption: selectFieldOption,
      fillFieldText: fillFieldText,
      waitForFieldTextInput: waitForFieldTextInput,
      waitForField: waitForField,
      isViewMode: isViewMode,
      isLikelyReviewRole: isLikelyReviewRole,
      clickActionButtonByTexts: clickActionButtonByTexts,
    };
  }

  globalThis.__ASCEdgeAbakaAiDomActions = {
    createRuntime: createRuntime,
    selectFieldOption: selectFieldOption,
    fillFieldText: fillFieldText,
    waitForFieldTextInput: waitForFieldTextInput,
    setTextValue: setTextValue,
    waitForField: waitForField,
  };
})();
