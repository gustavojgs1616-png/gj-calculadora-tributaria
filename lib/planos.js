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
    descricao: "Ferramentas essenciais para o dia a dia contábil",
    ferramentas: ["noticias", "simulador", "fiscal", "cnpj", "documentos"],
  },
  profissional: {
    nome: "Profissional",
    cor: "#818cf8",
    corFundo: "#818cf818",
    descricao: "Ferramentas completas para contadores e escritórios",
    ferramentas: ["noticias", "simulador", "fiscal", "cnpj", "documentos", "honorarios", "icmsst"],
  },
  especialista: {
    nome: "Especialista",
    cor: "#DF9F20",
    corFundo: "#DF9F2018",
    descricao: "Acesso total + simulado CFC e novidades em primeira mão",
    ferramentas: ["noticias", "simulador", "fiscal", "cnpj", "documentos", "honorarios", "icmsst", "simulado"],
  },
};

export const FERRAMENTA_PLANO_MINIMO = {
  noticias:   "free",
  simulador:  "essencial",
  fiscal:     "essencial",
  cnpj:       "essencial",
  documentos: "essencial",
  honorarios: "profissional",
  icmsst:     "profissional",
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
