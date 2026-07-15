# 金华话后端

## 接口

`POST /api/bytedance-aidp/jinhua-helper/ai/recommend`

请求包含当前段音频和单次 Qwen Omni 配置。默认模型为 `qwen3.5-omni-plus`，仅允许 `qwen3.5-omni-plus` 与 `qwen3.5-omni-flash`，thinking 默认关闭；扩展仅可通过 `aiOmni.enableThinking: true` 开启，其他值均按关闭处理，超时上限仍为 60000ms。默认金华话转写 Prompt 由 `GET .../defaults` 提供；使用者在扩展中保存的非空 Prompt 会作为完整主体覆盖默认值，清空后回退默认值。

## 响应契约

成功响应提供：

- `listenText`：严格 JSON 中、按当前有效 Prompt 生成的最终转写文本。
- `models`、`usage`、`cost`、`timing`：调用元数据。
- `raw`、`debug`：诊断信息。

后端只接受完整 JSON 对象，且传输层固定要求唯一的 `listenText` 字段；模型输出夹带说明文字、Markdown 或无法解析时，`listenText` 返回空字符串。后端不再追加额外的转写语义规则，具体普通话转换、数字或标点规整、重复保留等行为由当前有效 Prompt 决定；后端仍不做风险、复核或填入决策。
