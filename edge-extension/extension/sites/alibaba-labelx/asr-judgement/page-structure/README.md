# 阿里 ASR 语音判别页面结构资料

## 目录用途

这个目录保存通过 Chrome DevTools 或页面控制台采集的页面结构资料，归属于 `extension/sites/alibaba-labelx/asr-judgement/`。

当前这些资料服务于阿里 ASR 语音判别 / ASR 快判脚本，不再作为 LabelX 站点级公共页面结构目录。

- 只记录 DOM 结构、候选选择器、动态风险和验证建议。
- 不在这里放自动执行逻辑。
- 除用户明确授权的网络采集外，不通过页面交互触发保存、提交、自动流转等业务动作。

## 当前已采集页面

- `asr-judgement-detail/`
  - LabelX ASR 更优判断详情页
  - 实际路由：`/corpora/labeling/sdk?missionType=label&projectId=...&subTaskId=...`
  - 已完成只读详情页路由：`/corpora/labeling/sdk?disableEdit=true&isFinished=true&missionType=label&projectId=...&subTaskId=...`
  - 页面为 React 单页应用，主入口在 `#root`
- `labeling-task-home/`
  - LabelX 标注首页 / 标注任务列表页
  - 实际路由：`/corpora/labeling/labelingTask?projectId=...`
  - 页面包含“我的任务”和“可领取的任务”两个主要列表区域

## 这份资料服务哪些脚本

当前采集结果为 ASR 快判运行时提供 DOM 和网络依据。快判已接入独立运行时，options 详情页使用快判简化设置，不复用语音转写设置面板。

## 文件组织规则

- 每个页面类型使用一个独立子目录。
- `README.md` 记录页面用途、板块说明、推荐选择器和人工验证步骤。
- `page-meta.md` 记录 URL 规则、框架痕迹、动态节点风险和开发建议。
- 每个 `*.html` 文件只保存一个板块的代表性脱敏 `outerHTML`。
- `network-capture/` 保存网络请求采集资料，每个关键请求使用一个独立 Markdown 文件。
- `common-top-nav-avatar-dropdown.html` 记录 LabelX 顶部导航右侧头像下拉菜单的共享结构。
- 如果某个预期板块在真实页面中不存在，保留对应文件并明确写出“不存在”的原因，避免后续脚本误判。

## 当前页面类型与文件映射

`asr-judgement-detail/` 下的主要文件：

- `header-toolbar.html`
  - 页头、面包屑、完成状态、自动领取和提交任务按钮区域。
- `top-status-bar.html`
  - 顶部完成度状态块。
- `task-item.html`
  - 单个题卡容器，包含内容区和回答区。
- `audio-player.html`
  - 音频播放器与倍速/刷新状态区。
- `answer-panel.html`
  - 回答区完整面板。
- `validity-group.html`
  - 实际是“哪个 ASR 更优”单选组；文件名沿用初始化模板。
- `transcription-textarea.html`
  - 当前页面不存在独立转写文本框，文件中保留不存在说明。
- `remark-textarea.html`
  - 实际对应“特殊情况标注”文本框。
- `action-buttons.html`
  - 自动领取开关与“提交任务”按钮区。
- `page-size-select.html`
  - 详情页每页条数选择器。
- `filter-popover.html`
  - 详情页筛选浮层。
- `appearance-settings-popover.html`
  - 详情页样式设置浮层。
  - `network-capture/`
    - LabelX ASR 更优判断详情页网络请求采集资料。
  - 当前包含初始化、数据读取、模板读取、统计/面板读取、音频加载、心跳、保存、提交任务、手动领取、释放、自动领取空池路径、分页/筛选、提交后首页列表请求和已完成子任务列表。
  - 快判运行时的总时长统计和 `pageSize=400` 改写主要参考 `network-capture/03-subtask-data.md` 与 `network-capture/19-subtask-data-pagination-filter.md`。
  - 自动领取成功进入新详情页、下一条、切换任务、服务端提交失败仍待二次采集。

## 采集与后续补充约定

后续你要补充更多页面时，建议继续沿用这套方法：

1. 在 Chrome 打开目标页面并完成登录。
2. 先确认 URL 规则和页面名称。
3. 用 `chrome_devtools` 或 DevTools Console 找到最小稳定容器。
4. 每个板块只保留一个脱敏后的代表性 `outerHTML`。
5. 在 `page-meta.md` 里同步补充：
   - 推荐选择器
   - 动态 class 风险
   - 是否异步加载
   - 哪些节点刷新后会变化

## 脱敏规则

- 项目名、题目文本、音频 URL、任务 ID、wav_id、签名参数全部替换为 `REDACTED_*`。
- URL 参数中如果夹带 `%0A`、`%20` 等编码空白，文档统一记录为修剪后的 canonical 形式。
- `data-aplus-*`、`data-spm-*`、`aria-describedby`、明显的埋点和随机 ID 不保留。
- `css-19lwvue`、`css-var-` 这类构建期/运行时样式 class 不作为稳定选择器依据。

## 下一步扩展建议

- 如果要继续采集判断项目的页面，建议在当前目录下新增独立子目录，而不是混进 `asr-judgement-detail/`。
- 如果要采集转写项目页面，应放到 `extension/sites/alibaba-labelx/asr-transcription/page-structure/`。
- 如果后续确认某个页面结构被判断和转写共同使用，再讨论提升为站点公共资料目录，并同步更新仓库根目录 `AGENTS.md` 和 `log.md`。
- 标注首页已记录在 `labeling-task-home/`，后续如采集质检/验收首页，应另建平级目录。
