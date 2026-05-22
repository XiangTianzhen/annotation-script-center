# Magic Data ANNOTATOR 平台资料

本目录用于维护 Magic Data ANNOTATOR 的平台共用资料与助手专属资料。

## 当前助手

- 客家话助手（脚本 ID：`magicDataAnnotatorAiReview`）
- 闽南语助手（脚本 ID：`magicDataMinnanAssistant`）

## 目录职责

- `backend/`：平台共用后端能力与兼容逻辑（如旧 `annotator` API 兼容）。
- `network/`：平台共用 Network 采集资料（两助手共用，不重复维护）。
- `page-structure/`：平台共用页面结构资料（两助手共用，不重复维护）。
- `hakka-helper/`：客家话助手专属资料（后端实现、词表、专属差异）。
- `minnan-helper/`：闽南语助手专属资料（后端实现、词表、专属差异）。

## 接口口径（统一后端）

- 客家话助手：
  - `GET /api/magic-data/hakka-helper/ai/review-current/health`
  - `GET /api/magic-data/hakka-helper/ai/defaults`
  - `POST /api/magic-data/hakka-helper/ai/review-current`
- 闽南语助手：
  - `GET /api/magic-data/minnan-helper/ai/review-current/health`
  - `GET /api/magic-data/minnan-helper/ai/defaults`
  - `POST /api/magic-data/minnan-helper/ai/review-current`
- 旧路径兼容（映射到客家话助手）：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `GET /api/magic-data/annotator/ai/defaults`
  - `POST /api/magic-data/annotator/ai/review-current`

## 安全边界

- AI 仅做辅助建议，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
- 文档与日志不记录 token、cookie、authorization、完整签名 URL、完整敏感文本。

## 目录治理说明（2026-05-22）

- 已收口平台共用资料到 `network/` 与 `page-structure/`。
- 已移除旧根级散落索引文档，边界内容已并入 `network/09-safety-boundary-rules.md` 与本 README 口径。
- 已移除旧资料目录 `annotator/`、`shared/`，不再作为现行目录入口。
