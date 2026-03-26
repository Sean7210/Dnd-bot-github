-- ── schema.sql ────────────────────────────────────────────────────────────────
-- Base de datos del Bot D&D 5e
-- Ejecutar: sqlite3 dnd_bot.db < schema.sql
-- O se crea automáticamente al arrancar el bot (initSchema en utils/database.js)
-- ─────────────────────────────────────────────────────────────────────────────

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── PERSONAJES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  user_id       TEXT PRIMARY KEY,
  guild_id      TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL,
  race          TEXT DEFAULT '',
  class         TEXT DEFAULT '',
  subclass      TEXT DEFAULT '',
  background    TEXT DEFAULT '',
  alignment     TEXT DEFAULT '',
  level         INTEGER DEFAULT 1,
  hp_max        INTEGER DEFAULT 10,
  hp_actual     INTEGER DEFAULT 10,
  prof_bonus    INTEGER DEFAULT 2,
  pending_level_up  INTEGER DEFAULT 0,
  pending_asi       INTEGER DEFAULT 0,
  equipo_inicial_elegido INTEGER DEFAULT 0,
  final_stats   TEXT DEFAULT '{}',   -- JSON: {STR,DEX,CON,INT,WIS,CHA}
  skills        TEXT DEFAULT '[]',   -- JSON: ["Atletismo", ...]
  languages     TEXT DEFAULT '[]',   -- JSON: ["Común", ...]
  magia         TEXT DEFAULT NULL,   -- JSON: sistema completo de magia
  extra         TEXT DEFAULT '{}',   -- JSON: campos adicionales
  created_at    INTEGER DEFAULT (strftime('%s','now')),
  updated_at    INTEGER DEFAULT (strftime('%s','now'))
);

-- ── INVENTARIO ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL REFERENCES characters(user_id),
  nombre        TEXT NOT NULL,
  cantidad      INTEGER DEFAULT 1,
  peso          REAL DEFAULT 0,
  precio        REAL DEFAULT 0,
  categoria     TEXT DEFAULT 'General',
  dano          TEXT DEFAULT NULL,
  propiedades   TEXT DEFAULT NULL,
  descripcion   TEXT DEFAULT NULL,
  es_vale       INTEGER DEFAULT 0,
  es_unica      INTEGER DEFAULT 0,
  es_dorada     INTEGER DEFAULT 0,
  extra         TEXT DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);

-- ── MONEDERO ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS money (
  user_id TEXT PRIMARY KEY REFERENCES characters(user_id),
  PC      INTEGER DEFAULT 0,  -- Cobre
  PP      INTEGER DEFAULT 0,  -- Plata
  PE      INTEGER DEFAULT 0,  -- Electrum
  PO      INTEGER DEFAULT 0,  -- Oro
  PT      INTEGER DEFAULT 0   -- Platino
);

-- ── COFRE DEL GREMIO ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guild_chest (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   TEXT NOT NULL REFERENCES characters(user_id),
  nombre    TEXT NOT NULL,
  cantidad  INTEGER DEFAULT 1,
  peso      REAL DEFAULT 0,
  precio    REAL DEFAULT 0,
  categoria TEXT DEFAULT 'General',
  extra     TEXT DEFAULT '{}',
  added_at  INTEGER DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_chest_user ON guild_chest(user_id);

CREATE TABLE IF NOT EXISTS guild_chest_meta (
  user_id      TEXT PRIMARY KEY REFERENCES characters(user_id),
  activo       INTEGER DEFAULT 1,
  deuda        INTEGER DEFAULT 0,        -- PO acumuladas sin pagar
  ultimo_cobro INTEGER DEFAULT (strftime('%s','now')),
  bloqueado    INTEGER DEFAULT 0         -- 1 = no puede retirar hasta pagar
);
-- Mantenimiento: 10 PO cada 21 días

-- ── OBJETOS MÁGICOS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS magic_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL REFERENCES characters(user_id),
  item_id     INTEGER DEFAULT NULL,
  nombre      TEXT NOT NULL,
  rareza      TEXT DEFAULT NULL,
  descripcion TEXT DEFAULT NULL,
  equipado    INTEGER DEFAULT 0,
  extra       TEXT DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_magic_user ON magic_items(user_id);

-- ── SESIONES DE JUEGO ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  session_id    TEXT PRIMARY KEY,
  guild_id      TEXT NOT NULL,
  dm_id         TEXT DEFAULT NULL,
  titulo        TEXT DEFAULT NULL,
  descripcion   TEXT DEFAULT NULL,
  estado        TEXT DEFAULT 'activa',   -- activa | cerrada
  participantes TEXT DEFAULT '[]',       -- JSON: [userId, ...]
  creada_at     INTEGER DEFAULT (strftime('%s','now')),
  cerrada_at    INTEGER DEFAULT NULL
);

-- ── ESTADO DE LOCALES (tiendas, bar, etc.) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS locales (
  guild_id   TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  tipo       TEXT NOT NULL,   -- tienda | bar | alquimista | artificiero
  abierto    INTEGER DEFAULT 0,
  config     TEXT DEFAULT '{}', -- JSON: precios ajustados, rarezas, etc.
  PRIMARY KEY (guild_id, channel_id, tipo)
);

-- ── COOLDOWNS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cooldowns (
  user_id   TEXT NOT NULL,
  accion    TEXT NOT NULL,    -- entrenar | duelo | apostar | evento | etc.
  expira_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, accion)
);

-- ── DUELOS ACTIVOS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duelos_activos (
  guild_id   TEXT PRIMARY KEY,
  estado     TEXT NOT NULL,   -- JSON completo del estado del duelo
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- ── EVENTOS ACTIVOS (aleatorios + caza) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos_activos (
  guild_id   TEXT PRIMARY KEY,
  evento     TEXT NOT NULL,   -- JSON del evento
  tipo       TEXT DEFAULT 'aleatorio',  -- aleatorio | caza
  expira_at  INTEGER DEFAULT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- ── SUBASTAS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subastas (
  guild_id   TEXT PRIMARY KEY,
  estado     TEXT NOT NULL,   -- JSON de la subasta activa
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- ── STATS TEMPORALES (efectos del bar) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS stats_temp (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   TEXT NOT NULL,
  stat      TEXT NOT NULL,    -- STR | DEX | CON | INT | WIS | CHA
  bonus     INTEGER NOT NULL,
  expira_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stats_temp_user ON stats_temp(user_id);

-- ── LOGROS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logros (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  obtenido_at INTEGER DEFAULT (strftime('%s','now'))
);

-- ── MEJORAS ARTIFICIERO PENDIENTES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artificiero_pendiente (
  user_id       TEXT PRIMARY KEY,
  precio        INTEGER DEFAULT 0,
  materiales    TEXT DEFAULT NULL,
  caracteristica TEXT DEFAULT NULL,
  creado_at     INTEGER DEFAULT (strftime('%s','now'))
);

-- ── VISTA ÚTIL: personaje con dinero ─────────────────────────────────────────
CREATE VIEW IF NOT EXISTS v_characters_money AS
SELECT
  c.user_id, c.name, c.race, c.class, c.level,
  c.hp_max, c.hp_actual,
  COALESCE(m.PO,0) AS PO,
  COALESCE(m.PP,0) AS PP,
  COALESCE(m.PC,0) AS PC,
  COALESCE(m.PE,0) AS PE,
  COALESCE(m.PT,0) AS PT,
  (COALESCE(m.PC,0) + COALESCE(m.PP,0)*10 + COALESCE(m.PE,0)*50
   + COALESCE(m.PO,0)*100 + COALESCE(m.PT,0)*1000) AS total_PC
FROM characters c
LEFT JOIN money m ON c.user_id = m.user_id;

-- ── VISTA ÚTIL: cofres con deuda ─────────────────────────────────────────────
CREATE VIEW IF NOT EXISTS v_cofres_deudores AS
SELECT
  gcm.user_id, c.name,
  gcm.deuda, gcm.bloqueado, gcm.ultimo_cobro,
  COUNT(gc.id) AS total_items
FROM guild_chest_meta gcm
JOIN characters c ON gcm.user_id = c.user_id
LEFT JOIN guild_chest gc ON gcm.user_id = gc.user_id
WHERE gcm.deuda > 0
GROUP BY gcm.user_id;
