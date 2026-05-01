import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import { useAssinatura } from "../lib/AssinaturaContext";
import {
  TIPOS_RESCISAO,
  INSALUBRIDADE,
  calcularRescisao,
  calcTempoServico,
  calcDiasAvisoPrevio,
  fmt,
  SALARIO_MINIMO_2026,
} from "../lib/calculos_rescisao";

// ── Utilidade ────────────────────────────────────────────────────────────────
const hoje = () => new Date().toISOString().split("T")[0];

const STEPS = ["Vínculo", "Rescisão", "Remuneração", "Resultado"];

// ── Máscaras de input ────────────────────────────────────────────────────────
function maskCPF(v) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCNPJ(v) {
  return v.replace(/\D/g, "").slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/**
 * Converte string no formato "1.567,45" ou "1567.45" para number
 */
function parseBRL(str) {
  if (!str) return 0;
  const s = String(str).trim();
  // Remove pontos de milhar e troca vírgula decimal por ponto
  const clean = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

/**
 * Formata número como moeda BRL enquanto digita: "1567.45" → "1.567,45"
 */
function formatBRLInput(raw) {
  if (!raw && raw !== 0) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Hook para input de moeda brasileiro
 * Retorna [displayValue, setDisplayValue, numericValue]
 */
function useCurrencyInput(initial = "") {
  const [display, setDisplay] = useState(initial);
  const numeric = parseBRL(display);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setDisplay(""); return; }
    const num = parseInt(raw, 10) / 100;
    setDisplay(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  return [display, setDisplay, numeric, handleChange];
}

// ── Componente de Campo ──────────────────────────────────────────────────────
function Campo({ label, children, help }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {help && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{help}</div>}
    </div>
  );
}

// ── Step Indicator ───────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {STEPS.map((s, i) => {
        const ativo = i === step;
        const feito = i < step;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: feito ? "var(--green)" : ativo ? "var(--primary)" : "var(--bg-hover)",
                border: `2px solid ${feito ? "var(--green)" : ativo ? "var(--primary)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                color: (feito || ativo) ? "#fff" : "var(--muted)",
                flexShrink: 0,
                transition: "all 0.2s",
              }}>
                {feito ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: ativo ? 700 : 500,
                color: ativo ? "var(--primary)" : feito ? "var(--green)" : "var(--muted)",
                whiteSpace: "nowrap",
              }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 14, marginLeft: 6, marginRight: 6,
                background: feito ? "var(--green)" : "var(--border)",
                transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Card de Tipo de Rescisão ─────────────────────────────────────────────────
function TipoCard({ id, tipo, selecionado, onSelect }) {
  return (
    <button
      onClick={() => onSelect(id)}
      style={{
        width: "100%", textAlign: "left", padding: "16px 18px", borderRadius: 12, cursor: "pointer",
        background: selecionado ? `${tipo.cor}12` : "var(--bg-input)",
        border: `2px solid ${selecionado ? tipo.cor : "var(--border)"}`,
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{tipo.icone}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: selecionado ? tipo.cor : "var(--text)", marginBottom: 3 }}>
            {tipo.label}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>
            {tipo.desc}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {tipo.bullets.map((b, i) => (
              <span key={i} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 10,
                background: selecionado ? `${tipo.cor}18` : "var(--bg-hover)",
                color: selecionado ? tipo.cor : "var(--muted)",
                border: `1px solid ${selecionado ? tipo.cor + "40" : "transparent"}`,
              }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Linha de Tabela ──────────────────────────────────────────────────────────
function TabelaLinha({ descricao, valor, cor, obs, destaque }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "10px 0", borderBottom: "1px solid var(--border-soft)", gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: destaque ? "var(--text)" : "var(--text-dim)", fontWeight: destaque ? 700 : 400 }}>
          {descricao}
        </div>
        {obs && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{obs}</div>}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: cor || "var(--text)",
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {fmt(valor)}
      </div>
    </div>
  );
}

// ── PDF ──────────────────────────────────────────────────────────────────────
function gerarPDFRescisao(resultado, form) {
  const r = resultado;
  const tipo = r.tipo;
  const t = r.tempo;

  const tempoLabel = [
    t.anos > 0 ? `${t.anos} ano${t.anos > 1 ? "s" : ""}` : "",
    t.meses > 0 ? `${t.meses} mês${t.meses > 1 ? "es" : ""}` : "",
    t.dias > 0 ? `${t.dias} dia${t.dias > 1 ? "s" : ""}` : "",
  ].filter(Boolean).join(", ") || "Menos de 1 dia";

  const linhasProventos = r.proventos.map(p => `
    <tr>
      <td style="padding: 8px 12px; font-size: 12px; color: #374151;">${p.descricao}</td>
      <td style="padding: 8px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #111827;">${fmt(p.valor)}</td>
      ${p.obs ? `<td style="padding: 8px 12px; font-size: 10px; color: #6b7280;">${p.obs}</td>` : "<td></td>"}
    </tr>
  `).join("");

  const linhasDeducoes = r.deducoes.map(d => `
    <tr>
      <td style="padding: 8px 12px; font-size: 12px; color: #374151;">${d.descricao}</td>
      <td style="padding: 8px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #dc2626;">(${fmt(d.valor)})</td>
      <td style="padding: 8px 12px; font-size: 10px; color: #6b7280;">Base: ${fmt(d.base || 0)}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Termo de Rescisão — ${form.nomeEmpregado || "Colaborador"}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #fff; color: #111827; }
  .page { max-width: 780px; margin: 0 auto; padding: 40px 44px; }
  h1 { font-size: 20px; font-weight: 800; color: #111827; }
  h2 { font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
  .header { border-bottom: 3px solid #DF9F20; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
  .badge { background: #DF9F2015; border: 1px solid #DF9F2040; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: #B27F1A; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; background: #f9fafb; border-radius: 10px; padding: 16px 18px; border: 1px solid #e5e7eb; }
  .info-item label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 2px; }
  .info-item span { font-size: 13px; color: #111827; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #f3f4f6; }
  thead th { padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  thead th:last-child, thead th:nth-child(2) { text-align: right; }
  tbody tr:nth-child(even) { background: #fafafa; }
  .total-row td { border-top: 2px solid #e5e7eb; font-weight: 800; font-size: 14px; padding: 12px; }
  .section { margin-bottom: 24px; }
  .fgts-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
  .fgts-box h2 { color: #15803d; }
  .notas { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
  .notas p { font-size: 11px; color: #78350f; line-height: 1.6; margin-bottom: 4px; }
  .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; }
  .assinatura-linha { border-top: 1px solid #9ca3af; padding-top: 8px; }
  .assinatura-linha p { font-size: 11px; color: #6b7280; }
  .total-liquido { background: linear-gradient(135deg, #DF9F2012, #B27F1A08); border: 2px solid #DF9F2050; border-radius: 12px; padding: 16px 20px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
  .total-liquido .label { font-size: 14px; font-weight: 700; color: #374151; }
  .total-liquido .valor { font-size: 24px; font-weight: 800; color: #B27F1A; }
  .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">

  <!-- Cabeçalho -->
  <div class="header">
    <div>
      <h1>Cálculo de Rescisão Trabalhista</h1>
      <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
    </div>
    <div>
      <div class="badge">${tipo.icone} ${tipo.label}</div>
      <div style="font-size: 10px; color: #9ca3af; text-align: right; margin-top: 6px;">GJ Hub Contábil</div>
    </div>
  </div>

  <!-- Dados do Vínculo -->
  <div class="section">
    <h2>Dados do Vínculo Empregatício</h2>
    <div class="info-grid">
      <div class="info-item"><label>Empregado</label><span>${form.nomeEmpregado || "—"}</span></div>
      <div class="info-item"><label>CPF</label><span>${form.cpfEmpregado || "—"}</span></div>
      <div class="info-item"><label>Empresa</label><span>${form.nomeEmpresa || "—"}</span></div>
      <div class="info-item"><label>CNPJ</label><span>${form.cnpjEmpresa || "—"}</span></div>
      <div class="info-item"><label>Data de Admissão</label><span>${form.dataAdmissao ? new Date(form.dataAdmissao + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</span></div>
      <div class="info-item"><label>Data de Desligamento</label><span>${form.dataDesligamento ? new Date(form.dataDesligamento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</span></div>
      <div class="info-item"><label>Tempo de Serviço</label><span>${tempoLabel}</span></div>
      <div class="info-item"><label>Aviso Prévio</label><span>${r.diasAvisoPrevio} dias (${r.avisoPrevioTipo === "indenizado" ? "Indenizado" : r.avisoPrevioTipo === "trabalhado" ? "Trabalhado" : "Sem aviso"})</span></div>
      <div class="info-item"><label>Salário Base</label><span>${fmt(form.salarioBase)}</span></div>
      <div class="info-item"><label>Salário com Adicionais</label><span>${fmt(r.salarioTotal)}</span></div>
    </div>
  </div>

  <!-- Proventos -->
  <div class="section">
    <h2>Proventos</h2>
    <table>
      <thead>
        <tr>
          <th>Descrição</th>
          <th style="text-align:right">Valor</th>
          <th>Observação</th>
        </tr>
      </thead>
      <tbody>
        ${linhasProventos}
        <tr class="total-row">
          <td>Total de Proventos</td>
          <td style="text-align:right; color: #16a34a;">${fmt(r.totalProventos)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Deduções -->
  ${r.deducoes.length > 0 ? `
  <div class="section">
    <h2>Deduções</h2>
    <table>
      <thead>
        <tr>
          <th>Descrição</th>
          <th style="text-align:right">Valor</th>
          <th>Base de Cálculo</th>
        </tr>
      </thead>
      <tbody>
        ${linhasDeducoes}
        <tr class="total-row">
          <td>Total de Deduções</td>
          <td style="text-align:right; color: #dc2626;">(${fmt(r.totalDeducoes)})</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>` : ""}

  <!-- Total Líquido -->
  <div class="total-liquido">
    <div class="label">💰 Total Líquido a Receber</div>
    <div class="valor">${fmt(r.totalLiquido)}</div>
  </div>

  <!-- FGTS -->
  <div class="fgts-box">
    <h2 style="margin-bottom: 10px;">📦 FGTS</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div><label style="font-size:10px; color:#6b7280; display:block; margin-bottom:2px;">SALDO ATUAL FGTS</label><span style="font-size:13px; font-weight:600;">${fmt(form.saldoFGTS)}</span></div>
      <div><label style="font-size:10px; color:#6b7280; display:block; margin-bottom:2px;">DEPÓSITO RESCISÓRIO (8%)</label><span style="font-size:13px; font-weight:600;">${fmt(r.fgtsInfo.depositoRescisorio)}</span></div>
      <div><label style="font-size:10px; color:#6b7280; display:block; margin-bottom:2px;">MULTA FGTS (${r.fgtsInfo.multaPorcentagem}%)</label><span style="font-size:13px; font-weight:600; color:#15803d;">${fmt(r.fgtsInfo.multaFGTS)}</span></div>
      <div><label style="font-size:10px; color:#6b7280; display:block; margin-bottom:2px;">VALOR DISPONÍVEL P/ SAQUE</label><span style="font-size:13px; font-weight:600; color:#15803d;">${r.fgtsInfo.podeSacar ? fmt(r.fgtsInfo.multaFGTSSobre) + ` (${r.fgtsInfo.percentualSaque}%)` : "Bloqueado"}</span></div>
    </div>
  </div>

  <!-- Notas Legais -->
  <div class="notas">
    <h2 style="font-size:11px; color:#78350f; margin-bottom:8px;">⚠️ Notas Legais e Avisos</h2>
    <p>• Cálculo elaborado com base na CLT, Portaria Interministerial MPS/MF nº 13/2026 (INSS 2026) e tabela IRRF 2026.</p>
    <p>• IRRF 2026: isenção efetiva para rendimentos brutos até R$ 5.000/mês (redutor adicional).</p>
    <p>• Aviso prévio indenizado: isento de INSS conforme Súmula 479 TST.</p>
    <p>• Férias proporcionais na rescisão sem justa causa: isentas de IRRF conforme art. 146 CLT.</p>
    <p>• IRRF sobre 13º calculado separadamente conforme art. 700 do RIR/2018 (Decreto 9.580/2018).</p>
    <p>• Aviso prévio proporcional calculado conforme Lei 12.506/2011 (30 + 3 dias/ano, máx 90 dias).</p>
    ${tipo.seguroDesemprego ? "<p>• Empregado habilitado ao Seguro-Desemprego — verificar tempo de serviço mínimo exigido.</p>" : ""}
    <p>• Este documento tem caráter informativo. Recomenda-se validação por contador ou advogado trabalhista.</p>
  </div>

  <!-- Assinaturas -->
  <div class="assinaturas">
    <div>
      <div class="assinatura-linha">
        <p>${form.nomeEmpregado || "Empregado"}</p>
        <p>CPF: ${form.cpfEmpregado || "—"}</p>
      </div>
    </div>
    <div>
      <div class="assinatura-linha">
        <p>${form.nomeEmpresa || "Empregador / Empresa"}</p>
        <p>CNPJ: ${form.cnpjEmpresa || "—"}</p>
      </div>
    </div>
  </div>

  <div class="footer">
    Documento gerado pelo GJ Hub Contábil em ${new Date().toLocaleDateString("pt-BR")} — gjhubcontabil.com.br
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 300);
    };
  }
}

// ── Histórico ────────────────────────────────────────────────────────────────
const HISTORICO_KEY = "gj-rescisao-historico";

function carregarHistorico() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORICO_KEY) || "[]"); }
  catch { return []; }
}

function HistoricoVazio() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
        Nenhum cálculo salvo ainda
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>
        Faça um novo cálculo de rescisão para ele aparecer aqui.
      </div>
    </div>
  );
}

function CardHistorico({ item, onVer, onDeletar }) {
  const tipo = TIPOS_RESCISAO[item.tipoId] || {};
  const t = item.tempo || {};
  const tempoLabel = [
    t.anos > 0 ? `${t.anos}a` : "",
    t.meses > 0 ? `${t.meses}m` : "",
    t.dias > 0 ? `${t.dias}d` : "",
  ].filter(Boolean).join(" ") || "—";

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderLeft: `4px solid ${tipo.cor || "var(--border)"}`,
      borderRadius: 12, padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
    }}>
      {/* Ícone */}
      <div style={{ fontSize: 24, flexShrink: 0 }}>{tipo.icone || "📋"}</div>

      {/* Info principal */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
          {item.nomeEmpregado || "Colaborador sem nome"}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          {item.nomeEmpresa || "Empresa não informada"} · {tipo.label || item.tipoId}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 8,
            background: "var(--bg-hover)", color: "var(--muted)",
          }}>⏱ {tempoLabel} de serviço</span>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 8,
            background: "var(--bg-hover)", color: "var(--muted)",
          }}>📅 {item.dataDesligamento
            ? new Date(item.dataDesligamento + "T12:00:00").toLocaleDateString("pt-BR")
            : "—"}</span>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 8,
            background: "var(--bg-hover)", color: "var(--muted)",
          }}>🕐 {item.criadoEm
            ? new Date(item.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "—"}</span>
        </div>
      </div>

      {/* Total líquido */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Total líquido</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
          {fmt(item.totalLiquido || 0)}
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>
          Bruto: {fmt(item.totalProventos || 0)}
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={onVer}
          style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
            background: "var(--primary-glow)", border: "1px solid var(--primary)", color: "var(--primary)",
          }}
        >Ver →</button>
        <button
          onClick={onDeletar}
          style={{
            width: 34, height: 34, borderRadius: 8, fontSize: 14, cursor: "pointer",
            background: "transparent", border: "1px solid var(--border)", color: "var(--muted)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}
          title="Excluir"
        >🗑</button>
      </div>
    </div>
  );
}

// ── Página Principal ─────────────────────────────────────────────────────────
export default function RescisaoPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { pode } = useAssinatura();
  const [step, setStep] = useState(0);
  const [aba, setAba] = useState("calcular"); // "calcular" | "historico"
  const [historico, setHistorico] = useState([]);
  const resultadoRef = useRef(null);

  // Step 1 — Vínculo
  const [nomeEmpregado, setNomeEmpregado] = useState("");
  const [cpfEmpregado, setCpfEmpregado] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpjEmpresa, setCnpjEmpresa] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [dataDesligamento, setDataDesligamento] = useState(hoje());

  // Step 2 — Tipo
  const [tipoRescisao, setTipoRescisao] = useState("");

  // Step 3 — Remuneração (currency inputs)
  const [salarioBaseDisplay, setSalarioBaseDisplay, salarioBase, handleSalarioChange] = useCurrencyInput("");
  const [saldoFGTSDisplay, setSaldoFGTSDisplay, saldoFGTS, handleSaldoFGTSChange] = useCurrencyInput("");
  const [horasExtrasDisplay, setHorasExtrasDisplay, horasExtrasValor, handleHorasExtrasChange] = useCurrencyInput("");
  const [avisoPrevioTipo, setAvisoPrevioTipo] = useState("indenizado");
  const [dependentes, setDependentes] = useState(0);
  const [feriasVencidas, setFeriasVencidas] = useState(false);
  const [insalubridadeGrau, setInsalubridadeGrau] = useState("");
  const [periculosidade, setPericulosidade] = useState(false);

  // Resultado
  const [resultado, setResultado] = useState(null);
  const [formDataSalvo, setFormDataSalvo] = useState(null);
  const [erro, setErro] = useState("");

  // Dados calculados ao vivo (step 1)
  const tempoServico = dataAdmissao && dataDesligamento
    ? calcTempoServico(dataAdmissao, dataDesligamento)
    : null;
  const diasAviso = tempoServico ? calcDiasAvisoPrevio(tempoServico.anos) : null;
  const tipoObj = tipoRescisao ? TIPOS_RESCISAO[tipoRescisao] : null;

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

  // Redireciona se não tem acesso
  useEffect(() => {
    if (pode && !pode("rescisao")) router.replace("/assinatura");
  }, [pode, router]);

  // Carrega histórico do localStorage
  useEffect(() => {
    setHistorico(carregarHistorico());
  }, []);

  if (!user) return null;

  // ── Salvar no histórico ──
  const salvarHistorico = (res, form) => {
    const item = {
      id: Date.now(),
      criadoEm: new Date().toISOString(),
      // Identificação
      nomeEmpregado: form.nomeEmpregado,
      nomeEmpresa: form.nomeEmpresa,
      cpfEmpregado: form.cpfEmpregado,
      cnpjEmpresa: form.cnpjEmpresa,
      dataAdmissao: form.dataAdmissao,
      dataDesligamento: form.dataDesligamento,
      tipoId: res.tipoId,
      // Resumo financeiro
      salarioBase: res.salarioBase,
      salarioTotal: res.salarioTotal,
      totalProventos: res.totalProventos,
      totalDeducoes: res.totalDeducoes,
      totalLiquido: res.totalLiquido,
      totalINSS: res.totalINSS,
      totalIRRF: res.totalIRRF,
      // Tempo
      tempo: res.tempo,
      diasAvisoPrevio: res.diasAvisoPrevio,
      // FGTS
      fgtsInfo: res.fgtsInfo,
      // Tabelas para re-exibir
      proventos: res.proventos,
      deducoes: res.deducoes,
      // Form completo para re-exibição
      form,
    };
    const novo = [item, ...carregarHistorico()].slice(0, 50); // guarda até 50
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(novo));
    setHistorico(novo);
  };

  const deletarHistorico = (id) => {
    const novo = historico.filter(h => h.id !== id);
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(novo));
    setHistorico(novo);
  };

  const limparHistorico = () => {
    if (!window.confirm("Apagar todo o histórico de cálculos?")) return;
    localStorage.removeItem(HISTORICO_KEY);
    setHistorico([]);
  };

  // Abre um item do histórico no resultado
  const verHistoricoItem = (item) => {
    // Reconstrói o objeto resultado mínimo necessário para a tela de resultado
    const res = {
      tipo: TIPOS_RESCISAO[item.tipoId],
      tipoId: item.tipoId,
      tempo: item.tempo,
      diasAvisoPrevio: item.diasAvisoPrevio,
      avisoPrevioTipo: item.form?.avisoPrevioTipo || "indenizado",
      salarioBase: item.salarioBase,
      salarioTotal: item.salarioTotal,
      totalProventos: item.totalProventos,
      totalDeducoes: item.totalDeducoes,
      totalLiquido: item.totalLiquido,
      totalINSS: item.totalINSS,
      totalIRRF: item.totalIRRF,
      proventos: item.proventos || [],
      deducoes: item.deducoes || [],
      fgtsInfo: item.fgtsInfo || {},
    };
    setResultado(res);
    setFormDataSalvo(item.form || {
      nomeEmpregado: item.nomeEmpregado,
      nomeEmpresa: item.nomeEmpresa,
      cpfEmpregado: item.cpfEmpregado,
      cnpjEmpresa: item.cnpjEmpresa,
      dataAdmissao: item.dataAdmissao,
      dataDesligamento: item.dataDesligamento,
      salarioBase: item.salarioBase,
      saldoFGTS: item.fgtsInfo?.saldoFGTS || 0,
    });
    setStep(3);
    setAba("calcular");
    setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const podeCalcular = dataAdmissao && dataDesligamento && tipoRescisao && salarioBase;

  const calcular = () => {
    setErro("");
    if (!podeCalcular) { setErro("Preencha todos os campos obrigatórios."); return; }
    try {
      const tipo = TIPOS_RESCISAO[tipoRescisao];
      const aviso = !tipo.temAvisoPrevio ? "nenhum" : avisoPrevioTipo;
      const res = calcularRescisao({
        tipoRescisao,
        salarioBase,
        dataAdmissao,
        dataDesligamento,
        avisoPrevioTipo: aviso,
        saldoFGTS,
        dependentes: parseInt(dependentes) || 0,
        feriasVencidas,
        insalubridadeGrau: insalubridadeGrau || null,
        periculosidade,
        horasExtrasValor,
      });
      const fd = {
        nomeEmpregado, cpfEmpregado, nomeEmpresa, cnpjEmpresa,
        dataAdmissao, dataDesligamento,
        salarioBase, saldoFGTS,
        avisoPrevioTipo: aviso,
      };
      salvarHistorico(res, fd);
      setFormDataSalvo(fd);
      setResultado(res);
      setStep(3);
      setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setErro("Erro no cálculo: " + e.message);
    }
  };

  const formData = formDataSalvo || {
    nomeEmpregado, cpfEmpregado, nomeEmpresa, cnpjEmpresa,
    dataAdmissao, dataDesligamento,
    salarioBase, saldoFGTS,
  };

  const navBtn = {
    padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
  };

  return (
    <>
      <Head><title>Rescisão Trabalhista — GJ Hub Contábil</title></Head>
      <Layout user={user}>
        <div className="page-wrap" style={{ maxWidth: 860, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: "#818cf815", border: "1px solid #818cf830",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>⚖️</div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>
                  Calculadora de Rescisão Trabalhista
                </h1>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  Tabelas INSS e IRRF 2026 atualizadas · Lei 12.506/2011 · CLT
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 22, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
            {[
              { id: "calcular", label: "Novo Cálculo" },
              { id: "historico", label: `Histórico${historico.length > 0 ? ` (${historico.length})` : ""}` },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setAba(t.id)}
                style={{
                  padding: "9px 18px", borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", border: "none",
                  borderBottom: aba === t.id ? "2px solid var(--primary)" : "2px solid transparent",
                  background: aba === t.id ? "var(--primary-glow)" : "transparent",
                  color: aba === t.id ? "var(--primary)" : "var(--muted)",
                  transition: "all 0.15s",
                  marginBottom: -1,
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* ── ABA HISTÓRICO ── */}
          {aba === "historico" && (
            <div>
              {historico.length === 0 ? (
                <div className="card"><HistoricoVazio /></div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      {historico.length} cálculo{historico.length !== 1 ? "s" : ""} salvos localmente
                    </div>
                    <button
                      onClick={limparHistorico}
                      style={{
                        padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: "transparent", border: "1px solid var(--red)", color: "var(--red)",
                      }}
                    >Limpar tudo</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {historico.map(item => (
                      <CardHistorico
                        key={item.id}
                        item={item}
                        onVer={() => verHistoricoItem(item)}
                        onDeletar={() => deletarHistorico(item.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ABA CALCULAR ── */}
          {aba === "calcular" && <>

          {/* Step Bar */}
          <StepBar step={step} />

          {/* ── STEP 0: Vínculo ── */}
          {step === 0 && (
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--text)" }}>
                Dados do Vínculo Empregatício
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
                <Campo label="Nome do Empregado">
                  <input value={nomeEmpregado} onChange={e => setNomeEmpregado(e.target.value)} placeholder="Nome completo" />
                </Campo>
                <Campo label="CPF do Empregado">
                  <input
                    value={cpfEmpregado}
                    onChange={e => setCpfEmpregado(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    inputMode="numeric"
                  />
                </Campo>
                <Campo label="Nome da Empresa">
                  <input value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} placeholder="Razão social" />
                </Campo>
                <Campo label="CNPJ da Empresa">
                  <input
                    value={cnpjEmpresa}
                    onChange={e => setCnpjEmpresa(maskCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    inputMode="numeric"
                  />
                </Campo>
                <Campo label="Data de Admissão *">
                  <input type="date" value={dataAdmissao} onChange={e => setDataAdmissao(e.target.value)} max={dataDesligamento || hoje()} />
                </Campo>
                <Campo label="Data de Desligamento *">
                  <input type="date" value={dataDesligamento} onChange={e => setDataDesligamento(e.target.value)} min={dataAdmissao} max={hoje()} />
                </Campo>
              </div>

              {/* Preview tempo de serviço */}
              {tempoServico && dataAdmissao && (
                <div style={{
                  background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10,
                  padding: "14px 16px", marginBottom: 20,
                  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12,
                }}>
                  <div>
                    <div className="label">Tempo de serviço</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {tempoServico.anos > 0 ? `${tempoServico.anos}a ` : ""}
                      {tempoServico.meses > 0 ? `${tempoServico.meses}m ` : ""}
                      {tempoServico.dias}d
                    </div>
                  </div>
                  <div>
                    <div className="label">Aviso prévio proporcional</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
                      {diasAviso} dias
                    </div>
                  </div>
                  <div>
                    <div className="label">Salário mínimo 2026</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
                      {fmt(SALARIO_MINIMO_2026)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn-primary"
                  style={navBtn}
                  disabled={!dataAdmissao || !dataDesligamento}
                  onClick={() => setStep(1)}
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Tipo de Rescisão ── */}
          {step === 1 && (
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "var(--text)" }}>
                Tipo de Rescisão
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {Object.entries(TIPOS_RESCISAO).map(([id, tipo]) => (
                  <TipoCard
                    key={id}
                    id={id}
                    tipo={tipo}
                    selecionado={tipoRescisao === id}
                    onSelect={setTipoRescisao}
                  />
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <button className="btn-ghost" style={navBtn} onClick={() => setStep(0)}>← Voltar</button>
                <button
                  className="btn-primary"
                  style={navBtn}
                  disabled={!tipoRescisao}
                  onClick={() => setStep(2)}
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Remuneração ── */}
          {step === 2 && (
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--text)" }}>
                Remuneração e Detalhes
              </h2>

              {/* Tipo selecionado — info rápida */}
              {tipoObj && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  background: `${tipoObj.cor}10`, border: `1px solid ${tipoObj.cor}30`,
                  borderRadius: 10, marginBottom: 20,
                }}>
                  <span style={{ fontSize: 18 }}>{tipoObj.icone}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: tipoObj.cor }}>{tipoObj.label}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)", flex: 1 }}>— {tipoObj.desc}</span>
                </div>
              )}

              {/* Salário e FGTS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
                <Campo label="Salário Base (R$) *" help={`Mínimo 2026: ${fmt(SALARIO_MINIMO_2026)}`}>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      fontSize: 13, color: "var(--muted)", pointerEvents: "none",
                    }}>R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={salarioBaseDisplay}
                      onChange={handleSalarioChange}
                      placeholder="0,00"
                      style={{ paddingLeft: 34, textAlign: "right" }}
                    />
                  </div>
                </Campo>
                <Campo label="Saldo FGTS (R$)" help="Saldo total depositado na conta FGTS">
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      fontSize: 13, color: "var(--muted)", pointerEvents: "none",
                    }}>R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={saldoFGTSDisplay}
                      onChange={handleSaldoFGTSChange}
                      placeholder="0,00"
                      style={{ paddingLeft: 34, textAlign: "right" }}
                    />
                  </div>
                </Campo>
                <Campo label="Número de Dependentes">
                  <input
                    type="number" min="0" max="10"
                    value={dependentes}
                    onChange={e => setDependentes(e.target.value)}
                    placeholder="0"
                  />
                </Campo>
              </div>

              {/* Aviso Prévio */}
              {tipoObj?.temAvisoPrevio && (
                <div style={{ marginBottom: 20 }}>
                  <div className="label">Tipo de Aviso Prévio</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                      { v: "indenizado", l: "Indenizado pelo Empregador", desc: "Empregador paga os dias sem trabalhar" },
                      { v: "trabalhado", l: "Trabalhado", desc: "Empregado cumpre o período trabalhando" },
                    ].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setAvisoPrevioTipo(opt.v)}
                        style={{
                          flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                          background: avisoPrevioTipo === opt.v ? "var(--primary-glow)" : "var(--bg-input)",
                          border: `2px solid ${avisoPrevioTipo === opt.v ? "var(--primary)" : "var(--border)"}`,
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: avisoPrevioTipo === opt.v ? "var(--primary)" : "var(--text)" }}>{opt.l}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionais */}
              <div style={{ marginBottom: 20 }}>
                <div className="label" style={{ marginBottom: 10 }}>Adicionais Salariais</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>

                  {/* Insalubridade */}
                  <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>⚗️ Insalubridade</div>
                    <select
                      value={insalubridadeGrau}
                      onChange={e => setInsalubridadeGrau(e.target.value)}
                      style={{ fontSize: 13 }}
                    >
                      <option value="">Não se aplica</option>
                      {Object.entries(INSALUBRIDADE).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    {insalubridadeGrau && (
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                        +{fmt(SALARIO_MINIMO_2026 * INSALUBRIDADE[insalubridadeGrau].pct)} (sobre salário mínimo 2026)
                      </div>
                    )}
                  </div>

                  {/* Periculosidade */}
                  <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>⚡ Periculosidade (30%)</div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={periculosidade}
                        onChange={e => setPericulosidade(e.target.checked)}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Atividade perigosa (NR-16)</span>
                    </label>
                    {periculosidade && salarioBase > 0 && (
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                        +{fmt(salarioBase * 0.30)} (30% sobre salário base)
                      </div>
                    )}
                  </div>

                  {/* Férias vencidas */}
                  <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>🏖️ Férias Vencidas</div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={feriasVencidas}
                        onChange={e => setFeriasVencidas(e.target.checked)}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Possui 1 período de férias vencido</span>
                    </label>
                    {feriasVencidas && (
                      <div style={{ fontSize: 10, color: "var(--amber)", marginTop: 6 }}>
                        +1 período completo + 1/3 constitucional
                      </div>
                    )}
                  </div>

                  {/* Horas extras / banco */}
                  <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>⏰ Horas Extras / Banco</div>
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                        fontSize: 12, color: "var(--muted)", pointerEvents: "none",
                      }}>R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={horasExtrasDisplay}
                        onChange={handleHorasExtrasChange}
                        placeholder="0,00"
                        style={{ fontSize: 13, paddingLeft: 34, textAlign: "right" }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                      Valor a pagar de HE ou banco de horas
                    </div>
                  </div>
                </div>
              </div>

              {erro && (
                <div style={{ background: "#ef444415", border: "1px solid #ef444440", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
                  {erro}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <button className="btn-ghost" style={navBtn} onClick={() => setStep(1)}>← Voltar</button>
                <button
                  className="btn-primary"
                  style={{ ...navBtn, background: "linear-gradient(135deg, #818cf8, #6366f1)", boxShadow: "0 4px 20px #6366f140" }}
                  disabled={!salarioBase}
                  onClick={calcular}
                >
                  Calcular Rescisão ⚖️
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Resultado ── */}
          {step === 3 && resultado && (
            <div ref={resultadoRef}>

              {/* Header do resultado */}
              <div style={{
                background: `${resultado.tipo.cor}12`,
                border: `2px solid ${resultado.tipo.cor}40`,
                borderRadius: 14, padding: "18px 20px", marginBottom: 20,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{resultado.tipo.icone}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{resultado.tipo.label}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      {tempoServico && [
                        tempoServico.anos > 0 ? `${tempoServico.anos} ano${tempoServico.anos > 1 ? "s" : ""}` : "",
                        tempoServico.meses > 0 ? `${tempoServico.meses} mês${tempoServico.meses > 1 ? "es" : ""}` : "",
                        tempoServico.dias > 0 ? `${tempoServico.dias} dia${tempoServico.dias > 1 ? "s" : ""}` : "",
                      ].filter(Boolean).join(", ")} de serviço · {resultado.diasAvisoPrevio} dias de aviso
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>TOTAL LÍQUIDO</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>
                    {fmt(resultado.totalLiquido)}
                  </div>
                </div>
              </div>

              {/* Cards resumo */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Proventos Brutos", valor: resultado.totalProventos, cor: "var(--green)" },
                  { label: "Total INSS", valor: resultado.totalINSS, cor: "var(--red)" },
                  { label: "Total IRRF", valor: resultado.totalIRRF, cor: "var(--red)" },
                  { label: "Multa FGTS", valor: resultado.fgtsInfo.multaFGTS, cor: "var(--green)" },
                ].map((c, i) => (
                  <div key={i} className="card" style={{ padding: "14px 16px" }}>
                    <div className="label">{c.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: c.cor }}>{fmt(c.valor)}</div>
                  </div>
                ))}
              </div>

              {/* Tabela Proventos */}
              <div className="card" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                  📥 Proventos
                </h2>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>
                  Verbas a receber na rescisão
                </div>
                {resultado.proventos.map((p, i) => (
                  <TabelaLinha key={i} descricao={p.descricao} valor={p.valor} obs={p.obs} />
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: "2px solid var(--border)", marginTop: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>Total de Proventos</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: "var(--green)" }}>{fmt(resultado.totalProventos)}</span>
                </div>
              </div>

              {/* Tabela Deduções */}
              {resultado.deducoes.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                    📤 Deduções
                  </h2>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>
                    INSS progressivo (Portaria MPS/MF nº 13/2026) · IRRF 2026 com redutor adicional
                  </div>
                  {resultado.deducoes.map((d, i) => (
                    <TabelaLinha key={i} descricao={d.descricao} valor={d.valor} cor="var(--red)"
                      obs={d.base !== undefined ? `Base de cálculo: ${fmt(d.base)}` : undefined} />
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", borderTop: "2px solid var(--border)", marginTop: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>Total de Deduções</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: "var(--red)" }}>{fmt(resultado.totalDeducoes)}</span>
                  </div>
                </div>
              )}

              {/* Total Líquido destacado */}
              <div style={{
                background: "linear-gradient(135deg, var(--primary-glow), transparent)",
                border: "2px solid var(--primary)",
                borderRadius: 14, padding: "20px 24px", marginBottom: 16,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>💰 TOTAL LÍQUIDO A RECEBER</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Proventos − INSS − IRRF</div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "var(--primary)" }}>{fmt(resultado.totalLiquido)}</div>
              </div>

              {/* FGTS */}
              <div className="card" style={{ marginBottom: 20, borderColor: "#22c55e40" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--green)", marginBottom: 14 }}>
                  📦 FGTS
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  <div>
                    <div className="label">Saldo FGTS</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(saldoFGTS)}</div>
                  </div>
                  <div>
                    <div className="label">Depósito Rescisório (8%)</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{fmt(resultado.fgtsInfo.depositoRescisorio)}</div>
                  </div>
                  <div>
                    <div className="label">Multa FGTS ({resultado.fgtsInfo.multaPorcentagem}%)</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)" }}>{fmt(resultado.fgtsInfo.multaFGTS)}</div>
                  </div>
                  <div>
                    <div className="label">Disponível p/ Saque ({resultado.fgtsInfo.percentualSaque}%)</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: resultado.fgtsInfo.podeSacar ? "var(--green)" : "var(--red)" }}>
                      {resultado.fgtsInfo.podeSacar ? fmt(resultado.fgtsInfo.multaFGTSSobre) : "Bloqueado"}
                    </div>
                  </div>
                </div>
                {resultado.tipo.seguroDesemprego && (
                  <div style={{
                    marginTop: 14, padding: "8px 12px", background: "#22c55e12", border: "1px solid #22c55e30",
                    borderRadius: 8, fontSize: 12, color: "var(--green)",
                  }}>
                    ✅ Empregado habilitado ao <strong>Seguro-Desemprego</strong> — verificar tempo mínimo de vínculo exigido pelo MTE
                  </div>
                )}
              </div>

              {/* Notas legais */}
              <div style={{
                background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12,
                padding: "14px 16px", marginBottom: 24,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  ⚠️ Notas Legais
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    "Aviso prévio indenizado: isento de INSS (Súmula 479 TST)",
                    "Férias proporcionais na rescisão: isentas de IRRF (art. 146 CLT)",
                    "IRRF sobre 13º calculado separadamente (art. 700, Decreto 9.580/2018)",
                    "Aviso prévio proporcional: Lei 12.506/2011 — 30 + 3 dias/ano, máx 90 dias",
                    "Tabela INSS 2026: Portaria Interministerial MPS/MF nº 13/2026 (progressiva por faixa)",
                    "IRRF 2026: redutor adicional — isenção efetiva para rendimentos brutos ≤ R$ 5.000/mês",
                    "Este cálculo tem caráter informativo. Valide com contador/advogado.",
                  ].map((n, i) => (
                    <div key={i} style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--primary)", flexShrink: 0 }}>•</span>
                      {n}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  className="btn-ghost"
                  style={{ ...navBtn, flex: 1, minWidth: 140 }}
                  onClick={() => { setResultado(null); setFormDataSalvo(null); setStep(0); }}
                >
                  Novo Cálculo
                </button>
                <button
                  className="btn-ghost"
                  style={{ ...navBtn, flex: 1, minWidth: 140 }}
                  onClick={() => setAba("historico")}
                >
                  📋 Histórico
                </button>
                <button
                  className="btn-primary"
                  style={{ ...navBtn, flex: 2, minWidth: 180 }}
                  onClick={() => gerarPDFRescisao(resultado, formData)}
                >
                  📄 Gerar PDF
                </button>
              </div>
            </div>
          )}

          </> /* fim aba === "calcular" */}

        </div>
      </Layout>
    </>
  );
}
