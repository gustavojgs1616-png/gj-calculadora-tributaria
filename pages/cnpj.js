import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";

// ── Utilitários ───────────────────────────────────────────────────────────────

function maskCNPJ(v) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function limpaCNPJ(v) {
  return v.replace(/\D/g, "");
}

function fmt(v) {
  if (!v && v !== 0) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(str) {
  if (!str) return "—";
  const d = str.includes("T") ? new Date(str) : new Date(str + "T12:00:00");
  return d.toLocaleDateString("pt-BR");
}

function fmtCNPJ(cnpj) {
  const d = cnpj?.replace(/\D/g, "") || "";
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function fmtCEP(cep) {
  const d = cep?.replace(/\D/g, "") || "";
  return d.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

function fmtTelefone(t) {
  if (!t) return "—";
  const d = t.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return t;
}

// ── Status da empresa ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  "Ativa":    { cor: "#22c55e", bg: "#22c55e18", icon: "✅" },
  "Baixada":  { cor: "#ef4444", bg: "#ef444418", icon: "❌" },
  "Inapta":   { cor: "#f97316", bg: "#f9731618", icon: "!" },
  "Suspensa": { cor: "#f97316", bg: "#f9731618", icon: "⏸️" },
  "Nula":     { cor: "#6b7280", bg: "#6b728018", icon: "🚫" },
};

function getStatus(desc) {
  const key = Object.keys(STATUS_CONFIG).find((k) =>
    (desc || "").toLowerCase().includes(k.toLowerCase())
  );
  return STATUS_CONFIG[key] || { cor: "#808CFF", bg: "#808CFF18", icon: "i" };
}

// ── Deduz regime pelo porte ───────────────────────────────────────────────────

function sugerirRegime(empresa) {
  const porte = (empresa?.porte || "").toLowerCase();
  if (porte.includes("mei"))    return "MEI";
  if (porte.includes("micro"))  return "Simples Nacional";
  if (porte.includes("pequen")) return "Simples Nacional";
  if (porte.includes("médio"))  return "Lucro Presumido";
  if (porte.includes("grande")) return "Lucro Real";
  return "Simples Nacional";
}

// ── Componente: InfoCard ──────────────────────────────────────────────────────

function InfoCard({ titulo, children, icon }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "20px 22px",
    }}>
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
      <span style={{ fontSize: 13, fontWeight: destaque ? 700 : 500, color: destaque ? "var(--text)" : "var(--muted)", textAlign: "right" }}>
        {valor || "—"}
      </span>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CNPJPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cnpjInput, setCnpjInput] = useState("");
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
    const h = JSON.parse(localStorage.getItem("gj_cnpj_historico") || "[]");
    setHistorico(h);
  }, [router]);

  const buscar = async () => {
    const cnpj = limpaCNPJ(cnpjInput);
    if (cnpj.length !== 14) { setErro("CNPJ inválido. Informe os 14 dígitos."); return; }
    setLoading(true); setErro(null); setEmpresa(null);

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("CNPJ não encontrado na base da Receita Federal.");
        throw new Error("Serviço indisponível. Tente novamente em instantes.");
      }
      const data = await res.json();
      setEmpresa(data);

      // Salva no histórico local
      const novo = { cnpj: data.cnpj, nome: data.razao_social, data: new Date().toISOString() };
      const atualizado = [novo, ...historico.filter((h) => h.cnpj !== data.cnpj)].slice(0, 8);
      setHistorico(atualizado);
      localStorage.setItem("gj_cnpj_historico", JSON.stringify(atualizado));
    } catch (e) {
      setErro(e.message || "Erro ao consultar CNPJ.");
    } finally {
      setLoading(false);
    }
  };

  const irParaHonorarios = () => {
    if (!empresa) return;
    const regime = sugerirRegime(empresa);
    router.push(`/honorarios?uf=${empresa.uf}&regime=${encodeURIComponent(regime)}`);
  };

  if (!user) return null;

  const status = empresa ? getStatus(empresa.descricao_situacao_cadastral) : null;

  return (
    <>
      <Head>
        <title>Consulta CNPJ — GJ Contábil Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 1000, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              Consulta CNPJ
            </h1>
            <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
              Dados completos da empresa diretamente da base da Receita Federal
            </p>
          </div>

          {/* Campo de busca */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "24px 24px 20px",
            marginBottom: 24,
          }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>
              CNPJ da Empresa
            </label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input
                value={cnpjInput}
                onChange={(e) => setCnpjInput(maskCNPJ(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && buscar()}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                style={{
                  flex: 1, minWidth: 200, padding: "12px 16px",
                  background: "#00031F", border: "1px solid var(--border)",
                  borderRadius: 10, fontSize: 16, color: "var(--text)",
                  outline: "none", letterSpacing: "0.05em", fontWeight: 600,
                }}
              />
              <button
                onClick={buscar}
                disabled={loading || limpaCNPJ(cnpjInput).length !== 14}
                style={{
                  padding: "12px 32px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: loading || limpaCNPJ(cnpjInput).length !== 14
                    ? "var(--bg-card)" : "linear-gradient(135deg,#DF9F20,#B27F1A)",
                  border: "none",
                  color: loading || limpaCNPJ(cnpjInput).length !== 14 ? "var(--muted)" : "#000",
                  cursor: loading || limpaCNPJ(cnpjInput).length !== 14 ? "not-allowed" : "pointer",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}
              >
                {loading ? "Consultando..." : "🔍 Consultar"}
              </button>
            </div>

            {/* Histórico */}
            {historico.length > 0 && !empresa && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Consultados recentemente:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {historico.map((h) => (
                    <button
                      key={h.cnpj}
                      onClick={() => { setCnpjInput(fmtCNPJ(h.cnpj)); }}
                      style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: "transparent", border: "1px solid var(--border)",
                        color: "var(--muted)", cursor: "pointer",
                      }}
                    >
                      {fmtCNPJ(h.cnpj)} · {h.nome?.split(" ").slice(0, 2).join(" ")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div style={{
              background: "#ef444418", border: "1px solid #ef444444",
              borderRadius: 12, padding: "16px 20px", color: "#fca5a5",
              fontSize: 14, fontWeight: 600, marginBottom: 24,
            }}>
              {erro}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 14, padding: 24, height: 120,
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))}
            </div>
          )}

          {/* Resultado */}
          {empresa && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Header da empresa */}
              <div style={{
                background: "var(--bg-card)",
                border: `2px solid ${status.cor}44`,
                borderLeft: `5px solid ${status.cor}`,
                borderRadius: 16, padding: "22px 24px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", lineHeight: 1.2 }}>
                      {empresa.razao_social}
                    </div>
                    {empresa.nome_fantasia && empresa.nome_fantasia !== empresa.razao_social && (
                      <div style={{ fontSize: 15, color: "var(--muted)", marginTop: 4 }}>
                        {empresa.nome_fantasia}
                      </div>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)", marginTop: 8, letterSpacing: "0.05em" }}>
                      {fmtCNPJ(empresa.cnpj)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                      background: status.bg, border: `1px solid ${status.cor}44`,
                      borderRadius: 20, fontSize: 14, fontWeight: 800, color: status.cor,
                    }}>
                      {status.icon} {empresa.descricao_situacao_cadastral}
                    </div>
                    {empresa.porte && (
                      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                        {empresa.porte}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão Calcular Honorários */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={irParaHonorarios}
                    style={{
                      padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
                      border: "none", color: "#000", cursor: "pointer",
                    }}
                  >
                    Calcular Honorários para esta empresa
                  </button>
                  <button
                    onClick={() => { setEmpresa(null); setCnpjInput(""); }}
                    style={{
                      padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                      color: "var(--muted)", cursor: "pointer",
                    }}
                  >
                    Nova Consulta
                  </button>
                </div>
              </div>

              {/* Grid de informações */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2col">

                {/* Dados Cadastrais */}
                <InfoCard titulo="Dados Cadastrais" icon="📋">
                  <InfoLinha label="CNPJ" valor={fmtCNPJ(empresa.cnpj)} destaque />
                  <InfoLinha label="Data de Abertura" valor={fmtData(empresa.data_abertura)} />
                  <InfoLinha label="Natureza Jurídica" valor={empresa.descricao_natureza_juridica} />
                  <InfoLinha label="Porte" valor={empresa.porte} />
                  <InfoLinha label="Capital Social" valor={fmt(empresa.capital_social)} />
                  <InfoLinha label="Situação" valor={empresa.descricao_situacao_cadastral} destaque />
                  {empresa.data_situacao_cadastral && (
                    <InfoLinha label="Desde" valor={fmtData(empresa.data_situacao_cadastral)} />
                  )}
                </InfoCard>

                {/* Endereço */}
                <InfoCard titulo="Endereço" icon="📍">
                  <InfoLinha label="Logradouro" valor={`${empresa.logradouro || ""}${empresa.numero ? `, ${empresa.numero}` : ""}${empresa.complemento ? ` - ${empresa.complemento}` : ""}`} destaque />
                  <InfoLinha label="Bairro" valor={empresa.bairro} />
                  <InfoLinha label="Município / UF" valor={`${empresa.municipio || ""} / ${empresa.uf || ""}`} />
                  <InfoLinha label="CEP" valor={fmtCEP(empresa.cep)} />
                  <InfoLinha label="Telefone" valor={fmtTelefone(empresa.ddd_telefone_1)} />
                  {empresa.ddd_telefone_2 && (
                    <InfoLinha label="Telefone 2" valor={fmtTelefone(empresa.ddd_telefone_2)} />
                  )}
                  {empresa.email && (
                    <InfoLinha label="Email" valor={empresa.email?.toLowerCase()} />
                  )}
                </InfoCard>
              </div>

              {/* Atividade Econômica */}
              <InfoCard titulo="Atividade Econômica" icon="🏭">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Principal
                  </div>
                  <div style={{
                    padding: "10px 14px", background: "#DF9F2012",
                    border: "1px solid #DF9F2033", borderRadius: 10,
                    fontSize: 14, fontWeight: 600, color: "var(--text)",
                  }}>
                    <span style={{ color: "var(--primary)", fontWeight: 800 }}>{empresa.cnae_fiscal} </span>
                    — {empresa.cnae_fiscal_descricao}
                  </div>
                </div>
                {empresa.cnaes_secundarios?.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      Secundárias ({empresa.cnaes_secundarios.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {empresa.cnaes_secundarios.slice(0, 8).map((c, i) => (
                        <div key={i} style={{
                          padding: "8px 12px", background: "#E0E3FF08",
                          border: "1px solid var(--border)", borderRadius: 8,
                          fontSize: 13, color: "var(--muted)",
                        }}>
                          <span style={{ fontWeight: 700 }}>{c.codigo} </span>— {c.descricao}
                        </div>
                      ))}
                      {empresa.cnaes_secundarios.length > 8 && (
                        <div style={{ fontSize: 12, color: "var(--muted)", padding: "4px 0" }}>
                          + {empresa.cnaes_secundarios.length - 8} atividades secundárias
                        </div>
                      )}
                    </div>
                  </>
                )}
              </InfoCard>

              {/* Quadro Societário */}
              {empresa.qsa?.length > 0 && (
                <InfoCard titulo={`Quadro Societário (${empresa.qsa.length})`} icon="👥">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {empresa.qsa.map((socio, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 14px", background: "#E0E3FF08",
                        border: "1px solid var(--border)", borderRadius: 10,
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg,#808CFF,#4a55e8)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 15, fontWeight: 800, color: "#fff",
                        }}>
                          {socio.nome_socio?.charAt(0) || "?"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{socio.nome_socio}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                            {socio.qualificacao_socio}
                            {socio.cnpj_cpf_do_socio && ` · ${socio.cnpj_cpf_do_socio}`}
                          </div>
                        </div>
                        {socio.data_entrada_sociedade && (
                          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
                            Sócio desde<br />
                            <strong style={{ color: "var(--text)" }}>{fmtData(socio.data_entrada_sociedade)}</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </InfoCard>
              )}

              {/* Rodapé informativo */}
              <div style={{
                background: "#808CFF0F", border: "1px solid #808CFF22",
                borderRadius: 12, padding: "12px 18px", fontSize: 12, color: "var(--muted)",
              }}>
                Dados obtidos via <strong style={{ color: "var(--text)" }}>BrasilAPI / Receita Federal</strong>. As informações refletem a base cadastral atual e podem ter defasagem de até 24h.
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
