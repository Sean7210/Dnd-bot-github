// ── handlers/slashLookup.js ───────────────────────────────────────────────────
// Maneja todos los slash commands de consulta (no el flujo de creación)

const { EmbedBuilder, InteractionResponseFlags  } = require('discord.js');
const { RACES }        = require('../data/races.js');
const { CLASSES, SUBCLASS_GROUPS } = require('../data/classes.js');
const { BACKGROUNDS }  = require('../data/backgrounds.js');
const { DOTES, DOTES_INDEX, DOTES_NOMBRES, DOTES_POR_FUENTE } = require('../data/feats.js');
const { ARMADURAS, ARMAS, EQUIPO_AVENTURERO, HERRAMIENTAS, KITS_INICIO, MONTURAS, APAREJOS_VEHICULOS } = require('../data/equipment.js');
const { getCategoryEmoji } = require('../utils/helpers.js');

const RACE_CATEGORIES = ['Común','Poco Común','Monstruosa','Exótica','Multiverso','Theros','Ravnica','Ravenloft','Spelljammer'];

// ─── AUTOCOMPLETE ─────────────────────────────────────────────────────────────
async function handleAutocomplete(interaction) {
  const { commandName, options } = interaction;
  const focused = options.getFocused().toLowerCase();
  let choices = [];

  if (commandName === 'raza') {
    choices = Object.keys(RACES).filter(r => r.toLowerCase().includes(focused)).slice(0, 25);
  } else if (commandName === 'clase') {
    choices = Object.keys(CLASSES).filter(c => c.toLowerCase().includes(focused)).slice(0, 25);
  } else if (commandName === 'subclase') {
    for (const [, cls] of Object.entries(CLASSES)) {
      if (!cls.subclasses) continue;
      for (const name of Object.keys(cls.subclasses)) {
        if (name.toLowerCase().includes(focused)) choices.push(name);
      }
    }
    choices = choices.slice(0, 25);
  } else if (commandName === 'trasfondo') {
    choices = Object.keys(BACKGROUNDS).filter(b => b.toLowerCase().includes(focused)).slice(0, 25);
  } else if (commandName === 'dote') {
    choices = DOTES_NOMBRES.filter(f => f.toLowerCase().includes(focused)).slice(0, 25);
  } else if (commandName === 'arma') {
    choices = Object.keys(ARMAS).filter(a => a.toLowerCase().includes(focused)).slice(0, 25);
  } else if (commandName === 'armadura') {
    choices = Object.keys(ARMADURAS).filter(a => a.toLowerCase().includes(focused)).slice(0, 25);
  }

  await interaction.respond(choices.map(c => ({ name: c, value: c })));
}

// ─── COMANDO /razas ───────────────────────────────────────────────────────────
async function cmdRazas(interaction) {
  const embed = new EmbedBuilder()
    .setTitle(`🧬 Todas las Razas (${Object.keys(RACES).length} total)`)
    .setColor(0x2E8B57)
    .setDescription('Usa `/raza [nombre]` para ver detalles completos de cualquier raza.');
  for (const cat of RACE_CATEGORIES) {
    const list = Object.keys(RACES).filter(r => RACES[r].category === cat);
    if (list.length) embed.addFields({ name: `${getCategoryEmoji(cat)} ${cat} (${list.length})`, value: list.join(', ') });
  }
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── COMANDO /raza ────────────────────────────────────────────────────────────
async function cmdRaza(interaction) {
  const name = interaction.options.getString('nombre');
  const race = Object.keys(RACES).find(r => r.toLowerCase() === name.toLowerCase());
  if (!race) {
    return interaction.reply({ content: `❌ Raza **${name}** no encontrada. Usa \`/razas\` para ver la lista.`, ephemeral: true });
  }
  const d = RACES[race];
  const bonusText = Object.entries(d.bonuses)
    .filter(([k]) => k !== 'all')
    .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
    .join(', ') || (d.bonuses.all ? `+${d.bonuses.all} a todas las stats` : 'Flexible (+2/+1 o +1/+1/+1)');

  const embed = new EmbedBuilder()
    .setTitle(`${getCategoryEmoji(d.category)} ${race}`)
    .setColor(0x2E8B57)
    .setDescription(d.description)
    .addFields(
      { name: '📂 Categoría', value: d.category, inline: true },
      { name: '💨 Velocidad', value: `${d.speed} ft`, inline: true },
      { name: '📐 Tamaño',    value: d.size, inline: true },
      { name: '💪 Bonificaciones', value: bonusText, inline: false },
      { name: '✨ Rasgos',   value: d.traits.join('\n').slice(0, 1024), inline: false },
      { name: '🗣️ Idiomas',  value: d.languages.join(', '), inline: true },
    );
  if (d.subraces)      embed.addFields({ name: '🌿 Subrazas',           value: d.subraces.join('\n').slice(0,1024) });
  if (d.subrace_note)  embed.addFields({ name: '🔀 Variantes/Linajes',  value: d.subrace_note.slice(0,1024) });
  await interaction.reply({ embeds: [embed] });
}

// ─── COMANDO /clase ───────────────────────────────────────────────────────────
async function cmdClase(interaction) {
  const name = interaction.options.getString('nombre');
  const cls  = Object.keys(CLASSES).find(c => c.toLowerCase() === name.toLowerCase());
  if (!cls) {
    return interaction.reply({ content: `❌ Clase **${name}** no encontrada. Clases disponibles: ${Object.keys(CLASSES).join(', ')}`, ephemeral: true });
  }
  const d = CLASSES[cls];
  const groupLabel = SUBCLASS_GROUPS[cls] || 'Subclases';
  const subList = d.subclasses
    ? Object.keys(d.subclasses).join(', ')
    : 'Sin subclases registradas.';

  const embed = new EmbedBuilder()
    .setTitle(`${d.emoji} ${cls}`)
    .setColor(0x8B0000)
    .setDescription(d.description)
    .addFields(
      { name: '🎲 Dado de Golpe',       value: `d${d.hitDie}`, inline: true },
      { name: '💪 Stat Principal',       value: d.primaryStat, inline: true },
      { name: '🛡️ Tir. Salvación',      value: d.saves.join(', '), inline: true },
      { name: '🎯 Habilidades Posibles', value: d.skills.join(', '), inline: false },
      { name: `✨ ${groupLabel} (nivel ${d.subclassLevel})`, value: subList.slice(0, 1024), inline: false },
    );
  if (d.source) embed.setFooter({ text: `Fuente: ${d.source}` });
  await interaction.reply({ embeds: [embed] });
}

// ─── COMANDO /subclase ────────────────────────────────────────────────────────
async function cmdSubclase(interaction) {
  const name = interaction.options.getString('nombre');
  let found = null, foundClass = null;
  for (const [cls, data] of Object.entries(CLASSES)) {
    if (!data.subclasses) continue;
    const key = Object.keys(data.subclasses).find(s => s.toLowerCase() === name.toLowerCase());
    if (key) { found = data.subclasses[key]; foundClass = cls; break; }
  }
  if (!found) {
    const all = Object.entries(CLASSES)
      .filter(([,d]) => d.subclasses)
      .map(([cls, d]) => `**${cls}:** ${Object.keys(d.subclasses).join(', ')}`)
      .join('\n');
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle('✨ Subclases disponibles').setColor(0x6A0DAD).setDescription(all.slice(0, 4096))], ephemeral: true });
  }
  const embed = new EmbedBuilder()
    .setTitle(`✨ ${name}`)
    .setColor(0x6A0DAD)
    .setDescription(found.description)
    .addFields({ name: '🛡️ Clase', value: foundClass, inline: true });
  if (found.features?.length) embed.addFields({ name: '⚡ Rasgos principales', value: found.features.join(', ').slice(0,1024) });
  if (found.source) embed.setFooter({ text: `Fuente: ${found.source}` });
  await interaction.reply({ embeds: [embed] });
}

// ─── COMANDO /trasfondos ──────────────────────────────────────────────────────
async function cmdTrasfondos(interaction) {
  const mjList = Object.keys(BACKGROUNDS).filter(b => BACKGROUNDS[b].source === 'Manual del Jugador').join(', ');
  const ceList = Object.keys(BACKGROUNDS).filter(b => BACKGROUNDS[b].source === 'Costa de la Espada').join(', ');
  const embed = new EmbedBuilder()
    .setTitle(`📚 Trasfondos disponibles (${Object.keys(BACKGROUNDS).length})`)
    .setColor(0x8B4513)
    .setDescription('Usa `/trasfondo [nombre]` para ver detalles completos.')
    .addFields(
      { name: '📖 Manual del Jugador (13)', value: mjList || '—' },
      { name: '🗺️ Costa de la Espada (12)', value: ceList || '—' },
    );
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── COMANDO /trasfondo ───────────────────────────────────────────────────────
async function cmdTrasfondo(interaction) {
  const name = interaction.options.getString('nombre');
  const bg   = Object.keys(BACKGROUNDS).find(b => b.toLowerCase() === name.toLowerCase());
  if (!bg) {
    return interaction.reply({ content: `❌ Trasfondo **${name}** no encontrado. Usa \`/trasfondos\` para ver la lista.`, ephemeral: true });
  }
  const d = BACKGROUNDS[bg];
  const herramientas = [...(d.tools || []), ...(d.languages ? [`${d.languages} idioma(s) adicional(es)`] : [])].join(', ') || 'Ninguna';
  const embed = new EmbedBuilder()
    .setTitle(`📖 ${bg}`)
    .setColor(0x8B4513)
    .addFields(
      { name: '📚 Fuente',               value: d.source || '—', inline: true },
      { name: '⚔️ Habilidades',          value: d.skills.join(', '), inline: true },
      { name: '🔧 Herramientas/Idiomas', value: herramientas, inline: true },
      { name: `✨ ${d.feature}`,         value: d.featureDesc || '—', inline: false },
      { name: '🎒 Equipo inicial',       value: d.equipment.join('\n').slice(0, 1024), inline: false },
    );
  await interaction.reply({ embeds: [embed] });
}

// ─── COMANDO /dotes ───────────────────────────────────────────────────────────
async function cmdDotes(interaction) {
  const fuente = interaction.options.getString('fuente');
  const list   = DOTES.filter(d => !fuente || d.fuente === fuente).map(d => d.nombre);

  const embed = new EmbedBuilder()
    .setTitle(`🌟 Dotes${fuente ? ` — ${fuente}` : ''} (${list.length})`)
    .setColor(0xDAA520)
    .setDescription('Usa `/dote [nombre]` para ver los detalles de cualquier dote.');

  if (fuente) {
    embed.addFields({ name: fuente, value: list.join(', ').slice(0, 1024) });
  } else {
    for (const [src, nombres] of Object.entries(DOTES_POR_FUENTE)) {
      if (nombres.length) embed.addFields({ name: src, value: nombres.join(', ').slice(0, 1024) });
    }
  }
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── COMANDO /dote ────────────────────────────────────────────────────────────
async function cmdDote(interaction) {
  const name = interaction.options.getString('nombre');
  const d    = DOTES_INDEX[name.toLowerCase()];
  if (!d) {
    return interaction.reply({ content: `❌ Dote **${name}** no encontrada. Usa \`/dotes\` para ver la lista.`, ephemeral: true });
  }
  const embed = new EmbedBuilder()
    .setTitle(`🌟 ${d.nombre}`)
    .setColor(0xDAA520)
    .setDescription(d.descripcion)
    .addFields(
      { name: '📚 Fuente',        value: d.fuente,              inline: true },
      { name: '📋 Prerrequisito', value: d.requisito || 'Ninguno', inline: true },
    );
  await interaction.reply({ embeds: [embed] });
}

// ─── COMANDO /arma ────────────────────────────────────────────────────────────
async function cmdArma(interaction) {
  const name = interaction.options.getString('nombre');
  const arma = Object.entries(ARMAS).find(([n]) => n.toLowerCase() === name.toLowerCase());
  if (!arma) {
    const all = Object.keys(ARMAS).join(', ');
    return interaction.reply({ content: `❌ Arma **${name}** no encontrada.\n\nArmas disponibles: ${all}`, ephemeral: true });
  }
  const [armaName, d] = arma;
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ${armaName}`)
    .setColor(0xC0C0C0)
    .addFields(
      { name: '📂 Tipo',          value: d.tipo, inline: true },
      { name: '🎲 Daño',          value: d.daño, inline: true },
      { name: '💰 Coste',         value: d.coste, inline: true },
      { name: '⚖️ Peso',          value: d.peso, inline: true },
      { name: '📝 Propiedades',   value: d.propiedades || '—', inline: false },
    );
  await interaction.reply({ embeds: [embed] });
}

// ─── COMANDO /armadura ────────────────────────────────────────────────────────
async function cmdArmadura(interaction) {
  const name    = interaction.options.getString('nombre');
  const armadura = Object.entries(ARMADURAS).find(([n]) => n.toLowerCase() === name.toLowerCase());
  if (!armadura) {
    const all = Object.keys(ARMADURAS).join(', ');
    return interaction.reply({ content: `❌ Armadura **${name}** no encontrada.\n\nArmaduras disponibles: ${all}`, ephemeral: true });
  }
  const [armName, d] = armadura;
  const fields = [
    { name: '📂 Categoría', value: d.categoria, inline: true },
    { name: '🛡️ CA',        value: d.ca, inline: true },
    { name: '💰 Coste',     value: d.coste, inline: true },
    { name: '⚖️ Peso',      value: d.peso, inline: true },
    { name: '🤫 Sigilo',    value: d.sigilo, inline: true },
  ];
  if (d.fuerza) fields.push({ name: '💪 FUE mínima', value: d.fuerza, inline: true });
  const embed = new EmbedBuilder().setTitle(`🛡️ ${armName}`).setColor(0x708090).addFields(...fields);
  await interaction.reply({ embeds: [embed] });
}

// ─── COMANDO /equipo ──────────────────────────────────────────────────────────
async function cmdEquipo(interaction) {
  const equipoList = Object.entries(EQUIPO_AVENTURERO)
    .map(([n, d]) => `**${n}** — ${d.coste}, ${d.peso}`)
    .join('\n');
  const kitsText = Object.entries(KITS_INICIO)
    .map(([n, d]) => `**${n}** (${d.coste}): ${d.contenido}`)
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('🎒 Equipo Aventurero')
    .setColor(0x8B6914)
    .addFields(
      { name: `🛠️ Objetos (${Object.keys(EQUIPO_AVENTURERO).length})`, value: equipoList.slice(0, 1024) },
      { name: '📦 Kits de Inicio',  value: kitsText.slice(0, 1024) },
    )
    .setFooter({ text: 'Usa /arma o /armadura para detalles de combate' });
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── COMANDO /ayuda ───────────────────────────────────────────────────────────
async function cmdAyuda(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📚 Comandos del Bot D&D 5e')
    .setColor(0x4169E1)
    .setDescription('Todos los comandos usan `/` (slash commands) y `!` (mensajes de texto).')
    .addFields(
      { name: '🎲 Creación',   value: '`/personaje` — Asistente interactivo completo', inline: false },
      { name: '🎲 Dados',      value: '`/tirada [dados] [mod]` · `/stats`', inline: false },
      { name: '🧬 Razas',      value: '`/razas` · `/raza [nombre]`', inline: false },
      { name: '⚔️ Clases',     value: '`/clase [nombre]` · `/subclase [nombre]`', inline: false },
      { name: '📖 Trasfondos', value: '`/trasfondos` · `/trasfondo [nombre]`', inline: false },
      { name: '🌟 Dotes',      value: '`/dotes [fuente]` · `/dote [nombre]`', inline: false },
      { name: '🗡️ Equipo',     value: '`/arma [nombre]` · `/armadura [nombre]` · `/equipo`', inline: false },
    )
    .setFooter({ text: `D&D 5e • Manual Para Casi Todo • ${Object.keys(RACES).length} razas · ${Object.keys(CLASSES).length} clases` });
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = {
  handleAutocomplete,
  cmdRazas, cmdRaza,
  cmdClase, cmdSubclase,
  cmdTrasfondos, cmdTrasfondo,
  cmdDotes, cmdDote,
  cmdArma, cmdArmadura, cmdEquipo,
  cmdAyuda,
};
