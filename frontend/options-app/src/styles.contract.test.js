import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const css = fs.readFileSync(path.resolve(process.cwd(), "src/styles.css"), "utf8");

describe("options style contracts", () => {
  test("button-like links remove underlines in every interaction state", () => {
    expect(css).toMatch(
      /\.workspace-nav-button[^}]*\.detail-back-link[^}]*\.platform-link-pill[\s\S]*?text-decoration:\s*none/
    );
    expect(css).toMatch(/\.platform-link-pill:visited/);
    expect(css).toMatch(/\.platform-link-pill:hover/);
    expect(css).toMatch(/\.platform-link-pill:focus/);
  });

  test("platform address reserves a separate arrow column", () => {
    expect(css).toMatch(/\.platform-link-pill\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/s);
    expect(css).toMatch(/\.platform-link-path\s*\{/);
    expect(css).toMatch(/\.platform-link-mark\s*\{[^}]*align-self:\s*start/s);
  });

  test("long setting titles keep their help dot in the same flex row", () => {
    expect(css).toMatch(/\.field-title-row\s*\{[^}]*flex-wrap:\s*nowrap/s);
    expect(css).toMatch(/\.field-title-row \.inline-help-anchor\s*\{[^}]*flex:\s*0 0 auto/s);
  });
});
