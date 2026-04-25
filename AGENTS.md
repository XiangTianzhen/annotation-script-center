# 标注脚本中心维护说明

## 项目定位

- 当前仓库根目录是 `C:\Projects\annotation-script-center`。
- 当前重点项目是 `edge-extension/`，这是“标注脚本中心”的 Edge MV3 扩展版本。
- 当前重点平台是 `Alibaba LabelX`。
- 当前重点脚本是 `edge-extension/extension/sites/alibaba-labelx/asr-judgement/`，即“阿里ASR语音判别 / ASR快判”。
- `edge-extension` 是事实上的功能源头。Edge 扩展稳定后，再整体移植到 Chrome 扩展。

## 开发策略

- 先集中调试 Edge 扩展，不要同时维护 Edge 和 Chrome 两套业务逻辑。
- 如果涉及 Edge / Chrome 差异，优先收敛到 `manifest`、浏览器 API 兼容层、打包配置或少量适配文件，业务运行时代码不要拆成两套。
- 判断和转写先完全独立，不提前抽公共 `shared` 业务目录。
- 只有后续确认某些能力确实复用时，才允许提取公共目录，并在对应 README 和 `log.md` 里记录原因、调用方和验证步骤。

## 目录边界

- `edge-extension/extension/sites/alibaba-labelx/asr-judgement/`：快判运行时代码。
- `edge-extension/extension/sites/alibaba-labelx/asr-transcription/`：转写运行时代码。
- 新任务如果是快判，不要误改 `asr-transcription/`，除非任务明确要求。
- `edge-extension/extension/sites/alibaba-labelx/` 根目录不放业务 JS，业务运行时代码放在具体脚本目录里。
- 快判页面 DOM 相关修改，优先参考 `page-structure/` 文档和 HTML 片段，不要凭印象猜结构。

## 快判模块归属

- `content.js`：快判入口编排层，只保留设置加载、启停、状态聚合、网络桥接和模块串联。
- `judgement-actions.js`：判别选项、快捷键动作顺序和“哪个ASR更优”单选写入。
- `judgement-shortcuts.js`：键盘 / 鼠标快捷键匹配、事件拦截和后续事件抑制。
- `judgement-toast.js`：右上角运行时提示。
- `judgement-toolbar.js`：`.mark-toolbox` 工具栏和顶部主导航总时长挂载。
- `judgement-page-size.js`：默认每页条数、原生分页选择器点击和重试。
- `judgement-duration-summary.js`：总时长请求、分页补齐和网络摘要归一化。
- `judgement-virtual-window.js`：未完成的实验性窗口化显示代码，当前前端不展示开关，运行时强制关闭。
- `audio-controller.js`：音频扫描、配置、状态和动作路由。
- `audio-volume-controller.js`：音量和 Web Audio gain。
- `audio-rate-controller.js`：倍速、倍速显示和重置。
- `audio-playback-controller.js`：播放、暂停、自动播放和相邻音频播放。
- `page-world/network-*.js`：运行在 MAIN world，负责 data 请求改写、响应摘要和 `postMessage`。

## 修改前检查

- 修改快判前先读：
  - `edge-extension/extension/manifest.json`
  - `edge-extension/extension/shared/constants.js`
  - `edge-extension/extension/shared/storage.js`
  - `edge-extension/extension/options/options.js`
  - `edge-extension/extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `edge-extension/extension/sites/alibaba-labelx/asr-judgement/page-structure/asr-judgement-detail/page-meta.md`
- 涉及页面结构时，再读对应 `page-structure/` 下的 HTML 或 Markdown。
- 这是浏览器扩展 content script / MAIN world 注入环境，不是 Tampermonkey 脚本。
- MAIN world 与 ISOLATED world 只能通过 `window.postMessage` 等桥接通信，注意 source/type 字符串一致。

## 文档要求

- 所有 Markdown 文档使用中文书写；技术文件名、API 名、选择器、代码标识可以保留英文。
- 每次有功能、目录结构、模块归属、选择器或验证步骤变化，都要同步更新相关 README。
- 每次有有意义的代码或行为变更，都要更新根目录 `log.md`。
- 如果新增或确认 LabelX DOM 结构，优先整理到对应脚本目录下的 `page-structure/`。

## 验证要求

- 修改 JS 后运行 `node --check` 检查变更文件。
- 修改 `manifest.json` 后必须确认 JSON 可解析，并确认 manifest 引用的脚本路径都存在。
- 快判页面人工验证至少覆盖：扩展重新加载、快判详情页加载、`1~5` 判别、音量、倍速、播放暂停、工具栏按钮、顶部总时长、每页设置、切换到非快判 active project 后不触发快判。

## Git 提交要求

- 每次完成代码或文档修改后，验证通过再提交到 git。
- 提交前先查看 `git status`，确认只暂存本轮相关文件。
- 如果工作区存在明显无关或无法确认归属的改动，不要混入提交，应在最终回复中说明。
- 提交信息使用中文，简明说明本轮改动目的。
- 除非用户明确要求，不主动 `git push`。
