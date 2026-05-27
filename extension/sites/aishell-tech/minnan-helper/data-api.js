(function () {
  if (globalThis.__ASREdgeAishellTechMinnanDataApiInstalled === true) {
    return;
  }
  globalThis.__ASREdgeAishellTechMinnanDataApiInstalled = true;

  const API_ORIGIN = "https://markapi.aishelltech.com";
  const TOKEN_PATTERN = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;
  const PRIORITY_TOKEN_KEYS = [
    "authorization",
    "authorisation",
    "token",
    "accessToken",
    "access_token",
    "jwt",
    "id_token",
  ];

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function removeTextSpaces(text) {
    return String(text || "").replace(/[\s\u3000]+/g, "");
  }

  function ensureChineseSentencePunctuation(text) {
    const value = String(text || "").trim();
    if (!value) {
      return "";
    }
    const last = value[value.length - 1];
    if ("。！？；…".indexOf(last) >= 0) {
      return value;
    }
    if (last === ".") {
      return value.slice(0, -1) + "。";
    }
    if (last === "?") {
      return value.slice(0, -1) + "？";
    }
    if (last === "!") {
      return value.slice(0, -1) + "！";
    }
    if (last === ";") {
      return value.slice(0, -1) + "；";
    }
    return value + "。";
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

  function safeJsonParse(value) {
    try {
      return JSON.parse(String(value || ""));
    } catch (_error) {
      return null;
    }
  }

  function stripBearerPrefix(value) {
    const text = normalizeText(value);
    if (!text) {
      return "";
    }
    if (/^bearer\s+/i.test(text)) {
      return normalizeText(text.replace(/^bearer\s+/i, ""));
    }
    return text;
  }

  function isJwtLike(value) {
    return TOKEN_PATTERN.test(String(value || ""));
  }

  function extractAuthTokenFromUnknown(value, depth, seen) {
    if (depth > 6) {
      return "";
    }
    if (value === undefined || value === null) {
      return "";
    }

    if (typeof value === "string") {
      const direct = stripBearerPrefix(value);
      if (isJwtLike(direct)) {
        return direct;
      }
      const trimmed = String(value || "").trim();
      if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) {
        return "";
      }
      const parsed = safeJsonParse(trimmed);
      return parsed ? extractAuthTokenFromUnknown(parsed, depth + 1, seen) : "";
    }

    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        const token = extractAuthTokenFromUnknown(value[index], depth + 1, seen);
        if (token) {
          return token;
        }
      }
      return "";
    }

    if (typeof value !== "object") {
      return "";
    }

    if (seen.has(value)) {
      return "";
    }
    seen.add(value);

    const keys = Object.keys(value);
    const orderedKeys = keys
      .slice()
      .sort(function (left, right) {
        const leftPriority = PRIORITY_TOKEN_KEYS.indexOf(left);
        const rightPriority = PRIORITY_TOKEN_KEYS.indexOf(right);
        const leftRank = leftPriority >= 0 ? leftPriority : PRIORITY_TOKEN_KEYS.length + 1;
        const rightRank = rightPriority >= 0 ? rightPriority : PRIORITY_TOKEN_KEYS.length + 1;
        return leftRank - rightRank;
      });

    for (let index = 0; index < orderedKeys.length; index += 1) {
      const key = orderedKeys[index];
      const token = extractAuthTokenFromUnknown(value[key], depth + 1, seen);
      if (token) {
        return token;
      }
    }

    return "";
  }

  function readStorageEntries(storageLike) {
    if (!storageLike || typeof storageLike.length !== "number") {
      return [];
    }
    const entries = [];
    for (let index = 0; index < storageLike.length; index += 1) {
      const key =
        typeof storageLike.key === "function" ? normalizeText(storageLike.key(index)) : "";
      if (!key) {
        continue;
      }
      let value = "";
      try {
        value = storageLike.getItem(key);
      } catch (_error) {
        value = "";
      }
      entries.push({
        key: key,
        value: value,
      });
    }
    return entries;
  }

  function findAuthTokenInEntries(entries) {
    const source = Array.isArray(entries) ? entries : [];
    const prioritized = source
      .slice()
      .sort(function (left, right) {
        const leftKey = String(left?.key || "").toLowerCase();
        const rightKey = String(right?.key || "").toLowerCase();
        const leftPriority = PRIORITY_TOKEN_KEYS.findIndex(function (tokenKey) {
          return leftKey.indexOf(tokenKey.toLowerCase()) >= 0;
        });
        const rightPriority = PRIORITY_TOKEN_KEYS.findIndex(function (tokenKey) {
          return rightKey.indexOf(tokenKey.toLowerCase()) >= 0;
        });
        const leftRank = leftPriority >= 0 ? leftPriority : PRIORITY_TOKEN_KEYS.length + 1;
        const rightRank = rightPriority >= 0 ? rightPriority : PRIORITY_TOKEN_KEYS.length + 1;
        return leftRank - rightRank;
      });

    for (let index = 0; index < prioritized.length; index += 1) {
      const entry = prioritized[index];
      const token = extractAuthTokenFromUnknown(entry?.value, 0, new WeakSet());
      if (token) {
        return token;
      }
    }
    return "";
  }

  function readAuthTokenFromPageStorage() {
    const localEntries = readStorageEntries(window.localStorage);
    const localToken = findAuthTokenInEntries(localEntries);
    if (localToken) {
      return localToken;
    }
    const sessionEntries = readStorageEntries(window.sessionStorage);
    return findAuthTokenInEntries(sessionEntries);
  }

  function createRequestError(message) {
    return new Error(String(message || "请求失败。"));
  }

  function buildApiUrl(path) {
    return API_ORIGIN + String(path || "");
  }

  function getCurrentInputValue() {
    const input = document.querySelector(".mark-area input.el-input__inner[type='text']");
    return input instanceof HTMLInputElement ? normalizeText(input.value) : "";
  }

  function getTextInput() {
    const input = document.querySelector(".mark-area input.el-input__inner[type='text']");
    return input instanceof HTMLInputElement ? input : null;
  }

  function getReferenceTextFromDom() {
    const rows = Array.from(document.querySelectorAll(".mark-area .el-form-item"));
    const target = rows.find(function (row) {
      return normalizeText(row.textContent || "").indexOf("原始文本") >= 0;
    });
    if (!(target instanceof HTMLElement)) {
      return "";
    }
    const content =
      target.querySelector(".el-form-item__content") ||
      target.querySelector(".el-input") ||
      target;
    return normalizeText(String(content.textContent || "").replace(/^原始文本/, ""));
  }

  function getListItemNodes() {
    return Array.from(
      document.querySelectorAll(".list .list-item, .list .list-item-selected, .list .list-item-finshed")
    ).filter(function (node) {
      return node instanceof HTMLElement;
    });
  }

  function getListDomItems() {
    return getListItemNodes().map(function (node, index) {
      const button = node.querySelector("button.el-button--text, button");
      return {
        index: index,
        node: node,
        button: button instanceof HTMLElement ? button : node,
        selected: node.classList.contains("list-item-selected"),
        finished: node.classList.contains("list-item-finshed"),
        label: normalizeText(button?.textContent || node.textContent || ""),
      };
    });
  }

  function getSelectedIndex() {
    const items = getListDomItems();
    const selectedIndex = items.findIndex(function (item) {
      return item.selected === true;
    });
    return selectedIndex >= 0 ? selectedIndex : items.length > 0 ? 0 : -1;
  }

  function getSaveButton() {
    return (
      Array.from(document.querySelectorAll(".mark-area button.el-button--primary")).find(
        function (button) {
          return button instanceof HTMLButtonElement && normalizeText(button.textContent || "") === "保存";
        }
      ) || null
    );
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
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

  function isSaveCompletionState(previousIndex, snapshot) {
    const source = snapshot && typeof snapshot === "object" ? snapshot : {};
    if (!Number.isInteger(Number(previousIndex)) || Number(previousIndex) < 0) {
      return false;
    }
    if (Number(source.selectedIndex) !== Number(previousIndex)) {
      return true;
    }
    return source.previousItemFinished === true;
  }

  function createRuntime() {
    const state = {
      authToken: "",
      routeKey: "",
      taskDetailByTaskId: Object.create(null),
      packageItemsByPackageId: Object.create(null),
    };

    function clearRouteCache() {
      state.taskDetailByTaskId = Object.create(null);
      state.packageItemsByPackageId = Object.create(null);
    }

    function syncRouteKey() {
      const routeParams = parseRouteParams();
      const nextKey = [routeParams.taskId, routeParams.packageId].join("|");
      if (nextKey !== state.routeKey) {
        state.routeKey = nextKey;
        clearRouteCache();
      }
    }

    function captureListState(previousIndex) {
      const domItems = getListDomItems();
      const normalizedPreviousIndex = Number(previousIndex);
      return {
        selectedIndex: getSelectedIndex(),
        previousItemFinished:
          Number.isInteger(normalizedPreviousIndex) &&
          normalizedPreviousIndex >= 0 &&
          domItems[normalizedPreviousIndex]
            ? domItems[normalizedPreviousIndex].finished === true
            : false,
      };
    }

    function getAuthToken() {
      if (state.authToken) {
        return state.authToken;
      }
      const token = readAuthTokenFromPageStorage();
      if (!token) {
        throw createRequestError("未能从页面读取 Aishell 登录态，请重新登录后再试。");
      }
      state.authToken = token;
      return state.authToken;
    }

    async function requestJson(path) {
      syncRouteKey();
      const token = getAuthToken();
      const response = await fetch(buildApiUrl(path), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
      });
      const payload = await response.json().catch(function () {
        return null;
      });

      if (response.status === 401 || response.status === 403) {
        state.authToken = "";
        throw createRequestError("Aishell 登录状态已失效，请重新登录后再试。");
      }
      if (!response.ok) {
        throw createRequestError(
          "Aishell 平台请求失败（HTTP " + String(response.status) + "）。"
        );
      }
      if (payload?.data?.isSucceed === false) {
        throw createRequestError(normalizeText(payload?.data?.message) || "Aishell 平台返回失败。");
      }
      return payload;
    }

    async function ensureTaskDetail(taskId) {
      const key = normalizeText(taskId || parseRouteParams().taskId);
      if (!key) {
        throw createRequestError("当前页面缺少 taskId。");
      }
      if (state.taskDetailByTaskId[key]) {
        return state.taskDetailByTaskId[key];
      }
      const payload = await requestJson("/api/task/detail/" + encodeURIComponent(key));
      const result = payload?.data?.result || {};
      const entry = {
        taskId: key,
        templateId: normalizeText(result.templateId),
        taskName: normalizeText(result.taskName),
        dataRoot: normalizeText(result?.project?.dataRoot),
        raw: result,
      };
      state.taskDetailByTaskId[key] = entry;
      return entry;
    }

    async function ensurePackageItems(packageId) {
      const key = normalizeText(packageId || parseRouteParams().packageId);
      if (!key) {
        throw createRequestError("当前页面缺少 packageId。");
      }
      if (state.packageItemsByPackageId[key]) {
        return state.packageItemsByPackageId[key];
      }
      const payload = await requestJson(
        "/api/taskItem/packageItemList/" + encodeURIComponent(key)
      );
      const result = payload?.data?.result || {};
      const entry = {
        packageId: key,
        totalCount: Number(result.totalCount || 0) || 0,
        items: Array.isArray(result.items)
          ? result.items.map(function (item, index) {
              const source = item && typeof item === "object" ? item : {};
              return {
                id: normalizeText(source.id),
                number: Number(source.number || index + 1) || index + 1,
                fileName: normalizeText(source.fileName),
                url: normalizeText(source.url),
                text: normalizeText(source.text),
                spendTime: Number(source.spendTime || 0) || 0,
                dataStatus: Number(source.dataStatus || 0) || 0,
                checkStatus: Number(source.checkStatus || 0) || 0,
              };
            })
          : [],
      };
      state.packageItemsByPackageId[key] = entry;
      return entry;
    }

    async function getItemByIndex(index, options) {
      syncRouteKey();
      const routeParams = parseRouteParams();
      const selectedIndex = Number(index);
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0) {
        return null;
      }
      const taskDetail = await ensureTaskDetail(routeParams.taskId);
      const packageEntry = await ensurePackageItems(routeParams.packageId);
      const record = packageEntry.items[selectedIndex];
      if (!record) {
        return null;
      }
      const source = options && typeof options === "object" ? options : {};
      const existingMarkText =
        source.includeCurrentInput === true ? getCurrentInputValue() : "";
      const referenceText = normalizeText(record.text) || getReferenceTextFromDom();
      const audioUrl =
        taskDetail.dataRoot && record.url ? taskDetail.dataRoot + record.url : "";
      const item = {
        taskId: routeParams.taskId,
        packageId: routeParams.packageId,
        taskItemId: normalizeText(record.id),
        number: Number(record.number || selectedIndex + 1) || selectedIndex + 1,
        fileName: normalizeText(record.fileName),
        audioUrl: audioUrl,
        referenceText: referenceText,
        existingMarkText: existingMarkText,
        duration: null,
        spendTime: Number(record.spendTime || 0) || 0,
        dataStatus: Number(record.dataStatus || 0) || 0,
        checkStatus: Number(record.checkStatus || 0) || 0,
        key: [
          routeParams.taskId,
          routeParams.packageId,
          normalizeText(record.id),
          normalizeText(record.fileName),
        ].join("|"),
      };
      return item;
    }

    async function getCurrentItem() {
      const selectedIndex = getSelectedIndex();
      if (selectedIndex < 0) {
        return null;
      }
      return getItemByIndex(selectedIndex, {
        includeCurrentInput: true,
      });
    }

    async function getBatchTasksFromCurrentSelection() {
      syncRouteKey();
      const routeParams = parseRouteParams();
      const packageEntry = await ensurePackageItems(routeParams.packageId);
      const domItems = getListDomItems();
      const selectedIndex = getSelectedIndex();
      if (selectedIndex < 0) {
        return [];
      }
      return packageEntry.items
        .map(function (record, index) {
          return {
            index: index,
            record: record,
            dom: domItems[index] || null,
          };
        })
        .filter(function (entry) {
          return entry.index >= selectedIndex && entry.dom && entry.dom.finished !== true;
        })
        .map(function (entry) {
          return {
            index: entry.index,
            taskItemId: normalizeText(entry.record.id),
            displayName: getRecordDisplayName(entry.record),
          };
        });
    }

    async function waitForSelectedIndex(targetIndex, timeoutMs) {
      const deadline = Date.now() + Math.max(1000, Number(timeoutMs || 5000) || 5000);
      while (Date.now() < deadline) {
        if (getSelectedIndex() === targetIndex) {
          return true;
        }
        await sleep(120);
      }
      return getSelectedIndex() === targetIndex;
    }

    async function selectItemByIndex(targetIndex, options) {
      const selectedIndex = getSelectedIndex();
      if (selectedIndex === targetIndex) {
        return {
          ok: true,
          message: "当前条已选中。",
        };
      }
      const domItems = getListDomItems();
      const entry = domItems[targetIndex];
      const trigger = entry?.button;
      if (!(trigger instanceof HTMLElement)) {
        return {
          ok: false,
          message: "无法定位要切换的列表条目。",
        };
      }
      trigger.click();
      const ready = await waitForSelectedIndex(
        targetIndex,
        options?.timeoutMs || 5000
      );
      return ready
        ? { ok: true, message: "已切换到目标条目。" }
        : { ok: false, message: "切换条目超时，页面没有选中目标条目。" };
    }

    function start() {
      syncRouteKey();
    }

    function canFillPageText() {
      return getTextInput() instanceof HTMLInputElement;
    }

    function fillPageText(text) {
      const input = getTextInput();
      if (!(input instanceof HTMLInputElement)) {
        return {
          ok: false,
          message: "当前页面没有定位到可编辑文本框。",
        };
      }
      const nextValue = ensureChineseSentencePunctuation(removeTextSpaces(text));
      if (!nextValue) {
        return {
          ok: false,
          message: "没有可填入的推荐文本。",
        };
      }
      input.focus();
      input.value = nextValue;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return {
        ok: true,
        message: "已填入当前条文本框，请人工复核后决定是否保存。",
      };
    }

    async function clickSaveAndWait(options) {
      const selectedIndex = getSelectedIndex();
      if (selectedIndex < 0) {
        return {
          ok: false,
          message: "当前没有选中的条目，无法保存。",
        };
      }
      const button = getSaveButton();
      if (!(button instanceof HTMLButtonElement)) {
        return {
          ok: false,
          message: "当前页面没有定位到真实“保存”按钮。",
        };
      }
      button.click();
      const deadline = Date.now() + Math.max(3000, Number(options?.timeoutMs || 15000) || 15000);
      while (Date.now() < deadline) {
        if (isSaveCompletionState(selectedIndex, captureListState(selectedIndex))) {
          return {
            ok: true,
            message: "已点击真实保存按钮并等待页面完成切条。",
          };
        }
        await sleep(150);
      }
      return {
        ok: false,
        message: "点击保存后等待页面切条超时，请检查平台是否保存成功。",
      };
    }

    async function fillAndSaveCurrent(text, options) {
      const fillResult = fillPageText(text);
      if (fillResult?.ok === false) {
        return fillResult;
      }
      await sleep(Number(options?.postFillDelayMs || 120) || 120);
      return clickSaveAndWait({
        timeoutMs: options?.timeoutMs || 15000,
      });
    }

    function stop() {
      clearRouteCache();
    }

    return {
      canFillPageText,
      clickSaveAndWait,
      fillPageText,
      fillAndSaveCurrent,
      getBatchTasksFromCurrentSelection,
      getCurrentItem,
      getItemByIndex,
      getRecordDisplayName,
      getSelectedIndex,
      isMarkPage,
      parseRouteParams,
      selectItemByIndex,
      start,
      stop,
    };
  }

  const api = {
    createRuntime,
    ensureChineseSentencePunctuation,
    extractAuthTokenFromUnknown,
    findAuthTokenInEntries,
    isSaveCompletionState,
    isMarkPage,
    parseRouteParams,
    readStorageEntries,
    removeTextSpaces,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalThis.__ASREdgeAishellTechMinnanDataApi = api;
})();
