// ─── Lógica de recomendação de regime pós-Reforma ────────────────────────────
// Regras determinísticas — sem ML
// ─────────────────────────────────────────────────────────────────────────────

const LABEL_REGIME = {
  SIMPLES:          "Simples Nacional",
  SIMPLES_HIBRIDO:  "Simples Nacional Híbrido",
  LUCRO_PRESUMIDO:  "Lucro Presumido",
  LUCRO_REAL:       "Lucro Real",
};

/**
 * Gera alertas, recomendação de regime e texto consultivo.
 *
 * @param {object} dados       - Formulário completo
 * @param {object} baseline    - Carga atual calculada
 * @param {object} reformaPlena - Carga 2033 calculada
 * @param {Array}  comparativo - Array com carga de cada regime
 * @returns {object}
 */
export function gerarRecomendacao(dados, baseline, reformaPlena, comparativo) {
  const {
    regime                = "SIMPLES",
    faturamentoMensal     = 0,
    percentualClientesPJ  = 0.5,
    percentualServicos    = 0.5,
    percentualMercadorias = 0.5,
    margemLucro           = 0.15,
    aplicarReducao30      = false,
    aplicarReducao60      = false,
  } = dados;

  const fat     = faturamentoMensal * 12;
  const alertas = [];

  // ── Regra 1: Simples com alta proporção de clientes PJ ──────────────────
  if (regime === "SIMPLES" && percentualClientesPJ >= 0.70 && fat <= 4800000) {
    alertas.push({
      tipo:  "ATENCAO",
      emoji: "⚠️",
      texto: `${(percentualClientesPJ * 100).toFixed(0)}% dos clientes são PJ. No Simples padrão eles NÃO aproveitam crédito de IBS/CBS — seus preços podem ficar menos competitivos no mercado B2B.`,
    });
    alertas.push({
      tipo:  "DICA",
      emoji: "💡",
      texto: "Avalie o Simples Híbrido: permite recolher IBS+CBS fora do DAS e gerar crédito integral. Decisão pode ser revista a cada 6 meses (abril/outubro).",
    });
  }

  // ── Regra 2: LP vs LR — margem real vs. presunção ───────────────────────
  if (regime === "LUCRO_PRESUMIDO" || regime === "LUCRO_REAL") {
    const presIRPJ = (percentualMercadorias * 0.08) + (percentualServicos * 0.32);
    if (margemLucro > presIRPJ && regime === "LUCRO_REAL") {
      alertas.push({
        tipo:  "DICA",
        emoji: "💡",
        texto: `Margem real (${(margemLucro * 100).toFixed(0)}%) está acima da presunção do LP (${(presIRPJ * 100).toFixed(0)}%). O Lucro Presumido tende a ser mais vantajoso — avalie com seu contador.`,
      });
    }
    if (margemLucro < presIRPJ && regime === "LUCRO_PRESUMIDO") {
      alertas.push({
        tipo:  "DICA",
        emoji: "💡",
        texto: `Margem real (${(margemLucro * 100).toFixed(0)}%) está abaixo da presunção do LP (${(presIRPJ * 100).toFixed(0)}%). O Lucro Real pode ser mais vantajoso — avalie com seu contador.`,
      });
    }
  }

  // ── Regra 3: benefícios de redução aplicáveis ────────────────────────────
  if (aplicarReducao60) {
    alertas.push({
      tipo:  "BENEFICIO",
      emoji: "🟢",
      texto: "Redução de 60% nas alíquotas IBS/CBS aplicada. Confirme o enquadramento junto à sua assessoria jurídica-tributária.",
    });
  }
  if (aplicarReducao30) {
    alertas.push({
      tipo:  "BENEFICIO",
      emoji: "🟢",
      texto: "Profissional intelectual regulamentado: redução de 30% nas alíquotas IBS/CBS. Aplicada automaticamente nesta simulação.",
    });
  }

  // ── Regime mais vantajoso do comparativo ─────────────────────────────────
  const melhor = comparativo.reduce(
    (a, b) => a.impostoAnual < b.impostoAnual ? a : b
  );

  // ── Variação ─────────────────────────────────────────────────────────────
  const varAbsoluta  = reformaPlena.impostoAnual - baseline.impostoAnual;
  const varPercentual = baseline.impostoAnual > 0
    ? (varAbsoluta / baseline.impostoAnual) * 100
    : 0;
  const direcao = varAbsoluta < -500 ? "REDUCAO" : varAbsoluta > 500 ? "AUMENTO" : "NEUTRO";

  // ── Texto consultivo ─────────────────────────────────────────────────────
  const fmtR = (v) => `R$ ${Math.abs(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
  const labelMelhor = LABEL_REGIME[melhor.regime] || melhor.regime;

  let texto = "";
  if (direcao === "REDUCAO") {
    texto = `A Reforma Tributária tende a ser FAVORÁVEL para esta empresa. A projeção indica redução de ${Math.abs(varPercentual).toFixed(1)}% na carga tributária até 2033, equivalente a ${fmtR(varAbsoluta)} a menos por ano. `;
  } else if (direcao === "AUMENTO") {
    texto = `A Reforma Tributária tende a AUMENTAR a carga tributária desta empresa em ${varPercentual.toFixed(1)}% até 2033, equivalente a ${fmtR(varAbsoluta)} adicionais por ano. Planejamento preventivo é fundamental. `;
  } else {
    texto = `A Reforma Tributária terá impacto aproximadamente NEUTRO para esta empresa — a carga tributária se mantém estável em 2033. `;
  }

  texto += `Entre os regimes analisados, o ${labelMelhor} apresenta a menor carga tributária estimada pós-Reforma, com alíquota efetiva de ${(melhor.aliquotaEfetiva * 100).toFixed(1)}%.`;

  if (alertas.length > 0) {
    const dicas = alertas.filter(a => a.tipo === "DICA" || a.tipo === "ATENCAO");
    if (dicas.length > 0) {
      texto += ` Pontos de atenção: ${dicas.map(a => a.texto).join(" ")}`;
    }
  }

  return {
    melhorRegime:     melhor.regime,
    textoRecomendacao: texto,
    alertas,
    variacao: {
      absoluta:    varAbsoluta,
      percentual:  varPercentual,
      direcao,
    },
  };
}
