// ── utils/uniqueWeaponsStore.js ───────────────────────────────────────────────
// Armas únicas definidas por el DM — guardadas en uniqueWeapons.json
// { weapons: [ { nombre, daño, propiedades, descripcion, addedBy, fecha } ] }
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'uniqueWeapons.json');

function load() {
  try { return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE,'utf8')) : { weapons:[] }; }
  catch { return { weapons:[] }; }
}
function save(data) { fs.writeFileSync(FILE, JSON.stringify(data,null,2),'utf8'); }

function getWeapons()            { return load().weapons; }
function addWeapon(weapon)       { const d=load(); d.weapons.push(weapon); save(d); }
function removeWeapon(idx)       { const d=load(); d.weapons.splice(idx,1); save(d); }

module.exports = { getWeapons, addWeapon, removeWeapon };
