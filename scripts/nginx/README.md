# 域名 + HTTPS 部署指南

## 前置条件
- 一个你控制的域名 (例如 `ml.example.com`)
- 域名 A 记录指向 `122.51.221.63`
- `sudo` 权限

## 1. DNS 配置 (在域名注册商后台)
```
ml.example.com    A    122.51.221.63
www.ml.example.com A    122.51.221.63
```

## 2. 服务器初始化
```bash
# 安装 nginx + certbot (Ubuntu 24.04)
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# 启动 nginx
systemctl enable nginx
systemctl start nginx
```

## 3. 部署 ML 学习站 systemd 服务
```bash
# 把 v12.3 写的 ml-learning.service 已经配好, systemd 监听 7892
systemctl status ml-learning  # 应该是 active
curl http://127.0.0.1:7892/   # 应该 200
```

## 4. 配置 nginx + 一键 HTTPS
```bash
cd /workspace/ml-site
sudo ./scripts/setup-https.sh ml.example.com admin@example.com
```

脚本会:
- 拷贝 `scripts/nginx/ml-learning.conf` 到 `/etc/nginx/sites-available/`
- 替换 `your-domain.com` 为你的域名
- `certbot --nginx` 申请 Let's Encrypt 证书
- 配置 HTTP → HTTPS 重定向
- 加 certbot 自动续期 cron

## 5. 验证
```bash
curl -I https://ml.example.com/  # 应该 200
curl -I https://ml.example.com/   # 证书应有效
```

## 6. 验证 HSTS
浏览器开发者工具 → Network → 看响应头:
- `Strict-Transport-Security: max-age=63072000`
- `X-Frame-Options: SAMEORIGIN`

## 后续维护

- 证书自动续期: `certbot renew` (cron 已配)
- 重启 ML 服务: `sudo systemctl restart ml-learning`
- nginx 日志: `/var/log/nginx/ml-learning.*.log`
- ML 日志: `journalctl -u ml-learning`

## 关键坑
1. **trailingSlash**: Next.js 配置 `trailingSlash: true`, 访问 `/courses` 会 308 到 `/courses/`, nginx 要正确处理
2. **WebSocket**: 没用到, 标准 proxy_pass 即可
3. **PWA sw.js**: 必须 `Cache-Control: no-cache`, 否则浏览器缓存旧 sw
4. **rate limit**: nginx `limit_req` 加 burst=20 nodelay, 防止被刷爆
5. **certbot + DNS**: Let's Encrypt 用 HTTP-01 校验, 必须能访问 80 端口
