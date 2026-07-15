# 金华话 AIDP 平台资料

## 适用范围

本目录记录金华话 AIDP 脚本的后端、网络和页面资料。脚本使用单次 Qwen Omni 金华话转写 Prompt，并允许使用者在 Options 保存本地自定义 Prompt。

## AI 结果边界

- `POST /api/bytedance-aidp/jinhua-helper/ai/recommend` 成功时以 `listenText` 作为唯一业务文本。
- `listenText` 是当前有效 Prompt 生成的最终转写文本；默认 Prompt 来自后端，非空本地自定义 Prompt 会完整覆盖默认主体。
- 模型输出不是严格 JSON、或 `listenText` 为空时，不写入平台。
- 返回可携带 usage、cost、raw 与 debug，用于诊断；不返回风险、复核或强制写入字段。

## 写入边界

- 单段：扩展通过真实 textarea 事件直填 `listenText`。
- 批量：扩展只对当前题当前页选中段，通过已观察到的 `SubmitTempItemAnswer` 暂存契约写 `regions[*].txt`。
- 不写 `ms`，不调用保存、提交或切题接口。

## 保留的平台能力

- 金华话继续保留账户切换、平台 AI 隐藏、分段建议、快捷键、隐藏辅助区与播放保护。
- 与苏州话保持同平台互斥；这些能力不参与 Prompt 转写规则、风险判断或填入决策。
