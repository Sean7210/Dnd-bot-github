// ══════════════════════════════════════════════════════════════════════
//  EQUIPO D&D 5e — Extraído de Equipos_418-432.pdf (Manual del Jugador)
// ══════════════════════════════════════════════════════════════════════

const ARMADURAS = {
  // ── LIGERAS ──
  'Acolchada':            { categoria: 'Ligera',  ca: '11 + DES',          coste: '5 po',    sigilo: 'Desventaja', peso: '8 lb' },
  'Cuero':                { categoria: 'Ligera',  ca: '11 + DES',          coste: '10 po',   sigilo: '-',          peso: '10 lb' },
  'Cuero Tachonado':      { categoria: 'Ligera',  ca: '12 + DES',          coste: '45 po',   sigilo: '-',          peso: '13 lb' },
  // ── MEDIAS ──
  'Pieles':               { categoria: 'Media',   ca: '12 + DES (máx 2)',  coste: '10 po',   sigilo: '-',          peso: '12 lb' },
  'Camisote de Mallas':   { categoria: 'Media',   ca: '13 + DES (máx 2)',  coste: '50 po',   sigilo: '-',          peso: '20 lb' },
  'Cota de Escamas':      { categoria: 'Media',   ca: '14 + DES (máx 2)',  coste: '50 po',   sigilo: 'Desventaja', peso: '45 lb' },
  'Coraza':               { categoria: 'Media',   ca: '14 + DES (máx 2)',  coste: '400 po',  sigilo: '-',          peso: '20 lb' },
  'Semiplacas':           { categoria: 'Media',   ca: '15 + DES (máx 2)',  coste: '750 po',  sigilo: 'Desventaja', peso: '40 lb' },
  // ── PESADAS ──
  'Cota de Anillas':      { categoria: 'Pesada',  ca: '14',   coste: '30 po',    fuerza: '-',      sigilo: 'Desventaja', peso: '40 lb' },
  'Cota de Malla':        { categoria: 'Pesada',  ca: '16',   coste: '75 po',    fuerza: 'FUE 13', sigilo: 'Desventaja', peso: '55 lb' },
  'Laminada':             { categoria: 'Pesada',  ca: '17',   coste: '200 po',   fuerza: 'FUE 15', sigilo: 'Desventaja', peso: '60 lb' },
  'Placas':               { categoria: 'Pesada',  ca: '18',   coste: '1500 po',  fuerza: 'FUE 15', sigilo: 'Desventaja', peso: '65 lb' },
  // ── ESCUDO ──
  'Escudo':               { categoria: 'Escudo',  ca: '+2',   coste: '10 po',    sigilo: '-',      peso: '6 lb' },
};

const ARMAS = {
  // ── SIMPLES CaC ──
  'Bastón':              { tipo: 'Simple CaC',  daño: '1d6 contundente',  coste: '2 pp',  peso: '4 lb',   propiedades: 'Versátil (1d8)' },
  'Daga':                { tipo: 'Simple CaC',  daño: '1d4 perforante',   coste: '2 po',  peso: '1 lb',   propiedades: 'Arrojadiza (20/60), Ligera, Sutil' },
  'Garrote':             { tipo: 'Simple CaC',  daño: '1d8 contundente',  coste: '2 pp',  peso: '10 lb',  propiedades: 'A dos manos' },
  'Hacha de Mano':       { tipo: 'Simple CaC',  daño: '1d6 cortante',     coste: '5 po',  peso: '2 lb',   propiedades: 'Arrojadiza (20/60), Ligera' },
  'Hoz':                 { tipo: 'Simple CaC',  daño: '1d4 cortante',     coste: '1 po',  peso: '2 lb',   propiedades: 'Ligera' },
  'Jabalina':            { tipo: 'Simple CaC',  daño: '1d6 perforante',   coste: '5 pp',  peso: '2 lb',   propiedades: 'Arrojadiza (30/120)' },
  'Lanza':               { tipo: 'Simple CaC',  daño: '1d6 perforante',   coste: '1 po',  peso: '3 lb',   propiedades: 'Arrojadiza (20/60), Versátil (1d8)' },
  'Martillo Ligero':     { tipo: 'Simple CaC',  daño: '1d4 contundente',  coste: '2 po',  peso: '2 lb',   propiedades: 'Arrojadiza (20/60), Ligera' },
  'Maza':                { tipo: 'Simple CaC',  daño: '1d6 contundente',  coste: '5 po',  peso: '4 lb',   propiedades: '-' },
  'Porra':               { tipo: 'Simple CaC',  daño: '1d4 contundente',  coste: '1 pp',  peso: '2 lb',   propiedades: 'Ligera' },
  // ── SIMPLES A DISTANCIA ──
  'Arco Corto':          { tipo: 'Simple Dist', daño: '1d6 perforante',   coste: '25 po', peso: '2 lb',   propiedades: 'A dos manos, Munición (80/320)' },
  'Ballesta Ligera':     { tipo: 'Simple Dist', daño: '1d8 perforante',   coste: '25 po', peso: '5 lb',   propiedades: 'A dos manos, Munición (80/320), Carga' },
  'Dardo':               { tipo: 'Simple Dist', daño: '1d4 perforante',   coste: '5 pc',  peso: '1/4 lb', propiedades: 'Arrojadiza (20/60), Sutil' },
  'Honda':               { tipo: 'Simple Dist', daño: '1d4 contundente',  coste: '1 pp',  peso: '-',      propiedades: 'Munición (30/120)' },
  // ── MARCIALES CaC ──
  'Alabarda':            { tipo: 'Marcial CaC', daño: '1d10 cortante',    coste: '20 po', peso: '6 lb',   propiedades: 'A dos manos, Alcance, Pesada' },
  'Cimitarra':           { tipo: 'Marcial CaC', daño: '1d6 cortante',     coste: '25 po', peso: '3 lb',   propiedades: 'Ligera, Sutil' },
  'Espada Corta':        { tipo: 'Marcial CaC', daño: '1d6 perforante',   coste: '10 po', peso: '2 lb',   propiedades: 'Ligera, Sutil' },
  'Espada Larga':        { tipo: 'Marcial CaC', daño: '1d8 cortante',     coste: '15 po', peso: '3 lb',   propiedades: 'Versátil (1d10)' },
  'Espadón':             { tipo: 'Marcial CaC', daño: '2d6 cortante',     coste: '50 po', peso: '6 lb',   propiedades: 'A dos manos, Pesada' },
  'Estoque':             { tipo: 'Marcial CaC', daño: '1d8 perforante',   coste: '25 po', peso: '2 lb',   propiedades: 'Sutil' },
  'Gran Hacha':          { tipo: 'Marcial CaC', daño: '1d12 cortante',    coste: '30 po', peso: '7 lb',   propiedades: 'A dos manos, Pesada' },
  'Guja':                { tipo: 'Marcial CaC', daño: '1d10 cortante',    coste: '20 po', peso: '6 lb',   propiedades: 'A dos manos, Alcance, Pesada' },
  'Hacha de Guerra':     { tipo: 'Marcial CaC', daño: '1d8 cortante',     coste: '10 po', peso: '4 lb',   propiedades: 'Versátil (1d10)' },
  'Látigo':              { tipo: 'Marcial CaC', daño: '1d4 cortante',     coste: '2 po',  peso: '3 lb',   propiedades: 'Alcance, Sutil' },
  'Lanza de Caballería': { tipo: 'Marcial CaC', daño: '1d12 perforante',  coste: '10 po', peso: '6 lb',   propiedades: 'Alcance, Especial' },
  'Lucero del Alba':     { tipo: 'Marcial CaC', daño: '1d8 perforante',   coste: '15 po', peso: '4 lb',   propiedades: '-' },
  'Mangual':             { tipo: 'Marcial CaC', daño: '1d8 contundente',  coste: '10 po', peso: '2 lb',   propiedades: '-' },
  'Martillo de Guerra':  { tipo: 'Marcial CaC', daño: '1d8 contundente',  coste: '15 po', peso: '2 lb',   propiedades: 'Versátil (1d10)' },
  'Mazo':                { tipo: 'Marcial CaC', daño: '2d6 contundente',  coste: '10 po', peso: '10 lb',  propiedades: 'A dos manos, Pesada' },
  'Pica':                { tipo: 'Marcial CaC', daño: '1d10 perforante',  coste: '5 po',  peso: '18 lb',  propiedades: 'A dos manos, Alcance, Pesada' },
  'Pico de Cuervo':      { tipo: 'Marcial CaC', daño: '1d8 perforante',   coste: '5 po',  peso: '2 lb',   propiedades: '-' },
  'Tridente':            { tipo: 'Marcial CaC', daño: '1d6 perforante',   coste: '5 po',  peso: '4 lb',   propiedades: 'Arrojadiza (20/60), Versátil (1d8)' },
  // ── MARCIALES A DISTANCIA ──
  'Arco Largo':          { tipo: 'Marcial Dist', daño: '1d8 perforante',  coste: '50 po', peso: '2 lb',   propiedades: 'A dos manos, Munición (150/600), Pesada' },
  'Ballesta de Mano':    { tipo: 'Marcial Dist', daño: '1d6 perforante',  coste: '75 po', peso: '3 lb',   propiedades: 'Ligera, Munición (30/120), Carga' },
  'Ballesta Pesada':     { tipo: 'Marcial Dist', daño: '1d10 perforante', coste: '50 po', peso: '18 lb',  propiedades: 'A dos manos, Munición (100/400), Pesada, Carga' },
  'Cerbatana':           { tipo: 'Marcial Dist', daño: '1 perforante',    coste: '10 po', peso: '1 lb',   propiedades: 'Munición (25/100), Carga' },
  'Red':                 { tipo: 'Marcial Dist', daño: '-',               coste: '1 po',  peso: '3 lb',   propiedades: 'Arrojadiza (5/15), Especial' },
};

const EQUIPO_AVENTURERO = {
  // ── A ──
  'Ábaco':                      { coste: '2 po',    peso: '2 lb' },
  'Abrojos (bolsa 20)':         { coste: '1 po',    peso: '2 lb' },
  'Aceite (frasco)':            { coste: '1 pp',    peso: '1 lb' },
  'Ácido (vial)':               { coste: '25 po',   peso: '1 lb' },
  'Agua bendita (frasco)':      { coste: '25 po',   peso: '1 lb' },
  'Aljaba':                     { coste: '1 po',    peso: '1 lb' },
  'Anillo de sello':            { coste: '5 po',    peso: '-' },
  'Antitoxina (vial)':          { coste: '50 po',   peso: '-' },
  'Antorcha':                   { coste: '1 pc',    peso: '-' },
  'Aparejo de pesca':           { coste: '1 po',    peso: '4 lb' },
  'Aparejo de poleas':          { coste: '1 po',    peso: '5 lb' },
  'Ariete portátil':            { coste: '4 po',    peso: '35 lb' },
  // ── B ──
  'Balanza de mercader':        { coste: '5 po',    peso: '3 lb' },
  'Barril':                     { coste: '2 po',    peso: '70 lb' },
  'Bolas de metal (bolsa 1000)':{ coste: '1 po',    peso: '2 lb' },
  'Bolsa':                      { coste: '5 pp',    peso: '1 lb' },
  'Bolsa de componentes':       { coste: '25 po',   peso: '2 lb' },
  'Botella de cristal':         { coste: '2 po',    peso: '2 lb' },
  // ── C ──
  'Cadena (10 pies)':           { coste: '5 po',    peso: '10 lb' },
  'Campana':                    { coste: '1 po',    peso: '-' },
  'Carcaj':                     { coste: '1 po',    peso: '1 lb' },
  'Catalejo':                   { coste: '1000 po', peso: '1 lb' },
  'Cerradura':                  { coste: '10 po',   peso: '1 lb' },
  'Cesto':                      { coste: '4 pp',    peso: '2 lb' },
  'Cofre':                      { coste: '5 po',    peso: '25 lb' },
  'Cubo':                       { coste: '5 pc',    peso: '2 lb' },
  'Cuerda de cáñamo (50 pies)': { coste: '1 po',    peso: '10 lb' },
  'Cuerda de seda (50 pies)':   { coste: '10 po',   peso: '5 lb' },
  // ── E ──
  'Escalera (10 pies)':         { coste: '1 pp',    peso: '25 lb' },
  'Espejo de acero':            { coste: '5 po',    peso: '1/2 lb' },
  'Esposas':                    { coste: '2 po',    peso: '6 lb' },
  'Estuche para mapas/pergaminos': { coste: '1 po', peso: '1 lb' },
  'Estuche para virotes de ballesta': { coste: '1 po', peso: '1 lb' },
  // ── F ──
  'Fiambrera':                  { coste: '2 pp',    peso: '1 lb' },
  'Foco arcano - Bastón':       { coste: '5 po',    peso: '4 lb' },
  'Foco arcano - Cetro':        { coste: '10 po',   peso: '2 lb' },
  'Foco arcano - Cristal':      { coste: '10 po',   peso: '1 lb' },
  'Foco arcano - Orbe':         { coste: '20 po',   peso: '3 lb' },
  'Foco arcano - Varita':       { coste: '10 po',   peso: '1 lb' },
  'Foco druídico - Bastón de madera': { coste: '5 po', peso: '4 lb' },
  'Foco druídico - Ramo de muérdago': { coste: '1 po', peso: '-' },
  'Foco druídico - Tótem':      { coste: '1 po',    peso: '-' },
  'Foco druídico - Varita de tejo': { coste: '10 po', peso: '1 lb' },
  'Frasco/jarra de metal':      { coste: '2 pc',    peso: '1 lb' },
  'Fuego de alquimista (frasco)':{ coste: '50 po',  peso: '1 lb' },
  // ── G ──
  'Garfio de escalada':         { coste: '2 po',    peso: '4 lb' },
  // ── J ──
  'Jabón':                      { coste: '2 pc',    peso: '-' },
  'Jarro/jarra':                { coste: '2 pc',    peso: '4 lb' },
  // ── K ──
  'Kit de escalada':            { coste: '25 po',   peso: '12 lb' },
  'Kit de sanador':             { coste: '2 po',    peso: '3 lb' },
  // ── L ──
  'Lacre':                      { coste: '5 pp',    peso: '-' },
  'Lámpara':                    { coste: '5 pp',    peso: '1 lb' },
  'Lata de yesca':              { coste: '5 pp',    peso: '1 lb' },
  'Lente de aumento':           { coste: '100 po',  peso: '-' },
  'Libro':                      { coste: '25 po',   peso: '5 lb' },
  'Libro de conjuros':          { coste: '50 po',   peso: '3 lb' },
  'Linterna con capuchón':      { coste: '5 po',    peso: '2 lb' },
  'Linterna de ojo de buey':    { coste: '10 po',   peso: '2 lb' },
  // ── M ──
  'Manta':                      { coste: '5 pp',    peso: '3 lb' },
  'Martillo':                   { coste: '1 po',    peso: '3 lb' },
  'Mazo (herramienta)':         { coste: '2 po',    peso: '10 lb' },
  'Mochila':                    { coste: '2 po',    peso: '5 lb' },
  // ── Munición ──
  'Munición - Agujas de cerbatana (50)': { coste: '1 po',  peso: '1 lb' },
  'Munición - Balas de honda (20)':      { coste: '4 pc',  peso: '1,5 lb' },
  'Munición - Flechas (20)':             { coste: '1 po',  peso: '1 lb' },
  'Munición - Virotes de ballesta (20)': { coste: '1 po',  peso: '1,5 lb' },
  // ── O ──
  'Odre':                       { coste: '2 pp',    peso: '5 lb (lleno)' },
  'Olla de hierro':             { coste: '2 pc',    peso: '10 lb' },
  // ── P ──
  'Pala':                       { coste: '2 po',    peso: '5 lb' },
  'Palanca':                    { coste: '2 po',    peso: '5 lb' },
  'Papel (una hoja)':           { coste: '2 pp',    peso: '-' },
  'Perfume (vial)':             { coste: '5 po',    peso: '-' },
  'Pergamino (una hoja)':       { coste: '1 pp',    peso: '-' },
  'Pértiga (10 pies)':          { coste: '5 pc',    peso: '7 lb' },
  'Pico de minero':             { coste: '2 po',    peso: '10 lb' },
  'Piedra de afilar':           { coste: '1 pc',    peso: '1 lb' },
  'Piquetas de hierro (10)':    { coste: '1 po',    peso: '5 lb' },
  'Pitón':                      { coste: '5 pc',    peso: '1/4 lb' },
  'Pluma de escritura':         { coste: '2 pc',    peso: '-' },
  'Poción de curación':         { coste: '50 po',   peso: '1/2 lb' },
  // ── R ──
  'Raciones (1 día)':           { coste: '5 pp',    peso: '2 lb' },
  'Reloj de arena':             { coste: '25 po',   peso: '1 lb' },
  'Ropa común':                 { coste: '5 pp',    peso: '3 lb' },
  'Ropa de disfraz':            { coste: '5 po',    peso: '4 lb' },
  'Ropa de viajero':            { coste: '2 po',    peso: '4 lb' },
  'Ropa fina':                  { coste: '5 po',    peso: '6 lb' },
  // ── S ──
  'Saco':                       { coste: '1 pc',    peso: '1/2 lb' },
  'Saco de dormir':             { coste: '1 po',    peso: '7 lb' },
  'Silbato de señales':         { coste: '5 pc',    peso: '-' },
  'Símbolo sagrado - Amuleto':  { coste: '5 po',    peso: '1 lb' },
  'Símbolo sagrado - Emblema':  { coste: '5 po',    peso: '-' },
  'Símbolo sagrado - Relicario':{ coste: '5 po',    peso: '2 lb' },
  // ── T ──
  'Tienda de campaña (2 personas)': { coste: '2 po', peso: '20 lb' },
  'Tinta (botella 1 onza)':     { coste: '10 po',   peso: '-' },
  'Tiza (1 trozo)':             { coste: '1 pc',    peso: '-' },
  'Trampa de cazador':          { coste: '5 po',    peso: '25 lb' },
  'Túnica':                     { coste: '1 po',    peso: '4 lb' },
  // ── V ──
  'Vela':                       { coste: '1 pc',    peso: '-' },
  'Veneno básico (vial)':       { coste: '100 po',  peso: '-' },
  'Vial':                       { coste: '1 po',    peso: '-' },
};

const HERRAMIENTAS = {
  // ── ARTESANO ──
  'Herramientas de carpintero':      { categoria: 'Artesano', coste: '8 po',  peso: '6 lb' },
  'Herramientas de cartógrafo':      { categoria: 'Artesano', coste: '15 po', peso: '6 lb' },
  'Herramientas de zapatero':        { categoria: 'Artesano', coste: '5 po',  peso: '5 lb' },
  'Herramientas de alfarero':        { categoria: 'Artesano', coste: '10 po', peso: '3 lb' },
  'Herramientas de herrero':         { categoria: 'Artesano', coste: '20 po', peso: '8 lb' },
  'Herramientas de hojalatero':      { categoria: 'Artesano', coste: '50 po', peso: '10 lb' },
  'Herramientas de tejedor':         { categoria: 'Artesano', coste: '1 po',  peso: '5 lb' },
  'Herramientas de tallista':        { categoria: 'Artesano', coste: '1 po',  peso: '5 lb' },
  'Herramientas de soplador de vidrio': { categoria: 'Artesano', coste: '30 po', peso: '5 lb' },
  'Herramientas de joyero':          { categoria: 'Artesano', coste: '25 po', peso: '2 lb' },
  'Herramientas de peletero':        { categoria: 'Artesano', coste: '5 po',  peso: '5 lb' },
  'Herramientas de albañil':         { categoria: 'Artesano', coste: '10 po', peso: '8 lb' },
  'Materiales de pintor':            { categoria: 'Artesano', coste: '10 po', peso: '5 lb' },
  'Materiales alquímicos':           { categoria: 'Artesano', coste: '50 po', peso: '8 lb' },
  'Materiales de cervecería':        { categoria: 'Artesano', coste: '20 po', peso: '9 lb' },
  'Materiales de caligrafía':        { categoria: 'Artesano', coste: '10 po', peso: '5 lb' },
  'Utensilios de cocina':            { categoria: 'Artesano', coste: '1 po',  peso: '8 lb' },
  // ── ESPECIALES ──
  'Herramientas de ladrón':          { categoria: 'Especial', coste: '25 po', peso: '1 lb' },
  'Herramientas de navegación':      { categoria: 'Especial', coste: '25 po', peso: '2 lb' },
  // ── INSTRUMENTOS MUSICALES ──
  'Caramillo':                       { categoria: 'Instrumento', coste: '2 po',  peso: '1 lb' },
  'Cuerno':                          { categoria: 'Instrumento', coste: '3 po',  peso: '2 lb' },
  'Dulcimer':                        { categoria: 'Instrumento', coste: '25 po', peso: '10 lb' },
  'Flauta':                          { categoria: 'Instrumento', coste: '2 po',  peso: '1 lb' },
  'Flauta de pan':                   { categoria: 'Instrumento', coste: '12 po', peso: '2 lb' },
  'Gaita':                           { categoria: 'Instrumento', coste: '30 po', peso: '6 lb' },
  'Laúd':                            { categoria: 'Instrumento', coste: '35 po', peso: '2 lb' },
  'Lira':                            { categoria: 'Instrumento', coste: '30 po', peso: '2 lb' },
  'Tambor':                          { categoria: 'Instrumento', coste: '6 po',  peso: '3 lb' },
  'Viola':                           { categoria: 'Instrumento', coste: '30 po', peso: '1 lb' },
  // ── KITS ──
  'Kit de disfraz':                  { categoria: 'Kit', coste: '25 po', peso: '3 lb' },
  'Kit de envenenador':              { categoria: 'Kit', coste: '50 po', peso: '2 lb' },
  'Kit de falsificación':            { categoria: 'Kit', coste: '15 po', peso: '5 lb' },
  'Kit de herboristería':            { categoria: 'Kit', coste: '5 po',  peso: '3 lb' },
  // ── SETS DE JUEGO ──
  'Set de ajedrez de dragón':        { categoria: 'Juego', coste: '1 po',  peso: '1/2 lb' },
  'Set de baraja de cartas':         { categoria: 'Juego', coste: '5 pp',  peso: '-' },
  'Set de dados':                    { categoria: 'Juego', coste: '1 pp',  peso: '-' },
  'Set de tres dragones':            { categoria: 'Juego', coste: '1 po',  peso: '-' },
};

const KITS_INICIO = {
  'Kit de Ladrón':      { coste: '16 po', contenido: 'Mochila, 1000 rodamientos, 10ft hilo, campana, 5 velas, palanca, martillo, 10 pitones, linterna capucha, 2 aceites, raciones 5 días, yesquero, odre, 50ft cuerda cáñamo' },
  'Kit de Diplomático': { coste: '39 po', contenido: 'Cofre, 2 estuches mapas/pergaminos, ropa fina, tinta, pluma, lámpara, 2 aceites, 5 hojas papel, perfume, lacre, jabón' },
  'Kit de Dungeons':    { coste: '12 po', contenido: 'Saco dormir, palanca, martillo, 10 pitones, 10 antorchas, yesquero, raciones 10 días, odre, 50ft cuerda cáñamo' },
  'Kit de Actor':       { coste: '40 po', contenido: 'Mochila, saco dormir, 2 trajes, 5 velas, raciones 5 días, odre, kit disfraz' },
  'Kit de Explorador':  { coste: '10 po', contenido: 'Mochila, saco dormir, kit cocina, yesquero, 10 antorchas, raciones 10 días, odre, 50ft cuerda cáñamo' },
  'Kit de Sacerdote':   { coste: '19 po', contenido: 'Mochila, manta, 10 velas, yesquero, caja limosnas, 2 barras incienso, incensario, vestimentas, raciones 2 días, odre' },
  'Kit de Erudito':     { coste: '40 po', contenido: 'Mochila, libro conocimiento, tintero, pluma, 10 hojas pergamino, bolsa arena, cuchillo pequeño' },
};

const MONTURAS = {
  'Burro/Mula':         { coste: '8 po',   velocidad: '40 pies', carga: '420 lb' },
  'Caballo de Guerra':  { coste: '400 po', velocidad: '60 pies', carga: '540 lb' },
  'Caballo de Monta':   { coste: '75 po',  velocidad: '60 pies', carga: '480 lb' },
  'Caballo de Tiro':    { coste: '50 po',  velocidad: '40 pies', carga: '540 lb' },
  'Camello':            { coste: '50 po',  velocidad: '50 pies', carga: '480 lb' },
  'Elefante':           { coste: '200 po', velocidad: '40 pies', carga: '1320 lb' },
  'Mastín':             { coste: '25 po',  velocidad: '40 pies', carga: '195 lb' },
  'Poni':               { coste: '30 po',  velocidad: '40 pies', carga: '225 lb' },
};

const APAREJOS_VEHICULOS = {
  // ── APAREJOS ──
  'Alforjas':             { categoria: 'Aparejo', coste: '4 po',   peso: '8 lb' },
  'Barda':                { categoria: 'Aparejo', coste: 'x4 armadura', peso: 'x2 armadura' },
  'Bocado y brida':       { categoria: 'Aparejo', coste: '2 po',   peso: '1 lb' },
  'Carreta':              { categoria: 'Vehículo terrestre', coste: '35 po',  peso: '400 lb' },
  'Carro':                { categoria: 'Vehículo terrestre', coste: '15 po',  peso: '200 lb' },
  'Carruaje':             { categoria: 'Vehículo terrestre', coste: '100 po', peso: '600 lb' },
  'Comida (por día)':     { categoria: 'Aparejo', coste: '5 pc',   peso: '10 lb' },
  'Cuadriga':             { categoria: 'Vehículo terrestre', coste: '250 po', peso: '100 lb' },
  'Establo (por día)':    { categoria: 'Servicio', coste: '5 pp',  peso: '-' },
  // ── SILLAS DE MONTAR ──
  'Silla de carga':       { categoria: 'Silla', coste: '5 po',  peso: '15 lb' },
  'Silla de montar':      { categoria: 'Silla', coste: '10 po', peso: '25 lb' },
  'Silla exótica':        { categoria: 'Silla', coste: '60 po', peso: '40 lb' },
  'Silla militar':        { categoria: 'Silla', coste: '20 po', peso: '30 lb' },
  'Trineo':               { categoria: 'Vehículo terrestre', coste: '20 po', peso: '300 lb' },
  // ── VEHÍCULOS DE AGUA ──
  'Bote de remos':        { categoria: 'Agua', coste: '50 po',      velocidad: '1,5 millas/hora' },
  'Chalupa':              { categoria: 'Agua', coste: '3000 po',    velocidad: '1 milla/hora' },
  'Galera':               { categoria: 'Agua', coste: '30.000 po',  velocidad: '4 millas/hora' },
  'Nave larga':           { categoria: 'Agua', coste: '10.000 po',  velocidad: '3 millas/hora' },
  'Navío de guerra':      { categoria: 'Agua', coste: '25.000 po',  velocidad: '2,5 millas/hora' },
  'Velero':               { categoria: 'Agua', coste: '10.000 po',  velocidad: '2 millas/hora' },
};

module.exports = {
  ARMADURAS,
  ARMAS,
  EQUIPO_AVENTURERO,
  HERRAMIENTAS,
  KITS_INICIO,
  MONTURAS,
  APAREJOS_VEHICULOS,
};
