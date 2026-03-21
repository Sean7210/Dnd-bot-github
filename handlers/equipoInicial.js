// ── handlers/equipoInicial.js ─────────────────────────────────────────────────
// Equipo inicial — 3 opciones:
//   A) Equipo de clase (con selects para ítems a elegir)
//   B) Dinero (5d4×10 PO o lo que marque la clase)
//   C) Vale aleatorio (1d12×100 PO, con pequeña chance de arma especial)
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');

const { CLASSES }     = require('../data/classes.js');
const { BACKGROUNDS } = require('../data/backgrounds.js');
const { EQUIPO_INICIAL_CLASE, tirarDineroCombate } = require('../data/classEquipment.js');
const { monederoVacio } = require('../data/startingWealth.js');
const { calcHP, buildCharacterEmbed } = require('../utils/helpers.js');
const { getSession }  = require('../utils/sessions.js');
const { saveCharacter, getCharacter, updateCharacter } = require('../utils/characterStore.js');
const { getRandomUniqueWeapon, getArmaDorada } = require('./uniqueWeaponsPanel.js');

// ─── Helper de respuesta universal ───────────────────────────────────────────
async function responder(interaction, payload) {
  try {
    const esBoton = interaction.isButton?.() || interaction.isStringSelectMenu?.() || interaction.isAnySelectMenu?.();
    if (esBoton) {
      if (interaction.replied || interaction.deferred) await interaction.editReply(payload);
      else await interaction.update(payload);
    } else {
      if (interaction.replied || interaction.deferred) await interaction.editReply(payload);
      else await interaction.reply({ ...payload, ephemeral: true });
    }
  } catch {
    try { await interaction.reply({ ...payload, ephemeral: true }); } catch (_) {}
  }
}


// ─── Extraer el dinero del equipment del trasfondo ────────────────────────────
function extraerDineroTrasfondo(bgData) {
  const items = [...(bgData.equipment||[]), ...(bgData.tools||[])];
  let po = 0, pp = 0, pc = 0, pe = 0, pt = 0;
  const equipoSinDinero = [];
  for (const item of items) {
    const m = item.match(/^(\d+)\s*(po|pp|pc|pe|pt|gp|sp|cp)\b/i);
    if (m) {
      const val = parseInt(m[1]);
      switch (m[2].toLowerCase()) {
        case 'po': case 'gp': po += val; break;
        case 'pp': case 'sp': pp += val; break;
        case 'pc': case 'cp': pc += val; break;
        case 'pe':            pe += val; break;
        case 'pt':            pt += val; break;
      }
    } else {
      equipoSinDinero.push(item);
    }
  }
  return { po, pp, pc, pe, pt, equipoSinDinero };
}

// ─── Probabilidades del vale ──────────────────────────────────────────────────
// Sacado de 1d10.000.000:
//   1           → Arma dorada
//   2-10        → Arma única
//   11-10.000   → Vale especial (sustituye elecciones de clase por vale extra)
//   resto       → Vale normal (dinero)
function tirarVale(clase) {
  const d = Math.floor(Math.random() * 10000000) + 1;
  if (d === 1)              return { tipo: 'dorado',   arma: getArmaDorada(clase) };
  if (d <= 10)              return { tipo: 'unico',    arma: getRandomUniqueWeapon(clase) };
  if (d <= 10000)           return { tipo: 'especial', arma: null }; // vale bonus extra
  return                           { tipo: 'normal',   arma: null };
}


// ─── Extraer dinero del equipment del trasfondo ───────────────────────────────
function extraerDineroTrasfondo(bgData) {
  const items = [...(bgData.equipment||[]), ...(bgData.tools||[])];
  let po=0, pp=0, pc=0, pe=0, pt=0;
  const equipoSinDinero = [];
  for (const item of items) {
    const m = item.match(/^(\d+)\s*(po|pp|pc|pe|pt|gp|sp|cp)\b/i);
    if (m) {
      const val = parseInt(m[1]);
      switch(m[2].toLowerCase()) {
        case 'po': case 'gp': po+=val; break;
        case 'pp': case 'sp': pp+=val; break;
        case 'pc': case 'cp': pc+=val; break;
        case 'pe': pe+=val; break;
        case 'pt': pt+=val; break;
      }
    } else {
      equipoSinDinero.push(item);
    }
  }
  return { po, pp, pc, pe, pt, equipoSinDinero };
}

// ─── Tirar vale con probabilidades ───────────────────────────────────────────
// 1/10.000.000    → arma dorada
// 2-10/10.000.000 → arma única
// 11-10.000/10M   → vale especial (reemplaza elecciones de clase)
// resto           → vale normal en PO
function tirarVale(clase) {
  const d = Math.floor(Math.random() * 10000000) + 1;
  if (d === 1)     return { tipo:'dorado',   arma: getArmaDorada(clase) };
  if (d <= 10)     return { tipo:'unico',    arma: getRandomUniqueWeapon(clase) };
  if (d <= 10000)  return { tipo:'especial', arma: null };
  return                  { tipo:'normal',   arma: null };
}

// ─── Pantalla principal de equipo inicial ─────────────────────────────────────
async function showWealthRoll(interaction, char) {
  const uid    = interaction.user.id;
  const session = getSession(uid);

  char.hpMax    = calcHP(CLASSES[char.class], char.finalStats?.CON ?? 10);
  char.hpActual = char.hpMax;

  const bgData    = BACKGROUNDS[char.background] || {};
  const { po, pp, pc, pe, pt, equipoSinDinero } = extraerDineroTrasfondo(bgData);
  const dineroTrasfondo = { PO:po, PP:pp, PC:pc, PE:pe, PT:pt };
  const tieneDineroTras = po+pp+pc+pe+pt > 0;

  const equipClase = EQUIPO_INICIAL_CLASE[char.class];
  const dineroInfo = equipClase ? tirarDineroCombate(equipClase.dinero) : tirarDineroCombate('5d4 x 10');
  const valeInfo   = tirarDineroCombate('1d12 x 100');
  const valeValor  = valeInfo.total;

  session._equipChoice  = { dineroInfo, valeValor, char, dineroTrasfondo, equipoSinDinero };
  session._equipElegido = {};
  session._grupoActual  = 0;

  // Preview equipo de clase
  let previewClase = '*(No disponible)*';
  if (equipClase) {
    const lineas = [];
    for (const g of equipClase.grupos) {
      if (g.tipo === 'fijo') {
        lineas.push('\u2705 **Fijo:** ' + g.items.map(i=>i.nombre+(i.cantidad>1?' x'+i.cantidad:'')).join(', '));
      } else {
        lineas.push('\ud83d\udd18 **' + g.label + ':** ' +
          g.opciones.map((op,i)=>'('+(i+1)+') '+op.map(it=>it.nombre).join(' + ')).join(' *o* '));
      }
    }
    previewClase = lineas.join('\n');
  }

  const dineroTrasStr = tieneDineroTras
    ? Object.entries(dineroTrasfondo).filter(([,v])=>v>0).map(([k,v])=>v+' '+k).join(' + ')
    : '*(ninguno)*';
  const itemsTrasStr = equipoSinDinero.length ? equipoSinDinero.join(', ') : '*(ninguno)*';

  const embed = new EmbedBuilder()
    .setTitle('\ud83c\udf92 Equipo inicial')
    .setColor(0x8B4513)
    .setDescription('**' + char.name + '** — ❤️ HP: **' + char.hpMax + '**\n\nElige cómo comenzar la aventura:')
    .addFields(
      { name: '⚔️ Opción A — Equipo de clase + trasfondo', value:
        previewClase.slice(0,700) +
        '\n\n📜 **Trasfondo:** ' + itemsTrasStr.slice(0,200) +
        '\n💰 **Dinero del trasfondo:** ' + dineroTrasStr,
        inline: false },
      { name: '💰 Opción B — Solo dinero (renuncias al equipo)', value:
        dineroInfo.formula + ' → [' + dineroInfo.dados.join(', ') + ']' +
        (dineroInfo.mult>1?' × '+dineroInfo.mult:'') + ' = **' + dineroInfo.total + ' PO**\n' +
        '*Renuncias a todo el equipo de clase y trasfondo.*',
        inline: false },
      { name: '📜 Opción C — Vale de aventurero', value:
        '🎲 1d12([' + valeInfo.dados[0] + ']) × 100 = **' + valeValor + ' PO**\n' +
        '⚠️ *El dios de la suerte podría reemplazar tus elecciones:*\n' +
        '🔵 1/10M → Arma dorada | 2-10/10M → Arma única | 11-10k/10M → Vale especial (+PO bonus)',
        inline: false },
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('equip_opcion_a').setLabel('⚔️ Equipo de clase').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('equip_opcion_b').setLabel('💰 Dinero (' + dineroInfo.total + ' PO)').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('equip_opcion_c').setLabel('📜 Vale (' + valeValor + ' PO)').setStyle(ButtonStyle.Secondary),
  );

  await responder(interaction, { embeds: [embed], components: [row] });
}

// ─── Opción A: selects por grupo ──────────────────────────────────────────────
async function showGrupoEleccion(interaction, char, grupoIdx = 0) {
  const session    = getSession(interaction.user.id);
  const equipClase = EQUIPO_INICIAL_CLASE[char.class];
  if (!equipClase) { await aplicarEquipoFinal(interaction, char, []); return; }

  // Saltar grupos fijos
  while (grupoIdx < equipClase.grupos.length && equipClase.grupos[grupoIdx].tipo === 'fijo') {
    grupoIdx++;
  }

  // Si ya pasamos todos los grupos con elección → finalizar
  if (grupoIdx >= equipClase.grupos.length) {
    await aplicarEquipoOpcionA(interaction, char);
    return;
  }

  session._grupoActual = grupoIdx;
  const grupo = equipClase.grupos[grupoIdx];
  const total = equipClase.grupos.filter(g => g.tipo === 'elegir').length;
  const actual = equipClase.grupos.slice(0, grupoIdx).filter(g => g.tipo === 'elegir').length + 1;

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Equipo de clase — Elección ${actual}/${total}`)
    .setColor(0x4169E1)
    .setDescription(`**${grupo.label}**\n\nElige una de las opciones:`)
    .addFields(grupo.opciones.map((op, i) => ({
      name: `Opción ${i+1}`,
      value: op.map(it => `• ${it.nombre}${it.cantidad>1?' ×'+it.cantidad:''}${it.descripcion?' *('+it.descripcion+')*':''}`).join('\n'),
      inline: true,
    })));

  const opts = grupo.opciones.map((op, i) => ({
    label: op.map(it => it.nombre).join(' + ').slice(0, 100),
    description: op.map(it => it.descripcion||'').filter(Boolean).join(' / ').slice(0,100)||undefined,
    value: String(i),
  }));

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`equip_grupo_${grupoIdx}`)
        .setPlaceholder(`Elige para: ${grupo.label}`)
        .addOptions(opts)
    ),
  ];

  await responder(interaction, { embeds: [embed], components: rows });
}

async function aplicarEquipoOpcionA(interaction, char) {
  const session    = getSession(interaction.user.id);
  const elegido    = session._equipElegido || {};
  const equipClase = EQUIPO_INICIAL_CLASE[char.class];
  const ec         = session._equipChoice || {};
  const inv        = [];

  // Función para decidir si un ítem va al inventario o se convierte en vale
  function procesarItem(it) {
    const nom = it.nombre.toLowerCase();
    const esAEleccion = nom.includes('a elegir') || nom.includes('a elección') || nom.includes('cualquier') || nom.includes('(a elecci');
    if (esAEleccion) {
      // Determinar el tipo de vale según el ítem
      let tipoVale = 'Vale Arma Cualquiera';
      if (nom.includes('sencill') || nom.includes('simple')) {
        if (nom.includes('dist') || nom.includes('ranged')) tipoVale = 'Vale Arma Sencilla Dist';
        else tipoVale = 'Vale Arma Sencilla CaC';
      } else if (nom.includes('marcial') || nom.includes('martial')) {
        if (nom.includes('dist') || nom.includes('ranged')) tipoVale = 'Vale Arma Marcial Dist';
        else tipoVale = 'Vale Arma Marcial CaC';
      } else if (nom.includes('instrumento')) {
        tipoVale = 'Vale Instrumento Musical';
      }
      inv.push({ nombre: tipoVale, cantidad: it.cantidad||1, peso:0, precio:0, categoria:'Vale', esVale:true, descripcion: it.descripcion || 'Canjeable en la tienda por el ítem correspondiente' });
    } else {
      inv.push({ nombre:it.nombre, cantidad:it.cantidad||1, peso:0, precio:0, categoria:'Equipo inicial', descripcion:it.descripcion||'' });
    }
  }

  // Equipo de clase (con elecciones)
  if (equipClase) {
    for (let i = 0; i < equipClase.grupos.length; i++) {
      const g = equipClase.grupos[i];
      if (g.tipo === 'fijo') {
        g.items.forEach(it => procesarItem(it));
      } else {
        const opIdx = parseInt(elegido[i] ?? 0);
        const op    = g.opciones[opIdx] || g.opciones[0];
        op.forEach(it => procesarItem(it));
      }
    }
  }

  // Equipo del trasfondo (sin el dinero, que va al monedero)
  const equipoTras = ec.equipoSinDinero || [];
  equipoTras.forEach(nombre => {
    const nom = nombre.toLowerCase();
    const esElegir = nom.includes('a elegir') || nom.includes('elección') || nom.includes('cualquier') || nom.includes('(a elecci');
    if (!esElegir) {
      if (!inv.find(i=>i.nombre===nombre))
        inv.push({ nombre, cantidad:1, peso:0, precio:0, categoria:'Trasfondo' });
    } else {
      // Ítems "a elegir" del trasfondo → vale
      let tipoVale = 'Vale de Objeto';
      if (nom.includes('instrumento')) tipoVale = 'Vale Instrumento Musical';
      else if (nom.includes('arma')) tipoVale = 'Vale Arma Cualquiera';
      else if (nom.includes('herramienta')) tipoVale = 'Vale de Herramienta';
      if (!inv.find(i=>i.nombre===tipoVale))
        inv.push({ nombre:tipoVale, cantidad:1, peso:0, precio:0, categoria:'Vale', esVale:true });
    }
  });

  // Monedero: dinero del trasfondo
  const money = { ...monederoVacio(), ...(ec.dineroTrasfondo||{}) };

  char.inventory = inv;
  char.money     = money;
  if (session.character) session.character = char;
  else updateCharacter(interaction.user.id, { inventory:inv, money });
  await showFinalCharacter(interaction, char);
}

async function aplicarEquipoFinal(interaction, char, inv) {
  char.inventory = inv;
  char.money     = monederoVacio();
  const session  = getSession(interaction.user.id);
  if (session.character) session.character = char;
  else updateCharacter(interaction.user.id, { inventory:inv, money:monederoVacio() });
  await showFinalCharacter(interaction, char);
}

// ─── Ficha final ──────────────────────────────────────────────────────────────
async function showFinalCharacter(interaction, char) {
  saveCharacter(interaction.user.id, char, interaction.guildId);

  // Anuncio vale especial PO
  if (char._valeEspecialPO) {
    const bonusPO = char._valeEspecialPO;
    delete char._valeEspecialPO;
    try {
      await interaction.channel?.send({
        embeds: [new EmbedBuilder()
          .setTitle('✨ ¡Vale Especial! ✨')
          .setColor(0x9B59B6)
          .setDescription(
            `<@${interaction.user.id}> ha obtenido un **Vale Especial**.

` +
            `Sus elecciones de equipo inicial han sido reemplazadas por **${bonusPO} PO** en dinero.`
          )]
      }).catch(()=>{});
    } catch {}
  }

  for (const key of ['_valeDorado', '_valeEspecial']) {
    const arma = char[key];
    if (!arma) continue;
    delete char[key];
    try {
      const esDorado = key === '_valeDorado';
      const anuncio  = new EmbedBuilder()
        .setTitle(esDorado ? '🌟💛 ¡¡¡VALE DORADO!!! 💛🌟' : '🌟✨ ¡VALE ESPECIAL! ✨🌟')
        .setColor(esDorado ? 0xFFD700 : 0xC0C0C0)
        .setDescription(
          esDorado
            ? `🎉 **<@${interaction.user.id}>** obtuvo el arma legendaria **${arma.nombre}**.`
            : `<@${interaction.user.id}> obtuvo el arma única **${arma.nombre}**.`
        )
        .addFields({ name:'⚔️ Daño', value:arma.daño||'—', inline:true });
      await interaction.channel?.send({ embeds:[anuncio] }).catch(()=>{});
    } catch {}
  }

  const embed = buildCharacterEmbed(char, `🎉 ¡${char.name} está listo!`);
  embed.setColor(0xFFD700);
  embed.setFooter({ text:'✅ Guardado. Usa /equipo-inicial para cambiar en cualquier momento.' });

  const payload = {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('export_character').setLabel('📋 Exportar').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('share_character').setLabel('📢 Compartir').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('new_character').setLabel('🔄 Nuevo').setStyle(ButtonStyle.Secondary),
    )],
  };

  await responder(interaction, payload);
  getSession(interaction.user.id).step = 'done';
}

// ─── Handler de botones e interacciones ──────────────────────────────────────
async function handleEquipoInteraction(interaction) {
  const id      = interaction.customId || '';
  const uid     = interaction.user.id;
  const session = getSession(uid);
  const char    = session.character || getCharacter(uid);
  if (!char) return false;

  // Botones de elección principal
  if (id === 'equip_opcion_a') {
    session._equipElegido = {};
    session._grupoActual  = 0;
    await showGrupoEleccion(interaction, char, 0);
    return true;
  }

  if (id === 'equip_opcion_b') {
    const ec = session._equipChoice;
    const money = monederoVacio();
    money['PO'] = ec?.dineroInfo?.total || 50;
    char.money     = money;
    char.inventory = [];
    if (session.character) session.character = char;
    else updateCharacter(uid, { money, inventory:[] });
    await showFinalCharacter(interaction, char);
    return true;
  }

  if (id === 'equip_opcion_c') {
    const ec        = session._equipChoice;
    const valeValor = ec?.valeValor ?? 600;
    const resultado = tirarVale(char.class);

    let inv = [];
    let money = monederoVacio();

    if (resultado.tipo === 'dorado' && resultado.arma) {
      inv = [{ nombre:resultado.arma.nombre, cantidad:1, peso:1, precio:0,
               daño:resultado.arma.daño, propiedades:resultado.arma.propiedades,
               descripcion:resultado.arma.desc, categoria:'Arma Dorada', dorada:true }];
      char._valeDorado = resultado.arma;

    } else if (resultado.tipo === 'unico' && resultado.arma) {
      inv = [{ nombre:resultado.arma.nombre, cantidad:1, peso:1, precio:0,
               daño:resultado.arma.daño, propiedades:resultado.arma.propiedades,
               descripcion:resultado.arma.descripcion, categoria:'Arma Única', unica:true }];
      char._valeEspecial = resultado.arma;

    } else if (resultado.tipo === 'especial') {
      // Vale especial: reemplaza elecciones de clase por dinero extra (vale × 2)
      const bonusPO = valeValor * 2;
      money.PO = bonusPO;
      inv = [{ nombre:'Vale Especial de Aventurero (' + bonusPO + ' PO)', cantidad:1, peso:0, precio:bonusPO, categoria:'Vale' }];
      char._valeEspecialPO = bonusPO;

    } else {
      // Vale normal
      money.PO = valeValor;
      inv = [{ nombre:'Vale de Aventurero (' + valeValor + ' PO)', cantidad:1, peso:0, precio:valeValor, categoria:'Vale' }];
    }

    char.inventory = inv;
    char.money     = money;
    if (session.character) session.character = char;
    else updateCharacter(uid, { inventory:inv, money });
    await showFinalCharacter(interaction, char);
    return true;
  }

  // Select de grupo de elección: equip_grupo_N
  if (interaction.isStringSelectMenu() && id.startsWith('equip_grupo_')) {
    const grupoIdx = parseInt(id.replace('equip_grupo_', ''));
    if (!session._equipElegido) session._equipElegido = {};
    session._equipElegido[grupoIdx] = interaction.values[0];

    // Avanzar al siguiente grupo con elección
    const equipClase = EQUIPO_INICIAL_CLASE[char.class];
    let siguiente = grupoIdx + 1;
    while (siguiente < (equipClase?.grupos?.length||0) && equipClase.grupos[siguiente].tipo === 'fijo') {
      siguiente++;
    }
    if (siguiente >= (equipClase?.grupos?.length||0)) {
      await aplicarEquipoOpcionA(interaction, char);
    } else {
      await showGrupoEleccion(interaction, char, siguiente);
    }
    return true;
  }

  // Botones post-creación
  if (id === 'share_character') {
    const em = buildCharacterEmbed(char, `⚔️ Personaje de ${interaction.user.displayName}`);
    await interaction.reply({ embeds:[em] });
    return true;
  }

  if (id === 'export_character') {
    const stats = char.finalStats||{};
    const inv   = (char.inventory||[]).map(i=>`• ${i.nombre}${i.cantidad>1?' ×'+i.cantidad:''}`).join('\n')||'—';
    const money = char.money ? Object.entries(char.money).filter(([,v])=>v>0).map(([k,v])=>`${v} ${k}`).join(' ') : '—';
    const text = [
      '═══════════════════════════',
      '   FICHA D&D 5e',
      '═══════════════════════════',
      `Nombre:    ${char.name||'?'}`,
      `Raza:      ${char.race||'?'}`,
      `Clase:     ${char.class||'?'} nv.${char.level||1}`,
      `Trasfondo: ${char.background||'?'}`,
      `Alineami.: ${char.alignment||'?'}`,
      '── STATS ──',
      `FUE:${stats.STR||'?'} DES:${stats.DEX||'?'} CON:${stats.CON||'?'}`,
      `INT:${stats.INT||'?'} SAB:${stats.WIS||'?'} CAR:${stats.CHA||'?'}`,
      `HP:${char.hpMax||'?'}  CA:${10+Math.floor(((stats.DEX||10)-10)/2)}`,
      '── INVENTARIO ──', inv,
      '── DINERO ──', money,
      '═══════════════════════════',
    ].join('\n');
    await interaction.reply({ content:'```\n'+text+'\n```', ephemeral:true });
    return true;
  }

  if (id === 'new_character') {
    const { deleteSession } = require('../utils/sessions.js');
    deleteSession(uid);
    await interaction.update({ content:'¡Listo para un nuevo personaje! Usa `/crear-personaje`.', embeds:[], components:[] });
    return true;
  }

  return false;
}

// ─── Comando /equipo-inicial ──────────────────────────────────────────────────
async function cmdEquipoInicial(interaction) {
  const char = getCharacter(interaction.user.id);
  if (!char) return interaction.reply({ content:'❌ Primero crea tu personaje con `/crear-personaje`.', ephemeral:true });
  // Slash command → usar reply directo
  await showWealthRoll(interaction, char);
}

module.exports = { showWealthRoll, showFinalCharacter, handleEquipoInteraction, cmdEquipoInicial };
