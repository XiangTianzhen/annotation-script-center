# ASR 快判页面结构资料

## 目录用途

本目录保存通过 Chrome DevTools、playwright-edge 或页面控制台采集的 LabelX ASR 快判页面结构资料，是当前主维护页面结构入口。

旧位置 `edge-extension/extension/sites/alibaba-labelx/asr-judgement/page-structure/` 已移除；后续新增或修正页面结构时，应优先更新本目录。

## 当前已采集页面

- `asr-judgement-detail/`
  - LabelX ASR 更优判断详情页。
  - 实际路由：`/corpora/labeling/sdk?missionType=label&projectId=...&subTaskId=...`。
  - 已完成只读详情页路由：`/corpora/labeling/sdk?disableEdit=true&isFinished=true&missionType=label&projectId=...&subTaskId=...`。
- `labeling-task-home/`
  - LabelX 标注首页 / 标注任务列表页。
  - 实际路由：`/corpora/labeling/labelingTask?projectId=...`。
- `check-task-home/`
  - LabelX 审核首页 / 审核任务列表页。
  - 实际路由：`/corpora/labeling/checkTask?projectId=...`。
- `common-top-nav-avatar-dropdown.html`
  - LabelX 顶部导航右侧头像下拉菜单共享结构。

## 文件组织规则

- 每个页面类型使用一个独立子目录。
- `README.md` 记录页面用途、板块说明、推荐选择器和人工验证步骤。
- `page-meta.md` 记录 URL 规则、框架痕迹、动态节点风险和开发建议。
- 每个 `*.html` 文件只保存一个板块的代表性脱敏 `outerHTML`。
- 网络请求资料已从旧 `network-capture/` 拆到同级 `../network/`。

## 推荐读取顺序

1. 先读本文件，确认页面类型。
2. 详情页改动读 `asr-judgement-detail/page-meta.md` 和对应 HTML 片段。
3. 首页上传 / 任务列表改动读 `labeling-task-home/page-meta.md`、`check-task-home/README.md` 和 `../network/12-home-subtasks.md`、`../network/13-home-tasks.md`、`../network/23-check-task-home.md`。
4. 用户名读取相关改动读 `common-top-nav-avatar-dropdown.html`。

## 脱敏规则

- 项目名、题目文本、音频 URL、任务 ID、wav_id、签名参数全部替换为 `REDACTED_*`。
- URL 参数中如果夹带 `%0A`、`%20` 等编码空白，文档统一记录为修剪后的规范化形式。
- `data-aplus-*`、`data-spm-*`、`aria-describedby`、明显的埋点和随机 ID 不保留。
- `css-19lwvue`、`css-var-` 这类构建期 / 运行时样式 class 不作为稳定选择器依据。
