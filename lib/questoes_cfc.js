// Banco de questões baseado no Exame de Suficiência CFC
// Distribuição por área conforme padrão das provas (2019-2024)

export const AREAS = [
  "Contabilidade Geral",
  "Contabilidade de Custos",
  "Análise das Demonstrações",
  "Auditoria e Perícia",
  "Contabilidade Tributária",
  "Legislação e Ética",
  "Contabilidade Pública",
];

export const QUESTOES = [
  // ── CONTABILIDADE GERAL (18 questões) ────────────────────────────────────
  {
    id: 1, area: "Contabilidade Geral", edicao: "2023/2", dificuldade: "facil",
    enunciado: "Uma empresa apresenta: Ativo Total = R$ 800.000; Passivo Circulante = R$ 120.000; Passivo Não Circulante = R$ 230.000. Qual o valor do Patrimônio Líquido?",
    alternativas: { A: "R$ 350.000", B: "R$ 450.000", C: "R$ 570.000", D: "R$ 680.000" },
    resposta: "B",
    explicacao: "PL = Ativo Total − Passivo Total. Passivo Total = 120.000 + 230.000 = R$ 350.000. Portanto, PL = 800.000 − 350.000 = R$ 450.000.",
  },
  {
    id: 2, area: "Contabilidade Geral", edicao: "2023/1", dificuldade: "facil",
    enunciado: "Um equipamento foi adquirido por R$ 80.000, com valor residual estimado de R$ 8.000 e vida útil de 6 anos. Pelo método das cotas constantes (linear), a depreciação anual é:",
    alternativas: { A: "R$ 10.000", B: "R$ 12.000", C: "R$ 13.333", D: "R$ 16.000" },
    resposta: "B",
    explicacao: "Depreciação = (Custo − Valor Residual) / Vida Útil = (80.000 − 8.000) / 6 = 72.000 / 6 = R$ 12.000 por ano.",
  },
  {
    id: 3, area: "Contabilidade Geral", edicao: "2024/1", dificuldade: "media",
    enunciado: "A empresa Alfa adquiriu 100 unidades a R$ 10,00 e depois 200 unidades a R$ 13,00. Com saída de 180 unidades pelo método PEPS (FIFO), o Custo das Mercadorias Vendidas (CMV) é:",
    alternativas: { A: "R$ 2.040", B: "R$ 2.160", C: "R$ 2.200", D: "R$ 2.340" },
    resposta: "A",
    explicacao: "PEPS: saem primeiro as 100 unidades a R$ 10 (R$ 1.000) e depois 80 unidades a R$ 13 (R$ 1.040). CMV = 1.000 + 1.040 = R$ 2.040.",
  },
  {
    id: 4, area: "Contabilidade Geral", edicao: "2022/2", dificuldade: "media",
    enunciado: "A empresa Beta tem estoque inicial de 50 unidades a R$ 20,00 e compra 150 unidades a R$ 24,00. Com saída de 100 unidades pelo Custo Médio Ponderado, o CMV é:",
    alternativas: { A: "R$ 2.000", B: "R$ 2.200", C: "R$ 2.300", D: "R$ 2.400" },
    resposta: "C",
    explicacao: "CMP = (50×20 + 150×24) / (50+150) = (1.000 + 3.600) / 200 = R$ 23,00/un. CMV = 100 × 23 = R$ 2.300.",
  },
  {
    id: 5, area: "Contabilidade Geral", edicao: "2023/1", dificuldade: "facil",
    enunciado: "A Provisão para Créditos de Liquidação Duvidosa (PCLD) é classificada no balanço patrimonial como:",
    alternativas: {
      A: "Passivo Circulante",
      B: "Conta retificadora do Ativo Circulante",
      C: "Reserva de lucros no Patrimônio Líquido",
      D: "Despesa operacional no resultado",
    },
    resposta: "B",
    explicacao: "A PCLD é uma conta retificadora (credora) do Ativo Circulante, reduzindo o saldo de Clientes ao valor provável de realização.",
  },
  {
    id: 6, area: "Contabilidade Geral", edicao: "2024/2", dificuldade: "media",
    enunciado: "Segundo a NBC TG 12, o Ajuste a Valor Presente (AVP) deve ser aplicado a:",
    alternativas: {
      A: "Apenas operações com taxa de juros explícita contratada",
      B: "Somente transações entre partes relacionadas",
      C: "Itens monetários de longo prazo relevantes, mesmo sem taxa de juros explícita",
      D: "Exclusivamente quando exigido pelo fisco",
    },
    resposta: "C",
    explicacao: "O AVP deve ser aplicado a ativos e passivos monetários de longo prazo relevantes, ainda que a taxa de juros não esteja explicitada no contrato (NBC TG 12).",
  },
  {
    id: 7, area: "Contabilidade Geral", edicao: "2022/1", dificuldade: "dificil",
    enunciado: "Na operação de desconto de duplicatas em instituição financeira, o registro contábil correto é:",
    alternativas: {
      A: "Baixa da duplicata do ativo e reconhecimento do líquido como receita financeira",
      B: "Manutenção da duplicata no ativo e registro de obrigação (empréstimo) no passivo",
      C: "Transferência da duplicata do circulante para o não circulante",
      D: "Reconhecimento da diferença entre o nominal e o líquido como despesa de capital",
    },
    resposta: "B",
    explicacao: "O desconto de duplicatas é uma operação de empréstimo com garantia. A duplicata permanece no ativo (em conta retificadora) e registra-se um passivo financeiro, evidenciando o risco de crédito retido.",
  },
  {
    id: 8, area: "Contabilidade Geral", edicao: "2023/2", dificuldade: "facil",
    enunciado: "São consideradas variações patrimoniais QUALITATIVAS aquelas que:",
    alternativas: {
      A: "Aumentam o valor do Patrimônio Líquido",
      B: "Diminuem o valor do Patrimônio Líquido",
      C: "Não alteram o valor do Patrimônio Líquido, apenas modificam sua composição ou estrutura",
      D: "Sempre decorrem do reconhecimento de receitas e despesas",
    },
    resposta: "C",
    explicacao: "Variações qualitativas (permutativas) não alteram o PL — trocam um elemento por outro (ex: compra de estoque à vista: caixa ↓, estoque ↑). Variações quantitativas (modificativas) alteram o PL.",
  },
  {
    id: 9, area: "Contabilidade Geral", edicao: "2024/1", dificuldade: "media",
    enunciado: "Ativo intangível com vida útil DEFINIDA deve ser:",
    alternativas: {
      A: "Testado anualmente para redução ao valor recuperável, sem amortização",
      B: "Amortizado ao longo de sua vida útil estimada e testado para impairment quando houver indicativo",
      C: "Mantido ao custo histórico indefinidamente, sem ajustes",
      D: "Tratado como despesa do exercício no momento da aquisição",
    },
    resposta: "B",
    explicacao: "Intangível com vida útil definida: amortiza-se sistematicamente + impairment quando houver indicativo. Intangível com vida útil indefinida: não amortiza, mas testa impairment anualmente (NBC TG 04).",
  },
  {
    id: 10, area: "Contabilidade Geral", edicao: "2022/2", dificuldade: "media",
    enunciado: "Constitui RESERVA DE CAPITAL, conforme a Lei das S.A. (Lei 6.404/76):",
    alternativas: {
      A: "Reserva legal",
      B: "Reserva de lucros a realizar",
      C: "Ágio na emissão de ações",
      D: "Reserva estatutária",
    },
    resposta: "C",
    explicacao: "Reservas de capital decorrem de contribuições dos sócios sem contrapartida em serviços/bens (ex.: ágio na emissão de ações, alienação de partes beneficiárias). As demais alternativas são reservas de lucros.",
  },
  {
    id: 11, area: "Contabilidade Geral", edicao: "2023/1", dificuldade: "facil",
    enunciado: "Segundo a Lei 6.404/76, quando o estatuto social for omisso, o dividendo mínimo obrigatório é de:",
    alternativas: { A: "10% do lucro líquido ajustado", B: "20% do lucro líquido ajustado", C: "25% do lucro líquido ajustado", D: "50% do lucro líquido ajustado" },
    resposta: "C",
    explicacao: "O art. 202 da Lei 6.404/76 estabelece que, na omissão do estatuto, o dividendo obrigatório corresponde a 25% do lucro líquido ajustado pelas destinações legais.",
  },
  {
    id: 12, area: "Contabilidade Geral", edicao: "2024/2", dificuldade: "facil",
    enunciado: "Na Demonstração do Resultado do Exercício (DRE), a sequência CORRETA de apuração é:",
    alternativas: {
      A: "Receita Bruta → CMV → Deduções → Lucro Bruto",
      B: "Receita Bruta → Deduções → Receita Líquida → CMV → Lucro Bruto",
      C: "Receita Líquida → Lucro Bruto → Receita Bruta → Resultado Operacional",
      D: "Receita Bruta → Lucro Bruto → CMV → Resultado Bruto",
    },
    resposta: "B",
    explicacao: "A DRE parte da Receita Bruta, subtrai as deduções (devoluções, abatimentos, impostos) para obter a Receita Líquida. Depois subtrai o CMV/CPV para chegar ao Lucro Bruto.",
  },
  {
    id: 13, area: "Contabilidade Geral", edicao: "2023/2", dificuldade: "media",
    enunciado: "Segundo a NBC TG Estrutura Conceitual, a característica qualitativa fundamental da 'RELEVÂNCIA' significa que a informação:",
    alternativas: {
      A: "Está livre de erros materiais e vieses",
      B: "Pode ser verificada por observadores independentes",
      C: "É capaz de fazer diferença nas decisões tomadas pelos usuários",
      D: "Está disponível para os usuários antes de perder a capacidade de influenciar decisões",
    },
    resposta: "C",
    explicacao: "Relevância: a informação é relevante quando tem potencial de influenciar as decisões dos usuários — seja por valor preditivo, valor confirmatório, ou ambos. Livre de erros é 'representação fidedigna'; C refere-se à oportunidade.",
  },
  {
    id: 14, area: "Contabilidade Geral", edicao: "2022/1", dificuldade: "facil",
    enunciado: "Uma empresa recebeu em dezembro/X1 R$ 12.000 referente a aluguel do período janeiro a junho/X2. Pelo regime de COMPETÊNCIA, o correto é:",
    alternativas: {
      A: "Reconhecer os R$ 12.000 como receita em dezembro/X1 no momento do recebimento",
      B: "Registrar como receita diferida (passivo) e apropriar R$ 2.000 mensalmente em X2",
      C: "Reconhecer 50% em dezembro/X1 e 50% em junho/X2",
      D: "Registrar somente quando o contrato for encerrado, em junho/X2",
    },
    resposta: "B",
    explicacao: "Pelo princípio da competência, receitas são reconhecidas quando ganhas (no período a que se referem). Os R$ 12.000 são competência de X2, devendo ser diferidos no passivo e apropriados mensalmente (R$ 2.000/mês).",
  },
  {
    id: 15, area: "Contabilidade Geral", edicao: "2024/1", dificuldade: "dificil",
    enunciado: "O Imposto de Renda Diferido ATIVO (IRDA) é reconhecido quando:",
    alternativas: {
      A: "O lucro contábil é maior que o lucro fiscal (tributável) no período",
      B: "Existem diferenças temporárias dedutíveis ou prejuízos fiscais compensáveis",
      C: "A empresa antecipou recolhimento de IRPJ por estimativas mensais",
      D: "Existem diferenças temporárias tributáveis geradoras de obrigação futura",
    },
    resposta: "B",
    explicacao: "O IRDA é reconhecido sobre diferenças temporárias dedutíveis (despesa contabilizada antes de ser dedutível) e sobre prejuízos fiscais/bases negativas de CSLL a compensar, quando houver expectativa de lucros futuros (NBC TG 32).",
  },
  {
    id: 16, area: "Contabilidade Geral", edicao: "2023/1", dificuldade: "dificil",
    enunciado: "Na combinação de negócios (NBC TG 15), o goodwill (ágio por expectativa de rentabilidade futura) corresponde ao:",
    alternativas: {
      A: "Valor total pago pela aquisição do negócio",
      B: "Excesso do valor pago sobre o valor justo dos ativos líquidos identificáveis adquiridos",
      C: "Valor contábil dos ativos menos os passivos assumidos na data de aquisição",
      D: "Diferença entre o lucro projetado e o lucro histórico da adquirida",
    },
    resposta: "B",
    explicacao: "O goodwill = Contraprestação transferida (preço pago) − Valor justo dos ativos líquidos identificáveis. Representa sinergias, marca e outros benefícios econômicos futuros não separadamente identificáveis (NBC TG 15).",
  },
  {
    id: 17, area: "Contabilidade Geral", edicao: "2022/2", dificuldade: "dificil",
    enunciado: "Os instrumentos financeiros mensurados ao Valor Justo por meio de Outros Resultados Abrangentes (VJORA) têm suas variações de valor reconhecidas:",
    alternativas: {
      A: "Integralmente no resultado do exercício quando ocorrem",
      B: "No Ativo Diferido até sua realização",
      C: "Diretamente no Patrimônio Líquido, em Outros Resultados Abrangentes",
      D: "Somente no resultado quando o instrumento for vendido ou liquidado",
    },
    resposta: "C",
    explicacao: "Instrumentos VJORA: variações de valor justo vão para ORA (Outros Resultados Abrangentes) no PL. Ao ser vendido, o ganho/perda acumulado no ORA é reciclado para o resultado (NBC TG 48).",
  },
  {
    id: 18, area: "Contabilidade Geral", edicao: "2024/2", dificuldade: "facil",
    enunciado: "As notas explicativas são:",
    alternativas: {
      A: "Obrigatórias apenas para companhias abertas registradas na CVM",
      B: "Opcionais para empresas de pequeno porte",
      C: "Parte integrante das demonstrações contábeis, fornecendo informações adicionais e complementares",
      D: "Elaboradas apenas quando há resultado negativo (prejuízo)",
    },
    resposta: "C",
    explicacao: "As notas explicativas integram as demonstrações contábeis (NBC TG 26). São obrigatórias para todos os que aplicam as normas CFC e devem incluir políticas contábeis relevantes e informações que não estão nas demonstrações.",
  },

  // ── CONTABILIDADE DE CUSTOS (8 questões) ─────────────────────────────────
  {
    id: 19, area: "Contabilidade de Custos", edicao: "2023/2", dificuldade: "facil",
    enunciado: "Uma empresa tem custos fixos de R$ 45.000, preço de venda unitário de R$ 75 e custo variável unitário de R$ 30. O ponto de equilíbrio contábil em unidades é:",
    alternativas: { A: "600 unidades", B: "750 unidades", C: "1.000 unidades", D: "1.500 unidades" },
    resposta: "C",
    explicacao: "PE (un) = Custos Fixos / Margem de Contribuição Unitária = 45.000 / (75 − 30) = 45.000 / 45 = 1.000 unidades.",
  },
  {
    id: 20, area: "Contabilidade de Custos", edicao: "2024/1", dificuldade: "facil",
    enunciado: "A Margem de Contribuição Unitária é calculada como:",
    alternativas: {
      A: "Preço de venda − Custo fixo unitário",
      B: "Preço de venda − Custo variável unitário",
      C: "Receita total − Custo total",
      D: "Lucro líquido + Custos fixos totais",
    },
    resposta: "B",
    explicacao: "MCu = Preço de Venda − Custo Variável Unitário. Representa a contribuição de cada unidade vendida para cobrir os custos fixos e gerar lucro.",
  },
  {
    id: 21, area: "Contabilidade de Custos", edicao: "2022/2", dificuldade: "dificil",
    enunciado: "No custeio por absorção, quando a produção é MAIOR que as vendas (estoque aumenta), comparado ao custeio variável, o lucro será:",
    alternativas: {
      A: "Igual em ambos os métodos",
      B: "Menor no custeio por absorção",
      C: "Maior no custeio por absorção",
      D: "Indeterminado, dependendo do critério de rateio",
    },
    resposta: "C",
    explicacao: "No custeio por absorção, parte dos custos fixos fica 'represada' no estoque (ativo), reduzindo o CPV. Resultado: lucro maior. No custeio variável, todos os CF vão ao resultado, gerando lucro menor quando há aumento de estoque.",
  },
  {
    id: 22, area: "Contabilidade de Custos", edicao: "2023/1", dificuldade: "facil",
    enunciado: "O Custo de Transformação é composto por:",
    alternativas: {
      A: "Matéria-prima + Custos Indiretos de Fabricação",
      B: "Mão de Obra Direta + Custos Indiretos de Fabricação",
      C: "Matéria-prima + Mão de Obra Direta",
      D: "Todos os custos diretos + todos os custos indiretos",
    },
    resposta: "B",
    explicacao: "Custo de Transformação = MOD + CIF. Representa o esforço de conversão da matéria-prima em produto acabado, excluindo o material direto.",
  },
  {
    id: 23, area: "Contabilidade de Custos", edicao: "2024/2", dificuldade: "media",
    enunciado: "No Custeio Baseado em Atividades (ABC), o 'direcionador de custo' representa:",
    alternativas: {
      A: "O total de custos indiretos a ser rateado proporcionalmente ao volume",
      B: "O critério que evidencia a relação de causa e efeito entre a atividade e o consumo de recursos",
      C: "O volume total de produção da empresa no período",
      D: "O valor do custo direto alocado a cada produto acabado",
    },
    resposta: "B",
    explicacao: "No ABC, o direcionador de custo (cost driver) é o fator que melhor explica por que uma atividade consome recursos ou por que um produto/serviço consome atividades — causalidade, não rateio arbitrário.",
  },
  {
    id: 24, area: "Contabilidade de Custos", edicao: "2022/1", dificuldade: "dificil",
    enunciado: "A variação de PREÇO de material no sistema de Custo Padrão é calculada como:",
    alternativas: {
      A: "(Quantidade Real − Quantidade Padrão) × Preço Padrão",
      B: "(Preço Real − Preço Padrão) × Quantidade Real",
      C: "Preço Real × (Quantidade Real − Quantidade Padrão)",
      D: "(Preço Padrão − Preço Real) × Quantidade Padrão",
    },
    resposta: "B",
    explicacao: "Variação de Preço = (PR − PP) × QR. Indica se o preço efetivamente pago foi maior (desfavorável) ou menor (favorável) que o padrão, aplicado sobre a quantidade real comprada/consumida.",
  },
  {
    id: 25, area: "Contabilidade de Custos", edicao: "2023/2", dificuldade: "facil",
    enunciado: "Qual a principal diferença entre custos DIRETOS e custos INDIRETOS?",
    alternativas: {
      A: "Custos diretos são sempre variáveis; custos indiretos são sempre fixos",
      B: "Custos diretos são identificáveis objetivamente ao produto; os indiretos requerem critério de rateio",
      C: "Custos diretos incluem apenas mão de obra; indiretos apenas materiais",
      D: "Custos diretos são pagos antes da produção; indiretos, depois",
    },
    resposta: "B",
    explicacao: "Custos diretos (ex.: MP, MOD) são apropriados ao produto sem necessidade de rateio — identificação direta e objetiva. Custos indiretos (ex.: aluguel, energia) precisam de critério de rateio pois beneficiam múltiplos produtos.",
  },
  {
    id: 26, area: "Contabilidade de Custos", edicao: "2024/1", dificuldade: "media",
    enunciado: "A Margem de Segurança Operacional representa:",
    alternativas: {
      A: "A diferença entre o lucro líquido e os custos fixos do período",
      B: "O volume de vendas que excede o ponto de equilíbrio — quanto as vendas podem cair antes de gerar prejuízo",
      C: "O valor mínimo de faturamento necessário para pagar todas as dívidas da empresa",
      D: "A relação percentual entre custos variáveis e receita total",
    },
    resposta: "B",
    explicacao: "Margem de Segurança = Vendas Reais − Vendas no PE. Indica a 'folga' antes do prejuízo. Pode ser expressa em valor, unidades ou percentual: MS% = MS / Vendas Reais × 100.",
  },

  // ── ANÁLISE DAS DEMONSTRAÇÕES (8 questões) ───────────────────────────────
  {
    id: 27, area: "Análise das Demonstrações", edicao: "2023/2", dificuldade: "facil",
    enunciado: "Com base nos dados: Ativo Circulante = R$ 320.000; Estoques = R$ 80.000; Passivo Circulante = R$ 160.000. O índice de Liquidez Seca é:",
    alternativas: { A: "2,00", B: "1,75", C: "1,50", D: "1,25" },
    resposta: "C",
    explicacao: "Liquidez Seca = (AC − Estoques) / PC = (320.000 − 80.000) / 160.000 = 240.000 / 160.000 = 1,50.",
  },
  {
    id: 28, area: "Análise das Demonstrações", edicao: "2024/1", dificuldade: "facil",
    enunciado: "O índice de Liquidez Corrente de uma empresa é 1,8. Isso indica que:",
    alternativas: {
      A: "A empresa está tecnicamente insolvente",
      B: "Para cada R$ 1,00 de dívida de curto prazo, a empresa tem R$ 1,80 em ativos circulantes",
      C: "80% dos ativos são financiados por capital próprio",
      D: "O giro do ativo circulante é de 1,8 vezes ao ano",
    },
    resposta: "B",
    explicacao: "LC = AC / PC = 1,8 significa que para cada R$ 1 de obrigação circulante há R$ 1,80 de ativo circulante — indica boa capacidade de pagamento de curto prazo.",
  },
  {
    id: 29, area: "Análise das Demonstrações", edicao: "2022/2", dificuldade: "facil",
    enunciado: "O índice de Endividamento Geral é calculado como:",
    alternativas: {
      A: "Passivo Total / Ativo Total",
      B: "Passivo Circulante / Passivo Total",
      C: "Patrimônio Líquido / Ativo Total",
      D: "Dívida Líquida / EBITDA",
    },
    resposta: "A",
    explicacao: "Endividamento Geral = Passivo Total / Ativo Total. Indica a proporção do ativo financiada por capitais de terceiros. Quanto maior, maior a dependência de recursos externos.",
  },
  {
    id: 30, area: "Análise das Demonstrações", edicao: "2023/1", dificuldade: "media",
    enunciado: "O ROE (Return on Equity) — Retorno sobre o Patrimônio Líquido — é calculado como:",
    alternativas: {
      A: "Lucro Bruto / Patrimônio Líquido",
      B: "EBITDA / Patrimônio Líquido",
      C: "Lucro Líquido / Patrimônio Líquido Médio",
      D: "Lucro Operacional / Patrimônio Líquido Inicial",
    },
    resposta: "C",
    explicacao: "ROE = Lucro Líquido / PL Médio. Mede o retorno gerado sobre o capital investido pelos proprietários. O PL médio é mais adequado pois o PL varia durante o exercício.",
  },
  {
    id: 31, area: "Análise das Demonstrações", edicao: "2024/2", dificuldade: "media",
    enunciado: "O Prazo Médio de Recebimento (PMR) mede:",
    alternativas: {
      A: "O tempo médio que a empresa leva para pagar seus fornecedores",
      B: "O número médio de dias que a empresa demora para receber suas vendas a prazo",
      C: "A velocidade de rotação dos estoques em dias",
      D: "O intervalo médio entre compra e venda de mercadorias",
    },
    resposta: "B",
    explicacao: "PMR = (Contas a Receber / Receita Bruta) × 360. Indica em quantos dias, em média, a empresa recebe suas vendas a prazo. Quanto menor, melhor para o fluxo de caixa.",
  },
  {
    id: 32, area: "Análise das Demonstrações", edicao: "2022/1", dificuldade: "media",
    enunciado: "O GIRO DO ATIVO é um indicador de:",
    alternativas: {
      A: "Rentabilidade — retorno gerado sobre o ativo total",
      B: "Eficiência — quantas vezes o ativo total se 'renovou' em receitas no período",
      C: "Liquidez — capacidade de pagamento de curto prazo",
      D: "Estrutura de capital — proporção entre capital próprio e de terceiros",
    },
    resposta: "B",
    explicacao: "Giro do Ativo = Receita Líquida / Ativo Total Médio. Indicador de eficiência operacional: quantas vezes a empresa gerou receitas equivalentes ao total do ativo no período.",
  },
  {
    id: 33, area: "Análise das Demonstrações", edicao: "2023/2", dificuldade: "dificil",
    enunciado: "A Necessidade de Capital de Giro (NCG) é calculada como:",
    alternativas: {
      A: "Ativo Circulante − Passivo Circulante (Capital de Giro Líquido)",
      B: "Ativo Circulante Operacional − Passivo Circulante Operacional",
      C: "Caixa + Bancos + Aplicações Financeiras de Curto Prazo",
      D: "Capital de Giro Líquido + Empréstimos Bancários de Curto Prazo",
    },
    resposta: "B",
    explicacao: "NCG = ACO − PCO (ativos e passivos operacionais, excluindo itens financeiros/erráticos). Diferente do CGL (total), a NCG mede apenas o ciclo operacional. Empresas com NCG positiva precisam de financiamento para o giro.",
  },
  {
    id: 34, area: "Análise das Demonstrações", edicao: "2024/1", dificuldade: "dificil",
    enunciado: "O Grau de Alavancagem Operacional (GAO) mensura:",
    alternativas: {
      A: "A relação entre lucro líquido e lucro operacional antes dos juros",
      B: "A variação percentual no lucro operacional resultante de 1% de variação nas vendas",
      C: "A proporção de custos fixos em relação ao custo total",
      D: "A diferença entre margem bruta e margem operacional",
    },
    resposta: "B",
    explicacao: "GAO = % Δ LAJIR / % Δ Vendas = MC / LAJIR. Indica a sensibilidade do lucro operacional às variações nas vendas — quanto maior a proporção de CF, maior o GAO e o risco operacional.",
  },

  // ── AUDITORIA E PERÍCIA (8 questões) ────────────────────────────────────
  {
    id: 35, area: "Auditoria e Perícia", edicao: "2023/1", dificuldade: "media",
    enunciado: "O auditor independente emite OPINIÃO ADVERSA quando:",
    alternativas: {
      A: "Não consegue obter evidências suficientes e os efeitos são materiais e generalizados",
      B: "As distorções são materiais, mas restritas a determinados elementos das demonstrações",
      C: "As distorções identificadas são materiais E generalizadas nas demonstrações contábeis",
      D: "Existe incerteza relevante sobre a continuidade operacional da entidade",
    },
    resposta: "C",
    explicacao: "Opinião adversa (NBC TA 705): distorções são materiais E generalizadas. Se materiais mas não generalizadas → ressalva. Se não consegue obter evidências e efeitos são materiais e generalizados → abstenção.",
  },
  {
    id: 36, area: "Auditoria e Perícia", edicao: "2024/2", dificuldade: "media",
    enunciado: "A ABSTENÇÃO de opinião em auditoria ocorre quando:",
    alternativas: {
      A: "O auditor discorda fundamentalmente das políticas contábeis adotadas",
      B: "O auditor não obtém evidências suficientes e os possíveis efeitos são materiais e generalizados",
      C: "As demonstrações contêm distorções relevantes não corrigidas pela administração",
      D: "O auditor identifica indícios de fraude praticada pela alta administração",
    },
    resposta: "B",
    explicacao: "Abstenção de opinião (NBC TA 705): impossibilidade de obter evidências suficientes e apropriadas com efeitos possíveis materiais e generalizados. É diferente da opinião adversa (distorções identificadas e materiais/generalizadas).",
  },
  {
    id: 37, area: "Auditoria e Perícia", edicao: "2022/2", dificuldade: "facil",
    enunciado: "A CONFIRMAÇÃO EXTERNA (circularização) é um procedimento de auditoria que consiste em:",
    alternativas: {
      A: "Revisar os lançamentos contábeis nos livros de razão e diário",
      B: "Obter declaração direta de terceiros (bancos, clientes, fornecedores) em resposta a solicitação do auditor",
      C: "Comparar saldos contábeis do período atual com os do período anterior",
      D: "Inspecionar fisicamente os estoques na data do balanço",
    },
    resposta: "B",
    explicacao: "Confirmação externa (NBC TA 505): o auditor solicita diretamente a terceiros independentes (ex.: saldo bancário ao banco, saldo de clientes aos próprios devedores) a confirmação de informações. Alta confiabilidade como evidência.",
  },
  {
    id: 38, area: "Auditoria e Perícia", edicao: "2023/2", dificuldade: "facil",
    enunciado: "Os componentes do RISCO DE AUDITORIA são:",
    alternativas: {
      A: "Risco de fraude, risco de erro e risco de continuidade operacional",
      B: "Risco inerente, risco de controle e risco de detecção",
      C: "Risco estratégico, risco operacional e risco financeiro",
      D: "Risco de negócio, risco de distorção e risco de consequência",
    },
    resposta: "B",
    explicacao: "Risco de Auditoria = Risco Inerente × Risco de Controle × Risco de Detecção. O auditor controla o risco de detecção (natureza, oportunidade e extensão dos procedimentos) para manter o risco de auditoria em nível aceitavelmente baixo.",
  },
  {
    id: 39, area: "Auditoria e Perícia", edicao: "2024/1", dificuldade: "facil",
    enunciado: "A perícia contábil JUDICIAL é aquela realizada:",
    alternativas: {
      A: "Por iniciativa do contador, sem relacionamento com processo judicial",
      B: "No âmbito extrajudicial para assessorar partes em acordos e negociações",
      C: "No âmbito do processo judicial, por determinação do juiz ou requerimento das partes",
      D: "Exclusivamente por auditores registrados na CVM",
    },
    resposta: "C",
    explicacao: "Perícia judicial: realizada dentro de processo judicial, sendo o perito nomeado pelo juízo. Perícia extrajudicial: realizada fora do judiciário (arbitragem, assessoria). Ambas produzem laudo, mas o judicial tem fé pública.",
  },
  {
    id: 40, area: "Auditoria e Perícia", edicao: "2022/1", dificuldade: "facil",
    enunciado: "O LAUDO PERICIAL CONTÁBIL é:",
    alternativas: {
      A: "O documento de contestação formulado pelo assistente técnico",
      B: "O instrumento formal pelo qual o perito comunica o resultado de seus trabalhos ao juízo ou às partes",
      C: "O conjunto de quesitos formulados pelas partes ao perito",
      D: "O parecer emitido pelo CRC sobre a conduta do profissional",
    },
    resposta: "B",
    explicacao: "O laudo pericial é o produto final da perícia — documento técnico-científico que responde aos quesitos e apresenta as conclusões do perito. Deve seguir os requisitos da NBC TP 01.",
  },
  {
    id: 41, area: "Auditoria e Perícia", edicao: "2023/1", dificuldade: "facil",
    enunciado: "Na perícia contábil, os QUESITOS são:",
    alternativas: {
      A: "As objeções formuladas pelo perito ao laudo da parte contrária",
      B: "As perguntas formuladas pelas partes litigantes ou pelo juiz para orientar o trabalho do perito",
      C: "Os documentos e registros contábeis que instruem o processo",
      D: "As respostas finais do perito às dúvidas da administração da empresa",
    },
    resposta: "B",
    explicacao: "Quesitos são as perguntas técnicas formuladas ao perito pelas partes (autor, réu) ou pelo magistrado para delimitar o objeto da perícia. O perito responde a cada quesito no laudo.",
  },
  {
    id: 42, area: "Auditoria e Perícia", edicao: "2024/2", dificuldade: "media",
    enunciado: "A auditoria INTERNA difere da auditoria EXTERNA principalmente porque:",
    alternativas: {
      A: "A auditoria interna avalia apenas controles financeiros; a externa avalia também operações",
      B: "A auditoria interna é realizada por funcionários ou terceiros contratados pela organização; a externa é independente",
      C: "Somente a auditoria externa utiliza técnicas de amostragem estatística",
      D: "A auditoria interna emite parecer público; a externa emite apenas relatório interno",
    },
    resposta: "B",
    explicacao: "Principal diferença: a auditoria interna serve à organização (subordinada à alta administração/conselho) enquanto a externa serve aos usuários externos das demonstrações, com total independência em relação à entidade auditada.",
  },

  // ── CONTABILIDADE TRIBUTÁRIA (9 questões) ────────────────────────────────
  {
    id: 43, area: "Contabilidade Tributária", edicao: "2023/2", dificuldade: "facil",
    enunciado: "São obrigadas ao regime do Lucro Real as pessoas jurídicas cuja receita total no ano-calendário anterior seja superior a:",
    alternativas: { A: "R$ 48 milhões", B: "R$ 60 milhões", C: "R$ 78 milhões", D: "R$ 100 milhões" },
    resposta: "C",
    explicacao: "Conforme a Lei 12.814/2013, estão obrigadas ao Lucro Real as PJ com receita bruta total no ano anterior superior a R$ 78 milhões (além de outras hipóteses específicas previstas no art. 14 da Lei 9.718/98).",
  },
  {
    id: 44, area: "Contabilidade Tributária", edicao: "2022/1", dificuldade: "media",
    enunciado: "No Lucro Presumido, o percentual de presunção de lucro para a maioria das atividades de PRESTAÇÃO DE SERVIÇOS é:",
    alternativas: { A: "8%", B: "16%", C: "32%", D: "25%" },
    resposta: "C",
    explicacao: "O percentual de presunção para serviços em geral é 32% sobre a receita bruta. Para alguns serviços específicos é 16% (ex.: serviços hospitalares com estrutura própria) ou 8% (para certas atividades equiparadas ao comércio).",
  },
  {
    id: 45, area: "Contabilidade Tributária", edicao: "2024/1", dificuldade: "media",
    enunciado: "A alíquota básica do IRPJ é de 15%, com adicional de 10% sobre a parcela do lucro que exceder, mensalmente:",
    alternativas: { A: "R$ 10.000", B: "R$ 20.000", C: "R$ 25.000", D: "R$ 30.000" },
    resposta: "B",
    explicacao: "IRPJ: 15% sobre todo o lucro tributável + adicional de 10% sobre a parcela que exceder R$ 20.000/mês (R$ 240.000/ano). O adicional incide sobre o excedente, não sobre o total.",
  },
  {
    id: 46, area: "Contabilidade Tributária", edicao: "2023/1", dificuldade: "facil",
    enunciado: "A alíquota da CSLL para as pessoas jurídicas em geral (exceto instituições financeiras e seguradoras) é de:",
    alternativas: { A: "6%", B: "9%", C: "12%", D: "15%" },
    resposta: "B",
    explicacao: "CSLL: alíquota geral de 9%. Instituições financeiras e equiparadas: 15% (20% a partir de 2023 para alguns segmentos). A base de cálculo é o resultado ajustado (Lucro Real) ou presumido (Lucro Presumido).",
  },
  {
    id: 47, area: "Contabilidade Tributária", edicao: "2022/2", dificuldade: "facil",
    enunciado: "O Documento de Arrecadação do Simples Nacional (DAS) é uma guia unificada que, para a maioria das empresas optantes, inclui:",
    alternativas: {
      A: "Apenas IRPJ e CSLL",
      B: "Apenas os tributos federais (IRPJ, CSLL, PIS, COFINS)",
      C: "Tributos federais, estaduais (ICMS) e municipais (ISS) em documento único",
      D: "Somente INSS patronal e FGTS",
    },
    resposta: "C",
    explicacao: "O DAS unifica: IRPJ, CSLL, PIS, COFINS, IPI, CPP (contribuição patronal), ICMS e ISS. A simplificação é justamente o recolhimento de todos esses tributos em uma única guia mensal.",
  },
  {
    id: 48, area: "Contabilidade Tributária", edicao: "2024/2", dificuldade: "media",
    enunciado: "No LALUR (Livro de Apuração do Lucro Real), constituem ADIÇÕES ao lucro contábil:",
    alternativas: {
      A: "Depreciação acelerada incentivada para fins fiscais",
      B: "Dividendos recebidos de investimentos avaliados pelo custo",
      C: "Despesas contabilizadas não dedutíveis, como multas de trânsito e brindes",
      D: "Reversão de provisões não dedutíveis constituídas em exercícios anteriores",
    },
    resposta: "C",
    explicacao: "Adições: despesas contabilizadas mas não dedutíveis fiscalmente (multas de trânsito, brindes, provisões não aceitas, etc.) — aumentam o lucro fiscal. Exclusões: receitas tributadas antecipadamente ou rendimentos não tributáveis.",
  },
  {
    id: 49, area: "Contabilidade Tributária", edicao: "2023/2", dificuldade: "media",
    enunciado: "No regime NÃO CUMULATIVO do PIS/COFINS, as alíquotas são respectivamente:",
    alternativas: { A: "0,65% e 3,00%", B: "1,65% e 7,60%", C: "1,00% e 4,00%", D: "1,65% e 3,00%" },
    resposta: "B",
    explicacao: "Regime não cumulativo (Leis 10.637/02 e 10.833/03): PIS = 1,65% e COFINS = 7,60%, com direito a créditos sobre insumos. Regime cumulativo: PIS = 0,65% e COFINS = 3%, sem creditamento.",
  },
  {
    id: 50, area: "Contabilidade Tributária", edicao: "2024/1", dificuldade: "facil",
    enunciado: "O SPED (Sistema Público de Escrituração Digital) tem como objetivo principal:",
    alternativas: {
      A: "Calcular automaticamente todos os tributos devidos pelas empresas",
      B: "Substituir os livros fiscais e contábeis em papel pela escrituração digital, integrando a administração tributária",
      C: "Gerar relatórios financeiros padronizados para os investidores do mercado de capitais",
      D: "Controlar as importações e exportações de bens e serviços",
    },
    resposta: "B",
    explicacao: "O SPED (Decreto 6.022/2007) moderniza a sistemática de cumprimento de obrigações acessórias, transmitindo os livros e documentos fiscais/contábeis em formato digital padronizado à administração tributária.",
  },
  {
    id: 51, area: "Contabilidade Tributária", edicao: "2022/2", dificuldade: "dificil",
    enunciado: "No regime de Lucro Real, os Prejuízos Fiscais acumulados podem ser compensados com lucros futuros com a limitação de:",
    alternativas: {
      A: "Sem limitação — todo o prejuízo pode ser compensado no exercício seguinte",
      B: "Limitado a 30% do lucro real de cada período, sem prazo de expiração",
      C: "Limitado a 50% do lucro real de cada período, com prazo de 5 anos",
      D: "Limitado a 30% do lucro real de cada período, com prazo de 10 anos",
    },
    resposta: "B",
    explicacao: "Compensação de prejuízo fiscal: limitada a 30% do lucro real do período (art. 15, Lei 9.065/95), sem prazo de prescrição — pode ser carregado indefinidamente para frente (carry forward sem expiração).",
  },

  // ── LEGISLAÇÃO E ÉTICA (7 questões) ─────────────────────────────────────
  {
    id: 52, area: "Legislação e Ética", edicao: "2023/1", dificuldade: "facil",
    enunciado: "O Conselho Federal de Contabilidade (CFC) foi criado pelo:",
    alternativas: {
      A: "Decreto-Lei 9.295, de 27 de maio de 1946",
      B: "Lei 6.404, de 15 de dezembro de 1976",
      C: "Lei 12.249, de 11 de junho de 2010",
      D: "Resolução CFC nº 1.307, de 9 de dezembro de 2010",
    },
    resposta: "A",
    explicacao: "O CFC foi criado pelo Decreto-Lei 9.295/1946, que também criou os Conselhos Regionais de Contabilidade (CRCs) e definiu as atribuições e prerrogativas dos profissionais de contabilidade.",
  },
  {
    id: 53, area: "Legislação e Ética", edicao: "2024/2", dificuldade: "media",
    enunciado: "Segundo o Decreto-Lei 9.295/46, é VEDADO ao Técnico em Contabilidade (de nível médio):",
    alternativas: {
      A: "Escriturar os livros de contabilidade obrigatórios",
      B: "Elaborar e assinar balanços gerais de qualquer empresa independentemente do porte",
      C: "Realizar a escrituração de livros fiscais",
      D: "Elaborar e assinar balancetes de verificação",
    },
    resposta: "B",
    explicacao: "O bacharel em Ciências Contábeis tem prerrogativas exclusivas para assinar balanços gerais de empresas de qualquer porte (além de perícias contábeis). O técnico pode escriturar livros e assinar balanços de pequenas empresas, com as restrições definidas em lei.",
  },
  {
    id: 54, area: "Legislação e Ética", edicao: "2022/1", dificuldade: "media",
    enunciado: "Quanto ao SIGILO PROFISSIONAL do contador, o Código de Ética Profissional (CEPC/NBC PG 100) estabelece que:",
    alternativas: {
      A: "O sigilo deve ser mantido apenas durante a vigência do contrato de prestação de serviços",
      B: "O sigilo é relativo e pode ser quebrado por interesse público ou do cliente",
      C: "O sigilo deve ser mantido mesmo após o término da relação profissional, salvo por determinação legal",
      D: "O sigilo é dispensado quando as informações forem solicitadas por outro contador",
    },
    resposta: "C",
    explicacao: "O sigilo profissional (NBC PG 100.2) é permanente — persiste mesmo após o encerramento da relação profissional. Pode ser excepcionado por determinação judicial, legal ou quando o próprio cliente autoriza expressamente a divulgação.",
  },
  {
    id: 55, area: "Legislação e Ética", edicao: "2023/2", dificuldade: "facil",
    enunciado: "O Exame de Suficiência do CFC, reinstituído pela Lei 12.249/2010, é:",
    alternativas: {
      A: "Optativo para bacharéis com mais de 3 anos de formação",
      B: "Requisito obrigatório para obtenção do registro profissional no CRC",
      C: "Válido por apenas 2 anos contados da data de aprovação",
      D: "Aplicado exclusivamente para técnicos em contabilidade",
    },
    resposta: "B",
    explicacao: "O Exame de Suficiência é condição obrigatória para registro no CRC. É realizado pelo CFC duas vezes por ano. A aprovação no exame, junto com o diploma, é requisito para o exercício legal da profissão.",
  },
  {
    id: 56, area: "Legislação e Ética", edicao: "2024/1", dificuldade: "media",
    enunciado: "A responsabilidade civil do profissional contábil consiste em:",
    alternativas: {
      A: "Responder criminalmente por qualquer erro cometido no exercício da profissão",
      B: "Ser punido pelo CRC com cassação do registro em qualquer infração ética",
      C: "Reparar o dano patrimonial causado ao cliente por negligência, imprudência ou imperícia",
      D: "Apresentar-se como testemunha em processos sempre que convocado pelo juízo",
    },
    resposta: "C",
    explicacao: "Responsabilidade civil: obrigação de reparar o dano causado por ato ilícito (art. 186/927 CC). Para o contador, decorre de culpa (negligência, imprudência, imperícia) ou dolo na prestação de serviços, gerando obrigação de indenizar.",
  },
  {
    id: 57, area: "Legislação e Ética", edicao: "2022/2", dificuldade: "media",
    enunciado: "Segundo a NBC PG 100 (Código de Ética para Profissionais de Contabilidade), os princípios éticos fundamentais são:",
    alternativas: {
      A: "Sigilo, lealdade ao cliente, responsabilidade e pontualidade",
      B: "Integridade, objetividade, competência, confidencialidade e comportamento profissional",
      C: "Independência, competência técnica, objetividade e imparcialidade",
      D: "Fidelidade, responsabilidade, sigilo e imparcialidade",
    },
    resposta: "B",
    explicacao: "A NBC PG 100 (equivalente ao IESBA Code) estabelece cinco princípios: Integridade, Objetividade, Competência e Zelo Profissional, Confidencialidade e Comportamento Profissional. São de observância obrigatória por todos os profissionais da contabilidade.",
  },
  {
    id: 58, area: "Legislação e Ética", edicao: "2024/2", dificuldade: "dificil",
    enunciado: "A AMEAÇA DE INTERESSE PRÓPRIO, conforme a NBC PG 100, ocorre quando:",
    alternativas: {
      A: "O profissional defende uma posição a ponto de comprometer sua objetividade futura",
      B: "Um interesse financeiro ou outro interesse pode influenciar inadequadamente o julgamento do profissional",
      C: "O profissional adota a perspectiva ou julgamento de outra pessoa em detrimento da objetividade",
      D: "Um familiar do profissional atua na entidade cliente em posição relevante",
    },
    resposta: "B",
    explicacao: "Ameaça de interesse próprio: surge quando o profissional (ou familiar próximo) tem interesse financeiro ou pessoal que pode influenciar seu julgamento. Ex.: honorários contingentes excessivos, empréstimos ao cliente. Compromete objetividade e independência.",
  },

  // ── CONTABILIDADE PÚBLICA (7 questões) ──────────────────────────────────
  {
    id: 59, area: "Contabilidade Pública", edicao: "2023/1", dificuldade: "media",
    enunciado: "Os estágios da RECEITA PÚBLICA, na ordem correta, são:",
    alternativas: {
      A: "Lançamento → Previsão → Arrecadação → Recolhimento",
      B: "Previsão → Lançamento → Arrecadação → Recolhimento",
      C: "Arrecadação → Lançamento → Previsão → Recolhimento",
      D: "Previsão → Arrecadação → Lançamento → Recolhimento",
    },
    resposta: "B",
    explicacao: "Estágios da receita pública: 1º Previsão (LOA), 2º Lançamento (individualização do crédito), 3º Arrecadação (pagamento pelo contribuinte ao agente arrecadador) e 4º Recolhimento (entrega ao Tesouro).",
  },
  {
    id: 60, area: "Contabilidade Pública", edicao: "2024/1", dificuldade: "media",
    enunciado: "Os estágios da DESPESA PÚBLICA, na ordem correta, são:",
    alternativas: {
      A: "Empenho → Fixação → Liquidação → Pagamento",
      B: "Fixação → Empenho → Liquidação → Pagamento",
      C: "Licitação → Empenho → Liquidação → Pagamento",
      D: "Fixação → Liquidação → Empenho → Pagamento",
    },
    resposta: "B",
    explicacao: "Estágios da despesa pública (Lei 4.320/64): 1º Fixação (LOA/créditos adicionais), 2º Empenho (reserva de dotação), 3º Liquidação (verificação do direito do credor) e 4º Pagamento (extinção da obrigação).",
  },
  {
    id: 61, area: "Contabilidade Pública", edicao: "2022/2", dificuldade: "media",
    enunciado: "O regime contábil adotado no setor público brasileiro para despesas e receitas é, respectivamente:",
    alternativas: {
      A: "Caixa para despesas e competência para receitas",
      B: "Competência integral para despesas e receitas",
      C: "Competência para despesas e caixa para receitas",
      D: "Caixa integral para despesas e receitas",
    },
    resposta: "C",
    explicacao: "Regime misto (Lei 4.320/64): despesas → regime de competência (empenho); receitas → regime de caixa (arrecadação). O MCASP avança para competência integral conforme as IPSAS, mas o regime misto ainda prevalece na escrituração orçamentária.",
  },
  {
    id: 62, area: "Contabilidade Pública", edicao: "2023/2", dificuldade: "media",
    enunciado: "Os RESTOS A PAGAR PROCESSADOS são as despesas:",
    alternativas: {
      A: "Empenhadas, mas cuja liquidação ainda não ocorreu até 31 de dezembro",
      B: "Empenhadas e liquidadas, mas ainda não pagas até 31 de dezembro",
      C: "Previstas na LOA mas cujo empenho ainda não foi emitido",
      D: "Canceladas após o encerramento do exercício financeiro",
    },
    resposta: "B",
    explicacao: "Restos a pagar processados: empenho emitido + liquidação realizada + pagamento pendente. Não processados: empenho emitido, mas liquidação ainda não ocorreu. A diferença está na realização (entrega do bem/serviço verificada).",
  },
  {
    id: 63, area: "Contabilidade Pública", edicao: "2024/2", dificuldade: "facil",
    enunciado: "O MCASP (Manual de Contabilidade Aplicada ao Setor Público) tem como finalidade:",
    alternativas: {
      A: "Estabelecer normas tributárias específicas para os entes públicos",
      B: "Padronizar os procedimentos e práticas contábeis aplicados à União, Estados, DF e Municípios",
      C: "Regulamentar exclusivamente a contabilidade da União Federal",
      D: "Definir as metas fiscais e limites de endividamento do setor público",
    },
    resposta: "B",
    explicacao: "O MCASP é editado pela STN/SOF e tem por finalidade uniformizar os procedimentos contábeis patrimoniais, orçamentários e financeiros em todos os entes da Federação, em consonância com as IPSAS (normas internacionais para setor público).",
  },
  {
    id: 64, area: "Contabilidade Pública", edicao: "2022/1", dificuldade: "media",
    enunciado: "O resultado PRIMÁRIO do governo é calculado como:",
    alternativas: {
      A: "Receitas totais − Despesas totais, incluindo os juros da dívida",
      B: "Receitas totais − Despesas totais, excluindo os juros líquidos da dívida pública",
      C: "Receita corrente líquida − Despesas de custeio e investimentos",
      D: "Superávit financeiro + Reserva de contingência do exercício",
    },
    resposta: "B",
    explicacao: "Resultado Primário = Receitas Primárias − Despesas Primárias (excluindo juros). É o principal indicador de esforço fiscal do governo. Resultado Nominal inclui os juros e corrige o resultado primário pelo efeito da dívida.",
  },
  {
    id: 65, area: "Contabilidade Pública", edicao: "2024/1", dificuldade: "dificil",
    enunciado: "A DISPONIBILIDADE DE CAIXA bruta, para fins da Lei de Responsabilidade Fiscal (LRF), refere-se a:",
    alternativas: {
      A: "O saldo previsto de arrecadação de receitas para o exercício seguinte",
      B: "O valor total dos créditos orçamentários aprovados na Lei Orçamentária Anual",
      C: "Os recursos financeiros em caixa e equivalentes de caixa disponíveis no Tesouro",
      D: "O superávit financeiro apurado no exercício anterior, disponível para abertura de créditos",
    },
    resposta: "C",
    explicacao: "Disponibilidade de caixa (art. 42, LRF): recursos de caixa e equivalentes livres de qualquer vinculação. A LRF veda ao gestor, nos 2 últimos quadrimestres do mandato, contrair obrigações sem disponibilidade de caixa suficiente para cobertura.",
  },
];

// Distribuição proporcional para simulado completo (50 questões)
export const DISTRIBUICAO_COMPLETO = {
  "Contabilidade Geral":       14,
  "Contabilidade de Custos":    6,
  "Análise das Demonstrações":  6,
  "Auditoria e Perícia":        7,
  "Contabilidade Tributária":   8,
  "Legislação e Ética":         5,
  "Contabilidade Pública":      4,
};

export const DISTRIBUICAO_RAPIDO = {
  "Contabilidade Geral":        7,
  "Contabilidade de Custos":    3,
  "Análise das Demonstrações":  3,
  "Auditoria e Perícia":        4,
  "Contabilidade Tributária":   4,
  "Legislação e Ética":         2,
  "Contabilidade Pública":      2,
};

// Embaralha array (Fisher-Yates)
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Seleciona questões conforme distribuição
export function selecionarQuestoes(distribuicao) {
  const resultado = [];
  for (const [area, qtd] of Object.entries(distribuicao)) {
    const disponiveis = shuffle(QUESTOES.filter((q) => q.area === area));
    resultado.push(...disponiveis.slice(0, qtd));
  }
  return shuffle(resultado);
}
