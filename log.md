# 标注脚本中心修改日志

## 2026-04-25

- 为 Alibaba LabelX ASR 快判新增总时长统计：读取 `/api/v1/label/center/subTask/{subTaskId}/data`，汇总 `data.dataList[].data.duration`。
- 为快判新增默认每页条数设置，默认值为 `all`，尝试将详情页 data 请求改写为 `pageSize=400`。
- 新增快判 MAIN world 网络捕获与请求改写，支持同标签页刷新时读取缓存配置。
- 将总时长显示位置调整到页面顶部主导航区域，快判工具栏中保留每页状态。
- 将音频运行时拆分为 `audio-volume-controller.js`、`audio-rate-controller.js`、`audio-playback-controller.js`，`audio-controller.js` 只保留编排、扫描和动作路由。
- 将分页和总时长逻辑拆分为 `judgement-page-size.js` 和 `judgement-duration-summary.js`。
- 将 MAIN world 网络逻辑拆分为 `network-protocol.js`、`network-config.js`、`network-url-rewriter.js`、`network-summary.js` 和 `network-observer.js`。
- 将 `content.js` 中的判别动作、快捷键、提示和工具栏拆分为 `judgement-actions.js`、`judgement-shortcuts.js`、`judgement-toast.js` 和 `judgement-toolbar.js`。
- 更新快判 README，记录当前运行时模块边界和验证步骤。
- 将项目维护说明统一迁移到仓库根目录 `AGENTS.md`，并新增根目录 `log.md` 作为长期修改日志。
- 统一调整项目 README：重写 `edge-extension/README.md`，更新 `alibaba-labelx/README.md`、快判 README、快判页面结构 README 和网络采集 README，使文档匹配当前 `asr-judgement` 模块拆分后的实际结构。
- 在 `AGENTS.md` 中新增 Git 提交要求：每次完成修改并验证后提交，提交前检查暂存范围，默认不主动推送。
