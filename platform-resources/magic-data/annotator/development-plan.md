# Magic Data ANNOTATOR 后续开发计划

## 当前判断

- 前置采集与边界定义已完成，并已进入扩展运行时代码接入阶段。
- 平台具备典型 SPA + API 驱动结构，当前实现采用“页面识别 + 接口优先采集 + 页面内质检区”模式。

## 0.3.1 发布状态（已落地）

- 已接入扩展运行时代码：`extension/sites/magic-data/annotator/`。
- 已接入页面内质检区：`#/asrmark` 右侧“句子列表”下方固定卡片。
- 已接入后端接口：`GET/POST /api/magic-data/annotator/ai/review-current*`。
- 已接入 options 设置：听音模型、质检模型、启用思考、快捷键。
- 当前仍保持人工确认边界：不自动保存/提交/审核/领取。
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
- 当前新增：Magic Data options 设置改为卡片化入口（平台卡片/脚本卡片），详情默认折叠快捷键区，避免首页长表单直出。
- 当前新增：听音模型、质检模型采用“下拉 + 自定义模型名”保存机制。
- 当前新增：`enableThinking` 配置项下发到后端，provider 不支持时自动降级重试。
- 当前新增：快捷键动作统一执行焦点恢复（性别/年龄/填入/保存/提交），支持连续触发无需额外点击页面。
- 当前新增：页面内结果区优先固定挂载到右侧“句子列表”`.audio_list` 的 `.body_box` 后方；DOM 重绘后会自动回挂，不再优先挂到 `.region-list`。

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
