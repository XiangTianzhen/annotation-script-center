"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSaveShortMarkPayload,
  createRuntime,
  ensureChineseSentencePunctuation,
  doesDomListItemMatchTask,
  doesListFileHintMatch,
  extractPlatformAccountName,
  extractSavedMarkText,
  extractAuthTokenFromUnknown,
  findPlatformAccountNameFromDocument,
  findAuthTokenInEntries,
  isSaveCompletionState,
  parseListItemLabel,
  createRateLimitedTaskScheduler,
  removeTextSpaces,
} = require("./data-api.js");

function withPatchedGlobals(overrides, callback) {
  const keys = Object.keys(overrides);
  const previous = new Map();
  keys.forEach(function (key) {
    previous.set(
      key,
      Object.prototype.hasOwnProperty.call(globalThis, key) ? globalThis[key] : undefined
    );
    globalThis[key] = overrides[key];
  });
  return Promise.resolve()
    .then(function () {
      return callback();
    })
    .finally(function () {
    keys.forEach(function (key) {
      if (previous.get(key) === undefined) {
        delete globalThis[key];
        return;
      }
      globalThis[key] = previous.get(key);
    });
    });
}

class FakeClassList {
  constructor(tokens) {
    this.tokens = new Set(tokens || []);
  }

  contains(token) {
    return this.tokens.has(token);
  }

  add(token) {
    this.tokens.add(token);
  }

  remove(token) {
    this.tokens.delete(token);
  }
}

class FakeElement {
  constructor(textContent) {
    this.textContent = textContent || "";
    this.classList = new FakeClassList();
  }

  querySelector() {
    return null;
  }

  scrollIntoView() {}
}

class FakeButton extends FakeElement {
  constructor(textContent, onClick) {
    super(textContent);
    this.disabled = false;
    this.clickCount = 0;
    this.onClick = onClick;
  }

  click() {
    this.clickCount += 1;
    if (typeof this.onClick === "function") {
      this.onClick();
    }
  }
}

class FakeInput extends FakeElement {
  constructor(value) {
    super("");
    this.value = value || "";
    this.dispatchedEvents = [];
  }

  focus() {}

  dispatchEvent(event) {
    this.dispatchedEvents.push(event.type);
    return true;
  }
}

function createStorage(entries) {
  const source = Array.isArray(entries) ? entries.slice() : [];
  return {
    length: source.length,
    key(index) {
      return source[index] ? source[index].key : null;
    },
    getItem(key) {
      const matched = source.find(function (entry) {
        return entry.key === key;
      });
      return matched ? matched.value : null;
    },
  };
}

function createListNode(label, tokens) {
  const button = new FakeButton(label);
  const node = new FakeElement(label);
  node.classList = new FakeClassList(tokens);
  node.button = button;
  node.querySelector = function (selector) {
    if (selector === "button.el-button--text, button") {
      return button;
    }
    return null;
  };
  return node;
}

function createMessageRoot(text, tone) {
  const contentNode = new FakeElement(text);
  contentNode.className = "el-message__content";
  const root = new FakeElement(text);
  root.className = "el-message el-message--" + tone;
  root.querySelector = function (selector) {
    if (selector === ".el-message__content") {
      return contentNode;
    }
    return null;
  };
  return root;
}

function flushAsyncTasks() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });
}

test("extractAuthTokenFromUnknown reads bearer token from nested json string", function () {
  const token = extractAuthTokenFromUnknown(
    JSON.stringify({
      auth: {
        authorization: "Bearer aaa.bbb.ccc",
      },
    }),
    0,
    new WeakSet()
  );

  assert.equal(token, "aaa.bbb.ccc");
});

test("findAuthTokenInEntries prefers token-like storage values", function () {
  const token = findAuthTokenInEntries([
    {
      key: "userInfo",
      value: JSON.stringify({
        profile: {
          token: "zzz.yyy.xxx",
        },
      }),
    },
    {
      key: "misc",
      value: "not-a-token",
    },
  ]);

  assert.equal(token, "zzz.yyy.xxx");
});

test("removeTextSpaces removes full-width and half-width spaces", function () {
  assert.equal(removeTextSpaces(" 昨晚 去 公园　散步 "), "昨晚去公园散步");
});

test("extractPlatformAccountName strips role suffix from avatar text", function () {
  assert.equal(extractPlatformAccountName(" ASmnbz001【标注人员】 "), "ASmnbz001");
  assert.equal(extractPlatformAccountName("ASmnbz001"), "ASmnbz001");
});

test("findPlatformAccountNameFromDocument reads avatar dropdown account", function () {
  const documentLike = {
    querySelector(selector) {
      assert.equal(selector, ".avatar-dropdown .user-name .hidden-xs-only");
      return {
        textContent: " ASmnbz001【标注人员】 ",
      };
    },
  };

  assert.equal(findPlatformAccountNameFromDocument(documentLike), "ASmnbz001");
});

test("ensureChineseSentencePunctuation appends chinese full stop when missing", function () {
  assert.equal(ensureChineseSentencePunctuation("昨晚去公园散步"), "昨晚去公园散步。");
  assert.equal(ensureChineseSentencePunctuation("昨晚去公园散步？"), "昨晚去公园散步？");
});

test("extractSavedMarkText parses mark json string and direct text", function () {
  assert.equal(
    extractSavedMarkText({
      mark: "{\"text\":\"阮欲去看电影。\"}",
    }),
    "阮欲去看电影。"
  );
  assert.equal(
    extractSavedMarkText({
      mark: {
        text: "阮欲去看电影。",
      },
    }),
    "阮欲去看电影。"
  );
  assert.equal(
    extractSavedMarkText({
      text: "阮欲去看电影。",
    }),
    "阮欲去看电影。"
  );
});

test("buildSaveShortMarkPayload matches aishell save contract", function () {
  assert.deepEqual(
    buildSaveShortMarkPayload(
      {
        taskItemId: "task-item-1",
        spendTime: 0,
        duration: 14.159541666666666,
      },
      " 汝 会 做 炒米粉焦无  "
    ),
    {
      mark: "{\"text\":\"汝会做炒米粉焦无。\"}",
      taskItemId: "task-item-1",
      spendTime: 5,
      scene: "mark",
      duration: 14.159541666666666,
    }
  );
});

test("parseListItemLabel extracts number and truncated file hint", function () {
  assert.deepEqual(parseListItemLabel("35:  ...59666546823.wav"), {
    number: 35,
    fileHint: "...59666546823.wav",
  });
});

test("doesListFileHintMatch accepts truncated suffix labels", function () {
  assert.equal(
    doesListFileHintMatch("AS-mn-002_035_20589090959666546823.wav", "...59666546823.wav"),
    true
  );
  assert.equal(
    doesListFileHintMatch("AS-mn-002_035_20589090959666546823.wav", "...59666546824.wav"),
    false
  );
});

test("doesDomListItemMatchTask matches by number and file suffix", function () {
  assert.equal(
    doesDomListItemMatchTask(
      {
        number: 35,
        fileHint: "...59666546823.wav",
      },
      {
        number: 35,
        fileName: "AS-mn-002_035_20589090959666546823.wav",
      }
    ),
    true
  );
});

test("isSaveCompletionState returns true when selected index advances", function () {
  assert.equal(
    isSaveCompletionState(1, {
      selectedIndex: 2,
      previousItemFinished: false,
    }),
    true
  );
});

test("isSaveCompletionState returns true when previous item becomes finished", function () {
  assert.equal(
    isSaveCompletionState(4, {
      selectedIndex: 4,
      previousItemFinished: true,
    }),
    true
  );
  assert.equal(
    isSaveCompletionState(4, {
      selectedIndex: 4,
      previousItemFinished: false,
    }),
    false
  );
});

test("createRateLimitedTaskScheduler spaces task start time by staggerMs", async function () {
  const startTimes = [];
  const scheduler = createRateLimitedTaskScheduler({
    concurrency: 2,
    staggerMs: 50,
  });

  const tasks = Array.from({ length: 4 }).map(function (_value, index) {
    return scheduler.run(function () {
      startTimes.push({
        index: index,
        at: Date.now(),
      });
      return Promise.resolve(index);
    });
  });

  const values = await Promise.all(tasks);
  assert.deepEqual(values, [0, 1, 2, 3]);
  assert.equal(startTimes.length, 4);
  for (let index = 1; index < startTimes.length; index += 1) {
    assert.ok(
      startTimes[index].at - startTimes[index - 1].at >= 40,
      "expected stagger between dispatched requests"
    );
  }
});

test("createRuntime exposes createRateLimitedTaskScheduler for content runtime", function () {
  const runtime = createRuntime();

  assert.equal(typeof runtime.createRateLimitedTaskScheduler, "function");
  assert.equal(typeof runtime.buildSaveShortMarkPayload, "function");
  assert.equal(typeof runtime.extractSavedMarkText, "function");
  assert.equal(typeof runtime.selectTask, "function");
  assert.equal(typeof runtime.getItemByTask, "function");
});

test("fillAndSaveCurrent clicks native save button instead of posting SaveShortMark directly", async function () {
  const state = {
    savedText: "",
    apiSaveCalls: 0,
    messages: [],
  };
  const input = new FakeInput("");
  const firstItem = createListNode("1: ...20589090959666546823.wav", ["list-item-selected"]);
  const secondItem = createListNode("2: ...20589090959666546824.wav", ["list-item"]);
  const saveButton = new FakeButton("保存", function () {
    state.savedText = input.value;
    state.messages = [createMessageRoot("保存成功!", "success")];
    firstItem.classList.remove("list-item-selected");
    firstItem.classList.add("list-item-finshed");
    secondItem.classList.add("list-item-selected");
  });
  const fileNameNode = new FakeElement("1 AS-mn-002_035_20589090959666546823.wav");
  const rawTextContent = new FakeElement("原始文本阮欲去看电影。");
  rawTextContent.className = "el-form-item__content";
  const rawTextRow = new FakeElement("原始文本 阮欲去看电影。");
  rawTextRow.querySelector = function (selector) {
    if (selector === ".el-form-item__content") {
      return rawTextContent;
    }
    return null;
  };

  const fetchCalls = [];
  const documentLike = {
    querySelector(selector) {
      if (selector === ".mark-area input.el-input__inner[type='text']") {
        return input;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".mark-area button.el-button--primary") {
        return [saveButton];
      }
      if (selector === ".list .list-item, .list .list-item-selected, .list .list-item-finshed") {
        return [firstItem, secondItem];
      }
      if (selector === ".fileName-line span") {
        return [fileNameNode];
      }
      if (selector === ".mark-area .el-form-item") {
        return [rawTextRow];
      }
      if (selector === ".el-message") {
        return state.messages.slice();
      }
      return [];
    },
  };

  await withPatchedGlobals(
    {
      document: documentLike,
      window: {
        localStorage: createStorage([
          {
            key: "userInfo",
            value: JSON.stringify({
              token: "aaa.bbb.ccc",
            }),
          },
        ]),
        sessionStorage: createStorage([]),
        setTimeout: setTimeout,
      },
      location: {
        hostname: "mark.aishelltech.com",
        pathname: "/mytask/mark",
        search: "?taskId=task-1&packageId=package-1",
      },
      HTMLElement: FakeElement,
      HTMLButtonElement: FakeButton,
      HTMLInputElement: FakeInput,
      Event: class Event {
        constructor(type) {
          this.type = type;
        }
      },
      fetch: async function (url, options) {
        const payload = options?.body ? JSON.parse(options.body) : null;
        fetchCalls.push({
          url: String(url),
          method: options?.method || "GET",
          body: payload,
        });
        const path = String(url).replace("https://markapi.aishelltech.com", "");
        if (path === "/api/task/detail/task-1") {
          return {
            ok: true,
            status: 200,
            json: async function () {
              return {
                data: {
                  result: {
                    taskName: "任务1",
                    templateId: "template-1",
                    project: {
                      dataRoot: "https://oss.example.com",
                    },
                  },
                },
              };
            },
          };
        }
        if (path === "/api/taskItem/packageItemList/package-1") {
          return {
            ok: true,
            status: 200,
            json: async function () {
              return {
                data: {
                  result: {
                    totalCount: 2,
                    items: [
                      {
                        id: "item-1",
                        number: 1,
                        fileName: "AS-mn-002_035_20589090959666546823.wav",
                        url: "/audio-1.wav",
                        text: "阮欲去看电影。",
                        spendTime: 0,
                        dataStatus: state.messages.length > 0 ? 1 : 0,
                        checkStatus: 0,
                      },
                      {
                        id: "item-2",
                        number: 2,
                        fileName: "AS-mn-002_036_20589090959666546824.wav",
                        url: "/audio-2.wav",
                        text: "第二条。",
                        spendTime: 0,
                        dataStatus: 0,
                        checkStatus: 0,
                      },
                    ],
                  },
                },
              };
            },
          };
        }
        if (path === "/api/taskItem/markDetail/item-1") {
          return {
            ok: true,
            status: 200,
            json: async function () {
              return {
                data: {
                  result: {
                    fileName: "AS-mn-002_035_20589090959666546823.wav",
                    text: "阮欲去看电影。",
                    audioLength: 16.2995,
                    url: "/audio-1.wav",
                    dataRoot: "https://oss.example.com",
                  },
                },
              };
            },
          };
        }
        if (path === "/api/mark/SaveShortMark") {
          state.apiSaveCalls += 1;
          state.savedText = payload?.mark ? JSON.parse(payload.mark).text : "";
          return {
            ok: true,
            status: 200,
            json: async function () {
              return {
                status: 200,
                data: {
                  isSucceed: true,
                  message: "",
                },
              };
            },
          };
        }
        if (path === "/api/mark/getShortMark/item-1") {
          return {
            ok: true,
            status: 200,
            json: async function () {
              return {
                data: {
                  result: state.savedText
                    ? {
                        mark: JSON.stringify({
                          text: state.savedText,
                        }),
                      }
                    : null,
                },
              };
            },
          };
        }
        throw new Error("Unexpected fetch path: " + path);
      },
    },
    async function () {
      const runtime = createRuntime();
      const result = await runtime.fillAndSaveCurrent(" 汝 会 做 炒米粉焦无 ");
      await flushAsyncTasks();

      assert.equal(result?.ok, true);
      assert.equal(saveButton.clickCount, 1);
      assert.equal(state.apiSaveCalls, 0);
      assert.equal(input.value, "汝会做炒米粉焦无。");
      assert.deepEqual(input.dispatchedEvents, ["input", "change"]);
      assert.ok(
        fetchCalls.some(function (entry) {
          return entry.url.indexOf("/api/taskItem/packageItemList/package-1") >= 0;
        })
      );
    }
  );
});

test("getCurrentItem falls back to default aishell audio root when task detail has no dataRoot", async function () {
  const input = new FakeInput("");
  const firstItem = createListNode("1: ...20589090959666546823.wav", ["list-item-selected"]);
  const fileNameNode = new FakeElement("1 AS-mn-002_035_20589090959666546823.wav");
  const rawTextContent = new FakeElement("原始文本阮欲去看电影。");
  rawTextContent.className = "el-form-item__content";
  const rawTextRow = new FakeElement("原始文本 阮欲去看电影。");
  rawTextRow.querySelector = function (selector) {
    if (selector === ".el-form-item__content") {
      return rawTextContent;
    }
    return null;
  };

  const documentLike = {
    querySelector(selector) {
      if (selector === ".mark-area input.el-input__inner[type='text']") {
        return input;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".list .list-item, .list .list-item-selected, .list .list-item-finshed") {
        return [firstItem];
      }
      if (selector === ".fileName-line span") {
        return [fileNameNode];
      }
      if (selector === ".mark-area .el-form-item") {
        return [rawTextRow];
      }
      if (selector === ".mark-area button.el-button--primary" || selector === ".el-message") {
        return [];
      }
      return [];
    },
  };

  await withPatchedGlobals(
    {
      document: documentLike,
      window: {
        localStorage: createStorage([
          {
            key: "userInfo",
            value: JSON.stringify({
              token: "aaa.bbb.ccc",
            }),
          },
        ]),
        sessionStorage: createStorage([]),
        setTimeout: setTimeout,
      },
      location: {
        hostname: "mark.aishelltech.com",
        pathname: "/mytask/mark",
        search: "?taskId=task-1&packageId=package-1",
      },
      HTMLElement: FakeElement,
      HTMLButtonElement: FakeButton,
      HTMLInputElement: FakeInput,
      fetch: async function (url) {
        const path = String(url).replace("https://markapi.aishelltech.com", "");
        if (path === "/api/task/detail/task-1") {
          return {
            ok: true,
            status: 200,
            json: async function () {
              return {
                data: {
                  result: {
                    taskName: "任务1",
                    templateId: "template-1",
                    project: {},
                  },
                },
              };
            },
          };
        }
        if (path === "/api/taskItem/packageItemList/package-1") {
          return {
            ok: true,
            status: 200,
            json: async function () {
              return {
                data: {
                  result: {
                    totalCount: 1,
                    items: [
                      {
                        id: "item-1",
                        number: 1,
                        fileName: "AS-mn-002_035_20589090959666546823.wav",
                        url: "/folder/audio.wav",
                        text: "阮欲去看电影。",
                        spendTime: 0,
                        dataStatus: 0,
                        checkStatus: 0,
                      },
                    ],
                  },
                },
              };
            },
          };
        }
        throw new Error("Unexpected fetch path: " + path);
      },
    },
    async function () {
      const runtime = createRuntime();
      const item = await runtime.getCurrentItem();

      assert.equal(
        item.audioUrl,
        "https://bpp-collect.oss-cn-hangzhou.aliyuncs.com/folder/audio.wav"
      );
    }
  );
});

test("createBatchTasksFromPackageItems scans whole package and skips only dataStatus 2", function () {
  const runtime = createRuntime();
  const tasks = runtime.createBatchTasksFromPackageItems([
    {
      id: "item-1",
      number: 1,
      fileName: "clip-1.wav",
      dataStatus: 0,
    },
    {
      id: "item-2",
      number: 2,
      fileName: "clip-2.wav",
      dataStatus: 2,
    },
    {
      id: "item-3",
      number: 3,
      fileName: "clip-3.wav",
      dataStatus: 1,
    },
    {
      id: "item-4",
      number: 4,
      fileName: "clip-4.wav",
      dataStatus: 0,
    },
  ]);

  assert.deepEqual(
    tasks.map(function (task) {
      return {
        index: task.index,
        taskItemId: task.taskItemId,
        number: task.number,
        fileName: task.fileName,
      };
    }),
    [
      {
        index: 0,
        taskItemId: "item-1",
        number: 1,
        fileName: "clip-1.wav",
      },
      {
        index: 2,
        taskItemId: "item-3",
        number: 3,
        fileName: "clip-3.wav",
      },
      {
        index: 3,
        taskItemId: "item-4",
        number: 4,
        fileName: "clip-4.wav",
      },
    ]
  );
});
