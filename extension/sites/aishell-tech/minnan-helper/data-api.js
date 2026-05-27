(function () {
  const SOURCE = "ASR_EDGE_AISHELL_TECH_MARK_PAGE";
  const MESSAGE_TYPES = {
    TASK_DETAIL: "AISHELL_TECH_TASK_DETAIL",
    PACKAGE_ITEMS: "AISHELL_TECH_PACKAGE_ITEMS",
    MARK_DETAIL: "AISHELL_TECH_MARK_DETAIL",
    SHORT_MARK: "AISHELL_TECH_SHORT_MARK",
    SAVE_RESULT: "AISHELL_TECH_SAVE_RESULT",
  };
  const WINDOW_CACHE_KEY = "__ASREdgeAishellTechMarkCache";

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function removeTextSpaces(value) {
    return String(value || "").replace(/[\s\u3000]+/g, "");
  }

  function ensureChineseSentencePunctuation(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const last = text[text.length - 1];
    if ("。！？；…".indexOf(last) >= 0) {
      return text;
    }
    if (last === ".") {
      return text.slice(0, -1) + "。";
    }
    if (last === "?") {
      return text.slice(0, -1) + "？";
    }
    if (last === "!") {
      return text.slice(0, -1) + "！";
    }
    if (last === ";") {
      return text.slice(0, -1) + "；";
    }
    return text + "。";
  }

  function isMarkPage() {
    return (
      location.hostname === "mark.aishelltech.com" &&
      String(location.pathname || "").toLowerCase() === "/mytask/mark"
    );
  }

  function parseRouteParams() {
    const params = new URLSearchParams(location.search || "");
    return {
      taskId: normalizeText(params.get("taskId")),
      packageId: normalizeText(params.get("packageId")),
    };
  }

  function toNumberOrNull(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function waitForCondition(checker, timeoutMs, intervalMs) {
    const timeout = Math.max(500, Number(timeoutMs) || 5000);
    const interval = Math.max(50, Number(intervalMs) || 100);
    const deadline = Date.now() + timeout;
    return new Promise(function (resolve) {
      function tick() {
        let result = null;
        try {
          result = checker();
        } catch (_error) {
          result = null;
        }
        if (result) {
          resolve(result);
          return;
        }
        if (Date.now() >= deadline) {
          resolve(null);
          return;
        }
        window.setTimeout(tick, interval);
      }
      tick();
    });
  }

  function createRuntime() {
    const state = {
      taskDetails: [],
      packageItems: [],
      markDetails: [],
      shortMarks: [],
      saveResults: [],
    };

    function hydrateFromWindowCache() {
      const cache = window[WINDOW_CACHE_KEY];
      if (!cache || typeof cache !== "object") {
        return;
      }
      ["taskDetails", "packageItems", "markDetails", "shortMarks", "saveResults"].forEach(function (
        key
      ) {
        if (Array.isArray(cache[key])) {
          state[key] = cache[key].slice();
        }
      });
    }

    function remember(key, entry) {
      state[key].unshift(entry);
      state[key] = state[key].slice(0, 50);
    }

    function handleMessage(event) {
      if (event.source !== window || event.origin !== location.origin) {
        return;
      }
      const data = event.data || {};
      if (data.source !== SOURCE) {
        return;
      }
      if (data.type === MESSAGE_TYPES.TASK_DETAIL) {
        remember("taskDetails", data.payload);
      } else if (data.type === MESSAGE_TYPES.PACKAGE_ITEMS) {
        remember("packageItems", data.payload);
      } else if (data.type === MESSAGE_TYPES.MARK_DETAIL) {
        remember("markDetails", data.payload);
      } else if (data.type === MESSAGE_TYPES.SHORT_MARK) {
        remember("shortMarks", data.payload);
      } else if (data.type === MESSAGE_TYPES.SAVE_RESULT) {
        remember("saveResults", data.payload);
      }
    }

    function start() {
      hydrateFromWindowCache();
      window.addEventListener("message", handleMessage);
    }

    function stop() {
      window.removeEventListener("message", handleMessage);
      state.taskDetails = [];
      state.packageItems = [];
      state.markDetails = [];
      state.shortMarks = [];
      state.saveResults = [];
    }

    function getTaskDetail(taskId) {
      const key = normalizeText(taskId || parseRouteParams().taskId);
      return (
        state.taskDetails.find(function (entry) {
          return normalizeText(entry?.taskId) === key;
        }) ||
        state.taskDetails[0] ||
        null
      );
    }

    function getPackageEntry(packageId) {
      const key = normalizeText(packageId || parseRouteParams().packageId);
      return (
        state.packageItems.find(function (entry) {
          return normalizeText(entry?.packageId) === key;
        }) ||
        state.packageItems[0] ||
        null
      );
    }

    function getMarkDetail(taskItemId) {
      const key = normalizeText(taskItemId);
      return (
        state.markDetails.find(function (entry) {
          return normalizeText(entry?.taskItemId) === key;
        }) || null
      );
    }

    function getShortMark(taskItemId) {
      const key = normalizeText(taskItemId);
      return (
        state.shortMarks.find(function (entry) {
          return normalizeText(entry?.taskItemId) === key;
        }) || null
      );
    }

    function getSaveResult(taskItemId, afterAt) {
      const key = normalizeText(taskItemId);
      const minAt = Number(afterAt) || 0;
      return (
        state.saveResults.find(function (entry) {
          return normalizeText(entry?.taskItemId) === key && Number(entry?.at || 0) >= minAt;
        }) || null
      );
    }

    function getListItemNodes() {
      return Array.from(document.querySelectorAll(".list .list-item, .list .list-item-selected, .list .list-item-finshed")).filter(function (
        node
      ) {
        return node instanceof HTMLElement;
      });
    }

    function getListDomItems() {
      return getListItemNodes().map(function (node, index) {
        const button =
          node.querySelector("button.el-button--text, button") ||
          null;
        const label = normalizeText(button?.textContent || node.textContent || "");
        return {
          index: index,
          node: node,
          button: button instanceof HTMLElement ? button : node,
          label: label,
          selected: node.classList.contains("list-item-selected"),
          finished: node.classList.contains("list-item-finshed"),
        };
      });
    }

    function getSelectedIndex() {
      const items = getListDomItems();
      const index = items.findIndex(function (item) {
        return item.selected;
      });
      return index >= 0 ? index : items.length > 0 ? 0 : -1;
    }

    function getTextInput() {
      return document.querySelector(".mark-area input.el-input__inner[type='text']");
    }

    function getCurrentInputValue() {
      const input = getTextInput();
      return input instanceof HTMLInputElement ? String(input.value || "").trim() : "";
    }

    function canFillPageText() {
      const input = getTextInput();
      return Boolean(input && !input.disabled && !input.readOnly);
    }

    function fillPageText(text) {
      const input = getTextInput();
      if (!(input instanceof HTMLInputElement) || input.disabled || input.readOnly) {
        return {
          ok: false,
          message: "无法定位可编辑的标注输入框。",
        };
      }
      const nextText = ensureChineseSentencePunctuation(removeTextSpaces(text));
      input.focus();
      input.value = nextText;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return {
        ok: true,
        message: "已填入推荐文本。",
      };
    }

    function getSaveButton() {
      return (
        Array.from(document.querySelectorAll(".mark-area button")).find(function (button) {
          return normalizeText(button.textContent || "").indexOf("保存") >= 0;
        }) || null
      );
    }

    function getReferenceTextFromDom() {
      const labels = Array.from(document.querySelectorAll(".mark-area .el-form-item"));
      const target = labels.find(function (item) {
        return normalizeText(item.textContent || "").indexOf("原始文本") >= 0;
      });
      if (!target) {
        return "";
      }
      const valueNode =
        target.querySelector(".el-form-item__content") ||
        target.querySelector(".el-input") ||
        target;
      return normalizeText(valueNode.textContent || "").replace(/^原始文本/, "").trim();
    }

    function buildItemFromRecord(record, index) {
      const routeParams = parseRouteParams();
      const taskDetail = getTaskDetail(routeParams.taskId);
      const markDetail = getMarkDetail(record?.id);
      const shortMark = getShortMark(record?.id);
      const relativeUrl = normalizeText(markDetail?.url || record?.url);
      const dataRoot = normalizeText(markDetail?.dataRoot || taskDetail?.dataRoot);
      const audioUrl =
        normalizeText(markDetail?.audioUrl) ||
        (dataRoot && relativeUrl ? dataRoot + relativeUrl : normalizeText(record?.audioUrl));
      const referenceText =
        normalizeText(markDetail?.text || record?.text) || getReferenceTextFromDom();
      const taskItemId = normalizeText(record?.id);
      const item = {
        taskId: routeParams.taskId,
        packageId: routeParams.packageId,
        taskItemId: taskItemId,
        number: Number(record?.number || index + 1) || index + 1,
        fileName: normalizeText(markDetail?.fileName || record?.fileName),
        audioUrl: audioUrl,
        referenceText: referenceText,
        existingMarkText:
          normalizeText(shortMark?.markText) || getCurrentInputValue(),
        duration: toNumberOrNull(markDetail?.audioLength),
        spendTime: Number(record?.spendTime || 0) || 0,
        dataStatus: Number(record?.dataStatus || 0) || 0,
        checkStatus: Number(record?.checkStatus || 0) || 0,
        record: record || null,
      };
      item.key = [
        item.taskId,
        item.packageId,
        item.taskItemId,
        item.number,
        item.fileName,
        item.referenceText,
      ].join("|");
      return item;
    }

    async function getCurrentItem() {
      const packageEntry = getPackageEntry();
      const records = Array.isArray(packageEntry?.items) ? packageEntry.items : [];
      const selectedIndex = getSelectedIndex();
      if (selectedIndex < 0 || !records[selectedIndex]) {
        return null;
      }
      const item = buildItemFromRecord(records[selectedIndex], selectedIndex);
      item.currentInputText = getCurrentInputValue();
      return item;
    }

    function getRecordDisplayName(record) {
      const number = Number(record?.number || 0) || 0;
      const fileName = normalizeText(record?.fileName);
      if (number > 0 && fileName) {
        return "第 " + String(number) + " 条 " + fileName;
      }
      if (fileName) {
        return fileName;
      }
      if (number > 0) {
        return "第 " + String(number) + " 条";
      }
      return "未命名条目";
    }

    function getBatchTasksFromCurrentSelection() {
      const packageEntry = getPackageEntry();
      const records = Array.isArray(packageEntry?.items) ? packageEntry.items : [];
      const domItems = getListDomItems();
      const selectedIndex = getSelectedIndex();
      if (selectedIndex < 0) {
        return [];
      }
      return records
        .map(function (record, index) {
          return {
            index: index,
            dom: domItems[index] || null,
            record: record,
            item: buildItemFromRecord(record, index),
          };
        })
        .filter(function (entry) {
          return entry.index >= selectedIndex && entry.dom && entry.dom.finished !== true;
        })
        .map(function (entry) {
          return Object.assign({}, entry, {
            processKey: "taskItemId:" + normalizeText(entry.item.taskItemId),
            displayName: getRecordDisplayName(entry.record),
          });
        });
    }

    async function waitForSelection(taskItemId, timeoutMs) {
      const key = normalizeText(taskItemId);
      return waitForCondition(function () {
        const packageEntry = getPackageEntry();
        const records = Array.isArray(packageEntry?.items) ? packageEntry.items : [];
        const selectedIndex = getSelectedIndex();
        if (selectedIndex < 0 || !records[selectedIndex]) {
          return null;
        }
        return normalizeText(records[selectedIndex].id) === key ? true : null;
      }, timeoutMs, 100);
    }

    async function selectRecord(taskItemId) {
      const key = normalizeText(taskItemId);
      const packageEntry = getPackageEntry();
      const records = Array.isArray(packageEntry?.items) ? packageEntry.items : [];
      const targetIndex = records.findIndex(function (record) {
        return normalizeText(record?.id) === key;
      });
      if (targetIndex < 0) {
        return {
          ok: false,
          message: "找不到目标条目的列表数据。",
        };
      }
      const domItems = getListDomItems();
      const domItem = domItems[targetIndex];
      if (!domItem || !(domItem.button instanceof HTMLElement)) {
        return {
          ok: false,
          message: "找不到目标条目的页面节点。",
        };
      }
      domItem.button.click();
      const selected = await waitForSelection(key, 5000);
      if (!selected) {
        return {
          ok: false,
          message: "点击条目后未能确认选中状态。",
        };
      }
      return {
        ok: true,
        message: "已选中目标条目。",
      };
    }

    async function waitForItemInputReady(taskItemId, timeoutMs) {
      const key = normalizeText(taskItemId);
      const ready = await waitForCondition(function () {
        const input = getTextInput();
        if (!(input instanceof HTMLInputElement)) {
          return null;
        }
        const current = getCurrentItem();
        return Promise.resolve(current).then(function (item) {
          return item && normalizeText(item.taskItemId) === key ? true : null;
        });
      }, timeoutMs, 100);
      return Boolean(ready);
    }

    async function clickSaveAndWait(taskItemId, timeoutMs) {
      const key = normalizeText(taskItemId);
      const saveButton = getSaveButton();
      if (!(saveButton instanceof HTMLButtonElement) && !(saveButton instanceof HTMLElement)) {
        return {
          ok: false,
          message: "未找到页面真实保存按钮。",
        };
      }
      if (
        saveButton.disabled === true ||
        saveButton.classList.contains("is-disabled") ||
        saveButton.getAttribute("disabled") !== null
      ) {
        return {
          ok: false,
          message: "页面保存按钮当前不可用。",
        };
      }
      const beforeAt = Date.now();
      saveButton.click();
      const saveResult = await waitForCondition(function () {
        return getSaveResult(key, beforeAt);
      }, timeoutMs || 12000, 120);
      if (!saveResult) {
        return {
          ok: false,
          message: "等待保存结果超时。",
        };
      }
      if (saveResult.success !== true) {
        return {
          ok: false,
          message: saveResult.message || "页面保存失败。",
        };
      }
      const changed = await waitForCondition(function () {
        const packageEntry = getPackageEntry();
        const records = Array.isArray(packageEntry?.items) ? packageEntry.items : [];
        const selectedIndex = getSelectedIndex();
        const selectedRecord = selectedIndex >= 0 ? records[selectedIndex] : null;
        if (selectedRecord && normalizeText(selectedRecord.id) !== key) {
          return {
            nextTaskItemId: normalizeText(selectedRecord.id),
          };
        }
        const domItems = getListDomItems();
        const currentIndex = records.findIndex(function (record) {
          return normalizeText(record?.id) === key;
        });
        if (currentIndex >= 0 && domItems[currentIndex] && domItems[currentIndex].finished === true) {
          return {
            nextTaskItemId: selectedRecord ? normalizeText(selectedRecord.id) : "",
          };
        }
        return null;
      }, timeoutMs || 12000, 120);
      if (!changed) {
        return {
          ok: false,
          message: "保存后未能确认条目切换或完成状态。",
        };
      }
      return {
        ok: true,
        message: "已通过页面真实保存按钮保存当前条目。",
        nextTaskItemId: normalizeText(changed.nextTaskItemId),
      };
    }

    return {
      canFillPageText,
      clickSaveAndWait,
      fillPageText,
      getBatchTasksFromCurrentSelection,
      getCurrentItem,
      getRecordDisplayName,
      getSelectedIndex,
      isMarkPage,
      parseRouteParams,
      selectRecord,
      start,
      stop,
      waitForCondition,
      waitForItemInputReady,
    };
  }

  globalThis.__ASREdgeAishellTechMinnanDataApi = {
    createRuntime,
    ensureChineseSentencePunctuation,
    isMarkPage,
    parseRouteParams,
    removeTextSpaces,
  };
})();
