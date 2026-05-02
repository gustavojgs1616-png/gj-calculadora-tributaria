import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import Layout from "../components/Layout";
import CardBloqueado from "../components/CardBloqueado";
import { calcularICMSST, calcularDIFAL, fmt, parseVal } from "../components/calculoST";
import { fmtInput } from "../components/calculos";
import { getAliquotaInterestadual, aliquotasInternas, ESTADOS } from "../components/tabelaAliquotas";
import { TABELA_MVA } from "../components/tabelaMVA";

const MAX_HISTORICO = 50;

// Estados com FCP (Fundo de Combate à Pobreza) — alíquota padrão 2%
const FCP_ESTADOS = { AL: 2, RJ: 2, SE: 2 };

const CAMPO_INFO = {
  ufOrigem: "Estado de onde a mercadoria sai (remetente).",
  ufDestino: "Estado para onde a mercadoria vai (destinatário). Determina a alíquota interna e o MVA.",
  ncm: "Nomenclatura Comum do Mercosul. Digite para filtrar produtos e preencher o MVA automaticamente.",
  valorProduto: "Valor total dos produtos na nota fiscal (sem IPI).",
  frete: "Valor do frete quando incluído na base de cálculo do ICMS.",
  seguro: "Valor do seguro destacado na nota fiscal.",
  outrasDespesas: "Despesas acessórias que integram a base de cálculo.",
  desconto: "Desconto incondicional concedido na nota fiscal.",
  aliquotaIPI: "Alíquota do IPI, caso o produto seja tributado. O IPI não integra a base do ICMS próprio, mas pode compor a base ST.",
  aliquotaInterestadual: "Alíquota interestadual entre os estados de origem e destino. Preenchida automaticamente.",
  aliquotaInterna: "Alíquota do ICMS praticada internamente no estado de destino. Verifique a SEFAZ do estado.",
  mvaOriginal: "Margem de Valor Agregado definida pelo estado de destino para o produto/NCM.",
  usarMVAAjustada: "Ajusta o MVA para compensar a diferença entre a alíquota interestadual e a interna, conforme Convênio ICMS 35/2011.",
  aliqFCP: "Fundo de Combate à Pobreza — AL, RJ e SE cobram 2% sobre a base do ICMS-ST. Preenchido automaticamente ao selecionar o estado de destino.",
};

function Tooltip({ texto }) {
  const [vis, setVis] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        onMouseEnter={() => setVis(true)}
        onMouseLeave={() => setVis(false)}
        onClick={() => setVis(v => !v)}
        style={{
          width: 16, height: 16, borderRadius: "50%", border: "1.5px solid var(--muted)",
          background: "transparent", color: "var(--muted)", fontSize: 10,
          fontWeight: 700, cursor: "help", display: "inline-flex",
          alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0,
        }}
      >?</button>
      {vis && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)", background: "var(--bg-deep)",
          border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px",
          fontSize: 12, color: "var(--text-dim)", width: 220, zIndex: 100,
          lineHeight: 1.5, boxShadow: "0 4px 16px #00000040",
        }}>
          {texto}
        </div>
      )}
    </span>
  );
}

function LabelRow({ label, campo }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <span className="label" style={{ marginBottom: 0 }}>{label}</span>
      {campo && <Tooltip texto={CAMPO_INFO[campo]} />}
    </div>
  );
}

function LinhaResult({ label, valor, destaque, cor, sub }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: sub ? "5px 0" : "8px 0",
      borderBottom: "1px solid var(--border-soft)",
      background: destaque ? "var(--primary-glow)" : "transparent",
      borderRadius: destaque ? 6 : 0,
      padding: destaque ? "10px 12px" : sub ? "5px 0" : "8px 0",
      marginBottom: destaque ? 2 : 0,
    }}>
      <span style={{ fontSize: sub ? 12 : 13, color: cor || (sub ? "var(--muted)" : "var(--text-dim)") }}>
        {label}
      </span>
      <span style={{
        fontSize: destaque ? 16 : sub ? 12 : 14,
        fontWeight: destaque ? 800 : 600,
        color: cor || (destaque ? "var(--green)" : "var(--text)"),
      }}>
        {valor}
      </span>
    </div>
  );
}

function gerarPDFST(dados, resultado) {
  const { ufOrigem, ufDestino, descricaoProduto, ncm, aliquotaInterestadual, aliquotaInterna } = dados;
  const {
    base, IPI, ICMSProprio, mvaOriginal, mvaAjustada, mvaFinal,
    baseST, ICMSSTBruto, ICMSSTRecolher, FCP = 0, aliqFCP = 0, totalNota, cargaTributaria,
  } = resultado;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatório ICMS-ST — GJ Hub Contábil</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; font-size: 12px; color: #1a1a2e; background: #fff; padding: 32px; }
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border-bottom: 2px solid #DF9F20; padding-bottom: 16px; }
  .logo { width: 52px; height: 52px; background: linear-gradient(135deg,#DF9F20,#B27F1A); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 900; color: #fff; font-family: sans-serif; }
  .header-text h1 { font-size: 18px; font-weight: bold; color: #1a1a2e; }
  .header-text p { font-size: 11px; color: #666; margin-top: 2px; }
  h2 { font-size: 13px; font-weight: bold; color: #DF9F20; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f5f5f5; padding: 7px 10px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #ddd; }
  td { padding: 7px 10px; border: 1px solid #ddd; font-size: 12px; }
  td:last-child { text-align: right; font-weight: 600; }
  .destaque td { background: #fff8e6; }
  .total td { background: #e8f5e9; font-weight: bold; font-size: 13px; }
  .formula { background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; font-family: monospace; font-size: 11px; line-height: 1.8; color: #333; }
  .footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px; font-size: 10px; color: #888; line-height: 1.6; }
  .badge { display: inline-block; background: #DF9F2020; color: #B27F1A; border: 1px solid #DF9F20; border-radius: 12px; padding: 2px 10px; font-size: 10px; font-weight: bold; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo">G</div>
  <div class="header-text">
    <h1>Relatório de Cálculo ICMS-ST</h1>
    <p>GJ Hub Contábil &nbsp;|&nbsp; Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</div>

<h2>Dados da Operação</h2>
<table>
  <tr><th>Campo</th><th>Valor</th></tr>
  <tr><td>UF Origem</td><td>${ufOrigem || '—'}</td></tr>
  <tr><td>UF Destino</td><td>${ufDestino || '—'}</td></tr>
  <tr><td>Produto</td><td>${descricaoProduto || '—'}</td></tr>
  <tr><td>NCM</td><td>${ncm || '—'}</td></tr>
  <tr><td>Alíquota Interestadual</td><td>${aliquotaInterestadual}%</td></tr>
  <tr><td>Alíquota Interna (${ufDestino})</td><td>${aliquotaInterna}%</td></tr>
</table>

<h2>Composição da Base de Cálculo</h2>
<table>
  <tr><th>Componente</th><th>Valor</th></tr>
  <tr><td>Valor do Produto</td><td>R$ ${fmt(parseVal(dados.valorProduto))}</td></tr>
  <tr><td>(+) Frete</td><td>R$ ${fmt(parseVal(dados.frete))}</td></tr>
  <tr><td>(+) Seguro</td><td>R$ ${fmt(parseVal(dados.seguro))}</td></tr>
  <tr><td>(+) Outras Despesas</td><td>R$ ${fmt(parseVal(dados.outrasDespesas))}</td></tr>
  <tr><td>(-) Desconto</td><td>R$ ${fmt(parseVal(dados.desconto))}</td></tr>
  <tr class="total"><td>(=) Base de Cálculo ICMS</td><td>R$ ${fmt(base)}</td></tr>
</table>

<h2>Passo a Passo do Cálculo</h2>
<div class="formula">
<strong>1. ICMS Próprio</strong><br/>
Base × Alíquota Interestadual = R$ ${fmt(base)} × ${aliquotaInterestadual}% = <strong>R$ ${fmt(ICMSProprio)}</strong><br/><br/>
<strong>2. MVA Ajustada</strong><br/>
[(1 + ${mvaOriginal}%/100) × (1 − ${aliquotaInterestadual}%/100) / (1 − ${aliquotaInterna}%/100) − 1] × 100 = <strong>${fmt(mvaAjustada ?? mvaOriginal)}%</strong><br/><br/>
<strong>3. Base de Cálculo ST</strong><br/>
R$ ${fmt(base)} × (1 + ${fmt(mvaFinal)}%/100) = <strong>R$ ${fmt(baseST)}</strong><br/><br/>
<strong>4. ICMS ST a Recolher</strong><br/>
(Base ST × Alíq. Interna) − ICMS Próprio = (R$ ${fmt(baseST)} × ${aliquotaInterna}%) − R$ ${fmt(ICMSProprio)} = <strong>R$ ${fmt(ICMSSTRecolher)}</strong>${FCP > 0 ? `<br/><br/>
<strong>5. FCP — Fundo de Combate à Pobreza (${ufDestino})</strong><br/>
Base ST × Alíq. FCP = R$ ${fmt(baseST)} × ${aliqFCP}% = <strong>R$ ${fmt(FCP)}</strong>` : ""}
</div>

<h2>Resultado Final</h2>
<table>
  <tr><th>Item</th><th>Valor</th></tr>
  <tr><td>Base de Cálculo ST</td><td>R$ ${fmt(baseST)}</td></tr>
  <tr><td>MVA Original</td><td>${fmt(mvaOriginal)}%</td></tr>
  <tr class="destaque"><td>MVA Ajustada</td><td>${fmt(mvaAjustada ?? mvaOriginal)}%</td></tr>
  <tr><td>ICMS ST Bruto</td><td>R$ ${fmt(ICMSSTBruto)}</td></tr>
  <tr><td>(−) ICMS Próprio</td><td>R$ ${fmt(ICMSProprio)}</td></tr>
  <tr class="destaque"><td>ICMS ST a Recolher</td><td>R$ ${fmt(ICMSSTRecolher)}</td></tr>
  ${FCP > 0 ? `<tr style="background:#fff8e6;"><td>FCP — Fundo de Combate à Pobreza (${ufDestino} ${aliqFCP}%)</td><td>R$ ${fmt(FCP)}</td></tr>` : ""}
  <tr><td>IPI</td><td>R$ ${fmt(IPI)}</td></tr>
  <tr class="total"><td>Total da Nota</td><td>R$ ${fmt(totalNota)}</td></tr>
  <tr><td>Carga Tributária Total (ICMS Próprio + ST${FCP > 0 ? " + FCP" : ""})</td><td>${fmt(cargaTributaria)}%</td></tr>
</table>

<div class="footer">
  ⚠️ <strong>Atenção:</strong> Simulação estimada. Os valores de MVA e alíquotas podem variar conforme legislação estadual vigente. Confirme os valores com a SEFAZ do estado destinatário e verifique a existência de protocolo/convênio ICMS entre os estados.<br/>
  Alíquotas internas utilizadas são referências médias — confirme a alíquota vigente para o produto específico.<br/><br/>
  GJ Hub Contábil &mdash; GJ Treinamentos Contábeis &copy; ${new Date().getFullYear()}
</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 600);
}

export default function IcmsstPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { assinatura, carregando, pode } = useAssinatura();

  const [form, setForm] = useState({
    ufOrigem: "SP",
    ufDestino: "MG",
    ncm: "",
    descricaoProduto: "",
    valorProduto: "",
    frete: "",
    seguro: "",
    outrasDespesas: "",
    desconto: "",
    aliquotaIPI: "0",
    aliquotaInterestadual: "12",
    aliquotaInterna: "18",
    mvaOriginal: "",
    usarMVAAjustada: true,
    aliqFCP: "0",
  });

  const [busca, setBusca] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("form");

  // ── DIFAL state ──────────────────────────────────────────────────────────────
  const [modoPrincipal, setModoPrincipal] = useState("st"); // "st" | "difal" | "historico"
  const [formDifal, setFormDifal] = useState({
    ufOrigem: "SP", ufDestino: "MG",
    tipoDifal: "b2c",
    valorProduto: "", frete: "", seguro: "", outrasDespesas: "", desconto: "",
    aliquotaIPI: "0",
    aliquotaInterestadual: "12", aliquotaInterna: "18",
    aliqFCP: "0",
  });
  const [resultadoDifal, setResultadoDifal] = useState(null);
  const [historicoDifal, setHistoricoDifal] = useState([]);
  const [abaDifal, setAbaDifal] = useState("form");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setUser(session.user);
    });
  }, [router]);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem("gj-icmsst-historico") || "[]");
      setHistorico(h);
    } catch { setHistorico([]); }
    try {
      const hd = JSON.parse(localStorage.getItem("gj-difal-historico") || "[]");
      setHistoricoDifal(hd);
    } catch { setHistoricoDifal([]); }
  }, []);

  useEffect(() => {
    const ai = getAliquotaInterestadual(form.ufOrigem, form.ufDestino);
    const aliqInterna = aliquotasInternas[form.ufDestino] || 18;
    const fcp = FCP_ESTADOS[form.ufDestino] ?? 0;
    setForm(f => ({
      ...f,
      aliquotaInterestadual: String(ai),
      aliquotaInterna: String(aliqInterna),
      aliqFCP: String(fcp),
    }));
  }, [form.ufOrigem, form.ufDestino]);

  // Auto-fill alíquotas DIFAL ao mudar estados
  useEffect(() => {
    const ai = getAliquotaInterestadual(formDifal.ufOrigem, formDifal.ufDestino);
    const aliqInterna = aliquotasInternas[formDifal.ufDestino] || 18;
    const fcp = FCP_ESTADOS[formDifal.ufDestino] ?? 0;
    setFormDifal(f => ({
      ...f,
      aliquotaInterestadual: String(ai),
      aliquotaInterna: String(aliqInterna),
      aliqFCP: String(fcp),
    }));
  }, [formDifal.ufOrigem, formDifal.ufDestino]);

  const handleBuscaNCM = (texto) => {
    setBusca(texto);
    if (!texto || texto.length < 2) { setSugestoes([]); return; }
    const t = texto.toLowerCase();
    setSugestoes(
      TABELA_MVA.filter(p =>
        p.ncm.includes(t) || p.descricao.toLowerCase().includes(t)
      ).slice(0, 8)
    );
  };

  const selecionarProduto = (produto) => {
    setBusca(produto.descricao);
    setSugestoes([]);
    setForm(f => ({
      ...f,
      ncm: produto.ncm === "0000" ? "" : produto.ncm,
      descricaoProduto: produto.ncm === "0000" ? "" : produto.descricao,
      mvaOriginal: produto.mva !== null ? String(produto.mva) : "",
    }));
  };

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));
  const setCheck = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.checked }));

  const calcular = () => {
    const dados = {
      valorProduto: parseVal(form.valorProduto),
      frete: parseVal(form.frete),
      seguro: parseVal(form.seguro),
      outrasDespesas: parseVal(form.outrasDespesas),
      desconto: parseVal(form.desconto),
      aliquotaIPI: parseVal(form.aliquotaIPI),
      aliquotaInterestadual: parseVal(form.aliquotaInterestadual),
      aliquotaInterna: parseVal(form.aliquotaInterna),
      mvaOriginal: parseVal(form.mvaOriginal),
      usarMVAAjustada: form.usarMVAAjustada,
      aliqFCP: parseVal(form.aliqFCP),
    };
    const res = calcularICMSST(dados);
    setResultado(res);
    setAbaAtiva("resultado");

    const entrada = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-BR"),
      ufOrigem: form.ufOrigem,
      ufDestino: form.ufDestino,
      descricaoProduto: form.descricaoProduto || form.ncm || "Produto",
      ICMSSTRecolher: res.ICMSSTRecolher,
      totalNota: res.totalNota,
      form: { ...form },
      resultado: res,
    };
    const novo = [entrada, ...historico].slice(0, MAX_HISTORICO);
    setHistorico(novo);
    localStorage.setItem("gj-icmsst-historico", JSON.stringify(novo));
  };

  const limpar = () => {
    setForm({
      ufOrigem: "SP", ufDestino: "MG", ncm: "", descricaoProduto: "",
      valorProduto: "", frete: "", seguro: "", outrasDespesas: "",
      desconto: "", aliquotaIPI: "0",
      aliquotaInterestadual: "12", aliquotaInterna: "18",
      mvaOriginal: "", usarMVAAjustada: true,
      aliqFCP: "0",
    });
    setBusca("");
    setResultado(null);
    setAbaAtiva("form");
  };

  const carregarHistorico = (item) => {
    setForm(item.form);
    setBusca(item.form.descricaoProduto);
    setResultado(item.resultado);
    setAbaAtiva("resultado");
  };

  const deletarItem = (id) => {
    const novo = historico.filter(h => h.id !== id);
    setHistorico(novo);
    localStorage.setItem("gj-icmsst-historico", JSON.stringify(novo));
  };

  const limparHistorico = () => {
    if (!window.confirm("Deseja apagar todo o histórico de simulações?")) return;
    setHistorico([]);
    localStorage.removeItem("gj-icmsst-historico");
  };

  // ── Handlers DIFAL ──────────────────────────────────────────────────────────
  const setDifal      = (campo) => (e) => setFormDifal(f => ({ ...f, [campo]: e.target.value }));
  const setDifalMask  = (campo) => (e) => setFormDifal(f => ({ ...f, [campo]: fmtInput(e.target.value) }));

  const calcularDifalFn = () => {
    const dados = {
      valorProduto: parseVal(formDifal.valorProduto),
      frete: parseVal(formDifal.frete),
      seguro: parseVal(formDifal.seguro),
      outrasDespesas: parseVal(formDifal.outrasDespesas),
      desconto: parseVal(formDifal.desconto),
      aliquotaIPI: parseVal(formDifal.aliquotaIPI),
      aliquotaInterestadual: parseVal(formDifal.aliquotaInterestadual),
      aliquotaInterna: parseVal(formDifal.aliquotaInterna),
      aliqFCP: parseVal(formDifal.aliqFCP),
      tipoDifal: formDifal.tipoDifal,
    };
    const res = calcularDIFAL(dados);
    setResultadoDifal(res);
    setAbaDifal("resultado");

    const entrada = {
      id: Date.now(),
      tipo: "difal",
      data: new Date().toLocaleDateString("pt-BR"),
      ufOrigem: formDifal.ufOrigem,
      ufDestino: formDifal.ufDestino,
      tipoDifal: formDifal.tipoDifal,
      totalDifal: res.totalDifal,
      form: { ...formDifal },
      resultado: res,
    };
    const novo = [entrada, ...historicoDifal].slice(0, MAX_HISTORICO);
    setHistoricoDifal(novo);
    localStorage.setItem("gj-difal-historico", JSON.stringify(novo));
  };

  const limparDifal = () => {
    setFormDifal({
      ufOrigem: "SP", ufDestino: "MG", tipoDifal: "b2c",
      valorProduto: "", frete: "", seguro: "", outrasDespesas: "", desconto: "",
      aliquotaIPI: "0", aliquotaInterestadual: "12", aliquotaInterna: "18", aliqFCP: "0",
    });
    setResultadoDifal(null);
    setAbaDifal("form");
  };

  const deletarItemDifal = (id) => {
    const novo = historicoDifal.filter(h => h.id !== id);
    setHistoricoDifal(novo);
    localStorage.setItem("gj-difal-historico", JSON.stringify(novo));
  };

  const limparHistoricoDifal = () => {
    if (!window.confirm("Deseja apagar todo o histórico de DIFAL?")) return;
    setHistoricoDifal([]);
    localStorage.removeItem("gj-difal-historico");
  };

  const gerarPDFDIFALFn = (fdados, res) => {
    const { ufOrigem, ufDestino, tipoDifal } = fdados;
    const { base, IPI, baseDifal, diferencialAliq, DIFAL, FCP, aliqFCP, totalDifal, cargaTributaria, aliquotaInterestadual, aliquotaInterna } = res;
    const tipoLabel = tipoDifal === "b2c" ? "Venda a Consumidor Final (EC 87/2015 / LC 190/2022)" : "Compra para Uso Próprio / Ativo Imobilizado";

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Relatório DIFAL — GJ Hub Contábil</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; font-size: 12px; color: #1a1a2e; background: #fff; padding: 32px; }
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; border-bottom: 2px solid #DF9F20; padding-bottom: 16px; }
  .logo { width: 52px; height: 52px; background: linear-gradient(135deg,#DF9F20,#B27F1A); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 900; color: #fff; font-family: sans-serif; }
  .header-text h1 { font-size: 18px; font-weight: bold; }
  .header-text p { font-size: 11px; color: #666; margin-top: 2px; }
  h2 { font-size: 13px; font-weight: bold; color: #DF9F20; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f5f5f5; padding: 7px 10px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #ddd; }
  td { padding: 7px 10px; border: 1px solid #ddd; font-size: 12px; }
  td:last-child { text-align: right; font-weight: 600; }
  .destaque td { background: #fff8e6; }
  .total td { background: #e8f5e9; font-weight: bold; font-size: 13px; }
  .formula { background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; font-family: monospace; font-size: 11px; line-height: 1.8; }
  .footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px; font-size: 10px; color: #888; line-height: 1.6; }
  @media print { body { padding: 16px; } }
</style></head><body>
<div class="header">
  <div class="logo">G</div>
  <div class="header-text">
    <h1>Relatório de Cálculo DIFAL</h1>
    <p>GJ Hub Contábil &nbsp;|&nbsp; Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</div>

<h2>Dados da Operação</h2>
<table>
  <tr><th>Campo</th><th>Valor</th></tr>
  <tr><td>UF Origem</td><td>${ufOrigem}</td></tr>
  <tr><td>UF Destino</td><td>${ufDestino}</td></tr>
  <tr><td>Tipo de Operação</td><td>${tipoLabel}</td></tr>
  <tr><td>Alíquota Interestadual</td><td>${aliquotaInterestadual}%</td></tr>
  <tr><td>Alíquota Interna (${ufDestino})</td><td>${aliquotaInterna}%</td></tr>
  <tr><td>Diferencial de Alíquota</td><td>${fmt(diferencialAliq)}%</td></tr>
  ${aliqFCP > 0 ? `<tr><td>FCP (${ufDestino})</td><td>${aliqFCP}%</td></tr>` : ""}
</table>

<h2>Base de Cálculo</h2>
<table>
  <tr><th>Componente</th><th>Valor</th></tr>
  <tr><td>Valor do Produto</td><td>R$ ${fmt(parseVal(fdados.valorProduto))}</td></tr>
  ${parseVal(fdados.frete) > 0 ? `<tr><td>(+) Frete</td><td>R$ ${fmt(parseVal(fdados.frete))}</td></tr>` : ""}
  ${IPI > 0 ? `<tr><td>(+) IPI (${fdados.aliquotaIPI}% — integra base B2C)</td><td>R$ ${fmt(IPI)}</td></tr>` : ""}
  <tr class="total"><td>(=) Base DIFAL</td><td>R$ ${fmt(baseDifal)}</td></tr>
</table>

<h2>Passo a Passo do Cálculo</h2>
<div class="formula">
<strong>1. Diferencial de Alíquota</strong><br/>
Alíq. Interna (${aliquotaInterna}%) − Alíq. Interestadual (${aliquotaInterestadual}%) = <strong>${fmt(diferencialAliq)}%</strong><br/><br/>
<strong>2. DIFAL a Recolher</strong><br/>
Base DIFAL × Diferencial = R$ ${fmt(baseDifal)} × ${fmt(diferencialAliq)}% = <strong>R$ ${fmt(DIFAL)}</strong>${FCP > 0 ? `<br/><br/>
<strong>3. FCP — Fundo de Combate à Pobreza</strong><br/>
Base DIFAL × FCP = R$ ${fmt(baseDifal)} × ${aliqFCP}% = <strong>R$ ${fmt(FCP)}</strong>` : ""}
</div>

<h2>Resultado Final</h2>
<table>
  <tr><th>Item</th><th>Valor</th></tr>
  <tr><td>Base de Cálculo</td><td>R$ ${fmt(base)}</td></tr>
  <tr><td>Base DIFAL (com IPI se B2C)</td><td>R$ ${fmt(baseDifal)}</td></tr>
  <tr class="destaque"><td>DIFAL (${fmt(diferencialAliq)}%)</td><td>R$ ${fmt(DIFAL)}</td></tr>
  ${FCP > 0 ? `<tr class="destaque"><td>FCP ${ufDestino} (${aliqFCP}%)</td><td>R$ ${fmt(FCP)}</td></tr>` : ""}
  <tr class="total"><td>Total DIFAL a Recolher</td><td>R$ ${fmt(totalDifal)}</td></tr>
  <tr><td>Carga Tributária</td><td>${fmt(cargaTributaria)}%</td></tr>
</table>

<div class="footer">
  ⚠️ <strong>Atenção:</strong> Simulação estimada. O DIFAL B2C está regulamentado pela LC 190/2022 (vigência a partir de jan/2023 na maioria dos estados). Verifique a legislação do estado destinatário e a existência de convênio/protocolo ST — se houver ST, o DIFAL não é cobrado separadamente.<br/>
  GJ Hub Contábil &mdash; GJ Treinamentos Contábeis &copy; ${new Date().getFullYear()}
</div>
</body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  if (!user || carregando) return null;

  if (!pode("icmsst")) {
    return (
      <Layout user={user}>
        <CardBloqueado ferramenta="icmsst" planoNecessario="profissional" />
      </Layout>
    );
  }

  const inputStyle = {
    background: "var(--bg-input)", border: "1.5px solid var(--border)",
    borderRadius: 8, color: "var(--text)", fontFamily: "Saira, sans-serif",
    fontSize: 15, padding: "10px 12px", width: "100%", outline: "none",
  };

  const secaoStyle = {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px", marginBottom: 16,
  };

  return (
    <>
      <Head>
        <title>ICMS Interestadual — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout user={user}>
        <div style={{ padding: "28px 24px", maxWidth: 1100, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>
              ICMS Interestadual
            </h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Calcule ICMS-ST e DIFAL em operações interestaduais com MVA ajustada e gere relatório em PDF
            </p>
          </div>

          {/* Navegação principal */}
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 24, overflowX: "auto" }}>
            {[
              { id: "st",       label: "⚖️ ICMS-ST" },
              { id: "difal",    label: "📐 DIFAL" },
              { id: "historico", label: `📋 Histórico (${historico.length + historicoDifal.length})` },
            ].map(aba => {
              const ativo = modoPrincipal === aba.id;
              return (
                <button key={aba.id} onClick={() => setModoPrincipal(aba.id)} style={{
                  padding: "10px 18px", background: "none", border: "none",
                  borderBottom: ativo ? "2px solid var(--primary)" : "2px solid transparent",
                  color: ativo ? "var(--primary)" : "var(--muted)",
                  fontWeight: ativo ? 700 : 500,
                  fontSize: 13, cursor: "pointer", marginBottom: -1,
                  transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
                }}>{aba.label}</button>
              );
            })}
          </div>

          {/* Sub-abas ST — visíveis apenas no modo ST */}
          {modoPrincipal === "st" && (
            <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }}>
              {[
                { id: "form",      label: "Calcular" },
                { id: "resultado", label: "Resultado" },
              ].map(aba => {
                const ativo = abaAtiva === aba.id;
                return (
                  <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} style={{
                    padding: "6px 14px", background: ativo ? "var(--primary-glow)" : "var(--bg-input)",
                    border: `1px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: 20, color: ativo ? "var(--primary)" : "var(--muted)",
                    fontWeight: ativo ? 700 : 500, fontSize: 12, cursor: "pointer",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>{aba.label}</button>
                );
              })}
            </div>
          )}

          {/* Sub-abas DIFAL */}
          {modoPrincipal === "difal" && (
            <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }}>
              {[
                { id: "form",      label: "Calcular" },
                { id: "resultado", label: "Resultado" },
              ].map(aba => {
                const ativo = abaDifal === aba.id;
                return (
                  <button key={aba.id} onClick={() => setAbaDifal(aba.id)} style={{
                    padding: "6px 14px", background: ativo ? "#3b82f620" : "var(--bg-input)",
                    border: `1px solid ${ativo ? "#3b82f6" : "var(--border)"}`,
                    borderRadius: 20, color: ativo ? "#3b82f6" : "var(--muted)",
                    fontWeight: ativo ? 700 : 500, fontSize: 12, cursor: "pointer",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>{aba.label}</button>
                );
              })}
            </div>
          )}

          {/* ═══ MODO ST ═══════════════════════════════════════════════════════ */}
          <div style={{ display: modoPrincipal === "st" ? "flex" : "none", gap: 20, alignItems: "flex-start" }}>

            {/* ── Formulário ST ── */}
            <div style={{ flex: "0 0 420px", display: abaAtiva === "form" || abaAtiva === "resultado" ? "block" : "none" }} className="painel-form">
              <div style={{ display: abaAtiva === "historico" ? "none" : "block" }}>

              {/* Seção 1 — Operação */}
              <div style={secaoStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                  Identificação da Operação
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <LabelRow label="UF Origem" campo="ufOrigem" />
                    <select style={inputStyle} value={form.ufOrigem} onChange={set("ufOrigem")}>
                      {ESTADOS.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <LabelRow label="UF Destino" campo="ufDestino" />
                    <select style={inputStyle} value={form.ufDestino} onChange={set("ufDestino")}>
                      {ESTADOS.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ position: "relative", marginBottom: 0 }}>
                  <LabelRow label="Produto / NCM" campo="ncm" />
                  <input
                    style={inputStyle}
                    placeholder="Digite o produto ou NCM para buscar..."
                    value={busca}
                    onChange={e => handleBuscaNCM(e.target.value)}
                  />
                  {sugestoes.length > 0 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0,
                      background: "var(--bg-deep)", border: "1px solid var(--border)",
                      borderRadius: 8, zIndex: 50, maxHeight: 220, overflowY: "auto",
                      boxShadow: "0 8px 24px #00000040",
                    }}>
                      {sugestoes.map(p => (
                        <div key={p.ncm} onClick={() => selecionarProduto(p)} style={{
                          padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border-soft)",
                          fontSize: 13,
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <span style={{ color: "var(--primary)", fontWeight: 700, marginRight: 8 }}>{p.ncm}</span>
                          <span style={{ color: "var(--text)" }}>{p.descricao}</span>
                          <span style={{ float: "right", color: "var(--muted)", fontSize: 11 }}>{p.segmento}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {form.ncm && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                    NCM: <strong>{form.ncm}</strong> — {form.descricaoProduto}
                  </div>
                )}
              </div>

              {/* Seção 2 — Valores */}
              <div style={secaoStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                  Valores da Operação
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { campo: "valorProduto", label: "Valor do Produto (R$)" },
                    { campo: "frete", label: "Frete (R$)" },
                    { campo: "seguro", label: "Seguro (R$)" },
                    { campo: "outrasDespesas", label: "Outras Despesas (R$)" },
                    { campo: "desconto", label: "Desconto (R$)" },
                    { campo: "aliquotaIPI", label: "Alíquota IPI (%)" },
                  ].map(({ campo, label }) => (
                    <div key={campo}>
                      <LabelRow label={label} campo={campo} />
                      <input
                        style={inputStyle}
                        placeholder={campo === "aliquotaIPI" ? "0" : "0,00"}
                        value={form[campo]}
                        onChange={set(campo)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção 3 — Alíquotas */}
              <div style={secaoStyle}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                  Alíquotas e MVA
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <LabelRow label="Al. Interestadual (%)" campo="aliquotaInterestadual" />
                    <input style={inputStyle} value={form.aliquotaInterestadual} onChange={set("aliquotaInterestadual")} />
                  </div>
                  <div>
                    <LabelRow label={`Al. Interna ${form.ufDestino} (%)`} campo="aliquotaInterna" />
                    <input style={inputStyle} value={form.aliquotaInterna} onChange={set("aliquotaInterna")} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <LabelRow label="MVA Original (%)" campo="mvaOriginal" />
                    <input
                      style={inputStyle}
                      placeholder={form.ncm ? "Preenchido automaticamente" : "Ex: 42"}
                      value={form.mvaOriginal}
                      onChange={set("mvaOriginal")}
                    />
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-dim)" }}>
                  <input
                    type="checkbox"
                    checked={form.usarMVAAjustada}
                    onChange={setCheck("usarMVAAjustada")}
                    style={{ width: "auto", accentColor: "var(--primary)" }}
                  />
                  Usar MVA Ajustada (Convênio ICMS 35/2011)
                  <Tooltip texto={CAMPO_INFO.usarMVAAjustada} />
                </label>

                {/* FCP — Fundo de Combate à Pobreza */}
                <div style={{
                  marginTop: 16,
                  background: FCP_ESTADOS[form.ufDestino] ? "#2d1a00" : "var(--bg-input)",
                  border: `1.5px solid ${FCP_ESTADOS[form.ufDestino] ? "var(--amber)" : "var(--border)"}`,
                  borderRadius: 10, padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 14 }}>🏦</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: FCP_ESTADOS[form.ufDestino] ? "var(--amber)" : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      FCP — Fundo de Combate à Pobreza
                    </span>
                    <Tooltip texto={CAMPO_INFO.aliqFCP} />
                    {FCP_ESTADOS[form.ufDestino] ? (
                      <span style={{ fontSize: 10, fontWeight: 700, background: "var(--amber)", color: "#000", padding: "2px 7px", borderRadius: 10, marginLeft: "auto" }}>
                        {form.ufDestino} — obrigatório
                      </span>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <input
                        style={{ ...inputStyle, borderColor: FCP_ESTADOS[form.ufDestino] ? "var(--amber)" : "var(--border)" }}
                        placeholder="0"
                        value={form.aliqFCP}
                        onChange={set("aliqFCP")}
                      />
                    </div>
                    <span style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>%</span>
                  </div>
                  <div style={{ fontSize: 11, color: FCP_ESTADOS[form.ufDestino] ? "#fcd34d" : "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
                    {FCP_ESTADOS[form.ufDestino]
                      ? `${form.ufDestino} aplica FCP de ${FCP_ESTADOS[form.ufDestino]}% sobre a base do ICMS-ST. Preenchido automaticamente.`
                      : "AL, RJ e SE cobram 2% de FCP. Para outros estados, verifique a legislação estadual do produto."}
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn-primary"
                  onClick={calcular}
                  disabled={!form.valorProduto || !form.mvaOriginal}
                  style={{ flex: 1, opacity: (!form.valorProduto || !form.mvaOriginal) ? 0.5 : 1 }}
                >
                  Calcular ICMS-ST
                </button>
                <button className="btn-ghost" onClick={limpar} style={{ padding: "12px 16px" }}>
                  Limpar
                </button>
              </div>
              </div>
            </div>

            {/* ── Resultado ── */}
            <div style={{ flex: 1, display: abaAtiva === "resultado" || (abaAtiva === "form" && resultado) ? "block" : "none" }} className="painel-resultado">
              {resultado ? (
                <div>
                  {/* Card resumo */}
                  <div style={{ ...secaoStyle, borderLeft: "4px solid var(--primary)", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Resumo da Operação</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                      {form.ufOrigem} → {form.ufDestino}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      {form.descricaoProduto || "Produto informado"}{form.ncm ? ` — NCM ${form.ncm}` : ""}
                    </div>
                  </div>

                  {/* Composição BC */}
                  <div style={secaoStyle}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Base de Cálculo</div>
                    <LinhaResult label="Valor do Produto" valor={`R$ ${fmt(parseVal(form.valorProduto))}`} sub />
                    <LinhaResult label="(+) Frete" valor={`R$ ${fmt(parseVal(form.frete))}`} sub />
                    <LinhaResult label="(+) Seguro" valor={`R$ ${fmt(parseVal(form.seguro))}`} sub />
                    <LinhaResult label="(+) Outras Despesas" valor={`R$ ${fmt(parseVal(form.outrasDespesas))}`} sub />
                    <LinhaResult label="(−) Desconto" valor={`R$ ${fmt(parseVal(form.desconto))}`} sub />
                    <LinhaResult label="(=) Base de Cálculo ICMS" valor={`R$ ${fmt(resultado.base)}`} />
                  </div>

                  {/* ICMS Próprio */}
                  <div style={secaoStyle}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>ICMS Próprio</div>
                    <LinhaResult label="Alíquota Interestadual" valor={`${form.aliquotaInterestadual}%`} sub />
                    <LinhaResult label="ICMS Próprio" valor={`R$ ${fmt(resultado.ICMSProprio)}`} />
                  </div>

                  {/* ST */}
                  <div style={{ ...secaoStyle, borderLeft: "4px solid var(--primary)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                      Substituição Tributária — ICMS-ST
                    </div>
                    <LinhaResult label="MVA Original" valor={`${fmt(resultado.mvaOriginal)}%`} sub />
                    {resultado.mvaAjustada !== null && (
                      <LinhaResult label="MVA Ajustada (Convênio 35/2011)" valor={`${fmt(resultado.mvaAjustada)}%`} sub cor="var(--primary)" />
                    )}
                    <LinhaResult label="Base de Cálculo ST" valor={`R$ ${fmt(resultado.baseST)}`} />
                    <LinhaResult label={`Alíquota Interna (${form.ufDestino})`} valor={`${form.aliquotaInterna}%`} sub />
                    <LinhaResult label="ICMS ST Bruto" valor={`R$ ${fmt(resultado.ICMSSTBruto)}`} sub />
                    <LinhaResult label="(−) ICMS Próprio" valor={`R$ ${fmt(resultado.ICMSProprio)}`} sub />
                    <LinhaResult label="(=) ICMS ST a Recolher" valor={`R$ ${fmt(resultado.ICMSSTRecolher)}`} destaque />

                    {/* FCP — exibido quando presente */}
                    {resultado.FCP > 0 && (
                      <div style={{
                        marginTop: 14,
                        background: "#2d1a00",
                        border: "1.5px solid var(--amber)",
                        borderRadius: 10, padding: "12px 14px",
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                          🏦 FCP — Fundo de Combate à Pobreza ({form.ufDestino})
                        </div>
                        <LinhaResult label={`Base FCP (= Base ST)`} valor={`R$ ${fmt(resultado.baseST)}`} sub />
                        <LinhaResult label={`Alíquota FCP`} valor={`${fmt(resultado.aliqFCP)}%`} sub />
                        <div style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 10px", marginTop: 6,
                          background: "var(--amber)", borderRadius: 8,
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>FCP a Recolher</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: "#000" }}>R$ {fmt(resultado.FCP)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Totais */}
                  <div style={secaoStyle}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Resumo Final</div>
                    <LinhaResult label="Base de Cálculo" valor={`R$ ${fmt(resultado.base)}`} sub />
                    <LinhaResult label="(+) IPI" valor={`R$ ${fmt(resultado.IPI)}`} sub />
                    <LinhaResult label="(+) ICMS ST a Recolher" valor={`R$ ${fmt(resultado.ICMSSTRecolher)}`} sub />
                    {resultado.FCP > 0 && (
                      <LinhaResult label={`(+) FCP ${form.ufDestino} (${fmt(resultado.aliqFCP)}%)`} valor={`R$ ${fmt(resultado.FCP)}`} sub cor="var(--amber)" />
                    )}
                    <LinhaResult label="(=) Total da Nota" valor={`R$ ${fmt(resultado.totalNota)}`} />
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--bg-input)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Carga Tributária Total</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "var(--amber)" }}>{fmt(resultado.cargaTributaria)}%</span>
                    </div>
                    {resultado.FCP > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)", background: "#2d1a00", border: "1px solid var(--amber)30", borderRadius: 7, padding: "7px 10px" }}>
                        ⚠️ Carga tributária inclui FCP de R$ {fmt(resultado.FCP)} ({fmt(resultado.aliqFCP)}% s/ base ST)
                      </div>
                    )}
                  </div>

                  {/* Alertas */}
                  <div style={{ ...secaoStyle, background: "var(--bg-input)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Alertas</div>
                    {[
                      "Confirme o MVA com a legislação específica do estado destinatário.",
                      "Verifique se há protocolo/convênio ICMS entre os estados.",
                      "Alíquota interna utilizada como referência — confirme a vigente para o produto.",
                    ].map((a, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "var(--muted)" }}>
                        <span>⚠️</span><span>{a}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => gerarPDFST({ ...form, aliquotaInterestadual: parseVal(form.aliquotaInterestadual), aliquotaInterna: parseVal(form.aliquotaInterna) }, resultado)}
                    style={{ width: "100%" }}
                  >
                    📄 Exportar Relatório PDF
                  </button>
                </div>
              ) : (
                <div style={{ ...secaoStyle, textAlign: "center", padding: "60px 24px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔁</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Preencha o formulário e clique em Calcular</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>O resultado aparecerá aqui em tempo real</div>
                </div>
              )}
            </div>

          </div>{/* fim modo ST */}

          {/* ═══ MODO DIFAL ════════════════════════════════════════════════════ */}
          {modoPrincipal === "difal" && (
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

              {/* ── Formulário DIFAL ── */}
              <div style={{ flex: "0 0 420px", display: abaDifal === "form" || abaDifal === "resultado" ? "block" : "none" }} className="painel-form">
                <div style={{ display: abaDifal === "historico" ? "none" : "block" }}>

                  {/* Identificação */}
                  <div style={secaoStyle}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                      Identificação da Operação
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      <div>
                        <LabelRow label="UF Origem" campo="ufOrigem" />
                        <select style={inputStyle} value={formDifal.ufOrigem} onChange={setDifal("ufOrigem")}>
                          {ESTADOS.map(e => <option key={e}>{e}</option>)}
                        </select>
                      </div>
                      <div>
                        <LabelRow label="UF Destino" campo="ufDestino" />
                        <select style={inputStyle} value={formDifal.ufDestino} onChange={setDifal("ufDestino")}>
                          {ESTADOS.map(e => <option key={e}>{e}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Tipo de operação */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Tipo de Operação</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { id: "b2c", label: "🛒 Venda a Consumidor Final", desc: "EC 87/2015 / LC 190/2022 — remetente recolhe para o estado destino" },
                        { id: "uso", label: "🏭 Uso Próprio / Ativo Imobilizado", desc: "Compra interestadual para uso — destinatário recolhe para seu estado" },
                      ].map(op => (
                        <label key={op.id} style={{
                          display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                          padding: "10px 12px", borderRadius: 9,
                          background: formDifal.tipoDifal === op.id ? "#3b82f618" : "var(--bg-input)",
                          border: `1.5px solid ${formDifal.tipoDifal === op.id ? "#3b82f6" : "var(--border)"}`,
                        }}>
                          <input type="radio" name="tipoDifal" value={op.id}
                            checked={formDifal.tipoDifal === op.id}
                            onChange={setDifal("tipoDifal")}
                            style={{ marginTop: 2, accentColor: "#3b82f6" }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: formDifal.tipoDifal === op.id ? "#3b82f6" : "var(--text)" }}>{op.label}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{op.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Valores */}
                  <div style={secaoStyle}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                      Valores da Operação
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { campo: "valorProduto",  label: "Valor do Produto (R$)", moeda: true },
                        { campo: "frete",         label: "Frete (R$)",            moeda: true },
                        { campo: "seguro",        label: "Seguro (R$)",           moeda: true },
                        { campo: "outrasDespesas",label: "Outras Despesas (R$)",  moeda: true },
                        { campo: "desconto",      label: "Desconto (R$)",         moeda: true },
                        { campo: "aliquotaIPI",   label: "Alíquota IPI (%)",      moeda: false },
                      ].map(({ campo, label, moeda }) => (
                        <div key={campo}>
                          <LabelRow label={label} campo={campo} />
                          <input style={inputStyle} placeholder={moeda ? "0,00" : "0"}
                            value={formDifal[campo]}
                            onChange={moeda ? setDifalMask(campo) : setDifal(campo)} />
                        </div>
                      ))}
                    </div>
                    {formDifal.tipoDifal === "b2c" && (
                      <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)", background: "var(--bg-input)", borderRadius: 7, padding: "7px 10px" }}>
                        💡 No B2C, o IPI integra a base do DIFAL quando o destinatário é não contribuinte.
                      </div>
                    )}
                  </div>

                  {/* Alíquotas */}
                  <div style={secaoStyle}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                      Alíquotas
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <LabelRow label="Al. Interestadual (%)" campo="aliquotaInterestadual" />
                        <input style={inputStyle} value={formDifal.aliquotaInterestadual} onChange={setDifal("aliquotaInterestadual")} />
                      </div>
                      <div>
                        <LabelRow label={`Al. Interna ${formDifal.ufDestino} (%)`} campo="aliquotaInterna" />
                        <input style={inputStyle} value={formDifal.aliquotaInterna} onChange={setDifal("aliquotaInterna")} />
                      </div>
                    </div>
                    {/* DIFAL preview */}
                    {parseVal(formDifal.aliquotaInterna) > parseVal(formDifal.aliquotaInterestadual) && (
                      <div style={{ padding: "8px 12px", background: "#3b82f618", border: "1px solid #3b82f640", borderRadius: 8, fontSize: 12, color: "#93c5fd" }}>
                        Diferencial: <strong style={{ color: "#3b82f6" }}>{fmt(parseVal(formDifal.aliquotaInterna) - parseVal(formDifal.aliquotaInterestadual))}%</strong>
                        {" "}→ base calculada ao confirmar
                      </div>
                    )}

                    {/* FCP */}
                    <div style={{
                      marginTop: 16,
                      background: FCP_ESTADOS[formDifal.ufDestino] ? "#2d1a00" : "var(--bg-input)",
                      border: `1.5px solid ${FCP_ESTADOS[formDifal.ufDestino] ? "var(--amber)" : "var(--border)"}`,
                      borderRadius: 10, padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 14 }}>🏦</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: FCP_ESTADOS[formDifal.ufDestino] ? "var(--amber)" : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          FCP — Fundo de Combate à Pobreza
                        </span>
                        {FCP_ESTADOS[formDifal.ufDestino] && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "var(--amber)", color: "#000", padding: "2px 7px", borderRadius: 10, marginLeft: "auto" }}>
                            {formDifal.ufDestino} — obrigatório
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input style={{ ...inputStyle, flex: 1, borderColor: FCP_ESTADOS[formDifal.ufDestino] ? "var(--amber)" : "var(--border)" }}
                          placeholder="0" value={formDifal.aliqFCP} onChange={setDifal("aliqFCP")} />
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>%</span>
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-primary" onClick={calcularDifalFn}
                      disabled={!formDifal.valorProduto}
                      style={{ flex: 1, opacity: !formDifal.valorProduto ? 0.5 : 1, background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
                    >
                      Calcular DIFAL
                    </button>
                    <button className="btn-ghost" onClick={limparDifal} style={{ padding: "12px 16px" }}>Limpar</button>
                  </div>
                </div>
              </div>

              {/* ── Resultado DIFAL ── */}
              <div style={{ flex: 1, display: abaDifal === "resultado" || (abaDifal === "form" && resultadoDifal) ? "block" : "none" }} className="painel-resultado">
                {resultadoDifal ? (
                  <div>
                    {/* Resumo */}
                    <div style={{ ...secaoStyle, borderLeft: "4px solid #3b82f6", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>DIFAL — Resumo</div>
                      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{formDifal.ufOrigem} → {formDifal.ufDestino}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>
                        {resultadoDifal.tipoDifal === "b2c" ? "Venda a Consumidor Final (EC 87/2015)" : "Uso Próprio / Ativo Imobilizado"}
                      </div>
                    </div>

                    {/* Base */}
                    <div style={secaoStyle}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Base de Cálculo</div>
                      <LinhaResult label="Valor do Produto" valor={`R$ ${fmt(parseVal(formDifal.valorProduto))}`} sub />
                      <LinhaResult label="(+) Frete" valor={`R$ ${fmt(parseVal(formDifal.frete))}`} sub />
                      {resultadoDifal.IPI > 0 && <LinhaResult label={`(+) IPI (${formDifal.aliquotaIPI}%) — integra base B2C`} valor={`R$ ${fmt(resultadoDifal.IPI)}`} sub cor="#a78bfa" />}
                      <LinhaResult label="(=) Base DIFAL" valor={`R$ ${fmt(resultadoDifal.baseDifal)}`} />
                    </div>

                    {/* Cálculo DIFAL */}
                    <div style={{ ...secaoStyle, borderLeft: "4px solid #3b82f6" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                        Diferencial de Alíquota
                      </div>
                      <LinhaResult label={`Alíquota Interna ${formDifal.ufDestino}`} valor={`${formDifal.aliquotaInterna}%`} sub />
                      <LinhaResult label="(−) Alíquota Interestadual" valor={`${formDifal.aliquotaInterestadual}%`} sub />
                      <LinhaResult label="(=) Diferencial" valor={`${fmt(resultadoDifal.diferencialAliq)}%`} sub cor="#3b82f6" />
                      <div style={{ height: 8 }} />
                      <LinhaResult label={`Base DIFAL × ${fmt(resultadoDifal.diferencialAliq)}%`} valor={`R$ ${fmt(resultadoDifal.DIFAL)}`} />

                      {/* FCP */}
                      {resultadoDifal.FCP > 0 && (
                        <div style={{ marginTop: 14, background: "#2d1a00", border: "1.5px solid var(--amber)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                            🏦 FCP — {formDifal.ufDestino} ({formDifal.aliqFCP}%)
                          </div>
                          <LinhaResult label={`Base × ${formDifal.aliqFCP}%`} valor={`R$ ${fmt(resultadoDifal.FCP)}`} sub />
                        </div>
                      )}

                      {/* Total DIFAL destaque */}
                      <div style={{
                        marginTop: 14, padding: "14px 16px",
                        background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)",
                        borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#93c5fd", fontWeight: 700, textTransform: "uppercase" }}>Total DIFAL a Recolher</div>
                          {resultadoDifal.FCP > 0 && <div style={{ fontSize: 10, color: "#93c5fd", marginTop: 2 }}>DIFAL + FCP</div>}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>R$ {fmt(resultadoDifal.totalDifal)}</div>
                      </div>
                    </div>

                    {/* Resumo final */}
                    <div style={secaoStyle}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Resumo Final</div>
                      <LinhaResult label="Base de Cálculo" valor={`R$ ${fmt(resultadoDifal.base)}`} sub />
                      <LinhaResult label="DIFAL" valor={`R$ ${fmt(resultadoDifal.DIFAL)}`} sub cor="#3b82f6" />
                      {resultadoDifal.FCP > 0 && <LinhaResult label={`FCP ${formDifal.ufDestino} (${formDifal.aliqFCP}%)`} valor={`R$ ${fmt(resultadoDifal.FCP)}`} sub cor="var(--amber)" />}
                      <LinhaResult label="(=) Total DIFAL" valor={`R$ ${fmt(resultadoDifal.totalDifal)}`} />
                      <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--bg-input)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>Carga Tributária DIFAL</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "#3b82f6" }}>{fmt(resultadoDifal.cargaTributaria)}%</span>
                      </div>
                    </div>

                    {/* Alertas DIFAL */}
                    <div style={{ ...secaoStyle, background: "var(--bg-input)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Alertas</div>
                      {[
                        "Se houver protocolo/convênio ICMS-ST entre os estados para o produto, o DIFAL não é cobrado separadamente — o ST já cobre a cadeia.",
                        "DIFAL B2C regulamentado pela LC 190/2022 (vigência a partir de jan/2023 na maioria dos estados).",
                        "Confirme a alíquota interna vigente para o produto específico na SEFAZ do estado destino.",
                        resultadoDifal.tipoDifal === "uso" ? "No uso próprio, o recolhimento é de responsabilidade do DESTINATÁRIO na entrada da mercadoria." : "No B2C, o recolhimento é de responsabilidade do REMETENTE.",
                      ].map((a, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "var(--muted)" }}>
                          <span>⚠️</span><span>{a}</span>
                        </div>
                      ))}
                    </div>

                    <button className="btn-primary"
                      onClick={() => gerarPDFDIFALFn({ ...formDifal, aliquotaInterestadual: parseVal(formDifal.aliquotaInterestadual), aliquotaInterna: parseVal(formDifal.aliquotaInterna) }, resultadoDifal)}
                      style={{ width: "100%", background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
                    >
                      📄 Exportar Relatório DIFAL PDF
                    </button>
                  </div>
                ) : (
                  <div style={{ ...secaoStyle, textAlign: "center", padding: "60px 24px" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📐</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Preencha o formulário e clique em Calcular DIFAL</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>O resultado aparecerá aqui</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ MODO HISTÓRICO ════════════════════════════════════════════════ */}
          {modoPrincipal === "historico" && (
            <div style={{ maxWidth: 860 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Histórico Completo</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                    {historico.length} ICMS-ST · {historicoDifal.length} DIFAL
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {historico.length > 0 && <button className="btn-danger" onClick={limparHistorico} style={{ padding: "7px 14px", fontSize: 12 }}>🗑 Limpar ST</button>}
                  {historicoDifal.length > 0 && <button className="btn-danger" onClick={limparHistoricoDifal} style={{ padding: "7px 14px", fontSize: 12 }}>🗑 Limpar DIFAL</button>}
                </div>
              </div>

              {historico.length === 0 && historicoDifal.length === 0 ? (
                <div style={{ ...secaoStyle, textAlign: "center", padding: "60px 24px" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nenhuma simulação ainda</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
                    <button className="btn-primary" onClick={() => setModoPrincipal("st")}>⚖️ Calcular ICMS-ST</button>
                    <button className="btn-ghost" style={{ color: "#3b82f6", borderColor: "#3b82f640" }} onClick={() => setModoPrincipal("difal")}>📐 Calcular DIFAL</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* ST items */}
                  {historico.map(item => (
                    <div key={`st-${item.id}`} style={{
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: "16px 18px",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap",
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)40"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, background: "var(--primary-glow)", color: "var(--primary)", padding: "2px 8px", borderRadius: 5 }}>ICMS-ST</span>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{item.ufOrigem} → {item.ufDestino}</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>{item.data}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.descricaoProduto || "Produto não informado"}
                          {item.form?.ncm && <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: 11 }}>NCM {item.form.ncm}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>ICMS-ST</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--green)" }}>R$ {fmt(item.ICMSSTRecolher)}</div>
                          </div>
                          {item.resultado?.FCP > 0 && (
                            <div>
                              <div style={{ fontSize: 10, color: "var(--amber)", textTransform: "uppercase" }}>FCP</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--amber)" }}>R$ {fmt(item.resultado.FCP)}</div>
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Total Nota</div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>R$ {fmt(item.totalNota)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Carga</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--amber)" }}>{fmt(item.resultado?.cargaTributaria || 0)}%</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
                        <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}
                          onClick={() => { carregarHistorico(item); setModoPrincipal("st"); setAbaAtiva("resultado"); }}>Abrir</button>
                        <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px", color: "var(--primary)", borderColor: "var(--primary)40" }}
                          onClick={() => gerarPDFST({ ...item.form, aliquotaInterestadual: parseVal(item.form.aliquotaInterestadual), aliquotaInterna: parseVal(item.form.aliquotaInterna) }, item.resultado)}>📄 PDF</button>
                        <button className="btn-danger" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => deletarItem(item.id)}>Excluir</button>
                      </div>
                    </div>
                  ))}

                  {/* DIFAL items */}
                  {historicoDifal.map(item => (
                    <div key={`difal-${item.id}`} style={{
                      background: "var(--bg-card)", border: "1px solid #3b82f640",
                      borderRadius: 12, padding: "16px 18px",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap",
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f680"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#3b82f640"}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, background: "#3b82f618", color: "#3b82f6", padding: "2px 8px", borderRadius: 5 }}>DIFAL</span>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{item.ufOrigem} → {item.ufDestino}</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>{item.data}</span>
                          <span style={{ fontSize: 10, color: "var(--muted)", background: "var(--bg-input)", padding: "1px 7px", borderRadius: 5 }}>
                            {item.tipoDifal === "b2c" ? "Consumidor Final" : "Uso Próprio"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 8 }}>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>DIFAL</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#3b82f6" }}>R$ {fmt(item.resultado?.DIFAL || 0)}</div>
                          </div>
                          {item.resultado?.FCP > 0 && (
                            <div>
                              <div style={{ fontSize: 10, color: "var(--amber)", textTransform: "uppercase" }}>FCP</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--amber)" }}>R$ {fmt(item.resultado.FCP)}</div>
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Total DIFAL</div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>R$ {fmt(item.totalDifal)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Carga</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#3b82f6" }}>{fmt(item.resultado?.cargaTributaria || 0)}%</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
                        <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px", color: "#3b82f6", borderColor: "#3b82f640" }}
                          onClick={() => { setFormDifal(item.form); setResultadoDifal(item.resultado); setModoPrincipal("difal"); setAbaDifal("resultado"); }}>Abrir</button>
                        <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px", color: "#3b82f6", borderColor: "#3b82f640" }}
                          onClick={() => gerarPDFDIFALFn({ ...item.form, aliquotaInterestadual: parseVal(item.form.aliquotaInterestadual), aliquotaInterna: parseVal(item.form.aliquotaInterna) }, item.resultado)}>📄 PDF</button>
                        <button className="btn-danger" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => deletarItemDifal(item.id)}>Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        <style>{`
          @media (max-width: 768px) {
            .painel-form { flex: none !important; width: 100% !important; }
            .painel-resultado { width: 100% !important; }
          }
        `}</style>
      </Layout>
    </>
  );
}
