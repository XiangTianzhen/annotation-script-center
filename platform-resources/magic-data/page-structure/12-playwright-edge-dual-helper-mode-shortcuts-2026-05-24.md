# Playwright-Edge 复测：双助手模式与快捷键（2026-05-24）

## 复测范围

- 目标页面：`https://work.magicdatatech.com/#/asrmark?taskItemId=163686971&formType=1&userId=82368`
- 工具：`playwright-edge`（MCP）
- 目标：
  - 验证“模型方案 + 识别策略”双维度口径
  - 验证双助手快捷键动作集是否更新
  - 验证页面面板节点与折叠/行内建议稳定性

## 本轮执行结果（受环境限制）

- `playwright-edge` 未能连接到本机 Edge 远程调试端口（`ws://localhost:9222/devtools/browser`）。
- MCP 报错：`Could not connect to msedge`，并提示启用 `chrome://inspect/#remote-debugging` 的远程调试开关。
- 因此本轮未完成页面内点击与 500ms 折叠保持、hover 稳定性等交互复测步骤。

## 已确认信息

- 本次失败是连接层问题，不是页面选择器问题。
- 代码层已按双维度口径实现字段：
  - `modelMode`：`two_stage | omni_single`
  - `recognitionStrategy`：`direct_dialect | mandarin_to_dialect`
- legacy `recognition_convert` 仍保留兼容映射，仅用于旧字段迁移。

## 待补复测项

1. options 闽南语助手：
   - 模型方案与识别策略是否分开展示。
   - 是否不再把 `recognition_convert` 作为同级模型方案。
2. options 客家话助手：
   - 是否同步显示同一套双维度配置与快捷键动作集合。
3. `#/asrmark` 页面：
   - 行内建议 hover 是否稳定（无高频 remove/add）。
   - 三个折叠区点击后 500ms 是否保持展开。
   - `全部填入AI推荐` 是否仅填入需修改项且不触发保存/提交。

## 复测前置

- 启动 Edge 并开启远程调试允许：
  - 打开 `chrome://inspect/#remote-debugging`
  - 勾选“Allow remote debugging for this browser instance”
- 保持扩展已重载，并刷新业务页面后再执行 MCP 复测。
