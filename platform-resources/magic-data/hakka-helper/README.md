# 客家话助手（Magic Data）资料

本目录只维护客家话助手专属资料。

## 实际文件与职责

- `backend/index.js`：客家话助手后端注册入口。
- `backend/ai-routes.js`：客家话助手 AI 路由；同时注册旧 `annotator` 兼容 API。
- `backend/ai-*.js`：客家话助手 AI 能力实现（模型调用、Prompt、词表、日志、成本估算）。
- `backend/lexicon/hakka-lexicon.csv`：客家话词表（后端运行时读取）。
- `backend/lexicon/客家话-正字表.xlsx`：词表原始来源文件（可选）。
- `backend/tools/convert-hakka-lexicon.js`：词表转换脚本。
- `network/.gitkeep`：当前无助手专属 Network 差异；共用结构见平台根目录 `network/`。
- `page-structure/.gitkeep`：当前无助手专属页面结构差异；共用结构见平台根目录 `page-structure/`。

## 接口

- 新路径：
  - `GET /api/magic-data/hakka-helper/ai/review-current/health`
  - `GET /api/magic-data/hakka-helper/ai/defaults`
  - `POST /api/magic-data/hakka-helper/ai/review-current`
- 兼容旧路径：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `GET /api/magic-data/annotator/ai/defaults`
  - `POST /api/magic-data/annotator/ai/review-current`

## 安全边界

- AI 仅做辅助建议，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
