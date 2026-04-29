// Definição dos planos e ferramentas liberadas por plano
export const PLANOS = {
  essencial: {
    nome: "Essencial",
    cor: "#22c55e",
    corFundo: "#22c55e18",
    descricao: "Ferramentas essenciais para o dia a dia contábil",
    ferramentas: ["simulador", "fiscal", "cnpj", "documentos"],
  },
  profissional: {
    nome: "Profissional",
    cor: "#818cf8",
    corFundo: "#818cf818",
    descricao: "Ferramentas completas para contadores e escritórios",
    ferramentas: ["simulador", "fiscal", "cnpj", "documentos", "noticias", "honorarios", "icmsst"],
  },
  especialista: {
    nome: "Especialista",
    cor: "#DF9F20",
    corFundo: "#DF9F2018",
    descricao: "Acesso total + simulado CFC e novidades em primeira mão",
    ferramentas: ["simulador", "fiscal", "cnpj", "documentos", "noticias", "honorarios", "icmsst", "simulado"],
  },
};

// Qual plano mínimo cada ferramenta exige
export const FERRAMENTA_PLANO_MINIMO = {
  simulador:  "essencial",
  fiscal:     "essencial",
  cnpj:       "essencial",
  documentos: "essencial",
  noticias:   "profissional",
  honorarios: "profissional",
  icmsst:     "profissional",
  simulado:   "especialista",
};

const ORDEM = ["essencial", "profissional", "especialista"];

export function temAcesso(planoUsuario, ferramenta) {
  if (!planoUsuario) return false;
  const necessario = FERRAMENTA_PLANO_MINIMO[ferramenta];
  return ORDEM.indexOf(planoUsuario) >= ORDEM.indexOf(necessario);
}

export function planoParaUpgrade(ferramenta) {
  return FERRAMENTA_PLANO_MINIMO[ferramenta] || "profissional";
}
