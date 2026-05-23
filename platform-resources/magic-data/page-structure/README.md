# Magic Data 页面结构索引

## 目录用途

本目录保存 Magic Data ANNOTATOR 的页面结构采集记录，当前以“真实访问证据 + bundle 关键词”方式沉淀。

## 当前已采集页面

- `01-welcome.md`：首页 `#/welcome`
- `02-mark-list.md`：标注任务页 `#/mark/list`
- `03-mark-details.md`：标注任务详情页 `#/mark/details`
- `04-asrmark.md`：标注单条页 `#/asrmark`
- `05-check-task.md`：审核任务页 `#/checkTask`
- `06-check-task-detail.md`：审核任务详情页 `#/checkdata/taskDetail`
- `07-asrmark-check.md`：审核单条页 `#/asrmarkCheck`

## 证据等级说明

- `已确认`：来自真实请求或 bundle 关键词直接证据。
- `待补采`：需在真实页面 Elements 面板补充精确选择器。

## 读取顺序建议

1. 先看 `01-welcome.md` 了解壳层与路由。
2. 再看 `02~04`（标注链路）与 `05~07`（审核链路）。
3. 需要接口细节时联读 `../network/`。

## 说话人属性选择器补充（2026-05-23）

- 说话人属性区域关键锚点：`.speaker-attributes`（或包含标题“说话人属性”的表单容器）。
- 性别、年龄读取只允许读取“已选 radio”：
  - `.el-form-item`（label=性别/年龄）内 `.el-radio.is-checked input.el-radio__original`
  - 备选：`[role="radio"][aria-checked="true"]`
- 禁止通过容器 `textContent` 是否包含“男/女/年龄段”来判断选中项。
