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
- 前端会在构建 recommend 请求前，自动从 Aishell 头像下拉提取平台账号；`ASmnbz001【标注人员】` 这类显示文本会先归一成纯账号 `ASmnbz001`，再作为 `platformUserName` 发往后端。
- 前端批量链路当前为“AI 并发请求 + 页面串行保存”：
  - 先按 `packageItemList` 直接生成当前分包待处理条目。
  - 先按并发数发起首批 AI 请求；某条完成填入并保存后，再从剩余条目中补发下一条 AI 请求。
  - AI 结果谁先返回，谁先进入保存队列。
  - 真正写页面前，会按条目编号与文件名后缀重新匹配左侧列表，再触发平台真实“保存”按钮。
  - 保存成功优先以页面 `保存成功!` 提示为准；若提示未及时出现，再回退检查 `getShortMark / packageItemList` 的保存结果。
- 后端默认 Prompt 已限制 `heardText / recommendedText` 必须使用简体中文，不允许输出繁体字；前端不再做二次繁简转换。
- 前端 UI 口径当前固定为“嵌入式推荐卡片 + 原生按钮注入”：
  - 推荐卡片嵌入标注表单下方。
  - `AI识别` 放在原生“保存”按钮右侧。
  - `AI批量识别 / 停止批量` 放在原生工具按钮区域。
- Aishell 前端支持独立快捷键配置：单条识别、批量识别、复制听音文本、复制推荐文本、填入并保存当前条、忽略结果。
