(function () {
  const constants = globalThis.ASREdgeConstants || {};
  const storage = globalThis.ASREdgeStorage || null;
  const messageTypes = constants.MESSAGE_TYPES || {};
  const scriptLibrary = constants.SCRIPT_LIBRARY || {};
  const platformLibrary = constants.PLATFORM_LIBRARY || {};
  const transcriptionProjectId = constants.TRANSCRIPTION_PROJECT_ID || "transcription";
  const judgementProjectId = constants.JUDGEMENT_PROJECT_ID || "judgement";
  const lightwheelScriptId = constants.LIGHTWHEEL_VIEW_PANEL_SCRIPT_ID || "lightwheelViewPanel";
  const dataBakerRoundOneQualityScriptId =
    constants.DATA_BAKER_ROUND_ONE_QUALITY_SCRIPT_ID || "dataBakerRoundOneQuality";
  const dataBakerCvpcHost =
    (constants.DATA_BAKER_CVPC_PLATFORM || {}).host || "cvpc.data-baker.com";
  const dataBakerCvpcLiuzhouScriptId =
    constants.DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID || "dataBakerCvpcLiuzhouAssistant";
  const bytedanceAidpHost =
    (constants.BYTEDANCE_AIDP_PLATFORM || {}).host || "aidp.bytedance.com";
  const bytedanceAidpSuzhouScriptId =
    constants.BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID || "bytedanceAidpSuzhouHelper";
  const magicDataHost = "work.magicdatatech.com";
  const magicDataHakkaScriptId =
    constants.MAGIC_DATA_ANNOTATOR_SCRIPT_ID || "magicDataAnnotatorAiReview";
  const magicDataMinnanScriptId =
    constants.MAGIC_DATA_MINNAN_SCRIPT_ID || "magicDataMinnanAssistant";
  const aishellTechHost = (constants.AISHELL_TECH_PLATFORM || {}).host || "mark.aishelltech.com";
  const aishellTechMinnanScriptId =
    constants.AISHELL_TECH_MINNAN_SCRIPT_ID || "aishellTechMinnanAssistant";
  const aishellTechVietnameseScriptId =
    constants.AISHELL_TECH_VIETNAMESE_SCRIPT_ID || "aishellTechVietnameseAssistant";
  const abakaAiHost = (constants.ABAKA_AI_PLATFORM || {}).host || "abao.fortidyndns.com";
  const abakaAiScriptId =
    constants.ABAKA_AI_TASK_PAGE_CAPTURE_SCRIPT_ID || "abakaAiTaskPageCapture";
  let currentDetectedScriptId = null;

  function queryTabs(queryInfo) {
    return new Promise(function (resolve) {
      chrome.tabs.query(queryInfo, function (tabs) {
        resolve(Array.isArray(tabs) ? tabs : []);
      });
    });
  }

  function sendMessageToTab(tabId, message) {
    return new Promise(function (resolve) {
      chrome.tabs.sendMessage(tabId, message, function (response) {
        const error = chrome.runtime && chrome.runtime.lastError;
        if (error) {
          resolve({
            ok: false,
            error: error.message,
          });
          return;
        }

        resolve(response || { ok: false, error: "empty-response" });
      });
    });
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  function setPopupStatus(text) {
    getElement("popup-status").textContent = text || "";
  }

  function setPill(id, text, tone) {
    const node = getElement(id);
    node.textContent = text;
    node.className = "pill " + tone;
  }

  function getLabelxActiveScriptId(settings) {
    return settings?.platforms?.alibabaLabelx?.scriptCenter?.activeProjectId || transcriptionProjectId;
  }

  function isLightwheelEnabled(settings) {
    return Boolean(
      settings?.platforms?.lightwheel?.enabled &&
        settings?.platforms?.lightwheel?.scripts?.viewPanel?.enabled
    );
  }

  function openScriptCenter(scriptId) {
    const targetUrl = scriptId
      ? chrome.runtime.getURL(
          "options/options.html?view=script&script=" + encodeURIComponent(scriptId)
        )
      : chrome.runtime.getURL("options/options.html");
    chrome.tabs.create({ url: targetUrl });
    window.close();
  }

  async function getActiveTab() {
    const tabs = await queryTabs({
      active: true,
      currentWindow: true,
    });

    return tabs[0] || null;
  }

  function getDetectedContext(urlString, settings) {
    if (!urlString) {
      return {
        scriptId: null,
        platformId: null,
        statusText: "无法读取当前页 URL",
        statusTone: "pending",
        title: "当前页面不可识别",
        description: "当前标签页 URL 不可用，无法判断脚本是否命中。",
      };
    }

    let url;
    try {
      url = new URL(urlString);
    } catch (error) {
      return {
        scriptId: null,
        platformId: null,
        statusText: "URL 解析失败",
        statusTone: "error",
        title: "当前页面不可识别",
        description: "当前标签页 URL 无法解析。",
      };
    }

    if (url.hostname === (constants.TARGET_PLATFORM || {}).host) {
      if (!String(url.pathname || "").toLowerCase().startsWith("/corpora/labeling/")) {
        return {
          scriptId: null,
          platformId: "alibabaLabelx",
          url: url,
          statusText: "未触发",
          statusTone: "pending",
          title: "当前页面属于 Alibaba LabelX",
          description: "但当前 URL 不在标注脚本的匹配范围内。",
        };
      }

      const activeScriptId = getLabelxActiveScriptId(settings);
      const platformEnabled = Boolean(settings?.platforms?.alibabaLabelx?.enabled);
      const activeScript = scriptLibrary[activeScriptId] || {};

      return {
        scriptId: activeScriptId,
        platformId: "alibabaLabelx",
        url: url,
        platformEnabled: platformEnabled,
        title: "当前页面命中 Alibaba LabelX",
        description: platformEnabled
          ? "当前会尝试触发 " + String(activeScript.label || activeScriptId) + "。"
          : "当前页面属于 LabelX，但该平台脚本目前未启用。",
      };
    }

    if (url.hostname === (constants.LIGHTWHEEL_PLATFORM || {}).host) {
      const scriptVisible =
        typeof constants.isScriptVisible === "function"
          ? constants.isScriptVisible(lightwheelScriptId, settings || {})
          : true;
      const scriptRuntimeAccessible =
        typeof constants.isScriptRuntimeAccessible === "function"
          ? constants.isScriptRuntimeAccessible(lightwheelScriptId, settings || {})
          : isLightwheelEnabled(settings);
      if (!scriptVisible || !scriptRuntimeAccessible) {
        return {
          scriptId: null,
          platformId: null,
          url: url,
          statusText: "未触发",
          statusTone: "pending",
          title: "当前页面未命中已启用脚本",
          description: "当前页面没有可对外显示的已启用脚本。",
        };
      }
      const access = url.searchParams.get("access") || "";
      const enabled = isLightwheelEnabled(settings);

      if (url.pathname === "/w/video3/index.html" && access === "1") {
        return {
          scriptId: lightwheelScriptId,
          platformId: "lightwheel",
          url: url,
          platformEnabled: enabled,
          title: "当前页面命中 Lightwheel 查看态面板",
          description: enabled
            ? "当前 URL 满足 access=1，可命中 Lightwheel 查看态面板脚本。"
            : "当前 URL 满足 access=1，但 Lightwheel 查看态面板未启用。",
        };
      }

      return {
        scriptId: lightwheelScriptId,
        platformId: "lightwheel",
        url: url,
        platformEnabled: enabled,
        title: "当前页面属于 Lightwheel",
        description: "但当前 URL 不满足查看态面板脚本的 access=1 触发条件。",
        statusText: "未触发",
        statusTone: "pending",
      };
    }

    if (url.hostname === (constants.DATA_BAKER_PLATFORM || {}).host) {
      const pathname = String(url.pathname || "").toLowerCase();
      const hash = String(url.hash || "").toLowerCase();
      const isV2Path =
        pathname === "/v2" || pathname === "/v2/" || pathname.startsWith("/v2/");
      const platformEnabled = settings?.platforms?.dataBaker?.enabled !== false;
      const scriptEnabled =
        settings?.platforms?.dataBaker?.scripts?.roundOneQuality?.enabled !== false;
      const enabledDescriptionSuffix =
        platformEnabled && scriptEnabled
          ? ""
          : " 当前平台或脚本未启用，可在脚本中心启用后再使用。";

      if (!isV2Path) {
        return {
          scriptId: dataBakerRoundOneQualityScriptId,
          platformId: "dataBaker",
          url: url,
          platformEnabled: platformEnabled,
          scriptEnabled: scriptEnabled,
          statusText: "未触发",
          statusTone: "pending",
          title: "当前页面属于标贝易采",
          description: "当前 URL 不在标贝易采 /v2 页面范围内。" + enabledDescriptionSuffix,
        };
      }

      if (hash.indexOf("#/quality/roundonecollect") >= 0) {
        return {
          scriptId: dataBakerRoundOneQualityScriptId,
          platformId: "dataBaker",
          url: url,
          platformEnabled: platformEnabled,
          scriptEnabled: scriptEnabled,
          title: "当前页面命中标贝易采",
          description:
            "当前会尝试触发“闽南语助手”。" + enabledDescriptionSuffix,
        };
      }

      if (hash.indexOf("#/group/detail") >= 0) {
        return {
          scriptId: dataBakerRoundOneQualityScriptId,
          platformId: "dataBaker",
          url: url,
          platformEnabled: platformEnabled,
          scriptEnabled: scriptEnabled,
          title: "当前页面命中标贝易采",
          description:
            "当前支持任务组详情页导出能力。" + enabledDescriptionSuffix,
        };
      }

      return {
        scriptId: dataBakerRoundOneQualityScriptId,
        platformId: "dataBaker",
        url: url,
        platformEnabled: platformEnabled,
        scriptEnabled: scriptEnabled,
        statusText: "待进入一检页面",
        statusTone: "pending",
        title: "当前页面属于标贝易采",
        description:
          "进入一检详情页后会尝试触发“闽南语助手”。" + enabledDescriptionSuffix,
      };
    }

    if (url.hostname === magicDataHost) {
      const hash = String(url.hash || "").toLowerCase();
      const isAsrmark = hash.indexOf("#/asrmark") >= 0;
      const platformEnabled = settings?.platforms?.magicData?.enabled !== false;
      const hakkaEnabled =
        settings?.platforms?.magicData?.scripts?.hakkaHelper?.enabled !== false &&
        settings?.platforms?.magicData?.scripts?.hakkaHelper?.aiReviewEnabled !== false &&
        settings?.scriptCenter?.projects?.magicDataAnnotator?.enabled !== false &&
        settings?.scriptCenter?.projects?.magicDataAnnotator?.aiReviewEnabled !== false;
      const minnanEnabled =
        settings?.platforms?.magicData?.scripts?.minnanHelper?.enabled !== false &&
        settings?.platforms?.magicData?.scripts?.minnanHelper?.aiReviewEnabled !== false &&
        settings?.scriptCenter?.projects?.magicDataMinnanAssistant?.enabled !== false &&
        settings?.scriptCenter?.projects?.magicDataMinnanAssistant?.aiReviewEnabled !== false;
      const configuredActiveScriptId = String(settings?.platforms?.magicData?.activeScriptId || "").trim();
      const activeScriptId =
        configuredActiveScriptId === magicDataHakkaScriptId && hakkaEnabled
          ? magicDataHakkaScriptId
          : configuredActiveScriptId === magicDataMinnanScriptId && minnanEnabled
            ? magicDataMinnanScriptId
            : hakkaEnabled && !minnanEnabled
              ? magicDataHakkaScriptId
              : minnanEnabled && !hakkaEnabled
                ? magicDataMinnanScriptId
                : null;
      const activeScript = activeScriptId ? scriptLibrary[activeScriptId] || {} : {};
      const enabledLabel = activeScriptId
        ? String(activeScript.label || activeScript.shortLabel || activeScriptId)
        : "无";
      if (isAsrmark) {
        return {
          scriptId: activeScriptId,
          scriptLabel: enabledLabel,
          platformId: "magicData",
          platformLabel: "Magic Data ANNOTATOR",
          url: url,
          statusText: platformEnabled && activeScriptId ? "已支持" : "未启用",
          statusTone: platformEnabled && activeScriptId ? "success" : "disabled",
          title: "当前页面：Magic Data 标注单条页",
          description:
            "脚本状态：当前生效助手为 " +
            enabledLabel +
            "。请在页面说话内容表格下方查看对应助手结果区（仅 AI 辅助，不自动保存/提交）。",
          openScriptSettings: Boolean(activeScriptId),
        };
      }
      return {
        scriptId: activeScriptId,
        scriptLabel: enabledLabel,
        platformId: "magicData",
        platformLabel: "Magic Data ANNOTATOR",
        url: url,
        statusText: "待进入标注单条页",
        statusTone: "pending",
        title: "当前页面属于 Magic Data",
        description: "进入 #/asrmark 后可使用已启用助手（当前：" + enabledLabel + "）。",
        openScriptSettings: Boolean(activeScriptId),
      };
    }

    if (url.hostname === dataBakerCvpcHost) {
      const scriptVisible =
        typeof constants.isScriptVisible === "function"
          ? constants.isScriptVisible(dataBakerCvpcLiuzhouScriptId, settings || {})
          : true;
      const scriptRuntimeAccessible =
        typeof constants.isScriptRuntimeAccessible === "function"
          ? constants.isScriptRuntimeAccessible(dataBakerCvpcLiuzhouScriptId, settings || {})
          : true;
      if (!scriptVisible) {
        return {
          scriptId: null,
          platformId: null,
          url: url,
          statusText: "未触发",
          statusTone: "pending",
          title: "当前页面未命中已启用脚本",
          description: "当前 beta 平台或脚本尚未解锁。",
        };
      }
      const pathname = String(url.pathname || "").toLowerCase();
      const platformEnabled = settings?.platforms?.dataBakerCvpc?.enabled !== false;
      const scriptEnabled =
        settings?.platforms?.dataBakerCvpc?.scripts?.liuzhouAssistant?.enabled !== false;
      const enabled = platformEnabled && scriptEnabled && scriptRuntimeAccessible;
      if (pathname === "/app/editor/asr/") {
        return {
          scriptId: dataBakerCvpcLiuzhouScriptId,
          platformId: "dataBakerCvpc",
          platformLabel: "DataBaker CVPC",
          url: url,
          platformEnabled: platformEnabled,
          scriptEnabled: scriptEnabled,
          statusText: enabled ? "已支持 Beta" : "未启用",
          statusTone: enabled ? "success" : "disabled",
          title: "当前页面命中 DataBaker CVPC",
          description: enabled
            ? "当前页会尝试触发“柳州话脚本” beta 运行时：生成画段建议、当前段 AI 推荐和辅助填入。"
            : "当前 URL 已命中 CVPC 编辑器，但平台脚本未启用或尚未解锁 beta。 ",
        };
      }
      return {
        scriptId: dataBakerCvpcLiuzhouScriptId,
        platformId: "dataBakerCvpc",
        platformLabel: "DataBaker CVPC",
        url: url,
        platformEnabled: platformEnabled,
        scriptEnabled: scriptEnabled,
        statusText: enabled ? "待进入编辑器" : "未启用",
        statusTone: enabled ? "pending" : "disabled",
        title: "当前页面属于 DataBaker CVPC",
        description: "进入 /app/editor/asr/ 后，才会触发柳州话脚本 beta 运行时。",
      };
    }

    if (url.hostname === bytedanceAidpHost) {
      const scriptVisible =
        typeof constants.isScriptVisible === "function"
          ? constants.isScriptVisible(bytedanceAidpSuzhouScriptId, settings || {})
          : true;
      const scriptRuntimeAccessible =
        typeof constants.isScriptRuntimeAccessible === "function"
          ? constants.isScriptRuntimeAccessible(bytedanceAidpSuzhouScriptId, settings || {})
          : true;
      if (!scriptVisible) {
        return {
          scriptId: null,
          platformId: null,
          url: url,
          statusText: "未触发",
          statusTone: "pending",
          title: "当前页面未命中已启用脚本",
          description: "当前 beta 平台或脚本尚未解锁。",
        };
      }
      const pathname = String(url.pathname || "").toLowerCase();
      const isDetailPage = /^\/management\/task-v2\/[^/]+\/mark-v3\/[^/]+\/?$/.test(pathname);
      const platformEnabled = settings?.platforms?.bytedanceAidp?.enabled !== false;
      const scriptConfig = settings?.platforms?.bytedanceAidp?.scripts?.suzhouHelper || {};
      const scriptEnabled = scriptConfig.enabled !== false;
      const platformAiEnabled = scriptConfig.platformAiEnabled !== false;
      const enabled = platformEnabled && scriptEnabled && scriptRuntimeAccessible;

      if (isDetailPage) {
        return {
          scriptId: bytedanceAidpSuzhouScriptId,
          platformId: "bytedanceAidp",
          platformLabel: "ByteDance AIDP",
          url: url,
          platformEnabled: platformEnabled,
          scriptEnabled: scriptEnabled,
          statusText: !enabled
            ? "未启用"
            : platformAiEnabled
              ? "已支持 Beta"
              : "已支持 Beta（平台 AI 已隐藏）",
          statusTone: !enabled ? "disabled" : platformAiEnabled ? "success" : "pending",
          title: "当前页面命中 ByteDance AIDP mark-v3 详情页",
          description: enabled
            ? platformAiEnabled
              ? "当前页会按设置显示平台原生 AI 板块；勾选“隐藏平台AI功能”后会隐藏 AI 洞察与猫形浮动入口，不改任务列表、波形区、保留/丢弃和分段表格。"
              : "当前页会按设置隐藏平台原生 AI 洞察与猫形浮动入口；取消勾选“隐藏平台AI功能”后会恢复显示，不调用 AI、不自动保存、不自动提交。"
            : "当前 URL 已命中 mark-v3 详情页，但平台脚本未启用或尚未解锁 beta。",
        };
      }

      if (pathname.indexOf("/management/task-v2") === 0) {
        return {
          scriptId: bytedanceAidpSuzhouScriptId,
          platformId: "bytedanceAidp",
          platformLabel: "ByteDance AIDP",
          url: url,
          platformEnabled: platformEnabled,
          scriptEnabled: scriptEnabled,
          statusText: enabled ? "待进入详情页" : "未启用",
          statusTone: enabled ? "pending" : "disabled",
          title: "当前页面属于 ByteDance AIDP 任务页",
          description:
            "进入 /management/task-v2/{taskId}/mark-v3/{index} 后，才会触发苏州话脚本 beta 运行时。",
        };
      }
    }

    if (url.hostname === aishellTechHost) {
      const pathname = String(url.pathname || "").toLowerCase();
      const aishellState = getAishellTechActiveScriptState(settings);
      const enabled = aishellState.enabled;
      const aiReady = aishellState.aiReady;
      const activeScriptId = aishellState.activeScriptId || aishellTechMinnanScriptId;
      const activeLabel = aishellState.scriptLabel;

      if (pathname === "/mytask/mark") {
        return {
          scriptId: activeScriptId,
          platformId: "aishellTech",
          platformLabel: "希尔贝壳",
          url: url,
          platformEnabled: aishellState.platformEnabled,
          scriptEnabled: enabled,
          statusText: !enabled ? "未启用" : aiReady ? "已支持" : "AI 推荐已关闭",
          statusTone: !enabled ? "disabled" : aiReady ? "success" : "pending",
          title: "当前页面命中希尔贝壳数据标注页",
          description: aiReady
            ? "当前页可使用“" + activeLabel + "”：支持当前条 AI 推荐、复制、填入，以及当前分包内从当前选中条开始的批量串行保存。"
            : "当前页已命中希尔贝壳数据标注页，但平台脚本未启用、未选择生效脚本，或 AI 推荐面板已关闭。",
        };
      }

      if (pathname.indexOf("/mytask/detail/") === 0) {
        return {
          scriptId: activeScriptId,
          platformId: "aishellTech",
          platformLabel: "希尔贝壳",
          url: url,
          platformEnabled: aishellState.platformEnabled,
          scriptEnabled: enabled,
          statusText: enabled ? "待进入数据标注页" : "未启用",
          statusTone: enabled ? "pending" : "disabled",
          title: "当前页面属于希尔贝壳任务详情页",
          description:
            "点击分包“查看”进入 /mytask/mark 后，才会触发“" + activeLabel + "”运行时。",
        };
      }

      if (pathname === "/mytask/index") {
        return {
          scriptId: activeScriptId,
          platformId: "aishellTech",
          platformLabel: "希尔贝壳",
          url: url,
          platformEnabled: aishellState.platformEnabled,
          scriptEnabled: enabled,
          statusText: enabled ? "待进入任务详情/标注页" : "未启用",
          statusTone: enabled ? "pending" : "disabled",
          title: "当前页面属于希尔贝壳我的任务页",
          description:
            "当前脚本只在任务详情页和数据标注页做路由覆盖，实际业务能力只在 /mytask/mark 生效；当前生效脚本为“" + activeLabel + "”。",
        };
      }

      return {
        scriptId: activeScriptId,
        platformId: "aishellTech",
        platformLabel: "希尔贝壳",
        url: url,
        platformEnabled: aishellState.platformEnabled,
        scriptEnabled: enabled,
        statusText: enabled ? "待进入业务页" : "未启用",
        statusTone: enabled ? "pending" : "disabled",
        title: "当前页面属于希尔贝壳",
        description:
          "当前脚本主要围绕 /mytask/mark 工作；其余页面只做路由覆盖与资料复用。当前生效脚本为“" +
          activeLabel +
          "”。",
      };
    }

    if (url.hostname === abakaAiHost) {
      const platformEnabled = settings?.platforms?.abakaAi?.enabled !== false;
      const scriptEnabled = settings?.platforms?.abakaAi?.scripts?.taskPageCapture?.enabled !== false;
      const enabled = platformEnabled && scriptEnabled;
      const pathname = String(url.pathname || "");
      return {
        scriptId: abakaAiScriptId,
        platformId: "abakaAi",
        platformLabel: "Abaka AI",
        url: url,
        platformEnabled: platformEnabled,
        scriptEnabled: scriptEnabled,
        statusText: enabled ? "已支持只读采集" : "未启用",
        statusTone: enabled ? "success" : "disabled",
        title: "当前页面属于 Abaka AI",
        description:
          "当前脚本仅做页面结构与 Network 脱敏采集（Console 导出），不自动领取、不自动保存、不自动提交、不自动流转。当前路径：" +
          pathname,
      };
    }

    return {
      scriptId: null,
      platformId: null,
      url: url,
      statusText: "未命中",
      statusTone: "pending",
      title: "当前页面未命中任何脚本",
      description: "当前 URL 不在脚本中心已接入的平台范围内。",
    };
  }

  async function enrichRuntimeStatus(activeTab, context) {
    if (!context.scriptId) {
      return context;
    }

    if (context.platformId === "alibabaLabelx") {
      if (!context.platformEnabled) {
        context.statusText = "未启用";
        context.statusTone = "disabled";
        return context;
      }

      const response = await sendMessageToTab(activeTab.id, {
        type: messageTypes.PANEL_PING,
      });

      if (
        response &&
        response.ok === true &&
        context.scriptId === transcriptionProjectId &&
        response.scriptId === transcriptionProjectId &&
        response.injected === true
      ) {
        if (response.matched === true) {
          context.statusText = "运行成功";
          context.statusTone = "success";
          context.description += " 页面内转写运行时已命中详情页并启动。";
          return context;
        }

        context.statusText = "已注入";
        context.statusTone = "pending";
        context.description += " 转写脚本已注入，正在等待转写详情页 DOM 加载。";
        return context;
      }

      if (response && response.ok === true) {
        context.statusText = "运行成功";
        context.statusTone = "success";
        context.description += " 页面内运行时已响应。";
        return context;
      }

      context.statusText = "注入失败";
      context.statusTone = "error";
      context.description += " 该页面未响应扩展运行时，请刷新页面或重新加载扩展。";
      return context;
    }

    if (context.platformId === "lightwheel") {
      if (!context.platformEnabled) {
        context.statusText = context.statusText || "未启用";
        context.statusTone = context.statusTone || "disabled";
        return context;
      }

      context.statusText = context.statusText || "待迁移";
      context.statusTone = context.statusTone || "pending";
      context.description += " 当前扩展版还没有把运行时逻辑迁过来。";
      return context;
    }

    if (context.platformId === "dataBaker") {
      if (!context.platformEnabled || context.scriptEnabled === false) {
        context.statusText = "未启用";
        context.statusTone = "disabled";
        return context;
      }

      if (!context.statusText) {
        context.statusText = "已启用";
      }
      if (!context.statusTone) {
        context.statusTone = "success";
      }
      return context;
    }

    if (context.platformId === "magicData") {
      return context;
    }

    if (context.platformId === "aishellTech") {
      return context;
    }

    return context;
  }

  function getAishellTechActiveScriptState(settings) {
    const platformEnabled = settings?.platforms?.aishellTech?.enabled !== false;
    const activeScriptId = String(settings?.platforms?.aishellTech?.activeScriptId || "").trim();
    const minnanConfig = settings?.platforms?.aishellTech?.scripts?.minnanHelper || {};
    const vietnameseConfig = settings?.platforms?.aishellTech?.scripts?.vietnameseHelper || {};
    const minnanEnabled =
      minnanConfig.enabled !== false && minnanConfig.aiRecommendEnabled !== false;
    const vietnameseEnabled =
      vietnameseConfig.enabled !== false && vietnameseConfig.aiRecommendEnabled !== false;
    const resolvedScriptId =
      activeScriptId === aishellTechMinnanScriptId && minnanEnabled
        ? aishellTechMinnanScriptId
        : activeScriptId === aishellTechVietnameseScriptId && vietnameseEnabled
          ? aishellTechVietnameseScriptId
          : minnanEnabled && !vietnameseEnabled
            ? aishellTechMinnanScriptId
            : vietnameseEnabled && !minnanEnabled
              ? aishellTechVietnameseScriptId
              : minnanEnabled
                ? aishellTechMinnanScriptId
                : "";
    const activeScript = resolvedScriptId ? scriptLibrary[resolvedScriptId] || {} : {};
    return {
      platformEnabled: platformEnabled,
      activeScriptId: resolvedScriptId,
      scriptLabel: resolvedScriptId
        ? String(activeScript.label || activeScript.shortLabel || resolvedScriptId)
        : "无",
      enabled: platformEnabled && Boolean(resolvedScriptId),
      aiReady:
        platformEnabled &&
        Boolean(resolvedScriptId) &&
        (resolvedScriptId === aishellTechVietnameseScriptId ? vietnameseEnabled : minnanEnabled),
    };
  }

  function renderContext(context) {
    currentDetectedScriptId = context.scriptId || null;

    getElement("detected-title").textContent = context.title || "当前页面检测完成";
    getElement("detected-description").textContent = context.description || "";
    setPill("detected-status-pill", context.statusText || "检测完成", context.statusTone || "pending");

    const platform = context.platformId ? platformLibrary[context.platformId] || {} : {};
    const script = context.scriptId ? scriptLibrary[context.scriptId] || {} : {};

    setPill(
      "detected-platform-pill",
      context.platformId
        ? String(context.platformLabel || platform.label || context.platformId)
        : "未命中平台",
      context.platformId ? "info" : "pending"
    );
    setPill(
      "detected-script-pill",
      context.scriptId ? String(context.scriptLabel || script.label || context.scriptId) : "无脚本触发",
      context.scriptId ? "info" : "pending"
    );

    const openScriptSettingsButton = getElement("open-script-settings");
    openScriptSettingsButton.disabled = !context.scriptId || context.openScriptSettings === false;

    if (!context.scriptId) {
      setPopupStatus("你可以直接打开脚本中心查看所有脚本。");
      return;
    }

    setPopupStatus(
      "当前页面对应脚本：" +
        String(context.scriptLabel || script.label || context.scriptId) +
        "。需要调整配置时，请进入该脚本详情页。"
    );
  }

  async function render() {
    if (!storage || typeof storage.getSettings !== "function") {
      setPopupStatus("扩展存储不可用，无法读取脚本中心。");
      return;
    }

    const settings = await storage.getSettings();
    const activeTab = await getActiveTab();

    document.title = constants.EXTENSION_NAME || "标注脚本中心";
    getElement("extension-name").textContent = constants.EXTENSION_NAME || "标注脚本中心";
    getElement("stage-label").textContent = constants.STAGE_LABEL || "脚本中心";

    const baseContext = getDetectedContext(activeTab?.url || "", settings);
    const context =
      activeTab && typeof activeTab.id === "number"
        ? await enrichRuntimeStatus(activeTab, baseContext)
        : baseContext;

    renderContext(context);
  }

  document.addEventListener("DOMContentLoaded", async function () {
    getElement("open-script-settings").addEventListener("click", function () {
      if (currentDetectedScriptId) {
        openScriptCenter(currentDetectedScriptId);
      }
    });

    getElement("open-options").addEventListener("click", function () {
      openScriptCenter(null);
    });

    await render();
  });
})();
