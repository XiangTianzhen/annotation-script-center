(function () {
  const LOG_PREFIX = "[ASR Edge][legacy-leaderboard]";
  const PANEL_ID = "asr-edge-legacy-leaderboard";
  const legacyApiClient = window.__ASREdgeAlibabaLabelxLegacyApiClient;

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) {
      return panel;
    }

    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.cssText = [
      "position: fixed",
      "top: 72px",
      "right: 18px",
      "z-index: 2147483647",
      "width: 320px",
      "max-height: 70vh",
      "overflow: hidden",
      "border-radius: 14px",
      "background: rgba(255,255,255,0.98)",
      "border: 1px solid rgba(15,23,42,0.1)",
      "box-shadow: 0 20px 48px rgba(15,23,42,0.22)",
      "font: 500 12px/1.5 'Segoe UI', sans-serif",
      "color: #0f172a",
      "display: none",
    ].join(";");
    panel.innerHTML = [
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(15,23,42,0.08)">',
      '  <strong>云端排行榜</strong>',
      '  <button type="button" data-role="close" style="all:unset;cursor:pointer;color:#64748b;font-weight:700">关闭</button>',
      "</div>",
      '<div style="padding:12px 14px;border-bottom:1px solid rgba(15,23,42,0.06);display:flex;gap:8px;align-items:center;">',
      '  <input type="date" data-role="date" style="flex:1;padding:6px 8px;border:1px solid #cbd5e1;border-radius:8px;">',
      '  <button type="button" data-role="refresh" style="padding:6px 10px;border:none;border-radius:8px;background:#0f766e;color:#fff;cursor:pointer;">刷新</button>',
      "</div>",
      '<div data-role="body" style="padding:12px 14px;overflow:auto;max-height:52vh;">暂无数据</div>',
    ].join("");
    document.documentElement.appendChild(panel);

    panel.querySelector("[data-role='close']").addEventListener("click", function () {
      panel.style.display = "none";
    });
    panel.querySelector("[data-role='refresh']").addEventListener("click", function () {
      const input = panel.querySelector("[data-role='date']");
      void fetchAndRender(input && input.value ? input.value : null);
    });

    const today = new Date();
    const dateValue = today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    panel.querySelector("[data-role='date']").value = dateValue;

    return panel;
  }

  function renderBody(panel, html) {
    const body = panel.querySelector("[data-role='body']");
    body.innerHTML = html;
  }

  async function fetchLeaderboard(date) {
    if (!legacyApiClient || typeof legacyApiClient.getJson !== "function") {
      throw new Error("Legacy API client is unavailable.");
    }

    return legacyApiClient.getJson("/asr/leaderboard?date=" + encodeURIComponent(date));
  }

  async function fetchAndRender(date) {
    const panel = ensurePanel();
    const body = panel.querySelector("[data-role='body']");
    const input = panel.querySelector("[data-role='date']");
    const targetDate = date || (input && input.value) || "";

    body.textContent = "正在加载排行榜...";

    try {
      const response = await fetchLeaderboard(targetDate);
      const records = Array.isArray(response?.data) ? response.data : [];

      if (records.length === 0) {
        renderBody(panel, '<div style="padding:20px 0;color:#64748b;text-align:center;">该日期暂无排行榜数据</div>');
        return {
          success: true,
          date: targetDate,
          count: 0,
          records: [],
        };
      }

      const maxDuration = Math.max.apply(
        null,
        records.map(function (entry) {
          return Number(entry.totalDuration) || 0;
        })
      );
      renderBody(
        panel,
        records
          .map(function (entry, index) {
            const duration = Number(entry.totalDuration) || 0;
            const pct = maxDuration > 0 ? Math.max(8, Math.round((duration / maxDuration) * 100)) : 8;
            return [
              '<div style="margin-bottom:10px;">',
              '  <div style="display:flex;justify-content:space-between;gap:8px;">',
              '    <span style="font-weight:700;color:#0f172a;">#' +
                (index + 1) +
                " " +
                (entry.annotator || "未知用户") +
                "</span>",
              '    <span style="color:#475569;">' + duration.toFixed(1) + "s</span>",
              "  </div>",
              '  <div style="margin-top:4px;height:8px;border-radius:999px;background:#e2e8f0;overflow:hidden;">',
              '    <div style="height:100%;width:' +
                pct +
                '%;background:linear-gradient(90deg,#ef4444,#fb7185);"></div>',
              "  </div>",
              "</div>",
            ].join("");
          })
          .join("")
      );

      return {
        success: true,
        date: targetDate,
        count: records.length,
        records: records,
      };
    } catch (error) {
      console.warn(LOG_PREFIX, "Failed to load leaderboard:", error);
      renderBody(panel, '<div style="padding:20px 0;color:#b91c1c;text-align:center;">排行榜加载失败</div>');
      return {
        success: false,
        date: targetDate,
        error: error && error.message ? error.message : String(error),
      };
    }
  }

  async function toggle(date) {
    const panel = ensurePanel();
    const shouldShow = panel.style.display !== "block";
    panel.style.display = shouldShow ? "block" : "none";

    if (shouldShow) {
      return fetchAndRender(date || null);
    }

    return {
      success: true,
      hidden: true,
    };
  }

  window.__ASREdgeAlibabaLabelxLegacyLeaderboard = {
    toggle: toggle,
    fetchAndRender: fetchAndRender,
    fetchLeaderboard: fetchLeaderboard,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
