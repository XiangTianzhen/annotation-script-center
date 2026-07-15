# 平台与脚本索引

当前只维护三个平台、五个正式脚本。

## DataBaker CVPC

- 运行时：`extension/sites/data-baker-cvpc/liuzhou-helper/`
- 平台资料：`platform-resources/data-baker-cvpc/README.md`
- 柳州话资料与后端：`platform-resources/data-baker-cvpc/liuzhou-helper/README.md`

## ByteDance AIDP

- 共用观察器：`extension/sites/bytedance-aidp/shared/page-world/network-observer.js`
- 苏州话运行时：`extension/sites/bytedance-aidp/suzhou-helper/`
- 金华话运行时：`extension/sites/bytedance-aidp/jinhua-helper/`（单次 Qwen Omni 原始 `listenText` 直填）
- 台州话运行时：`extension/sites/bytedance-aidp/taizhou-helper/`
- 平台资料：`platform-resources/bytedance-aidp/README.md`
- 苏州话资料：`platform-resources/bytedance-aidp/suzhou-helper/README.md`
- 金华话资料：`platform-resources/bytedance-aidp/jinhua-helper/README.md`
- 台州话资料：`platform-resources/bytedance-aidp/taizhou-helper/README.md`

苏州话、金华话与台州话脚本同平台互斥启用。

## Magic Data

- 杭州话运行时：`extension/sites/magic-data/hangzhou-helper/`
- 共用页面识别、采集和 Network observer：`extension/sites/magic-data/shared/`
- 稳定 Network：`platform-resources/magic-data/network/`
- 稳定页面结构：`platform-resources/magic-data/page-structure/`
- 杭州话资料与后端：`platform-resources/magic-data/hangzhou-helper/README.md`

## 统一后端

- 入口：`platform-resources/backend/server.js`
- 契约：`platform-resources/backend/README.md`
- 后端只注册柳州、苏州、金华、台州、杭州五脚本路由，以及管理员会话、下载中心和 AI 日志接口。
