# Деплой shadov.pro на Timeweb VPS — пошагово

VPS: `104.171.128.240` · Repo: `https://github.com/skshadov/shadov` · Домен: `shadov.pro`

Все скрипты лежат в `deploy/` и закоммичены вместе с этим гайдом. После Lovable-сейва они автоматически окажутся на GitHub и на VPS.

---

## Шаг 0 (важно, сделайте СЕЙЧАС)
Смените root-пароль в панели Timeweb — старый вы прислали в открытом чате. Любой новый сложный пароль; всё равно root SSH мы скоро отключим.

---

## Шаг 1. Сгенерируйте SSH-ключ для GitHub Actions (на своём компьютере, не на VPS)

На вашем ПК (Windows PowerShell / macOS Terminal):
```bash
ssh-keygen -t ed25519 -C "github-actions-shadov" -f ~/.ssh/shadov_deploy -N ""
```
Будут созданы два файла:
- `~/.ssh/shadov_deploy` — приватный ключ (его положим в GitHub Secrets)
- `~/.ssh/shadov_deploy.pub` — публичный ключ (его положим на VPS)

---

## Шаг 2. Первичная настройка VPS

Зайдите по SSH под root (одноразово):
```bash
ssh root@104.171.128.240
# (пароль — новый, тот что только что сменили в шаге 0)
```

На VPS выполните:
```bash
curl -fsSL https://raw.githubusercontent.com/skshadov/shadov/main/deploy/vps-bootstrap.sh -o /tmp/bootstrap.sh
bash /tmp/bootstrap.sh
```
Скрипт сам поставит nginx, Node 20, bun, pm2, ufw, fail2ban, clonе репо в `/var/www/shadov`, создаст пользователя `deploy`, настроит PM2 автозапуск. Идёт ~5 минут.

По завершении он выведет «ВРУЧНУЮ ОСТАЛОСЬ». Делаем по списку:

### 2a. Положите публичный SSH-ключ
На VPS, всё ещё под root:
```bash
nano /home/deploy/.ssh/authorized_keys
# вставьте содержимое ~/.ssh/shadov_deploy.pub с вашего ПК (одна длинная строка)
# Ctrl+O, Enter, Ctrl+X
```

### 2b. Создайте `.env.production` на VPS
```bash
sudo -iu deploy
cp /var/www/shadov/deploy/env.production.example /var/www/shadov/.env.production
nano /var/www/shadov/.env.production
```
Замените `__PASTE_FROM_LOVABLE_CLOUD__` на реальный `SUPABASE_SERVICE_ROLE_KEY` — он лежит в Lovable: вкладка **Cloud → Backend → Settings → Project API keys → service_role**. Скопируйте и вставьте, сохраните.

### 2c. Первая сборка и старт
(всё ещё под пользователем `deploy`):
```bash
cd /var/www/shadov
bun install --frozen-lockfile
NITRO_PRESET=node-server bun run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
```
Проверьте, что сайт отвечает на localhost VPS:
```bash
curl -I http://127.0.0.1:3000
# должно быть HTTP/1.1 200 OK
```
И снаружи по IP (без SSL пока):
```
http://104.171.128.240
```
Откроется главная — пока nginx отдаёт по HTTP, домен ещё не подключён.

---

## Шаг 3. Переключение DNS shadov.pro на VPS

Вы сказали «домен остаётся в Lovable, DNS переносим на Timeweb». Здесь есть два варианта формулировки — уточните, какой из них:

- **Вариант А (рекомендую)**: домен зарегистрирован в Lovable, NS-серверы оставляем Lovable, но в Lovable DNS-менеджере меняем A-записи с `185.158.133.1` на `104.171.128.240`. Lovable Project Settings → Domains → `shadov.pro` → ⋯ → Configure → Manage DNS records.
- **Вариант Б**: меняем NS-серверы домена в Lovable на NS Timeweb (`ns1.timeweb.ru`, `ns2.timeweb.ru`), DNS-зона полностью переезжает в панель Timeweb, там создаём A-записи на `104.171.128.240`.

В обоих случаях нужны записи:
| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | 104.171.128.240 | 300 |
| A | www | 104.171.128.240 | 300 |

Старые A-записи на 185.158.133.1 и TXT `_lovable` после переноса удаляйте только когда сайт уже работает на VPS — иначе Lovable-домен «отвалится» раньше времени.

Проверка пропагации:
```bash
dig +short shadov.pro
# должно вернуть 104.171.128.240
```
Обычно 5–30 минут, изредка до нескольких часов.

---

## Шаг 4. SSL через Let's Encrypt

После того как `dig +short shadov.pro` показал ваш IP, на VPS:
```bash
sudo certbot --nginx -d shadov.pro -d www.shadov.pro \
  --non-interactive --agree-tos -m you@shadov.pro --redirect
```
certbot сам:
- выпустит сертификат;
- допишет 443-блок в nginx-конфиг;
- настроит redirect 80 → 443;
- зарегистрирует cron на автообновление сертификата.

Проверьте: `https://shadov.pro` открывается с замочком.

---

## Шаг 5. GitHub Secrets для авто-деплоя

Откройте `https://github.com/skshadov/shadov/settings/secrets/actions` и добавьте **три** секрета:

| Name | Value |
|---|---|
| `VPS_HOST` | `104.171.128.240` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | содержимое файла `~/.ssh/shadov_deploy` целиком (включая `-----BEGIN OPENSSH PRIVATE KEY-----` … `-----END OPENSSH PRIVATE KEY-----`) |

После этого любой push в `main` (то есть любой сейв в Lovable) будет триггерить workflow `.github/workflows/deploy.yml`. Прогресс смотрите на вкладке **Actions** в GitHub.

Первый запуск проверьте вручную: GitHub → Actions → Deploy to Timeweb VPS → Run workflow.

---

## Шаг 6. Закрываем root-доступ

После того как убедились, что `ssh deploy@104.171.128.240` работает по ключу (без пароля), на VPS:
```bash
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```
С этого момента: только пользователь `deploy`, только по SSH-ключу.

---

## Что в итоге
- Сайт работает на `https://shadov.pro` (Nitro Node, pm2, nginx, Let's Encrypt).
- Lovable Cloud (БД, auth, storage, edge functions) остаётся прежним — те же ключи в `.env.production`.
- Lovable preview/published продолжают работать на `*.lovable.app` как staging.
- Каждый сейв в Lovable → push в GitHub → GitHub Actions → SSH → `deploy.sh` на VPS → zero-downtime reload через pm2.
- Откат: `ssh deploy@VPS 'cd /var/www/shadov && git reset --hard <commit> && NITRO_PRESET=node-server bun run build && pm2 reload shadov'`.

---

## Что делать прямо сейчас
1. Сменить root-пароль в панели Timeweb (Шаг 0).
2. Сгенерировать SSH-ключ на своём ПК (Шаг 1).
3. Залогиниться по SSH под root и запустить `vps-bootstrap.sh` (Шаг 2).
4. Когда дойдёте до **Шага 2b** — напишите мне, я подскажу, где взять `SUPABASE_SERVICE_ROLE_KEY` (он есть в Lovable Cloud, скрин покажу).