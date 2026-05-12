# Magic Data ANNOTATOR 资料

## 目录用途

本目录是 Magic Data ANNOTATOR 的平台资源入口，记录页面结构、网络请求脱敏摘要、安全边界和后续开发计划。这里是 Chrome / Edge 共用资料，不放扩展运行时代码。

对应运行时代码后续应统一接入：

```text
extension/sites/magic-data/annotator/
```

## 当前阶段

- 阶段：前置采集（只读）
- 采集日期：2026-05-08
- 采集方式：`chrome_devtools` 真实页面导航 + Network 脱敏记录 + 前端 bundle 关键词校验
- 本轮未执行：领取、保存、提交、审核通过、审核驳回、退回、批量流转

## 2026-05 AI 复核调试后端

已新增本地调试后端（不接入扩展前端自动动作）：

- `GET /api/magic-data/annotator/ai/review-current/health`
- `POST /api/magic-data/annotator/ai/review-current`

后端路径：

- `platform-resources/magic-data/annotator/backend/`

词表路径：

- `platform-resources/magic-data/annotator/lexicon/客家话-正字表.xlsx`
- `platform-resources/magic-data/annotator/lexicon/hakka-lexicon.csv`

本轮口径：

- AI 仅做复核建议，不自动保存、不自动提交、不自动审核、不自动领取。
- 默认两阶段模型：`qwen3.5-omni-flash`（听音）+ `qwen3.5-plus`（对比）。
- 收益估算按有效时长：`estimatedIncome = effectiveTime / 3600 * 120`。
- 日志严格脱敏，不记录完整签名音频 URL、token、cookie、authorization、API Key。

## 2026-05 前端质检区接入（asrmark）

已在扩展端接入 Magic Data `#/asrmark` 页面内“Magic Data AI 质检结果”区域（表格下方）：

- 刷新采集
- AI 质检当前条
- 复制 AI 质检摘要
- 填入第一行
- 填入第二行
- 忽略结果

本轮前端口径：

- 只支持当前条测试，不做批量。
- 允许手动填入两行文本，但不自动保存、不自动提交、不自动下一条。
- `#/asrmarkCheck` 仅提示“暂未接入填入”，不写审核页 DOM 自动化。
- 当前条数据采集优先级：`annotateDetailInfo` 响应缓存 -> 同源读取 `annotateDetailInfo/{taskItemId}` -> DOM/performance 兜底。
- 快捷键设置迁移到 options 的 Magic Data 专区（默认未设置）：AI 质检、复制摘要、填入、保存、提交、性别/年龄选择。
- AI 逻辑调整为“规则优先质检”：平台两行文本为基准，听音结果仅作辅助证据，不默认替换平台文本。
- options 形态调整为“平台卡片 -> 脚本卡片 -> 打开设置”，不再在首页直接铺开 Magic Data 长表单。
- 听音模型与质检模型改为“下拉候选 + 自定义模型名”双模式，避免模型列表过期导致不可用。
- 新增 `enableThinking` 开关（默认关闭）；前端会随请求下发，后端按模型能力自动兼容/降级。
- 页面内 `Magic Data AI 质检结果` 区域固定存在，默认显示空状态，点击 AI 后只更新既有区域内容。

## 子目录

- `page-structure/`：页面结构记录（首页、标注任务、标注详情、标注单条、审核任务、审核详情、审核单条）。
- `network/`：按页面拆分的网络请求脱敏摘要与敏感接口清单。

## 根目录文档

- `page-structure.md`：页面结构索引（指向 `page-structure/`）。
- `network.md`：网络采集索引（指向 `network/`）。
- `safety-boundary.md`：自动化安全边界和禁止动作。
- `development-plan.md`：后续接入策略与任务拆分。

## 当前已采集页面

- `#/welcome`
- `#/mark/list`
- `#/mark/details?...`
- `#/asrmark?taskItemId=...&formType=1&userId=...`
- `#/checkTask`
- `#/checkdata/taskDetail?...`
- `#/asrmarkCheck?formType=1&id=...`

## 已确认关键事实

- 平台为 SPA，主根节点是 `#app`。
- 列表和详情核心链路已覆盖：
  - 标注：`userTask/getUserTaskList`、`userTaskDetail/getUserTaskDetailList`、`annotateTask/annotateDetailInfo`、`annotateTask/annotateHeaderInfo`
  - 审核：`sampling/samplingRecordPage`、`sampling/asrPreview`、`sampling/taskInfo`、`sampling/projectInfo`
- 音频为 OSS 带签名 URL，文档仅记录 `hostname/path 模式/签名参数 key`。

## 维护规则

- 新增 DOM/接口信息优先更新本目录。
- 只允许写入脱敏摘要，不允许写入 token/cookie/完整签名 URL/真实敏感文本。
- 若后续新增脚本行为影响边界，必须同步更新 `safety-boundary.md` 与根目录 `log.md`。
