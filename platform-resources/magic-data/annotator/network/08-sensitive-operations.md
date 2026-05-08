# 08 敏感写操作接口清单（仅识别，未触发）

## 说明

- 以下接口来自前端 bundle 只读检索。
- 本轮采集中未主动触发。
- 任何后续调用都必须由用户明确确认。

## 标注侧高风险接口

- `/api/management-service/annotateTask/save`
- `/api/management-service/annotateTask/submit`
- `/api/management-service/annotateTask/pending`
- `/api/management-service/annotateTask/upOrDown`
- `/api/management-service/annotateTask/goBack`
- `/api/management-service/annotateTask/deleteElement`
- `/api/management-service/annotateTask/saveElement`
- `/api/management-service/annotateTask/submitElement`

## 抽检/审核侧高风险接口

- `/api/management-service/sampling/save`
- `/api/management-service/sampling/submit`
- `/api/management-service/sampling/deleteElement`
- `/api/management-service/checkMark/save`
- `/api/management-service/checkMark/wholeQua/...`
- `/api/management-service/checkMark/wholeBack`

## 元素级写操作接口

- `/api/management-service/taskElement/annoSubmit`
- `/api/management-service/taskElement/checkSubmit`
- `/api/management-service/taskElement/save`
- `/api/management-service/taskElement/saveCheck`
- `/api/management-service/taskElement/del`
- `/api/management-service/taskElement/cleanResult`

## 动作边界

- 默认：禁止自动触发。
- 仅在“用户当前轮明确授权 + 可回滚策略明确 + 日志脱敏”后可进入人工触发验证。
