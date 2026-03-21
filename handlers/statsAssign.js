// ── handlers/statsAssign.js ───────────────────────────────────────────────────
// Sistema de tirada y asignación de estadísticas
//
// Diseño:
//   - 7 botones con los números tirados (2 filas: 4+3)
//   - Select de stat activa (cuál stat estás asignando ahora)
//   - 3 botones de reroll individual para la stat seleccionada (1 uso c/u)
//   - Botón de reroll total
//   - Botón confirmar (solo cuando todas están asignadas)
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');

const { RACES }      = require('../data/races.js');
const { getSession } = require('../utils/sessions.js');
const { statMod, applyRacialBonuses, safeUpdate } = require('../utils/helpers.js');

const STAT_KEYS  = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const STAT_ES    = { STR: 'FUE', DEX: 'DES', CON: 'CON', INT: 'INT', WIS: 'SAB', CHA: 'CAR' };
const STAT_EMOJI = { STR: '💪', DEX: '🏃', CON: '🫀', INT: '🧠', WIS: '🦉', CHA: '✨' };

function tirarUno() {
  const dados = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  dados.sort((a, b) => a - b);
  return { valor: dados[1] + dados[2] + dados[3], dados, drop: dados[0] };
}

function tirarPool() {
  const pool = Array.from({ length: 7 }, () => tirarUno());
  let minIdx = 0;
  for (let i = 1; i < pool.length; i++) {
    if (pool[i].valor < pool[minIdx].valor) minIdx = i;
  }
  pool[minIdx].descartado = true;
  return pool;
}

function mstr(v) { const m = statMod(v); return (typeof m === 'string' ? m : (m >= 0 ? '+' + m : '' + m)); }

// ─── Pantalla principal ───────────────────────────────────────────────────────
async function showStatsAssign(interaction, userId) {
  const session = getSession(userId);
  const char    = session.character;

  if (!session.statsPool) {
    session.statsPool     = tirarPool();
    session.statsAssigned = {};   // { STATKEY: poolIndex }
    session.rerollsTotal  = 1;
    session.rerollsIndiv  = 3;    // 3 rerolls individuales compartidos
    session.statsPicking  = null;
  }

  const pool     = session.statsPool;
  const assigned = session.statsAssigned;
  const usedIdx  = new Set(Object.values(assigned));

  // ── Embed ──────────────────────────────────────────────────────────────────
  const embed = new EmbedBuilder()
    .setTitle('🎲 Asignación de Estadísticas')
    .setColor(0xDAA520)
    .setDescription(
      `**${char.name}** — ${char.race} ${char.class}\n\n` +
      `Pulsa un botón con el número para asignarlo a la stat seleccionada.\n` +
      `*Los bonos raciales se aplican al confirmar.*`
    );

  // Tabla de asignación (todas las stats en una sola field)
  const asignLines = STAT_KEYS.map(k => {
    const idx = assigned[k];
    const selMarca = session.statsPicking === k ? ' ◀ eligiendo' : '';
    if (idx !== undefined) {
      const val = pool[idx].valor;
      return `${STAT_EMOJI[k]} **${STAT_ES[k]}**: **${val}** (${mstr(val)}) ✅${selMarca}`;
    }
    return `${STAT_EMOJI[k]} **${STAT_ES[k]}**: —${selMarca}`;
  });
  embed.addFields({ name: '📊 Estadísticas', value: asignLines.join('\n'), inline: true });

  // Pool de dados (qué hay disponible)
  const poolLines = pool.map((r, i) => {
    if (r.descartado) return `~~${r.valor}~~ ✗`;
    const asignadaA = Object.entries(assigned).find(([, v]) => v === i);
    if (asignadaA) return `**${r.valor}** → ${STAT_ES[asignadaA[0]]} ✅`;
    return `**${r.valor}**`;
  }).join('  ');
  embed.addFields({ name: '🎲 Pool (7 dados — se descarta el menor)', value: poolLines, inline: false });

  // Bonos raciales
  const raceData = RACES[char.race];
  if (raceData?.bonuses) {
    const bt = raceData.bonuses.all
      ? `+${raceData.bonuses.all} a todas`
      : Object.entries(raceData.bonuses).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', ');
    if (bt) embed.addFields({ name: '🧬 Bonos raciales', value: bt, inline: true });
  }

  // Instrucción de stat activa
  if (session.statsPicking) {
    const idx = assigned[session.statsPicking];
    const valActual = idx !== undefined ? pool[idx].valor : null;
    embed.addFields({
      name: `📌 Asignando: ${STAT_EMOJI[session.statsPicking]} ${STAT_ES[session.statsPicking]}`,
      value: valActual !== null
        ? `Valor actual: **${valActual}** — pulsa un botón de número para cambiar, o usa un Reroll Individual.`
        : `Sin valor — pulsa uno de los botones de número disponibles.`,
      inline: false,
    });
  }

  // ── Componentes ────────────────────────────────────────────────────────────
  // Discord permite máximo 5 filas de componentes.
  // Fila 1: Select de stat activa
  // Fila 2: Botones dados 0-3 (valores del pool)
  // Fila 3: Botones dados 4-6 + Reroll Total
  // Fila 4: 3 Botones de Reroll Individual + Confirmar (si aplica)

  const rows = [];
  const todasAsignadas = STAT_KEYS.every(k => assigned[k] !== undefined);

  // ── Fila 1: Select de stat ──────────────────────────────────────────────
  if (!todasAsignadas || session.statsPicking) {
    const statOpts = STAT_KEYS.map(k => {
      const idx = assigned[k];
      if (idx !== undefined) {
        const val = pool[idx].valor;
        return { label: `${STAT_ES[k]} = ${val} (${mstr(val)}) ✅`, value: k, default: session.statsPicking === k,
                 description: 'Ya asignada — elige para cambiar' };
      }
      return { label: `${STAT_EMOJI[k]} ${STAT_ES[k]} — sin asignar`, value: k, default: session.statsPicking === k };
    });
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('stats_pick_stat')
        .setPlaceholder('1. Elige la estadística que quieres asignar...')
        .addOptions(statOpts)
    ));
  }

  // ── Filas 2 y 3: Botones de dados ───────────────────────────────────────
  // Fila 2: dados 0-3 (max 4 para dejar espacio)
  // Fila 3: dados 4-6 + reroll total
  const disponibles = pool.map((r, i) => ({ ...r, idx: i })).filter(r => !r.descartado && !usedIdx.has(r.idx));
  const dispIdxSet  = new Set(disponibles.map(r => r.idx));

  const fila2 = [], fila3 = [];

  pool.forEach((r, i) => {
    const asignadaA = Object.entries(assigned).find(([, v]) => v === i)?.[0];
    let label, style, disabled;

    if (r.descartado) {
      label    = `✗ ${r.valor}`;
      style    = ButtonStyle.Secondary;
      disabled = true;
    } else if (asignadaA) {
      label    = `${STAT_ES[asignadaA]} ${r.valor}`;
      style    = ButtonStyle.Success;
      // Solo habilitado si hay una stat seleccionada diferente (para reasignar)
      disabled = !session.statsPicking || session.statsPicking === asignadaA;
    } else {
      label    = `${r.valor}`;
      style    = session.statsPicking ? ButtonStyle.Primary : ButtonStyle.Secondary;
      disabled = !session.statsPicking;
    }

    const btn = new ButtonBuilder()
      .setCustomId(`stats_asignar_${i}`)
      .setLabel(label)
      .setStyle(style)
      .setDisabled(disabled);

    if (i < 4) fila2.push(btn);
    else fila3.push(btn);
  });

  if (fila2.length) rows.push(new ActionRowBuilder().addComponents(...fila2));

  // Fila 3: dados 4-6 + reroll total
  const btnRerollTotal = new ButtonBuilder()
    .setCustomId('stats_reroll_total')
    .setLabel(`🔄 Retirar todo (${session.rerollsTotal})`)
    .setStyle(ButtonStyle.Danger)
    .setDisabled(session.rerollsTotal <= 0);
  fila3.push(btnRerollTotal);
  if (fila3.length) rows.push(new ActionRowBuilder().addComponents(...fila3));

  // ── Fila 4: 3 botones de reroll individual + confirmar ───────────────────
  const fila4 = [];

  // Los 3 botones de reroll individual — cada uno representa 1 uso
  // Solo se habilitan cuando hay stat seleccionada con valor asignado
  const canReroll = session.statsPicking && assigned[session.statsPicking] !== undefined;
  for (let r = 0; r < 3; r++) {
    const usado = r >= session.rerollsIndiv;
    fila4.push(
      new ButtonBuilder()
        .setCustomId(`stats_reroll_indiv_${r}`)
        .setLabel(usado ? `🎲 Reroll ${r+1} ✓` : `🎲 Reroll ${r+1}`)
        .setStyle(usado ? ButtonStyle.Secondary : ButtonStyle.Primary)
        .setDisabled(usado || !canReroll)
    );
  }

  if (todasAsignadas) {
    fila4.push(
      new ButtonBuilder()
        .setCustomId('stats_confirm')
        .setLabel('✅ Confirmar')
        .setStyle(ButtonStyle.Success)
    );
  }

  if (fila4.length) rows.push(new ActionRowBuilder().addComponents(...fila4));

  const payload = { embeds: [embed], components: rows };
  if (interaction.replied || interaction.deferred) {
    await safeUpdate(interaction, payload);
  } else {
    await interaction.reply({ ...payload, ephemeral: true });
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
async function handleStatsAssignInteraction(interaction) {
  const userId  = interaction.user.id;
  const session = getSession(userId);
  if (!session?.statsPool) return false;

  // Select: elegir stat activa
  if (interaction.isStringSelectMenu() && interaction.customId === 'stats_pick_stat') {
    session.statsPicking = interaction.values[0];
    await showStatsAssign(interaction, userId);
    return true;
  }

  // Botón: asignar valor de un dado a la stat activa
  if (interaction.isButton() && interaction.customId.startsWith('stats_asignar_')) {
    const idx  = parseInt(interaction.customId.split('_')[2]);
    const stat = session.statsPicking;

    if (!stat) {
      await interaction.reply({ content: '❌ Primero selecciona una estadística en el menú.', ephemeral: true });
      return true;
    }
    const r = session.statsPool[idx];
    if (!r || r.descartado) {
      await interaction.reply({ content: '❌ Ese dado fue descartado.', ephemeral: true });
      return true;
    }
    // Si el índice ya está asignado a otra stat, liberarla primero
    for (const [k, v] of Object.entries(session.statsAssigned)) {
      if (v === idx && k !== stat) delete session.statsAssigned[k];
    }
    session.statsAssigned[stat] = idx;
    session.statsPicking = null;
    await showStatsAssign(interaction, userId);
    return true;
  }

  // Botón: reroll total
  if (interaction.isButton() && interaction.customId === 'stats_reroll_total') {
    if (session.rerollsTotal <= 0) {
      await interaction.reply({ content: '❌ Sin rerolls totales.', ephemeral: true });
      return true;
    }
    session.statsPool     = tirarPool();
    session.statsAssigned = {};
    session.statsPicking  = null;
    session.rerollsTotal--;
    await showStatsAssign(interaction, userId);
    return true;
  }

  // Botón: reroll individual (stats_reroll_indiv_0, _1, _2)
  if (interaction.isButton() && interaction.customId.startsWith('stats_reroll_indiv_')) {
    if (session.rerollsIndiv <= 0) {
      await interaction.reply({ content: '❌ Sin rerolls individuales.', ephemeral: true });
      return true;
    }
    const stat = session.statsPicking;
    if (!stat) {
      await interaction.reply({ content: '❌ Selecciona una estadística primero.', ephemeral: true });
      return true;
    }
    const idxAnterior = session.statsAssigned[stat];
    if (idxAnterior === undefined) {
      await interaction.reply({ content: '❌ Asigna primero un valor a esa stat para poder retirarlo.', ephemeral: true });
      return true;
    }

    // Reemplazar ese dado
    session.statsPool[idxAnterior] = tirarUno();
    delete session.statsAssigned[stat];

    // Recalcular mínimo descartado
    session.statsPool.forEach(r => { r.descartado = false; });
    let minIdx = 0;
    for (let i = 1; i < session.statsPool.length; i++) {
      if (session.statsPool[i].valor < session.statsPool[minIdx].valor) minIdx = i;
    }
    session.statsPool[minIdx].descartado = true;
    // Liberar stats que apuntaban al nuevo descartado
    for (const [k, v] of Object.entries(session.statsAssigned)) {
      if (v === minIdx) delete session.statsAssigned[k];
    }

    session.rerollsIndiv--;
    session.statsPicking = null;
    await showStatsAssign(interaction, userId);
    return true;
  }

  // Botón: confirmar
  if (interaction.isButton() && interaction.customId === 'stats_confirm') {
    const char     = session.character;
    const pool     = session.statsPool;
    const assigned = session.statsAssigned;

    const baseStats = {
      STR: pool[assigned.STR]?.valor ?? 10,
      DEX: pool[assigned.DEX]?.valor ?? 10,
      CON: pool[assigned.CON]?.valor ?? 10,
      INT: pool[assigned.INT]?.valor ?? 10,
      WIS: pool[assigned.WIS]?.valor ?? 10,
      CHA: pool[assigned.CHA]?.valor ?? 10,
    };

    const finalStats  = applyRacialBonuses(baseStats, char.race);
    char.rolledStats  = baseStats;
    char.finalStats   = finalStats;
    char.stats        = finalStats;

    delete session.statsPool;
    delete session.statsAssigned;
    delete session.statsPicking;
    delete session.rerollsTotal;
    delete session.rerollsIndiv;

    const { showSkillsSelection } = require('./creation.js');
    await showSkillsSelection(interaction, char);
    return true;
  }

  // Compatibilidad con botones viejos
  if (interaction.isButton() && (interaction.customId === 'stats_noop' || interaction.customId === 'accept_stats')) {
    await interaction.deferUpdate();
    return true;
  }

  return false;
}

module.exports = { showStatsAssign, handleStatsAssignInteraction };
