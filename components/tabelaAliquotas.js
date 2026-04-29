const SUL_SUDESTE = ['SP', 'MG', 'RJ', 'RS', 'SC', 'PR', 'ES'];

export function getAliquotaInterestadual(ufOrigem, ufDestino) {
  if (!ufOrigem || !ufDestino) return 12;
  if (SUL_SUDESTE.includes(ufOrigem) && SUL_SUDESTE.includes(ufDestino)) return 12;
  if (SUL_SUDESTE.includes(ufOrigem)) return 7;
  return 12;
}

export const aliquotasInternas = {
  AC: 17, AL: 18, AM: 18, AP: 18, BA: 19, CE: 18, DF: 18,
  ES: 17, GO: 17, MA: 18, MG: 18, MS: 17, MT: 17, PA: 17,
  PB: 18, PE: 18, PI: 18, PR: 19, RJ: 20, RN: 18, RO: 17.5,
  RR: 17, RS: 17, SC: 17, SE: 18, SP: 18, TO: 18,
};

export const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
];
