# 数加加平台资料

`shujiajia/` 保存数加加分段标注页当前有效的页面结构、Network 契约和泸州话整段识别后端。

## 当前状态

- 已注册扩展运行时、Popup、Options、Manifest 和统一后端路由，默认关闭。
- 支持“零段落音频 → 整音频划为一段 → 两阶段识别 → 人工确认填入”，并可选在首次条目之后的切题中自动划整段、在助手画段成功后自动识别；两个开关默认关闭。
- 助手在零段与已有段落状态均显示：优先挂载 `.tabs-container` 与 `.transfer`，节点缺失时使用稳定父级和扩展专属占位区，正式节点出现后自动迁回；结果区常驻且不移动或覆盖平台节点。
- 自动识别只展示结果；不自动填入、不自动设置有效性、不自动暂存、不自动提交。

## 目录入口

- [Network 契约](network/README.md)
- [页面结构](page-structure/README.md)
- [泸州话脚本契约](luzhou-helper/README.md)
- 运行时：`extension/sites/shujiajia/luzhou-helper/`

## 音频与安全边界

MAIN world 观察器从当前 `GET /web-task-alone-api/task/piece/execute` 请求查询参数读取 `taskId`，从响应 `data.detail` 读取 `dataId` 与 `fileFolder`，再获取已确认存储域名的音频；同时兼容被动接收当前会话中的音频响应字节。若响应早于脚本设置加载完成，只在页面内存暂存最近一次最小快照，启用后立即消费，禁用或切题时清除，不主动重放 execute 请求。请求使用 `credentials: "omit"` 和 `referrerPolicy: "no-referrer"`，结果在内存中转为 `audioDataUrl`。

原始资源 URL、签名参数、Cookie、Token 和 `audioDataUrl` 均不持久化、不记录；跨题请求会中止或丢弃。若条目身份缺失、来源不合法、格式不支持、超过 10MB 或资源请求失败，运行时只显示对应脱敏状态，不根据其他展示字段猜测地址。
