"use strict";

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const OPTIONS_APP_DIR = path.join(REPO_ROOT, "frontend", "options-app");
const OPTIONS_OUTPUT_DIR = path.join(REPO_ROOT, "extension", "options");

function runCommand(command, args, options) {
  const result = childProcess.spawnSync(
    command,
    args,
    Object.assign(
      {
        cwd: REPO_ROOT,
        stdio: "inherit",
        encoding: "utf8",
      },
      options || {}
    )
  );
  if (result.error) {
    throw new Error(`执行命令失败：${command} ${args.join(" ")} | ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`命令退出码非 0：${command} ${args.join(" ")} | ${result.status}`);
  }
}

function ensureExists(targetPath, description) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${description} 不存在：${targetPath}`);
  }
}

function buildOptionsApp() {
  const packageJsonPath = path.join(OPTIONS_APP_DIR, "package.json");
  ensureExists(packageJsonPath, "options-app package.json");

  if (process.platform === "win32") {
    runCommand("cmd.exe", ["/d", "/s", "/c", "npm run build"], {
      cwd: OPTIONS_APP_DIR,
    });
  } else {
    runCommand("npm", ["run", "build"], {
      cwd: OPTIONS_APP_DIR,
    });
  }

  ensureExists(path.join(OPTIONS_OUTPUT_DIR, "options.html"), "options 构建产物 options.html");
  ensureExists(path.join(OPTIONS_OUTPUT_DIR, "assets"), "options 构建产物 assets");
  ensureExists(
    path.join(OPTIONS_OUTPUT_DIR, "options-shared-select.js"),
    "options 运行时 helper"
  );
}

module.exports = {
  buildOptionsApp,
};

if (require.main === module) {
  buildOptionsApp();
}
