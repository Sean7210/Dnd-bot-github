// ── index.js ──────────────────────────────────────────────────────────────────
// Bot D&D 5e para Discord — Punto de entrada principal
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config();
const { initSchema } = require('./db/database.js');

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { rollDice, statMod } = require('./utils/helpers.js');

const { handleCreationInteraction, startCharacterCreation, showFinalCharacter } = require('./handlers/creation.js');
const { cmdEquipoInicial } = require('./handlers/equipoInicial.js');
const { startFisico } = require('./handlers/creationFisico.js');
const { handleMessageCommand }      = require('./handlers/messageCommands.js');
const {
  handleAutocomplete,
  cmdRazas, cmdRaza,
  cmdClase, cmdSubclase,
  cmdTrasfondos, cmdTrasfondo,
  cmdDotes, cmdDote,
  cmdArma, cmdArmadura, cmdEquipo,
  cmdAyuda,
} = require('./handlers/slashLookup.js');
const {
  cmdDmPersonajes,
  cmdDmFicha,
  cmdDmSubirNivel,
  cmdDmAjustar,
  cmdDmDano,
  cmdDmCurar,
  cmdDmRecompensar,
  cmdDmInventario,
  cmdInicio,
  cmdCurar,
  cmdDmQuitarItem,
  handleRecompensaSelect,
} = require('./handlers/dmPanel.js');
const {
  cmdMiPersonaje,
  cmdSubirNivel,
  handleLevelUpInteraction,
} = require('./handlers/playerPanel.js');
const {
  cmdDmAbrirTienda, cmdDmCerrarTienda,
  cmdDmAbrirBar, cmdDmCerrarBar,
  cmdDmPrecioTienda,
  cmdTienda, cmdBar, cmdMiDinero,
  handleShopInteraction,
} = require('./handlers/shopPanel.js');
const {
  cmdInventario, cmdPagar, cmdDar,
  handleInventoryInteraction,
} = require('./handlers/inventoryPanel.js');
const { cmdMiMagia, cmdMiMagiaTirar, cmdDmDarMagia, cmdDmTirarMagia, cmdDmQuitarMagia } = require('./handlers/magicItemsPanel.js');
const { cmdCanjearTicket, handleTicketInteraction } = require('./handlers/ticketPanel.js');
const { cmdObtenerSubclase, handleSubclaseInteraction, cmdDmDarSubclase } = require('./handlers/subclasePanel.js');
const { lanzarEventoAleatorio, iniciarTimerEventos, cmdDmEvento, cmdEventoVer } = require('./handlers/eventosPanel.js');
const { cmdDmAbrirAlquimista, cmdDmCerrarAlquimista, cmdAlquimista, handleAlquimistaInteraction } = require('./handlers/alchemistPanel.js');
const { cmdDmAbrirArtificiero, cmdDmCerrarArtificiero, cmdArtificiero, cmdDmArtificieroPrecio, cmdArtificieroPagar, handleArtificeroInteraction } = require('./handlers/artificePanel.js');
const { cmdDuelo, cmdDuelo2v2, cmdApostar, handleDueloInteraction, restaurarDuelos } = require('./handlers/duelPanel.js');
const { cmdDmSesionCrear, cmdDmSesionCerrar, cmdDmSesionVer, cmdSesionUnirse, cmdSesionSalir } = require('./handlers/sessionsPanel.js');
const { cmdDmSubasta, cmdDmSubastaCerrar, cmdSubastaAbrir, cmdSubastaVer, cmdPujar, cmdPujarDm, cmdPujarJugadores, handleSubastaSelectObjeto } = require('./handlers/auctionPanel.js');
const { cmdEntrenar, handleTrainingInteraction } = require('./handlers/trainingPanel.js');
const { cmdDmArmaUnicaAñadir, cmdDmArmaUnicaListar, cmdDmArmaUnicaEliminar } = require('./handlers/uniqueWeaponsPanel.js');
const { cmdDmEventoCaza, cmdDmCazaIniciar, cmdDmCazaCancelar, cmdDmCazaListar, handleCazaInteraction } = require('./handlers/cazaPanel.js');
const { cmdMisStats, cmdSalvacion, cmdDmMonstruos } = require('./handlers/statsPanel.js');
const { cmdCofre, cmdCofreDepositar, cmdCofrePagar, cmdDmCofreVer, handleCofreInteraction, iniciarCobroMantenimiento } = require('./handlers/cofrePanel.js');
const { cmdMisHechizos, cmdPrepararHechizo, cmdLanzarHechizo, cmdDescanso, cmdDmDarHechizo, handleMagiaInteraction } = require('./handlers/magiaPanel.js');

// ─── SLASH: /tirada ───────────────────────────────────────────────────────────
async function slashTirada(interaction) {
  const diceStr = (interaction.options.getString('dados') || '1d20').trim();
  const flag    = interaction.options.getString('modificador');

  // Ventaja / Desventaja
  if (flag === 'ventaja' || flag === 'desventaja') {
    const [r1, r2] = rollDice(2, 20);
    const result = flag === 'ventaja' ? Math.max(r1, r2) : Math.min(r1, r2);
    const other  = flag === 'ventaja' ? Math.min(r1, r2) : Math.max(r1, r2);
    const title  = flag === 'ventaja' ? '🎲 1d20 con Ventaja' : '🎲 1d20 con Desventaja';
    const color  = flag === 'ventaja' ? 0x00AA00 : 0xAA0000;
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle(title).setColor(color)
      .addFields(
        { name: 'Dados',     value: `~~${other}~~ **${result}**`, inline: true },
        { name: 'Resultado', value: `**${result}**`,              inline: true },
      )] });
  }

  // Parseo tolerante: NdM(kh|dl|k|d)N±M
  const match = diceStr.match(/^(\d{1,2})?d(\d{1,3})(?:(kh|dl|k|d)(\d{1,2}))?([+-]\d+)?$/i);
  if (!match) {
    return interaction.reply({
      content: '❌ Formato inválido. Ejemplos:\n• `1d20` · `2d6+3` · `4d6kh3` (keep highest 3) · `2d20dl1` (drop lowest)',
      ephemeral: true,
    });
  }

  const count   = Math.max(1, Math.min(20,   parseInt(match[1] || 1)));
  const sides   = Math.max(2, Math.min(1000, parseInt(match[2])));
  const mode    = match[3]?.toLowerCase() ?? null;
  const keepN   = match[4] ? parseInt(match[4]) : null;
  const mod     = match[5] ? parseInt(match[5]) : 0;

  let all = rollDice(count, sides).sort((a, b) => b - a); // desc
  let kept, dropped;

  if (mode === 'kh' || mode === 'k') {
    const n = Math.min(keepN ?? 1, count);
    kept = all.slice(0, n); dropped = all.slice(n);
  } else if (mode === 'dl' || mode === 'd') {
    const drop = Math.min(keepN ?? 1, count - 1);
    kept = all.slice(0, count - drop); dropped = all.slice(count - drop);
  } else {
    kept = all; dropped = [];
  }

  const sum   = kept.reduce((a, b) => a + b, 0);
  const total = sum + mod;
  const diceDisplay  = kept.map(r => `**${r}**`).join(' + ')
    + (dropped.length ? '  ' + dropped.map(r => `~~${r}~~`).join(' ') : '');
  const totalDisplay = mod !== 0
    ? `${sum} ${mod > 0 ? '+' : ''}${mod} = **${total}**`
    : `**${total}**`;

  return interaction.reply({ embeds: [new EmbedBuilder()
    .setTitle(`🎲 ${diceStr}`).setColor(0xDAA520)
    .addFields(
      { name: 'Dados', value: diceDisplay || '—', inline: true },
      { name: 'Total', value: totalDisplay,        inline: true },
    )] });
}

// ─── SLASH: /stats ────────────────────────────────────────────────────────────
async function slashStats(interaction) {
  const statNames = ['FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
  const stats = statNames.map(name => {
    const rolls = rollDice(4, 6).sort((a, b) => b - a);
    const total = rolls.slice(0, 3).reduce((a, b) => a + b, 0);
    return { name, rolls, total };
  });
  return interaction.reply({ embeds: [new EmbedBuilder()
    .setTitle('🎲 Tirada de Estadísticas (4d6 drop lowest)')
    .setColor(0xDAA520)
    .addFields(stats.map(s => ({
      name:   s.name,
      value:  `[${s.rolls.join(', ')}] → **${s.total}** (${statMod(s.total)})`,
      inline: true,
    })))
    .setFooter({ text: `Total: ${stats.reduce((a, s) => a + s.total, 0)} pts` })],
    ephemeral: true,
  });
}

// ─── SLASH: /stats-custom ─────────────────────────────────────────────────────
async function slashStatsCustom(interaction) {
  const count    = Math.max(1, Math.min(20,  interaction.options.getInteger('dados')     ?? 4));
  const sides    = Math.max(2, Math.min(100,  interaction.options.getInteger('lados')     ?? 6));
  const drop     = Math.max(0, Math.min(count - 1, interaction.options.getInteger('descartar') ?? 1));
  const quantity = Math.max(1, Math.min(12,   interaction.options.getInteger('cantidad')  ?? 6));

  const results = [];
  let totalPoints = 0;

  for (let i = 0; i < quantity; i++) {
    // Ordenar ascendente para que los índices bajos sean los menores
    const rolls   = rollDice(count, sides).sort((a, b) => a - b);
    const dropped = rolls.slice(0, drop);
    const kept    = rolls.slice(drop);
    const sum     = kept.reduce((a, b) => a + b, 0);
    results.push({ rolls, dropped, kept, sum });
    totalPoints += sum;
  }

  const fields = results.map((r, idx) => {
    // Marcamos con tachado los descartados (copia para no mutar el array)
    const droppedCopy = [...r.dropped];
    const display = r.rolls.map(n => {
      const pos = droppedCopy.indexOf(n);
      if (pos !== -1) { droppedCopy.splice(pos, 1); return `~~${n}~~`; }
      return `**${n}**`;
    }).join(', ');
    return {
      name:   `Stat ${idx + 1}`,
      value:  `${display}\n→ **${r.sum}** (${statMod(r.sum)})`,
      inline: true,
    };
  });

  // Rellenar con campos vacíos para que el grid 3×N quede alineado
  while (fields.length % 3 !== 0) {
    fields.push({ name: '\u200B', value: '\u200B', inline: true });
  }

  return interaction.reply({ embeds: [new EmbedBuilder()
    .setTitle(`🎲 ${count}d${sides} drop-${drop} × ${quantity}`)
    .setColor(0xDAA520)
    .addFields(fields)
    .setFooter({ text: `Total: ${totalPoints} pts · Promedio: ${(totalPoints / quantity).toFixed(1)} por stat` })],
    ephemeral: true,
  });
}

// ─── CLIENTE ──────────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ─── READY (carga segura con try/catch por módulo) ────────────────────────────
client.once('ready', () => {
  // ── Inicializar base de datos SQLite ──────────────────────────────────────
  try {
    initSchema();
  } catch (e) {
    console.error('⚠️  Error inicializando SQLite:', e.message);
  }

  let raceCount = 0, classCount = 0, featCount = 0;

  try {
    const { RACES }   = require('./data/races.js');
    raceCount = Object.keys(RACES).length;
  } catch (e) { console.error('⚠️  Error cargando razas:', e.message); }

  try {
    const { CLASSES } = require('./data/classes.js');
    classCount = Object.keys(CLASSES).length;
  } catch (e) { console.error('⚠️  Error cargando clases:', e.message); }

  try {
    const { DOTES }   = require('./data/feats.js');
    featCount = DOTES.length;
  } catch (e) { console.error('⚠️  Error cargando dotes:', e.message); }

  console.log(`✅ Bot conectado como ${client.user.tag}`);
  console.log(`📖 ${raceCount} razas · ${classCount} clases · ${featCount} dotes`);
  console.log(`💡 Slash commands: ejecuta "node deploy-commands.js" si aún no lo has hecho.`);
});

// ─── MENSAJES DE TEXTO (!comando) ─────────────────────────────────────────────
client.on('messageCreate', handleMessageCommand);

// ─── Comandos que pueden tardar >3s y necesitan defer ────────────────────────
const SLOW_COMMANDS = new Set(['dm-subirnivel', 'dm-ajustar', 'dm-dano', 'dm-curar']);

// ─── SLASH COMMANDS + BOTONES + SELECTS + MODALES ────────────────────────────
client.on('interactionCreate', async (interaction) => {
  try {
    // ── Autocomplete ──────────────────────────────────────────────────────────
    if (interaction.isAutocomplete()) {
      return await handleAutocomplete(interaction);
    }

    // ── Slash commands ────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      // Defer para comandos lentos (evita el timeout de 3s de Discord)
      if (SLOW_COMMANDS.has(interaction.commandName)) {
        await interaction.deferReply({ flags: 64 }).catch(() => {});
      }

      switch (interaction.commandName) {
        // Creación
        case 'crear-personaje':   return await startCharacterCreation(interaction);
        case 'dm-dar-magia':      return await cmdDmDarMagia(interaction);
        case 'dm-tirar-magia':    return await cmdDmTirarMagia(interaction);
        case 'dm-quitar-magia':   return await cmdDmQuitarMagia(interaction);
        case 'dm-sesion-crear':   return await cmdDmSesionCrear(interaction);
        case 'dm-sesion-cerrar':  return await cmdDmSesionCerrar(interaction);
        case 'dm-sesion-ver':     return await cmdDmSesionVer(interaction);
        case 'sesion-unirse':     return await cmdSesionUnirse(interaction);
        case 'sesion-salir':      return await cmdSesionSalir(interaction);
        case 'dm-subasta':        return await cmdDmSubasta(interaction);
        case 'dm-subasta-cerrar': return await cmdDmSubastaCerrar(interaction);
        case 'subasta-abrir':     return await cmdSubastaAbrir(interaction);
        case 'subasta-ver':       return await cmdSubastaVer(interaction);
        case 'pujar':             return await cmdPujar(interaction);
        case 'pujar-dm':          return await cmdPujarDm(interaction);
        case 'pujar-jugadores':   return await cmdPujarJugadores(interaction);
        case 'entrenar':          return await cmdEntrenar(interaction);
        case 'dm-arma-unica-añadir':   return await cmdDmArmaUnicaAñadir(interaction);
        case 'dm-arma-unica-listar':   return await cmdDmArmaUnicaListar(interaction);
        case 'dm-arma-unica-eliminar': return await cmdDmArmaUnicaEliminar(interaction);
        case 'dm-recompensar':    return await cmdDmRecompensar(interaction);
        // Dados
        case 'tirada':           return await slashTirada(interaction);
        case 'stats':            return await slashStats(interaction);
        case 'stats-custom':     return await slashStatsCustom(interaction);
        // Consultas
        case 'razas':            return await cmdRazas(interaction);
        case 'raza':             return await cmdRaza(interaction);
        case 'clase':            return await cmdClase(interaction);
        case 'subclase':         return await cmdSubclase(interaction);
        case 'trasfondos':       return await cmdTrasfondos(interaction);
        case 'trasfondo':        return await cmdTrasfondo(interaction);
        case 'dotes':            return await cmdDotes(interaction);
        case 'dote':             return await cmdDote(interaction);
        case 'arma':             return await cmdArma(interaction);
        case 'armadura':         return await cmdArmadura(interaction);
        case 'equipo':           return await cmdEquipo(interaction);
        case 'ayuda':            return await cmdAyuda(interaction);
        // Jugador
        case 'mi-personaje':     return await cmdMiPersonaje(interaction);
        case 'mi-dinero':        return await cmdMiDinero(interaction);
        case 'subir-nivel':      return await cmdSubirNivel(interaction);
        // Jugador — inventario e intercambios
        case 'inicio':           return await cmdInicio(interaction);
        case 'mis-stats':      return await cmdMisStats(interaction);
        case 'salvacion':     return await cmdSalvacion(interaction);
        case 'dm-monstruos':  return await cmdDmMonstruos(interaction);
        case 'cofre':            return await cmdCofre(interaction);
        case 'cofre-depositar':  return await cmdCofreDepositar(interaction);
        case 'cofre-pagar':      return await cmdCofrePagar(interaction);
        case 'dm-cofre-ver':     return await cmdDmCofreVer(interaction);
        case 'mis-hechizos':      return await cmdMisHechizos(interaction);
        case 'preparar-hechizo':  return await cmdPrepararHechizo(interaction);
        case 'lanzar-hechizo':    return await cmdLanzarHechizo(interaction);
        case 'descanso':          return await cmdDescanso(interaction);
        case 'dm-dar-hechizo':    return await cmdDmDarHechizo(interaction);
        case 'dm-evento-caza':   return await cmdDmEventoCaza(interaction);
        case 'dm-caza-iniciar':  return await cmdDmCazaIniciar(interaction);
        case 'dm-caza-cancelar': return await cmdDmCazaCancelar(interaction);
        case 'dm-caza-listar':   return await cmdDmCazaListar(interaction);
        case 'dm-evento':         return await cmdDmEvento(interaction);
        case 'evento-ver':        return await cmdEventoVer(interaction);
        case 'alquimista':       return await cmdAlquimista(interaction);
        case 'dm-alquimista': {
          const sub = interaction.options.getSubcommand();
          if (sub === 'abrir')  return await cmdDmAbrirAlquimista(interaction);
          if (sub === 'cerrar') return await cmdDmCerrarAlquimista(interaction);
          return;
        }
        case 'artificiero':       return await cmdArtificiero(interaction);
        case 'artificiero-pagar': return await cmdArtificieroPagar(interaction);
        case 'dm-artificiero': {
          const sub = interaction.options.getSubcommand();
          if (sub === 'abrir')  return await cmdDmAbrirArtificiero(interaction);
          if (sub === 'cerrar') return await cmdDmCerrarArtificiero(interaction);
          if (sub === 'precio') return await cmdDmArtificieroPrecio(interaction);
          return;
        }
        case 'curar':             return await cmdCurar(interaction);
        case 'obtener-subclase':  return await cmdObtenerSubclase(interaction);
        case 'dm-dar-subclase':   return await cmdDmDarSubclase(interaction);
        case 'equipo-inicial':   return await cmdEquipoInicial(interaction);
        case 'crear-personaje-fisico': return await startFisico(interaction);
        case 'dm-inventario':    return await cmdDmInventario(interaction);
        case 'dm-quitar-item':   return await cmdDmQuitarItem(interaction);
        case 'canjear-ticket':   return await cmdCanjearTicket(interaction);
        case 'duelo':            return await cmdDuelo(interaction);
        case 'duelo-2v2':        return await cmdDuelo2v2(interaction);
        case 'apostar':          return await cmdApostar(interaction);
        case 'mi-magia':         return await cmdMiMagia(interaction);
        case 'mi-magia-tirar':   return await cmdMiMagiaTirar(interaction);
        case 'inventario':       return await cmdInventario(interaction);
        case 'dar':              return await cmdDar(interaction);
        case 'pagar':            return await cmdPagar(interaction);
        // Tienda y bar
        case 'tienda':           return await cmdTienda(interaction);
        case 'bar':              return await cmdBar(interaction);
        // DM
        case 'dm-personajes':    return await cmdDmPersonajes(interaction);
        case 'dm-ficha':         return await cmdDmFicha(interaction);
        case 'dm-subirnivel':    return await cmdDmSubirNivel(interaction);
        case 'dm-ajustar':       return await cmdDmAjustar(interaction);
        case 'dm-dano':          return await cmdDmDano(interaction);
        case 'dm-curar':         return await cmdDmCurar(interaction);
        case 'dm-tienda': {
          const sub = interaction.options.getSubcommand();
          if (sub === 'abrir')  return await cmdDmAbrirTienda(interaction);
          if (sub === 'cerrar') return await cmdDmCerrarTienda(interaction);
          if (sub === 'precio') return await cmdDmPrecioTienda(interaction);
          return;
        }
        case 'dm-bar': {
          const sub = interaction.options.getSubcommand();
          if (sub === 'abrir')  return await cmdDmAbrirBar(interaction);
          if (sub === 'cerrar') return await cmdDmCerrarBar(interaction);
          return;
        }
      }
      return;
    }

    // ── Botones / Selects / Modales ───────────────────────────────────────────
    if (await handleRecompensaSelect(interaction))     return;
    if (await handleCofreInteraction(interaction))     return;
    if (await handleCazaInteraction(interaction))      return;
    if (await handleMagiaInteraction(interaction))      return;
    if (await handleSubclaseInteraction(interaction))   return;
    if (await handleLevelUpInteraction(interaction))    return;
    if (await handleShopInteraction(interaction))       return;
    if (await handleSubastaSelectObjeto(interaction))   return;
    if (await handleTicketInteraction(interaction))     return;
    if (await handleAlquimistaInteraction(interaction)) return;
    if (await handleArtificeroInteraction(interaction)) return;
    if (await handleDueloInteraction(interaction))      return;
    if (await handleTrainingInteraction(interaction))   return;
    if (await handleInventoryInteraction(interaction))  return;
    await handleCreationInteraction(interaction);

  } catch (err) {
    console.error('[interactionCreate]', err);
    const errMsg = { content: '❌ Ocurrió un error inesperado. Inténtalo de nuevo.', ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) await interaction.followUp(errMsg);
      else await interaction.reply(errMsg);
    } catch (_) { /* interacción expirada */ }
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ Falta DISCORD_TOKEN en el archivo .env');
  process.exit(1);
}
client.login(token);
