# Alibaba LabelX 平台资源

## 平台范围

本目录保存 Alibaba LabelX 相关的平台资料和调试工具，供 Chrome / Edge 共用的 `extension/` 扩展源码共同参考。

当前已整理的脚本项目：

- `asr-judgement/`：阿里 ASR 语音判别 / ASR 快判。
- `asr-transcription/`：阿里 ASR 语音转写，已补充转写首页与详情页的脱敏网络请求文档（见 `asr-transcription/network.md`）。
- `network.md`：LabelX 标注 / 审核首页和详情页中已确认可被转写、快判共用的网络接口结构。
- `page-structure.md`：LabelX 通用顶部导航、首页列表、详情页工具栏、题卡和音频结构。

## 通用约定

- 页面结构和网络接口以真实采集为准，不凭印象写选择器。
- 项目级资料放到具体脚本项目目录，不提前抽公共 shared。
- 只有确认判断和转写确实复用的 LabelX 平台级事实，才放在本目录根级 README 中。
- 涉及人员、任务、音频签名、token、cookie、session 的内容必须脱敏。
- 采集 HTML 结构和 Network 默认只用 Google Chrome DevTools / MCP。
- Playwright Edge 仅用于真实按钮/快捷键行为验证，或 DevTools 不可用时兜底。
- Codex 默认只负责打开浏览器；用户自行登录并进入目标页面，回复“处理好了”后再继续采集或测试。

## 已确认通用事实

- LabelX 是 React 单页应用，页面主要挂载在 `#root`。
- 顶部导航右侧头像下拉结构可用于读取当前用户展示名，当前共享片段保存在 `asr-judgement/page-structure/common-top-nav-avatar-dropdown.html`。
- 页面中的 `data-aplus-*`、`data-spm-*`、`aria-describedby` 和运行时随机 class 不作为稳定选择器依据。
- 标注首页和审核首页共用 `tasks`、`subTasks`、`tasks/process` 三类列表接口，差异主要是 `type` / `subTaskType`。
- 详情页共用 `subTask/{id}/data`、`summary`、`board`、`getLabelTaskInfo` 初始化接口。
- 详情页保存当前题数据使用 `POST /api/v1/label/center/subTask/{subTaskId}/data`，提交当前包使用 `POST /api/v1/label/center/subTask/{subTaskId}/commit`。
- 当前已采集响应中没有独立 `supplier/vendor/company/provider/供应商` 字段；供应商只能从任务名称前缀推断。

## 0.2.11 统计总表修正（转写/快判共识）

- 当前版本维持 `0.2.11`，本轮为 `0.2.11` 修正增强，不升级 `0.2.12`。
- 统计 CSV 采用动态供应商列：
  - 单供应商数据集不输出 `供应商` 列。
  - 多供应商数据集在最后一列追加 `供应商` 列。
- CSV 写出前统一做字段清洗：去 BOM、去首尾空白（含全角空格/Tab/换行/零宽字符），任务名称/ID/人员/时间/状态/供应商都不保留前后空格。
- 内部 payload / mergeKey 继续保留 supplier 信息，保证跨供应商同分包 ID 不覆盖。
- 供应商识别优先级：
  1. `payload.supplier.name` / `payload.vendor.name`
  2. `payload.supplier` / `payload.vendor`
  3. `csvPatch["供应商"]`
  4. `taskName/name` 推断（当前已知：`棋燊`、`希尔贝壳`）
  5. `未识别供应商`
- 任务名会先做规范化（`decodeURIComponent` 容错 + 去除 `BOM` + 清理前后空白/全角空格 + 连续空白规整，并生成去空白匹配串），再优先按包含关系识别 `希尔贝壳` / `棋燊`。
- 若已有供应商字段是 `未识别供应商` / `unknown-supplier` / 空值，必须回退到任务名重新识别，不得固化错误供应商。
- 详情阶段并发按 `Math.floor(total/5)` 动态计算（最小 `1`，最大 `500`），并在进度条中显示真实执行并发（如 `1854 -> 370`、`8000 -> 500`）。
- 页数上限与并发上限分开管理：页数上限用于防无限分页，并发上限固定 `500`。
- 后端主存储恢复为根级总表：`statistics-data/statistics-merged.csv`。
- 默认下载总表：`.../statistics/download`（不要求 supplier 参数）。
- 供应商列表 `.../statistics/suppliers` 保留为辅助信息接口，不影响总表下载。
- 不再主动创建 `statistics-data/suppliers/`；该目录若本地已存在，属于旧方案残留，可忽略或手动清理。
- 转写与快判都接入 `shared/progress-indicator.js`；后续所有平台长耗时统计/导出上传任务默认复用该组件。
