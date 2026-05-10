(function () {
  function clampNonNegativeInteger(value) {
    const numeric = Math.floor(Number(value));
    if (!Number.isFinite(numeric) || numeric < 0) {
      return 0;
    }
    return numeric;
  }

  function formatPercent(completed, total) {
    if (total <= 0) {
      return "0%";
    }
    const ratio = Math.max(0, Math.min(1, completed / total));
    return String(Math.round(ratio * 100)) + "%";
  }

  function createNode(tagName, style) {
    const node = document.createElement(tagName);
    Object.assign(node.style, style || {});
    return node;
  }

  function createProgressIndicator(options) {
    const config = options && typeof options === "object" ? options : {};
    const id = String(config.id || "asr-edge-progress-indicator");
    const title = String(config.title || "上传进度");
    const mountTarget = config.mount && config.mount.nodeType === 1 ? config.mount : document.body;

    const root = createNode("div", {
      display: "inline-flex",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: "8px",
      marginLeft: "8px",
      padding: "4px 8px",
      border: "1px solid #bfdbfe",
      borderRadius: "8px",
      background: "#eff6ff",
      color: "#0958d9",
      fontSize: "12px",
      lineHeight: "1.4",
      minWidth: "560px",
      maxWidth: "780px",
      whiteSpace: "normal",
      overflow: "visible",
    });
    root.id = id;

    const titleNode = createNode("span", {
      fontWeight: "700",
      flex: "0 0 auto",
    });
    titleNode.textContent = title;

    const barWrap = createNode("span", {
      width: "120px",
      height: "6px",
      borderRadius: "999px",
      background: "rgba(9, 88, 217, 0.16)",
      overflow: "hidden",
      flex: "0 0 auto",
    });
    const bar = createNode("span", {
      display: "block",
      width: "0%",
      height: "100%",
      borderRadius: "999px",
      background: "#1677ff",
      transition: "width 120ms linear",
    });
    barWrap.appendChild(bar);

    const textNode = createNode("span", {
      minWidth: "320px",
      whiteSpace: "normal",
      wordBreak: "break-word",
      flex: "1 1 auto",
    });

    root.appendChild(titleNode);
    root.appendChild(barWrap);
    root.appendChild(textNode);

    const old = document.getElementById(id);
    if (old && old.parentNode) {
      old.parentNode.removeChild(old);
    }
    mountTarget.appendChild(root);

    const state = {
      phase: "初始化",
      total: 0,
      completed: 0,
      concurrency: 0,
      success: 0,
      failed: 0,
      message: "",
      status: "running",
    };

    function render() {
      const total = clampNonNegativeInteger(state.total);
      const completed = clampNonNegativeInteger(state.completed);
      const success = clampNonNegativeInteger(state.success);
      const failed = clampNonNegativeInteger(state.failed);
      const concurrency = clampNonNegativeInteger(state.concurrency);
      const percent = formatPercent(completed, total);
      const percentWidth = total > 0 ? percent : "0%";

      bar.style.width = percentWidth;

      let text = String(state.phase || "处理中");
      text += "：" + String(completed) + "/" + String(total);
      text += "（" + percent + "）";
      if (concurrency > 0) {
        text += "，并发 " + String(concurrency);
      }
      text += "，成功 " + String(success) + "，失败 " + String(failed);
      if (state.message) {
        text += "，" + String(state.message);
      }
      textNode.textContent = text;

      if (state.status === "failed") {
        root.style.borderColor = "#fecaca";
        root.style.background = "#fef2f2";
        root.style.color = "#b91c1c";
        bar.style.background = "#dc2626";
        return;
      }
      if (state.status === "completed") {
        root.style.borderColor = "#bbf7d0";
        root.style.background = "#f0fdf4";
        root.style.color = "#047857";
        bar.style.background = "#059669";
        return;
      }
      root.style.borderColor = "#bfdbfe";
      root.style.background = "#eff6ff";
      root.style.color = "#0958d9";
      bar.style.background = "#1677ff";
    }

    function update(nextState) {
      const patch = nextState && typeof nextState === "object" ? nextState : {};
      if (patch.phase !== undefined) {
        state.phase = String(patch.phase || "").trim() || state.phase;
      }
      if (patch.total !== undefined) {
        state.total = clampNonNegativeInteger(patch.total);
      }
      if (patch.completed !== undefined) {
        state.completed = clampNonNegativeInteger(patch.completed);
      }
      if (patch.concurrency !== undefined) {
        state.concurrency = clampNonNegativeInteger(patch.concurrency);
      }
      if (patch.success !== undefined) {
        state.success = clampNonNegativeInteger(patch.success);
      }
      if (patch.failed !== undefined) {
        state.failed = clampNonNegativeInteger(patch.failed);
      }
      if (patch.message !== undefined) {
        state.message = String(patch.message || "");
      }
      state.status = "running";
      render();
    }

    function complete(message) {
      state.status = "completed";
      state.message = message ? String(message) : state.message;
      if (state.total > 0 && state.completed < state.total) {
        state.completed = state.total;
      }
      render();
    }

    function fail(message) {
      state.status = "failed";
      state.message = message ? String(message) : state.message;
      render();
    }

    function destroy() {
      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    }

    render();

    return {
      update: update,
      complete: complete,
      fail: fail,
      destroy: destroy,
    };
  }

  globalThis.ASREdgeProgressIndicator = {
    createProgressIndicator: createProgressIndicator,
  };
})();
