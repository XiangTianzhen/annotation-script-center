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
  - 当右侧 `.label_title_border2` 同时容纳 `柳州话脚本 Beta` 与中间 `AI 区` 所在字段分组时，当前会把 `Beta` 卡稳定排到 `AI 区` 上方
  - `是否有效（Valid or Not）` 下方当前作为独立同级 `柳州话 AI 识别助手`，优先挂到承载字段块的 `div[data-v-fd55b986]` 内，并与各个 `padding-left: 10px` 字段块保持同级；固定按 `当前段识别 / 批量识别 / 分段建议 / AI信息` 4 个分区展示
  - 中间 AI 区当前新增页内开关 `生成后自动应用分段建议`，默认开启；只有用户手动点击 `生成分段建议` 后才会触发，自动应用失败时会保留当前 preview，不自动刷新页面
  - 字段内结果区当前固定展示两张最终结果卡：
    - `修正后的柳州话文本` -> `填入标注文本`
    - `整理后的普通话文本` -> `填入普通话顺滑`
  - `标注文本` 当前作为唯一带标签字段，只联动 6 个有效标签：`#um / #hmm / #ah / #eh / <SPK/> / <NPS/>`
  - `普通话顺滑` 当前始终保持纯文本，不写任何标签
  - 后端当前会对高置信文本做保守标签归一化：独立 `呃 / 诶 / 欸 -> #eh`、独立 `啊 -> #ah`、独立 `嗯 -> #um`、重复笑声 `呵呵 / 哈哈 / 嘿嘿 / 嘻嘻` 一类主说话人非语义声音 -> `<SPK/>`
  - `#hmm` 与 `<NPS/>` 当前仍只接受模型显式输出，不从纯文本自动猜测
  - `普通话顺滑` 当前会保留与 `#eh / #ah / #um / #hmm` 对应的纯文本语气词，但不会保留 `<SPK/> / <NPS/>` 字面占位，也不会保留笑声文本
  - 若最终建议只剩单独语气词标签 `#um / #hmm / #ah / #eh` 与标点，当前段定向填入、整卡填入和批量写回都会改写为 `Invalid + <Meaningless> + 空普通话顺滑` 预设：`标注文本` 写结构化 `<Meaningless>`，`普通话顺滑` 清空
  - 柳州话字段当前直接写平台 tiptap 结构：文本片段用 `{type:"text"}`，标签片段用 `{type:"single",id,content}`
  - 结构化标签写入前会裁掉标签前后的多余半角空格，避免出现 `#ah 他又...` 这类 chip 后残留空格
  - 当前段定向填入、整卡填入和批量 `save_increment` 写回都会直接生成该结构，不再依赖页面“标签常用语”按钮回放
  - 当前段带标签填入后，运行时会按 `modelvalue` 追加一次有限次可视自愈；若页面下一次 tiptap 重绘把 chip 临时清空，会自动恢复显示
  - 两个定向填入动作当前都可在 options 页单独录制快捷键，默认不预置键位
  - 当前额外支持 9 个页面标签按钮快捷键：`<SPK/> / <NPS/> / #um / #hmm / #ah / #eh / <Unintelligible> / <Meaningless> / <Silence>`
  - 这 9 个标签快捷键当前统一走页面真实 `common_label_show` 按钮点击；按钮 disabled 时直接失败，不绕过平台限制，也不直接向文本字段硬写标签
  - 中间 AI 区当前新增 `批量识别并自动填入`（v1）：
    - 默认显示 `全部 + 段号选择框`
    - 默认全选当前音频全部段；支持点击单段和拖动连续选择
    - 启动时锁定当前 `entry + audioUrl + annotation/annos` 快照，只处理当前音频
    - 批量开始按钮当前复用 `当前段 AI 推荐` 同款橙色 accent 样式
    - 前端固定并发 `5`、固定错峰 `50ms`，允许 AI 结果乱序返回
    - `批量识别状态` 当前会直接显示固定并发数
    - 整批结束后只把成功段构造成文本版 `save_increment` 写回平台；保存成功后自动刷新当前页一次
    - `停止批量` 只阻止新请求继续发起，已在途请求允许收尾；最终仍只保存成功段
    - 写回前当前只校验 live `selectedEntryName`，并在识别当前文件名时避开左侧 `音频列表` 内的 `.mp3` 文本，减少“当前页面分段状态已变化”误报
    - 最终写回当前按成功段逐段对齐 latest rows：优先对齐 `uniqueId`，对不上时回退按锁定的 `selectionKey(start/end)` 近似匹配；不再要求 latest `annotation/annos` 全量 `unique_id` 列表完全一致
    - 目标段缺少文本 attr 时，当前会复用同音频其他段或模板里的 `标注文本 / 普通话顺滑` 字段定义补齐后再写回
    - 如果当前音频所有段都还没填过这两个文本字段，当前会回退使用脚本已知的文本字段 `unique_id` 兜底写回
    - Network 里旧版若看到多条相同 `GET /httpapi/annotation/annos`，它们属于分段状态读取，不是多次 `save_increment`
  - `音频听出的柳州话文本 / 柳州话修正参考 / 普通话顺滑参考 / 近音候选参考 / 特殊标签 / 需人工复核 / 备注 / AI 返回原始内容` 继续留在独立 AI 区底部
  - `AI信息` 当前默认折叠但始终保留结构，点击 `展开查看 AI 信息` 后再展开查看附加信息和完整原始返回 JSON；即使模型输出 JSON 解析失败，这个区块也会保留
  - `AI信息` 当前固定顺序展示 `听音识别 / 文本修正 / 音频听出的柳州话文本 / 柳州话修正参考 / 普通话顺滑参考 / 近音候选参考 / 特殊标签 / 需人工复核 / 备注 / AI 返回原始内容`
  - `AI 返回原始内容` 当前优先展示后端返回的 `debug/raw` 字段；成功态若没有单独返回 raw/debug，则回退展示当前结果对象的安全 JSON
  - `AI信息` 的两段阶段信息当前只显示 `模型 / 输入 / 输出`，不再展示 `总输入 / 总输出 / 总计`
  - 当模型结构化 JSON 解析失败但原始返回仍有可读文本时，后端当前会保守兜底出 `柳州话修正参考 / 普通话顺滑参考`，并强制 `needHumanReview=true`，便于直接复制后人工确认
  - 听音阶段当前会额外返回最多 `3` 条近音候选；文本修正阶段会结合页面上下文、JSON 主词表和参考 CSV 的释义/读音做保守纠正。若仍有歧义，`AI信息` 会追加 `近音候选参考`，并强制 `needHumanReview=true`
  - 后端返回 `audioDialectTokens / refinedDialectTokens` 时，`AI信息` 与字段结果卡当前会优先按 chip 渲染柳州话标签；token 缺失时再回退旧字符串展示
  - 两张结果卡在无结果时不显示占位文案；有结果时改成“文本左、按钮右”的紧凑布局，并统一使用系统蓝主调强化样式
  - `未填写补 Valid / 应用分段建议` 当前改成橙色实底 background 按钮，避免白底低对比
  - 分段建议当前改成“前端只传 URL + 阈值，后端直接整音频分析”：
    - 前端请求体当前主链路只发送 `audioUrl` 与 `rules.silenceThresholdDbfs/minSilenceMs/contextPaddingMs`
    - 后端会直接下载 mp3，并通过 Python `miniaudio` 解码
    - 后端固定按 `30ms` 窗口、轻量平滑、`<=0.18s` 短尖峰桥接、连续 `0.4s` 静音和可配置前后补偿生成整条音频 `proposedSegments`
    - 前后补偿时长当前开放到 options `基础设置 -> 前后补偿时长`，默认 `0.2s`，可调范围 `0 ~ 1.5s`
    - 当前返回结果固定是后端整音频重切预览；前端不会按它自动重画整页波形
    - 前端空预览当前会额外提示“后端未检出静音”或“命中了静音但拆分后仍不足 2 段”
  - `应用分段建议` 当前优先走平台保存接口：
    - 先消费页内观察桥缓存的最小鉴权头
    - 再重新读取最新 `annotation/annos`
    - 按当前 preview 构造 `POST /httpapi/annotation/save_increment` 的 `update / insert / web_snapshot`
    - 新插入段 `unique_id` 当前改为 `crypto.getRandomValues + timestamp` 生成；直写前会对本次 `insert/update` 与 `web_snapshot` 各自做去重预检
    - 如果本地构造出的保存体里出现重复 `unique_id`，会直接停止自动应用并保留建议，提示重新生成或人工处理
    - 直写成功后，本次建议已直接进入平台保存链路，无需再点平台 `保存`
    - 如果平台仍返回 `unique_id重复`，当前不会回退 DOM 画段，会保留 preview 供人工处理
    - 如果缺少鉴权快照或直写失败，且当前 preview 仍是增量补切结果，则回退进入同源 `xaudio` iframe，复用页面原生 region / handle / `开启拆分` 交互把建议段画回当前波形；这时仍需人工点击平台 `保存`
    - 当前整音频预览不会回退 DOM 重画；直写失败时保持 fail closed
  - 当前段 AI 推荐严格按当前波形选中段工作：实时读取 `.xaudio_time` 的 `开始 / 结束`，浏览器端只裁这一段音频
  - 浏览器端会把当前段片段转成 `16k` 单声道 WAV，并直接拼成 `audioDataUrl` 发给现有 AI 推荐接口；不再经过“本地文件转公网 URL”链路
  - 如果后续涉及整音频识别，仍继续使用页面真实公网 `audioUrl`
  - `listen` 当前固定回到“纯听音”职责：默认不再注入规则摘要、段时间、页面字段上下文或选中条目信息
  - 请求前会校验 options 首页 `AI 调用使用人`；请求体默认补齐 `aiUsageOperatorName / platformUserName / platformUserId`
  - 当前段填入建议当前兼容页面 `contenteditable .ProseMirror`；柳州话字段读取时优先解析外层 `.textarea_class[modelvalue]`，避免把标签关闭按钮 `×` 误当正文
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
    - `audioDialectTokens`
    - `refinedMandarinText`
    - `audioMandarinText`
    - `refinedDialectText`
    - `refinedDialectTokens`
    - `candidateAlternatives`
    - legacy alias `dialectText = refinedDialectText`
    - legacy alias `mandarinText = refinedMandarinText`
    - `specialTags`
    - `needHumanReview`
    - `notes`
    - `timing`
    - `models`
  - 失败态补充：
    - 当 `listen/refine` 任一阶段命中 `模型输出 JSON 解析失败` 且原始返回仍有可读文本时，失败体当前会保守补齐 `audioMandarinText / refinedDialectText / refinedDialectTokens / refinedMandarinText / dialectText / mandarinText`
    - `rawResponse / debugRawJson` 继续只返回脱敏后的原始调试内容，不返回 token、cookie 或签名 URL 明文
  - 近音纠错：
    - `listen` 当前除 `audioDialectText` 外，还会额外返回最多 `3` 条 `candidatePhrases`
    - `refine` 当前会结合页面上下文、JSON 主词表和参考 CSV 的 prompt-only 词条，输出最终 `refinedDialectText / refinedMandarinText`
    - 若近音歧义仍未消除，响应会返回 `candidateAlternatives`，并强制 `needHumanReview=true`
  - 标签归一化：
    - 当前只支持 6 个有效标签：`#um / #hmm / #ah / #eh / <SPK/> / <NPS/>`
    - 当前会保守推断高置信口语词 / 笑声：`呃 / 诶 / 欸 -> #eh`、`啊 -> #ah`、`嗯 -> #um`、重复笑声 -> `<SPK/>`
    - `#hmm` 与 `<NPS/>` 不从纯文本自动推断，只接受模型显式输出
    - `标注文本` 标签前后若同时出现标点，会归一化为只保留标签后的标点
    - `普通话顺滑` 禁止带标签；若模型输出了标签，后端会自动移除；若柳州话最终保留 `#eh / #ah / #um / #hmm`，普通话会补对应纯文本语气词
    - 若最终柳州话 token 只剩单独语气词标签 `#um / #hmm / #ah / #eh` 与标点，前端应用层会按 `<Meaningless>` 预设落页：切为 `Invalid`、`标注文本` 写 `<Meaningless>`、`普通话顺滑` 留空
    - 前端结构化标签写入前会裁掉标签相邻的多余半角空格，避免 chip 后残留空白正文
    - 若移除了非法标签、修正了重复标点或清掉了普通话标签，响应会补 `notes`，并把 `needHumanReview` 置为 `true`

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
    - 固定规则 `rules.minSilenceMs = 400`
    - `rules.contextPaddingMs` 默认 `200`，由 options `前后补偿时长` 按 `0 ~ 1.5s` 映射到毫秒后传入
    - 如需兼容旧增量链路，仍可选传 `existingSegments[] / silentRanges[] / segmentScope`
  - 输出：
    - `data.proposedSegments`
    - `data.changes`
    - `meta.previewMode = incremental | whole-audio-fallback`
    - `meta.applyAllowed`
    - `meta.emptyReason = no-silence | no-internal-hit | insufficient-split`
    - `meta.analysisSource = backend-python-audio-url`
    - `meta.analysisMeta`
  - 当前前端主链路默认走后端整音频预览；`whole-audio-rebuild-preview` 与“无现有段请求”的自动整音频模式都不会直接参与页面 DOM 自动画段，但用户点击 `应用分段建议` 时仍会先尝试直写平台 `save_increment`

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
- 批量范围固定为“当前音频 / 当前作业”，不跨音频、不跨页、不跨整包遍历。
- 画段建议当前支持“建议生成 -> 优先直写平台保存接口 -> 增量场景 DOM 回退兜底”。
- 当前后端整音频预览不会自动重画整页波形；直写失败时保持 fail closed。
- 当前不会在缺少页面真实鉴权快照时伪造 `save_increment`，也不会自动点击平台 `保存`。
- 当前段 AI 推荐如果没有读到可信的当前段 `开始 / 结束`，会直接失败，不退回整段识别。
- 只有用户主动点击 `应用分段建议` 时，运行时才会尝试直连平台保存接口；未触发时不自动保存。

## 真实浏览器验收（批量 v1）

1. 真实 Chrome / Edge 里重新加载 unpacked extension，并刷新 `https://cvpc.data-baker.com/app/editor/asr/` 编辑页。
2. 在中间 AI 区确认看到 `全部 + 段号选择框`、`批量识别并填入`、`停止批量` 和批量状态区。
3. 保持默认全选执行一次，确认当前音频全部段进入批量状态区，并实时显示 `并发 / 总数 / 已发起 / 进行中 / 已成功 / 已失败 / 当前段 / 失败清单`。
4. 通过点击或拖动段号改成部分段执行，确认只处理已选段；同时验证空白文本段也能正常写回，不再误报“当前页面分段状态已变化”。
5. 批量中点击 `停止批量`，确认不会继续发新请求，但已发起段会自然完成；最终只保存成功段。
6. 批量写回成功后确认页面只刷新一次；刷新后复核 `标注文本 / 普通话顺滑` 已更新；常规文本段的 `Valid / Invalid` 不应被改动，只有“最终建议仅为单独语气词标签”的段会自动切成 `Invalid + <Meaningless>` 预设；整个流程也不应自动提交或切下一条。

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
