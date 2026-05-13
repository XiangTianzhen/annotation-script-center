# Magic Data ANNOTATOR 扩展前端接入说明

本目录是 Magic Data `#/asrmark` 当前条 AI 复核前端注入模块。

## 文件职责

- `page-detector.js`：识别页面类型与 hash 参数。
- `page-world/network-observer.js`：MAIN world 只读监听 `annotateDetailInfo` 响应并回传脱敏字段。
- `data-collector.js`：优先使用接口缓存/同源读取当前条数据，失败回退 DOM；提供填入与用户主动动作触发方法。
- `ai-review-client.js`：调用 `/api/magic-data/annotator/ai/review-current`，按全局后端模式选 baseUrl。
- `inline-panel.js`：页面内“Magic Data AI 质检结果”区域（插入到说话内容表格下方）。
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

## 页面内结果区策略（本轮调整）

- 主展示改为页面内结果区（`data-asc-magic-data-review-inline="true"`），优先插入右侧“句子列表”`.audio_list .body_box` 后方。
- 不再渲染右下角悬浮 `AI 质检` 小按钮，避免遮挡业务区。
- 在 `document_start` 阶段启动并重试挂载，避免 `head/body` 未就绪导致静默失败。
- 即使未获取到音频 URL 或未读取到平台文本，也会显示结果区和错误提示。
- SPA hash 变化或任务切换后会重新采集；切换到新任务会清空旧 AI 结果，避免误填入。
- 控制台仅输出最小安全日志（启动/挂载），不输出完整 `audioUrl`。
- 快捷键配置从页面面板迁移到 options 的 Magic Data 专区；页面仅消费快捷键设置。
- 保存/提交与性别/年龄仅在用户主动快捷键触发时执行，不自动触发。
- 页面内卡片支持手动拖拽高度（默认 420px，最小 260px，最大 `calc(100vh - 320px)`），并持久化到 `scriptCenter.magicDataAnnotator.panelHeight`。

## Options 设置规则（2026-05 更新）

- Magic Data 的 AI 质检设置（启用 AI、质检模式、听音/质检模型、显示听音文本、预计金额、thinking）统一迁移到通用隐藏部件“ASR 语音 AI 设置”。
- 默认不显示 AI 质检高级设置；在 options 脚本详情页标题连续点击 10 次后显示，且只影响当前脚本。
- 隐藏面板解锁后会请求 `GET /api/magic-data/annotator/ai/defaults`，自动展示后端默认模型、Prompt 与生成参数。
- Prompt/参数只保存脚本级 override：清空即回退后端默认，不会把默认值固化到前端存储。
- `response_format` 不对前端开放，由后端固定结构化输出策略。
- Magic Data 快捷键设置属于非 AI 运行控制项，保持在普通设置区常显，不走隐藏机制。
- 后端地址仍由 options 首页顶部“后端接口地址”统一控制，前端不配置 API Key。

## 本地联调

1. 启动后端：`node platform-resources\backend\server.js`
2. 进入 `https://work.magicdatatech.com/#/asrmark?...`
3. 点击面板 `AI 复核当前条`
