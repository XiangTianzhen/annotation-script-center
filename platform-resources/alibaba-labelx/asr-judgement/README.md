# Alibaba LabelX ASR 快判资料

## 目录用途

本目录是 ASR 快判的平台资源入口，记录页面结构、网络请求、统计数据格式、本地调试后端和未完成能力。这里是 Chrome / Edge 共用资源，不放扩展运行时代码。

对应运行时代码仍在：

```text
extension/sites/alibaba-labelx/asr-judgement/
```

## 子目录

- `page-structure/`：快判详情页、标注首页、审核首页 DOM 结构和代表性 HTML 片段。
- `network/`：LabelX 快判相关请求采集，包含详情页 data、首页 tasks / subTasks、保存、提交、领取、释放等接口记录。
- `ai/`：快判 AI 半自动建议规则资料，包含规则压缩版、prompt 模板和 few-shot 示例。
- `backend/`：快判统计上传本地 Node 调试服务，按分包 ID 合并 CSV 宽表，并提供统计接口、CSV 下载接口和数据契约说明。
- `unfinished.md`：未完成能力、风险点和后续验证条件。

## 当前已迁移资料

- 快判详情页：`/corpora/labeling/sdk?missionType=label&projectId=...&subTaskId=...`
- 已完成只读详情页：`/corpora/labeling/sdk?disableEdit=true&isFinished=true&missionType=label&projectId=...&subTaskId=...`
- 标注首页：`/corpora/labeling/labelingTask?projectId=...`
- 审核首页：`/corpora/labeling/checkTask?projectId=...`
- 顶部头像下拉用户信息结构。
- 快判网络采集 `01` 到 `23`，以及待采集项和大页数负载测试片段。
- 快判 AI 半自动建议接口：`/api/alibaba-labelx/asr-judgement/ai/health`、`/api/alibaba-labelx/asr-judgement/ai/suggest`。
- AI 第一版模型固定走 `qwen3-omni-flash`（后续预留 `qwen3.5-omni-plus`），已取消 MiniMax 接入计划。
- 当前扩展版本：`0.2.6`。
- AI 文本 prompt 仅包含 `asrText1/asrText2`；`projectId/subTaskId/itemId/itemIndex/audioUrl` 不进入模型文本上下文。
- `audioUrl` 仅用于模型音频输入字段。

## 维护规则

- 新增 LabelX DOM、网络请求或统计契约时，优先更新本目录。
- 如果运行时代码仍引用旧路径，应同步更新对应 README，避免资料入口分裂。
- `extension/sites/alibaba-labelx/asr-judgement/page-structure/` 不再保存快判页面结构；页面结构和网络采集内容统一维护在本目录。

## 0.2.11 当前统计口径（快判）

- 当前版本保持 `0.2.11`，本轮为小修正，不升级 `0.2.12`。
- 统计主存储保持根级总表：`statistics-data/statistics-merged.csv`。
- 不再主动创建 `statistics-data/suppliers/`；若本地已存在，属于旧方案残留，可忽略或手动清理。
- CSV 供应商列动态策略：
  - 单供应商不输出 `供应商` 列。
  - 多供应商在最后一列输出 `供应商`。
- CSV 写出前统一清洗字段：去 BOM、去首尾空白（含全角空格/Tab/换行/零宽字符），任务名称/ID/人员/时间/完成状态/供应商都不保留前后空格。
- 供应商识别优先级：
  1. `payload.supplier/vendor`
  2. `csvPatch["供应商"]`
  3. `taskName` 推断（含 `棋燊`、`希尔贝壳`）
  4. `未识别供应商`
- 若 `csvPatch["供应商"]` 为 `未识别供应商` / `unknown-supplier` / 空值，必须回退到任务名重新识别。
- 快判首页和详情按 `recordCount` 补齐，不再静默截断。
- 快判详情保持 `pageSize=400` 业务口径。
- 快判并发规则：`Math.floor(total/5)`，最小 `1`，最大 `500`（并发显示值需与实际一致）。
- 快判上传已接入共享进度组件 `extension/shared/progress-indicator.js`，显示阶段、完成/总数、百分比、并发、成功/失败。
