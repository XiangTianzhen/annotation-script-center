(function () {
  const ROOT_ID = "asc-lexicon-toast-root";
  const STYLE_ID = "asc-lexicon-toast-style";
  const DEFAULT_DURATION_MS = 1000;
  let hideTimer = null;
  let lastMessage = "";
  let lastAt = 0;

  function ensureRoot() {
    let host = document.getElementById(ROOT_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = ROOT_ID;
      host.style.position = "fixed";
      host.style.right = "16px";
      host.style.bottom = "16px";
      host.style.zIndex = "2147483647";
      host.style.pointerEvents = "none";
      document.documentElement.appendChild(host);
    }

    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
    if (!shadow.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent =
        ".toast{min-width:180px;max-width:360px;padding:10px 12px;border-radius:10px;" +
        "font-size:12px;line-height:1.45;font-family:Segoe UI,PingFang SC,Microsoft YaHei,sans-serif;" +
        "box-shadow:0 10px 24px rgba(15,23,42,.22);color:#0f172a;background:#e2e8f0;opacity:0;" +
        "transform:translateY(6px);transition:opacity .12s ease,transform .12s ease}" +
        ".toast.show{opacity:1;transform:translateY(0)}" +
        ".toast.warn{background:#fef3c7;color:#92400e}" +
        ".toast.info{background:#dbeafe;color:#1d4ed8}" +
        ".toast.error{background:#fee2e2;color:#991b1b}" +
        ".toast.success{background:#dcfce7;color:#166534}";
      shadow.appendChild(style);
    }

    let toast = shadow.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      shadow.appendChild(toast);
    }
    return toast;
  }

  function show(message, tone, durationMs) {
    const text = String(message || "").trim();
    if (!text || typeof document === "undefined" || !document.documentElement) {
      return false;
    }
    const now = Date.now();
    if (text === lastMessage && now - lastAt < 250) {
      return false;
    }
    lastMessage = text;
    lastAt = now;

    const toast = ensureRoot();
    toast.className = "toast " + String(tone || "warn").trim();
    toast.textContent = text;
    void toast.offsetWidth;
    toast.classList.add("show");

    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    hideTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, Number(durationMs) > 0 ? Number(durationMs) : DEFAULT_DURATION_MS);
    return true;
  }

  globalThis.ASREdgeLexiconToast = {
    show: show,
    defaultDurationMs: DEFAULT_DURATION_MS,
  };
})();
