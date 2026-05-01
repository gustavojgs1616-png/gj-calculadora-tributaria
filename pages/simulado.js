import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import { useAssinatura } from "../lib/AssinaturaContext";
import CardBloqueado from "../components/CardBloqueado";
import {
  AREAS, QUESTOES, DISTRIBUICAO_COMPLETO, DISTRIBUICAO_RAPIDO,
  selecionarQuestoes, shuffle,
} from "../lib/questoes_cfc";

function fmtTempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const COR_AREA = {
  "Contabilidade Geral":       "#3b82f6",
  "Contabilidade de Custos":   "#22c55e",
  "Análise das Demonstrações": "#8b5cf6",
  "Auditoria e Perícia":       "#f97316",
  "Contabilidade Tributária":  "#DF9F20",
  "Legislação e Ética":        "#ec4899",
  "Contabilidade Pública":     "#06b6d4",
};

// ── Gauge circular ─────────────────────────────────────────────────────────────
function GaugeCircular({ pct, aprovado, size = 140 }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const cor = pct >= 80 ? "#22c55e" : pct >= 60 ? "#DF9F20" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={12} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cor} strokeWidth={12}
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: cor, fontSize: size * 0.22, fontWeight: 900, fontFamily: "inherit", transform: `rotate(90deg) translate(0,0)` }}
        transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {pct}%
      </text>
      <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: "var(--muted)", fontSize: size * 0.11, fontFamily: "inherit" }}
        transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {aprovado ? "APROVADO" : pct >= 40 ? "ESTUDAR MAIS" : "REPROVADO"}
      </text>
    </svg>
  );
}

// ── Tela Histórico ─────────────────────────────────────────────────────────────
function TelaHistorico({ userId, onIniciar }) {
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch(`/api/simulado-historico?user_id=${userId}`)
      .then((r) => r.json())
      .then(({ data }) => { setHistorico(data || []); setCarregando(false); })
      .catch(() => setCarregando(false));
  }, [userId]);

  const melhor = historico.length ? Math.max(...historico.map((h) => h.percentual)) : null;
  const media = historico.length ? Math.round(historico.reduce((a, h) => a + h.percentual, 0) / historico.length) : null;
  const aprovacoes = historico.filter((h) => h.aprovado).length;

  if (carregando) return <div style={{ padding: 32, color: "var(--muted)", textAlign: "center" }}>Carregando histórico...</div>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {historico.length === 0 ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Nenhum simulado realizado ainda</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>Complete seu primeiro simulado para ver o histórico aqui</div>
          <button onClick={onIniciar} style={{
            padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none", color: "#000", cursor: "pointer",
          }}>
            Iniciar Primeiro Simulado
          </button>
        </div>
      ) : (
        <>
          {/* Estatísticas gerais */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Melhor resultado", valor: `${melhor}%`, cor: "#22c55e" },
              { label: "Média geral", valor: `${media}%`, cor: "#DF9F20" },
              { label: "Aprovações", valor: `${aprovacoes}/${historico.length}`, cor: "#3b82f6" },
            ].map(({ label, valor, cor }) => (
              <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: cor }}>{valor}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Lista de simulados */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {historico.map((h) => {
              const cor = h.percentual >= 80 ? "#22c55e" : h.percentual >= 60 ? "#DF9F20" : "#ef4444";
              return (
                <div key={h.id} style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderLeft: `4px solid ${cor}`, borderRadius: 14, padding: "16px 20px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{fmtData(h.data_realizado)}</span>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700,
                        background: h.aprovado ? "#22c55e20" : "#ef444420",
                        color: h.aprovado ? "#22c55e" : "#ef4444",
                      }}>
                        {h.aprovado ? "APROVADO" : "REPROVADO"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      {h.total_questoes} questões · {h.corretas} corretas · {h.erradas} erradas · {h.em_branco} em branco
                      {h.tempo_segundos > 0 && ` · ${fmtTempo(h.tempo_segundos)}`}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, textTransform: "capitalize" }}>
                      Modo: {h.modo === "completo" ? "Simulado Completo" : h.modo === "rapido" ? "Prova Rápida" : h.modo === "estudo" ? "Modo Estudo" : "Por Área"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: cor }}>{h.percentual}%</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{h.corretas}/{h.total_questoes}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tela de configuração ───────────────────────────────────────────────────────
function TelaConfig({ onIniciar, userId }) {
  const [aba, setAba] = useState("configurar");
  const [modo, setModo] = useState("completo");
  const [areasEscolhidas, setAreasEscolhidas] = useState([...AREAS]);
  const [timer, setTimer] = useState(null);
  const [modoEstudo, setModoEstudo] = useState(false);

  const toggleArea = (a) =>
    setAreasEscolhidas((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const podeIniciar = modo !== "areas" || areasEscolhidas.length > 0;

  const iniciar = () => {
    let questoes;
    if (modo === "completo") questoes = selecionarQuestoes(DISTRIBUICAO_COMPLETO);
    else if (modo === "rapido") questoes = selecionarQuestoes(DISTRIBUICAO_RAPIDO);
    else {
      const disponiveis = shuffle(QUESTOES.filter((q) => areasEscolhidas.includes(q.area)));
      questoes = disponiveis.slice(0, Math.min(50, disponiveis.length));
    }
    onIniciar(questoes, timer, modo, modoEstudo);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", margin: 0 }}>Simulado CFC</h1>
        <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 13 }}>
          {QUESTOES.length} questões · Exame de Suficiência 2018–2025
        </p>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-card)", padding: 4, borderRadius: 12, border: "1px solid var(--border)" }}>
        {[{ id: "configurar", label: "Novo Simulado" }, { id: "historico", label: "Histórico" }].map(({ id, label }) => (
          <button key={id} onClick={() => setAba(id)} style={{
            flex: 1, padding: "8px", borderRadius: 9, fontSize: 13, fontWeight: aba === id ? 700 : 500,
            background: aba === id ? "var(--primary)" : "transparent",
            border: "none", color: aba === id ? "#000" : "var(--muted)", cursor: "pointer", transition: "all 0.15s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {aba === "historico" ? (
        <TelaHistorico userId={userId} onIniciar={() => setAba("configurar")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Modo */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Tipo de simulado
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { id: "completo", titulo: "Simulado Completo", desc: "50 questões · Distribuição oficial do CFC · ~4 horas" },
                { id: "rapido",   titulo: "Prova Rápida",      desc: "25 questões · Mix de todas as áreas · ~2 horas" },
                { id: "areas",    titulo: "Por Área",          desc: "Escolha as áreas que deseja praticar" },
              ].map(({ id, titulo, desc }) => (
                <div key={id} onClick={() => setModo(id)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                  borderRadius: 10, cursor: "pointer",
                  background: modo === id ? "var(--primary-glow)" : "transparent",
                  border: `1px solid ${modo === id ? "var(--primary)" : "var(--border)"}`,
                  transition: "all 0.15s",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: modo === id ? "var(--primary)" : "transparent",
                    border: `2px solid ${modo === id ? "var(--primary)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: modo === id ? "#000" : "transparent",
                  }}>✓</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: modo === id ? 700 : 500, color: modo === id ? "var(--primary)" : "var(--text)" }}>{titulo}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {modo === "areas" && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>Selecione as áreas:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AREAS.map((a) => {
                    const ativo = areasEscolhidas.includes(a);
                    return (
                      <button key={a} onClick={() => toggleArea(a)} style={{
                        padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: ativo ? 700 : 500,
                        background: ativo ? (COR_AREA[a] + "22") : "transparent",
                        border: `1px solid ${ativo ? COR_AREA[a] : "var(--border)"}`,
                        color: ativo ? COR_AREA[a] : "var(--muted)", cursor: "pointer", transition: "all 0.15s",
                      }}>
                        {a} ({QUESTOES.filter((q) => q.area === a).length})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Opções */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Opções
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Modo estudo */}
              <div onClick={() => setModoEstudo(!modoEstudo)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                background: modoEstudo ? "var(--primary-glow)" : "transparent",
                border: `1px solid ${modoEstudo ? "var(--primary)" : "var(--border)"}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: modoEstudo ? "var(--primary)" : "var(--text)" }}>Modo Estudo</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Ver resposta correta logo após responder cada questão</div>
                </div>
                <div style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: modoEstudo ? "var(--primary)" : "var(--border)",
                  display: "flex", alignItems: "center",
                  padding: "2px", transition: "background 0.2s",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    transform: modoEstudo ? "translateX(18px)" : "translateX(0)",
                    transition: "transform 0.2s",
                  }} />
                </div>
              </div>

              {/* Timer */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8, paddingLeft: 4 }}>Limite de tempo</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { val: null, label: "Sem limite" },
                    { val: 240,  label: "4 horas" },
                    { val: 120,  label: "2 horas" },
                    { val: 60,   label: "1 hora" },
                  ].map(({ val, label }) => (
                    <button key={label} onClick={() => setTimer(val)} style={{
                      padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: timer === val ? "var(--primary-glow)" : "transparent",
                      border: `1px solid ${timer === val ? "var(--primary)" : "var(--border)"}`,
                      color: timer === val ? "var(--primary)" : "var(--muted)", cursor: "pointer", transition: "all 0.15s",
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={iniciar} disabled={!podeIniciar} style={{
            padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 800,
            background: podeIniciar ? "linear-gradient(135deg,#DF9F20,#B27F1A)" : "var(--bg-card)",
            border: "none", color: podeIniciar ? "#000" : "var(--muted)",
            cursor: podeIniciar ? "pointer" : "not-allowed", transition: "all 0.15s",
          }}>
            Iniciar Simulado
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tela do exame ──────────────────────────────────────────────────────────────
function TelaExame({ questoes, timerMinutos, modoEstudo, onFinalizar }) {
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [marcadas, setMarcadas] = useState(new Set());
  const [segundos, setSegundos] = useState(timerMinutos ? timerMinutos * 60 : null);
  const [showNav, setShowNav] = useState(false);
  const [showExplicacao, setShowExplicacao] = useState(false);

  const questao = questoes[idx];
  const respondidas = Object.keys(respostas).length;
  const respostaAtual = respostas[questao.id];
  const acertouAtual = modoEstudo && respostaAtual ? respostaAtual === questao.resposta : null;

  useEffect(() => {
    setShowExplicacao(false);
  }, [idx]);

  useEffect(() => {
    if (segundos === null) return;
    if (segundos <= 0) { onFinalizar(respostas, questoes); return; }
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  const responder = (alt) => {
    if (modoEstudo && respostaAtual) return; // no modo estudo não muda resposta
    setRespostas((r) => ({ ...r, [questao.id]: alt }));
    if (modoEstudo) setShowExplicacao(true);
  };
  const toggleMarcada = () =>
    setMarcadas((m) => { const s = new Set(m); s.has(questao.id) ? s.delete(questao.id) : s.add(questao.id); return s; });

  const urgente = segundos !== null && segundos < 300;
  const pctProgresso = (respondidas / questoes.length) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Barra superior */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
            {idx + 1} / {questoes.length}
          </span>
          <div style={{ height: 5, width: 100, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--primary)", borderRadius: 3, width: `${pctProgresso}%`, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{respondidas}/{questoes.length}</span>
          {modoEstudo && (
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#22c55e20", color: "#22c55e", fontWeight: 700 }}>
              MODO ESTUDO
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {segundos !== null && (
            <div style={{
              padding: "5px 12px", borderRadius: 8, fontWeight: 800, fontSize: 14,
              background: urgente ? "#ef444422" : "var(--bg-card)",
              border: `1px solid ${urgente ? "#ef4444" : "var(--border)"}`,
              color: urgente ? "#ef4444" : "var(--text)",
            }}>
              {fmtTempo(segundos)}
            </div>
          )}
          <button onClick={() => setShowNav(!showNav)} style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer",
          }}>
            {showNav ? "Ocultar" : "Grade"}
          </button>
          <button onClick={() => onFinalizar(respostas, questoes)} style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none", color: "#000", cursor: "pointer",
          }}>
            Finalizar
          </button>
        </div>
      </div>

      {/* Grade de navegação */}
      {showNav && (
        <div style={{ padding: "10px 20px", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 5 }}>
          {questoes.map((q, i) => (
            <button key={q.id} onClick={() => setIdx(i)} style={{
              width: 30, height: 30, borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: respostas[q.id] ? "var(--primary-glow)" : marcadas.has(q.id) ? "#8b5cf620" : "transparent",
              border: `2px solid ${i === idx ? "var(--text)" : respostas[q.id] ? "var(--primary)" : marcadas.has(q.id) ? "#8b5cf6" : "var(--border)"}`,
              color: respostas[q.id] ? "var(--primary)" : marcadas.has(q.id) ? "#8b5cf6" : "var(--muted)",
              cursor: "pointer",
            }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Questão */}
      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto", maxWidth: 800, width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
            background: (COR_AREA[questao.area] || "#808CFF") + "22",
            color: COR_AREA[questao.area] || "#808CFF",
          }}>
            {questao.area}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Edição {questao.edicao}</span>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 10,
            background: questao.dificuldade === "dificil" ? "#ef444420" : questao.dificuldade === "media" ? "#f9731620" : "#22c55e20",
            color: questao.dificuldade === "dificil" ? "#ef4444" : questao.dificuldade === "media" ? "#f97316" : "#22c55e",
          }}>
            {questao.dificuldade === "facil" ? "Fácil" : questao.dificuldade === "media" ? "Média" : "Difícil"}
          </span>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text)", marginBottom: 20, fontWeight: 500 }}>
          <strong style={{ color: "var(--muted)", marginRight: 8 }}>{idx + 1}.</strong>
          {questao.enunciado}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(questao.alternativas).map(([letra, texto]) => {
            const selecionada = respostaAtual === letra;
            const isCorreta = modoEstudo && respostaAtual && letra === questao.resposta;
            const isErrada = modoEstudo && selecionada && !isCorreta;

            let bg = selecionada ? "var(--primary-glow)" : "var(--bg-card)";
            let borda = selecionada ? "var(--primary)" : "var(--border)";
            let corLetra = selecionada ? "var(--primary)" : "var(--muted)";

            if (isCorreta) { bg = "#22c55e18"; borda = "#22c55e"; corLetra = "#22c55e"; }
            if (isErrada)  { bg = "#ef444418"; borda = "#ef4444"; corLetra = "#ef4444"; }

            return (
              <div key={letra} onClick={() => responder(letra)} style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
                borderRadius: 10, cursor: modoEstudo && respostaAtual ? "default" : "pointer",
                background: bg, border: `1.5px solid ${borda}`, transition: "all 0.15s",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: isCorreta ? "#22c55e" : isErrada ? "#ef4444" : selecionada ? "var(--primary)" : "transparent",
                  border: `2px solid ${corLetra}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 12,
                  color: isCorreta || isErrada || selecionada ? "#fff" : "var(--muted)",
                }}>
                  {isCorreta ? "✓" : isErrada ? "✗" : letra}
                </div>
                <span style={{ fontSize: 13, color: isCorreta ? "#22c55e" : isErrada ? "#ef4444" : selecionada ? "var(--primary)" : "var(--text)", lineHeight: 1.6 }}>
                  {texto}
                </span>
              </div>
            );
          })}
        </div>

        {/* Explicação modo estudo */}
        {modoEstudo && showExplicacao && respostaAtual && (
          <div style={{ marginTop: 16, padding: "14px 16px", background: "#808CFF0C", border: "1px solid #808CFF22", borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: acertouAtual ? "#22c55e" : "#ef4444", marginBottom: 6 }}>
              {acertouAtual ? "Correto!" : `Resposta correta: ${questao.resposta}`}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              {questao.explicacao}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div style={{ padding: "12px 28px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <button onClick={toggleMarcada} style={{
          padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: marcadas.has(questao.id) ? "#8b5cf620" : "transparent",
          border: `1px solid ${marcadas.has(questao.id) ? "#8b5cf6" : "var(--border)"}`,
          color: marcadas.has(questao.id) ? "#8b5cf6" : "var(--muted)", cursor: "pointer",
        }}>
          {marcadas.has(questao.id) ? "Marcada" : "Marcar"}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            color: idx === 0 ? "var(--border)" : "var(--muted)", cursor: idx === 0 ? "not-allowed" : "pointer",
          }}>
            Anterior
          </button>
          {idx < questoes.length - 1 ? (
            <button onClick={() => setIdx((i) => i + 1)} style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none", color: "#000", cursor: "pointer",
            }}>
              Próxima
            </button>
          ) : (
            <button onClick={() => onFinalizar(respostas, questoes)} style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", cursor: "pointer",
            }}>
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tela de resultado ──────────────────────────────────────────────────────────
function TelaResultado({ questoes, respostas, tempoSeg, modo, onGabarito, onNovo, onRefazerErros }) {
  const total = questoes.length;
  const corretas = questoes.filter((q) => respostas[q.id] === q.resposta).length;
  const erradas = questoes.filter((q) => respostas[q.id] && respostas[q.id] !== q.resposta).length;
  const branco = total - corretas - erradas;
  const pct = Math.round((corretas / total) * 100);
  const aprovado = pct >= 60;

  const porArea = AREAS.map((area) => {
    const qs = questoes.filter((q) => q.area === area);
    const c = qs.filter((q) => respostas[q.id] === q.resposta).length;
    const e = qs.filter((q) => respostas[q.id] && respostas[q.id] !== q.resposta).length;
    return { area, total: qs.length, corretas: c, erradas: e, pct: qs.length > 0 ? Math.round((c / qs.length) * 100) : 0 };
  }).filter((a) => a.total > 0).sort((a, b) => a.pct - b.pct);

  const mensagem = pct >= 80 ? "Excelente! Você está muito bem preparado para o CFC." :
    pct >= 60 ? "Aprovado! Continue estudando para garantir a aprovação." :
    pct >= 40 ? "Quase lá! Foque nas áreas com menor desempenho." :
    "Não desanime! Identifique as áreas fracas e intensifique os estudos.";

  const badge = pct >= 80 ? { label: "Excelente", cor: "#22c55e" } :
    pct >= 60 ? { label: "Aprovado", cor: "#DF9F20" } :
    { label: "Reprovado", cor: "#ef4444" };

  const temErros = questoes.some((q) => respostas[q.id] && respostas[q.id] !== q.resposta);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Hero resultado */}
      <div style={{
        background: `linear-gradient(135deg, ${badge.cor}12, ${badge.cor}06)`,
        border: `1.5px solid ${badge.cor}40`,
        borderRadius: 20, padding: "28px 24px",
        display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", justifyContent: "center",
      }}>
        <GaugeCircular pct={pct} aprovado={aprovado} size={150} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, background: `${badge.cor}22`, border: `1px solid ${badge.cor}`, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: badge.cor }}>{badge.label.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
            {corretas} de {total} questões corretas
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{mensagem}</p>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Mínimo para aprovação: 60% · {tempoSeg > 0 && `Tempo: ${fmtTempo(tempoSeg)}`}
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Corretas", valor: corretas, cor: "#22c55e", pct: Math.round((corretas / total) * 100) },
          { label: "Erradas",  valor: erradas,  cor: "#ef4444", pct: Math.round((erradas / total) * 100) },
          { label: "Em branco",valor: branco,   cor: "#6b7280", pct: Math.round((branco / total) * 100) },
        ].map(({ label, valor, cor, pct: p }) => (
          <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: cor }}>{valor}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{label}</div>
            <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", background: cor, borderRadius: 2, width: `${p}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Desempenho por área */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Desempenho por Área</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {porArea.map(({ area, total: t, corretas: c, erradas: e, pct: p }) => {
            const cor = COR_AREA[area] || "#808CFF";
            const corBarra = p >= 80 ? "#22c55e" : p >= 60 ? "#DF9F20" : "#ef4444";
            return (
              <div key={area}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{area}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12 }}>
                    <span style={{ color: "#22c55e", fontWeight: 600 }}>{c} ✓</span>
                    <span style={{ color: "#ef4444", fontWeight: 600 }}>{e} ✗</span>
                    <span style={{ color: corBarra, fontWeight: 700 }}>{p}%</span>
                  </div>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: corBarra, width: `${p}%`, transition: "width 1s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recomendações de estudo */}
      {porArea.filter((a) => a.pct < 60).length > 0 && (
        <div style={{ background: "#ef444408", border: "1px solid #ef444428", borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 10 }}>Áreas para reforçar</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {porArea.filter((a) => a.pct < 60).map(({ area, pct: p }) => (
              <span key={area} style={{
                fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 600,
                background: "#ef444420", color: "#ef4444",
              }}>
                {area} ({p}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onNovo} style={{
          flex: 1, minWidth: 120, padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer",
        }}>
          Novo Simulado
        </button>
        {temErros && (
          <button onClick={onRefazerErros} style={{
            flex: 1, minWidth: 140, padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: "#ef444418", border: "1px solid #ef444460", color: "#ef4444", cursor: "pointer",
          }}>
            Refazer Erros ({erradas})
          </button>
        )}
        <button onClick={onGabarito} style={{
          flex: 2, minWidth: 180, padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700,
          background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none", color: "#000", cursor: "pointer",
        }}>
          Ver Gabarito com Explicações
        </button>
      </div>
    </div>
  );
}

// ── Tela de gabarito ───────────────────────────────────────────────────────────
function TelaGabarito({ questoes, respostas, onVoltar }) {
  const [filtro, setFiltro] = useState("todas");
  const [expandidas, setExpandidas] = useState(new Set());

  const toggleExpandida = (id) =>
    setExpandidas((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const questoesFiltradas = questoes.filter((q) => {
    if (filtro === "corretas") return respostas[q.id] === q.resposta;
    if (filtro === "erradas")  return respostas[q.id] && respostas[q.id] !== q.resposta;
    if (filtro === "branco")   return !respostas[q.id];
    return true;
  });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 }}>Gabarito Comentado</h2>
        <button onClick={onVoltar} style={{
          padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer",
        }}>
          Voltar ao Resultado
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { id: "todas",    label: `Todas (${questoes.length})` },
          { id: "corretas", label: `Corretas (${questoes.filter((q) => respostas[q.id] === q.resposta).length})` },
          { id: "erradas",  label: `Erradas (${questoes.filter((q) => respostas[q.id] && respostas[q.id] !== q.resposta).length})` },
          { id: "branco",   label: `Em branco (${questoes.filter((q) => !respostas[q.id]).length})` },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setFiltro(id)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: filtro === id ? 700 : 500,
            background: filtro === id ? "var(--primary-glow)" : "transparent",
            border: `1px solid ${filtro === id ? "var(--primary)" : "var(--border)"}`,
            color: filtro === id ? "var(--primary)" : "var(--muted)", cursor: "pointer",
          }}>
            {label}
          </button>
        ))}
      </div>

      {questoesFiltradas.map((q) => {
        const respAluno = respostas[q.id];
        const acertou = respAluno === q.resposta;
        const emBranco = !respAluno;
        const expandida = expandidas.has(q.id);
        const corBorda = acertou ? "#22c55e" : emBranco ? "var(--border)" : "#ef4444";

        return (
          <div key={q.id} style={{
            background: "var(--bg-card)", border: `1px solid ${corBorda}40`,
            borderLeft: `4px solid ${corBorda}`, borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Q{questoes.indexOf(q) + 1}</span>
                  <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 10, background: (COR_AREA[q.area] || "#808CFF") + "22", color: COR_AREA[q.area] || "#808CFF" }}>
                    {q.area}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{q.edicao}</span>
                  {acertou   && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>Correto</span>}
                  {!acertou && !emBranco && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>Errado</span>}
                  {emBranco  && <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Em branco</span>}
                </div>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{q.enunciado}</p>
              </div>
              <button onClick={() => toggleExpandida(q.id)} style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", flexShrink: 0,
              }}>
                {expandida ? "▲" : "▼"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {Object.entries(q.alternativas).map(([letra, texto]) => {
                const isCorreta = letra === q.resposta;
                const isAluno = letra === respAluno;
                const bg = isCorreta ? "#22c55e22" : isAluno && !isCorreta ? "#ef444422" : "transparent";
                const borda = isCorreta ? "#22c55e" : isAluno && !isCorreta ? "#ef4444" : "var(--border)";
                const cor = isCorreta ? "#22c55e" : isAluno && !isCorreta ? "#ef4444" : "var(--muted)";

                return (
                  <div key={letra} style={{ flex: "0 0 calc(50% - 3px)", minWidth: 160, padding: "6px 10px", borderRadius: 8, background: bg, border: `1px solid ${borda}`, fontSize: 12 }}>
                    <strong style={{ color: cor }}>{letra})</strong>{" "}
                    <span style={{ color: isCorreta || isAluno ? "var(--text)" : "var(--muted)" }}>{texto}</span>
                    {isCorreta && <span style={{ color: "#22c55e", marginLeft: 4, fontWeight: 700 }}>✓</span>}
                    {isAluno && !isCorreta && <span style={{ color: "#ef4444", marginLeft: 4, fontWeight: 700 }}>✗</span>}
                  </div>
                );
              })}
            </div>

            {expandida && (
              <div style={{ marginTop: 12, padding: "12px 14px", background: "#808CFF0C", border: "1px solid #808CFF22", borderRadius: 8, fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                <strong style={{ color: "var(--text)" }}>Explicação:</strong> {q.explicacao}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function SimuladoPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [tela, setTela] = useState("config");
  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [tempoInicio, setTempoInicio] = useState(null);
  const [tempoTotal, setTempoTotal] = useState(0);
  const [timerMinutos, setTimerMinutos] = useState(null);
  const [modoAtual, setModoAtual] = useState("completo");
  const [modoEstudo, setModoEstudo] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
  }, [router]);

  const salvarHistorico = async (resp, qs, modo, tempoSeg) => {
    if (!user) return;
    const total = qs.length;
    const corretas = qs.filter((q) => resp[q.id] === q.resposta).length;
    const erradas = qs.filter((q) => resp[q.id] && resp[q.id] !== q.resposta).length;
    const em_branco = total - corretas - erradas;
    const percentual = Math.round((corretas / total) * 100);
    const aprovado = percentual >= 60;
    const por_area = AREAS.reduce((acc, area) => {
      const aqs = qs.filter((q) => q.area === area);
      if (!aqs.length) return acc;
      const c = aqs.filter((q) => resp[q.id] === q.resposta).length;
      acc[area] = { total: aqs.length, corretas: c, pct: Math.round((c / aqs.length) * 100) };
      return acc;
    }, {});

    try {
      await fetch("/api/simulado-salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, modo, total_questoes: total, corretas, erradas, em_branco, percentual, tempo_segundos: tempoSeg, aprovado, por_area }),
      });
    } catch (_) {}
  };

  const iniciar = (qs, timer, modo, estudo) => {
    setQuestoes(qs);
    setRespostas({});
    setTimerMinutos(timer);
    setModoAtual(estudo ? "estudo" : modo);
    setModoEstudo(estudo);
    setTempoInicio(Date.now());
    setTela("exame");
  };

  const finalizar = (resp, qs) => {
    const tempoSeg = Math.floor((Date.now() - tempoInicio) / 1000);
    setRespostas(resp);
    setQuestoes(qs);
    setTempoTotal(tempoSeg);
    salvarHistorico(resp, qs, modoAtual, tempoSeg);
    setTela("resultado");
  };

  const refazerErros = () => {
    const erradas = questoes.filter((q) => respostas[q.id] && respostas[q.id] !== q.resposta);
    if (!erradas.length) return;
    setQuestoes(shuffle(erradas));
    setRespostas({});
    setTempoInicio(Date.now());
    setTela("exame");
  };

  if (!user || carregandoPlano) return null;
  if (!pode("simulado")) return (
    <Layout user={user}>
      <CardBloqueado ferramenta="simulado" planoNecessario="especialista" />
    </Layout>
  );

  return (
    <>
      <Head>
        <title>Simulado CFC — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {tela === "exame" ? (
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
          <TelaExame questoes={questoes} timerMinutos={timerMinutos} modoEstudo={modoEstudo} onFinalizar={finalizar} />
        </div>
      ) : (
        <Layout user={user}>
          <div className="page-wrap">
            {tela === "config" && <TelaConfig onIniciar={iniciar} userId={user?.id} />}
            {tela === "resultado" && (
              <TelaResultado
                questoes={questoes} respostas={respostas} tempoSeg={tempoTotal} modo={modoAtual}
                onGabarito={() => setTela("gabarito")}
                onNovo={() => setTela("config")}
                onRefazerErros={refazerErros}
              />
            )}
            {tela === "gabarito" && (
              <TelaGabarito questoes={questoes} respostas={respostas} onVoltar={() => setTela("resultado")} />
            )}
          </div>
        </Layout>
      )}
    </>
  );
}
