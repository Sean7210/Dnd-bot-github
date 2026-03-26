// ── handlers/magicItemsPanel.js ───────────────────────────────────────────────
// Gestión de objetos mágicos (ligados a cuenta Discord, no al personaje)
//
//  /mi-magia               → Ver tus objetos mágicos (slot 1-7)
//  /dm-dar-magia           → DM da objeto por id (1-100) o nombre
//  /dm-tirar-magia         → DM tira 1d100 y asigna objeto al azar
//  /dm-quitar-magia        → DM retira un objeto mágico
// ─────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { OBJETOS_MAGICOS }  = require('../data/magicItemsList.js');
const { getMagicItems, addMagicItem, removeMagicItem } = require('../db/magicItemsStore.js');
const { isDM } = require('./dmPanel.js');

// ─── /mi-magia ────────────────────────────────────────────────────────────────
async function cmdMiMagia(interaction) {
  const items = getMagicItems(interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle(`✨ Objetos Mágicos — ${interaction.user.displayName}`)
    .setColor(0x9B59B6)
    .setDescription(
      items.length === 0
        ? '*No tienes objetos mágicos. El DM puede darte uno con `/dm-dar-magia` o `/dm-tirar-magia`.*'
        : `Tienes **${items.length}/7** slots de objetos mágicos ocupados.`
    );

  if (items.length > 0) {
    items.forEach((item, i) => {
      embed.addFields({
        name:  `Slot ${i + 1} — #${item.id} ${item.nombre}`,
        value: item.desc,
        inline: false,
      });
    });
  }

  // Mostrar slots vacíos
  for (let i = items.length; i < 7; i++) {
    embed.addFields({ name: `Slot ${i + 1}`, value: '*Vacío*', inline: true });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── /dm-dar-magia ────────────────────────────────────────────────────────────
async function cmdDmDarMagia(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM puede dar objetos mágicos.', ephemeral: true });

  const target = interaction.options.getUser('usuario');
  const idOpt  = interaction.options.getInteger('id');
  const nombre = interaction.options.getString('nombre');

  let objeto = null;
  if (idOpt) {
    objeto = OBJETOS_MAGICOS[idOpt] ? { id: idOpt, ...OBJETOS_MAGICOS[idOpt] } : null;
  } else if (nombre) {
    const entry = Object.entries(OBJETOS_MAGICOS).find(([, v]) =>
      v.nombre.toLowerCase().includes(nombre.toLowerCase())
    );
    if (entry) objeto = { id: parseInt(entry[0]), ...entry[1] };
  }

  if (!objeto)
    return interaction.reply({ content: `❌ Objeto no encontrado. Usa un id del 1-100 o el nombre exacto.`, ephemeral: true });

  const resultado = addMagicItem(target.id, objeto);

  if (!resultado.ok) {
    const msg = resultado.razon === 'lleno'
      ? `❌ **${target.displayName}** ya tiene 7 objetos mágicos (slots llenos).`
      : `❌ **${target.displayName}** ya tiene **${objeto.nombre}**.`;
    return interaction.reply({ content: msg, ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('✨ Objeto mágico recibido')
    .setColor(0x9B59B6)
    .setDescription(`<@${target.id}> recibe el objeto mágico **#${objeto.id} — ${objeto.nombre}**.`)
    .addFields({ name: 'Descripción', value: objeto.desc, inline: false });

  await interaction.reply({ embeds: [embed] });
}

// ─── /dm-tirar-magia ─────────────────────────────────────────────────────────
async function cmdDmTirarMagia(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM puede asignar objetos mágicos.', ephemeral: true });

  const target = interaction.options.getUser('usuario');
  const dado   = Math.floor(Math.random() * 100) + 1;
  const objeto = { id: dado, ...OBJETOS_MAGICOS[dado] };

  const resultado = addMagicItem(target.id, objeto);

  if (!resultado.ok) {
    const msg = resultado.razon === 'lleno'
      ? `❌ **${target.displayName}** ya tiene 7 objetos mágicos.`
      : `❌ **${target.displayName}** ya tiene **${objeto.nombre}** (id #${dado}).`;
    return interaction.reply({ content: msg, ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎲 Tirada de objeto mágico — d100: **${dado}**`)
    .setColor(0x9B59B6)
    .setDescription(`<@${target.id}> recibe **#${objeto.id} — ${objeto.nombre}**.`)
    .addFields({ name: 'Descripción', value: objeto.desc, inline: false });

  await interaction.reply({ embeds: [embed] });
}

// ─── /dm-quitar-magia ────────────────────────────────────────────────────────
async function cmdDmQuitarMagia(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM puede retirar objetos mágicos.', ephemeral: true });

  const target = interaction.options.getUser('usuario');
  const idOpt  = interaction.options.getInteger('id');
  const items  = getMagicItems(target.id);

  const item = items.find(i => i.id === idOpt);
  if (!item)
    return interaction.reply({ content: `❌ **${target.displayName}** no tiene el objeto #${idOpt}.`, ephemeral: true });

  removeMagicItem(target.id, idOpt);

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setTitle('🗑️ Objeto mágico retirado')
      .setColor(0x888888)
      .setDescription(`Se retiró **#${item.id} — ${item.nombre}** a <@${target.id}>.`)],
  });
}

// ─── /mi-magia-tirar — el jugador tira su propio d100 ────────────────────────
async function cmdMiMagiaTirar(interaction) {
  const uid   = interaction.user.id;
  const items = getMagicItems(uid);

  if (items.length >= 7)
    return interaction.reply({ content: '❌ Ya tienes 7 objetos mágicos (slots llenos). No puedes tirar más.', ephemeral: true });

  const dado   = Math.floor(Math.random() * 100) + 1;
  const objeto = { id: dado, ...OBJETOS_MAGICOS[dado] };

  const resultado = addMagicItem(uid, objeto);

  if (!resultado.ok) {
    return interaction.reply({
      content: resultado.razon === 'duplicado'
        ? `❌ Ya tienes **${objeto.nombre}** (sacaste ${dado} en el d100).`
        : `❌ Slots llenos.`,
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎲 Tu tirada de objeto mágico — d100: **${dado}**`)
    .setColor(0x9B59B6)
    .setDescription(`¡Obtuviste **#${objeto.id} — ${objeto.nombre}**!

${objeto.desc}`)
    .setFooter({ text: `Slots: ${items.length + 1}/7` });

  await interaction.reply({ embeds: [embed] });
}

module.exports = { cmdMiMagia, cmdMiMagiaTirar, cmdDmDarMagia, cmdDmTirarMagia, cmdDmQuitarMagia };
