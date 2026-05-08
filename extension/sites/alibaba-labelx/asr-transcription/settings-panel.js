(function () {
  const runtimeConfigApi = globalThis.__ASREdgeAlibabaLabelxTranscriptionRuntimeConfig || null;

  const SHORTCUT_FIELDS = [
    ["shortcutPanel", "面板开关"],
    ["shortcutPlayPause", "播放/暂停"],
    ["shortcutValid", "当前题标有效"],
    ["shortcutInvalid", "当前题标无效"],
    ["shortcutFill", "当前题快速填入"],
    ["shortcutRemoveSpaces", "当前题去空格"],
    ["shortcutConvertNum", "当前题数字转换"],
    ["shortcutToggleFocus", "焦点切换"],
    ["shortcutCopyDuration", "复制当前音频时长"],
    ["shortcutForward", "当前音频前进"],
    ["shortcutBackward", "当前音频后退"],
    ["shortcutSpeedUp", "倍速提高"],
    ["shortcutSpeedDown", "倍速降低"],
    ["shortcutResetSpeed", "倍速重置"],
    ["shortcutVolUp", "音量提高"],
    ["shortcutVolDown", "音量降低"],
    ["shortcutResetVol", "音量重置"],
  ];

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function formatShortcut(shortcut) {
    if (!shortcut) {
      return "";
    }
    const parts = [];
    if (shortcut.ctrl) {
      parts.push("Ctrl");
    }
    if (shortcut.alt) {
      parts.push("Alt");
    }
    if (shortcut.shift) {
      parts.push("Shift");
    }
    if (shortcut.meta) {
      parts.push("Meta");
    }
    if (shortcut.key) {
      parts.push(String(shortcut.key));
    }
    return parts.join("+");
  }

  function parseShortcut(text) {
    const source = String(text || "").trim();
    if (!source) {
      return null;
    }
    const parts = source.split("+").map(function (part) {
      return part.trim();
    });
    const shortcut = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
      key: null,
      button: null,
    };
    parts.forEach(function (part) {
      const lower = part.toLowerCase();
      if (lower === "ctrl" || lower === "control") {
        shortcut.ctrl = true;
        return;
      }
      if (lower === "alt") {
        shortcut.alt = true;
        return;
      }
      if (lower === "shift") {
        shortcut.shift = true;
        return;
      }
      if (lower === "meta" || lower === "cmd" || lower === "command" || lower === "win") {
        shortcut.meta = true;
        return;
      }
      shortcut.key = part;
    });
    if (!shortcut.key) {
      return null;
    }
    return shortcut;
  }

  function parseReplacements(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean)
      .map(function (line) {
        const separator = line.indexOf("=>");
        if (separator < 0) {
          return null;
        }
        return {
          from: line.slice(0, separator).trim(),
          to: line.slice(separator + 2).trim(),
        };
      })
      .filter(Boolean);
  }

  function formatReplacements(list) {
    return (Array.isArray(list) ? list : [])
      .map(function (entry) {
        return String(entry?.from || "") + " => " + String(entry?.to || "");
      })
      .join("\n");
  }

  function parseCustomRates(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean)
      .map(function (line) {
        const separator = line.indexOf("|");
        if (separator < 0) {
          return null;
        }
        const rate = Number(line.slice(0, separator).trim());
        if (!Number.isFinite(rate)) {
          return null;
        }
        return {
          rate: rate,
          shortcut: parseShortcut(line.slice(separator + 1).trim()),
        };
      })
      .filter(Boolean);
  }

  function formatCustomRates(list) {
    return (Array.isArray(list) ? list : [])
      .map(function (entry) {
        return String(entry?.rate || "") + " | " + formatShortcut(entry?.shortcut);
      })
      .join("\n");
  }

  function toNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function renderForm(container, config, mode) {
    const pageOptions = runtimeConfigApi?.PAGE_OPTIONS || [];
    const optionMarkup = pageOptions
      .map(function (item) {
        const selected = item === config.itemsPerPage ? " selected" : "";
        return '<option value="' + escapeHtml(item) + '"' + selected + ">" + escapeHtml(item) + "</option>";
      })
      .join("");
    const shortcutMarkup = SHORTCUT_FIELDS.map(function (entry) {
      return (
        '<label class="asr-edge-field">' +
        "<span>" +
        escapeHtml(entry[1]) +
        "</span>" +
        '<input data-shortcut-key="' +
        escapeHtml(entry[0]) +
        '" value="' +
        escapeHtml(formatShortcut(config[entry[0]])) +
        '" placeholder="例如 Ctrl+P" />' +
        "</label>"
      );
    }).join("");

    container.innerHTML =
      '<div class="asr-edge-panel-root" data-mode="' +
      escapeHtml(mode) +
      '">' +
      '<div class="asr-edge-fields">' +
      '<label class="asr-edge-field"><span>itemsPerPage</span><select id="asr-items-per-page">' +
      optionMarkup +
      "</select></label>" +
      '<label class="asr-edge-field"><span>autoPlay</span><input id="asr-auto-play" type="checkbox"' +
      (config.autoPlay ? " checked" : "") +
      " /></label>" +
      '<label class="asr-edge-field"><span>defaultValid</span><input id="asr-default-valid" type="checkbox"' +
      (config.defaultValid ? " checked" : "") +
      " /></label>" +
      '<label class="asr-edge-field"><span>fillOnValid</span><input id="asr-fill-on-valid" type="checkbox"' +
      (config.fillOnValid ? " checked" : "") +
      " /></label>" +
      '<label class="asr-edge-field"><span>clearOnInvalid</span><input id="asr-clear-on-invalid" type="checkbox"' +
      (config.clearOnInvalid ? " checked" : "") +
      " /></label>" +
      '<label class="asr-edge-field"><span>playbackRateValue</span><input id="asr-playback-rate" type="number" step="0.05" value="' +
      escapeHtml(config.playbackRateValue) +
      '" /></label>' +
      '<label class="asr-edge-field"><span>resetRateValue</span><input id="asr-reset-rate" type="number" step="0.05" value="' +
      escapeHtml(config.resetRateValue) +
      '" /></label>' +
      '<label class="asr-edge-field"><span>rateStepValue</span><input id="asr-rate-step" type="number" step="0.01" value="' +
      escapeHtml(config.rateStepValue) +
      '" /></label>' +
      '<label class="asr-edge-field"><span>seekStepSeconds</span><input id="asr-seek-step" type="number" step="0.1" value="' +
      escapeHtml(config.seekStepSeconds) +
      '" /></label>' +
      '<label class="asr-edge-field"><span>volumeValue</span><input id="asr-volume" type="number" step="1" value="' +
      escapeHtml(config.volumeValue) +
      '" /></label>' +
      '<label class="asr-edge-field"><span>customReplacements (from => to)</span><textarea id="asr-custom-replacements" rows="6">' +
      escapeHtml(formatReplacements(config.customReplacements)) +
      "</textarea></label>" +
      '<label class="asr-edge-field"><span>customRates (rate | shortcut)</span><textarea id="asr-custom-rates" rows="4">' +
      escapeHtml(formatCustomRates(config.customRates)) +
      "</textarea></label>" +
      '<div class="asr-edge-shortcuts"><h4>shortcuts</h4>' +
      shortcutMarkup +
      "</div>" +
      '<div class="asr-edge-actions"><button id="asr-save-settings" type="button">保存设置</button><span id="asr-save-status"></span></div>' +
      "</div>" +
      "</div>";
  }

  function collectPatch(container) {
    const patch = {
      itemsPerPage: container.querySelector("#asr-items-per-page")?.value || "50 条/页",
      autoPlay: Boolean(container.querySelector("#asr-auto-play")?.checked),
      defaultValid: Boolean(container.querySelector("#asr-default-valid")?.checked),
      fillOnValid: Boolean(container.querySelector("#asr-fill-on-valid")?.checked),
      clearOnInvalid: Boolean(container.querySelector("#asr-clear-on-invalid")?.checked),
      playbackRateValue: toNumber(container.querySelector("#asr-playback-rate")?.value, 1),
      resetRateValue: toNumber(container.querySelector("#asr-reset-rate")?.value, 1),
      rateStepValue: toNumber(container.querySelector("#asr-rate-step")?.value, 0.1),
      seekStepSeconds: toNumber(container.querySelector("#asr-seek-step")?.value, 1),
      volumeValue: toNumber(container.querySelector("#asr-volume")?.value, 100),
      customReplacements: parseReplacements(container.querySelector("#asr-custom-replacements")?.value),
      customRates: parseCustomRates(container.querySelector("#asr-custom-rates")?.value),
    };
    SHORTCUT_FIELDS.forEach(function (entry) {
      const input = container.querySelector("[data-shortcut-key='" + entry[0] + "']");
      patch[entry[0]] = parseShortcut(input?.value);
    });
    return patch;
  }

  function ensureStyles() {
    if (document.getElementById("asr-edge-transcription-settings-style")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "asr-edge-transcription-settings-style";
    style.textContent =
      ".asr-edge-panel-root{font-size:13px;color:#222;}" +
      ".asr-edge-fields{display:grid;gap:10px;}" +
      ".asr-edge-field{display:grid;gap:4px;}" +
      ".asr-edge-field input,.asr-edge-field select,.asr-edge-field textarea{padding:6px;border:1px solid #d0d7de;border-radius:6px;font-size:12px;}" +
      ".asr-edge-shortcuts{display:grid;gap:8px;padding:8px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa;}" +
      ".asr-edge-shortcuts h4{margin:0;font-size:12px;}" +
      ".asr-edge-actions{display:flex;align-items:center;gap:8px;}" +
      "#asr-save-settings{padding:6px 10px;border:1px solid #0f766e;background:#14b8a6;color:#fff;border-radius:6px;cursor:pointer;}" +
      "#asr-save-status{font-size:12px;color:#0f766e;}";
    document.head.appendChild(style);
  }

  function createMount(mode, hostContainer, onSaved) {
    let currentConfig = null;
    const container = hostContainer;

    async function refresh() {
      const loaded = await runtimeConfigApi.loadConfig();
      currentConfig = clone(loaded.config);
      renderForm(container, currentConfig, mode);
      const button = container.querySelector("#asr-save-settings");
      const statusNode = container.querySelector("#asr-save-status");
      button?.addEventListener("click", async function () {
        const patch = collectPatch(container);
        statusNode.textContent = "保存中...";
        try {
          const saved = await runtimeConfigApi.saveConfigPatch(patch);
          currentConfig = clone(saved.config);
          statusNode.textContent = "已保存。";
          if (typeof onSaved === "function") {
            onSaved(clone(saved.config));
          }
          renderForm(container, currentConfig, mode);
          refresh();
        } catch (error) {
          statusNode.textContent =
            "保存失败：" + (error && error.message ? error.message : String(error));
        }
      });
    }

    return {
      refresh: refresh,
      unmount: function () {
        container.innerHTML = "";
      },
    };
  }

  let mountedHandle = null;
  let overlayHost = null;
  let overlayVisible = false;

  function mount(options) {
    if (!runtimeConfigApi) {
      throw new Error("runtime-config 未加载。");
    }
    ensureStyles();
    const mode = options?.mode === "page" ? "page" : "overlay";
    const container = options?.container;
    if (!(container instanceof HTMLElement)) {
      throw new Error("settings panel 缺少容器节点。");
    }
    mountedHandle = createMount(mode, container, options?.onSaved);
    mountedHandle.refresh();
    return mountedHandle;
  }

  function unmount() {
    if (mountedHandle && typeof mountedHandle.unmount === "function") {
      mountedHandle.unmount();
    }
    mountedHandle = null;
  }

  function createOverlayRuntime(options) {
    ensureStyles();
    const onSaved = options?.onSaved;
    return {
      start: function () {
        if (overlayHost) {
          return;
        }
        overlayHost = document.createElement("div");
        overlayHost.id = "asr-edge-transcription-overlay-panel";
        overlayHost.style.position = "fixed";
        overlayHost.style.top = "56px";
        overlayHost.style.right = "12px";
        overlayHost.style.width = "360px";
        overlayHost.style.maxHeight = "70vh";
        overlayHost.style.overflow = "auto";
        overlayHost.style.background = "#ffffff";
        overlayHost.style.border = "1px solid #d1d5db";
        overlayHost.style.borderRadius = "10px";
        overlayHost.style.padding = "10px";
        overlayHost.style.boxShadow = "0 6px 24px rgba(0,0,0,.15)";
        overlayHost.style.zIndex = "2147483647";
        overlayHost.style.display = "none";
        document.documentElement.appendChild(overlayHost);
        mountedHandle = createMount("overlay", overlayHost, onSaved);
        mountedHandle.refresh();
      },
      stop: function () {
        overlayVisible = false;
        if (mountedHandle && typeof mountedHandle.unmount === "function") {
          mountedHandle.unmount();
        }
        mountedHandle = null;
        if (overlayHost) {
          overlayHost.remove();
          overlayHost = null;
        }
      },
      toggle: function () {
        if (!overlayHost) {
          return;
        }
        overlayVisible = !overlayVisible;
        overlayHost.style.display = overlayVisible ? "block" : "none";
      },
      open: function () {
        if (!overlayHost) {
          return;
        }
        overlayVisible = true;
        overlayHost.style.display = "block";
      },
      close: function () {
        if (!overlayHost) {
          return;
        }
        overlayVisible = false;
        overlayHost.style.display = "none";
      },
      refresh: function () {
        if (mountedHandle && typeof mountedHandle.refresh === "function") {
          mountedHandle.refresh();
        }
      },
      isOpen: function () {
        return overlayVisible;
      },
    };
  }

  globalThis.__ASREdgeAlibabaLabelxSettingsPanel = {
    mount: mount,
    unmount: unmount,
    createOverlayRuntime: createOverlayRuntime,
    parseShortcut: parseShortcut,
    formatShortcut: formatShortcut,
  };
})();
