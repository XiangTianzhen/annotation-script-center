# Aishell Tech 闽南语助手

## 目录职责

- `ai/adapter.js`：Aishell 请求体到统一 AI 框架的归一映射。
- `backend/`：Aishell 独立 AI recommend 路由与 DataBaker 推荐链路适配层。
- `data/`：脚本资料与后续样例占位。

## 当前范围

- 仅服务 `https://mark.aishelltech.com/mytask/mark?...` 的闽南语推荐文本助手。
- 接口独立为 `/api/aishell-tech/minnan-helper/ai/recommend*`。
- Prompt、模型白名单、并发默认值参考 DataBaker round-one-quality。
- 默认识别策略为 `mandarin_to_dialect`（先听成普通话，再结合页面预测闽南语文本与字词表输出最终闽南语）。
- 同时保留 `direct_dialect`（直接听写闽南语）测试模式。
- 前端批量链路当前为“AI 并发请求 + 页面串行保存”：
  - 先按 `packageItemList` 直接生成当前分包待处理条目。
  - AI 结果谁先返回，谁先进入保存队列。
  - 真正写页面前，会按条目编号与文件名后缀重新匹配左侧列表，再调用平台原生 `SaveShortMark`。
- Aishell 前端支持独立快捷键配置：单条识别、批量识别、复制听音文本、复制推荐文本、填入并保存当前条、忽略结果。
