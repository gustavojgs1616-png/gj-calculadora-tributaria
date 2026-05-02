import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import { useAssinatura } from "../../lib/AssinaturaContext";

// Recharts — dynamic import (evita SSR)
const LineChart  = dynamic(() => import("recharts").then(m => m.LineChart),  { ssr: false });
const Line       = dynamic(() => import("recharts").then(m => m.Line),       { ssr: false });
const XAxis      = dynamic(() => import("recharts").then(m => m.XAxis),      { ssr: false });
const YAxis      = dynamic(() => import("recharts").then(m => m.YAxis),      { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip    = dynamic(() => import("recharts").then(m => m.Tooltip),    { ssr: false });
const Legend     = dynamic(() => import("recharts").then(m => m.Legend),     { ssr: false });
const ResponsiveContainer = dynamic(
  () => import("recharts").then(m => m.ResponsiveContainer), { ssr: false }
);

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmtR  = (v) => `R$ ${Math.abs(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;
const fmtRK = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1000000) return `R$ ${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000)    return `R$ ${(abs / 1000).toFixed(0)}k`;
  return fmtR(abs);
};

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

// ── Sub-componentes ──────────────────────────────────────────────────────────

function CardMetrica({ titulo, valor, sub, cor, grande }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: `1px solid ${cor}30`,
      borderRadius: 14, padding: grande ? "22px 24px" : "18px 20px",
      borderLeft: `4px solid ${cor}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {titulo}
      </div>
      <div style={{ fontSize: grande ? 28 : 22, fontWeight: 800, color: cor, lineHeight: 1 }}>
        {valor}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {fmtRK(p.value)}
        </div>
      ))}
    </div>
  );
}

function GraficoTransicao({ dados }) {
  if (!dados?.length) return null;

  const dataFormatada = dados.map(d => ({
    ano: String(d.ano),
    "Sistema antigo": Math.round(d.tributosAntigos || 0),
    "Sistema novo":   Math.round(d.tributosNovos   || 0),
    "Total":          Math.round(d.total           || 0),
  }));

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataFormatada} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="ano" tick={{ fill: "#6670B8", fontSize: 11 }} />
          <YAxis tickFormatter={fmtRK} tick={{ fill: "#6670B8", fontSize: 11 }} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#6670B8" }} />
          <Line type="monotone" dataKey="Sistema antigo" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Sistema novo"   stroke="#808CFF" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Total"          stroke="#DF9F20" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TabelaTransicao({ dados }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Ano", "Sist. Antigo", "Sist. Novo", "Total", "Alíq. Efetiva", "Observação"].map(h => (
              <th key={h} style={{
                padding: "10px 12px", textAlign: h === "Ano" ? "center" : "right",
                color: "var(--muted)", fontWeight: 700, fontSize: 11, textTransform: "uppercase",
                borderBottom: "1px solid var(--border)", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados?.map((d, i) => (
            <tr key={d.ano} style={{ background: i % 2 === 0 ? "transparent" : "#ffffff04" }}>
              <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "var(--text)" }}>{d.ano}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: "#f59e0b" }}>{fmtR(d.tributosAntigos)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: "#808CFF" }}>{fmtR(d.tributosNovos)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--text)" }}>{fmtR(d.total)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)" }}>{fmtPct((d.aliquotaEfetiva || 0) * 100)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)", fontSize: 11, maxWidth: 200 }}>
                {d.nota || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardRegime({ r, melhor }) {
  const cor = REGIME_COR[r.regime] || "#6670B8";
  const isMelhor = r.regime === melhor;
  return (
    <div style={{
      background: isMelhor ? `${cor}12` : "var(--bg-input)",
      border: `1px solid ${isMelhor ? cor + "50" : "var(--border)"}`,
      borderRadius: 12, padding: "14px 16px",
      position: "relative",
    }}>
      {isMelhor && (
        <div style={{
          position: "absolute", top: -8, right: 12,
          background: cor, color: "#000", fontSize: 10, fontWeight: 800,
          padding: "2px 8px", borderRadius: 20,
        }}>✓ RECOMENDADO</div>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, color: cor, marginBottom: 6 }}>
        {REGIME_LABEL[r.regime] || r.regime}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
        {fmtR(r.impostoAnual)}
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginLeft: 6 }}>/ ano</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>
        Alíquota efetiva: {fmtPct((r.aliquotaEfetiva || 0) * 100)}
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function ResultadoSimulacao() {
  const router = useRouter();
  const { id } = router.query;
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [user, setUser]         = useState(null);
  const [sim, setSim]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState("");
  const [copiado, setCopiado]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setUser(session.user);
    });
  }, [router]);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`/api/reforma-buscar?id=${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!r.ok) { setErro("Simulação não encontrada."); setLoading(false); return; }
      const json = await r.json();
      setSim(json.simulacao);
      setLoading(false);
    })();
  }, [user, id]);

  const handleImprimir = () => {
    window.print();
  };

  if (!user || carregandoPlano) return null;
  if (!pode("reforma")) { router.replace("/reforma"); return null; }

  if (loading) {
    return (
      <Layout user={user}>
        <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
          Carregando resultado...
        </div>
      </Layout>
    );
  }

  if (erro) {
    return (
      <Layout user={user}>
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: "var(--muted)" }}>{erro}</div>
          <button onClick={() => router.push("/reforma")} style={{
            marginTop: 20, padding: "10px 24px", borderRadius: 10, fontSize: 14,
            background: "var(--primary-glow)", border: "1px solid var(--primary)",
            color: "var(--primary)", cursor: "pointer",
          }}>← Voltar</button>
        </div>
      </Layout>
    );
  }

  const res   = sim?.resultados;
  const dados = sim?.dados;

  if (!res) return null;

  const { baseline, reformaPlena, comparativo, transicao, recomendacao, variacao } = res;
  const direcao = variacao?.direcao || "NEUTRO";
  const corVar  = direcao === "REDUCAO" ? "#22c55e" : direcao === "AUMENTO" ? "#ef4444" : "#6670B8";
  const sinalVar = direcao === "REDUCAO" ? "▼" : direcao === "AUMENTO" ? "▲" : "→";

  const data = new Date(sim.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <>
      <Head>
        <title>Resultado — {sim.razao_social || "Simulação"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .main-content { padding: 0 !important; }
            body { background: #fff !important; color: #000 !important; }
            [data-theme] { --bg-card: #fff; --text: #000; --muted: #666; --border: #ddd; --bg-input: #f5f5f5; }
          }
        `}</style>
      </Head>

      <Layout user={user}>
        <div style={{ padding: "28px 28px", maxWidth: 900, margin: "0 auto" }}>

          {/* ── Cabeçalho ── */}
          <div className="no-print" style={{ marginBottom: 24 }}>
            <button onClick={() => router.push("/reforma")} style={{
              background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
              fontSize: 13, padding: 0, marginBottom: 12,
            }}>
              ← Voltar às simulações
            </button>
          </div>

          {/* Ident. da empresa */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "20px 24px", marginBottom: 20,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "var(--text)" }}>
                {sim.razao_social || "Empresa"}
              </h1>
              <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                {sim.cnpj && <span style={{ fontSize: 12, color: "var(--muted)" }}>{sim.cnpj}</span>}
                {sim.uf   && <span style={{ fontSize: 12, color: "var(--muted)" }}>{sim.municipio ? `${sim.municipio} · ${sim.uf}` : sim.uf}</span>}
                {sim.cnae && <span style={{ fontSize: 12, color: "var(--muted)" }}>CNAE {sim.cnae}</span>}
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Simulado em {data}</span>
              </div>
            </div>
            <div className="no-print" style={{ display: "flex", gap: 8 }}>
              <button onClick={() => router.push(`/reforma/nova?editar=${id}`)} style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "var(--bg-input)", border: "1px solid var(--border)",
                color: "var(--muted)", cursor: "pointer",
              }}>✏️ Editar</button>
              <button onClick={handleImprimir} style={{
                padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: "linear-gradient(135deg, #DF9F20, #B27F1A)", border: "none",
                color: "#000", cursor: "pointer",
              }}>📄 Gerar PDF</button>
            </div>
          </div>

          {/* ── 3 métricas principais ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
            <CardMetrica
              titulo="Carga atual (2025)"
              valor={fmtR(baseline?.impostoAnual)}
              sub={`Alíquota efetiva: ${fmtPct((baseline?.aliquotaEfetiva || 0) * 100)}`}
              cor="#f59e0b"
            />
            <CardMetrica
              titulo="Carga pós-Reforma (2033)"
              valor={fmtR(reformaPlena?.impostoAnual)}
              sub={`Alíquota efetiva: ${fmtPct((reformaPlena?.aliquotaEfetiva || 0) * 100)}`}
              cor="#808CFF"
            />
            <CardMetrica
              titulo={direcao === "REDUCAO" ? "Economia estimada" : direcao === "AUMENTO" ? "Acréscimo estimado" : "Variação"}
              valor={`${sinalVar} ${fmtPct(Math.abs(variacao?.percentual || 0))}`}
              sub={`${direcao === "REDUCAO" ? "−" : "+"}${fmtR(variacao?.absoluta)} por ano`}
              cor={corVar}
              grande
            />
          </div>

          {/* Layout de duas colunas no resultado */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

            {/* ── Coluna principal ── */}
            <div style={{ minWidth: 0 }}>

              {/* Gráfico de transição */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px 24px", marginBottom: 20,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>
                  📈 Evolução da Carga Tributária 2025–2033
                </h3>
                <GraficoTransicao dados={transicao} />
              </div>

              {/* Tabela detalhada */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px 24px", marginBottom: 20,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
                  📋 Projeção Ano a Ano
                </h3>
                <TabelaTransicao dados={transicao} />
              </div>

              {/* Breakdown atual */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px 24px", marginBottom: 20,
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
                  🔍 Detalhamento — Sistema Atual
                </h3>
                {baseline?.breakdown?.map((b, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: "1px solid var(--border)",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{b.tributo}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{fmtR(b.valor)}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{fmtPct((b.percentual || 0) * 100)}</div>
                    </div>
                  </div>
                ))}
                {baseline?.nota && (
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>ℹ️ {baseline.nota}</p>
                )}
              </div>

              {/* Breakdown reforma */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px 24px",
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
                  🔍 Detalhamento — Sistema Pós-Reforma (2033)
                </h3>
                {reformaPlena?.breakdown?.map((b, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: "1px solid var(--border)",
                  }}>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{b.tributo}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#808CFF" }}>{fmtR(b.valor)}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{fmtPct((b.percentual || 0) * 100)}</div>
                    </div>
                  </div>
                ))}
                {reformaPlena?.nota && (
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>ℹ️ {reformaPlena.nota}</p>
                )}
              </div>
            </div>

            {/* ── Coluna lateral ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Recomendação */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--primary)30",
                borderRadius: 14, padding: "20px", borderLeft: "4px solid var(--primary)",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "var(--primary)" }}>
                  💡 Recomendação
                </h3>
                <div style={{
                  background: `${REGIME_COR[recomendacao?.melhorRegime] || "#808CFF"}15`,
                  border: `1px solid ${REGIME_COR[recomendacao?.melhorRegime] || "#808CFF"}40`,
                  borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, fontWeight: 700,
                  color: REGIME_COR[recomendacao?.melhorRegime] || "#808CFF",
                }}>
                  ✓ {REGIME_LABEL[recomendacao?.melhorRegime] || recomendacao?.melhorRegime}
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                  {recomendacao?.textoRecomendacao}
                </p>

                {recomendacao?.alertas?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {recomendacao.alertas.map((a, i) => (
                      <div key={i} style={{
                        background: a.tipo === "BENEFICIO" ? "#22c55e12" : a.tipo === "ATENCAO" ? "#f59e0b12" : "#808CFF12",
                        border: `1px solid ${a.tipo === "BENEFICIO" ? "#22c55e30" : a.tipo === "ATENCAO" ? "#f59e0b30" : "#808CFF30"}`,
                        borderRadius: 8, padding: "8px 10px", marginBottom: 6,
                        fontSize: 11, color: "var(--muted)", lineHeight: 1.5,
                      }}>
                        {a.emoji} {a.texto}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comparativo de regimes */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>
                  ⚖️ Comparativo de Regimes (2033)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {comparativo
                    ?.slice()
                    .sort((a, b) => a.impostoAnual - b.impostoAnual)
                    .map((r, i) => (
                      <CardRegime key={i} r={r} melhor={recomendacao?.melhorRegime} />
                    ))}
                </div>
              </div>

              {/* Próximos passos */}
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>
                  🗓 Datas-chave
                </h3>
                {[
                  { ano: "2026", desc: "Fase de teste IBS+CBS (impacto ≈ zero)" },
                  { ano: "2027", desc: "PIS/COFINS extintos · CBS plena" },
                  { ano: "2029", desc: "Início da migração ICMS/ISS → IBS" },
                  { ano: "2033", desc: "Sistema pleno · ICMS e ISS extintos" },
                ].map(({ ano, desc }) => (
                  <div key={ano} style={{
                    display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start",
                  }}>
                    <div style={{
                      background: "var(--primary-glow)", border: "1px solid var(--primary)40",
                      borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800,
                      color: "var(--primary)", flexShrink: 0,
                    }}>{ano}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Disclaimer legal */}
          <div style={{
            marginTop: 28, padding: "14px 18px", borderRadius: 10,
            background: "var(--bg-input)", border: "1px solid var(--border)",
            fontSize: 11, color: "var(--muted)", lineHeight: 1.6,
          }}>
            <strong>⚠️ Aviso legal:</strong> Esta simulação tem caráter informativo e estimativo, baseada na regulamentação
            vigente (EC 132/2023, LC 214/2025, LC 227/2026). As alíquotas definitivas do IBS e CBS serão calibradas
            pelo Senado Federal entre 2027 e 2028. Consulte sempre seu assessor tributário para análise específica do seu caso.
          </div>
        </div>
      </Layout>
    </>
  );
}
