"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { repoRoot, resolveRepo } = require("./helpers/repo-paths.cjs");

const SUITE_ORDER = Object.freeze([
  "frontend",
  "runtime",
  "extension",
  "backend",
  "release",
]);

const SUITE_CONFIG = Object.freeze({
  frontend: { directory: resolveRepo("tests", "frontend", "options"), suffixes: [".test.js"] },
  runtime: { directory: resolveRepo("tests", "frontend", "runtime"), suffixes: [".test.cjs"] },
  extension: { directory: resolveRepo("tests", "extension"), suffixes: [".test.js"] },
  backend: { directory: resolveRepo("tests", "backend"), suffixes: [".test.js"] },
  release: { directory: resolveRepo("tests", "release"), suffixes: [".test.js"] },
});

const USAGE = "Usage: node tests/run-tests.cjs [all|frontend|runtime|extension|backend|release]";

function comparePaths(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function collectTestFiles(directory, suffixes) {
  if (!fs.existsSync(directory)) return [];

  const files = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(entryPath, suffixes));
    } else if (entry.isFile() && suffixes.some((suffix) => entry.name.endsWith(suffix))) {
      files.push(entryPath);
    }
  }
  return files.sort(comparePaths);
}

function parseRequestedSuites(args) {
  if (args.length === 0 || (args.length === 1 && args[0] === "all")) {
    return [...SUITE_ORDER];
  }
  if (args.length === 1 && SUITE_ORDER.includes(args[0])) {
    return [args[0]];
  }

  const requested = args.join(" ") || "(empty)";
  const error = new Error(`Unknown test suite: ${requested}`);
  error.code = "UNKNOWN_SUITE";
  throw error;
}

function validateSuiteFiles(suite, files) {
  if (files.length === 0) {
    throw new Error(`Suite "${suite}" has no test files.`);
  }
  return files;
}

function collectSuiteFiles(suite) {
  const config = SUITE_CONFIG[suite];
  return validateSuiteFiles(
    suite,
    collectTestFiles(config.directory, config.suffixes)
  );
}

function buildSuiteCommand(suite, files, platform = process.platform) {
  if (suite === "frontend") {
    return {
      command: platform === "win32" ? "npm.cmd" : "npm",
      args: ["--prefix", path.join("frontend", "options-app"), "test"],
    };
  }
  return { command: process.execPath, args: ["--test", ...files] };
}

function prepareSpawnCommand(commandSpec, options = {}) {
  const platform = options.platform || process.platform;
  if (platform !== "win32" || !commandSpec.command.toLowerCase().endsWith(".cmd")) {
    return commandSpec;
  }

  return {
    command: options.comSpec || process.env.ComSpec || "cmd.exe",
    args: ["/d", "/s", "/c", [commandSpec.command, ...commandSpec.args].join(" ")],
  };
}

function runSuites(suites, spawn = spawnSync) {
  for (const suite of suites) {
    const files = collectSuiteFiles(suite);
    const { command, args } = prepareSpawnCommand(buildSuiteCommand(suite, files));
    process.stdout.write(`[tests] ${suite} (${files.length} files)\n`);
    const result = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false,
    });
    if (result.error) {
      process.stderr.write(`${result.error.message}\n`);
      return 1;
    }
    if (result.status !== 0) {
      return result.status ?? 1;
    }
  }
  return 0;
}

function main(args) {
  try {
    return runSuites(parseRequestedSuites(args));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    if (error.code === "UNKNOWN_SUITE") {
      process.stderr.write(`${USAGE}\n`);
      return 2;
    }
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  SUITE_ORDER,
  buildSuiteCommand,
  collectSuiteFiles,
  collectTestFiles,
  main,
  parseRequestedSuites,
  prepareSpawnCommand,
  runSuites,
  validateSuiteFiles,
};
