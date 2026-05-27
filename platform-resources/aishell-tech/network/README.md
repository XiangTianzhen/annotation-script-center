# Aishell Tech 数据处理工作平台 - Network 拦截与 API 规范

本目录记录了希尔贝壳（Aishell Tech）“数据处理工作平台”的前后端分离网络接口，用于插件在 Page World 拦截/重写网络请求或在 Isolated 隔离区配合采集。

## 基础连接元数据

- **接口基准 URL (baseURL)**：`https://markapi.aishelltech.com`
- **默认传输格式**：`application/json; charset=utf-8`
- **鉴权 Header 格式**：
  ```text
  Authorization: Bearer <JWT_TOKEN>
  ```
  *注：用户在浏览器中登录后，后续的所有 API 请求都会原生携带此鉴权头部。插件在运行中会自动继承该会话状态，完全不需要主动调用登录接口或在扩展中维护登录态。*

---

## 标注工作流 API 详解


### 1. 获取标注条目详情 (音频与参考文本)
- **接口路径**：`/api/taskItem/markDetail/:taskItemId`
- **请求方法**：`GET`
- **核心数据字段**：
  - `data.result.result`：
    - `id`：条目 ID。
    - `url`：音频文件相对路径。
    - `dataRoot`：音频存储基准 OSS 域名（例如 `"https://bpp-collect.oss-cn-hangzhou.aliyuncs.com"`）。
    - **音频真实完整 URL 拼接规则**：`dataRoot` + `url`。
      *示例*：`https://bpp-collect.oss-cn-hangzhou.aliyuncs.com/闽南方言采集-艾斯/方言采集_20260525-闽南-2/2_AS-mn-002/AS-mn-002_001_2058909059666546789.wav`

### 2. 标注数据存取 (核心保存 Payload 协议)

#### A. 短音频标注
- **读取数据**：`GET /api/mark/getShortMark/:taskItemId`
- **保存数据**：`POST /api/mark/SaveShortMark`
- **保存 Payload 结构**：
  ```json
  {
    "mark": "标注的转写文本",
    "taskItemId": "当前条目的 taskItemId",
    "spendTime": 12, // 标注花费的时间 (单位：秒，正整数)
    "scene": "default", // 当前页面场景
    "duration": 5.4 // 音频时长 (秒，浮点数)
  }
  ```

#### B. 长音频/切片标注
- **读取数据**：`GET /api/mark/getLongMark/:taskItemId`
- **保存数据**：`POST /api/mark/saveLongMark`
- **保存 Payload 结构**：
  ```json
  {
    "mark": "标注内容 (通常是切片 JSON.stringify(e.data) 后的字符串)",
    "taskItemId": "当前条目的 taskItemId",
    "markDataId": "2059460959906435072", // 切片数据 ID (新建切片为 null，修改已有切片为对应 ID)
    "spendTime": 8, // 花费时间 (秒)
    "oretext": "原始转写/校对文本内容",
    "scene": "default"
  }
  ```

### 3. 质检与验收数据存取 (保存 Payload 协议)

对于质检员 (Check/Recheck) 与验收员 (Accept)，AI 音频校对同样作为辅助显示。在他们执行判定或修改保存时，插件可捕获或触发如下保存接口：

#### A. 质检/重检保存
- **保存接口**：`POST /api/check/saveCheck` 或 `POST /api/check/saveReCheck`
- **保存 Payload 结构**：
  ```json
  {
    "id": "2059460959906435072", // 当前质检/重检项 ID (对应前端 check.id)
    "checkSuggestion": "AI 辅助纠错后的质检反馈意见文本",
    "checkStatus": 1, // 质检结果 (1=合格，2=不合格)
    "spendTime": 12 // 质检所花时间 (秒)
  }
  ```

#### B. 验收保存
- **保存接口**：`POST /api/accept/saveAccept`
- **保存 Payload 结构**：
  ```json
  {
    "id": "2059460959906435072", // 当前验收项 ID
    "checkSuggestion": "验收判定建议与意见",
    "checkStatus": 1, // 验收状态
    "spendTime": 12
  }
  ```

---


## 插件拦截重写设计 (Page World)

未来设计插件时，可注入 `document_start` MAIN 线程，重写 `window.fetch` 或 `XMLHttpRequest`：
1. 拦截 `/api/taskItem/markDetail/` 接口以静默提取当前的音频真实地址和参考文本。
2. 捕获标注保存接口（例如 `/api/mark/SaveShortMark`），同步做本端行为或统计缓存。

