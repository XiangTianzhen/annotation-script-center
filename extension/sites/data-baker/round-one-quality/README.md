# 标贝易采一检质检 AI 推荐文本

本目录是 标贝易采 质检站点的扩展运行时代码，目标页面为：

- 首页：`https://datafactory.data-baker.com/v2/#/quality/roundOne`
- 详情页：`https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0`
- 任务组详情页：`https://datafactory.data-baker.com/v2/#/group/detail?taskId=...`

这是独立新增站点，不属于 Alibaba LabelX，也不复用 `extension/sites/alibaba-labelx/asr-judgement/` 或 `extension/sites/alibaba-labelx/asr-transcription/` 的业务代码。

## 当前能力

- 仅在 `roundOneCollect` 详情页注入小工具卡。
- 已接入扩展 options “标注脚本中心”，在 `标贝易采` 平台区域提供脚本启停和专属设置页。
- 只处理左侧当前选中的单条句子。
- 工具卡提供“AI 推荐文本”按钮，由用户手动点击触发。
- 左侧句子列表上方 `filter-screen` 新增“AI连续填入合格项”按钮（位于“批量判定”按钮右侧；挂载失败时回退到 AI 面板内）。
- 点击该按钮会先刷新当前页列表，再筛选当前页全部 `statusName=质检合格`（或 DOM 显示“一检合格”）条目。
- 处理策略为“并发生产 + 顺序消费”：先按配置并发数发起全部合格项 AI 请求，结果返回后进入缓冲区；填入流程不等待全部请求结束，按 AI 返回顺序从队列取结果并逐条切换填入，支持运行中手动停止。
- AI 连续填入默认并发改为 `5`，可在 Options 配置 `1-10`；更高并发不会绕过上游模型限流，只会更快堆积到统一后端队列。
- 新增顶部统计悬浮窗，运行中展示 AI 返回、待填队列、填入成功/失败/跳过和失败条目。
- 悬浮窗在任务完成或停止后保留约 30 秒，可手动关闭。
- 失败列表提供“重新填写失败内容”按钮，仅重试已有推荐文本的填入失败项，不会重新请求 AI。
- 点击后读取当前题的 `audioUrl`、页面候选文本、句子编号、朗读要求、有效时间和音频时长，再调用“全局后端接口地址 + 固定 API path”。
- 结果卡展示页面候选文本、AI 听音文本、AI 推荐文本、是否相对页面文本变更、置信度、模型、流水线模式、阶段耗时、决策和复核提示。
- 结果卡提供“复制推荐文本”“填入推荐文本”“忽略”。
- “填入推荐文本”只在用户点击后触发，只写入页面的“本句话文本”输入框，不自动保存、不自动提交、不自动点击合格 / 不合格。
- “AI连续填入合格项”会跳过 `质检不合格`、`未质检` 和状态未知条目，不点击 checkbox，不自动保存、不自动提交、不做自动流转。
- AI 听音文本、AI 推荐文本展示和填入前会自动删除普通空格、全角空格、Tab 和换行；页面候选文本保持平台原文。
- AI 推荐文本展示和填入前会自动补全中文句末标点；英文句末 `.?!;` 会转为 `。？！；`，无句末标点时默认补 `。`。
- `group/detail` 页面新增“导出数据总表”按钮，通过 MAIN world 拦截页面原生 `queryByCondition` 响应，按分页控件逐页合并导出全量 CSV（含 BOM）。
- 导出完成后会自动上传 CSV 到统一后端保存，同时保留浏览器本地下载；上传失败不影响本地下载。
- 后端上传保存为累计合并逻辑：`latest.csv` 不再覆盖，按“文本编号”合并（任务ID仅作元信息，不参与唯一键）。
- 支持自动每页条数，默认进入详情页后尝试设置为 `50条/页`，只点击页面原生分页控件。
- 支持 标贝易采 专属快捷键配置，默认全部未设置；快捷键只处理当前题或当前推荐卡。
- 新增快捷键：`Alt+Q` 触发“AI并发分析并连续填入合格项”（运行中再次触发为停止）。

## 文件职责

```text
round-one-quality/
  content.js
  data-api.js
  ai-recommendation.js
  ui-panel.js
  page-size-controller.js
  shortcuts.js
  group-export.js
  page-world/
    network-observer.js
```

- `content.js`：入口编排，判断当前页面是否 `roundOneCollect`，初始化数据 API、AI 推荐和 UI 面板。
- `data-api.js`：解析 `collectId/checkType`，监听 MAIN world 缓存的列表接口响应，定位当前选中题并生成后端请求数据。
- `ai-recommendation.js`：调用本地后端 `POST /api/data-baker/round-one-quality/ai/recommend`，请求体只传必要字段。
- `ui-panel.js`：注入按钮和推荐结果卡，支持复制和用户点击后填入推荐文本。
- `page-size-controller.js`：在详情页有限重试点击分页大小选择器，按设置切换到目标每页条数。
- `shortcuts.js`：监听 标贝易采 专属快捷键；先匹配已配置快捷键再处理输入焦点，普通输入不拦截。旧的被动焦点恢复已移除；脚本通过检测“本句话文本”变化，在平台自动切题后短暂 focus/blur 文本框恢复快捷键焦点。
- `group-export.js`：仅在 `group/detail?taskId=...` 页面注入“导出数据总表”按钮；切换分页大小时会先点击 `.el-pagination__sizes .el-select` 内的 `.el-input.el-input--mini.el-input--suffix`，等待下拉出现后选择 `100条/页`，再通过跳页控件逐页触发平台原生查询并等待 MAIN world 的 `queryByCondition` 响应消息后合并下载 CSV；导出后自动 `POST /api/data-baker/round-one-quality/export/upload` 上传 CSV。
- `page-world/network-observer.js`：运行在 MAIN world，观察 `queryCollectStatementByCondtion`（一检详情页）和 `queryByCondition`（group/detail）响应并以内存消息通知 ISOLATED world。

## options 设置

`标贝易采一检质检` 在 options 首页默认启用，方便上线验证；用户可在卡片中关闭脚本。专属设置页支持：

- AI 推荐相关设置已迁移到通用隐藏部件“ASR 语音 AI 设置”（标题连续点击 10 次显示），普通设置区不再直接展示 AI 开关/超时字段。
- 在“ASR 语音 AI 设置”中可配置启用 / 关闭 AI 推荐文本；关闭后页面不显示 AI 推荐工具卡，也不会触发推荐请求。
- “ASR 语音 AI 设置”解锁后会请求 `GET /api/data-baker/round-one-quality/ai/recommend/defaults`，默认展示后端当前模型、Prompt 与生成参数，而不是空白输入框。
- 标贝易采前端会显示“识别模式”字段：
  - `two_stage`：显示“听音模型 + 比较模型”
  - `omni_single`：只显示“AI 模型”
- 双模型听音模型只允许：`fun-asr`、`qwen3.5-omni-plus`、`qwen3.5-omni-flash`。
- 单模型 AI 模型只允许：`qwen3.5-omni-plus`、`qwen3.5-omni-flash`，默认 `qwen3.5-omni-flash`。
- 双模型比较模型只允许以下 4 个选项：`qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`，默认 `qwen3.5-plus`；旧配置若不在这 4 个中，会迁移为 `qwen3.5-plus`。
- 选择 `fun-asr` 时，设置页会显示 Python SDK / `.venv` 提示；选择 Qwen Omni 模型时隐藏该提示。
- Prompt 与参数按 override 保存：字段清空或恢复默认时不保存 override，请求时由后端默认值生效；只有与默认不同的值才随请求透传。
- 不支持参数前端不显示，后端二次白名单过滤；`response_format` 不对前端开放。
- 后端接口地址由 options 首页顶部“后端接口地址”统一控制：
  - `server`：`https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`
  - `local`：`http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend`
- 在“ASR 语音 AI 设置”中配置前端请求超时时间，页面以秒展示，默认 `120` 秒；扩展内部仍按毫秒存储到 `aiRecommendRequestTimeoutMs`。
- 启用 / 关闭自动每页条数，默认启用，默认目标为 `50条/页`，可选 `5条/页`、`10条/页`、`20条/页`、`50条/页`、`100条/页`。
- AI 连续填入默认并发为 `5`，最大建议值为 `10`；更高并发不会绕过限流，只会更快堆积到后端队列。
- 运行中顶部悬浮窗会显示：`前端并发`、`已发起AI请求`、`前端活跃AI请求`、`AI已返回`、`待填队列`，用于判断是前端没发起并发，还是后端 Fun-ASR / compare 阶段在排队。
- 配置快捷键，默认全部未设置。支持动作：AI 推荐文本、复制 AI 听音文本、复制 AI 推荐文本、填入推荐文本、忽略 AI 推荐结果、句子判定合格 / 不合格、任务判定通过 / 部分驳回 / 全部驳回。
- 普通输入不会被快捷键拦截；如果焦点停留在“本句话文本”输入框，只有按下已配置快捷键时才会自动 blur 输入框并执行动作。
- 点击左侧 `.sentence-list .sentence-item` 切换题目、点击平台动作按钮、或平台自动切换 `.sentence-list .sentence-item.active` 后，脚本不再做被动 blur/focus，避免干扰音频区域加载。
- 当检测到“本句话文本”变化且用户不在手动编辑时，脚本会短暂进入文本框再退出，以恢复快捷键焦点；普通输入与平台切题流程保持原生行为，不绕过 disabled。
- “填入推荐文本”成功后会立即并延迟退出“本句话文本”输入框，方便继续使用快捷键；不会自动保存、自动提交或自动判定。

扩展前端只保存超时时间、开关、分页和快捷键设置，不保存 API Key、access token、cookie 或完整 `audioUrl`。模型密钥仍由后端通过 `config/env/ai.env` 读取；脚本详情页不提供 API Key 或独立后端地址输入。
导出上传能力为脚本默认能力，不在详情页提供关闭开关；后端地址继续由 options 首页顶部“后端接口地址”统一控制。

## 页面选择器依据

页面结构资料维护在：

```text
platform-resources/data-baker/round-one-quality/page-structure.md
platform-resources/data-baker/round-one-quality/network.md
```

当前运行时主要依赖：

- 左侧句子列表：`.sentence-list`
- 单条句子：`.sentence-list .sentence-item`
- 当前选中句子：`.sentence-list .sentence-item.active`
- 当前句子标题：`.sentence-list .sentence-item .title`
- 右侧详情容器：`.waver-page`
- “本句话文本”输入框：`.waver-page .text-box textarea.el-textarea__inner`
- 音频 iframe 容器：`#iframeBox iframe#myIframe`
- 时间信息：`.timeform_left_time`
- 分页容器：`.roundOneCollect-el-pagination`

音频真实地址优先来自列表接口字段 `audioUrl`。页面中 `#myIframe` 只是播放器入口，不把 iframe `src` 当成可直接传给 AI 的音频地址。

## 数据来源与安全边界

- 前端不硬编码 `access_token`、cookie、OSS 参数或音频签名。
- MAIN world 网络观察脚本监听同源接口路径 `/cms/tbAudioUserTask/queryCollectStatementByCondtion` 与 `/cms/tbAudioUserTask/queryByCondition`。
- 接口响应只保存在当前页面内存中，不写入 `chrome.storage`、DOM 持久属性、`localStorage` 或文档。
- 扩展前端不直连 DashScope，AI Key 只允许后端读取环境变量 `DASHSCOPE_API_KEY`。
- 前端和后端日志都不输出完整 `audioUrl`、access token、cookie、`OSSAccessKeyId` 或 `Signature`。
- 扩展前端不保存 API Key；`DASHSCOPE_API_KEY` 由后端通过 `config/env/ai.env` 或系统环境变量读取。

## 后端接口

本地后端入口仍是：

```powershell
node platform-resources\backend\server.js
```

接口：

- `GET http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend/health`
- `GET http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend/defaults`
- `POST http://127.0.0.1:3333/api/data-baker/round-one-quality/ai/recommend`
- `GET http://127.0.0.1:3333/api/data-baker/round-one-quality/export/health`
- `GET http://127.0.0.1:3333/api/data-baker/round-one-quality/export/config`
- `POST http://127.0.0.1:3333/api/data-baker/round-one-quality/export/upload`
- `GET http://127.0.0.1:3333/api/data-baker/round-one-quality/export/download`

扩展默认请求服务器接口：

- `POST https://script.xiangtianzhen.store/api/data-baker/round-one-quality/ai/recommend`
- `POST https://script.xiangtianzhen.store/api/data-baker/round-one-quality/export/upload`
- `GET https://script.xiangtianzhen.store/api/data-baker/round-one-quality/export/download`

任务总表导出不再由 content script 直接 `fetch /cms/tbAudioUserTask/queryByCondition`。原因是平台可能对扩展直接请求返回 `code=51000`。当前方案改为触发页面原生分页查询并拦截响应：先展开 Element UI 分页大小下拉并选择 `100条/页`，再逐页触发并合并导出；导出后会自动上传到统一后端保存。CSV 已移除“采集ID”列与“原始JSON”列，保留 UTF-8 BOM；原始记录改为脱敏后单独上传保存。

CSV 字段统一口径：导出中的计费时长字段标题统一为 `有效时长`，值仍取 `effectivePassTotalTime`；历史标题 `有效合格时长` 不再用于新导出。

当前前端保留“识别模式”+模型选择：

- `two_stage`：显示听音模型 `fun-asr / qwen3.5-omni-plus / qwen3.5-omni-flash`，再显示 compare 文本模型 `qwen3.6-plus / qwen3.5-plus / qwen3.6-flash / qwen3.5-flash`
- `omni_single`：只显示 AI 模型 `qwen3.5-omni-plus / qwen3.5-omni-flash`

后端会按识别模式 + 模型自动推导内部链路：

- `two_stage + fun-asr`：先由 Python Fun-ASR 客户端得到 `heardText`，再调用 compare 模型生成 `recommendedText`
- `two_stage + qwen3.5-omni-plus / qwen3.5-omni-flash`：先通过 Qwen Omni `input_audio` 得到 `heardText`，再调用 compare 模型生成 `recommendedText`
- `omni_single + qwen3.5-omni-plus / qwen3.5-omni-flash`：单次 Qwen Omni 请求直接产出 `heardText + recommendedText`
- Fun-ASR 没有 thinking 概念；thinking 只影响 Qwen Omni 阶段和 compare 阶段。
- 如果听音模型选择 `fun-asr` 且连续填入看起来像串行，先对照后端 `health.queue.groups.fun_asr.activeCount/maxConcurrent`；若 `activeCount` 能超过 `1`，通常说明前端并发发起正常，瓶颈更可能在 Fun-ASR 上游识别耗时或 compare 阶段排队。

Fun-ASR 不再由 Node 手写 REST 直接调用，而是由后端 wrapper 调起：

```text
platform-resources/backend/ai/python/funasr_client.py
```

后端优先使用以下 Python 解释器：

- `platform-resources/backend/.venv/Scripts/python.exe`
- `platform-resources/backend/.venv/bin/python`
- 或环境变量 `DATABAKER_FUNASR_PYTHON_BIN`

如果未配置 Python 虚拟环境，前端会显示：

```text
Fun-ASR Python 环境未配置，请在 platform-resources/backend/.venv 创建统一 Python 虚拟环境，并执行 .venv\Scripts\python.exe -m pip install -r ai\python\requirements.txt。
```

- 默认虚拟环境路径已统一为 `platform-resources/backend/.venv`。
- 服务器部署、Windows/Linux 创建命令、重启与 `403` 排查统一见根目录 `README.md`。

后端统一经过 provider/model group 级全局限流队列，并带 429 指数退避重试；多人并发时浏览器请求只能在后端排队，不能直接打穿百炼限流。`429` 的根因是上游模型或账号维度限流，不是 `2 核 2G` 服务器算力问题。多个 RAM 用户或 API Key 若属于同一阿里云主账号，也可能合并计入限流。

后端已接入闽南方言字词表参考资料 CSV：

```text
platform-resources/data-baker/round-one-quality/reference/minnan-lexicon.csv
```

词表既用于听音和对比 prompt 的上下文提示，也会默认以 `aggressive` 模式对最终推荐文本做强替换。强替换后的文本只展示在推荐卡中，仍需用户手动复制或点击“填入推荐文本”，扩展不会自动保存、提交或批量处理。可通过后端环境变量 `DATABAKER_AI_LEXICON_REWRITE_MODE=off` 关闭强替换。词表缺失时功能仍可运行，但“的/诶”“很/真”“喜欢/欢喜”“这位/即个”“他/伊”等易混场景的推荐质量可能下降；更新词表时只替换 CSV 文件即可。

当后端返回 `lexicon.rewriteChanged=true` 时，推荐卡会显示“词表替换：已替换 N 处”，并列出最多 8 个替换项，例如 `他 → 伊`、`喜欢 → 欢喜`、`的 → 诶`。

推荐卡会在后端返回 `timing` 时显示 Fun-ASR/Omni 耗时、compare 耗时和总耗时，并可显示队列、重试、缓存命中信息。Fun-ASR 默认并发由 `DATABAKER_AI_FUN_ASR_CONCURRENCY=5` 控制，如 `2 核 2G` 服务器压力高可调低到 `3`。后续如增加“预生成当前页 AI 推荐”按钮，也必须继续走统一后端排队与缓存链路，不能让前端直连 DashScope。

## 人工验证步骤

1. 重新加载扩展。
2. 打开 options 页面，确认首页出现 `标贝易采` 平台和 `标贝易采一检质检` 卡片。
3. 点击“打开设置”，确认脚本详情页不再提供独立后端地址配置；后端地址由 options 首页顶部统一切换。
4. 确认自动每页条数默认启用且目标为 `50条/页`；快捷键配置区域默认全部未设置。
5. 录制一个快捷键，例如 `Alt+A` 绑定“AI 推荐文本”，保存后刷新 options 页面，确认配置仍存在。
6. 如需本机调试，先在 options 首页顶部把“后端接口地址”切到“本机”，再启动本地后端：`node platform-resources\backend\server.js`。
7. 访问 health 接口，确认返回 `success=true`。
8. 打开 `https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0`。
9. 等待列表和右侧题目加载，确认右侧“本句话文本”下方出现 `标贝易采 AI 推荐文本` 工具卡，并观察页面自动尝试切换为 `50条/页`。
10. 点击左侧不同句子，确认旧推荐结果会清空或提示需要重新生成；切换后不点击空白区域直接按已配置快捷键，确认快捷键仍响应。
11. 点击平台“确定”让页面自动切到下一条，不点击屏幕直接按已配置快捷键，确认快捷键仍响应。
12. 点击“AI 推荐文本”或按已绑定快捷键，确认只请求当前选中单条，且请求地址随首页全局后端模式切换。
13. 推荐结果出来后，验证复制 AI 听音文本、复制推荐文本、填入和忽略快捷键只作用于当前推荐卡。
14. 当后端返回带空格的 AI 听音文本或 AI 推荐文本时，确认推荐卡展示、复制和填入后的文本都已去除空白字符；页面候选文本原文不被修改。
15. 验证合格 / 不合格快捷键只点击 `.submit-btn` 中对应按钮；任务判定按钮 disabled 时快捷键不会绕过平台限制。
16. 聚焦“本句话文本”输入框，输入未配置为快捷键的普通字符，确认正常输入且不被拦截。
17. 聚焦“本句话文本”输入框后按已配置快捷键，例如 `Alt+A`，确认输入框先失焦再执行快捷键。
18. 点击“填入推荐文本”，确认只写入“本句话文本”输入框，且输入框会立即和延迟失焦；不会自动保存、提交、合格、不合格或任务判定。
19. 当后端返回的推荐文本没有句末标点时，确认推荐卡和填入后的输入框末尾都有中文句末标点。
20. 填入后不点击页面，直接按快捷键，确认仍可继续响应。
21. 关闭 标贝易采 脚本后刷新详情页，确认工具卡、自动分页和快捷键都停止；只关闭 AI 推荐时不显示工具卡。
22. 打开非 `roundOneCollect` 页面，确认不注入该工具卡。
23. 打开 `group/detail?taskId=...` 页面，确认出现“导出数据总表”按钮；点击后状态应展示“准备导出，正在切换到 100条/页”“正在导出：第 x / y 页”，最终提示“已下载 CSV”，并显示后端上传成功或失败（失败不影响本地下载）。
24. 导出后访问 `http://127.0.0.1:3333/api/data-baker/round-one-quality/export/download`，确认可下载后端保存的最新 CSV。
25. 打开 options 中“ASR 语音 AI 设置”，确认显示“识别模式”下拉。
26. 选择 `two_stage`，确认显示“听音模型”和“比较模型”，且“听音模型”下拉不再出现 `[object Object]`。
27. 确认听音模型下拉包含 `fun-asr`、`qwen3.5-omni-plus`、`qwen3.5-omni-flash`。
28. 确认比较模型下拉包含 `qwen3.6-plus`、`qwen3.5-plus`、`qwen3.6-flash`、`qwen3.5-flash`。
29. 切换到 `omni_single`，确认只显示“AI 模型”，不显示“听音模型”和“比较模型”。
30. 确认 `AI 模型` 下拉只包含 `qwen3.5-omni-plus`、`qwen3.5-omni-flash`，且不出现 `fun-asr`。
31. 切回 `two_stage` 后选择 `fun-asr`，确认界面显示 Python 虚拟环境提示。
32. 切换到 `qwen3.5-omni-plus` 或 `qwen3.5-omni-flash` 后，确认 Python 提示立即隐藏，不需要先保存。
33. 选择 `two_stage + fun-asr` 后点击单条“AI 推荐文本”，确认浏览器仍只请求统一后端接口，后端链路为 Fun-ASR 听音 + compare。
34. 选择 `two_stage + qwen3.5-omni-flash` 或 `two_stage + qwen3.5-omni-plus` 后点击单条“AI 推荐文本”，确认后端链路为 Qwen Omni 听音 + compare。
35. 选择 `omni_single + qwen3.5-omni-flash` 或 `omni_single + qwen3.5-omni-plus` 后点击单条“AI 推荐文本”，确认后端链路为单次 Omni，不调用 compare。
36. 点击“AI并发分析并连续填入合格项”，确认默认并发不再是 `50`，而是 `5`，且最大值不再超过 `10`。
37. 如果后端触发排队、429 重试或队列满，确认顶部悬浮窗/结果提示会显示“AI 排队 / 限流重试 / AI 分析失败”等友好状态，而不是误导为页面卡死。
38. 未配置 Python 虚拟环境时，只有 `two_stage + fun-asr` 会报清晰环境缺失错误，不应直接展示 provider 原始 JSON；Omni 模型链路仍可用。
39. 若 Fun-ASR 返回 `403`，页面提示应说明可能是 DashScope 权限/地域、API Key 权限或平台音频 URL 对服务端不可访问，并建议先切换到 `qwen3.5-omni-flash` 或 `qwen3.5-omni-plus`。
40. 确认页面填入后仍不自动保存、不自动提交、不自动判定、不自动流转。

## 已知限制

- 当前不实现自动保存、自动提交、批量识别、自动流转或自动判定。
- 如果当前页面还没有触发列表接口，运行时会尝试同源读取当前页数据；若浏览器限制导致读取失败，需要刷新详情页或点击左侧句子后再触发。
- 若 15 秒内未捕获到 `queryByCondition` 响应，页面会提示“未捕获到平台 queryByCondition 响应，请点击页面查询按钮后重试。”。
- 如果分页大小下拉无法自动展开或未找到 `100条/页`，页面会提示手动切换到 `100条/页` 后重试；必要时会降级导出当前页并给出明确提示。
- 如果后端未启动或服务器接口未部署最新版本，导出状态会提示“后端上传失败”，但本地下载仍会成功。
- 如果无法安全定位可编辑的“本句话文本”输入框，结果卡仍保留复制入口，但不会强行填入。
- 有效音频裁剪第一版未启用；后端只保留环境变量和代码结构，默认把完整 `audioUrl` 交给听音模型。
- 选择 `fun-asr` 作为听音模型时，真实可用性还取决于 Fun-ASR 服务是否能访问平台 `audioUrl`；若服务端无法访问签名音频地址，后端会返回明确错误，但不会在日志或响应中泄露完整 URL。
- 如果 Fun-ASR 返回 `403`，常见原因包括：
  - DashScope 权限或地域未开通
  - API Key 对 `fun-asr` 无权限
  - 平台签名 `audioUrl` 对 Fun-ASR 服务不可访问
  - 调用参数错误
  临时恢复使用时，优先切换到 `qwen3.5-omni-plus` 或 `qwen3.5-omni-flash`。


