// ── data/languages.js ─────────────────────────────────────────────────────────
// Idiomas estándar y exóticos de D&D 5e
// ─────────────────────────────────────────────────────────────────────────────

const IDIOMAS_ESTANDAR = [
  'Común', 'Enano', 'Élfico', 'Gigante', 'Gnómico', 'Goblin',
  'Mediano', 'Orco', 'Dracónico',
];

const IDIOMAS_EXOTICOS = [
  'Abisal', 'Celestial', 'Infracomún', 'Infernal', 'Primordial',
  'Silvano', 'Infraoscuro', 'Abisal', 'Auran', 'Aquan', 'Ignan', 'Terran',
  'Gith', 'Minotauro', 'Leonin', 'Loxodon', 'Vedalken',
  'Aarakocra', 'Grung', 'Sahuagin', 'Thri-kreen',
];

const TODOS_IDIOMAS = [...new Set([...IDIOMAS_ESTANDAR, ...IDIOMAS_EXOTICOS])].sort();

// Idiomas base por raza (los que se obtienen automáticamente)
const IDIOMAS_POR_RAZA = {
  'Enano':                  ['Común', 'Enano'],
  'Elfo':                   ['Común', 'Élfico'],
  'Humano':                 ['Común'],               // + 1 a elección
  'Mediano':                ['Común', 'Mediano'],
  'Gnomo':                  ['Común', 'Gnómico'],
  'Semielfo':               ['Común', 'Élfico'],     // + 1 a elección
  'Semiorco':               ['Común', 'Orco'],
  'Tiefling':               ['Común', 'Infernal'],
  'Dracónido':              ['Común', 'Dracónico'],
  'Bugbear/Osgo':           ['Común', 'Goblin'],
  'Goblin':                 ['Común', 'Goblin'],
  'Hobgoblin':              ['Común', 'Goblin'],
  'Kobold':                 ['Común', 'Dracónico'],
  'Lizardfolk':             ['Común', 'Dracónico'],
  'Orco':                   ['Común', 'Orco'],
  'Yuan-ti Sangre Pura':    ['Común', 'Abisal', 'Dracónico'],
  'Aarakocra':              ['Común', 'Aarakocra', 'Auran'],
  'Aasimar':                ['Común', 'Celestial'],
  'Firbolg':                ['Común', 'Élfico', 'Gigante'],
  'Genasi':                 ['Común', 'Primordial'],
  'Gith':                   ['Común', 'Gith'],
  'Goliath':                ['Común', 'Gigante'],
  'Kenku':                  ['Común', 'Auran'],
  'Tabaxi':                 ['Común'],               // + 1 a elección
  'Tortuga':                ['Común', 'Aquan'],
  'Tritón':                 ['Común', 'Primordial'],
  'Grung':                  ['Grung'],
  'Locathah':               ['Común', 'Aquan'],
  'Verdan':                 ['Común', 'Goblin'],     // + 1 a elección
  'Centauro':               ['Común', 'Silvano'],
  'Duergar':                ['Común', 'Enano', 'Infracomún'],
  'Eladrín':                ['Común', 'Élfico'],
  'Elfo Astral':            ['Común'],               // + 1 a elección
  'Elfo del Mar':           ['Común', 'Élfico'],
  'Githyanki':              ['Común', 'Gith'],
  'Githzerai':              ['Común', 'Gith'],
  'Gnomo de las Profundidades': ['Común', 'Gnómico', 'Infracomún'],
  'Minotauro':              ['Común', 'Minotauro'],
  'Sátiro':                 ['Común', 'Silvano'],
  'Shadar-Kai':             ['Común', 'Élfico'],
  'Leónido':                ['Común', 'Leonin'],
  'Loxodon':                ['Común', 'Loxodon'],
  'Simic Híbrido':          ['Común'],               // + Élfico o Vedalken
  'Vedalken':               ['Común', 'Vedalken'],   // + 1 a elección
  'Cambiante/Changeling':   ['Común'],               // + 1 a elección
  'Cambiaformas/Shifter':   ['Común'],               // + 1 a elección
  'Dhampiro':               ['Común'],               // + 1 a elección
  'Sangre Maldita/Hexblood':['Común'],               // + 1 a elección
  'Renacido':               ['Común'],               // + 1 a elección
  'Hada/Fairy':             ['Común'],               // + 1 a elección
  'Harengon/Conéjido':      ['Común'],               // + 1 a elección
  'Búhonido/Owlin':         ['Común'],               // + 1 a elección
  'Plasmoide':              ['Común'],               // + 1 a elección
  'Autognomo':              ['Común'],               // + 1 a elección
  'Giff':                   ['Común'],               // + 1 a elección
  'Hadozee':                ['Común'],               // + 1 a elección
  'Thri-kreen':             ['Común'],               // telepatía, no hablan
  'Sátiro (Theros)':        ['Común', 'Silvano'],
  'Centauro (Ravnica)':     ['Común', 'Silvano'],
  'Minotauro (Ravnica)':    ['Común', 'Minotauro'],
};

// Idiomas extra a elegir por raza (0 = ninguno)
const IDIOMAS_ELECCION_RAZA = {
  'Humano':    1,
  'Semielfo':  1,
  'Tabaxi':    1,
  'Verdan':    1,
  'Búhonido/Owlin': 1,
  'Harengon/Conéjido': 1,
  'Hada/Fairy': 1,
  'Elfo Astral': 1,
  'Cambiante/Changeling': 1,
  'Cambiaformas/Shifter': 1,
  'Dhampiro':  1,
  'Sangre Maldita/Hexblood': 1,
  'Renacido':  1,
  'Plasmoide': 1,
  'Autognomo': 1,
  'Giff':      1,
  'Hadozee':   1,
  'Vedalken':  1,
};

// Idiomas extra a elegir por trasfondo
const IDIOMAS_POR_TRASFONDO = {
  'Ermitaño':           1,
  'Fronterizo':         1,
  'Noble':              1,
  'Sabio':              2,
  'Agente de Facción':  2,
  'Artesano del Clan':  1,
  'Caballero de la Orden': 1,
  'Cortesano':          2,
  'Erudito Enclaustrado': 1,
  'Guardia de Ciudad':  1,
  'Heredero':           1,
  'Miembro de Tribu Uthgardt': 1,
  'Noble de Waterdeep': 1,
};

module.exports = {
  IDIOMAS_ESTANDAR,
  IDIOMAS_EXOTICOS,
  TODOS_IDIOMAS,
  IDIOMAS_POR_RAZA,
  IDIOMAS_ELECCION_RAZA,
  IDIOMAS_POR_TRASFONDO,
};
