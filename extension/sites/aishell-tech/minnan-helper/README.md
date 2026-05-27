# Aishell Tech 闽南语助手运行时

## 当前范围

- 仅在 `https://mark.aishelltech.com/mytask/mark?...` 生效。
- 实测验收建议先打开 `https://mark.aishelltech.com/mytask/detail/:taskId`，再点击分包“查看”进入标注页；直接输入 `/mytask/mark?...` 在平台侧可能出现卡住。
- 当前前端已按“最小悬浮窗重构”收敛：
  - 只保留一个固定悬浮窗。
  - 保留两个主入口按钮：`识别`、`批量识别`。
  - 不再向页面表单区、保存按钮区或文件名行插入行内按钮。
- 已移除 Aishell 的高风险注入链：
  - 移除 `page-world/network-observer.js` 注入。
  - 不再依赖页面抓包缓存。
- 当前取数方式改为：
  - 内容脚本直接从页面 `localStorage/sessionStorage` 里扫描 JWT。
  - 直接请求 `markapi.aishelltech.com` 的 `task/detail` 与 `packageItemList`。
  - `detail -> mark` 只靠同一个 content script 的 URL 轮询识别路由切换，不再额外二次注入。
- 当前条识别支持：
  - 读取当前选中条。
  - 请求后端 AI recommend。
  - 在悬浮窗里展示听音文本与推荐文本。
  - 支持复制听音文本、复制推荐文本、填入并保存当前条、忽略本次结果。
- 批量识别支持：
  - 从当前选中条开始，跳过左侧列表里已完成条目。
  - 顺序识别，并对成功结果立即填入当前条后点击页面真实“保存”。
  - 支持用户手动停止当前批次。
  - 保留失败清单，便于回看失败条目。

## 边界

- 当前最小重构版：只有用户明确点击 `填入并保存当前条` 或 `批量识别` 后，才允许点击页面真实“保存”。
- 不自动提交任务。
- 不跨分包处理。
- 不触发 `.check-area`。
- 不再使用主世界抓包或动态脚本补注入。
