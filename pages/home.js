import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import { useAssinatura } from "../lib/AssinaturaContext";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { pode } = useAssinatura();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/");
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
      id: "simulador",
      label: "Simulador Tributário",
      desc: "Compare Simples Nacional, Lucro Presumido e Lucro Real. Descubra o regime mais vantajoso e acesse seu histórico de simulações.",
      cor: "var(--primary)",
      badge: "Mais usado",
      rota: "/calculadora",
    },
    {
      id: "noticias",
      label: "Portal de Notícias",
      desc: "Notícias contábeis, fiscais e tributárias em tempo real. Reforma tributária, Simples Nacional, CFC e muito mais.",
      cor: "#3b82f6",
      rota: "/noticias",
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
      label: "Calculadora de Honorários",
      desc: "Calcule honorários contábeis por estado, regime tributário, faturamento e serviços. Gere propostas em PDF.",
      cor: "#f97316",
      rota: "/honorarios",
    },
    {
      id: "cnpj",
      label: "Consulta CNPJ",
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
      label: "ICMS-ST",
      desc: "Calcule o ICMS por Substituição Tributária em operações interestaduais com MVA ajustada, alíquotas automáticas e relatório em PDF.",
      cor: "#818cf8",
      rota: "/icmsst",
    },
    {
      id: "simulado",
      label: "Simulado CFC",
      desc: "Simule o Exame de Suficiência com questões reais das últimas edições. Resultado detalhado por área com gabarito comentado.",
      cor: "#DF9F20",
      rota: "/simulado",
    },
    {
      id: "reforma",
      label: "Reforma Tributária",
      desc: "Simule o impacto da LC 214/2025 para seus clientes. IBS + CBS, regimes comparados, cronograma de transição 2026–2033.",
      cor: "#DF9F20",
      badge: "NOVO",
      destaque: true,
      rota: "/reforma",
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
