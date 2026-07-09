import { clone } from "@/utils/clone";

export function getConstants() {
  return globalThis.ASREdgeConstants || {};
}

export function getStorage() {
  return globalThis.ASREdgeStorage || {};
}

export function getSharedSelect() {
  return globalThis.ASREdgeOptionsSharedSelect || {};
}

export function getSharedAsrAiPanel() {
  return globalThis.ASREdgeOptionsSharedAsrAiPanel || {};
}

export function getProjectDownloadSupplierHelper() {
  return globalThis.ASREdgeOptionsProjectDownloadSupplier || {};
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

export function canUseBetaFeatures(settings) {
  const constants = getConstants();
  const checker = typeof constants.canUseBetaFeatures === "function" ? constants.canUseBetaFeatures : null;
  return checker ? checker(settings || {}) : false;
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
  const visiblePlatforms = Object.values(platformLibrary)
    .filter((platform) => isPlatformVisible(platform.id, settings || {}))
    .map((platform) => platform.id);
  const visibleScripts = Object.values(scriptLibrary)
    .filter((script) => isScriptVisible(script.id, settings || {}))
    .map((script) => script.id);
  return {
    platformLibrary,
    scriptLibrary,
    visiblePlatforms,
    visibleScripts,
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
