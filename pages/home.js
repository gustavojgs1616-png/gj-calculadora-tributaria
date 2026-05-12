import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import { useAssinatura } from "../lib/AssinaturaContext";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { pode, planoEfetivo } = useAssinatura();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/login");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (!user) return null;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const nome = user?.user_metadata?.nome || user?.email?.split("@")[0] || "Usuário";

  const modulos = [
    {
      id: "noticias",
      label: "Portal de Notícias",
      desc: "Notícias contábeis, fiscais e tributárias em tempo real. Reforma tributária, Simples Nacional, CFC e muito mais.",
      cor: "#3b82f6",
      rota: "/noticias",
    },
    {
      id: "vagas",
      label: "Vagas de Contabilidade",
      desc: "Busque vagas de contabilidade no LinkedIn, Catho, Indeed, Gupy e mais. Filtre por cargo e estado em todo o Brasil.",
      cor: "#22c55e",
      badge: "NOVO",
      rota: "/vagas",
    },
    {
      id: "simulador",
      label: "Simulador Tributário",
      desc: "Compare Simples Nacional, Lucro Presumido e Lucro Real. Descubra o regime mais vantajoso e acesse seu histórico de simulações.",
      cor: "var(--primary)",
      rota: "/calculadora",
    },
    {
      id: "fiscal",
      label: "Calendário Fiscal",
      desc: "Todas as obrigações fiscais do mês em um só lugar: FGTS, DAS, IRRF, DCTF, PIS/COFINS e declarações anuais.",
      cor: "#22c55e",
      rota: "/fiscal",
    },
    {
      id: "honorarios",
      label: "Precificação Contábil",
      desc: "Calcule honorários contábeis por estado, regime tributário, faturamento e serviços. Gere propostas em PDF.",
      cor: "#f97316",
      rota: "/honorarios",
    },
    {
      id: "cnpj",
      label: "Consulta Fiscal",
      desc: "Consulte dados completos de qualquer empresa: razão social, sócios, CNAEs, situação cadastral e endereço.",
      cor: "#8b5cf6",
      rota: "/cnpj",
    },
    {
      id: "documentos",
      label: "Gerador de Documentos",
      desc: "Gere contratos, procurações, declarações e cartas em PDF na hora. Sem Word, sem perda de tempo.",
      cor: "#06b6d4",
      rota: "/documentos",
    },
    {
      id: "rescisao",
      label: "Rescisão Trabalhista",
      desc: "Calcule todas as verbas rescisórias: saldo, 13º, férias, FGTS, INSS e IRRF. Tabelas 2025 atualizadas. PDF completo.",
      cor: "#818cf8",
      rota: "/rescisao",
    },
    {
      id: "icmsst",
      label: "Cálculo do ICMS-ST",
      desc: "Calcule ICMS-ST e DIFAL em operações interestaduais com MVA ajustada, alíquotas automáticas e relatório em PDF.",
      cor: "#818cf8",
      rota: "/icmsst",
    },
    {
      id: "reforma",
      label: "Reforma Tributária",
      desc: "Simule o impacto da LC 214/2025 para seus clientes. IBS + CBS, regimes comparados, cronograma de transição 2026–2033.",
      cor: "#DF9F20",
      destaque: true,
      rota: "/reforma",
    },
    {
      id: "simulado",
      label: "Simulado CFC",
      desc: "Simule o Exame de Suficiência com questões reais das últimas edições. Resultado detalhado por área com gabarito comentado.",
      cor: "#DF9F20",
      rota: "/simulado",
    },
    {
      id: "irpf",
      label: "Simulador IRPF",
      desc: "Simplificado vs. completo, restituição ou imposto a pagar, IRRF mensal e tabelas 2025 atualizadas.",
      cor: "#DF9F20",
      badge: "NOVO",
      rota: "/irpf",
    },
  ];

  return (
    <>
      <Head>
        <title>GJ Hub Contábil</title>
      </Head>

      <Layout user={user}>
        <div className="home-container">

          {/* Saudação */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>
              {saudacao}, <span style={{ color: "var(--primary)" }}>{nome}</span>
            </h1>
            <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>
              Bem-vindo ao <strong style={{ color: "var(--text)" }}>GJ Hub Contábil</strong> — o hub completo para contadores.
            </p>
          </div>

          {/* ── Banner Upgrade — visível apenas para plano Free ── */}
          {planoEfetivo === "free" && (
            <div style={{
              background: "linear-gradient(135deg, #0d0a2e 0%, #13103d 50%, #0d0a2e 100%)",
              border: "1px solid #808CFF50",
              borderRadius: 16,
              padding: "20px 22px",
              marginBottom: 22,
              boxShadow: "0 4px 40px rgba(128,140,255,0.15)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Brilho de fundo decorativo */}
              <div style={{
                position: "absolute", top: -40, right: -40,
                width: 180, height: 180, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(128,140,255,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                  {/* Ícone */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: "linear-gradient(135deg, #808CFF22, #5b67d822)",
                    border: "1px solid #808CFF40",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  }}>🚀</div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#F5F6FF" }}>
                        Você está no plano gratuito
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: "#000",
                        background: "linear-gradient(135deg, #808CFF, #5b67d8)",
                        padding: "2px 8px", borderRadius: 20, letterSpacing: "0.05em",
                      }}>FREE</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#9098C8", margin: 0, lineHeight: 1.5 }}>
                      Desbloqueie o Simulador Tributário, Gerador de Documentos, Rescisão, Reforma Tributária e muito mais.
                    </p>
                  </div>
                </div>

                {/* Botão CTA */}
                <button
                  onClick={() => router.push("/assinatura")}
                  style={{
                    background: "linear-gradient(135deg, #808CFF, #5b67d8)",
                    border: "none",
                    borderRadius: 10,
                    padding: "11px 22px",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    boxShadow: "0 4px 20px rgba(128,140,255,0.4)",
                  }}
                >
                  Ver planos →
                </button>
              </div>

              {/* Ferramentas bloqueadas em pills */}
              <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                {[
                  "📊 Simulador Tributário",
                  "📅 Calendário Fiscal",
                  "💰 Precificação Contábil",
                  "🔍 Consulta Fiscal",
                  "📄 Gerador de Documentos",
                  "👔 Rescisão Trabalhista",
                  "🏛️ Cálculo do ICMS-ST",
                  "🔄 Reforma Tributária",
                  "🎓 Simulado CFC",
                  "🧾 Simulador IRPF",
                  "💼 Vagas de Contabilidade",
                ].map((f) => (
                  <span key={f} style={{
                    background: "rgba(128,140,255,0.08)",
                    border: "1px solid #808CFF25",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 11,
                    color: "#808CFF",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    🔒 {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Botão Admin — visível apenas para gustavo_jgs@hotmail.com */}
          {user?.email === "gustavo_jgs@hotmail.com" && (
            <div
              onClick={() => router.push("/admin")}
              style={{
                background: "linear-gradient(135deg, #0a0e3a, #12185a)",
                border: "1px solid #808CFF40",
                borderRadius: 12,
                padding: "14px 18px",
                marginBottom: 20,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 4px 20px rgba(128,140,255,0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "#808CFF22", border: "1px solid #808CFF44",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>⚙️</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F6FF" }}>Painel Administrativo</div>
                  <div style={{ fontSize: 12, color: "#6670B8", marginTop: 1 }}>Usuários, planos e métricas do hub</div>
                </div>
              </div>
              <span style={{ color: "#808CFF", fontSize: 18 }}>→</span>
            </div>
          )}

          {/* Banner — Reforma Tributária */}
          {pode && pode("reforma") && (
            <div
              onClick={() => router.push("/reforma")}
              style={{
                background: "linear-gradient(135deg, #1a1400 0%, #2a1f00 50%, #1a1400 100%)",
                border: "1px solid #DF9F2040",
                borderRadius: 14, padding: "16px 18px", marginBottom: 22, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                boxShadow: "0 4px 30px #DF9F2018",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "#DF9F2022", border: "1px solid #DF9F2044",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>📊</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#F5F6FF" }}>Simulador da Reforma Tributária</span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: "#000", background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
                      padding: "2px 7px", borderRadius: 20, letterSpacing: "0.06em", flexShrink: 0,
                    }}>NOVO</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#DF9F20AA", lineHeight: 1.5 }}>
                    IBS + CBS, cronograma 2026–2033 e recomendação de regime para seus clientes.
                  </div>
                </div>
              </div>
              <button className="reforma-banner-btn">
                Simular →
              </button>
            </div>
          )}

          {/* Label seção */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
            {modulos.length} ferramentas disponíveis
          </div>


          {/* Grid de módulos */}
          <div className="home-grid">
            {modulos.map((m) => {
              const liberado = pode ? pode(m.id) : true;
              return (
                <button
                  key={m.id}
                  className="home-module-card"
                  onClick={() => router.push(liberado ? m.rota : "/assinatura")}
                  style={{
                    background: m.destaque && liberado ? "linear-gradient(135deg, #1a1400 0%, #2a1f00 100%)" : "var(--bg-card)",
                    border: m.destaque && liberado ? "1px solid #DF9F2040" : "1px solid var(--border)",
                    borderLeft: `4px solid ${liberado ? m.cor : "var(--border)"}`,
                    opacity: liberado ? 1 : 0.65,
                    boxShadow: m.destaque && liberado ? "0 4px 20px #DF9F2015" : "none",
                  }}
                >
                  {/* Badge */}
                  {!liberado && (
                    <div style={{
                      position: "absolute", top: 12, right: 12,
                      background: "#ef444420", color: "#ef4444",
                      fontSize: 10, fontWeight: 700, padding: "3px 8px",
                      borderRadius: 20,
                    }}>Upgrade</div>
                  )}
                  {liberado && m.badge && (
                    <div style={{
                      position: "absolute", top: 12, right: 12,
                      background: m.destaque ? "linear-gradient(135deg,#DF9F20,#B27F1A)" : `${m.cor}22`,
                      color: m.destaque ? "#000" : m.cor,
                      fontSize: 9, fontWeight: 800, padding: "3px 8px",
                      borderRadius: 20, letterSpacing: "0.06em",
                    }}>{m.badge}</div>
                  )}
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: liberado ? m.cor : "var(--border)", marginBottom: 14 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginBottom: 14 }}>{m.desc}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: liberado ? m.cor : "var(--muted)" }}>
                    {liberado ? "Acessar →" : "Ver planos →"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Layout>
    </>
  );
}
