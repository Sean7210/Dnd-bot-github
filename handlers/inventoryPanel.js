// ── handlers/inventoryPanel.js ────────────────────────────────────────────────
// Gestión de inventario, monedas e intercambios entre jugadores
//
//  /inventario                → Ver inventario y monedero
//  /dar @usuario objeto cant  → Proponer dar objeto a otro jugador
//  /pagar @usuario cantidad moneda → Transferir dinero
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { getCharacter, updateCharacter } = require('../db/characterStore.js');
const { ARMAS_UNICAS }  = require('../data/uniqueWeapons.js');
const { ARMAS_DORADAS } = require('../data/goldenWeapons.js');
const { formatearMonedero, totalEnPC, pagar, MONEDAS } = require('../data/startingWealth.js');

// Límite de carga: FUE × 15 libras (regla D&D 5e)
function limiteCargar(str) { return (str || 10) * 15; }

function pesoInventario(inventario) {
  return (inventario || []).reduce((sum, item) => sum + ((item.peso || 0) * (item.cantidad || 1)), 0);
}

function formatearInventario(inventario) {
  if (!inventario?.length) return '*Vacío*';
  return inventario.map(item =>
    `• **${item.nombre}** ×${item.cantidad}` +
    (item.peso ? ` (${item.peso} lb c/u)` : '') +
    (item.precio ? ` — ${item.precio} PO` : '')
  ).join('\n');
}

// ─── /inventario ─────────────────────────────────────────────────────────────
async function cmdInventario(interaction) {
  const char = getCharacter(interaction.user.id);
  if (!char) {
    return interaction.reply({ content: '📭 No tienes personaje. Usa `/personaje` para crear uno.', ephemeral: true });
  }

  const inv   = char.inventory || [];
  const money = char.money     || { PC: 0, PP: 0, PE: 0, PO: 0, PT: 0 };
  const str   = char.finalStats?.STR || 10;
  const peso  = pesoInventario(inv);
  const limite = limiteCargar(str);

  const embed = new EmbedBuilder()
    .setTitle(`🎒 Inventario de ${char.name}`)
    .setColor(0x8B4513)
    .addFields(
      { name: '💰 Monedero',   value: formatearMonedero(money), inline: false },
      { name: `📦 Objetos (${peso.toFixed(1)}/${limite} lb)`,
        value: formatearInventario(inv), inline: false },
    )
    .setFooter({ text: `Límite de carga: FUE (${str}) × 15 = ${limite} lb` });

  // Barra de carga
  const pct   = Math.min(peso / limite, 1);
  const lleno = Math.round(pct * 10);
  const vacio = 10 - lleno;
  const barra = '█'.repeat(lleno) + '░'.repeat(vacio);
  const color = pct >= 1 ? '🔴' : pct >= 0.75 ? '🟡' : '🟢';
  embed.addFields({ name: `${color} Carga`, value: `\`${barra}\` ${(pct * 100).toFixed(0)}%`, inline: false });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── /pagar @usuario cantidad moneda ────────────────────────────────────────
async function cmdPagar(interaction) {
  const target   = interaction.options.getUser('usuario');
  const cantidad = interaction.options.getInteger('cantidad');
  const moneda   = interaction.options.getString('moneda').toUpperCase();

  if (!['PC', 'PP', 'PE', 'PO', 'PT'].includes(moneda)) {
    return interaction.reply({ content: '❌ Moneda inválida. Usa: PC, PP, PE, PO o PT.', ephemeral: true });
  }

  const charOrigen  = getCharacter(interaction.user.id);
  const charDestino = getCharacter(target.id);

  if (!charOrigen)  return interaction.reply({ content: '❌ No tienes personaje.', ephemeral: true });
  if (!charDestino) return interaction.reply({ content: `❌ **${target.displayName}** no tiene personaje.`, ephemeral: true });
  if (target.id === interaction.user.id) return interaction.reply({ content: '❌ No puedes pagarte a ti mismo.', ephemeral: true });

  const moneyOrigen = { ...charOrigen.money  } || { PC:0, PP:0, PE:0, PO:0, PT:0 };
  if ((moneyOrigen[moneda] || 0) < cantidad) {
    return interaction.reply({
      content: `❌ No tienes suficiente ${moneda}. Tienes **${moneyOrigen[moneda] || 0} ${moneda}**.`,
      ephemeral: true,
    });
  }

  // Construir embed de confirmación para que el receptor acepte
  const embed = new EmbedBuilder()
    .setTitle('💸 Transferencia de dinero')
    .setColor(0xFFD700)
    .setDescription(
      `<@${interaction.user.id}> quiere enviarte **${cantidad} ${moneda}** (${MONEDAS[moneda]?.nombre}).\n\n` +
      `¿Aceptas la transferencia?`
    )
    .setFooter({ text: 'Expira en 2 minutos' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pagar_aceptar_${interaction.user.id}_${target.id}_${cantidad}_${moneda}`)
      .setLabel('✅ Aceptar')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`pagar_rechazar_${interaction.user.id}`)
      .setLabel('❌ Rechazar')
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
}

// ─── /dar @usuario objeto cantidad ───────────────────────────────────────────
async function cmdDar(interaction) {
  const target   = interaction.options.getUser('usuario');
  const nombre   = interaction.options.getString('objeto');
  const cantidad = interaction.options.getInteger('cantidad') || 1;
  const listar   = interaction.options.getBoolean('listar') || false;

  const charOrigen  = getCharacter(interaction.user.id);
  const charDestino = getCharacter(target.id);

  if (!charOrigen)  return interaction.reply({ content: '❌ No tienes personaje.', ephemeral: true });
  if (!charDestino) return interaction.reply({ content: `❌ **${target.displayName}** no tiene personaje.`, ephemeral: true });
  if (target.id === interaction.user.id) return interaction.reply({ content: '❌ No puedes darte objetos a ti mismo.', ephemeral: true });

  // Opción: mostrar listas de armas disponibles
  if (listar) {
    const clase = charOrigen.class;
    const unicas = (ARMAS_UNICAS[clase] || []).slice(0, 10).map(function(a,i){ return '**'+(i+1)+'.** '+a.nombre+' \u2014 '+(a['da\u00f1o']||'?'); }).join('\n') || 'Sin armas para esta clase';
    const doradas = ARMAS_DORADAS.filter(function(a){ return a.clase === clase; }).map(function(a){ return '\u{1F49B} **'+a.nombre+'** \u2014 '+a.tipo; }).join('\n') || 'Sin armas doradas para esta clase';
    const invItems = (charOrigen.inventory || []).map(function(i){ return '\u2022 '+i.nombre+' x'+i.cantidad; }).join('\n') || '*Vacio*';

    const embed = new EmbedBuilder()
      .setTitle(`📦 Objetos disponibles para dar`)
      .setColor(0x20B2AA)
      .addFields(
        { name: '🎒 Tu inventario', value: invItems.slice(0,1024), inline: false },
        { name: `⚔️ Armas únicas de ${clase}`, value: unicas.slice(0,1024), inline: false },
        { name: `💛 Armas doradas de ${clase}`, value: doradas.slice(0,1024), inline: false },
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  const inv = charOrigen.inventory || [];
  const item = inv.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());

  if (!item) {
    return interaction.reply({
      content: `❌ No tienes **${nombre}** en tu inventario.
*Usa \`/dar usuario:@ listar:true\` para ver lo que puedes dar.*`,
      ephemeral: true,
    });
  }
  if (item.cantidad < cantidad) {
    return interaction.reply({
      content: `❌ Solo tienes **${item.cantidad}** de **${nombre}**.`,
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('🤝 Intercambio propuesto')
    .setColor(0x20B2AA)
    .setDescription(
      `<@${interaction.user.id}> quiere darte **${cantidad}× ${nombre}**.\n\n¿Aceptas?`
    )
    .setFooter({ text: 'Expira en 2 minutos' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`dar_aceptar_${interaction.user.id}_${target.id}_${encodeURIComponent(nombre)}_${cantidad}`)
      .setLabel('✅ Aceptar')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`dar_rechazar_${interaction.user.id}`)
      .setLabel('❌ Rechazar')
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
}

// ─── ROUTER de botones de intercambio ────────────────────────────────────────
async function handleInventoryInteraction(interaction) {
  if (!interaction.isButton()) return false;
  const id = interaction.customId;

  // ── Pagar: aceptar ────────────────────────────────────────────────────────
  if (id.startsWith('pagar_aceptar_')) {
    const [, , origenId, destinoId, cantidad, moneda] = id.split('_');

    // Solo el destinatario puede aceptar
    if (interaction.user.id !== destinoId) {
      await interaction.reply({ content: '❌ Esta transferencia no es para ti.', ephemeral: true });
      return true;
    }

    const charOrigen  = getCharacter(origenId);
    const charDestino = getCharacter(destinoId);
    const cant        = parseInt(cantidad);

    if (!charOrigen || (charOrigen.money?.[moneda] || 0) < cant) {
      await interaction.update({ content: '❌ El remitente ya no tiene suficiente dinero.', embeds: [], components: [] });
      return true;
    }

    const moneyOrigen  = { ...(charOrigen.money  || {PC:0,PP:0,PE:0,PO:0,PT:0}) };
    const moneyDestino = { ...(charDestino.money || {PC:0,PP:0,PE:0,PO:0,PT:0}) };

    moneyOrigen[moneda]  = (moneyOrigen[moneda]  || 0) - cant;
    moneyDestino[moneda] = (moneyDestino[moneda] || 0) + cant;

    updateCharacter(origenId,  { money: moneyOrigen  });
    updateCharacter(destinoId, { money: moneyDestino });

    await interaction.update({
      content: '',
      embeds: [new EmbedBuilder()
        .setTitle('✅ Transferencia completada')
        .setColor(0x00CC00)
        .setDescription(`<@${origenId}> ha enviado **${cant} ${moneda}** a <@${destinoId}>.`)],
      components: [],
    });
    return true;
  }

  // ── Pagar: rechazar ───────────────────────────────────────────────────────
  if (id.startsWith('pagar_rechazar_')) {
    await interaction.update({
      content: '',
      embeds: [new EmbedBuilder()
        .setTitle('❌ Transferencia rechazada')
        .setColor(0xCC0000)
        .setDescription('La transferencia fue rechazada.')],
      components: [],
    });
    return true;
  }

  // ── Dar objeto: aceptar ───────────────────────────────────────────────────
  if (id.startsWith('dar_aceptar_')) {
    const parts     = id.split('_');
    const origenId  = parts[2];
    const destinoId = parts[3];
    const nombre    = decodeURIComponent(parts[4]);
    const cantidad  = parseInt(parts[5]);

    if (interaction.user.id !== destinoId) {
      await interaction.reply({ content: '❌ Este intercambio no es para ti.', ephemeral: true });
      return true;
    }

    const charOrigen  = getCharacter(origenId);
    const charDestino = getCharacter(destinoId);

    const invOrigen = [...(charOrigen.inventory || [])];
    const idx       = invOrigen.findIndex(i => i.nombre.toLowerCase() === nombre.toLowerCase());

    if (idx === -1 || invOrigen[idx].cantidad < cantidad) {
      await interaction.update({ content: '❌ El remitente ya no tiene ese objeto.', embeds: [], components: [] });
      return true;
    }

    const item = { ...invOrigen[idx] };

    // Restar del origen
    if (invOrigen[idx].cantidad === cantidad) {
      invOrigen.splice(idx, 1);
    } else {
      invOrigen[idx] = { ...invOrigen[idx], cantidad: invOrigen[idx].cantidad - cantidad };
    }

    // Añadir al destino
    const invDestino = [...(charDestino.inventory || [])];
    const idxDest    = invDestino.findIndex(i => i.nombre.toLowerCase() === nombre.toLowerCase());
    if (idxDest !== -1) {
      invDestino[idxDest] = { ...invDestino[idxDest], cantidad: invDestino[idxDest].cantidad + cantidad };
    } else {
      invDestino.push({ ...item, cantidad });
    }

    updateCharacter(origenId,  { inventory: invOrigen  });
    updateCharacter(destinoId, { inventory: invDestino });

    await interaction.update({
      content: '',
      embeds: [new EmbedBuilder()
        .setTitle('✅ Intercambio completado')
        .setColor(0x00CC00)
        .setDescription(`<@${origenId}> ha dado **${cantidad}× ${nombre}** a <@${destinoId}>.`)],
      components: [],
    });
    return true;
  }

  // ── Dar objeto: rechazar ──────────────────────────────────────────────────
  if (id.startsWith('dar_rechazar_')) {
    await interaction.update({
      content: '',
      embeds: [new EmbedBuilder()
        .setTitle('❌ Intercambio rechazado')
        .setColor(0xCC0000)
        .setDescription('El intercambio fue rechazado.')],
      components: [],
    });
    return true;
  }

  return false;
}

module.exports = { cmdInventario, cmdPagar, cmdDar, handleInventoryInteraction, pesoInventario, formatearInventario };
