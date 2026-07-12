# 新域名测试与正式切换设计

## 目标

将当前分支完整切换到 `https://annotation-script-center.xiangtianzhen.store`，先作为真实服务器测试入口；本地 Chrome / Edge 验收通过后，仍按单一公开发布流程生成 `1.0.0` 正式产物并上传该服务器。旧域名暂时承载旧正式版本，稳定迁移后再单独下线。

## 范围

- 扩展默认 Server 地址、AIDP 运行时回退地址、`manifest.update_url`、打包下载基址和后端下载中心元数据全部切换到新域名。
- 设置 schema 从 `30` 升到 `31`，只把精确旧值 `https://script.xiangtianzhen.store` 迁移到新域名；任意其他自定义 Server / Local 地址保持不变。
- 不恢复 Beta 解锁、Beta 后端、双通道构建或 Beta 文件名。当前服务器测试只是发布前阶段，不形成长期 Beta 产品线。
- 后端继续只监听 `127.0.0.1:3333`，由 Nginx 提供公网 HTTP/HTTPS 入口。
- 本轮先部署分支后端并使用 unpacked extension 本地验收；验收通过后才在本地生成四项正式发布产物。

## 配置与安全

- 本机管理员密码写入被 Git 忽略的 `config/env/backend.env`，不在规格、测试、日志、提交或命令输出中保存明文。
- 管理员 JWT 密钥继续使用本地或服务器私密环境配置，不提交默认真实值。
- `config/secrets/`、真实 `.env`、证书私钥和 CRX 签名私钥不进入 Git。
- 由于聊天中提供的管理员密码已经暴露，正式上线后应更换为随机强密码。

## Nginx 与 HTTPS

- 新域名的 80 端口仅重定向到 HTTPS。
- 443 站点继续提供 `/`、`/downloads/` 和 `/api/`；API 代理到 `127.0.0.1:3333`。
- 删除旧配置中把旧 HTTPS 域名替换成 IP/HTTP 的 `sub_filter`，避免返回地址降级或污染新域名元数据。
- IP `default_server` 可保留为诊断入口，但不作为扩展、更新元数据或下载中心的公开地址。
- TLS 证书在服务器上由 Certbot/Nginx 管理，证书文件不进入仓库。

## 部署阶段

1. 修改默认地址、迁移逻辑、测试与当前文档。
2. 写入本机忽略的管理员配置。
3. 执行全量测试、Options 构建、JS/JSON/manifest 检查和 `git diff --check`。
4. 提交并推送当前分支，不合并 `main`、不创建 tag。
5. 用户按操作手册在服务器检出当前分支，配置私密环境、PM2、Nginx 和 HTTPS。
6. 用户在本地加载 unpacked extension，验证四脚本、后台接口、管理员页面和下载中心。
7. 验收通过后，本地执行单通道正式打包，将固定四项产物上传新服务器，再决定合并 `main`。

## 验收边界

- 新旧用户均能得到新域名；只有精确旧默认地址会自动迁移，自定义地址不受影响。
- 新域名 HTTPS、根页面、四脚本 health/defaults、管理员登录和下载目录可访问。
- 测试阶段不产生 Beta 包，不修改版本号，不上传服务器，不合并 `main`。
- 正式包必须在真实 Chrome / Edge 验收通过后生成。
