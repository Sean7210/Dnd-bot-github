// ── handlers/uniqueWeaponsPanel.js ────────────────────────────────────────────
// Armas únicas del DM — definidas por el DM y entregadas por el vale especial
//
//  /dm-arma-unica-añadir nombre daño propiedades descripcion
//  /dm-arma-unica-listar
//  /dm-arma-unica-eliminar id
// ─────────────────────────────────────────────────────────────────────────────
const { EmbedBuilder } = require('discord.js');
const { getWeapons, addWeapon, removeWeapon } = require('../db/uniqueWeaponsStore.js');
const { getArmaAleatoriaClase, getArmaAleatoria, ARMAS_UNICAS, getArmasClase } = require('../data/uniqueWeapons.js');
const { ARMAS_DORADAS, getArmaDoradaAleatoria } = require('../data/goldenWeapons.js');
const { getCharacter } = require('../db/characterStore.js');
const { isDM } = require('../utils/isDM.js');

async function cmdDmArmaUnicaAñadir(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const nombre      = interaction.options.getString('nombre');
  const daño        = interaction.options.getString('daño');
  const propiedades = interaction.options.getString('propiedades') || '—';
  const descripcion = interaction.options.getString('descripcion') || '';

  addWeapon({ nombre, daño, propiedades, descripcion, addedBy: interaction.user.id, fecha: new Date().toISOString() });

  const weapons = getWeapons();
  await interaction.reply({
    embeds:[new EmbedBuilder()
      .setTitle('⚔️ Arma única añadida')
      .setColor(0xFF8C00)
      .setDescription(`**${nombre}** añadida al pool de armas únicas (${weapons.length} total).\nDaño: ${daño} | Props: ${propiedades}`)],
    ephemeral:true,
  });
}

async function cmdDmArmaUnicaListar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const pool = getWeapons();
  const clase = interaction.options.getString('clase');

  // Si hay pool del DM, mostrarlo
  if (pool.length > 0) {
    const lista = pool.map((w,i) =>
      `**${i+1}.** ${w.nombre} — ${w.daño} | ${w.propiedades || '—'}`
    ).join('\n');
    await interaction.reply({
      embeds:[new EmbedBuilder()
        .setTitle('⚔️ Pool de armas únicas del DM')
        .setColor(0xFF8C00)
        .setDescription(lista.slice(0,4000))],
      ephemeral:true,
    });
    return;
  }

  // Sin pool del DM: mostrar catálogo predefinido por clase
  const clases = clase ? [clase] : Object.keys(ARMAS_UNICAS);
  const embeds = [];

  for (const cl of clases.slice(0,5)) {
    const armas = ARMAS_UNICAS[cl] || [];
    if (!armas.length) continue;
    const lista = armas.map((a,i) => `**${i+1}.** ${a.nombre} — ${a.daño}`).join('\n');
    embeds.push(new EmbedBuilder()
      .setTitle(`⚔️ Armas únicas — ${cl}`)
      .setColor(0xFF8C00)
      .setDescription(lista.slice(0,4000)));
  }

  if (!embeds.length)
    return interaction.reply({ content:'❌ Clase no encontrada.', ephemeral:true });

  await interaction.reply({ embeds: embeds.slice(0,10), ephemeral:true });
}

async function cmdDmArmaUnicaEliminar(interaction) {
  if (!isDM(interaction.member))
    return interaction.reply({ content:'❌ Solo el DM.', ephemeral:true });

  const idx = (interaction.options.getInteger('id') || 1) - 1;
  const weapons = getWeapons();

  if (idx < 0 || idx >= weapons.length)
    return interaction.reply({ content:`❌ ID inválido. Hay ${weapons.length} armas (1-${weapons.length}).`, ephemeral:true });

  const nombre = weapons[idx].nombre;
  removeWeapon(idx);
  await interaction.reply({ content:`✅ **${nombre}** eliminada del pool.`, ephemeral:true });
}

// Obtener arma aleatoria — prioriza la clase del personaje si se proporciona
// Primero busca en el pool del DM; si está vacío usa las armas predefinidas por clase
function getRandomUniqueWeapon(clase = null) {
  const pool = getWeapons();
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (clase) return getArmaAleatoriaClase(clase);
  return getArmaAleatoria();
}

// Vale dorado: 1 en 10.000 (se llama desde creation.js tras el vale especial)
function getArmaDorada(clase = null) {
  return getArmaDoradaAleatoria(clase);
}

module.exports = { cmdDmArmaUnicaAñadir, cmdDmArmaUnicaListar, cmdDmArmaUnicaEliminar, getRandomUniqueWeapon, getArmaDorada };
