// ── utils/isDM.js ─────────────────────────────────────────────────────────────
// Función compartida para verificar si un miembro tiene rol de DM
// Usado por dmPanel, artificePanel, alchemistPanel, auctionPanel, etc.
// ─────────────────────────────────────────────────────────────────────────────

function isDM(member) {
  if (!member) return false;
  return member.roles.cache.some(r =>
    ['dungeon master','dungeon masters (dm)', 'dm', 'game master', 'gm', 'master', 'director de juego'].includes(r.name.toLowerCase())
  );
}

module.exports = { isDM };
