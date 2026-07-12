# Magic Data 扩展运行时

当前 Magic Data 运行时只服务杭州话脚本 `magicDataHangzhouAssistant`，匹配站点 `https://work.magicdatatech.com/*`。

## 目录结构

| 路径 | 职责 |
|---|---|
| `hangzhou-helper/content.js` | 页面入口、设置读取、挂载与状态协调 |
| `hangzhou-helper/ai-review-client.js` | 杭州话 AI defaults 与质检请求 |
| `hangzhou-helper/assistant-panel.js` | AI 结果面板、填入和状态反馈 |
| `hangzhou-helper/shortcuts-runtime.js` | 22 项可录制快捷键动作 |
| `shared/page-detector.js` | Magic Data 路由和页面类型识别 |
| `shared/data-collector.js` | 当前条数据采集、缓存优先与 DOM 回退 |
| `shared/page-world/network-observer.js` | MAIN world 只读 Network observer |

## 注入与数据流

```text
manifest document_start
  -> MAIN world network-observer
  -> ISOLATED world shared constants / storage
  -> page-detector + data-collector
  -> Hangzhou content
  -> ai-review-client
  -> assistant-panel / shortcuts-runtime
```

Network observer 只观察页面已有请求，并把最小、脱敏的当前条快照传给隔离世界。运行时不会把 cookie、authorization、完整签名 URL 或完整音频 URL写入扩展 storage。

## 挂载条件

- 支持 `#/asrmark` 与 `#/asrmarkCheck`。
- `platforms.magicData.activeScriptId` 必须为 `magicDataHangzhouAssistant`。
- 杭州话脚本和平台必须处于启用状态。
- 页面容器和当前条数据未准备完成时跳过本轮挂载，等待后续重试。

## 运行边界

- 普通 AI 质检只在用户点击按钮或快捷键后触发。
- Options 保存不会操作业务页面。
- AI 建议默认不自动保存、不自动提交、不自动审核、不自动领取、不自动流转。
- 用户显式启动的当前页临时全自动只作用于 `#/asrmark`，并通过页面真实按钮执行。
- 所有写入尊重页面原生禁用状态和当前条快照一致性。

## 验证

```powershell
npm run test:extension
node scripts/build-options-app.js
```

真实浏览器还需验证两个支持路由的挂载、AI 面板、结果填入、快捷键和停止行为。详细说明见 [杭州话运行时](hangzhou-helper/README.md)。
