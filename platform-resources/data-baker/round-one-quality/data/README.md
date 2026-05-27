# DataBaker Data 目录

`platform-resources/data-baker/round-one-quality/data/` 是脚本级数据逻辑目录。

当前阶段先固定边界，不直接迁移现有导出运行目录：

- 上传统计与导出聚合逻辑仍由 `backend/export-routes.js`、`backend/export-store.js` 负责。
- 真实运行数据仍在被忽略的 `backend/export-data/` 下。

后续会逐步把下面几类内容收口到这里：

- 下载脚本
- 数据字段映射
- 脱敏样例
- runtime 占位目录说明
