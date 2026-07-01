# 01 `mark-v3` 详情页

## 页面标识 / 路由 / 前置条件

- `routeKey`: `suzhou-mark-v3-detail`
- `riskLevel`: `readonly`

- 路径：`/management/task-v2/{taskId}/mark-v3/{index}`
- 关键 Query：
  - `from_pathname`
  - `fs`
  - `templateID`
  - `templateType`

- 已登录到 AIDP 管理后台
- 当前账号对目标任务与条目具备详情页访问权限

## 页面总览

- 当前已能从截图和用户提供的 HTML 片段安全确认，这是一个“左侧任务列表 + 中间波形与字段表格 + 右下平台 AI 浮层”的详情标注页。
- 首轮按后续脚本接线需要拆成：
  - 顶部任务 / 条目上下文区
  - 左侧任务列表区
  - 波形与播放控制区
  - `是否保留` 单选区
  - 分段表格区
  - 平台 AI 浮动触发器
  - 平台 AI 洞察面板
- 当前已可把“平台 AI”与“核心标注工作区”分层处理：后续基础设置 `开关平台AI功能` 只应影响平台 AI 板块，不应影响左侧任务卡、波形、保留/丢弃、分段表格。

## DOM 树 / 区域结构

```text
body
└─ mark-v3 详情根容器
   ├─ 顶部任务 / 条目上下文区
   │  ├─ 任务名
   │  ├─ 最近暂存时间
   │  ├─ 暂存 / 重置
   │  ├─ 继续下一题
   │  └─ 提交
   ├─ 左侧任务列表区
   │  ├─ 状态切换（未提交 / 已提交 / AI）
   │  ├─ 搜索框
   │  ├─ 排序 / 过滤
   │  └─ 当前任务卡片
   ├─ 中间主工作区
   │  ├─ 波形与时间轴区
   │  │  ├─ 波形画布
   │  │  ├─ 播放速度
   │  │  ├─ 总时长
   │  │  └─ 播放 / 撤销 / 删除 / 缩放控制
   │  ├─ 是否保留单选区
   │  │  ├─ 保留
   │  │  └─ 丢弃
   │  └─ 分段表格区
   │     ├─ 序号
   │     ├─ 区间
   │     ├─ 转写文本
   │     ├─ 语音种类
   │     ├─ 音频段
   │     └─ 操作
   └─ 平台 AI 附加区
      ├─ 浮动触发器 `.trigger-wrapper-RlG7Dx`
      └─ 洞察面板 `.insight-container-Hn0Gna`
```

## 稳定选择器表

| 目标 | 建议选择器 | `selectorConfidence` | 说明 |
| --- | --- | --- | --- |
| 详情页路由 | `/\\/management\\/task-v2\\/[^/]+\\/mark-v3\\/[^/?#]+/.test(location.pathname)` | `high` | 首层页面识别锚点 |
| 当前任务 ID | `location.pathname.split("/")[3]` | `high` | 来自已知 URL 模式 |
| 当前索引 | `location.pathname.split("/")[5]` | `high` | 来自已知 URL 模式 |
| 模板上下文 | `new URLSearchParams(location.search).get("templateID")` | `high` | 当前只确认 query 级锚点 |
| 返回列表上下文 | `new URLSearchParams(location.search).get("from_pathname")` | `high` | 用于回列表链路识别 |
| 左侧任务列表状态区 | `text=未提交`, `text=已提交`, `text=AI` | `medium` | 组合文本锚点，待真实页面复核 |
| 左侧搜索框 | `input[placeholder*="题目 ID"]` | `medium` | 截图中可见“通过题目 ID 搜索” |
| 当前任务卡片 | `text=/^7656690377962016562$/`, `text=/^44696080$/` | `medium` | 仅样例锚点，后续应抽成结构定位 |
| 波形区容器 | `text=播放速度`, `text=总时长` | `medium` | 当前比类名更稳定 |
| 保留/丢弃区 | `text=是否保留`, `text=保留`, `text=丢弃` | `high` | 当前截图中语义明确 |
| 分段表格 | `table`, `text=序号`, `text=区间`, `text=转写文本`, `text=语音种类`, `text=音频段`, `text=操作` | `high` | 当前关键工作区锚点 |
| 平台 AI 浮动触发器 | `.trigger-wrapper-RlG7Dx` | `high` | 用户提供的 HTML 片段已确认 |
| 平台 AI 洞察面板 | `.insight-container-Hn0Gna` | `high` | 用户提供的 HTML 片段已确认 |
| `AI 洞察` 标题 | `text=AI 洞察` | `high` | 可作为面板兜底锚点 |
| 返回列表链接 | `a[href*="/management/task-v2"]` | `medium` | 待真实页面复核 |
| 哈希类名 / 瞬时渲染 class | `data-v-*`、CSS Modules 哈希类 | `avoid` | 禁止作为唯一依据；但本轮已确认的 `.trigger-wrapper-RlG7Dx`、`.insight-container-Hn0Gna` 可单独视作已知平台 AI 目标块 |

## 动态区域 / 重渲染风险

- 当前条目切换后，左侧任务卡、波形区、保留/丢弃和表格区可能联动重渲染
- 波形高亮区域、当前分段选中态、播放状态和表格行焦点都属于高频变化区
- 平台 AI 浮动触发器和 `AI 洞察` 面板可能按平台状态懒加载、折叠或重新挂载
- 在真实页面补采前，避免依赖：
  - `nth-child`
  - 临时高亮态 class
  - 仅凭按钮顺序判断动作语义

## 可挂载点建议

- 如后续要接入详情页辅助 UI，优先选择：
  - 波形区与 `是否保留` 单选区之间的安全空白区
  - `是否保留` 单选区与分段表格之间的安全空白区
  - 分段表格外层的独立 sibling 节点
- 不建议：
  - 直接覆盖左侧任务卡片
  - 直接覆盖波形画布和播放器控制区
  - 直接混进平台主动作按钮组
  - 与 `.trigger-wrapper-RlG7Dx` 或 `.insight-container-Hn0Gna` 共用挂载容器
- 后续如果实现基础设置 `开关平台AI功能`：
  - 优先策略：只隐藏 `.trigger-wrapper-RlG7Dx` 与 `.insight-container-Hn0Gna`
  - 不应误隐藏左侧任务列表、波形区、保留/丢弃区和分段表格

## 页面区域与接口映射

- 页面路由：`/management/task-v2/{taskId}/mark-v3/{index}?from_pathname=...&fs=...&templateID=...&templateType=...`
- 详情初始化接口：待补采
- 左侧任务列表数据接口：待补采
- 波形 / 媒体类接口：待补采
- 分段表格与字段状态类接口：待补采
- 平台 AI 洞察相关接口：待补采；当前只确认有独立 DOM 面板，不确认请求结构

## 写操作边界 / 未确认项

- 当前已从截图确认顶部存在 `暂存 / 重置 / 继续下一题 / 提交` 一类动作入口，但尚未补采真实 DOM 和请求链。
- 当前已从截图确认分段表格至少存在：
  - 转写文本输入
  - 语音种类下拉
  - 音频段播放
  - 行级操作
- 在真实页面补采前，以下都应视为 `write-action`：
  - 顶部暂存 / 提交 / 下一题
  - `是否保留` 单选切换
  - 表格里的转写文本、语音种类和行级操作
  - 任何由平台 AI 面板触发的生成、跳转或分析动作
- 当前未确认表格输入区是普通 textarea、受控输入框、富文本还是混合容器。
