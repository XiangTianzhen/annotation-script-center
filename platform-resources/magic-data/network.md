# Magic Data 平台网络（通用）

## 已采接口

- `POST /api/management-service/userTask/getUserTaskList`
  - 请求字段：`taskTypeEnum,pageNum,pageSize,projectCodeOrName,batchCode,batchStatus`
  - 响应字段：任务列表、项目名称、分页信息

## asrmark 相关

- 已确认 `#/asrmark` 页面需要依赖详情接口与音频字段，但本轮仅完成结构锚点采集。
- 完整请求链路和稳定 payload 字段待补采。

## 脱敏规则

- 不记录 cookie/token/authorization。
- 不记录完整签名音频 URL。
- 文本示例统一替换为“示例文本”。

## 助手差异

- 客家话助手差异：见 `hakka-helper/network.md`
- 闽南语助手差异：见 `minnan-helper/network.md`
