# platform-resources 总览

`platform-resources/` 用于维护各平台资料、脚本后端实现和统一后端入口。

## 文档入口

- 项目规则：[`../AGENTS.md`](../AGENTS.md)
- 项目导航：[`../README.md`](../README.md)
- 扩展源码说明：[`../extension/README.md`](../extension/README.md)
- 统一后端说明：[`backend/README.md`](backend/README.md)
- 平台与脚本索引：[`../docs/platforms-index.md`](../docs/platforms-index.md)
- 百炼官方文档入口：[`../docs/external-docs-aliyun-bailian.md`](../docs/external-docs-aliyun-bailian.md)
- 配置说明：[`../config/README.md`](../config/README.md)

## 安装 / 部署入口

- 本地加载扩展、打包、发布入口：[`../README.md`](../README.md)
- 后端部署、PM2、环境变量入口：[`backend/README.md`](backend/README.md)
- CRX 打包配置：[`../config/README.md`](../config/README.md)
- 企业托管自动安装现状：[`../docs/unfinished-crx-enterprise-managed-install.md`](../docs/unfinished-crx-enterprise-managed-install.md)

## 目录边界

- `platform-resources/backend/`
  - 统一后端入口、路由注册、公共 AI / 下载 / 管理能力
- `platform-resources/<platform>/`
  - 平台总览、共用资料、共用后端、脚本资料
- 平台目录默认优先使用：
  - `README.md`
  - `backend/`
  - `network/`
  - `page-structure/`
  - `<script-id>/`
- 单脚本目录默认优先使用：
  - `README.md`
  - `backend/`
  - `network/`
  - `page-structure/`

## 参考文档规则

- `network/` 与 `page-structure/` 只保留稳定参考文档，不保留过程型会话记录。
- 目录里存在多份稳定参考页时，`README.md` 只做索引；目录里只有单份稳定参考时，允许直接由该单页承载。
- 空占位目录继续只保留 `.gitkeep`，不为了形式补 README。
- 过程型文件不再写进主参考目录：
  - `pending-capture.md`
  - `next-session-handoff.md`
  - `playwright/devtools/readonly/retest` 一类复测记录
- 历史过程统一写入 `log.md`；当前边界写回对应 README 或稳定参考页。

### 索引 README 模板

- 固定章节：
  - `目录定位`
  - `适用范围 / 当前覆盖`
  - `文件列表`
  - `阅读顺序`
  - `通用约定`
  - `当前边界 / 待补项`

### Network 单页模板

- 固定章节：
  - `请求标识 / 目的`
  - `页面入口 / 触发动作`
  - `请求摘要`
  - `请求体摘要`
  - `响应摘要`
  - `关键字段`
  - `前端接入建议`
  - `风险 / 未确认项`

### Page-structure 单页模板

- 固定章节：
  - `页面标识 / 路由 / 前置条件`
  - `页面总览`
  - `DOM 树 / 区域结构`
  - `稳定选择器表`
  - `动态区域 / 重渲染风险`
  - `可挂载点建议`
  - `页面区域与接口映射`
  - `写操作边界 / 未确认项`

### 通用写法

- 只写当前有效结论，不写日期型历史流水。
- 章节顺序和字段命名保持固定，方便 AI 和人工快速扫读。
- 必须明确稳定锚点、禁止依赖项、脱敏规则和未确认边界。

## 当前平台入口

### Alibaba LabelX

- 目录：`platform-resources/alibaba-labelx/`
- 平台共用资料：
  - `backend/`
  - `network/README.md`
  - `page-structure/README.md`
- 脚本：
  - `asr-judgement/`
  - `asr-transcription/`

### DataBaker

- 目录：`platform-resources/data-baker/`
- 平台共用资料：
  - `backend/`
  - `network/`
  - `page-structure/`
- 脚本：
  - `round-one-quality/`

### DataBaker CVPC

- 目录：`platform-resources/data-baker-cvpc/`
- 平台共用资料：
  - `network/`
  - `page-structure/`
- 脚本：
  - `liuzhou-helper/`

### Magic Data

- 目录：`platform-resources/magic-data/`
- 平台共用资料：
  - `backend/`
  - `network/`
  - `page-structure/`
- 脚本：
  - `hakka-helper/`
  - `minnan-helper/`
  - `hangzhou-helper/`

### Abaka AI

- 目录：`platform-resources/abaka-ai/`
- 平台共用资料：
  - `backend/`
  - `network/`
  - `page-structure/`
- 脚本：
  - `task-page/`
  - `task17/`
  - `task21/`

### ByteDance AIDP

- 目录：`platform-resources/bytedance-aidp/`
- 平台共用资料：
  - `network/README.md`
  - `page-structure/README.md`
- 脚本：
  - `jinhua-helper/`
  - `suzhou-helper/`

### Aishell Tech

- 目录：`platform-resources/aishell-tech/`
- 平台共用资料：
  - `network/README.md`
  - `page-structure/README.md`
- 脚本：
  - `minnan-helper/`
  - `vietnamese-helper/`
  - `thai-helper/`
  - `cn-en-short-drama/`

## 统一后端边界

- 不新增独立后端服务；所有接口由统一后端进程承载。
- 平台实现通过 `platform-resources/backend/registry.js` 注册。
- 公共 AI 能力、公共下载能力、管理接口优先收口到 `platform-resources/backend/`。
- 平台特有逻辑优先放在对应平台或脚本目录，再通过 registry 接入统一后端。

## AI 与日志当前口径

- 共享价格配置：`config/aliyun-bailian-model-pricing.json`
- 已接入 AI 服务的脚本默认返回统一 `cost` 对象。
- AI 请求记录 CSV 默认使用中文表头。
- 详细接口、日志目录与脚本差异继续查看对应平台 / 脚本 README。

## 说明

- 本 README 只保留目录契约和入口。
- 各平台当前能力、接口、页面差异、后端细则统一下钻到对应 README。
- 历史过程、迁移记录、热修流水统一查看 `log.md`。
