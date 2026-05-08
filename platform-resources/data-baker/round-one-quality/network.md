# 标贝易采一检质检网络资料

本文档记录 `roundOneCollect` 详情页当前已知网络接口。所有内容均为脱敏结构，不记录真实 token、cookie、完整签名音频 URL 或客户数据。

## 当前题列表接口

接口路径：

```text
GET https://datafactory.data-baker.com/cms/tbAudioUserTask/queryCollectStatementByCondtion
```

常见查询参数：

```text
pageSize=10
pageNum=1
collectId=...
audioText=
sentenceNumber=
vadStatus=
```

字段说明：

- `pageSize`：当前每页条数，来自分页组件。
- `pageNum`：当前页码，来自分页组件。
- `collectId`：从 `roundOneCollect` URL hash 查询参数读取。
- `audioText`：页面关键字筛选。
- `sentenceNumber`：句子编号筛选。
- `vadStatus`：句子状态 / 时间戳相关筛选。

## 触发时机

该接口通常在以下场景触发：

- 进入 `roundOneCollect` 详情页。
- 点击左侧搜索 / 重置。
- 修改分页页码。
- 修改每页条数。
- 可能在切换筛选条件后重新请求。

## 响应字段

每条记录通常包含：

```text
id
audioUrl
audioText
sentenceNumber
readRequire
effectiveStartTime
effectiveEndTime
effectiveTime
audioDuration
vad
statusName
collectId
textId
snr
volume
noise
```

当前扩展只把这些字段用于当前选中单条的 AI 推荐请求，不做批量处理。

## 响应结构兼容

运行时兼容多种列表包裹结构：

```text
data.list
data.records
data.rows
data.data
data
records
rows
list
```

总数字段兼容：

```text
data.total
data.count
data.totalCount
total
count
totalCount
```

如果后续确认真实接口固定结构，应回填本文档并收窄代码兼容范围。

## 当前题匹配策略

运行时按以下顺序定位当前记录：

1. `record.sentenceNumber` 等于左侧当前 `.sentence-item.active .title` 开头编号。
2. `record.audioText` 等于右侧“本句话文本”或左侧标题去编号后的文本。
3. 使用左侧当前选中项在当前页列表中的索引作为兜底。

匹配成功后，AI 请求字段优先使用接口记录；DOM 信息作为兜底。

## 登录态与同源策略

真实请求会携带页面已有登录态，例如 access token、cookie 等敏感信息。扩展实现原则：

- 不硬编码任何登录态。
- 不把 token/cookie 写入代码、日志、文档、`chrome.storage`、DOM 属性或 `localStorage`。
- MAIN world 脚本观察同源页面已经发出的列表请求，并把当前页记录以内存消息传给 content script。
- 如果 content script 兜底直接 `fetch` 无法携带登录态，应刷新页面或触发页面原生列表请求，让 MAIN world 观察到响应。

## 音频 URL 安全

`audioUrl` 可能是带签名的临时地址。处理规则：

- 只在内存中传给本地后端 AI 推荐接口。
- 不写入文档。
- 不写入 DOM 持久属性。
- 不写入 `localStorage` 或 `chrome.storage`。
- 前端不在 console 输出完整地址。
- 后端日志只允许输出 hostname，不输出完整 URL、`OSSAccessKeyId` 或 `Signature`。

## 新增后端接口

统一本地后端新增：

```text
GET /api/data-baker/round-one-quality/ai/recommend/health
POST /api/data-baker/round-one-quality/ai/recommend
```

请求体：

```json
{
  "collectId": "",
  "itemId": "",
  "textId": "",
  "sentenceNumber": 1,
  "readRequire": "",
  "audioUrl": "",
  "pageText": "",
  "effectiveStartTime": null,
  "effectiveEndTime": null,
  "effectiveTime": null,
  "audioDuration": null,
  "clientVersion": ""
}
```

响应体：

```json
{
  "success": true,
  "data": {
    "recommendedText": "",
    "heardText": "",
    "pageText": "",
    "isChanged": false,
    "needHumanReview": true,
    "listenConfidence": 0,
    "compareConfidence": 0,
    "decision": "",
    "changePoints": [],
    "invalidReasons": [],
    "model": {
      "listen": "qwen3.5-omni-flash",
      "compare": "qwen3.5-plus"
    },
    "usage": {
      "listen": {},
      "compare": {},
      "totalTokens": 0
    },
    "cost": {
      "estimatedCostCny": 0,
      "effectiveRevenueCny": 0,
      "grossProfitCny": 0
    },
    "requestId": ""
  }
}
```

## 待继续确认

- 真实响应最外层固定结构。
- 翻页和筛选时是否会复用缓存或重复请求。
- iframe 内部播放器是否稳定暴露 `audio.currentSrc`。
- “本句话文本”在不同状态下是否可能变为只读。
- 保存 / 判定接口不属于本轮范围，暂不采集。

