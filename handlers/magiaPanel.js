// ── handlers/magiaPanel.js ────────────────────────────────────────────────────
// Sistema completo de hechizos y trucos
//
// /mis-hechizos        → Ver hechizos conocidos, slots disponibles, trucos
// /preparar-hechizo    → Preparar/aprender un hechizo nuevo
// /lanzar-hechizo      → Usar un hechizo (gasta slot), con upcast automático
// /descanso            → Recuperar todos los slots (long rest)
// /dm-dar-hechizo      → DM da un hechizo extra a un jugador
// /dm-revocar-hechizo  → DM quita un hechizo
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');

const { getCharacter, updateCharacter, saveCharacter } = require('../db/characterStore.js');
const { isDM }         = require('../utils/isDM.js');
const { HECHIZOS, HECHIZOS_POR_CLASE, TRUCOS, getHechizosClaseNivel } = require('../data/spells.js');
const {
  CLASES_MAGICAS, calcularSlots, trucosPorNivel, hechizosDisponibles,
  nivelMaxSlot, calcularUpcast, HECHIZOS_TRASFONDO, HECHIZOS_RAZA,
} = require('../data/spellSystem.js');

// ─── Helper responder ─────────────────────────────────────────────────────────
async function rep(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply({ ...payload, ephemeral: true });
}

// ─── Inicializar hechizos de un personaje nuevo ───────────────────────────────
function inicializarMagia(char) {
  if (!CLASES_MAGICAS.has(char.class)) return char;
  if (char._magiaInicializada) return char;

  const nivel   = char.level || 1;
  const slots   = calcularSlots(char.class, nivel);
  const maxTrucos = trucosPorNivel(char.class, nivel);
  const maxHechizos = hechizosDisponibles(char.class, nivel, char.finalStats || {});

  // Slots actuales = slots máximos al empezar
  const slotsActuales = {};
  if (slots?.tipo === 'pact') {
    slotsActuales.pact = slots.slots;
  } else if (slots?.slots) {
    Object.assign(slotsActuales, slots.slots);
  }

  // Hechizos de raza
  const razaData = HECHIZOS_RAZA[char.race] || {};
  const trucoRaza = razaData.trucos || [];

  // Hechizos de trasfondo
  const bgData = HECHIZOS_TRASFONDO[char.background] || {};
  const trucoBg = bgData.trucos || [];

  char.magia = {
    slotsMax:       slotsActuales,
    slotsActuales:  { ...slotsActuales },
    trucos:         [...trucoRaza, ...trucoBg],  // trucos ya elegidos
    hechizos:       [],                          // hechizos aprendidos
    trucosMax:      maxTrucos,
    hechizosMax:    maxHechizos,
    // Pendientes de elegir
    trucosEnSel:    maxTrucos - trucoRaza.length - trucoBg.length,
    hechizosEnSel:  maxHechizos,
  };
  char._magiaInicializada = true;
  return char;
}

// ─── Notificar al jugador que tiene selección pendiente ───────────────────────
async function notificarSeleccionPendiente(client, userId, char) {
  if (!CLASES_MAGICAS.has(char.class)) return;

  const magia = char.magia;
  if (!magia) return;

  const trucosElectibles = (magia.trucosMax || 0) - (magia.trucos?.length || 0);
  const hechizosElectibles = (magia.hechizosMax || 0) - (magia.hechizos?.length || 0);

  if (trucosElectibles <= 0 && hechizosElectibles <= 0) return;

  try {
    const user = await client.users.fetch(userId);
    const slots = calcularSlots(char.class, char.level || 1);
    const maxNivel = nivelMaxSlot(char.class, char.level || 1);

    const lineas = [];
    if (trucosElectibles > 0) {
      lineas.push(`🔮 **${trucosElectibles} truco${trucosElectibles>1?'s':''}** por elegir de tu clase (${char.class})`);
    }
    if (hechizosElectibles > 0) {
      lineas.push(`📖 **${hechizosElectibles} hechizo${hechizosElectibles>1?'s':''}** por aprender (slots hasta nivel ${maxNivel})`);
    }

    // Añadir trucos de raza/trasfondo ya incluidos
    const razaData = HECHIZOS_RAZA[char.race] || {};
    const bgData   = HECHIZOS_TRASFONDO[char.background] || {};
    const extras   = [...(razaData.trucos||[]), ...(bgData.trucos||[])];
    if (extras.length) {
      lineas.push(`✅ **Trucos automáticos** de raza/trasfondo: ${extras.join(', ')}`);
    }

    const embed = new EmbedBuilder()
      .setTitle('🔮 ¡Tienes hechizos por elegir!')
      .setColor(0x9B59B6)
      .setDescription(
        `**${char.name}** (${char.class} nv.${char.level}) tiene selecciones de magia pendientes:\n\n` +
        lineas.join('\n') +
        '\n\nUsa `/preparar-hechizo` en el servidor para elegirlos.'
      )
      .setFooter({ text: 'Los trucos son gratuitos y no gastan slots. Los hechizos gastan slots al lanzarlos.' });

    await user.send({ embeds: [embed] });
  } catch {}
}

// ─── /mis-hechizos ────────────────────────────────────────────────────────────
async function cmdMisHechizos(interaction) {
  const char = getCharacter(interaction.user.id);
  if (!char) return rep(interaction, { content: '❌ Sin personaje. Usa `/crear-personaje`.' });
  if (!CLASES_MAGICAS.has(char.class))
    return rep(interaction, { content: `❌ **${char.class}** no es una clase lanzadora de hechizos.` });

  const magia = char.magia || {};
  const slots = calcularSlots(char.class, char.level || 1);

  // Slots display
  let slotsStr = '—';
  if (slots?.tipo === 'pact') {
    const act = magia.slotsActuales?.pact ?? slots.slots;
    const max = slots.slots;
    slotsStr = `Pacto nv.${slots.nivelSlot}: **${act}/${max}** slots`;
  } else if (slots?.slots) {
    slotsStr = Object.entries(slots.slots)
      .map(([n, max]) => {
        const act = magia.slotsActuales?.[n] ?? max;
        return `Nv${n}: **${act}/${max}**`;
      }).join(' · ');
  }

  // Trucos
  const trucos = magia.trucos || [];
  const trucosStr = trucos.length ? trucos.join(', ') : '*(ninguno)*';
  const trucosMax = trucosPorNivel(char.class, char.level || 1);
  const trucosPend = Math.max(0, trucosMax - trucos.length);

  // Hechizos por nivel
  const hechizos = magia.hechizos || [];
  const porNivel = {};
  hechizos.forEach(nombre => {
    const h = HECHIZOS[nombre];
    if (!h) return;
    const n = h.nivel;
    if (!porNivel[n]) porNivel[n] = [];
    porNivel[n].push(nombre + (h.concentracion ? ' (C)' : '') + (h.ritual ? ' (R)' : ''));
  });

  const hechizosStr = Object.keys(porNivel).length
    ? Object.entries(porNivel).sort(([a],[b])=>a-b)
        .map(([n, lst]) => `**Nv${n}:** ${lst.join(', ')}`)
        .join('\n')
    : '*(ninguno)*';

  const embed = new EmbedBuilder()
    .setTitle(`🔮 Hechizos de ${char.name}`)
    .setColor(0x9B59B6)
    .setDescription(`${char.class} nivel ${char.level} · ${char.race}`)
    .addFields(
      { name: '🎯 Slots de hechizo', value: slotsStr, inline: false },
      { name: `✨ Trucos (${trucos.length}/${trucosMax})`, value: trucosStr, inline: false },
      { name: `📖 Hechizos (${hechizos.length}/${magia.hechizosMax||'?'})`, value: hechizosStr.slice(0,1024), inline: false },
    );

  if (trucosPend > 0) {
    embed.addFields({ name: '⚠️ Selección pendiente', value: `Tienes **${trucosPend} truco${trucosPend>1?'s':''}** por elegir. Usa \`/preparar-hechizo trucos:si\`.`, inline: false });
  }

  await rep(interaction, { embeds: [embed] });
}

// ─── /preparar-hechizo ────────────────────────────────────────────────────────
async function cmdPrepararHechizo(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return rep(interaction, { content: '❌ Sin personaje.' });
  if (!CLASES_MAGICAS.has(char.class))
    return rep(interaction, { content: `❌ ${char.class} no usa magia.` });

  const esTruco  = interaction.options.getBoolean('trucos') || false;
  const nivelBus = interaction.options.getInteger('nivel') || 1;

  if (!char.magia) {
    inicializarMagia(char);
    saveCharacter(uid, char, interaction.guildId);
  }

  const magia = char.magia;
  const nivel = char.level || 1;
  const maxNivel = nivelMaxSlot(char.class, nivel);

  if (esTruco) {
    const trucosMax = trucosPorNivel(char.class, nivel);
    const trucosAct = magia.trucos?.length || 0;
    if (trucosAct >= trucosMax)
      return rep(interaction, { content: `❌ Ya tienes todos tus trucos (${trucosMax}/${trucosMax}). Máximo alcanzado.` });

    // Mostrar trucos disponibles de la clase que no tiene aún
    const trucosDis = Object.keys(TRUCOS).filter(nombre => {
      if ((magia.trucos||[]).includes(nombre)) return false;
      // Verificar que es de su clase
      const claseData = HECHIZOS_POR_CLASE[char.class];
      if (!claseData) return false;
      const enClase = Object.values(claseData).some(lst => lst.includes(nombre));
      // Si no está en la lista de clase, ¿está disponible?
      return enClase || TRUCOS[nombre]; // permitir trucos del catálogo general
    }).slice(0, 25);

    if (!trucosDis.length)
      return rep(interaction, { content: '❌ No hay trucos disponibles para añadir.' });

    const embed = new EmbedBuilder()
      .setTitle(`✨ Elegir truco — ${char.name}`)
      .setColor(0x9B59B6)
      .setDescription(`Tienes **${trucosAct}/${trucosMax}** trucos. Elige 1:`)
      .addFields({ name: 'Trucos disponibles', value: trucosDis.slice(0,10).map(t => `**${t}** (${TRUCOS[t]?.escuela||'?'})`).join('\n') });

    await rep(interaction, {
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('magia_elegir_truco')
          .setPlaceholder('Elige tu truco...')
          .addOptions(trucosDis.map(t => ({
            label: t.slice(0,100),
            description: (TRUCOS[t]?.escuela || '').slice(0,100) || undefined,
            value: t.slice(0,100),
          })))
      )],
    });
    return;
  }

  // Elegir hechizo de nivel específico
  if (nivelBus < 1 || nivelBus > maxNivel)
    return rep(interaction, { content: `❌ Tu clase puede lanzar hechizos hasta nivel ${maxNivel}. Elige entre 1 y ${maxNivel}.` });

  const maxHechizos = hechizosDisponibles(char.class, nivel, char.finalStats || {});
  const hechizosAct = magia.hechizos?.length || 0;
  if (hechizosAct >= maxHechizos)
    return rep(interaction, { content: `❌ Ya has aprendido todos tus hechizos (${hechizosAct}/${maxHechizos}).` });

  // Hechizos de la clase en ese nivel que no tiene aún
  const claseData = HECHIZOS_POR_CLASE[char.class] || {};
  const disponiblesNivel = (claseData[nivelBus] || [])
    .filter(nombre => !(magia.hechizos||[]).includes(nombre) && HECHIZOS[nombre])
    .slice(0, 25);

  if (!disponiblesNivel.length)
    return rep(interaction, { content: `❌ No hay hechizos de nivel ${nivelBus} disponibles para ${char.class}.` });

  const embed = new EmbedBuilder()
    .setTitle(`📖 Aprender hechizo nivel ${nivelBus} — ${char.name}`)
    .setColor(0x4B0082)
    .setDescription(`Hechizos (${hechizosAct}/${maxHechizos}).\nElige 1 hechizo de nivel ${nivelBus}:`)
    .addFields({
      name: 'Disponibles',
      value: disponiblesNivel.slice(0,8).map(n => {
        const h = HECHIZOS[n];
        return `**${n}** — ${h.escuela}${h.concentracion?' (C)':''}${h.ritual?' (R)':''}`;
      }).join('\n')
    });

  await rep(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`magia_elegir_hechizo_${nivelBus}`)
        .setPlaceholder(`Elige hechizo nivel ${nivelBus}...`)
        .addOptions(disponiblesNivel.map(n => {
          const h = HECHIZOS[n];
          return {
            label: n.slice(0,100),
            description: (h.escuela + (h.concentracion?' · Concentración':'') + (h.ritual?' · Ritual':'')).slice(0,100) || undefined,
            value: n.slice(0,100),
          };
        }))
    )],
  });
}

// ─── /lanzar-hechizo ──────────────────────────────────────────────────────────
async function cmdLanzarHechizo(interaction) {
  const uid    = interaction.user.id;
  const char   = getCharacter(uid);
  if (!char) return rep(interaction, { content: '❌ Sin personaje.' });
  if (!CLASES_MAGICAS.has(char.class))
    return rep(interaction, { content: '❌ Tu clase no usa magia.' });

  const nombre    = interaction.options.getString('hechizo');
  const slotUsado = interaction.options.getInteger('slot') || null;

  if (!char.magia) {
    inicializarMagia(char);
    saveCharacter(uid, char, interaction.guildId);
  }

  const magia = char.magia;
  const hechizo = HECHIZOS[nombre];

  // Verificar que lo conoce
  const loConoce = (magia.trucos||[]).includes(nombre) || (magia.hechizos||[]).includes(nombre);
  if (!loConoce)
    return rep(interaction, { content: `❌ No conoces **${nombre}**. Usa \`/preparar-hechizo\` para aprenderlo.` });

  // Trucos: no gastan slot
  if (hechizo?.nivel === 0 || (magia.trucos||[]).includes(nombre)) {
    const embed = new EmbedBuilder()
      .setTitle(`✨ Truco: ${nombre}`)
      .setColor(0x9B59B6)
      .setDescription(
        `**${char.name}** usa el truco **${nombre}**.\n\n` +
        `*${hechizo?.desc?.slice(0,300) || '—'}*\n\n` +
        `⚡ Los trucos no gastan slots de hechizo.`
      );
    return rep(interaction, { embeds: [embed] });
  }

  if (!hechizo) return rep(interaction, { content: `❌ Hechizo **${nombre}** no encontrado en el catálogo.` });

  // Determinar slot a usar
  const nivelHechizo = hechizo.nivel;
  const slotFinal    = slotUsado || nivelHechizo;

  if (slotFinal < nivelHechizo)
    return rep(interaction, { content: `❌ **${nombre}** es de nivel ${nivelHechizo}. No puedes usar un slot inferior (nivel ${slotFinal}).` });

  // Verificar slots disponibles
  const tipo = char.class === 'Brujo' ? 'pact' : String(slotFinal);
  let slotsDisp;
  if (tipo === 'pact') {
    slotsDisp = magia.slotsActuales?.pact ?? 0;
    const nivelPact = calcularSlots(char.class, char.level||1)?.nivelSlot || 1;
    if (slotFinal > nivelPact)
      return rep(interaction, { content: `❌ Brujo: tus slots de pacto son de nivel ${nivelPact}. No puedes lanzar en slot ${slotFinal}.` });
  } else {
    slotsDisp = magia.slotsActuales?.[slotFinal] ?? 0;
  }

  if (slotsDisp <= 0)
    return rep(interaction, { content: `❌ No te quedan slots de nivel ${slotFinal}. Descansa con \`/descanso\`.` });

  // Gastar slot
  if (tipo === 'pact') {
    magia.slotsActuales.pact = slotsDisp - 1;
  } else {
    magia.slotsActuales[slotFinal] = slotsDisp - 1;
  }

  saveCharacter(uid, char, interaction.guildId);

  // Calcular upcast
  const upcast = slotFinal > nivelHechizo ? calcularUpcast(nombre, slotFinal) : null;

  const embed = new EmbedBuilder()
    .setTitle(`🔮 ${nombre}`)
    .setColor(0x4B0082)
    .setDescription(
      `**${char.name}** lanza **${nombre}**` +
      (slotFinal > nivelHechizo ? ` en slot de nivel ${slotFinal} (⬆️ upcast)` : '') + '.\n\n' +
      `*${hechizo.desc?.slice(0,400) || '—'}*`
    )
    .addFields(
      { name: '📋 Detalles', value:
        `**Escuela:** ${hechizo.escuela}\n` +
        `**Alcance:** ${hechizo.alcance}\n` +
        `**Duración:** ${hechizo.duracion}` +
        (hechizo.concentracion ? ' *(Concentración)*' : ''),
        inline: true },
      { name: '🎯 Slot gastado', value: tipo === 'pact' ? `Pacto (queda${magia.slotsActuales.pact===1?'':'n'} ${magia.slotsActuales.pact})` : `Nv.${slotFinal} (quedan ${magia.slotsActuales[slotFinal]})`, inline: true },
    );

  if (upcast) {
    embed.addFields({ name: '⬆️ Upcast', value: upcast.desc, inline: false });
  }

  await rep(interaction, { embeds: [embed] });
}

// ─── /descanso ────────────────────────────────────────────────────────────────
async function cmdDescanso(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return rep(interaction, { content: '❌ Sin personaje.' });

  // Restaurar slots
  if (char.magia) {
    const slots = calcularSlots(char.class, char.level || 1);
    if (slots?.tipo === 'pact') {
      char.magia.slotsActuales = { pact: slots.slots };
    } else if (slots?.slots) {
      char.magia.slotsActuales = { ...slots.slots };
    }
    saveCharacter(uid, char, interaction.guildId);
  }

  // Restaurar HP
  const hpMax = char.hpMax || 10;
  updateCharacter(uid, { hpActual: hpMax });

  const embed = new EmbedBuilder()
    .setTitle('😴 Descanso largo completado')
    .setColor(0x2ECC71)
    .setDescription(
      `**${char.name}** completa un descanso largo.\n\n` +
      `❤️ HP restaurados: **${hpMax}/${hpMax}**\n` +
      (CLASES_MAGICAS.has(char.class) ? `🔮 Slots de hechizo restaurados.` : '')
    );

  await rep(interaction, { embeds: [embed] });
}

// ─── /dm-dar-hechizo ─────────────────────────────────────────────────────────
async function cmdDmDarHechizo(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const target  = interaction.options.getUser('usuario');
  const nombre  = interaction.options.getString('hechizo');
  const char    = getCharacter(target.id);
  if (!char) return interaction.reply({ content: '❌ Sin personaje.', ephemeral: true });

  if (!char.magia) inicializarMagia(char);

  const hechizo = HECHIZOS[nombre];
  const esTruco = !hechizo || hechizo.nivel === 0;

  if (esTruco) {
    if (!char.magia.trucos) char.magia.trucos = [];
    if (!char.magia.trucos.includes(nombre)) char.magia.trucos.push(nombre);
  } else {
    if (!char.magia.hechizos) char.magia.hechizos = [];
    if (!char.magia.hechizos.includes(nombre)) char.magia.hechizos.push(nombre);
  }

  saveCharacter(target.id, char, interaction.guildId);

  await interaction.reply({
    content: `✅ **${char.name}** recibe el ${esTruco?'truco':'hechizo'} **${nombre}**.`,
    ephemeral: true,
  });

  // Notificar al jugador
  try {
    const user = await interaction.client.users.fetch(target.id);
    await user.send({
      embeds: [new EmbedBuilder()
        .setTitle(`🔮 Nuevo ${esTruco?'truco':'hechizo'}: ${nombre}`)
        .setColor(0x9B59B6)
        .setDescription(
          `El DM te ha dado el ${esTruco?'truco':'hechizo'} **${nombre}**.\n\n` +
          (hechizo ? `*${hechizo.desc?.slice(0,300)}*` : '')
        )]
    });
  } catch {}
}

// ─── Handler de selects ───────────────────────────────────────────────────────
async function handleMagiaInteraction(interaction) {
  if (!interaction.isStringSelectMenu()) return false;
  const id  = interaction.customId;
  const uid = interaction.user.id;

  if (id === 'magia_elegir_truco') {
    const nombre = interaction.values[0];
    const char   = getCharacter(uid);
    if (!char) return false;
    if (!char.magia) inicializarMagia(char);

    if ((char.magia.trucos||[]).includes(nombre)) {
      await interaction.update({ content: `❌ Ya conoces **${nombre}**.`, embeds:[], components:[] });
      return true;
    }

    const trucosMax = trucosPorNivel(char.class, char.level || 1);
    if ((char.magia.trucos?.length||0) >= trucosMax) {
      await interaction.update({ content: `❌ Ya tienes el máximo de trucos (${trucosMax}).`, embeds:[], components:[] });
      return true;
    }

    if (!char.magia.trucos) char.magia.trucos = [];
    char.magia.trucos.push(nombre);
    saveCharacter(uid, char, interaction.guildId);

    const restantes = trucosMax - char.magia.trucos.length;
    await interaction.update({
      embeds: [new EmbedBuilder()
        .setTitle(`✨ Truco aprendido: ${nombre}`)
        .setColor(0x9B59B6)
        .setDescription(
          `**${char.name}** aprende **${nombre}**.\n\n` +
          `*${TRUCOS[nombre]?.desc?.slice(0,300) || HECHIZOS[nombre]?.desc?.slice(0,300) || '—'}*\n\n` +
          (restantes > 0 ? `Te quedan **${restantes}** truco${restantes>1?'s':''} por elegir. Usa \`/preparar-hechizo trucos:si\` de nuevo.` : '✅ ¡Todos los trucos elegidos!')
        )],
      components: [],
    });
    return true;
  }

  if (id.startsWith('magia_elegir_hechizo_')) {
    const nivelH = parseInt(id.replace('magia_elegir_hechizo_',''));
    const nombre = interaction.values[0];
    const char   = getCharacter(uid);
    if (!char) return false;
    if (!char.magia) inicializarMagia(char);

    if ((char.magia.hechizos||[]).includes(nombre)) {
      await interaction.update({ content: `❌ Ya conoces **${nombre}**.`, embeds:[], components:[] });
      return true;
    }

    const maxH = hechizosDisponibles(char.class, char.level||1, char.finalStats||{});
    if ((char.magia.hechizos?.length||0) >= maxH) {
      await interaction.update({ content: `❌ Límite de hechizos alcanzado (${maxH}).`, embeds:[], components:[] });
      return true;
    }

    if (!char.magia.hechizos) char.magia.hechizos = [];
    char.magia.hechizos.push(nombre);
    saveCharacter(uid, char, interaction.guildId);

    const hechizo   = HECHIZOS[nombre];
    const restantes = maxH - char.magia.hechizos.length;

    await interaction.update({
      embeds: [new EmbedBuilder()
        .setTitle(`📖 Hechizo aprendido: ${nombre}`)
        .setColor(0x4B0082)
        .setDescription(
          `**${char.name}** aprende **${nombre}** (nivel ${nivelH}).\n\n` +
          `*${hechizo?.desc?.slice(0,300) || '—'}*\n\n` +
          (restantes > 0 ? `Puedes aprender **${restantes}** hechizo${restantes>1?'s':''} más. Usa \`/preparar-hechizo nivel:N\` de nuevo.` : '✅ ¡Todos los hechizos elegidos!')
        )],
      components: [],
    });
    return true;
  }

  return false;
}

module.exports = {
  inicializarMagia, notificarSeleccionPendiente,
  cmdMisHechizos, cmdPrepararHechizo, cmdLanzarHechizo,
  cmdDescanso, cmdDmDarHechizo,
  handleMagiaInteraction,
};
