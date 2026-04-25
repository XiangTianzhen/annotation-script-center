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
- 将快判“默认每页条数”从默认 `400` 调整为默认 `100 条/页`，设置页提供 `100/150/200/400 条/页` 自定义档位，历史 `all/全部` 配置兼容为 `400 条/页`。
- 新增快判页数负载测试文档，用于在 DevTools Console 对比不同 `pageSize` 的接口耗时、响应大小和页面 DOM 压力。
- 为快判新增实验性“窗口化显示”开关，开启后按当前题号只展开前后 5 题，并折叠窗口外题卡以降低 400 条页面的渲染压力。
- 调整快判窗口化隐藏方式：窗口外题卡高度改为 2px，并通过 LabelX inline CSS 变量隐藏内容区和回答区，恢复时还原原始变量。
- 因窗口化显示在 LabelX 页面未能稳定生效，暂时从 options 前端移除开关，并在运行时强制关闭；代码保留为未完成能力等待后续继续验证。
- 在快判 README 中补充脚本能力路线：优先提效脚本，其次半自动人工，最后全自动；新增 ASR 文本差异高亮、差异摘要、差异导航等后续提效功能池。
- 为快判新增 ASR 文本对齐差异视图，按字符级编辑距离生成高亮对齐文本和差异摘要。
- 为快判新增“选择后自动下一题”设置，选择 `1~5` 或点击快判工具栏判别按钮后可自动跳到当前页下一题。
- 为快判 ASR 对齐差异视图新增 options 开关，默认开启，关闭后恢复 LabelX 原始文本展示。
- 修复转写 content 读取运行时契约时只访问 `window` 的兼容问题，改为优先读取 `globalThis`，减少 Edge MV3 隔离环境下的 `Runtime contract is not loaded` 误报。
