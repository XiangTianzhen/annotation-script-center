# Magic Data ANNOTATOR 平台资料

本目录用于维护 Magic Data ANNOTATOR 的平台共用资料与助手专属资料。

## 当前助手

- 客家话助手（脚本 ID：`magicDataAnnotatorAiReview`）
- 闽南语助手（脚本 ID：`magicDataMinnanAssistant`）
- 同平台互斥启用：同一时刻只允许一个助手处于启用状态；启用一个时会自动关闭另一个。

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
  - 默认评测落地：`two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`，`enable_thinking=false`
- 闽南语助手：
  - `GET /api/magic-data/minnan-helper/ai/review-current/health`
  - `GET /api/magic-data/minnan-helper/ai/defaults`
  - `POST /api/magic-data/minnan-helper/ai/review-current`
  - 模型方案（`modelMode`）：`two_stage`（`fun-asr` / Qwen Omni 听音）与 `omni_single`（Qwen Omni 单模型）
  - 识别策略（`recognitionStrategy`）：`direct_dialect`、`mandarin_to_dialect`（先普通话识别再词表转换）
  - legacy 兼容：`recognition_convert` 仅作为旧字段映射，不再作为前端同级模型方案展示
  - 业务语义：三项预测质检（说话人书写、闽南语内容、普通话文本）
- 旧路径兼容（映射到客家话助手）：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `GET /api/magic-data/annotator/ai/defaults`
  - `POST /api/magic-data/annotator/ai/review-current`

## 平台共用与助手差异

- 页面结构与 Network 资料统一维护在平台根级 `page-structure/` 与 `network/`。
- 客家话与闽南语助手共享平台结构采集能力，但模型配置、词表、Prompt 与后端 profile 独立维护。
- 闽南语助手展示改为“左侧页面基础信息 + 右侧 AI 面板”：
  - 不再创建左侧独立大摘要框，避免空白占位；说话人建议直接插入“说话人属性”表单项。
  - 右侧 AI 面板保留总结论与三项质检结果，三块详情（说话人属性/闽南语内容/普通话文本）独立折叠。
  - 行内建议与说话人建议按 task 幂等更新，避免 hover 场景下节点反复重建。
  - 三块详情折叠状态按 `taskItemId + section` 记忆，避免点击后被刷新流程回收。
  - 文本行与说话人属性都支持行内 AI 建议；正确项不显示填入按钮。
  - 支持“全部填入AI推荐”，仅填需要修改的项，不自动保存/提交。

## 安全边界

- AI 仅做辅助建议，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
- 文档与日志不记录 token、cookie、authorization、完整签名 URL、完整敏感文本。

## 目录治理说明（2026-05-22）

- 已收口平台共用资料到 `network/` 与 `page-structure/`。
- 已移除旧根级散落索引文档，边界内容已并入 `network/09-safety-boundary-rules.md` 与本 README 口径。
- 已移除旧资料目录 `annotator/`、`shared/`，不再作为现行目录入口。
