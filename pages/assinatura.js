import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import { PLANOS } from "../lib/planos";
import Layout from "../components/Layout";

const CHECKOUT_LINKS = {
  essencial:    { anual: "https://pay.kiwify.com.br/NAhXR65", mensal: "https://pay.kiwify.com.br/mE2zB5V" },
  profissional: { anual: "https://pay.kiwify.com.br/6Rppp7j", mensal: "https://pay.kiwify.com.br/RBCmS4k" },
  especialista: { anual: "https://pay.kiwify.com.br/xXQpNPy", mensal: "https://pay.kiwify.com.br/GRNueqT" },
};

const PLANOS_INFO = {
  essencial: {
    badge: null,
    destaque: false,
    precoAnual: 397,
    precoMesAnual: "33,08",
    precoMensal: "47",
    economiaPorc: "30%",
    cta: "Começar no Essencial →",
    cor: "#22c55e",
    sombra: "#22c55e25",
  },
  profissional: {
    badge: "Mais vendido",
    destaque: true,
    precoAnual: 797,
    precoMesAnual: "66,42",
    precoMensal: "97",
    economiaPorc: "32%",
    cta: "Escolher Profissional →",
    cor: "#818cf8",
    sombra: "#818cf830",
  },
  especialista: {
    badge: "ACESSO TOTAL",
    destaque: false,
    precoAnual: 1397,
    precoMesAnual: "116,42",
    precoMensal: "167",
    economiaPorc: "30%",
    cta: "Quero o Especialista →",
    cor: "#DF9F20",
    sombra: "#DF9F2025",
  },
};

/* ── Lista completa de recursos (todos os planos) ── */
const RECURSOS = [
  { id: "noticias",   icon: "📰", label: "Portal de Notícias",            sub: "Atualizações fiscais diárias" },
  { id: "simulador",  icon: "🧮", label: "Simulador Tributário",           sub: "Lucro Real, Presumido e Simples" },
  { id: "fiscal",     icon: "📅", label: "Calendário Fiscal",              sub: "Obrigações e prazos" },
  { id: "cnpj",       icon: "🔍", label: "Consulta CNPJ",                  sub: "Dados completos da Receita" },
  { id: "documentos", icon: "📄", label: "Gerador de Documentos",          sub: "Contratos e modelos prontos" },
  { id: "honorarios", icon: "💰", label: "Calculadora de Honorários",      sub: "Precificação inteligente" },
  { id: "rescisao",   icon: "⚖️", label: "Calculadora de Rescisão",        sub: "Verbas, FGTS, INSS/IRRF 2026", novo: true },
  { id: "icmsst",     icon: "📊", label: "Calculadora ICMS-ST",            sub: "Substituição tributária" },
  { id: "reforma",    icon: "📈", label: "Simulador Reforma Tributária",    sub: "Impacto LC 214/2025 · IBS + CBS" },
  { id: "simulado",   icon: "🎓", label: "Simulado CFC",                   sub: "140 questões 2018–2025" },
];

function diasRestantes(dataExpiracao) {
  if (!dataExpiracao) return 0;
  const diff = new Date(dataExpiracao) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/* ── Ícone de check / lock ── */
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

/* ── Card de plano ── */
function PricingCard({ planKey, planoAtual, isTrial, diasTrial }) {
  const info    = PLANOS_INFO[planKey];
  const plano   = PLANOS[planKey];
  const isAtual  = planoAtual === planKey || (isTrial && planoAtual === "especialista" && planKey === "especialista");
  const links    = CHECKOUT_LINKS[planKey] || null;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: info.destaque
        ? `2px solid ${info.cor}`
        : isAtual
          ? `2px solid ${info.cor}80`
          : "1px solid var(--border)",
      borderRadius: 18,
      padding: "28px 22px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 0,
      position: "relative",
      boxShadow: info.destaque ? `0 8px 40px ${info.sombra}` : isAtual ? `0 4px 20px ${info.sombra}` : "none",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}>

      {/* Badge superior */}
      {info.badge && (
        <div style={{
          position: "absolute",
          top: -13,
          left: "50%",
          transform: "translateX(-50%)",
          background: info.destaque ? info.cor : "var(--bg-card)",
          border: `2px solid ${info.cor}`,
          color: info.destaque ? "#fff" : info.cor,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          padding: "4px 14px",
          borderRadius: 20,
          whiteSpace: "nowrap",
        }}>
          {info.badge}
        </div>
      )}

      {/* Badge plano atual */}
      {isAtual && (
        <div style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: `${info.cor}20`,
          border: `1px solid ${info.cor}60`,
          color: info.cor,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "3px 9px",
          borderRadius: 20,
        }}>
          {isTrial ? "Em teste" : "Plano atual"}
        </div>
      )}

      {/* Nome + descrição */}
      <div style={{ marginBottom: 20, paddingTop: info.badge ? 10 : 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
          {plano.nome}
        </div>
        <div style={{ fontSize: 13, color: info.cor, fontWeight: 600 }}>
          {plano.descricao}
        </div>
      </div>

      {/* Preço */}
      <div style={{
        padding: "16px 0",
        borderTop: "1px dashed var(--border-soft)",
        borderBottom: "1px dashed var(--border-soft)",
        marginBottom: 20,
      }}>
        {/* Anual — destaque principal */}
        <div style={{
          background: `${info.cor}12`,
          border: `1px solid ${info.cor}30`,
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: info.cor, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            ★ Plano Anual — melhor valor
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>R$</span>
            <span style={{ fontSize: 40, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>
              {info.precoAnual.toLocaleString("pt-BR")}
            </span>
            <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 3 }}>/ano</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            equivale a R$ {info.precoMesAnual}/mês ·{" "}
            <span style={{ color: "#22c55e", fontWeight: 700 }}>economia de {info.economiaPorc}</span>
          </div>
        </div>

        {/* Mensal — secundário */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>ou no mensal</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
          R$ <strong style={{ fontSize: 18, color: "var(--text)" }}>{info.precoMensal}</strong>/mês
        </div>
      </div>

      {/* Lista de recursos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {RECURSOS.map((r) => {
          const incluso = plano.ferramentas.includes(r.id);
          return (
            <div key={r.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: incluso ? 1 : 0.38,
            }}>
              {/* Ícone check/lock */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: incluso ? `${info.cor}20` : "var(--bg-hover)",
                border: `1.5px solid ${incluso ? info.cor : "var(--border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: incluso ? info.cor : "var(--muted)",
              }}>
                {incluso ? <IconCheck /> : <IconLock />}
              </div>

              {/* Texto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: incluso ? 600 : 400,
                  color: incluso ? "var(--text)" : "var(--muted)",
                  lineHeight: 1.3,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}>
                  {r.label}
                  {r.novo && incluso && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
                      color: "#000",
                      padding: "1px 6px",
                      borderRadius: 10,
                      letterSpacing: "0.06em",
                      flexShrink: 0,
                    }}>NOVO</span>
                  )}
                </div>
                {incluso && (
                  <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.2 }}>
                    {r.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ marginTop: "auto" }}>
        {isAtual && !isTrial ? (
          <div style={{
            textAlign: "center",
            padding: "12px",
            borderRadius: 10,
            background: `${info.cor}12`,
            border: `1px solid ${info.cor}30`,
            fontSize: 13,
            fontWeight: 700,
            color: info.cor,
          }}>
            ✓ Seu plano atual
          </div>
        ) : links ? (
          <>
            {/* Botão principal — Anual */}
            <a
              href={links.anual}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                padding: "13px 20px",
                borderRadius: 10,
                background: info.destaque || isAtual
                  ? `linear-gradient(135deg, ${info.cor}, ${info.cor}cc)`
                  : "transparent",
                border: info.destaque || isAtual ? "none" : `1.5px solid ${info.cor}70`,
                color: info.destaque || isAtual ? "#fff" : info.cor,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: info.destaque ? `0 4px 20px ${info.sombra}` : "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {isAtual && isTrial ? "Assinar anual e manter acesso →" : `${info.cta} (anual)`}
            </a>

            {/* Botão secundário — Mensal */}
            <a
              href={links.mensal}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                padding: "10px 20px",
                borderRadius: 10,
                background: "transparent",
                border: `1px solid var(--border)`,
                color: "var(--muted)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                marginTop: 8,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = info.cor; e.currentTarget.style.color = info.cor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
            >
              ou assinar mensal · R$ {info.precoMensal}/mês
            </a>
          </>
        ) : null}

        {/* Trial: dias restantes */}
        {isAtual && isTrial && diasTrial > 0 && (
          <div style={{
            marginTop: 8,
            textAlign: "center",
            fontSize: 11,
            color: diasTrial <= 2 ? "#ef4444" : "var(--primary)",
            fontWeight: 700,
          }}>
            {diasTrial} dia{diasTrial > 1 ? "s" : ""} de teste restante{diasTrial > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function AssinaturaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { assinatura, carregando, isTrial, diasTrial } = useAssinatura();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
  }, [router]);

  if (!user || carregando) return null;

  const planoKey     = assinatura?.plano || "free";
  const planoAtual   = PLANOS[planoKey];
  const dias         = diasRestantes(assinatura?.data_expiracao);
  const urgente      = dias <= 30 && dias > 0;
  const expirado     = !assinatura || (assinatura.status !== "ativo" && !isTrial) || (isTrial && diasTrial === 0);

  return (
    <>
      <Head>
        <title>Planos — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout user={user}>
        <div className="page-wrap" style={{ maxWidth: 1060, margin: "0 auto" }}>

          {/* ── Cabeçalho ── */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
              Planos e Assinatura
            </h1>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Todas as ferramentas para o contador moderno em um único hub
            </p>
          </div>

          {/* ── Status atual (expirado ou ativo) ── */}
          {expirado ? (
            <div className="card" style={{
              borderLeft: "4px solid var(--red)",
              marginBottom: 32,
              padding: "16px 20px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontSize: 22 }}>⚠️</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--red)" }}>Sem assinatura ativa</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  Escolha um plano abaixo para liberar todas as ferramentas do hub.
                </div>
              </div>
            </div>
          ) : planoKey !== "free" && !expirado && (
            <div className="card" style={{
              borderLeft: `4px solid ${planoAtual.cor}`,
              marginBottom: 32,
              padding: "16px 20px",
              background: planoAtual.corFundo,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 22 }}>✅</div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Plano ativo</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: planoAtual.cor }}>{planoAtual.nome}</div>
                </div>
              </div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 20,
                background: urgente ? "#ef444420" : isTrial ? "#DF9F2020" : "#22c55e20",
                color: urgente ? "#ef4444" : isTrial ? "var(--primary)" : "#22c55e",
                fontSize: 12,
                fontWeight: 700,
              }}>
                {isTrial
                  ? `⏱ ${diasTrial} dias de teste restantes`
                  : urgente
                    ? `⚠ Expira em ${dias} dias`
                    : `Ativo — ${dias} dias restantes`}
              </div>
            </div>
          )}

          {/* ── Cards de planos ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            alignItems: "start",
          }}
            className="pricing-grid"
          >
            {["essencial", "profissional", "especialista"].map((key) => (
              <PricingCard
                key={key}
                planKey={key}
                planoAtual={planoKey}
                isTrial={isTrial}
                diasTrial={diasTrial}
              />
            ))}
          </div>

          {/* ── Nota plano Free ── */}
          {planoKey === "free" && (
            <div style={{
              marginTop: 20,
              padding: "14px 20px",
              borderRadius: 12,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontSize: 18 }}>ℹ️</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  Você está no plano gratuito
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  O plano Free inclui apenas acesso ao portal de notícias. Assine qualquer plano acima para desbloquear as ferramentas profissionais.
                </div>
              </div>
            </div>
          )}

          {/* ── Garantia ── */}
          <div style={{
            marginTop: 28,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 12,
            color: "var(--muted)",
          }}>
            <span>🛡️</span>
            <span>60 dias de garantia em todos os planos · Cancele quando quiser · Suporte por e-mail</span>
          </div>

        </div>

        {/* CSS responsivo para o grid de preços */}
        <style>{`
          @media (max-width: 860px) {
            .pricing-grid {
              grid-template-columns: 1fr !important;
              max-width: 440px;
              margin: 0 auto;
            }
          }
          @media (min-width: 861px) and (max-width: 1020px) {
            .pricing-grid {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 12px !important;
            }
            .pricing-grid > div {
              padding: 22px 16px !important;
            }
          }
        `}</style>

      </Layout>
    </>
  );
}
