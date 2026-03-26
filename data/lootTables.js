// ── data/lootTables.js ────────────────────────────────────────────────────────
// Tablas de loot para cada grupo de monstruos
// Formato de cada tabla:
// 'nombre_tabla': [
//   { peso: N, item: 'Nombre del ítem', cantidad: [min, max], precio: PO, categoria: '...' },
//   { peso: N, item: null }  ← null = nada
// ]
// El peso es relativo — mayor peso = más probable
// ─────────────────────────────────────────────────────────────────────────────

// ── TABLAS DnD ────────────────────────────────────────────────────────────────
const LOOT_DND = {
  // Ejemplo (comentado):
  // 'loot_goblin': [
  //   { peso: 50, item: null },
  //   { peso: 30, item: 'Monedas de cobre', cantidad: [1,10], precio: 0.05, categoria: 'Moneda' },
  //   { peso: 15, item: 'Daga oxidada', cantidad: [1,1], precio: 1, categoria: 'Arma' },
  //   { peso: 5,  item: 'Amuleto de hueso', cantidad: [1,1], precio: 5, categoria: 'Misceláneo' },
  // ],
};

// ── TABLAS Monster Hunter ─────────────────────────────────────────────────────
const LOOT_MH = {
  // Rellenar con materiales de Monster Hunter (escamas, colmillos, etc.)
};

// ── TABLAS Varios ─────────────────────────────────────────────────────────────
const LOOT_VARIOS = {
  // Rellenar con loot de expansiones
};

// ── TABLAS OP ─────────────────────────────────────────────────────────────────
const LOOT_OP = {
  // Rellenar con recompensas épicas de jefes
};

// ── Helper: tirar en una tabla de loot ───────────────────────────────────────
function tirarLoot(nombreTabla) {
  const todas = { ...LOOT_DND, ...LOOT_MH, ...LOOT_VARIOS, ...LOOT_OP };
  const tabla  = todas[nombreTabla];
  if (!tabla || tabla.length === 0) return null;

  const pesoTotal = tabla.reduce((s, e) => s + (e.peso || 0), 0);
  let rand = Math.floor(Math.random() * pesoTotal) + 1;
  for (const entrada of tabla) {
    rand -= entrada.peso || 0;
    if (rand <= 0) {
      if (!entrada.item) return null; // sin loot
      const [min, max] = entrada.cantidad || [1, 1];
      const cantidad = min === max ? min : min + Math.floor(Math.random() * (max - min + 1));
      return { nombre: entrada.item, cantidad, precio: entrada.precio || 0, categoria: entrada.categoria || 'Misceláneo' };
    }
  }
  return null;
}

// Tirar varias veces (para jefes con loot múltiple)
function tirarLootMultiple(nombreTabla, veces = 1) {
  const resultado = [];
  for (let i = 0; i < veces; i++) {
    const item = tirarLoot(nombreTabla);
    if (item) resultado.push(item);
  }
  return resultado;
}

module.exports = { LOOT_DND, LOOT_MH, LOOT_VARIOS, LOOT_OP, tirarLoot, tirarLootMultiple };
