// ── handlers/creation.js ─────────────────────────────────────────────────────
// Flujo de creación NORMAL: nombre → raza → clase → trasfondo → alineamiento → stats → habilidades → idiomas → equipo
// Modo físico → creationFisico.js
// Equipo inicial → equipoInicial.js
// ─────────────────────────────────────────────────────────────────────────────

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

const { RACES }       = require('../data/races.js');
const { CLASSES }     = require('../data/classes.js');
const { BACKGROUNDS } = require('../data/backgrounds.js');
const { IDIOMAS_POR_RAZA, IDIOMAS_ELECCION_RAZA, IDIOMAS_POR_TRASFONDO, TODOS_IDIOMAS } = require('../data/languages.js');

const { statMod, calcHP, applyRacialBonuses, getCategoryEmoji, buildCharacterEmbed, safeUpdate, rollDice, racaNecesitaEleccionBonus, getBonusAnyInfo } = require('../utils/helpers.js');
const { getSession, deleteSession } = require('../utils/sessions.js');
const { saveCharacter } = require('../utils/characterStore.js');
const { showStatsAssign, handleStatsAssignInteraction } = require('./statsAssign.js');

// Módulos separados
const { showWealthRoll, showFinalCharacter, handleEquipoInteraction } = require('./equipoInicial.js');
const { startFisico, handleFisicoInteraction } = require('./creationFisico.js');

// Helper: evita description:'' que Discord rechaza
function safeDesc(s, max=100) { const t=(s||'').trim().slice(0,max); return t||undefined; }


async function startCharacterCreation(interaction, modoFisico = false) {
  const userId  = interaction.user.id;
  const session = getSession(userId);
  session.character = {
    name: '', race: '', class: '', subclass: '', background: '',
    alignment: '', skills: [], languages: [], inventory: [], money: {},
    level: 1, _modoPapel: modoFisico,
  };
  session.step = 'name';

  if (modoFisico) {
    // Modo físico: mostrar pantalla de selección de stats por select
    const embed = new EmbedBuilder()
      .setTitle('📜 Personaje de papel')
      .setColor(0x8B4513)
      .setDescription(
        'Esta opción es para jugadores que **ya tienen su personaje creado en papel** y quieren registrarlo en el bot.\n\n' +
        'Primero selecciona tu raza y clase, luego introducirás tus estadísticas con selects.\n\n' +
        '⚠️ *El DM puede verificar las estadísticas en cualquier momento.*'
      );
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('papel_confirmar').setLabel('▶️ Continuar').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('papel_cancelar').setLabel('✖ Cancelar').setStyle(ButtonStyle.Secondary),
    );
    await safeUpdate(interaction, { embeds: [embed], components: [row] });
    return;
  }

  // Modo normal: pedir nombre con modal
  const modal = new ModalBuilder().setCustomId('modal_name').setTitle('⚔️ Crear Personaje D&D 5e');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('char_name').setLabel('Nombre del personaje')
        .setStyle(TextInputStyle.Short).setRequired(true).setMinLength(2).setMaxLength(40)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('char_backstory').setLabel('Historia de fondo (opcional)')
        .setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(500)
    ),
  );
  await interaction.showModal(modal);
}

// ─── PASO 0B: Stats en papel con selects 3-18 ────────────────────────────────

async function showRaceCategorySelect(interaction, char) {
  const categories = [...new Set(Object.values(RACES).map(r => r.category))];
  const catCounts  = {};
  Object.values(RACES).forEach(r => { catCounts[r.category] = (catCounts[r.category]||0)+1; });
  const embed = new EmbedBuilder()
    .setTitle('Paso 1: Elige tu raza')
    .setColor(0x2ECC71)
    .setDescription('La raza determina tus bonificaciones, rasgos raciales, velocidad e idiomas.\n\n' +
      categories.map(cat => getCategoryEmoji(cat) + ' **' + cat + '** — ' + catCounts[cat] + ' razas').join('\n'))
    .setFooter({ text: 'Mas de 60 razas de todas las fuentes oficiales' });
  await safeUpdate(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_race_category')
        .setPlaceholder('Categoria de raza...')
        .addOptions(categories.map(cat => ({
          label: getCategoryEmoji(cat) + ' ' + cat,
          description: catCounts[cat] + ' razas disponibles',
          value: cat,
        })))
    )],
  });
}

// ─── PASO 1B: Raza específica ─────────────────────────────────────────────────
async function showRaceSelect(interaction, category) {
  const razas   = Object.entries(RACES).filter(([, r]) => r.category === category);
  const preview = razas.slice(0,5).map(([name, r]) =>
    '**' + name + '** — ' + (r.description || r.desc || '')
  ).join('\n');
  const embed = new EmbedBuilder()
    .setTitle('Paso 1: Raza — ' + getCategoryEmoji(category) + ' ' + category)
    .setColor(0x2ECC71)
    .setDescription('Elige tu raza. Hay **' + razas.length + '** opciones.\n\n' + preview)
    .setFooter({ text: 'Las descripciones completas aparecen en el select' });
  await safeUpdate(interaction, {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_race')
          .setPlaceholder('Elige raza...')
          .addOptions(razas.slice(0,25).map(([name, r]) => ({
            label: name,
            description: safeDesc(r.description || r.desc, 100),
            value: name,
          })))
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('back_to_race_category').setLabel('Categorias').setStyle(ButtonStyle.Secondary)
      ),
    ],
  });
}

// ─── PASO 2: Clase ────────────────────────────────────────────────────────────
async function showClassSelection(interaction, char) {
  const clasesList = Object.entries(CLASSES).slice(0,13);
  const preview    = clasesList.slice(0,5).map(([name, cls]) =>
    (cls.emoji||'') + ' **' + name + '** — ' + (cls.description || cls.desc || '')
  ).join('\n');
  const embed = new EmbedBuilder()
    .setTitle('Paso 2: Elige tu clase')
    .setColor(0xE74C3C)
    .setDescription('La clase define tus habilidades y estilo de combate.\n\n' + preview + '\n*...y mas en el menu*')
    .addFields({ name: 'Consejo', value: 'Cada clase tiene un dado de golpe, estadistica principal y habilidades unicas.', inline: false })
    .setFooter({ text: char && char.race ? 'Raza elegida: ' + char.race : 'Elige con sabiduria' });
  await safeUpdate(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_class')
        .setPlaceholder('Elige clase...')
        .addOptions(clasesList.map(([name, cls]) => ({
          label: (cls.emoji||'') + ' ' + name,
          description: safeDesc(cls.description || cls.desc, 100),
          value: name,
        })))
    )],
  });
}

// ─── PASO 2B: Subclase ────────────────────────────────────────────────────────
async function showSubclassSelection(interaction, char) {
  const cls      = CLASSES[char.class];
  const subsRaw  = cls.subclasses || {};
  const subsList = Array.isArray(subsRaw)
    ? subsRaw.map(s => [s, {}])
    : Object.entries(subsRaw);
  const preview = subsList.slice(0,4).map(([name, data]) =>
    '**' + name + '** — ' + (data.description || data.desc || '')
  ).join('\n');
  const embed = new EmbedBuilder()
    .setTitle('Paso 2B: Subclase de ' + char.class)
    .setColor(0xE74C3C)
    .setDescription('Subclases de **' + char.class + '** (se desbloquean al nivel ' + (cls.subclassLevel||3) + ').\n\n' + preview)
    .setFooter({ text: char.class + ' — Elige tu especializacion' });
  await safeUpdate(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_subclass')
        .setPlaceholder('Elige subclase...')
        .addOptions(subsList.slice(0,25).map(([name, data]) => ({
          label: name,
          description: safeDesc(data.description || data.desc, 100),
          value: name,
        })))
    )],
  });
}

// ─── PASO 3: Trasfondo ───────────────────────────────────────────────────────
async function showBackgroundSelection(interaction) {
  const bgList  = Object.entries(BACKGROUNDS);
  const preview = bgList.slice(0,5).map(([name, b]) =>
    '**' + name + '** — ' + (b.featureDesc || b.desc || '')
  ).join('\n');
  const embed = new EmbedBuilder()
    .setTitle('Paso 3: Trasfondo')
    .setColor(0x9B59B6)
    .setDescription('El trasfondo define quien eras antes de ser aventurero. Da habilidades, herramientas, idiomas y equipo inicial.\n\n' + preview + '\n*...y mas en el menu*')
    .setFooter({ text: 'Tu trasfondo tambien otorga dinero inicial en la Opcion A del equipo' });
  await safeUpdate(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_background')
        .setPlaceholder('Elige trasfondo...')
        .addOptions(bgList.slice(0,25).map(([name, b]) => ({
          label: name,
          description: safeDesc(b.feature || b.featureDesc || b.desc, 100),
          value: name,
        })))
    )],
  });
}

// ─── PASO 4: Alineamiento ────────────────────────────────────────────────────
async function showAlignmentSelection(interaction) {
  const alineamientos = [
    'Legal Bueno','Neutral Bueno','Caótico Bueno',
    'Legal Neutral','Neutral Verdadero','Caótico Neutral',
    'Legal Malvado','Neutral Malvado','Caótico Malvado',
  ];
  const embed = new EmbedBuilder()
    .setTitle('⚖️ Paso 4: Alineamiento')
    .setColor(0x3498DB);

  await safeUpdate(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_alignment')
        .setPlaceholder('Elige alineamiento...')
        .addOptions(alineamientos.map(a => ({ label: a, value: a })))
    )],
  });
}


// ─── PASO 4B: Selección de bonus 'any' (razas como Semielfo, Búhonido, etc.) ──
async function showBonusAnySelect(interaction, char) {
  const bonusInfo = getBonusAnyInfo(char.race);
  if (!bonusInfo.length) {
    await showStatsRoller(interaction, char);
    return;
  }

  const STATS = ['STR','DEX','CON','INT','WIS','CHA'];
  const STAT_NAMES = { STR:'💪 Fuerza', DEX:'🏃 Destreza', CON:'🫀 Constitución', INT:'🧠 Inteligencia', WIS:'🦉 Sabiduría', CHA:'✨ Carisma' };

  const session = getSession(interaction.user.id);
  session._bonusAnyPendiente = bonusInfo.map(b => ({ ...b, elegido: null }));

  const primerBonus = bonusInfo[0];

  const embed = new EmbedBuilder()
    .setTitle('🧬 Bonus racial — Elige estadística')
    .setColor(0x2ECC71)
    .setDescription(
      `Tu raza **${char.race}** te da **+${primerBonus.valor}** a una estadística de tu elección.

` +
      (bonusInfo.length > 1 ? `*(Después elegirás los ${bonusInfo.length} bonos, uno a uno)*

` : '') +
      'Elige a qué estadística aplicar este bonus:'
    );

  await safeUpdate(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_bonus_any_0')
        .setPlaceholder('Elige una estadística...')
        .addOptions(STATS.map(s => ({ label: STAT_NAMES[s], value: s })))
    )],
  });
}

// ─── PASO 5: Estadísticas → delegar a statsAssign ────────────────────────────
async function showStatsRoller(interaction, char) {
  const session = getSession(interaction.user.id);
  delete session.statsPool;
  delete session.statsAssigned;
  delete session.statsPicking;
  session.rerollsTotal = 1;
  session.rerollsIndiv = 3;
  await showStatsAssign(interaction, interaction.user.id);
}

// ─── PASO 6: Habilidades ─────────────────────────────────────────────────────
async function showSkillsSelection(interaction, char) {
  const classData = CLASSES[char.class] || {};
  const bgSkills  = BACKGROUNDS[char.background]?.skills || [];
  const available = (classData.skills || []).filter(s => !bgSkills.includes(s)).slice(0, 25);
  const numSkills  = classData.numSkills || 2;

  const embed = new EmbedBuilder()
    .setTitle('🎯 Paso 6: Competencias de Habilidad')
    .setColor(0x20B2AA)
    .setDescription(`Elige **${numSkills}** habilidades de tu clase.\n\n✅ **Del trasfondo:** ${bgSkills.join(', ') || '(ninguna)'}`);

  if (!available.length) {
    // Sin opciones: pasar directo a idiomas
    char.skills = bgSkills;
    await showLanguageSelection(interaction, char);
    return;
  }

  await safeUpdate(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_skills')
        .setPlaceholder(`Elige ${numSkills} habilidades...`)
        .setMinValues(Math.min(numSkills, available.length))
        .setMaxValues(Math.min(numSkills, available.length))
        .addOptions(available.map(s => ({ label: s, value: s })))
    )],
  });
}

// ─── PASO 7: Idiomas ─────────────────────────────────────────────────────────
async function showLanguageSelection(interaction, char) {
  const idiomasRaza    = IDIOMAS_POR_RAZA[char.race]       || ['Común'];
  const extraRaza      = IDIOMAS_ELECCION_RAZA[char.race]  || 0;
  const extraTrasfondo = IDIOMAS_POR_TRASFONDO[char.background] || 0;
  const totalExtra     = extraRaza + extraTrasfondo;
  const idiomasBase    = [...new Set(idiomasRaza)];

  if (totalExtra === 0) {
    char.languages = idiomasBase;
    await showWealthRoll(interaction, char);
    return;
  }

  const disponibles = (TODOS_IDIOMAS || [])
    .filter(l => !idiomasBase.includes(l) && l !== 'Uno a elección')
    .slice(0, 25);

  const embed = new EmbedBuilder()
    .setTitle('🗣️ Paso 7: Idiomas')
    .setColor(0x4B0082)
    .setDescription(
      `**Idiomas automáticos:** ${idiomasBase.join(', ')}\n\n` +
      `Puedes elegir **${totalExtra} idioma${totalExtra > 1 ? 's' : ''} adicional${totalExtra > 1 ? 'es' : ''}**` +
      (extraTrasfondo > 0 ? ` (${extraRaza} de tu raza + ${extraTrasfondo} de tu trasfondo)` : '') + ':'
    );

  if (!disponibles.length) {
    char.languages = idiomasBase;
    await showWealthRoll(interaction, char);
    return;
  }

  await safeUpdate(interaction, {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_languages')
        .setPlaceholder(`Elige ${totalExtra} idioma${totalExtra > 1 ? 's' : ''}...`)
        .setMinValues(Math.min(totalExtra, disponibles.length))
        .setMaxValues(Math.min(totalExtra, disponibles.length))
        .addOptions(disponibles.map(l => ({ label: l, value: l })))
    )],
  });
}


async function handleCreationInteraction(interaction) {
  const userId  = interaction.user.id;
  const session = getSession(userId);

  // Delegar a equipoInicial si es una interacción de equipo
  const equipoHandled = await handleEquipoInteraction(interaction);
  if (equipoHandled) return true;

  // Delegar a creationFisico si el personaje está en modo físico
  const fisicoHandled = await handleFisicoInteraction(interaction);
  if (fisicoHandled) return true;

  // Stats assign tiene prioridad
  if (session?.statsPool !== undefined) {
    const handled = await handleStatsAssignInteraction(interaction);
    if (handled) return true;
  }

  // INICIO: Botones de inicio de creación
  if (interaction.isButton() && interaction.customId === 'start_character_papel') {
    await startFisico(interaction);
    return true;
  }
  if (interaction.isButton() && interaction.customId === 'papel_cancelar') {
    deleteSession(userId);
    await interaction.update({ content: 'Operación cancelada.', embeds: [], components: [] });
    return true;
  }

  // Selects de stats en papel (legacy — ahora en creationFisico)
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('papel_stat_')) {
    const stat = interaction.customId.replace('papel_stat_', '');
    if (!session.statsPapel) session.statsPapel = { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 };
    session.statsPapel[stat] = parseInt(interaction.values[0]);
    if (stat === 'WIS' || stat === 'CHA') await showPapelStatsModalParte2(interaction, session);
    else await showPapelStatsModal(interaction);
    return true;
  }

  // Modal nombre normal
  if (interaction.isModalSubmit() && interaction.customId === 'modal_name') {
    session.character.name      = interaction.fields.getTextInputValue('char_name');
    session.character.backstory = interaction.fields.getTextInputValue('char_backstory') || '';
    session.step = 'race';
    await showRaceCategorySelect(interaction, session.character);
    return true;
  }

  // Modal nombre para papel (cuando confirma stats sin tener nombre)
  if (interaction.isModalSubmit() && interaction.customId === 'modal_papel_nombre') {
    session.character.name      = interaction.fields.getTextInputValue('papel_name').trim();
    session.character.backstory = interaction.fields.getTextInputValue('papel_backstory') || '';
    const sp = session.statsPapel || { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 };
    const baseStats  = { STR:sp.STR, DEX:sp.DEX, CON:sp.CON, INT:sp.INT, WIS:sp.WIS, CHA:sp.CHA };
    const finalStats = applyRacialBonuses(baseStats, session.character.race || 'Humano');
    session.character.rolledStats = baseStats;
    session.character.finalStats  = finalStats;
    session.character.stats       = finalStats;
    session.character._modoPapel  = true;
    delete session.statsPapel;
    await showSkillsSelection(interaction, session.character);
    return true;
  }

  // Botones
  if (interaction.isButton()) {
    switch (interaction.customId) {
      case 'start_character':
        await startCharacterCreation(interaction);
        return true;
      case 'start_character_papel':
        await startCharacterCreation(interaction, true);
        return true;
      case 'papel_confirmar':
        await showRaceCategorySelect(interaction, session.character);
        return true;
      case 'papel_cancelar':
        deleteSession(userId);
        await safeUpdate(interaction, { content: 'Operación cancelada.', embeds: [], components: [] });
        return true;
      case 'papel_stats_parte2':
        await showPapelStatsModalParte2(interaction, session);
        return true;
      case 'papel_stats_volver':
        await showPapelStatsModal(interaction);
        return true;
      case 'papel_stats_confirmar': {
        if (!session.statsPapel) session.statsPapel = { STR:10, DEX:10, CON:10, INT:10, WIS:10, CHA:10 };
        const sp = session.statsPapel;
        if (!session.character?.name) {
          // Pedir nombre
          const modal = new ModalBuilder().setCustomId('modal_papel_nombre').setTitle('📜 Nombre del personaje');
          modal.addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('papel_name').setLabel('Nombre del personaje').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('papel_backstory').setLabel('Historia (opcional)').setStyle(TextInputStyle.Paragraph).setRequired(false)
            )
          );
          await interaction.showModal(modal);
          return true;
        }
        const baseStats  = { STR:sp.STR, DEX:sp.DEX, CON:sp.CON, INT:sp.INT, WIS:sp.WIS, CHA:sp.CHA };
        const finalStats = applyRacialBonuses(baseStats, session.character.race || 'Humano');
        session.character.rolledStats = baseStats;
        session.character.finalStats  = finalStats;
        session.character.stats       = finalStats;
        session.character._modoPapel  = true;
        delete session.statsPapel;
        await showSkillsSelection(interaction, session.character);
        return true;
      }
      case 'back_to_race_category':
        await showRaceCategorySelect(interaction, session.character);
        return true;
      case 'reroll_stats':
        await showStatsRoller(interaction, session.character);
        return true;
      case 'accept_stats':
        await showSkillsSelection(interaction, session.character);
        return true;
      case 'wealth_confirm':
        await showFinalCharacter(interaction, session.character);
        return true;
      case 'equip_opcion_a':
        await showEquipAElegir(interaction, session.character);
        return true;
      case 'equip_opcion_b': {
        const ec = session._equipChoice;
        const money = monederoVacio();
        if (ec?.riqueza) money[ec.riqueza.moneda] = ec.totalPO;
        session.character.money    = money;
        session.character.inventory = [];
        await showFinalCharacter(interaction, session.character);
        return true;
      }
      case 'equip_opcion_c': {
        const valeValor  = VALE_VALOR[session.character.class] || 100;
        const d10000000  = Math.floor(Math.random() * 10000000) + 1;
        const esDorado   = d10000000 === 1;
        const esEspecial = !esDorado && d10000000 <= 10;

        if (esDorado) {
          const arma = getArmaDorada(session.character.class);
          if (arma) {
            session.character.inventory = [{
              nombre: arma.nombre, cantidad: 1, peso: 1, precio: 0,
              daño: arma.daño, propiedades: arma.propiedades,
              descripcion: arma.desc, categoria: 'Arma Dorada', dorada: true,
            }];
            session.character.money     = monederoVacio();
            session.character._valeDorado = arma;
            await showFinalCharacter(interaction, session.character);
            return true;
          }
        }

        if (esEspecial) {
          const arma = getRandomUniqueWeapon(session.character.class);
          if (arma) {
            session.character.inventory = [{
              nombre: arma.nombre, cantidad: 1, peso: 1, precio: 0,
              daño: arma.daño, propiedades: arma.propiedades,
              descripcion: arma.descripcion, categoria: 'Arma Única', unica: true,
            }];
            session.character.money      = monederoVacio();
            session.character._valeEspecial = arma;
            await showFinalCharacter(interaction, session.character);
            return true;
          }
        }

        // Vale normal
        session.character.inventory = [{
          nombre: `Vale de Aventurero (${valeValor} PO)`,
          cantidad: 1, peso: 0, precio: valeValor, categoria: 'Vale',
        }];
        session.character.money = monederoVacio();
        await showFinalCharacter(interaction, session.character);
        return true;
      }
      case 'equip_confirmar_a': {
        const ec      = session._equipChoice;
        const elegido = session._equipElegido || {};
        const inv     = (ec?.equipoFijo || []).map(n => ({ nombre: n, cantidad: 1, peso: 0, precio: 0, categoria: 'Equipo inicial' }));
        Object.values(elegido).forEach(nombre => {
          if (nombre && !inv.find(i => i.nombre === nombre))
            inv.push({ nombre, cantidad: 1, peso: 0, precio: 0, categoria: 'Equipo inicial' });
        });
        session.character.inventory = inv;
        session.character.money     = monederoVacio();
        await showFinalCharacter(interaction, session.character);
        return true;
      }
      case 'new_character':
        deleteSession(userId);
        await safeUpdate(interaction, {
          content: '¡Listo para un nuevo personaje!', embeds: [], components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('start_character').setLabel('⚔️ Crear Personaje D&D').setStyle(ButtonStyle.Primary)
            )
          ]
        });
        return true;
      case 'share_character': {
        const embed = buildCharacterEmbed(session.character, `⚔️ Personaje de ${interaction.user.displayName}`);
        await interaction.reply({ embeds: [embed] });
        return true;
      }
      case 'export_character': {
        const char     = session.character;
        const stats    = char.finalStats || {};
        const classData = CLASSES[char.class] || {};
        const text = [
          '═══════════════════════════',
          '   FICHA D&D 5e',
          '═══════════════════════════',
          `Nombre:       ${char.name || '?'}`,
          `Raza:         ${char.race || '?'}`,
          `Clase:        ${char.class || '?'} (Nivel ${char.level || 1})`,
          `Subclase:     ${char.subclass || '(sin subclase)'}`,
          `Trasfondo:    ${char.background || '?'}`,
          `Alineamiento: ${char.alignment || '?'}`,
          '',
          '── ESTADÍSTICAS ──',
          `FUE: ${stats.STR||'?'} (${statMod(stats.STR||10)})  DES: ${stats.DEX||'?'} (${statMod(stats.DEX||10)})`,
          `CON: ${stats.CON||'?'} (${statMod(stats.CON||10)})  INT: ${stats.INT||'?'} (${statMod(stats.INT||10)})`,
          `SAB: ${stats.WIS||'?'} (${statMod(stats.WIS||10)})  CAR: ${stats.CHA||'?'} (${statMod(stats.CHA||10)})`,
          '',
          stats.CON && classData.hitDie
            ? `HP: ${calcHP(classData, stats.CON)}   CA: ${10+Math.floor((stats.DEX-10)/2)}   Vel: ${RACES[char.race]?.speed||30}ft`
            : '',
          '',
          `Competencias: ${(char.skills||[]).join(', ')}`,
          `Idiomas:      ${(char.languages||[]).join(', ')}`,
          `Dinero:       ${char.money ? Object.entries(char.money).filter(([,v])=>v>0).map(([k,v])=>v+' '+k).join(' · ') : '—'}`,
          '',
          '── HISTORIA ──',
          char.backstory || 'Sin historia',
          '═══════════════════════════',
        ].filter(l => l !== undefined).join('\n');
        await interaction.reply({ content: '```\n' + text + '\n```', ephemeral: true });
        return true;
      }
    }
  }

  // Selects
  if (interaction.isStringSelectMenu()) {
    switch (interaction.customId) {
      case 'select_race_category':
        session.character._raceCategory = interaction.values[0];
        await showRaceSelect(interaction, interaction.values[0]);
        return true;
      case 'select_race':
        session.character.race = interaction.values[0];
        if (session.character._modoPapel) {
          await showClassSelection(interaction, session.character);
        } else {
          session.step = 'class';
          await showClassSelection(interaction, session.character);
        }
        return true;
      case 'select_class':
        session.character.class = interaction.values[0];
        // La subclase se elige más tarde con /obtener-subclase cuando se alcanza el nivel
        session.step = 'background';
        await showBackgroundSelection(interaction);
        return true;
      case 'select_subclass':
        session.character.subclass = interaction.values[0];
        if (session.character._modoPapel) {
          await showBackgroundSelection(interaction);
        } else {
          session.step = 'background';
          await showBackgroundSelection(interaction);
        }
        return true;
      case 'select_background':
        session.character.background = interaction.values[0];
        if (session.character._modoPapel) {
          await showPapelStatsModal(interaction);
        } else {
          session.step = 'alignment';
          await showAlignmentSelection(interaction);
        }
        return true;
      case 'select_alignment':
        session.character.alignment = interaction.values[0];
        session.step = 'stats';
        if (racaNecesitaEleccionBonus(session.character.race)) {
          await showBonusAnySelect(interaction, session.character);
        } else {
          await showStatsRoller(interaction, session.character);
        }
        return true;
      case 'select_bonus_any_0':
      case 'select_bonus_any_1': {
        const idx   = parseInt(interaction.customId.split('_').pop());
        const pending = session._bonusAnyPendiente || [];
        if (pending[idx]) pending[idx].elegido = interaction.values[0];
        session._bonusAnyPendiente = pending;

        // Si hay más bonos por elegir
        const siguiente = pending.findIndex((b, i) => i > idx && !b.elegido);
        if (siguiente !== -1) {
          const STAT_NAMES = { STR:'💪 Fuerza', DEX:'🏃 Destreza', CON:'🫀 Constitución', INT:'🧠 Inteligencia', WIS:'🦉 Sabiduría', CHA:'✨ Carisma' };
          const STATS = ['STR','DEX','CON','INT','WIS','CHA'];
          const b = pending[siguiente];
          await safeUpdate(interaction, {
            embeds: [new EmbedBuilder().setTitle('🧬 Bonus racial — Elige estadística ' + (siguiente+1))
              .setColor(0x2ECC71)
              .setDescription('Elige a qué estadística aplicar **+' + b.valor + '**:')],
            components: [new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('select_bonus_any_' + siguiente)
                .setPlaceholder('Elige una estadística...')
                .addOptions(STATS.map(s => ({ label: STAT_NAMES[s], value: s })))
            )],
          });
        } else {
          // Todos elegidos → pasar a stats
          session.character._anyChoices = {};
          pending.forEach(b => { if (b.elegido) session.character._anyChoices[b.key] = b.elegido; });
          delete session._bonusAnyPendiente;
          await showStatsRoller(interaction, session.character);
        }
        return true;
      }
      case 'select_skills': {
        const bgSkills = BACKGROUNDS[session.character.background]?.skills || [];
        session.character.skills = [...bgSkills, ...interaction.values];
        await showLanguageSelection(interaction, session.character);
        return true;
      }
      case 'select_languages': {
        const idiomasBase = [...new Set(IDIOMAS_POR_RAZA[session.character.race] || ['Común'])];
        session.character.languages = [...idiomasBase, ...interaction.values];
        await showWealthRoll(interaction, session.character);
        return true;
      }
    }
  }

  // Selects de equipo a elegir
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('equip_elegir_')) {
    const idx = interaction.customId.split('_')[2];
    if (!session._equipElegido) session._equipElegido = {};
    session._equipElegido[idx] = interaction.values[0];
    await interaction.deferUpdate();
    return true;
  }

  return false;
}

module.exports = {
  handleCreationInteraction,
  startCharacterCreation,
  showSkillsSelection,
  showWealthRoll,
  showFinalCharacter,
};
