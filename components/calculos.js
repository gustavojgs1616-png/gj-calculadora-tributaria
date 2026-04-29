export const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
export const pct = (v) => `${(v || 0).toFixed(2)}%`;
// Lê um valor formatado em pt-BR ou número puro e retorna float
export const parseVal = (s) => {
  const str = String(s).trim();
  if (!str) return 0;
  // Número puro vindo do banco (ex: "300000" ou "300000.5")
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str) || 0;
  // Formato pt-BR: remove pontos de milhar, troca vírgula por ponto
  return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
};

// Máscara ATM: extrai só dígitos e formata como centavos (300000 → "3.000,00")
export const fmtInput = (s) => {
  const digits = String(s).replace(/\D/g, "");
  if (!digits) return "";
  const value = parseInt(digits, 10) / 100;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

// Formata número do banco para exibição no campo (300000 → "300.000,00")
export const fmtToInput = (n) => {
  if (!n) return "";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const SIMPLES_ANEXOS = {
  comercio: [
    [180000, 0.04, 0], [360000, 0.073, 5940], [720000, 0.095, 13860],
    [1800000, 0.107, 22500], [3600000, 0.143, 87300], [4800000, 0.19, 378000],
  ],
  industria: [
    [180000, 0.045, 0], [360000, 0.078, 5940], [720000, 0.1, 13860],
    [1800000, 0.112, 22500], [3600000, 0.147, 85500], [4800000, 0.3, 720000],
  ],
  servicos: [
    [180000, 0.06, 0], [360000, 0.112, 9360], [720000, 0.135, 17640],
    [1800000, 0.16, 35640], [3600000, 0.21, 125640], [4800000, 0.33, 648000],
  ],
};

export function calcSimples(fat, ativ) {
  if (fat > 4800000) return null;
  const tab = SIMPLES_ANEXOS[ativ] || SIMPLES_ANEXOS.servicos;
  let al = 0, ded = 0;
  for (const [ate, a, d] of tab) {
    if (fat <= ate) { al = a; ded = d; break; }
  }
  const ef = (fat * al - ded) / fat;
  return {
    regime: "Simples Nacional", cor: "#22c55e",
    aliqEfetiva: ef * 100, anual: fat * ef, mensal: (fat * ef) / 12,
    detalhe: "PIS • COFINS • IRPJ • CSLL • INSS unificados no DAS",
    itens: [{ label: "DAS unificado", valor: fat * ef }],
  };
}

export function calcLP(fat, ativ, folha) {
  const folhaAnual = folha * 12;
  const pres = (ativ === "comercio" || ativ === "industria") ? 0.08 : 0.32;
  const lp = fat * pres;
  const irpj = lp * 0.15;
  const adicIRPJ = Math.max(0, (lp - 240000) * 0.1);
  const csll = lp * 0.09;
  const pis = fat * 0.0065;
  const cofins = fat * 0.03;
  const inss = folhaAnual * 0.20;
  const terceiros = folhaAnual * 0.058;
  const fgts = folhaAnual * 0.08;
  const total = irpj + adicIRPJ + csll + pis + cofins + inss + terceiros + fgts;
  return {
    regime: "Lucro Presumido", cor: "#f5a623",
    aliqEfetiva: (total / fat) * 100, anual: total, mensal: total / 12,
    detalhe: `Presunção ${(pres * 100).toFixed(0)}% • PIS/COFINS cumulativo`,
    itens: [
      { label: `IRPJ (${(pres * 100).toFixed(0)}% presunção x 15%)`, valor: irpj },
      { label: "Adicional IRPJ (10%)", valor: adicIRPJ },
      { label: "CSLL (9%)", valor: csll },
      { label: "PIS (0,65%)", valor: pis },
      { label: "COFINS (3%)", valor: cofins },
      { label: "INSS Patronal (20%)", valor: inss },
      { label: "Terceiros (5,8%)", valor: terceiros },
      { label: "FGTS (8%)", valor: fgts },
    ],
  };
}

export function calcLR(fat, folha, custos) {
  const folhaAnual = folha * 12;
  const custosAnual = custos * 12;
  const lucro = fat - custosAnual - folhaAnual;
  const irpj = lucro > 0 ? lucro * 0.15 : 0;
  const adicIRPJ = lucro > 240000 ? (lucro - 240000) * 0.1 : 0;
  const csll = lucro > 0 ? lucro * 0.09 : 0;
  const pis = fat * 0.0165;
  const cofins = fat * 0.076;
  const inss = folhaAnual * 0.20;
  const terceiros = folhaAnual * 0.058;
  const fgts = folhaAnual * 0.08;
  const total = irpj + adicIRPJ + csll + pis + cofins + inss + terceiros + fgts;
  return {
    regime: "Lucro Real", cor: "#3b82f6",
    aliqEfetiva: (total / fat) * 100, anual: total, mensal: total / 12,
    lucroBase: lucro,
    detalhe: `Lucro base ${fmt(lucro)} • PIS/COFINS não-cumulativo`,
    itens: [
      { label: "IRPJ (15% sobre lucro real)", valor: irpj },
      { label: "Adicional IRPJ (10%)", valor: adicIRPJ },
      { label: "CSLL (9%)", valor: csll },
      { label: "PIS (1,65%)", valor: pis },
      { label: "COFINS (7,6%)", valor: cofins },
      { label: "INSS Patronal (20%)", valor: inss },
      { label: "Terceiros (5,8%)", valor: terceiros },
      { label: "FGTS (8%)", valor: fgts },
    ],
  };
}
