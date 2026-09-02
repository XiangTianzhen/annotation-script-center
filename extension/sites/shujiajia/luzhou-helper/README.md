# 数加加泸州话整段识别运行时

该目录是 `shujiajiaLuzhouHelper` 的浏览器运行时，默认关闭，只在数加加分段标注页启用。

## 文件职责

- `page-world/network-observer.js`：脚本启用后观察当前条目、从 execute 响应的 `data.detail.fileFolder` 获取音频并兼容被动捕获音频响应；音频只转为内存 `audioDataUrl`。
- `whole-segment-controller.js`：零段落守卫、Peaks.js 波形与段落读取、可信 `Shift + 拖拽`、单段与两像素边界验证。
- `data-api.js`：原生转写输入事件与页面控件适配；平台已有快捷操作不由扩展代理。
- `ai-recommendation.js`：调用泸州话两阶段推荐接口并附带 AI 使用人。
- `ui-panel.js`：iframe 右下角悬浮入口与可关闭的右侧结果抽屉；不参与平台布局，不包含提交按钮。
- `shortcuts.js`：识别整段、填入识别结果两项空默认快捷键运行时，编辑框内不响应。
- `content.js`：按 `taskId + dataId` 跨 frame 对题，编排音频、待暂存版本和幂等挂载。

## 当前边界

- 已有任意段落时不画段，不删除、不合并、不覆盖。
- 整段绘制由 iframe 请求顶层换算坐标，再由后台在精确数加加标注路由内发送受限可信输入；不直接修改 annotation JSON。
- Peaks.js 段落通过表格行数和当前“区域”文字验证；兼容 `【开始 结束】` 与带逗号格式，首尾容差不超过两个波形像素。超出容差时保留段落并提示人工检查，不自动触发 Delete。
- 识别结果只在用户点击“填入转写”后触发平台输入事件。
- 有效性、播放、保存和提交使用平台原生控件或平台快捷键；扩展不拦截平台原生按钮。
- 暂存成功必须同时匹配当前条目、最近一次待暂存版本和业务成功响应；切题会清空旧音频与旧识别结果。
- 脚本或 AI 识别在 Options 中关闭后，后续快捷键动作会即时拒绝，页面观察器停止采集。
- 只接受 execute 响应中 `https://storage.shujiajia.com/` 的完整 HTTPS 音频地址；页面世界请求不附带数加加 Cookie，不保存或记录原始音频 URL、签名参数、Token、`audioDataUrl` 或真实任务数据。

页面与请求依据见[数加加平台资料](../../../../platform-resources/shujiajia/README.md)。
