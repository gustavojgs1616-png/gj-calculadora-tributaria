/**
 * calculos_rescisao.js
 * Biblioteca de cálculos trabalhistas — Lei CLT
 * Tabelas vigentes 2026
 * - Salário Mínimo: Decreto 12.797/2025 → R$ 1.621,00
 * - INSS: Portaria Interministerial MPS/MF nº 13/2026
 * - IRRF: Tabela progressiva mensal 2026 + Redutor adicional (isenção até R$ 5.000)
 */

// ── Salário Mínimo 2026 ──────────────────────────────────────────────────────
export const SALARIO_MINIMO_2026 = 1621.00;
/** @deprecated use SALARIO_MINIMO_2026 */
export const SALARIO_MINIMO_2025 = SALARIO_MINIMO_2026; // retrocompat

// ── Tabela INSS 2026 (Portaria Interministerial MPS/MF nº 13/2026) ───────────
// Contribuição progressiva — cada faixa taxada à sua alíquota
export const TABELA_INSS_2026 = [
  { ate: 1621.00,  aliquota: 0.075 },
  { ate: 2902.84,  aliquota: 0.09  },
  { ate: 4354.27,  aliquota: 0.12  },
  { ate: 8475.55,  aliquota: 0.14  },
];
export const TETO_INSS_2026 = 988.09; // teto de contribuição mensal (teto salarial × alíquotas)
/** @deprecated use TABELA_INSS_2026 */
export const TABELA_INSS_2025 = TABELA_INSS_2026;
/** @deprecated use TETO_INSS_2026 */
export const TETO_INSS_2025 = TETO_INSS_2026;

// ── Tabela IRRF Mensal 2026 ──────────────────────────────────────────────────
// Base table — nova faixa de isenção até R$ 2.428,80 + redutor adicional
export const TABELA_IRRF_2026 = [
  { ate: 2428.80,  aliquota: 0,     deducao: 0       },
  { ate: 2826.65,  aliquota: 0.075, deducao: 182.16  },
  { ate: 3751.05,  aliquota: 0.15,  deducao: 394.16  },
  { ate: 4664.68,  aliquota: 0.225, deducao: 675.49  },
  { ate: Infinity, aliquota: 0.275, deducao: 908.73  },
];

// Redutor adicional 2026 — isenção efetiva até R$ 5.000 (rendimento bruto)
// Para rendimento bruto > R$ 7.350 não há redutor
export const REDUTOR_IRRF_2026 = {
  limiteIsencao:   5000.00,
  limiteReducao:   7350.00,
  valorMaxReducao:  312.89,
  formula: (rendaBruta) => {
    if (rendaBruta <= 5000.00)  return 312.89;
    if (rendaBruta <= 7350.00)  return Math.max(0, 978.62 - (0.133145 * rendaBruta));
    return 0;
  },
};

export const DEDUCAO_DEPENDENTE_IRRF = 189.59; // por dependente/mês — mantido 2026

// ── Tabela IRRF 13º Salário 2026 ─────────────────────────────────────────────
// Base de cálculo: 13º - INSS do 13º (cálculo exclusivo — Decreto 9.580/2018 art. 700)
// Em 2026 usa a mesma tabela progressiva mensal (sem redutor adicional sobre 13º)
export const TABELA_IRRF_13_2026 = [
  { ate: 2428.80,  aliquota: 0,     deducao: 0       },
  { ate: 2826.65,  aliquota: 0.075, deducao: 182.16  },
  { ate: 3751.05,  aliquota: 0.15,  deducao: 394.16  },
  { ate: 4664.68,  aliquota: 0.225, deducao: 675.49  },
  { ate: Infinity, aliquota: 0.275, deducao: 908.73  },
];
/** @deprecated use TABELA_IRRF_13_2026 */
export const TABELA_IRRF_13_2025 = TABELA_IRRF_13_2026;

// ── Tipos de Rescisão ────────────────────────────────────────────────────────
export const TIPOS_RESCISAO = {
  sem_justa_causa: {
    label: "Dispensa sem Justa Causa",
    desc: "Empregador dispensa o empregado sem motivo disciplinar ou legal",
    bullets: ["Aviso prévio proporcional (trabalhado ou indenizado)", "Multa de 40% sobre saldo FGTS", "Saque de 100% do FGTS", "Seguro-desemprego habilitado"],
    multaFGTS: 0.40,
    temAvisoPrevio: true,
    podeSacarFGTS: true,
    seguroDesemprego: true,
    cor: "#ef4444",
    icone: "📋",
  },
  pedido_demissao: {
    label: "Pedido de Demissão",
    desc: "Empregado solicita o desligamento voluntariamente",
    bullets: ["Aviso prévio obrigatório (trabalhado ou indenizado pelo empregado)", "Sem multa sobre FGTS", "Saque do FGTS bloqueado (exceto situações específicas)", "Sem seguro-desemprego"],
    multaFGTS: 0,
    temAvisoPrevio: true,
    podeSacarFGTS: false,
    seguroDesemprego: false,
    cor: "#3b82f6",
    icone: "✍️",
  },
  justa_causa: {
    label: "Dispensa por Justa Causa",
    desc: "Demissão motivada por falta grave do empregado (art. 482 CLT)",
    bullets: ["Sem aviso prévio", "Sem multa sobre FGTS", "Saque do FGTS bloqueado", "Sem seguro-desemprego", "Sem 13º proporcional nem férias proporcionais com 1/3"],
    multaFGTS: 0,
    temAvisoPrevio: false,
    podeSacarFGTS: false,
    seguroDesemprego: false,
    cor: "#dc2626",
    icone: "⛔",
  },
  por_acordo: {
    label: "Rescisão por Acordo Mútuo",
    desc: "Empregado e empregador decidem encerrar o vínculo de comum acordo (art. 484-A CLT)",
    bullets: ["50% do aviso prévio (indenizado pelo empregador)", "Multa de 20% sobre saldo FGTS", "Saque de até 80% do FGTS", "Sem seguro-desemprego"],
    multaFGTS: 0.20,
    multaFGTSPct: 0.80, // percentual de saque
    temAvisoPrevio: true,
    avisoPrevioPct: 0.50, // 50% do aviso
    podeSacarFGTS: true,
    seguroDesemprego: false,
    cor: "#f59e0b",
    icone: "🤝",
  },
  rescisao_indireta: {
    label: "Rescisão Indireta",
    desc: "Iniciada pelo empregado por falta grave do empregador (art. 483 CLT)",
    bullets: ["Aviso prévio proporcional (indenizado pelo empregador)", "Multa de 40% sobre saldo FGTS", "Saque de 100% do FGTS", "Seguro-desemprego habilitado"],
    multaFGTS: 0.40,
    temAvisoPrevio: true,
    podeSacarFGTS: true,
    seguroDesemprego: true,
    cor: "#8b5cf6",
    icone: "⚖️",
  },
  aposentadoria: {
    label: "Aposentadoria",
    desc: "Desligamento por concessão de aposentadoria",
    bullets: ["Sem aviso prévio obrigatório (alguns casos)", "Sem multa FGTS (exceto voluntária com vínculo ativo)", "Saldo FGTS disponível (depende do tipo)", "Sem seguro-desemprego"],
    multaFGTS: 0,
    temAvisoPrevio: false,
    podeSacarFGTS: true,
    seguroDesemprego: false,
    cor: "#22c55e",
    icone: "🎖️",
  },
};

// ── Adicionais ───────────────────────────────────────────────────────────────
export const INSALUBRIDADE = {
  minimo:  { label: "Grau Mínimo (10%)",  pct: 0.10 },
  medio:   { label: "Grau Médio (20%)",   pct: 0.20 },
  maximo:  { label: "Grau Máximo (40%)",  pct: 0.40 },
};
export const PERICULOSIDADE_PCT = 0.30; // 30% sobre salário base
export const ADICIONAL_NOTURNO_PCT = 0.20; // 20% sobre hora noturna

// ── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Formata valor em R$
 */
export function fmt(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return "R$ 0,00";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Calcula a diferença em anos, meses e dias entre duas datas
 */
export function calcTempoServico(dataAdmissao, dataDesligamento) {
  const ini = new Date(dataAdmissao + "T00:00:00");
  const fim = new Date(dataDesligamento + "T00:00:00");

  let anos = fim.getFullYear() - ini.getFullYear();
  let meses = fim.getMonth() - ini.getMonth();
  let dias = fim.getDate() - ini.getDate();

  if (dias < 0) {
    meses--;
    const ultimoDiaMesAnterior = new Date(fim.getFullYear(), fim.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }
  if (meses < 0) {
    anos--;
    meses += 12;
  }

  const totalMeses = anos * 12 + meses + (dias >= 15 ? 1 : 0); // arredonda para cima a partir de 15 dias
  const totalDias = Math.floor((fim - ini) / (1000 * 60 * 60 * 24));

  return { anos, meses, dias, totalMeses, totalDias };
}

/**
 * Calcula aviso prévio proporcional (Lei 12.506/2011)
 * Base: 30 dias + 3 dias por ano completo de serviço, máx 90 dias
 */
export function calcDiasAvisoPrevio(anos) {
  const dias = 30 + (anos * 3);
  return Math.min(dias, 90);
}

/**
 * Calcula INSS progressivo sobre uma base de cálculo
 * Aplica cada faixa conforme Portaria Interministerial MPS/MF nº 13/2026
 */
export function calcINSS(base) {
  if (!base || base <= 0) return 0;

  let inss = 0;
  let baseRestante = base;
  let limiteAnterior = 0;

  for (const faixa of TABELA_INSS_2026) {
    if (baseRestante <= 0) break;
    const faixaMax = faixa.ate;
    const faixaBase = Math.min(baseRestante, faixaMax - limiteAnterior);
    if (faixaBase <= 0) break;
    inss += faixaBase * faixa.aliquota;
    baseRestante -= faixaBase;
    limiteAnterior = faixaMax;
    if (base <= faixaMax) break;
  }

  return Math.min(inss, TETO_INSS_2026);
}

/**
 * Calcula IRRF mensal sobre base de cálculo — tabela progressiva 2026
 * @param {number} base        - base de cálculo (bruto - INSS - dependentes)
 * @param {number} rendaBruta  - rendimento bruto mensal (para aplicar redutor adicional)
 */
export function calcIRRF(base, rendaBruta = null) {
  if (!base || base <= 0) return 0;

  let imposto = 0;
  for (const faixa of TABELA_IRRF_2026) {
    if (base <= faixa.ate) {
      imposto = base * faixa.aliquota - faixa.deducao;
      break;
    }
  }
  imposto = Math.max(0, imposto);

  // Aplica redutor adicional 2026 (isenção efetiva até R$ 5.000)
  if (rendaBruta !== null && rendaBruta <= REDUTOR_IRRF_2026.limiteReducao) {
    const redutor = REDUTOR_IRRF_2026.formula(rendaBruta);
    imposto = Math.max(0, imposto - redutor);
  }

  return imposto;
}

/**
 * Calcula IRRF sobre 13º salário (cálculo exclusivo — Decreto 9.580/2018 art. 700)
 * O redutor adicional de 2026 NÃO se aplica ao 13º (cálculo em separado)
 */
export function calcIRRF13(base) {
  if (!base || base <= 0) return 0;

  for (const faixa of TABELA_IRRF_13_2026) {
    if (base <= faixa.ate) {
      const imposto = base * faixa.aliquota - faixa.deducao;
      return Math.max(0, imposto);
    }
  }
  return 0;
}

/**
 * Calcula avos de 13º proporcional
 * @returns número de avos (meses trabalhados, incluindo frações >= 15 dias no último mês)
 */
export function calcMeses13(dataAdmissao, dataDesligamento, incluirAvisoPrevio = false, diasAvisoPrevio = 0) {
  const ini = new Date(dataAdmissao + "T00:00:00");
  const fim = new Date(dataDesligamento + "T00:00:00");

  let mesesTrabalhados = 0;
  const anoDesligamento = fim.getFullYear();

  // Contar meses a partir do início do ano de desligamento (ou admissão se no mesmo ano)
  const mesInicio = ini.getFullYear() === anoDesligamento ? ini.getMonth() : 0;
  const mesFim = fim.getMonth();
  const diaFim = fim.getDate();

  // De meses completos
  mesesTrabalhados = mesFim - mesInicio;
  if (diaFim >= 15) mesesTrabalhados++; // fração >= 15 dias conta como mês

  // Aviso prévio indenizado acrescenta ao 13º (OJ 394 SDI-1 TST)
  if (incluirAvisoPrevio) {
    const mesesAviso = Math.ceil(diasAvisoPrevio / 30);
    mesesTrabalhados = Math.min(mesesTrabalhados + mesesAviso, 12);
  }

  return Math.min(Math.max(mesesTrabalhados, 0), 12);
}

/**
 * Calcula avos de férias proporcionais
 * Período: desde o início do período aquisitivo vigente até o desligamento
 */
export function calcMesesFeriasProporcionais(dataAdmissao, dataDesligamento, incluirAvisoPrevio = false, diasAvisoPrevio = 0) {
  const ini = new Date(dataAdmissao + "T00:00:00");
  const fim = new Date(dataDesligamento + "T00:00:00");

  // Calcula data de início do período aquisitivo atual
  const anosServico = fim.getFullYear() - ini.getFullYear();
  let inicioPeriodoAquisitivo = new Date(ini.getFullYear() + anosServico, ini.getMonth(), ini.getDate());

  // Se ultrapassou a data de desligamento, voltar um período
  if (inicioPeriodoAquisitivo > fim) {
    inicioPeriodoAquisitivo = new Date(ini.getFullYear() + anosServico - 1, ini.getMonth(), ini.getDate());
  }

  let meses = (fim.getMonth() - inicioPeriodoAquisitivo.getMonth()) +
    (fim.getFullYear() - inicioPeriodoAquisitivo.getFullYear()) * 12;

  if (fim.getDate() >= 15) meses++;
  else if (fim.getDate() < inicioPeriodoAquisitivo.getDate()) meses--;

  if (incluirAvisoPrevio) {
    const mesesAviso = Math.ceil(diasAvisoPrevio / 30);
    meses = meses + mesesAviso;
  }

  return Math.min(Math.max(meses, 0), 12);
}

/**
 * Calcula saldo de salário (dias trabalhados no último mês)
 */
export function calcSaldoSalario(salarioBase, dataDesligamento) {
  const fim = new Date(dataDesligamento + "T00:00:00");
  const diasNoMes = new Date(fim.getFullYear(), fim.getMonth() + 1, 0).getDate();
  const diasTrabalhados = fim.getDate();
  return (salarioBase / diasNoMes) * diasTrabalhados;
}

// ── Cálculo Principal ────────────────────────────────────────────────────────
/**
 * Calcula todos os valores da rescisão
 * @param {Object} params
 */
export function calcularRescisao(params) {
  const {
    tipoRescisao,
    salarioBase,
    dataAdmissao,
    dataDesligamento,
    avisoPrevioTipo,      // "trabalhado" | "indenizado" | "nenhum"
    saldoFGTS,
    dependentes = 0,
    // Adicionais
    insalubridadeGrau,    // null | "minimo" | "medio" | "maximo"
    periculosidade,       // boolean
    adicionalNoturno,     // boolean
    percentualNoturno,    // horas noturnas sobre total (0–1)
    // Banco de horas / horas extras (simplificado)
    horasExtrasValor = 0,
    // Férias vencidas
    feriasVencidas = false,
  } = params;

  const tipo = TIPOS_RESCISAO[tipoRescisao];
  if (!tipo) throw new Error("Tipo de rescisão inválido: " + tipoRescisao);

  // ── 1. Tempo de serviço ──
  const tempo = calcTempoServico(dataAdmissao, dataDesligamento);
  const diasAvisoPrevio = tipo.temAvisoPrevio
    ? calcDiasAvisoPrevio(tempo.anos)
    : 0;

  // Aplica percentual do aviso (acordo mútuo = 50%)
  const diasAviso = tipo.avisoPrevioPct
    ? Math.round(diasAvisoPrevio * tipo.avisoPrevioPct)
    : diasAvisoPrevio;

  const avisoPrevioIndenizado = tipo.temAvisoPrevio && avisoPrevioTipo === "indenizado";
  const avisoPrevioTrabalhado = tipo.temAvisoPrevio && avisoPrevioTipo === "trabalhado";

  // ── 2. Adicional por composição salarial ──
  let adicionalInsalubridade = 0;
  if (insalubridadeGrau && INSALUBRIDADE[insalubridadeGrau]) {
    adicionalInsalubridade = SALARIO_MINIMO_2026 * INSALUBRIDADE[insalubridadeGrau].pct;
  }
  let adicionalPericulosidade = 0;
  if (periculosidade) {
    adicionalPericulosidade = salarioBase * PERICULOSIDADE_PCT;
  }
  let adicionalNoturnoValor = 0;
  if (adicionalNoturno && percentualNoturno > 0) {
    // Horas noturnas = salário × % noturno × 1.20 - salário × % noturno
    // Simplificado: hora-extra noturna = salário / 220 × (% noturno × 220) × 0.20
    const horaNoturna = (salarioBase / 220) * (percentualNoturno * 220) * ADICIONAL_NOTURNO_PCT;
    adicionalNoturnoValor = horaNoturna;
  }

  const salarioTotal = salarioBase + adicionalInsalubridade + adicionalPericulosidade + adicionalNoturnoValor;

  // ── 3. Verbas ──
  const saldoSalario = calcSaldoSalario(salarioTotal, dataDesligamento);

  // Aviso prévio indenizado (valor = salário × (dias / 30))
  const valorAvisoPrevioIndenizado = avisoPrevioIndenizado
    ? (salarioTotal / 30) * diasAviso
    : 0;

  // Aviso prévio trabalhado (entra no INSS/IRRF mensal)
  const valorAvisoPrevioTrabalhado = avisoPrevioTrabalhado
    ? (salarioTotal / 30) * diasAviso
    : 0;

  // 13º proporcional
  const avos13 = (tipoRescisao === "justa_causa") ? 0
    : calcMeses13(dataAdmissao, dataDesligamento, avisoPrevioIndenizado, diasAviso);
  const valor13Proporcional = salarioTotal * (avos13 / 12);

  // Férias proporcionais
  const avosFeriasProporcionais = (tipoRescisao === "justa_causa") ? 0
    : calcMesesFeriasProporcionais(dataAdmissao, dataDesligamento, avisoPrevioIndenizado, diasAviso);
  const valorFeriasProporcionais = salarioTotal * (avosFeriasProporcionais / 12);
  const valorTercoFeriasProporcionais = valorFeriasProporcionais / 3;

  // Férias vencidas
  const valorFeriasVencidas = feriasVencidas ? salarioTotal : 0;
  const valorTercoFeriasVencidas = feriasVencidas ? salarioTotal / 3 : 0;

  // Horas extras
  const valorHorasExtras = horasExtrasValor || 0;

  // ── 4. Base INSS ──
  // Incide sobre: saldo + aviso trabalhado + 13º proporcional
  // NÃO incide: aviso indenizado (Súmula 479 TST), férias proporcionais (TST)
  const baseINSSMensal = saldoSalario + valorAvisoPrevioTrabalhado + valorHorasExtras;
  const inssRescisorio = calcINSS(baseINSSMensal);

  // INSS sobre 13º proporcional (cálculo separado)
  const inss13Proporcional = calcINSS(valor13Proporcional);

  const totalINSS = inssRescisorio + inss13Proporcional;

  // ── 5. Base IRRF ──
  // Incide sobre: saldo + aviso indenizado + aviso trabalhado + 13º - INSS - dependentes
  const deducaoDependentes = dependentes * DEDUCAO_DEPENDENTE_IRRF;

  const baseIRRFMensal =
    saldoSalario
    + valorAvisoPrevioIndenizado
    + valorAvisoPrevioTrabalhado
    + valorHorasExtras
    - inssRescisorio
    - deducaoDependentes;

  // Renda bruta mensal para o redutor adicional 2026
  const rendaBrutaMensal = saldoSalario + valorAvisoPrevioIndenizado + valorAvisoPrevioTrabalhado + valorHorasExtras;
  const irrfRescisorio = calcIRRF(Math.max(0, baseIRRFMensal), rendaBrutaMensal);

  // IRRF sobre 13º (cálculo exclusivo, Decreto 9.580/2018 art. 700 — sem redutor adicional)
  const base13IRRF = valor13Proporcional - inss13Proporcional;
  const irrf13Proporcional = calcIRRF13(Math.max(0, base13IRRF));

  // Férias (sobre férias + 1/3 → isentas na rescisão conforme art. 146 CLT + Súmula 125 STJ)
  // Nota: férias proporcionais na rescisão sem justa causa são isentas de IRRF
  const irrfFerias = 0;

  const totalIRRF = irrfRescisorio + irrf13Proporcional;

  // ── 6. FGTS ──
  // Depósito rescisório: 8% sobre verbas salariais do mês (saldo + aviso trabalhado + 13º)
  const baseDepositoFGTS = saldoSalario + valorAvisoPrevioTrabalhado + valor13Proporcional + valorHorasExtras;
  const depositoFGTSRescisorio = baseDepositoFGTS * 0.08;
  const multaFGTS = saldoFGTS * tipo.multaFGTS;
  const multaFGTSSobre = tipo.multaFGTSPct
    ? saldoFGTS * tipo.multaFGTSPct
    : (tipo.podeSacarFGTS ? (saldoFGTS + depositoFGTSRescisorio) : 0);

  // ── 7. Totais ──
  const totalProventos =
    saldoSalario
    + valorAvisoPrevioIndenizado
    + valorAvisoPrevioTrabalhado
    + valor13Proporcional
    + valorFeriasProporcionais
    + valorTercoFeriasProporcionais
    + valorFeriasVencidas
    + valorTercoFeriasVencidas
    + valorHorasExtras;

  const totalDeducoes = totalINSS + totalIRRF;
  const totalLiquido = totalProventos - totalDeducoes;

  // ── 8. Monta itens do demonstrativo ──
  const proventos = [];
  if (saldoSalario > 0) proventos.push({ descricao: "Saldo de Salário", valor: saldoSalario, formula: `${(saldoSalario).toFixed(2)} (dias proporcional)` });
  if (valorAvisoPrevioIndenizado > 0) proventos.push({ descricao: `Aviso Prévio Indenizado (${diasAviso} dias)`, valor: valorAvisoPrevioIndenizado, obs: "Isento de INSS — Súmula 479 TST" });
  if (valorAvisoPrevioTrabalhado > 0) proventos.push({ descricao: `Aviso Prévio Trabalhado (${diasAviso} dias)`, valor: valorAvisoPrevioTrabalhado });
  if (valor13Proporcional > 0) proventos.push({ descricao: `13º Salário Proporcional (${avos13}/12 avos)`, valor: valor13Proporcional });
  if (valorFeriasProporcionais > 0) proventos.push({ descricao: `Férias Proporcionais (${avosFeriasProporcionais}/12 avos)`, valor: valorFeriasProporcionais, obs: "Isenta de IRRF — art. 146 CLT" });
  if (valorTercoFeriasProporcionais > 0) proventos.push({ descricao: "1/3 Constitucional sobre Férias Proporcionais", valor: valorTercoFeriasProporcionais });
  if (valorFeriasVencidas > 0) proventos.push({ descricao: "Férias Vencidas (1 período)", valor: valorFeriasVencidas });
  if (valorTercoFeriasVencidas > 0) proventos.push({ descricao: "1/3 Constitucional sobre Férias Vencidas", valor: valorTercoFeriasVencidas });
  if (valorHorasExtras > 0) proventos.push({ descricao: "Horas Extras / Banco de Horas", valor: valorHorasExtras });

  const deducoes = [];
  if (inssRescisorio > 0) deducoes.push({ descricao: "INSS (saldo + aviso)", valor: inssRescisorio, base: baseINSSMensal });
  if (inss13Proporcional > 0) deducoes.push({ descricao: "INSS sobre 13º Proporcional", valor: inss13Proporcional, base: valor13Proporcional });
  if (irrfRescisorio > 0) deducoes.push({ descricao: "IRRF (saldo + aviso)", valor: irrfRescisorio, base: baseIRRFMensal });
  if (irrf13Proporcional > 0) deducoes.push({ descricao: "IRRF sobre 13º Proporcional", valor: irrf13Proporcional, base: base13IRRF });

  const fgtsInfo = {
    depositoRescisorio: depositoFGTSRescisorio,
    multaFGTS,
    multaFGTSSobre,
    multaPorcentagem: tipo.multaFGTS * 100,
    podeSacar: tipo.podeSacarFGTS,
    percentualSaque: tipo.multaFGTSPct ? tipo.multaFGTSPct * 100 : (tipo.podeSacarFGTS ? 100 : 0),
  };

  return {
    // Input resumido
    tipo,
    tipoId: tipoRescisao,
    tempo,
    diasAvisoPrevio: diasAviso,
    avisoPrevioTipo,
    salarioTotal,
    salarioBase,
    dependentes,
    // Verbas
    saldoSalario,
    valorAvisoPrevioIndenizado,
    valorAvisoPrevioTrabalhado,
    valor13Proporcional,
    avos13,
    valorFeriasProporcionais,
    avosFeriasProporcionais,
    valorTercoFeriasProporcionais,
    valorFeriasVencidas,
    valorTercoFeriasVencidas,
    valorHorasExtras,
    // INSS / IRRF
    inssRescisorio,
    inss13Proporcional,
    totalINSS,
    irrfRescisorio,
    irrf13Proporcional,
    totalIRRF,
    // Totais
    totalProventos,
    totalDeducoes,
    totalLiquido,
    // Listas para tabela
    proventos,
    deducoes,
    fgtsInfo,
  };
}
