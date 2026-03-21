// ── deploy-commands.js ────────────────────────────────────────────────────────
// Registra los slash commands en Discord. Ejecutar UNA SOLA VEZ (o al cambiar comandos):
//   node deploy-commands.js

require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  // ── CREACIÓN ────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('crear-personaje')
    .setDescription('Inicia el asistente interactivo de creación de personaje D&D 5e'),

  // ── DADOS ───────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('tirada')
    .setDescription('Tira dados al estilo D&D')
    .addStringOption(o => o
      .setName('dados')
      .setDescription('Notación de dados: 2d6+3 | 4d6kh3 | 1d20')
      .setRequired(false))
    .addStringOption(o => o
      .setName('modificador')
      .setDescription('Ventaja o desventaja')
      .setRequired(false)
      .addChoices(
        { name: 'Ventaja',     value: 'ventaja' },
        { name: 'Desventaja',  value: 'desventaja' },
      )),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Tira las 6 estadísticas de D&D con método 4d6 drop lowest'),

  new SlashCommandBuilder()
    .setName('stats-custom')
    .setDescription('Tira estadísticas con dados y método personalizados')
    .addIntegerOption(o => o
      .setName('dados')
      .setDescription('Dados por tirada (default: 4)')
      .setMinValue(1).setMaxValue(20).setRequired(false))
    .addIntegerOption(o => o
      .setName('lados')
      .setDescription('Lados del dado (default: 6)')
      .setMinValue(2).setMaxValue(100).setRequired(false))
    .addIntegerOption(o => o
      .setName('descartar')
      .setDescription('Cuántos dados bajos descartar (default: 1)')
      .setMinValue(0).setMaxValue(19).setRequired(false))
    .addIntegerOption(o => o
      .setName('cantidad')
      .setDescription('Cuántas estadísticas tirar (default: 6)')
      .setMinValue(1).setMaxValue(12).setRequired(false)),

  // ── RAZAS ───────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('razas')
    .setDescription('Lista todas las razas disponibles'),

  new SlashCommandBuilder()
    .setName('raza')
    .setDescription('Muestra los detalles de una raza específica')
    .addStringOption(o => o
      .setName('nombre')
      .setDescription('Nombre de la raza (ej: Elfo, Tiefling, Tabaxi)')
      .setRequired(true)
      .setAutocomplete(true)),

  // ── CLASES ──────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('clase')
    .setDescription('Muestra los detalles de una clase')
    .addStringOption(o => o
      .setName('nombre')
      .setDescription('Nombre de la clase (ej: Mago, Bárbaro, Paladín)')
      .setRequired(true)
      .setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('subclase')
    .setDescription('Muestra los detalles de una subclase específica')
    .addStringOption(o => o
      .setName('nombre')
      .setDescription('Nombre de la subclase (ej: Campeón, Berserker)')
      .setRequired(true)
      .setAutocomplete(true)),

  // ── TRASFONDOS ──────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('trasfondos')
    .setDescription('Lista todos los trasfondos disponibles'),

  new SlashCommandBuilder()
    .setName('trasfondo')
    .setDescription('Muestra los detalles de un trasfondo')
    .addStringOption(o => o
      .setName('nombre')
      .setDescription('Nombre del trasfondo (ej: Soldado, Noble, Criminal)')
      .setRequired(true)
      .setAutocomplete(true)),

  // ── DOTES ───────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('dotes')
    .setDescription('Lista todas las dotes disponibles')
    .addStringOption(o => o
      .setName('fuente')
      .setDescription('Filtrar por fuente (opcional)')
      .setRequired(false)
      .addChoices(
        { name: 'Manual del Jugador',                 value: 'Manual del Jugador' },
        { name: "Tasha's Cauldron of Everything",     value: "Tasha's Cauldron of Everything" },
        { name: "Xanathar's Guide to Everything",     value: "Xanathar's Guide to Everything" },
        { name: "Fizban's Treasury of Dragons",       value: "Fizban's Treasury of Dragons" },
        { name: 'The Book of Many Things',            value: 'The Book of Many Things' },
        { name: "Tal'Dorei Campaign Setting Reborn",  value: "Tal'Dorei Campaign Setting Reborn" },
      )),

  new SlashCommandBuilder()
    .setName('dote')
    .setDescription('Muestra los detalles de una dote')
    .addStringOption(o => o
      .setName('nombre')
      .setDescription('Nombre de la dote (ej: Afortunado, Centinela, Actor)')
      .setRequired(true)
      .setAutocomplete(true)),

  // ── EQUIPO ──────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('arma')
    .setDescription('Muestra los detalles de un arma')
    .addStringOption(o => o
      .setName('nombre')
      .setDescription('Nombre del arma (ej: Espada Larga, Arco Largo)')
      .setRequired(true)
      .setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('armadura')
    .setDescription('Muestra los detalles de una armadura')
    .addStringOption(o => o
      .setName('nombre')
      .setDescription('Nombre de la armadura (ej: Placas, Cuero Tachonado)')
      .setRequired(true)
      .setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('equipo')
    .setDescription('Muestra el equipo aventurero y kits de inicio'),

  // ── OBJETOS MÁGICOS ─────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('canjear-ticket')
    .setDescription('Canjear un ticket de arma única o dorada de tu inventario'),

  new SlashCommandBuilder()
    .setName('mi-magia')
    .setDescription('Ver tus objetos mágicos (ligados a tu cuenta Discord)'),

  new SlashCommandBuilder()
    .setName('mi-magia-tirar')
    .setDescription('Tirar 1d100 para obtener un objeto mágico aleatorio (si tienes slot disponible)'),

  // ── JUGADOR ─────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('mi-personaje')
    .setDescription('Muestra tu ficha de personaje guardada'),

  new SlashCommandBuilder()
    .setName('subir-nivel')
    .setDescription('Aplica las mejoras de tu subida de nivel (ASI o dote)'),

  new SlashCommandBuilder()
    .setName('inventario')
    .setDescription('Ver tu inventario, objetos y monedero'),

  new SlashCommandBuilder()
    .setName('dar')
    .setDescription('Proponer dar un objeto a otro jugador')
    .addUserOption(o => o.setName('usuario').setDescription('A quién darle el objeto').setRequired(true))
    .addStringOption(o => o.setName('objeto').setDescription('Nombre del objeto a dar').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad (default: 1)').setMinValue(1).setRequired(false))
    .addBooleanOption(o => o.setName('listar').setDescription('Mostrar lista de armas únicas y doradas disponibles').setRequired(false)),

  new SlashCommandBuilder()
    .setName('pagar')
    .setDescription('Transferir dinero a otro jugador')
    .addUserOption(o => o.setName('usuario').setDescription('A quién pagar').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a transferir').setMinValue(1).setRequired(true))
    .addStringOption(o => o
      .setName('moneda').setDescription('Tipo de moneda').setRequired(true)
      .addChoices(
        { name: '🟤 Cobre (PC)',    value: 'PC' },
        { name: '⚪ Plata (PP)',    value: 'PP' },
        { name: '🔵 Electrum (PE)', value: 'PE' },
        { name: '🟡 Oro (PO)',      value: 'PO' },
        { name: '⚪ Platino (PT)',  value: 'PT' },
      )),

  // ── TIENDA Y BAR ────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('tienda')
    .setDescription('Ver el catálogo y comprar (el DM debe abrir la tienda primero)'),

  new SlashCommandBuilder()
    .setName('bar')
    .setDescription('Ver el menú y pedir en la taberna (el DM debe abrir el bar primero)'),

  // ── DUNGEON MASTER ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('dm-personajes')
    .setDescription('[DM] Lista todos los personajes del servidor'),

  new SlashCommandBuilder()
    .setName('dm-ficha')
    .setDescription('[DM] Ver la ficha completa de un jugador')
    .addUserOption(o => o
      .setName('usuario')
      .setDescription('El jugador cuya ficha quieres ver')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-subirnivel')
    .setDescription('[DM] Sube un nivel al personaje de un jugador y le notifica')
    .addUserOption(o => o
      .setName('usuario')
      .setDescription('El jugador que sube de nivel')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-dano')
    .setDescription('[DM] Asigna daño a un jugador y descuenta HP automáticamente')
    .addUserOption(o => o.setName('usuario').setDescription('El jugador que recibe daño').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Puntos de daño').setMinValue(1).setRequired(true))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo del daño (opcional)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-curar')
    .setDescription('[DM] Cura HP a un jugador')
    .addUserOption(o => o.setName('usuario').setDescription('El jugador que se cura').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('HP a recuperar').setMinValue(1).setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-abrir-tienda')
    .setDescription('[DM] Abre la tienda en este canal'),

  new SlashCommandBuilder()
    .setName('dm-cerrar-tienda')
    .setDescription('[DM] Cierra la tienda de este canal'),

  new SlashCommandBuilder()
    .setName('dm-precio-tienda')
    .setDescription('[DM] Ajustar o restablecer el precio de un artículo de la tienda')
    .addStringOption(o => o.setName('objeto').setDescription('Nombre exacto del artículo').setRequired(false))
    .addNumberOption(o => o.setName('precio').setDescription('Nuevo precio en PO (ej: 12.5)').setMinValue(0).setRequired(false))
    .addBooleanOption(o => o.setName('restablecer').setDescription('Restablecer a precio base (true = restablecer todo)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-abrir-bar')
    .setDescription('[DM] Abre el bar/taberna en este canal'),

  new SlashCommandBuilder()
    .setName('dm-cerrar-bar')
    .setDescription('[DM] Cierra el bar de este canal'),

  new SlashCommandBuilder()
    .setName('dm-dar-magia')
    .setDescription('[DM] Dar un objeto mágico a un jugador por id o nombre')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador receptor').setRequired(true))
    .addIntegerOption(o => o.setName('id').setDescription('ID del objeto (1-100)').setMinValue(1).setMaxValue(100).setRequired(false))
    .addStringOption(o => o.setName('nombre').setDescription('Nombre del objeto (búsqueda parcial)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-tirar-magia')
    .setDescription('[DM] Tirar 1d100 y asignar el objeto mágico correspondiente')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador receptor').setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-quitar-magia')
    .setDescription('[DM] Retirar un objeto mágico a un jugador')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador').setRequired(true))
    .addIntegerOption(o => o.setName('id').setDescription('ID del objeto a retirar').setMinValue(1).setMaxValue(100).setRequired(true)),

  // ── ALQUIMISTA / ARTIFICIERO / CURAR ────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('alquimista')
    .setDescription('Visitar la tienda del alquimista para comprar pociones'),

  new SlashCommandBuilder()
    .setName('dm-abrir-alquimista')
    .setDescription('[DM] Abrir la tienda del alquimista')
    .addStringOption(o => o.setName('rarezas').setDescription('Rarezas disponibles separadas por coma (default: Común,Poco común,Rara)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-cerrar-alquimista')
    .setDescription('[DM] Cerrar la tienda del alquimista'),

  new SlashCommandBuilder()
    .setName('artificiero')
    .setDescription('Visitar el taller del artificiero para mejorar un objeto'),

  new SlashCommandBuilder()
    .setName('dm-abrir-artificiero')
    .setDescription('[DM] Abrir el taller del artificiero'),

  new SlashCommandBuilder()
    .setName('dm-cerrar-artificiero')
    .setDescription('[DM] Cerrar el taller del artificiero'),

  new SlashCommandBuilder()
    .setName('dm-artificiero-precio')
    .setDescription('[DM] Fijar el precio de una mejora del artificiero')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador').setRequired(true))
    .addIntegerOption(o => o.setName('precio').setDescription('Precio en PO').setMinValue(1).setRequired(true)),

  new SlashCommandBuilder()
    .setName('artificiero-pagar')
    .setDescription('Pagar la mejora del artificiero una vez fijado el precio'),

  new SlashCommandBuilder()
    .setName('curar')
    .setDescription('Curar a otro personaje (solo Clérigo, Druida, Paladín, Bardo)')
    .addUserOption(o => o.setName('usuario').setDescription('Personaje a curar (vacío = curarte a ti mismo)').setRequired(false)),

  // ── INICIO / EQUIPO ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('inicio')
    .setDescription('Guía de inicio — qué hacer para empezar a jugar'),

  new SlashCommandBuilder()
    .setName('equipo-inicial')
    .setDescription('Elegir tu equipo de inicio (trasfondo, dinero o vale)'),

  new SlashCommandBuilder()
    .setName('crear-personaje-fisico')
    .setDescription('Registrar un personaje creado en papel (selecciona stats manualmente)'),

  new SlashCommandBuilder()
    .setName('dm-inventario')
    .setDescription('[DM] Ver el inventario de un jugador (o todos)')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador (vacío = todos)').setRequired(false)),

  // ── SESIONES ────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('dm-sesion-crear')
    .setDescription('[DM] Crear una sesión de campaña')
    .addStringOption(o => o.setName('nombre').setDescription('Nombre de la sesión').setRequired(true))
    .addIntegerOption(o => o.setName('max').setDescription('Máximo de jugadores (default: 6)').setMinValue(1).setMaxValue(20).setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-sesion-cerrar')
    .setDescription('[DM] Cerrar la sesión activa'),

  new SlashCommandBuilder()
    .setName('dm-sesion-ver')
    .setDescription('[DM] Ver jugadores en la sesión activa'),

  new SlashCommandBuilder()
    .setName('sesion-unirse')
    .setDescription('Unirse a la sesión activa del servidor'),

  new SlashCommandBuilder()
    .setName('sesion-salir')
    .setDescription('Salir de la sesión activa'),

  // ── SUBASTAS ─────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('dm-subasta')
    .setDescription('[DM] Abrir subasta en la Casa del DM (ciega, 10 min por defecto)')
    .addStringOption(o => o.setName('objeto').setDescription('Nombre del objeto').setRequired(true))
    .addIntegerOption(o => o.setName('precio_base').setDescription('Oferta mínima en PO').setMinValue(1).setRequired(false))
    .addIntegerOption(o => o.setName('duracion').setDescription('Duración en minutos (default: 10, max: 120)').setMinValue(1).setMaxValue(120).setRequired(false))
    .addStringOption(o => o.setName('descripcion').setDescription('Descripción del objeto').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-subasta-cerrar')
    .setDescription('[DM] Cerrar la subasta del DM antes de tiempo'),

  new SlashCommandBuilder()
    .setName('subasta-abrir')
    .setDescription('Abrir una subasta de tu propio objeto en la Casa de Jugadores')
    .addIntegerOption(o => o.setName('precio_base').setDescription('Oferta mínima en PO').setMinValue(1).setRequired(true))
    .addIntegerOption(o => o.setName('duracion').setDescription('Duración en minutos (default: 10, max: 120)').setMinValue(1).setMaxValue(120).setRequired(false))
    .addStringOption(o => o.setName('descripcion').setDescription('Descripción adicional del objeto').setRequired(false)),

  new SlashCommandBuilder()
    .setName('subasta-ver')
    .setDescription('Ver las subastas activas en este servidor'),

  new SlashCommandBuilder()
    .setName('pujar')
    .setDescription('Pujar en la subasta activa (si solo hay una)')
    .addIntegerOption(o => o.setName('cantidad').setDescription('Tu oferta en PO').setMinValue(1).setRequired(true)),

  new SlashCommandBuilder()
    .setName('pujar-dm')
    .setDescription('Pujar en la subasta de la Casa del DM')
    .addIntegerOption(o => o.setName('cantidad').setDescription('Tu oferta en PO').setMinValue(1).setRequired(true)),

  new SlashCommandBuilder()
    .setName('pujar-jugadores')
    .setDescription('Pujar en la subasta de la Casa de Jugadores')
    .addIntegerOption(o => o.setName('cantidad').setDescription('Tu oferta en PO').setMinValue(1).setRequired(true)),

  // ── ENTRENAMIENTO ────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('entrenar')
    .setDescription('Ir al campo de entrenamiento')
    .addStringOption(o => o
      .setName('modo').setDescription('Tipo de entrenamiento').setRequired(true)
      .addChoices(
        { name: '🪵 Novato — Muñeco de prueba (sin respuesta)', value: 'novato' },
        { name: '👺 Tutorial 1 — vs 1 Goblin', value: 'tutorial-1' },
        { name: '👺👺 Tutorial 2 — vs 2 Goblins', value: 'tutorial-2' },
      )),

  // ── ARMAS ÚNICAS ─────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('dm-arma-unica-añadir')
    .setDescription('[DM] Añadir un arma única al pool del vale especial')
    .addStringOption(o => o.setName('nombre').setDescription('Nombre del arma').setRequired(true))
    .addStringOption(o => o.setName('daño').setDescription('Daño (ej: 2d6+3 cortante)').setRequired(true))
    .addStringOption(o => o.setName('propiedades').setDescription('Propiedades (ej: Versátil, Ligera)').setRequired(false))
    .addStringOption(o => o.setName('descripcion').setDescription('Descripción del arma').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-arma-unica-listar')
    .setDescription('[DM] Ver las armas únicas (pool del DM o catálogo predefinido por clase)')
    .addStringOption(o => o.setName('clase').setDescription('Filtrar por clase').setRequired(false).addChoices({ name: 'Artificiero', value: 'Artificiero' }, { name: 'Bárbaro', value: 'Bárbaro' }, { name: 'Bardo', value: 'Bardo' }, { name: 'Brujo', value: 'Brujo' }, { name: 'Clérigo', value: 'Clérigo' }, { name: 'Druida', value: 'Druida' }, { name: 'Explorador', value: 'Explorador' }, { name: 'Guerrero', value: 'Guerrero' }, { name: 'Hechicero', value: 'Hechicero' }, { name: 'Mago', value: 'Mago' }, { name: 'Monje', value: 'Monje' }, { name: 'Paladín', value: 'Paladín' }, { name: 'Pícaro', value: 'Pícaro' })),

  new SlashCommandBuilder()
    .setName('dm-arma-unica-eliminar')
    .setDescription('[DM] Eliminar un arma única del pool')
    .addIntegerOption(o => o.setName('id').setDescription('Número del arma en la lista').setMinValue(1).setRequired(true)),


  // ── DUELOS ──────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('duelo')
    .setDescription('Retar a otro jugador a un duelo (fuera de sesión, sin recompensas del bot)')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador al que retas').setRequired(true))
    .addStringOption(o => o.setName('apuesta_tipo').setDescription('Tipo de apuesta').setRequired(false)
      .addChoices(
        { name: 'Sin apuesta', value: 'ninguna' },
        { name: '💰 Dinero (PO)', value: 'dinero' },
        { name: '📉 Un nivel', value: 'nivel' },
        { name: '🎒 Un objeto', value: 'objeto' }
      ))
    .addStringOption(o => o.setName('apuesta_valor').setDescription('Cantidad de PO o nombre del objeto').setRequired(false)),

  new SlashCommandBuilder()
    .setName('duelo-2v2')
    .setDescription('Duelo en equipos 2v2')
    .addUserOption(o => o.setName('aliado').setDescription('Tu compañero de equipo').setRequired(true))
    .addUserOption(o => o.setName('rival1').setDescription('Primer rival').setRequired(true))
    .addUserOption(o => o.setName('rival2').setDescription('Segundo rival').setRequired(true)),

  new SlashCommandBuilder()
    .setName('apostar')
    .setDescription('Apostar como espectador por un duelista')
    .addUserOption(o => o.setName('duelista').setDescription('Duelista por el que apuestas').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad en PO').setMinValue(1).setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-recompensar')
    .setDescription('[DM] Dar dinero u objetos como recompensa a un jugador')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador que recibe la recompensa').setRequired(true))
    .addStringOption(o => o
      .setName('tipo').setDescription('Tipo de recompensa').setRequired(true)
      .addChoices({ name: '💰 Dinero', value: 'dinero' }, { name: '🎒 Objeto', value: 'objeto' }, { name: '🎫 Ticket de arma', value: 'ticket' }))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo de la recompensa').setRequired(false))
    // Dinero
    .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad (dinero o nº de objetos)').setMinValue(1).setRequired(false))
    .addStringOption(o => o
      .setName('moneda').setDescription('Moneda (solo si tipo=dinero)').setRequired(false)
      .addChoices(
        { name: '🟤 Cobre (PC)', value: 'PC' }, { name: '⚪ Plata (PP)', value: 'PP' },
        { name: '🔵 Electrum (PE)', value: 'PE' }, { name: '🟡 Oro (PO)', value: 'PO' },
        { name: '⚪ Platino (PT)', value: 'PT' }
      ))
    // Objeto
    .addStringOption(o => o.setName('nombre').setDescription('Nombre del objeto (solo si tipo=objeto)').setRequired(false))
    .addNumberOption(o => o.setName('peso').setDescription('Peso del objeto en libras').setRequired(false))
    .addStringOption(o => o
      .setName('clase_ticket').setDescription('Tipo de ticket (solo si tipo=ticket)').setRequired(false)
      .addChoices({ name: '🎫 Ticket normal (arma única)', value: 'normal' }, { name: '💛 Ticket dorado (arma legendaria)', value: 'dorado' })),

  new SlashCommandBuilder()
    .setName('dm-ajustar')
    .setDescription('[DM] Edita un campo de la ficha de un jugador manualmente')
    .addUserOption(o => o
      .setName('usuario')
      .setDescription('El jugador cuya ficha editar')
      .setRequired(true))
    .addStringOption(o => o
      .setName('campo')
      .setDescription('Campo a modificar')
      .setRequired(true)
      .addChoices(
        { name: '💪 Fuerza (FUE)',       value: 'FUE' },
        { name: '🏃 Destreza (DES)',      value: 'DES' },
        { name: '🫀 Constitución (CON)',  value: 'CON' },
        { name: '🧠 Inteligencia (INT)',  value: 'INT' },
        { name: '🦉 Sabiduría (SAB)',     value: 'SAB' },
        { name: '✨ Carisma (CAR)',        value: 'CAR' },
        { name: '📈 Nivel',               value: 'nivel' },
        { name: '❤️ HP máximos',          value: 'hp' },
        { name: '✏️ Nombre',              value: 'nombre' },
      ))
    .addStringOption(o => o
      .setName('valor')
      .setDescription('Nuevo valor para el campo')
      .setRequired(true)),

  // ── AYUDA ───────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('Muestra todos los comandos disponibles del bot'),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Registrando ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registrados correctamente.');
  } catch (err) {
    console.error('❌ Error al registrar:', err);
  }
})();
