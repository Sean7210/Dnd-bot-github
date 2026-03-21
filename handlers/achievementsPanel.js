// ── handlers/achievementsPanel.js ────────────────────────────────────────────
// Sistema de logros y notificaciones al subir de nivel
//
// Se llama desde dmPanel.js al ejecutar /dm-subirnivel
// Publica en el canal #logros o #achievements cuando corresponde
// ─────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder } = require('discord.js');
const { CLASSES }      = require('../data/classes.js');
const { calcHP, calcProfBonus } = require('../utils/helpers.js');

// Logros por nivel
const LOGROS = [
  { nivel: 1,  nombre: '🌱 Inicio de la Aventura', desc: 'Todo gran héroe empieza en algún lugar.' },
  { nivel: 10, nombre: '⚔️ Aventurero Avanzado',   desc: 'Has alcanzado el nivel 10. Los bardos empiezan a cantar tus hazañas.' },
  { nivel: 20, nombre: '🌟 Aventurero Épico',       desc: '¡Nivel 20! Eres una leyenda viviente del mundo.' },
  { nivel: 35, nombre: '👑 Leyenda',                desc: 'Nivel 35. Tu nombre será recordado por generaciones.' },
];

// ─── Enviar logro al canal de logros ─────────────────────────────────────────
async function publicarLogro(client, guild, userId, charName, logro) {
  try {
    const canal = guild.channels.cache.find(c =>
      c.name === 'logros' || c.name === 'achievements' ||
      c.name === 'logros-campaña' || c.name === 'campaign-achievements'
    );
    if (!canal) return;

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${logro.nombre}`)
      .setColor(0xFFD700)
      .setDescription(`<@${userId}> con **${charName}** ha conseguido el logro **${logro.nombre}**.\n\n*${logro.desc}*`)
      .setTimestamp();

    await canal.send({ embeds: [embed] });
  } catch {}
}

// ─── Notificar subclase disponible ──────────────────────────────────────────
async function notificarSubclase(client, userId, charName, clase, nivel) {
  const cls = CLASSES[clase];
  if (!cls?.subclassLevel || cls.subclassLevel !== nivel) return;

  try {
    const user = await client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setTitle('✨ ¡Subclase disponible!')
      .setColor(0x9B59B6)
      .setDescription(
        `**${charName}** ha llegado al nivel **${nivel}** y puede elegir su **${cls.subclassLabel || 'Subclase'}** de ${clase}.\n\n` +
        `Usa \`/subir-nivel\` para seleccionarla.\n\n` +
        `**Subclases disponibles:**\n` +
        Object.keys(cls.subclasses || {}).map(s => `• ${s}`).join('\n')
      );
    await user.send({ embeds: [embed] });
  } catch {}
}

// ─── Función principal: llamar tras subir de nivel ──────────────────────────
async function procesarSubidaNivel(client, guild, userId, char, nuevoNivel) {
  // 1. Verificar logros
  const logro = LOGROS.find(l => l.nivel === nuevoNivel);
  if (logro) {
    await publicarLogro(client, guild, userId, char.name, logro);
  }

  // 2. Notificar subclase si corresponde
  await notificarSubclase(client, userId, char.name, char.class, nuevoNivel);

  // 3. Mensaje privado de subida de nivel
  try {
    const cls      = CLASSES[char.class];
    const profBonus = calcProfBonus(nuevoNivel);
    const hpExtra  = cls ? Math.floor(cls.hitDie / 2) + 1 + Math.floor((char.finalStats?.CON ?? 10 - 10) / 2) : 0;
    const tieneASI = [4,8,12,16,19].includes(nuevoNivel) ||
      (char.class === 'Guerrero' && [6,10,14].includes(nuevoNivel)) ||
      (char.class === 'Pícaro'   && [10].includes(nuevoNivel));

    const user = await client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setTitle(`🎉 ¡${char.name} sube al nivel ${nuevoNivel}!`)
      .setColor(0xFFD700)
      .setDescription(
        `¡Felicitaciones! Tu personaje ha alcanzado el nivel **${nuevoNivel}**.\n\n` +
        `🎲 **Dado de golpe extra:** d${cls?.hitDie ?? 6} + mod CON (~${hpExtra} HP)\n` +
        `🎯 **Bono de competencia:** +${profBonus}\n` +
        (tieneASI ? `⬆️ **¡ASI disponible!** Usa \`/subir-nivel\` para aplicar tu Mejora de Puntuación.\n` : '') +
        (cls?.subclassLevel === nuevoNivel ? `✨ **¡Subclase disponible!** Usa \`/subir-nivel\` para elegirla.\n` : '')
      );
    await user.send({ embeds: [embed] });
  } catch {}
}

module.exports = { procesarSubidaNivel };
