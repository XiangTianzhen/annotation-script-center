# ByteDance AIDP 苏州话脚本

## 定位

- 平台：`bytedance-aidp`
- 资料目录：`suzhou-helper`
- 目标页：
  - `https://aidp.bytedance.com/management/task-v2/{taskId}/mark-v3/{index}?from_pathname=...&fs=...&templateID=...&templateType=...`
- 当前阶段：`beta`
- 当前状态：已创建 `extension/sites/bytedance-aidp/suzhou-helper/` 运行时代码，并已接入详情页最小分段建议闭环：
  - 基础设置 `隐藏平台AI功能`
  - 基础设置 `生成后自动应用当前建议`
  - 基础设置 `前后静音时长 / 静音阈值 / 连续相接自动合并 / 默认播放倍数 / 固定缩放倍数`
  - 详情页快捷键面板（默认全部未设置）
  - `Receive` 当前条读取
  - `SubmitTempItemAnswer` 暂存直写
  - 统一后端分段预览

## 当前资料覆盖

- `mark-v3` 详情页路由与 query 上下文
- `mark-v3` 当前条读取与暂存写回契约
- 详情页语义分区、关键工作区块、可隐藏平台 AI 板块、挂载建议与动态重渲染风险
- `mark-v3` 详情页的最小运行时闭环：
  - 脚本中心基础设置
  - 详情页路由识别
  - 平台原生 AI 板块显隐
  - 分段建议面板挂载
  - 平台暂存答案分段写回
- 后续脚本接线前的写操作警戒线

## 资料文件

| 文件 | 职责 |
| --- | --- |
| `README.md` | 苏州话脚本入口、资料导航和接线边界 |
| `network/README.md` | `mark-v3` 详情页专项 Network 索引 |
| `network/01-mark-v3-detail-init.md` | `mark-v3` 详情页初始化与只读请求边界 |
| `network/02-mark-v3-receive-current-item.md` | 当前条读取与临时答案读取契约 |
| `network/03-mark-v3-submit-temp-answer.md` | 平台暂存写回契约 |
| `page-structure/README.md` | `mark-v3` 详情页结构索引 |
| `page-structure/01-mark-v3-detail.md` | `mark-v3` 详情页语义分区、初版锚点和挂载边界 |
| `backend/README.md` | 苏州话脚本分段预览后端入口 |

运行时代码入口：

- `extension/sites/bytedance-aidp/suzhou-helper/README.md`
- `extension/sites/bytedance-aidp/suzhou-helper/content.js`
- `extension/sites/bytedance-aidp/suzhou-helper/data-api.js`
- `extension/sites/bytedance-aidp/suzhou-helper/segmentation-controller.js`
- `extension/sites/bytedance-aidp/suzhou-helper/ui-panel.js`
- `extension/sites/bytedance-aidp/suzhou-helper/shortcuts.js`
- `extension/sites/bytedance-aidp/suzhou-helper/page-world/network-observer.js`

公共资料入口：

- 平台公共网络：`../network/README.md`
- 平台公共列表页网络：`../network/01-task-v2-home.md`
- 平台公共结构：`../page-structure/README.md`
- 平台公共列表页结构：`../page-structure/01-task-v2-home.md`

## 页面入口

| 页面 | URL 模式 | 说明 |
| --- | --- | --- |
| 苏州话详情页 | `/management/task-v2/{taskId}/mark-v3/{index}?from_pathname={path}&fs={value}&templateID={templateId}&templateType={templateType}` | 当前已确认读取链路、暂存写回链路与波形区挂载点 |

## 当前运行时边界

- 当前运行时保留一个平台显隐基础开关：
  - `隐藏平台AI功能`
  - 默认勾选并隐藏平台原生 AI 板块，取消勾选后才显示；不影响任务列表、波形区、保留/丢弃和分段表格
- 当前运行时还提供 5 个详情页波形相关基础设置：
  - `生成后自动应用当前建议`：默认开启；只在手动点击 `生成分段建议` 后自动写回当前暂存答案
  - `前后静音时长`：默认 `0.3s`，可调范围 `0s ~ 0.5s`
  - `静音阈值`：默认 `-31 dBFS`，只允许整数 `-80 ~ -5`
  - `连续相接自动合并`：默认开启；同一原始段里首尾相接或只差 `10ms` 内显示误差的建议段会在预览阶段并回一段
  - `默认播放倍数`：默认 `1.0x`，只允许平台系统预设 `0.5 / 0.75 / 1.0 / 1.25 / 1.5 / 1.75 / 2.0`
  - `固定缩放倍数`：默认 `2`，只允许整数 `1~10`
- 当前运行时只包含：
  - `mark-v3` 详情页路由识别
  - `Receive` 当前条上下文与临时答案读取
  - `SubmitTempItemAnswer` 暂存请求快照捕获
  - 波形区下方精简面板挂载
  - `当前音频` 区默认折叠与当前页内临时展开 / 折叠
  - 详情页快捷键绑定与输入态忽略
  - 统一后端分段预览调用
  - 分段建议请求里的前后静音补偿、静音阈值和连续并段开关透传
  - 分段建议默认按 `-31 dBFS / 400ms / 0s~0.5s` 口径处理，并优先保留明显长静音的可视空白核心
  - 连续相接自动合并默认开启；若同一原始段拆出来的建议段前后首尾实际相接，会在预览阶段直接并回一整段
  - 波形区播放速度在进入详情页或切到新题时，一次性对齐平台原生 `arco-select` 预设倍速
  - 若平台只完成点选但未真正提交倍速，运行时会补一次原生确认动作
  - 波形区缩放在进入详情页时优先读取 `aria-valuenow`，再通过平台原生缩小 / 放大按钮收敛到整数 `1~10`
  - 当前页临时答案里的 `regions` 直写
  - 新写回分段默认带 `ms: "目标方言"`，只在应用分段建议写回时自动带值
  - 波形工具条右侧 `清空画段` / `填充语言种类` 按钮
  - `填充语言种类` 只处理空值或 `请选择` 的当前页行，不覆盖已有非空语言
  - `填充语言种类` 改为复用 `SubmitTempItemAnswer` 暂存直写，只补当前题 `regions[*].ms` 的空值为 `目标方言`
  - 成功后刷新当前详情页复核，不再依赖逐个下拉框人工模拟点击
  - 已采样选择器 `.trigger-wrapper-RlG7Dx`
  - 已采样选择器 `.insight-container-Hn0Gna`
  - `AI 洞察 / 统计周期 / 前往数据看板 / 立即生成` 文本锚点兜底
  - 右下角小型固定浮层候选识别
  - 同域 iframe 文档下钻扫描
  - 页面重渲染和同节点 `class/style` 改写后的补隐藏
- 当前已创建脚本级后端目录并注册统一后端预览入口：
  - `platform-resources/bytedance-aidp/suzhou-helper/backend/`
- 当前仍不预设脚本级快捷键、识别类 AI 面板或保存以外的批量链路

## 已记录的详情页关键区块

- 左侧任务列表区：
  - 顶部统计与排序
  - 搜索框
  - 当前任务卡片
- 中间波形区：
  - 时间轴波形
  - 播放速度
  - 总时长
  - 播放 / 撤销 / 删除等控制按钮
  - 脚本追加的 `清空画段` / `填充语言种类` 按钮
- 脚本自有当前音频区：
  - 默认折叠
  - 当前页内可临时展开和收起
- `是否保留` 单选区：
  - `保留`
  - `丢弃`
- 分段表格区：
  - `序号`
  - `区间`
  - `转写文本`
  - `语音种类`
  - `音频段`
  - `操作`

## 已记录的可隐藏平台 AI 板块

- 浮动触发器：
  - 已采样目标：`.trigger-wrapper-RlG7Dx`
  - 当前表现：页面右下侧附近的平台 AI 浮动入口；真实外层可能不再等同于最初猫形触发器内层
- `AI 洞察` 面板：
  - 已采样目标：`.insight-container-Hn0Gna`
  - 当前表现：带 `AI 洞察 / 统计周期 / 前往数据看板` 的平台原生洞察区；运行时会优先命中该根节点，不足时回退到语义锚点
- 当前口径：
  - 这两个块默认按“平台 AI 功能”归类
  - 后续若实现 `隐藏平台AI功能`，优先只隐藏这两类平台 AI 板块，不改动核心标注工作区

## 当前边界

- 识别类 AI、提交、领取、批量流转均不在本轮范围
- 当前不新增 dbfs 面板式可视调参入口；AIDP 改为在脚本中心提供单一 `dBFS` 数字输入，并继续使用“视觉静音优先”的固定规则
- 当前写回只覆盖 `TempAnswer.Content` 里的分段数组，不改 `提交 / 下一题 / 重置`
- 当前 `清空画段` 会直接清空 `TempAnswer.Content.data.regions`，不再额外判断当前是否已有转写文本或语音种类
- 当前若发现分段表已有文本或语音种类，或当前分段状态已变化，会停止自动应用，避免覆盖现有标注
- 不确认任何字段名、按钮文案或接口路径，除非后续在独立 Edge 窗口里完成补采
- 所有写动作默认保持人工确认边界

## 安全边界

- 不记录完整登录态、鉴权头、完整签名资源地址或原始请求包
- 后续若继续补采，优先使用独立 Edge 窗口或标签页，避免读取无关已登录页面
