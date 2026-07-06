# ByteDance AIDP 金华话脚本

## 定位

- 平台：`bytedance-aidp`
- 资料目录：`jinhua-helper`
- 目标页：
  - `https://aidp.bytedance.com/management/*`
  - `https://aidp.bytedance.com/management/task-v2/{taskId}/mark-v3/{index}`
- 当前阶段：已接入运行时
- 当前状态：已接入运行时、分段建议、单段识别直填输入框、批量识别、AI 调用记录与平台暂存写回
  - 设置页可控制 `画段后自动应用建议` 与 `识别完成后立即填入`
  - 设置页基础设置区已统一把详细说明收进可点击 `?`，并移除单独占位的说明卡
  - 管理区 `/management/*` 已补 header 账号区 `切换账号` 按钮，会先清理 `https://aidp.bytedance.com` 与 `https://mpsso.jiyunhudong.com` 站点储存，再补清 AIDP / SSO / 第三方登录 Cookie 后刷新页面
  - 关闭自动填入时，行内识别会先缓存结果，再由同一行 `填入` 按钮直填 textarea

## 当前资料覆盖

- `mark-v3` 详情页路由与 query 上下文
- `mark-v3` 当前条读取与暂存写回契约
- 详情页语义分区、平台 AI 板块、挂载建议与动态重渲染风险
- 金华话脚本最小完整闭环：
  - 脚本中心基础设置
  - 管理区切换账号
  - 平台 AI 显隐
  - 分段建议
  - 单段普通话翻译识别直填输入框
  - 当前题当前页批量识别
  - `SubmitTempItemAnswer` 直写 `regions[*].txt`
  - 金华话脚本 AI 调用日志

## 资料文件

| 文件 | 职责 |
| --- | --- |
| `README.md` | 金华话脚本入口、资料导航和接线边界 |
| `network/README.md` | `mark-v3` 详情页专项 Network 索引 |
| `network/01-mark-v3-detail-init.md` | `mark-v3` 详情页初始化与只读请求边界 |
| `network/02-mark-v3-receive-current-item.md` | 当前条读取与临时答案读取契约 |
| `network/03-mark-v3-submit-temp-answer.md` | 平台暂存写回契约 |
| `page-structure/README.md` | `mark-v3` 详情页结构索引 |
| `page-structure/01-mark-v3-detail.md` | `mark-v3` 详情页语义分区、锚点和挂载边界 |
| `backend/README.md` | 金华话脚本分段建议与 AI 推荐后端入口 |

运行时代码入口：

- `extension/sites/bytedance-aidp/jinhua-helper/README.md`
- `extension/sites/bytedance-aidp/jinhua-helper/content.js`
- `extension/sites/bytedance-aidp/jinhua-helper/data-api.js`
- `extension/sites/bytedance-aidp/jinhua-helper/ai-recommendation.js`
- `extension/sites/bytedance-aidp/jinhua-helper/segmentation-controller.js`
- `extension/sites/bytedance-aidp/jinhua-helper/ui-panel.js`
- `extension/sites/bytedance-aidp/jinhua-helper/shortcuts.js`
- `extension/sites/bytedance-aidp/shared/page-world/network-observer.js`

## 当前运行时边界

- 当前支持的平台级能力：
  - 隐藏平台原生 AI 洞察与浮动入口
  - 单段普通话翻译识别直填输入框
  - 当前题当前页批量识别
  - 分段建议与应用
  - 清空画段
  - 填充语言种类
  - 详情页快捷键
- 当前识别结果口径固定为：
  - 最终只写 `regions[*].txt`
  - 写入值固定为 `finalMandarinText`
  - 输出是“普通话翻译”
  - 不保留金华话副结果字段
  - 不改 `regions[*].ms`
  - 不改提交 / 下一题链路
  - 单段识别只直填页面输入框；批量识别和分段建议应用继续走现有暂存写回
- 当前批量能力边界：
  - 只作用于当前题当前页 `regions`
  - 默认并发 `5`
  - 只在整批结束后合并一次并写回一次
  - 当前题或快照漂移时 fail closed
- 当前脚本级后端入口：
  - `platform-resources/bytedance-aidp/jinhua-helper/backend/`
- 当前 AI 调用记录已纳入后台导出数据集：
  - `ByteDance AIDP 金华话脚本 AI 调用记录`

## 当前边界

- 不自动提交
- 不自动切题
- 不新增平台提交 API
- 不跨页批量
- 不绕过页面按钮 `disabled / readonly`
- 空结果不覆盖已有非空 `txt`
- 纯静音或完全听不清时返回空字符串

## 安全边界

- 不记录完整登录态、鉴权头、完整签名资源地址或原始请求包
- AI 调用日志只保留必要摘要与阶段级 token / 人民币信息

