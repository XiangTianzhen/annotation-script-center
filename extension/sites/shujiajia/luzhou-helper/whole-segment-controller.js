(function () {
  "use strict";

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function result(ok, code, extra) {
    return Object.assign({ ok, code }, extra || {});
  }

  function verifyWholeSegment(adapter) {
    const api = adapter || {};
    const segments = Array.from(api.getSegments?.() || []);
    if (segments.length !== 1) return result(false, "whole-segment-required", { segmentCount: segments.length });
    const durationMs = Number(api.getAudioDurationMs?.() || 0);
    const waveformWidth = Number(api.getWaveformWidth?.() || 0);
    if (!(durationMs > 0) || !(waveformWidth > 1)) return result(false, "waveform-unavailable", { segmentCount: 1 });
    const pixelMs = durationMs / waveformWidth;
    const segment = segments[0] || {};
    const startMs = Number(segment.startMs);
    const endMs = Number(segment.endMs);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return result(false, "segment-boundary-unavailable", { segmentCount: 1 });
    }
    if (startMs > pixelMs || endMs < durationMs - pixelMs) {
      return result(false, "segment-boundary-incomplete", { segmentCount: 1, segment });
    }
    return result(true, "whole-segment-ready", { segmentCount: 1, segment });
  }

  async function createWholeSegment(adapter) {
    const api = adapter || {};
    async function rollback(failureCode, segmentCount) {
      if (typeof api.rollbackWholeSegment !== "function") {
        return result(false, "rollback-unavailable", { failureCode, segmentCount, pageChanged: true, pageRestored: false });
      }
      try {
        await api.rollbackWholeSegment();
        if (typeof api.waitForSegmentCount === "function") await api.waitForSegmentCount(0);
        else if (typeof api.waitForRender === "function") await api.waitForRender();
        else await wait(100);
      } catch (_error) {
        return result(false, "rollback-failed", { failureCode, segmentCount, pageChanged: true, pageRestored: false });
      }
      const remaining = Array.from(api.getSegments?.() || []);
      return remaining.length === 0
        ? result(false, failureCode, { segmentCount, pageChanged: true, pageRestored: true })
        : result(false, "rollback-failed", { failureCode, segmentCount: remaining.length, pageChanged: true, pageRestored: false });
    }
    const before = Array.from(api.getSegments?.() || []);
    if (before.length) return result(false, "segments-exist", { segmentCount: before.length });
    const durationMs = Number(api.getAudioDurationMs?.() || 0);
    const waveformWidth = Number(api.getWaveformWidth?.() || 0);
    if (!(durationMs > 0) || !(waveformWidth > 1) || typeof api.dragWholeWaveform !== "function") {
      return result(false, "waveform-unavailable");
    }
    try {
      if (typeof api.activateDrawTool === "function") await api.activateDrawTool();
      await api.dragWholeWaveform();
    } catch (error) {
      const partial = Array.from(api.getSegments?.() || []);
      const reason = String(error?.message || "");
      const failureCode = ["trusted-input-unavailable", "trusted-input-timeout", "debugger-attach-failed", "debugger-drag-failed"].includes(reason)
        ? reason
        : "draw-failed";
      return partial.length ? rollback(failureCode, partial.length) : result(false, failureCode, { pageChanged: false, pageRestored: true });
    }
    if (typeof api.waitForSegmentCount === "function") await api.waitForSegmentCount(1);
    else if (typeof api.waitForRender === "function") await api.waitForRender();
    else await wait(180);
    const after = Array.from(api.getSegments?.() || []);
    if (after.length !== 1) {
      return after.length
        ? rollback("segment-count-verification-failed", after.length)
        : result(false, "draw-not-triggered", { segmentCount: 0, pageChanged: false, pageRestored: true });
    }
    const verified = verifyWholeSegment(api);
    if (!verified.ok) {
      return rollback(verified.code, 1);
    }
    return result(true, "whole-segment-created", { segmentCount: 1, segment: verified.segment, pageChanged: true, pageRestored: false });
  }

  function createDomAdapter(documentLike, options) {
    const doc = documentLike || globalThis.document;
    const trustedInput = options?.trustedInput;
    function visible(node) { return Boolean(node && !node.disabled && node.getClientRects?.().length); }
    function getRows() {
      return Array.from(doc.querySelectorAll("tbody tr")).filter((row) => row.querySelector("textarea[placeholder*='转写'], input[placeholder*='转写']"));
    }
    function numberAttr(row, names) {
      for (const name of names) {
        const value = Number(row.getAttribute?.(name) ?? row.dataset?.[name]);
        if (Number.isFinite(value)) return value;
      }
      return NaN;
    }
    function getPageText() {
      return Array.from(doc.querySelectorAll("body *"))
        .map((node) => String(node.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
    }
    function getSelectedBoundary() {
      for (const text of getPageText()) {
        const match = text.match(/段落\s*[:：]\s*\d+.*?区域\s*[:：]\s*[\[【［]\s*(\d+(?:\.\d+)?)(?:\s*[,，]\s*|\s+)(\d+(?:\.\d+)?)\s*[\]】］]/i);
        if (match) return { startMs: Number(match[1]) * 1000, endMs: Number(match[2]) * 1000 };
      }
      return null;
    }
    function getWaveform() {
      const exact = doc.querySelector(".audio-peaks .waveform");
      if (visible(exact)) return { node: exact, rect: exact.getBoundingClientRect() };
      const candidates = Array.from(doc.querySelectorAll("[class*='wave'], canvas"))
        .filter(visible)
        .map((node) => ({ node, rect: node.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 250 && rect.height > 24)
        .sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height);
      return candidates[0] || null;
    }
    return {
      getSegments() {
        const rows = getRows();
        const segments = rows.map((row) => ({
          startMs: numberAttr(row, ["startMs", "start", "timeStart", "hdTimeStart", "data-start-ms"]),
          endMs: numberAttr(row, ["endMs", "end", "timeEnd", "hdTimeEnd", "data-end-ms"]),
        }));
        const selected = getSelectedBoundary();
        if (segments.length === 1 && selected) segments[0] = selected;
        return segments;
      },
      getAudioDurationMs() {
        const media = doc.querySelector("audio,video");
        if (Number.isFinite(media?.duration)) return media.duration * 1000;
        const text = getPageText().find((value) => /\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?S/i.test(value || ""));
        const match = String(text || "").match(/\/\s*(\d+(?:\.\d+)?)S/i);
        return match ? Number(match[1]) * 1000 : 0;
      },
      getWaveformWidth() { return getWaveform()?.rect.width || 0; },
      async dragWholeWaveform() {
        if (typeof trustedInput !== "function") throw new Error("trusted-input-unavailable");
        const waveform = getWaveform();
        if (!waveform) throw new Error("waveform-unavailable");
        const rect = waveform.rect;
        const y = rect.top + rect.height / 2;
        const response = await trustedInput({ action: "shift-drag", startX: rect.left + 1, startY: y, endX: rect.right - 1, endY: y });
        if (response?.ok !== true) throw new Error(String(response?.reason || "trusted-drag-failed"));
      },
      async rollbackWholeSegment() {
        if (typeof trustedInput !== "function") throw new Error("trusted-input-unavailable");
        const response = await trustedInput({ action: "delete" });
        if (response?.ok !== true) throw new Error(String(response?.reason || "trusted-delete-failed"));
      },
      async waitForSegmentCount(expected) {
        const deadline = Date.now() + 2000;
        while (Date.now() < deadline) {
          if (getRows().length === expected && (expected !== 1 || getSelectedBoundary())) return true;
          await wait(50);
        }
        return false;
      },
    };
  }

  const api = { createDomAdapter, createWholeSegment, verifyWholeSegment };
  globalThis.__ASREdgeShujiajiaWholeSegmentController = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
