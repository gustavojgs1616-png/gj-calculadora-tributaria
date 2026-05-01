import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import { useAssinatura } from "../../lib/AssinaturaContext";
import CardBloqueado from "../../components/CardBloqueado";

const REGIME_LABEL = {
  SIMPLES:         "Simples Nacional",
  SIMPLES_HIBRIDO: "Simples Híbrido",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL:      "Lucro Real",
};
const REGIME_COR = {
  SIMPLES:         "#22c55e",
  SIMPLES_HIBRIDO: "#3b82f6",
  LUCRO_PRESUMIDO: "#f59e0b",
  LUCRO_REAL:      "#808CFF",
};

function CardSimulacao({ sim, onClick, onDelete }) {
  const [conf, setConf] = useState(false);
  const cor = REGIME_COR[sim.regime] || "#6670B8";
  const data = new Date(sim.updated_at).toLocaleDateString("pt-BR");

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "18px 20px", cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)50"; e.currentTarget.style.boxShadow = "0 4px 20px #808CFF10"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Ícone */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `${cor}18`, border: `1px solid ${cor}40`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
      }}>📊</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {sim.razao_social || "Empresa sem nome"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sim.cnpj && (
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              {sim.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, color: cor,
            background: `${cor}15`, padding: "2px 8px", borderRadius: 20,
          }}>
            {REGIME_LABEL[sim.regime] || sim.regime}
          </span>
          {sim.uf && (
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{sim.uf}</span>
          )}
        </div>
      </div>

      {/* Data + Delete */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}
        onClick={e => e.stopPropagation()}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{data}</span>
        {conf ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { onDelete(sim.id); setConf(false); }} style={{
              padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: "#ef444420", border: "1px solid #ef4444", color: "#ef4444", cursor: "pointer",
            }}>Confirmar</button>
            <button onClick={() => setConf(false)} style={{
              padding: "4px 10px", borderRadius: 8, fontSize: 11,
              background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer",
            }}>Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setConf(true)} style={{
            width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)",
            background: "transparent", color: "var(--muted)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>🗑</button>
        )}
      </div>
    </div>
  );
}

export default function ReformaDashboard() {
  const router  = useRouter();
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [user, setUser]       = useState(null);
  const [sims, setSims]       = useState([]);
  const [quota, setQuota]     = useState({ usado: 0, limite: 30, plano: "essencial" });
  const [busca, setBusca]     = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
  }, [router]);

  const carregar = useCallback(async (q = "") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/reforma-lista?busca=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await r.json();
      setSims(json.simulacoes || []);
      setQuota(json.quota || { usado: 0, limite: 30, plano: "essencial" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) carregar(); }, [user, carregar]);

  const handleDelete = async (id) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    // Remove localmente — sem API de delete (usar Supabase client diretamente)
    const { error } = await supabase
      .from("simulacoes_reforma")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);
    if (!error) setSims(prev => prev.filter(s => s.id !== id));
  };

  if (!user || carregandoPlano) return null;

  if (!pode("reforma")) {
    return (
      <Layout user={user}>
        <CardBloqueado ferramenta="reforma" planoNecessario="profissional" />
      </Layout>
    );
  }

  const limiteBaixo = quota.limite && quota.usado >= quota.limite * 0.8;
  const limiteAtingido = quota.limite && quota.usado >= quota.limite;
  const pctUso = quota.limite ? Math.min(100, (quota.usado / quota.limite) * 100) : 0;

  return (
    <>
      <Head>
        <title>Simulador da Reforma Tributária — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 860, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>
                Simulador da Reforma Tributária
              </h1>
              <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
                IBS + CBS — Impacto da LC 214/2025 para o seu cliente
              </p>
            </div>
            <button
              onClick={() => limiteAtingido ? null : router.push("/reforma/nova")}
              disabled={limiteAtingido}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: limiteAtingido
                  ? "var(--bg-input)"
                  : "linear-gradient(135deg, #DF9F20, #B27F1A)",
                border: "none",
                color: limiteAtingido ? "var(--muted)" : "#000",
                cursor: limiteAtingido ? "not-allowed" : "pointer",
                boxShadow: limiteAtingido ? "none" : "0 4px 20px #DF9F2030",
                whiteSpace: "nowrap",
              }}
            >
              ＋ Nova Simulação
            </button>
          </div>

          {/* Banner de quota */}
          {quota.limite && (
            <div style={{
              background: limiteAtingido ? "#ef444415" : limiteBaixo ? "#DF9F2012" : "var(--bg-card)",
              border: `1px solid ${limiteAtingido ? "#ef444440" : limiteBaixo ? "#DF9F2040" : "var(--border)"}`,
              borderRadius: 12, padding: "14px 18px", marginBottom: 20,
              display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: limiteAtingido ? "#ef4444" : limiteBaixo ? "#DF9F20" : "var(--text)", marginBottom: 6 }}>
                  {limiteAtingido
                    ? "⛔ Limite mensal atingido"
                    : limiteBaixo
                      ? `⚠️ ${quota.usado}/${quota.limite} simulações usadas este mês`
                      : `📊 ${quota.usado}/${quota.limite} simulações usadas este mês`}
                </div>
                <div style={{ height: 6, background: "var(--bg-input)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    width: `${pctUso}%`, height: "100%", borderRadius: 3,
                    background: limiteAtingido ? "#ef4444" : limiteBaixo ? "#DF9F20" : "var(--primary)",
                    transition: "width 0.3s",
                  }} />
                </div>
              </div>
              {(limiteBaixo || limiteAtingido) && (
                <button onClick={() => router.push("/assinatura")} style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: "linear-gradient(135deg, #808CFF, #6366f1)", border: "none",
                  color: "#fff", cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  Fazer upgrade →
                </button>
              )}
            </div>
          )}

          {/* Busca */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--muted)" }}>🔍</span>
            <input
              type="text"
              value={busca}
              onChange={e => { setBusca(e.target.value); carregar(e.target.value); }}
              placeholder="Buscar por razão social..."
              style={{
                width: "100%", padding: "12px 14px 12px 42px", borderRadius: 10, fontSize: 14,
                background: "var(--bg-input)", border: "1px solid var(--border)",
                color: "var(--text)", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Lista */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)", fontSize: 14 }}>
              Carregando simulações...
            </div>
          ) : sims.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "60px 20px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 16,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                {busca ? "Nenhuma simulação encontrada" : "Nenhuma simulação criada ainda"}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
                {busca
                  ? "Tente uma busca diferente"
                  : "Crie sua primeira simulação para apresentar ao seu cliente como a Reforma Tributária vai impactá-lo."}
              </div>
              {!busca && !limiteAtingido && (
                <button onClick={() => router.push("/reforma/nova")} style={{
                  padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: "linear-gradient(135deg, #DF9F20, #B27F1A)", border: "none",
                  color: "#000", cursor: "pointer",
                }}>
                  Criar primeira simulação
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sims.map(sim => (
                <CardSimulacao
                  key={sim.id}
                  sim={sim}
                  onClick={() => router.push(`/reforma/${sim.id}`)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Rodapé legal */}
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 32, textAlign: "center", lineHeight: 1.6 }}>
            Simulações baseadas na LC 214/2025, EC 132/2023 e LC 227/2026. Caráter estimativo — consulte sempre seu assessor tributário.
          </p>
        </div>
      </Layout>
    </>
  );
}
