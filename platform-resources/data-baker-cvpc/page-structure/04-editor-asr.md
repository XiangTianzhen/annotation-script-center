# 04 编辑器 `/app/editor/asr/`

- `routeKey`: `editor-asr`
- `riskLevel`: `readonly`

## 路由模式

- 路径：`/app/editor/asr/`
- 关键 Query：
  - `project_id`
  - `task_id`
  - `process_id`
  - `data_id`
  - `job_id`
  - `mode`
  - `next`
  - `job_status`
  - `next_job_status`
  - `terminal`

## 前置条件

- 已通过作业列表进入具体作业
- 当前作业已经分配给当前终端上下文

## DOM 树

```text
body
└─ 编辑器根容器
   ├─ 顶部动作条
   │  ├─ 当前音频名
   │  ├─ 抽查
   │  ├─ 自动领取
   │  ├─ 仅查看
   │  ├─ 保存
   │  ├─ 挂起
   │  └─ 提交
   ├─ 波形区
   │  ├─ iframe
   │  ├─ 总时长 / 总截取 / 未截取 / 时间点
   │  └─ 波形调节与倍率
   ├─ 音频列表区
   │  ├─ 标题：音频列表
   │  ├─ 搜索框：请输入音频名称
   │  └─ 条目列表（按 entry_index 排列）
   └─ 标注区
      ├─ 画段标注
      ├─ 标签常用语
      └─ 全局标注
         └─ 是否有效（Valid or Not）
            ├─ 是（Valid）
            └─ 否（Invalid）
```

## 稳定选择器表

| 目标 | 建议选择器 | `selectorConfidence` | 说明 |
|------|------------|----------------------|------|
| 音频名称头部 | `text=/\\.mp3$/` | `medium` | 需结合顶部区域定位 |
| 保存按钮 | `button:has-text("保存")` | `high` | 但属于 `write-action` |
| 挂起按钮 | `button:has-text("挂起")` | `high` | `write-action` |
| 提交按钮 | `button:has-text("提交")` | `high` | `write-action` |
| 抽查按钮 | `button:has-text("抽查")` | `high` | 行为待补采 |
| 自动领取 | `text=自动领取` | `high` | 复选框，视为状态改写 |
| 仅查看 | `text=仅查看` | `high` | 复选框，视为状态改写 |
| 波形 iframe | `iframe` | `high` | 波形主区域锚点 |
| 音频列表搜索框 | `input[placeholder="请输入音频名称"]` | `high` | 稳定输入框 |
| 音频列表标题 | `text=音频列表` | `high` | 稳定区块锚点 |
| 画段标注标题 | `text=画段标注` | `high` | 稳定区块锚点 |
| 全局标注标题 | `text=全局标注` | `high` | 稳定区块锚点 |
| 有效单选 | `text=是（Valid）` | `high` | 但属于标注写入 |
| 无效单选 | `text=否（Invalid）` | `high` | 但属于标注写入 |
| 常用语按钮 | `button:has-text("<SPK/>")` 等 | `medium` | 会改写内容，谨慎 |
| 第三方下载面板 | `#aix-drop-panel` | `avoid` | 非平台原生 |

## 动态区域

- 音频列表当前选中项
- 标注模板字段与常用语按钮
- 波形 iframe 内容
- 提交前后的校验提示

## 重渲染风险

- 顶部按钮区与列表区都会在切条时重绘
- 避免依赖：
  - 纯 `el-button--primary`
  - 仅靠按钮顺序定位
  - 波形 iframe 内部实现细节

## 可挂载点建议

- 如后续要接入脚本面板，优先：
  - `document.body` 固定浮层
  - 编辑器根容器外层的独立 sibling 节点
- 不建议：
  - 直接插到波形 iframe 内部
  - 直接混进常用语按钮区
  - 覆盖原生保存/提交按钮

## 页面区域与接口映射

- 顶部上下文与工序信息：`annotation/process_list`
- 音频列表：`annotation/meta.data.datas[]`
- 已有标注状态：`annotation/meta.data.anns[]`
- 模板、常用语、字符检查：`annotation/meta.data.template`
- 平台级显示设置：`platform_setting/view`
- 批注/记录区：`annotation/postil_list`
- 非持久化校验：`annotation/check_script`

## 写操作边界

- 顶部：
  - `保存`
  - `挂起`
  - `提交`
  - `抽查`
  - `进入修改`
  - `退出修改`
- 标注区：
  - 有效/无效切换
  - 常用语按钮
  - 任意文本修改

以上都应继续视为 `write-action`，在真实自动化前要单独补采。
