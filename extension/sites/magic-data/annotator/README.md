# Magic Data ANNOTATOR 扩展前端接入说明

本目录是 Magic Data `#/asrmark` 当前条 AI 复核前端注入模块。

## 文件职责

- `page-detector.js`：识别页面类型与 hash 参数。
- `page-world/network-observer.js`：MAIN world 只读监听 `annotateDetailInfo` 响应并回传脱敏字段。
- `data-collector.js`：优先使用接口缓存/同源读取当前条数据，失败回退 DOM；提供填入与用户主动动作触发方法。
- `ai-review-client.js`：调用 `/api/magic-data/annotator/ai/review-current`，按全局后端模式选 baseUrl。
- `ui-panel.js`：右下角“Magic Data AI 复核助手”面板。
- `shortcuts.js`：面板快捷键设置、持久化与键盘动作分发。
- `content.js`：入口编排，处理 SPA 路由和 DOM 变化。

## 安全边界

- 只支持用户主动点击触发 AI 复核与填入。
- 不自动保存、不自动提交、不自动审核、不自动领取。
- 不在 console 输出完整音频签名 URL。
- 不在存储中持久化完整音频签名 URL。
- 不读取、不保存、不输出 token/cookie/authorization。

## 当前支持

- 完整支持：`#/asrmark`
- 轻量提示：`#/asrmarkCheck`（提示“暂未接入填入”）

## 面板显示策略（本轮修复）

- 面板固定右下角显示（`data-asc-magic-data-ai-panel="true"`），避免被页面暗色背景淹没。
- 在 `document_start` 阶段即启动，但会等待并重试挂载，避免 `head/body` 尚未就绪导致静默失败。
- 即使未获取到音频 URL 或未读取到平台文本，也会先显示面板和可操作的错误提示。
- SPA hash 变化或任务切换后会重新采集；切换到新任务会清空旧 AI 结果，避免误填入。
- 控制台仅输出最小安全日志（启动/挂载），不输出完整 `audioUrl`。
- 新增快捷键设置（默认全部未设置）：AI 复核、复制、填入、保存、提交、性别/年龄选择。
- 保存/提交与性别/年龄仅在用户主动快捷键触发时执行，不自动触发。

## 本地联调

1. 启动后端：`node platform-resources\backend\server.js`
2. 进入 `https://work.magicdatatech.com/#/asrmark?...`
3. 点击面板 `AI 复核当前条`
