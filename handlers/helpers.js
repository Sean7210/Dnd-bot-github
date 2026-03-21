// ── utils/helpers.js ──────────────────────────────────────────────────────────
const { EmbedBuilder } = require('discord.js');
const { RACES }        = require('../data/races.js');
const { CLASSES }      = require('../data/classes.js');
const { BACKGROUNDS }  = require('../data/backgrounds.js');

// ─── DADO ─────────────────────────────────────────────────────────────────────
function rollStat() {
  const rolls = [1,2,3,4].map(() => Math.floor(Math.random() * 6) + 1).sort((a,b) => b-a);
  return rolls.slice(0, 3).reduce((a,b) => a+b, 0);
}

function rollDice(count, sides) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
}

// ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────────
function statMod(v) {
  const m = Math.floor((v - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

function calcHP(cls, con, level = 1) {
  // con debe ser la CON BASE del jugador (rolledStats.CON + bono racial),
  // no la actual — así los ajustes del DM no afectan el HP máximo
  const conMod = Math.floor((con - 10) / 2);
  return cls.hitDie + conMod + (level - 1) * (Math.floor(cls.hitDie / 2) + 1 + conMod);
}

// Bonificador de competencia — fórmula oficial D&D 5e: +2 a nivel 1-4, +3 a 5-8, etc.
function calcProfBonus(level) {
  return Math.ceil(level / 4) + 1;
}

function applyRacialBonuses(stats, raceName) {
  const raceData = RACES[raceName];
  if (!raceData) return stats;
  const result = { ...stats };
  const map = { str:'STR', dex:'DEX', con:'CON', int:'INT', wis:'WIS', cha:'CHA' };
  if (raceData.bonuses.all) Object.keys(result).forEach(k => result[k] += raceData.bonuses.all);
  Object.entries(raceData.bonuses).forEach(([key, val]) => { if (map[key]) result[map[key]] += val; });
  return result;
}

// ─── EMOJIS ───────────────────────────────────────────────────────────────────
const CATEGORY_EMOJIS = {
  'Común':'👥', 'Poco Común':'⭐', 'Monstruosa':'👹', 'Exótica':'🌟',
  'Multiverso':'🌌', 'Theros':'⚡', 'Ravnica':'🏙️', 'Ravenloft':'🧛', 'Spelljammer':'🚀'
};
function getCategoryEmoji(cat) { return CATEGORY_EMOJIS[cat] || '🎭'; }

// ─── EMBED DE PERSONAJE ────────────────────────────────────────────────────────
function buildCharacterEmbed(char, title = '📜 Tu Personaje de D&D') {
  const classData = CLASSES[char.class]   || {};
  const raceData  = RACES[char.race]      || {};
  const bgData    = BACKGROUNDS[char.background] || {};
  const stats     = char.finalStats || char.stats || {};

  const statBlock = stats.STR
    ? `\`\`\`\nSTR: ${stats.STR} (${statMod(stats.STR)})  DEX: ${stats.DEX} (${statMod(stats.DEX)})\nCON: ${stats.CON} (${statMod(stats.CON)})  INT: ${stats.INT} (${statMod(stats.INT)})\nWIS: ${stats.WIS} (${statMod(stats.WIS)})  CHA: ${stats.CHA} (${statMod(stats.CHA)})\`\`\``
    : '*Estadísticas aún no asignadas*';

  const hp = stats.CON && classData.hitDie ? calcHP(classData, stats.CON) : '?';
  const ac = stats.DEX ? 10 + Math.floor((stats.DEX - 10) / 2) : '?';

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x8B0000)
    .setDescription(`*"${char.backstory || 'Sin historia aún...'}"*`);

  if (char.name)       embed.addFields({ name: '⚔️ Nombre',       value: char.name, inline: true });
  if (char.race)       embed.addFields({ name: '🧬 Raza',         value: `${getCategoryEmoji(raceData.category)} ${char.race}`, inline: true });
  if (char.class)      embed.addFields({ name: '🛡️ Clase',        value: `${classData.emoji || '⚔️'} ${char.class}`, inline: true });
  if (char.subclass)   embed.addFields({ name: '✨ Subclase',      value: char.subclass, inline: true });
  if (char.background) embed.addFields({ name: '📖 Trasfondo',    value: char.background, inline: true });
  if (char.alignment)  embed.addFields({ name: '⚖️ Alineamiento', value: char.alignment, inline: true });
  if (char.level)      embed.addFields({ name: '✨ Nivel',         value: `${char.level}`, inline: true });

  embed.addFields({ name: '📊 Estadísticas', value: statBlock });

  if (stats.CON && classData.hitDie) {
    embed.addFields(
      { name: '❤️ HP',       value: `${hp}`, inline: true },
      { name: '🛡️ CA',       value: `${ac}`, inline: true },
      { name: '💨 Velocidad', value: `${raceData.speed || 30} ft`, inline: true }
    );
  }
  if (raceData.traits?.length) embed.addFields({ name: '🌟 Rasgos Raciales', value: raceData.traits.slice(0,4).join(', ') });
  if (char.skills?.length)     embed.addFields({ name: '🎯 Competencias',    value: char.skills.join(', ') });
  if (bgData.equipment?.length) embed.addFields({ name: '🎒 Equipo Inicial', value: bgData.equipment.join(', ').slice(0, 1024) });

  embed.setFooter({ text: 'D&D 5e • Manual Para Casi Todo • ¡Que comience la aventura!' });
  return embed;
}

// ─── SAFE INTERACTION UPDATE ──────────────────────────────────────────────────
// Maneja cualquier tipo de interacción:
//   - Botones / Selects → interaction.update()
//   - Slash commands   → interaction.reply() o editReply()
//   - Modales          → interaction.reply() (no tienen .update())
async function safeUpdate(interaction, payload) {
  try {
    const canUpdate = typeof interaction.update === 'function' &&
                      (interaction.isButton?.() || interaction.isStringSelectMenu?.() || interaction.isAnySelectMenu?.());

    if (canUpdate) {
      await interaction.update(payload);
    } else if (interaction.replied || interaction.deferred) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply({ ...payload, ephemeral: true });
    }
  } catch (err) {
    // Ignorar errores de mensaje desconocido o interacción expirada
    if (err.code === 10008 || err.code === 10062) {
      try {
        if (!interaction.replied) await interaction.reply({ ...payload, ephemeral: true });
        else await interaction.followUp({ ...payload, ephemeral: true });
      } catch (_) { /* ignorar */ }
    } else {
      console.error('[safeUpdate]', err);
    }
  }
}

async function safeReply(interaction, payload) {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (err) {
    console.error('[safeReply]', err);
  }
}

module.exports = {
  calcProfBonus,
  rollStat, rollDice, statMod, calcHP,
  applyRacialBonuses, getCategoryEmoji,
  buildCharacterEmbed, safeUpdate, safeReply,
};
