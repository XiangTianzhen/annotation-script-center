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
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs > pixelMs || endMs < durationMs - pixelMs) {
      return result(false, "whole-segment-required", { segmentCount: 1 });
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
        if (typeof api.waitForRender === "function") await api.waitForRender();
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
    } catch (_error) {
      const partial = Array.from(api.getSegments?.() || []);
      return partial.length ? rollback("draw-failed", partial.length) : result(false, "draw-failed", { pageChanged: false, pageRestored: true });
    }
    if (typeof api.waitForRender === "function") await api.waitForRender();
    else await wait(180);
    const after = Array.from(api.getSegments?.() || []);
    if (after.length !== 1) {
      return after.length
        ? rollback("segment-count-verification-failed", after.length)
        : result(false, "segment-count-verification-failed", { segmentCount: 0, pageChanged: false, pageRestored: true });
    }
    const verified = verifyWholeSegment(api);
    if (!verified.ok) {
      return rollback("boundary-verification-failed", 1);
    }
    return result(true, "whole-segment-created", { segmentCount: 1, segment: verified.segment, pageChanged: true, pageRestored: false });
  }

  function dispatchPointer(target, type, x, y) {
    const mouseType = { pointerdown: "mousedown", pointermove: "mousemove", pointerup: "mouseup" }[type] || type;
    const EventClass = globalThis.MouseEvent;
    target.dispatchEvent(new EventClass(mouseType, {
      bubbles: true, cancelable: true, clientX: x, clientY: y,
      button: 0, buttons: type === "pointerup" ? 0 : 1,
    }));
  }

  function createDomAdapter(documentLike) {
    const doc = documentLike || globalThis.document;
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
        const waveform = getWaveform();
        const regions = Array.from(doc.querySelectorAll("region[data-id], .wavesurfer-region, [data-id^='wavesurfer_']"))
          .filter(visible);
        if (waveform && regions.length) {
          return regions.map((region) => {
            const rect = region.getBoundingClientRect();
            const width = waveform.rect.width || 1;
            const durationMs = this.getAudioDurationMs();
            return {
              startMs: Math.max(0, ((rect.left - waveform.rect.left) / width) * durationMs),
              endMs: Math.min(durationMs, ((rect.right - waveform.rect.left) / width) * durationMs),
            };
          });
        }
        return getRows().map((row) => ({
          startMs: numberAttr(row, ["startMs", "start", "timeStart", "hdTimeStart", "data-start-ms"]),
          endMs: numberAttr(row, ["endMs", "end", "timeEnd", "hdTimeEnd", "data-end-ms"]),
        }));
      },
      getAudioDurationMs() {
        const media = doc.querySelector("audio,video");
        if (Number.isFinite(media?.duration)) return media.duration * 1000;
        const text = Array.from(doc.querySelectorAll("body *")).map((node) => node.childElementCount ? "" : node.textContent).find((value) => /\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?S/i.test(value || ""));
        const match = String(text || "").match(/\/\s*(\d+(?:\.\d+)?)S/i);
        return match ? Number(match[1]) * 1000 : 0;
      },
      getWaveformWidth() { return getWaveform()?.rect.width || 0; },
      async activateDrawTool() {
        const tool = doc.querySelector(".center-tools .a-svg-icon-extent")?.closest?.(".tool-btn");
        if (!visible(tool)) throw new Error("draw-tool-unavailable");
        if (!tool.classList.contains("active")) tool.click();
      },
      async dragWholeWaveform() {
        const waveform = getWaveform();
        if (!waveform) throw new Error("waveform-unavailable");
        const rect = waveform.rect;
        const y = rect.top + rect.height / 2;
        const target = doc.elementFromPoint?.(rect.left + 1, y) || waveform.node;
        dispatchPointer(target, "pointerdown", rect.left + 1, y);
        dispatchPointer(target, "pointermove", rect.right - 1, y);
        dispatchPointer(target, "pointerup", rect.right - 1, y);
      },
      async rollbackWholeSegment() {
        const target = doc.activeElement || doc.body;
        const EventClass = globalThis.KeyboardEvent;
        if (!target || typeof EventClass !== "function") return;
        ["keydown", "keyup"].forEach((type) => target.dispatchEvent(new EventClass(type, {
          key: "Delete", code: "Delete", bubbles: true, cancelable: true,
        })));
        await wait(80);
      },
    };
  }

  const api = { createDomAdapter, createWholeSegment, verifyWholeSegment };
  globalThis.__ASREdgeShujiajiaWholeSegmentController = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
