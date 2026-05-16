# Abaka AI 平台资料

## 平台定位

Abaka AI 是国外标准标注平台。本目录沉淀 Abaka AI 的平台级页面事实、通用 Network 结构、任务页资料和安全边界。当前主接入任务为 `Task21`，Task17 仅作为公共结构对比来源。

## 当前已采集脚本

| 脚本 | 目录 | 当前阶段 | 主目标 | 资料入口 |
| --- | --- | --- | --- | --- |
| Task 页面结构采集 | `platform-resources/abaka-ai/task-page/` | Task21 页面和接口结构已采集，待进入功能设计 | Task21 / same_font / 数据条目页 / `/items` 工作页 | `platform-resources/abaka-ai/task-page/README.md` |

## 通用资料

- 平台通用网络：`platform-resources/abaka-ai/network.md`
- Task 页面资料入口：`platform-resources/abaka-ai/task-page/README.md`
- Task21 网络请求：`platform-resources/abaka-ai/task-page/network.md`
- Task21 编号 Network 目录：`platform-resources/abaka-ai/task-page/network/README.md`
- Task 页面结构：`platform-resources/abaka-ai/task-page/page-structure.md`
- 动作与状态边界：`platform-resources/abaka-ai/task-page/actions.md`
- 多语言文案：`platform-resources/abaka-ai/task-page/i18n.md`
- 扩展运行时入口：`extension/sites/abaka-ai/task-page/README.md`

## 安全边界

- 不记录账号密码、cookie、token、authorization、password、secret、signature。
- 不记录完整图片、音频、文件或对象存储 URL。
- 不提交原始 HAR、JSON、截图、CSV、完整接口响应。
- 状态变更类动作必须人工确认。
- 扩展默认不自动领取、不自动保存、不自动提交、不自动流转。
- Task17 默认只查看和对比，不做领取、送审、放弃、跳过等状态变更。
