# 平台与脚本文档索引

本目录用于索引各平台、各脚本的长期规则。项目指令和 AGENTS.md 不直接堆放平台细节；需要处理具体平台时，先读对应 README 和 `platform-resources` 资料。

- 当前统一查看入口：options 首页隐藏高级区已同时提供“项目数据下载”和“AI 请求记录”两个导出面板；AI 请求记录走 `platform-resources/backend/ai-call-log-download/` 聚合接口，导出时可选填写日期范围。

## Alibaba LabelX

- 快判运行时代码：`extension/sites/alibaba-labelx/asr-judgement/`
- 快判 README：`extension/sites/alibaba-labelx/asr-judgement/README.md`
- 快判平台资料：`platform-resources/alibaba-labelx/asr-judgement/`
- 转写运行时代码：`extension/sites/alibaba-labelx/asr-transcription/`
- 转写 README：`extension/sites/alibaba-labelx/asr-transcription/README.md`
- 转写平台资料：`platform-resources/alibaba-labelx/asr-transcription/`
- LabelX shared：`extension/sites/alibaba-labelx/shared/`
- 当前后端状态：转写与快判的 `download / suppliers / existing` 已开始复用 `platform-resources/backend/project-data-download/` 下的 LabelX 共享下载 core；外部接口路径保持不变。
- 当前 AI 日志状态：转写与快判都已默认写脚本级 AI 调用 CSV，并分别开放 `logs/summary` 统计接口。

## 标贝易采

- 一检质检运行时代码：`extension/sites/data-baker/round-one-quality/`
- README：`extension/sites/data-baker/round-one-quality/README.md`
- 平台资料总览：`platform-resources/data-baker/README.md`
- 后端与平台资料：`platform-resources/data-baker/round-one-quality/`
- 统一后端启动入口：`node platform-resources/backend/server.js`
- 公共 AI provider 基座：`platform-resources/backend/ai/`
- 当前后端状态：AI recommend 已接入统一 `ai-framework`；`export/download` 已开始复用 `platform-resources/backend/project-data-download/` 下的通用 CSV 文件下载 core，外部接口路径保持不变；下载相关脚本、upload 字段归一、CSV helper、merge helper、latest/history/events 持久化 helper、history 读取 helper、字段映射和脱敏样例已开始收口到 `platform-resources/data-baker/round-one-quality/data/`。
- 当前 AI 日志状态：DataBaker recommend 当前已默认写脚本级 AI 调用 CSV，并开放 `logs/summary` 统计接口。
- 如需 Python 辅助脚本，统一复用 `platform-resources/backend/.venv`，Fun-ASR Python 文件位于 `platform-resources/backend/ai/python/`，不单独启动 Python 服务

## DataBaker CVPC

- 平台资料总览：`platform-resources/data-baker-cvpc/README.md`
- 运行时代码：`extension/sites/data-baker-cvpc/liuzhou-helper/`
- 运行时 README：`extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
- 脚本级资料与后端：`platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
- 网络请求采集（4 段首轮链路 + handoff）：`platform-resources/data-baker-cvpc/network/README.md`
- 页面结构采集（4 段首轮结构）：`platform-resources/data-baker-cvpc/page-structure/README.md`
- 当前阶段：柳州话脚本 `beta` 首版已接入。当前业务能力只在 `/app/editor/asr/` 生效，支持当前音频画段建议、当前段 AI 推荐、当前段实验性填入和 `Valid / Invalid` 快捷入口；前后端都只做“建议生成 + 人工确认”，不自动保存、不自动提交、不自动切下一条。
- 当前补采状态：`annotation/meta`、模板字段和当前页 DOM 入口已纳入运行时；`segment create/update`、保存链路、稳定字段写入契约仍待真实补采，画段应用在未检测到安全写入桥时只保留建议展示。

## Magic Data ANNOTATOR

- 平台运行时代码：`extension/sites/magic-data/`
- 平台 README：`extension/sites/magic-data/README.md`
- v0.3.6 收尾：双助手同平台互斥、AI 面板改为“模型方案 + 识别策略”、客家话审核页 `#/asrmarkCheck` 可用、识别策略保存回滚已修复。
- 客家话助手：`extension/sites/magic-data/hakka-helper/README.md`
- 客家话助手补充：审核页 `#/asrmarkCheck` 已接入 AI 质检；文本可编辑时支持行内 `填入本行` 与文本项 `全部填入AI推荐`（不自动保存/提交）。
- 客家话助手默认配置（2026-05-25 评测落地）：`two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`，thinking 当前已全局固定关闭
- 客家话助手前端（2026-05-26）：已切换到与闽南语一致的新面板体系（行内建议、说话人建议、全部填入、原始输出、独立折叠）
- 客家话助手后端（2026-05-26）：`review-current` 输出结构已对齐闽南语（`speakerCheck/dialectTextCheck/mandarinTextCheck/overall`），legacy `annotator` API 保持兼容
- 客家话助手后端（2026-05-27）：改为通过 prompt 约束普通中文输出简体；结果区推荐文本、行内建议、听音文本与 legacy comparison 推荐文本不再依赖本地后端二次繁转简。
- 闽南语助手：`extension/sites/magic-data/minnan-helper/README.md`（前端行为对齐客家话助手，AI 配置拆分为“模型方案 two_stage/omni_single + 识别策略 direct_dialect/mandarin_to_dialect”；与客家话助手同平台互斥启用）
- 双助手 options 口径：不再展示 `AI 质检模式`，统一使用“模型方案 + 识别策略”。
- 平台资料：`platform-resources/magic-data/README.md`
- 平台共用页面结构：`platform-resources/magic-data/page-structure/README.md`
- 平台共用 Network：`platform-resources/magic-data/network/README.md`
- 客家话助手资料：`platform-resources/magic-data/hakka-helper/README.md`
- 闽南语助手资料：`platform-resources/magic-data/minnan-helper/README.md`
- 当前 AI 日志状态：客家话与闽南语助手都已默认写脚本级 AI 调用 CSV，并开放 `logs/summary` 统计接口；客家话 legacy `annotator` 路径也复用同一份统计。

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
- 当前 AI 日志状态：Task21 analyze 当前已默认写脚本级 AI 调用 CSV，并开放 `logs/summary` 统计接口。

## Aishell Tech

- 平台资料总览：`platform-resources/aishell-tech/README.md`
- 运行时脚本：`extension/sites/aishell-tech/minnan-helper/README.md`
- 脚本级资料与后端：`platform-resources/aishell-tech/minnan-helper/README.md`
- 网络请求采集（5 页 + 安全边界说明）：`platform-resources/aishell-tech/network/README.md`
- 页面 DOM 结构采集（4 页完整 + 1 页组织管理初版占位）：`platform-resources/aishell-tech/page-structure/README.md`
- 安全边界：以 `platform-resources/aishell-tech/README.md` 的“安全边界”章节与 `network/README.md` 的脱敏规则为准。
- 当前阶段：独立闽南语助手已接入。当前业务能力只在 `/mytask/mark` 生效，`/mytask/index` 与 `/mytask/detail/:taskId` 仅做路由覆盖与资料复用；已注册独立接口 `/api/aishell-tech/minnan-helper/ai/recommend*`，当前 AI 口径已改成独立的 `转换 / 听音 / 比较` 三板块。转换与听音并行执行，比较最后汇总；默认组合为 `转换 qwen3.5-plus + 听音 qwen3.5-omni-flash + Qwen 比较 qwen3.5-plus`，切到 Omni 比较时会在比较阶段再次听音。结果卡当前展示 `转换文本` 与“听音文本 vs 转换文本”差异；默认链路为短请求建 job + HTTP 轮询结果，Aishell 继续保留自己的独立队列与 `success/data/meta` 契约；`我的团队` 页面仍只有 network 和 page-structure 初版占位，质检/验收角色视图与多个对话框仍待补采。
- 当前 AI 日志状态：Aishell 当前会把 AI 调用写到 `platform-resources/aishell-tech/minnan-helper/data/runtime/ai-calls-YYYY-MM-DD.csv`，并开放 `GET /api/aishell-tech/minnan-helper/ai/recommend/logs/summary`。

## 新增平台要求

新增平台或脚本时，必须同步：

- `extension/sites/<platform>/<script>/README.md`
- `platform-resources/<platform>/<script>/README.md` 或资料目录
- `docs/platforms/index.md`
- `log.md`
## 2026-05-21 Alibaba LabelX 统计上传补充

- 快判统计上传与转写统计上传都保留“existing 检查后默认跳过已完整分包”的主流程。
- 仅手动首页上传完成后，若本轮有 `skippedCompleteCount > 0`，前端才出现“补传并覆盖当前人员”按钮。
- 按钮点击后会重新拉取本轮范围内全部详情，并用 `forceReplaceByBatchId=true` + `replaceBatchIds` 触发后端局部覆盖；后端只会更新当前角色 / 当前人员槽位，不再整分包删行重建。
- 定时上传不显示该按钮，也不会自动触发强制替换。
- 详情页第一版不默认支持 force replace。

## 2026-05-21 CSV 字段命名口径补充

- Alibaba LabelX 快判：`有效时长(秒)_S`、`标注员1_P`、`标注员2_P`、`标注员3_P`、`审核员_P`。
- Alibaba LabelX 转写：`有效时长(秒)_S`、`标注员_P`、`审核员_P`。
- DataBaker：`质检人_P`、`有效合格时长_S`，`采集人` 保持原字段名。
- 运行数据目录与用户上传 CSV 仍不提交 Git。

