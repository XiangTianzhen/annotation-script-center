# 04-任务详情 网络请求

- 页面路由：`/mytask/detail/<taskId>`
- 访问方式：我的任务列表 → 点击任务名称

## 请求 1：任务详情

- **方法**：GET
- **URL**：`https://markapi.aishelltech.com/api/task/detail/<taskId>`
- **响应关键字段**：
  - `data.result.id`：任务 ID
  - `data.result.taskName`：任务名称
  - `data.result.templateName`：任务模板
  - `data.result.isPackage`：是否分包（true）
  - `data.result.packageCount`：总分包数（10）
  - `data.result.notReceivePackageCount`：未领取数（9）
  - `data.result.project.dataRoot`：**OSS 存储域名**（`https://bpp-collect.oss-cn-hangzhou.aliyuncs.com`）
  - `data.result.project.projectName`：项目名称
  - `data.result.assignedOrgName`：分配机构
  - `data.result.assignedTeamName`：分配团队
  - `data.result.acceptTime`：接收时间
  - `data.isSucceed`：是否成功

## 请求 2：分包列表

- **方法**：GET
- **URL**：`https://markapi.aishelltech.com/api/task/packageList?taskId=<taskId>&page=1&size=20`
- **分页参数**：`page` + `size`（同列表页分页格式）
- **响应关键字段**：
  - `data.result.totalCount`：总分包数
  - `data.result.items[].id`：分包 ID（`packageId`，跳转数据标注页用）
  - `data.result.items[].totalItemsCount`：总条目数（如 86）
  - `data.result.items[].markItemsCount`：已标注条目数
  - `data.result.items[].packageStatusType`：分包状态（1=进行中）
  - `data.result.items[].packageCheckStatus`：质检状态（0=未质检）
  - `data.result.items[].markUserName`：标注人员

## 跳转数据标注页

URL 格式：`/mytask/mark?taskId=<taskId>&packageId=<packageId>`
