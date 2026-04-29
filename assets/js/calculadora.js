/* ============================================
   NOVA ENERGIA - Calculadora de caída de tensión
   Replica de la hoja Excel original
   ============================================ */

// PV WIRE (UL 4703) - Para sistemas DC fotovoltaicos
const TABLA_PVWIRE = [
  { calibre: '14',   seccion: 2.08,  diametro: 5.61,  ducto: 25,  enterrado: 25,  aire: 25,  r20: 8.279 },
  { calibre: '12',   seccion: 3.31,  diametro: 6.11,  ducto: 30,  enterrado: 30,  aire: 30,  r20: 5.213 },
  { calibre: '10',   seccion: 5.261, diametro: 6.67,  ducto: 40,  enterrado: 40,  aire: 40,  r20: 3.275 },
  { calibre: '8',    seccion: 8.367, diametro: 7.93,  ducto: 55,  enterrado: 55,  aire: 55,  r20: 2.06  },
  { calibre: '6',    seccion: 13.3,  diametro: 8.88,  ducto: 75,  enterrado: 75,  aire: 75,  r20: 1.295 },
  { calibre: '4',    seccion: 21.15, diametro: 10.07, ducto: 95,  enterrado: 95,  aire: 95,  r20: 0.8136},
  { calibre: '2',    seccion: 33.62, diametro: 11.59, ducto: 130, enterrado: 130, aire: 130, r20: 0.5118},
  { calibre: '1',    seccion: 42.4,  diametro: 13.47, ducto: 150, enterrado: 150, aire: 150, r20: 0.406 },
  { calibre: '1/0',  seccion: 53.49, diametro: 14.48, ducto: 170, enterrado: 170, aire: 170, r20: 0.3219},
  { calibre: '2/0',  seccion: 67.44, diametro: 15.61, ducto: 195, enterrado: 195, aire: 195, r20: 0.2552},
  { calibre: '3/0',  seccion: 85.02, diametro: 16.93, ducto: 225, enterrado: 225, aire: 225, r20: 0.2022},
  { calibre: '4/0',  seccion: 107.2, diametro: 18.29, ducto: 260, enterrado: 260, aire: 260, r20: 0.1604},
  { calibre: '250',  seccion: 126.7, diametro: 20.73, ducto: 290, enterrado: 290, aire: 290, r20: 0.1361},
  { calibre: '300',  seccion: 152,   diametro: 22.13, ducto: 320, enterrado: 320, aire: 320, r20: 0.1135},
  { calibre: '350',  seccion: 177,   diametro: 23.39, ducto: 350, enterrado: 350, aire: 350, r20: 0.097 },
  { calibre: '400',  seccion: 203,   diametro: 24.58, ducto: 380, enterrado: 380, aire: 380, r20: 0.0849},
  { calibre: '500',  seccion: 253,   diametro: 26.75, ducto: 430, enterrado: 430, aire: 430, r20: 0.0676},
  { calibre: '600',  seccion: 304,   diametro: 29.54, ducto: 475, enterrado: 475, aire: 475, r20: 0.0566},
  { calibre: '750',  seccion: 380,   diametro: 32.24, ducto: 535, enterrado: 535, aire: 535, r20: 0.0454},
  { calibre: '1000', seccion: 507,   diametro: 36.2,  ducto: 615, enterrado: 615, aire: 615, r20: 0.0339}
];

// SUPERFLEX (AWG) - General Cable XLPE/PVC, Cu, 90°C
const TABLA_AWG = [
  { calibre: '14',   seccion: 2.08, diametro: 5.5,  ducto: 26,  enterrado: 40,  aire: 40,   r20: 8.279 },
  { calibre: '12',   seccion: 3.31, diametro: 5.9,  ducto: 40,  enterrado: 53,  aire: 53,   r20: 5.213 },
  { calibre: '10',   seccion: 5.26, diametro: 6.6,  ducto: 51,  enterrado: 69,  aire: 69,   r20: 3.275 },
  { calibre: '8',    seccion: 8.37, diametro: 7.4,  ducto: 61,  enterrado: 108, aire: 83,   r20: 2.06  },
  { calibre: '6',    seccion: 13.3, diametro: 8.4,  ducto: 79,  enterrado: 139, aire: 110,  r20: 1.295 },
  { calibre: '4',    seccion: 21.2, diametro: 10,   ducto: 104, enterrado: 178, aire: 145,  r20: 0.8136},
  { calibre: '2',    seccion: 33.6, diametro: 11.5, ducto: 137, enterrado: 230, aire: 190,  r20: 0.5118},
  { calibre: '1',    seccion: 42.4, diametro: 12.6, ducto: 158, enterrado: 261, aire: 225,  r20: 0.406 },
  { calibre: '1/0',  seccion: 53.5, diametro: 13.7, ducto: 182, enterrado: 297, aire: 260,  r20: 0.3219},
  { calibre: '2/0',  seccion: 67.4, diametro: 15.1, ducto: 212, enterrado: 340, aire: 300,  r20: 0.2552},
  { calibre: '3/0',  seccion: 85,   diametro: 16.3, ducto: 240, enterrado: 379, aire: 345,  r20: 0.2022},
  { calibre: '4/0',  seccion: 107,  diametro: 18.2, ducto: 278, enterrado: 433, aire: 400,  r20: 0.1604},
  { calibre: '250',  seccion: 127,  diametro: 19.4, ducto: 308, enterrado: 471, aire: 445,  r20: 0.1361},
  { calibre: '350',  seccion: 177,  diametro: 22.9, ducto: 375, enterrado: 557, aire: 550,  r20: 0.097 },
  { calibre: '500',  seccion: 253,  diametro: 27.9, ducto: 473, enterrado: 684, aire: 695,  r20: 0.0676},
  { calibre: '750',  seccion: 380,  diametro: 32.9, ducto: 599, enterrado: 840, aire: 900,  r20: 0.0454},
  { calibre: '1000', seccion: 507,  diametro: 38.8, ducto: 710, enterrado: 980, aire: 1075, r20: 0.0339}
];

// RV-K FOC (mm²) - General Cable XLPE/PVC, Cu, 90°C
const TABLA_MM2 = [
  { calibre: '2.5', seccion: 2.5, diametro: 5.6,  ducto: 36,  enterrado: 36,  aire: 28,  r20: 7.98 },
  { calibre: '4',   seccion: 4,   diametro: 6.1,  ducto: 46,  enterrado: 46,  aire: 38,  r20: 4.95 },
  { calibre: '6',   seccion: 6,   diametro: 6.8,  ducto: 58,  enterrado: 58,  aire: 48,  r20: 3.30 },
  { calibre: '10',  seccion: 10,  diametro: 7.8,  ducto: 78,  enterrado: 78,  aire: 66,  r20: 1.91 },
  { calibre: '16',  seccion: 16,  diametro: 8.8,  ducto: 100, enterrado: 100, aire: 88,  r20: 1.21 },
  { calibre: '25',  seccion: 25,  diametro: 10.6, ducto: 125, enterrado: 125, aire: 115, r20: 0.78 },
  { calibre: '35',  seccion: 35,  diametro: 11.7, ducto: 150, enterrado: 150, aire: 145, r20: 0.554},
  { calibre: '50',  seccion: 50,  diametro: 13.8, ducto: 185, enterrado: 185, aire: 185, r20: 0.386},
  { calibre: '70',  seccion: 70,  diametro: 15.5, ducto: 225, enterrado: 225, aire: 235, r20: 0.272},
  { calibre: '95',  seccion: 95,  diametro: 17.3, ducto: 260, enterrado: 260, aire: 285, r20: 0.206},
  { calibre: '120', seccion: 120, diametro: 19.2, ducto: 300, enterrado: 300, aire: 335, r20: 0.161},
  { calibre: '150', seccion: 150, diametro: 21.5, ducto: 340, enterrado: 340, aire: 390, r20: 0.129},
  { calibre: '185', seccion: 185, diametro: 23.9, ducto: 380, enterrado: 380, aire: 445, r20: 0.106},
  { calibre: '240', seccion: 240, diametro: 27.1, ducto: 445, enterrado: 445, aire: 540, r20: 0.0801}
];

const ALPHA_CU = 0.00393; // coeficiente térmico del cobre (1/°C)

function getTabla(tipoSistema, sistemaCalibres) {
  if (tipoSistema === 'DC') return { tabla: TABLA_PVWIRE, nombre: 'PV WIRE (UL 4703)' };
  if (sistemaCalibres === 'AWG') return { tabla: TABLA_AWG, nombre: 'SUPERFLEX (AWG)' };
  return { tabla: TABLA_MM2, nombre: 'RV-K FOC (mm²)' };
}

function getAmpacidad(fila, metodo) {
  if (metodo === 'Ducto enterrado') return fila.ducto;
  if (metodo === 'Enterrado directo') return fila.enterrado;
  return fila.aire;
}

/**
 * Calcula caída de tensión y pérdidas para un cable dado
 * @param {object} input - parámetros del circuito
 * @returns objeto con todos los resultados
 */
function calcular(input) {
  const {
    tipoSistema,        // 'DC' o 'AC 3F'
    sistemaCalibres,    // 'AWG' o 'mm²'
    calibre,            // string (e.g. '10', '4/0')
    voltaje,            // V
    corriente,          // A
    distancia,          // m
    paralelos,          // # conductores en paralelo por polo/fase
    temperatura,        // °C
    caidaMaxDC,         // fracción (e.g. 0.02)
    caidaMaxAC,         // fracción (e.g. 0.03)
    metodo              // 'Ducto enterrado' | 'Enterrado directo' | 'Aire libre'
  } = input;

  const { tabla, nombre: nombreTabla } = getTabla(tipoSistema, sistemaCalibres);
  const fila = tabla.find(f => f.calibre === calibre);
  if (!fila) {
    return { error: `Calibre ${calibre} no encontrado en la tabla ${nombreTabla}` };
  }

  const factor = tipoSistema === 'DC' ? 2 : Math.sqrt(3);
  const corrientePorConductor = corriente / paralelos;
  const r20 = fila.r20;
  const rT = r20 * (1 + ALPHA_CU * (temperatura - 20));
  const ampacidadMetodo = getAmpacidad(fila, metodo);
  const ampacidadTotal = ampacidadMetodo * paralelos;

  const resistenciaTotal = rT * (distancia / 1000) / paralelos;
  const caidaV = factor * corrientePorConductor * (distancia / 1000) * rT;
  const porcentajeCaida = caidaV / voltaje;
  const tensionExtremo = voltaje - caidaV;

  const factorPotencia = tipoSistema === 'DC' ? 2 : 3;
  const perdidaW = factorPotencia * Math.pow(corrientePorConductor, 2) * rT * (distancia / 1000) * paralelos;
  const potenciaEntregada = tipoSistema === 'DC'
    ? voltaje * corriente
    : Math.sqrt(3) * voltaje * corriente;
  const perdidaPorcentaje = potenciaEntregada > 0 ? perdidaW / potenciaEntregada : 0;

  const caidaMax = tipoSistema === 'DC' ? caidaMaxDC : caidaMaxAC;
  const cumpleCaida = porcentajeCaida <= caidaMax;
  const cumpleAmpacidad = corrientePorConductor <= ampacidadMetodo;

  return {
    nombreTabla,
    seccion: fila.seccion,
    diametro: fila.diametro,
    ampacidadDucto: fila.ducto,
    ampacidadEnterrado: fila.enterrado,
    ampacidadAire: fila.aire,
    ampacidadMetodo,
    ampacidadTotal,
    factor,
    corrientePorConductor,
    rT,
    resistenciaTotal,
    caidaV,
    porcentajeCaida,
    tensionExtremo,
    perdidaW,
    potenciaEntregada,
    perdidaPorcentaje,
    cumpleCaida,
    cumpleAmpacidad,
    cumpleAmbos: cumpleCaida && cumpleAmpacidad,
    margenAmpacidad: ampacidadTotal - corriente,
    margenCaida: voltaje * caidaMax - caidaV,
    tensionMinimaRecomendada: voltaje * (1 - caidaMax),
    caidaMaxAplicable: caidaMax
  };
}

/**
 * Encuentra el calibre mínimo que cumple ambos criterios
 */
function calibreRecomendado(input) {
  const { tabla } = getTabla(input.tipoSistema, input.sistemaCalibres);
  for (const fila of tabla) {
    const r = calcular({ ...input, calibre: fila.calibre });
    if (r.cumpleAmbos) {
      return { calibre: fila.calibre, resultado: r };
    }
  }
  return null;
}

// Listas para los selects
function getCalibresDisponibles(tipoSistema, sistemaCalibres) {
  return getTabla(tipoSistema, sistemaCalibres).tabla.map(f => f.calibre);
}
