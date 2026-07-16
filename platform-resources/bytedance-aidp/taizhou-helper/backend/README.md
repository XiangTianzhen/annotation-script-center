# 台州话后端

## 接口

`POST /api/bytedance-aidp/taizhou-helper/ai/recommend`

请求包含当前段音频和单次 Qwen Omni 配置。默认模型为 `qwen3.5-omni-plus`，仅允许 `qwen3.5-omni-plus` 与 `qwen3.5-omni-flash`，thinking 默认关闭；扩展仅可通过 `aiOmni.enableThinking: true` 开启，其他值均按关闭处理，超时上限仍为 60000ms。默认 Prompt 仍要求原样听写、不翻译；使用者保存的非空自定义 Prompt 会原样作为完整 systemPrompt，清空后回退默认 Prompt，已有保存值不迁移、不覆盖。后端只附带片段、时间范围、字段/编辑上下文和规则资料已加载标识，不追加翻译、原样听写、纯文本或其他输出规则。

## 响应契约

成功响应提供：

- `listenText`：扩展/API 兼容字段；模型直接输出的最终转写文本在原始输出为字符串时逐字符映射到该字段。
- `models`、`usage`、`cost`、`timing`：调用元数据。
- `raw`、`debug`：诊断信息。

后端不对模型输出执行 JSON.parse，也不做 trim、文本清洗、解释提取或猜测。任意非空字符串都按原样返回为 `listenText`，包含模型意外输出的 JSON、Markdown 或解释文字；空字符串或非字符串保持为空结果，不产生可写入文本。`raw.omni` 仍保留原始输出供诊断。普通话转换、润色、数字或标点规整、重复压缩等语义均由当前有效 Prompt 决定；后端不做风险、复核或填入决策。
