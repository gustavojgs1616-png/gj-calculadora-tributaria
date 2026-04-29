import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { calcSimples, calcLP, calcLR, fmt, pct, parseVal, fmtInput } from "../components/calculos";
import { gerarPDF } from "../components/gerarPDF";

// ─── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ user, etapa, resultados, onNova, onHistorico, dadosPDF }) {
  const router = useRouter();
  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "#0d0d14", borderBottom: "1px solid #1e1e2e",
      padding: "12px 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg,#f5a623,#c8831a)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>⚖️</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f5a623" }}>GJ Calculadora</div>
          <div style={{ fontSize: 11, color: "#6b6b8a" }}>{user?.email}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-ghost" onClick={onHistorico} style={{ fontSize: 13, padding: "8px 14px" }}>
          📋 Histórico
        </button>
        {etapa === 3 && resultados.length > 0 && (
          <button className="btn-ghost" onClick={() => gerarPDF(dadosPDF)} style={{ fontSize: 13, padding: "8px 14px", borderColor: "#f5a623", color: "#f5a623" }}>
            📄 PDF
          </button>
        )}
        <button className="btn-ghost" onClick={onNova} style={{ fontSize: 13, padding: "8px 14px" }}>
          ＋ Nova
        </button>
        <button className="btn-ghost" onClick={handleSair} style={{ fontSize: 13, padding: "8px 14px", borderColor: "#ef4444", color: "#ef4444" }}>
          Sair
        </button>
      </div>
    </div>
  );
}

// ─── Indicador de etapas ───────────────────────────────────────────────────────
function StepIndicator({ etapa }) {
  const steps = ["Dados da Empresa", "Custos e Encargos", "Resultados"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 32 }}>
      {steps.map((s, i) => {
        const n = i + 1;
        const ativo = etapa === n;
        const feito = etapa > n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: 14,
                background: feito ? "#f5a623" : ativo ? "linear-gradient(135deg,#f5a623,#c8831a)" : "#16161f",
                color: (ativo || feito) ? "#fff" : "#6b6b8a",
                border: ativo ? "2px solid #f5a623" : feito ? "2px solid #f5a623" : "2px solid #1e1e2e",
                boxShadow: ativo ? "0 0 16px #f5a62344" : "none",
              }}>
                {feito ? "✓" : n}
              </div>
              <span style={{ fontSize: 11, color: ativo ? "#f5a623" : feito ? "#f5a623" : "#6b6b8a", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 60, height: 2, background: feito ? "#f5a623" : "#1e1e2e", margin: "0 4px", marginBottom: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Atividade selector ────────────────────────────────────────────────────────
const atividades = [
  { id: "comercio", label: "Comércio", icon: "🛒" },
  { id: "industria", label: "Indústria", icon: "🏭" },
  { id: "servicos", label: "Serviços", icon: "💼" },
  { id: "contabil", label: "Contábil / Jurídico", icon: "⚖️" },
];

// ─── Card de regime ────────────────────────────────────────────────────────────
function RegimeCard({ r, maxAnual, melhor }) {
  const [expandido, setExpandido] = useState(false);
  const isMelhor = r.regime === melhor?.regime;
  const barra = maxAnual > 0 ? (r.anual / maxAnual) * 100 : 0;

  return (
    <div style={{
      background: "#111118", border: `2px solid ${isMelhor ? r.cor : "#1e1e2e"}`,
      borderRadius: 14, padding: 20, position: "relative",
      boxShadow: isMelhor ? `0 0 30px ${r.cor}22` : "none",
    }}>
      {isMelhor && (
        <div style={{
          position: "absolute", top: -12, left: 20,
          background: r.cor, color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "3px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          ★ Mais vantajoso
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: r.cor }}>{r.regime}</div>
          <div style={{ fontSize: 12, color: "#6b6b8a", marginTop: 2 }}>{r.detalhe}</div>
        </div>
        <div style={{
          background: r.cor + "22", color: r.cor, padding: "4px 12px",
          borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
        }}>
          {pct(r.aliqEfetiva)}
        </div>
      </div>

      {/* Barra proporcional */}
      <div style={{ background: "#16161f", borderRadius: 4, height: 6, marginBottom: 14, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4, background: r.cor,
          width: `${barra}%`, transition: "width 0.8s ease",
        }} />
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Anual</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(r.anual)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mensal</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(r.mensal)}</div>
        </div>
      </div>

      <button
        onClick={() => setExpandido(!expandido)}
        style={{ background: "none", color: "#6b6b8a", fontSize: 12, padding: "4px 0", width: "100%", textAlign: "left" }}
      >
        {expandido ? "▲ Ocultar composição" : "▼ Ver composição detalhada"}
      </button>

      {expandido && (
        <div style={{ marginTop: 12, borderTop: "1px solid #1e1e2e", paddingTop: 12 }}>
          {r.itens.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e1e2e16", fontSize: 13 }}>
              <span style={{ color: "#a0a0b8" }}>{item.label}</span>
              <span style={{ fontWeight: 600 }}>{fmt(item.valor)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Histórico modal ───────────────────────────────────────────────────────────
function HistoricoModal({ onClose, onCarregar }) {
  const [sims, setSims] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("simulacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setSims(data || []);
      setCarregando(false);
    })();
  }, []);

  const deletar = async (id) => {
    await supabase.from("simulacoes").delete().eq("id", id);
    setSims((prev) => prev.filter((s) => s.id !== id));
  };

  const atividadeLabel = { comercio: "Comércio", industria: "Indústria", servicos: "Serviços", contabil: "Contábil/Jurídico" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#111118", border: "1px solid #1e1e2e", borderRadius: 16,
        width: "100%", maxWidth: 640, maxHeight: "80vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e1e2e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Histórico de Simulações</h3>
          <button onClick={onClose} style={{ background: "none", color: "#6b6b8a", fontSize: 20, padding: 0 }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 24px", flex: 1 }}>
          {carregando && <div style={{ color: "#6b6b8a", textAlign: "center", padding: 32 }}>Carregando...</div>}
          {!carregando && sims.length === 0 && (
            <div style={{ color: "#6b6b8a", textAlign: "center", padding: 32 }}>Nenhuma simulação salva ainda.</div>
          )}
          {sims.map((s) => (
            <div key={s.id} style={{
              background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 10,
              padding: "14px 16px", marginBottom: 10, display: "flex",
              justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{s.empresa || "Sem nome"}</div>
                <div style={{ fontSize: 12, color: "#6b6b8a", marginTop: 2 }}>
                  {atividadeLabel[s.atividade] || s.atividade} • {new Date(s.created_at).toLocaleDateString("pt-BR")}
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  <span style={{ color: "#f5a623", fontWeight: 600 }}>{s.regime_recomendado}</span>
                  {" • "}{fmt(s.imposto_anual)}/ano
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: "6px 12px" }}
                  onClick={() => { onCarregar(s); onClose(); }}
                >
                  Abrir
                </button>
                <button
                  className="btn-danger"
                  style={{ fontSize: 12, padding: "6px 12px" }}
                  onClick={() => deletar(s.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function CalculadoraPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [etapa, setEtapa] = useState(1);
  const [showHistorico, setShowHistorico] = useState(false);

  // Formulário
  const [empresa, setEmpresa] = useState("");
  const [fatMensal, setFatMensal] = useState("");
  const [atividade, setAtividade] = useState("servicos");
  const [folha, setFolha] = useState("");
  const [custos, setCustos] = useState("");

  // Resultados
  const [resultados, setResultados] = useState([]);
  const [melhor, setMelhor] = useState(null);
  const [economia, setEconomia] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const fatAnual = parseVal(fatMensal) * 12;
  const folhaVal = parseVal(folha);
  const custosVal = parseVal(custos);

  const calcular = async () => {
    const simples = calcSimples(fatAnual, atividade === "contabil" ? "servicos" : atividade);
    const lp = calcLP(fatAnual, atividade === "contabil" ? "servicos" : atividade, folhaVal);
    const lr = calcLR(fatAnual, folhaVal, custosVal);

    const todos = [simples, lp, lr].filter(Boolean);
    todos.sort((a, b) => a.anual - b.anual);

    const melhorR = todos[0];
    const piorR = todos[todos.length - 1];
    const eco = piorR.anual - melhorR.anual;

    setResultados(todos);
    setMelhor(melhorR);
    setEconomia(eco);
    setEtapa(3);

    // Salvar no Supabase
    try {
      await supabase.from("simulacoes").insert({
        user_id: user.id,
        empresa, atividade,
        faturamento_mensal: parseVal(fatMensal),
        faturamento_anual: fatAnual,
        folha_mensal: folhaVal,
        custos_mensais: custosVal,
        regime_recomendado: melhorR.regime,
        imposto_anual: melhorR.anual,
        aliquota_efetiva: melhorR.aliqEfetiva,
        resultados: todos,
      });
    } catch (_) {}
  };

  const nova = () => {
    setEtapa(1); setResultados([]); setMelhor(null); setEconomia(0);
    setEmpresa(""); setFatMensal(""); setFolha(""); setCustos(""); setAtividade("servicos");
  };

  const carregarSim = (s) => {
    setEmpresa(s.empresa || "");
    setFatMensal(fmtInput(String(s.faturamento_mensal)));
    setAtividade(s.atividade);
    setFolha(fmtInput(String(s.folha_mensal)));
    setCustos(fmtInput(String(s.custos_mensais)));
    if (s.resultados) {
      const todos = s.resultados;
      const melhorR = todos.reduce((a, b) => a.anual < b.anual ? a : b);
      const piorR = todos.reduce((a, b) => a.anual > b.anual ? a : b);
      setResultados(todos);
      setMelhor(melhorR);
      setEconomia(piorR.anual - melhorR.anual);
      setEtapa(3);
    }
  };

  const dadosPDF = {
    empresa, faturamentoAnual: fatAnual, atividade,
    folha: folhaVal, custos: custosVal,
    resultados, melhor, economia,
  };

  const maxAnual = resultados.length > 0 ? Math.max(...resultados.map((r) => r.anual)) : 1;

  if (!user) return null;

  return (
    <>
      <Head>
        <title>GJ Calculadora Tributária</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Topbar
        user={user} etapa={etapa} resultados={resultados}
        onNova={nova} onHistorico={() => setShowHistorico(true)}
        dadosPDF={dadosPDF}
      />

      {showHistorico && (
        <HistoricoModal onClose={() => setShowHistorico(false)} onCarregar={carregarSim} />
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
        <StepIndicator etapa={etapa} />

        {/* ─── ETAPA 1 ─── */}
        {etapa === 1 && (
          <div className="card">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Dados da Empresa</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label className="label">Nome da empresa (opcional)</label>
                <input
                  type="text" value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ex: Empresa ABC Ltda"
                />
              </div>

              <div>
                <label className="label">Faturamento mensal (R$)</label>
                <input
                  type="text" value={fatMensal}
                  onChange={(e) => setFatMensal(fmtInput(e.target.value))}
                  placeholder="0,00"
                />
                {fatAnual > 0 && (
                  <div style={{ marginTop: 6, fontSize: 13, color: "#f5a623" }}>
                    Faturamento anual: <strong>{fmt(fatAnual)}</strong>
                    {fatAnual > 4800000 && (
                      <span style={{ color: "#f59e0b", marginLeft: 8 }}>
                        ⚠️ Acima do limite do Simples (R$ 4,8M)
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Atividade principal</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 4 }}>
                  {atividades.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAtividade(a.id)}
                      style={{
                        background: atividade === a.id ? "linear-gradient(135deg,#f5a623,#c8831a)" : "#16161f",
                        border: `2px solid ${atividade === a.id ? "#f5a623" : "#1e1e2e"}`,
                        borderRadius: 10, padding: "14px 12px",
                        color: atividade === a.id ? "#fff" : "#a0a0b8",
                        fontWeight: 600, fontSize: 14,
                        display: "flex", alignItems: "center", gap: 8,
                        boxShadow: atividade === a.id ? "0 0 16px #f5a62333" : "none",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 28 }}
              disabled={!fatMensal || parseVal(fatMensal) === 0}
              onClick={() => setEtapa(2)}
            >
              Próximo →
            </button>
          </div>
        )}

        {/* ─── ETAPA 2 ─── */}
        {etapa === 2 && (
          <div className="card">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Custos e Encargos</h2>

            <div style={{
              background: "#16161f", borderRadius: 10, padding: "12px 16px",
              marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Faturamento Anual</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f5a623" }}>{fmt(fatAnual)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Atividade</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {atividades.find((a) => a.id === atividade)?.label}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label className="label">Folha de pagamento mensal (R$)</label>
                <input
                  type="text" value={folha}
                  onChange={(e) => setFolha(fmtInput(e.target.value))}
                  placeholder="0,00"
                />
                <div style={{ fontSize: 12, color: "#6b6b8a", marginTop: 4 }}>
                  Inclui salários, pró-labore e benefícios
                </div>
              </div>

              <div>
                <label className="label">Custos e despesas mensais (R$)</label>
                <input
                  type="text" value={custos}
                  onChange={(e) => setCustos(fmtInput(e.target.value))}
                  placeholder="0,00"
                />
                <div style={{ fontSize: 12, color: "#6b6b8a", marginTop: 4 }}>
                  Exceto folha de pagamento — aluguel, fornecedores, etc.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setEtapa(1)}>
                ← Voltar
              </button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={calcular}>
                Calcular regimes →
              </button>
            </div>
          </div>
        )}

        {/* ─── ETAPA 3 — RESULTADOS ─── */}
        {etapa === 3 && resultados.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Destaque melhor regime */}
            <div style={{
              background: "linear-gradient(135deg,#f5a623,#c8831a)",
              borderRadius: 16, padding: 24,
              boxShadow: "0 0 40px #f5a62333",
            }}>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.85, marginBottom: 6 }}>
                Regime mais vantajoso
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>{melhor.regime}</div>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Imposto Anual</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(melhor.anual)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Imposto Mensal</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt(melhor.mensal)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Alíquota Efetiva</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{pct(melhor.aliqEfetiva)}</div>
                </div>
              </div>
            </div>

            {/* Economia */}
            {economia > 0 && (
              <div style={{
                background: "#0f2d1a", border: "2px solid #22c55e",
                borderRadius: 12, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{ fontSize: 28 }}>💰</div>
                <div>
                  <div style={{ fontSize: 13, color: "#86efac", fontWeight: 600 }}>
                    Economia em relação ao regime mais caro
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e" }}>
                    {fmt(economia)}/ano
                  </div>
                  <div style={{ fontSize: 13, color: "#86efac" }}>{fmt(economia / 12)}/mês</div>
                </div>
              </div>
            )}

            {/* Cards dos regimes */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Comparativo Completo
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {resultados.map((r) => (
                  <RegimeCard key={r.regime} r={r} maxAnual={maxAnual} melhor={melhor} />
                ))}
              </div>
            </div>

            {/* Simples indisponível */}
            {fatAnual > 4800000 && (
              <div style={{
                background: "#2d1a0f", border: "1px solid #f59e0b",
                borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#fcd34d",
              }}>
                ⚠️ <strong>Simples Nacional não disponível</strong> — faturamento anual acima de R$ 4,8 milhões.
              </div>
            )}

            {/* Ações */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                className="btn-ghost"
                style={{ flex: 1, borderColor: "#f5a623", color: "#f5a623" }}
                onClick={() => gerarPDF(dadosPDF)}
              >
                📄 Exportar PDF
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={nova}>
                ＋ Nova Simulação
              </button>
            </div>

            <div style={{ fontSize: 11, color: "#6b6b8a", textAlign: "center", lineHeight: 1.6 }}>
              Simulação salva automaticamente. Os valores são estimativas baseadas nas alíquotas vigentes.
              Consulte um contador para decisões tributárias.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
