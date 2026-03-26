// ── handlers/achievementsPanel.js ─────────────────────────────────────────────
// Sistema de logros — publica en #logros con tag, recompensa 3d10 monedas
// ─────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder } = require('discord.js');
const { CLASSES }      = require('../data/classes.js');
const { calcProfBonus } = require('../utils/helpers.js');

// ─── Tipos de moneda según d5 ─────────────────────────────────────────────────
const MONEDAS_RECOMPENSA = [null, 'PC', 'PP', 'PE', 'PO', 'PT']; // 1→PC, 5→PT

function tirarRecompensa() {
  const dados   = [1,2,3].reduce(a => a + Math.floor(Math.random()*10)+1, 0); // 3d10
  const moneda  = MONEDAS_RECOMPENSA[Math.floor(Math.random()*5)+1];
  return { cantidad: dados, moneda };
}

// ─── Catálogo de logros ───────────────────────────────────────────────────────
const LOGROS = {

  // ── Por nivel ────────────────────────────────────────────────────────────────
  nivel_1:  { id:'nivel_1',  nombre:'🌱 El Inicio de Todo',       desc:'Empezaste la aventura. Felicidades, ya sabes dónde está la puerta.' },
  nivel_5:  { id:'nivel_5',  nombre:'⚔️ Ahora en Serio',          desc:'Nivel 5. Ya no mueres de un estornudo... probablemente.' },
  nivel_10: { id:'nivel_10', nombre:'🔥 Los Bardos te Cantan',    desc:'Nivel 10. Alguien en algún lugar ya está escribiendo canciones sobre ti.' },
  nivel_15: { id:'nivel_15', nombre:'💀 Peligrosamente Famoso',   desc:'Nivel 15. Los villanos ya saben tu nombre.' },
  nivel_20: { id:'nivel_20', nombre:'🌟 Leyenda Viviente',        desc:'Nivel 20. Ya puedes presumir en la taberna... si sobrevives para llegar.' },

  // ── Combate — buenos ────────────────────────────────────────────────────────
  primer_critico: {
    id:'primer_critico', nombre:'🎯 ¡En el Blanco!',
    desc:'Tu primer golpe crítico. El destino te sonrió... esta vez.',
  },
  diez_criticos: {
    id:'diez_criticos', nombre:'💥 Favorito del Azar',
    desc:'10 críticos. El dado claramente te tiene cariño.',
  },
  matar_enemigo: {
    id:'matar_enemigo', nombre:'🗡️ Primera Sangre',
    desc:'Derrotaste a tu primer enemigo. El camino de la violencia ha comenzado.',
  },
  ganar_duelo: {
    id:'ganar_duelo', nombre:'🏆 Campeón del Canal',
    desc:'Ganaste tu primer duelo. El otro jugador no está muy contento.',
  },
  diez_duelos: {
    id:'diez_duelos', nombre:'⚔️ Gladiador de Descuento',
    desc:'10 duelos ganados. Ya eres el terror del servidor... o el irritante.',
  },

  // ── Combate — sarcásticos ────────────────────────────────────────────────────
  primer_uno: {
    id:'primer_uno', nombre:'🎲 El Arte del Fallo',
    desc:'Sacaste un 1 natural. El arma se te cayó, te golpeaste solo, o algo peor. Impresionante.',
  },
  cinco_unos: {
    id:'cinco_unos', nombre:'🪦 Amigo del Suelo',
    desc:'5 pifias. En este punto el dado te odia personalmente.',
  },
  primer_cero_hp: {
    id:'primer_cero_hp', nombre:'😵 El Suelo se Siente Bien',
    desc:'Llegaste a 0 HP. Ese golpe fue duro, pero sobreviviste... por ahora.',
  },
  tres_veces_cero: {
    id:'tres_veces_cero', nombre:'🩹 Amante del Drama',
    desc:'0 HP por tercera vez. El curandero ya te conoce de nombre.',
  },
  perder_duelo: {
    id:'perder_duelo', nombre:'🥄 El Suelo es tu Amigo',
    desc:'Perdiste un duelo. La próxima vez tal vez entrenas primero.',
  },

  // ── Economía ─────────────────────────────────────────────────────────────────
  gastar_100po: {
    id:'gastar_100po', nombre:'💸 El Agujero en el Bolsillo',
    desc:'Gastaste 100 PO. El posadero tiene una nueva sonrisa desde que llegaste.',
  },
  gastar_1000po: {
    id:'gastar_1000po', nombre:'🏦 Economía en Llamas',
    desc:'1000 PO gastadas. Probablemente era necesario. Probablemente.',
  },
  tener_500po: {
    id:'tener_500po', nombre:'🤑 Potencialmente Rico',
    desc:'Acumulaste 500 PO. Ahora todo el mundo quiere ser tu amigo.',
  },

  // ── Objetos y mejoras ────────────────────────────────────────────────────────
  primera_mejora: {
    id:'primera_mejora', nombre:'⚙️ Bricolaje Mágico',
    desc:'Mejorado tu primer objeto con el artificiero. La magia es solo ciencia que no entiendes.',
  },
  arma_plus5: {
    id:'arma_plus5', nombre:'💎 Rareza Desbloqueada',
    desc:'Tienes un arma +5 o superior. Qué vergüenza para tus enemigos.',
  },
  arma_plus10: {
    id:'arma_plus10', nombre:'🔶 Insultantemente Poderoso',
    desc:'Arma +10. En este punto es bullying.',
  },

  // ── Exploración y rol ────────────────────────────────────────────────────────
  primera_pocion: {
    id:'primera_pocion', nombre:'🧪 Farmacéutico de Urgencia',
    desc:'Compraste tu primera poción. Por si acaso. Siempre por si acaso.',
  },
  primer_hechizo: {
    id:'primer_hechizo', nombre:'✨ Manos que Brillan',
    desc:'Lanzaste tu primer hechizo. Espera que no exploró nada importante.',
  },
  cofre_desbloqueado: {
    id:'cofre_desbloqueado', nombre:'🗄️ Propietario Orgulloso',
    desc:'Abriste un cofre del gremio. 10 PO cada 21 días bien gastados.',
  },
};

// ─── Canal de logros ──────────────────────────────────────────────────────────
async function getCanalLogros(guild) {
  if (!guild) return null;
  // Intentar primero por nombre exacto, luego parcial
  return guild.channels.cache.find(c =>
    c.isTextBased() && (
      c.name === 'logros' || c.name === 'achievements' ||
      c.name === 'logros-campaña' || c.name === 'campaign-achievements' ||
      c.name.includes('logro')
    )
  ) || null;
}

// ─── Publicar logro en el canal + recompensa ──────────────────────────────────
async function publicarLogro(client, guildId, userId, charName, logro) {
  try {
    // Obtener guild de forma robusta
    let guild = client.guilds.cache.get(guildId);
    if (!guild) guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;

    const canal = await getCanalLogros(guild);
    if (!canal) {
      console.log(`[Logros] Sin canal de logros en ${guild.name}. Crea uno llamado #logros.`);
      return;
    }

    // Tirar recompensa
    const { cantidad, moneda } = tirarRecompensa();

    // Dar la moneda al personaje
    try {
      const { getCharacter, saveCharacter } = require('../db/characterStore.js');
      const char = getCharacter(userId);
      if (char) {
        const money = { ...(char.money || { PC:0,PP:0,PE:0,PO:0,PT:0 }) };
        money[moneda] = (money[moneda] || 0) + cantidad;
        saveCharacter(userId, { ...char, money }, guildId);
      }
    } catch {}

    const COLORES = {
      nivel_1: 0x2ECC71, nivel_5: 0x3498DB, nivel_10: 0xF1C40F, nivel_15: 0xE67E22, nivel_20: 0xFFD700,
      primer_critico: 0x2ECC71, diez_criticos: 0xFFD700, matar_enemigo: 0xFF4444,
      ganar_duelo: 0xFFD700, diez_duelos: 0xF1C40F,
      primer_uno: 0x95A5A6, cinco_unos: 0x7F8C8D,
      primer_cero_hp: 0xE74C3C, tres_veces_cero: 0x8E44AD,
      perder_duelo: 0x95A5A6,
      gastar_100po: 0xF39C12, gastar_1000po: 0xE67E22, tener_500po: 0xF1C40F,
      primera_mejora: 0xE67E22, arma_plus5: 0x3498DB, arma_plus10: 0xFF5733,
      primera_pocion: 0x9B59B6, primer_hechizo: 0x9B59B6, cofre_desbloqueado: 0x8B6914,
    };

    const embed = new EmbedBuilder()
      .setTitle('🏆 ' + logro.nombre)
      .setColor(COLORES[logro.id] || 0xFFD700)
      .setDescription(
        '<@' + userId + '> (**' + charName + '**) consiguió:\n\n' +
        '**' + logro.nombre + '**\n*' + logro.desc + '*\n\n' +
        '🎁 Recompensa: **' + cantidad + ' ' + moneda + '** (3d10 · d5 moneda)'
      )
      .setTimestamp()
      .setFooter({ text: 'Logro desbloqueado' });

    await canal.send({ content: '<@' + userId + '>', embeds: [embed] });
  } catch(e) {
    console.error('[Logros] Error publicando:', e.message);
  }
}

// ─── Verificar y otorgar un logro ─────────────────────────────────────────────
async function otorgarLogro(client, guildId, userId, charName, logroId) {
  const logro = LOGROS[logroId];
  if (!logro) return;

  // Verificar si ya lo tiene (guardado en DB o memoria)
  try {
    const { get, run, exists } = require('../db/database.js');
    if (exists()) {
      const ya = get('SELECT id FROM logros WHERE user_id=? AND nombre=?', userId, logroId);
      if (ya) return; // ya lo tiene
      run('INSERT INTO logros (user_id, nombre) VALUES (?,?)', userId, logroId);
    }
  } catch {}

  await publicarLogro(client, guildId, userId, charName, logro);
}

// ─── checkLevelUp: llamado al subir de nivel ──────────────────────────────────
async function checkLevelUp(client, userId, char, guildId) {
  try {
    // Logro de nivel
    const logroNivel = 'nivel_' + char.level;
    if (LOGROS[logroNivel]) {
      await otorgarLogro(client, guildId, userId, char.name, logroNivel);
    }

    // Notificar subclase disponible
    const { notificarSubclaseDisponible } = require('./subclasePanel.js');
    await notificarSubclaseDisponible(client, userId, char).catch(()=>{});

    // Notificar hechizos al subir nivel
    try {
      const { notificarSeleccionPendiente, inicializarMagia } = require('./magiaPanel.js');
      inicializarMagia(char);
      const { saveCharacter } = require('../db/characterStore.js');
      saveCharacter(userId, char, guildId);
      await notificarSeleccionPendiente(client, userId, char);
    } catch {}

    // DM de subida de nivel
    try {
      const cls       = CLASSES[char.class] || {};
      const profBonus = calcProfBonus(char.level);
      const user      = await client.users.fetch(userId);
      const tieneASI  = [4,8,12,16,19].includes(char.level) ||
        (char.class === 'Guerrero' && [6,10,14].includes(char.level)) ||
        (char.class === 'Pícaro' && [10].includes(char.level));

      await user.send({ embeds: [new EmbedBuilder()
        .setTitle('🎉 ¡' + char.name + ' sube al nivel ' + char.level + '!')
        .setColor(0xFFD700)
        .setDescription(
          '¡Felicitaciones! Nivel **' + char.level + '**.\n\n' +
          '🎲 Dado de golpe: d' + (cls.hitDie||6) + '\n' +
          '🎯 Bono de competencia: +' + profBonus + '\n' +
          (tieneASI ? '⬆️ **¡ASI disponible!** Usa `/subir-nivel`.\n' : '') +
          (cls.subclassLevel === char.level ? '✨ **¡Subclase disponible!** Usa `/obtener-subclase`.\n' : '')
        )] });
    } catch {}
  } catch(e) {
    console.error('[checkLevelUp]', e.message);
  }
}

// ─── procesarSubidaNivel (legacy alias) ──────────────────────────────────────
async function procesarSubidaNivel(client, guild, userId, char, nuevoNivel) {
  await checkLevelUp(client, userId, { ...char, level: nuevoNivel }, guild?.id);
}

module.exports = {
  LOGROS,
  otorgarLogro,
  publicarLogro,
  checkLevelUp,
  procesarSubidaNivel,
  getCanalLogros,
};
