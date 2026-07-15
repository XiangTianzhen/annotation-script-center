# 01 `mark-v3` 详情页初始化

## 请求标识 / 目的

- `routeKey`: `taizhou-mark-v3-detail`
- `riskLevel`: `readonly`

## 页面入口 / 触发动作

- 路由模式：
  - `/management/task-v2/{taskId}/mark-v3/{index}`
- 当前样例 query：
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`
- 本轮进入方式：
  - 列表页行级入口跳转
  - 地址栏直接打开已知详情页 URL

## 请求摘要

- `requestClass`: `boot`
- `Method`: `GET`
- `Path`：
  - `/management/task-v2/{taskId}/mark-v3/{index}`
- `Query`：
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`
- `requestClass`: `detail-init`
- `Path`：
  - `/task/resource/get`
- `Query`：当前样例无稳定业务 query 结论
- `requestClass`: `data-read`
- `Path`：
  - `/api/dispatch/Receive`
- `requestClass`: `staging-write`
- `Path`：
  - `/api/dispatch/SubmitTempItemAnswer`

## 请求体摘要

- 当前已确认的详情页导航链路以路径参数和 query 为主。
- `/task/resource/get` 当前样例请求体：
  - `TaskID`
  - `Option.WithTask`
  - `Option.WithFlow`
  - `Option.WithTemplate`
- `Receive` 与 `SubmitTempItemAnswer` 的稳定字段另见：
  - `02-mark-v3-receive-current-item.md`
  - `03-mark-v3-submit-temp-answer.md`

## 响应摘要

- 当前已确认详情页会绑定以下路由上下文：
  - `taskId`
  - `index`
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`
- 当前已确认详情页初始化至少涉及：
  - `task/resource/get`
    - 模板与页面结构定义
    - `neeko-wavesurfer` 波形组件挂载信息
  - `Receive`
    - 当前条目上下文
    - 当前音频地址
    - 当前临时答案分段
  - `SubmitTempItemAnswer`
    - 当前页面暂存写回契约

## 关键字段

- `taskId`
- `index`
- `from_pathname`
- `fs`
- `templateID`
- `templateType`

## 前端接入建议

- 详情页识别优先使用完整路径匹配，不要只依赖标题文本或单个按钮。
- 当前若要接脚本运行时，优先按以下顺序取上下文：
  - 路由里的 `taskId + index`
  - `task/resource/get` 里的模板定义
  - `Receive` 里的当前条与临时答案
  - `SubmitTempItemAnswer` 里的当前暂存写契约
- 在未补到更多模板样例前，不要把 `regions` 以外的字段写成稳定可改契约。

## 风险 / 未确认项

- 当前未确认更多模板类型下的 `task/resource/get` 结构是否一致。
- 当前未确认详情页是否包含 iframe、画布、富文本容器或独立媒体播放器实现。
- 保存、提交、领取、切条等写链路仍不在本轮范围内；当前只确认暂存写链路。
