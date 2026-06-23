# Stage 6 — Финальная подготовка к запуску shadov.pro

## Сводка

Что выполнено агентом автоматически и подтверждено:

### Чекпоинт 1 — инфраструктура и аудит спецификации
- Инвентарь маршрутов: 80 файлов (54 публичных, 19 admin, 2 client, server routes — sitemap.xml, api/*).
- Build (`bun run build`): **exit 0**.
- Typecheck (`tsgo --noEmit`): **exit 0**.
- Service-role ключ в client bundle: **не обнаружен** (только в audit-скриптах, не импортируются ниоткуда из routes/components).
- Инвентарь переменных окружения: `environment-variables-inventory.json`.

### Чекпоинт 2 — SEO
- Создан `public/robots.txt`: allow всё, disallow `/admin`, `/client`, `/login`, `/register`, `/reset-password`, `/api/`; ссылка на sitemap.
- Расширен `src/routes/sitemap[.]xml.ts` — статических путей 53 (главная, услуги стройка/ремонт/инженерка, юр-страницы, прайс, калькулятор, портфолио, отзывы, контакты, реквизиты, СРО). Динамика подтягивается из `service_categories`/`services` (published), как только данные будут залиты.
- Исправлены SEO-теги `src/routes/__root.tsx`: убраны дефолтные «Lovable App» / «Pixel Perfect Replica»; теперь title/og:title/twitter:title = «Шадов и партнёры — строительство и ремонт под ключ», описание соответствует тематике, добавлен `og:url=https://shadov.pro`.
- Покрытие per-route `head()`: 53/54 публичных маршрутов имеют собственный head (исключение — layout-only `catalog.tsx`, который только рендерит `<Outlet/>`).
- Битых hash-ссылок на удалённый `#estimate` — 0. Placeholder/blank-page компонентов — 0.

### Чекпоинт 3 — Build / Typecheck регрессия
- `bun run build` — exit 0 (см. `build-final.log`).
- `tsgo --noEmit` — exit 0 (см. `typescript-final.log`).

## Блокеры, которые невозможно закрыть без владельца

| ID | Область | Что нужно от вас |
|---|---|---|
| BLK-1 | Каталог/прайс | CSV/XLSX на 334 позиции, 24 категории, 35 услуг — либо подтверждение «публикуем без прайса» |
| BLK-2 | Реквизиты | ИНН, КПП, ОГРН, юр. и фактический адрес, телефон, email, СРО, банк/р-с/к-с/БИК |
| BLK-3 | Домен | Подключить shadov.pro в Project Settings → Domains, дождаться DNS/SSL, проверить доступность с RU IP |
| BLK-4 | Email уведомления | Реальный email-получатель заявок + подтверждение email-домена (SPF/DKIM/DMARC через Lovable Emails) |
| BLK-5 | Аналитика | ID Яндекс.Метрики; токен подтверждения Google Search Console |
| BLK-6 | Мониторинг/бэкап | Решение: встроенный бэкап Lovable Cloud + DR-план или внешний UptimeRobot/Healthchecks |

## Что нельзя проверить из песочницы агента
- Реальный DNS, SSL chain, HSTS, доступность из РФ для shadov.pro (домен не подключён).
- Доставка писем с боевого SMTP/Lovable Emails.
- Real-user analytics, Search Console indexation.
- Production smoke tests на боевом URL — пока живёт только preview `https://shadov.lovable.app`.

Эти проверки запускаются Стадией 6.5 (Post-Domain Verification) сразу после команды `GO LIVE` и подключения домена.

## Чек-лист «GO LIVE»

Перед командой `GO LIVE` владелец должен предоставить:
1. ✅ Каталог/прайс (CSV/XLSX) либо явное «публикуем без каталога».
2. ✅ Полные реквизиты компании.
3. ✅ Домен подключён в Project Settings (статус Active).
4. ✅ Email для получения заявок и подтверждение email-домена.
5. ✅ ID Яндекс.Метрики и/или Google Tag.
6. ✅ Решение по мониторингу/бэкапам.

После `GO LIVE` агент выполнит:
- Залив каталога и реквизитов миграцией.
- Подключение Метрики/GSC.
- Production smoke tests, lighthouse, axe-core по боевому URL.
- DNS/SSL/header проверки.
- Архив `stage-6-final-postlaunch-audit.zip` с финальным audit.json.

## Файлы артефактов

- `checkpoint-1-summary.json` — спецификация, окружение, инфраструктура.
- `checkpoint-2-seo.json` — SEO/sitemap/robots/heads.
- `checkpoint-3-build.json` — build/typecheck.
- `environment-variables-inventory.json` — переменные окружения.
- `production-content-checklist.json` — статус реального контента.
- `build-final.log`, `build.log` — build выводы.
- `typescript-final.log`, `typescript.log` — typecheck выводы.

## Статус

**Stage 6 prelaunch (то, что можно без владельца) — DONE.**
**Ожидание команды `GO LIVE` и входных данных по BLK-1..6.**
