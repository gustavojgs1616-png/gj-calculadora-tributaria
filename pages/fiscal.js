import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";

// ── Base de dados fiscal ──────────────────────────────────────────────────────

const TIPOS = {
  federal:     { label: "Federal",     cor: "#3b82f6", bg: "#3b82f618" },
  trabalhista: { label: "Trabalhista", cor: "#22c55e", bg: "#22c55e18" },
  declaracao:  { label: "Declaração",  cor: "#8b5cf6", bg: "#8b5cf618" },
  simples:     { label: "Simples",     cor: "#DF9F20", bg: "#DF9F2018" },
  estadual:    { label: "Estadual",    cor: "#f97316", bg: "#f9731618" },
};

const OBRIGACOES_MENSAIS = [
  {
    id: "fgts", nome: "FGTS", dia: 7, tipo: "trabalhista",
    regime: ["Todos"],
    descricao: "Recolhimento do FGTS referente à competência do mês anterior.",
    orgao: "Caixa Econômica Federal",
  },
  {
    id: "das", nome: "DAS — Simples Nacional", dia: 20, tipo: "simples",
    regime: ["Simples Nacional", "MEI"],
    descricao: "Documento de Arrecadação do Simples Nacional. Inclui todos os tributos federais, estaduais e municipais em uma única guia.",
    orgao: "Receita Federal",
  },
  {
    id: "gps", nome: "GPS — INSS Patronal", dia: 20, tipo: "trabalhista",
    regime: ["Lucro Presumido", "Lucro Real"],
    descricao: "Guia da Previdência Social — contribuição patronal (20%) e cota do empregado sobre a folha de pagamento.",
    orgao: "INSS / Receita Federal",
  },
  {
    id: "irrf", nome: "IRRF — Folha de Pagamento", dia: 20, tipo: "federal",
    regime: ["Todos"],
    descricao: "Imposto de Renda Retido na Fonte incidente sobre rendimentos do trabalho assalariado.",
    orgao: "Receita Federal",
  },
  {
    id: "irpj_csll", nome: "IRPJ/CSLL — Estimativa", dia: 25, tipo: "federal",
    regime: ["Lucro Real"],
    descricao: "Recolhimento mensal por estimativa do IRPJ (15% + adicional 10%) e CSLL (9%) sobre receita bruta ou balancete de suspensão/redução.",
    orgao: "Receita Federal",
  },
  {
    id: "pis_cofins", nome: "PIS/COFINS", dia: 25, tipo: "federal",
    regime: ["Lucro Real", "Lucro Presumido"],
    descricao: "Contribuição ao PIS (0,65%/1,65%) e COFINS (3%/7,6%) conforme regime de apuração.",
    orgao: "Receita Federal",
  },
  {
    id: "dctf", nome: "DCTF", dia: 25, tipo: "declaracao",
    regime: ["Lucro Presumido", "Lucro Real"],
    descricao: "Declaração de Débitos e Créditos Tributários Federais — obrigatória para empresas do Lucro Presumido e Lucro Real.",
    orgao: "Receita Federal",
  },
  {
    id: "efd_contrib", nome: "EFD-Contribuições", dia: 10, tipo: "declaracao",
    regime: ["Lucro Real", "Lucro Presumido"],
    descricao: "Escrituração Fiscal Digital das Contribuições — apuração do PIS/COFINS e contribuição previdenciária sobre receita bruta.",
    orgao: "Receita Federal",
  },
];

const OBRIGACOES_TRIMESTRAIS = [
  {
    id: "irpj_lp_q1", nome: "IRPJ/CSLL — Lucro Presumido", dia: 31, tipo: "federal",
    regime: ["Lucro Presumido"],
    meses: [3, 6, 9, 12],
    descricao: "IRPJ (15% + 10% adicional) e CSLL (9%) apurados trimestralmente sobre o lucro presumido. Vencimento no último dia útil do mês seguinte ao trimestre.",
    orgao: "Receita Federal",
  },
];

const OBRIGACOES_ANUAIS_2026 = [
  { id: "dirf26",    nome: "DIRF 2026",       dia: 27, mes: 2,  tipo: "declaracao", regime: ["Todos"], orgao: "Receita Federal", descricao: "Declaração do Imposto de Renda Retido na Fonte — informar todos os rendimentos pagos com retenção de IR." },
  { id: "defis26",   nome: "DEFIS 2026",       dia: 31, mes: 3,  tipo: "declaracao", regime: ["Simples Nacional"], orgao: "Receita Federal", descricao: "Declaração de Informações Socioeconômicas e Fiscais — obrigatória para empresas do Simples Nacional." },
  { id: "dirpf26",   nome: "DIRPF 2026",       dia: 30, mes: 4,  tipo: "declaracao", regime: ["Pessoa Física"], orgao: "Receita Federal", descricao: "Declaração do Imposto de Renda Pessoa Física — prazo limite para entrega sem multa." },
  { id: "ecd26",     nome: "ECD 2026",          dia: 29, mes: 5,  tipo: "declaracao", regime: ["Lucro Presumido", "Lucro Real"], orgao: "Receita Federal", descricao: "Escrituração Contábil Digital — entrega obrigatória para empresas tributadas pelo Lucro Presumido ou Real." },
  { id: "dasnsimei26", nome: "DASN-SIMEI 2026", dia: 31, mes: 5, tipo: "declaracao", regime: ["MEI"], orgao: "Receita Federal", descricao: "Declaração Anual do Simples Nacional para o Microempreendedor Individual — informar o faturamento do ano anterior." },
  { id: "ecf26",     nome: "ECF 2026",           dia: 31, mes: 7, tipo: "declaracao", regime: ["Lucro Presumido", "Lucro Real"], orgao: "Receita Federal", descricao: "Escrituração Contábil Fiscal — apuração do IRPJ e CSLL conforme regras da RFB." },
  { id: "rais26",    nome: "RAIS 2026",           dia: 28, mes: 3, tipo: "trabalhista", regime: ["Todos"], orgao: "MTE", descricao: "Relação Anual de Informações Sociais — declaração de vínculos empregatícios para empregadores com ou sem empregados." },
];

// ── Gerador de obrigações por mês/ano ─────────────────────────────────────────

function getDiasNoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

function getObrigacoesPorDia(ano, mes) {
  const total = getDiasNoMes(ano, mes);
  const mapa = {};

  OBRIGACOES_MENSAIS.forEach((ob) => {
    const dia = Math.min(ob.dia, total);
    if (!mapa[dia]) mapa[dia] = [];
    mapa[dia].push({ ...ob, recorrencia: "Mensal" });
  });

  OBRIGACOES_TRIMESTRAIS.forEach((ob) => {
    if (ob.meses.includes(mes)) {
      const dia = Math.min(ob.dia, total);
      if (!mapa[dia]) mapa[dia] = [];
      mapa[dia].push({ ...ob, recorrencia: "Trimestral" });
    }
  });

  OBRIGACOES_ANUAIS_2026.forEach((ob) => {
    if (ob.mes === mes) {
      const dia = Math.min(ob.dia, total);
      if (!mapa[dia]) mapa[dia] = [];
      mapa[dia].push({ ...ob, recorrencia: "Anual 2026" });
    }
  });

  return mapa;
}

// ── Próximas obrigações (30 dias) ─────────────────────────────────────────────

function getProximas(hoje, dias = 30) {
  const resultado = [];
  for (let i = 0; i <= dias; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const dia = d.getDate();
    const mapa = getObrigacoesPorDia(ano, mes);
    if (mapa[dia]) {
      mapa[dia].forEach((ob) => resultado.push({ ...ob, data: new Date(ano, mes - 1, dia), dias: i }));
    }
  }
  return resultado;
}

// ── Nomes dos meses ───────────────────────────────────────────────────────────

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// ── Componente: Card de obrigação ─────────────────────────────────────────────

function CardObrigacao({ ob, compact = false }) {
  const tipo = TIPOS[ob.tipo] || TIPOS.federal;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => !compact && setExpanded(!expanded)}
      style={{
        borderLeft: `4px solid ${tipo.cor}`,
        background: tipo.bg, borderRadius: 10,
        padding: compact ? "10px 12px" : "14px 16px",
        cursor: compact ? "default" : "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: "var(--text)" }}>{ob.nome}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: tipo.cor,
              background: tipo.cor + "22", borderRadius: 5, padding: "2px 7px",
            }}>
              {tipo.label}
            </span>
            {ob.recorrencia && (
              <span style={{
                fontSize: 10, color: "var(--muted)",
                background: "#E0E3FF12", borderRadius: 5, padding: "2px 7px", border: "1px solid var(--border)",
              }}>
                {ob.recorrencia}
              </span>
            )}
          </div>
          {!compact && (
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ob.regime?.map((r) => (
                <span key={r} style={{ fontSize: 11, color: "var(--muted)", background: "#E0E3FF10", borderRadius: 4, padding: "2px 6px" }}>
                  {r}
                </span>
              ))}
            </div>
          )}
          {!compact && expanded && (
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.6 }}>
              {ob.descricao}
              {ob.orgao && <><br /><strong style={{ color: "var(--text)" }}>Órgão:</strong> {ob.orgao}</>}
            </p>
          )}
        </div>
        {!compact && (
          <span style={{ fontSize: 16, color: "var(--muted)", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function FiscalPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());
  const [abaView, setAbaView] = useState("calendario");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
  }, [router]);

  const obrigacoesPorDia = useMemo(() => getObrigacoesPorDia(anoAtual, mesAtual), [anoAtual, mesAtual]);
  const proximasObrigacoes = useMemo(() => getProximas(hoje, 45), []);

  const obrigacoesDiaSelecionado = obrigacoesPorDia[diaSelecionado] || [];

  const primeiroDiaMes = new Date(anoAtual, mesAtual - 1, 1).getDay();
  const diasNoMes = getDiasNoMes(anoAtual, mesAtual);
  const totalCelulas = Math.ceil((primeiroDiaMes + diasNoMes) / 7) * 7;

  const irParaHoje = () => {
    setMesAtual(hoje.getMonth() + 1);
    setAnoAtual(hoje.getFullYear());
    setDiaSelecionado(hoje.getDate());
  };

  const mudarMes = (delta) => {
    let m = mesAtual + delta;
    let a = anoAtual;
    if (m > 12) { m = 1; a++; }
    if (m < 1)  { m = 12; a--; }
    setMesAtual(m);
    setAnoAtual(a);
    setDiaSelecionado(null);
  };

  const isHoje = (dia) =>
    dia === hoje.getDate() && mesAtual === hoje.getMonth() + 1 && anoAtual === hoje.getFullYear();

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Calendário Fiscal — GJ Contábil Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>

          {/* ── Cabeçalho ── */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: 0 }}>
              Calendário Fiscal
            </h1>
            <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
              Obrigações tributárias, acessórias e trabalhistas com datas de vencimento
            </p>
          </div>

          {/* ── Abas de visualização ── */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-card)", borderRadius: 12, padding: 4, width: "fit-content", border: "1px solid var(--border)" }}>
            {[
              { id: "calendario", label: "📆 Calendário" },
              { id: "proximas",   label: "⏰ Próximas (45 dias)" },
              { id: "todas",      label: "📋 Todas as obrigações" },
            ].map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaView(aba.id)}
                style={{
                  padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: abaView === aba.id ? "var(--primary-glow)" : "transparent",
                  border: abaView === aba.id ? "1px solid var(--primary)" : "1px solid transparent",
                  color: abaView === aba.id ? "var(--primary)" : "var(--muted)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {aba.label}
              </button>
            ))}
          </div>

          {/* ── Legenda de tipos ── */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            {Object.entries(TIPOS).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: v.cor }} />
                {v.label}
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              ABA: CALENDÁRIO
          ══════════════════════════════════════════════════════════════ */}
          {abaView === "calendario" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }} className="fiscal-grid">

              {/* Calendário */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                {/* Navegação mês */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <button onClick={() => mudarMes(-1)} style={btnNavStyle}>‹</button>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                      {MESES[mesAtual - 1]} {anoAtual}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={irParaHoje} style={{ ...btnNavStyle, fontSize: 12, padding: "6px 14px", width: "auto" }}>Hoje</button>
                    <button onClick={() => mudarMes(1)} style={btnNavStyle}>›</button>
                  </div>
                </div>

                {/* Grade de dias da semana */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                  {DIAS_SEMANA.map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--muted)", padding: "4px 0" }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grade do calendário */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {Array.from({ length: totalCelulas }).map((_, i) => {
                    const dia = i - primeiroDiaMes + 1;
                    const valido = dia >= 1 && dia <= diasNoMes;
                    const obs = valido ? (obrigacoesPorDia[dia] || []) : [];
                    const selecionado = dia === diaSelecionado && valido;
                    const ehHoje = valido && isHoje(dia);

                    return (
                      <div
                        key={i}
                        onClick={() => valido && setDiaSelecionado(dia)}
                        style={{
                          minHeight: 64, borderRadius: 10, padding: "8px 6px",
                          background: selecionado ? "var(--primary-glow)" : ehHoje ? "#E0E3FF10" : "transparent",
                          border: `1px solid ${selecionado ? "var(--primary)" : ehHoje ? "#808CFF44" : "var(--border)"}`,
                          cursor: valido ? "pointer" : "default",
                          opacity: valido ? 1 : 0.2,
                          transition: "all 0.15s",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        }}
                      >
                        {valido && (
                          <>
                            <span style={{
                              fontSize: 13, fontWeight: ehHoje ? 800 : selecionado ? 700 : 500,
                              color: selecionado ? "var(--primary)" : ehHoje ? "#808CFF" : "var(--text)",
                              width: 26, height: 26, borderRadius: "50%",
                              background: ehHoje && !selecionado ? "#808CFF22" : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {dia}
                            </span>
                            {obs.length > 0 && (
                              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                                {obs.slice(0, 4).map((ob, idx) => (
                                  <div key={idx} style={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    background: TIPOS[ob.tipo]?.cor || "#808CFF",
                                    flexShrink: 0,
                                  }} />
                                ))}
                                {obs.length > 4 && (
                                  <span style={{ fontSize: 9, color: "var(--muted)" }}>+{obs.length - 4}</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Painel de detalhes do dia */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                {diaSelecionado ? (
                  <>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>
                      {isHoje(diaSelecionado) ? "📍 Hoje — " : ""}
                      {diaSelecionado} de {MESES[mesAtual - 1]} de {anoAtual}
                    </h2>
                    {obrigacoesDiaSelecionado.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                        <p style={{ color: "var(--muted)", fontSize: 14 }}>Nenhuma obrigação nesta data.</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {obrigacoesDiaSelecionado.map((ob) => (
                          <CardObrigacao key={ob.id} ob={ob} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>👆</div>
                    <p style={{ fontSize: 14 }}>Clique em um dia para ver as obrigações</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ABA: PRÓXIMAS OBRIGAÇÕES
          ══════════════════════════════════════════════════════════════ */}
          {abaView === "proximas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {proximasObrigacoes.length === 0 ? (
                <p style={{ color: "var(--muted)", textAlign: "center", padding: 32 }}>Nenhuma obrigação nos próximos 45 dias.</p>
              ) : (
                proximasObrigacoes.map((ob, i) => {
                  const tipo = TIPOS[ob.tipo] || TIPOS.federal;
                  const isUrgente = ob.dias <= 3;
                  const isProximo = ob.dias <= 7;

                  return (
                    <div
                      key={`${ob.id}-${i}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 16,
                        background: "var(--bg-card)", border: `1px solid ${isUrgente ? tipo.cor + "55" : "var(--border)"}`,
                        borderLeft: `4px solid ${tipo.cor}`, borderRadius: 12, padding: "14px 18px",
                      }}
                    >
                      {/* Data */}
                      <div style={{ textAlign: "center", minWidth: 52 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: isUrgente ? tipo.cor : "var(--text)" }}>
                          {ob.data.getDate()}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                          {MESES[ob.data.getMonth()].slice(0, 3).toUpperCase()}
                        </div>
                      </div>

                      <div style={{ width: 1, height: 40, background: "var(--border)" }} />

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{ob.nome}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: tipo.cor, background: tipo.bg, borderRadius: 5, padding: "2px 7px" }}>
                            {tipo.label}
                          </span>
                          {isUrgente && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "#ef444418", borderRadius: 5, padding: "2px 7px" }}>
                              ⚠ URGENTE
                            </span>
                          )}
                          {!isUrgente && isProximo && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", background: "#f9731618", borderRadius: 5, padding: "2px 7px" }}>
                              Em breve
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
                          {ob.regime?.join(" · ")}
                        </p>
                      </div>

                      {/* Dias restantes */}
                      <div style={{ textAlign: "right", minWidth: 60 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isUrgente ? "#ef4444" : isProximo ? "#f97316" : "var(--muted)" }}>
                          {ob.dias === 0 ? "Hoje" : ob.dias === 1 ? "Amanhã" : `${ob.dias} dias`}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ABA: TODAS AS OBRIGAÇÕES
          ══════════════════════════════════════════════════════════════ */}
          {abaView === "todas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Mensais */}
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  🔄 Obrigações Mensais
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>— todo mês</span>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OBRIGACOES_MENSAIS.sort((a, b) => a.dia - b.dia).map((ob) => (
                    <div key={ob.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{
                        minWidth: 44, height: 44, borderRadius: 10, fontWeight: 800, fontSize: 16,
                        background: TIPOS[ob.tipo]?.bg, color: TIPOS[ob.tipo]?.cor,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {ob.dia}
                      </div>
                      <div style={{ flex: 1 }}>
                        <CardObrigacao ob={{ ...ob, recorrencia: "Mensal" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Trimestrais */}
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  📊 Obrigações Trimestrais
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>— março, junho, setembro, dezembro</span>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OBRIGACOES_TRIMESTRAIS.map((ob) => (
                    <CardObrigacao key={ob.id} ob={{ ...ob, recorrencia: "Trimestral" }} />
                  ))}
                </div>
              </section>

              {/* Anuais 2026 */}
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  📌 Obrigações Anuais 2026
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OBRIGACOES_ANUAIS_2026.sort((a, b) => a.mes !== b.mes ? a.mes - b.mes : a.dia - b.dia).map((ob) => (
                    <div key={ob.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{
                        minWidth: 64, padding: "8px 4px", borderRadius: 10, fontWeight: 700, fontSize: 12,
                        background: TIPOS[ob.tipo]?.bg, color: TIPOS[ob.tipo]?.cor,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: 1,
                      }}>
                        <span style={{ fontSize: 16, fontWeight: 800 }}>{ob.dia}</span>
                        <span>{MESES[ob.mes - 1].slice(0, 3).toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <CardObrigacao ob={{ ...ob, recorrencia: "Anual 2026" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Aviso */}
              <div style={{
                background: "#DF9F2010", border: "1px solid #DF9F2033",
                borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "var(--muted)",
              }}>
                ⚠ <strong style={{ color: "var(--primary)" }}>Atenção:</strong> quando o vencimento cair em final de semana ou feriado nacional, o prazo é prorrogado para o próximo dia útil. Consulte sempre o calendário oficial da Receita Federal.
              </div>
            </div>
          )}
        </div>
      </Layout>

      <style jsx global>{`
        @media (min-width: 900px) {
          .fiscal-grid {
            grid-template-columns: 1fr 340px !important;
          }
        }
      `}</style>
    </>
  );
}

const btnNavStyle = {
  width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
  background: "var(--bg-card)", color: "var(--text)", fontSize: 20, fontWeight: 700,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all 0.15s",
};
