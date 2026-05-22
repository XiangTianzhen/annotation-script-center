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

## 安全边界

- AI 仅做辅助建议，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
