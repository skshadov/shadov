# Deploy на Timeweb VPS

## Файлы
- `vps-bootstrap.sh` — первичная настройка VPS (запускается один раз под root).
- `deploy.sh` — обновление приложения (запускается на каждый push в main через GitHub Actions).
- `ecosystem.config.cjs` — конфиг PM2.
- `nginx.shadov.pro.conf` — конфиг nginx (HTTP, certbot потом добавит HTTPS).
- `env.production.example` и PM2-конфиг оставлены только для архивной локальной схемы и при проксировании не используются.

## Архитектура
```
Пользователь → shadov.pro → nginx VPS (TLS) → shadov.lovable.app
                                                │
                                                └→ приложение, backend и секреты в Lovable Cloud
```

VPS не запускает копию приложения и не хранит закрытые ключи backend.

## Последовательность первого запуска
См. `STAGE-6-VPS-DEPLOY-GUIDE.md` в корне проекта.