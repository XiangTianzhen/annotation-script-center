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

台州话后端现提供受控参考媒体上传、录音条目创建、完成结果查询、受保护录音代理和公开参考媒体读取。浏览器只向脚本中心发送原始媒体字节及最小参考字段，不接收录音平台机器 Key，也不得把 AIDP Cookie、Authorization 或 Session 发送给服务器。

专用接口：

```text
POST /api/bytedance-aidp/taizhou-helper/recording-media/:kind
POST /api/bytedance-aidp/taizhou-helper/recording-items
POST /api/bytedance-aidp/taizhou-helper/recording-items/result
GET  /api/bytedance-aidp/taizhou-helper/recording-items/audio/:token
GET|HEAD /api/public/recording-media/:mediaId
```

上传接口只接受 `audio` / `video` 安全 MIME 与匹配魔数，原始流最多 100MB、全局并发 2 个、完整读取默认最多 120 秒、未绑定临时文件一小时过期。超限、慢流或上传准备失败都会释放槽位；维护过程维护活动 staging 集合，不会清理正在写入的 `.uploading`，只回收超过读取超时与安全余量的非活动崩溃临时文件。创建接口只接受 `recordingTaskId`、`sourceItemId`、`referenceText`、`audioUploadId`、`videoUploadId`；任务必须在服务器 `allowedTaskIds` 中，上传必须属于同一任务且类型匹配。稳定幂等键由脚本命名空间、任务 ID 和来源条目 ID 计算；同源并发共享一个上游创建，请求指纹变化返回冲突；映射状态只保存指纹，不持久化参考全文或任何登录态。

条目创建和结果查询的上游超时覆盖响应头与完整 JSON body，并对 body 执行 256KB 严格上限；超时或超限只返回固定脱敏错误，创建映射保留为可重试且会退出同源 single-flight。结果查询与短时音频代理每次重新核对当前 `allowedTaskIds`；移除任务后旧同步 token 和已签发播放 token 都不能继续访问。音频代理超时覆盖响应体流，客户端断开时取消上游请求，且保留上游 416 的 `Content-Range` / `Accept-Ranges`；公开媒体 416 保留 CORS，文件打开或流读取失败不会透出路径和底层异常。

私密配置和部署风险见根 `config/README.md`，完整公共后端行为见 `platform-resources/backend/README.md`。台州话扩展已接入人工导入按钮和结果只读卡片；Options 内部 taskId 仍须与服务器 `allowedTaskIds` 匹配，浏览器不接收机器 Key。
