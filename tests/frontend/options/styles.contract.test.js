import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const { resolveRepo } = require("#repo-paths");
const optionsRequire = createRequire(
  resolveRepo("frontend", "options-app", "package.json")
);
const sourceRoot = resolveRepo("frontend", "options-app", "src");
const indexPath = path.join(sourceRoot, "styles/index.scss");
const publicLayoutPath = path.join(sourceRoot, "styles/layouts/_public.scss");
const adminToolbarPath = path.join(sourceRoot, "components/admin/AdminToolbar.vue");
const packageJson = JSON.parse(
  fs.readFileSync(resolveRepo("frontend", "options-app", "package.json"), "utf8")
);

const partials = [
  "foundation/tokens",
  "foundation/reset",
  "foundation/mixins",
  "components/buttons",
  "components/forms",
  "components/select",
  "components/feedback",
  "components/cards",
  "layouts/public",
  "layouts/script-detail",
  "layouts/admin",
  "pages/center",
  "pages/downloads",
  "vendor/runtime-select",
];

function readSource(relativePath) {
  return fs.readFileSync(path.join(sourceRoot, relativePath), "utf8");
}

function readPartial(partial) {
  return readSource(`styles/${path.dirname(partial)}/_${path.basename(partial)}.scss`);
}

function compileStyles() {
  const sass = optionsRequire("sass");
  return sass.compile(indexPath, { style: "expanded" }).css;
}

function findRuleIndex(css, pattern) {
  const index = css.search(pattern);
  expect(index, `Missing compiled rule: ${pattern}`).toBeGreaterThanOrEqual(0);
  return index;
}

function findCompiledRule(css, selectorPattern, declarationPattern) {
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of css.matchAll(rulePattern)) {
    if (selectorPattern.test(match[1]) && declarationPattern.test(match[2])) {
      return {
        index: match.index,
        selectors: match[1],
        declarations: match[2],
      };
    }
  }

  expect.fail(`Missing compiled declaration for ${selectorPattern} / ${declarationPattern}`);
}

function findMediaBlock(css, queryPattern, rulePattern) {
  const mediaPattern = /@media\s*\(([^)]+)\)\s*\{/g;
  for (const match of css.matchAll(mediaPattern)) {
    if (!queryPattern.test(match[1])) {
      continue;
    }

    const openBraceIndex = match.index + match[0].lastIndexOf("{");
    let depth = 1;
    let closeBraceIndex = openBraceIndex + 1;
    while (closeBraceIndex < css.length && depth > 0) {
      if (css[closeBraceIndex] === "{") depth += 1;
      if (css[closeBraceIndex] === "}") depth -= 1;
      closeBraceIndex += 1;
    }

    const body = css.slice(openBraceIndex + 1, closeBraceIndex - 1);
    if (rulePattern.test(body)) {
      return { index: match.index, body };
    }
  }

  expect.fail(`Missing compiled media block for ${queryPattern} / ${rulePattern}`);
}

function inspectScssStructure(source) {
  let depth = 0;
  let maxDepth = 0;
  let quote = "";
  let escaped = false;
  let inComment = false;
  let headerStart = 0;
  const blockHeaders = [];
  const mediaDepths = [];

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inComment) {
      if (char === "*" && next === "/") {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === "/" && next === "*") {
      inComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (source.startsWith("@media", index)) {
      mediaDepths.push(depth);
      index += "@media".length - 1;
      continue;
    }
    if (char === "{") {
      const header = source
        .slice(headerStart, index)
        .replace(/\/\/[^\n]*(?:\n|$)/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .trim();
      if (header) {
        blockHeaders.push(header);
      }
      depth += 1;
      maxDepth = Math.max(maxDepth, depth);
      headerStart = index + 1;
    } else if (char === "}") {
      depth -= 1;
      expect(depth).toBeGreaterThanOrEqual(0);
      headerStart = index + 1;
    } else if (char === ";") {
      headerStart = index + 1;
    }
  }

  expect(depth).toBe(0);
  return { blockHeaders, maxDepth, mediaDepths };
}

describe("options style contracts", () => {
  test("main loads the modular SCSS entrypoint and removes the legacy stylesheet", () => {
    const main = readSource("main.js");

    expect(main).toContain('import "@/styles/index.scss";');
    expect(fs.existsSync(indexPath)).toBe(true);
    expect(fs.existsSync(path.join(sourceRoot, "styles.css"))).toBe(false);
  });

  test("SCSS entrypoint keeps the fixed partial hierarchy and order", () => {
    const expectedFiles = partials.map((partial) =>
      path.join(sourceRoot, "styles", path.dirname(partial), `_${path.basename(partial)}.scss`)
    );
    const missingFiles = [indexPath, ...expectedFiles].filter((filePath) => !fs.existsSync(filePath));

    expect(missingFiles).toEqual([]);
    if (missingFiles.length > 0) {
      return;
    }

    const indexSource = fs.readFileSync(indexPath, "utf8");
    const uses = [...indexSource.matchAll(/@use\s+["']([^"']+)["'];/g)].map((match) => match[1]);
    expect(uses).toEqual(partials);
  });

  test("AdminToolbar owns its only local layout rule as scoped SCSS", () => {
    const toolbar = fs.readFileSync(adminToolbarPath, "utf8");
    const styleBlock = toolbar.match(/<style\s+scoped\s+lang=["']scss["']>([\s\S]*?)<\/style>/)?.[1] || "";

    expect(styleBlock).toMatch(/\.admin-toolbar\s*\{/);
    expect(styleBlock).toMatch(/>\s*\.status-text\s*\{/);
    expect(styleBlock).toMatch(/@media\s*\(max-width:\s*720px\)/);
    expect(styleBlock).not.toMatch(/\.field-actions\s*\{/);
  });

  test("BaseSelect keeps its data marker while runtime-created nodes stay in global vendor SCSS", () => {
    const baseSelect = readSource("components/base/BaseSelect.vue");
    const vendorPath = path.join(sourceRoot, "styles/vendor/_runtime-select.scss");

    expect(baseSelect).toContain(':data-options-custom-select="custom ? \'true\' : null"');
    expect(fs.existsSync(vendorPath)).toBe(true);
    if (!fs.existsSync(vendorPath)) {
      return;
    }

    const vendorSource = fs.readFileSync(vendorPath, "utf8");
    expect(vendorSource).toMatch(/\.options-custom-select\s*\{/);
    expect(vendorSource).toMatch(/\.options-select-trigger\s*\{/);
  });

  test("compiled cascade keeps resets before components and specialized card rules last", () => {
    const css = compileStyles();
    const fontReset = findRuleIndex(
      css,
      /button,\s*input,\s*select,\s*textarea\s*\{\s*font:\s*inherit;/s
    );
    const buttonComponent = findRuleIndex(
      css,
      /(?:^|\n)button\s*\{\s*border:\s*none;[\s\S]*?font-size:\s*13px;[\s\S]*?font-weight:\s*700;/
    );
    const scriptCopy = findRuleIndex(
      css,
      /\.script-copy\s*\{\s*font-size:\s*12px;\s*line-height:\s*1\.62;/s
    );
    const scriptRemarkCopy = findRuleIndex(
      css,
      /\.script-remark-copy\s*\{[^}]*font-size:\s*13px;[^}]*line-height:\s*1\.68;/s
    );
    const commonDetailPanel = findRuleIndex(
      css,
      /\.platform-section,\s*\.detail-panel\s*\{\s*padding:\s*22px;/s
    );
    const specializedDetailPanel = findRuleIndex(
      css,
      /\.detail-panel-base,\s*\.detail-ai-panel,\s*\.detail-shortcut-panel\s*\{[^}]*padding:\s*22px 24px;/s
    );

    expect(fontReset).toBeLessThan(buttonComponent);
    expect(scriptCopy).toBeLessThan(scriptRemarkCopy);
    expect(commonDetailPanel).toBeLessThan(specializedDetailPanel);
  });

  test("compiled download responsive override follows its base rule", () => {
    const css = compileStyles();
    const downloadBase = findCompiledRule(
      css,
      /^\s*\.download-release-layout\s*$/,
      /grid-template-columns:\s*minmax\(260px,\s*0\.9fr\)\s+minmax\(0,\s*1\.1fr\)/
    );
    const downloadNarrow = findMediaBlock(
      css,
      /^max-width:\s*980px$/,
      /\.download-release-layout[^{}]*\{[^{}]*grid-template-columns:\s*1fr/
    );

    expect(downloadBase.index).toBeLessThan(downloadNarrow.index);
  });

  test("compiled center responsive padding follows every center base rule", () => {
    const css = compileStyles();
    const centerNarrow = findMediaBlock(
      css,
      /^max-width:\s*720px$/,
      /\.public-center-toolbar[^{}]*\{[^{}]*padding:\s*18px/
    );
    const centerPaddingRule = findCompiledRule(
      centerNarrow.body,
      /\.public-center-toolbar/,
      /padding:\s*18px/
    );
    const centerBaseRules = [
      findCompiledRule(css, /^\s*\.public-center-toolbar\s*$/, /padding:\s*16px 18px/),
      findCompiledRule(css, /^\s*\.platform-summary\s*$/, /padding:\s*16px 14px/),
      findCompiledRule(css, /^\s*\.platform-script-stack\s*$/, /padding:\s*14px/),
      findCompiledRule(css, /^\s*\.script-card\s*$/, /gap:\s*0;[\s\S]*padding:\s*0/),
    ];

    for (const selector of [
      ".public-center-toolbar",
      ".platform-summary",
      ".platform-script-stack",
      ".script-card",
    ]) {
      expect(centerPaddingRule.selectors).toContain(selector);
    }
    for (const baseRule of centerBaseRules) {
      expect(baseRule.index).toBeLessThan(centerNarrow.index);
    }
  });

  test("compiled hero URLs resolve from the SCSS entrypoint to the tracked SVG", () => {
    const expectedAssetPath = resolveRepo("extension", "assets", "brand", "options-hero.svg");
    const source = fs.readFileSync(publicLayoutPath, "utf8");
    const sourceUrls = [...source.matchAll(/url\(["']?([^"')]*options-hero\.svg)["']?\)/g)]
      .map((match) => match[1]);
    const compiledUrls = [...compileStyles().matchAll(/url\(["']?([^"')]*options-hero\.svg)["']?\)/g)]
      .map((match) => match[1]);

    expect(sourceUrls).toHaveLength(4);
    expect(new Set(compiledUrls)).toEqual(new Set(sourceUrls));
    expect(fs.existsSync(expectedAssetPath)).toBe(true);
    for (const assetUrl of sourceUrls) {
      expect(path.resolve(path.dirname(indexPath), assetUrl)).toBe(expectedAssetPath);
    }
  });

  test("interactive states use bounded Sass parent-selector nesting", () => {
    const stateContracts = new Map([
      ["components/buttons", [/&:hover/, /&:disabled/, /&\.active/]],
      ["components/forms", [/&:focus/, /&:checked/, /&:focus-visible/]],
      ["components/select", [/&:focus/]],
      ["vendor/runtime-select", [/&:hover/, /&:focus-visible/, /&:disabled/, /&\[data-open=/]],
      ["pages/center", [/&:visited/, /&:hover/, /&:focus/]],
    ]);
    const flatStatePattern = /^(?!\s*&)[^\s@/][^{\n]*(?::hover|:focus(?:-visible)?|:disabled|:checked|\.active|\.is-(?:highlighted|selected)|\[data-open=)[^{\n]*\{/m;

    for (const [partial, patterns] of stateContracts) {
      const source = readPartial(partial);
      for (const pattern of patterns) {
        expect(source, `${partial} must use ${pattern}`).toMatch(pattern);
      }
      if (partial !== "pages/center") {
        expect(source, `${partial} still has a flat state selector`).not.toMatch(flatStatePattern);
      }
    }
  });

  test("every partial nests every interactive state selector with the Sass parent selector", () => {
    const interactionPattern = /:(?:hover|focus(?:-visible|-within)?|active|visited|disabled|checked)\b|\.(?:active|visible|enabled|disabled|pending|is-[a-z0-9-]+)\b|\[data-(?:open|tone|pool-state|log-level)=/i;
    const flatStates = [];

    for (const partial of partials) {
      const { blockHeaders } = inspectScssStructure(readPartial(partial));
      for (const header of blockHeaders) {
        if (interactionPattern.test(header) && !header.includes("&")) {
          flatStates.push(`${partial}: ${header.replace(/\s+/g, " ")}`);
        }
      }
    }

    expect(flatStates).toEqual([]);
  });

  test("partial media queries stay next to owners and SCSS nesting never exceeds three levels", () => {
    const mediaDepths = [];

    for (const partial of partials) {
      const structure = inspectScssStructure(readPartial(partial));
      expect(structure.maxDepth, `${partial} nesting depth`).toBeLessThanOrEqual(3);
      mediaDepths.push(...structure.mediaDepths.map((depth) => ({ partial, depth })));
    }

    expect(mediaDepths.length).toBeGreaterThan(0);
    expect(mediaDepths.filter(({ depth }) => depth === 0)).toEqual([]);

    const css = compileStyles();
    const requiredMedia = [
      /@media \(max-width:\s*1560px\)/,
      /@media \(min-width:\s*1400px\)/,
      /@media \(max-width:\s*1200px\)/,
      /@media \(max-width:\s*1180px\)/,
      /@media \(max-width:\s*980px\)/,
      /@media \(max-width:\s*720px\)/,
      /@media \(prefers-reduced-motion:\s*reduce\)/,
    ];
    for (const query of requiredMedia) {
      expect(css).toMatch(query);
    }
  });

  test("compiled SCSS retains global layout, field, link, and runtime-select contracts", () => {
    const sassDependency = packageJson.devDependencies?.sass;
    expect(sassDependency).toBeTruthy();
    expect(fs.existsSync(indexPath)).toBe(true);
    if (!sassDependency || !fs.existsSync(indexPath)) {
      return;
    }

    const css = compileStyles();

    expect(css).toMatch(
      /\.workspace-nav-button[\s\S]*?\.detail-back-link[\s\S]*?\.platform-link-pill[\s\S]*?text-decoration:\s*none/
    );
    expect(css).toMatch(/\.platform-link-pill:visited/);
    expect(css).toMatch(/\.platform-link-pill:hover/);
    expect(css).toMatch(/\.platform-link-pill:focus/);
    expect(css).toMatch(/\.platform-link-pill\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/s);
    expect(css).toMatch(/\.platform-link-path\s*\{/);
    expect(css).toMatch(/\.platform-link-mark\s*\{[^}]*align-self:\s*start/s);
    expect(css).toMatch(/\.field-title-row\s*\{[^}]*flex-wrap:\s*nowrap/s);
    expect(css).toMatch(/\.field-title-row \.inline-help-anchor\s*\{[^}]*flex:\s*0 0 auto/s);
    expect(css).toMatch(/\.options-custom-select\s*\{/);
    expect(css).toMatch(/\.options-select-trigger\s*\{/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });
});
