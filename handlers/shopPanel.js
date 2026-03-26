// ── handlers/shopPanel.js ─────────────────────────────────────────────────────
// Tienda y Bar — el DM abre/cierra y puede ajustar precios en partida
//
// Flujo tienda:
//  1. DM abre con /dm-abrir-tienda
//  2. DM puede ajustar precio de un item con /dm-precio-tienda
//  3. Jugador usa /tienda → elige item → ve opciones: Comprar / Regatear / Dejar
//  4. Si regatea: el bot tira CHA vs dificultad y aplica descuento o subida
//  5. DM puede restablecer precios a base con /dm-precio-tienda restablece:true
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');

const { getCharacter, updateCharacter } = require('../db/characterStore.js');
const { ARMAS, ARMADURAS }              = require('../data/equipment.js');
const { formatearMonedero, pagar, totalEnPC } = require('../data/startingWealth.js');
const { isDM }                          = require('./dmPanel.js');

// ─── Estado en memoria ────────────────────────────────────────────────────────
// Locales abiertos: { [channelId]: { tipo, abiertoBy } }
const LOCALES_ABIERTOS = new Map();

// Precios ajustados por el DM: { [channelId]: { [nombre]: precioEnPO } }
const PRECIOS_AJUSTADOS = new Map();

// Selección pendiente del jugador: { [userId]: { nombre, precioFinal, channelId } }
const SELECCION_PENDIENTE = new Map();

// ─── Bar ──────────────────────────────────────────────────────────────────────
const MENU_BAR = [
  { nombre: 'Cerveza de taberna',      precio: 0.04, stat: 'CHA', bonus:  1, duracion: 180, efecto: '+1 CAR durante 3h. Te sueltas la lengua.' },
  { nombre: 'Vino de mesa (jarra)',    precio: 0.02, stat: 'WIS', bonus: -1, duracion: 120, efecto: '-1 SAB durante 2h. El vino nubla el juicio.' },
  { nombre: 'Vino añejo (botella)',    precio: 10,   stat: 'CHA', bonus:  2, duracion: 180, efecto: '+2 CAR durante 3h. Vino de calidad.' },
  { nombre: 'Aguardiente enano',       precio: 2,    stat: 'BRUTE', bonus: 0, duracion: 180, efecto: '+4 FUE, -2 INT durante 3h. Fuerza bruta enana.' },
  { nombre: 'Hidromiel élfico',        precio: 0.5,  stat: 'WIS', bonus:  1, duracion: 180, efecto: '+1 SAB durante 3h. Claridad feérica.' },
  { nombre: 'Agua pura (cantimplora)', precio: 0.01, stat: null,  bonus:  0, duracion: 0,   efecto: 'Sin efecto especial. Solo hidratación.' },
  { nombre: 'Pan de posada',           precio: 0.02, stat: null,  bonus:  0, duracion: 0,   efecto: 'Sin efecto especial. Llena el estómago.' },
  { nombre: 'Queso curado',            precio: 0.1,  stat: 'CON', bonus:  1, duracion: 120, efecto: '+1 CON durante 2h. Nutritivo y consistente.' },
  { nombre: 'Estofado de la casa',     precio: 0.1,  stat: 'CON', bonus:  1, duracion: 180, efecto: '+1 CON durante 3h. La especialidad del chef.' },
  { nombre: 'Asado de jabalí',         precio: 0.3,  stat: 'STR', bonus:  1, duracion: 180, efecto: '+1 FUE durante 3h. Carne de caza reciente.' },
  { nombre: 'Banquete (por persona)',  precio: 10,   stat: 'ALL', bonus:  1, duracion: 480, efecto: '+1 a TODO durante 8h. Festín completo.' },
  { nombre: 'Ración de viaje (1 día)', precio: 0.5,  stat: null,  bonus:  0, duracion: 0,   efecto: 'Sin efecto. Sustento básico para el camino.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsearPrecio(costeStr) {
  if (!costeStr || costeStr === '-') return null;
  const s = costeStr.toLowerCase().trim();
  const match = s.match(/([\d,\.]+)\s*(po|gp|pp|sp|pc|cp|pe|ep)/);
  if (!match) return null;
  const num    = parseFloat(match[1].replace(',', '.'));
  const moneda = match[2];
  if (moneda === 'po' || moneda === 'gp') return num;
  if (moneda === 'pp' || moneda === 'sp') return num / 10;
  if (moneda === 'pe' || moneda === 'ep') return num / 2;
  if (moneda === 'pc' || moneda === 'cp') return num / 100;
  return num;
}

function parsearPeso(pesoStr) {
  if (!pesoStr || pesoStr === '-') return 0;
  const match = pesoStr.match(/([\d\/\.]+)/);
  if (!match) return 0;
  if (match[1].includes('/')) {
    const [a, b] = match[1].split('/');
    return parseFloat(a) / parseFloat(b);
  }
  return parseFloat(match[1]) || 0;
}

function formatPrecio(po) {
  if (po <= 0)   return 'Gratis';
  if (po < 0.1)  return `${Math.round(po * 100)} PC`;
  if (po < 1)    return `${Math.round(po * 10)} PP`;
  if (po < 10)   return `${po.toFixed(1).replace(/\.0$/, '')} PO`;
  return `${Math.round(po)} PO`;
}

function statModNum(v) {
  return Math.floor((v - 10) / 2);
}

// Munición (se vende de 20 en 20, precio en PP)
const MUNICION_TIENDA = [
  { nombre: 'Flechas',                    precioBase: 0.5,  peso: 1,   categoria: 'Munición', cantidad: 20, desc: 'Para arcos. Pack de 20.' },
  { nombre: 'Virotes de ballesta',        precioBase: 0.5,  peso: 1.5, categoria: 'Munición', cantidad: 20, desc: 'Para ballestas. Pack de 20.' },
  { nombre: 'Balas de honda',             precioBase: 0.04, peso: 1.5, categoria: 'Munición', cantidad: 20, desc: 'Para honda. Pack de 20.' },
  { nombre: 'Agujas de cerbatana',        precioBase: 0.25, peso: 0.5, categoria: 'Munición', cantidad: 50, desc: 'Para cerbatana. Pack de 50.' },
];

function getCatalogoBase() {
  const items = [];
  for (const [nombre, data] of Object.entries(ARMAS)) {
    const precio = parsearPrecio(data.coste);
    if (precio !== null) items.push({ nombre, precioBase: precio, precio, peso: parsearPeso(data.peso), categoria: 'Arma', desc: data.daño || data.damage || '' });
  }
  for (const [nombre, data] of Object.entries(ARMADURAS)) {
    const precio = parsearPrecio(data.coste);
    if (precio !== null) items.push({ nombre, precioBase: precio, precio, peso: parsearPeso(data.peso), categoria: 'Armadura', desc: `CA ${data.ca || '?'}` });
  }
  // Munición
  for (const m of MUNICION_TIENDA) {
    items.push({ ...m, precio: m.precioBase });
  }
  return items;
}

// Obtener catálogo con precios ajustados para un canal
function getCatalogoCanal(channelId) {
  const ajustes = PRECIOS_AJUSTADOS.get(channelId) || {};
  return getCatalogoBase().map(item => ({
    ...item,
    precio: ajustes[item.nombre] !== undefined ? ajustes[item.nombre] : item.precioBase,
    ajustado: ajustes[item.nombre] !== undefined,
  }));
}

// ─── DM: abrir / cerrar tienda ────────────────────────────────────────────────
async function cmdDmAbrirTienda(interaction) {
  if (!isDM(interaction.member)) return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });
  LOCALES_ABIERTOS.set(interaction.channelId, { tipo: 'tienda', abiertoBy: interaction.user.id });
  await interaction.reply({ embeds: [new EmbedBuilder().setTitle('🏪 ¡Tienda abierta!').setColor(0xFFD700).setDescription('Los aventureros pueden usar `/tienda` para comprar.')] });
}

async function cmdDmCerrarTienda(interaction) {
  if (!isDM(interaction.member)) return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });
  if (!LOCALES_ABIERTOS.get(interaction.channelId)?.tipo === 'tienda')
    return interaction.reply({ content: '❌ No hay tienda abierta aquí.', ephemeral: true });
  LOCALES_ABIERTOS.delete(interaction.channelId);
  await interaction.reply({ embeds: [new EmbedBuilder().setTitle('🔒 Tienda cerrada').setColor(0x888888)] });
}

// ─── DM: ajustar precio de la tienda ─────────────────────────────────────────
async function cmdDmPrecioTienda(interaction) {
  if (!isDM(interaction.member)) return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  const nombre      = interaction.options.getString('objeto');
  const nuevoPrecio = interaction.options.getNumber('precio');    // en PO, null si restablece
  const restablece  = interaction.options.getBoolean('restablecer') || false;

  if (!PRECIOS_AJUSTADOS.has(interaction.channelId)) {
    PRECIOS_AJUSTADOS.set(interaction.channelId, {});
  }
  const ajustes = PRECIOS_AJUSTADOS.get(interaction.channelId);

  if (restablece) {
    if (nombre) {
      delete ajustes[nombre];
      await interaction.reply({ content: `✅ Precio de **${nombre}** restablecido al precio base.`, ephemeral: true });
    } else {
      PRECIOS_AJUSTADOS.set(interaction.channelId, {});
      await interaction.reply({ content: '✅ Todos los precios restablecidos al valor base.', ephemeral: true });
    }
    return;
  }

  if (!nombre || nuevoPrecio === null || nuevoPrecio === undefined) {
    return interaction.reply({ content: '❌ Especifica el objeto y el nuevo precio.', ephemeral: true });
  }

  const catalogo = getCatalogoBase();
  const item     = catalogo.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
  if (!item) return interaction.reply({ content: `❌ No se encontró **${nombre}** en el catálogo.`, ephemeral: true });

  ajustes[item.nombre] = nuevoPrecio;

  const embed = new EmbedBuilder()
    .setTitle('💰 Precio ajustado')
    .setColor(0xFFD700)
    .setDescription(`**${item.nombre}**`)
    .addFields(
      { name: 'Precio base', value: formatPrecio(item.precioBase), inline: true },
      { name: 'Nuevo precio', value: formatPrecio(nuevoPrecio), inline: true },
    )
    .setFooter({ text: 'Usa /dm-precio-tienda restablecer:true para volver al precio base' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── DM: abrir / cerrar bar ───────────────────────────────────────────────────
async function cmdDmAbrirBar(interaction) {
  if (!isDM(interaction.member)) return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });
  LOCALES_ABIERTOS.set(interaction.channelId, { tipo: 'bar', abiertoBy: interaction.user.id });
  await interaction.reply({ embeds: [new EmbedBuilder().setTitle('🍺 ¡Bar abierto!').setColor(0x8B4513).setDescription('Los aventureros pueden usar `/bar` para pedir.')] });
}

async function cmdDmCerrarBar(interaction) {
  if (!isDM(interaction.member)) return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });
  LOCALES_ABIERTOS.delete(interaction.channelId);
  await interaction.reply({ embeds: [new EmbedBuilder().setTitle('🔒 Bar cerrado').setColor(0x888888)] });
}

// ─── /tienda — catálogo con selects ──────────────────────────────────────────
async function cmdTienda(interaction) {
  const local = LOCALES_ABIERTOS.get(interaction.channelId);
  if (!local || local.tipo !== 'tienda')
    return interaction.reply({ content: '❌ No hay tienda abierta. El DM usa `/dm-abrir-tienda`.', ephemeral: true });

  const char = getCharacter(interaction.user.id);
  if (!char) return interaction.reply({ content: '❌ No tienes personaje.', ephemeral: true });

  const catalogo   = getCatalogoCanal(interaction.channelId);
  const money      = char.money || { PC:0, PP:0, PE:0, PO:0, PT:0 };
  const armas      = catalogo.filter(i => i.categoria === 'Arma');
  const armaduras  = catalogo.filter(i => i.categoria === 'Armadura');

  const fmtItem = i => {
    const ajMarca = i.ajustado ? ' *(precio especial)*' : '';
    return `• **${i.nombre}** — ${formatPrecio(i.precio)}${i.desc ? ` *(${i.desc})*` : ''}${ajMarca}`;
  };

  const embed = new EmbedBuilder()
    .setTitle('🏪 Tienda del aventurero')
    .setColor(0xFFD700)
    .setDescription(`💰 Tu dinero: **${formatearMonedero(money)}**\n\nElige un artículo para ver las opciones (comprar, regatear o dejar).`)
    .addFields(
      { name: '⚔️ Armas', value: armas.slice(0, 15).map(fmtItem).join('\n') || 'Sin stock', inline: false },
      { name: '🛡️ Armaduras', value: armaduras.slice(0, 10).map(fmtItem).join('\n') || 'Sin stock', inline: false },
    );

  const rows = [];
  if (armas.length) {
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tienda_sel_arma')
        .setPlaceholder('⚔️ Seleccionar arma...')
        .addOptions(armas.slice(0, 25).map(i => ({
          label: i.nombre.slice(0, 100),
          description: `${formatPrecio(i.precio)}${i.desc ? ` — ${i.desc}` : ''}`.slice(0, 100) || undefined,
          value: `arma__${encodeURIComponent(i.nombre)}`,
        })))
    ));
  }
  if (armaduras.length) {
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('tienda_sel_armadura')
        .setPlaceholder('🛡️ Seleccionar armadura...')
        .addOptions(armaduras.slice(0, 25).map(i => ({
          label: i.nombre.slice(0, 100),
          description: `${formatPrecio(i.precio)}${i.desc ? ` — ${i.desc}` : ''}`.slice(0, 100) || undefined,
          value: `armadura__${encodeURIComponent(i.nombre)}`,
        })))
    ));
  }

  await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
}

// ─── Mostrar opciones del item seleccionado ───────────────────────────────────
async function mostrarOpcionesItem(interaction, nombre, channelId) {
  const char    = getCharacter(interaction.user.id);
  const catalogo = getCatalogoCanal(channelId);
  const item    = catalogo.find(i => i.nombre === nombre);
  if (!item || !char) return;

  const money = char.money || { PC:0, PP:0, PE:0, PO:0, PT:0 };

  // Guardar selección pendiente
  SELECCION_PENDIENTE.set(interaction.user.id, { nombre: item.nombre, precioActual: item.precio, precioBase: item.precioBase, channelId });

  const puedeComprar = totalEnPC(money) >= Math.round(item.precio * 100);
  const chaMod       = statModNum(char.finalStats?.CHA ?? 10);

  const embed = new EmbedBuilder()
    .setTitle(`🛒 ${item.nombre}`)
    .setColor(0xFFD700)
    .setDescription(
      `**Precio:** ${formatPrecio(item.precio)}${item.ajustado ? ` *(ajustado, base: ${formatPrecio(item.precioBase)})*` : ''}\n` +
      (item.desc ? `**${item.categoria === 'Arma' ? 'Daño' : 'CA'}:** ${item.desc}\n` : '') +
      `**Peso:** ${item.peso} lb\n\n` +
      `💰 Tu dinero: ${formatearMonedero(money)}\n` +
      `✨ Tu CAR: ${char.finalStats?.CHA ?? 10} (mod ${chaMod >= 0 ? '+' : ''}${chaMod})`
    )
    .setFooter({ text: 'El regateo usa tu modificador de Carisma contra CD 15' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('tienda_comprar')
      .setLabel(`💰 Comprar (${formatPrecio(item.precio)})`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(!puedeComprar),
    new ButtonBuilder()
      .setCustomId('tienda_regatear')
      .setLabel(`🎲 Regatear (CAR ${chaMod >= 0 ? '+' : ''}${chaMod})`)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('tienda_dejar')
      .setLabel('❌ Dejar')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.update({ embeds: [embed], components: [row] });
}

// ─── Lógica de regateo ────────────────────────────────────────────────────────
async function procesarRegateo(interaction) {
  const userId  = interaction.user.id;
  const sel     = SELECCION_PENDIENTE.get(userId);
  const char    = getCharacter(userId);
  if (!sel || !char) return interaction.update({ content: '❌ Sin selección activa.', embeds: [], components: [] });

  const chaMod = statModNum(char.finalStats?.CHA ?? 10);
  const dado   = Math.floor(Math.random() * 20) + 1;
  const total  = dado + chaMod;
  const cd     = 15;

  let precioFinal = sel.precioActual;
  let resultado, color;

  if (dado === 20) {
    // Crítico: 25% descuento
    precioFinal = Math.max(0.01, sel.precioActual * 0.75);
    resultado = `🎯 **¡Crítico!** El comerciante acepta fascinado. **25% de descuento.**`;
    color = 0x00FF00;
  } else if (dado === 1) {
    // Pifia: 20% más caro
    precioFinal = sel.precioActual * 1.2;
    resultado = `💥 **¡Pifia!** Insultaste al comerciante sin querer. El precio sube un 20%.`;
    color = 0xFF0000;
  } else if (total >= cd + 5) {
    // Éxito holgado: 15% descuento
    precioFinal = Math.max(0.01, sel.precioActual * 0.85);
    resultado = `✅ **Éxito holgado** (${dado}+${chaMod}=${total} vs CD ${cd}). **15% de descuento.**`;
    color = 0x00CC00;
  } else if (total >= cd) {
    // Éxito justo: 10% descuento
    precioFinal = Math.max(0.01, sel.precioActual * 0.90);
    resultado = `✅ **Éxito** (${dado}+${chaMod}=${total} vs CD ${cd}). **10% de descuento.**`;
    color = 0x88CC00;
  } else if (total >= cd - 4) {
    // Fallo leve: precio sin cambio
    resultado = `❌ **Fallo** (${dado}+${chaMod}=${total} vs CD ${cd}). El precio se mantiene.`;
    color = 0xFFAA00;
  } else {
    // Fallo grave: 10% más caro
    precioFinal = sel.precioActual * 1.1;
    resultado = `❌ **Fallo grave** (${dado}+${chaMod}=${total} vs CD ${cd}). El precio sube un 10%.`;
    color = 0xFF6600;
  }

  precioFinal = Math.round(precioFinal * 100) / 100;

  // Actualizar selección con precio negociado
  SELECCION_PENDIENTE.set(userId, { ...sel, precioActual: precioFinal });

  const money       = char.money || { PC:0, PP:0, PE:0, PO:0, PT:0 };
  const puedeComprar = totalEnPC(money) >= Math.round(precioFinal * 100);

  const embed = new EmbedBuilder()
    .setTitle(`🎲 Regateo — ${sel.nombre}`)
    .setColor(color)
    .setDescription(resultado)
    .addFields(
      { name: 'Precio original', value: formatPrecio(sel.precioActual), inline: true },
      { name: 'Precio final',    value: `**${formatPrecio(precioFinal)}**`, inline: true },
      { name: '💰 Tu dinero',   value: formatearMonedero(money), inline: true },
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('tienda_comprar')
      .setLabel(`💰 Comprar (${formatPrecio(precioFinal)})`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(!puedeComprar),
    new ButtonBuilder()
      .setCustomId('tienda_dejar')
      .setLabel('❌ Dejar')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.update({ embeds: [embed], components: [row] });
}

// ─── Ejecutar compra ──────────────────────────────────────────────────────────
async function ejecutarCompra(interaction) {
  const userId = interaction.user.id;
  const sel    = SELECCION_PENDIENTE.get(userId);
  const char   = getCharacter(userId);
  if (!sel || !char) return interaction.update({ content: '❌ Sin selección activa.', embeds: [], components: [] });

  const money = { ...(char.money || { PC:0, PP:0, PE:0, PO:0, PT:0 }) };

  if (totalEnPC(money) < Math.round(sel.precioActual * 100)) {
    return interaction.update({
      embeds: [new EmbedBuilder().setTitle('❌ Fondos insuficientes').setColor(0xFF0000)
        .setDescription(`**${sel.nombre}** cuesta ${formatPrecio(sel.precioActual)} y no tienes suficiente.`)],
      components: [],
    });
  }

  const nuevoMonedero = pagar(money, sel.precioActual);
  if (!nuevoMonedero) return interaction.update({ content: '❌ Error al procesar el pago.', embeds: [], components: [] });

  const catalogo  = getCatalogoBase();
  const itemBase  = catalogo.find(i => i.nombre === sel.nombre);
  const inv       = [...(char.inventory || [])];
  const idxInv    = inv.findIndex(i => i.nombre.toLowerCase() === sel.nombre.toLowerCase());

  if (idxInv !== -1) {
    inv[idxInv] = { ...inv[idxInv], cantidad: inv[idxInv].cantidad + 1 };
  } else {
    inv.push({ nombre: sel.nombre, cantidad: 1, peso: itemBase?.peso || 0, precio: sel.precioActual, categoria: itemBase?.categoria || 'Equipo' });
  }

  updateCharacter(userId, { money: nuevoMonedero, inventory: inv });
  SELECCION_PENDIENTE.delete(userId);

  const embed = new EmbedBuilder()
    .setTitle(`✅ Comprado — ${sel.nombre}`)
    .setColor(0x00CC00)
    .setDescription(`Has adquirido **${sel.nombre}** por **${formatPrecio(sel.precioActual)}**.`)
    .addFields({ name: '💰 Dinero restante', value: formatearMonedero(nuevoMonedero), inline: true });

  await interaction.update({ embeds: [embed], components: [] });
}

// ─── /bar ─────────────────────────────────────────────────────────────────────
async function cmdBar(interaction) {
  const local = LOCALES_ABIERTOS.get(interaction.channelId);
  if (!local || local.tipo !== 'bar') return interaction.reply({ content: '❌ El bar está cerrado en este canal.', ephemeral: true });

  const char  = require('../db/characterStore.js').getCharacter(interaction.user.id);
  const money = char?.money;
  const saldo = money ? Object.entries(money).filter(([,v])=>v>0).map(([k,v])=>v+' '+k).join(' ') : '—';

  const embed = new EmbedBuilder()
    .setTitle('🍺 Bar & Taberna')
    .setColor(0x8B4513)
    .setDescription('Tu saldo: **' + saldo + '**\n\nElige qué tomar (los efectos duran según el ítem):')
    .addFields(MENU_BAR.map(i => ({
      name: i.nombre + ' — ' + i.precio + ' PO',
      value: i.efecto,
      inline: true,
    })));

  const opts = MENU_BAR.map(i => ({
    label: i.nombre + ' (' + i.precio + ' PO)',
    description: i.efecto.slice(0, 60),
    value: i.nombre,
  }));

  await interaction.reply({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('bar_pedir')
        .setPlaceholder('¿Qué vas a pedir?')
        .addOptions(opts)
    )],
    ephemeral: true,
  });
}

// OVERRIDE: reemplazar la definición vacía de cmdBar
// La versión original del archivo puede tener una implementación diferente


// ─── Compra directa bar ───────────────────────────────────────────────────────
async function procesarCompraBar(interaction, nombreCod) {
  const nombre = decodeURIComponent(nombreCod.replace('bar__', ''));
  const char   = getCharacter(interaction.user.id);
  if (!char) return;

  const item = MENU_BAR.find(i => i.nombre === nombre);
  if (!item) return interaction.update({ content: '❌ Artículo no encontrado.', embeds: [], components: [] });

  const money = { ...(char.money || { PC:0, PP:0, PE:0, PO:0, PT:0 }) };

  if (totalEnPC(money) < Math.round(item.precio * 100)) {
    return interaction.update({
      embeds: [new EmbedBuilder().setTitle('❌ Fondos insuficientes').setColor(0xFF0000)
        .setDescription(`**${item.nombre}** cuesta ${formatPrecio(item.precio)} y no tienes suficiente.`)],
      components: [],
    });
  }

  const nuevoMonedero = pagar(money, item.precio);
  const inv    = [...(char.inventory || [])];
  const idxInv = inv.findIndex(i => i.nombre.toLowerCase() === item.nombre.toLowerCase());
  if (idxInv !== -1) {
    inv[idxInv] = { ...inv[idxInv], cantidad: inv[idxInv].cantidad + 1 };
  } else {
    inv.push({ nombre: item.nombre, cantidad: 1, peso: item.peso, precio: item.precio, categoria: item.categoria });
  }
  updateCharacter(interaction.user.id, { money: nuevoMonedero, inventory: inv });

  const embed = new EmbedBuilder()
    .setTitle(`✅ Pedido — ${item.nombre}`)
    .setColor(0x8B4513)
    .setDescription(`Disfrutas de **${item.nombre}** por **${formatPrecio(item.precio)}**.`)
    .addFields({ name: '💰 Dinero restante', value: formatearMonedero(nuevoMonedero), inline: true });

  await interaction.update({ embeds: [embed], components: [] });
}

// ─── Router principal ─────────────────────────────────────────────────────────
async function handleShopInteraction(interaction) {
  const id = interaction.customId;

  // Selects del catálogo
  if (interaction.isStringSelectMenu()) {
    if (id === 'tienda_sel_arma' || id === 'tienda_sel_armadura') {
      const raw    = interaction.values[0]; // "arma__Espada%20Larga" o "armadura__Cuero"
      const nombre = decodeURIComponent(raw.split('__')[1]);
      await mostrarOpcionesItem(interaction, nombre, interaction.channelId);
      return true;
    }
    if (id === 'bar_pedir') {
      await procesarCompraBar(interaction, interaction.values[0]);
      return true;
    }
  }

  // Botones de la tienda
  if (interaction.isButton()) {
    if (id === 'tienda_comprar') {
      await ejecutarCompra(interaction);
      return true;
    }
    if (id === 'tienda_regatear') {
      await procesarRegateo(interaction);
      return true;
    }
    if (id === 'tienda_dejar') {
      SELECCION_PENDIENTE.delete(interaction.user.id);
      await interaction.update({ content: 'Has dejado el artículo.', embeds: [], components: [] });
      return true;
    }
  }


  // Bar: pedir comida/bebida
  if (interaction.isStringSelectMenu() && interaction.customId === 'bar_pedir') {
    const nombre = interaction.values[0];
    const item   = MENU_BAR.find(i => i.nombre === nombre);
    const char   = require('../db/characterStore.js').getCharacter(interaction.user.id);
    if (!item || !char) { await interaction.reply({ content: '❌ Error.', ephemeral: true }); return true; }

    const { totalEnPC, pagar, formatearMonedero } = require('../data/startingWealth.js');
    const money = char.money || { PC:0,PP:0,PE:0,PO:0,PT:0 };
    if (totalEnPC(money) < item.precio * 100) {
      await interaction.reply({ content: `❌ No tienes suficiente dinero. Necesitas **${item.precio} PO**.`, ephemeral: true });
      return true;
    }

    const nuevoMonedero = pagar(money, item.precio);
    require('../db/characterStore.js').updateCharacter(interaction.user.id, { money: nuevoMonedero });

    // Aplicar stats temporales
    if (item.stat === 'ALL') {
      ['STR','DEX','CON','INT','WIS','CHA'].forEach(s => aplicarStatTemp(interaction.user.id, s, item.bonus, item.duracion));
    } else if (item.stat === 'BRUTE') {
      aplicarStatTemp(interaction.user.id, 'STR', 4, item.duracion);
      aplicarStatTemp(interaction.user.id, 'INT', -2, item.duracion);
    } else if (item.stat === 'PIRATE') {
      aplicarStatTemp(interaction.user.id, 'CHA', 3, item.duracion);
      aplicarStatTemp(interaction.user.id, 'WIS', -2, item.duracion);
    } else if (item.stat !== 'INIT' && item.stat !== 'PERC') {
      aplicarStatTemp(interaction.user.id, item.stat, item.bonus, item.duracion);
    }

    const statsActivas = getStatsTemp(interaction.user.id);
    const statsStr = statsActivas.length
      ? statsActivas.map(s => `${s.stat} ${s.bonus>=0?'+':''}${s.bonus}`).join(', ')
      : '(ninguna)';

    await interaction.update({
      embeds: [new EmbedBuilder()
        .setTitle('🍺 ' + item.nombre)
        .setColor(0x8B4513)
        .setDescription(
          item.efecto + '\n\n' +
          `Pagaste **${item.precio} PO**. Saldo: ${formatearMonedero(nuevoMonedero)}\n\n` +
          `⏱️ *El efecto dura 3 horas.*\n` +
          `Stats temporales activas: **${statsStr}**`
        )],
      components: [],
    });
    return true;
  }
  return false;
}



// ─── STATS TEMPORALES (del bar) ───────────────────────────────────────────────
const STATS_TEMP = new Map();

function aplicarStatTemp(userId, stat, bonus, durMinutos) {
  if (!STATS_TEMP.has(userId)) STATS_TEMP.set(userId, []);
  const expira = Date.now() + durMinutos * 60000;
  const arr = STATS_TEMP.get(userId);
  arr.push({ stat, bonus, expira });
  STATS_TEMP.set(userId, arr.filter(s => Date.now() < s.expira));
}

function getStatsTemp(userId) {
  return (STATS_TEMP.get(userId) || []).filter(s => Date.now() < s.expira);
}

function getStatTempBonus(userId, stat) {
  return getStatsTemp(userId)
    .filter(s => s.stat === stat || s.stat === 'ALL')
    .reduce((sum, s) => sum + s.bonus, 0);
}

// ─── /mi-dinero ───────────────────────────────────────────────────────────────
async function cmdMiDinero(interaction) {
  const char = require('../db/characterStore.js').getCharacter(interaction.user.id);
  if (!char) return interaction.reply({ content: '❌ Sin personaje.', ephemeral: true });

  const money = char.money || {};
  const { totalEnPC, formatearMonedero } = require('../data/startingWealth.js');

  const totalPC = totalEnPC(money);
  const enPO = (totalPC / 100).toFixed(2);
  const enPP = (totalPC / 10).toFixed(1);

  const lineas = [];
  if ((money.PT||0) > 0) lineas.push('🥇 **' + money.PT + ' PT** (Platino)');
  if ((money.PO||0) > 0) lineas.push('🪙 **' + money.PO + ' PO** (Oro)');
  if ((money.PE||0) > 0) lineas.push('🟡 **' + money.PE + ' PE** (Electrum)');
  if ((money.PP||0) > 0) lineas.push('⚪ **' + money.PP + ' PP** (Plata)');
  if ((money.PC||0) > 0) lineas.push('🟤 **' + money.PC + ' PC** (Cobre)');
  if (!lineas.length) lineas.push('*Sin dinero*');

  const embed = new EmbedBuilder()
    .setTitle('💰 Monedero de ' + char.name)
    .setColor(0xFFD700)
    .setDescription(lineas.join('\n'))
    .addFields(
      { name: '📊 Equivalente total', value: '≈ **' + enPO + ' PO**\n≈ **' + enPP + ' PP**\n≈ **' + totalPC + ' PC**', inline: true },
      { name: '📖 Conversión', value: '1 PT = 10 PO\n1 PO = 10 PP\n1 PP = 10 PC\n1 PE = 5 PC', inline: true },
    )
    .setFooter({ text: 'PT=Platino · PO=Oro · PE=Electrum · PP=Plata · PC=Cobre' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = {
  cmdDmAbrirTienda, cmdDmCerrarTienda,
  cmdDmAbrirBar, cmdDmCerrarBar,
  cmdDmPrecioTienda,
  cmdTienda, cmdBar,
  cmdMiDinero,
  handleShopInteraction,
  aplicarStatTemp, getStatsTemp, getStatTempBonus,
  MENU_BAR,
};
