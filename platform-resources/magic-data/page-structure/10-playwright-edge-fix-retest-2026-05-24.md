# Playwright-Edge 修复复测（2026-05-24）

## 复测范围

- 页面：`#/asrmark`（本次实际复测 URL 的 `taskItemId=163686723`）
- 方式：`playwright-edge` 仅交互复测（不点击保存/提交）
- 目标：
  - 行内建议与说话人建议节点稳定性
  - 右侧折叠展开保持
  - 按钮布局与行为边界

## 关键选择器（实测可用）

- 扩展根节点：`[data-asc-magic-data-minnan-review-inline]`
- 行内建议：`[data-asc-magic-data-minnan-inline-suggestion]`
- 说话人建议：`[data-asc-magic-data-minnan-speaker-suggestion]`
- 右侧折叠块：`.md-fold-section`
- 折叠标题按钮：`.md-fold-toggle[data-section]`
- 左侧说话人属性：
  - 根：`.speaker-attributes`
  - 字段项：`.speaker-attributes .el-form-item`
  - 已选 radio：`.speaker-attributes .el-radio.is-checked input.el-radio__original`

## 复测结果

### 1) 扩展节点挂载

- 已检测到根节点。
- 点击 AI 质检后可检测到：
  - 行内建议节点：2 个
  - 说话人建议节点：2 个

### 2) hover 稳定性（节点重建观测）

- 对“填入”类按钮做 3 秒 hover/mousemove 观测。
- 结果：
  - `mutationCount` 有变化（页面本身存在其他轻微更新）
  - 但建议节点 `add/remove` 计数为 0
  - 结论：建议节点未发生高频销毁重建，闪烁主因已从“节点反复重建”降级。

### 3) 折叠状态保持

- 对三块折叠（说话人属性/闽南语内容/普通话文本）逐项点击。
- 600ms 后状态仍保持，不再被刷新流程自动回收。
- 结论：折叠状态保持有效。

### 4) 按钮布局

- 主操作（上排）：
  - `AI 质检当前条`
  - `全部填入AI推荐`（仅在有可填项时显示）
- 辅助操作（下排）：
  - `刷新采集`
  - `重置高度`
  - `复制 AI 质检摘要`
  - `显示 AI 原始输出`
- `忽略结果` 未出现。

### 5) 全部填入行为边界

- 点击 `全部填入AI推荐` 时，未触发页面“保存/提交”按钮点击。
- 结论：仍满足“只填入，不自动保存/提交”边界。

## 复测备注

- 本次复测只记录 DOM 与交互稳定性，不记录敏感信息。
- 未记录 `authorization/cookie/token`，未记录完整签名音频 URL（含 `OSSAccessKeyId/Signature/Expires`）。
