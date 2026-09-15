/**
 * API учёта сертификатов. Страница — на GitHub Pages, здесь только данные.
 *
 * Секрет:
 *   APP_KEY — ключ доступа из личной ссылки (…/#k=КЛЮЧ). Страница шлёт его
 *   в заголовке Authorization; без него сервер ничего не отдаёт. Смена ключа
 *   (wrangler secret put APP_KEY) отключает старую ссылку на всех устройствах.
 */

const ALLOWED_ORIGINS = ["https://konyaginaan.github.io"];
const MAX_BODY = 64 * 1024;
const MAX_PEOPLE = 2000;
const CURRENCIES = ["€", "₽", "$"];

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    let res;
    try {
      res = await route(request, env, new URL(request.url));
    } catch (err) {
      console.error(err);
      res = json({ error: "server_error" }, 500);
    }
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const ok = ALLOWED_ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (!ok) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

async function route(request, env, url) {
  const { pathname } = url;
  const method = request.method;

  if (pathname === "/api/health" && method === "GET") {
    return json({ ok: true, configured: !!env.APP_KEY });
  }

  if (!pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
  if (!env.APP_KEY) return json({ error: "not_configured" }, 503);
  if (!hasKey(request, env)) return json({ error: "unauthorized" }, 401);

  if (pathname === "/api/data" && method === "GET") return readAll(env);
  if (pathname === "/api/settings" && method === "PUT") return saveSettings(request, env);

  const m = pathname.match(/^\/api\/people\/([a-z0-9]{4,40})$/);
  if (m && method === "PUT") return savePerson(request, env, m[1]);
  if (m && method === "DELETE") {
    await env.DB.prepare("DELETE FROM people WHERE id = ?1").bind(m[1]).run();
    return json({ ok: true });
  }
  return json({ error: "not_found" }, 404);
}

/* ---------- данные ---------- */

async function readAll(env) {
  const [people, settings] = await env.DB.batch([
    env.DB.prepare("SELECT id, body FROM people"),
    env.DB.prepare("SELECT k, v FROM settings"),
  ]);
  const out = {};
  for (const row of people.results) {
    try { out[row.id] = JSON.parse(row.body); } catch { /* битую строку пропускаем */ }
  }
  const s = Object.fromEntries(settings.results.map((r) => [r.k, r.v]));
  return json({ people: out, settings: { currency: s.currency || "€" } });
}

async function savePerson(request, env, id) {
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: "too_large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "bad_request" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "bad_request" }, 400);

  const exists = await env.DB.prepare("SELECT 1 FROM people WHERE id = ?1").bind(id).first();
  if (!exists) {
    const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM people").first();
    if (n >= MAX_PEOPLE) return json({ error: "too_many" }, 409);
  }
  await env.DB.prepare(
    "INSERT INTO people (id, body, updated) VALUES (?1, ?2, ?3) " +
    "ON CONFLICT(id) DO UPDATE SET body = excluded.body, updated = excluded.updated",
  ).bind(id, JSON.stringify(body), Date.now()).run();
  return json({ ok: true });
}

async function saveSettings(request, env) {
  const { currency } = await request.json().catch(() => ({}));
  if (!CURRENCIES.includes(currency)) return json({ error: "bad_request" }, 400);
  await env.DB.prepare(
    "INSERT INTO settings (k, v) VALUES ('currency', ?1) ON CONFLICT(k) DO UPDATE SET v = excluded.v",
  ).bind(currency).run();
  return json({ ok: true });
}

/* ---------- доступ ---------- */

function hasKey(request, env) {
  const m = (request.headers.get("Authorization") || "").match(/^Bearer (\S+)$/);
  return !!m && sameSecret(m[1], env.APP_KEY);
}

function sameSecret(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
