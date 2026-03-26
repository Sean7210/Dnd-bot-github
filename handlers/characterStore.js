// ── utils/characterStore.js ───────────────────────────────────────────────────
// Capa de acceso a datos de personajes
// Usa SQLite si está disponible, JSON como fallback automático
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs   = require('fs');
const { db, get, all, run, transaction, exists } = require('../db/database.js');

const JSON_PATH = path.join(__dirname, '..', 'characters.json');

// ─── JSON fallback ────────────────────────────────────────────────────────────
function loadJSON() {
  try { return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); } catch { return {}; }
}
function saveJSON(data) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
}

// ─── Serializar/deserializar personaje ───────────────────────────────────────
function rowToChar(row) {
  if (!row) return null;
  const char = {
    userId:     row.user_id,
    _uid:       row.user_id,
    name:       row.name,
    race:       row.race,
    class:      row.class,
    subclass:   row.subclass,
    background: row.background,
    alignment:  row.alignment,
    level:      row.level,
    hpMax:      row.hp_max,
    hpActual:   row.hp_actual,
    profBonus:  row.prof_bonus,
    pendingLevelUp: !!row.pending_level_up,
    pendingASI:     !!row.pending_asi,
    _equipoInicialElegido: !!row.equipo_inicial_elegido,
    finalStats: tryParse(row.final_stats, {}),
    skills:     tryParse(row.skills, []),
    languages:  tryParse(row.languages, []),
    magia:      tryParse(row.magia, null),
  };
  // Campos extra
  const extra = tryParse(row.extra, {});
  return { ...char, ...extra };
}

function charToRow(userId, char, guildId = '') {
  const {
    name, race, class: cls, subclass, background, alignment,
    level, hpMax, hpActual, profBonus,
    pendingLevelUp, pendingASI, _equipoInicialElegido,
    finalStats, skills, languages, magia,
    userId: _u, _uid, inventory, money, ...extra
  } = char;

  return {
    user_id:     userId,
    guild_id:    guildId || '',
    name:        name || 'Sin nombre',
    race:        race || '',
    class:       cls  || '',
    subclass:    subclass || '',
    background:  background || '',
    alignment:   alignment || '',
    level:       level || 1,
    hp_max:      hpMax || 10,
    hp_actual:   hpActual ?? hpMax ?? 10,
    prof_bonus:  profBonus || 2,
    pending_level_up: pendingLevelUp ? 1 : 0,
    pending_asi:      pendingASI ? 1 : 0,
    equipo_inicial_elegido: _equipoInicialElegido ? 1 : 0,
    final_stats: JSON.stringify(finalStats || {}),
    skills:      JSON.stringify(skills || []),
    languages:   JSON.stringify(languages || []),
    magia:       JSON.stringify(magia || null),
    extra:       JSON.stringify(extra || {}),
  };
}

function tryParse(str, def) {
  if (!str) return def;
  try { return JSON.parse(str); } catch { return def; }
}

// ─── CRUD Personajes ──────────────────────────────────────────────────────────
function getCharacter(userId) {
  if (!userId) return null;

  if (exists()) {
    const row = get('SELECT * FROM characters WHERE user_id = ?', userId);
    if (!row) return null;
    const char = rowToChar(row);

    // Cargar inventario y dinero desde sus tablas
    char.inventory = all(
      'SELECT * FROM inventory WHERE user_id = ? ORDER BY id',
      userId
    ).map(r => ({
      nombre:      r.nombre,
      cantidad:    r.cantidad,
      peso:        r.peso,
      precio:      r.precio,
      categoria:   r.categoria,
      daño:        r.daño,
      propiedades: r.propiedades,
      descripcion: r.descripcion,
      esVale:      !!r.es_vale,
      esUnica:     !!r.es_unica,
      dorada:      !!r.es_dorada,
      ...tryParse(r.extra, {}),
    }));

    const mon = get('SELECT * FROM money WHERE user_id = ?', userId);
    char.money = mon
      ? { PC: mon.PC, PP: mon.PP, PE: mon.PE, PO: mon.PO, PT: mon.PT }
      : { PC:0, PP:0, PE:0, PO:0, PT:0 };

    return char;
  }

  // Fallback JSON
  const data = loadJSON();
  const entry = data[userId];
  if (!entry) return null;
  return { ...entry, userId, _uid: userId };
}

function saveCharacter(userId, char, guildId) {
  if (!userId || !char) return;

  if (exists()) {
    const row = charToRow(userId, char, guildId);
    transaction(() => {
      // Upsert personaje
      run(`INSERT INTO characters (
        user_id,guild_id,name,race,class,subclass,background,alignment,
        level,hp_max,hp_actual,prof_bonus,pending_level_up,pending_asi,
        equipo_inicial_elegido,final_stats,skills,languages,magia,extra,
        updated_at
      ) VALUES (
        @user_id,@guild_id,@name,@race,@class,@subclass,@background,@alignment,
        @level,@hp_max,@hp_actual,@prof_bonus,@pending_level_up,@pending_asi,
        @equipo_inicial_elegido,@final_stats,@skills,@languages,@magia,@extra,
        strftime('%s','now')
      ) ON CONFLICT(user_id) DO UPDATE SET
        guild_id=excluded.guild_id, name=excluded.name, race=excluded.race,
        class=excluded.class, subclass=excluded.subclass,
        background=excluded.background, alignment=excluded.alignment,
        level=excluded.level, hp_max=excluded.hp_max, hp_actual=excluded.hp_actual,
        prof_bonus=excluded.prof_bonus,
        pending_level_up=excluded.pending_level_up, pending_asi=excluded.pending_asi,
        equipo_inicial_elegido=excluded.equipo_inicial_elegido,
        final_stats=excluded.final_stats, skills=excluded.skills,
        languages=excluded.languages, magia=excluded.magia,
        extra=excluded.extra, updated_at=strftime('%s','now')
      `, row);

      // Guardar inventario
      if (char.inventory !== undefined) {
        run('DELETE FROM inventory WHERE user_id = ?', userId);
        for (const item of (char.inventory || [])) {
          const { nombre, cantidad, peso, precio, categoria, daño, propiedades,
                  descripcion, esVale, esUnica, dorada, ...rest } = item;
          run(`INSERT INTO inventory
            (user_id,nombre,cantidad,peso,precio,categoria,daño,propiedades,descripcion,es_vale,es_unica,es_dorada,extra)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            userId, nombre||'', cantidad||1, peso||0, precio||0,
            categoria||'General', daño||null, propiedades||null, descripcion||null,
            esVale?1:0, esUnica?1:0, dorada?1:0,
            JSON.stringify(rest||{})
          );
        }
      }

      // Guardar monedero
      if (char.money !== undefined) {
        const m = char.money || {};
        run(`INSERT INTO money (user_id,PC,PP,PE,PO,PT) VALUES (?,?,?,?,?,?)
          ON CONFLICT(user_id) DO UPDATE SET PC=?,PP=?,PE=?,PO=?,PT=?`,
          userId, m.PC||0, m.PP||0, m.PE||0, m.PO||0, m.PT||0,
                  m.PC||0, m.PP||0, m.PE||0, m.PO||0, m.PT||0
        );
      }
    });
    return;
  }

  // Fallback JSON
  const data = loadJSON();
  const { userId: _u, _uid, ...rest } = char;
  data[userId] = rest;
  saveJSON(data);
}

function updateCharacter(userId, changes) {
  if (!userId || !changes) return;
  const char = getCharacter(userId);
  if (!char) return;
  saveCharacter(userId, { ...char, ...changes });
}

function deleteCharacter(userId) {
  if (!exists()) {
    const data = loadJSON();
    delete data[userId];
    saveJSON(data);
    return;
  }
  transaction(() => {
    run('DELETE FROM inventory      WHERE user_id = ?', userId);
    run('DELETE FROM money          WHERE user_id = ?', userId);
    run('DELETE FROM magic_items    WHERE user_id = ?', userId);
    run('DELETE FROM guild_chest    WHERE user_id = ?', userId);
    run('DELETE FROM guild_chest_meta WHERE user_id = ?', userId);
    run('DELETE FROM stats_temp     WHERE user_id = ?', userId);
    run('DELETE FROM cooldowns      WHERE user_id = ?', userId);
    run('DELETE FROM characters     WHERE user_id = ?', userId);
  });
}

function getAllCharacters() {
  if (exists()) {
    return all('SELECT user_id FROM characters').map(r => {
      const char = getCharacter(r.user_id);
      return char;
    }).filter(Boolean);
  }
  const data = loadJSON();
  return Object.entries(data).map(([userId, char]) => ({ ...char, userId, _uid: userId }));
}

// ─── INICIO LIMPIO ───────────────────────────────────────────────────────────
// Se usa SQLite desde cero — characters.json queda como archivo histórico
function migrarDesdeJSON() {
  // No se migra nada — base de datos limpia
  if (exists()) {
    console.log('[DB] ✅ Base de datos SQLite activa — inicio limpio.');
  }
  return 0;
}

module.exports = {
  getCharacter, saveCharacter, updateCharacter, deleteCharacter,
  getAllCharacters, migrarDesdeJSON,
};
