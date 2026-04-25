# GET /oss-proxy-labelx/.../*.wav

## 请求目的

该请求是页面自动触发的音频 media 加载。音频 URL 来自 `data.dataList[].data.raw_audio_path`。

## 触发操作

- 详情页刷新后页面自动加载。
- 点击第一条题卡音频的 `播放` 控件。
- 对第一条题卡音频执行播放、暂停、拖动进度、快进、后退、倍速调整和重载。

## 请求记录

- Method：`GET`
- URL 形态：`/oss-proxy-labelx/.../*.wav?Expires=<REDACTED>&OSSAccessKeyId=<REDACTED>&Signature=<REDACTED>`
- Status：`206 Partial Content`
- Request Body：无。
- Response Body：音频二进制分片。

## 脱敏请求示例

```http
GET /oss-proxy-labelx/<REDACTED_BUCKET_OR_PROXY_PATH>/<REDACTED_AUDIO_FILE>.wav?Expires=<REDACTED>&OSSAccessKeyId=<REDACTED>&Signature=<REDACTED>
Range: bytes=<REDACTED_RANGE>
Cookie: <REDACTED>
```

## 脱敏响应示例

```http
HTTP/2 206 Partial Content
Content-Type: audio/wav
Content-Range: bytes <REDACTED_RANGE>/<REDACTED_TOTAL_BYTES>

<binary audio chunk>
```

## 观察结果

- 当前分页 `page=1&pageSize=10` 返回 10 条样本数据。
- 页面自动出现 20 条 media 请求，推断为 10 条音频资源被触发两轮 Range 加载。
- 音频请求 URL 与 `data.dataList[].data.raw_audio_path` 对应。
- URL query 包含临时签名参数，必须整体脱敏。
- 切换到 `pageSize=20` 后，页面会为更多当前页音频触发新的 `206` Range 请求。
- 点击播放按钮后，未观察到额外业务 XHR/fetch 保存请求，只观察到同一音频资源的 media Range 请求。
- 暂停、拖动进度、快进、后退和倍速调整未观察到额外业务 XHR/fetch 请求。
- 点击重载后观察到同一音频资源再次发起 `206 Partial Content` media Range 请求。
- 音频控件操作期间页面仍会按周期发送 `POST /api/v1/label/center/timer`，该请求与音频操作没有直接业务关联。

## 字段推断

- `206 Partial Content` 表示浏览器使用 Range 方式加载音频。
- 同一音频可能出现多次请求，扩展不能简单按请求次数判断样本数量。
- 音频资源的真实业务关联应回到 `dataList[].data.raw_audio_path` 和同一条样本的 `dataId`。

## Content Script 建议

- 不建议监听 media 请求作为核心数据源。
- 如需关联音频，优先使用 `data` 接口中的 `raw_audio_path` 字段。
- 长期日志只保留是否存在音频、文件扩展名、可选的路径摘要，不保留完整 URL 或签名 query。
- 不建议把暂停、进度拖动、倍速切换作为答案保存信号；本次观察这些操作不触发 `data` 保存接口。
- 如果需要判断音频是否重新加载，可观察同一 `raw_audio_path` 的新增 `206` 请求，但不能依赖请求次数推断用户播放次数。

## 未确认项

- 音频加载失败时的状态码和页面表现未采集。
