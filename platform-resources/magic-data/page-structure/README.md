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
- `08-devtools-readonly-check-2026-05-24.md`：闽南语助手只读排查记录（首次排查口径）
- `09-playwright-edge-readonly-retest-2026-05-24.md`：Playwright-Edge 仅交互复测清单（扩展已挂载、按钮可点性、折叠回收与 hover 闪烁复测）
- `10-playwright-edge-fix-retest-2026-05-24.md`：Playwright-Edge 修复后复测记录（幂等更新、折叠保持、按钮布局与批量填入行为）

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

## 闽南语文本行结构补充（2026-05-23）

- 当前条文本区域容器：`.region-item[region_id]`。
- 每一行文本容器：`.speak-item`。
- 可编辑文本节点：`.edit.region-edit[contenteditable="true"]`。
- 行索引优先读取 `data-index`，兼容 `alt`：
  - `0`：闽南语文本行
  - `1`：普通话文本行
- 行内说话人选择值可读取：
  - `.speaker-options-group-bg .el-radio.is-checked input.el-radio__original`
- 页面可能存在重复 id（如 `#EasyEditableDiv`），禁止将该 id 作为唯一定位依据。

## 闽南语助手说话人建议插入补充（2026-05-23）

- 闽南语助手不再创建左侧独立大摘要框。
- 说话人建议直接插入平台原生表单项：
  - 根容器：`.speaker-attributes`
  - 字段项：`.el-form-item`
  - 字段 label：`label.el-form-item__label`（文本为 `性别` / `年龄`）
- 建议块插入位置：
  - 在对应 `.el-form-item` 内，优先追加到 `.el-form-item__content` 之后。
  - 建议块属性：`data-asc-magic-data-minnan-speaker-suggestion="性别|年龄"`
- 正确项仅显示 `AI建议：正确`；需改项显示建议值 + 填入按钮。
