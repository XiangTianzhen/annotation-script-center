# ASR Judgement Data 目录

`platform-resources/alibaba-labelx/asr-judgement/data/` 用于脚本级数据逻辑。

当前阶段：

- 已新增 `adapter.js`，负责快判下载 / suppliers / existing 的脚本级差异：
  - 下载文件名前缀
  - 3 个标注槽位与审核槽位的选 row 规则
  - `complete` 判定
  - 分包缺失时的缺字段提示
- 快判统计上传、合并与落盘后端当前仍保留在 `backend/`。
- 未来如新增字段映射、供应商样例或脱敏样例，优先收口到这里。
