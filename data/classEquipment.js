// Equipo inicial por clase (D&D 5e PHB)
// Formato: array de "grupos de elección"
// Cada grupo es:
//   { tipo: 'elegir', opciones: [...] }  → el jugador elige UNA de las opciones
//   { tipo: 'fijo', items: [...] }       → se da automáticamente
// Cada ítem: { nombre, cantidad?, descripcion? }

const EQUIPO_INICIAL_CLASE = {
  'Artificiero': {
    grupos: [
      { tipo:'fijo', items:[
        { nombre:'Armadura de cuero de trabajo', descripcion:'Hecha de materiales robustos' },
        { nombre:'Ballesta ligera', cantidad:1 },
        { nombre:'Virotes de ballesta', cantidad:20 },
        { nombre:'Bolsa de componentes' },
      ]},
      { tipo:'elegir', label:'Arma secundaria', opciones:[
        [{ nombre:'Cualquier arma sencilla', descripcion:'A tu elección' }],
        [{ nombre:'Cuchillo de trabajo', cantidad:2 }],
      ]},
      { tipo:'elegir', label:'Herramientas', opciones:[
        [{ nombre:'Herramientas de ladrón' }],
        [{ nombre:'Herramientas de hojalatero' }],
        [{ nombre:'Suministros de alquimia' }],
      ]},
    ],
    dinero: '5d4 × 10',
  },

  'Bárbaro': {
    grupos: [
      { tipo:'elegir', label:'Arma principal', opciones:[
        [{ nombre:'Hacha grande' }],
        [{ nombre:'Cualquier arma marcial cuerpo a cuerpo', descripcion:'A tu elección' }],
      ]},
      { tipo:'elegir', label:'Armas secundarias', opciones:[
        [{ nombre:'Hachas de mano', cantidad:2 }],
        [{ nombre:'Cualquier arma sencilla', descripcion:'A tu elección' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Paquete de explorador' },
        { nombre:'Jabalinas', cantidad:4 },
      ]},
    ],
    dinero: '2d4 × 10',
  },

  'Bardo': {
    grupos: [
      { tipo:'elegir', label:'Arma principal', opciones:[
        [{ nombre:'Estoque' }],
        [{ nombre:'Espada larga' }],
        [{ nombre:'Cualquier arma sencilla', descripcion:'A tu elección' }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Kit de diplomático' }],
        [{ nombre:'Equipo de actor' }],
      ]},
      { tipo:'elegir', label:'Instrumento musical', opciones:[
        [{ nombre:'Laúd' }],
        [{ nombre:'Lira' }],
        [{ nombre:'Flauta' }],
        [{ nombre:'Tambor' }],
        [{ nombre:'Cuerno' }],
        [{ nombre:'Cualquier instrumento musical', descripcion:'A tu elección' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Armadura de cuero' },
        { nombre:'Daga' },
      ]},
    ],
    dinero: '5d4 × 10',
  },

  'Clérigo': {
    grupos: [
      { tipo:'elegir', label:'Arma principal', opciones:[
        [{ nombre:'Maza' }],
        [{ nombre:'Martillo de guerra', descripcion:'Solo con competencia en armaduras medias' }],
      ]},
      { tipo:'elegir', label:'Armadura', opciones:[
        [{ nombre:'Armadura de escamas' }],
        [{ nombre:'Armadura de cuero' }],
        [{ nombre:'Cota de mallas', descripcion:'Solo si tienes competencia' }],
      ]},
      { tipo:'elegir', label:'Arma o escudo adicional', opciones:[
        [{ nombre:'Ballesta ligera' }, { nombre:'Virotes de ballesta', cantidad:20 }],
        [{ nombre:'Cualquier arma sencilla', descripcion:'A tu elección' }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Paquete de sacerdote' }],
        [{ nombre:'Paquete de explorador' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Escudo' },
        { nombre:'Símbolo sagrado' },
      ]},
    ],
    dinero: '5d4 × 10',
  },

  'Druida': {
    grupos: [
      { tipo:'elegir', label:'Escudo o armadura', opciones:[
        [{ nombre:'Escudo de madera' }],
        [{ nombre:'Cualquier arma sencilla', descripcion:'A tu elección' }],
      ]},
      { tipo:'elegir', label:'Arma principal', opciones:[
        [{ nombre:'Hoz' }],
        [{ nombre:'Cualquier arma sencilla marcial', descripcion:'A tu elección' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Armadura de cuero' },
        { nombre:'Paquete de explorador' },
        { nombre:'Foco druídico' },
      ]},
    ],
    dinero: '2d4 × 10',
  },

  'Guerrero': {
    grupos: [
      { tipo:'elegir', label:'Armadura', opciones:[
        [{ nombre:'Cota de mallas' }],
        [{ nombre:'Armadura de cuero' }, { nombre:'Arco largo' }, { nombre:'Flechas', cantidad:20 }],
      ]},
      { tipo:'elegir', label:'Armas', opciones:[
        [{ nombre:'Arma marcial' }, { nombre:'Escudo' }],
        [{ nombre:'Armas marciales', cantidad:2 }],
      ]},
      { tipo:'elegir', label:'Arma secundaria', opciones:[
        [{ nombre:'Ballesta ligera' }, { nombre:'Virotes de ballesta', cantidad:20 }],
        [{ nombre:'Hachas de mano', cantidad:2 }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Paquete de explorador' }],
        [{ nombre:'Paquete de mazmorras' }],
      ]},
    ],
    dinero: '5d4 × 10',
  },

  'Mago': {
    grupos: [
      { tipo:'elegir', label:'Arma principal', opciones:[
        [{ nombre:'Bastón de cuarzo' }],
        [{ nombre:'Daga' }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Bolsa de componentes' }],
        [{ nombre:'Foco arcano' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Paquete de estudiante' },
        { nombre:'Libro de hechizos' },
      ]},
    ],
    dinero: '4d4 × 10',
  },

  'Monje': {
    grupos: [
      { tipo:'elegir', label:'Arma', opciones:[
        [{ nombre:'Lanza corta' }],
        [{ nombre:'Cualquier arma sencilla', descripcion:'A tu elección' }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Paquete de mazmorras' }],
        [{ nombre:'Paquete de explorador' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Dardos', cantidad:10 },
      ]},
    ],
    dinero: '5d4',
  },

  'Paladín': {
    grupos: [
      { tipo:'elegir', label:'Arma principal', opciones:[
        [{ nombre:'Arma marcial' }, { nombre:'Escudo' }],
        [{ nombre:'Armas marciales', cantidad:2 }],
      ]},
      { tipo:'elegir', label:'Arma secundaria', opciones:[
        [{ nombre:'Jabalinas', cantidad:5 }],
        [{ nombre:'Cualquier arma sencilla cuerpo a cuerpo', descripcion:'A tu elección' }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Paquete del sacerdote' }],
        [{ nombre:'Paquete de explorador' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Cota de mallas' },
        { nombre:'Símbolo sagrado' },
      ]},
    ],
    dinero: '5d4 × 10',
  },

  'Pícaro': {
    grupos: [
      { tipo:'elegir', label:'Arma principal', opciones:[
        [{ nombre:'Estoque' }],
        [{ nombre:'Espada corta' }],
      ]},
      { tipo:'elegir', label:'Arma secundaria o distancia', opciones:[
        [{ nombre:'Arco corto' }, { nombre:'Flechas', cantidad:20 }],
        [{ nombre:'Espada corta' }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Paquete de ladrón' }],
        [{ nombre:'Paquete de mazmorras' }],
        [{ nombre:'Paquete de explorador' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Armadura de cuero' },
        { nombre:'Dagas', cantidad:2 },
        { nombre:'Herramientas de ladrón' },
      ]},
    ],
    dinero: '4d4 × 10',
  },

  'Explorador': {
    grupos: [
      { tipo:'elegir', label:'Armadura', opciones:[
        [{ nombre:'Cota de mallas' }],
        [{ nombre:'Armadura de cuero' }, { nombre:'Arco largo' }, { nombre:'Flechas', cantidad:20 }],
      ]},
      { tipo:'elegir', label:'Armas', opciones:[
        [{ nombre:'Espadas cortas', cantidad:2 }],
        [{ nombre:'Armas sencillas cuerpo a cuerpo', cantidad:2, descripcion:'A tu elección' }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Paquete de explorador' }],
        [{ nombre:'Paquete de mazmorras' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Arco corto' },
        { nombre:'Flechas', cantidad:20 },
        { nombre:'Carcaj' },
      ]},
    ],
    dinero: '5d4 × 10',
  },

  'Hechicero': {
    grupos: [
      { tipo:'elegir', label:'Arma principal', opciones:[
        [{ nombre:'Ballesta ligera' }, { nombre:'Virotes de ballesta', cantidad:20 }],
        [{ nombre:'Cualquier arma sencilla', descripcion:'A tu elección' }],
      ]},
      { tipo:'elegir', label:'Foco o bolsa', opciones:[
        [{ nombre:'Bolsa de componentes' }],
        [{ nombre:'Foco arcano' }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Paquete de mazmorras' }],
        [{ nombre:'Paquete de explorador' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Dagas', cantidad:2 },
      ]},
    ],
    dinero: '3d4 × 10',
  },

  'Brujo': {
    grupos: [
      { tipo:'elegir', label:'Arma ligera', opciones:[
        [{ nombre:'Ballesta ligera' }, { nombre:'Virotes de ballesta', cantidad:20 }],
        [{ nombre:'Cualquier arma sencilla', descripcion:'A tu elección' }],
      ]},
      { tipo:'elegir', label:'Foco', opciones:[
        [{ nombre:'Bolsa de componentes' }],
        [{ nombre:'Foco arcano' }],
      ]},
      { tipo:'elegir', label:'Equipo de aventura', opciones:[
        [{ nombre:'Paquete de estudiante' }],
        [{ nombre:'Paquete de mazmorras' }],
      ]},
      { tipo:'fijo', items:[
        { nombre:'Armadura de cuero' },
        { nombre:'Cualquier arma sencilla', descripcion:'A tu elección' },
        { nombre:'Dagas', cantidad:2 },
      ]},
    ],
    dinero: '4d4 × 10',
  },
};

// Parsear la fórmula de dinero: "5d4 × 10" → tirar dados y multiplicar
function tirarDineroCombate(formula) {
  const m = formula.match(/(\d+)d(\d+)\s*[x×]?\s*(\d+)?/);
  if (!m) return { total: 10, formula, dados: [10], mult: 1 };
  const [, nd, lados, mult] = m;
  const dados = [];
  for (let i = 0; i < parseInt(nd); i++) dados.push(Math.floor(Math.random()*parseInt(lados))+1);
  const subtotal = dados.reduce((a,b)=>a+b, 0);
  const multiplicador = mult ? parseInt(mult) : 1;
  return { total: subtotal * multiplicador, formula, dados, mult: multiplicador };
}

module.exports = { EQUIPO_INICIAL_CLASE, tirarDineroCombate };
