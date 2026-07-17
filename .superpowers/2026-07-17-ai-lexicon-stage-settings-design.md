# 统一字词表阶段开关与杭州话 AI 设置

## 已确认目标

- 字词表只作为 AI Prompt 参考，不参与代码侧转换、匹配替换或最终用字归一化。
- 双模型的听音阶段按音频真实读音写方言，即使语句不通顺也不普通话化；普通话整理阶段根据方言结果和上下文按原意整理通顺普通话。
- 单模型使用独立配置并一次返回方言文本与普通话文本。
- 柳州听音/普通话整理、杭州听音/普通话整理/单模型分别保存模型、Prompt、生成参数、词表开关和字词表提示词。

## 数据与请求契约

- storage schema 为 `34`。从旧 schema 升级时词表开关初始化为开启，杭州旧共享参数复制到三个阶段；schema 34 保存的关闭状态必须保留。
- 新请求使用 `aiStages.listen/refine/single`，每阶段结构为 `model / prompt / generation / lexicon`。
- `lexicon` 固定包含 `enabled / prompt`；清空 Prompt 或生成参数 override 时回退后端阶段默认值。
- defaults 通过 `defaults.stages` 返回三阶段默认配置；旧扁平字段兼容一个迁移周期，旧杭州 `recognitionStrategy` 接收但忽略。

## 词表上下文

- 开关开启时只筛选与当前页面文本相关的 JSON 主词表词条，最多 `30` 条。
- 普通话整理阶段额外使用听音结果做相关性筛选。
- 关闭、缺失、非法或无命中时不附带词条，并按无词表模式继续。
- CSV/XLSX 只作维护参考源，不进入运行时 Prompt。

## 响应兼容

- 词表元数据返回主词表状态及各阶段 `enabled / contextEntryCount`。
- 旧 `lexiconMatches / conversionWarnings` 保持空数组并标记弃用，不再产生业务结果。
- 扩展版本保持 `1.1.0`，不新增依赖，不执行发布流程。
