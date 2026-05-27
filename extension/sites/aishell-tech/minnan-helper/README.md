# Aishell Tech 闽南语助手运行时

## 当前范围

- 仅在 `https://mark.aishelltech.com/mytask/mark?...` 生效。
- 实测验收建议先打开 `https://mark.aishelltech.com/mytask/detail/:taskId`，再点击分包“查看”进入标注页；直接输入 `/mytask/mark?...` 在平台侧可能出现卡住。
- 当前前端已按“最小悬浮窗重构”收敛：
  - 只保留一个固定悬浮窗。
  - 只保留两个入口按钮：`识别`、`批量识别`。
  - 不再向页面表单区、保存按钮区或文件名行插入行内按钮。
- 已移除 Aishell 的高风险注入链：
  - 移除 `page-world/network-observer.js` 注入。
  - 不再依赖页面抓包缓存。
- 当前取数方式改为：
  - 内容脚本直接从页面 `localStorage/sessionStorage` 里扫描 JWT。
  - 直接请求 `markapi.aishelltech.com` 的 `task/detail` 与 `packageItemList`。
  - `detail -> mark` 只靠同一个 content script 的 URL 轮询识别路由切换，不再额外二次注入。
- 当前条识别支持：读取当前选中条、请求后端 AI recommend、在悬浮窗里展示听音文本与推荐文本。
- 批量识别支持：从当前选中条开始，跳过左侧列表里已完成条目，顺序识别并在悬浮窗展示进度。

## 边界

- 当前最小重构版：不自动填入，不自动保存。
- 不自动提交任务。
- 不跨分包处理。
- 不触发 `.check-area`。
- 不再使用主世界抓包或动态脚本补注入。
