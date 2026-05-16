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

## Magic Data ANNOTATOR

- 运行时代码：`extension/sites/magic-data/annotator/`
- README：`extension/sites/magic-data/annotator/README.md`
- 后端与平台资料：`platform-resources/magic-data/annotator/`

## Abaka AI

- 运行时代码：`extension/sites/abaka-ai/task-page/`
- README：`extension/sites/abaka-ai/task-page/README.md`
- 平台资料：`platform-resources/abaka-ai/task-page/README.md`
- 当前阶段：Task21 页面结构与 Network 结构只读采集，不做自动化提交/保存/领取/流转。

## 新增平台要求

新增平台或脚本时，必须同步：

- `extension/sites/<platform>/<script>/README.md`
- `platform-resources/<platform>/<script>/README.md` 或资料目录
- `docs/platforms/index.md`
- `log.md`
