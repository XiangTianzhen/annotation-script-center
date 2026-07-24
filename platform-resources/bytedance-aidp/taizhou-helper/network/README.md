# ByteDance AIDP 台州话脚本 Network 参考索引
## 目录定位

- 目录：`platform-resources/bytedance-aidp/taizhou-helper/network`
- 类型：Network 稳定参考索引。
- 本目录只保留当前有效结论，不再承载会话交接、复测流水或历史过程文档。

## 适用范围 / 当前覆盖

- 当前保留 4 份稳定参考页。
- 当前目录聚焦 `mark-v3` 详情页路由、query 上下文、当前条读取、完整题目最小读取和暂存写回边界。
- 过程型记录已移出主参考目录；如需追加历史过程，统一写入 `log.md`。

## 文件列表

| 文件 | 说明 |
| --- | --- |
| `01-mark-v3-detail-init.md` | 01 `mark-v3` 详情页初始化 |
| `02-mark-v3-receive-current-item.md` | 02 当前条读取与临时答案读取 |
| `03-mark-v3-submit-temp-answer.md` | 03 平台暂存写回 |
| `04-search-item-category.md` | 04 完整题目 Search Item 最小安全读取 |

## 阅读顺序

- 先读本索引，再按文件名顺序下钻到对应单页参考。
1. `01-mark-v3-detail-init.md`
2. `02-mark-v3-receive-current-item.md`
3. `03-mark-v3-submit-temp-answer.md`
4. `04-search-item-category.md`

## 通用约定

- 只记录当前有效结论，不写日期型历史流水。
- 路径、字段名、选择器、按钮文案都按脱敏后的稳定锚点记录。
- 单页参考固定使用 `请求标识 / 目的 -> 页面入口 / 触发动作 -> 请求摘要 -> 请求体摘要 -> 响应摘要 -> 关键字段 -> 前端接入建议 -> 风险 / 未确认项` 顺序。
- 不记录登录态明文、鉴权头明文、完整签名 URL 或原始请求包。

## 当前边界 / 待补项

- 当前已补到详情页首轮初始化、当前条读取、完整题目 Search Item 最小读取和暂存写回链路；列表摘要和更多模板扩展链路仍待补采。
- 新增缺口时，先补稳定参考结论，再同步更新脚本 README 或 `log.md`。
