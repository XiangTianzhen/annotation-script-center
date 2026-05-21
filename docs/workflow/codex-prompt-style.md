# Codex Prompt 输出格式规范

## 目标

默认以 Markdown 文件产出 Codex Prompt，便于下载、转发和长期留存，同时避免网页端因复杂代码块导致复制失败或结构错乱。

## 强制规则

1. 网页端输出 Codex Prompt 时，默认生成 `.md` 文件供下载，不再默认在聊天消息中直接贴完整 Prompt。
2. 只有用户明确要求直接贴出 Prompt 时，才在聊天消息中直接输出。
3. 不论是下载文件还是直接贴出，Prompt 内部都不得再嵌套复杂 Markdown 三反引号代码块。
4. 命令、JSON、env、示例响应统一用普通缩进文本表示。
5. 不使用嵌套的 ```md / ```json / ```bash / ```powershell。
6. 需要展示示例时使用以下样式：

    文件内容示例：
        ...

    命令：
        ...

## Prompt 文件命名建议

推荐命名：

- `codex-prompt-<task-slug>-v<version>.md`

例如：

- `codex-prompt-data-baker-hotfix-v0.3.6.md`
- `codex-prompt-project-rules-sync-v0.3.6.md`

## Prompt 最小结构

每个 Codex Prompt 必须包含：

- 推荐模型
- 推理强度
- 任务暗号
- 当前目录
- 当前分支
- 是否允许创建分支
- 是否允许直接改 main
- 是否允许生成 CRX
- 文件白名单
- 禁止范围
- 验证命令
- 是否提交
- commit message
- push 目标
- 最终输出要求

## 约束补充

- Prompt 避免堆叠无关背景，长期规则引用 `AGENTS.md` 与 `docs/`。
- 用户反馈“Prompt 无法复制”时，必须按本规范重排后重新输出。
- 最终回复默认提供 Markdown 文件下载链接和一句简短说明；只有用户明确要求时才改为直接贴全文。
