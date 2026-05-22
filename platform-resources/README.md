# platform-resources 总览

## 目录定位

`platform-resources/` 用于维护各平台资料与平台后端实现。

- 统一后端入口：`platform-resources/backend/server.js`
- 统一路由注册：`platform-resources/backend/registry.js`
- 本目录不存放扩展运行时代码；扩展运行时代码在 `extension/`。

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

约束：

- 平台共用后端能力优先放平台根级 `backend/`。
- 平台共用页面结构优先放平台根级 `page-structure/`。
- 平台共用 Network 资料优先放平台根级 `network/`。
- 仅脚本专属后端、词表、页面差异放脚本目录。
- 空目录使用 `.gitkeep`。
- 不写入 token、cookie、authorization、完整签名 URL、真实敏感文本。

## 当前平台

### Alibaba LabelX

- 目录：`platform-resources/alibaba-labelx/`
- 平台共用：
  - `backend/`
  - `network/README.md`
  - `page-structure/README.md`
- 脚本：
  - `asr-judgement/`
  - `asr-transcription/`

### DataBaker

- 目录：`platform-resources/data-baker/`
- 平台共用（当前为预留目录）：
  - `backend/`
  - `network/`
  - `page-structure/`
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

## 后端接口边界

- 根级 `platform-resources/backend/` 是统一后端基础设施目录，不按平台模板重排。
- 平台实现通过 `platform-resources/backend/registry.js` 注册。
- 不新增独立后端服务；所有接口由统一后端进程承载。

## 安全边界

- AI 仅作辅助，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
- 日志与文档必须脱敏，不记录敏感凭据和完整签名资源 URL。
- 运行数据目录（如 `statistics-data/`、`export-data/`、`logs/`）仅用于本地/服务器运行，不提交敏感内容。
