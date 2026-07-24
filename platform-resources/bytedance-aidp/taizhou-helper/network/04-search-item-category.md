# 04 Search Item 完整题目读取

## 请求标识 / 目的

- 路径锚点：`/dispatcher/search_item/category`
- 目的：在台州话 `mark-v3` 详情页取得当前完整题目的最小参考内容，供人工导入录音平台。
- 观察方式：MAIN-world 同时覆盖 `fetch` 与 `XMLHttpRequest`；不修改原请求或响应。

## 页面入口 / 触发动作

- 进入或切换 `mark-v3` 当前题目后由平台自身请求。
- 扩展不主动重放该接口，不用此接口领取、保存、暂存或提交数据。

## 请求摘要

- 本资料不记录方法之外的请求头、Cookie、Authorization、Session、租户、用户或完整 URL 参数。
- 扩展不会把平台请求头复制到脚本中心。

## 请求体摘要

- 不依赖或保存请求体。

## 响应摘要

脱敏结构示例：

```json
{
  "Data": [
    {
      "ItemID": "<source-item-id>",
      "Content": "{\"asr_text\":\"脱敏示例文字\",\"audio\":\"https://media.example.test/signed-object\",\"video\":\"\"}"
    }
  ]
}
```

`Content` 必须是 JSON 字符串。扩展只解析其中的 `asr_text`、`audio`、`video`，不保留原始响应或其他字段。

## 关键字段

| 来源 | 隔离世界字段 | 用途 |
| --- | --- | --- |
| `Data[0].ItemID` | `sourceItemId` | 与当前 Receive `ItemID` 一致性校验及稳定幂等身份 |
| `Content.asr_text` | `referenceText` | 完整题目参考文字 |
| `Content.audio` | `audioUrl` | 浏览器当前上下文下载音频字节 |
| `Content.video` | `videoUrl` | 浏览器当前上下文下载视频字节 |

向隔离世界发送的对象严格为：

```js
{
  sourceItemId,
  referenceText,
  audioUrl,
  videoUrl
}
```

## 前端接入建议

- 只在 Search Item `sourceItemId` 与当前 Receive `ItemID` 一致且内存快照未过期时启用导入。
- 三类参考内容去除首尾空白后至少一个存在。
- 媒体 URL 只在当前页面运行期用于浏览器下载，不写入扩展持久化映射，也不发送给脚本中心代下载。

## 风险 / 未确认项

- 平台响应结构、`Content` 类型或 ItemID 关系变化时必须失败关闭并等待新快照，不得猜测题目。
- 签名媒体可能依赖当前登录态或时效；下载失败只能给出脱敏提示并允许人工重试。
- 不记录真实签名 URL、姓名、邮箱、租户、任务正文、登录头或原始响应。
