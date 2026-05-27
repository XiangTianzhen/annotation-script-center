# Aishell Tech 闽南语助手运行时

## 当前范围

- 仅在 `https://mark.aishelltech.com/mytask/mark?...` 生效。
- 实测验收建议先打开 `https://mark.aishelltech.com/mytask/detail/:taskId`，再点击分包“查看”进入标注页；直接输入 `/mytask/mark?...` 在平台侧可能出现卡住。
- 当前条支持：AI 推荐、复制听音文本、复制推荐文本、填入当前条。
- 批量模式支持：从当前选中条开始，跳过已完成条目，按前端并发预取 AI 结果，再串行填入并点击页面真实“保存”按钮。

## 边界

- 不自动提交任务。
- 不跨分包处理。
- 不触发 `.check-area`。
- 不直接处理平台 JWT，只通过 page-world 观察平台原生请求缓存数据。
