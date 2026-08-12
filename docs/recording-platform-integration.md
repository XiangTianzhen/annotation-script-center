# 录音任务平台接入规范

本文规定标注脚本中心向录音任务平台添加数据和只读查询结果的统一边界。当前只启用 ByteDance AIDP 台州话 `mark-v3` 详情页、检查包路由 `/management/task-v2/{taskId}/scan-v3/{nodeId}/{itemId}`、`/management/task-v2/{taskId}/mark-package/{packageId}/{nodeId}?itemID={itemId}`，以及返修列表 `/management/task-v2/{taskId}/node/14/revise?page={page}` 和返修详情 `/management/task-v2/{taskId}/modify-v2/4/{itemId}`；检查包 `nodeId` 仅白名单 `14、17`，不表示任意节点开放。其他平台或脚本不会自动获得此能力。

## 当前启用条件

- 台州话 Options“基础设置”填写录音平台可见任务编号（例如 `T000001`）；默认空。空值时 `mark-v3` 不显示顶部“添加数据”按钮；检查包辅助面板、返修详情面板和返修列表卡片保留禁用入口并提示先到 Options 配置，同时不发起导入。配置后，`mark-v3` 按钮仍固定位于“清空画段”左侧；检查包和返修详情只在辅助面板录音结果区显示单题入口，返修列表显示独立的当前页批量入口。
- 同一任务编号必须存在于服务器私密配置 `allowedTaskCodes`。功能不要求管理员会话解锁，因此知道允许任务编号的同源调用方仍可能触发导入；这是首期正式接受的 allowlist-only 风险。
- 导入粒度固定为完整 AIDP Item，不按画段拆分；默认只允许人工点击，不轮询、不自动写回或提交 AIDP。检查包与 `mark-v3` 的既有“全自动导入并押后”必须由用户手动开始，并锁定当前页面类型、taskId 与 packageId/nodeId 范围。返修页面不提供该自动化：列表只串行导入当前已加载页的最多 10 条，详情只允许单题添加、刷新结果及人工点击“填入审核结果”，绝不自动暂存、审核、切题或押后。

## AIDP 数据与媒体边界

- MAIN-world 只观察 `/dispatcher/search_item/category`，遍历响应 `Data`，从每条 `ItemID` 与字符串 `Content` 中提取 `asr_text`、`audio`、`video`，不传递完整响应或其他字段。
- 返修页额外精确观察 `/api/dispatch/SearchModifyItem`，把请求体中的 `TaskID`、`NodeID`、`Direction`、`PageNo`、`PageSize` 与同一次响应关联。跨页面世界只发布请求范围、捕获时间，以及每题的 `sourceItemId`、`taskId`、`nodeId`、`referenceText`、`audioUrl`、`videoUrl`；人员信息、审核字段、请求头、Token、完整 URL 和其他响应字段全部丢弃。
- 隔离世界只接收各条目的 `sourceItemId`、`referenceText`、`audioUrl`、`videoUrl`。`mark-v3` 按当前 Receive ItemID 精确选择同题、未过期的 Search Item；检查包按路由 ItemID 优先选择同题、未过期的 Search Item，没有可用 Search Item 时才回退同题、未过期的 GetWorkItem/Receive，并且只从 `Item.Content` 提取 `asr_text`、`audio`、`video`。不固定取 `Data[0]`，也不使用列表位置兜底；ID 不匹配、快照过期或三项全空时禁止导入。
- 当前来源音视频已确认是可直接访问的公网 HTTPS URL。扩展不再下载媒体，不检查 Content-Type 或大小，也不上传媒体字节；浏览器只把实际存在的参考文字和原始 URL 交给脚本中心。
- Cookie、Authorization、Session 和完整请求头不得发送到脚本中心。媒体 URL 只允许在当前页面内存的待重试请求中短暂存在，不得写入 `chrome.storage`。
- 返修列表快照只在路由 TaskID、请求 TaskID、各响应 Item TaskID、请求 `NodeID=14` 和当前页码一致且未过期时可用；切换页码、任务或路由后立即失效。详情页必须再精确匹配路由 ItemID，不使用列表序号兜底。

## 浏览器调用脚本中心

```text
POST /api/bytedance-aidp/taizhou-helper/recording-items
Content-Type: application/json
```

```json
{
  "recordingTaskCode": "T000001",
  "sourceItemId": "<AIDP-ItemID>",
  "referenceText": "脱敏示例文字",
  "referenceAudioUrl": "https://media.example.com/reference-audio",
  "referenceVideoUrl": "https://media.example.com/reference-video"
}
```

三类参考内容允许任意非空组合，空项发送 `null`。单题导入和返修列表逐题导入共用这一请求契约。脚本中心严格拒绝未知字段；音视频必须是不含用户名或密码的绝对 HTTPS URL。服务器不执行 DNS、HEAD、GET、重定向、类型、大小或内容探测。

脚本中心按脚本命名空间、任务编号与 sourceItemId 生成稳定映射键，并为每次创建尝试生成、持久化独立幂等操作键，再使用服务器机器 Key 调用：

```text
POST /api/integrations/tasks/by-code/{taskCode}/items
X-API-Key: <server-only>
Idempotency-Key: <server-derived-stable-key>
```

转发请求固定携带 `sourcePlatform=BYTEDANCE_AIDP` 和当前 AIDP `sourceItemId`。录音平台在同一任务内按这两个字段唯一绑定来源；同一来源跨不同任务允许重复，正常后台添加和 CSV 导入不携带来源绑定。请求指纹由 trim 后参考文字和两个规范化 URL 的 SHA-256 计算。相同来源与相同内容重放首次结果；相同来源改用不同文字或 URL 返回 `409 SOURCE_ITEM_CONTENT_CONFLICT`。同一次创建尝试的网络重试复用已持久化的操作键；只有确认原录音条目不存在时才轮换操作键，避免残留幂等记录重放已删除条目。状态文件只保存指纹和安全映射，不保存参考全文或媒体 URL。

旧参考媒体上传和托管接口已删除，以下路径必须返回 404：

```text
POST /api/bytedance-aidp/taizhou-helper/recording-media/:kind
GET|HEAD /api/public/recording-media/:mediaId
```

## 同步映射与结果

- 扩展本地最多保留最近 500 条：`recordingTaskCode`、`sourceItemId`、`recordingItemId`、`itemCode`、`syncToken`、`updatedAt`。
- 映射不保存 API Key、登录态、参考全文或媒体 URL；Options 不展示映射。
- 本地映射继续用于进入题目时的只读检查和结果同步，但不再阻断用户主动点击“添加数据”。人工点击始终向脚本中心发送一次创建请求，浏览器侧同源 single-flight 仍阻断连续点击竞态。脚本中心发现已有完成映射时先查询录音平台：条目存在则以 HTTP 200 返回原映射；明确返回 `404 TASK_ITEM_NOT_FOUND` 时轮换幂等操作键并重新创建，以 HTTP 201 返回新映射；其他故障保留旧映射且不创建。浏览器用服务器响应中的真实 itemId、itemCode 和同步凭证覆盖本地映射。
- 每次进入题目只读取本地映射并自动查询、渲染一次，不轮询。同一题目、同一进入代次的周期性 DOM 同步直接跳过，不再读取映射、读取结果缓存、调用服务器或重建音频播放器；手动刷新有映射时携带同步凭证查询，本地映射缺失时携带当前完整题目调用独立只读恢复接口。A→B→A 会创建新代次并重新查询，旧请求、旧错误和旧结果不能覆盖当前题目。AIDP 重建辅助面板时只从 UI 内存恢复最近结果，不触发结果接口。
- “当前录音平台结果”不显示内部关联用的 sourceItemId，始终显示“录音条目”；本地映射缺失时，手动刷新以任务编号、来源 ItemID 和参考内容指纹恢复脚本中心服务器已有映射并查询最新结果，成功后保存新的安全同步凭证。服务器也无映射时显示“还未导入该条目”和“暂无可刷新结果”，恢复接口不得创建映射、轮换幂等操作键或调用录音平台创建端点。HTTP 201 首次创建或失效重建、HTTP 200 有效映射重放都先展示响应中的真实 itemCode 与 status，随后立即自动查询一次最新结果；失败时保留映射和创建响应状态并提示手动刷新。有映射时每次手动刷新发送一次结果请求；若收到 `TASK_ITEM_NOT_FOUND`，只提示“原录音条目已不存在，请点击添加数据重新创建”，不得在查询流程内自动创建。同步映射保存不参与台州话运行时配置签名，因此不会销毁当前安全快照、录音上下文或 dataApi；真实配置变化仍会重建运行时。标注页和检查包仅完成后展示文本和/或结果音频，不写入 AIDP。返修详情是唯一人工回填例外：仅当状态为 `COMPLETED`、文本非空、结果 ItemID 等于当前路由 ItemID，且页面只有一个可见、启用、非只读、非扩展和非弹层 textarea 时，用户才能点击按钮把文本换行追加到末尾；相同文本已在末尾时不重复追加。
- 返修列表批量导入严格串行处理当前响应中的最多 10 条；只有当前单条请求成功且安全映射保存完成后，才等待 1 秒并发起下一条，最后一条成功后不额外等待；任意单条失败立即停止整批。运行中禁止重复开始，并显示总数、已处理、成功、复用、跳过、失败和当前 ItemID。用户停止后不再发起下一条，已发出的单条允许结算；页码、任务或路由范围变化时自动停止。
- 导入就绪状态严格依赖当前自动化 ItemID 与来源同题匹配、快照有效和参考内容非空：`mark-v3` 使用 Receive/Search Item，检查包优先 Search Item 并允许 GetWorkItem/Receive 回退。被动检查只更新对应“添加数据”按钮及其说明，不调用顶部公共状态。顶部默认显示“台州话脚本已就绪，可使用当前页面中的辅助功能。”；导入、刷新或 AI 主动操作可以更新顶部状态，同题目的后续被动检查不得覆盖操作结果，切换题目时恢复公共文案。
- 结果音频仍由脚本中心使用机器 Key 从录音平台读取，并通过短时签名地址代理；删除参考媒体托管不影响该受保护代理。
- 自动押后只驱动真实可见 DOM：控件文本必须精确为“押后”，不得匹配“提交”；当前只接受原生 `button` 或类名含 `defer-button` 的 `div`。只接受唯一、可见、标题精确为“押后原因”的弹层，在其唯一 textarea 写入 `1` 并只点击同一按钮组的“确定”。每次自动点击前必须等待页面 fetch/XHR 全部结算，且最后一次网络活动后连续静默 1 秒；跨世界消息只传递未结算数量与事件序号，不传 URL、参数、响应或凭据。20 秒仍未满足时显示未结算数量并立即停止。仅 `AVAILABLE`（待领取）与 `SUBMITTED`（待审核领取）可继续，缺失或多重控件/弹层、原因写入失败、其他状态、导入/刷新失败、自动化 scope 改变或确认后未验证下一题均立即停止，不重试、不跳过、不领取、不保存、不提交且不直接调用 AIDP 写接口。检查包的行内转写、分段、暂存等其他写入口继续 fail-closed。确认前的停止只点击同一弹层“取消”；确认已发送后不再执行任何下一步。下一题完成初始化但没有可用“押后”控件时正常报告“已无可押后数据”。

- 自动押后在验证进入下一题后，会按新的当前自动化 ItemID 等待导入上下文：`mark-v3` 等待匹配的 Search Item，检查包优先 Search Item，也可回退同题、未过期的 GetWorkItem/Receive。`waiting` 与 `stale` 在每阶段 20 秒上限内只读等待，等待期间不发送录音导入请求。上下文就绪后才继续既有导入和刷新，过期、空内容等其他错误仍立即停止。

## 服务器私密配置

真实配置只放在 Git 忽略的 `config/secrets/recording-platform-integration.json`：

```json
{
  "baseUrl": "https://record.example.com",
  "apiKey": "<server-only-api-key>",
  "allowedTaskCodes": ["T000001"],
  "tokenSecret": "<至少 32 字符的随机签名密钥>"
}
```

生产 `baseUrl` 必须使用 HTTPS。本地联调只允许 `http://localhost`、`http://127.0.0.1` 或 IPv6 loopback；其他明文 HTTP 主机拒绝启动集成功能。真实 Key、允许任务编号、同步凭证和签名密钥不得进入 Git、扩展、普通日志、截图或响应。

## 状态升级

- 状态版本为 v3，只包含以任务编号为目标的安全映射。v1/v2 中仅含内部 taskId 的旧映射无法可靠换算任务编号，升级时直接丢弃；若旧映射已经明确包含任务编号则保留。v1 同时删除 `uploads`、`media`、`uploadIds` 和 `mediaIds`。
- 升级只允许删除固定运行目录下的 `temp/` 与 `media/`。目标先解析并验证为运行目录的直接子目录，绝不采用状态文件中的路径。
- 删除失败时启动失败且状态文件保持旧版本。状态缺失或损坏时不得根据不可信信息删除任何目录。
- 旧脚本中心参考媒体 URL 在升级后立即失效；已完成录音结果的短时代理仍可正常工作。

## 错误与重试

- 上下文等待、过期或 ItemID 不一致：停止导入，避免串题。
- 400/422：修正字段、URL 或参考内容；确定性 4xx 会清除浏览器内存中的待重试请求。
- 403：目标任务不在服务器允许列表。
- 408、429、5xx，以及 `OPERATION_IN_PROGRESS`：保留同一 URL 请求体、旧映射和当前创建尝试的幂等操作键，不因临时故障重建。
- `TASK_ITEM_NOT_FOUND`：结果查询只给出重新添加提示；用户主动点击“添加数据”后，脚本中心才废弃旧条目关联、轮换幂等操作键并重新创建。
- 普通日志和错误响应不得输出完整 URL、查询参数、参考全文、API Key 或同步凭证。

## 后续平台接入检查表

1. 单独确认脚本、页面、人工按钮位置和完整条目粒度。
2. 明确安全观察字段、ItemID 一致性与快照过期策略。
3. 使用 Options 可见任务编号与服务器 `allowedTaskCodes` 双重匹配。
4. 覆盖文字、音频、视频、两两组合、三项组合、URL 校验、重复导入和内容冲突。
5. 覆盖单次自动查询、手动刷新、状态、文本/音频展示；若接入返修人工回填，还需覆盖严格 ItemID、完成状态、唯一可写 textarea、换行追加、重复幂等和零平台接口调用。
6. 同步脚本 README、平台资料、测试和根 `log.md` 后再提交。
