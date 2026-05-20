"use strict";

function sanitizeProviderText(text, limit) {
  return String(text || "")
    .replace(/https?:\/\/[^\s"'\\]+/g, function (matchText) {
      try {
        const parsedUrl = new URL(matchText);
        return parsedUrl.protocol + "//" + parsedUrl.host + "/[redacted]";
      } catch (error) {
        return "[url-redacted]";
      }
    })
    .replace(/(access_token["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(refresh_token["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(cookie["'\s:=]+)([^\n\r]+)/gi, "$1[redacted]")
    .replace(/(ossaccesskeyid["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(signature["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(api[_-]?key["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/(authorization["'\s:=]+)([^\s",}]+)/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, Math.max(40, Number(limit) || 240));
}

module.exports = {
  sanitizeProviderErrorSummary: sanitizeProviderText,
  sanitizeProviderText,
};
