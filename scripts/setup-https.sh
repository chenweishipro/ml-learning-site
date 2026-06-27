#!/bin/bash
# 一键配置 HTTPS — 适用 Ubuntu 24.04 + nginx
# 用法: sudo ./setup-https.sh your-domain.com
set -e

DOMAIN="${1:?Usage: $0 your-domain.com}"
EMAIL="${2:-admin@$DOMAIN}"

echo "==> 配置 $DOMAIN 的 HTTPS"

# 1) certbot (Let's Encrypt)
if ! command -v certbot &> /dev/null; then
    echo "==> 安装 certbot"
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# 2) 准备 nginx 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NGINX_CONF="/etc/nginx/sites-available/ml-learning"

echo "==> 拷贝 nginx 配置到 $NGINX_CONF"
sed "s/your-domain.com/$DOMAIN/g" "$SCRIPT_DIR/nginx/ml-learning.conf" > "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/ml-learning

# 3) nginx 配置测试
echo "==> 写入 limit_req_zone (http context) 到 conf.d"
mkdir -p /etc/nginx/snippets
cp "$SCRIPT_DIR/nginx/snippets/limit_req_zone.conf" /etc/nginx/snippets/
if ! grep -q "include /etc/nginx/snippets/limit_req_zone.conf;" /etc/nginx/nginx.conf; then
    sed -i 's|include /etc/nginx/conf.d/\*.conf;|include /etc/nginx/conf.d/*.conf;\n    include /etc/nginx/snippets/limit_req_zone.conf;|' /etc/nginx/nginx.conf
fi
echo "==> nginx -t"
nginx -t

# 4) 申请证书 (IDN 需要先转 Punycode, 因 certbot 不支持中文域名)
echo "==> 申请证书"
# 检测是否为中文/非 ASCII 域名, 转为 Punycode
if echo "$DOMAIN" | grep -qP '[^\x00-\x7F]'; then
    DOMAIN_PC=$(python3 -c "import sys; print(sys.argv[1].encode('idna').decode('ascii'))" "$DOMAIN")
    WWW_PC=$(python3 -c "import sys; print(('www.' + sys.argv[1]).encode('idna').decode('ascii'))" "$DOMAIN")
    echo "==> 检测到中文 IDN 域名, 申请 Punycode: $DOMAIN_PC + $WWW_PC"
    certbot --nginx -d "$DOMAIN_PC" -d "$WWW_PC" --non-interactive --agree-tos -m "$EMAIL"
else
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
fi

# 5) reload
systemctl reload nginx

# 6) 自动续期 (certbot 自带, 但加个 cron 防漏)
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
fi

# 7) 验证
echo
echo "==> 验证 HTTPS"
sleep 2
curl -sI "https://$DOMAIN/" | head -3
echo
echo "==> SSLLabs 评分: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "==> 完成"
