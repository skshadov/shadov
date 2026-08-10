#!/usr/bin/env bash
# Первичная настройка VPS Ubuntu 22.04 для проекта shadov.pro.
# Запускается ОДИН РАЗ под root: bash vps-bootstrap.sh
set -euo pipefail

REPO_URL="https://github.com/skshadov/shadov.git"
APP_DIR="/var/www/shadov"
DEPLOY_USER="deploy"

echo "==> [1/9] apt update + базовые пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git unzip nginx ufw fail2ban ca-certificates gnupg lsb-release build-essential

echo "==> [2/9] VPS работает только как nginx reverse proxy"

echo "==> [5/9] firewall (открыт 22, 80, 443)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> [6/9] пользователь deploy + sudo"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG sudo "$DEPLOY_USER"
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx, /bin/systemctl restart nginx, /usr/bin/nginx -t" > /etc/sudoers.d/deploy-nginx
chmod 0440 /etc/sudoers.d/deploy-nginx

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

echo "==> [7/9] клонируем репозиторий в $APP_DIR"
install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /var/www
if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u "$DEPLOY_USER" git clone "$REPO_URL" "$APP_DIR"
fi
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

install -d -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /var/log/shadov

echo "==> [8/9] Локальный Node/PM2 не требуется"

echo "==> [9/9] nginx (HTTP) + certbot"
cp "$APP_DIR/deploy/nginx.shadov.pro.conf" /etc/nginx/sites-available/shadov.pro
ln -sf /etc/nginx/sites-available/shadov.pro /etc/nginx/sites-enabled/shadov.pro
rm -f /etc/nginx/sites-enabled/default
install -d -m 755 /var/www/certbot
nginx -t && systemctl reload nginx
apt-get install -y certbot python3-certbot-nginx

cat <<EOF

============================================================
ВРУЧНУЮ ОСТАЛОСЬ:

1) Скопируйте в /home/$DEPLOY_USER/.ssh/authorized_keys ваш публичный
   SSH-ключ (тот, что лежит в GitHub Secrets как VPS_SSH_KEY).

2) Секреты и production-переменные на VPS не нужны: приложение работает
   в Lovable Cloud, VPS только проксирует HTTPS-трафик.

4) После того как DNS shadov.pro → этот VPS пропагируется
   (проверить: dig +short shadov.pro), выпустите SSL:
     sudo certbot --nginx -d shadov.pro -d www.shadov.pro \\
       --non-interactive --agree-tos -m you@shadov.pro --redirect

5) Отключите root SSH (после того как залогинитесь под deploy по ключу):
     sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
     sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
     sudo systemctl restart ssh
============================================================
EOF