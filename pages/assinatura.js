import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import { PLANOS } from "../lib/planos";
import Layout from "../components/Layout";

// Links de checkout da Kiwify — preencher quando disponíveis
const CHECKOUT_LINKS = {
  essencial:    "#",
  profissional: "#",
  especialista: "#",
};

function diasRestantes(dataExpiracao) {
  if (!dataExpiracao) return 0;
  const diff = new Date(dataExpiracao) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function AssinaturaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { assinatura, carregando } = useAssinatura();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
  }, [router]);

  if (!user || carregando) return null;

  const planoAtual = assinatura ? PLANOS[assinatura.plano] : null;
  const dias = diasRestantes(assinatura?.data_expiracao);
  const urgente = dias <= 30 && dias > 0;
  const expirado = !assinatura || assinatura.status !== "ativo";

  return (
    <>
      <Head>
        <title>Minha Assinatura — GJ Contábil Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 720, margin: "0 auto" }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Minha Assinatura</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Gerencie seu plano e acesso às ferramentas
            </p>
          </div>

          {/* Status atual */}
          {expirado ? (
            <div className="card" style={{ borderLeft: "4px solid var(--red)", marginBottom: 24, padding: "20px 24px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--red)", marginBottom: 6 }}>
                Sem assinatura ativa
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Você não possui um plano ativo. Assine agora para acessar as ferramentas do GJ Contábil Pro.
              </div>
            </div>
          ) : (
            <div className="card" style={{
              borderLeft: `4px solid ${planoAtual.cor}`,
              marginBottom: 24, padding: "20px 24px",
              background: planoAtual.corFundo,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    Plano ativo
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: planoAtual.cor }}>
                    {planoAtual.nome}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                    {planoAtual.descricao}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    display: "inline-block",
                    background: urgente ? "#ef444420" : "#22c55e20",
                    color: urgente ? "#ef4444" : "#22c55e",
                    padding: "4px 12px", borderRadius: 20,
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {urgente ? `Expira em ${dias} dias` : `Ativo — ${dias} dias restantes`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                    Vence em {new Date(assinatura.data_expiracao).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ferramentas incluídas */}
          {planoAtual && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Ferramentas incluídas no seu plano</div>
              {[
                { id: "simulador",  label: "Simulador Tributário" },
                { id: "fiscal",     label: "Calendário Fiscal" },
                { id: "cnpj",       label: "Consulta CNPJ" },
                { id: "documentos", label: "Gerador de Documentos" },
                { id: "noticias",   label: "Portal de Notícias" },
                { id: "honorarios", label: "Calculadora de Honorários" },
                { id: "icmsst",     label: "Calculadora ICMS-ST" },
                { id: "simulado",   label: "Simulado CFC" },
              ].map((f) => {
                const incluso = planoAtual.ferramentas.includes(f.id);
                return (
                  <div key={f.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 0", borderBottom: "1px solid var(--border)",
                    opacity: incluso ? 1 : 0.4,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: incluso ? "var(--green)" : "var(--border)", flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 500, flex: 1, color: "var(--text)" }}>{f.label}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                      background: incluso ? "#22c55e20" : "var(--bg-input)",
                      color: incluso ? "#22c55e" : "var(--muted)",
                    }}>
                      {incluso ? "Incluído" : "Bloqueado"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Planos disponíveis */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            {expirado ? "Escolha seu plano" : "Fazer upgrade"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(PLANOS).map(([key, p]) => {
              const atual = assinatura?.plano === key;
              return (
                <div key={key} className="card" style={{
                  borderLeft: `4px solid ${p.cor}`,
                  border: atual ? `2px solid ${p.cor}` : "1px solid var(--border)",
                  borderLeft: `4px solid ${p.cor}`,
                  padding: "18px 22px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexWrap: "wrap", gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: p.cor, marginBottom: 4 }}>
                      {p.nome}
                      {atual && (
                        <span style={{ marginLeft: 8, fontSize: 10, background: `${p.cor}20`, color: p.cor, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                          PLANO ATUAL
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{p.descricao}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                      {p.ferramentas.length} ferramenta{p.ferramentas.length > 1 ? "s" : ""} incluída{p.ferramentas.length > 1 ? "s" : ""}
                    </div>
                  </div>
                  {!atual && (
                    <a
                      href={CHECKOUT_LINKS[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        background: `linear-gradient(135deg, ${p.cor}, ${p.cor}bb)`,
                        color: "#fff", fontWeight: 700, fontSize: 13,
                        padding: "10px 22px", borderRadius: 8,
                        textDecoration: "none", whiteSpace: "nowrap",
                      }}
                    >
                      {expirado ? "Assinar" : "Fazer upgrade"} →
                    </a>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </Layout>
    </>
  );
}
