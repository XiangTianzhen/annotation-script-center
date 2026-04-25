# 页面元信息

- 页面名称：智能标注
- 页面类型：ASR 更优判断详情页
- 页面 URL 样例：`https://labelx.alibaba-inc.com/corpora/labeling/sdk?missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 已完成只读 URL 样例：`https://labelx.alibaba-inc.com/corpora/labeling/sdk?disableEdit=true&isFinished=true&missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>`
- 页面用途：在同一页内批量判断多条音频题卡的两个 ASR 结果谁更优，并可填写“特殊情况标注”
- 顶层容器：
  - `#root`
  - `main#mainContentWrapper`
  - `.renderSdk`
- 题卡区根容器：
  - `.render-container`
  - `.labelRender-root.innerScroll`
  - `.labelRender-scrollable`
- 单条任务卡片容器：
  - `.labelRender-item[data-index][data-id]`
- 顶部状态区：
  - `.mark-toolbox`
  - `.mark-toolbox-statistic`
- 快判扩展工具栏挂载点：
  - `.mark-toolbox`
  - `.mark-toolbox-breadcrumb-wrapper` 后方
- 快判扩展顶部总时长挂载点：
  - `.header-component-container`
  - `ul.ant-v5-menu[role="menu"]` 后方
- 音频播放器选择器：
  - `.dt-audio-base-container`
  - `audio[controls][controlslist="nodownload noplaybackrate"]`
- 单选组选择器：
  - `.labelRender-item-answer-wrap .ant-v5-radio-group`
  - `.ant-v5-radio-wrapper input[type="radio"]`
- 特殊情况文本框选择器：
  - `.labelRender-item-answer-wrap textarea[title="填空"]`
  - `.labelRender-item-answer-wrap textarea[maxlength="20000"]`
- 顶部动作按钮区：
  - `.mark-toolbox-submit-button`
  - `.mark-toolbox-submit-button .ant-v5-dropdown-button`
- 每页条数选择器：
  - `.ant-v5-pagination-options-size-changer`
  - `input[aria-label="页码"]`
- 筛选面板：
  - 文本 `筛选`
  - `.labelRender-toolbox-filter-select`
  - `input[placeholder="请输入内容关键词"]`
- 样式设置面板：
  - 按钮文本 `样式设置`
  - `.Appearance-module__panel`
- 提交按钮选择器：
  - `.mark-toolbox-submit-button button.ant-v5-btn`
  - `.mark-toolbox-submit-button .ant-v5-dropdown-trigger`
- 自动领取开关选择器：
  - `.mark-toolbox-submit-button button[role="switch"]`
- 保存状态提示：
  - `.mark-toolbox [aria-label="check-circle"]`
  - 页面可见文本 `保存成功`

## 渲染与加载特征

- 渲染框架特征：
  - `#root` 下存在 React root 痕迹
  - 未发现 Vue `data-v-app`
  - 未发现 iframe
  - 未发现 shadow root
- 首屏是否异步加载：是
  - 依据：页面进入后发起了多条 `xhr/fetch` 请求，再渲染题卡列表和摘要信息
- 本次观察到的关键接口：
  - `GET /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/data?page=1&pageSize=10...`
  - `GET /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/summary`
  - `GET /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/board...`
  - `POST /api/v1/label/center/timer`
  - `POST /api/v1/label/center/<REDACTED_SUBTASK_ID>/session`
  - `POST /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/data`

## 动态节点与不稳定因素

- 刷新后会变化的节点：
  - 面包屑中的项目名
  - `projectId` / `subTaskId`
  - 完成度数字
  - `.labelRender-item` 的 `data-id`
  - 当前选中题卡的 `.labelRender-item-selected`
  - 单选组的 `name="rc_unique_*"`
  - 音频 `src`
  - `wav_id`
  - 题面文本内容
- 看起来像 hash class 或构建产物 class，不适合直接依赖：
  - `css-19lwvue`
  - `css-var-`
  - `main-component-module__wrapper_eA_o1W__100`
  - `Appearance-module__triggerBtn_oP4uza__100`
- 不建议依赖的运行时属性：
  - `data-aplus-*`
  - `data-spm-*`
  - `aria-describedby`
- URL 参数风险：
  - `subTaskId` 复制值可能夹带 `%0A`、`%20` 等编码空白，脚本内部应使用解码并 trim 后的 ID。

## 真实结构结论

- 顶部存在统一页头动作区 `.mark-toolbox`。
- 页面没有显式“保存”按钮，保存表现为状态提示“保存成功”。
- 顶部有“自动领取”开关和“提交任务”按钮组合。
- 顶部有“筛选”和“样式设置”浮层入口。
- 分页右侧有每页条数选择器，选项为 1、2、3、4、5、10、20、30、40、50 条/页。
- 页面正文是多条 `.labelRender-item` 组成的题卡列表，不是单条详情编辑页。
- 每条题卡由“内容区 + 回答区”组成：
  - 内容区：音频播放器 + 两个 ASR 文本 + `wav_id`
  - 回答区：单选组 + 特殊情况文本框 + 历史标注按钮
- 初始化模板中的 `transcription-textarea.html` 在本页不适用，因为没有独立转写文本框。

## 当前扩展脚本开发建议

- 题卡遍历逻辑以 `.labelRender-item[data-index]` 为主，不依赖 `.labelRender-item-selected`。
- 音频控制逻辑以 `.dt-audio-base-container` 内的按钮和 `audio` 元素为主。
- 单选写入逻辑直接定位 `.ant-v5-radio-wrapper input[type="radio"]`，值文本以页面实际选项为准。
- 文本写入逻辑只针对 `textarea[title="填空"]`，不要误判为转写输入框。
- 顶部按钮逻辑只针对 `.mark-toolbox-submit-button`；若需要“保存”能力，应优先识别自动保存状态，而不是寻找不存在的保存按钮。
- 单选和填空保存共用 `/api/v1/label/center/subTask/{subTaskId}/data`，但扩展默认不应主动调用。
- 筛选与每页条数会刷新数据接口，脚本应监听最新一次 `data` 请求而不是只缓存首次加载结果。
- 自定义快判工具栏当前由 `judgement-toolbar.js` 挂载到 `.mark-toolbox`。
- 顶部总时长当前由 `judgement-toolbar.js` 挂载到 `.header-component-container`。
- 默认每页条数切换由 `judgement-page-size.js` 驱动，网络层由 `page-world/network-url-rewriter.js` 改写 data 请求。

## 采集备注

- 当前采集日期：2026-04-23
- 采集方式：Google Chrome + `chrome_devtools` MCP 只读采集
- 采集人：Codex（用户手动登录）
- 页面是否包含脱敏处理：是
- 是否需要登录态：是
