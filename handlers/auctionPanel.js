// ── handlers/auctionPanel.js ──────────────────────────────────────────────────
// Sistema de subastas — dos casas independientes por servidor:
//   • Casa del DM  → /dm-subasta  (solo DM)
//   • Casa Jugadores → /subasta-abrir (cualquier jugador)
//
// Ambas son subastas ciegas. Pueden coexistir simultáneamente.
// El objeto del vendedor sale de su inventario al iniciar la subasta.
// Al cerrar: dinero descontado al ganador, objeto añadido a su inventario.
// ─────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCharacter, updateCharacter } = require('../db/characterStore.js');
const { formatearMonedero, totalEnPC, pagar }  = require('../data/startingWealth.js');
const { isDM } = require('../utils/isDM.js');

// Dos slots por servidor: 'dm' y 'jugadores'
// SUBASTAS[guildId] = { dm: SubastaState|null, jugadores: SubastaState|null }
const SUBASTAS = new Map();

function getSlots(guildId) {
  if (!SUBASTAS.has(guildId)) SUBASTAS.set(guildId, { dm: null, jugadores: null });
  return SUBASTAS.get(guildId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function minRestantes(fin) { return Math.max(0, Math.round((fin - Date.now()) / 60000)); }

function embedSubasta(sub, tipo) {
  const icono = tipo === 'dm' ? '🔨' : '🏪';
  const casa  = tipo === 'dm' ? 'Casa del DM' : 'Casa de Jugadores';
  return new EmbedBuilder()
    .setTitle(`${icono} ${casa} — Subasta: ${sub.objeto}`)
    .setColor(tipo === 'dm' ? 0xFFD700 : 0x20B2AA)
    .setDescription(
      (sub.descripcion ? `*${sub.descripcion}*\n\n` : '') +
      `**Precio base:** ${sub.precioBase} PO\n` +
      `**Tiempo restante:** ~${minRestantes(sub.fin)} minutos\n` +
      `**Ofertas recibidas:** ${Object.keys(sub.ofertas).length}\n\n` +
      (tipo === 'jugadores' ? `**Vendedor:** <@${sub.vendedorId}> — ${sub.vendedorChar}\n\n` : '') +
      `Las ofertas son **secretas**. Usa \`/pujar-dm\` o \`/pujar-jugadores\` para ofertar.`
    )
    .setFooter({ text: `Cierra automáticamente en ~${minRestantes(sub.fin)} min` });
}

// ─── Crear subasta genérica ───────────────────────────────────────────────────
function crearSubasta(params) {
  const { objeto, precioBase, minutos, descripcion, vendedorId, vendedorChar, itemInventario, channelId, dmId } = params;
  const fin = Date.now() + minutos * 60 * 1000;
  return {
    objeto, precioBase, descripcion: descripcion || '',
    ofertas: {},           // { userId: cantidad }
    fin,
    channelId,
    vendedorId:   vendedorId   || null,
    vendedorChar: vendedorChar || null,
    itemInventario: itemInventario || null,  // copia del item extraído del inventario
    dmId: dmId || null,
    timer: null,
  };
}

// ─── /dm-subasta ─────────────────────────────────────────────────────────────
async function cmdDmSubasta(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM puede usar la casa del DM.', ephemeral: true });

  const slots = getSlots(interaction.guildId);
  if (slots.dm)
    return interaction.reply({ content: '❌ Ya hay una subasta del DM activa. Ciérrala primero con `/dm-subasta-cerrar`.', ephemeral: true });

  const objeto      = interaction.options.getString('objeto');
  const precioBase  = interaction.options.getInteger('precio_base') || 1;
  const minutos     = Math.min(interaction.options.getInteger('duracion') || 10, 120);
  const descripcion = interaction.options.getString('descripcion') || '';

  const sub = crearSubasta({ objeto, precioBase, minutos, descripcion, channelId: interaction.channelId, dmId: interaction.user.id });
  sub.timer = setTimeout(() => cerrarSubasta(interaction.client, interaction.guildId, 'dm'), minutos * 60 * 1000);
  slots.dm = sub;

  await interaction.reply({ embeds: [embedSubasta(sub, 'dm')] });
}

// ─── /subasta-abrir (jugadores) ───────────────────────────────────────────────
async function cmdSubastaAbrir(interaction) {
  const slots = getSlots(interaction.guildId);
  if (slots.jugadores)
    return interaction.reply({ content: '❌ Ya hay una subasta de jugadores activa. Espera a que cierre.', ephemeral: true });

  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return interaction.reply({ content: '❌ No tienes personaje.', ephemeral: true });

  const inv = char.inventory || [];
  if (!inv.length)
    return interaction.reply({ content: '❌ Tu inventario está vacío.', ephemeral: true });

  // Guardar en sesión qué queremos subastar
  const { getSession } = require('../utils/sessions.js');
  const session = getSession(uid);
  session._subastaConfig = {
    precioBase: interaction.options.getInteger('precio_base') || 1,
    minutos:    Math.min(interaction.options.getInteger('duracion') || 10, 120),
    descripcion: interaction.options.getString('descripcion') || '',
  };

  // Mostrar select de inventario para elegir el objeto
  const opciones = inv.slice(0, 25).map(i => ({
    label: i.nombre.slice(0, 100),
    description: (`x${i.cantidad}${i.precio ? ' · ' + i.precio + ' PO' : ''}${i.daño ? ' · ' + i.daño : ''}`).slice(0,100) || undefined,
    value: i.nombre.slice(0, 100),
  }));

  const embed = new EmbedBuilder()
    .setTitle('🏪 Casa de Subastas — Elegir objeto')
    .setColor(0x20B2AA)
    .setDescription(`**Precio base:** ${session._subastaConfig.precioBase} PO  ·  **Duración:** ${session._subastaConfig.minutos} min\n\nElige qué objeto quieres subastar. Saldrá de tu inventario inmediatamente.`);

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('subasta_elegir_objeto')
      .setPlaceholder('Elige el objeto a subastar...')
      .addOptions(opciones)
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// ─── Handler del select de objeto ────────────────────────────────────────────
async function handleSubastaSelectObjeto(interaction) {
  if (!interaction.isStringSelectMenu() || interaction.customId !== 'subasta_elegir_objeto') return false;

  const uid    = interaction.user.id;
  const { getSession } = require('../utils/sessions.js');
  const session = getSession(uid);
  const config  = session._subastaConfig;
  if (!config) {
    await interaction.update({ content: '❌ Sesión expirada.', embeds: [], components: [] });
    return true;
  }

  const char    = getCharacter(uid);
  const nombre  = interaction.values[0];
  const inv     = [...(char.inventory || [])];
  const idxItem = inv.findIndex(i => i.nombre === nombre);

  if (idxItem === -1) {
    await interaction.update({ content: `❌ No tienes **${nombre}** en el inventario.`, embeds: [], components: [] });
    return true;
  }

  // Extraer 1 unidad del inventario del vendedor
  const itemCopia = { ...inv[idxItem] };
  if (inv[idxItem].cantidad > 1) {
    inv[idxItem] = { ...inv[idxItem], cantidad: inv[idxItem].cantidad - 1 };
  } else {
    inv.splice(idxItem, 1);
  }
  updateCharacter(uid, { inventory: inv });

  const slots = getSlots(interaction.guildId);
  if (slots.jugadores) {
    // Devolver el item si ya no se puede crear
    inv.push(itemCopia);
    updateCharacter(uid, { inventory: inv });
    await interaction.update({ content: '❌ Ya hay una subasta activa de jugadores.', embeds: [], components: [] });
    return true;
  }

  const sub = crearSubasta({
    objeto: nombre, precioBase: config.precioBase, minutos: config.minutos,
    descripcion: config.descripcion, vendedorId: uid, vendedorChar: char.name,
    itemInventario: itemCopia, channelId: interaction.channelId,
  });
  sub.timer = setTimeout(() => cerrarSubasta(interaction.client, interaction.guildId, 'jugadores'), config.minutos * 60 * 1000);
  slots.jugadores = sub;
  delete session._subastaConfig;

  const embed = embedSubasta(sub, 'jugadores');
  embed.addFields({ name: '📦 Objeto en subasta', value: `**${nombre}**${itemCopia.daño ? '\nDaño: ' + itemCopia.daño : ''}${itemCopia.descripcion ? '\n' + itemCopia.descripcion.slice(0,200) : ''}`, inline: false });

  // Anunciar públicamente
  await interaction.update({ content: '✅ Subasta abierta.', embeds: [], components: [] });
  await interaction.channel.send({ embeds: [embed] });
  return true;
}

// ─── /pujar-dm  y  /pujar-jugadores ──────────────────────────────────────────
async function cmdPujarDm(interaction) {
  return _pujar(interaction, 'dm');
}
async function cmdPujarJugadores(interaction) {
  return _pujar(interaction, 'jugadores');
}
// /pujar → detecta cuál está activa (compatibilidad hacia atrás)
async function cmdPujar(interaction) {
  const slots = getSlots(interaction.guildId);
  if (slots.dm && slots.jugadores)
    return interaction.reply({ content: '❌ Hay dos subastas activas. Usa `/pujar-dm` o `/pujar-jugadores`.', ephemeral: true });
  if (slots.dm)      return _pujar(interaction, 'dm');
  if (slots.jugadores) return _pujar(interaction, 'jugadores');
  return interaction.reply({ content: '❌ No hay ninguna subasta activa.', ephemeral: true });
}

async function _pujar(interaction, tipo) {
  const slots   = getSlots(interaction.guildId);
  const sub     = slots[tipo];
  if (!sub) return interaction.reply({ content: `❌ No hay subasta activa en la casa ${tipo === 'dm' ? 'del DM' : 'de jugadores'}.`, ephemeral: true });
  if (Date.now() > sub.fin) return interaction.reply({ content: '❌ La subasta ya cerró.', ephemeral: true });

  const uid = interaction.user.id;

  // El vendedor no puede pujar en su propia subasta
  if (tipo === 'jugadores' && sub.vendedorId === uid)
    return interaction.reply({ content: '❌ No puedes pujar en tu propia subasta.', ephemeral: true });

  const cantidad = interaction.options.getInteger('cantidad') || interaction.options.getNumber('cantidad');
  if (cantidad < sub.precioBase)
    return interaction.reply({ content: `❌ La oferta mínima es **${sub.precioBase} PO**.`, ephemeral: true });

  const char = getCharacter(uid);
  if (!char) return interaction.reply({ content: '❌ No tienes personaje.', ephemeral: true });

  const money = char.money || { PC:0, PP:0, PE:0, PO:0, PT:0 };
  if (totalEnPC(money) < Math.round(cantidad * 100))
    return interaction.reply({ content: `❌ Fondos insuficientes. Tienes: **${formatearMonedero(money)}**.`, ephemeral: true });

  const anterior = sub.ofertas[uid];
  sub.ofertas[uid] = cantidad;

  const embed = new EmbedBuilder()
    .setTitle(`✅ Oferta registrada`)
    .setColor(0x00CC00)
    .setDescription(
      `**Subasta:** ${sub.objeto} (${tipo === 'dm' ? 'Casa del DM' : 'Casa de Jugadores'})\n` +
      (anterior ? `Oferta anterior: ${anterior} PO → ` : '') +
      `Nueva oferta: **${cantidad} PO**\n\n` +
      `*Tu oferta es secreta. Tiempo restante: ~${minRestantes(sub.fin)} min.*`
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── Cerrar subasta ───────────────────────────────────────────────────────────
async function cerrarSubasta(client, guildId, tipo) {
  const slots = getSlots(guildId);
  const sub   = slots[tipo];
  if (!sub) return;

  clearTimeout(sub.timer);
  slots[tipo] = null;

  try {
    const guild   = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(sub.channelId).catch(() => null);
    if (!channel) return;

    const icono = tipo === 'dm' ? '🔨' : '🏪';
    const casa  = tipo === 'dm' ? 'Casa del DM' : 'Casa de Jugadores';

    const ofertas = Object.entries(sub.ofertas).sort((a, b) => b[1] - a[1]);

    if (!ofertas.length) {
      // Sin ofertas: devolver item al vendedor si era subasta de jugadores
      if (tipo === 'jugadores' && sub.vendedorId && sub.itemInventario) {
        const charVend = getCharacter(sub.vendedorId);
        if (charVend) {
          const invV = [...(charVend.inventory || [])];
          invV.push(sub.itemInventario);
          updateCharacter(sub.vendedorId, { inventory: invV });
        }
      }
      await channel.send({ embeds: [new EmbedBuilder()
        .setTitle(`${icono} ${casa} — Sin ofertas`)
        .setColor(0x888888)
        .setDescription(`La subasta de **${sub.objeto}** cerró sin ofertas.` +
          (tipo === 'jugadores' ? `\nEl objeto ha sido devuelto a <@${sub.vendedorId}>.` : ''))] });
      return;
    }

    const [ganadorId, ganadorMonto] = ofertas[0];
    const charGanador = getCharacter(ganadorId);

    let exito = false;
    if (charGanador) {
      const nuevoMonedero = pagar(charGanador.money || {PC:0,PP:0,PE:0,PO:0,PT:0}, ganadorMonto);
      if (nuevoMonedero) {
        const inv = [...(charGanador.inventory || [])];
        // Si la subasta era de jugadores, transferir el item original; si era del DM, crear nuevo
        if (tipo === 'jugadores' && sub.itemInventario) {
          inv.push({ ...sub.itemInventario, precio: ganadorMonto });
        } else {
          inv.push({ nombre: sub.objeto, cantidad: 1, peso: 0, precio: ganadorMonto, categoria: 'Subasta' });
        }
        updateCharacter(ganadorId, { money: nuevoMonedero, inventory: inv });
        exito = true;

        // Si hay vendedor de jugadores, darle el dinero
        if (tipo === 'jugadores' && sub.vendedorId) {
          const charVend = getCharacter(sub.vendedorId);
          if (charVend) {
            const monVend = { ...(charVend.money || {PC:0,PP:0,PE:0,PO:0,PT:0}) };
            monVend.PO = (monVend.PO || 0) + ganadorMonto;
            updateCharacter(sub.vendedorId, { money: monVend });
          }
        }
      }
    }

    const ranking = ofertas.map(([uid, monto], i) => {
      const ch = getCharacter(uid);
      const nom = ch ? ch.name : `<@${uid}>`;
      const mark = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
      return `${mark} **${nom}** — ${monto} PO${i === 0 ? ' ← GANADOR' : ''}`;
    }).join('\n');

    const desc = exito
      ? `<@${ganadorId}> (${charGanador.name}) gana con **${ganadorMonto} PO**.\n` +
        `El objeto ha sido añadido a su inventario y el dinero descontado.\n` +
        (tipo === 'jugadores' ? `**${ganadorMonto} PO** han sido enviados a <@${sub.vendedorId}>.\n` : '')
      : `<@${ganadorId}> ganó pero no tenía fondos suficientes. No se realizó la transferencia.`;

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${icono} ${casa} — Resultado: ${sub.objeto}`)
      .setColor(exito ? 0xFFD700 : 0xFF4444)
      .setDescription(desc + `\n\n**Todas las ofertas:**\n${ranking}`);

    await channel.send({ embeds: [embed] });
  } catch (e) { console.error('cerrarSubasta error:', e); }
}

// ─── /dm-subasta-cerrar ───────────────────────────────────────────────────────
async function cmdDmSubastaCerrar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });
  const slots = getSlots(interaction.guildId);
  if (!slots.dm)
    return interaction.reply({ content: '❌ No hay subasta del DM activa.', ephemeral: true });
  await interaction.deferReply();
  await cerrarSubasta(interaction.client, interaction.guildId, 'dm');
  await interaction.editReply({ content: '✅ Subasta del DM cerrada.' });
}

// ─── /subasta-ver ────────────────────────────────────────────────────────────
async function cmdSubastaVer(interaction) {
  const slots = getSlots(interaction.guildId);
  const embeds = [];
  if (slots.dm)        embeds.push(embedSubasta(slots.dm,        'dm'));
  if (slots.jugadores) embeds.push(embedSubasta(slots.jugadores, 'jugadores'));
  if (!embeds.length)
    return interaction.reply({ content: '❌ No hay subastas activas.', ephemeral: true });
  await interaction.reply({ embeds, ephemeral: true });
}

module.exports = {
  cmdDmSubasta, cmdDmSubastaCerrar,
  cmdSubastaAbrir, cmdSubastaVer,
  cmdPujar, cmdPujarDm, cmdPujarJugadores,
  handleSubastaSelectObjeto,
};
