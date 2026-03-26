// ── handlers/cofrePanel.js ────────────────────────────────────────────────────
// Cofre del Gremio — inventario personal sin límite
// Mantenimiento: 10 PO/día. Sin fondos → cofre bloqueado.
// ─────────────────────────────────────────────────────────────────────────────

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { getCharacter, updateCharacter, saveCharacter } = require('../db/characterStore.js');
const { get, all, run, transaction, exists } = require('../db/database.js');
const { isDM } = require('../utils/isDM.js');
const { totalEnPC, pagar, formatearMonedero } = require('../data/startingWealth.js');

const COSTO_DIARIO_PO = 10;
const SECS_DIA = 86400;
const PERIODO_COBRO_DIAS = 21;
const SECS_PERIODO = SECS_DIA * PERIODO_COBRO_DIAS;

async function rep(interaction, payload) {
  if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
  return interaction.reply({ ...payload, ephemeral: true });
}

// ─── Obtener o crear meta del cofre ──────────────────────────────────────────
function getMeta(userId) {
  if (!exists()) return null;
  let meta = get('SELECT * FROM guild_chest_meta WHERE user_id = ?', userId);
  if (!meta) {
    run('INSERT INTO guild_chest_meta (user_id, ultimo_cobro) VALUES (?, ?)',
      userId, Math.floor(Date.now()/1000));
    meta = get('SELECT * FROM guild_chest_meta WHERE user_id = ?', userId);
  }
  return meta;
}

// ─── Cobrar mantenimiento diario ──────────────────────────────────────────────
function cobrarMantenimiento(userId) {
  if (!exists()) return { cobrado: 0, deuda: 0, bloqueado: false };

  const meta = getMeta(userId);
  if (!meta || !meta.activo) return { cobrado: 0, deuda: 0, bloqueado: false };

  const ahora   = Math.floor(Date.now()/1000);
  const diasPasados = Math.floor((ahora - meta.ultimo_cobro) / SECS_PERIODO);
  if (diasPasados <= 0) return { cobrado: 0, deuda: meta.deuda || 0, bloqueado: !!meta.bloqueado };

  const totalDeber = diasPasados * COSTO_DIARIO_PO;
  const char = getCharacter(userId);
  const money = char?.money || {};
  const totalPCDisp = totalEnPC(money);
  const costoPO_en_PC = totalDeber * 100;

  let cobrado = 0, deuda = meta.deuda || 0, bloqueado = !!meta.bloqueado;

  if (totalPCDisp >= costoPO_en_PC) {
    // Puede pagar todo
    const nuevoMoney = pagar(money, totalDeber);
    updateCharacter(userId, { money: nuevoMoney });
    cobrado = totalDeber;
    deuda = 0;
    bloqueado = false;
  } else {
    // No puede pagar — acumular deuda y bloquear
    deuda += totalDeber;
    bloqueado = true;
  }

  run(`UPDATE guild_chest_meta SET ultimo_cobro=?, deuda=?, bloqueado=? WHERE user_id=?`,
    ahora, deuda, bloqueado ? 1 : 0, userId);

  return { cobrado, deuda, bloqueado };
}

// ─── /cofre ──────────────────────────────────────────────────────────────────
async function cmdCofre(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return rep(interaction, { content: '❌ Sin personaje. Usa `/crear-personaje` primero.' });

  if (!exists())
    return rep(interaction, { content: '⚠️ La base de datos SQLite no está disponible. Instala `better-sqlite3` para usar el cofre.' });

  // Cobrar mantenimiento pendiente
  const { cobrado, deuda, bloqueado } = cobrarMantenimiento(uid);
  const meta    = getMeta(uid);
  const items   = all('SELECT * FROM guild_chest WHERE user_id = ? ORDER BY id', uid);
  const money   = char.money || {};
  const totalPO = (totalEnPC(money) / 100).toFixed(2);

  const embed = new EmbedBuilder()
    .setTitle('🗄️ Cofre del Gremio — ' + char.name)
    .setColor(bloqueado ? 0xFF4444 : 0x8B6914);

  if (bloqueado) {
    embed.setDescription(
      '🔒 **Cofre BLOQUEADO** — deuda de **' + deuda + ' PO**\n\n' +
      'No puedes retirar ítems hasta pagar la deuda.\nUsa `/cofre-pagar` para desbloquear.'
    );
  } else {
    const desc = items.length
      ? items.map((i,n) => (n+1)+'. **'+i.nombre+'** ×'+i.cantidad+(i.precio?' ('+i.precio+' PO)':'')).join('\n')
      : '*El cofre está vacío.*';
    embed.setDescription(desc.slice(0,4000));
  }

  embed.addFields(
    { name: '💰 Tu monedero', value: formatearMonedero(money) + ' (≈' + totalPO + ' PO)', inline: true },
    { name: '📅 Mantenimiento', value: COSTO_DIARIO_PO + ' PO cada 21 días' + (deuda > 0 ? '\n⚠️ Deuda: **' + deuda + ' PO**' : ''), inline: true },
    { name: '📦 Ítems', value: items.length + ' objetos', inline: true },
  );

  if (cobrado > 0)
    embed.setFooter({ text: '✅ Se cobraron ' + cobrado + ' PO de mantenimiento.' });

  const botones = [
    new ButtonBuilder().setCustomId('cofre_depositar').setLabel('📥 Depositar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('cofre_retirar').setLabel('📤 Retirar').setStyle(ButtonStyle.Primary).setDisabled(bloqueado || !items.length),
    new ButtonBuilder().setCustomId('cofre_pagar_deuda').setLabel('💳 Pagar deuda').setStyle(ButtonStyle.Danger).setDisabled(!bloqueado),
  ];

  await rep(interaction, { embeds: [embed], components: [new ActionRowBuilder().addComponents(...botones)] });
}

// ─── /cofre-depositar (selecciona del inventario) ─────────────────────────────
async function cmdCofreDepositar(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return rep(interaction, { content: '❌ Sin personaje.' });
  if (!exists()) return rep(interaction, { content: '⚠️ SQLite no disponible.' });

  const inv = char.inventory || [];
  if (!inv.length)
    return rep(interaction, { content: '❌ Tu inventario está vacío.' });

  const opts = inv.slice(0,25).map((item, i) => ({
    label: item.nombre.slice(0,100),
    description: ('×' + (item.cantidad||1) + (item.precio ? ' — ' + item.precio + ' PO' : '')).slice(0,100),
    value: String(i),
  }));

  await rep(interaction, {
    embeds: [new EmbedBuilder().setTitle('📥 Depositar en cofre').setColor(0x8B6914)
      .setDescription('Elige el ítem de tu inventario a depositar:')],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId('cofre_dep_item').setPlaceholder('Elige ítem...').addOptions(opts)
    )],
  });
}

// ─── /cofre-pagar ────────────────────────────────────────────────────────────
async function cmdCofrePagar(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return rep(interaction, { content: '❌ Sin personaje.' });
  if (!exists()) return rep(interaction, { content: '⚠️ SQLite no disponible.' });

  const meta = getMeta(uid);
  if (!meta?.bloqueado)
    return rep(interaction, { content: '✅ Tu cofre no está bloqueado.' });

  const deuda = meta.deuda || 0;
  const money = char.money || {};
  if (totalEnPC(money) < deuda * 100)
    return rep(interaction, { content: '❌ No tienes suficiente dinero. Necesitas **' + deuda + ' PO** (' + formatearMonedero(money) + ').' });

  const nuevoMoney = pagar(money, deuda);
  updateCharacter(uid, { money: nuevoMoney });
  run('UPDATE guild_chest_meta SET deuda=0, bloqueado=0, ultimo_cobro=? WHERE user_id=?',
    Math.floor(Date.now()/1000), uid);

  await rep(interaction, {
    embeds: [new EmbedBuilder()
      .setTitle('✅ Deuda pagada')
      .setColor(0x2ECC71)
      .setDescription('Pagaste **' + deuda + ' PO** de mantenimiento.\nTu cofre está desbloqueado.')
    ]
  });
}

// ─── /dm-cofre-ver @usuario ───────────────────────────────────────────────────
async function cmdDmCofreVer(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const target = interaction.options.getUser('usuario');
  const char   = getCharacter(target.id);
  if (!char) return interaction.reply({ content: '❌ Sin personaje.', ephemeral: true });
  if (!exists()) return interaction.reply({ content: '⚠️ SQLite no disponible.', ephemeral: true });

  const items = all('SELECT * FROM guild_chest WHERE user_id = ? ORDER BY id', target.id);
  const meta  = getMeta(target.id);
  const lista = items.length
    ? items.map((i,n) => (n+1)+'. **'+i.nombre+'** ×'+i.cantidad).join('\n')
    : '*Vacío*';

  await interaction.reply({
    embeds: [new EmbedBuilder()
      .setTitle('🗄️ Cofre de ' + char.name)
      .setColor(0x8B6914)
      .setDescription(lista.slice(0,4000))
      .addFields(
        { name: 'Estado', value: meta?.bloqueado ? '🔒 Bloqueado ('+meta.deuda+' PO deuda)' : '✅ Activo', inline: true },
        { name: 'Ítems', value: String(items.length), inline: true },
      )],
    ephemeral: true,
  });
}

// ─── Handler de botones/selects del cofre ────────────────────────────────────
async function handleCofreInteraction(interaction) {
  const id  = interaction.customId || '';
  const uid = interaction.user.id;
  if (!id.startsWith('cofre_')) return false;

  // Depositar ítem seleccionado
  if (id === 'cofre_dep_item' && interaction.isStringSelectMenu()) {
    const char = getCharacter(uid);
    if (!char) return false;
    const inv  = char.inventory || [];
    const idx  = parseInt(interaction.values[0]);
    const item = inv[idx];
    if (!item) { await interaction.update({ content: '❌ Ítem no encontrado.', embeds:[], components:[] }); return true; }

    // Mover al cofre
    const newInv = [...inv];
    if ((item.cantidad||1) <= 1) newInv.splice(idx, 1);
    else newInv[idx] = { ...item, cantidad: (item.cantidad||1) - 1 };

    transaction(() => {
      run('INSERT INTO guild_chest (user_id,nombre,cantidad,peso,precio,categoria,extra) VALUES (?,?,?,?,?,?,?)',
        uid, item.nombre, 1, item.peso||0, item.precio||0, item.categoria||'General', JSON.stringify({}));
      saveCharacter(uid, { ...char, inventory: newInv });
    });

    await interaction.update({
      embeds: [new EmbedBuilder().setTitle('📥 Ítem depositado').setColor(0x2ECC71)
        .setDescription('**'+item.nombre+'** fue guardado en tu cofre del gremio.')],
      components: [],
    });
    return true;
  }

  // Retirar ítem
  if (id === 'cofre_retirar' && interaction.isButton()) {
    const char  = getCharacter(uid);
    const meta  = getMeta(uid);
    if (meta?.bloqueado) { await interaction.reply({ content: '🔒 Cofre bloqueado. Paga la deuda primero.', ephemeral:true }); return true; }

    const items = all('SELECT * FROM guild_chest WHERE user_id = ? ORDER BY id', uid);
    if (!items.length) { await interaction.reply({ content: '❌ Cofre vacío.', ephemeral:true }); return true; }

    const opts = items.slice(0,25).map(i => ({
      label: i.nombre.slice(0,100),
      value: String(i.id),
    }));

    await interaction.reply({
      embeds: [new EmbedBuilder().setTitle('📤 Retirar del cofre').setColor(0x4169E1)
        .setDescription('Elige el ítem a retirar:')],
      components: [new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId('cofre_ret_item').setPlaceholder('Elige ítem...').addOptions(opts)
      )],
      ephemeral: true,
    });
    return true;
  }

  // Confirmar retiro
  if (id === 'cofre_ret_item' && interaction.isStringSelectMenu()) {
    const char  = getCharacter(uid);
    const itemId = parseInt(interaction.values[0]);
    const row   = get('SELECT * FROM guild_chest WHERE id = ? AND user_id = ?', itemId, uid);
    if (!row) { await interaction.update({ content: '❌ Ítem no encontrado.', embeds:[], components:[] }); return true; }

    run('DELETE FROM guild_chest WHERE id = ?', itemId);
    const inv = [...(char.inventory||[]), {
      nombre: row.nombre, cantidad: 1, peso: row.peso||0,
      precio: row.precio||0, categoria: row.categoria||'General',
    }];
    saveCharacter(uid, { ...char, inventory: inv });

    await interaction.update({
      embeds: [new EmbedBuilder().setTitle('📤 Ítem retirado').setColor(0x2ECC71)
        .setDescription('**'+row.nombre+'** fue añadido a tu inventario.')],
      components: [],
    });
    return true;
  }

  // Pagar deuda desde botón
  if (id === 'cofre_pagar_deuda' && interaction.isButton()) {
    await interaction.deferUpdate();
    await cmdCofrePagar({ ...interaction, reply: (p) => interaction.followUp({...p, ephemeral:true}) });
    return true;
  }

  return false;
}

// ─── Tarea periódica: cobrar mantenimiento a todos ────────────────────────────
function iniciarCobroMantenimiento(client) {
  // Cobrar cada 6 horas
  setInterval(async () => {
    if (!exists()) return;
    const usuarios = all('SELECT user_id FROM guild_chest_meta WHERE activo = 1');
    for (const { user_id } of usuarios) {
      const { cobrado, deuda, bloqueado } = cobrarMantenimiento(user_id);
      if (bloqueado && deuda > 0) {
        // Notificar al jugador
        try {
          const user = await client.users.fetch(user_id);
          await user.send({
            embeds: [new EmbedBuilder()
              .setTitle('🔒 Cofre del Gremio bloqueado')
              .setColor(0xFF4444)
              .setDescription('No tenías fondos para pagar el mantenimiento (**'+COSTO_DIARIO_PO+' PO/día**).\n\nTu cofre está **bloqueado**. Deuda acumulada: **'+deuda+' PO**.\n\nUsa `/cofre-pagar` para desbloquearlo.')
            ]
          });
        } catch {}
      }
    }
  }, 12 * 60 * 60 * 1000);
}

module.exports = {
  cmdCofre, cmdCofreDepositar, cmdCofrePagar, cmdDmCofreVer,
  handleCofreInteraction, iniciarCobroMantenimiento, cobrarMantenimiento,
};
