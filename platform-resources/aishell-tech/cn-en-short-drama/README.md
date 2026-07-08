# Aishell Tech 中英短剧脚本资料

## 目录职责

- `README.md`：脚本资料入口、当前状态与边界说明。
- `page-structure/README.md`：中英短剧脚本专属页面结构稳定参考。

## 当前状态

- 当前脚本显示名为 `中英短剧脚本`，slug 为 `cn-en-short-drama`。
- 当前阶段为“正式脚本预留”。
- 本轮只完成资料初始化与页面结构补采：
  - 未创建 `extension/sites/aishell-tech/cn-en-short-drama/`
  - 未新增独立后端接口
  - 未新增 `scriptId`、manifest 接线或 options 配置入口

## 当前口径

- 当前脚本继续共享 Aishell Tech 平台路由：`/mytask/mark?taskId=<taskId>&packageId=<packageId>`。
- 当前已确认它不是现有共享 `04-mytask-mark.md` 覆盖的单文本 `mark-area` 短标注模板，而是脚本专属的“整段标注 + 多维评分”变体：
  - `floating-mark-area.is-docked`
  - `.floating-mark`
  - `.mark-form-content`
  - `.mark-form`
- 当前页已确认的关键结构包括：
  - 双通道波形工作区
  - 左侧条目列表状态
  - 6 个必填评分 `textarea`
  - `设置为无效`
  - `查看历史标注记录`
  - `保存整段`
  - `完成标注`
- 本轮只沉淀脚本专属结构差异，不把这套模板上提为 Aishell 平台共用参考。

## 当前接口与边界

- 当前脚本暂未补采脚本专属 Network 参考；平台共用初始化与公共请求结构继续以：
  - `platform-resources/aishell-tech/network/README.md`
  - `platform-resources/aishell-tech/network/04-mytask-mark.md`
  为准。
- 当前资料只确认页面结构与写操作边界，不预设：
  - 自动保存
  - 自动提交
  - 自动完成标注
  - 自动设置无效
- `保存整段`、`完成标注`、`设置为无效` 当前统一视为人工触发写操作，后续如需接入，需先补独立 Network 采集。

## 安全边界

- 不记录真实账号、token、cookie、authorization、完整签名 URL 或真实标注内容。
- 仅保留脱敏后的结构结论、稳定锚点和页面边界说明。
- 后续真正接入运行时代码前，不伪造 runtime 目录、后端实现或保存接口契约。
