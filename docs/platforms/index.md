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
- 后端与平台资料：`platform-resources/data-baker/round-one-quality/`
- 统一后端启动入口：`node platform-resources/backend/server.js`
- 如需 Python 辅助脚本，统一复用 `platform-resources/backend/.venv`，不单独启动 Python 服务

## Magic Data ANNOTATOR

- 运行时代码：`extension/sites/magic-data/annotator/`
- README：`extension/sites/magic-data/annotator/README.md`
- 后端与平台资料：`platform-resources/magic-data/annotator/`

## Abaka AI

- 运行时代码：`extension/sites/abaka-ai/task-page/`
- 运行时 README：`extension/sites/abaka-ai/task-page/README.md`
- 平台资料目录：`platform-resources/abaka-ai/`
- 平台总览：`platform-resources/abaka-ai/README.md`
- Task 页面只读采集壳资料：`platform-resources/abaka-ai/task-page/README.md`
- 平台通用 Network：`platform-resources/abaka-ai/network.md`
- Task 页面公共 Network：`platform-resources/abaka-ai/network/README.md`
- Task 页面公共结构：`platform-resources/abaka-ai/page-structure.md`
- Task 页面公共动作边界：`platform-resources/abaka-ai/actions.md`
- Task 页面公共多语言：`platform-resources/abaka-ai/i18n.md`
- Task21 项目资料：`platform-resources/abaka-ai/task21/README.md`
- Task21 专项 Network：`platform-resources/abaka-ai/task21/network/README.md`
- Task21 AI 规则与 Prompt：`platform-resources/abaka-ai/task21/ai/README.md`
- Task17 项目资料：`platform-resources/abaka-ai/task17/README.md`
- Task17 网络差异：`platform-resources/abaka-ai/task17/network.md`
- 当前阶段：公共 Task 页面资料已上移到 Abaka AI 根目录；Task21 已上线 Task21助手（快捷键 + AI 辅助填写，AI 设置默认隐藏并支持 10 次点击解锁，AI 仅建议且需手动点击“填写 AI 答案”才写入），Task17 保留对比和领取审核空池差异；不默认自动提交/保存/领取/流转。

## 新增平台要求

新增平台或脚本时，必须同步：

- `extension/sites/<platform>/<script>/README.md`
- `platform-resources/<platform>/<script>/README.md` 或资料目录
- `docs/platforms/index.md`
- `log.md`
