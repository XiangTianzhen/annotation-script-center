# 杭州话脚本资料与后端（Magic Data）

本目录维护杭州话脚本的 AI adapter、后端路由、Prompt、响应 schema、词表和脚本专属资料。

## 目录与文件

| 路径 | 职责 |
|---|---|
| `ai/adapter.js` | 注册到统一 `ai-framework` 的杭州话 adapter |
| `backend/index.js` | 导出 `registerRoutes` |
| `backend/ai-routes.js` | Health、defaults、质检和日志摘要路由 |
| `backend/ai-review-request.js` | 请求字段归一化与校验 |
| `backend/ai-prompts.js` | 听音、比较和单模型 Prompt |
| `backend/ai-response-schema.js` | 模型结构化响应约束 |
| `backend/ai-client-qwen.js` | Qwen 调用与结果解析 |
| `backend/ai-lexicon.js` | 杭州话主词表加载与降级 |
| `backend/ai-call-log.js` | 杭州话调用日志 |
| `backend/ai-cost.js` | usage 与人民币估算 |
| `backend/lexicon/` | JSON 主词表与维护说明 |
| `network/`、`page-structure/` | 脚本差异占位；当前复用平台根级稳定资料 |

## API

- `GET /api/magic-data/hangzhou-helper/ai/review-current/health`
- `GET /api/magic-data/hangzhou-helper/ai/defaults`
- `POST /api/magic-data/hangzhou-helper/ai/review-current`
- `GET /api/magic-data/hangzhou-helper/ai/review-current/logs/summary`

路由只使用 `/api/magic-data/hangzhou-helper/*` 命名空间，由统一后端 `registry.js` 注册。

## 请求与响应

请求由 `ai-review-request.js` 归一化当前条文本、音频上下文、说话人属性、模型方案和 `aiStages.listen/refine/single`。每阶段包含 `model / prompt / generation / lexicon`；旧扁平字段兼容一个迁移周期，旧 `recognitionStrategy` 接收后忽略。

响应保持 Magic Data 前端所需的统一结构，包括：

- 听音/比较或单模型结果。
- 字段级建议和说话人属性建议。
- `pureDialectGuess` 等杭州话判断。
- usage、cost、词表状态和脱敏 debug。

## AI 模式

- `two_stage`：听音阶段按真实读音写杭州话，即使表达不顺也不普通话化；普通话整理阶段根据听音结果与上下文按原意整理通顺普通话。
- `omni_single`：一次调用同时生成独立的杭州话文本与普通话文本。
- thinking 固定关闭。
- 默认请求超时为 `60000ms`。

Prompt 与参数来自请求 override 或后端 defaults。空 override 表示继续使用后端默认值。

## 词表

运行时主词表为 `backend/lexicon/hangzhou-lexicon.json`，结构遵循项目统一 JSON 词表契约。用户负责具体词条维护，代码负责：

- JSON 加载与 schema 校验。
- 按各阶段开关筛选并序列化最多 `30` 条相关词条；无命中时不附带无关词条。
- 返回词表状态与模式。
- 文件缺失或非法时降级为无词表模式。
- 不执行代码侧普通话转方言、用字归一化、自动匹配或替换。

参考文件不替代 JSON 主词表，不在代码任务中自动改写词条内容。

## 日志与安全

- 日志记录模型、阶段、耗时、Token 和可用的人民币估算。
- 不记录 API Key、cookie、authorization、完整签名 URL 或完整音频 URL。
- 日志数据通过统一管理员 AI 日志接口导出。
- 模型原始结果在进入前端前经过结构化解析和脱敏。

## 前端联动

扩展客户端位于 `extension/sites/magic-data/hangzhou-helper/`。defaults、字段名称、模型枚举或响应结构变化时，必须同步检查前端 client、Options 设置、storage、测试和两侧 README。

## 验证

```powershell
npm run test:backend
npm run test:extension
```

真实页面验收步骤见 [扩展运行时 README](../../../extension/sites/magic-data/hangzhou-helper/README.md)。
