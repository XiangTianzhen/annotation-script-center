# 标注脚本中心修改总账

本总账只记录 DataBaker CVPC 柳州话、ByteDance AIDP 苏州话、金华话与台州话、Magic Data 杭州话，以及五脚本共同依赖的扩展、Options、后端、测试和发布能力。

## 2026-07-18

- 修复(backend): 双 DashScope 密钥解析增加旧单密钥兼容边界：仅双槽位均未配置时回退旧变量；任一槽位存在后严格使用当前槽位，空槽位不发起上游请求。
- 修复(ai): 柳州、苏州、金华、台州共用 Qwen / Qwen Python / Fun-ASR REST/Python 与杭州话专用 Qwen 客户端统一携带当前槽位来源；百炼 401 只提示当前密钥来源鉴权失败，不自动改用另一账户。
- 优化(options): 系统管理页明确显示“旧密钥兼容中”与“未配置可用密钥”，不展示密钥、路径或指纹。
- 测试(backend): 覆盖旧变量回退、槽位优先、五语言 Provider 动态切换、401 不重试及管理员安全状态响应；Options 覆盖兼容和未配置状态。
- 文档(config): 更新双密钥迁移、旧变量回退优先级与 PM2 配置说明。

## 2026-07-17

- 发布(zip): 重新生成 `annotation-script-center-v1.1.0.zip`，固化当前五脚本、服务器双 DashScope 密钥切换与 Options 密钥控件；对应 Git tag 为 `v1.1.0`。
- 新增(backend): 增加服务器双 DashScope 密钥槽位，固定读取两份私有密钥文件并以私有状态文件持久化当前槽位；Qwen、Fun-ASR 与杭州话统一使用当前选中密钥，不自动故障切换。
- 新增(options): 系统管理的服务器后端设置新增双密钥安全控制，复用管理员会话且不展示密钥、文件路径或指纹。
- 优化(options): 双密钥控制收紧为“吴 / 王”按钮加“保存当前密钥”；选择按钮不发请求，保存后才切换且刷新状态，401 退出会话，404 只提示接口尚未部署。
- 优化(options): 将服务器 AI 密钥紧凑控制器移入后端根地址卡，固定显示在当前生效地址下方、根地址配置操作上方；吴 / 王复用服务器 / 本机的分段切换外框与选中样式，窄屏自动换行，避免展开地址配置时控制器落出可视区。
- 测试(backend): 覆盖默认槽位、持久化切换、非法或未配置槽位、状态损坏、管理员鉴权和安全响应边界。
- 文档(config): 明确双密钥私有文件、旧单密钥迁移、PM2 文件权限和手动服务器验收步骤。
- 优化(ai): storage schema 升至 `34`，柳州听音/普通话整理与杭州听音/普通话整理/单模型分别提供默认开启的字词表开关、字词表提示词、Prompt 和生成参数。
- 重构(magic-data): 杭州话移除识别策略 UI 与代码侧普通话转方言、最终用字归一化路径；双模型按真实读音听写方言后再按语义整理普通话，单模型改为一次调用同时输出两类文本。
- 优化(lexicon): 柳州、杭州只把 JSON 主词表中最多 `30` 条相关词条写入启用阶段 Prompt；关闭、缺失、非法或无命中时按无词表模式继续，参考 CSV/XLSX 不参与运行时结果。
- 兼容(api): 新请求优先使用 `aiStages.listen/refine/single` 与 `defaults.stages`，旧扁平字段保留一个迁移周期；响应增加阶段 `enabled/contextEntryCount`，旧匹配/转换字段保持空值并弃用。
- 测试(ai): 补齐 schema 迁移、Options 字段显隐、阶段请求归一化、词表开关与相关词筛选、杭州 Prompt 和不再代码改写等回归覆盖。

## 2026-07-14

- 重构(bytedance-aidp): 台州话切换为原始听音直填诊断模式。后端仅接受严格 JSON 的 `listenText`，移除普通话转换、文本清洗、风险/复核、强制填入和自动填入分支；单段直填 textarea，批量仅暂存写入当前页 `regions[*].txt`，全程不保存、不提交、不切题。
- 测试(bytedance-aidp): 覆盖 `listenText` 原样保留、空/非法 JSON 不写入、单段直填、批量单次暂存写回、停止批量不二次写回，以及台州 Options 不显示自动填入开关。
- 重构(bytedance-aidp): 台州话识别改为每段单次 Qwen Omni 调用，默认 `qwen3.5-omni-plus`，仅允许切换至 `qwen3.5-omni-flash`；听音、普通话转换、风险判断和复核信息合并为同一 JSON。
- 优化(bytedance-aidp): Storage schema 升至 32；仅把旧台州听音模型迁移到全模态模型，旧两阶段 Prompt 与生成参数不复用。前端请求、AI 面板和 CSV 日志统一为 `omni` 模型、usage、cost、raw 与 debug 字段。
- 修复(bytedance-aidp): 最终普通话文本增加代码级标点白名单、数字汉字化、无效字符移除及明显口吃式单字/短词重复压缩；JSON 解析失败时强制人工复核并阻止自动填入。
- 测试(bytedance-aidp): 覆盖单次调用、Plus/Flash 白名单、60 秒上限、JSON 失败保护、风险阻断、文本清洗、schema 32 迁移、单 Omni 请求体、Options 映射和面板展示。

## 2026-07-13

- 新增(bytedance-aidp): 接入台州话独立 runtime、设置、后端路由、AI 调用日志和平台资料。
- 优化(bytedance-aidp): 将苏州话、金华话、台州话升级为同平台三方互斥，storage schema 升至 31 且台州默认关闭。
- 测试(bytedance-aidp): 覆盖台州话风险拦截、强制填入、批量待复核、三方互斥、Options、manifest、路由和日志数据集。
- 修复(bytedance-aidp): 停止台州话批量识别后，已在途结果改为保留待用户显式填入，不再自动暂存写回。
- 修复(bytedance-aidp): 台州话单段与行内自动填入在异步返回前校验题目/分段快照和输入框空值；拦截结果保留给用户显式填入。
- 修复(bytedance-aidp): 台州话风险布尔值仅接受原生 `true` 或去空格、忽略大小写的字符串 `"true"`，refine 标点收口为 `，。？！`；补齐 schema 30 升至 31 的三方互斥迁移边界，以及 DOM 直填与 `SubmitTempItemAnswer` 暂存写回的资料契约。

## 2026-07-15

- 重构(jinhua): 金华话从两阶段普通话翻译切换为单次 Qwen Omni 原始听音直填；业务结果只保留逐字符原样的 `listenText`。
- 重构(jinhua): 移除风险、待填入、强制填入与自动填入运行路径；批量只更新当前页选中段的 `regions[*].txt`，不修改 `ms`、不提交、不切题。
- 配置(jinhua): storage schema 升级至 `33`，旧两阶段配置仅作为非运行时兼容数据保留；Options 只展示原始听音 Omni 设置与调用诊断信息。
- 测试(jinhua): 覆盖单次 Omni 白名单与严格 JSON、逐字符直填、零选中批量、停止无二次写回及旧配置隔离。
- 修复(bytedance-aidp): 金华话与台州话的 Qwen Omni 改为直接输出最终转写纯文本；后端仅把字符串原始输出逐字符映射到扩展/API 兼容字段 `listenText`，不再 JSON 解析、trim、清洗、提取或猜测。所有非空字符串（包括意外的 JSON、Markdown、解释）均原样传递；空字符串或非字符串不写入，`raw.omni` 继续用于诊断，保存的自定义 Prompt 不迁移、不覆盖。
- 测试(bytedance-aidp): 覆盖金华话、台州话的纯文本与含空白输出逐字符映射、意外 JSON/Markdown/解释原样传递、空/非字符串不写入，以及默认和实际请求 Prompt 不再要求 JSON；保持 60 秒超时、模型白名单、thinking、usage/cost 回归覆盖。
- 修复(bytedance-aidp): 金华话与台州话的非空自定义 Prompt 改为原样作为完整 systemPrompt；后端只附带音频片段、时间范围和标注上下文，不再追加不翻译、原样听写、纯文本或其他输出格式规则。清空自定义 Prompt 后仍回退各自默认 Prompt，模型原始字符串继续逐字符映射到 `listenText`。
- 测试(bytedance-aidp): 覆盖自定义 Prompt 完整透传、用户消息仅含上下文且不含后端追加规则，并回归验证默认 Prompt 回退、原样响应映射、thinking、超时、模型白名单与费用统计。

## 2026-06-12

- 修复(data-baker-cvpc): 将“未填写补 Valid”改为平台直写，并保留失败提示与页面状态同步。
- 优化(data-baker-cvpc): 收口柳州话最终文本标准写法、普通话顺滑、近音纠错与标签识别。
- 修复(data-baker-cvpc): 单独语气词统一应用 Meaningless 预设，避免带标签填入失败时清空标注文本。
- 优化(data-baker-cvpc): 接入识别后自动填入、AI 价格估算、原始返回复制和中文日志表头。
- 优化(data-baker-cvpc): 完成画段建议、静音阈值、前后补偿、整音频预览与页面内应用。
- 新增(data-baker-cvpc): 落地柳州话运行时主词表、两阶段 AI 设置、批量识别和字段填入快捷键。
- 修复(data-baker-cvpc): 补齐 iframe 音频捕获、鉴权回退、早期挂载保护和提示屏蔽开关。
- 文档(data-baker-cvpc): 同步柳州话运行时、后端与平台参考资料。

## 2026-07-01

- 文档(bytedance-aidp): 初始化苏州话平台入口、页面结构与 Network 稳定参考。
- 新增(bytedance-aidp): 接入苏州话最小运行时、脚本启停、平台 AI 显隐和当前音频信息。
- 新增(bytedance-aidp): 建立苏州话详情页基础设置、AI 设置与快捷键入口。

## 2026-07-02

- 新增(bytedance-aidp): 接入苏州话分段建议、画段后自动应用、暂存直写和语言种类填充。
- 优化(bytedance-aidp): 补齐播放倍速、波形缩放、前后静音、静音阈值和连续段合并配置。
- 修复(bytedance-aidp): 收口平台 AI 显隐漂移、清空画段条件和默认 Space 快捷键迁移。
- 测试(bytedance-aidp): 补充分段控制、设置归一化、暂存直写与快捷键回归测试。

## 2026-07-03

- 新增(bytedance-aidp): 完成苏州话单段 AI 识别、批量识别、调用记录和结果写回。
- 优化(bytedance-aidp): 收口普通话听写、方言翻译、数字与标签格式规则。
- 修复(bytedance-aidp): 解决语言种类批量填充卡住和虚拟表格行定位问题。
- 文档(bytedance-aidp): 同步苏州话 Options 字段、Prompt 规则和写回边界。

## 2026-07-04

- 优化(bytedance-aidp): 统一苏州话前端样式、行内识别、AI 信息区与快捷键交互。
- 修复(bytedance-aidp): 修复设置页 AI 面板与快捷键空白，并统一脚本启停状态。
- 修复(bytedance-aidp): 单段普通话听写稿写回后主动失焦，避免焦点滞留输入框。

## 2026-07-06

- 新增(bytedance-aidp): 接入金华话运行时、后端 AI 推荐、批量识别和设置详情页。
- 优化(bytedance-aidp): 苏州话与金华话使用同平台互斥模型，启用一个脚本时自动关闭另一个。
- 新增(bytedance-aidp): 管理区增加切换账号入口，并通过扩展权限清理 AIDP 登录状态。
- 测试(bytedance-aidp): 补齐双脚本互斥、账号切换、设置保存和运行时注入测试。

## 2026-07-07

- 优化(bytedance-aidp): 统一金华话与苏州话设置页双栏布局、问号帮助、下拉框和多行输入交互。
- 修复(bytedance-aidp): 金华话独立读写 `jinhuaHelper`，不再读取苏州话配置键。
- 修复(bytedance-aidp): 为平台 AI 隐藏节点增加脚本 owner 标记，避免双脚本互相恢复。
- 修复(bytedance-aidp): 恢复金华话当前音频、单段识别、批量识别和分段建议的数据上下文。
- 优化(bytedance-aidp): 播放期间冻结助手重挂、上下文刷新和表格补挂，停止推进后再恢复。
- 修复(bytedance-aidp): 平台 AI 隐藏不再误伤题目头部暂存与重置操作区。

## 2026-07-08

- 新增(magic-data): 接入杭州话运行时、后端 AI 质检、共享采集和结果面板。
- 调整(magic-data): 杭州话说话人属性增加“音频是否是纯方言”判断，并接入 AI 输出与前端展示。
- 测试(magic-data): 补齐杭州话 storage、Options、popup、manifest、前端面板和后端路由回归测试。
- 优化(bytedance-aidp): 金华话听音阶段负责粗听文本与唱歌/非金华话判断，普通话阶段负责格式收口与自动填入决策。
- 新增(bytedance-aidp): 金华话 AI 推荐增加风险字段、强制填入当前段和批量待复核统计。
- 测试(bytedance-aidp): 补齐金华话后端、行内识别、风险拦截和强制填入测试。

## 2026-07-09

- 新增(magic-data): 接入杭州话 JSON 主词表、结构校验、运行时加载和无词表降级。
- 优化(options): 四脚本详情页统一使用共享下拉、快捷键面板和两栏设置工作台。
- 修复(options): 自定义下拉改为页面顶层浮层，并处理菜单滚动、页面滚动和响应式关闭策略。
- 优化(options): 功能面板恢复平台顺序编辑，系统管理收口后端、下载与 AI 日志入口。

## 2026-07-11

- 发布(1.0.0): 柳州话、苏州话、金华话和杭州话组成唯一公开脚本集合。
- 收口(extension): manifest、popup 和 Options 只保留三个平台四个脚本的运行时入口。
- 收口(backend): 后端只注册四脚本路由、管理员会话、下载中心和四脚本 AI 日志。
- 发布(build): manifest 版本为 `1.0.0`，发布流程固定生成版本化 CRX/ZIP 与两份更新元数据。
- 优化(options): 四脚本详情页恢复运行时完整设置，统一问号帮助、字段顺序、双栏布局和响应式控件。
- 优化(options): 平台地址按域名与路径拆行，侧栏、返回按钮和平台地址胶囊不显示文字下划线。
- 新增(options): 接入四脚本 defaults 接口和本地回退，保护未保存草稿并清理等于后端默认值的覆盖项。
- 修复(storage): 保留 AIDP 两阶段生成参数，支持 CVPC `db / ratio / value` 静音单位，统一杭州模型与识别枚举。
- 修复(options): 非法数字阻止整次保存，保存后重新读取归一化设置，确保刷新前后状态一致。
- 重构(options): 全局样式迁移为模块化 SCSS，按 foundation、components、layouts、pages 和 vendor 分层。
- 重构(test): 全部长期测试集中到根 `tests/`，并新增统一 `npm test` 与五个定向分区命令。
- 修复(test): 测试临时数据改用系统临时目录，Options 缓存固定写入忽略目录并自动清理。

## 2026-07-12

- 配置(domain): 默认 Server、扩展更新地址、发布下载基址和后端下载中心统一使用 `annotation-script-center.xiangtianzhen.store`。
- 清理(project): 删除非四脚本资料与过程入口，当前文件树只描述四脚本正式版本。
- 清理(storage): schema 固定为 30，不读取或迁移其他版本的后端地址。
- 文档(log): 重建修改总账，只保留四脚本及其共享基础设施记录。
- 文档(readme): 恢复项目首页、扩展、配置、平台、统一后端、Magic Data 与公共 AI 模块的完整使用说明。
- 发布(zip): 1.0.0 私有分发永久收口为单一版本化 ZIP，删除签名、自动更新元数据与旧发布配置。
- 优化(download): 下载中心只读取服务器 ZIP 目录索引，并说明 Chrome / Edge 开发者模式手动加载流程。
- 安全(config): 本地后端鉴权配置收口为管理员密码哈希与随机 JWT 密钥，私有发布文件不再参与项目流程。
- 文档(deploy): 补充 Windows 与 Linux 统一 Python 虚拟环境的创建、依赖安装、服务器更新和 CVPC 画段排障流程。

## 2026-07-15

- 修复(release): Windows ZIP 打包改为逐文件写入标准 `/` 路径，避免 Edge 拖拽导入时无法按 manifest 找到脚本。
- 测试(release): 新增实际归档回归测试，校验 ZIP 不含反斜杠路径且完整包含 manifest 引用脚本；支持临时源目录与输出目录隔离打包。
- 文档(release): 明确 ZIP 路径兼容性校验，并保留解压后加载作为标准安装方式。
- 优化(jinhua): 后端内置金华话转写 Prompt，支持使用者保存本地自定义 Prompt 完整覆盖默认主体，并保留 JSON `listenText` 传输契约。
- 测试(jinhua): 覆盖默认 Prompt、用户 Prompt 原样透传、空白覆盖回退和扩展请求序列化。
- 文档(jinhua): 同步金华话转写 Prompt、JSON 响应与本地覆盖边界。
- 优化(bytedance-aidp): 金华话与台州话的单次 Qwen Omni 设置新增可持久化的思考开关，默认关闭；开启时仅以严格布尔 `aiOmni.enableThinking: true` 透传，苏州话保持固定关闭，业务响应仍只展示 `listenText`。
- 测试(bytedance-aidp): 覆盖思考开关的 Options 显示与保存、扩展请求体、后端严格布尔解析及 Qwen 调用参数。
- 修复(bytedance-aidp): 公共 Qwen provider 不再忽略金华话、台州话显式开启的思考开关，现将其真实发送为百炼 `enable_thinking: true`；默认及非 `true` 值仍关闭，并保留参数不支持时移除后重试。
- 测试(bytedance-aidp): 覆盖 Qwen 最终请求体在显式开启时包含 `enable_thinking: true`。
- 发布(1.1.0): 金华话与台州话提升 Omni 输出文本质量：模型原始字符串原样映射至 `listenText`，非空自定义 Prompt 不再被后端追加规则覆盖，使用者可准确控制普通话转换与输出格式；本地 Edge 验收通过。
