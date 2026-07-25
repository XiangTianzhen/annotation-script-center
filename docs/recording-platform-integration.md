# 录音任务平台接入规范

本文规定标注脚本中心向录音任务平台人工添加数据和只读查询结果的统一边界。当前只启用 ByteDance AIDP 台州话详情页；其他平台或脚本不会自动获得此能力。

## 当前启用条件

- 台州话 Options“基础设置”填写录音平台数据库内部 `taskId`，不是可见 `taskCode`；默认空，空值时不显示“添加数据”按钮，也不查询结果。按钮固定位于“清空画段”左侧。
- 同一 `taskId` 必须存在于服务器私密配置 `allowedTaskIds`。功能不要求管理员会话解锁，因此知道允许任务 ID 的同源调用方仍可能触发导入；这是首期正式接受的 allowlist-only 风险。
- 导入粒度固定为当前完整 AIDP Item，不按画段拆分；只允许人工点击，不批量导入、不轮询、不自动写回或提交 AIDP。

## AIDP 数据与媒体边界

- MAIN-world 只观察 `/dispatcher/search_item/category`，从 `Data[0].ItemID` 与字符串 `Data[0].Content` 中提取 `asr_text`、`audio`、`video`。
- 隔离世界只接收 `sourceItemId`、`referenceText`、`audioUrl`、`videoUrl`；只有 Search Item 与当前 Receive ItemID 一致且快照未过期时才允许导入。
- 当前来源音视频已确认是可直接访问的公网 HTTPS URL。扩展不再下载媒体，不检查 Content-Type 或大小，也不上传媒体字节；浏览器只把实际存在的参考文字和原始 URL 交给脚本中心。
- Cookie、Authorization、Session 和完整请求头不得发送到脚本中心。媒体 URL 只允许在当前页面内存的待重试请求中短暂存在，不得写入 `chrome.storage`。

## 浏览器调用脚本中心

```text
POST /api/bytedance-aidp/taizhou-helper/recording-items
Content-Type: application/json
```

```json
{
  "recordingTaskId": "<internal-task-id>",
  "sourceItemId": "<AIDP-ItemID>",
  "referenceText": "脱敏示例文字",
  "referenceAudioUrl": "https://media.example.com/reference-audio",
  "referenceVideoUrl": "https://media.example.com/reference-video"
}
```

三类参考内容允许任意非空组合，空项发送 `null`。脚本中心严格拒绝未知字段；音视频必须是不含用户名或密码的绝对 HTTPS URL。服务器不执行 DNS、HEAD、GET、重定向、类型、大小或内容探测。

脚本中心按脚本命名空间、内部 taskId 与 sourceItemId 生成稳定幂等键，并使用服务器机器 Key 调用：

```text
POST /api/integrations/tasks/{taskId}/items
X-API-Key: <server-only>
Idempotency-Key: <server-derived-stable-key>
```

请求指纹由 trim 后参考文字和两个规范化 URL 的 SHA-256 计算。相同来源与相同内容重放首次结果；相同来源改用不同文字或 URL 返回 `409 SOURCE_ITEM_CONTENT_CONFLICT`。状态文件只保存指纹和安全映射，不保存参考全文或媒体 URL。

旧参考媒体上传和托管接口已删除，以下路径必须返回 404：

```text
POST /api/bytedance-aidp/taizhou-helper/recording-media/:kind
GET|HEAD /api/public/recording-media/:mediaId
```

## 同步映射与结果

- 扩展本地最多保留最近 500 条：`recordingTaskId`、`sourceItemId`、`recordingItemId`、`itemCode`、`syncToken`、`updatedAt`。
- 映射不保存 API Key、登录态、参考全文或媒体 URL；Options 不展示映射。
- 每次进入题目只自动查询一次，不轮询。手动刷新请求只携带同步凭证。
- “当前录音平台结果”只读显示 sourceItemId、itemCode 和任务状态。仅完成后展示文本和/或结果音频，不展示结果视频，不写入 AIDP textarea、画段、暂存或提交接口。
- 结果音频仍由脚本中心使用机器 Key 从录音平台读取，并通过短时签名地址代理；删除参考媒体托管不影响该受保护代理。

## 服务器私密配置

真实配置只放在 Git 忽略的 `config/secrets/recording-platform-integration.json`：

```json
{
  "baseUrl": "https://recording.example.com",
  "apiKey": "<server-only-api-key>",
  "allowedTaskIds": ["<internal-task-id>"],
  "tokenSecret": "<至少 32 字符的随机签名密钥>"
}
```

生产 `baseUrl` 必须使用 HTTPS。本地联调只允许 `http://localhost`、`http://127.0.0.1` 或 IPv6 loopback；其他明文 HTTP 主机拒绝启动集成功能。真实 Key、允许任务 ID、同步凭证和签名密钥不得进入 Git、扩展、普通日志、截图或响应。

## 状态升级

- 状态版本为 v2，只包含安全映射。有效 v1 状态升级时保留结果同步映射，删除 `uploads`、`media`、`uploadIds` 和 `mediaIds`。
- 升级只允许删除固定运行目录下的 `temp/` 与 `media/`。目标先解析并验证为运行目录的直接子目录，绝不采用状态文件中的路径。
- 删除失败时启动失败且状态文件保持旧版本。状态缺失或损坏时不得根据不可信信息删除任何目录。
- 旧脚本中心参考媒体 URL 在升级后立即失效；已完成录音结果的短时代理仍可正常工作。

## 错误与重试

- 上下文等待、过期或 ItemID 不一致：停止导入，避免串题。
- 400/422：修正字段、URL 或参考内容；确定性 4xx 会清除浏览器内存中的待重试请求。
- 403：目标任务不在服务器允许列表。
- 408、429、5xx，以及 `OPERATION_IN_PROGRESS`：保留同一 URL 请求体并沿用稳定幂等身份重试。
- 普通日志和错误响应不得输出完整 URL、查询参数、参考全文、API Key 或同步凭证。

## 后续平台接入检查表

1. 单独确认脚本、页面、人工按钮位置和完整条目粒度。
2. 明确安全观察字段、ItemID 一致性与快照过期策略。
3. 使用 Options 内部 taskId 与服务器 `allowedTaskIds` 双重匹配。
4. 覆盖文字、音频、视频、两两组合、三项组合、URL 校验、重复导入和内容冲突。
5. 覆盖单次自动查询、手动刷新、状态、文本/音频只读展示和不写回。
6. 同步脚本 README、平台资料、测试和根 `log.md` 后再提交。
