// ── utils/sessions.js ──────────────────────────────────────────────────────────
// Gestión de sesiones de creación de personaje en memoria

const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutos

function getSession(userId) {
  const now = Date.now();
  if (!sessions.has(userId)) {
    sessions.set(userId, { step: 'idle', character: {}, _lastActive: now });
  } else {
    sessions.get(userId)._lastActive = now;
  }
  return sessions.get(userId);
}

function deleteSession(userId) {
  sessions.delete(userId);
}

// Limpia sesiones inactivas cada 15 minutos
setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL;
  for (const [id, session] of sessions) {
    if (session._lastActive < cutoff) sessions.delete(id);
  }
}, 15 * 60 * 1000);

module.exports = { getSession, deleteSession };
