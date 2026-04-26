# GET /api/v1/label/tasks/getLabelTaskInfo

## 请求目的

该请求返回任务模板、字段配置、答案选项和流程配置。它是扩展避免硬编码页面结构的重要数据源。

## 触发操作

- 打开详情页。
- 刷新详情页。

通常在 `data` 接口返回后出现，因为请求参数需要 `taskId`。

## 请求记录

- Method：`GET`
- URL：`/api/v1/label/tasks/getLabelTaskInfo`
- Query：
  - `taskId=<REDACTED_TASK_ID>`
  - `_=<REDACTED_TIMESTAMP>`
- Request Body：无。
- Status：`200`

## 脱敏请求示例

```http
GET /api/v1/label/tasks/getLabelTaskInfo?taskId=<REDACTED_TASK_ID>&_=<REDACTED_TIMESTAMP>
Accept: */*
Cookie: <REDACTED>
```

## 脱敏响应示例

```json
{
  "code": 0,
  "message": null,
  "data": {
    "id": "<REDACTED_TASK_ID>",
    "name": "<REDACTED_TASK_NAME>",
    "type": "custom",
    "bizType": "",
    "status": "running",
    "createTime": "<REDACTED_DATE>",
    "expectedCount": 20000,
    "dataset": {
      "type": "corpus",
      "config": {
        "id": "<REDACTED_DATASET_ID>"
      },
      "appId": null,
      "name": null
    },
    "template": {
      "id": "<REDACTED_TEMPLATE_ID>",
      "name": "<REDACTED_TEMPLATE_NAME>",
      "parameters": [
        {
          "name": null,
          "value": null
        },
        {
          "name": "两个ASR文本",
          "value": null
        },
        {
          "name": "wav_id",
          "value": null
        }
      ],
      "scheme": {
        "answerList": [
          {
            "type": "Answer",
            "label": "哪个ASR更优",
            "title": "单选",
            "fieldId": "<REDACTED_FIELD_ID_CHOICE>",
            "options": [
              {
                "label": "第一个更好",
                "value": "第一个更好"
              },
              {
                "label": "第二个更好",
                "value": "第二个更好"
              },
              {
                "label": "都不好",
                "value": "都不好"
              },
              {
                "label": "不确定或差不多",
                "value": "不确定或差不多"
              },
              {
                "label": "其他方言或语种",
                "value": "其他方言或语种"
              }
            ],
            "required": true,
            "componentName": "DtRadio"
          },
          {
            "type": "Answer",
            "label": "特殊情况标注",
            "title": "填空",
            "fieldId": "<REDACTED_FIELD_ID_REMARK>",
            "saveType": "auto",
            "componentName": "DtInput"
          }
        ],
        "contentList": [
          {
            "type": "Content",
            "title": "音频",
            "fieldId": "<REDACTED_FIELD_ID_AUDIO>",
            "fieldName": "raw_audio_path",
            "componentName": "DtAudioBase"
          },
          {
            "type": "Content",
            "label": "两个ASR文本",
            "title": "文本",
            "fieldId": "<REDACTED_FIELD_ID_ASR_TEXT>",
            "fieldName": "online_rec",
            "componentName": "DtText"
          },
          {
            "type": "Content",
            "label": "wav_id",
            "title": "文本",
            "fieldId": "<REDACTED_FIELD_ID_WAV_ID>",
            "fieldName": "wav_id",
            "componentName": "DtText"
          }
        ]
      },
      "questions": [
        {
          "title": "哪个ASR更优",
          "type": "choice",
          "key": null,
          "required": true
        },
        {
          "title": "特殊情况标注",
          "type": "fill_in",
          "key": null,
          "required": false
        }
      ]
    },
    "assignStrategy": "snatch",
    "processConfigVO": {
      "needLabelProcess": true,
      "needCheckProcess": true,
      "needReviewProcess": true,
      "assignBatchType": "DATASET_FIELD",
      "assignBatchField": "dataset_num",
      "labelModel": "vote",
      "voteNum": 3,
      "isNewQueryModel": true
    }
  },
  "traceId": "<REDACTED_TRACE_ID>",
  "success": true
}
```

## 关键字段

| 字段路径 | 含义推断 | 扩展用途 |
| --- | --- | --- |
| `data.id` | 任务 ID | 与 `data` 接口的 `taskId` 对齐 |
| `data.status` | 任务状态 | 当前采集为 `running` |
| `data.template.scheme.answerList` | 答案字段定义 | 判断单选、填空、选项 |
| `answerList[].fieldId` | 答案字段 ID | 保存请求可能会用到，待采集确认 |
| `answerList[].options` | 单选枚举 | 快捷键/自动选择候选 |
| `contentList[].fieldName` | 内容字段名 | 映射样本数据字段 |
| `processConfigVO.labelModel` | 标注模式 | 当前为投票模式 |
| `processConfigVO.voteNum` | 投票人数 | 当前为 3 |
| `assignStrategy` | 分配策略 | 当前为抢单或领取型 |

## Content Script 建议

- 用该接口建立题目 schema，不要把 DOM 文案作为唯一依据。
- 单选题选项应以 `options[].value` 为准。
- 内容字段应以 `contentList[].fieldName` 映射 `dataList[].data`。
- `fieldId` 暂时只作为内部字段标识记录；保存请求的 payload 结构还未采集确认。

## 未确认项

- 保存请求是否使用 `fieldId`、`title`、`value` 或其他组件字段尚未采集。
- 不同 ASR 更优项目模板 ID 和 fieldId 是否稳定尚未确认。
