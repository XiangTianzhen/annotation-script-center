# 最小扩展骨架说明

## 目的

本文件描述当前项目根目录下已经建立的最小 Edge 扩展骨架，以及 `content.js` 在当前阶段的真实装配边界。

当前骨架的目标不是继续抽象未来平台，而是保证当前独立项目已经具备：
- 可在 Edge 中本地加载
- 可在目标站点做只读存在感注入
- 可在 options 中保存平台模块开关
- 可在 popup 中读取并展示当前状态
- 可对目标站点做页面识别、路由观察、只读页面状态采集与只读 DOM 适配
- 可在 `task-detail` 页面提供 item 快照、只读校验、只读反馈和单条最小写回入口

## 当前目录结构

```text
.
  docs/
    extension-skeleton.md
  extension/
    manifest.json
    background/
      service-worker.js
    options/
      options.html
      options.js
    popup/
      popup.html
      popup.js
    shared/
      constants.js
      storage.js
    sites/
      alibaba-labelx/
        site-contract.js
        page-detector.js
        route-observer.js
        page-state-collector.js
        annotation-item-collector.js
        annotation-item-validator.js
        annotation-feedback.js
        annotation-item-writer.js
        runtime-gate.js
        runtime-debug.js
        content.js
    icons/
      .gitkeep
  legacy-reference/
    asr-script.user.js
    server.js
```

## 为什么可运行根目录放在 `extension/`

浏览器加载解压扩展时，`manifest.json` 所在目录必须同时包含扩展引用的页面脚本、后台脚本和静态资源。

因此当前项目采用：
- `extension/` 作为真正的扩展根目录
- `docs/` 作为文档区
- `legacy-reference/` 作为旧代码参考区

## 当前骨架的职责边界

### `extension/background/service-worker.js`

当前职责：
- 扩展安装或启动时初始化默认配置
- 输出最小生命周期日志

### `extension/shared/`

当前职责：
- 统一定义共享设置模型
- 统一默认配置与常量导出
- 统一 `chrome.storage.local` 的读写 API
- 为 background / options / popup 提供稳定消费入口

### `extension/sites/alibaba-labelx/site-contract.js`

当前职责：
- 定义页面规则真源
- 定义 `routeKey` 生成规则
- 定义稳定页面状态字段骨架
- 定义 `domSignals / contextInfo` 字段名
- 定义 DOM 适配结果的稳定字段骨架

### `extension/sites/alibaba-labelx/page-detector.js`

当前职责：
- 基于站点契约识别当前是否属于目标站点
- 输出当前页面识别结果

### `extension/sites/alibaba-labelx/route-observer.js`

当前职责：
- 监听 `pushState`
- 监听 `replaceState`
- 监听 `popstate`
- 在路由变化时输出统一路由信息

### `extension/sites/alibaba-labelx/page-state-collector.js`

当前职责：
- 基于站点契约生成基础页面状态
- 通过统一 DOM 查询入口收集只读 DOM 适配结果
- 由适配结果按固定优先级回填 DOM 信号与只读上下文
- 输出最小页面状态日志

### `extension/sites/alibaba-labelx/annotation-item-collector.js`

当前职责：
- 在 `task-detail` 页面返回 item 级只读快照
- 输出 `sourceText / hasTargetTextarea / targetText / selectedValidity`
- 复用同一套规则暴露 item / textarea 只读定位入口

### `extension/sites/alibaba-labelx/annotation-item-validator.js`

当前职责：
- 消费 item 级只读快照
- 产出稳定的只读校验结果
- 不修改页面、不联动保存或提交

### `extension/sites/alibaba-labelx/annotation-feedback.js`

当前职责：
- 消费现有只读校验结果
- 生成人工可消费的反馈摘要与调试输出
- 不重复实现 validator 规则

### `extension/sites/alibaba-labelx/annotation-item-writer.js`

当前职责：
- 在 `task-detail` 页面按 `itemIndex` 命中单条 item
- 优先复用 collector 暴露的 item / textarea 定位结果
- 执行单条 target textarea 的最小本地写入
- 不联动保存、提交或批处理

### `extension/sites/alibaba-labelx/runtime-gate.js`

当前职责：
- 读取站点运行时所需的最小本地设置
- 判断 `Alibaba LabelX` 模块是否启用
- 作为 `content.js` 的运行时启用门禁

### `extension/sites/alibaba-labelx/runtime-debug.js`

当前职责：
- 注入调试 badge
- 暴露最小 runtime 调试对象
- 对外聚合 item 快照、校验、反馈、最小写回入口
- 不参与业务状态判断

### `extension/sites/alibaba-labelx/content.js`

当前职责：
- 执行 iframe 守卫
- 执行依赖检查与目标站点门禁
- 编排 observer / stateCollector 初始化顺序
- 串联 runtime gate 与 runtime debug
- 控制启动时机

当前限制：
- 还没有直接消费 shared 存储层
- 当前 `manifest.json` 的 content scripts 仍只加载站点层文件
- `content.js` 只做装配接线，不承载 item 快照、校验、反馈或写回逻辑本体

## 当前 content scripts 装配顺序

`extension/manifest.json` 当前按以下顺序装配站点脚本：
1. `sites/alibaba-labelx/site-contract.js`
2. `sites/alibaba-labelx/page-detector.js`
3. `sites/alibaba-labelx/route-observer.js`
4. `sites/alibaba-labelx/page-state-collector.js`
5. `sites/alibaba-labelx/annotation-item-collector.js`
6. `sites/alibaba-labelx/annotation-item-validator.js`
7. `sites/alibaba-labelx/annotation-feedback.js`
8. `sites/alibaba-labelx/annotation-item-writer.js`
9. `sites/alibaba-labelx/runtime-gate.js`
10. `sites/alibaba-labelx/runtime-debug.js`
11. `sites/alibaba-labelx/content.js`

这意味着：
- `content.js` 只依赖站点层脚本即可完成当前运行时装配。
- item 快照、校验、反馈和最小写回都已经是独立模块，不需要回塞进 `content.js`。
- 当前阶段继续修改 `content.js` 的前提，应仅限让装配路径更清晰，而不是顺手迁业务逻辑。

## 当前结构是否足以继续开发

结论：足以继续开发，并且已经达到“停止继续搭地基、转入单脚本迁移主线”的标准。

原因：
- 页面契约、页面识别、路由观察、页面状态采集、DOM 适配结果采集已经形成最小完整链路。
- item 快照、只读校验、只读反馈和单条最小写回都已独立落位。
- `content.js` 已经只承担站点运行时装配职责，不再是业务逻辑混装入口。

对当前目标来说，已经够用的地基包括：
- 可运行扩展骨架
- 共享存储层
- 站点层契约与状态模型
- 页面识别、路由观察、页面状态采集
- 站点内运行时门禁与调试装配 helper

当前可以暂时不继续追求的事情：
- 面向未来第二个脚本的额外站点通用层
- 更复杂的共享层抽象
- 纯为抽象而继续瘦身 `content.js`

## 下一阶段建议

当前这份骨架说明只确认一件事：
- `content.js` 装配层收口已经达到“够用”状态

因此后续继续推进时：
- 不应再把主任务放回到装配层抽象
- 应把 `content.js` 视为稳定的站点运行时入口
- 新能力继续优先落在独立站点模块中，再由 `content.js` 做最小接线

单脚本迁移主线见 `docs/single-script-migration-roadmap.md`。
字段来源边界见 `docs/context-fields-contract.md`。
装配边界见 `docs/content-assembly-plan.md`。
