import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import CardBloqueado from "../components/CardBloqueado";

// ── Base de dados ─────────────────────────────────────────────────────────────

const ESTADOS = [
  { uf: "AC", nome: "Acre" },           { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },          { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },          { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },{ uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },          { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },    { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },   { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },        { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },     { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" }, { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },{ uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },        { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },      { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

// Multiplicador regional baseado em custo de vida e mercado contábil local
const MULT_ESTADO = {
  SP: 1.32, RJ: 1.22, DF: 1.20, SC: 1.14, RS: 1.12,
  PR: 1.10, MG: 1.06, ES: 1.03, GO: 1.00, MT: 0.97,
  MS: 0.97, RO: 0.95, TO: 0.93, AM: 0.95, PA: 0.93,
  MA: 0.90, PI: 0.88, CE: 0.93, RN: 0.90, PB: 0.88,
  PE: 0.96, AL: 0.88, SE: 0.90, BA: 0.96, AC: 0.90,
  RR: 0.88, AP: 0.88,
};

// Multiplicador por atividade
const MULT_ATIVIDADE = {
  "Comércio":  1.00,
  "Serviços":  1.05,
  "Indústria": 1.18,
  "Misto":     1.12,
};

// Honorário base [mínimo, mercado, premium] por regime e faixa de faturamento
function getBaseHonorario(regime, faturamentoMensal) {
  if (regime === "MEI") return [120, 200, 320];

  if (regime === "Simples Nacional") {
    if (faturamentoMensal <= 10000)  return [350, 560, 850];
    if (faturamentoMensal <= 25000)  return [560, 880, 1350];
    if (faturamentoMensal <= 50000)  return [780, 1200, 1850];
    if (faturamentoMensal <= 100000) return [1050, 1650, 2600];
    if (faturamentoMensal <= 150000) return [1450, 2200, 3400];
    return [2000, 3100, 4800];
  }

  if (regime === "Lucro Presumido") {
    if (faturamentoMensal <= 50000)  return [1200, 1900, 3000];
    if (faturamentoMensal <= 150000) return [1800, 2800, 4400];
    if (faturamentoMensal <= 500000) return [2800, 4400, 7000];
    return [4500, 7000, 11000];
  }

  if (regime === "Lucro Real") {
    if (faturamentoMensal <= 200000) return [3500, 5500, 9000];
    if (faturamentoMensal <= 500000) return [5500, 8500, 14000];
    return [8000, 13000, 22000];
  }

  return [500, 800, 1300];
}

// Definição dos serviços adicionais [min, mercado, premium]
const SERVICOS_CONFIG = {
  folha: {
    label: "Folha de Pagamento",
    descricao: "Cálculo mensal, holerites e encargos",
    icon: "👥",
    grupo: "Departamento Pessoal",
    base: [120, 200, 320],
    porFuncionario: [40, 65, 100],
    temFuncionarios: true,
  },
  depto_pessoal: {
    label: "Depto. Pessoal Completo",
    descricao: "Admissão, demissão, férias, 13º, eSocial",
    icon: "🏢",
    grupo: "Departamento Pessoal",
    base: [220, 380, 620],
    porFuncionario: [55, 85, 130],
    temFuncionarios: true,
  },
  sped_fiscal: {
    label: "EFD / SPED Fiscal",
    descricao: "Escrituração Fiscal Digital mensal",
    icon: "📂",
    grupo: "Obrigações Acessórias",
    base: [220, 370, 600],
  },
  ecd_ecf: {
    label: "ECD + ECF",
    descricao: "Escrituração Contábil Digital e Fiscal (anual ÷ 12)",
    icon: "📊",
    grupo: "Obrigações Acessórias",
    base: [160, 270, 450],
  },
  nfe: {
    label: "Emissão / Conferência de NF-e",
    descricao: "Verificação e escrituração das notas fiscais",
    icon: "🧾",
    grupo: "Obrigações Acessórias",
    base: [180, 300, 480],
  },
  irpf_socios: {
    label: "DIRPF dos Sócios",
    descricao: "Declaração do IR Pessoa Física (anual ÷ 12)",
    icon: "📝",
    grupo: "Impostos",
    base: [0, 0, 0],
    porSocio: [40, 65, 100],
    temSocios: true,
  },
  planejamento: {
    label: "Planejamento Tributário",
    descricao: "Estudo de regimes e redução legal de tributos",
    icon: "📈",
    grupo: "Consultoria",
    base: [320, 580, 1050],
  },
  consultoria: {
    label: "Consultoria Fiscal Mensal",
    descricao: "Atendimento contínuo para dúvidas e análises",
    icon: "💡",
    grupo: "Consultoria",
    base: [380, 680, 1250],
  },
  bpo: {
    label: "BPO Financeiro",
    descricao: "Contas a pagar/receber, fluxo de caixa e conciliação",
    icon: "💳",
    grupo: "BPO",
    base: [580, 980, 1750],
  },
  certidoes: {
    label: "Certidões Negativas",
    descricao: "Emissão de CND Federal, Estadual e Municipal",
    icon: "🔏",
    grupo: "Serviços Avulsos",
    base: [85, 140, 220],
  },
  abertura: {
    label: "Abertura / Constituição",
    descricao: "Registro completo da empresa (taxa única)",
    icon: "🏗️",
    grupo: "Serviços Avulsos",
    base: [850, 1500, 2600],
    unico: true,
  },
  encerramento: {
    label: "Encerramento de Empresa",
    descricao: "Distrato, baixa CNPJ e obrigações finais",

    grupo: "Serviços Avulsos",
    base: [750, 1300, 2200],
    unico: true,
  },
};

// Agrupa serviços por categoria
const GRUPOS_SERVICOS = [...new Set(Object.values(SERVICOS_CONFIG).map((s) => s.grupo))];

// ── Configuração Declarações & Serviços PF ────────────────────────────────────

const DECL_CONFIG = {
  // IRPF
  irpf_simples: {
    label: "DIRPF Simples",
    descricao: "Assalariado, sem ativos complexos",
    icon: "📄",
    grupo: "IRPF — Imposto de Renda PF",
    base: [180, 320, 520],
    unico: true,
  },
  irpf_padrao: {
    label: "DIRPF Padrão",
    descricao: "Aluguéis, financiamento, carnê-leão",
    icon: "📋",
    grupo: "IRPF — Imposto de Renda PF",
    base: [280, 500, 820],
    unico: true,
  },
  irpf_completa: {
    label: "DIRPF Completa",
    descricao: "Investimentos, renda variável, imóveis múltiplos, exterior",
    icon: "📊",
    grupo: "IRPF — Imposto de Renda PF",
    base: [480, 880, 1450],
    unico: true,
  },
  irpf_rural: {
    label: "DIRPF + Atividade Rural / ITR",
    descricao: "Inclui escrituração rural e ITR",
    icon: "🌾",
    grupo: "IRPF — Imposto de Renda PF",
    base: [620, 1100, 1800],
    unico: true,
  },
  irpf_espolio: {
    label: "DIRPF Espólio",
    descricao: "Declaração de espólio até encerramento",
    icon: "⚖️",
    grupo: "IRPF — Imposto de Renda PF",
    base: [820, 1450, 2400],
    unico: true,
  },
  irpf_retificacao: {
    label: "Retificação de DIRPF",
    descricao: "Correção de declaração já entregue",
    icon: "✏️",
    grupo: "IRPF — Imposto de Renda PF",
    base: [200, 380, 640],
    unico: true,
  },
  irpf_atrasada: {
    label: "DIRPF em Atraso (por ano)",
    descricao: "Declarações de anos anteriores + multa e cálculo de encargos",
    icon: "⏰",
    grupo: "IRPF — Imposto de Renda PF",
    base: [380, 680, 1100],
    unico: true,
    porAno: true,
  },
  // Impostos & Declarações Especiais
  itr: {
    label: "ITR — Imposto Territorial Rural",
    descricao: "Declaração anual do imóvel rural",
    icon: "🌿",
    grupo: "Impostos & Declarações Especiais",
    base: [350, 620, 1050],
    unico: true,
  },
  itcmd: {
    label: "ITCMD / Inventário",
    descricao: "Imposto sobre herança e doação — auxiliar na apuração",
    icon: "🏛️",
    grupo: "Impostos & Declarações Especiais",
    base: [1400, 2600, 4800],
    unico: true,
  },
  itbi: {
    label: "ITBI — Transmissão de Imóvel",
    descricao: "Cálculo e orientação no recolhimento",
    icon: "🏠",
    grupo: "Impostos & Declarações Especiais",
    base: [320, 580, 980],
    unico: true,
  },
  gcap: {
    label: "Ganho de Capital",
    descricao: "Cálculo e recolhimento de GCAP sobre venda de bens",
    icon: "📈",
    grupo: "Impostos & Declarações Especiais",
    base: [280, 500, 850],
    unico: true,
  },
  dirf_pf: {
    label: "DIRF — PF / Empregador Doméstico",
    descricao: "Declaração de retenção na fonte",
    icon: "🧾",
    grupo: "Impostos & Declarações Especiais",
    base: [180, 320, 520],
    unico: true,
  },
  // Serviços MEI & Regularizações
  dasn_simei: {
    label: "DASN-SIMEI (MEI anual)",
    descricao: "Declaração anual de faturamento do MEI",
    icon: "🏪",
    grupo: "Serviços MEI & Regularizações",
    base: [90, 160, 280],
    unico: true,
  },
  abertura_mei: {
    label: "Abertura de MEI",
    descricao: "Registro, CNPJ e orientações iniciais",
    icon: "🚀",
    grupo: "Serviços MEI & Regularizações",
    base: [120, 220, 380],
    unico: true,
  },
  regularizacao_cpf: {
    label: "Regularização de CPF",
    descricao: "Pendências na Receita Federal, malha fina",
    icon: "🔑",
    grupo: "Serviços MEI & Regularizações",
    base: [150, 280, 480],
    unico: true,
  },
  parcelamento: {
    label: "Parcelamento / PERT / Transação",
    descricao: "Negociação e adesão a programas de regularização",
    icon: "🤝",
    grupo: "Serviços MEI & Regularizações",
    base: [380, 680, 1150],
    unico: true,
  },
  recurso_rf: {
    label: "Recurso / Impugnação RF",
    descricao: "Defesa administrativa em autuações da Receita",
    icon: "⚔️",
    grupo: "Serviços MEI & Regularizações",
    base: [520, 950, 1650],
    unico: true,
  },
};

const GRUPOS_DECL = [...new Set(Object.values(DECL_CONFIG).map((s) => s.grupo))];

// ── Motor de cálculo — Empresarial ────────────────────────────────────────────

function calcular(dados) {
  const { regime, faturamento, estado, atividade, servicos, numFuncionarios, numSocios } = dados;
  const fat = parseFloat(faturamento.replace(/\D/g, "")) / 100 || 0;
  const multEstado = MULT_ESTADO[estado] || 1.0;
  const multAtiv = MULT_ATIVIDADE[atividade] || 1.0;

  const [bMin, bMed, bPrem] = getBaseHonorario(regime, fat);
  const base = {
    min:  Math.round(bMin  * multEstado * multAtiv),
    med:  Math.round(bMed  * multEstado * multAtiv),
    prem: Math.round(bPrem * multEstado * multAtiv),
    label: "Escrituração Contábil + Fiscal",
  };

  const linhas = [base];
  let totalMin = base.min, totalMed = base.med, totalPrem = base.prem;

  servicos.forEach((id) => {
    const cfg = SERVICOS_CONFIG[id];
    if (!cfg) return;

    let min = cfg.base[0], med = cfg.base[1], prem = cfg.base[2];

    if (cfg.temFuncionarios) {
      const nFunc = parseInt(numFuncionarios) || 0;
      min  += cfg.porFuncionario[0] * nFunc;
      med  += cfg.porFuncionario[1] * nFunc;
      prem += cfg.porFuncionario[2] * nFunc;
    }

    if (cfg.temSocios) {
      const nSoc = parseInt(numSocios) || 1;
      min  += cfg.porSocio[0] * nSoc;
      med  += cfg.porSocio[1] * nSoc;
      prem += cfg.porSocio[2] * nSoc;
    }

    min  = Math.round(min  * multEstado);
    med  = Math.round(med  * multEstado);
    prem = Math.round(prem * multEstado);

    linhas.push({ min, med, prem, label: cfg.label, unico: cfg.unico });

    if (!cfg.unico) {
      totalMin  += min;
      totalMed  += med;
      totalPrem += prem;
    }
  });

  return { linhas, totalMin, totalMed, totalPrem };
}

// ── Motor de cálculo — Declarações PF ────────────────────────────────────────

function calcularDeclaracoes({ estado, servicos, numContrib, numAnosAtrasados }) {
  const mult = MULT_ESTADO[estado] || 1.0;
  const nContrib = Math.max(1, parseInt(numContrib) || 1);
  const nAnos = Math.max(1, parseInt(numAnosAtrasados) || 1);
  const linhas = [];
  let totalMin = 0, totalMed = 0, totalPrem = 0;
  servicos.forEach((id) => {
    const cfg = DECL_CONFIG[id];
    if (!cfg) return;
    let [min, med, prem] = cfg.base;
    const mc = id.startsWith("irpf_") ? nContrib : 1;
    const ma = id === "irpf_atrasada" ? nAnos : 1;
    min  = Math.round(min  * mult * mc * ma);
    med  = Math.round(med  * mult * mc * ma);
    prem = Math.round(prem * mult * mc * ma);
    linhas.push({ label: cfg.label, min, med, prem, icon: cfg.icon });
    totalMin += min; totalMed += med; totalPrem += prem;
  });
  return { linhas, totalMin, totalMed, totalPrem };
}

// ── Utilitários ───────────────────────────────────────────────────────────────

const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function moedaMask(v) {
  const digits = v.replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  const num = parseInt(digits, 10);
  return (num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── PDF — Empresarial ─────────────────────────────────────────────────────────

function gerarPDF(dados, resultado, user) {
  const { regime, estado, atividade, faturamento, servicos, numFuncionarios, numSocios } = dados;
  const nomeEstado = ESTADOS.find((e) => e.uf === estado)?.nome || estado;
  const data = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const linhasHTML = resultado.linhas.map((l) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:14px;">${l.label}${l.unico ? " <em style='color:#999;font-size:12px'>(taxa única)</em>" : ""}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;color:#555;">${fmt(l.min)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#B27F1A;">${fmt(l.med)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;color:#555;">${fmt(l.prem)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
  <title>Proposta de Honorários — GJ Hub Contábil</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#222;background:#fff;padding:40px 48px}
  @media print{body{padding:20px 24px}.no-print{display:none}}</style></head>
  <body>
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #DF9F20;padding-bottom:20px;margin-bottom:32px;">
      <div>
        <div style="font-size:22px;font-weight:800;color:#DF9F20;">GJ Treinamentos Contábeis</div>
        <div style="font-size:13px;color:#888;margin-top:3px;">GJ Hub Contábil — Precificação Contábil</div>
      </div>
      <div style="text-align:right;font-size:13px;color:#888;">
        <div>Emitido em</div><div style="font-weight:700;color:#222;">${data}</div>
        <div style="margin-top:4px;font-size:11px;color:#aaa;">Válido por 30 dias</div>
      </div>
    </div>

    <h2 style="font-size:20px;font-weight:800;margin-bottom:20px;color:#00031F;">Proposta de Honorários Contábeis</h2>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:32px;">
      ${[["Regime Tributário", regime], ["Estado", nomeEstado], ["Atividade", atividade],
         ["Faturamento Estimado", `R$ ${faturamento}/mês`],
         ...(servicos.includes("folha")||servicos.includes("depto_pessoal") ? [["Nº de Funcionários", numFuncionarios]] : []),
         ...(servicos.includes("irpf_socios") ? [["Nº de Sócios", numSocios]] : []),
      ].map(([k,v]) => `<div style="background:#f8f8f8;border-radius:8px;padding:12px 16px;">
        <div style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">${k}</div>
        <div style="font-weight:700;font-size:15px;">${v}</div></div>`).join("")}
    </div>

    <h3 style="font-size:16px;margin-bottom:12px;color:#00031F;">Composição dos Honorários</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr style="background:#00031F;color:#fff;">
        <th style="padding:10px 14px;text-align:left;font-size:13px;">Serviço</th>
        <th style="padding:10px 14px;text-align:right;font-size:13px;">Mínimo (CRC)</th>
        <th style="padding:10px 14px;text-align:right;font-size:13px;">Mercado</th>
        <th style="padding:10px 14px;text-align:right;font-size:13px;">Premium</th>
      </tr></thead>
      <tbody>${linhasHTML}</tbody>
      <tfoot><tr style="background:#DF9F2015;font-weight:800;">
        <td style="padding:12px 14px;font-size:15px;">TOTAL MENSAL</td>
        <td style="padding:12px 14px;text-align:right;font-size:15px;">${fmt(resultado.totalMin)}</td>
        <td style="padding:12px 14px;text-align:right;font-size:15px;color:#B27F1A;">${fmt(resultado.totalMed)}</td>
        <td style="padding:12px 14px;text-align:right;font-size:15px;">${fmt(resultado.totalPrem)}</td>
      </tr></tfoot>
    </table>

    <div style="background:#fff8e6;border:1px solid #DF9F2044;border-radius:8px;padding:16px;font-size:13px;color:#555;margin-bottom:24px;">
      <strong style="color:#B27F1A;">⚠ Observações importantes:</strong><br/>
      • Os valores acima são baseados nas tabelas de referência do CFC e CRCs estaduais, ajustados ao mercado de ${nomeEstado}.<br/>
      • O honorário final pode variar conforme a complexidade operacional do cliente, volume de notas fiscais e movimentações bancárias.<br/>
      • Valores de serviços únicos (abertura/encerramento) não estão incluídos no total mensal.<br/>
      • Simulação gerada pelo GJ Hub Contábil em ${data}.
    </div>

    <button class="no-print" onclick="window.print()" style="background:#DF9F20;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">
      🖨️ Imprimir / Salvar PDF
    </button>
  </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

// ── PDF — Declarações PF ──────────────────────────────────────────────────────

function gerarPDFDeclaracoes(dadosDecl, resultado) {
  const { estado, servicos, numContrib, numAnosAtrasados } = dadosDecl;
  const nomeEstado = ESTADOS.find((e) => e.uf === estado)?.nome || estado;
  const data = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const temIrpf = servicos.some((id) => id.startsWith("irpf_"));

  const linhasHTML = resultado.linhas.map((l) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:14px;">${l.icon ? l.icon + " " : ""}${l.label}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;color:#555;">${fmt(l.min)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#B27F1A;">${fmt(l.med)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;color:#555;">${fmt(l.prem)}</td>
    </tr>`).join("");

  const infoCards = [
    ["Estado", nomeEstado],
    ["Serviços selecionados", servicos.length.toString()],
    ...(temIrpf ? [["Nº de Contribuintes", numContrib]] : []),
    ...(servicos.includes("irpf_atrasada") ? [["Anos em Atraso", numAnosAtrasados]] : []),
  ];

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
  <title>Proposta de Honorários — Declarações & Serviços PF</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#222;background:#fff;padding:40px 48px}
  @media print{body{padding:20px 24px}.no-print{display:none}}</style></head>
  <body>
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #DF9F20;padding-bottom:20px;margin-bottom:32px;">
      <div>
        <div style="font-size:22px;font-weight:800;color:#DF9F20;">GJ Treinamentos Contábeis</div>
        <div style="font-size:13px;color:#888;margin-top:3px;">GJ Hub Contábil — Precificação Contábil</div>
      </div>
      <div style="text-align:right;font-size:13px;color:#888;">
        <div>Emitido em</div><div style="font-weight:700;color:#222;">${data}</div>
        <div style="margin-top:4px;font-size:11px;color:#aaa;">Válido por 30 dias</div>
      </div>
    </div>

    <h2 style="font-size:20px;font-weight:800;margin-bottom:20px;color:#00031F;">Proposta de Honorários — Declarações &amp; Serviços PF</h2>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:32px;">
      ${infoCards.map(([k, v]) => `<div style="background:#f8f8f8;border-radius:8px;padding:12px 16px;">
        <div style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">${k}</div>
        <div style="font-weight:700;font-size:15px;">${v}</div></div>`).join("")}
    </div>

    <h3 style="font-size:16px;margin-bottom:12px;color:#00031F;">Serviços e Honorários</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr style="background:#00031F;color:#fff;">
        <th style="padding:10px 14px;text-align:left;font-size:13px;">Serviço</th>
        <th style="padding:10px 14px;text-align:right;font-size:13px;">Mínimo (CRC)</th>
        <th style="padding:10px 14px;text-align:right;font-size:13px;">Mercado</th>
        <th style="padding:10px 14px;text-align:right;font-size:13px;">Premium</th>
      </tr></thead>
      <tbody>${linhasHTML}</tbody>
      <tfoot><tr style="background:#DF9F2015;font-weight:800;">
        <td style="padding:12px 14px;font-size:15px;">TOTAL ESTIMADO</td>
        <td style="padding:12px 14px;text-align:right;font-size:15px;">${fmt(resultado.totalMin)}</td>
        <td style="padding:12px 14px;text-align:right;font-size:15px;color:#B27F1A;">${fmt(resultado.totalMed)}</td>
        <td style="padding:12px 14px;text-align:right;font-size:15px;">${fmt(resultado.totalPrem)}</td>
      </tr></tfoot>
    </table>

    <div style="background:#fff8e6;border:1px solid #DF9F2044;border-radius:8px;padding:16px;font-size:13px;color:#555;margin-bottom:24px;">
      <strong style="color:#B27F1A;">⚠ Observações importantes:</strong><br/>
      • Honorários de serviços únicos. Não incluem taxas governamentais, emolumentos cartoriais ou despesas de terceiros.<br/>
      • Os valores são baseados nas tabelas de referência do CFC e CRCs estaduais, ajustados ao mercado de ${nomeEstado}.<br/>
      • Simulação gerada pelo GJ Hub Contábil em ${data}.
    </div>

    <button class="no-print" onclick="window.print()" style="background:#DF9F20;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">
      🖨️ Imprimir / Salvar PDF
    </button>
  </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

// ── Componente principal ──────────────────────────────────────────────────────

const STEPS = ["Dados da Empresa", "Serviços", "Resultado"];

export default function HonorariosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [step, setStep] = useState(1);

  // Modo principal: "empresarial" | "declaracoes"
  const [modoPrincipal, setModoPrincipal] = useState("empresarial");

  const [dados, setDados] = useState({
    estado: "SP",
    regime: "Simples Nacional",
    atividade: "Serviços",
    faturamento: "",
    servicos: [],
    numFuncionarios: "5",
    numSocios: "2",
  });

  // Estado para o fluxo de Declarações PF
  const [stepDecl, setStepDecl] = useState(1);
  const [dadosDecl, setDadosDecl] = useState({
    estado: "SP",
    servicos: [],
    numContrib: "1",
    numAnosAtrasados: "1",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
    // Pre-fill from CNPJ page if applicable
    const { uf, regime: r, porte } = router.query;
    if (uf) setDados((d) => ({ ...d, estado: uf }));
    if (r)  setDados((d) => ({ ...d, regime: r }));
  }, [router]);

  const resultado = useMemo(() => {
    if (!dados.faturamento) return null;
    return calcular(dados);
  }, [dados]);

  const resultadoDecl = useMemo(() => {
    if (dadosDecl.servicos.length === 0) return null;
    return calcularDeclaracoes(dadosDecl);
  }, [dadosDecl]);

  // Comparativo por estado para o modo declarações
  const comparativoEstados = useMemo(() => {
    if (!resultadoDecl || dadosDecl.servicos.length === 0) return [];
    const nContrib = Math.max(1, parseInt(dadosDecl.numContrib) || 1);
    const nAnos = Math.max(1, parseInt(dadosDecl.numAnosAtrasados) || 1);
    return ESTADOS.map((e) => {
      const m = MULT_ESTADO[e.uf] || 1.0;
      let total = 0;
      dadosDecl.servicos.forEach((id) => {
        const cfg = DECL_CONFIG[id];
        if (!cfg) return;
        const mc = id.startsWith("irpf_") ? nContrib : 1;
        const ma = id === "irpf_atrasada" ? nAnos : 1;
        total += Math.round(cfg.base[1] * m * mc * ma);
      });
      return { uf: e.uf, nome: e.nome, total };
    }).sort((a, b) => b.total - a.total);
  }, [resultadoDecl, dadosDecl]);

  const set = (k, v) => setDados((d) => ({ ...d, [k]: v }));
  const setDecl = (k, v) => setDadosDecl((d) => ({ ...d, [k]: v }));

  const toggleServico = (id) => {
    setDados((d) => ({
      ...d,
      servicos: d.servicos.includes(id)
        ? d.servicos.filter((s) => s !== id)
        : [...d.servicos, id],
    }));
  };

  const toggleServicoDecl = (id) => {
    setDadosDecl((d) => ({
      ...d,
      servicos: d.servicos.includes(id)
        ? d.servicos.filter((s) => s !== id)
        : [...d.servicos, id],
    }));
  };

  const temFolha = dados.servicos.includes("folha") || dados.servicos.includes("depto_pessoal");
  const temSocios = dados.servicos.includes("irpf_socios");
  const temIrpfDecl = dadosDecl.servicos.some((id) => id.startsWith("irpf_"));
  const temAtrasada = dadosDecl.servicos.includes("irpf_atrasada");

  if (!user || carregandoPlano) return null;
  if (!pode("honorarios")) return (
    <Layout user={user}>
      <CardBloqueado ferramenta="honorarios" planoNecessario="profissional" />
    </Layout>
  );

  return (
    <>
      <Head>
        <title>Precificação Contábil — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 900, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              Precificação Contábil
            </h1>
            <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
              Honorários empresariais, declarações PF e comparativo por estado — tudo em um lugar
            </p>
          </div>

          {/* ─── Toggle de modo principal ─── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
            {[
              { id: "empresarial", label: "🏢 Honorários Empresariais" },
              { id: "declaracoes", label: "📝 Declarações & Serviços PF" },
            ].map(({ id, label }) => {
              const ativo = modoPrincipal === id;
              return (
                <button
                  key={id}
                  onClick={() => setModoPrincipal(id)}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 50,
                    fontSize: 14,
                    fontWeight: ativo ? 700 : 500,
                    background: ativo ? "linear-gradient(135deg,#DF9F20,#B27F1A)" : "var(--bg-card)",
                    border: `2px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                    color: ativo ? "#000" : "var(--muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════════
              MODO EMPRESARIAL — fluxo original intacto
          ═══════════════════════════════════════════════════ */}
          {modoPrincipal === "empresarial" && (
            <>
              {/* Steps */}
              <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
                {STEPS.map((s, i) => {
                  const n = i + 1;
                  const ativo = step === n;
                  const feito = step > n;
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", display: "flex",
                          alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13,
                          background: feito ? "var(--primary)" : ativo ? "var(--primary-glow)" : "var(--bg-card)",
                          border: `2px solid ${ativo || feito ? "var(--primary)" : "var(--border)"}`,
                          color: feito ? "#000" : ativo ? "var(--primary)" : "var(--muted)",
                        }}>
                          {feito ? "✓" : n}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: ativo ? 700 : 500, color: ativo ? "var(--text)" : "var(--muted)", whiteSpace: "nowrap" }}>
                          {s}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: feito ? "var(--primary)" : "var(--border)", margin: "0 12px" }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ─── STEP 1: Dados da Empresa ─── */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2col">

                    {/* Estado */}
                    <div>
                      <label style={labelStyle}>Estado</label>
                      <select value={dados.estado} onChange={(e) => set("estado", e.target.value)} style={inputStyle}>
                        {ESTADOS.map((e) => (
                          <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Faturamento */}
                    <div>
                      <label style={labelStyle}>Faturamento Mensal Estimado</label>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>R$</span>
                        <input
                          value={dados.faturamento}
                          onChange={(e) => set("faturamento", moedaMask(e.target.value))}
                          placeholder="0,00"
                          style={{ ...inputStyle, paddingLeft: 44 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Regime */}
                  <div>
                    <label style={labelStyle}>Regime Tributário</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="grid-4col">
                      {["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"].map((r) => {
                        const ativo = dados.regime === r;
                        return (
                          <button key={r} onClick={() => set("regime", r)} style={{
                            padding: "12px 8px", borderRadius: 12, fontSize: 13, fontWeight: ativo ? 700 : 500,
                            background: ativo ? "var(--primary-glow)" : "var(--bg-card)",
                            border: `1px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                            color: ativo ? "var(--primary)" : "var(--muted)", cursor: "pointer", transition: "all 0.15s",
                            textAlign: "center",
                          }}>
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Atividade */}
                  <div>
                    <label style={labelStyle}>Tipo de Atividade</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="grid-4col">
                      {[
                        { id: "Comércio", icon: "🛒" }, { id: "Serviços", icon: "🔧" },
                        { id: "Indústria", icon: "🏭" }, { id: "Misto", icon: "🔀" },
                      ].map(({ id, icon }) => {
                        const ativo = dados.atividade === id;
                        return (
                          <button key={id} onClick={() => set("atividade", id)} style={{
                            padding: "14px 8px", borderRadius: 12, fontSize: 13, fontWeight: ativo ? 700 : 500,
                            background: ativo ? "var(--primary-glow)" : "var(--bg-card)",
                            border: `1px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                            color: ativo ? "var(--primary)" : "var(--muted)", cursor: "pointer", transition: "all 0.15s",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                          }}>
                            <span style={{ fontSize: 22 }}>{icon}</span>
                            {id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      onClick={() => setStep(2)}
                      disabled={!dados.faturamento}
                      style={{
                        padding: "12px 32px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                        background: dados.faturamento ? "linear-gradient(135deg,#DF9F20,#B27F1A)" : "var(--bg-card)",
                        border: "none", color: dados.faturamento ? "#000" : "var(--muted)",
                        cursor: dados.faturamento ? "pointer" : "not-allowed", transition: "all 0.15s",
                      }}
                    >
                      Próximo — Serviços →
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Serviços ─── */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {GRUPOS_SERVICOS.map((grupo) => {
                    const itens = Object.entries(SERVICOS_CONFIG).filter(([, cfg]) => cfg.grupo === grupo);
                    return (
                      <div key={grupo}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                          {grupo}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {itens.map(([id, cfg]) => {
                            const marcado = dados.servicos.includes(id);
                            return (
                              <div
                                key={id}
                                onClick={() => toggleServico(id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 14,
                                  padding: "14px 18px", borderRadius: 12, cursor: "pointer",
                                  background: marcado ? "var(--primary-glow)" : "var(--bg-card)",
                                  border: `1px solid ${marcado ? "var(--primary)" : "var(--border)"}`,
                                  transition: "all 0.15s",
                                }}
                              >
                                <div style={{
                                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                  background: marcado ? "var(--primary)" : "var(--border)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 13, fontWeight: 800, color: marcado ? "#000" : "transparent",
                                  transition: "all 0.15s",
                                }}>
                                  ✓
                                </div>
                                <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 14, fontWeight: marcado ? 700 : 500, color: marcado ? "var(--primary)" : "var(--text)" }}>
                                    {cfg.label}
                                    {cfg.unico && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8, fontWeight: 400 }}>taxa única</span>}
                                  </div>
                                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{cfg.descricao}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Número de funcionários */}
                  {temFolha && (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                      <label style={labelStyle}>Número de funcionários na folha</label>
                      <input
                        type="number" min="1" max="500"
                        value={dados.numFuncionarios}
                        onChange={(e) => set("numFuncionarios", e.target.value)}
                        style={{ ...inputStyle, maxWidth: 180 }}
                      />
                    </div>
                  )}

                  {/* Número de sócios */}
                  {temSocios && (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                      <label style={labelStyle}>Número de sócios para DIRPF</label>
                      <input
                        type="number" min="1" max="20"
                        value={dados.numSocios}
                        onChange={(e) => set("numSocios", e.target.value)}
                        style={{ ...inputStyle, maxWidth: 180 }}
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <button onClick={() => setStep(1)} style={btnSecStyle}>← Voltar</button>
                    <button onClick={() => setStep(3)} style={btnPrimStyle}>
                      Ver Resultado →
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Resultado ─── */}
              {step === 3 && resultado && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Contexto da simulação */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      ESTADOS.find((e) => e.uf === dados.estado)?.nome,
                      dados.regime,
                      dados.atividade,
                      `R$ ${dados.faturamento}/mês`,
                    ].map((tag) => (
                      <span key={tag} style={{
                        fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                        background: "#DF9F2018", border: "1px solid #DF9F2044", color: "var(--primary)",
                      }}>{tag}</span>
                    ))}
                  </div>

                  {/* Cards de resultado */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }} className="grid-3col">
                    {[
                      { titulo: "Mínimo CRC",     valor: resultado.totalMin,  desc: "Tabela de referência CFC/CRC", destaque: false },
                      { titulo: "Mercado",         valor: resultado.totalMed,  desc: "Valor médio praticado",        destaque: true  },
                      { titulo: "Premium",         valor: resultado.totalPrem, desc: "Escritório especializado",     destaque: false },
                    ].map(({ titulo, valor, desc, destaque }) => (
                      <div key={titulo} style={{
                        borderRadius: 16, padding: "22px 20px", textAlign: "center",
                        background: destaque ? "linear-gradient(135deg,#DF9F2022,#B27F1A18)" : "var(--bg-card)",
                        border: `2px solid ${destaque ? "var(--primary)" : "var(--border)"}`,
                        position: "relative",
                      }}>
                        {destaque && (
                          <div style={{
                            position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                            background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
                            color: "#000", fontSize: 10, fontWeight: 800, padding: "3px 12px",
                            borderRadius: 20, whiteSpace: "nowrap",
                          }}>
                            RECOMENDADO
                          </div>
                        )}
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>{titulo}</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: destaque ? "var(--primary)" : "var(--text)" }}>
                          {fmt(valor)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{desc}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>por mês</div>
                      </div>
                    ))}
                  </div>

                  {/* Breakdown */}
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Composição Detalhada</h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                          <tr style={{ background: "#E0E3FF08" }}>
                            {["Serviço", "Mínimo CRC", "Mercado", "Premium"].map((h) => (
                              <th key={h} style={{ padding: "12px 16px", textAlign: h === "Serviço" ? "left" : "right", fontSize: 12, fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.linhas.map((l, i) => (
                            <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                              <td style={{ padding: "12px 16px", color: "var(--text)", fontSize: 14 }}>
                                {l.label}
                                {l.unico && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>(única)</span>}
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--muted)" }}>{fmt(l.min)}</td>
                              <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--primary)", fontWeight: 700 }}>{fmt(l.med)}</td>
                              <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--muted)" }}>{fmt(l.prem)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: "#DF9F2015", borderTop: "2px solid var(--primary)" }}>
                            <td style={{ padding: "14px 16px", fontWeight: 800, color: "var(--text)" }}>TOTAL MENSAL</td>
                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "var(--muted)" }}>{fmt(resultado.totalMin)}</td>
                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 900, color: "var(--primary)", fontSize: 16 }}>{fmt(resultado.totalMed)}</td>
                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "var(--muted)" }}>{fmt(resultado.totalPrem)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Aviso */}
                  <div style={{ background: "#DF9F2010", border: "1px solid #DF9F2033", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "var(--muted)" }}>
                    📌 Valores baseados nas tabelas de referência do <strong style={{ color: "var(--primary)" }}>CFC e CRCs estaduais</strong>, com ajuste para o mercado de <strong style={{ color: "var(--primary)" }}>{ESTADOS.find((e) => e.uf === dados.estado)?.nome}</strong>. O honorário final pode variar conforme complexidade operacional, volume de notas e movimentações do cliente.
                  </div>

                  {/* Ações */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button onClick={() => setStep(1)} style={btnSecStyle}>↺ Nova Simulação</button>
                    <button onClick={() => setStep(2)} style={btnSecStyle}>← Ajustar Serviços</button>
                    <button
                      onClick={() => gerarPDF(dados, resultado, user)}
                      style={{
                        padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                        background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none",
                        color: "#000", cursor: "pointer",
                      }}
                    >
                      🖨️ Gerar PDF da Proposta
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════════
              MODO DECLARAÇÕES & SERVIÇOS PF
          ═══════════════════════════════════════════════════ */}
          {modoPrincipal === "declaracoes" && (
            <>
              {/* Steps do modo declarações */}
              <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
                {["Configurar", "Resultado"].map((s, i) => {
                  const n = i + 1;
                  const ativo = stepDecl === n;
                  const feito = stepDecl > n;
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 1 ? 1 : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", display: "flex",
                          alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13,
                          background: feito ? "var(--primary)" : ativo ? "var(--primary-glow)" : "var(--bg-card)",
                          border: `2px solid ${ativo || feito ? "var(--primary)" : "var(--border)"}`,
                          color: feito ? "#000" : ativo ? "var(--primary)" : "var(--muted)",
                        }}>
                          {feito ? "✓" : n}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: ativo ? 700 : 500, color: ativo ? "var(--text)" : "var(--muted)", whiteSpace: "nowrap" }}>
                          {s}
                        </span>
                      </div>
                      {i < 1 && (
                        <div style={{ flex: 1, height: 2, background: feito ? "var(--primary)" : "var(--border)", margin: "0 12px" }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ─── STEP DECL 1: Configurar ─── */}
              {stepDecl === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                  {/* Estado */}
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select
                      value={dadosDecl.estado}
                      onChange={(e) => setDecl("estado", e.target.value)}
                      style={{ ...inputStyle, maxWidth: 320 }}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grupos de serviços */}
                  {GRUPOS_DECL.map((grupo) => {
                    const itens = Object.entries(DECL_CONFIG).filter(([, cfg]) => cfg.grupo === grupo);
                    return (
                      <div key={grupo}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                          {grupo}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }} className="grid-2col">
                          {itens.map(([id, cfg]) => {
                            const marcado = dadosDecl.servicos.includes(id);
                            return (
                              <div
                                key={id}
                                onClick={() => toggleServicoDecl(id)}
                                style={{
                                  display: "flex", alignItems: "flex-start", gap: 12,
                                  padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                                  background: marcado ? "var(--primary-glow)" : "var(--bg-card)",
                                  border: `1px solid ${marcado ? "var(--primary)" : "var(--border)"}`,
                                  transition: "all 0.15s",
                                }}
                              >
                                <div style={{
                                  width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2,
                                  background: marcado ? "var(--primary)" : "var(--border)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 12, fontWeight: 800, color: marcado ? "#000" : "transparent",
                                  transition: "all 0.15s",
                                }}>
                                  ✓
                                </div>
                                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: marcado ? 700 : 500, color: marcado ? "var(--primary)" : "var(--text)", lineHeight: 1.3 }}>
                                    {cfg.label}
                                  </div>
                                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, lineHeight: 1.3 }}>{cfg.descricao}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Número de contribuintes — visível quando qualquer irpf_* está selecionado */}
                  {temIrpfDecl && (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={labelStyle}>Número de contribuintes</label>
                      <input
                        type="number" min="1" max="100"
                        value={dadosDecl.numContrib}
                        onChange={(e) => setDecl("numContrib", e.target.value)}
                        style={{ ...inputStyle, maxWidth: 180 }}
                      />
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>Multiplica o valor de todos os serviços de IRPF.</div>
                    </div>
                  )}

                  {/* Anos em atraso — visível somente quando irpf_atrasada está selecionado */}
                  {temAtrasada && (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={labelStyle}>Número de anos em atraso</label>
                      <input
                        type="number" min="1" max="20"
                        value={dadosDecl.numAnosAtrasados}
                        onChange={(e) => setDecl("numAnosAtrasados", e.target.value)}
                        style={{ ...inputStyle, maxWidth: 180 }}
                      />
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>Multiplica o valor da DIRPF em Atraso.</div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      onClick={() => setStepDecl(2)}
                      disabled={dadosDecl.servicos.length === 0}
                      style={{
                        padding: "12px 32px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                        background: dadosDecl.servicos.length > 0 ? "linear-gradient(135deg,#DF9F20,#B27F1A)" : "var(--bg-card)",
                        border: "none",
                        color: dadosDecl.servicos.length > 0 ? "#000" : "var(--muted)",
                        cursor: dadosDecl.servicos.length > 0 ? "pointer" : "not-allowed",
                        transition: "all 0.15s",
                      }}
                    >
                      Ver Resultado →
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP DECL 2: Resultado ─── */}
              {stepDecl === 2 && resultadoDecl && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Contexto */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      ESTADOS.find((e) => e.uf === dadosDecl.estado)?.nome,
                      `${dadosDecl.servicos.length} serviço${dadosDecl.servicos.length !== 1 ? "s" : ""}`,
                      ...(temIrpfDecl ? [`${dadosDecl.numContrib} contribuinte${parseInt(dadosDecl.numContrib) !== 1 ? "s" : ""}`] : []),
                    ].map((tag) => (
                      <span key={tag} style={{
                        fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                        background: "#DF9F2018", border: "1px solid #DF9F2044", color: "var(--primary)",
                      }}>{tag}</span>
                    ))}
                  </div>

                  {/* Cards de total */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }} className="grid-3col">
                    {[
                      { titulo: "Mínimo",   valor: resultadoDecl.totalMin,  desc: "Tabela de referência CFC/CRC", destaque: false },
                      { titulo: "Mercado",  valor: resultadoDecl.totalMed,  desc: "Valor médio praticado",        destaque: true  },
                      { titulo: "Premium",  valor: resultadoDecl.totalPrem, desc: "Escritório especializado",     destaque: false },
                    ].map(({ titulo, valor, desc, destaque }) => (
                      <div key={titulo} style={{
                        borderRadius: 16, padding: "22px 20px", textAlign: "center",
                        background: destaque ? "linear-gradient(135deg,#DF9F2022,#B27F1A18)" : "var(--bg-card)",
                        border: `2px solid ${destaque ? "var(--primary)" : "var(--border)"}`,
                        position: "relative",
                      }}>
                        {destaque && (
                          <div style={{
                            position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                            background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
                            color: "#000", fontSize: 10, fontWeight: 800, padding: "3px 12px",
                            borderRadius: 20, whiteSpace: "nowrap",
                          }}>
                            RECOMENDADO
                          </div>
                        )}
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>{titulo}</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: destaque ? "var(--primary)" : "var(--text)" }}>
                          {fmt(valor)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Breakdown por serviço */}
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Detalhamento por Serviço</h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                          <tr style={{ background: "#E0E3FF08" }}>
                            {["Serviço", "Mínimo", "Mercado", "Premium"].map((h) => (
                              <th key={h} style={{ padding: "12px 16px", textAlign: h === "Serviço" ? "left" : "right", fontSize: 12, fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resultadoDecl.linhas.map((l, i) => (
                            <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                              <td style={{ padding: "12px 16px", color: "var(--text)", fontSize: 14 }}>
                                {l.icon && <span style={{ marginRight: 6 }}>{l.icon}</span>}
                                {l.label}
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--muted)" }}>{fmt(l.min)}</td>
                              <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--primary)", fontWeight: 700 }}>{fmt(l.med)}</td>
                              <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--muted)" }}>{fmt(l.prem)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: "#DF9F2015", borderTop: "2px solid var(--primary)" }}>
                            <td style={{ padding: "14px 16px", fontWeight: 800, color: "var(--text)" }}>TOTAL ESTIMADO</td>
                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "var(--muted)" }}>{fmt(resultadoDecl.totalMin)}</td>
                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 900, color: "var(--primary)", fontSize: 16 }}>{fmt(resultadoDecl.totalMed)}</td>
                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "var(--muted)" }}>{fmt(resultadoDecl.totalPrem)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Nota */}
                  <div style={{ background: "#DF9F2010", border: "1px solid #DF9F2033", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "var(--muted)" }}>
                    📌 Honorários de serviços únicos — não recorrentes. Ajustado ao mercado de <strong style={{ color: "var(--primary)" }}>{ESTADOS.find((e) => e.uf === dadosDecl.estado)?.nome}</strong>.
                  </div>

                  {/* Comparativo por estado */}
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                        Comparativo por Estado — Valor de Mercado
                      </h3>
                      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, marginBottom: 0 }}>
                        Mesmo serviço, ajuste regional aplicado. Ordenado do maior ao menor valor.
                      </p>
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }} className="grid-3col">
                        {comparativoEstados.map(({ uf, nome, total }) => {
                          const isAtual = uf === dadosDecl.estado;
                          return (
                            <div
                              key={uf}
                              style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "10px 12px", borderRadius: 10,
                                background: isAtual ? "linear-gradient(135deg,#DF9F2022,#B27F1A18)" : "var(--bg)",
                                border: `1px solid ${isAtual ? "var(--primary)" : "var(--border)"}`,
                              }}
                            >
                              <div style={{
                                minWidth: 32, height: 24, borderRadius: 6, display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 11, fontWeight: 800,
                                background: isAtual ? "var(--primary)" : "var(--border)",
                                color: isAtual ? "#000" : "var(--muted)",
                                flexShrink: 0,
                              }}>
                                {uf}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: isAtual ? "var(--primary)" : "var(--text)", lineHeight: 1.3 }}>
                                  {fmt(total)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button onClick={() => setStepDecl(1)} style={btnSecStyle}>↺ Nova Simulação</button>
                    <button onClick={() => setStepDecl(1)} style={btnSecStyle}>← Ajustar Serviços</button>
                    <button
                      onClick={() => gerarPDFDeclaracoes(dadosDecl, resultadoDecl)}
                      style={{
                        padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                        background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none",
                        color: "#000", cursor: "pointer",
                      }}
                    >
                      🖨️ Gerar PDF da Proposta
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </Layout>

      <style jsx global>{`
        @media (max-width: 700px) {
          .grid-2col, .grid-4col, .grid-3col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .grid-4col { grid-template-columns: 1fr 1fr !important; }
          .grid-3col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)",
  marginBottom: 8, letterSpacing: "0.02em",
};
const inputStyle = {
  width: "100%", padding: "11px 14px", background: "var(--bg-card)",
  border: "1px solid var(--border)", borderRadius: 10, fontSize: 14,
  color: "var(--text)", outline: "none", boxSizing: "border-box",
};
const btnSecStyle = {
  padding: "11px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
  background: "var(--bg-card)", border: "1px solid var(--border)",
  color: "var(--muted)", cursor: "pointer",
};
const btnPrimStyle = {
  padding: "12px 32px", borderRadius: 12, fontSize: 15, fontWeight: 700,
  background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
  border: "none", color: "#000", cursor: "pointer",
};
