# Abaka AI Task 页面脚本

## 脚本定位

本目录是 Abaka AI Task 页面运行时代码，当前包含两类能力：

- MAIN world：`page-world/network-structure-observer.js`（只读脱敏结构采集）
- ISOLATED world：`content.js`、`shortcuts.js`、`dom-actions.js`、`toast.js`（Task21 快捷键辅助）

## 当前阶段

- 阶段：Task21 快捷键辅助第一版。
- 目标：`same_font` 与派生字段快捷选择。
- 范围：仅 DOM 点击，不直接调用平台保存/提交/领取/流转接口。

## 快捷键动作（默认）

- `1`：`same_font=true`
- `2`：`same_font=false`
- `3`：`same_font=same underlying font+artistic effect`
- `4`：`image_b_texts_removed=specify`
- `5`：`other_changes=specify`
- `6`：点击页面真实“暂存 / Save / Stash”按钮
- `7`：点击页面真实“送审 / Submit / Submit Review”按钮

联动开关：`autoSelectSpecifyOnSameFontTrue=true`（默认开启）同时适用于：

- `same_font=true`
- `same_font=same underlying font+artistic effect`

联动为幂等“确保选中”：

- `specify` 未选中时才点击；
- `specify` 已选中时保持不变，不重复点击，避免取消。

## 运行时边界

- 快捷键仅在 `/items` 页面生效。
- 必须检测到 `same_font` 字段后才执行动作，避免 Task17 等页面误触发。
- 焦点在 `input`、`textarea`、`select`、`contenteditable`、编辑器节点时忽略快捷键。
- `4/5` 对应 `specify` 也为幂等选择：已选中时不会取消。
- `6/7` 仅点击页面真实按钮，不直接调用平台保存/送审接口。
- `7` 不自动确认二次弹窗，若出现确认弹窗需用户手动确认。
- `7` 在疑似标注内审环境会被阻止，避免误触发送审。
- `6/7` 在 `viewMode=true` 查看页不执行。
- 不自动提交、不自动保存、不自动领取、不自动放弃、不自动跳过、不自动送审。

## Console 导出（只读采集）

```js
window.__ASCAbakaAiCapture && window.__ASCAbakaAiCapture.snapshot()
window.__ASCAbakaAiCapture && window.__ASCAbakaAiCapture.download()
```

## 安全边界

- 不记录账号密码、cookie、token、authorization、password、secret、signature。
- 不记录完整图片、音频、文件、对象存储 URL。
- 不提交原始 HAR、JSON、截图、CSV 或完整响应。
