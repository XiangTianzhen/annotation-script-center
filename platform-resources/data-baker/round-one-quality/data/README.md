# DataBaker Data 目录

`platform-resources/data-baker/round-one-quality/data/` 是脚本级数据逻辑目录。

当前阶段先固定边界，不直接迁移现有导出运行目录：

- `data/adapter.js` 负责 DataBaker 脚本级下载 adapter：
  - 统一定义 `data-baker-round-one-export` 数据集元数据
  - 统一定义共享下载轨道使用的默认文件名
  - 统一定义当前 `export/download` 兼容路径继续返回的 `latest.csv` 目标
- 上传统计与导出聚合逻辑仍由 `backend/export-routes.js`、`backend/export-store.js` 负责。
- `GET/HEAD /api/data-baker/round-one-quality/export/download` 现在内部已接到 `platform-resources/backend/project-data-download/` 的共享下载 core，但外部 API path 不变。
- 真实运行数据仍在被忽略的 `backend/export-data/` 下。

后续会逐步把下面几类内容收口到这里：

- 下载脚本
- 数据字段映射
- 脱敏样例
- runtime 占位目录说明
