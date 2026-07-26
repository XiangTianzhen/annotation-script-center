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
- 录音导入只观察 Search Item 各条目的最小安全字段；响应含多条数据时按当前 Receive ItemID 精确选择，不固定取第一条或按位置猜测。Options 可见任务编号与服务器 `allowedTaskCodes` 双重匹配后，浏览器把参考文字及原始公网 HTTPS 音视频 URL 交给脚本中心专用端点，后端固定附加 `BYTEDANCE_AIDP + ItemID` 来源绑定。扩展不下载或上传媒体；机器 Key、AIDP Cookie、Authorization 与 Session 不进入扩展存储或服务器请求。
- 当前 Receive 条目的音频和视频地址显示在默认折叠的“当前媒体信息”中，不展示模板，视频缺失时显示“无视频”。
- 录音结果文本和音频只在默认折叠的“当前录音平台结果”中显示，不写入 textarea、`regions`、暂存或提交接口；每次进入题目只自动查询并渲染一次，同题后续只能手动刷新，周期性 DOM 同步不得重建音频播放器。AIDP 重建辅助面板时从 UI 内存恢复结果，不轮询、不展示结果视频。
- 成功映射的同步凭证由服务器稳定派生，幂等重放不会让其他浏览器已保存的凭证失效；运行目录存在数据而状态文件缺失或损坏时，后端返回脱敏 503 并停止孤儿清理。
