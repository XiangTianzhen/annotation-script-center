# Aishell Tech 数据处理工作平台 - 页面 DOM 结构分析

本目录记录了希尔贝壳（Aishell Tech）“数据处理工作平台”的前端 DOM 骨架与特征选择器，作为后续插件注入 UI 面板、操作注入的定位依据。

## 标注工作区核心 DOM 结构

本部分归纳标注工作区（Audio Annotation Workspace）内插件真正需要挂载、渲染或模拟点击的特征 DOM 选择器。

### 1. 音频工作区多路由匹配表

插件需要同时在标注、质检、验收三类核心音频工作区页面生效，其对应的前端 Vue Router 路由路径及特征如下：

| 工作区类型 | 路由 Path 匹配规律 (Hash 路由) | 插件核心作用 |
| :--- | :--- | :--- |
| **标注工作区** | `#/mark` 或者是带有 ID 的标注路径 | 抓取当前题音频与参考文本，提供 ASR 校对纠错与一键填入 |
| **质检工作区** | `#/check/:markTaskId` 或 `#/check/detail/:id` | 抓取当前音频，比对标注文本与 ASR 纠错，自动生成质检意见 |
| **验收工作区** | `#/accept/:markTaskId` 或 `#/accept/detail/:id` | 抓取当前音频，比对标注文本与 ASR 纠错，提供一键合格/不合格判定 |

### 2. 多通道/切片音频播放器 (Wavesurfer) DOM 结构

本平台使用高级自定义 `<Wavesurfer>` 组件进行音频播放和切片定位，支持多音轨通道和标记区域：

- **单音轨/多通道音轨行**：
  - 容器选择器：`.channel-row`
  - 活跃音轨（Active Channel）：`.channel-row.channel-active`
  - 折叠音轨（Collapsed Channel）：`.channel-row.channel-collapsed`
- **音轨波形渲染区**：
  - 容器选择器：`.channel-waveform`（内含 Wavesurfer 生成的 `<canvas>` 画布）
- **切片标记区域 (Wavesurfer Regions)**：
  - 容器选择器：`.wavesurfer-region`
  - **切片定位逻辑**：插件可遍历 `.wavesurfer-region` 节点，或者通过拦截 Wavesurfer 实例的 `createdRegion` 事件，对特定切片绑定 AI 听音校对面板。

### 3. 输入框与核心操作按钮精细定位

- **文本输入与质检意见输入**：
  - 标注/质检编辑框：`.el-textarea__inner`（多行）或 `.el-input__inner`（单行）。
  - **数据同步原则**：在向这些输入框自动填入文本时，必须触发其原生的 `input` 事件，以确保 Vue 数据模型同步：
    ```javascript
    const textarea = document.querySelector('.el-textarea__inner');
    textarea.value = 'AI 推荐文本';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    ```
- **核心功能按钮（模拟点击）**：
  - 按钮组通常采用 `.el-button` 类名。
  - **匹配定位方案**：
    - 暂存/保存：匹配包含文字 `"暂存"` 或 `"保存"` 的 `.el-button`。
    - 提交/送审/完成：匹配包含文字 `"提交"`、`"送审"` 或 `"完成质检"` 的 `.el-button`。
    - 质检判定（合格/不合格）：匹配包含文字 `"合格"` 或 `"不合格"` 的 `.el-button` 元素。
    - 验收判定（通过/驳回）：匹配包含文字 `"通过"` 或 `"驳回"` 的 `.el-button` 元素。

---

## 插件注入与挂载点规划

1. **AI 辅助工具卡**：
   - 挂载在标注输入框下方，或者挂载在工作区右侧的副面板（`.right-panel` 或者是 `.main-container` 中的侧边栏栏位）。
   - 可通过 `.el-card` 构建出与 Element UI 视觉统一的半透明磨砂质感卡片。
2. **快捷键总线**：
   - 全局监听 `keydown` 事件。
   - 在用户聚焦于 `.el-textarea__inner` / `.el-input__inner` 时，过滤常规单键，避免快捷键与正常输入冲突；使用修饰键（如 `Ctrl`）或专门的 `F1`~`F4` 等单键作为指令键。
