# DataBaker CVPC 柳州话脚本运行时

## 命中范围

- 站点：`https://cvpc.data-baker.com/*`
- 目标页：`/app/editor/asr/`

## 当前能力

- 读取 `annotation/meta` 和当前路由上下文
- 生成当前音频的画段建议
- 对当前段生成：
  - `柳州话文本`
  - `普通话顺滑`
- 当前段实验性填入
- 当前段 `Valid / Invalid` 快捷切换

## 当前边界

- 不自动保存
- 不自动提交
- 不自动切下一条
- 不跨当前音频自动遍历
- 画段创建 / 更新仍是实验性入口；未检测到安全写入桥时只保留建议展示

## 文件

- `content.js`：入口编排与路由检测
- `data-api.js`：读取编辑器上下文与实验性 DOM 写入
- `segmentation-controller.js`：画段建议生成与应用编排
- `ai-recommendation.js`：当前段 AI 推荐调用
- `ui-panel.js`：固定浮层面板
- `shortcuts.js`：固定默认快捷键
