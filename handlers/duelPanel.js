// ── handlers/duelPanel.js ─────────────────────────────────────────────────────
// Sistema de duelos — fuera de sesión, sin recompensas del bot (solo apuestas)
//
//  /duelo @usuario [apuesta_tipo] [apuesta_valor]  → retar a un duelo 1v1
//  /duelo-2v2 @aliado @rival1 @rival2              → duelo en equipo
//  /apostar @duelista cantidad                     → espectador apuesta
//
// Flujo:
//  1. Retador usa /duelo → embed con botones Aceptar/Rechazar para el retado
//  2. Retado acepta → se notifica al rol Jugadores, abre ventana de 2 min para apuestas
//  3. Al cerrar apuestas → combate turno a turno, cada duelista elige acción
//  4. Al terminar → se resuelven las apuestas, se aplican consecuencias
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');
const { getCharacter, updateCharacter } = require('../utils/characterStore.js');
const { ARMAS } = require('../data/equipment.js');

// Munición y gasto
// Arcos usan FLECHAS, ballestas usan VIROTES — separados y no intercambiables
const MUNICION_DUELO = {
  'Arco Corto':       ['Flechas','Flecha'],
  'Arco Largo':       ['Flechas','Flecha'],
  'Ballesta Ligera':  ['Virotes de ballesta','Virote','Virotes'],
  'Ballesta de Mano': ['Virotes de ballesta','Virote','Virotes'],
  'Ballesta Pesada':  ['Virotes de ballesta','Virote','Virotes'],
  'Honda':            ['Balas de honda','Bala de honda','Piedra'],
  'Cerbatana':        ['Agujas de cerbatana','Aguja'],
};

const ARMAS_ARROJADIZAS_DUELO = new Set([
  'Jabalina','Lanza','Hacha de Mano','Daga','Tridente','Martillo Ligero','Dardo',
]);

function getArmaData(nombreArma) {
  return ARMAS[nombreArma] ||
    Object.entries(ARMAS).find(([k]) => k.toLowerCase() === nombreArma.toLowerCase())?.[1] ||
    Object.entries(ARMAS).find(([k]) => nombreArma.toLowerCase().includes(k.toLowerCase()))?.[1];
}

function gastarMunicionDuelo(uid, nombreArma) {
  const needs = MUNICION_DUELO[nombreArma];
  if (!needs) return true;
  const char = getCharacter(uid);
  if (!char) return false;
  const inv = [...(char.inventory||[])];
  for (const n of needs) {
    const idx = inv.findIndex(i => (i.nombre||'').toLowerCase().includes(n.toLowerCase()));
    if (idx !== -1 && (inv[idx].cantidad||1) > 0) {
      inv[idx] = { ...inv[idx], cantidad: (inv[idx].cantidad||1) - 1 };
      if (inv[idx].cantidad <= 0) inv.splice(idx, 1);
      updateCharacter(uid, { inventory: inv });
      return true;
    }
  }
  return false; // sin munición
}

function tieneMunicionDuelo(uid, nombreArma) {
  const needs = MUNICION_DUELO[nombreArma];
  if (!needs) return true;
  const char = getCharacter(uid);
  const inv  = char?.inventory || [];
  return needs.some(n => inv.find(i => (i.nombre||'').toLowerCase().includes(n.toLowerCase()) && (i.cantidad||1) > 0));
}
const { formatearMonedero, totalEnPC, pagar } = require('../data/startingWealth.js');
const { calcHP } = require('../utils/helpers.js');
const { CLASSES } = require('../data/classes.js');

// Estado de duelos activos: { [guildId]: DuelState }
const DUELOS = new Map();
// Acciones pendientes de modal: { [userId]: { guildId, tipo, arma, hechizo, objetivoUid } }
const PENDIENTE_MODAL = new Map();

function esArmaDistancia(arma) {
  const texto = ((arma.nombre||'') + ' ' + (arma.propiedades||'')).toLowerCase();
  return ['arco','ballesta','honda','dardo','jabalina','distancia','ranged','rifle','cerbatana','pistola'].some(k => texto.includes(k));
}

function smod(v) { const m = Math.floor((v-10)/2); return (m>=0?'+':'')+m; }
function d(n)    { return Math.floor(Math.random()*n)+1; }

function parseDaño(str) {
  const m = (str||'1d4').match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!m) return { dados:1, lados:4, bonus:0 };
  return { dados:parseInt(m[1]), lados:parseInt(m[2]), bonus:parseInt(m[3]||'0') };
}
function tirarDaño(p, modStat=0) {
  const tiradas = Array.from({length:p.dados}, () => d(p.lados));
  const total   = tiradas.reduce((a,b)=>a+b,0) + p.bonus + modStat;
  return { total:Math.max(1,total), tiradas };
}

// Hechizos de combate por clase — {nombre, daño, tipo, usosMax}
const HECHIZOS_CLASE = {
  Mago:        [{ nombre:'Rayo de Escarcha',  daño:'1d8',  tipo:'frío',       cd: true },
                { nombre:'Proyectil Mágico',  daño:'3d4+3',tipo:'fuerza',     cd: false },
                { nombre:'Bola de Fuego',      daño:'8d6',  tipo:'fuego',      cd: true, area: true, usos: 1 }],
  Hechicero:   [{ nombre:'Rayo de Fuego',     daño:'2d10', tipo:'fuego',      cd: false },
                { nombre:'Proyectil Mágico',  daño:'3d4+3',tipo:'fuerza',     cd: false },
                { nombre:'Bola de Fuego',      daño:'8d6',  tipo:'fuego',      cd: true, area: true, usos: 1 }],
  Brujo:       [{ nombre:'Tiro de Eldritch',  daño:'2d10', tipo:'fuerza',     cd: false },
                { nombre:'Hambre del Vacío',  daño:'2d6',  tipo:'psíquico',   cd: true }],
  Bardo:       [{ nombre:'Palabra Hiriente',  daño:'3d6',  tipo:'psíquico',   cd: true },
                { nombre:'Trueno',            daño:'2d8',  tipo:'trueno',     cd: true }],
  Clérigo:     [{ nombre:'Palabra Flamígera', daño:'3d6',  tipo:'radiante',   cd: true },
                { nombre:'Fulminar',          daño:'4d8',  tipo:'relámpago',  cd: true, usos: 1 }],
  Druida:      [{ nombre:'Bola de Fuego Natu',daño:'3d6',  tipo:'fuego',      cd: true },
                { nombre:'Llamar Relámpago',  daño:'3d10', tipo:'relámpago',  cd: true, usos: 2 }],
  Paladín:     [{ nombre:'Golpe Divino',      daño:'2d8',  tipo:'radiante',   cd: false, bonus: true }],
  Explorador:  [{ nombre:'Golpe Cazador',     daño:'1d8',  tipo:'perforante', cd: false, bonus: true }],
  Artificiero: [{ nombre:'Rayo de Fuego',     daño:'2d10', tipo:'fuego',      cd: false },
                { nombre:'Rayo de Trueno',    daño:'3d8',  tipo:'trueno',     cd: true }],
};

function getHechizosClase(clase, nivel) {
  const lista = HECHIZOS_CLASE[clase] || [];
  // Filtrar por nivel mínimo aproximado
  return lista.filter(h => !(h.usos !== undefined && nivel < 5));
}

// Crear estado de combatiente a partir de personaje
function crearCombatiente(uid, char) {
  const stats  = char.finalStats || {};
  const cls    = CLASSES[char.class] || {};
  const nivel  = char.level || 1;
  const hpMax  = char.hpMax || (cls.hitDie ? calcHP(cls, stats.CON??10, nivel) : 10);
  const prof   = Math.ceil(nivel/4)+1;

  // Arma del inventario: buscar la mejor arma disponible
  const inv = char.inventory || [];
  // Función para obtener el daño de un ítem buscando también en ARMAS
  const getDano = (item) => {
    const directo = item.dano || item['daño'] || item.damage;
    if (directo) return directo.split(' ')[0];
    const nom = item.nombre || '';
    const datosArma = ARMAS[nom] ||
      Object.entries(ARMAS).find(([k]) => k.toLowerCase() === nom.toLowerCase())?.[1] ||
      Object.entries(ARMAS).find(([k]) => nom.toLowerCase().includes(k.toLowerCase()))?.[1];
    const danoEquip = datosArma ? (datosArma['daño'] || datosArma.dano || '') : '';
    return danoEquip ? danoEquip.split(' ')[0] : null;
  };

  // Detectar si es arma (tiene daño o nombre sugiere arma)
  const esArmaItem = (item) => {
    const dano = getDano(item);
    if (dano) return true;
    const nom = item.nombre || '';
    const tipo = (ARMAS[nom] || Object.entries(ARMAS).find(([k]) => k.toLowerCase() === nom.toLowerCase())?.[1])?.tipo || '';
    return tipo.includes('CaC') || tipo.includes('Dist') ||
      item.categoria === 'Arma' || item.categoria === 'Arma Única' || item.categoria === 'Arma Dorada' ||
      /espada|hacha|arco|ballesta|lanza|daga|maza|estoque|jabalina|honda|cimitarra|tridente/i.test(nom);
  };

  const armaInv = inv.find(i => esArmaItem(i) && !i.esVale);
  const danoArma = armaInv ? getDano(armaInv) : null;
  const arma = armaInv
    ? { nombre: armaInv.nombre, daño: danoArma || '1d6', propiedades: armaInv.propiedades || '' }
    : { nombre: 'Ataque desarmado', daño: '1d4', propiedades: '' };

  const modStrBase = Math.floor(((stats.STR??10)-10)/2);
  const modDexBase = Math.floor(((stats.DEX??10)-10)/2);
  const esDistArma = esArmaDistancia(arma);

  // Stats temporales del bar
  let modStrFinal = modStrBase, modDexFinal = modDexBase;
  try {
    const { getStatTempBonus } = require('./shopPanel.js');
    modStrFinal += Math.floor(getStatTempBonus(uid,'STR')/2);
    modDexFinal += Math.floor(getStatTempBonus(uid,'DEX')/2);
  } catch {}

  // Bonus mágico del arma (+1, +2, etc.) — va al ataque y daño, NO a la CA
  const bonusArmaM = (() => { const m=(arma.nombre||'').match(/\+(\d+)/); return m?parseInt(m[1]):0; })();

  const modAtk = (esDistArma ? modDexFinal : modStrFinal) + bonusArmaM;
  const modStr = modStrFinal, modDex = modDexFinal;

  // Stat de lanzamiento por clase
  const CAST_STAT = {
    Mago:'INT', Hechicero:'CAR', Brujo:'CAR', Bardo:'CAR',
    Clérigo:'SAB', Druida:'SAB', Paladín:'CAR', Explorador:'SAB', Artificiero:'INT',
  };
  const castStatKey = CAST_STAT[char.class];
  const castStatMap = { INT: stats.INT??10, SAB: stats.WIS??10, CAR: stats.CHA??10 };
  const modCast     = castStatKey ? Math.floor((castStatMap[castStatKey]??10)-10)/2 : 0;
  const cdHechizo   = 8 + prof + modCast;

  // Hechizos disponibles con usos restantes
  const hechizosBase = getHechizosClase(char.class, nivel);
  const hechizos     = hechizosBase.map(h => ({
    ...h,
    usosRestantes: h.usos ?? 999,
    modCast, cdHechizo,
  }));

  return {
    uid, nombre: char.name, clase: char.class, nivel,
    hp: hpMax, hpMax,
    ca: 10 + modDex,
    str: stats.STR??10, dex: stats.DEX??10, con: stats.CON??10,
    prof, modAtk, modCast, cdHechizo,
    arma,
    bonoAtaque: prof + modAtk,
    parsedDaño: parseDaño(arma.daño || arma.dano || '1d4'),
    hechizos,
    defensa: false,
  };
}

// ─── /duelo ──────────────────────────────────────────────────────────────────
async function cmdDuelo(interaction) {
  const rival    = interaction.options.getUser('usuario');
  const apTipo   = interaction.options.getString('apuesta_tipo')   || 'ninguna';
  const apValor  = interaction.options.getString('apuesta_valor')  || '';
  const uid      = interaction.user.id;

  if (rival.id === uid)
    return interaction.reply({ content: '❌ No puedes retarte a ti mismo.', ephemeral: true });

  const guildId = interaction.guildId;
  if (DUELOS.has(guildId))
    return interaction.reply({ content: '❌ Ya hay un duelo activo en este servidor.', ephemeral: true });

  const charRetador = getCharacter(uid);
  const charRival   = getCharacter(rival.id);
  if (!charRetador) return interaction.reply({ content: '❌ No tienes personaje.', ephemeral: true });
  if (!charRival)   return interaction.reply({ content: `❌ **${rival.displayName}** no tiene personaje.`, ephemeral: true });

  // Validar apuesta del retador
  const errorApuesta = validarApuesta(charRetador, apTipo, apValor, uid);
  if (errorApuesta) return interaction.reply({ content: errorApuesta, ephemeral: true });

  // Guardar reto pendiente
  DUELOS.set(guildId, {
    fase: 'reto',
    retadorId: uid, rivalId: rival.id,
    apTipo, apValor,
    apRivalTipo: null, apRivalValor: null,
    combatientes: null,
    apuestasEspectadores: {},   // { uid: { por: uid, cantidad } }
    channelId: interaction.channelId,
    timer: null,
  });

  const embed = new EmbedBuilder()
    .setTitle('⚔️ ¡Desafío de duelo!')
    .setColor(0xCC2200)
    .setDescription(
      `**${charRetador.name}** (${charRetador.class} nv.${charRetador.nivel||1}) reta a **${charRival.name}** a un duelo.\n\n` +
      `**Apuesta del retador:** ${formatApuesta(apTipo, apValor)}\n\n` +
      `<@${rival.id}>, ¿aceptas el desafío? Si aceptas, también debes indicar tu apuesta.`
    )
    .setFooter({ text: 'Los duelos son fuera de sesión — sin recompensas del bot salvo las apuestas.' });

  // Botones para el retado
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`duelo_aceptar_${uid}_${rival.id}`).setLabel('✅ Aceptar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`duelo_rechazar_${uid}`).setLabel('❌ Rechazar').setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({ content: `<@${rival.id}>`, embeds: [embed], components: [row] });
}

// ─── /duelo-2v2 ──────────────────────────────────────────────────────────────
async function cmdDuelo2v2(interaction) {
  const aliado = interaction.options.getUser('aliado');
  const rival1 = interaction.options.getUser('rival1');
  const rival2 = interaction.options.getUser('rival2');
  const uid    = interaction.user.id;
  const guildId = interaction.guildId;

  if (DUELOS.has(guildId))
    return interaction.reply({ content: '❌ Ya hay un duelo activo.', ephemeral: true });

  const uids = [uid, aliado.id, rival1.id, rival2.id];
  if (new Set(uids).size !== 4)
    return interaction.reply({ content: '❌ Los cuatro participantes deben ser distintos.', ephemeral: true });

  const chars = uids.map(id => getCharacter(id));
  if (chars.some(c => !c))
    return interaction.reply({ content: '❌ Algún participante no tiene personaje.', ephemeral: true });

  DUELOS.set(guildId, {
    fase: 'reto_2v2',
    equipo1: [uid, aliado.id],
    equipo2: [rival1.id, rival2.id],
    pendientesAcepcion: new Set([aliado.id, rival1.id, rival2.id]),
    apuestasEspectadores: {},
    channelId: interaction.channelId,
    timer: null,
    combatientes: null,
  });

  const embed = new EmbedBuilder()
    .setTitle('⚔️ ¡Desafío de duelo 2v2!')
    .setColor(0xCC2200)
    .setDescription(
      `**Equipo 1:** <@${uid}> + <@${aliado.id}>\n` +
      `**Equipo 2:** <@${rival1.id}> + <@${rival2.id}>\n\n` +
      `Los tres restantes deben aceptar para iniciar el duelo.`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`duelo2v2_aceptar_${uid}`).setLabel('✅ Acepto el duelo').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`duelo2v2_rechazar_${uid}`).setLabel('❌ Rechazo').setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({ content: `<@${aliado.id}> <@${rival1.id}> <@${rival2.id}>`, embeds: [embed], components: [row] });
}

// ─── /apostar ────────────────────────────────────────────────────────────────
async function cmdApostar(interaction) {
  const guildId = interaction.guildId;
  const duelo   = DUELOS.get(guildId);

  if (!duelo || duelo.fase !== 'apuestas')
    return interaction.reply({ content: '❌ No hay duelo en fase de apuestas ahora mismo.', ephemeral: true });

  const uid      = interaction.user.id;
  const porUser  = interaction.options.getUser('duelista');
  const cantidad = interaction.options.getInteger('cantidad');
  const char     = getCharacter(uid);

  if (!char) return interaction.reply({ content: '❌ No tienes personaje.', ephemeral: true });

  // No pueden apostar los duelistas
  const duelistasIds = duelo.combatientes?.map(c => c.uid) || [];
  if (duelistasIds.includes(uid))
    return interaction.reply({ content: '❌ Los duelistas no pueden apostar como espectadores.', ephemeral: true });

  if (!duelistasIds.includes(porUser.id))
    return interaction.reply({ content: '❌ Esa persona no está en el duelo.', ephemeral: true });

  const money = char.money || {PC:0,PP:0,PE:0,PO:0,PT:0};
  if (totalEnPC(money) < cantidad*100)
    return interaction.reply({ content: `❌ Fondos insuficientes. Tienes: **${formatearMonedero(money)}**.`, ephemeral: true });

  // Guardar apuesta (sobreescribe si ya apostó)
  duelo.apuestasEspectadores[uid] = { por: porUser.id, cantidad };

  await interaction.reply({
    content: `✅ Apuesta registrada: **${cantidad} PO** por **${getCharacter(porUser.id)?.name || porUser.displayName}**.`,
    ephemeral: true,
  });
}

// ─── Iniciar duelo (después de aceptar) ───────────────────────────────────────
async function iniciarDuelo(client, guildId) {
  const duelo = DUELOS.get(guildId);
  if (!duelo) return;

  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    // Buscar canal #duelos
    let channel = guild.channels.cache.find(c =>
      c.name.toLowerCase() === 'duelos' && c.isTextBased()
    );
    if (!channel) {
      // Fallback: usar el canal donde se inició el duelo
      channel = client.channels.cache.get(duelo.channelId);
    }
    if (!channel) return;

    // Notificar al rol Jugadores
    let mencion = '';
    const rolJugadores = guild.roles.cache.find(r =>
      r.name.toLowerCase() === 'jugadores' || r.name.toLowerCase() === 'player'
    );
    if (rolJugadores) mencion = `<@&${rolJugadores.id}>`;

    // Crear combatientes
    let combatientes = [];
    if (duelo.equipo1) {
      // 2v2
      const todos = [...duelo.equipo1, ...duelo.equipo2];
      combatientes = todos.map(uid => crearCombatiente(uid, getCharacter(uid)));
    } else {
      combatientes = [
        crearCombatiente(duelo.retadorId, getCharacter(duelo.retadorId)),
        crearCombatiente(duelo.rivalId,   getCharacter(duelo.rivalId)),
      ];
    }

    duelo.combatientes  = combatientes;
    duelo.turnoActual   = 0;   // índice en combatientes
    duelo.ronda         = 1;
    duelo.log           = [];
    duelo.fase          = 'apuestas';

    const embed = new EmbedBuilder()
      .setTitle('⚔️ ¡DUELO INICIADO!')
      .setColor(0xCC2200)
      .setDescription(
        `${mencion} — ¡Hay un duelo en curso!\n\n` +
        combatientes.map(c => `**${c.nombre}** (${c.clase} nv.${c.nivel}) — ❤️ ${c.hpMax} HP · 🛡️ CA ${c.ca}`).join('\n') +
        `\n\n⏳ **Ventana de apuestas: 2 minutos**\nUsa \`/apostar @duelista cantidad\` para apostar por un combatiente.`
      );

    await channel.send({ content: mencion, embeds: [embed] });

    // Timer de 2 minutos para cerrar apuestas e iniciar combate
    duelo.timer = setTimeout(() => comenzarCombate(client, guildId), 2 * 60 * 1000);

  } catch(e) { console.error('iniciarDuelo error:', e); }
}

async function comenzarCombate(client, guildId) {
  const duelo = DUELOS.get(guildId);
  if (!duelo) return;
  duelo.fase = 'combate';
  clearTimeout(duelo.timer);

  try {
    const _guild = client.guilds.cache.get(guildId);
    let channel = _guild?.channels.cache.find(c => c.name.toLowerCase() === 'duelos' && c.isTextBased())
                  || client.channels.cache.get(duelo.channelId);
    if (!channel) return;

    // Tirar iniciativas
    duelo.combatientes.forEach(c => {
      c.iniciativa = d(20) + Math.floor((c.dex-10)/2);
    });
    duelo.combatientes.sort((a,b) => b.iniciativa - a.iniciativa);
    duelo.turnoActual = 0;

    const orden = duelo.combatientes.map((c,i) => `${i+1}. **${c.nombre}** — Iniciativa: **${c.iniciativa}**`).join('\n');
    await channel.send({ embeds: [new EmbedBuilder()
      .setTitle('🎲 Orden de iniciativa')
      .setColor(0xCC2200)
      .setDescription(`Las apuestas han cerrado.\n\n${orden}\n\nEl combate comienza.`)] });

    await mostrarTurnoCombate(client, guildId);
  } catch(e) { console.error('comenzarCombate error:', e); }
}

async function mostrarTurnoCombate(client, guildId) {
  const duelo = DUELOS.get(guildId);
  if (!duelo || duelo.fase !== 'combate') return;

  const _g = client.guilds.cache.get(guildId);
  let channel = _g?.channels.cache.find(c => c.name.toLowerCase() === 'duelos' && c.isTextBased())
                || client.channels.cache.get(duelo.channelId);
  if (!channel) return;

  const activo = duelo.combatientes[duelo.turnoActual];
  const vivos  = duelo.combatientes.filter(c => c.hp > 0);

  // Verificar fin de combate
  const equipo1Vivo = duelo.equipo1
    ? duelo.equipo1.some(uid => duelo.combatientes.find(c => c.uid===uid && c.hp>0))
    : duelo.combatientes[0]?.hp > 0;
  const equipoAllVivo = duelo.equipo1
    ? duelo.equipo2.some(uid => duelo.combatientes.find(c => c.uid===uid && c.hp>0))
    : duelo.combatientes[1]?.hp > 0;

  if (!equipoAllVivo || !equipoAllVivo || vivos.length <= (duelo.equipo1 ? 2 : 1)) {
    await terminarDuelo(client, guildId);
    return;
  }

  if (activo.hp <= 0) {
    // Saltar turno del caído
    duelo.turnoActual = (duelo.turnoActual + 1) % duelo.combatientes.length;
    if (duelo.turnoActual === 0) duelo.ronda++;
    await mostrarTurnoCombate(client, guildId);
    return;
  }

  const barra = (hp, max) => '█'.repeat(Math.round(Math.max(0,hp/max)*10)) + '░'.repeat(10-Math.round(Math.max(0,hp/max)*10));

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Ronda ${duelo.ronda} — Turno de ${activo.nombre}`)
    .setColor(0xCC2200)
    .setDescription(`<@${activo.uid}> elige tu acción:`)
    .addFields(
      ...duelo.combatientes.map(c => ({
        name: `${c.hp > 0 ? '❤️' : '💀'} ${c.nombre}`,
        value: '`' + barra(c.hp,c.hpMax) + '` ' + c.hp + '/' + c.hpMax + ' HP · CA ' + c.ca,
        inline: true,
      }))
    );

  if (duelo.log.length > 0)
    embed.addFields({ name: '📜 Último turno', value: duelo.log.slice(-4).join('\n').slice(0,1024), inline: false });

  // Preview de daño del arma
  const p    = activo.parsedDaño;
  const dmin = p.dados + p.bonus + activo.modAtk;
  const dmax = p.dados*p.lados + p.bonus + activo.modAtk;
  embed.addFields({ name: '🎲 Tu arma', value:
    activo.arma.nombre + ' | Ataque: 1d20 ' + (activo.bonoAtaque>=0?'+':'') + activo.bonoAtaque + ' | Daño: **' + dmin + '–' + dmax + '**',
    inline: false });

  // Hechizos disponibles
  const hechizosDisp = (activo.hechizos||[]).filter(h => h.usosRestantes > 0);
  if (hechizosDisp.length > 0) {
    const hStr = hechizosDisp.map(h => {
      const pd = parseDaño(h.daño);
      const dh_min = pd.dados + pd.bonus;
      const dh_max = pd.dados*pd.lados + pd.bonus;
      return h.nombre + ' (' + h.daño + ' ' + h.tipo + (h.cd ? ' CD' + activo.cdHechizo : '') + (h.usos ? ' · ' + h.usosRestantes + ' uso/s' : '') + ')';
    }).join('\n');
    embed.addFields({ name: '✨ Hechizos', value: hStr, inline: false });
  }

  const enemigos = duelo.combatientes.filter(c => c.hp > 0 && c.uid !== activo.uid);

  // ── Filas de botones ───────────────────────────────────────────────────────
  const rows = [];

  // Fila 1: botón por cada enemigo + Defender
  const fila1 = [];
  enemigos.slice(0,4).forEach(e => {
    fila1.push(new ButtonBuilder()
      .setCustomId('duelo_sel_objetivo_' + activo.uid + '_' + e.uid)
      .setLabel('⚔️ Atacar a ' + e.nombre + ' (' + e.hp + ' HP)')
      .setStyle(ButtonStyle.Danger));
  });
  fila1.push(new ButtonBuilder()
    .setCustomId('duelo_defender_' + activo.uid)
    .setLabel('🛡️ Defender (+2 CA)')
    .setStyle(ButtonStyle.Secondary));
  rows.push(new ActionRowBuilder().addComponents(...fila1.slice(0,5)));

  // Fila 2: hechizos como botones de selección
  if (hechizosDisp.length > 0) {
    const filaH = hechizosDisp.slice(0,4).map((h, i) =>
      new ButtonBuilder()
        .setCustomId('duelo_sel_hechizo_' + activo.uid + '_' + i)
        .setLabel('✨ ' + h.nombre + (h.usos ? ' (' + h.usosRestantes + ')' : ''))
        .setStyle(ButtonStyle.Primary)
    );
    rows.push(new ActionRowBuilder().addComponents(...filaH));
  }

  await channel.send({ content: '<@' + activo.uid + '>', embeds: [embed], components: rows });
}

// ─── Resolver acción de combate ───────────────────────────────────────────────
function resolverAtaque(activo, objetivo, log) {
  const dado  = d(20);
  const bono  = activo.bonoAtaque;
  const total = dado + bono;
  const caObj = objetivo.ca + (objetivo.defensa ? 2 : 0);

  log.push('**' + activo.nombre + '** ataca a **' + objetivo.nombre + '**: 🎲 1d20(' + dado + ') ' + (bono>=0?'+':'') + bono + ' = **' + total + '** vs CA ' + caObj);

  if (dado === 20) {
    const r1 = tirarDaño(activo.parsedDaño, activo.modAtk);
    const r2 = tirarDaño(activo.parsedDaño, activo.modAtk);
    objetivo.hp = Math.max(0, objetivo.hp - r1.total - r2.total);
    log.push('🎯 **¡CRÍTICO!** [' + r1.tiradas.join('+') + ']+[' + r2.tiradas.join('+') + ']+' + activo.modAtk + ' = **' + (r1.total+r2.total) + '** daño. ' + objetivo.nombre + ': ' + objetivo.hp + '/' + objetivo.hpMax + ' HP');
  } else if (total >= caObj) {
    const r = tirarDaño(activo.parsedDaño, activo.modAtk);
    objetivo.hp = Math.max(0, objetivo.hp - r.total);
    log.push('✅ **¡Impacto!** [' + r.tiradas.join('+') + ']+' + activo.modAtk + ' = **' + r.total + '** daño. ' + objetivo.nombre + ': ' + objetivo.hp + '/' + objetivo.hpMax + ' HP');
    if (objetivo.hp === 0) log.push('💀 **' + objetivo.nombre + '** ha caído.');
  } else if (dado === 1) {
    log.push('💥 **Pifia** — Fallo automático.');
  } else {
    log.push('❌ **Fallo.** ' + total + ' no supera CA ' + caObj + '.');
  }
}

function resolverHechizo(activo, objetivo, hechizo, log) {
  const pd    = parseDaño(hechizo.daño);
  const r     = tirarDaño(pd, 0);
  const daño  = Math.max(1, r.total);

  if (hechizo.cd) {
    // Tirada de salvación del objetivo
    const tsStat = 10; // DEX base como referencia
    const tsDado = d(20);
    const tsTotal = tsDado + Math.floor((objetivo.dex - 10) / 2);
    log.push('✨ **' + activo.nombre + '** lanza **' + hechizo.nombre + '** contra **' + objetivo.nombre + '**!');
    log.push('  TS DES del objetivo: 🎲 1d20(' + tsDado + ') + ' + Math.floor((objetivo.dex-10)/2) + ' = **' + tsTotal + '** vs CD ' + activo.cdHechizo);
    if (tsTotal >= activo.cdHechizo) {
      const mitad = Math.floor(daño / 2);
      objetivo.hp = Math.max(0, objetivo.hp - mitad);
      log.push('  ✅ Salvación exitosa — mitad del daño: **' + mitad + '**. ' + objetivo.nombre + ': ' + objetivo.hp + '/' + objetivo.hpMax + ' HP');
    } else {
      objetivo.hp = Math.max(0, objetivo.hp - daño);
      log.push('  ❌ Salvación fallida — daño completo: **' + daño + '** ' + hechizo.tipo + '. ' + objetivo.nombre + ': ' + objetivo.hp + '/' + objetivo.hpMax + ' HP');
    }
  } else {
    // Ataque mágico
    const dado  = d(20);
    const bono  = activo.prof + activo.modCast;
    const total = dado + bono;
    const caObj = objetivo.ca + (objetivo.defensa ? 2 : 0);
    log.push('✨ **' + activo.nombre + '** lanza **' + hechizo.nombre + '**: 🎲 1d20(' + dado + ') ' + (bono>=0?'+':'') + bono + ' = **' + total + '** vs CA ' + caObj);
    if (dado === 20) {
      objetivo.hp = Math.max(0, objetivo.hp - daño * 2);
      log.push('  🎯 **¡CRÍTICO MÁGICO!** **' + daño*2 + '** ' + hechizo.tipo + ' — ' + objetivo.nombre + ': ' + objetivo.hp + '/' + objetivo.hpMax + ' HP');
    } else if (total >= caObj) {
      objetivo.hp = Math.max(0, objetivo.hp - daño);
      log.push('  ✅ **¡Impacto!** **' + daño + '** ' + hechizo.tipo + ' — ' + objetivo.nombre + ': ' + objetivo.hp + '/' + objetivo.hpMax + ' HP');
      if (objetivo.hp === 0) log.push('  💀 **' + objetivo.nombre + '** ha caído.');
    } else {
      log.push('  ❌ Fallo.');
    }
  }

  if (hechizo.usos) hechizo.usosRestantes = Math.max(0, hechizo.usosRestantes - 1);
}

async function handleDueloCombateSelect(interaction) {
  const id      = interaction.customId;
  const uid     = interaction.user.id;
  const guildId = interaction.guildId;
  const duelo   = DUELOS.get(guildId);

  // Solo procesar botones y selects de duelo de combate
  const esBtnSelObjetivo = interaction.isButton() && id.startsWith('duelo_sel_objetivo_');
  const esBtnSelHechizo  = interaction.isButton() && id.startsWith('duelo_sel_hechizo_');
  const esBtnDefender    = interaction.isButton() && id.startsWith('duelo_defender_');
  const esSelectArma     = interaction.isStringSelectMenu() && id.startsWith('duelo_sel_arma_');
  const esBtnTirar       = interaction.isButton() && (id.startsWith('duelo_tirar_ataque_') || id.startsWith('duelo_tirar_hechizo_'));
  // Legacy
  const esBtnAtacar   = interaction.isButton() && id.startsWith('duelo_atacar_');
  const esBtnHechizo  = interaction.isButton() && id.startsWith('duelo_hechizo_');
  const esSelect      = interaction.isStringSelectMenu() && id.startsWith('duelo_accion_');

  if (!esBtnSelObjetivo && !esBtnSelHechizo && !esBtnDefender && !esSelectArma && !esBtnTirar
      && !esBtnAtacar && !esBtnHechizo && !esSelect) return false;

  if (!duelo || duelo.fase !== 'combate') {
    await interaction.reply({ content: '❌ No hay combate activo.', ephemeral: true });
    return true;
  }

  // ── Selección de objetivo → mostrar armas del inventario ─────────────────────
  if (esBtnSelObjetivo) {
    const parts       = id.split('_');
    const objetivoUid = parts[parts.length - 1];
    const objetivo    = duelo.combatientes.find(c => c.uid === objetivoUid && c.hp > 0);
    if (!objetivo) { await interaction.reply({ content: '❌ Objetivo inválido.', ephemeral: true }); return true; }

    const char   = getCharacter(uid);
    const invAll = char?.inventory || [];
    const armasInv = invAll.filter(item => {
      const nom   = item.nombre || '';
      const datos = getArmaData(nom);
      return item.daño || item.dano || item.damage || datos?.daño ||
        item.categoria === 'Arma' || item.categoria === 'Arma Única' || item.categoria === 'Arma Dorada' ||
        datos?.tipo || /espada|hacha|arco|ballesta|lanza|daga|maza|bastón|estoque|jabalina|cimitarra|tridente/i.test(nom);
    });

    const opciones = [
      { label: '⚔️ Ataque desarmado (1d4)', value: 'desarmado', description: 'Puño o patada' },
      ...armasInv.slice(0,20).map(a => {
        const datos = getArmaData(a.nombre||'');
        const dano  = a.daño || a.dano || a.damage || datos?.daño?.split(' ')[0] || '1d4';
        const sinMun = MUNICION_DUELO[a.nombre] && !tieneMunicionDuelo(uid, a.nombre);
        return {
          label:       ((sinMun ? '❌ ' : (datos?.tipo?.includes('Dist') ? '🏹 ' : '⚔️ ')) + (a.nombre||'')).slice(0,100),
          value:       (a.nombre||'desarmado').slice(0,100),
          description: (dano + (sinMun ? ' — sin munición' : '')).slice(0,100),
        };
      }),
    ];

    // Deduplicar valores
    const vistos = new Set();
    const optsUniq = opciones.filter(o => { if (vistos.has(o.value)) return false; vistos.add(o.value); return true; });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('duelo_sel_arma_' + uid + '_' + objetivoUid)
        .setPlaceholder('¿Con qué arma atacas?')
        .addOptions(optsUniq)
    );
    await interaction.reply({ content: '⚔️ Elige tu arma:', components: [row], ephemeral: true });
    return true;
  }

  // ── Select de arma → guardar y mostrar botón Tirar dado ───────────────────────
  if (esSelectArma) {
    const parts       = id.split('_');
    const objetivoUid = parts[parts.length - 1];
    const armaNombre  = interaction.values[0].replace(/_\d+$/, '');

    // Verificar munición
    if (MUNICION_DUELO[armaNombre] && !tieneMunicionDuelo(uid, armaNombre)) {
      await interaction.reply({ content: '❌ Sin munición para **' + armaNombre + '**. Compra en la tienda.', ephemeral: true });
      return true;
    }

    PENDIENTE_MODAL.set(uid, { guildId, tipo: 'ataque', armaNombre, objetivoUid });

    const objetivo = duelo.combatientes.find(c => c.uid === objetivoUid);
    const char     = getCharacter(uid);
    const armaInvItem = (char?.inventory||[]).find(i => i.nombre === armaNombre);
    const datosArmaD  = getArmaData(armaNombre);
    const dañoStr  = armaInvItem?.daño || armaInvItem?.dano || armaInvItem?.damage ||
                     datosArmaD?.daño?.split(' ')[0] || '1d4';
    const activo2  = duelo.combatientes[duelo.turnoActual];
    const munInfo  = MUNICION_DUELO[armaNombre];

    const embed = new EmbedBuilder()
      .setTitle('🎲 Listo para atacar')
      .setColor(0xCC2200)
      .setDescription(
        '**Arma:** ' + armaNombre + '\n' +
        '**Objetivo:** ' + (objetivo?.nombre || '?') + ' (CA ' + (objetivo?.ca || '?') + ')\n\n' +
        '**Bono de ataque:** 1d20 ' + (activo2?.bonoAtaque >= 0 ? '+' : '') + (activo2?.bonoAtaque||0) + '\n' +
        '**Dado de daño:** ' + dañoStr + '\n' +
        (munInfo ? '🏹 Se gastara 1 municion al tirar.\n' : '') +
        'Pulsa el boton para tirar los dados.'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('duelo_tirar_ataque_' + uid)
        .setLabel('🎲 Tirar dado')
        .setStyle(ButtonStyle.Danger)
    );
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    return true;
  }

  // ── Botón Tirar dado (ataque con arma) ────────────────────────────────────────
  if (esBtnTirar && id.startsWith('duelo_tirar_ataque_')) {
    const pendiente = PENDIENTE_MODAL.get(uid);
    PENDIENTE_MODAL.delete(uid);
    if (!pendiente || pendiente.guildId !== guildId) {
      await interaction.reply({ content: '❌ No hay acción pendiente. Vuelve a seleccionar.', ephemeral: true });
      return true;
    }

    const actTirar = duelo.combatientes[duelo.turnoActual];
    const log      = [];
    const objetivo = duelo.combatientes.find(c => c.uid === pendiente.objetivoUid && c.hp > 0);
    if (!objetivo) { await interaction.reply({ content: '❌ El objetivo ya cayó.', ephemeral: true }); return true; }

    const char    = getCharacter(uid);
    const armaInv = (char?.inventory||[]).find(i => i.nombre === pendiente.armaNombre);
    const datosT  = getArmaData(pendiente.armaNombre);
    // Obtener el dado de daño del arma elegida (no del d20)
    const dañoStr = armaInv?.daño || armaInv?.dano || armaInv?.damage ||
                    datosT?.daño?.split(' ')[0] ||
                    actTirar.parsedDaño && pendiente.armaNombre === actTirar.arma?.nombre ? null : null ||
                    '1d4';
    // Si el arma es la misma que la del combatiente, usar parsedDaño ya calculado
    const pd = (pendiente.armaNombre === actTirar.arma?.nombre && actTirar.parsedDaño)
      ? actTirar.parsedDaño
      : parseDaño(dañoStr);
    const dadoDaño = pd.dados + 'd' + pd.lados + (pd.bonus ? (pd.bonus>=0?'+':'')+pd.bonus : '');

    // Gastar munición o arma arrojadiza
    const esArrojadizaDuelo = ['Jabalina','Lanza','Hacha de Mano','Daga','Tridente','Martillo Ligero','Dardo'].includes(pendiente.armaNombre);
    if (MUNICION_DUELO[pendiente.armaNombre] || esArrojadizaDuelo) {
      if (!tieneMunicionDuelo(uid, pendiente.armaNombre) && !esArrojadizaDuelo) {
        await interaction.update({ content: '❌ Sin munición para **' + pendiente.armaNombre + '**.', embeds: [], components: [] });
        return true;
      }
      if (!esArrojadizaDuelo) {
        gastarMunicionDuelo(uid, pendiente.armaNombre);
      } else {
        // Arma arrojadiza: consumir 1 unidad (se recupera si gana, se pierde si pifia)
        const charA = getCharacter(uid);
        if (charA) {
          const invA = [...(charA.inventory||[])];
          const idxA = invA.findIndex(i => i.nombre === pendiente.armaNombre);
          if (idxA !== -1) {
            if ((invA[idxA].cantidad||1) <= 1) invA.splice(idxA, 1);
            else invA[idxA] = { ...invA[idxA], cantidad: (invA[idxA].cantidad||1) - 1 };
            updateCharacter(uid, { inventory: invA });
          }
        }
        // Registrar en el combatiente para recuperación post-victoria
        const combActivo = duelo.combatientes.find(co => co.uid === uid);
        if (combActivo) combActivo._arrojadasLanzadas = (combActivo._arrojadasLanzadas||0) + 1;
      }
    }

    const dado20 = d(20);
    const bono   = actTirar.bonoAtaque;
    const total  = dado20 + bono;
    const caObj  = objetivo.ca + (objetivo.defensa ? 2 : 0);

    // ── Tirada de ATAQUE (d20 + bono) vs CA ─────────────────────
    log.push('⚔️ **' + actTirar.nombre + '** ataca a **' + objetivo.nombre + '** con **' + pendiente.armaNombre + '**');
    log.push('🎲 Tirada de ataque: d20(**' + dado20 + '**) + ' + bono + ' = **' + total + '** vs CA ' + caObj);

    if (dado20 === 20) {
      // ── Crítico: doble dado de daño ────────────────────────────
      const r1 = tirarDaño(pd, actTirar.modAtk), r2 = tirarDaño(pd, actTirar.modAtk);
      const danoCrit = r1.total + r2.total;
      objetivo.hp = Math.max(0, objetivo.hp - danoCrit);
      log.push('🎯 **GOLPE CRITICO!** ' + dadoDaño + ' doble:');
      log.push('  Dado 1: [' + r1.tiradas.join('+') + '] = ' + r1.total);
      log.push('  Dado 2: [' + r2.tiradas.join('+') + '] = ' + r2.total);
      log.push('  Mod: ' + (actTirar.modAtk>=0?'+':'') + actTirar.modAtk + ' | Total: **' + danoCrit + '** daño');
      log.push('  ' + objetivo.nombre + ': ' + objetivo.hp + '/' + objetivo.hpMax + ' HP');
    } else if (dado20 === 1) {
      log.push('💥 Pifia! 1 natural — fallo automatico.');
      // Arma arrojadiza: se pierde al pifiar
      if (ARMAS_ARROJADIZAS_DUELO.has(pendiente.armaNombre)) {
        log.push('🗑️ El ' + pendiente.armaNombre + ' lanzado se pierde. No se recupera.');
        // Ya se gastó en el paso anterior — simplemente no se recuperará
      }
    } else if (total >= caObj) {
      const r    = tirarDaño(pd, actTirar.modAtk);
      const dano = Math.max(1, r.total);
      objetivo.hp = Math.max(0, objetivo.hp - dano);
      log.push('Impacto! [' + r.tiradas.join('+') + '] + ' + (actTirar.modAtk>=0?'+':'') + actTirar.modAtk + ' = **' + dano + '** daño (' + dadoDaño + ')');
      log.push(objetivo.nombre + ': ' + objetivo.hp + '/' + objetivo.hpMax + ' HP' + (objetivo.hp===0 ? ' — CAIDO' : ''));
      if (objetivo.hp === 0) log.push('💀 **' + objetivo.nombre + '** ha caído.');
    } else {
      log.push('❌ Fallo — ' + total + ' no supera CA ' + caObj + '.');
    }

    duelo.log = log;
    duelo.combatientes.forEach(co => { if (co.uid !== actTirar.uid) co.defensa = false; });
    actTirar.defensa = false;
    duelo.turnoActual = (duelo.turnoActual + 1) % duelo.combatientes.length;
    if (duelo.turnoActual === 0) duelo.ronda++;

    await interaction.update({ content: '✅ Dado tirado.', embeds: [], components: [] });
    await mostrarTurnoCombate(interaction.client, guildId);
    return true;
  }

  const activo = duelo.combatientes[duelo.turnoActual];
  if (activo.uid !== uid) {
    await interaction.reply({ content: '❌ No es tu turno.', ephemeral: true });
    return true;
  }

  const log = [];

  if (esBtnDefender) {
    activo.defensa = true;
    log.push('🛡️ **' + activo.nombre + '** se defiende. +2 CA este turno.');

  } else if (esBtnAtacar) {
    // duelo_atacar_{activoUid}_{objetivoUid}
    const parts       = id.split('_');
    const objetivoUid = parts[parts.length - 1];
    const objetivo    = duelo.combatientes.find(c => c.uid === objetivoUid);
    if (!objetivo || objetivo.hp <= 0) {
      await interaction.reply({ content: '❌ Objetivo no válido.', ephemeral: true });
      return true;
    }
    resolverAtaque(activo, objetivo, log);

  } else if (esBtnHechizo) {
    // duelo_hechizo_{activoUid}_{hechizoIdx}_{objetivoUid}  (enemigo único)
    // duelo_hechizo_sel_{activoUid}_{hechizoIdx}            (varios enemigos — no implementado aún)
    const parts      = id.split('_');
    const hechizoIdx = parseInt(parts[parts.length - 2]);
    const objUid     = parts[parts.length - 1];
    const hechizo    = activo.hechizos?.[hechizoIdx];
    const objetivo   = duelo.combatientes.find(c => c.uid === objUid);

    if (!hechizo || !objetivo || objetivo.hp <= 0) {
      await interaction.reply({ content: '❌ Hechizo u objetivo no válido.', ephemeral: true });
      return true;
    }
    if (hechizo.usosRestantes <= 0) {
      await interaction.reply({ content: '❌ Ya no te quedan usos de **' + hechizo.nombre + '**.', ephemeral: true });
      return true;
    }
    resolverHechizo(activo, objetivo, hechizo, log);

  } else if (esSelect) {
    // Compatibilidad con select legacy
    const valor = interaction.values[0];
    if (valor === 'defender') {
      activo.defensa = true;
      log.push('🛡️ **' + activo.nombre + '** se defiende. +2 CA este turno.');
    } else if (valor.startsWith('atk_')) {
      const objUid  = valor.replace('atk_', '');
      const objetivo = duelo.combatientes.find(c => c.uid === objUid);
      if (objetivo) resolverAtaque(activo, objetivo, log);
    }
  }

  duelo.log = log;

  // Limpiar defensa del turno anterior (excepto el activo si acaba de defender)
  duelo.combatientes.forEach(c => { if (c.uid !== activo.uid) c.defensa = false; });
  if (!activo.defensa && log[0]?.startsWith('🛡️')) activo.defensa = true;
  else if (!log[0]?.startsWith('🛡️')) activo.defensa = false;

  // Avanzar turno
  duelo.turnoActual = (duelo.turnoActual + 1) % duelo.combatientes.length;
  if (duelo.turnoActual === 0) duelo.ronda++;

  await interaction.deferUpdate();
  await mostrarTurnoCombate(interaction.client, guildId);
  return true;
}

// ─── Terminar duelo ───────────────────────────────────────────────────────────
async function terminarDuelo(client, guildId) {
  const duelo = DUELOS.get(guildId);
  if (!duelo) return;
  DUELOS.delete(guildId);

  try {
    const _guild = client.guilds.cache.get(guildId);
    let channel = _guild?.channels.cache.find(c => c.name.toLowerCase() === 'duelos' && c.isTextBased())
                  || client.channels.cache.get(duelo.channelId);
    if (!channel) return;

    // Determinar ganadores
    let ganadores = [], perdedores = [];
    if (duelo.equipo1) {
      const e1vivos = duelo.equipo1.filter(uid => duelo.combatientes.find(c=>c.uid===uid&&c.hp>0));
      const e2vivos = duelo.equipo2.filter(uid => duelo.combatientes.find(c=>c.uid===uid&&c.hp>0));
      ganadores = e1vivos.length > 0 ? duelo.equipo1 : duelo.equipo2;
      perdedores = e1vivos.length > 0 ? duelo.equipo2 : duelo.equipo1;
    } else {
      const c0vivo = duelo.combatientes[0]?.hp > 0;
      ganadores  = [duelo.combatientes[c0vivo ? 0 : 1].uid];
      perdedores = [duelo.combatientes[c0vivo ? 1 : 0].uid];
    }

    const ganadorUid   = ganadores[0];
    const perdedorUid  = perdedores[0];
    const charGanador  = getCharacter(ganadorUid);

    // Recuperar armas arrojadizas del ganador (excepto las pifiadas)
    for (const comb of duelo.combatientes) {
      if (!ganadores.includes(comb.uid)) continue;
      const arrojadasUsadas = comb._arrojadasLanzadas || 0;
      if (arrojadasUsadas > 0 && comb.arma && ARMAS_ARROJADIZAS_DUELO.has(comb.arma.nombre)) {
        const charArm = getCharacter(comb.uid);
        if (!charArm) continue;
        const invArm = [...(charArm.inventory||[])];
        const idxArm = invArm.findIndex(i => i.nombre === comb.arma.nombre);
        if (idxArm !== -1) invArm[idxArm] = { ...invArm[idxArm], cantidad:(invArm[idxArm].cantidad||0)+arrojadasUsadas };
        else invArm.push({ nombre:comb.arma.nombre, cantidad:arrojadasUsadas, peso:1, precio:0, categoria:'Equipo inicial' });
        updateCharacter(comb.uid, { inventory: invArm });
      }
    }
    const charPerdedor = getCharacter(perdedorUid);

    // Aplicar apuesta entre los duelistas (1v1)
    let apuestaDesc = '';
    if (duelo.apTipo && duelo.apTipo !== 'ninguna' && duelo.apRivalTipo && duelo.apRivalTipo !== 'ninguna') {
      apuestaDesc = await aplicarApuesta(ganadorUid, perdedorUid, duelo);
    }

    // Resolver apuestas de espectadores (x2 a los ganadores)
    let apEspDesc = '';
    const apEspLines = [];
    for (const [specUid, apuesta] of Object.entries(duelo.apuestasEspectadores)) {
      const charSpec = getCharacter(specUid);
      if (!charSpec) continue;
      if (ganadores.includes(apuesta.por)) {
        // Ganó — recibe x2
        const money = { ...(charSpec.money || {PC:0,PP:0,PE:0,PO:0,PT:0}) };
        money.PO = (money.PO || 0) + apuesta.cantidad * 2;
        updateCharacter(specUid, { money });
        apEspLines.push(`✅ <@${specUid}> ganó **${apuesta.cantidad * 2} PO** (apostó ${apuesta.cantidad} PO por el ganador)`);
      } else {
        // Perdió — se descuenta
        const nuevoMonedero = pagar(charSpec.money || {PC:0,PP:0,PE:0,PO:0,PT:0}, apuesta.cantidad);
        if (nuevoMonedero) {
          updateCharacter(specUid, { money: nuevoMonedero });
          apEspLines.push(`❌ <@${specUid}> perdió **${apuesta.cantidad} PO** (apostó por el perdedor)`);
        }
      }
    }
    if (apEspLines.length) apEspDesc = '\n\n**Apuestas de espectadores:**\n' + apEspLines.join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🏆 Duelo terminado')
      .setColor(0xFFD700)
      .setDescription(
        `**¡${charGanador?.name || 'Ganador'} ha ganado el duelo!**\n\n` +
        `**Ganador:** <@${ganadorUid}> (${charGanador?.class} nv.${charGanador?.level})\n` +
        `**Perdedor:** <@${perdedorUid}> (${charPerdedor?.class} nv.${charPerdedor?.level})\n` +
        (apuestaDesc ? `\n**Apuesta del duelo:**\n${apuestaDesc}` : '') +
        apEspDesc
      );

    await channel.send({ embeds: [embed] });
  } catch(e) { console.error('terminarDuelo error:', e); }
}

// ─── Aplicar apuesta entre duelistas ─────────────────────────────────────────
async function aplicarApuesta(ganadorUid, perdedorUid, duelo) {
  const { apTipo, apValor, apRivalTipo, apRivalValor } = duelo;
  const lines = [];

  // El perdedor pierde su apuesta, el ganador recibe la del rival
  for (const [fromUid, tipo, valor, toUid] of [
    [perdedorUid, apRivalTipo, apRivalValor, ganadorUid],
    [ganadorUid,  apTipo,      apValor,      perdedorUid],
  ].slice(0,1)) {  // Solo el perdedor paga
    const [perId, winId] = [perdedorUid, ganadorUid];
    const [perTipo, perValor] = perId === perdedorUid ? [apRivalTipo, apRivalValor] : [apTipo, apValor];
    const charPer = getCharacter(perId);
    const charWin = getCharacter(winId);
    if (!charPer || !charWin) continue;

    if (perTipo === 'dinero') {
      const cant = parseInt(perValor) || 0;
      const nM   = pagar(charPer.money || {PC:0,PP:0,PE:0,PO:0,PT:0}, cant);
      if (nM) {
        updateCharacter(perId, { money: nM });
        const wMoney = { ...(charWin.money || {PC:0,PP:0,PE:0,PO:0,PT:0}) };
        wMoney.PO = (wMoney.PO || 0) + cant;
        updateCharacter(winId, { money: wMoney });
        lines.push(`💰 ${charPer.name} paga **${cant} PO** a ${charWin.name}`);
      }
    } else if (perTipo === 'nivel') {
      const nuevoNivel = Math.max(1, (charPer.level||1) - 1);
      updateCharacter(perId, { level: nuevoNivel });
      lines.push(`📉 ${charPer.name} baja al nivel **${nuevoNivel}** (de ${charPer.level})`);
    } else if (perTipo === 'objeto' && perValor) {
      const invPer = [...(charPer.inventory || [])];
      const idxItem = invPer.findIndex(i => i.nombre.toLowerCase() === perValor.toLowerCase());
      if (idxItem !== -1) {
        const item = { ...invPer[idxItem] };
        if (invPer[idxItem].cantidad > 1) invPer[idxItem].cantidad--;
        else invPer.splice(idxItem, 1);
        updateCharacter(perId, { inventory: invPer });
        const invWin = [...(charWin.inventory || [])];
        invWin.push(item);
        updateCharacter(winId, { inventory: invWin });
        lines.push(`🎒 ${charPer.name} entrega **${item.nombre}** a ${charWin.name}`);
      }
    }
    break;
  }

  return lines.join('\n');
}

// ─── Validar apuesta ──────────────────────────────────────────────────────────
function validarApuesta(char, tipo, valor, uid) {
  if (!tipo || tipo === 'ninguna') return null;
  if (tipo === 'dinero') {
    const cant = parseInt(valor);
    if (!cant || cant <= 0) return '❌ Especifica una cantidad de dinero válida (ej: `50`)';
    if (totalEnPC(char.money||{}) < cant*100) return `❌ No tienes **${cant} PO**.`;
  }
  if (tipo === 'nivel') {
    if ((char.level||1) <= 1) return '❌ No puedes apostar tu nivel — ya estás en nivel 1.';
  }
  if (tipo === 'objeto') {
    if (!valor) return '❌ Especifica el nombre del objeto a apostar.';
    const item = (char.inventory||[]).find(i => i.nombre.toLowerCase() === valor.toLowerCase());
    if (!item) return `❌ No tienes **${valor}** en tu inventario.`;
  }
  return null;
}

function formatApuesta(tipo, valor) {
  if (!tipo || tipo === 'ninguna') return '*Sin apuesta*';
  if (tipo === 'dinero')  return `💰 ${valor} PO`;
  if (tipo === 'nivel')   return `📉 Un nivel`;
  if (tipo === 'objeto')  return `🎒 ${valor}`;
  return tipo;
}

// ─── Router de botones de duelo ───────────────────────────────────────────────
async function handleDueloInteraction(interaction) {
  const id = interaction.customId || '';

  // Aceptar duelo 1v1
  if (interaction.isButton() && id.startsWith('duelo_aceptar_')) {
    const parts = id.split('_');
    const retadorId = parts[2], rivalId = parts[3];
    if (interaction.user.id !== rivalId) {
      await interaction.reply({ content: '❌ Este reto no es para ti.', ephemeral: true });
      return true;
    }

    const duelo = DUELOS.get(interaction.guildId);
    if (!duelo || duelo.fase !== 'reto') {
      await interaction.update({ content: '❌ El duelo ya no está disponible.', embeds: [], components: [] });
      return true;
    }

    // Modal para apuesta del rival (simplificado: reply con opciones)
    const charRival = getCharacter(rivalId);
    duelo.apRivalTipo  = 'ninguna';
    duelo.apRivalValor = '';
    duelo.fase = 'aceptado';

    await interaction.update({ content: `✅ <@${rivalId}> aceptó el duelo.`, embeds: [], components: [] });
    await iniciarDuelo(interaction.client, interaction.guildId);
    return true;
  }

  // Rechazar duelo
  if (interaction.isButton() && id.startsWith('duelo_rechazar_')) {
    DUELOS.delete(interaction.guildId);
    await interaction.update({ content: `❌ <@${interaction.user.id}> rechazó el duelo.`, embeds: [], components: [] });
    return true;
  }

  // Aceptar duelo 2v2
  if (interaction.isButton() && id.startsWith('duelo2v2_aceptar_')) {
    const duelo = DUELOS.get(interaction.guildId);
    if (!duelo || duelo.fase !== 'reto_2v2') return false;
    duelo.pendientesAcepcion.delete(interaction.user.id);
    if (duelo.pendientesAcepcion.size === 0) {
      await interaction.update({ content: '✅ Todos aceptaron. ¡El duelo 2v2 comienza!', embeds: [], components: [] });
      await iniciarDuelo(interaction.client, interaction.guildId);
    } else {
      await interaction.reply({ content: `✅ Aceptaste. Esperando ${duelo.pendientesAcepcion.size} más.`, ephemeral: true });
    }
    return true;
  }

  // Rechazar 2v2
  if (interaction.isButton() && id.startsWith('duelo2v2_rechazar_')) {
    DUELOS.delete(interaction.guildId);
    await interaction.update({ content: `❌ El duelo 2v2 fue rechazado.`, embeds: [], components: [] });
    return true;
  }

  // Acciones de combate — botones y selects
  if (
    (interaction.isButton() && (
      id.startsWith('duelo_sel_objetivo_') ||
      id.startsWith('duelo_sel_hechizo_') ||
      id.startsWith('duelo_tirar_dado_') ||
      id.startsWith('duelo_tirar_hechizo_') ||
      id.startsWith('duelo_cancelar_accion_') ||
      id.startsWith('duelo_defender_') ||
      id.startsWith('duelo_atacar_') ||
      id.startsWith('duelo_hechizo_')
    )) ||
    (interaction.isStringSelectMenu() && (
      id.startsWith('duelo_accion_') ||
      id.startsWith('duelo_sel_arma_')
    )) ||
    (interaction.isButton() && (id.startsWith('duelo_tirar_ataque_') || id.startsWith('duelo_tirar_hechizo_')))
  ) {
    return await handleDueloCombateSelect(interaction);
  }

  return false;
}

module.exports = { cmdDuelo, cmdDuelo2v2, cmdApostar, handleDueloInteraction };
