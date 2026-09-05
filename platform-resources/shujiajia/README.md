# 数加加平台资料

`shujiajia/` 保存数加加分段标注页当前有效的页面结构、Network 契约和泸州话单阶段识别后端。

## 当前状态

- 已注册扩展运行时、Popup、Options、Manifest 和统一后端路由，默认关闭。
- 识别不要求先把零段落音频划为整段，零段、单段和多段均可直接执行一次 Omni 泸州方言识别；整音频划一段仍作为独立可选动作，并可配置切题自动划段与画段后自动识别，两个开关默认关闭。
- 默认自动填入只作用于恰好一个可编辑段落；人工填入只写入唯一选中行。两个 OVERLAP 快捷键调用平台 `Category1（多选）` 原生控件，不直接拼接文本。
- 助手在零段与已有段落状态均显示：优先挂载 `.tabs-container` 与 `.transfer`，节点缺失时使用稳定父级和扩展专属占位区，正式节点出现后自动迁回；结果区常驻且不移动或覆盖平台节点。
- 识别成功后默认自动填入，用户可关闭；不自动设置有效性、不自动暂存、不自动提交。
- MAIN world 网络观察保持平台原生 `XMLHttpRequest.prototype.send` 不变，只通过 `open` 和生命周期事件读取 execute、tempsave 与音频响应；无关平台 XHR 不进入扩展业务处理。

## 目录入口

- [Network 契约](network/README.md)
- [页面结构](page-structure/README.md)
- [泸州话脚本契约](luzhou-helper/README.md)
- 运行时：`extension/sites/shujiajia/luzhou-helper/`

## 音频与安全边界

MAIN world 观察器从当前 `GET /web-task-alone-api/task/piece/execute` 请求查询参数读取 `taskId`，从响应 `data.detail` 读取 `dataId` 与 `fileFolder`，再获取已确认存储域名的音频；同时兼容被动接收当前会话中的音频响应字节。XHR 元数据仅保存在私有 `WeakMap`，`loadstart` 绑定请求开始时的条目上下文，复用同一 XHR 实例也不会重复注册监听器。若响应早于脚本设置加载完成，只在页面内存暂存最近一次最小快照，启用后立即消费，禁用或切题时清除，不主动重放 execute 请求。请求使用 `credentials: "omit"` 和 `referrerPolicy: "no-referrer"`，结果在内存中转为 `audioDataUrl`。

原始资源 URL、签名参数、Cookie、Token 和 `audioDataUrl` 均不持久化、不记录；跨题请求会中止或丢弃。若条目身份缺失、来源不合法、格式不支持、超过 10MB 或资源请求失败，运行时只显示对应脱敏状态，不根据其他展示字段猜测地址。
