# Aishell Tech 闽南语助手

## 目录职责

- `ai/adapter.js`：Aishell 请求体到统一 AI 框架的归一映射。
- `backend/`：Aishell 独立 AI recommend 路由与 DataBaker 推荐链路适配层。
- `data/`：脚本资料与后续样例占位。

## 当前范围

- 仅服务 `https://mark.aishelltech.com/mytask/mark?...` 的闽南语推荐文本助手。
- 接口独立为 `/api/aishell-tech/minnan-helper/ai/recommend*`。
- Prompt、模型白名单、并发默认值参考 DataBaker round-one-quality。
