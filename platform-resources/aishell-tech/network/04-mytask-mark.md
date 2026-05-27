# 04-数据标注 网络请求

- 页面路由：`/mytask/mark?taskId=<taskId>&packageId=<packageId>`
- 入口：任务详情页 → 点击分包"查看"按钮
- 鉴权：`Authorization: Bearer <JWT>`

## 请求序列

### 进入页面时自动发起（4 个）

| 序号 | URL | 方法 | 用途 |
|------|-----|------|------|
| 1 | `/api/account/info` | POST | 当前用户信息与角色 |
| 2 | `/api/task/detail/<taskId>` | GET | 任务详情（含 `dataRoot`、模板 ID） |
| 3 | `/api/taskItem/packageItemList/<packageId>` | GET | **全量条目列表**（`pageSize=9999`，不分页） |
| 4 | `/api/template/detail/<templateId>` | GET | 模板字段配置 |

### 点击文件列表中某条时（3 个）

| 序号 | URL | 方法 | 用途 |
|------|-----|------|------|
| 5 | `/api/taskItem/markDetail/<taskItemId>` | GET | 条目详情（音频 URL + 参考文本） |
| 6 | `/api/mark/getShortMark/<taskItemId>` | GET | 已存标注（未标注时 `null`） |
| 7 | OSS 音频（HEAD + GET） | - | 加载 WAV 到 Wavesurfer |

### 用户操作（1 个）

| 序号 | URL | 方法 | 用途 |
|------|-----|------|------|
| 8 | `/api/mark/SaveShortMark` | POST | **保存标注** |

---

## 请求 1：用户信息

- **URL**：`POST /api/account/info`
- **请求体**：`{"curRole": null}`
- **响应**：`{ "roles": "a", "curRole": "a" }`（`a` = 标注员）

## 请求 2：任务详情

- **URL**：`GET /api/task/detail/<taskId>`
- **响应关键字段**：
  - `templateName`：模板名（"闽南标注"）
  - `templateId`：模板 ID（用于请求 4）
  - `project.dataRoot`：**OSS 域名**（`https://bpp-collect.oss-cn-hangzhou.aliyuncs.com`）
  - `project.projectName`：项目名
  - `packageCount`：总分包数（10）
  - `taskStatus`：任务状态（2=进行中）

## 请求 3：全量条目列表

- **URL**：`GET /api/taskItem/packageItemList/<packageId>`
- **参数**：无分页参数，内部 `pageSize=9999`，一次返回全部
- **响应结构**：
  ```json
  {
    "data": {
      "result": {
        "indexFrom": 1, "pageIndex": 1, "pageSize": 9999,
        "totalCount": 86, "totalPages": 1,
        "items": [ { ... } ]
      }
    }
  }
  ```
- **每项关键字段**：
  | 字段 | 类型 | 说明 |
  |------|------|------|
  | `id` | string | 条目 ID（用于 markDetail 请求） |
  | `number` | number | 序号（1~86） |
  | `fileName` | string | 文件名 |
  | `url` | string | OSS 相对路径（拼接 `dataRoot + url` 得完整音频 URL） |
  | `text` | string | **平台参考文本** |
  | `dataStatus` | number | 标注状态（0=未标注） |
  | `checkStatus` | number | 质检状态（0=未质检） |
  | `markUserName` | string | 标注人员 |
  | `spendTime` | number | 已花费时间（秒） |

## 请求 4：模板字段配置

- **URL**：`GET /api/template/detail/<templateId>`
- **响应关键字段**：
  ```json
  {
    "name": "闽南标注",
    "templateItems": [{
      "name": "文本",
      "fieldName": "text",
      "necessary": true,
      "type": 0
    }]
  }
  ```
- `fieldName: "text"` 表明保存时 `mark` 字段的内容格式为 `{"text":"..."}` 的 JSON 字符串

## 请求 5：条目详情

- **URL**：`GET /api/taskItem/markDetail/<taskItemId>`
- **响应关键字段**：
  - `dataRoot`：OSS 域名（`https://bpp-collect.oss-cn-hangzhou.aliyuncs.com`）
  - `url`：音频相对路径
  - `fileName`：文件名
  - `text`：参考文本
  - `audioLength`：音频时长

- **音频完整 URL**：`dataRoot + url`

## 请求 6：已存标注

- **URL**：`GET /api/mark/getShortMark/<taskItemId>`
- **未标注时响应**：`{ "data": { "result": null, "isSucceed": true } }`

## 请求 8：保存标注（★ 实测）

- **URL**：`POST /api/mark/SaveShortMark`
- **Content-Type**：`application/json;charset=UTF-8`
- **请求体**：
  ```json
  {
    "mark": "{\"text\":\"<用户输入的标注文本>\"}",
    "taskItemId": "<条目ID>",
    "spendTime": 9,
    "scene": "mark",
    "duration": 16.2995
  }
  ```

  > **注意**：`mark` 字段不是纯文本，而是一个 **JSON 字符串** `{"text":"..."}`，与模板 `templateItems[0].fieldName = "text"` 对应。

- **字段说明**：
  | 字段 | 说明 |
  |------|------|
  | `mark` | JSON 字符串，含 `text` 子字段 |
  | `taskItemId` | 当前条目 ID |
  | `spendTime` | 标注耗时（秒） |
  | `scene` | 场景标识（"mark"） |
  | `duration` | 音频时长（秒，浮点数） |

- **成功响应**：`{ "status": 200, "data": { "isSucceed": true, "message": "" } }`

## 保存后再切回该条

保存后重新点击该条目 → `getShortMark` 不再返回 `null`，而是返回上次保存的 `mark` 内容。
