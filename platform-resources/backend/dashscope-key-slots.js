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

function createDashscopeKeySlotStore(options) {
  const config = options && typeof options === "object" ? options : {};
  const secretsDir = path.resolve(config.secretsDir || DEFAULT_SECRETS_DIR);
  const activeStatePath = path.join(secretsDir, ACTIVE_STATE_FILE_NAME);

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

  function getSummary() {
    const activeSlotId = readActiveSlotId();
    return {
      activeSlotId,
      slots: KEY_SLOT_DEFINITIONS.map((slot) => {
        const key = readSlot(slot);
        return {
          id: slot.id,
          label: slot.label,
          configured: key.configured,
          active: slot.id === activeSlotId,
        };
      }),
    };
  }

  function getActiveKey() {
    const activeSlotId = readActiveSlotId();
    const slot = getSlotDefinition(activeSlotId);
    const key = readSlot(slot);
    if (!key.configured) {
      throw createSlotError(
        "dashscope-key-slot-not-configured",
        "当前服务器密钥槽位未配置。",
        503
      );
    }
    return {
      slotId: slot.id,
      apiKey: key.apiKey,
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

module.exports = {
  ACTIVE_STATE_FILE_NAME,
  DEFAULT_ACTIVE_SLOT_ID,
  DEFAULT_SECRETS_DIR,
  KEY_SLOT_IDS,
  createDashscopeKeySlotStore,
  getActiveDashscopeApiKey,
};
