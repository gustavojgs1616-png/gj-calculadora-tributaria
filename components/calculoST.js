export function calcularICMSST(dados) {
  const {
    valorProduto = 0,
    frete = 0,
    seguro = 0,
    outrasDespesas = 0,
    desconto = 0,
    aliquotaIPI = 0,
    aliquotaInterestadual,
    aliquotaInterna,
    mvaOriginal,
    usarMVAAjustada = true,
    aliqFCP = 0,
  } = dados;

  const base = valorProduto + frete + seguro + outrasDespesas - desconto;

  const IPI = base * (aliquotaIPI / 100);

  const ICMSProprio = base * (aliquotaInterestadual / 100);

  let mvaFinal = mvaOriginal;
  let mvaAjustada = null;
  if (usarMVAAjustada && aliquotaInterestadual !== aliquotaInterna) {
    mvaAjustada =
      (((1 + mvaOriginal / 100) * (1 - aliquotaInterestadual / 100)) /
        (1 - aliquotaInterna / 100) - 1) * 100;
    mvaFinal = mvaAjustada;
  }

  const baseST = base * (1 + mvaFinal / 100);

  const ICMSSTBruto = baseST * (aliquotaInterna / 100);

  const ICMSSTRecolher = Math.max(0, ICMSSTBruto - ICMSProprio);

  // FCP — Fundo de Combate à Pobreza (AL, RJ, SE = 2%)
  // Incide sobre a mesma base do ICMS-ST
  const FCP = aliqFCP > 0 ? baseST * (aliqFCP / 100) : 0;

  const totalNota = base + IPI + ICMSSTRecolher + FCP;

  const cargaTributaria = base > 0
    ? ((ICMSProprio + ICMSSTRecolher + FCP) / base) * 100
    : 0;

  return {
    base,
    IPI,
    ICMSProprio,
    mvaOriginal,
    mvaAjustada,
    mvaFinal,
    baseST,
    ICMSSTBruto,
    ICMSSTRecolher,
    FCP,
    aliqFCP,
    totalNota,
    cargaTributaria,
  };
}

// ─── DIFAL — Diferencial de Alíquota ─────────────────────────────────────────
// tipoDifal: "b2c"  → venda interestadual a consumidor final (EC 87/2015 + LC 190/2022)
//            "uso"  → compra para ativo imobilizado ou consumo próprio
export function calcularDIFAL(dados) {
  const {
    valorProduto = 0,
    frete = 0,
    seguro = 0,
    outrasDespesas = 0,
    desconto = 0,
    aliquotaIPI = 0,
    aliquotaInterestadual,
    aliquotaInterna,
    aliqFCP = 0,
    tipoDifal = "b2c",
  } = dados;

  const base = valorProduto + frete + seguro + outrasDespesas - desconto;

  // No B2C, o IPI integra a base do DIFAL quando o destinatário é não contribuinte
  const IPI = tipoDifal === "b2c" ? base * (aliquotaIPI / 100) : 0;
  const baseDifal = base + IPI;

  const diferencialAliq = Math.max(0, aliquotaInterna - aliquotaInterestadual);
  const DIFAL = baseDifal * (diferencialAliq / 100);

  // FCP incide sobre a mesma base — estados AL, RJ, SE
  // No B2C aplica; para uso próprio verificar legislação específica
  const FCP = aliqFCP > 0 ? baseDifal * (aliqFCP / 100) : 0;

  const totalDifal = DIFAL + FCP;

  const cargaTributaria = base > 0 ? (totalDifal / base) * 100 : 0;

  return {
    base,
    IPI,
    baseDifal,
    diferencialAliq,
    DIFAL,
    FCP,
    aliqFCP,
    totalDifal,
    cargaTributaria,
    aliquotaInterestadual,
    aliquotaInterna,
    tipoDifal,
  };
}

export function fmt(v) {
  return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseVal(v) {
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
}
