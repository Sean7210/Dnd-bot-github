// ── data/goldenWeapons.js ─────────────────────────────────────────────────────
// ARMAS DORADAS — 26 armas (2 por clase), obtenidas con un vale dorado
// El vale dorado es un 1 en 10.000 dentro del propio vale especial (1/1000)
// Cada arma es anti-algo y tiene poder desproporcionado
// ─────────────────────────────────────────────────────────────────────────────

const ARMAS_DORADAS = [

  // ══ ARTIFICIERO ══════════════════════════════════════════════════════════
  {
    id: 'GOLD-ART-1',
    clase: 'Artificiero',
    nombre: 'Thousand Sunny — Fortaleza Voladora',
    tipo: 'Anti-Fortaleza',
    daño: '20d12 contundente (colisión) · Cañones: 8d10 por salva',
    propiedades: 'Vehículo volador, Indestructible sin Deseo, Tripulación autónoma',
    desc: 'El verdadero Thousand Sunny de One Piece materializado como arma de campaña. Barco volador de 200ft de eslora con casco de Wapometal. Montado: velocidad vuelo 120ft. Cañones Gaon (acción: 8d10 fuerza área 60ft, TS CON CD 20). Coup de Burst: 1 uso/día, acelera en una línea de 500ft destruyendo todo en el camino (estructura o fortaleza entera: 40d12). Tripulación de 10 Zombies Constructos aliados permanentes. Resistencia a todo daño. Solo el portador puede pilotarlo.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-ART-2',
    clase: 'Artificiero',
    nombre: 'El Gran Tesoro — Arma Orbital Mk.0',
    tipo: 'Anti-Ejército',
    daño: '50d10 radiante (disparo orbital)',
    propiedades: 'A distancia ilimitada (mismo plano), 1 uso/semana, Área 120ft',
    desc: 'Un satélite arcano en órbita. Como acción ritual de 10 minutos, señalas un punto en el mismo plano: un rayo de energía pura cae desde el cielo. Todas las criaturas en área 120ft hacen TS DEX CD 22 o reciben 50d10 radiante (éxito = mitad). Destruye cualquier estructura no mágica de nivel 5 o menos automáticamente. El disparo es visible desde 10 millas.',
    rareza: '✨ DORADA',
  },

  // ══ BÁRBARO ══════════════════════════════════════════════════════════════
  {
    id: 'GOLD-BAR-1',
    clase: 'Bárbaro',
    nombre: 'Mjölnir Primigenio',
    tipo: 'Anti-Titán',
    daño: '10d12 relámpago+contundente',
    propiedades: 'Solo empuñable en furia, Invoca tormenta al blandir, Regresa',
    desc: 'El martillo original de Thor, no la réplica. Solo puede levantarse si el portador está en furia y tiene FUE 24+. Al lanzarlo: tormenta en 1 milla que dura hasta que lo recuperes. Cada turno que la tormenta existe, 3d10 relámpago caen sobre el objetivo del turno anterior. Contra titanes y gigantes: daño máximo automático. Al matar, el cuerpo explota en relámpago: 6d10 a todas las criaturas en 30ft (TS DEX CD 22).',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-BAR-2',
    clase: 'Bárbaro',
    nombre: 'Dragonslayer — Original',
    tipo: 'Anti-Dragón',
    daño: '12d6 cortante',
    propiedades: 'Pesada, Zona de destrucción de 10ft de ancho al cortar',
    desc: 'La espada de Guts del inframundo, la real. De 7 pies y media tonelada de hierro sin refinar. Solo puede ser levantada con FUE 26+ o en un estado berserker absoluto. Al atacar: todo lo que esté en la trayectoria de 10ft recibe el daño (sin tirada, solo TS DEX CD 21 para la mitad). Contra dragones: inmunidades ignoradas, daño doble. Al crítico: el objetivo pierde una extremidad (narrativo) y su velocidad se reduce a 0 permanentemente hasta curación mágica. Inspirada en Berserk.',
    rareza: '✨ DORADA',
  },

  // ══ BARDO ════════════════════════════════════════════════════════════════
  {
    id: 'GOLD-BAR-3',
    clase: 'Bardo',
    nombre: 'Lira de la Creación',
    tipo: 'Anti-Realidad',
    daño: '0 (la realidad obedece)',
    propiedades: 'Crea objetos permanentes, Reescribe memorias, 3 usos/año',
    desc: 'La lira con la que los dioses cantaron el mundo. Al tocarla 1 hora: crea un objeto permanente de hasta 1000 PO de valor de la nada, o edita las memorias de hasta 100 criaturas que escuchen (TS INT CD 25 para resistir). Uso extremo (1/año): reescribe un evento de la última semana en la realidad (con aprobación del DM). Las criaturas que escuchen la música sin TS previa quedan bajo el efecto de Sugestión permanente.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-BAR-4',
    clase: 'Bardo',
    nombre: 'Trompeta del Apocalipsis',
    tipo: 'Anti-Ejército',
    daño: '20d8 trueno (toque) · 40d6 psíquico (solo objetivo)',
    propiedades: 'Área 300ft, Mata criaturas débiles, 1 uso/semana',
    desc: 'Una de las trompetas del Apocalipsis recuperada. Al soplar: todas las criaturas en 300ft con 50 HP o menos mueren instantáneamente (TS CON CD 23 para no morir, pero reciben 20d8 trueno de todas formas). Criaturas por encima de 50 HP quedan sordas y aterradas permanentemente hasta curación mágica. El toque convierte el área en terreno devastado. No puede ser silenciada.',
    rareza: '✨ DORADA',
  },

  // ══ BRUJO ════════════════════════════════════════════════════════════════
  {
    id: 'GOLD-BRU-1',
    clase: 'Brujo',
    nombre: 'Necronomicón Viviente',
    tipo: 'Anti-Mortalidad',
    daño: 'Muerte instantánea (rituales)',
    propiedades: 'Rituales de resurrección/destrucción masiva, Se alimenta de almas',
    desc: 'El libro que no debería existir. Rituales disponibles: Muerte Masiva (área 1 milla, CD 25 o muerte, 1/mes), Resurrección sin límite de tiempo (consume 1000 almas almacenadas), Subyugar Dios Menor (CD 28, 1 intento/año). El libro almacena almas de criaturas muertas en 100ft (1 alma por criatura). Al morir el portador, el libro resucita al portador consumiendo 100 almas almacenadas si las hay.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-BRU-2',
    clase: 'Brujo',
    nombre: 'Corona de Nyarlathotep',
    tipo: 'Anti-Mente',
    daño: '10d10 psíquico por mirada',
    propiedades: 'Control mental masivo, Corrompe alineamiento, Permanente',
    desc: 'Corona del Faraón Reptante. Al ponérsela: aura de 120ft. Criaturas en el aura hacen TS INT CD 24 al entrar o al inicio de su turno o quedan bajo el control del portador permanentemente (hasta curación Deseo). Las criaturas controladas no pueden ser liberadas por Disipar Magia de nivel inferior a 9. Al quitarse la corona: el portador hace TS SAB CD 18 o pierde su alineamiento durante 1d10 días.',
    rareza: '✨ DORADA',
  },

  // ══ CLÉRIGO ══════════════════════════════════════════════════════════════
  {
    id: 'GOLD-CLE-1',
    clase: 'Clérigo',
    nombre: 'Arca de la Alianza',
    tipo: 'Anti-Ejército Maligno',
    daño: '30d10 radiante (al abrir)',
    propiedades: 'Mata a los impuros instantáneamente, Aura de santidad 300ft',
    desc: 'El Arca original. Aura permanente de 300ft: no-muertos y fiends con CR 15 o menos son destruidos al entrar en el aura (TS CON CD 25 o muerte). Al abrir el Arca (acción): todos los seres malignos en 300ft reciben 30d10 radiante y quedan cegados permanentemente. Los neutrales reciben la mitad. Los buenos son curados por el mismo valor. Solo puede ser transportada por criaturas de alineamiento Bueno; los demás reciben 10d10 radiante por turno al tocarla.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-CLE-2',
    clase: 'Clérigo',
    nombre: 'Báculo de Moisés',
    tipo: 'Anti-Plaga',
    daño: '10 plagas a elección',
    propiedades: 'Controla el mar, Invoca plagas, Divide el terreno',
    desc: 'El báculo original. Poderes: Dividir Agua (crea paso seguro en cualquier masa de agua hasta 1 milla, dura 1 hora), Plaga (elige 1 de las 10 plagas bíblicas para el área, afecta 1 milla cuadrada, 1 uso/día por plaga), Agua de Roca (crea fuente de agua fresca permanente). Al golpear el suelo: terremoto en 300ft (TS DEX CD 22 o derribado y 10d10 contundente). Las plagas pueden afectar ejércitos enteros.',
    rareza: '✨ DORADA',
  },

  // ══ DRUIDA ═══════════════════════════════════════════════════════════════
  {
    id: 'GOLD-DRU-1',
    clase: 'Druida',
    nombre: 'Semilla del Árbol Mundo Yggdrasil',
    tipo: 'Anti-Apocalipsis',
    daño: '0 en combate / Reshaping world',
    propiedades: 'Conecta planos, Crea ecosistemas, Resucita la naturaleza muerta',
    desc: 'Una semilla del árbol que conecta los Nueve Mundos. Al plantarla: en 1 semana crece un árbol de 1 milla de altura que restaura toda la naturaleza muerta en 10 millas. Portales a cualquier plano se abren en sus raíces (1/día, permanentes hasta destruirlos). Como arma: los enemigos en contacto con el árbol o sus raíces hacen TS SAB CD 25 o quedan atrapados en el Árbol permanentemente (como prisión extraplanar). El árbol tiene inmunidad a todo daño y 1000 HP.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-DRU-2',
    clase: 'Druida',
    nombre: 'Corazón del Kaijú Primigenio',
    tipo: 'Anti-Civilización',
    daño: '40d10 al pisotear (forma kaijú)',
    propiedades: 'Forma de Kaijú Gigantesco, Destroza ciudades, 1 uso/semana',
    desc: 'Al implantar este corazón pulsante en el propio pecho (acción ritual 1 hora): puedes adoptar forma de Kaijú (bestia Colosal de 300ft de altura) durante 1 hora una vez a la semana. En forma Kaijú: cada paso destruye estructuras en 60ft automáticamente, mordisco 40d10, cola 20d10 área 100ft. Inmune a ataques no legendarios. Al terminar: el entorno en 1 milla está devastado. Las ciudades medievales no pueden resistir más de 3 turnos tu presencia.',
    rareza: '✨ DORADA',
  },

  // ══ EXPLORADOR ═══════════════════════════════════════════════════════════
  {
    id: 'GOLD-EXP-1',
    clase: 'Explorador',
    nombre: 'El Ojo de Dios — Satélite de Reconocimiento',
    tipo: 'Anti-Sigilo',
    daño: '0 (información total)',
    propiedades: 'Ve todo en el plano, Elimina sigilo, Guía proyectiles',
    desc: 'Un orbe que proyecta la visión de un satélite mágico orbitante. Como acción: ves cualquier punto del mismo plano en tiempo real. Ninguna criatura puede ocultarse de ti: el sigilo, la invisibilidad y los planos paralelos son visibles. Puedes guiar proyectiles con esta visión: tiradas de ataque a distancia tienen ventaja y el alcance se convierte en ilimitado (mismo plano). Detectas trampas, puertas secretas y criaturas ocultas automáticamente en 1 milla.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-EXP-2',
    clase: 'Explorador',
    nombre: 'Flechas del Juicio Final',
    tipo: 'Anti-Inmortal',
    daño: '30d8 por flecha (ignora todo)',
    propiedades: 'Matan inmortales, Ignoran todas las resistencias e inmunidades, Quiver infinito',
    desc: 'Un carcaj con flechas que nunca se agotan. Cada flecha ignora TODAS las resistencias, inmunidades y características de invulnerabilidad. Criaturas inmortales, semidioses o con resurrecciones automáticas deben hacer TS CON CD 26 o esa habilidad queda suprimida 24h. Los dioses menores (CR 26+) hacen las tiradas de ataque de estas flechas con desventaja por instinto de supervivencia. Al crítico: el objetivo hace TS CON CD 25 o muere instantáneamente sin importar sus HP.',
    rareza: '✨ DORADA',
  },

  // ══ GUERRERO ═════════════════════════════════════════════════════════════
  {
    id: 'GOLD-GUE-1',
    clase: 'Guerrero',
    nombre: 'Excalibur — La Espada en la Piedra Original',
    tipo: 'Anti-Tirano',
    daño: '15d10 radiante',
    propiedades: 'Solo empuñable por el rey legítimo, Mata tiranos instantáneamente',
    desc: 'La espada real de Arturo Pendragon. Solo puede ser desenvainada por alguien reconocido como liderazgo legítimo (DM arbitrará). Al desenvainar: luz solar en 1 milla durante 1 hora. Contra tiranos, usurpadores o alineamiento Malvado Legal: daño automáticamente máximo y el objetivo hace TS CON CD 26 o cae a 0 HP. Al empuñar: todas las criaturas neutrales y buenas en 1 milla reconocen al portador como rey y no atacarán a menos que sean ordenadas. Indestructible.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-GUE-2',
    clase: 'Guerrero',
    nombre: 'Durandal — Hoja que no Puede Romperse Jamás',
    tipo: 'Anti-Magia',
    daño: '12d8 cortante (corta la magia)',
    propiedades: 'Corta hechizos activos, Destruye artefactos, Indestructible absolutamente',
    desc: 'La espada de Roldán, literalmente indestructible por cualquier medio incluido el Deseo. Al atacar a una criatura con efectos mágicos activos: los efectos son cortados (como Disipar Magia nivel 9) además del daño. Puede destruir Artefactos en 3 golpes (no requiere TS). Al impactar a una criatura lanzando un hechizo: el hechizo falla automáticamente y el espacio se pierde. Zonas antimagia no afectan esta espada.',
    rareza: '✨ DORADA',
  },

  // ══ HECHICERO ════════════════════════════════════════════════════════════
  {
    id: 'GOLD-HEC-1',
    clase: 'Hechicero',
    nombre: 'Vara de la Creación Arcana',
    tipo: 'Anti-Existencia',
    daño: '0 o todo (a elección)',
    propiedades: 'Crea o destruye materia, Reescribe leyes físicas locales, 1 uso/día',
    desc: 'La vara con la que el Arcano original escribió las leyes de la magia. 1 uso/día: en un área de 300ft a tu alrededor, puedes modificar una ley física durante 24h (gravedad invertida, fuego que congela, el tiempo corre al doble o mitad, etc.). Como ataque: aniquila un objeto no artefacto de hasta 10ft cúbicos con una palabra. Contra criaturas: TS CON CD 27 o es desmaterializada (aniquilada si falla por 10+). El DM puede limitar el uso creativo.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-HEC-2',
    clase: 'Hechicero',
    nombre: 'Corazón del Sol Artificial',
    tipo: 'Anti-No-Muerto',
    daño: '25d10 fuego+radiante (explosión solar)',
    propiedades: 'Crea mini-sol, Destruye oscuridad mágica, 1 uso/semana',
    desc: 'Un núcleo de estrella miniaturizado. Al activar (acción): creas un mini-sol de 10ft que orbita a tu alrededor durante 1 hora. Luz solar en 300ft. No-muertos y criaturas de oscuridad en 60ft reciben 10d10 radiante/turno. 1 uso/semana: Explosión Solar, el mini-sol detona: todas las criaturas en 120ft hacen TS DEX CD 24 o reciben 25d10 fuego+radiante. No-muertos y fiends no tienen TS: reciben daño completo automáticamente y deben hacer TS CON CD 24 o morir.',
    rareza: '✨ DORADA',
  },

  // ══ MAGO ═════════════════════════════════════════════════════════════════
  {
    id: 'GOLD-MAG-1',
    clase: 'Mago',
    nombre: 'Grimorio de los Dioses — Tomo Infinito',
    tipo: 'Anti-Ignorancia',
    daño: 'Conocimiento como arma',
    propiedades: 'Contiene todos los hechizos existentes, Aprende instantáneamente, Inmortalidad académica',
    desc: 'El libro que contiene todos los hechizos que han existido, existen o existirán. El portador puede lanzar CUALQUIER hechizo del juego una vez al día sin espacio de conjuro ni componentes. El DC de todos los hechizos sube a 25 fijo. Hechizos de nivel 9 se pueden lanzar sin restricción de usos. El conocimiento del libro no puede ser olvidado: si el portador muere, es resucitado en la biblioteca más cercana al cabo de 1d10 días con el libro en mano.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-MAG-2',
    clase: 'Mago',
    nombre: 'Reloj del Tiempo Absoluto',
    tipo: 'Anti-Tiempo',
    daño: '0 (reescribe el tiempo)',
    propiedades: 'Para el tiempo 1 turno completo, Revierte acciones, 3 usos/semana',
    desc: 'Reloj que controla el flujo del tiempo local. 3 usos/semana: Para el Tiempo: el mundo se detiene 1 turno completo real, solo el portador actúa (puede lanzar hasta 6 hechizos, mover objetos, posicionarse). Revertir: deshace los últimos 6 segundos de realidad (1 turno), nadie recuerda lo que ocurrió salvo el portador. Envejecer Objetivo: una criatura envejece 100 años instantáneamente (TS CON CD 26 o muerte por edad).',
    rareza: '✨ DORADA',
  },

  // ══ MONJE ════════════════════════════════════════════════════════════════
  {
    id: 'GOLD-MON-1',
    clase: 'Monje',
    nombre: 'Puños del Vacío Absoluto — Técnica Prohibida',
    tipo: 'Anti-Dios',
    daño: '20d10 fuerza por golpe (vacío interior)',
    propiedades: 'Golpea inmateriales y divinos, Destruye la esencia, Técnica de 1 golpe/vida',
    desc: 'La técnica definitiva que ningún maestro quiso enseñar. El portador puede pelear contra criaturas divinas, ángeles y demonios como si fueran materiales. Una vez en la vida del personaje: El Puño del Vacío — un golpe que no ataca el cuerpo sino la existencia: sin tirada de impacto, sin resistencias, 20d10 fuerza al alma directa. Criaturas de CR 25 o menos hacen TS CON CD 30 o son destruidas permanentemente (ni Deseo puede resucitarlas). Usar esta técnica consume todos los puntos de ki permanentemente.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-MON-2',
    clase: 'Monje',
    nombre: 'Sandalias de Hermes',
    tipo: 'Anti-Distancia',
    daño: 'El movimiento es el arma',
    propiedades: 'Velocidad ilimitada, Camina entre planos, Tiempo detenido al correr',
    desc: 'Las sandalias aladas del dios mensajero. Velocidad de movimiento 300ft. Puedes caminar entre planos adyacentes sin usar un portal (acción). Al correr en línea recta más de 100ft: entras en el tiempo del relámpago — en ese instante puedes hacer hasta 10 ataques contra cualquier objetivo en esa línea. Ningún efecto puede impedirte moverte (inmovilizado, restringido, velocidad 0 — todos ignorados). 1 vez/día: Carrera entre Planos, te teletransportas a cualquier lugar del mismo plano.',
    rareza: '✨ DORADA',
  },

  // ══ PALADÍN ══════════════════════════════════════════════════════════════
  {
    id: 'GOLD-PAL-1',
    clase: 'Paladín',
    nombre: 'Lanza del Destino — Heilige Lanze',
    tipo: 'Anti-Inmortal Maligno',
    daño: '20d10 perforante+radiante',
    propiedades: 'Mata inmortales malignos, Vacuna contra resurrección maligna, Indestructible',
    desc: 'La lanza que atravesó a Cristo. Contra criaturas malignas: ignora todas las inmunidades, resistencias y salvaciones de muerte. Al matar con ella a una criatura maligna inmortal o con resurrección automática: esa criatura no puede ser resucitada por ningún medio durante 1 año (incluido Deseo). Vampiros, liches y similares son destruidos permanentemente en fallo de TS CON CD 28. El portador tiene inmunidad total a efectos de posesión y corrupción mágica.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-PAL-2',
    clase: 'Paladín',
    nombre: 'Armadura del Arcángel Miguel — Completa',
    tipo: 'Anti-Demonio',
    daño: '15d8 radiante (espada de luz adjunta)',
    propiedades: 'Inmunidad absoluta en aura, Ejerce juicio divino, Mata a Belial y similares',
    desc: 'La armadura completa del Arcángel General del Cielo. Aura de 120ft: fiends de CR 20 o menos no pueden entrar (TS SAB CD 26 o son repelidos permanentemente de la aura). Los 5 demonios más poderosos en el plano sienten tu presencia. Al empuñar la espada adjunta: tu ataque contra fiends es siempre un crítico y hace daño doble. 1 vez/campaña: Juicio Final — ejecutas a un fiend de cualquier CR que hayas tenido en combate durante 3 rondas (requiere RP y aprobación DM).',
    rareza: '✨ DORADA',
  },

  // ══ PÍCARO ═══════════════════════════════════════════════════════════════
  {
    id: 'GOLD-PIC-1',
    clase: 'Pícaro',
    nombre: 'La Fruta del Diablo Ope Ope no Mi',
    tipo: 'Anti-Biología',
    daño: 'Todo (controla el espacio)',
    propiedades: 'Crea Room, Cirugía del alma, Operación Eterna (1 vida)',
    desc: 'La fruta más valiosa de One Piece. Al comer: creas un "Room" esférico de hasta 200ft que controlas absolutamente. Dentro del Room: teleportar objetos y criaturas a voluntad (sin TS), separar extremidades sin daño permanente, realizar cirugía instantánea (cura cualquier enfermedad o maldición), invertir la posición de criaturas. Operación Eterna: 1 uso en toda la vida del personaje — otorgas inmortalidad a otra criatura a costa de tu propia vida.',
    rareza: '✨ DORADA',
  },
  {
    id: 'GOLD-PIC-2',
    clase: 'Pícaro',
    nombre: 'Guantes de Hermes — Los Originales',
    tipo: 'Anti-Seguridad',
    daño: 'Nada es inaccesible',
    propiedades: 'Abre cualquier cosa, Roba sin restricciones de plano, Invisibilidad permanente',
    desc: 'Los guantes del dios de los ladrones. Efecto permanente: eres invisible a toda magia de detección, escudos arcanos y alarmas. Puedes abrir cualquier cerradura, portal, cofre o barrera mágica (sin tirada) incluyendo las protegidas con Deseo. Al robar: la criatura no puede percibir que robaste aunque te esté mirando directamente (ilusión de continuidad perfecta). Puedes robar conceptos abstractos: un hechizo preparado, un recuerdo específico, o la confianza de alguien. 1 robo conceptual/día.',
    rareza: '✨ DORADA',
  },
];

// Total: 26 armas (2 por cada una de las 13 clases)
function getArmaDoradaAleatoria(clase = null) {
  if (clase) {
    const deClase = ARMAS_DORADAS.filter(a => a.clase === clase);
    if (deClase.length) return deClase[Math.floor(Math.random() * deClase.length)];
  }
  return ARMAS_DORADAS[Math.floor(Math.random() * ARMAS_DORADAS.length)];
}

function getArmasDoradasClase(clase) {
  return ARMAS_DORADAS.filter(a => a.clase === clase);
}

module.exports = { ARMAS_DORADAS, getArmaDoradaAleatoria, getArmasDoradasClase };
