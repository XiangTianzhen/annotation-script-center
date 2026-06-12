# 柳州话文本修正设计

## 背景

DataBaker CVPC 柳州话助手当前采用两阶段 AI：

1. `listen` 听音，输出原始柳州话参考。
2. `refine` 文本修正，输出最终可填入的 `refinedDialectText` 与 `refinedMandarinText`。

现阶段存在两个稳定问题：

1. `普通话顺滑` 对结巴、拉长重复、口误类噪音收口不稳定。
2. `标注文本` 的最终答案没有统一收口到当前项目认可的柳州话标准写法。

## 目标

只调整最终答案层，不改原始听音层：

- 保持 `audioDialectText`、`audioDialectTokens`、`candidateAlternatives` 原样作为听音参考。
- 只调整最终输出：
  - `refinedDialectText`
  - `refinedDialectTokens`
  - `refinedMandarinText`

## 非目标

- 不改前端字段填入契约。
- 不改 `save_increment` 写回逻辑。
- 不改 `audioDialectText`、`audioMandarinText` 的含义。
- 不直接修改 `liuzhou-lexicon.json` 的业务词条内容。
- 不做大范围自由改写，不把 refine 层变成重写器。

## 需求一：普通话顺滑去结巴

### 预期

`refinedMandarinText` 需要比当前更稳定地删除以下非必要内容：

- 连续口吃重复，例如 `这个这个 -> 这个`
- 明显拉长重复，例如 `辣辣辣辣的 -> 辣的`
- 明显口误式重复，但只做保守收口

### 例子

输入参考：

- 柳州话：`所以讲我在家里面一天，那个，这个这个女婿一天煮那种辣辣辣辣辣滴，整得我吃得，吃得我都肚子都痛完克。`
- 普通话旧结果：`所以说我在家里面一天，那个，这个这个女婿一天煮那种辣辣辣辣的，弄得我吃得，吃得我肚子都痛完了。`

目标结果：

- `所以说我在家里面一天，那个，这个女婿一天煮那种辣的，弄得我吃得，吃得我肚子都痛完了。`

### 边界

- 只处理高置信重复，不跨逗号做大段删改。
- 保留可能承载语义或节奏的重复，例如当前先保留 `吃得，吃得`。
- 保持中文标点归一化逻辑不变。

## 需求二：标注文本标准写法归一化

### 预期

只对最终 `refinedDialectText` 与 `refinedDialectTokens` 做标准写法归一化，首批覆盖：

- `去 -> 克`
- `哩 -> 滴`
- `更 -> 哏`

### 例子

- `更要紧去啊。` -> `哏要紧克啊。`
- `去呗，去，去找，去。` -> `克呗，克，克找，克。`
- `我困困哩没想去。` -> `我困困滴没想克。`
- `更子，红薯。` -> `哏子，红薯。`

### 边界

- 仅作用于最终答案层。
- 不修改 `audioDialectText` 与其衍生候选。
- 不把这批标准写法替换同步到普通话；普通话仍保持 `去 / 的 / 这样` 等自然普通话表达。

## 方案

采用“Prompt 约束 + 后处理兜底”的混合方案：

1. 在 refine prompt 中明确加入：
   - `普通话顺滑` 需要删除结巴、拉长重复、口误类非必要内容。
   - 最终柳州话标准写法优先用 `克 / 滴 / 哏`。
2. 在后端 refine 后处理新增两个确定性步骤：
   - `refinedDialectText/refinedDialectTokens` 标准写法归一化
   - `refinedMandarinText` 保守去结巴顺滑

## 代码落点

- `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.js`
  - 调整 `DEFAULT_REFINE_PROMPT`
  - 新增柳州话标准写法归一化
  - 新增普通话顺滑去结巴
  - 在 `normalizeRefineStageOutput()` 内串接新逻辑
- `platform-resources/data-baker-cvpc/liuzhou-helper/backend/ai-service.test.js`
  - 新增后端定向测试
- 文档同步：
  - `platform-resources/data-baker-cvpc/liuzhou-helper/README.md`
  - `extension/sites/data-baker-cvpc/liuzhou-helper/README.md`
  - `log.md`

## 测试策略

1. 标准写法归一化：
   - `去/哩/更` 的基础替换
   - 与标点相邻的替换
   - 连续多次出现的替换
2. 普通话顺滑：
   - `这个这个 -> 这个`
   - `辣辣辣辣的 -> 辣的`
   - 不误删 `吃得，吃得`
3. 现有标签与普通话纯文本约束不回归：
   - 标签仍只保留在柳州话字段
   - 普通话仍为纯文本

## 风险

- `更` 在个别语境里可能不是目标词，需限制为当前项目认可的高频标准写法场景，避免过度替换。
- 普通话去结巴如果过猛，会误删强调性重复；因此本次只做保守规则，不做跨分句重写。

## 验收标准

- 最终填入 `标注文本` 时优先得到 `克 / 滴 / 哏`。
- 最终填入 `普通话顺滑` 时，结巴与拉长重复明显减少。
- `audioDialectText` 仍保留原始听音参考，不被标准写法归一化污染。
