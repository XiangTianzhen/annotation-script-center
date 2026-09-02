# 平台与脚本索引

当前维护四个已接入平台、六个正式脚本。

## DataBaker CVPC

- 运行时：`extension/sites/data-baker-cvpc/liuzhou-helper/`
- 平台资料：`platform-resources/data-baker-cvpc/README.md`
- 柳州话资料与后端：`platform-resources/data-baker-cvpc/liuzhou-helper/README.md`

## ByteDance AIDP

- 共用观察器：`extension/sites/bytedance-aidp/shared/page-world/network-observer.js`
- 苏州话运行时：`extension/sites/bytedance-aidp/suzhou-helper/`
- 金华话运行时：`extension/sites/bytedance-aidp/jinhua-helper/`（单次 Qwen Omni 可编辑转写 Prompt，返回 `listenText`）
- 台州话运行时：`extension/sites/bytedance-aidp/taizhou-helper/`
- 平台资料：`platform-resources/bytedance-aidp/README.md`
- 苏州话资料：`platform-resources/bytedance-aidp/suzhou-helper/README.md`
- 金华话资料：`platform-resources/bytedance-aidp/jinhua-helper/README.md`
- 台州话资料：`platform-resources/bytedance-aidp/taizhou-helper/README.md`

苏州话、金华话与台州话脚本同平台互斥启用。
台州话另已在 `mark-v3` 与两类检查包接入完整题目录音导入、结果只读回显和用户显式启动的原生押后；导入优先使用同题 Search Item，检查包缺失时回退同题 GetWorkItem/Receive。除受控押后外不写回 AIDP，不开放暂存、提交或领取。

台州话返修另支持 `node/14/revise` 当前页最多 10 条串行导入，以及 `modify-v2/4/{itemId}` 单题添加、结果刷新和用户手动换行追加 `COMPLETED` 审核文本。返修严格按 ItemID 对题，不自动押后、暂存、审核或切题。

## Magic Data

- 杭州话运行时：`extension/sites/magic-data/hangzhou-helper/`
- 共用页面识别、采集和 Network observer：`extension/sites/magic-data/shared/`
- 稳定 Network：`platform-resources/magic-data/network/`
- 稳定页面结构：`platform-resources/magic-data/page-structure/`
- 杭州话资料与后端：`platform-resources/magic-data/hangzhou-helper/README.md`

## 数加加

- 平台资料：`platform-resources/shujiajia/README.md`
- 稳定 Network：`platform-resources/shujiajia/network/`
- 稳定页面结构：`platform-resources/shujiajia/page-structure/`
- 泸州话脚本边界：`platform-resources/shujiajia/luzhou-helper/README.md`
- 泸州话运行时：`extension/sites/shujiajia/luzhou-helper/`
  - 当前状态：已接入 Peaks.js 零分段可信整段划分、execute 延迟启用快照音频获取、两阶段识别、人工填入、原生区域内嵌面板及两项 AI 快捷键；整段按两像素验收且不自动删除，有效性、保存和提交使用平台原生操作，不自动暂存或提交。

## 统一后端

- 入口：`platform-resources/backend/server.js`
- 契约：`platform-resources/backend/README.md`
- 后端注册柳州、苏州、金华、台州、杭州、泸州六脚本路由，以及管理员会话、下载中心和 AI 日志接口。
