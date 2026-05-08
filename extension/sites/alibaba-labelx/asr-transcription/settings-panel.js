/**
 * @fileoverview Alibaba LabelX 页面内设置面板
 * @description 复刻旧脚本设置布局，并统一读写扩展存储层
 */

(function () {
  const LOG_PREFIX = "[ASR Edge][settings-panel]";
  const HOST_ID = "asr-edge-settings-panel-host";
  let panelInstance = null;

  function getConstants() {
    return globalThis.ASREdgeConstants;
  }

  function getStorage() {
    return globalThis.ASREdgeStorage;
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }

  function isOverlayMode(mode) {
    return mode === "overlay";
  }

  function isPageMode(mode) {
    return mode === "page";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatShortcut(shortcut) {
    if (!shortcut) {
      return "未设置";
    }

    const keys = [];

    if (shortcut.ctrl) {
      keys.push("Ctrl");
    }
    if (shortcut.alt) {
      keys.push("Alt");
    }
    if (shortcut.shift) {
      keys.push("Shift");
    }
    if (shortcut.meta) {
      keys.push("Meta");
    }
    if (typeof shortcut.key === "string" && shortcut.key.length > 0) {
      let keyName = shortcut.key.toUpperCase();
      if (keyName === " ") {
        keyName = "空格";
      }
      if (keyName.indexOf("ARROW") >= 0) {
        keyName = keyName.replace("ARROW", "按键");
      }
      keys.push(keyName);
    }
    if (typeof shortcut.button === "number") {
      keys.push("鼠标" + shortcut.button);
    }

    return keys.join("+");
  }

  function isShortcutEqual(left, right) {
    if (!left || !right) {
      return false;
    }

    return (
      left.ctrl === right.ctrl &&
      left.alt === right.alt &&
      left.shift === right.shift &&
      left.meta === right.meta &&
      left.key === right.key &&
      left.button === right.button
    );
  }

  function isShortcutMatch(event, shortcut) {
    if (!shortcut) {
      return false;
    }

    const eventKey = typeof event.key === "string" ? event.key.toLowerCase() : null;
    const keyMatch =
      event.type === "keydown" && shortcut.button === null && shortcut.key === eventKey;
    const mouseMatch =
      event.type === "mousedown" && shortcut.key === null && shortcut.button === event.button;

    return (
      (keyMatch || mouseMatch) &&
      shortcut.ctrl === event.ctrlKey &&
      shortcut.alt === event.altKey &&
      shortcut.shift === event.shiftKey &&
      shortcut.meta === event.metaKey
    );
  }

  function haltEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
  }

  function getActionDefinition(constants, actionKey) {
    return constants.BUSINESS_ACTIONS.find(function (action) {
      return action.key === actionKey;
    });
  }

  function createInitialActionStatusMap(constants) {
    const statusMap = {};
    constants.BUSINESS_ACTIONS.forEach(function (action) {
      statusMap[action.key] = {
        text: action.placeholder || "待接线",
        tone: "pending",
      };
    });
    return statusMap;
  }

  function createInitialState(mode) {
    return {
      mode: mode,
      visible: !isOverlayMode(mode),
      loaded: false,
      settings: null,
      shortcutsOpen: false,
      recordingTarget: null,
      debugUnlocked: false,
      debugClickCount: 0,
      debugResetTimer: null,
      busyActions: {},
      actionHandlers: {},
      actionStatuses: createInitialActionStatusMap(getConstants()),
      footerStatus: {
        text: "",
        tone: "muted",
      },
    };
  }

  function ensureHost(instance) {
    const host = document.createElement("div");
    host.id = HOST_ID;
    host.style.all = "initial";

    if (isOverlayMode(instance.state.mode)) {
      host.style.position = "fixed";
      host.style.right = "10px";
      host.style.bottom = "82px";
      host.style.zIndex = "2147483645";
      host.style.pointerEvents = "auto";
      document.documentElement.appendChild(host);
    } else {
      host.style.display = "block";
      host.style.width = "100%";
      instance.container.appendChild(host);
    }

    return host;
  }

  function buildMarkup(constants, mode) {
    const transcriptionProject =
      constants.SCRIPT_PROJECTS && constants.SCRIPT_PROJECTS.transcription
        ? constants.SCRIPT_PROJECTS.transcription
        : {
            label: "阿里ASR语音转写",
          };
    const pageOptions = constants.PAGE_OPTIONS.map(function (option) {
      return '<option value="' + escapeHtml(option) + '">' + escapeHtml(option) + "</option>";
    }).join("");
    const overlayMode = isOverlayMode(mode);
    const pageMode = isPageMode(mode);
    const rootModeClass = overlayMode ? "mode-overlay" : pageMode ? "mode-page" : "mode-embedded";
    const panelSubtitle = overlayMode
      ? transcriptionProject.label + " 的页面内联调面板。常规配置建议直接使用脚本中心。"
      : pageMode
      ? "当前正在编辑 " +
        transcriptionProject.label +
        " 项目；字段、状态位和业务入口继续复用同一套扩展存储与控制器逻辑。"
      : transcriptionProject.label + " 的嵌入式设置视图。";

    return [
      "<style>",
      ":host { all: initial; }",
      ".root { font: 500 13px/1.5 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #1f1f1f; }",
      ".entry-button,.header-button,.close-button,.mini-button,.save-button,.shortcut-button,.icon-button { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }",
      ".entry-button { min-width: 108px; height: 34px; padding: 0 14px; border-radius: 999px; background: linear-gradient(135deg, #1677ff, #0958d9); color: #fff; font: 700 12px/1 'Segoe UI', sans-serif; box-shadow: 0 10px 24px rgba(9, 88, 217, 0.26); }",
      ".backdrop { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,0.45); backdrop-filter: blur(2px); }",
      ".backdrop.hidden { display: none; }",
      ".panel-shell { width: min(760px, calc(100vw - 32px)); max-height: calc(100vh - 32px); }",
      ".static-shell { width: 100%; }",
      ".panel { width: 100%; max-height: inherit; overflow: auto; background: #fff; border-radius: 14px; box-shadow: 0 16px 44px rgba(0,0,0,0.18); border: 1px solid rgba(15,23,42,0.08); }",
      ".mode-embedded .panel,.mode-page .panel { max-height: none; box-shadow: 0 14px 36px rgba(15,23,42,0.08); }",
      ".mode-page .panel { border-radius: 18px; box-shadow: 0 18px 42px rgba(15,23,42,0.10); }",
      ".panel-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 22px 24px 14px; border-bottom: 1px solid #f0f0f0; }",
      ".mode-page .panel-header { padding: 24px 26px 16px; }",
      ".title-line { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }",
      ".panel-title { margin: 0; font: 700 19px/1.25 'Segoe UI', 'PingFang SC', sans-serif; cursor: pointer; user-select: none; }",
      ".panel-subtitle { margin: 6px 0 0; color: #8c8c8c; font-size: 12px; }",
      ".header-actions { display: flex; align-items: center; gap: 12px; }",
      ".header-button { height: 30px; padding: 0 12px; border-radius: 6px; background: #52c41a; color: #fff; font-weight: 700; font-size: 12px; }",
      ".header-button:disabled,.mini-button:disabled,.save-button:disabled { opacity: 0.6; cursor: wait; }",
      ".close-button { font-size: 18px; color: #8c8c8c; padding: 2px 4px; }",
      ".debug-indicator { display: inline-flex; align-items: center; min-height: 24px; padding: 0 8px; border-radius: 999px; border: 1px solid #ff4d4f; color: #ff4d4f; background: rgba(255,77,79,0.06); font-size: 12px; cursor: pointer; }",
      ".debug-indicator.hidden { display: none; }",
      ".panel-body { display: flex; flex-direction: column; gap: 14px; padding: 18px 24px 24px; }",
      ".mode-page .panel-body { padding: 20px 26px 26px; }",
      ".card { border-radius: 10px; padding: 12px; border: 1px solid #f0f0f0; background: #fafafa; }",
      ".card.ai { background: #f0f5ff; border-color: #adc6ff; }",
      ".card.rules { background: #fffbe6; border-color: #b7eb8f; }",
      ".card.rates { background: #e6f4ff; border-color: #91caff; }",
      ".card.assign { background: #f6ffed; border-color: #b7eb8f; }",
      ".module-toggle { display: flex; align-items: center; gap: 10px; font-weight: 700; }",
      ".module-note { margin: 8px 0 0 28px; color: #595959; font-size: 12px; }",
      ".checkbox-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }",
      ".check-item { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }",
      ".check-item.highlight { color: #fa541c; font-weight: 700; }",
      ".check-item.blue { color: #0958d9; }",
      ".check-item.red { color: #cf1322; }",
      ".check-item.green { color: #389e0d; font-weight: 700; }",
      ".check-item.purple { color: #c41d7f; }",
      ".span-2 { grid-column: span 2; }",
      ".span-3 { grid-column: span 3; }",
      ".card-title { font-size: 12px; font-weight: 700; margin-bottom: 8px; }",
      ".card-title.ai { color: #1d39c4; }",
      ".card-title.rules { color: #389e0d; }",
      ".card-title.rates { color: #0958d9; }",
      ".field-row,.action-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }",
      ".field-row + .field-row,.action-row + .action-row { margin-top: 8px; }",
      ".field-label { color: #333; white-space: nowrap; font-size: 13px; }",
      ".field-input,.field-select,.field-number,.field-password { border: 1px solid #d9d9d9; border-radius: 4px; padding: 6px 10px; font: inherit; color: #1f1f1f; background: #fff; box-sizing: border-box; }",
      ".field-input:disabled,.field-select:disabled,.field-number:disabled,.field-password:disabled { background: #f5f5f5; color: #8c8c8c; }",
      ".field-input,.field-password { flex: 1; min-width: 0; }",
      ".field-select { min-width: 140px; }",
      ".field-number.inline { width: 72px; text-align: center; padding: 4px 6px; }",
      ".dual-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }",
      ".field-pair { display: flex; align-items: center; justify-content: space-between; gap: 10px; }",
      ".mini-button { height: 28px; padding: 0 10px; border-radius: 6px; color: #fff; font-size: 12px; font-weight: 700; }",
      ".mini-button.blue { background: #1677ff; }",
      ".mini-button.green { background: #52c41a; }",
      ".mini-button.orange { background: #faad14; }",
      ".mini-button.gray { background: #595959; }",
      ".shortcut-toggle { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border-radius: 6px; background: #e6f4ff; color: #1677ff; font-weight: 700; cursor: pointer; }",
      ".shortcut-icon { transition: transform 0.25s ease; }",
      ".shortcut-icon.open { transform: rotate(180deg); }",
      ".shortcut-wrap { overflow: hidden; max-height: 0; transition: max-height 0.25s ease, margin-top 0.25s ease; }",
      ".shortcut-wrap.open { max-height: 1500px; margin-top: 8px; }",
      ".shortcut-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 4px; }",
      ".shortcut-item { display: flex; flex-direction: column; gap: 4px; }",
      ".shortcut-label { font-size: 11px; color: #555; }",
      ".shortcut-controls { display: flex; gap: 4px; }",
      ".shortcut-button { flex: 1; min-height: 30px; padding: 4px 6px; border: 1px solid #d9d9d9; border-radius: 4px; background: #f5f5f5; color: #333; font-size: 11px; justify-content: flex-start; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }",
      ".shortcut-button.recording { background: #e6f4ff; border-color: #1677ff; color: #1677ff; }",
      ".icon-button { min-width: 34px; min-height: 30px; border-radius: 4px; font-size: 12px; color: #fff; background: #ff4d4f; }",
      ".list-box { display: flex; flex-direction: column; gap: 6px; max-height: 140px; overflow: auto; }",
      ".list-row { display: flex; align-items: center; gap: 8px; background: #fff; padding: 4px 8px; border-radius: 6px; border: 1px solid #d9d9d9; }",
      ".list-row span { font-size: 12px; color: #333; white-space: nowrap; }",
      ".list-row .field-input { padding: 3px 6px; font-size: 12px; }",
      ".list-row .field-number.inline { width: 54px; }",
      ".status-chip { display: inline-flex; align-items: center; min-height: 24px; padding: 0 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }",
      ".tone-pending { background: #f5f5f5; color: #8c8c8c; }",
      ".tone-working { background: rgba(22,119,255,0.12); color: #0958d9; }",
      ".tone-success { background: rgba(82,196,26,0.12); color: #389e0d; }",
      ".tone-error { background: rgba(255,77,79,0.12); color: #cf1322; }",
      ".integration-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }",
      ".integration-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border-radius: 8px; background: #fafafa; border: 1px solid #f0f0f0; }",
      ".integration-item strong { display: block; font-size: 13px; }",
      ".integration-item span.desc { color: #8c8c8c; font-size: 12px; }",
      ".footer-actions { display: flex; gap: 12px; margin-top: 2px; }",
      ".save-button { flex: 1; min-height: 38px; border-radius: 6px; border: 1px solid transparent; font-weight: 700; }",
      ".save-button.clear { background: #fff; color: #fa8c16; border-color: #fa8c16; }",
      ".save-button.reset { background: #fff; color: #ff4d4f; border-color: #ff4d4f; }",
      ".save-button.primary { flex: 2; background: #1677ff; color: #fff; }",
      ".footer-status { min-height: 20px; font-size: 12px; }",
      ".footer-status.tone-success { color: #389e0d; }",
      ".footer-status.tone-error { color: #cf1322; }",
      ".footer-status.tone-working { color: #0958d9; }",
      ".footer-status.tone-muted { color: #8c8c8c; }",
      "@media (max-width: 860px) { .panel-shell { width: min(760px, calc(100vw - 16px)); max-height: calc(100vh - 16px); } .panel-header { flex-direction: column; align-items: stretch; } .header-actions { justify-content: space-between; } .checkbox-grid,.shortcut-grid,.integration-grid,.dual-grid { grid-template-columns: 1fr; } .span-2,.span-3 { grid-column: auto; } .field-pair { flex-direction: column; align-items: stretch; } .footer-actions { flex-direction: column; } .mode-page .panel-header,.mode-page .panel-body { padding-left: 18px; padding-right: 18px; } }",
      "</style>",
      '<div class="root ' + rootModeClass + '">',
      overlayMode ? '<button type="button" class="entry-button" data-role="entry-button">ASR 设置</button>' : "",
      overlayMode
        ? '<div class="backdrop hidden" data-role="backdrop"><div class="panel-shell">'
        : '<div class="static-shell">',
      '<section class="panel">',
      '<header class="panel-header"><div><div class="title-line"><h2 class="panel-title" data-role="panel-title" title="连击 5 次开启开发者选项">' + escapeHtml(transcriptionProject.label) + '</h2><button type="button" class="debug-indicator hidden" data-role="debug-indicator"></button></div><p class="panel-subtitle">' + panelSubtitle + '</p></div><div class="header-actions"><button type="button" class="header-button" data-action-key="checkUpdate">🔄 手动检查更新</button>' + (overlayMode ? '<button type="button" class="close-button" data-role="close-button">✖</button>' : "") + "</div></header>",
      '<div class="panel-body">',
      '<section class="card"><label class="module-toggle"><input type="checkbox" data-role="platform-enabled" /> 启用 Alibaba LabelX 模块</label><p class="module-note" data-role="module-note">正在读取平台启用状态...</p></section>',
      '<section class="card checkbox-grid">',
      '<label class="check-item"><input type="checkbox" data-field="autoPlay" /> 自动播放音频</label>',
      '<label class="check-item"><input type="checkbox" data-field="autoNext" /> 播完切下条(S)</label>',
      '<label class="check-item"><input type="checkbox" data-field="defaultValid" /> 切入标"有效"</label>',
      '<label class="check-item blue"><input type="checkbox" data-field="fillOnValid" /> 标有效时填入</label>',
      '<label class="check-item red"><input type="checkbox" data-field="clearOnInvalid" /> 标无效时清空</label>',
      '<label class="check-item green span-3"><input type="checkbox" data-field="autoFillOnLoad" /> ⚡ 进入页面自动全页填充</label>',
      '<label class="check-item purple span-2"><input type="checkbox" data-field="autoClearInvalidValidation" /> 校验时遇到"无效"自动清空文本</label>',
      '<label class="check-item purple span-2"><input type="checkbox" data-field="autoFillOnValidValidation" /> 校验时遇到"有效"自动填入文本</label>',
      "</section>",
      '<section class="card"><div class="dual-grid"><div class="field-pair"><label class="field-label" for="asr-volume"><strong>默认音量 (0~1000%):</strong></label><div class="field-row"><input id="asr-volume" class="field-number inline" type="number" min="0" max="1000" step="10" data-field="volumeValue" /><span>%</span></div></div><div class="field-pair"><label class="field-label" for="asr-reset-rate"><strong>默认倍速:</strong></label><input id="asr-reset-rate" class="field-number inline" type="number" min="0.25" max="8" step="0.05" data-field="resetRateValue" /></div></div><div class="dual-grid" style="margin-top:12px;padding-top:12px;border-top:1px dashed #eee;"><div class="field-pair"><label class="field-label" for="asr-rate-step"><strong>倍速步进:</strong></label><input id="asr-rate-step" class="field-number inline" type="number" min="0.05" max="2" step="0.05" data-field="rateStepValue" /></div><div class="field-pair"><label class="field-label" for="asr-seek-step"><strong>前进/后退步长(秒):</strong></label><input id="asr-seek-step" class="field-number inline" type="number" min="0.1" max="10" step="0.1" data-field="seekStepSeconds" /></div></div><div class="dual-grid" style="margin-top:12px;padding-top:12px;border-top:1px dashed #eee;"><div class="field-pair"><label class="field-label" for="asr-num-mode"><strong>数字转换模式:</strong></label><select id="asr-num-mode" class="field-select" data-field="numConvertMode"><option value="千问">千问模式</option><option value="蜂鸟众包">蜂鸟众包</option></select></div><div class="field-pair"><label class="field-label" for="asr-items-per-page"><strong>默认每页条数:</strong></label><select id="asr-items-per-page" class="field-select" data-field="itemsPerPage">' + pageOptions + "</select></div></div></section>",
      '<section class="card"><div class="card-title">当前基础阶段说明</div><div class="field-row"><span class="status-chip tone-pending">已禁用：自定义保存 payload、手动强制保存、自动提交、自动流转、AI 标点、抢单、排行榜/导出动作。</span></div></section>',
      '<div class="shortcut-toggle" data-role="shortcut-toggle"><span>⌨️ 键盘快捷键录制 (点击展开 / 收起)</span><span class="shortcut-icon" data-role="shortcut-icon">▼</span></div>',
      '<div class="shortcut-wrap" data-role="shortcut-wrap"><div class="shortcut-grid" data-role="shortcut-grid"></div></div>',
      '<section class="card rules"><div class="field-pair"><span class="card-title rules" style="margin-bottom:0;">自定义文本纠错规则 (支持多对一，原词用逗号分隔)：</span><div class="action-row"><button type="button" class="mini-button blue" data-action-key="syncDictionary">🔄 同步云端词库(覆盖本地)</button><button type="button" class="mini-button orange" data-action-key="uploadDictionary">⬆️ 上传本地数据</button><button type="button" class="mini-button green" data-role="add-replacement">+ 本地添加</button></div></div><div class="action-row"><span class="status-chip tone-pending" data-role="action-status-syncDictionary">待接云端词库同步</span><span class="status-chip tone-pending" data-role="action-status-uploadDictionary">待接词库上传</span></div><div class="list-box" data-role="replacement-list"></div></section>',
      '<section class="card rates"><div class="field-pair"><span class="card-title rates" style="margin-bottom:0;">自定义定速快捷键 (范围 0.1 ~ 8.0)：</span><button type="button" class="mini-button blue" data-role="add-rate">+ 添加定速</button></div><div class="list-box" data-role="rate-list"></div></section>',
      '<div class="footer-actions"><button type="button" class="save-button clear" data-role="clear-cache-button">清除所有缓存</button><button type="button" class="save-button reset" data-role="reset-button">恢复默认(覆写现有)</button><button type="button" class="save-button primary" data-role="save-button">保存并生效</button></div>',
      '<div class="footer-status tone-muted" data-role="footer-status"></div>',
      "</div></section></div>",
      overlayMode ? "</div>" : "",
      "</div>",
    ].join("");
  }

  function bindUi(instance) {
    const shadowRoot = instance.host.shadowRoot;

    instance.ui = {
      entryButton: shadowRoot.querySelector("[data-role='entry-button']"),
      backdrop: shadowRoot.querySelector("[data-role='backdrop']"),
      closeButton: shadowRoot.querySelector("[data-role='close-button']"),
      panelTitle: shadowRoot.querySelector("[data-role='panel-title']"),
      debugIndicator: shadowRoot.querySelector("[data-role='debug-indicator']"),
      platformEnabled: shadowRoot.querySelector("[data-role='platform-enabled']"),
      moduleNote: shadowRoot.querySelector("[data-role='module-note']"),
      shortcutToggle: shadowRoot.querySelector("[data-role='shortcut-toggle']"),
      shortcutIcon: shadowRoot.querySelector("[data-role='shortcut-icon']"),
      shortcutWrap: shadowRoot.querySelector("[data-role='shortcut-wrap']"),
      shortcutGrid: shadowRoot.querySelector("[data-role='shortcut-grid']"),
      addReplacement: shadowRoot.querySelector("[data-role='add-replacement']"),
      replacementList: shadowRoot.querySelector("[data-role='replacement-list']"),
      addRate: shadowRoot.querySelector("[data-role='add-rate']"),
      rateList: shadowRoot.querySelector("[data-role='rate-list']"),
      autoAssignAll: shadowRoot.querySelector("[data-role='auto-assign-all']"),
      autoAssignKeyword: shadowRoot.querySelector("[data-role='auto-assign-keyword']"),
      autoAssignFetchAll: shadowRoot.querySelector("[data-role='auto-assign-fetch-all']"),
      autoAssignBatch: shadowRoot.querySelector("[data-role='auto-assign-batch']"),
      clearCacheButton: shadowRoot.querySelector("[data-role='clear-cache-button']"),
      resetButton: shadowRoot.querySelector("[data-role='reset-button']"),
      saveButton: shadowRoot.querySelector("[data-role='save-button']"),
      footerStatus: shadowRoot.querySelector("[data-role='footer-status']"),
      fieldInputs: shadowRoot.querySelectorAll("[data-field]"),
      actionButtons: shadowRoot.querySelectorAll("[data-action-key]"),
    };
  }

  function updateFooterStatus(instance, text, tone) {
    instance.state.footerStatus = {
      text: text,
      tone: tone || "muted",
    };

    if (!instance.ui.footerStatus) {
      return;
    }

    instance.ui.footerStatus.textContent = text || "";
    instance.ui.footerStatus.className = "footer-status tone-" + (tone || "muted");
  }

  function dispatchSettingsSaved(settings, reason) {
    window.dispatchEvent(
      new CustomEvent("ASR_EDGE_SETTINGS_SAVED", {
        detail: {
          reason: reason || "manual-save",
          settings: clone(settings),
        },
      })
    );
  }

  function setActionStatus(instance, actionKey, text, tone) {
    instance.state.actionStatuses[actionKey] = {
      text: text,
      tone: tone || "pending",
    };

    const statusNode = instance.host.shadowRoot.querySelector(
      "[data-role='action-status-" + actionKey + "']"
    );

    if (!statusNode) {
      return;
    }

    statusNode.textContent = text;
    statusNode.className = "status-chip tone-" + (tone || "pending");
  }

  function setActionBusy(instance, actionKey, busy) {
    instance.state.busyActions[actionKey] = Boolean(busy);
    const button = instance.host.shadowRoot.querySelector("[data-action-key='" + actionKey + "']");
    if (button) {
      button.disabled = Boolean(busy);
    }
  }

  function refreshModuleNote(instance) {
    const enabled = Boolean(
      instance.state.settings &&
        instance.state.settings.platforms &&
        instance.state.settings.platforms.alibabaLabelx &&
        instance.state.settings.platforms.alibabaLabelx.enabled
    );

    instance.ui.moduleNote.textContent = enabled
      ? "当前平台模块已启用，页面业务能力会按设置运行。"
      : "当前平台模块已禁用，此时仅保留页面内设置入口；切换后建议刷新页面生效。";
  }

  function updateDependentFields(instance) {
    if (instance.ui.autoAssignKeyword) {
      instance.ui.autoAssignKeyword.disabled = Boolean(
        instance.ui.autoAssignAll && instance.ui.autoAssignAll.checked
      );
    }

    if (instance.ui.autoAssignBatch) {
      instance.ui.autoAssignBatch.disabled = Boolean(
        instance.ui.autoAssignFetchAll && instance.ui.autoAssignFetchAll.checked
      );
    }
  }

  function renderDebugIndicator(instance) {
    const enabled = Boolean(
      instance.state.settings &&
        instance.state.settings.debug &&
        instance.state.settings.debug.enabled
    );

    instance.ui.debugIndicator.textContent = enabled
      ? "🔧 调试模式(127.0.0.1)"
      : "🌐 正式模式(线上)";

    if (instance.state.debugUnlocked) {
      instance.ui.debugIndicator.classList.remove("hidden");
      return;
    }

    instance.ui.debugIndicator.classList.add("hidden");
  }

  function renderShortcutGrid(instance) {
    const constants = instance.constants;
    const asr = instance.state.settings.asr;
    const rows = constants.SHORTCUT_DEFINITIONS.map(function (item) {
      const isRecording = instance.state.recordingTarget === item.key;
      return [
        '<div class="shortcut-item">',
        '<span class="shortcut-label">' + escapeHtml(item.label) + "</span>",
        '<div class="shortcut-controls">',
        '<button type="button" class="shortcut-button' +
          (isRecording ? " recording" : "") +
          '" data-shortcut-key="' +
          escapeHtml(item.key) +
          '">' +
          escapeHtml(isRecording ? "录制中..." : formatShortcut(asr[item.key])) +
          "</button>",
        '<button type="button" class="icon-button" data-shortcut-delete="' +
          escapeHtml(item.key) +
          '" title="删除此快捷键">×</button>',
        "</div>",
        "</div>",
      ].join("");
    });

    rows.push(
      '<div class="shortcut-item" style="grid-column:1 / -1;text-align:center;color:#8c8c8c;font-size:11px;padding:4px 0;">如果在正在录制中，可以使用 ESC 退出录制</div>'
    );

    instance.ui.shortcutGrid.innerHTML = rows.join("");

    instance.ui.shortcutGrid.querySelectorAll("[data-shortcut-key]").forEach(function (button) {
      button.addEventListener("click", function () {
        startRecording(instance, button.getAttribute("data-shortcut-key"));
      });
    });

    instance.ui.shortcutGrid.querySelectorAll("[data-shortcut-delete]").forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.getAttribute("data-shortcut-delete");
        if (instance.state.recordingTarget === key) {
          instance.state.recordingTarget = null;
        }
        instance.state.settings.asr[key] = null;
        renderShortcutGrid(instance);
        updateFooterStatus(instance, "已清除快捷键绑定", "success");
      });
    });

    instance.ui.shortcutWrap.classList.toggle("open", instance.state.shortcutsOpen);
    instance.ui.shortcutIcon.classList.toggle("open", instance.state.shortcutsOpen);
  }

  function renderReplacementList(instance) {
    const items = instance.state.settings.asr.customReplacements;
    instance.ui.replacementList.innerHTML = items
      .map(function (rule, index) {
        return [
          '<div class="list-row">',
          "<span>将</span>",
          '<input class="field-input" type="text" data-replacement-from="' +
            index +
            '" value="' +
            escapeHtml(rule.from) +
            '" placeholder="识别文本 (多个用逗号隔开)" title="支持输入多个词，用逗号或者竖线隔开" />',
          "<span>替换为</span>",
          '<input class="field-input" type="text" data-replacement-to="' +
            index +
            '" value="' +
            escapeHtml(rule.to) +
            '" placeholder="目标文本" />',
          '<button type="button" class="icon-button" data-replacement-delete="' + index + '">删</button>',
          "</div>",
        ].join("");
      })
      .join("");

    instance.ui.replacementList.querySelectorAll("[data-replacement-from]").forEach(function (input) {
      input.addEventListener("input", function () {
        const index = Number(input.getAttribute("data-replacement-from"));
        instance.state.settings.asr.customReplacements[index].from = input.value;
      });
    });

    instance.ui.replacementList.querySelectorAll("[data-replacement-to]").forEach(function (input) {
      input.addEventListener("input", function () {
        const index = Number(input.getAttribute("data-replacement-to"));
        instance.state.settings.asr.customReplacements[index].to = input.value;
      });
    });

    instance.ui.replacementList
      .querySelectorAll("[data-replacement-delete]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          const index = Number(button.getAttribute("data-replacement-delete"));
          instance.state.settings.asr.customReplacements.splice(index, 1);
          renderReplacementList(instance);
        });
      });
  }

  function renderRateList(instance) {
    const items = instance.state.settings.asr.customRates;
    instance.ui.rateList.innerHTML = items
      .map(function (item, index) {
        const targetKey = "customRate_" + index;
        const isRecording = instance.state.recordingTarget === targetKey;
        return [
          '<div class="list-row">',
          "<span>倍速:</span>",
          '<input class="field-number inline" type="number" min="0.1" max="8" step="0.1" data-rate-value="' +
            index +
            '" value="' +
            escapeHtml(item.rate) +
            '" />',
          '<button type="button" class="shortcut-button' +
            (isRecording ? " recording" : "") +
            '" data-rate-shortcut="' +
            index +
            '">' +
            escapeHtml(isRecording ? "录制中..." : formatShortcut(item.shortcut)) +
            "</button>",
          '<button type="button" class="icon-button" data-rate-delete="' + index + '">删</button>',
          "</div>",
        ].join("");
      })
      .join("");

    instance.ui.rateList.querySelectorAll("[data-rate-value]").forEach(function (input) {
      input.addEventListener("input", function () {
        const index = Number(input.getAttribute("data-rate-value"));
        const nextValue = Number(input.value);
        instance.state.settings.asr.customRates[index].rate = Number.isFinite(nextValue)
          ? Math.max(0.1, Math.min(8, Number(nextValue.toFixed(1))))
          : 1.0;
      });
    });

    instance.ui.rateList.querySelectorAll("[data-rate-shortcut]").forEach(function (button) {
      button.addEventListener("click", function () {
        startRecording(instance, "customRate_" + button.getAttribute("data-rate-shortcut"));
      });
    });

    instance.ui.rateList.querySelectorAll("[data-rate-delete]").forEach(function (button) {
      button.addEventListener("click", function () {
        const index = Number(button.getAttribute("data-rate-delete"));
        if (instance.state.recordingTarget === "customRate_" + index) {
          instance.state.recordingTarget = null;
        }
        instance.state.settings.asr.customRates.splice(index, 1);
        renderRateList(instance);
      });
    });
  }

  function applySettingsToForm(instance) {
    const settings = instance.state.settings;
    const asr = settings.asr;

    instance.ui.platformEnabled.checked = Boolean(settings.platforms.alibabaLabelx.enabled);

    Array.prototype.forEach.call(instance.ui.fieldInputs, function (field) {
      const key = field.getAttribute("data-field");
      const value = asr[key];

      if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else {
        field.value = value == null ? "" : String(value);
      }
    });

    renderDebugIndicator(instance);
    refreshModuleNote(instance);
    updateDependentFields(instance);
    renderShortcutGrid(instance);
    renderReplacementList(instance);
    renderRateList(instance);

    Object.keys(instance.state.actionStatuses).forEach(function (actionKey) {
      const status = instance.state.actionStatuses[actionKey];
      setActionStatus(instance, actionKey, status.text, status.tone);
    });
  }

  function collectSettingsFromForm(instance) {
    const nextSettings = clone(instance.state.settings);

    nextSettings.platforms.alibabaLabelx.enabled = Boolean(instance.ui.platformEnabled.checked);

    Array.prototype.forEach.call(instance.ui.fieldInputs, function (field) {
      const key = field.getAttribute("data-field");

      if (field.type === "checkbox") {
        nextSettings.asr[key] = Boolean(field.checked);
      } else if (field.type === "number") {
        const numericValue = Number(field.value);
        if (Number.isFinite(numericValue)) {
          nextSettings.asr[key] = numericValue;
        }
      } else {
        nextSettings.asr[key] = field.value;
      }
    });

    nextSettings.asr.customReplacements = clone(instance.state.settings.asr.customReplacements);
    nextSettings.asr.customRates = clone(instance.state.settings.asr.customRates);
    nextSettings.asr.playbackRateValue = Number(nextSettings.asr.resetRateValue) || 1;
    nextSettings.asr.autoBatchSubmit = false;
    nextSettings.asr.autoSubmitAfterValidation = false;
    nextSettings.asr.autoReceiveOnSubmit = false;
    nextSettings.asr.validateBeforeSubmit = false;
    nextSettings.asr.autoAssignCheckTasks = false;
    nextSettings.asr.autoAssignAllTasks = false;
    nextSettings.asr.autoAssignFetchAll = false;
    nextSettings.asr.autoAssignTaskKeyword = "";
    nextSettings.asr.autoAssignTargetUser = "";
    nextSettings.asr.autoAssignBatchSize = 0;
    nextSettings.asr.qwenApiKey = "";
    nextSettings.asr.useAdvancedRules = false;
    nextSettings.asr.qwenModel = "";
    nextSettings.asr.shortcutSubmit = null;
    nextSettings.asr.shortcutFixPunctuationAll = null;
    nextSettings.asr.shortcutToggleAutoBatchSubmit = null;
    nextSettings.asr.shortcutToggleAutoSubmitAfterValidation = null;
    nextSettings.asr.shortcutLeaderboard = null;
    return nextSettings;
  }

  function togglePanel(instance, forceVisible) {
    const nextVisible =
      typeof forceVisible === "boolean" ? forceVisible : !instance.state.visible;

    instance.state.visible = nextVisible;

    if (isOverlayMode(instance.state.mode) && instance.ui.backdrop) {
      instance.ui.backdrop.classList.toggle("hidden", !nextVisible);
    }
  }

  function toggleShortcutSection(instance) {
    instance.state.shortcutsOpen = !instance.state.shortcutsOpen;
    instance.ui.shortcutWrap.classList.toggle("open", instance.state.shortcutsOpen);
    instance.ui.shortcutIcon.classList.toggle("open", instance.state.shortcutsOpen);
  }

  function checkShortcutConflict(instance, newShortcut, excludeKey) {
    if (!newShortcut || (newShortcut.key === null && newShortcut.button === null)) {
      return false;
    }

    const asr = instance.state.settings.asr;

    for (let index = 0; index < instance.constants.SHORTCUT_KEYS.length; index += 1) {
      const key = instance.constants.SHORTCUT_KEYS[index];
      if (key !== excludeKey && isShortcutEqual(asr[key], newShortcut)) {
        return true;
      }
    }

    for (let index = 0; index < asr.customRates.length; index += 1) {
      if ("customRate_" + index !== excludeKey && isShortcutEqual(asr.customRates[index].shortcut, newShortcut)) {
        return true;
      }
    }

    return false;
  }

  function startRecording(instance, targetKey) {
    instance.state.recordingTarget = targetKey;
    renderShortcutGrid(instance);
    renderRateList(instance);
    updateFooterStatus(instance, "请按下新的快捷键，按 ESC 可取消录制。", "working");
  }

  function stopRecording(instance) {
    instance.state.recordingTarget = null;
    renderShortcutGrid(instance);
    renderRateList(instance);
  }

  function applyRecordedShortcut(instance, event) {
    if (!instance.state.recordingTarget) {
      return false;
    }

    haltEvent(event);

    if (event.type === "keydown" && event.key === "Escape") {
      stopRecording(instance);
      updateFooterStatus(instance, "已取消快捷键录制。", "muted");
      return true;
    }

    if (event.type === "keydown" && ["Control", "Shift", "Alt", "Meta"].indexOf(event.key) >= 0) {
      return true;
    }

    const newShortcut = {
      ctrl: Boolean(event.ctrlKey),
      alt: Boolean(event.altKey),
      shift: Boolean(event.shiftKey),
      meta: Boolean(event.metaKey),
      key: event.type === "keydown" ? String(event.key).toLowerCase() : null,
      button: event.type === "mousedown" ? event.button : null,
    };

    if (checkShortcutConflict(instance, newShortcut, instance.state.recordingTarget)) {
      updateFooterStatus(instance, "快捷键设置失败：该按键已被占用。", "error");
      stopRecording(instance);
      return true;
    }

    if (instance.state.recordingTarget.indexOf("customRate_") === 0) {
      const index = Number(instance.state.recordingTarget.split("_")[1]);
      if (instance.state.settings.asr.customRates[index]) {
        instance.state.settings.asr.customRates[index].shortcut = newShortcut;
      }
      stopRecording(instance);
      renderRateList(instance);
    } else {
      instance.state.settings.asr[instance.state.recordingTarget] = newShortcut;
      stopRecording(instance);
      renderShortcutGrid(instance);
    }

    updateFooterStatus(instance, "快捷键已更新，保存后生效。", "success");
    return true;
  }

  async function invokeBusinessAction(instance, actionKey) {
    const action = getActionDefinition(instance.constants, actionKey);
    if (!action) {
      return;
    }

    const detail = {
      actionKey: actionKey,
      settings: clone(instance.state.settings),
      controller: instance.api,
    };

    setActionBusy(instance, actionKey, true);
    setActionStatus(instance, actionKey, "执行中...", "working");
    updateFooterStatus(instance, action.label + " 已触发。", "working");

    try {
      window.dispatchEvent(
        new CustomEvent("ASR_EDGE_SETTINGS_ACTION", {
          detail: detail,
        })
      );

      const handler = instance.state.actionHandlers[actionKey];
      if (!handler) {
        setActionStatus(instance, actionKey, action.placeholder || "待接线", "pending");
        updateFooterStatus(instance, action.label + " 当前只有入口，等待其他模块接线。", "muted");
        return;
      }

      const result = await handler(detail);
      const normalizedResult = isPlainObject(result) ? result : { message: result };

      if (isPlainObject(normalizedResult.patchSettings)) {
        instance.state.settings = await instance.storage.patchSettings(normalizedResult.patchSettings);
        applySettingsToForm(instance);
      } else if (normalizedResult.reloadSettings) {
        instance.state.settings = await instance.storage.getSettings();
        applySettingsToForm(instance);
      }

      const statusText =
        typeof normalizedResult.statusText === "string" && normalizedResult.statusText
          ? normalizedResult.statusText
          : typeof normalizedResult.message === "string" && normalizedResult.message
          ? normalizedResult.message
          : action.label + " 已执行。";
      const tone =
        typeof normalizedResult.tone === "string" && normalizedResult.tone
          ? normalizedResult.tone
          : "success";

      setActionStatus(instance, actionKey, statusText, tone);
      updateFooterStatus(instance, statusText, tone);
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      setActionStatus(instance, actionKey, message, "error");
      updateFooterStatus(instance, action.label + " 失败：" + message, "error");
      console.warn(LOG_PREFIX, "Business action failed:", actionKey, error);
    } finally {
      setActionBusy(instance, actionKey, false);
    }
  }

  async function toggleDebugMode(instance) {
    const currentEnabled = Boolean(instance.state.settings.debug.enabled);
    const nextEnabled = !currentEnabled;
    await instance.storage.setDebugMode(nextEnabled);
    instance.state.settings = await instance.storage.getSettings();
    applySettingsToForm(instance);
    updateFooterStatus(
      instance,
      nextEnabled ? "已切换至本地调试模式 (127.0.0.1)" : "已切换至线上正式模式",
      "success"
    );
  }

  async function saveSettings(instance) {
    if (!instance.state.settings) {
      return;
    }

    const previousEnabled = Boolean(instance.state.settings.platforms.alibabaLabelx.enabled);
    instance.ui.saveButton.disabled = true;
    instance.ui.saveButton.textContent = "保存中...";
    updateFooterStatus(instance, "正在保存设置...", "working");

    try {
      const saved = await instance.storage.saveSettings(collectSettingsFromForm(instance));
      instance.state.settings = saved;
      applySettingsToForm(instance);

      const currentEnabled = Boolean(saved.platforms.alibabaLabelx.enabled);
      const message =
        previousEnabled !== currentEnabled
          ? "设置已保存，平台开关已变更；建议刷新页面后让运行态同步。"
          : "设置已在扩展存储中保存并生效。";

      updateFooterStatus(instance, message, "success");
      dispatchSettingsSaved(saved, "manual-save");

      if (instance.state.mode === "overlay") {
        window.setTimeout(function () {
          togglePanel(instance, false);
        }, 450);
      }
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      updateFooterStatus(instance, "保存失败：" + message, "error");
      console.warn(LOG_PREFIX, "Save settings failed:", error);
    } finally {
      instance.ui.saveButton.disabled = false;
      instance.ui.saveButton.textContent = "保存并生效";
    }
  }

  async function resetSettings(instance) {
    if (
      !window.confirm(
        '⚠️ 确定要恢复所有设置到默认状态吗？\n(这将会应用最新的默认快捷键与词库，并覆盖您当前的数据)'
      )
    ) {
      return;
    }

    instance.ui.resetButton.disabled = true;
    updateFooterStatus(instance, "正在恢复默认设置...", "working");

    try {
      instance.state.settings = await instance.storage.resetSettings({
        preservePlatformEnabled: true,
      });
      applySettingsToForm(instance);
      updateFooterStatus(instance, "默认设置已恢复。", "success");
      dispatchSettingsSaved(instance.state.settings, "reset-settings");
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      updateFooterStatus(instance, "恢复默认失败：" + message, "error");
    } finally {
      instance.ui.resetButton.disabled = false;
    }
  }

  async function clearCache(instance) {
    if (!window.confirm("确定要清除扩展缓存吗？（更新检测缓存、本页时长等，个人配置不受影响）")) {
      return;
    }

    instance.ui.clearCacheButton.disabled = true;
    updateFooterStatus(instance, "正在清理缓存...", "working");

    try {
      const nextCache = await instance.storage.clearRuntimeCache();
      instance.state.settings.cache = nextCache;
      updateFooterStatus(instance, "缓存已清空，本页时长等运行态缓存已重置。", "success");
      window.dispatchEvent(
        new CustomEvent("ASR_EDGE_CACHE_CLEARED", {
          detail: {
            cache: clone(nextCache),
          },
        })
      );
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      updateFooterStatus(instance, "清理缓存失败：" + message, "error");
    } finally {
      instance.ui.clearCacheButton.disabled = false;
    }
  }

  function handleGlobalInput(instance, event) {
    if (applyRecordedShortcut(instance, event)) {
      return;
    }

    if (
      event.type === "keydown" &&
      event.key === "Escape" &&
      isOverlayMode(instance.state.mode) &&
      instance.state.visible
    ) {
      togglePanel(instance, false);
      return;
    }

    if (
      isOverlayMode(instance.state.mode) &&
      instance.state.settings &&
      isShortcutMatch(event, instance.state.settings.asr.shortcutPanel)
    ) {
      haltEvent(event);
      togglePanel(instance);
    }
  }

  async function loadSettings(instance) {
    updateFooterStatus(instance, "正在加载扩展设置...", "working");
    instance.state.settings = await instance.storage.getSettings();
    instance.state.loaded = true;
    applySettingsToForm(instance);
    updateFooterStatus(instance, "设置已从扩展存储回显。", "muted");
  }

  function bindEvents(instance) {
    if (instance.ui.entryButton) {
      instance.ui.entryButton.addEventListener("click", function () {
        togglePanel(instance, true);
      });
    }

    if (instance.ui.closeButton) {
      instance.ui.closeButton.addEventListener("click", function () {
        togglePanel(instance, false);
      });
    }

    if (instance.ui.backdrop && isOverlayMode(instance.state.mode)) {
      instance.ui.backdrop.addEventListener("click", function (event) {
        if (event.target === instance.ui.backdrop) {
          togglePanel(instance, false);
        }
      });
    }

    instance.ui.shortcutToggle.addEventListener("click", function () {
      toggleShortcutSection(instance);
    });

    instance.ui.addReplacement.addEventListener("click", function () {
      instance.state.settings.asr.customReplacements.push({ from: "", to: "" });
      renderReplacementList(instance);
    });

    instance.ui.addRate.addEventListener("click", function () {
      instance.state.settings.asr.customRates.push({ rate: 1.0, shortcut: null });
      renderRateList(instance);
    });

    if (instance.ui.autoAssignAll) {
      instance.ui.autoAssignAll.addEventListener("change", function () {
        updateDependentFields(instance);
      });
    }

    if (instance.ui.autoAssignFetchAll) {
      instance.ui.autoAssignFetchAll.addEventListener("change", function () {
        updateDependentFields(instance);
      });
    }

    instance.ui.clearCacheButton.addEventListener("click", function () {
      void clearCache(instance);
    });

    instance.ui.resetButton.addEventListener("click", function () {
      void resetSettings(instance);
    });

    instance.ui.saveButton.addEventListener("click", function () {
      void saveSettings(instance);
    });

    instance.ui.panelTitle.addEventListener("mousedown", function (event) {
      event.preventDefault();
      instance.state.debugClickCount += 1;

      if (instance.state.debugResetTimer) {
        window.clearTimeout(instance.state.debugResetTimer);
      }

      if (instance.state.debugClickCount >= 5) {
        instance.state.debugClickCount = 0;
        instance.state.debugUnlocked = true;
        renderDebugIndicator(instance);
        updateFooterStatus(instance, "开发者模式开关已显现。", "success");
      } else if (instance.state.debugClickCount >= 2) {
        updateFooterStatus(
          instance,
          "再按 " + (5 - instance.state.debugClickCount) + " 次唤出开发者选项。",
          "muted"
        );
      }

      instance.state.debugResetTimer = window.setTimeout(function () {
        instance.state.debugClickCount = 0;
      }, 600);
    });

    instance.ui.debugIndicator.addEventListener("click", function () {
      void toggleDebugMode(instance);
    });

    Array.prototype.forEach.call(instance.ui.actionButtons, function (button) {
      button.addEventListener("click", function () {
        void invokeBusinessAction(instance, button.getAttribute("data-action-key"));
      });
    });

    const keydownListener = function (event) {
      handleGlobalInput(instance, event);
    };
    const mousedownListener = function (event) {
      handleGlobalInput(instance, event);
    };

    window.addEventListener("keydown", keydownListener, true);
    window.addEventListener("mousedown", mousedownListener, true);

    instance.disposeFns.push(function () {
      window.removeEventListener("keydown", keydownListener, true);
      window.removeEventListener("mousedown", mousedownListener, true);
    });
  }

  function createApi(instance) {
    return {
      show: async function () {
        if (!instance.state.loaded) {
          await loadSettings(instance);
        }
        togglePanel(instance, true);
      },
      hide: function () {
        togglePanel(instance, false);
      },
      toggle: async function () {
        if (!instance.state.loaded) {
          await loadSettings(instance);
        }
        togglePanel(instance);
      },
      refresh: async function () {
        instance.state.settings = await instance.storage.getSettings();
        applySettingsToForm(instance);
        return clone(instance.state.settings);
      },
      registerActionHandler: function (actionKey, handler) {
        if (typeof handler !== "function") {
          delete instance.state.actionHandlers[actionKey];
          return;
        }
        instance.state.actionHandlers[actionKey] = handler;
      },
      updateActionStatus: function (actionKey, text, tone) {
        setActionStatus(instance, actionKey, text, tone || "pending");
      },
      getState: function () {
        return {
          visible: instance.state.visible,
          loaded: instance.state.loaded,
          recordingTarget: instance.state.recordingTarget,
          settings: clone(instance.state.settings),
          actionStatuses: clone(instance.state.actionStatuses),
        };
      },
      destroy: function () {
        unmountSettingsPanel();
      },
    };
  }

  function mountSettingsPanel(options) {
    const constants = getConstants();
    const storage = getStorage();

    if (!constants || !storage) {
      console.warn(LOG_PREFIX, "Shared constants or storage layer is missing.");
      return null;
    }

    if (panelInstance) {
      return panelInstance.api;
    }

    const normalizedOptions = isPlainObject(options) ? options : {};
    const mode =
      normalizedOptions.mode === "embedded"
        ? "embedded"
        : normalizedOptions.mode === "page" || normalizedOptions.mode === "options-page"
        ? "page"
        : "overlay";
    const container =
      !isOverlayMode(mode) && normalizedOptions.container instanceof HTMLElement
        ? normalizedOptions.container
        : document.body;

    const instance = {
      constants: constants,
      storage: storage,
      container: container,
      host: null,
      ui: null,
      api: null,
      disposeFns: [],
      state: createInitialState(mode),
    };

    instance.host = ensureHost(instance);
    instance.host.attachShadow({ mode: "open" });
    instance.host.shadowRoot.innerHTML = buildMarkup(constants, mode);
    bindUi(instance);
    bindEvents(instance);
    instance.api = createApi(instance);
    panelInstance = instance;

    if (!isOverlayMode(mode)) {
      void instance.api.show();
    } else {
      void loadSettings(instance);
    }

    console.info(LOG_PREFIX, "Settings panel mounted in", mode, "mode.");
    return instance.api;
  }

  function unmountSettingsPanel() {
    if (!panelInstance) {
      return false;
    }

    panelInstance.disposeFns.forEach(function (dispose) {
      try {
        dispose();
      } catch (error) {
        console.warn(LOG_PREFIX, "Dispose callback failed:", error);
      }
    });

    if (panelInstance.state.debugResetTimer) {
      window.clearTimeout(panelInstance.state.debugResetTimer);
    }

    panelInstance.host.remove();
    panelInstance = null;
    return true;
  }

  function getMountedPanel() {
    return panelInstance ? panelInstance.api : null;
  }

  window.__ASREdgeAlibabaLabelxSettingsPanel = {
    mount: mountSettingsPanel,
    unmount: unmountSettingsPanel,
    getMountedPanel: getMountedPanel,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
