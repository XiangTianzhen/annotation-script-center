# 新域名服务器部署

本页用于将当前分支部署到 `annotation-script-center.xiangtianzhen.store` 做真实测试。服务器操作由维护者手动执行；仓库不保存管理员密码、JWT、AI Key、TLS 私钥或 CRX 私钥。

当前阶段只部署后端和静态下载入口。本地加载 `extension/` 完成四脚本验收后，才执行正式打包并上传 `dist/` 四项产物。

## 1. 检出当前分支

首次部署：

```bash
sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www
cd /var/www
git clone -b codex/options-vue-full-migration git@github.com:XiangTianzhen/annotation-script-center.git
cd annotation-script-center
```

已有仓库：

```bash
cd /var/www/annotation-script-center
git status --short
git fetch origin
git switch codex/options-vue-full-migration
git pull --ff-only origin codex/options-vue-full-migration
```

若 `git status --short` 有未知改动，先停止，不要 reset 或覆盖服务器私密文件。

## 2. 配置服务器私密环境

创建忽略文件并交互输入管理员密码，避免密码进入 shell history：

```bash
cd /var/www/annotation-script-center
mkdir -p config/env
read -rsp "管理员密码: " ASC_ADMIN_PASSWORD
echo
ASC_ADMIN_PASSWORD_SHA256="$(printf '%s' "$ASC_ADMIN_PASSWORD" | sha256sum | awk '{print $1}')"
unset ASC_ADMIN_PASSWORD
ASC_ADMIN_JWT_SECRET="$(openssl rand -hex 32)"
umask 077
printf 'ASC_ADMIN_PASSWORD_SHA256=%s\nASC_ADMIN_JWT_SECRET=%s\n' \
  "$ASC_ADMIN_PASSWORD_SHA256" "$ASC_ADMIN_JWT_SECRET" > config/env/backend.env
unset ASC_ADMIN_PASSWORD_SHA256 ASC_ADMIN_JWT_SECRET
chmod 600 config/env/backend.env
```

在提示处输入与本机测试相同的管理员密码。AI 模型配置另写入忽略的 `config/env/ai.env`，只填写服务器真实配置，不从 Git 获取，也不要粘贴到日志或工单。

## 3. 启动 PM2

后端默认只监听 `127.0.0.1:3333`：

```bash
cd /var/www/annotation-script-center
pm2 delete annotation-script-center 2>/dev/null || true
pm2 start platform-resources/backend/server.js \
  --name annotation-script-center \
  --cwd /var/www/annotation-script-center \
  --time
pm2 status annotation-script-center
pm2 logs annotation-script-center --lines 100
```

确认正常后：

```bash
pm2 save
pm2 startup
```

`pm2 startup` 会输出一条带当前用户和 PATH 的 `sudo` 命令；复制执行该命令，然后再次执行 `pm2 save`。

本机回环检查：

```bash
curl -fsS http://127.0.0.1:3333/api/bytedance-aidp/suzhou-helper/ai/recommend/health
curl -fsS http://127.0.0.1:3333/api/magic-data/hangzhou-helper/ai/defaults
```

## 4. 准备静态目录

```bash
sudo mkdir -p /var/www/annotation-script-center/public
sudo mkdir -p /var/www/annotation-script-center/dist
printf '%s\n' '<!doctype html><meta charset="utf-8"><title>标注脚本中心</title><h1>标注脚本中心</h1>' \
  | sudo tee /var/www/annotation-script-center/public/index.html >/dev/null
sudo chmod -R a+rX /var/www/annotation-script-center/public /var/www/annotation-script-center/dist
```

测试阶段允许 `dist/` 为空，不生成 Beta 包。

## 5. 配置 Nginx HTTP

保留原 IP `default_server` 作为诊断入口，另建域名站点 `/etc/nginx/sites-available/annotation-script-center`：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name annotation-script-center.xiangtianzhen.store;

    client_max_body_size 100m;

    location = / {
        root /var/www/annotation-script-center/public;
        try_files /index.html =404;
    }

    location /downloads/ {
        alias /var/www/annotation-script-center/dist/;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
        add_header Access-Control-Allow-Origin * always;
        add_header Cache-Control "public, max-age=300" always;
        types {
            application/x-chrome-extension crx;
            application/xml xml;
            application/json json;
            application/zip zip;
        }
        default_type application/octet-stream;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

启用并检查：

```bash
sudo ln -sfn /etc/nginx/sites-available/annotation-script-center \
  /etc/nginx/sites-enabled/annotation-script-center
sudo nginx -t
sudo systemctl reload nginx
curl -I http://annotation-script-center.xiangtianzhen.store/
```

不要保留旧配置中的 `sub_filter`；当前源码和更新元数据已经直接返回新 HTTPS 域名，改写为 IP/HTTP 会破坏更新地址。

## 6. 申请 HTTPS

确认 DNS 已指向服务器且 80/443 可访问后执行：

```bash
sudo certbot --nginx -d annotation-script-center.xiangtianzhen.store
sudo nginx -t
sudo systemctl reload nginx
sudo certbot renew --dry-run
```

在 Certbot 提示中选择将 HTTP 重定向到 HTTPS。完成后检查：

```bash
curl -I https://annotation-script-center.xiangtianzhen.store/
curl -fsS https://annotation-script-center.xiangtianzhen.store/api/data-baker-cvpc/liuzhou-helper/ai/recommend/health
curl -fsS https://annotation-script-center.xiangtianzhen.store/api/bytedance-aidp/suzhou-helper/ai/recommend/defaults
curl -fsS https://annotation-script-center.xiangtianzhen.store/api/bytedance-aidp/jinhua-helper/ai/recommend/defaults
curl -fsS https://annotation-script-center.xiangtianzhen.store/api/magic-data/hangzhou-helper/ai/defaults
```

## 7. 本地真实浏览器验收

1. 本地执行 `node scripts/build-options-app.js`。
2. 在 Chrome / Edge 扩展管理页重新加载仓库 `extension/`。
3. Options 的 Server 地址应为新 HTTPS 域名；schema 30 中精确旧默认地址会迁移，自定义地址保持不变。
4. 验证管理员登录、下载中心和四脚本 defaults。
5. 分别在柳州、苏州、金华、杭州真实页面执行一次核心功能；确认没有自动保存、自动提交或自动切题。

## 8. 验收通过后的正式产物

只在本地执行：

```powershell
npm test
node scripts/build-options-app.js
node scripts/package-crx-release.js
```

确认 `dist/` 仅包含固定四项后，通过 `scp` 或 SFTP 上传到服务器 `/var/www/annotation-script-center/dist/`。上传后再次检查 update XML、latest JSON、CRX 与 ZIP 均返回 200，再决定合并 `main`。

## 9. 更新与回滚

更新当前测试分支：

```bash
cd /var/www/annotation-script-center
git status --short
git fetch origin
git pull --ff-only origin codex/options-vue-full-migration
pm2 restart annotation-script-center --update-env
pm2 status annotation-script-center
```

若新提交有问题，优先检出上一条已验证提交，不删除服务器私密 env：

```bash
cd /var/www/annotation-script-center
git log --oneline -5
git switch --detach <上一条已验证的提交哈希>
pm2 restart annotation-script-center --update-env
```

恢复分支时重新执行 `git switch codex/options-vue-full-migration`。排障使用 `pm2 logs annotation-script-center --lines 200`、`sudo nginx -t` 和 Nginx error log，不输出完整请求体、token 或私密环境文件。
