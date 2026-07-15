# 平台资料与统一后端

`platform-resources/` 保存三个当前平台的稳定参考资料、五脚本专属后端，以及所有脚本共用的统一后端能力。

## 当前平台与脚本

| 平台目录 | 脚本 | 运行时 | 后端命名空间 |
|---|---|---|---|
| `data-baker-cvpc/` | 柳州话 | `extension/sites/data-baker-cvpc/liuzhou-helper/` | `/api/data-baker-cvpc/liuzhou-helper/*` |
| `bytedance-aidp/` | 苏州话 | `extension/sites/bytedance-aidp/suzhou-helper/` | `/api/bytedance-aidp/suzhou-helper/*` |
| `bytedance-aidp/` | 金华话（单次 Omni 可编辑转写 Prompt） | `extension/sites/bytedance-aidp/jinhua-helper/` | `/api/bytedance-aidp/jinhua-helper/*` |
| `bytedance-aidp/` | 台州话 | `extension/sites/bytedance-aidp/taizhou-helper/` | `/api/bytedance-aidp/taizhou-helper/*` |
| `magic-data/` | 杭州话 | `extension/sites/magic-data/hangzhou-helper/` | `/api/magic-data/hangzhou-helper/*` |

平台与脚本入口索引见 [docs/platforms-index.md](../docs/platforms-index.md)。

## 目录职责

平台根目录优先包含：

- `README.md`：平台当前能力、共用边界和阅读入口。
- `network/`：当前有效的稳定请求参考。
- `page-structure/`：当前有效的页面结构、选择器和挂载建议。
- `<script-id>/`：脚本专属资料、Prompt、词表、后端与差异说明。

脚本目录只保存脚本专属内容。平台多个脚本共同依赖的页面或请求资料放在平台根级目录，避免重复维护。

## 统一后端

- 启动入口：`backend/server.js`
- 应用组装：`backend/app.js`
- 路由注册：`backend/registry.js`
- 公共 AI：`backend/ai/`
- AI 框架：`backend/ai-framework/`
- 管理员会话、仪表盘、下载中心与 AI 日志：`backend/admin-*`、`backend/ai-call-log-download/`

`registry.js` 只注册五个脚本和当前管理员能力。脚本路由继续由各脚本 `backend/index.js` 导出 `registerRoutes(router, options)`，统一入口负责组合，不把脚本业务复制到公共后端。

## 请求数据流

```text
业务页面
  -> 扩展 content script / page-world observer
  -> 统一后端 /api/<platform>/<script>/*
  -> 脚本 backend
  -> 公共 AI dispatcher / provider / pricing / queue
  -> 脱敏响应与 AI 调用日志
  -> 扩展面板供人工确认
```

页面观察桥只采集完成当前功能所需的最小数据。cookie、authorization、完整签名 URL 和完整音频 URL 不进入前端持久化、文档或普通日志。

## 前后端边界

扩展负责：

- 页面识别、数据采集与 UI 展示。
- 调用后端并展示加载、成功、失败和空状态。
- 用户明确触发后的页面写入或下载。

后端负责：

- 模型调用、队列、超时、价格估算和响应归一化。
- 管理员鉴权、日志聚合、CSV 与下载接口。
- 业务词表读取、结构校验和无词表降级。

AI 建议默认不自动保存、不自动提交、不自动审核、不自动流转。具体例外必须同时满足项目规则和脚本 README 的明确契约。

## 资料阅读规则

1. 先阅读平台根 README。
2. 再阅读对应脚本 README。
3. 页面挂载问题查看 `page-structure/`。
4. 请求与写回问题查看 `network/`。
5. 模型与参数问题查看脚本后端和 [百炼官方文档入口](../docs/external-docs-aliyun-bailian.md)。

参考文档只保留当前有效结论；过程记录统一写入根 [log.md](../log.md)。

## 开发验证

```powershell
npm run test:backend
npm run test:extension
node platform-resources/backend/server.js
```

真实页面能力仍需在 Chrome / Edge 中加载 `extension/` 验收，Node 测试不能替代页面环境。
