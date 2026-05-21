# Magic Data ANNOTATOR 平台资料

本目录承载 Magic Data 平台级资料与助手级资料。

## 目录结构

- `page-structure.md`：平台通用页面结构索引。
- `network.md`：平台通用网络采集索引。
- `safety-boundary.md`：统一安全边界。
- `shared/`：平台共享规范与公共说明。
- `hakka-helper/`：客家话助手资料与后端实现。
- `minnan-helper/`：闽南语助手资料与后端实现。
- `annotator/backend/index.js`：旧路径兼容别名（转发到客家话助手后端）。

## 当前助手

- 客家话助手（脚本 ID：`magicDataAnnotatorAiReview`）
- 闽南语助手（脚本 ID：`magicDataMinnanAssistant`）

## 接口入口（统一后端）

- 兼容旧接口：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `GET /api/magic-data/annotator/ai/defaults`
  - `POST /api/magic-data/annotator/ai/review-current`
- 客家话助手：
  - `GET /api/magic-data/hakka-helper/ai/review-current/health`
  - `GET /api/magic-data/hakka-helper/ai/defaults`
  - `POST /api/magic-data/hakka-helper/ai/review-current`
- 闽南语助手：
  - `GET /api/magic-data/minnan-helper/ai/review-current/health`
  - `GET /api/magic-data/minnan-helper/ai/defaults`
  - `POST /api/magic-data/minnan-helper/ai/review-current`

## 本轮采集说明（2026-05-21）

- 已采：`#/mark/list` 任务列表结构与接口。
- 已采：`#/asrmark` 页面容器与关键区域锚点（列表、说话人、保存/提交按钮区域）。
- 未完整采到：`#/asrmark` 全量稳定网络链路与差异字段（待补）。
- 所有记录按脱敏口径维护，不落库 token/cookie/完整签名 URL/真实文本。
