import { useState, useEffect, useCallback } from "react";
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

// ── Utilitários ───────────────────────────────────────────────────────────────

function fmtTempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

// ── Tela de configuração ──────────────────────────────────────────────────────

function TelaConfig({ onIniciar }) {
  const [modo, setModo] = useState("completo");
  const [areasEscolhidas, setAreasEscolhidas] = useState([...AREAS]);
  const [timer, setTimer] = useState(null);

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
    onIniciar(questoes, timer);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", margin: 0 }}>🎓 Simulado CFC</h1>
        <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
          Banco com {QUESTOES.length} questões baseadas no Exame de Suficiência — edições 2022 a 2024
        </p>
      </div>

      {/* Modo */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          Modo de simulado
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { id: "completo", icon: "📋", titulo: "Simulado Completo", desc: "50 questões • Distribuição oficial do CFC • ~4 horas" },
            { id: "rapido",   icon: "⚡", titulo: "Prova Rápida",      desc: "25 questões • Mix de todas as áreas • ~2 horas" },
            { id: "areas",    icon: "🎯", titulo: "Por Área",          desc: "Escolha as áreas que deseja treinar" },
          ].map(({ id, icon, titulo, desc }) => (
            <div
              key={id}
              onClick={() => setModo(id)}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                borderRadius: 12, cursor: "pointer",
                background: modo === id ? "var(--primary-glow)" : "#E0E3FF06",
                border: `1px solid ${modo === id ? "var(--primary)" : "var(--border)"}`,
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: modo === id ? "var(--primary)" : "var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: modo === id ? "#000" : "transparent",
              }}>✓</div>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: modo === id ? 700 : 500, color: modo === id ? "var(--primary)" : "var(--text)" }}>{titulo}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Seleção de áreas */}
        {modo === "areas" && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>Selecione as áreas:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AREAS.map((a) => {
                const ativo = areasEscolhidas.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggleArea(a)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: ativo ? 700 : 500,
                      background: ativo ? (COR_AREA[a] + "22") : "transparent",
                      border: `1px solid ${ativo ? COR_AREA[a] : "var(--border)"}`,
                      color: ativo ? COR_AREA[a] : "var(--muted)", cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {a} ({QUESTOES.filter((q) => q.area === a).length})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Timer */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          Limite de tempo
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { val: null,  label: "Sem limite" },
            { val: 240,   label: "4 horas" },
            { val: 120,   label: "2 horas" },
            { val: 60,    label: "1 hora" },
          ].map(({ val, label }) => (
            <button
              key={label}
              onClick={() => setTimer(val)}
              style={{
                padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: timer === val ? "var(--primary-glow)" : "transparent",
                border: `1px solid ${timer === val ? "var(--primary)" : "var(--border)"}`,
                color: timer === val ? "var(--primary)" : "var(--muted)", cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Iniciar */}
      <button
        onClick={iniciar}
        disabled={!podeIniciar}
        style={{
          padding: "16px", borderRadius: 14, fontSize: 16, fontWeight: 800,
          background: podeIniciar ? "linear-gradient(135deg,#DF9F20,#B27F1A)" : "var(--bg-card)",
          border: "none", color: podeIniciar ? "#000" : "var(--muted)",
          cursor: podeIniciar ? "pointer" : "not-allowed", transition: "all 0.15s",
        }}
      >
        🚀 Iniciar Simulado
      </button>
    </div>
  );
}

// ── Tela do exame ─────────────────────────────────────────────────────────────

function TelaExame({ questoes, timerMinutos, onFinalizar }) {
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [marcadas, setMarcadas] = useState(new Set());
  const [segundos, setSegundos] = useState(timerMinutos ? timerMinutos * 60 : null);
  const [showNav, setShowNav] = useState(false);

  const questao = questoes[idx];
  const respondidas = Object.keys(respostas).length;

  useEffect(() => {
    if (segundos === null) return;
    if (segundos <= 0) { onFinalizar(respostas, questoes); return; }
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  const responder = (alt) => setRespostas((r) => ({ ...r, [questao.id]: alt }));
  const toggleMarcada = () =>
    setMarcadas((m) => { const s = new Set(m); s.has(questao.id) ? s.delete(questao.id) : s.add(questao.id); return s; });

  const corBotaoNav = (q) => {
    if (respostas[q.id]) return "var(--primary)";
    if (marcadas.has(q.id)) return "#8b5cf6";
    return "var(--border)";
  };

  const urgente = segundos !== null && segundos < 300;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* ── Barra superior ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            Questão {idx + 1} / {questoes.length}
          </span>
          <div style={{
            height: 6, width: 120, background: "var(--border)", borderRadius: 3, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 3, transition: "width 0.3s",
              background: "var(--primary)", width: `${(respondidas / questoes.length) * 100}%`,
            }} />
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{respondidas}/{questoes.length} respondidas</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {segundos !== null && (
            <div style={{
              padding: "6px 14px", borderRadius: 10, fontWeight: 800, fontSize: 15,
              background: urgente ? "#ef444422" : "var(--bg-card)",
              border: `1px solid ${urgente ? "#ef4444" : "var(--border)"}`,
              color: urgente ? "#ef4444" : "var(--text)",
            }}>
              ⏱ {fmtTempo(segundos)}
            </div>
          )}
          <button onClick={() => setShowNav(!showNav)} style={{
            padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer",
          }}>
            {showNav ? "Ocultar" : "Questões"}
          </button>
          <button
            onClick={() => onFinalizar(respostas, questoes)}
            style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none",
              color: "#000", cursor: "pointer",
            }}
          >
            Finalizar
          </button>
        </div>
      </div>

      {/* ── Grade de navegação ── */}
      {showNav && (
        <div style={{
          padding: "12px 20px", background: "#E0E3FF06",
          borderBottom: "1px solid var(--border)",
          display: "flex", flexWrap: "wrap", gap: 6,
        }}>
          {questoes.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setIdx(i)}
              style={{
                width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: respostas[q.id] ? "var(--primary-glow)" : marcadas.has(q.id) ? "#8b5cf620" : "transparent",
                border: `2px solid ${i === idx ? "var(--text)" : corBotaoNav(q)}`,
                color: respostas[q.id] ? "var(--primary)" : marcadas.has(q.id) ? "#8b5cf6" : "var(--muted)",
                cursor: "pointer", transition: "all 0.1s",
              }}
            >
              {i + 1}
            </button>
          ))}
          <div style={{ width: "100%", display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "var(--muted)" }}>
            <span>🟡 Respondida</span>
            <span>🟣 Marcada para revisão</span>
            <span>⬜ Em branco</span>
          </div>
        </div>
      )}

      {/* ── Conteúdo da questão ── */}
      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto", maxWidth: 800, width: "100%", margin: "0 auto" }}>
        {/* Badge de área */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: (COR_AREA[questao.area] || "#808CFF") + "22",
            color: COR_AREA[questao.area] || "#808CFF",
            border: `1px solid ${(COR_AREA[questao.area] || "#808CFF") + "44"}`,
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

        {/* Enunciado */}
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text)", marginBottom: 24, fontWeight: 500 }}>
          <strong style={{ color: "var(--muted)", marginRight: 8 }}>{idx + 1}.</strong>
          {questao.enunciado}
        </p>

        {/* Alternativas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(questao.alternativas).map(([letra, texto]) => {
            const selecionada = respostas[questao.id] === letra;
            return (
              <div
                key={letra}
                onClick={() => responder(letra)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px",
                  borderRadius: 12, cursor: "pointer",
                  background: selecionada ? "var(--primary-glow)" : "var(--bg-card)",
                  border: `1.5px solid ${selecionada ? "var(--primary)" : "var(--border)"}`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: selecionada ? "var(--primary)" : "transparent",
                  border: `2px solid ${selecionada ? "var(--primary)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 13,
                  color: selecionada ? "#000" : "var(--muted)",
                  transition: "all 0.15s",
                }}>
                  {letra}
                </div>
                <span style={{ fontSize: 14, color: selecionada ? "var(--primary)" : "var(--text)", lineHeight: 1.6, fontWeight: selecionada ? 600 : 400 }}>
                  {texto}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Rodapé de navegação ── */}
      <div style={{
        padding: "14px 28px", borderTop: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        <button
          onClick={toggleMarcada}
          style={{
            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: marcadas.has(questao.id) ? "#8b5cf620" : "transparent",
            border: `1px solid ${marcadas.has(questao.id) ? "#8b5cf6" : "var(--border)"}`,
            color: marcadas.has(questao.id) ? "#8b5cf6" : "var(--muted)", cursor: "pointer", transition: "all 0.15s",
          }}
        >
          🚩 {marcadas.has(questao.id) ? "Marcada" : "Marcar para revisão"}
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            style={{
              padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              color: idx === 0 ? "var(--border)" : "var(--muted)", cursor: idx === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Anterior
          </button>
          {idx < questoes.length - 1 ? (
            <button
              onClick={() => setIdx((i) => i + 1)}
              style={{
                padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none",
                color: "#000", cursor: "pointer",
              }}
            >
              Próxima →
            </button>
          ) : (
            <button
              onClick={() => onFinalizar(respostas, questoes)}
              style={{
                padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none",
                color: "#fff", cursor: "pointer",
              }}
            >
              ✅ Concluir Simulado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tela de resultado ─────────────────────────────────────────────────────────

function TelaResultado({ questoes, respostas, tempoSeg, onGabarito, onNovo }) {
  const total = questoes.length;
  const corretas = questoes.filter((q) => respostas[q.id] === q.resposta).length;
  const erradas = questoes.filter((q) => respostas[q.id] && respostas[q.id] !== q.resposta).length;
  const branco = total - corretas - erradas;
  const pct = Math.round((corretas / total) * 100);
  const aprovado = pct >= 60;

  const porArea = AREAS.map((area) => {
    const qs = questoes.filter((q) => q.area === area);
    const c = qs.filter((q) => respostas[q.id] === q.resposta).length;
    return { area, total: qs.length, corretas: c, pct: qs.length > 0 ? Math.round((c / qs.length) * 100) : 0 };
  }).filter((a) => a.total > 0);

  const mensagem = pct >= 80 ? "Excelente! Você está muito bem preparado para o CFC." :
    pct >= 60 ? "Aprovado! Continue estudando para garantir a aprovação." :
    pct >= 40 ? "Quase lá! Foque nas áreas com menor desempenho." :
    "Não desanime! Identifique as áreas fracas e intensifique os estudos.";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Placar principal */}
      <div style={{
        background: aprovado ? "linear-gradient(135deg,#22c55e18,#16a34a10)" : "linear-gradient(135deg,#ef444418,#dc262610)",
        border: `2px solid ${aprovado ? "#22c55e44" : "#ef444444"}`,
        borderRadius: 20, padding: "32px 28px", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 20px",
          borderRadius: 20, marginBottom: 20,
          background: aprovado ? "#22c55e22" : "#ef444422",
          border: `1px solid ${aprovado ? "#22c55e" : "#ef4444"}`,
          fontSize: 14, fontWeight: 800, color: aprovado ? "#22c55e" : "#ef4444",
        }}>
          {aprovado ? "✅ APROVADO" : "📚 CONTINUE ESTUDANDO"}
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>
          {corretas}<span style={{ fontSize: 32, color: "var(--muted)" }}>/{total}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: aprovado ? "#22c55e" : "#ef4444", marginTop: 8 }}>
          {pct}%
        </div>
        <p style={{ color: "var(--muted)", marginTop: 12, fontSize: 14 }}>{mensagem}</p>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          Mínimo para aprovação: 60% (30/50)
        </div>
      </div>

      {/* Estatísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Corretas", valor: corretas, cor: "#22c55e", icon: "✅" },
          { label: "Erradas",  valor: erradas,  cor: "#ef4444", icon: "❌" },
          { label: "Em branco",valor: branco,   cor: "#6b7280", icon: "⬜" },
        ].map(({ label, valor, cor, icon }) => (
          <div key={label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "16px", textAlign: "center",
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: cor }}>{valor}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Desempenho por área */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Desempenho por Área</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {porArea.sort((a, b) => a.pct - b.pct).map(({ area, total: t, corretas: c, pct: p }) => (
            <div key={area}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{area}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: p >= 60 ? "#22c55e" : "#ef4444" }}>
                  {c}/{t} ({p}%)
                </span>
              </div>
              <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4, transition: "width 0.8s ease",
                  background: p >= 80 ? "#22c55e" : p >= 60 ? "#DF9F20" : "#ef4444",
                  width: `${p}%`,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tempo */}
      {tempoSeg > 0 && (
        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
          ⏱ Tempo total: <strong style={{ color: "var(--text)" }}>{fmtTempo(tempoSeg)}</strong>
        </div>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={onNovo} style={{
          flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
          background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer",
        }}>
          🔄 Novo Simulado
        </button>
        <button onClick={onGabarito} style={{
          flex: 2, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700,
          background: "linear-gradient(135deg,#DF9F20,#B27F1A)", border: "none", color: "#000", cursor: "pointer",
        }}>
          📖 Ver Gabarito Completo com Explicações
        </button>
      </div>
    </div>
  );
}

// ── Tela de gabarito ──────────────────────────────────────────────────────────

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
    <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>📖 Gabarito Comentado</h2>
        <button onClick={onVoltar} style={{
          padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer",
        }}>
          ← Voltar ao Resultado
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          { id: "todas",    label: `Todas (${questoes.length})` },
          { id: "corretas", label: `✅ Corretas (${questoes.filter((q) => respostas[q.id] === q.resposta).length})` },
          { id: "erradas",  label: `❌ Erradas (${questoes.filter((q) => respostas[q.id] && respostas[q.id] !== q.resposta).length})` },
          { id: "branco",   label: `⬜ Em branco (${questoes.filter((q) => !respostas[q.id]).length})` },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFiltro(id)}
            style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: filtro === id ? 700 : 500,
              background: filtro === id ? "var(--primary-glow)" : "transparent",
              border: `1px solid ${filtro === id ? "var(--primary)" : "var(--border)"}`,
              color: filtro === id ? "var(--primary)" : "var(--muted)", cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {questoesFiltradas.map((q, i) => {
        const respAluno = respostas[q.id];
        const correta = q.resposta;
        const acertou = respAluno === correta;
        const emBranco = !respAluno;
        const expandida = expandidas.has(q.id);

        return (
          <div
            key={q.id}
            style={{
              background: "var(--bg-card)",
              border: `1px solid ${acertou ? "#22c55e44" : emBranco ? "var(--border)" : "#ef444444"}`,
              borderLeft: `4px solid ${acertou ? "#22c55e" : emBranco ? "var(--border)" : "#ef4444"}`,
              borderRadius: 14, padding: "16px 18px",
            }}
          >
            {/* Header da questão */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
                    Q{questoes.indexOf(q) + 1}
                  </span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 10,
                    background: (COR_AREA[q.area] || "#808CFF") + "22",
                    color: COR_AREA[q.area] || "#808CFF",
                  }}>
                    {q.area}
                  </span>
                  {acertou && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>✅ Correto</span>}
                  {!acertou && !emBranco && <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>❌ Errado</span>}
                  {emBranco && <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>⬜ Em branco</span>}
                </div>
                <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{q.enunciado}</p>
              </div>
              <button
                onClick={() => toggleExpandida(q.id)}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--muted)", cursor: "pointer", flexShrink: 0,
                }}
              >
                {expandida ? "▲" : "▼"}
              </button>
            </div>

            {/* Alternativas resumidas */}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {Object.entries(q.alternativas).map(([letra, texto]) => {
                const isCorreta = letra === correta;
                const isAluno = letra === respAluno;
                const bg = isCorreta ? "#22c55e22" : isAluno && !isCorreta ? "#ef444422" : "transparent";
                const borda = isCorreta ? "#22c55e" : isAluno && !isCorreta ? "#ef4444" : "var(--border)";
                const cor = isCorreta ? "#22c55e" : isAluno && !isCorreta ? "#ef4444" : "var(--muted)";

                return (
                  <div
                    key={letra}
                    style={{
                      flex: "0 0 calc(50% - 4px)", padding: "8px 12px", borderRadius: 8,
                      background: bg, border: `1px solid ${borda}`, fontSize: 13,
                    }}
                  >
                    <strong style={{ color: cor }}>{letra})</strong>{" "}
                    <span style={{ color: isCorreta || isAluno ? "var(--text)" : "var(--muted)" }}>{texto}</span>
                    {isCorreta && <span style={{ color: "#22c55e", marginLeft: 4, fontWeight: 700 }}>✓</span>}
                    {isAluno && !isCorreta && <span style={{ color: "#ef4444", marginLeft: 4, fontWeight: 700 }}>✗</span>}
                  </div>
                );
              })}
            </div>

            {/* Explicação */}
            {expandida && (
              <div style={{
                marginTop: 14, padding: "14px 16px",
                background: "#808CFF0C", border: "1px solid #808CFF22",
                borderRadius: 10, fontSize: 13, color: "var(--muted)", lineHeight: 1.7,
              }}>
                💡 <strong style={{ color: "var(--text)" }}>Explicação:</strong> {q.explicacao}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
  }, [router]);

  const iniciar = (qs, timer) => {
    setQuestoes(qs);
    setRespostas({});
    setTimerMinutos(timer);
    setTempoInicio(Date.now());
    setTela("exame");
  };

  const finalizar = (resp, qs) => {
    setRespostas(resp);
    setQuestoes(qs);
    setTempoTotal(Math.floor((Date.now() - tempoInicio) / 1000));
    setTela("resultado");
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
        <title>Simulado CFC — GJ Contábil Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {tela === "exame" ? (
        // Tela do exame ocupa a tela inteira (sem Layout lateral)
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
          <TelaExame questoes={questoes} timerMinutos={timerMinutos} onFinalizar={finalizar} />
        </div>
      ) : (
        <Layout user={user}>
          <div style={{ padding: "32px 28px" }}>
            {tela === "config" && <TelaConfig onIniciar={iniciar} />}
            {tela === "resultado" && (
              <TelaResultado
                questoes={questoes}
                respostas={respostas}
                tempoSeg={tempoTotal}
                onGabarito={() => setTela("gabarito")}
                onNovo={() => setTela("config")}
              />
            )}
            {tela === "gabarito" && (
              <TelaGabarito
                questoes={questoes}
                respostas={respostas}
                onVoltar={() => setTela("resultado")}
              />
            )}
          </div>
        </Layout>
      )}
    </>
  );
}
