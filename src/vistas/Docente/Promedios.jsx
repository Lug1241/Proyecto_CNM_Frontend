
export function calcularPromedioParcial(insumo1, insumo2, evaluacion) {
  const i1 = parseFloat(insumo1) || 0;
  const i2 = parseFloat(insumo2) || 0;
  const ev = parseFloat(evaluacion) || 0;

  const ponderacion70 = ((i1 + i2) / 2) * 0.7;
  const ponderacion30 = ev * 0.3;
  const promedio = ponderacion70 + ponderacion30;

  return {
    ponderacion70,
    ponderacion30,
    promedioParcial: promedio
  };
}

export function calcularSumaComportamiento(fila, columnasComportamiento) {
  return columnasComportamiento.reduce(
    (acc, col) => acc + (parseInt(fila[col]) || 0),
    0
  );
}

export function calcularPromedioQuimestral(parcial1, parcial2, examen) {
  const p1 = parseFloat(parcial1) || 0;
  const p2 = parseFloat(parcial2) || 0;
  const promedioAcademico = (p1 + p2) / 2;

  const ponderacion70 = promedioAcademico * 0.7;
  const examenNota = parseFloat(examen) || 0;
  const ponderacion30 = examenNota * 0.3;

  const promedioFinal = ponderacion70 + ponderacion30;

  return {
    ponderacion70,
    ponderacion30,
    promedioFinal
  };
}

export function calcularPromedioComportamiento(p1, p2) {
  const c1 = parseFloat(p1) || 0;
  const c2 = parseFloat(p2) || 0;
  return (c1 + c2) / 2;
}

export function calcularPromedioAnual(q1, q2) {
  const p1 = parseFloat(q1) || 0;
  const p2 = parseFloat(q2) || 0;
  return (p1 + p2) / 2;
}

export function calcularPromedioComportamientoFinal(c1, c2) {
  const pc1 = parseFloat(c1) || 0;
  const pc2 = parseFloat(c2) || 0;
  return (pc1 + pc2) / 2;
}

export function calcularPromedioFinalConSupletorio(promAnual, examenSupletorio) {
  if (promAnual < 7 && examenSupletorio !== "") {
    return parseFloat(examenSupletorio) || 0;
  }
  return promAnual;
}

export function determinarEstado(promFinal, supletorioRendido = false) {
  if (promFinal >= 7) return "Aprobado";
  if (!supletorioRendido && promFinal >= 4) return "Supletorio";
  return "Reprobado";
}

export function calcularValoracionComportamiento(valor) {
  const truncado = Math.floor(valor);
  if (truncado === 10) return "A";
  if (truncado === 9) return "B";
  if (truncado >= 7) return "C";
  if (truncado >= 5) return "D";
  return "E";
}

export function abreviarNivel(nivel) {
  if (!nivel || typeof nivel !== "string") return "";

  // Normalizar: quitar acentos, pasar a minúsculas y colapsar espacios
  const norm = nivel
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  // Extraer grado (número al inicio o primer dígito que aparezca)
  let grado = "";
  const inicioNum = norm.match(/^(\d+)/);
  if (inicioNum) {
    grado = inicioNum[1];
  } else {
    const anyDigit = norm.match(/(\d)/);
    if (anyDigit) grado = anyDigit[1];
  }

  if (!grado) return "";

  if (norm.includes('bachiller')) return `${grado}BCH`;
  if (norm.includes('basico elemental') || norm.includes('basicoelemental')) return `${grado}BE`;
  if (norm.includes('basico medio') || norm.includes('basicomedio')) return `${grado}BM`;
  if (norm.includes('basico superior') || norm.includes('basicosuperior')) return `${grado}BS`;

  return "";
}
