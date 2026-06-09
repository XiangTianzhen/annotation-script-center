## 2026-06-09（DataBaker CVPC 柳州话脚本二次界面优化）

- `DataBaker CVPC / 柳州话脚本` 当前继续优化表单区层级与视觉：
  - `柳州话脚本 AI 区` 当前优先挂到字段父容器 `div[data-v-fd55b986]`，作为与各个 `padding-left: 10px` 字段块同级的独立区块，不再作为字段内部子节点。
  - 右侧 `全局标注` 音频摘要当前改为逐行显示 `文件 / 来源 / 当前第 N 段 / 当前段时间`，不再使用分号拼接长句。
  - 三张字段内结果卡当前在无推荐结果时不显示任何占位文案；有结果时改成“文本左、按钮右”的紧凑布局。
  - 样式当前统一改为系统蓝主调：标题、链接、重点值、边框和按钮 hover 都向蓝色收口，不再保留明显的灰白弱提示感。

## 2026-06-09（DataBaker CVPC 柳州话脚本界面重排到字段内结果卡）

- `DataBaker CVPC / 柳州话脚本` 当前进一步收口页面结构：
  - 右侧 `全局标注` 连续信息区继续只保留状态和音频摘要，但摘要文案新增“当前第 N 段”。
  - `是否有效（Valid or Not）` 下方当前改为独立同级 `AI 区`，集中承载 `当前段 AI 推荐 / 未填写补 Valid / 生成画段建议 / 应用当前建议`、画段建议结果以及 `特殊标签 / 需人工复核 / 备注`。
  - 三张 AI 结果卡不再挂在统一结果区，当前改为按字段归位：
    - `音频的柳州话文本`、`修正后的柳州话文本` 回到 `标注文本` 字段块内
    - `音频的普通话文本` 回到 `普通话顺滑` 字段块内
- `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 当前新增稳定的 `currentSegmentNumber` 上下文字段，优先按左侧已选段编号推导当前段号，供右侧摘要区直接消费。
- `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 当前同步重排挂载层级与字段内结果卡渲染逻辑，并补对应单测。

## 2026-06-09（DataBaker CVPC 柳州话脚本移除 Fun-ASR 与 Clip-Cache）

- `DataBaker CVPC / 柳州话脚本` 当前段识别链路当前统一收口为 `audioDataUrl`：
  - 前端 `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js` 每次点击 `当前段 AI 推荐` 都会重新裁剪当前段，生成 `16k` 单声道 WAV，并直接把 Base64 `audioDataUrl` 发给 `ai/recommend`。
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.js` 与共享常量当前删除了 `clip-cache/upload` 的运行时配置和遗留引用。
  - 后端 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 继续兼容 `audioDataUrl` 与 `audioUrl` 两种输入，但柳州话当前段默认只走 Base64；整音频场景才保留公网 `audioUrl` 兼容。
- CVPC 柳州话当前移除的旧链路：
  - 听音模型当前只保留 `qwen3.5-omni-plus / qwen3.5-omni-flash`，不再提供 `fun-asr`。
  - CVPC 专用 `clip-cache` 路由、服务、测试与 README 口径当前全部删除，不再保留 legacy / 调试入口。
  - options 页、共享存储归一和后端 defaults/health 当前都已同步移除 `fun-asr`。
- 同步更新：
  - `extension/options/options.js`
  - `extension/shared/storage.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `docs/platforms/index.md`

## 2026-06-09（DataBaker CVPC 柳州话脚本删除 clip URL 可达性探测）

- 修复 `DataBaker CVPC / 柳州话脚本` 当前段 AI 推荐在 clip 已上传但推荐接口仍报 `clip-audio-unavailable` 的一类误判：
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 当前删除了对外临时音频 URL 的 `HEAD` / 可达性探测。
  - `ai/recommend` 当前改为只从 `audioUrl` 解析 `clipId`，再直接读取后端本地 clip-cache 文件判断是否存在。
  - 如果 `audioUrl` 不是本脚本 clip-cache 文件地址，当前会直接返回 `invalid-clip-audio-url`；如果本地文件不存在或已被清理，则返回显式 `clip-audio-unavailable`。
- 同步更新：
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`

## 2026-06-09（统一后端 README 补齐 PM2 启动命令并对齐服务名）

- 根 `README.md` 与 `platform-resources/backend/README.md` 当前补充了统一后端的 PM2 首次启动命令：
  - `pm2 start platform-resources/backend/server.js --name annotation-script-center --cwd /var/www/annotation-script-center`
- 同步补充了“删除后重建 PM2 服务”的示例命令，避免只有 `restart` 没有 `start` 的口径缺失。
- 文档中的统一后端 PM2 服务名当前明确收口为 `annotation-script-center`，用于和服务器实际进程名保持一致。

## 2026-06-09（DataBaker CVPC 柳州话脚本按新版三段 AI 结构收口回中间区域）

- `DataBaker CVPC / 柳州话脚本` 当前基于新版三段 AI 推荐结构完成二次布局收口：
  - 右侧 `全局标注` 当前只保留紧凑状态区、当前音频摘要和提示说明，不再展示三结果 AI 推荐卡、画段建议结果和动作按钮。
  - 右侧挂载点当前优先插入 `全局标注` 的 `.label_title_border2` 内容流，不再作为外层外挂块追加。
  - 中间 `普通话顺滑` 下方当前改成统一 AI 工作区，集中承载：
    - `当前段 AI 推荐`
    - `未填写补 Valid`
    - `生成画段建议`
    - `应用当前建议`
    - 当前画段建议结果
    - `音频的柳州话文本 / 音频的普通话文本 / 修正后的柳州话文本` 三张结果卡
- `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 当前同步完成原生化样式收口：
  - 去掉旧橙色助手主题，统一改为接近 CVPC 原生 `Element UI` 的蓝灰按钮、白底卡片和浅灰分隔线。
  - `设为 Valid / 设为 Invalid` 当前不再作为面板按钮渲染，继续只依赖页面原生单选与既有快捷键。
  - 波形区 `.bottom-right` 当前不再承载柳州话脚本自定义按钮。

## 2026-06-09（DataBaker CVPC 临时音频改为每次重传并缩短为 10 分钟 TTL）

- `DataBaker CVPC / 柳州话脚本` 当前调整临时音频策略：
  - 前端不再复用页内 clip-cache URL；每次点击 `当前段 AI 推荐` 都会重新裁剪当前段并重新上传临时音频。
  - 后端临时音频默认保留时间从 `1` 小时改为 `10` 分钟。
  - 上传成功后当前会记录过期时间，并在进程内注册定时删除；上传、读取和服务启动时也继续顺手清理过期文件。
- 同步更新：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/clip-cache-service.js`
  - 对应测试与 README 口径

## 2026-06-09（DataBaker CVPC 柳州话脚本接入两阶段 AI 设置与三结果卡）

- `DataBaker CVPC / 柳州话脚本` 当前完成新一轮布局与链路收口：
  - 右侧 `全局标注` 卡当前作为唯一助手挂载点，固定展示状态、当前音频/当前段摘要、按需出现的画段建议、三结果 AI 推荐卡和动作按钮。
  - 波形区 `.bottom-right` 当前只前置 `生成画段建议`、`应用当前建议`；不再把其他柳州话 AI 按钮挂到波形区。
  - 旧的单一 `填入当前推荐` 按钮已移除，改为三张结果卡分别定向填入：
    - `音频的柳州话文本` -> `标注文本`
    - `音频的普通话文本` -> `普通话顺滑`
    - `修正后的柳州话文本` -> `标注文本`
- options 当前新增 CVPC 专属 `AI 设置` 面板：
  - 共享右侧 `AI 设置` 区已纳入 `dataBakerCvpcLiuzhouAssistant`。
  - 只保留 `基础设置 / 听音 / 文本修正` 三块；不提供 compare-family、采纳阈值或前端并发字段。
  - 听音模型支持 `qwen3.5-omni-plus / qwen3.5-omni-flash / fun-asr`；文本修正模型支持 `qwen3.5-plus / qwen3.5-flash`。
- 当前段 AI 推荐链路当前升级为 staged contract：
  - 前端继续严格按 `.xaudio_time` 的 `开始 / 结束` 裁剪当前段，只上传 clip-cache 临时片段 URL，不退回整音频。
  - 请求体当前发送 `aiStages.listen / aiStages.refine`。
  - 返回体当前新增 `audioDialectText / audioMandarinText / refinedDialectText`，并继续兼容 `dialectText / mandarinText` 旧别名。
- 后端 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js` 当前改为两阶段 pipeline：
  - `listen`：默认走 Omni 听音，直接输出 `audioDialectText + audioMandarinText`
  - `fun-asr`：先拿 `heardText`，再走一次文本桥接补足双输出，保持前端 UI 和契约不降级
  - `refine`：结合普通话文本、词表命中片段与页面上下文，只修正柳州话文本，输出 `refinedDialectText`
- 新增/更新验证：
  - `extension/shared/storage.data-baker-cvpc.test.js`
  - `extension/options/options-shared-asr-ai-panel.test.js`
  - `extension/options/options-data-baker-cvpc-ai-ui.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`

## 2026-06-09（DataBaker CVPC 柳州话脚本收口右侧信息区并集中 AI 区）

- `DataBaker CVPC / 柳州话脚本` 当前继续收口页面布局：
  - 右侧 `柳州话脚本 Beta` 不再作为独立大块卡片展示；当前改为紧跟 `是否有效（Valid or Not）` 下方的连续紧凑信息区。
  - 右侧当前只保留状态、当前音频摘要和提示说明，不再承载 AI 推荐结果与画段建议结果。
  - 中间 `普通话顺滑` 下方当前升级为统一 AI 区，集中承载：
    - `当前段 AI 推荐`
    - `填入当前推荐`
    - `生成画段建议`
    - `应用当前建议`
    - 当前画段建议结果
    - 当前段 AI 推荐结果
- `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js` 当前完成挂载重组：
  - 保留 `未填写补 Valid` 在有效性单选区右侧。
  - 移除波形区 `.bottom-right` 的柳州话 AI 按钮挂载，不再与平台原生波形控件混排。
  - 新增中间 AI 区容器，统一承载后续 AI 动作扩展位与结果展示位。
- 回归验证补充：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js` 当前新增中间 AI 区结果渲染覆盖，并确认波形区不再出现柳州话 AI 按钮。

## 2026-06-08（DataBaker CVPC 柳州话脚本调整原生字段按钮挂载与批量补 Valid）

- `DataBaker CVPC / 柳州话脚本` 当前进一步收口右侧原生表单挂载：
  - 助手卡内不再保留冗余的 `设为 Valid`、`设为 Invalid`、`当前段 AI 推荐`、`填入当前推荐` 按钮。
  - `未填写补 Valid` 当前改挂到 `是否有效（Valid or Not）` 单选区右侧。
  - `当前段 AI 推荐`、`填入当前推荐` 当前改挂到 `普通话顺滑` 输入区下方。
  - 波形区 `.bottom-right` 继续只承载 `生成画段建议`、`应用当前建议`。
- `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 当前补齐三类写入保护：
  - 当前段 `Valid / Invalid` 切换前先读当前单选状态；已是目标值时返回 no-op，不再重复点击，避免二次点击把已选状态取消。
  - `填入当前推荐` 当前改为兼容页面 `contenteditable .ProseMirror`，可直接写入 `标注文本` 与 `普通话顺滑`。
  - `未填写补 Valid` 当前改为先请求 `annotation/annos`，只统计并补写当前 `entry_index` 下缺失有效性的段；已填 `Valid / Invalid` 全部跳过。
- 批量补写当前按左侧编号顺序执行：
  - 先校验左侧段编号数量与 `annotation/annos` 的 `instance` 数量一致。
  - `missing=0` 时只提示 `Valid / Invalid / 未填写` 统计，不执行点击。
  - `missing>0` 时逐条选中目标段，再调用当前段 `Valid` 切换；段切换失败或写入失败立即停止并返回失败编号与已补写数量。
- 新增/更新验证：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`

## 2026-06-08（DataBaker CVPC 柳州话脚本改为右侧卡内助手与当前段裁剪识别）

- `DataBaker CVPC / 柳州话脚本` 当前完成两类页面布局调整：
  - 取消旧悬浮助手和顶部 `.page-top .top-right` 助手工具条。
  - 助手区改为嵌入右侧 `全局标注` 卡片，保留原生 `Valid / Invalid` 在上方；下方固定显示状态、当前音频/当前段摘要、AI 推荐结果和动作按钮。
  - `生成画段建议`、`应用当前建议` 当前仅前置挂到波形区 `.bottom-right`，不改平台原生 `开启拆分 / 合并段落 / 波形调节 / 倍率` 控件。
- `当前段 AI 推荐` 当前严格按当前波形选中段工作：
  - `data-api.js` 新增 `.xaudio_time` 实时解析，输出 `selectedRange` 与 `selectionKey`。
  - 左侧条目或波形选中段变化时，会清空旧推荐，避免把上一段结果填到新段。
  - 如果没有读到可信的 `开始 / 结束`，前端直接阻断，不再退回整段音频或第一段。
- 新增 clip-cache 临时音频缓存链路：
  - 浏览器端先下载当前签名音频，只裁剪当前段，转成 `16k` 单声道 WAV，再上传后端。
  - 后端新增 `clip-cache/health`、`clip-cache/upload`、`clip-cache/files/:clipId.wav`。
  - 临时文件默认保留 `1` 小时，文件名仅使用不透明 `clipId`，运行目录为 `platform-resources/data-baker-cvpc/liuzhou-helper/data/runtime/clip-cache/`，已加入 `.gitignore`。
- 新增/更新验证：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ai-recommendation.test.js`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/backend/clip-cache-service.test.js`

## 2026-06-08（系统管理项目数据下载补齐“全部”供应商选项）

- 修复系统管理 `数据导出 -> 项目数据下载` 在单供应商或想直接下总表时的供应商选择缺口：
  - 前端当前新增 `extension/options/options-project-download-supplier.js`，统一负责供应商下拉的 `全部` 选项与校验规则。
  - 单供应商数据集现在也会显示供应商下拉，并默认提供 `全部`，避免“只有一个供应商但无法直接下载总表”的情况。
  - 多供应商数据集选择 `全部` 时，当前也允许直接下载总表，不再只能二选一下载某个供应商。
- 后端 `platform-resources/backend/project-data-download/routes.js` 当前支持显式 `supplier="__all__"`：
  - `request` 阶段把它识别为“总表下载意图”，不再误判成缺少供应商。
  - `file` 阶段同样按总表处理，仍保持具体供应商筛选下载不变。
- 新增回归验证：
  - `extension/options/options-project-download-supplier.test.js`
  - `platform-resources/backend/project-data-download/__tests__/request-auth.test.js`

## 2026-06-08（AI 配置收口与废弃 Provider 清理）

- 统一 AI 配置口径：
  - `config/env/ai.env.example` 收口为最小生产模板，只保留 `DASHSCOPE_API_KEY`、可选 `DASHSCOPE_BASE_URL`，以及注释式 `ASC_AI_JOB_*` 覆盖示例。
  - 明确 `config/env/ai.env`、`config/env/ai.local.env` 为忽略文件，真实生产内容应只保留密钥和少量非默认覆盖项。
- 共享 job 配置推荐写法统一改为 `ASC_AI_JOB_TIMEOUT_MS / ASC_AI_JOB_TTL_MS / ASC_AI_JOB_MAX_SIZE / ASC_AI_JOB_POLL_INTERVAL_MS`：
  - `platform-resources/backend/ai/config.js` 补齐与共享 runtime 一致的优先级，按 `ASC_* -> DATABAKER_* -> 代码默认值` 读取。
  - `DATABAKER_AI_JOB_*` 仅保留历史兼容 fallback，不再作为模板和文档首选口径。
- 清理废弃 provider 残留：
  - 删除 `config/env/ai.env.example` 中不再维护的额外 provider 变量块。
  - 删除 `extension/shared/constants.js` 中未使用的旧 `AI_MODEL_OPTIONS` 常量与导出，避免继续暴露历史模型选项。
- 同步更新根 `README.md`、统一后端 README、标贝易采 README / backend README 与 `log.md`，统一为“代码默认值优先”的维护说明。

## 2026-06-08（LabelX 快判统计恢复冲突跳过）

- 恢复 `Alibaba LabelX / ASR 快判统计上传` 的“冲突跳过”体验，但不回退后端双键严格写入规则：
  - label existing 仍只有 `用户名 + subTaskId` 双键精确命中时才算 `complete=true`。
  - 如果 existing 已识别为“同用户名不同 subTaskId”或“同 subTaskId 不同用户名”，前端当前直接记为“冲突跳过”，不再继续拉详情、上传并报后端失败。
- 前端统计摘要当前新增 `skippedConflictCount`：
  - 完成态文案会展示“冲突跳过 N”。
  - 当 `payloadCount=0` 且只有冲突跳过时，不再提示“已全部完整，无需上传”，而是明确提示“存在冲突跳过，未上传”。
- “补传并覆盖当前人员”边界保持收紧：
  - 仍只针对 `skippedCompleteCount > 0` 的完整跳过分包显示按钮。
  - `conflict-skip` 不参与 force replace，避免把单键冲突重新送回后端失败。
- 新增前端纯函数回归测试：
  - `extension/sites/alibaba-labelx/asr-judgement/asr-judgement-server.test.js`
  - 覆盖 `complete-skip / conflict-skip / fetch-detail` 三类 existing 分流与 force replace 例外规则。

## 2026-06-08（系统仪表盘补齐 AI 任务池占用并修复 job store 满载回收）

- 修复“系统管理 / 仪表盘 / 模型池占用”与真实 `503` 原因脱节的问题：
  - 之前仪表盘只展示 provider 模型池 `active/pending/999`，但 `ai-job-store-full` 实际来自共享 AI 任务池，导致页面看起来很空、请求却已经被后端拒绝。
  - 现在仪表盘会在模型池卡片前额外展示 `AI 任务池` 卡片，并明确提示 `ai-job-store-full` 对应的是任务池满载。
- 共享 AI job store 当前补齐容量快照字段：
  - `capacity`
  - `usedCount`
  - `availableCount`
  - `isFull`
  - `utilizationPercent`
- 共享 AI job store 的满载策略当前已调整：
  - 过去只清理 `expired` job，30 分钟 TTL 内如果成功 / 失败 job 积累到上限，即使模型池并不忙，也会持续返回 `ai-job-store-full`。
  - 现在达到上限时，会优先回收最早的终态 job（`succeeded / failed / expired`）；只有运行中和待启动任务本身已经把池打满时，才继续拒绝新任务。
- 回归验证已补：
  - `platform-resources/backend/ai-framework/runtime/ai-job-store.test.js`
  - `platform-resources/backend/admin-dashboard/overview.test.js`

## 2026-06-08（LabelX 快判统计双键槽位校验修复）

- 修复 `Alibaba LabelX / ASR 快判统计上传` 在历史脏数据场景下容易长出“同名重复占槽”和“existing 误判已上传”的问题：
  - 标注槽位当前改成严格 `用户名 + subTaskId` 双键语义。
  - 只有双键同时命中同一标注槽位时，才允许复用原槽位或被 existing 判成 `complete=true`。
  - 同用户名不同 `subTaskId`、或同 `subTaskId` 不同用户名，现在都会明确拒绝，不再自动并槽。
- 前端 / 后端同步收紧：
  - `extension/sites/alibaba-labelx/asr-judgement/asr-judgement-server.js` 当前要求标注 payload 的 `roleRecord.userName` 必填。
  - existing 请求组装会对 label 显式透传 `userName`。
  - `platform-resources/backend/project-data-download/labelx-existing-core.js` 与快判 `data/adapter.js` 当前按双键精确命中判定标注是否已完整上传。
- 新规则明确不兼容历史脏数据：
  - 启用前需要人工备份并清空服务器现有快判统计数据。
  - 之后再让全员重新全量上传一次。
  - 这轮不新增后端“清空统计”接口，继续按人工运维处理。

## 2026-06-08（Magic Data 双助手修复 Job 成功态结果多包一层导致的面板误判）

- 修复 `Magic Data / 客家话助手` 的“AI 质检当前条”结果渲染异常：
  - 现象：后端已返回 `reviewConclusion=pass` 与有效 `summary`，但右侧结果区仍显示“无法判断 / 摘要 -”。
  - 根因：`review-current/jobs/:jobId` 成功态返回的 `data` 是整块成功响应体，前端 Job client 直接把这层对象传给面板，导致面板读取 `reviewConclusion/overall.summary` 时命中空值。
  - 修复：`extension/sites/magic-data/shared/ai-review-client.js` 在 Job 轮询成功分支优先解包 `jobBody.data.data`，没有第二层时再回退 `jobBody.data`。
- 同步兼容 `Magic Data / 闽南语助手`：
  - `extension/sites/magic-data/minnan-helper/ai-review-client.js` 使用同样的解包逻辑，避免双助手在同类 Job 链路上再次出现结果渲染异常。
- 新增回归验证：
  - `extension/sites/magic-data/shared/ai-review-client.test.js` 覆盖“Job succeeded + data.success + data.data”结构，确保前端最终拿到真正的质检结果对象。

## 2026-06-08（DataBaker CVPC 柳州话脚本音频地址面板折叠优化）

- `DataBaker CVPC / 柳州话脚本` 的悬浮窗当前优化“当前音频地址”展示：
  - 默认只展示当前音频文件、URL 来源和“打开当前音频 URL”链接。
  - 完整签名地址放入折叠详情，默认不展开。
- `page-world/audio-observer.js` 当前不再包装 `console.warn`，避免平台阿里云 STS warning 的堆栈被归到扩展脚本；音频 URL 捕获继续监听 `console.log/info/debug`。

## 2026-06-08（DataBaker CVPC 柳州话脚本补获 iframe 音频 URL）

- 通过真实 Edge 页面继续排查确认：`gAudioUrl / audio_url` 出现在同源 `/app/xaudio/label/` iframe 中，顶层页内观察器无法直接捕获该 iframe 的控制台音频 URL。
- `extension/manifest.json` 当前把 CVPC 页内音频观察桥改为 `all_frames: true`，只扩展 `MAIN` world observer，不把完整运行时脚本扩到 iframe。
- `page-world/audio-observer.js` 当前在未拿到 meta entries 的 iframe 中捕获到 `databaker/data/` 音频 URL 时，会把候选 URL 发给顶层页面；顶层 `data-api.js` 再结合桥接 `annotation/meta` 的当前条目做匹配。
- 同源 frame 消息仍只接受私有 `source/type` 协议；音频 URL 只在页面运行时内存中传递，不写入 storage、文档或日志。

## 2026-06-08（DataBaker CVPC 柳州话脚本修复 meta 401 后音频地址不显示）

- 通过真实 Edge 页面排查确认：页面自身能拿到 `gAudioUrl / audio_url`，但扩展隔离世界自发 `annotation/meta` 请求会因缺少平台运行时鉴权返回 `401`，导致悬浮窗显示“读取当前音频地址失败”。
- `page-world/audio-observer.js` 当前新增运行时 meta 快照桥：
  - 复用页面真实 `annotation/meta` 响应，不要求扩展重新携带 Bearer 请求。
  - 同步兼容平台响应 `code: 200`。
  - 桥接数据只在页面运行时内存传递，不写入 storage，不写入日志。
- `data-api.js` 当前在自身 `annotation/meta` 请求失败时，会回退使用页内桥传入的 meta，再匹配页面捕获到的当前音频签名 URL。

## 2026-06-08（DataBaker CVPC 柳州话脚本悬浮窗展示当前音频地址）

- `DataBaker CVPC / 柳州话脚本` 的“柳州话脚本 Beta”悬浮窗当前新增“当前音频地址”区域：
  - 展示当前文件名、音频 URL 来源和运行时拿到的当前音频地址。
  - 仅在页面运行时展示，不写入 storage、文档或日志。
- 页内音频观察桥当前补充消费页面初始化阶段的控制台音频 URL 打印：
  - 继续结合 `annotation/meta` 的相对路径和文件名建立映射。
  - 如果音频 URL 先于 `annotation/meta` 出现，会暂存在页面内存，待 meta 到达后再建立当前条目映射。
- `content.js` 当前在悬浮窗挂载后会主动刷新当前音频上下文，页面刷新后无需先播放一次即可优先显示已捕获到的音频 URL；如果仍未拿到，会在面板里显示可执行提示。

## 2026-06-08（DataBaker CVPC 柳州话脚本修复早期挂载空指针）

- 修复 `DataBaker CVPC / 柳州话脚本` 在编辑页骨架尚未准备好时偶发的前端报错：
  - 报错：`Cannot read properties of null (reading 'appendChild')`
  - 位置：`extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.js`
- 根因：
  - content script 较早执行时，`document.body` 或顶部工具栏宿主可能仍未就绪
  - `ui-panel.js` 直接对空宿主执行 `appendChild(...)`，导致挂载阶段抛错
- 修复方式：
  - `mount()` 在 `body` 未就绪时直接跳过本轮挂载并返回
  - 工具栏 fallback 宿主在 `body` 缺失时不再强行创建
  - 等后续轮询再次执行 `mount()` 时再完成正常挂载
- 新增回归验证：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/ui-panel.test.js` 覆盖 `document.body` 未就绪场景

## 2026-06-08（DataBaker CVPC 柳州话脚本提示屏蔽拆成双开关）

- `DataBaker CVPC / 柳州话脚本` 的提示屏蔽能力当前从单开关拆成两个独立基础设置，且默认都开启：
  - `屏蔽“不能打开新的Tab页”提示`
  - `屏蔽“系统进入暂停状态”提示`
- 存储字段当前改为：
  - `blockNewTabEditingTips`
  - `blockPauseStateTips`
- 向后兼容：
  - 旧配置里的 `blockEditingTabTips` 会自动迁移成两个新字段同值
  - 老用户如果之前关闭过旧单开关，升级后两个新开关会一起保持关闭
- `editing-tab-tip-guard.js` 当前按开关分别决定是否拦截对应固定文案，不扩大到其他 `.tips` 提示。

## 2026-06-08（DataBaker CVPC 柳州话脚本补充暂停状态提示屏蔽）

- `DataBaker CVPC / 柳州话脚本` 的既有基础设置开关 `屏蔽“不能打开新的Tab页”提示` 当前已扩大到同时屏蔽两类固定高层提示：
  - `您正在编辑该作业,不能打开新的Tab页`
  - `系统进入暂停状态`
- `extension/sites/data-baker-cvpc/liuzhou-helper/editing-tab-tip-guard.js` 当前继续保持精确文案匹配：
  - 仍只观察 `/app/editor/asr/` 页面内新增的 `.tips` 节点
  - 不扩大到其他提示、不改按钮逻辑、不碰平台保存/提交/切条链路
- 回归验证补充：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/editing-tab-tip-guard.test.js` 新增暂停状态弹窗覆盖

## 2026-06-08（DataBaker CVPC 柳州话脚本音频 URL 获取接通）

- `DataBaker CVPC / 柳州话脚本` 当前新增页内音频观察桥：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.js`
  - 通过 `MAIN` world 捕获 `annotation/meta` 的相对音频路径与页面真实音频请求的签名 URL 映射。
  - 观察结果只保存在页面运行时内存，并通过私有 `window.postMessage` 协议传给隔离世界，不写入 storage，不写入日志。
- `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js` 当前按以下顺序解析当前音频 URL：
  - 页内观察器映射
  - `annotation/meta` 里的完整 URL 字段
  - 顶层 DOM audio
  - Performance resource
  - 同源 iframe audio
- `content.js` 当前在音频 URL 缺失时会提前提示用户先点击当前音频或播放一次后重试；现有 AI 推荐和画段建议请求结构保持不变。
- 新增回归验证：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/page-world/audio-observer.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`

## 2026-06-08（DataBaker CVPC 柳州话脚本快捷键兼容热修）

- 修复 `DataBaker CVPC / 柳州话脚本` 中部分历史快捷键无法触发的问题：
  - 现象：按钮点击“设为 Invalid”“未填写补 Valid”可正常执行，但已保存的快捷键不触发。
  - 根因：旧配置里存在 `Shift + 数字` 风格的快捷键，运行时只按 `event.key` 精确匹配时，会被浏览器实际抛出的符号键值打断。
- `extension/sites/data-baker-cvpc/liuzhou-helper/shortcuts.js` 当前已补兼容：
  - 在保留原有 `event.key` 匹配的基础上，额外按 `event.code` 推导数字键 / 主键区字母键 / Space 的候选值。
  - 旧版 `Alt + Shift + 2/3` 这类历史组合现在可继续命中 `invalid` 与 `fillAllValid` 等动作。
- 新增回归验证：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/shortcuts.test.js` 新增 legacy shifted digit 覆盖。

## 2026-06-08（DataBaker CVPC 柳州话脚本屏蔽 Tab 限制提示）

- `DataBaker CVPC / 柳州话脚本` 当前新增基础设置开关：
  - `屏蔽“不能打开新的Tab页”提示`
  - 默认开启
  - 存储字段：`platforms.dataBakerCvpc.scripts.liuzhouAssistant.blockEditingTabTips`
- 运行时新增 `extension/sites/data-baker-cvpc/liuzhou-helper/editing-tab-tip-guard.js`：
  - 进入 `/app/editor/asr/` 后先扫描一次页面
  - 再通过 `MutationObserver` 监听新增节点
  - 只移除文案包含 `您正在编辑该作业,不能打开新的Tab页` 的提示模块
  - 不扩大到其他 `.tips` 提示，也不改平台保存/提交/切条逻辑
- options / storage / manifest 同步更新：
  - `extension/options/options.html`
  - `extension/options/options.js`
  - `extension/shared/constants.js`
  - `extension/shared/storage.js`
  - `extension/manifest.json`
- 新增验证覆盖：
  - `extension/shared/storage.data-baker-cvpc.test.js`
  - `extension/options/options-shortcut-panel-structure.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/editing-tab-tip-guard.test.js`

## 2026-06-05（全平台快捷键默认置空与组件化收口）

- options 侧快捷键面板当前已统一收口到 `extension/options/options-shared-shortcut-panel.js`：
  - Alibaba LabelX 转写
  - Alibaba LabelX 快判
  - DataBaker 一检
  - DataBaker CVPC 柳州话脚本
  - Aishell Tech 闽南语助手
  - Magic Data 客家话助手
  - Magic Data 闽南语助手
  - Abaka Task21 助手
- 默认快捷键当前统一改为空：
  - CVPC 不再保留固定 `Alt + Shift + 1~7` 默认组合
  - Abaka Task21 不再保留 `1~7` 与 `Alt+1~4` 默认组合
- options 文案与交互同步调整：
  - CVPC 快捷键区改为与其他脚本一致的可录制模板
  - Abaka “恢复默认快捷键”改为“清空快捷键”
- 运行时默认回退同步收口：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/shortcuts.js` 不再内置固定默认键位
  - 只有用户在 options 中显式保存的快捷键，运行时才会响应
- 项目规则同步更新：
  - `AGENTS.md`
  - 根 `README.md`
  - `extension/README.md`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `extension/sites/abaka-ai/task-page/README.md`

## 2026-06-05（DataBaker CVPC 柳州话脚本 Beta 接入）

- 跟进优化：
  - options 侧新增 `extension/options/options-shared-shortcut-panel.js`，把脚本详情页快捷键区统一收口为共享组件。
  - 转写、快判、标贝易采、Aishell、Magic Data、Abaka 的快捷键行渲染已改成复用共享组件，保留各自草稿和录制状态逻辑。
  - CVPC 柳州话脚本的固定快捷键已接回共享组件只读模式，不再在 `options.html` 手写 `field-card` 列表。
  - `AGENTS.md`、`README.md`、`extension/README.md` 已补“快捷键面板必须复用统一组件”的硬规则。

- 跟进优化：
  - CVPC 柳州话脚本的固定快捷键已从“基础设置”拆到独立“快捷键”面板，和其他脚本保持同一结构。
  - 运行时操作按钮已从纯悬浮面板改为优先挂到 `editor/asr` 顶部 `.page-top .top-right` 工具栏区域。
  - 悬浮面板当前只保留状态、画段建议和 AI 推荐结果展示；顶部缺失时才退回右上角浮动按钮容器。

- `DataBaker CVPC / 柳州话脚本` 当前已接入 beta 平台与脚本元数据：
  - 新增 `dataBakerCvpc` 平台和 `dataBakerCvpcLiuzhouAssistant` 脚本。
  - `extension/manifest.json` 已补 `https://cvpc.data-baker.com/*` host permission 与 content script 注入。
  - 延续现有 beta 可见性体系：public 包与未解锁 beta 包都不显示该平台和脚本。
- 扩展运行时当前新增：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/`
  - 当前只在 `/app/editor/asr/` 生效，提供当前音频画段建议、当前段 AI 推荐、当前段实验性填入、当前段 `Valid / Invalid` 快捷入口。
  - 固定边界：不自动保存、不自动提交、不自动切下一条、不跨当前音频自动遍历。
- 独立后端当前新增：
  - `GET /api/data-baker-cvpc/liuzhou-helper/segment/health`
  - `POST /api/data-baker-cvpc/liuzhou-helper/segment/preview`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
  - `POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`
- 规则资产当前已入库：
  - `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-rules.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-pronunciation-reference.csv`
- settings/options 当前已补：
  - `extension/shared/storage.js` 新增 CVPC 平台归一与启停同步。
  - `extension/options/options.html`、`extension/options/options.js` 新增 CVPC 柳州话详情面板与保存入口。
- 当前仍明确保留的阻塞：
  - 真实 `segment create/update` payload
  - 保存链路
  - 页面字段稳定写入契约
  - 未检测到安全写入桥时，画段应用仍只返回提示，不直接画段

## 2026-06-05（Aishell 三板块第二轮优化）

- `希尔贝壳 / 闽南语助手` 当前在“三板块”基础上继续优化执行策略：
  - `转换` 改为“规则优先 + 歧义时 AI 兜底”。
  - `听音`、`比较` 保持独立请求；切到 Omni 比较时仍单独执行第三段请求。
- 词表转换当前不再把 `minnan-lexicon.csv` 原始文本块整段塞给转换模型：
  - 后端运行时会先把 CSV 投影成结构化映射。
  - 规则替换只按 `对应华语 -> 建议用字` 做最长匹配。
  - 只有命中多候选或切分冲突时，才会把 `ruleConvertedText + ambiguousSegments` 发给转换模型兜底。
- Aishell pipeline 当前继续按三段独立时序执行：
  - `转换` 与 `听音` 并行
  - `比较` 等待前两段完成后单独运行
- options / 诊断 / 文档同步更新：
  - 听音卡与比较卡当前恢复为“三段独立请求”口径。
  - 转换卡当前会明确提示“模型只在词表歧义时参与兜底”。
  - 诊断区当前恢复显示 `转换+听音并行 / Omni 比较`。

## 2026-06-05（Aishell 真三板块重构）

- `希尔贝壳 / 闽南语助手` 已取消旧 `模型方案 + 识别策略` 口径，前后端统一改成独立的 `转换 / 听音 / 比较` 三板块：
  - `转换` 与 `听音` 并行执行。
  - `比较` 必须等待前两段都完成后再运行。
- Aishell options / storage / runtime 当前已切到新字段：
  - `aiRecommendConvert*`
  - `aiRecommendListen*`
  - `aiRecommendCompareFamily`
  - `aiRecommendCompareModel`
  - `aiRecommendCompareQwenPrompt`
  - `aiRecommendCompareOmniPrompt`
  - `aiRecommendCompare*`
- 前端当前只发 `aiStages` 请求体：
  - `convert = { model, prompt, params }`
  - `listen = { model, prompt, params }`
  - `compare = { family, model, prompt, params, adoptionThreshold }`
- Aishell backend 当前已改成三阶段独立 defaults / health：
  - 返回 `stages.convert / listen / compare`
  - 不再让前端依赖 `modelModeOptions / recognitionStrategyOptions / promptProfiles`
- Aishell pipeline 当前已改成：
  - `转换文本 convertedText`
  - `听音文本 heardText`
  - `推荐文本 recommendedText`
  - Qwen 比较只做文本判断；Omni 比较会在比较阶段再次听音
- 结果与诊断字段同步更新：
  - 结果区主字段改为 `convertedText`
  - `meta.models` 新增 `convertModel / listenModel / compareModelFamily / compareModel`
  - `meta.timing` 新增 `convertDurationMs`
  - `meta.usage` 新增 `convert`
- Aishell 词表当前不再要求与 DataBaker `byte-for-byte` 一致；本轮对 `minnan-lexicon.csv` 做了小范围高确定性格式清理。

## 2026-06-05（Aishell 候选 Prompt 强化与 Omni/Fun-ASR 分流）

- `希尔贝壳 / 闽南语助手` 的 `audio_first_reference` 当前继续保持“三文本对照”，但链路已按听音模型明确分流：
  - 候选转写阶段固定先跑，继续使用独立候选转写模型。
  - `listenModel=Omni`：走“候选转写模型 -> Omni 听音并同步判断差异”，不再调用差异比较模型。
  - `listenModel=fun-asr`：走“候选转写模型 -> Fun-ASR -> 差异比较模型”三段链路。
- Aishell 候选转写 Prompt 当前已强化为“闽南话 + 语境 + 词表附件”口径：
  - 默认 `candidatePrompt` 现在明确要求把任务理解为闽南话/闽南语候选转写。
  - 候选阶段会同时附带 `词表相关词条` 与 `词表原始CSV附件` 给模型，不再只给简化词表上下文。
- Aishell options / runtime 当前已补齐 Omni/Fun-ASR 联动：
  - 听音模型为 Omni 时，隐藏 `差异比较模型`。
  - 同一个 `comparePrompt` 存储键在 Omni 路径下会显示为 `Omni判断 Prompt（可选）`。
  - 切回 Fun-ASR 时，恢复 `差异比较模型` 与 `差异比较 Prompt（可选）`；隐藏期间已保存的 compare model / prompt 不丢失。
- 前端 Aishell runtime 当前会在 Omni 听音路径下省略请求体顶层 `compareModel`，但继续保留 `comparePrompt` 作为 Omni 判断 Prompt 发往后端。
- 回归验证新增覆盖：
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 覆盖候选 Prompt 附件、`two_stage + Omni` 跳过 compare 模型、`comparePrompt` 复用为 Omni 判断 Prompt。
  - `extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js` 覆盖 Omni 路径请求体不再携带顶层 `compareModel`。
  - `extension/options/options-aishell-tech-ui.test.js` 覆盖 options 源码包含 `Omni判断 Prompt（可选）`、Omni 隐藏比较模型与联动提示文案。

## 2026-06-05（Aishell 候选转写恢复为 AI 并开放独立配置）

- `希尔贝壳 / 闽南语助手` 的 `词表转写文本` 当前已从“纯代码候选转写”恢复为“独立候选转写模型生成”：
  - 删除 `platform-resources/aishell-tech/minnan-helper/backend/lexicon-candidate.js`
  - 删除 `platform-resources/aishell-tech/minnan-helper/backend/reference/minnan-lexicon-rules.json`
  - 候选阶段改为先由文本模型结合 `pageText + minnan-lexicon.csv` 上下文生成 `lexiconCandidateText`
- Aishell 后端当前重新暴露候选阶段配置：
  - `defaults / health / promptProfiles` 现在新增 `candidateModelOptions / candidateModel / candidatePrompt`
  - compare 阶段继续使用 `heardText + lexiconCandidateText + pageText`
  - `candidateDurationMs` 恢复表示候选模型调用耗时
- Aishell options / runtime 当前已补齐候选阶段独立配置：
  - 新增 `词表转写模型`
  - 新增 `词表转写 Prompt（可选）`
  - 请求体会把 `candidateModel / candidatePrompt` 发往后端
- 差异比较链路当前继续保留：
  - `two_stage` 下按“候选转写模型 -> 听音模型 -> 差异比较模型”执行
  - `omni_single` 下也会先生成候选文本，再由 Omni 在单次听音中判断差异项该保留哪一侧
- 回归验证补强：
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 改为覆盖“候选阶段独立调模型、compare 聚焦 differenceSegments、低置信保留 heardText、高置信允许混合采纳候选”
  - `extension/shared/storage.aishell-tech.test.js`、`extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js`、`extension/options/options-shared-asr-ai-panel.test.js` 同步覆盖候选模型与候选 Prompt 配置

## 2026-06-05（Aishell 三文本对照方案收口与结果展示增强）

- `希尔贝壳 / 闽南语助手` 当前已不再保留旧的 `mandarin_to_dialect` 与 `direct_dialect` 两套识别方案。
- Aishell 前后端、options、storage 与 runtime 当前统一只保留 `audio_first_reference`：
  - 默认组合收口为 `two_stage + audio_first_reference + qwen3.5-omni-flash + qwen3.5-plus`
  - 旧配置里如果仍保存旧策略值，运行时会统一归一到 `audio_first_reference`
  - options 页不再显示 Aishell 的 `识别策略` 下拉；`词表候选校正阈值` 继续保留
- `希尔贝壳闽南语推荐` 当前结果卡增强：
  - 新增 `原始文本`
  - 新增 `词表转写文本`（候选转写模型结合 `pageText + minnan-lexicon.csv` 上下文生成的闽南语候选）
  - 新增 `听音文本 vs 词表转写文本` 差异高亮展示
  - 原 `词表候选文本` 从诊断区移除，避免和主结果区重复
- 回归验证补强：
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 更新为只校验 `audio_first_reference`
  - `extension/shared/storage.aishell-tech.test.js` 更新为只校验 Aishell 归一到 `audio_first_reference`
  - `extension/options/options-shared-asr-ai-panel.test.js` 更新为 Aishell 不再显示识别策略字段

## 2026-06-05（Aishell 音频优先候选校正升级）

- `希尔贝壳 / 闽南语助手` 的 `audio_first_reference` 策略当前已升级为“三文本对照”：
  - `pageText`
  - `lexiconCandidateText`：由候选转写模型结合 `pageText` 与 `minnan-lexicon.csv` 上下文生成的标准闽南语候选文本
  - `heardText`
- 后端 `pipeline.js` 现已新增候选校正上下文：
  - 候选文本当前改为由独立候选阶段模型生成，再把 `heardText + lexiconCandidateText + pageText` 交给差异比较模型
  - 最终 `lexicon.rewriteMode` 仍固定为 `off`，不会重新开启强制词表改写
  - 当 `correctionConfidence < audioFirstReferenceCorrectionThreshold` 时，会优先保留 `heardText` 并标记 `needHumanReview=true`
- Aishell options / storage / runtime 新增 `词表候选校正阈值`：
  - 存储字段：`aiRecommendAudioFirstReferenceCorrectionThreshold`
  - 请求字段：`aiOptions.audioFirstReferenceCorrectionThreshold`
  - 默认值：`0.75`
  - 切到非 `audio_first_reference` 时只隐藏，不删除已保存值
- 当前识别结果诊断区新增：
  - `词表候选文本`
  - `校正阈值`
  - `校正置信度`
  - 详细 `candidateDecisions` 继续留在原始 JSON / 后端诊断里
- 回归验证补强：
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 新增候选文本生成、低置信回退和高置信采用候选写法覆盖
  - `extension/shared/storage.aishell-tech.test.js` 新增阈值默认值与自定义值保真覆盖
  - `extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js` 新增前端把 `audioFirstReferenceCorrectionThreshold` 发给后端的覆盖

## 2026-06-05（Aishell 音频优先识别策略）

- `希尔贝壳 / 闽南语助手` 新增第三种识别策略 `audio_first_reference`，前端显示名固定为 `音频优先，文本参考`。
- 后端当前已补齐第三种策略的 defaults / health / 请求归一 / Prompt profile：
  - 听音阶段按实际发音输出，允许普通话词和闽南语词混合存在。
  - 比较阶段把 `pageText` 和闽南语字词表收口为“软参考”，不再主导改写。
  - 音频里没有读出的词不补回；音频不清时继续通过 `needHumanReview=true` 标记。
- `platform-resources/aishell-tech/minnan-helper/backend/pipeline.js` 当前已按策略收口词表后处理：
  - `audio_first_reference` 仍会构建 lexicon context 给模型参考。
  - 但 `lexicon.rewriteMode` 现固定为 `off`，不会再走后端 `aggressive` 强制词表改写。
- 前端与配置同步补齐：
  - `extension/shared/constants.js`、`extension/shared/storage.js`、`extension/options/options.js`、`extension/sites/aishell-tech/minnan-helper/content.js` 现都接受 `audio_first_reference`。
  - options 页 `识别策略` 下拉新增 `音频优先，文本参考`。
  - Aishell `比较模型` 文案会按该策略显示为 `比较/参考模型`。
- 回归验证补强：
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 现覆盖第三种策略、promptProfiles 与 `lexicon.rewriteMode=off`。
  - `extension/shared/storage.aishell-tech.test.js` 现覆盖 `audio_first_reference` 存储保真。
  - `extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js` 现覆盖前端 runtime 会把 `recognitionStrategy=audio_first_reference` 发给后端。

## 2026-06-05（前端并发语义统一为请求窗口灌满）

- 新增 `extension/shared/concurrent-ai-request-stream.js`，把共享前端并发语义统一为：
  - 固定 `50ms` 错峰发起。
  - 启动后先把前端请求窗口灌满到当前并发上限。
  - 某条 AI 一旦返回，就立即释放 1 个前端请求槽位并补发下一条。
  - AI 结果按完成顺序进入缓冲区；页面填入 / 保存继续按各脚本自己的安全链路串行执行。
- `extension/sites/aishell-tech/minnan-helper/content.js` 当前已改成“AI 请求流水线 + 保存流水线”解耦：
  - 停止后不再发起新的 AI 请求；当前保存步骤收尾后结束本轮。
  - 批量状态补充 `前端并发 / 发送间隔 / 已发请求 / AI处理中 / AI已返回 / 待保存队列`。
- `extension/sites/data-baker/round-one-quality/content.js` 的连续填入现改为复用同一共享并发流，不改对外产品行为，只收口内部并发语义。
- 系统仪表盘模型池当前优先展示 `总占用 = activeCount + pendingCount`，并固定区分：
  - `正在调用上游`
  - `等待发起`
  - `池容量`
  - `剩余可接收`
- 新增 / 更新验证：
  - `extension/shared/concurrent-ai-request-stream.test.js`
  - `extension/sites/aishell-tech/minnan-helper/batch-pipeline.test.js`
  - `platform-resources/backend/admin-dashboard/overview.test.js`

## 2026-06-05（DataBaker CVPC 首轮资料初始化）

- 新增平台资料目录 `platform-resources/data-baker-cvpc/`，作为全新平台初始化入口；当前未创建 `extension/sites/data-baker-cvpc/`，也未接入专属后端。
- 首轮网络资料已补齐：
  - `network/01-login-and-boot.md`
  - `network/02-post-login-shell-home.md`
  - `network/03-home-to-editor-route.md`
  - `network/04-editor-asr-init.md`
  - `network/pending-capture.md`
  - `network/next-session-handoff.md`
- 首轮页面结构资料已补齐：
  - `page-structure/01-login-and-shell.md`
  - `page-structure/02-post-login-home.md`
  - `page-structure/03-home-to-editor-route.md`
  - `page-structure/04-editor-asr.md`
  - `page-structure/pending-capture.md`
- 首轮范围固定为：
  - `#/login` 路由行为
  - `#/home`
  - `#/my-job`
  - `#/my-job/:projectId/callout`
  - `#/my-job/:projectId/callout/:taskProcessId/:taskId/job?...`
  - `/app/editor/asr/?...`
- 文档统一引入 4 个标记：
  - `routeKey`
  - `riskLevel`
  - `selectorConfidence`
  - `requestClass`
- 当前安全边界：
  - 只保留脱敏结构摘要，不提交 HAR、原始凭证、完整签名 URL、真实转写内容
  - `领取 / 保存 / 挂起 / 提交 / 修改` 等动作继续按 `write-action` 处理，本轮未触发
- 同步更新：
  - `docs/platforms/index.md`
  - `README.md`

## 2026-06-05（闽南语助手 AI 设置布局统一与并发默认值收口）

- DataBaker 与 Aishell 两个闽南语助手的 `AI 连续填入并发数量` 默认值已统一收口为 `5`。
  - Omni：范围 `1~25`
  - Fun-ASR：范围 `1~50`
- `extension/options/options.html` 与 `extension/options/options.js` 当前已去掉 DataBaker 旧的“左侧基础设置先渲染，再搬运进 AI 面板”的兼容写法。
- 新增 `extension/options/options-shared-asr-ai-panel.js`：
  - 统一描述 DataBaker / Aishell / Magic Data 共享 `AI 设置` 的字段顺序与显示规则。
  - DataBaker 与 Aishell 的 `AI 连续填入并发数量` 现在由共享 AI 面板直接渲染。
  - Aishell 的并发字段已从左侧 `基础设置` 移到右侧 `AI 设置`，与 DataBaker 使用同一固定顺序。
- `extension/shared/constants.js`、`extension/shared/storage.js`、`extension/options/options.js`、`extension/sites/data-baker/round-one-quality/content.js`、`extension/sites/aishell-tech/minnan-helper/content.js` 现在统一把默认值、空值回退值和非法值归一值收口为 `5`。
- `platform-resources/backend/ai/config.js` 与 `platform-resources/data-baker/round-one-quality/backend/ai-service.js` 的并发规则诊断文案已同步为新默认值，避免 health/defaults 与前端显示分叉。
- 文档同步更新：
  - `README.md`
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - `platform-resources/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/backend/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/backend/README.md`
  - `platform-resources/backend/ai/README.md`

## 2026-06-05（Aishell Tech 批量识别按钮拆分）

- 更新 `extension/sites/aishell-tech/minnan-helper/ui-panel.js`：
  - 原单个 `AI批量识别` 按钮拆成 `全部AI批量识别`、`未完成的AI批量识别` 和 `停止批量` 三个原生工具区按钮。
  - 单条识别或任一批量运行时，两个批量按钮会统一禁用；只有批量运行中才启用 `停止批量`。
- 更新 `extension/sites/aishell-tech/minnan-helper/content.js`：
  - 批量执行链路收口成带 `mode=all|pending` 的复用入口。
  - 页面双按钮分别对应“整包全量重跑”和“只处理未完成条目”。
  - 现有快捷键 `autoFillQualifiedItem` 保持不变，继续对应“未完成的AI批量识别”。
  - 运行中文案改成双入口口径，空结果、完成和停止提示会明确区分“全部”与“未完成”。
- 更新 `extension/sites/aishell-tech/minnan-helper/data-api.js`：
  - `getBatchTasksForPackage()` 与 `createBatchTasksFromPackageItems()` 新增 `mode` 选项。
  - `pending` 模式继续跳过 `dataStatus === 2`；`all` 模式改为保留整包所有条目。
- 文档同步：
  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
- 本轮验证：
  - `node --check extension/sites/aishell-tech/minnan-helper/ui-panel.js`
  - `node --check extension/sites/aishell-tech/minnan-helper/content.js`
  - `node --check extension/sites/aishell-tech/minnan-helper/data-api.js`
  - 内联 Node 断言：验证 `createBatchTasksFromPackageItems(..., { mode: 'all' })` 会保留已完成条目，而 `mode: 'pending'` 仍会过滤已完成条目。

## 2026-06-05（Aishell Tech 闽南语标准对齐到 DataBaker 一检质检）

- 对齐 `Aishell Tech / minnan-helper` 的闽南语标准：
  - `platform-resources/aishell-tech/minnan-helper/backend/reference/minnan-lexicon.csv` 现已直接同步为 `platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.csv` 的同版内容。
  - 后端默认识别策略改为 `mandarin_to_dialect`。
  - 后端默认比较模型改为共享/DataBaker 默认值 `qwen3.5-plus`。
- 修复 `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`：
  - `GET /api/aishell-tech/minnan-helper/ai/recommend/defaults` 当前默认返回 `two_stage + mandarin_to_dialect + qwen3.5-omni-flash + qwen3.5-plus`。
  - 修复 `promptProfiles` 映射错误，`mandarin_to_dialect` 与 `direct_dialect` 现在各自返回自己的默认 Prompt。
  - 默认 Prompt 当前补齐 DataBaker 一检质检约束：普通中文统一简体，命中词表建议用字时必须保留，不再把方言建议用字改回普通话同义词。
- 同步收口前端默认值与旧默认迁移：
  - `extension/shared/constants.js`
  - `extension/shared/storage.js`
  - `extension/sites/aishell-tech/minnan-helper/content.js`
  - 空配置与运行时兜底默认值统一改为 `mandarin_to_dialect + qwen3.5-plus`。
  - 仅当浏览器里仍是旧出厂默认组合 `two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash` 时，才自动迁移到新标准；自定义配置保持不动。
  - Aishell 兼容镜像字段 `recognitionStrategy / recognitionMode / pipelineMode / compareModel` 也会同步到当前归一结果，避免 options、storage 与运行时混跑。
- 文档同步更新：
  - `README.md`
  - `docs/platforms/index.md`
  - `platform-resources/aishell-tech/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/minnan-helper/backend/README.md`
  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - 统一改为：Aishell 默认标准对齐 DataBaker 一检质检，默认链路为 `POST /jobs` + 轮询，`POST /recommend` 只保留兼容 / 调试用途。
- 新增回归测试：
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`
  - `extension/shared/storage.aishell-tech.test.js`
- 本轮验证：
  - `node --test platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js extension/shared/storage.aishell-tech.test.js`

## 2026-06-05（修复 CRX 打包脚本错误导入）

- 修复 `node scripts/package-crx-release.js --notes "CRX enterprise release"` 启动即报：
  - `[crx-release] buildEmptyLocalBuildMetaContent is not a function`
- 根因：
  - `scripts/package-crx-release.js` 仍从 `package-crx-build-profile.js` 读取 `buildEmptyLocalBuildMetaContent`
  - 该函数实际已迁移到 `scripts/build-meta-local.js`
- 当前已改为从 `build-meta-local.js` 单独导入空 stub 生成函数，恢复正式包 / beta 包打包流程。
- 新增回归测试：
  - `scripts/package-crx-release-source.test.js`
- README 当前同步补充：
  - 本地 beta 口令入口先执行 `node scripts/sync-local-build-meta.js`
  - 正式打包命令继续使用 `node scripts/package-crx-release.js --notes "CRX enterprise release"`

## 2026-06-04（本地 beta 口令改为从 config 同步，config 文档统一收口）

- 修复本地开发者模式直加载 `extension/` 时点击隐藏入口提示“当前 beta 包未配置口令，无法解锁”的问题。
- 当前新增：
  - `scripts/build-meta-local.js`
  - `scripts/sync-local-build-meta.js`
  - `extension/shared/build-meta.local.js` 本地覆盖机制（文件本身已加入 `.gitignore`）
- `options/options.html` 与 `popup/popup.html` 当前会在 `build-meta.js` 后继续加载 `build-meta.local.js`。
- `background/service-worker.js` 当前也会尝试按可选文件方式加载本地 override；文件缺失时自动忽略。
- `scripts/package-crx-release.js` 当前会在临时打包目录中把 `build-meta.local.js` 覆盖成安全 stub，避免把本地私有 beta 口令 hash 带进正式包或 beta ZIP。
- `config` 文档当前统一收口到：
  - `config/README.md`
  - 不再保留 `config/release/README.md` 与 `config/secrets/README.md`
- 本轮验证：
  - `node --test scripts/build-meta-local.test.js extension/options/options-beta-unlock.test.js`
  - `node --check scripts/build-meta-local.js`
  - `node --check scripts/sync-local-build-meta.js`
  - `node --check scripts/package-crx-release.js`
  - `node --check extension/background/service-worker.js`
  - `node scripts/sync-local-build-meta.js`

## 2026-06-04（本地直加载默认 beta 通道，但默认隐藏 beta 内容）

- 修正上一轮错误实现：`beta` 通道不再默认全显。
- `extension/shared/build-meta.js` 当前默认改为：
  - `releaseChannel=beta`
  - `betaFeaturesVisibleByDefault=false`
  - 默认 beta 后端地址固定为 `http://47.109.197.170:3333`
- `extension/` 源码目录在 Chrome / Edge 开发者模式直接加载时，当前默认仍属于 beta 通道，但 beta 平台、beta 脚本与 `Beta 服务器` 默认隐藏，只有触发隐藏入口并输入正确口令后才显示。
- 正式打包口径保持不变：
  - `public` 继续只展示公开平台与公开脚本
  - `beta` 继续打成单一 `annotation-script-center-beta.zip`
  - beta ZIP 会自动写入 `betaFeaturesVisibleByDefault=false`
- `extension/options/options.js` 当前恢复为隐藏解锁口径：
  - 连续点击左上角品牌图片 `7` 次后才触发 beta 口令输入
  - 页面侧栏不再主动显示 beta 解锁提示文案
- 本轮验证：
  - `node --test extension/shared/build-meta.test.js`
  - `node --test extension/shared/constants.release.test.js`
  - `node --test scripts/package-crx-build-profile.test.js`
  - `node --check extension/shared/build-meta.js`
  - `node --check extension/shared/constants.js`
  - `node --check scripts/package-crx-build-profile.js`
  - `node --check extension/options/options.js`

## 2026-06-04（CRX 打包命令收口为单行双产物）

- `scripts/package-crx-release.js` 当前默认不再只打单通道：
  - 未显式传 `--channel` 时，会在一次执行中同时生成正式包与 beta 包
  - 正式包继续产出 `CRX + ZIP + update.xml + crx-latest.json`
  - beta 包继续产出单一 `annotation-script-center-beta.zip`
- 打包默认值已收口到 `config`：
  - 新增 `config/release/package-crx-release.json`
  - 新增 `config/release/README.md`
  - 本地私有 `config/secrets/package-crx-release.local.json` 用于保存 `betaUnlockPasswordSha256`
  - 默认 beta 后端地址固定为 `http://47.109.197.170:3333`
- `.gitignore` 当前已允许 `dist/annotation-script-center-beta.zip` 参与 Git 跟踪，并忽略本地私有 `config/secrets/package-crx-release.local.json`
- beta 打包参数当前支持直接走命令行，避免先写多行环境变量：
  - `--betaUnlockPasswordSha256`
  - `--betaBackendBaseUrl`
- 仍保留按需单独打包：
  - `--channel public`
  - `--channel beta`
- 本轮验证：
  - `node --test scripts/package-crx-build-profile.test.js`
  - `node --check scripts/package-crx-build-profile.js`
  - `node --check scripts/package-crx-release.js`

## 2026-06-04（beta 构建、隐藏解锁与 Lightwheel 可见性收口）

- 扩展新增共享构建元信息：
  - `extension/shared/build-meta.js`
  - `public / beta` 发行通道
  - beta 解锁口令 hash 与默认 beta 后端地址注入能力
- `extension/shared/constants.js` 与 `extension/shared/storage.js` 当前已补齐：
  - `releaseChannel`
  - `betaUnlocked / betaUnlockedAt / betaBackendBaseUrl`
  - `Beta 服务器` 后端模式
  - `Lightwheel` 作为 beta 平台的统一可见性判断
- options 当前已接入 beta 隐藏解锁：
  - 连续点击左上角品牌图片 `7` 次后可输入 beta 口令
  - 解锁成功后把状态保存到本地缓存
  - 当前页面直接增量显示 beta 平台、beta 脚本与 `Beta 服务器`
  - 退出 beta 模式时会清空解锁态，并把当前全局后端模式从 `beta` 回退到正式服务器
- popup 当前已修正 `Lightwheel` 命中口径：
  - 正式包不显示
  - beta 包未解锁不显示
  - beta 包已解锁但 `Lightwheel` 被禁用时也不显示
- 打包脚本当前已支持双构建：
  - `public`：继续产出 `annotation-script-center-v<version>.crx`、`ZIP`、`update.xml`、`crx-latest.json`
  - `beta`：产出单一 `annotation-script-center-beta.zip`
  - beta 构建会写入 `version_name=beta`，并通过临时构建目录注入 build meta；public 构建会过滤 `Lightwheel` host 权限
- 本轮验证：
  - `node --test extension/shared/constants.release.test.js scripts/package-crx-build-profile.test.js`
  - `node --test extension/options/options-workbench-state.test.js platform-resources/backend/admin-download-center/releases.test.js`
  - `node --check extension/shared/constants.js`
  - `node --check extension/shared/storage.js`
  - `node --check extension/options/options.js`
  - `node --check extension/popup/popup.js`
  - `node --check extension/background/service-worker.js`
  - `node --check scripts/package-crx-release.js`
  - `node -`（解析 `extension/manifest.json` 并确认所有依赖 `shared/constants.js` 的 content script 都先加载 `shared/build-meta.js`）

## 2026-06-04（beta 构建与隐藏解锁方案设计）

- 新增 `docs/superpowers/specs/2026-06-04-beta-build-and-hidden-unlock-design.md`，用于收口 `v0.4.0` 的正式包 / beta 包方案。
- 本轮设计固定以下边界：
  - 正式包与 beta 包共用主代码，不长期分叉
  - `脚本下载中心` 只展示正式包，beta 包只通过“查看外部目录”获取
  - beta 包默认界面与正式版一致，只有“隐藏交互 + 口令”解锁后才增量显示 beta 平台、beta 脚本与 `Beta 服务器`
  - popup / 右上角命中提示不能只看 URL，必须复用统一可见性状态；beta 平台被禁用后也不得继续显示命中
- 当前以 `Lightwheel` 作为 beta 平台示例，明确了功能面板、脚本详情、命中检测与系统管理的统一过滤口径。

## 2026-06-04（LabelX 局部覆盖导出 + 系统仪表盘文件日志）

- Alibaba LabelX ASR 转写 / ASR 快判的 `forceReplaceByBatchId` 语义改为“局部覆盖当前人员”：
  - 后端继续以 `分包ID` 归并 CSV 行，但不再按 `replaceBatchIds` 删整行重建
  - 转写只覆盖当前 `label / audit` 角色列，快判只覆盖命中的标注员槽位或审核列
  - 空字段不再把旧值清空，避免按人分批导出时把同分包其他列覆盖掉
- 首页手动补传入口统一改名为“补传并覆盖当前人员”：
  - 仅在首页手动上传且本轮 `skippedCompleteCount > 0` 时显示
  - 详情页继续不提供该入口
  - 上传提示文案同步改成局部覆盖语义，不再显示“删除旧行”
- 系统管理 `?view=admin&tab=overview` 重新扩成三块：
  - 模型池占用
  - 最近 `24` 小时日志统计概况
  - 最近运行日志（默认近 `20` 条）
- 后端运行日志改为文件持久化：
  - `platform-resources/backend/runtime-log-store.js` 继续保留内存最近项，同时把后台操作 / 运维事件按天写入 `platform-resources/backend/admin-dashboard/runtime-data/runtime-YYYY-MM-DD.jsonl`
  - 文件默认保留 `7` 天；PM2 重启后仍可读取近 `7` 天应用日志，但不会直接读取 PM2 stdout/stderr
  - 仪表盘自动刷新成功事件不落持久日志，避免被 `60` 秒轮询刷满
- 本轮验证：
  - `node --test platform-resources/alibaba-labelx/asr-transcription/backend/payload-merge.test.js platform-resources/alibaba-labelx/asr-judgement/backend/payload-merge.test.js platform-resources/backend/runtime-log-store.test.js platform-resources/backend/admin-dashboard/overview.test.js platform-resources/backend/admin-dashboard/runtime-logs.test.js`

## 2026-06-03（功能面板拖拽交互细修）

- `extension/options/` 继续只调整功能面板前端交互，不改后端接口和脚本设置 schema。
- 功能面板编辑顺序当前去掉了独立拖动手柄：
  - 进入编辑模式后，可直接按住整个平台区块开始拖动
  - 平台内按钮与入口标签在编辑态下自动退为不可点击，避免误触
- 平台排序的跟手浮层改成直接使用真实平台卡片：
  - 拖动时能看到当前平台板块跟随鼠标移动
  - 原位置继续保留占位块
  - 在目标区域停留约 `0.2s` 后，周围平台块自动让位
- 文档已同步更新为“整块拖动 + 真实卡片跟手”的口径。

## 2026-06-02（功能面板三列脚本卡与详情页双轨工作台精修）

- `extension/options/` 继续收口功能面板与脚本详情页前端结构，不改后端接口与脚本设置 schema。
- 功能面板平台区块继续保留“左侧平台摘要 + 右侧脚本区”，但右侧脚本区当前已改成真正的流式脚本卡布局：
  - 宽屏每行最多 `3` 个脚本卡
  - 中屏回落为 `2` 列
  - 窄屏回落为 `1` 列
  - 每张脚本卡继续保留“上层操作 + 下层项目备注”，其中 `项目备注` 改成更柔和的底栏式说明板块
- 详情页当前从共享等高 grid 改成“两条独立纵轨”：
  - 左轨承载 `基础设置` 与下方 `快捷键`
  - 右轨承载 `AI 设置`
  - 右侧 AI 面板按自身内容自然增高，不再为了适配左侧而被拉成长白板
  - 只剩一个板块时继续保持左半宽
- 平台排序交互从原生 `drag/drop` 升级为自定义拖拽：
  - 编辑模式下拖动整个平台区块时，卡片会跟随鼠标移动
  - 原位置保留占位块
  - 进入目标区域停留约 `0.2s` 后，周围平台区块自动让位并带纵向滑移动画
  - 临近页面上下边缘时自动滚动，松手后继续把排序保存到 `settings.meta.publicCenterPlatformOrder`
- 本轮验证：
  - `node --check extension/options/options.js`
  - `node --check extension/options/options-workbench-state.js`
  - `node --check extension/shared/storage.js`
  - `node --test extension/options/options-workbench-state.test.js extension/options/options-route-state.test.js`

## 2026-06-02（功能面板排序编辑与详情页层叠工作台精修）

- `extension/options/` 继续收口公开页与详情页：
  - 左侧导航、当前视图和公开页 hero 文案统一从 `公开脚本中心` 改为 `功能面板`
  - 英文 kicker 从 `PUBLIC SCRIPT CENTER` 改为 `FUNCTION PANEL`
- 功能面板新增平台排序编辑能力：
  - 顶部新增 `编辑顺序 / 完成编辑`
  - 默认浏览态不可拖动
  - 编辑态下仅允许拖动整个平台区块上下重排
  - 通过 `settings.meta.publicCenterPlatformOrder` 持久化本机 UI 顺序
  - 拖动时为相邻平台区块提供上下滑移与吸附指示，`prefers-reduced-motion` 下自动降级
- 平台入口展示与跳转当前优先走显式字段：
  - `标贝易采` -> `datafactory.data-baker.com/v2`
  - `Abaka AI` -> `abao.fortidyndns.com:30473`
- 功能面板平台区块当前收口为三层结构：
  - 顶层平台身份区
  - 中层脚本操作区
  - 底层整行浅蓝“项目备注”
- 脚本详情页进一步改成层叠工作台：
  - 启停区继续整宽置顶
  - `基础设置` 作为左侧主轨
  - `AI 设置` 作为右侧高栏
  - `快捷键` 作为基础设置下方独立长带
  - 缺失某块时其余板块自动前移；只剩单块时保持左半宽
- 本轮验证：
  - `node --check extension/options/options-workbench-state.js`
  - `node --check extension/options/options.js`
  - `node --check extension/shared/constants.js`
  - `node --check extension/shared/storage.js`
  - `node --test extension/options/options-workbench-state.test.js extension/options/options-route-state.test.js`
  - 真实扩展页静态复查：
    - `?view=center`
    - `?view=script&script=transcription`
    - `?view=script&script=lightwheelViewPanel`

## 2026-06-02（公开中心脚本卡两层化与详情页三板块重排）

- 继续收口 `extension/options/` 的公开脚本中心与脚本详情页：
  - 每个脚本卡改成“上层左右信息 + 下层整行项目备注”的两层结构。
  - `项目备注` 统一改成浅蓝中性整行板块，不再塞在左右主布局中。
  - 平台域名入口不再只按 `matches` 推导；当前优先读取平台显式 `displayHost / entryUrl`，并在新标签页打开。
- 用户可见名称与入口地址统一：
  - `阿里ASR语音转写` -> `普通话语音转写`
  - `阿里ASR语音判别` -> `普通话语音判别`
  - `Abaka AI` 入口显示与跳转统一为 `abao.fortidyndns.com:30473`
  - `标贝易采` 入口显示与跳转统一为 `datafactory.data-baker.com/v2`
- 脚本详情页当前改成三板块工作台：
  - 启停区继续整宽置顶
  - 启停区下方固定按 `基础设置 -> AI 设置 -> 快捷键` 顺序进入两列网格
  - 共享 AI 配置继续复用 `detail-shared-asr-ai-panel`
  - Task21 的 AI 调试区从基础设置中拆出，改成独立 `AI 设置` 板块
  - 转写、判别、标贝易采、Magic Data、Aishell、Abaka 的快捷键区已从基础设置中拆出，变成独立快捷键板块
- 样式同步收口：
  - 统一三类详情面板的间距、内边距、输入框/下拉框/textarea 尺寸与边框风格
  - 快捷键面板改为更清晰的列表式卡片布局，减少连续白板堆叠感
- 本轮验证：
  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --check extension/shared/constants.js`

## 2026-06-02（公开下载页独立与详情页左右工作台收口）

- options 左侧导航新增公开 `脚本下载中心`：
  - 新路由 `?view=downloads`
  - 公开可进入，不要求系统管理密码
  - 旧 `?view=admin&tab=downloads` 当前自动回落到 `?view=admin&tab=exports`
- 两个右上角“脚本下载中心”按钮移除；公开下载能力不再挂在 hero 右上角。
- 系统管理页签从 `下载中心` 改为 `数据导出`：
  - 只保留项目数据下载
  - 只保留 AI 请求记录导出
  - 扩展版本下载完全移出后台
- 公开脚本中心平台卡继续收口：
  - 删除“当前平台脚本统一收口到功能面板...”说明性正文
  - 删除脚本卡底部“匹配入口 / 入口”元信息
  - 脚本备注区改为单块 `项目备注`
  - `script.note + script.description` 同时存在时合并成一段简要功能说明
- 脚本详情页重排为真正的工作台布局：
  - 启停操作单独置顶为整宽卡片
  - 下方固定为“左侧基础设置 / 右侧 AI 设置”
  - 没有 AI 设置的脚本自动隐藏右栏，基础设置占满整行
- 扩展版本列表接口 `GET /api/admin/download-center/releases` 当前改为公开可读，供公开下载页直接读取。
- 本轮验证：
  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --check platform-resources/backend/admin-download-center/routes.js`
  - `node --check platform-resources/backend/admin-download-center/releases.js`
  - `node --test extension/options/options-route-state.test.js`
  - `node --test platform-resources/backend/admin-download-center/releases.test.js`

## 2026-06-02（公开脚本中心入口与下载中心版本选择优化）

- 公开脚本中心平台摘要中的域名标签改为可点击入口：
  - 按平台 `matches` 的第一个 URL 模式推导根域名
  - 保留协议与端口
  - 点击后在新标签页打开，不打断当前 options 工作台
- 公开脚本中心脚本卡中部文案区改成“项目备注 / 当前功能”视图：
  - 优先显示 `script.note`
  - `note + description` 同时存在时拆成“两段式备注”
  - 只有 `description` 时自动回退为单段说明
- 系统管理“下载中心”新增扩展版本下载面板：
  - 默认突出最新版 CRX
  - 历史版本改为下拉框选择
  - 当前选中版本按存在性展示 `CRX` 主下载按钮和可选 `ZIP` 次下载按钮
  - 面板保留“打开外部目录”作为兜底入口
- 统一后端新增 `GET /api/admin/download-center/releases`：
  - 聚合 `annotation-script-center-crx-latest.json`
  - 解析远端 `/downloads/` 目录页中的历史 `annotation-script-center-v*.crx/.zip`
  - 目录索引抓取失败时回退为“仅返回最新版”
- 本轮验证：
  - `node --check extension/options/options.js`
  - `node --check platform-resources/backend/admin-download-center/releases.js`
  - `node --check platform-resources/backend/admin-download-center/routes.js`
  - `node --check platform-resources/backend/registry.js`
  - `node --check platform-resources/backend/app.js`
  - `node --test platform-resources/backend/admin-download-center/releases.test.js platform-resources/backend/admin-dashboard/overview.test.js extension/options/options-route-state.test.js`

## 2026-06-02（模型池占用改为中文状态卡，并切换为 999 总容量语义）

- 系统管理仪表盘继续只保留“模型池占用”，但前端不再显示 `活跃 x / y · 排队 z` 技术文案。
- 模型池展示现改为中文状态卡：
  - `正在处理`
  - `等待处理`
  - `池容量`
  - `剩余可接收`
  - 辅助状态统一为 `当前占用 / 当前空闲 / 后端池已满`
- 后端 `model:*` 共享模型池语义改为：
  - 单个模型池总容量默认 `999`
  - 总容量 = `activeCount + pendingCount`
  - 达到 `999` 后立即返回 `provider-queue-full`
  - 请求继续按 FIFO 顺序排队，并保持 `50ms` 一次发出机会
- 新增/更新测试：
  - provider queue 默认模型池容量断言改为 `999`
  - 补充“第 1000 个请求拒绝”和“FIFO + 50ms 发起顺序”测试
  - 额外执行 65 秒后端存活验证，确认不是只启动成功

## 2026-06-02（系统仪表盘收缩为模型池占用）

- 问题背景：
  - 用户反馈系统管理仪表盘持续空白，并上传了服务器控制台日志。
  - 日志显示后端在启动后约 1 分钟内出现 `JavaScript heap out of memory` 并被 PM2 反复拉起。
- 本次收口：
  - 前端 `?view=admin&tab=overview` 只保留“模型池占用”卡片，移除失败摘要、趋势、调用排行、脚本摘要与运行日志展示。
  - 前端仪表盘只请求 `GET /api/admin/dashboard/overview`，不再额外请求运行日志接口。
  - 后端 `admin-dashboard/overview` 改成轻量返回：只保留模型池 queue 快照、后端状态和下载中心摘要，不再聚合 AI 调用统计。
- 验证：
  - 运行 `node --test platform-resources/backend/admin-dashboard/overview.test.js` 通过。
  - 额外执行临时 60 秒 soak 测试与 65 秒后端存活测试，确认聚合函数与后端进程都能稳定运行超过 1 分钟；验证后已删除临时测试文件。

## 2026-06-02（系统仪表盘接入后端聚合与运行日志）

- 继续完善 `extension/options/` 的系统管理仪表盘：
  - 将原来的“运行统计”并入 `?view=admin&tab=overview`，不再保留独立页签
  - 仪表盘统一展示模型池占用、失败摘要、近 14 天趋势、调用人排行、脚本统计和最近运行日志
  - 顶部“刷新数据”继续保留，同时新增每 `60` 秒自动刷新一次的前端轮询
  - 旧 `?view=admin&tab=stats` 链接回退到 `overview`
- 后端新增系统管理运行日志能力：
  - 新增 `platform-resources/backend/runtime-log-store.js` 作为轻量内存日志缓冲
  - 新增 `GET /api/admin/dashboard/runtime-logs`
  - 管理员登录、仪表盘刷新、项目数据下载、AI 调用日志导出和后端启动都会写入运行日志
- 根据线上日志追加热修：
  - 发现 `GET /api/admin/dashboard/overview` 在高日志量环境下会触发 Node `heap out of memory`
  - 根因是仪表盘刷新时对多个脚本执行全量 `all-time summarize`
  - 当前改为只聚合“今日 + 最近 14 天”窗口，避免 PM2 因内存溢出反复重启
- 同步更新：
  - `README.md`
  - `extension/README.md`
  - `platform-resources/backend/README.md`
- 本轮验证：
  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --check platform-resources/backend/admin-dashboard/routes.js`
  - `node --check platform-resources/backend/runtime-log-store.js`
  - `node --check platform-resources/backend/project-data-download/routes.js`
  - `node --check platform-resources/backend/ai-call-log-download/routes.js`
  - `node --test platform-resources/backend/admin-dashboard/overview.test.js platform-resources/backend/admin-dashboard/runtime-logs.test.js platform-resources/backend/runtime-log-store.test.js extension/options/options-route-state.test.js`

## 2026-06-01（Options 二次收口：显式保存 + 双栏详情页）

- 按最新 0.4.0 收口方案继续优化 `extension/options/`：
  - 系统管理页 hero 右上角主按钮统一改为“脚本下载中心”，不再在 admin 路由显示“返回公开中心”。
  - `?view=admin&tab=backend` 主内容区改为只保留“后端接口地址”；切换服务器 / 本机后点击按钮才写入本地缓存。
  - 左侧固定侧栏新增 `AI 调用使用人` 编辑卡：输入姓名后点击按钮才保存到本地缓存；运行概况继续保留只读摘要。
  - 脚本详情页统一改成左右双栏：左侧保留脚本业务设置、启停和快捷键，右侧优先承载 `ASR 语音 AI 设置`；没有 AI 参数的平台才显示统一说明卡。
  - 取消 ASR / AI 设置的“连续点击标题 10 次解锁”旧交互；快判、转写、标贝易采、Magic Data、Aishell 的 AI 参数当前默认直接展示。
  - Task21 助手的 AI 调试设置当前也默认常显，不再通过标题点击解锁。
- 同步更新：
  - `README.md`
  - `extension/README.md`
- 本轮验证：
  - `node --check extension/options/options.js`
  - `chrome-extension://.../options/options.html?view=admin&tab=backend`
  - `chrome-extension://.../options/options.html?view=script&script=judgement`
  - `chrome-extension://.../options/options.html?view=script&script=dataBakerRoundOneQuality`

## 2026-06-01（Options 细节视觉收口）

- 按最新人工反馈继续收口 `extension/options/` 的细节表现：
  - 左上角品牌方块不再显示 `ASC` 文字，改为复用 `extension/assets/brand/asc-logo.svg`
  - 左侧侧栏移除“页面边界”说明卡，品牌区版本文案统一改成 `浏览器扩展 v<version>`
  - 公开脚本中心右上角主按钮从“系统管理”改为直接打开“脚本下载中心”外链
  - 平台摘要不再显示“生效 x / y”，改为显示“当前启用 / 默认启用”脚本名
  - 单个脚本卡不再显示重复 URL pill，匹配入口统一改成“默认平台地址”
  - 系统管理页移除 hero 下方重复的独立 banner，把刷新 / 返回 / 退出动作并入后台内容工具条
- 同步更新：
  - `README.md`
  - `extension/README.md`
- 本轮验证：
  - `node --check extension/options/options.js`

## 2026-06-01（Options 宽度自适应修正）

- 修正 `extension/options/options.css` 的页面宽度策略：
  - 去掉 `.page` 的固定 `max-width` 限制，改为占满当前浏览器窗口宽度
  - `workspace-shell` 改为固定可读侧栏 + 自适应主内容区
  - 平台摘要列和脚本卡网格改为更柔性的 `minmax(...)` 宽度
  - 大屏下主内容区不再缩在中间，小屏断点行为保持不变
- 同步更新：
  - `README.md`
  - `extension/README.md`
- 本轮验证：
  - `node --check extension/options/options.js`
  - 真实扩展页 `?view=center` 与 `?view=admin&tab=overview` 静态打开检查

## 2026-06-01（Options 浅色运营后台色板校正）

- 根据最新视觉参考，将 `extension/options/options.css` 的工作台覆盖层从深蓝渐变仪表盘色板切换为浅色运营后台色板：
  - 页面底色改为浅灰蓝 + 微弱暖色高光
  - 左侧导航改为白底卡片、浅蓝选中态与轻边框
  - 公开中心 hero、平台摘要、脚本卡、详情头部、系统管理 banner 全部收口为白底/浅蓝高亮方案
  - 保留现有布局、路由和功能，不改后端接口、不改脚本详情字段结构
- 同步更新文档口径：
  - `README.md`
  - `extension/README.md`
- 本轮验证继续覆盖：
  - `node --check extension/options/options.js`
  - 真实扩展页 `?view=center` 与 `?view=admin&tab=overview` 静态快照复查

## 2026-05-31（0.4.0 Options 工作台视觉重做）

- 按“首版视觉方向”的工作台口径重做 `extension/options/`：
  - 外层改为左侧固定导航 + 右侧工作台内容区
  - 公开脚本中心主视觉改为深色仪表盘风格，不再保留旧首页的轻量信息卡观感
  - 平台区块改成“平台摘要侧栏 + 脚本功能卡矩阵”结构，脚本卡只保留启停、详情和目标路由等核心信息
  - 系统管理页继续承载 `仪表盘 / 后端设置 / 下载中心 / 运行统计`，并与新的工作台壳层统一
- 当前已将 `extension/manifest.json` 版本从 `0.3.7` 提升到 `0.4.0`，用于承接本轮 options 视觉与信息架构升级。
- 同步更新版本与规则口径：
  - `README.md`
  - `extension/README.md`
  - `docs/rules/project-collaboration-rules.md`
  - `AGENTS.md`
- 本轮验证继续覆盖：
  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --test platform-resources/backend/admin-auth.test.js platform-resources/backend/admin-dashboard/overview.test.js platform-resources/backend/project-data-download/__tests__/request-auth.test.js platform-resources/backend/ai-call-log-download/request-auth.test.js extension/options/options-route-state.test.js`
- 真实 Chrome / Edge 的扩展 UI 验收仍需手工完成；当前自动化浏览器接入能力仍不足以直接替代扩展真机验收。

## 2026-05-31（0.3.8 Options 后台重构首版）

- options 入口当前保留 `extension/options/options.html` 单页，但正式切换为 query 路由：
  - `?view=center`
  - `?view=script&script=<scriptId>`
  - `?view=admin&tab=overview|backend|downloads|stats`
- 前端完成“公开脚本中心 + 受保护系统管理”两层结构首版重构：
  - 公开脚本中心只保留平台卡、脚本状态、启停入口与脚本详情入口。
  - 原首页的后端设置、项目数据下载、AI 请求记录导出全部迁入系统管理页。
  - 系统管理页固定 4 个页签：`仪表盘 / 后端设置 / 下载中心 / 运行统计`。
  - 新增 `extension/options/options.css`，把原 `options.html` 内联大样式外提，并统一公开中心、脚本详情页和后台工作台视觉壳层。
  - 新增 `extension/options/options-route-state.js`，集中处理 options 路由解析与 href 构造。
- 系统管理页当前接入密码门禁与会话恢复：
  - 页面内优先使用 `sessionStorage`
  - 勾选“记住本次浏览器会话”时额外镜像到 `chrome.storage.session`
  - 会话失效后自动退回密码门禁
- 统一后端新增系统管理接口与鉴权 helper：
  - `POST /api/admin/session/unlock`
  - `GET /api/admin/dashboard/overview`
  - `platform-resources/backend/admin-auth.js` 统一处理密码 hash 校验、Bearer token 读取和会话 token 校验
- 仪表盘当前聚合内容：
  - 统一模型池 / provider queue 占用
  - 脚本级 AI 调用汇总
  - 今日失败错误码摘要
  - 下载中心快捷摘要
- `POST /api/admin/project-data-download/request` 与 `POST /api/admin/ai-call-log/request` 当前已支持双鉴权：
  - 旧模式：body `password`
  - 新模式：`Authorization: Bearer <admin-session-token>`
- 新增测试：
  - `platform-resources/backend/admin-auth.test.js`
  - `platform-resources/backend/admin-dashboard/overview.test.js`
  - `platform-resources/backend/project-data-download/__tests__/request-auth.test.js`
  - `platform-resources/backend/ai-call-log-download/request-auth.test.js`
  - `extension/options/options-route-state.test.js`
- 本轮验证：
  - `node --check extension/options/options.js`
  - `node --check extension/options/options-route-state.js`
  - `node --check platform-resources/backend/admin-auth.js`
  - `node --check platform-resources/backend/admin-session/routes.js`
  - `node --check platform-resources/backend/admin-dashboard/overview.js`
  - `node --check platform-resources/backend/admin-dashboard/routes.js`
  - `node --check platform-resources/backend/project-data-download/routes.js`
  - `node --check platform-resources/backend/ai-call-log-download/routes.js`
  - `node --test platform-resources/backend/admin-auth.test.js platform-resources/backend/admin-dashboard/overview.test.js platform-resources/backend/project-data-download/__tests__/request-auth.test.js platform-resources/backend/ai-call-log-download/request-auth.test.js extension/options/options-route-state.test.js`
- 真实浏览器自动化静态验收未完成：本机 Edge 远程调试端口当前返回 `403 Forbidden`，Playwright 无法接入；扩展的最终 UI/门禁/导出流程仍需在真实 Chrome / Edge 中加载 unpacked extension 后手工验收。

## 2026-05-31（发布：v0.3.7）

- 确认 `extension/manifest.json` 当前版本为 `0.3.7`，本轮不再提升到 `0.3.8`。
- 将 `0.3.7` 作为当前阶段最终版本收尾，后续新的开发 / 修复 / 优化进入 `0.3.8` 周期。
- 本轮按发布口径生成 CRX 发布产物：
  - `dist/annotation-script-center-v0.3.7.crx`
  - `dist/annotation-script-center-v0.3.7.zip`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- 本轮追加 Git tag：
  - `v0.3.7`
- 后续版本完成时，统一保留“提交 main + 生成发布产物 + 打版本 tag + 推送 tag”的发布流程，用于稳定下载和版本回溯。

## 2026-05-28（统一 AI 请求记录查看入口）

- 统一后端新增 `platform-resources/backend/ai-call-log-download/`，提供：
  - `GET /api/admin/ai-call-log/options`
  - `POST /api/admin/ai-call-log/request`
  - `GET /api/admin/ai-call-log/file?token=...`
  - `HEAD /api/admin/ai-call-log/file?token=...`
- 统一导出范围当前覆盖：
  - DataBaker 一检 AI
  - Aishell Tech 闽南语助手 AI
  - Magic Data 客家话 / 闽南语助手 AI
  - LabelX 快判 / 转写 AI
  - Abaka Task21 AI
- options 首页隐藏高级区新增“AI 请求记录”面板，交互方式与“项目数据下载”一致：
  - 连续点击“后端接口地址”标题 10 次后显示
  - 填写获取人姓名
  - 选择脚本类型
  - 可选填写开始日期 / 结束日期；留空则导出当前脚本全部记录
  - 输入下载密码后导出 CSV
- `platform-resources/backend/project-data-download/jwt.js` 当前已扩展为可复用 token 工具，支持不同错误码前缀。
- `GET /api/admin/ai-call-log/options` 当前只返回脚本 `id/label`，不提前暴露日志存在性、文件数和日期范围。
- AI 请求记录下载审计目录当前落在 `platform-resources/backend/audit-data/ai-call-log-download/`，并已加入 `.gitignore`。
- 顺手修正 `platform-resources/magic-data/minnan-helper/backend/ai-call-log.js` 对 `ai-service.js` 的循环依赖，避免统一导出入口加载时刷 warning。

## 2026-05-28（统一 AI jobs 默认链路与模型池补齐）

- DataBaker 私有 `backend/ai-job-store.js` 已改成公共 `platform-resources/backend/ai-framework/runtime/ai-job-store.js` 的适配层，不再独立维护一套 job store 逻辑。
- 后端新增 `platform-resources/backend/ai-framework/runtime/ai-runtime-meta.js`，统一给 health/defaults 暴露：
  - 默认请求模式：`POST /jobs` + 轮询 `GET /jobs/:jobId`
  - 公共 job store 快照
  - 按具体模型名共享池的默认策略
- DataBaker 默认前端错峰从 `30ms` 调整为 `50ms`，确保默认 1 秒内发出的建任务请求不超过 `20` 次。
- Aishell、Magic Data、LabelX、Abaka 的 health/defaults 也已补齐 jobs / runtime 元信息，方便前端和运维确认当前默认链路是否已切到 jobs。

## 2026-05-28（全量 AI 脚本接入调用日志与统计）

- 新增共享日志核心：
  - `platform-resources/backend/ai-call-log/schema.js`
  - `platform-resources/backend/ai-call-log/sanitizer.js`
  - `platform-resources/backend/ai-call-log/csv-writer.js`
  - `platform-resources/backend/ai-call-log/index.js`
- `platform-resources/backend/ai-framework/core/create-ai-route.js` 当前已统一补上：
  - `aiUsageOperatorName` 后端必填校验
  - 成功 / 失败默认写共享 AI 调用日志
- 以下 AI 脚本当前都已默认写脚本级 CSV，并补齐统计接口：
  - DataBaker：`/api/data-baker/round-one-quality/ai/recommend/logs/summary`
  - Aishell Tech：`/api/aishell-tech/minnan-helper/ai/recommend/logs/summary`
  - Magic Data 客家话：`/api/magic-data/hakka-helper/ai/review-current/logs/summary`
  - Magic Data 客家话 legacy：`/api/magic-data/annotator/ai/review-current/logs/summary`
  - Magic Data 闽南语：`/api/magic-data/minnan-helper/ai/review-current/logs/summary`
  - LabelX 快判：`/api/alibaba-labelx/asr-judgement/ai/suggest/logs/summary`
  - LabelX 转写：`/api/alibaba-labelx/asr-transcription/ai/suggest-current/logs/summary`
  - Abaka Task21：`/api/abaka-ai/task21/ai/analyze/logs/summary`
- 各脚本日志目录：
  - DataBaker：`platform-resources/data-baker/round-one-quality/backend/logs/`
  - Aishell Tech：`platform-resources/aishell-tech/minnan-helper/data/runtime/`
  - Magic Data 客家话：`platform-resources/magic-data/hakka-helper/backend/logs/`
  - Magic Data 闽南语：`platform-resources/magic-data/minnan-helper/backend/logs/`
  - LabelX 快判：`platform-resources/alibaba-labelx/asr-judgement/backend/logs/`
  - LabelX 转写：`platform-resources/alibaba-labelx/asr-transcription/backend/logs/`
  - Abaka Task21：`platform-resources/abaka-ai/task21/backend/logs/`

## 2026-05-28（Aishell Tech 默认配置改为速度优先组合）

- 将希尔贝壳 / Aishell Tech 闽南语助手默认配置统一改为：
  - `two_stage`
  - `direct_dialect`
  - `qwen3.5-omni-flash`
  - `qwen3.5-flash`
- 覆盖范围：
  - 前端共享默认配置：`extension/shared/constants.js`
  - Aishell 运行时 fallback 默认值：`extension/sites/aishell-tech/minnan-helper/content.js`
  - Aishell 后端 `defaults/health` 与请求归一默认值：`platform-resources/aishell-tech/minnan-helper/backend/config.js`、`platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`
- 目的：
  - 当前口径偏速度优先，减少默认落到 `mandarin_to_dialect + qwen3.5-plus` 的较慢组合。

## 2026-05-28（Aishell Tech 前端显示名切换为“希尔贝壳”，并收口 AI 错误展示）

- 仅调整前端用户可见文案，不改内部平台 ID、文件夹名、接口路径、后端注册名或 URL：
  - `extension/shared/constants.js`
  - `extension/popup/popup.js`
  - `extension/options/options.html`
  - `extension/options/options.js`
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js`
- Aishell 前端新增共享错误展示模块：
  - 新增 `extension/shared/ai-error-display.js`
  - 当前先接入 `extension/sites/aishell-tech/minnan-helper/diagnostics.js` 与 `ui-panel.js`
- 当前错误展示口径：
  - 系统/网络类错误：不再把 `health/defaults/queue` 等大对象整包塞给用户；改为中文摘要 + 精简 JSON，保留接口地址、health 状态、原始异常和排查建议。
  - AI/上游模型类错误：继续完整保留后端原始返回，同时增加“错误解读 / 可能原因”。
  - `429 + limit_burst_rate` 统一解释为“上游模型限流 / 请求增长过快”。
  - 只有 `400 + Arrearage` 才解释为“账号欠费或余额不足”；其他 `400` 不再误判为余额问题。

## 2026-05-28（AI 默认超时统一收紧到 60 秒，并清理 AI 测试文件口径）

- 按项目新口径，将仓库内 AI / 模型默认超时从 `120000ms` 统一收紧到 `60000ms`：
  - 前端默认配置、options、storage 和各平台 AI client fallback 全部改为 `60000ms`
  - 后端公共 AI config、Aishell 独立链路、DataBaker、Magic Data、Abaka、LabelX 的默认 AI timeout 与超时报错文案统一改为 `60s`
  - 历史兼容 DataBaker AI job timeout 默认值同步改为 `60000ms`
- 同步更新当前生效文档：
  - `AGENTS.md`
  - 根 `README.md`
  - `config/env/ai.env.example`
  - 各平台 AI 相关 README
- `AGENTS.md` 新增规则：
  - AI / 模型相关 `*.test.js` 默认视为临时验证文件，验证完成后删除，不作为长期仓库资产保留，除非当前 Prompt 明确保留。
- 本轮已在验证后删除一批 AI 相关 `*.test.js`：
  - Aishell 前后端临时测试
  - AI framework / provider 临时测试
  - Abaka / LabelX / DataBaker / Magic Data 的 AI adapter 临时测试

## 2026-05-28（Aishell Tech recommend 路由修复 request.close 误判断连）

- 修复 `platform-resources/aishell-tech/minnan-helper/backend/ai-routes.js`：
  - 生命周期取消监听不再把 `request.close` 当成客户端断开。
  - 只保留 `request.aborted` 和 `response.close` 作为真实断连信号。
- 背景：
  - `request.close` 在请求体正常读完后也可能触发，会把仍在执行中的 recommend 请求误判为已断开。
  - 误判后后端可能直接放弃返回 JSON，前端就会只看到 `TypeError: Failed to fetch`，即使 `health` 仍然可达。
- 新增测试 `Aishell ai-routes should not treat request close after body end as client disconnect`，覆盖“请求体正常结束后触发 close，路由仍应继续返回成功响应”。

## 2026-05-28（Aishell Tech 同步超时口径统一回 120 秒）

- 根据当前项目统一规则，Aishell 不再单独维持 60 秒同步超时。
- 更新：
  - `platform-resources/aishell-tech/minnan-helper/backend/config.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-routes.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/pipeline.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`
- 当前 Aishell health/defaults 与后端运行时统一回 `120000ms`。
- 同步更新：
  - `platform-resources/aishell-tech/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/minnan-helper/backend/README.md`

## 2026-05-28（全项目固定关闭 thinking，并拆出 Aishell 独立 DashScope Omni 客户端）

- 统一关闭全仓库 AI thinking：
  - `platform-resources/backend/ai/providers/qwen-openai-compatible.js`
  - `platform-resources/data-baker/round-one-quality/backend/ai-client-qwen-legacy.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-client-qwen.js`
  - `platform-resources/alibaba-labelx/asr-judgement/backend/ai-client-qwen.js`
  - `platform-resources/magic-data/hakka-helper/backend/ai-client-qwen.js`
  - `platform-resources/magic-data/minnan-helper/backend/ai-client-qwen.js`
  - `platform-resources/abaka-ai/task21/backend/ai-client.js`
  - `platform-resources/abaka-ai/task21/backend/ai-analyze-request.js`
  - 以上链路现在都强制 `enable_thinking=false`，不再允许通过前端配置或旧环境变量重新开启。
- Aishell Tech 补充独立 Omni 客户端：
  - 新增 `platform-resources/aishell-tech/minnan-helper/backend/dashscope-omni-client.js`，直接按 DashScope compatible-mode 构造 `input_audio` 流式请求。
  - `pipeline.js` 改为优先使用这个独立客户端处理 Aishell Omni 听音/单模型链路，不再让该平台继续跟共享 DataBaker Omni 口径耦合。
- options 口径同步收口：
  - `extension/options/options.js` 与 `extension/options/options.html` 现在会把 Aishell、DataBaker、Magic Data、Abaka、快判、转写的 thinking 开关统一显示为只读关闭。
  - 保存配置时也会强制写回 `false`，避免用户勾选后产生“已开启”的错觉。
- Aishell 前端请求层同步固定关闭：
  - `extension/sites/aishell-tech/minnan-helper/content.js`
  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js`
  - 两处都会显式发送 `enableThinking=false`，即使旧设置里保存过 `true` 也不会再透传。
- 补充测试：
  - `platform-resources/aishell-tech/minnan-helper/backend/dashscope-omni-client.test.js`
  - `platform-resources/backend/ai/providers/qwen-openai-compatible.test.js`
  - `platform-resources/abaka-ai/task21/backend/ai-analyze-request.test.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/pipeline.test.js`
  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.test.js`

## 2026-05-28（Aishell Tech 后端同步推荐链完全独立化）

- 重构 `platform-resources/aishell-tech/minnan-helper/backend/`：
  - 新增 `config.js / errors.js / cache.js / queue.js / pipeline.js`，把 Aishell 推荐链拆成独立配置、错误、缓存、队列和流水线模块。
  - `ai-service.js` 不再把 Aishell 请求转成 DataBaker recommend payload，也不再直接调用 DataBaker `recommend()`；改为输出 Aishell 自己的请求归一、默认 Prompt、health/defaults 与 `success + data + meta / success=false + error + meta` 契约。
  - `ai-routes.js` 改成 Aishell 自己的同步路由执行链：客户端断开、同步超时和手动 abort 统一透传到上游 provider；只有响应真正成功写回后才允许写成功缓存和成功日志。
  - `pipeline.js` 当前只复用公共 provider HTTP 工具，不再复用 DataBaker recommend orchestration；Aishell 队列组固定为 `aishell_qwen_omni / aishell_fun_asr / aishell_text_compare`。
  - 环境变量默认优先读取 `AISHELL_AI_*`，第一阶段仍允许只读回退旧的 `DATABAKER_AI_*`。
- 更新 `platform-resources/aishell-tech/minnan-helper/data/ai-call-log.js`：
  - CSV 新增取消态、阶段、听音耗时、比较耗时、排队等待、重试次数、缓存命中和流水线模式字段。
  - 日志读取新契约 `meta`，同时兼容旧的 `result.usage / result.timing / result.models` 字段。
- 更新前端 Aishell recommend 消费层：
  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js` 改为优先消费 `success/data/meta/error`，并向上兼容旧展示字段。
  - `extension/sites/aishell-tech/minnan-helper/diagnostics.js` 改为统一从 `meta` 展示排队等待、缓存命中和阶段信息。
- 更新 `platform-resources/aishell-tech/minnan-helper/ai/adapter.js`：
  - 对齐 Aishell 新请求归一与响应契约，去掉 DataBaker recommend 业务层耦合。
- 新增/更新测试：
  - `platform-resources/aishell-tech/minnan-helper/backend/pipeline.test.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-routes.test.js`
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js`
  - `platform-resources/aishell-tech/minnan-helper/ai/adapter.test.js`
  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.test.js`
  - `extension/sites/aishell-tech/minnan-helper/diagnostics.test.js`
- 同步更新 README：
  - `README.md`
  - `docs/platforms/index.md`
  - `extension/sites/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/README.md`
  - `platform-resources/aishell-tech/minnan-helper/README.md`
  - `platform-resources/aishell-tech/minnan-helper/backend/README.md`

## 2026-05-28（Aishell Tech AI 请求网络诊断与本机回退增强）

- 更新 `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js`：
  - 新增 Node 可测导出，补齐前端请求层测试入口。
  - 当前后端模式为“本机（127.0.0.1:3333）”且浏览器层请求失败时，会自动回退一次 `script.xiangtianzhen.store` 服务器接口；只影响当前请求，不改写用户 settings。
  - 若本机和服务器都无法连通，前端不再只显示笼统的“后端连接中断”，而是把 `backendMode / endpoint / fallbackEndpoint / originalErrorName / originalErrorMessage / online` 写入原始诊断 JSON。
  - 额外识别 `Extension context invalidated`，改为明确提示“扩展上下文已失效，请刷新当前业务页面后重试。”，避免继续误判成普通网络错误。
  - 成功请求会把本次实际使用的后端模式、endpoint 以及是否发生自动回退写入 `result.debug.client*` 字段，便于前端后续展示或排查。
- 更新 `extension/sites/aishell-tech/minnan-helper/diagnostics.js` 与测试：
  - “当前识别结果 / 查看详情”新增展示后端模式、后端地址、是否自动回退。
- 新增 `extension/sites/aishell-tech/minnan-helper/ai-recommendation.test.js`：
  - 覆盖“本机失败后自动回退服务器成功”。
  - 覆盖“本机与服务器都失败时返回详细网络诊断”。
  - 覆盖“扩展上下文失效时给出专门提示”。
- 继续增强 `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js`：
  - 当真实 `POST /recommend` 直接 `Failed to fetch` 时，前端会自动再探测一次 `/recommend/health`。
  - 如果 health 成功，会明确提示“服务器入口可达，但真实推荐请求在网络层被中断”，并把 `healthCheck` 结果写入原始诊断 JSON，帮助区分“入口挂了”还是“真实请求链路被重置/中断”。
- 更新 `extension/sites/aishell-tech/minnan-helper/README.md` 与 `platform-resources/aishell-tech/minnan-helper/README.md`：
  - 补充 Aishell 当前请求层的本机回退策略。
  - 补充浏览器层网络失败/扩展上下文失效时的原始诊断信息口径。
  - 补充 network fail 后自动补探 health 的口径。

## 2026-05-28（Aishell Tech 单独落地平台 AI 调用 CSV）

- 新增 `platform-resources/aishell-tech/minnan-helper/data/ai-call-log.js` 与测试：
  - 先不接统一日志核心，单独为 Aishell 生成平台专属 AI 调用 CSV 副本。
  - 默认落盘到 `platform-resources/aishell-tech/minnan-helper/data/runtime/ai-calls-YYYY-MM-DD.csv`。
  - 记录当前阶段最小公共信息：请求 ID、成功状态、耗时、输入/输出 token、总 token 兜底、AI 调用使用人、平台账号、Aishell 任务/分包/条目 ID、模型信息，以及脱敏后的原始返回/错误 JSON。
- 更新 `platform-resources/aishell-tech/minnan-helper/backend/ai-routes.js`：
  - Aishell recommend 成功和失败都会追加这份平台专属 CSV。
  - 当前仍保留 DataBaker 原有推荐链，不先动共享日志合并层。
- 更新 `.gitignore` 与 `platform-resources/aishell-tech/minnan-helper/data/README.md`：
  - `data/runtime/` 运行文件不提交 Git。

## 2026-05-28（Aishell Tech AI 请求补齐平台账号提取）

- 更新 `extension/sites/aishell-tech/minnan-helper/data-api.js`：
  - 新增头像区平台账号提取逻辑，优先读取 `.avatar-dropdown .user-name .hidden-xs-only`。
  - `ASmnbz001【标注人员】` 这类显示文本现在会先归一成纯账号 `ASmnbz001`。
  - 当前条与批量条目对象都会默认带上 `platformUserName`，`platformUserId` 当前保留空字符串。
- 更新 `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js`：
  - recommend 请求开始保留 `aiUsageOperatorName / platformUserName / platformUserId`。
  - 这 3 个字段会继续透传到 Aishell -> DataBaker recommend payload。
  - 若前端未单独提供 `annotatorName`，后端会把 `platformUserName` 作为 DataBaker 推荐链的 `annotatorName` fallback，便于沿用现有日志链路。
- 补齐测试：
  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 新增平台账号解析与 DOM 提取用例。
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 新增 AI 调用元数据透传与 `annotatorName` fallback 断言。

## 2026-05-28（Aishell Tech 批量切条误判热修）

- 修复 Aishell 批量识别里“左侧已切到目标条，但右侧仍被误判成未切换”的问题：
  - 真页复测发现 `.fileName-line` 的第一个 `span` 只有 `646:` 这类编号，完整文件名在同一行外层节点里，且右侧工具按钮也共用该行。
  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 不再只读取 `.fileName-line span`，改为优先从整行文本中提取 `编号: 文件名.wav`，再用于右侧表单对齐判断。
  - 这样即使平台把编号、文件名、`AI批量识别 / 停止批量` 等按钮混排在一行里，也不会再把正确切条误判成“右侧表单未完成切换”。
- 补齐测试：
  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 新增真实结构回归用例，覆盖“首个 span 只有编号、整行才有完整文件名”的场景。

## 2026-05-28（Aishell Tech 批量失败详情与 AI 诊断增强）

- 新增 `extension/sites/aishell-tech/minnan-helper/diagnostics.js`：
  - 抽出 Aishell 当前识别结果与批量失败项的诊断摘要逻辑。
  - 统一生成识别策略、模型选择、AI耗时、前端并发、token、FunASR provider、requestId、debugId 等展示字段。
  - 统一生成批量失败项的 `stage / stageLabel / detailRows / rawJson` 结构。
- 更新 `extension/sites/aishell-tech/minnan-helper/content.js`：
  - 批量失败清单不再只保留 `displayName + message`。
  - 现在会区分 `ai_request / select_task / save_current` 三类失败阶段。
  - AI 请求失败优先挂后端原始返回；切条/保存失败则保留对应链路上下文与 AI debug 信息。
- 更新 `extension/sites/aishell-tech/minnan-helper/ui-panel.js`：
  - “当前识别结果”区新增 AI 诊断信息展示。
  - 批量失败清单每条新增 `查看详情` 与 `查看原始JSON` 按钮。
  - `查看详情` 展开失败阶段、错误摘要、AI耗时、模型、并发、token 等字段。
  - `查看原始JSON` 展开该条完整失败上下文，便于人工定位问题。
- 更新 `extension/manifest.json`：
  - Aishell content script 注入序列新增 `sites/aishell-tech/minnan-helper/diagnostics.js`。
- 补齐测试：
  - 新增 `extension/sites/aishell-tech/minnan-helper/diagnostics.test.js`，覆盖当前结果诊断与批量失败项详情结构。

## 2026-05-28（Aishell Tech AI识别按钮不可点击热修）

- 修复 `AI识别` 注入按钮在页面上可见但不能点击的问题：
  - 根因是按钮直接继承了原生“保存”按钮的完整 class，宿主按钮上的 `is-disabled` 等禁用态样式会一起带过来，导致新按钮被 Element UI 的禁用规则拦截点击。
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 新增按钮 class 清洗与禁用态同步逻辑，注入时主动移除 `is-disabled`，并显式恢复 `pointer-events`。
  - 同时给 `AI识别 / AI批量识别 / 停止批量` 的点击事件补充 `stopPropagation()`，降低宿主页级事件干扰。
- 文档同步：
  - 明确 Aishell 后续默认沿用“嵌入式推荐卡片 + 原生按钮注入”这一前端形态。

## 2026-05-28（Aishell Tech 闽南语助手保存链修正）

- 修正 Aishell 闽南语助手“填入并保存”链路：
  - 根因是内容脚本填入后直接 `POST /api/mark/SaveShortMark`，没有触发平台原生“保存”按钮，导致平台前端自身的保存联动与成功提示口径可能被绕开。
  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 改为点击页面真实“保存”按钮，再等待页面 `保存成功!` 提示、列表条目完成态，必要时回退检查 `getShortMark / packageItemList`。
  - 保留批量模式的“AI 并发请求 + 页面串行保存”总流程，但每条保存统一走宿主页面真实动作。
- 测试与文档：
  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 新增“必须点击真实保存按钮且不能直接 POST SaveShortMark”用例。
  - 同步更新 `extension/sites/aishell-tech/minnan-helper/README.md` 与 `platform-resources/aishell-tech/minnan-helper/README.md` 的保存链说明。

## 2026-05-28（Aishell Tech Prompt 简体约束与批量窗口补位）

- 更新 `platform-resources/aishell-tech/minnan-helper/backend/ai-service.js` 默认 Prompt：
  - `mandarin_to_dialect` 比较 Prompt 明确要求 `recommendedText` 只能输出简体中文，不允许繁体字。
  - `direct_dialect` 听音/比较 Prompt 同步要求 `heardText / recommendedText` 使用简体中文，不允许繁体字。
  - 本轮不在前端做二次繁简纠正，约束完全落在 Prompt。
- 更新 Aishell 前端批量识别窗口：
  - 新增 `extension/sites/aishell-tech/minnan-helper/batch-window.js`，把批量请求窗口改成“先发满并发，消费一条后再补发一条”的滚动补位模型。
  - `extension/sites/aishell-tech/minnan-helper/content.js` 改为基于该窗口调度 AI 请求，保持“谁先返回谁先保存”，但后续补发时机改为“上一条保存完成后”。
  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 新增 Aishell 固定 OSS 根地址回退；`task/detail.project.dataRoot` 缺失时，仍可用 `https://bpp-collect.oss-cn-hangzhou.aliyuncs.com + item.url` 组装音频地址。
- 2026-05-28 同轮追加：
  - Aishell 批量任务源改为“当前分包从第 1 条到最后 1 条”整包扫描，不再从当前选中条开始。
  - 过滤口径收紧为只跳过 `dataStatus === 2` 的已完成条目；`dataStatus=0/1` 都继续参与本轮批量。
  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 新增整包扫描与状态过滤断言。
- 测试与资源：
  - `platform-resources/aishell-tech/minnan-helper/backend/ai-service.test.js` 新增默认 Prompt 简体约束断言。
  - `extension/sites/aishell-tech/minnan-helper/batch-window.test.js` 新增滚动并发窗口补位测试。
  - `extension/sites/aishell-tech/minnan-helper/data-api.test.js` 新增默认 OSS 根地址回退断言。
  - `extension/manifest.json` 补充加载 `sites/aishell-tech/minnan-helper/batch-window.js`。

## 2026-05-28（Aishell Tech 嵌入式面板与原生按钮注入）

- 合并 Aishell Tech 闽南语助手界面重构：
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 从固定悬浮窗改为嵌入式卡片，优先挂在 `.mark-area form.el-form` 下方。
  - 面板主区只保留 `AI推荐文本` 展示、状态提示和详细信息折叠；详细结果与批量状态收进折叠区。
  - `AI识别` 按钮改为注入到页面原生“保存”按钮右侧；`AI批量识别 / 停止批量` 改为注入到页面原生工具按钮区域。
  - 当推荐文本与页面参考文本一致时，主展示区改为提示 `无需修改`，但仍保留真实推荐文本供填入并保存。
- 错误透传增强：
  - `extension/sites/aishell-tech/minnan-helper/ai-recommendation.js` 的客户端错误对象补充 `rawResponse`。
  - `extension/sites/aishell-tech/minnan-helper/content.js` 与 `ui-panel.js` 支持在识别报错时展开显示脱敏后的后端原始返回 JSON。
- 同步更新 Aishell 运行时 README，明确当前是“嵌入式卡片 + 原生按钮注入”口径。

## 2026-05-28（Aishell Tech 批量切条对齐与快捷键接入）

- 修复 Aishell 批量识别里“AI 已返回，但页面没有切到对应条目就直接填入保存”的问题：
  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 不再只按左侧 DOM 索引切条。
  - 新增按 `number + fileName 后缀` 匹配左侧 `.list-item` 的定位逻辑，兼容页面里 `...59666546823.wav` 这类截断文件名。
  - 新增 `selectTask()` 与 `getItemByTask()`，批量回填前会重新按条目标识定位，并等待右侧表单与目标条真正对齐。
- 补齐 Aishell 快捷键接入：
  - `extension/manifest.json` 重新补入 `sites/aishell-tech/minnan-helper/shortcuts.js` 注入。
  - `extension/sites/aishell-tech/minnan-helper/content.js` 开始实例化 Aishell shortcuts runtime。
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 对外暴露复制听音文本、复制推荐文本、填入并保存当前条、忽略结果动作，供快捷键调用。
  - `extension/options/options.html` 与 `extension/options/options.js` 新增 Aishell 独立快捷键录制面板、草稿态与保存逻辑。

## 2026-05-28（AI 调用日志全局使用人设置第一块）

- 新增 `extension/shared/ai-usage-meta.js` 设置补丁能力：
  - 新增 `createAiUsageOperatorSettingsPatch()`，统一把全局使用人写入 `settings.meta.aiUsageOperatorName`。
- 更新 `extension/shared/constants.js` 与 `extension/shared/storage.js`：
  - 默认设置与 fallback 默认设置都补齐 `meta.aiUsageOperatorName` 空字符串初始值。
- 更新 `extension/options/options.html` 与 `extension/options/options.js`：
  - options 首页“后端接口地址”卡片新增全局 `AI 调用使用人` 输入项。
  - 输入值在 blur 时持久保存到 `settings.meta.aiUsageOperatorName`，再次进入首页会自动回显。
  - 帮助文案明确：所有 AI 请求共用，未填写时不允许调用 AI。
- 更新 `extension/manifest.json`：
  - 所有 AI 相关内容脚本注入序列统一补入 `shared/ai-usage-meta.js`，为后续各平台请求注入统一元数据做准备。
- 更新测试：
  - `extension/shared/ai-usage-meta.test.js` 新增 `createAiUsageOperatorSettingsPatch` 契约验证。

## 2026-05-28（Aishell Tech 最小悬浮窗重构）

- 用户复现确认：
  - `detail -> 查看 -> mark` 时旧版 Aishell 运行时经常不出现面板。
  - 手动刷新后有时才出现按钮，但启用脚本时刷新还会导致页面白屏。
  - 禁用 Aishell 脚本后页面恢复正常。
- 本轮不再继续叠加补注入热修，直接把 Aishell 前端收敛为最小稳定版：
  - `extension/manifest.json` 删除 Aishell 的 `page-world/network-observer.js`、`shortcuts.js`、`shared/ai-usage-meta.js` 注入，并移除 `scripting` / `webNavigation` 权限。
  - `extension/background/service-worker.js` 删除 Aishell 的 `registerContentScripts / executeScript / webNavigation / tabs.onUpdated` 动态补注入逻辑。
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 重写为纯悬浮窗，只保留 `识别` 与 `批量识别` 两个按钮，不再往原页面业务区插入行内按钮。
  - `extension/sites/aishell-tech/minnan-helper/content.js` 重写为最小运行时：只做路由识别、单条识别、顺序批量识别与悬浮窗状态更新。
  - `extension/sites/aishell-tech/minnan-helper/data-api.js` 改为直接从页面 `localStorage/sessionStorage` 扫描 JWT，并直接请求 `markapi.aishelltech.com` 的 `task/detail` 与 `packageItemList`，不再依赖主世界抓包缓存。
- 当前边界重新收紧：
  - 只验证悬浮窗可见性与识别链路。
  - 不自动填入，不自动保存，不自动提交，不跨分包。

## 2026-05-28（AI 调用日志实现计划）

- 新增实现计划：
  - `docs/superpowers/plans/2026-05-28-ai-call-logging-implementation.md`
- 固定实现顺序：
  - 前端共享 `ai-usage-meta` 助手
  - options 首页全局 `AI 调用使用人`
  - 各平台前端 AI 请求统一拦截与 request meta 注入
  - `platform-resources/backend/ai-call-log/` 共享日志核心
  - `ai-framework` 路由层统一校验与日志钩子
  - DataBaker / Aishell / Magic Data / LabelX / Task21 分块接入
- 固定实现口径：
  - 日志按脚本目录按天写 CSV
  - 公共列最小化，不再复用 DataBaker 旧大宽表
  - `promptTokens / completionTokens` 为主，`totalTokens` 仅兜底
  - 默认保留脱敏后的 `rawResponseJson / rawErrorJson`
  - 项目默认不使用 mock，日志实现不围绕 mock 展开

## 2026-05-28（AI 调用日志统一记录设计文档）

- 新增设计文档：
  - `docs/superpowers/specs/2026-05-28-ai-call-logging-design.md`
- 固定本轮 AI 调用日志方案：
  - 各脚本目录独立保存、按天切分 CSV
  - 公共字段最小化，脚本字段扩展化
  - `AI 调用使用人` 作为前端全局公共必填字段
  - `promptTokens / completionTokens` 为主，`totalTokens` 仅作兜底
  - 默认保留脱敏后的原始返回 JSON，不再把业务结果统一拆列
  - 项目默认不使用 mock，日志设计不围绕 mock 构建

## 2026-05-28（DataBaker data 目录继续收口 CSV 与 merge 逻辑）

- 新增 `platform-resources/data-baker/round-one-quality/data/scripts/csv.js`：
  - 抽出 legacy 表头归一、CSV 解析、行数统计和 UTF-8 BOM 写出。
- 新增 `platform-resources/data-baker/round-one-quality/data/scripts/merge.js`：
  - 抽出 CSV 唯一键计算、CSV merge 统计和 rawRecords merge。
- 新增测试：
  - `platform-resources/data-baker/round-one-quality/data/scripts/csv.test.js`
  - `platform-resources/data-baker/round-one-quality/data/scripts/merge.test.js`
- 更新 `platform-resources/data-baker/round-one-quality/backend/export-store.js`：
  - 不再内联维护 CSV parse/stringify、表头归一和 merge 细节。
  - 当前主要保留旧 latest 读取与导出总体编排；CSV helper、merge helper 与 persist helper 已下沉到 `data/scripts/*.js`。
  - 顺手修正 history 文件名生成，避免 `persistHistory=1` 时把 ISO 时间里的 `:` 写进文件名，导致 Windows 下无法落盘。

## 2026-05-28（DataBaker data 目录继续收口持久化写入逻辑）

- 新增 `platform-resources/data-baker/round-one-quality/data/scripts/persist.js`：
  - 抽出 latest.csv / latest-raw.json / latest.json 写入
  - 抽出 history CSV / raw.json 写入
  - 抽出 upload events JSONL 追加
  - 抽出 latest meta 与 upload event payload 组装
- 新增测试：
  - `platform-resources/data-baker/round-one-quality/data/scripts/persist.test.js`
- 更新 `platform-resources/data-baker/round-one-quality/backend/export-store.js`：
  - `ensureDataDir` 改为复用 `data/scripts/persist.js`
  - latest/history/events 的实际写入和 meta/event payload 组装改为复用 `data/scripts/persist.js`
  - `export-store.js` 当前主要保留 CSV / raw merge、旧 latest 读取和总体编排

## 2026-05-28（DataBaker data 目录继续收口 upload 与 history 侧）

- 新增 `platform-resources/data-baker/round-one-quality/data/scripts/upload.js`：
  - 抽出 `export/upload` 的 payload 归一、大小校验和 `rawJson -> rawRecords` legacy alias 兼容。
- 更新 `platform-resources/data-baker/round-one-quality/data/scripts/fetch.js`：
  - 新增 `latest.json` 读取。
  - history 列表补充对应 `*.raw.json` 是否存在。
  - 新增 `upload-events.jsonl` 最近事件读取。
- 更新 `platform-resources/data-baker/round-one-quality/backend/export-routes.js`：
  - `upload` 改为复用 `data/scripts/upload.js`
  - `config` 补充 latest meta、history 数量和最近 upload events 摘要
  - `list` 返回的 history CSV 项补充 `rawJsonExists/rawJsonName`
- 新增测试：
  - `platform-resources/data-baker/round-one-quality/data/scripts/upload.test.js`
  - `platform-resources/data-baker/round-one-quality/data/scripts/fetch.test.js` 新增 upload/history 场景
- 新增数据资产：
  - `data/assets/mappings/upload-payload.md`
  - `data/assets/samples/upload-payload-sample.json`
  - `data/assets/samples/latest-meta-sample.json`
  - `data/assets/samples/upload-events-sample.jsonl`

## 2026-05-28（DataBaker data 目录继续收口下载脚本与样例）

- 新增 `platform-resources/data-baker/round-one-quality/data/field-mappings.js`：
  - 抽出 DataBaker 导出 canonical CSV 列、legacy 表头 alias 和唯一键字段组。
- 新增 `platform-resources/data-baker/round-one-quality/data/scripts/download.js`：
  - 抽出 DataBaker `latest.csv` 下载 target 组装逻辑。
- 新增 `platform-resources/data-baker/round-one-quality/data/scripts/fetch.js`：
  - 抽出 latest 快照存在性读取和 history CSV 列表读取逻辑。
- 新增测试：
  - `platform-resources/data-baker/round-one-quality/data/field-mappings.test.js`
  - `platform-resources/data-baker/round-one-quality/data/scripts/download.test.js`
  - `platform-resources/data-baker/round-one-quality/data/scripts/fetch.test.js`
- 新增数据资产目录：
  - `data/assets/mappings/export-columns.md`
  - `data/assets/samples/latest-sample.csv`
  - `data/assets/samples/latest-raw-sample.json`
  - `data/runtime/.gitkeep`
- 更新 `platform-resources/data-baker/round-one-quality/backend/export-store.js`：
  - 改为复用 `data/field-mappings.js` 中的 alias 和唯一键字段组。
- 更新 `platform-resources/data-baker/round-one-quality/backend/export-routes.js`：
  - `download` 改为复用 `data/scripts/download.js`
  - `list` 改为复用 `data/scripts/fetch.js`
  - `config` 补充 latest 快照存在性字段

## 2026-05-28（DataBaker 导出下载链路接入共享 core）

- 新增 `platform-resources/backend/project-data-download/csv-file-download-core.js`：
  - 抽出通用 CSV 文件下载 core，统一处理文件存在性检查、下载文件名和 `GET/HEAD` 下载响应头。
- 新增 `platform-resources/data-baker/round-one-quality/data/adapter.js`：
  - 收口 DataBaker 下载轨道元数据、`latest.csv` 路径解析和共享下载轨道数据集定义。
- 更新 `platform-resources/data-baker/round-one-quality/backend/export-store.js`：
  - 抽出 `resolveExportStorePaths`，统一 `export-data` 路径口径，供 data adapter 和旧导出 store 共同复用。
- 更新 `platform-resources/data-baker/round-one-quality/backend/export-routes.js`：
  - `GET/HEAD /api/data-baker/round-one-quality/export/download` 改为通过共享 CSV 文件下载 core 驱动。
  - 外部 API path 保持不变；上传、CSV 合并、`latest-raw.json`、history/events 逻辑仍保留在 DataBaker 自己的后端实现里。
- 更新 DataBaker README、统一后端 README、平台索引与 `platform-resources/README.md`：
  - 明确 DataBaker 下载链路已开始接入与 LabelX 同一条 `project-data-download` 复用轨道。

## 2026-05-28（Alibaba LabelX 快判下载链路接入共享 core 第二块）

- 新增 `platform-resources/alibaba-labelx/asr-judgement/data/adapter.js`：
  - 收口快判下载 / existing 的脚本级差异。
- 新增 `platform-resources/alibaba-labelx/asr-judgement/data/adapter.test.js`：
  - 固定 3 个标注槽位、审核槽位与 `complete` 判定行为。
- 更新 `platform-resources/alibaba-labelx/asr-judgement/backend/routes.js`：
  - `download / suppliers / existing` 改为通过共享 LabelX 下载 core 驱动。
  - 外部 API path 保持不变。
- 更新快判 README、后端 README、LabelX 平台 README、平台索引、`platform-resources/README.md` 与统一后端 README：
  - 明确 LabelX 转写与快判的下载链路都已开始复用共享 core。

## 2026-05-28（Alibaba LabelX 转写下载链路接入共享 core 第一块）

- 新增 `platform-resources/backend/project-data-download/labelx-download-core.js`：
  - 抽出 LabelX 转写/快判共用的下载文件名、响应头、供应商过滤和 `GET/HEAD /download` 主流程。
- 新增 `platform-resources/backend/project-data-download/labelx-existing-core.js`：
  - 抽出 LabelX 转写/快判共用的 `existing` 分包分组与响应组装流程。
- 新增测试：
  - `platform-resources/backend/project-data-download/__tests__/labelx-download-core.test.js`
  - `platform-resources/backend/project-data-download/__tests__/labelx-existing-core.test.js`
- 新增 `platform-resources/alibaba-labelx/asr-transcription/data/adapter.js`：
  - 收口转写下载 / existing 的脚本级差异。
- 新增 `platform-resources/alibaba-labelx/asr-transcription/data/adapter.test.js`：
  - 固定按角色选 row、`complete` 判定和元数据导出行为。
- 更新 `platform-resources/alibaba-labelx/asr-transcription/backend/routes.js`：
  - `download / suppliers / existing` 改为通过共享 LabelX 下载 core 驱动。
  - 外部 API path 保持不变。
- 更新转写 README、后端 README、统一后端 README：
  - 明确当前只统一内部下载实现，不改对外下载入口。

## 2026-05-28（Aishell Tech 可见性与 defaults 回退修复）

- 更新 `extension/sites/aishell-tech/minnan-helper/ui-panel.js`：
  - 面板不再插在 `.mark-area` 外部底部，改为挂在标注表单可见区内、表单前方，避免按钮落到页面最下方看不见。
- 更新 `extension/options/options.js`：
  - 补齐 Aishell 复用 DataBaker 模型下拉的选项构建函数，修复听音模型、比较模型、单模型下拉为空的问题。
  - Aishell defaults 读取失败时，先回退到 DataBaker defaults 接口；若仍失败，再回退到本地 DataBaker Prompt 与模型默认值。
  - 本地 fallback 默认值改为直接带出 DataBaker 同款 `listenPrompt` / `comparePrompt`，确保 options 页面能看到同款 Prompt 基线。

## 2026-05-28（Aishell Tech 闽南语助手独立全量接入）

- 新增 `extension/sites/aishell-tech/minnan-helper/` 运行时代码：
  - 通过 page-world 观察层缓存 `task/detail`、`packageItemList`、`markDetail`、`getShortMark`、`SaveShortMark`，不直接处理平台 JWT。
  - `/mytask/mark` 新增当前条 AI 推荐、复制、填入和批量串行真实保存面板。
  - 批量模式固定为“并发预取 AI 结果 + 串行填入并点击页面真实保存按钮”，只处理当前分包、从当前选中条开始、跳过已完成条目。
- 新增 `platform-resources/aishell-tech/minnan-helper/` 脚本级目录：
  - `ai/adapter.js`、`backend/ai-service.js`、`backend/ai-routes.js`、`backend/index.js`。
  - 新增独立接口 `GET /api/aishell-tech/minnan-helper/ai/recommend/health`、`GET /defaults`、`POST /recommend`。
  - 默认 Prompt、模型白名单、并发归一与推荐执行链参考 DataBaker round-one-quality，但保持 Aishell 独立脚本 ID、独立词表目录和独立响应包装。
- 更新扩展侧接入：
  - `extension/manifest.json` 增加 `mark.aishelltech.com` / `markapi.aishelltech.com` 权限与内容脚本注入。
  - `extension/shared/constants.js`、`extension/shared/storage.js`、`extension/options/options.js`、`extension/options/options.html`、`extension/popup/popup.js` 新增 Aishell 平台、脚本、详情页配置与当前页识别。
- 更新文档：
  - `platform-resources/aishell-tech/README.md` 从“正式接入准备态”改为“独立脚本已接入”。
  - 补齐 `extension/sites/aishell-tech/minnan-helper/README.md`、`platform-resources/aishell-tech/minnan-helper/README.md`、`platform-resources/backend/README.md`、根 `README.md`、`docs/platforms/index.md` 的同步说明。

## 2026-05-28（Alibaba LabelX 快判接入 AI framework 桥接层）

- 新增 `platform-resources/alibaba-labelx/asr-judgement/ai/adapter.js`：
  - 把快判 `suggest` 请求映射到统一 `ai-framework` 输入契约。
  - 保留旧成功/失败响应结构，避免前端同步改契约。
- 新增 `platform-resources/alibaba-labelx/asr-judgement/ai/adapter.test.js`：
  - 固定 `normalizeInput`、legacy success body、legacy error body 三个桥接行为。
- 新增目录说明：
  - `platform-resources/alibaba-labelx/asr-judgement/ai/assets/README.md`
  - `platform-resources/alibaba-labelx/asr-judgement/data/README.md`
- 新增 `platform-resources/alibaba-labelx/asr-judgement/backend/ai-suggest-request.js`：
  - 抽出快判 AI 请求归一、AI 参数清洗和脱敏错误辅助函数，供 adapter 与业务层共用。
- 更新 `platform-resources/alibaba-labelx/asr-judgement/backend/ai-routes.js`：
  - `POST /api/alibaba-labelx/asr-judgement/ai/suggest` 改为通过统一 `ai-framework` route factory 驱动。
  - 对外继续保持 `success + data` 与原错误结构兼容。
  - `health/defaults` 保持原有返回语义，本轮先做桥接式迁移。
- 更新快判 README 与后端 README：
  - 明确当前只迁移 AI 推荐主链路。
  - 统计上传、existing 检查、CSV 合并、下载与 suppliers 逻辑仍保留在 `backend/`。

## 2026-05-28（Alibaba LabelX 转写接入 AI framework 桥接层）

- 新增 `platform-resources/alibaba-labelx/asr-transcription/ai/adapter.js`：
  - 把转写 `suggest-current` 请求映射到统一 `ai-framework` 输入契约。
  - 保留旧成功/失败响应结构，避免前端同步改契约。
- 新增 `platform-resources/alibaba-labelx/asr-transcription/ai/adapter.test.js`：
  - 固定 `normalizeInput`、legacy success body、legacy error body 三个桥接行为。
- 新增目录说明：
  - `platform-resources/alibaba-labelx/asr-transcription/ai/assets/README.md`
  - `platform-resources/alibaba-labelx/asr-transcription/data/README.md`
- 新增 `platform-resources/alibaba-labelx/asr-transcription/backend/ai-suggest-request.js`：
  - 抽出转写 AI 请求归一、AI 参数清洗和脱敏错误辅助函数，供 adapter 与业务层共用。
- 更新 `platform-resources/alibaba-labelx/asr-transcription/backend/ai-routes.js`：
  - `POST /api/alibaba-labelx/asr-transcription/ai/suggest-current` 改为通过统一 `ai-framework` route factory 驱动。
  - 对外继续保持 `success + data` 与原错误结构兼容。
  - `health/defaults` 保持原实现，本轮先做桥接式迁移。
- 更新转写 README 与后端 README：
  - 明确当前只迁移 AI 推荐主链路。
  - 统计上传、CSV 合并、下载与 suppliers 逻辑仍保留在 `backend/`。

## 2026-05-28（Abaka AI Task21 接入 AI framework 桥接层）

- 新增 `platform-resources/abaka-ai/task21/ai/adapter.js`：
  - 把 Task21 `analyze` 请求映射到统一 `ai-framework` 输入契约。
  - 保留旧成功/失败响应结构，避免前端同步改契约。
- 新增 `platform-resources/abaka-ai/task21/ai/adapter.test.js`：
  - 固定 `normalizeInput`、legacy success body、legacy error body 三个桥接行为。
- 新增目录说明：
  - `platform-resources/abaka-ai/task21/ai/assets/README.md`
  - `platform-resources/abaka-ai/task21/data/README.md`
- 新增 `platform-resources/abaka-ai/task21/backend/ai-analyze-request.js`：
  - 抽出 analyze 请求归一和运行时模型选项解析，供 adapter 与 Task21 业务层共用。
- 更新 `platform-resources/abaka-ai/task21/backend/ai-routes.js`：
  - `POST /api/abaka-ai/task21/ai/analyze` 改为通过统一 `ai-framework` route factory 驱动。
  - 对外继续保持 Task21 旧成功/失败响应结构。
  - `health/defaults` 保持原实现，本轮先做桥接式迁移。
- 更新 Task21 README 与后端 README：
  - 明确当前只迁移 analyze 主链路。
  - 固定 `ai/assets/` 与 `data/` 目录边界，后续再逐步迁移 prompt / rules / schema / defaults / 统计下载逻辑。

## 2026-05-28（Magic Data 客家话助手接入 AI framework 桥接层）

- 新增 `platform-resources/magic-data/hakka-helper/ai/adapter.js`：
  - 把客家话助手 `review-current` 请求映射为统一 `ai-framework` 输入契约。
  - 保留旧成功/失败返回结构，并继续兼容 legacy `annotator` 路径。
- 新增 `platform-resources/magic-data/hakka-helper/ai/adapter.test.js`：
  - 固定 `normalizeInput`、legacy success body、legacy error body 三个桥接行为。
- 新增目录说明：
  - `platform-resources/magic-data/hakka-helper/ai/assets/README.md`
  - `platform-resources/magic-data/hakka-helper/data/README.md`
- 新增 `platform-resources/magic-data/hakka-helper/backend/ai-review-request.js`：
  - 抽出请求归一 helper，供 adapter 与旧业务层共用，避免重复维护客家话请求映射规则。
- 更新 `platform-resources/magic-data/hakka-helper/backend/ai-routes.js`：
  - `POST /api/magic-data/hakka-helper/ai/review-current` 改为通过统一 `ai-framework` route factory 驱动。
  - legacy `/api/magic-data/annotator/ai/review-current` 继续保留，并复用同一条 framework 桥接链路。
  - `health/defaults` 保持原实现，本轮先做桥接式迁移。
- 共享桥接修正：
  - 修正 `platform-resources/magic-data/minnan-helper/backend/ai-routes.js` 中 route factory 的 `routeContext` 转发方式，避免真实 POST 请求上下文传递错误。

## 2026-05-28（Magic Data 闽南语助手接入 AI framework 桥接层）

- 新增 `platform-resources/magic-data/minnan-helper/ai/adapter.js`：
  - 把闽南语助手 `review-current` 请求映射为统一 `ai-framework` 输入契约。
  - 保留旧成功/失败返回结构，避免前端同步改契约。
- 新增 `platform-resources/magic-data/minnan-helper/ai/adapter.test.js`：
  - 固定 `normalizeInput`、legacy success body、legacy error body 三个桥接行为。
- 新增目录说明：
  - `platform-resources/magic-data/minnan-helper/ai/assets/README.md`
  - `platform-resources/magic-data/minnan-helper/data/README.md`
- 更新 `platform-resources/magic-data/minnan-helper/backend/ai-routes.js`：
  - `POST /api/magic-data/minnan-helper/ai/review-current` 改为通过统一 `ai-framework` route factory 驱动。
  - 继续复用原 `ai-service.js` 的 `reviewCurrent`、health/defaults、队列、缓存、词表与 provider 逻辑。
  - 对外响应结构保持 `success + data + cache + backend` 与原错误结构兼容。
- 更新闽南语助手 README 与后端 README：
  - 明确当前是桥接式迁移，`health/defaults` 仍保留旧实现。
  - 固定 `ai/` 与 `data/` 目录边界，后续再逐步把 prompt / schema / lexicon 迁入 `ai/assets/`。

## 2026-05-28（Aishell Tech 正式接入准备态同步）

- 更新 `platform-resources/aishell-tech/README.md`：
  - 将状态从“只读探测”收口为“正式接入准备”。
  - 明确首阶段接入范围是 `我的任务 -> 任务详情 -> 数据标注`。
  - 明确当前首阶段不需要专属后端，可先做运行时代码接入。
  - 明确后续待补项：组织管理详细 DOM、质检/验收角色视图、弹窗、长标注与质检/验收写操作。
- 更新 `platform-resources/aishell-tech/network/README.md` 与 `page-structure/README.md`：
  - 统一口径为“核心链路资料已足够支撑首阶段运行时代码开工”。
  - `05-organization.md` 改为“初版占位完成，详细 DOM 待补”，不再与文件实际存在状态冲突。
- 更新 `platform-resources/aishell-tech/network/pending-capture.md` 与 `page-structure/pending-capture.md`：
  - 修正编号混乱，按首阶段阻塞度重新排序。
- 更新 `AGENTS.md`、根 `README.md`、`docs/platforms/index.md`、`platform-resources/README.md`：
  - 把 Aishell Tech 的仓库级状态统一改为“正式接入准备态”。
  - 明确当前仍无 `extension/sites/aishell-tech/` 运行时代码与专属后端注册。

## 2026-05-28（DataBaker adapter 接入 AI framework）

- 新增 `platform-resources/data-baker/round-one-quality/ai/adapter.js`：
  - 作为首个脚本级 adapter，把 DataBaker recommend 请求映射到统一 framework 输入契约。
  - 保留旧 recommend 成功/失败响应结构，避免前端同步改契约。
- 新增 `platform-resources/data-baker/round-one-quality/ai/adapter.test.js`：
  - 固定 `normalizeInput`、旧 success body、旧 error body 三个桥接行为。
- 新增目录说明：
  - `platform-resources/data-baker/round-one-quality/ai/assets/README.md`
  - `platform-resources/data-baker/round-one-quality/data/README.md`
- 更新 `platform-resources/data-baker/round-one-quality/backend/ai-routes.js`：
  - recommend 入口改由统一 `ai-framework` route factory 驱动。
  - 继续复用原 `ai-service.js`、`ai-legacy-omni-service.js`、dedupe 与 jobs 逻辑。
  - `health/defaults/jobs` 当前保持原实现，先做桥接式迁移，不一次性推倒业务层。
- 更新 `platform-resources/backend/ai-framework/README.md`：
  - 明确 route factory 现已支持 `createSuccessBody / createErrorBody`，便于旧项目逐个迁移。

## 2026-05-28（backend AI framework 骨架）

- 新增 `platform-resources/backend/ai-framework/` 第一版骨架：
  - `contracts/normalized-request.js`
  - `contracts/normalized-response.js`
  - `core/create-ai-route.js`
  - `loaders/project-assets.js`
  - `runtime/execute-project-pipeline.js`
  - `registry/project-ai-registry.js`
  - `index.js`
  - `README.md`
- 新增 `platform-resources/backend/ai-framework/__tests__/ai-framework.test.js`：
  - 先用 Node 内置测试固定 request/response 契约、资产加载、pipeline 编排、registry 和 route factory 的最小行为。
  - 先验证缺模块时测试失败，再补骨架实现，保持这一块可回归。
- 更新 `platform-resources/backend/README.md`：
  - 把 `ai-framework/` 纳入统一后端职责说明。
  - 明确当前只是骨架阶段，旧项目路由尚未切换，后续按迁移计划逐块接入。

## 2026-05-28（platform-resources AI 框架迁移基线）

- 新增 `docs/architecture/2026-05-28-platform-resources-ai-framework-design.md`：
  - 固定统一 AI 框架目标：`platform-resources/backend/ai-framework/ + 项目 adapter + prompt/schema/lexicon 资产目录`。
  - 固定脚本级新目录口径：`ai/` 与 `data/` 同级，`network/`、`page-structure/` 继续保留为长期平台资料。
  - 明确 Aishell Tech 当前仍是资料初始化平台，不进入本轮 AI 后端迁移主线。
- 新增 `docs/architecture/2026-05-28-platform-resources-ai-framework-migration-plan.md`：
  - 按“文档基线 -> 框架骨架 -> DataBaker -> Magic Data -> Abaka -> LabelX -> data 目录归一”拆成可逐块提交的迁移顺序。
  - 每块要求先验证，再提交，便于回退版本。
- 更新 `AGENTS.md`、根 `README.md`、`docs/README.md`、`platform-resources/README.md`：
  - 把两份迁移文档接入协作入口，降低后续协作者继续改 `platform-resources` 时的理解偏差。

## 2026-05-27（Aishell Tech 协作文档同步）

- 基于合并提交 `089bdb8`（`合并 PR #2: Aishell Tech 平台资料初始化`）补齐项目级协作文档。
- 更新 `AGENTS.md`：
  - 新增 Aishell Tech 平台读取入口，明确当前为“平台资料初始化 / 只读探测态”。
  - 补充例外规则：未接入运行时代码的平台不要伪造 `extension/sites/<platform>/` 目录，应先同步 `platform-resources/<platform>/README.md`、`docs/platforms/index.md`、根 `README.md` 与 `log.md`。
- 更新根 `README.md`：
  - 将 Aishell Tech 纳入当前重点平台口径。
  - 明确当前仅有 `platform-resources/aishell-tech/` 资料、尚无运行时代码和专属后端注册。
  - 增补 Aishell Tech 文档入口。
- 更新 `platform-resources/README.md`：
  - 新增 Aishell Tech 平台总览。
  - 明确“平台资料初始化阶段”可临时仅保留 `README.md + network/ + page-structure/`，不提前伪造 `backend/` 或 `<script-id>/` 目录。
- 更新 `docs/platforms/index.md`：
  - 修正已删除 `platform-resources/aishell-tech/network/06-sensitive-operations.md` 的错误引用。
  - 改为引用 Aishell Tech 根 README 的安全边界章节，并补充“我的团队 page-structure 待补采”的当前状态。
- 更新 `platform-resources/aishell-tech/README.md` 与 `platform-resources/aishell-tech/network/README.md`：
  - 对齐实际采集状态，明确 `page-structure/05-organization.md` 仍待补采。
  - 说明敏感写操作边界已收口到平台根 README，不再单独维护 `06-sensitive-operations.md`。

## 2026-05-27（Aishell Tech 平台资料初始化）

- 新建 `platform-resources/aishell-tech/` 目录，完成平台只读探测阶段文档。
- 平台信息：Aishell Tech 数据处理工作平台，域名 `mark.aishelltech.com`，技术栈 Vue 2 + Element UI + Wavesurfer.js。
- 资料分为两大维度：
  - **network/**（网络请求采集）：6 个页面 API 请求/响应结构。`01-index` 记录首页 3 个 XHR 请求，重点详录独家 API `/api/Statistics/GetIndexStatistics` 完整响应（`total` 汇总统计、`latest30days` 近 30 天趋势、`users` 排行、`citys` 预留）；`02-mytask-index` ~ `06-sensitive-operations` 已完成；`pending-capture` 持续更新。
  - **page-structure/**（页面 DOM 结构采集）：5 个页面 DOM 树和 CSS 选择器。`01-index` 完整布局（3 行 el-row：完成概况卡片 + 4 个 x-vue-echarts 图表 + 8 列进行中任务表格 + 页脚），图表统一配色 标注 `#5470c6`/采集 `#91cc75`/质检 `#fac858`；README 补充全局壳层 DOM 树（Logo 区、水平菜单 3 项、用户下拉、多 Tab 标签页 id/aria-controls 规则）；`02-mytask-index` ~ `04-mytask-mark` 已完成；`05-organization` 待补采。
- 核心标注链路（任务列表 → 任务详情 → 数据标注）的 network 和 page-structure 均已完整采集；首页采集完成。
- 总计 18 个文件、2 个子目录。

## 2026-05-27（Magic Data 客家话助手：AI 结果繁体字热修）

- 当前版本继续保持 `0.3.7`，本轮不再自动提升版本号。
- 修复问题：Magic Data ANNOTATOR 的客家话助手 AI 结果区、行内建议与听音相关文本偶发出现繁体字或繁简混合。
- 根因：
  - 客家话助手原 prompt 对"必须输出简体"的约束不够硬，模型仍可能返回 `聽講/這個/化學競賽/輔導` 一类普通繁体字。
  - 因此模型一旦返回 `聽講/這個/化學競賽/輔導` 一类普通繁体字，前端会直接展示并填入页面。
- Prompt 修复：
  - `platform-resources/magic-data/hakka-helper/backend/ai-prompts.js` 强化 listen / compare / omni / recognition-convert 四条链路的文本约束。
  - 明确要求所有普通中文字段必须输出简体，禁止输出普通繁体字；只有命中客家话词表统一用字时才保留对应写法。
  - `RULE_VERSION` 升级为 `magic-data-hakka-helper-ai-review-v2-prompt-simplified-only`，避免旧缓存继续命中旧 prompt 输出。
- 本地收口回退：
  - 移除 `platform-resources/magic-data/hakka-helper/backend/ai-routes.js` 中本地响应繁转简逻辑。
  - 移除 `platform-resources/magic-data/hakka-helper/backend/ai-lexicon.js` 中本地繁转简函数。
  - 删除 `platform-resources/magic-data/hakka-helper/backend/ai-text-normalization.test.js`。
- 文档同步：
  - 更新根 README、扩展 README、Magic Data 平台/客家话助手 README、平台索引。
  - 更新 `AGENTS.md` 与 `docs/rules/project-collaboration-rules.md`：默认保持 `0.3.7`，只有用户明确要求完成当前版本/打包/发布时才提升版本。

## 2026-05-26（v0.3.6 收尾：Magic Data 双助手规则与文档同步）

- 保持版本 `0.3.6`，本轮未升版本、未生成 CRX、未打 tag（非 `ASC_RELEASE`）。
- 项目级规则与文档收尾：
  - `AGENTS.md` 增补 Magic Data 长期短规则：双助手互斥、`模型方案 + 识别策略`、`asrmarkCheck` 审核页支持、安全边界与并发口径。
  - `README.md`、`extension/README.md`、`docs/platforms/index.md`、`docs/rules/project-collaboration-rules.md` 同步 `v0.3.6` 收口说明。
  - Magic Data 前后端 README 同步"取消 AI 质检模式 UI、识别策略优先级、审核页填入边界"。
- Playwright-Edge 复测补全：
  - 新增/重写 `platform-resources/magic-data/page-structure/16-playwright-edge-magic-data-recognition-strategy-save-2026-05-26.md`。
  - 已实测 Hakka 与 Minnan 在 options 中从 `mandarin_to_dialect` 切回 `direct_dialect` 后不再回滚。
  - 已验证 storage 双路径一致：`platforms.magicData.scripts.*` 与 `scriptCenter.projects.*` 同步写入 `aiReviewRecognitionStrategy` 与 legacy 派生字段。
- 安全与数据清理：
  - 清理本地 `.playwright-mcp/` 调试日志目录，避免误提交会话日志。
  - 本轮未提交 token/cookie/authorization/完整签名 URL/评测原始数据文件。

## 2026-05-26（Magic Data AI 面板与审核页填入热修）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- `extension/options/options.js`：
  - Magic Data 双助手 AI 面板移除 `AI 质检模式` 字段，统一按 `模型方案 + 识别策略` 配置。
  - 修复识别策略保存回滚：`aiReviewRecognitionStrategy` 显式字段优先，避免被 legacy `recognition_convert` 覆盖。
  - 比较模型下拉联动保持，保存后回显不再丢失。
- `extension/shared/storage.js`：
  - `resolveMagicDataModeAndStrategy` 显式字段优先规则加强，仅在无有效新字段时才采用 legacy 推导。
- `extension/sites/magic-data/hakka-helper/assistant-panel.js`：
  - 审核页（`#/asrmarkCheck`）文本可编辑时，行内建议支持 `填入本行`。
  - `全部填入AI推荐` 在审核页仅填文本项，不填说话人，不自动保存/提交，不自动点击合格/不合格。
- 文档同步：
  - 更新 Magic Data 双助手 README 与平台索引口径。
  - 更新 `14-playwright-edge-magic-data-ai-options-save-2026-05-26.md`。
  - 新增 `15-playwright-edge-hakka-check-page-fill-2026-05-26.md`（记录 MCP 登录态阻塞与人工复测矩阵）。
  - 已补充本轮 `playwright-edge` MCP 探测结果：审核页 URL 会话中重定向到 `#/login`，options 页面可达但完整解锁态需人工复测。

## 2026-05-26（Magic Data AI 面板：保存后被覆盖热修）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- 修复问题：Magic Data 客家话/闽南语助手在 options 保存后，模型方案可能被回写为单模型、识别策略可能被回写为识别转换、比较模型切换后可能丢失。
- `extension/shared/storage.js`：
  - `resolveMagicDataModeAndStrategy` 增加"显式字段优先"判定。
  - 当已保存 `aiReviewModelMode` / `aiReviewRecognitionStrategy` 时，不再被 legacy `recognition_convert` 迁移逻辑反向覆盖。
- `extension/options/options.js`：
  - 新增 `updateMagicDataCompareModelFields`，补齐 `magic-data-ai-compare-model-select` 的 change 联动。
  - 保持 Magic Data 双助手按当前 `scriptId` 更新草稿配置与字段显示，避免 Hakka/Minnan 串用 defaults。
- 文档同步：
  - 更新双助手 README 与平台页面结构索引。
  - 新增 `platform-resources/magic-data/page-structure/14-playwright-edge-magic-data-ai-options-save-2026-05-26.md`（本轮按用户要求未做真实浏览器调试，记录复核矩阵与代码修复点）。

## 2026-05-26（Magic Data 客家话助手：审核页 asrmarkCheck 支持热修）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- 修复问题：客家话助手在 `#/asrmarkCheck` 审核页会反复回到"未接入"提示，并清空已展示的 AI 结果。
- `extension/sites/magic-data/hakka-helper/content.js`：
  - 审核页从阻断分支改为正式接入分支，`asrmark` 与 `asrmarkCheck` 共用挂载/采集/渲染主链路。
  - 路由稳定键改为 `pageType + taskItemId + samplingRecordId`，仅切条时清空结果，避免 MutationObserver 刷新导致结果闪现后消失。
  - 审核页与标注页都走统一面板刷新与 settings 注入。
- `extension/sites/magic-data/hakka-helper/assistant-panel.js`：
  - 移除审核页"未接入"清空行为，改为"已接入 AI 质检"提示。
  - 审核页默认隐藏填入能力（行内填入按钮与"全部填入AI推荐"），保留质检与只读建议展示。
  - 刷新采集时向 `refreshCurrentItem` 透传 `pageType/samplingRecordId`。
- `extension/sites/magic-data/shared/data-collector.js`：
  - snapshot 新增 `pageType`，并在刷新链路保留 `samplingRecordId/pageType` 上下文。
- 文档同步：
  - 更新客家话助手前后端 README、Magic Data 平台 README、页面结构索引、Network 索引。
  - 新增 `platform-resources/magic-data/page-structure/13-playwright-edge-hakka-check-page-2026-05-26.md`（按用户要求本轮未做真实浏览器调试，记录代码修复与人工复测清单）。

## 2026-05-26（Magic Data 客家话助手：AI 配置保存链路热修）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- 修复 `Options -> Magic Data ANNOTATOR -> 客家话助手` 中 `识别策略`、`比较模型` 切换后刷新丢失的问题。
- `extension/options/options.js` 关键修复：
  - 将 Magic Data pipeline 字段联动函数改为按 `scriptId` 通用处理，避免 Hakka 误走 Minnan 硬编码 defaults。
  - `renderAsrVoiceAiSettingsSection` 中 Magic Data Hakka 与 Minnan 统一绑定 `模型方案/识别策略/听音模型/单模型` change 事件，不再让 Hakka 落入旧 `bindJudgementModelSelect` 分支。
  - `saveMagicDataSettings` 改为显式保存模型字段，不再因"等于默认值"写空字符串：
    - `aiReviewModelMode/aiReviewRecognitionStrategy/aiReviewRecognitionMode`
    - `aiReviewListenModel/aiReviewCompareModel/aiReviewSingleModel`
    - legacy `listenModel/reviewModel`
  - thinking 保存保持布尔显式值，并同步 `aiReviewEnableThinking` 与 `enableThinking`。
- 兼容性说明：
  - 客家话默认配置仍为 `two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`（thinking 默认关闭）。
  - 闽南语保存链路同步受益，未回退其现有配置能力。

## 2026-05-26（Magic Data 客家话助手：后端输出结构对齐修复）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- 修复问题：客家话助手后端返回字段不完整，导致新版前端面板大量显示"待复核"或空值。
- 后端修复：
  - `platform-resources/magic-data/hakka-helper/backend/ai-routes.js` 返回结构补齐：
    - `service/scriptId/component`
    - `speakerCheck`
    - `dialectTextCheck`
    - `mandarinTextCheck`
    - `overall`
    - `recommendations`
    - `rawAiDebug/rawModelText/rawJson`（脱敏）
  - `platform-resources/magic-data/hakka-helper/backend/ai-response-schema.js` 增加 tri-state 归一与 fallback，模型字段缺失时按平台文本/听音文本兜底，避免前端全空。
  - `platform-resources/magic-data/hakka-helper/backend/ai-prompts.js` 强化 compare/omni/识别转换 Prompt，要求输出完整三项质检 JSON 结构。
- 客家话默认配置继续保持评测结论：
  - `two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`
  - `enable_thinking=false`
- 兼容性：
  - 保留 `/api/magic-data/hakka-helper/ai/*` 新路径；
  - 保留 `/api/magic-data/annotator/ai/*` legacy 路径。
- 文档同步：
  - 更新客家话助手前后端 README、Magic Data 平台 README、平台索引与统一后端 README；
  - 新增记录 `platform-resources/magic-data/page-structure/14-playwright-edge-hakka-backend-align-2026-05-24.md`（按用户要求，本轮未执行真实浏览器复测，仅记录后端对齐与人工复核清单）。

## 2026-05-26（Magic Data 客家话助手：新版面板前端对齐修复）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- 修复根因：客家话 `content.js` 仍挂载旧 `shared/assistant-panel-core.js` 全局（`__ASREdgeMagicDataAnnotatorInlinePanel`），导致显示旧按钮与旧结果结构。
- 客家话前端链路切换为新版：
  - 新增 `extension/sites/magic-data/hakka-helper/assistant-panel.js`（基于闽南语新版参数化为客家话文案与命名空间）。
  - 新增 `extension/sites/magic-data/hakka-helper/shortcuts-runtime.js`（客家话新版快捷键运行时）。
  - `extension/sites/magic-data/hakka-helper/content.js` 改为使用：
    - `__ASREdgeMagicDataHakkaInlinePanel`
    - `__ASREdgeMagicDataHakkaShortcuts`
  - `extension/manifest.json` 调整 Magic Data ISOLATED 注入顺序，确保客家话新版模块在客家话 content 之前加载。
- 客家话新版面板能力与闽南语对齐：
  - 行内建议（正确/建议文本+填入本行）
  - 说话人建议（性别/年龄）
  - 总结论 + 三个独立折叠详情
  - `全部填入AI推荐`
  - `显示 AI 原始输出`
  - 不再显示旧按钮：`填入第一行`、`填入第二行`、`忽略结果`
- 默认模型口径保持评测结论：
  - `two_stage + direct_dialect + qwen3.5-omni-flash + qwen3.5-flash`
  - `enable_thinking=false`
- 文档同步：
  - 更新 Magic Data 前后端 README 与索引；
  - 新增 `platform-resources/magic-data/page-structure/13-playwright-edge-hakka-panel-align-2026-05-24.md`（按用户要求本轮未做真实浏览器复测，仅记录链路与待人工复核清单）。

## 2026-05-26（Magic Data 客家话助手：评测默认配置落地）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- 落地客家话助手默认 AI 配置（50 条评测结论）：
  - `modelMode=two_stage`
  - `recognitionStrategy=direct_dialect`
  - `listenModel=qwen3.5-omni-flash`
  - `compareModel=qwen3.5-flash`
  - `enable_thinking=false`
- 前端配置同步：
  - `extension/shared/constants.js`、`extension/sites/magic-data/hakka-helper/content.js`、`extension/sites/magic-data/shared/assistant-panel-core.js` 默认比较模型改为 `qwen3.5-flash`，并补齐 `modelMode/recognitionStrategy` 兼容字段。
  - `extension/options/options.js` 更新客家话默认兜底、后端默认提示文案，并按脚本区分客家话/闽南语默认比较模型。
- 后端接口同步：
  - `platform-resources/magic-data/hakka-helper/backend/ai-routes.js` 兼容新请求字段 `modelMode/recognitionStrategy/compareModel/singleModel`，并在 `defaults/health` 返回模型方案与识别策略选项、评测摘要字段。
  - 继续保留 legacy `/api/magic-data/annotator/ai/*` 兼容路径。
- 文档更新：
  - 客家话前后端 README、Magic Data 平台 README、`docs/platforms/index.md` 已补充评测结论与默认配置口径。

## 2026-05-25（Magic Data 双助手配置重构：模型方案/识别策略拆分）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- `extension/options/options.js`：
  - 闽南语与客家话助手配置统一为双维度：`modelMode(two_stage/omni_single)` + `recognitionStrategy(direct_dialect/mandarin_to_dialect)`。
  - legacy `aiReviewRecognitionMode=recognition_convert` 保留兼容映射，不再作为前端同级模型方案展示。
  - Magic Data 快捷键动作集合同步为新口径：新增 `全部填入AI推荐`、`显示 AI 原始输出`、三块详情折叠切换、刷新采集、重置高度；常规列表移除"填入第一行/填入第二行"。
- `extension/sites/magic-data/minnan-helper/content.js`：
  - 请求体新增并透传 `modelMode`、`recognitionStrategy`，同时保留 legacy `recognitionMode/pipelineMode`。
- `platform-resources/magic-data/minnan-helper/backend/ai-service.js`：
  - 补齐 `modelMode` 与 `recognitionStrategy` 归一化与 defaults/health 回传。
  - `mandarin_to_dialect` 策略继续输出 `recognizedMandarinText`、`convertedDialectText`、`lexiconMatches`、`conversionWarnings`（脱敏）。
- 文档更新：
  - 更新 Magic Data 前后端 README、平台索引与页面结构索引口径，统一使用"模型方案 + 识别策略"描述。
  - 新增 `platform-resources/magic-data/page-structure/12-playwright-edge-dual-helper-mode-shortcuts-2026-05-24.md`。
- MCP 复测状态：
  - 已尝试使用 `playwright-edge`，但本机 Edge 远程调试端口未连通（`ws://localhost:9222/devtools/browser`），本轮无法完成交互复测，仅记录阻塞与待补步骤。

## 2026-05-25（Magic Data 闽南语助手增强：识别转换模式 + 差异对比）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- 前端配置增强：
  - `extension/shared/constants.js` 与 `extension/options/options.js` 新增闽南语 `recognition_convert` 模式选项（识别转换：先听成普通话，再按词表转闽南语）。
  - 闽南语助手模式归一支持 `two_stage / omni_single / recognition_convert`，并保持 DataBaker 逻辑不变。
- 后端链路增强（`platform-resources/magic-data/minnan-helper/backend/`）：
  - `ai-service.js` 新增 `recognition_convert` pipeline：识别普通话 -> 词表转换闽南语 -> 三项预测质检。
  - `ai-prompts.js` 新增识别转换专用 Prompt（listen/compare）。
  - defaults/health 与模式枚举新增 `recognition_convert`，并返回对应默认 Prompt 模板。
  - 原始输出新增识别转换中间产物（脱敏）：`recognizedMandarinText`、`convertedDialectText`、`lexiconMatches`、`conversionWarnings`。
- 闽南语面板差异对比：
  - `assistant-panel.js` 新增字符级轻量 diff（LCS），支持行内建议和右侧详情差异展示。
  - 行内建议保持"正确/建议文本+填入本行"极简规则；右侧详情新增"差异对比"行。
- 文档同步：
  - 更新闽南语助手前后端 README 与平台索引口径，明确新增 `recognition_convert`、差异对比与"无并发配置"规则。
  - 新增复测记录：`platform-resources/magic-data/page-structure/11-playwright-edge-recognition-convert-diff-2026-05-24.md`。

## 2026-05-24（Magic Data 闽南语助手热修：交互稳定性修复）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- `extension/sites/magic-data/minnan-helper/assistant-panel.js`：
  - 行内建议与说话人建议改为按 task 幂等更新，减少 `remove + recreate`，修复 hover 闪烁主因。
  - 说话人"AI建议：正确"不再显示 `填入性别/填入年龄` 按钮；仅需修改时显示填入按钮。
  - 三个详情折叠块状态按 `taskItemId + section` 记忆，修复点击展开后被刷新流程自动收回。
  - 按钮布局固定为两排：上排主操作（`AI质检当前条`、`全部填入AI推荐`），下排辅助操作（刷新/重置/复制摘要/显示原始输出）。
- `extension/sites/magic-data/minnan-helper/content.js`：MutationObserver 过滤扩展自有 UI 变更，避免自触发刷新导致抖动。
- 新增复测记录：`platform-resources/magic-data/page-structure/10-playwright-edge-fix-retest-2026-05-24.md`（Playwright-Edge 交互复测，确认折叠保持与建议节点稳定性）。

## 2026-05-24（Magic Data 闽南语助手只读排查：DevTools MCP）

- 任务按 `ASC_READONLY` 执行：未修改业务代码、未提交、未 push、未生成 CRX。
- 通过 DevTools MCP 只读检查 `#/asrmark`：
  - 已确认说话人属性稳定选择器（`性别/年龄` 的 `.el-form-item` 与 checked radio 选择器）。
  - 已确认文本行稳定选择器（`.region-item` / `.speak-item` / `.edit.region-edit[data-index]`）。
  - 当前页未检测到任何 `data-asc-*` 扩展节点，结论为闽南语助手运行时未挂载，而非字段选择器本身失效。
- 新增参考文档：
  - `platform-resources/magic-data/page-structure/08-devtools-readonly-check-2026-05-24.md`
- 同步更新 `platform-resources/magic-data/page-structure/README.md` 索引。

## 2026-05-23（Magic Data 闽南语助手热修：精简建议展示与独立折叠）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- `assistant-panel.js` 取消左侧独立大空框逻辑，不再创建 side info root；说话人建议改为直接插入平台 `speaker-attributes` 的 `性别/年龄` 表单项。
- 行内文本建议改为极简：
  - 正确仅显示 `正确`；
  - 需改仅显示建议文本 + `填入本行`（无"AI建议"标题、无原因/置信度）。
- 右侧结果区结构改为：总结论置顶 + 三个独立折叠块（`说话人属性`、`闽南语内容`、`普通话文本`），默认全部折叠。
- 右侧按钮移除 `忽略结果`，新增 `全部填入AI推荐`；仅在 AI 有可修改项时显示并可点击，执行时只填需改项（性别/年龄/两行文本），不自动保存、不自动提交。
- 同步更新闽南语助手与 Magic Data 平台文档、页面结构文档口径。

## 2026-05-23（Magic Data 闽南语助手热修：行内建议精简与折叠结果）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- `assistant-panel.js` 修复左侧基础信息挂载：优先插入 `.speaker-attributes` 后方并保持在同一 `.grid-content`，找不到时按 `grid`/面板逐级 fallback，并输出 `side info mounted` 调试日志。
- 左侧基础信息卡不再出现"空白大框"问题，新增"等待采集..."占位；摘要仍不显示预计金额。
- 行内文本建议改为极简模式：
  - 正确仅显示 `AI建议：正确`
  - 需改显示 `AI建议：<建议文本>` + `填入本行`
- 新增说话人属性 AI 建议（性别/年龄）：
  - 正确只显示"正确"
  - 需改显示建议值并提供 `填入性别/填入年龄`（只点真实 radio，不自动保存/提交）。
- 右侧结果区改为"总结论置顶 + 详细结果默认折叠"，并保留原始输出弹窗与复制能力（脱敏）。
- 同步更新 Magic Data 平台资料文档与页面结构文档。

## 2026-05-23（Magic Data 闽南语助手热修：布局与行内推荐优化）

- 保持版本 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- `extension/sites/magic-data/minnan-helper/assistant-panel.js` 调整为"左侧基础信息 + 右侧 AI 面板"：
  - 基础信息改为挂载在页面左侧"说话人属性"下方独立容器。
  - 右侧面板不再展示基础信息与"填入第一行/填入第二行"按钮。
  - 当前条摘要移除"预计金额"显示。
- 新增"显示 AI 原始输出"按钮与弹窗，支持复制；展示脱敏后的 `rawAiDebug/rawModelText/rawJson` 与 `normalizedResult`。
- 新增行内推荐块：在 `.region-item .speak-item` 对应文本行下方展示 AI 建议和"填入本行"按钮，填入后仅写文本并触发输入事件，不自动保存/提交。
- `platform-resources/magic-data/minnan-helper/backend/ai-service.js` 返回脱敏 raw 调试字段，供前端原始输出弹窗展示。
- 同步更新 Magic Data 相关 README 与页面结构文档，明确 `.region-item/.speak-item/.edit.region-edit[data-index|alt]` 选择器口径。

## 2026-05-23（Magic Data 闽南语助手热修：三项预测质检 + 说话人采集修复 + 左右分区）

- 保持版本口径 `0.3.6`，未提升版本、未生成 CRX、未打 tag。
- `extension/sites/magic-data/shared/data-collector.js` 修复 `annotateDetailInfo` 嵌套结构解析：改为优先读取 `payload.data.data`，支持 `base_speak + mark_info[].speak_people` 映射说话人属性。
- 说话人 DOM fallback 改为仅读取已选 radio（`.el-radio.is-checked` / `aria-checked=true`），移除"文本包含男/女/年龄段"误判逻辑。
- `platform-resources/magic-data/minnan-helper/backend` 调整闽南语助手质检语义为"三项预测质检"，新增/兼容 `speakerCheck`、`dialectTextCheck`、`mandarinTextCheck`、`overall` 输出，并保持 `recommendations/audioCheck/textRuleCheck` 与 legacy 字段兼容。
- `extension/sites/magic-data/minnan-helper/assistant-panel.js` 改为左右分区布局：左侧基础信息（摘要/说话人/平台文本），右侧 AI 三项质检与操作区（AI质检、复制、填入、忽略），继续保持"不自动保存、不自动提交"。
- 同步更新 Magic Data 平台资料文档（network/page-structure/minnan-helper README）。

## 2026-05-23（Magic Data 热修：同平台脚本互斥启用 + 版本口径回退到 v0.3.6）

- 修复 Magic Data ANNOTATOR 同平台脚本互斥规则：同一时刻只允许 `客家话助手` 与 `闽南语助手` 其中一个处于启用状态；启用一个时自动关闭另一个。
- `extension/shared/storage.js` 新增 Magic Data 互斥归一与旧数据自愈：历史本地设置若两个助手同时 enabled，读取后自动归一为单一 active 脚本（默认保留客家话助手）。
- `extension/options/options.js` 启停链路改为同平台互斥，脚本卡片状态只显示一个"已启用"；关闭当前脚本时不自动启用另一个。
- `extension/sites/magic-data/hakka-helper/content.js` 与 `minnan-helper/content.js` 在 disabled 或非 activeScriptId 时会停止挂载面板并停止运行时。
- 回退版本口径：`extension/manifest.json` 回退到 `0.3.6`，并同步 `README.md`、`extension/README.md`、相关规则文档与本日志；本轮不发版、不生成 CRX、不打 tag。

## 2026-05-22（Magic Data 闽南语助手功能开发：v0.3.7，后续已回退）

- `extension/manifest.json` 当时版本曾升级到 `0.3.7`；该版本号已在 2026-05-23 热修中按用户要求回退到 `0.3.6`。
- 闽南语助手前端行为对齐客家话助手：仍只在 `#/asrmark` 用户主动触发 AI，不自动保存/提交；并修复与客家话助手并行启用时的结果区 DOM 命名空间互相覆盖风险。
- options 中闽南语助手 AI 设置改为 DataBaker 风格：支持 `two_stage / omni_single`、`fun-asr`/Qwen Omni 听音模型、compare 模型、单模型、thinking、Prompt/参数 override，并保留旧字段兼容。
- 闽南语助手后端路由重构为薄路由：`ai-routes.js` 改为调用 `ai-service.js`，`defaults/health` 返回 DataBaker 风格识别模式与模型选项；支持 `two_stage + fun-asr`、`two_stage + Qwen Omni`、`omni_single + Qwen Omni`。
- 新增 Magic Data 闽南语助手环境变量占位（`MAGIC_DATA_MINNAN_AI_*`）到 `config/env/ai.env.example`，并同步更新 README/docs 口径；本轮未生成 CRX、未打 tag。

## 2026-05-22（platform-resources 全平台目录统一治理：v0.3.6）

- 本轮保持 `extension/manifest.json` 为 `0.3.6`，未重复提升版本号。
- `platform-resources` 平台资料目录统一收口：平台根级统一为 `README.md + backend/ + network/ + page-structure/ + <script-id>/`。
- Alibaba LabelX、DataBaker、Abaka AI 的散落 `network.md / page-structure.md / actions.md / i18n.md` 已迁移到对应标准目录；脚本级资料同步迁移到 `network/` 与 `page-structure/`。
- DataBaker 词表迁移到 `platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.csv`，并同步修正后端读取路径与相关文档口径。
- Alibaba LabelX 平台共用工具 `asr-project-kind.js`、`supplier-utils.js` 收口到 `platform-resources/alibaba-labelx/backend/`，并同步修正快判/转写后端 require 路径。
- Abaka AI Task21 Prompt 资料迁移到 `platform-resources/abaka-ai/task21/backend/ai/`，脚本与平台文档路径同步更新。
- 保留 Magic Data 旧 `annotator` API 兼容能力；本轮未改 AI 业务链路、未改模型默认值、未生成 CRX、未打 tag。

## 2026-05-22（Magic Data 平台资料目录治理与规则沉淀：v0.3.6）

- 本轮保持 `extension/manifest.json` 为 `0.3.6`，未重复提升版本号。
- Magic Data 平台资料目录收口为 `backend/`、`network/`、`page-structure/` + 助手子目录；平台共用页面结构与 Network 统一迁移到根级目录维护。
- 客家话/闽南语词表迁移到各自 `backend/lexicon/`，并同步修正后端词表读取与转换脚本默认路径。
- 删除旧资料目录与散落索引：移除 `platform-resources/magic-data/annotator/`、`shared/`、根级 `network.md`、根级 `page-structure.md`，保留旧 `/api/magic-data/annotator/ai/*` 接口兼容能力。
- 助手目录按长期规则收敛为 `README.md + backend/ + network/ + page-structure/`，其中无专属差异目录用 `.gitkeep` 保留。
- 同步更新 `AGENTS.md` 与 `docs/rules/project-collaboration-rules.md` 的平台资料目录长期规则，并更新 Magic Data 相关 README / 索引文档口径。

## 2026-05-21（新增闽南语助手并重构 Magic Data 结构：v0.3.6）

- 保持 `extension/manifest.json` 版本为 `0.3.6`（本轮未提升版本号）。
- Magic Data ANNOTATOR 前端目录由单 `annotator/` 拆分为 `shared/` + `hakka-helper/` + `minnan-helper/`，并新增闽南语助手脚本入口。
- options / popup 支持同平台双助手独立启停与识别，后端地址仍统一走 options 首页，不新增脚本详情独立后端地址。
- 后端新增 `hakka-helper` 与 `minnan-helper` 路由；保留 `annotator` 旧接口兼容转发，避免历史配置断链。
- 补齐平台与脚本文档（README/docs/env 示例），并明确 AI 仅辅助，不自动保存/提交/审核/领取/流转。

## 2026-05-21（脚本显示名称调整：v0.3.6）

- `extension/manifest.json` patch 版本提升到 `0.3.6`。
- Magic Data 脚本用户可见名称统一为 `客家话助手`（结果区文案统一为"客家话助手结果"）。
- DataBaker 脚本用户可见名称统一为 `闽南语助手`（推荐文本区文案统一为"闽南语助手推荐文本"）。
- 同步 popup、options 脚本卡、页面内面板标题、项目数据下载标签和当前 README/docs 口径。
- 本轮不改 AI 链路、不改模型、不改 Prompt、不生成 CRX、不打 tag。

## 2026-05-21（项目协作规则同步）

- 同步项目级长期协作规则到仓库文档。
- Codex Prompt 默认改为生成 Markdown 文件下载，不再默认在聊天消息中直接贴完整 Prompt。
- 新增资料补充提醒规则：截图、文件、日志、Network、Console、原始 JSON、音频样例等资料需先提醒用户上传并脱敏。
- 新增重复代码复用规则：同一模块重复逻辑超过 2 次优先抽取。
- 新增样式规则：优先 CSS 变量化；有 SCSS 构建链时优先 SCSS 与嵌套结构。
- 新增 Git 规则：commit message 使用中文。
- 新增版本规则：一个开发 / 修复 / 优化对话默认对应一个 patch 小版本；同一对话不重复提升版本。

## 2026-05-21（正式发布：v0.3.5）

- 发布版本提升到 `0.3.5`，正式发布产物以 CRX 三件套为准：
  - `dist/annotation-script-center-v0.3.5.crx`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- 本版本核心变化聚焦近期 DataBaker 能力收口：
  - `AI连续填入合格项` 批量入口、前端并发分析与顺序填入
  - Fun-ASR REST 默认链路与错误分类增强
  - Omni legacy fast path 恢复与 `limit_burst_rate` 真实透出
  - 批量失败"查看原始AI返回"与脱敏 debug JSON
  - 按模型动态归一的并发规则（Omni `15 / 1~25`，Fun-ASR `25 / 1~50`）
  - 批量悬浮窗新增 AI 链路、AI 模型、并发规则、执行耗时等状态展示
- 本次发布不包含敏感信息，不记录完整音频 URL、签名 URL、cookie、token、authorization 或 API Key。

## 2026-05-21（标贝易采一检质检热修：批量悬浮窗显示 AI 配置与执行耗时）

- DataBaker "AI连续填入合格项"顶部悬浮窗新增显示：
  - `当前AI链路`
  - `当前AI模型`
  - `并发规则`
  - `执行耗时`
- 悬浮窗会按当前识别模式和模型展示 AI 配置：
  - `two_stage + fun-asr`：`Fun-ASR + 比较模型`，模型显示 `fun-asr + compareModel`
  - `two_stage + Omni`：`Omni 听音 + 比较模型`，模型显示 `listenModel + compareModel`
  - `omni_single`：`Omni 单模型`，模型显示当前 `singleModel`
- 并发规则展示同步当前模型口径：
  - Omni：默认 `15`，范围 `1~25`
  - Fun-ASR：默认 `25`，范围 `1~50`
- 执行耗时从点击"AI连续填入合格项"开始计时，运行中每秒刷新；任务完成、停止、异常结束或 runtime stop 后会清理计时器，并保留最终耗时。
- 本轮只增强前端状态展示，不改 AI 调用链路、不改并发策略、不改后端模型逻辑。

## 2026-05-21（标贝易采一检质检热修：并发按模型归一 + Fun-ASR 错误分类增强）

- DataBaker Options 中的"AI连续填入合格项并发数量"已移入"ASR 语音 AI 设置"区域，不再留在普通批量/自动化设置区重复显示。
- 并发规则改为按当前识别模式和模型动态归一：
  - Omni：默认 `15`，范围 `1~25`
  - Fun-ASR：默认 `25`，范围 `1~50`
- 前端切换识别模式、听音模型、AI 模型时，并发输入框会立即刷新 `min/max/default`；若当前值超范围会当场强制修正。
- `storage`、DataBaker content runtime 和统一后端 `normalizeRecommendRequest()` 现在都会再次归一并发值；请求体会附带 `frontConcurrency / batchConcurrency / concurrencyModelType` 诊断字段，但不会进入模型 Prompt。
- 顶部悬浮窗中的 `前端并发` 现在显示实际归一后的值；后端 runtime / call log 也会记录 `frontConcurrencyOriginal / frontConcurrencyNormalized / concurrencyModelType`。
- Fun-ASR REST 错误诊断增强：
  - `401/403`：区分鉴权/权限错误
  - `InvalidFile.DownloadFailed / DownloadFailed / audio url cannot be downloaded`：区分平台音频 URL 不可访问
  - invalid model：区分模型名错误
  - `429`：区分上游限流
  - task failed：区分任务失败
  - `transcription_url` 下载失败：区分结果下载失败
- 前端失败文案不再只显示"上游模型接口返回错误"；失败列表继续保留"查看原始AI返回"按钮。
- Fun-ASR debug store 现在保留脱敏后的 `provider / stage / model / providerStatus / providerCode / taskId / taskStatus / responseBody / rawText` 摘要；不包含完整 `audioUrl`、签名 URL、cookie、token、authorization、API Key。
- 新增 / 兼容调试存储环境变量：
  - `DATABAKER_AI_DEBUG_STORE_TTL_MS=1800000`
  - `DATABAKER_AI_DEBUG_STORE_MAX_SIZE=1000`
- 本轮不改 Fun-ASR REST 主链路、不恢复异步 job 默认链路、不改 Qwen 直并发默认策略、不改 manifest。

## 2026-05-21（标贝易采一检质检热修：Qwen Omni 默认直并发与真实限流透出）

- DataBaker Omni legacy 快速路径默认不再对 Qwen 上游做后端平滑发送；前端并发多少，就按该并发直接发送多少条 `recommend` 请求，`30ms` 错峰保持不变。
- 新增环境变量默认值：
  - `DATABAKER_AI_QWEN_SMOOTH_ENABLED=0`
  - `DATABAKER_AI_QWEN_BURST_RETRY_MAX=0`
  - `DATABAKER_AI_QWEN_BURST_RETRY_BASE_MS=1200`
- 只有显式设置 `DATABAKER_AI_QWEN_SMOOTH_ENABLED=1` 时，Omni legacy 才会重新进入 `qwen_omni` / `text_compare` provider queue 平滑；只有手动把 `DATABAKER_AI_QWEN_BURST_RETRY_MAX` 调大时，才会对 `limit_burst_rate` 做退避重试。
- `qwen-openai-compatible.js` 与 DataBaker `ai-client-qwen-legacy.js` 继续识别 SSE `data: {"error": ...}`；若 `error.code=limit_burst_rate`，现在统一返回：
  - `code=qwen-burst-rate-limited`
  - `providerCode=limit_burst_rate`
  - `providerStatus=429`
  - `message=Qwen 请求突增限流，接口返回请求增长过快。`
- 前端失败文案同步改为"Qwen 请求突增限流，接口返回请求增长过快，可降低并发或稍后重试。"；`qwen-empty-response` 仅保留给真正没有 `error` 且没有文本的场景。
- DataBaker Omni 模型选项补齐到：
  - `qwen3.5-omni-plus`
  - `qwen3.5-omni-flash`
  - `qwen3.5-omni-flash-2026-03-15`
  - `qwen3-omni-flash`
  - `qwen3-omni-flash-2025-12-01`
  - `qwen3-omni-flash-2025-09-15`
- Fun-ASR REST provider、异步 job 默认链路、provider queue 其它通用能力、本地 Python fallback 均未改动。

## 2026-05-21（标贝易采一检质检热修：AI 工具卡挂载未就绪改为延迟重试）

- 修复 DataBaker `roundOneCollect` 页面右侧 `DataBaker AI 推荐文本` 工具卡在 DOM 尚未渲染完成时输出 `AI panel mount target not found` 扩展报错的问题。
- `extension/sites/data-baker/round-one-quality/ui-panel.js` 的 `ensureMounted()` 现在找不到挂载点时直接返回 `null`，不再 `throw`、不再 `console.error`、不再 `console.warn` 刷屏；最多只打印一次 `console.debug`：`[DataBaker][round-one-quality] AI panel mount target not ready, will retry.`。
- `findMountTarget()` 现在优先定位"本句话文本"文本框/表单区域，再回退到音频波形右侧内容容器、`.waver-page`、`.right`、`.app-main/.main-container` 内可见主内容容器；跳过不可见节点、已脱离文档节点，不会挂到 `body` 或左侧列表。
- `extension/sites/data-baker/round-one-quality/content.js` 新增 `300ms` 轻量限次重试，并继续依赖既有 `MutationObserver` 重试挂载；页面切题、刷新列表、平台重绘删除 root 后，后续 `refresh` 仍会自动重挂载。
- `clearResult()` 继续只清结果区，不删除根节点；只有 runtime 停止、离开页面、脚本禁用时 `remove()` 才会清掉工具卡。
- 左侧 `filter-screen` 的 `AI连续填入合格项` 按钮与右侧工具卡保持独立；当左侧容器暂时未就绪时，右侧工具卡可先显示，后续左侧容器恢复后会优先回到 `filter-screen`，避免重复插入多个按钮。
- 扩展重载后仍建议刷新 DataBaker 业务页面，避免旧 content script 残留导致 `Extension context invalidated` 或旧挂载逻辑继续驻留。

## 2026-05-21（版本号更新：0.3.4）

- `extension/manifest.json` 版本更新到 `0.3.4`。
- 本次仅更新版本号与文档口径。
- 未生成 CRX、未打 tag、未执行正式发布。
- 后续如需正式发布 `v0.3.4`，应执行 `ASC_RELEASE` 生成 CRX 三件套并推送 main/tag。

## 2026-05-21（Abaka AI Task21助手完成态文档收口）

- Task21助手进入完成态文档口径：字段旁 AI 分析 + 手动"填写 AI 答案"写入流程统一到平台文档。
- same_font / image_b_texts_removed / other_changes / overall 四类分析说明与运行时边界已统一。
- 明确 Monaco（`data-uri + getModels + setValue`）与 Naive UI textarea 写入策略，强调仅用户点击填写按钮才写入。
- image_b_texts_removed 规则统一为 T/B/R/D 多重集：`D == T => true`、`D` 为空 => `null`、其余 `specify`。
- same_font 规则明确支持 `error`，并约束 `false/unsure/error` 时后续字段 `not_applicable`。
- other_changes 规则统一为只比较 `image_b_removed` 与 `image_b`。
- `/task-v2/data-item` 顶部统计入口已挂载（统计当前列表/下载统计CSV）；当前仓库尚未落地统计后端与独立 runtime，文档统一为入口占位口径。
- AI 不自动保存、不自动提交、不自动送审；仅点击"填写 AI 答案"才写入字段。
- 本轮仅文档收尾，不发版、不生成 CRX。

## 2026-05-21（标贝易采一检质检热修：Qwen burst rate SSE 误报修复）

- 修复 `qwen3.5-omni-flash / qwen3.5-omni-plus` 批量失败时把 SSE `data: {"error":{"code":"limit_burst_rate"...}}` 误判成 `Qwen 接口未返回有效文本` 的问题。
- 通用 `qwen-openai-compatible.js` 与 DataBaker `ai-client-qwen-legacy.js` 现在会先识别 SSE `error` 对象，再决定是否属于真正空响应。
- `limit_burst_rate / throttling / rate_limit / limit_requests / TooManyRequests` 现在统一按上游限流分类；DataBaker 前端失败文案改为"Qwen 请求突增限流，后端已重试仍失败。请降低前端并发或增大发送间隔后重试。"
- Omni legacy 快速路径的 `requestListen` / `requestCompare` 现在都进入后端 provider queue：听音走 `qwen_omni`，compare 走 `text_compare`，前端仍保持 `30ms` 发到后端，但上游请求会被平滑。
- 新增环境变量：
  - `DATABAKER_AI_QWEN_BURST_RETRY_MAX=3`
  - `DATABAKER_AI_QWEN_BURST_RETRY_BASE_MS=1200`
- `qwen-burst-rate-limited` 失败会继续生成 `debugId`，并保留"查看原始AI返回"能力；debug 中能看到脱敏后的 `providerCode=limit_burst_rate`、`rawSseText`、`stage`、`model` 等信息。

## 2026-05-21（标贝易采一检质检热修：查看原始 AI 返回弹窗恢复可见）

- 修复 DataBaker 批量失败列表中"查看原始AI返回"按钮点击后无明显反馈的问题。
- 根因是失败按钮在批量运行期间会被 `batchAutofillRunning` 直接禁用，导致用户看到按钮但无法点击；同时弹窗结构样式不完整，不利于确认是否已打开。
- 现在"查看原始AI返回"按钮不再随批量运行态禁用；点击会阻止冒泡并打开文本悬浮窗。
- 新增 / 完整启用 debug modal 结构与样式：
  - 标题：`原始 AI 返回`
  - textarea：展示格式化后的脱敏 JSON
  - 按钮：`复制` / `关闭`
  - 支持点击遮罩关闭
- `loadFailureDebugJson` 的友好错误文案统一为"当前失败项没有可查看的原始AI返回。"。
- 本轮不改模型链路、不改 Omni legacy fast path、不改 Fun-ASR REST provider。

## 2026-05-21（标贝易采一检质检热修：批量失败支持查看原始 AI 返回）

- DataBaker 批量失败列表新增"查看原始AI返回"按钮，统一替代旧的"复制原始JSON"入口。
- 同步 `POST /api/data-baker/round-one-quality/ai/recommend` 失败时，如果属于 `qwen-empty-response`、`model-json-parse-failed`、`provider-http-error` 等可观测错误，会返回 `hasRawAiDebug=true` 和 `debugId`。
- 后端新增 `ai-debug-store.js`，在内存中暂存最近一段时间的脱敏原始 AI debug，默认 TTL 30 分钟、最大 1000 条，不落盘。
- 新增接口：`GET /api/data-baker/round-one-quality/ai/recommend/debug/:debugId`，前端点击失败项按钮后可查看并复制对应的脱敏 debug JSON。
- `qwen-openai-compatible.js` 与 `ai-client-qwen-legacy.js` 现在会在空响应、HTTP 错误时附带 `debugRawAiResponse`，并在批量失败时透传到前端。
- `ai-service.js` 与 `ai-legacy-omni-service.js` 会在 JSON 解析失败或 provider 错误时统一生成 `debugId`，并把 `debugId` 写入调用日志摘要。
- debug 内容会脱敏并截断，不包含完整音频 URL、签名 URL、cookie、token、authorization、API Key。

## 2026-05-21（标贝易采一检质检热修：恢复右侧 AI 推荐工具卡）

- 修复 `roundOneCollect` 页面右侧 `DataBaker AI 推荐文本` 工具卡因挂载目标过窄而未显示的问题。
- `findMountTarget` 现在优先定位 `.waver-page .text-box`，并兼容 `.waver-page`、`.right` 等稳定容器；找到文本框时会挂载到"本句话文本"下方。
- 右侧工具卡恢复后继续保留标题右侧 `AI 推荐文本` 按钮，以及结果区域的 `复制推荐文本 / 填入推荐文本 / 忽略` 三个动作。
- 左侧 `filter-screen` 的 `AI连续填入合格项` 按钮继续保留，且与右侧工具卡的挂载逻辑完全独立。
- 扩展重载后仍需刷新 DataBaker 业务页面，避免旧 content script 残留影响测试。

## 2026-05-21（标贝易采一检质检热修：恢复直接 recommend 请求并统一 120s 超时）

- DataBaker "AI并发分析并连续填入合格项"默认不再通过异步 job 接收 AI 结果，而是直接批量调用 `POST /api/data-baker/round-one-quality/ai/recommend`。
- 当前页有 N 条合格项时，会为 N 条任务调度对应请求；前端默认按 `30ms` 错峰发起，并继续用"AI连续填入合格项并发数量"控制最大活跃请求数，默认 `20`，范围 `1~50`。
- 后端 provider queue / RPM 限流、Fun-ASR REST、Qwen compare、JSON 解析失败复制原始 JSON 能力继续保留。
- 项目级默认时间规则改为：TTS 自动清除保持 `60000ms`，AI / 模型请求默认超时恢复为 `120000ms`；超过 2 分钟仍无法返回时，默认视为链路不适合当前项目。
- `DATABAKER_AI_ASYNC_JOBS_ENABLED` 与历史兼容 `DATABAKER_AI_FUN_ASR_ASYNC_JOBS_ENABLED` 默认均为 `0`；jobs 接口仅保留为历史兼容 / 调试用途。
- 若历史兼容 job 链路仍被调用，job 超时文案改为"当前任务超过120s，请重新请求。"。

# 标注脚本中心修改日志

## 2026-05-21（标贝易采一检质检热修：恢复 Omni legacy 快速路径并修复 debug 函数）

- 修复前端 `loadFailureDebugJson is not defined`：`content.js` 已补安全兜底函数，失败列表继续保留"复制原始JSON"按钮；没有 debug 数据时提示"当前失败项没有可复制的原始 JSON。"。
- `qwen3.5-omni-flash` / `qwen3.5-omni-plus` 默认恢复走 Omni legacy 快速路径，参考提交 `9677e4cea98de222b70f89c9e0af1d89971dc471`。
- 新增 DataBaker 专用 `ai-client-qwen-legacy.js` 与 `ai-legacy-omni-service.js`，只服务 Omni 快速路径，不影响统一 AI 基座与其他平台。
- `two_stage + fun-asr` 仍走当前 Node REST provider；不恢复 Python 主链路，不恢复 async job 默认链路，不做 SSE / batch file_urls。
- `health/defaults` 新增 `omniLegacyFastPath` 与 `omniLegacyCommit`，用于确认当前是否启用 legacy 快速路径。

## 2026-05-21（标贝易采一检质检热修：异步 job 上限 600、60s 强制取消、JSON debug 复制）

- DataBaker `two_stage + fun-asr` 的异步 job store 默认上限改为 `600`，统一 provider queue 默认上限也同步改为 `600`。
- 当 job store 或 provider queue 达到上限时，后端统一返回"后端 AI 任务队列已满，请稍后重试。"，继续保留原有并发与 RPM 保护。
- 新增 `DATABAKER_AI_JOB_TIMEOUT_MS=120000`：历史兼容异步 job 超过 120 秒会被强制标记为 failed，并固定提示"当前任务超过120s，请重新请求。"。
- 超时 job 会触发 `AbortController` 取消或逻辑丢弃迟到结果；迟到结果不会覆盖 failed 状态，不会进入 completedQueue，也不会继续填入页面。
- provider queue、Fun-ASR REST 和 Qwen OpenAI-compatible 链路补充 `signal` 透传与 pending/running abort 支持。
- DataBaker 模型 JSON 解析失败时，错误对象会保存脱敏后的 `debugRawJson`，并新增调试接口：
  - `GET /api/data-baker/round-one-quality/ai/recommend/jobs/:jobId/debug`
- 前端失败列表新增"复制原始JSON"按钮：仅在 JSON 解析失败时出现，点击后优先复制脱敏 debug JSON，剪贴板不可用时降级为 textarea 手动复制。
- 脱敏要求：debug JSON 不包含完整 audioUrl、签名 URL、cookie、token、API Key。

## 2026-05-21（标贝易采一检质检热修：异步 job TTL 改为 1 分钟）

- DataBaker `two_stage + fun-asr` 批量连续填入曾短暂尝试过将异步 job 默认 TTL 调整为 1 分钟（旧口径，现已废弃）。
- 相关 `ai-job-store.js` 代码默认值当时也同步改成了 1 分钟口径；本轮已恢复为 120 秒 AI 超时 + 同步 recommend 主链路。
- 相关 env 示例与说明文档当时也同步改成了 1 分钟口径；本轮已统一恢复为 `120000ms` AI 默认超时。
- 本轮不改 job 最大数量、不改轮询间隔、不改 Fun-ASR REST / compare 链路。

## 2026-05-21（统一默认时间规则：TTS 自动清除 60000ms，AI 默认超时 1 分钟旧口径）

- 根规则更新：
  - `AGENTS.md` 当时新增项目级默认时间规则：TTS 自动清除默认 `60000ms`，AI / 模型请求默认超时曾短暂调整为 1 分钟（现已恢复为 `120000ms`）。
  - 规则明确：新增平台、脚本、AI provider、options 默认值、后端 env fallback 与 README 示例默认沿用该值；非 AI 上传、下载、统计与普通后端接口超时不受影响。
- DataBaker 平台：
  - 当前仓库中实际存在的自动清除时间字段定位为顶部统计悬浮窗 `autoHideMs`。
  - `autoHideMs` 默认从 `30000ms` 调整为 `60000ms`。
  - `aiRecommendRequestTimeoutMs` 相关默认值、前端 fallback、后端 env fallback 当时曾统一改为 1 分钟（旧口径，现已恢复为 `120000ms`）。
- 其他 AI 平台默认超时当时也曾统一为 1 分钟旧口径：
  - Alibaba LabelX ASR 转写 AI
  - Alibaba LabelX ASR 快判 AI
  - Magic Data AI 质检
  - Abaka AI Task21 AI 分析
- 保持不变：
  - DataBaker AI 异步 job TTL `120000`（2 分钟）
  - 非 AI 统计上传超时 `20000`
  - queue/cache/job/poll 等非模型请求时长
  - 用户已手动保存的非默认超时值继续保留，不强制覆盖

## 2026-05-21（标贝易采一检质检热修：Fun-ASR 批量连续填入改为后端异步 job）

- 修复 DataBaker 在 `two_stage + fun-asr` 批量"AI连续填入合格项"时前端大量 `Failed to fetch` 的问题。
- 根因确认：
  - 不是 Fun-ASR 识别失败。
  - 后端日志已显示 Fun-ASR REST submit/poll 甚至 compare 阶段成功。
  - 真正问题是浏览器同步等待 `POST /ai/recommend` 时间过长：请求要同时等待后端队列、Fun-ASR submit、Fun-ASR poll、compare 和返回，`queueWaitMs` 可达 30 秒以上，容易被浏览器、代理或网关中断。
- 新增 DataBaker AI 异步 job 内存存储：
  - `platform-resources/data-baker/round-one-quality/backend/ai-job-store.js`
  - 新增接口：
    - `POST /api/data-baker/round-one-quality/ai/recommend`（默认）
- `POST /api/data-baker/round-one-quality/ai/recommend/jobs`（历史兼容）
- `GET /api/data-baker/round-one-quality/ai/recommend/jobs/:jobId`（历史兼容）
  - job 只保存在当前 Node 进程内存，不落盘；后端重启后丢失是允许行为。
  - job TTL 默认 `120000`（2 分钟），最大 job 数默认 `1000`。
- `ai-routes.js` 保留同步 `POST /ai/recommend`，同时支持异步 jobs：
  - 创建 job 接口快速返回 `jobId`
  - 后台继续执行现有 `ai-service.recommend(...)`
  - 前端轮询 job 状态并在 `succeeded` 后拿到与同步 recommend 相同结构的 `data`
- 前端批量连续填入策略调整：
  - 单条"AI 推荐文本"按钮仍继续走同步 recommend
  - 仅当 `recognitionMode=two_stage` 且 `listenModel=fun-asr` 时，批量连续填入优先走异步 job
  - 其他模式（Qwen Omni 双模型、Omni 单模型）继续走原同步 recommend
  - 仍保持"谁先完成谁进入填入队列"的体验，不等待所有任务结束
- 顶部悬浮窗新增后端 job 统计：
  - `后端任务已提交`
  - `后端任务运行中`
  - `后端任务成功`
  - `后端任务失败`
- 若网络层出现 `Failed to fetch`，前端友好提示改为：
  - `后端连接中断或代理超时；Fun-ASR 批量已改为异步任务，请刷新后重试，或检查后端日志。`
- `health/defaults` 新增 jobs 摘要：
  - `enabled`
  - `ttlMs`
  - `maxSize`
  - `pollIntervalMs`
  - `activeCount`
  - `pendingCount`
  - `runningCount`
  - `succeededCount`
  - `failedCount`
- 统一后端 router 新增 `:jobId` 形式的路径参数匹配，用于 DataBaker jobs 状态查询。
- 本轮不回退 Python，不启用 `file_urls` batch，不实现 SSE；Fun-ASR 主链路仍是 Node REST 单条调用 + provider queue 控制并发。

## 2026-05-20（标贝易采一检质检热修：Fun-ASR 默认改为 Node REST 单条调用）

- DataBaker `fun-asr` 主链路从 Python SDK 子进程默认方案切换为 Node REST 单条调用：
  - 新增 `platform-resources/backend/ai/providers/funasr-rest.js`
  - 新增 `platform-resources/backend/ai/providers/funasr.js`
  - 默认 `DATABAKER_AI_FUN_ASR_PROVIDER=rest`
  - `DATABAKER_AI_FUN_ASR_PROVIDER_FALLBACK` 默认空，不再静默退回 Python
- Fun-ASR REST 采用官方异步任务模式：
  - 提交任务：`POST /api/v1/services/audio/asr/transcription`
  - 查询任务：`POST /api/v1/tasks/{task_id}`
  - 当前只实现单条 REST 调用，不启用 `file_urls` batch
- DataBaker `ai-service.js` 现在只调用统一 `requestFunAsrRecognition(...)` 入口，不再直接依赖 `funasr-python.js`。
- `health/defaults/runtime` 新增 Fun-ASR provider 相关字段：
  - `funAsrProvider`
  - `funAsrRestConfigured`
  - `funAsrPythonConfigured`
  - `funAsrApiBase`（仅 host 摘要）
- Python 代码与 requirements 继续保留：
  - `platform-resources/backend/ai/python/funasr_client.py`
  - `platform-resources/backend/ai/python/requirements.txt`
  仅在显式设置 `provider=python` 或 `fallback=python` 时启用。
- Fun-ASR provider 队列默认并发基线改为 `2`，继续由 `DATABAKER_AI_FUN_ASR_CONCURRENCY` 覆盖；RPM 限流与 queue 保护保持不变。
- 文档与 env 示例已同步更新：
  - Fun-ASR 默认 provider = REST
  - Python 只作 fallback / 调试
  - 修改 env 后需要重启统一 Node 后端
  - 若显式切回 Python，再按根 README 安装 `.venv` 依赖

## 2026-05-20（标贝易采一检质检热修：Fun-ASR 连续填入并发诊断增强）

- DataBaker "AI连续填入合格项"新增运行时诊断：
  - 前端悬浮窗增加 `前端并发`、`已发起AI请求`、`前端活跃AI请求`、`AI已返回`、`待填队列`
  - 前端 console 增加 `[DataBaker][batch] start` 与 `[DataBaker][batch] launch ai request`
- 统一 provider 队列新增诊断日志：
  - `[AIQueue] start`
  - `[AIQueue] finish`
  - `health.queue.groups.*` 明确保留 `pendingCount / activeCount / maxConcurrent / rpm / intervalMs / stats`
- Fun-ASR Python wrapper 新增子进程诊断：
  - `[FunASR] spawn start`
  - `[FunASR] spawn finish`
  - 日志只输出 requestId、模型、时长、rawStatus，不输出完整 `audioUrl`
- DataBaker `fun_asr_compare` 响应新增 `runtime.stageTiming`：
  - `listenQueuedAt / listenStartedAt / listenFinishedAt`
  - `compareQueuedAt / compareStartedAt / compareFinishedAt`
- 新增 `platform-resources/backend/ai/smoke-test-provider-queue.js`：
  - `fun_asr` 并发 `5` + 5 个 `1000ms` mock 任务，总耗时约 `1.1s`
  - `fun_asr` 并发 `1` 时，总耗时约 `5.1s`
  - 证明当前统一 provider queue 已支持同组并发，不是 Fun-ASR Python 子进程天然串行
- 明确口径：
  - Fun-ASR 不支持 thinking，不给 `funasr_client.py` 传 `enable_thinking`
  - thinking 只影响 Qwen Omni / compare 阶段
  - 如果批量看起来像串行，优先先看前端并发值和 `health.queue.groups.fun_asr.activeCount`

## 2026-05-20（标贝易采一检质检热修：识别模式恢复为单双模型联动）

- DataBaker ASR 语音 AI 设置页恢复显示"识别模式"：
  - `two_stage`：显示"听音模型 + 比较模型"
  - `omni_single`：只显示"AI 模型"
- 单模型 `AI 模型` 只允许 `qwen3.5-omni-plus`、`qwen3.5-omni-flash`，默认 `qwen3.5-omni-flash`；不会调用 compare，也不会使用 `fun-asr`。
- 双模型继续显示：
  - 听音模型：`fun-asr`、`qwen3.5-omni-plus`、`qwen3.5-omni-flash`
  - 比较模型：`qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`
- 前端切换识别模式时会立即刷新字段显隐，不需要先保存；从 `fun-asr` 双模型切到单模型时，会把单模型默认显示为 `qwen3.5-omni-flash`。
- 前端新增并持久化 `aiRecommendSingleModel`，并兼容旧配置迁移：
  - `fun_asr_compare` => `two_stage + fun-asr`
  - `qwen_omni_compare` => `two_stage + qwen3.5-omni-flash`
  - `listen_only` => `omni_single + qwen3.5-omni-flash`
- 后端不再信任请求体里的旧 `pipelineMode` 直接决定链路，而是按 `recognitionMode + listenModel/singleModel` 重新推导：
  - `two_stage + fun-asr` => `fun_asr_compare`
  - `two_stage + qwen omni` => `qwen_omni_compare`
  - `omni_single + qwen omni` => `omni_single`
- DataBaker 单模型链路已恢复：使用 `buildOmniSinglePrompt` 单次 Qwen Omni 请求完成听音 + 推荐文本，不调用 compare。
- `health/defaults` 现在返回：
  - `recognitionModeOptions / pipelineModeOptions`
  - `singleModelOptions`
  - `listenModelOptions`
  - `compareModelOptions`
  - `derivedPipelineMode`

## 2026-05-20（标贝易采一检质检：收敛 ai-service、reference 目录改名、Fun-ASR 队列并发）

- DataBaker 后端 AI 业务层从多文件散落改为集中收敛：
  - 新增 `platform-resources/data-baker/round-one-quality/backend/ai-service.js`
  - `ai-routes.js` 改薄，只负责 `health/defaults/recommend` 路由注册、请求体读取与响应返回
  - `ai-service.js` 集中管理请求归一化、链路推导、prompt、schema 解析、词表、文本归一化、成本估算、调用日志、缓存、队列调度和推荐结果组装
- 删除 DataBaker 目录内旧散文件：
  - `ai-prompts.js`
  - `ai-response-schema.js`
  - `ai-cost.js`
  - `ai-call-log.js`
  - `ai-lexicon.js`
  - `ai-text-normalizer.js`
- 删除 DataBaker 目录内旧通用薄封装：
  - `ai-client-qwen.js`
  - `ai-client-funasr.js`
  - `ai-provider-queue.js`
  - `ai-result-cache.js`
  当前 `ai-service.js` 直接引用 `platform-resources/backend/ai/` 统一基座，不再保留中间跳转层。
- DataBaker 参考资料目录从 `platform-resources/data-baker/round-one-quality/ai/` 改名为 `platform-resources/data-baker/round-one-quality/reference/`。
  - `minnan-lexicon.csv` 已迁移到 `reference/minnan-lexicon.csv`
  - 文档统一改成"参考资料"或"词表参考资料"，不再把业务词表目录叫成 `ai/`
- 统一 provider 队列从"单 group 串行 processing"改为"按 group 限流 + 最大并发"：
  - `DATABAKER_AI_QWEN_OMNI_CONCURRENCY=3`
  - `DATABAKER_AI_FUN_ASR_CONCURRENCY=5`
  - `DATABAKER_AI_TEXT_CONCURRENCY=5`
  - 队列仍保留 RPM 限流、队列长度限制、429 指数退避与 jitter
  - `queueMeta` 补充 `activeCount` / `maxConcurrent`
- Fun-ASR 并发问题定位结论：
  - 问题主因不是 thinking，而是旧 `provider-queue.js` 对 `fun_asr` group 整体串行化
  - 修复后允许多个 Fun-ASR Python 子进程同时 in-flight，但仍受 RPM 和 `maxConcurrent` 控制
- thinking 口径补充：
  - Fun-ASR 没有 thinking 概念
  - 不向 `platform-resources/backend/ai/python/funasr_client.py` 传 `enable_thinking`
  - thinking 只影响 Qwen Omni 听音阶段和 compare 阶段
- 文档同步更新：
  - DataBaker backend 当前只保留 `ai-routes.js + ai-service.js` 作为业务层
  - 词表参考资料路径更新为 `reference/minnan-lexicon.csv`
  - Fun-ASR 并发环境变量和 `2 核 2G` 调优建议已写入 README 和 `config/env/ai.env.example`

## 2026-05-20（标贝易采一检质检热修：Fun-ASR Python stdout 强制 UTF-8）

- 修复 DataBaker 在选择 `fun-asr` 作为听音模型时，"AI 听音文本"出现 `�` / 黑菱形乱码的问题。
- 根因确认：
  - Python 端 `funasr_client.py` 原先通过 `json.dumps(..., ensure_ascii=False) + sys.stdout.write(...)` 输出 JSON，Windows 下 stdout 可能走 GBK/CP936。
  - Node 端 `funasr-python.js` 原先直接 `String(chunk || "")` 拼接 stdout/stderr，按 UTF-8 解码 Buffer 时会把非 UTF-8 字节替换成 `�`。
- 本轮修复：
  - `funasr_client.py` 改为通过 `sys.stdout.buffer.write(text.encode("utf-8"))` 输出 UTF-8 JSON。
  - Node 子进程环境显式追加：
    - `PYTHONIOENCODING=utf-8`
    - `PYTHONUTF8=1`
  - Node 端改为先收集 `Buffer`，在 `close` 时统一 UTF-8 解码 stdout/stderr。
  - Python 端拉取 `transcription_url` 结果文件时改为先读 raw bytes，再优先尝试 `utf-8-sig / utf-8`，必要时用 `gb18030` 兜底解析 JSON。
  - 新增乱码保护：如果 `heardText` 中出现明显大量 `�`，直接返回 `fun-asr-mojibake-text`，不再把乱码继续传给 compare 模型或缓存。
- `RULE_VERSION` 升级为 `data-baker-round-one-quality-ai-v4-utf8-funasr-fix`，用于让旧乱码结果失效。
- 文档同步说明：
  - Fun-ASR 通过 Python 子进程调用，Windows 下必须稳定使用 UTF-8。
  - 修复部署后需要重启 `node platform-resources/backend/server.js`，避免旧内存缓存继续显示乱码。
  - `qwen3.5-omni-plus` / `qwen3.5-omni-flash` 不经过 Python 子进程，因此不受该编码问题影响。

## 2026-05-20（标贝易采一检质检：前端改为听音模型 + 比较模型，后端按听音模型自动选链路）

- DataBaker ASR 语音 AI 设置页取消用户可见"AI 模式"，只保留两个核心配置：
  - 听音模型：`fun-asr`、`qwen3.5-omni-plus`、`qwen3.5-omni-flash`
  - 比较模型：`qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`
- 前端不再让用户手动选择 `pipelineMode`；运行时统一由 `listenModel` 推导内部链路：
  - `fun-asr` => `fun_asr_compare`
  - `qwen3.5-omni-plus` / `qwen3.5-omni-flash` => `qwen_omni_compare`
- options 页面切换听音模型时会即时刷新说明：
  - 选择 `fun-asr` 时显示 Python SDK / `.venv` 提示
  - 选择 Qwen Omni 听音模型时隐藏 Python 提示
- 后端恢复并固定为"听音阶段 + 比较阶段"的两段式编排：
  - `fun-asr`：统一 AI 基座 `providers/funasr-python.js` 调 Python SDK 拿到 `heardText`，再调用 compare 模型生成 `recommendedText`
  - `qwen3.5-omni-plus` / `qwen3.5-omni-flash`：统一 AI 基座 `requestOmniInputAudio` 先做听音，再调用 compare 模型生成 `recommendedText`
- `health/defaults` 新增 `listenModelOptions` 和 `compareModelOptions`；`supportedPipelineModes` 仅保留为后端兼容与排查信息，不再作为前端主配置。
- 文档口径同步更新：
  - 不再对用户暴露"Omni 单模型 / Fun-ASR + 比较模型"模式选择
  - Fun-ASR 仅在选择 `fun-asr` 作为听音模型时依赖 Python 虚拟环境
  - Qwen Omni 听音模型不依赖 Python 环境

## 2026-05-20（统一后端 Fun-ASR Python 文件与依赖文件归档）

- Fun-ASR Python 运行环境继续统一收敛到 `platform-resources/backend/`：
  - 虚拟环境：`platform-resources/backend/.venv/`
  - Python 文件：`platform-resources/backend/funasr_client.py`
  - 依赖文件：`platform-resources/backend/requirements.txt`
- 旧文件已迁移，不再作为当前口径使用：
  - `platform-resources/data-baker/round-one-quality/backend/funasr_client.py`
  - `platform-resources/data-baker/round-one-quality/backend/requirements-funasr.txt`
- `ai-client-funasr.js` 改为调起 `platform-resources/backend/funasr_client.py`，缺失环境提示也改为在 `platform-resources/backend` 目录中创建 `.venv` 并安装 `requirements.txt`。
- 根 `README.md` 的命令同步改为在 `platform-resources/backend` 目录中执行：
  - `py -3 -m venv .venv`
  - `pip install -r requirements.txt`
  - `node server.js`
- 文档统一强调：
  - Python 只是 Node 后端内部辅助进程
  - 不单独启动 Python 服务
  - 从项目根目录也仍可运行 `node platform-resources/backend/server.js`

## 2026-05-20（统一后端 Fun-ASR 虚拟环境说明简化）

- 根 `README.md` 的 Fun-ASR Python 环境部署段已简化为"准备统一 `.venv` + 继续用 Node 启动统一后端"的最小主流程。
- 主流程只保留：
  - 创建 `platform-resources/backend/.venv`
  - 安装 `requirements-funasr.txt`
  - 运行 `node platform-resources/backend/server.js`
- `py_compile` 已移到"可选验证"，不再放在部署主流程中，避免误解为必须额外部署或启动 Python 服务。
- 文档统一强调：
  - Python 不作为独立服务启动
  - PM2 / systemd 只管理 Node 后端进程
  - 只有 `fun_asr_compare` 依赖 Python 虚拟环境
  - 默认 `omni_single` 不依赖 Python 虚拟环境
- `platform-resources/backend/README.md`、`platform-resources/data-baker/round-one-quality/backend/README.md`、`platform-resources/data-baker/round-one-quality/README.md` 收敛为短提示，不再重复完整部署命令。

## 2026-05-20（统一后端 Python 虚拟环境口径修复）

- 统一 Python 虚拟环境目录从旧专用目录迁移为 `platform-resources/backend/.venv`。
- DataBaker `ai-client-funasr.js` 默认 Python 查找路径同步改为：
  - Windows：`platform-resources/backend/.venv/Scripts/python.exe`
  - Linux/macOS：`platform-resources/backend/.venv/bin/python`
- Fun-ASR 缺失环境提示同步改为要求在 `platform-resources/backend/.venv` 创建统一 Python 虚拟环境并安装 `requirements-funasr.txt`。
- 明确统一后端标准启动入口仍然是：
  - `node platform-resources/backend/server.js`
- 明确 Python 只是 Node 统一后端内部通过 `child_process` 调用的辅助进程，不是独立后端服务，不需要单独启动 Python。
- DataBaker Fun-ASR 的 `requirements-funasr.txt` 仍保留在模块目录，但安装目标改为统一 `.venv`。
- 文档同步收敛：
  - 根 `README.md` 改为唯一详细部署入口
  - `platform-resources/backend/README.md` 与 DataBaker README 改为统一 `.venv` 口径
  - `docs/platforms/index.md` 与 `platform-resources/README.md` 补充统一启动/统一虚拟环境说明
- `.gitignore` 新增忽略 `platform-resources/backend/.venv/`，并保留旧专用目录忽略项兼容历史遗留目录。

## 2026-05-20（Task21助手：image_b_texts_removed 改为多重集精确匹配）

- Task21 后端 Prompt 版本升级为 `abaka-task21-ai-v5-removed-text-multiset`。
- `image_b_texts_removed` 规则进一步收紧为多重集判断：
  - `T` = target removal text multiset
  - `B` = image_b 可读文本实例多重集
  - `R` = image_b_removed 仍可读文本实例多重集
  - `D = B - R`
- 新规则明确：
  - `D == T` 时必须选择 `true`
  - `D` 为空时必须选择 `null`
  - `D` 非空且 `D != T` 时必须选择 `specify`
- Prompt 新增并强化的误判约束：
  - 不得因为"有文本被删"就一律 `specify`
  - 不得因为"目标文本全删"就一律 `true`
  - `image_b_removed` 中仍保留的文本不得写进删除列表
  - `Logo Variation` 中若 `Logo` 保留、只删 `Variation`，必须写 `1 instance of Variation`
  - `MODERN<br>ABODE` 必须保留 `<br>`，不能改写成空格
  - 左侧说明/红框只能帮助识别 `T`，不能覆盖 `B/R/D` 的图片事实
- 视觉阶段 Prompt 新增多重集与部分删除观察要求：
  - `target_removal_text_candidates`
  - `image_b_visible_text_instances`
  - `image_b_removed_visible_text_instances`
  - `deleted_text_candidates`
  - `extra_deleted_text_candidates`
  - `partially_deleted_target_candidates`
- `ai-routes` 输入归一化调整：
  - `targetRemovalTextHints` 不再去重，保留重复项，支持按多重集传入目标提示
  - `normalizeRemovedLines` 继续保留 `all instances of xxx / 1 instance of xxx / N instances of xxx`
  - 继续自动修正 `intance/intances` 与单复数错误
- `data-collector` 的 `targetRemovalTextHints` 采集不再去重，避免丢失目标文本重复实例信息。
- 文档同步更新：
  - `extension/sites/abaka-ai/task-page/README.md`
  - `platform-resources/abaka-ai/task21/README.md`
  - `platform-resources/abaka-ai/task21/page-structure.md`
  - `platform-resources/abaka-ai/README.md`
  - `platform-resources/README.md`
- 本轮不修改 `manifest.json`，不生成 CRX，不新增依赖，不自动保存/提交/送审。

## 2026-05-20（标贝易采一检质检热修：AI 模式切换即时显示 + Fun-ASR 部署文档补齐）

- 修复 DataBaker ASR 语音 AI 设置页：切换 `AI 模式` 后，模型区域会立即按当前 select 值显示或隐藏，不需要先保存。
- 本次 change 事件只更新当前 options 页面 UI，不会提前写入 `chrome.storage`。
- `omni_single` 下会立即隐藏：
  - Fun-ASR 模型
  - Fun-ASR Python SDK 提示
  - 比较模型
  - 所有模型自定义输入
- `fun_asr_compare` 下会立即显示：
  - 固定 `fun-asr` 模型
  - Fun-ASR Python SDK 提示
  - 四选一比较模型下拉
  - 仍继续隐藏所有模型自定义输入
- DataBaker 新增页面态辅助函数，切换时优先读取当前表单 select 值，不回读旧 `settings/chrome.storage`。
- 补齐 Fun-ASR Python 环境部署文档：
  - Windows 本地创建虚拟环境
  - Linux 服务器创建虚拟环境
  - `DATABAKER_FUNASR_PYTHON_BIN` 与相关环境变量
  - 安装依赖后重启统一后端
  - `health/defaults` 验证步骤
  - `403` 常见原因与临时切回 `omni_single` 的方案

## 2026-05-20（标贝易采一检质检热修：Fun-ASR 部署入口上移到根 README）

- DataBaker Fun-ASR Python 虚拟环境默认路径改为统一后端目录，归到 `platform-resources/backend` 管理。
- `ai-client-funasr.js` 默认查找路径同步改为：
  - Windows：`platform-resources/backend/.venv/Scripts/python.exe`
  - Linux/macOS：`platform-resources/backend/.venv/bin/python`
- 未显式设置 `DATABAKER_FUNASR_PYTHON_BIN` 且默认路径缺失时，错误提示改为要求在统一 `.venv` 中创建虚拟环境并安装 `requirements-funasr.txt`。
- 根目录 `README.md` 新增项目级"Fun-ASR Python 环境部署"完整流程，包含：
  - 适用场景
  - Windows 本地命令
  - Linux 服务器命令
  - 环境变量示例
  - 后端重启方式
  - `health/defaults` 验证步骤
  - Fun-ASR `403` 常见原因与临时切回 `omni_single` 的建议
- `platform-resources/backend/README.md`、`platform-resources/data-baker/round-one-quality/backend/README.md`、`platform-resources/data-baker/round-one-quality/README.md` 与扩展侧 README 收敛为短提示，不再重复整套服务器部署长流程。
- `.gitignore` 新增统一 Python 虚拟环境忽略项；旧路径忽略项保留，兼容本地历史遗留虚拟环境。

## 2026-05-20（标贝易采一检质检热修：DataBaker AI 模式设置页模型显示收敛）

- 修复 标贝易采一检质检 ASR 语音 AI 设置页模型展示逻辑，使其与实际后端模式严格一致。
- `omni_single` 现在是设置页默认模式；切换到该模式时，只显示 AI 模式选择框与通用 AI 参数，不再显示：
  - Fun-ASR 模型
  - Fun-ASR 模型自定义
  - 比较模型
  - 比较模型自定义
  - Fun-ASR Python SDK 提示
- `fun_asr_compare` 模式下：
  - Fun-ASR 模型固定为 `fun-asr`
  - 不允许自定义 Fun-ASR 模型
  - 比较模型只允许 `qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`
  - 默认比较模型为 `qwen3.5-plus`
  - 旧配置若落在上述 4 个之外，会自动迁移为 `qwen3.5-plus`
- 修复 DataBaker 设置页历史残留的 `[object Object]` 风险：
  - 常量层新增 DataBaker 专用比较模型选项数组
  - options / storage / content 对对象值、空值、`[object Object]`、非法旧值统一做安全归一
- DataBaker 保存逻辑收敛：
  - `omni_single` 保存时不再写入无意义的 compare model override
  - `fun_asr_compare` 保存时 `listenModel` 固定为 `fun-asr`
  - `fun_asr_compare` 保存时 `compareModel` 只允许四选一
- DataBaker 运行时请求体同步收敛：
  - `omni_single` 不再把 compare model 作为实际调用依据
  - `fun_asr_compare` 运行时固定 `listenModel=fun-asr`

## 2026-05-20（标贝易采一检质检热修：恢复 Omni 默认并改用 Python Fun-ASR 客户端）

- 标贝易采一检质检 AI 默认模式恢复为 `omni_single`，前端 options 与后端 defaults 统一改为默认展示 `Omni 单模型（默认）`。
- 修复 ASR 语音 AI 设置中的"听音模型"下拉显示 `[object Object]`：
  - options 侧模型选项渲染改为同时兼容字符串数组和 `{ value, label }` 对象数组。
  - DataBaker 模式切换时改为按 `omni_single / fun_asr_compare` 分别展示对应模型字段。
- DataBaker 前端模式只保留：
  - `omni_single`：默认，调用 `ai-client-qwen.js`
  - `fun_asr_compare`：调用 Python Fun-ASR 客户端，再调用 compare 模型
- Fun-ASR 不再由 Node 手写 REST 直接调用：
  - 新增 `platform-resources/data-baker/round-one-quality/backend/funasr_client.py`
  - 新增 `platform-resources/data-baker/round-one-quality/backend/requirements-funasr.txt`
  - `ai-client-funasr.js` 改为 Node wrapper，通过 `child_process` 调用 Python SDK 脚本
  - Python 脚本只从环境变量读取 `DASHSCOPE_API_KEY`，不把 API Key 暴露到命令行参数
- Fun-ASR Python 虚拟环境改为统一复用后端 `.venv`，并忽略 `__pycache__` 等运行产物，不提交 Git。
- 后端链路明确分离：
  - `pipelineMode=omni_single`：只走 `requestOmniSingle`
  - `pipelineMode=fun_asr_compare`：只走 `requestFunAsrRecognition -> requestCompare`
  - 历史 `two_stage / qwen_omni_two_stage / listen_only` 只兼容迁移为 `omni_single`，不再保留旧执行逻辑
- Fun-ASR 友好错误增强：
  - Python 环境缺失时返回统一 `.venv` 缺失提示，要求先安装 `requirements-funasr.txt`
  - `403` 时提示可能是 DashScope 权限/地域、API Key 权限或平台 `audioUrl` 对服务端不可访问，并建议先切回 `omni_single`
  - `fun-asr` 模型名错误时明确提示必须使用小写 `fun-asr`
- 统一后端 `health/defaults` 补充 `funAsrPythonConfigured`，便于前端和人工排查 Python 环境是否就绪。
- 同步更新：
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/backend/README.md`
  - `platform-resources/backend/README.md`
  - `config/env/ai.env.example`
  - `.gitignore`

## 2026-05-20（标贝易采一检质检：AI 模式收敛为 Fun-ASR + Omni 单模型）

- 标贝易采一检质检 AI 推荐架构收敛为仅保留两种模式：
  - `fun_asr_compare`：默认批量模式，先走 Fun-ASR 录音文件识别，再走 compare 文本模型。
  - `omni_single`：高质量兜底模式，单次 Qwen Omni 请求同时完成听音、比对与推荐。
- 删除旧运行口径：
  - `qwen_omni_two_stage`
  - `two_stage`
  - `listen_only`
- 历史环境变量或前端旧配置若仍传以上旧值，后端只做兼容迁移到 `omni_single`，并在 `health/defaults` 与日志中给出 deprecated 提示；不再保留旧执行分支。
- 新增 Fun-ASR 专用客户端：按阿里云百炼录音文件识别异步任务提交/轮询/结果获取链路实现，不再把 Fun-ASR 当成 OpenAI-compatible chat 模型调用。
- 新增 Omni 单模型链路：`omni_single` 只发起一次 Qwen Omni `input_audio` 请求，不再额外调用 compare 模型。
- 新增 provider/model group 级统一后端限流队列：
  - `qwen_omni` 默认 `45 RPM`
  - `fun_asr` 默认 `500 RPM`
  - `text_compare` 默认 `500 RPM`
  - 队列支持最大长度保护、`429` 指数退避 + jitter 重试、health/defaults 队列快照。
- 新增推荐结果内存 TTL 缓存：
  - key 使用 sha256
  - 不保存完整 `audioUrl`
  - 默认 TTL `12 小时`
  - health/defaults 可查看 cache hit/miss 摘要
- 标贝易采前端配置调整：
  - options 中 AI 模式只显示 `fun_asr_compare` 与 `omni_single`
  - 默认模式改为 `fun_asr_compare`
  - AI 连续填入默认并发从 `50` 下调到 `5`
  - 并发最大值建议下调到 `10`
  - 顶部悬浮窗与错误提示新增"AI 排队 / 限流重试 / AI 分析失败"等友好状态
- 后端与文档统一强调：
  - `429` 根因是上游模型或账号维度限流，不是 `2 核 2G` 服务器算力问题
  - 多个 RAM 用户或 API Key 若归属于同一阿里云主账号，也可能共享限流额度
  - Fun-ASR 真实可用性仍取决于模型服务是否能访问平台 `audioUrl`
  - 浏览器不直连 DashScope，所有上游请求统一走后端
- 更新文档与配置：
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/README.md`
  - `platform-resources/data-baker/round-one-quality/network.md`
  - `platform-resources/data-baker/round-one-quality/backend/README.md`
  - `platform-resources/backend/README.md`
  - `platform-resources/README.md`
  - `config/env/ai.env.example`

## 2026-05-19（Task21助手：image_b_texts_removed 改为 T/B/R/D 差异判断）

- Task21 后端 Prompt 版本升级为 `abaka-task21-ai-v4-image-b-removed-diff`。
- `image_b_texts_removed` 规则从"简单找消失文本"升级为四集合判断：
  - `T` = target removal texts，目标删除文本范围，只作辅助
  - `B` = image_b 中可读文本实例
  - `R` = image_b_removed 中仍可读文本实例
  - `D = B - R`
- 新规则明确：
  - 删除只看 `image_b` 与 `image_b_removed`
  - `image_a` 不参与 `image_b_texts_removed` 删除判断，只用于 `same_font`
  - `true` 只在"只有目标文本完整删除且无额外多删"时成立
  - `specify` 用于目标文本部分删除、额外多删除或需要列出具体删除项
  - `null` 用于 `D` 为空
- Prompt 强化了多实例与比较口径：
  - case-insensitive
  - 普通空格/普通字距差异可忽略
  - line breaks / `<br>` 有意义，不能与无换行文本合并
  - `all instances of xxx / 1 instance of xxx / N instances of xxx` 为唯一合法标准答案格式
- 视觉阶段 Prompt 强化：
  - 必须观察 `target_removal_text_candidates`
  - `image_b_visible_text_instances`
  - `image_b_removed_visible_text_instances`
  - `deleted_text_candidates`
  - `extra_deleted_text_candidates`
  - 并在提示中要求尽量体现 `text/normalized_text/location/count/deleted_count/is_target_text/confidence`
- `ai-routes` 归一化增强：
  - `normalizeRemovedLines` 保留 `all instances of xxx`
  - 自动修正 `intance/intances`
  - 自动修正 `1 instances -> 1 instance`
  - 自动修正 `2 instance -> 2 instances`
  - `choice=specify` 但无合法 lines 时自动降级 `null`
- 前端 Task21 面板保持标准答案原样展示与复制，不改写 `all instances of xxx`。
- 调试信息新增 warnings 摘要，后端拼写修正会出现在折叠调试信息中，不会塞进主答案。
- `data-collector` 新增 `targetRemovalTextHints`，当前仅安全提取页面已有 `image_b_texts_removed` 文本作为辅助，不采集敏感 URL。
- 文档同步更新：
  - `extension/sites/abaka-ai/task-page/README.md`
  - `platform-resources/abaka-ai/task21/README.md`
  - `platform-resources/abaka-ai/task21/page-structure.md`
  - `platform-resources/abaka-ai/README.md`
  - `platform-resources/README.md`
- 本轮不修改 `manifest.json`，不生成 CRX，不新增依赖，不自动保存/提交/送审。

## 2026-05-19（Task21助手热修：Monaco data-uri 写入与运行时版本标识）

- 修复 Task21助手在 `image_b_texts_removed=specify` 场景下仍提示"已选择 specify，但未找到输入框"的问题。
- 根因拆分为两层：
  - 旧定位策略仍偏向"搜索根 + 全局候选"，没有先在当前 `.l-item` 内精确锁定 `image_b_texts_removed` 的 `custom-md-editor / Monaco`。
  - 用户页面仍出现 `2500ms` 提示，说明浏览器可能仍在运行旧版 content script，缺少可观测的运行时版本标识。
- `dom-actions` 热修：
  - 新增 `findTask21FieldItemByTitle(fieldName)`：优先遍历 `.l-item`，在每个块内精确匹配 `.l-title-text`。
  - `image_b_texts_removed` 的查找范围改为"当前 `.l-item` 内的 `.custom-md-editor/.monaco-container/.monaco-editor/textarea.inputarea/.view-lines`"，不再跨字段找全局 Monaco。
  - `other_changes` 继续使用 Naive UI textarea（`textarea.n-input__textarea-el`），也收紧到当前 `.l-item` 内。
  - `isMonacoTextareaCandidate` 不再因为 Monaco textarea 高度小、视觉隐藏等结构特征误判。
  - `waitForFieldTextInput` 对 `image_b_texts_removed` 改为 `5000ms`、`80ms` 轮询，并返回 `fieldItemFound/titleFound/customMdEditorFound/monacoContainerFound/monacoEditorFound/monacoDataUri/monacoTextareaFound/viewLinesFound/viewLinesPreview/candidateCount` 诊断。
  - Monaco 写入顺序改为：
    - 优先 `.monaco-editor[data-uri]` -> `window.monaco.editor.getModels()` -> `model.setValue(text)`
    - 再尝试 editor instance 匹配写入
    - 再尝试 `execCommand("insertText")` + input 事件链
    - 最后才走 textarea fallback；fallback 只返回"需人工确认"，不伪造模型已同步
  - 新增 Console 调试入口：
    - `window.__ASCEdgeAbakaAiDomActions.debugFindFieldTextInput(fieldName)`
    - `window.__ASCEdgeAbakaAiDomActions.debugFillFieldText(fieldName, text)`
- `ai-panel` 热修：
  - 新增 `TASK21_ASSISTANT_RUNTIME_VERSION = task21-assistant-fill-v2-20260519`
  - `image_b_texts_removed/other_changes` 的 `specify` 等待统一改为常量 `FIELD_INPUT_WAIT_MS=5000`
  - 调试信息追加 `runtimeVersion` / `domActionsVersion`
  - 面板副标题和结果 meta 显示运行时版本，便于判断当前页面是否已加载新脚本
  - `image_b_texts_removed` 若已找到 Monaco 容器但模型写入失败，提示改为"已找到 Monaco 编辑器，但写入模型失败：..."
- `content.js` 启动时输出：
  - `[ASC][Abaka AI] Task21 assistant runtime version: task21-assistant-fill-v2-20260519`
- 文档同步更新：
  - `extension/sites/abaka-ai/task-page/README.md`
  - `platform-resources/abaka-ai/task21/README.md`
  - `platform-resources/abaka-ai/task21/page-structure.md`
- 本轮不修改 `manifest.json`，不生成 CRX，不新增依赖，不自动保存/提交/送审。

## 2026-05-19（Task21助手：Prompt 规则升级与结果归一化增强）

- Task21 后端 Prompt 版本升级为 `abaka-task21-ai-v3-annotation-rules`，按用户 Word 规则重写流程、same_font、image_b_texts_removed、other_changes、特殊场景与输出格式约束。
- same_font 新增 `error` 选项，并约束 `same_font=false/unsure/error` 时后续字段统一 `not_applicable`，`workflow.skip_later_fields=true`。
- 移除旧规则中"禁止 all instances of xxx"的限制；`image_b_texts_removed` 归一化现支持：
  - `all instances of xxx`
  - `N instance of xxx`
  - `N instances of xxx`
- `normalizeRemovedLines` 继续拒绝 bullet/编号/解释行，保留句尾清理与单复数自动修正（如 `1 instances` -> `1 instance`）。
- 强化 `other_changes` 口径：只比较 `image_b_removed` 与 `image_b`，用于承载替换行为、图文错位、图案/布局/画质等非纯删字变化。
- 前端 Task21 面板兼容更新：
  - same_font 结果与填写支持 `error`。
  - image_b_texts_removed 的 `all instances of xxx` 展示与复制保持原样。
  - overall 填写在 same_font=error 时与 false/unsure 一样停止后续字段填写。
- 本次不新增模型名，保持 `qwen3.6-plus` 口径；未能联网核对官方文档。

## 2026-05-19（Task21助手热修：Monaco/Naive 输入区定位与视觉模型默认口径）

- 修复 Task21助手"填写 AI 答案"在 `image_b_texts_removed=specify` 与 `other_changes=specify` 下仍提示找不到输入框的问题。
- 根因是输入区定位仍偏向 radio 容器，未稳定覆盖字段完整容器与分离渲染的输入区（`custom-md-editor/monaco-editor` 与 `n-input__textarea-el`）。
- `dom-actions` 热修：
  - 强化字段标题定位：优先 `.l-title-text`，并过滤 AI 面板节点，降低同名文本误命中。
  - 新增字段搜索根与范围控制：优先完整字段块并在标题后有限区域查找，避免串填相邻字段。
  - `findFieldTextInput` 补齐优先级：Naive UI textarea -> Monaco inputarea -> 通用 textarea/input/contenteditable。
  - `waitForFieldTextInput` 默认等待提升到 `4000ms`，超时返回结构化诊断（标题/容器/custom-md/monaco/inputarea/naive/candidateCount）。
  - Monaco 写入改为多策略：Monaco API -> `execCommand` 输入 -> `textarea` fallback（fallback 给出人工确认提示）。
- `ai-panel` 热修：
  - `specify` 流程改为先等待输入框（`4000ms`）再写入。
  - 失败提示携带诊断细节，不再只显示笼统"未找到输入框"。
  - 对 fallback 警告在面板状态中显示"需要人工确认"。
- 视觉模型默认口径补强：
  - 前后端与存储侧继续使用 `qwen3.6-plus` 作为默认视觉模型。
  - `qwen3.6plus`、`qwen-vl-*-latest` 等历史写法统一做归一（含大小写兼容）后再落配置。
  - storage 侧模型归一新增候选校验，非法值回退到允许列表默认值（视觉默认 `qwen3.6-plus`）。
- 安全边界保持不变：仅用户点击"填写 AI 答案"才写入；不自动保存、不自动提交、不自动送审、不点 checkbox。

## 2026-05-19（Task21助手：specify 输入区写入兼容修复）

- 修复 Task21助手"填写 AI 答案"在 `image_b_texts_removed` / `other_changes` 场景下无法写入的问题。
- 根因是旧逻辑只在 radio 容器内找输入框，未覆盖字段完整 `.l-item`、`.l-label`、Monaco/custom-md-editor 与 Naive UI textarea 的真实结构。
- `dom-actions` 增强：
  - 新增完整字段容器定位与标签容器收集（`l-title-text -> l-item -> l-label`）。
  - `findFieldTextInput` 新增多选择器优先级：`n-input__textarea-el`、Monaco `textarea.inputarea`、普通 textarea/input/contenteditable。
  - 支持 `waitForFieldTextInput(fieldName, timeoutMs)`，用于 radio 切换后等待输入区渲染。
  - `setTextValue` 增强 Naive UI textarea 事件链（`input/change/compositionend`）与 Monaco 多策略写入（Monaco API / execCommand / fallback）。
- `ai-panel` 增强：
  - `specify` 选择后先等待输入框（默认 2500ms）再填值。
  - 失败提示细化为"已选择 specify，但 2500ms 内未找到输入框"或"文本写入失败：xxx"。
- 安全边界不变：AI 仅辅助，只有用户点击"填写 AI 答案"才写入；不自动保存、不自动提交、不自动送审、不点 checkbox。

## 2026-05-19（DataBaker 一检导出上传改为累计合并）

- 修复标贝易采一检导出上传覆盖 `latest.csv` 的问题：后端改为"读取已有 latest.csv + 本次 CSV 按唯一键合并后回写"。
- 唯一键口径固定为"文本编号"优先且默认；仅当文本编号为空时才使用兜底键（`文件名+段编号`、`文件名`、`采集人+手机号+段编号`、稳定 JSON）。
- 明确 `taskId/taskIds` 仅用于元信息、日志和排查，不参与唯一键判断；不会因为任务ID不同而保留相同文本编号的重复行。
- 新增标准 CSV 解析与写出（支持 UTF-8 BOM、逗号、双引号、换行转义），并在写出时归一化旧列名 `有效时长(秒)` / `有效合格时长` 为 `有效时长`。
- `latest-raw.json` 改为按文本编号等价字段优先合并；rawRecords 合并失败不会阻断 CSV 合并，会进入 warnings。
- 上传响应新增合并统计：`incomingRowCount/existingRowCount/addedRowCount/updatedRowCount/unchangedRowCount/rowCount/taskIds`，并保留下载接口不变：
  - `GET/HEAD /api/data-baker/round-one-quality/export/download`
- `DATABAKER_ROUND_ONE_EXPORT_HISTORY=1` 时继续保存每次"原始上传 CSV + 原始 rawRecords 历史文件"，不保存累计快照。

## 2026-05-18（Task21助手：UI 收敛、手动填写与规则口径修复）

- 将 Abaka Task21 脚本用户可见名称统一为 `Task21助手`（脚本库标签、短标签、状态标签与说明文案同步）。
- Options 的 Task21助手详情页新增 AI 设置隐藏机制：
  - 默认隐藏 `analysisMode/visionModel/ocr/reasoning/single/thinking/timeout` 等 AI 调试字段。
  - 在详情页标题连续点击 10 次后显示（仅当前页面会话生效）。
  - 未解锁时保存不会重置隐藏 AI 配置，已解锁时才读取并保存 AI 字段值。
- Task21 AI 悬浮窗重构为"结果优先"主视图：
  - 主视图仅展示推荐选择、标准答案、理由、`填写 AI 答案` 按钮。
  - 调试信息与原始 JSON 改为折叠隐藏。
  - 新增拖动、宽高调整、重置位置；布局保存在 `asc-abaka-task21-ai-panel-layout-v1`。
- 新增"填写 AI 答案"执行链路（仍保持手动触发）：
  - 仅在用户点击按钮时写入页面字段。
  - 通过 `dom-actions` 新增 `fillFieldText/setTextValue` 支持 textarea、text input、contenteditable。
  - 写入时检查 disabled/readOnly/aria-disabled，使用原生 setter + `input/change` 事件。
  - 不自动保存、不自动提交、不自动送审、不点击 checkbox。
- 后端 Task21 规则与归一化加强：
  - `image_b_texts_removed` 强制按 `image_b` vs `image_b_removed` 口径，`specify` 标准答案仅允许 `N instance(s) of xxx`；非法行进入 warnings 并过滤。
  - `other_changes` 强制按 `image_b_removed` vs `image_b` 口径，`specify` 输出英文短句。
  - 输出新增 `choice` 字段并保持旧 `value/value_type` 兼容。
- 模型默认值保持 `qwen3.6-plus`，并兼容误填 `qwen3.6plus -> qwen3.6-plus`（前端/后端/存储归一）。
- 本次未能联网核对官方文档，保留项目当前 `qwen3.6-plus` 口径。

## 2026-05-18（LabelX ASR 下载中文文件名响应头异常修复）

- 修复 LabelX 快判与转写 `statistics/download?supplier=<供应商>` 在中文供应商文件名场景下触发 `Invalid character in header content ["Content-Disposition"]` 的问题。
- 原因是 `Content-Disposition` 的 `filename` 参数直接使用了中文文件名，Node HTTP Header 校验会拒绝非 ASCII 字符。
- 修复后下载响应头改为：
  - `filename` 使用 ASCII fallback 文件名（去除 CR/LF、双引号、路径非法字符与非 ASCII）。
  - `filename*` 使用 RFC 5987 形式 `UTF-8'' + encodeURIComponent(中文文件名)`，保留中文供应商展示名。
- 保持既有逻辑不变：supplier 过滤规则、404 不回退总表、`HEAD` 无 body、`Content-Length` 与实际内容一致。

## 2026-05-18（LabelX ASR 下载 supplier 过滤与时间文件名修复）

- 修复 `alibaba-labelx/asr-judgement` 与 `alibaba-labelx/asr-transcription` 的 `statistics/download?supplier=<供应商>` 失效问题：不再复用根级总表文件路径回传，而是从 `store.loadRows()` 内存数据按供应商归一规则过滤后动态生成 CSV 响应。
- 过滤规则对齐 `platform-resources/alibaba-labelx/supplier-utils.js`：支持中文供应商名（如海天、希尔贝壳、棋燊）、safeSupplier 以及可归一名称匹配。
- 当 `supplier` 非空但无匹配数据时，下载接口改为返回 `404` JSON（不回退下载总表）。
- 为快判与转写下载接口新增时间文件名（Asia/Shanghai，`YYYYMMDD-HHmm`），并同时输出 `filename` 与 `filename*=UTF-8''`：
  - 总表：`asr-judgement-statistics-merged-YYYYMMDD-HHmm.csv`、`asr-transcription-statistics-merged-YYYYMMDD-HHmm.csv`
  - 供应商：`asr-judgement-<safeSupplier>-statistics-YYYYMMDD-HHmm.csv`、`asr-transcription-<safeSupplier>-statistics-YYYYMMDD-HHmm.csv`
- `HEAD /download` 供应商模式与总表模式都保持无 body，且 `Content-Length` 与对应 `GET` 一致。
- 本轮未恢复 `statistics-data/suppliers/<供应商>/statistics-merged.csv` 写盘，不新增依赖，不改前端扩展逻辑。

## 2026-05-18（发布 v0.3.3）

- 提升 `extension/manifest.json` 版本到 `0.3.3`。
- 发布 CRX 三件套：
  - `dist/annotation-script-center-v0.3.3.crx`
  - `dist/annotation-script-center-update.xml`
  - `dist/annotation-script-center-crx-latest.json`
- DataBaker 一检质检新增/完善 AI 连续填入合格项：
  - 默认 `50` 并发请求 AI 推荐。
  - AI 结果按返回顺序进入队列并串行填入。
  - 顶部统计悬浮窗显示进度、失败记录和重试填入入口。
  - 不自动保存、不自动提交、不点击 checkbox。
- Abaka AI Task21 增强快捷键与 AI 分析调试能力。
- LabelX / DataBaker CSV 统一"有效时长"字段。
- 补充项目级自动化安全规则。
- 本轮未提交运行数据、密钥、token、cookie、CRX 私钥。

## 2026-05-18（Options 首页品牌图改为背景）

- 将 Options 首页 `options-hero.svg` 从独立横幅调整为 hero 板块背景视觉。
- 保留扩展图标、popup logo、options 品牌资源路径。
- 删除本地临时资源目录 `_incoming_visual_assets`，不作为正式资源提交。
- 未修改平台 content script、后端接口、业务逻辑。
- 未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-18（扩展品牌图标与首页横幅）

- 新增扩展图标资源，并在 `extension/manifest.json` 的 `icons` 与 `action.default_icon` 中启用。
- popup 标题区加入品牌 logo（`asc-logo.svg`）。
- options 首页 hero 区加入品牌横幅（`options-hero.svg`）。
- 未修改平台 content script、后端接口、业务逻辑。
- 未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-18（DataBaker：AI 返回顺序填入与顶部统计悬浮窗）

- AI连续填入合格项改为按 AI 返回顺序消费结果队列并串行填入，不再按左侧列表顺序阻塞等待。
- 默认并发数保持 `50`，当前页合格项先并发请求，返回结果进入缓冲队列。
- 新增顶部统计悬浮窗：运行中展示 AI 返回、待填队列、填入成功/失败/跳过等统计。
- 结束后悬浮窗保留约 30 秒；失败列表展示填入失败条目。
- 新增"重新填写失败内容"按钮：仅复用已有推荐文本重试填入失败项，不重新请求 AI。
- 保持边界：不自动保存、不自动提交、不点击 checkbox。
- 未新增后端接口，未提升版本，未生成发布产物。

## 2026-05-18（DataBaker：并发 AI 返回即缓冲并顺序填入）

- AI连续填入合格项改为生产者-消费者调度：并发 AI 请求作为生产者，返回结果先进入缓冲区；页面填入作为消费者按列表顺序串行执行。
- 当前页合格项默认并发数调整为 `50`，仍可在 Options 调整为 `1-50`。
- 填入流程不再等待全部 AI 请求完成，只要当前顺序所需结果返回就立即开始填入；后返回结果继续留在缓冲区等待顺序消费。
- 运行中再次点击按钮或按 `Alt+Q` 可停止：不再启动新请求，已发起请求自然结束，当前条完成后停止后续填入。
- 保持安全边界：不跨页、不自动保存、不自动提交、不点击 checkbox、不处理不合格/未质检。
- 未新增后端接口，未提升版本，未生成发布产物。

## 2026-05-18（DataBaker：合格项并发 AI 分析后顺序填入）

- "AI连续填入合格项"改为先并发分析当前页全部质检合格项，再按顺序切换并填入。
- 新增并发数配置 `aiQualifiedAutofillConcurrency`，默认 `5`，范围 `1-50`。
- 增加 `aiQualifiedAutofillWaitAllBeforeFill`（默认 `true`），先等待全部 AI 分析返回再进入填入阶段。
- `Alt+Q` 继续作为启动/停止；运行中再次触发会请求停止。
- 不跨页、不自动保存、不自动提交、不点击 checkbox。
- 未新增后端接口，未提升版本，未生成发布产物。

## 2026-05-18（DataBaker：连续 AI 填入质检合格项）

- 将"AI填入合格项"升级为"AI连续填入合格项"。
- 当前页内自动筛选 `statusName=质检合格` / DOM"一检合格"数据，逐条切换、AI 推荐并填入。
- `Alt+Q` 支持启动/停止连续处理；运行中再次触发会请求停止（当前条结束后不再继续下一条）。
- 保持不跨页、不自动保存、不自动提交、不点击 checkbox，`质检不合格` / `未质检` / 状态未知均跳过。
- 未新增后端接口，未提升版本，未生成发布产物。

## 2026-05-18（DataBaker：AI填入合格项挂载到筛选栏并加快捷键）

- 将"AI填入合格项"按钮挂载到左侧列表上方 `filter-screen` 区域、"批量判定"右侧。
- 新增 `Alt+Q` 快捷键触发 AI填入合格项。
- 保持只处理 `statusName=质检合格`，不自动保存、不自动提交、不点击 checkbox。
- 未新增后端接口，未提升版本，未生成发布产物。

## 2026-05-18（Abaka AI：补齐 Task 页面只读采集壳资料目录）

- 新增 `platform-resources/abaka-ai/task-page/README.md`，补齐只读采集壳资料目录（采集目标、Console 导出方法、脱敏边界、后续接口模板）。
- 同步更新 `docs/platforms/index.md` 与 `platform-resources/README.md` 索引，确保 Abaka AI Task 页面只读采集资料可被直接导航。
- 本轮仅文档补齐，不新增业务自动化能力；未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-18（DataBaker：AI填入合格项位置与刷新修复）

- 修复 `toPositiveNumber` 未定义导致 AI填入合格项失败的问题。
- 将 AI填入合格项按钮移动到顶部任务信息栏"抽检允许错误数量"右侧区域（定位失败时回退到面板内）。
- 点击后先刷新当前页 `queryCollectStatementByCondtion` 数据，再筛选 `statusName=质检合格`。
- 每次只处理当前页下一条合格项，不自动保存、不自动提交。
- 未硬编码 token/cookie，未新增后端接口，未提升版本，未生成发布产物。

## 2026-05-18（DataBaker：AI 自动填入质检合格项）

- 新增"AI填入合格项"按钮。
- 点击后刷新当前页 `queryCollectStatementByCondtion` 数据，只筛选 `statusName=质检合格`。
- 自动选中合格条，调用现有 AI 推荐并填入推荐文本。
- `质检不合格`、`未质检` 不分析。
- 每次只处理当前页下一条合格项，不自动保存、不自动提交、不批量流转。
- 请求使用页面登录态 `credentials: include`，不硬编码 token/cookie。
- 未新增后端接口，未提升版本，未生成发布产物。

## 2026-05-18（LabelX：海天供应商与判断/转写历史 CSV 分类修复）

- 新增海天供应商识别，贝壳任务名统一归一到希尔贝壳；`supplier=H` 且任务名含海天语义时归一为海天。
- 新增 `platform-resources/alibaba-labelx/asr-project-kind.js`，项目类型识别优先级为：`payload.project` / `payload.rawKeys.labelModel` > `taskName` > CSV schema > 题数兜底（`400` 仅历史兜底）。
- 转写与快判后端都增加高置信防串表校验：判断数据拒绝写入转写表，转写数据拒绝写入判断表，并通过 `rejectedItems` 返回原因。
- 新增 `platform-resources/alibaba-labelx/backend/legacy-csv-repair.js`，可将误入转写表的判断数据迁移到判断表并修复供应商，支持 `--dry-run`、`--write`、`--backup`。
- 运行 CSV 修复仅本地/服务器执行，不提交 `statistics-data/`；本轮未提升版本，未生成发布产物。

## 2026-05-18（平台 API 清单与有效时长字段统一）

- `platform-resources/README.md` 新增"统一后端 API 清单"，按模块列出 method、path、本地/服务器 URL、下载 URL 和运行数据目录。
- LabelX 快判、LabelX 转写 CSV 表头从 `有效时长(秒)` 统一为 `有效时长`，并兼容旧表头读取。
- DataBaker 导出表头从 `有效合格时长` 统一为 `有效时长`，数据来源仍为 `effectivePassTotalTime`。
- 本地运行 CSV 可做一次性表头迁移，但 `statistics-data/`、`export-data/`、`audit-data/` 不提交 Git。
- 本轮未改业务计算逻辑、未提升版本、未生成发布产物。

## 2026-05-18（CSV：统一有效时长字段）

- LabelX 快判与转写 CSV 表头从 `有效时长(秒)` 统一为 `有效时长`。
- LabelX 后端读取历史 CSV 时兼容旧表头：`有效时长(秒)` 会归一为 `有效时长`。
- DataBaker 一检导出表头从 `有效合格时长` 统一为 `有效时长`，数据来源仍为 `effectivePassTotalTime`。
- 本地运行 CSV 可做一次首行表头迁移；`statistics-data/` 与 `export-data/` 属于运行数据目录，不提交 Git。
- 本轮未修改业务计算逻辑、未提升版本、未生成发布产物。

## 2026-05-18（DataBaker：AI 输出简体化后处理）

- 在 prompt 规则之外新增后端结果归一化：`heardText` 与 `recommendedText` 的普通繁体字会转为简体。
- 新增后处理工具，先保护 `minnan-lexicon.csv` 与 `BASE_ENTRIES` 命中的建议用字，再做普通简繁转换，最后恢复词表建议用字。
- `pageText` 页面原始候选文本保持不变，仅作为比较来源，不参与后处理改写。
- 本轮未改模型配置、未新增接口、未提升版本、未生成发布产物。

## 2026-05-18（Abaka AI：修正百炼视觉模型名称）

- 根据阿里云视觉理解文档（`help.aliyun.com/zh/model-studio/vision`）与用户截图修正 Task21 AI 模型配置。
- 默认模型统一改为 `qwen3.6-plus`：
  - 视觉阶段：`qwen3.6-plus`
  - 推理阶段：`qwen3.6-plus`
  - 单模型：`qwen3.6-plus`
- 保留候选：`qwen3.6-flash`、`qwen3-vl-plus`、`qwen3-vl-flash`、`qwen3.5-plus`、`qwen3.5-flash`、`qwen-vl-max`、`qwen-vl-plus`。
- 移除旧名默认使用：`qwen-vl-max-latest`、`qwen-vl-ocr-latest`、`qvq-plus-latest`。
- OCR 专用模型默认关闭（`aiOcrEnabled=false`，`aiOcrModel` 为空），待文字提取文档进一步确认后再启用。
- 保留 `two_stage` 默认方案与 `single_model` 可选方案；AI 仍仅输出建议，不自动写入/保存/提交。
- 本轮未保存 API Key、未提升版本、未生成发布产物。

## 2026-05-17（README：补充服务器重启配置）

- 根目录 `README.md` 补充"服务器部署与重启"章节（部署目录、PM2 进程名、代码更新重启、环境变量重启、状态/日志查看）。
- 明确统一后端环境变量加载顺序与系统环境变量优先级。
- 增加安全边界提示：不提交真实 env、API Key、cookie/token/authorization、JWT secret、CRX 私钥。
- 本轮仅文档修改，未修改运行时代码、未提升版本、未生成发布产物。

## 2026-05-17（DataBaker：AI 推荐文本简体化规则）

- 标贝易采一检质检 AI 听音与比较 prompt 新增"普通中文繁体转简体"规则（`heardText`、`recommendedText`）。
- 闽南方言词表 `platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv` 的建议用字明确排除在普通简繁转换之外，命中词表时保持建议用字。
- 词表建议用字优先级高于普通简繁转换，避免把方言建议字形改回普通话同义词。
- 本轮仅调整 prompt 与文档，不修改模型配置、不新增后端接口、不生成发布产物。

## 2026-05-18（Abaka AI：模型名与百炼文档对齐修正）

- `docs/external-docs/aliyun-bailian.md` 新增并固定 4 个视觉/OCR官方入口：
  - 视觉理解 `url=3026912`
  - 图像与视频理解 `url=2845871`
  - 文字提取 `url=2860683`
  - 视觉推理 `url=2877996`
- Abaka Task21 AI 调试配置对齐官方模型口径并补 OCR 可选阶段：
  - 默认 `two_stage`
  - 默认视觉模型：`qwen3-vl-plus`
  - 默认 OCR：`aiOcrEnabled=false`，`aiOcrModel=qwen-vl-ocr-latest`
  - 默认推理模型：`qvq-plus-latest`
  - 默认单模型：`qwen3-vl-plus`
- Options「Abaka AI Task21 快捷键与 AI 分析」新增 OCR 开关与 OCR 模型选择，并保持 thinking 默认关闭。
- 前后端 analyze 请求新增 `ocrEnabled/ocrModel`，并返回阶段化调试信息（`stages.vision/ocr/reasoning/single`）。
- 后端调用策略修正：
  - 按模型能力区分 thinking 参数是否适用；
  - thinking 支持模型显式传 `enable_thinking=true/false`；
  - OCR 模型按能力不传 thinking，调试信息标记 `notApplicable`；
  - 响应包含 `callMode`、阶段 thinking 状态与 usage。
- AI 仍仅输出建议，不自动写入/保存/提交；本轮未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-18（Abaka AI：Task21 双模型 AI Pipeline 增强）

- Abaka AI Task21 AI 分析新增双方案：
  - `two_stage`（默认）：视觉模型提取事实 + 推理模型规则判断。
  - `single_model`（保留）：单模型直接输出最终建议。
- Options「Abaka AI Task21 快捷键与 AI 分析」的 AI 调试板块新增：
  - 分析方案选择（`two_stage/single_model`）
  - 视觉模型、推理模型、单模型选择
  - 思考开关（默认关闭）与请求超时（默认 120000ms）
- 配置迁移与兼容：
  - 新增 `aiAnalysisMode/aiVisionModel/aiReasoningModel/aiSingleModel`
  - 旧 `aiDebugModel` 自动迁移为 `aiSingleModel` fallback，不覆盖用户已有新字段。
- 前端 `ai-client` 请求显式携带：
  - `analysisMode/visionModel/reasoningModel/singleModel/enableThinking/timeoutMs`
- 后端 Task21 AI 路由与客户端改为支持双阶段执行，并返回分阶段调试信息：
  - `stages.vision/reasoning/single` 的模型、耗时、usage
  - `analysisMode`、`thinking`、`usage.total`
- thinking 安全策略：
  - 默认显式发送 `enable_thinking=false`
  - 用户开启才传 `true`
  - 默认不静默移除参数；仅当 `ABAKA_TASK21_AI_ALLOW_THINKING_PARAM_FALLBACK=true` 时才允许 fallback。
- 同步更新 Abaka Task21 AI Prompt/README、后端 README、统一后端 README 与 `config/env/ai.env.example`。
- 本轮未保存 API Key、未自动写入/保存/提交、未提升版本、未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-18（Abaka AI：Task21 AI 调试配置增强）

- Abaka AI Task21 Options 详情页新增"AI 调试"子板块：模型选择、思考开关、请求超时与 mock 提示。
- 新增默认配置并兼容旧配置补齐：
  - `aiDebugModel=qwen-vl-max-latest`
  - `aiEnableThinking=false`
  - `aiRequestTimeoutMs=120000`
- 前端 `ai-client` 请求 `/api/abaka-ai/task21/ai/analyze` 时，显式携带 `model`、`enableThinking`、`timeoutMs`（包含 `enableThinking=false`）。
- 后端新增运行时参数解析与白名单控制：
  - `model` 仅在允许覆盖且命中白名单时生效；
  - `timeoutMs` 限制 `1000~300000`；
  - 默认显式传 `enable_thinking=false`，仅在用户启用时传 `true`。
- `defaults/health/analyze` 返回补充 thinking 调试信息（参数名、参数位置、请求来源）。
- 同步更新 Abaka Task21 AI 文档、后端说明和 `ai.env.example`。
- 本轮未保存 API Key，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-17（Options：首页脚本下载中心入口）

- 将 Options 首页右上角"脚本中心"入口改为"脚本下载中心"。
- 点击后打开 `https://script.xiangtianzhen.store/downloads/`。
- 本轮未修改运行时代码、未提升版本、未生成发布产物。

## 2026-05-18（Abaka AI：Task21 内联 AI 分析 UI 重构）

- Abaka AI Task21 AI UI 从右下角全局固定面板改为字段内联形态：
  - `same_font` 标题右侧挂载 `AI分析`、`整体分析`
  - `image_b_texts_removed` 标题右侧挂载 `AI分析`
  - `other_changes` 标题右侧挂载 `AI分析`
- 结果展示改为字段锚点悬浮窗（可关闭、可展开"原始 JSON（脱敏）"），不再使用全局右下角按钮网格。
- 新增 AI 分析快捷键（默认）：
  - `Alt+1` same_font
  - `Alt+2` image_b_texts_removed
  - `Alt+3` other_changes
  - `Alt+4` overall
- 数据采集策略调整为：
  - 优先 `POST /api/v2/item/get-item-info`（同源会话、`credentials: include`）
  - 回退 `.content-title span` + `.content-image-view img` DOM 采集
  - 图片字段固定 `image_a/image_b/image_b_removed`，调试输出仅保留 `mime/width/height/bytes/sourceKind`。
- 补充 Task21 专项网络文档：
  - `platform-resources/abaka-ai/task21/network/05-items-view-init.md`
  - `platform-resources/abaka-ai/task21/network/06-items-label-init.md`
- 本轮继续保持安全边界：
  - 不硬编码或持久化 token/cookie/authorization/access-token/trace-id
  - 不展示完整图片 URL、完整 dataUrl/base64
  - 不自动写入、不自动保存、不自动提交、不自动送审。
- 未提升 `extension/manifest.json` 版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-17（Abaka AI：Task21 AI 辅助分析调试版）

- 新增 Abaka AI Task21 AI 面板（调试版），前端新增：
  - `pricing.js`（单条价格估算）
  - `data-collector.js`（页面图片/文本/当前字段值采集）
  - `ai-client.js`（统一后端请求）
  - `ai-panel.js`（四按钮分析面板与调试输出）
- AI 面板按钮：
  - 分析 `same_font`
  - 分析 `image_b_texts_removed`
  - 分析 `other_changes`
  - 整体分析（按 Task21 流程）
- 调试输出补充：`requestId`、模型名、耗时、token usage、图片数量与字段、图片统计、价格估算、脱敏原始 JSON。
- 新增后端模块：`platform-resources/abaka-ai/task21/backend/`，注册接口：
  - `GET /api/abaka-ai/task21/ai/health`
  - `GET /api/abaka-ai/task21/ai/defaults`
  - `POST /api/abaka-ai/task21/ai/analyze`
- 新增 Prompt 与规则沉淀：`platform-resources/abaka-ai/task21/ai/README.md`、`platform-resources/abaka-ai/task21/ai/prompt.md`。
- 价格规则已按"雨滴Task21单价.xlsx"固化到代码与文档，不依赖运行时上传文件。
- 安全边界保持：
  - AI 仅建议，不自动写入、不自动保存、不自动提交、不自动送审。
  - 不记录完整图片 URL / dataUrl / token / cookie / authorization 等敏感信息。
- 未修改后端以外业务平台逻辑，未提升 `manifest.version`，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-17（Abaka AI：修复 Task21 specify 联动重复点击取消）

- 修复 Abaka AI Task21 快捷键联动重复点击导致 `specify` 被取消的问题。
- `same_font=true` 与 `same_font=same underlying font+artistic effect` 都会确保两个派生字段为 `specify`。
- `image_b_texts_removed=specify` 与 `other_changes=specify` 改为幂等选择：已选中时不重复点击，不会被取消。
- `4/5` 快捷键同样改为幂等 ensure 行为，重复触发不会取消已选中状态。
- 未修改提交/领取/放弃/跳过/送审逻辑，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：Task21 same_font 快捷键辅助第一版）

- 新增 Abaka AI Task21 ISOLATED content runtime：`content.js`、`shortcuts.js`、`dom-actions.js`、`toast.js`，并保留 MAIN world `network-structure-observer.js`。
- `extension/manifest.json` 新增 Abaka AI ISOLATED content script 注入（`shared/constants.js`、`shared/storage.js` + Task21 runtime 脚本）。
- 新增 Task21 快捷键动作与默认键位：
  - `1`：`same_font=true`
  - `2`：`same_font=false`
  - `3`：`same_font=same underlying font+artistic effect`
  - `4`：`image_b_texts_removed=specify`
  - `5`：`other_changes=specify`
- `same_font=true` 联动默认开启：自动选择 `image_b_texts_removed=specify` 与 `other_changes=specify`（可在 options 关闭）。
- options 新增 Abaka AI Task21 快捷键配置区：联动开关、快捷键录制/清除、恢复默认、保存。
- 快捷键只在 `/items` 且存在 `same_font` 字段时生效；焦点在输入框/textarea/editor 时忽略。
- 所有动作仅触发页面真实 DOM 点击，不直接调用保存、提交、领取、放弃、跳过、送审接口；平台是否自动保存由页面自身机制决定。
- 同步更新 Abaka AI 相关 README、平台索引和动作边界文档。
- 未提升 `extension/manifest.json` 版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：按 LabelX 快判风格收口 Task 页面网络目录）

- 将 `platform-resources/abaka-ai/network/common/` 中的状态 Tab、Skipped / Dropped、恢复、送审成功和内审只读文档合并进 `platform-resources/abaka-ai/network/task-page/`。
- `network/task-page/` 调整为类似 LabelX 快判 `network/` 的单层编号文档目录，新增完整索引、来源页面、操作步骤、初始化序列、状态变更链路和脱敏规则。
- 更新 Abaka AI 根目录、动作边界和平台资源索引中的旧 `common/` 路径。
- 未重新采集，未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：重排公共资料与任务项目目录）

- 按 LabelX 资料组织方式重排 Abaka AI 平台文档：根目录维护公共 Task 页面结构、动作边界、多语言和公共 Network。
- 将 Task 页面公共请求上移到 `platform-resources/abaka-ai/network/`，区分 `task-page/` 公共请求与 `common/` 公共状态流转。
- 新增 `platform-resources/abaka-ai/task21/`，仅保留 Task21 same_font、派生字段和专项保存结构。
- 新增 `platform-resources/abaka-ai/task17/`，记录 Task17 公共结构对比和领取审核空池失败响应。
- 更新平台索引、扩展 README 和平台资源总览中的 Abaka AI 路径。
- 未重新采集，未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补采剩余动作网络缺口）

- 使用 DevTools MCP 在标注权限下补采 `Label / 标注` 区域、`other_changes` textarea 暂存、语言切换和跨页选择请求结构。
- 确认 `Label / 标注` 是角色区域而非状态 Tab 专属 endpoint；`other_changes` 自由文本暂存复用 `/api/v2/label/save-labels`。
- 确认语言切换未观察到独立偏好保存接口；切回中文时仅捕获常规 `/api/message/list`。
- 仅观察跨页全选的选择态、列表刷新和帧数统计请求，未执行批量送审、批量恢复、批量领取等危险动作。
- 在 Task17 内审页补测 `领取审核` 空池失败响应，返回"无条目可领"；出现验证组件后未继续操作。
- 未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补充领取与中文动作文案）

- 使用 DevTools MCP 二次测试 Task21 `Claim Label` / `Claim Review`，均仍成功领取 1 条测试数据，未触发空池响应。
- 切换到简体中文环境，补齐 Data 页 `查看`、`领取标注`、`领取审核`、状态 Tab 和标注页 `暂存`、`放弃`、`跳过`、`送审` 等动作文案。
- 补充 Dropped 恢复后的目标状态：恢复后进入 Todo / 待办项。
- 按用户要求不记录统计分析、工作流、成员配置三页。
- 未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补采 Skipped / Dropped 恢复与标注送审链路）

- 使用 DevTools MCP 补采 Task 页面公共状态 Tab、Skipped / Dropped 列表和恢复链路。
- 标注权限下单条测试送审成功链路，确认 `save-labels -> submit-item` 和 Data 页 `Labeled / Pending Review` 状态变化。
- 标注内审权限下只观察列表、状态 Tab 和 `View` 查看页初始化，未提交、未通过、未驳回、未触发审核完成类动作。
- 新增 `platform-resources/abaka-ai/task-page/network/common/` 网络文档目录，区分公共 Task 页面能力与 Task21 `same_font` 专属能力。
- 未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补齐 Task21 动作网络请求）

- 按 LabelX 快判 `network/` 目录风格拆分 Abaka AI Task21 网络请求，新增编号文档和待补/接续说明。
- 使用 DevTools MCP 测试并补采领取标注、领取审核、单选/多选条目、same_font 暂存保存、放弃、跳过、送审前端校验和资源加载链路。
- 每个动作独立文档记录 request/response 结构摘要、后续链路、页面反馈和风险边界。
- 未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：按 LabelX 风格重构平台资料）

- 拆分 Abaka AI README 中的页面结构、Network、动作风险、多语言内容，README 收口为资料入口和当前状态。
- 新增/更新 `platform-resources/abaka-ai/README.md`、`platform-resources/abaka-ai/network.md`、`platform-resources/abaka-ai/task-page/network.md`、`platform-resources/abaka-ai/task-page/page-structure.md`、`platform-resources/abaka-ai/task-page/actions.md`、`platform-resources/abaka-ai/task-page/i18n.md`。
- `extension/sites/abaka-ai/task-page/README.md` 收口为运行时入口、注入范围和 Console 采集方法。
- 未重新采集，未提交原始 HAR/JSON/截图/CSV/完整响应或敏感数据。
- 未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：深化 Task21 页面与 Network 结构采集）

- 使用 Google Chrome DevTools MCP 深度采集 Abaka AI Task21 页面结构和 Network 结构。
- 覆盖 Task21 全部数据页、批次页、标注/内审角色切换、单条选择、查看页、标注页、same_font 主标注区、右侧条目列表、语言切换与 Task17 对比页。
- 记录 same_font 单选、派生字段、资源区、图片查看器、锁定/暂停状态、暂存/放弃/跳过/送审等按钮结构；在测试账号单条范围内触发 same_font 选择、自动保存和放弃接口。
- 补充 `/items` 工作页接口族：条目历史、查看权限、操作权限、工作状态、标注数据、问题数据、标注记录、AI 检查、无效帧、抽帧数据、右侧条目列表、自动保存和放弃接口。
- 补充中文与 English 文案映射，明确后续定位应优先使用 route/query keys、表头结构、role/aria/data-col-key 和双语文案兜底，不能只依赖中文文本。
- Task17 仅作为公共结构对比，记录列表、`/items` 查看页、公共接口模式与 Task21 差异；未对 Task17 做领取、送审、放弃、跳过等状态变更。
- 文档仅记录脱敏结构；未提交真实 JSON/HAR/截图/CSV/原始接口响应，未记录 cookie、token、authorization、密码、签名或完整资源 URL。
- 本轮未实现自动化功能，未修改运行时代码，未提升版本，未生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：补充 Task21 页面与 Network 结构文档）

- 使用 Google Chrome DevTools MCP 采集并整理 Abaka AI Task21 页面结构。
- 补充任务列表页 `/data-task/v2`、Task21 详情页 `/task-v2/data-item?taskId={taskId}`、批次视图 `/task-v2/data-item?taskId={taskId}&vm=batch&batchId={batchId}` 的 DOM 区域、表格字段、筛选控件和选择器候选。
- 补充登录后用户/权限、任务列表、Task21 详情、Workflow、批次列表、筛选列表、Todo 条目列表等 Network 结构摘要。
- 明确 `Claim Label`、保存、提交、领取、流转、跳过、跨页选择等危险操作边界；本轮未主动触发。
- 未提交真实采集 JSON/HAR/截图/CSV/原始接口响应，未记录 cookie、token、authorization、密码或完整资源 URL。
- 本轮仅更新 Abaka AI 文档和平台索引，不实现自动化功能，不修改运行时代码，不提升 `extension/manifest.json` 版本，不生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-16（Abaka AI：新增 Task 页面结构只读采集壳）

- 新增 Abaka AI 平台与脚本登记：
  - 平台：`abakaAi`（host: `abao.fortidyndns.com`）
  - 脚本：`abakaAiTaskPageCapture`
  - 状态：只读采集阶段（仅 DOM/Network 结构采集，不做自动领取/保存/提交/流转）。
- `extension/manifest.json` 新增：
  - `host_permissions`: `http://abao.fortidyndns.com:30473/*`
  - MAIN world content script：`sites/abaka-ai/task-page/page-world/network-structure-observer.js`
- 新增 MAIN world 观察器：
  - 同时被动 hook `fetch` 与 `XMLHttpRequest`
  - 仅记录脱敏结构，不记录敏感原始值
  - Console 导出入口：`window.__ASCAbakaAiCapture.snapshot()` / `download()`。
- 文档同步：
  - 新增 `extension/sites/abaka-ai/task-page/README.md`
  - 新增 `platform-resources/abaka-ai/task-page/README.md`
  - 更新 `docs/platforms/index.md`、`README.md`、`extension/README.md`、`platform-resources/README.md`。
- 本轮不提升 `extension/manifest.json` 版本号，不发布，不生成 CRX/ZIP/update.xml/crx-latest.json。

## 2026-05-15（0.3.2 热修：快判 AI 规则按 0422 规范重写并补充错例 few-shot）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本 AI 规则修复。
- 快判比较规则版本升级为 `asr-judgement-rules-20260422`（后端 `RULE_VERSION` 同步更新）。
- 快判 AI 比较规则重写为 P0/P1/P2 决策树：
  - 先分层判定两条候选；
  - 一条 P0/P1、另一条仅 P2 或无错时必须选更优条；
  - 两条都存在影响理解的 P0/P1 才允许 `both_bad`；
  - `uncertain_or_similar` 仅用于两条都合格且无明显优劣。
- 强化规则优先级：实意词、专有名词、动作词、否定词高于标点和格式；`heardText` 仅作辅助，不替代候选比较。
- 在 compare 规则模板中补充 6 个错例 few-shot：
  1) 共同核心漏字 -> `both_bad`
  2) 重复次数接近度 -> 选更接近者
  3) 两条动作实词都错 -> `both_bad`
  4) 实意词优先于格式 -> 选核心词正确者
  5) 领域词误切语气词 -> 选真实领域词
  6) 核心语义相反 -> 选语义正确者

## 2026-05-15（发布脚本增强：新增每版本 ZIP 产物）

- `scripts/package-crx-release.js` 新增每版本 ZIP 生成：`dist/annotation-script-center-v<version>.zip`。
- ZIP 默认打包 `extension/` 目录内容，并增加校验：文件存在、非空、包含 `manifest.json`。
- ZIP 内容保护校验：禁止命中 `config/`、`platform-resources/`、`docs/`、`dist/`、`.git/`、`node_modules/`、`config/secrets/`、`.env*`、运行数据目录等路径。
- 发布脚本输出日志调整为两组：
  - 当前手工分发文件：`CRX + ZIP`
  - 企业自动更新预留文件：`update.xml + crx-latest.json`
- `crx-latest.json` 增加 ZIP 元数据字段：
  - `zip_filename`
  - `zip_download_url`
  - `zip_sha256`
  - `zip_size_bytes`
- 文档同步：
  - `README.md`
  - `extension/README.md`
  - `docs/unfinished/crx-enterprise-managed-install.md`
  - `AGENTS.md`
- 本轮不修改运行时代码，不提升 `manifest.version`。

## 2026-05-15（0.3.2 文档整理：AGENTS 瘦身与平台索引）

- 新增 `docs/platforms/index.md`，集中维护平台与脚本文档入口，不在 AGENTS 堆平台细节。
- 更新 `docs/README.md`：新增 `docs/platforms/` 分类与关键入口。
- `AGENTS.md` 精简为项目级规则（工作流、暗号、目录边界、安全、验证、发布、文档规则），删除具体平台长口径，改为"先看平台索引再看对应 README/资料"。
- 更新 `README.md` 与 `extension/README.md` 文档入口，加入 `docs/platforms/index.md`。
- 本轮仅文档整理，不修改运行时代码，不变更 `manifest.version`。

## 2026-05-15（0.3.2 文档整理：指令与 docs 分层归档）

- docs 目录完成分层重构：`architecture/`、`workflow/`、`external-docs/`、`rules/`、`archive/`、`unfinished/`，docs 根层仅保留导航 `docs/README.md`。
- 新增 `docs/workflow/codex-prompt-style.md`，固定 Codex Prompt 输出格式（外层单一 text 代码块、禁止内部嵌套三反引号）。
- 新增 `docs/external-docs/aliyun-bailian.md`，集中沉淀阿里云百炼官方文档入口与查阅规则。
- 根 `README.md` 瘦身为项目概览 + 运行入口 + 文档导航，历史细节统一收口到 `log.md` 与 `docs/archive/`。
- 更新 `AGENTS.md`：补充 Prompt 输出摘要、百炼文档查阅规则、docs 分类规则与 shared 通用模块定位。
- 更新 `extension/README.md`、`platform-resources/backend/README.md` 的文档入口与百炼核对口径。
- 新增快判人工规范整理版：`platform-resources/alibaba-labelx/asr-judgement/ai/asr-judgement-official-rules.md`（P0/P1/P2、优先级、both_bad/uncertain 限制、错例摘要）。
- 本轮仅文档整理，不修改运行时代码，`manifest.version` 保持不变。

## 2026-05-15（0.3.2 热修：补齐转写提交快捷键设置项）

- 修复转写 options 快捷键列表缺项：补齐 `shortcutSubmitTask`（提交任务）与 `shortcutSubmitTaskAndFinish`（提交任务并结束）显示与保存。
- 补齐转写本地归一化默认字段：`shortcutSubmitTask: null`、`shortcutSubmitTaskAndFinish: null`，默认不占用键位。
- 转写运行时仍复用 `extension/sites/alibaba-labelx/shared/submit-actions.js` 执行提交动作；不新增工具栏按钮，不自动确认二次弹窗。
- `manifest.version` 保持 `0.3.2`。

## 2026-05-15（0.3.2 热修：提交快捷键抽为 LabelX 快判/转写通用能力）

- 新增通用模块 `extension/sites/alibaba-labelx/shared/submit-actions.js`，统一封装"提交任务 / 提交任务并结束"DOM 查找与点击逻辑（仅点击页面系统按钮，不直接请求平台 API，不自动确认二次弹窗）。
- 快判 `judgement-actions.js` 删除本地重复提交按钮查找代码，改为薄封装调用 shared submit-actions。
- 转写接入提交快捷键动作：`shortcutSubmitTask`、`shortcutSubmitTaskAndFinish`，并在 `shortcut-bus.js` / `content.js` 支持触发 shared submit-actions。
- 快判与转写提交类快捷键配置独立保存，默认均未绑定；顶部工具栏两边均未新增提交按钮。
- `manifest.version` 保持 `0.3.2`。

## 2026-05-15（0.3.2 热修：清理快判 AI 顶部按钮并新增提交快捷键）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本小修。
- 快判顶部工具栏 AI 分组收口：仅保留 `AI 分析当前题` 与 `复制两条 ASR 文本`，移除顶部 `AI 采用/AI 重试/AI 忽略` 三个重复按钮。
- AI 面板内"采用建议 / 重新分析 / 忽略"按钮和对应快捷键能力保持不变。
- 快判新增两个快捷键动作（默认未绑定）：
  - `submitTask`（提交任务）
  - `submitTaskAndFinish`（提交任务并结束）
- 提交类快捷键实现方式为点击页面真实系统按钮（`button/.ant-btn/[role=button]`），不直接调用平台接口；若出现二次确认弹窗需人工确认。
- 找不到目标按钮时返回清晰失败提示：`未找到"提交任务"按钮` 或 `未找到"提交任务并结束"按钮`。

## 2026-05-15（0.3.2：修复 LabelX 默认倍速与切题自动播放，新增通用音频核心）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本功能修复与模块整理。
- 新增通用模块：`extension/sites/alibaba-labelx/shared/audio-controller-core.js`，统一承载 LabelX 快判/转写的音频基础能力：
  - 默认倍速与默认音量应用
  - 倍速步进与前进/后退步长
  - 自动播放当前题
  - 切题时停旧播新
  - 单音频互斥播放
- 快判与转写 `audio-controller.js` 改为薄封装，继续保留原有 `globalThis` 接口名，`content.js` 侧改动最小。
- 修复"默认倍速只显示不生效"：音频应用默认值时同时写入 `playbackRate/defaultPlaybackRate`，并加入短延迟校验回写，避免平台组件把倍速回滚到 `1x`。
- 修复"切题旧音频继续播放"：选中题卡变化时立即暂停旧音频，再对新题音频应用默认值并自动播放（开启自动播放时）。
- 默认值调整：
  - 快判默认倍速改为 `2x`。
  - 转写默认倍速改为 `1.5x`，并统一默认步进为 `0.25`、前进/后退步长为 `0.5`。
- 文档同步补充：shared 音频模块归属、快判/转写默认倍速与切题播放规则、`400` 条 pageSize 为快判专属边界。

## 2026-05-15（0.3.2 热修：修复快判 AI Web Search 变量未定义）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本 hotfix。
- 修复 `platform-resources/alibaba-labelx/asr-judgement/backend/ai-client-qwen.js` 中 `requestCompare` 的 `webSearchEnabled` 变量未定义问题，避免 compare 阶段抛出 `webSearchEnabled is not defined`。
- `requestCompare` 增加 Web Search 开关解析兜底链路：`options.webSearchEnabled -> options.aiOptions.webSearchEnabled -> input.aiOptions.webSearchEnabled -> 后端默认配置`。
- `sanitizeAiOptions` 补充 `webSearchEnabled` 兼容读取（仅用于是否启用联网搜索控制，不直接透传为模型参数字段）。
- 维持原有边界：listen 阶段仍不启用 Web Search；compare 阶段按配置启用，不支持时仅移除联网参数重试一次。

## 2026-05-14（0.3.2：增强快判 AI 搜索辅助与快捷键）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本功能增强。
- 快判 AI 建议新增 4 个动作并接入快捷键系统（按钮与快捷键复用同一动作逻辑）：
  - `applyAiSuggestion`：AI 采用建议
  - `retryAiSuggestion`：AI 重新分析
  - `ignoreAiSuggestion`：AI 忽略建议
  - `copyAsrTextPair`：复制两条 ASR 文本
- 新增"复制两条 ASR 文本"统一格式：
  - `asr_text1:<第一条文本>;`
  - `asr_text2:<第二条文本>`
- 快判 AI 权重规则调整为：`asrText1/asrText2` 为主判断对象，`heardText`、`contextText`、Web Search 仅作消歧辅助。
- 快判 compare 阶段接入 Web Search 开关：
  - 前端新增 `aiSuggestionWebSearchEnabled`（默认开启）。
  - 后端仅在 compare 阶段启用 Web Search，不在 listen 阶段启用。
  - 若上游返回搜索参数不支持，后端移除搜索参数重试一次并返回 fallback 状态。
- 快判响应新增 `webSearch` 状态对象（`enabled/used/fallbackUsed/fallbackReason`），并支持 `evidence.webSearchHint`。
- 文档同步：`AGENTS.md`、`extension/sites/alibaba-labelx/asr-judgement/README.md`、`platform-resources/backend/README.md`、`config/env/ai.env.example`。

## 2026-05-13（0.3.2：统一 ASR AI thinking 显式传参语义）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于 AI 参数语义热修。
- 统一四个 ASR AI 后端客户端的 thinking 行为：
  - 关闭时显式传 `enable_thinking=false`。
  - 开启时显式传 `enable_thinking=true`。
  - 若上游返回参数不支持/参数无效，仅移除该参数重试一次（`thinkingFallbackMode=remove`），不做无限重试。
- 修复快判链路：`asr-judgement` 关闭 thinking 时此前可能省略参数，现改为显式发送 `false`。
- 修复标贝易采链路：开启 thinking 时此前可能省略参数，现改为显式发送 `true`；并统一返回 `enableThinking/thinkingFallbackUsed/thinkingFallbackMode`。
- 补齐 defaults 口径：标贝易采 defaults 的 `enableThinking` 现在跟随后端环境默认值，不再固定 `false`。
- 文档同步：
  - `extension/README.md`
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `extension/sites/alibaba-labelx/asr-transcription/README.md`
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `extension/sites/magic-data/annotator/README.md`
  - `platform-resources/backend/README.md`
  - `AGENTS.md`

## 2026-05-13（0.3.2：完善 ASR 语音 AI 设置 defaults/override 口径）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本设置部件完善与后端 defaults 对齐。
- 通用"ASR 语音 AI 设置"部件更新：
  - 删除面板内"安全边界"展示区（仅移除 UI，安全规则仍保留在代码与文档）。
  - 删除前端 `response_format` 配置入口；结构化输出由后端固定控制。
  - 解锁后按脚本请求后端 `defaults` 接口，面板默认显示后端当前模型、Prompt 与生成参数。
  - Prompt/参数改为 override 语义：与默认一致或清空时不保存 override，请求时由后端默认生效。
- 后端新增/补齐 defaults 接口并返回 `defaults + supportedParams`：
  - `/api/alibaba-labelx/asr-judgement/ai/defaults`
  - `/api/alibaba-labelx/asr-transcription/ai/defaults`
  - `/api/data-baker/round-one-quality/ai/recommend/defaults`
  - `/api/magic-data/annotator/ai/defaults`
- 四个 ASR 类脚本统一接入完整设置部件样式（快判、转写、标贝易采、Magic Data），保持脚本级配置互不串用。
- Magic Data 快捷键设置继续常显，不受 AI 隐藏面板影响。

## 2026-05-13（0.3.2：重构通用 ASR 语音 AI 隐藏设置部件）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本 options 结构重构与文档同步。
- options 新增通用隐藏部件：`ASR 语音 AI 设置`。
  - 统一挂载在脚本详情页标题区下方、普通设置区之前。
  - 默认隐藏；在对应脚本详情页标题连续点击 10 次（3 秒窗口）后显示。
  - 解锁状态仅当前 options 页面会话有效，刷新后恢复隐藏。
- 已接入脚本：
  - 阿里 ASR 语音判别（judgement）
  - 阿里 ASR 语音转写（transcription）
  - 标贝易采一检质检（dataBakerRoundOneQuality）
  - Magic Data ANNOTATOR（magicDataAnnotatorAiReview）
- 展示收口：
  - 快判、标贝易采、Magic Data 的 AI 模型/开关/超时等不再散落在普通设置区，统一迁入隐藏 AI 设置部件。
  - 快判普通区仅保留"AI 半自动参考建议为默认能力、仅手动触发"的说明。
  - Magic Data 快捷键设置改为常显，不再默认折叠，也不受 AI 隐藏机制影响。
- 配置隔离：
  - 通用 UI 部件复用，但按脚本独立读取/保存原有存储路径，不做全局 AI 配置复用。
  - 快判继续强制 `aiSuggestionEnabled=true`；标贝易采/Magic Data 仍可在隐藏 AI 设置中调整其 AI 开关。
- 文档同步：
  - `extension/README.md`
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `extension/sites/alibaba-labelx/asr-transcription/README.md`
  - `extension/sites/data-baker/round-one-quality/README.md`
  - `extension/sites/magic-data/annotator/README.md`
  - `AGENTS.md`

## 2026-05-13（0.3.2：整理快判脚本级 AI 高级设置并强制启用半自动建议）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本配置收口增强。
- 快判 AI 半自动建议改为默认强制能力：
  - options 快判详情页移除"启用 AI 建议"开关，仅保留"手动触发、手动采用"的说明。
  - `shared/storage.js` normalize 阶段强制 `aiSuggestionEnabled=true`（兼容旧存储的 `false` 值）。
  - 快判运行时不再因为 `aiSuggestionEnabled=false` 拒绝请求。
- 快判详情页新增隐藏入口：
  - 在"阿里ASR语音判别"标题连续点击 10 次（3 秒窗口）后显示 `AI 高级设置（阿里ASR语音判别）`。
  - 解锁状态只在当前 options 页面会话有效，刷新后恢复隐藏。
- 新增快判脚本级 AI 高级字段（独立保存在快判 `asrConfig`）：
  - `aiSuggestionListenPrompt` / `aiSuggestionComparePrompt`
  - `aiSuggestionTemperature` / `aiSuggestionTopP`
  - `aiSuggestionMaxTokens` / `aiSuggestionMaxCompletionTokens`
  - `aiSuggestionPresencePenalty` / `aiSuggestionFrequencyPenalty`
  - `aiSuggestionSeed` / `aiSuggestionResponseFormat` / `aiSuggestionStopSequences`
  - `aiSuggestionEnableThinking`（保留）
- 前后端参数白名单同步：
  - 前端按 `JUDGEMENT_AI_ADVANCED_PARAM_DEFINITIONS` 决定显示与提交；不支持参数不显示。
  - 后端 `ai-routes.js` + `ai-client-qwen.js` 双层过滤，仅允许白名单字段进入模型请求体；不支持字段忽略，不透传。
  - `response_format=text` 时不发送 `json_object`；`stop` 最多 8 条、每条最多 80 字；数值参数按范围归一化。
- 快判请求体新增脚本级 `aiOptions`，并继续保留 `listenModel/compareModel/includeContext` 等主字段，确保兼容当前链路。
- `ai-prompt.js` 支持 `listenPrompt/comparePrompt` 覆盖，但后端会追加安全边界（只输出 JSON、固定 answer 枚举、禁止敏感信息）。
- 文档同步：
  - `extension/sites/alibaba-labelx/asr-judgement/README.md`
  - `platform-resources/backend/README.md`
  - `AGENTS.md`

## 2026-05-13（0.3.2 热修：收口快判 AI 答案枚举与格式差异判定）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本小修。
- 快判后端响应 schema 收口：
  - `answer` 仍只允许 `first_better/second_better/both_bad/uncertain_or_similar/other_dialect_or_language`。
  - `answerText` 改为后端固定映射五选一，不再允许模型返回文案覆盖：
    - `first_better -> 第一个更好`
    - `second_better -> 第二个更好`
    - `both_bad -> 都不好`
    - `uncertain_or_similar -> 不确定或差不多`
    - `other_dialect_or_language -> 其他方言或语种`
- 快判 compare 规则增强：当两条 ASR 主体语义一致但存在标点/空格/数字/日期格式差异时，若其中一条明显更规范，必须选择对应候选；不能把"仅标点不同"一律判为"不确定或差不多"。
- `compare-prompt-template.md` 新增格式优劣判定规则和"机票疑问句"示例，强调示例输出仅包含 `answer` 等结构化字段，不使用 `answerText`。
- `AGENTS.md` 与快判 README 同步稳定口径：建议答案五选一固定映射，解释性文字只放 `reasonSummary`。

## 2026-05-13（0.3.2：快判 AI 升级双模型听音+比较与上文开关）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮属于当前测试版本增强与质量修复。
- 快判 AI 后端从单模型升级为双阶段 pipeline：
  - 第一阶段 `listen`：听音模型（默认 `qwen3.5-omni-flash`）只输出听音结果与音频有效性。
  - 第二阶段 `compare`：比较模型（默认 `qwen3.5-plus`）结合 `heardText + asrText1/asrText2 + 可选上文` 输出"哪个更优"建议。
- 快判 Qwen 客户端新增双模型能力与配置：
  - `ASR_JUDGEMENT_AI_LISTEN_MODEL`
  - `ASR_JUDGEMENT_AI_COMPARE_MODEL`
  - `ASR_JUDGEMENT_AI_TIMEOUT_MS`
  - `ASR_JUDGEMENT_AI_ENABLE_THINKING`
  - `ASR_JUDGEMENT_AI_ALLOW_CLIENT_MODEL_OVERRIDE`
  - 保留 `ASR_JUDGEMENT_AI_MODEL` 作为 compare fallback 兼容字段。
- 快判后端日志补齐为分阶段脱敏日志：`suggest start`、`listen start/success`、`compare start/success`、`suggest success/suggest failed`。
- 快判前端 AI 卡片升级：
  - 点击后立即显示"正在分析当前题..."。
  - 成功显示听音文本、建议答案、置信度、风险等级、双模型、耗时、requestId。
  - 失败显示错误卡和重试按钮，不再静默。
  - 新增当前题"使用上文理解"开关（默认有上文时开启），开关仅运行态生效，切换后需"重新分析"生效。
- options 快判设置新增 AI 字段：
  - 听音模型（下拉 + 自定义）
  - 比较模型（下拉 + 自定义）
  - 启用思考开关
  - 请求超时（保留）
- 文档与规则同步：
  - `extension/sites/alibaba-labelx/asr-judgement/README.md` 更新为双模型口径和上文开关说明。
  - `platform-resources/backend/README.md`、`config/env/ai.env.example` 增补快判双模型环境变量。
  - `AGENTS.md` 沉淀"快判 AI 双模型 + 上文仅消歧 + 当前题运行态开关"规则。

## 2026-05-12（0.3.2 热修：快判 AI 真实链路无返回提示）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮为当前测试版本 hotfix。
- 修复快判 Qwen 音频输入格式：`platform-resources/alibaba-labelx/asr-judgement/backend/ai-client-qwen.js` 从 `audio_url` 切换为 `input_audio.data + input_audio.format`，`format` 按音频后缀推断（wav/mp3/aac/m4a/amr/3gp/3gpp，默认 wav）。
- 增强快判后端流式读取：新增 `readStreamCompletion`，统一返回 `text/usage/firstChunkAtMs/chunkCount`，并兼容 SSE `data:`、非 stream 响应、`delta.content` 与 `message.content` 的 string/array 形态。
- 修复 `enable_thinking` 兼容：先按配置发送 `enable_thinking`，若上游返回参数不支持/无效，自动移除该参数重试一次（非无限重试）。
- 补齐后端阶段日志（脱敏）：`suggest start`、`provider request start`、`provider response`、`provider stream complete`、`suggest success`、`suggest failed`。
- 补齐后端错误回传：统一返回 `code/message/requestId`，并按情况返回 `providerStatus/summary`，覆盖 `timeout/provider-http-error/empty-provider-response/invalid-model-json/invalid-model-schema/internal-error`。
- 前端 `judgement-ai-suggestion.js` 增加状态反馈：点击即渲染"正在分析当前题..."卡片；成功替换建议卡；失败或超时替换错误卡（重试/忽略），并 toast 显示失败原因。
- 前端增加同题防并发：当前题分析中重复触发会提示"当前题 AI 分析中，请稍候"，不并发发第二个请求。
- `content.js` 增加发起即提示：工具栏按钮或快捷键触发 AI 时立即提示"AI 分析已开始，请等待结果。"。
- 本轮明确真实验收要求：`GET /api/alibaba-labelx/asr-judgement/ai/health` 需确认 `mockEnabled=false`，不得以 mock 结果代替真实 Qwen 调用验证。

## 2026-05-12（0.3.2 热修：快判差异视图兼容新版内容区）

- 保持 `extension/manifest.json` 版本 `0.3.2` 不变，本轮为当前测试版本小修。
- 修复 `judgement-asr-diff-view.js` 的 ASR 内容块识别：不再仅依赖标题 `两个ASR文本`，新增兼容 `online_rec` / `online_recognition` / `asr` / `asr_text`，并最终以 `asr_text1/asr_text2` 可解析作为判定。
- 明确忽略新版内容区中的 `上文`、`音频地址`、`wav_id`（以及 `音频`、`音频文件`）块，避免误把长上下文当作 ASR 文本。
- 差异视图继续仅隐藏真正 ASR 文本块的原始 `.dt-text-wrapper`，不隐藏 `上文` 内容块。
- 同步修复依赖同类定位逻辑的模块：
  - `judgement-compact-card.js`
  - `judgement-thunder-question.js`
  - `judgement-ai-suggestion.js`
  以上模块均改为兼容 `online_rec` 并以 `asr_text1/asr_text2` 解析成功为准。
- 文档同步：
  - `extension/sites/alibaba-labelx/asr-judgement/README.md` 补充新版结构兼容规则。
  - `platform-resources/alibaba-labelx/asr-judgement/page-structure/asr-judgement-detail/page-meta.md` 补充"上文 + online_rec + wav_id"结构与选择器建议。

## 2026-05-12（0.3.2：阿里转写当前题 AI 推荐第一版）

- 版本升级：`extension/manifest.json` 从 `0.3.1` 提升到 `0.3.2`（新增用户可见功能）。
- 前端新增转写 AI 模块：
  - `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-client.js`
  - `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-collector.js`
  - `extension/sites/alibaba-labelx/asr-transcription/ai-suggestion-panel.js`
- 转写工具栏新增"AI推荐 / 填入AI"动作，且仅作用于当前题；填入后只写当前 textarea 并触发 `input/change`，不自动保存/提交/流转。
- 转写快捷键新增：
  - `shortcutAiSuggest`
  - `shortcutApplyAiSuggestion`
- 后端新增转写 AI 接口：
  - `GET /api/alibaba-labelx/asr-transcription/ai/suggest-current/health`
  - `POST /api/alibaba-labelx/asr-transcription/ai/suggest-current`
- 后端新增转写 AI 文件：
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-routes.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-client-qwen.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-prompts.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-response-schema.js`
  - `platform-resources/alibaba-labelx/asr-transcription/backend/ai-call-log.js`
  - `platform-resources/alibaba-labelx/asr-transcription/ai-rules.md`
- Qwen 调用口径：默认 `qwen3.5-omni-flash`（听音）+ `qwen3.5-plus`（文本比较）；支持 `response_format: { type: \"json_object\" }`，并在 `enable_thinking` 不支持时按"移除/关闭参数重试"兜底。
- 降级策略：音频不可用或模型无法访问音频时，允许回退到纯文本比较，返回可读错误/风险提示，不阻断页面手工操作。
- 安全与脱敏：API Key 仅后端读取；日志仅记录 requestId/hostname/模型/耗时/结果，不记录完整音频 URL、cookie、token、authorization、API Key。
- 文档同步：
  - `AGENTS.md` 增加"转写允许当前题 AI 推荐（人工确认填入）"规则。
  - `extension/sites/alibaba-labelx/asr-transcription/README.md` 增加 AI 推荐能力、接口与实测清单。
  - `platform-resources/backend/README.md`、`platform-resources/alibaba-labelx/asr-transcription/backend/README.md` 增加 AI 接口与环境变量。
  - `config/env/ai.env.example` 增加 `ASR_TRANSCRIPTION_AI_*` 占位变量。

## 2026-05-12（协作规则收口：默认 main 单工作区）

- `AGENTS.md` Git 工作流改为"默认 `main` 单工作区开发"：默认不建分支、不建独立 worktree、不建 PR。
- 新增默认暗号体系：`ASC_MAIN_TASK`、`ASC_MAIN_HOTFIX`、`ASC_RELEASE`、`ASC_BRANCH_TASK`、`ASC_READONLY`、`ASC_ABORT_IF_DIRTY`。
- `ASC_NEW_BRANCH` / `ASC_CONTINUE_BRANCH` / `ASC_RELEASE_MERGE` 保留为历史兼容识别，明确"不再作为默认流程"。
- `AGENTS.md` 并行开发口径调整为"仅在用户明确要求时启用分支 + worktree"，并要求声明目录、白名单、禁止范围、push 目标。
- `AGENTS.md` Prompt 必备字段更新：补充当前工作目录、当前分支、是否允许创建分支、是否允许直接改 main、是否允许生成 CRX、文件白名单与 push 目标分支。
- `AGENTS.md` 新增 Magic Data 稳定口径（脚本/后端路径、页面挂载位置、规则优先质检、收益估算和安全边界）。
- `README.md` 维护规则最小同步：默认不创建独立 worktree，仅在用户明确要求时使用分支/worktree/PR 流程。

## 2026-05-12（清理旧分支与旧 worktree）

- 已确认 `feature/magic-data-ai-review-debug` 完整合并到 `main` 后再执行清理。
- 已删除旧 worktree：`C:\Projects\annotation-script-center-magic-data-ai-review`（通过 `git worktree remove`）。
- 已删除本地分支：`feature/magic-data-ai-review-debug`。
- 已删除远端分支：`origin/feature/magic-data-ai-review-debug`。
- 协作口径保持：默认 `main` 单工作区开发；分支/worktree 仅在用户明确要求时启用。

## 2026-05-12（0.3.1 发布合并：Magic Data AI 质检助手）

- 发布合并：`main` 合并 `feature/magic-data-ai-review-debug`，引入 Magic Data ANNOTATOR 前后端能力。
- 版本升级：`extension/manifest.json` 从 `0.3.0` 提升到 `0.3.1`。
- 前端接入：新增 `extension/sites/magic-data/annotator/`（页面识别、接口优先采集、页面内质检卡片、快捷键执行与焦点恢复、模型参数透传）。
- 页面形态：`#/asrmark` 在右侧"句子列表"下方固定显示 `Magic Data AI 质检结果` 卡片，不再使用右下角悬浮入口。
- 交互增强：质检卡片支持手动拖拽高度与持久化，支持重置默认高度；AI 结果仅在卡片内部更新，不新增弹窗大面板。
- options/popup：新增 Magic Data 平台卡片与脚本设置入口，支持听音模型、质检模型（下拉 + 自定义）、启用思考、快捷键配置；popup 可识别 Magic Data 页面命中状态。
- 后端接入：新增 `platform-resources/magic-data/annotator/backend/`，并通过 `platform-resources/backend/registry.js` 注册。
- Magic Data 接口：`GET /api/magic-data/annotator/ai/review-current/health`、`POST /api/magic-data/annotator/ai/review-current`。
- 安全边界：保持"只辅助、不自动保存/提交/审核/领取"；日志与响应继续脱敏，不记录完整签名音频 URL、token、cookie、authorization、API Key。
- 发布产物：按 CRX 路径生成 `0.3.1` 三件套（CRX / update.xml / crx-latest.json），不使用 zip 作为正式发布路径。

## 2026-05-11

- AGENTS 协作规则增强：新增"并行功能开发与动态版本号规则"，明确并行任务默认使用独立分支（`feature/<功能名>`、`fix/<修复名>`）与独立 `worktree`，禁止多 Agent 同时改同一 `main` 工作区。
- AGENTS 发布规则增强：并行功能分支不提前改 `manifest.version`、不生成正式 CRX 三件套；统一在合并 `main` 的发布阶段提升 patch、生成 CRX 三件套并打 tag（如 `v0.3.1`）。
- AGENTS Prompt/验收规则增强：并行开发 Prompt 必须包含分支/工作目录/白名单/禁止范围/push 目标分支；并行验收先查功能分支，发布合并阶段再查 `main`、版本、CRX 三件套和 tag。

- README 收尾修正：顶部"当前重点"改为 `0.3.0` 稳定验收完成口径，不再保留"第二轮自动更新方案仅做文档设计"的旧描述。
- README 章节调整：将"第二轮方案（仅文档，不在本轮实现）"改为"CRX 发布与自动安装状态"，明确"CRX 三件套 + ops_monitor 策略写入已完成，企业托管自动安装暂挂起且不阻塞 0.3.0"。

- 新增未完成模块文档：`docs/unfinished/crx-enterprise-managed-install.md`，明确记录"普通非企业托管 Windows 设备会拦截自托管 CRX force_installed 自动安装"的现实阻塞点。
- 文档同步：`README.md` 新增"CRX 企业自动安装说明"并链接未完成模块文档；`AGENTS.md` 新增规则"该模块不作为 0.3.0 阻塞项，恢复前必须先读未完成模块文档"。
- 当前 `0.3.0` 完成标准明确为：CRX 三件套发布能力 + 策略写入能力；企业托管自动安装暂挂起，不阻塞 0.3.0 发布。

- 发布产物追踪规则调整：`.gitignore` 取消全局 `*.crx` 忽略，改为 `dist` 白名单追踪 CRX 三件套（`annotation-script-center-v*.crx`、`annotation-script-center-update.xml`、`annotation-script-center-crx-latest.json`），用于后续上传 `https://script.xiangtianzhen.store/downloads/`。
- 安全规则保持不变：继续忽略 `config/secrets/*.pem|*.key|*.p12` 与私有 env 文件，私钥不得提交。
- 文档同步更新：`README.md`、`extension/README.md`、`AGENTS.md` 已改为"3.0 起允许追踪并提交 CRX 三件套；其他 dist 临时产物默认不提交"口径。

- CRX 企业发布能力：新增 `scripts/package-crx-release.js`，可基于 `extension/manifest.json` 版本和固定私钥 `config/secrets/annotation-script-center.pem` 生成 `dist/annotation-script-center-v<version>.crx`、`dist/annotation-script-center-update.xml`、`dist/annotation-script-center-crx-latest.json`。
- CRX 脚本支持浏览器路径优先级：`ASC_CHROME_EXE` > Chrome/Edge 常见安装路径自动探测；支持 `ASC_DOWNLOAD_BASE_URL` 覆盖下载前缀，支持 `--notes` 写入发布说明。
- CRX 脚本增加发布后自检：校验 `crx-latest.json` 必填字段、`sha256` 64 位 hex，以及 `update.xml` 的 `appid/version/codebase` 一致性；并输出需要上传到 `downloads` 的三个文件路径。
- `extension/manifest.json` 新增并保留 `update_url`：`https://script.xiangtianzhen.store/downloads/annotation-script-center-update.xml`。
- 清理 zip 发布路线：删除 `scripts/generate-release-manifest.js`、删除 `dist/annotation-script-center-latest.json`，文档不再把 zip 作为正式更新方式。
- `.gitignore` 保留 `config/secrets/*.pem|*.key|*.p12` 忽略规则；`config/secrets/README.md` 继续说明私钥长期保管要求（不提交真实私钥）。
- 文档同步：`README.md`、`extension/README.md`、`AGENTS.md` 收敛为 3.0 正式发布默认 CRX 三件套；zip 仅作为历史遗留说明，不作为正式发布和自动更新路径。

- 0.3.0 配置体验优化：统一项目数据下载私有配置文件模板，新增 `config/env/backend.env.example`，提供 `ASC_PROJECT_DATA_DOWNLOAD_PASSWORD_SHA256` 与 `ASC_PROJECT_DATA_DOWNLOAD_JWT_SECRET` 示例占位。
- 后端环境加载顺序升级：`platform-resources/backend/env-loader.js` 默认改为优先读取 `config/env/backend.env`、`config/env/backend.local.env`，并保持 `ai.env` / `ai.local.env` / `.env.local` / `ASC_ENV_FILE` 兼容。
- `.gitignore` 补充忽略 `config/env/backend.env`、`config/env/backend.local.env`，并允许提交模板 `config/env/backend.env.example`。
- 文档同步：更新 `README.md` 与 `platform-resources/backend/README.md` 的项目数据下载配置教程，补充创建 backend.env、生成密码 hash、生成随机 JWT secret、Linux/PM2 重启与 `project-data-download-auth-not-configured` 排查。
- `config/env/ai.env.example` 增加提示注释：项目数据下载配置应放在 `backend.env`，AI 配置继续放在 `ai.env`。

## 2026-05-10

- 0.3.0 测试版 BUG 修复：修复 `extension/background/service-worker.js` 的 `importScripts` 路径，改为 MV3 service worker 可加载的根相对路径 `shared/constants.js`、`shared/storage.js`，避免扩展后台报 `Failed to execute 'importScripts' ... constants.js failed to load`。
- 0.3.0 隐藏入口逻辑修正：options 首页不再"点击 1 次显示切换"，改为连续点击"后端接口地址"文案 10 次后，同时显示"服务器/本机"切换按钮与"项目数据下载"面板。
- 0.3.0 默认后端模式修正：options 初始化阶段将 `meta.backendEndpointMode` 归一到 `server`，确保隐藏入口未解锁时默认仍为服务器口径。
- 文档补充：在 `README.md` 与 `platform-resources/backend/README.md` 新增"项目数据下载密码配置教程"，覆盖 PowerShell 生成 SHA256、Windows 临时/持久化、Linux/PM2、`project-data-download-auth-not-configured` 排查和安全注意事项。

- 扩展版本升级：`extension/manifest.json` 从 `0.2.11` 升级到 `0.3.0`，用于交付"项目数据下载鉴权与供应商筛选下载"第一轮能力。
- options 首页改造：
  - "后端接口地址"默认仅显示文案，点击一次文案后才显示"服务器 / 本机"切换按钮；
  - 连续点击同一文案 10 次后，解锁隐藏面板"项目数据下载"；
  - 新增获取人姓名、数据类型、供应商条件渲染、导出按钮和状态提示；
  - 获取人姓名可保存，下载密码仅在请求体使用，不保存到 storage。
- 统一后端新增聚合下载模块：`platform-resources/backend/project-data-download/`
  - 新增接口：`/api/admin/project-data-download/options`、`/request`、`/file`（GET/HEAD）；
  - 使用环境变量 SHA256 密码校验 + 内置 `crypto` HMAC 短期 token（120 秒）；
  - 三类数据集统一下载：ASR 快判统计、ASR 转写统计、标贝易采导出 latest；
  - 多供应商 CSV 强制先选供应商，服务端筛选后输出 UTF-8 with BOM；
  - 下载流程新增审计日志（IP、获取人、数据类型、供应商、状态、时间、UA 等），不记录 password/token 全文/cookie/authorization。
- 后端接入与规范：
  - `platform-resources/backend/registry.js` 注册 `project-data-download`；
  - `platform-resources/backend/server.js` 启动日志新增三条项目数据下载接口提示；
  - `.gitignore` 新增 `platform-resources/backend/project-data-download/audit-data/`，避免提交运行审计数据。
- 文档同步：
  - 更新 `README.md`、`extension/README.md`、`platform-resources/backend/README.md`、`platform-resources/data-baker/round-one-quality/README.md`；
  - 第二轮"自动更新扩展"仅沉淀方案：明确采用 `XiangTianzhen/ops_monitor` 本地 exe 路线，本轮不实现跨仓代码。

- 文档同步：全仓 README 与 `AGENTS.md` 稳定规则对齐。重点修正转写/快判 backend README 中"supplier 必传下载"和"suppliers 目录主写入"旧口径，统一为根级总表 `statistics-data/statistics-merged.csv` 主存储、`/statistics/download` 默认总表下载。
- 文档同步：修正 README 中旧"jitter 10 分钟"与并发上限 `500` 口径，统一为定时上传前随机延迟 `0~300` 秒（`100ms` 步进，手动上传不延迟）与动态并发上限 `999`。
- 本轮仅修改 Markdown 文档（README/log），未修改 JS/manifest，未升级版本，未打包 dist。

- 文档治理：更新 `AGENTS.md` 协作入口，补齐 `0.2.11` 稳定统计规则沉淀，覆盖 DevTools/Playwright 工作流、根级总表主存储、分包ID唯一定位、`existing/complete/upload` 跳过与上传边界、CSV UTF-8 with BOM 与健康值覆盖规则、供应商回退识别、进度悬浮窗与动态并发（`Math.floor(total/5)`，最小 `1` 最大 `999`）、定时上传 `10:00/16:00` 与 `0~300s`（`100ms` 步进）延迟规则。
- 本轮仅更新文档（`AGENTS.md`、`log.md`），未修改 JS/后端代码、未修改 `extension/manifest.json`、未升级版本、未打包 dist。

- 继续保持 `extension/manifest.json` 版本 `0.2.11`，仅做上传统计进度悬浮窗样式微调（不改统计业务逻辑）。
- `shared/progress-indicator.js` 悬浮窗位置上移到页面顶部中间附近（`top: 68px`），并增加卡片内边距与间距（`padding: 12px 16px`、`gap: 10px`），提升完成态和进行中态阅读舒适度。

- 保持 `extension/manifest.json` 版本 `0.2.11`，本轮不升级 `0.2.12`。
- 共享上传进度组件 `extension/shared/progress-indicator.js` 改为"页面顶部居中悬浮窗"显示（`position: fixed`），不再挤占 LabelX 顶部工具栏布局。
- 进度进行中/完成/失败统一使用同一紧凑卡片布局，完成态不再出现横向铺满的绿色长条。
- 上传按钮状态更新不再写入长 `title` 文案，移除转写/快判按钮 tooltip 动态赋值，避免鼠标悬停出现黑色长文本框。
- 转写与快判继续共用同一 `shared/progress-indicator.js` 组件，仅修样式，不改统计业务逻辑、existing 判断、并发规则、定时规则和后端接口。

- 继续保持 `extension/manifest.json` 版本 `0.2.11`，本轮不升级 `0.2.12`。
- 修复转写待补任务名称链路：`enrichSubtaskData` 改为健康文本优先（`detail -> summary -> taskMap` 多源回退），并补充 `summary.name`、`taskMap.taskName/name`、`task.id` 等候选来源。
- 修复转写合并键复用：同 `分包ID + role + subTaskId` 命中旧行时优先复用旧 mergeRow，避免"未识别供应商旧行"与"新识别供应商新行"并存导致任务名称始终不补齐。
- 保持规则：`exists=true` 不等于 `complete=true`；任务名称为空仍视为 `complete=false`，必须继续拉详情并上传补齐。
- 修复共享进度组件样式：新增居中外层容器，进行中/完成态保持同一紧凑卡片布局；宽度提升到 `560~860px` 并支持换行，四位数成功/失败数字可见。
- 转写完成态摘要文案压缩为核心数字（扫描/补齐/上传/跳过完整/待补/废弃/失败/并发），避免完成态绿色块被超长文本撑坏。
- 保持规则：无待上传数据不调用 `/statistics/upload`，显示"已全部完整，无需上传"。
- 主存储继续保持根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。

- 继续保持 `extension/manifest.json` 版本 `0.2.11`，不升级 `0.2.12`，本轮聚焦统计小修正。
- 新增统计 CSV 统一字段清洗：转写/快判后端写出前统一去 BOM、去首尾空白（含全角空格/Tab/换行/零宽字符），任务名称、任务ID、子任务ID、分包ID、人员、时间、完成状态、供应商都不再保留前后空格。
- 修正供应商回退识别：当前后端/前端 helper 遇到 `未识别供应商` / `unknown-supplier` / 空值时，不再直接沿用，统一回退到任务名称重新推断（`棋燊`、`希尔贝壳`）。
- 快判统计上传接入共享进度条 `shared/progress-indicator.js`，显示阶段、完成/总数、百分比、并发、成功/失败，并在上传完成/失败后显示摘要。
- 快判详情抓取改为按 `recordCount` 分页补齐（保持 `pageSize=400` 口径），详情并发改为动态 `Math.floor(total/5)`，最小 `1`、最大 `500`，与转写并发展示口径一致。
- 保持扩展版本 `0.2.11` 不升级 `0.2.12`，修正 LabelX 统计导出策略并重新按 `0.2.11` 口径验证与打包。
- 修正转写统计进度并发显示：详情阶段并发改为 `Math.floor(total/5)`，最小 `1`、最大 `500`，进度条显示并发与实际执行并发保持一致（例如 `total=1854 -> 370`，`total=8000 -> 500`）。
- 修正供应商识别稳定性：`statistics-supplier.js` 与 `supplier-utils.js` 统一任务名规范化（decode + 清理前后空白 + 连续空白规整），优先按任务名包含关系识别 `希尔贝壳` / `棋燊`，修复前导空格与全角空格场景误判。
- 修正 LabelX 统计主存储口径：转写与快判后端主写入恢复为根级 `statistics-data/statistics-merged.csv`，`/statistics/download` 默认下载总表，不再强制 `supplier` 参数；历史 `suppliers/<供应商>/statistics-merged.csv` 仅兼容读取迁移，不删除旧运行数据。
- 修正后端目录行为：`ensureDataDir()` 不再主动创建 `statistics-data/suppliers/`，新上传仅写根级 `statistics-data/statistics-merged.csv`。
- 新增共享上传进度组件 `extension/shared/progress-indicator.js`，并接入转写统计上传流程，展示阶段、完成数/总数、百分比、并发、成功/失败，长任务期间不再只显示"上传中"。
- 修正转写统计抓取完整性：`transcription-stats-client.js` 移除旧硬上限（5 页/50 子任务/300 详情），改为按 `recordCount` 计算分页；首页与详情分页保留保护阈值，详情默认并发 `5`、上限 `500`，详情优先 `pageSize=5000` 并在必要时继续分页补齐。
- 修正转写有效时长口径：仅累计"是否有效"严格等于"有效"的题目时长，不使用 `includes(\"有效\")`，避免"无效"误算。
- 修正转写人员解析：新增 `dataResultHistory` 兜底（优先 `type===0`，否则最后一条）。
- 修正快判统计采集并发与分页上限：首页分页保留保护阈值，详情并发默认 `5`，保持快判 `pageSize=400` 业务口径不变。
- 修正转写/快判后端 CSV 写出规则：供应商信息仍保留在内部 payload/mergeKey/行数据中用于防冲突；CSV 导出改为动态供应商列（单供应商不输出，多供应商在最后一列追加）。
- 文档同步更新：`AGENTS.md`、根 `README.md`、`extension/README.md`、`platform-resources/backend/README.md`、转写/快判模块 README、LabelX 平台 README、转写统计策略文档，统一到 0.2.11 修正口径。
- 本轮继续遵循页面采集工作流：结构和 Network 采集优先 Chrome DevTools / MCP；Playwright Edge 仅用于真实操作验证或 DevTools 不可用兜底；Codex 仅负责打开浏览器，登录与进页面由用户完成。

## 2026-05-09

- 修复扩展重载后的旧页面刷错：`shared/storage.js` 新增扩展上下文可用性检测与 `EXTENSION_CONTEXT_INVALIDATED` 结构化错误，统一识别 `Extension context invalidated`。
- 转写运行时生命周期修复：`runtime-config.js` 对上下文失效改为一次性 info + 安全 fallback，不再按普通设置加载失败反复 `warn`。
- 转写 content runtime 新增 `extension-context-invalidated` 停机分支：命中后停止工具栏/快捷键/统计调度与重试观察器，`PANEL_PING` 返回"扩展上下文已失效，请刷新页面"。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 标贝易采一检质检新增"导出后上传后端"能力：`group/detail` 导出总表生成 CSV 后，保持本地下载，同时自动 `POST /api/data-baker/round-one-quality/export/upload` 上传。
- 新增 DataBaker 导出后端模块：`export-routes.js`、`export-store.js`，统一挂载到 `platform-resources/backend/server.js`，提供 `health/config/upload/download(含 HEAD)/list`。
- 新增 DataBaker 导出保存目录：`platform-resources/data-baker/round-one-quality/backend/export-data/`，默认写 `latest.csv` 与 `latest.json`，可通过环境变量开启 history/events。
- 收口安全边界：导出上传失败不阻断本地下载；后端限制 `csvText` 最大 20MB；日志仅输出 `requestId/rowCount/fileName/csvPath/uploadedAt`；`export-data` 已加入 `.gitignore`。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 配置收口：删除 ASR 转写详情页"转写统计导出"配置板块，移除"启用转写统计上传"等可关闭控件，转写面板仅保留自动播放、倍速、步长、音量和快捷键配置。
- 配置收口：快判详情页移除"启用统计上传 / 启用定时上传"可关闭控件，统计上传改为只读强制启用说明。
- 运行时收口：转写与快判统计上传改为默认强制启用；已实现定时上传能力的脚本，定时上传也按脚本规则强制启用，不再受 options 开关控制。
- 存储收口：`shared/storage.js` 在转写/快判 normalize 阶段强制 `statsUploadEnabled=true`、`statsAutoUploadOnSchedule=true`，忽略旧存储中的 `false`。
- 修复转写运行时报错可读性：`runtime-config.js` 新增错误摘要与安全回退，避免控制台出现 `[ASR Edge][transcription] load settings failed [object Object]`，加载失败时回退到安全默认配置并继续运行。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 统一后端接口地址配置入口：options 首页顶部"后端接口地址"改为全局 `meta.backendEndpointMode`（`server/local`），不再通过 DataBaker 脚本字段间接承载。
- 删除脚本详情页重复 endpoint 配置控件：移除转写"上传地址"、快判"上传接口地址"和快判 AI"后端接口地址"输入。
- options 详情页仅保留业务开关和参数（转写/快判/标贝），后端地址统一只读说明"由首页全局控制"。
- 转写统计、快判统计、快判 AI 建议、标贝易采 AI 推荐运行时统一改为"全局 baseUrl + 固定 API path"拼接，不再以脚本级 endpoint 字段作为运行时主来源。
- `shared/storage.js` 新增旧字段迁移：当 `meta.backendEndpointMode` 缺失时，会从历史 `statsUploadEndpoint/aiSuggestionEndpoint/aiRecommendEndpoint` 推断 `local/server`，避免旧配置报错。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 修复 ASR 转写统计 CSV 角色污染：前端 `csvPatch` 收敛为基础字段（`任务名称/任务ID/分包ID/题数/有效时长(秒)`），不再写入标注/审核字段。
- 修复转写后端合并边界：`applyBasePatch` 忽略全部角色字段；标注/审核字段仅允许 `applyRoleRecord` 按 `role` 写入。
- 修复 `role` 容错风险：`roleRecord.role` 不再默认回退 label，缺失或非法时直接拒绝写入并返回错误，避免误把审核数据写入标注列。
- 本地自测覆盖 `audit-only` / `label-only` / `label->audit` / `audit->label` / 缺失 role 五种场景，验证分包合并和顺序无关性。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

- 修复 ASR 转写统计上传请求风暴风险：详情抓取从 `pageSize=10` 调整为 `pageSize=100`，并增加 `maxPages=3`、`maxItems=300` 硬上限。
- 修复详情分页停止条件：遇空页、重复页签名、`recordCount` 缺失、`recordCount` 已满足或达到上限即停止，避免疑似无限循环请求。
- 修复首页分页抓取边界：列表分页最多 `5` 页，去除旧的大范围循环策略。
- 新增首页采集限流：详情请求并发限制为 `2`，单次上传最多处理 `50` 个转写子任务，并按清洗后的 `subTaskId` 去重，单轮只请求一次详情。
- 新增上传互斥锁反馈：上传进行中返回 `upload-in-progress` + `skipped=true`，手动连点与定时触发不会并发第二轮上传。
- 同步补充转写统计策略文档：新增 `platform-resources/alibaba-labelx/asr-transcription/statistics.md`，并更新 `network.md` 与转写 README。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`。

## 2026-05-08

- ASR 转写统计取数按 `platform-resources/alibaba-labelx/asr-transcription/network.md` 修正：详情接口分页解析改为 `data.dataList[]`，并保持 `pageSize=10` + `maxPages=20`。
- 转写统计新增详情页元信息合并：`fetchSubtaskDetail` 会把分页首屏 metadata（`taskId/batchId/taskName/status/gmtCreate/gmtCommit`）与首页 summary 合并，避免只拿题目列表导致字段缺失。
- ASR 转写恢复轻量设置面板：options 转写详情页新增自动播放、默认倍速/重置倍速、倍速步进、前进/后退步长、默认音量、当前题行为和转写统计上传配置。
- ASR 转写恢复快捷键配置与运行时：新增 `shortcut-bus.js`，仅支持当前保留动作（含"上传转写统计"），并加入"输入框普通字符不拦截"保护。
- `runtime-config.js` 改为读取 `scriptCenter.projects.transcription.asrConfig` 并规范化安全字段，不再仅使用固定硬编码值；转写运行时参数与 options 保存值打通。
- `manifest.json` 为转写注入链路新增 `sites/alibaba-labelx/asr-transcription/shortcut-bus.js`（在 `content.js` 前），版本保持 `0.2.10`。

- ASR 转写新增统计导出能力：新增 `transcription-stats-client.js`（浏览器端上传客户端），提供顶部"上传转写统计"入口、工具栏"上传统计"动作、定时上传调度（默认 `10:00` / `16:00`，jitter `10` 分钟）和上传状态提示。
- ASR 转写新增独立统计后端：新增 `platform-resources/alibaba-labelx/asr-transcription/backend/`，包含 `health/config/upload/download` 路由、分包合并、CSV 写入与下载；默认输出 `statistics-data/statistics-merged.csv`。
- 转写统计 CSV 列固定为：`任务名称,任务ID,标注子任务ID,审核子任务ID,分包ID,题数,有效时长(秒),标注员,审核员,标注领取时间,标注提交时间,审核领取时间,审核提交时间,标注是否完成,审核是否完成`，同一分包按 `mergeKey.batchId` 合并标注/审核记录。
- 统一后端注册新增 `alibaba-labelx/asr-transcription` 项目路由与环境变量支持（`ASR_TRANSCRIPTION_STATS_DIR`、`ASR_TRANSCRIPTION_PERSIST_ROWS_JSON`、`ASR_TRANSCRIPTION_PERSIST_UPLOAD_EVENTS`）。
- options 转写详情页继续保持轻量模式，不恢复旧完整设置表单，仅新增统计导出小卡（开关、上传地址、本地保存目录和下载地址说明）。
- 本轮仍保持 `extension/manifest.json` 版本 `0.2.10`，因为当前属于 `0.2.10` 测试修复阶段，不提前升到 `0.2.11`。
- 修正转写统计前后端命名与边界：扩展侧文件从 `transcription-stats-server.js` 重命名为 `transcription-stats-client.js`，只保留采集/上传客户端职责；Node 服务继续只在 `platform-resources/alibaba-labelx/asr-transcription/backend/`。
- 修复转写统计取数逻辑：详情接口改为 `pageSize=10` 分页抓取（含最大页数保护），新增 `subTaskId` 空白清洗（空格/Tab/换行/全角空格）后再请求 `/subTask/{id}/data`。
- 修复转写任务识别：排除 `labelModel=vote` 与"ASR更优结果判断"类快判任务，采集 `labelModel=single`、`size=50`、任务名含"中文普通话asr任务"等转写任务。
- 修复有效时长汇总：转写统计改为从分页 `dataList` 聚合 `item.data.duration/item.duration/item.audioDuration/...` 候选字段，不再只依赖单一路径。

- ASR 转写轻量工具栏完成页面内布局改造：新增 `toolbar.js`，工具栏优先注入 `.mark-toolbox`（优先 breadcrumb 后），无 `.mark-toolbox` 时回退到首条题卡前，不再默认固定悬浮在页面顶部中央。
- ASR 转写工具栏改为分组结构：`当前题/文本/音频/倍速/音量/状态`；状态块新增当前题定位、当前音频状态和最近动作结果，按钮动作继续只作用于当前题/当前音频。
- 转写运行时编排收敛：`content.js` 只负责命中重试、动作分发、popup ping 与工具栏状态更新；保留 DOMContentLoaded/load/MutationObserver/SPA/轮询重试链路，避免过早判定失败。
- options 转写详情页继续保持轻量说明，补充"版本 0.2.10、支持能力、不支持能力、使用步骤"文案，不恢复完整设置表单。
- `manifest.json` 为转写注入新增 `toolbar.js`（在 `content.js` 前），版本继续保持 `0.2.10`（当前仍属同版本修复与体验优化阶段）。

- 修正版本策略：当前 ASR 转写属于 `0.2.10` 实际使用 BUG 修复过程，版本号回退并保持为 `0.2.10`，不提前升到 `0.2.11`。
- 明确 `0.2.11` 仅在 `0.2.10` 修复完成且通过真实浏览器验证后再使用。
- 重新生成 `dist/annotation-script-center-v0.2.10.zip` 作为当前有效测试包。

- 修复 Alibaba LabelX 转写轻量脚本注入时机：`content.js` 改为持续重试命中（`DOMContentLoaded`、`load`、`MutationObserver`、`pushState/replaceState/popstate`、短轮询），不再在 `document_start` 首次 DOM 未就绪时永久停机。
- 修复 popup 误报"注入失败"：转写 `PANEL_PING` 改为脚本注入后恒响应，新增 `injected/matched/reason`；popup 新增"已注入，等待转写详情页"状态，仅在真正无响应时显示"注入失败"。
- 删除转写独立设置链路：移除 `settings-panel.js`、options 页转写设置表单挂载、页面内 overlay 设置入口与"设置"工具栏按钮。
- 删除转写快捷键链路：移除 `shortcut-bus.js`、content 侧快捷键绑定与配置依赖；转写仅保留页面工具栏按钮触发。
- 精简 `runtime-config.js`：仅保留脚本中心启用状态读取与固定默认值输出，不再保存或订阅转写独立配置。
- `manifest.json` 删除 `settings-panel.js` 和 `shortcut-bus.js` 引用，版本从 `0.2.10` 提升到 `0.2.11`。

- `asr-transcription` 按"删除旧目录 + 轻量重写"执行：先 `git rm -r extension/sites/alibaba-labelx/asr-transcription/`，再重建为最小文件集（`content.js`、`settings-panel.js`、`runtime-config.js`、`audio-controller.js`、`active-item.js`、`item-actions.js`、`shortcut-bus.js`、`text-utils.js`、`README.md`）。
- `manifest.json` 删除转写旧 MAIN world 与旧 ISOLATED world 链路引用，移除所有旧 legacy/save/submit/batch/ai/export/leaderboard/page-flow 相关脚本路径，仅保留轻量版转写脚本引用；快判与 DataBaker 链路保持不变。
- 转写运行时收敛为"当前题 + 当前音频"能力：快速填入、标有效/无效、去空格、数字转换、焦点切换、播放/暂停、前进/后退、倍速调整/重置、音量调整/重置、复制时长；不做自动保存/提交/流转与整页批量动作。
- options 页补充加载 `runtime-config.js`，确保转写设置面板可在脚本中心继续保存基础配置。
- 文档同步更新根 `README.md`、`extension/sites/alibaba-labelx/asr-transcription/README.md`、`platform-resources/alibaba-labelx/asr-transcription/README.md`，明确"旧能力已删，恢复需重新设计和验收"。

- 继续清理 `asr-transcription`：删除全页批量修改动作（全页标有效并填充、全页去空格、全页校验自动修复）在工具栏、快捷键和交互执行器中的入口与逻辑，仅保留当前题级别操作。
- 物理删除旧自动化与旧保存链路文件：`annotation-save-runner.js`、`annotation-submit-runner.js`、`annotation-page-flow-runner.js`、`legacy-save-coordinator.js`、`legacy-ai-punctuation.js`、`legacy-auto-assign.js`、`legacy-batch-flow.js`、`legacy-export.js`、`legacy-leaderboard.js`。
- 同步收口引用链路：更新 `manifest.json`、`runtime-contract.js`、`content.js`、`annotation-control-panel.js`、`runtime-debug.js`、`annotation-debug-snapshot.js`，移除上述模块依赖与暴露。
- 同步收口配置与兼容迁移：更新 `shared/constants.js` 与 `shared/storage.js`，删除全页批量快捷键定义，旧字段统一清理为 `null` 或运行时忽略。
- 文档口径更新为"旧功能已删除，后续如需恢复必须重新设计并重新验收，不从旧脚本直接恢复"。

- 对 `asr-transcription` 执行基础收口重构：禁用扩展侧自定义保存 payload 注入、手动强制保存、提交闭环、自动提交、自动领取、自动流转入口；保留兼容空实现以避免 manifest/注入链路断链。
- 收口转写快捷键和配置：移除 AI 标点、自动批量提交、校验后自动提交、排行榜等危险快捷键入口；新增并统一使用 `playbackRateValue`、`rateStepValue`、`seekStepSeconds`，音频步进/倍速/音量重置改为读取统一配置。
- 收口运行时自动链路：`content.js` 不再启动自动抢单和批量流转轮询；`legacy-batch-flow`、`legacy-auto-assign`、`legacy-ai-punctuation` 默认返回 `disabled-in-basic-stage`。
- 同步文档口径：更新根 `README.md`、`extension/sites/alibaba-labelx/asr-transcription/README.md`、`platform-resources/alibaba-labelx/asr-transcription/README.md`，明确"基础转写阶段"规则与真实页面验收步骤。
- 文档目录迁移：将 `docs` 下旧 `extension` 子目录文件全量迁移到 `docs` 根目录，并清理空子目录。
- 文档引用修正：README、AGENTS、docs 与平台资料中的旧子目录引用统一改为 `docs/`。
- 用户可见命名统一：文档中的平台名称统一为"标贝易采"，脚本名称统一为"标贝易采一检质检"；保留 `data-baker` 目录与 API 路径等历史技术标识。
- 环境模板首轮收敛：`config/env/ai.env.example` 当时先收成了“DashScope + 额外 provider 示例”的过渡模板，后续再继续瘦身为最小生产版。
- 新增 `AGENTS.md` 长期规则：执行类任务需检查并同步提升扩展版本号；默认代码或用户可见行为变化时提升 patch 版本。
- 新增 `AGENTS.md` 长期规则：验证通过后默认按 `manifest.version` 生成 `dist/annotation-script-center-v<version>.zip`，并检查压缩包根目录结构。
- 本轮将 `extension/manifest.json` 版本从 `0.2.9` 提升到 `0.2.10`。
- 继续清理文档中的标贝易采旧称残留：统一用户可见平台名为"标贝易采"，脚本名为"标贝易采一检质检"。
- 明确 `dist/` 为构建产物目录，默认不提交 git。

## 2026-05-07

- 强化 `AGENTS.md` 协作规则：新增"网页端指挥 AI + Codex 执行 AI"模式，明确网页端 Prompt 是当前任务直接执行依据，冲突时当前任务优先按 Prompt 执行并同步文档。
- 新增执行约束：执行类任务不得停留在审计报告；子代理结论只能作为中间分析，主线程必须继续落地修改与验证。
- 新增文档沉淀约束：网页端确认的业务规则、限制和验收口径必须写入 README/docs，并在影响行为时同步记录到 `log.md`。
- 新增输出规范：Codex 最终输出需包含分支、修改文件、验证结果、`git status --short`、commit hash、push 结果、风险点和后续真实页面验收项。
- 新增真实页面不可访问处理规则：禁止伪造页面结论；可先完成不依赖页面的代码/文档改动，并明确标注"需要真实页面验证"项。
- 新增 `asr-transcription` 当前业务口径：仅做基础转写（一音频一文本框），暂不做时间戳、说话人、AI 初稿/校对/格式化，保存以平台自动保存为准，不照搬 `asr-judgement` 判别动作与保存链路。

## 2026-04-30

- 重做 标贝易采快捷键焦点恢复策略：`shortcuts.js` 删除旧焦点哨兵与被动恢复依赖，不再在平台按钮点击、active 题目变化或窗口 focus 时盲目 blur/focus。
- 新增"本句话文本"变化检测机制：当平台自动切题导致 textarea 内容变化且用户不在手动编辑时，脚本会短暂 focus 文本框再 blur 退出，用于恢复快捷键焦点。
- 手动输入保护增强：用户在"本句话文本"中输入时不会被定时检查抢走光标；仅命中已配置快捷键时才强制退出输入框并执行动作。
- 修复 标贝易采一检质检快捷键被动焦点恢复可能影响音频播放的问题：`shortcuts.js` 移除平台按钮点击、左侧句子切换、active 题目变化、窗口 focus 等被动 blur/focus 恢复链路。
- 标贝易采快捷键策略收敛为"仅命中已配置快捷键时强制退出输入框并执行动作"；未命中快捷键时不拦截普通输入、不干预平台切题和音频组件初始化。
- 保留"填入推荐文本"后的主动失焦能力（`data-api.js`），仅在用户点击填入成功后触发，不影响平台自动切题流程。

## 2026-04-29

- 修复 标贝易采 总表导出分页大小下拉稳定性：`group-export.js` 切换 `100条/页` 前先点击 `.el-pagination__sizes .el-select` 内的 `.el-input.el-input--mini.el-input--suffix`，等待 `.el-select-dropdown.el-popper` 渲染后再选择 `100条/页`。
- 分页大小下拉匹配增加防误点规则：仅选择包含 `10/20/50/100条/页` 组合的可见 dropdown，优先最后一个可见项，避免误点筛选条件下拉。
- 切换 `100条/页` 后新增状态提示与兜底：支持"已选择100条/页，正在等待平台响应"；若响应未及时捕获但分页显示已变更为 `100条/页`，允许继续全量导出。

- 优化 标贝易采 group/detail 总表导出为"平台原生分页全量导出"：`group-export.js` 点击后先切换 `100条/页`，再通过跳页控件逐页触发 `queryByCondition`，由 MAIN world 拦截响应并合并去重后下载 CSV。
- 标贝易采 总表 CSV 字段移除"采集ID"列，继续保留中文表头、UTF-8 BOM 与"原始JSON"脱敏列；导出过程不写入 `access_token`、`refresh_token`、cookie 或 authorization。
- 导出失败时增加明确提示和当前页兜底导出提示：分页控件不可用会提示手动切换 `100条/页` 后重试，避免静默失败。

- 修复 标贝易采 group/detail 导出 `code=51000`：`group-export.js` 不再直接 `fetch /cms/tbAudioUserTask/queryByCondition`，改为触发页面原生查询并等待 MAIN world 拦截响应后导出。
- 扩展 `page-world/network-observer.js`：新增 `queryByCondition` 拦截、`DATABAKER_ROUND_ONE_QUALITY_GROUP_QUERY_RESPONSE` 消息类型，以及 `window.__ASREdgeDataBakerRoundOneGroupQueryCache`（最多 20 条）缓存；保留原有 `queryCollectStatementByCondtion` 逻辑不变。
- 导出流程第一版调整为"当前页导出"：按钮文案改为"导出当前页数据"，文件名包含 `pageNum`；支持查询按钮触发、分页触发和 `location.reload()` 兜底，并通过 `sessionStorage` 恢复等待状态。

- 删除 标贝易采 后端自动导出链路：移除 `export-auth.js`、`export-client.js`、`export-csv.js`、`export-routes.js`，并在 `backend/index.js` 取消导出路由注册，仅保留 AI 推荐文本路由。
- 清理导出登录配置模板：`config/env/ai.env.example` 删除全部 `DATABAKER_EXPORT_*`、`ticket`、`nounce` 相关变量，避免继续配置账号密码或 token 链路。
- 清理文档现行说明：根 README、标贝易采 扩展 README、平台 README、后端 README 全部移除后端导出接口与自动登录说明，统一为前端同源导出（`/cms/tbAudioUserTask/queryByCondition`、`credentials: include`、默认 `pageSize=100`、CSV UTF-8 BOM 本地下载）。

- 标贝易采 `group/detail?taskId=...` 总表导出默认链路切换为前端同源导出：扩展直接使用当前页面登录态请求 `/cms/tbAudioUserTask/queryByCondition`（`credentials: include`），默认 `pageSize=100` 自动翻页并下载本地 CSV（含 UTF-8 BOM）。
- `group-export.js` 导出流程新增分页进度状态（第 x / y 页、已获取 n / total 条）、最大页数保护（`10000`）与登录态失效错误提示；不再默认依赖 `127.0.0.1:3333` 本地后端。
- CSV 导出列改为中文表头并新增"原始JSON"脱敏列；导出时过滤 `token/cookie/authorization/signature/ossaccesskeyid` 敏感字段，不导出完整 URL。
- 同步更新 README 文档口径：前端同源导出为默认推荐，后端导出保留为备用能力；后端自动登录受滑块验证码 `ticket/nounce` 限制，不作为首选。

- 使用 `chrome_devtools` 完成 标贝易采 登录请求脱敏调研：确认真实接口为 `POST /cms/authentication/form`，`username/password/ticket/nounce` 走 query，响应 token 路径为 `data.access_token` / `data.refresh_token`，并会设置 `JSESSIONID`。
- 标贝易采 导出后端对齐真实登录契约：`export-auth.js` 新增 query 传参登录、captcha `ticket/nounce` 配置、Cookie/JSESSIONID 缓存与 `language` 头兼容；`export-client.js` 请求侧同步带 `language` 与 Cookie。
- 更新导出环境模板与文档：`ai.env.example`、根 README、平台 README、后端 README 同步登录契约字段与安全要求（不记录真实账号、密码、token、cookie）。
- 实测导出验证：`health` 在补全配置后可 `ready=true`；复用已使用的 `ticket` 会返回"滑块验证码校验不通过"，后端现已透传明确业务错误，不再误报缺少 token。

- 新增 标贝易采一检质检导出后端：`/api/data-baker/round-one-quality/export/health` 与 `/api/data-baker/round-one-quality/export/task`；账号密码从环境变量读取，导出链路支持 token 内存缓存、过期刷新与 401/403 自动重登，按 `taskId` 自动翻页 `queryByCondition` 并生成 CSV 到 `platform-resources/data-baker/round-one-quality/backend/exports/`，响应不返回 token。
- 新增 标贝易采 `group/detail?taskId=...` 页面"导出数据总表"按钮：点击后调用本地导出接口并触发浏览器下载，同时展示"正在导出/已导出/失败原因"状态。
- 修复 标贝易采一检质检输入框误失焦：快捷键焦点恢复拆分为被动恢复与强制恢复；被动恢复会跳过编辑态和最近 1200ms 手动点入输入框场景，命中已配置快捷键时仍可强制失焦执行动作。
- 新增导出环境变量模板 `DATABAKER_EXPORT_*` 与登录字段/token 路径可配置项；同步 `.gitignore` 忽略 `platform-resources/data-baker/round-one-quality/backend/exports/`。
- 标贝易采 AI 推荐文本新增去空格兜底：后端统一清理 `heardText` 和最终 `recommendedText` 中的普通空格、全角空格、Tab 和换行；前端展示、复制和填入前也做兼容兜底，不修改页面候选文本原文，不自动保存或提交。
- 更新 AGENTS.md 项目定位：当前重点平台收口为 Alibaba LabelX 与 标贝易采，重点脚本包含快判、转写和 标贝易采一检质检。
- 固化单人项目 Git 工作流：默认 main 分支直接执行，验证通过后 commit 并 push，不创建分支、不创建 PR。
- 固化复杂任务优先使用 subagent / parallel agents；不支持时按相同分工串行执行。
- 固化默认由网页端指挥 AI 通过 GitHub 直接验收，不再默认输出验收 Prompt。
- 本轮仅更新协作文档，不改扩展业务代码、不改后端 API、不改 manifest。

- 修复 标贝易采 点击平台"确定"后自动切题导致快捷键失焦的问题：快捷键运行时新增平台动作按钮点击、`.sentence-list .sentence-item.active` 变化、快捷键触发平台按钮和窗口重新聚焦后的多次焦点恢复；只做 blur + 隐藏焦点哨兵，不模拟点击页面空白处。
- 修复 标贝易采一检质检快捷键焦点恢复：快捷键运行时先匹配已配置动作，未命中时不拦截普通输入；命中后通过隐藏焦点哨兵退出输入框并执行动作，同时监听左侧句子点击后延迟恢复焦点。
- 标贝易采 "填入推荐文本"后增加立即、50ms、180ms 三次失焦兜底，避免 Element UI / Vue 在 input/change 后重新聚焦 textarea；仍不自动保存、提交或判定。
- 标贝易采 AI 推荐文本新增中文句末标点兜底：后端在对比结果和词表强替换后统一补全 `。！？；…`，前端展示和填入前也做旧后端兼容兜底；仍不自动保存或提交。
- 优化 标贝易采一检质检快捷键焦点行为：普通输入不拦截，只有命中已配置 标贝易采快捷键时才会自动 blur 当前输入焦点并执行动作。
- 标贝易采 "填入推荐文本"成功后自动退出"本句话文本"输入框并把焦点交回页面，便于继续使用快捷键；仍不自动保存、提交或判定。
- 新增 标贝易采一检质检自动每页条数设置：options 默认启用 `50条/页`，运行时在 `roundOneCollect` 详情页有限重试点击页面原生分页下拉，不自动提交任务。
- 新增 标贝易采一检质检快捷键配置，默认全部未设置，支持 AI 推荐、复制 AI 听音文本、复制推荐文本、填入、忽略、句子判定合格 / 不合格、任务判定通过 / 部分驳回 / 全部驳回。
- 标贝易采快捷键运行时只在详情页生效，普通输入不拦截，任务判定按钮 disabled 时不绕过平台限制；脚本总开关关闭时工具卡、自动分页和快捷键全部停止。
- 修复 标贝易采 闽南方言词表拼音批注误替换：括号内容、拉丁拼音、数字注音和残留连接符不再参与建议用字 / 对应华语解析；CSV 单字映射默认跳过强替换，避免把 `家庭` 误改成异常文本。
- 优化 标贝易采 AI 推荐速度定位：Qwen 原生 `fetch` 请求默认改为顶层 `enable_thinking=false`，不再使用 `extra_body`，并在供应商不支持该参数时自动移除字段重试一次；可通过 `DATABAKER_AI_ENABLE_THINKING=1` 开启 thinking。
- 新增 标贝易采 `DATABAKER_AI_PIPELINE_MODE=two_stage|listen_only`，默认保留听音 + 对比双模型，`listen_only` 极速模式只调用 `qwen3.5-omni-flash` 并结合本地词表强替换生成推荐文本。
- 标贝易采 AI 响应、推荐卡和调用日志补充流水线模式、听音耗时、对比耗时和总耗时，便于区分真实 Qwen 调用慢在听音阶段还是对比阶段。
- 补充 标贝易采 当前页 AI 推荐预生成方案：后续可由前端按钮触发当前页记录预生成、后端限制并发、前端按 `itemId` 内存缓存；默认不自动执行，避免成本失控。
- 修复 标贝易采 Qwen-Omni 听音请求格式：`requestListen` 改用 `input_audio`，按音频 URL pathname 后缀推断 `wav/mp3/aac/m4a/amr/3gp/3gpp`，并移除听音请求的 `response_format`，避免多模态请求触发 HTTP 400。
- 标贝易采 前端错误提示补充后端脱敏 `summary`，方便排查 provider 400，同时继续避免暴露完整音频 URL、token、cookie、`OSSAccessKeyId`、`Signature` 或 API Key。
- 标贝易采 options 设置页将 后端接口地址收敛为"服务器 / 本机"两个选项，旧的自定义地址会回退到默认服务器接口，员工默认走服务器，本机仅用于开发调试。
- 标贝易采 options 请求超时时间改为按秒展示，默认 `120` 秒，保存后仍写入毫秒字段 `aiRecommendRequestTimeoutMs` 供运行时使用。
- 标贝易采 AI 调用日志 CSV 新建时使用中文表头，JSONL 继续保留英文 key，便于人工查看和后续程序处理。
- 新增 标贝易采 闽南方言字词表 `platform-resources/data-baker/round-one-quality/ai/minnan-lexicon.csv`，后端 `ai-lexicon.js` 会解析 CSV 并为听音 / 对比 prompt 注入短上下文；词表只辅助字形判断，不强行替换文本。
- 增强 标贝易采 词表策略：默认 `DATABAKER_AI_LEXICON_REWRITE_MODE=aggressive`，对最终推荐文本做"对应华语 -> 建议用字"的强替换并记录替换明细；设置为 `off` 时仅保留 prompt 上下文。
- 标贝易采 AI 响应和调用日志新增阶段耗时：听音耗时、对比耗时和总耗时；日志同步记录词表启用状态、替换模式、替换数量和替换明细，便于区分 `mock=true` 本地耗时与 `mock=false` 真实 Qwen 调用耗时。
- 标贝易采 推荐卡新增词表替换提示，返回词表强替换时显示替换数量和最多 8 个替换项，复制和填入继续使用最终 `recommendedText`。
- options "标注脚本中心"新增 `标贝易采` 平台区域和 `标贝易采一检质检` 脚本卡片，支持在控制面板启停该脚本。
- 新增 标贝易采一检质检专属设置页，可配置 后端接口地址、请求超时时间和 AI 推荐开关；默认 endpoint 为 `https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`，本机 `127.0.0.1:3333` 仅用于开发调试。
- 标贝易采 content script 改为读取 `chrome.storage` 中的脚本启停、AI 推荐开关、endpoint 和 timeout；关闭脚本或关闭 AI 推荐后不显示推荐工具卡。
- 扩展前端仍不保存 API Key、access token、cookie 或完整音频 URL，标贝易采 模型密钥继续由后端通过 `config/env/ai.env` 读取。
- manifest 版本提升到 `0.2.8`。
- 新增统一 AI 环境配置文件 `config/env/ai.env` 自动加载能力，统一后端启动时会先加载仓库内 AI 环境配置，不再要求每次手动设置 `DASHSCOPE_API_KEY`。
- 新增 `config/env/ai.env.example`，覆盖 DashScope、历史额外 provider 示例、其他模型服务和 标贝易采 AI 推荐文本配置项。
- `.gitignore` 新增真实密钥文件忽略规则：`config/env/ai.env`、`config/env/ai.local.env`、`.env`、`.env.*`，保留模板文件可提交。
- 新增 标贝易采一检质检站点目录 `extension/sites/data-baker/round-one-quality/`，仅在 `datafactory.data-baker.com` 的 `roundOneCollect` 详情页注入"AI 推荐文本"工具卡。
- 标贝易采 前端新增 MAIN world 网络观察脚本，只在内存中缓存 `queryCollectStatementByCondtion` 当前页响应；ISOLATED world 根据 `.sentence-list .sentence-item.active`、右侧"本句话文本" textarea 和接口记录定位当前单条。
- 标贝易采 推荐结果卡支持展示页面候选文本、AI 听音文本、AI 推荐文本、变更标记、置信度、模型和复核提示，并提供"复制推荐文本""填入推荐文本""忽略"；填入必须由用户点击触发，不自动保存、提交、判定或流转。
- 统一后端新增 标贝易采 AI 推荐接口：
  - `GET /api/data-baker/round-one-quality/ai/recommend/health`
  - `POST /api/data-baker/round-one-quality/ai/recommend`
- 标贝易采 后端默认使用听音模型 `qwen3.5-omni-flash` 和对比模型 `qwen3.5-plus`，沿用原生 `fetch` 调 DashScope，支持 `DATABAKER_AI_MOCK=1` mock、费用估算和有效音频裁剪环境变量预留。
- `manifest.json` 新增 `https://datafactory.data-baker.com/*` 权限与 content script，扩展版本提升到 `0.2.7`；同步更新根 README、扩展 README、平台资源 README、统一后端 README 和 标贝易采 页面 / 网络资料。

## 2026-04-28

- 为 Alibaba LabelX ASR 快判新增"AI 半自动参考建议"第一版：新增 `judgement-ai-suggestion.js`，仅支持按钮/快捷键手动分析当前题卡，不自动分析全页，不自动保存/提交/领取/流转。
- 快判设置新增 AI 建议配置：`aiSuggestionEnabled`（默认 false）、`aiSuggestionEndpoint`、`aiSuggestionRequestTimeoutMs`、`aiSuggestionModel`（默认 `qwen3-omni-flash`）、`aiSuggestionAvailableModels`（预留 `qwen3.5-omni-plus`）；快捷键动作统一为 `shortcuts.aiSuggestCurrentItem`。
- 快判工具栏新增"AI 分析当前题"按钮；建议卡支持"采用建议/忽略"，采用建议统一调用 `selectJudgementChoice(choiceActionKey)`，不重写单选逻辑。
- AI 建议与雷题联动：命中雷题时显示"雷题优先"；若 AI 与雷题标准答案冲突，禁用"采用建议"。
- 快判后端新增 AI 路由与客户端：
  - `GET /api/alibaba-labelx/asr-judgement/ai/health`
  - `POST /api/alibaba-labelx/asr-judgement/ai/suggest`
  - 新增 `ai-routes.js`、`ai-client-qwen.js`、`ai-prompt.js`、`ai-response-schema.js`。
- AI 后端默认真实调用 DashScope Qwen（`stream=true`），默认模型 `qwen3-omni-flash`；仅 `ASR_JUDGEMENT_AI_MOCK=1` 才走 mock；未配置 `DASHSCOPE_API_KEY` 时 health 返回 `missing-api-key`，suggest 返回清晰错误且服务不崩溃。
- 新增 AI 规则资料：`platform-resources/alibaba-labelx/asr-judgement/ai/rules.ai.md`、`prompt-template.md`、`fewshot-examples.json`；并在相关 README 同步文档说明。已明确取消历史额外 provider 接入，不新增额外 client。
- 安全约束补充：不在日志/存储/DOM 持久化完整 `audioUrl`，后端日志仅记录 requestId、hostname、itemIndex、model。

- 修正 AI prompt 输入最小化：`ai-prompt.js` 仅向模型文本 prompt 提供 `asrText1/asrText2`，不再包含 `projectId/subTaskId/itemId/itemIndex`，`audioUrl` 仅作为模型音频输入字段。
- 修正模型校验链路：请求显式传入非法 `model` 时 `suggest` 返回 `HTTP 400` + `code=invalid-model`；未传 `model` 时才使用 `ASR_JUDGEMENT_AI_MODEL` 或默认 `qwen3-omni-flash`。
- 清理冗余配置字段：移除旧快捷键独立字段，统一使用 `shortcuts.aiSuggestCurrentItem` 并兼容迁移旧配置。
- 提升扩展版本到 `0.2.6`，并同步更新相关 README 与验证说明。

## 2026-04-27

- 补充服务器扩展压缩包下载目录说明：记录 Nginx `autoindex` 配置、`/downloads/` 访问地址、`dist/` 目录约定和验证命令，便于用户选择不同版本 zip 下载。
- 补充根目录 README 和扩展源码 README 的扩展压缩包生成命令，明确压缩包根级必须直接包含 `manifest.json`；同步补强 `.gitignore` 对旧 `edge-extension/dist/` 的忽略规则。
- 将扩展源码从 `edge-extension/extension/` 迁移到仓库根目录 `extension/`，将历史文档迁移到 `docs/`，将旧参考脚本迁移到 `legacy-reference/`；新增根目录 README 的本地加载、打包和服务器部署说明，并新增 `.gitignore` 忽略 `dist/` 等构建产物。
- 将扩展定位调整为 Chrome / Chromium MV3 单源码形态：Chrome 和 Edge 都加载同一个 `extension/` 目录，不再规划复制一套业务运行时代码；同步更新维护说明、本地加载说明和扩展源码目录 README。
- 为快判新增当前音频前进 / 后退快捷键动作，默认 `ArrowLeft` 后退、`ArrowRight` 前进，前进 / 后退步长默认 `0.5` 秒并可在 options 中配置。
- 调整快判倍速与音量语义：options 只保存默认倍速和默认音量；快捷键只临时调整当前音频，重置倍速 / 重置音量恢复到面板默认值，不再扩散到其他题卡音频。
- 将快判倍速步进改为 `0.1/0.25/0.5/1` 四档选择，移除 options 中"当前倍速"字段。
- 顶部主导航状态合并显示总时长、当前默认每页条数、默认倍速和默认音量；`.mark-toolbox` 工具栏移除每页状态并新增当前音频前进 / 后退按钮。
- manifest 版本提升到 `0.2.4`，同步更新快判 README 与 `AGENTS.md` 中的音频模块职责和验证步骤。
- 将快判前进 / 后退步长也改为 `0.1/0.25/0.5/1` 四档选择，旧的非四档配置会回退到 `0.5` 秒；manifest 版本提升到 `0.2.5`。
- 新增根目录 `PRIVACY_POLICY.md`，用于 Edge 扩展上架时说明扩展处理的设置、LabelX 任务统计数据、上传接口和用户控制方式。

## 2026-04-25

- 为 Alibaba LabelX ASR 快判新增总时长统计：读取 `/api/v1/label/center/subTask/{subTaskId}/data`，汇总 `data.dataList[].data.duration`。
- 为快判新增默认每页条数设置，默认值为 `all`，尝试将详情页 data 请求改写为 `pageSize=400`。
- 新增快判 MAIN world 网络捕获与请求改写，支持同标签页刷新时读取缓存配置。
- 将总时长显示位置调整到页面顶部主导航区域，快判工具栏中保留每页状态。
- 将音频运行时拆分为 `audio-volume-controller.js`、`audio-rate-controller.js`、`audio-playback-controller.js`，`audio-controller.js` 只保留编排、扫描和动作路由。
- 将分页和总时长逻辑拆分为 `judgement-page-size.js` 和 `judgement-duration-summary.js`。
- 将 MAIN world 网络逻辑拆分为 `network-protocol.js`、`network-config.js`、`network-url-rewriter.js`、`network-summary.js` 和 `network-observer.js`。
- 将 `content.js` 中的判别动作、快捷键、提示和工具栏拆分为 `judgement-actions.js`、`judgement-shortcuts.js`、`judgement-toast.js` 和 `judgement-toolbar.js`。
- 更新快判 README，记录当前运行时模块边界和验证步骤。
- 将项目维护说明统一迁移到仓库根目录 `AGENTS.md`，并新增根目录 `log.md` 作为长期修改日志。
- 统一调整项目 README：重写 `edge-extension/README.md`，更新 `alibaba-labelx/README.md`、快判 README、快判页面结构 README 和网络采集 README，使文档匹配当前 `asr-judgement` 模块拆分后的实际结构。
- 在 `AGENTS.md` 中新增 Git 提交要求：每次完成修改并验证后提交，提交前检查暂存范围，默认不主动推送。
- 将快判"默认每页条数"从默认 `400` 调整为默认 `100 条/页`，设置页提供 `100/150/200/400 条/页` 自定义档位，历史 `all/全部` 配置兼容为 `400 条/页`。
- 新增快判页数负载测试文档，用于在 DevTools Console 对比不同 `pageSize` 的接口耗时、响应大小和页面 DOM 压力。
- 为快判新增实验性"窗口化显示"开关，开启后按当前题号只展开前后 5 题，并折叠窗口外题卡以降低 400 条页面的渲染压力。
- 调整快判窗口化隐藏方式：窗口外题卡高度改为 2px，并通过 LabelX inline CSS 变量隐藏内容区和回答区，恢复时还原原始变量。
- 因窗口化显示在 LabelX 页面未能稳定生效，暂时从 options 前端移除开关，并在运行时强制关闭；代码保留为未完成能力等待后续继续验证。
- 在快判 README 中补充脚本能力路线：优先提效脚本，其次半自动人工，最后全自动；新增 ASR 文本差异高亮、差异摘要、差异导航等后续提效功能池。
- 为快判新增 ASR 文本对齐差异视图，按字符级编辑距离生成高亮对齐文本和差异摘要。
- 为快判新增"选择后自动下一题"设置，选择 `1~5` 或点击快判工具栏判别按钮后可自动跳到当前页下一题。
- 为快判 ASR 对齐差异视图新增 options 开关，默认开启，关闭后恢复 LabelX 原始文本展示。
- 修复转写 content 读取运行时契约时只访问 `window` 的兼容问题，改为优先读取 `globalThis`，减少 Edge MV3 隔离环境下的 `Runtime contract is not loaded` 误报。
- 修复快判进入新详情页可能误选选项的防护：快捷键只响应真实用户事件，判别写入不再在无法定位当前题卡时默认回退到第一页第一题。
- 修复快判网络改写导致翻页数据错位：原生 `1~50 条/页` 不再走网络改写；自定义档位只覆盖 `pageSize`，不再把所有分页请求强制改成 `page=1`。
- 暂停快判 `100/150/200/400 条/页` 自定义大页数入口，options 只保留 LabelX 原生 `1~50 条/页`，历史大页数配置自动回退为 `50 条/页`，并记录到未完成能力。
- 为快判新增轻量题卡摘要：当 LabelX 样式设置隐藏内容区和回答区时，在每个题卡根节点展示 `asr_text1`、`asr_text2` 和"哪个ASR更优"的当前选择状态。
- 为快判轻量题卡摘要新增 options 开关，默认开启；摘要块改为由开关控制显示，不再要求先隐藏 LabelX 内容区和回答区。
- 调整快判默认音量快捷键：增大音量为 `[`，减小音量为 `]`，重置音量为 `\`，并通过 schema 迁移补齐旧配置中的空快捷键。
- 修复快判轻量题卡摘要在 LabelX 横向题卡布局中不可见的问题：摘要题卡根节点强制占满整行，并增加从 ASR 差异视图 `data-asr-edge-signature` 回退读取文本。
- 再次调整快判轻量题卡摘要挂载点：摘要改为插入到 `.labelRender-scrollable` 下对应原题卡前方，避免原题卡在隐藏内容区 / 回答区后被压缩或裁剪导致摘要不可见。
- 修复快判轻量题卡摘要在 LabelX 持续 DOM 更新时不生成的问题：启动时立即扫描题卡，后续 MutationObserver 改为节流扫描，避免防抖计时器被连续变动长期重置。
- 同步修复快判 ASR 对齐差异视图的扫描时机：启动时立即处理现有题卡，后续 DOM 变动改为节流扫描，避免刷新页面后差异视图迟迟不生成。
- 增强快判轻量题卡摘要：在"哪个ASR更优"当前选择下方显示音频时间比，并在 ASR 对齐差异视图开启时同步用差异高亮版本展示摘要内两条 ASR 文本。
- 修复快判轻量题卡摘要宽度：摘要外层保持整行避免与原题卡并排，内部可视卡片按对应 `.labelRender-item` 实际宽度缩放，适配 LabelX 卡片大小 / 列数变化。
- 为快判 ASR 对齐差异视图新增颜色设置：options 可分别配置替换 / 不同字、缺字 / 多字、标点 / 空格的高亮背景色，普通差异视图和轻量题卡摘要共用该配置。
- 优化快判 ASR 文本对齐算法：降低标点和空格插入 / 删除权重，减少标点差异导致中文主体错位的问题。
- 修正快判轻量题卡摘要挂载方式：摘要改为插入 `.labelRender-item` 根节点内部顶部，并清理旧版外部摘要块，恢复 LabelX 原生多列 / flex 排版。
- 优化快判轻量题卡摘要展示：ASR 文本改为自动换行完整显示，五种判别结果使用不同颜色，差异摘要移动到标题下方以对齐右侧音频时间。
- 新增快判统计上传框架：创建 `asr-judgement-server.js`，按 CSV 样例生成分包级补丁记录，支持进入子任务后上传、工具栏手动上传、10:00 / 16:00 定时上传和远程时间配置 URL 预留。
- 调整快判统计上传入口：上传按钮移到 options 快判设置面板，取消进入子任务详情自动上传；上传地址改为服务器 / 本机两个选项，默认服务器 `47.108.254.138:3333`，并让 `asr-judgement-server.js` 可直接启动本地接收服务。
- 拆分快判统计本地服务：`asr-judgement-server.js` 回归扩展侧上传运行时，新增 `backend/server.js` 作为 Node 启动入口，并按 HTTP、CSV 列、CSV 写入、文件存储和分包合并拆成小文件。
- 调整快判统计上传到 LabelX 标注首页：在 `labelingTask?projectId=...` 页面显示"上传统计"按钮，使用首页 `tasks`、`subTasks` 和 `/subTask/{subTaskId}/data` 批量采集后上传，options 不再提供手动上传按钮和单独的定时时间输入框。
- 快判统计定时配置改为从"上传接口地址"追加 `purpose=schedule` 获取，本地 `backend` 服务支持批量 `payloads` 合并，并新增定时配置响应。
- 优化快判统计上传首页采集：通过 DevTools 确认审核首页 `/checkTask` 使用 `type=check` / `subTaskType=check`，上传按钮改为挂载在顶部头像旁，首页点击时同时采集标注和审核两类分包；补充头像 hover 用户名结构、审核首页结构和网络采集文档。
- 为快判统计上传新增 ASR 更优判断任务过滤：优先按 `labelModel=vote` 识别，结合 `taskName` 和 `size=400` 兜底，自动跳过 `labelModel=single`、`size=50` 或 `中文普通话asr任务` 的历史转写数据。
- 优化快判统计上传数据规模处理：时长秒数统一保留 4 位小数，详情页上传和定时上传改为按 `projectId` 采集全账号数据；本地统计服务默认只落合并 CSV，不再写 `statistics-rows.json` 和上传事件日志，并将批量合并改为一次读写。
- 修正快判详情页统计上传：移除当前 `subTaskId` 单条上传回退，详情页、首页和定时上传统一走 `projectId` 项目级批量采集，保证同一账号同一项目上传行数一致。
- 新增根目录 `platform-resources/` 平台资源库，迁移 Alibaba LabelX 快判的页面结构、网络采集、统计格式、未完成事项和本地调试后端；后续跨 Edge / Chrome 共用的资料与工具统一写入该目录。
- 移除快判扩展目录中的旧 `page-structure/` 内容；将快判统计本地 Node 服务迁移到 `platform-resources/alibaba-labelx/asr-judgement/backend/`，并更新启动路径和统计输出目录。
- 新增 `platform-resources/backend/` 统一 Node 后端入口和路由注册结构，快判项目后端改为通过 `index.js` 注册 API；新增统计 CSV 下载接口 `/api/alibaba-labelx/asr-judgement/statistics/download`。
- 将快判统计服务器上传地址改为域名 `https://script.xiangtianzhen.store/api/alibaba-labelx/asr-judgement/statistics/upload`，扩展 manifest 版本提升到 `0.2.1` 并新增域名 host permission；移除 CSV 下载旧接口 `/api/asr-judgement/statistics/download`。
- 合并快判统计资料目录：删除仅含 README 的 `platform-resources/alibaba-labelx/asr-judgement/statistics/`，统计宽表字段、上传规则和服务端合并契约统一维护到 `backend/README.md`。
- 恢复快判默认每页条数中的 `400 条/页` 入口：options 只新增 400 档位，运行时将 400 识别为自定义全量请求并改写详情页 `data` 请求，`100/150/200 条/页` 继续不开放并回退到 `50 条/页`。
- 新增快判"雷题判断"能力：manifest 版本提升到 `0.2.2`，打包本地 `thunder-question-bank.csv` 雷题库，options 默认开启开关；命中雷题时在轻量题卡摘要和回答区"特殊情况标注"显示标准答案，当前选择与标准答案不一致时显示红色严重提示和错误 toast。
- 增强快判统计上传失败诊断：非 2xx 响应会显示状态码、目标上传地址和响应摘要；浏览器权限、CORS、证书或网络拦截导致请求未发出时会显示更明确的错误来源。
- 修正转写脚本在 LabelX 非转写页面的契约缺失告警：manifest 版本提升到 `0.2.3`，`content.js` 改为等待 `runtime-contract.js` 注入后再启动，超时仍缺失时以 info 级日志跳过，避免在快判首页出现 `Runtime contract is not loaded` 扩展错误。
## 2026-05-08

- ASR 转写网络请求文档补录：新增 `platform-resources/alibaba-labelx/asr-transcription/network.md`，基于真实 DevTools 采集沉淀首页与详情页接口结构（脱敏）。
- 明确转写取数关键约束：详情接口 `subTask/{id}/data` 使用 `pageSize=10`；`subTaskId` 需先 `decode + 去空白` 后再拼接请求。
- 明确任务识别边界：`labelModel=vote` / "ASR更优结果判断"类任务排除，`labelModel=single` / `size=50` / "中文普通话asr任务"类任务采集。
- 同步更新 `platform-resources/alibaba-labelx/asr-transcription/README.md` 与 `platform-resources/alibaba-labelx/README.md`，将转写网络文档从占位说明升级为可执行口径文档。

- 新增 Magic Data ANNOTATOR 平台前置采集文档目录：`platform-resources/magic-data/annotator/`。
- 新增并维护文档：`README.md`、`page-structure.md`、`network.md`、`safety-boundary.md`、`development-plan.md`。
- 本轮采集页面范围：首页、标注任务页、标注任务详情页、标注单条页、审核任务页、审核任务详情页、审核单条页。
- 已通过 `chrome_devtools` 完成真实页面只读采集，记录请求摘要并脱敏处理。
- 明确敏感动作边界：领取、开始（会改状态）、保存、提交、审核通过、审核驳回、退回、批量流转等均禁止自动触发。
- 本轮未修改扩展运行时代码；未修改 `extension/manifest.json`；未修改 `extension/options/`；未修改 `extension/popup/`。
- 按 `platform-resources/alibaba-labelx/asr-judgement` 目录方式重构 Magic Data 文档：新增 `platform-resources/magic-data/annotator/page-structure/` 与 `network/` 子目录。
- `page-structure.md` 与 `network.md` 改为兼容索引入口，详细内容拆分到子目录多文件。
- 补全 `network.md` 缺失项：新增欢迎页、标注链路、审核链路、音频脱敏、敏感写操作清单与待补采项。

## 2026-05-09

- 补充 Alibaba LabelX 平台公共资料：新增 `platform-resources/alibaba-labelx/network.md`，将转写和快判共用的 `data/summary/board/getLabelTaskInfo/tasks/subTasks/tasks/process/save/commit/fetch/audio` 接口沉淀为公共网络口径。
- 新增 `platform-resources/alibaba-labelx/page-structure.md`，记录通用顶部导航、标注/审核首页、详情页 `.mark-toolbox`、`.labelRender-item`、音频控件和高风险按钮边界。
- 新增 `platform-resources/alibaba-labelx/asr-transcription/page-structure.md`，记录 ASR 转写审核首页和 `missionType=check` 详情页 HTML/DOM 结构、音频结构、有效性切换、文本编辑和提交任务行为。
- 更新 `platform-resources/alibaba-labelx/asr-transcription/network.md`，补充审核首页 `type=check/subTaskType=check`、审核详情页字段、自动保存、`mistake`、`subTask/{id}/data` 保存、`commit` 和 `check/fetch` 链路。
- 明确当前真实接口未发现 `supplier/vendor/company/provider/供应商` 字段；后续供应商统计只能按 `payload` 显式字段、`csvPatch["供应商"]` 或 `taskName/name` 前缀推断，当前样例包括 `棋燊` 和历史样例 `希尔贝壳`。
- 追加采集 LabelX ASR 转写审核详情页：确认 `提交并结束` 复用 `subTask/{subTaskId}/commit`，但不会触发 `check/fetch` 自动领取，会直接返回审核首页。
- 补充详情页分页、每页条数和筛选契约：第 2/3 页会重拉 `data/summary/board`；原生每页条数可见 `1/2/3/4/5/10/20/30/40/50 条/页`；回答区选择题筛选写入 `filter.questions[].title/value`。
- 补采 Alibaba LabelX ASR 转写标注详情页：确认 `missionType=label` 普通提交触发 `POST /api/v1/label/center/subTask/{subTaskId}/commit`，自动领取开启时继续触发 `POST /api/v1/label/center/{taskId}/label/fetch`。
- 验证转写标注详情页 `50 条/页`：页面一次渲染 50 个音频题卡，快速批量写入 10 个 textarea 只产生 1 条 `dataList` 保存，后续全页一键填充不能依赖批量 DOM 写入后统一失焦。
- 补充转写标注保存契约：文本编辑自动保存仍走 `POST /api/v1/label/center/subTask/{subTaskId}/data`，保存体顶层为 `dataList` 和 `timestamp`，音频 URL 字段必须持续脱敏。
- 本轮只更新平台资料 Markdown 和日志，未修改扩展运行时代码、manifest、后端代码或运行数据。
- 补采 Alibaba LabelX ASR 转写审核详情页驳回链路：顶部 `驳 回` 打开 `驳回至上个环节` 弹窗，提交后触发 `POST /api/v1/label/center/subTask/{subTaskId}/reject`，请求体字段为 `subTaskId/rejectReason/type/userIdList`，成功后返回审核首页。
- 补采转写详情页筛选面板：记录 dropdown / filter 面板 class、内容区关键词 `filter.content`、`questionsQueryConditions=OR` 和 `dataStatus=UNFINISHED`。
- 尝试高速全页填充保存方案：在 `驳回中` 审核详情页直接 POST 3 条 `dataList[]` 和最小字段保存均返回业务 `code=400`，页面自身单条自动保存也返回 `code=400`；确认该状态页面不能验证保存成功型批量写入，需要后续在正常可编辑详情页复测。

- 升级扩展版本到 `0.2.11`，新增 Alibaba LabelX 转写/快判统计"按供应商分表"能力，新增扩展侧 `extension/shared/statistics-supplier.js` 和后端侧 `platform-resources/alibaba-labelx/supplier-utils.js` 统一供应商识别工具。
- 转写与快判统计 CSV 新增 `供应商` 列，上传 payload 新增 `supplier` 对象、`mergeKey.supplierKey/supplierName`，并将幂等合并键升级为 `供应商 + 分包ID`，避免跨供应商同分包冲突覆盖。
- 两套后端统计服务均改为仅写入 `statistics-data/suppliers/<供应商>/statistics-merged.csv`；不再维护根级 `statistics-data/statistics-merged.csv`，但继续兼容读取历史根级 CSV 作为迁移输入，不删除旧文件。
- 新增并统一下载契约：`/statistics/download` 必须带 `supplier` 参数；未传返回 `400` 且提示 `suppliers` 列表接口。新增 `.../statistics/suppliers` 用于列出可下载供应商与下载链接。
- 更新统一后端启动日志和 health 返回口径，显式提供 `suppliersPath`、`downloadRequiresSupplier`、`suppliersDir`，并将旧 `csvPath` 标记为 deprecated 空值。
- 同步更新协作与文档规则：新增 Chrome DevTools / MCP 优先采集、Playwright Edge 仅用于真实操作验证或兜底、用户回复"处理好了"后再继续采集测试，以及 LabelX 公共资料与转写专项资料目录沉淀要求。

## 2026-05-10（0.2.11 小修正：统计 CSV 中文乱码与健康值覆盖）

- 修复 LabelX 转写/快判统计链路中的中文替换字符 `�` 问题，重点覆盖 `任务名称`、`标注员/审核员`、`供应商`。
- 新增/统一文本质量规则：识别 `U+FFFD` 为损坏文本，合并时"新健康值优先覆盖旧损坏值"。
- 供应商解析增强：`供应商=未识别供应商/unknown-supplier/含�` 时回退任务名推断，不再保留损坏供应商值。
- CSV writer 统一改为 UTF-8 with BOM 写入，兼容 Excel 直接打开中文显示。
- CSV/file-store/payload-merge 三层同步收敛清洗规则，避免旧损坏值持续污染新导出。
- 主存储口径保持根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。
- 转写/快判前端 payload 构造增加健康文本优先选择，降低源头携带损坏值概率。

## 2026-05-10（0.2.11 小修正：导出完整性校验 + 断点跳过 + 定时延迟）

- 新增转写/快判 existing 检查接口：导出前按分包ID批量判断是否已完整，完整数据跳过详情拉取。
- 分包ID为空的数据直接废弃，不写 CSV、不上传，并计入失败/废弃统计。
- 后端合并结果新增失败列表（failedCount/failures），不中断整批处理，便于前端二次重试。
- 前端上传流程新增 skippedComplete/discardedNoBatch/failedPayloadValidation 汇总与失败提示。
- 结束时若失败数 > 0，统一提示"有数据导出失败，请再次点击导出"。
- 动态并发上限由 500 调整为 999：`Math.floor(total/5)`，最小1、最大999。
- 定时上传改为 10:00/16:00；新增 schedule 上传前随机延迟 0~300 秒（100ms 步进）；手动上传不延迟。
- 主存储继续根级 `statistics-data/statistics-merged.csv`，不主动创建 `statistics-data/suppliers/`。
- CSV 继续 UTF-8 with BOM、单供应商不出"供应商"列、多供应商末列追加"供应商"。

## 2026-05-10（修正统计失败判断并保留部分成功数据）

- 修正转写/快判前端 payload 校验口径：仅 `分包ID` 缺失才拒绝上传；其余关键字段空值改为 warning/incomplete，不再计入 failed。
- 修正转写/快判进度汇总：`failed` 仅统计真正失败（详情请求异常、校验拒绝、上传失败等），`discardedNoBatchId` 与 `warningPayloadCount` 单独展示。
- 修正转写/快判最终提示：仅 `failed > 0` 才提示"有数据导出失败，请再次点击导出"；仅 warning 时提示"部分字段待后续角色补齐"。
- 修正后端 existing complete 判定：转写按 `label=标注子任务ID`、`audit=审核子任务ID`；快判按 `label=任一标注员子任务ID`、`audit=审核子任务ID`，不再要求另一角色字段完整。
- 修正后端批量上传返回结构：新增 `acceptedCount/rejectedCount/rejectedItems`，保留 `failedCount/failures` 兼容字段，确保"部分失败不影响成功写入"。
- 保持主存储为根级 `statistics-data/statistics-merged.csv`，不主动创建 `statistics-data/suppliers/`。
- 保持并发规则 `Math.floor(total/5)`（最小 1，最大 999）、定时上传 `10:00/16:00`、定时随机延迟 `0~300s`（100ms 步进）。

## 2026-05-10（修正统计跳过完整判断和进度宽度）

- 修正 `existing complete` 判定过宽问题：`exists=true` 不再直接跳过，转写/快判都改为"基础字段 + 当前 role 子任务ID"最低完整条件。
- 转写/快判均支持：任务名称空值判 `complete=false`（待补），而非失败；下一次导出会继续拉详情补齐。
- 修正前端跳过逻辑：仅 `complete=true` 计入 `skippedComplete`；`exists=true && complete=false` 继续拉详情并可上传补齐。
- 修正无意义上传：当 `payloads.length===0` 时不调用上传接口，显示"已全部完整，无需上传"，不再出现"上传 1"占位行为。
- 进度面板样式优化：宽度提升到 `min-width:560px / max-width:780px`，文本允许换行，四位数成功/失败计数可见。
- 保持主存储口径：根级 `statistics-data/statistics-merged.csv`，不主动生成 `statistics-data/suppliers/`。
- 版本保持 `0.2.11`，并发规则保持 `Math.floor(total/5)`（最小1、最大999）。

## 2026-05-11（0.3.0 测试修复：options 隐藏入口联动）

- 修复 options 首页"后端接口地址"隐藏入口状态分裂问题，统一为单一解锁状态：连续点击"后端接口地址"标题 10 次后，同时显示"服务器/本机"切换按钮与"项目数据下载"面板。
- 未解锁前统一隐藏后端切换与项目数据下载，并移除所有"连续点击 10 次"提示文案。
- 未解锁前 `home-endpoint-status` 不再显示"当前已选择：服务器（script.xiangtianzhen.store）..."文案；仅在解锁后显示当前后端选择状态。
- 点击绑定仍只挂在"后端接口地址"标题节点，不绑定整个卡片；鼠标样式保持默认（非 pointer）。
- 页面刷新后解锁状态不持久化，符合"每次进入 options 重新隐藏"的测试口径。
- 0.3.0 测试版 service worker 路径修复：`extension/background/service-worker.js` 的 `importScripts` 改为 `chrome.runtime.getURL("shared/constants.js")` 与 `chrome.runtime.getURL("shared/storage.js")`，避免被解析为错误的 `background/shared/*` 路径。
- 修复后 service worker 将从扩展根目录加载共享模块，解决 `Failed to execute 'importScripts' ... background/shared/constants.js failed to load` 与注册失败 `Status code: 15` 问题。
- 0.3.0 测试修复：标贝易采导出 CSV 与原始记录分离。前端导出与上传的 `csvText` 不再包含"原始JSON"列；原始记录改为脱敏 `rawRecords` 独立上传。
- 标贝易采后端导出存储新增 `latest-raw.json`，`latest.csv` 只保存 CSV，`latest.json` 继续保存 meta；开启 history 时同步写入 `*.raw.json`。
- 标贝易采导出上传路由增强：兼容 `rawRecords/rawJson`，新增原始记录大小限制，health/config 返回 `latestRawJsonPath`。
- 项目数据下载 CSV 清洗增强：`sanitizeParsedCsv` 强制剔除"原始JSON"列，避免历史 CSV 泄露原始记录。
- 项目数据下载供应商链路增强：下载 token 读取增加尾部中文标点容错；供应商错误返回补充 dataset/supplier/suppliers；下载链路新增安全调试摘要（仅 requestId/jti/dataset/supplier/计数，不记录完整 token）。

## 2026-05-11（协作规则更新：任务暗号与默认分支策略）

- `AGENTS.md` 新增"任务暗号规则"章节，明确 `ASC_READONLY`、`ASC_NEW_BRANCH`、`ASC_CONTINUE_BRANCH`、`ASC_MAIN_HOTFIX`、`ASC_RELEASE_MERGE`、`ASC_ABORT_IF_DIRTY` 的执行约束。
- 明确 Codex 无法读取网页端历史对话，每次执行 Prompt 必须携带任务暗号，并按暗号执行 Git 策略。
- 调整单人项目分支口径：保留"小修/当前版本 BUG/单模块可直接 main"，同时明确"新对话新需求通常走新分支、同对话追问通常继续当前分支、用户明确要求直改 main 时从用户指令"。
- 并行规则补充：谁先完成并通过验收，谁先进入 `ASC_RELEASE_MERGE`；发布合并阶段才执行 patch 提升、CRX 三件套生成与 tag。

## 2026-05-11（协作规则修正：任务暗号优先于 main 旧默认）

- 修正 `AGENTS.md` 中"默认直接在 main 分支完成执行类任务"的旧口径，改为"执行类任务默认按任务暗号决定 Git 策略"。
- 补充无暗号兜底：新功能、并行功能、跨模块改动默认独立分支；小修、当前版本 BUG、单模块任务、文档收尾可直接 main。
- 修正旧分支口径：不再要求"当前不在 main 就切回 main"；改为"分支与任务暗号/目标分支不符时停止并报告，不得擅自切换"。
- 明确 `ASC_CONTINUE_BRANCH` 必须留在目标功能分支执行，`ASC_RELEASE_MERGE` 才允许回 main 做发布合并。

## 2026-05-11（协作规则补充段冲突清理）

- 清理 `AGENTS.md` 在"2026-05 稳定协作规则补充"中的旧口径：不再写"执行类任务默认验证通过后直接 push 到 main""默认不创建分支，不创建 PR"。
- 统一改为按任务暗号与目标分支执行 commit/push：新功能/新需求/并行/跨模块默认独立分支，小修与文档收尾可按 `ASC_MAIN_HOTFIX` 直改 `main`。
- 保留并强调只读审计不得改动和提交、验证失败不得 commit/push、PR 仅在用户明确要求时创建。

## 2026-05-17（Abaka AI Task21 快捷键增强：暂存与送审）

- Abaka AI Task21 新增快捷键：`6` 暂存、`7` 送审；并同步到默认设置、storage 归一化与 options 配置页。
- 两个动作都只点击页面真实按钮（`暂存/Save/Stash`、`送审/Submit/Submit Review`），不直接调用平台 API。
- `7` 送审快捷键新增安全限制：疑似标注内审环境下阻止执行；`viewMode=true` 查看页不执行。
- `7` 不自动确认二次弹窗；若出现确认弹窗必须用户手动确认。
- 保持原有 Task21 same_font 与派生字段快捷键（1~5）逻辑不变。
- 未修改后端、未提升 `manifest` 版本、未生成 CRX/ZIP/update.xml/crx-latest.json 等发布产物。
- 2026-05-20
  - DataBaker 通用 AI 能力开始迁移到统一后端基座 `platform-resources/backend/ai/`。
  - 新增统一目录：
    - `platform-resources/backend/ai/config.js`
    - `platform-resources/backend/ai/errors.js`
    - `platform-resources/backend/ai/sanitizer.js`
    - `platform-resources/backend/ai/provider-queue.js`
    - `platform-resources/backend/ai/result-cache.js`
    - `platform-resources/backend/ai/usage.js`
    - `platform-resources/backend/ai/providers/qwen-openai-compatible.js`
    - `platform-resources/backend/ai/providers/funasr-python.js`
    - `platform-resources/backend/ai/python/funasr_client.py`
    - `platform-resources/backend/ai/python/requirements.txt`
  - DataBaker 目录中的 `ai-client-qwen.js`、`ai-client-funasr.js`、`ai-provider-queue.js`、`ai-result-cache.js` 改为 deprecated 薄封装，只 re-export 统一基座模块。
  - 统一后端启动入口保持不变：`node platform-resources/backend/server.js`。
  - Python 仍不作为独立服务启动，只作为统一 Node 后端内部辅助进程调用。
  - DataBaker `fun-asr` 繁体字热修：
    - `platform-resources/backend/ai/python/funasr_client.py` 新增 OpenCC `t2s` 繁转简；OpenCC 不可用时退回内置映射。
    - `platform-resources/backend/ai/python/requirements.txt` 新增 `opencc-python-reimplemented`。
    - DataBaker `ai-service.js` 强化普通繁体到简体的短语级和字符级兜底映射，并继续保护 `阮 / 汝 / 伊 / 诶` 等闽南词表建议用字。
    - `heardText` 在 Python 返回前先繁转简，Node 侧在 compare 前和最终响应组装时再做一次词表保护兜底。
    - `recommendedText` 与 `omni_single` 输出都统一做简体收口。
    - `RULE_VERSION` 升级为 `data-baker-round-one-quality-ai-v7-simplified-funasr`，部署后需要重启统一 Node 后端，避免旧内存缓存继续命中繁体结果。
  - DataBaker "AI连续填入合格项并发数量"热修：
    - 前端默认值改为 `20`。
    - 前端设置范围改为 `1~50`。
    - 非法值或空值回落 `20`，小于 `1` 归一到 `1`，大于 `50` 归一到 `50`。
    - 运行时 `maxConcurrency` 上限同步放宽到 `50`，但填入阶段仍保持顺序消费。
    - 后端 provider queue 与 RPM 限流保持不变，前端并发提高只会让更多请求进入统一后端排队。
## 2026-05-21 LabelX 统计上传 force replace

- 覆盖范围：Alibaba LabelX ASR 快判统计上传、Alibaba LabelX ASR 转写统计上传。
- 保留原有逻辑：手动上传默认先查 existing，`complete=true` 的完整分包默认跳过。
- 新增首页手动补充模式：若本轮 `skippedCompleteCount > 0`，前端显示"取消跳过上传数据"按钮，60 秒内可点击。
- 按钮触发后使用 `home-manual-force-replace`，重新拉取本轮范围内全部详情，不再跳过完整数据。
- 后端按 `replaceBatchIds` 删除旧 CSV 行，再写入本次 payloads；普通上传与定时上传不受影响。
- 详情页第一版不默认支持 force replace，避免只拿到单角色时误删整行另一角色字段。
- 运行数据目录 `statistics-data/`、`export-data/`、`audit-data/` 仍不提交 Git。

## 2026-05-21 CSV 字段命名口径热修

- 修复 LabelX 快判导出字段：`有效时长(秒)_S`、`标注员1_P`、`标注员2_P`、`标注员3_P`、`审核员_P`。
- 修复 LabelX 转写导出字段：`有效时长(秒)_S`、`标注员_P`、`审核员_P`。
- 修复 DataBaker 导出字段：`质检人_P`、`有效合格时长_S`。
- 旧字段兼容迁移：`有效时长` / `有效时长(秒)` / `有效合格时长` 与旧人员列在下一次合并写出 CSV 时迁移到新字段，不输出重复列。

## 2026-05-21（标贝易采一检质检热修：修复批量 tasks 作用域错误）

- 修复 DataBaker `AI并发分析并连续填入合格项` 点击后出现 `tasks is not defined` 的前端运行时错误。
- 根因是 `content.js` 的批量悬浮窗摘要函数在 `tasks` 块级作用域外直接读取 `tasks.length`。
- 现已改为基于 `plannedSendCount / totalCount` 构建摘要，不再跨作用域引用 `tasks`。
- 额外补充：`createItemsFromQualifiedRecords(...)` 生成空任务时会给出明确提示，不再继续进入空批量流程。
- 扩展重载后需刷新 DataBaker 页面，否则旧 content script 仍可能保留。

## 2026-05-21 - fix(data-baker): add batch request dedupe tracing

- 修复 DataBaker 批量连续填入缺少批次追踪的问题：每次批量运行生成 `batchRunId`，每条请求附带 `batchItemIndex`、`batchProcessKey`、`clientRequestId`。
- 前端同批次先按 `processKey` 去重，重复任务不再发送；悬浮窗增加唯一任务数、重复跳过数、批次ID、已发起请求和活跃请求统计。
- 页面级全局锁防止旧 content script、多 runtime 或双击按钮重复启动第二批。
- 后端新增内存级 in-flight dedupe：同一 `batchRunId + batchProcessKey` 的请求会 join 同一 promise，避免重复打上游模型。

## 2026-05-21（Task21 助手：恢复列表页统计/导出按钮入口）

- 修复 Abaka AI Task21 `/task-v2/data-item` 列表页顶部右侧统计入口不可见问题。
- `content.js` 新增 `isTask21DataItemListPage()`，识别 `abao.fortidyndns.com` 下带 `taskId` 且 `vm=all/batch` 的 `/task-v2/data-item` 页面。
- 新增顶部右侧按钮挂载逻辑，优先插入：
  - `.app-content-header-right .action-buttons.is-global`
  - `.app-content-header-right .search-actions.is-global`
  - `.app-content-header-right`
  - 顶部容器缺失时 fallback 为页面右上角浮动入口
- 按钮使用固定属性 `data-asc-task21-statistics-toolbar="true"` 去重，支持 Vue/SPA 重渲染后自动重挂载，离开列表页后自动移除。
- 当前仓库未包含 Task21 统计后端与独立前端统计 runtime，因此：
  - `统计当前列表` 当前会给出"Task21统计模块未就绪，请先完成统计采集模块。"
  - `下载统计CSV` 默认禁用，不伪造下载地址
- `/items` 详情页字段旁 `AI分析 / 整体分析` 入口保持不变。
- 扩展重载后需刷新 Abaka Task21 页面再验证，避免旧 content script 继续驻留。

## 2026-05-26（Magic Data 识别策略保存回滚热修）

- 修复 `Magic Data` 双助手在 options 中将识别策略切回 `direct_dialect` 后被 legacy `recognition_convert` 回滚的问题。
- 修复点：
  - `extension/options/options.js` 新增显式策略解析优先级：`aiReviewRecognitionStrategy > recognitionStrategy > fallback > legacy recognitionMode`。
  - 保存时同步覆盖 `aiReviewRecognitionMode/recognitionMode/pipelineMode`，避免深合并保留旧 `recognition_convert`。
  - `extension/shared/storage.js` 的显式策略检测补充 `recognitionStrategy` 兼容字段，避免 normalize 阶段误回写。
  - `platforms.magicData.scripts.*` 与 `scriptCenter.projects.*` 双路径同步同一策略和 legacy 派生字段，避免回显冲突。
- 当前版本口径保持 `0.3.6`，未提升版本、未生成 CRX、未打 tag。

## 2026-05-28（Aishell Tech defaults 与面板挂载热修）

- 修复 `Aishell Tech` options 页模型选择为空、Prompt 默认值缺失的问题：
  - `extension/options/options.js` 新增 DataBaker 风格的模型下拉构建函数，供 Aishell 复用。
  - Aishell defaults 读取顺序调整为：Aishell 独立 defaults -> DataBaker defaults -> 本地 DataBaker Prompt/模型默认值。
  - Aishell 本地回退 Prompt 现与 `platform-resources/data-baker/round-one-quality` 保持一致。
- 修复 `Aishell Tech` 标注页面板初次挂到不可见区域后不会自动回到表单区的问题：
  - `extension/sites/aishell-tech/minnan-helper/ui-panel.js` 改为优先挂到 `.mark-area` 内、表单节点之前。
  - 当 `.mark-area` 后加载出来时，现会自动把已存在的面板重新搬回可见表单区。
- 修复 `Aishell Tech` 页面在真实 Edge 中整组 content scripts 未落到页面的问题：
  - 复测确认 `detail -> 查看 -> mark` 链路可稳定打开，但 `window.__ASREdgeAishellTechMarkObserverInstalled` 与面板节点都不存在。
  - `Secure Preferences` 显示扩展 host 权限已授予、`withholding_permissions=false`，排除站点权限未放开。
  - `chrome.storage.local` 可见 `aishellTech.enabled=true`、`minnanHelper.aiRecommendEnabled=true`，排除脚本设置被关闭。
  - 现新增 `background/service-worker.js` 对 Aishell 的 `registerContentScripts` 兜底注册，并给 `data-api / ai-recommendation / ui-panel / shortcuts / content` 增加安装守卫，避免与 `manifest content_scripts` 双注入时重复执行。
- 新增 Aishell 测试按钮模式：
  - 单条 `识别` 按钮挂到页面底部 `保存` 按钮旁。
  - `批量识别 / 停止` 按钮挂到文件名行旁。
  - 单条与批量都先只做识别与悬浮展示，不自动填入，不自动保存；便于先验证注入、请求和 Prompt 输出。
- 修复 Aishell `detail -> mark` 场景的路由切换漏注入：
  - 用户复现：从 `https://mark.aishelltech.com/mytask/detail/:taskId` 点击“查看”进入 `mark?...` 后，按钮不出现；手动刷新后会出现，但平台会卡住。
  - 处理方式：`manifest.json` 新增 `webNavigation` 权限，`background/service-worker.js` 新增 `onHistoryStateUpdated / onCompleted / tabs.onUpdated` 三层兜底，在进入 Aishell `detail / mark / index` 路由时主动执行脚本注入。
  - Aishell 各前端模块已带安装守卫，因此补注入不会导致重复绑定。
- 补充前端路由检测兜底：
  - 根据用户复现，平台从 `detail` 进入 `mark` 时可能未走标准 `history` 路由事件。
  - `extension/sites/aishell-tech/minnan-helper/content.js` 新增 `250ms` URL 轮询；只要同页 URL 变化，就会重新执行运行时评估。
  - `page-world/network-observer.js` 与 `content.js` 额外写入 `data-asc-aishell-main-world / data-asc-aishell-isolated` 调试标记，便于确认到底是主世界、隔离世界还是按钮挂载层失效。
- 新增平台实测口径：
  - 实测应优先从 `/mytask/detail/:taskId` 进入，再点击分包“查看”进入 `/mytask/mark`。
  - 直接手输 `/mytask/mark?...` 时，平台自身可能出现卡住；这不作为助手面板故障判定依据。

## 2026-05-28（Aishell Tech 悬浮窗按钮接入实际功能）

- 在最小悬浮窗版基础上补齐单条实用动作：
  - `识别` 仍走独立 Aishell recommend 接口。
  - 结果区新增 `复制听音文本`、`复制推荐文本`、`填入当前条`、`忽略`。
  - `填入当前条` 只写入页面真实文本框，并派发 `input/change` 事件；仍不自动保存。
- 批量识别补齐运行控制：
  - `批量识别` 继续只处理当前分包、从当前选中条开始、跳过已完成条目。
  - 新增 `停止批量`，只在当前条结束后停下，不强杀当前进行中的 AI 请求。
  - 批量区新增失败计数与失败清单，便于人工回看失败条目。
- `extension/sites/aishell-tech/minnan-helper/data-api.js` 新增 Aishell 文本框定位与填入能力，并补充中文句末标点与空白清洗辅助函数。

## 2026-05-28（Aishell Tech 用户触发后真实保存）

- 根据人工实测反馈，将单条动作从“仅填入”改为“填入并点击页面真实保存”：
  - `填入当前条` 现改为 `填入并保存当前条`。
  - 仍先写入页面真实输入框，再点击 `.mark-area` 里的真实 `保存` 按钮。
  - 保存后轮询等待左侧列表条目变为完成或自动切到下一条，超时才报错。
- 批量动作也改为用户触发后的顺序真实保存：
  - `批量识别` 现在会先切到目标条目、请求 AI、成功后立即填入并点击真实 `保存`。
  - 每条都等待页面切条成功后再继续下一条。
  - 失败条继续进入失败清单，不阻塞后续条目。

## 2026-05-28（百炼模型统一注册与双通道调用）

- `platform-resources/backend/ai/` 新增统一模型注册与派发层：
  - `model-catalog.js` 作为百炼核心模型唯一事实源，统一登记 `qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`、`qwen3.5-omni-plus`、`qwen3.5-omni-flash`、`fun-asr` 的文档地址、费用文档、family、tier、thinking 默认策略与运行时顺序。
  - `model-dispatcher.js` 统一提供 `getModelMeta / listModelsByFamily / invokeModel / getModelDocs`，默认 `JS 优先，Python 备用`。
- 通用 Qwen Python 备用链路已补齐：
  - 新增 `platform-resources/backend/ai/python/qwen_openai_client.py`。
  - 新增 `platform-resources/backend/ai/providers/qwen-python.js`。
  - 文本比较与 Omni `input_audio` 现在都具备 JS/Python 双通道调用能力；Fun-ASR 继续保留 REST + Python SDK 双通道。
- `config.js`、Aishell/DataBaker health/defaults 和前端共享兜底常量已开始改为从统一模型目录衍生，避免模型名单继续散落硬编码。
- `docs/external-docs/aliyun-bailian.md` 已新增“模型目录”段，统一记录 7 个核心模型的官方文档、API 文档、费用文档与默认 thinking 策略。

## 2026-05-28（Aishell Tech 并发识别与双策略模式）

- 批量识别从“先切条再识别”改为“直接读取 `packageItemList` 后并发发起 AI 请求”：
  - 不再等待页面当前选中条切换完成后才请求 AI。
  - 前端按配置并发数发起请求，但固定每 `50ms` 才允许发出下一条，整体请求速率不超过 `20 req/s`。
  - 哪条结果先返回，就先切到哪条并执行“填入并保存当前条”。
- Aishell 独立补齐两种闽南语识别策略，并对齐 options/defaults/backend：
  - 默认策略改为 `mandarin_to_dialect`（普通话对照默认）：听音模型先输出普通话，再结合页面预测闽南语文本和字词表生成最终闽南语。
  - 保留 `direct_dialect`（直接听写闽南语）测试模式。
  - `defaults/health` 新增 `modelModeOptions`、`recognitionStrategyOptions`、`promptProfiles`，Aishell options 面板改为真正保存 `模型方案 + 识别策略`。

## 2026-05-28（Aishell Tech 乱序批量保存判定热修）

- 修复批量识别中“第一条成功、后续大量提示保存超时”的问题：
  - 旧逻辑只按 DOM 是否自动切条 / 条目是否出现 `list-item-finshed` 来判断保存成功。
  - 在乱序保存场景下，平台不一定自动切到下一条，导致保存已成功也会被误判成失败。
- `extension/sites/aishell-tech/minnan-helper/data-api.js` 已补两层确认：
  - 切条后先等待右侧表单真正切到目标文件，再执行填入与保存。
  - 点击保存后，除继续观察 DOM 外，还会轮询 `getShortMark` 与 `packageItemList` 确认平台状态已更新。

## 2026-05-28（Aishell Tech 批量保存节奏放慢热修）

- 根据人工复测反馈，当前主要失败点从“保存误判”收敛到“切条后右侧表单仍未完全稳定就继续保存”。
- 本轮没有改 AI 并发请求策略，只放慢真实页面操作节奏：
  - `content.js` 调高批量切条超时，并在切条成功后增加额外稳定等待。
  - `fillAndSaveCurrent` 现在支持 `postSaveSettleMs`，保存成功后会额外等待一段时间，再处理下一条。
  - 批量循环每条结束后都会再等一个短间隔，降低连续切条/连续保存把 Aishell 页面打乱的概率。

## 2026-05-28（Aishell Tech 批量保存切回原生 SaveShortMark）

- 根据复测反馈，Aishell 批量的核心问题不是 AI 并发本身，而是“切条后依赖页面真实保存按钮”这一步容易受页面切换状态干扰。
- 本轮收口为更接近 DataBaker 的模式：
  - 继续使用前端并发窗口和“哪条先返回就先进保存队列”的消费方式。
  - 回填时先切到目标条并填入页面文本框，再直接调用平台原生 `POST /api/mark/SaveShortMark`，不再依赖页面按钮。
  - 保存成功判定统一改为轮询 `getShortMark` 与 `packageItemList`，确认平台文本和 `dataStatus` 已更新后再继续下一条。

## 2026-05-28（统一 AI jobs 与按模型全局队列）

- 统一后端 AI framework 新增公共 `ai-job-store` 与通用 jobs 路由辅助：
  - `platform-resources/backend/ai-framework/runtime/ai-job-store.js`
  - `platform-resources/backend/ai-framework/core/create-ai-job-routes.js`
- 统一 provider queue 支持按“具体模型名”建共享池：
  - 新增 `buildModelQueueKey(modelName)`。
  - 默认模型池速率调整为 `20 req/s`，即 `50ms` 一个发出机会；默认并发上限 `15`。
  - 同一模型跨平台、跨脚本共享池，不再按脚本分组各自排队。
- 已接入 jobs 默认链路的平台：
  - Aishell Minnan `recommend`
  - DataBaker round-one-quality `recommend`
  - Magic Data hakka/minnan `review-current`
  - LabelX asr-judgement `suggest`
  - LabelX asr-transcription `suggest-current`
  - Abaka Task21 `analyze`
- 前端新增共享 `extension/shared/ai-job-client.js`：
  - 统一负责 `POST /jobs`、轮询 `GET /jobs/:jobId`、读取 `GET /jobs/:jobId/debug`。
  - DataBaker、Aishell、Magic Data、LabelX、Abaka 的默认 AI 客户端均已切到 jobs 链路。
- Aishell 这轮重点修复的是“高并发下同步 recommend 长连接被浏览器 / Nginx / 代理层中断”的根因：
  - 前端批量逻辑保留原有结果消费顺序控制。
  - 底层 AI 请求改为短请求建任务 + 轮询，避免单个同步 `POST` 长时间挂起。
