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

