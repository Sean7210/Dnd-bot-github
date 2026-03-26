// ── handlers/cazaPanel.js ─────────────────────────────────────────────────────
// Sistema de eventos de caza de monstruos
//
// Inicio:
//   Automático → cada X horas (configurable, por defecto desactivado hasta tener monstruos)
//   Manual     → /dm-evento-caza [tipo] [monstruo]
//
// Flujo del evento:
//   1. DM lanza el evento → mensaje público con el monstruo
//   2. Jugadores se unen con botón "⚔️ Participar"
//   3. Combate por rondas (todos atacan al monstruo en orden)
//   4. Al derrotarlo → loot distribuido entre participantes
//   5. Loot especial si fue el golpe de gracia
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

const { getCaza, setCaza, deleteCaza, hasCaza } = require('../db/stateStore.js');
const { isDM }           = require('../utils/isDM.js');
const { getCharacter, updateCharacter } = require('../db/characterStore.js');
const { MONSTRUOS_DND }  = require('../data/monstruosDnD.js');
const { MONSTRUOS_MH }   = require('../data/monstruosMH.js');
const { MONSTRUOS_VARIOS }= require('../data/monstruosVarios.js');
const { MONSTRUOS_OP }   = require('../data/monstruosOP.js');
const { tirarLoot, tirarLootMultiple } = require('../data/lootTables.js');

// ─── Pool completo de monstruos ───────────────────────────────────────────────
function getTodosLosMonstruos() {
  return [
    ...MONSTRUOS_DND,
    ...MONSTRUOS_MH,
    ...MONSTRUOS_VARIOS,
    ...MONSTRUOS_OP,
  ];
}

function getMonstruosPorTipo(tipo) {
  const todos = getTodosLosMonstruos();
  if (!tipo || tipo === 'aleatorio') return todos;
  return todos.filter(m => m.tipo?.toLowerCase().includes(tipo.toLowerCase()));
}

function getMonstruoPorNombre(nombre) {
  return getTodosLosMonstruos().find(m =>
    m.nombre.toLowerCase().includes(nombre.toLowerCase())
  );
}

function getMonstruoAleatorio(tipo = null) {
  const pool = tipo ? getMonstruosPorTipo(tipo) : getTodosLosMonstruos();
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Estado de eventos activos ────────────────────────────────────────────────
// { guildId: { monstruo, hpActual, hpMax, participantes:[uid], fase, channelId, msgId, ronda } }
// CAZAS → stateStore.js (persistente)

// ─── /dm-evento-caza ─────────────────────────────────────────────────────────
async function cmdDmEventoCaza(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const guildId = interaction.guildId;
  if (hasCaza(guildId))
    return interaction.reply({ content: '❌ Ya hay una caza activa. Termínala primero.', ephemeral: true });

  const nombreMon = interaction.options.getString('monstruo');
  const tipo      = interaction.options.getString('tipo');
  const duracion  = interaction.options.getInteger('duracion') || 30; // minutos

  // Buscar monstruo
  let monstruo = nombreMon ? getMonstruoPorNombre(nombreMon) : getMonstruoAleatorio(tipo);

  // Si no hay monstruos en las listas todavía, usar un placeholder
  if (!monstruo) {
    monstruo = {
      nombre: nombreMon || 'Criatura Desconocida',
      tipo:   tipo || 'Bestia',
      cr:     1,
      hp:     40,
      ca:     13,
      ataque: '+4',
      daño:   '1d8+2',
      velocidad: 30,
      desc:   'Una criatura misteriosa aparece en las afueras del pueblo.',
      recompensaXP: 200,
      loot:   null,
    };
  }

  const estado = {
    monstruo,
    hpActual:     monstruo.hp,
    hpMax:        monstruo.hp,
    participantes: [],
    fase:         'reclutamiento',
    channelId:    interaction.channelId,
    ronda:        1,
    golpeGracia:  null,
    duracion,
  };
  setCaza(guildId, estado);

  const barra = hp => '█'.repeat(Math.round((hp/monstruo.hp)*10)) + '░'.repeat(10-Math.round((hp/monstruo.hp)*10));

  const embed = new EmbedBuilder()
    .setTitle('🐉 ¡EVENTO DE CAZA!')
    .setColor(0xCC2200)
    .setDescription(
      `Una amenaza ha aparecido cerca del pueblo.\n\n` +
      `**${monstruo.nombre}** *(${monstruo.tipo} — CR ${monstruo.cr})*\n` +
      `❤️ \`${barra(monstruo.hp)}\` ${monstruo.hp} HP · 🛡️ CA ${monstruo.ca}\n\n` +
      `*${monstruo.desc || ''}*\n\n` +
      `⏳ Ventana de unirse: **${duracion} minutos**\n` +
      `Pulsa el botón para participar en la caza.`
    )
    .addFields(
      { name: '⚔️ Ataque', value: monstruo.ataque || '?', inline: true },
      { name: '💥 Daño',   value: monstruo.daño   || '?', inline: true },
      { name: '🏃 Vel.',   value: (monstruo.velocidad || 30) + ' ft', inline: true },
    )
    .setFooter({ text: 'CR ' + monstruo.cr + ' · ' + monstruo.recompensaXP + ' XP' });

  const rows = [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('caza_unirse').setLabel('⚔️ Participar en la caza').setStyle(ButtonStyle.Danger),
  )];

  const msg = await interaction.reply({ embeds: [embed], components: rows, fetchReply: true });
  estado.msgId = msg.id;

  // Timer para iniciar el combate
  estado.timer = setTimeout(async () => {
    if (hasCaza(guildId)) await iniciarCombateCaza(interaction.client, guildId);
  }, duracion * 60 * 1000);

  // También permitir inicio manual
  return;
}

// ─── /dm-caza-iniciar (forzar inicio antes del tiempo) ───────────────────────
async function cmdDmCazaIniciar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const estado = CAZAS.get(interaction.guildId);
  if (!estado) return interaction.reply({ content: '❌ No hay caza activa.', ephemeral: true });
  if (estado.fase !== 'reclutamiento')
    return interaction.reply({ content: '❌ La caza ya está en combate.', ephemeral: true });
  if (!estado.participantes.length)
    return interaction.reply({ content: '❌ Nadie se ha unido todavía.', ephemeral: true });

  clearTimeout(estado.timer);
  await interaction.reply({ content: '✅ ¡Iniciando el combate!', ephemeral: true });
  await iniciarCombateCaza(interaction.client, interaction.guildId);
}

// ─── /dm-caza-cancelar ────────────────────────────────────────────────────────
async function cmdDmCazaCancelar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const estado = CAZAS.get(interaction.guildId);
  if (!estado) return interaction.reply({ content: '❌ No hay caza activa.', ephemeral: true });

  clearTimeout(estado.timer);
  CAZAS.delete(interaction.guildId);
  await interaction.reply({ content: '✅ Caza cancelada.' });
}

// ─── Iniciar combate ──────────────────────────────────────────────────────────
async function iniciarCombateCaza(client, guildId) {
  const estado = getCaza(guildId);
  if (!estado || !estado.participantes.length) {
    deleteCaza(guildId);
    return;
  }

  estado.fase = 'combate';
  estado.turnoActual = 0;

  const guild   = client.guilds.cache.get(guildId);
  const channel = guild?.channels.cache.get(estado.channelId)
    || guild?.channels.cache.find(c => c.isTextBased());
  if (!channel) return;

  const participantesStr = estado.participantes.map(uid => {
    const char = getCharacter(uid);
    return `• **${char?.name || uid}** (${char?.class || '?'} nv.${char?.level || 1})`;
  }).join('\n');

  await channel.send({
    embeds: [new EmbedBuilder()
      .setTitle('⚔️ ¡LA CAZA COMIENZA!')
      .setColor(0xCC2200)
      .setDescription(
        `**${estado.monstruo.nombre}** está listo para la batalla.\n\n` +
        `**Participantes (${estado.participantes.length}):**\n${participantesStr}\n\n` +
        `Cada jugador tiene **1 acción por ronda**. Pulsa el botón para atacar cuando sea tu turno.`
      )],
  });

  await siguienteRondaCaza(client, guildId);
}

// ─── Ronda de combate ─────────────────────────────────────────────────────────
async function siguienteRondaCaza(client, guildId) {
  const estado = getCaza(guildId);
  if (!estado || estado.fase !== 'combate') return;
  if (estado.hpActual <= 0) { await terminarCaza(client, guildId); return; }
  if (estado.turnoActual >= estado.participantes.length) {
    // Fin de ronda: el monstruo ataca a todos
    estado.ronda++;
    estado.turnoActual = 0;
    await ataqueMonstruo(client, guildId);
    return;
  }

  const uid   = estado.participantes[estado.turnoActual];
  const char  = getCharacter(uid);
  const guild = client.guilds.cache.get(guildId);
  const channel = guild?.channels.cache.get(estado.channelId);

  const barra = hp => '█'.repeat(Math.round((hp/estado.hpMax)*10)) + '░'.repeat(10-Math.round((hp/estado.hpMax)*10));

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Ronda ' + estado.ronda + ' — Turno de ' + (char?.name || uid))
    .setColor(0x8B0000)
    .setDescription(
      `**${estado.monstruo.nombre}** ❤️ \`${barra(estado.hpActual)}\` ${estado.hpActual}/${estado.hpMax} HP\n\n` +
      `<@${uid}> ¡Es tu turno! Elige tu acción:`
    );

  await channel?.send({
    content: '<@' + uid + '>',
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('caza_atacar_' + uid).setLabel('⚔️ Atacar').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('caza_hechizo_' + uid).setLabel('✨ Hechizo').setStyle(ButtonStyle.Primary).setDisabled(
        !char?.magia || !(char.magia.trucos?.length || char.magia.hechizos?.length)
      ),
      new ButtonBuilder().setCustomId('caza_esquivar_' + uid).setLabel('🛡️ Esquivar').setStyle(ButtonStyle.Secondary),
    )],
  });
}

// ─── El monstruo ataca a todos ────────────────────────────────────────────────
async function ataqueMonstruo(client, guildId) {
  const estado  = getCaza(guildId);
  if (!estado) return;

  const guild   = client.guilds.cache.get(guildId);
  const channel = guild?.channels.cache.get(estado.channelId);
  const m       = estado.monstruo;

  const lineas = [];
  for (const uid of estado.participantes) {
    const char = getCharacter(uid);
    if (!char || (char.hpActual || char.hpMax || 0) <= 0) continue;

    const d20  = Math.floor(Math.random() * 20) + 1;
    const bono = parseInt((m.ataque || '+0').replace('+','')) || 0;
    const total = d20 + bono;
    const ca    = 10 + Math.floor(((char.finalStats?.DEX || 10) - 10) / 2);

    if (d20 === 20 || total >= ca) {
      // Parsear dado de daño del monstruo
      const danoMatch = (m.daño || '1d6').match(/(\d+)d(\d+)([+-]\d+)?/);
      let danio = 1;
      if (danoMatch) {
        const dados = parseInt(danoMatch[1]);
        const lados = parseInt(danoMatch[2]);
        const bonus = parseInt(danoMatch[3] || '0');
        danio = 0;
        for (let i = 0; i < dados; i++) danio += Math.floor(Math.random() * lados) + 1;
        danio = Math.max(1, danio + bonus);
        if (d20 === 20) danio *= 2;
      }
      const hpNuevo = Math.max(0, (char.hpActual || char.hpMax || 0) - danio);
      updateCharacter(uid, { hpActual: hpNuevo });
      lineas.push(`💢 **${m.nombre}** golpea a **${char.name}**: ${d20===20?'🎯 CRÍTICO! ':''}**${danio}** daño (${char.hpActual}→${hpNuevo} HP)`);
      if (hpNuevo <= 0) lineas.push(`💀 **${char.name}** ha caído inconsciente.`);
    } else {
      lineas.push(`✗ **${m.nombre}** falla a **${char.name}** (${total} vs CA ${ca}).`);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle('🐉 El ' + m.nombre + ' ataca!')
    .setColor(0x8B0000)
    .setDescription(lineas.join('\n') || '*El monstruo no alcanzó a nadie.*');

  await channel?.send({ embeds: [embed] });
  await siguienteRondaCaza(client, guildId);
}

// ─── Terminar la caza ─────────────────────────────────────────────────────────
async function terminarCaza(client, guildId) {
  const estado  = getCaza(guildId);
  if (!estado) return;
  deleteCaza(guildId);

  const guild   = client.guilds.cache.get(guildId);
  const channel = guild?.channels.cache.get(estado.channelId);
  const m       = estado.monstruo;

  // Loot para cada participante
  const lootLineas = [];
  for (const uid of estado.participantes) {
    const char = getCharacter(uid);
    if (!char) continue;
    const items = m.loot ? tirarLootMultiple(m.loot, Math.ceil(m.cr || 1)) : [];
    const xp    = Math.floor((m.recompensaXP || 0) / estado.participantes.length);

    if (items.length) {
      const inv = [...(char.inventory || [])];
      items.forEach(item => inv.push({ ...item, categoria: item.categoria || 'Loot' }));
      updateCharacter(uid, { inventory: inv });
      lootLineas.push(`**${char.name}:** ${items.map(i => i.nombre + (i.cantidad > 1 ? ' ×' + i.cantidad : '')).join(', ')} (+${xp} XP)`);
    } else {
      lootLineas.push(`**${char.name}:** +${xp} XP *(sin loot)*`);
    }
  }

  // Golpe de gracia
  const gc = estado.golpeGracia ? getCharacter(estado.golpeGracia) : null;

  const embed = new EmbedBuilder()
    .setTitle('🏆 ¡' + m.nombre + ' ha sido derrotado!')
    .setColor(0xFFD700)
    .setDescription(
      (gc ? `🎯 **Golpe de gracia:** ${gc.name}\n\n` : '') +
      `**Loot:**\n${lootLineas.join('\n') || '*(sin loot)*'}`
    )
    .setFooter({ text: estado.participantes.length + ' cazadores participaron · CR ' + m.cr });

  await channel?.send({ embeds: [embed] });
}

// ─── Handler de botones ───────────────────────────────────────────────────────
async function handleCazaInteraction(interaction) {
  const id  = interaction.customId || '';
  const uid = interaction.user.id;

  // Unirse a la caza
  if (id === 'caza_unirse') {
    const estado = CAZAS.get(interaction.guildId);
    if (!estado || estado.fase !== 'reclutamiento')
      return interaction.reply({ content: '❌ La caza ya ha comenzado o no existe.', ephemeral: true });

    const char = getCharacter(uid);
    if (!char) return interaction.reply({ content: '❌ No tienes personaje.', ephemeral: true });
    if (estado.participantes.includes(uid))
      return interaction.reply({ content: '❌ Ya estás en la caza.', ephemeral: true });

    estado.participantes.push(uid);
    await interaction.reply({
      content: `✅ **${char.name}** se une a la caza. Participantes: ${estado.participantes.length}`,
      ephemeral: false,
    });
    return true;
  }

  // Atacar
  if (id.startsWith('caza_atacar_')) {
    const uidBtn = id.replace('caza_atacar_', '');
    if (uidBtn !== uid)
      return interaction.reply({ content: '❌ No es tu turno.', ephemeral: true });

    const estado = CAZAS.get(interaction.guildId);
    if (!estado || estado.fase !== 'combate')
      return interaction.reply({ content: '❌ No hay caza activa.', ephemeral: true });

    const char = getCharacter(uid);
    if (!char) return interaction.reply({ content: '❌ Sin personaje.', ephemeral: true });

    const prof  = Math.ceil((char.level || 1) / 4) + 1;
    const stats = char.finalStats || {};
    const modSTR = Math.floor(((stats.STR || 10) - 10) / 2);
    const d20   = Math.floor(Math.random() * 20) + 1;
    const bono  = prof + modSTR;
    const total = d20 + bono;
    const ca    = estado.monstruo.ca || 10;

    let log = '';
    if (d20 === 20 || total >= ca) {
      // Daño del arma del jugador
      const armaInv = (char.inventory || []).find(i => i.daño || i.dano);
      const danoStr = armaInv?.daño || armaInv?.dano || '1d6';
      const danoM   = danoStr.match(/(\d+)d(\d+)([+-]\d+)?/);
      let danio = 1;
      if (danoM) {
        const dados = parseInt(danoM[1]), lados = parseInt(danoM[2]), bonus = parseInt(danoM[3] || '0');
        for (let i = 0; i < dados*(d20===20?2:1); i++) danio += Math.floor(Math.random() * lados) + 1;
        danio = Math.max(1, danio - 1 + bonus + modSTR);
      }
      estado.hpActual = Math.max(0, estado.hpActual - danio);
      if (d20 === 20) estado.golpeGracia = uid; // actualizar posible golpe de gracia
      log = (d20===20 ? '🎯 **¡CRÍTICO!** ' : '✅ **Impacto!** ') +
        `${char.name} causa **${danio}** daño con ${armaInv?.nombre || 'ataque'}. ` +
        `${estado.monstruo.nombre}: ${estado.hpActual}/${estado.hpMax} HP`;
    } else {
      log = `❌ ${char.name} falla (${total} vs CA ${ca}).`;
    }

    await interaction.update({ content: log, embeds: [], components: [] });

    if (estado.hpActual <= 0) {
      estado.golpeGracia = uid;
      await terminarCaza(interaction.client, interaction.guildId);
    } else {
      estado.turnoActual++;
      await siguienteRondaCaza(interaction.client, interaction.guildId);
    }
    return true;
  }

  // Esquivar
  if (id.startsWith('caza_esquivar_')) {
    const uidBtn = id.replace('caza_esquivar_', '');
    if (uidBtn !== uid)
      return interaction.reply({ content: '❌ No es tu turno.', ephemeral: true });

    const estado = CAZAS.get(interaction.guildId);
    if (!estado) return false;

    const char = getCharacter(uid);
    await interaction.update({
      content: `🛡️ **${char?.name}** se pone en posición defensiva. Gana +2 CA esta ronda.`,
      embeds: [], components: [],
    });
    estado.turnoActual++;
    await siguienteRondaCaza(interaction.client, interaction.guildId);
    return true;
  }

  // Hechizo (básico — usar truco/hechizo más potente disponible)
  if (id.startsWith('caza_hechizo_')) {
    const uidBtn = id.replace('caza_hechizo_', '');
    if (uidBtn !== uid)
      return interaction.reply({ content: '❌ No es tu turno.', ephemeral: true });

    const estado = CAZAS.get(interaction.guildId);
    if (!estado) return false;

    const char = getCharacter(uid);
    const magia = char?.magia;
    if (!magia) { await interaction.update({ content: '❌ Sin magia.', embeds:[], components:[] }); return true; }

    // Usar el hechizo de mayor daño disponible
    const { HECHIZOS } = require('../data/spells.js');
    const candidatos = [...(magia.trucos||[]), ...(magia.hechizos||[])].map(n => HECHIZOS[n]).filter(Boolean);
    const hechizo = candidatos.sort((a,b) => {
      const dA = a.desc?.match(/(\d+)d(\d+)/)?.[0] || '0d0';
      const dB = b.desc?.match(/(\d+)d(\d+)/)?.[0] || '0d0';
      return parseInt(dB) - parseInt(dA);
    })[0];

    if (!hechizo) { await interaction.update({ content: '❌ Sin hechizos disponibles.', embeds:[], components:[] }); return true; }

    const danoM = hechizo.desc?.match(/(\d+)d(\d+)/);
    let danio = 1;
    if (danoM) {
      const dados = parseInt(danoM[1]), lados = parseInt(danoM[2]);
      for (let i = 0; i < dados; i++) danio += Math.floor(Math.random() * lados) + 1;
      danio--;
    }

    estado.hpActual = Math.max(0, estado.hpActual - danio);
    const log = `✨ **${char.name}** lanza **${hechizo.nombre || 'un hechizo'}** causando **${danio}** daño. ${estado.monstruo.nombre}: ${estado.hpActual}/${estado.hpMax} HP`;

    await interaction.update({ content: log, embeds: [], components: [] });

    if (estado.hpActual <= 0) {
      estado.golpeGracia = uid;
      await terminarCaza(interaction.client, interaction.guildId);
    } else {
      estado.turnoActual++;
      await siguienteRondaCaza(interaction.client, interaction.guildId);
    }
    return true;
  }

  return false;
}

// ─── /dm-evento-caza-listar ───────────────────────────────────────────────────
async function cmdDmCazaListar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const tipo  = interaction.options.getString('tipo');
  const todos = tipo ? getMonstruosPorTipo(tipo) : getTodosLosMonstruos();

  if (!todos.length) {
    return interaction.reply({
      content: '⚠️ No hay monstruos registrados todavía. Añádelos en `data/monstruosDnD.js`, `data/monstruosMH.js`, `data/monstruosVarios.js` o `data/monstruosOP.js`.',
      ephemeral: true,
    });
  }

  const lista = todos.slice(0, 30).map(m =>
    `**${m.nombre}** *(${m.tipo} CR${m.cr})* — ${m.hp} HP · CA ${m.ca}`
  ).join('\n');

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setTitle('🐉 Monstruos disponibles' + (tipo ? ` — ${tipo}` : ''))
      .setColor(0xCC2200)
      .setDescription(lista.slice(0, 4000) || '*Vacío*')
      .setFooter({ text: todos.length + ' monstruos en total' })],
    ephemeral: true,
  });
}

module.exports = {
  cmdDmEventoCaza, cmdDmCazaIniciar, cmdDmCazaCancelar, cmdDmCazaListar,
  handleCazaInteraction,
  getTodosLosMonstruos, getMonstruoAleatorio, getMonstruoPorNombre,
};
