import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { calcSimples, calcLP, calcLR, fmt, pct, parseVal, fmtInput, fmtToInput } from "../components/calculos";
import { gerarPDF } from "../components/gerarPDF";
import Layout from "../components/Layout";
import { useAssinatura } from "../lib/AssinaturaContext";

// ─── Atividades ────────────────────────────────────────────────────────────────
const atividades = [
  { id: "comercio",  label: "Comércio" },
  { id: "industria", label: "Indústria" },
  { id: "servicos",  label: "Serviços" },
  { id: "contabil",  label: "Contábil / Jurídico" },
];

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ etapa }) {
  const steps = ["Dados da Empresa", "Custos", "Resultados"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
      {steps.map((s, i) => {
        const n = i + 1;
        const ativo = etapa === n;
        const feito = etapa > n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14,
                background: feito || ativo ? "linear-gradient(135deg,#DF9F20,#B27F1A)" : "var(--bg-input)",
                color: feito || ativo ? "#fff" : "var(--muted)",
                border: feito || ativo ? "2px solid #DF9F20" : "2px solid var(--border)",
                boxShadow: ativo ? "0 0 20px #DF9F2044" : "none",
              }}>
                {feito ? "✓" : n}
              </div>
              <span style={{ fontSize: 11, color: ativo || feito ? "var(--primary)" : "var(--muted)", whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 50, height: 2, background: feito ? "var(--primary)" : "var(--border)", margin: "0 6px", marginBottom: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Card de regime ────────────────────────────────────────────────────────────
function RegimeCard({ r, maxAnual, melhor }) {
  const [expandido, setExpandido] = useState(false);
  const isMelhor = r.regime === melhor?.regime;
  const barra = maxAnual > 0 ? (r.anual / maxAnual) * 100 : 0;

  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: 14, padding: 20, position: "relative",
      border: isMelhor ? "2px solid var(--primary)" : "1px solid var(--border)",
      boxShadow: isMelhor ? "0 0 30px var(--primary-glow)" : "none",
    }}>
      {isMelhor && (
        <div style={{
          position: "absolute", top: -12, left: 20,
          background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
          color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "3px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em",
        }}>★ Mais vantajoso</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: r.cor }}>{r.regime}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{r.detalhe}</div>
        </div>
        <div style={{
          background: r.cor + "22", color: r.cor,
          padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700,
        }}>{pct(r.aliqEfetiva)}</div>
      </div>

      <div style={{ background: "var(--bg-input)", borderRadius: 4, height: 6, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 4, background: r.cor, width: `${barra}%`, transition: "width 0.8s ease" }} />
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Anual</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(r.anual)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mensal</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(r.mensal)}</div>
        </div>
      </div>

      <button onClick={() => setExpandido(!expandido)}
        style={{ background: "none", color: "var(--muted)", fontSize: 12, padding: "4px 0", width: "100%", textAlign: "left" }}>
        {expandido ? "▲ Ocultar composição" : "▼ Ver composição detalhada"}
      </button>

      {expandido && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          {r.itens.map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 13,
            }}>
              <span style={{ color: "var(--text-dim)" }}>{item.label}</span>
              <span style={{ fontWeight: 600 }}>{fmt(item.valor)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ABA HOME — Hub Dashboard ──────────────────────────────────────────────────
function AbaHome({ user, setAba, pode }) {
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const nome = user?.email?.split("@")[0] || "Usuário";
  const router = useRouter();

  const modulos = [
    {
      id: "simulador",
      label: "Simulador Tributário",
      desc: "Compare Simples Nacional, Lucro Presumido e Lucro Real. Descubra o regime mais vantajoso e acesse seu histórico de simulações.",
      cor: "var(--primary)",
      badge: "Mais usado",
      acao: () => setAba("calculadora"),
    },
    {
      id: "noticias",
      label: "Portal de Notícias",
      desc: "Notícias contábeis, fiscais e tributárias em tempo real. Reforma tributária, Simples Nacional, CFC e muito mais.",
      cor: "#3b82f6",
      acao: () => router.push("/noticias"),
    },
    {
      id: "fiscal",
      label: "Calendário Fiscal",
      desc: "Todas as obrigações fiscais do mês em um só lugar: FGTS, DAS, IRRF, DCTF, PIS/COFINS e declarações anuais.",
      cor: "#22c55e",
      acao: () => router.push("/fiscal"),
    },
    {
      id: "honorarios",
      label: "Calculadora de Honorários",
      desc: "Calcule honorários contábeis por estado, regime tributário, faturamento e serviços. Gere propostas em PDF.",
      cor: "#f97316",
      acao: () => router.push("/honorarios"),
    },
    {
      id: "cnpj",
      label: "Consulta CNPJ",
      desc: "Consulte dados completos de qualquer empresa: razão social, sócios, CNAEs, situação cadastral e endereço.",
      cor: "#8b5cf6",
      acao: () => router.push("/cnpj"),
    },
    {
      id: "documentos",
      label: "Gerador de Documentos",
      desc: "Gere contratos, procurações, declarações e cartas em PDF na hora. Sem Word, sem perda de tempo.",
      cor: "#06b6d4",
      acao: () => router.push("/documentos"),
    },
    {
      id: "icmsst",
      label: "ICMS-ST",
      desc: "Calcule o ICMS por Substituição Tributária em operações interestaduais com MVA ajustada, alíquotas automáticas e relatório em PDF.",
      cor: "#818cf8",
      acao: () => router.push("/icmsst"),
    },
    {
      id: "simulado",
      label: "Simulado CFC",
      desc: "Simule o Exame de Suficiência com questões reais das últimas edições. Resultado detalhado por área com gabarito comentado.",
      cor: "#DF9F20",
      acao: () => router.push("/simulado"),
    },
    {
      id: "reforma",
      label: "Reforma Tributária",
      desc: "Simule o impacto da LC 214/2025 para seus clientes. IBS + CBS, regimes comparados, cronograma de transição 2026–2033.",
      cor: "#DF9F20",
      badge: "NOVO",
      destaque: true,
      acao: () => router.push("/reforma"),
    },
  ];

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1020, margin: "0 auto" }}>

      {/* Saudação */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)" }}>
          {saudacao}, <span style={{ color: "var(--primary)" }}>{nome}</span>
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 14 }}>
          Bem-vindo ao <strong style={{ color: "var(--text)" }}>GJ Hub Contábil</strong> — o hub completo para contadores e estudantes de contabilidade.
        </p>
      </div>

      {/* Banner — Reforma Tributária */}
      {pode && pode("reforma") && (
        <div
          onClick={() => router.push("/reforma")}
          style={{
            background: "linear-gradient(135deg, #1a1400 0%, #2a1f00 50%, #1a1400 100%)",
            border: "1px solid #DF9F2040",
            borderRadius: 16, padding: "20px 24px", marginBottom: 28, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            boxShadow: "0 4px 30px #DF9F2018",
            transition: "box-shadow 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 40px #DF9F2030"; e.currentTarget.style.borderColor = "#DF9F2070"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 30px #DF9F2018"; e.currentTarget.style.borderColor = "#DF9F2040"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "#DF9F2022", border: "1px solid #DF9F2044",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>📊</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#F5F6FF" }}>Simulador da Reforma Tributária</span>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: "#000", background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
                  padding: "2px 8px", borderRadius: 20, letterSpacing: "0.06em",
                }}>NOVO</span>
              </div>
              <div style={{ fontSize: 12, color: "#DF9F20AA", lineHeight: 1.5 }}>
                Calcule o impacto da LC 214/2025 — IBS + CBS, cronograma 2026–2033 e recomendação de regime para seus clientes.
              </div>
            </div>
          </div>
          <div style={{
            flexShrink: 0, fontSize: 13, fontWeight: 700, color: "#DF9F20",
            background: "#DF9F2015", border: "1px solid #DF9F2040",
            padding: "8px 18px", borderRadius: 10, whiteSpace: "nowrap",
          }}>
            Simular agora →
          </div>
        </div>
      )}

      {/* Label seção */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
        {modulos.length} ferramentas disponíveis
      </div>

      {/* Grid de módulos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
        {modulos.map((m) => {
          const liberado = pode ? pode(m.id) : true;
          return (
            <button
              key={m.id}
              onClick={liberado ? m.acao : () => router.push("/assinatura")}
              style={{
                background: m.destaque && liberado ? "linear-gradient(135deg, #1a1400 0%, #2a1f00 100%)" : "var(--bg-card)",
                border: m.destaque && liberado ? "1px solid #DF9F2040" : "1px solid var(--border)",
                borderLeft: `4px solid ${liberado ? m.cor : "var(--border)"}`,
                borderRadius: 14, padding: "22px 22px", textAlign: "left",
                cursor: "pointer", transition: "all 0.15s", position: "relative",
                opacity: liberado ? 1 : 0.6,
                boxShadow: m.destaque && liberado ? "0 4px 20px #DF9F2015" : "none",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 10px 28px ${liberado ? m.cor : "#000"}28`;
                if (liberado) { e.currentTarget.style.borderColor = m.cor; e.currentTarget.style.borderLeftColor = m.cor; }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = m.destaque && liberado ? "0 4px 20px #DF9F2015" : "";
                e.currentTarget.style.borderColor = m.destaque && liberado ? "#DF9F2040" : "var(--border)";
                e.currentTarget.style.borderLeftColor = liberado ? m.cor : "var(--border)";
              }}
            >
              {/* Badge de plano ou de destaque */}
              {!liberado && (
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  background: "#ef444420", color: "#ef4444",
                  fontSize: 10, fontWeight: 700, padding: "3px 9px",
                  borderRadius: 20, display: "flex", alignItems: "center", gap: 4,
                }}>
                  Upgrade
                </div>
              )}
              {liberado && m.badge && (
                <div style={{
                  position: "absolute", top: 16, right: 16,
                  background: m.destaque ? "linear-gradient(135deg,#DF9F20,#B27F1A)" : `${m.cor}22`,
                  color: m.destaque ? "#000" : m.cor,
                  fontSize: 10, fontWeight: 800, padding: "3px 9px",
                  borderRadius: 20, letterSpacing: "0.06em",
                }}>
                  {m.badge}
                </div>
              )}
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: liberado ? m.cor : "var(--border)", marginBottom: 16 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 7 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>{m.desc}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: liberado ? m.cor : "var(--muted)" }}>
                {liberado ? "Acessar →" : "Ver planos →"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CÁLCULO DA REFORMA TRIBUTÁRIA ────────────────────────────────────────────
// Baseado na LC 214/2024 e projeções do Comitê Gestor do IBS
// Alíquotas de referência (full implementation 2033):
//   CBS (federal):          8,8%  — substitui PIS + COFINS
//   IBS (estado+município): 17,7% — substitui ICMS + ISS
//   Total IVA:             26,5%  sobre valor agregado (não cumulativo)
//
// Estimativa de créditos de entrada por atividade (% do faturamento):
//   Comércio:   60% (custo de mercadorias elevado)
//   Indústria:  50% (matérias-primas)
//   Serviços:   20% (poucos insumos físicos)
//   Contábil:   15% (quase tudo é trabalho)

const CBS_RATE   = 0.088;  // 8,8%
const IBS_RATE   = 0.177;  // 17,7%
const TOTAL_IVA  = CBS_RATE + IBS_RATE; // 26,5%

const CREDITO_ENTRADA = {
  comercio:  0.60,
  industria: 0.50,
  servicos:  0.20,
  contabil:  0.15,
};

// Fases da transição (CBS + IBS combinado sobre valor agregado)
const TRANSICAO = [
  { ano: "2026", pct: 0.01,   label: "Período teste" },
  { ano: "2027", pct: 0.06,   label: "Início gradual" },
  { ano: "2028", pct: 0.12,   label: "Fase 1" },
  { ano: "2029", pct: 0.40,   label: "Fase 2" },
  { ano: "2030", pct: 0.60,   label: "Fase 3" },
  { ano: "2031", pct: 0.80,   label: "Fase 4" },
  { ano: "2032", pct: 0.90,   label: "Fase 5" },
  { ano: "2033", pct: 1.00,   label: "Plena" },
];

function calcReforma(fatAnual, atividade) {
  const creditRate  = CREDITO_ENTRADA[atividade] || 0.20;
  const valorAgregado = fatAnual * (1 - creditRate);
  const cbs   = valorAgregado * CBS_RATE;
  const ibs   = valorAgregado * IBS_RATE;
  const total = cbs + ibs;
  const aliqEfetiva = fatAnual > 0 ? total / fatAnual : 0;
  return { cbs, ibs, total, aliqEfetiva, valorAgregado, creditRate };
}

// ─── ABA REFORMA TRIBUTÁRIA ────────────────────────────────────────────────────
function AbaReforma({ dadosCalc }) {
  const [fatInput, setFatInput]   = useState(dadosCalc ? fmtToInput(dadosCalc.fatAnual / 12) : "");
  const [atividade, setAtividade] = useState(dadosCalc?.atividade || "servicos");
  const [calculado, setCalculado] = useState(!!dadosCalc);
  const [resultado, setResultado] = useState(null);
  const [regimeAtual, setRegimeAtual] = useState(dadosCalc?.melhor || null);

  useEffect(() => {
    if (dadosCalc) {
      setFatInput(fmtToInput(dadosCalc.fatAnual / 12));
      setAtividade(dadosCalc.atividade);
      const r = calcReforma(dadosCalc.fatAnual, dadosCalc.atividade);
      setResultado(r);
      setRegimeAtual(dadosCalc.melhor);
      setCalculado(true);
    }
  }, [dadosCalc]);

  const calcular = () => {
    const fatAnual = parseVal(fatInput) * 12;
    if (!fatAnual) return;
    setResultado(calcReforma(fatAnual, atividade));
    setRegimeAtual(null);
    setCalculado(true);
  };

  const fatAnual = parseVal(fatInput) * 12;

  const TAGS_ATIVIDADE = [
    { id: "comercio",  label: "🏪 Comércio" },
    { id: "industria", label: "🏭 Indústria" },
    { id: "servicos",  label: "💼 Serviços" },
    { id: "contabil",  label: "📊 Contábil" },
  ];

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 720, margin: "0 auto" }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Reforma Tributária</h2>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
            padding: "3px 10px", borderRadius: 20,
            background: "#DF9F2018", border: "1px solid #DF9F2040",
            color: "var(--primary)",
          }}>LC 214/2024</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          Projeção do impacto do novo sistema IVA dual (IBS + CBS) no seu negócio.
          Alíquotas com vigência plena a partir de 2033.
        </p>
      </div>

      {/* Inputs */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label">Faturamento mensal (R$)</label>
            <input
              type="tel" inputMode="numeric"
              value={fatInput}
              onChange={e => { setFatInput(fmtInput(e.target.value)); setCalculado(false); }}
              placeholder="Digite os dígitos"
            />
            {fatAnual > 0 && (
              <div style={{ fontSize: 12, color: "var(--primary)", marginTop: 4 }}>
                Faturamento anual: <strong>{fmt(fatAnual)}</strong>
              </div>
            )}
          </div>
          <div>
            <label className="label">Atividade</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
              {TAGS_ATIVIDADE.map(a => (
                <button key={a.id} onClick={() => { setAtividade(a.id); setCalculado(false); }} style={{
                  padding: "10px 12px", borderRadius: 9, fontWeight: 600, fontSize: 13,
                  background: atividade === a.id ? "var(--primary-glow)" : "var(--bg-input)",
                  border: `2px solid ${atividade === a.id ? "var(--primary)" : "var(--border)"}`,
                  color: atividade === a.id ? "var(--primary)" : "var(--muted)",
                }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn-primary"
            disabled={!fatInput || parseVal(fatInput) === 0}
            onClick={calcular}
          >
            ⚡ Calcular impacto da reforma
          </button>
        </div>
      </div>

      {/* Resultado */}
      {calculado && resultado && (
        <>
          {/* Cards CBS + IBS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {[
              { label: "CBS (Federal)", valor: resultado.cbs, cor: "#818cf8", sub: "Substitui PIS + COFINS", taxa: "8,8%" },
              { label: "IBS (Estado + Município)", valor: resultado.ibs, cor: "#22c55e", sub: "Substitui ICMS + ISS", taxa: "17,7%" },
            ].map(c => (
              <div key={c.label} style={{
                background: "var(--bg-card)", border: `1px solid ${c.cor}40`,
                borderRadius: 12, padding: "16px 18px",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.cor, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>
                  {fmt(c.valor)}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.sub}</div>
                <div style={{ fontSize: 11, color: c.cor, fontWeight: 700, marginTop: 4 }}>Alíquota: {c.taxa} s/ valor agregado</div>
              </div>
            ))}
          </div>

          {/* Total + Comparativo */}
          <div style={{
            background: "linear-gradient(135deg, #1a1200, #201600)",
            border: "2px solid var(--primary)50",
            borderRadius: 14, padding: "20px 22px",
            marginBottom: 14,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Total IBS + CBS / ano (estimativa 2033)
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "var(--primary)" }}>{fmt(resultado.total)}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {fmt(resultado.total / 12)}/mês · Alíquota efetiva {pct(resultado.aliqEfetiva)} sobre faturamento
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>Valor agregado estimado</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-dim)" }}>{fmt(resultado.valorAgregado)}/ano</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {pct(1 - resultado.creditRate)} do faturamento ({pct(resultado.creditRate)} em créditos)
                </div>
              </div>
            </div>

            {/* Comparativo com regime atual se disponível */}
            {regimeAtual && (() => {
              const diff = resultado.total - regimeAtual.anual;
              const positivo = diff > 0;
              return (
                <div style={{
                  background: positivo ? "#ef444415" : "#22c55e15",
                  border: `1px solid ${positivo ? "#ef444440" : "#22c55e40"}`,
                  borderRadius: 9, padding: "12px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexWrap: "wrap", gap: 8,
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Regime atual: <strong style={{ color: "var(--text)" }}>{regimeAtual.regime}</strong> → <strong style={{ color: "var(--text)" }}>{fmt(regimeAtual.anual)}/ano</strong>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: positivo ? "#ef4444" : "#22c55e", marginTop: 2 }}>
                      {positivo ? `▲ Aumento de ${fmt(diff)}/ano` : `▼ Redução de ${fmt(Math.abs(diff))}/ano`} com a reforma
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: positivo ? "#ef4444" : "#22c55e" }}>
                    {positivo ? "+" : ""}{pct(diff / regimeAtual.anual)}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Timeline de transição */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Cronograma de transição</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
              Os impostos antigos (ICMS, ISS, PIS, COFINS) diminuem gradualmente enquanto IBS e CBS aumentam.
              Estimativa de impacto anual por fase:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TRANSICAO.map(fase => {
                const impactoFase = resultado.total * fase.pct;
                const isAtual = new Date().getFullYear().toString() === fase.ano;
                return (
                  <div key={fase.ano} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      fontSize: 12, fontWeight: isAtual ? 800 : 500,
                      color: isAtual ? "var(--primary)" : "var(--muted)",
                      width: 36, flexShrink: 0,
                    }}>{fase.ano}</div>
                    <div style={{ flex: 1, background: "var(--bg-input)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4,
                        background: `linear-gradient(90deg, var(--primary), #B27F1A)`,
                        width: `${fase.pct * 100}%`,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", width: 90, textAlign: "right", flexShrink: 0 }}>
                      ~{fmt(impactoFase)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", width: 70, flexShrink: 0 }}>{fase.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* O que muda */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>O que muda com a Reforma</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "🔄", titulo: "PIS + COFINS → CBS", desc: "CBS federal substitui as contribuições sobre receita bruta. Totalmente não cumulativo — crédito sobre insumos." },
                { icon: "🏛️", titulo: "ICMS + ISS → IBS", desc: "IBS estadual/municipal unifica os impostos sobre circulação. Regra única para todo o país, sem guerra fiscal." },
                { icon: "⚡", titulo: "Imposto Seletivo (IS)", desc: "Novo tributo sobre bens e serviços prejudiciais: tabaco, álcool, jogos de azar. Não afeta a maioria dos negócios." },
                { icon: "📋", titulo: "Split Payment automático", desc: "O imposto será recolhido automaticamente no pagamento. Fim da inadimplência fiscal — sem necessidade de Guias manuais." },
                { icon: "🧾", titulo: "Simples Nacional — atenção", desc: "Empresas do Simples podem optar pelo recolhimento separado do IBS/CBS para garantir créditos aos clientes do regime normal." },
              ].map(item => (
                <div key={item.titulo} style={{
                  display: "flex", gap: 12, padding: "12px 14px",
                  background: "var(--bg-input)", borderRadius: 10,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{item.titulo}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#DF9F2010", borderRadius: 8, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
              ⚠️ <strong style={{ color: "var(--primary)" }}>Estimativa educacional.</strong> As alíquotas finais do IBS e CBS ainda serão definidas pelo Comitê Gestor e legislação complementar. Consulte um contador para planejamento tributário.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ABA CALCULADORA ───────────────────────────────────────────────────────────
function AbaCalculadora({ user, onSimulacaoSalva, onCalculado }) {
  const [etapa, setEtapa] = useState(1);
  const [empresa, setEmpresa] = useState("");
  const [fatMensal, setFatMensal] = useState("");
  const [atividade, setAtividade] = useState("servicos");
  const [folha, setFolha] = useState("");
  const [custos, setCustos] = useState("");
  const [resultados, setResultados] = useState([]);
  const [melhor, setMelhor] = useState(null);
  const [economia, setEconomia] = useState(0);

  const fatAnual = parseVal(fatMensal) * 12;
  const folhaVal = parseVal(folha);
  const custosVal = parseVal(custos);

  const calcular = async () => {
    const atv = atividade === "contabil" ? "servicos" : atividade;
    const simples = calcSimples(fatAnual, atv);
    const lp = calcLP(fatAnual, atv, folhaVal);
    const lr = calcLR(fatAnual, folhaVal, custosVal);
    const todos = [simples, lp, lr].filter(Boolean);
    todos.sort((a, b) => a.anual - b.anual);

    const melhorR = todos[0];
    const piorR = todos[todos.length - 1];
    const eco = piorR.anual - melhorR.anual;

    setResultados(todos); setMelhor(melhorR); setEconomia(eco); setEtapa(3);

    if (onCalculado) onCalculado({ fatAnual, atividade, melhor: melhorR });

    try {
      await supabase.from("simulacoes").insert({
        user_id: user.id, empresa, atividade,
        faturamento_mensal: parseVal(fatMensal),
        faturamento_anual: fatAnual,
        folha_mensal: folhaVal, custos_mensais: custosVal,
        regime_recomendado: melhorR.regime, imposto_anual: melhorR.anual,
        aliquota_efetiva: melhorR.aliqEfetiva, resultados: todos,
      });
      if (onSimulacaoSalva) onSimulacaoSalva();
    } catch (_) {}
  };

  const nova = () => {
    setEtapa(1); setResultados([]); setMelhor(null); setEconomia(0);
    setEmpresa(""); setFatMensal(""); setFolha(""); setCustos(""); setAtividade("servicos");
  };

  const maxAnual = resultados.length > 0 ? Math.max(...resultados.map((r) => r.anual)) : 1;
  const dadosPDF = { empresa, faturamentoAnual: fatAnual, atividade, folha: folhaVal, custos: custosVal, resultados, melhor, economia };

  return (
    <div style={{ padding: "32px 28px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Calculadora Tributária</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>Compare os 3 regimes e descubra o mais vantajoso</p>
        </div>
        {etapa === 3 && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={() => gerarPDF(dadosPDF)} style={{ fontSize: 13, padding: "8px 14px", borderColor: "var(--primary)", color: "var(--primary)" }}>
              📄 PDF
            </button>
            <button className="btn-ghost" onClick={nova} style={{ fontSize: 13, padding: "8px 14px" }}>＋ Nova</button>
          </div>
        )}
      </div>

      <StepIndicator etapa={etapa} />

      {/* ETAPA 1 */}
      {etapa === 1 && (
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Dados da Empresa</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="label">Nome da empresa (opcional)</label>
              <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ex: Empresa ABC Ltda" />
            </div>
            <div>
              <label className="label">Faturamento mensal (R$)</label>
              <input type="tel" inputMode="numeric" value={fatMensal}
                onChange={(e) => setFatMensal(fmtInput(e.target.value))}
                placeholder="Digite os dígitos (ex: 30000000 = R$ 300.000,00)" />
              {fatAnual > 0 && (
                <div style={{ marginTop: 6, fontSize: 13, color: "var(--primary)" }}>
                  Faturamento anual: <strong>{fmt(fatAnual)}</strong>
                  {fatAnual > 4800000 && (
                    <span style={{ color: "var(--amber)", marginLeft: 8 }}>⚠️ Acima do limite do Simples</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="label">Atividade principal</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 4 }}>
                {atividades.map((a) => (
                  <button key={a.id} onClick={() => setAtividade(a.id)} style={{
                    background: atividade === a.id ? "var(--primary-glow)" : "var(--bg-input)",
                    border: `2px solid ${atividade === a.id ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: 10, padding: "14px 12px",
                    color: atividade === a.id ? "var(--primary)" : "var(--muted)",
                    fontWeight: 600, fontSize: 14,
                    display: "flex", alignItems: "center", gap: 8,
                    boxShadow: atividade === a.id ? "0 0 16px var(--primary-glow)" : "none",
                  }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button className="btn-primary" style={{ width: "100%", marginTop: 28 }}
            disabled={!fatMensal || parseVal(fatMensal) === 0} onClick={() => setEtapa(2)}>
            Próximo →
          </button>
        </div>
      )}

      {/* ETAPA 2 */}
      {etapa === 2 && (
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Custos e Encargos</h2>
          <div style={{
            background: "var(--bg-input)", borderRadius: 10, padding: "12px 16px",
            marginBottom: 24, display: "flex", gap: 24, flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Faturamento Anual</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>{fmt(fatAnual)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Atividade</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{atividades.find((a) => a.id === atividade)?.label}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="label">Folha de pagamento mensal (R$)</label>
              <input type="tel" inputMode="numeric" value={folha}
                onChange={(e) => setFolha(fmtInput(e.target.value))} placeholder="Digite os dígitos" />
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Inclui salários, pró-labore e benefícios</div>
            </div>
            <div>
              <label className="label">Custos e despesas mensais (R$)</label>
              <input type="tel" inputMode="numeric" value={custos}
                onChange={(e) => setCustos(fmtInput(e.target.value))} placeholder="Digite os dígitos" />
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Exceto folha — aluguel, fornecedores, etc.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setEtapa(1)}>← Voltar</button>
            <button className="btn-primary" style={{ flex: 2 }} onClick={calcular}>Calcular regimes →</button>
          </div>
        </div>
      )}

      {/* ETAPA 3 */}
      {etapa === 3 && resultados.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Destaque */}
          <div style={{
            background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
            borderRadius: 16, padding: 24, boxShadow: "0 0 40px #DF9F2033",
          }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.85, marginBottom: 6 }}>Regime mais vantajoso</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>{melhor.regime}</div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {[["Imposto Anual", fmt(melhor.anual)], ["Imposto Mensal", fmt(melhor.mensal)], ["Alíquota Efetiva", pct(melhor.aliqEfetiva)]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{l}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Economia */}
          {economia > 0 && (
            <div style={{ background: "#0f2d1a", border: "2px solid #22c55e", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28 }}>💰</div>
              <div>
                <div style={{ fontSize: 13, color: "#86efac", fontWeight: 600 }}>Economia em relação ao regime mais caro</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e" }}>{fmt(economia)}/ano</div>
                <div style={{ fontSize: 13, color: "#86efac" }}>{fmt(economia / 12)}/mês</div>
              </div>
            </div>
          )}

          {/* Cards */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Comparativo Completo</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {resultados.map((r) => <RegimeCard key={r.regime} r={r} maxAnual={maxAnual} melhor={melhor} />)}
            </div>
          </div>

          {fatAnual > 4800000 && (
            <div style={{ background: "#2d1a0f", border: "1px solid var(--amber)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#fcd34d" }}>
              ⚠️ <strong>Simples Nacional não disponível</strong> — faturamento acima de R$ 4,8 milhões.
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn-ghost" style={{ flex: 1, borderColor: "var(--primary)", color: "var(--primary)" }} onClick={() => gerarPDF(dadosPDF)}>
              📄 Exportar PDF
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={nova}>＋ Nova Simulação</button>
          </div>

          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
            Simulação salva automaticamente. Os valores são estimativas — consulte um contador.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SIMULADOR TRIBUTÁRIO — wrapper com sub-abas ───────────────────────────────
function AbaSimuladorTributario({ user, simulacoes, onDeletar, onSimulacaoSalva, simInicial }) {
  const [subAba, setSubAba] = useState("calculadora");
  const [simParaAbrir, setSimParaAbrir] = useState(simInicial || null);
  const [dadosCalc, setDadosCalc] = useState(null);

  const abrirDoHistorico = (s) => {
    setSimParaAbrir(s);
    setSubAba("calculadora");
  };

  const handleCalculado = (dados) => {
    setDadosCalc(dados);
  };

  const tabs = [
    { id: "calculadora", label: "⚖️ Calculadora" },
    { id: "historico", label: `📋 Histórico (${simulacoes.length})` },
    { id: "reforma", label: "⚡ Reforma Tributária" },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ padding: "20px 28px 0", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubAba(tab.id)}
              style={{
                padding: "10px 18px", background: "none", border: "none",
                borderBottom: subAba === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
                color: subAba === tab.id ? "var(--primary)" : tab.id === "reforma" && dadosCalc ? "var(--amber)" : "var(--muted)",
                fontWeight: subAba === tab.id ? 700 : 500,
                fontSize: 13, cursor: "pointer", marginBottom: -1, transition: "all 0.15s",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {tab.label}
              {tab.id === "reforma" && dadosCalc && subAba !== "reforma" && (
                <span style={{
                  marginLeft: 6, fontSize: 9, fontWeight: 800,
                  background: "var(--amber)", color: "#000",
                  padding: "1px 6px", borderRadius: 10,
                }}>NOVO</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {subAba === "calculadora" && (
        <AbaCalculadora
          user={user}
          simInicial={simParaAbrir}
          onSimulacaoSalva={onSimulacaoSalva}
          onCalculado={handleCalculado}
        />
      )}
      {subAba === "historico" && (
        <AbaHistorico
          simulacoes={simulacoes}
          onDeletar={onDeletar}
          onRecarregar={abrirDoHistorico}
          setAba={() => setSubAba("calculadora")}
        />
      )}
      {subAba === "reforma" && (
        <AbaReforma dadosCalc={dadosCalc} />
      )}
    </div>
  );
}

// ─── ABA HISTÓRICO ─────────────────────────────────────────────────────────────
function AbaHistorico({ simulacoes, onDeletar, onRecarregar, setAba }) {
  const atividadeLabel = { comercio: "Comércio", industria: "Indústria", servicos: "Serviços", contabil: "Contábil/Jurídico" };

  return (
    <div style={{ padding: "32px 28px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Histórico de Simulações</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{simulacoes.length} simulação{simulacoes.length !== 1 ? "ões" : ""} salva{simulacoes.length !== 1 ? "s" : ""}</p>
      </div>

      {simulacoes.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Nenhuma simulação ainda</div>
          <button className="btn-primary" onClick={() => setAba("calculadora")}>Fazer primeira simulação →</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {simulacoes.map((s) => (
          <div key={s.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "16px 20px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.empresa || "Sem nome"}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {atividadeLabel[s.atividade] || s.atividade} • {new Date(s.created_at).toLocaleDateString("pt-BR")}
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>{s.regime_recomendado}</span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{fmt(s.imposto_anual)}/ano</span>
                <span style={{ fontSize: 13, color: "var(--violet)" }}>{pct(s.aliquota_efetiva)} efetivo</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ fontSize: 12, padding: "7px 14px" }} onClick={() => onRecarregar(s)}>Abrir</button>
              <button className="btn-danger" style={{ fontSize: 12, padding: "7px 14px" }} onClick={() => onDeletar(s.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function CalculadoraPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("home");
  const { pode } = useAssinatura();
  const [simulacoes, setSimulacoes] = useState([]);
  const [simParaAbrir, setSimParaAbrir] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
      carregarSimulacoes();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const carregarSimulacoes = async () => {
    const { data } = await supabase.from("simulacoes").select("*").order("created_at", { ascending: false }).limit(50);
    setSimulacoes(data || []);
  };

  const deletarSim = async (id) => {
    await supabase.from("simulacoes").delete().eq("id", id);
    setSimulacoes((prev) => prev.filter((s) => s.id !== id));
  };

  const abrirSim = (s) => {
    setSimParaAbrir(s);
    setAbaAtiva("calculadora");
  };

  if (!user) return null;

  return (
    <>
      <Head>
        <title>GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout user={user} abaAtiva={abaAtiva} setAba={setAbaAtiva}>
        {abaAtiva === "home" && (
          <AbaHome user={user} setAba={setAbaAtiva} pode={pode} />
        )}
        {abaAtiva === "calculadora" && (
          <AbaSimuladorTributario
            user={user}
            simulacoes={simulacoes}
            onDeletar={deletarSim}
            onSimulacaoSalva={carregarSimulacoes}
            simInicial={simParaAbrir}
          />
        )}
      </Layout>
    </>
  );
}
