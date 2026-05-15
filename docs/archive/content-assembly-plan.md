# content.js 装配层收口规划与落地结果

## 目的

本文件用于固定 `extension/sites/alibaba-labelx/content.js` 装配层收口的职责边界、最小改动路径、落地结果和禁止事项。

它只回答一件事：
- 如何把 `content.js` 收口为更清晰的运行时装配入口，而不顺手演变成业务逻辑迁移

## 当前前提

当前已经具备：
- 页面规则真源
- 路由观察层
- 只读 DOM 适配层
- 站点上下文提取稳定化

这意味着：
- 页面分类、状态对象、DOM 适配结果、上下文字段优先级都已经足够稳定
- `content.js` 现在暴露出来的残留职责已经可以单独收口
- 当前 content script 运行时仍只装配站点层脚本，尚未直接接入 `extension/shared/storage.js`

## 当前 `content.js` 实际承担的职责

按当前真实代码，`content.js` 现在只承担：
- iframe 跳过判断
- 运行时依赖检查
- 目标站点门禁
- observer / stateCollector 初始化顺序
- 已独立模块的 runtime 装配接线
- DOMContentLoaded 启动时机

这里的“已独立模块”包括：
- `route-observer.js`
- `page-state-collector.js`
- `annotation-item-collector.js`
- `annotation-item-validator.js`
- `annotation-feedback.js`
- `annotation-item-writer.js`

也就是说：
- `content.js` 负责把这些模块接入同一条运行时启动链路
- `content.js` 不负责重写它们的内部业务逻辑

## 当前落地结果

当前已落地：
- `runtime-gate.js` 已承接局部设置读取与平台启用门禁
- `runtime-debug.js` 已承接调试 badge 注入与 runtime 调试对象暴露
- `manifest.json` 已按站点契约、页面识别、路由观察、状态采集、item 模块、runtime helper、`content.js` 的顺序装配
- `content.js` 已收紧为更清晰的运行时装配入口
- 后续新增的 item 快照、校验、反馈、最小写回能力都保持在独立模块中，只通过 `content.js` 做最小接线

## 本轮收口的唯一职责

本轮只负责：
- 让 `content.js` 的启动路径更清晰
- 保持装配顺序、门禁顺序和调试暴露顺序可读
- 不把任何 item 级能力重新塞回 `content.js`

这一步不负责：
- 改业务逻辑
- 扩 DOM 适配层
- 改上下文字段契约
- 改 collector 字段优先级或去重规则
- 接入高风险能力

## 应外移的职责

优先考虑外移：
- 局部设置读取与平台启用判断
- 调试 badge 注入
- 非必要的 runtime 调试暴露

当前已外移：
- 局部设置读取与平台启用判断
- 调试 badge 注入
- runtime 调试对象暴露

## 可暂时保留的职责

本轮可暂时保留：
- iframe 守卫
- 模块存在性检查
- 目标站点门禁
- 启动 observer / stateCollector 的顺序控制
- DOMContentLoaded 装配入口

## 建议的落点

优先建议仍放在：
- `extension/sites/alibaba-labelx/`

建议方向：
- 继续复用现有的轻量运行时设置门禁模块
- 继续复用现有的轻量 badge / debug 辅助模块
- `content.js` 只负责串联这些模块
- 默认仍限定在 `extension/sites/alibaba-labelx/` 内解决，不把 shared 层重构带进这一轮

如确有必要：
- 可最小修改 `extension/manifest.json` 以调整装配依赖顺序

## 最小改动路径

当前阶段的最小改动路径应是：
1. 先固定收口后的 `content.js` 职责边界
2. 继续复用已存在的 `runtime-gate.js` 与 `runtime-debug.js`
3. 只整理 `content.js` 的模块解析、依赖检查、初始化顺序与启动入口
4. 不触碰 item 快照、校验、反馈、写回模块内部实现

要求：
- 不为未来第二个平台预做通用运行时框架
- 不把 shared 层大规模重构带进这一轮
- 不因为“想更优雅”而顺手改动无关模块

## 收口后的 `content.js` 应保留什么

收口后的 `content.js` 应保留：
- 运行环境守卫
- 依赖模块就绪检查
- 目标站点门禁
- 初始化顺序编排
- 最小启动入口

收口后的 `content.js` 不应继续保留：
- 大段设置合并逻辑
- 大段 badge DOM 构造逻辑
- 与业务无关的调试拼装逻辑

## 收口后的实际边界

`content.js` 当前实际保留：
- iframe 守卫
- 依赖模块检查
- 目标站点门禁
- observer / stateCollector 初始化顺序
- DOMContentLoaded 启动时机

`content.js` 当前已不再保留：
- 站点内联默认设置合并逻辑
- 直接的 `chrome.storage.local` 读取
- badge DOM 构造
- runtime 调试对象构造

## 当前明确不做什么

- 不接入 fetch 拦截
- 不接入保存链路
- 不引入自动提交、自动抢单、批处理
- 不迁移文本填充、校验、AI 标点修复
- 不重写 shared 存储层
- 不把这一步演变成业务功能迁移

## 为什么这一步仍然只是装配层收口

原因：
- 页面规则、`routeKey`、空状态骨架都没有改。
- `page-state-collector.js` 的字段来源优先级和去重规则都没有改。
- DOM 适配层输出结构没有改。
- item 快照、校验、反馈、写回仍各自在独立模块中实现。
- `content.js` 只是把这些既有模块按更清晰的顺序接线并启动。

因此这一步的本质仍是：
- 运行时装配路径整理

而不是：
- 业务逻辑迁移
- 新能力扩写
- 自动化链路接入

