import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
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
      borderBottom: "1px solid #e2e8f0", padding: "20px 0", cursor: "pointer",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: open ? "#0d1545" : "#374151", lineHeight: 1.4, transition: "color 0.2s" }}>{q}</span>
        <span style={{ color: "#DF9F20", fontSize: 20, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </div>
      {open && <p style={{ marginTop: 12, fontSize: 14, color: "#64748b", lineHeight: 1.75 }}>{a}</p>}
    </div>
  );
}

/* ── Depoimento com imagem real ── */
function DepoImagem({ src, alt, label }) {
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 24px #00000015",
      display: "flex", flexDirection: "column",
    }}>
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", display: "block", objectFit: "cover" }}
      />
      {label && (
        <div style={{
          padding: "8px 14px",
          background: "#f8fafc",
          fontSize: 11, color: "#64748b", fontWeight: 600,
          borderTop: "1px solid #e2e8f0",
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

/* ── Demo animada ── */
const DEMO_ABAS = [
  {
    id: "tributario", label: "🧮 Simulador Tributário",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["Receita: R$ 1,2M/ano", "Atividade: Comércio", "12 funcionários"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "MEI", valor: "—", sub: "Não elegível", destaque: false, off: true },
            { label: "SIMPLES", valor: "R$ 112.340", sub: "Imposto anual", destaque: false },
            { label: "PRESUMIDO", valor: "R$ 98.720", sub: "Imposto anual", destaque: true },
            { label: "LUCRO REAL", valor: "R$ 134.100", sub: "Imposto anual", destaque: false },
          ].map(c => (
            <div key={c.label} style={{
              background: c.destaque ? "#0a1a0a" : "#1e2235",
              border: c.destaque ? "2px solid #22c55e" : "1px solid #ffffff10",
              borderRadius: 10, padding: "14px 12px", position: "relative",
            }}>
              {c.destaque && <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>MELHOR</span>}
              <div style={{ fontSize: 10, fontWeight: 700, color: c.off ? "#4a5568" : "#9BA3C2", letterSpacing: "0.06em", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: c.off ? "#4a5568" : c.destaque ? "#22c55e" : "#F5F6FF", lineHeight: 1.2 }}>{c.valor}</div>
              <div style={{ fontSize: 10, color: "#6670B8", marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6670B8", letterSpacing: "0.08em", marginBottom: 4 }}>ECONOMIA ANUAL SUGERIDA</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e", fontFamily: "monospace" }}>R$ 13.620,00</div>
          </div>
          <div style={{ background: "#DF9F20", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 800, color: "#000" }}>⬇ Gerar PDF</div>
        </div>
      </div>
    ),
  },
  {
    id: "rescisao", label: "⚖️ Rescisão Trabalhista",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["Func.: João Silva", "Salário: R$ 3.200", "Admissão: 03/2022", "Demissão: 04/2026"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Saldo de Salário (16 dias)", valor: "R$ 1.706,67" },
            { label: "13º Salário Proporcional (4/12)", valor: "R$ 1.066,67" },
            { label: "Férias Proporcionais + 1/3", valor: "R$ 1.493,33" },
            { label: "FGTS sobre verbas rescisórias", valor: "R$ 341,87" },
            { label: "Multa FGTS (40%)", valor: "R$ 3.072,00" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#1e2235", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#9BA3C2" }}>{l.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#F5F6FF" }}>{l.valor}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6670B8", letterSpacing: "0.08em", marginBottom: 4 }}>TOTAL LÍQUIDO A PAGAR</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#818cf8", fontFamily: "monospace" }}>R$ 7.680,54</div>
          </div>
          <div style={{ background: "#DF9F20", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 800, color: "#000" }}>⬇ Gerar PDF</div>
        </div>
      </div>
    ),
  },
  {
    id: "honorarios", label: "💰 Precificação Contábil",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["Estado: SP", "Regime: Simples Nacional", "Faturamento: R$ 40k/mês", "8 funcionários"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Contabilidade mensal", valor: "R$ 980,00", cor: "#22c55e" },
            { label: "Folha de pagamento", valor: "R$ 320,00", cor: "#818cf8" },
            { label: "Assessoria fiscal", valor: "R$ 240,00", cor: "#818cf8" },
            { label: "IRPF dos sócios (2)", valor: "R$ 180,00", cor: "#DF9F20" },
          ].map(i => (
            <div key={i.label} style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "14px 12px" }}>
              <div style={{ fontSize: 11, color: "#6670B8", marginBottom: 6 }}>{i.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: i.cor }}>{i.valor}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6670B8", letterSpacing: "0.08em", marginBottom: 4 }}>PROPOSTA TOTAL SUGERIDA</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#DF9F20", fontFamily: "monospace" }}>R$ 1.720,00/mês</div>
          </div>
          <div style={{ background: "#DF9F20", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 800, color: "#000" }}>⬇ Gerar Proposta</div>
        </div>
      </div>
    ),
  },
  {
    id: "icmsst", label: "📊 Cálculo do ICMS-ST",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["Origem: SP", "Destino: RJ", "Produto: R$ 5.000", "IPI: 5%", "MVA: 35%"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Base de Cálculo ICMS", valor: "R$ 5.000,00" },
            { label: "(+) IPI (5%) — integra base ST", valor: "R$ 250,00", cor: "#a78bfa" },
            { label: "(=) Base p/ MVA", valor: "R$ 5.250,00", cor: "#a78bfa" },
            { label: "MVA Ajustada", valor: "32,81%" },
            { label: "Base de Cálculo ST", valor: "R$ 6.972,53" },
            { label: "ICMS Próprio (12%)", valor: "R$ 600,00" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#1e2235", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#9BA3C2" }}>{l.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: l.cor || "#F5F6FF" }}>{l.valor}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6670B8", letterSpacing: "0.08em", marginBottom: 4 }}>ICMS-ST A RECOLHER</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#818cf8", fontFamily: "monospace" }}>R$ 858,38</div>
          </div>
          <div style={{ background: "#DF9F20", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 800, color: "#000" }}>⬇ Gerar Relatório</div>
        </div>
      </div>
    ),
  },
  {
    id: "cnpj", label: "🔍 Consulta Fiscal",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["CNPJ: 12.345.678/0001-90", "Consulta em 3s"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Razão Social", valor: "PADARIA TRIGAL LTDA" },
            { label: "Situação Cadastral", valor: "✅ ATIVA", cor: "#22c55e" },
            { label: "Abertura", valor: "12/03/2018" },
            { label: "CNAE Principal", valor: "1091-1/01 — Fabricação de produtos de panificação" },
            { label: "Capital Social", valor: "R$ 80.000,00" },
            { label: "Sócios", valor: "Carlos Mendes · Maria Souza" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 12px", background: "#1e2235", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#6670B8", flexShrink: 0 }}>{l.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: l.cor || "#F5F6FF", textAlign: "right" }}>{l.valor}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6670B8" }}>Simples Nacional · Opção vigente</span>
          <div style={{ background: "#22c55e20", border: "1px solid #22c55e40", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#22c55e" }}>SIM — OPTANTE</div>
        </div>
      </div>
    ),
  },
  {
    id: "noticias", label: "📰 Notícias Contábeis",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["Atualizado agora", "Fontes: Receita Federal · CFC · SEFAZ"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {[
            { tag: "Receita Federal", titulo: "Prazo para entrega da ECF 2026 é prorrogado até 31/07", hora: "há 2h", cor: "#22c55e" },
            { tag: "Simples Nacional", titulo: "Novas alíquotas do Simples para MEI entram em vigor em junho", hora: "há 5h", cor: "#DF9F20" },
            { tag: "eSocial", titulo: "eSocial: evento S-1200 ganha nova versão com campos obrigatórios", hora: "há 8h", cor: "#818cf8" },
            { tag: "Reforma Tributária", titulo: "IBS/CBS: Regulamentação dos créditos publicada no DOU", hora: "hoje", cor: "#f97316" },
          ].map(n => (
            <div key={n.titulo} style={{ display: "flex", gap: 12, padding: "10px 12px", background: "#1e2235", borderRadius: 8, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, background: n.cor + "20", border: `1px solid ${n.cor}40`, borderRadius: 6, padding: "2px 8px", fontSize: 9, fontWeight: 800, color: n.cor, whiteSpace: "nowrap", marginTop: 2 }}>{n.tag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#F5F6FF", fontWeight: 600, lineHeight: 1.5 }}>{n.titulo}</div>
                <div style={{ fontSize: 10, color: "#6670B8", marginTop: 3 }}>{n.hora}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6670B8" }}>4 novas notícias hoje · 38 esta semana</span>
          <div style={{ background: "#DF9F2020", border: "1px solid #DF9F2040", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#DF9F20" }}>Ver todas →</div>
        </div>
      </div>
    ),
  },
  {
    id: "fiscal", label: "📅 Calendário Fiscal",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["Maio 2026", "Simples Nacional", "Lucro Presumido"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {[
            { dia: "07/05", obrig: "DAS — Simples Nacional (abril)", status: "vence em breve", cor: "#f97316" },
            { dia: "15/05", obrig: "FGTS — Competência abril/2026", status: "próximo", cor: "#DF9F20" },
            { dia: "20/05", obrig: "DCTF Mensal — competência março", status: "próximo", cor: "#DF9F20" },
            { dia: "30/05", obrig: "SPED EFD-Contribuições — abril", status: "no prazo", cor: "#22c55e" },
            { dia: "31/05", obrig: "ECF — Exercício 2025 (Lucro Real/Presumido)", status: "no prazo", cor: "#22c55e" },
          ].map(o => (
            <div key={o.obrig} style={{ display: "flex", gap: 12, padding: "8px 12px", background: "#1e2235", borderRadius: 8, alignItems: "center" }}>
              <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: o.cor, minWidth: 48 }}>{o.dia}</div>
              <div style={{ flex: 1, fontSize: 12, color: "#F5F6FF" }}>{o.obrig}</div>
              <div style={{ flexShrink: 0, background: o.cor + "20", border: `1px solid ${o.cor}40`, borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: o.cor }}>{o.status}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6670B8" }}>5 obrigações em maio · 2 vencem em breve</span>
          <div style={{ background: "#DF9F20", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 800, color: "#000" }}>⬇ Exportar</div>
        </div>
      </div>
    ),
  },
  {
    id: "documentos", label: "📄 Gerador de Documentos",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["13 modelos disponíveis", "PDF automático", "Com sua marca"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { icon: "📄", label: "Contrato de Serviços Contábeis", badge: "LGPD · LC 214/2025", cor: "#818cf8" },
            { icon: "📝", label: "Aditivo Contratual", badge: "Personalizado", cor: "#22c55e" },
            { icon: "📬", label: "Carta de Encerramento", badge: "Profissional", cor: "#DF9F20" },
            { icon: "🔏", label: "Procuração PGFN", badge: "Digital", cor: "#f97316" },
            { icon: "📋", label: "Declaração MEI", badge: "Atualizado 2026", cor: "#22c55e" },
            { icon: "💌", label: "Notificação de Cobrança", badge: "Com vencimento", cor: "#ef4444" },
          ].map(d => (
            <div key={d.label} style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18 }}>{d.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: "#F5F6FF", fontWeight: 600, lineHeight: 1.4 }}>{d.label}</div>
                <div style={{ fontSize: 9, color: d.cor, fontWeight: 700, marginTop: 3 }}>{d.badge}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6670B8" }}>Preencha os campos → PDF gerado em segundos</span>
          <div style={{ background: "#DF9F20", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 800, color: "#000" }}>⬇ Gerar PDF</div>
        </div>
      </div>
    ),
  },
  {
    id: "simulado", label: "🎓 Simulado CFC",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["120 questões", "7 áreas", "Exame CFC 2024"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#6670B8", marginBottom: 8, fontWeight: 600 }}>Questão 14 de 120 — Contabilidade de Custos</div>
          <div style={{ fontSize: 13, color: "#F5F6FF", lineHeight: 1.7, marginBottom: 14 }}>
            Uma empresa industrial utiliza o método de custeio por absorção. Sabendo que o custo fixo total foi de R$ 60.000 e foram produzidas 1.500 unidades, qual o custo fixo unitário?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { l: "A", t: "R$ 30,00", ok: false },
              { l: "B", t: "R$ 40,00", ok: true },
              { l: "C", t: "R$ 50,00", ok: false },
              { l: "D", t: "R$ 60,00", ok: false },
            ].map(a => (
              <div key={a.l} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 8, background: a.ok ? "#22c55e18" : "#0d1117", border: `1.5px solid ${a.ok ? "#22c55e" : "#ffffff10"}` }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: a.ok ? "#22c55e" : "transparent", border: `2px solid ${a.ok ? "#22c55e" : "#6670B8"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: a.ok ? "#fff" : "#6670B8", flexShrink: 0 }}>{a.ok ? "✓" : a.l}</div>
                <span style={{ fontSize: 12, color: a.ok ? "#22c55e" : "#9BA3C2" }}>{a.t}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#22c55e10", border: "1px solid #22c55e30", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", marginBottom: 4 }}>RESOLUÇÃO</div>
          <div style={{ fontSize: 12, color: "#9BA3C2", lineHeight: 1.6 }}>CFU = Custo Fixo Total ÷ Qtd. Produzida = 60.000 ÷ 1.500 = <strong style={{ color: "#22c55e" }}>R$ 40,00</strong> por unidade.</div>
        </div>
      </div>
    ),
  },
  {
    id: "reforma", label: "🔄 Reforma Tributária",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["LC 214/2025", "IBS + CBS", "Faturamento: R$ 800k/ano"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Regime Atual (Simples)", valor: "R$ 56.800", sub: "DAS anual estimado", cor: "#818cf8" },
            { label: "Pós-Reforma (IBS+CBS)", valor: "R$ 61.200", sub: "Carga estimada 2027", cor: "#f97316" },
          ].map(c => (
            <div key={c.label} style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "14px 12px" }}>
              <div style={{ fontSize: 10, color: "#6670B8", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: c.cor }}>{c.valor}</div>
              <div style={{ fontSize: 10, color: "#6670B8", marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
          {[
            { label: "Impacto líquido estimado", valor: "+R$ 4.400/ano", cor: "#f97316" },
            { label: "Fator R calculado", valor: "32,4% — Anexo III aplicável", cor: "#22c55e" },
            { label: "Período de transição", valor: "2026 – 2032 (7 anos)", cor: "#818cf8" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#1e2235", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#9BA3C2" }}>{l.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: l.cor }}>{l.valor}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6670B8" }}>Cenário moderado · Alíquota ref. 26,5%</span>
          <div style={{ background: "#DF9F20", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 800, color: "#000" }}>⬇ Salvar Simulação</div>
        </div>
      </div>
    ),
  },
  {
    id: "irpf", label: "🧾 Simulador IRPF",
    tela: () => (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["Declaração 2026", "Ano-base 2025", "Modelo Completo"].map(t => (
            <span key={t} style={{ background: "#1e2235", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#9BA3C2" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Rendimentos Tributáveis", valor: "R$ 96.000,00" },
            { label: "(-) Deduções Legais (INSS + Dependentes)", valor: "R$ 14.880,00", cor: "#22c55e" },
            { label: "(-) Despesas Médicas", valor: "R$ 8.400,00", cor: "#22c55e" },
            { label: "(=) Base de Cálculo", valor: "R$ 72.720,00", cor: "#818cf8" },
            { label: "(-) IRRF Retido na Fonte", valor: "R$ 9.240,00", cor: "#22c55e" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 12px", background: "#1e2235", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#9BA3C2" }}>{l.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: l.cor || "#F5F6FF", textAlign: "right" }}>{l.valor}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#1e2235", border: "1px solid #ffffff10", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6670B8", letterSpacing: "0.08em", marginBottom: 4 }}>IMPOSTO A RESTITUIR</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e", fontFamily: "monospace" }}>R$ 2.184,00</div>
          </div>
          <div style={{ background: "#DF9F20", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 800, color: "#000" }}>⬇ Gerar Relatório</div>
        </div>
      </div>
    ),
  },
];

const DURACAO_ABA = 4500;

function DemoSection() {
  const [abaAtiva, setAbaAtiva] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const progressRef = useRef(null);
  const cicloRef = useRef(null);

  const iniciarCiclo = (idx) => {
    setAbaAtiva(idx);
    setProgresso(0);
    clearInterval(progressRef.current);
    clearInterval(cicloRef.current);

    progressRef.current = setInterval(() => {
      setProgresso(p => {
        if (p >= 100) { clearInterval(progressRef.current); return 100; }
        return p + (100 / (DURACAO_ABA / 50));
      });
    }, 50);

    cicloRef.current = setTimeout(() => {
      iniciarCiclo((idx + 1) % DEMO_ABAS.length);
    }, DURACAO_ABA);
  };

  useEffect(() => {
    iniciarCiclo(0);
    return () => { clearInterval(progressRef.current); clearTimeout(cicloRef.current); };
  }, []);

  const aba = DEMO_ABAS[abaAtiva];

  return (
    <section style={{ padding: "80px 0 64px", background: "#050818" }}>
      <div className="lp">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 14, textTransform: "uppercase" }}>Veja o produto por dentro</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2 }}>
            12 ferramentas. <span style={{ color: "#DF9F20" }}>Um único lugar.</span>
          </h2>
        </div>

        {/* Abas */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          {DEMO_ABAS.map((a, i) => (
            <button key={a.id} onClick={() => iniciarCiclo(i)} style={{
              padding: "8px 16px", borderRadius: 30, fontSize: 12, fontWeight: 700,
              background: i === abaAtiva ? "#DF9F20" : "#1e2235",
              color: i === abaAtiva ? "#000" : "#9BA3C2",
              border: i === abaAtiva ? "none" : "1px solid #ffffff15",
              transition: "all 0.2s", cursor: "pointer",
            }}>{a.label}</button>
          ))}
        </div>

        {/* Janela do browser */}
        <div style={{ maxWidth: 780, margin: "0 auto", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px #00000060", border: "1px solid #ffffff10" }}>
          {/* Barra do browser */}
          <div style={{ background: "#111827", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #ffffff10" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
            </div>
            <div style={{ flex: 1, background: "#1e2235", borderRadius: 6, padding: "4px 12px", fontSize: 11, color: "#6670B8", textAlign: "center" }}>
              hub.gjcontabil.com.br · {aba.label.replace(/^[^ ]+ /, "")}
            </div>
          </div>

          {/* Barra de progresso */}
          <div style={{ height: 2, background: "#1e2235" }}>
            <div style={{ height: "100%", background: "#DF9F20", width: `${progresso}%`, transition: "width 0.05s linear" }} />
          </div>

          {/* Conteúdo */}
          <div style={{ background: "#0d1117", padding: "24px 22px", minHeight: 340 }}>
            <div style={{ fontSize: 12, color: "#6670B8", marginBottom: 18, fontWeight: 600 }}>
              {aba.label} · GJ Hub Contábil
            </div>
            {aba.tela()}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6670B8" }}>
          › Relatório em PDF em menos de 30s
        </p>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState("mensal");

  return (
    <>
      <Head>
        <title>GJ Hub Contábil — O hub completo para o contador moderno</title>
        <meta name="description" content="12 ferramentas para contadores: simulador tributário, calendário fiscal, precificação contábil, rescisão trabalhista e muito mais." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Open Graph — thumbnail ao compartilhar */}
        <meta property="og:title" content="GJ Hub Contábil — Tudo do contador na sua mão" />
        <meta property="og:description" content="12 ferramentas para contadores: simulador tributário, rescisão, honorários, ICMS, IRPF e muito mais. Tabelas 2026 sempre atualizadas." />
        <meta property="og:image" content="https://pro.gjtreinamentoscontabeis.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://pro.gjtreinamentoscontabeis.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="GJ Hub Contábil" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GJ Hub Contábil — Tudo do contador na sua mão" />
        <meta name="twitter:description" content="12 ferramentas para contadores com tabelas 2026 sempre atualizadas." />
        <meta name="twitter:image" content="https://pro.gjtreinamentoscontabeis.com/og-image.png" />

        {/* ── Meta Pixel ── */}
        <script dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','157519487288919');
          fbq('track','PageView');
        `}} />
        <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=157519487288919&ev=PageView&noscript=1"/>` }} />

        {/* ── Fontes: Satoshi (títulos) + Inter (texto/botões) ── */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* ── UTMify ── */}
        <script src="https://cdn.utmify.com.br/scripts/utms/latest.js" data-utmify-prevent-xcod-sck="" data-utmify-prevent-subids="" async defer />

        {/* ── Google Analytics G-T8CPL190K9 ── */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-T8CPL190K9" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','G-T8CPL190K9');
          gtag('config','GT-KFNR4WVQ');
          gtag('config','AW-10907448620');
        `}} />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        /* ── Tipografia base ── */
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 400;
          background: #f0f8ff;
          color: #0d1545;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ── Títulos: Satoshi Bold ── */
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Satoshi', 'Inter', sans-serif;
          font-weight: 700;
          line-height: 1.2;
        }

        a { text-decoration: none; color: inherit; }

        /* ── Botões: Inter SemiBold ── */
        button {
          cursor: pointer;
          border: none;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
        }

        .lp { max-width: 1080px; margin: 0 auto; padding: 0 22px; }

        /* ── CTA principal ── */
        .lp-btn-gold {
          background: linear-gradient(135deg, #DF9F20, #B27F1A);
          color: #000;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          border-radius: 10px;
          padding: 14px 32px;
          font-size: 15px;
          display: inline-block;
          box-shadow: 0 4px 30px #DF9F2040;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .lp-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 6px 40px #DF9F2060; }

        .lp-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .lp-grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }

        /* ── Tablet ── */
        @media (max-width: 860px) {
          .lp-grid-3 { grid-template-columns: 1fr 1fr; }
          .lp-hero-h { font-size: 30px !important; }
          .lp-pricing-grid { grid-template-columns: 1fr !important; }
        }

        /* ── Mobile ── */
        @media (max-width: 560px) {
          body { font-size: 15px; }
          h1, h2 { letter-spacing: -0.02em; }
          .lp { padding: 0 16px; }
          .lp-grid-3 { grid-template-columns: 1fr; }
          .lp-grid-2 { grid-template-columns: 1fr; }
          .lp-hero-h { font-size: 26px !important; }
          .hero-br { display: none; }
          .lp-steps { grid-template-columns: 1fr 1fr !important; }
          .lp-btn-gold { width: 100%; text-align: center; padding: 14px 20px; font-size: 15px; }
        }
        @media (max-width: 400px) {
          .lp-steps { grid-template-columns: 1fr !important; }
          .lp-hero-h { font-size: 22px !important; }
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
            <button onClick={() => router.push("/")} style={{
              background: "none", border: "1px solid #cbd5e1", borderRadius: 8,
              padding: "7px 16px", fontSize: 13, fontWeight: 600, color: "#f0f8ff",
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
          background: "radial-gradient(ellipse, #DF9F2018 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="lp" style={{ position: "relative", textAlign: "center" }}>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#DF9F2015", border: "1px solid #DF9F2030",
            borderRadius: 20, padding: "5px 14px", marginBottom: 24,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.06em" }}>
              ✦ TUDO DO CONTADOR NA SUA MÃO!
            </span>
          </div>

          <h1 className="lp-hero-h" style={{ fontSize: 44, fontWeight: 900, color: "#0d1545", lineHeight: 1.2, maxWidth: 960, margin: "0 auto 20px", textAlign: "center" }}>
            Contador, você ainda perde horas no que<br className="hero-br" />{" "}
            <span style={{ color: "#DF9F20" }}>deveria levar minutos?</span>
          </h1>

          <p style={{ fontSize: 17, color: "#4a5568", lineHeight: 1.75, maxWidth: 560, margin: "0 auto 36px" }}>
            Simular regime tributário, calcular rescisão, gerar proposta de honorários, consultar CNPJ — no GJ Hub você faz tudo isso em um lugar só, com tabelas 2026 sempre certas.
          </p>

          {/* ── Vídeo de vendas ── */}
          <div style={{ maxWidth: 720, margin: "0 auto 40px", width: "100%", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 40px #0d154520" }}>
            <div dangerouslySetInnerHTML={{ __html: `<vturb-smartplayer id="vid-69f9e65404f35c7d70f5c276" style="display:block;margin:0 auto;width:100%;" custom-config='{"smartAutoPlay":{"backgroundProbe":{"enabled":false}}}'></vturb-smartplayer>` }} />
          </div>
          <Script
            src="https://scripts.converteai.net/ba1137c7-38ed-4aa0-9ca7-3172265f680e/players/69f9e65404f35c7d70f5c276/v4/player.js"
            strategy="afterInteractive"
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a href="#planos" className="lp-btn-gold">Quero assinar agora →</a>
          </div>

          <p style={{ marginTop: 18, fontSize: 12, color: "#374151" }}>
            🛡️ 7 dias de garantia · Sem fidelidade · Acesso imediato
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════
          TICKER / MARQUEE
      ══════════════════════════════════ */}
      <section style={{ borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", background: "#0d1545", padding: "18px 0", overflow: "hidden" }}>
        <style>{`
          @keyframes ticker {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-track {
            display: flex;
            width: max-content;
            animation: ticker 32s linear infinite;
          }
          .ticker-track:hover { animation-play-state: paused; }
        `}</style>
        <div style={{ overflow: "hidden", width: "100%" }}>
          <div className="ticker-track">
            {[
              { valor: "100+",   texto: "Contadores Ativos" },
              { valor: "12",     texto: "Ferramentas no Hub" },
              { valor: "30s",    texto: "Por Simulação" },
              { valor: "7 dias", texto: "Garantia Total" },
              { valor: "2026",   texto: "Tabelas Atualizadas" },
              { valor: "3",      texto: "Regimes Tributários" },
              { valor: "100%",   texto: "Online, sem instalar" },
              { valor: "PDF",    texto: "em todos os relatórios" },
              { valor: "24/7",   texto: "Disponível" },
              { valor: "LC 214", texto: "Reforma Tributária" },
              // duplicado para loop perfeito
              { valor: "100+",   texto: "Contadores Ativos" },
              { valor: "12",     texto: "Ferramentas no Hub" },
              { valor: "30s",    texto: "Por Simulação" },
              { valor: "7 dias", texto: "Garantia Total" },
              { valor: "2026",   texto: "Tabelas Atualizadas" },
              { valor: "3",      texto: "Regimes Tributários" },
              { valor: "100%",   texto: "Online, sem instalar" },
              { valor: "PDF",    texto: "em todos os relatórios" },
              { valor: "24/7",   texto: "Disponível" },
              { valor: "LC 214", texto: "Reforma Tributária" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 36px", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#DF9F20", letterSpacing: "-0.01em" }}>
                    {item.valor}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                    {item.texto}
                  </span>
                </div>
                <span style={{ color: "#DF9F2050", fontSize: 18, flexShrink: 0 }}>◆</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          DEMO ANIMADA
      ══════════════════════════════════ */}
      <DemoSection />

      {/* ══════════════════════════════════
          JÁ ACONTECEU COM VOCÊ?
      ══════════════════════════════════ */}
      <section style={{ padding: "80px 0 64px" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>Você se identifica?</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0d1545", lineHeight: 1.2 }}>
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
                background: "#ffffff", border: "1px solid #e2e8f0",
                borderRadius: 14, padding: "20px 22px",
                display: "flex", gap: 16, alignItems: "flex-start",
                boxShadow: "0 2px 8px #0d154510",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "#DF9F2015", border: "1px solid #DF9F2025",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{c.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0d1545", marginBottom: 6 }}>{c.titulo}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{c.texto}</div>
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
            <p style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", lineHeight: 1.4 }}>
              Não é falta de competência.<br />
              <span style={{ color: "#DF9F20" }}>É falta de ferramenta certa.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FERRAMENTAS
      ══════════════════════════════════ */}
      <section id="ferramentas" style={{ padding: "80px 0 64px", background: "#eaf5fd" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>O que está incluído</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0d1545", lineHeight: 1.2 }}>
              12 ferramentas feitas por quem<br />entende a sua rotina.
            </h2>
            <p style={{ fontSize: 15, color: "#4a5568", marginTop: 12 }}>Desenvolvidas para a realidade do contador brasileiro, com tabelas sempre atualizadas.</p>
          </div>

          <div className="lp-grid-3">
            {[
              { icon: "📰", label: "Portal de Notícias", desc: "Reforma tributária, Simples Nacional, CFC e obrigações fiscais em tempo real.", plano: "Free", cor: "#64748b" },
              { icon: "🎓", label: "Central de Ajuda", desc: "Tutoriais e guias para usar todas as ferramentas do hub. Disponível para todos os planos, inclusive Free.", plano: "Free", cor: "#64748b" },
              { icon: "🧮", label: "Simulador Tributário", desc: "Compare Simples Nacional, Lucro Presumido e Lucro Real em 30 segundos. Gere relatório em PDF.", plano: "Starter", cor: "#16a34a" },
              { icon: "📅", label: "Calendário Fiscal", desc: "FGTS, DAS, IRRF, DCTF, PIS/COFINS — todas as obrigações do mês em um só lugar.", plano: "Starter", cor: "#16a34a" },
              { icon: "💼", label: "Vagas de Contabilidade", desc: "Busque vagas em tempo real no LinkedIn, Catho, Indeed, Gupy e mais. Filtre por cargo e estado.", plano: "Starter", cor: "#16a34a", novo: true },
              { icon: "🔍", label: "Consulta Fiscal", desc: "Razão social, sócios, CNAEs e situação cadastral de qualquer empresa pelo CNPJ.", plano: "Pro", cor: "#6366f1" },
              { icon: "📄", label: "Gerador de Documentos", desc: "Contratos, procurações e declarações gerados em PDF em segundos. Sem Word.", plano: "Pro", cor: "#6366f1" },
              { icon: "💰", label: "Precificação Contábil", desc: "Calcule honorários por estado, regime e faturamento. Proposta em PDF na hora.", plano: "Pro", cor: "#6366f1" },
              { icon: "⚖️", label: "Rescisão Trabalhista", desc: "Verbas rescisórias, FGTS, INSS, IRRF, seguro-desemprego e checklist de homologação.", plano: "Pro", cor: "#6366f1" },
              { icon: "📊", label: "Cálculo do ICMS-ST", desc: "ICMS-ST e DIFAL com MVA ajustada e alíquotas automáticas por UF.", plano: "Elite", cor: "#DF9F20" },
              { icon: "🎓", label: "Simulado CFC", desc: "Questões reais do Exame de Suficiência 2018–2025 com gabarito comentado.", plano: "Elite", cor: "#DF9F20" },
              { icon: "📈", label: "Reforma Tributária", desc: "Simule o impacto da LC 214/2025 para seus clientes. IBS + CBS, cronograma 2026–2033.", plano: "Elite", cor: "#DF9F20" },
              { icon: "🧾", label: "Simulador IRPF", desc: "Declaração 2025, IRRF mensal, Ganho de Capital, Carnê-Leão e Checklist completo. Tabelas 2025/2026.", plano: "Elite", cor: "#DF9F20", novo: true },
            ].map((f) => (
              <div key={f.label} style={{
                background: "#ffffff", border: `1px solid ${f.cor}30`,
                borderLeft: `3px solid ${f.cor}`, borderRadius: 12,
                padding: "18px 18px 16px", position: "relative",
                boxShadow: "0 2px 8px #0d154510",
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
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0d1545", marginBottom: 6 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.55, marginBottom: 10 }}>{f.desc}</div>
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
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0d1545", lineHeight: 1.2 }}>
              Com o GJ Hub, seu dia<br />passa a ser assim.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Antes */}
            <div style={{
              background: "#fff5f5", border: "1px solid #fecaca",
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
                  <span style={{ color: "#ef4444", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✗</span>
                  <span style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Depois */}
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 16, padding: "28px 24px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#16a34a", letterSpacing: "0.08em", marginBottom: 20, textTransform: "uppercase" }}>✅ Com o GJ Hub</div>
              {[
                "Rescisão completa com PDF em 2 minutos",
                "Simulação tributária em 30 segundos",
                "Honorários calculados com proposta em PDF",
                "Contratos gerados automaticamente",
                "Calendário fiscal com todas as obrigações",
                "CNPJ consultado em 3 segundos",
              ].map((t) => (
                <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                  <span style={{ color: "#16a34a", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.5 }}>{t}</span>
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
      <section style={{ padding: "80px 0 64px", background: "#eaf5fd" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>O que dizem os usuários</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0d1545", lineHeight: 1.2 }}>
              Contadores que já usam<br />o GJ Hub todo dia.
            </h2>
          </div>

          <div className="lp-grid-2">
            <DepoImagem
              src="/depoimentos/whatsapp1.jpeg"
              alt="Depoimento WhatsApp — ferramenta prática para Simples Nacional"
              label="📱 WhatsApp — Contador · Simples Nacional"
            />
            <DepoImagem
              src="/depoimentos/whatsapp2.jpeg"
              alt="Depoimento Contex Contabilidade — utilizo todo os dias"
              label="📱 WhatsApp — Contex Contabilidade · Plano Pro"
            />
            <DepoImagem
              src="/depoimentos/whatsapp3.jpeg"
              alt="Depoimento WhatsApp — Excelente experiência com o Hub"
              label="📱 WhatsApp — Contadora · Plano Pro"
            />
            <DepoImagem
              src="/depoimentos/google.png"
              alt="Avaliação Google — Gabriely Gonçalves ★★★★★"
              label="⭐ Avaliação Google — Gabriely Gonçalves"
            />
          </div>

          {/* Avaliação Google — Josiane Medeiros */}
          <div style={{
            marginTop: 20,
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 24px #00000015",
            background: "#fff",
            padding: "24px 28px",
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
          }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
              background: "#f97316", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff",
            }}>J</div>

            <div style={{ flex: 1 }}>
              {/* Nome + fonte */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1a73e8" }}>Josiane Medeiros</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>1 avaliação · Google</div>
                </div>
                {/* Logo Google */}
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>

              {/* Estrelas + tempo */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "#64748b" }}>Há 2 horas</span>
              </div>

              {/* Texto */}
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, margin: 0 }}>
                "Gj treinamento indico a todos, cursos muito bom, tem reforma tributária que está me ajudando muito, agora tem uma plataforma diferenciada, e com simulador da reforma e outras, estou muitooo"
              </p>

              <div style={{ marginTop: 10, fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                ⭐ Avaliação Google — Josiane Medeiros
              </div>
            </div>
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
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0d1545", lineHeight: 1.2 }}>Como funciona</h2>
          </div>

          <div className="lp-steps" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[
              { n: "01", icon: "🛒", title: "Escolha o plano", desc: "Selecione o plano ideal e pague via Pix, boleto ou cartão. Parcelamos em até 12x." },
              { n: "02", icon: "📧", title: "Receba o acesso", desc: "Em minutos você recebe o e-mail com os dados de acesso à plataforma." },
              { n: "03", icon: "🔐", title: "Crie sua conta", desc: "Faça login com seu e-mail. Todas as ferramentas do seu plano já estão liberadas." },
              { n: "04", icon: "🚀", title: "Use sem limites", desc: "Acesse de qualquer dispositivo, a qualquer hora. PDF, histórico e tabelas 2026." },
            ].map((s) => (
              <div key={s.n} style={{
                background: "#ffffff", border: "1px solid #e2e8f0",
                borderRadius: 14, padding: "22px 18px", position: "relative",
                boxShadow: "0 2px 8px #0d154510",
              }}>
                <div style={{
                  position: "absolute", top: -12, left: 18,
                  background: "#DF9F20", borderRadius: 8, padding: "2px 10px",
                  fontSize: 11, fontWeight: 900, color: "#000",
                }}>{s.n}</div>
                <div style={{ fontSize: 26, marginBottom: 12, marginTop: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0d1545", marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          PLANOS
      ══════════════════════════════════ */}
      <section id="planos" style={{ padding: "80px 0 64px", background: "#eaf5fd" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>Planos e preços</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0d1545", lineHeight: 1.2 }}>
              Escolha o plano que combina<br />com o tamanho do seu escritório.
            </h2>
            <p style={{ fontSize: 14, color: "#374151", marginTop: 10 }}>7 dias de garantia em todos os planos. Sem fidelidade.</p>

            {/* Toggle */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: "#e2e8f0", border: "1px solid #cbd5e1",
              borderRadius: 10, padding: 4, marginTop: 24, gap: 0,
            }}>
              {["mensal", "anual"].map((p) => (
                <button key={p} onClick={() => setPeriodo(p)} style={{
                  padding: "8px 22px", borderRadius: 7, fontSize: 13, fontWeight: 700,
                  background: periodo === p ? "#DF9F20" : "none",
                  color: periodo === p ? "#000" : "#374151",
                  transition: "all 0.2s",
                }}>
                  {p === "mensal" ? "Mensal" : "Anual — 12x no cartão"}
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
                key: "essencial", nome: "Starter", cor: "#22c55e", sombra: "#22c55e25",
                destaque: false, badge: null,
                precoMensal: "47", parcelas: "41,06", precoAnualTotal: "397", precoAnualJuros: "492,72", economiaPorc: "30%",
                cta: "Começar no Starter",
                itens: ["Portal de Notícias", "Simulador Tributário", "Calendário Fiscal", "Vagas de Contabilidade"],
                qtd: 4,
              },
              {
                key: "profissional", nome: "Pro", cor: "#818cf8", sombra: "#818cf830",
                destaque: true, badge: "Mais vendido",
                precoMensal: "97", parcelas: "82,43", precoAnualTotal: "797", precoAnualJuros: "989,16", economiaPorc: "32%",
                cta: "Escolher o Pro",
                itens: ["Portal de Notícias", "Simulador Tributário", "Calendário Fiscal", "Vagas de Contabilidade", "Consulta Fiscal", "Gerador de Documentos", "Precificação Contábil", "Rescisão Trabalhista"],
                qtd: 8,
              },
              {
                key: "especialista", nome: "Elite", cor: "#DF9F20", sombra: "#DF9F2025",
                destaque: false, badge: "Acesso Total",
                precoMensal: "167", parcelas: "144,48", precoAnualTotal: "1.397", precoAnualJuros: "1.733,76", economiaPorc: "30%",
                cta: "Quero o Elite",
                itens: ["Todas as 8 do Pro", "Cálculo do ICMS-ST", "Simulado CFC", "Reforma Tributária", "Simulador IRPF (NOVO)"],
                qtd: 12,
              },
            ].map((p) => (
              <div key={p.key} style={{
                background: "#ffffff",
                border: p.destaque ? `2px solid ${p.cor}` : `1px solid ${p.cor}40`,
                borderRadius: 18, padding: "28px 22px 24px",
                position: "relative",
                boxShadow: p.destaque ? `0 8px 40px ${p.sombra}` : "0 2px 12px #0d154512",
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
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>por mês, sem fidelidade</div>
                    <span style={{ fontSize: 38, fontWeight: 900, color: "#0d1545" }}>R${p.precoMensal}</span>
                    <span style={{ fontSize: 13, color: "#64748b", marginLeft: 4 }}>/mês</span>
                  </div>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>no cartão em até</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>12x de</span>
                      <span style={{ fontSize: 36, fontWeight: 900, color: "#0d1545", lineHeight: 1 }}>R${p.parcelas}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: "#374151" }}>
                      ou R${p.precoAnualTotal} à vista ·{" "}
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>economize {p.economiaPorc}</span>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                  {p.qtd} ferramentas incluídas
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {p.itens.map((it) => (
                    <div key={it} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: p.cor, fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{it}</span>
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

          <p style={{ textAlign: "center", fontSize: 12, color: "#64748b", marginTop: 24 }}>
            Pagamento seguro via Kiwify · Boleto, cartão ou Pix · 7 dias de garantia incondicional
          </p>

          {/* Banner WhatsApp */}
          <div style={{
            marginTop: 40,
            background: "linear-gradient(135deg, #0d1545 0%, #111f4d 100%)",
            border: "1px solid #25D36630",
            borderRadius: 16,
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: "#25D36620", border: "2px solid #25D36640",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
              }}>💬</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#F5F6FF", marginBottom: 4 }}>
                  Ficou com alguma dúvida antes de assinar?
                </div>
                <div style={{ fontSize: 13, color: "#9BA3C2", lineHeight: 1.5 }}>
                  Fale com nosso suporte no WhatsApp — respondemos em minutos.
                </div>
              </div>
            </div>
            <a
              href="https://wa.me/5511957946737?text=Ol%C3%A1%2C%20gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20o%20GJ%20HUB%20Cont%C3%A1bil."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#25D366", color: "#fff", textDecoration: "none",
                padding: "13px 28px", borderRadius: 10,
                fontSize: 14, fontWeight: 800, flexShrink: 0,
                boxShadow: "0 4px 20px #25D36640",
                transition: "all 0.2s",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FAQ
      ══════════════════════════════════ */}
      <section id="faq" style={{ padding: "80px 0 64px" }}>
        <div className="lp">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#DF9F20", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>Antes de assinar</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#0d1545", lineHeight: 1.2 }}>
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
      <section style={{ padding: "64px 0 80px", background: "#eaf5fd" }}>
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
              <p style={{ marginTop: 18, fontSize: 12, color: "#d1d5e0" }}>
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
              <div style={{ fontSize: 11, color: "#ffffff80" }}>GJ Treinamentos Contábeis</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <Link href="/privacidade" style={{ fontSize: 12, color: "#ffffff99" }}>Política de Privacidade</Link>
              <Link href="/termos" style={{ fontSize: 12, color: "#ffffff99" }}>Termos de Uso</Link>
              <a href="mailto:contato@gjsolucoescontabeis.com.br" style={{ fontSize: 12, color: "#ffffff99" }}>contato@gjsolucoescontabeis.com.br</a>
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #ffffff10", textAlign: "center", fontSize: 11, color: "#ffffff60" }}>
            © {new Date().getFullYear()} GJ Hub Contábil. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}
