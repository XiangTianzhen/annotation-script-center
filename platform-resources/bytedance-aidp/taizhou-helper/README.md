# 台州话 AIDP 平台资料

## 适用范围

本目录记录台州话 AIDP 脚本的后端、网络和页面资料。脚本当前处于“原始听音直填”诊断模式，用于比对百炼调用结果与平台侧模型效果。

## AI 结果边界

- `POST /api/bytedance-aidp/taizhou-helper/ai/recommend` 成功时以 `listenText` 作为唯一业务文本。
- `listenText` 是模型原始听音结果，不翻译为普通话，也不做任何文本清洗。
- 模型输出不是严格 JSON、或 `listenText` 为空时，不写入平台。
- 返回可携带 usage、cost、raw 与 debug，用于诊断；不返回风险、复核或强制写入字段。

## 写入边界

- 单段：扩展通过真实 textarea 事件直填 `listenText`。
- 批量：扩展只对当前题当前页选中段，通过已观察到的 `SubmitTempItemAnswer` 暂存契约写 `regions[*].txt`。
- 不写 `ms`，不调用保存、提交或切题接口。
