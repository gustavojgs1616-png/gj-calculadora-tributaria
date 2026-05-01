// ─── Cálculo Simples Nacional — carga tributária atual ────────────────────────
// Base legal: LC 123/2006, art. 18 e Anexos I-V (tabelas 2024)
// ─────────────────────────────────────────────────────────────────────────────
import { REFORMA_CONFIG } from "./config.js";

const NOMES_ANEXO = ["I", "II", "III", "IV", "V"];

/**
 * Retorna a alíquota nominal, efetiva e faixa do Simples Nacional.
 * Fórmula: ((RBT12 × Aliq) − PD) / RBT12  (LC 123/2006, art. 18, §1º)
 *
 * @param {number} rbt12  - Receita Bruta últimos 12 meses (anualizada)
 * @param {number} anexo  - Número do anexo (1-5)
 */
export function calcularAliquotaSimples(rbt12, anexo) {
  const idx = Math.max(0, Math.min(4, (anexo || 1) - 1));
  const tabela = REFORMA_CONFIG.SIMPLES[`ANEXO_${NOMES_ANEXO[idx]}`];

  // encontra faixa
  let faixaIdx = tabela.length - 1;
  for (let i = 0; i < tabela.length; i++) {
    if (rbt12 <= tabela[i].limite) { faixaIdx = i; break; }
  }

  const { aliquota, pd } = tabela[faixaIdx];
  const aliquotaEfetiva = Math.max(0, ((rbt12 * aliquota) - pd) / rbt12);

  return {
    aliquotaNominal: aliquota,
    aliquotaEfetiva,
    faixa: faixaIdx + 1,
    nomeAnexo: `Anexo ${NOMES_ANEXO[idx]}`,
  };
}

/**
 * Calcula carga tributária anual do Simples Nacional (baseline — sistema atual).
 * Simplificação: assume RBT12 = faturamentoMensal × 12.
 *
 * @param {object} dados - Dados do formulário
 * @returns {object}     - Resultado detalhado
 */
export function calcularSimplesBaseline(dados) {
  const { faturamentoMensal, anexo = 1 } = dados;
  const faturamentoAnual = faturamentoMensal * 12;

  const { aliquotaEfetiva, aliquotaNominal, faixa, nomeAnexo } =
    calcularAliquotaSimples(faturamentoAnual, anexo);

  const impostoAnual = faturamentoAnual * aliquotaEfetiva;

  return {
    regime: "SIMPLES",
    faturamentoAnual,
    impostoAnual,
    aliquotaEfetiva,
    breakdown: [
      {
        tributo: `DAS — ${nomeAnexo}`,
        valor: impostoAnual,
        percentual: aliquotaEfetiva,
      },
    ],
    meta: {
      aliquotaNominal,
      aliquotaEfetiva,
      faixa,
      nomeAnexo,
    },
    nota: `Alíquota efetiva ${(aliquotaEfetiva * 100).toFixed(2)}% — ${nomeAnexo}, Faixa ${faixa}`,
  };
}
