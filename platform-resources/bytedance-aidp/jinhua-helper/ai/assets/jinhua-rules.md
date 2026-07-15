# 金华话 Prompt 参考说明

- 当前有效转写规则只由后端 `GET /api/bytedance-aidp/jinhua-helper/ai/recommend/defaults` 返回的默认 Prompt，或使用者在 Options 保存的非空本地 Prompt 决定。
- 使用者保存的非空 Prompt 会完整覆盖后端默认主体；清空或改回默认值后，运行时回退后端默认 Prompt。
- 本文件仅用于保留金华话项目资料的加载与诊断标识，不直接作为模型 systemPrompt，也不追加任何转写语义限制。
- 每段音频仍只调用一次 Qwen Omni；不可编辑的传输层要求模型只返回包含 `listenText` 的 JSON 对象。
