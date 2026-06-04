# 03 首页到编辑器的导航请求链

- `routeKey`: `home-to-editor`
- `riskLevel`: `safe-ui`

## 路由链

1. `#/my-job`
2. `#/my-job/<projectId>/callout`
3. `#/my-job/<projectId>/callout/<taskProcessId>/<taskId>/job?process_id=<processId>&process_names=<processName>&flow_strategy=job`
4. `/app/editor/asr/?project_id=<projectId>&task_id=<taskId>&process_id=<processId>&data_id=<dataId>&job_id=<jobId>&mode=<mode>&next=<bool>&job_status=<status>&next_job_status=<status>&terminal=<terminal>`

## Step 1 我的作业：项目列表

### `GET /httpapi/my_job/project_list`

- `requestClass`: `data-read`
- `queryKeys`：
  - `page_index`
  - `page_size`
  - `keyword`
- 请求体结构：无
- 响应结构：
  - `code`
  - `data.datas[]`
  - `data.datas[0].id`
  - `data.datas[0].data_mode`
  - `data.datas[0].name`
  - `data.datas[0].preview_path`
  - `data.total`
- 列表路径：`data.datas`
- 总数字段：`data.total`
- 上下游 ID 传递：
  - `data.datas[].id -> <projectId>`
- 后续可复用字段：
  - `id`
  - `data_mode`
  - `name`
- 风险字段：
  - 真实项目名称

## Step 2 项目内任务列表：`#/my-job/<projectId>/callout`

### `GET /httpapi/project/top_info`

- `requestClass`: `data-read`
- `queryKeys`：
  - `project_id`
- 响应结构：
  - `code`
  - `data.name`
  - `data.id`
  - `data.data_mode`
  - `data.create_date`
  - `data.difficulty`
- 列表路径：无
- 总数字段：无
- 上下游 ID 传递：
  - 只补充当前 `<projectId>` 的展示元数据

### `GET /httpapi/my_job/process_list_queryopt`

- `requestClass`: `data-read`
- `queryKeys`：
  - `project_id`
  - `ann_type`
- 响应结构：
  - `code`
  - `data.process_names[]`
- 列表路径：`data.process_names`
- 总数字段：无
- 上下游 ID 传递：
  - `process_names[]` 进入列表筛选器

### `GET /httpapi/my_job/process_list`

- `requestClass`: `data-read`
- `queryKeys`：
  - `page_index`
  - `page_size`
  - `ann_type`
  - `project_id`
  - `keyword`
  - `process_names`
- 响应结构：
  - `code`
  - `data.datas[]`
  - `data.datas[0].id`
  - `data.datas[0].process_id`
  - `data.datas[0].task_id`
  - `data.datas[0].task_name`
  - `data.datas[0].data_mode`
  - `data.datas[0].status`
  - `data.datas[0].spot_check`
  - `data.datas[0].process_status`
  - `data.datas[0].process_name`
  - `data.datas[0].job_count`
  - `data.datas[0].job_status_count_infos`
  - `data.datas[0].flow_strategy`
  - `data.total`
- 列表路径：`data.datas`
- 总数字段：`data.total`
- 上下游 ID 传递：
  - `id -> <taskProcessId>`（进入下一页路径段）
  - `task_id -> <taskId>`
  - `process_id -> <processId>`
  - `process_name -> process_names`
  - `flow_strategy -> flow_strategy`
- 后续可复用字段：
  - `task_id`
  - `process_id`
  - `process_name`
  - `flow_strategy`
  - `job_count`
- 风险字段：
  - 真实任务名称
  - 任务进度细节

## Step 3 作业列表：`.../job?...`

### `GET /httpapi/task/top_info`

- `requestClass`: `data-read`
- `queryKeys`：
  - `task_id`
- 响应结构：
  - `code`
  - `data.name`
  - `data.id`
  - `data.data_mode`

### `GET /httpapi/my_job/job_list_queryopt`

- `requestClass`: `data-read`
- `queryKeys`：
  - `task_process_id`
- 响应结构：
  - `code`
  - `data.statuses[]`
  - `data.users[]`
  - `data.users[0].id`
  - `data.users[0].name`

### `GET /httpapi/my_job/job_list`

- `requestClass`: `data-read`
- `queryKeys`：
  - `page_index`
  - `page_size`
  - `keyword`
  - `task_process_id`
- 响应结构：
  - `code`
  - `data.datas[]`
  - `data.datas[0].data_id`
  - `data.datas[0].job_id`
  - `data.datas[0].job_name`
  - `data.datas[0].entries_count`
  - `data.datas[0].process_name`
  - `data.datas[0].user_name`
  - `data.datas[0].status`
  - `data.datas[0].seconds`
  - `data.datas[0].task_id`
  - `data.datas[0].process_id`
  - `data.datas[0].accuracy`
  - `data.datas[0].is_tts_compare`
  - `data.total`
- 列表路径：`data.datas`
- 总数字段：`data.total`
- 上下游 ID 传递：
  - `data_id -> <dataId>`
  - `job_id -> <jobId>`
  - `task_id -> <taskId>`
  - `process_id -> <processId>`

## Step 4 安全 UI 跳转到编辑器

- 观察到的安全入口：作业行内 `继续作业`
- `riskLevel`: `safe-ui`
- 行为：打开新标签页进入 `/app/editor/asr/`
- URL 关键参数：
  - `project_id`
  - `task_id`
  - `process_id`
  - `data_id`
  - `job_id`
  - `mode`
  - `next`
  - `job_status`
  - `next_job_status`
  - `terminal`

## 写操作边界

- `领取`：`write-action`，本轮未触发
- `修改`：状态不明，暂按 `write-action` 处理，本轮未触发
- 只读采集阶段推荐路径：项目列表 `打开` -> 作业列表 `继续作业`
