# AI Framework

`platform-resources/backend/ai-framework/` 提供脚本 AI 后端的通用 request/response 契约、route factory、pipeline runtime、资源 loader 和 adapter registry。

该框架只负责稳定编排，不包含柳州、苏州、金华、台州或杭州的具体 Prompt 与字段规则。

## 目录结构

| 路径 | 职责 |
|---|---|
| `contracts/normalized-request.js` | 标准化 AI 请求结构 |
| `contracts/normalized-response.js` | 标准化成功/失败响应结构 |
| `core/create-ai-route.js` | 创建同步 AI route handler |
| `core/create-ai-job-routes.js` | 创建 job 相关路由与状态接口 |
| `loaders/project-assets.js` | 加载脚本 Prompt、词表和项目资源 |
| `runtime/execute-project-pipeline.js` | 执行 adapter pipeline |
| `runtime/ai-runtime-meta.js` | 暴露安全的 runtime 元信息 |
| `runtime/ai-job-store.js` | 管理内存 job 生命周期和容量 |
| `registry/project-ai-registry.js` | 注册和解析脚本 adapter |
| `index.js` | 公共导出入口 |

## Adapter 边界

脚本 adapter 负责：

- 声明项目 ID 与能力。
- 把脚本请求转换为 normalized request。
- 加载脚本专属 Prompt、词表和资源。
- 调用公共 AI 模块或脚本 service。
- 把结果转换为脚本需要的响应结构。

框架负责：

- 统一成功/失败响应外壳。
- pipeline 执行、错误收口和 runtime 元信息。
- job 容量、TTL、状态和结果生命周期。
- adapter 注册和按项目解析。

框架不负责页面写入、自动提交决策或脚本业务校验。

## 接入流程

新增或调整 adapter 时：

1. 在脚本资料目录创建/修改 `ai/adapter.js`。
2. 使用 framework contracts 归一化请求和响应。
3. 将 Prompt、词表和 schema 保留在脚本目录。
4. 在 `project-ai-registry` 注册唯一项目 ID。
5. 由脚本 `backend/index.js` 注册公开路由。
6. 在根 `tests/backend/` 增加契约和失败路径测试。
7. 同步脚本 README 与统一后端 README。

当前杭州话通过 `platform-resources/magic-data/hangzhou-helper/ai/adapter.js` 接入该框架；其他脚本可以继续使用现有 service，只在需要统一 pipeline 时接入，避免无意义迁移。

## 失败处理

- 请求归一化失败时直接返回可读错误，不进入 provider。
- adapter 不存在时返回明确的项目注册错误。
- pipeline 异常统一转换为安全失败响应。
- job 超时、过期或容量满时返回稳定状态，不泄露内部对象或敏感配置。
- 框架日志只保留必要元信息和错误摘要。

## 测试

长期测试位于根 `tests/backend/`，不在 framework 生产目录保存测试文件。

```powershell
npm run test:backend
```
