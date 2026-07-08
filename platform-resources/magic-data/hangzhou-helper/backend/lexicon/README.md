# Magic Data 杭州话词表目录

## 文件约定

- 预留 Excel 原始文件名：`杭州方言正字表0509.xlsx`
- 预留后端运行时主读 JSON：`hangzhou-lexicon.json`
- 预留参考源 CSV：`hangzhou-lexicon.csv`

## 说明

- 本轮暂不接入实际词表文件；当前目录只预留后续落位命名。
- 未来接入时，后端将优先读取 `hangzhou-lexicon.json`。
- `hangzhou-lexicon.json` 将继续复用统一业务词表 JSON schema：
  - 顶层字段：`schemaVersion / language / mode / sourceFiles / updatedAt / entries`
  - 单条字段：`id / normalized / display / mandarin / aliases / notes / tags / attributes`
- 词条内容默认由用户维护；本轮只完成目录、接口、降级口径和文档预留，不改词条语义。
- 当前没有词表文件时，后端仍可运行，接口返回 `lexicon.status=missing`。
- 后续如果只有 `hangzhou-lexicon.csv`，仍只把 CSV 视为参考源，不回退成 CSV 主读取。

## 当前边界

- 本轮不复制、不转换 `C:/Users/17315/Downloads/杭州方言正字表0509.xlsx`。
- 词表转换、JSON 生成和内容维护放到下一轮单独处理。
