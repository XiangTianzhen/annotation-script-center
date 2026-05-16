# Abaka AI Task 页面采集脚本

## 脚本定位

本目录是 Abaka AI Task 页面的扩展运行时入口，目前只包含 MAIN world 网络结构 observer：

- `page-world/network-structure-observer.js`

脚本用于在 Abaka AI 页面中被动观察 DOM / Network 结构，辅助沉淀平台资料。当前没有实现业务自动化能力，也没有独立 `content.js`。

## 当前阶段

- 阶段：只读 / 测试采集阶段。
- 主目标：Task21 页面结构、Network 结构和 same_font 标注区资料沉淀。
- 对比目标：Task17-9 / Task17-8，仅用于公共结构对比。
- 当前边界：不自动领取、不自动保存、不自动提交、不自动流转。
- 状态变更类动作即使在采集阶段被用户授权测试，正式脚本也必须重新设计人工确认层。

## 注入范围

Manifest 当前对 Abaka AI 的注入配置：

- host：`http://abao.fortidyndns.com:30473/*`
- matches：`http://abao.fortidyndns.com:30473/*`
- world：`MAIN`
- run_at：`document_start`
- js：`sites/abaka-ai/task-page/page-world/network-structure-observer.js`

## Console 导出

页面正常注入后，可在 Console 中尝试：

```js
window.__ASCAbakaAiCapture && window.__ASCAbakaAiCapture.snapshot()
window.__ASCAbakaAiCapture && window.__ASCAbakaAiCapture.download()
```

如果当前页面没有 `window.__ASCAbakaAiCapture`：

- 可能是扩展未加载或未启用。
- 可能是页面在扩展重新加载前已打开，需要刷新 Abaka 页面。
- 也可能是当前页面不在 manifest match 范围内。

导出的内容只允许用于脱敏结构分析，不得提交原始 JSON、HAR、截图、CSV、完整接口响应或完整资源 URL。

## 文档入口

平台资料统一维护在 `platform-resources/abaka-ai/`：

- 平台入口：`platform-resources/abaka-ai/README.md`
- 平台通用网络：`platform-resources/abaka-ai/network.md`
- Task 页面入口：`platform-resources/abaka-ai/task-page/README.md`
- Task21 网络请求：`platform-resources/abaka-ai/task-page/network.md`
- Task 页面结构：`platform-resources/abaka-ai/task-page/page-structure.md`
- 动作与状态边界：`platform-resources/abaka-ai/task-page/actions.md`
- 多语言文案：`platform-resources/abaka-ai/task-page/i18n.md`

## 安全边界

- 不记录账号密码、cookie、token、authorization、password、secret、signature。
- 不记录完整图片、音频、文件、对象存储 URL。
- 不提交原始 HAR、JSON、截图、CSV 或完整响应。
- 不在运行时代码中默认触发领取、保存、暂存、放弃、跳过、送审、流转。
- AI 建议只能作为辅助，不能自动写入、保存或提交。
