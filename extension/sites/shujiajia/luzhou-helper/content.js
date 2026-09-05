(function () {
  "use strict";

  const SOURCE = "asc-shujiajia-luzhou";
  const AUDIO_READY = "ASC_SHUJIAJIA_AUDIO_READY";
  const AUDIO_STATUS = "ASC_SHUJIAJIA_AUDIO_STATUS";
  const CONTEXT_READY = "ASC_SHUJIAJIA_CONTEXT_READY";
  const TEMP_SAVE_SUCCEEDED = "ASC_SHUJIAJIA_TEMP_SAVE_SUCCEEDED";
  const REQUEST_AUDIO = "ASC_SHUJIAJIA_REQUEST_AUDIO";
  const DIRTY_CHANGED = "ASC_SHUJIAJIA_DIRTY_CHANGED";
  const OBSERVER_ENABLE = "ASC_SHUJIAJIA_OBSERVER_ENABLE";
  const OBSERVER_DISABLE = "ASC_SHUJIAJIA_OBSERVER_DISABLE";
  const SAVE_INTENT = "ASC_SHUJIAJIA_SAVE_INTENT";
  const TRUSTED_INPUT_REQUEST = "ASC_SHUJIAJIA_TRUSTED_INPUT_REQUEST";
  const TRUSTED_INPUT_RESPONSE = "ASC_SHUJIAJIA_TRUSTED_INPUT_RESPONSE";
  const BACKGROUND_TRUSTED_INPUT = "ASR_EDGE_SHUJIAJIA_TRUSTED_INPUT";

  function isSupportedMarkPageUrl(rawUrl) {
    try {
      const url = new URL(String(rawUrl || ""));
      return url.protocol === "https:" &&
        url.hostname === "www.shujiajia.com" &&
        url.pathname === "/workbench/piece/mark.html" &&
        String(url.searchParams.get("taskId") || "").trim() !== "" &&
        url.searchParams.get("executeClass") === "TAG_PIECE";
    } catch (_error) {
      return false;
    }
  }

  function waitForDelay(delayMs, options) {
    const config = options || {};
    const signal = config.signal;
    if (signal?.aborted) return Promise.resolve(false);
    const setTimer = config.setTimeout || globalThis.setTimeout;
    const clearTimer = config.clearTimeout || globalThis.clearTimeout;
    return new Promise((resolve) => {
      let settled = false;
      let timer = null;
      function finish(value) {
        if (settled) return;
        settled = true;
        signal?.removeEventListener?.("abort", onAbort);
        resolve(value);
      }
      function onAbort() {
        if (timer !== null) clearTimer(timer);
        finish(false);
      }
      signal?.addEventListener?.("abort", onAbort, { once: true });
      timer = setTimer(() => finish(true), Number(delayMs) || 0);
    });
  }

  function formatDelaySeconds(delayMs) {
    return String(Number((Number(delayMs) / 1000).toFixed(1)));
  }

  function settleObserverBeforeBoot(settings, windowLike) {
    const script = settings?.platforms?.shujiajia?.scripts?.luzhouHelper;
    const enabled = settings?.platforms?.shujiajia?.enabled === true && script?.enabled === true;
    if (!enabled) {
      windowLike?.postMessage?.(
        { source: SOURCE, type: OBSERVER_DISABLE, payload: {} },
        windowLike?.location?.origin || "*"
      );
    }
    return enabled;
  }

  function buildTopTrustedInputMessage(event, documentLike) {
    const data = event?.data;
    const payload = data?.payload;
    const frame = documentLike?.querySelector?.("#bdIframe");
    if (
      data?.source !== SOURCE ||
      data?.type !== TRUSTED_INPUT_REQUEST ||
      !payload?.requestId ||
      !frame ||
      event?.source !== frame.contentWindow
    ) return null;
    const action = String(payload.action || "");
    if (action !== "shift-drag") return null;
    const rect = frame.getBoundingClientRect?.();
    const values = [payload.startX, payload.startY, payload.endX, payload.endY].map(Number);
    if (!rect || values.some((value) => !Number.isFinite(value))) return null;
    const [startX, startY, endX, endY] = values;
    if (startX < 0 || startY < 0 || endX <= startX || endY < 0 || endX > rect.width || startY > rect.height || endY > rect.height) return null;
    return {
      type: BACKGROUND_TRUSTED_INPUT,
      action,
      startX: rect.left + startX,
      startY: rect.top + startY,
      endX: rect.left + endX,
      endY: rect.top + endY,
    };
  }

  function formatWholeSegmentFailure(code) {
    const messages = {
      "trusted-input-unavailable": "浏览器可信拖拽不可用，请重新加载扩展后重试",
      "trusted-input-timeout": "浏览器可信拖拽等待超时，请刷新页面后重试",
      "debugger-attach-failed": "浏览器可信拖拽不可用，可能正被开发者工具占用",
      "debugger-drag-failed": "可信拖拽执行失败，请刷新页面后重试",
      "draw-not-triggered": "平台未生成段落，请刷新页面后重试",
      "segment-boundary-unavailable": "已生成段落，但暂时读取不到边界，请人工检查",
      "segment-boundary-incomplete": "新段落未覆盖完整音频，已保留段落，请人工检查",
      "segment-count-verification-failed": "平台生成了多个段落，已保留段落，请人工检查",
      "waveform-unavailable": "未找到可用波形或音频时长，请刷新页面后重试",
    };
    return messages[String(code || "")] || "整段划分未通过验证，请人工处理";
  }

  function formatAudioStatus(code) {
    const messages = {
      "identity-unavailable": "未取得当前条目身份，请刷新页面后重试",
      "source-invalid": "当前条目音频地址无效，请刷新页面后重试",
      "download-failed": "当前条目音频下载失败，请刷新页面后重试",
      "unsupported-audio": "当前条目音频格式不受支持",
      "audio-too-large": "当前条目音频超过 10MB，无法识别",
    };
    return messages[String(code || "")] || "尚未捕获当前条目音频，请刷新页面后重试";
  }

  function createRuntime(options) {
    const config = options || {};
    const windowLike = config.window || globalThis.window;
    const documentLike = config.document || globalThis.document;
    const dataApi = config.dataApi || globalThis.__ASREdgeShujiajiaDataApi || {};
    const segmentController = config.segmentController || globalThis.__ASREdgeShujiajiaWholeSegmentController || {};
    const aiClient = config.aiClient || globalThis.__ASREdgeShujiajiaAiRecommendation || {};
    const panel = config.panel || globalThis.__ASREdgeShujiajiaUiPanel?.createPanel?.({ document: documentLike }) || {};
    const shortcuts = config.shortcuts || globalThis.__ASREdgeShujiajiaShortcuts || {};
    const runtimeApi = config.runtimeApi || globalThis.chrome?.runtime;
    const state = {
      audioDataUrl: "", audioContextId: "", audioStatusCode: "", contextId: "",
      dirty: false, dirtyToken: "", result: null, resultContextId: "", error: null, settings: config.settings || null,
      pendingAutoRecognitionContextId: "",
      autoRecognitionStartedContextId: "",
    };
    let shortcutRuntime = null;
    let mountTimer = null;
    let storageChangeListener = null;
    let recognitionSerial = 0;
    let activeRecognition = null;
    let pendingAutoDrawAbortController = null;
    const pendingTrustedInputs = new Map();
    const attemptedAutoDrawContexts = new Set();

    function message(text) { panel.setMessage?.(text); }
    function origin() { return windowLike?.location?.origin || "*"; }
    function isEditorRuntime() { return Boolean(windowLike?.top && windowLike.top !== windowLike); }
    function hasSupportedOuterPage() { return isSupportedMarkPageUrl(documentLike?.referrer); }
    function postLocal(data) { windowLike?.postMessage?.(data, origin()); }
    function postTop(data) { (windowLike?.top || windowLike)?.postMessage?.(data, origin()); }
    function relayToFrames(data) {
      if (windowLike?.top !== windowLike) return;
      Array.from(documentLike?.querySelectorAll?.("iframe") || []).forEach((frame) => {
        try { frame.contentWindow?.postMessage?.(data, origin()); } catch (_error) {}
      });
    }
    function sendRuntimeMessage(message) {
      if (typeof runtimeApi?.sendMessage !== "function") return Promise.resolve({ ok: false, reason: "trusted-input-unavailable" });
      try { return Promise.resolve(runtimeApi.sendMessage(message)); }
      catch (_error) { return Promise.resolve({ ok: false, reason: "trusted-input-unavailable" }); }
    }
    function normalizeTrustedInputResponse(response) {
      const value = response?.result && typeof response.result === "object" ? response.result : response;
      return value?.ok === true ? { ok: true } : { ok: false, reason: String(value?.reason || "trusted-input-failed") };
    }
    function requestTrustedInput(payload) {
      if (windowLike?.top === windowLike) return sendRuntimeMessage({ type: BACKGROUND_TRUSTED_INPUT, ...payload }).then(normalizeTrustedInputResponse);
      const requestId = globalThis.crypto?.randomUUID?.() || String(Date.now()) + "-" + Math.random().toString(36).slice(2);
      return new Promise((resolve) => {
        const timer = (windowLike?.setTimeout || globalThis.setTimeout)(() => {
          pendingTrustedInputs.delete(requestId);
          resolve({ ok: false, reason: "trusted-input-timeout" });
        }, 5000);
        pendingTrustedInputs.set(requestId, { resolve, timer });
        postTop({ source: SOURCE, type: TRUSTED_INPUT_REQUEST, payload: { ...payload, requestId } });
      });
    }
    const trustedInput = config.trustedInput || requestTrustedInput;
    function newDirtyToken() {
      return globalThis.crypto?.randomUUID?.() || String(Date.now()) + "-" + Math.random().toString(36).slice(2);
    }
    function applyDirty(payload) {
      if (!payload || typeof payload.dirty !== "boolean") return;
      if (state.contextId && payload.contextId && payload.contextId !== state.contextId) return;
      state.dirty = payload.dirty;
      state.dirtyToken = payload.dirty ? String(payload.dirtyToken || "") : "";
    }
    function setDirty(dirty) {
      const payload = { dirty: Boolean(dirty), contextId: state.contextId, dirtyToken: dirty ? newDirtyToken() : "" };
      applyDirty(payload);
      const data = { source: SOURCE, type: DIRTY_CHANGED, payload };
      postTop(data);
      if (windowLike?.top === windowLike) relayToFrames(data);
    }
    function cancelPendingAutomation() {
      state.pendingAutoRecognitionContextId = "";
      state.autoRecognitionStartedContextId = "";
      pendingAutoDrawAbortController?.abort?.();
      pendingAutoDrawAbortController = null;
    }
    async function refreshSettings(requireAi) {
      let root = null;
      if (typeof globalThis.ASREdgeStorage?.getSettings === "function") {
        try { root = await globalThis.ASREdgeStorage.getSettings(); } catch (_error) { root = null; }
      }
      if (root) {
        const next = root.platforms?.shujiajia?.scripts?.luzhouHelper;
        if (root.platforms?.shujiajia?.enabled !== true || next?.enabled !== true) {
          postLocal({ source: SOURCE, type: OBSERVER_DISABLE, payload: {} });
          message("数加加泸州话助手已关闭");
          return null;
        }
        state.settings = next;
      } else if (state.settings?.enabled !== true) {
        message("数加加泸州话助手已关闭");
        return null;
      }
      if (requireAi && state.settings?.aiRecommendEnabled !== true) {
        message("请先在 Options 中启用泸州方言识别");
        return null;
      }
      return state.settings;
    }
    async function runPendingAutoRecognition(contextId) {
      const expectedContextId = String(contextId || "");
      if (
        !expectedContextId ||
        state.contextId !== expectedContextId ||
        state.pendingAutoRecognitionContextId !== expectedContextId ||
        state.autoRecognitionStartedContextId === expectedContextId ||
        state.settings?.autoRecognizeAfterWholeSegmentEnabled !== true ||
        state.audioContextId !== expectedContextId ||
        !state.audioDataUrl
      ) return false;
      state.pendingAutoRecognitionContextId = "";
      state.autoRecognitionStartedContextId = expectedContextId;
      await actions.recognizeWhole();
      return true;
    }
    function queueAutoRecognition(contextId) {
      const expectedContextId = String(contextId || "");
      if (
        !expectedContextId ||
        state.contextId !== expectedContextId ||
        state.settings?.autoRecognizeAfterWholeSegmentEnabled !== true ||
        state.autoRecognitionStartedContextId === expectedContextId
      ) return false;
      state.pendingAutoRecognitionContextId = expectedContextId;
      if (state.audioContextId === expectedContextId && state.audioDataUrl) {
        void runPendingAutoRecognition(expectedContextId);
      } else {
        message("已划为一整段，等待当前音频后自动识别");
      }
      return true;
    }
    async function autoDrawNewContext(contextId) {
      const expectedContextId = String(contextId || "");
      if (!isEditorRuntime() || !hasSupportedOuterPage() || !expectedContextId || state.contextId !== expectedContextId) return false;
      if (attemptedAutoDrawContexts.has(expectedContextId)) return false;
      const currentSettings = await refreshSettings(false);
      if (
        !currentSettings ||
        currentSettings.autoCreateWholeSegmentOnNewItemEnabled !== true ||
        !hasSupportedOuterPage() ||
        state.contextId !== expectedContextId
      ) return false;
      attemptedAutoDrawContexts.add(expectedContextId);
      const rawDelay = currentSettings.autoCreateWholeSegmentDelayMs;
      const configuredDelay = Number(rawDelay);
      const delayMs = rawDelay !== null && rawDelay !== "" && configuredDelay >= 0 && configuredDelay <= 50000 ? configuredDelay : 500;
      const AbortControllerType = config.AbortController || globalThis.AbortController;
      const abortController = typeof AbortControllerType === "function" ? new AbortControllerType() : null;
      pendingAutoDrawAbortController?.abort?.();
      pendingAutoDrawAbortController = abortController;
      try {
        message(`将在 ${formatDelaySeconds(delayMs)} 秒后自动划段`);
        const delay = config.waitForDelay || waitForDelay;
        const elapsed = await delay(delayMs, { signal: abortController?.signal });
        if (!elapsed || state.contextId !== expectedContextId || abortController?.signal?.aborted || !hasSupportedOuterPage()) return false;
        const latestSettings = await refreshSettings(false);
        if (!latestSettings || latestSettings.autoCreateWholeSegmentOnNewItemEnabled !== true || state.contextId !== expectedContextId || !hasSupportedOuterPage()) return false;
        await actions.createWholeSegment();
        return true;
      } finally {
        if (pendingAutoDrawAbortController === abortController) pendingAutoDrawAbortController = null;
      }
    }
    function onMessage(event) {
      if (event?.origin && event.origin !== origin()) return;
      const data = event?.data;
      if (!data || data.source !== SOURCE) return;
      if (data.type === CONTEXT_READY && data.payload?.contextId) {
        const next = String(data.payload.contextId);
        const changed = state.contextId !== next;
        if (changed) state.audioStatusCode = "";
        if (state.contextId && state.contextId !== next) {
          state.audioDataUrl = "";
          state.audioContextId = "";
          state.result = null;
          state.resultContextId = "";
          state.error = null;
          state.dirty = false;
          state.dirtyToken = "";
          cancelPendingAutomation();
          panel.setResult?.(null);
          panel.setError?.(null);
        }
        state.contextId = next;
        if (changed) postLocal({ source: SOURCE, type: CONTEXT_READY, payload: { contextId: next } });
        if (changed && windowLike?.top && windowLike.top !== windowLike) postTop({ source: SOURCE, type: REQUEST_AUDIO, payload: { contextId: next } });
        if (changed && windowLike?.top === windowLike) relayToFrames(data);
        if (changed) {
          void autoDrawNewContext(next);
        }
      } else if (data.type === AUDIO_READY && /^data:audio\//i.test(String(data.payload?.audioDataUrl || ""))) {
        if (!state.contextId || String(data.payload?.contextId || "") !== state.contextId) return;
        state.audioDataUrl = String(data.payload.audioDataUrl);
        state.audioContextId = state.contextId;
        state.audioStatusCode = "";
        message("已捕获当前音频，可开始识别");
        if (windowLike?.top === windowLike) relayToFrames(data);
        void runPendingAutoRecognition(state.contextId);
      } else if (data.type === AUDIO_STATUS) {
        const statusContextId = String(data.payload?.contextId || "");
        if (statusContextId && state.contextId && statusContextId !== state.contextId) return;
        const code = String(data.payload?.code || "");
        if (!Object.prototype.hasOwnProperty.call({ "identity-unavailable": 1, "source-invalid": 1, "download-failed": 1, "unsupported-audio": 1, "audio-too-large": 1 }, code)) return;
        state.audioStatusCode = code;
        if (!statusContextId || statusContextId === state.contextId) state.pendingAutoRecognitionContextId = "";
        message(formatAudioStatus(code));
        if (windowLike?.top === windowLike) relayToFrames({ source: SOURCE, type: AUDIO_STATUS, payload: { contextId: statusContextId, code } });
      } else if (data.type === DIRTY_CHANGED) {
        applyDirty(data.payload);
        if (windowLike?.top === windowLike && event.source !== windowLike) relayToFrames(data);
      } else if (data.type === TEMP_SAVE_SUCCEEDED && data.payload?.ok === true) {
        if (data.payload.contextId !== state.contextId || data.payload.dirtyToken !== state.dirtyToken) return;
        setDirty(false);
        message("暂存成功");
        if (windowLike?.top === windowLike) relayToFrames(data);
      } else if (data.type === REQUEST_AUDIO && event.source?.postMessage) {
        if (state.contextId) event.source.postMessage({ source: SOURCE, type: CONTEXT_READY, payload: { contextId: state.contextId } }, origin());
        if (state.audioDataUrl && (!data.payload?.contextId || data.payload.contextId === state.contextId)) {
          event.source.postMessage({ source: SOURCE, type: AUDIO_READY, payload: { contextId: state.contextId, audioDataUrl: state.audioDataUrl } }, origin());
        } else if (state.audioStatusCode && (!data.payload?.contextId || data.payload.contextId === state.contextId)) {
          event.source.postMessage({ source: SOURCE, type: AUDIO_STATUS, payload: { contextId: state.contextId, code: state.audioStatusCode } }, origin());
        }
      } else if (data.type === TRUSTED_INPUT_REQUEST && windowLike?.top === windowLike && event.source?.postMessage) {
        const request = buildTopTrustedInputMessage(event, documentLike);
        if (!request) return;
        const requestId = String(data.payload.requestId);
        void sendRuntimeMessage(request).then(normalizeTrustedInputResponse).then((response) => {
          event.source.postMessage({ source: SOURCE, type: TRUSTED_INPUT_RESPONSE, payload: { requestId, ...response } }, origin());
        });
      } else if (data.type === TRUSTED_INPUT_RESPONSE && data.payload?.requestId) {
        const requestId = String(data.payload.requestId);
        const pending = pendingTrustedInputs.get(requestId);
        if (!pending) return;
        pendingTrustedInputs.delete(requestId);
        (windowLike?.clearTimeout || globalThis.clearTimeout)(pending.timer);
        pending.resolve(normalizeTrustedInputResponse(data.payload));
      }
    }

    const actions = {
      async togglePlayPause() {
        if (!await refreshSettings(false)) return { ok: false, code: "script-disabled" };
        return dataApi.togglePlayPause?.(documentLike) || { ok: false };
      },
      async createWholeSegment() {
        if (!await refreshSettings(false)) return { ok: false, code: "script-disabled" };
        const actionContextId = state.contextId;
        message("正在划分整段…");
        const previousDirty = state.dirty;
        const adapter = config.segmentAdapter || segmentController.createDomAdapter?.(documentLike, { trustedInput });
        const result = await segmentController.createWholeSegment?.(adapter || {}) || { ok: false, code: "controller-unavailable", pageChanged: false };
        if (actionContextId && state.contextId !== actionContextId) {
          return { ok: false, code: "stale-whole-segment-result", pageChanged: Boolean(result.pageChanged) };
        }
        if (result.ok) {
          setDirty(true);
          message("已划为一整段，待暂存");
          queueAutoRecognition(actionContextId);
        } else if (result.pageChanged) {
          setDirty(true);
          message(formatWholeSegmentFailure(result.code));
        } else {
          if (!previousDirty) setDirty(false);
          message(result.code === "segments-exist" ? "已有段落，未执行任何修改" : formatWholeSegmentFailure(result.code));
        }
        return result;
      },
      async recognizeWhole() {
        const currentSettings = await refreshSettings(true);
        if (!currentSettings) return { ok: false, code: "ai-disabled" };
        if (!state.contextId || state.audioContextId !== state.contextId || !state.audioDataUrl) {
          message(formatAudioStatus(state.audioStatusCode));
          return { ok: false, code: "audio-not-captured" };
        }
        const recognitionContextId = state.contextId;
        if (activeRecognition?.contextId === recognitionContextId) {
          message("当前条目正在识别，请稍候");
          return { ok: false, code: "recognition-in-progress" };
        }
        const recognitionToken = ++recognitionSerial;
        activeRecognition = { contextId: recognitionContextId, token: recognitionToken };
        message("正在识别当前音频…");
        try {
          const result = await aiClient.recognize({ audioDataUrl: state.audioDataUrl, requestId: globalThis.crypto?.randomUUID?.() || String(Date.now()), settings: currentSettings });
          if (state.contextId !== recognitionContextId || activeRecognition?.token !== recognitionToken) {
            message("识别期间已切换条目，旧结果已丢弃");
            return { ok: false, code: "stale-recognition-result" };
          }
          state.result = result;
          state.resultContextId = recognitionContextId;
          state.error = null;
          panel.setResult?.(result);
          panel.setError?.(null);
          const latestSettings = await refreshSettings(false);
          if (latestSettings?.aiRecommendAutoFillEnabled === true) {
            const fillResult = await actions.fillRecognition({ requireAutoFillEnabled: true, automatic: true });
            return { ok: true, result, fillResult };
          }
          message("识别完成，请确认后填入");
          return { ok: true, result };
        } catch (error) {
          const errorPayload = error?.payload && typeof error.payload === "object"
            ? error.payload
            : {
                success: false,
                code: error?.code || "recognition-failed",
                message: String(error?.message || "识别失败"),
                requestId: error?.requestId || "",
              };
          state.error = errorPayload;
          panel.setError?.(errorPayload);
          message(String(error?.message || "识别失败"));
          return { ok: false, code: error?.code || "recognition-failed", requestId: error?.requestId || "" };
        } finally {
          if (activeRecognition?.token === recognitionToken) activeRecognition = null;
        }
      },
      async fillRecognition(options) {
        const latestSettings = await refreshSettings(false);
        if (!latestSettings) return { ok: false, code: "script-disabled" };
        if (options?.requireAutoFillEnabled === true && latestSettings.aiRecommendAutoFillEnabled !== true) {
          message("识别完成，请确认后填入");
          return { ok: false, code: "auto-fill-disabled" };
        }
        const text = String(state.result?.dialectText || state.result?.refinedText || "");
        if (!text) { message("没有可填入的识别结果"); return { ok: false, code: "empty-result" }; }
        if (state.contextId && state.resultContextId !== state.contextId) {
          message("识别结果不属于当前条目，请重新识别");
          return { ok: false, code: "stale-recognition-result" };
        }
        const automatic = options?.automatic === true;
        const input = automatic
          ? dataApi.findSingleTranscriptInput?.(documentLike)
          : dataApi.findSelectedTranscriptInput?.(documentLike);
        if (!input) {
          const code = automatic ? "auto-fill-single-segment-required" : "selected-transcript-required";
          message(automatic ? "当前段数不是 1，未自动填入" : "请先选择唯一段落后再填入");
          return { ok: false, code };
        }
        const result = dataApi.fillTranscript?.({ input, text, state }) || { ok: false };
        if (result.ok) setDirty(true);
        message(result.ok ? "已填入转写，待暂存" : "当前段落转写框不可编辑");
        return result;
      },
      async insertOverlapStart() {
        if (!await refreshSettings(false)) return { ok: false, code: "script-disabled" };
        const result = dataApi.clickOverlapSymbol?.("[OVERLAP/]", documentLike) || { ok: false, code: "symbol-control-not-found" };
        if (result.ok) setDirty(true);
        message(result.ok ? "已插入 [OVERLAP/]，待暂存" : "未找到唯一可用的 [OVERLAP/] 原生选项");
        return result;
      },
      async insertOverlapEnd() {
        if (!await refreshSettings(false)) return { ok: false, code: "script-disabled" };
        const result = dataApi.clickOverlapSymbol?.("[/OVERLAP]", documentLike) || { ok: false, code: "symbol-control-not-found" };
        if (result.ok) setDirty(true);
        message(result.ok ? "已插入 [/OVERLAP]，待暂存" : "未找到唯一可用的 [/OVERLAP] 原生选项");
        return result;
      },
      async markEffective() {
        if (!await refreshSettings(false)) return { ok: false, code: "script-disabled" };
        const result = dataApi.markValidity?.(true, documentLike) || { ok: false };
        if (result.ok) { setDirty(true); message("已设为有效，待暂存"); }
        return result;
      },
      async markIneffective() {
        if (!await refreshSettings(false)) return { ok: false, code: "script-disabled" };
        const result = dataApi.markValidity?.(false, documentLike) || { ok: false };
        if (result.ok) { setDirty(true); message("已设为无效，待暂存"); }
        return result;
      },
      async temporarySave() {
        if (!await refreshSettings(false)) return { ok: false, code: "script-disabled" };
        if (!state.dirty || !state.contextId || !state.dirtyToken) {
          message(state.dirty ? "尚未取得当前条目身份，请刷新页面后重试" : "当前没有扩展产生的待暂存修改");
          return { ok: false, code: state.dirty ? "context-unavailable" : "nothing-to-save" };
        }
        const intent = { source: SOURCE, type: SAVE_INTENT, payload: { contextId: state.contextId, dirtyToken: state.dirtyToken } };
        postTop(intent);
        const result = dataApi.temporarySave?.(documentLike) || { ok: false };
        if (!result.ok) postTop({ source: SOURCE, type: SAVE_INTENT, payload: { cancel: true, contextId: state.contextId, dirtyToken: state.dirtyToken } });
        message(result.ok ? "已触发平台暂存，等待成功响应" : "未找到唯一可用的暂存按钮");
        return result;
      },
      async submitNext() {
        if (!await refreshSettings(false)) return { ok: false, code: "script-disabled" };
        const result = dataApi.submitFromPage?.(state, documentLike) || { ok: false };
        if (!result.ok && result.code === "temporary-save-required") message("请先暂存扩展产生的修改");
        return result;
      },
    };

    async function start() {
      if (!state.settings) {
        const root = await globalThis.ASREdgeStorage?.getSettings?.() || {};
        state.settings = root.platforms?.shujiajia?.scripts?.luzhouHelper || {};
      }
      windowLike?.addEventListener?.("message", onMessage);
      postLocal({ source: SOURCE, type: OBSERVER_ENABLE, payload: {} });
      let mountAttempts = 0;
      if (!panel.ensureMounted?.() && typeof windowLike?.setInterval === "function") {
        mountTimer = windowLike.setInterval(() => {
          mountAttempts += 1;
          if (panel.ensureMounted?.() || mountAttempts >= 60) { windowLike.clearInterval?.(mountTimer); mountTimer = null; }
        }, 250);
      }
      panel.setActions?.(actions);
      shortcutRuntime = shortcuts.createRuntime?.({ target: documentLike, shortcuts: state.settings.shortcuts || {}, actions });
      shortcutRuntime?.start?.();
      const storageChanged = globalThis.chrome?.storage?.onChanged;
      if (storageChanged?.addListener) {
        storageChangeListener = async function (_changes, areaName) {
          if (areaName && areaName !== "local") return;
          let root = null;
          try { root = await globalThis.ASREdgeStorage?.getSettings?.(); } catch (_error) {}
          const next = root?.platforms?.shujiajia?.scripts?.luzhouHelper;
          if (root?.platforms?.shujiajia?.enabled === true && next?.enabled === true) {
            state.settings = next;
            if (next.autoRecognizeAfterWholeSegmentEnabled !== true) state.pendingAutoRecognitionContextId = "";
            if (next.autoCreateWholeSegmentOnNewItemEnabled !== true) {
              pendingAutoDrawAbortController?.abort?.();
              pendingAutoDrawAbortController = null;
            }
            postLocal({ source: SOURCE, type: OBSERVER_ENABLE, payload: {} });
          } else {
            state.settings = { ...(next || {}), enabled: false };
            cancelPendingAutomation();
            postLocal({ source: SOURCE, type: OBSERVER_DISABLE, payload: {} });
          }
        };
        storageChanged.addListener(storageChangeListener);
      }
      if (windowLike?.top && windowLike.top !== windowLike) postTop({ source: SOURCE, type: REQUEST_AUDIO, payload: { contextId: state.contextId } });
      return true;
    }
    function stop() {
      if (mountTimer !== null) windowLike?.clearInterval?.(mountTimer);
      mountTimer = null;
      shortcutRuntime?.stop?.();
      if (storageChangeListener) globalThis.chrome?.storage?.onChanged?.removeListener?.(storageChangeListener);
      storageChangeListener = null;
      pendingTrustedInputs.forEach((pending) => {
        (windowLike?.clearTimeout || globalThis.clearTimeout)(pending.timer);
        pending.resolve({ ok: false, reason: "trusted-input-cancelled" });
      });
      pendingTrustedInputs.clear();
      pendingAutoDrawAbortController?.abort?.();
      pendingAutoDrawAbortController = null;
      attemptedAutoDrawContexts.clear();
      panel.remove?.();
      postLocal({ source: SOURCE, type: OBSERVER_DISABLE, payload: {} });
      windowLike?.removeEventListener?.("message", onMessage);
    }
    function setRecognitionResult(result) { state.result = result || null; state.resultContextId = result ? state.contextId : ""; panel.setResult?.(state.result); }
    function getState() { return Object.assign({}, state); }
    return { actions, getState, setRecognitionResult, start, stop };
  }

  const api = { buildTopTrustedInputMessage, createRuntime, formatAudioStatus, formatWholeSegmentFailure, isSupportedMarkPageUrl, settleObserverBeforeBoot, waitForDelay, constants: { SOURCE, AUDIO_READY, AUDIO_STATUS, CONTEXT_READY, TEMP_SAVE_SUCCEEDED, REQUEST_AUDIO, DIRTY_CHANGED, OBSERVER_ENABLE, OBSERVER_DISABLE, SAVE_INTENT, TRUSTED_INPUT_REQUEST, TRUSTED_INPUT_RESPONSE, BACKGROUND_TRUSTED_INPUT } };
  globalThis.__ASREdgeShujiajiaContent = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  if (typeof window !== "undefined" && /(^|\.)shujiajia\.com$/i.test(String(location.hostname || ""))) {
    const boot = async function () {
      let settings = null;
      try { settings = await globalThis.ASREdgeStorage?.getSettings?.(); } catch (_error) { settings = null; }
      const script = settings?.platforms?.shujiajia?.scripts?.luzhouHelper;
      if (!settleObserverBeforeBoot(settings, window)) return;
      const runtime = createRuntime({ settings: script });
      await runtime.start();
      globalThis.__ASREdgeShujiajiaLuzhouRuntime = runtime;
    };
    void boot();
  }
})();
