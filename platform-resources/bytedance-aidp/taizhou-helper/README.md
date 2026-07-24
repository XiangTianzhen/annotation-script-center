# 台州话 AIDP 平台资料

## 适用范围

本目录记录台州话 AIDP 脚本的后端、网络和页面资料。脚本保留“原始听音直填”诊断能力，并已增加当前完整题目人工导入录音平台与完成结果只读回显。

## AI 结果边界

- `POST /api/bytedance-aidp/taizhou-helper/ai/recommend` 成功时以 `listenText` 作为唯一业务文本。
- 默认 Prompt 用于原始听音直填；非空本地自定义 Prompt 会原样作为完整 systemPrompt，完全决定模型语义和输出格式。后端只附带片段、时间范围、字段/编辑上下文和规则资料已加载标识，不追加转换、听写或输出格式规则；`listenText` 是扩展/API 兼容字段，不是模型 JSON 字段。
- 后端仅在模型原始输出为字符串时逐字符映射 `listenText`，不做 JSON.parse、trim、文本清洗、解释提取或猜测。所有非空字符串均原样写入，包括意外的 JSON、Markdown 或解释文字；空字符串或非字符串不写入平台。
- 返回可携带 usage、cost、raw 与 debug，用于诊断；不返回风险、复核或强制写入字段。

## 写入边界

- 单段：扩展通过真实 textarea 事件直填 `listenText`。
- 批量：扩展只对当前题当前页选中段，通过已观察到的 `SubmitTempItemAnswer` 暂存契约写 `regions[*].txt`。
- 不写 `ms`，不调用保存、提交或切题接口。
- 录音导入只观察 Search Item 的最小安全字段；Options 内部 taskId 与服务器 `allowedTaskIds` 双重匹配后，浏览器下载媒体字节并调用脚本中心专用端点。机器 Key、AIDP 登录头与原始签名 URL 不进入扩展存储或服务器请求。
- 录音结果文本和音频只在辅助面板显示，不写入 textarea、`regions`、暂存或提交接口；不轮询、不展示结果视频。
