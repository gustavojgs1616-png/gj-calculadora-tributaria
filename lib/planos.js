export const PLANOS = {
  free: {
    nome: "Free",
    cor: "#64748b",
    corFundo: "#64748b12",
    descricao: "Acesso gratuito ao portal de notícias contábeis",
    ferramentas: ["noticias"],
  },
  essencial: {
    nome: "Essencial",
    cor: "#22c55e",
    corFundo: "#22c55e18",
    descricao: "Consultas rápidas e organização do dia a dia",
    ferramentas: ["noticias", "simulador", "fiscal"],
  },
  profissional: {
    nome: "Profissional",
    cor: "#818cf8",
    corFundo: "#818cf818",
    descricao: "Para o contador que opera escritório próprio",
    ferramentas: ["noticias", "simulador", "fiscal", "cnpj", "documentos", "honorarios", "rescisao"],
  },
  especialista: {
    nome: "Especialista",
    cor: "#DF9F20",
    corFundo: "#DF9F2018",
    descricao: "Acesso total, uso ilimitado e marca branca",
    ferramentas: ["noticias", "simulador", "fiscal", "cnpj", "documentos", "honorarios", "rescisao", "icmsst", "simulado", "reforma"],
  },
};

export const FERRAMENTA_PLANO_MINIMO = {
  noticias:   "free",
  simulador:  "essencial",
  fiscal:     "essencial",
  cnpj:       "profissional",
  documentos: "profissional",
  honorarios: "profissional",
  rescisao:   "profissional",
  icmsst:     "especialista",
  reforma:    "especialista",
  simulado:   "especialista",
};

const ORDEM = ["free", "essencial", "profissional", "especialista"];

export function temAcesso(planoUsuario, ferramenta) {
  if (!planoUsuario) return false;
  const necessario = FERRAMENTA_PLANO_MINIMO[ferramenta];
  return ORDEM.indexOf(planoUsuario) >= ORDEM.indexOf(necessario);
}

export function planoParaUpgrade(ferramenta) {
  return FERRAMENTA_PLANO_MINIMO[ferramenta] || "essencial";
}
