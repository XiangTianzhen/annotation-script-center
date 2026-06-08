# DataBaker CVPC 柳州话脚本运行时

## 命中范围

- 站点：`https://cvpc.data-baker.com/*`
- 目标页：`/app/editor/asr/`

## 当前能力

- 读取 `annotation/meta` 和当前路由上下文
- 通过 `MAIN` world 页内观察桥捕获页面真实 `annotation/meta` 响应和当前音频签名 URL；观察桥会进入同源 `xaudio` iframe，并在 `data-api.js` 内按观察器、桥接 meta、直连 meta、DOM audio、Performance、同源 iframe audio 逐级回退
- 把助手区嵌入右侧 `全局标注` 卡片：原生 `Valid / Invalid` 保持在上方，助手区固定显示状态、当前音频/当前段摘要、AI 推荐结果和动作按钮
- 仅把 `生成画段建议`、`应用当前建议` 两个按钮前置挂到波形区 `.bottom-right`，不改平台原生 `开启拆分 / 合并段落 / 波形调节 / 倍率` 等控件
- 页面骨架尚未就绪时，右侧卡片和底部分段按钮都会跳过本次挂载，等待下一轮 `mount()` 再补挂，避免早期 `appendChild` 空指针
- 生成当前音频的画段建议
- 对当前波形选中段生成：
  - `柳州话文本`
  - `普通话顺滑`
- 当前波形选中段实验性填入
- 当前段 `Valid / Invalid` 快捷切换
- 当前段 AI 推荐会实时解析 `.xaudio_time` 中的 `开始 / 结束`，只裁剪当前选中段音频；浏览器端转成 `16k` 单声道 WAV 后上传临时缓存，再把该临时 URL 发送给现有 AI 推荐接口
- 页内会话缓存会按 `selectionKey` 复用 1 小时内未过期的临时片段 URL，左侧条目或波形选中段变化时会清空旧推荐，避免串段
- 可分别屏蔽两类平台高层提示：
  - “您正在编辑该作业,不能打开新的Tab页”
  - “系统进入暂停状态”

## 当前边界

- 不自动保存
- 不自动提交
- 不自动切下一条
- 不跨当前音频自动遍历
- 画段创建 / 更新仍是实验性入口；未检测到安全写入桥时只保留建议展示
- 如果未读到可信的当前段 `开始 / 结束` 时间，“当前段 AI 推荐”会直接阻断，不会静默退回整段音频或第一段
- 当前段裁剪上传只保证 `server` 后端地址可用；`local / 127.0.0.1` 当前不在支持范围内
- 两个提示屏蔽开关都默认开启，但只精确匹配上述固定文案，不会扩大到其他 `.tips` 提示

## 文件

- `page-world/audio-observer.js`：页内音频观察桥，捕获页面真实 `annotation/meta` 响应、页面/同源 iframe 音频请求和 `console.log/info/debug` 打印音频 URL 的运行时映射；不包装 `console.warn`
- `content.js`：入口编排与路由检测
- `editing-tab-tip-guard.js`：精确屏蔽固定文案的 Tab / 暂停状态提示
- `data-api.js`：读取编辑器上下文、解析当前音频 URL、当前波形选中段与实验性 DOM 写入
- `segmentation-controller.js`：画段建议生成与应用编排
- `ai-recommendation.js`：当前段 AI 推荐调用，负责浏览器端裁剪当前段、上传 clip-cache 临时音频并请求推荐
- `ui-panel.js`：右侧 `全局标注` 卡内助手区 + 波形区底部分段按钮挂载，并展示当前运行时音频地址与选中段摘要
- `shortcuts.js`：当前页快捷键监听与动作分发

## Options 口径

- 脚本详情页的快捷键当前统一复用 `extension/options/options-shared-shortcut-panel.js`。
- 默认快捷键为空；只有用户在 options 中录制并保存后，运行时才会响应对应动作。
- `基础设置` 当前提供两个独立开关，默认都开启：
  - `屏蔽“不能打开新的Tab页”提示`
  - `屏蔽“系统进入暂停状态”提示`
- 运行时当前兼容旧版 `Shift + 数字` 风格的已保存快捷键；像 `Alt + Shift + 2/3` 这类历史组合在新版本里仍可继续触发。
