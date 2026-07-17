import { buildBackendUrl, getChromeSessionStorageArea } from "@/services/globals";

const ADMIN_SESSION_STORAGE_KEY = "asc-options-admin-session";

function normalizeText(value) {
  return String(value || "").trim();
}

export function normalizeAdminSessionPayload(value) {
  const source = value && typeof value === "object" ? value : {};
  const token = normalizeText(source.token);
  const expiresAt = normalizeText(source.expiresAt);
  if (!token || !expiresAt) {
    return null;
  }
  return {
    token,
    expiresAt,
    expiresInSeconds: Math.max(0, Number(source.expiresInSeconds || 0) || 0),
    remember: source.remember === true,
  };
}

export function isAdminSessionExpired(session) {
  const payload = normalizeAdminSessionPayload(session);
  if (!payload) {
    return true;
  }
  const expiresAt = Date.parse(payload.expiresAt);
  if (!Number.isFinite(expiresAt)) {
    return true;
  }
  return expiresAt <= Date.now() + 1000;
}

function readSessionStorageValue(key) {
  try {
    return globalThis.sessionStorage?.getItem(key) || "";
  } catch (_error) {
    return "";
  }
}

function writeSessionStorageValue(key, value) {
  try {
    globalThis.sessionStorage?.setItem(key, value);
  } catch (_error) {
    // ignore
  }
}

function removeSessionStorageValue(key) {
  try {
    globalThis.sessionStorage?.removeItem(key);
  } catch (_error) {
    // ignore
  }
}

function parseJsonText(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch (_error) {
    return null;
  }
}

async function readChromeSessionValue(key) {
  const area = getChromeSessionStorageArea();
  if (!area) {
    return null;
  }
  return new Promise((resolve) => {
    area.get([key], (result) => {
      resolve(result && result[key] ? result[key] : null);
    });
  });
}

async function writeChromeSessionValue(key, value) {
  const area = getChromeSessionStorageArea();
  if (!area) {
    return;
  }
  await new Promise((resolve) => {
    const nextValue = {};
    nextValue[key] = value;
    area.set(nextValue, resolve);
  });
}

async function removeChromeSessionValue(key) {
  const area = getChromeSessionStorageArea();
  if (!area) {
    return;
  }
  await new Promise((resolve) => {
    area.remove([key], resolve);
  });
}

export async function restoreAdminSession() {
  const fromPage = normalizeAdminSessionPayload(
    parseJsonText(readSessionStorageValue(ADMIN_SESSION_STORAGE_KEY))
  );
  if (fromPage && !isAdminSessionExpired(fromPage)) {
    return fromPage;
  }
  const fromBrowser = normalizeAdminSessionPayload(
    await readChromeSessionValue(ADMIN_SESSION_STORAGE_KEY)
  );
  if (fromBrowser && !isAdminSessionExpired(fromBrowser)) {
    writeSessionStorageValue(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(fromBrowser));
    return fromBrowser;
  }
  await clearAdminSession();
  return null;
}

export async function persistAdminSession(session, remember) {
  const payload = normalizeAdminSessionPayload({
    ...(session || {}),
    remember: remember === true,
  });
  if (!payload) {
    return null;
  }
  writeSessionStorageValue(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(payload));
  if (remember === true) {
    await writeChromeSessionValue(ADMIN_SESSION_STORAGE_KEY, payload);
  } else {
    await removeChromeSessionValue(ADMIN_SESSION_STORAGE_KEY);
  }
  return payload;
}

export async function clearAdminSession() {
  removeSessionStorageValue(ADMIN_SESSION_STORAGE_KEY);
  await removeChromeSessionValue(ADMIN_SESSION_STORAGE_KEY);
}

export async function unlockAdminSession(settings, password, operatorName, remember) {
  const response = await fetch(buildBackendUrl("/api/admin/session/unlock", settings || {}), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password: normalizeText(password),
      operatorName: normalizeText(operatorName),
    }),
  });
  const body = await response.json().catch(() => ({}));
  return {
    response,
    body,
  };
}

export async function requestAdminJson(path, settings, session, options = {}) {
  if (isAdminSessionExpired(session)) {
    return {
      authFailed: true,
    };
  }
  const response = await fetch(buildBackendUrl(path, settings || {}), {
    method: options.method || "GET",
    cache: options.cache || "no-store",
    headers: {
      ...(options.headers || {}),
      Authorization: "Bearer " + session.token,
    },
    body: options.body,
  });
  const body = await response.json().catch(() => ({}));
  return {
    response,
    body,
    authFailed: response.status === 401,
  };
}

export async function loadAiKeySlots(settings, session) {
  return requestAdminJson("/api/admin/ai-key-slots", settings || {}, session, {
    method: "GET",
  });
}

export async function switchAiKeySlot(settings, session, slotId) {
  return requestAdminJson("/api/admin/ai-key-slots/active", settings || {}, session, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slotId: normalizeText(slotId),
    }),
  });
}

export async function loadDownloadCenterReleases(settings) {
  const response = await fetch(buildBackendUrl("/api/admin/download-center/releases", settings || {}), {
    method: "GET",
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  return {
    response,
    body,
  };
}

export async function loadAiCallLogOptions(settings) {
  const response = await fetch(buildBackendUrl("/api/admin/ai-call-log/options", settings || {}), {
    method: "GET",
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  return {
    response,
    body,
  };
}
