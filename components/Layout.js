import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import { PLANOS } from "../lib/planos";

const NAV_GRUPOS = [
  {
    titulo: "Principal",
    itens: [
      { id: "home",        label: "Home",                tipo: "aba" },
      { id: "calculadora", label: "Simulador Tributário", tipo: "aba" },
    ],
  },
  {
    titulo: "Hub",
    itens: [
      { id: "noticias",   label: "Notícias",           tipo: "pagina", href: "/noticias"   },
      { id: "fiscal",     label: "Calendário Fiscal",   tipo: "pagina", href: "/fiscal"     },
      { id: "honorarios", label: "Honorários",          tipo: "pagina", href: "/honorarios" },
      { id: "cnpj",       label: "Consulta CNPJ",       tipo: "pagina", href: "/cnpj"       },
      { id: "documentos", label: "Documentos",          tipo: "pagina", href: "/documentos" },
      { id: "icmsst",     label: "ICMS-ST",             tipo: "pagina", href: "/icmsst"     },
      { id: "simulado",   label: "Simulado CFC",        tipo: "pagina", href: "/simulado"   },
    ],
  },
];

export default function Layout({ children, user, abaAtiva, setAba }) {
  const router = useRouter();
  const { assinatura } = useAssinatura();
  const [tema, setTema] = useState("dark");

  useEffect(() => {
    const salvo = localStorage.getItem("gj-tema") || "dark";
    setTema(salvo);
    document.documentElement.setAttribute("data-theme", salvo);
  }, []);

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
    if (item.tipo === "pagina") return router.pathname === item.href;
    return abaAtiva === item.id;
  };

  const handleClick = (item) => {
    if (item.tipo === "pagina") {
      router.push(item.href);
    } else if (setAba) {
      setAba(item.id);
    } else {
      router.push("/calculadora");
    }
  };

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo" style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="GJ Contábil Pro" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--logo-text)", lineHeight: 1.2 }}>GJ Contábil Pro</div>
              <div style={{ fontSize: 10, color: "var(--violet)", fontWeight: 600, letterSpacing: "0.05em" }}>Hub do Contador</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
          {NAV_GRUPOS.map((grupo) => (
            <div key={grupo.titulo} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 12px 4px" }}>
                {grupo.titulo}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {grupo.itens.map((item) => {
                  const ativo = isAtivo(item);
                  return (
                    <button
                      key={item.id}
                      className="nav-item"
                      onClick={() => handleClick(item)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 10, width: "100%", textAlign: "left",
                        background: ativo ? "var(--primary-glow)" : "transparent",
                        border: ativo ? "1px solid var(--primary)" : "1px solid transparent",
                        color: ativo ? "var(--primary)" : "var(--muted)",
                        fontWeight: ativo ? 700 : 500, fontSize: 14,
                        transition: "all 0.15s", cursor: "pointer",
                      }}
                      onMouseEnter={e => { if (!ativo) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text)"; }}}
                      onMouseLeave={e => { if (!ativo) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}}
                    >
                      <span style={{ flex: 1 }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer" style={{
          padding: "12px",
          borderTop: "1px solid var(--border)",
        }}>
          {/* Toggle de tema */}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 4, marginBottom: 4 }}>
            <button
              onClick={toggleTema}
              title={tema === "dark" ? "Tema claro" : "Tema escuro"}
              style={{
                width: 36, height: 36, minWidth: 36, minHeight: 36,
                borderRadius: "50%", padding: 0,
                background: "transparent",
                border: "1.5px solid var(--primary)",
                color: "var(--primary)",
                fontSize: 16, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--primary-glow)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              {tema === "dark" ? "☀" : "☾"}
            </button>
          </div>

          {/* Badge do plano */}
          {planoAtual ? (
            <button
              onClick={() => router.push("/assinatura")}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 8, marginBottom: 4,
                background: `${planoAtual.cor}15`,
                border: `1px solid ${planoAtual.cor}40`,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${planoAtual.cor}25`}
              onMouseLeave={e => e.currentTarget.style.background = `${planoAtual.cor}15`}
            >
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: planoAtual.cor }}>
                  Plano {planoAtual.nome}
                </div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>Minha Assinatura</div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => router.push("/assinatura")}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 8, marginBottom: 4,
                background: "#ef444415", border: "1px solid #ef444440",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444" }}>Sem plano ativo</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>Clique para assinar</div>
              </div>
            </button>
          )}

          {/* User */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", marginBottom: 4,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg,#808CFF,#4a55e8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>{iniciais}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email?.split("@")[0]}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>{user?.email}</div>
            </div>
          </div>

          <button
            onClick={handleSair}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8, background: "transparent",
              border: "1px solid transparent", color: "var(--muted)",
              fontSize: 13, fontWeight: 500,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "transparent"; }}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* ── Conteúdo ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
