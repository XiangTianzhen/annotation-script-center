# 杭州话脚本（Magic Data）资料

本目录只维护杭州话脚本专属资料。

## 实际文件与职责

- `ai/adapter.js`：杭州话脚本接入统一 `ai-framework` 的 adapter。
- `ai/assets/README.md`：AI 资产目录占位说明。
- `data/README.md`：脚本级 data 目录占位说明。
- `backend/index.js`：后端注册入口。
- `backend/ai-review-request.js`：请求归一化 helper。
- `backend/ai-*.js`：杭州话 AI 能力实现（模型调用、Prompt、词表、日志、成本估算）。
- `backend/lexicon/README.md`：词表目录与文件约定说明。
- `network/.gitkeep`、`page-structure/.gitkeep`：当前无脚本专属差异，继续复用平台根级资料。

## 对外接口

- `GET /api/magic-data/hangzhou-helper/ai/review-current/health`
- `GET /api/magic-data/hangzhou-helper/ai/defaults`
- `POST /api/magic-data/hangzhou-helper/ai/review-current`
- `GET /api/magic-data/hangzhou-helper/ai/review-current/logs/summary`

说明：

- legacy `/api/magic-data/annotator/*` 继续只归属客家话助手，杭州话不新增 legacy 别名。
- 首版继续复用客家话的响应结构和前端联动方式，不引入新的模型链路。

## 当前实现口径

- 页面范围与客家话保持一致：`#/asrmark`、`#/asrmarkCheck`。
- 右侧 AI 面板、行内填入、原始输出、快捷键、当前页临时全自动链路都保留。
- Prompt、`rulesProfile`、README 文案已切到杭州话语义，但默认模型口径仍先与客家话一致。
- 日志统计继续落在 `backend/logs/` 下，通过统一调用日志格式输出。

## 词表边界

- 当前已接入 `backend/lexicon/hangzhou-lexicon.json` 作为运行时主词表；JSON 内容按用户维护为主。
- 源 Excel `杭州方言正字表0509.xlsx` 与参考 CSV 仍未入库；当前脚本继续只读 JSON 主词表。
- 若词表文件缺失或 JSON 解析失败，后端返回 `lexicon.status=missing`，`review-current` 继续按无词表模式运行。

## 安全边界

- AI 仅做辅助建议，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
- 文档与日志不记录 token、cookie、authorization、完整签名 URL、完整敏感文本。
