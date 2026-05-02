import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabaseClient";
import { useAssinatura } from "../../lib/AssinaturaContext";
import { CNAES_REDUCAO_30, CNAES_REDUCAO_60, CNAES_REGIME_ESPECIFICO, UFS } from "../../lib/tax-engine/index.js";
import { calcularSimulacao } from "../../lib/tax-engine/index.js";

// ── Componentes auxiliares ──────────────────────────────────────────────────

function Stepper({ passo }) {
  const passos = ["Empresa", "Regime", "Faturamento", "Custos", "Cenário"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {passos.map((nome, i) => {
        const num = i + 1;
        const ativo = num === passo;
        const feito = num < passo;
        return (
          <div key={num} style={{ display: "flex", alignItems: "center", flex: i < 4 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: feito ? "#22c55e" : ativo ? "var(--primary)" : "var(--bg-input)",
                border: `2px solid ${feito ? "#22c55e" : ativo ? "var(--primary)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800,
                color: feito ? "#fff" : ativo ? "#fff" : "var(--muted)",
              }}>
                {feito ? "✓" : num}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: ativo ? "var(--primary)" : "var(--muted)", whiteSpace: "nowrap" }}>
                {nome}
              </span>
            </div>
            {i < 4 && (
              <div style={{
                flex: 1, height: 2, margin: "0 6px", marginBottom: 18,
                background: feito ? "#22c55e" : "var(--border)",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Campo({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
  background: "var(--bg-input)", border: "1px solid var(--border)",
  color: "var(--text)", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s",
};
const selectStyle = { ...inputStyle, cursor: "pointer" };

function SliderPct({ label, valor, onChange, hint }) {
  return (
    <Campo label={label} hint={hint}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input
          type="range" min="0" max="100" step="5" value={valor}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: "var(--primary)" }}
        />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", minWidth: 40, textAlign: "right" }}>
          {valor}%
        </span>
      </div>
    </Campo>
  );
}

function BtnPrimario({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
        background: disabled
          ? "var(--bg-input)"
          : "linear-gradient(135deg, #DF9F20, #B27F1A)",
        border: "none",
        color: disabled ? "var(--muted)" : "#000",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

const FORM_INICIAL = {
  // Passo 1
  razaoSocial:  "",
  cnpj:         "",
  cnae:         "",
  uf:           "",
  municipio:    "",
  // Passo 2
  regime:       "SIMPLES",
  anexo:        1,
  atividadeLP:  "comercio",
  margemLucro:  15,
  // Passo 3
  faturamentoMensal:      "",
  percentualMercadorias:  50,
  percentualServicos:     50,
  percentualClientesPJ:   50,
  percentualInterestadual: 10,
  // Passo 4
  custosMensais:      "",
  folhaMensal:        "",
  creditosAcumulados: "",
  temRegimeEspecifico: false,
  // Passo 5
  cenario:         "moderado",
  aplicarReducao60: false,
  aplicarReducao30: false,
};

export default function NovaSimulacao() {
  const router  = useRouter();
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [user, setUser]     = useState(null);
  const [passo, setPasso]   = useState(1);
  const [form, setForm]     = useState(FORM_INICIAL);
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [erroCNPJ, setErroCNPJ]         = useState("");
  const [salvando, setSalvando]         = useState(false);
  const [erroGeral, setErroGeral]       = useState("");

  // Flags de redução detectadas pelo CNAE
  const cnae4 = (form.cnae || "").slice(0, 4);
  const elegivel30 = CNAES_REDUCAO_30.includes(cnae4);
  const elegivel60 = CNAES_REDUCAO_60.includes(cnae4);
  const regimeEspecifico = CNAES_REGIME_ESPECIFICO.includes(cnae4);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setUser(session.user);
    });
  }, [router]);

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  // Sincroniza mercadorias/serviços (somam 100%)
  const setMercadorias = (v) => setForm(f => ({ ...f, percentualMercadorias: v, percentualServicos: 100 - v }));
  const setServicos    = (v) => setForm(f => ({ ...f, percentualServicos: v, percentualMercadorias: 100 - v }));

  // Busca CNPJ
  const buscarCNPJ = async () => {
    const cnpjLimpo = form.cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) { setErroCNPJ("CNPJ deve ter 14 dígitos."); return; }
    setBuscandoCNPJ(true);
    setErroCNPJ("");
    try {
      const r = await fetch(`/api/cnpj-consulta?cnpj=${cnpjLimpo}`);
      const d = await r.json();
      if (d.erro || d.error) { setErroCNPJ("CNPJ não encontrado."); return; }
      setForm(f => ({
        ...f,
        razaoSocial: d.razao_social || f.razaoSocial,
        cnae: d.cnae_principal?.codigo?.replace(/[^\d]/g, "").slice(0, 7) || f.cnae,
        uf: d.uf || f.uf,
        municipio: d.municipio || f.municipio,
      }));
    } catch {
      setErroCNPJ("Erro ao consultar CNPJ. Tente novamente.");
    } finally {
      setBuscandoCNPJ(false);
    }
  };

  const formatarCNPJ = (v) => {
    const n = v.replace(/\D/g, "").slice(0, 14);
    return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
            .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})/, "$1.$2.$3/$4")
            .replace(/^(\d{2})(\d{3})(\d{3})/, "$1.$2.$3")
            .replace(/^(\d{2})(\d{3})/, "$1.$2");
  };

  const validarPasso = () => {
    if (passo === 1) return form.razaoSocial.trim() && form.uf;
    if (passo === 2) return form.regime;
    if (passo === 3) return form.faturamentoMensal && Number(form.faturamentoMensal) > 0;
    return true;
  };

  const handleSimular = async () => {
    setSalvando(true);
    setErroGeral("");
    try {
      const dados = {
        ...form,
        faturamentoMensal:     Number(form.faturamentoMensal) || 0,
        custosMensais:         Number(form.custosMensais)     || 0,
        folhaMensal:           Number(form.folhaMensal)       || 0,
        creditosAcumulados:    Number(form.creditosAcumulados)|| 0,
        margemLucro:           (form.margemLucro || 15) / 100,
        percentualMercadorias: (form.percentualMercadorias || 50) / 100,
        percentualServicos:    (form.percentualServicos    || 50) / 100,
        percentualClientesPJ:  (form.percentualClientesPJ  || 50) / 100,
        percentualInterestadual: (form.percentualInterestadual || 0) / 100,
      };

      const resultados = calcularSimulacao(dados);

      // Salva via API
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch("/api/reforma-salvar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dados, resultados }),
      });
      const json = await r.json();

      if (!r.ok) {
        if (json.upgrade) {
          setErroGeral("Limite mensal atingido. Faça upgrade para o Especialista.");
        } else {
          setErroGeral(json.error || "Erro ao salvar simulação.");
        }
        return;
      }

      router.push(`/reforma/${json.id}`);
    } catch (e) {
      setErroGeral("Erro ao calcular simulação: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (!user || carregandoPlano) return null;
  if (!pode("reforma")) {
    router.replace("/reforma");
    return null;
  }

  return (
    <>
      <Head>
        <title>Nova Simulação — Reforma Tributária</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 680, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: 28 }}>
            <button onClick={() => passo > 1 ? setPasso(p => p - 1) : router.push("/reforma")} style={{
              background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
              fontSize: 13, padding: 0, marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
            }}>
              ← {passo > 1 ? "Passo anterior" : "Voltar às simulações"}
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Nova Simulação</h1>
            <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 13 }}>
              Impacto da Reforma Tributária (IBS/CBS) — LC 214/2025
            </p>
          </div>

          <Stepper passo={passo} />

          {/* Alerta regime específico */}
          {regimeEspecifico && (
            <div style={{
              background: "#f59e0b18", border: "1px solid #f59e0b40",
              borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13,
            }}>
              ⚠️ <strong style={{ color: "#f59e0b" }}>Regime específico detectado:</strong>
              {" "}O CNAE informado pode estar sujeito a regras diferenciadas na Reforma Tributária
              (combustíveis, financeiro, hotelaria, etc.). Os cálculos desta simulação são estimativos —
              consulte a regulamentação específica antes de apresentar ao cliente.
            </div>
          )}

          {/* Card do formulário */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "28px 28px",
          }}>

            {/* ──────────── PASSO 1: Empresa ──────────── */}
            {passo === 1 && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>
                  📋 Identificação da Empresa
                </h2>

                <Campo label="CNPJ (opcional — preenche dados automaticamente)">
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="text" value={form.cnpj}
                      onChange={e => set("cnpj", formatarCNPJ(e.target.value))}
                      placeholder="00.000.000/0001-00"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={buscarCNPJ} disabled={buscandoCNPJ} style={{
                      padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: "var(--primary-glow)", border: "1px solid var(--primary)",
                      color: "var(--primary)", cursor: "pointer", whiteSpace: "nowrap",
                    }}>
                      {buscandoCNPJ ? "..." : "Buscar"}
                    </button>
                  </div>
                  {erroCNPJ && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{erroCNPJ}</p>}
                </Campo>

                <Campo label="Razão Social *">
                  <input type="text" value={form.razaoSocial}
                    onChange={e => set("razaoSocial", e.target.value)}
                    placeholder="Nome da empresa"
                    style={inputStyle}
                  />
                </Campo>

                <Campo label="CNAE Principal" hint="Código CNAE (ex: 6920-1). Usado para detectar reduções de alíquota.">
                  <input type="text" value={form.cnae}
                    onChange={e => set("cnae", e.target.value.replace(/\D/g, "").slice(0, 7))}
                    placeholder="6920100"
                    style={inputStyle}
                  />
                  {elegivel30 && <p style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>✓ CNAE elegível para redução de 30% (profissional intelectual)</p>}
                  {elegivel60 && <p style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>✓ CNAE elegível para redução de 60% (saúde/educação/agro/transporte)</p>}
                </Campo>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                  <Campo label="UF *">
                    <select value={form.uf} onChange={e => set("uf", e.target.value)} style={selectStyle}>
                      <option value="">Selecione</option>
                      {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </Campo>
                  <Campo label="Município">
                    <input type="text" value={form.municipio}
                      onChange={e => set("municipio", e.target.value)}
                      placeholder="Ex: São Paulo"
                      style={inputStyle}
                    />
                  </Campo>
                </div>
              </>
            )}

            {/* ──────────── PASSO 2: Regime ──────────── */}
            {passo === 2 && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>
                  📁 Regime Tributário Atual
                </h2>

                <Campo label="Regime atual *">
                  {["SIMPLES", "LUCRO_PRESUMIDO", "LUCRO_REAL"].map(r => {
                    const labels = { SIMPLES: "Simples Nacional", LUCRO_PRESUMIDO: "Lucro Presumido", LUCRO_REAL: "Lucro Real" };
                    const ativo = form.regime === r;
                    return (
                      <div key={r} onClick={() => set("regime", r)} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "14px 16px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
                        background: ativo ? "var(--primary-glow)" : "var(--bg-input)",
                        border: `1px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%",
                          border: `2px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                          background: ativo ? "var(--primary)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {ativo && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                        </div>
                        <span style={{ fontWeight: ativo ? 700 : 500, color: ativo ? "var(--primary)" : "var(--text)" }}>
                          {labels[r]}
                        </span>
                      </div>
                    );
                  })}
                </Campo>

                {form.regime === "SIMPLES" && (
                  <Campo label="Anexo do Simples Nacional" hint="Consulte seu DAS ou contador para saber o anexo correto.">
                    <select value={form.anexo} onChange={e => set("anexo", Number(e.target.value))} style={selectStyle}>
                      <option value={1}>Anexo I — Comércio</option>
                      <option value={2}>Anexo II — Indústria</option>
                      <option value={3}>Anexo III — Serviços (fator r ≥ 28%)</option>
                      <option value={4}>Anexo IV — Serviços sem CPP</option>
                      <option value={5}>Anexo V — Serviços (fator r &lt; 28%)</option>
                    </select>
                  </Campo>
                )}

                {form.regime === "LUCRO_PRESUMIDO" && (
                  <Campo label="Atividade principal">
                    <select value={form.atividadeLP} onChange={e => set("atividadeLP", e.target.value)} style={selectStyle}>
                      <option value="comercio">Comércio (presunção IRPJ 8%)</option>
                      <option value="servicos">Serviços (presunção IRPJ 32%)</option>
                      <option value="industria">Indústria (presunção IRPJ 8%)</option>
                      <option value="misto">Misto — comércio + serviços</option>
                    </select>
                  </Campo>
                )}

                {form.regime === "LUCRO_REAL" && (
                  <Campo label={`Margem de lucro líquido estimada: ${form.margemLucro}%`}
                    hint="Percentual do lucro líquido sobre o faturamento bruto.">
                    <input type="range" min="2" max="60" step="1" value={form.margemLucro}
                      onChange={e => set("margemLucro", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--primary)" }}
                    />
                  </Campo>
                )}
              </>
            )}

            {/* ──────────── PASSO 3: Faturamento ──────────── */}
            {passo === 3 && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>
                  💰 Faturamento e Operação
                </h2>

                <Campo label="Faturamento mensal médio (R$) *" hint="Receita bruta mensal média dos últimos 12 meses.">
                  <input type="number" value={form.faturamentoMensal}
                    onChange={e => set("faturamentoMensal", e.target.value)}
                    placeholder="Ex: 50000"
                    min="0" style={inputStyle}
                  />
                  {form.faturamentoMensal > 0 && (
                    <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                      Anual: R$ {(form.faturamentoMensal * 12).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </p>
                  )}
                </Campo>

                <SliderPct label={`Receita com mercadorias: ${form.percentualMercadorias}%`}
                  valor={form.percentualMercadorias} onChange={setMercadorias}
                  hint="Reste o complemento é serviços." />
                <SliderPct label={`Receita com serviços: ${form.percentualServicos}%`}
                  valor={form.percentualServicos} onChange={setServicos} />

                <SliderPct label={`Clientes PJ (aproveitam crédito IBS/CBS): ${form.percentualClientesPJ}%`}
                  valor={form.percentualClientesPJ} onChange={v => set("percentualClientesPJ", v)}
                  hint="Relevante para avaliar vantagem do Simples Híbrido." />

                <SliderPct label={`Receita interestadual: ${form.percentualInterestadual}%`}
                  valor={form.percentualInterestadual} onChange={v => set("percentualInterestadual", v)}
                  hint="Proporção vendida para outros estados (impacta split do IBS no destino)." />
              </>
            )}

            {/* ──────────── PASSO 4: Custos ──────────── */}
            {passo === 4 && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>
                  🧾 Custos e Créditos
                </h2>

                <Campo label="Custos com fornecedores tributados — mensal (R$)"
                  hint="Base para crédito de IBS/CBS e PIS/COFINS (LR). Informe mercadorias, serviços e insumos.">
                  <input type="number" value={form.custosMensais}
                    onChange={e => set("custosMensais", e.target.value)}
                    placeholder="Ex: 20000"
                    min="0" style={inputStyle}
                  />
                </Campo>

                <Campo label="Folha de pagamento mensal (R$)" hint="Usado para análise do fator R no Simples.">
                  <input type="number" value={form.folhaMensal}
                    onChange={e => set("folhaMensal", e.target.value)}
                    placeholder="Ex: 10000"
                    min="0" style={inputStyle}
                  />
                </Campo>

                {form.regime === "LUCRO_REAL" && (
                  <Campo label="Créditos acumulados de PIS/COFINS (R$)"
                    hint="Saldo credor acumulado que pode ser compensado.">
                    <input type="number" value={form.creditosAcumulados}
                      onChange={e => set("creditosAcumulados", e.target.value)}
                      placeholder="Ex: 5000"
                      min="0" style={inputStyle}
                    />
                  </Campo>
                )}

                <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.temRegimeEspecifico}
                      onChange={e => set("temRegimeEspecifico", e.target.checked)}
                      style={{ marginTop: 2, accentColor: "var(--primary)" }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        Atividade com regime específico
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        Combustíveis, financeiro, planos de saúde, hotelaria, agências de viagem, Zona Franca de Manaus.
                        A simulação sinalizará no resultado.
                      </div>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* ──────────── PASSO 5: Cenário ──────────── */}
            {passo === 5 && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>
                  ⚙️ Configurações da Simulação
                </h2>

                <Campo label="Cenário de alíquotas"
                  hint="As alíquotas do IBS/CBS serão calibradas pelo Senado em 2027/2028. Este campo ajusta a estimativa.">
                  {[
                    { id: "conservador", label: "Conservador", desc: "Alíquota total 28%+ — cenário pessimista" },
                    { id: "moderado",    label: "Moderado",    desc: "Alíquota total 26,5% — referência atual (ANFIP)" },
                    { id: "otimista",    label: "Otimista",    desc: "Alíquota total 25% — calibragem favorável" },
                  ].map(c => {
                    const ativo = form.cenario === c.id;
                    return (
                      <div key={c.id} onClick={() => set("cenario", c.id)} style={{
                        padding: "12px 14px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
                        background: ativo ? "var(--primary-glow)" : "var(--bg-input)",
                        border: `1px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ativo ? "var(--primary)" : "var(--text)" }}>{c.label}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{c.desc}</div>
                      </div>
                    );
                  })}
                </Campo>

                {elegivel60 && (
                  <div style={{ background: "#22c55e12", border: "1px solid #22c55e40", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                      <input type="checkbox" checked={form.aplicarReducao60}
                        onChange={e => set("aplicarReducao60", e.target.checked)}
                        style={{ marginTop: 2, accentColor: "#22c55e" }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>
                          Aplicar redução de 60% (LC 214/2025, art. 19-20)
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          CNAE detectado como elegível (saúde, educação, transporte público ou agronegócio).
                          Alíquota IVA efetiva: ~10,6%.
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {elegivel30 && (
                  <div style={{ background: "#22c55e12", border: "1px solid #22c55e40", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                      <input type="checkbox" checked={form.aplicarReducao30}
                        onChange={e => set("aplicarReducao30", e.target.checked)}
                        style={{ marginTop: 2, accentColor: "#22c55e" }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>
                          Aplicar redução de 30% — Profissional intelectual (LC 214/2025, art. 21)
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          CNAE detectado como profissional regulamentado. Alíquota IVA efetiva: ~18,6%.
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {erroGeral && (
                  <div style={{ background: "#ef444418", border: "1px solid #ef4444", borderRadius: 8, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
                    {erroGeral}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navegação */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 12 }}>
            <button onClick={() => passo > 1 ? setPasso(p => p - 1) : router.push("/reforma")} style={{
              padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer",
            }}>
              ← Voltar
            </button>

            {passo < 5 ? (
              <BtnPrimario onClick={() => setPasso(p => p + 1)} disabled={!validarPasso()}>
                Próximo →
              </BtnPrimario>
            ) : (
              <BtnPrimario onClick={handleSimular} disabled={salvando}>
                {salvando ? "Calculando..." : "⚡ Simular Reforma"}
              </BtnPrimario>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
