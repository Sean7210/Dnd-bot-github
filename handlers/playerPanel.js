// ── handlers/playerPanel.js ───────────────────────────────────────────────────
// Comandos del jugador para gestionar su propio personaje
//
//  /mi-personaje     → Ver su ficha completa
//  /subir-nivel      → Reajustar stats al recibir una ASI del DM
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

const { getCharacter, updateCharacter, saveCharacter } = require('../db/characterStore.js');
const { CLASSES }  = require('../data/classes.js');

// Responde correctamente si la interacción ya fue deferrida
async function rep(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply({ ...payload, ephemeral: true });
}
const { RACES }    = require('../data/races.js');
const { DOTES }    = require('../data/feats.js');
const { statMod, calcHP, buildCharacterEmbed, safeReply } = require('../utils/helpers.js');
const { formatearMonedero } = require('../data/startingWealth.js');

const STAT_KEYS   = ['STR','DEX','CON','INT','WIS','CHA'];
const STAT_LABELS = { STR:'💪 FUE', DEX:'🏃 DES', CON:'🫀 CON', INT:'🧠 INT', WIS:'🦉 SAB', CHA:'✨ CAR' };

// ─── /mi-personaje ────────────────────────────────────────────────────────────
async function cmdMiPersonaje(interaction) {
  const char = getCharacter(interaction.user.id);

  if (!char) {
    return interaction.reply({
      content: '📭 No tienes ningún personaje guardado. Usa `/personaje` para crear uno.',
      ephemeral: true,
    });
  }

  const embed = buildCharacterEmbed(char, `⚔️ ${char.name}`);
  embed.setColor(0x2E8B57);

  // HP actual
  const cls    = CLASSES[char.class];
  const hpMax  = char.hpMax || char.hpOverride || (cls ? calcHP(cls, char.finalStats?.CON ?? 10) : 0);
  const hpActual = char.hpActual ?? hpMax;
  const hpPct  = hpMax > 0 ? hpActual / hpMax : 1;
  const hpColor = hpPct <= 0 ? '💀' : hpPct <= 0.25 ? '🔴' : hpPct <= 0.5 ? '🟡' : '💚';
  embed.addFields({ name: `${hpColor} Puntos de Golpe`, value: `**${hpActual} / ${hpMax}**`, inline: true });

  // Monedero
  const money = char.money || { PC:0, PP:0, PE:0, PO:0, PT:0 };
  embed.addFields({ name: '💰 Monedero', value: formatearMonedero(money), inline: true });

  // Idiomas
  if (char.languages?.length) {
    embed.addFields({ name: '🗣️ Idiomas', value: char.languages.join(', '), inline: false });
  }

  // Inventario resumido
  const inv = char.inventory || [];
  if (inv.length) {
    const str    = char.finalStats?.STR || 10;
    const peso   = inv.reduce((s, i) => s + ((i.peso || 0) * (i.cantidad || 1)), 0);
    const limite = str * 15;
    const resumen = inv.slice(0, 8).map(i => `• ${i.nombre} ×${i.cantidad}`).join('\n')
      + (inv.length > 8 ? `\n*...y ${inv.length - 8} más*` : '');
    embed.addFields({ name: `🎒 Inventario (${peso.toFixed(1)}/${limite} lb)`, value: resumen, inline: false });
  }

  // Dotes
  if (char.feats?.length) {
    embed.addFields({ name: '🌟 Dotes', value: char.feats.join(', '), inline: false });
  }

  // Aviso nivel pendiente
  if (char.pendingLevelUp) {
    embed.addFields({
      name:  '⚠️ Acción pendiente',
      value: `Has subido al nivel **${char.level}**. Usa \`/subir-nivel\` para aplicar tus mejoras.`,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── /subir-nivel ─────────────────────────────────────────────────────────────
async function cmdSubirNivel(interaction) {
  const char = getCharacter(interaction.user.id);

  if (!char)
    return rep(interaction, { content: '❌ No tienes ningún personaje guardado.' });

  if (!char.pendingLevelUp)
    return rep(interaction, {
      content: `**${char.name}** (nivel ${char.level}) no tiene subida de nivel pendiente. El DM debe otorgártela primero.`,
    });

  // Mostrar pantalla de tirada de dado de golpe
  await showTiradaDadoGolpe(interaction, char);
}

// ─── Tirada de dado de golpe ──────────────────────────────────────────────────
async function showTiradaDadoGolpe(interaction, char) {
  const cls    = CLASSES[char.class] || {};
  const hitDie = cls.hitDie || 6;
  const modCON = Math.floor(((char.finalStats?.CON ?? 10) - 10) / 2);
  const nivel  = char.level || 1;
  const profBonus = Math.ceil(nivel/4)+1;

  const desc = '**Clase:** ' + char.class + ' — Dado de golpe: **d' + hitDie + '**\n' +
    '**Mod CON:** ' + (modCON >= 0 ? '+' : '') + modCON + '\n\n' +
    'Pulsa el boton para tirar tu **d' + hitDie + '** y ver cuantos HP ganas.\n\n' +
    '*Posible resultado: ' + (1 + modCON) + ' – ' + (hitDie + modCON) + ' HP adicionales*';

  const embed = new EmbedBuilder()
    .setTitle('Nivel ' + nivel + ' — ' + char.name)
    .setColor(0xFFD700)
    .setDescription(desc)
    .addFields(
      { name: 'HP actuales', value: (char.hpActual||0) + '/' + (char.hpMax||0), inline: true },
      { name: 'Bono competencia', value: '+' + profBonus, inline: true },
    )
    .setFooter({ text: 'El dado de golpe de ' + char.class + ' es d' + hitDie });

  await rep(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nivel_tirar_dado_golpe')
        .setLabel('Tirar d' + hitDie + ' + CON (' + (modCON>=0?'+':'') + modCON + ')')
        .setStyle(ButtonStyle.Success)
    )],
  });
}

// ─── Paso 1 de ASI: elegir modo (+2 a una / +1 a dos / dote) ─────────────────
async function showASIChoice(interaction, char) {
  const stats = char.finalStats ?? {};
  const statsText = STAT_KEYS
    .map(k => `${STAT_LABELS[k]}: **${stats[k] ?? 10}** (${statMod(stats[k] ?? 10)})`)
    .join('  ');

  const embed = new EmbedBuilder()
    .setTitle(`⬆️ Mejora de Puntuación de Característica — Nivel ${char.level}`)
    .setColor(0x9370DB)
    .setDescription(
      `**${char.name}**, elige cómo distribuir tu mejora de nivel ${char.level}:\n\n` +
      `📊 **Stats actuales:**\n${statsText}`
    )
    .addFields({
      name: '¿Qué puedes hacer?',
      value:
        '**+2 a una stat** — Sube una puntuación de característica en 2 puntos (máx 20).\n' +
        '**+1/+1 a dos stats** — Sube dos puntuaciones diferentes en 1 punto cada una (máx 20).\n' +
        '**Tomar una dote** — Elige una dote del Manual del Jugador (requiere requisitos).',
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('asi_plus2').setLabel('+2 a una stat').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('asi_plus1x2').setLabel('+1/+1 a dos stats').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('asi_feat').setLabel('Tomar una dote').setStyle(ButtonStyle.Secondary),
  );

  const payload = { embeds: [embed], components: [row] };
  if (interaction.replied || interaction.deferred) {
    await interaction.editReply(payload);
  } else {
    await interaction.reply({ ...payload, ephemeral: true });
  }
}

// ─── Paso 2a: +2 a una stat ───────────────────────────────────────────────────
async function showASIPlus2(interaction) {
  const char  = getCharacter(interaction.user.id);
  const stats = char.finalStats ?? {};

  const options = STAT_KEYS
    .filter(k => (stats[k] ?? 10) < 20)           // solo las que no están al máximo
    .map(k => ({
      label:       `${STAT_LABELS[k].replace(/./u, '').trim()} (${stats[k] ?? 10} → ${Math.min((stats[k] ?? 10) + 2, 20)})`,
      description: `De ${stats[k] ?? 10} a ${Math.min((stats[k] ?? 10) + 2, 20)}`,
      value:       `plus2_${k}`,
    }));

  if (!options.length) {
    return interaction.update({
      embeds: [new EmbedBuilder().setTitle('Todas tus stats están al máximo (20)').setColor(0xFF0000)],
      components: [],
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('⬆️ +2 a una Estadística')
    .setColor(0x4169E1)
    .setDescription('Elige la estadística que quieres subir en **2 puntos**:');

  await interaction.update({
    embeds:     [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('asi_select_plus2')
        .setPlaceholder('Elige una estadística...')
        .addOptions(options)
    )],
  });
}

// ─── Paso 2b: +1 a dos stats ─────────────────────────────────────────────────
async function showASIPlus1x2(interaction) {
  const char  = getCharacter(interaction.user.id);
  const stats = char.finalStats ?? {};

  const options = STAT_KEYS
    .filter(k => (stats[k] ?? 10) < 20)
    .map(k => ({
      label:       `${STAT_LABELS[k].replace(/./u, '').trim()} (${stats[k] ?? 10} → ${Math.min((stats[k] ?? 10) + 1, 20)})`,
      description: `De ${stats[k] ?? 10} a ${Math.min((stats[k] ?? 10) + 1, 20)}`,
      value:       `plus1_${k}`,
    }));

  if (options.length < 2) {
    return interaction.update({
      embeds: [new EmbedBuilder().setTitle('No hay suficientes stats disponibles para mejorar.').setColor(0xFF0000)],
      components: [],
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('⬆️ +1 a Dos Estadísticas')
    .setColor(0x20B2AA)
    .setDescription('Elige **2 estadísticas** diferentes que quieres subir en 1 punto cada una:');

  await interaction.update({
    embeds:     [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('asi_select_plus1x2')
        .setPlaceholder('Elige 2 estadísticas...')
        .setMinValues(2).setMaxValues(2)
        .addOptions(options)
    )],
  });
}

// ─── Paso 2c: elegir dote ─────────────────────────────────────────────────────
async function showASIFeat(interaction) {
  const char  = getCharacter(interaction.user.id);

  // Solo dotes del MdJ (sin requisito de raza) para mayor simplicidad
  const disponibles = DOTES.filter(d =>
    !d.requisito || d.requisito === 'Ninguno' ||
    d.requisito?.toLowerCase().includes('lanzador') ||
    d.requisito?.toLowerCase().includes('nivel') ||
    d.requisito?.toLowerCase().includes('competencia') ||
    ['MdJ', 'Tasha'].includes(d.fuente)
  ).slice(0, 25);

  const options = disponibles.map(d => ({
    label:       d.nombre.slice(0, 100),
    description: (d.requisito ? `Req: ${d.requisito.slice(0, 80)}` : (d.descripcion||'').slice(0, 80)) || undefined,
    value:       `feat_${d.nombre}`,
  }));

  const embed = new EmbedBuilder()
    .setTitle('🌟 Elegir una Dote')
    .setColor(0xDAA520)
    .setDescription(
      `En lugar de mejorar estadísticas, puedes tomar **una dote**.\n\n` +
      `⚠️ El DM puede vetar dotes que no se ajusten al juego.\n\n` +
      `Mostrando dotes generales (MdJ + Tasha's). Para dotes raciales o de otras fuentes, habla con tu DM.`
    );

  await interaction.update({
    embeds:     [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('asi_select_feat')
        .setPlaceholder('Elige una dote...')
        .addOptions(options)
    )],
  });
}

// ─── Aplicar ASI: +2 ─────────────────────────────────────────────────────────
async function applyASIPlus2(interaction, statKey) {
  const char  = getCharacter(interaction.user.id);
  const stats = { ...(char.finalStats ?? {}) };
  const old   = stats[statKey] ?? 10;
  stats[statKey] = Math.min(old + 2, 20);

  updateCharacter(interaction.user.id, {
    finalStats:     stats,
    stats:          stats,
    pendingLevelUp: false,
    pendingASI:     false,
  });

  const cls = CLASSES[char.class];
  const embed = new EmbedBuilder()
    .setTitle(`✅ ¡Mejora aplicada! — ${char.name} nivel ${char.level}`)
    .setColor(0x00CC00)
    .setDescription(`**${STAT_LABELS[statKey]}** ha subido de **${old}** a **${stats[statKey]}** (${statMod(stats[statKey])}).`)
    .addFields(
      { name: '📊 Stats actualizadas', value: formatStats(stats), inline: false },
      { name: '💡 Recuerda',           value: `Tira tu dado de golpe **d${cls?.hitDie ?? 6}** + mod CON para calcular los nuevos HP máximos.`, inline: false },
    );

  await interaction.update({ embeds: [embed], components: [] });
}

// ─── Aplicar ASI: +1/+1 ──────────────────────────────────────────────────────
async function applyASIPlus1x2(interaction, statKeys) {
  const char  = getCharacter(interaction.user.id);
  const stats = { ...(char.finalStats ?? {}) };
  const changes = [];

  for (const key of statKeys) {
    const old = stats[key] ?? 10;
    stats[key] = Math.min(old + 1, 20);
    changes.push(`**${STAT_LABELS[key]}**: ${old} → **${stats[key]}** (${statMod(stats[key])})`);
  }

  updateCharacter(interaction.user.id, {
    finalStats:     stats,
    stats:          stats,
    pendingLevelUp: false,
    pendingASI:     false,
  });

  const cls = CLASSES[char.class];
  const embed = new EmbedBuilder()
    .setTitle(`✅ ¡Mejoras aplicadas! — ${char.name} nivel ${char.level}`)
    .setColor(0x00CC00)
    .setDescription(changes.join('\n'))
    .addFields(
      { name: '📊 Stats actualizadas', value: formatStats(stats), inline: false },
      { name: '💡 Recuerda',           value: `Tira tu dado de golpe **d${cls?.hitDie ?? 6}** + mod CON para calcular los nuevos HP máximos.`, inline: false },
    );

  await interaction.update({ embeds: [embed], components: [] });
}

// ─── Aplicar dote ─────────────────────────────────────────────────────────────
async function applyFeat(interaction, featNombre) {
  const char  = getCharacter(interaction.user.id);
  const dote  = DOTES.find(d => d.nombre === featNombre);

  if (!dote) {
    return interaction.update({ content: '❌ Dote no encontrada.', embeds: [], components: [] });
  }

  const feats = [...(char.feats ?? []), dote.nombre];
  updateCharacter(interaction.user.id, {
    feats:          feats,
    pendingLevelUp: false,
    pendingASI:     false,
  });

  const embed = new EmbedBuilder()
    .setTitle(`✅ Dote obtenida — ${char.name} nivel ${char.level}`)
    .setColor(0xDAA520)
    .setDescription(`**${dote.nombre}** ha sido añadida a la ficha de **${char.name}**.`)
    .addFields(
      { name: '📚 Fuente',        value: dote.fuente,                 inline: true },
      { name: '📋 Prerrequisito', value: dote.requisito ?? 'Ninguno', inline: true },
      { name: '✨ Descripción',   value: dote.descripcion,            inline: false },
      { name: '🌟 Dotes actuales', value: feats.join(', ') || '—',    inline: false },
    );

  await interaction.update({ embeds: [embed], components: [] });
}

// ─── ROUTER: maneja los botones/selects de nivel ─────────────────────────────
async function handleLevelUpInteraction(interaction) {
  // Botones del menú ASI
  if (interaction.isButton()) {
    if (interaction.customId === 'asi_plus2')   { await showASIPlus2(interaction);   return true; }
    if (interaction.customId === 'asi_plus1x2') { await showASIPlus1x2(interaction); return true; }
    if (interaction.customId === 'asi_feat')    { await showASIFeat(interaction);    return true; }
  }

  // Select menus de ASI
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'asi_select_plus2') {
      const statKey = interaction.values[0].replace('plus2_', '');
      await applyASIPlus2(interaction, statKey);
      return true;
    }
    if (interaction.customId === 'asi_select_plus1x2') {
      const statKeys = interaction.values.map(v => v.replace('plus1_', ''));
      await applyASIPlus1x2(interaction, statKeys);
      return true;
    }
    if (interaction.customId === 'asi_select_feat') {
      const featNombre = interaction.values[0].replace('feat_', '');
      await applyFeat(interaction, featNombre);
      return true;
    }
  }

  return false;
}

// ─── Helper: formatear stats en bloque ───────────────────────────────────────
function formatStats(stats) {
  return STAT_KEYS
    .map(k => `${STAT_LABELS[k]}: **${stats[k] ?? 10}** (${statMod(stats[k] ?? 10)})`)
    .join('  ·  ');
}

module.exports = {
  cmdMiPersonaje,
  cmdSubirNivel,
  handleLevelUpInteraction,
};
