# ByteDance AIDP 苏州话脚本

## 定位

- 平台：`bytedance-aidp`
- 资料目录：`suzhou-helper`
- 目标页：
  - `https://aidp.bytedance.com/management/task-v2/{taskId}/mark-v3/{index}?from_pathname=...&fs=...&templateID=...&templateType=...`
- 当前阶段：`beta`
- 当前状态：只完成脚本级资料初始化；尚未创建 `extension/sites/bytedance-aidp/` 运行时代码，也未注册脚本启停入口

## 当前资料覆盖

- `mark-v3` 详情页路由与 query 上下文
- 详情页初始化请求的首轮只读边界
- 详情页语义分区、关键工作区块、可隐藏平台 AI 板块、挂载建议与动态重渲染风险
- 后续脚本接线前的写操作警戒线

## 资料文件

| 文件 | 职责 |
| --- | --- |
| `README.md` | 苏州话脚本入口、资料导航和接线边界 |
| `network/README.md` | `mark-v3` 详情页专项 Network 索引 |
| `network/01-mark-v3-detail-init.md` | `mark-v3` 详情页初始化与只读请求边界 |
| `page-structure/README.md` | `mark-v3` 详情页结构索引 |
| `page-structure/01-mark-v3-detail.md` | `mark-v3` 详情页语义分区、初版锚点和挂载边界 |

公共资料入口：

- 平台公共网络：`../network/README.md`
- 平台公共列表页网络：`../network/01-task-v2-home.md`
- 平台公共结构：`../page-structure/README.md`
- 平台公共列表页结构：`../page-structure/01-task-v2-home.md`

## 页面入口

| 页面 | URL 模式 | 说明 |
| --- | --- | --- |
| 苏州话详情页 | `/management/task-v2/{taskId}/mark-v3/{index}?from_pathname={path}&fs={value}&templateID={templateId}&templateType={templateType}` | 当前仅确认 `mark-v3` 路由结构和回列表上下文参数 |

## 后续运行时接线边界

- 当前不创建 `extension/sites/bytedance-aidp/suzhou-helper/`
- 当前不创建脚本级后端目录或统一后端注册
- 当前不预设脚本级快捷键、AI 面板或保存链路
- 当前已先记录一个计划中的基础设置项：
  - `开关平台AI功能`
  - 关闭时目标是隐藏平台原生 AI 相关板块，不影响任务列表、波形区、保留/丢弃和分段表格
- 后续若接运行时，优先先补：
  - 详情页真实 DOM 锚点
  - 字段结构
  - 媒体区域结构
  - 只读初始化请求

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
  - 目标块：`.trigger-wrapper-RlG7Dx`
  - 当前表现：页面右下侧附近的猫形触发入口
- `AI 洞察` 面板：
  - 目标块：`.insight-container-Hn0Gna`
  - 当前表现：带 `AI 洞察 / 统计周期 / 前往数据看板` 的平台原生洞察区
- 当前口径：
  - 这两个块默认按“平台 AI 功能”归类
  - 后续若实现 `开关平台AI功能`，优先只隐藏这两类平台 AI 板块，不改动核心标注工作区

## 当前边界

- AI、保存、提交、领取、批量流转均不在本轮范围
- 不确认任何字段名、按钮文案或接口路径，除非后续在独立 Edge 窗口里完成补采
- 所有写动作默认保持人工确认边界

## 安全边界

- 不记录完整登录态、鉴权头、完整签名资源地址或原始请求包
- 后续若继续补采，优先使用独立 Edge 窗口或标签页，避免读取无关已登录页面
