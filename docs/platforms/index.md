# 平台与脚本文档索引

本目录用于索引各平台、各脚本的长期规则。项目指令和 AGENTS.md 不直接堆放平台细节；需要处理具体平台时，先读对应 README 和 `platform-resources` 资料。

## Alibaba LabelX

- 快判运行时代码：`extension/sites/alibaba-labelx/asr-judgement/`
- 快判 README：`extension/sites/alibaba-labelx/asr-judgement/README.md`
- 快判平台资料：`platform-resources/alibaba-labelx/asr-judgement/`
- 转写运行时代码：`extension/sites/alibaba-labelx/asr-transcription/`
- 转写 README：`extension/sites/alibaba-labelx/asr-transcription/README.md`
- 转写平台资料：`platform-resources/alibaba-labelx/asr-transcription/`
- LabelX shared：`extension/sites/alibaba-labelx/shared/`

## 标贝易采

- 一检质检运行时代码：`extension/sites/data-baker/round-one-quality/`
- README：`extension/sites/data-baker/round-one-quality/README.md`
- 平台资料总览：`platform-resources/data-baker/README.md`
- 后端与平台资料：`platform-resources/data-baker/round-one-quality/`
- 统一后端启动入口：`node platform-resources/backend/server.js`
- 公共 AI provider 基座：`platform-resources/backend/ai/`
- 如需 Python 辅助脚本，统一复用 `platform-resources/backend/.venv`，Fun-ASR Python 文件位于 `platform-resources/backend/ai/python/`，不单独启动 Python 服务

## Magic Data ANNOTATOR

- 平台运行时代码：`extension/sites/magic-data/`
- 平台 README：`extension/sites/magic-data/README.md`
- 客家话助手：`extension/sites/magic-data/hakka-helper/README.md`
- 客家话助手默认配置（2026-05-25 评测落地）：`two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`，thinking 默认关闭
- 闽南语助手：`extension/sites/magic-data/minnan-helper/README.md`（前端行为对齐客家话助手，AI 配置拆分为“模型方案 two_stage/omni_single + 识别策略 direct_dialect/mandarin_to_dialect”；与客家话助手同平台互斥启用）
- 平台资料：`platform-resources/magic-data/README.md`
- 平台共用页面结构：`platform-resources/magic-data/page-structure/README.md`
- 平台共用 Network：`platform-resources/magic-data/network/README.md`
- 客家话助手资料：`platform-resources/magic-data/hakka-helper/README.md`
- 闽南语助手资料：`platform-resources/magic-data/minnan-helper/README.md`

## Abaka AI

- 运行时代码：`extension/sites/abaka-ai/task-page/`
- 运行时 README：`extension/sites/abaka-ai/task-page/README.md`
- 平台资料目录：`platform-resources/abaka-ai/`
- 平台总览：`platform-resources/abaka-ai/README.md`
- Task 页面只读采集壳资料：`platform-resources/abaka-ai/task-page/README.md`
- 平台通用 Network：`platform-resources/abaka-ai/network/platform.md`
- Task 页面公共 Network：`platform-resources/abaka-ai/network/README.md`
- Task 页面公共结构：`platform-resources/abaka-ai/page-structure/platform.md`
- Task 页面公共动作边界：`platform-resources/abaka-ai/page-structure/actions.md`
- Task 页面公共多语言：`platform-resources/abaka-ai/page-structure/i18n.md`
- Task21 项目资料：`platform-resources/abaka-ai/task21/README.md`
- Task21 专项 Network：`platform-resources/abaka-ai/task21/network/README.md`
- Task21 AI 规则与 Prompt：`platform-resources/abaka-ai/task21/backend/ai/README.md`
- Task17 项目资料：`platform-resources/abaka-ai/task17/README.md`
- Task17 网络差异：`platform-resources/abaka-ai/task17/network/README.md`
- 当前阶段：公共 Task 页面资料已上移到 Abaka AI 根目录；Task21助手已完成主要编写（快捷键、AI 辅助填写、image_b_texts_removed 的 T/B/R/D 多重集规则、列表页统计入口），其中统计后端与独立统计 runtime 仍待补齐；Task17 保留对比和领取审核空池差异；不默认自动提交/保存/领取/流转。

## 新增平台要求

新增平台或脚本时，必须同步：

- `extension/sites/<platform>/<script>/README.md`
- `platform-resources/<platform>/<script>/README.md` 或资料目录
- `docs/platforms/index.md`
- `log.md`
## 2026-05-21 Alibaba LabelX 统计上传补充

- 快判统计上传与转写统计上传都保留“existing 检查后默认跳过已完整分包”的主流程。
- 仅手动首页上传完成后，若本轮有 `skippedCompleteCount > 0`，前端才出现“取消跳过上传数据”按钮。
- 按钮点击后会重新拉取本轮范围内全部详情，并用 `forceReplaceByBatchId=true` + `replaceBatchIds` 让后端按分包ID替换旧内容。
- 定时上传不显示该按钮，也不会自动触发强制替换。
- 详情页第一版不默认支持 force replace。

## 2026-05-21 CSV 字段命名口径补充

- Alibaba LabelX 快判：`有效时长(秒)_S`、`标注员1_P`、`标注员2_P`、`标注员3_P`、`审核员_P`。
- Alibaba LabelX 转写：`有效时长(秒)_S`、`标注员_P`、`审核员_P`。
- DataBaker：`质检人_P`、`有效合格时长_S`，`采集人` 保持原字段名。
- 运行数据目录与用户上传 CSV 仍不提交 Git。

