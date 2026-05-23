# 闽南语助手（Magic Data）资料

本目录只维护闽南语助手专属资料。

## 实际文件与职责

- `backend/index.js`：闽南语助手后端注册入口。
- `backend/ai-routes.js`：闽南语助手 AI 路由注册。
- `backend/ai-*.js`：闽南语助手 AI 能力实现（模型调用、Prompt、词表、日志、成本估算）。
- `backend/lexicon/minnan-lexicon.csv`：闽南语词表（后端运行时读取）。
- `backend/tools/convert-hakka-lexicon.js`：闽南语词表转换脚本（文件名保留兼容，输入输出已是闽南语词表）。
- `network/.gitkeep`：当前无助手专属 Network 差异；共用结构见平台根目录 `network/`。
- `page-structure/.gitkeep`：当前无助手专属页面结构差异；共用结构见平台根目录 `page-structure/`。

## 接口

- `GET /api/magic-data/minnan-helper/ai/review-current/health`
- `GET /api/magic-data/minnan-helper/ai/defaults`
- `POST /api/magic-data/minnan-helper/ai/review-current`

## AI 链路

- `two_stage + fun-asr`：Fun-ASR 听音 + compare 模型复核。
- `two_stage + Qwen Omni`：Qwen Omni 听音 + compare 模型复核。
- `omni_single + Qwen Omni`：单模型完成听音与两行文本复核。
- 输出结构以“三项预测质检”为主：
  - `speakerCheck`（性别/年龄）
  - `dialectTextCheck`（闽南语文本）
  - `mandarinTextCheck`（普通话文本）
  - `overall`（结论/摘要）
- 同时兼容 Magic Data 旧面板字段：`recommendations.*`、`audioCheck.*`、`textRuleCheck.*`，并保留 `listen/comparison/verdict` legacy 字段。

## 说话人数据来源

- 优先读取 `annotateDetailInfo` 的 `base_speak + mark_info[].speak_people` 映射关系。
- 前端 DOM fallback 仅允许读取已选 radio（`.el-radio.is-checked` 或 `aria-checked=true`），避免通过选项文本误判。

## 词表与环境变量

- 闽南语词表：`backend/lexicon/minnan-lexicon.csv`（不依赖 DataBaker 运行时路径）。
- 环境变量优先级：`MAGIC_DATA_MINNAN_AI_*` > `MAGIC_DATA_AI_*`。
- `DASHSCOPE_API_KEY` / `DASHSCOPE_BASE_URL` 仍是统一 provider 配置。

## 安全边界

- AI 仅做辅助建议，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
