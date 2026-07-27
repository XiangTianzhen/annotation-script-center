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

## 录音任务平台集成

台州话后端现提供录音条目创建、完成结果查询和受保护录音代理。浏览器只向脚本中心发送参考文字及公网 HTTPS 音视频 URL，不下载或上传参考媒体，不接收录音平台机器 Key，也不得把 AIDP Cookie、Authorization 或 Session 发送给服务器。

专用接口：

```text
POST /api/bytedance-aidp/taizhou-helper/recording-items
POST /api/bytedance-aidp/taizhou-helper/recording-items/result
GET  /api/bytedance-aidp/taizhou-helper/recording-items/audio/:token
```

创建接口只接受 `recordingTaskCode`、`sourceItemId`、`referenceText`、`referenceAudioUrl`、`referenceVideoUrl`；三类参考内容至少一项非空，媒体地址必须是不含用户信息的绝对 HTTPS URL。任务编号必须在服务器 `allowedTaskCodes` 中。后端调用录音平台任务编号端点并固定附加 `sourcePlatform=BYTEDANCE_AIDP` 与 AIDP `sourceItemId`。稳定映射键由脚本命名空间、任务编号和来源条目 ID 组成；每次创建尝试使用独立且持久化的幂等操作键，请求指纹由 trim 后文字和规范化 URL 的 SHA-256 计算。相同内容重放，不同内容返回冲突；映射状态只保存指纹，不持久化参考全文、原始 URL 或任何登录态。

浏览器只有在用户主动点击“添加数据”时调用创建接口，本地映射不再直接拦截这次人工请求。已有完成映射会先通过录音平台结果接口核验：条目存在时返回 HTTP 200 幂等重放；只有 `404 TASK_ITEM_NOT_FOUND` 会轮换幂等操作键并重新创建，成功返回 HTTP 201。超时、429、5xx、鉴权失败或无效响应均保留旧映射且不创建。页面进入、自动查询和手动刷新结果保持只读；缺失条目只提示用户再次点击“添加数据”。

条目创建和结果查询的上游超时覆盖响应头与完整 JSON body，并对 body 执行 256KB 严格上限；超时或超限只返回固定脱敏错误，创建映射保留为可重试且会退出同源 single-flight。结果查询与短时音频代理每次重新核对当前 `allowedTaskCodes`；移除任务后旧同步 token 和已签发播放 token 都不能继续访问。音频代理超时覆盖响应体流，客户端断开时取消上游请求，并保留必要 Range 响应头。

私密配置和部署风险见根 `config/README.md`，完整公共后端行为见 `platform-resources/backend/README.md`。台州话扩展已接入人工导入按钮和结果只读卡片；Options 可见任务编号仍须与服务器 `allowedTaskCodes` 匹配，浏览器不接收机器 Key。
