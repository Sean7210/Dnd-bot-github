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
    .setName('mi-dinero')
    .setDescription('Ver cuánto dinero tienes y su equivalente en distintas monedas'),

  new SlashCommandBuilder()
    .setName('cofre')
    .setDescription('Ver tu cofre del gremio (10 PO/día de mantenimiento)'),

  new SlashCommandBuilder()
    .setName('cofre-depositar')
    .setDescription('Depositar un ítem de tu inventario en el cofre del gremio'),

  new SlashCommandBuilder()
    .setName('cofre-pagar')
    .setDescription('Pagar la deuda del cofre del gremio para desbloquearlo'),

  new SlashCommandBuilder()
    .setName('dm-cofre-ver')
    .setDescription('[DM] Ver el cofre del gremio de un jugador')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador').setRequired(true))
    .setDefaultMemberPermissions(0),

  new SlashCommandBuilder()
    .setName('mis-stats')
    .setDescription('Ver todas tus estadísticas: bonos, armas, habilidades y salvaciones'),

  new SlashCommandBuilder()
    .setName('salvacion')
    .setDescription('Tirar una salvación')
    .addStringOption(o => o
      .setName('stat')
      .setDescription('Estadística de la salvación')
      .setRequired(true)
      .addChoices(
        { name: '💪 Fuerza (FUE)',        value: 'STR' },
        { name: '🏃 Destreza (DES)',       value: 'DEX' },
        { name: '🫀 Constitución (CON)',   value: 'CON' },
        { name: '🧠 Inteligencia (INT)',   value: 'INT' },
        { name: '🌿 Sabiduría (SAB)',      value: 'WIS' },
        { name: '✨ Carisma (CAR)',        value: 'CHA' },
      )
    )
    .addIntegerOption(o => o.setName('cd').setDescription('Clase de dificultad (opcional, para ver si superas)').setMinValue(1).setMaxValue(30).setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-monstruos')
    .setDescription('[DM] Ver lista de monstruos disponibles con sus stats')
    .addStringOption(o => o.setName('tipo').setDescription('Filtrar por tipo (Bestia, Humanoide, MH, OP...)').setRequired(false))
    .addStringOption(o => o.setName('nombre').setDescription('Buscar por nombre').setRequired(false))
    .setDefaultMemberPermissions(0),

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
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Lista todos los personajes del servidor'),

  new SlashCommandBuilder()
    .setName('dm-ficha')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Ver la ficha completa de un jugador')
    .addUserOption(o => o
      .setName('usuario')
      .setDescription('El jugador cuya ficha quieres ver')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-subirnivel')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Sube un nivel al personaje de un jugador y le notifica')
    .addUserOption(o => o
      .setName('usuario')
      .setDescription('El jugador que sube de nivel')
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-dano')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Asigna daño a un jugador y descuenta HP automáticamente')
    .addUserOption(o => o.setName('usuario').setDescription('El jugador que recibe daño').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Puntos de daño').setMinValue(1).setRequired(true))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo del daño (opcional)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-curar')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Cura HP a un jugador')
    .addUserOption(o => o.setName('usuario').setDescription('El jugador que se cura').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('HP a recuperar').setMinValue(1).setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-tienda')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Gestionar la tienda')
    .addSubcommand(s => s.setName('abrir').setDescription('Abrir la tienda en este canal'))
    .addSubcommand(s => s.setName('cerrar').setDescription('Cerrar la tienda en este canal'))
    .addSubcommand(s => s
      .setName('precio')
      .setDescription('Ajustar precio de un artículo')
      .addStringOption(o => o.setName('objeto').setDescription('Nombre del artículo').setRequired(false))
      .addNumberOption(o => o.setName('precio').setDescription('Nuevo precio en PO').setMinValue(0).setRequired(false))
      .addBooleanOption(o => o.setName('restablecer').setDescription('Restablecer precios base').setRequired(false))
    ),

  new SlashCommandBuilder()
    .setName('dm-bar')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Gestionar el bar/taberna')
    .addSubcommand(s => s.setName('abrir').setDescription('Abrir el bar en este canal'))
    .addSubcommand(s => s.setName('cerrar').setDescription('Cerrar el bar en este canal')),

  new SlashCommandBuilder()
    .setName('dm-dar-magia')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Dar un objeto mágico a un jugador por id o nombre')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador receptor').setRequired(true))
    .addIntegerOption(o => o.setName('id').setDescription('ID del objeto (1-100)').setMinValue(1).setMaxValue(100).setRequired(false))
    .addStringOption(o => o.setName('nombre').setDescription('Nombre del objeto (búsqueda parcial)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-tirar-magia')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Tirar 1d100 y asignar el objeto mágico correspondiente')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador receptor').setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-quitar-magia')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Retirar un objeto mágico a un jugador')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador').setRequired(true))
    .addIntegerOption(o => o.setName('id').setDescription('ID del objeto a retirar').setMinValue(1).setMaxValue(100).setRequired(true)),

  // ── ALQUIMISTA / ARTIFICIERO / CURAR ────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('alquimista')
    .setDescription('Visitar la tienda del alquimista para comprar pociones'),

  new SlashCommandBuilder()
    .setName('dm-alquimista')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Gestionar la tienda del alquimista')
    .addSubcommand(s => s
      .setName('abrir')
      .setDescription('Abrir la tienda del alquimista')
      .addStringOption(o => o.setName('rarezas').setDescription('Rarezas (Común,Poco común,Rara)').setRequired(false))
    )
    .addSubcommand(s => s.setName('cerrar').setDescription('Cerrar la tienda del alquimista')),

  new SlashCommandBuilder()
    .setName('artificiero')
    .setDescription('Visitar el taller del artificiero para mejorar un objeto'),

  new SlashCommandBuilder()
    .setName('dm-artificiero')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Gestionar el taller del artificiero')
    .addSubcommand(s => s.setName('abrir').setDescription('Abrir el taller'))
    .addSubcommand(s => s.setName('cerrar').setDescription('Cerrar el taller'))
    .addSubcommand(s => s
      .setName('precio')
      .setDescription('Fijar precio de una mejora')
      .addUserOption(o => o.setName('usuario').setDescription('Jugador').setRequired(true))
      .addIntegerOption(o => o.setName('precio').setDescription('Precio en PO').setMinValue(1).setRequired(true))
      .addStringOption(o => o.setName('materiales').setDescription('Materiales necesarios').setRequired(false))
      .addStringOption(o => o.setName('caracteristica').setDescription('Característica especial (ej: Fuego, +1d6 rayo)').setRequired(false))
    ),



  new SlashCommandBuilder()
    .setName('artificiero-pagar')
    .setDescription('Pagar la mejora del artificiero una vez fijado el precio'),

  new SlashCommandBuilder()
    .setName('curar')
    .setDescription('Curar a otro personaje (solo Clérigo, Druida, Paladín, Bardo)')
    .addUserOption(o => o.setName('usuario').setDescription('Personaje a curar (vacío = curarte a ti mismo)').setRequired(false)),


  // ── SISTEMA DE MAGIA ──────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('mis-hechizos')
    .setDescription('Ver tus hechizos conocidos, trucos y slots disponibles'),

  new SlashCommandBuilder()
    .setName('preparar-hechizo')
    .setDescription('Aprender un hechizo nuevo o elegir un truco')
    .addBooleanOption(o => o.setName('trucos').setDescription('Elegir un truco (true) o un hechizo (false)').setRequired(false))
    .addIntegerOption(o => o.setName('nivel').setDescription('Nivel del hechizo a aprender (1-9)').setMinValue(1).setMaxValue(9).setRequired(false)),

  new SlashCommandBuilder()
    .setName('lanzar-hechizo')
    .setDescription('Lanzar un hechizo (gasta slot)')
    .addStringOption(o => o.setName('hechizo').setDescription('Nombre del hechizo').setRequired(true))
    .addIntegerOption(o => o.setName('slot').setDescription('Nivel del slot a usar (upcast)').setMinValue(1).setMaxValue(9).setRequired(false)),

  new SlashCommandBuilder()
    .setName('descanso')
    .setDescription('Descanso largo: restaura HP y slots de hechizo'),

  new SlashCommandBuilder()
    .setName('dm-dar-hechizo')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Dar un hechizo o truco extra a un jugador')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador').setRequired(true))
    .addStringOption(o => o.setName('hechizo').setDescription('Nombre exacto del hechizo/truco').setRequired(true)),


  // ── EVENTOS DE CAZA ───────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('dm-evento-caza')
    .setDescription('[DM] Lanzar un evento de caza de monstruo')
    .addStringOption(o => o.setName('monstruo').setDescription('Nombre del monstruo (vacío = aleatorio)').setRequired(false))
    .addStringOption(o => o.setName('tipo').setDescription('Tipo de monstruo (Bestia, Humanoide, MH, OP...)').setRequired(false))
    .addIntegerOption(o => o.setName('duracion').setDescription('Minutos de ventana para unirse (por defecto 30)').setMinValue(1).setMaxValue(60).setRequired(false))
    .setDefaultMemberPermissions(0),

  new SlashCommandBuilder()
    .setName('dm-caza-iniciar')
    .setDescription('[DM] Forzar inicio del combate de caza sin esperar el tiempo')
    .setDefaultMemberPermissions(0),

  new SlashCommandBuilder()
    .setName('dm-caza-cancelar')
    .setDescription('[DM] Cancelar la caza activa')
    .setDefaultMemberPermissions(0),

  new SlashCommandBuilder()
    .setName('dm-caza-listar')
    .setDescription('[DM] Ver los monstruos disponibles para la caza')
    .addStringOption(o => o.setName('tipo').setDescription('Filtrar por tipo').setRequired(false))
    .setDefaultMemberPermissions(0),

  // ── EVENTOS ──────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('obtener-subclase')
    .setDescription('Elige tu subclase cuando hayas alcanzado el nivel requerido'),

  new SlashCommandBuilder()
    .setName('dm-dar-subclase')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Asignar una subclase a un jugador directamente')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador').setRequired(true))
    .addStringOption(o => o.setName('subclase').setDescription('Nombre de la subclase').setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm-evento')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Lanzar un evento aleatorio ahora'),

  new SlashCommandBuilder()
    .setName('evento-ver')
    .setDescription('Ver el evento activo actualmente'),

  // ── ARTIFICIERO mejorado ──────────────────────────────────────────────────────
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
    .setName('dm-quitar-item')
    .setDescription('[DM] Retirar un ítem del inventario de un jugador')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador').setRequired(true))
    .addStringOption(o => o.setName('item').setDescription('Nombre del ítem (búsqueda parcial)').setRequired(true))
    .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a quitar (por defecto 1)').setMinValue(1).setRequired(false))
    .addBooleanOption(o => o.setName('todo').setDescription('Quitar todas las unidades del ítem (true)').setRequired(false))
    .setDefaultMemberPermissions(0),

  new SlashCommandBuilder()
    .setName('dm-inventario')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Ver el inventario de un jugador (o todos)')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador (vacío = todos)').setRequired(false)),

  // ── SESIONES ────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('dm-sesion-crear')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Crear una sesión de campaña')
    .addStringOption(o => o.setName('nombre').setDescription('Nombre de la sesión').setRequired(true))
    .addIntegerOption(o => o.setName('max').setDescription('Máximo de jugadores (default: 6)').setMinValue(1).setMaxValue(20).setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-sesion-cerrar')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Cerrar la sesión activa'),

  new SlashCommandBuilder()
    .setName('dm-sesion-ver')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
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
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Abrir subasta en la Casa del DM (ciega, 10 min por defecto)')
    .addStringOption(o => o.setName('objeto').setDescription('Nombre del objeto').setRequired(true))
    .addIntegerOption(o => o.setName('precio_base').setDescription('Oferta mínima en PO').setMinValue(1).setRequired(false))
    .addIntegerOption(o => o.setName('duracion').setDescription('Duración en minutos (default: 10, max: 120)').setMinValue(1).setMaxValue(120).setRequired(false))
    .addStringOption(o => o.setName('descripcion').setDescription('Descripción del objeto').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-subasta-cerrar')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
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
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Añadir un arma única al pool del vale especial')
    .addStringOption(o => o.setName('nombre').setDescription('Nombre del arma').setRequired(true))
    .addStringOption(o => o.setName('daño').setDescription('Daño (ej: 2d6+3 cortante)').setRequired(true))
    .addStringOption(o => o.setName('propiedades').setDescription('Propiedades (ej: Versátil, Ligera)').setRequired(false))
    .addStringOption(o => o.setName('descripcion').setDescription('Descripción del arma').setRequired(false)),

  new SlashCommandBuilder()
    .setName('dm-arma-unica-listar')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Ver las armas únicas (pool del DM o catálogo predefinido por clase)')
    .addStringOption(o => o.setName('clase').setDescription('Filtrar por clase').setRequired(false).addChoices({ name: 'Artificiero', value: 'Artificiero' }, { name: 'Bárbaro', value: 'Bárbaro' }, { name: 'Bardo', value: 'Bardo' }, { name: 'Brujo', value: 'Brujo' }, { name: 'Clérigo', value: 'Clérigo' }, { name: 'Druida', value: 'Druida' }, { name: 'Explorador', value: 'Explorador' }, { name: 'Guerrero', value: 'Guerrero' }, { name: 'Hechicero', value: 'Hechicero' }, { name: 'Mago', value: 'Mago' }, { name: 'Monje', value: 'Monje' }, { name: 'Paladín', value: 'Paladín' }, { name: 'Pícaro', value: 'Pícaro' })),

  new SlashCommandBuilder()
    .setName('dm-arma-unica-eliminar')
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
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
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
    .setDescription('[DM] Dar dinero u objetos como recompensa a un jugador')
    .addUserOption(o => o.setName('usuario').setDescription('Jugador que recibe la recompensa').setRequired(true))
    .addStringOption(o => o
      .setName('tipo').setDescription('Tipo de recompensa').setRequired(true)
      .addChoices(
        { name: '💰 Dinero',                     value: 'dinero' },
        { name: '✨ Objeto mágico (de la lista)', value: 'objeto-magico' },
        { name: '📦 Objeto libre (texto)',         value: 'objeto' },
        { name: '🎫 Ticket / Vale (de la lista)',  value: 'ticket' },
      ))
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
    .setDefaultMemberPermissions(0) // Solo visible para DM/Admin
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
