// ─── Cálculo IBS + CBS — sistema pós-Reforma (2033) ──────────────────────────
// Base legal: LC 214/2025
//   art. 12  — IBS (Imposto sobre Bens e Serviços) estadual+municipal
//   art. 195 — CBS (Contribuição sobre Bens e Serviços) federal
//   arts. 19-24 — Regimes diferenciados (reduções 30% e 60%)
// ─────────────────────────────────────────────────────────────────────────────
import { REFORMA_CONFIG } from "./config.js";
import { calcularAliquotaSimples } from "./simples.js";

/**
 * Calcula carga tributária no sistema pleno pós-Reforma (2033+).
 * IRPJ e CSLL são mantidos — a Reforma não os altera.
 *
 * @param {object} dados - Dados completos do formulário
 * @returns {object}     - Resultado detalhado
 */
export function calcularReformaPlena(dados) {
  const {
    faturamentoMensal,
    regime              = "LUCRO_PRESUMIDO",
    custosMensais       = 0,
    percentualMercadorias = 0.5,
    percentualServicos    = 0.5,
    aplicarReducao60    = false,
    aplicarReducao30    = false,
    margemLucro         = 0.15,
    anexo               = 1,
  } = dados;

  const fat    = faturamentoMensal * 12;
  const custos = custosMensais * 12;
  const { ALIQUOTA_CBS_PLENA, ALIQUOTA_IBS_PLENA, FATOR_REDUCAO_60, FATOR_REDUCAO_30 } = REFORMA_CONFIG;

  // ── Fator de redução ─────────────────────────────────────────────────────
  let fatorReducao = 1.0;
  if (aplicarReducao60)      fatorReducao = FATOR_REDUCAO_60; // 40% da alíquota
  else if (aplicarReducao30) fatorReducao = FATOR_REDUCAO_30; // 70% da alíquota

  const aliqCBS = ALIQUOTA_CBS_PLENA * fatorReducao;
  const aliqIBS = ALIQUOTA_IBS_PLENA * fatorReducao;

  // ── Simples Nacional (mantido) ───────────────────────────────────────────
  // No Simples padrão, CBS e IBS ficam embutidos no DAS.
  // A empresa não gera crédito autônomo para clientes PJ.
  // TODO: atualizar quando regulamentação específica do Simples for publicada
  if (regime === "SIMPLES") {
    const { aliquotaEfetiva } = calcularAliquotaSimples(fat, anexo);
    const impostoDAS = fat * aliquotaEfetiva;
    return {
      regime:          "SIMPLES",
      cenario:         "SIMPLES_MANTIDO",
      faturamentoAnual: fat,
      cbsLiquido:      0,
      ibsLiquido:      0,
      irpjCsll:        0,
      impostoDAS,
      impostoAnual:    impostoDAS,
      aliquotaEfetiva: impostoDAS / fat,
      aliqCBS, aliqIBS, fatorReducao,
      breakdown: [
        { tributo: "DAS (CBS+IBS embutidos)", valor: impostoDAS, percentual: impostoDAS / fat },
      ],
      nota: "No Simples mantido, CBS e IBS ficam embutidos no DAS. Não gera crédito para clientes PJ.",
    };
  }

  // ── Simples Híbrido ──────────────────────────────────────────────────────
  // Recolhe IBS/CBS pelo regime regular (fora do DAS), gera crédito integral.
  // Só IRPJ/CSLL/CPP ficam no DAS.
  if (regime === "SIMPLES_HIBRIDO") {
    const { aliquotaEfetiva } = calcularAliquotaSimples(fat, anexo);
    const dasSemTributos  = fat * aliquotaEfetiva * 0.60; // estimativa: ~60% do DAS é tributo direto
    const cbsLiquido = Math.max(0, fat * aliqCBS - custos * aliqCBS);
    const ibsLiquido = Math.max(0, fat * aliqIBS - custos * aliqIBS);
    const impostoAnual = dasSemTributos + cbsLiquido + ibsLiquido;
    return {
      regime:          "SIMPLES_HIBRIDO",
      faturamentoAnual: fat,
      cbsLiquido, ibsLiquido,
      irpjCsll:        dasSemTributos,
      impostoDAS:      dasSemTributos,
      impostoAnual,
      aliquotaEfetiva: impostoAnual / fat,
      aliqCBS, aliqIBS, fatorReducao,
      breakdown: [
        { tributo: "DAS (IRPJ/CSLL/CPP)", valor: dasSemTributos, percentual: dasSemTributos / fat },
        { tributo: "CBS (líquido)",        valor: cbsLiquido,    percentual: cbsLiquido / fat },
        { tributo: "IBS (líquido)",        valor: ibsLiquido,    percentual: ibsLiquido / fat },
      ],
      nota: "Simples Híbrido: IBS+CBS recolhidos fora do DAS — gera crédito integral para clientes PJ.",
    };
  }

  // ── Lucro Presumido ──────────────────────────────────────────────────────
  if (regime === "LUCRO_PRESUMIDO") {
    const p       = REFORMA_CONFIG.LP_PRESUNCOES;
    const pIRPJ   = (percentualMercadorias * p.irpj.comercio) + (percentualServicos * p.irpj.servicos);
    const pCSLL   = (percentualMercadorias * p.csll.comercio) + (percentualServicos * p.csll.servicos);
    const baseIRPJ = fat * pIRPJ;
    const baseCSLL = fat * pCSLL;
    const irpj     = baseIRPJ * 0.15;
    const adicional = Math.max(0, (baseIRPJ / 4) - 60000) * 0.10 * 4;
    const csll      = baseCSLL * 0.09;
    const irpjCsll  = irpj + adicional + csll;

    const cbsLiquido = Math.max(0, fat * aliqCBS - custos * aliqCBS);
    const ibsLiquido = Math.max(0, fat * aliqIBS - custos * aliqIBS);
    const impostoAnual = cbsLiquido + ibsLiquido + irpjCsll;

    return {
      regime: "LUCRO_PRESUMIDO",
      faturamentoAnual: fat,
      cbsLiquido, ibsLiquido, irpjCsll,
      impostoAnual,
      aliquotaEfetiva: impostoAnual / fat,
      aliqCBS, aliqIBS, fatorReducao,
      breakdown: [
        { tributo: "CBS (líquido)", valor: cbsLiquido, percentual: cbsLiquido / fat },
        { tributo: "IBS (líquido)", valor: ibsLiquido, percentual: ibsLiquido / fat },
        { tributo: "IRPJ + CSLL",  valor: irpjCsll,   percentual: irpjCsll / fat },
      ],
      nota: `LP pós-Reforma — IVA total ${((aliqCBS + aliqIBS) * 100).toFixed(1)}%${fatorReducao < 1 ? ` (redução ${((1 - fatorReducao) * 100).toFixed(0)}%)` : ""}`,
    };
  }

  // ── Lucro Real ───────────────────────────────────────────────────────────
  const lucro     = fat * margemLucro;
  const irpj      = lucro * 0.15;
  const adicional = Math.max(0, lucro - 240000) * 0.10;
  const csll      = lucro * 0.09;
  const irpjCsll  = irpj + adicional + csll;

  const cbsLiquido = Math.max(0, fat * aliqCBS - custos * aliqCBS);
  const ibsLiquido = Math.max(0, fat * aliqIBS - custos * aliqIBS);
  const impostoAnual = cbsLiquido + ibsLiquido + irpjCsll;

  return {
    regime: "LUCRO_REAL",
    faturamentoAnual: fat,
    cbsLiquido, ibsLiquido, irpjCsll,
    impostoAnual,
    aliquotaEfetiva: impostoAnual / fat,
    aliqCBS, aliqIBS, fatorReducao,
    breakdown: [
      { tributo: "CBS (líquido)", valor: cbsLiquido, percentual: cbsLiquido / fat },
      { tributo: "IBS (líquido)", valor: ibsLiquido, percentual: ibsLiquido / fat },
      { tributo: "IRPJ + CSLL",  valor: irpjCsll,   percentual: irpjCsll / fat },
    ],
    nota: `LR pós-Reforma — IVA total ${((aliqCBS + aliqIBS) * 100).toFixed(1)}% | Margem ${(margemLucro * 100).toFixed(0)}%`,
  };
}
