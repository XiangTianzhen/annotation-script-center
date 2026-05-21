# Magic Data 平台页面结构（通用）

## 已采页面

- `#/welcome`
- `#/mark/list`
- `#/mark/details?...`
- `#/asrmark?...`

## 通用结构要点

- SPA 根：`#app`
- 列表页存在任务查询与分页区，任务入口跳转到详情/标注页。
- `#/asrmark` 包含：
  - 句子列表主容器（助手结果区挂载在该区域下方）
  - 说话人属性区域（性别/年龄）
  - 保存/提交按钮区域（仅记录 selector，不自动触发）

## 助手差异

- 客家话助手细节：见 `hakka-helper/page-structure.md`
- 闽南语助手细节：见 `minnan-helper/page-structure.md`

## 待补

- 闽南语项目在 `#/asrmark` 下的专属字段差异（如方言标识、任务元数据字段）。
