import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import CardBloqueado from "../components/CardBloqueado";

// ── Configurações de categoria ────────────────────────────────────────────────

const CATEGORIAS = [
  { id: "Todas",              cor: "#808CFF", bg: "#808CFF18" },
  { id: "Tributário",         cor: "#3b82f6", bg: "#3b82f618" },
  { id: "Fiscal",             cor: "#DF9F20", bg: "#DF9F2018" },
  { id: "Contabilidade",      cor: "#22c55e", bg: "#22c55e18" },
  { id: "Reforma Tributária", cor: "#8b5cf6", bg: "#8b5cf618" },
  { id: "Simples Nacional",   cor: "#f97316", bg: "#f9731618" },
];

const FONTES = ["Todas", "Portal Contábeis", "Jornal Contábil", "CFC", "Fenacon", "Tributário.net", "Contador Perito", "Migalhas Tributário", "Contabilizei", "SPED/Fazenda"];

function getCategoriaStyle(cat) {
  return CATEGORIAS.find((c) => c.id === cat) || CATEGORIAS[0];
}

function formatarData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const agora = new Date();
  const diff = (agora - d) / 1000;
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatarHora(ts) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ── Skeleton de carregamento ──────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 12,
    }}>
      {[80, 100, 60].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 18 : 13, width: `${w}%`,
          background: "#E0E3FF10", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
}

// ── Card de notícia ───────────────────────────────────────────────────────────

function CardNoticia({ item }) {
  const estilo = getCategoriaStyle(item.categoria);
  const [hover, setHover] = useState(false);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", flexDirection: "column",
        background: hover ? "#E0E3FF08" : "var(--bg-card)",
        border: `1px solid ${hover ? estilo.cor + "55" : "var(--border)"}`,
        borderLeft: `4px solid ${estilo.cor}`,
        borderRadius: 14, padding: "18px 20px",
        textDecoration: "none", transition: "all 0.18s",
        cursor: "pointer", gap: 10,
      }}
    >
      {/* Topo: fonte + data */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: estilo.cor,
          background: estilo.bg, borderRadius: 6, padding: "3px 8px",
          letterSpacing: "0.03em", whiteSpace: "nowrap",
        }}>
          {item.categoria}
        </span>
        <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
          {item.source} · {formatarData(item.pubDate)}
        </span>
      </div>

      {/* Título */}
      <h3 style={{
        fontSize: 15, fontWeight: 700, color: hover ? "#fff" : "var(--text)",
        lineHeight: 1.45, margin: 0, transition: "color 0.15s",
        display: "-webkit-box", WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {item.title}
      </h3>

      {/* Resumo */}
      {item.summary && (
        <p style={{
          fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: 0,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {item.summary}
        </p>
      )}

      {/* Rodapé */}
      <div style={{
        fontSize: 12, fontWeight: 600, color: estilo.cor,
        marginTop: 4, display: "flex", alignItems: "center", gap: 4,
      }}>
        Ler notícia completa →
      </div>
    </a>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function NoticiasPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
  const [fonteAtiva, setFonteAtiva] = useState("Todas");
  const [atualizando, setAtualizando] = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setUser(session.user);
    });
  }, [router]);

  // Busca notícias
  const fetchNoticias = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    else setAtualizando(true);
    setErro(null);
    try {
      const res = await fetch("/api/noticias");
      if (!res.ok) throw new Error("Falha ao carregar notícias");
      const data = await res.json();
      setItems(data.items || []);
      setUpdatedAt(data.updatedAt);
    } catch (e) {
      setErro("Não foi possível carregar as notícias. Tente novamente.");
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNoticias();
      const interval = setInterval(() => fetchNoticias(true), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNoticias]);

  // Filtros
  const itensFiltrados = items.filter((item) => {
    const matchCategoria = categoriaAtiva === "Todas" || item.categoria === categoriaAtiva;
    const matchFonte = fonteAtiva === "Todas" || item.source === fonteAtiva;
    const matchBusca = !busca || (
      item.title?.toLowerCase().includes(busca.toLowerCase()) ||
      item.summary?.toLowerCase().includes(busca.toLowerCase())
    );
    return matchCategoria && matchFonte && matchBusca;
  });

  const totalPorCategoria = (cat) =>
    cat === "Todas" ? items.length : items.filter((i) => i.categoria === cat).length;

  if (!user || carregandoPlano) return null;
  if (!pode("noticias")) return (
    <Layout user={user}>
      <CardBloqueado ferramenta="noticias" planoNecessario="profissional" />
    </Layout>
  );

  return (
    <>
      <Head>
        <title>Notícias Contábeis — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>

          {/* ── Cabeçalho ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>
                  Notícias Contábeis
                </h1>
                <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
                  Atualizações em tempo real sobre contabilidade, tributos e reforma tributária
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {updatedAt && (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    Atualizado às {formatarHora(updatedAt)}
                  </span>
                )}
                <button
                  onClick={() => fetchNoticias(true)}
                  disabled={atualizando}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: atualizando ? "var(--bg-card)" : "var(--primary-glow)",
                    border: "1px solid var(--primary)", color: "var(--primary)",
                    cursor: atualizando ? "not-allowed" : "pointer", transition: "all 0.15s",
                  }}
                >
                  <span style={{ display: "inline-block", animation: atualizando ? "spin 1s linear infinite" : "none" }}>↻</span>
                  {atualizando ? "Atualizando..." : "Atualizar"}
                </button>
              </div>
            </div>

            {/* Barra de busca */}
            <div style={{ position: "relative", marginTop: 20, maxWidth: 480 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--muted)" }}>🔍</span>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar notícias..."
                style={{
                  width: "100%", padding: "11px 16px 11px 42px",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 12, fontSize: 14, color: "var(--text)",
                  outline: "none", boxSizing: "border-box",
                }}
              />
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ── Filtros por categoria ── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {CATEGORIAS.map((cat) => {
              const ativo = categoriaAtiva === cat.id;
              const total = totalPorCategoria(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  style={{
                    padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: ativo ? 700 : 500,
                    background: ativo ? cat.bg : "transparent",
                    border: `1px solid ${ativo ? cat.cor : "var(--border)"}`,
                    color: ativo ? cat.cor : "var(--muted)",
                    cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {cat.id}
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: ativo ? cat.cor + "33" : "#E0E3FF15",
                    borderRadius: 10, padding: "1px 6px",
                    color: ativo ? cat.cor : "var(--muted)",
                  }}>
                    {total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Filtro por fonte ── */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", marginRight: 4 }}>Fonte:</span>
            {FONTES.map((fonte) => {
              const ativo = fonteAtiva === fonte;
              return (
                <button
                  key={fonte}
                  onClick={() => setFonteAtiva(fonte)}
                  style={{
                    padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: ativo ? 700 : 500,
                    background: ativo ? "#DF9F2020" : "transparent",
                    border: `1px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                    color: ativo ? "var(--primary)" : "var(--muted)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {fonte}
                </button>
              );
            })}
          </div>

          {/* ── Conteúdo ── */}
          {erro ? (
            <div style={{
              background: "#ef444418", border: "1px solid #ef444444",
              borderRadius: 14, padding: 32, textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: "#fca5a5", fontWeight: 600, marginBottom: 16 }}>{erro}</p>
              <button
                onClick={() => fetchNoticias()}
                style={{
                  padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: "#ef444422", border: "1px solid #ef4444", color: "#fca5a5", cursor: "pointer",
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 14, padding: 48, textAlign: "center",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ color: "var(--muted)", fontSize: 15 }}>
                Nenhuma notícia encontrada para os filtros selecionados.
              </p>
              <button
                onClick={() => { setBusca(""); setCategoriaAtiva("Todas"); setFonteAtiva("Todas"); }}
                style={{
                  marginTop: 16, padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: "var(--primary-glow)", border: "1px solid var(--primary)",
                  color: "var(--primary)", cursor: "pointer",
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                {itensFiltrados.length} {itensFiltrados.length === 1 ? "notícia encontrada" : "notícias encontradas"}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {itensFiltrados.map((item) => (
                  <CardNoticia key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </Layout>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
