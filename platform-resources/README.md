# 平台资料与统一后端

当前目录只保留三个平台、四个正式脚本：

- `data-baker-cvpc/`：柳州话脚本资料、词表和后端。
- `bytedance-aidp/`：苏州话、金华话脚本资料与后端。
- `magic-data/`：杭州话脚本，以及仍有效的共用 Network / Page Structure 资料。
- `backend/`：统一后端公共模块与注册入口。

统一后端入口为 `platform-resources/backend/server.js`。脚本专属路由仍位于各脚本 `backend/`，由 `platform-resources/backend/registry.js` 统一注册。

## 边界

- 扩展只负责采集、展示、调用接口和人工触发写入。
- 后端负责模型调用、日志、管理员鉴权和下载。
- AI 建议不自动保存、不自动提交、不自动切题。
- 页面结构与 Network 资料只保留当前有效稳定结论。

具体入口见 `docs/platforms-index.md`。
