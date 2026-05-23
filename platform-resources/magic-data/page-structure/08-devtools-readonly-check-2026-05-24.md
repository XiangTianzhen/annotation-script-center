# DevTools MCP 只读检查记录（2026-05-24）

## 任务范围

- 页面：`https://work.magicdatatech.com/#/asrmark?taskItemId=163686971&formType=1&userId=82368`
- 目标：只读排查闽南语助手 DOM 与交互问题，不改代码。
- 备注：本次可控制 `chrome://extensions` 页面按钮点击，但无法通过 MCP 完成系统文件夹选择，因此不能代替用户执行“加载已解压扩展程序”。

## 1) 左侧说话人属性 DOM 结构

- 根容器：`.speaker-attributes.user-select-none`
- 说话人卡：`.speaker-attributes .content-dialog`
- 字段项：`.speaker-attributes .el-form-item`
- 字段 label：
  - `label.el-form-item__label` 文本 `性别`
  - `label.el-form-item__label` 文本 `年龄`
- checked radio 稳定选择器：
  - 性别：`.speaker-attributes .el-form-item .el-radio.is-checked input.el-radio__original`
  - 年龄：`.speaker-attributes .el-form-item .el-radio.is-checked input.el-radio__original`
  - 备选：`[role="radio"][aria-checked="true"]`
- 当前实测值：
  - 性别：`女`
  - 年龄：`37-50`

## 2) 文本行 DOM 结构

- 当前区块：`.region-item[region_id]`
- 文本行：`.region-item .speak-item`
- 可编辑节点：`.edit.region-edit[contenteditable="true"]`
- 第一行：`.edit.region-edit[data-index="0"]`（兼容 `alt="0"`）
- 第二行：`.edit.region-edit[data-index="1"]`（兼容 `alt="1"`）
- 本页行数：2 行（闽南语 + 普通话）

## 3) 当前注入失败判断

- 页面中未检测到任何扩展注入节点：
  - `[data-asc-magic-data-minnan-review-inline] = 0`
  - `[data-asc-magic-data-minnan-inline-suggestion] = 0`
  - `[data-asc-magic-data-minnan-speaker-suggestion] = 0`
  - 全局 `data-asc-*` 属性计数 = 0
- 结论：本次失败不是“说话人/文本选择器失效”，而是闽南语助手运行时未在当前页面挂载执行。

## 4) 行内建议块最稳定插入位置

- 以当前 `.region-item[region_id]` 为根。
- 按 `data-index` 精确定位行：
  - `0`：闽南语行
  - `1`：普通话行
- 插入到对应 `.speak-item .edit-container` 内，紧跟 `.edit.region-edit` 后方。
- 不使用全局 `#EasyEditableDiv`（重复 id 风险）。

## 5) “填入本行” hover 闪烁判断

- 由于当前页面未挂载扩展按钮，无法在现场直接复现“填入本行” hover。
- 3 秒只读观察期间，`.region-item` 未出现持续 mutation（`childList/attributes = 0`）。
- 推断：闪烁更可能来自扩展侧反复重渲染，而非平台原生 hover 样式抖动。

## 6) 右侧折叠点击后自动收回判断

- 当前页面未挂载右侧扩展面板，无法现场点击复现。
- 结合本页无高频重绘基线，优先怀疑扩展刷新流程重建 DOM，导致折叠展开状态被覆盖。

## 7) 按钮布局建议（用于后续修复）

- 上排：`AI质检当前条`、`全部填入AI推荐`
- 下排：`刷新采集`、`重置高度`、`复制 AI 质检摘要`、`显示 AI 原始输出`
- 删除：`忽略结果`
- 样式优先复用 `el-button el-button--mini` 与 `el-button--primary/el-button--success is-plain`

## 安全与脱敏

- 本文未记录以下敏感信息：
  - `authorization`
  - `cookie`
  - `bearer token`
  - 完整音频签名 URL
  - `OSSAccessKeyId`
  - `Signature`
  - `Expires`
