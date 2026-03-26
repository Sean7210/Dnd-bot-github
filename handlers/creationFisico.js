// ── handlers/creationFisico.js ────────────────────────────────────────────────
// Creación de personaje en modo "físico" (papel)
// Flujo mejorado: Pantalla bienvenida → raza → clase → trasfondo → NOMBRE → stats → habilidades → idiomas → equipo
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

const { RACES }       = require('../data/races.js');
const { CLASSES }     = require('../data/classes.js');
const { BACKGROUNDS } = require('../data/backgrounds.js');
const { IDIOMAS_POR_RAZA, IDIOMAS_ELECCION_RAZA, IDIOMAS_POR_TRASFONDO, TODOS_IDIOMAS } = require('../data/languages.js');
const { applyRacialBonuses, getCategoryEmoji, racaNecesitaEleccionBonus, getBonusAnyInfo } = require('../utils/helpers.js');
const { getSession, deleteSession } = require('../utils/sessions.js');
const { saveCharacter } = require('../db/characterStore.js');
const { showWealthRoll } = require('./equipoInicial.js');

// Responder correctamente a cualquier tipo de interacción
async function rep(interaction, payload) {
  try {
    const esBoton  = interaction.isButton?.() || interaction.isStringSelectMenu?.() || interaction.isAnySelectMenu?.();
    const esModal  = interaction.isModalSubmit?.();
    if (esBoton && !interaction.replied && !interaction.deferred) {
      await interaction.update(payload);
    } else if (interaction.replied || interaction.deferred) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply({ ...payload, ephemeral: true });
    }
  } catch {
    try { await interaction.reply({ ...payload, ephemeral: true }); } catch (_) {}
  }
}

// ─── Pantalla de bienvenida mejorada ─────────────────────────────────────────
async function startFisico(interaction) {
  const uid     = interaction.user.id;
  const session = getSession(uid);
  session.character = {
    name:'', race:'', class:'', subclass:'', background:'',
    alignment:'Neutral Verdadero', skills:[], languages:[], inventory:[], money:{},
    level:1, _modoPapel:true,
  };
  session.step = 'race';

  const embed = new EmbedBuilder()
    .setTitle('📜 Registro de Personaje — Modo Físico')
    .setColor(0x8B4513)
    .setThumbnail('https://www.dndbeyond.com/avatars/thumbnails/6/340/1000/1000/636272677822884861.jpeg')
    .setDescription(
      '⚠️ *Esta opción es para jugadores que ya tienen su personaje creado en papel.*\n\n' +
      '**Pasos del registro:**\n' +
      '> 1️⃣ Raza\n' +
      '> 2️⃣ Clase y subclase\n' +
      '> 3️⃣ Trasfondo\n' +
      '> 4️⃣ **Nombre y backstory**\n' +
      '> 5️⃣ Estadísticas (selects de 3-18)\n' +
      '> 6️⃣ Habilidades\n' +
      '> 7️⃣ Idiomas\n' +
      '> 8️⃣ Equipo inicial\n\n' +
      'El DM puede verificar tus stats en cualquier momento con `/dm-ficha`.'
    )
    .setFooter({ text: 'D&D 5e • Modo Papel' });

  const categories = [...new Set(Object.values(RACES).map(r => r.category))];
  await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('fisico_select_race_category')
          .setPlaceholder('1️⃣ Elige tu categoría de raza...')
          .addOptions(categories.map(cat => ({
            label: getCategoryEmoji(cat) + ' ' + cat,
            value: cat,
          })))
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('fisico_cancelar').setLabel('✖ Cancelar').setStyle(ButtonStyle.Secondary)
      ),
    ],
    ephemeral: true,
  });
}

// ─── Selects de stats 3-18 ────────────────────────────────────────────────────
function sm(v) { const m = Math.floor((v-10)/2); return (m>=0?'+':'')+m; }

async function showFisicoStats1(interaction) {
  const session = getSession(interaction.user.id);
  if (!session.statsPapel) session.statsPapel = { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 };
  const sp   = session.statsPapel;
  const NUMS = Array.from({length:16}, (_,i) => i+3);

  const char = session.character;
  const { finalStats } = char;
  // Mostrar preview con bonos raciales si ya están elegidos
  const preview = finalStats
    ? `*Con bonos de ${char.race}: FUE${sp.STR} DES${sp.DEX} CON${sp.CON} INT${sp.INT} SAB${sp.WIS} CAR${sp.CHA}*`
    : '';

  function sel(stat, label) {
    return new StringSelectMenuBuilder()
      .setCustomId('fisico_stat_' + stat)
      .setPlaceholder(label + ': ' + sp[stat] + ' (' + sm(sp[stat]) + ')')
      .addOptions(NUMS.map(n => ({ label: n + ' (' + sm(n) + ')', value: String(n), default: sp[stat] === n })));
  }

  const embed = new EmbedBuilder()
    .setTitle('🎲 Estadísticas — Parte 1/2 (FUE, DES, CON, INT)')
    .setColor(0xDAA520)
    .setDescription(
      `**${char.name || 'Tu personaje'}** — ${char.race||'?'} ${char.class||'?'}\n\n` +
      'Selecciona el valor de cada estadística **(tal como aparece en tu ficha)**.\n' +
      preview
    )
    .addFields({
      name: '📊 Valores actuales',
      value:
        `💪 **FUE:** ${sp.STR} (${sm(sp.STR)}) · 🏃 **DES:** ${sp.DEX} (${sm(sp.DEX)}) · ` +
        `🫀 **CON:** ${sp.CON} (${sm(sp.CON)}) · 🧠 **INT:** ${sp.INT} (${sm(sp.INT)})\n` +
        `🦉 **SAB:** ${sp.WIS} (${sm(sp.WIS)}) · ✨ **CAR:** ${sp.CHA} (${sm(sp.CHA)})`,
    });

  await rep(interaction, {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(sel('STR', '💪 FUE')),
      new ActionRowBuilder().addComponents(sel('DEX', '🏃 DES')),
      new ActionRowBuilder().addComponents(sel('CON', '🫀 CON')),
      new ActionRowBuilder().addComponents(sel('INT', '🧠 INT')),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('fisico_stats_parte2').setLabel('→ SAB y CAR').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('fisico_stats_volver').setLabel('← Volver').setStyle(ButtonStyle.Secondary),
      ),
    ],
    ephemeral: true,
  });
}

async function showFisicoStats2(interaction) {
  const session = getSession(interaction.user.id);
  const sp      = session.statsPapel || { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 };
  const NUMS    = Array.from({length:16}, (_,i) => i+3);
  const char    = session.character;

  function sel(stat, label) {
    return new StringSelectMenuBuilder()
      .setCustomId('fisico_stat_' + stat)
      .setPlaceholder(label + ': ' + sp[stat] + ' (' + sm(sp[stat]) + ')')
      .addOptions(NUMS.map(n => ({ label: n + ' (' + sm(n) + ')', value: String(n), default: sp[stat] === n })));
  }

  const embed = new EmbedBuilder()
    .setTitle('🎲 Estadísticas — Parte 2/2 (SAB y CAR)')
    .setColor(0xDAA520)
    .setDescription(
      `**${char.name||'Tu personaje'}** — ${char.race||'?'} ${char.class||'?'}\n\n` +
      'Selecciona SAB y CAR, luego confirma.'
    )
    .addFields({
      name: '📊 Todos tus valores',
      value:
        `💪 FUE: **${sp.STR}** (${sm(sp.STR)}) · 🏃 DES: **${sp.DEX}** (${sm(sp.DEX)}) · ` +
        `🫀 CON: **${sp.CON}** (${sm(sp.CON)}) · 🧠 INT: **${sp.INT}** (${sm(sp.INT)})\n` +
        `🦉 SAB: **${sp.WIS}** (${sm(sp.WIS)}) · ✨ CAR: **${sp.CHA}** (${sm(sp.CHA)})`,
    });

  await rep(interaction, {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(sel('WIS', '🦉 SAB')),
      new ActionRowBuilder().addComponents(sel('CHA', '✨ CAR')),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('fisico_stats_confirmar').setLabel('✅ Confirmar estadísticas').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('fisico_stats_parte1').setLabel('← Volver').setStyle(ButtonStyle.Secondary),
      ),
    ],
    ephemeral: true,
  });
}

// ─── Habilidades ──────────────────────────────────────────────────────────────
async function showFisicoSkills(interaction, char) {
  const cls      = CLASSES[char.class] || {};
  const bgSkills = BACKGROUNDS[char.background]?.skills || [];
  const available = (cls.skills||[]).filter(s=>!bgSkills.includes(s)).slice(0,25);
  const numSkills = cls.numSkills || 2;

  if (!available.length) {
    char.skills = bgSkills;
    await showFisicoLanguages(interaction, char);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎯 Competencias de habilidad')
    .setColor(0x20B2AA)
    .setDescription(
      `**${char.name}** — ${char.class}\n\n` +
      `Elige **${numSkills}** habilidades de tu clase.\n\n` +
      `✅ *Del trasfondo (ya incluidas):* ${bgSkills.join(', ') || '(ninguna)'}`
    );

  await rep(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('fisico_select_skills')
        .setPlaceholder(`Elige ${numSkills} habilidades...`)
        .setMinValues(Math.min(numSkills, available.length))
        .setMaxValues(Math.min(numSkills, available.length))
        .addOptions(available.map(s => ({ label: s, value: s })))
    )],
    ephemeral: true,
  });
}

// ─── Idiomas ──────────────────────────────────────────────────────────────────
async function showFisicoLanguages(interaction, char) {
  const idiomasRaza    = IDIOMAS_POR_RAZA[char.race]       || ['Común'];
  const extraRaza      = IDIOMAS_ELECCION_RAZA[char.race]  || 0;
  const extraTrasfondo = IDIOMAS_POR_TRASFONDO[char.background] || 0;
  const totalExtra     = extraRaza + extraTrasfondo;
  const idiomasBase    = [...new Set(idiomasRaza)];

  if (totalExtra === 0) {
    char.languages = idiomasBase;
    await showWealthRoll(interaction, char);
    return;
  }

  const disponibles = (TODOS_IDIOMAS||[])
    .filter(l => !idiomasBase.includes(l) && l !== 'Uno a elección')
    .slice(0, 25);

  if (!disponibles.length) {
    char.languages = idiomasBase;
    await showWealthRoll(interaction, char);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🗣️ Idiomas adicionales')
    .setColor(0x4B0082)
    .setDescription(
      `**${char.name}** — ${char.race} ${char.class}\n\n` +
      `**Automáticos:** ${idiomasBase.join(', ')}\n\n` +
      `Puedes elegir **${totalExtra}** idioma${totalExtra>1?'s':''} adicional${totalExtra>1?'es':''}:`
    );

  await rep(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('fisico_select_languages')
        .setPlaceholder(`Elige ${totalExtra} idioma${totalExtra>1?'s':''}...`)
        .setMinValues(Math.min(totalExtra, disponibles.length))
        .setMaxValues(Math.min(totalExtra, disponibles.length))
        .addOptions(disponibles.map(l => ({ label: l, value: l })))
    )],
    ephemeral: true,
  });
}

// ─── Bonus raciales 'any' ─────────────────────────────────────────────────────
async function showFisicoBonusAny(interaction, char, idx = 0) {
  const session   = getSession(interaction.user.id);
  const pending   = session._bonusAnyPendiente || [];
  const b         = pending[idx];
  if (!b) {
    // Todos elegidos
    char._anyChoices = {};
    pending.forEach(b => { if (b.elegido) char._anyChoices[b.key] = b.elegido; });
    delete session._bonusAnyPendiente;
    await showFisicoStats1(interaction);
    return;
  }

  const STATS = ['STR','DEX','CON','INT','WIS','CHA'];
  const STAT_NAMES = { STR:'💪 Fuerza', DEX:'🏃 Destreza', CON:'🫀 Constitución', INT:'🧠 Inteligencia', WIS:'🦉 Sabiduría', CHA:'✨ Carisma' };

  const embed = new EmbedBuilder()
    .setTitle(`🧬 Bonus racial de ${char.race}`)
    .setColor(0x2ECC71)
    .setDescription(
      `Tu raza **${char.race}** te da **+${b.valor}** a una estadística de tu elección.\n\n` +
      `Elige a qué estadística aplicar este **+${b.valor}**:`
    );

  await rep(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('fisico_bonus_any_' + idx)
        .setPlaceholder('Elige una estadística...')
        .addOptions(STATS.map(s => ({ label: STAT_NAMES[s], value: s })))
    )],
    ephemeral: true,
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────
async function handleFisicoInteraction(interaction) {
  const id      = interaction.customId || '';
  const uid     = interaction.user.id;
  const session = getSession(uid);

  // Solo procesar si hay sesión de modo físico activa
  if (!session?.character?._modoPapel &&
      !id.startsWith('fisico_') && id !== 'fisico_cancelar') return false;

  // Cancelar
  if (id === 'fisico_cancelar') {
    deleteSession(uid);
    await interaction.update({ content: '✖ Registro cancelado.', embeds: [], components: [] });
    return true;
  }

  const char = session?.character;

  // Selects de stats
  if (interaction.isStringSelectMenu() && id.startsWith('fisico_stat_')) {
    const stat = id.replace('fisico_stat_', '');
    if (!session.statsPapel) session.statsPapel = { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 };
    session.statsPapel[stat] = parseInt(interaction.values[0]);
    if (stat === 'WIS' || stat === 'CHA') await showFisicoStats2(interaction);
    else await showFisicoStats1(interaction);
    return true;
  }

  // Bonus raciales any
  if (interaction.isStringSelectMenu() && id.startsWith('fisico_bonus_any_')) {
    const idx = parseInt(id.split('_').pop());
    if (!session._bonusAnyPendiente) return true;
    session._bonusAnyPendiente[idx].elegido = interaction.values[0];
    await showFisicoBonusAny(interaction, char, idx + 1);
    return true;
  }

  // Categoría de raza
  if (interaction.isStringSelectMenu() && id === 'fisico_select_race_category') {
    const razas = Object.entries(RACES).filter(([,r]) => r.category === interaction.values[0]);
    const embed = new EmbedBuilder()
      .setTitle('🧬 1️⃣ Elige tu raza')
      .setColor(0x2ECC71)
      .setDescription('Selecciona tu raza del listado:');
    await rep(interaction, {
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('fisico_select_race').setPlaceholder('Elige raza...')
          .addOptions(razas.slice(0,25).map(([n,r]) => {
            const opt = { label: n, value: n };
            if (r.desc) opt.description = r.desc.slice(0,100);
            return opt;
          }))
      )],
      ephemeral: true,
    });
    return true;
  }

  // Raza
  if (interaction.isStringSelectMenu() && id === 'fisico_select_race') {
    char.race = interaction.values[0];
    const embed = new EmbedBuilder()
      .setTitle('⚔️ 2️⃣ Elige tu clase')
      .setColor(0xE74C3C)
      .setDescription(`Raza elegida: **${char.race}**\n\nSelecciona tu clase:`);
    await rep(interaction, {
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('fisico_select_class').setPlaceholder('Elige clase...')
          .addOptions(Object.entries(CLASSES).slice(0,25).map(([n,c]) => {
            const opt = { label: (c.emoji||'⚔️') + ' ' + n, value: n };
            if (c.desc) opt.description = c.desc.slice(0,100);
            return opt;
          }))
      )],
      ephemeral: true,
    });
    return true;
  }

  // Clase
  if (interaction.isStringSelectMenu() && id === 'fisico_select_class') {
    char.class = interaction.values[0];
    // Subclase se elige con /obtener-subclase al llegar al nivel requerido
    await mostrarTrasfondo(interaction, char);
    return true;
  }

  // Subclase manejada por /obtener-subclase

  // Trasfondo
  if (interaction.isStringSelectMenu() && id === 'fisico_select_background') {
    char.background = interaction.values[0];
    // Pedir nombre después del trasfondo
    await pedirNombreFisico(interaction);
    return true;
  }

  // Modal de nombre
  if (interaction.isModalSubmit() && id === 'fisico_modal_nombre') {
    char.name      = interaction.fields.getTextInputValue('nombre').trim();
    char.backstory = interaction.fields.getTextInputValue('backstory') || '';
    // Después del nombre → bonus any si aplica, luego stats
    if (racaNecesitaEleccionBonus(char.race)) {
      const bonusInfo = getBonusAnyInfo(char.race);
      session._bonusAnyPendiente = bonusInfo.map(b => ({ ...b, elegido: null }));
      await showFisicoBonusAny(interaction, char, 0);
    } else {
      await showFisicoStats1(interaction);
    }
    return true;
  }

  // Botones de navegación de stats
  if (interaction.isButton() && id === 'fisico_stats_parte2') {
    await showFisicoStats2(interaction);
    return true;
  }
  if (interaction.isButton() && (id === 'fisico_stats_volver' || id === 'fisico_stats_parte1')) {
    await showFisicoStats1(interaction);
    return true;
  }

  // Confirmar stats
  if (interaction.isButton() && id === 'fisico_stats_confirmar') {
    const sp = session.statsPapel || { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 };
    const base  = { STR:sp.STR, DEX:sp.DEX, CON:sp.CON, INT:sp.INT, WIS:sp.WIS, CHA:sp.CHA };
    const final = applyRacialBonuses(base, char.race, char._anyChoices || {});
    char.rolledStats = base;
    char.finalStats  = final;
    char.stats       = final;
    delete session.statsPapel;
    // Calcular HP con las stats confirmadas y guardar snapshot
    try {
      const { calcHP } = require('../utils/helpers.js');
function getClaseData(cls) { const {CLASSES}=require('../data/classes.js'); if(CLASSES[cls]) return CLASSES[cls]; const n=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); const f=Object.entries(CLASSES).find(([k])=>n(k)===n(cls)); return f?f[1]:{hitDie:8}; }
      const { CLASSES } = require('../data/classes.js');
      const cls = getClaseData(char.class);
      char.hpMax    = calcHP(cls, final.CON ?? 10, char.level || 1);
      char.hpActual = char.hpMax;
      saveCharacter(uid, char, interaction.guildId);
    } catch (e) { console.error('[creationFisico] snapshot error:', e.message); }
    await showFisicoSkills(interaction, char);
    return true;
  }

  // Habilidades
  if (interaction.isStringSelectMenu() && id === 'fisico_select_skills') {
    const bgSkills = BACKGROUNDS[char.background]?.skills || [];
    char.skills = [...bgSkills, ...interaction.values];
    try { saveCharacter(uid, char, interaction.guildId); } catch {}
    await showFisicoLanguages(interaction, char);
    return true;
  }

  // Idiomas
  if (interaction.isStringSelectMenu() && id === 'fisico_select_languages') {
    const idiomasBase = [...new Set(IDIOMAS_POR_RAZA[char.race] || ['Común'])];
    char.languages = [...idiomasBase, ...interaction.values];
    await showWealthRoll(interaction, char);
    return true;
  }

  return false;
}

async function mostrarTrasfondo(interaction, char) {
  const embed = new EmbedBuilder()
    .setTitle('📖 3️⃣ Elige tu trasfondo')
    .setColor(0x9B59B6)
    .setDescription(`${char.race} ${char.class}\n\nElige tu trasfondo:`);
  await rep(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('fisico_select_background').setPlaceholder('Elige trasfondo...')
        .addOptions(Object.entries(BACKGROUNDS).slice(0,25).map(([n,b]) => {
          const opt = { label: n, value: n };
          if (b.desc) opt.description = b.desc.slice(0,100);
          return opt;
        }))
    )],
    ephemeral: true,
  });
}

async function pedirNombreFisico(interaction) {
  const modal = new ModalBuilder().setCustomId('fisico_modal_nombre').setTitle('📜 Nombre de tu personaje');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('nombre').setLabel('Nombre del personaje')
        .setStyle(TextInputStyle.Short).setRequired(true).setMinLength(2).setMaxLength(40)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('backstory').setLabel('Historia de fondo (opcional)')
        .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(400)
    ),
  );
  await interaction.showModal(modal);
}

module.exports = { startFisico, handleFisicoInteraction };
