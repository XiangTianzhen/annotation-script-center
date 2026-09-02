# 数加加平台资料

`shujiajia/` 保存数加加分段标注页当前有效的页面结构、Network 契约和泸州话整段识别后端。

## 当前状态

- 已注册扩展运行时、Popup、Options、Manifest 和统一后端路由，默认关闭。
- 首版只支持“零段落音频 → 整音频划为一段 → 两阶段识别 → 人工确认填入”。
- 助手挂载在 `#bdIframe` 的 `body`：右下角为悬浮入口，识别结果从右侧抽屉展开，不进入或修改平台 `.form-tabs` 布局。
- 不自动设置有效性、不自动暂存、不自动提交。

## 目录入口

- [Network 契约](network/README.md)
- [页面结构](page-structure/README.md)
- [泸州话脚本契约](luzhou-helper/README.md)
- 运行时：`extension/sites/shujiajia/luzhou-helper/`

## 音频与安全边界

MAIN world 观察器从当前 `GET /web-task-alone-api/task/piece/execute` 响应的 `data.detail.fileFolder` 读取已确认的完整音频地址，并兼容被动接收当前会话中的音频响应字节。只接受 `https://storage.shujiajia.com/`，请求使用 `credentials: "omit"` 和 `referrerPolicy: "no-referrer"`，结果在内存中转为 `audioDataUrl`。

原始资源 URL、签名参数、Cookie、Token 和 `audioDataUrl` 均不持久化、不记录；跨题请求会中止或丢弃。若该字段缺失、来源不合法、超过 10MB 或资源请求失败，运行时保持未捕获状态，不根据其他展示字段猜测地址。
