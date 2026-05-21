# 客家话助手（Magic Data）资料

## 作用

客家话助手用于 Magic Data `#/asrmark` 当前条 AI 复核辅助。

## 前端入口

- `extension/sites/magic-data/hakka-helper/content.js`
- 共享模块：`extension/sites/magic-data/shared/`

## 后端入口

- `platform-resources/magic-data/hakka-helper/backend/`
- 新接口：
  - `GET /api/magic-data/hakka-helper/ai/review-current/health`
  - `GET /api/magic-data/hakka-helper/ai/defaults`
  - `POST /api/magic-data/hakka-helper/ai/review-current`
- 兼容旧接口：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `GET /api/magic-data/annotator/ai/defaults`
  - `POST /api/magic-data/annotator/ai/review-current`

## 词表

- `platform-resources/magic-data/hakka-helper/lexicon/hakka-lexicon.csv`

## 约束

- AI 仅做辅助建议，不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。
