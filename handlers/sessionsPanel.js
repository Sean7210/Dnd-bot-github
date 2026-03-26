// ── handlers/sessionsPanel.js ─────────────────────────────────────────────────
// Sistema de sesiones de campaña
//
//  /dm-sesion-crear nombre max    → DM crea sesión
//  /dm-sesion-cerrar              → DM cierra sesión activa
//  /dm-sesion-ver                 → DM ve quién está en la sesión
//  /sesion-unirse                 → Jugador se une a sesión activa
//  /sesion-salir                  → Jugador abandona la sesión
// ─────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCharacter } = require('../db/characterStore.js');
const { isDM }         = require('./dmPanel.js');

// Estado en memoria: { [guildId]: { nombre, max, dmId, jugadores:[userId], channelId, abierta } }
const SESIONES = new Map();

async function notificarDM(client, guildId, mensaje) {
  const sesion = SESIONES.get(guildId);
  if (!sesion) return;
  // Notificar en #dm-notificaciones
  try {
    const guild   = await client.guilds.fetch(guildId);
    const canal   = guild.channels.cache.find(c => c.name === 'dm-notificaciones' || c.name === 'dm-notifications');
    if (canal) await canal.send(mensaje);
  } catch {}
  // También mensaje privado al DM
  try {
    const dmUser = await client.users.fetch(sesion.dmId);
    if (dmUser) await dmUser.send(mensaje);
  } catch {}
}

// ─── /dm-sesion-crear ─────────────────────────────────────────────────────────
async function cmdDmSesionCrear(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM puede crear sesiones.', ephemeral: true });

  const nombre = interaction.options.getString('nombre');
  const max    = interaction.options.getInteger('max') || 6;
  const guildId = interaction.guildId;

  if (SESIONES.has(guildId) && SESIONES.get(guildId).abierta)
    return interaction.reply({ content: '❌ Ya hay una sesión activa. Ciérrala primero con `/dm-sesion-cerrar`.', ephemeral: true });

  SESIONES.set(guildId, {
    nombre, max, dmId: interaction.user.id,
    jugadores: [], channelId: interaction.channelId, abierta: true,
  });

  const embed = new EmbedBuilder()
    .setTitle(`📋 Sesión creada — ${nombre}`)
    .setColor(0x4169E1)
    .setDescription(
      `El DM ha abierto una nueva sesión de campaña.\n\n` +
      `**Plazas:** 0 / ${max}\n\n` +
      `Los jugadores pueden unirse con \`/sesion-unirse\`.`
    );

  await interaction.reply({ embeds: [embed] });
}

// ─── /dm-sesion-cerrar ────────────────────────────────────────────────────────
async function cmdDmSesionCerrar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM puede cerrar sesiones.', ephemeral: true });

  const sesion = SESIONES.get(interaction.guildId);
  if (!sesion?.abierta)
    return interaction.reply({ content: '❌ No hay sesión activa.', ephemeral: true });

  const jugadoresStr = sesion.jugadores.length
    ? sesion.jugadores.map(id => `<@${id}>`).join(', ')
    : '*Nadie se unió*';

  SESIONES.delete(interaction.guildId);

  const embed = new EmbedBuilder()
    .setTitle(`🔒 Sesión cerrada — ${sesion.nombre}`)
    .setColor(0x888888)
    .setDescription(`La sesión ha terminado.\n\n**Participantes:** ${jugadoresStr}`);

  await interaction.reply({ embeds: [embed] });
}

// ─── /dm-sesion-ver ───────────────────────────────────────────────────────────
async function cmdDmSesionVer(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM puede ver los detalles de la sesión.', ephemeral: true });

  const sesion = SESIONES.get(interaction.guildId);
  if (!sesion?.abierta)
    return interaction.reply({ content: '❌ No hay sesión activa.', ephemeral: true });

  const lines = sesion.jugadores.length
    ? await Promise.all(sesion.jugadores.map(async (uid, i) => {
        const char = getCharacter(uid);
        return `${i + 1}. <@${uid}>${char ? ` — **${char.name}** (${char.race} ${char.class} Nv.${char.level})` : ' *(sin personaje)*'}`;
      }))
    : ['*Nadie se ha unido todavía*'];

  const embed = new EmbedBuilder()
    .setTitle(`📋 Sesión: ${sesion.nombre}`)
    .setColor(0x4169E1)
    .setDescription(`**Plazas:** ${sesion.jugadores.length} / ${sesion.max}\n\n${lines.join('\n')}`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── /sesion-unirse ───────────────────────────────────────────────────────────
async function cmdSesionUnirse(interaction) {
  const sesion = SESIONES.get(interaction.guildId);
  if (!sesion?.abierta)
    return interaction.reply({ content: '❌ No hay ninguna sesión activa en este servidor.', ephemeral: true });

  if (sesion.jugadores.includes(interaction.user.id))
    return interaction.reply({ content: '❌ Ya estás en la sesión.', ephemeral: true });

  if (sesion.jugadores.length >= sesion.max)
    return interaction.reply({ content: `❌ La sesión **${sesion.nombre}** está llena (${sesion.max}/${sesion.max}).`, ephemeral: true });

  sesion.jugadores.push(interaction.user.id);

  const char = getCharacter(interaction.user.id);
  const charInfo = char ? `con **${char.name}** (${char.race} ${char.class} Nv.${char.level})` : '*(sin personaje registrado)*';

  // Notificar al DM
  const notif = `📥 **${interaction.user.displayName}** se ha unido a la sesión **${sesion.nombre}** ${charInfo}. (${sesion.jugadores.length}/${sesion.max} plazas)`;
  await notificarDM(interaction.client, interaction.guildId, notif);

  const embed = new EmbedBuilder()
    .setTitle(`✅ Unido a la sesión — ${sesion.nombre}`)
    .setColor(0x00CC00)
    .setDescription(`Te has unido a la sesión. **Plazas:** ${sesion.jugadores.length}/${sesion.max}`)
    .setFooter({ text: 'El DM ha sido notificado.' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── /sesion-salir ────────────────────────────────────────────────────────────
async function cmdSesionSalir(interaction) {
  const sesion = SESIONES.get(interaction.guildId);
  if (!sesion?.abierta)
    return interaction.reply({ content: '❌ No hay sesión activa.', ephemeral: true });

  if (!sesion.jugadores.includes(interaction.user.id))
    return interaction.reply({ content: '❌ No estás en ninguna sesión activa.', ephemeral: true });

  sesion.jugadores = sesion.jugadores.filter(id => id !== interaction.user.id);

  await notificarDM(interaction.client, interaction.guildId,
    `📤 **${interaction.user.displayName}** ha abandonado la sesión **${sesion.nombre}**. (${sesion.jugadores.length}/${sesion.max} plazas)`
  );

  await interaction.reply({ content: `✅ Has abandonado la sesión **${sesion.nombre}**.`, ephemeral: true });
}

module.exports = {
  cmdDmSesionCrear, cmdDmSesionCerrar, cmdDmSesionVer,
  cmdSesionUnirse, cmdSesionSalir, notificarDM,
};
