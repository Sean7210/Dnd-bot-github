// ── handlers/trainingPanel.js ─────────────────────────────────────────────────
const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');
const { getCharacter, updateCharacter } = require('../db/characterStore.js');
const { getSession }   = require('../utils/sessions.js');
const { rollDice, calcHP } = require('../utils/helpers.js');
const { HECHIZOS } = require('../data/spells.js');
const { calcularSlots, CLASES_MAGICAS } = require('../data/spellSystem.js');
const { ARMAS }  = require('../data/equipment.js');

// Munición necesaria por tipo de arma (nombre normalizado → nombre del item de munición)
// Arcos usan FLECHAS, ballestas usan VIROTES — son distintos y no intercambiables
const MUNICION_REQUERIDA = {
  'Arco Corto':       ['Flechas','Flecha'],
  'Arco Largo':       ['Flechas','Flecha'],
  'Ballesta Ligera':  ['Virotes de ballesta','Virote','Virotes'],
  'Ballesta de Mano': ['Virotes de ballesta','Virote','Virotes'],
  'Ballesta Pesada':  ['Virotes de ballesta','Virote','Virotes'],
  'Honda':            ['Balas de honda','Bala de honda','Piedra'],
  'Cerbatana':        ['Agujas de cerbatana','Aguja'],
};

// Armas arrojadizas: se recuperan tras ganar combate, se pierden con pifia (dado 1)
const ARMAS_ARROJADIZAS = new Set([
  'Jabalina','Lanza','Hacha de Mano','Daga','Tridente','Martillo Ligero','Dardo',
  'Cuchillo arrojadizo','Hacha arrojadiza',
]);

function tieneMunicion(char, nombreArma) {
  const needs = MUNICION_REQUERIDA[nombreArma];
  if (!needs) return { tiene: true, cantidad: 999, nombre: null }; // CaC, sin munición
  const inv  = char.inventory || [];
  for (const munNombre of needs) {
    const item = inv.find(i => (i.nombre||'').toLowerCase().includes(munNombre.toLowerCase()));
    if (item && (item.cantidad||1) > 0) return { tiene: true, cantidad: item.cantidad||1, nombre: item.nombre };
  }
  return { tiene: false, cantidad: 0, nombre: needs[0] };
}

function gastarMunicion(char, nombreArma, userId) {
  const needs = MUNICION_REQUERIDA[nombreArma];
  if (!needs) return;
  const inv = [...(char.inventory || [])];
  for (const munNombre of needs) {
    const idx = inv.findIndex(i => (i.nombre||'').toLowerCase().includes(munNombre.toLowerCase()));
    if (idx !== -1 && (inv[idx].cantidad||1) > 0) {
      const nueva = (inv[idx].cantidad||1) - 1;
      if (nueva <= 0) inv.splice(idx, 1);
      else inv[idx] = { ...inv[idx], cantidad: nueva };
      updateCharacter(userId, { inventory: inv });
      return nueva; // retorna cuántas quedan
    }
  }
  return 0;
}
const { CLASSES }          = require('../data/classes.js');

const COMBATES = new Map();

function smod(v) { const m = Math.floor((v-10)/2); return (m>=0?'+':'')+m; }
function d(n)    { return Math.floor(Math.random()*n)+1; }

function parseDano(str) {
  if (!str) return { dados:1, lados:4, bonus:0 };
  const m = (str+'').match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!m) return { dados:1, lados:4, bonus:0 };
  return { dados:parseInt(m[1]), lados:parseInt(m[2]), bonus:parseInt(m[3]||'0') };
}

function tirarDano(p) {
  let total = 0; const tiradas = [];
  for (let i=0; i<p.dados; i++) { const r=d(p.lados); tiradas.push(r); total+=r; }
  return { total: Math.max(1, total + p.bonus), tiradas };
}

function esArmaDistancia(arma) {
  const texto = ((arma.nombre||'') + ' ' + (arma.propiedades||'') + ' ' + (arma.dano||arma.da||'')).toLowerCase();
  return ['arco','ballesta','honda','dardo','jabalina','lanza','hacha arrojadiza',
          'cuchillo arrojadizo','distancia','ranged','rifle','cerbatana','pistola',
          'canon','proyectil','arrojadiza','arrojadizo','thrown'].some(k => texto.includes(k));
}

const GOBLIN  = { nombre:'Goblin', emoji:'👺', hp:7, hpMax:7, ca:15, ataque:4, danio:'1d6+2', dex:14, iniciativa:2, esManiqui:false };
const MANIQUI = { nombre:'Muñeco de Paja', emoji:'🪆', hp:9999, hpMax:9999, ca:5, ataque:0, danio:'1d1', dex:0, iniciativa:-10, esManiqui:true };

function armasDelInventario(char) {
  const inv = char.inventory || [];
  const res = [{ nombre:'Ataque desarmado', dano:'1d4', propiedades:'CaC', sinMunicion:false }];

  inv.forEach(item => {
    const nom = item.nombre || '';
    // Buscar en la tabla de ARMAS por nombre exacto o parcial
    const datosArma = ARMAS[nom] ||
      Object.entries(ARMAS).find(([k]) => k.toLowerCase() === nom.toLowerCase())?.[1] ||
      Object.entries(ARMAS).find(([k]) => nom.toLowerCase().includes(k.toLowerCase()))?.[1];

    // Buscar el daño en múltiples formas (daño/dano/damage, con y sin ñ)
    const rawDano = item.dano || item['daño'] || item.damage;
    const danoEquip = datosArma ? (datosArma['daño'] || datosArma.dano || datosArma.damage || '') : '';
    const dano = rawDano || (danoEquip ? danoEquip.split(' ')[0] : null);
    const propiedades = item.propiedades || (datosArma ? datosArma.propiedades : '') || '';
    const tipo = datosArma?.tipo || '';

    // Incluir si tiene daño, es tipo Arma, o su nombre sugiere que es arma
    const esArma = dano ||
      tipo.includes('CaC') || tipo.includes('Dist') ||
      item.categoria === 'Arma' || item.categoria === 'Arma Única' || item.categoria === 'Arma Dorada' ||
      /espada|hacha|arco|ballesta|lanza|daga|maza|bastón|estoque|jabalina|honda|cimitarra|mazo|pica|guja|alabarda|mangual|tridente|látigo|cerbatana/i.test(nom);

    if (!esArma) return;

    // Verificar munición para armas a distancia
    const munInfo = tieneMunicion(char, nom);

    res.push({
      nombre:      nom,
      dano:        dano || '1d4',
      propiedades: propiedades,
      tipo:        tipo,
      sinMunicion: !munInfo.tiene,
      munInfo:     munInfo,
    });
  });

  return res;
}

async function mostrarSeleccionArma(interaction, modo) {
  const char = getCharacter(interaction.user.id);
  if (!char) return interaction.reply({ content:'Sin personaje.', ephemeral:true });

  const cls   = CLASSES[char.class] || {};
  const hpMax = char.hpMax || (cls.hitDie ? calcHP(cls, char.finalStats?.CON??10, char.level||1) : 10);
  const stats = char.finalStats || {};
  const prof  = Math.ceil((char.level||1)/4)+1;
  const armas = armasDelInventario(char);

  const embed = new EmbedBuilder()
    .setTitle('Campo de Entrenamiento')
    .setColor(0x8B0000)
    .setDescription(`**${char.name}** — ${char.class} nv.${char.level||1}`)
    .addFields(
      { name:'HP', value:`${hpMax}`, inline:true },
      { name:'CA', value:`${10+Math.floor((stats.DEX??10)-10)/2}`, inline:true },
      { name:'Prof.', value:`+${prof}`, inline:true },
    );

  const visto = new Set();
  const opts  = armas.slice(0,25).reduce((acc, a, idx) => {
    const p      = parseDano(a.dano);
    const esDist = esArmaDistancia(a);
    const mod    = Math.floor(((esDist ? stats.DEX : stats.STR)??10)-10)/2;
    const bono   = prof + mod;
    const tipo   = esDist ? '🏹' : '⚔️';
    const sinMun = a.sinMunicion ? ' ❌sin munición' : (a.munInfo?.cantidad < 10 && a.munInfo?.cantidad > 0 ? ' ('+a.munInfo.cantidad+' mun.)' : '');
    let val      = a.nombre.slice(0,95);
    if (visto.has(val)) val = val + '_' + idx;
    visto.add(val);
    const label = (tipo + ' ' + a.nombre + sinMun).slice(0,100);
    const munStr2 = a.sinMunicion ? ' ⚠️SIN MUN' : (a.municion !== undefined && a.municion < 999 ? ` | 🏹${a.municion}` : '');
    const desc  = ('Ataque:' + (bono>=0?'+':'') + bono + ' | ' + a.dano + munStr2).slice(0,100) || undefined;
    acc.push({ label, description: desc || undefined, value: val });
    return acc;
  }, []);

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId(`train_sel_arma_${modo}`).setPlaceholder('Elige arma...').addOptions(opts)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('train_salir').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
    ),
  ];
  await interaction.reply({ embeds:[embed], components:rows, ephemeral:true });
}

function iniciarCombate(char, arma, modo) {
  const cls    = CLASSES[char.class] || {};
  const hpMax  = char.hpMax || (cls.hitDie ? calcHP(cls, char.finalStats?.CON??10, char.level||1) : 10);
  const stats  = char.finalStats || {};
  const prof   = Math.ceil((char.level||1)/4)+1;
  const esDist = esArmaDistancia(arma);
  const modAtk = Math.floor(((esDist ? stats.DEX : stats.STR)??10)-10)/2;

  const enemigos = modo==='novato' ? [{...MANIQUI}]
    : modo==='tutorial-1' ? [{...GOBLIN}]
    : [{...GOBLIN, nombre:'Goblin A'}, {...GOBLIN, nombre:'Goblin B'}];

  const iJ = d(20)+Math.floor((stats.DEX??10)-10)/2;
  const iE = d(20)+(enemigos[0]?.iniciativa||0);

  return {
    modo, char:char.name, clase:char.class, nivel:char.level||1, charUid: char._uid || '',
    _guildId: null, // se asigna en cmdEntrenar
    // CA = 10 + mod DEX (+ armadura si la tiene) — los +X del arma NO afectan la CA
    jugador: { hp:hpMax, hpMax, ca:10+Math.floor(((stats.DEX??10)-10)/2) },
    enemigos, arma, esDist, modAtk,
    bonoAtaque: prof+modAtk,
    parsedDano: parseDano(arma.dano),
    jugPrimero: iJ>=iE, ronda:1, log:[],
    esTutorial: modo!=='novato',
    iniciativas: { jugador:iJ, enemigos:iE },
    _charRef: char,  // referencia para gastar munición
  };
}

function buildEmbed(est) {
  const barra = (a,m) => '█'.repeat(Math.round(Math.max(0,a/m)*10))+'░'.repeat(10-Math.round(Math.max(0,a/m)*10))+` ${a}/${m}`;
  const vivos = est.enemigos.filter(e=>e.hp>0);
  const tipo  = est.esDist ? '🏹 Distancia' : '⚔️ CaC';
  const p     = est.parsedDano;
  const dmin  = p.dados+p.bonus+est.modAtk;
  const dmax  = p.dados*p.lados+p.bonus+est.modAtk;
  // Info de munición
  const munStr = est.esDist
    ? (est.arma.sinMunicion
        ? ' ⚠️ **SIN MUNICIÓN**'
        : (est.arma.municion !== undefined && est.arma.municion < 999 ? ` · 🏹 ${est.arma.municion} munición` : ''))
    : '';

  const embed = new EmbedBuilder()
    .setTitle(`Entrenamiento · Ronda ${est.ronda} · ${est.arma.nombre}${munStr}`)
    .setColor(est.jugador.hp<=0 ? 0x000000 : 0x8B0000)
    .addFields({ name:`❤️ ${est.char}`, value:`\`${barra(est.jugador.hp,est.jugador.hpMax)}\``, inline:false },
               ...vivos.map(e=>({ name:`${e.emoji} ${e.nombre}`, value:`\`${barra(e.hp,e.hpMax)}\` CA ${e.ca}`, inline:true })));

  const muertos = est.enemigos.filter(e=>e.hp<=0);
  if (muertos.length) embed.addFields({ name:'💀 Caídos', value:muertos.map(e=>`~~${e.nombre}~~`).join(', '), inline:false });
  if (est.log.length) embed.addFields({ name:'📜 Turno', value:est.log.slice(-6).join('\n').slice(0,1024), inline:false });

  embed.addFields({ name:`🎲 ${tipo}`, value:`1d20 ${est.bonoAtaque>=0?'+':''}${est.bonoAtaque} | Daño: **${dmin}–${dmax}**`, inline:false });

  // Mostrar slots disponibles si es clase lanzadora
  if (CLASES_MAGICAS.has(est.clase)) {
    const char = est._charRef;
    if (char?.magia?.slotsActuales) {
      const slotsStr = Object.entries(char.magia.slotsActuales)
        .filter(([k,v]) => v > 0 && !isNaN(k))
        .map(([k,v]) => `Nv${k}:${v}`)
        .join(' · ') || 'Sin slots';
      embed.addFields({ name:'🔮 Slots disponibles', value:slotsStr, inline:false });
    }
  }
  return embed;
}

function esArmaVersatil(arma) {
  const txt = ((arma.nombre||'') + ' ' + (arma.propiedades||'')).toLowerCase();
  return ['lanza','jabalina','hacha de mano','daga','tridente','martillo ligero',
          'dardo','cuchillo arrojadizo','hacha arrojadiza'].some(k => txt.includes(k));
}

function buildBotones(est) {
  const vivos    = est.enemigos.filter(e=>e.hp>0);
  const versatil = est.arma && esArmaVersatil(est.arma);
  const row = new ActionRowBuilder();
  if (est.jugador.hp>0 && vivos.length>0) {
    if (est.esDist && !versatil) {
      // Solo distancia
      row.addComponents(new ButtonBuilder()
        .setCustomId('train_atacar_dist')
        .setLabel(est.arma.sinMunicion ? '🏹 Atacar Dist (sin munición)' : '🏹 Atacar Dist')
        .setStyle(est.arma.sinMunicion ? ButtonStyle.Secondary : ButtonStyle.Danger)
        .setDisabled(est.arma.sinMunicion||false));
    } else if (!est.esDist && !versatil) {
      // Solo CaC
      row.addComponents(new ButtonBuilder().setCustomId('train_atacar_cac').setLabel('⚔️ Atacar CaC').setStyle(ButtonStyle.Danger));
    } else {
      // Versátil: ambos
      row.addComponents(
        new ButtonBuilder().setCustomId('train_atacar_cac').setLabel('⚔️ CaC').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('train_atacar_dist').setLabel('🏹 Dist').setStyle(ButtonStyle.Primary),
      );
    }
    row.addComponents(
      new ButtonBuilder().setCustomId('train_defender').setLabel('🛡️ Defender').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('train_curar').setLabel('💊 Poción').setStyle(ButtonStyle.Success),
    );
  }
  row.addComponents(new ButtonBuilder().setCustomId('train_salir').setLabel('🚪 Salir').setStyle(ButtonStyle.Secondary));
  return row;
}

function atacarJugador(est, tipo) {
  const obj = est.enemigos.find(e=>e.hp>0);
  if (!obj) return;

  // Verificar y gastar munición/arma en ataque a distancia
  if (tipo === 'dist' && est.arma && est.arma.nombre !== 'Ataque desarmado') {
    const char = est._charRef;
    if (char) {
      const esArrojadiza = esArmaVersatil(est.arma); // jabalina, lanza, etc.
      const munInfo = tieneMunicion(char, est.arma.nombre);

      if (!munInfo.tiene) {
        if (esArrojadiza) {
          // Arma arrojadiza sin stock: no puede atacar dist
          est.log = ['❌ Ya no tienes **' + est.arma.nombre + '** para lanzar. Cambia a CaC o usa otra arma.'];
        } else {
          est.log = ['❌ **Sin munición** para ' + est.arma.nombre + '. Necesitas ' + (munInfo.nombre||'munición') + '.'];
        }
        return;
      }

      if (esArrojadiza) {
        // Gastar 1 unidad del arma arrojadiza
        const inv = char.inventory || [];
        const idx = inv.findIndex(i => i.nombre === est.arma.nombre);
        if (idx !== -1) {
          const newInv = [...inv];
          const cantActual = newInv[idx].cantidad || 1;
          if (cantActual <= 1) {
            newInv.splice(idx, 1);
            est.log.push('⚠️ *Has lanzado tu última **' + est.arma.nombre + '**. Solo puedes atacar CaC ahora.*');
            // Quitar arma del estado del combate para forzar CaC
            est.esDist = false;
          } else {
            newInv[idx] = { ...newInv[idx], cantidad: cantActual - 1 };
            est.log.push('🏹 *Lanzas **' + est.arma.nombre + '**. Quedan ' + (cantActual-1) + '.*');
          }
          const { updateCharacter } = require('../db/characterStore.js');
          updateCharacter(char._uid || '', { inventory: newInv });
          char.inventory = newInv;
        }
      } else {
        // Munición normal (flechas, virotes)
        gastarMunicion(char, est.arma.nombre);
        if (munInfo.cantidad <= 5 && munInfo.cantidad > 0)
          est.log.push('⚠️ *Quedan ' + munInfo.cantidad + ' municiones.*');
        else if (munInfo.cantidad <= 0)
          est.log.push('⚠️ *Ultima municion usada.*');
      }
    }
  }

  const dado=d(20), bono=est.bonoAtaque, total=dado+bono, log=[];
  log.push(`**${est.char}** ataca a **${obj.nombre}**: 🎲 1d20(${dado}) ${bono>=0?'+':''}${bono} = **${total}** vs CA ${obj.ca}`);
  if (dado===20) {
    const r1=tirarDano(est.parsedDano), r2=tirarDano(est.parsedDano);
    obj.hp=Math.max(0,obj.hp-r1.total-r2.total);
    log.push(`🎯 **¡CRÍTICO!** [${r1.tiradas.join('+')}]+[${r2.tiradas.join('+')}]+${est.modAtk} = **${r1.total+r2.total}** daño`);
  } else if (total>=obj.ca) {
    const r=tirarDano(est.parsedDano), dmg=Math.max(1,r.total+est.modAtk);
    obj.hp=Math.max(0,obj.hp-dmg);
    log.push(`✅ **Impacto!** [${r.tiradas.join('+')}]+${est.modAtk} = **${dmg}** daño. ${obj.nombre}: ${obj.hp}/${obj.hpMax} HP`);
    if (obj.hp===0) log.push(`💀 **${obj.nombre}** cae.`);
  } else { log.push(dado===1?`💥 **Pifia!** Fallo automático.`:`❌ **Fallo.** ${total} no supera CA ${obj.ca}.`); }
  est.log=log;
}

function atacarEnemigos(est, caBonus=0) {
  const log=[], caJ=est.jugador.ca+caBonus;
  for (const e of est.enemigos.filter(e=>e.hp>0&&!e.esManiqui)) {
    const dado=d(20), total=dado+e.ataque;
    log.push(`${e.emoji} **${e.nombre}**: 🎲 1d20(${dado})+${e.ataque} = **${total}** vs CA ${caJ}`);
    if (total>=caJ) {
      const pd=parseDano(e.danio), r=tirarDano(pd);
      est.jugador.hp=Math.max(0,est.jugador.hp-r.total);
      log.push(`💥 ¡Te golpea! **${r.total}** daño. HP: ${est.jugador.hp}/${est.jugador.hpMax}`);
    } else { log.push(`🛡️ Fallo.`); }
  }
  return log;
}

async function cmdEntrenar(interaction) {
  const modo = interaction.options.getString('modo');
  const char = getCharacter(interaction.user.id);
  if (!char) return interaction.reply({ content:'Sin personaje.', ephemeral:true });
  await mostrarSeleccionArma(interaction, modo);
}

async function handleTrainingInteraction(interaction) {
  const id=interaction.customId||'', uid=interaction.user.id;

  if (interaction.isStringSelectMenu() && id.startsWith('train_sel_arma_')) {
    const modo=id.replace('train_sel_arma_','');
    const nomArma=interaction.values[0].replace(/_\d+$/,'');
    const char=getCharacter(uid);
    if (!char) { await interaction.update({ content:'Sin personaje.', embeds:[], components:[] }); return true; }
    char._uid = uid;  // guardar uid para gastarMunicion
    const armas=armasDelInventario(char);
    const armaE=armas.find(a=>a.nombre===nomArma)||armas.find(a=>nomArma.startsWith(a.nombre.slice(0,50)))||armas[0];

    // Avisar si no tiene munición (pero dejar entrenar CaC)
    if (armaE.sinMunicion) {
      await interaction.reply({ content:`❌ No tienes munición para **${armaE.nombre}**. Necesitas comprar **${armaE.munInfo?.nombre||'munición'}** en la tienda.`, ephemeral:true });
      return true;
    }
    const est=iniciarCombate(char,armaE,modo);
    COMBATES.set(uid,est);
    if (!est.jugPrimero&&est.esTutorial) { est.log=atacarEnemigos(est); est.ronda++; }
    await interaction.update({ embeds:[buildEmbed(est)], components:[buildBotones(est)] });
    return true;
  }

  if (!id.startsWith('train_')) return false;
  const est=COMBATES.get(uid);

  if (id==='train_salir') {
    COMBATES.delete(uid);
    await interaction.update({ content:'Has salido del entrenamiento.', embeds:[], components:[] });
    return true;
  }

  if (id==='train_curar') {
    const char=getCharacter(uid), inv=char?.inventory||[];
    const pi=inv.findIndex(i=>{ const n=(i.nombre||'').toLowerCase(); return n.includes('poci')||n.includes('pocion')||n.includes('elixir')||n.includes('cura'); });
    if (pi===-1) { await interaction.reply({ content:'❌ Sin pociones.', ephemeral:true }); return true; }
    const pot=inv[pi], nom=(pot.nombre||'').toLowerCase();
    let cura=4;
    if (nom.includes('mayor')||nom.includes('greater')) { let t=0; for(let i=0;i<4;i++) t+=d(4); cura=t+4; }
    else if (nom.includes('superior'))                  { let t=0; for(let i=0;i<8;i++) t+=d(4); cura=t+8; }
    else if (nom.includes('suprema')||nom.includes('supreme')) { let t=0; for(let i=0;i<10;i++) t+=d(4); cura=t+20; }
    else cura=4;
    if (est) { est.jugador.hp=Math.min(est.jugador.hpMax,est.jugador.hp+cura); est.log=[`💊 Usas **${pot.nombre}** → +**${cura} HP**. HP: ${est.jugador.hp}/${est.jugador.hpMax}`]; est.ronda++; }
    const invA=[...inv];
    if (invA[pi].cantidad>1) invA[pi]={...invA[pi],cantidad:invA[pi].cantidad-1}; else invA.splice(pi,1);
    updateCharacter(uid,{inventory:invA});
    if (est) await interaction.update({ embeds:[buildEmbed(est)], components:[buildBotones(est)] });
    else await interaction.reply({ content:`💊 Usas **${pot.nombre}** → +**${cura} HP**.`, ephemeral:true });
    return true;
  }

  if (!est) { await interaction.reply({ content:'Sin combate activo.', ephemeral:true }); return true; }
  const vivos=est.enemigos.filter(e=>e.hp>0);
  if (est.jugador.hp<=0||vivos.length===0) { COMBATES.delete(uid); await interaction.update({ content:'Combate terminado.', embeds:[], components:[] }); return true; }

  if (id==='train_atacar_cac'||id==='train_atacar_dist') {
    // Consumir munición si es ataque a distancia
    if (id==='train_atacar_dist' && est.esDist) {
      const char = getCharacter(uid);
      if (char) {
        const restante = gastarMunicion(char, est.arma.nombre, uid);
        // Actualizar el arma en el estado del combate con la munición restante
        const munInfo = tieneMunicion({ ...char, inventory: char.inventory }, est.arma.nombre);
        est.arma.sinMunicion = !munInfo.tiene;
        est.arma.municion = munInfo.cantidad;
      }
    }
    atacarJugador(est, id==='train_atacar_cac'?'cac':'dist');
    const av=est.enemigos.filter(e=>e.hp>0);
    if (av.length>0&&est.jugador.hp>0&&est.esTutorial) est.log=[...est.log,...atacarEnemigos(est)];
    est.ronda++;
  } else if (id==='train_defender') {
    est.log=['🛡️ Defiendes. +2 CA este turno.'];
    if (est.esTutorial) est.log=[...est.log,...atacarEnemigos(est,2)];
    est.ronda++;
  }

  const vivosP=est.enemigos.filter(e=>e.hp>0), fin=est.jugador.hp<=0||vivosP.length===0;
  if (est.jugador.hp<=0) est.log.push('💀 ¡Has caído!');
  if (vivosP.length===0) {
    // Logros de victoria
    try {
      const char = est._charRef || getCharacter(uid);
      if (char) {
        await otorgarLogro(est._client||null, est._guildId||null, uid, char.name, 'matar_enemigo');
      }
    } catch {}
    est.log.push('🎉 ¡Victoria!');
    // Recuperar armas arrojadizas tras la victoria
    if (est._armaArrojadizaUsada && est._charRef && (est._arrojadasLanzadas||0) > 0) {
      const char     = est._charRef;
      const inv      = [...(char.inventory||[])];
      const idxRec   = inv.findIndex(i => i.nombre === est.arma.nombre);
      const cantRec  = est._arrojadasLanzadas;
      if (idxRec !== -1) {
        inv[idxRec] = { ...inv[idxRec], cantidad: (inv[idxRec].cantidad||0) + cantRec };
      } else {
        inv.push({ nombre: est.arma.nombre, cantidad: cantRec, peso:1, precio:0, categoria:'Equipo inicial' });
      }
      const { updateCharacter } = require('../db/characterStore.js');
      updateCharacter(char._uid||'', { inventory: inv });
      char.inventory = inv;
      est.log.push('🔄 Recuperas **' + cantRec + '** ' + est.arma.nombre + (cantRec>1?'s':'') + ' del campo de batalla.');
    }
  }
  if (fin) COMBATES.delete(uid);

  const botones=fin ? new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('train_salir').setLabel('🚪 Salir').setStyle(ButtonStyle.Secondary)) : buildBotones(est);
  await interaction.update({ embeds:[buildEmbed(est)], components:[botones] });
  return true;
}

module.exports = { cmdEntrenar, handleTrainingInteraction };
