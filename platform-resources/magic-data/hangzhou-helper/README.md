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
- 默认 `direct_dialect` 的听音阶段只读取音频与必要任务元数据，不读取平台文本、说话人已有值或词表；比较阶段再读取平台基线做质检。
- 杭州话原文按“听到什么写什么”处理：普通话含义不能反向触发杭州话词形；只有听音杭州话词形命中统一用字或可接受写法时，才允许用词表确认规范字形。
- “音频是否是纯方言” 当前按宽松规则判断：只要音频里出现明显杭州话/方言字词、方言说法或方言读法，就优先按 `纯方言`；只有整段基本都在说普通话时才按 `口音普通话`。
- 日志统计继续落在 `backend/logs/` 下，通过统一调用日志格式输出。

## 词表边界

- 当前已接入 `backend/lexicon/hangzhou-lexicon.json` 作为运行时主词表；JSON 内容按用户维护为主。
- `direct_dialect` 只按听音杭州话词形匹配词表，用于普通话释义和已有读音证据下的规范字形确认；例如听到“现在”时不能仅因词表对应“葛毛”而改写。
- 手动 `mandarin_to_dialect` 继续允许从普通话命中词表并生成杭州话文本。
- 源 Excel `杭州方言正字表0509.xlsx` 与参考 CSV 仍未入库；当前脚本继续只读 JSON 主词表。
- 若词表文件缺失或 JSON 解析失败，后端返回 `lexicon.status=missing`，`review-current` 继续按无词表模式运行。

## 安全边界

- AI 仅做辅助建议，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
- 文档与日志不记录 token、cookie、authorization、完整签名 URL、完整敏感文本。
