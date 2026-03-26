// ── handlers/ticketPanel.js ───────────────────────────────────────────────────
// Sistema de canje de tickets de armas únicas y doradas
//
//  /canjear-ticket  → El jugador canjea su ticket (detecta el tipo automáticamente)
// ─────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCharacter, updateCharacter } = require('../db/characterStore.js');
const { getRandomUniqueWeapon, getArmaDorada } = require('./uniqueWeaponsPanel.js');

// Tipos de ticket reconocidos en el inventario
const TICKET_NOMBRES = [
  'Vale de Aventurero',
  'Ticket de Arma Única',
  'Ticket Dorado',
  'Vale Especial',
  'Vale Dorado',
];

function esTicket(nombre) {
  return TICKET_NOMBRES.some(t => nombre.toLowerCase().includes(t.toLowerCase())) ||
         nombre.toLowerCase().includes('ticket') ||
         nombre.toLowerCase().includes('vale');
}

function esTicketDorado(nombre) {
  return nombre.toLowerCase().includes('dorado') || nombre.toLowerCase().includes('golden');
}

async function cmdCanjearTicket(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);

  if (!char) return interaction.reply({ content: '❌ No tienes personaje. Usa `/crear-personaje`.', ephemeral: true });

  const inv     = char.inventory || [];
  const ticket  = inv.find(i => esTicket(i.nombre));

  if (!ticket) {
    return interaction.reply({
      content: '❌ No tienes ningún ticket en tu inventario.\n*Los tickets los da el DM con `/dm-recompensar` o se obtienen como equipo inicial.*',
      ephemeral: true,
    });
  }

  const dorado = esTicketDorado(ticket.nombre);

  // Guardar en sesión qué ticket se va a canjear
  const { getSession } = require('../utils/sessions.js');
  const session = getSession(uid);
  session._canjeandoTicket = { nombre: ticket.nombre, dorado };

  const embed = new EmbedBuilder()
    .setTitle(dorado ? '💛 Ticket Dorado detectado' : '🎫 Ticket detectado')
    .setColor(dorado ? 0xFFD700 : 0xC0C0C0)
    .setDescription(
      `Tienes: **${ticket.nombre}**\n\n` +
      `Tu clase es **${char.class}** — el arma que obtengas estará orientada a tu clase.\n\n` +
      (dorado
        ? '⚠️ Los tickets dorados dan **armas legendarias** de poder extremo. Son permanentes e intransferibles.\n\n'
        : '') +
      `Pulsa el botón para tirar y descubrir qué arma te corresponde.`
    )
    .setFooter({ text: 'El arma se asigna según tu clase y la suerte del dado.' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_tirar')
      .setLabel(dorado ? '💛 Tirar — Arma Dorada' : '🎲 Tirar — Arma Única')
      .setStyle(dorado ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket_cancelar')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleTicketInteraction(interaction) {
  if (!interaction.isButton()) return false;
  const id = interaction.customId;
  if (!id.startsWith('ticket_')) return false;

  const uid     = interaction.user.id;
  const { getSession } = require('../utils/sessions.js');
  const session = getSession(uid);
  const char    = getCharacter(uid);

  if (id === 'ticket_cancelar') {
    delete session._canjeandoTicket;
    await interaction.update({ content: 'Canje cancelado.', embeds: [], components: [] });
    return true;
  }

  if (id === 'ticket_tirar') {
    const info = session._canjeandoTicket;
    if (!info || !char) {
      await interaction.update({ content: '❌ Sesión expirada. Vuelve a usar `/canjear-ticket`.', embeds: [], components: [] });
      return true;
    }

    // Retirar el ticket del inventario
    const inv      = [...(char.inventory || [])];
    const idxTicket = inv.findIndex(i => i.nombre === info.nombre);
    if (idxTicket !== -1) {
      if (inv[idxTicket].cantidad > 1) {
        inv[idxTicket] = { ...inv[idxTicket], cantidad: inv[idxTicket].cantidad - 1 };
      } else {
        inv.splice(idxTicket, 1);
      }
    }

    // Obtener arma según tipo de ticket
    const arma = info.dorado
      ? getArmaDorada(char.class)
      : getRandomUniqueWeapon(char.class);

    if (!arma) {
      await interaction.update({ content: '❌ No hay armas disponibles. Pídele al DM que añada armas con `/dm-arma-unica-añadir`.', embeds: [], components: [] });
      return true;
    }

    // Añadir arma al inventario
    inv.push({
      nombre:      arma.nombre,
      cantidad:    1,
      peso:        arma.peso || 1,
      precio:      0,
      daño:        arma.daño || arma.damage || '—',
      propiedades: arma.propiedades || arma.desc || '—',
      descripcion: arma.descripcion || arma.desc || '—',
      categoria:   info.dorado ? 'Arma Dorada' : 'Arma Única',
      unica:       true,
      dorada:      info.dorado || false,
    });

    updateCharacter(uid, { inventory: inv });
    delete session._canjeandoTicket;

    const embed = new EmbedBuilder()
      .setTitle(info.dorado ? `💛 ¡Arma Dorada obtenida!` : `✨ ¡Arma Única obtenida!`)
      .setColor(info.dorado ? 0xFFD700 : 0xC0C0C0)
      .setDescription(`**${char.name}** ha canjeado su ticket y recibe:\n\n**${arma.nombre}**`)
      .addFields(
        { name: '⚔️ Daño',          value: arma.daño || arma.damage || '—',      inline: true },
        { name: '📋 Propiedades',   value: arma.propiedades || '—',               inline: true },
        { name: '📖 Descripción',   value: (arma.descripcion || arma.desc || '—').slice(0, 1024), inline: false },
      )
      .setFooter({ text: 'El objeto ha sido añadido a tu inventario.' });

    await interaction.update({ embeds: [embed], components: [] });
    return true;
  }

  return false;
}

module.exports = { cmdCanjearTicket, handleTicketInteraction };
