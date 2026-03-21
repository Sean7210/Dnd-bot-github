// ── data/potions.js ───────────────────────────────────────────────────────────
// Lista de pociones del PDF 5e_Potions_V2 + poción básica del servidor
// ─────────────────────────────────────────────────────────────────────────────

const POCIONES = [
  // ── Básicas del servidor ──────────────────────────────────────────────────
  { id:'pocion-curacion-basica',  nombre:'Poción de Curación Básica', rareza:'Común', precio:5,   cura:'4 HP fijos', efecto:'Recupera exactamente 4 HP al instante.', color:0xFF6B6B },

  // ── Del PDF (Common) ─────────────────────────────────────────────────────
  { id:'pocion-escalar',          nombre:'Poción de Escalar',         rareza:'Común', precio:75,  efecto:'Velocidad de escalar igual a la de caminar durante 1 hora. Ventaja en Atletismo para escalar.' },
  { id:'pocion-curacion',         nombre:'Poción de Curación',        rareza:'Común', precio:75,  cura:'2d4+2', efecto:'Recupera 2d4+2 HP.' },

  // ── Uncommon ──────────────────────────────────────────────────────────────
  { id:'pocion-curacion-mayor',   nombre:'Poción de Curación Mayor',  rareza:'Poco común', precio:150, cura:'4d4+4', efecto:'Recupera 4d4+4 HP.' },
  { id:'pocion-crecimiento',      nombre:'Poción de Crecimiento',     rareza:'Poco común', precio:300, efecto:'Efecto "Agrandar" de Agrandar/Reducir durante 1d4 horas. +1d4 daño, ventaja FUE.' },
  { id:'pocion-fuego-aliento',    nombre:'Poción de Aliento de Fuego',rareza:'Poco común', precio:300, efecto:'Hasta 3 veces en 1 hora: acción adicional para exhalar fuego. CD 13 DES, 4d6 fuego.' },
  { id:'pocion-fuerza-colina',    nombre:'Poción de Fuerza de Gigante de la Colina', rareza:'Poco común', precio:300, efecto:'FUE sube a 21 durante 1 hora.' },
  { id:'pocion-amistad-animal',   nombre:'Poción de Amistad con Animales', rareza:'Poco común', precio:300, efecto:'Lanzar Amistad con Animales a voluntad (CD 13) durante 1 hora.' },
  { id:'pocion-veneno',           nombre:'Poción de Veneno',          rareza:'Poco común', precio:100, efecto:'Parece poción de curación. Al beber: 3d6 veneno + CD 13 CON o envenenado.' },
  { id:'pocion-resistencia',      nombre:'Poción de Resistencia',     rareza:'Poco común', precio:300, efecto:'Resistencia a un tipo de daño durante 1 hora (el DM elige el tipo).' },
  { id:'pocion-respiracion-agua', nombre:'Poción de Respiración Acuática', rareza:'Poco común', precio:180, efecto:'Respirar bajo el agua durante 1 hora.' },
  { id:'filtro-amor',             nombre:'Filtro de Amor',            rareza:'Poco común', precio:300, efecto:'La siguiente criatura vista en 10 min queda hechizada durante 1 hora.' },

  // ── Rare ──────────────────────────────────────────────────────────────────
  { id:'elixir-salud',            nombre:'Elixir de Salud',           rareza:'Rara', precio:750, efecto:'Cura cualquier enfermedad. Elimina cegado, ensordecido, paralizado y envenenado.' },
  { id:'aceite-etereidad',        nombre:'Aceite de Etereidad',       rareza:'Rara', precio:750, efecto:'Aplica a criatura M o menor en 10 min. Efecto de Etereidad durante 1 hora.' },
  { id:'pocion-clarividencia',    nombre:'Poción de Clarividencia',   rareza:'Rara', precio:750, efecto:'Efecto de Clarividencia (sensor invisible hasta 1 milla, ver o escuchar).' },
  { id:'pocion-disminucion',      nombre:'Poción de Disminución',     rareza:'Rara', precio:750, efecto:'Efecto "Reducir" durante 1d4 horas. -1d4 daño, desventaja FUE.' },
  { id:'pocion-forma-gaseosa',    nombre:'Poción de Forma Gaseosa',   rareza:'Rara', precio:750, efecto:'Efecto de Forma Gaseosa durante 1 hora (sin concentración).' },
  { id:'pocion-fuerza-escarcha',  nombre:'Poción de Fuerza de Gigante de Escarcha', rareza:'Rara', precio:750, efecto:'FUE sube a 23 durante 1 hora.' },
  { id:'pocion-fuerza-piedra',    nombre:'Poción de Fuerza de Gigante de Piedra', rareza:'Rara', precio:750, efecto:'FUE sube a 23 durante 1 hora.' },
  { id:'pocion-fuerza-fuego',     nombre:'Poción de Fuerza de Gigante de Fuego', rareza:'Rara', precio:750, efecto:'FUE sube a 25 durante 1 hora.' },
  { id:'pocion-heroismo',         nombre:'Poción de Heroísmo',        rareza:'Rara', precio:750, efecto:'10 HP temporales + efecto de Bendición durante 1 hora (sin concentración).' },
  { id:'pocion-invulnerabilidad', nombre:'Poción de Invulnerabilidad',rareza:'Rara', precio:750, efecto:'Resistencia a todo daño durante 1 minuto.' },
  { id:'pocion-lectura-mente',    nombre:'Poción de Lectura Mental',  rareza:'Rara', precio:750, efecto:'Efecto de Detectar Pensamientos (CD 13) mientras dure.' },
  { id:'pocion-curacion-superior',nombre:'Poción de Curación Superior',rareza:'Rara', precio:750, cura:'8d4+8', efecto:'Recupera 8d4+8 HP.' },

  // ── Very Rare ─────────────────────────────────────────────────────────────
  { id:'aceite-agudeza',          nombre:'Aceite de Agudeza',         rareza:'Muy rara', precio:6000, efecto:'Aplica a arma cortante/perforante o 5 municiones. +3 a ataque y daño durante 1 hora.' },
  { id:'pocion-vuelo',            nombre:'Poción de Vuelo',           rareza:'Muy rara', precio:6000, efecto:'Velocidad de vuelo igual a la de caminar durante 1 hora.' },
  { id:'pocion-invisibilidad',    nombre:'Poción de Invisibilidad',   rareza:'Muy rara', precio:6000, efecto:'Invisible durante 1 hora. Termina si atacas o lanzas hechizo.' },
  { id:'pocion-longevidad',       nombre:'Poción de Longevidad',      rareza:'Muy rara', precio:6000, efecto:'Reduce edad física en 1d6+6 años (mín 13). Cada toma adicional: 10% acumulativo de envejecer.' },
  { id:'pocion-velocidad',        nombre:'Poción de Velocidad',       rareza:'Muy rara', precio:6000, efecto:'Efecto de Prisa durante 1 minuto (sin concentración). Velocidad x2, +2 CA, ventaja DES.' },
  { id:'pocion-vitalidad',        nombre:'Poción de Vitalidad',       rareza:'Muy rara', precio:6000, efecto:'Elimina agotamiento y cura enfermedades/venenos. Recupera máximo de HP de Dados de Golpe durante 24h.' },
  { id:'pocion-fuerza-nube',      nombre:'Poción de Fuerza de Gigante de Nubes', rareza:'Muy rara', precio:6000, efecto:'FUE sube a 27 durante 1 hora.' },
  { id:'pocion-curacion-suprema', nombre:'Poción de Curación Suprema',rareza:'Muy rara', precio:6000, cura:'10d4+20', efecto:'Recupera 10d4+20 HP.' },

  // ── Legendary ─────────────────────────────────────────────────────────────
  { id:'pocion-fuerza-tormenta',  nombre:'Poción de Fuerza de Gigante de Tormentas', rareza:'Legendaria', precio:50000, efecto:'FUE sube a 29 durante 1 hora.' },
];

// Agrupadas por rareza para la tienda
const POCIONES_POR_RAREZA = {
  'Común':       POCIONES.filter(p => p.rareza === 'Común'),
  'Poco común':  POCIONES.filter(p => p.rareza === 'Poco común'),
  'Rara':        POCIONES.filter(p => p.rareza === 'Rara'),
  'Muy rara':    POCIONES.filter(p => p.rareza === 'Muy rara'),
  'Legendaria':  POCIONES.filter(p => p.rareza === 'Legendaria'),
};

function getPociones()       { return POCIONES; }
function getPocionById(id)   { return POCIONES.find(p => p.id === id); }
function getPocionNombre(n)  { return POCIONES.find(p => p.nombre.toLowerCase() === n.toLowerCase()); }

module.exports = { POCIONES, POCIONES_POR_RAREZA, getPociones, getPocionById, getPocionNombre };
