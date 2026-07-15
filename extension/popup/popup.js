(function () {
  "use strict";

  const constants = globalThis.ASREdgeConstants || {};
  const storage = globalThis.ASREdgeStorage || null;
  const scriptLibrary = constants.SCRIPT_LIBRARY || {};
  const cvpcScriptId =
    constants.DATA_BAKER_CVPC_LIUZHOU_ASSISTANT_SCRIPT_ID || "dataBakerCvpcLiuzhouAssistant";
  const suzhouScriptId =
    constants.BYTEDANCE_AIDP_SUZHOU_HELPER_SCRIPT_ID || "bytedanceAidpSuzhouHelper";
  const jinhuaScriptId =
    constants.BYTEDANCE_AIDP_JINHUA_HELPER_SCRIPT_ID || "bytedanceAidpJinhuaHelper";
  const taizhouScriptId =
    constants.BYTEDANCE_AIDP_TAIZHOU_HELPER_SCRIPT_ID || "bytedanceAidpTaizhouHelper";
  const hangzhouScriptId =
    constants.MAGIC_DATA_HANGZHOU_SCRIPT_ID || "magicDataHangzhouAssistant";
  const cvpcHost = constants.DATA_BAKER_CVPC_PLATFORM?.host || "cvpc.databaker.com";
  const aidpHost = constants.BYTEDANCE_AIDP_PLATFORM?.host || "aidp.bytedance.com";
  const magicHost = constants.PLATFORM_LIBRARY?.magicData?.host || "work.magicdatatech.com";

  let currentDetectedScriptId = null;
  let lastRenderedSettings = null;
  let lastRenderedContext = null;
  let toggleInFlight = false;

  function getElement(id) {
    return document.getElementById(id);
  }

  function openScriptCenter(scriptId) {
    const suffix = scriptId ? "#/script/" + encodeURIComponent(scriptId) : "#/center";
    chrome.tabs.create({ url: chrome.runtime.getURL("options/options.html" + suffix) });
  }

  function getActiveTab() {
    return new Promise(function (resolve) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        resolve(Array.isArray(tabs) ? tabs[0] || null : null);
      });
    });
  }

  function getScriptConfig(settings, scriptId) {
    if (scriptId === cvpcScriptId) {
      return settings?.platforms?.dataBakerCvpc?.scripts?.liuzhouHelper || {};
    }
    if (scriptId === suzhouScriptId) {
      return settings?.platforms?.bytedanceAidp?.scripts?.suzhouHelper || {};
    }
    if (scriptId === jinhuaScriptId) {
      return settings?.platforms?.bytedanceAidp?.scripts?.jinhuaHelper || {};
    }
    if (scriptId === taizhouScriptId) {
      return settings?.platforms?.bytedanceAidp?.scripts?.taizhouHelper || {};
    }
    if (scriptId === hangzhouScriptId) {
      return settings?.platforms?.magicData?.scripts?.hangzhouHelper || {};
    }
    return {};
  }

  function getPlatformConfig(settings, scriptId) {
    if (scriptId === cvpcScriptId) return settings?.platforms?.dataBakerCvpc || {};
    if (scriptId === suzhouScriptId || scriptId === jinhuaScriptId || scriptId === taizhouScriptId) {
      return settings?.platforms?.bytedanceAidp || {};
    }
    if (scriptId === hangzhouScriptId) return settings?.platforms?.magicData || {};
    return {};
  }

  function isScriptEnabled(settings, scriptId) {
    const platform = getPlatformConfig(settings, scriptId);
    const script = getScriptConfig(settings, scriptId);
    return platform.enabled !== false && script.enabled !== false;
  }

  function resolveAidpScript(settings) {
    const platform = settings?.platforms?.bytedanceAidp || {};
    const active = String(platform.activeScriptId || "").trim();
    if (active === taizhouScriptId) return taizhouScriptId;
    if (active === jinhuaScriptId) return jinhuaScriptId;
    if (active === suzhouScriptId) return suzhouScriptId;
    const taizhouEnabled = platform.scripts?.taizhouHelper?.enabled === true;
    const jinhuaEnabled = platform.scripts?.jinhuaHelper?.enabled === true;
    return taizhouEnabled ? taizhouScriptId : jinhuaEnabled ? jinhuaScriptId : suzhouScriptId;
  }

  function getDetectedContext(rawUrl, settings) {
    let url;
    try {
      url = new URL(String(rawUrl || ""));
    } catch (_error) {
      return { title: "当前页面无法识别", description: "请打开受支持的标注平台页面。" };
    }

    if (url.hostname === cvpcHost) {
      return {
        scriptId: cvpcScriptId,
        description: url.pathname.includes("/app/editor/asr/")
          ? "运行状态：已支持"
          : "请进入 CVPC ASR 编辑器后使用柳州话脚本。",
      };
    }
    if (url.hostname === aidpHost) {
      const scriptId = resolveAidpScript(settings);
      const detailMatched = url.pathname.includes("/mark-v3/");
      const config = getScriptConfig(settings, scriptId);
      return {
        scriptId,
        description: !isScriptEnabled(settings, scriptId)
          ? "运行状态：未启用"
          : detailMatched && config.platformAiEnabled === false
            ? "运行状态：详情页命中（平台 AI 已隐藏）"
            : detailMatched
              ? "运行状态：已支持"
              : "请进入 AIDP 标注详情页后使用脚本。",
      };
    }
    if (url.hostname === magicHost) {
      return {
        scriptId: hangzhouScriptId,
        description: isScriptEnabled(settings, hangzhouScriptId)
          ? "运行状态：已支持"
          : "运行状态：未启用",
      };
    }
    return {
      title: "当前页面未命中脚本",
      description: "支持 DataBaker CVPC、ByteDance AIDP 与 Magic Data。",
    };
  }

  function setPopupStatus(message) {
    getElement("popup-status").textContent = String(message || "");
  }

  function setTogglePill(text, tone, disabled) {
    const element = getElement("detected-status-pill");
    element.textContent = text;
    element.className = "pill-toggle " + tone;
    element.disabled = Boolean(disabled);
  }

  function renderContext(context) {
    currentDetectedScriptId = context.scriptId || null;
    lastRenderedContext = context;
    const script = currentDetectedScriptId ? scriptLibrary[currentDetectedScriptId] || {} : {};
    getElement("detected-title").textContent = currentDetectedScriptId
      ? script.label || script.shortLabel || currentDetectedScriptId
      : context.title || "当前页面检测完成";
    getElement("detected-description").textContent = context.description || "";
    getElement("open-script-settings").disabled = !currentDetectedScriptId;
    const enabled = currentDetectedScriptId
      ? isScriptEnabled(lastRenderedSettings || {}, currentDetectedScriptId)
      : false;
    setTogglePill(
      toggleInFlight ? "切换中..." : currentDetectedScriptId ? (enabled ? "已启用" : "未启用") : "未命中脚本",
      toggleInFlight ? "pending" : enabled ? "enabled" : "disabled",
      toggleInFlight || !currentDetectedScriptId
    );
    setPopupStatus("");
  }

  async function render(settingsOverride) {
    if (!storage || typeof storage.getSettings !== "function") {
      setPopupStatus("扩展存储不可用，无法读取脚本中心。");
      return;
    }
    lastRenderedSettings = settingsOverride || (await storage.getSettings());
    const activeTab = await getActiveTab();
    document.title = constants.EXTENSION_NAME || "标注脚本中心";
    getElement("extension-name").textContent = constants.EXTENSION_NAME || "标注脚本中心";
    getElement("stage-label").textContent = constants.STAGE_LABEL || "脚本中心";
    renderContext(getDetectedContext(activeTab?.url || "", lastRenderedSettings));
  }

  async function handleToggleCurrentScript() {
    if (toggleInFlight || !currentDetectedScriptId) return;
    if (!storage || typeof storage.setScriptEnabled !== "function") {
      setPopupStatus("当前扩展版本不支持直接切换脚本启停。");
      return;
    }
    toggleInFlight = true;
    renderContext(lastRenderedContext || {});
    try {
      const nextSettings = await storage.setScriptEnabled(
        currentDetectedScriptId,
        !isScriptEnabled(lastRenderedSettings || {}, currentDetectedScriptId)
      );
      toggleInFlight = false;
      await render(nextSettings);
    } catch (error) {
      toggleInFlight = false;
      await render();
      setPopupStatus("切换脚本状态失败：" + (error?.message || String(error)));
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    getElement("stage-label").addEventListener("click", function () { openScriptCenter(null); });
    getElement("open-script-settings").addEventListener("click", function () {
      if (currentDetectedScriptId) openScriptCenter(currentDetectedScriptId);
    });
    getElement("detected-status-pill").addEventListener("click", function () {
      void handleToggleCurrentScript();
    });
    await render();
  });
})();
