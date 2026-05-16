# Abaka AI Task 页面结构采集

- 平台：Abaka AI
- 地址：`http://abao.fortidyndns.com:30473/login`
- 当前阶段：只读页面网络结构采集
- 当前目标：Task21 / MMAT

## 采集方法

1. 重新加载扩展。
2. 打开 Abaka AI 并登录。
3. 进入任务列表和 Task21。
4. 打开 DevTools Console。
5. 执行 `window.__ASCAbakaAiCapture.snapshot()` 查看结构。
6. 执行 `window.__ASCAbakaAiCapture.download()` 导出脱敏 JSON。
7. 不要提交导出的 JSON 到 Git。

## 脱敏规则

- 只采集页面结构与网络结构，不保存原始业务数据。
- `cookie`、`authorization`、`token`、`password`、`secret`、`sign`、`signature`、`credential`、`session` 等敏感字段会被脱敏。
- `audio/url/file/download/oss/path/src/href` 相关字段不保留完整字符串，只保留类型与长度信息。
- 不记录输入框真实值，不读取 cookie/localStorage/sessionStorage 敏感值。

## 本阶段禁止项

- 禁止自动领取任务。
- 禁止自动保存、自动提交、自动流转。
- 禁止主动调用平台业务 API；仅被动观察页面真实 `fetch/XMLHttpRequest`。
