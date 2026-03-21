// ── utils/characterStore.js ───────────────────────────────────────────────────
// Persiste los personajes de cada usuario en disco (characters.json)
// Cada entrada: { [userId]: { character, guildId, savedAt } }
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'characters.json');

// ── Carga / guardado ──────────────────────────────────────────────────────────
function load() {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (_) {}
  return {};
}

function save(db) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8');
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Guarda (o sobreescribe) el personaje de un usuario. */
function saveCharacter(userId, character, guildId = null) {
  const db = load();
  db[userId] = { character, guildId, savedAt: new Date().toISOString() };
  save(db);
}

/** Devuelve el personaje de un usuario, o null. */
function getCharacter(userId) {
  return load()[userId]?.character ?? null;
}

/** Devuelve todos los personajes de un servidor. */
function getGuildCharacters(guildId) {
  const db = load();
  return Object.entries(db)
    .filter(([, v]) => v.guildId === guildId)
    .map(([userId, v]) => ({ userId, ...v }));
}

/** Borra el personaje de un usuario. */
function deleteCharacter(userId) {
  const db = load();
  delete db[userId];
  save(db);
}

/** Actualiza campos específicos del personaje de un usuario.
 *  Si el usuario no existe en la DB, no hace nada (evita crear entradas vacías).
 *  Retorna true si se actualizó, false si no existe.
 */
function updateCharacter(userId, updates) {
  const db = load();
  if (!db[userId]?.character) {
    // No existe → no crear entrada vacía
    return false;
  }
  // Merge profundo para arrays críticos (no sobreescribir con undefined)
  const current = db[userId].character;
  const merged  = { ...current };
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined && v !== null) merged[k] = v;
  }
  db[userId].character = merged;
  db[userId].savedAt   = new Date().toISOString();
  save(db);
  return true;
}

function getAllCharacters() {
  try {
    const db = load();
    return Object.entries(db)
      .filter(([, entry]) => entry?.character)
      .map(([uid, entry]) => ({ ...entry.character, _uid: uid, userId: uid }));
  } catch { return []; }
}

module.exports = { saveCharacter, getCharacter, getGuildCharacters, getAllCharacters, deleteCharacter, updateCharacter };
