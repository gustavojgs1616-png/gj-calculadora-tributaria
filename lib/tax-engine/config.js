// ─── Configuração da Reforma Tributária ───────────────────────────────────────
// Base legal: EC 132/2023, LC 214/2025, LC 227/2026
// ⚠️ Atualizar quando Senado publicar alíquotas oficiais (previsão 2027/2028)
// ─────────────────────────────────────────────────────────────────────────────

export const REFORMA_CONFIG = {
  // ── Alíquotas plenas estimadas (referência ANFIP/Unafisco jan/2025) ─────────
  // TODO: confirmar com publicação oficial do Comitê Gestor IBS (LC 227/2026)
  ALIQUOTA_CBS_PLENA: 0.088,   // 8,8%  — CBS federal (substitui PIS/COFINS)
  ALIQUOTA_IBS_PLENA: 0.177,   // 17,7% — IBS estadual+municipal (substitui ICMS+ISS)
  ALIQUOTA_IVA_TOTAL: 0.265,   // 26,5% — total de referência

  // ── Fatores de redução (LC 214/2025, arts. 19-24) ───────────────────────────
  FATOR_REDUCAO_60: 0.40,      // paga 40% → bens/serviços essenciais
  FATOR_REDUCAO_30: 0.70,      // paga 70% → profissionais intelectuais regulamentados
  ALIQUOTA_ZERO: 0.00,         // cesta básica nacional (art. 18)

  // ── Cronograma de transição (LC 214/2025, arts. 350-425) ────────────────────
  CRONOGRAMA: {
    2026: {
      cbs_teste:    0.009,       // 0,9% — fase de teste (compensável com PIS/COFINS)
      ibs_teste:    0.001,       // 0,1% — fase de teste
      pis_cofins:   "integral",
      ipi:          "integral",
      icms_fator:   1.0,
      iss_fator:    1.0,
      nota: "Fase de teste — IBS/CBS compensável com PIS/COFINS. Impacto líquido ≈ zero.",
    },
    2027: {
      cbs:          0.088,       // CBS plena entra em 1º/jan/2027
      ibs:          0.001,       // IBS ainda na fase de teste
      pis_cofins:   "extinto",   // PIS e COFINS extintos
      ipi:          "zero_exceto_zfm", // IPI zerado (exceto Zona Franca de Manaus)
      icms_fator:   1.0,
      iss_fator:    1.0,
      nota: "PIS/COFINS extintos. CBS plena (8,8%). Big bang federal.",
    },
    2028: {
      cbs:          0.088,
      ibs:          0.001,
      icms_fator:   1.0,
      iss_fator:    1.0,
      nota: "Estabilização. ICMS/ISS ainda integrais.",
    },
    2029: {
      cbs:          0.088,
      ibs_proporcao: 0.10,       // 10% do IBS pleno
      icms_fator:   0.90,        // ICMS cai para 90%
      iss_fator:    0.90,
      nota: "Início da migração ICMS/ISS → IBS. ICMS/ISS a 90%.",
    },
    2030: {
      cbs:          0.088,
      ibs_proporcao: 0.20,
      icms_fator:   0.80,
      iss_fator:    0.80,
      nota: "ICMS/ISS a 80% da alíquota original.",
    },
    2031: {
      cbs:          0.088,
      ibs_proporcao: 0.30,
      icms_fator:   0.70,
      iss_fator:    0.70,
      nota: "ICMS/ISS a 70% da alíquota original.",
    },
    2032: {
      cbs:          0.088,
      ibs_proporcao: 0.40,
      icms_fator:   0.60,
      iss_fator:    0.60,
      nota: "ICMS/ISS a 60% da alíquota original.",
    },
    2033: {
      cbs:          0.088,
      ibs:          0.177,
      icms_fator:   0.0,         // ICMS extinto
      iss_fator:    0.0,         // ISS extinto
      nota: "Sistema pleno. IBS+CBS substituem ICMS, ISS, PIS e COFINS.",
    },
  },

  // ── Tabelas Simples Nacional (LC 123/2006 — tabelas vigentes 2024) ───────────
  SIMPLES: {
    ANEXO_I: [  // Comércio
      { limite:  180000, aliquota: 0.040, pd:      0 },
      { limite:  360000, aliquota: 0.073, pd:   5940 },
      { limite:  720000, aliquota: 0.095, pd:  13860 },
      { limite: 1440000, aliquota: 0.107, pd:  22500 },
      { limite: 1800000, aliquota: 0.143, pd:  87300 },
      { limite: 4800000, aliquota: 0.190, pd: 378000 },
    ],
    ANEXO_II: [ // Indústria
      { limite:  180000, aliquota: 0.045, pd:      0 },
      { limite:  360000, aliquota: 0.078, pd:   5940 },
      { limite:  720000, aliquota: 0.100, pd:  13860 },
      { limite: 1440000, aliquota: 0.112, pd:  22500 },
      { limite: 1800000, aliquota: 0.147, pd:  85500 },
      { limite: 4800000, aliquota: 0.300, pd: 720000 },
    ],
    ANEXO_III: [ // Serviços (fator r ≥ 28%)
      { limite:  180000, aliquota: 0.060, pd:      0 },
      { limite:  360000, aliquota: 0.112, pd:   9360 },
      { limite:  720000, aliquota: 0.135, pd:  17640 },
      { limite: 1440000, aliquota: 0.160, pd:  35640 },
      { limite: 1800000, aliquota: 0.210, pd: 125640 },
      { limite: 4800000, aliquota: 0.330, pd: 648000 },
    ],
    ANEXO_IV: [ // Serviços sem CPP
      { limite:  180000, aliquota: 0.045, pd:      0 },
      { limite:  360000, aliquota: 0.090, pd:   8100 },
      { limite:  720000, aliquota: 0.102, pd:  12420 },
      { limite: 1440000, aliquota: 0.140, pd:  39780 },
      { limite: 1800000, aliquota: 0.220, pd: 183780 },
      { limite: 4800000, aliquota: 0.330, pd: 828000 },
    ],
    ANEXO_V: [ // Serviços (fator r < 28%)
      { limite:  180000, aliquota: 0.155, pd:      0 },
      { limite:  360000, aliquota: 0.180, pd:   4500 },
      { limite:  720000, aliquota: 0.195, pd:   9900 },
      { limite: 1440000, aliquota: 0.205, pd:  17100 },
      { limite: 1800000, aliquota: 0.230, pd:  62100 },
      { limite: 4800000, aliquota: 0.305, pd: 540000 },
    ],
  },

  // ── Presunções Lucro Presumido (RIR/2018, arts. 591-628) ────────────────────
  LP_PRESUNCOES: {
    irpj: { comercio: 0.08, servicos: 0.32, industria: 0.08, misto: 0.16 },
    csll: { comercio: 0.12, servicos: 0.32, industria: 0.12, misto: 0.20 },
  },

  // ── Estimativas médias para simulação ───────────────────────────────────────
  ICMS_MEDIO:  0.12,  // média nacional (varia por UF)
  ISS_MEDIO:   0.03,  // 3% médio (varia 2-5% por município)
  IPI_MEDIO:   0.05,  // referência indústria geral
};

// ── CNAEs elegíveis para redução de 30% (profissionais intelectuais) ──────────
// LC 214/2025, art. 21
export const CNAES_REDUCAO_30 = [
  "6911", "6912", // Jurídico / Cartórios
  "6920",         // Contabilidade
  "7111", "7112", "7119", // Arquitetura e Engenharia
  "7410",         // Design
  "7490",         // Outros serviços profissionais
  "8630", "8650", "8660", // Saúde
  "7500",         // Veterinária
  "6201", "6202", "6209", // TI / Software
];

// ── CNAEs elegíveis para redução de 60% ──────────────────────────────────────
// LC 214/2025, arts. 19-20
export const CNAES_REDUCAO_60 = [
  // Saúde
  "8610", "8621", "8622", "8630", "8640", "8650", "8660",
  // Educação
  "8511", "8512", "8513", "8520", "8531", "8532", "8541", "8542", "8550",
  // Transporte público
  "4921", "4922", "4923", "4924", "4929",
  // Agronegócio (produção primária)
  "0111", "0112", "0113", "0114", "0115", "0116", "0119",
  "0121", "0122", "0123", "0124", "0125",
  "0161", "0162", "0163", "0164",
];

// ── CNAEs com regime específico — não calcular; remeter à regulamentação ───────
export const CNAES_REGIME_ESPECIFICO = [
  "4731", "4732",         // Combustíveis
  "6411", "6412", "6421", "6422", "6423", "6431", "6432", "6511", "6512",
  "6520", "6530", "6610", "6621", "6622", "6629", "6630", // Financeiro
  "5510", "5590",         // Hotelaria
  "7911", "7912",         // Agências de viagem
];

// ── Lista de UFs brasileiras ──────────────────────────────────────────────────
export const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];
