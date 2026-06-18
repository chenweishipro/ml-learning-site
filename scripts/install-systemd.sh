#!/bin/bash
# 安装 systemd unit + 启动
set -e
SUDO=""
if [ "$EUID" -ne 0 ]; then SUDO="sudo"; fi

$SUDO mv -f /tmp/ml-learning.service /etc/systemd/system/ml-learning.service
$SUDO chown root:root /etc/systemd/system/ml-learning.service
$SUDO chmod 644 /etc/systemd/system/ml-learning.service
$SUDO systemctl daemon-reload
$SUDO systemctl enable ml-learning.service

# 关掉其他裸 nohup 进程
ss -tlnp 2>/dev/null | grep ':7892' | grep -oE 'pid=[0-9]+' | cut -d= -f2 | xargs -r $SUDO kill -9 2>/dev/null || true
sleep 2
$SUDO systemctl restart ml-learning
sleep 3
systemctl is-active ml-learning && echo "✓ ml-learning.service 启动成功"
ss -tlnp | grep ':7892' || echo "✗ 7892 端口没在监听"
