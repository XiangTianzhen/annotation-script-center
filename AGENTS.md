# 标注脚本中心维护说明

## 项目定位

- 当前仓库根目录是 `C:\Projects\annotation-script-center`。
- 当前重点项目是 `edge-extension/extension/`，这是“标注脚本中心”的 Chrome / Chromium MV3 兼容扩展源码目录。
- 当前重点平台是 `Alibaba LabelX`。
- 当前重点脚本是 `edge-extension/extension/sites/alibaba-labelx/asr-judgement/`，即“阿里ASR语音判别 / ASR快判”。
- `edge-extension/extension/` 是唯一业务运行时代码源。Chrome 和 Edge 本地加载、打包、调试都应优先使用同一目录，不再复制一套业务逻辑。

## 开发策略

- 先继续以 Edge 作为主要人工验证浏览器，同时保持源码为 Chrome / Chromium MV3 通用形态。
- 不要同时维护 Edge 和 Chrome 两套业务逻辑；Chrome、Edge 应加载同一个 `extension/` 目录或同一份打包产物。
- 如果涉及 Edge / Chrome 差异，优先收敛到 `manifest`、浏览器 API 兼容层、打包配置、发布说明或少量适配文件，业务运行时代码不要拆成两套。
- 判断和转写先完全独立，不提前抽公共 `shared` 业务目录。
- 只有后续确认某些能力确实复用时，才允许提取公共目录，并在对应 README 和 `log.md` 里记录原因、调用方和验证步骤。

## 目录边界

- `edge-extension/extension/sites/alibaba-labelx/asr-judgement/`：快判运行时代码。
- `edge-extension/extension/sites/alibaba-labelx/asr-transcription/`：转写运行时代码。
- `platform-resources/`：Edge / Chrome 共用的平台资源库，保存 LabelX 页面结构、网络请求、统计格式、未完成事项和浏览器无关调试工具。
- `platform-resources/backend/`：平台资源统一 Node 后端入口，后续新增平台 / 项目 API 时优先接入这里。
- `platform-resources/alibaba-labelx/asr-judgement/backend/`：快判统计上传本地 Node 调试服务，按 `batchId` / 分包ID 合并 CSV 宽表。
- 新任务如果是快判，不要误改 `asr-transcription/`，除非任务明确要求。
- `edge-extension/extension/sites/alibaba-labelx/` 根目录不放业务 JS，业务运行时代码放在具体脚本目录里。
- 快判页面 DOM 或网络相关修改，优先参考 `platform-resources/alibaba-labelx/asr-judgement/` 下的文档和 HTML 片段，不要凭印象猜结构。

## 快判模块归属

- `content.js`：快判入口编排层，只保留设置加载、启停、状态聚合、网络桥接和模块串联。
- `judgement-actions.js`：判别选项、快捷键动作顺序和“哪个ASR更优”单选写入。
- `judgement-shortcuts.js`：键盘 / 鼠标快捷键匹配、事件拦截和后续事件抑制。
- `judgement-toast.js`：右上角运行时提示。
- `judgement-toolbar.js`：`.mark-toolbox` 工具栏和顶部主导航总时长 / 默认音频参数 / 每页条数挂载。
- `judgement-page-size.js`：默认每页条数、原生分页选择器点击和重试。
- `judgement-duration-summary.js`：总时长请求、分页补齐和网络摘要归一化。
- `judgement-virtual-window.js`：未完成的实验性窗口化显示代码，当前前端不展示开关，运行时强制关闭。
- `judgement-asr-diff-view.js`：ASR 文本对齐差异视图，隐藏原始双行文本并生成高亮对齐阅读区，维护差异高亮颜色。
- `judgement-thunder-question.js`：雷题库读取、题卡匹配、标准答案提示和当前选择不一致告警。
- `judgement-compact-card.js`：轻量题卡摘要，在对应 `.labelRender-item` 根节点内部补充 ASR 文本、音频时间比和当前判别状态，可视宽度跟随原题卡且不破坏 LabelX 原生多列布局。
- `asr-judgement-server.js`：快判扩展侧统计上传模块，顶部导航头像旁挂载“上传统计”，详情页、标注首页、审核首页和定时上传统一通过 LabelX `tasks` / `subTasks` / `subTask/{id}/data` 按 `projectId` 批量采集，并上传给外部服务端。
- `platform-resources/backend/`：统一 Node 后端启动入口和基础路由工具，`server.js` 是推荐启动入口。
- `platform-resources/alibaba-labelx/asr-judgement/backend/`：快判统计本地 Node 调试服务目录，`index.js` 注册项目 API，`server.js` 保留为兼容启动入口。
- `judgement-auto-advance.js`：选择判别结果后的当前页自动下一题。
- `audio-controller.js`：音频扫描、默认配置、单音频临时状态和动作路由。
- `audio-volume-controller.js`：当前音频音量和 Web Audio gain；重置回 options 默认音量。
- `audio-rate-controller.js`：当前音频倍速、倍速显示和重置；重置回 options 默认倍速。
- `audio-playback-controller.js`：播放、暂停、自动播放、相邻音频播放和当前音频前进 / 后退。
- `page-world/network-*.js`：运行在 MAIN world，负责 data 请求改写、响应摘要和 `postMessage`。

## 修改前检查

- 修改快判前先读：
  - `edge-extension/extension/manifest.json`
  - `edge-extension/extension/shared/constants.js`
  - `edge-extension/extension/shared/storage.js`
  - `edge-extension/extension/options/options.js`
  - `edge-extension/extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `platform-resources/alibaba-labelx/asr-judgement/README.md`
  - `platform-resources/alibaba-labelx/asr-judgement/page-structure/asr-judgement-detail/page-meta.md`
- 涉及页面结构、网络请求或统计格式时，再读 `platform-resources/alibaba-labelx/asr-judgement/` 下对应资料。
- 这是浏览器扩展 content script / MAIN world 注入环境，不是 Tampermonkey 脚本。
- MAIN world 与 ISOLATED world 只能通过 `window.postMessage` 等桥接通信，注意 source/type 字符串一致。

## 文档要求

- 所有 Markdown 文档使用中文书写；技术文件名、API 名、选择器、代码标识可以保留英文。
- 每次有功能、目录结构、模块归属、选择器或验证步骤变化，都要同步更新相关 README。
- 每次有有意义的代码或行为变更，都要更新根目录 `log.md`。
- 如果新增或确认 LabelX DOM 结构、网络请求或统计契约，优先整理到 `platform-resources/` 对应平台和脚本项目目录。

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
