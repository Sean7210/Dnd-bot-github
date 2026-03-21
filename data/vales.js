// ── data/vales.js ─────────────────────────────────────────────────────────────
// Tipos de vales del servidor
// ─────────────────────────────────────────────────────────────────────────────

const TIPOS_VALE = {
  // Armas por categoría
  'Vale Arma Sencilla CaC':    { categoria:'arma', tipoArma:'Simple CaC',    emoji:'⚔️' },
  'Vale Arma Sencilla Dist':   { categoria:'arma', tipoArma:'Simple Dist',   emoji:'🏹' },
  'Vale Arma Marcial CaC':     { categoria:'arma', tipoArma:'Marcial CaC',   emoji:'🗡️' },
  'Vale Arma Marcial Dist':    { categoria:'arma', tipoArma:'Marcial Dist',  emoji:'🎯' },
  'Vale Arma Cualquiera':      { categoria:'arma', tipoArma:'cualquiera',    emoji:'⚔️' },
  // Especiales
  'Vale Objeto Mágico':        { categoria:'magico',  emoji:'✨', desc:'Canjeable por 1 objeto mágico de rareza Común o Poco Común' },
  'Vale Mejora Máxima':        { categoria:'mejora',  emoji:'⚙️', desc:'El artificiero aplicará la mejora máxima posible a un objeto' },
  'Ticket de Arma Única':      { categoria:'unico',   emoji:'🌟' },
  'Ticket Dorado':             { categoria:'dorado',  emoji:'💛' },
};

module.exports = { TIPOS_VALE };
