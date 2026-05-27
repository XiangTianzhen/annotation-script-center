# 01-首页 网络请求

- 页面路由：`/index`
- 前端框架：Vue 2 + Element UI
- 访问方式：登录后默认跳转
- 鉴权格式：`Authorization: Bearer <JWT>`

首页加载时共发起 **3 个 XHR 请求**：

| 序号 | 方法 | URL | 说明 |
|------|------|-----|------|
| 1 | POST | `/api/account/info` | 当前用户信息与角色（同其他页） |
| 2 | **GET** | `/api/Statistics/GetIndexStatistics` | **首页专属** 统计总览 |
| 3 | GET | `/api/task/myMarkList?page=1&size=15` | 我的任务列表第一页（同任务列表页） |

---

## 请求 1：当前用户信息

POST `https://markapi.aishelltech.com/api/account/info`

与 `02-mytask-index` 中的请求 1 完全一致，不重复记录。

---

## 请求 2：首页统计总览（首页专属）

- **方法**：GET
- **URL**：`https://markapi.aishelltech.com/api/Statistics/GetIndexStatistics`
- **无请求参数**

### 响应结构

```json
{
  "data": {
    "result": {
      "total": [                        // 汇总统计（数组，仅 1 项）
        {
          "packagecount": "1",          // 分包总数
          "finishedpackagecount": "0",  // 已完成分包数
          "taskcount": "1",             // 任务总数
          "projectcount": "1",          // 项目总数
          "unfinisheditemcount": "0",   // 未完成条目数
          "workingitemcount": "0",      // 进行中条目数
          "finisheditemcount": "1"      // 已完成条目数
        }
      ],
      "latest30days": [                // 近 30 天每日标注量
        {
          "mdate": "2026-05-27",       // 日期
          "count": "1",                // 标注量
          "cdate": null,
          "passcount": null,           // 通过量
          "failcount": null            // 未通过量
        }
      ],
      "users": [                       // 标注员排行榜
        {
          "MarkUserName": "AS001-4",   // 标注员名（采集员为 null）
          "markcount": "10173",        // 标注数（采集员为 "0"）
          "collectcount": "0",         // 采集数（标注员为 "0"）
          "CheckUserName": null,       // 质检员名（仅质检员行有值）
          "checkcount": null           // 质检数（仅质检员行有值）
        }
      ],
      "citys": []                      // 城市维度（当前为空）
    },
    "isSucceed": true
  }
}
```

### 字段说明

- `total`：用户维度的全局聚合统计，部分字段使用字符串类型
- `latest30days`：按日期分组的近 30 天标注量趋势，`passcount`/`failcount` 当前为 null
- `users`：包含标注员和采集员的排行榜。标注员 `MarkUserName` 非空、`collectcount=0`；采集员 `markcount=0`、`collectcount` 非零；质检员单独一行，`MarkUserName` 为 null，`CheckUserName` 非空
- `citys`：当前为空数组，可能为按城市维度统计预留

---

## 请求 3：我的任务列表

GET `https://markapi.aishelltech.com/api/task/myMarkList?page=1&size=15`

与 `02-mytask-index` 中的请求 2 完全一致，字段结构见该文档。
