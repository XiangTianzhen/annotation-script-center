# platform-resources 总览

## 目录定位

`platform-resources/` 用于维护各平台资料与平台后端实现。

- 统一后端入口：`platform-resources/backend/server.js`
- 统一路由注册：`platform-resources/backend/registry.js`
- 本目录不存放扩展运行时代码；扩展运行时代码在 `extension/`。
- 当前 AI 消耗标准统一由共享价格配置 `config/pricing/aliyun-bailian-model-pricing.json` 驱动：已接入 AI 服务默认返回统一 `cost` 对象，AI 请求记录 CSV 一律使用中文表头，并按单阶段或多阶段拆列记录 token 与人民币估算。

## 平台资料目录规则

除根级统一后端 `platform-resources/backend/` 外，其余平台目录统一按以下结构收口：

- `platform-resources/<platform>/README.md`
- `platform-resources/<platform>/backend/`
- `platform-resources/<platform>/network/`
- `platform-resources/<platform>/page-structure/`
- `platform-resources/<platform>/<script-id>/`

脚本目录默认结构：

- `README.md`
- `backend/`
- `network/`
- `page-structure/`

仅做平台资料初始化、尚未接入运行时代码的平台可临时例外：

- `platform-resources/<platform>/README.md`
- `platform-resources/<platform>/network/`
- `platform-resources/<platform>/page-structure/`

约束：

- 平台共用后端能力优先放平台根级 `backend/`。
- 平台共用页面结构优先放平台根级 `page-structure/`。
- 平台共用 Network 资料优先放平台根级 `network/`。
- 仅脚本专属后端、词表、页面差异放脚本目录。
- 未实际接入运行时代码前，不提前伪造 `backend/` 或 `<script-id>/` 目录。
- 空目录使用 `.gitkeep`。
- 不写入 token、cookie、authorization、完整签名 URL、真实敏感文本。

## 当前平台

### Alibaba LabelX

- 目录：`platform-resources/alibaba-labelx/`
- 平台共用：
  - `backend/`
  - `network/README.md`
  - `page-structure/README.md`
- 当前共享后端收口：
  - 转写与快判的 `download / suppliers / existing` 已开始复用 `platform-resources/backend/project-data-download/` 下的 LabelX 共享下载 core。
  - 脚本级差异分别收口在各自 `data/adapter.js`。
  - 转写与快判 AI 调用当前都已默认记录脚本级 CSV，并分别开放 `logs/summary` 统计接口；AI 消耗当前统一按共享价格配置返回 `cost` 并导出中文表头 CSV。
- 脚本：
  - `asr-judgement/`
  - `asr-transcription/`

### DataBaker

- 目录：`platform-resources/data-baker/`
- 平台共用（当前为预留目录）：
  - `backend/`
  - `network/`
  - `page-structure/`
- 当前共享后端收口：
  - `export/download` 已开始复用 `platform-resources/backend/project-data-download/` 下的通用 CSV 文件下载 core。
  - 脚本级差异收口在 `round-one-quality/data/adapter.js`。
  - DataBaker 导出字段映射、upload 字段归一、CSV helper、merge helper、latest/history/events 持久化 helper、history 读取 helper、下载 helper 和脱敏样例已开始收口到 `round-one-quality/data/field-mappings.js`、`data/scripts/`、`data/assets/`。
  - DataBaker AI recommend 当前已默认记录脚本级 CSV，并开放 `logs/summary` 统计接口；AI 消耗当前统一按共享价格配置返回 `cost` 并导出中文表头 CSV。
- 脚本：
  - `round-one-quality/`
- 闽南语词表：`platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.csv`

### Magic Data

- 目录：`platform-resources/magic-data/`
- 平台共用：
  - `backend/`
  - `network/`
  - `page-structure/`
- 脚本：
  - `hakka-helper/`
  - `minnan-helper/`
- 旧接口兼容：`/api/magic-data/annotator/ai/*`（转发到客家话助手链路）
- 两个 AI 助手当前都已默认记录脚本级 CSV，并开放 `logs/summary` 统计接口。

### Abaka AI

- 目录：`platform-resources/abaka-ai/`
- 平台共用：
  - `backend/`
  - `network/`（含 `platform.md` 与 `task-page/` 公共请求）
  - `page-structure/`（含 `platform.md`、`actions.md`、`i18n.md`）
- 脚本：
  - `task-page/`
  - `task17/`
  - `task21/`
- `task21/` 当前已默认记录 AI analyze 调用 CSV，并开放 `logs/summary` 统计接口。

### Aishell Tech

- 目录：`platform-resources/aishell-tech/`
- 当前阶段：独立闽南语助手已接入运行时代码与专属后端；平台公共资料和脚本资料继续并行维护。
- 平台资料：
  - `README.md`
  - `network/README.md`
  - `page-structure/README.md`
- 脚本级 AI 日志：
  - `platform-resources/aishell-tech/minnan-helper/data/runtime/ai-calls-YYYY-MM-DD.csv`
- 统计接口：
  - `GET /api/aishell-tech/minnan-helper/ai/recommend/logs/summary`

### DataBaker CVPC

- 目录：`platform-resources/data-baker-cvpc/`
- 当前脚本：
  - `liuzhou-helper/`
- 当前状态：
  - `beta` 首版已接入扩展运行时与独立后端。
  - 规则资产位于 `liuzhou-helper/ai/assets/`。
  - 当前只支持“建议生成 + 人工确认”；真实画段写入契约仍待补采。

## 后端接口边界

- 根级 `platform-resources/backend/` 是统一后端基础设施目录，不按平台模板重排。
- 平台实现通过 `platform-resources/backend/registry.js` 注册。
- 不新增独立后端服务；所有接口由统一后端进程承载。

## 当前迁移文档

- AI 框架设计：`docs/architecture/2026-05-28-platform-resources-ai-framework-design.md`
- AI 框架迁移计划：`docs/architecture/2026-05-28-platform-resources-ai-framework-migration-plan.md`
- Aishell Tech 当前已进入独立闽南语助手运行态，但仍保持与其余平台不同的脚本级日志目录：`data/runtime/`。

## 当前 AI 调用日志覆盖范围

- DataBaker：`/api/data-baker/round-one-quality/ai/recommend/logs/summary`
- DataBaker CVPC：`/api/data-baker-cvpc/liuzhou-helper/ai/recommend/logs/summary`
- Aishell Tech：`/api/aishell-tech/minnan-helper/ai/recommend/logs/summary`
- Magic Data 客家话：`/api/magic-data/hakka-helper/ai/review-current/logs/summary`
- Magic Data 客家话 legacy：`/api/magic-data/annotator/ai/review-current/logs/summary`
- Magic Data 闽南语：`/api/magic-data/minnan-helper/ai/review-current/logs/summary`
- LabelX 快判：`/api/alibaba-labelx/asr-judgement/ai/suggest/logs/summary`
- LabelX 转写：`/api/alibaba-labelx/asr-transcription/ai/suggest-current/logs/summary`
- Abaka Task21：`/api/abaka-ai/task21/ai/analyze/logs/summary`
- 统一查看入口：options 首页隐藏高级区当前已补齐“AI 请求记录”面板，后端聚合接口为：
  - `GET /api/admin/ai-call-log/options`
  - `POST /api/admin/ai-call-log/request`
  - `GET /api/admin/ai-call-log/file?token=...`
  - 当前 `options` 只返回脚本类型，不提前暴露日志存在性与日期范围；日期筛选在导出请求阶段处理。

## 安全边界

- AI 仅作辅助，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
- 日志与文档必须脱敏，不记录敏感凭据和完整签名资源 URL。
- 运行数据目录（如 `statistics-data/`、`export-data/`、`logs/`）仅用于本地/服务器运行，不提交敏感内容。
