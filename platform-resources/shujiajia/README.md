# 数加加平台资料

`shujiajia/` 保存数加加分段标注页当前有效的页面结构、Network 契约和泸州话整段识别后端。

## 当前状态

- 已注册扩展运行时、Popup、Options、Manifest 和统一后端路由，默认关闭。
- 首版只支持“零段落音频 → 整音频划为一段 → 两阶段识别 → 人工确认填入”。
- B 布局面板挂载在 `#bdIframe`：左栏为高频入口，识别结果在内层横向抽屉展开。
- 不自动设置有效性、不自动暂存、不自动提交。

## 目录入口

- [Network 契约](network/README.md)
- [页面结构](page-structure/README.md)
- [泸州话脚本契约](luzhou-helper/README.md)
- 运行时：`extension/sites/shujiajia/luzhou-helper/`

## 音频与安全边界

MAIN world 观察器只接收当前页面会话中响应类型为 `audio/*` 的字节，并在内存中转为 `audioDataUrl`。它不持久化、不记录、也不向后端发送原始资源 URL、签名参数、Cookie 或 Token。

音频真实 pathname 仍未固化为稳定契约。若刷新并播放后仍未捕获音频，运行时只提示人工重试，不根据 `dataName`、`dataPath` 或展示字段猜测地址。
