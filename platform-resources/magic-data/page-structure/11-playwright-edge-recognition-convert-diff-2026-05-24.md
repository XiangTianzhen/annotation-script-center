# Playwright-Edge 复测：识别转换模式与差异对比（2026-05-24）

## 复测范围

- 页面：`https://work.magicdatatech.com/#/asrmark?taskItemId=163686971&formType=1&userId=82368`
- 工具：`playwright-edge`（仅交互复测）
- 目标：
  - 验证闽南语助手挂载与按钮布局
  - 验证行内建议与说话人建议展示
  - 验证折叠区展开稳定性（>500ms）
  - 验证原始输出弹窗脱敏
  - 尝试验证 `recognition_convert` 请求参数与差异高亮

## 关键选择器（现场可用）

- 面板根：`[data-asc-magic-data-minnan-review-inline]`
- 行内建议：`[data-asc-magic-data-minnan-inline-suggestion]`
- 说话人建议：`[data-asc-magic-data-minnan-speaker-suggestion]`
- 折叠标题：`.md-fold-toggle`
- 说话人区：`.speaker-attributes`
- 文本行：`.region-item[region_id] .speak-item`
- 可编辑节点：`.edit.region-edit[contenteditable="true"]`

## 复测结果

1. 面板与建议节点
- 页面加载后检测到闽南语助手面板根节点（`count=1`）。
- 触发 AI 后检测到：
  - 行内建议 `count=2`
  - 说话人建议 `count=2`

2. 按钮布局
- 右侧按钮顺序为：
  - 上排：`AI 质检当前条`、`全部填入AI推荐`
  - 下排：`刷新采集`、`重置高度`、`复制 AI 质检摘要`、`显示 AI 原始输出`
- 未检测到 `忽略结果` 按钮。

3. 行内与说话人展示
- 本次样本返回为“正确”场景：
  - 行内建议文本为 `正确`（两行）。
  - 说话人建议文本为 `AI建议：正确`（性别、年龄）。
- 本轮样本未出现“需修改”场景，因此未触发 `填入本行` 按钮 hover 闪烁测量（`fill button not found`）。

4. 折叠稳定性
- 三个标题（`说话人属性`、`闽南语内容`、`普通话文本`）逐个点击展开后，
  - `600ms` 后仍保持展开（3/3 保持）。
- 未复现“点击后约 500ms 自动收回”。

5. 原始输出弹窗
- “显示 AI 原始输出”可打开弹窗并显示 textarea。
- 检查文本未发现完整敏感签名参数：
  - 未发现 `OSSAccessKeyId`
  - 未发现 `Signature=`
  - 未发现 `Expires=`
  - 未发现明文 `authorization/cookie`

## 与本轮需求的关系

- 已验证：
  - 面板基础交互可用
  - 折叠展开保持
  - 行内/说话人建议节点存在
  - 新按钮布局生效
  - 原始输出弹窗脱敏口径可用

- 未完全验证（当前 MCP 运行上下文限制）：
  - `recognition_convert` 模式请求体参数（`recognitionMode=recognition_convert`）：
    - 页面上下文无法直接截获扩展隔离世界 `fetch` 请求体；
    - 本次在扩展 options 页尝试切到“闽南语助手”后，未检测到 `#magic-data-ai-pipeline-mode-select` 节点，未能在当前加载态下完成模式切换并复测。
  - “差异高亮”在“需修改”样本下的视觉效果：
    - 本次返回均为“正确”，未覆盖需修改路径。

## 后续建议

- 在真实扩展重载后，先在 options 闽南语助手中切到 `recognition_convert`，再回 `#/asrmark` 复测。
- 通过浏览器 Network 面板确认请求体字段：
  - `recognitionMode: recognition_convert`
  - `pipelineMode: recognition_convert`
- 使用一个“平台文本与建议文本存在差异”的样本复测行内与右侧详情的差异高亮。
