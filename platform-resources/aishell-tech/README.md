# Aishell Tech 数据处理工作平台资料 (https://mark.aishelltech.com/)

本目录用于存放希尔贝壳（Aishell Tech）“数据处理工作平台”的插件所需结构、网络拦截接口与标注数据协议分析。

## 系统概述

- **平台名称**：数据处理工作平台
- **平台域名**：`https://mark.aishelltech.com/`
- **接口域名 (baseURL)**：`https://markapi.aishelltech.com`
- **前端技术栈**：Vue 2.x + Element UI + Admin Pro

---

## 目录职责与内容清单

### 1. [network/](network/README.md)
包含所有网络层拦截、API 接口格式、Query/Body 字段说明。
- 包含了登录鉴权流程、Token 放置规则。
- 标注工作流核心 API（获取我的任务、获取分包、条目详情、标注保存）。

### 2. [page-structure/](page-structure/README.md)
分析页面的 DOM 骨架结构，识别运行时插件可以挂载的容器选择器。

---

## 统一安全边界提醒

根据标注脚本中心项目级安全规范：
- 本资料目录**绝对禁止**保存任何真实的 API token、cookie、明文密码。
- 本地抓取到的 `probe_result.json` 与测试 token 等文件已作脱敏处理，且禁止提交 Git 仓库。
- AI 仅作只读辅助与文本填入，不默认自动提交/流转状态。
