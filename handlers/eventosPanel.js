// ── handlers/eventosPanel.js ──────────────────────────────────────────────────
// Eventos aleatorios diarios — recompensan a TODOS los jugadores
// Se activa automáticamente ~cada 24h o el DM puede forzar uno
// ─────────────────────────────────────────────────────────────────────────────

const { getEvento, setEvento, deleteEvento } = require('../db/stateStore.js');
const { EmbedBuilder } = require('discord.js');
const { getAllCharacters, updateCharacter } = require('../db/characterStore.js');
const { isDM } = require('../utils/isDM.js');

// ─── Catálogo de 35 eventos ───────────────────────────────────────────────────
const EVENTOS = [
  // ── Moneda / Dinero ──
  { id:'moneda_dios',       titulo:'💰 Se le cayó una moneda a los dioses',       desc:'Un destello dorado cae del cielo. Todos los aventureros encuentran una moneda de oro.',
    efecto:(char) => { const m={...(char.money||{})};m.PO=(m.PO||0)+1; return {money:m}; },       msg:(c)=>`${c.name} gana **1 PO**` },

  { id:'lluvia_monedas',    titulo:'💰 Lluvia de monedas de cobre',                desc:'Unas pocas monedas caen del tejado de la taberna. ¡Un pequeño regalo!',
    efecto:(char) => { const m={...(char.money||{})};m.PC=(m.PC||0)+5; return {money:m}; },       msg:(c)=>`${c.name} gana **5 PC**` },

  { id:'mercader_generoso', titulo:'🛒 El mercader está de buen humor',             desc:'Hoy todos los precios en la tienda tienen **15% de descuento**.',
    efecto:null,                                                                                   msg:()=>'Descuento del 15% activo por 6 horas', tipoEvento:'descuento', valor:0.15, duracion:6*60 },

  { id:'mercader_remate',   titulo:'🛒 El mercader liquida existencias',            desc:'¡Remate! **20% de descuento** en todos los artículos de la tienda.',
    efecto:null,                                                                                   msg:()=>'Descuento del 20% activo por 4 horas', tipoEvento:'descuento', valor:0.20, duracion:4*60 },

  { id:'tesoro_perdido',    titulo:'💎 Tesoro perdido encontrado',                  desc:'Los aventureros hallan unas monedas en una grieta del suelo.',
    efecto:(char) => { const m={...(char.money||{})};m.PO=(m.PO||0)+3;m.PP=(m.PP||0)+2; return {money:m}; }, msg:(c)=>`${c.name} gana **3 PO y 2 PP**` },

  // ── Stats / HP ──
  { id:'buena_suerte',      titulo:'🍀 ¡Buena suerte!',                            desc:'Los dioses sonríen. Todos ganan +5 HP temporales durante 3 horas.',
    efecto:(char) => ({ hpActual: Math.min((char.hpMax||10)+5, (char.hpActual||char.hpMax||10)+5) }), msg:(c)=>`${c.name} gana **+5 HP temporal**` },

  { id:'descanso_bendito',  titulo:'😴 Descanso Bendito',                           desc:'Una brisa mágica restaura las energías. Todos recuperan 1d6+2 HP.',
    efecto:(char) => { const cura=Math.floor(Math.random()*6)+3; return { hpActual:Math.min(char.hpMax||10,(char.hpActual||char.hpMax||10)+cura) }; }, msg:(c)=>`${c.name} recupera HP` },

  { id:'inspiracion_bardica', titulo:'🎵 El bardo local os inspira',                desc:'Una melodía llena de magia aumenta vuestro carisma temporalmente.',
    efecto:null, msg:()=>'+2 CHA temporal por 3 horas', tipoEvento:'stat_temp', stat:'CHA', bonus:2, duracion:180 },

  { id:'entrenamiento_arcano', titulo:'📚 Texto arcano encontrado',                 desc:'Un pergamino misterioso aumenta brevemente vuestra inteligencia.',
    efecto:null, msg:()=>'+2 INT temporal por 3 horas', tipoEvento:'stat_temp', stat:'INT', bonus:2, duracion:180 },

  { id:'trabajo_duro',      titulo:'⚒️ Trabajo duro recompensado',                  desc:'El esfuerzo de la semana fortalece vuestros cuerpos.',
    efecto:null, msg:()=>'+2 CON temporal por 3 horas', tipoEvento:'stat_temp', stat:'CON', bonus:2, duracion:180 },

  // ── Objetos / Inventario ──
  { id:'pocion_gratis',     titulo:'🧪 El alquimista dona pociones',               desc:'El alquimista del pueblo dona una poción de curación básica a cada aventurero.',
    efecto:(char) => { const inv=[...(char.inventory||[])];inv.push({nombre:'Poción de Curación Básica',cantidad:1,precio:5,categoria:'Evento',descripcion:'Cura 4 HP'});return {inventory:inv}; }, msg:(c)=>`${c.name} recibe una **Poción de Curación Básica**` },

  { id:'ingrediente_raro',  titulo:'🌿 Ingrediente raro hallado',                  desc:'Un raro ingrediente alquímico aparece en el camino.',
    efecto:(char) => { const inv=[...(char.inventory||[])];inv.push({nombre:'Ingrediente Alquímico Raro',cantidad:1,precio:15,categoria:'Evento'});return {inventory:inv}; }, msg:(c)=>`${c.name} recibe un **Ingrediente Raro**` },

  { id:'flecha_gratis',     titulo:'🏹 El cazador reparte flechas',                desc:'Un cazador generoso entrega flechas a quienes las necesiten.',
    efecto:(char) => { const inv=[...(char.inventory||[])];inv.push({nombre:'Flechas',cantidad:5,precio:0,categoria:'Evento'});return {inventory:inv}; }, msg:(c)=>`${c.name} recibe **5 Flechas**` },

  // ── XP / Nivel ──
  { id:'historia_epica',    titulo:'📖 Historia épica contada',                    desc:'El bardo cuenta una gesta legendaria. Todos sienten que han aprendido algo.',
    efecto:null, msg:()=>'Todos ganan inspiración', tipoEvento:'inspiracion' },

  { id:'sabiduria_anciana', titulo:'🧙 La anciana del pueblo os da un consejo',     desc:'Un consejo críptico pero valioso... ¿Qué significará?',
    efecto:null, msg:()=>'Un enigma para resolver (el DM revelará su significado)', tipoEvento:'especial' },

  // ── Clima / Entorno ──
  { id:'dia_soleado',       titulo:'☀️ Día espléndido',                             desc:'El sol brilla con fuerza. El buen humor abunda.',
    efecto:(char) => { const m={...(char.money||{})};m.PC=(m.PC||0)+3; return {money:m}; },  msg:(c)=>`${c.name} gana **3 PC** por hacer recados` },

  { id:'lluvia_abundante',  titulo:'🌧️ Lluvia abundante llena los odres',           desc:'El agua pura cae del cielo. Todos se sienten revitalizados.',
    efecto:(char) => ({ hpActual: Math.min(char.hpMax||10,(char.hpActual||char.hpMax||10)+3) }), msg:(c)=>`${c.name} recupera **3 HP**` },

  { id:'viento_del_norte',  titulo:'💨 Viento helado del norte',                   desc:'Un viento mágico trae noticias de tierras lejanas. +1 percepción temporal.',
    efecto:null, msg:()=>'+2 SAB temporal por 3 horas', tipoEvento:'stat_temp', stat:'WIS', bonus:2, duracion:180 },

  // ── Descuentos especiales ──
  { id:'dia_alquimista',    titulo:'⚗️ Día del Alquimista',                         desc:'El alquimista celebra su aniversario. **25% de descuento** en pociones hoy.',
    efecto:null, msg:()=>'Descuento del 25% en la tienda de pociones', tipoEvento:'descuento_pociones', valor:0.25, duracion:8*60 },

  { id:'feria_herreros',    titulo:'⚒️ Feria de Herreros',                          desc:'Los herreros exhiben su trabajo. **10% de descuento** en armas y armaduras.',
    efecto:null, msg:()=>'Descuento del 10% en armas', tipoEvento:'descuento', valor:0.10, duracion:6*60 },

  // ── Encuentros ──
  { id:'viajero_generoso',  titulo:'🗺️ Viajero generoso de paso',                   desc:'Un viajero misterioso deja una bolsa con monedas antes de partir.',
    efecto:(char) => { const m={...(char.money||{})};m.PO=(m.PO||0)+2; return {money:m}; }, msg:(c)=>`${c.name} recibe **2 PO**` },

  { id:'comercio_favorable', titulo:'📈 Comercio favorable',                        desc:'Las rutas comerciales están activas. Todos los negocios prosperan.',
    efecto:(char) => { const m={...(char.money||{})};m.PP=(m.PP||0)+5; return {money:m}; }, msg:(c)=>`${c.name} gana **5 PP**` },

  { id:'duende_travieso',   titulo:'🧝 Un duende travieso os roba... y devuelve',   desc:'Un duende os roba y luego os devuelve el doble por remordimiento.',
    efecto:(char) => { const m={...(char.money||{})};m.PC=(m.PC||0)+10; return {money:m}; }, msg:(c)=>`${c.name} gana **10 PC** (el doble de lo robado)` },

  { id:'festival_pueblo',   titulo:'🎉 Festival del pueblo',                        desc:'¡Todos están de fiesta! Los comerciantes comparten su alegría.',
    efecto:(char) => { const m={...(char.money||{})};m.PO=(m.PO||0)+1;m.PP=(m.PP||0)+5; return {money:m}; }, msg:(c)=>`${c.name} gana **1 PO y 5 PP**` },

  // ── Mágicos ──
  { id:'eclipse_lunar',     titulo:'🌑 Eclipse lunar mágico',                       desc:'La magia fluye diferente esta noche. Los hechizos son más potentes.',
    efecto:null, msg:()=>'+1 INT y +1 SAB temporales por 3 horas', tipoEvento:'stat_temp_multi', stats:[{stat:'INT',bonus:1},{stat:'WIS',bonus:1}], duracion:180 },

  { id:'estrella_fugaz',    titulo:'⭐ Estrella fugaz concede un deseo',            desc:'Una estrella cae y todos la ven. ¡El deseo trae buena fortuna!',
    efecto:(char) => { const m={...(char.money||{})};m.PO=(m.PO||0)+2; return {money:m}; }, msg:(c)=>`${c.name} gana **2 PO** de fortuna` },

  { id:'portal_feywild',    titulo:'🌈 Portal del Feywild se abre brevemente',      desc:'Una ráfaga de magia feérica recarga las energías de todos.',
    efecto:(char) => ({ hpActual: char.hpMax||10 }), msg:(c)=>`${c.name} recupera **todos sus HP**` },

  { id:'bencion_clerical',  titulo:'✝️ Bendición de los dioses',                    desc:'Un clérigo de paso bendice a todos los aventureros del pueblo.',
    efecto:null, msg:()=>'+2 a todas las stats temporales por 2 horas', tipoEvento:'stat_temp', stat:'ALL', bonus:1, duracion:120 },

  // ── Curiosos ──
  { id:'pollito_magico',    titulo:'🐣 Pollito mágico aparece',                     desc:'Un pollito de colores mágicos visita la taberna. Su presencia alegra a todos.',
    efecto:(char) => { const m={...(char.money||{})};m.PC=(m.PC||0)+8; return {money:m}; }, msg:(c)=>`${c.name} gana **8 PC** por aplaudir al pollito` },

  { id:'libro_perdido',     titulo:'📚 Libro perdido de la biblioteca',             desc:'Un tomo perdido revela secretos arcanos a todos los que lo tocan.',
    efecto:null, msg:()=>'+3 INT temporal por 2 horas', tipoEvento:'stat_temp', stat:'INT', bonus:3, duracion:120 },

  { id:'mascota_perdida',   titulo:'🐾 Ayudáis a encontrar una mascota',            desc:'El tendero recupera su gato perdido. Su gratitud se traduce en descuentos.',
    efecto:null, msg:()=>'Descuento del 10% en la tienda', tipoEvento:'descuento', valor:0.10, duracion:4*60 },

  { id:'noche_calida',      titulo:'🔥 Noche cálida junto al fuego',               desc:'Una noche agradable de historias y descanso restaura fuerzas.',
    efecto:(char) => ({ hpActual: Math.min(char.hpMax||10,(char.hpActual||char.hpMax||10)+4) }), msg:(c)=>`${c.name} recupera **4 HP**` },

  { id:'vena_mineral',      titulo:'⛏️ Vena mineral descubierta',                   desc:'Un minero comparte su suerte con el pueblo.',
    efecto:(char) => { const m={...(char.money||{})};m.PP=(m.PP||0)+3; return {money:m}; }, msg:(c)=>`${c.name} recibe **3 PP** de la vena` },

  { id:'cartas_del_oraculo',titulo:'🔮 Las cartas del oráculo son favorables',      desc:'El oráculo del pueblo lee cartas favorables para todos.',
    efecto:(char) => { const m={...(char.money||{})};m.PO=(m.PO||0)+1;m.PC=(m.PC||0)+5; return {money:m}; }, msg:(c)=>`${c.name} recibe **1 PO y 5 PC**` },

  { id:'dios_generoso',     titulo:'🌟 Un dios menor está de buen humor',           desc:'Se siente una presencia divina benevolente. Todos reciben una pequeña bendición.',
    efecto:(char) => { const m={...(char.money||{})};m.PO=(m.PO||0)+2;const inv=[...(char.inventory||[])];inv.push({nombre:'Poción de Curación Básica',cantidad:1,precio:5,categoria:'Evento divino'});return {money:m,inventory:inv}; }, msg:(c)=>`${c.name} recibe **2 PO + 1 Poción**` },
];

// Estado del evento activo
// EVENTO_ACTIVO → stateStore.js (persistente) // guildId → { evento, expira, descuento }

// ─── Lanzar evento ────────────────────────────────────────────────────────────
async function lanzarEventoAleatorio(client, guildId) {
  const evento = EVENTOS[Math.floor(Math.random() * EVENTOS.length)];
  const todos  = getAllCharacters();
  const resultados = [];

  // Guardar evento activo (para descuentos etc)
  setEvento(guildId, {
    evento,
    expira: Date.now() + (evento.duracion || 24*60) * 60000,
    descuento: evento.tipoEvento === 'descuento' ? evento.valor : 0,
  });

  // Aplicar efecto a todos los personajes
  if (evento.efecto) {
    for (const char of todos) {
      const updates = evento.efecto(char);
      if (updates && Object.keys(updates).length) {
        updateCharacter(char._uid || char.userId, updates);
        resultados.push(evento.msg(char));
      }
    }
  } else if (evento.tipoEvento === 'stat_temp' || evento.tipoEvento === 'stat_temp_multi') {
    try {
      const { aplicarStatTemp } = require('./shopPanel.js');
      for (const char of todos) {
        if (evento.tipoEvento === 'stat_temp_multi') {
          (evento.stats||[]).forEach(s => aplicarStatTemp(char._uid||char.userId, s.stat, s.bonus, evento.duracion||180));
        } else if (evento.stat === 'ALL') {
          ['STR','DEX','CON','INT','WIS','CHA'].forEach(s => aplicarStatTemp(char._uid||char.userId, s, evento.bonus, evento.duracion||180));
        } else {
          aplicarStatTemp(char._uid||char.userId, evento.stat, evento.bonus, evento.duracion||180);
        }
        resultados.push(evento.msg(char));
      }
    } catch {}
  }

  // Publicar en el canal de anuncios o general
  try {
    const guild  = await client.guilds.fetch(guildId);
    const canal  = guild.channels.cache.find(c =>
      ['general','anuncios','eventos','town-square','tavern','taberna'].includes(c.name.toLowerCase())
    ) || guild.channels.cache.find(c => c.type === 0);

    if (!canal) return;

    const embed = new EmbedBuilder()
      .setTitle(evento.titulo)
      .setColor(0xFFD700)
      .setDescription(evento.desc + '\n\n**Afecta a todos los aventureros del servidor.**')
      .setTimestamp();

    if (resultados.length > 0 && resultados.length <= 10) {
      embed.addFields({ name: '🎁 Recompensas', value: resultados.join('\n').slice(0, 1024), inline: false });
    } else if (resultados.length === 0 && evento.msg) {
      embed.addFields({ name: '🎁 Efecto', value: evento.msg(null) || '—', inline: false });
    }

    await canal.send({ embeds: [embed] });
  } catch (err) {
    console.error('[eventosPanel] Error publicando evento:', err.message);
  }
}

// ─── Timer automático ~24h con variación aleatoria ───────────────────────────
function iniciarTimerEventos(client) {
  const programarProximo = () => {
    // Entre 20 y 28 horas
    const ms = (20 + Math.random() * 8) * 60 * 60 * 1000;
    setTimeout(async () => {
      try {
        const { Client } = require('discord.js');
        for (const [guildId] of client.guilds.cache) {
          await lanzarEventoAleatorio(client, guildId);
        }
      } catch {}
      programarProximo();
    }, ms);
  };
  programarProximo();
}

// ─── /dm-evento ───────────────────────────────────────────────────────────────
async function cmdDmEvento(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content: '❌ Solo el DM.', ephemeral: true });

  await lanzarEventoAleatorio(interaction.client, interaction.guildId);
  await interaction.reply({ content: '✅ Evento aleatorio lanzado.', ephemeral: true });
}

// ─── /evento-ver ──────────────────────────────────────────────────────────────
async function cmdEventoVer(interaction) {
  const activo = EVENTO_ACTIVO.get(interaction.guildId);
  if (!activo || Date.now() > activo.expira)
    return interaction.reply({ content: '❌ No hay evento activo actualmente.', ephemeral: true });

  const restante = Math.round((activo.expira - Date.now()) / 60000);
  const embed = new EmbedBuilder()
    .setTitle('🎉 Evento activo: ' + activo.evento.titulo)
    .setColor(0xFFD700)
    .setDescription(activo.evento.desc + '\n\nExpira en: **' + restante + ' minutos**');

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Obtener descuento activo para la tienda
function getDescuentoActivo(guildId) {
  const activo = getEvento(guildId);
  if (!activo || Date.now() > activo.expira) return 0;
  return activo.descuento || 0;
}

module.exports = { lanzarEventoAleatorio, iniciarTimerEventos, cmdDmEvento, cmdEventoVer, getDescuentoActivo };
