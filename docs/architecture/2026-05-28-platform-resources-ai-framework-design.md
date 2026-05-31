# platform-resources AI Framework 设计

## 目标

本设计用于把 `platform-resources/` 当前分散的 AI 后端实现，收口为“一套统一框架 + 每个项目一个轻量 adapter + 一组项目资产目录”。

本轮固定目标：

- 统一 AI 后端执行流、provider 调度、缓存、队列、超时、重试、脱敏日志和公共响应结构。
- 保留现有 API path，不要求前端同时改地址。
- 每个脚本目录只保留少量 adapter 代码和 prompt/schema/lexicon/rules 资产。
- 每个脚本目录新增与 `ai/` 同级的 `data/`，用于放数据脚本、字段映射、下载逻辑和脱敏样例。
- `network/`、`page-structure/` 继续按阿里系资料规范维护 Markdown 文档。
- Aishell Tech 当前处于正式接入准备态：核心标注链路资料已足够支撑首阶段运行时代码开发，但尚无运行时代码与专属后端注册，因此仍不进入本轮 AI 迁移主线。

## 当前现状

当前 `platform-resources/` 同时混合了三类内容：

1. 根级统一后端：
   - `platform-resources/backend/server.js`
   - `platform-resources/backend/registry.js`
   - `platform-resources/backend/ai/*`
2. 各平台 / 各脚本后端：
   - `data-baker/round-one-quality/backend/*`
   - `magic-data/*/backend/*`
   - `abaka-ai/task21/backend/*`
   - `alibaba-labelx/*/backend/*`
3. 平台资料：
   - `network/*.md`
   - `page-structure/*.md`
   - 平台与脚本 README

当前最大问题不是“没有统一入口”，而是“统一入口只管启动，公共 AI 能力还没有真正收口”。

典型重复包括：

- 请求体读取与 requestId 生成
- AI 参数白名单与默认值归一
- `health/defaults` 响应格式
- debug raw JSON 暂存与脱敏
- provider 选择与错误包装
- prompt / schema / lexicon / rules 的分散加载

## 设计原则

- 不推翻现有统一后端入口；继续使用 `platform-resources/backend/server.js`。
- 不强行把所有项目压成纯配置；保留轻量 adapter，允许项目表达少量差异。
- 不把上传统计逻辑硬合并；LabelX 统计、DataBaker 导出等仍按项目维护。
- 可统一的“下载 CSV / 获取文件”能力后置到 `data/` 轨道处理。
- 运行数据不混入源码目录；源码只保留 `runtime/.gitkeep` 或 README 说明。

## 目标目录结构

### 统一 AI 框架

```text
platform-resources/
  backend/
    ai-framework/
      core/
      contracts/
      runtime/
      providers/
      loaders/
      registry/
      README.md
```

职责固定为：

- `core/`：统一 AI 执行流和 route 工厂。
- `contracts/`：统一 request/response 契约与错误对象。
- `runtime/`：队列、缓存、超时、重试、debug store、脱敏日志。
- `providers/`：对接 `qwen-openai-compatible`、`funasr-rest`、`funasr-python`。
- `loaders/`：加载 prompt、schema、rules、lexicon、defaults。
- `registry/`：把脚本 adapter 注册到统一框架，不改外部 API path。

### 脚本目录

```text
platform-resources/<platform>/<script-id>/
  README.md
  ai/
    adapter.js
    assets/
      prompt.md
      rules.md
      schema.json
      defaults.js
      lexicon/
  data/
    adapter.js
    scripts/
      fetch.js
      download.js
    assets/
      schema/
      mappings/
      samples/
    runtime/
      .gitkeep
  network/
  page-structure/
```

约束：

- `ai/` 只放 AI adapter 与 AI 资产，不再保留大块 `ai-routes.js + ai-service.js` 长期并存。
- `data/` 只放数据逻辑代码、字段映射、脱敏样例和 runtime 占位；真实导出文件仍进入被忽略的运行目录。
- `network/` 与 `page-structure/` 继续使用 Markdown，按阿里巴巴页面结构与请求口径维护。

## 统一契约

### 输入契约

框架内部统一使用 `NormalizedAiRequest`：

- `requestId`
- `platform`
- `scriptId`
- `routeKey`
- `input`
- `projectOptions`
- `debugOptions`
- `runtimeContext`

项目 adapter 只负责：

- 字段映射
- 少量项目特有校验
- 识别项目需要的 `input`
- 把旧字段兼容转成统一输入

### 输出契约

统一返回公共字段：

- `success`
- `requestId`
- `platform`
- `scriptId`
- `routeKey`
- `models`
- `usage`
- `timing`
- `cache`
- `debug`
- `notes`

项目差异只进入 `projectResult`。

这样可以保持：

- options 的 `defaults/health` 接口结构一致
- 前端脚本只关心自己的 `projectResult`
- debug / usage / timing 等公共字段长期复用

## Adapter 边界

项目 adapter 允许做的事只有四类：

1. `normalizeInput`
2. `buildAssetsContext`
3. `postProcessResult`
4. `exposeProjectResult`

项目 adapter 不再直接负责：

- 自己读 HTTP body
- 自己生成 requestId
- 自己创建 provider queue
- 自己管理通用缓存
- 自己拼 `health/defaults` 公共响应
- 自己管理通用 debug store

## 执行流

统一执行流固定为：

1. 路由入口命中脚本 adapter
2. 框架读取请求体并生成 `requestId`
3. adapter 做 `normalizeInput`
4. loaders 读取 prompt / schema / rules / lexicon / defaults
5. framework 选择 pipeline 与 provider
6. runtime 执行队列、缓存、重试、超时与日志
7. 框架解析模型输出并做统一 schema 校验
8. adapter 做 `postProcessResult`
9. 框架组装统一响应
10. `projectResult` 回给前端

`health/defaults` 也走统一框架，但只读 adapter 元数据和 defaults 资产，不再让每个项目重复造一套。

## 项目与迁移顺序

本轮纳入统一框架的 AI 项目：

- `platform-resources/data-baker/round-one-quality`
- `platform-resources/magic-data/minnan-helper`
- `platform-resources/magic-data/hakka-helper`
- `platform-resources/abaka-ai/task21`
- `platform-resources/alibaba-labelx/asr-transcription`
- `platform-resources/alibaba-labelx/asr-judgement`

推荐顺序：

1. DataBaker
2. Magic Data Minnan
3. Magic Data Hakka
4. Abaka Task21
5. LabelX ASR Transcription
6. LabelX ASR Judgement

原因：

- DataBaker 已经最接近统一 AI 基座，适合作为首个 adapter 样板。
- Magic Data 两个项目结构相近，适合连续迁移。
- Abaka Task21 单脚本清晰，但视觉两阶段链路需要独立 adapter。
- LabelX 仍有统计与 AI 混排，放后面更稳。

## data 目录定位

`data/` 是脚本级数据逻辑目录，不等于运行数据目录。

当前约束：

- 上传统计不强行合并。
- 可复用的下载能力后续统一抽到 `platform-resources/backend/project-data-download/` 或其扩展模块。
- 脱敏样例、字段映射和下载脚本保留在脚本自己的 `data/` 下。
- 真正下载出的 CSV、JSON、审计日志继续保留在 `.gitignore` 保护的运行目录。

## Aishell Tech 定位

`platform-resources/aishell-tech/` 当前处于正式接入准备态，但本轮仍不接入：

- `extension/sites/aishell-tech/`
- `platform-resources/aishell-tech/backend/`
- 统一后端注册

本轮只要求：

- 协作者继续维护 `README.md`
- 补齐 `network/*.md`
- 补齐 `page-structure/*.md`

后续若 Aishell Tech 开始落运行时代码，再按本设计补齐 `ai/`、`data/`、`network/`、`page-structure/`。

## 非目标

本轮明确不做：

- 不重写统一后端 HTTP server
- 不改前端后端地址配置模型
- 不合并 LabelX 与 DataBaker 的上传统计逻辑
- 统一默认 AI 返回链路改为“短请求创建 async job + HTTP 轮询结果”
  - 不引入 SSE / WebSocket 作为本轮默认返回通道
- 不在本轮 AI 迁移中顺手把 Aishell Tech 从“正式接入准备态”直接升级成运行时代码平台

## 提交策略

迁移采用“一个板块一提交”：

1. 文档与迁移基线
2. AI framework 骨架
3. DataBaker adapter
4. Magic Data Minnan adapter
5. Magic Data Hakka adapter
6. Abaka Task21 adapter
7. LabelX AI adapters
8. `data/` 目录归一与下载能力整理

每块都要求：

- 先做最小验证
- 再提交
- 保持可回退
