# ASR 更优判断详情页

## 页面用途

这个目录记录 LabelX ASR 更优判断详情页的真实页面结构。当前页面不是传统“转写文本 + 备注”详情页，而是“一页多条题卡”的快判页面：

- 每条题卡包含音频播放器
- 每条题卡展示两段 ASR 文本
- 回答区是“哪个 ASR 更优”的单选组
- 只有一个“特殊情况标注”文本框，没有独立转写文本框

## 真实 URL 样例

- 未完成详情页：`https://labelx.alibaba-inc.com/corpora/labeling/sdk?missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 已完成只读详情页：`https://labelx.alibaba-inc.com/corpora/labeling/sdk?disableEdit=true&isFinished=true&missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`

建议把路由识别拆成：

- 路径：`/corpora/labeling/sdk`
- 关键查询参数：
  - `missionType`
  - `projectId`
  - `subTaskId`
  - `disableEdit`，已完成只读详情页可能存在
  - `isFinished`，已完成只读详情页可能存在

注意：从页面或 Network 复制 URL 时，`subTaskId` 后可能夹带编码空白，例如 `%0A`、`%20`。脚本解析 query value 时需要先解码再 `trim()`。

## 当前页面的核心板块

1. `header-toolbar.html`
   页头动作区，包含面包屑、完成状态、自动领取和提交任务按钮。
2. `top-status-bar.html`
   顶部完成度状态块，真实 class 为 `.mark-toolbox-statistic`。
3. `task-item.html`
   单条题卡容器，真实 class 为 `.labelRender-item`。
4. `audio-player.html`
   音频区，真实 class 为 `.dt-audio-base-container`。
5. `answer-panel.html`
   回答区完整面板，真实 class 为 `.labelRender-item-answer`。
6. `validity-group.html`
   文件名沿用初始化模板，但真实内容是“哪个 ASR 更优”单选组。
7. `transcription-textarea.html`
   当前页面未发现独立转写文本框，文件中保留缺失说明。
8. `remark-textarea.html`
   实际对应“特殊情况标注”文本框。
9. `action-buttons.html`
   顶部自动领取开关与提交按钮组。
10. `page-size-select.html`
    详情页分页每页条数选择器，选项包含 1、2、3、4、5、10、20、30、40、50 条/页。
11. `filter-popover.html`
    顶部筛选浮层，包含内容关键词、任务状态、回答区筛选条件和 AND/OR。
12. `appearance-settings-popover.html`
    顶部样式设置浮层，包含卡片大小、内容占比、字体、布局、隐藏区域和快捷键。

## 推荐选择器

- 页面主容器：
  - `main#mainContentWrapper`
  - `main#mainContentWrapper .renderSdk`
- 顶部动作区：
  - `.mark-toolbox`
- 顶部主导航：
  - `.header-component-container`
  - `ul.ant-v5-menu[role="menu"]`
- 顶部完成状态：
  - `.mark-toolbox-statistic`
- 顶部提交按钮区：
  - `.mark-toolbox-submit-button`
- 筛选浮层：
  - 文本 `筛选`
  - `.labelRender-toolbox-filter-select`
- 每页条数：
  - `.ant-v5-pagination-options-size-changer`
- 题卡区根容器：
  - `.render-container .labelRender-root`
- 快判扩展工具栏挂载点：
  - `.mark-toolbox`
  - 优先插入 `.mark-toolbox-breadcrumb-wrapper` 后方
- 快判扩展总时长挂载点：
  - `.header-component-container`
  - 优先插入顶部导航菜单后方
- 单条题卡：
  - `.labelRender-item[data-index]`
- 音频播放器：
  - `.dt-audio-base-container`
- 回答区：
  - `.labelRender-item-answer`
- 单选组：
  - `.labelRender-item-answer-wrap .ant-v5-radio-group`
  - `.ant-v5-radio-wrapper input[type="radio"]`
- 特殊情况文本框：
  - `.labelRender-item-answer-wrap textarea[title="填空"]`
- 样式设置：
  - 按钮文本 `样式设置`
  - `.Appearance-module__panel`

## 当前页面和初始化假设的差异

- 真实页面有多条题卡，不是单题编辑页。
- 没有独立“转写文本”输入框。
- 没有单独可见“保存”按钮，保存表现为顶部“保存成功”状态提示。
- `validity-group.html` 中的真实选项不是“有效 / 无效 / 特殊”，而是：
  - `第一个更好`
  - `第二个更好`
  - `都不好`
  - `不确定或差不多`
  - `其他方言或语种`

## 动态与风险点

- 不建议依赖这些明显不稳定的 class：
  - `css-19lwvue`
  - `css-var-`
  - `main-component-module__wrapper_eA_o1W__100`
  - `Appearance-module__triggerBtn_oP4uza__100`
- 不建议依赖这些动态值：
  - `data-id`
  - `projectId`
  - `subTaskId`
  - `wav_id`
  - 音频 `src`
  - `rc_unique_*`
- `.labelRender-item-selected` 只表示当前焦点题卡，不适合作为唯一定位条件。
- `projectId`、`subTaskId` 等 URL 参数值应先做 `decodeURIComponent(...).trim()`，不要把复制 URL 中的编码空白当成真实 ID。

## 手动验证建议

1. 打开页面后先确认 `main#mainContentWrapper` 存在。
2. 确认 `.mark-toolbox` 和 `.mark-toolbox-submit-button` 存在。
3. 确认 `.labelRender-root` 下存在多条 `.labelRender-item`。
4. 在第一条 `.labelRender-item` 内确认：
   - `.dt-audio-base-container`
   - `.labelRender-item-answer`
   - `.ant-v5-radio-group`
   - `textarea[title="填空"]`
5. 如需观察隐藏结构，可打开筛选、页码条数、样式设置浮层，但不要点击 `退出登录` 或无授权的提交/流转按钮。

## 当前快判运行时使用方式

- 页面识别由 `asr-judgement/page-detector.js` 负责。
- 题卡判别写入由 `judgement-actions.js` 负责，入口选择器为 `.labelRender-item[data-index]` 和 `.ant-v5-radio-wrapper input[type="radio"]`。
- 快捷键由 `judgement-shortcuts.js` 负责，默认 `1` 到 `5` 对应五个“哪个 ASR 更优”选项。
- 工具栏由 `judgement-toolbar.js` 负责，挂载在 `.mark-toolbox`，顶部总时长挂载在 `.header-component-container`。
- 音频由 `audio-controller.js` 串联，具体音量、倍速、播放逻辑分别在 `audio-volume-controller.js`、`audio-rate-controller.js`、`audio-playback-controller.js`。
- 每页条数由 `judgement-page-size.js` 负责，原生选择器为 `.ant-v5-pagination-options-size-changer`。
- 总时长由 `judgement-duration-summary.js` 负责，来源是 `/api/v1/label/center/subTask/{subTaskId}/data` 的 `data.dataList[].data.duration`。
- MAIN world 请求监听和 `pageSize=400` 改写由 `page-world/network-*.js` 负责。

## 后续开发建议

- 后续修改判别选择、快捷键、工具栏、分页或音频时，优先修改对应小模块，不要把功能逻辑重新写回 `content.js`。
- 提交逻辑要优先依赖 `.mark-toolbox-submit-button`，不要再假设有单独“保存”按钮。
- 提交按钮点击可能被前端必填校验阻断；真实提交应以 `/commit` 请求为准。
- 如果后续记录“标注首页”，继续放在平级 `labeling-task-home/`，不要混入本目录。
