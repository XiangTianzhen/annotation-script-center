# Magic Data 客家话词表目录

## 文件约定

- Excel 原始文件：`客家话-正字表.xlsx`
- 后端读取 CSV：`hakka-lexicon.csv`

## 说明

- 后端实际读取 `hakka-lexicon.csv`。
- 第一版是“词表提示模式”，不做强替换。
- 如果没有词表文件，后端仍可运行，接口返回 `lexicon.status=missing`。

## 转换方式

如仓库已具备 `xlsx` 依赖，可运行：

```powershell
node platform-resources\magic-data\annotator\backend\tools\convert-hakka-lexicon.js
```

若当前仓库没有 `xlsx` 依赖，请手动将 Excel 另存为 UTF-8 CSV，文件名保持 `hakka-lexicon.csv`。
