// ── handlers/subclasePanel.js ─────────────────────────────────────────────────
// Sistema de subclases desbloqueadas por nivel
//
// /obtener-subclase  → Jugador elige su subclase (solo si nivel >= subclassLevel y no tiene ya una)
// notificarSubclaseDisponible(client, userId, char) → se llama desde dmPanel al subir nivel
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder,
} = require('discord.js');

const { CLASSES }        = require('../data/classes.js');
const { getCharacter, saveCharacter, updateCharacter } = require('../db/characterStore.js');
const { isDM }           = require('../utils/isDM.js');

function getClaseRobusta(className) {
  if (!className) return null;
  if (CLASSES[className]) return CLASSES[className];
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const found = Object.entries(CLASSES).find(([k]) => norm(k) === norm(className));
  return found ? found[1] : null;
}

// ─── Notificar al jugador que puede elegir subclase ────────────────────────────
async function notificarSubclaseDisponible(client, userId, char) {
  const cls = getClaseRobusta(char.class);
  if (!cls?.subclassLevel) return;
  if (char.level < cls.subclassLevel) return;
  if (char.subclass) return; // ya tiene subclase

  const subs = cls.subclasses || {};
  const lista = (Array.isArray(subs) ? subs : Object.keys(subs)).slice(0,10).join('\n• ');

  try {
    const user = await client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setTitle('✨ ¡Tu subclase está disponible!')
      .setColor(0x9B59B6)
      .setDescription(
        `**${char.name}** ha alcanzado el nivel **${char.level}** y puede elegir su **${cls.subclassLabel || 'Subclase'}**.\n\n` +
        `**Subclases de ${char.class}:**\n• ${lista}\n\n` +
        `Usa el comando \`/obtener-subclase\` para elegir.`
      )
      .setFooter({ text: 'Solo puedes elegir una subclase y no podrá cambiarse.' });
    await user.send({ embeds: [embed] });
  } catch {}

  // También notificar al DM
  try {
    const guild   = await client.guilds.cache.first();
    const canal   = guild?.channels.cache.find(c =>
      ['dm-notificaciones','dm-notifications'].includes(c.name.toLowerCase())
    );
    if (canal) {
      await canal.send({
        embeds: [new EmbedBuilder()
          .setTitle('📣 Subclase disponible para un jugador')
          .setColor(0x9B59B6)
          .setDescription(`<@${userId}> (**${char.name}**, ${char.class} nv.${char.level}) puede elegir su ${cls.subclassLabel || 'subclase'} con \`/obtener-subclase\`.`)
        ]
      });
    }
  } catch {}
}

// ─── /obtener-subclase ────────────────────────────────────────────────────────
async function cmdObtenerSubclase(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);

  if (!char)
    return interaction.reply({ content: '❌ No tienes personaje. Usa `/crear-personaje` primero.', ephemeral: true });

  const cls = getClaseRobusta(char.class);
  if (!cls)
    return interaction.reply({ content: `❌ Clase desconocida: ${char.class}.`, ephemeral: true });

  const nivelRequerido = cls.subclassLevel || 3;

  // Ya tiene subclase
  if (char.subclass) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('✨ Tu subclase actual')
        .setColor(0x9B59B6)
        .setDescription(
          `**${char.name}** ya tiene la subclase **${char.subclass}** de ${char.class}.\n\n` +
          `Solo se puede tener **una subclase** y no puede cambiarse una vez elegida.`
        )],
      ephemeral: true,
    });
  }

  // Nivel insuficiente
  if ((char.level || 1) < nivelRequerido) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🔒 Subclase bloqueada')
        .setColor(0x888888)
        .setDescription(
          `**${char.name}** es ${char.class} nivel **${char.level || 1}**.\n\n` +
          `La **${cls.subclassLabel || 'Subclase'}** de ${char.class} se desbloquea al nivel **${nivelRequerido}**.\n\n` +
          `Te faltan **${nivelRequerido - (char.level||1)}** nivel${nivelRequerido - (char.level||1) !== 1 ? 'es' : ''} para poder elegirla.`
        )
        .setFooter({ text: 'El DM te notificará cuando estés listo.' })],
      ephemeral: true,
    });
  }

  // Nivel suficiente: mostrar opciones
  const subs    = cls.subclasses || {};
  const subsList = Array.isArray(subs)
    ? subs.map(s => [s, {}])
    : Object.entries(subs);

  if (!subsList.length)
    return interaction.reply({ content: `❌ ${char.class} no tiene subclases registradas.`, ephemeral: true });

  const preview = subsList.slice(0,4).map(([name, data]) =>
    `**${name}**\n${data.description || data.desc || '—'}`
  ).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle(`✨ Elige tu ${cls.subclassLabel || 'Subclase'} — ${char.class} nv.${char.level}`)
    .setColor(0x9B59B6)
    .setDescription(
      `**${char.name}** está listo para especializarse.\n\n` +
      preview +
      (subsList.length > 4 ? '\n\n*...y más en el menú*' : '') +
      '\n\n⚠️ **Esta elección es permanente. No podrá cambiarse.**'
    )
    .setFooter({ text: 'Solo puedes elegir una vez.' });

  const opts = subsList.slice(0,25).map(([name, data]) => ({
    label: name,
    description: (data.description || data.desc || '').slice(0,100) || undefined,
    value: name,
  }));

  await interaction.reply({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('obtener_subclase_confirmar')
        .setPlaceholder('Elige tu subclase...')
        .addOptions(opts)
    )],
    ephemeral: true,
  });
}

// ─── Handler del select de subclase ───────────────────────────────────────────
async function handleSubclaseInteraction(interaction) {
  if (!interaction.isStringSelectMenu()) return false;
  if (interaction.customId !== 'obtener_subclase_confirmar') return false;

  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return false;

  // Doble check: no tiene ya subclase
  if (char.subclass) {
    await interaction.update({
      embeds: [new EmbedBuilder()
        .setTitle('❌ Ya tienes subclase')
        .setColor(0xFF4444)
        .setDescription(`**${char.name}** ya tiene la subclase **${char.subclass}**. No puede cambiarse.`)],
      components: [],
    });
    return true;
  }

  const subclaseElegida = interaction.values[0];
  const cls = getClaseRobusta(char.class) || {};
  const subsRaw = cls.subclasses || {};
  const subData = Array.isArray(subsRaw) ? {} : (subsRaw[subclaseElegida] || {});

  // Guardar
  const charActualizado = { ...char, subclass: subclaseElegida };
  saveCharacter(uid, charActualizado, interaction.guildId);

  // Rasgos de la subclase
  const rasgos = subData.features?.slice(0,4).join(', ') || '—';

  const embed = new EmbedBuilder()
    .setTitle('✨ ¡Subclase obtenida!')
    .setColor(0x9B59B6)
    .setDescription(
      `**${char.name}** ha elegido **${subclaseElegida}** como su ${cls.subclassLabel || 'subclase'}.\n\n` +
      `**Clase:** ${char.class} nv.${char.level}\n` +
      `**Rasgos iniciales:** ${rasgos}\n\n` +
      `*Esta subclase ya está registrada en tu ficha y no puede cambiarse.*`
    )
    .setFooter({ text: 'Usa /mi-personaje para ver tu ficha actualizada.' });

  await interaction.update({ embeds: [embed], components: [] });

  // Anuncio público
  try {
    await interaction.channel?.send({
      embeds: [new EmbedBuilder()
        .setTitle('✨ Nueva subclase desbloqueada')
        .setColor(0x9B59B6)
        .setDescription(`<@${uid}> ha elegido la subclase **${subclaseElegida}** (${char.class}).`)
      ]
    }).catch(() => {});
  } catch {}

  return true;
}

// ─── /dm-dar-subclase (el DM puede asignarla directamente) ────────────────────
async function cmdDmDarSubclase(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const target   = interaction.options.getUser('usuario');
  const subclase = interaction.options.getString('subclase');
  const char     = getCharacter(target.id);

  if (!char)
    return interaction.reply({ content: `❌ ${target.displayName} no tiene personaje.`, ephemeral: true });

  if (char.subclass)
    return interaction.reply({ content: `❌ **${char.name}** ya tiene la subclase **${char.subclass}**.`, ephemeral: true });

  saveCharacter(target.id, { ...char, subclass: subclase }, interaction.guildId);
  await interaction.reply({ content: `✅ **${char.name}** tiene ahora la subclase **${subclase}**.` });

  // Notificar al jugador
  try {
    const user = await interaction.client.users.fetch(target.id);
    await user.send({
      embeds: [new EmbedBuilder()
        .setTitle('✨ El DM te ha asignado una subclase')
        .setColor(0x9B59B6)
        .setDescription(`Tu personaje **${char.name}** tiene ahora la subclase **${subclase}** (${char.class}).`)
      ]
    });
  } catch {}
}

module.exports = {
  notificarSubclaseDisponible,
  cmdObtenerSubclase,
  handleSubclaseInteraction,
  cmdDmDarSubclase,
};
