# 审核首页列表请求

## 请求来源

- 页面：`https://labelx.alibaba-inc.com/corpora/labeling/checkTask?projectId=<REDACTED_PROJECT_ID>`
- 采集方式：已登录页面，使用 `chrome_devtools` 只读观察 Network，并用页面内 `fetch` 验证 `finished=true` 列表。
- 风险级别：低。以下请求均为 GET，不点击领取、释放、分人员领取、提交等按钮。

## 已确认请求

| 动作 | 方法 | URL 摘要 | 状态码 | 作用判断 |
| --- | --- | --- | --- | --- |
| survey 探测 | GET | `/api/v1/label/surveyResults?_=...` | 404 | 旧 survey 状态探测或兼容请求，当前页面可忽略 |
| 应用授权 | GET | `/api/v1/appInfo/listAuthAppInfo?isRedirect=false&module=label&_=...` | 200 | 获取当前用户可访问的应用/项目元信息 |
| 我的审核任务 / 未完成 | GET | `/api/v1/label/center/subTasks?type=check&keyword=&appId=<PROJECT_ID>&finished=false&page=1&pageSize=5&_=...` | 200 | 当前账号未完成审核分包列表 |
| 我的审核任务 / 已完成 | GET | `/api/v1/label/center/subTasks?type=check&keyword=&appId=<PROJECT_ID>&finished=true&page=1&pageSize=5&_=...` | 200 | 当前账号已完成审核分包列表 |
| 可领取审核任务 | GET | `/api/v1/label/center/tasks?subTaskType=check&keyword=&appId=<PROJECT_ID>&page=1&pageSize=5&_=...` | 200 | 审核任务池列表 |
| 任务进度补充 | GET | `/api/v1/label/center/tasks/process?subTaskType=check&taskIds=<TASK_IDS>&_=...` | 200 | 首页任务列表进度 / 状态补充 |

## 关键参数

- 标注首页使用 `type=label` / `subTaskType=label`。
- 审核首页使用 `type=check` / `subTaskType=check`。
- `appId` 对应页面 URL 中的 `projectId`。
- `finished=false` 表示“我的任务 / 未完成”。
- `finished=true` 表示“我的任务 / 已完成”。
- `_` 是时间戳缓存破坏参数，不应作为业务参数持久化。

## 响应结构摘要

`subTasks?type=check&finished=true` 的列表项字段与标注首页已完成分包基本一致：

```json
{
  "id": "<REDACTED_SUBTASK_ID>",
  "type": "check",
  "taskId": "<REDACTED_TASK_ID>",
  "batchId": "<REDACTED_BATCH_ID>",
  "status": "<REDACTED_STATUS>",
  "gmtCreate": "<REDACTED_TIME>",
  "gmtCommit": "<REDACTED_TIME>",
  "taskName": "<REDACTED_TASK_NAME>",
  "size": "<REDACTED_COUNT>",
  "template": "<REDACTED_TEMPLATE>",
  "templateConfig": "<REDACTED_TEMPLATE_CONFIG>",
  "dataList": "<REDACTED_LIST>",
  "dataResultHistory": "<REDACTED_HISTORY>",
  "labelModel": "<REDACTED_LABEL_MODEL>",
  "taskType": "<REDACTED_TASK_TYPE>"
}
```

`tasks?subTaskType=check` 的列表项包含 `taskId`、`subTaskType`、`name`、`gmtCreate`、`total`、`left`、`labelModel` 等字段。

## 与统计上传的关系

- 快判统计上传在首页点击“上传统计”时会同时采集标注和审核两类首页列表。
- 审核列表中的子任务在统计 payload 中应写入 `roleRecord.role = "audit"`。
- 后续仍通过 `/api/v1/label/center/subTask/{subTaskId}/data` 获取完整 `dataList` 和 `duration`，再生成 CSV 补丁记录。
- 首页批量采集前需要过滤非 ASR 更优判断数据：`labelModel=vote` 是强判断；`taskName` 包含 `ASR更优结果判断` / `ASR更优` 且 `size=400` 是补充判断；`labelModel=single`、`taskName=中文普通话asr任务` 或 `size=50` 视为历史转写任务并跳过。

## 脱敏要求

- 不记录人员姓名、完整组织信息、cookie、token、authorization。
- 不记录完整 `taskId`、`subTaskId`、`batchId`、任务名称和完整样本内容。
- 只保留接口路径、参数名、状态码、字段结构和角色判断。
