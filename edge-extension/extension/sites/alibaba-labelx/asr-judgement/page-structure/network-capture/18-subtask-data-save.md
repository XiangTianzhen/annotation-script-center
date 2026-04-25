# POST /api/v1/label/center/subTask/{subTaskId}/data 保存答案

## 请求目的

该请求用于保存当前页题卡答案。本次采集覆盖两类触发：

- 单选题 `哪个ASR更优` 选择后自动保存。
- 填空题 `特殊情况标注` 输入后自动保存。

## 触发操作

- 在第一条题卡中选择一个 `哪个ASR更优` 单选项。
- 在第一条题卡的 `特殊情况标注` 文本框输入一段测试文本。
- 为当前页剩余题卡补齐 `哪个ASR更优` 单选项，以验证连续保存节奏。
- 清空第一条题卡的 `特殊情况标注` 文本框并失焦。
- 对第一条题卡的 `特殊情况标注` 文本框进行快速连续输入并失焦。

## 请求记录

- Method：`POST`
- URL：`/api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/data`
- Content-Type：`application/json`
- Request Header：
  - `labelsessionid: <REDACTED_LABEL_SESSION_ID>`，本次观察到该 header 可能为字符串 `undefined`
  - `Cookie: <REDACTED>`
- Status：`200`

## 单选保存请求体摘要

```json
{
  "dataList": [
    {
      "dataId": "<REDACTED_DATA_ID>",
      "batchId": "<REDACTED_BATCH_ID>",
      "data": {
        "wav_id": "<REDACTED_WAV_ID>",
        "duration": 5.08,
        "is_anti_cheating": false,
        "diff_wer": 0.1176470588,
        "better_asr_gt": "",
        "raw_audio_path": "<REDACTED_SIGNED_AUDIO_URL>",
        "language": "",
        "online_rec": "asr_text1: <REDACTED_ASR_TEXT_1>\nasr_text2: <REDACTED_ASR_TEXT_2>",
        "source": "",
        "dataset_num": "<REDACTED_DATASET_NUM>"
      },
      "componentsResult": null,
      "result": {
        "markResult": [
          {
            "title": "哪个ASR更优",
            "value": ["第二个更好"]
          }
        ]
      },
      "labelDate": null,
      "operator": null,
      "userId": null,
      "status": null,
      "batchKey": null,
      "mistakeReason": null,
      "hasMistake": false,
      "voteResultList": null,
      "passVote": null,
      "type": null
    }
  ],
  "timestamp": "<REDACTED_TIMESTAMP>"
}
```

## 填空保存请求体差异

填空保存复用同一个 endpoint。与单选保存相比，`result.markResult` 追加或更新第二项：

```json
{
  "result": {
    "markResult": [
      {
        "title": "哪个ASR更优",
        "value": ["第二个更好"]
      },
      {
        "title": "特殊情况标注",
        "value": "<REDACTED_REMARK_TEXT>"
      }
    ]
  }
}
```

清空填空内容时，第二项仍存在，`value` 为 empty string：

```json
{
  "result": {
    "markResult": [
      {
        "title": "哪个ASR更优",
        "value": ["第二个更好"]
      },
      {
        "title": "特殊情况标注",
        "value": ""
      }
    ]
  }
}
```

## 脱敏响应示例

```json
{
  "code": 0,
  "message": null,
  "log": null,
  "data": true,
  "traceId": "<REDACTED_TRACE_ID>",
  "success": true
}
```

## 后续请求链路

保存成功后页面顶部显示 `保存成功`。本次观察到保存后还会刷新 board：

```text
GET /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/board?filterPassedVote=false&filter=<URL_ENCODED_FILTER>&_=<REDACTED_TIMESTAMP>
```

## 边界观察

- 当前页 20 条数据中，补齐剩余 19 条必填单选时，观察到每次点击基本都会产生独立的 `POST /subTask/<REDACTED_SUBTASK_ID>/data` 保存请求，并随后刷新 `board`。
- 连续单选未观察到合并成一个批量保存；本次每个保存请求的 `dataList` 仍只包含被修改的单条样本。
- 清空填空内容并失焦后，保存 payload 中 `特殊情况标注.value` 为 `""`，不是 `null`，也没有删除该 `markResult` 项。
- 快速连续输入 3 次并失焦后，观察到最终值合并为一次有效保存；payload 只保留最后一次输入内容。
- 所有上述保存响应均为 `code=0`、`data=true`、`success=true`。

## 字段推断

- `dataList` 本次只包含被修改的单条样本，而不是当前页全部样本。
- 保存 payload 会携带该样本完整 `data` 对象，包括音频 URL 和 ASR 文本，因此日志必须脱敏。
- `result.markResult[].title` 与模板 `answerList[].label` 对齐。
- 单选题 `value` 是数组；填空题 `value` 是字符串。
- 清空填空题时，字符串值为空字符串。
- `timestamp` 是前端保存时间戳或防重放字段。

## Content Script 建议

- 解析保存状态时可监听该 endpoint 的成功响应，但不要主动调用。
- 如果只需要当前答案，优先读取 DOM 或监听响应摘要，不要持久化完整 payload。
- 处理 `markResult` 时不要假设第二项一定存在；未填特殊情况时可能不存在或为空。
- 处理填空题时需要区分 `undefined` / 缺失项 / `""`：清空后平台会明确保存 empty string。
- 对连续输入建议按平台保存成功响应或 DOM 最终值同步，不要假设每一次 input 事件都会对应一次保存请求。
- 对 `labelsessionid` 做空值容错，本次实际请求头中出现过 `undefined`。

## 未确认项

- 保存失败时的响应结构未采集。
