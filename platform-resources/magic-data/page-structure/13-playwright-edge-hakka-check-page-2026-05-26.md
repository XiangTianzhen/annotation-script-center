# Playwright-Edge 复测记录：客家话助手审核页 asrmarkCheck（2026-05-26）

## 任务背景

- 目标页面：`#/asrmarkCheck?formType=1&id=3373750`
- 目标：客家话助手支持审核页 AI 质检，且结果不被刷新流程自动清空。
- 说明：本轮按用户明确要求“无需浏览器真实调试”，未执行真实 Playwright/DevTools 点击复测，仅记录代码级修复点与人工复测清单。

## 审核页接入口径

- 页面识别：`page-detector.getPageType()` 已识别 `asrmarkCheck`。
- 路由参数：`id` 解析为 `samplingRecordId`。
- 客家话 content 主循环已支持：`asrmark` 与 `asrmarkCheck` 共用挂载/采集/渲染主链路。

## 本轮修复点（代码级）

1. 移除审核页“未接入”硬分支
- 删除 `content.js` 中 `asrmarkCheck -> showAsrmarkCheckNotice + clear` 的阻断路径。
- 审核页改为与标注页共用 `panel.refreshPageSnapshot(...)`。

2. 修复结果被自动清空
- `content.js` 改为按 `routeKey = pageType:taskItemId:samplingRecordId` 判断是否切条。
- 仅 routeKey 变化时 `clearResult()`。
- 审核页和标注页均适用，避免 mutation 刷新时重复清空结果。

3. 采集链路补齐审核页上下文
- `data-collector.collectDomSnapshot()` 增加 `pageType`。
- `refreshCurrentItem()` 接收 `pageType/samplingRecordId`，保证请求上下文一致。

4. 审核页按钮与安全边界
- 审核页默认隐藏文本填入相关动作：
  - 行内 `填入本行`
  - `全部填入AI推荐`
- 保留质检、刷新、复制摘要、原始输出、重置高度。
- 保持“不自动保存、不自动提交”。

5. 文案更新
- 不再显示：`审核页暂未接入填入，只支持后续扩展。`
- 改为：`审核页已接入 AI 质检；AI 仅给出客家话规则质检和风险提示，不自动保存、不自动提交。`

## 人工复测清单（待执行）

1. 进入 `#/asrmarkCheck?formType=1&id=3373750`，启用客家话助手。
2. 确认不再出现“审核页暂未接入填入”提示。
3. 点击“刷新采集”，确认能采集 `samplingRecordId`、文本、说话人信息。
4. 点击“AI 质检当前条”，确认有总结论 + 三项详情。
5. 观察 5 秒，结果不自动消失。
6. 确认审核页不显示“填入本行/全部填入AI推荐”。
7. 确认不自动点击平台保存/提交按钮。

## 敏感信息要求

- 本记录不包含 token/cookie/authorization。
- 不记录完整签名音频 URL，仅允许脱敏字段与结构描述。
