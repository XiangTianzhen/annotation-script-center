# GET /api/v1/appInfo/listAuthAppInfo

## 请求目的

该请求读取当前用户可访问的应用/项目元信息。它出现在详情页初始化阶段，但不是 ASR 样本内容的核心数据源。

## 触发操作

- 打开详情页。
- 刷新详情页。

## 请求记录

- Method：`GET`
- URL：`/api/v1/appInfo/listAuthAppInfo`
- Query：
  - `isRedirect=false`
  - `module=label`
  - `_=<REDACTED_TIMESTAMP>`
- Request Body：无。
- Status：`200`

## 脱敏示例

```http
GET /api/v1/appInfo/listAuthAppInfo?isRedirect=false&module=label&_=<REDACTED_TIMESTAMP>
Accept: */*
Cookie: <REDACTED>
```

```json
{
  "code": 0,
  "message": null,
  "data": [
    {
      "id": "<REDACTED_PROJECT_ID>",
      "name": "<REDACTED_APP_NAME>",
      "remark": "<REDACTED_APP_REMARK>",
      "ownerVO": "<REDACTED_PERSON_OBJECT>",
      "creatorVO": "<REDACTED_PERSON_OBJECT>",
      "isPublic": false,
      "authStatus": null,
      "applyUrl": null,
      "deptInfo": "<REDACTED_DEPT_OBJECT>",
      "dseAppId": "<REDACTED_APP_ID>",
      "adexTenant": {
        "adexTenantId": "<REDACTED_TENANT_ID>",
        "adexTenantName": "<REDACTED_TENANT_NAME>"
      },
      "isAdmin": false,
      "gmtCreate": "<REDACTED_TIMESTAMP>",
      "iconUrl": "<REDACTED_SIGNED_IMAGE_URL>"
    }
  ],
  "success": true
}
```

## 字段推断

- `id` 对应当前 LabelX 应用或项目 ID。
- `isAdmin` 表示当前用户是否为应用管理员。
- `ownerVO`、`creatorVO`、`deptInfo` 包含人员或组织信息，必须脱敏。
- `iconUrl` 可能带签名参数，必须脱敏。

## Content Script 建议

- 对 ASR 快判解析来说，该请求不是核心数据源。
- 不建议记录人员、部门、应用负责人等字段。
- 如果需要确认当前页面所属项目，优先使用 URL 中的 `projectId`，而不是记录该接口完整响应。

## 未确认项

- 应用权限不足、未登录或跨项目访问时的返回结构未采集。
