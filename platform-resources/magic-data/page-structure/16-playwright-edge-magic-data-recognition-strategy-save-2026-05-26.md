# Playwright-Edge 复测记录（Magic Data 识别策略保存回滚修复）

## 时间

- 2026-05-26

## 目标

- 验证 `direct_dialect` 保存后不会再被 legacy `recognition_convert` 回滚。
- 验证 Hakka 与 Minnan 两条存储路径（platform + legacy）字段一致。

## 复测页面

- `chrome-extension://cdnkiookailoaheehghkolcgjpcidghe/options/options.html?script=magicDataAnnotatorAiReview`
- `chrome-extension://cdnkiookailoaheehghkolcgjpcidghe/options/options.html?script=magicDataMinnanAssistant`

## 复测步骤（实际执行）

1. 在脚本详情页标题连续点击 10 次，解锁 `ASR 语音 AI 设置`。
2. 分别对 Hakka / Minnan 执行：
   - 设置 `modelMode=two_stage`
   - 设置 `recognitionStrategy=direct_dialect`（并验证可从 `mandarin_to_dialect` 切回）
   - 保存后读取 DOM 当前值
   - 读取 `chrome.storage.local.asrEdgeSettings` 两条路径
3. Hakka 额外执行一次：
   - 先保存 `mandarin_to_dialect + qwen3.5-plus`
   - 再切回 `direct_dialect + qwen3.5-flash`
   - 再次读取双路径字段

## 关键结果

### Hakka（`magicDataAnnotatorAiReview`）

- `mandarin_to_dialect` 保存后：
  - `aiReviewRecognitionStrategy=mandarin_to_dialect`
  - `aiReviewRecognitionMode=recognition_convert`
- 切回 `direct_dialect` 保存后：
  - `aiReviewRecognitionStrategy=direct_dialect`
  - `aiReviewRecognitionMode=two_stage`
  - `recognitionMode=two_stage`
  - `pipelineMode=two_stage`
- platform 路径与 legacy 路径一致：
  - `platforms.magicData.scripts.hakkaHelper.*`
  - `scriptCenter.projects.magicDataAnnotator.*`

### Minnan（`magicDataMinnanAssistant`）

- 保存 `two_stage + direct_dialect + qwen3.5-flash` 后：
  - DOM 回显仍为 `direct_dialect`
  - `aiReviewRecognitionMode=two_stage`
  - `recognitionMode=two_stage`
  - `pipelineMode=two_stage`
- platform 路径与 legacy 路径一致：
  - `platforms.magicData.scripts.minnanHelper.*`
  - `scriptCenter.projects.magicDataMinnanAssistant.*`

## 结论

- `direct_dialect` 保存后回滚为 `mandarin_to_dialect` 的问题已复现关闭。
- 新字段优先级与 legacy 覆盖策略符合预期：
  - 新字段优先读取
  - 保存时同步覆盖 legacy 衍生字段
  - 双路径配置一致

## 安全说明

- 本记录未包含 token、cookie、authorization。
- 未记录完整签名 URL 或完整音频 URL。
