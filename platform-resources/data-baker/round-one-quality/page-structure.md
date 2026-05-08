# 标贝易采一检质检详情页结构

本文档记录 `roundOneCollect` 详情页的脱敏 DOM 结论。资料来自人工复制的页面 HTML 结构，未记录真实 token、cookie、完整音频 URL 或客户数据。

## URL

详情页路径：

```text
https://datafactory.data-baker.com/v2/#/quality/roundOneCollect?collectId=...&checkType=0
```

`collectId` 和 `checkType` 从 `location.hash` 中的查询参数读取：

```js
const hash = location.hash;
const query = hash.slice(hash.indexOf("?") + 1);
const params = new URLSearchParams(query);
```

## 总体布局

页面主体是左右布局：

- 外层：`.collect-box`
- 左侧列表：`.left-box`
- 左右收缩按钮：`.shrink_switch`
- 右侧详情：`.right`

## 左侧题卡列表

左侧句子列表结构：

```text
.left-box
  .filter-screen
  .sentence-list
    .sentence-item
      .title
      .labelList
      .rejectList
  .roundOneCollect-el-pagination
```

当前选中题：

```css
.sentence-list .sentence-item.active
```

当前题标题：

```css
.sentence-list .sentence-item.active .title
```

标题文本以句子编号开头，形如：

```text
1 ...
```

运行时从标题开头解析 `sentenceNumber`，并去掉编号作为 DOM 回退文本。真实页面候选文本优先从右侧“本句话文本”输入框读取。

## 右侧详情区域

右侧详情主要结构：

```text
.right
  .info-box
  .waver-page
    .text-box
    #iframeBox
    .timeform
    .refuse-box
    .fixed-bottom
```

项目信息在 `.info-box .dataForm` 中展示，包含项目名称、任务名称、文本编号、合格率等。扩展当前不依赖这些字段。

## 页面候选文本

“本句话文本”区域：

```text
.waver-page .text-box
  span: 本句话文本
  .el-textarea
    textarea.el-textarea__inner
```

当前可编辑文本框选择器：

```css
.waver-page .text-box textarea.el-textarea__inner
```

已确认 DOM 中该 textarea 没有 `disabled` 或 `readonly` 属性。运行时仍会在点击“填入推荐文本”前检查：

- 元素存在。
- 不是 `disabled`。
- 不是 `readOnly`。

写入方式：

1. 由用户点击“填入推荐文本”触发。
2. 设置 textarea `value`。
3. 派发 `input` 和 `change` 事件。

扩展不会自动保存、自动提交或自动点击合格 / 不合格。

## 音频播放器

播放器外层：

```css
#iframeBox
```

播放器 iframe：

```css
#iframeBox iframe#myIframe
```

iframe `src` 指向同域播放器路径：

```text
https://datafactory.data-baker.com/xaudio/ecai/?t=...
```

注意：

- iframe `src` 不是后端 AI 需要的真实音频 URL。
- 当前题真实 `audioUrl` 优先来自列表接口 `queryCollectStatementByCondtion` 响应字段。
- 如果页面内或 iframe 内存在可访问的 `audio` 元素，运行时会尝试读取 `audio.currentSrc/src` 作为兜底，但不把完整地址写入日志或文档。

## 时间信息

时间信息区域：

```css
.timeform_left_time
```

可见字段：

- `总时长`
- `截取时长`
- `有效开始时间`
- `有效结束时间`

运行时映射：

- `总时长` -> `audioDuration`
- `截取时长` -> `effectiveTime`
- `有效开始时间` -> `effectiveStartTime`
- `有效结束时间` -> `effectiveEndTime`

接口记录中如果存在同名字段，优先使用接口记录字段；DOM 时间信息作为兜底。

## 朗读要求

朗读要求显示在 `.waver-page` 内的文本节点中，形式为：

```text
朗读要求：...
```

运行时按文本前缀查找并读取冒号后内容，作为 `readRequire` 兜底。接口记录中的 `readRequire` 优先级更高。

## 分页结构

分页容器：

```css
.roundOneCollect-el-pagination
```

当前页码：

```css
.roundOneCollect-el-pagination .el-pager li.active
```

每页条数候选项：

```css
.roundOneCollect-el-pagination .el-select-dropdown__item
```

当前 HTML 中可见候选值包括：

- `5条/页`
- `10条/页`
- `20条/页`
- `50条/页`
- `100条/页`

运行时优先使用网络请求中的 `pageNum/pageSize`；DOM 分页只作为兜底。

## 当前注入位置

AI 推荐工具卡插入在：

```css
.waver-page .text-box
```

之后。这样它靠近“本句话文本”，但不覆盖页面原有判定按钮和不合格原因区域。

