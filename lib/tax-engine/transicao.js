// ─── Projeção ano a ano 2025-2033 ─────────────────────────────────────────────
// Base legal: LC 214/2025, arts. 350-425 (Disposições transitórias)
// ─────────────────────────────────────────────────────────────────────────────
import { REFORMA_CONFIG } from "./config.js";
import { calcularReformaPlena } from "./reforma.js";

/**
 * Projeta a carga tributária para cada ano da transição (2025–2033).
 *
 * @param {object} dados           - Dados completos do formulário
 * @param {object} baselineResult  - Resultado do cálculo atual (baseline)
 * @returns {Array}                - Array de { ano, tributosAntigos, tributosNovos, total, nota }
 */
export function calcularTransicao(dados, baselineResult) {
  const fat    = dados.faturamentoMensal * 12;
  const custos = (dados.custosMensais || 0) * 12;
  const { CRONOGRAMA, ICMS_MEDIO, ISS_MEDIO } = REFORMA_CONFIG;

  // Decompõe tributos do baseline para projetar o "velho" sistema declinando
  const percMerc = dados.percentualMercadorias || 0.5;
  const percServ = dados.percentualServicos    || 0.5;

  // Estimativa dos tributos substituíveis separados
  const pisCofinsOriginal = fat * 0.0365; // LP/LR — para Simples está no DAS
  const icmsOriginal      = fat * percMerc * ICMS_MEDIO;
  const issOriginal       = fat * percServ * ISS_MEDIO;

  // Sistema novo pleno (2033)
  const reformaPlena = calcularReformaPlena(dados);
  const cbsPlena     = reformaPlena.cbsLiquido || 0;
  const ibsPlena     = reformaPlena.ibsLiquido || 0;

  const isSimples = dados.regime === "SIMPLES" || dados.regime === "SIMPLES_HIBRIDO";

  return [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map((ano) => {

    // ── 2025: baseline puro ─────────────────────────────────────────────────
    if (ano === 2025) {
      return {
        ano,
        tributosAntigos: baselineResult.impostoAnual,
        tributosNovos:   0,
        total:           baselineResult.impostoAnual,
        aliquotaEfetiva: baselineResult.aliquotaEfetiva,
        nota:            "Baseline — sistema tributário atual",
      };
    }

    const cfg = CRONOGRAMA[ano];

    // ── 2026: fase de teste (compensável) ───────────────────────────────────
    if (ano === 2026) {
      const cbsTeste = fat * cfg.cbs_teste;
      const ibsTeste = fat * cfg.ibs_teste;
      // Compensação com PIS/COFINS — impacto líquido ≈ zero (Ato Conjunto RFB/CGIBS nº 1/2025)
      const credito  = isSimples ? 0 : Math.min(cbsTeste + ibsTeste, pisCofinsOriginal);
      const novosLiq = Math.max(0, cbsTeste + ibsTeste - credito);
      const total    = baselineResult.impostoAnual + novosLiq;
      return {
        ano,
        tributosAntigos: baselineResult.impostoAnual,
        tributosNovos:   novosLiq,
        total,
        aliquotaEfetiva: total / fat,
        nota:            cfg.nota,
      };
    }

    // ── 2027: CBS plena, PIS/COFINS extintos, IPI zerado ───────────────────
    if (ano === 2027) {
      const baselineSemdPisCofins = isSimples
        ? baselineResult.impostoAnual  // Simples: DAS absorve
        : baselineResult.impostoAnual - pisCofinsOriginal;
      const total = baselineSemdPisCofins + cbsPlena;
      return {
        ano,
        tributosAntigos: baselineSemdPisCofins,
        tributosNovos:   cbsPlena,
        total,
        aliquotaEfetiva: total / fat,
        nota:            cfg.nota,
      };
    }

    // ── 2028: estabilização ─────────────────────────────────────────────────
    if (ano === 2028) {
      const baselineSemdPisCofins = isSimples
        ? baselineResult.impostoAnual
        : baselineResult.impostoAnual - pisCofinsOriginal;
      const total = baselineSemdPisCofins + cbsPlena;
      return {
        ano,
        tributosAntigos: baselineSemdPisCofins,
        tributosNovos:   cbsPlena,
        total,
        aliquotaEfetiva: total / fat,
        nota:            cfg.nota,
      };
    }

    // ── 2029–2032: transição gradual ICMS/ISS → IBS ─────────────────────────
    if (ano >= 2029 && ano <= 2032) {
      const propIBS  = cfg.ibs_proporcao; // proporção do IBS pleno
      const fatICMS  = cfg.icms_fator;
      const fatISS   = cfg.iss_fator;

      let tributosAntigos;
      if (isSimples) {
        // Simples: DAS reduz gradualmente conforme CBS/IBS ocupam espaço
        tributosAntigos = baselineResult.impostoAnual * (fatICMS);
      } else {
        // LP/LR: subtrai PIS/COFINS (extintos) e aplica fator no ICMS/ISS
        const base = baselineResult.impostoAnual - pisCofinsOriginal - icmsOriginal - issOriginal;
        tributosAntigos = base + (icmsOriginal * fatICMS) + (issOriginal * fatISS);
      }

      const tributosNovos = cbsPlena + (ibsPlena * propIBS);
      const total         = tributosAntigos + tributosNovos;

      return {
        ano,
        tributosAntigos,
        tributosNovos,
        total,
        aliquotaEfetiva: total / fat,
        nota: cfg.nota,
      };
    }

    // ── 2033: sistema pleno ─────────────────────────────────────────────────
    return {
      ano,
      tributosAntigos: reformaPlena.irpjCsll || 0,
      tributosNovos:   cbsPlena + ibsPlena,
      total:           reformaPlena.impostoAnual,
      aliquotaEfetiva: reformaPlena.aliquotaEfetiva,
      nota:            cfg.nota,
    };
  });
}
