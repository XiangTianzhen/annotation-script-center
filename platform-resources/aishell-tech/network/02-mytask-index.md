# 02-我的任务列表 网络请求

- 页面路由：`/mytask/index`
- 前端框架：Vue 2 + Element UI
- 访问方式：顶部菜单「我的任务」
- 鉴权格式：`Authorization: Bearer <JWT>`
- 分页格式：`page` + `size`

---

## 请求 1：当前用户信息

- **方法**：POST
- **URL**：`https://markapi.aishelltech.com/api/account/info`
- **请求体**：`{"curRole": null}`
- **响应关键字段**：
  - `data.result.id`：用户 ID
  - `data.result.username`：用户名
  - `data.result.name`：显示名
  - `data.result.roles`：角色代码（`a` = 标注员）
  - `data.result.curRole`：当前角色
  - `data.result.sex`：性别（2=未知/未设）
  - `data.result.age`：年龄
  - `data.isSucceed`：是否成功

## 请求 2：我的任务列表

- **方法**：GET
- **URL**：`https://markapi.aishelltech.com/api/task/myMarkList?page=1&size=15`
- **分页参数**：`page`（页码），`size`（每页条数，默认 15）
- **响应关键字段**：
  - `data.result.indexFrom`：起始索引
  - `data.result.pageIndex`：当前页码
  - `data.result.pageSize`：每页条数
  - `data.result.totalCount`：总任务数
  - `data.result.totalPages`：总页数
  - `data.result.items[]`：任务列表数组
    - `id`：任务 ID（用于跳转详情）
    - `taskNumber`：任务编号
    - `taskName`：任务名称
    - `taskStatus`：任务状态（2=进行中）
    - `isPackage`：是否分包
    - `packageCount`：分包总数
    - `checkPercent`：质检比例
    - `assignedStatus`：分配状态（2=已接受）
    - `project.id`：项目 ID
    - `project.projectName`：项目名称
    - `project.manager.name`：项目经理
    - `createTime`：创建时间
    - `acceptTime`：接受时间

## 请求 3：项目列表（全局）

- **方法**：GET
- **URL**：`https://markapi.aishelltech.com/api/project/all`
- **说明**：加载所有可用项目信息

## 请求 4：任务进度（每任务一个）

- **方法**：GET
- **URL**：`https://markapi.aishelltech.com/api/task/getTaskSchedule/<taskId>`
- **触发时机**：列表加载后对每个任务发起，共 N 个请求
- **说明**：获取单个任务的分包进度

---

## 任务列表示例条目

```json
{
  "id": "2059460959847714816",
  "taskNumber": "202652710253000",
  "taskName": "short_方言采集_20260525-闽南-2_20260527",
  "taskStatus": 2,
  "isPackage": false,
  "packageCount": 0,
  "checkPercent": 0,
  "assignedStatus": 2,
  "project": { "projectName": "闽南方言标注-艾斯" },
  "createTime": "2026-05-27T10:25:30",
  "acceptTime": "2026-05-27T10:31:31"
}
```

## 跳转到标注页

从列表点击某任务 → 跳转 `/mytask/mark?taskId=<taskId>&packageId=<packageId>`
