# 录音任务平台接入规范

本文规定标注脚本中心未来按平台接入“人工添加当前数据到录音任务平台”时的统一边界。当前仓库尚未实现媒体上传、公开托管、录音平台转发、平台按钮或任务映射；任何脚本都不会因为本文自动启用该功能。

## 启用条件

- 只有已通过标注脚本中心管理员验证的使用者可以触发添加。
- 每个平台脚本必须显式接入且默认关闭，不得把功能自动扩散到其他脚本。
- 接入前必须逐项确认按钮位置、整条或单段粒度、参考文本来源、音视频来源、目标任务 ID、失败提示和人工验收步骤。
- 每个已接入脚本固定映射一个录音任务 ID；具体值只放服务器私密配置，不写入平台 README、日志或扩展存储。

## 媒体处理

- 可匿名公网读取的媒体直接使用原始绝对 HTTPS URL。
- 需要平台 Cookie、Authorization 或 Session 才能读取的媒体，必须由浏览器在当前登录态内取得文件字节，再上传到未来实现的标注脚本中心媒体托管能力。
- 不得把第三方平台 Cookie、Authorization、Session、完整请求头或带凭证 URL 发送到服务器代下载。
- 未来托管能力固定使用不可猜测的长期 HTTPS URL，单文件最多 100MB，不转码，临时文件校验后原子落盘。
- 生产媒体 URL 必须能被微信小程序直接访问；`127.0.0.1`、`localhost` 或其他本地 URL 只能用于服务器内部联调，不能写入生产任务。

## 服务器私密配置

未来实现调用端时，原始 Key 只能放在 Git 忽略的 `config/secrets/recording-platform-integration.json`。该文件当前不创建；建议结构如下：

```json
{
  "baseUrl": "https://recording.example.com",
  "apiKey": "<server-only-api-key>",
  "publicMediaBaseUrl": "https://annotation.example.com/recording-media",
  "scripts": {
    "<script-id>": {
      "enabled": true,
      "taskId": "<recording-task-id>"
    }
  }
}
```

真实 Key 不得进入 Git、`.env.example`、扩展 `chrome.storage`、前端请求、普通日志、截图或测试 fixture。浏览器只调用标注脚本中心后端；由后端读取私密 Key 后调用录音任务平台。

## 录音任务平台 API

```text
POST /api/integrations/tasks/{taskId}/items
X-API-Key: <server-only-api-key>
Idempotency-Key: <stable-operation-id>
Content-Type: application/json
```

请求体支持以下三个字段的任意非空组合：

```json
{
  "referenceText": "脱敏示例文字",
  "referenceAudioUrl": "https://media.example.com/object/audio-id",
  "referenceVideoUrl": "https://media.example.com/object/video-id"
}
```

音视频 URL 必须是包含有效主机、不含用户名或密码信息的绝对 HTTPS URL。录音任务平台只保存 URL，不执行 DNS、HEAD、GET、重定向、格式、大小、时长或内容检查。

成功响应为 HTTP 201：

```json
{
  "itemId": "<item-id>",
  "taskId": "<recording-task-id>",
  "itemCode": "T000001-0000001",
  "status": "AVAILABLE",
  "createdAt": "2026-07-24T00:00:00Z"
}
```

## 调用示例

curl：

```bash
curl --fail-with-body \
  -X POST "https://recording.example.com/api/integrations/tasks/<recording-task-id>/items" \
  -H "X-API-Key: <server-only-api-key>" \
  -H "Idempotency-Key: <stable-operation-id>" \
  -H "Content-Type: application/json" \
  --data '{"referenceText":"脱敏示例文字","referenceAudioUrl":"https://media.example.com/object/audio-id"}'
```

Node.js 后端：

```js
async function addRecordingTaskItem(config, input) {
  const response = await fetch(
    `${config.baseUrl}/api/integrations/tasks/${encodeURIComponent(config.taskId)}/items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
        "Idempotency-Key": input.operationId,
      },
      body: JSON.stringify({
        referenceText: input.referenceText || null,
        referenceAudioUrl: input.referenceAudioUrl || null,
        referenceVideoUrl: input.referenceVideoUrl || null,
      }),
    }
  );
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.message || "添加录音任务数据失败");
    error.status = response.status;
    error.code = body.code || "UNKNOWN_ERROR";
    error.requestId = body.requestId || "";
    throw error;
  }
  return body;
}
```

每次人工操作生成稳定且不含客户数据的 `operationId`；网络重试必须复用同一个值。相同 `Idempotency-Key` 返回首次结果，不得因超时生成新 Key 重复添加。

## 错误处理

| HTTP | code | 处理 |
|---:|---|---|
| 400 | `OPERATION_ID_REQUIRED` 或请求结构错误 | 修正调用端字段或幂等键，不盲目重试 |
| 401 | `INVALID_INTEGRATION_API_KEY` | 停止调用，检查服务器私密配置，不输出 Key |
| 409 | `OPERATION_IN_PROGRESS` | 稍后使用同一幂等键重试 |
| 409 | `INVALID_TASK_STATE` | 提示目标任务已结束或状态不允许 |
| 422 | `ITEM_REFERENCE_REQUIRED` | 至少提供一种任务已启用的参考内容 |
| 422 | `REFERENCE_TYPE_NOT_ENABLED` | 调整脚本映射或任务参考类型 |
| 422 | `REMOTE_URL_INVALID` | 改用合规的长期 HTTPS URL |
| 503 | `INTEGRATION_NOT_CONFIGURED` | 先在录音平台配置机器 Key 摘要 |

日志只允许保留 `requestId`、目标 hostname、HTTP status、业务 code、耗时和脱敏错误摘要，不记录 API Key、完整媒体 URL、请求体或第三方登录态。

## 平台接入检查表

1. 确认当前只接入一个明确的脚本和页面。
2. 确认人工按钮、管理员验证和二次点击防护。
3. 确认导入粒度及三类参考内容各自来源。
4. 确认公网 URL 直传或浏览器下载后托管的分支。
5. 配置服务器私密任务映射并验证目标任务启用的参考类型。
6. 覆盖成功、空内容、无管理员会话、受限媒体下载失败、托管失败、401、409、422、503 和弱网幂等重试。
7. 更新对应脚本 README、平台资料、测试和根 `log.md` 后再提交。
