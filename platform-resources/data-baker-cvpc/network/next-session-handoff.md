# 下次会话接力

## 本轮已确认

- `app/web/#/login` 在有效会话下会重定向到 `#/home`
- 登录后壳层依赖 `user/meta`、`user_center/info`、`upload/tellme`
- 列表导航链已打通：
  - `#/my-job`
  - `#/my-job/<projectId>/callout`
  - `#/my-job/<projectId>/callout/<taskProcessId>/<taskId>/job?...`
  - `/app/editor/asr/?...`
- 编辑器初始化核心接口已收口：
  - `annotation/process_list`
  - `annotation/meta`
  - `platform_setting/view`
  - `annotation/postil_list`
  - `annotation/check_script`

## 下次优先补采

1. 登录表单本身的 DOM 与按钮节点
2. `消息`、`个人账户`、`质检任务`、`验收任务`、`包管理`
3. 编辑器非空 `postil_list`
4. `保存 / 挂起 / 提交` 的真实写接口结构
5. `修改` 与 `继续作业` 的差异

## 操作建议

- 继续使用现成登录态
- 先从 `#/my-job/.../job` 页开始，避免重复走列表链
- 仍然优先保存“结构摘要”，不要把原始凭证、完整签名资源和未脱敏文本提交入仓库
