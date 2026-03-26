// ── utils/magicItemsStore.js ──────────────────────────────────────────────────
// Persistencia de objetos mágicos ligados a cuenta Discord (no al personaje)
// Estructura del archivo: { [userId]: [ { id, nombre, desc, obtenidoEn, fechaObtención } ] }
// Máximo 7 objetos por usuario
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'magicItems.json');

function cargar() {
  try {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch { return {}; }
}

function guardar(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getMagicItems(userId) {
  const data = cargar();
  return data[userId] || [];
}

function addMagicItem(userId, item) {
  const data  = cargar();
  const items = data[userId] || [];
  if (items.length >= 7) return { ok: false, razon: 'lleno' };
  if (items.find(i => i.id === item.id)) return { ok: false, razon: 'duplicado' };
  items.push({ ...item, fechaObtencion: new Date().toISOString() });
  data[userId] = items;
  guardar(data);
  return { ok: true };
}

function removeMagicItem(userId, itemId) {
  const data  = cargar();
  const items = data[userId] || [];
  const nuevo = items.filter(i => i.id !== itemId);
  data[userId] = nuevo;
  guardar(data);
}

module.exports = { getMagicItems, addMagicItem, removeMagicItem };
