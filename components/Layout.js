import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import { PLANOS } from "../lib/planos";

/* ──────────────────────────────────────────
   Upgrade / Trial Banner
   Exibe barra fixa no topo do conteúdo principal
   para usuários Free ou em período de teste
────────────────────────────────────────── */
function UpgradeBanner({ isTrial, diasTrial, plano, onUpgrade }) {
  const urgente = isTrial && diasTrial <= 2;
  const isExpiring = isTrial && diasTrial <= 5;

  if (isTrial) {
    return (
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 20px",
        height: 44,
        background: urgente
          ? "linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)"
          : isExpiring
            ? "linear-gradient(90deg, #78350f 0%, #92400e 100%)"
            : "linear-gradient(90deg, #1a1500 0%, #241c00 100%)",
        borderBottom: `1px solid ${urgente ? "#ef444440" : "#DF9F2030"}`,
        boxShadow: "0 1px 12px #00000030",
      }}>
        {/* Ícone */}
        <div style={{
          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
          background: urgente ? "#ef444425" : "#DF9F2025",
          border: `1px solid ${urgente ? "#ef444460" : "#DF9F2060"}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
        }}>
          {urgente ? "⚠" : "⏱"}
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: urgente ? "#fca5a5" : "#fbbf24",
          }}>
            {urgente
              ? `Teste expira em ${diasTrial} dia${diasTrial > 1 ? "s" : ""}!`
              : `${diasTrial} dias de teste restantes`}
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 6 }} className="banner-desc">
            {urgente
              ? "Assine agora para não perder o acesso aos módulos."
              : "Aproveite todos os recursos do plano Especialista."}
          </span>
        </div>

        {/* CTA */}
        <button onClick={onUpgrade} style={{
          flexShrink: 0,
          padding: "5px 14px",
          borderRadius: 6,
          background: urgente
            ? "linear-gradient(135deg, #ef4444, #dc2626)"
            : "linear-gradient(135deg, #DF9F20, #B27F1A)",
          border: "none",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
          boxShadow: `0 2px 8px ${urgente ? "#ef444440" : "#DF9F2040"}`,
          transition: "opacity 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          Assinar agora →
        </button>
      </div>
    );
  }

  /* Plano Free */
  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 40,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 20px",
      height: 44,
      background: "linear-gradient(90deg, #0d0f1f 0%, #131629 100%)",
      borderBottom: "1px solid #818cf820",
      boxShadow: "0 1px 12px #00000030",
    }}>
      {/* Badge plano */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 8px", borderRadius: 20,
        background: "#818cf818", border: "1px solid #818cf840",
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#818cf8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Free
        </span>
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }} className="banner-desc">
          Você está no plano gratuito.{" "}
          <span style={{ color: "#818cf8", fontWeight: 600 }}>
            Faça upgrade para desbloquear todos os módulos e recursos.
          </span>
        </span>
      </div>

      {/* CTA */}
      <button onClick={onUpgrade} style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 14px",
        borderRadius: 6,
        background: "linear-gradient(135deg, #818cf8, #6366f1)",
        border: "none",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px #6366f140",
        transition: "opacity 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        Ver planos →
      </button>
    </div>
  );
}

const Icon = {
  home:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  calc:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
  news:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>,
  award:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  menu:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  sun:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  logout:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  user:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  search:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  doc:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  book:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  reform:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

const NAV_GRUPOS = [
  {
    titulo: "Principal",
    itens: [
      { id: "home",        label: "Home",                tipo: "aba",    icon: "home" },
      { id: "calculadora", label: "Simulador Tributário", tipo: "pagina", href: "/calculadora", icon: "calc" },
    ],
  },
  {
    titulo: "Hub",
    itens: [
      { id: "noticias",   label: "Notícias",           tipo: "pagina", href: "/noticias",   icon: "news" },
      { id: "fiscal",     label: "Calendário Fiscal",   tipo: "pagina", href: "/fiscal",     icon: "calendar" },
      { id: "honorarios", label: "Honorários",          tipo: "pagina", href: "/honorarios", icon: "calc" },
      { id: "cnpj",       label: "Consulta CNPJ",       tipo: "pagina", href: "/cnpj",       icon: "search" },
      { id: "documentos", label: "Documentos",          tipo: "pagina", href: "/documentos", icon: "doc" },
      { id: "icmsst",     label: "ICMS-ST",             tipo: "pagina", href: "/icmsst",      icon: "calc" },
      { id: "reforma",    label: "Reforma Tributária",  tipo: "pagina", href: "/reforma",     icon: "reform", destaque: true },
      { id: "simulado",   label: "Simulado CFC",        tipo: "pagina", href: "/simulado",    icon: "award" },
    ],
  },
];

const BOTTOM_NAV = [
  { id: "home",        label: "Home",      icon: "home",  tipo: "aba",    href: "/calculadora" },
  { id: "calculadora", label: "Simulador", icon: "calc",  tipo: "pagina", href: "/calculadora" },
  { id: "noticias",    label: "Notícias",  icon: "news",  tipo: "pagina", href: "/noticias" },
  { id: "simulado",    label: "Simulado",  icon: "award", tipo: "pagina", href: "/simulado" },
  { id: "_menu",       label: "Menu",      icon: "menu",  tipo: "drawer" },
];

export default function Layout({ children, user, abaAtiva, setAba }) {
  const router = useRouter();
  const { assinatura, isTrial, diasTrial } = useAssinatura();
  const [tema, setTema] = useState("dark");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("gj-tema") || "dark";
    setTema(salvo);
    document.documentElement.setAttribute("data-theme", salvo);
  }, []);

  // Fecha drawer ao navegar
  useEffect(() => { setDrawerOpen(false); }, [router.pathname]);

  const toggleTema = () => {
    const novo = tema === "dark" ? "light" : "dark";
    setTema(novo);
    localStorage.setItem("gj-tema", novo);
    document.documentElement.setAttribute("data-theme", novo);
  };

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const iniciais = user?.email?.slice(0, 2).toUpperCase() || "GJ";
  const planoAtual = assinatura ? PLANOS[assinatura.plano] : null;

  const isAtivo = (item) => {
    if (item.tipo === "pagina") {
      if (item.id === "calculadora") return router.pathname === item.href && abaAtiva !== "home";
      return router.pathname === item.href;
    }
    return abaAtiva === item.id;
  };

  const handleClick = (item) => {
    if (item.tipo === "drawer") { setDrawerOpen(true); return; }
    if (item.tipo === "pagina") {
      router.push(item.href);
      // Simulador Tributário vive em /calculadora como aba — troca a aba também
      if (item.id === "calculadora" && setAba) setAba("calculadora");
    } else if (setAba) {
      setAba(item.id);
    } else {
      router.push("/calculadora");
    }
  };

  const isBottomAtivo = (item) => {
    if (item.tipo === "drawer") return false;
    if (item.id === "home") return router.pathname === "/calculadora" && abaAtiva === "home";
    if (item.id === "calculadora") return router.pathname === "/calculadora" && abaAtiva !== "home";
    return router.pathname === item.href;
  };

  return (
    <div className="app-layout">

      {/* ── Top bar mobile ── */}
      <div className="mobile-topbar">
        {/* Esquerda: logo + nome + badge plano */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="GJ" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--logo-text)", lineHeight: 1.2 }}>GJ Hub Contábil</div>
            {planoAtual && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: isTrial && diasTrial <= 2 ? "#ef4444" : planoAtual.cor,
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, lineHeight: 1,
                  color: isTrial && diasTrial <= 2 ? "#ef4444" : isTrial ? "var(--primary)" : planoAtual.cor,
                }}>
                  {isTrial
                    ? diasTrial <= 2
                      ? `Trial expira em ${diasTrial}d`
                      : `Trial · ${diasTrial} dias`
                    : `Plano ${planoAtual.nome}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Direita: tema + menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={toggleTema} style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--bg-hover)", border: "1px solid var(--border)",
            color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}>
            {tema === "dark" ? Icon.sun : Icon.moon}
          </button>
          <button onClick={() => setDrawerOpen(true)} style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--bg-hover)", border: "1px solid var(--border)",
            color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}>
            {Icon.menu}
          </button>
        </div>
      </div>

      {/* ── Bottom nav mobile ── */}
      <div className="mobile-botnav">
        {BOTTOM_NAV.map((item) => {
          const ativo = isBottomAtivo(item);
          const isMenu = item.tipo === "drawer";
          return (
            <button
              key={item.id}
              className="mobile-botnav-item"
              onClick={() => handleClick(item)}
              style={{ position: "relative" }}
            >
              {/* Pill de fundo no ativo */}
              <div style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: ativo
                  ? "var(--primary-glow)"
                  : isMenu
                    ? "var(--bg-hover)"
                    : "transparent",
                border: ativo ? "1px solid var(--primary)50" : "1px solid transparent",
                color: ativo ? "var(--primary)" : isMenu ? "var(--text-dim)" : "var(--muted)",
                transition: "background 0.2s, color 0.2s",
              }}>
                {Icon[item.icon]}
              </div>
              {/* Label */}
              <span style={{
                fontSize: 10,
                fontWeight: ativo ? 700 : 500,
                color: ativo ? "var(--primary)" : "var(--muted)",
                marginTop: 1,
                transition: "color 0.2s",
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Drawer lateral (mobile e desktop) ── */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-panel">

            {/* Header: avatar + email + fechar */}
            <div style={{
              padding: "18px 16px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <button onClick={() => { router.push("/perfil"); setDrawerOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg,#808CFF,#4a55e8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0,
                }}>{iniciais}</div>
                <div style={{ overflow: "hidden", textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 175 }}>
                    {user?.email?.split("@")[0]}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 175 }}>
                    Ver meu perfil →
                  </div>
                </div>
              </button>
              <button onClick={() => setDrawerOpen(false)} style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--bg-hover)", border: "1px solid var(--border)",
                color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0, flexShrink: 0,
              }}>
                {Icon.close}
              </button>
            </div>

            {/* Plano / Trial */}
            <div style={{ padding: "12px 14px 4px" }}>
              {planoAtual && (
                <button onClick={() => { router.push("/assinatura"); setDrawerOpen(false); }} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 12,
                  background: `${planoAtual.cor}15`, border: `1px solid ${planoAtual.cor}40`,
                  cursor: "pointer", textAlign: "left", marginBottom: 8,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: planoAtual.cor, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: planoAtual.cor }}>Plano {planoAtual.nome}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Ver minha assinatura</div>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: 18 }}>›</span>
                </button>
              )}
              {isTrial && diasTrial > 0 && (
                <button onClick={() => { router.push("/assinatura"); setDrawerOpen(false); }} style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, marginBottom: 8,
                  background: diasTrial <= 2 ? "#ef444418" : "#DF9F2018",
                  border: `1px solid ${diasTrial <= 2 ? "#ef444440" : "#DF9F2040"}`,
                  cursor: "pointer", textAlign: "left",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: diasTrial <= 2 ? "#ef4444" : "var(--primary)" }}>
                    {diasTrial <= 2 ? `⚠ Teste expira em ${diasTrial} dia${diasTrial > 1 ? "s" : ""}` : `⏱ ${diasTrial} dias de teste restantes`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Toque para assinar e manter acesso</div>
                </button>
              )}
            </div>

            {/* Nav completa */}
            <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }}>
              {NAV_GRUPOS.map((grupo) => (
                <div key={grupo.titulo} style={{ marginBottom: 6 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: "var(--muted)",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    padding: "10px 8px 4px",
                  }}>
                    {grupo.titulo}
                  </div>
                  {grupo.itens.map((item) => {
                    const ativo = isAtivo(item);
                    return (
                      <button key={item.id} onClick={() => { handleClick(item); setDrawerOpen(false); }} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "13px 12px", borderRadius: 12, width: "100%", textAlign: "left",
                        background: ativo ? "var(--primary-glow)" : "transparent",
                        border: `1px solid ${ativo ? "var(--primary)50" : "transparent"}`,
                        color: ativo ? "var(--primary)" : "var(--text-dim)",
                        fontWeight: ativo ? 700 : 500, fontSize: 14, cursor: "pointer",
                        marginBottom: 2,
                      }}>
                        <span style={{
                          display: "flex", alignItems: "center",
                          color: ativo ? "var(--primary)" : "var(--muted)",
                        }}>
                          {Icon[item.icon] || null}
                        </span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.destaque && !ativo && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, background: "#DF9F20", color: "#000",
                            padding: "1px 6px", borderRadius: 10,
                          }}>NOVO</span>
                        )}
                        {ativo && (
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "var(--primary)", flexShrink: 0,
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Footer: perfil + tema + sair */}
            <div style={{
              padding: "12px 14px",
              paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
              borderTop: "1px solid var(--border)",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <button onClick={() => { router.push("/perfil"); setDrawerOpen(false); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 12,
                background: router.pathname === "/perfil" ? "var(--primary-glow)" : "var(--bg-hover)",
                border: `1px solid ${router.pathname === "/perfil" ? "var(--primary)50" : "var(--border)"}`,
                color: router.pathname === "/perfil" ? "var(--primary)" : "var(--text-dim)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg,#808CFF,#4a55e8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0,
                }}>{iniciais}</div>
                <div style={{ textAlign: "left", flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.email?.split("@")[0]}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Meu Perfil</div>
                </div>
                {Icon.user}
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={toggleTema} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "11px", borderRadius: 12,
                  background: "var(--bg-hover)", border: "1px solid var(--border)",
                  color: "var(--muted)", fontSize: 13, fontWeight: 600,
                }}>
                  {tema === "dark" ? Icon.sun : Icon.moon}
                  <span>{tema === "dark" ? "Claro" : "Escuro"}</span>
                </button>
                <button onClick={handleSair} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "11px", borderRadius: 12,
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--muted)", fontSize: 13, fontWeight: 600,
                }}>
                  {Icon.logout}
                  <span>Sair</span>
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Sidebar desktop ── */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ padding: "22px 18px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="GJ Hub Contábil" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--logo-text)", lineHeight: 1.2 }}>GJ Hub Contábil</div>
              <div style={{ fontSize: 10, color: "var(--violet)", fontWeight: 600, letterSpacing: "0.05em" }}>Hub do Contador</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
          {NAV_GRUPOS.map((grupo) => (
            <div key={grupo.titulo} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 10px 4px" }}>
                {grupo.titulo}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {grupo.itens.map((item) => {
                  const ativo = isAtivo(item);
                  return (
                    <button key={item.id} className="nav-item" onClick={() => handleClick(item)} style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "9px 10px", borderRadius: 9, width: "100%", textAlign: "left",
                      background: ativo ? "var(--primary-glow)" : "transparent",
                      border: `1px solid ${ativo ? "var(--primary)" : "transparent"}`,
                      color: ativo ? "var(--primary)" : "var(--muted)",
                      fontWeight: ativo ? 700 : 500, fontSize: 13,
                      transition: "all 0.15s", cursor: "pointer",
                    }}
                      onMouseEnter={e => { if (!ativo) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text)"; }}}
                      onMouseLeave={e => { if (!ativo) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}}
                    >
                      <span style={{ opacity: 0.75, display: "flex", alignItems: "center" }}>{Icon[item.icon] || null}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.destaque && !ativo && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, background: "#DF9F20", color: "#000",
                          padding: "1px 6px", borderRadius: 10, letterSpacing: "0.04em",
                        }}>NOVO</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ padding: "10px", borderTop: "1px solid var(--border)" }}>
          {isTrial && diasTrial > 0 && (
            <button onClick={() => router.push("/assinatura")} style={{
              width: "100%", marginBottom: 4, padding: "9px 12px", borderRadius: 8,
              background: diasTrial <= 2 ? "#ef444418" : "#DF9F2018",
              border: `1px solid ${diasTrial <= 2 ? "#ef444460" : "#DF9F2060"}`,
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: diasTrial <= 2 ? "#ef4444" : "var(--primary)" }}>
                {diasTrial <= 2 ? `Expira em ${diasTrial} dia${diasTrial > 1 ? "s" : ""}` : `${diasTrial} dias restantes`}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Clique para assinar</div>
            </button>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
            <button onClick={toggleTema} style={{
              width: 32, height: 32, minWidth: 32, borderRadius: "50%", padding: 0,
              background: "transparent", border: "1.5px solid var(--primary)", color: "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              {tema === "dark" ? Icon.sun : Icon.moon}
            </button>
          </div>

          {planoAtual ? (
            <button onClick={() => router.push("/assinatura")} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 8, marginBottom: 4,
              background: `${planoAtual.cor}15`, border: `1px solid ${planoAtual.cor}40`, cursor: "pointer",
            }}>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: planoAtual.cor }}>Plano {planoAtual.nome}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>Minha Assinatura</div>
              </div>
            </button>
          ) : (
            <button onClick={() => router.push("/assinatura")} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8, marginBottom: 4,
              background: "#ef444415", border: "1px solid #ef444440", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}>Sem plano ativo</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>Clique para assinar</div>
            </button>
          )}

          <button onClick={() => router.push("/perfil")} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 8, marginBottom: 4,
            background: router.pathname === "/perfil" ? "var(--primary-glow)" : "transparent",
            border: `1px solid ${router.pathname === "/perfil" ? "var(--primary)50" : "transparent"}`,
            cursor: "pointer", textAlign: "left",
          }}
            onMouseEnter={e => { if (router.pathname !== "/perfil") { e.currentTarget.style.background = "var(--bg-hover)"; }}}
            onMouseLeave={e => { if (router.pathname !== "/perfil") { e.currentTarget.style.background = "transparent"; }}}
          >
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg,#808CFF,#4a55e8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>{iniciais}</div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: router.pathname === "/perfil" ? "var(--primary)" : "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email?.split("@")[0]}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Meu Perfil</div>
            </div>
            <span style={{ color: "var(--muted)", fontSize: 12, opacity: 0.6 }}>{Icon.user}</span>
          </button>

          <button onClick={handleSair} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 8, background: "transparent",
            border: "1px solid transparent", color: "var(--muted)", fontSize: 13, fontWeight: 500,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "transparent"; }}
          >
            {Icon.logout}
            <span>Sair</span>
          </button>

        </div>
      </aside>

      <main className="main-content">

        {/* ── Upgrade / Trial Banner ── */}
        {assinatura && (assinatura.plano === "free" || isTrial) && (
          <UpgradeBanner
            isTrial={isTrial}
            diasTrial={diasTrial}
            plano={assinatura.plano}
            onUpgrade={() => router.push("/assinatura")}
          />
        )}

        {children}
      </main>
    </div>
  );
}
