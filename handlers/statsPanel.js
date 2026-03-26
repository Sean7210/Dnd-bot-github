// ── handlers/statsPanel.js ────────────────────────────────────────────────────
// Tres comandos de consulta para jugadores y DM
//
// /mis-stats      → Jugador: stats completas, bonos, armas, habilidades
// /salvacion      → Jugador: tirar una salvación (con bono de competencia si aplica)
// /dm-monstruos   → DM: ver lista de monstruos disponibles con sus stats
// ─────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getCharacter }  = require('../db/characterStore.js');
const { isDM }          = require('../utils/isDM.js');
const { CLASSES }       = require('../data/classes.js');
const { ARMAS }         = require('../data/equipment.js');
const { getTodosLosMonstruos } = require('./cazaPanel.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mod    = v => Math.floor(((v||10)-10)/2);
const signo  = n => (n>=0?'+':'')+n;
const barra  = (v,max) => '`'+('█'.repeat(Math.round(Math.max(0,v/max)*10))+'░'.repeat(10-Math.round(Math.max(0,v/max)*10)))+'`';

// Mapa de habilidades → stat base D&D 5e oficial
const SKILL_STAT = {
  'Acrobacias':         'DEX', 'Trato con animales': 'WIS', 'Arcanas':       'INT',
  'Atletismo':          'STR', 'Engaño':             'CHA', 'Historia':      'INT',
  'Intuición':          'WIS', 'Intimidación':       'CHA', 'Investigación': 'INT',
  'Medicina':           'WIS', 'Naturaleza':         'INT', 'Percepción':    'WIS',
  'Persuasión':         'CHA', 'Prestidigitación':   'DEX', 'Religión':      'INT',
  'Sigilo':             'DEX', 'Supervivencia':      'WIS', 'Juego de manos':'DEX',
  'Conocimiento arcano':'INT',
};

const STAT_ES = { STR:'FUE', DEX:'DES', CON:'CON', INT:'INT', WIS:'SAB', CHA:'CAR' };
const STATS_ORDER = ['STR','DEX','CON','INT','WIS','CHA'];

// ─── /mis-stats ───────────────────────────────────────────────────────────────
async function cmdMisStats(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return interaction.reply({ content:'❌ Sin personaje. Usa `/crear-personaje`.', ephemeral:true });

  const stats   = char.finalStats || {};
  const nivel   = char.level || 1;
  const prof    = Math.ceil(nivel/4)+1;
  const cls     = CLASSES[char.class] || {};
  const saves   = cls.saves || [];
  const skills  = char.skills || [];

  // Stats temporales del bar
  let statsTmp = {};
  try {
    const { getStatTempBonus } = require('./shopPanel.js');
    for (const s of STATS_ORDER) {
      const tmp = getStatTempBonus(uid, s);
      if (tmp) statsTmp[s] = tmp;
    }
  } catch {}

  // ── Bloque 1: Stats + modificadores + salvaciones ─────────────────────────
  const statsStr = STATS_ORDER.map(s => {
    const base  = stats[s] || 10;
    const tmp   = statsTmp[s] || 0;
    const total = base + tmp;
    const modVal = mod(total);
    const isSave = saves.includes(s);
    const saveVal = modVal + (isSave ? prof : 0);
    const tmpStr  = tmp ? ` *(+${tmp} tmp)*` : '';
    return `**${STAT_ES[s]}** ${total}${tmpStr} → mod ${signo(modVal)} | salvación ${signo(saveVal)}${isSave?' ✓':''}`;
  }).join('\n');

  // ── Bloque 2: Habilidades con competencia ─────────────────────────────────
  const skillsStr = Object.entries(SKILL_STAT).map(([skill, statKey]) => {
    const base    = stats[statKey] || 10;
    const tmp     = statsTmp[statKey] || 0;
    const modVal  = mod(base + tmp);
    const tieneComp = skills.includes(skill);
    const total   = modVal + (tieneComp ? prof : 0);
    return `${tieneComp?'●':'○'} **${skill}** ${signo(total)} *(${STAT_ES[statKey]})*`;
  }).sort().join('\n');

  // ── Bloque 3: Armas del inventario con stats de ataque y daño ────────────
  const inv = char.inventory || [];
  const armasInv = inv.filter(i => {
    const dano = i.daño || i.dano || i.damage;
    const nom  = (i.nombre||'').toLowerCase();
    if (dano) return true;
    const datosArma = ARMAS[i.nombre] || Object.values(ARMAS).find(a => a);
    return i.categoria === 'Arma' || i.categoria === 'Arma Única' || i.categoria === 'Arma Dorada' ||
      /espada|hacha|arco|ballesta|lanza|daga|maza|mazo|estoque|jabalina|cimitarra|tridente|martillo|dardo|honda/.test(nom);
  });

  const armasStr = armasInv.length ? armasInv.slice(0,8).map(item => {
    const nom    = item.nombre;
    const dano   = item.daño || item.dano || ARMAS[nom]?.daño || ARMAS[nom]?.dano || '1d6';
    const esDist = /arco|ballesta|honda|cerbatana/.test(nom.toLowerCase());
    const modAtk = esDist ? mod(stats.DEX||10) : mod(stats.STR||10);
    // Bonus mágico del arma
    const bonusMag = parseInt((nom.match(/\+(\d+)/)||[,'0'])[1]);
    const bonoTotal = prof + modAtk + bonusMag;
    const danoStr = dano.replace(/(\d+d\d+)/, `$1${signo(modAtk + bonusMag)}`);
    return `**${nom}**: ataque ${signo(bonoTotal)} | daño ${danoStr}${bonusMag?` *(+${bonusMag} mágico)*`:''}`;
  }).join('\n') : '*Sin armas en inventario*';

  // ── Bloque 4: Info de combate ─────────────────────────────────────────────
  const ca      = 10 + mod(stats.DEX||10);
  const iniciativa = mod(stats.DEX||10);
  const hpMax   = char.hpMax || 10;
  const hpActual = char.hpActual ?? hpMax;

  const embed = new EmbedBuilder()
    .setTitle(`📊 Stats completas — ${char.name}`)
    .setColor(0x2C3E50)
    .setDescription(`**${char.race}** ${char.class} nv.**${nivel}** · Bono competencia: **${signo(prof)}**`)
    .addFields(
      { name: '❤️ HP', value: barra(hpActual,hpMax) + ` ${hpActual}/${hpMax}`, inline: false },
      { name: '⚔️ Combate', value:
        `CA: **${ca}** · Iniciativa: **${signo(iniciativa)}**\n` +
        `Velocidad: **30 ft** · Bono Prof: **${signo(prof)}**`,
        inline: false },
      { name: '🎲 Stats y Salvaciones (✓ = comp.)', value: statsStr, inline: false },
      { name: '🗡️ Armas', value: armasStr.slice(0,1024), inline: false },
      { name: '🎯 Habilidades (● = competencia)', value: skillsStr.slice(0,1024), inline: false },
    )
    .setFooter({ text: 'Salvaciones con ✓ = competencia de clase · stats tmp del bar incluidas' });

  await interaction.reply({ embeds:[embed], ephemeral:true });
}

// ─── /salvacion ───────────────────────────────────────────────────────────────
async function cmdSalvacion(interaction) {
  const uid    = interaction.user.id;
  const char   = getCharacter(uid);
  if (!char) return interaction.reply({ content:'❌ Sin personaje.', ephemeral:true });

  const statKey = interaction.options.getString('stat').toUpperCase();
  const cd      = interaction.options.getInteger('cd') || null;

  const stats   = char.finalStats || {};
  const nivel   = char.level || 1;
  const prof    = Math.ceil(nivel/4)+1;
  const cls     = CLASSES[char.class] || {};
  const saves   = cls.saves || [];

  const val     = stats[statKey] || 10;
  const modVal  = mod(val);
  const tieneComp = saves.includes(statKey);
  const bono    = modVal + (tieneComp ? prof : 0);
  const dado    = Math.floor(Math.random()*20)+1;
  const total   = dado + bono;

  const esCrit  = dado === 20;
  const esPifia = dado === 1;
  const exito   = cd ? total >= cd : null;

  const COLOR = esCrit ? 0x2ECC71 : esPifia ? 0xFF4444 : exito === true ? 0x2ECC71 : exito === false ? 0xFF4444 : 0x3498DB;
  const TITULO = esCrit ? '✨ ¡Crítico!' : esPifia ? '💀 ¡Pifia!' : exito === true ? '✅ ¡Éxito!' : exito === false ? '❌ Fallo' : '🎲 Salvación';

  const STAT_NOMBRES = { STR:'Fuerza', DEX:'Destreza', CON:'Constitución', INT:'Inteligencia', WIS:'Sabiduría', CHA:'Carisma' };

  const embed = new EmbedBuilder()
    .setTitle(TITULO)
    .setColor(COLOR)
    .setDescription(
      `**${char.name}** tira salvación de **${STAT_NOMBRES[statKey]||statKey}**\n\n` +
      `🎲 d20: **${dado}** + bono **${signo(bono)}** = **${total}**\n` +
      (tieneComp ? `*(+${prof} competencia de clase)*\n` : '') +
      (cd ? `\nCD requerida: **${cd}** → ${exito?'Superada':'No superada'}` : '')
    )
    .setFooter({ text: char.class + (tieneComp ? ` · Competente en ${STAT_ES[statKey]}` : '') });

  await interaction.reply({ embeds:[embed] });
}

// ─── /dm-monstruos ────────────────────────────────────────────────────────────
async function cmdDmMonstruos(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const tipo   = interaction.options.getString('tipo') || null;
  const nombre = interaction.options.getString('nombre') || null;

  let todos = getTodosLosMonstruos();

  if (!todos.length) {
    return interaction.reply({
      embeds:[new EmbedBuilder()
        .setTitle('🐉 Sin monstruos registrados')
        .setColor(0xCC2200)
        .setDescription(
          'Los archivos de monstruos están vacíos todavía.\n\n' +
          '**Archivos a rellenar:**\n' +
          '• `data/monstruosDnD.js` — Manual de Monstruos D&D 5e\n' +
          '• `data/monstruosMH.js` — Monster Hunter\n' +
          '• `data/monstruosVarios.js` — Expansiones y homebrew\n' +
          '• `data/monstruosOP.js` — Jefes y encuentros épicos\n\n' +
          '**Formato de cada monstruo:**\n' +
          '```js\n{ nombre, tipo, cr, hp, ca, ataque, daño, velocidad,\n  stats:{STR,DEX,CON,INT,WIS,CHA},\n  desc, recompensaXP, loot }```'
        )],
      ephemeral:true,
    });
  }

  // Filtrar
  if (tipo)   todos = todos.filter(m => m.tipo?.toLowerCase().includes(tipo.toLowerCase()));
  if (nombre) todos = todos.filter(m => m.nombre?.toLowerCase().includes(nombre.toLowerCase()));

  if (!todos.length)
    return interaction.reply({ content:`❌ Sin monstruos con tipo "${tipo||''}" nombre "${nombre||''}"`, ephemeral:true });

  // Mostrar hasta 15 por página
  const pagina = todos.slice(0,15);
  const fields = pagina.map(m => ({
    name: `${m.nombre} *(CR ${m.cr} · ${m.tipo})*`,
    value:
      `❤️ ${m.hp} HP · 🛡️ CA ${m.ca} · ⚔️ ${m.ataque||'?'} · 💥 ${m.daño||'?'}\n` +
      `FUE ${m.stats?.STR||10} DES ${m.stats?.DEX||10} CON ${m.stats?.CON||10} ` +
      `INT ${m.stats?.INT||10} SAB ${m.stats?.WIS||10} CAR ${m.stats?.CHA||10}\n` +
      `XP: ${m.recompensaXP||0}` + (m.desc ? ` · *${m.desc.slice(0,60)}*` : ''),
    inline:false,
  }));

  // Agrupar por CR para la descripción
  const porCR = {};
  todos.forEach(m => { const cr = String(m.cr||0); porCR[cr]=(porCR[cr]||0)+1; });
  const crStr = Object.entries(porCR).sort(([a],[b])=>parseFloat(a)-parseFloat(b))
    .map(([cr,n]) => `CR${cr}: ${n}`).join(' · ');

  const embed = new EmbedBuilder()
    .setTitle(`🐉 Monstruos disponibles${tipo?' — '+tipo:''}`)
    .setColor(0xCC2200)
    .setDescription(`**${todos.length}** monstruos${nombre?' que contienen "'+nombre+'"':''}\n${crStr}`)
    .addFields(...fields.slice(0,10))
    .setFooter({ text: todos.length > 15 ? `Mostrando 15 de ${todos.length}. Usa /dm-monstruos tipo: para filtrar.` : `${todos.length} monstruos` });

  await interaction.reply({ embeds:[embed], ephemeral:true });
}

module.exports = { cmdMisStats, cmdSalvacion, cmdDmMonstruos };
