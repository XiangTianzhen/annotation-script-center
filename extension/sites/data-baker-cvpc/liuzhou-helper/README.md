# DataBaker CVPC 柳州话脚本运行时

## 命中范围

- 站点：`https://cvpc.data-baker.com/*`
- 目标页：`/app/editor/asr/`

## 当前能力

- 读取 `annotation/meta` 和当前路由上下文
- 通过 `MAIN` world 页内观察桥捕获页面真实 `annotation/meta`、`user/meta` 响应、`annotation/*` 请求最小鉴权头和当前音频签名 URL；观察桥会进入同源 `xaudio` iframe，并在 `data-api.js` 内按观察器、桥接 meta、直连 meta、DOM audio、Performance、同源 iframe audio 逐级回退
- `user/meta` 当前只保留最小用户快照 `name / user_id`，用于补齐平台账号信息并透传到 AI 调用日志
- 把助手区嵌入右侧 `全局标注` 卡片：原生 `Valid / Invalid` 保持在上方；右侧当前只保留状态、当前音频/当前段摘要和提示说明，并优先插入 `全局标注` 内部的 `.label_title_border2` 内容流；摘要当前改为逐行显示 `文件 / 来源 / 当前第 N 段 / 当前段时间`
- `是否有效（Valid or Not）` 下方当前作为独立同级 AI 工作区，优先挂到承载字段块的 `div[data-v-fd55b986]` 内，并与各个 `padding-left: 10px` 字段块保持同级；集中承载：
  - `当前段 AI 推荐`
  - `未填写补 Valid`
  - `生成画段建议`
  - `应用当前建议`
  - 当前画段建议结果
- AI 结果当前按字段归位，而不是留在统一结果区：
  - `修正后的柳州话文本` 直接展示在 `标注文本` 字段块内
  - `整理后的普通话文本` 直接展示在 `普通话顺滑` 字段块内
  - `音频听出的柳州话文本` 与 `特殊标签 / 需人工复核 / 备注 / AI 返回原始内容` 继续留在独立 AI 区底部
- 字段结果卡在没有 AI 结果时不显示任何占位文案；有结果时改成“文本左侧、按钮右侧”的紧凑头部布局，并进一步强化蓝色卡片样式
- `当前段 AI 附加信息` 当前改为默认折叠，点击后再展开查看 `特殊标签 / 需人工复核 / 备注 / AI 返回原始内容`
- `当前段 AI 附加信息` 当前额外显示 token 汇总：总输入 / 总输出 / 总 token，以及 `listen / refine` 分阶段 token
- AI 区里的 `未填写补 Valid / 应用当前建议` 当前改成橙色实底 background 按钮，避免白底低对比看不清
- 页面骨架尚未就绪时，右侧卡片和底部分段按钮都会跳过本次挂载，等待下一轮 `mount()` 再补挂，避免早期 `appendChild` 空指针
- 生成当前音频的画段建议：
  - 前端当前只向 `segment/preview` 发送 `audioUrl + 静音阈值`
  - 后端会直接下载当前 mp3，并通过 Python `miniaudio` 解码后做整音频静音分析
  - 后端固定按 `30ms` 窗口、轻量平滑、`<=0.18s` 短尖峰桥接、连续 `0.4s` 静音、前后补 `0.1s` 生成整条音频建议段
  - 阈值当前开放到 options `基础设置 -> 静音阈值`，默认单位 `dB`，也可切换 `% / Val`
  - 当前页面显示的是“后端整音频重切预览”，不再依赖浏览器本地 `AudioContext` 解码
  - 当预览结果为空时，AI 区会补充说明“后端未检出静音”或“命中了静音但拆分后仍不足 2 段”
- `应用当前建议` 当前改成“平台保存接口优先，增量 DOM 回退兜底”：
  - 页内观察桥会额外缓存页面真实 `annotation/*` 请求里的最小鉴权头：`authorization / baker-terminal / baker-lang`
  - 运行时会先带这些头重新读取当前页 `annotation/annos`
  - 然后按 preview 构造 `POST /httpapi/annotation/save_increment` 所需的 `update / insert / web_snapshot`
  - 如果 `save_increment` 直写成功，当前建议会直接进入平台保存链路，无需再点平台 `保存`
  - 如果缺少鉴权快照或直写失败，且当前是增量预览，才会回退同源 `xaudio` iframe DOM 交互：
    - 先按 live region 匹配受影响原段
    - 把原段改成第一个建议子段
    - 再点击原生 `开启拆分`，把剩余建议子段画回当前波形
  - 只要本次应用成功，无论是 `save_increment` 直写成功还是 DOM 回退画段成功，运行时都会自动刷新当前编辑页，便于立即复核最新页面状态
  - 当前后端整音频预览虽然仍带 `applyAllowed=false`，但点击 `应用当前建议` 时仍会先尝试直写 `save_increment`；该标记当前只表示“不允许自动回退 DOM 重画整页波形”
- 对当前波形选中段执行两阶段识别：
  - `听音` 阶段只输出原始 `音频听出的柳州话文本`，默认按纯听音执行，不注入规则摘要、段时间或页面字段上下文
  - `文本修正` 阶段基于词表优先草稿一次性输出 `修正后的柳州话文本` 与 `整理后的普通话文本`
- 字段内结果卡当前为两张独立卡片，并分别提供定向填入：
  - `修正后的柳州话文本` -> `填入标注文本`
  - `整理后的普通话文本` -> `填入普通话顺滑`
  - 两个定向填入动作当前都支持在 options 页单独录制快捷键，默认仍为空
- 批量识别并自动填入（v1）：
  - 入口位于中间 AI 区；范围输入留空表示当前音频全部段
  - 范围语法固定支持 `2-4`、`2,3,5`、`2-4,7`，同时兼容 `~` 闭区间
  - 启动时会锁定当前 `entry + audioUrl + annotation/annos` 快照，只处理当前音频
  - 前端固定并发 `5`、固定错峰 `50ms`，允许 AI 结果乱序返回
  - 整批结束后只把成功段一次性构造成文本版 `save_increment` 写回平台；保存成功后自动刷新当前页一次
  - `停止批量` 只阻止新请求继续发起，已在途请求会自然收尾；最终仍只保存成功段
- 当前段 `Valid / Invalid` 快捷切换
- 当前段 `Valid / Invalid` 在点击前会先检查当前单选状态；已是目标值时不再重复点击
- `未填写补 Valid` 会先读取当前 `entry_index` 的 `annotation/annos`，只补当前音频里未填写有效性的段；已填 `Valid / Invalid` 一律跳过
- 当前段 AI 推荐会实时解析 `.xaudio_time` 中的 `开始 / 结束`，只裁剪当前选中段音频；浏览器端转成 `16k` 单声道 WAV 后直接拼成 `audioDataUrl`，再发送给两阶段 AI 推荐接口
- 当前段每次都会重新裁剪并重新生成当前段 Base64 音频，不再经过“本地文件转公网 URL”链路
- 当前段文本字段写入已兼容当前页 `contenteditable .ProseMirror` 编辑器，两张结果卡会按目标字段分别写入 `标注文本` 或 `普通话顺滑`
- 当前段 AI 推荐请求前会校验 options 首页 `AI 调用使用人`；请求体会同时带上 `aiUsageOperatorName / platformUserName / platformUserId`
- options 页当前新增 CVPC 专属 `AI 设置` 面板：
  - `基础设置`
  - `听音`
  - `文本修正`
  - 仅保留两阶段 Prompt / 参数 / 模型设置；不提供 compare-family、采纳阈值或并发字段
  - `听音` 当前新增 `附带词表参考（听音辅助）` 持久开关，默认关闭；关闭时 listen 只按当前段音频听写，开启后才附带词表参考片段
  - `基础设置` 当前新增 `静音阈值`，默认 `-27 dB`
- 可分别屏蔽两类平台高层提示：
  - “您正在编辑该作业,不能打开新的Tab页”
  - “系统进入暂停状态”

## 当前边界

- 不自动保存（只有用户主动点击 `应用当前建议` 时，才会尝试直写平台保存接口）
- 不自动提交
- 不自动切下一条
- 批量识别只作用于当前音频 / 当前 entry，不跨音频、不跨页
- 若直写 `save_increment` 成功，则当前建议已直接进入平台保存链路；若回退 DOM 画段，则仍需人工点击平台 `保存`
- 当前后端整音频预览默认仍不回退 DOM 重画整页波形；直写失败时会 fail closed 交给人工处理
- 当前不会在缺少页面真实鉴权快照时伪造 `save_increment` 请求
- 如果未读到可信的当前段 `开始 / 结束` 时间，“当前段 AI 推荐”会直接阻断，不会静默退回整段音频或第一段
- 两个提示屏蔽开关都默认开启，但只精确匹配上述固定文案，不会扩大到其他 `.tips` 提示

## 真实浏览器验证（批量 v1）

1. 在真实 Chrome / Edge 重新加载 unpacked extension，并刷新 `https://cvpc.data-baker.com/app/editor/asr/` 当前编辑页。
2. 确认中间 AI 区出现范围输入框、`批量识别并填入` 和 `停止批量` 按钮。
3. 先留空范围跑一次，确认当前音频所有段都会进入批量状态区，并实时显示 `总数 / 已发起 / 进行中 / 已成功 / 已失败 / 当前段 / 失败清单`。
4. 再分别用 `2-4`、`2,3,5`、`2-4,7` 验证只命中指定段；非法范围应在前端直接报错，不发送保存请求。
5. 批量进行中点击 `停止批量`，确认不会继续发新请求，但已发起段仍会自然完成；最终只保存成功段。
6. 整批成功后确认页面只刷新一次；刷新后复核目标段的 `标注文本 / 普通话顺滑` 已更新，`Valid / Invalid` 未被改动，也没有自动提交或切下一条。

## 文件

- `page-world/audio-observer.js`：页内音频观察桥，捕获页面真实 `annotation/meta`、`user/meta`、`annotation/*` 最小鉴权头、页面/同源 iframe 音频请求，并仅在同源 `xaudio` iframe 内观察 `console.log/info/debug` 打印的音频 URL；顶层编辑页不再包装 `console.*`，避免把平台自身日志堆栈挂到扩展脚本上；仍不包装 `console.warn`
- `content.js`：入口编排与路由检测
- `editing-tab-tip-guard.js`：精确屏蔽固定文案的 Tab / 暂停状态提示
- `data-api.js`：读取编辑器上下文、解析当前音频 URL、桥接或直连 `user/meta`、消费页内鉴权快照、读取最新 `annotation/annos`、构造 `save_increment` 直写请求，并在增量预览直写失败时回退同源 `xaudio` DOM 交互；内部会绑定浏览器原生 `fetch`，避免 `Window.fetch` 的 `Illegal invocation`
- `segmentation-controller.js`：后端画段预览请求与本地 preview 缓存编排
- `ai-recommendation.js`：当前段 AI 推荐调用，负责浏览器端裁剪当前段、生成 Base64 `audioDataUrl`，并把 `aiUsageOperatorName / platformUserName / platformUserId` 与 `aiStages.listen / refine` 一起发送给后端
- `ui-panel.js`：右侧 `全局标注` 卡内紧凑信息区 + `是否有效（Valid or Not）` 下方独立 AI 工作区挂载；右侧只保留状态与逐行音频摘要，字段内承载两张最终结果卡，独立 AI 区承载动作按钮、画段建议与默认折叠的附加信息，并统一收口为系统蓝主调样式
- `shortcuts.js`：当前页快捷键监听与动作分发

## Options 口径

- 脚本详情页的快捷键当前统一复用 `extension/options/options-shared-shortcut-panel.js`。
- 默认快捷键为空；只有用户在 options 中录制并保存后，运行时才会响应对应动作。
- `基础设置` 当前提供两个独立开关，默认都开启：
  - `屏蔽“不能打开新的Tab页”提示`
  - `屏蔽“系统进入暂停状态”提示`
- 运行时当前兼容旧版 `Shift + 数字` 风格的已保存快捷键；像 `Alt + Shift + 2/3` 这类历史组合在新版本里仍可继续触发。
