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

  const totalNota = base + IPI + ICMSSTRecolher;

  const cargaTributaria = base > 0 ? ((ICMSProprio + ICMSSTRecolher) / base) * 100 : 0;

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
    totalNota,
    cargaTributaria,
  };
}

export function fmt(v) {
  return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseVal(v) {
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
}
