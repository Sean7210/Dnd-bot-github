// ── handlers/artificePanel.js ─────────────────────────────────────────────────
// Taller del Artificiero — mejora objetos del inventario
// El DM abre con /dm-abrir-artificiero
// Flujo: /artificiero → saludo + ver inventario → ¿Quieres mejorar? → el DM fija precio
//        → jugador paga → objeto mejorado → opción de Retar al Destino
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');
const { getCharacter, updateCharacter, getAllCharacters } = require('../db/characterStore.js');
const { totalEnPC, pagar, formatearMonedero } = require('../data/startingWealth.js');
const { isDM } = require('../utils/isDM.js');
const { getSession } = require('../utils/sessions.js');

const TALLERES = new Map(); // guildId → { abierto, channelId, dmId }
const MEJORAS_PENDIENTES = new Map(); // userId → { objeto, idxInv, precioFijado }

// ─── Helpers ──────────────────────────────────────────────────────────────────
// ─── Color del embed según bonus mágico ──────────────────────────────────────
function colorPorBonus(bonus) {
  if (bonus <= 0)  return 0x95A5A6; // gris — sin mejora
  if (bonus <= 2)  return 0xF1C40F; // amarillo — +1 a +2
  if (bonus <= 4)  return 0x2ECC71; // verde — +3 a +4
  if (bonus <= 6)  return 0x3498DB; // azul — +5 a +6
  if (bonus <= 8)  return 0x9B59B6; // morado — +7 a +8
  if (bonus <= 10) return 0xFF5733; // naranja — +9 a +10
  if (bonus <= 12) return 0xFF0000; // rojo — +11 a +12
  return 0xFFFFFF;                  // blanco — +13 o más (legendario)
}

function nombreBonusRareza(bonus) {
  if (bonus <= 0)  return 'Normal';
  if (bonus <= 2)  return '✨ Mágico';
  if (bonus <= 4)  return '💎 Raro';
  if (bonus <= 6)  return '🔷 Muy Raro';
  if (bonus <= 8)  return '🟣 Épico';
  if (bonus <= 10) return '🔶 Legendario';
  if (bonus <= 12) return '🔴 Antiguo';
  return '⬜ Divino';
}

function extraerBonus(nombre) {
  const m = (nombre||'').match(/\+(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function sumarBonus(nombre, cantidad) {
  const actual = extraerBonus(nombre);
  const nuevo  = actual + cantidad;
  if (actual === 0) return nombre.trim() + ` +${nuevo}`;
  return nombre.replace(/\+\d+/, `+${nuevo}`);
}

// ─── /dm-abrir-artificiero ────────────────────────────────────────────────────
async function cmdDmAbrirArtificiero(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  TALLERES.set(interaction.guildId, {
    abierto: true, channelId: interaction.channelId, dmId: interaction.user.id,
  });

  const embed = new EmbedBuilder()
    .setTitle('⚙️ Taller del Artificiero — Abierto')
    .setColor(0xE67E22)
    .setDescription('El artificiero está disponible.\n\nLos jugadores pueden usar `/artificiero` para mejorar sus objetos.\nTú recibirás la solicitud y podrás fijar el precio con `/dm-artificiero-precio`.');

  await interaction.reply({ embeds: [embed] });
}

async function cmdDmCerrarArtificiero(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });
  TALLERES.delete(interaction.guildId);
  await interaction.reply({ content: '⚙️ Taller cerrado.', ephemeral: true });
}

// ─── /artificiero ─────────────────────────────────────────────────────────────
async function cmdArtificiero(interaction) {
  const taller = TALLERES.get(interaction.guildId);
  if (!taller?.abierto)
    return interaction.reply({ content: '❌ El taller del artificiero está cerrado.', ephemeral: true });

  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return interaction.reply({ content: '❌ Sin personaje.', ephemeral: true });

  const hora = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', hour: 'numeric', hour12: true });
  const h    = parseInt(new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', hour: 'numeric', hour12: false }));
  const saludo = h < 12 ? '¡Buenos días!' : h < 18 ? '¡Buenas tardes!' : '¡Buenas noches!';

  const inv = char.inventory || [];
  if (!inv.length)
    return interaction.reply({ content: '❌ Tu inventario está vacío. No hay nada que mejorar.', ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle('⚙️ Taller del Artificiero')
    .setColor(0xE67E22)
    .setDescription(
      `*${saludo}* Son las ${hora} en la República Dominicana.\n\n` +
      `Bienvenido, **${char.name}**. Puedo mejorar cualquier objeto de tu inventario.\n\n` +
      `¿Qué objeto deseas mejorar hoy?`
    );

  const opts = inv.slice(0,25).map((i, idx) => {
    const bonus = extraerBonus(i.nombre);
    return {
      label: i.nombre.slice(0,100),
      description: ((bonus > 0 ? `Mejora actual: +${bonus} — ` : '') + (i.daño || i.descripcion || '')).slice(0,60) || undefined,
      value: `${idx}`,
    };
  });

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('artificiero_elegir_objeto')
        .setPlaceholder('Elige el objeto a mejorar...')
        .addOptions(opts)
    ),
  ];

  await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
}

// ─── /dm-artificiero-precio ───────────────────────────────────────────────────
async function cmdDmArtificieroPrecio(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const targetUser    = interaction.options.getUser('usuario');
  const precio        = interaction.options.getInteger('precio');
  const materiales    = interaction.options.getString('materiales') || '';
  const caracteristica = interaction.options.getString('caracteristica') || '';
  const pendiente     = MEJORAS_PENDIENTES.get(targetUser.id);

  if (!pendiente)
    return interaction.reply({ content: `❌ <@${targetUser.id}> no tiene mejora pendiente.`, ephemeral: true });

  pendiente.precioFijado    = precio;
  pendiente.materiales      = materiales;
  pendiente.caracteristica  = caracteristica;

  // Notificar al jugador
  try {
    const char = getCharacter(targetUser.id);
    const guild = interaction.guild;
    const member = await guild.members.fetch(targetUser.id).catch(()=>null);
    if (member) {
      await member.send({
        embeds: [new EmbedBuilder()
          .setTitle('⚙️ Taller del Artificiero — Precio fijado')
          .setColor(0xE67E22)
          .setDescription(
            `El artificiero ha evaluado la mejora de **${pendiente.objeto.nombre}**.\n\n` +
            `**Precio de mejora:** ${precio} PO\n\n` +
            `Usa el comando \`/artificiero-pagar\` o vuelve al taller para confirmar.`
          )]
      }).catch(()=>{});
    }
  } catch {}

  await interaction.reply({ content: `✅ Precio de **${precio} PO** fijado para la mejora de <@${targetUser.id}>.`, ephemeral: true });
}

// ─── /artificiero-pagar ───────────────────────────────────────────────────────
async function cmdArtificieroPagar(interaction) {
  const uid      = interaction.user.id;
  const pendiente = MEJORAS_PENDIENTES.get(uid);
  const char     = getCharacter(uid);

  if (!pendiente) return interaction.reply({ content: '❌ No tienes mejora pendiente.', ephemeral: true });
  if (!char)      return interaction.reply({ content: '❌ Sin personaje.', ephemeral: true });
  if (pendiente.precioFijado === undefined)
    return interaction.reply({ content: '❌ El artificiero aún no ha fijado el precio. Espera.', ephemeral: true });

  const precio = pendiente.precioFijado;
  const dinero = char.money || {PC:0,PP:0,PE:0,PO:0,PT:0};

  if (totalEnPC(dinero) < precio * 100)
    return interaction.reply({ content: `❌ Fondos insuficientes. Necesitas **${precio} PO**. Tienes: **${formatearMonedero(dinero)}**.`, ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle('⚙️ Confirmar mejora')
    .setColor(0xE67E22)
    .setDescription(
      `**Objeto:** ${pendiente.objeto.nombre}\n` +
      `**Precio:** ${precio} PO\n` +
      `**Tu saldo:** ${formatearMonedero(dinero)}\n\n` +
      (pendiente.materiales ? `**Materiales necesarios:** ${pendiente.materiales}\n\n` : '') +
      (pendiente.caracteristica ? `**Característica especial:** ${pendiente.caracteristica}\n\n` : '') +
      `La mejora añadirá **+2** al objeto (se suma al bonus actual).` +
      (pendiente.caracteristica ? `\nAdemás ganará: **${pendiente.caracteristica}**` : '')
    );

  const rows = [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('artificiero_pagar_confirmar').setLabel(`Pagar ${precio} PO y mejorar`).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('artificiero_cancelar').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
  )];

  await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
}

// ─── Handler de interacciones ─────────────────────────────────────────────────
async function handleArtificeroInteraction(interaction) {
  const id  = interaction.customId || '';
  const uid = interaction.user.id;

  // Select: elegir objeto
  if (interaction.isStringSelectMenu() && id === 'artificiero_elegir_objeto') {
    const idxInv = parseInt(interaction.values[0]);
    const char   = getCharacter(uid);
    const inv    = char?.inventory || [];
    const objeto = inv[idxInv];
    if (!objeto) { await interaction.reply({ content: '❌ Objeto no encontrado.', ephemeral: true }); return true; }

    const bonus = extraerBonus(objeto.nombre);

    // Guardar en memoria
    MEJORAS_PENDIENTES.set(uid, { objeto: { ...objeto }, idxInv, precioFijado: undefined });

    // Notificar al DM
    const taller = TALLERES.get(interaction.guildId);
    try {
      const guild  = interaction.guild;
      const dm     = await guild.members.fetch(taller.dmId).catch(()=>null);
      if (dm) {
        await dm.send({
          embeds: [new EmbedBuilder()
            .setTitle('⚙️ Solicitud de mejora')
            .setColor(0xE67E22)
            .setDescription(
              `<@${uid}> (${char.name}) quiere mejorar:\n\n` +
              `**Objeto:** ${objeto.nombre}\n` +
              (objeto.daño ? `**Daño actual:** ${objeto.daño}\n` : '') +
              `**Bonus actual:** ${bonus > 0 ? '+'+bonus : 'ninguno'}\n` +
              `**Descripción:** ${(objeto.descripcion||objeto.propiedades||'—').slice(0,200)}\n\n` +
              `Usa \`/dm-artificiero-precio usuario:@${char.name} precio:[PO]\` para fijar el precio.`
            )]
        }).catch(()=>{});
      }
    } catch {}

    const embed = new EmbedBuilder()
      .setTitle(`⚙️ Solicitud enviada — ${objeto.nombre}`)
      .setColor(0xE67E22)
      .setDescription(
        `Tu solicitud de mejora ha sido enviada al artificiero.\n\n` +
        `**Objeto:** ${objeto.nombre}${bonus>0?' (+'+bonus+')':''}\n` +
        (objeto.daño ? `**Daño:** ${objeto.daño}\n` : '') +
        `\nEl artificiero evaluará los materiales necesarios y te enviará el precio. ` +
        `Cuando lo recibas, usa \`/artificiero-pagar\` para confirmar.`
      );

    await interaction.update({ embeds: [embed], components: [] });
    return true;
  }

  // Botón: confirmar pago y aplicar mejora
  if (interaction.isButton() && id === 'artificiero_pagar_confirmar') {
    const pendiente = MEJORAS_PENDIENTES.get(uid);
    const char      = getCharacter(uid);
    if (!pendiente || !char) { await interaction.update({ content: '❌ Error.', embeds: [], components: [] }); return true; }

    const nuevoMonedero = pagar(char.money || {PC:0,PP:0,PE:0,PO:0,PT:0}, pendiente.precioFijado);
    if (!nuevoMonedero) { await interaction.update({ content: '❌ Fondos insuficientes.', embeds: [], components: [] }); return true; }

    // Aplicar +2 al objeto (y característica especial si la hay)
    const inv    = [...(char.inventory || [])];
    const bonus  = extraerBonus(pendiente.objeto.nombre);
    const nuevoNombre = sumarBonus(pendiente.objeto.nombre, 2);
    const bonusNuevo = bonus + 2;
    const itemActualizado = {
      ...inv[pendiente.idxInv],
      nombre:      nuevoNombre,
      bonusMagico: bonusNuevo,   // usado por duelPanel y trainingPanel para ataque+daño
    };
    if (pendiente.caracteristica) {
      const caract = pendiente.caracteristica;
      itemActualizado.caracteristicas = [...(inv[pendiente.idxInv].caracteristicas||[]), caract];
      // Parsear la característica para extraer el dado extra si lo tiene (ej: "Fuego 1d6")
      const danoExtra = caract.match(/(\d+d\d+)/)?.[1] || null;
      const tipoExtra = caract.match(/(fuego|veneno|hielo|rayo|acido|necrotico|radiante)/i)?.[1] || null;
      if (danoExtra) itemActualizado.danoExtra = danoExtra;
      if (tipoExtra) itemActualizado.tipoExtra = tipoExtra.toLowerCase();
      itemActualizado.descripcion = (inv[pendiente.idxInv].descripcion||'') + ' | ' + caract;
    }
    inv[pendiente.idxInv] = itemActualizado;
    updateCharacter(uid, { inventory: inv, money: nuevoMonedero });

    MEJORAS_PENDIENTES.delete(uid);
    // Logro primera mejora
    try { await otorgarLogro(interaction.client, interaction.guildId, uid, char.name, 'primera_mejora'); } catch {}

    const objBase = inv[pendiente.idxInv]; // ya actualizado
    const danoMostrar = objBase.daño || objBase.dano || '?';
    const embed = new EmbedBuilder()
      .setTitle('⚙️ ¡Objeto mejorado! — ' + nombreBonusRareza(bonusNuevo))
      .setColor(colorPorBonus(bonusNuevo))
      .setDescription(
        'El artificiero termina su trabajo.\n\n' +
        '~~' + pendiente.objeto.nombre + '~~ → **' + nuevoNombre + '**\n' +
        (pendiente.caracteristica ? '✨ Característica: **' + pendiente.caracteristica + '**\n' : '') +
        (objBase.danoExtra ? '💥 Daño extra: **' + objBase.danoExtra + ' ' + (objBase.tipoExtra||'') + '** por ataque\n' : '') +
        '\n**Stats del arma mejorada:**\n' +
        '• Daño base: **' + danoMostrar + '**\n' +
        '• Bonus mágico: **+' + bonusNuevo + '** (ataque y daño)\n' +
        (objBase.danoExtra ? '• Daño extra: **' + objBase.danoExtra + ' ' + (objBase.tipoExtra||'') + '** adicional\n' : '') +
        '\nPagaste **' + pendiente.precioFijado + ' PO**. Saldo: ' + formatearMonedero(nuevoMonedero) + '\n\n' +
        '**¿Quieres Retar al Destino?**\n' +
        '• 🎲 **1** — Pierde TODAS las mejoras.\n' +
        '• 🎲 **2–9** — Sin cambios.\n' +
        '• 🎲 **10–19** — +1 adicional.\n' +
        '• 🎲 **20** — La mejora se duplica.'
      );

    // Guardar en sesión para el reto
    getSession(uid)._retoDestino = { idxInv: pendiente.idxInv, bonusBase: bonus + 2 };

    const rows = [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('artificiero_retar').setLabel('🎲 Retar al Destino').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('artificiero_guardar').setLabel('✅ Conservar el objeto').setStyle(ButtonStyle.Success),
    )];

    await interaction.update({ embeds: [embed], components: rows });
    return true;
  }

  // Botón: Retar al Destino
  if (interaction.isButton() && id === 'artificiero_retar') {
    const reto = getSession(uid)._retoDestino;
    const char = getCharacter(uid);
    if (!reto || !char) { await interaction.update({ content: '❌ Reto expirado.', embeds: [], components: [] }); return true; }

    const dado = Math.floor(Math.random()*20)+1;
    const inv  = [...(char.inventory||[])];
    const item = inv[reto.idxInv];
    let resultado, nuevoNombre, color;

    if (dado === 1) {
      // Pierde todas las mejoras
      nuevoNombre = item.nombre.replace(/\s*\+\d+/, '').trim();
      resultado = `🎲 **Sacaste 1** — El destino te traicionó. El objeto pierde todas sus mejoras.`;
      color = 0xE74C3C;
    } else if (dado >= 2 && dado <= 9) {
      nuevoNombre = item.nombre;
      resultado = `🎲 **Sacaste ${dado}** — El destino fue neutral. El objeto se conserva igual.`;
      color = 0x95A5A6;
    } else if (dado >= 10 && dado <= 19) {
      nuevoNombre = sumarBonus(item.nombre, 1);
      resultado = `🎲 **Sacaste ${dado}** — ¡El destino sonríe! +1 adicional.`;
      color = 0x2ECC71;
    } else { // 20
      const bonusExtra = reto.bonusBase; // duplicar = bonus total x2, así que sumamos el bonus actual
      nuevoNombre = sumarBonus(item.nombre, bonusExtra);
      resultado = `🎲 **¡CRÍTICO (20)!** — La mejora se DUPLICA. ¡${item.nombre} → ${nuevoNombre}!`;
      color = 0xFFD700;
    }

    inv[reto.idxInv] = { ...item, nombre: nuevoNombre };
    updateCharacter(uid, { inventory: inv });
    delete getSession(uid)._retoDestino;

    await interaction.update({
      embeds: [new EmbedBuilder().setTitle('🎲 Resultado del Reto al Destino').setColor(color).setDescription(resultado + `\n\n~~${item.nombre}~~ → **${nuevoNombre}**`)],
      components: [],
    });
    return true;
  }

  // Botón: conservar / cancelar
  if (interaction.isButton() && (id === 'artificiero_guardar' || id === 'artificiero_cancelar')) {
    delete getSession(uid)._retoDestino;
    MEJORAS_PENDIENTES.delete(uid);
    await interaction.update({ content: '✅ Objeto conservado. ¡Buena suerte en tu aventura!', embeds: [], components: [] });
    return true;
  }

  return false;
}

module.exports = {
  cmdDmAbrirArtificiero,
  cmdDmCerrarArtificiero,
  cmdArtificiero,
  cmdDmArtificieroPrecio,
  cmdArtificieroPagar,
  handleArtificeroInteraction,
};
