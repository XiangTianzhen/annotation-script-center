# 平台与脚本文档索引

处理具体平台前，先读本文件，再下钻到对应平台 / 脚本 README。

## 通用读取顺序

1. 根 `AGENTS.md`
2. 根 `README.md`
3. 本文件
4. 对应平台总览 README
5. 对应脚本 README
6. 需要时再看：
   - `network/`
   - `page-structure/`
   - `backend/`

## Alibaba LabelX

- 平台资料总览：`platform-resources/alibaba-labelx/README.md`
- 快判运行时代码：`extension/sites/alibaba-labelx/asr-judgement/`
- 快判 README：`extension/sites/alibaba-labelx/asr-judgement/README.md`
- 快判平台资料：`platform-resources/alibaba-labelx/asr-judgement/README.md`
- 转写运行时代码：`extension/sites/alibaba-labelx/asr-transcription/`
- 转写 README：`extension/sites/alibaba-labelx/asr-transcription/README.md`
- 转写平台资料：`platform-resources/alibaba-labelx/asr-transcription/README.md`
- 共用运行时：`extension/sites/alibaba-labelx/shared/`
- 平台共用资料：
  - `platform-resources/alibaba-labelx/network/README.md`
  - `platform-resources/alibaba-labelx/page-structure/README.md`

## 标贝易采 DataBaker

- 平台资料总览：`platform-resources/data-baker/README.md`
- 运行时代码：`extension/sites/data-baker/round-one-quality/`
- 运行时 README：`extension/sites/data-baker/round-one-quality/README.md`
- 脚本资料与后端：`platform-resources/data-baker/round-one-quality/README.md`
- 统一后端入口：`platform-resources/backend/README.md`

## DataBaker CVPC

- 平台资料总览：`platform-resources/data-baker-cvpc/README.md`
- 运行时代码：`extension/sites/data-baker-cvpc/liuzhou-helper/`
- 运行时 README：`extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
- 脚本资料与后端：`platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
- 平台共用资料：
  - `platform-resources/data-baker-cvpc/network/README.md`
  - `platform-resources/data-baker-cvpc/page-structure/README.md`

## Magic Data

- 平台资料总览：`platform-resources/magic-data/README.md`
- 平台运行时代码：`extension/sites/magic-data/README.md`
- 客家话助手运行时 README：`extension/sites/magic-data/hakka-helper/README.md`
- 闽南语助手运行时 README：`extension/sites/magic-data/minnan-helper/README.md`
- 客家话助手资料：`platform-resources/magic-data/hakka-helper/README.md`
- 闽南语助手资料：`platform-resources/magic-data/minnan-helper/README.md`
- 平台共用资料：
  - `platform-resources/magic-data/network/README.md`
  - `platform-resources/magic-data/page-structure/README.md`

## Abaka AI

- 平台资料总览：`platform-resources/abaka-ai/README.md`
- Task 页面运行时代码：`extension/sites/abaka-ai/task-page/`
- Task 页面运行时 README：`extension/sites/abaka-ai/task-page/README.md`
- Task 页面资料：`platform-resources/abaka-ai/task-page/README.md`
- Task21 资料：`platform-resources/abaka-ai/task21/README.md`
- Task17 资料：`platform-resources/abaka-ai/task17/README.md`
- 平台共用资料：
  - `platform-resources/abaka-ai/network/README.md`
  - `platform-resources/abaka-ai/page-structure/README.md`

## ByteDance AIDP

- 平台资料总览：`platform-resources/bytedance-aidp/README.md`
- 共享 observer：`extension/sites/bytedance-aidp/shared/page-world/network-observer.js`
- 金华话运行时代码：`extension/sites/bytedance-aidp/jinhua-helper/`
- 金华话运行时 README：`extension/sites/bytedance-aidp/jinhua-helper/README.md`
- 金华话脚本资料：`platform-resources/bytedance-aidp/jinhua-helper/README.md`
- 运行时代码：`extension/sites/bytedance-aidp/suzhou-helper/`
- 运行时 README：`extension/sites/bytedance-aidp/suzhou-helper/README.md`
- 苏州话脚本资料：`platform-resources/bytedance-aidp/suzhou-helper/README.md`
- 平台共用资料：
  - `platform-resources/bytedance-aidp/network/README.md`
  - `platform-resources/bytedance-aidp/page-structure/README.md`

## Aishell Tech

- 平台资料总览：`platform-resources/aishell-tech/README.md`
- 闽南语助手运行时 README：`extension/sites/aishell-tech/minnan-helper/README.md`
- 越南语助手运行时 README：`extension/sites/aishell-tech/vietnamese-helper/README.md`
- 泰语助手运行时 README：`extension/sites/aishell-tech/thai-helper/README.md`
- 闽南语助手资料：`platform-resources/aishell-tech/minnan-helper/README.md`
- 越南语助手资料：`platform-resources/aishell-tech/vietnamese-helper/README.md`
- 泰语助手资料：`platform-resources/aishell-tech/thai-helper/README.md`
- 平台共用资料：
  - `platform-resources/aishell-tech/network/README.md`
  - `platform-resources/aishell-tech/page-structure/README.md`

## 额外说明

- 本索引只负责入口，不重复抄业务细节。
- 当前能力、参数口径、页面交互、接口差异统一下钻到各平台 / 脚本 README。
- 历史过程统一查看 `log.md`。
