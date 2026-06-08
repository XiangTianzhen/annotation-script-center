# DataBaker CVPC 柳州话脚本运行时

## 命中范围

- 站点：`https://cvpc.data-baker.com/*`
- 目标页：`/app/editor/asr/`

## 当前能力

- 读取 `annotation/meta` 和当前路由上下文
- 在 `.page-top .top-right` 工具栏追加当前音频动作按钮
- 生成当前音频的画段建议
- 对当前段生成：
  - `柳州话文本`
  - `普通话顺滑`
- 当前段实验性填入
- 当前段 `Valid / Invalid` 快捷切换
- 可选屏蔽文案为“您正在编辑该作业,不能打开新的Tab页”的平台高层提示

## 当前边界

- 不自动保存
- 不自动提交
- 不自动切下一条
- 不跨当前音频自动遍历
- 画段创建 / 更新仍是实验性入口；未检测到安全写入桥时只保留建议展示
- 提示屏蔽默认开启，但只精确匹配上述固定文案，不会扩大到其他 `.tips` 提示

## 文件

- `content.js`：入口编排与路由检测
- `editing-tab-tip-guard.js`：精确屏蔽固定文案的 Tab 限制提示
- `data-api.js`：读取编辑器上下文与实验性 DOM 写入
- `segmentation-controller.js`：画段建议生成与应用编排
- `ai-recommendation.js`：当前段 AI 推荐调用
- `ui-panel.js`：顶部工具栏按钮 + 悬浮状态面板
- `shortcuts.js`：当前页快捷键监听与动作分发

## Options 口径

- 脚本详情页的快捷键当前统一复用 `extension/options/options-shared-shortcut-panel.js`。
- 默认快捷键为空；只有用户在 options 中录制并保存后，运行时才会响应对应动作。
- `基础设置` 当前新增“屏蔽‘不能打开新的Tab页’提示”开关，默认开启。
- 运行时当前兼容旧版 `Shift + 数字` 风格的已保存快捷键；像 `Alt + Shift + 2/3` 这类历史组合在新版本里仍可继续触发。
