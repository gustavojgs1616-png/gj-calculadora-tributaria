import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import CardBloqueado from "../components/CardBloqueado";
import { CFOP_DATA, CST_ICMS, CSOSN_DATA, CST_PIS_COFINS, SINTEGRA_ESTADOS } from "../components/dadosFiscais";

// ── Utilitários ───────────────────────────────────────────────────────────────

function maskCNPJ(v) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
function limpaCNPJ(v) { return v.replace(/\D/g, ""); }
function fmtCNPJ(cnpj) {
  const d = (cnpj || "").replace(/\D/g, "");
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
function fmtData(str) {
  if (!str) return "—";
  const d = str.includes("T") ? new Date(str) : new Date(str + "T12:00:00");
  return d.toLocaleDateString("pt-BR");
}
function fmtDataHora(str) {
  if (!str) return "—";
  return new Date(str).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmt(v) {
  if (!v && v !== 0) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtCEP(cep) {
  const d = (cep || "").replace(/\D/g, "");
  return d.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}
function fmtTelefone(t) {
  if (!t) return "—";
  const d = t.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return t;
}

// ── Status ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  "Ativa":    { cor: "#22c55e", bg: "#22c55e18", icon: "✅" },
  "Baixada":  { cor: "#ef4444", bg: "#ef444418", icon: "❌" },
  "Inapta":   { cor: "#f97316", bg: "#f9731618", icon: "⚠️" },
  "Suspensa": { cor: "#f97316", bg: "#f9731618", icon: "⏸️" },
  "Nula":     { cor: "#6b7280", bg: "#6b728018", icon: "🚫" },
};
function getStatus(desc) {
  const key = Object.keys(STATUS_CONFIG).find((k) => (desc || "").toLowerCase().includes(k.toLowerCase()));
  return STATUS_CONFIG[key] || { cor: "#808CFF", bg: "#808CFF18", icon: "ℹ️" };
}

function sugerirRegime(empresa, simples) {
  if (simples?.simei_optante) return "MEI";
  if (simples?.simples_optante && !simples?.simples_data_exclusao) return "Simples Nacional";
  const porte = (empresa?.porte || "").toLowerCase();
  if (porte.includes("mei"))    return "MEI";
  if (porte.includes("micro"))  return "Simples Nacional";
  if (porte.includes("pequen")) return "Simples Nacional";
  if (porte.includes("médio"))  return "Lucro Presumido";
  if (porte.includes("grande")) return "Lucro Real";
  return "Simples Nacional";
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function InfoCard({ titulo, children, icon }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {icon} {titulo}
      </div>
      {children}
    </div>
  );
}

function InfoLinha({ label, valor, destaque }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: destaque ? 700 : 500, color: destaque ? "var(--text)" : "var(--muted)", textAlign: "right" }}>{valor || "—"}</span>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CNPJPage() {
  const router = useRouter();
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [user, setUser]           = useState(null);
  const [cnpjInput, setCnpjInput] = useState("");
  const [empresa, setEmpresa]     = useState(null);
  const [simples, setSimples]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [erro, setErro]           = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [abaAtiva, setAbaAtiva]   = useState("consulta"); // "consulta" | "historico" | "cfop" | "cst" | "sintegra"
  const [excluindo, setExcluindo] = useState(null);

  // ── CFOP / CST / Sintegra states ──
  const [buscaCFOP,    setBuscaCFOP]    = useState("");
  const [filtroEscopo, setFiltroEscopo] = useState("todos"); // "todos" | "est" | "int" | "ext"
  const [filtroDir,    setFiltroDir]    = useState("todos"); // "todos" | "E" | "S"
  const [buscaCST,     setBuscaCST]     = useState("");
  const [abaCST,       setAbaCST]       = useState("icms"); // "icms" | "csosn" | "piscofins"
  const [ufSintegra,   setUfSintegra]   = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setUser(session.user);
      carregarHistorico(session.user.id);
    });
  }, [router]);

  const carregarHistorico = async (uid) => {
    setLoadingHist(true);
    const { data } = await supabase
      .from("cnpj_historico")
      .select("*")
      .eq("user_id", uid)
      .order("consultado_em", { ascending: false })
      .limit(100);
    setHistorico(data || []);
    setLoadingHist(false);
  };

  const salvarHistorico = async (uid, data, simplesData) => {
    const registro = {
      user_id:        uid,
      cnpj:           (data.cnpj || "").replace(/\D/g, ""),
      razao_social:   data.razao_social || "",
      nome_fantasia:  data.nome_fantasia || "",
      situacao:       data.descricao_situacao_cadastral || "",
      uf:             data.uf || "",
      municipio:      data.municipio || "",
      porte:          data.porte || "",
      cnae_descricao: data.cnae_fiscal_descricao || "",
      simples_optante: simplesData?.simples_optante ?? null,
      simei_optante:   simplesData?.simei_optante   ?? null,
    };
    // Upsert: atualiza consultado_em se já existir
    const { data: salvo } = await supabase
      .from("cnpj_historico")
      .upsert(registro, { onConflict: "user_id,cnpj" })
      .select()
      .single();

    // Atualiza lista local
    setHistorico((prev) => {
      const sem = prev.filter((h) => h.cnpj !== registro.cnpj);
      return [salvo || { ...registro, consultado_em: new Date().toISOString() }, ...sem];
    });
  };

  const excluirHistorico = async (id) => {
    setExcluindo(id);
    await supabase.from("cnpj_historico").delete().eq("id", id);
    setHistorico((prev) => prev.filter((h) => h.id !== id));
    setExcluindo(null);
  };

  const limparTudo = async () => {
    if (!user) return;
    if (!confirm("Apagar todo o histórico de consultas?")) return;
    await supabase.from("cnpj_historico").delete().eq("user_id", user.id);
    setHistorico([]);
  };

  const buscar = async (cnpjParam) => {
    const cnpj = limpaCNPJ(cnpjParam || cnpjInput);
    if (cnpj.length !== 14) { setErro("CNPJ inválido. Informe os 14 dígitos."); return; }
    setLoading(true); setErro(null); setEmpresa(null); setSimples(null);
    setAbaAtiva("consulta");

    try {
      const res = await fetch(`/api/cnpj-consulta?cnpj=${cnpj}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Serviço indisponível. Tente novamente.");
      }
      const data = await res.json();
      setEmpresa(data);
      if (data.uf) setUfSintegra(data.uf);
      const sn = data.simples || null;
      if (sn) setSimples(sn);
      if (user) await salvarHistorico(user.id, data, sn);
    } catch (e) {
      setErro(e.message || "Erro ao consultar CNPJ.");
    } finally {
      setLoading(false);
    }
  };

  const abrirDoHistorico = (h) => {
    setCnpjInput(fmtCNPJ(h.cnpj));
    buscar(h.cnpj);
  };

  // ── Dados filtrados ────────────────────────────────────────────────────────
  const cfopFiltrado = useMemo(() => {
    const q = buscaCFOP.toLowerCase().trim();
    return CFOP_DATA.filter(c => {
      if (filtroDir !== "todos" && c.dir !== filtroDir) return false;
      if (filtroEscopo !== "todos" && c.escopo !== filtroEscopo) return false;
      if (!q) return true;
      return c.codigo.includes(q) || c.desc.toLowerCase().includes(q) || c.grupo.toLowerCase().includes(q);
    });
  }, [buscaCFOP, filtroDir, filtroEscopo]);

  const cstFiltrado = useMemo(() => {
    const q = buscaCST.toLowerCase().trim();
    const base = abaCST === "icms" ? CST_ICMS : abaCST === "csosn" ? CSOSN_DATA : CST_PIS_COFINS;
    if (!q) return base;
    return base.filter(c => c.cst.includes(q) || c.desc.toLowerCase().includes(q));
  }, [buscaCST, abaCST]);

  if (!user || carregandoPlano) return null;
  if (!pode("cnpj")) return (
    <Layout user={user}>
      <CardBloqueado ferramenta="cnpj" planoNecessario="essencial" />
    </Layout>
  );

  const status = empresa ? getStatus(empresa.descricao_situacao_cadastral) : null;

  return (
    <>
      <Head>
        <title>Consulta Fiscal — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 1000, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Consulta Fiscal</h1>
            <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
              CNPJ · CFOP · CST/CSOSN · Sintegra — referências fiscais em um lugar só
            </p>
          </div>

          {/* Abas */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { id: "consulta",  label: "🔍 Consultar" },
              { id: "historico", label: `📋 Histórico (${historico.length})` },
              { id: "cfop",      label: "📄 CFOP" },
              { id: "cst",       label: "🏷️ CST / CSOSN" },
              { id: "sintegra",  label: "🔗 Sintegra" },
            ].map((aba) => (
              <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} style={{
                padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: abaAtiva === aba.id ? "var(--primary-glow)" : "var(--bg-card)",
                border: abaAtiva === aba.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                color: abaAtiva === aba.id ? "var(--primary)" : "var(--muted)",
                cursor: "pointer", whiteSpace: "nowrap",
              }}>{aba.label}</button>
            ))}
          </div>

          {/* ══ ABA CONSULTA ══ */}
          {abaAtiva === "consulta" && (
            <>
              {/* Campo de busca */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 24px 20px", marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>CNPJ da Empresa</label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <input
                    value={cnpjInput}
                    onChange={(e) => setCnpjInput(maskCNPJ(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && buscar()}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    style={{ flex: 1, minWidth: 200, padding: "12px 16px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 16, color: "var(--text)", outline: "none", letterSpacing: "0.05em", fontWeight: 600 }}
                  />
                  <button onClick={() => buscar()} disabled={loading || limpaCNPJ(cnpjInput).length !== 14}
                    style={{
                      padding: "12px 32px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                      background: loading || limpaCNPJ(cnpjInput).length !== 14 ? "var(--bg-input)" : "linear-gradient(135deg,#DF9F20,#B27F1A)",
                      border: "none", color: loading || limpaCNPJ(cnpjInput).length !== 14 ? "var(--muted)" : "#000",
                      cursor: loading || limpaCNPJ(cnpjInput).length !== 14 ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                    }}>
                    {loading ? "Consultando..." : "🔍 Consultar"}
                  </button>
                </div>

                {/* Acesso rápido — últimas 5 do histórico */}
                {historico.length > 0 && !empresa && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Consultados recentemente:</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {historico.slice(0, 5).map((h) => {
                        const st = getStatus(h.situacao);
                        return (
                          <button key={h.cnpj} onClick={() => abrirDoHistorico(h)} style={{
                            padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                            background: "transparent", border: "1px solid var(--border)",
                            color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                          }}>
                            <span style={{ color: st.cor, fontSize: 10 }}>●</span>
                            {fmtCNPJ(h.cnpj)} · {h.razao_social?.split(" ").slice(0, 2).join(" ")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Erro */}
              {erro && (
                <div style={{ background: "#ef444418", border: "1px solid #ef444444", borderRadius: 12, padding: "16px 20px", color: "#fca5a5", fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
                  {erro}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, height: 120, animation: "pulse 1.5s ease-in-out infinite" }} />
                  ))}
                </div>
              )}

              {/* Resultado */}
              {empresa && !loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Header */}
                  <div style={{ background: "var(--bg-card)", border: `2px solid ${status.cor}44`, borderLeft: `5px solid ${status.cor}`, borderRadius: 16, padding: "22px 24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>{empresa.razao_social}</div>
                        {empresa.nome_fantasia && empresa.nome_fantasia !== empresa.razao_social && (
                          <div style={{ fontSize: 15, color: "var(--muted)", marginTop: 4 }}>{empresa.nome_fantasia}</div>
                        )}
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)", marginTop: 8, letterSpacing: "0.05em" }}>{fmtCNPJ(empresa.cnpj)}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: status.bg, border: `1px solid ${status.cor}44`, borderRadius: 20, fontSize: 14, fontWeight: 800, color: status.cor }}>
                          {status.icon} {empresa.descricao_situacao_cadastral}
                        </div>
                        {empresa.porte && <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{empresa.porte}</div>}
                      </div>
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={() => router.push(`/honorarios?uf=${empresa.uf}&regime=${encodeURIComponent(sugerirRegime(empresa, simples))}`)}
                        style={{ padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none", color: "#000", cursor: "pointer" }}>
                        Calcular Honorários
                      </button>
                      <button onClick={() => { setEmpresa(null); setSimples(null); setCnpjInput(""); }}
                        style={{ padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer" }}>
                        Nova Consulta
                      </button>
                    </div>
                  </div>

                  {/* Simples Nacional */}
                  {simples !== null && (() => {
                    const optante      = !!simples.simples_optante;
                    const optanteMEI   = !!simples.simei_optante;
                    const dataOpcao    = simples.simples_data_opcao;
                    const dataExclusao = simples.simples_data_exclusao;
                    const foiExcluido  = !optante && !!dataExclusao;
                    const cor = optante || optanteMEI ? "#22c55e" : foiExcluido ? "#f97316" : "#ef4444";
                    return (
                      <div style={{ background: optante || optanteMEI ? "#0f2d1a" : foiExcluido ? "#1a1200" : "var(--bg-card)", border: `2px solid ${cor}44`, borderRadius: 14, padding: "20px 24px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
                          📊 Consulta Optantes — Simples Nacional / SIMEI
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: optante || optanteMEI ? 0 : 14 }}>
                          <div style={{ flex: 1, minWidth: 220, padding: "12px 16px", borderRadius: 10, background: optante ? "#22c55e18" : foiExcluido ? "#f9731618" : "#ef444418", border: `1px solid ${cor}44` }}>
                            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Simples Nacional</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: cor, display: "flex", alignItems: "center", gap: 6 }}>
                              {optante ? "✅" : foiExcluido ? "⚠️" : "❌"}
                              {optante ? `Optante desde ${dataOpcao ? new Date(dataOpcao + "T12:00:00").toLocaleDateString("pt-BR") : "—"}`
                                : foiExcluido ? `Excluído em ${new Date(dataExclusao + "T12:00:00").toLocaleDateString("pt-BR")}`
                                : "Não optante"}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 10, background: optanteMEI ? "#22c55e18" : "var(--bg-input)", border: `1px solid ${optanteMEI ? "#22c55e" : "var(--border)"}44` }}>
                            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>SIMEI (MEI)</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: optanteMEI ? "#22c55e" : "var(--muted)" }}>
                              {optanteMEI ? "✅ Enquadrado no SIMEI" : "— Não enquadrado"}
                            </div>
                          </div>
                        </div>
                        {!optante && !optanteMEI && (
                          <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--bg-input)", border: "1px solid var(--border)", fontSize: 13, color: "var(--muted)" }}>
                            💼 <strong style={{ color: "var(--text)" }}>Regime provável:</strong>{" "}
                            {foiExcluido ? `Excluída do Simples em ${new Date(dataExclusao + "T12:00:00").toLocaleDateString("pt-BR")} — provavelmente adotou ` : "Não optante — provavelmente adota "}
                            <strong style={{ color: "var(--primary)" }}>Lucro Presumido ou Lucro Real</strong>.
                          </div>
                        )}
                        <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)" }}>Fonte: Receita Federal — Consulta Optantes</div>
                      </div>
                    );
                  })()}

                  {/* Grid dados */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2col">
                    <InfoCard titulo="Dados Cadastrais" icon="📋">
                      <InfoLinha label="CNPJ" valor={fmtCNPJ(empresa.cnpj)} destaque />
                      <InfoLinha label="Abertura" valor={fmtData(empresa.data_abertura)} />
                      <InfoLinha label="Natureza Jurídica" valor={empresa.descricao_natureza_juridica} />
                      <InfoLinha label="Porte" valor={empresa.porte} />
                      <InfoLinha label="Capital Social" valor={fmt(empresa.capital_social)} />
                      <InfoLinha label="Situação" valor={empresa.descricao_situacao_cadastral} destaque />
                      {empresa.data_situacao_cadastral && <InfoLinha label="Desde" valor={fmtData(empresa.data_situacao_cadastral)} />}
                    </InfoCard>
                    <InfoCard titulo="Endereço" icon="📍">
                      <InfoLinha label="Logradouro" valor={`${empresa.logradouro || ""}${empresa.numero ? `, ${empresa.numero}` : ""}${empresa.complemento ? ` - ${empresa.complemento}` : ""}`} destaque />
                      <InfoLinha label="Bairro" valor={empresa.bairro} />
                      <InfoLinha label="Município / UF" valor={`${empresa.municipio || ""} / ${empresa.uf || ""}`} />
                      <InfoLinha label="CEP" valor={fmtCEP(empresa.cep)} />
                      <InfoLinha label="Telefone" valor={fmtTelefone(empresa.ddd_telefone_1)} />
                      {empresa.ddd_telefone_2 && <InfoLinha label="Telefone 2" valor={fmtTelefone(empresa.ddd_telefone_2)} />}
                      {empresa.email && <InfoLinha label="Email" valor={empresa.email?.toLowerCase()} />}
                    </InfoCard>
                  </div>

                  {/* CNAE */}
                  <InfoCard titulo="Atividade Econômica" icon="🏭">
                    <div style={{ marginBottom: empresa.cnaes_secundarios?.length > 0 ? 12 : 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Principal</div>
                      <div style={{ padding: "10px 14px", background: "#DF9F2012", border: "1px solid #DF9F2033", borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
                        <span style={{ color: "var(--primary)", fontWeight: 800 }}>{empresa.cnae_fiscal} </span>— {empresa.cnae_fiscal_descricao}
                      </div>
                    </div>
                    {empresa.cnaes_secundarios?.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Secundárias ({empresa.cnaes_secundarios.length})</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {empresa.cnaes_secundarios.slice(0, 8).map((c, i) => (
                            <div key={i} style={{ padding: "8px 12px", background: "#E0E3FF08", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--muted)" }}>
                              <span style={{ fontWeight: 700 }}>{c.codigo} </span>— {c.descricao}
                            </div>
                          ))}
                          {empresa.cnaes_secundarios.length > 8 && <div style={{ fontSize: 12, color: "var(--muted)", padding: "4px 0" }}>+ {empresa.cnaes_secundarios.length - 8} atividades secundárias</div>}
                        </div>
                      </>
                    )}
                  </InfoCard>

                  {/* Sócios */}
                  {empresa.qsa?.length > 0 && (
                    <InfoCard titulo={`Quadro Societário (${empresa.qsa.length})`} icon="👥">
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {empresa.qsa.map((socio, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "#E0E3FF08", border: "1px solid var(--border)", borderRadius: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#808CFF,#4a55e8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff" }}>
                              {socio.nome_socio?.charAt(0) || "?"}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700 }}>{socio.nome_socio}</div>
                              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                                {socio.qualificacao_socio}{socio.cnpj_cpf_do_socio && ` · ${socio.cnpj_cpf_do_socio}`}
                              </div>
                            </div>
                            {socio.data_entrada_sociedade && (
                              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
                                Sócio desde<br /><strong style={{ color: "var(--text)" }}>{fmtData(socio.data_entrada_sociedade)}</strong>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </InfoCard>
                  )}

                  <div style={{ background: "#808CFF0F", border: "1px solid #808CFF22", borderRadius: 12, padding: "12px 18px", fontSize: 12, color: "var(--muted)" }}>
                    Dados: <strong style={{ color: "var(--text)" }}>publica.cnpj.ws / BrasilAPI / Receita Federal</strong>. Pode haver defasagem de até 24h.
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ ABA HISTÓRICO ══ */}
          {abaAtiva === "historico" && (
            <div>
              {/* Header histórico */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Histórico de Consultas</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{historico.length} empresa{historico.length !== 1 ? "s" : ""} consultada{historico.length !== 1 ? "s" : ""}</div>
                </div>
                {historico.length > 0 && (
                  <button onClick={limparTudo} style={{ padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, background: "transparent", border: "1.5px solid var(--red)", color: "var(--red)", cursor: "pointer" }}>
                    🗑 Limpar tudo
                  </button>
                )}
              </div>

              {loadingHist ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3].map((i) => <div key={i} style={{ height: 80, background: "var(--bg-card)", borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
                </div>
              ) : historico.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Nenhuma consulta ainda</div>
                  <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>Suas consultas de CNPJ aparecerão aqui automaticamente.</p>
                  <button onClick={() => setAbaAtiva("consulta")} className="btn-primary">Fazer primeira consulta →</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {historico.map((h) => {
                    const st = getStatus(h.situacao);
                    const simplesOk = h.simples_optante === true;
                    const simplesNao = h.simples_optante === false;
                    const mei = h.simei_optante === true;

                    return (
                      <div key={h.id} style={{
                        background: "var(--bg-card)", border: "1px solid var(--border)",
                        borderLeft: `4px solid ${st.cor}`,
                        borderRadius: 14, padding: "16px 20px",
                        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                        transition: "box-shadow 0.15s",
                      }}>

                        {/* Info principal */}
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 3 }}>
                            {h.razao_social || "—"}
                          </div>
                          {h.nome_fantasia && h.nome_fantasia !== h.razao_social && (
                            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 3 }}>{h.nome_fantasia}</div>
                          )}
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.04em" }}>
                            {fmtCNPJ(h.cnpj)}
                          </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                          {/* Situação */}
                          <span style={{ fontSize: 11, fontWeight: 700, color: st.cor, background: st.bg, padding: "3px 10px", borderRadius: 20 }}>
                            {st.icon} {h.situacao || "—"}
                          </span>
                          {/* Simples */}
                          {simplesOk && !mei && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", background: "#22c55e18", padding: "3px 10px", borderRadius: 20 }}>✓ Simples</span>
                          )}
                          {mei && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#DF9F20", background: "#DF9F2018", padding: "3px 10px", borderRadius: 20 }}>✓ MEI</span>
                          )}
                          {simplesNao && !mei && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", background: "var(--bg-input)", padding: "3px 10px", borderRadius: 20 }}>LP/LR</span>
                          )}
                          {/* UF */}
                          {h.uf && (
                            <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--bg-input)", padding: "3px 9px", borderRadius: 20 }}>
                              📍 {h.municipio ? `${h.municipio.split(" ")[0]}/` : ""}{h.uf}
                            </span>
                          )}
                          {/* Data */}
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            🕐 {fmtDataHora(h.consultado_em)}
                          </span>
                        </div>

                        {/* Ações */}
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button onClick={() => abrirDoHistorico(h)} style={{
                            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                            background: "var(--primary-glow)", border: "1px solid var(--primary)",
                            color: "var(--primary)", cursor: "pointer",
                          }}>
                            Abrir
                          </button>
                          <button onClick={() => excluirHistorico(h.id)} disabled={excluindo === h.id} style={{
                            padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                            background: "transparent", border: "1.5px solid var(--red)",
                            color: excluindo === h.id ? "var(--muted)" : "var(--red)",
                            cursor: excluindo === h.id ? "not-allowed" : "pointer",
                          }}>
                            {excluindo === h.id ? "..." : "🗑"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* ══ ABA CFOP ══ */}
          {abaAtiva === "cfop" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Tabela CFOP</h2>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Código Fiscal de Operações e Prestações — pesquise por código, descrição ou grupo</p>
              </div>

              {/* Filtros */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                <input
                  value={buscaCFOP} onChange={e => setBuscaCFOP(e.target.value)}
                  placeholder="Buscar código ou descrição..."
                  style={{ flex: 1, minWidth: 200, padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 9, fontSize: 13, color: "var(--text)", outline: "none" }}
                />
                {[
                  { v:"todos", l:"Todos" },
                  { v:"E",     l:"↙ Entradas" },
                  { v:"S",     l:"↗ Saídas" },
                ].map(f => (
                  <button key={f.v} onClick={() => setFiltroDir(f.v)} style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: filtroDir === f.v ? (f.v === "E" ? "#22c55e18" : f.v === "S" ? "#3b82f618" : "var(--primary-glow)") : "var(--bg-card)",
                    border: `1px solid ${filtroDir === f.v ? (f.v === "E" ? "#22c55e" : f.v === "S" ? "#3b82f6" : "var(--primary)") : "var(--border)"}`,
                    color: filtroDir === f.v ? (f.v === "E" ? "#22c55e" : f.v === "S" ? "#3b82f6" : "var(--primary)") : "var(--muted)",
                    cursor: "pointer",
                  }}>{f.l}</button>
                ))}
                {[
                  { v:"todos", l:"Todos" },
                  { v:"est",   l:"Estadual" },
                  { v:"int",   l:"Interestadual" },
                  { v:"ext",   l:"Exterior" },
                ].map(f => (
                  <button key={f.v} onClick={() => setFiltroEscopo(f.v)} style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: filtroEscopo === f.v ? "var(--primary-glow)" : "var(--bg-card)",
                    border: `1px solid ${filtroEscopo === f.v ? "var(--primary)" : "var(--border)"}`,
                    color: filtroEscopo === f.v ? "var(--primary)" : "var(--muted)",
                    cursor: "pointer",
                  }}>{f.l}</button>
                ))}
              </div>

              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{cfopFiltrado.length} código{cfopFiltrado.length !== 1 ? "s" : ""} encontrado{cfopFiltrado.length !== 1 ? "s" : ""}</div>

              {/* Tabela */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cfopFiltrado.map(c => {
                  const isEntrada = c.dir === "E";
                  const escopoLabel = { est: "Estadual", int: "Interestadual", ext: "Exterior" }[c.escopo];
                  const escopoCor   = { est: "#f59e0b", int: "#3b82f6", ext: "#8b5cf6" }[c.escopo];
                  return (
                    <div key={c.codigo} style={{
                      display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap",
                      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
                      padding: "12px 16px",
                    }}>
                      <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 800, color: isEntrada ? "#22c55e" : "#3b82f6", flexShrink: 0, width: 54 }}>{c.codigo}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{c.desc}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{c.grupo}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 12, background: isEntrada ? "#22c55e18" : "#3b82f618", color: isEntrada ? "#22c55e" : "#3b82f6" }}>
                          {isEntrada ? "↙ Entrada" : "↗ Saída"}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 12, background: `${escopoCor}18`, color: escopoCor }}>
                          {escopoLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {cfopFiltrado.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    <div style={{ fontSize: 14, color: "var(--muted)" }}>Nenhum CFOP encontrado para esta busca</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ABA CST / CSOSN ══ */}
          {abaAtiva === "cst" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>CST / CSOSN</h2>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Código de Situação Tributária — ICMS, Simples Nacional (CSOSN) e PIS/COFINS</p>
              </div>

              {/* Sub-abas */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { id: "icms",      label: "ICMS (regime normal)" },
                  { id: "csosn",     label: "CSOSN (Simples Nacional)" },
                  { id: "piscofins", label: "PIS/COFINS" },
                ].map(s => (
                  <button key={s.id} onClick={() => { setAbaCST(s.id); setBuscaCST(""); }} style={{
                    padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: abaCST === s.id ? "var(--primary-glow)" : "var(--bg-card)",
                    border: `1px solid ${abaCST === s.id ? "var(--primary)" : "var(--border)"}`,
                    color: abaCST === s.id ? "var(--primary)" : "var(--muted)", cursor: "pointer",
                  }}>{s.label}</button>
                ))}
              </div>

              <input
                value={buscaCST} onChange={e => setBuscaCST(e.target.value)}
                placeholder="Buscar por código ou descrição..."
                style={{ width: "100%", marginBottom: 14, padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 9, fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box" }}
              />

              {/* Lista CST */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cstFiltrado.map(c => {
                  const cor = c.cor || (c.tipo === "entrada" ? "#22c55e" : c.tipo === "saída" ? "#3b82f6" : "var(--muted)");
                  return (
                    <div key={c.cst} style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${cor}`,
                      borderRadius: 10, padding: "12px 16px",
                    }}>
                      <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 900, color: cor, flexShrink: 0, width: 40 }}>{c.cst}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, lineHeight: 1.5 }}>{c.desc}</div>
                        {c.tipo && (
                          <span style={{ fontSize: 11, fontWeight: 700, marginTop: 4, display: "inline-block", padding: "1px 8px", borderRadius: 10, background: `${cor}18`, color: cor }}>
                            {c.tipo === "entrada" ? "↙ Entrada" : "↗ Saída"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {cstFiltrado.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>Nenhum CST encontrado</div>
                  </div>
                )}
              </div>

              {abaCST === "icms" && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-input)", borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, color: "var(--muted)" }}>
                  💡 <strong style={{ color: "var(--text)" }}>Regime normal:</strong> os dois primeiros dígitos do CST representam a origem da mercadoria (0 = Nacional, 1/2/3 = Estrangeira) combinados com o código acima.
                </div>
              )}
              {abaCST === "csosn" && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#DF9F2010", borderRadius: 10, border: "1px solid #DF9F2030", fontSize: 12, color: "var(--muted)" }}>
                  💡 <strong style={{ color: "var(--primary)" }}>CSOSN</strong> é utilizado exclusivamente por empresas optantes do <strong style={{ color: "var(--text)" }}>Simples Nacional</strong>. Substitui o CST do ICMS nas NF-e emitidas por essas empresas.
                </div>
              )}
            </div>
          )}

          {/* ══ ABA SINTEGRA ══ */}
          {abaAtiva === "sintegra" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Sintegra — Consulta por Estado</h2>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Acesse o cadastro de contribuintes do ICMS em cada SEFAZ estadual</p>
              </div>

              {/* Info box */}
              <div style={{ background: "#3b82f610", border: "1px solid #3b82f630", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                <strong style={{ color: "#60a5fa" }}>O que é o Sintegra?</strong> O Sistema Integrado de Informações sobre Operações Interestaduais com Mercadorias e Serviços permite consultar a situação cadastral de contribuintes do ICMS perante a SEFAZ de cada estado. Essencial para validar clientes/fornecedores antes de emitir NF-e.
              </div>

              {/* Seletor de UF com destaque se empresa consultada */}
              {empresa && (
                <div style={{ padding: "10px 14px", background: "var(--primary-glow)", border: "1px solid var(--primary)40", borderRadius: 10, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🏢</span>
                  <span>Última empresa consultada: <strong style={{ color: "var(--primary)" }}>{empresa.razao_social}</strong> — UF <strong style={{ color: "var(--primary)" }}>{empresa.uf}</strong> pré-selecionada</span>
                </div>
              )}

              {/* Grade de estados */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {SINTEGRA_ESTADOS.map(e => {
                  const ativo = ufSintegra === e.uf;
                  return (
                    <a
                      key={e.uf}
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", flexDirection: "column", gap: 4,
                        padding: "14px 16px", borderRadius: 12, textDecoration: "none",
                        background: ativo ? "var(--primary-glow)" : "var(--bg-card)",
                        border: `1.5px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                        transition: "border-color 0.15s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={ev => { if (!ativo) ev.currentTarget.style.borderColor = "var(--primary)60"; }}
                      onMouseLeave={ev => { if (!ativo) ev.currentTarget.style.borderColor = "var(--border)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: ativo ? "var(--primary)" : "var(--text)" }}>{e.uf}</span>
                        {ativo && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--primary)", color: "#000", padding: "1px 6px", borderRadius: 8 }}>✓</span>}
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>↗</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.3 }}>{e.nome}</div>
                      <div style={{ fontSize: 10, color: ativo ? "var(--primary)" : "var(--muted)", opacity: 0.8 }}>{e.obs}</div>
                    </a>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-input)", borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, color: "var(--muted)" }}>
                ⚠️ Os links direcionam para os portais oficiais das SEFAZs estaduais. Alguns estados podem exigir login ou ter URLs temporariamente alteradas.
              </div>
            </div>
          )}

        </div>
      </Layout>

      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @media (max-width: 700px) { .grid-2col { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
