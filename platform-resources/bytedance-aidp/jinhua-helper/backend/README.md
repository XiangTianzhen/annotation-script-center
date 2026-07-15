# 金华话后端

## 接口

`POST /api/bytedance-aidp/jinhua-helper/ai/recommend`

请求包含当前段音频和单次 Qwen Omni 配置。默认模型为 `qwen3.5-omni-plus`，仅允许 `qwen3.5-omni-plus` 与 `qwen3.5-omni-flash`，thinking 固定关闭，超时上限 60000ms。

## 响应契约

成功响应提供：

- `listenText`：严格 JSON 中的原始听音文本，逐字符保留。
- `models`、`usage`、`cost`、`timing`：调用元数据。
- `raw`、`debug`：诊断信息。

后端只接受完整 JSON 对象；模型输出夹带说明文字、Markdown 或无法解析时，`listenText` 返回空字符串。后端不进行普通话转换、润色、数字或标点规整、重复压缩、风险判断、复核或填入决策。
