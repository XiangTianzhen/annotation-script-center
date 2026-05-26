# 13 Playwright-Edge 客家话面板对齐记录（2026-05-24）

## 执行说明

- 目标：验证客家话助手是否已切换到与闽南语助手一致的新面板体系。
- 本轮状态：按用户最新要求“无需浏览器真实调试”，未执行 DevTools/Playwright 实机复测。
- 结论口径：仅记录代码链路变更与人工复核清单，不给出伪造实机结果。

## 代码链路变更（已实施）

- `extension/manifest.json`
  - Magic Data ISOLATED 注入新增：
    - `sites/magic-data/hakka-helper/shortcuts-runtime.js`
    - `sites/magic-data/hakka-helper/assistant-panel.js`
  - 并保证两者在 `sites/magic-data/hakka-helper/content.js` 之前加载。
- `extension/sites/magic-data/hakka-helper/content.js`
  - 运行时面板工厂由旧 `__ASREdgeMagicDataAnnotatorInlinePanel` 切换为 `__ASREdgeMagicDataHakkaInlinePanel`。
  - 快捷键运行时由旧 shared `__ASREdgeMagicDataAnnotatorShortcuts` 切换为 `__ASREdgeMagicDataHakkaShortcuts`。
- `extension/sites/magic-data/hakka-helper/assistant-panel.js`
  - 客家话新版面板入口，能力与闽南语新版一致（行内建议、说话人建议、折叠区、原始输出、全部填入）。
- `extension/sites/magic-data/hakka-helper/shortcuts-runtime.js`
  - 客家话新版快捷键动作集合。

## 待人工复核清单

1. 客家话助手面板按钮应为：
   - 主操作：`AI 质检当前条`、`全部填入AI推荐`
   - 辅助：`刷新采集`、`重置高度`、`复制 AI 质检摘要`、`显示 AI 原始输出`
2. 不应出现旧按钮：`填入第一行`、`填入第二行`、`忽略结果`。
3. 行内建议：
   - 正确项仅显示“正确”；需改项显示建议文本 + `填入本行`。
4. 说话人建议：
   - 性别/年龄正确项显示 `AI建议：正确`；需改项显示建议值和填入按钮。
5. 折叠稳定：
   - `说话人属性`、`客家话内容`、`普通话文本` 展开后不应被自动回收。
6. 接口路径：
   - 应调用 `/api/magic-data/hakka-helper/ai/review-current`（legacy `annotator` 路径兼容允许）。

## 安全说明

- 本记录未包含 token、cookie、authorization 或完整签名 URL。
