// ─── Orquestrador do Tax Engine ───────────────────────────────────────────────
// Ponto de entrada único para os cálculos da Reforma Tributária
// ─────────────────────────────────────────────────────────────────────────────
import { calcularSimplesBaseline }  from "./simples.js";
import { calcularLPBaseline }       from "./lucro-presumido.js";
import { calcularLRBaseline }       from "./lucro-real.js";
import { calcularReformaPlena }     from "./reforma.js";
import { calcularTransicao }        from "./transicao.js";
import { gerarRecomendacao }        from "./recomendacao.js";

export { REFORMA_CONFIG, CNAES_REDUCAO_30, CNAES_REDUCAO_60, CNAES_REGIME_ESPECIFICO, UFS }
  from "./config.js";

/**
 * Função principal — executa todos os cálculos da simulação.
 *
 * @param {object} dados - Dados completos do formulário (5 passos)
 * @returns {object}     - Resultado completo
 */
export function calcularSimulacao(dados) {
  // ── 1. Carga atual (baseline) ────────────────────────────────────────────
  let baseline;
  switch (dados.regime) {
    case "SIMPLES":
    case "SIMPLES_HIBRIDO":
      baseline = calcularSimplesBaseline(dados);
      break;
    case "LUCRO_PRESUMIDO":
      baseline = calcularLPBaseline(dados);
      break;
    case "LUCRO_REAL":
      baseline = calcularLRBaseline(dados);
      break;
    default:
      throw new Error(`Regime inválido: ${dados.regime}`);
  }

  // ── 2. Carga pós-Reforma plena (2033) — regime atual ────────────────────
  const reformaPlena = calcularReformaPlena(dados);

  // ── 3. Comparativo entre todos os regimes ────────────────────────────────
  const regimesComparativos = ["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO", "LUCRO_REAL"];
  const comparativo = regimesComparativos.map((r) =>
    calcularReformaPlena({ ...dados, regime: r })
  );

  // ── 4. Transição ano a ano (2025–2033) ───────────────────────────────────
  const transicao = calcularTransicao(dados, baseline);

  // ── 5. Recomendação ──────────────────────────────────────────────────────
  const recomendacao = gerarRecomendacao(dados, baseline, reformaPlena, comparativo);

  // ── 6. Variação consolidada ──────────────────────────────────────────────
  const varAbsoluta   = reformaPlena.impostoAnual - baseline.impostoAnual;
  const varPercentual = baseline.impostoAnual > 0
    ? (varAbsoluta / baseline.impostoAnual) * 100
    : 0;

  return {
    baseline,
    reformaPlena,
    comparativo,
    transicao,
    recomendacao,
    variacao: {
      absoluta:   varAbsoluta,
      percentual: varPercentual,
      direcao:    varAbsoluta < -500 ? "REDUCAO" : varAbsoluta > 500 ? "AUMENTO" : "NEUTRO",
    },
    geradoEm: new Date().toISOString(),
  };
}
