# 分段标注页结构

## 页面标识 / 路由 / 前置条件

- 页面：数加加工作台分段标注页。
- 路由：`/workbench/piece/mark.html?taskId={taskId}&executeClass=TAG_PIECE`。
- 前置条件：用户已在平台正常登录并有权访问当前任务；资料不保存登录状态或真实任务参数。
- 内嵌编辑器：外层页面通过 `#bdIframe` 加载 `/workbench/piece/templateLoad.html`。

## 页面总览

页面由外层任务操作区和 iframe 内标注编辑器组成。外层负责提交、退出、跳过和整条无效；内层负责波形浏览、分段编辑、逐段转写和逐段有效性设置。

## DOM 树 / 区域结构

```text
外层 mark.html
├─ 任务信息与状态区
├─ iframe#bdIframe
│  └─ templateLoad.html
│     ├─ 波形、进度与播放控制区
│     ├─ 段落属性区
│     │  └─ 是否有效：有效 / 无效
│     ├─ 分段表格
│     │  ├─ 段落号
│     │  ├─ 角色属性
│     │  └─ 转写输入框（请输入转写内容）
│     └─ 清除、查找替换、所有段落等编辑工具
└─ 原生任务操作区
   ├─ button.submit_finish（提交并退出）
   ├─ button.submit（提交进入下一条）
   ├─ button.skip（跳过）
   └─ button.invalid（无效）
```

## 稳定选择器表

| 区域 / 控件 | 当前选择依据 | 稳定性 | 使用说明 |
|---|---|---|---|
| 内嵌编辑器 | `#bdIframe` | 高 | 进入 `contentDocument` 后再查询内层控件 |
| 提交并退出 | `button.submit_finish` | 高 | 仅用户明确触发时使用原生按钮 |
| 提交进入下一条 | `button.submit` | 高 | 仅由用户直接使用平台原生操作触发 |
| 跳过 | `button.skip` | 高 | 不在首版识别与分段功能范围内 |
| 整条无效 | `button.invalid` | 高 | 不由 AI 或识别结果自动触发 |
| 分段表格 | 表头“段落号 / 角色属性 / 转写”与可见行关系 | 中 | 不依赖动态表格 ID 或行索引 |
| 转写输入 | `.transfer-input`；人工写入时限定在唯一 `.el-table__row.current-row` 内 | 中 | 自动写入要求全页恰好一个可见可编辑控件；人工写入要求唯一选中行内恰好一个 |
| OVERLAP 符号 | `Category1（多选）` 分组内 `.symbol-item`，按 `.key` 的精确 title/文本匹配 | 中 | 只点击唯一可见可用的 `[OVERLAP/]` 或 `[/OVERLAP]` 原生项，不直接拼接文本 |
| 段落有效性 | 当前段落属性区内“有效 / 无效”单选语义 | 中 | 只允许用户显式设置 |
| 助手控制区 | `.form-tabs .tabs-container`，缺失时 `.form-tabs` | 中 | 正式节点出现后自动迁回，不移动已有子节点 |
| 助手结果区 | `.operate-container .transfer`，缺失时 `.operate-container` 内 `.paragraph` 前的扩展专属占位区 | 中 | 始终显示；正式节点出现后迁回并清理空占位区 |
| 编辑器加载标记 | `https://template.shujiajia.com/dist/{version}/multi-audio4/fonts/element-icons.woff` | 中 | 仅被动读取 Resource Timing 用于切题自动划段；扩展不发起字体、WASM 或 favicon 请求，要求本次切题后成功完成且不锁定版本号或查询参数 |
| Peaks.js 波形 | `.audio-peaks .waveform`，内部为 `#peaks-waveform` Canvas | 中 | 画段前重新读取可见尺寸；段落本身不提供 Wavesurfer region DOM |
| 当前段边界 | 可见文字“段落…区域:【开始 结束】…时长” | 中 | 与表格唯一行共同验证，兼容中英文括号和可选逗号 |
| 播放/暂停 | `.center .pause` | 中 | 使用平台原生控件或平台快捷键 |
| 原生保存 | 外层唯一按钮文字“保存”，当前页面显示平台快捷键 `Shift+Alt+S` | 中 | 只由用户显式使用平台入口触发 |

## 动态区域 / 重渲染风险

- `#bdIframe` 会随切题或模板初始化重新加载，旧 `contentDocument` 和节点引用会失效。
- 切题上下文可能早于编辑器资源加载完成；旧页面波形即使仍可读，也不能作为新条目自动划段的就绪依据。
- 平台 XHR 保持原生 `send`；扩展只借助 `open` 与生命周期事件观察必要响应，`templateTypeSummary.json` 等无关请求不进入扩展业务处理。
- 分段表格增删段落后可能整表重绘，行索引不应作为段落身份。
- Peaks.js 使用 Canvas 绘制波形和选区，不能通过 `.wavesurfer-region`、临时 DOM ID 或节点几何读取段落。
- 输入、选段和波形操作会触发平台事件链；是否发生平台内部自动暂存不作为扩展成功依据，直接赋值也不能代表真实写入成功。
- 动态 ID、框架生成属性和临时 class 不作为稳定契约。
- 外层按钮的禁用、隐藏或加载态必须原样遵守，不得绕过。

## 可挂载点建议

已有段落时，控制区作为 `.tabs-container` 最后一个子节点，结果区作为 `.transfer` 最后一个子节点。零段状态缺少这两个正式容器时，控制区回退到 `.form-tabs` 分隔线后方；结果区在 `.operate-container` 内、`.paragraph` 前创建扩展专属左侧占位区。正式容器出现后只迁移助手自有节点并清理空占位区，不移动、复制或覆盖平台节点。结果区始终显示，挂载保持幂等并适应 Vue 局部重渲染。

## 页面区域与接口映射

| 页面区域 | 相关契约 | 关系 |
|---|---|---|
| 页面与 iframe 初始化 | `GET /web-task-alone-api/task/piece/execute` | 提供当前条目及已有标注上下文 |
| 分段表格、转写、有效性 | annotation JSON 与暂存链路 | 页面事件更新编辑态；扩展只把 `/tempsave` 成功响应视为暂存成功 |
| `.submit` / `.submit_finish` | `POST /web-task-alone-api/task/piece/execute` | 平台原生按钮组织最终提交与后续导航 |

## 写操作边界 / 未确认项

- 识别不依赖段落数量；只要当前条目身份和同题音频有效，零段、单段和多段均可执行。
- 默认自动填入只在恰好一个可见可编辑转写框时执行；人工“填入转写”只写入唯一选中行内的唯一可编辑转写框。失败时保留识别结果，不回退到第一段。
- OVERLAP 快捷键只调用唯一匹配的平台原生符号项；成功后标记待暂存，但不自动暂存、提交或设置有效性。
- 有效性只能由用户显式设置，不依据识别文本、静音或分段建议自动判断。
- 整段划分按平台操作指引通过可信 `Shift + 拖拽` 完成；iframe 坐标只在顶层换算后发送到受路由与视口限制的扩展后台。切题自动入口必须先确认本次切题后的编辑器加载标记请求成功，再等待波形；10 秒未确认时取消且不降级。只有零段落允许执行，结果必须通过表格单段数量、区域文字和两像素边界校验；超出容差时保留段落并提示人工检查，不自动 Delete，也不直接写 annotation 对象或调用平台写接口。
- 最终提交使用唯一、可见、可用的原生按钮；不直接调用提交 API。
- 音频地址已确认来自 execute 响应的 `data.detail.fileFolder`；跨更多任务样本的段落 DOM 仍需继续观察，暂存成功仅由已确认的 `/tempsave` 成功响应判定。
