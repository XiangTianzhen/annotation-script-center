# 06-敏感写操作接口清单与安全边界

## 来源

基于前端 Bundle（`app.ded7a076.js`）静态分析 + 网络面板真实验证。

## 标注侧写操作

| 接口 | 方法 | 验证状态 | 用途 |
|------|------|----------|------|
| `/api/mark/SaveShortMark` | POST | 待实测 | 短标注保存 |
| `/api/mark/saveLongMark` | POST | Bundle分析 | 长标注（含切片）保存 |

### SaveShortMark Payload

```json
{
  "mark": "<标注文本>",
  "taskItemId": "<条目ID>",
  "spendTime": 12,
  "scene": "default",
  "duration": 5.4
}
```

## 质检侧写操作（Bundle 分析，待质检员验证）

| 接口 | 方法 | 用途 |
|------|------|------|
| `/api/check/saveCheck` | POST | 质检保存 |
| `/api/check/saveReCheck` | POST | 重检保存 |
| `/api/check/FinishCheck` | POST | 完成质检包 |
| `/api/check/GetSectionCheckByMarkDataId/<id>` | GET | 取分段质检数据 |

### 质检保存 Payload（推测）

```json
{
  "id": "<质检项ID>",
  "checkSuggestion": "<质检意见文本>",
  "checkStatus": 1,
  "spendTime": 12
}
```
- `checkStatus`：1=合格，2=不合格

## 验收侧写操作（Bundle 分析，待验收员验证）

| 接口 | 方法 | 用途 |
|------|------|------|
| `/api/accept/saveAccept` | POST | 验收保存 |

## 安全边界

- AI 仅做辅助建议，不自动保存/提交/审核/流转。
- 质检/验收写操作不得由 AI 自动触发。
- 不绕过平台 `disabled`/`readonly` 限制。
- 文档与日志不记录 token、cookie、签名 URL。
