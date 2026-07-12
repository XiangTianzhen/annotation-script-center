# Magic Data 平台资料

本目录维护 Magic Data 杭州话脚本所需的稳定页面结构、Network 参考和脚本专属后端资料。

## 当前入口

| 内容 | 路径 |
|---|---|
| 扩展运行时 | `extension/sites/magic-data/hangzhou-helper/` |
| 平台共享运行时 | `extension/sites/magic-data/shared/` |
| 杭州话资料与后端 | `hangzhou-helper/` |
| 稳定 Network 参考 | `network/` |
| 稳定页面结构 | `page-structure/` |

## 页面范围

平台参考覆盖欢迎页、任务列表、标注详情、质检任务，以及杭州话当前使用的：

- `#/asrmark`
- `#/asrmarkCheck`

阅读顺序：

1. 先读本页。
2. 处理杭州话业务时读 [hangzhou-helper/README.md](hangzhou-helper/README.md)。
3. 请求问题读 [network/README.md](network/README.md)。
4. DOM 与挂载问题读 [page-structure/README.md](page-structure/README.md)。

## 运行时关系

```text
平台 Network / DOM
  -> extension/sites/magic-data/shared
  -> extension/sites/magic-data/hangzhou-helper
  -> /api/magic-data/hangzhou-helper/*
  -> hangzhou-helper/backend
```

平台共享资料只服务杭州话当前依赖的页面识别、数据采集和 Network observer。脚本专属 Prompt、响应 schema、词表、日志和路由位于 `hangzhou-helper/backend/`。

## 写操作边界

- 页面结构与 Network 文档只记录当前有效、脱敏的请求结构。
- 不记录 cookie、authorization、完整签名 URL、完整音频 URL 或真实客户数据。
- AI 默认只提供辅助建议。
- 当前页临时全自动由用户显式启动，并只通过页面真实按钮执行。
- 不绕过页面原生 `disabled` / `readonly`。

## 维护要求

页面结构变化时先更新稳定参考，再修改运行时选择器。接口变化时同步核对扩展调用、后端路由、测试和杭州话 README，避免只修改单侧契约。
