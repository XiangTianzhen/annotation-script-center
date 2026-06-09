# 业务词表 JSON 工作流

## 目标

统一本仓库业务词表的协作模式：

- 运行时业务词表主格式固定为 `JSON`
- `CSV / XLSX` 只保留为参考源、原始来源或导入来源
- 词条内容由用户自行维护
- Codex 默认只负责：
  - 输出词表处理 Prompt
  - 校验 JSON 结构
  - 接入运行时代码
  - 同步文档与测试

## 当前纳入范围

当前固定纳入以下 5 份业务词表：

- `platform-resources/data-baker/round-one-quality/backend/reference/minnan-lexicon.json`
- `platform-resources/aishell-tech/minnan-helper/backend/reference/minnan-lexicon.json`
- `platform-resources/magic-data/hakka-helper/backend/lexicon/hakka-lexicon.json`
- `platform-resources/magic-data/minnan-helper/backend/lexicon/minnan-lexicon.json`
- `platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-lexicon.json`

对应参考源继续保留原路径下的 `CSV / XLSX` 文件。

## JSON 契约

顶层字段固定为：

- `schemaVersion`
- `language`
- `mode`
- `sourceFiles`
- `updatedAt`
- `entries`

每个 `entry` 固定字段为：

- `id`
- `normalized`
- `display`
- `mandarin`
- `aliases`
- `notes`
- `tags`
- `attributes`

约束：

- `mandarin` 只保留一个标准释义
- 近义说明、限制条件放进 `notes`
- 同义/异写放进 `aliases`
- 运行时代码只依赖固定字段，不再读取 CSV 表头语义
- 需要额外结构化信息时，统一放进 `attributes`

## 协作流程

当用户提到“处理字词表 / 词表调整 / 去重 / 词表转 JSON / 词表清洗”时，Codex 默认按以下流程执行：

1. 先确认当前要处理的是哪一份单独词表
2. 输出一段交给网页端 AI 的单词表处理 Prompt
3. 用户自己把这一份词表上传或粘贴给网页端 AI
4. 用户自己维护整理后的 JSON，并把结果回传给 Codex
5. Codex 只做结构校验、代码接入、测试和文档同步
6. 不直接新增或修改词条内容，除非用户明确推翻该规则

## 运行时降级规则

- JSON 主词表存在且合法：运行时正常读取 JSON
- JSON 主词表缺失，但本地仍存在对应参考 CSV：
  - 运行时不报硬错误
  - 前端在页面右下角弹出一次“没有字词对应表”提示，停留约 1 秒后自动消失
  - 后端 health / defaults / 调试信息仍保留 warning 字段，供运行时判断与排查
  - 业务继续按无词表模式正常返回
- JSON 主词表缺失，且本地也没有参考 CSV：
  - 运行时不额外警告
  - 业务直接按无词表模式正常返回
- 参考 CSV 不会重新变回业务主读取源

## 词表处理 Prompt 模板

下面模板默认作为“处理字词表”时的输出基底。模板面向网页端 AI，按“一次只处理一份词表”的方式使用，不要求网页端 AI 知道仓库结构。

    你现在只处理这一份业务词表，不要处理其他平台词表。

    我会单独给你一份词表参考源，可能是 CSV、XLSX 导出的文本，或者我直接粘贴词表内容。
    你的任务是：只基于这一个输入，整理成统一 JSON 词表。

    当前词表名称：
    <lexicon_name>

    语言 / 平台：
    <language_or_platform>

    输出目标：
    返回完整合法 JSON，不要返回 Markdown，不要返回解释文字。

    顶层结构固定为：
      {
        "schemaVersion": "1",
        "language": "<language>",
        "mode": "rule_lexicon",
        "sourceFiles": ["<source_file_name_or_label>"],
        "updatedAt": "<ISO8601>",
        "entries": [...]
      }

    每个 entry 固定字段：
      id
      normalized
      display
      mandarin
      aliases
      notes
      tags
      attributes

    强制规则：
      1. mandarin 只保留一个标准释义
      2. 同义词、异写、旧写法放入 aliases
      3. 备注、限制条件、语气说明放入 notes
      4. 不保留空字符串字段值
      5. entries 中 id 必须唯一
      6. 不沿用原 CSV/XLSX 表头作为运行时字段
      7. 不要求我再提供仓库路径，你只处理我当前给你的这一份词表内容

    清洗规则：
      1. 先去除纯标点差异、空白差异、重复行
      2. 优先合并“同词条 + 同释义”的重复项
      3. 如果一个词条存在多个正式释义，不要混在同一 mandarin；拆成不同 entry
      4. display 用推荐展示词条；normalized 用标准匹配词条
      5. aliases 只放可接受异写，不放主释义
      6. 如果参考源里有优先级、语体、来源、限制条件等结构化信息，放进 attributes

    禁止事项：
      1. 不输出 CSV
      2. 不输出 Markdown 表格
      3. 不输出解释性散文
      4. 不新增 schema 之外的顶层字段
      5. 不保留 token、cookie、签名 URL、敏感文本

    最终只输出合法 JSON。
