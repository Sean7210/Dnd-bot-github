// ── utils/stateStore.js ──────────────────────────────────────────────────────
// Persistencia de estado en memoria → SQLite
// Cubre: duelos activos, eventos activos (aleatorios + caza)
// Los Maps en memoria se sincronizan con SQLite al escribir y se restauran al arrancar
// ─────────────────────────────────────────────────────────────────────────────

const { get, all, run, exists } = require('./database.js');

// ─── DUELOS ───────────────────────────────────────────────────────────────────
function saveDuelo(guildId, estado) {
  if (!exists()) return;
  run(`INSERT INTO duelos_activos (guild_id, estado, created_at)
       VALUES (?, ?, strftime('%s','now'))
       ON CONFLICT(guild_id) DO UPDATE SET estado=excluded.estado`,
    guildId, JSON.stringify(estado));
}

function loadDuelo(guildId) {
  if (!exists()) return null;
  const row = get('SELECT estado FROM duelos_activos WHERE guild_id = ?', guildId);
  if (!row) return null;
  try { return JSON.parse(row.estado); } catch { return null; }
}

function deleteDuelo(guildId) {
  if (!exists()) return;
  run('DELETE FROM duelos_activos WHERE guild_id = ?', guildId);
}

function loadAllDuelos() {
  if (!exists()) return [];
  return all('SELECT guild_id, estado FROM duelos_activos').map(r => {
    try { return { guildId: r.guild_id, estado: JSON.parse(r.estado) }; } catch { return null; }
  }).filter(Boolean);
}

// ─── EVENTOS ──────────────────────────────────────────────────────────────────
function saveEvento(guildId, evento, tipo, expiraAt) {
  if (!exists()) return;
  run(`INSERT INTO eventos_activos (guild_id, evento, tipo, expira_at, created_at)
       VALUES (?, ?, ?, ?, strftime('%s','now'))
       ON CONFLICT(guild_id) DO UPDATE SET evento=excluded.evento, tipo=excluded.tipo, expira_at=excluded.expira_at`,
    guildId, JSON.stringify(evento), tipo || 'aleatorio', expiraAt || null);
}

function loadEvento(guildId) {
  if (!exists()) return null;
  const row = get('SELECT * FROM eventos_activos WHERE guild_id = ?', guildId);
  if (!row) return null;
  // Verificar que no expiró
  if (row.expira_at && Math.floor(Date.now()/1000) > row.expira_at) {
    deleteEvento(guildId);
    return null;
  }
  try { return { ...JSON.parse(row.evento), tipo: row.tipo, expira_at: row.expira_at }; } catch { return null; }
}

function deleteEvento(guildId) {
  if (!exists()) return;
  run('DELETE FROM eventos_activos WHERE guild_id = ?', guildId);
}

function loadAllEventos() {
  if (!exists()) return [];
  const ahora = Math.floor(Date.now()/1000);
  // Limpiar expirados
  run('DELETE FROM eventos_activos WHERE expira_at IS NOT NULL AND expira_at < ?', ahora);
  return all('SELECT * FROM eventos_activos').map(r => {
    try { return { guildId: r.guild_id, tipo: r.tipo, evento: JSON.parse(r.evento), expira_at: r.expira_at }; }
    catch { return null; }
  }).filter(Boolean);
}

// ─── COOLDOWNS ────────────────────────────────────────────────────────────────
function setCooldown(userId, accion, duracionMs) {
  if (!exists()) return;
  const expira = Math.floor((Date.now() + duracionMs) / 1000);
  run(`INSERT INTO cooldowns (user_id, accion, expira_at) VALUES (?,?,?)
       ON CONFLICT(user_id, accion) DO UPDATE SET expira_at=excluded.expira_at`,
    userId, accion, expira);
}

function getCooldown(userId, accion) {
  if (!exists()) return null;
  const row = get('SELECT expira_at FROM cooldowns WHERE user_id=? AND accion=?', userId, accion);
  if (!row) return null;
  const ahora = Math.floor(Date.now()/1000);
  if (row.expira_at <= ahora) {
    run('DELETE FROM cooldowns WHERE user_id=? AND accion=?', userId, accion);
    return null;
  }
  return row.expira_at * 1000; // devolver en ms
}

function clearCooldown(userId, accion) {
  if (!exists()) return;
  run('DELETE FROM cooldowns WHERE user_id=? AND accion=?', userId, accion);
}

// Tiempo restante en segundos (null = sin cooldown)
function cooldownRestante(userId, accion) {
  const expira = getCooldown(userId, accion);
  if (!expira) return null;
  return Math.max(0, Math.ceil((expira - Date.now()) / 1000));
}

module.exports = {
  // Duelos
  saveDuelo, loadDuelo, deleteDuelo, loadAllDuelos,
  // Eventos
  saveEvento, loadEvento, deleteEvento, loadAllEventos,
  // Cooldowns
  setCooldown, getCooldown, clearCooldown, cooldownRestante,
};
