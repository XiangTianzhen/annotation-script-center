# 04 编辑器初始化

- `routeKey`: `editor-asr`
- `riskLevel`: `readonly`

## 页面入口

- 路由模式：
  - `/app/editor/asr/?project_id=<projectId>&task_id=<taskId>&process_id=<processId>&data_id=<dataId>&job_id=<jobId>&mode=<mode>&next=<bool>&job_status=<status>&next_job_status=<status>&terminal=<terminal>`
- 本轮进入方式：
  - 作业列表点击 `继续作业`

## 请求序列

1. `GET /httpapi/user/meta`
2. `GET /httpapi/user/meta`（同页出现重复 boot）
3. `GET /httpapi/annotation/process_list?task_id=<taskId>`
4. `GET /httpapi/annotation/meta?...`
5. `GET /httpapi/platform_setting/view`
6. `GET /httpapi/annotation/postil_list?...`
7. `POST /httpapi/upload/tellme`
8. `GET /httpapi/annotation/meta?...`（再次请求）
9. `POST /httpapi/annotation/check_script`

## 核心接口

### `GET /httpapi/annotation/process_list`

- `requestClass`: `data-read`
- `queryKeys`：
  - `task_id`
- 请求体结构：无
- 响应结构：
  - `code`
  - `data[]`
  - `data[0].process_id`
  - `data[0].process_name`
- 列表路径：`data`
- 总数字段：无
- 上下游 ID 传递：
  - 用于确认当前任务有哪些工序

### `GET /httpapi/annotation/meta`

- `requestClass`: `data-read`
- `queryKeys`：
  - `project_id`
  - `task_id`
  - `process_id`
  - `job_id`
  - `data_id`
- 请求体结构：无
- 响应结构：
  - `code`
  - `data.datas[]`
  - `data.datas[0].entry_id`
  - `data.datas[0].entry_index`
  - `data.datas[0].name`
  - `data.datas[0].type`
  - `data.datas[0].content`
  - `data.datas[0].extra`
  - `data.anns[]`
  - `data.anns[0].entry_index`
  - `data.anns[0].entry_id`
  - `data.anns[0].unique_id`
  - `data.anns[0].ann_scope`
  - `data.anns[0].ann_data`
  - `data.anns[0].source`
  - `data.anns[0].status`
  - `data.anns[0].version`
  - `data.anns[0].audio_duration`
  - `data.anns[0].section_duration`
  - `data.template`
  - `data.template.is_huaduan`
  - `data.template.huaduan_type`
  - `data.template.zidong_xifu_duration`
  - `data.template.huaduan_valid_duration[]`
  - `data.template.attrs[]`
  - `data.template.entry_attrs[]`
  - `data.template.moment_attrs[]`
  - `data.template.common_phrase[]`
  - `data.template.tag_mode`
  - `data.template.single_tag[]`
  - `data.template.single_tag_invalid[]`
  - `data.template.char_check_unique_ids[]`
  - `data.template.charsets[]`
  - `data.template.char_check[]`
- 列表路径：
  - 条目列表：`data.datas`
  - 现有标注：`data.anns`
  - 模板字段：`data.template.attrs`
- 总数字段：无
- 上下游 ID 传递：
  - `entry_id / entry_index` 驱动音频列表
  - `unique_id` 驱动标注模板与校验
- 后续可复用字段：
  - `datas[].entry_id`
  - `datas[].entry_index`
  - `datas[].name`
  - `template.attrs[]`
  - `template.entry_attrs[]`
  - `template.common_phrase[]`
- 风险字段：
  - `content`
  - `extra`
  - 任意转写文本
  - 任意资源 URL

### `GET /httpapi/platform_setting/view`

- `requestClass`: `boot`
- `queryKeys`: 无
- 响应结构：
  - `code`
  - `data.detect_gpus`
  - `data.detect_parallel_count`
  - `data.view_watermark`
- 作用：
  - 编辑器级平台设置

### `GET /httpapi/annotation/postil_list`

- `requestClass`: `data-read`
- `queryKeys`：
  - `project_id`
  - `task_id`
  - `process_id`
  - `job_id`
  - `data_id`
- 响应结构：
  - `code`
  - `data[]`
- 列表路径：`data`
- 总数字段：无
- 本轮观测：
  - 当前作业返回空数组

### `POST /httpapi/upload/tellme`

- `requestClass`: `asset`
- 作用：与 `app/web` 壳层一致，预热上传配置
- 风险：返回临时上传凭证，不保留原值

### `POST /httpapi/annotation/check_script`

- `requestClass`: `data-read`
- `queryKeys`: 无
- 请求体结构：
  - `project_id`
  - `task_id`
  - `process_id`
  - `job_id`
  - `data_id`
  - `entry_indexes[]`
- 响应结构：
  - `code`
  - `data.is_ok`
  - `data.tips[]`
  - `data.msg`
- 列表路径：`data.tips`
- 总数字段：无
- 上下游 ID 传递：
  - `entry_indexes[]` 用于校验指定条目
- 后续可复用字段：
  - `is_ok`
  - `tips[]`
  - `msg`

## 首轮结论

- 编辑器真正依赖的是 `project_id + task_id + process_id + data_id + job_id`
- `annotation/meta` 是核心总装接口：同时给条目列表、现有标注和模板规则
- `check_script` 是非持久化校验口，可视为提交前的只读验证
