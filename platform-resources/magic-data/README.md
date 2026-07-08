# Magic Data ANNOTATOR 平台资料

本目录维护 Magic Data 平台共用资料与脚本专属资料。

## 当前脚本

- 客家话助手：`magicDataAnnotatorAiReview`
- 闽南语助手：`magicDataMinnanAssistant`
- 杭州话脚本：`magicDataHangzhouAssistant`
- 同平台默认互斥启用；`platforms.magicData.activeScriptId` 同一时刻只允许指向一个脚本。
- 杭州话脚本当前沿用现有 beta 解锁口径，未解锁时不在脚本中心展示。

## 目录职责

- `backend/`：平台共用后端能力与注册辅助。
- `network/`：平台共用 Network 采集资料。
- `page-structure/`：平台共用页面结构资料。
- `hakka-helper/`：客家话助手专属资料。
- `minnan-helper/`：闽南语助手专属资料。
- `hangzhou-helper/`：杭州话脚本专属资料。

## 当前实现口径

- 客家话 legacy `/api/magic-data/annotator/*` 继续只归属客家话助手。
- 闽南语与杭州话都使用各自独立路径，不新增 `annotator` legacy 别名。
- 杭州话首版以前端运行时和后端接口复制客家话能力为主：
  - 支持 `#/asrmark` 与 `#/asrmarkCheck`
  - 保留右侧 AI 面板、行内填入、原始输出、快捷键和当前页临时全自动链路
  - 默认模型口径先与客家话保持一致，不新增独立模型链路
- Magic Data 三脚本共享平台结构采集与统一后端地址入口，但 `AI 设置`、`基础设置`、`快捷键` 仍按脚本独立保存。
- Options / popup / storage 已扩成三脚本互斥逻辑；启用杭州话时会自动关闭客家话和闽南语。

## 杭州话当前边界

- 只预留 `backend/lexicon/` 目录与文件命名，不在本轮复制或转换 `杭州方言正字表0509.xlsx`。
- 词表缺失时，杭州话后端继续按无词表模式运行，`review-current` 不被阻断。
- 词表接入、JSON 生成和内容维护放到后续单独任务处理。

## 安全边界

- AI 仅做辅助建议，不自动保存、不自动提交、不自动领取、不自动审核、不自动流转。
- 文档与日志不记录 token、cookie、authorization、完整签名 URL、完整敏感文本。
