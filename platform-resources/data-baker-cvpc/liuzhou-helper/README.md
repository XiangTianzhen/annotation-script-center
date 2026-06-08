# DataBaker CVPC 柳州话脚本

## 定位

- 平台：`data-baker-cvpc`
- 脚本 ID：`dataBakerCvpcLiuzhouAssistant`
- 目标页：`https://cvpc.data-baker.com/app/editor/asr/`
- 当前阶段：`beta`

## 当前能力

- 当前音频上下文读取：
  - `project_id`
  - `task_id`
  - `process_id`
  - `data_id`
  - `job_id`
  - `annotation/meta`
  - `template.attrs / entry_attrs / moment_attrs`
  - 当前音频签名 URL：运行时优先从页内观察桥映射获取；页内桥会消费页面真实 `annotation/meta` 响应、顶层页面或同源 `xaudio` iframe 的真实音频请求和初始化阶段控制台打印的音频 URL。若扩展自身直连 `annotation/meta` 因平台鉴权返回失败，会回退使用页内桥传入的运行时 meta；缺失时再回退到 DOM audio、Performance 与同源 iframe audio
- 当前页工具面板：
  - 助手区嵌入右侧 `全局标注` 卡片，保持原生 `Valid / Invalid` 在上方；右侧当前只保留紧凑状态、当前音频/当前段摘要和提示说明
  - `未填写补 Valid` 当前挂在 `是否有效（Valid or Not）` 单选区右侧
  - `当前段 AI 推荐`、`填入当前推荐` 当前挂在 `普通话顺滑` 输入区下方
  - `生成画段建议`、`应用当前建议` 当前也集中挂到 `普通话顺滑` 下方的中间 AI 区
  - 当前画段建议结果与当前段 AI 推荐结果当前统一显示在中间 AI 区，不再放在右侧助手信息区
  - 当前段 AI 推荐严格按当前波形选中段工作：实时读取 `.xaudio_time` 的 `开始 / 结束`，浏览器端只裁这一段音频
  - 浏览器端会把片段转成 `16k` 单声道 WAV，上传到临时 clip-cache，后端返回 1 小时临时 URL，再把该 URL 发给现有 AI 推荐接口
  - 当前段填入建议当前兼容页面 `contenteditable .ProseMirror`
  - 当前段设为 `Valid / Invalid` 前会先检查当前单选状态，已是目标值时不重复点击
  - 当前音频内“未填写段落补为有效”当前改为读取 `annotation/annos` 后按左侧编号逐段补写，只处理未填写段，不覆盖已填 `Invalid`
  - 基础设置提供两个独立提示屏蔽开关，默认都可分别屏蔽“您正在编辑该作业,不能打开新的Tab页”“系统进入暂停状态”
- 独立后端接口：
  - `GET /api/data-baker-cvpc/liuzhou-helper/segment/health`
  - `POST /api/data-baker-cvpc/liuzhou-helper/segment/preview`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/health`
  - `GET /api/data-baker-cvpc/liuzhou-helper/ai/recommend/defaults`
  - `POST /api/data-baker-cvpc/liuzhou-helper/ai/recommend`
  - `GET /api/data-baker-cvpc/liuzhou-helper/clip-cache/health`
  - `POST /api/data-baker-cvpc/liuzhou-helper/clip-cache/upload`
  - `GET /api/data-baker-cvpc/liuzhou-helper/clip-cache/files/:clipId.wav`

## 规则资产

- 柳州话规则整理稿：`platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-rules.md`
- 柳州话发音对照表：`platform-resources/data-baker-cvpc/liuzhou-helper/ai/assets/liuzhou-pronunciation-reference.csv`

## 当前边界

- AI 建议只作辅助，不自动保存、不自动提交、不自动切下一条。
- `全局 Invalid` 不做自动判定。
- 批量范围固定为“当前音频 / 当前作业”，不跨整包遍历。
- 画段建议当前只提供“建议生成 + 人工确认”。
- 当前段 AI 推荐如果没有读到可信的当前段 `开始 / 结束`，会直接失败，不退回整段识别。
- 当前裁剪上传链路只保证 `server` 后端地址可用；`local / 127.0.0.1` 当前不在支持范围内。
- 真实 `segment create/update`、保存链路和字段持久化请求当前仍未补采完成。

## 写入契约状态

- 已补齐：
  - `annotation/meta` 模板字段读取
  - 当前页 `Valid / Invalid` DOM 选择入口
  - 当前页 `annotation/annos` 段级统计读取
  - 当前页文本输入框 / `contenteditable .ProseMirror` 的实验性就地填入适配层
- 仍待真实补采：
  - 画段创建 / 更新的真实 payload
  - 保存接口
  - 当前段与页面字段的稳定写入契约
  - `attrs / entry_attrs / moment_attrs` 的完整写入映射

## 运行时目录

```text
extension/sites/data-baker-cvpc/liuzhou-helper/
  README.md
  content.js
  page-world/
    audio-observer.js
  data-api.js
  ai-recommendation.js
  segmentation-controller.js
  ui-panel.js
  shortcuts.js
```

## 后端目录

```text
platform-resources/data-baker-cvpc/liuzhou-helper/
  README.md
  backend/
    index.js
    ai-routes.js
    clip-cache-routes.js
    clip-cache-service.js
    segment-routes.js
    ai-service.js
    segment-service.js
  ai/
    adapter.js
    assets/
      liuzhou-rules.md
      liuzhou-pronunciation-reference.csv
```

## 运行数据

- 临时音频缓存目录：`platform-resources/data-baker-cvpc/liuzhou-helper/data/runtime/clip-cache/`
- 文件名只使用不透明 `clipId`，不保存原始签名 URL
- TTL 默认 `1` 小时；上传、读取和服务启动时都会顺手清理过期文件
- 运行数据目录已加入 `.gitignore`，不提交 Git
