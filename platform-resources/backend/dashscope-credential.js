"use strict";

const fs = require("fs");
const path = require("path");
const { REPO_ROOT, parseEnvText } = require("./env-loader");

const DEFAULT_KEY_FILE_NAME = "dashscope-key.env";
const DEFAULT_SECRETS_DIR = path.join(REPO_ROOT, "config", "secrets");

function normalizeText(value) {
  return String(value || "").trim();
}

function createCredentialError() {
  const error = new Error("当前服务器未配置可用的 DashScope API Key。");
  error.code = "dashscope-key-not-configured";
  error.statusCode = 503;
  return error;
}

function createDashscopeCredentialStore(options) {
  const config = options && typeof options === "object" ? options : {};
  const secretsDir = path.resolve(config.secretsDir || DEFAULT_SECRETS_DIR);
  const keyPath = path.join(secretsDir, DEFAULT_KEY_FILE_NAME);

  function getResolution() {
    if (!fs.existsSync(keyPath)) return { apiKey: "", source: "none" };
    try {
      const parsed = parseEnvText(fs.readFileSync(keyPath, "utf8"));
      const apiKey = normalizeText(parsed.DASHSCOPE_API_KEY);
      return { apiKey, source: apiKey ? "file" : "none" };
    } catch (_error) {
      return { apiKey: "", source: "none" };
    }
  }

  function getApiKey() {
    const resolution = getResolution();
    if (!resolution.apiKey) throw createCredentialError();
    return resolution.apiKey;
  }

  return { getApiKey, getResolution };
}

const defaultStore = createDashscopeCredentialStore();

function getDashscopeApiKey() {
  try {
    return defaultStore.getApiKey();
  } catch (error) {
    if (error?.code === "dashscope-key-not-configured") return "";
    throw error;
  }
}

function getDashscopeCredentialResolution() {
  return defaultStore.getResolution();
}

function getDashscopeCredentialAuthFailureMessage(context) {
  return normalizeText(context?.apiKeySource || context?.source) === "none"
    ? "当前服务器未配置可用的 DashScope API Key。"
    : "当前服务器配置的 DashScope API Key 鉴权失败，请检查密钥及阿里云账号状态。";
}

module.exports = {
  DEFAULT_KEY_FILE_NAME,
  DEFAULT_SECRETS_DIR,
  createDashscopeCredentialStore,
  getDashscopeApiKey,
  getDashscopeCredentialAuthFailureMessage,
  getDashscopeCredentialResolution,
};
