# Сертификаты по доверенности

Учёт людей, чьи сертификаты по греческому (βεβαίωση ελληνομάθειας) я забираю:
документы (доверенность, удостоверение, карточка участника — прислали/распечатала),
встреча, оплата, выдача сертификата. Удобно с телефона.

- Страница: https://konyaginaan.github.io/greek-certificates/ — `index.html` в корне, GitHub Pages.
- Данные: Cloudflare Worker `greek-certs` → https://greek-certs.norevia.workers.dev, база D1 `greek-certs`.
  В репозитории данных нет — только код.

## Доступ

Пароля нет: страница открывается по личной ссылке `https://konyaginaan.github.io/greek-certificates/#k=КЛЮЧ`.
Часть после `#` не уходит на GitHub, страница запоминает ключ на устройстве и шлёт его воркеру.
Без ключа воркер ничего не отдаёт. Сам ключ — секрет воркера `APP_KEY`, в репозитории его нет.

Сменить ключ (старая ссылка перестанет работать везде):

```bash
openssl rand -base64 30 | tr "+/" "-_" | tr -d "=\n" | npx wrangler secret put APP_KEY
```

## Правки

- страница — правка `index.html`, `git push`;
- сервер — `npm run deploy`;
- схема базы — `schema.sql`, применяется `npx wrangler d1 execute greek-certs --remote --file schema.sql`.

Локально: `.dev.vars` с `APP_KEY=...`, `npx wrangler dev --port 8788`, страница с `localhost`
сама ходит на `http://localhost:8788`.
