// ══════════════════════════════════════════════════════════════════════
//  DOTES D&D 5e — Extraído de Dotes_433-459.pdf
//  Fuentes: Manual del Jugador, Tasha's CoE, Xanathar's GtE,
//           Fizban's ToD, Book of Many Things, Tal'Dorei CSR
// ══════════════════════════════════════════════════════════════════════

const DOTES = [
  // ════════════════════════════════════════════
  //  MANUAL DEL JUGADOR + TASHA'S (GENERALES)
  // ════════════════════════════════════════════
  {
    nombre: 'Acechador',
    fuente: 'MdJ',
    requisito: 'DES 13 o superior',
    descripcion: 'Experto en ocultarse en las sombras. Puedes esconderte en penumbra, fallar ataques a distancia sin revelar posición, y la luz tenue no penaliza tus pruebas de Percepción basadas en la vista.',
  },
  {
    nombre: 'Actor',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'CAR +1 (máx 20). Ventaja en Carisma (Engañar) e (Interpretar) para hacerte pasar por otro. Puedes imitar voces y sonidos de criaturas.',
  },
  {
    nombre: 'Adepto de lo Oculto',
    fuente: 'Tasha',
    requisito: 'Lanzamiento de hechizos o Magia de pacto',
    descripcion: 'Aprendes una Invocación sobrenatural de brujo. Puedes reemplazarla al subir nivel.',
  },
  {
    nombre: 'Adepto Elemental',
    fuente: 'MdJ',
    requisito: 'Capacidad de lanzar al menos un conjuro',
    descripcion: 'Elige un tipo de daño (ácido, frío, fuego, relámpago o trueno). Tus conjuros ignoran la resistencia a ese daño y tratas los 1 en dados de daño como 2. Puede cogerse múltiples veces para tipos distintos.',
  },
  {
    nombre: 'Adepto Marcial',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Aprendes 2 maniobras de Maestro de Batalla. Ganas 1 dado de superioridad d6 (o uno adicional si ya tenías). Se recupera en descanso corto o largo.',
  },
  {
    nombre: 'Adepto Metamágico',
    fuente: 'Tasha',
    requisito: 'Lanzador de hechizos o Magia de Pacto',
    descripcion: 'Aprendes 2 opciones de Metamagia de hechicero. Ganas 2 puntos de hechicería para metamagia. Se recuperan en descanso largo.',
  },
  {
    nombre: 'Afortunado',
    fuente: 'MdJ',
    requisito: null,
    descripcion: '3 puntos de suerte. En tiradas de ataque, habilidad o salvación puedes gastar 1 punto para tirar un d20 adicional y elegir cuál usar. También usable contra ataques recibidos. Se recuperan en descanso largo.',
  },
  {
    nombre: 'Ágil',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Velocidad +10 pies. El terreno difícil no te cuesta movimiento extra al Cargar. Los ataques cuerpo a cuerpo no provocan ataques de oportunidad de ese objetivo por el resto del turno.',
  },
  {
    nombre: 'Alborotador de Taberna',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'FUE o CON +1 (máx 20). Competencia con armas improvisadas y golpes sin armas. El puñetazo usa d4. Al golpear con golpe sin armas o arma improvisada puedes usar acción adicional para intentar agarrar.',
  },
  {
    nombre: 'Alerta',
    fuente: 'MdJ',
    requisito: null,
    descripcion: '+5 a la iniciativa. No puedes ser sorprendido mientras estés consciente. Los enemigos ocultos no tienen ventaja en ataques contra ti.',
  },
  {
    nombre: 'Apresador',
    fuente: 'MdJ',
    requisito: 'FUE 13 o superior',
    descripcion: 'Ventaja en ataques contra criaturas que tengas apresadas. Puedes inmovilizar una criatura apresada con acción. Las criaturas un tamaño mayor que tú no se liberan automáticamente.',
  },
  {
    nombre: 'Artillero',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'DES +1 (máx 20). Competencia con armas de fuego. Ignoras la propiedad Carga en armas de fuego. Estar a 5 pies de enemigos no penaliza tus ataques a distancia.',
  },
  {
    nombre: 'Artificiero Iniciado',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'Aprendes un truco y un conjuro de nivel 1 de artificiero (INT). Puedes lanzar el conjuro nivel 1 sin espacio una vez por descanso largo. Competencia con una herramienta de artesano a elegir.',
  },
  {
    nombre: 'Asesino de Magos',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Reacción para atacar cuerpo a cuerpo cuando alguien en 5 pies lanza un conjuro. Desventaja en concentración al dañar a un lanzador concentrado. Ventaja en TS contra hechizos de criaturas a 5 pies.',
  },
  {
    nombre: 'Atacante Salvaje',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Una vez por turno al hacer daño con un arma cuerpo a cuerpo, puedes volver a tirar los dados de daño y usar cualquiera de los dos resultados.',
  },
  {
    nombre: 'Atleta',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'FUE o DES +1 (máx 20). Levantarte cuesta solo 5 pies. Escalar no reduce velocidad. Salto corriendo tras solo 5 pies de movimiento.',
  },
  {
    nombre: 'Cargar',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Al usar Carrera puedes usar acción adicional para atacar cuerpo a cuerpo o empujar. Si te moviste 10 pies en línea recta antes: +5 daño al ataque o empuja 10 pies.',
  },
  {
    nombre: 'Centinela',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Al golpear con ataque de oportunidad, la velocidad de la criatura se reduce a 0. Las criaturas en 5 pies provocan AO incluso al Retirarse. Reacción para atacar a criaturas que ataquen a otros.',
  },
  {
    nombre: 'Chef',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'CON o SAB +1 (máx 20). Competencia con utensilios de cocina. En descanso corto cocinas para 4+bonComp criaturas que recuperan 1d8 PG extra. En descanso largo creas golosinas que dan PG temporales.',
  },
  {
    nombre: 'Combatiente Montado',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Montado: ventaja en ataques cuerpo a cuerpo contra criaturas sin montura más pequeñas. Puedes redirigir ataques a tu montura hacia ti. Tu montura puede no recibir daño en TS exitosa contra efectos de área.',
  },
  {
    nombre: 'Conjurador de Guerra',
    fuente: 'MdJ',
    requisito: 'Capacidad de lanzar al menos un conjuro',
    descripcion: 'Ventaja en TS de CON para mantener concentración. Puedes realizar componentes somáticos con armas/escudo en manos. Reacción para lanzar conjuro en lugar de ataque de oportunidad.',
  },
  {
    nombre: 'Desgarrador',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'FUE o DES +1 (máx 20). Una vez por turno al golpear con daño cortante, reduces velocidad del objetivo en 10 pies hasta tu próximo turno. Golpe crítico cortante: objetivo con desventaja en ataques hasta tu próximo turno.',
  },
  {
    nombre: 'Destructor',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'FUE o CON +1 (máx 20). Una vez por turno al golpear con daño contundente puedes mover al objetivo 5 pies a espacio desocupado. Golpe crítico contundente: los ataques contra esa criatura tienen ventaja hasta tu próximo turno.',
  },
  {
    nombre: 'Duelista Defensivo',
    fuente: 'MdJ',
    requisito: 'DES 13 o superior',
    descripcion: 'Al ser golpeado con arma sutil que empuñas con competencia, usas reacción para añadir tu bonificador de competencia a la CA contra ese ataque, pudiendo hacer que falle.',
  },
  {
    nombre: 'Duro',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'CON +1 (máx 20). Al tirar un dado de golpe para recuperar PG, el mínimo es 2x modificador de CON.',
  },
  {
    nombre: 'Envenenador',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'Ignoras resistencia a daño por veneno. Aplicas venenos como acción adicional. Competencia con kit de envenenador. Con 1 hora y 50 po creas dosis de veneno (CD 14, 2d8 veneno y envenenado).',
  },
  {
    nombre: 'Experto en Armadura Media',
    fuente: 'MdJ',
    requisito: 'Competencia con armadura media',
    descripcion: 'La armadura media no te da desventaja en Sigilo. Con DES 16+, añades 3 a la CA en lugar de 2.',
  },
  {
    nombre: 'Experto en Armadura Pesada',
    fuente: 'MdJ',
    requisito: 'Competencia con armadura pesada',
    descripcion: 'FUE +1 (máx 20). Con armadura pesada, el daño contundente, perforante y cortante de armas no mágicas se reduce en 3.',
  },
  {
    nombre: 'Experto en Armas',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'FUE o DES +1 (máx 20). Ganas competencia con 4 armas a tu elección.',
  },
  {
    nombre: 'Experto en Armas de Asta',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Al atacar solo con guja, alabarda o bastón, usas acción adicional para atacar con el extremo opuesto (1d4 contundente). Mientras sostienes esas armas, las criaturas que entren a tu alcance provocan AO.',
  },
  {
    nombre: 'Experto en Ballestas',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Ignoras Carga en ballestas con competencia. Estar a 5 pies de un enemigo no penaliza ataques a distancia. Al atacar con arma de mano puedes usar acción adicional para atacar con ballesta de mano cargada.',
  },
  {
    nombre: 'Experto en Escudos',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Acción adicional para empujar con escudo. Con escudo añades su CA a TS de DES contra efectos dirigidos solo a ti. Reacción para no recibir daño si tienes éxito en la TS (efecto de daño reducido).',
  },
  {
    nombre: 'Experto en Varias Habilidades',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'Una característica +1 (máx 20). Competencia en una habilidad a elegir. Pericia en una habilidad en la que ya tengas competencia (sin otra fuente que doble el bonificador).',
  },
  {
    nombre: 'Explorador de Mazmorras',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Ventaja en Percepción e Investigación para detectar puertas ocultas. Ventaja en TS contra trampas. Resistencia al daño de trampas. Puedes buscar trampas a velocidad normal.',
  },
  {
    nombre: 'Francotirador',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Atacar a larga distancia no da desventaja. Tus disparos ignoran cobertura media y 3/4. Opción de -5 a la tirada de ataque para +10 de daño.',
  },
  {
    nombre: 'Francotirador de Conjuros',
    fuente: 'MdJ',
    requisito: 'Capacidad de lanzar al menos un conjuro',
    descripcion: 'El alcance de conjuros de ataque se dobla. Tus conjuros a distancia ignoran cobertura media y 3/4. Aprendes un truco de ataque a elección.',
  },
  {
    nombre: 'Fuertemente Acorazado',
    fuente: 'MdJ',
    requisito: 'Competencia con armadura media',
    descripcion: 'FUE +1 (máx 20). Ganas competencia con armadura pesada.',
  },
  {
    nombre: 'Gran Experto en Armas',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Golpe crítico o reducir a 0 PG con arma cuerpo a cuerpo: ataque adicional como acción adicional. Opción de -5 a la tirada de ataque con arma pesada para +10 de daño.',
  },
  {
    nombre: 'Habilidoso',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Ganas competencia en cualquier combinación de 3 habilidades o herramientas a tu elección.',
  },
  {
    nombre: 'Iniciado en la Lucha',
    fuente: 'Tasha',
    requisito: 'Competencia con un arma marcial',
    descripcion: 'Aprendes un estilo de combate de guerrero a tu elección. Debe ser diferente a los que ya tengas. Puedes reemplazarlo al subir nivel.',
  },
  {
    nombre: 'Iniciado en la Magia',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Elige una clase (bardo, brujo, clérigo, druida, hechicero o mago). Aprendes 2 trucos y 1 conjuro de nivel 1 de esa lista. El hechizo puede lanzarse una vez por descanso largo.',
  },
  {
    nombre: 'Líder Inspirador',
    fuente: 'MdJ',
    requisito: 'CAR 13 o superior',
    descripcion: '10 minutos de discurso: hasta 6 criaturas amigas en 30 pies ganan PG temporales = tu nivel + modificador de CAR. Repetible tras descanso corto o largo.',
  },
  {
    nombre: 'Ligeramente Acorazado',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'FUE o DES +1 (máx 20). Ganas competencia con armadura ligera.',
  },
  {
    nombre: 'Lingüista',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'INT +1 (máx 20). Aprendes 3 idiomas a tu elección. Puedes crear escritura cifrada (CD = INT + bonComp para descifrarla).',
  },
  {
    nombre: 'Luchador con Dos Armas',
    fuente: 'MdJ',
    requisito: null,
    descripcion: '+1 CA al empuñar un arma en cada mano. Puedes usar lucha con dos armas con armas que no sean ligeras. Puedes desenfundar/enfundar dos armas de una mano donde normalmente solo una.',
  },
  {
    nombre: 'Mente Aguda',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'INT +1 (máx 20). Siempre sabes dónde está el norte. Siempre sabes horas hasta amanecer/anochecer. Recuerdas con precisión todo lo visto u oído en el último mes.',
  },
  {
    nombre: 'Moderadamente Acorazado',
    fuente: 'MdJ',
    requisito: 'Competencia con armadura ligera',
    descripcion: 'FUE o DES +1 (máx 20). Ganas competencia con armadura media y escudos.',
  },
  {
    nombre: 'Observador',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'INT o SAB +1 (máx 20). Puedes leer los labios si ves hablar a una criatura en un idioma que conozcas. +5 a tus puntuaciones pasivas de Percepción e Investigación.',
  },
  {
    nombre: 'Perforador',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'FUE o DES +1 (máx 20). Una vez por turno al golpear con daño perforante, vuelves a tirar un dado de daño y usas la nueva tirada. Golpe crítico perforante: tiras un dado de daño adicional.',
  },
  {
    nombre: 'Resistente',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Elige una característica: +1 en esa característica (máx 20) y competencia en tiradas de salvación con esa característica.',
  },
  {
    nombre: 'Ritualista',
    fuente: 'MdJ',
    requisito: 'INT o SAB 13 o superior',
    descripcion: 'Obtienes un libro de rituales con 2 conjuros rituales de nivel 1 de una clase a elegir. Puedes añadir más rituales al libro. Solo se lanzan como rituales.',
  },
  {
    nombre: 'Sanador',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Al estabilizar con kit de sanador, la criatura recupera 1 PG. Como acción, gastas un uso del kit para restaurar 1d6+4 PG + tantos PG como Dados de Golpe máximos tenga la criatura. Una vez por descanso.',
  },
  {
    nombre: 'Telepatía',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'INT, SAB o CAR +1 (máx 20). Hablas telepáticamente con criaturas que veas en 60 pies (en un idioma que ambos conozcáis). Puedes lanzar Detectar Pensamientos sin espacio una vez por descanso largo.',
  },
  {
    nombre: 'Telequinético',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'INT, SAB o CAR +1 (máx 20). Aprendes Mano del Mago (invisible, sin componentes). Acción adicional: empujas telequinéticamente a una criatura en 30 pies (TS FUE o mueve 5 pies).',
  },
  {
    nombre: 'Tocado por lo Desconocido',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'INT, SAB o CAR +1 (máx 20). Aprendes Paso Brumoso y un conjuro de nivel 1 (Adivinación o Encantamiento). Cada uno puede lanzarse sin espacio una vez por descanso largo.',
  },
  {
    nombre: 'Tocado por las Sombras',
    fuente: 'Tasha',
    requisito: null,
    descripcion: 'INT, SAB o CAR +1 (máx 20). Aprendes Invisibilidad y un conjuro de nivel 1 (Ilusión o Nigromancia). Cada uno puede lanzarse sin espacio una vez por descanso largo.',
  },
  {
    nombre: 'Vigoroso',
    fuente: 'MdJ',
    requisito: null,
    descripcion: 'Tus PG máximos aumentan en 2x tu nivel actual. Cada nivel adicional añade 2 PG máximos más.',
  },

  // ════════════════════════════════════════════
  //  XANATHAR'S — DOTES RACIALES
  // ════════════════════════════════════════════
  {
    nombre: 'Constitución Infernal',
    fuente: 'Xanathar',
    requisito: 'Tiefling',
    descripcion: 'CON +1 (máx 20). Resistencia al daño por frío y veneno. Ventaja en TS contra ser envenenado.',
  },
  {
    nombre: 'Desvanecerse',
    fuente: 'Xanathar',
    requisito: 'Gnomo',
    descripcion: 'DES o INT +1 (máx 20). Al recibir daño, reacción para volverte invisible hasta el final de tu siguiente turno (hasta que ataques, dañes o fuerces una TS). Una vez por descanso corto o largo.',
  },
  {
    nombre: 'Elasticidad a Gachas',
    fuente: 'Xanathar',
    requisito: 'Enano o raza Pequeña',
    descripcion: 'FUE o DES +1 (máx 20). Velocidad +5 pies. Competencia en Acrobacia o Atletismo. Ventaja en pruebas para escapar de agarres.',
  },
  {
    nombre: 'Fortaleza Enana',
    fuente: 'Xanathar',
    requisito: 'Enano',
    descripcion: 'CON +1 (máx 20). Al usar Esquivar en combate, puedes gastar un Dado de Golpe para curarte (1d[DG] + mod CON PG).',
  },
  {
    nombre: 'Furia Orca',
    fuente: 'Xanathar',
    requisito: 'Semiorco',
    descripcion: 'FUE o CON +1 (máx 20). Una vez por descanso corto o largo: al golpear con arma, tiras un dado de daño adicional del arma. Al usar Resiliencia Incansable, reacción para atacar con un arma.',
  },
  {
    nombre: 'Llamas de Flegetos',
    fuente: 'Xanathar',
    requisito: 'Tiefling',
    descripcion: 'INT o CAR +1 (máx 20). Al tirar daño de fuego por un conjuro, repites los 1 (debes usar el nuevo resultado). Al lanzar conjuro de fuego, puedes envolverte en llamas (1d4 fuego a atacantes en 5 pies hasta fin de tu siguiente turno).',
  },
  {
    nombre: 'Magia Alta de Drow',
    fuente: 'Xanathar',
    requisito: 'Elfo (drow)',
    descripcion: 'Aprendes Detectar magia (a voluntad, sin espacio). Aprendes Levitar y Disipar magia (cada uno 1 vez por descanso largo sin espacio). CAR es tu característica de lanzamiento.',
  },
  {
    nombre: 'Magia de Elfo del Bosque',
    fuente: 'Xanathar',
    requisito: 'Elfo (bosque)',
    descripcion: 'Aprendes un truco de druida. Aprendes Zancada prodigiosa y Pasar sin rastro (cada uno 1 vez por descanso largo sin espacio). SAB es tu característica de lanzamiento.',
  },
  {
    nombre: 'Piel de Dragón',
    fuente: 'Xanathar',
    requisito: 'Dracónido',
    descripcion: 'FUE, CON o CAR +1 (máx 20). Sin armadura, CA = 13 + DES (puedes usar escudo). Crecen garras retráctiles que hacen 1d4 + FUE cortante en lugar del daño normal de golpe sin armas.',
  },
  {
    nombre: 'Precisión Élfica',
    fuente: 'Xanathar',
    requisito: 'Elfo o Semielfo',
    descripcion: 'DES, INT, SAB o CAR +1 (máx 20). Cuando tengas ventaja en una tirada de ataque con esa característica, puedes volver a tirar uno de los dados.',
  },
  {
    nombre: 'Prodigio',
    fuente: 'Xanathar',
    requisito: 'Semielfo, Semiorco o Humano',
    descripcion: 'Competencia en una habilidad, una herramienta y fluidez en un idioma a tu elección. Pericia en una habilidad con competencia previa.',
  },
  {
    nombre: 'Segunda Oportunidad',
    fuente: 'Xanathar',
    requisito: 'Mediano',
    descripcion: 'DES, CON o CAR +1 (máx 20). Al ser golpeado por una tirada de ataque, reacción para forzar a relanzar al atacante. Una vez por inicio de combate o descanso corto/largo.',
  },
  {
    nombre: 'Suerte Abundante',
    fuente: 'Xanathar',
    requisito: 'Mediano',
    descripcion: 'Al ver a un aliado en 30 pies sacar un 1 en d20 para ataque, habilidad o TS, reacción para que relance el dado. No puedes usar tu rasgo racial Afortunado hasta el final de tu próximo turno.',
  },
  {
    nombre: 'Teletransportación Feérica',
    fuente: 'Xanathar',
    requisito: 'Elfo (alto)',
    descripcion: 'INT o CAR +1 (máx 20). Aprendes Silvano. Aprendes Paso brumoso (1 vez por descanso corto o largo sin espacio). INT es tu característica de lanzamiento.',
  },
  {
    nombre: 'Temor al Dragón',
    fuente: 'Xanathar',
    requisito: 'Dracónido',
    descripcion: 'FUE, CON o CAR +1 (máx 20). Gastas un uso de Ataque de Aliento para rugir: criaturas en 30 pies hacen TS SAB (CD 8 + bonComp + CAR) o quedan asustadas 1 minuto.',
  },

  // ════════════════════════════════════════════
  //  FIZBAN'S TREASURY OF DRAGONS
  // ════════════════════════════════════════════
  {
    nombre: 'Bendición del Dragón Cromático',
    fuente: "Fizban's",
    requisito: null,
    descripcion: 'Infusión cromática: acción adicional para infundir un arma con tipo de daño elemental (1d4 extra) durante 1 minuto. Resistencia reactiva: reacción para ganar resistencia al daño elemental recibido (bonComp usos por descanso largo).',
  },
  {
    nombre: 'Bendición del Dragón Gemático',
    fuente: "Fizban's",
    requisito: null,
    descripcion: 'INT, SAB o CAR +1 (máx 20). Represalia telequinética: al recibir daño de criatura en 10 pies, reacción para empujar al atacante 10 pies (2d8 daño de fuerza; TS FUE para mitad). bonComp usos por descanso largo.',
  },
  {
    nombre: 'Bendición del Dragón Metálico',
    fuente: "Fizban's",
    requisito: null,
    descripcion: 'Sanación dracónica: aprendes Curar heridas (1 vez sin espacio por descanso largo). Alas protectoras: reacción para dar bonificador a la CA de un objetivo en 5 pies igual al bonComp. bonComp usos por descanso largo.',
  },

  // ════════════════════════════════════════════
  //  BOOK OF MANY THINGS
  // ════════════════════════════════════════════
  {
    nombre: 'Cartomágico',
    fuente: 'Book of Many Things',
    requisito: 'Nivel 4+, lanzador de conjuros o Magia de pacto',
    descripcion: 'Usas una baraja como foco de conjuros. Aprendes Prestidigitación (puede ocultar componentes como manejo de cartas). As Oculto: en descanso largo imbuyes un conjuro de tu lista en una carta (1 acción para lanzarlo con acción adicional por 8 horas).',
  },

  // ════════════════════════════════════════════
  //  TAL'DOREI CAMPAIGN SETTING REBORN
  // ════════════════════════════════════════════
  {
    nombre: 'Conflujo Místico',
    fuente: "Tal'Dorei",
    requisito: null,
    descripcion: 'Puedes sintonizarte con hasta 4 objetos mágicos a la vez. Puedes lanzar Identificar sin espacio ni componentes una vez por descanso largo.',
  },
  {
    nombre: 'Cruel',
    fuente: "Tal'Dorei",
    requisito: null,
    descripcion: 'Tienes dados de crueldad (d6) igual a tu bonComp. Una vez por turno: al dañar, gasta uno para infligir ese daño adicional; en golpe crítico, gana PG temporales iguales a la tirada; en Intimidación, añade la tirada. Se recuperan en descanso largo.',
  },
  {
    nombre: 'Generahechizos',
    fuente: "Tal'Dorei",
    requisito: 'Nivel 11+, lanzador de conjuros o Magia de pacto',
    descripcion: 'Al usar acción adicional para lanzar conjuro de nivel 1+, también puedes usar tu acción para lanzar otro conjuro de nivel 1+. Si lanzas 2+ conjuros en un turno, solo uno puede ser de nivel 3+.',
  },
  {
    nombre: 'Maestro del Lanzamiento de Armas',
    fuente: "Tal'Dorei",
    requisito: null,
    descripcion: 'FUE o DES +1 (máx 20). Todas las armas cuerpo a cuerpo ganan la propiedad Arrojadiza. Las armas arrojadizas existentes aumentan su alcance corto en 20 pies y largo en 40 pies. Las armas ligeras falladas regresan a tu mano al final del turno.',
  },
  {
    nombre: 'Recuerdo Rápido',
    fuente: "Tal'Dorei",
    requisito: 'Lanzador de conjuros que prepare conjuros',
    descripcion: 'Como acción adicional preparas un conjuro no preparado de nivel 1+ (reemplaza uno de igual o mayor nivel preparado). Una vez por descanso corto o largo.',
  },
  {
    nombre: 'Recuperación Notable',
    fuente: "Tal'Dorei",
    requisito: null,
    descripcion: 'CON +1 (máx 20). Al estabilizarte en TS contra muerte, recuperas PG = modificador CON (mínimo 1). Cada vez que recuperas PG de conjuro, poción o rasgo de clase, ganas PG adicionales = modificador CON (mínimo 1).',
  },
  {
    nombre: 'Sacrificio Vital',
    fuente: "Tal'Dorei",
    requisito: null,
    descripcion: 'Acción adicional: recibes 1d6 daño necrótico para ganar una bendición de sangre (1 hora). Gastas la bendición para: +1d6 a tirada de ataque, o +2d6 daño necrótico al impactar, o -1d4 a TS de FUE/DES/CON de un objetivo.',
  },
];

// ── Índice por nombre para búsqueda rápida ──
const DOTES_INDEX = Object.fromEntries(DOTES.map(d => [d.nombre.toLowerCase(), d]));

// ── Listas para autocomplete ──
const DOTES_NOMBRES = DOTES.map(d => d.nombre);

// ── Agrupado por fuente ──
const DOTES_POR_FUENTE = DOTES.reduce((acc, d) => {
  if (!acc[d.fuente]) acc[d.fuente] = [];
  acc[d.fuente].push(d.nombre);
  return acc;
}, {});

module.exports = { DOTES, DOTES_INDEX, DOTES_NOMBRES, DOTES_POR_FUENTE };
