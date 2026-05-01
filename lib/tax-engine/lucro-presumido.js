// ─── Cálculo Lucro Presumido — carga tributária atual ─────────────────────────
// Base legal: RIR/2018 arts. 591-628 (IRPJ), IN RFB 1.700/2017 (CSLL)
//             Lei 9.718/1998 e LC 70/1991 (PIS/COFINS cumulativo)
// ─────────────────────────────────────────────────────────────────────────────
import { REFORMA_CONFIG } from "./config.js";

/**
 * Calcula carga tributária anual no Lucro Presumido (baseline — sistema atual).
 *
 * @param {object} dados
 * @param {number} dados.faturamentoMensal       - Faturamento mensal médio (R$)
 * @param {string} dados.atividadeLP             - "comercio" | "servicos" | "industria" | "misto"
 * @param {number} dados.percentualMercadorias   - 0-1 (ex: 0.6 = 60% mercadorias)
 * @param {number} dados.percentualServicos      - 0-1
 * @returns {object}
 */
export function calcularLPBaseline(dados) {
  const {
    faturamentoMensal,
    atividadeLP      = "misto",
    percentualMercadorias = 0.5,
    percentualServicos    = 0.5,
  } = dados;

  const fat = faturamentoMensal * 12; // faturamento anual
  const p   = REFORMA_CONFIG.LP_PRESUNCOES;

  // ── Presunção ponderada pelo mix de receita ──────────────────────────────
  const pIRPJ = (percentualMercadorias * p.irpj.comercio) +
                (percentualServicos    * p.irpj.servicos);
  const pCSLL = (percentualMercadorias * p.csll.comercio) +
                (percentualServicos    * p.csll.servicos);

  // ── IRPJ (RIR/2018, art. 623) ───────────────────────────────────────────
  const baseIRPJ   = fat * pIRPJ;
  const irpj       = baseIRPJ * 0.15;
  // Adicional 10% sobre parcela do lucro presumido trimestral > R$ 60.000
  const adicional  = Math.max(0, (baseIRPJ / 4) - 60000) * 0.10 * 4;
  const irpjTotal  = irpj + adicional;

  // ── CSLL (Lei 7.689/1988, art. 9º) ──────────────────────────────────────
  const baseCSLL = fat * pCSLL;
  const csll     = baseCSLL * 0.09;

  // ── PIS/COFINS cumulativo (Lei 9.718/1998) — 3,65% sobre faturamento ────
  const pisCofins = fat * 0.0365;

  // ── ICMS sobre receita de mercadorias (estimativa) ───────────────────────
  const recMercadorias = fat * percentualMercadorias;
  const icms = recMercadorias * REFORMA_CONFIG.ICMS_MEDIO;

  // ── ISS sobre receita de serviços (estimativa) ───────────────────────────
  const recServicos = fat * percentualServicos;
  const iss = recServicos * REFORMA_CONFIG.ISS_MEDIO;

  const impostoAnual = irpjTotal + csll + pisCofins + icms + iss;

  return {
    regime: "LUCRO_PRESUMIDO",
    faturamentoAnual: fat,
    impostoAnual,
    aliquotaEfetiva: impostoAnual / fat,
    breakdown: [
      { tributo: "IRPJ",          valor: irpj,      percentual: irpj / fat },
      { tributo: "Adicional IRPJ", valor: adicional, percentual: adicional / fat },
      { tributo: "CSLL",          valor: csll,       percentual: csll / fat },
      { tributo: "PIS/COFINS",    valor: pisCofins,  percentual: 0.0365 },
      { tributo: "ICMS",          valor: icms,       percentual: icms / fat },
      { tributo: "ISS",           valor: iss,        percentual: iss / fat },
    ],
    meta: { pIRPJ, pCSLL, baseIRPJ, baseCSLL },
    nota: `LP — PIS/COFINS cumulativo 3,65% | Presunção IRPJ ${(pIRPJ * 100).toFixed(0)}% | CSLL ${(pCSLL * 100).toFixed(0)}%`,
  };
}
