// ── db/database.js ───────────────────────────────────────────────────────────
// Capa de base de datos SQLite para el bot D&D 5e
// Usa better-sqlite3 (síncrono, rápido, ideal para bots de Discord)
//
// INSTALACIÓN: npm install better-sqlite3
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs   = require('fs');

const DB_PATH = path.join(__dirname, '..', 'dnd_bot.db'); // archivo en raíz del proyecto

let db;
try {
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');   // mejor rendimiento concurrente
  db.pragma('foreign_keys = ON');
  console.log('[DB] ✅ SQLite conectado —', DB_PATH);
} catch (e) {
  console.error('[DB] ❌ better-sqlite3 no instalado. Ejecuta: npm install better-sqlite3');
  console.error('[DB]    El bot seguirá usando characters.json como respaldo.');
  db = null;
}

// ─── ESQUEMA ──────────────────────────────────────────────────────────────────
function initSchema() {
  if (!db) return;
  db.exec(`
    -- ── PERSONAJES ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS characters (
      user_id     TEXT PRIMARY KEY,
      guild_id    TEXT NOT NULL DEFAULT '',
      name        TEXT NOT NULL,
      race        TEXT,
      class       TEXT,
      subclass    TEXT,
      background  TEXT,
      alignment   TEXT,
      level       INTEGER DEFAULT 1,
      hp_max      INTEGER DEFAULT 10,
      hp_actual   INTEGER DEFAULT 10,
      final_stats TEXT,          -- JSON: {STR,DEX,CON,INT,WIS,CHA}
      prof_bonus  INTEGER DEFAULT 2,
      skills      TEXT,          -- JSON: []
      languages   TEXT,          -- JSON: []
      subclass_unlocked INTEGER DEFAULT 0,
      pending_level_up  INTEGER DEFAULT 0,
      pending_asi       INTEGER DEFAULT 0,
      equipo_inicial_elegido INTEGER DEFAULT 0,
      magia       TEXT,          -- JSON completo del sistema de magia
      extra       TEXT,          -- JSON para campos adicionales/futuros
      created_at  INTEGER DEFAULT (strftime('%s','now')),
      updated_at  INTEGER DEFAULT (strftime('%s','now'))
    );

    -- ── INVENTARIO ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS inventory (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      nombre      TEXT NOT NULL,
      cantidad    INTEGER DEFAULT 1,
      peso        REAL DEFAULT 0,
      precio      REAL DEFAULT 0,
      categoria   TEXT DEFAULT 'General',
      dano        TEXT,
      propiedades TEXT,
      descripcion TEXT,
      es_vale     INTEGER DEFAULT 0,
      es_unica    INTEGER DEFAULT 0,
      es_dorada   INTEGER DEFAULT 0,
      extra       TEXT,          -- JSON para propiedades adicionales
      FOREIGN KEY (user_id) REFERENCES characters(user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);

    -- ── MONEDERO ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS money (
      user_id     TEXT PRIMARY KEY,
      PC          INTEGER DEFAULT 0,
      PP          INTEGER DEFAULT 0,
      PE          INTEGER DEFAULT 0,
      PO          INTEGER DEFAULT 0,
      PT          INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES characters(user_id)
    );

    -- ── COFRE DEL GREMIO ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS guild_chest (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      nombre      TEXT NOT NULL,
      cantidad    INTEGER DEFAULT 1,
      peso        REAL DEFAULT 0,
      precio      REAL DEFAULT 0,
      categoria   TEXT DEFAULT 'General',
      extra       TEXT,
      added_at    INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (user_id) REFERENCES characters(user_id)
    );
    CREATE TABLE IF NOT EXISTS guild_chest_meta (
      user_id         TEXT PRIMARY KEY,
      activo          INTEGER DEFAULT 1,
      deuda           INTEGER DEFAULT 0,   -- PO acumuladas sin pagar
      ultimo_cobro    INTEGER DEFAULT (strftime('%s','now')),
      bloqueado       INTEGER DEFAULT 0,   -- 1 = no puede sacar items
      FOREIGN KEY (user_id) REFERENCES characters(user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_chest_user ON guild_chest(user_id);

    -- ── MAGIA: OBJETOS MÁGICOS ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS magic_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      item_id     INTEGER,
      nombre      TEXT NOT NULL,
      rareza      TEXT,
      descripcion TEXT,
      equipado    INTEGER DEFAULT 0,
      extra       TEXT,
      FOREIGN KEY (user_id) REFERENCES characters(user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_magic_user ON magic_items(user_id);

    -- ── SESIONES DE JUEGO ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS game_sessions (
      session_id  TEXT PRIMARY KEY,
      guild_id    TEXT NOT NULL,
      dm_id       TEXT,
      titulo      TEXT,
      descripcion TEXT,
      estado      TEXT DEFAULT 'activa',  -- activa | cerrada
      participantes TEXT,                 -- JSON: [userId, ...]
      creada_at   INTEGER DEFAULT (strftime('%s','now')),
      cerrada_at  INTEGER
    );

    -- ── ESTADO DE TIENDAS/LOCALES ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS locales (
      guild_id    TEXT NOT NULL,
      channel_id  TEXT NOT NULL,
      tipo        TEXT NOT NULL,  -- tienda | bar | alquimista | artificiero
      abierto     INTEGER DEFAULT 0,
      config      TEXT,           -- JSON: precios ajustados, rarezas, etc.
      PRIMARY KEY (guild_id, channel_id, tipo)
    );

    -- ── COOLDOWNS ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS cooldowns (
      user_id     TEXT NOT NULL,
      accion      TEXT NOT NULL,  -- entrenar | duelo | apostar | etc.
      expira_at   INTEGER NOT NULL,
      PRIMARY KEY (user_id, accion)
    );

    -- ── DUELOS ACTIVOS ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS duelos_activos (
      guild_id    TEXT PRIMARY KEY,
      estado      TEXT,           -- JSON completo del duelo
      created_at  INTEGER DEFAULT (strftime('%s','now'))
    );

    -- ── EVENTOS ACTIVOS ───────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS eventos_activos (
      guild_id    TEXT PRIMARY KEY,
      evento      TEXT,           -- JSON del evento
      tipo        TEXT,           -- aleatorio | caza
      expira_at   INTEGER,
      created_at  INTEGER DEFAULT (strftime('%s','now'))
    );

    -- ── SUBASTAS ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS subastas (
      guild_id    TEXT PRIMARY KEY,
      estado      TEXT,           -- JSON de la subasta activa
      created_at  INTEGER DEFAULT (strftime('%s','now'))
    );

    -- ── STATS TEMPORALES (BAR) ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS stats_temp (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      stat        TEXT NOT NULL,
      bonus       INTEGER NOT NULL,
      expira_at   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_stats_temp_user ON stats_temp(user_id);

    -- ── LOGROS ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS logros (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      nombre      TEXT NOT NULL,
      obtenido_at INTEGER DEFAULT (strftime('%s','now'))
    );

    -- ── MEJORAS ARTIFICIERO PENDIENTES ────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS artificiero_pendiente (
      user_id     TEXT PRIMARY KEY,
      precio      INTEGER,
      materiales  TEXT,
      caracteristica TEXT,
      creado_at   INTEGER DEFAULT (strftime('%s','now'))
    );
  `);

  console.log('[DB] ✅ Esquema inicializado');
}

// ─── HELPERS GENÉRICOS ────────────────────────────────────────────────────────
const get    = (sql, ...params) => db?.prepare(sql).get(...params)  ?? null;
const all    = (sql, ...params) => db?.prepare(sql).all(...params)  ?? [];
const run    = (sql, ...params) => db?.prepare(sql).run(...params)  ?? {};
const exists = () => !!db;

// Transacción segura
function transaction(fn) {
  if (!db) return fn(); // sin DB: ejecutar directamente
  return db.transaction(fn)();
}

module.exports = { db, initSchema, get, all, run, exists, transaction, DB_PATH };
