# Alibaba LabelX ASR 快判资料

## 目录用途

本目录是 ASR 快判的平台资料入口，记录页面结构、网络请求、统计数据格式和未完成能力。这里是 Edge / Chrome 共用资料，不放扩展运行时代码。

对应运行时代码仍在：

```text
edge-extension/extension/sites/alibaba-labelx/asr-judgement/
```

## 子目录

- `page-structure/`：快判详情页、标注首页、审核首页 DOM 结构和代表性 HTML 片段。
- `network/`：LabelX 快判相关请求采集，包含详情页 data、首页 tasks / subTasks、保存、提交、领取、释放等接口记录。
- `statistics/`：统计 CSV、上传 payload 和本地调试服务契约说明。
- `unfinished.md`：未完成能力、风险点和后续验证条件。

## 当前已迁移资料

- 快判详情页：`/corpora/labeling/sdk?missionType=label&projectId=...&subTaskId=...`
- 已完成只读详情页：`/corpora/labeling/sdk?disableEdit=true&isFinished=true&missionType=label&projectId=...&subTaskId=...`
- 标注首页：`/corpora/labeling/labelingTask?projectId=...`
- 审核首页：`/corpora/labeling/checkTask?projectId=...`
- 顶部头像下拉用户信息结构。
- 快判网络采集 `01` 到 `23`，以及待采集项和大页数负载测试片段。

## 维护规则

- 新增 LabelX DOM、网络请求或统计契约时，优先更新本目录。
- 如果运行时代码仍引用旧路径，应同步更新对应 README，避免资料入口分裂。
- `edge-extension/.../asr-judgement/page-structure/` 目前作为迁移兼容快照保留，后续新增资料不再写入旧目录。
