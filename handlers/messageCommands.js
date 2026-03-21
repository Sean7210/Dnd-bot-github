// ── handlers/messageCommands.js ───────────────────────────────────────────────
// Maneja los comandos de texto con prefijo ! (compatibilidad con prefix commands)

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionResponseFlags  } = require('discord.js');
const { RACES }       = require('../data/races.js');
const { CLASSES, SUBCLASS_GROUPS } = require('../data/classes.js');
const { BACKGROUNDS } = require('../data/backgrounds.js');
const { FEATS }       = require('../data/feats.js');
const { ARMADURAS, ARMAS } = require('../data/equipment.js');
const { getCategoryEmoji, statMod, rollDice } = require('../utils/helpers.js');

const RACE_CATEGORIES = ['Común','Poco Común','Monstruosa','Exótica','Multiverso','Theros','Ravnica','Ravenloft','Spelljammer'];

async function handleMessageCommand(message) {
  if (message.author.bot || !message.content.startsWith('!')) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const cmd  = args.shift().toLowerCase();

  // ── /personaje ───────────────────────────────────────────────────────────────
  if (['personaje', 'character', 'crear', 'new'].includes(cmd)) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('start_character').setLabel('⚔️ Crear Personaje D&D').setStyle(ButtonStyle.Primary)
    );
    const embed = new EmbedBuilder()
      .setTitle('🐉 D&D 5e — Creación de Personaje')
      .setDescription(
        `¡Crea tu personaje de **D&D 5e**!\n\n` +
        `**${Object.keys(RACES).length} razas** · **${Object.keys(CLASSES).length} clases** · **${Object.keys(BACKGROUNDS).length} trasfondos**\n\n` +
        `**Pasos:**\n1. 📝 Nombre e historia\n2. 🧬 Raza\n3. ⚔️ Clase + Subclase\n4. 📖 Trasfondo\n5. ⚖️ Alineamiento\n6. 🎲 Estadísticas\n7. 🎯 Habilidades`
      )
      .setColor(0x8B0000)
      .setFooter({ text: 'D&D 5e • Manual Para Casi Todo • También disponible como /personaje' });
    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ── !tirada ──────────────────────────────────────────────────────────────────
  if (['tirada', 'roll', 'dado', 'dice'].includes(cmd)) {
    const diceStr = (args[0] || '1d20').toLowerCase();
    const flag    = args[1]?.toLowerCase();

    if (flag === 'ventaja' || flag === 'adv') {
      const [r1, r2] = rollDice(2, 20);
      const best = Math.max(r1, r2);
      return message.reply({ embeds: [new EmbedBuilder().setTitle('🎲 1d20 con Ventaja').setColor(0x00AA00)
        .addFields({ name: 'Dados', value: `~~${Math.min(r1,r2)}~~ **${best}**`, inline: true },
                   { name: 'Resultado', value: `**${best}**`, inline: true })] });
    }
    if (flag === 'desventaja' || flag === 'dis') {
      const [r1, r2] = rollDice(2, 20);
      const worst = Math.min(r1, r2);
      return message.reply({ embeds: [new EmbedBuilder().setTitle('🎲 1d20 con Desventaja').setColor(0xAA0000)
        .addFields({ name: 'Dados', value: `~~${Math.max(r1,r2)}~~ **${worst}**`, inline: true },
                   { name: 'Resultado', value: `**${worst}**`, inline: true })] });
    }

    const dropMatch = diceStr.match(/^(\d+)d(\d+)(?:kh(\d+)|dl(\d+))?$/i);
    const stdMatch  = diceStr.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!dropMatch && !stdMatch) {
      return message.reply('❌ Formatos válidos:\n`!tirada 2d6+3` · `!tirada 4d6kh3` · `!tirada 1d20 ventaja` · `!tirada 1d20 desventaja`');
    }

    let kept, dropped = [], modifier = 0;
    if (dropMatch && (dropMatch[3] || dropMatch[4])) {
      const count = Math.min(parseInt(dropMatch[1]), 20);
      const sides = Math.min(parseInt(dropMatch[2]), 100);
      const keep  = parseInt(dropMatch[3] || dropMatch[4]);
      const all   = rollDice(count, sides).sort((a,b) => b-a);
      kept = all.slice(0, keep); dropped = all.slice(keep);
    } else {
      const count = Math.min(parseInt(stdMatch[1]), 20);
      const sides = Math.min(parseInt(stdMatch[2]), 100);
      modifier = stdMatch[3] ? parseInt(stdMatch[3]) : 0;
      kept = rollDice(count, sides);
    }

    const sum   = kept.reduce((a,b) => a+b, 0);
    const total = sum + modifier;
    const diceDisplay   = kept.map(r => `**${r}**`).join(' + ') + (dropped.length ? ' + ' + dropped.map(r => `~~${r}~~`).join(' ') : '');
    const totalDisplay  = modifier ? `${sum} ${modifier>0?'+':''}${modifier} = **${total}**` : `**${total}**`;

    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`🎲 ${diceStr}`).setColor(0xDAA520)
      .addFields({ name: 'Dados', value: diceDisplay, inline: true }, { name: 'Total', value: totalDisplay, inline: true })] });
  }

  // ── !stats ───────────────────────────────────────────────────────────────────
  if (cmd === 'stats') {
    const statNames = ['FUE','DES','CON','INT','SAB','CAR'];
    const stats = statNames.map(name => {
      const rolls = rollDice(4, 6).sort((a,b) => b-a);
      const total = rolls.slice(0,3).reduce((a,b) => a+b, 0);
      return { name, rolls, total };
    });
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('🎲 Tirada de Estadísticas (4d6 drop lowest)')
      .setColor(0xDAA520)
      .addFields(stats.map(s => ({ name: s.name, value: `[${s.rolls.join(',')}] → **${s.total}** (${statMod(s.total)})`, inline: true })))
      .setFooter({ text: `Total puntos: ${stats.reduce((a,s) => a+s.total, 0)}` })] });
  }

  // ── !raza ────────────────────────────────────────────────────────────────────
  if (cmd === 'raza') {
    const name = args.join(' ');
    if (!name) return message.reply('❌ Uso: `!raza [nombre]`');
    const race = Object.keys(RACES).find(r => r.toLowerCase() === name.toLowerCase());
    if (!race) {
      const cats = RACE_CATEGORIES.map(c => {
        const list = Object.keys(RACES).filter(r => RACES[r].category === c);
        return `**${getCategoryEmoji(c)} ${c}:** ${list.join(', ')}`;
      }).join('\n');
      return message.reply(`❌ Raza no encontrada.\n\n${cats}`);
    }
    const d = RACES[race];
    const bonusText = Object.entries(d.bonuses).filter(([k])=>k!=='all').map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(', ')
      || (d.bonuses.all ? `+${d.bonuses.all} a todas` : 'Flexible');
    const embed = new EmbedBuilder()
      .setTitle(`${getCategoryEmoji(d.category)} ${race}`)
      .setColor(0x2E8B57).setDescription(d.description)
      .addFields(
        { name: '📂 Categoría',    value: d.category, inline: true },
        { name: '💨 Velocidad',    value: `${d.speed} ft`, inline: true },
        { name: '📐 Tamaño',       value: d.size, inline: true },
        { name: '💪 Bonos',        value: bonusText, inline: false },
        { name: '✨ Rasgos',       value: d.traits.join('\n').slice(0,1024), inline: false },
        { name: '🗣️ Idiomas',      value: d.languages.join(', '), inline: true },
      );
    if (d.subraces)     embed.addFields({ name: '🌿 Subrazas', value: d.subraces.join('\n').slice(0,1024) });
    if (d.subrace_note) embed.addFields({ name: '🔀 Variantes', value: d.subrace_note.slice(0,1024) });
    return message.reply({ embeds: [embed] });
  }

  // ── !razas ───────────────────────────────────────────────────────────────────
  if (['razas', 'listar'].includes(cmd)) {
    const embed = new EmbedBuilder()
      .setTitle(`🧬 Todas las Razas (${Object.keys(RACES).length})`)
      .setColor(0x2E8B57)
      .setDescription('Usa `!raza [nombre]` para ver los detalles de una raza.');
    for (const cat of RACE_CATEGORIES) {
      const list = Object.keys(RACES).filter(r => RACES[r].category === cat);
      if (list.length) embed.addFields({ name: `${getCategoryEmoji(cat)} ${cat}`, value: list.join(', ') });
    }
    return message.reply({ embeds: [embed] });
  }

  // ── !clase ───────────────────────────────────────────────────────────────────
  if (cmd === 'clase') {
    const name = args.join(' ');
    if (!name) return message.reply(`❌ Uso: \`!clase [nombre]\`. Clases: ${Object.keys(CLASSES).join(', ')}`);
    const cls  = Object.keys(CLASSES).find(c => c.toLowerCase() === name.toLowerCase());
    if (!cls)  return message.reply(`❌ Clase no encontrada. Disponibles: ${Object.keys(CLASSES).join(', ')}`);
    const d    = CLASSES[cls];
    const groupLabel = SUBCLASS_GROUPS[cls] || 'Subclases';
    const subList = d.subclasses ? Object.keys(d.subclasses).join(', ') : 'Sin subclases.';
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle(`${d.emoji} ${cls}`).setColor(0x8B0000).setDescription(d.description)
      .addFields(
        { name: '🎲 Dado de Golpe', value: `d${d.hitDie}`, inline: true },
        { name: '💪 Stat Principal', value: d.primaryStat, inline: true },
        { name: '🛡️ Salvaciones',   value: d.saves.join(', '), inline: true },
        { name: '🎯 Habilidades',   value: d.skills.join(', ') },
        { name: `✨ ${groupLabel} (Nv ${d.subclassLevel})`, value: subList.slice(0,1024) },
      )] });
  }

  // ── !subclase ────────────────────────────────────────────────────────────────
  if (cmd === 'subclase') {
    const name = args.join(' ');
    if (!name) return message.reply('❌ Uso: `!subclase [nombre]`');
    let found = null, foundClass = null;
    for (const [cls, data] of Object.entries(CLASSES)) {
      if (!data.subclasses) continue;
      const key = Object.keys(data.subclasses).find(s => s.toLowerCase() === name.toLowerCase());
      if (key) { found = data.subclasses[key]; foundClass = cls; break; }
    }
    if (!found) {
      const all = Object.entries(CLASSES).filter(([,d])=>d.subclasses)
        .map(([cls,d])=>`**${cls}:** ${Object.keys(d.subclasses).join(', ')}`).join('\n');
      return message.reply({ embeds: [new EmbedBuilder().setTitle('✨ Subclases disponibles').setColor(0x6A0DAD).setDescription(all.slice(0,4096))] });
    }
    const embed = new EmbedBuilder().setTitle(`✨ ${name}`).setColor(0x6A0DAD).setDescription(found.description)
      .addFields({ name: '🛡️ Clase', value: foundClass, inline: true });
    if (found.features?.length) embed.addFields({ name: '⚡ Rasgos', value: found.features.join(', ').slice(0,1024) });
    if (found.source) embed.setFooter({ text: `Fuente: ${found.source}` });
    return message.reply({ embeds: [embed] });
  }

  // ── !trasfondo ───────────────────────────────────────────────────────────────
  if (cmd === 'trasfondo') {
    const name = args.join(' ');
    if (!name) return message.reply('❌ Uso: `!trasfondo [nombre]`. Usa `!trasfondos` para ver la lista.');
    const bg = Object.keys(BACKGROUNDS).find(b => b.toLowerCase() === name.toLowerCase());
    if (!bg) {
      const mjList = Object.keys(BACKGROUNDS).filter(b => BACKGROUNDS[b].source === 'Manual del Jugador').join(', ');
      const ceList = Object.keys(BACKGROUNDS).filter(b => BACKGROUNDS[b].source === 'Costa de la Espada').join(', ');
      return message.reply(`❌ Trasfondo no encontrado.\n\n📖 **Manual del Jugador:** ${mjList}\n\n🗺️ **Costa de la Espada:** ${ceList}`);
    }
    const d = BACKGROUNDS[bg];
    const herramientas = [...(d.tools||[]), ...(d.languages ? [`${d.languages} idioma(s)`] : [])].join(', ') || 'Ninguna';
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`📖 ${bg}`).setColor(0x8B4513)
      .addFields(
        { name: '📚 Fuente',              value: d.source || '—', inline: true },
        { name: '⚔️ Habilidades',         value: d.skills.join(', '), inline: true },
        { name: '🔧 Herramientas/Idiomas',value: herramientas, inline: true },
        { name: `✨ ${d.feature}`,        value: d.featureDesc || '—', inline: false },
        { name: '🎒 Equipo',              value: d.equipment.join('\n').slice(0,1024), inline: false },
      )] });
  }

  if (['trasfondos','listar-trasfondos'].includes(cmd)) {
    const mjList = Object.keys(BACKGROUNDS).filter(b => BACKGROUNDS[b].source === 'Manual del Jugador').join(', ');
    const ceList = Object.keys(BACKGROUNDS).filter(b => BACKGROUNDS[b].source === 'Costa de la Espada').join(', ');
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`📚 Trasfondos (${Object.keys(BACKGROUNDS).length})`).setColor(0x8B4513)
      .setDescription('Usa `!trasfondo [nombre]` para ver detalles.')
      .addFields(
        { name: '📖 Manual del Jugador (13)', value: mjList || '—' },
        { name: '🗺️ Costa de la Espada (12)', value: ceList || '—' },
      )] });
  }

  // ── !dote ────────────────────────────────────────────────────────────────────
  if (cmd === 'dote') {
    const name = args.join(' ');
    if (!name) return message.reply('❌ Uso: `!dote [nombre]`. Usa `!dotes` para ver la lista.');
    const feat = Object.entries(FEATS).find(([n]) => n.toLowerCase() === name.toLowerCase());
    if (!feat) return message.reply(`❌ Dote no encontrada. Usa \`!dotes\` para ver la lista completa.`);
    const [featName, d] = feat;
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🌟 ${featName}`).setColor(0xDAA520)
      .setDescription(d.description)
      .addFields(
        { name: '📚 Fuente',        value: d.source, inline: true },
        { name: '📋 Prerrequisito', value: d.prerequisite || 'Ninguno', inline: true },
        { name: '✅ Beneficios',    value: d.benefits.map(b=>`• ${b}`).join('\n').slice(0,1024) },
      )] });
  }

  if (cmd === 'dotes') {
    const embed = new EmbedBuilder().setTitle(`🌟 Dotes disponibles (${Object.keys(FEATS).length})`).setColor(0xDAA520)
      .setDescription('Usa `!dote [nombre]` para ver los detalles.');
    const groups = {};
    for (const [name, feat] of Object.entries(FEATS)) {
      groups[feat.source] = groups[feat.source] || [];
      groups[feat.source].push(name);
    }
    for (const [src, list] of Object.entries(groups)) {
      embed.addFields({ name: src, value: list.join(', ').slice(0,1024) });
    }
    return message.reply({ embeds: [embed] });
  }

  // ── !arma ────────────────────────────────────────────────────────────────────
  if (cmd === 'arma') {
    const name = args.join(' ');
    if (!name) return message.reply(`❌ Uso: \`!arma [nombre]\`. Armas: ${Object.keys(ARMAS).join(', ')}`);
    const arma = Object.entries(ARMAS).find(([n]) => n.toLowerCase() === name.toLowerCase());
    if (!arma) return message.reply(`❌ Arma no encontrada. Usa \`!arma\` sin argumentos para ver la lista.`);
    const [armaName, d] = arma;
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`⚔️ ${armaName}`).setColor(0xC0C0C0)
      .addFields(
        { name: '📂 Tipo',       value: d.tipo, inline: true },
        { name: '🎲 Daño',       value: d.daño, inline: true },
        { name: '💰 Coste',      value: d.coste, inline: true },
        { name: '⚖️ Peso',       value: d.peso, inline: true },
        { name: '📝 Propiedades', value: d.propiedades || '—', inline: false },
      )] });
  }

  // ── !armadura ────────────────────────────────────────────────────────────────
  if (cmd === 'armadura') {
    const name = args.join(' ');
    if (!name) return message.reply(`❌ Uso: \`!armadura [nombre]\`. Armaduras: ${Object.keys(ARMADURAS).join(', ')}`);
    const armadura = Object.entries(ARMADURAS).find(([n]) => n.toLowerCase() === name.toLowerCase());
    if (!armadura) return message.reply(`❌ Armadura no encontrada.`);
    const [armName, d] = armadura;
    const fields = [
      { name: '📂 Categoría', value: d.categoria, inline: true },
      { name: '🛡️ CA',        value: d.ca, inline: true },
      { name: '💰 Coste',     value: d.coste, inline: true },
      { name: '⚖️ Peso',      value: d.peso, inline: true },
      { name: '🤫 Sigilo',    value: d.sigilo, inline: true },
    ];
    if (d.fuerza) fields.push({ name: '💪 FUE mínima', value: d.fuerza, inline: true });
    return message.reply({ embeds: [new EmbedBuilder().setTitle(`🛡️ ${armName}`).setColor(0x708090).addFields(...fields)] });
  }

  // ── !ayuda ───────────────────────────────────────────────────────────────────
  if (['ayuda', 'help', 'comandos'].includes(cmd)) {
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle('📚 Comandos del Bot D&D 5e')
      .setColor(0x4169E1)
      .setDescription('Usa `!comando` o `/comando` (slash commands)')
      .addFields(
        { name: '🎲 Creación',   value: '`!personaje` — Asistente interactivo', inline: false },
        { name: '🎲 Dados',      value: '`!tirada 2d6+3` · `!tirada 1d20 ventaja` · `!stats`', inline: false },
        { name: '🧬 Razas',      value: '`!razas` · `!raza [nombre]`', inline: false },
        { name: '⚔️ Clases',     value: '`!clase [nombre]` · `!subclase [nombre]`', inline: false },
        { name: '📖 Trasfondos', value: '`!trasfondos` · `!trasfondo [nombre]`', inline: false },
        { name: '🌟 Dotes',      value: '`!dotes` · `!dote [nombre]`', inline: false },
        { name: '🗡️ Equipo',     value: '`!arma [nombre]` · `!armadura [nombre]`', inline: false },
      )
      .setFooter({ text: `D&D 5e • ${Object.keys(RACES).length} razas · ${Object.keys(CLASSES).length} clases · ${Object.keys(FEATS).length} dotes` })] });
  }
}

module.exports = { handleMessageCommand };
