import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

const ADMIN_EMAIL = "gustavo_jgs@hotmail.com";

const PLANOS = ["free", "essencial", "profissional", "especialista"];
const STATUS = ["ativo", "trial", "inadimplente", "cancelado"];

const COR_PLANO = {
  free: "#64748b",
  essencial: "#22c55e",
  profissional: "#818cf8",
  especialista: "#DF9F20",
};

const COR_STATUS = {
  ativo: "#22c55e",
  trial: "#3b82f6",
  inadimplente: "#f97316",
  cancelado: "#ef4444",
  free: "#64748b",
};

const LABEL_PLANO = {
  free: "Free",
  essencial: "Starter",
  profissional: "Pro",
  especialista: "Elite",
};

// ── Temas ────────────────────────────────────────────────────────────────────
const TEMAS = {
  dark: {
    pageBg:        "radial-gradient(ellipse at 30% 20%, #0a0e3a 0%, #000433 50%, #00031F 100%)",
    headerBg:      "rgba(0,4,51,0.6)",
    headerBorder:  "#1a2060",
    text:          "#F5F6FF",
    textSub:       "#9098C8",
    muted:         "#6670B8",
    accent:        "#808CFF",
    border:        "#1a2060",
    tableBorder:   "#0d1340",
    tableHeadBg:   "rgba(128,140,255,0.05)",
    cardBg:        "rgba(255,255,255,0.03)",
    rowAlt:        "rgba(255,255,255,0.01)",
    rowHover:      "rgba(128,140,255,0.04)",
    inputBg:       "rgba(255,255,255,0.08)",
    inputBorder:   "#2a3480",
    inputColor:    "#F5F6FF",
    modalBg:       "#000D3D",
    modalBorder:   "#1a2060",
    btnRefreshBg:  "rgba(128,140,255,0.15)",
    btnRefreshBdr: "#808CFF40",
    btnRefreshClr: "#808CFF",
    btnBackBg:     "transparent",
    btnBackBdr:    "#1a2060",
    btnBackClr:    "#6670B8",
    resultClr:     "#A0AADF",
    limparBdr:     "#2a3480",
    limparClr:     "#A0AADF",
    metricBorder:  (cor) => `${cor}30`,
    metricBg:      () => "rgba(255,255,255,0.03)",
    subPlanoBg:    (cor) => `${cor}08`,
    subPlanoBdr:   (cor) => `${cor}30`,
    toggleIcon:    "☀️",
    toggleLabel:   "Tema claro",
  },
  light: {
    pageBg:        "#f0f2f9",
    headerBg:      "#ffffff",
    headerBorder:  "#e5e7eb",
    text:          "#111827",
    textSub:       "#4b5563",
    muted:         "#6b7280",
    accent:        "#4f46e5",
    border:        "#e5e7eb",
    tableBorder:   "#f0f4f8",
    tableHeadBg:   "rgba(79,70,229,0.04)",
    cardBg:        "#ffffff",
    rowAlt:        "#f8fafc",
    rowHover:      "rgba(79,70,229,0.04)",
    inputBg:       "#f9fafb",
    inputBorder:   "#d1d5db",
    inputColor:    "#111827",
    modalBg:       "#ffffff",
    modalBorder:   "#e5e7eb",
    btnRefreshBg:  "rgba(79,70,229,0.08)",
    btnRefreshBdr: "#4f46e540",
    btnRefreshClr: "#4f46e5",
    btnBackBg:     "transparent",
    btnBackBdr:    "#e5e7eb",
    btnBackClr:    "#6b7280",
    resultClr:     "#4b5563",
    limparBdr:     "#d1d5db",
    limparClr:     "#6b7280",
    metricBorder:  (cor) => `${cor}40`,
    metricBg:      () => "#ffffff",
    subPlanoBg:    (cor) => `${cor}12`,
    subPlanoBdr:   (cor) => `${cor}40`,
    toggleIcon:    "🌙",
    toggleLabel:   "Tema escuro",
  },
};

// ── Funções de data — sempre Brasília ────────────────────────────────────────
const BRT = { timeZone: "America/Sao_Paulo" };

function fmt(data) {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", BRT);
}

function fmtRelativo(data) {
  if (!data) return "—";
  const diff = Math.floor((Date.now() - new Date(data).getTime()) / (1000 * 60));
  if (diff < 1)    return "agora mesmo";
  if (diff < 60)   return `há ${diff} min`;
  const horas = Math.floor(diff / 60);
  if (horas < 24)  return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1)  return "ontem";
  if (dias < 7)    return `há ${dias} dias`;
  if (dias < 30)   return `há ${Math.floor(dias / 7)} sem.`;
  if (dias < 365)  return `há ${Math.floor(dias / 30)} meses`;
  return fmt(data);
}

function fmtExp(data) {
  if (!data) return "—";
  const d = new Date(data);
  const hoje = new Date();
  const diff = Math.ceil((d - hoje) / (1000 * 60 * 60 * 24));
  const label = fmt(data);
  if (diff < 0)   return `${label} (expirado)`;
  if (diff <= 30) return `${label} (${diff}d)`;
  return label;
}

function fmtHoraBRT(data) {
  if (!data) return "—";
  return new Date(data).toLocaleString("pt-BR", BRT);
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser]             = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados]           = useState(null);
  const [filtroBusca, setFiltroBusca]       = useState("");
  const [filtroPlano, setFiltroPlano]       = useState("todos");
  const [filtroStatus, setFiltroStatus]     = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo]   = useState("todos");
  const [filtroCadastro, setFiltroCadastro] = useState("todos");
  const [filtroAcesso, setFiltroAcesso]     = useState("todos");
  const [filtroExpira, setFiltroExpira]     = useState("todos");
  const [editando, setEditando]   = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [salvando, setSalvando]   = useState(false);
  const [msgSalvo, setMsgSalvo]   = useState("");

  // Tema — persiste no localStorage
  const [tema, setTema] = useState("dark");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin_tema") : null;
    if (saved === "light" || saved === "dark") setTema(saved);
  }, []);
  const toggleTema = () => {
    const novo = tema === "dark" ? "light" : "dark";
    setTema(novo);
    localStorage.setItem("admin_tema", novo);
  };

  const T = TEMAS[tema];

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session)                              { router.replace("/login"); return; }
      if (session.user.email !== ADMIN_EMAIL)    { router.replace("/home"); return; }
      setUser(session.user);
    });
  }, [router]);

  // ── Busca dados ───────────────────────────────────────────────────────────
  const buscarDados = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/admin/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setDados(json);
    setCarregando(false);
  }, [user]);

  useEffect(() => { buscarDados(); }, [buscarDados]);

  // ── Excluir ───────────────────────────────────────────────────────────────
  async function confirmarExclusao() {
    setSalvando(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/admin/usuarios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: excluindo.id, user_id: excluindo.user_id }),
    });
    setSalvando(false);
    if (res.ok) {
      setMsgSalvo("🗑️ Usuário excluído.");
      setExcluindo(null);
      buscarDados();
      setTimeout(() => setMsgSalvo(""), 3000);
    } else {
      const json = await res.json();
      setMsgSalvo(`❌ ${json.error || "Erro ao excluir."}`);
    }
  }

  // ── Salvar edição ─────────────────────────────────────────────────────────
  async function salvarEdicao() {
    setSalvando(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editando),
    });
    setSalvando(false);
    if (res.ok) {
      setMsgSalvo("✅ Salvo com sucesso!");
      setEditando(null);
      buscarDados();
      setTimeout(() => setMsgSalvo(""), 3000);
    } else {
      setMsgSalvo("❌ Erro ao salvar.");
    }
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  const agora = new Date();
  const inicioDia    = new Date(agora); inicioDia.setHours(0, 0, 0, 0);
  const inicioSemana = new Date(agora - 7  * 86400000);
  const inicioMes    = new Date(agora - 30 * 86400000);

  const usuariosFiltrados = (dados?.usuarios || []).filter((u) => {
    if (filtroBusca) {
      const q = filtroBusca.toLowerCase();
      if (!u.email?.toLowerCase().includes(q) && !u.nome?.toLowerCase().includes(q)) return false;
    }
    if (filtroPlano !== "todos" && u.plano !== filtroPlano) return false;
    if (filtroStatus !== "todos" && u.status !== filtroStatus) return false;
    if (filtroPeriodo !== "todos" && u.periodicidade !== filtroPeriodo) return false;
    if (filtroCadastro !== "todos") {
      const d = new Date(u.created_at);
      if (filtroCadastro === "hoje"   && d < inicioDia)    return false;
      if (filtroCadastro === "semana" && d < inicioSemana) return false;
      if (filtroCadastro === "mes"    && d < inicioMes)    return false;
    }
    if (filtroAcesso !== "todos") {
      if (filtroAcesso === "nunca" && u.ultimo_acesso) return false;
      if (filtroAcesso !== "nunca") {
        if (!u.ultimo_acesso) return false;
        const d = new Date(u.ultimo_acesso);
        if (filtroAcesso === "hoje"   && d < inicioDia)    return false;
        if (filtroAcesso === "semana" && d < inicioSemana) return false;
        if (filtroAcesso === "mes"    && d < inicioMes)    return false;
      }
    }
    if (filtroExpira !== "todos") {
      const exp = u.data_expiracao ? new Date(u.data_expiracao) : null;
      if (filtroExpira === "expirado")   { if (!exp || exp > agora) return false; }
      if (filtroExpira === "30dias")     { if (!exp || exp <= agora || exp > new Date(agora.getTime() + 30*86400000)) return false; }
      if (filtroExpira === "90dias")     { if (!exp || exp <= agora || exp > new Date(agora.getTime() + 90*86400000)) return false; }
      if (filtroExpira === "sem_expira") { if (exp) return false; }
    }
    return true;
  });

  const limparFiltros = () => {
    setFiltroBusca(""); setFiltroPlano("todos"); setFiltroStatus("todos");
    setFiltroPeriodo("todos"); setFiltroCadastro("todos");
    setFiltroAcesso("todos"); setFiltroExpira("todos");
  };

  const temFiltroAtivo = filtroBusca || filtroPlano !== "todos" || filtroStatus !== "todos" ||
    filtroPeriodo !== "todos" || filtroCadastro !== "todos" ||
    filtroAcesso !== "todos" || filtroExpira !== "todos";

  if (!user) return null;

  const m = dados?.metricas;

  // ── Estilos derivados do tema ─────────────────────────────────────────────
  const thInputStyle = {
    width: "100%",
    background: T.inputBg,
    border: `1px solid ${T.inputBorder}`,
    borderRadius: 6,
    padding: "5px 8px",
    color: T.inputColor,
    fontFamily: "'Saira', sans-serif",
    fontSize: 12,
    outline: "none",
  };

  const thSelectStyle = {
    width: "100%",
    background: T.inputBg,
    border: `1px solid ${T.inputBorder}`,
    borderRadius: 6,
    padding: "5px 6px",
    color: T.inputColor,
    fontFamily: "'Saira', sans-serif",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
  };

  const selectStyle = {
    background: T.inputBg,
    border: `1px solid ${T.inputBorder}`,
    borderRadius: 8,
    padding: "9px 12px",
    color: T.inputColor,
    fontFamily: "'Saira', sans-serif",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    color: T.muted,
    marginBottom: 6,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <>
      <Head>
        <title>Admin — GJ Hub Contábil</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div style={{
        minHeight: "100vh",
        background: T.pageBg,
        fontFamily: "'Saira', sans-serif",
        color: T.text,
        padding: 0,
      }}>

        {/* ── Header ── */}
        <div style={{
          borderBottom: `1px solid ${T.headerBorder}`,
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: T.headerBg,
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>⚙️ Painel Admin</span>
            <span style={{
              background: "#DF9F2020",
              color: "#DF9F20",
              border: "1px solid #DF9F2040",
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 12,
              fontWeight: 600,
            }}>GJ Hub Contábil</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {msgSalvo && (
              <span style={{ fontSize: 13, color: msgSalvo.startsWith("✅") ? "#22c55e" : "#ef4444" }}>
                {msgSalvo}
              </span>
            )}
            {/* Toggle de tema */}
            <button
              onClick={toggleTema}
              title={T.toggleLabel}
              style={{
                background: T.btnRefreshBg,
                border: `1px solid ${T.btnRefreshBdr}`,
                color: T.btnRefreshClr,
                borderRadius: 8,
                padding: "7px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "'Saira', sans-serif",
              }}
            >
              {T.toggleIcon} {T.toggleLabel}
            </button>
            <button
              onClick={buscarDados}
              style={{
                background: T.btnRefreshBg,
                border: `1px solid ${T.btnRefreshBdr}`,
                color: T.btnRefreshClr,
                borderRadius: 8,
                padding: "7px 16px",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "'Saira', sans-serif",
              }}
            >
              🔄 Atualizar
            </button>
            <button
              onClick={() => router.push("/home")}
              style={{
                background: T.btnBackBg,
                border: `1px solid ${T.btnBackBdr}`,
                color: T.btnBackClr,
                borderRadius: 8,
                padding: "7px 16px",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "'Saira', sans-serif",
              }}
            >
              ← Hub
            </button>
          </div>
        </div>

        <div style={{ padding: "28px 32px", maxWidth: 1500, margin: "0 auto" }}>

          {/* ── Métricas ── */}
          {m && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 14,
              marginBottom: 28,
            }}>
              {[
                { label: "Total cadastros",   valor: m.total,         cor: "#808CFF", icon: "👥" },
                { label: "Plano Free",        valor: m.free,          cor: "#64748b", icon: "🆓" },
                { label: "Assinantes ativos", valor: m.ativos,        cor: "#22c55e", icon: "✅" },
                { label: "Em trial",          valor: m.trial,         cor: "#3b82f6", icon: "⏳" },
                { label: "Inadimplentes",     valor: m.inadimplentes, cor: "#f97316", icon: "⚠️" },
                { label: "Cancelados",        valor: m.cancelados,    cor: "#ef4444", icon: "❌" },
                { label: "Novos hoje",        valor: m.novosHoje,     cor: "#DF9F20", icon: "🆕" },
                { label: "Últimos 7 dias",    valor: m.novosSeteDias, cor: "#a78bfa", icon: "📅" },
              ].map((card) => (
                <div key={card.label} style={{
                  background: T.metricBg(card.cor),
                  border: `1px solid ${T.metricBorder(card.cor)}`,
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  boxShadow: tema === "light" ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
                }}>
                  <span style={{ fontSize: 12, color: T.muted }}>{card.icon} {card.label}</span>
                  <span style={{ fontSize: 28, fontWeight: 700, color: card.cor }}>{card.valor}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Sub-métricas por plano ── */}
          {m && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 28,
            }}>
              {[
                { plano: "free",         label: "Free",    cor: COR_PLANO.free },
                { plano: "essencial",    label: "Starter", cor: COR_PLANO.essencial },
                { plano: "profissional", label: "Pro",     cor: COR_PLANO.profissional },
                { plano: "especialista", label: "Elite",   cor: COR_PLANO.especialista },
              ].map((p) => (
                <div key={p.plano} style={{
                  background: T.subPlanoBg(p.cor),
                  border: `1px solid ${T.subPlanoBdr(p.cor)}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: tema === "light" ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                }}>
                  <span style={{ fontSize: 13, color: p.cor, fontWeight: 600 }}>{p.label}</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: p.cor }}>{m.porPlano[p.plano]}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Resultado + limpar ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: T.resultClr }}>
              {usuariosFiltrados.length} resultado{usuariosFiltrados.length !== 1 ? "s" : ""}
              {temFiltroAtivo && " (filtrado)"}
            </span>
            {temFiltroAtivo && (
              <button onClick={limparFiltros} style={{
                background: "transparent",
                border: `1px solid ${T.limparBdr}`,
                color: T.limparClr,
                borderRadius: 6,
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'Saira', sans-serif",
              }}>
                ✕ Limpar filtros
              </button>
            )}
          </div>

          {/* ── Tabela ── */}
          {carregando ? (
            <div style={{ textAlign: "center", padding: 60, color: T.muted }}>
              Carregando usuários...
            </div>
          ) : (
            <div style={{
              background: T.cardBg,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: tema === "light" ? "0 1px 6px rgba(0,0,0,0.07)" : "none",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  {/* Labels */}
                  <tr style={{ background: T.tableHeadBg }}>
                    {["Nome / E-mail", "Plano", "Período", "Status", "Cadastro", "Último acesso", "Expira", "Ações"].map((h) => (
                      <th key={h} style={{
                        padding: "10px 14px 4px",
                        textAlign: "left",
                        fontSize: 11,
                        color: T.muted,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                  {/* Filtros por coluna */}
                  <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.tableHeadBg }}>
                    {/* Nome */}
                    <th style={{ padding: "4px 14px 10px" }}>
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={filtroBusca}
                        onChange={(e) => setFiltroBusca(e.target.value)}
                        style={thInputStyle}
                      />
                    </th>
                    {/* Plano */}
                    <th style={{ padding: "4px 14px 10px" }}>
                      <select value={filtroPlano} onChange={(e) => setFiltroPlano(e.target.value)} style={thSelectStyle}>
                        <option value="todos">Todos</option>
                        <option value="free">Free</option>
                        <option value="essencial">Starter</option>
                        <option value="profissional">Pro</option>
                        <option value="especialista">Elite</option>
                      </select>
                    </th>
                    {/* Período */}
                    <th style={{ padding: "4px 14px 10px" }}>
                      <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} style={thSelectStyle}>
                        <option value="todos">Todos</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                      </select>
                    </th>
                    {/* Status */}
                    <th style={{ padding: "4px 14px 10px" }}>
                      <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={thSelectStyle}>
                        <option value="todos">Todos</option>
                        <option value="ativo">ativo</option>
                        <option value="trial">trial</option>
                        <option value="inadimplente">inadimplente</option>
                        <option value="cancelado">cancelado</option>
                        <option value="free">free</option>
                      </select>
                    </th>
                    {/* Cadastro */}
                    <th style={{ padding: "4px 14px 10px" }}>
                      <select value={filtroCadastro} onChange={(e) => setFiltroCadastro(e.target.value)} style={thSelectStyle}>
                        <option value="todos">Todos</option>
                        <option value="hoje">Hoje</option>
                        <option value="semana">Últimos 7d</option>
                        <option value="mes">Últimos 30d</option>
                      </select>
                    </th>
                    {/* Último acesso */}
                    <th style={{ padding: "4px 14px 10px" }}>
                      <select value={filtroAcesso} onChange={(e) => setFiltroAcesso(e.target.value)} style={thSelectStyle}>
                        <option value="todos">Todos</option>
                        <option value="hoje">Hoje</option>
                        <option value="semana">Últimos 7d</option>
                        <option value="mes">Últimos 30d</option>
                        <option value="nunca">Nunca</option>
                      </select>
                    </th>
                    {/* Expira */}
                    <th style={{ padding: "4px 14px 10px" }}>
                      <select value={filtroExpira} onChange={(e) => setFiltroExpira(e.target.value)} style={thSelectStyle}>
                        <option value="todos">Todos</option>
                        <option value="expirado">Expirado</option>
                        <option value="30dias">Próx. 30d</option>
                        <option value="90dias">Próx. 90d</option>
                        <option value="sem_expira">Sem data</option>
                      </select>
                    </th>
                    {/* Ações */}
                    <th style={{ padding: "4px 14px 10px" }} />
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 40, color: T.muted }}>
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u, i) => (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: `1px solid ${T.tableBorder}`,
                          background: i % 2 === 0 ? "transparent" : T.rowAlt,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = T.rowHover}
                        onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : T.rowAlt}
                      >
                        {/* Nome/Email */}
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{u.nome}</div>
                          <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>{u.email}</div>
                        </td>

                        {/* Plano */}
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            background: `${COR_PLANO[u.plano] || "#64748b"}18`,
                            color: COR_PLANO[u.plano] || "#64748b",
                            border: `1px solid ${COR_PLANO[u.plano] || "#64748b"}30`,
                            borderRadius: 6,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            {LABEL_PLANO[u.plano] || u.plano || "—"}
                          </span>
                        </td>

                        {/* Período (mensal / anual) */}
                        <td style={{ padding: "12px 14px" }}>
                          {u.periodicidade ? (
                            <span style={{
                              background: u.periodicidade === "anual" ? "#DF9F2015" : "#3b82f615",
                              color: u.periodicidade === "anual" ? "#DF9F20" : "#3b82f6",
                              border: `1px solid ${u.periodicidade === "anual" ? "#DF9F2030" : "#3b82f630"}`,
                              borderRadius: 6,
                              padding: "3px 10px",
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}>
                              {u.periodicidade === "anual" ? "📅 Anual" : "🔄 Mensal"}
                            </span>
                          ) : (
                            <span style={{ color: T.muted, fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            background: `${COR_STATUS[u.status] || "#64748b"}18`,
                            color: COR_STATUS[u.status] || "#64748b",
                            border: `1px solid ${COR_STATUS[u.status] || "#64748b"}30`,
                            borderRadius: 6,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            {u.status || "—"}
                          </span>
                        </td>

                        {/* Cadastro */}
                        <td style={{ padding: "12px 14px", fontSize: 13, color: T.text }}>
                          {fmt(u.created_at)}
                        </td>

                        {/* Último acesso */}
                        <td style={{ padding: "12px 14px", fontSize: 13, color: T.text }}>
                          {u.ultimo_acesso ? (
                            <span title={fmtHoraBRT(u.ultimo_acesso)}>
                              {fmtRelativo(u.ultimo_acesso)}
                            </span>
                          ) : (
                            <span style={{ color: T.muted }}>Nunca</span>
                          )}
                        </td>

                        {/* Expira */}
                        <td style={{
                          padding: "12px 14px",
                          fontSize: 13,
                          color: u.data_expiracao && new Date(u.data_expiracao) < new Date() ? "#ef4444" : T.text,
                        }}>
                          {fmtExp(u.data_expiracao)}
                        </td>

                        {/* Ações */}
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => setEditando({
                                id: u.id,
                                plano: u._free_puro ? "essencial" : (u.plano || "free"),
                                status: u._free_puro ? "ativo" : (u.status || "ativo"),
                                data_expiracao: u.data_expiracao ? u.data_expiracao.slice(0, 10) : "",
                                _email: u.email,
                                _nome: u.nome,
                                _free_puro: u._free_puro || false,
                              })}
                              style={{
                                background: u._free_puro ? "rgba(34,197,94,0.12)" : "rgba(128,140,255,0.12)",
                                border: `1px solid ${u._free_puro ? "#22c55e30" : "#808CFF30"}`,
                                color: u._free_puro ? "#22c55e" : "#808CFF",
                                borderRadius: 6,
                                padding: "5px 12px",
                                cursor: "pointer",
                                fontSize: 12,
                                fontFamily: "'Saira', sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              {u._free_puro ? "⬆️ Upgrade" : "✏️ Editar"}
                            </button>
                            <button
                              onClick={() => setExcluindo({ id: u.id, user_id: u.user_id, _email: u.email, _nome: u.nome })}
                              style={{
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid #ef444430",
                                color: "#ef4444",
                                borderRadius: 6,
                                padding: "5px 10px",
                                cursor: "pointer",
                                fontSize: 12,
                                fontFamily: "'Saira', sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Modal Exclusão ── */}
        {excluindo && (
          <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, backdropFilter: "blur(4px)",
          }}>
            <div style={{
              background: T.modalBg,
              border: "1px solid #ef444440",
              borderRadius: 16,
              padding: 32,
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 25px 80px rgba(239,68,68,0.2)",
            }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>
                  Excluir usuário?
                </h3>
                <p style={{ fontSize: 13, color: T.muted, margin: "8px 0 0", lineHeight: 1.6 }}>
                  Isso vai remover <strong style={{ color: T.text }}>{excluindo._nome}</strong><br />
                  <span style={{ color: "#ef4444" }}>{excluindo._email}</span><br />
                  do banco e cancelar o acesso. Ação irreversível.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={confirmarExclusao}
                  disabled={salvando}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                    border: "none",
                    color: "#fff",
                    borderRadius: 8,
                    padding: 11,
                    cursor: salvando ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Saira', sans-serif",
                    opacity: salvando ? 0.7 : 1,
                  }}
                >
                  {salvando ? "Excluindo..." : "🗑️ Sim, excluir"}
                </button>
                <button
                  onClick={() => setExcluindo(null)}
                  style={{
                    background: T.btnBackBg,
                    border: `1px solid ${T.btnBackBdr}`,
                    color: T.btnBackClr,
                    borderRadius: 8,
                    padding: "11px 18px",
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: "'Saira', sans-serif",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Edição ── */}
        {editando && (
          <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, backdropFilter: "blur(4px)",
          }}>
            <div style={{
              background: T.modalBg,
              border: `1px solid ${T.modalBorder}`,
              borderRadius: 16,
              padding: 32,
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
            }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>
                  {editando._free_puro ? "⬆️ Upgrade de plano" : "✏️ Editar Assinatura"}
                </h3>
                <p style={{ fontSize: 13, color: T.muted, margin: "6px 0 0" }}>
                  {editando._nome} · {editando._email}
                </p>
                {editando._free_puro && (
                  <p style={{ fontSize: 12, color: "#22c55e", margin: "4px 0 0" }}>
                    Usuário Free — vai criar uma nova assinatura
                  </p>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Plano */}
                <div>
                  <label style={labelStyle}>Plano</label>
                  <select
                    value={editando.plano}
                    onChange={(e) => setEditando({ ...editando, plano: e.target.value })}
                    style={{ ...selectStyle, width: "100%", padding: "10px 14px" }}
                  >
                    <option value="free">Free</option>
                    <option value="essencial">Starter (Essencial)</option>
                    <option value="profissional">Pro (Profissional)</option>
                    <option value="especialista">Elite (Especialista)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={editando.status}
                    onChange={(e) => setEditando({ ...editando, status: e.target.value })}
                    style={{ ...selectStyle, width: "100%", padding: "10px 14px" }}
                  >
                    <option value="ativo">ativo</option>
                    <option value="trial">trial</option>
                    <option value="inadimplente">inadimplente</option>
                    <option value="cancelado">cancelado</option>
                  </select>
                </div>

                {/* Expiração */}
                <div>
                  <label style={labelStyle}>Data de Expiração</label>
                  <input
                    type="date"
                    value={editando.data_expiracao}
                    onChange={(e) => setEditando({ ...editando, data_expiracao: e.target.value })}
                    style={{
                      width: "100%",
                      background: T.inputBg,
                      border: `1px solid ${T.inputBorder}`,
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: T.inputColor,
                      fontFamily: "'Saira', sans-serif",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {/* Atalhos rápidos */}
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {[
                      { label: "+30 dias", dias: 30 },
                      { label: "+90 dias", dias: 90 },
                      { label: "+1 ano",   dias: 365 },
                      { label: "+2 anos",  dias: 730 },
                    ].map((atalho) => (
                      <button
                        key={atalho.label}
                        onClick={() => {
                          const base = editando.data_expiracao ? new Date(editando.data_expiracao) : new Date();
                          base.setDate(base.getDate() + atalho.dias);
                          setEditando({ ...editando, data_expiracao: base.toISOString().slice(0, 10) });
                        }}
                        style={{
                          background: "rgba(128,140,255,0.1)",
                          border: "1px solid #808CFF30",
                          color: "#808CFF",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontSize: 11,
                          fontFamily: "'Saira', sans-serif",
                        }}
                      >
                        {atalho.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                  onClick={salvarEdicao}
                  disabled={salvando}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #808CFF, #5b67d8)",
                    border: "none",
                    color: "#fff",
                    borderRadius: 8,
                    padding: 11,
                    cursor: salvando ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Saira', sans-serif",
                    opacity: salvando ? 0.7 : 1,
                  }}
                >
                  {salvando ? "Salvando..." : "💾 Salvar alterações"}
                </button>
                <button
                  onClick={() => setEditando(null)}
                  style={{
                    background: T.btnBackBg,
                    border: `1px solid ${T.btnBackBdr}`,
                    color: T.btnBackClr,
                    borderRadius: 8,
                    padding: "11px 18px",
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: "'Saira', sans-serif",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
