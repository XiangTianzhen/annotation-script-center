"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveRepo } = require("#repo-paths");

const mapper = require(resolveRepo(
  "platform-resources", "backend", "ai", "aliyun-error-message.js"
));
const { createProviderHttpError, normalizeAbortError } = require(resolveRepo(
  "platform-resources", "backend", "ai", "errors.js"
));

test("good-standing text wins over a misleading parameter code", () => {
  const result = mapper.resolveAliyunProviderError({
    providerStatus: 400,
    responseBody: JSON.stringify({
      error: {
        code: "invalid_parameter_error",
        message: "Access denied, please make sure your account is in good standing.",
      },
    }),
  });

  assert.equal(result.providerCode, "invalid_parameter_error");
  assert.equal(
    result.displayMessage,
    "API Key 所属的阿里云账号存在欠费，导致访问被拒绝。"
  );
  assert.equal(
    result.providerMessage,
    "Access denied, please make sure your account is in good standing."
  );
});

test("known Alibaba Cloud codes map to stable Chinese explanations", () => {
  const cases = [
    ["InvalidApiKey", "Invalid API-key provided.", "当前服务器配置的 DashScope API Key 无效或未正确配置。"],
    ["AccessDenied.Unpurchased", "Access to model denied.", "当前阿里云账号尚未开通百炼服务，或目标模型尚未获得使用资格。"],
    ["Model.AccessDenied", "Model access denied.", "当前 API Key 所属业务空间没有目标模型的调用权限。"],
    ["model_not_found", "Model not exist.", "当前配置的模型不存在，或在所选地域不可用。"],
    ["invalid_parameter", "Invalid parameter.", "发送给阿里云百炼的请求参数不符合目标模型要求。"],
    ["Throttling", "Requests rate limit exceeded.", "阿里云百炼接口触发限流，请稍后重试。"],
  ];
  cases.forEach(([providerCode, providerMessage, expected]) => {
    const result = mapper.resolveAliyunProviderError({ providerCode, providerMessage });
    assert.equal(result.displayMessage, expected);
  });

  assert.equal(
    mapper.resolveAliyunProviderError({ providerStatus: 401, providerMessage: "Unauthorized" })
      .displayMessage,
    "当前服务器配置的 DashScope API Key 无效或未正确配置。"
  );
  assert.equal(
    mapper.resolveAliyunProviderError({
      providerStatus: 403,
      providerMessage: "Not authorized to access this workspace",
    }).displayMessage,
    "当前 API Key 无权访问目标工作空间，或工作空间、地域、接口地址配置不匹配。"
  );
});

test("unknown upstream errors display sanitized provider text", () => {
  const result = mapper.resolveAliyunProviderError({
    providerStatus: 502,
    responseBody: {
      error: {
        code: "future_error",
        message: "Future provider failure at https://example.invalid/private?token=secret",
      },
    },
  });

  assert.equal(result.providerCode, "future_error");
  assert.match(result.displayMessage, /Future provider failure/);
  assert.equal(result.displayMessage.includes("example.invalid/private"), false);
  assert.equal(result.displayMessage.includes("token=secret"), false);
});

test("provider HTTP errors use mapped text while network errors remain unchanged", () => {
  const providerError = createProviderHttpError(
    400,
    '{"error":{"code":"invalid_parameter_error","message":"Access denied, please make sure your account is in good standing."}}',
    "Qwen 接口请求失败（HTTP 400）。"
  );
  assert.equal(
    providerError.message,
    "API Key 所属的阿里云账号存在欠费，导致访问被拒绝。"
  );
  assert.equal(providerError.providerCode, "invalid_parameter_error");

  const networkError = normalizeAbortError(
    new Error("连接 AI 后端失败，请检查当前网络。"),
    "fallback",
    "network-error",
    504
  );
  assert.equal(networkError.message, "连接 AI 后端失败，请检查当前网络。");
});
