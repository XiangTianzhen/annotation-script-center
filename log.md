## 2026-07-01（接入客家话运行时主词表并收口最终建议正字）
- 新增运行时主词表：
  - `platform-resources/magic-data/hakka-helper/backend/lexicon/hakka-lexicon.json`
  - 由用户上传的多段客家话 JSON 物化拼接为运行时主文件
  - 继续复用 `platform-resources/backend/business-lexicon.js` 做 schema 校验
- 调整 `platform-resources/magic-data/hakka-helper/backend/ai-lexicon.js`
  - 客家话词表状态补齐 `entries + rows` 运行时缓存
  - 新增只作用于最终建议文本的 `exact` 正字归一化
  - 正字归一化优先使用词表精确命中，其次使用少量高频兜底映射
  - 新增普通话按词表转客家话 helper，供 `mandarin_to_dialect` 识别转换链路复用
- 调整 `platform-resources/magic-data/hakka-helper/backend/ai-routes.js`
  - `mandarin_to_dialect` 当前真正接入“普通话识别 -> 词表转客家话 -> 三项质检”
  - 最终客家话建议文本只对以下字段做正字归一化：
    - `dialectTextCheck.suggestedValue`
    - `recommendations.dialectText`
    - `recognitionConvert.convertedDialectText`
  - `audioCheck.heardDialectText` 继续保留听音证据原文，不参与正字归一化
  - `data.lexicon.rewriteMode` 默认收口为 `exact`
- 调整 `platform-resources/magic-data/hakka-helper/backend/ai-client-qwen.js`
  - `LEXICON_REWRITE_MODE` 默认值改为 `exact`
  - `PIPELINE_MODE` 保留原始识别策略语义，避免 `recognition_convert` 被错误收口回 `two_stage`
- 调整 `platform-resources/magic-data/hakka-helper/backend/ai-response-schema.js`
  - 听音归一结果补齐 `recognizedMandarinText`
- 新增 / 更新测试：
  - `platform-resources/magic-data/hakka-helper/backend/ai-lexicon.test.js`
  - `platform-resources/magic-data/hakka-helper/backend/ai-routes.test.js`
- 同步更新：
  - `extension/sites/magic-data/hakka-helper/README.md`
  - `platform-resources/magic-data/hakka-helper/README.md`
  - `platform-resources/magic-data/hakka-helper/backend/README.md`
  - `platform-resources/magic-data/hakka-helper/backend/lexicon/README.md`

## 2026-07-01（接入 ByteDance AIDP 苏州话最小运行时）
- 新增 `extension/sites/bytedance-aidp/suzhou-helper/`
  - 新建 `content.js`
  - 新建 `README.md`
- 更新 `extension/manifest.json`
  - 注册 `https://aidp.bytedance.com/*` 内容脚本
- 更新 `extension/shared/constants.js`
  - 注册 beta 平台 `bytedanceAidp`
  - 注册 beta 脚本 `bytedanceAidpSuzhouHelper`
  - 增加默认平台设置与运行时可达性判断
- 更新 `extension/shared/storage.js`
  - 增加 `platforms.bytedanceAidp.scripts.suzhouHelper` 默认设置
  - 接入脚本启停保存
  - 持久化基础开关 `platformAiEnabled`
- 更新 `extension/options/options.html`
  - 新增 ByteDance AIDP 苏州话脚本基础设置面板
- 更新 `extension/options/options.js`
  - 新增 `开关平台AI功能` 的读取、回填、保存与状态展示
- 更新 `extension/popup/popup.js`
  - 新增 ByteDance AIDP 路由识别与脚本状态说明
- 新增 / 更新测试：
  - `extension/shared/constants.release.test.js`
  - `extension/shared/storage.bytedance-aidp.test.js`
  - `extension/options/options-bytedance-aidp-ui.test.js`
  - `extension/sites/bytedance-aidp/suzhou-helper/content.test.js`
- 同步更新：
  - `extension/README.md`
  - `docs/platforms-index.md`
  - `platform-resources/bytedance-aidp/README.md`
  - `platform-resources/bytedance-aidp/suzhou-helper/README.md`

## 2026-07-01（补细 ByteDance AIDP 苏州话详情页结构）
- 更新 `platform-resources/bytedance-aidp/suzhou-helper/README.md`
  - 补充计划中的基础设置项 `开关平台AI功能`
  - 明确两个可隐藏平台 AI 板块：
    - `.trigger-wrapper-RlG7Dx`
    - `.insight-container-Hn0Gna`
  - 补充详情页四类关键工作区块：左侧任务列表、波形区、`是否保留` 单选区、分段表格区
- 更新 `platform-resources/bytedance-aidp/suzhou-helper/page-structure/README.md`
  - 收口当前覆盖面为“关键工作区块 + 可隐藏平台 AI 板块”
- 更新 `platform-resources/bytedance-aidp/suzhou-helper/page-structure/01-mark-v3-detail.md`
  - 将详情页从泛化骨架补细为可执行的页面分区说明
  - 同步记录截图中确认的顶部动作区、任务列表区、波形区、`是否保留` 单选区和分段表格区
  - 明确后续 `开关平台AI功能` 只应隐藏平台 AI 板块，不应影响核心标注工作区

## 2026-07-01（初始化 ByteDance AIDP 苏州话平台资料）
- 新增平台资料目录：
  - `platform-resources/bytedance-aidp/`
  - `platform-resources/bytedance-aidp/network/`
  - `platform-resources/bytedance-aidp/page-structure/`
- 新增脚本资料目录：
  - `platform-resources/bytedance-aidp/suzhou-helper/`
  - `platform-resources/bytedance-aidp/suzhou-helper/network/`
  - `platform-resources/bytedance-aidp/suzhou-helper/page-structure/`
- 当前首轮只完成：
  - 列表首页 `/management/task-v2?page=1` 的公共资料骨架
  - `mark-v3` 详情页的苏州话脚本资料骨架
  - 平台与脚本入口同步到 `platform-resources/README.md`、`docs/platforms-index.md`
- 当前仍保持边界：
  - 不创建 `extension/sites/bytedance-aidp/`
  - 不补保存、提交、领取、批量流转写链路
  - 未能安全确认的请求与 DOM 细节统一留在 `风险 / 未确认项`

## 2026-07-01（superpowers 过程文档目录收口）
- 将 `docs/superpowers/` 下现有 `plans/`、`specs/` 文档迁移到仓库根目录 `.superpowers/`
- 同步更新 `AGENTS.md`，明确后续这类过程文档统一放 `.superpowers/`，不放 `docs/`

## 2026-06-12（统一 Magic Data 原始输出按钮空状态交互）
- 调整 `extension/sites/magic-data/hakka-helper/assistant-panel.js`
  - `显示 AI 原始输出` 按钮改为仅在加载中禁用
  - 当前条尚无 AI 返回时不再置灰，点击后统一提示“暂无 AI 原始输出”
- 调整 `extension/sites/magic-data/minnan-helper/assistant-panel.js`
  - 与客家话助手统一原始输出按钮空状态交互
  - 保持无结果可点击，避免和柳州话助手交互口径不一致
- 新增 / 更新测试：
  - `extension/sites/magic-data/hakka-helper/assistant-panel.test.js`
  - `extension/sites/magic-data/minnan-helper/assistant-panel.test.js`
- 同步更新：
  - `extension/sites/magic-data/README.md`
  - `extension/sites/magic-data/hakka-helper/README.md`
  - `extension/sites/magic-data/minnan-helper/README.md`
  - `platform-resources/magic-data/README.md`

## 2026-06-12（优化 data-baker-cvpc 未填写补 Valid 为平台直写）
- 调整 `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.js`
  - `fillUnresolvedSegmentsValid()` 从旧的“按左侧段号逐段切换并点击 Valid”改为一次性构造 `save_increment`
  - 当前只补当前音频里未填写有效性的段为 `是（Valid）`
  - 已填 `Valid / Invalid` 保持不变，不再覆盖已填 `Invalid`
  - 补写或复用段级有效性字段时，当前会把 `是否有效（Valid or Not）` 规范到 `ann_data.attrs[0]`，避免平台把它识别成后置字段
  - 当前“是否已填写”的判定也同步收紧为优先检查段级 `ann_data.attrs[0]`；后置 `Valid` 会按未填补写修正到首位，后置 `Invalid` 继续保留为 `Invalid`
  - `fillUnresolvedSegmentsValid()` 当前改为直接按 `annotation/annos` 原始 `data[]` 顺序构造 `update/web_snapshot`，不再把原始响应缺失索引套到按时间排序后的实例行上，避免 entry 后追加的早时段行补错
  - 当前补写 `Valid` 时会优先复用模板 radio 选项里的 `unique_id`，模板缺失时回退使用 CVPC 已知 `Valid` 选项 id，避免写出只有 `name` 没有 option `unique_id` 的“已填”假状态
  - 缺少鉴权快照或平台保存失败时直接报错，保持 fail closed，不回退旧 DOM 补写链路
- 调整 `extension/sites/data-baker-cvpc/liuzhou-helper/content.js`
  - `未填写补 Valid` 成功且 `filledCount > 0` 时自动刷新当前页一次
  - 无需补写或补写失败时不刷新
- 新增 / 更新测试：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/data-api.test.js`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/content.test.js`
- 同步更新：
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`

## 2026-06-12（优化柳州话最终文本标准写法与普通话顺滑）
- 调整 `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - `文本修正` 阶段新增“只改最终答案层”的后处理边界，不改 `audioDialectText / candidateAlternatives`
  - 新增柳州话最终标准写法归一化，首批固定收口：
    - `去 -> 克`
    - `哩 -> 滴`
    - `更要紧 -> 哏要紧`
    - `更子 -> 哏子`
  - 新增普通话顺滑保守去结巴：
    - `这个这个 -> 这个`
    - `辣辣辣辣的 -> 辣的`
    - 保留 `吃得，吃得` 这类未明确应删除的重复
- 新增后端定向测试：`platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
- 同步补齐 `platform-resources/data-baker-cvpc/liuzhou-helper/README.md` 与 `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`

## 2026-06-12（文档收口与日志乱码修复）
- 收口 `README.md`、`extension/README.md`、`config/README.md` 与 `platform-resources/backend/README.md` 的文档职责
- 将项目数据下载密码与 JWT Secret 配置教程迁移到 `config/README.md`
- 删除未再使用的隐私政策文件
- `log.md` 自 2026-06-11 起的乱码历史已按 Git 提交记录重建为可读摘要

## 2026-06-12（修复客家话助手 `profileConfig is not defined`）
- 修复 `platform-resources/magic-data/hakka-helper/backend/ai-routes.js`
  - `review-current` 响应组装阶段错误引用了当前作用域不存在的 `profileConfig.lexiconRewriteMode`
  - 已改为使用当前函数内实际存在的 `config.lexiconRewriteMode`
- 影响范围
  - 客家话助手右侧 AI 结果区原先会因后端抛 `ReferenceError` 而显示 `internal-error: profileConfig is not defined`
  - 修复后该错误不再由这处变量名回归触发

## 2026-06-12（README 补充服务器更新部署说明）
- 补充根 `README.md` 的服务器部署入口：
  - 新增“服务器日常更新”
  - 新增“扩展发布产物更新”
  - 明确区分“后端代码更新”和“静态下载包更新”
- 补充 `platform-resources/backend/README.md` 的详细部署流程：
  - 首次部署
  - 日常更新
  - 更新后检查清单
- 当前口径明确：
  - 本仓库服务器更新默认不是 `npm install`，而是 `git pull + env 复核 + pm2 restart + 接口检查`
  - 只替换 `dist/` 静态下载产物时，通常不需要重启后端

## 2026-06-12（config 扁平化与平台参考文档标准化）
- 本轮把两份单文件配置直接收口到 `config/` 根级：
  - `config/package-crx-release.json`
  - `config/aliyun-bailian-model-pricing.json`
- 已同步修改发布脚本与后端读取路径：
  - `scripts/package-crx-release.js`
  - `scripts/sync-local-build-meta.js`
  - `platform-resources/backend/ai/model-catalog.js`
  - `platform-resources/backend/ai/model-pricing.js`
- 已删除空目录：
  - `config/release/`
  - `config/pricing/`
- 已把 `platform-resources/**/(network|page-structure)` 的稳定参考文档统一到两层模板
- 已清理主参考体系中的过程型文件，并补齐缺失索引与导航更新

## 2026-06-11 至 2026-04-24（历史记录恢复说明）
- 旧版 `log.md` 这段历史在编码转换中发生乱码。
- 以下内容按 Git 提交历史重建为可读摘要，保留时间顺序与主要改动主题，不再保留乱码正文。

## 2026-06-11（历史记录重建摘要）
- 修复(data-baker-cvpc): 单独标签统一应用Meaningless预设
- 优化(ai): 补齐更多前端面板人民币估算展示
- 修复(data-baker-cvpc): 避免带标签填入失败时清空标注文本
- 优化(lexicon): 统一展示词表状态与模式
- 优化(aishell): 收口越南语助手一致文本与费用展示
- 修复(data-baker-cvpc): 带标签填入优先回放原生标签按钮
- 修复(aishell): 修复越南语助手识别报错与默认Prompt回退
- 修复(data-baker-cvpc): 增强标签有效性联动与结构化写入稳定性
- 新增(aishell-tech): 接入越南语助手正式版
- 优化(backend): 统一 AI 服务消耗记录与人民币估算
- 优化(data-baker-cvpc): 调整unique_id冲突提示文案
- 修复(data-baker-cvpc): 收口单独语气词结果展示
- 优化(data-baker-cvpc): 统一 AI 日志中文表头与消耗展示
- 优化(data-baker-cvpc): 增加识别后自动填入与语气词无效预设
- 优化(data-baker-cvpc): 增加 AI 价格估算与原始返回复制
- 优化(data-baker-cvpc): 收口Qwen风控错误提示
- 修复(data-baker-cvpc): 单独语气词转Meaningless并清理标签空格
- 优化(data-baker-cvpc): 完善柳州话近音纠错提示与文档
- 修复(data-baker-cvpc): 补齐柳州话标签识别与助手展示
- 优化(data-baker-cvpc): 收口Failed to fetch错误提示
- 修复(data-baker-cvpc): 修正AI信息乱码并优化fetch失败提示
- 优化(data-baker-cvpc): 调整音频过期提示并增加刷新按钮
- 优化(data-baker-cvpc): 增强柳州话失败态兜底与标签快捷键
- 优化(data-baker-cvpc): 收口柳州话标签联动写回

## 2026-06-10（历史记录重建摘要）
- 新增(闽南语词表): 同步 DataBaker 与 Aishell 主词表
- 优化(data-baker-cvpc): 支持分段前后补偿时长配置
- 修复(data-baker-cvpc): 修复柳州话批量写回全空白段场景
- 修复(data-baker-cvpc): 补回AI原始返回内容展示
- 优化(data-baker-cvpc): 调整柳州话AI区文案与信息展示
- 优化(data-baker-cvpc): 补齐柳州话画段自动应用配置与验证
- 优化(data-baker-cvpc): 收口柳州话批量写回误判
- 优化(data-baker-cvpc): 收口柳州话批量写回校验与按钮样式
- 优化(data-baker-cvpc): 新增柳州话批量识别并自动填入
- 修复(lexicon): 提高缺词表提示层级
- 优化(data-baker-cvpc): 应用当前建议后自动刷新页面
- 修复(data-baker-cvpc): 绑定应用画段的浏览器fetch上下文
- 优化(data-baker-cvpc): 应用当前建议优先直写保存接口
- 优化(data-baker-cvpc): 合并娃仔与娃崽词条
- 优化(data-baker-cvpc): 改为后端整音频画段预览
- 新增(data-baker-cvpc): 落地柳州话运行时主词表
- 优化(data-baker-cvpc): 增加画段空结果整音频兜底预览
- 优化(data-baker-cvpc): 增强柳州话画段静音检测稳定性
- 优化(data-baker-cvpc): 调整柳州话静音阈值单位与默认值
- 优化(data-baker-cvpc): 完成柳州话画段建议与页面内应用

## 2026-06-09（历史记录重建摘要）
- 优化(lexicon): 缺词表时改为前端右下角提示
- 测试(options): 补充beta刷新行为校验
- 修复(magic-data): 调整全自动无变更提交与快捷键控制
- 优化(data-baker-cvpc): 收紧AI导出可见性并展示token
- 优化(options): 收起后端根地址配置展示
- 优化(lexicon): 调整词表提示与缺失降级规则
- 新增(lexicon): 切换业务词表到JSON主格式
- 优化(backend): 补充AI日志token汇总并隐藏beta导出项
- 优化(options): 统一三套后端根地址切换
- 优化(backend): 支持下载地址按环境变量返回
- 优化(data-baker-cvpc): 增加字段填入快捷键并收紧控制台观察
- 优化(data-baker-cvpc): 收口柳州话双文本并接入AI日志
- 优化(data-baker-cvpc): 统一柳州话脚本按钮配色
- 优化(data-baker-cvpc): 修正柳州话脚本按钮背景样式
- 优化(data-baker-cvpc): 调整柳州话脚本附加信息样式
- 优化(data-baker-cvpc): 调整柳州话脚本二次界面样式
- 优化(data-baker-cvpc): 重排柳州话脚本界面
- 优化(data-baker-cvpc): 移除柳州话 clip-cache 与 fun-asr
- 优化(data-baker-cvpc): 当前段识别改为 base64 音频输入
- 修复(data-baker-cvpc): 删除 clip URL 可达性探测
- 优化(data-baker-cvpc): 调整柳州话临时音频上传与10分钟清理策略
- 优化(data-baker-cvpc): 接入柳州话两阶段 AI 设置与分段推荐
- 文档(workflow): 补齐后端 PM2 启动命令
- 优化(data-baker-cvpc): 收口柳州话脚本原生布局
- 优化(data-baker-cvpc): 收口柳州话脚本 AI 区布局

## 2026-06-08（历史记录重建摘要）
- 优化(data-baker-cvpc): 调整柳州话脚本字段挂载与补Valid
- 优化(data-baker-cvpc): 调整柳州话脚本布局并接入当前段音频缓存
- 修复(options): 补齐项目数据下载全部供应商选项
- 优化(data-baker-cvpc): 折叠音频地址展示
- 修复(data-baker-cvpc): 捕获iframe音频地址
- 优化(backend): 收口 AI 配置并清理废弃 provider
- 修复(labelx): 恢复快判统计冲突跳过
- 修复(data-baker-cvpc): 修复音频 meta 鉴权回退
- 修复(admin): 修正仪表盘任务池占用与 job 满载回收
- 修复(labelx): 收紧快判统计双键槽位校验
- 修复(magic-data): 修正AI质检Job结果解包
- 修复(data-baker-cvpc): 避免面板早期挂载空指针
- 优化(data-baker-cvpc): 悬浮窗展示当前音频地址
- 优化(data-baker-cvpc): 拆分提示屏蔽双开关
- 优化(data-baker-cvpc): 补充暂停状态提示屏蔽
- 修复(data-baker-cvpc): 接通柳州话音频获取
- 修复(data-baker-cvpc): 兼容旧版Shift数字快捷键
- 新增(data-baker-cvpc): 增加Tab限制提示屏蔽开关
- 优化(options): 统一快捷键面板并将默认快捷键置空

## 2026-06-05（历史记录重建摘要）
- 调整(aishell-tech): 恢复三段独立AI请求链路
- 优化(aishell-tech): 合并Omni终判并改为规则优先转换
- 新增(data-baker-cvpc): 补齐柳州话脚本接线
- 新增(data-baker-cvpc): 接入柳州话脚本 beta 并同步并行改动
- 优化(aishell): 收口候选转写与Omni判断链路
- 优化(aishell): 恢复候选转写AI并补齐差异比较链路
- 优化(aishell): 收口严格词表转写规则
- 优化(aishell): 改为文本模型生成词表转写文本
- 优化(aishell): 收口三文本对照并增强推荐结果展示
- 优化(aishell): 升级音频优先候选校正策略
- 新增(aishell): 增加音频优先识别策略
- 优化(ai): 统一前端并发补位语义与总占用展示
- 文档(data-baker-cvpc): 初始化首轮采集资料
- 优化(options): 统一闽南语助手AI设置布局与并发默认值
- 优化(aishell-tech): 拆分批量识别按钮
- 修复(aishell-tech): 对齐闽南语词表与AI默认标准
- 修复(release): 恢复CRX打包命令可用

## 2026-06-04（历史记录重建摘要）
- 修复(config): 收口本地beta口令同步与统一文档
- 修复(options): 调整beta隐藏入口到品牌图片
- 修复(release): 恢复beta默认隐藏策略
- 优化(release): 切换本地直加载与beta默认测试版
- 优化(release): 收口 beta 打包配置与新服务器默认地址
- 优化(release): 调整 beta 打包为 zip 并支持单命令双产物
- 新增(beta): 增加双构建与隐藏解锁能力
- 文档(beta): 补充 beta 构建与隐藏解锁设计
- 优化(labelx): 调整局部覆盖导出并增加仪表盘日志

## 2026-06-03（历史记录重建摘要）
- 优化(options): 调整功能面板整块拖拽交互

## 2026-06-02（历史记录重建摘要）
- 优化(options): 调整功能面板三列布局与双轨拖动交互
- 优化(options): 精修功能面板与详情工作台
- 优化(options): 重排公开卡片与详情页三板块布局
- 优化(options): 收口公开下载页与详情页布局
- 优化(options): 收口公开中心入口与下载中心版本选择
- 优化(backend): 模型池改为999总容量语义
- 优化(options): 仪表盘仅保留模型池占用
- 修复(backend): 限制仪表盘统计窗口避免OOM
- 优化(options): 合并系统仪表盘统计与运行日志

## 2026-06-01（历史记录重建摘要）
- 优化(options): 调整侧栏使用人与详情页左右分栏
- 优化(options): 收口系统管理保存交互与详情双栏
- 优化(options): 收口工作台细节交互与展示
- 优化(options): 修正页面宽度自适应
- 优化(options): 调整浅色后台视觉色板

## 2026-05-31（历史记录重建摘要）
- 优化(options): 重做工作台视觉并升级到0.4.0
- 新增(options): 重构系统管理后台与统一下载鉴权
- 发布: v0.3.7
- Revert "优化(ai): 调整统一队列容量与排队超时清理"
- Revert "上传脚本"
- Revert "优化(ai): 临时关闭统一队列排队超时阈值"

## 2026-05-29（历史记录重建摘要）
- 优化(ai): 临时关闭统一队列排队超时阈值
- 优化(ai): 调整统一队列容量与排队超时清理
- 优化(ai): 统一 jobs 默认链路与按模型全局队列

## 2026-05-28（历史记录重建摘要）
- 新增(ai-log): 增加统一AI请求记录导出入口
- 新增(ai-log): 补齐全项目AI调用日志与统计
- 新增(backend): 增加百炼模型统一注册与双通道调用
- 优化(aishell-tech): 调整默认AI配置为速度优先
- 优化(aishell-tech): 切换希尔贝壳前端展示并收口错误提示
- 调整(ai): 统一超时为60秒并清理临时测试文件
- 修复(aishell-tech): 避免request.close误判推荐断连
- 调整(aishell-tech): 统一同步超时为120秒
- 优化(ai): 全项目固定关闭thinking并拆出Aishell独立Omni客户端
- 重构(aishell-tech): 独立闽南语助手后端同步推荐链路
- 优化(aishell-tech): 增强网络失败后的 health 探测
- 修复(aishell-tech): 增强闽南语助手网络诊断与本机回退
- 优化(aishell-tech): 增强批量失败诊断信息
- 新增(aishell-tech): 增加平台专属AI调用CSV
- 文档(aishell-tech): 补充批量切条误判根因
- 修复(aishell-tech): 批量识别改为整包扫描
- 修复(aishell-tech): 收紧简体推荐并优化批量保存链路
- 优化(aishell-tech): 补齐AI请求平台账号透传
- 优化(aishell-tech): 合并闽南语助手嵌入式面板改造
- 修复(aishell-tech): 修正批量切条并接入快捷键
- 修复(aishell-tech): 切回原生 SaveShortMark 批量保存
- 新增(ai-log): 补齐 Task21 AI 调用元数据
- 优化(aishell-tech): 放慢批量保存节奏
- 修复(aishell-tech): 修正乱序批量保存完成判定
- 新增(ai-log): 接入 DataBaker 与 Aishell 前端 AI 调用元数据
- 修复(aishell-tech): 补回批量调度器运行时导出
- 增强(aishell-tech): 支持并发识别与双策略模式
- 增强(aishell-tech): 接入用户触发后的真实保存
- 增强(aishell-tech): 补齐识别与批量识别实际操作
- 重构(aishell-tech): 收敛为最小悬浮窗识别版
- 新增(ai-log): 增加全局 AI 调用使用人设置
- 新增(ai-log): 增加前端 AI 使用人元数据助手
- 文档(ai-log): 增加 AI 调用日志实现计划
- 文档(ai-log): 新增 AI 调用日志设计文档
- 修复(aishell-tech): 补齐默认配置并调整面板挂载
- 优化(data-baker): 收口 data 目录 CSV 与 merge 逻辑
- 优化(data-baker): 收口 data 目录持久化写入逻辑
- 优化(data-baker): 收口 data 目录 upload 与 history 逻辑
- 优化(data-baker): 收口 data 目录下载脚本与样例
- 优化(data-baker): 接入共享下载 core
- 优化(data): 接入 LabelX 快判共享下载 core
- 优化(data): 接入 LabelX 转写共享下载 core
- 新增(aishell-tech): 接入闽南语助手运行时与独立后端
- 优化(alibaba-labelx): 迁移快判 AI 到统一 framework
- 优化(alibaba-labelx): 迁移转写 AI 到统一 framework
- 优化(abaka-ai): 迁移 Task21 到统一 AI framework
- 优化(magic-data): 迁移客家话助手到统一 AI framework
- 优化(magic-data): 迁移闽南语助手到统一 AI framework
- 文档(aishell-tech): 同步正式接入准备态
- 优化(data-baker): 接入统一AI framework adapter
- 新增(backend): 搭建AI framework骨架
- 文档(architecture): 增加platform-resources AI框架迁移基线

## 2026-05-27（历史记录重建摘要）
- 合并 PR #2: Aishell Tech 平台资料初始化
- 移除06-sensitive-operations.md
- fix
- Aishell Tech 平台资料初始化
- 修复(magic-data): 改回客家话助手 prompt 简体约束
- 修复(magic-data): 统一客家话助手简体化输出

## 2026-05-26（历史记录重建摘要）
- 文档(magic-data): 收尾 v0.3.6 双助手规则
- 修复(magic-data): 修复识别策略保存回滚
- 修复(magic-data): 优化 AI 面板与审核页填入
- 修复(magic-data): 修复 AI 面板配置保存
- 修复(magic-data): 支持客家话助手审核页
- 修复(magic-data): 修复客家话助手 AI 配置保存
- 修复(magic-data): 对齐客家话助手后端输出
- 修复(magic-data): 对齐客家话助手新版面板
- 优化(magic-data): 落地客家话模型评测默认配置

## 2026-05-25（历史记录重建摘要）
- 优化(magic-data): 拆分识别策略并同步双助手
- 优化(magic-data): 增加闽南语识别转换模式

## 2026-05-24（历史记录重建摘要）
- 修复(magic-data): 稳定闽南语助手交互状态
- 发布: v0.3.6
- 文档(magic-data): 补充playwright-edge交互复测记录

## 2026-05-23（历史记录重建摘要）
- 优化(magic-data): 精简闽南语助手建议展示
- 优化(magic-data): 优化闽南语助手行内建议
- 优化(magic-data): 调整闽南语助手结果布局
- 优化(magic-data): 调整闽南语助手三项质检
- 修复(magic-data): 限制同平台只启用一个助手

## 2026-05-22（历史记录重建摘要）
- 新增(magic-data): 完善闽南语助手 AI 配置
- 文档(readme): 提交当前未完成改动
- 优化(platform-resources): 统一平台资料目录结构
- 优化(magic-data): 统一平台资料目录结构

## 2026-05-21（历史记录重建摘要）
- 新增(magic-data): 接入闽南语助手并拆分平台结构
- 优化(脚本中心): 更新客家话与闽南语助手名称
- 文档(workflow): 更新项目协作规则
- release: v0.3.5
- fix(data-baker): show ai config and elapsed time in batch panel
- fix(data-baker): tune concurrency by ai model and classify funasr errors
- fix(data-baker): allow direct qwen concurrency by default
- fix(data-baker): retry ai panel mount without extension error
- chore: bump version to 0.3.4
- docs: finalize task21 assistant documentation
- fix(data-baker): handle qwen burst rate sse errors
- fix(data-baker): show raw ai debug modal
- fix(data-baker): expose raw ai debug for failed recommendations
- fix: show task21 statistics entry on data list
- fix(data-baker): restore legacy omni fast path
- fix(data-baker): restore ai recommend panel buttons
- fix(data-baker): add batch request dedupe tracing
- fix(data-baker): resolve batch tasks scope error
- fix: align export csv statistic field names
- fix(data-baker): restore direct ai requests with 120s timeout
- feat: add force replace stats upload
- fix(data-baker): cap async jobs and expose raw parse debug
- fix(data-baker): shorten ai job ttl to one minute
- fix(settings): set default ai timeout and tts clear delay to one minute
- fix(data-baker): use async jobs for funasr batch autofill

## 2026-05-20（历史记录重建摘要）
- feat(backend): use rest provider for single funasr calls
- fix(data-baker): raise qualified autofill concurrency limit
- fix(data-baker): normalize funasr output to simplified chinese
- fix(data-baker): diagnose and improve funasr batch concurrency
- fix(data-baker): show ai model selector for single mode
- refactor(data-baker): consolidate ai service and improve funasr concurrency
- fix(backend): enforce utf8 for funasr python output
- feat(data-baker): use listen and compare model selectors
- refactor(backend): introduce shared ai provider foundation
- chore(backend): rename funasr requirements file
- docs(backend): simplify funasr venv deployment
- fix: use unified backend python venv
- feat: refine task21 removed text multiset rules
- docs(data-baker): move funasr deployment to root readme
- fix(data-baker): update ai mode live ui and funasr deployment docs
- fix(data-baker): refine ai mode model settings ui
- chore: update v0.3.3 zip artifact
- fix(data-baker): restore omni default and use python fun-asr client
- fix(data-baker): simplify ai pipelines and add rate limiting

## 2026-05-19（历史记录重建摘要）
- feat: refine task21 removed text rules
- fix: write task21 monaco editor answers
- feat: refine task21 assistant annotation rules
- fix: support task21 assistant editor filling
- fix: fill task21 assistant text fields
- feat: merge databaker export uploads
- feat: improve task21 assistant ai panel

## 2026-05-18（历史记录重建摘要）
- fix: encode labelx asr download filenames
- fix: filter labelx asr statistics downloads by supplier
- release: publish annotation-script-center v0.3.3
- style: use options hero visual as background
- feat: add extension brand icon and hero visual
- feat: fill DataBaker AI results by completion order
- fix: stream DataBaker AI results into sequential autofill
- 删除依赖文件
- feat: add concurrent DataBaker qualified AI preanalysis
- feat: add DataBaker batch qualified AI autofill
- fix: mount DataBaker qualified autofill in filter bar
- feat: add Abaka AI network capture shell
- fix: position DataBaker qualified autofill button
- feat: add DataBaker qualified AI autofill
- fix: correct Abaka AI Bailian vision model names
- fix: repair LabelX ASR legacy CSV classification
- docs: document platform API endpoints and unify duration headers
- fix: unify effective duration CSV headers
- fix: simplify DataBaker AI text after lexicon rewrite
- docs: add server restart notes to root README
- fix: normalize DataBaker AI output to simplified Chinese
- fix: align Abaka AI models with Bailian docs
- feat: add Abaka AI two stage AI analysis
- feat: add Abaka AI AI debug settings
- fix: add script download center link in options
- feat: refine Abaka AI Task21 inline AI analysis

## 2026-05-17（历史记录重建摘要）
- feat: add Abaka AI Task21 AI analysis panel
- feat: add Abaka AI save and submit shortcuts
- fix: make Abaka AI specify shortcuts idempotent

## 2026-05-16（历史记录重建摘要）
- feat: add Abaka AI same font shortcuts
- docs: align Abaka AI task network layout
- docs: reorganize Abaka AI task resources
- docs: capture Abaka AI remaining flow gaps
- docs: update Abaka AI claim and i18n captures
- docs: capture Abaka AI skipped dropped restore flows
- docs: expand Abaka AI action network captures
- docs: reorganize Abaka AI platform resources
- docs: deepen Abaka AI Task21 capture notes
- docs: document Abaka AI Task21 page structure
- feat: add Abaka AI network capture shell

## 2026-05-15（历史记录重建摘要）
- 发布脚本增加ZIP压缩包
- 瘦身项目规则并新增平台索引
- 整理项目文档结构和指令索引
- 补齐转写通用提交快捷键
- 抽取阿里LabelX通用提交快捷键
- 优化快判AI官方判断规则
- 调整快判AI工具栏并新增提交快捷键
- 修复阿里LabelX通用音频控制
- 修复快判AI联网搜索变量错误

## 2026-05-14（历史记录重建摘要）
- 增强快判AI搜索辅助和快捷键

## 2026-05-13（历史记录重建摘要）
- 统一ASR AI思考开关显式传参
- 完善ASR语音AI设置默认配置
- 重构ASR语音AI隐藏设置部件
- 整理快判脚本级AI高级设置
- 收口快判AI答案枚举和格式差异规则
- 升级快判AI双模型与上文理解
- 修复快判AI真实链路无返回提示

## 2026-05-12（历史记录重建摘要）
- 修复快判差异视图兼容新版内容区
- 新增阿里转写当前题AI推荐
- docs: 调整协作规则并清理旧功能分支
- docs: 调整协作规则为 main 单工作区流程
- chore: 发布 0.3.1 Magic Data AI 质检助手
- Merge remote-tracking branch 'origin/feature/magic-data-ai-review-debug'
- style: 支持 Magic Data 质检卡片高度调整
- style: 优化 Magic Data 质检卡片样式
- fix: 调整 Magic Data 质检结果区挂载位置

## 2026-05-11（历史记录重建摘要）
- fix: 优化 Magic Data 质检 UI 与快捷键设置
- feat: 调整 Magic Data AI 质检展示与设置
- fix: 修复 Magic Data 面板显示并接入接口采集
- feat: 接入 Magic Data AI 复核调试
- docs: 清理 AGENTS 旧 main 默认口径
- docs: 修正任务暗号与 main 默认规则冲突
- docs: 增加任务暗号与默认分支规则
- docs: 增加并行开发与动态版本规则
- docs: 收尾 0.3.0 状态说明
- docs: 记录 CRX 企业托管自动安装未完成模块
- chore: 允许追踪 CRX 发布产物
- chore: 清理 zip 发布路线并收敛 CRX 发布
- chore: 新增脚本中心 CRX 企业发布流程
- chore: 新增脚本中心发布清单生成脚本
- fix: 分离标贝易采原始JSON并修复供应商下载
- fix: 修复后台脚本共享模块加载路径
- fix: 修复后端地址隐藏入口显示逻辑
- docs: 完善项目数据下载私有配置说明
- fix: 修复项目数据下载隐藏入口与后台脚本加载
- feat: 新增项目数据下载鉴权与供应商筛选

## 2026-05-10（历史记录重建摘要）
- 同步 README 文档口径与 AGENTS 规则
- 更新 AGENTS 记录 0.2.11 稳定统计规则
- 优化上传统计悬浮窗位置和高度
- 优化上传统计进度悬浮窗样式
- 修正待补任务名称上传和进度条样式
- 修正统计跳过完整判断和进度宽度
- 修正统计失败判断并保留部分成功数据
- 增强统计导出完整性校验和断点跳过
- 修正统计 CSV 中文乱码和健康值合并
- 修正统计 CSV 清洗并统一快判进度上传
- 修正转写统计并发上限和供应商总表输出
- 修正转写统计并发显示和供应商识别
- 修正 0.2.11 统计总表供应商列并增加上传进度
- docs: 同步 LabelX 统计文档口径
- docs: 补充 LabelX 筛选和批量保存测试
- docs: 补充 LabelX 转写审核驳回链路
- 修正 0.2.11 供应商列策略并补全 LabelX 导出数据

## 2026-05-09（历史记录重建摘要）
- 升级 0.2.11 并支持 LabelX 按供应商拆分统计
- docs: 补充 LabelX 转写标注链路采集
- docs: 补充 LabelX 转写详情页采集
- docs: 补充 LabelX 转写采集资料
- docs: 更新仓库协作规则
- fix: 处理扩展上下文失效
- feat: 上传标贝易采导出数据
- refactor: 强制启用统计上传配置
- refactor: 统一后端地址配置入口
- fix: 修复转写审核统计字段合并
- fix: 限制转写统计请求数量

## 2026-05-08（历史记录重建摘要）
- fix: 修复转写取数并恢复轻量设置
- docs: 补录转写网络请求文档
- fix: 修复转写统计取数逻辑
- refactor: 理清转写统计前后端边界
- feat: 新增转写统计导出
- docs: 新增 Magic Data 平台前置采集资料
- refactor: 对齐转写工具栏页面布局
- chore: 提交 0.2.10 扩展压缩包
- chore: 保持 0.2.10 修复版本
- fix: 修复转写注入并删除设置功能
- docs: 更新版本与打包发布规则
- refactor: 重写 ASR 转写轻量脚本
- 调整标贝易采命名与脚本中心配置入口
- refactor: 删除转写旧批量与自动化功能
- refactor: 收口 ASR 转写基础功能

## 2026-05-07（历史记录重建摘要）
- docs: 明确网页端与 Codex 协作规则

## 2026-05-03（历史记录重建摘要）
- docs: 文档增加通用性

## 2026-05-02（历史记录重建摘要）
- docs: 文档增加通用性

## 2026-04-30（历史记录重建摘要）
- 重做 DataBaker 快捷键焦点恢复策略
- 修复 DataBaker 被动焦点恢复影响音频播放

## 2026-04-29（历史记录重建摘要）
- 修复 DataBaker 总表导出分页大小选择
- 优化 DataBaker 总表全量导出分页
- 改为拦截 DataBaker 原生请求导出数据
- 删除 DataBaker 后端自动导出链路
- 改为 DataBaker 前端同源导出总表
- 补充 DataBaker 导出登录契约
- 修复 DataBaker 焦点恢复并新增总表导出
- 清理 DataBaker AI 推荐文本空格
- docs(agent): 更新脚本中心协作规则
- 修复 DataBaker 自动切题后快捷键焦点恢复
- 修复 DataBaker 快捷键焦点恢复
- 补全 DataBaker 推荐文本句末标点
- 优化 DataBaker 快捷键焦点与填入后失焦
- 新增 DataBaker 快捷键与自动分页设置
- 修复 DataBaker 词表拼音批注误替换
- 优化 DataBaker AI 推荐速度与阶段耗时日志
- 增强 DataBaker 词表强替换与耗时日志
- 接入 DataBaker 闽南方言词表上下文
- 修复 DataBaker Qwen 音频请求与设置面板
- 修复 DataBaker Qwen Omni 音频请求格式
- 接入 DataBaker 一检质检设置页
- 新增统一 AI 环境配置文件加载
- 调整 DataBaker AI 成本估算价格
- 忽略 DataBaker AI 调用日志目录
- 完善 DataBaker AI 推荐调用日志
- 记录 DataBaker AI 调用标注员名称
- 新增 DataBaker AI 调用日志写入模块
- 新增 DataBaker 质检 AI 推荐文本能力

## 2026-04-28（历史记录重建摘要）
- 修正快判 AI 建议配置与模型校验
- 新增快判 AI 辅助建议

## 2026-04-27（历史记录重建摘要）
- 上传打包各版本
- 补充服务器扩展下载目录说明
- 补充扩展压缩包生成说明
- 更新忽略文件
- 调整通用扩展目录结构
- 统一扩展为Chromium单源码说明
- 补充快判步长选项和隐私政策
- 调整快判音频快捷键与默认参数
- 修正转写运行时契约缺失告警
- 增强快判统计上传错误诊断
- 新增快判雷题判断
- 恢复快判400条每页入口
- 合并快判统计资料文档

## 2026-04-26（历史记录重建摘要）
- 切换快判统计接口到域名
- 新增统一后端入口和CSV下载接口
- 整合平台资源与快判后端
- 迁移快判后端并清理旧资料
- 迁移LabelX快判平台资料
- 统一详情页统计全量上传
- 优化快判统计全量上传
- 过滤快判统计转写数据
- 优化快判统计首页采集
- 调整快判首页统计上传

## 2026-04-25（历史记录重建摘要）
- 拆分快判统计本地服务
- 调整快判统计上传入口
- 新增快判统计上传框架
- 优化快判轻量摘要展示
- 修复快判轻量摘要多列布局
- 优化快判差异视图和轻量摘要
- 增强快判轻量摘要展示
- 修复快判摘要和差异视图扫描
- 调整快判轻量摘要挂载位置
- 修复快判轻量摘要显示位置
- 完善快判轻量摘要开关和音量快捷键
- 新增快判轻量题卡摘要
- 暂停快判自定义大页数入口
- 修复快判翻页数据被改回第一页
- 修复快判新页面误选防护
- 补充 LabelX 快判网络采集记录
- 修复转写运行时契约读取兼容
- 新增快判ASR差异视图开关
- 新增快判ASR差异视图和自动下一题
- 补充快判提效能力路线
- 暂停快判窗口化显示入口
- 调整快判窗口化隐藏样式
- 新增快判窗口化显示开关
- 调整快判默认页数档位
- 完善快判分页时长与模块拆分

## 2026-04-24（历史记录重建摘要）
- 初始化上传项目

