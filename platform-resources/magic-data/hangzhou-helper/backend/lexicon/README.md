# Magic Data 杭州话词表目录

## 文件约定

- Excel 原始文件名约定：`杭州方言正字表0509.xlsx`
- 后端运行时主读 JSON：`hangzhou-lexicon.json`
- 参考源 CSV 约定：`hangzhou-lexicon.csv`

## 说明

- 当前目录已接入实际词表文件 `hangzhou-lexicon.json`。
- 后端优先读取 `hangzhou-lexicon.json`。
- `hangzhou-lexicon.json` 将继续复用统一业务词表 JSON schema：
  - 顶层字段：`schemaVersion / language / mode / sourceFiles / updatedAt / entries`
  - 单条字段：`id / normalized / display / mandarin / aliases / notes / tags / attributes`
- 词条内容继续以用户维护为主；本次只做接入与结构修正，不改词条语义。
- 当前若词表文件缺失或 JSON 解析失败，后端仍可运行，接口返回 `lexicon.status=missing`。
- 后续如果只有 `hangzhou-lexicon.csv`，仍只把 CSV 视为参考源，不回退成 CSV 主读取。

## 当前边界

- 当前不复制、不转换 `C:/Users/17315/Downloads/杭州方言正字表0509.xlsx` 到仓库。
- 词表 CSV / Excel 转换链路与后续内容维护继续放到下一轮单独处理。
