// ── handlers/dmPanel.js ───────────────────────────────────────────────────────
const { EmbedBuilder } = require('discord.js');

// Helper: responde correctamente si la interacción ya fue deferrida
async function responder(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload);
  }
  return interaction.reply(payload);
}
const { isDM } = require('../utils/isDM.js');
const { getCharacter, updateCharacter, getAllCharacters } = require('../utils/characterStore.js');
const { formatearMonedero, monederoVacio, totalEnPC, pagar } = require('../data/startingWealth.js');
const { calcHP } = require('../utils/helpers.js');
const { CLASSES } = require('../data/classes.js');

// ─── /dm-personajes ───────────────────────────────────────────────────────────
async function cmdDmPersonajes(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const todos = getAllCharacters();
  if (!todos.length)
    return interaction.reply({ content:'❌ No hay personajes registrados.', ephemeral:true });

  const lista = todos.map((c,i) =>
    `**${i+1}.** ${c.name} — ${c.class} nv.${c.level||1} | HP: ${c.hpActual||c.hpMax||'?'}/${c.hpMax||'?'}`
  ).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('📋 Personajes registrados')
    .setColor(0x2E8B57)
    .setDescription(lista.slice(0,4000));

  await interaction.reply({ embeds:[embed], ephemeral:true });
}

// ─── /dm-ficha ────────────────────────────────────────────────────────────────
async function cmdDmFicha(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const target = interaction.options.getUser('usuario');
  const char   = getCharacter(target.id);
  if (!char) return interaction.reply({ content:`❌ ${target.displayName} no tiene personaje.`, ephemeral:true });

  const stats = char.finalStats || {};
  function sm(v) { const m=Math.floor((v-10)/2); return (m>=0?'+':'')+m; }
  const inv = (char.inventory||[]).map(i=>`• ${i.nombre} ×${i.cantidad}`).join('\n') || '—';

  const embed = new EmbedBuilder()
    .setTitle(`📋 Ficha de ${char.name}`)
    .setColor(0x4169E1)
    .addFields(
      { name:'Clase', value:`${char.class} nv.${char.level||1}`, inline:true },
      { name:'Raza', value:char.race||'—', inline:true },
      { name:'Trasfondo', value:char.background||'—', inline:true },
      { name:'HP', value:`${char.hpActual||char.hpMax||'?'}/${char.hpMax||'?'}`, inline:true },
      { name:'CA', value:String(10+Math.floor(((stats.DEX||10)-10)/2)), inline:true },
      { name:'Prof.', value:`+${Math.ceil((char.level||1)/4)+1}`, inline:true },
      { name:'FUE', value:`${stats.STR||10} (${sm(stats.STR||10)})`, inline:true },
      { name:'DES', value:`${stats.DEX||10} (${sm(stats.DEX||10)})`, inline:true },
      { name:'CON', value:`${stats.CON||10} (${sm(stats.CON||10)})`, inline:true },
      { name:'INT', value:`${stats.INT||10} (${sm(stats.INT||10)})`, inline:true },
      { name:'SAB', value:`${stats.WIS||10} (${sm(stats.WIS||10)})`, inline:true },
      { name:'CAR', value:`${stats.CHA||10} (${sm(stats.CHA||10)})`, inline:true },
      { name:'💰 Monedero', value:formatearMonedero(char.money||{}), inline:false },
      { name:`📦 Inventario (${(char.inventory||[]).length})`, value:inv.slice(0,500), inline:false },
    );

  await interaction.reply({ embeds:[embed], ephemeral:true });
}

// ─── /dm-subirnivel ───────────────────────────────────────────────────────────
async function cmdDmSubirNivel(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const target  = interaction.options.getUser('usuario');
  const niveles = interaction.options.getInteger('niveles') || 1;
  const char    = getCharacter(target.id);
  if (!char) return interaction.reply({ content:`❌ ${target.displayName} sin personaje.`, ephemeral:true });

  const nivelAntes = char.level || 1;
  const nivelNuevo = Math.min(20, nivelAntes + niveles);
  const profBonus = Math.ceil(nivelNuevo/4)+1;
  const tieneASI  = [4,8,12,16,19].includes(nivelNuevo) ||
    (char.class === 'Guerrero' && [6,10,14].includes(nivelNuevo)) ||
    (char.class === 'Pícaro'   && [10].includes(nivelNuevo));

  // Guardar nivel nuevo pero SIN actualizar HP todavía — el jugador tirará el dado
  const charActualizado = {
    ...char,
    level:          nivelNuevo,
    pendingLevelUp: true,              // señal para que el jugador use /subir-nivel
    pendingASI:     tieneASI,
    profBonus:      profBonus,
  };

  const { saveCharacter } = require('../utils/characterStore.js');
  saveCharacter(target.id, charActualizado, interaction.guildId);

  // Notificar logros y subclase
  try {
    const { checkLevelUp } = require('./achievementsPanel.js');
    await checkLevelUp(interaction.client, target.id, charActualizado, interaction.guildId).catch(()=>{});
  } catch {}

  // Notificar al jugador por DM privado
  try {
    const user = await interaction.client.users.fetch(target.id);
    const dmEmbed = new EmbedBuilder()
      .setTitle('⬆️ ¡El DM te ha subido de nivel!')
      .setColor(0xFFD700)
      .setDescription(
        `**${char.name}** sube del nivel **${nivelAntes}** al **${nivelNuevo}**.

` +
        `Usa \`/subir-nivel\` en el servidor para tirar tu **d${cls.hitDie||6}** de golpe y añadir los HP.
` +
        (tieneASI ? `
⬆️ También tienes una **Mejora de Puntuación (ASI)** disponible.
` : '') +
        `
🎯 Nuevo bono de competencia: **+${profBonus}**`
      );
    await user.send({ embeds: [dmEmbed] });
  } catch {}

  const embed = new EmbedBuilder()
    .setTitle('⬆️ Nivel otorgado')
    .setColor(0xFFD700)
    .setDescription(
      `**${char.name}** ha recibido el nivel ${nivelAntes} → **${nivelNuevo}**.
` +
      `El jugador debe usar \`/subir-nivel\` para tirar su dado de golpe (d${cls.hitDie||6}) y añadir los HP.` +
      (tieneASI ? `
⬆️ Tiene ASI pendiente.` : '')
    );

  await responder(interaction, { embeds:[embed] });
}

// ─── /dm-ajustar ─────────────────────────────────────────────────────────────
async function cmdDmAjustar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const target = interaction.options.getUser('usuario');
  const stat   = interaction.options.getString('stat');
  const valor  = interaction.options.getInteger('valor');
  const char   = getCharacter(target.id);
  if (!char) return interaction.reply({ content:`❌ Sin personaje.`, ephemeral:true });

  const stats = { ...(char.finalStats||{}) };
  stats[stat] = valor;
  const { saveCharacter } = require('../utils/characterStore.js');
  saveCharacter(target.id, { ...char, finalStats:stats, stats }, interaction.guildId);

  await interaction.reply({ content:`✅ **${char.name}** — ${stat} ajustado a **${valor}**.`, ephemeral:true });
}

// ─── /dm-dano ─────────────────────────────────────────────────────────────────
async function cmdDmDano(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const target  = interaction.options.getUser('usuario');
  const cantidad = interaction.options.getInteger('cantidad');
  const char    = getCharacter(target.id);
  if (!char) return interaction.reply({ content:`❌ Sin personaje.`, ephemeral:true });

  const hpMax    = char.hpMax || 10;
  const hpAntes  = char.hpActual ?? hpMax;
  const hpNuevo  = Math.max(0, hpAntes - cantidad);
  updateCharacter(target.id, { hpActual:hpNuevo });

  const embed = new EmbedBuilder()
    .setTitle('💢 Daño aplicado')
    .setColor(0xFF0000)
    .setDescription(`**${char.name}** recibe **${cantidad}** puntos de daño.\nHP: ${hpAntes} → **${hpNuevo}**/${hpMax}${hpNuevo===0?' *(caído)*':''}`);

  await responder(interaction, { embeds:[embed] });
}

// ─── /dm-curar (DM) ──────────────────────────────────────────────────────────
async function cmdDmCurar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const target  = interaction.options.getUser('usuario');
  const cantidad = interaction.options.getInteger('cantidad');
  const char    = getCharacter(target.id);
  if (!char) return interaction.reply({ content:`❌ Sin personaje.`, ephemeral:true });

  const hpMax    = char.hpMax || 10;
  const hpAntes  = char.hpActual ?? hpMax;
  const hpNuevo  = Math.min(hpMax, hpAntes + cantidad);
  updateCharacter(target.id, { hpActual:hpNuevo });

  const embed = new EmbedBuilder()
    .setTitle('💚 Curación aplicada')
    .setColor(0x00CC00)
    .setDescription(`**${char.name}** recupera **${cantidad}** HP.\nHP: ${hpAntes} → **${hpNuevo}**/${hpMax}`);

  await responder(interaction, { embeds:[embed] });
}

// ─── /dm-recompensar ─────────────────────────────────────────────────────────
async function cmdDmRecompensar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const target = interaction.options.getUser('usuario');
  const tipo   = interaction.options.getString('tipo'); // dinero | objeto | ticket | ticket-dorado
  const char   = getCharacter(target.id);
  if (!char) return interaction.reply({ content:`❌ Sin personaje.`, ephemeral:true });

  if (tipo === 'dinero') {
    const cantidad = interaction.options.getInteger('cantidad') || 10;
    const moneda   = interaction.options.getString('moneda') || 'PO';
    const money    = { ...(char.money||monederoVacio()) };
    money[moneda]  = (money[moneda]||0) + cantidad;
    updateCharacter(target.id, { money });
    await interaction.reply({ content:`✅ **${char.name}** recibe **${cantidad} ${moneda}**.` });

  } else if (tipo === 'objeto') {
    const nombre = interaction.options.getString('objeto') || 'Objeto misterioso';
    const inv    = [...(char.inventory||[])];
    inv.push({ nombre, cantidad:1, peso:0, precio:0, categoria:'Recompensa DM' });
    updateCharacter(target.id, { inventory:inv });
    await interaction.reply({ content:`✅ **${char.name}** recibe **${nombre}**.` });

  } else if (tipo === 'ticket' || tipo === 'ticket-dorado') {
    const esDorado = tipo === 'ticket-dorado';
    const nomTicket = esDorado ? 'Ticket Dorado 🌟' : 'Ticket de Arma Única';
    const inv = [...(char.inventory||[])];
    inv.push({ nombre:nomTicket, cantidad:1, peso:0, precio:0, categoria:'Ticket', esTicket:true, esDorado });
    updateCharacter(target.id, { inventory:inv });
    await interaction.reply({ content:`✅ **${char.name}** recibe un **${nomTicket}**. Canjearlo con \`/canjear-ticket\`.` });

  } else {
    await interaction.reply({ content:'❌ Tipo de recompensa no reconocido.', ephemeral:true });
  }
}

// ─── /dm-inventario ──────────────────────────────────────────────────────────
async function cmdDmInventario(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const target = interaction.options.getUser('usuario');
  const char   = target ? getCharacter(target.id) : null;

  if (target && !char)
    return interaction.reply({ content:`❌ **${target.displayName}** no tiene personaje.`, ephemeral:true });

  if (!target) {
    const todos = getAllCharacters();
    if (!todos.length) return interaction.reply({ content:'❌ Sin personajes.', ephemeral:true });
    const embeds = todos.slice(0,10).map(ch => {
      const inv = ch.inventory || [];
      const invStr = inv.length ? inv.map(i=>'• '+i.nombre+' ×'+i.cantidad).join('\n').slice(0,900) : '*Vacío*';
      const monStr = Object.entries(ch.money||{}).filter(([,v])=>v>0).map(([k,v])=>v+' '+k).join(' · ') || '*Sin dinero*';
      return new EmbedBuilder()
        .setTitle(`🎒 ${ch.name} (${ch.class} nv.${ch.level||1})`)
        .setColor(0x20B2AA)
        .addFields({ name:'💰 Monedero', value:monStr, inline:true }, { name:'📦 Inventario', value:invStr, inline:false });
    });
    return interaction.reply({ embeds, ephemeral:true });
  }

  const inv    = char.inventory || [];
  const invStr = inv.length ? inv.map(i=>'• '+i.nombre+' ×'+i.cantidad+(i.daño?' | '+i.daño:'')).join('\n').slice(0,1000) : '*Vacío*';
  const monStr = Object.entries(char.money||{}).filter(([,v])=>v>0).map(([k,v])=>v+' '+k).join(' · ') || '*Sin dinero*';

  const embed = new EmbedBuilder()
    .setTitle(`🎒 Inventario de ${char.name}`)
    .setColor(0x20B2AA)
    .setDescription(`${char.class} nv.${char.level||1} — <@${target.id}>`)
    .addFields({ name:'💰 Monedero', value:monStr, inline:true }, { name:`📦 Inventario (${inv.length})`, value:invStr, inline:false });

  await interaction.reply({ embeds:[embed], ephemeral:true });
}

// ─── /inicio ─────────────────────────────────────────────────────────────────
async function cmdInicio(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Bienvenido al servidor D&D 5e')
    .setColor(0x8B0000)
    .setDescription(char
      ? `¡Hola **${char.name}**! Ya tienes tu personaje listo.`
      : '¡Bienvenido! Aún no tienes personaje. Sigue estos pasos:'
    )
    .addFields(
      char ? [] : [
        { name:'1️⃣ Crear personaje', value:'`/crear-personaje` — El bot tira los dados\n`/crear-personaje-fisico` — Introduce tus stats manualmente', inline:false },
        { name:'2️⃣ Equipo inicial', value:'`/equipo-inicial` — Elige equipo de clase, dinero o vale', inline:false },
      ],
      { name: char ? '⚔️ Tu personaje' : '3️⃣ A jugar', value:
        char
          ? `**${char.name}** — ${char.class} nv.${char.level||1}\n\`/mi-personaje\` para ver tu ficha`
          : '`/mi-personaje` · `/inventario` · `/duelo` · `/entrenar` · `/alquimista`',
        inline:false },
    );

  await interaction.reply({ embeds:[embed], ephemeral:true });
}

// ─── /curar (jugadores con clase curadora) ────────────────────────────────────
const CLASES_CURADORAS_P = ['Clérigo','Druida','Paladín','Bardo'];

async function cmdCurar(interaction) {
  const uid  = interaction.user.id;
  const char = getCharacter(uid);
  if (!char) return interaction.reply({ content:'❌ Sin personaje.', ephemeral:true });
  if (!CLASES_CURADORAS_P.includes(char.class))
    return interaction.reply({ content:`❌ Solo pueden curar: ${CLASES_CURADORAS_P.join(', ')}.`, ephemeral:true });

  const target   = interaction.options.getUser('usuario');
  const charObj  = target ? getCharacter(target.id) : char;
  if (!charObj) return interaction.reply({ content:'❌ El objetivo no tiene personaje.', ephemeral:true });

  const modSAB    = Math.floor(((char.finalStats?.WIS??10)-10)/2);
  const dado      = Math.floor(Math.random()*8)+1;
  const cura      = Math.max(1, dado+modSAB);
  const hpMax     = charObj.hpMax||10;
  const hpAntes   = charObj.hpActual??hpMax;
  const hpDespues = Math.min(hpMax, hpAntes+cura);
  updateCharacter(target?.id||uid, { hpActual:hpDespues });

  const embed = new EmbedBuilder()
    .setTitle('💚 Curación')
    .setColor(0x2ECC71)
    .setDescription(
      `**${char.name}** cura a **${charObj.name}**.\n\n` +
      `🎲 1d8(${dado}) ${modSAB>=0?'+':''}${modSAB} = **${cura} HP**\n` +
      `HP: ${hpAntes} → **${hpDespues}** / ${hpMax}`
    );

  await interaction.reply({ embeds:[embed] });
}

module.exports = {
  isDM,
  cmdDmPersonajes, cmdDmFicha, cmdDmSubirNivel, cmdDmAjustar,
  cmdDmDano, cmdDmCurar, cmdDmRecompensar,
  cmdDmInventario, cmdInicio, cmdCurar,
};
