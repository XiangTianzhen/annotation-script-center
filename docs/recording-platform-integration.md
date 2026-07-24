# 录音任务平台接入规范

本文规定标注脚本中心向录音任务平台人工添加数据和只读查询结果的统一边界。当前已接入范围仅为 ByteDance AIDP 台州话详情页；其他平台或脚本不会自动获得此能力。

## 当前启用条件

- 台州话 Options“基础设置”填写录音平台数据库内部 `taskId`，不是可见的 `taskCode`；默认空，空值时不显示导入按钮，也不查询结果。
- 同一内部 `taskId` 还必须存在于服务器私密配置 `allowedTaskIds`。Options 与服务器允许列表双重匹配，任一侧缺失都会停止导入。
- 功能不依赖标注脚本中心管理员会话或管理员解锁。浏览器只调用脚本中心专用后端，录音平台机器 API Key 永远只由服务器读取。
- 导入粒度固定为当前完整 AIDP Item，不按画段拆分；只允许人工点击，不批量导入、不轮询、不自动写回或提交 AIDP。

## AIDP 数据与媒体边界

- MAIN-world 只观察 `/dispatcher/search_item/category`，从 `Data[0].ItemID` 与字符串 `Data[0].Content` 中提取 `asr_text`、`audio`、`video`。
- 隔离世界只接收 `sourceItemId`、`referenceText`、`audioUrl`、`videoUrl`；只有 Search Item 与当前 Receive ItemID 一致且快照未过期时才允许导入。
- 音视频由浏览器使用当前 AIDP 登录态或签名上下文直接下载。不得把第三方 Cookie、Authorization、Session、完整请求头或原始签名 URL 发给脚本中心。
- 浏览器将 `Content-Length` 仅用于提前拒绝，并通过 `response.body` 流式累计实际字节；单文件超过 100MB 时立即取消响应流。字节不转码，分别上传到台州话专用媒体端点。任一已声明媒体失败时不调用条目创建接口。
- 服务器将媒体保存为不可猜测的长期 HTTPS 参考地址；生产地址必须能被录音小程序访问，`localhost` 仅用于本地联调。

## 浏览器调用脚本中心

```text
POST /api/bytedance-aidp/taizhou-helper/recording-media/audio|video
Content-Type: <安全媒体类型>
X-Recording-Task-Id: <内部 taskId>
Body: <原始媒体字节>
```

媒体上传成功后创建条目：

```text
POST /api/bytedance-aidp/taizhou-helper/recording-items
Content-Type: application/json
```

```json
{
  "recordingTaskId": "<internal-task-id>",
  "sourceItemId": "<AIDP-ItemID>",
  "referenceText": "脱敏示例文字",
  "audioUploadId": "<upload-id-or-null>",
  "videoUploadId": "<upload-id-or-null>"
}
```

浏览器不生成外部 `operationId`。脚本中心按脚本命名空间、内部 taskId 与 sourceItemId 计算稳定幂等键，并使用服务器机器 Key 调用录音任务平台。请求内容指纹只使用去除首尾空白的参考文字，以及音视频的媒体类型和内容 SHA-256，不使用一次性 uploadId；因此页面重载后重新上传相同字节仍可恢复 `PENDING` / `RETRYABLE` / `SUCCESS` 映射，不同内容则返回 409：

```text
POST /api/integrations/tasks/{taskId}/items
X-API-Key: <server-only>
Idempotency-Key: <server-derived-stable-key>
```

## 同步映射与结果

- 扩展本地只保留最近 500 条映射：`recordingTaskId`、`sourceItemId`、`recordingItemId`、`itemCode`、`syncToken`、`updatedAt`。
- 映射不保存或展示 API Key、登录态、参考全文、原始签名媒体 URL；Options 不展示映射。
- 同一任务与 sourceItemId 的成功映射使用服务器 `tokenSecret` 和稳定映射键派生同一不可猜测同步凭证；跨浏览器或重装后的幂等重放不会覆盖并废止其他客户端已取得的凭证，也不会向客户端暴露映射键或签名密钥。
- 每次进入题目时，扩展会在任何本地映射查询之前登记 sourceItemId 与进入代次；存在匹配映射时只自动查询一次，不轮询。A→B→A 会在再次进入 A 时重新查询，连续停留在同一题不会重复查询。旧 A 的慢映射、结果或错误会被代次与 sourceItemId 双重校验丢弃，也不会把当前代次切回 A。手动刷新请求体只有同步凭证：

```text
POST /api/bytedance-aidp/taizhou-helper/recording-items/result
Content-Type: application/json

{"syncToken":"<opaque-token>"}
```

- 辅助面板只读显示 sourceItemId、itemCode 和任务状态。`COMPLETED` 的文本原样显示；结果音频只接受 `/api/bytedance-aidp/taizhou-helper/recording-items/audio/<payload>.<signature>`，其中两段均须为非空 base64url 字符。通过后再用当前脚本中心基址构造绝对地址并使用 `<audio controls>`；绝对 URL、单段或多段 token、查询参数、片段及其他路径一律忽略。
- 首期不展示结果视频，结果文本和音频不得写入 AIDP textarea、画段、暂存或提交接口。

人工导入启动后固定使用当时的内部 taskId、sourceItemId 和 pending key；即使请求完成前页面已从 A 切到 B，也只保存 A 的安全映射，不在 B 页面渲染 A 的导入结果或状态。

## 服务器私密配置

真实配置只放在 Git 忽略的 `config/secrets/recording-platform-integration.json`，仓库只保留脱敏模板：

```json
{
  "baseUrl": "https://recording.example.com",
  "apiKey": "<server-only-api-key>",
  "allowedTaskIds": ["<internal-task-id>"],
  "publicMediaBaseUrl": "https://annotation.example.com/api/public/recording-media",
  "tokenSecret": "<至少 32 字符的随机签名密钥>"
}
```

`tokenSecret` 必须至少 32 字符，用于签发短时结果音频代理地址；`publicMediaBaseUrl` 必须是脚本中心长期参考媒体的公网 HTTPS 基址。真实 Key 与签名密钥不得进入 Git、扩展、`chrome.storage`、前端请求、普通日志、截图或测试 fixture。日志只允许保留 requestId、目标 hostname、HTTP status、业务 code、耗时和脱敏错误摘要。

## 错误与重试

- 上下文等待、过期或 ItemID 不一致：按钮保持禁用或返回明确中文提示，不得导入错误题目。
- 媒体下载、类型、大小或上传失败：整条导入失败，不创建条目；修复条件后可人工重试。
- 401/403：停止调用并检查服务器私密配置或目标任务允许列表，不输出 Key。
- 408、429、5xx，以及明确表示处理中状态的 409：保留同一 pending 请求体与 uploadId，沿用稳定幂等身份安全重试。
- 其他确定性 4xx（包括普通 409、422）：丢弃浏览器 pending 请求；修复条件后再次点击会重新下载和上传媒体。
- 503：检查服务器私密配置与录音平台可用性；浏览器保留 pending 请求以便同内容重试。
- 若运行目录已有上传、媒体或其他运行数据，但 `state.json` 缺失、损坏或结构无效，后端必须以 `RECORDING_INTEGRATION_STATE_UNAVAILABLE` 安全关闭并保留现有文件；不得把该目录当作全新状态，也不得执行孤儿清理。排查或恢复状态文件后重启服务。

## 后续平台接入检查表

1. 单独确认脚本、页面、人工按钮位置和完整条目粒度。
2. 明确安全观察字段、ItemID 一致性与快照过期策略。
3. 使用 Options 内部 taskId 与服务器 `allowedTaskIds` 双重匹配。
4. 覆盖文本、音频、视频、组合、100MB、部分媒体失败和重复导入。
5. 覆盖单次自动查询、手动刷新、状态、文本/音频只读展示和不写回。
6. 同步脚本 README、平台资料、测试和根 `log.md` 后再提交。
