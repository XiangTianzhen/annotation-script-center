# 首页“标注”打开子任务详情

## 请求目的

该记录用于说明标注首页“我的任务 / 未完成”表格中的 `标注` 按钮如何打开已领取子任务包。

## 触发操作

- 首页已有多条未完成包。
- 点击第二条或第三条未完成包行内的 `标注` 按钮。

## 页面行为

`标注` 按钮不会在首页当前标签页内跳转，而是打开新的详情页标签页：

```text
/corpora/labeling/sdk?missionType=label&projectId=<REDACTED_PROJECT_ID>&subTaskId=<REDACTED_SUBTASK_ID>
```

本次观察到：

- 首页标签页 URL 保持为 `/corpora/labeling/labelingTask?...`。
- 浏览器新增详情页标签页。
- 新标签页进入后渲染详情页题卡。

## 首页侧请求记录

点击 `标注` 时，首页当前标签页未观察到新的业务 XHR/fetch 请求。

## 新详情页初始化请求

新打开的详情页会执行标准详情页初始化链路：

```text
GET  /api/v1/label/surveyResults
GET  /api/v1/appInfo/listAuthAppInfo?isRedirect=false&module=label...
GET  /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/data?page=1&pageSize=10&filterPassedVote=false&filter=<URL_ENCODED_FILTER>...
GET  /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/summary...
GET  /api/v1/label/center/subTask/<REDACTED_SUBTASK_ID>/board?filterPassedVote=false&filter=<URL_ENCODED_FILTER>...
POST /api/v1/label/center/timer
POST /api/v1/label/center/<REDACTED_SUBTASK_ID>/session
GET  /api/v1/label/tasks/getLabelTaskInfo?taskId=<REDACTED_TASK_ID>...
```

随后页面会按 `dataList[].data.raw_audio_path` 加载当前页音频 media 请求。

## 字段推断

- `subTaskId` 来自首页未完成包列表中的行数据，或来自此前手动领取成功响应的 `data` 字段。
- 切换不同未完成包，本质是打开不同 `subTaskId` 的详情页。
- 首页点击 `标注` 前没有额外“锁定”或“切换任务”接口；真正的数据读取发生在新详情页初始化阶段。

## Content Script 建议

- 如果扩展在首页运行，可从 `subTasks` 响应或行内 DOM 获取未完成包摘要，但不要主动打开详情页。
- 如果扩展在详情页运行，应以当前 URL 的 `subTaskId` 和最新 `data` 响应为准。
- 浏览器可能存在多个同一 `subTaskId` 的详情页标签，扩展内部状态不要只按 `projectId` 归并。

## 未确认项

- 平台是否在某些浏览器设置下改为当前标签页跳转未确认。
- 如果同一子任务包已经在另一个详情页打开，再次点击 `标注` 是否复用标签页未确认；本次观察到可出现重复详情页标签。
