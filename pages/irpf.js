import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import { useAssinatura } from "../lib/AssinaturaContext";
import CardBloqueado from "../components/CardBloqueado";

// ─── Tabela Progressiva Anual — IRPF 2025 (Declaração 2026) ───────────────
const TABELA_ANUAL = [
  { limite: 26963.20, aliquota: 0,     parcela: 0        },
  { limite: 33919.80, aliquota: 0.075, parcela: 2022.24  },
  { limite: 45012.60, aliquota: 0.15,  parcela: 4566.23  },
  { limite: 55976.16, aliquota: 0.225, parcela: 7942.13  },
  { limite: Infinity, aliquota: 0.275, parcela: 10740.95 },
];

// ─── Tabela Progressiva Mensal — IRRF 2025 ────────────────────────────────
const TABELA_MENSAL = [
  { limite: 2259.20,  aliquota: 0,     parcela: 0      },
  { limite: 2826.65,  aliquota: 0.075, parcela: 169.44 },
  { limite: 3751.05,  aliquota: 0.15,  parcela: 381.44 },
  { limite: 4664.68,  aliquota: 0.225, parcela: 662.77 },
  { limite: Infinity, aliquota: 0.275, parcela: 896.00 },
];

const DED_DEPENDENTE_ANUAL  = 2275.08;
const DED_DEPENDENTE_MENSAL = 189.59;
const LIM_EDUCACAO_POR_PESSOA = 3561.50;
const LIM_SIMPLIFICADO        = 16754.34;
const PERC_SIMPLIFICADO       = 0.20;
const ISENCAO_IDOSO           = 26963.20; // aposentadoria/pensão isenta ≥65 anos/ano

// ─── Helpers ──────────────────────────────────────────────────────────────
function calcIR(base, tabela) {
  if (base <= 0) return 0;
  for (const f of tabela) {
    if (base <= f.limite) return Math.max(0, base * f.aliquota - f.parcela);
  }
  return 0;
}

function faixaLabel(base, tabela) {
  for (const f of tabela) {
    if (base <= f.limite) return `${(f.aliquota * 100).toFixed(1)}%`;
  }
  return "27,5%";
}

function aliquotaEfetiva(ir, base) {
  if (!base || base <= 0) return 0;
  return (ir / base) * 100;
}

const fmt   = (v) => (v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parse = (v) => parseFloat(String(v || 0).replace(/\./g, "").replace(",", ".")) || 0;

// ─── Input monetário ──────────────────────────────────────────────────────
function CampoMoeda({ label, value, onChange, placeholder = "0,00", hint }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--muted)", marginBottom: 5, display: "block", fontWeight: 600 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>R$</span>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
            background: "var(--bg-input)", border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none",
          }}
        />
      </div>
      {hint && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, opacity: 0.7 }}>{hint}</p>}
    </div>
  );
}

function CampoNumero({ label, value, onChange, min = "0", hint }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--muted)", marginBottom: 5, display: "block", fontWeight: 600 }}>{label}</label>
      <input
        type="number"
        min={min}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "9px 12px",
          background: "var(--bg-input)", border: "1px solid var(--border)",
          borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none",
        }}
      />
      {hint && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, opacity: 0.7 }}>{hint}</p>}
    </div>
  );
}

// ─── Linha de resultado ───────────────────────────────────────────────────
function LinhaR({ label, valor, destaque, sub, cor }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: destaque ? "10px 0" : "7px 0",
      borderTop: destaque ? "1px solid var(--border)" : "none",
      marginTop: destaque ? 4 : 0,
    }}>
      <span style={{ fontSize: destaque ? 13 : 12, color: "var(--muted)", fontWeight: destaque ? 700 : 400 }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: destaque ? 15 : 13, fontWeight: destaque ? 800 : 600, color: cor || "var(--text)" }}>
          R$ {fmt(valor)}
        </span>
        {sub && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function IRPFPage() {
  const router   = useRouter();
  const [user, setUser] = useState(null);
  const { pode, carregando } = useAssinatura();
  const [aba, setAba] = useState("anual");

  // ── Declaração Anual ──
  const [salario,       setSalario]       = useState("");
  const [aluguel,       setAluguel]       = useState("");
  const [autonomo,      setAutonomo]      = useState("");
  const [aposentadoria, setAposentadoria] = useState("");
  const [outrosRend,    setOutrosRend]    = useState("");
  const [irRetido,      setIrRetido]      = useState("");
  const [idade,         setIdade]         = useState("");
  // deduções
  const [dependentes,     setDependentes]     = useState("0");
  const [inss,            setInss]            = useState("");
  const [pensao,          setPensao]          = useState("");
  const [saude,           setSaude]           = useState("");
  const [educacao,        setEducacao]        = useState("");
  const [pgbl,            setPgbl]            = useState("");
  const [outrasDeducoes,  setOutrasDeducoes]  = useState("");

  // ── IRRF Mensal ──
  const [salMensal,          setSalMensal]          = useState("");
  const [inssMensal,         setInssMensal]         = useState("");
  const [depMensal,          setDepMensal]          = useState("0");
  const [pensaoMensal,       setPensaoMensal]       = useState("");
  const [outrasDeducMensal,  setOutrasDeducMensal]  = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (!user || carregando) return null;
  if (!pode("irpf")) return (
    <Layout user={user}>
      <CardBloqueado ferramenta="irpf" planoNecessario="especialista" />
    </Layout>
  );

  // ══════════════════════════════════════════════
  // CÁLCULO — DECLARAÇÃO ANUAL
  // ══════════════════════════════════════════════
  const rendBruto    = parse(salario) + parse(aluguel) + parse(autonomo) + parse(aposentadoria) + parse(outrosRend);
  const irRetidoVal  = parse(irRetido);
  const idadeNum     = parseInt(idade) || 0;

  // Isenção aposentadoria/pensão para ≥ 65 anos
  const isentoIdoso     = idadeNum >= 65 ? Math.min(parse(aposentadoria), ISENCAO_IDOSO) : 0;
  const rendTributavel  = Math.max(0, rendBruto - isentoIdoso);

  // Deduções comuns (ambos os modelos)
  const inssVal   = parse(inss);
  const pensaoVal = parse(pensao);
  const baseComum = Math.max(0, rendTributavel - inssVal - pensaoVal);

  // ── Modelo Simplificado ──
  const descontoSimpl = Math.min(baseComum * PERC_SIMPLIFICADO, LIM_SIMPLIFICADO);
  const baseSimpl     = Math.max(0, baseComum - descontoSimpl);
  const irSimpl       = calcIR(baseSimpl, TABELA_ANUAL);
  const saldoSimpl    = irRetidoVal - irSimpl;
  const aliqEfSimpl   = aliquotaEfetiva(irSimpl, rendTributavel);

  // ── Modelo Completo ──
  const numDep       = parseInt(dependentes) || 0;
  const dedDep       = numDep * DED_DEPENDENTE_ANUAL;
  const dedSaude     = parse(saude);
  const pessoasEd    = numDep + 1;
  const dedEducacao  = Math.min(parse(educacao), LIM_EDUCACAO_POR_PESSOA * pessoasEd);
  const dedPGBL      = Math.min(parse(pgbl), rendTributavel * 0.12);
  const dedOutras    = parse(outrasDeducoes);
  const totalDedLeg  = dedDep + dedSaude + dedEducacao + dedPGBL + dedOutras;
  const baseCompleto = Math.max(0, baseComum - totalDedLeg);
  const irCompleto   = calcIR(baseCompleto, TABELA_ANUAL);
  const saldoCompleto = irRetidoVal - irCompleto;
  const aliqEfComp   = aliquotaEfetiva(irCompleto, rendTributavel);

  // ── Recomendação ──
  const convemCompleto  = irCompleto < irSimpl;
  const economia        = Math.abs(irSimpl - irCompleto);

  // ══════════════════════════════════════════════
  // CÁLCULO — IRRF MENSAL
  // ══════════════════════════════════════════════
  const salBruto     = parse(salMensal);
  const inssM        = parse(inssMensal);
  const numDepM      = parseInt(depMensal) || 0;
  const pensaoM      = parse(pensaoMensal);
  const outrasM      = parse(outrasDeducMensal);
  const dedDepM      = numDepM * DED_DEPENDENTE_MENSAL;
  const baseMensal   = Math.max(0, salBruto - inssM - pensaoM - dedDepM - outrasM);
  const irMensal     = calcIR(baseMensal, TABELA_MENSAL);
  const aliqMensal   = faixaLabel(baseMensal, TABELA_MENSAL);
  const aliqEfM      = aliquotaEfetiva(irMensal, salBruto);
  const liquidoM     = salBruto - inssM - irMensal;

  // ══════════════════════════════════════════════
  // PDF — DECLARAÇÃO ANUAL
  // ══════════════════════════════════════════════
  function gerarPDF() {
    const nome = user?.user_metadata?.nome || user?.email?.split("@")[0] || "Contribuinte";
    const dataHora = `${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

    const linhaRend = (label, val) => val > 0 ? `<tr><td>${label}</td><td class="val">R$ ${fmt(val)}</td></tr>` : "";
    const linhaDed  = (label, val, limite) => val > 0 ? `<tr><td>${label}${limite ? ` <small>(limite R$ ${fmt(limite)})</small>` : ""}</td><td class="val" style="color:#16a34a">− R$ ${fmt(val)}</td></tr>` : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Simulação IRPF 2026 — GJ Hub Contábil</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;background:#fff;color:#111;font-size:13px;padding:32px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #DF9F20}
  .logo h1{font-size:19px;color:#00031F;font-weight:900}
  .logo p{font-size:11px;color:#666;margin-top:2px}
  .badge{background:#DF9F20;color:#000;font-size:10px;font-weight:800;padding:4px 12px;border-radius:20px}
  h2{font-size:16px;color:#00031F;text-align:center;margin-bottom:4px;font-weight:900}
  .sub{text-align:center;font-size:11px;color:#888;margin-bottom:20px}
  .sec{margin-bottom:18px}
  .sec-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#00031F;border-left:3px solid #DF9F20;padding-left:8px;margin-bottom:10px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  td{padding:6px 10px;border-bottom:1px solid #f3f4f6}
  .val{text-align:right;font-weight:700}
  .total td{font-weight:800;font-size:13px;border-top:2px solid #e5e7eb;padding-top:10px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px}
  .card{border:1px solid #e5e7eb;border-radius:10px;padding:14px}
  .card-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;color:#555}
  .result-box{text-align:center;border-radius:8px;padding:12px;margin-top:10px}
  .restitui{background:#dcfce7;border:1px solid #86efac}
  .pagar{background:#fee2e2;border:1px solid #fca5a5}
  .result-label{font-size:11px;font-weight:800;margin-bottom:4px}
  .result-valor{font-size:22px;font-weight:900}
  .recom{background:#fefce8;border:1px solid #fde047;border-radius:10px;padding:14px;margin-bottom:18px}
  .recom strong{color:#854d0e}
  .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#999}
</style>
</head>
<body>
<div class="header">
  <div class="logo"><h1>GJ Hub Contábil</h1><p>Simulador IRPF — Declaração 2026 (Ano-base 2025)</p></div>
  <div class="badge">SIMULAÇÃO IRPF</div>
</div>

<h2>Simulação do Imposto de Renda — Pessoa Física</h2>
<p class="sub">Gerado em ${dataHora} · ${nome}</p>

<div class="sec">
  <div class="sec-title">Rendimentos Tributáveis</div>
  <table>
    ${linhaRend("Salários e pró-labore", parse(salario))}
    ${linhaRend("Rendimentos de aluguel", parse(aluguel))}
    ${linhaRend("Rendimentos de autônomo / PJ", parse(autonomo))}
    ${linhaRend("Aposentadoria / Pensão recebida", parse(aposentadoria))}
    ${linhaRend("Outros rendimentos tributáveis", parse(outrosRend))}
    ${isentoIdoso > 0 ? `<tr><td style="color:#16a34a">(−) Isenção aposentadoria ≥ 65 anos</td><td class="val" style="color:#16a34a">R$ ${fmt(isentoIdoso)}</td></tr>` : ""}
    <tr class="total"><td>Total tributável</td><td class="val">R$ ${fmt(rendTributavel)}</td></tr>
    ${irRetidoVal > 0 ? `<tr><td>IR retido na fonte (ano todo)</td><td class="val">R$ ${fmt(irRetidoVal)}</td></tr>` : ""}
  </table>
</div>

${inssVal > 0 || pensaoVal > 0 ? `
<div class="sec">
  <div class="sec-title">Deduções Comuns (ambos os modelos)</div>
  <table>
    ${linhaDed("INSS recolhido no ano", inssVal)}
    ${linhaDed("Pensão alimentícia paga", pensaoVal)}
    <tr class="total"><td>Base antes das deduções específicas</td><td class="val">R$ ${fmt(baseComum)}</td></tr>
  </table>
</div>` : ""}

<div class="grid">
  <div class="card">
    <div class="card-title">Modelo Simplificado</div>
    <table>
      <tr><td>Desconto simplificado (20%)</td><td class="val" style="color:#16a34a">− R$ ${fmt(descontoSimpl)}</td></tr>
      ${descontoSimpl >= LIM_SIMPLIFICADO ? `<tr><td colspan="2"><small style="color:#888">Limitado ao teto de R$ ${fmt(LIM_SIMPLIFICADO)}</small></td></tr>` : ""}
      <tr><td>Base tributável</td><td class="val">R$ ${fmt(baseSimpl)}</td></tr>
      <tr><td>IR devido</td><td class="val">R$ ${fmt(irSimpl)}</td></tr>
      <tr><td>Alíquota efetiva</td><td class="val">${fmt(aliqEfSimpl)}%</td></tr>
    </table>
    <div class="result-box ${saldoSimpl >= 0 ? "restitui" : "pagar"}">
      <div class="result-label" style="color:${saldoSimpl >= 0 ? "#166534" : "#991b1b"}">${saldoSimpl >= 0 ? "RESTITUIÇÃO" : "IR A PAGAR"}</div>
      <div class="result-valor" style="color:${saldoSimpl >= 0 ? "#166534" : "#991b1b"}">R$ ${fmt(Math.abs(saldoSimpl))}</div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Modelo Completo (Deduções Legais)</div>
    <table>
      ${linhaDed(`Dependentes (${numDep} × R$ ${fmt(DED_DEPENDENTE_ANUAL)})`, dedDep)}
      ${linhaDed("Despesas médicas / saúde", dedSaude)}
      ${linhaDed(`Educação (limite R$ ${fmt(LIM_EDUCACAO_POR_PESSOA)}/pessoa)`, dedEducacao)}
      ${linhaDed("Previdência privada PGBL (12%)", dedPGBL)}
      ${linhaDed("Outras deduções legais", dedOutras)}
      <tr class="total"><td>Base tributável</td><td class="val">R$ ${fmt(baseCompleto)}</td></tr>
      <tr><td>IR devido</td><td class="val">R$ ${fmt(irCompleto)}</td></tr>
      <tr><td>Alíquota efetiva</td><td class="val">${fmt(aliqEfComp)}%</td></tr>
    </table>
    <div class="result-box ${saldoCompleto >= 0 ? "restitui" : "pagar"}">
      <div class="result-label" style="color:${saldoCompleto >= 0 ? "#166534" : "#991b1b"}">${saldoCompleto >= 0 ? "RESTITUIÇÃO" : "IR A PAGAR"}</div>
      <div class="result-valor" style="color:${saldoCompleto >= 0 ? "#166534" : "#991b1b"}">R$ ${fmt(Math.abs(saldoCompleto))}</div>
    </div>
  </div>
</div>

<div class="recom">
  <strong>💡 Recomendação:</strong>
  ${convemCompleto
    ? ` Declarar por <strong>Deduções Legais (Completo)</strong> é mais vantajoso — você paga R$ ${fmt(economia)} a menos de imposto.`
    : ` Declarar pelo <strong>Desconto Simplificado</strong> é mais vantajoso — você paga R$ ${fmt(economia)} a menos de imposto.`
  }
  ${economia === 0 ? " Os dois modelos resultam no mesmo valor." : ""}
</div>

<div class="footer">
  <strong>GJ Hub Contábil</strong> — pro.gjtreinamentoscontabeis.com<br/>
  Simulação com base na Tabela Progressiva IRPF 2025. Valores de caráter informativo — confirme com a legislação vigente antes de declarar.
</div>
</body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  }

  // ── PDF IRRF Mensal ──
  function gerarPDFMensal() {
    const nome = user?.user_metadata?.nome || user?.email?.split("@")[0] || "Contador";
    const dataHora = `${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>IRRF Mensal — GJ Hub Contábil</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;background:#fff;color:#111;font-size:13px;padding:32px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #DF9F20}
  .logo h1{font-size:19px;color:#00031F;font-weight:900}
  .logo p{font-size:11px;color:#666;margin-top:2px}
  .badge{background:#DF9F20;color:#000;font-size:10px;font-weight:800;padding:4px 12px;border-radius:20px}
  h2{font-size:16px;color:#00031F;text-align:center;margin-bottom:4px;font-weight:900}
  .sub{text-align:center;font-size:11px;color:#888;margin-bottom:20px}
  .card{border:1px solid #e5e7eb;border-radius:10px;padding:20px;max-width:480px;margin:0 auto}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:8px 0;border-bottom:1px solid #f3f4f6}
  .val{text-align:right;font-weight:700}
  .total td{font-weight:800;font-size:14px;border-top:2px solid #e5e7eb;padding-top:10px}
  .ir-box{background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:14px;text-align:center;margin:14px 0}
  .liq-box{background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:14px;text-align:center;margin-top:8px}
  .box-label{font-size:11px;font-weight:800;margin-bottom:4px}
  .box-valor{font-size:24px;font-weight:900}
  .tabela-ref{margin-top:20px;border:1px solid #e5e7eb;border-radius:10px;padding:14px}
  .tabela-ref h3{font-size:12px;font-weight:800;margin-bottom:10px;color:#555}
  .tabela-ref table td{font-size:11px}
  .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#999}
</style>
</head>
<body>
<div class="header">
  <div class="logo"><h1>GJ Hub Contábil</h1><p>IRRF Mensal — Tabela 2025</p></div>
  <div class="badge">IRRF MENSAL</div>
</div>
<h2>Cálculo do IRRF Mensal</h2>
<p class="sub">Gerado em ${dataHora} · ${nome}</p>

<div class="card">
  <table>
    <tr><td>Salário / rendimento bruto</td><td class="val">R$ ${fmt(salBruto)}</td></tr>
    <tr><td>(−) INSS descontado</td><td class="val" style="color:#16a34a">− R$ ${fmt(inssM)}</td></tr>
    ${dedDepM > 0 ? `<tr><td>(−) Dependentes (${numDepM} × R$ ${fmt(DED_DEPENDENTE_MENSAL)})</td><td class="val" style="color:#16a34a">− R$ ${fmt(dedDepM)}</td></tr>` : ""}
    ${pensaoM > 0 ? `<tr><td>(−) Pensão alimentícia</td><td class="val" style="color:#16a34a">− R$ ${fmt(pensaoM)}</td></tr>` : ""}
    ${outrasM > 0 ? `<tr><td>(−) Outras deduções</td><td class="val" style="color:#16a34a">− R$ ${fmt(outrasM)}</td></tr>` : ""}
    <tr class="total"><td>Base de cálculo</td><td class="val">R$ ${fmt(baseMensal)}</td></tr>
    <tr><td>Faixa / alíquota</td><td class="val">${aliqMensal}</td></tr>
    <tr><td>Alíquota efetiva</td><td class="val">${fmt(aliqEfM)}%</td></tr>
  </table>

  <div class="ir-box">
    <div class="box-label" style="color:#991b1b">IRRF A RETER</div>
    <div class="box-valor" style="color:#991b1b">R$ ${fmt(irMensal)}</div>
  </div>
  <div class="liq-box">
    <div class="box-label" style="color:#166534">SALÁRIO LÍQUIDO</div>
    <div class="box-valor" style="color:#166534">R$ ${fmt(liquidoM)}</div>
  </div>
</div>

<div class="tabela-ref">
  <h3>Tabela Progressiva IRRF Mensal 2025</h3>
  <table>
    <tr><td>Até R$ 2.259,20</td><td class="val">Isento</td></tr>
    <tr><td>R$ 2.259,21 a R$ 2.826,65</td><td class="val">7,5% − R$ 169,44</td></tr>
    <tr><td>R$ 2.826,66 a R$ 3.751,05</td><td class="val">15% − R$ 381,44</td></tr>
    <tr><td>R$ 3.751,06 a R$ 4.664,68</td><td class="val">22,5% − R$ 662,77</td></tr>
    <tr><td>Acima de R$ 4.664,68</td><td class="val">27,5% − R$ 896,00</td></tr>
  </table>
</div>

<div class="footer">
  <strong>GJ Hub Contábil</strong> — pro.gjtreinamentoscontabeis.com<br/>
  Cálculo com base na tabela progressiva IRRF 2025. Valores de caráter informativo.
</div>
</body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  }

  // ══════════════════════════════════════════════
  // ESTILOS REUTILIZÁVEIS
  // ══════════════════════════════════════════════
  const card = { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 20px" };
  const secTitle = { fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--border)" };
  const TABS = [
    { id: "anual",   label: "📊 Declaração Anual" },
    { id: "mensal",  label: "📅 IRRF Mensal" },
    { id: "tabelas", label: "📋 Tabelas de Referência" },
  ];

  return (
    <>
      <Head><title>Simulador IRPF — GJ Hub Contábil</title></Head>
      <Layout user={user}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>Simulador IRPF</h1>
              <span style={{ background: "#DF9F2020", color: "#DF9F20", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em" }}>ESPECIALISTA</span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              Declaração 2026 — Ano-base 2025 · Tabela progressiva atualizada · Simplificado vs. Completo
            </p>
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setAba(t.id)} style={{
                background: "none", border: "none", padding: "10px 18px",
                fontSize: 13, fontWeight: 700,
                color: aba === t.id ? "var(--primary)" : "var(--muted)",
                borderBottom: aba === t.id ? "2px solid var(--primary)" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.2s", marginBottom: -1,
              }}>{t.label}</button>
            ))}
          </div>

          {/* ══════════════════════════════════════
              ABA — DECLARAÇÃO ANUAL
          ══════════════════════════════════════ */}
          {aba === "anual" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Coluna Esquerda — Inputs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Rendimentos */}
                <div style={card}>
                  <div style={secTitle}>💰 Rendimentos Tributáveis (ano todo)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <CampoMoeda label="Salários, pró-labore e comissões" value={salario} onChange={setSalario} />
                    <CampoMoeda label="Rendimentos de aluguel" value={aluguel} onChange={setAluguel} />
                    <CampoMoeda label="Rendimentos de autônomo / PJ" value={autonomo} onChange={setAutonomo} />
                    <CampoMoeda label="Aposentadoria / Pensão recebida" value={aposentadoria} onChange={setAposentadoria} />
                    <CampoMoeda label="Outros rendimentos tributáveis" value={outrosRend} onChange={setOutrosRend} />
                    <CampoMoeda label="IR retido na fonte (total do ano)" value={irRetido} onChange={setIrRetido} hint="Soma de todos os informes de rendimentos" />
                    <CampoNumero label="Idade do contribuinte" value={idade} onChange={setIdade} hint="≥ 65 anos: isenção em aposentadoria/pensão" />
                  </div>
                </div>

                {/* Deduções */}
                <div style={card}>
                  <div style={secTitle}>🗂️ Deduções — Modelo Completo</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <CampoNumero label="Número de dependentes" value={dependentes} onChange={setDependentes} hint={`R$ ${fmt(DED_DEPENDENTE_ANUAL)} por dependente/ano`} />
                    <CampoMoeda label="INSS recolhido no ano" value={inss} onChange={setInss} hint="Contribuição previdenciária dedutível" />
                    <CampoMoeda label="Pensão alimentícia paga" value={pensao} onChange={setPensao} hint="Valor judicial — dedução integral" />
                    <CampoMoeda label="Despesas médicas e saúde" value={saude} onChange={setSaude} hint="Sem limite — plano, médico, dentista, hospital" />
                    <CampoMoeda label="Despesas com educação" value={educacao} onChange={setEducacao} hint={`Limite: R$ ${fmt(LIM_EDUCACAO_POR_PESSOA)} por pessoa (você + dependentes)`} />
                    <CampoMoeda label="Previdência privada PGBL" value={pgbl} onChange={setPgbl} hint="Limite: 12% da renda bruta tributável" />
                    <CampoMoeda label="Outras deduções legais" value={outrasDeducoes} onChange={setOutrasDeducoes} />
                  </div>
                </div>
              </div>

              {/* Coluna Direita — Resultados */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Rendimentos resumo */}
                <div style={card}>
                  <div style={secTitle}>📊 Resumo dos Rendimentos</div>
                  <LinhaR label="Rendimento bruto total" valor={rendBruto} />
                  {isentoIdoso > 0 && <LinhaR label={`Isenção aposentadoria ≥65 anos`} valor={isentoIdoso} cor="#22c55e" />}
                  <LinhaR label="Rendimento tributável" valor={rendTributavel} destaque />
                  {inssVal > 0 && <LinhaR label="(−) INSS" valor={inssVal} cor="#22c55e" />}
                  {pensaoVal > 0 && <LinhaR label="(−) Pensão alimentícia" valor={pensaoVal} cor="#22c55e" />}
                  <LinhaR label="Base antes das deduções específicas" valor={baseComum} destaque />
                </div>

                {/* Simplificado */}
                <div style={{ ...card, border: `1px solid ${!convemCompleto ? "var(--primary)" : "var(--border)"}`, background: !convemCompleto ? "var(--bg-card)" : "var(--bg-card)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>📄 Desconto Simplificado</span>
                    {!convemCompleto && rendTributavel > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#22c55e20", color: "#22c55e", padding: "2px 10px", borderRadius: 20 }}>✓ MAIS VANTAJOSO</span>
                    )}
                  </div>
                  <LinhaR label="Desconto (20% da base)" valor={descontoSimpl} cor="#22c55e" sub={descontoSimpl >= LIM_SIMPLIFICADO ? `Limitado ao teto de R$ ${fmt(LIM_SIMPLIFICADO)}` : undefined} />
                  <LinhaR label="Base tributável" valor={baseSimpl} destaque />
                  <LinhaR label="IR devido" valor={irSimpl} />
                  <LinhaR label={`Alíquota efetiva`} valor={null} />
                  <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: -20, marginBottom: 8 }}>{fmt(aliqEfSimpl)}%</div>

                  <div style={{
                    marginTop: 12, borderRadius: 10, padding: "14px 16px", textAlign: "center",
                    background: saldoSimpl >= 0 ? "#22c55e18" : "#ef444418",
                    border: `1px solid ${saldoSimpl >= 0 ? "#22c55e40" : "#ef444440"}`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: saldoSimpl >= 0 ? "#22c55e" : "#ef4444", marginBottom: 4, letterSpacing: "0.06em" }}>
                      {saldoSimpl >= 0 ? "✓ RESTITUIÇÃO" : "⚠ IR A PAGAR"}
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: saldoSimpl >= 0 ? "#22c55e" : "#ef4444" }}>
                      R$ {fmt(Math.abs(saldoSimpl))}
                    </div>
                  </div>
                </div>

                {/* Completo */}
                <div style={{ ...card, border: `1px solid ${convemCompleto && rendTributavel > 0 ? "var(--primary)" : "var(--border)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>📋 Deduções Legais (Completo)</span>
                    {convemCompleto && rendTributavel > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#22c55e20", color: "#22c55e", padding: "2px 10px", borderRadius: 20 }}>✓ MAIS VANTAJOSO</span>
                    )}
                  </div>
                  {dedDep > 0     && <LinhaR label={`Dependentes (${numDep})`}  valor={dedDep}     cor="#22c55e" />}
                  {dedSaude > 0   && <LinhaR label="Saúde / medicina"           valor={dedSaude}   cor="#22c55e" />}
                  {dedEducacao > 0 && <LinhaR label="Educação"                  valor={dedEducacao} cor="#22c55e" />}
                  {dedPGBL > 0    && <LinhaR label="PGBL"                       valor={dedPGBL}    cor="#22c55e" />}
                  {dedOutras > 0  && <LinhaR label="Outras deduções"            valor={dedOutras}  cor="#22c55e" />}
                  {totalDedLeg > 0 && <LinhaR label="Total deduções legais"     valor={totalDedLeg} destaque cor="#22c55e" />}
                  <LinhaR label="Base tributável"  valor={baseCompleto} destaque />
                  <LinhaR label="IR devido"         valor={irCompleto} />
                  <LinhaR label="Alíquota efetiva"  valor={null} />
                  <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: -20, marginBottom: 8 }}>{fmt(aliqEfComp)}%</div>

                  <div style={{
                    marginTop: 12, borderRadius: 10, padding: "14px 16px", textAlign: "center",
                    background: saldoCompleto >= 0 ? "#22c55e18" : "#ef444418",
                    border: `1px solid ${saldoCompleto >= 0 ? "#22c55e40" : "#ef444440"}`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: saldoCompleto >= 0 ? "#22c55e" : "#ef4444", marginBottom: 4, letterSpacing: "0.06em" }}>
                      {saldoCompleto >= 0 ? "✓ RESTITUIÇÃO" : "⚠ IR A PAGAR"}
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: saldoCompleto >= 0 ? "#22c55e" : "#ef4444" }}>
                      R$ {fmt(Math.abs(saldoCompleto))}
                    </div>
                  </div>
                </div>

                {/* Recomendação */}
                {rendTributavel > 0 && (
                  <div style={{ background: convemCompleto ? "#1a3300" : "#001a33", border: `1px solid ${convemCompleto ? "#22c55e40" : "#808CFF40"}`, borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: convemCompleto ? "#22c55e" : "var(--primary)", marginBottom: 6, letterSpacing: "0.06em" }}>
                      💡 RECOMENDAÇÃO
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                      {economia === 0
                        ? "Os dois modelos resultam no mesmo imposto para este perfil."
                        : convemCompleto
                          ? <>Declare pelo modelo <strong>Completo (Deduções Legais)</strong>. Você economiza <strong style={{ color: "#22c55e" }}>R$ {fmt(economia)}</strong> em relação ao simplificado.</>
                          : <>Declare pelo <strong>Desconto Simplificado</strong>. Você economiza <strong style={{ color: "var(--primary)" }}>R$ {fmt(economia)}</strong> em relação ao modelo completo.</>
                      }
                    </p>
                  </div>
                )}

                {/* Botão PDF */}
                {rendTributavel > 0 && (
                  <button
                    onClick={gerarPDF}
                    style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", border: "none", borderRadius: 10, color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
                  >
                    🖨️ Gerar PDF — Simulação IRPF
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              ABA — IRRF MENSAL
          ══════════════════════════════════════ */}
          {aba === "mensal" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Inputs */}
              <div style={card}>
                <div style={secTitle}>📅 Cálculo do IRRF Mensal</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <CampoMoeda label="Salário / rendimento bruto" value={salMensal} onChange={setSalMensal} />
                  <CampoMoeda label="INSS descontado" value={inssMensal} onChange={setInssMensal} hint="Contribuição previdenciária do mês" />
                  <CampoNumero label="Número de dependentes" value={depMensal} onChange={setDepMensal} hint={`R$ ${fmt(DED_DEPENDENTE_MENSAL)} por dependente/mês`} />
                  <CampoMoeda label="Pensão alimentícia paga" value={pensaoMensal} onChange={setPensaoMensal} />
                  <CampoMoeda label="Outras deduções mensais" value={outrasDeducMensal} onChange={setOutrasDeducMensal} />
                </div>
              </div>

              {/* Resultado mensal */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={card}>
                  <div style={secTitle}>📊 Resultado</div>
                  <LinhaR label="Salário bruto" valor={salBruto} />
                  {inssM > 0    && <LinhaR label="(−) INSS" valor={inssM} cor="#22c55e" />}
                  {dedDepM > 0  && <LinhaR label={`(−) Dependentes (${numDepM})`} valor={dedDepM} cor="#22c55e" />}
                  {pensaoM > 0  && <LinhaR label="(−) Pensão alimentícia" valor={pensaoM} cor="#22c55e" />}
                  {outrasM > 0  && <LinhaR label="(−) Outras deduções" valor={outrasM} cor="#22c55e" />}
                  <LinhaR label="Base de cálculo" valor={baseMensal} destaque />

                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>FAIXA</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{aliqMensal}</div>
                    </div>
                    <div style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>ALÍQ. EFETIVA</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{fmt(aliqEfM)}%</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, background: "#ef444418", border: "1px solid #ef444440", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", marginBottom: 4, letterSpacing: "0.06em" }}>IRRF A RETER</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: "#ef4444" }}>R$ {fmt(irMensal)}</div>
                  </div>

                  <div style={{ marginTop: 10, background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#22c55e", marginBottom: 4, letterSpacing: "0.06em" }}>SALÁRIO LÍQUIDO</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: "#22c55e" }}>R$ {fmt(liquidoM)}</div>
                  </div>
                </div>

                {salBruto > 0 && (
                  <button
                    onClick={gerarPDFMensal}
                    style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", border: "none", borderRadius: 10, color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
                  >
                    🖨️ Gerar PDF — IRRF Mensal
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              ABA — TABELAS DE REFERÊNCIA
          ══════════════════════════════════════ */}
          {aba === "tabelas" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* Tabela Mensal */}
              <div style={card}>
                <div style={secTitle}>📅 Tabela Progressiva Mensal 2025</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--muted)", fontWeight: 700, fontSize: 11, borderBottom: "1px solid var(--border)" }}>Base de Cálculo</th>
                      <th style={{ textAlign: "center", padding: "8px 6px", color: "var(--muted)", fontWeight: 700, fontSize: 11, borderBottom: "1px solid var(--border)" }}>Alíquota</th>
                      <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--muted)", fontWeight: 700, fontSize: 11, borderBottom: "1px solid var(--border)" }}>Parcela a Deduzir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Até R$ 2.259,20",               "Isento",  "—"],
                      ["R$ 2.259,21 a R$ 2.826,65",     "7,5%",    "R$ 169,44"],
                      ["R$ 2.826,66 a R$ 3.751,05",     "15%",     "R$ 381,44"],
                      ["R$ 3.751,06 a R$ 4.664,68",     "22,5%",   "R$ 662,77"],
                      ["Acima de R$ 4.664,68",           "27,5%",   "R$ 896,00"],
                    ].map(([faixa, aliq, parcela]) => (
                      <tr key={faixa}>
                        <td style={{ padding: "9px 6px", color: "var(--text)", fontSize: 12, borderBottom: "1px solid var(--border-soft)" }}>{faixa}</td>
                        <td style={{ padding: "9px 6px", textAlign: "center", fontWeight: 700, color: aliq === "Isento" ? "#22c55e" : "var(--primary)", borderBottom: "1px solid var(--border-soft)" }}>{aliq}</td>
                        <td style={{ padding: "9px 6px", textAlign: "right", color: "var(--muted)", borderBottom: "1px solid var(--border-soft)" }}>{parcela}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>Dedução por dependente: <strong>R$ 189,59/mês</strong></p>
              </div>

              {/* Tabela Anual */}
              <div style={card}>
                <div style={secTitle}>📆 Tabela Progressiva Anual 2025</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--muted)", fontWeight: 700, fontSize: 11, borderBottom: "1px solid var(--border)" }}>Base de Cálculo</th>
                      <th style={{ textAlign: "center", padding: "8px 6px", color: "var(--muted)", fontWeight: 700, fontSize: 11, borderBottom: "1px solid var(--border)" }}>Alíquota</th>
                      <th style={{ textAlign: "right", padding: "8px 6px", color: "var(--muted)", fontWeight: 700, fontSize: 11, borderBottom: "1px solid var(--border)" }}>Parcela</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Até R$ 26.963,20",                  "Isento",  "—"],
                      ["R$ 26.963,21 a R$ 33.919,80",       "7,5%",    "R$ 2.022,24"],
                      ["R$ 33.919,81 a R$ 45.012,60",       "15%",     "R$ 4.566,23"],
                      ["R$ 45.012,61 a R$ 55.976,16",       "22,5%",   "R$ 7.942,13"],
                      ["Acima de R$ 55.976,16",              "27,5%",   "R$ 10.740,95"],
                    ].map(([faixa, aliq, parcela]) => (
                      <tr key={faixa}>
                        <td style={{ padding: "9px 6px", color: "var(--text)", fontSize: 12, borderBottom: "1px solid var(--border-soft)" }}>{faixa}</td>
                        <td style={{ padding: "9px 6px", textAlign: "center", fontWeight: 700, color: aliq === "Isento" ? "#22c55e" : "var(--primary)", borderBottom: "1px solid var(--border-soft)" }}>{aliq}</td>
                        <td style={{ padding: "9px 6px", textAlign: "right", color: "var(--muted)", borderBottom: "1px solid var(--border-soft)" }}>{parcela}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>Dedução por dependente: <strong>R$ 2.275,08/ano</strong></p>
              </div>

              {/* Deduções */}
              <div style={card}>
                <div style={secTitle}>🗂️ Deduções — Modelo Completo</div>
                {[
                  ["Dependente",           `R$ ${fmt(DED_DEPENDENTE_ANUAL)}/ano por dependente`],
                  ["INSS",                 "Valor recolhido — sem limite"],
                  ["Pensão alimentícia",   "Valor judicial — sem limite"],
                  ["Saúde e medicina",     "Sem limite (plano, consultas, internações)"],
                  ["Educação",             `Até R$ ${fmt(LIM_EDUCACAO_POR_PESSOA)}/pessoa/ano`],
                  ["PGBL",                 "Até 12% da renda bruta tributável"],
                  ["Livro-caixa",          "Autônomo — despesas necessárias à atividade"],
                ].map(([item, detalhe]) => (
                  <div key={item} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border-soft)", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", flexShrink: 0 }}>{item}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>{detalhe}</span>
                  </div>
                ))}
              </div>

              {/* Desconto Simplificado */}
              <div style={card}>
                <div style={secTitle}>📄 Desconto Simplificado</div>
                <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px", marginBottom: 14 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "var(--primary)" }}>20%</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>da renda tributável (após INSS e pensão)</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border-soft)" }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Teto máximo</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>R$ {fmt(LIM_SIMPLIFICADO)}</span>
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
                  No modelo simplificado <strong>não é necessário</strong> apresentar comprovantes de despesas. É a opção mais prática, mas pode ser menos vantajosa para quem tem muitas deduções legais.
                </div>
                <div style={{ marginTop: 14, background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px", fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
                  <strong style={{ color: "var(--text)" }}>Isenção para ≥ 65 anos:</strong><br/>
                  Aposentados e pensionistas com 65 anos ou mais têm isenção de até <strong style={{ color: "#22c55e" }}>R$ {fmt(ISENCAO_IDOSO)}/ano</strong> sobre rendimentos de aposentadoria ou pensão.
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
