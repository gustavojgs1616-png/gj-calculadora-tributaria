// ─── Cálculo Lucro Real — carga tributária atual ──────────────────────────────
// Base legal: RIR/2018 arts. 258-626 (IRPJ/CSLL)
//             Lei 10.637/2002 (PIS não-cumulativo)
//             Lei 10.833/2003 (COFINS não-cumulativa)
// NOTA: Usa margem de lucro estimada (informada pelo contador); no real
//       a base seria o lucro contábil ajustado (LALUR).
// ─────────────────────────────────────────────────────────────────────────────
import { REFORMA_CONFIG } from "./config.js";

/**
 * Calcula carga tributária anual no Lucro Real (baseline — sistema atual).
 *
 * @param {object} dados
 * @param {number} dados.faturamentoMensal     - Faturamento mensal médio (R$)
 * @param {number} dados.margemLucro           - Margem líquida estimada (0-1, ex: 0.15)
 * @param {number} dados.percentualMercadorias - Participação de mercadorias
 * @param {number} dados.percentualServicos    - Participação de serviços
 * @param {number} dados.custosMensais         - Custos tributados mensais (base crédito PIS/COFINS)
 * @param {number} dados.creditosAcumulados    - Créditos acumulados PIS/COFINS (R$)
 * @returns {object}
 */
export function calcularLRBaseline(dados) {
  const {
    faturamentoMensal,
    margemLucro          = 0.15,
    percentualMercadorias = 0.5,
    percentualServicos    = 0.5,
    custosMensais        = 0,
    creditosAcumulados   = 0,
  } = dados;

  const fat   = faturamentoMensal * 12;
  const custos = custosMensais * 12;
  const lucro = fat * margemLucro;

  // ── IRPJ (RIR/2018, art. 619) ───────────────────────────────────────────
  const irpj      = lucro * 0.15;
  const adicional = Math.max(0, lucro - 240000) * 0.10; // 10% s/ excedente anual
  const irpjTotal = irpj + adicional;

  // ── CSLL (Lei 7.689/1988) ────────────────────────────────────────────────
  const csll = lucro * 0.09;

  // ── PIS não-cumulativo (Lei 10.637/2002) — 1,65% s/ faturamento ─────────
  const pisBruto   = fat   * 0.0165;
  const creditoPIS = custos * 0.0165;
  const pisLiquido = Math.max(0, pisBruto - creditoPIS);

  // ── COFINS não-cumulativa (Lei 10.833/2003) — 7,6% s/ faturamento ───────
  const cofinsBruto    = fat   * 0.076;
  const creditoCOFINS  = custos * 0.076;
  const cofinsLiquido  = Math.max(0, cofinsBruto - creditoCOFINS - creditosAcumulados);

  // ── ICMS (estimativa — mercadorias) ─────────────────────────────────────
  const recMerc    = fat   * percentualMercadorias;
  const icmsBruto  = recMerc * REFORMA_CONFIG.ICMS_MEDIO;
  // Crédito estimado: ~70% do ICMS sobre insumos comprados
  const icmsCredito = custos * percentualMercadorias * REFORMA_CONFIG.ICMS_MEDIO * 0.7;
  const icmsLiquido = Math.max(0, icmsBruto - icmsCredito);

  // ── ISS (serviços) ───────────────────────────────────────────────────────
  const recServ = fat * percentualServicos;
  const iss     = recServ * REFORMA_CONFIG.ISS_MEDIO;

  const impostoAnual = irpjTotal + csll + pisLiquido + cofinsLiquido + icmsLiquido + iss;

  return {
    regime: "LUCRO_REAL",
    faturamentoAnual: fat,
    impostoAnual,
    aliquotaEfetiva: impostoAnual / fat,
    breakdown: [
      { tributo: "IRPJ",            valor: irpjTotal,    percentual: irpjTotal / fat },
      { tributo: "CSLL",            valor: csll,         percentual: csll / fat },
      { tributo: "PIS (líquido)",   valor: pisLiquido,   percentual: pisLiquido / fat },
      { tributo: "COFINS (líquido)", valor: cofinsLiquido, percentual: cofinsLiquido / fat },
      { tributo: "ICMS (líquido)",  valor: icmsLiquido,  percentual: icmsLiquido / fat },
      { tributo: "ISS",             valor: iss,          percentual: iss / fat },
    ],
    meta: { lucro, margemLucro, creditoPIS, creditoCOFINS, icmsCredito },
    nota: `LR — PIS/COFINS não-cumulativo (crédito s/ R$ ${custos.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} em custos) | Margem ${(margemLucro * 100).toFixed(0)}%`,
  };
}
