import { clone } from "@/utils/clone";

function normalizeText(value) {
  return String(value || "").trim();
}

function buildOrderedIds(sourceIds, savedOrder) {
  const nextIds = [];
  const seen = new Set();

  (Array.isArray(savedOrder) ? savedOrder : []).forEach((id) => {
    const normalized = normalizeText(id);
    if (!normalized || seen.has(normalized) || sourceIds.includes(normalized) === false) {
      return;
    }
    seen.add(normalized);
    nextIds.push(normalized);
  });

  (Array.isArray(sourceIds) ? sourceIds : []).forEach((id) => {
    const normalized = normalizeText(id);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    nextIds.push(normalized);
  });

  return nextIds;
}

export function getConstants() {
  return globalThis.ASREdgeConstants || {};
}

export function getStorage() {
  return globalThis.ASREdgeStorage || {};
}

export function getSharedSelect() {
  return globalThis.ASREdgeOptionsSharedSelect || {};
}

export function getChromeSessionStorageArea() {
  const area = globalThis.chrome?.storage?.session;
  return area && typeof area.get === "function" ? area : null;
}

export function getManifestVersion() {
  try {
    return globalThis.chrome?.runtime?.getManifest?.()?.version || "0.0.0";
  } catch (_error) {
    return "0.0.0";
  }
}

export function getManifestName() {
  return getConstants().EXTENSION_NAME || "标注脚本中心";
}

export function buildBackendUrl(path, settingsOrMode) {
  const constants = getConstants();
  const builder =
    typeof constants.buildBackendUrl === "function"
      ? constants.buildBackendUrl
      : null;
  return builder ? builder(path, settingsOrMode) : String(path || "");
}

export function isScriptRuntimeAccessible(scriptId, settings) {
  const constants = getConstants();
  const checker =
    typeof constants.isScriptRuntimeAccessible === "function"
      ? constants.isScriptRuntimeAccessible
      : null;
  return checker ? checker(scriptId, settings || {}) : false;
}

export function getVisiblePlatformLibrary(settings) {
  const constants = getConstants();
  const platformLibrary = clone(constants.PLATFORM_LIBRARY || {});
  const scriptLibrary = clone(constants.SCRIPT_LIBRARY || {});
  const isPlatformVisible =
    typeof constants.isPlatformVisible === "function"
      ? constants.isPlatformVisible
      : function () {
          return true;
        };
  const isScriptVisible =
    typeof constants.isScriptVisible === "function"
      ? constants.isScriptVisible
      : function () {
          return true;
        };
  const visiblePlatforms = buildOrderedIds(
    Object.values(platformLibrary)
      .filter((platform) => isPlatformVisible(platform.id, settings || {}))
      .map((platform) => platform.id),
    settings?.meta?.publicCenterPlatformOrder
  );
  const visibleScriptSet = new Set(
    Object.values(scriptLibrary)
      .filter((script) => isScriptVisible(script.id, settings || {}))
      .map((script) => script.id)
  );
  const orderedVisibleScripts = visiblePlatforms
    .flatMap((platformId) =>
      Object.values(scriptLibrary)
        .filter((script) => script?.platformId === platformId && visibleScriptSet.has(script.id))
        .map((script) => script.id)
    );
  const remainingVisibleScripts = Array.from(visibleScriptSet).filter(
    (scriptId) => orderedVisibleScripts.includes(scriptId) === false
  );
  return {
    platformLibrary,
    scriptLibrary,
    visiblePlatforms,
    visibleScripts: orderedVisibleScripts.concat(remainingVisibleScripts),
  };
}

export function buildPlatformEntryDescriptor(platform) {
  const constants = getConstants();
  const helper =
    typeof constants.buildPlatformEntryDescriptor === "function"
      ? constants.buildPlatformEntryDescriptor
      : null;
  if (helper) {
    return helper(platform);
  }
  const target = platform && typeof platform === "object" ? platform : {};
  const explicitEntryUrl = String(target.entryUrl || "").trim();
  const displayHost = String(target.displayHost || target.host || "").trim();
  if (explicitEntryUrl) {
    return {
      displayHost,
      entryUrl: explicitEntryUrl,
    };
  }
  const firstPattern = String(Array.isArray(target.matches) ? target.matches[0] || "" : "").trim();
  if (!firstPattern) {
    return {
      displayHost,
      entryUrl: "",
    };
  }
  try {
    const url = new URL(firstPattern.replace(/\*.*$/, ""));
    return {
      displayHost,
      entryUrl: url.origin,
    };
  } catch (_error) {
    return {
      displayHost,
      entryUrl: "",
    };
  }
}

export function splitPlatformDisplayAddress(value) {
  const rawValue = normalizeText(value).replace(/\/+$/, "");
  if (!rawValue) {
    return { host: "", path: "" };
  }
  try {
    const url = new URL(/^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`);
    const path = url.pathname && url.pathname !== "/"
      ? url.pathname.replace(/\/+$/, "")
      : "";
    return {
      host: url.host,
      path,
    };
  } catch (_error) {
    const withoutScheme = rawValue.replace(/^https?:\/\//i, "");
    const slashIndex = withoutScheme.indexOf("/");
    if (slashIndex < 0) {
      return { host: withoutScheme, path: "" };
    }
    return {
      host: withoutScheme.slice(0, slashIndex),
      path: `/${withoutScheme.slice(slashIndex + 1).replace(/\/+$/, "")}`,
    };
  }
}
