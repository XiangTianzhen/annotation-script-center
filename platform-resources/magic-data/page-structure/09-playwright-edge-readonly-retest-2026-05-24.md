# Playwright-Edge 只读交互复测记录（2026-05-24）

## 任务范围

- 页面：`https://work.magicdatatech.com/#/asrmark?taskItemId=163686971&formType=1&userId=82368`
- 工具：`playwright-edge` MCP
- 模式：只读交互复测（不改代码）
- 排除按钮：`保存`、`提交`、`返回`

## 本次现场状态

- 扩展注入节点已存在：
  - `[data-asc-magic-data-minnan-inline-suggestion] = 2`
  - `[data-asc-magic-data-minnan-speaker-suggestion] = 2`
  - 折叠区 `.md-fold-section = 3`
- 左侧说话人已选值可读：
  - 性别：`女`
  - 年龄：`37-50`

## 1) DOM 关键选择器（实测可用）

### 左侧说话人属性

- 根容器：`.speaker-attributes`
- 字段项：`.speaker-attributes .el-form-item`
- 字段标签：`label.el-form-item__label`（文本 `性别` / `年龄`）
- 已选 radio：`.speaker-attributes .el-radio.is-checked input.el-radio__original`

### 文本行与行内建议

- 区块：`.region-item[region_id]`（找不到时回退第一个 `.region-item`）
- 行容器：`.region-item .speak-item`
- 可编辑节点：`.edit.region-edit[contenteditable="true"]`
- 行标识：
  - `data-index="0"`（闽南语行）
  - `data-index="1"`（普通话行）
- 行内建议块：`[data-asc-magic-data-minnan-inline-suggestion]`

## 2) 仅交互复测清单（排除保存/提交/返回）

测试按钮：

- `清除结果`
- `清除文本`
- `数据有效`
- `刷新采集`
- `重置高度`
- `AI 质检当前条`
- `全部填入AI推荐`
- `复制 AI 质检摘要`
- `显示 AI 原始输出`
- `填入本行`
- `说话人属性`
- `闽南语内容`
- `普通话文本`

实测结果摘要：

- 指针点击（Playwright pointer click）稳定成功：
  - `清除结果`
  - `填入本行`
  - `说话人属性`
  - `闽南语内容`
  - `普通话文本`
- 指针点击多次超时（随后用 DOM `el.click()` 可触发）：
  - `清除文本`
  - `数据有效`
  - `刷新采集`
  - `重置高度`
  - `AI 质检当前条`
  - `全部填入AI推荐`
  - `复制 AI 质检摘要`
  - `显示 AI 原始输出`

说明：

- 上述“指针点击超时”并不等于按钮逻辑不存在；DOM click 可触发，说明主要是可点击层级与重绘时序问题。

## 3) hover 闪烁复测结论

针对行内建议区域 hover 采样：

- 短时间内出现批量 mutation（示例：每批 `added=18` / `removed=18`）
- 平均约 200ms 级别重复替换

结论：

- “填入本行” hover 闪烁主要由节点反复销毁重建引起，不是纯 CSS hover 样式问题。

## 4) 折叠区自动收回复测结论

实测三项折叠标题（`说话人属性` / `闽南语内容` / `普通话文本`）：

- 点击后短时可展开（约 0~80ms 可见）
- 约 500ms 后被重置回折叠

结论：

- 折叠自动收回是渲染循环覆盖本地展开状态导致。
- 不是单纯点击事件失效。

## 5) 交互问题根因（本次复测口径）

- 页面存在高频重渲染（建议块与折叠块所在区域被周期性替换）
- 扩展 UI 状态（展开、按钮可见性）未与重建流程做持久化对齐
- 指针点击与实际顶层可点元素偶发错位/被中间层拦截，导致 Playwright pointer click 超时，但 DOM click 仍可执行

## 6) 后续修复建议（不在本次只读执行）

建议优先修改以下文件：

- `extension/sites/magic-data/minnan-helper/assistant-panel.js`
- `extension/sites/magic-data/minnan-helper/content.js`
- （必要时）`extension/sites/magic-data/shared/data-collector.js`

修复方向：

1. 行内建议和折叠区改为幂等更新，避免整块 remove + recreate。
2. 折叠状态持久化（按 `taskItemId + section` 记忆），重渲染后恢复。
3. 按钮交互采用事件委托到稳定父节点，避免节点替换导致监听丢失。
4. 优先用真实可点击元素定位（`elementFromPoint` 结果校验），降低 pointer click 误伤。

## 安全与脱敏

- 本文未记录以下敏感信息：
  - `authorization`
  - `cookie`
  - `bearer token`
  - 完整签名音频 URL
  - `OSSAccessKeyId`
  - `Signature`
  - `Expires`
