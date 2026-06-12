# Liuzhou Text Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize final Liuzhou dialect answers and smooth Mandarin output for the DataBaker CVPC Liuzhou helper without changing raw listening fields.

**Architecture:** Keep raw listening output unchanged, then extend the refine-layer post-processing in `ai-service.js`. Apply deterministic dialect normalization to `refinedDialectText/refinedDialectTokens` and conservative disfluency cleanup to `refinedMandarinText`, backed by direct unit tests.

**Tech Stack:** Node.js, CommonJS, `node:test`, existing backend AI service pipeline

---

### Task 1: Write spec and plan artifacts

**Files:**
- Create: `docs/superpowers/specs/2026-06-12-liuzhou-text-normalization-design.md`
- Create: `docs/superpowers/plans/2026-06-12-liuzhou-text-normalization.md`

- [x] **Step 1: Write the design spec**

Document:

- final-answer-only scope
- dialect normalization targets: `去 -> 克`, `哩 -> 滴`, `更 -> 哏`
- Mandarin smoothing examples and safety boundaries

- [x] **Step 2: Write the implementation plan**

Document:

- exact code touch points
- tests to add
- docs to update

### Task 2: Add failing backend tests

**Files:**
- Create: `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`

- [ ] **Step 1: Write tests for dialect normalization helpers**

Add tests covering:

```js
assert.equal(result.refinedDialectText, "哏要紧克啊。");
assert.deepEqual(result.refinedDialectTokens, [
  { type: "text", content: "哏要紧克啊。" },
]);
```

and:

```js
assert.equal(result.refinedDialectText, "我困困滴没想克。");
```

- [ ] **Step 2: Write tests for Mandarin smoothing**

Add tests covering:

```js
assert.equal(
  result.refinedMandarinText,
  "所以说我在家里面一天，那个，这个女婿一天煮那种辣的，弄得我吃得，吃得我肚子都痛完了。"
);
```

and a guard test:

```js
assert.match(result.refinedMandarinText, /吃得，吃得/);
```

- [ ] **Step 3: Run test file to verify failure**

Run: `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`

Expected: FAIL before implementation because helper behavior does not exist yet.

### Task 3: Implement refine-layer text normalization

**Files:**
- Modify: `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
- Test: `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`

- [ ] **Step 1: Strengthen refine prompt**

Add explicit rules for:

```text
普通话顺滑需删除结巴、拉长重复、口误类非必要内容；
最终柳州话标准写法优先使用 克、滴、哏。
```

- [ ] **Step 2: Implement dialect normalization helpers**

Add minimal helpers that normalize final dialect output only:

```js
function normalizeFinalDialectStandardForms(text) {
  return text
    .replace(/去(?=[啊呀啦咯啵嘛呢呗，。？！；]|$)/g, "克")
    .replace(/去(?=找)/g, "克")
    .replace(/哩/g, "滴")
    .replace(/更(?=子|要紧|样|个|样子|样样|多|是)/g, "哏");
}
```

and rebuild `refinedDialectTokens` from the normalized final text when no tag tokens need preservation.

- [ ] **Step 3: Implement conservative Mandarin smoothing helpers**

Add helper logic that:

```js
text = text.replace(/([这那][个种样])\1/g, "$1");
text = text.replace(/([辣])\1{1,}(的)/g, "$1$2");
```

Keep the implementation conservative and avoid cross-comma deletion.

- [ ] **Step 4: Wire helpers into `normalizeRefineStageOutput()`**

Apply order:

1. normalize dialect tags and punctuation
2. normalize final dialect standard forms
3. normalize Mandarin plain text
4. smooth Mandarin disfluencies
5. restore Mandarin particles from dialect tags

- [ ] **Step 5: Export helpers through `__testOnly` if needed**

Expose only minimal helper surface needed for tests.

- [ ] **Step 6: Run targeted tests**

Run: `node --test platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`

Expected: PASS

### Task 4: Run regression checks

**Files:**
- Modify: `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
- Test: `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
- Test: `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`

- [ ] **Step 1: Run syntax check**

Run: `node --check platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`

Expected: no output

- [ ] **Step 2: Run existing CVPC content regression tests**

Run: `node --test extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`

Expected: PASS

- [ ] **Step 3: Run existing CVPC UI regression tests**

Run: `node --test extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`

Expected: PASS

### Task 5: Update docs

**Files:**
- Modify: `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
- Modify: `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
- Modify: `log.md`

- [ ] **Step 1: Update backend/script README**

Document:

- final-answer-only normalization scope
- dialect standard forms
- Mandarin smoothing behavior

- [ ] **Step 2: Update runtime README**

Document that raw listening reference remains unchanged and only final recommendation is normalized.

- [ ] **Step 3: Append log entry**

Add a dated entry summarizing the Liuzhou refine-layer normalization changes.

### Task 6: Final verification and git operations

**Files:**
- Modify: all changed files above

- [ ] **Step 1: Inspect git status**

Run: `git status --short`

Expected: only intended files changed

- [ ] **Step 2: Stage and commit**

Run:

```bash
git add docs/superpowers/specs/2026-06-12-liuzhou-text-normalization-design.md docs/superpowers/plans/2026-06-12-liuzhou-text-normalization.md platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js platform-resources/data-baker-cvpc/liuzhou-helper/README.md extension/sites/data-baker-cvpc/liuzhou-helper/README.md log.md
git commit -m "优化(data-baker-cvpc): 收口柳州话最终文本标准写法与普通话顺滑"
```

- [ ] **Step 3: Push**

Run: `git push origin main`

Expected: push succeeds
