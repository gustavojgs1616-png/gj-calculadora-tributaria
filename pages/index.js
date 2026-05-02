import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

const CHECKOUT_LINKS = {
  essencial:    { anual: "https://pay.kiwify.com.br/NAhXR65", mensal: "https://pay.kiwify.com.br/mE2zB5V" },
  profissional: { anual: "https://pay.kiwify.com.br/6Rppp7j", mensal: "https://pay.kiwify.com.br/RBCmS4k" },
  especialista: { anual: "https://pay.kiwify.com.br/xXQpNPy", mensal: "https://pay.kiwify.com.br/GRNueqT" },
};

/* ── FAQ ── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{
      borderBottom: "1px solid #E0E3FF10", padding: "20px 0", cursor: "pointer",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: open ? "#F5F6FF" : "#9BA3C2", lineHeight: 1.4, transition: "color 0.2s" }}>{q}</span>
        <span style={{ color: "#DF9F20", fontSize: 20, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </div>
      {open && <p style={{ marginTop: 12, fontSize: 14, color: "#6670B8", lineHeight: 1.75 }}>{a}</p>}
    </div>
  );
}

/* ── Depoimento ── */
function Depo({ nome, cargo, texto, estrelas = 5 }) {
  return (
    <div style={{
      background: "#000433", border: "1px solid #E0E3FF10", borderRadius: 14,
      padding: "22px 20px", display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ color: "#DF9F20", fontSize: 13, letterSpacing: 2 }}>{"★".repeat(estrelas)}</div>
      <p style={{ fontSize: 13, color: "#9BA3C2", lineHeight: 1.75, fontStyle: "italic" }}>"{texto}"</p>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#F5F6FF" }}>{nome}</div>
        <div style={{ fontSize: 11, color: "#6670B8", marginTop: 2 }}>{cargo}</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState("anual");

  return (
    <>
      <Head>
        <title>GJ Hub Contábil — O hub completo para o contador moderno</title>
        <meta name="description" content="10 ferramentas para contadores: simulador tributário, calendário fiscal, precificação contábil, rescisão trabalhista e muito mais." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Saira', 'Inter', sans-serif; background: #00031F; color: #F5F6FF; }
        a { text-decoration: none; color: inherit; }
        button { cursor: pointer; border: none; font-family: inherit; }
        .lp { max-width: 1080px; margin: 0 auto; padding: 0 22px; }

        .lp-btn-gold {
          background: linear-gradient(135deg, #DF9F20, #B27F1A);
          color: #000; font-weight: 800; border-radius: 10px;
          padding: 14px 32px; font-size: 15px; display: inline-block;
          box-shadow: 0 4px 30px #DF9F2040; transition: transform 0.15s, box-shadow 0.15s;
        }
        .lp-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 6px 40px #DF9F2060; }

        .lp-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .lp-grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }

        @media (max-width: 860px) {
          .lp-grid-3 { grid-template-columns: 1fr 1fr; }
          .lp-hero-h { font-size: 30px !important; }
          .lp-pricing-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .lp-grid-3 { grid-template-columns: 1fr; }
          .lp-grid-2 { grid-template-columns: 1fr; }
          .lp-hero-h { font-size: 26px !important; }
          .lp-steps { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 400px) {
          .lp-steps { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══════════════════════════════════
          NAVBAR
      ══════════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#00031Fee", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #E0E3FF10",
      }}>
        <div className="lp" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 62, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="GJ Hub" style={{ width: 34, height: 34, borderRadius: 9, objectFit: "contain" }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#F5F6FF" }}>GJ Hub <span style={{ color: "#DF9F20" }}>Contábil</span></span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.push("/login")} style={{
              background: "none", border: "1px solid #E0E3FF18", borderRadius: 8,
              padding: "7px 16px", fontSize: 13, fontWeight: 600, color: "#9BA3C2",
            }}>Entrar</button>
            <a href="#planos" className="lp-btn-gold" style={{ padding: "7px 18px", fontSize: 13, borderRadius: 8 }}>
              Ver planos
            </a>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section style={{ padding: "72px 0 56px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)",
          width: 700, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, #DF9F2009 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="lp" style={{ position: "relative", textAlign: "center" }}>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#DF9F2015", border: "1px solid #DF9F2030",
            borderRadius: 20, padding: "5px 14px", marginBottom: 24,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.06em" }}>
              ✦ ATUALIZADO COM TABELAS 2026 + REFORMA TRIBUTÁRIA
            </span>
          </div>

          <h1 className="lp-hero-h" style={{ fontSize: 44, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.15, maxWidth: 760, margin: "0 auto 20px" }}>
            Você ainda perde horas no que<br />
            <span style={{ color: "#DF9F20" }}>deveria levar minutos?</span>
          </h1>

          <p style={{ fontSize: 17, color: "#9BA3C2", lineHeight: 1.75, maxWidth: 560, margin: "0 auto 36px" }}>
            Simular regime tributário, calcular rescisão, gerar proposta de honorários, consultar CNPJ — no GJ Hub você faz tudo isso em um lugar só, com tabelas 2026 sempre certas.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a href="#planos" className="lp-btn-gold">Quero assinar agora →</a>
            <button onClick={() => router.push("/login")} style={{
              background: "none", border: "1px solid #E0E3FF18", borderRadius: 10,
              padding: "14px 28px", fontSize: 14, fontWeight: 600, color: "#9BA3C2",
            }}>Já tenho conta</button>
          </div>

          <p style={{ marginTop: 18, fontSize: 12, color: "#6670B850" }}>
            🛡️ 7 dias de garantia · Sem fidelidade · Acesso imediato
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS
      ══════════════════════════════════ */}
      <section style={{ borderTop: "1px solid #E0E3FF10", borderBottom: "1px solid #E0E3FF10", background: "#000433", padding: "22px 0" }}>
        <div className="lp" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 36 }}>
          {[
            { n: "10", label: "ferramentas" },
            { n: "2026", label: "tabelas atualizadas" },
            { n: "PDF", label: "em tudo" },
            { n: "30s", label: "por simulação" },
            { n: "7d", label: "de garantia" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#DF9F20" }}>{s.n}</div>
              <div style={{ fontSize: 11, color: "#6670B860", marginTop: 2, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          JÁ ACONTECEU COM VOCÊ?
      ══════════════════════════════════ */}
      <section style={{ padding: "80px 0 64px" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>Você se identifica?</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2 }}>
              Me diz se isso já aconteceu<br />com você essa semana.
            </h2>
          </div>

          <div className="lp-grid-2" style={{ gap: 14 }}>
            {[
              {
                emoji: "📱",
                titulo: "O cliente ligou às 22h",
                texto: "Perguntando se compensa mudar de Simples Nacional para Lucro Presumido. Você ficou sem resposta na hora porque não tinha os dados na cabeça.",
              },
              {
                emoji: "⏱️",
                titulo: "40 minutos calculando rescisão",
                texto: "Abriu três abas no Google, procurou a tabela do INSS 2026, errou o cálculo de férias proporcionais e teve que refazer tudo do zero.",
              },
              {
                emoji: "💸",
                titulo: "Cobrou barato demais (de novo)",
                texto: "Um cliente novo entrou, você travou na hora de dar o preço dos honorários. Chutou um valor, aceitaram rápido demais — aí você soube que cobrou pouco.",
              },
              {
                emoji: "📄",
                titulo: "Uma hora para fazer um contrato",
                texto: "Abre o Word, procura o modelo antigo, edita os dados do cliente, formata, salva em PDF. Todo mês o mesmo ritual para cada cliente novo.",
              },
              {
                emoji: "😰",
                titulo: "Prazo fiscal passando em branco",
                texto: "DAS do Simples, DCTF, FGTS — você tem na cabeça mas às vezes um escapa. Aí vem multa, cliente irritado e retrabalho.",
              },
              {
                emoji: "🔍",
                titulo: "Perdeu tempo consultando CNPJ",
                texto: "Precisou verificar os sócios de um cliente em potencial. Entrou no site da Receita, esperou carregar, tentou de novo. Cinco minutos para ver algo simples.",
              },
            ].map((c) => (
              <div key={c.titulo} style={{
                background: "#000433", border: "1px solid #E0E3FF10",
                borderRadius: 14, padding: "20px 22px",
                display: "flex", gap: 16, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "#DF9F2015", border: "1px solid #DF9F2025",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{c.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F6FF", marginBottom: 6 }}>{c.titulo}</div>
                  <div style={{ fontSize: 13, color: "#6670B8", lineHeight: 1.65 }}>{c.texto}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Frase âncora */}
          <div style={{
            marginTop: 40, padding: "28px 32px",
            background: "linear-gradient(135deg, #0a0e3a, #0d1545)",
            border: "1px solid #DF9F2030", borderRadius: 16, textAlign: "center",
          }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#F5F6FF", lineHeight: 1.4 }}>
              Não é falta de competência.<br />
              <span style={{ color: "#DF9F20" }}>É falta de ferramenta certa.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FERRAMENTAS
      ══════════════════════════════════ */}
      <section id="ferramentas" style={{ padding: "80px 0 64px", background: "#000225" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>O que está incluído</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2 }}>
              10 ferramentas feitas por quem<br />entende a sua rotina.
            </h2>
            <p style={{ fontSize: 15, color: "#9BA3C2", marginTop: 12 }}>Desenvolvidas para a realidade do contador brasileiro, com tabelas sempre atualizadas.</p>
          </div>

          <div className="lp-grid-3">
            {[
              { icon: "📰", label: "Portal de Notícias", desc: "Reforma tributária, Simples Nacional, CFC e obrigações fiscais em tempo real.", plano: "Free", cor: "#64748b" },
              { icon: "🧮", label: "Simulador Tributário", desc: "Compare Simples Nacional, Lucro Presumido e Lucro Real em 30 segundos. Gere relatório em PDF.", plano: "Essencial", cor: "#22c55e" },
              { icon: "📅", label: "Calendário Fiscal", desc: "FGTS, DAS, IRRF, DCTF, PIS/COFINS — todas as obrigações do mês em um só lugar.", plano: "Essencial", cor: "#22c55e" },
              { icon: "🔍", label: "Consulta Fiscal", desc: "Razão social, sócios, CNAEs e situação cadastral de qualquer empresa pelo CNPJ.", plano: "Profissional", cor: "#818cf8" },
              { icon: "📄", label: "Gerador de Documentos", desc: "Contratos, procurações e declarações gerados em PDF em segundos. Sem Word.", plano: "Profissional", cor: "#818cf8" },
              { icon: "💰", label: "Precificação Contábil", desc: "Calcule honorários por estado, regime e faturamento. Proposta em PDF na hora.", plano: "Profissional", cor: "#818cf8" },
              { icon: "⚖️", label: "Rescisão Trabalhista", desc: "Verbas rescisórias, FGTS, INSS, IRRF, seguro-desemprego e checklist de homologação.", plano: "Profissional", cor: "#818cf8" },
              { icon: "📊", label: "ICMS Interestadual", desc: "ICMS-ST e DIFAL com MVA ajustada e alíquotas automáticas por UF.", plano: "Especialista", cor: "#DF9F20" },
              { icon: "🎓", label: "Simulado CFC", desc: "Questões reais do Exame de Suficiência 2018–2025 com gabarito comentado.", plano: "Especialista", cor: "#DF9F20" },
              { icon: "📈", label: "Reforma Tributária", desc: "Simule o impacto da LC 214/2025 para seus clientes. IBS + CBS, cronograma 2026–2033.", plano: "Especialista", cor: "#DF9F20", novo: true },
            ].map((f) => (
              <div key={f.label} style={{
                background: "#00031F", border: `1px solid ${f.cor}20`,
                borderLeft: `3px solid ${f.cor}`, borderRadius: 12,
                padding: "18px 18px 16px", position: "relative",
              }}>
                {f.novo && (
                  <span style={{
                    position: "absolute", top: 12, right: 12,
                    background: "linear-gradient(135deg,#DF9F20,#B27F1A)",
                    fontSize: 9, fontWeight: 800, color: "#000",
                    padding: "2px 8px", borderRadius: 20, letterSpacing: "0.06em",
                  }}>NOVO</span>
                )}
                <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F6FF", marginBottom: 6 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "#6670B8", lineHeight: 1.55, marginBottom: 10 }}>{f.desc}</div>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: f.cor,
                  background: `${f.cor}15`, padding: "2px 8px", borderRadius: 20,
                }}>{f.plano}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TRANSFORMAÇÃO — ANTES / DEPOIS
      ══════════════════════════════════ */}
      <section style={{ padding: "80px 0 64px" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>A diferença na prática</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2 }}>
              Com o GJ Hub, seu dia<br />passa a ser assim.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Antes */}
            <div style={{
              background: "#0d0000", border: "1px solid #ef444420",
              borderRadius: 16, padding: "28px 24px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#ef4444", letterSpacing: "0.08em", marginBottom: 20, textTransform: "uppercase" }}>❌ Sem o GJ Hub</div>
              {[
                "30 min calculando rescisão no Excel",
                "Clientes esperando resposta sobre regime",
                "Honorários chutados sem base técnica",
                "Contratos feitos no Word um por um",
                "Prazo fiscal esquecido, multa no fim do mês",
                "Consulta de CNPJ manual na Receita Federal",
              ].map((t) => (
                <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                  <span style={{ color: "#ef444460", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✗</span>
                  <span style={{ fontSize: 13, color: "#9BA3C2", lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Depois */}
            <div style={{
              background: "#001a0d", border: "1px solid #22c55e20",
              borderRadius: 16, padding: "28px 24px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#22c55e", letterSpacing: "0.08em", marginBottom: 20, textTransform: "uppercase" }}>✅ Com o GJ Hub</div>
              {[
                "Rescisão completa com PDF em 2 minutos",
                "Simulação tributária em 30 segundos",
                "Honorários calculados com proposta em PDF",
                "Contratos gerados automaticamente",
                "Calendário fiscal com todas as obrigações",
                "CNPJ consultado em 3 segundos",
              ].map((t) => (
                <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                  <span style={{ color: "#22c55e", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: "#9BA3C2", lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <a href="#planos" className="lp-btn-gold">Quero mudar minha rotina →</a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          DEPOIMENTOS
      ══════════════════════════════════ */}
      <section style={{ padding: "80px 0 64px", background: "#000225" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>O que dizem os usuários</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2 }}>
              Contadores que já usam<br />o GJ Hub todo dia.
            </h2>
          </div>

          <div className="lp-grid-3">
            <Depo
              nome="Camila Rocha"
              cargo="Contadora · Escritório próprio · SP"
              texto="O simulador tributário me salvou numa consultoria. O cliente queria mudar de regime e em 30 segundos já tinha os três cenários comparados. Fechei o serviço na hora."
            />
            <Depo
              nome="Rafael Mendes"
              cargo="Contador · 47 clientes ativos · MG"
              texto="Usava planilha para calcular rescisão há anos. Com o GJ Hub faço em 2 minutos e ainda gero o PDF para o cliente. Economizo pelo menos 3 horas por semana só nisso."
            />
            <Depo
              nome="Ana Paula Ferreira"
              cargo="Contadora autônoma · RJ"
              texto="A precificação foi o que me convenceu. Eu cobrava barato porque não sabia como calcular direito. Com a ferramenta de honorários, aumentei meu ticket médio em 40%."
            />
            <Depo
              nome="Marcos Tavares"
              cargo="Técnico contábil · PE"
              texto="O calendário fiscal me deu paz. Antes eu vivia com medo de esquecer algum prazo. Agora abro o hub todo dia de manhã e já sei o que precisa ser feito."
            />
            <Depo
              nome="Juliana Costa"
              cargo="Contadora · Empresa própria · RS"
              texto="O gerador de documentos economizou pelo menos 1h por cliente novo. Antes ficava editando contrato no Word. Agora é três cliques e o PDF está pronto."
            />
            <Depo
              nome="Thiago Almeida"
              cargo="Contador · Simples Nacional · BA"
              texto="Assino o plano Especialista e uso todas as 10 ferramentas. O simulado do CFC me ajudou a passar na minha última renovação. Produto completo de verdade."
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          COMO FUNCIONA
      ══════════════════════════════════ */}
      <section style={{ padding: "80px 0 64px" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>Simples assim</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2 }}>Como funciona</h2>
          </div>

          <div className="lp-steps" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[
              { n: "01", icon: "🛒", title: "Escolha o plano", desc: "Selecione o plano ideal e pague via Pix, boleto ou cartão. Parcelamos em até 12x." },
              { n: "02", icon: "📧", title: "Receba o acesso", desc: "Em minutos você recebe o e-mail com os dados de acesso à plataforma." },
              { n: "03", icon: "🔐", title: "Crie sua conta", desc: "Faça login com seu e-mail. Todas as ferramentas do seu plano já estão liberadas." },
              { n: "04", icon: "🚀", title: "Use sem limites", desc: "Acesse de qualquer dispositivo, a qualquer hora. PDF, histórico e tabelas 2026." },
            ].map((s) => (
              <div key={s.n} style={{
                background: "#000433", border: "1px solid #E0E3FF10",
                borderRadius: 14, padding: "22px 18px", position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: -12, left: 18,
                  background: "#DF9F20", borderRadius: 8, padding: "2px 10px",
                  fontSize: 11, fontWeight: 900, color: "#000",
                }}>{s.n}</div>
                <div style={{ fontSize: 26, marginBottom: 12, marginTop: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F6FF", marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "#6670B8", lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          PLANOS
      ══════════════════════════════════ */}
      <section id="planos" style={{ padding: "80px 0 64px", background: "#000225" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>Planos e preços</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2 }}>
              Escolha o plano que combina<br />com o tamanho do seu escritório.
            </h2>
            <p style={{ fontSize: 14, color: "#9BA3C2", marginTop: 10 }}>7 dias de garantia em todos os planos. Sem fidelidade.</p>

            {/* Toggle */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: "#00031F", border: "1px solid #E0E3FF15",
              borderRadius: 10, padding: 4, marginTop: 24, gap: 0,
            }}>
              {["mensal", "anual"].map((p) => (
                <button key={p} onClick={() => setPeriodo(p)} style={{
                  padding: "8px 22px", borderRadius: 7, fontSize: 13, fontWeight: 700,
                  background: periodo === p ? "#DF9F20" : "none",
                  color: periodo === p ? "#000" : "#9BA3C2",
                  transition: "all 0.2s",
                }}>
                  {p === "mensal" ? "Mensal" : "Anual — 12x sem complicação"}
                  {p === "anual" && (
                    <span style={{
                      marginLeft: 8, fontSize: 9, fontWeight: 800,
                      background: periodo === "anual" ? "#00000030" : "#DF9F2020",
                      color: periodo === "anual" ? "#000" : "#DF9F20",
                      padding: "2px 7px", borderRadius: 10,
                    }}>até 32% off à vista</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="lp-pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "center" }}>
            {[
              {
                key: "essencial", nome: "Essencial", cor: "#22c55e", sombra: "#22c55e25",
                destaque: false, badge: null,
                precoMensal: "47", parcelas: "41,06", precoAnualTotal: "397", precoAnualJuros: "492,72", economiaPorc: "30%",
                cta: "Começar no Essencial",
                itens: ["Portal de Notícias", "Simulador Tributário", "Calendário Fiscal"],
                qtd: 3,
              },
              {
                key: "profissional", nome: "Profissional", cor: "#818cf8", sombra: "#818cf830",
                destaque: true, badge: "Mais vendido",
                precoMensal: "97", parcelas: "82,43", precoAnualTotal: "797", precoAnualJuros: "989,16", economiaPorc: "32%",
                cta: "Escolher Profissional",
                itens: ["Portal de Notícias", "Simulador Tributário", "Calendário Fiscal", "Consulta Fiscal", "Gerador de Documentos", "Precificação Contábil", "Rescisão Trabalhista"],
                qtd: 7,
              },
              {
                key: "especialista", nome: "Especialista", cor: "#DF9F20", sombra: "#DF9F2025",
                destaque: false, badge: "Acesso Total",
                precoMensal: "167", parcelas: "144,48", precoAnualTotal: "1.397", precoAnualJuros: "1.733,76", economiaPorc: "30%",
                cta: "Quero o Especialista",
                itens: ["Todas as 7 do Profissional", "ICMS Interestadual", "Simulado CFC", "Reforma Tributária (NOVO)"],
                qtd: 10,
              },
            ].map((p) => (
              <div key={p.key} style={{
                background: "#00031F",
                border: p.destaque ? `2px solid ${p.cor}` : `1px solid ${p.cor}30`,
                borderRadius: 18, padding: "28px 22px 24px",
                position: "relative",
                boxShadow: p.destaque ? `0 8px 40px ${p.sombra}` : "none",
                transform: p.destaque ? "scale(1.03)" : "none",
              }}>
                {p.badge && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: p.destaque
                      ? `linear-gradient(135deg, ${p.cor}, #5a5fd8)`
                      : "linear-gradient(135deg, #DF9F20, #B27F1A)",
                    borderRadius: 20, padding: "4px 14px",
                    fontSize: 10, fontWeight: 800,
                    color: p.destaque ? "#fff" : "#000",
                    letterSpacing: "0.06em", whiteSpace: "nowrap",
                  }}>{p.badge}</div>
                )}

                <div style={{ fontSize: 16, fontWeight: 800, color: p.cor, marginBottom: 16 }}>{p.nome}</div>

                {periodo === "mensal" ? (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#6670B8", marginBottom: 4 }}>por mês, sem fidelidade</div>
                    <span style={{ fontSize: 38, fontWeight: 900, color: "#F5F6FF" }}>R${p.precoMensal}</span>
                    <span style={{ fontSize: 13, color: "#6670B8", marginLeft: 4 }}>/mês</span>
                  </div>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#6670B8", marginBottom: 4 }}>no cartão em até</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#9BA3C2" }}>12x de</span>
                      <span style={{ fontSize: 36, fontWeight: 900, color: "#F5F6FF", lineHeight: 1 }}>R${p.parcelas}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: "#6670B860" }}>
                      ou R${p.precoAnualTotal} à vista ·{" "}
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>economize {p.economiaPorc}</span>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: 12, color: "#6670B860", marginBottom: 16 }}>
                  {p.qtd} ferramentas incluídas
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {p.itens.map((it) => (
                    <div key={it} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: p.cor, fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 12, color: "#9BA3C2", lineHeight: 1.4 }}>{it}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={CHECKOUT_LINKS[p.key][periodo]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block", textAlign: "center", borderRadius: 10,
                    padding: "13px 20px", fontSize: 13, fontWeight: 800,
                    background: p.destaque
                      ? `linear-gradient(135deg, ${p.cor}, #5a5fd8)`
                      : p.key === "especialista"
                        ? "linear-gradient(135deg, #DF9F20, #B27F1A)"
                        : `${p.cor}22`,
                    border: (p.destaque || p.key === "especialista") ? "none" : `1px solid ${p.cor}60`,
                    color: p.destaque ? "#fff" : p.key === "especialista" ? "#000" : p.cor,
                  }}
                >
                  {p.cta} →
                </a>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#6670B840", marginTop: 24 }}>
            Pagamento seguro via Kiwify · Boleto, cartão ou Pix · 7 dias de garantia incondicional
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════
          FAQ
      ══════════════════════════════════ */}
      <section id="faq" style={{ padding: "80px 0 64px" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>Antes de assinar</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2 }}>
              Perguntas que todo contador<br />faz antes de entrar.
            </h2>
          </div>

          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            {[
              { q: "Posso testar antes de assinar?", a: "Sim. Existe um plano Free com acesso ao Portal de Notícias sem cartão. Ao assinar qualquer plano pago, você tem 7 dias de garantia — se não gostar, devolvemos 100% do valor sem perguntas." },
              { q: "Preciso instalar algum programa?", a: "Não. O GJ Hub Contábil é 100% online. Funciona em qualquer navegador, computador, tablet ou celular. Sem instalação, sem atualização manual." },
              { q: "As tabelas são atualizadas automaticamente?", a: "Sim. IRRF, INSS, FGTS, Simples Nacional, salário mínimo 2026 — tudo é atualizado assim que a legislação muda. Você sempre trabalha com os valores corretos sem fazer nada." },
              { q: "Posso usar para vários clientes?", a: "Sim, sem limite de clientes. Uma assinatura cobre todos os seus atendimentos. O plano é por escritório, não por cliente." },
              { q: "Como funciona a assinatura anual?", a: "Você paga uma única vez e economiza até 32% em relação ao mensal. O acesso é imediato e vale por 12 meses. Não há renovação automática surpresa — você decide se quer continuar." },
              { q: "E se eu quiser cancelar?", a: "Sem burocracia. Basta enviar um e-mail para contato@gjsolucoescontabeis.com.br e o cancelamento é feito no mesmo dia. Sem multa, sem cobrança extra." },
              { q: "Posso mudar de plano depois?", a: "Sim. Você pode fazer upgrade a qualquer momento. O valor pago no plano atual é descontado proporcionalmente no upgrade." },
              { q: "Como entro em contato para dúvidas?", a: "E-mail: contato@gjsolucoescontabeis.com.br. Respondemos em até 24h em dias úteis." },
            ].map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA FINAL
      ══════════════════════════════════ */}
      <section style={{ padding: "64px 0 80px", background: "#000225" }}>
        <div className="lp">
          <div style={{
            background: "linear-gradient(135deg, #0a0e3a 0%, #0d1545 50%, #0a0e3a 100%)",
            border: "1px solid #DF9F2030", borderRadius: 20, padding: "56px 32px",
            textAlign: "center", boxShadow: "0 0 80px #DF9F2010", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: 500, height: 300, borderRadius: "50%",
              background: "radial-gradient(ellipse, #DF9F2012 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                Comece agora
              </p>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2, marginBottom: 16 }}>
                Seu escritório contábil<br />mais eficiente a partir de hoje.
              </h2>
              <p style={{ fontSize: 15, color: "#9BA3C2", maxWidth: 460, margin: "0 auto 36px", lineHeight: 1.7 }}>
                Atenda mais clientes com menos tempo. Calcule com precisão, gere documentos em segundos e nunca mais perca um prazo fiscal.
              </p>
              <a href="#planos" className="lp-btn-gold" style={{ fontSize: 15 }}>Ver planos e preços →</a>
              <p style={{ marginTop: 18, fontSize: 12, color: "#6670B860" }}>
                🛡️ 7 dias de garantia · Pagamento seguro · Acesso imediato
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOOTER
      ══════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid #E0E3FF10", padding: "32px 0", background: "#00031F" }}>
        <div className="lp">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <img src="/logo.png" alt="GJ Hub Contábil" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "contain" }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#F5F6FF" }}>GJ Hub Contábil</span>
              </div>
              <div style={{ fontSize: 11, color: "#6670B840" }}>GJ Soluções Contábeis · CNPJ 57.521.893/0001-40</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <Link href="/privacidade" style={{ fontSize: 12, color: "#6670B8" }}>Política de Privacidade</Link>
              <Link href="/termos" style={{ fontSize: 12, color: "#6670B8" }}>Termos de Uso</Link>
              <a href="mailto:contato@gjsolucoescontabeis.com.br" style={{ fontSize: 12, color: "#6670B8" }}>contato@gjsolucoescontabeis.com.br</a>
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E0E3FF08", textAlign: "center", fontSize: 11, color: "#6670B830" }}>
            © {new Date().getFullYear()} GJ Hub Contábil. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}
