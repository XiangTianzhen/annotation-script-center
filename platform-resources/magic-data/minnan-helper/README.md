# 闽南语助手（Magic Data）资料

## 作用

闽南语助手用于 Magic Data `#/asrmark` 当前条 AI 复核辅助。

## 前端入口

- `extension/sites/magic-data/minnan-helper/content.js`
- 可复用平台共享模块：`extension/sites/magic-data/shared/`

## 后端入口

- `platform-resources/magic-data/minnan-helper/backend/`
- `GET /api/magic-data/minnan-helper/ai/review-current/health`
- `GET /api/magic-data/minnan-helper/ai/defaults`
- `POST /api/magic-data/minnan-helper/ai/review-current`

## 词表

- `platform-resources/magic-data/minnan-helper/lexicon/minnan-lexicon.csv`
- 词表示例来源：DataBaker 闽南语词表（用于初始化），后续独立在本目录维护。

## 约束

- AI 仅做辅助建议，不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。
