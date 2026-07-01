# ByteDance AIDP 苏州话脚本运行时

## 命中范围

- 站点：`https://aidp.bytedance.com/*`
- 目标页：`/management/task-v2/{taskId}/mark-v3/{index}`

## 当前能力

- 读取脚本中心里的 `开关平台AI功能` 基础设置。
- 仅在 `mark-v3` 详情页生效。
- 当 `开关平台AI功能=false` 时，自动隐藏两类平台原生 AI 板块：
  - `.trigger-wrapper-RlG7Dx`
  - `.insight-container-Hn0Gna`
- 页面发生重渲染后，会继续按当前开关补做显隐。

## 运行时边界

- 当前不调用统一后端。
- 当前不发 AI 请求。
- 当前不新增快捷键、结果面板或批量入口。
- 当前不写入分段表格、不改 `保留/丢弃`、不触发保存、提交、领取或切题。
- 当前只做可逆 DOM 显隐，核心标注工作区保持平台原样。

## 文件

- `content.js`
  - `mark-v3` 路由识别
  - 平台 AI 板块显隐
  - 页面重渲染后的补隐藏

## 真实浏览器验证

1. 在真实 Edge / Chrome 重新加载 unpacked extension，并刷新 `mark-v3` 详情页。
2. 进入脚本中心 `ByteDance AIDP -> 苏州话脚本`，关闭 `开关平台AI功能` 后保存。
3. 回到详情页，确认 `AI 洞察` 面板和猫形浮动入口消失。
4. 再次打开该开关并刷新详情页，确认两个平台 AI 板块恢复。
5. 复核左侧任务列表、波形区、`是否保留` 和分段表格未被隐藏或破坏。
