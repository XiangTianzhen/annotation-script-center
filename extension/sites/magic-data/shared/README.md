# Magic Data 平台共享运行时

`shared/` 只保存杭州话运行时依赖的平台通用页面识别、数据采集和只读 Network 观察能力，不包含脚本专属 AI、面板或快捷键业务。

## 模块

### `page-detector.js`

- 识别 Magic Data 当前 hash 路由和页面类型。
- 为 content runtime 提供稳定的挂载前置判断。
- 不执行数据写入或页面跳转。

### `data-collector.js`

- 聚合 Network observer 缓存与当前 DOM 信息。
- 优先使用已捕获的稳定快照，必要时回退页面可读字段。
- 只返回杭州话质检所需的当前条数据。
- 在页面切题或快照不一致时避免使用过期上下文。

### `page-world/network-observer.js`

- 在 MAIN world、`document_start` 阶段注入。
- 只读观察页面真实请求和响应，不主动发起业务写请求。
- 通过页面消息把脱敏快照发送到隔离世界。
- 同一页面只安装一次，避免重复包装请求 API。

## 边界

- shared 不导入杭州话 Prompt、模型设置或后端路由。
- shared 不实现自动保存、自动提交、自动审核、自动领取或自动流转。
- shared 不持久化 cookie、authorization、完整签名 URL 或完整音频 URL。
- 脚本专属代码统一位于 `../hangzhou-helper/`。

## 消费者

当前唯一消费者是 [杭州话脚本](../hangzhou-helper/README.md)。若未来增加平台共用能力，必须先确认确实被多个当前脚本复用，不能把单脚本逻辑提前放入 shared。
