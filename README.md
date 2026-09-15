# Сертификаты по доверенности

Учёт людей, чьи сертификаты по греческому (βεβαίωση ελληνομάθειας) я забираю:
документы (доверенность, удостоверение, карточка участника — прислали/распечатала),
встреча, оплата, выдача сертификата. Удобно с телефона.

- Страница: https://konyaginaan.github.io/greek-certificates/ — `index.html` в корне, GitHub Pages.
- Данные: Cloudflare Worker `greek-certs` → https://greek-certs.norevia.workers.dev, база D1 `greek-certs`.
  В репозитории данных нет — только код.

## Пароль

Задаётся один раз секретом воркера (и так же меняется; смена выходит со всех устройств):

```bash
npx wrangler secret put APP_PASSWORD
```

## Правки

- страница — правка `index.html`, `git push`;
- сервер — `npm run deploy`;
- схема базы — `schema.sql`, применяется `npx wrangler d1 execute greek-certs --remote --file schema.sql`.

Локально: `.dev.vars` с `APP_PASSWORD=...`, `npx wrangler dev --port 8788`, страница с `localhost`
сама ходит на `http://localhost:8788`.
