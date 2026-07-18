"use strict";

const fs = require("fs");
const path = require("path");
const { REPO_ROOT, parseEnvText } = require("./env-loader");

const KEY_SLOT_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "key-1", label: "密钥一", fileName: "dashscope-key-1.env" }),
  Object.freeze({ id: "key-2", label: "密钥二", fileName: "dashscope-key-2.env" }),
]);
const KEY_SLOT_IDS = Object.freeze(KEY_SLOT_DEFINITIONS.map((slot) => slot.id));
const DEFAULT_ACTIVE_SLOT_ID = "key-1";
const ACTIVE_STATE_FILE_NAME = "dashscope-active-key.json";
const DEFAULT_SECRETS_DIR = path.join(REPO_ROOT, "config", "secrets");

function normalizeText(value) {
  return String(value || "").trim();
}

function createSlotError(code, message, statusCode) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function getSlotDefinition(slotId) {
  const normalizedSlotId = normalizeText(slotId);
  return KEY_SLOT_DEFINITIONS.find((slot) => slot.id === normalizedSlotId) || null;
}

function getDashscopeCredentialAuthFailureMessage(context) {
  const source = normalizeText(context?.apiKeySource || context?.source);
  const slot = getSlotDefinition(context?.activeSlotId);
  if (source === "slot" && slot) {
    return "当前" + slot.label + "鉴权失败，请在系统管理中检查对应密钥。";
  }
  if (source === "legacy") {
    return "当前旧密钥兼容配置鉴权失败，请迁移或检查旧配置。";
  }
  return "当前 AI 密钥未配置，请在系统管理中配置密钥一或密钥二。";
}

function createDashscopeKeySlotStore(options) {
  const config = options && typeof options === "object" ? options : {};
  const secretsDir = path.resolve(config.secretsDir || DEFAULT_SECRETS_DIR);
  const activeStatePath = path.join(secretsDir, ACTIVE_STATE_FILE_NAME);
  const hasLegacyApiKeyOverride = Object.prototype.hasOwnProperty.call(config, "legacyApiKey");

  function getSlotPath(slot) {
    return path.join(secretsDir, slot.fileName);
  }

  function readSlot(slot) {
    const filePath = getSlotPath(slot);
    if (!fs.existsSync(filePath)) {
      return {
        id: slot.id,
        label: slot.label,
        configured: false,
        apiKey: "",
      };
    }
    try {
      const parsed = parseEnvText(fs.readFileSync(filePath, "utf8"));
      const apiKey = normalizeText(parsed.DASHSCOPE_API_KEY);
      return {
        id: slot.id,
        label: slot.label,
        configured: Boolean(apiKey),
        apiKey,
      };
    } catch (_error) {
      return {
        id: slot.id,
        label: slot.label,
        configured: false,
        apiKey: "",
      };
    }
  }

  function readLegacyApiKey() {
    const rawValue = hasLegacyApiKeyOverride ? config.legacyApiKey : process.env.DASHSCOPE_API_KEY;
    return normalizeText(rawValue);
  }

  function readActiveSlotId() {
    if (!fs.existsSync(activeStatePath)) {
      return DEFAULT_ACTIVE_SLOT_ID;
    }
    let parsed = null;
    try {
      parsed = JSON.parse(fs.readFileSync(activeStatePath, "utf8"));
    } catch (_error) {
      throw createSlotError(
        "dashscope-key-slot-state-invalid",
        "当前服务器密钥状态文件无效，请由服务器管理员修复。",
        500
      );
    }
    const activeSlotId = normalizeText(parsed?.activeSlotId);
    if (!getSlotDefinition(activeSlotId)) {
      throw createSlotError(
        "dashscope-key-slot-state-invalid",
        "当前服务器密钥状态文件无效，请由服务器管理员修复。",
        500
      );
    }
    return activeSlotId;
  }

  function writeActiveSlotId(activeSlotId) {
    const tempPath = activeStatePath + ".tmp-" + process.pid + "-" + Date.now();
    try {
      fs.writeFileSync(tempPath, JSON.stringify({ activeSlotId }) + "\n", {
        encoding: "utf8",
        mode: 0o600,
      });
      fs.renameSync(tempPath, activeStatePath);
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.rmSync(tempPath, { force: true });
      }
    }
  }

  function getActiveKeyResolution() {
    const activeSlotId = readActiveSlotId();
    const slotKeys = KEY_SLOT_DEFINITIONS.map((slot) => readSlot(slot));
    const activeKey = slotKeys.find((key) => key.id === activeSlotId);
    if (activeKey?.configured) {
      return {
        activeSlotId,
        apiKey: activeKey.apiKey,
        source: "slot",
      };
    }
    if (!slotKeys.some((key) => key.configured)) {
      const legacyApiKey = readLegacyApiKey();
      if (legacyApiKey) {
        return {
          activeSlotId,
          apiKey: legacyApiKey,
          source: "legacy",
        };
      }
    }
    return {
      activeSlotId,
      apiKey: "",
      source: "none",
    };
  }

  function getSummary() {
    const resolution = getActiveKeyResolution();
    return {
      activeKeySource: resolution.source,
      activeSlotId: resolution.activeSlotId,
      slots: KEY_SLOT_DEFINITIONS.map((slot) => {
        const key = readSlot(slot);
        return {
          id: slot.id,
          label: slot.label,
          configured: key.configured,
          active: slot.id === resolution.activeSlotId,
        };
      }),
    };
  }

  function getActiveKey() {
    const resolution = getActiveKeyResolution();
    if (!resolution.apiKey) {
      throw createSlotError(
        "dashscope-key-slot-not-configured",
        "当前服务器未配置可用的 AI 密钥。",
        503
      );
    }
    return {
      slotId: resolution.activeSlotId,
      apiKey: resolution.apiKey,
      source: resolution.source,
    };
  }

  function setActiveSlot(slotId) {
    const slot = getSlotDefinition(slotId);
    if (!slot) {
      throw createSlotError("dashscope-key-slot-invalid", "密钥槽位无效。", 400);
    }
    const key = readSlot(slot);
    if (!key.configured) {
      throw createSlotError(
        "dashscope-key-slot-not-configured",
        "目标密钥槽位尚未配置，无法切换。",
        409
      );
    }
    writeActiveSlotId(slot.id);
    return getSummary();
  }

  return {
    activeStatePath,
    getActiveKey,
    getActiveKeyResolution,
    getSummary,
    secretsDir,
    setActiveSlot,
  };
}

const defaultStore = createDashscopeKeySlotStore();

function getActiveDashscopeApiKey() {
  try {
    return defaultStore.getActiveKey().apiKey;
  } catch (error) {
    if (error?.code === "dashscope-key-slot-not-configured") {
      return "";
    }
    throw error;
  }
}

function getActiveDashscopeKeyResolution() {
  return defaultStore.getActiveKeyResolution();
}

module.exports = {
  ACTIVE_STATE_FILE_NAME,
  DEFAULT_ACTIVE_SLOT_ID,
  DEFAULT_SECRETS_DIR,
  KEY_SLOT_IDS,
  createDashscopeKeySlotStore,
  getActiveDashscopeApiKey,
  getActiveDashscopeKeyResolution,
  getDashscopeCredentialAuthFailureMessage,
};
