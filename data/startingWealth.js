// ── data/startingWealth.js ────────────────────────────────────────────────────
// Riqueza inicial de cada clase según el Manual del Jugador (PHB p.143)
// Formato: { dados, multiplicador, moneda }
// Ej: Bárbaro → 2d4 × 10 PO
// ─────────────────────────────────────────────────────────────────────────────

const RIQUEZA_INICIAL = {
  'Artificiero':  { dados: 5, lados: 4, mult: 10, moneda: 'PO', desc: '5d4 × 10 PO' },
  'Bárbaro':      { dados: 2, lados: 4, mult: 10, moneda: 'PO', desc: '2d4 × 10 PO' },
  'Bardo':        { dados: 5, lados: 4, mult: 10, moneda: 'PO', desc: '5d4 × 10 PO' },
  'Brujo':        { dados: 4, lados: 4, mult: 10, moneda: 'PO', desc: '4d4 × 10 PO' },
  'Clérigo':      { dados: 5, lados: 4, mult: 10, moneda: 'PO', desc: '5d4 × 10 PO' },
  'Druida':       { dados: 2, lados: 4, mult: 10, moneda: 'PO', desc: '2d4 × 10 PO' },
  'Explorador':   { dados: 5, lados: 4, mult: 10, moneda: 'PO', desc: '5d4 × 10 PO' },
  'Guerrero':     { dados: 5, lados: 4, mult: 10, moneda: 'PO', desc: '5d4 × 10 PO' },
  'Hechicero':    { dados: 3, lados: 4, mult: 10, moneda: 'PO', desc: '3d4 × 10 PO' },
  'Mago':         { dados: 4, lados: 4, mult: 10, moneda: 'PO', desc: '4d4 × 10 PO' },
  'Monje':        { dados: 5, lados: 4, mult:  1, moneda: 'PO', desc: '5d4 PO'       },
  'Paladín':      { dados: 5, lados: 4, mult: 10, moneda: 'PO', desc: '5d4 × 10 PO' },
  'Pícaro':       { dados: 4, lados: 4, mult: 10, moneda: 'PO', desc: '4d4 × 10 PO' },
};

// Monedas del juego con sus valores relativos en PC (cobre)
const MONEDAS = {
  PC: { nombre: 'Cobre',    simbolo: 'PC', valorEnPC: 1     },
  PP: { nombre: 'Plata',    simbolo: 'PP', valorEnPC: 10    },
  PE: { nombre: 'Electrum', simbolo: 'PE', valorEnPC: 50    },
  PO: { nombre: 'Oro',      simbolo: 'PO', valorEnPC: 100   },
  PT: { nombre: 'Platino',  simbolo: 'PT', valorEnPC: 1000  },
};

// Dinero vacío por defecto
function monederoVacio() {
  return { PC: 0, PP: 0, PE: 0, PO: 0, PT: 0 };
}

// Formatear monedero para mostrar en Discord
function formatearMonedero(monedero) {
  const partes = [];
  if (monedero.PT > 0) partes.push(`${monedero.PT} PT`);
  if (monedero.PO > 0) partes.push(`${monedero.PO} PO`);
  if (monedero.PE > 0) partes.push(`${monedero.PE} PE`);
  if (monedero.PP > 0) partes.push(`${monedero.PP} PP`);
  if (monedero.PC > 0) partes.push(`${monedero.PC} PC`);
  return partes.length ? partes.join(' · ') : '0 PO';
}

// Valor total en PC para comparaciones
function totalEnPC(monedero) {
  return (monedero.PC || 0)
       + (monedero.PP || 0) * 10
       + (monedero.PE || 0) * 50
       + (monedero.PO || 0) * 100
       + (monedero.PT || 0) * 1000;
}

// Restar precio de un monedero (devuelve false si no hay suficiente)
function pagar(monedero, precioEnPO) {
  const precioPC = precioEnPO * 100;
  let disponible = totalEnPC(monedero);
  if (disponible < precioPC) return false;

  let restante = precioPC;
  const nuevo = { ...monedero };

  // Restar en orden de mayor a menor
  for (const [clave, valor] of [['PT', 1000], ['PO', 100], ['PE', 50], ['PP', 10], ['PC', 1]]) {
    if (restante <= 0) break;
    const gastar = Math.min(nuevo[clave] || 0, Math.floor(restante / valor));
    nuevo[clave] = (nuevo[clave] || 0) - gastar;
    restante -= gastar * valor;
  }

  // Si sobró cambio (ej: pagó con platino algo de 50 PO), añadir vuelto en PO
  if (restante < 0) {
    // No debería ocurrir con floor, pero por seguridad
    nuevo.PC = (nuevo.PC || 0) + Math.abs(restante);
  }

  return nuevo;
}

module.exports = {
  RIQUEZA_INICIAL,
  MONEDAS,
  monederoVacio,
  formatearMonedero,
  totalEnPC,
  pagar,
};
