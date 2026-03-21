// ══════════════════════════════════════════════════════════════════════
//  CLASES Y SUBCLASES D&D 5e — Extraído de "Manual Para Casi Todo"
//  Fuente: Clases-1-146.pdf + Clases-147-292.pdf (292 páginas)
// ══════════════════════════════════════════════════════════════════════

const CLASSES = {

  // ── ARTIFICIERO ────────────────────────────────────────────────────
  'Artificiero': {
    hitDie: 8,
    primaryStat: 'INT',
    saves: ['CON', 'INT'],
    skills: ['Conocimiento arcano', 'Historia', 'Investigación', 'Medicina', 'Naturaleza', 'Percepción', 'Prestidigitación'],
    numSkills: 2,
    description: 'Inventor mágico que infunde objetos con poder arcano',
    emoji: '⚙️',
    source: "Tasha's Cauldron of Everything",
    subclassLevel: 3,
    subclassLabel: 'Especialización',
    subclasses: {
      'Alquimista': {
        description: 'Mezcla pociones y elixires experimentales con efectos sorprendentes',
        features: ['Elixir Experimental', 'Hechizos de Alquimista', 'Erudición Alquímica', 'Reactivos Restauradores', 'Maestría Alquímica'],
      },
      'Blindado': {
        description: 'Se funde con una armadura mágica para convertirse en una máquina de guerra',
        features: ['Modelo de Armadura (Guardián/Infiltrador)', 'Armadura Mejorada', 'Modificaciones de Armadura', 'Armadura Perfeccionada'],
      },
      'Artillero': {
        description: 'Crea cañones mágicos y armas arcanas de largo alcance',
        features: ['Cañón de Eldritch', 'Hechizos de Artillero', 'Arma Arcana', 'Cañón Explosivo', 'Fortaleza Arcana'],
      },
      'Herrero de Batalla': {
        description: 'Forja un Defensor de Acero, un compañero construido mágicamente',
        features: ['Defensor de Acero', 'Hechizos de Herrero de Batalla', 'Acero del Alma', 'Arma Mejorada', 'Mejoras Arcanas'],
      },
    },
  },

  // ── BÁRBARO ────────────────────────────────────────────────────────
  'Bárbaro': {
    hitDie: 12,
    primaryStat: 'FUE',
    saves: ['FUE', 'CON'],
    skills: ['Atletismo', 'Intimidación', 'Naturaleza', 'Percepción', 'Supervivencia', 'Trato con animales'],
    numSkills: 2,
    description: 'Guerrero feroz que canaliza la rabia primordial',
    emoji: '🪓',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 3,
    subclassLabel: 'Senda Primaria',
    subclasses: {
      'Senda del Berserker': {
        description: 'Se entrega a una furia salvaje y enloquecida en el combate',
        features: ['Frenesí', 'Furia sin Mente', 'Presencia Intimidatoria', 'Represalia'],
      },
      'Senda del Guerrero Totémico': {
        description: 'Forja un vínculo espiritual con un animal totémico',
        features: ['Hechizos de Espíritu', 'Animal Totémico (Oso/Águila/Lobo/Alce/Tigre)', 'Aspecto del Animal', 'Caminante de Espíritu', 'Comunión Totémica'],
      },
      'Senda del Camorrista': {
        description: 'Bárbaro que mezcla combate brutal con tretas e ingenio callejero',
        features: ['Combate Sucio', 'Ventaja Inesperada', 'Taimado', 'Rugido de la Calle'],
        source: "Sword Coast Adventurer's Guide",
      },
      'Senda del Guardián Ancestral': {
        description: 'Invoca los espíritus de sus antepasados para proteger a sus aliados',
        features: ['Protectores Ancestrales', 'Escudo Espiritual', 'Visión Consular', 'Venganza de los Ancestros'],
        source: "Xanathar's Guide to Everything",
      },
      'Senda del Heraldo de la Tormenta': {
        description: 'Encarna las fuerzas de la naturaleza tempestuosa: tundra, mar o desierto',
        features: ['Aura de Tormenta (Desierto/Mar/Tundra)', 'Alma de Tormenta', 'Escudo de la Tormenta', 'Ira de la Tormenta'],
        source: "Xanathar's Guide to Everything",
      },
      'Senda del Fanático': {
        description: 'Guerrero divino poseído por la furia sagrada de su deidad',
        features: ['Arma Divina del Fanático', 'Invocación del Fanático', 'Furia Imparable', 'Presencia Exaltada', 'Vínculo del Fanático'],
        source: "Tasha's Cauldron of Everything",
      },
      'Senda de la Bestia': {
        description: 'Transforma su cuerpo con rasgos bestiales durante la furia',
        features: ['Forma de la Bestia (Mordisco/Garras/Cola)', 'Armadura Bestial', 'Instinto Infeccioso', 'Llamada de la Bestia'],
        source: "Tasha's Cauldron of Everything",
      },
      'Senda del Gigante': {
        description: 'Canaliza el poder de los gigantes para crecer en tamaño y fuerza',
        features: ['Poder del Gigante', 'Habla de Gigante', 'Aspecto del Gigante', 'Alma del Gigante', 'Furia del Titán'],
        source: "Bigby Presents: Glory of the Giants",
      },
      'Senda del Juggernaut': {
        description: 'Fuerza imparable que destruye todo lo que se interpone en su camino',
        features: ['Rompemuros', 'Entereza Indestructible', 'Fuerza Aplastante', 'Tren Imparable'],
        source: 'Homebrew / Fuente alternativa',
      },
    },
  },

  // ── BARDO ──────────────────────────────────────────────────────────
  'Bardo': {
    hitDie: 8,
    primaryStat: 'CAR',
    saves: ['DES', 'CAR'],
    skills: ['Acrobacias', 'Atletismo', 'Engaño', 'Historia', 'Intuición', 'Intimidación', 'Investigación', 'Medicina', 'Naturaleza', 'Percepción', 'Persuasión', 'Prestidigitación', 'Religión', 'Trato con animales'],
    numSkills: 3,
    description: 'Artista mágico que inspira con música y palabras',
    emoji: '🎵',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 3,
    subclassLabel: 'Colegio Bárdico',
    subclasses: {
      'Colegio del Conocimiento': {
        description: 'Bardo erudito que sabe un poco de todo y debilita a sus enemigos',
        features: ['Competencias Adicionales', 'Palabras Cortantes', 'Secretos Mágicos Adicionales', 'Capacidad Sin Par'],
      },
      'Colegio del Valor': {
        description: 'Guerrero-bardo que inspira a sus aliados y pelea en primera línea',
        features: ['Competencias de Combate', 'Inspiración de Combate', 'Ataque Extra', 'Magia de Batalla'],
      },
      'Colegio del Glamour': {
        description: 'Bardo tocado por la magia del Feywild que hechiza e inspira',
        features: ['Inspiración Encantadora', 'Manto de Inspiración', 'Manto del Majestoso', 'Unison Echos'],
        source: "Xanathar's Guide to Everything",
      },
      'Colegio de Espadas': {
        description: 'Acróbata y espadachín que combina combate y espectáculo',
        features: ['Competencias de Combate', 'Floritura de Espadachín', 'Movimiento Adicional', 'Maestría del Filo'],
        source: "Xanathar's Guide to Everything",
      },
      'Colegio de los Susurros': {
        description: 'Espía y maestro del miedo que teje secretos en las sombras',
        features: ['Psicotoxinas', 'Palabras del Terror', 'Manto de los Susurros', 'Sombras del Saber'],
        source: "Xanathar's Guide to Everything",
      },
      'Colegio de los Espíritus': {
        description: 'Médium que canaliza espíritus para obtener poder narrativo',
        features: ['Guía de los Espíritus', 'Palabras de Terror Espiritual', 'Velo Espiritual', 'Posesión del Espíritu'],
        source: 'Van Richten\'s Guide to Ravenloft',
      },
      'Colegio de la Elocuencia': {
        description: 'Orador maestro cuyas palabras nunca fallan',
        features: ['Inspiración Ubicua', 'Palabras Alentadoras', 'Perfección Retórica', 'Máster de Palabras', 'Inspiración Universal'],
        source: "Tasha's Cauldron of Everything",
      },
      'Colegio de la Tragedia': {
        description: 'Bardo que halla poder en la pérdida y el dolor',
        features: ['Poema de Penitencia', 'Musa Patética', 'Ode al Defunto', 'Toque Fatal'],
        source: "Tal'Dorei Campaign Setting Reborn",
      },
    },
  },

  // ── CLÉRIGO ────────────────────────────────────────────────────────
  'Clérigo': {
    hitDie: 8,
    primaryStat: 'SAB',
    saves: ['SAB', 'CAR'],
    skills: ['Historia', 'Intuición', 'Medicina', 'Persuasión', 'Religión'],
    numSkills: 2,
    description: 'Servidor divino que canaliza el poder de los dioses',
    emoji: '✝️',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 1,
    subclassLabel: 'Dominio Divino',
    subclasses: {
      'Dominio del Conocimiento': {
        description: 'Sacerdote de la sabiduría que busca y preserva el saber',
        features: ['Bendiciones del Conocimiento', 'Canal: Conocimiento de la Antigüedad', 'Canal: Lectura de Pensamientos', 'Visión Potenciada', 'Visiones del Pasado'],
      },
      'Dominio de la Guerra': {
        description: 'Campeón marcial que combate en nombre de su dios guerrero',
        features: ['Competencias de Combate', 'Canal: Golpe Guiado', 'Canal: Ardor Bélico', 'Ataque Extra', 'Golpe del Avatar Divino'],
      },
      'Dominio de Luz': {
        description: 'Heraldo de la luz divina que ahuyenta la oscuridad',
        features: ['Truco Warding Flare', 'Canal: Destello Radiante', 'Corona de Luz', 'Llama Potenciada'],
      },
      'Dominio de la Naturaleza': {
        description: 'Vínculo entre la civilización y el mundo natural',
        features: ['Acólito de la Naturaleza', 'Canal: Hechizar Animales y Plantas', 'Amortiguador de Hechizos', 'Señor de la Naturaleza'],
      },
      'Dominio de la Tempestad': {
        description: 'Sacerdote de la furia del mar y la tormenta',
        features: ['Truenos Coléricos', 'Canal: Rayo Destructor', 'Canal: Ira de la Tormenta', 'Golpe de Tormenta', 'Ojo de la Tormenta'],
      },
      'Dominio de la Vida': {
        description: 'Curandero sagrado que preserva y restaura la vida',
        features: ['Discípulo de la Vida', 'Preservar la Vida', 'Manos Bendecidas', 'Curación Divina', 'Curación Suprema'],
      },
      'Dominio de la Forja': {
        description: 'Artesano divino que crea y mejora armas y armaduras',
        features: ['Competencias de Herrero', 'Bendición del Forjador', 'Canal: Artesanía Consagrada', 'Alma del Forjador', 'Forjador Santo'],
        source: "Xanathar's Guide to Everything",
      },
      'Dominio de la Tumba': {
        description: 'Guardián del umbral entre la vida y la muerte',
        features: ['Círculo de Mortalidad', 'Ojos de la Tumba', 'Canal: Guardián del Umbral', 'Centinela en el Umbral', 'Guardián del Alma'],
        source: "Xanathar's Guide to Everything",
      },
      'Dominio del Saber Arcano': {
        description: 'Clérigo que mezcla magia divina y arcana',
        features: ['Iniciado Arcano', 'Canal: Hechizo Divino', 'Hechizos del Saber Arcano', 'Hechizo Potenciado', 'Poder Arcano'],
        source: "Tasha's Cauldron of Everything",
      },
      'Dominio de la Muerte': {
        description: 'Servidor oscuro que controla la muerte y los no muertos',
        features: ['Reaper', 'Canal: Toque de Muerte', 'Devastación Imparable', 'Indestructible', 'Mejora de la No Muerte'],
      },
      'Dominio del Orden': {
        description: 'Campeón de la ley y la civilización que controla mentes',
        features: ['Voz de la Autoridad', 'Canal: Orden del Orden', 'Juicio Encarnado', 'Orden Divino'],
        source: "Tasha's Cauldron of Everything",
      },
      'Dominio de la Paz': {
        description: 'Mediador que crea lazos sagrados entre aliados',
        features: ['Implementar Paz', 'Canal: Balada de la Paz', 'Lazo Protector', 'Expansión de Paz'],
        source: "Tasha's Cauldron of Everything",
      },
      'Dominio del Crepúsculo': {
        description: 'Guardián del umbral entre el día y la noche',
        features: ['Vigilia en el Crepúsculo', 'Canal: Santuario Crepuscular', 'Pasos del Crepúsculo', 'Presencia Crepuscular'],
        source: "Tasha's Cauldron of Everything",
      },
      'Dominio de la Sangre': {
        description: 'Clérigo que extrae poder de la sangre vital',
        features: ['Manipulación Sanguínea', 'Canal: Sello de Sangre', 'Sacrificio Sanguíneo', 'Maestría Sanguínea'],
        source: 'Blood Hunter / Fuente alternativa',
      },
      'Dominio de la Luna': {
        description: 'Servidor de la luna que domina la transformación y los secretos nocturnos',
        features: ['Canalización Lunar', 'Señal de la Luna', 'Escudo Lunar', 'Luna Llena'],
        source: 'Fuente alternativa',
      },
    },
  },

  // ── DRUIDA ─────────────────────────────────────────────────────────
  'Druida': {
    hitDie: 8,
    primaryStat: 'SAB',
    saves: ['INT', 'SAB'],
    skills: ['Arcanas', 'Historia', 'Intuición', 'Medicina', 'Naturaleza', 'Percepción', 'Religión', 'Supervivencia', 'Trato con animales'],
    numSkills: 2,
    description: 'Guardián de la naturaleza con poderes de transformación',
    emoji: '🌿',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 2,
    subclassLabel: 'Círculo Druídico',
    subclasses: {
      'Círculo de la Tierra': {
        description: 'Druida que extrae poder de la tierra, conectado a un entorno específico',
        features: ['Recuperación Natural', 'Hechizos del Círculo', 'Paso por la Tierra', 'Mente de la Tierra', 'Naturaleza Bestial'],
      },
      'Círculo de la Luna': {
        description: 'Poderoso transformador que puede convertirse en bestias formidables',
        features: ['Forma Salvaje de Combate', 'Formas Elementales', 'Golpes de las Bestias', 'Mil Formas'],
      },
      'Círculo de los Sueños': {
        description: 'Druida vinculado al Feywild que teje magia de sueños',
        features: ['Abrazo de los Sueños', 'Caminante de Sueños', 'Guardia Vigilante', 'Refugio en los Sueños'],
        source: "Xanathar's Guide to Everything",
      },
      'Círculo del Pastor': {
        description: 'Invocador que convoca espíritus y protege a sus aliados animales',
        features: ['Habla de los Bosques', 'Invocación del Espíritu', 'Escudo Guardián', 'Invocación Mítica'],
        source: "Xanathar's Guide to Everything",
      },
      'Círculo de las Esporas': {
        description: 'Druida que ve la belleza en la descomposición y controla hongos',
        features: ['Hechizos de las Esporas', 'Halo de Esporas', 'Forma Zombie', 'Propagación de Esporas', 'Fertilidad Fúngica'],
        source: "Tasha's Cauldron of Everything",
      },
      'Círculo del Fuego Fatuo': {
        description: 'Druida que usa fuego mágico engañoso para guiar y confundir',
        features: ['Fuego Fatuo', 'Corazón de Llama', 'Guía Incandescente', 'Voluntad del Fuego'],
        source: "Tasha's Cauldron of Everything",
      },
      'Círculo de las Estrellas': {
        description: 'Druida que traza constelaciones y canaliza el poder estelar',
        features: ['Mapa Estelar', 'Forma Estelar', 'Caminante Cósmico', 'Iluminación Estelar', 'Plena Constelación'],
        source: "Tasha's Cauldron of Everything",
      },
      'Círculo de los Marchitos': {
        description: 'Druida que estudia la muerte y el renacimiento a través de la descomposición',
        features: ['Hechizos de los Marchitos', 'Forma de los Marchitos', 'Espora Explosiva', 'Despertar de los Muertos'],
        source: 'Fuente alternativa',
      },
    },
  },

  // ── GUERRERO ───────────────────────────────────────────────────────
  'Guerrero': {
    hitDie: 10,
    primaryStat: 'FUE/DES',
    saves: ['FUE', 'CON'],
    skills: ['Acrobacias', 'Atletismo', 'Historia', 'Intuición', 'Intimidación', 'Percepción', 'Supervivencia', 'Trato con animales'],
    numSkills: 2,
    description: 'Maestro del combate versátil y técnico',
    emoji: '⚔️',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 3,
    subclassLabel: 'Arquetipo Marcial',
    subclasses: {
      'Campeón': {
        description: 'Perfecciona la fuerza física bruta con críticos devastadores',
        features: ['Crítico Mejorado', 'Atleta Excepcional', 'Estilo de Combate Adicional', 'Crítico Superior', 'Superviviente'],
      },
      'Maestro de Batalla': {
        description: 'Táctico que usa maniobras con dados de superioridad',
        features: ['Maniobras de Combate', 'Dados de Superioridad', 'Figura Conocida', 'Implacable', 'Maestría de Combate'],
      },
      'Caballero Arcano': {
        description: 'Guerrero que combina espada y magia de abjuración/evocación',
        features: ['Lanzamiento de Hechizos', 'Vínculo de Arma', 'Magia de Guerra', 'Golpe Arcano', 'Carga de Hechizo'],
      },
      'Caballero del Dragón Púrpura': {
        description: 'Líder caballeresco que inspira y protege a sus aliados',
        features: ['Aprendiz de Caballería', 'Inspirador', 'Apoyo Real', 'Bastión de Protección'],
        source: "Sword Coast Adventurer's Guide",
      },
      'Samurái': {
        description: 'Guerrero que logra victoria mediante concentración absoluta',
        features: ['Espíritu de Combate', 'Aprendizaje Elegante', 'Resolución de Acero', 'Defensa Rápida', 'Fuerza antes de la Muerte'],
        source: "Xanathar's Guide to Everything",
      },
      'Caballero Eco': {
        description: 'Guerrero que duplica sus ataques a través de un eco dimensional',
        features: ['Manifest Echo', 'Unleash Incarnation', 'Echo Avatar', 'Shadow Martyr', 'Reclaim Potential'],
        source: "Explorer's Guide to Wildemount",
      },
      'Caballero Rúnico': {
        description: 'Guerrero que graba runas de gigante en sus armas y armadura',
        features: ['Magia de Runas', 'Forma del Gigante', 'Escudo Rúnico', 'Alma de la Runa', 'Maestría Rúnica'],
        source: "Tasha's Cauldron of Everything",
      },
      'Guerrero Psiónico': {
        description: 'Guerrero que infunde ataques con energía psíquica',
        features: ['Potencia Psiónica', 'Golpe Telequinético', 'Protección Psiónica', 'Teletransporte Psiónico', 'Fuerza Bruta Psiónica'],
        source: "Tasha's Cauldron of Everything",
      },
    },
  },

  // ── MAGO ───────────────────────────────────────────────────────────
  'Mago': {
    hitDie: 6,
    primaryStat: 'INT',
    saves: ['INT', 'SAB'],
    skills: ['Arcanas', 'Historia', 'Intuición', 'Investigación', 'Medicina', 'Religión'],
    numSkills: 2,
    description: 'Estudioso arcano de inmenso poder mágico',
    emoji: '🔮',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 2,
    subclassLabel: 'Tradición Arcana',
    subclasses: {
      'Escuela de la Abjuración': {
        description: 'Especialista en hechizos protectores y de escudos arcanos',
        features: ['Erudito Abjurador', 'Resistencia Arcana', 'Abjuración Proyectada', 'Resistencia Mejorada'],
      },
      'Escuela de la Adivinación': {
        description: 'Vidente que predice el futuro y lee la mente',
        features: ['Presciencia', 'Experto Adivinador', 'El Tercer Ojo', 'Gran Revelación'],
      },
      'Escuela de la Conjuración': {
        description: 'Invocador que transporta criaturas y objetos a su voluntad',
        features: ['Conjurador Experto', 'Conjuración Menor', 'Paso Borroso', 'Paso de Conjuración', 'Conjuración Enfocada'],
      },
      'Escuela de Encantamiento': {
        description: 'Hechicero de la mente que encanta y domina voluntades',
        features: ['Hipnosis', 'Fascinación Instintiva', 'Mente Dividida', 'Alter Memories'],
      },
      'Escuela de Evocación': {
        description: 'Maestro del daño mágico elemental con hechizos explosivos',
        features: ['Escultor de Hechizos', 'Trucos Potenciados', 'Hechizos Potenciados', 'Sobrecargar Evocación'],
      },
      'Escuela de Ilusión': {
        description: 'Maestro del engaño que crea ilusiones indistinguibles',
        features: ['Ilusionista Experto', 'Ilusión Maleable', 'Doble Ilusorio', 'Realidad Ilusoria'],
      },
      'Escuela de Nigromancia': {
        description: 'Maestro de los muertos y la energía negativa',
        features: ['Nigromante Experto', 'Muertos Lúgubres', 'Manipulación Cadavérica', 'Mando sobre los No Muertos'],
      },
      'Escuela de Transmutación': {
        description: 'Maestro del cambio que altera materia y formas',
        features: ['Transmutador Experto', 'Transformación Menor', 'Piedra del Transmutador', 'Señor de las Formas'],
      },
      'Orden de los Escribas': {
        description: 'Mago que da vida a su libro de hechizos con un espíritu arcano',
        features: ['Quill Awakened Spellbook', 'Wizardly Quill', 'Manifest Mind', 'Master Scrivener', 'One with the Word', 'Spellbook Shield'],
        source: "Tasha's Cauldron of Everything",
      },
      'Magia Cronúrgica': {
        description: 'Mago que manipula el tiempo y las probabilidades',
        features: ['Moldeador del Tiempo', 'Aceleración Temporal', 'Bucle Temporal', 'Reversión'],
        source: "Explorer's Guide to Wildemount",
      },
      'Magia Gravitúrgica': {
        description: 'Mago que manipula la gravedad y las fuerzas físicas',
        features: ['Ajuste de Densidad', 'Ola de Gravedad', 'Event Horizon', 'Distorsión Extrema'],
        source: "Explorer's Guide to Wildemount",
      },
    },
  },

  // ── MONJE ──────────────────────────────────────────────────────────
  'Monje': {
    hitDie: 8,
    primaryStat: 'DES/SAB',
    saves: ['FUE', 'DES'],
    skills: ['Acrobacias', 'Atletismo', 'Historia', 'Intuición', 'Religión', 'Sigilo'],
    numSkills: 2,
    description: 'Artista marcial que domina el ki interior',
    emoji: '👊',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 3,
    subclassLabel: 'Tradición Monástica',
    subclasses: {
      'Camino de la Palma': {
        description: 'Maestro del combate desarmado puro con técnicas devastadoras',
        features: ['Técnicas de la Palma', 'Defensa Completa', 'Cuerpo de Agua', 'Golpe Vacío'],
      },
      'Camino de la Sombra': {
        description: 'Ninja que opera en la oscuridad con magia de las sombras',
        features: ['Artes de las Sombras', 'Paso de las Sombras', 'Capa de las Sombras', 'Silencio de las Sombras'],
      },
      'Camino de los Cuatro Elementos': {
        description: 'Monje que canaliza el poder de los cuatro elementos',
        features: ['Disciplinas Elementales', 'Puño de Fuego Desatado', 'Cuerpo de Agua', 'Paso del Viento'],
      },
      'Camino de la Larga Muerte': {
        description: 'Monje que estudia la muerte y extrae energía de ella',
        features: ['Toque de la Larga Muerte', 'Hora de la Muerte', 'Masquerade of Death', 'Toque de la Matanza'],
        source: "Sword Coast Adventurer's Guide",
      },
      'Camino de la Misericordia': {
        description: 'Curandero y asesino que da y quita vida',
        features: ['Manos de Sanación', 'Manos de Daño', 'Médico', 'Golpe de Médula', 'Toque Misericordioso'],
        source: "Tasha's Cauldron of Everything",
      },
      'Camino del Alma de Cobalto': {
        description: 'Monje que hace crecer alas espectrales y domina el control',
        features: ['Regente del Alma', 'Hechizo del Alma', 'Forma del Alma Cobalto', 'Ala de Alma'],
        source: "Explorer's Guide to Wildemount",
      },
      'Camino del Alma del Sol': {
        description: 'Guerrero radiante que dispara rayos de ki solar',
        features: ['Puño Radiante', 'Alma Ardiente', 'Fuego Interior', 'Aniquilación Solar'],
        source: "Xanathar's Guide to Everything",
      },
      'Camino del Dragón Ascendente': {
        description: 'Monje que canaliza el poder dracónico en su ki',
        features: ['Ascendencia Dracónica', 'Aliento Dracónico', 'Alas Dracónicas', 'Aspecto del Dragón'],
        source: "Fizban's Treasury of Dragons",
      },
      'Camino del Kensei': {
        description: 'Maestro armado que convierte sus armas en extensiones del ki',
        features: ['Armas de Kensei', 'Un con la Hoja', 'Destreza Afilada', 'Flujo Certero', 'Ráfaga Afilada'],
        source: "Xanathar's Guide to Everything",
      },
      'Camino del Maestro Borracho': {
        description: 'Monje que imita a un borracho para hacer sus movimientos impredecibles',
        features: ['Bonificación de Ebriedad', 'Postura Tambaleante', 'Postura Inestable', 'Borrachera Intoxicante'],
        source: "Xanathar's Guide to Everything",
      },
      'Camino del Ser Astral': {
        description: 'Proyecta un yo astral gigante alrededor de su cuerpo',
        features: ['Despertar del Ser Astral', 'Brazos del Ser Astral', 'Cuerpo del Ser Astral', 'Iluminación Total'],
        source: "Tasha's Cauldron of Everything",
      },
    },
  },

  // ── PALADÍN ────────────────────────────────────────────────────────
  'Paladín': {
    hitDie: 10,
    primaryStat: 'FUE/CAR',
    saves: ['SAB', 'CAR'],
    skills: ['Atletismo', 'Historia', 'Intuición', 'Intimidación', 'Medicina', 'Persuasión', 'Religión'],
    numSkills: 2,
    description: 'Guerrero sagrado ligado por un juramento divino',
    emoji: '🏛️',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 3,
    subclassLabel: 'Juramento Sagrado',
    subclasses: {
      'Juramento de Devoción': {
        description: 'Paladín clásico de la justicia, el honor y la virtud',
        features: ['Canal: Arma Sagrada', 'Canal: Turno del Profano', 'Aura de Devoción', 'Pureza de Espíritu', 'Santo Nimbo'],
      },
      'Juramento de los Ancestros': {
        description: 'Guardián de la naturaleza y la vida, aliado con el Feywild',
        features: ['Canal: Santuario Natural', 'Canal: Turno de los Profanadores', 'Aura de Valentía', 'Resistencia Elemental', 'Guardián Eterno'],
      },
      'Juramento de la Corona': {
        description: 'Campeón de la civilización y la ley establecida',
        features: ['Canal: Champión Challenge', 'Canal: Turno del Profano', 'Aura del Guardián', 'Edicto Sagrado', 'Exaltación de la Corona'],
        source: "Sword Coast Adventurer's Guide",
      },
      'Juramento de Conquista': {
        description: 'Conquistador implacable que inspira terror y domina a sus enemigos',
        features: ['Canal: Acción Conquistadora', 'Canal: Terror Guiado', 'Aura del Conquistador', 'Presencia Invencible', 'Alma Invencible'],
        source: "Xanathar's Guide to Everything",
      },
      'Juramento de Redención': {
        description: 'Pacifista que convierte a sus enemigos sin necesidad de violencia',
        features: ['Canal: Emissary of Peace', 'Canal: Rebuke the Violent', 'Aura del Guardián', 'Presencia Protectora', 'Emissary of Redemption'],
        source: "Xanathar's Guide to Everything",
      },
      'Juramento de Gloria': {
        description: 'Paladín heroico que busca la gloria legendaria',
        features: ['Canal: Inspiring Smite', 'Canal: Peerless Athlete', 'Aura de Alacrity', 'Glorious Defense', 'Living Legend'],
        source: "Tasha's Cauldron of Everything",
      },
      'Juramento de los Vigilantes': {
        description: 'Cazador de entidades de otros planos que se cuelan en el mundo material',
        features: ['Canal: Abjure the Extraplanar', 'Canal: Watcher\'s Will', 'Aura de Centinela', 'Vigilance', 'Mortal Bulwark'],
        source: "Tasha's Cauldron of Everything",
      },
      'Juramento del Mar Abierto': {
        description: 'Paladín del mar libre que comanda olas y vientos',
        features: ['Canal: Fury of the Tides', 'Canal: Control the Tides', 'Aura of the Depths', 'Stormy Waters', 'Mythic Swashbuckler'],
        source: "Explorer's Guide to Wildemount",
      },
      'Paladín Rompejuramentos': {
        description: 'Paladín caído que rompe su juramento y obtiene poder oscuro',
        features: ['Canal: Control Undead', 'Canal: Dreadful Aspect', 'Aura de Odio', 'Forma Sobrenatural', 'Resistencia Sobrenatural'],
      },
      'Juramento de la Venganza': {
        description: 'Cazador implacable que persigue el mal sin compasión',
        features: ['Canal: Abjure Enemy', 'Canal: Vow of Enmity', 'Perseguidor Implacable', 'Visage of Terror', 'Ángel Vengador'],
      },
    },
  },

  // ── PÍCARO ─────────────────────────────────────────────────────────
  'Pícaro': {
    hitDie: 8,
    primaryStat: 'DES',
    saves: ['DES', 'INT'],
    skills: ['Acrobacias', 'Atletismo', 'Engaño', 'Intuición', 'Intimidación', 'Investigación', 'Percepción', 'Persuasión', 'Prestidigitación', 'Sigilo'],
    numSkills: 4,
    description: 'Especialista en sigilo, engaño y ataques precisos',
    emoji: '🗡️',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 3,
    subclassLabel: 'Arquetipo de Pícaro',
    subclasses: {
      'Ladrón': {
        description: 'El ladrón clásico: ágil, rápido y experto en escalada y trampas',
        features: ['Manos Rápidas', 'Mente de Ladrón', 'Uso de Objetos Mágicos', 'Reflexivos'],
      },
      'Asesino': {
        description: 'Maestro del disfraz y el golpe mortal antes del combate',
        features: ['Bonificación de Habilidades', 'Impostor', 'Muerte Súbita', 'Impostora'],
      },
      'Maestro Arcano': {
        description: 'Pícaro que aprende a lanzar hechizos con sus habilidades ladronescas',
        features: ['Lanzamiento de Hechizos', 'Robo Mágico', 'Versatilidad Arcana', 'Ladrón de Hechizos'],
      },
      'Bribón Arcano': {
        description: 'Embaucador mágico que combina trucos y magia de ilusión',
        features: ['Lanzamiento de Hechizos', 'Mago de las Trampas', 'Distracción Mágica', 'Ladrón de Sortilegios'],
        source: "Tasha's Cauldron of Everything",
      },
      'Inquisitivo': {
        description: 'Detective perspicaz que detecta mentiras y halla debilidades',
        features: ['Ojo Perspicaz', 'Conocimiento Insidioso', 'Oído al Suelo', 'Ojo de la Mente'],
        source: "Xanathar's Guide to Everything",
      },
      'Mente Maestra': {
        description: 'Manipulador social que mueve los hilos desde las sombras',
        features: ['Maestro de las Intrigas', 'Posición de Privilegio', 'Emboscada de Mentes', 'El Maestro Nunca Pierde'],
        source: "Xanathar's Guide to Everything",
      },
      'Acechador de la Penumbra': {
        description: 'Cazador de las sombras que se vuelve invisible en la oscuridad',
        features: ['Magia de Umbra', 'Ojos de la Noche', 'Paso Silencioso', 'Acecho Umbrío'],
        source: "Xanathar's Guide to Everything",
      },
      'Espadachín': {
        description: 'Duelista elegante que protege con su capa y ataca con su espada',
        features: ['Esgrima Elegante', 'Combate Elegante', 'Treta del Duelista', 'Maestría del Espadachín'],
        source: "Xanathar's Guide to Everything",
      },
      'Fantasma': {
        description: 'Agente de la muerte que roba almas y asume identidades de difuntos',
        features: ['Manifestaciones Sobrenaturales', 'Forma Espectral', 'Ghost Walk', 'Death\'s Friend'],
        source: "Tasha's Cauldron of Everything",
      },
      'Danzante del Filo': {
        description: 'Pícaro ágil especializado en dagas y armas cortas',
        features: ['Lluvia de Cuchillas', 'Danza del Filo', 'Maestría del Cuchillo', 'Torbellino de Acero'],
        source: 'Fuente alternativa',
      },
    },
  },

  // ── EXPLORADOR ─────────────────────────────────────────────────────
  'Explorador': {
    hitDie: 10,
    primaryStat: 'DES/SAB',
    saves: ['FUE', 'DES'],
    skills: ['Atletismo', 'Intuición', 'Investigación', 'Naturaleza', 'Percepción', 'Sigilo', 'Supervivencia', 'Trato con animales'],
    numSkills: 3,
    description: 'Rastreador y cazador que domina el mundo natural',
    emoji: '🏹',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 3,
    subclassLabel: 'Conclave de Explorador',
    subclasses: {
      'Cazador': {
        description: 'Especialista en eliminar amenazas concretas con técnicas de caza',
        features: ['Presa del Cazador (Colosso/Depredador/Gigante)', 'Tácticas Defensivas', 'Multiataque', 'Defensa Superior'],
      },
      'Señor de las Bestias': {
        description: 'Forma un vínculo místico con un animal compañero de combate',
        features: ['Compañero Animal', 'Entrenamiento Excepcional', 'Furia Bestial', 'Compartir Hechizos'],
      },
      'Caminante del Horizonte': {
        description: 'Guardián de los portales planares que protege el mundo material',
        features: ['Magia Planar', 'Detector de Portales', 'Aura Sobrenatural', 'Paso Espectral', 'Asalto Distante'],
        source: "Xanathar's Guide to Everything",
      },
      'Asesino de Monstruos': {
        description: 'Especialista en cazar y matar criaturas sobrenaturales poderosas',
        features: ['Ojo del Cazador', 'Defensas Sobrenaturales', 'Defensa contra lo Mágico', 'Matar al Más Poderoso'],
        source: "Xanathar's Guide to Everything",
      },
      'Errante Feérico': {
        description: 'Explorador marcado por el Feywild con poderes de encantamiento',
        features: ['Magia del Errante Feérico', 'Paso Feérico', 'Giro Seductor', 'Velo Feérico'],
        source: "Tasha's Cauldron of Everything",
      },
      'Guardian del Enjambre': {
        description: 'Explorador acompañado por un enjambre de criaturas pequeñas',
        features: ['Espíritu del Enjambre', 'Magia del Enjambre', 'Escudo del Enjambre', 'Tótem del Enjambre'],
        source: "Tasha's Cauldron of Everything",
      },
      'Guardadracos': {
        description: 'Explorador con un vínculo dracónico que crece con él',
        features: ['Esencia Dracónica', 'Compañero Dragón', 'Aliento del Dragón', 'Montura Dragón'],
        source: "Fizban's Treasury of Dragons",
      },
      'Rastreador': {
        description: 'Perseguidor implacable especializado en capturar o eliminar objetivos',
        features: ['Habilidades de Rastreador', 'Trampa Primordial', 'Magia de Rastreador', 'Maestría de la Presa'],
        source: "Tasha's Cauldron of Everything",
      },
    },
  },

  // ── HECHICERO ──────────────────────────────────────────────────────
  'Hechicero': {
    hitDie: 6,
    primaryStat: 'CAR',
    saves: ['CON', 'CAR'],
    skills: ['Arcanas', 'Engaño', 'Intimidación', 'Intuición', 'Persuasión', 'Religión'],
    numSkills: 2,
    description: 'Mago con magia innata en su sangre',
    emoji: '⚡',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 1,
    subclassLabel: 'Origen de Hechicero',
    subclasses: {
      'Sangre Dracónica': {
        description: 'Descendiente de dragones con resistencias y poderes dracónicos',
        features: ['Ascendencia Dracónica', 'Resiliencia Dracónica', 'Afinidad Elemental', 'Alas Dracónicas', 'Presencia Dracónica'],
      },
      'Magia Salvaje': {
        description: 'Magia impredecible y caótica que puede explotar en cualquier momento',
        features: ['Oleada de Magia Salvaje', 'Mente Desvanecida', 'Magia Salvaje Doblegada', 'Agitación Controlada', 'Caos Canalizado'],
      },
      'Alma Divina': {
        description: 'Hechicero con sangre de ángel que puede lanzar hechizos divinos',
        features: ['Ascendencia Divina', 'Alas Etéreas', 'Resistencia Sobrenatural', 'Forma Divina'],
        source: "Xanathar's Guide to Everything",
      },
      'Magia Sombría': {
        description: 'Hechicero marcado por las sombras del más allá',
        features: ['Ojos de la Oscuridad', 'Fortaleza de Sombra', 'Hound of Ill Omen', 'Forma Sombría'],
        source: "Xanathar's Guide to Everything",
      },
      'Hechicería de la Tormenta': {
        description: 'Portador del poder de los mares y las tormentas',
        features: ['Viento Que Habla', 'Magia Ventosa', 'Corazón de la Tormenta', 'Alma de la Tormenta', 'Tormenta Frenética'],
        source: "Xanathar's Guide to Everything",
      },
      'Hechicero Runaestirpe': {
        description: 'Hechicero que extrae poder de runas de gigante en su cuerpo',
        features: ['Cuerpo de Runa', 'Forma del Gigante', 'Magia de la Runa', 'Maestría de la Runa'],
        source: "Tasha's Cauldron of Everything",
      },
      'Mente Aberrante': {
        description: 'Hechicero cuya mente ha sido tocada por entidades del Far Realm',
        features: ['Habilidades Psíquicas', 'Comunicación Telépata', 'Revelación del Intelecto', 'Cuerpo Aberrante', 'Ojos del Observador Oscuro'],
        source: "Tasha's Cauldron of Everything",
      },
      'Alma Mecánica': {
        description: 'Hechicero cuyo poder proviene de un plano de pura ley y orden',
        features: ['Magia de Orden', 'Bastion of Law', 'Restore Balance', 'Trance of Order', 'Clockwork Cavalcade'],
        source: "Tasha's Cauldron of Everything",
      },
      'Hechicero de la Luna': {
        description: 'Hechicero cuyo poder está ligado a los ciclos lunares',
        features: ['Magia Lunar', 'Forma Lunar', 'Poder de la Luna', 'Luna Llena'],
        source: 'Fuente alternativa',
      },
    },
  },

  // ── BRUJO ──────────────────────────────────────────────────────────
  'Brujo': {
    hitDie: 8,
    primaryStat: 'CAR',
    saves: ['SAB', 'CAR'],
    skills: ['Arcanas', 'Engaño', 'Historia', 'Intimidación', 'Investigación', 'Naturaleza', 'Religión'],
    numSkills: 2,
    description: 'Receptor de poderes de un patrón sobrenatural',
    emoji: '🕯️',
    source: 'Manual del Jugador + expansiones',
    subclassLevel: 1,
    subclassLabel: 'Patrón Sobrenatural',
    subclasses: {
      'El Archidemonio': {
        description: 'Sirve a un poderoso lord del infierno con magia infernal de fuego',
        features: ['Expansión de las Llamas', 'Hoja del Fuego Oscuro', 'Resistencia del Averno', 'Impulso Infernal', 'Visión del Averno'],
      },
      'El Gran Anciano': {
        description: 'Sirve a una entidad cósmica incomprensible del Far Realm',
        features: ['Telepatía Ampliada', 'Mente Despierta', 'Conocimiento Entrópico', 'Creación del Vacío'],
      },
      'La Archifada': {
        description: 'Sirve a un poderoso ser del Feywild lleno de magia y engaño',
        features: ['Presencia del Feywild', 'Habla de las Bestias y la Hoja', 'Barrera de Harapos', 'Ser Oscuro', 'Alma del Bosque Oscuro'],
      },
      'El Hexblade': {
        description: 'Sirve a una entidad misteriosa del Plano de las Sombras que habita en armas',
        features: ['Maldición del Hexblade', 'Dominio del Hexblade', 'Escudo del Hexblade', 'Careta de la Agresión', 'Master of Hexes'],
        source: "Xanathar's Guide to Everything",
      },
      'El Celestial': {
        description: 'Sirve a un ser de luz sagrada: ángel, fénix o similar',
        features: ['Lista de Conjuros Expandida', 'Curación al Guardar', 'Fuente de Luz', 'Guía Celestial', 'Forma Celestial'],
        source: "Xanathar's Guide to Everything",
      },
      'El No Muerto': {
        description: 'Sirve a un señor no muerto poderoso como un liche o vampiro',
        features: ['Forma del No Muerto', 'Aniquilar la Vida', 'Toca del Monstruo', 'Indestructible'],
        source: "Van Richten's Guide to Ravenloft",
      },
      'El Genio': {
        description: 'Sirve a un poderoso genio elemental (dao, djinn, efreet o marid)',
        features: ['Jarrón del Genio', 'Sabiduría Elemental', 'Forma del Genio', 'Ser del Genio'],
        source: "Tasha's Cauldron of Everything",
      },
      'El Insondable': {
        description: 'Sirve a una entidad profunda del océano o del abismo acuático',
        features: ['Guardia del Tentáculo', 'Voluntad del Insondable', 'Escudo del Tentáculo', 'Ascenso del Insondable'],
        source: "Tasha's Cauldron of Everything",
      },
      'El Primigenio': {
        description: 'Sirve a un espíritu primordial elemental de la tierra, el fuego, el aire o el agua',
        features: ['Expansión Elemental', 'Pasos del Primigenio', 'Impacto del Primigenio', 'Resistencia Elemental'],
        source: "Tasha's Cauldron of Everything",
      },
      'El Infernal (Patrón Alterno)': {
        description: 'Variante del Archidemonio centrada en el control y el miedo',
        features: ['Lengua Infernal', 'Bendición Infernal', 'Influencia Infernal', 'Forma Infernal'],
        source: 'Fuente alternativa',
      },
      'El Archi Feérico (Reinos)': {
        description: 'Variante feérica de gran poder con magia de encantamiento profundo',
        features: ['Encantamiento Profundo', 'Voluntad del Feywild', 'Aura Feérica', 'Señor del Feywild'],
        source: 'Fuente alternativa',
      },
    },
  },

};

// ── GRUPOS DE SUBCLASES POR MECÁNICA ──────────────────────────────────
const SUBCLASS_GROUPS = {
  'Artificiero':  'Especializaciones',
  'Bárbaro':      'Sendas Primarias',
  'Bardo':        'Colegios Bárdicos',
  'Clérigo':      'Dominios Divinos',
  'Druida':       'Círculos Druídicos',
  'Guerrero':     'Arquetipos Marciales',
  'Mago':         'Tradiciones Arcanas',
  'Monje':        'Tradiciones Monásticas',
  'Paladín':      'Juramentos Sagrados',
  'Pícaro':       'Arquetipos de Pícaro',
  'Explorador':   'Conclaves de Explorador',
  'Hechicero':    'Orígenes de Hechicero',
  'Brujo':        'Patrones Sobrenaturales',
};

module.exports = { CLASSES, SUBCLASS_GROUPS };
