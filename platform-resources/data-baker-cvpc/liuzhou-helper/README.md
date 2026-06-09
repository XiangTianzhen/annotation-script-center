# DataBaker CVPC 柳州话脚本

## 定位

- 平台：`data-baker-cvpc`
- 脚本 ID：`dataBakerCvpcLiuzhouAssistant`
- 目标页：`https://cvpc.data-baker.com/app/editor/asr/`
- 当前阶段：`beta`

## 当前能力

- 当前音频上下文读取：
  - `project_id`
  - `task_id`
  - `process_id`
  - `data_id`
  - `job_id`
  - `annotation/meta`
  - `user/meta` 最小用户快照：`name / user_id`
  - `template.attrs / entry_attrs / moment_attrs`
  - 当前音频签名 URL：运行时优先从页内观察桥映射获取；页内桥会消费页面真实 `annotation/meta`、`user/meta` 响应，以及顶层页面或同源 `xaudio` iframe 的真实音频请求和初始化阶段控制台打印的音频 URL。若扩展自身直连 `annotation/meta` 因平台鉴权返回失败，会回退使用页内桥传入的运行时 meta；`user/meta` 桥接未命中时再同源直连 `GET /httpapi/user/meta`；音频地址缺失时继续回退到 DOM audio、Performance 与同源 iframe audio
- 当前页工具面板：
  - 助手区嵌入右侧 `全局标注` 卡片，保持原生 `Valid / Invalid` 在上方；右侧当前只保留状态、当前音频/当前段摘要和提示说明，并优先插入 `全局标注` 的 `.label_title_border2` 内容流；摘要当前改为逐行显示 `文件 / 来源 / 当前第 N 段 / 当前段时间`
  - `是否有效（Valid or Not）` 下方当前作为独立同级 AI 工作区，优先挂到承载字段块的 `div[data-v-fd55b986]` 内，并与各个 `padding-left: 10px` 字段块保持同级；集中承载：
    - `当前段 AI 推荐`
    - `未填写补 Valid`
    - `生成画段建议`
    - `应用当前建议`
    - 当前画段建议结果
  - 字段内结果区当前固定展示两张最终结果卡：
    - `修正后的柳州话文本` -> `填入标注文本`
    - `整理后的普通话文本` -> `填入普通话顺滑`
  - 两个定向填入动作当前都可在 options 页单独录制快捷键，默认不预置键位
  - `音频听出的柳州话文本 / 特殊标签 / 需人工复核 / 备注 / AI 返回原始内容` 继续留在独立 AI 区底部
  - 两张结果卡在无结果时不显示占位文案；有结果时改成“文本左、按钮右”的紧凑布局，并统一使用系统蓝主调强化样式
  - `当前段 AI 附加信息` 默认折叠，点击后再展开查看附加信息和完整原始返回 JSON
  - `未填写补 Valid / 应用当前建议` 当前改成橙色实底 background 按钮，避免白底低对比
  - 当前段 AI 推荐严格按当前波形选中段工作：实时读取 `.xaudio_time` 的 `开始 / 结束`，浏览器端只裁这一段音频
  - 浏览器端会把当前段片段转成 `16k` 单声道 WAV，并直接拼成 `audioDataUrl` 发给现有 AI 推荐接口；不再经过“本地文件转公网 URL”链路
  - 如果后续涉及整音频识别，仍继续使用页面真实公网 `audioUrl`
  - 请求前会校验 options 首页 `AI 调用使用人`；请求体默认补齐 `aiUsageOperatorName / platformUserName / platformUserId`
  - 当前段填入建议当前兼容页面 `contenteditable .ProseMirror`
  - 当前段设为 `Valid / Invalid` 前会先检查当前单选状态，已是目标值时不重复点击
  - 当前音频内“未填写段落补为有效”当前改为读取 `annotation/annos` 后按左侧编号逐段补写，只处理未填写段，不覆盖已填 `Invalid`
  - 基础设置提供两个独立提示屏蔽开关，默认都可分别屏蔽“您正在编辑该作业,不能打开新的Tab页”“系统进入暂停状态”
  - 页内观察桥当前只在同源 `xaudio` iframe 内包装 `console.log/info/debug` 捕获初始化音频 URL；顶层编辑页不再包装 `console.*`，避免把平台普通提示日志误挂到扩展堆栈
- options / AI 设置：
  - `dataBakerCvpcLiuzhouAssistant` 当前接入共享右侧 `AI 设置` 区的独立 CVPC 布局
  - 当前只保留 `基础设置`、`听音`、`文本修正` 三块
  - `听音` 模型：`qwen3.5-omni-plus`、`qwen3.5-omni-flash`
  - `文本修正` 模型：`qwen3.5-plus`、`qwen3.5-flash`
  - 不提供 compare-family、采纳阈值、前端并发设置
- 独立后端接口：
  - `GET /api/data-baker-cvpc/liuzhou-helper/segment/health`
  - `POST /api/data-baker-cvpc/liuzhou-helper/segment/preview`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
  - `POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`

## 规则资产

- 柳州话规则整理稿：`platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-rules.md`
- 柳州话业务词表运行时主文件：`platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-lexicon.json`
- 柳州话发音对照表参考源：`platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-pronunciation-reference.csv`

## AI 契约

- `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
  - 返回 `defaults.timeoutMs`
  - 返回 `defaults.stages.listen / refine`
  - 返回 `supportedModels.listen / refine`
- `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`
  - 返回与 defaults 对齐的 staged defaults、支持模型列表与运行时资料摘要
- `POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`
  - 输入：
    - 当前段识别优先发送 `audioDataUrl`
    - 整音频识别继续发送 `audioUrl`
    - 默认补齐 `platformUserName / platformUserId`
    - `aiStages.listen`
    - `aiStages.refine`
  - 输出：
    - `audioDialectText`
    - `refinedMandarinText`
    - `audioMandarinText`
    - `refinedDialectText`
    - legacy alias `dialectText = refinedDialectText`
    - legacy alias `mandarinText = refinedMandarinText`
    - `specialTags`
    - `needHumanReview`
    - `notes`
    - `timing`
    - `models`

## 两阶段后端链路

- `listen`
  - `qwen3.5-omni-plus / flash`：直接听音输出原始 `audioDialectText`
- `refine`
  - 先按业务词表 JSON 的 `display/normalized -> mandarin` 做最长匹配，生成普通话草稿
  - 输入 `audioDialectText`、普通话草稿、词表命中片段和页面上下文
  - 同时输出 `refinedDialectText + refinedMandarinText`

## AI 日志

- 当前 AI 调用已接入共享 CSV 记录链路，日志目录为 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/logs/`
- 系统管理 `AI 请求记录` 当前新增数据集：`DataBaker CVPC 柳州话助手 AI 调用记录`
- 导出 CSV 当前会把 `listen + refine` 两阶段 usage 汇总到表头 `输入Token / 输出Token / 总Token`，便于直接估算模型成本
- 每条调用默认补齐：
  - `AI 调用使用人`
  - `platformUserName = data.name`
  - `platformUserId = data.user_id`
  - `projectId / taskId / processId / dataId / jobId / fileName / entryIndex / selectionKey / segmentStartMs / segmentEndMs / listenModel / refineModel`
- 当前原始返回 JSON 会继续脱敏鉴权类 token / cookie / 签名信息，但 usage 里的 token 数量不再被打成 `<redacted>`
- 该数据集当前按 beta 可见性收口：未解锁 beta 时，系统管理里的 `AI 请求记录` 不显示这项；解锁 beta 后才会请求并显示

## 当前边界

- AI 建议只作辅助，不自动保存、不自动提交、不自动切下一条。
- `全局 Invalid` 不做自动判定。
- 批量范围固定为“当前音频 / 当前作业”，不跨整包遍历。
- 画段建议当前只提供“建议生成 + 人工确认”。
- 当前段 AI 推荐如果没有读到可信的当前段 `开始 / 结束`，会直接失败，不退回整段识别。
- 真实 `segment create/update`、保存链路和字段持久化请求当前仍未补采完成。

## 写入契约状态

- 已补齐：
  - `annotation/meta` 模板字段读取
  - 当前页 `Valid / Invalid` DOM 选择入口
  - 当前页 `annotation/annos` 段级统计读取
  - 当前页文本输入框 / `contenteditable .ProseMirror` 的实验性就地填入适配层
- 仍待真实补采：
  - 画段创建 / 更新的真实 payload
  - 保存接口
  - 当前段与页面字段的稳定写入契约
  - `attrs / entry_attrs / moment_attrs` 的完整写入映射

## 运行时目录

```text
extension/sites/data-baker-cvpc/liuzhou-helper/
  README.md
  content.js
  page-world/
    audio-observer.js
  data-api.js
  ai-recommendation.js
  segmentation-controller.js
  ui-panel.js
  shortcuts.js
```

## 后端目录

```text
platform-resources/data-baker-cvpc/liuzhou-helper/
  README.md
  backend/
    index.js
    ai-routes.js
    segment-routes.js
    ai-service.js
    segment-service.js
  ai/
    adapter.js
    assets/
      liuzhou-lexicon.json
      liuzhou-rules.md
      liuzhou-pronunciation-reference.csv
```
