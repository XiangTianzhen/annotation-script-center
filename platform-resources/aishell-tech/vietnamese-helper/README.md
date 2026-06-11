# Aishell Tech 越南语助手资料

## 目录职责

- `backend/`：越南语助手独立 recommend / jobs / 日志统计接口。
- `data/`：越南语助手 AI 调用日志目录与脚本级说明。

## 当前口径

- 当前脚本是 Aishell Tech 平台下的正式第二脚本，和 `闽南语助手` 同平台互斥。
- 运行时与后端统一按“越南语音频直接转写为越南语文本”处理：
  - 单阶段 Omni
  - 无词表
  - 无转换阶段
  - 无比较阶段
- 平台通用 Network 与 DOM 资料继续以：
  - `platform-resources/aishell-tech/network/`
  - `platform-resources/aishell-tech/page-structure/`
  为准。

## 当前接口与日志

- 接口根路径：`/api/aishell-tech/vietnamese-helper/ai/recommend`
- AI 日志数据集 ID：`aishell-tech-vietnamese-helper-ai`
- 运行时日志目录：`platform-resources/aishell-tech/vietnamese-helper/data/runtime/`

## 安全边界

- 不保留真实 token、cookie、authorization、完整签名音频 URL。
- 仅保留脱敏后的字段结构、接口契约和脚本边界说明。
- `data/runtime/` 下运行文件不提交 Git。
