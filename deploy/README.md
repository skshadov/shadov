# Deploy на Timeweb VPS

## Файлы
- `vps-bootstrap.sh` — первичная настройка VPS (запускается один раз под root).
- `deploy.sh` — обновление приложения (запускается на каждый push в main через GitHub Actions).
- `ecosystem.config.cjs` — конфиг PM2.
- `nginx.shadov.pro.conf` — конфиг nginx (HTTP, certbot потом добавит HTTPS).
- `env.production.example` — шаблон `.env.production` (заполняется на VPS, не коммитится).

## Архитектура
```
Lovable правки ─push─▶ GitHub main ─Actions─▶ SSH deploy@VPS ─▶ deploy.sh
                                                                    │
                                          git pull → bun install → build → pm2 reload
                                                                    │
                                                            nginx :443 → node :3000
```

## Последовательность первого запуска
См. `STAGE-6-VPS-DEPLOY-GUIDE.md` в корне проекта.