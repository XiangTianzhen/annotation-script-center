# ASR 更优判断详情页

## 页面用途

这个目录记录 LabelX ASR 更优判断详情页的真实页面结构。当前页面不是传统“转写文本 + 备注”详情页，而是“一页多条题卡”的快判页面：

- 每条题卡包含音频播放器
- 每条题卡展示两段 ASR 文本
- 回答区是“哪个 ASR 更优”的单选组
- 只有一个“特殊情况标注”文本框，没有独立转写文本框

## 真实 URL 样例

- `https://labelx.alibaba-inc.com/corpora/labeling/sdk?missionType=label&projectId=1023&subTaskId=20866519`

建议把路由识别拆成：

- 路径：`/corpora/labeling/sdk`
- 关键查询参数：
  - `missionType`
  - `projectId`
  - `subTaskId`

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

## 推荐选择器

- 页面主容器：
  - `main#mainContentWrapper`
  - `main#mainContentWrapper .renderSdk`
- 顶部动作区：
  - `.mark-toolbox`
- 顶部完成状态：
  - `.mark-toolbox-statistic`
- 顶部提交按钮区：
  - `.mark-toolbox-submit-button`
- 题卡区根容器：
  - `.render-container .labelRender-root`
- 工具栏挂载点候选：
  - `.labelRender-toolbox-area`
  - `.labelRender-toolbox-left`
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

## 手动验证建议

1. 打开页面后先确认 `main#mainContentWrapper` 存在。
2. 确认 `.mark-toolbox` 和 `.mark-toolbox-submit-button` 存在。
3. 确认 `.labelRender-root` 下存在多条 `.labelRender-item`。
4. 在第一条 `.labelRender-item` 内确认：
   - `.dt-audio-base-container`
   - `.labelRender-item-answer`
   - `.ant-v5-radio-group`
   - `textarea[title="填空"]`
5. 不要点击“提交任务”或切换自动领取。

## 后续开发建议

- `annotation-item-collector.js` 可以继续以 `.labelRender-item` 作为采集入口。
- `annotation-toolbar.js` 可优先考虑：
  - 方案一：插入到第一条 `.labelRender-item` 前
  - 方案二：挂在 `.mark-toolbox` 后
- 提交逻辑要优先依赖 `.mark-toolbox-submit-button`，不要再假设有单独“保存”按钮。
- 如果后续记录“标注首页”，建议新建平级目录，不复用本目录。
