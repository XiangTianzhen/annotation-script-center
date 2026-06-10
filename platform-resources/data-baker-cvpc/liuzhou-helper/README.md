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
  - `annotation/*` 请求最小鉴权头：`authorization / baker-terminal / baker-lang`
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
  - `当前段 AI 附加信息` 当前会额外展示 `listen / refine` 的输入 / 输出 / 总 token 汇总，便于页面内直接查看成本
  - 两张结果卡在无结果时不显示占位文案；有结果时改成“文本左、按钮右”的紧凑布局，并统一使用系统蓝主调强化样式
  - `当前段 AI 附加信息` 默认折叠，点击后再展开查看附加信息和完整原始返回 JSON
  - `未填写补 Valid / 应用当前建议` 当前改成橙色实底 background 按钮，避免白底低对比
  - 画段建议当前改成“前端只传 URL + 阈值，后端直接整音频分析”：
    - 前端请求体当前主链路只发送 `audioUrl` 与 `rules.silenceThresholdDbfs/minSilenceMs/contextPaddingMs`
    - 后端会直接下载 mp3，并通过 Python `miniaudio` 解码
    - 后端固定按 `30ms` 窗口、轻量平滑、`<=0.18s` 短尖峰桥接、连续 `0.4s` 静音、前后补 `0.1s` 生成整条音频 `proposedSegments`
    - 当前返回结果固定是后端整音频重切预览；前端不会按它自动重画整页波形
    - 前端空预览当前会额外提示“后端未检出静音”或“命中了静音但拆分后仍不足 2 段”
  - `应用当前建议` 当前优先走平台保存接口：
    - 先消费页内观察桥缓存的最小鉴权头
    - 再重新读取最新 `annotation/annos`
    - 按当前 preview 构造 `POST /httpapi/annotation/save_increment` 的 `update / insert / web_snapshot`
    - 直写成功后，本次建议已直接进入平台保存链路，无需再点平台 `保存`
    - 如果缺少鉴权快照或直写失败，且当前 preview 仍是增量补切结果，则回退进入同源 `xaudio` iframe，复用页面原生 region / handle / `开启拆分` 交互把建议段画回当前波形；这时仍需人工点击平台 `保存`
    - 当前整音频预览不会回退 DOM 重画；直写失败时保持 fail closed
  - 当前段 AI 推荐严格按当前波形选中段工作：实时读取 `.xaudio_time` 的 `开始 / 结束`，浏览器端只裁这一段音频
  - 浏览器端会把当前段片段转成 `16k` 单声道 WAV，并直接拼成 `audioDataUrl` 发给现有 AI 推荐接口；不再经过“本地文件转公网 URL”链路
  - 如果后续涉及整音频识别，仍继续使用页面真实公网 `audioUrl`
  - `listen` 当前固定回到“纯听音”职责：默认不再注入规则摘要、段时间、页面字段上下文或选中条目信息
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
  - `听音` 当前新增持久开关 `附带词表参考（听音辅助）`，默认 `false`
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
- 当前运行时只维护一份主词表：`柳州话 -> 普通话`。如果后续需要 `普通话 -> 柳州话` 反查，默认应从这份主词表派生，不再人工并行维护第二份平行词表。
- 如果 `liuzhou-lexicon.json` 暂时缺失但本地 `liuzhou-pronunciation-reference.csv` 仍存在，页面会在右下角弹出一次“没有字词对应表”提示，停留约 1 秒后自动消失；AI 推荐继续按无词表模式正常返回，不会把 CSV 重新当成运行时主词表。

## AI 契约

- `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
  - 返回 `defaults.timeoutMs`
  - 返回 `defaults.stages.listen / refine`
  - `defaults.stages.listen.includeLexiconReference` 默认返回 `false`
  - 返回 `supportedModels.listen / refine`
- `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`
  - 返回与 defaults 对齐的 staged defaults、支持模型列表与运行时资料摘要
- `POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`
  - 输入：
    - 当前段识别优先发送 `audioDataUrl`
    - 整音频识别继续发送 `audioUrl`
    - 默认补齐 `platformUserName / platformUserId`
    - `aiStages.listen`
    - `aiStages.listen.includeLexiconReference?: boolean`
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

## 画段契约

- `GET /api/data-baker-cvpc/liuzhou-helper/segment/health`
  - 返回默认静音规则
  - 返回 `supportedScopes.default = existing-segments-incremental`
  - 返回 `supportedScopes.values = [existing-segments-incremental, whole-audio-rebuild-preview]`
  - 返回 `supportedScopes.previewOnly = [whole-audio-rebuild-preview]`
- `POST /api/data-baker-cvpc/liuzhou-helper/segment/preview`
  - 输入：
    - 当前主链路只要求 `audioUrl`
    - `rules.silenceThresholdDbfs`
    - 固定规则 `rules.minSilenceMs = 400`、`rules.contextPaddingMs = 100`
    - 如需兼容旧增量链路，仍可选传 `existingSegments[] / silentRanges[] / segmentScope`
  - 输出：
    - `data.proposedSegments`
    - `data.changes`
    - `meta.previewMode = incremental | whole-audio-fallback`
    - `meta.applyAllowed`
    - `meta.emptyReason = no-silence | no-internal-hit | insufficient-split`
    - `meta.analysisSource = backend-python-audio-url`
    - `meta.analysisMeta`
  - 当前前端主链路默认走后端整音频预览；`whole-audio-rebuild-preview` 与“无现有段请求”的自动整音频模式都不会直接参与页面 DOM 自动画段，但用户点击 `应用当前建议` 时仍会先尝试直写平台 `save_increment`

## 两阶段后端链路

- `listen`
  - `qwen3.5-omni-plus / flash`：直接听音输出原始 `audioDialectText`
  - 默认只根据当前段音频输出，不输出普通话，不做文本修正
  - 仅在 `aiStages.listen.includeLexiconReference=true` 时附带词表参考片段
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
- 系统管理 `AI 请求记录` 的开始 / 结束日期当前默认留空；留空表示导出该脚本当前可见的全部日期范围

## 当前边界

- AI 建议只作辅助，不自动保存、不自动提交、不自动切下一条。
- `全局 Invalid` 不做自动判定。
- 批量范围固定为“当前音频 / 当前作业”，不跨整包遍历。
- 画段建议当前支持“建议生成 -> 优先直写平台保存接口 -> 增量场景 DOM 回退兜底”。
- 当前后端整音频预览不会自动重画整页波形；直写失败时保持 fail closed。
- 当前不会在缺少页面真实鉴权快照时伪造 `save_increment`，也不会自动点击平台 `保存`。
- 当前段 AI 推荐如果没有读到可信的当前段 `开始 / 结束`，会直接失败，不退回整段识别。
- 只有用户主动点击 `应用当前建议` 时，运行时才会尝试直连平台保存接口；未触发时不自动保存。

## 写入契约状态

- 已补齐：
  - `annotation/meta` 模板字段读取
  - `annotation/*` 最小鉴权头观察桥
  - `save_increment` 最小请求体构造与发送
  - 当前页 `Valid / Invalid` DOM 选择入口
  - 当前页 `annotation/annos` 段级统计读取
  - 当前页文本输入框 / `contenteditable .ProseMirror` 的实验性就地填入适配层
  - 同源 `xaudio` iframe 内 live region 读取、handle 调整和原生拆分交互
- 仍待真实补采：
  - 更多模板变体下 `attrs / entry_attrs / moment_attrs` 的完整写入映射
  - 删除段与复杂重排场景的保存契约
  - 整页波形重画的安全回退契约

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
    segment-audio-python.js
    segment-service.js
    python/
      segment_audio_client.py
  ai/
    adapter.js
    assets/
      liuzhou-lexicon.json
      liuzhou-rules.md
      liuzhou-pronunciation-reference.csv
```
