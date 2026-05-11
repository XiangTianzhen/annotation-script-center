# Magic Data ANNOTATOR 后续开发计划

## 当前判断

- 当前完成的是“前置采集与边界定义”，尚未进入扩展运行时代码接入。
- 平台具备典型 SPA + API 驱动结构，适合先做路由识别与只读观测。
- 已补充本地 AI 复核调试后端（独立于扩展前端），用于单条音频复核接口联调。
- 本阶段仍不触发任何平台写操作，保持“辅助建议 + 人工确认”口径。
- 已新增扩展前端页面内质检区接入（`#/asrmark`），支持手动触发 AI 质检与手动填入两行文本。
- 当前仍不接入自动保存、自动提交、自动审核、自动领取。

## 接入建议（分阶段）

### 阶段 1：平台识别与只读观测

- 建议先接入 popup/options 平台识别：是
- 建议先做页面状态面板：是
- 建议先做基础音频快捷键：否（先只读）
- 建议先接入 AI 推荐：否（待边界评审后）

目标：
- 识别 Magic Data 路由命中状态
- 输出当前页面类型（任务列表/详情/标注单条/审核单条）
- 只读采集请求摘要，不触发写操作

### 阶段 2：低风险提效能力（当前阶段）

- 进入 `asrmark` / `asrmarkCheck` 后提供只读辅助信息
- 可在用户主动触发下提供非提交型操作（如播放控制映射）
- 保持不保存、不提交、不审核
- 当前新增：`asrmark` 支持“用户点击后填入第一行/第二行”，仅触发输入框 `input/change`，不触发保存提交按钮。
- 当前新增：`asrmark` 主展示改为页面内质检区（表格下方），右下角仅保留小入口按钮。
- 当前新增：快捷键设置迁移到 options 的 Magic Data 专区（默认未设置），动作仅在用户主动按键时触发。
- 当前新增：AI 逻辑改为规则优先质检，平台文本为基准，听音仅作为辅助证据。

### 阶段 3：受控动作辅助（可选）

- 仅在用户每次确认后，辅助执行保存/提交/审核动作
- 每个动作都需要显式开关与二次确认
- 默认关闭

## manifest 与 content_scripts 规划（建议）

### host_permissions（建议）

- `https://work.magicdatatech.com/*`
- 音频仅随页面加载，不建议扩展主动跨域请求 OSS

### content_scripts（建议）

- 匹配：`https://work.magicdatatech.com/*`
- 入口分层：
  - 页面识别器（route detector）
  - 只读状态采集器（DOM + request summary）
  - 可选辅助控制器（默认关闭）

## 是否需要 MAIN world network observer

- 建议：需要（但第一版仅只读）
- 原因：关键数据通过 XHR/Fetch 返回，且部分页面内部状态不稳定，直接 DOM 读取不足。
- 已落地：`annotateDetailInfo` 响应通过 MAIN world observer 回传 ISOLATED 侧缓存，并支持同源读取兜底。

## MAIN world / ISOLATED world 通信命名建议

### source 建议

- `ASC_MAGIC_DATA_MAIN`
- `ASC_MAGIC_DATA_ISOLATED`

### type 建议

- `ASC_MAGIC_DATA_ROUTE_CHANGED`
- `ASC_MAGIC_DATA_REQUEST_SUMMARY`
- `ASC_MAGIC_DATA_AUDIO_META`
- `ASC_MAGIC_DATA_SENSITIVE_ACTION_DETECTED`
- `ASC_MAGIC_DATA_USER_CONFIRMED_ACTION`

## 后端接口建议

- 第一版 AI 调试接口已落地：
  - `GET /api/magic-data/annotator/ai/review-current/health`
  - `POST /api/magic-data/annotator/ai/review-current`
- 第一版不新增业务写接口。
- 后端只做复核建议，不做保存、提交、审核、领取。
- 禁止上传 token/cookie/完整签名 URL/原始敏感文本。

## 任务拆分建议

1. 路由识别与页面类型枚举
2. Network 只读摘要采集模块
3. DOM 关键区域定位模块（只读）
4. popup/options 增加 Magic Data 状态展示
5. 安全边界守卫（禁止动作白名单）
6. 真实页面灰度验证（人工）

## 验证建议

- 每个阶段都必须在真实页面验证：
  - 不触发写操作
  - 不泄露敏感信息
  - 在未命中页面时不执行
- 对“保存/提交/通过/驳回”按钮，只做识别，不做自动点击。
