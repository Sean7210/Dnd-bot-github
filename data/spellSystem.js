// ── data/spellSystem.js ───────────────────────────────────────────────────────
// Tablas oficiales D&D 5e: slots de hechizos, hechizos conocidos, trucos por nivel
// ─────────────────────────────────────────────────────────────────────────────

// ─── CLASES CON MAGIA ────────────────────────────────────────────────────────
const CLASES_MAGICAS = new Set([
  'Artificiero','Bardo','Brujo','Clérigo','Druida',
  'Explorador','Hechicero','Mago','Paladín',
]);

// ─── TIPOS DE LANZADOR ────────────────────────────────────────────────────────
// full: Bardo, Clérigo, Druida, Hechicero, Mago
// half: Artificiero, Explorador, Paladín
// pact: Brujo (slots de pacto, mecánica distinta)
const TIPO_LANZADOR = {
  Artificiero: 'half',
  Bardo:       'full',
  Brujo:       'pact',
  Clérigo:     'full',
  Druida:      'full',
  Explorador:  'half',
  Hechicero:   'full',
  Mago:        'full',
  Paladín:     'half',
};

// ─── TABLA DE SLOTS DE HECHIZOS (lanzadores completos) ───────────────────────
// [nivel del personaje] → [slots nivel1, nivel2, ..., nivel9]
const SLOTS_FULL = {
   1: [2,0,0,0,0,0,0,0,0],
   2: [3,0,0,0,0,0,0,0,0],
   3: [4,2,0,0,0,0,0,0,0],
   4: [4,3,0,0,0,0,0,0,0],
   5: [4,3,2,0,0,0,0,0,0],
   6: [4,3,3,0,0,0,0,0,0],
   7: [4,3,3,1,0,0,0,0,0],
   8: [4,3,3,2,0,0,0,0,0],
   9: [4,3,3,3,1,0,0,0,0],
  10: [4,3,3,3,2,0,0,0,0],
  11: [4,3,3,3,2,1,0,0,0],
  12: [4,3,3,3,2,1,0,0,0],
  13: [4,3,3,3,2,1,1,0,0],
  14: [4,3,3,3,2,1,1,0,0],
  15: [4,3,3,3,2,1,1,1,0],
  16: [4,3,3,3,2,1,1,1,0],
  17: [4,3,3,3,2,1,1,1,1],
  18: [4,3,3,3,3,1,1,1,1],
  19: [4,3,3,3,3,2,1,1,1],
  20: [4,3,3,3,3,2,2,1,1],
};

// Lanzadores medios (Paladín, Explorador, Artificiero): nivel efectivo = floor(nivel/2)
const SLOTS_HALF = {
   1: [0,0,0,0,0,0,0,0,0], // Nivel 1-2 sin slots
   2: [2,0,0,0,0,0,0,0,0], // efectivo nivel 1
   3: [3,0,0,0,0,0,0,0,0],
   4: [3,0,0,0,0,0,0,0,0],
   5: [4,2,0,0,0,0,0,0,0], // efectivo nivel 3
   6: [4,2,0,0,0,0,0,0,0],
   7: [4,3,0,0,0,0,0,0,0],
   8: [4,3,0,0,0,0,0,0,0],
   9: [4,3,2,0,0,0,0,0,0],
  10: [4,3,2,0,0,0,0,0,0],
  11: [4,3,3,0,0,0,0,0,0],
  12: [4,3,3,0,0,0,0,0,0],
  13: [4,3,3,1,0,0,0,0,0],
  14: [4,3,3,1,0,0,0,0,0],
  15: [4,3,3,2,0,0,0,0,0],
  16: [4,3,3,2,0,0,0,0,0],
  17: [4,3,3,3,1,0,0,0,0],
  18: [4,3,3,3,1,0,0,0,0],
  19: [4,3,3,3,2,0,0,0,0],
  20: [4,3,3,3,2,0,0,0,0],
};

// Brujo (Pact Magic): slots separados
const SLOTS_PACT = {
   1: { slots:1, nivel:1 },
   2: { slots:2, nivel:1 },
   3: { slots:2, nivel:2 },
   4: { slots:2, nivel:2 },
   5: { slots:3, nivel:3 },
   6: { slots:3, nivel:3 },
   7: { slots:4, nivel:4 },
   8: { slots:4, nivel:4 },
   9: { slots:4, nivel:5 },
  10: { slots:4, nivel:5 },
  11: { slots:3, nivel:5 },
  12: { slots:3, nivel:5 },
  13: { slots:3, nivel:5 },
  14: { slots:3, nivel:5 },
  15: { slots:3, nivel:5 },
  16: { slots:3, nivel:5 },
  17: { slots:4, nivel:5 },
  18: { slots:4, nivel:5 },
  19: { slots:4, nivel:5 },
  20: { slots:4, nivel:5 },
};

// ─── TRUCOS CONOCIDOS POR CLASE Y NIVEL ──────────────────────────────────────
const TRUCOS_CONOCIDOS = {
  Artificiero: { 1:2, 10:3, 14:4 },
  Bardo:       { 1:2, 4:3, 10:4 },
  Brujo:       { 1:2, 4:3, 10:4 },
  Clérigo:     { 1:3, 4:4, 10:5 },
  Druida:      { 1:2, 4:3, 10:4 },
  Explorador:  {}, // sin trucos
  Hechicero:   { 1:4, 4:5, 10:6 },
  Mago:        { 1:3, 4:4, 10:5 },
  Paladín:     {}, // sin trucos base (algunos subclases sí)
};

// ─── HECHIZOS CONOCIDOS (clases que los aprenden, no los preparan) ───────────
// Bardo, Brujo, Hechicero, Explorador
const HECHIZOS_CONOCIDOS = {
  Bardo:      { 1:4, 2:5, 3:6, 4:7, 5:8, 6:9, 7:10, 8:11, 9:12, 10:14, 11:15, 12:15, 13:16, 14:18, 15:19, 16:19, 17:20, 18:22, 19:22, 20:22 },
  Brujo:      { 1:2, 2:3, 3:4, 4:5, 5:6, 6:7, 7:8, 8:9, 9:10, 10:10, 11:11, 12:11, 13:12, 14:12, 15:13, 16:13, 17:14, 18:14, 19:15, 20:15 },
  Hechicero:  { 1:2, 2:3, 3:4, 4:5, 5:6, 6:7, 7:8, 8:9, 9:10, 10:11, 11:12, 12:12, 13:13, 14:13, 15:14, 16:14, 17:15, 18:15, 19:15, 20:15 },
  Explorador: { 1:0, 2:2, 3:3, 4:3, 5:4, 6:4, 7:5, 8:5, 9:6, 10:6, 11:7, 12:7, 13:8, 14:8, 15:9, 16:9, 17:10, 18:10, 19:11, 20:11 },
};

// Clases que preparan hechizos (en vez de conocerlos): Mago, Clérigo, Druida, Paladín, Artificiero
// Preparan: mod_stat + nivel_clase (Mago: INT, Clérigo: SAB, Druida: SAB, Paladín: CAR, Artificiero: INT)
const STAT_PREPARACION = {
  Mago:        'INT',
  Clérigo:     'WIS',
  Druida:      'WIS',
  Paladín:     'CHA',
  Artificiero: 'INT',
};

// ─── UPCASTING: fórmulas automáticas ─────────────────────────────────────────
// Para hechizos con "A niveles superiores" en su descripción
// formato: { dañoBase, dadoExtra, slotBase } — por cada slot sobre el base, se añade dadoExtra
// Estos son los más comunes para combate
const UPCAST_FORMULAS = {
  'Proyectil Mágico':   { tipo: 'misil_extra', misilesPorSlot: 1 }, // +1 misil por slot
  'Bola de Fuego':      { tipo: 'dado', dadoBase: '8d6', dado: 'd6', slotBase: 3 },
  'Rayo':               { tipo: 'dado', dadoBase: '8d6', dado: 'd6', slotBase: 3 },
  'Curar Heridas':      { tipo: 'dado', dadoBase: '1d8', dado: 'd8', slotBase: 1 },
  'Curación en Masa':   { tipo: 'dado', dadoBase: '3d8', dado: 'd8', slotBase: 3 },
  'Armadura de Agathys':{ tipo: 'hp_temp', baseHP: 5, porSlot: 5, slotBase: 1 },
  'Dormir':             { tipo: 'dado', dadoBase: '5d8', dado: 'd8', slotBase: 1 },
  'Hechizar Persona':   { tipo: 'objetivo_extra', objetivosPorSlot: 1, slotBase: 1 },
  'Escudo de Fe':       { tipo: 'ninguno' },
  'Detectar el Bien y el Mal': { tipo: 'ninguno' },
};

// ─── Calcular slots de un personaje ──────────────────────────────────────────
function calcularSlots(clase, nivel) {
  nivel = Math.max(1, Math.min(20, nivel || 1));
  const tipo = TIPO_LANZADOR[clase];
  if (!tipo) return null; // no es lanzador

  if (tipo === 'pact') {
    const pact = SLOTS_PACT[nivel];
    return { tipo: 'pact', slots: pact.slots, nivelSlot: pact.nivel };
  }

  const tabla = tipo === 'half' ? SLOTS_HALF : SLOTS_FULL;
  const fila  = tabla[nivel] || tabla[1];
  const slots = {};
  fila.forEach((s, i) => { if (s > 0) slots[i+1] = s; });
  return { tipo, slots }; // { tipo:'full', slots: { 1:4, 2:3, 3:2 } }
}

// ─── Calcular trucos conocidos ────────────────────────────────────────────────
function trucosPorNivel(clase, nivel) {
  const tabla = TRUCOS_CONOCIDOS[clase] || {};
  let trucos = 0;
  for (const [nivelReq, cantidad] of Object.entries(tabla)) {
    if (nivel >= parseInt(nivelReq)) trucos = cantidad;
  }
  return trucos;
}

// ─── Calcular hechizos conocidos / preparados ─────────────────────────────────
function hechizosDisponibles(clase, nivel, stats = {}) {
  // Clases que conocen hechizos (número fijo)
  if (HECHIZOS_CONOCIDOS[clase]) {
    return HECHIZOS_CONOCIDOS[clase][nivel] || 0;
  }
  // Clases que preparan (mod_stat + nivel_clase)
  const statKey = STAT_PREPARACION[clase];
  if (statKey) {
    const statVal = stats[statKey] || 10;
    const mod     = Math.floor((statVal - 10) / 2);
    return Math.max(1, nivel + mod);
  }
  return 0;
}

// ─── Nivel máximo de slot de una clase ───────────────────────────────────────
function nivelMaxSlot(clase, nivel) {
  const slots = calcularSlots(clase, nivel);
  if (!slots) return 0;
  if (slots.tipo === 'pact') return slots.nivelSlot;
  return Math.max(0, ...Object.keys(slots.slots).map(Number));
}

// ─── Upcast: calcular daño/efecto de un hechizo en un slot superior ───────────
function calcularUpcast(nombreHechizo, slotUsado, dados = []) {
  const formula = UPCAST_FORMULAS[nombreHechizo];
  if (!formula || formula.tipo === 'ninguno') return null;

  const slotsExtra = slotUsado - (formula.slotBase || 1);
  if (slotsExtra <= 0) return null;

  if (formula.tipo === 'dado') {
    return { tipo: 'dado', dadosExtra: slotsExtra + 'd' + formula.dado.replace('d',''), desc: `+${slotsExtra}${formula.dado} por lanzar en slot ${slotUsado}` };
  }
  if (formula.tipo === 'misil_extra') {
    return { tipo: 'misil', misiles: slotsExtra, desc: `+${slotsExtra} misil${slotsExtra>1?'es':''} (slot ${slotUsado})` };
  }
  if (formula.tipo === 'hp_temp') {
    return { tipo: 'hp', extra: slotsExtra * formula.porSlot, desc: `+${slotsExtra * formula.porSlot} HP temporales (slot ${slotUsado})` };
  }
  if (formula.tipo === 'objetivo_extra') {
    return { tipo: 'objetivo', extra: slotsExtra, desc: `+${slotsExtra} objetivo${slotsExtra>1?'s':''} adicional${slotsExtra>1?'es':''} (slot ${slotUsado})` };
  }
  return null;
}

// ─── Hechizos de trasfondo ───────────────────────────────────────────────────
// Algunos trasfondos dan hechizos o trucos extra (Tasha's)
const HECHIZOS_TRASFONDO = {
  'Acólito':     { trucos: ['Luz', 'Taumaturgia'] },
  'Sabio':       { trucos: ['Prestidigitación'] },
  'Ermitaño':    { trucos: ['Guía'] },
};

// ─── Hechizos por raza ────────────────────────────────────────────────────────
const HECHIZOS_RAZA = {
  'Semielfo':    { trucos: ['Guía'] },
  'Tiefling':    { trucos: ['Prestidigitación'], nivel3: ['Llamas del Infierno'], nivel5: ['Oscuridad'] },
  'Drow':        { trucos: ['Luces Danzantes'], nivel3: ['Luz Feérica'], nivel5: ['Oscuridad'] },
  'Gnomo de las Profundidades': { trucos: ['Luz Menor'] },
  'Hada/Fairy':  { trucos: ['Prestidigitación'], nivel3: ['Saber Druídico'], nivel5: ['Agrandar/Reducir'] },
  'Eladrín':     { trucos: [] },
  'Githyanki':   { nivel3: ['Salto'], nivel5: ['Paso Brumoso'] },
  'Sátiro':      { trucos: [] },
};

module.exports = {
  CLASES_MAGICAS, TIPO_LANZADOR,
  SLOTS_FULL, SLOTS_HALF, SLOTS_PACT,
  TRUCOS_CONOCIDOS, HECHIZOS_CONOCIDOS, STAT_PREPARACION,
  UPCAST_FORMULAS, HECHIZOS_TRASFONDO, HECHIZOS_RAZA,
  calcularSlots, trucosPorNivel, hechizosDisponibles,
  nivelMaxSlot, calcularUpcast,
};
