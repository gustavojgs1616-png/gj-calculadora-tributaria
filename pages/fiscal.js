import { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import CardBloqueado from "../components/CardBloqueado";

// ── Base de dados fiscal ──────────────────────────────────────────────────────

const TIPOS = {
  federal:     { label: "Federal",     cor: "#3b82f6", bg: "#3b82f618" },
  trabalhista: { label: "Trabalhista", cor: "#22c55e", bg: "#22c55e18" },
  declaracao:  { label: "Declaração",  cor: "#8b5cf6", bg: "#8b5cf618" },
  simples:     { label: "Simples",     cor: "#DF9F20", bg: "#DF9F2018" },
  estadual:    { label: "Estadual",    cor: "#f97316", bg: "#f9731618" },
  pessoal:     { label: "Pessoal",     cor: "#818cf8", bg: "#818cf818" },
};

const TIPOS_EVENTO = [
  { id: "lembrete",  label: "🔔 Lembrete",       cor: "#818cf8" },
  { id: "reuniao",   label: "🤝 Reunião",         cor: "#22c55e" },
  { id: "pagamento", label: "💸 Pagamento",       cor: "#f97316" },
  { id: "prazo",     label: "⏰ Prazo",           cor: "#ef4444" },
  { id: "cliente",   label: "👤 Cliente",         cor: "#DF9F20" },
  { id: "outro",     label: "📌 Outro",           cor: "#94a3b8" },
];

const OBRIGACOES_MENSAIS = [
  { id: "fgts_envio", nome: "FGTS — Envio da Folha",  dia: 15, tipo: "trabalhista", regime: ["Todos"],                          descricao: "Prazo para envio da folha de pagamento ao SEFIP/eSocial referente à competência do mês anterior.", orgao: "Caixa Econômica Federal" },
  { id: "fgts",      nome: "FGTS — Vencimento",      dia: 20, tipo: "trabalhista", regime: ["Todos"],                          descricao: "Vencimento da guia de recolhimento do FGTS referente à competência do mês anterior. Alteração pela Portaria MTE/MF nº 26/2024.", orgao: "Caixa Econômica Federal" },
  { id: "das",        nome: "DAS — Simples Nacional",  dia: 20, tipo: "simples",     regime: ["Simples Nacional", "MEI"],        descricao: "Documento de Arrecadação do Simples Nacional. Inclui todos os tributos federais, estaduais e municipais em uma única guia.", orgao: "Receita Federal" },
  { id: "gps",        nome: "GPS — INSS Patronal",     dia: 20, tipo: "trabalhista", regime: ["Lucro Presumido", "Lucro Real"],  descricao: "Guia da Previdência Social — contribuição patronal (20%) e cota do empregado sobre a folha de pagamento.", orgao: "INSS / Receita Federal" },
  { id: "irrf",       nome: "IRRF — Folha",            dia: 20, tipo: "federal",     regime: ["Todos"],                          descricao: "Imposto de Renda Retido na Fonte incidente sobre rendimentos do trabalho assalariado.", orgao: "Receita Federal" },
  { id: "irpj_csll",  nome: "IRPJ/CSLL — Estimativa", dia: 25, tipo: "federal",     regime: ["Lucro Real"],                     descricao: "Recolhimento mensal por estimativa do IRPJ (15% + adicional 10%) e CSLL (9%) sobre receita bruta ou balancete.", orgao: "Receita Federal" },
  { id: "pis_cofins", nome: "PIS/COFINS",              dia: 25, tipo: "federal",     regime: ["Lucro Real", "Lucro Presumido"],  descricao: "Contribuição ao PIS (0,65%/1,65%) e COFINS (3%/7,6%) conforme regime de apuração.", orgao: "Receita Federal" },
  { id: "dctf",       nome: "DCTF",                    dia: 25, tipo: "declaracao",  regime: ["Lucro Presumido", "Lucro Real"],  descricao: "Declaração de Débitos e Créditos Tributários Federais.", orgao: "Receita Federal" },
  { id: "efd_contrib",nome: "EFD-Contribuições",       dia: 10, tipo: "declaracao",  regime: ["Lucro Real", "Lucro Presumido"],  descricao: "Escrituração Fiscal Digital das Contribuições — apuração do PIS/COFINS e contribuição previdenciária.", orgao: "Receita Federal" },
];

const OBRIGACOES_TRIMESTRAIS = [
  { id: "irpj_lp_q1", nome: "IRPJ/CSLL — Lucro Presumido", dia: 31, tipo: "federal", regime: ["Lucro Presumido"], meses: [3, 6, 9, 12], descricao: "IRPJ (15% + 10% adicional) e CSLL (9%) apurados trimestralmente sobre o lucro presumido.", orgao: "Receita Federal" },
];

const OBRIGACOES_ANUAIS_2026 = [
  { id: "dirf26",      nome: "DIRF 2026",        dia: 27, mes: 2,  tipo: "declaracao",  regime: ["Todos"],                         orgao: "Receita Federal", descricao: "Declaração do IRRF — informar todos os rendimentos pagos com retenção." },
  { id: "defis26",     nome: "DEFIS 2026",        dia: 31, mes: 3,  tipo: "declaracao",  regime: ["Simples Nacional"],               orgao: "Receita Federal", descricao: "Declaração de Informações Socioeconômicas e Fiscais — obrigatória para empresas do Simples Nacional." },
  { id: "rais26",      nome: "RAIS 2026",         dia: 28, mes: 3,  tipo: "trabalhista", regime: ["Todos"],                         orgao: "MTE",             descricao: "Relação Anual de Informações Sociais — declaração de vínculos empregatícios." },
  { id: "dirpf26",     nome: "DIRPF 2026",        dia: 29, mes: 5,  tipo: "declaracao",  regime: ["Pessoa Física"],                 orgao: "Receita Federal", descricao: "Declaração do IRPF — prazo limite para entrega sem multa." },
  { id: "ecd26",       nome: "ECD 2026",          dia: 29, mes: 5,  tipo: "declaracao",  regime: ["Lucro Presumido", "Lucro Real"], orgao: "Receita Federal", descricao: "Escrituração Contábil Digital — entrega obrigatória para Lucro Presumido e Real." },
  { id: "dasnsimei26", nome: "DASN-SIMEI 2026",   dia: 31, mes: 5,  tipo: "declaracao",  regime: ["MEI"],                          orgao: "Receita Federal", descricao: "Declaração Anual do Simples Nacional para MEI — informar o faturamento do ano anterior." },
  { id: "ecf26",       nome: "ECF 2026",          dia: 31, mes: 7,  tipo: "declaracao",  regime: ["Lucro Presumido", "Lucro Real"], orgao: "Receita Federal", descricao: "Escrituração Contábil Fiscal — apuração do IRPJ e CSLL." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDiasNoMes(ano, mes) { return new Date(ano, mes, 0).getDate(); }

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

function getProximas(hoje, dias = 45) {
  const resultado = [];
  for (let i = 0; i <= dias; i++) {
    const d = new Date(hoje); d.setDate(hoje.getDate() + i);
    const ano = d.getFullYear(), mes = d.getMonth() + 1, dia = d.getDate();
    const mapa = getObrigacoesPorDia(ano, mes);
    if (mapa[dia]) mapa[dia].forEach((ob) => resultado.push({ ...ob, data: new Date(ano, mes - 1, dia), dias: i }));
  }
  return resultado;
}

function dataISO(ano, mes, dia) {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const btnNavStyle = {
  width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
  background: "var(--bg-card)", color: "var(--text)", fontSize: 20, fontWeight: 700,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};

// ── Helpers horário ───────────────────────────────────────────────────────────
// Encode: se horario definido, embute como "⏰HH:MM\n" no início de descricao
function encodeDescricao(horario, obs) {
  if (horario) return `⏰${horario}\n${obs || ""}`;
  return obs || "";
}
// Decode: extrai horario e obs do campo descricao
function decodeDescricao(descricao) {
  if (!descricao) return { horario: "", obs: "" };
  const m = descricao.match(/^⏰(\d{2}:\d{2})\n?([\s\S]*)$/);
  if (m) return { horario: m[1], obs: m[2] };
  return { horario: "", obs: descricao };
}

// ── Modal de novo evento ──────────────────────────────────────────────────────

function ModalEvento({ dia, mes, ano, onSalvar, onFechar, saving }) {
  const [titulo, setTitulo]     = useState("");
  const [obs, setObs]           = useState("");
  const [horario, setHorario]   = useState("");
  const [tipo, setTipo]         = useState("lembrete");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const cor = TIPOS_EVENTO.find((t) => t.id === tipo)?.cor || "#818cf8";

  const salvar = () => {
    if (!titulo.trim()) return;
    const descricao = encodeDescricao(horario, obs);
    onSalvar({ titulo, descricao, tipo, cor });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000070", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px #000000aa" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Novo evento</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{dia} de {MESES[mes - 1]} de {ano}</div>
          </div>
          <button onClick={onFechar} style={{ background: "none", color: "var(--muted)", fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Tipo */}
          <div>
            <label className="label">Tipo</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {TIPOS_EVENTO.map((t) => (
                <button key={t.id} onClick={() => setTipo(t.id)} style={{
                  padding: "8px 6px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: tipo === t.id ? t.cor + "22" : "var(--bg-input)",
                  border: `1.5px solid ${tipo === t.id ? t.cor : "var(--border)"}`,
                  color: tipo === t.id ? t.cor : "var(--muted)",
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="label">Título *</label>
            <input ref={inputRef} value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião com cliente ABC" maxLength={80}
              onKeyDown={(e) => e.key === "Enter" && salvar()} />
          </div>

          {/* Horário + Observação lado a lado */}
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
            <div>
              <label className="label">Horário</label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 14, pointerEvents: "none", color: horario ? cor : "var(--muted)",
                }}>⏰</span>
                <input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  style={{ paddingLeft: 32, colorScheme: "dark" }}
                />
              </div>
            </div>
            <div>
              <label className="label">Observação</label>
              <input value={obs} onChange={(e) => setObs(e.target.value)}
                placeholder="Detalhes, link, cliente..." maxLength={120} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onFechar} className="btn-ghost" style={{ flex: 1 }}>Cancelar</button>
            <button
              onClick={salvar}
              disabled={!titulo.trim() || saving}
              className="btn-primary" style={{ flex: 2 }}>
              {saving ? "Salvando..." : "Salvar evento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Card de obrigação ─────────────────────────────────────────────────────────

function CardObrigacao({ ob, compact = false, concluido, onToggle, notaConcluido }) {
  const tipo = TIPOS[ob.tipo] || TIPOS.federal;
  const [expanded, setExpanded] = useState(false);
  const [notaInput, setNotaInput] = useState(notaConcluido || "");
  const [editandoNota, setEditandoNota] = useState(false);

  return (
    <div style={{
      borderLeft: `4px solid ${concluido ? "#22c55e" : tipo.cor}`,
      background: concluido ? "#0f2d1a" : tipo.bg,
      borderRadius: 10, padding: compact ? "10px 12px" : "14px 16px",
      opacity: concluido ? 0.85 : 1, transition: "all 0.2s",
      border: concluido ? "1px solid #22c55e44" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, cursor: compact ? "default" : "pointer" }}
          onClick={() => !compact && setExpanded(!expanded)}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {concluido && <span style={{ fontSize: 14 }}>✅</span>}
            <span style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: concluido ? "#86efac" : "var(--text)", textDecoration: concluido ? "line-through" : "none" }}>
              {ob.nome}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: tipo.cor, background: tipo.cor + "22", borderRadius: 5, padding: "2px 7px" }}>
              {tipo.label}
            </span>
            {ob.recorrencia && (
              <span style={{ fontSize: 10, color: "var(--muted)", background: "#E0E3FF12", borderRadius: 5, padding: "2px 7px", border: "1px solid var(--border)" }}>
                {ob.recorrencia}
              </span>
            )}
          </div>
          {!compact && (
            <div style={{ marginTop: 5, display: "flex", gap: 5, flexWrap: "wrap" }}>
              {ob.regime?.map((r) => (
                <span key={r} style={{ fontSize: 11, color: "var(--muted)", background: "#E0E3FF10", borderRadius: 4, padding: "2px 6px" }}>{r}</span>
              ))}
            </div>
          )}
          {!compact && expanded && (
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10, lineHeight: 1.6 }}>
              {ob.descricao}
              {ob.orgao && <><br /><strong style={{ color: "var(--text)" }}>Órgão:</strong> {ob.orgao}</>}
            </p>
          )}
          {concluido && notaConcluido && !editandoNota && (
            <div style={{ fontSize: 12, color: "#86efac", marginTop: 4, fontStyle: "italic" }}>📝 {notaConcluido}</div>
          )}
        </div>

        {/* Botão marcar concluído */}
        {onToggle && (
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
            title={concluido ? "Desmarcar" : "Marcar como concluído"}
            style={{
              width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${concluido ? "#22c55e" : "var(--border)"}`,
              background: concluido ? "#22c55e22" : "transparent",
              color: concluido ? "#22c55e" : "var(--muted)",
              fontSize: 15, cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {concluido ? "✓" : "○"}
          </button>
        )}
      </div>

      {/* Nota ao marcar concluído */}
      {concluido && onToggle && editandoNota && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <input value={notaInput} onChange={(e) => setNotaInput(e.target.value)}
            placeholder="Observação (opcional)..."
            style={{ fontSize: 12, padding: "6px 10px" }}
            onKeyDown={(e) => e.key === "Enter" && setEditandoNota(false)} />
          <button onClick={() => setEditandoNota(false)} style={{ fontSize: 12, padding: "6px 12px", background: "none", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 6 }}>OK</button>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function FiscalPage() {
  const router = useRouter();
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [user, setUser] = useState(null);
  const hoje = useMemo(() => new Date(), []);
  const [mesAtual, setMesAtual]         = useState(hoje.getMonth() + 1);
  const [anoAtual, setAnoAtual]         = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());
  const [abaView, setAbaView]           = useState("calendario");
  const [dbOk, setDbOk]                 = useState(true); // tabelas existem?

  // Dados pessoais
  const [eventos, setEventos]           = useState([]);   // { id, data, titulo, descricao, tipo, cor }
  const [concluidos, setConcluidos]     = useState([]);   // { id, obrigacao_id, mes, ano, observacao }
  const [modalDia, setModalDia]         = useState(null); // dia p/ novo evento
  const [saving, setSaving]             = useState(false);

  // Auth + carrega dados
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
      carregarDados(session.user.id);
    });
  }, [router]);

  const carregarDados = async (uid) => {
    const [{ data: ev, error: e1 }, { data: con, error: e2 }] = await Promise.all([
      supabase.from("fiscal_eventos").select("*").eq("user_id", uid).order("data"),
      supabase.from("fiscal_concluidos").select("*").eq("user_id", uid),
    ]);
    if (e1?.code === "42P01" || e2?.code === "42P01") { setDbOk(false); return; }
    setEventos(ev || []);
    setConcluidos(con || []);
  };

  // Helpers de estado
  const isConcluido = (obId, mes, ano) =>
    concluidos.some((c) => c.obrigacao_id === obId && c.mes === mes && c.ano === ano);

  const getObservacao = (obId, mes, ano) =>
    concluidos.find((c) => c.obrigacao_id === obId && c.mes === mes && c.ano === ano)?.observacao || "";

  const toggleConcluido = async (ob) => {
    if (!user) return;
    const jaFeito = isConcluido(ob.id, mesAtual, anoAtual);
    if (jaFeito) {
      // Desmarca
      const item = concluidos.find((c) => c.obrigacao_id === ob.id && c.mes === mesAtual && c.ano === anoAtual);
      setConcluidos((prev) => prev.filter((c) => c.id !== item?.id));
      await supabase.from("fiscal_concluidos").delete().eq("id", item?.id);
    } else {
      // Marca
      const novo = { user_id: user.id, obrigacao_id: ob.id, mes: mesAtual, ano: anoAtual, observacao: "" };
      const { data } = await supabase.from("fiscal_concluidos").insert(novo).select().single();
      if (data) setConcluidos((prev) => [...prev, data]);
    }
  };

  const adicionarEvento = async ({ titulo, descricao, tipo, cor }) => {
    if (!user || !modalDia) return;
    setSaving(true);
    const novoEv = {
      user_id: user.id,
      data: dataISO(anoAtual, mesAtual, modalDia),
      titulo, descricao, tipo, cor,
    };
    const { data } = await supabase.from("fiscal_eventos").insert(novoEv).select().single();
    if (data) setEventos((prev) => [...prev, data]);
    setModalDia(null);
    setSaving(false);
  };

  const excluirEvento = async (id) => {
    setEventos((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("fiscal_eventos").delete().eq("id", id);
  };

  // Calendário
  const obrigacoesPorDia  = useMemo(() => getObrigacoesPorDia(anoAtual, mesAtual), [anoAtual, mesAtual]);
  const proximasObrigacoes = useMemo(() => getProximas(hoje, 45), [hoje]);
  const obrigacoesDia      = obrigacoesPorDia[diaSelecionado] || [];

  const eventosDia = useMemo(() => {
    if (!diaSelecionado) return [];
    const iso = dataISO(anoAtual, mesAtual, diaSelecionado);
    return eventos.filter((e) => e.data === iso);
  }, [eventos, diaSelecionado, mesAtual, anoAtual]);

  const eventosPorDia = useMemo(() => {
    const mapa = {};
    eventos.forEach((ev) => {
      const [aStr, mStr, dStr] = ev.data.split("-");
      const a = parseInt(aStr), m = parseInt(mStr), d = parseInt(dStr);
      if (a === anoAtual && m === mesAtual) {
        if (!mapa[d]) mapa[d] = [];
        mapa[d].push(ev);
      }
    });
    return mapa;
  }, [eventos, anoAtual, mesAtual]);

  const primeiroDiaMes = new Date(anoAtual, mesAtual - 1, 1).getDay();
  const diasNoMes      = getDiasNoMes(anoAtual, mesAtual);
  const totalCelulas   = Math.ceil((primeiroDiaMes + diasNoMes) / 7) * 7;

  const isHoje = (d) => d === hoje.getDate() && mesAtual === hoje.getMonth() + 1 && anoAtual === hoje.getFullYear();

  const mudarMes = (delta) => {
    let m = mesAtual + delta, a = anoAtual;
    if (m > 12) { m = 1; a++; }
    if (m < 1)  { m = 12; a--; }
    setMesAtual(m); setAnoAtual(a); setDiaSelecionado(null);
  };

  // Resumo minha agenda — obrigações do mês com status
  const resumoMes = useMemo(() => {
    const todasObs = Object.values(obrigacoesPorDia).flat();
    return todasObs.map((ob) => ({
      ...ob,
      concluido: isConcluido(ob.id, mesAtual, anoAtual),
      observacao: getObservacao(ob.id, mesAtual, anoAtual),
    })).sort((a, b) => a.dia - b.dia);
  }, [obrigacoesPorDia, concluidos, mesAtual, anoAtual]);

  const eventosMes = useMemo(() =>
    eventos.filter((e) => {
      const [a, m] = e.data.split("-").map(Number);
      return a === anoAtual && m === mesAtual;
    }).sort((a, b) => a.data.localeCompare(b.data)),
    [eventos, anoAtual, mesAtual]
  );

  if (!user || carregandoPlano) return null;
  if (!pode("fiscal")) return (
    <Layout user={user}>
      <CardBloqueado ferramenta="fiscal" planoNecessario="essencial" />
    </Layout>
  );

  return (
    <>
      <Head>
        <title>Calendário Fiscal — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Calendário Fiscal</h1>
            <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
              Obrigações tributárias, acessórias e trabalhistas — com controle pessoal por usuário
            </p>
          </div>

          {/* Aviso de DB não configurado */}
          {!dbOk && (
            <div style={{ background: "#f9731618", border: "1px solid #f9731644", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#fdba74" }}>
              ⚠️ <strong>Tabelas do controle pessoal não encontradas.</strong> Execute o SQL de setup no Supabase para habilitar eventos e marcações pessoais.
            </div>
          )}

          {/* Abas */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-card)", borderRadius: 12, padding: 4, width: "fit-content", border: "1px solid var(--border)", flexWrap: "wrap" }}>
            {[
              { id: "calendario", label: "📆 Calendário" },
              { id: "proximas",   label: "⏰ Próximas (45 dias)" },
              { id: "agenda",     label: "📝 Minha Agenda" },
              { id: "todas",      label: "📋 Todas as obrigações" },
            ].map((aba) => (
              <button key={aba.id} onClick={() => setAbaView(aba.id)} style={{
                padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: abaView === aba.id ? "var(--primary-glow)" : "transparent",
                border: abaView === aba.id ? "1px solid var(--primary)" : "1px solid transparent",
                color: abaView === aba.id ? "var(--primary)" : "var(--muted)",
                cursor: "pointer",
              }}>{aba.label}</button>
            ))}
          </div>

          {/* Legenda */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            {Object.entries(TIPOS).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: v.cor }} /> {v.label}
              </div>
            ))}
          </div>

          {/* ══ ABA CALENDÁRIO ══ */}
          {abaView === "calendario" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }} className="fiscal-grid">

              {/* Calendário */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <button onClick={() => mudarMes(-1)} style={btnNavStyle}>‹</button>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{MESES[mesAtual - 1]} {anoAtual}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setMesAtual(hoje.getMonth() + 1); setAnoAtual(hoje.getFullYear()); setDiaSelecionado(hoje.getDate()); }}
                      style={{ ...btnNavStyle, fontSize: 12, padding: "6px 14px", width: "auto" }}>Hoje</button>
                    <button onClick={() => mudarMes(1)} style={btnNavStyle}>›</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                  {DIAS_SEMANA.map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--muted)", padding: "4px 0" }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {Array.from({ length: totalCelulas }).map((_, i) => {
                    const dia = i - primeiroDiaMes + 1;
                    const valido = dia >= 1 && dia <= diasNoMes;
                    const obs = valido ? (obrigacoesPorDia[dia] || []) : [];
                    const evs = valido ? (eventosPorDia[dia] || []) : [];
                    const selecionado = dia === diaSelecionado && valido;
                    const ehHoje = valido && isHoje(dia);
                    const temConcluidos = valido && obs.some((ob) => isConcluido(ob.id, mesAtual, anoAtual));

                    return (
                      <div key={i} onClick={() => valido && setDiaSelecionado(dia)} style={{
                        minHeight: 64, borderRadius: 10, padding: "8px 6px",
                        background: selecionado ? "var(--primary-glow)" : ehHoje ? "#E0E3FF10" : "transparent",
                        border: `1px solid ${selecionado ? "var(--primary)" : ehHoje ? "#808CFF44" : "var(--border)"}`,
                        cursor: valido ? "pointer" : "default",
                        opacity: valido ? 1 : 0.2,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        position: "relative",
                      }}>
                        {valido && (
                          <>
                            <span style={{
                              fontSize: 13, fontWeight: ehHoje ? 800 : selecionado ? 700 : 500,
                              color: selecionado ? "var(--primary)" : ehHoje ? "#808CFF" : "var(--text)",
                              width: 26, height: 26, borderRadius: "50%",
                              background: ehHoje && !selecionado ? "#808CFF22" : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{dia}</span>
                            <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                              {obs.slice(0, 3).map((ob, idx) => (
                                <div key={idx} style={{
                                  width: 6, height: 6, borderRadius: "50%",
                                  background: isConcluido(ob.id, mesAtual, anoAtual) ? "#22c55e" : TIPOS[ob.tipo]?.cor,
                                }} />
                              ))}
                              {evs.slice(0, 2).map((ev, idx) => (
                                <div key={"ev" + idx} style={{ width: 6, height: 6, borderRadius: "50%", background: ev.cor || "#818cf8" }} />
                              ))}
                              {(obs.length + evs.length) > 5 && <span style={{ fontSize: 9, color: "var(--muted)" }}>+{obs.length + evs.length - 5}</span>}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Painel do dia selecionado */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                {diaSelecionado ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                        {isHoje(diaSelecionado) ? "📍 Hoje — " : ""}
                        {diaSelecionado} de {MESES[mesAtual - 1]} de {anoAtual}
                      </h2>
                      {dbOk && (
                        <button onClick={() => setModalDia(diaSelecionado)} style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: "var(--primary-glow)", border: "1px solid var(--primary)",
                          color: "var(--primary)", cursor: "pointer",
                        }}>+ Adicionar evento</button>
                      )}
                    </div>

                    {/* Eventos pessoais do dia */}
                    {eventosDia.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Meus eventos</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {eventosDia.map((ev) => {
                            const tipoEv = TIPOS_EVENTO.find((t) => t.id === ev.tipo);
                            const { horario: evHora, obs: evObs } = decodeDescricao(ev.descricao);
                            return (
                              <div key={ev.id} style={{
                                borderLeft: `4px solid ${ev.cor}`, background: ev.cor + "15",
                                borderRadius: 10, padding: "12px 14px",
                                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8,
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                      {tipoEv?.label.split(" ")[0]} {ev.titulo}
                                    </span>
                                    {evHora && (
                                      <span style={{
                                        fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 10,
                                        background: ev.cor + "25", color: ev.cor, flexShrink: 0,
                                      }}>⏰ {evHora}</span>
                                    )}
                                  </div>
                                  {evObs && <div style={{ fontSize: 12, color: "var(--muted)" }}>{evObs}</div>}
                                </div>
                                <button onClick={() => excluirEvento(ev.id)} style={{ background: "none", color: "var(--muted)", fontSize: 14, padding: 4, cursor: "pointer" }}>✕</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Obrigações fiscais do dia */}
                    {obrigacoesDia.length === 0 && eventosDia.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                        <p style={{ color: "var(--muted)", fontSize: 14 }}>Nenhuma obrigação nesta data.</p>
                      </div>
                    ) : obrigacoesDia.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Obrigações fiscais</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {obrigacoesDia.map((ob) => (
                            <CardObrigacao key={ob.id} ob={ob}
                              concluido={isConcluido(ob.id, mesAtual, anoAtual)}
                              notaConcluido={getObservacao(ob.id, mesAtual, anoAtual)}
                              onToggle={dbOk ? () => toggleConcluido(ob) : undefined}
                            />
                          ))}
                        </div>
                      </>
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

          {/* ══ ABA PRÓXIMAS ══ */}
          {abaView === "proximas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {proximasObrigacoes.map((ob, i) => {
                const tipo = TIPOS[ob.tipo] || TIPOS.federal;
                const urgente = ob.dias <= 3, proximo = ob.dias <= 7;
                const concluido = isConcluido(ob.id, ob.data.getMonth() + 1, ob.data.getFullYear());
                return (
                  <div key={`${ob.id}-${i}`} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    background: concluido ? "#0f2d1a" : "var(--bg-card)",
                    border: `1px solid ${urgente && !concluido ? tipo.cor + "55" : concluido ? "#22c55e44" : "var(--border)"}`,
                    borderLeft: `4px solid ${concluido ? "#22c55e" : tipo.cor}`,
                    borderRadius: 12, padding: "14px 18px", opacity: concluido ? 0.75 : 1,
                  }}>
                    <div style={{ textAlign: "center", minWidth: 52 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: concluido ? "#22c55e" : urgente ? tipo.cor : "var(--text)" }}>{ob.data.getDate()}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{MESES[ob.data.getMonth()].slice(0, 3).toUpperCase()}</div>
                    </div>
                    <div style={{ width: 1, height: 40, background: "var(--border)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {concluido && <span>✅</span>}
                        <span style={{ fontSize: 14, fontWeight: 700, textDecoration: concluido ? "line-through" : "none", color: concluido ? "#86efac" : "var(--text)" }}>{ob.nome}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: tipo.cor, background: tipo.bg, borderRadius: 5, padding: "2px 7px" }}>{tipo.label}</span>
                        {urgente && !concluido && <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "#ef444418", borderRadius: 5, padding: "2px 7px" }}>⚠ URGENTE</span>}
                        {!urgente && proximo && !concluido && <span style={{ fontSize: 10, fontWeight: 700, color: "#f97316", background: "#f9731618", borderRadius: 5, padding: "2px 7px" }}>Em breve</span>}
                      </div>
                      <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>{ob.regime?.join(" · ")}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ textAlign: "right", minWidth: 56, fontSize: 13, fontWeight: 700, color: concluido ? "#22c55e" : urgente ? "#ef4444" : proximo ? "#f97316" : "var(--muted)" }}>
                        {concluido ? "Feito" : ob.dias === 0 ? "Hoje" : ob.dias === 1 ? "Amanhã" : `${ob.dias} dias`}
                      </div>
                      {dbOk && (
                        <button onClick={() => toggleConcluido({ ...ob, id: ob.id })} title={concluido ? "Desmarcar" : "Marcar feito"}
                          style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${concluido ? "#22c55e" : "var(--border)"}`, background: concluido ? "#22c55e22" : "transparent", color: concluido ? "#22c55e" : "var(--muted)", fontSize: 14, cursor: "pointer" }}>
                          {concluido ? "✓" : "○"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ ABA MINHA AGENDA ══ */}
          {abaView === "agenda" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="agenda-grid">

              {/* Obrigações do mês com status */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                    Obrigações — {MESES[mesAtual - 1]} {anoAtual}
                  </h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => mudarMes(-1)} style={{ ...btnNavStyle, width: 28, height: 28 }}>‹</button>
                    <button onClick={() => mudarMes(1)}  style={{ ...btnNavStyle, width: 28, height: 28 }}>›</button>
                  </div>
                </div>

                {/* Progresso */}
                {(() => {
                  const total = resumoMes.length;
                  const feitos = resumoMes.filter((o) => o.concluido).length;
                  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
                  return (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Progresso do mês</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: pct === 100 ? "#22c55e" : "var(--primary)" }}>{feitos}/{total} concluídas</span>
                      </div>
                      <div style={{ background: "var(--bg-input)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 6, background: pct === 100 ? "#22c55e" : "linear-gradient(90deg, var(--primary), #B27F1A)", width: `${pct}%`, transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5 }}>{pct}% concluído</div>
                    </div>
                  );
                })()}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {resumoMes.map((ob) => (
                    <div key={ob.id + ob.dia} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{
                        minWidth: 40, height: 40, borderRadius: 9, fontWeight: 800, fontSize: 14,
                        background: ob.concluido ? "#22c55e22" : TIPOS[ob.tipo]?.bg,
                        color: ob.concluido ? "#22c55e" : TIPOS[ob.tipo]?.cor,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {ob.concluido ? "✓" : ob.dia}
                      </div>
                      <div style={{ flex: 1 }}>
                        <CardObrigacao ob={ob}
                          concluido={ob.concluido}
                          notaConcluido={ob.observacao}
                          onToggle={dbOk ? () => toggleConcluido(ob) : undefined}
                        />
                      </div>
                    </div>
                  ))}
                  {resumoMes.length === 0 && (
                    <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: 24 }}>Nenhuma obrigação neste mês.</p>
                  )}
                </div>
              </div>

              {/* Eventos pessoais do mês */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Meus Eventos — {MESES[mesAtual - 1]}</h2>
                  {dbOk && (
                    <button onClick={() => { setDiaSelecionado(hoje.getDate()); setAbaView("calendario"); setTimeout(() => setModalDia(hoje.getDate()), 100); }}
                      style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "var(--primary-glow)", border: "1px solid var(--primary)", color: "var(--primary)", cursor: "pointer" }}>
                      + Novo evento
                    </button>
                  )}
                </div>

                {eventosMes.length === 0 ? (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 32, textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Nenhum evento pessoal</div>
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>Clique em um dia no calendário e adicione reuniões, lembretes ou prazos de clientes.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {eventosMes.map((ev) => {
                      const [, , d] = ev.data.split("-").map(Number);
                      const tipoEv = TIPOS_EVENTO.find((t) => t.id === ev.tipo);
                      const { horario: evHora, obs: evObs } = decodeDescricao(ev.descricao);
                      return (
                        <div key={ev.id} style={{
                          borderLeft: `4px solid ${ev.cor}`, background: ev.cor + "12",
                          borderRadius: 12, padding: "14px 16px",
                          display: "flex", gap: 12, alignItems: "flex-start",
                        }}>
                          {/* Badge de data */}
                          <div style={{
                            minWidth: 44, flexShrink: 0,
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                          }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: 10,
                              background: ev.cor + "22", color: ev.cor,
                              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 800, gap: 1,
                            }}>
                              <span style={{ fontSize: 16, fontWeight: 800 }}>{d}</span>
                              <span>{MESES[mesAtual - 1].slice(0, 3)}</span>
                            </div>
                            {evHora && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: ev.cor,
                                background: ev.cor + "22", borderRadius: 6,
                                padding: "2px 5px", whiteSpace: "nowrap",
                              }}>⏰ {evHora}</span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                              {tipoEv?.label.split(" ")[0]} {ev.titulo}
                            </div>
                            {evObs && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{evObs}</div>}
                            <span style={{ fontSize: 10, fontWeight: 700, color: ev.cor, background: ev.cor + "22", borderRadius: 5, padding: "2px 7px", display: "inline-block" }}>
                              {tipoEv?.label}
                            </span>
                          </div>
                          <button onClick={() => excluirEvento(ev.id)} style={{ background: "none", color: "var(--muted)", fontSize: 16, padding: 4, cursor: "pointer", flexShrink: 0 }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ABA TODAS ══ */}
          {abaView === "todas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  🔄 Obrigações Mensais <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>— todo mês</span>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OBRIGACOES_MENSAIS.sort((a, b) => a.dia - b.dia).map((ob) => (
                    <div key={ob.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 44, height: 44, borderRadius: 10, fontWeight: 800, fontSize: 16, background: TIPOS[ob.tipo]?.bg, color: TIPOS[ob.tipo]?.cor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ob.dia}</div>
                      <div style={{ flex: 1 }}><CardObrigacao ob={{ ...ob, recorrencia: "Mensal" }} /></div>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  📊 Obrigações Trimestrais <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>— mar, jun, set, dez</span>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OBRIGACOES_TRIMESTRAIS.map((ob) => <CardObrigacao key={ob.id} ob={{ ...ob, recorrencia: "Trimestral" }} />)}
                </div>
              </section>
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📌 Obrigações Anuais 2026</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OBRIGACOES_ANUAIS_2026.sort((a, b) => a.mes !== b.mes ? a.mes - b.mes : a.dia - b.dia).map((ob) => (
                    <div key={ob.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 64, padding: "8px 4px", borderRadius: 10, fontWeight: 700, fontSize: 12, background: TIPOS[ob.tipo]?.bg, color: TIPOS[ob.tipo]?.cor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: 1 }}>
                        <span style={{ fontSize: 16, fontWeight: 800 }}>{ob.dia}</span>
                        <span>{MESES[ob.mes - 1].slice(0, 3).toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1 }}><CardObrigacao ob={{ ...ob, recorrencia: "Anual 2026" }} /></div>
                    </div>
                  ))}
                </div>
              </section>
              <div style={{ background: "#DF9F2010", border: "1px solid #DF9F2033", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "var(--muted)" }}>
                ⚠ <strong style={{ color: "var(--primary)" }}>Atenção:</strong> quando o vencimento cair em final de semana ou feriado, o prazo é prorrogado para o próximo dia útil. Consulte sempre o calendário oficial da Receita Federal.
              </div>
            </div>
          )}
        </div>
      </Layout>

      {/* Modal novo evento */}
      {modalDia && (
        <ModalEvento
          dia={modalDia} mes={mesAtual} ano={anoAtual}
          onSalvar={adicionarEvento}
          onFechar={() => setModalDia(null)}
          saving={saving}
        />
      )}

      <style jsx global>{`
        @media (min-width: 900px) {
          .fiscal-grid  { grid-template-columns: 1fr 340px !important; }
          .agenda-grid  { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 899px) {
          .agenda-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
