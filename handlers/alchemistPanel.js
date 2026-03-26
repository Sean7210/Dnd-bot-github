// ── handlers/alchemistPanel.js ────────────────────────────────────────────────
// Tienda del Alquimista — vende pociones del catálogo oficial
// El DM abre/cierra con /dm-abrir-alquimista y /dm-cerrar-alquimista
// ─────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { getCharacter, updateCharacter } = require('../db/characterStore.js');
const { POCIONES, POCIONES_POR_RAREZA } = require('../data/potions.js');
const { totalEnPC, pagar, formatearMonedero } = require('../data/startingWealth.js');
const { isDM } = require('../utils/isDM.js');

// Estado de la tienda por servidor
const TIENDAS_ALQUIMISTA = new Map(); // guildId → { abierta, rarezasDisponibles }

// ─── /dm-abrir-alquimista ─────────────────────────────────────────────────────
async function cmdDmAbrirAlquimista(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const rarezas = interaction.options.getString('rarezas') || 'Común,Poco común,Rara';
  TIENDAS_ALQUIMISTA.set(interaction.guildId, {
    abierta: true,
    rarezasDisponibles: rarezas.split(',').map(r => r.trim()),
  });

  const embed = new EmbedBuilder()
    .setTitle('⚗️ Tienda del Alquimista — Abierta')
    .setColor(0x9B59B6)
    .setDescription(`El alquimista abre sus puertas.\n\n**Rarezas disponibles:** ${rarezas}\n\nLos jugadores pueden usar \`/alquimista\` para ver y comprar pociones.`);

  await interaction.reply({ embeds: [embed] });
}

// ─── /dm-cerrar-alquimista ────────────────────────────────────────────────────
async function cmdDmCerrarAlquimista(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  TIENDAS_ALQUIMISTA.delete(interaction.guildId);
  await interaction.reply({ content: '⚗️ La tienda del alquimista ha cerrado.', ephemeral: true });
}

// ─── /alquimista ──────────────────────────────────────────────────────────────
async function cmdAlquimista(interaction) {
  const tienda = TIENDAS_ALQUIMISTA.get(interaction.guildId);
  if (!tienda?.abierta)
    return interaction.reply({ content: '❌ La tienda del alquimista está cerrada.', ephemeral: true });

  const hora = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', hour: 'numeric', hour12: true });
  const h    = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', hour: 'numeric', hour12: false });
  const saludo = parseInt(h) < 12 ? '¡Buenos días, aventurero!' : parseInt(h) < 18 ? '¡Buenas tardes, aventurero!' : '¡Buenas noches, aventurero!';

  const pociones = POCIONES.filter(p => tienda.rarezasDisponibles.includes(p.rareza));

  const embed = new EmbedBuilder()
    .setTitle('⚗️ Tienda del Alquimista')
    .setColor(0x9B59B6)
    .setDescription(
      `*${saludo}* (Son las ${hora})\n\n` +
      `¿Buscas algo que te cure, te fortalezca o quizás... te vuelva invisible?\n\n` +
      `Tengo **${pociones.length} pociones** disponibles. Elige una categoría para ver el catálogo.`
    );

  const rarezasConItems = tienda.rarezasDisponibles.filter(r => pociones.some(p => p.rareza === r));

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('alquimista_rareza')
        .setPlaceholder('Ver pociones por rareza...')
        .addOptions(rarezasConItems.map(r => ({
          label: r,
          value: r,
          description: `${pociones.filter(p=>p.rareza===r).length} pociones disponibles`,
        })))
    ),
  ];

  await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
}

// ─── Handler de interacciones ─────────────────────────────────────────────────
async function handleAlquimistaInteraction(interaction) {
  const id = interaction.customId || '';

  // Select de rareza → mostrar pociones
  if (interaction.isStringSelectMenu() && id === 'alquimista_rareza') {
    const rareza  = interaction.values[0];
    const tienda  = TIENDAS_ALQUIMISTA.get(interaction.guildId);
    if (!tienda?.abierta) { await interaction.reply({ content: '❌ Tienda cerrada.', ephemeral: true }); return true; }

    const pociones = POCIONES.filter(p => p.rareza === rareza);
    const char     = getCharacter(interaction.user.id);
    const dinero   = char?.money ? formatearMonedero(char.money) : '—';

    const embed = new EmbedBuilder()
      .setTitle(`⚗️ Pociones — ${rareza}`)
      .setColor(0x9B59B6)
      .setDescription(`Tu monedero: **${dinero}**\n\nElige qué poción comprar:`)
      .addFields(pociones.slice(0,8).map(p => ({
        name: `${p.nombre} — **${p.precio} PO**`,
        value: p.efecto.slice(0, 100),
        inline: false,
      })));

    const opts = pociones.slice(0,25).map(p => ({
      label: p.nombre.slice(0,100),
      description: `${p.precio} PO — ${p.efecto.slice(0,60)}` || undefined,
      value: p.id,
    }));

    const rows = [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('alquimista_comprar')
          .setPlaceholder('Elige una poción para comprar...')
          .addOptions(opts)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('alquimista_volver').setLabel('← Volver').setStyle(ButtonStyle.Secondary)
      ),
    ];

    await interaction.update({ embeds: [embed], components: rows });
    return true;
  }

  // Select de poción → confirmar compra
  if (interaction.isStringSelectMenu() && id === 'alquimista_comprar') {
    const pocionId = interaction.values[0];
    const pocion   = POCIONES.find(p => p.id === pocionId);
    const char     = getCharacter(interaction.user.id);

    if (!pocion) { await interaction.reply({ content: '❌ Poción no encontrada.', ephemeral: true }); return true; }
    if (!char)   { await interaction.reply({ content: '❌ Sin personaje.', ephemeral: true }); return true; }

    const dinero = char.money || { PC:0,PP:0,PE:0,PO:0,PT:0 };
    if (totalEnPC(dinero) < pocion.precio * 100) {
      await interaction.reply({ content: `❌ No tienes suficiente dinero. Necesitas **${pocion.precio} PO**. Tienes: **${formatearMonedero(dinero)}**.`, ephemeral: true });
      return true;
    }

    const embed = new EmbedBuilder()
      .setTitle(`⚗️ Confirmar compra: ${pocion.nombre}`)
      .setColor(0x9B59B6)
      .setDescription(
        `**${pocion.nombre}** (${pocion.rareza})\n\n` +
        `${pocion.efecto}\n\n` +
        `**Precio:** ${pocion.precio} PO\n` +
        `Tu saldo: ${formatearMonedero(dinero)}`
      );

    const rows = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`alquimista_confirmar_${pocionId}`).setLabel(`Comprar — ${pocion.precio} PO`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('alquimista_volver').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
      ),
    ];

    await interaction.update({ embeds: [embed], components: rows });
    return true;
  }

  // Botón confirmar compra
  if (interaction.isButton() && id.startsWith('alquimista_confirmar_')) {
    const pocionId = id.replace('alquimista_confirmar_', '');
    const pocion   = POCIONES.find(p => p.id === pocionId);
    const char     = getCharacter(interaction.user.id);

    if (!pocion || !char) { await interaction.update({ content: '❌ Error.', embeds: [], components: [] }); return true; }

    const nuevoMonedero = pagar(char.money || {PC:0,PP:0,PE:0,PO:0,PT:0}, pocion.precio);
    if (!nuevoMonedero) {
      await interaction.update({ content: `❌ Fondos insuficientes.`, embeds: [], components: [] });
      return true;
    }

    const inv = [...(char.inventory || [])];
    const existente = inv.findIndex(i => i.nombre === pocion.nombre);
    if (existente !== -1) {
      inv[existente] = { ...inv[existente], cantidad: inv[existente].cantidad + 1 };
    } else {
      inv.push({
        nombre:      pocion.nombre,
        cantidad:    1,
        peso:        0.5,
        precio:      pocion.precio,
        categoria:   'Poción',
        rareza:      pocion.rareza,
        descripcion: pocion.efecto,
      });
    }

    updateCharacter(interaction.user.id, { inventory: inv, money: nuevoMonedero });

    const embed = new EmbedBuilder()
      .setTitle('✅ Compra realizada')
      .setColor(0x2ECC71)
      .setDescription(
        `Has comprado **${pocion.nombre}** por **${pocion.precio} PO**.\n\n` +
        `*${pocion.efecto}*\n\n` +
        `Saldo restante: **${formatearMonedero(nuevoMonedero)}**`
      );

    await interaction.update({ embeds: [embed], components: [] });
    return true;
  }

  // Botón volver
  if (interaction.isButton() && id === 'alquimista_volver') {
    await cmdAlquimista(interaction);
    return true;
  }

  return false;
}

module.exports = {
  cmdDmAbrirAlquimista,
  cmdDmCerrarAlquimista,
  cmdAlquimista,
  handleAlquimistaInteraction,
};
