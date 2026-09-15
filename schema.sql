-- Один человек — одна строка; body — JSON карточки целиком.
CREATE TABLE IF NOT EXISTS people (
  id      TEXT PRIMARY KEY,
  body    TEXT NOT NULL,
  updated INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);

-- Неудачные входы: после 10 попыток за 15 минут вход временно закрыт.
CREATE TABLE IF NOT EXISTS login_fail (
  ts INTEGER NOT NULL
);
