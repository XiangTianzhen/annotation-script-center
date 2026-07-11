import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const require = createRequire(import.meta.url);
const { repoRoot, resolveRepo } = require("../../tests/helpers/repo-paths.cjs");
const optionsRoot = resolveRepo("frontend", "options-app");
const optionsDependencyAliases = [
  "vitest",
  "@vue/test-utils",
  "vue",
  "vue-router",
  "pinia",
].map((packageName) => ({
  find: new RegExp(`^${packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  replacement: fileURLToPath(import.meta.resolve(packageName)),
}));
const optionsAliases = [
  { find: "@", replacement: path.resolve(optionsRoot, "src") },
  ...optionsDependencyAliases,
];

export default defineConfig({
  root: repoRoot,
  cacheDir: resolveRepo("frontend", "options-app", "node_modules", ".vite"),
  plugins: [vue()],
  test: {
    alias: optionsAliases,
    deps: {
      moduleDirectories: [
        "node_modules",
        resolveRepo("frontend", "options-app", "node_modules"),
      ],
    },
    environment: "jsdom",
    globals: true,
    include: ["tests/frontend/options/**/*.test.js"],
  },
  resolve: {
    alias: optionsAliases,
  },
  server: {
    fs: {
      allow: [repoRoot, optionsRoot],
    },
  },
});
