# 金华话 AIDP 平台资料

## 适用范围

本目录记录金华话 AIDP 脚本的后端、网络和页面资料。脚本使用单次 Qwen Omni 金华话转写 Prompt，并允许使用者在 Options 保存本地自定义 Prompt。

## AI 结果边界

- `POST /api/bytedance-aidp/jinhua-helper/ai/recommend` 成功时以 `listenText` 作为唯一业务文本。
- 默认 Prompt 来自后端；非空本地自定义 Prompt 会原样作为完整 systemPrompt，完全决定模型语义和输出格式，保存值不迁移、不覆盖。后端只附带片段、时间范围、字段/编辑上下文和规则资料已加载标识，不追加转换、听写或输出格式规则；清空后回退默认 Prompt。
- `listenText` 是扩展/API 兼容字段：后端仅在模型原始输出为字符串时逐字符映射它，不做 JSON.parse、trim、文本清洗、解释提取或猜测。所有非空字符串均原样写入，包括意外的 JSON、Markdown 或解释文字；空字符串或非字符串不写入平台。
- 返回可携带 usage、cost、raw 与 debug，用于诊断；不返回风险、复核或强制写入字段。

## 写入边界

- 单段：扩展通过真实 textarea 事件直填 `listenText`。
- 批量：扩展只对当前题当前页选中段，通过已观察到的 `SubmitTempItemAnswer` 暂存契约写 `regions[*].txt`。
- 不写 `ms`，不调用保存、提交或切题接口。

## 保留的平台能力

- 金华话继续保留账户切换、平台 AI 隐藏、分段建议、快捷键、隐藏辅助区与播放保护。
- 与苏州话保持同平台互斥；这些能力不参与 Prompt 转写规则、风险判断或填入决策。
