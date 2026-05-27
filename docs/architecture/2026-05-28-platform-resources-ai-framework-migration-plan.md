# platform-resources AI Framework Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `platform-resources/` 的 AI 后端逐步迁移为统一框架，并补齐协作文档、脚本级 `ai/` / `data/` 目录口径与 Aishell Tech 资料态说明。

**Architecture:** 继续复用 `platform-resources/backend/server.js` 作为统一入口，在 `platform-resources/backend/` 下新增 `ai-framework/` 公共层；各脚本改为“轻量 adapter + assets”模式，外部 API path 保持不变。`data/` 作为脚本级数据逻辑目录独立落地，但上传统计逻辑本轮不合并。

**Tech Stack:** Node.js、原生 CommonJS、Markdown 文档、现有统一后端路由系统

---

## 文件结构基线

本计划涉及的新增或重点修改文件：

- 新增：`docs/architecture/2026-05-28-platform-resources-ai-framework-design.md`
- 新增：`docs/architecture/2026-05-28-platform-resources-ai-framework-migration-plan.md`
- 新增：`platform-resources/backend/ai-framework/**`
- 迁移：`platform-resources/data-baker/round-one-quality/**`
- 迁移：`platform-resources/magic-data/minnan-helper/**`
- 迁移：`platform-resources/magic-data/hakka-helper/**`
- 迁移：`platform-resources/abaka-ai/task21/**`
- 迁移：`platform-resources/alibaba-labelx/asr-transcription/**`
- 迁移：`platform-resources/alibaba-labelx/asr-judgement/**`
- 文档：`AGENTS.md`
- 文档：`README.md`
- 文档：`docs/README.md`
- 文档：`docs/platforms/index.md`
- 文档：`platform-resources/README.md`
- 文档：`log.md`

禁止在第一轮迁移直接动的范围：

- `extension/**`
- `platform-resources/backend/server.js` 的 HTTP server 主体行为
- 现有前端后端地址配置模型
- Aishell Tech 运行时代码目录

### Task 1: 文档基线与协作入口

**Files:**

- Create: `docs/architecture/2026-05-28-platform-resources-ai-framework-design.md`
- Create: `docs/architecture/2026-05-28-platform-resources-ai-framework-migration-plan.md`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `docs/platforms/index.md`
- Modify: `platform-resources/README.md`
- Modify: `platform-resources/aishell-tech/README.md`
- Modify: `platform-resources/aishell-tech/network/README.md`
- Modify: `log.md`

- [ ] **Step 1: 写入设计文档**

写入设计要点：

```text
- 统一 AI framework 目录
- 脚本级 ai/ 与 data/ 结构
- adapter 允许/禁止职责
- 统一 request/response 契约
- Aishell Tech 资料态例外
```

- [ ] **Step 2: 写入迁移计划**

写入分块顺序：

```text
1. 文档基线
2. framework 骨架
3. DataBaker
4. Magic Data Minnan
5. Magic Data Hakka
6. Abaka Task21
7. LabelX AI
8. data 目录归一
```

- [ ] **Step 3: 把文档接入协作入口**

需要在以下文件增加入口：

```text
AGENTS.md
README.md
docs/README.md
docs/platforms/index.md
platform-resources/README.md
platform-resources/aishell-tech/README.md
platform-resources/aishell-tech/network/README.md
log.md
```

- [ ] **Step 4: 运行文档验证**

Run: `git diff --check`
Expected: 只允许 LF/CRLF 警告，不应出现 patch 错误

- [ ] **Step 5: 提交第一块**

```bash
git add AGENTS.md README.md docs/README.md docs/architecture/2026-05-28-platform-resources-ai-framework-design.md docs/architecture/2026-05-28-platform-resources-ai-framework-migration-plan.md platform-resources/README.md log.md docs/platforms/index.md platform-resources/aishell-tech/README.md platform-resources/aishell-tech/network/README.md
git commit -m "文档(architecture): 增加 platform-resources AI 框架迁移基线"
```

### Task 2: 搭 AI Framework 骨架

**Files:**

- Create: `platform-resources/backend/ai-framework/README.md`
- Create: `platform-resources/backend/ai-framework/core/create-ai-route.js`
- Create: `platform-resources/backend/ai-framework/contracts/normalized-request.js`
- Create: `platform-resources/backend/ai-framework/contracts/normalized-response.js`
- Create: `platform-resources/backend/ai-framework/loaders/project-assets.js`
- Create: `platform-resources/backend/ai-framework/runtime/execute-project-pipeline.js`
- Create: `platform-resources/backend/ai-framework/registry/project-ai-registry.js`
- Modify: `platform-resources/backend/README.md`

- [ ] **Step 1: 先定义最小契约文件**

先定义统一导出：

```js
module.exports = {
  createNormalizedRequest,
  createNormalizedResponse,
};
```

- [ ] **Step 2: 增加 route 工厂**

最小骨架：

```js
function createAiRoute(adapter) {
  return async function handleAiRoute(request, response) {
    // read body -> normalize -> load assets -> execute -> respond
  };
}
```

- [ ] **Step 3: 增加资产加载器与 pipeline 执行器**

最小导出：

```js
module.exports = {
  loadProjectAssets,
  executeProjectPipeline,
};
```

- [ ] **Step 4: 先不切旧项目，只让骨架可被 require**

Run: `node --check platform-resources/backend/ai-framework/core/create-ai-route.js`
Expected: 无语法错误

- [ ] **Step 5: 提交第二块**

```bash
git add platform-resources/backend/ai-framework platform-resources/backend/README.md log.md
git commit -m "新增(backend): 搭建 AI framework 骨架"
```

### Task 3: 迁移 DataBaker 为首个 adapter 样板

**Files:**

- Create: `platform-resources/data-baker/round-one-quality/ai/adapter.js`
- Create: `platform-resources/data-baker/round-one-quality/ai/assets/`
- Create: `platform-resources/data-baker/round-one-quality/data/README.md`
- Modify: `platform-resources/data-baker/round-one-quality/backend/index.js`
- Modify: `platform-resources/data-baker/round-one-quality/backend/ai-routes.js`
- Modify: `platform-resources/data-baker/round-one-quality/backend/ai-service.js`
- Modify: `platform-resources/data-baker/round-one-quality/backend/README.md`
- Modify: `platform-resources/data-baker/round-one-quality/README.md`

- [ ] **Step 1: 抽 DataBaker adapter**

adapter 最小结构：

```js
module.exports = {
  projectId: "data-baker/round-one-quality",
  normalizeInput(body) {},
  buildAssetsContext(input, assets) {},
  postProcessResult(result) {},
  exposeProjectResult(result) {},
};
```

- [ ] **Step 2: 让旧 ai-routes.js 只做兼容薄层**

目标状态：

```js
const { createAiRoute } = require("../../../backend/ai-framework/core/create-ai-route");
const adapter = require("../ai/adapter");
```

- [ ] **Step 3: 保留 legacy Omni 快速路径，但把公共能力移交 framework**

保留范围：

```text
DataBaker 专属 prompt / 词表 / legacy omni path / 推荐结果后处理
```

- [ ] **Step 4: 验证 DataBaker 相关文件**

Run: `node --check platform-resources/data-baker/round-one-quality/backend/ai-routes.js`
Expected: 无语法错误

Run: `node --check platform-resources/data-baker/round-one-quality/ai/adapter.js`
Expected: 无语法错误

- [ ] **Step 5: 提交第三块**

```bash
git add platform-resources/data-baker/round-one-quality platform-resources/backend/ai-framework log.md
git commit -m "优化(data-baker): 接入统一 AI framework adapter"
```

### Task 4: 迁移 Magic Data Minnan

**Files:**

- Create: `platform-resources/magic-data/minnan-helper/ai/adapter.js`
- Create: `platform-resources/magic-data/minnan-helper/ai/assets/`
- Create: `platform-resources/magic-data/minnan-helper/data/README.md`
- Modify: `platform-resources/magic-data/minnan-helper/backend/index.js`
- Modify: `platform-resources/magic-data/minnan-helper/backend/ai-routes.js`
- Modify: `platform-resources/magic-data/minnan-helper/backend/ai-service.js`
- Modify: `platform-resources/magic-data/minnan-helper/backend/README.md`
- Modify: `platform-resources/magic-data/minnan-helper/README.md`

- [ ] **Step 1: 对齐 Minnan 三种 pipeline 到统一 adapter**

```text
two_stage + fun-asr
two_stage + qwen omni
omni_single + qwen omni
```

- [ ] **Step 2: 把词表、prompt、schema 迁入 ai/assets**

```text
prompt
rules
schema
lexicon
defaults
```

- [ ] **Step 3: 保持现有 API path 不变**

Run: `node --check platform-resources/magic-data/minnan-helper/backend/ai-routes.js`
Expected: 无语法错误

- [ ] **Step 4: 提交第四块**

```bash
git add platform-resources/magic-data/minnan-helper platform-resources/backend/ai-framework log.md
git commit -m "优化(magic-data): 迁移闽南语助手到统一 AI framework"
```

### Task 5: 迁移 Magic Data Hakka

**Files:**

- Create: `platform-resources/magic-data/hakka-helper/ai/adapter.js`
- Create: `platform-resources/magic-data/hakka-helper/ai/assets/`
- Create: `platform-resources/magic-data/hakka-helper/data/README.md`
- Modify: `platform-resources/magic-data/hakka-helper/backend/index.js`
- Modify: `platform-resources/magic-data/hakka-helper/backend/ai-routes.js`
- Modify: `platform-resources/magic-data/hakka-helper/backend/README.md`
- Modify: `platform-resources/magic-data/hakka-helper/README.md`

- [ ] **Step 1: 保留 `annotator` 兼容路径**

兼容规则：

```text
/api/magic-data/hakka-helper/ai/*
/api/magic-data/annotator/ai/*
```

- [ ] **Step 2: 把 recognition strategy 和默认配置收口到 adapter 元数据**

```js
module.exports = {
  routeAliases: ["magic-data/annotator"],
};
```

- [ ] **Step 3: 验证客家话助手文件**

Run: `node --check platform-resources/magic-data/hakka-helper/backend/ai-routes.js`
Expected: 无语法错误

- [ ] **Step 4: 提交第五块**

```bash
git add platform-resources/magic-data/hakka-helper platform-resources/backend/ai-framework log.md
git commit -m "优化(magic-data): 迁移客家话助手到统一 AI framework"
```

### Task 6: 迁移 Abaka Task21

**Files:**

- Create: `platform-resources/abaka-ai/task21/ai/adapter.js`
- Create: `platform-resources/abaka-ai/task21/ai/assets/`
- Create: `platform-resources/abaka-ai/task21/data/README.md`
- Modify: `platform-resources/abaka-ai/task21/backend/index.js`
- Modify: `platform-resources/abaka-ai/task21/backend/ai-routes.js`
- Modify: `platform-resources/abaka-ai/task21/backend/README.md`
- Modify: `platform-resources/abaka-ai/task21/README.md`

- [ ] **Step 1: 抽象 Task21 两阶段视觉链路**

```text
vision_extract
ocr_extract
reasoning_decide
single_model
```

- [ ] **Step 2: 保留模型白名单和 thinking fallback 规则**

```text
allowed vision models
allowed reasoning models
thinking fallback policy
```

- [ ] **Step 3: 验证 Task21 文件**

Run: `node --check platform-resources/abaka-ai/task21/backend/ai-routes.js`
Expected: 无语法错误

- [ ] **Step 4: 提交第六块**

```bash
git add platform-resources/abaka-ai/task21 platform-resources/backend/ai-framework log.md
git commit -m "优化(abaka-ai): 迁移 Task21 到统一 AI framework"
```

### Task 7: 迁移 LabelX AI

**Files:**

- Create: `platform-resources/alibaba-labelx/asr-transcription/ai/adapter.js`
- Create: `platform-resources/alibaba-labelx/asr-judgement/ai/adapter.js`
- Create: `platform-resources/alibaba-labelx/asr-transcription/data/README.md`
- Create: `platform-resources/alibaba-labelx/asr-judgement/data/README.md`
- Modify: `platform-resources/alibaba-labelx/asr-transcription/backend/ai-routes.js`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/backend/ai-routes.js`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/backend/server.js`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/backend/http-server.js`
- Modify: `platform-resources/alibaba-labelx/asr-transcription/backend/README.md`
- Modify: `platform-resources/alibaba-labelx/asr-judgement/backend/README.md`

- [ ] **Step 1: 只迁 AI，不动统计上传行为**

```text
statistics routes 保持原位
AI routes 改接 framework
```

- [ ] **Step 2: 快判旧独立启动入口保留兼容**

```text
server.js
http-server.js
```

- [ ] **Step 3: 验证 LabelX AI 文件**

Run: `node --check platform-resources/alibaba-labelx/asr-transcription/backend/ai-routes.js`
Expected: 无语法错误

Run: `node --check platform-resources/alibaba-labelx/asr-judgement/backend/ai-routes.js`
Expected: 无语法错误

- [ ] **Step 4: 提交第七块**

```bash
git add platform-resources/alibaba-labelx/asr-transcription platform-resources/alibaba-labelx/asr-judgement platform-resources/backend/ai-framework log.md
git commit -m "优化(alibaba-labelx): 迁移 AI 路由到统一 framework"
```

### Task 8: `data/` 目录归一与下载能力整理

**Files:**

- Create: `platform-resources/*/*/data/adapter.js`
- Create: `platform-resources/*/*/data/scripts/fetch.js`
- Create: `platform-resources/*/*/data/scripts/download.js`
- Create: `platform-resources/*/*/data/assets/`
- Modify: `platform-resources/backend/project-data-download/**`
- Modify: `platform-resources/README.md`
- Modify: `docs/platforms/index.md`

- [ ] **Step 1: 先统一目录，不合并上传统计逻辑**

```text
上传统计继续按平台各自维护
下载能力作为可复用轨道整理
```

- [ ] **Step 2: 让可复用下载逻辑逐步接入 project-data-download**

最小原则：

```text
统一下载认证/审计
项目保持各自字段映射
供应商分流继续由项目 adapter 决定
```

- [ ] **Step 3: 同步 README 与平台索引**

Run: `git diff --check`
Expected: 无 patch 错误

- [ ] **Step 4: 提交第八块**

```bash
git add platform-resources/backend/project-data-download platform-resources/README.md docs/platforms/index.md log.md
git commit -m "优化(data): 归一脚本级 data 目录与下载能力"
```

## 自检

- 设计与计划是否覆盖 AI framework、adapter、`ai/` / `data/` 目录、Aishell Tech 资料态和逐块提交要求。
- 计划中的文件路径是否都落在真实目录下。
- 第一轮是否避免误把 `extension/` 与上传统计重构卷入 AI 迁移。
