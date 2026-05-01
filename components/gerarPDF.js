import { fmt, pct } from "./calculos";

export function gerarPDF({ empresa, faturamentoAnual, atividade, folha, custos, resultados, melhor, economia }) {
  const atividadeLabel = {
    comercio: "Comércio",
    industria: "Indústria",
    servicos: "Serviços",
    contabil: "Contábil / Jurídico",
  }[atividade] || atividade;

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const itensHTML = (itens) =>
    itens
      .map(
        (item) => `
      <tr>
        <td style="padding:6px 8px;color:#555;font-size:13px;">${item.label}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:600;color:#222;font-size:13px;">${fmt(item.valor)}</td>
      </tr>`
      )
      .join("");

  const cardRegime = (r) => `
    <div style="border:2px solid ${r.cor};border-radius:12px;padding:20px;margin-bottom:16px;background:#fafafa;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:18px;font-weight:700;color:${r.cor};">${r.regime}</span>
        <span style="background:${r.cor}22;color:${r.cor};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">
          ${pct(r.aliqEfetiva)} efetivo
        </span>
      </div>
      <div style="display:flex;gap:24px;margin-bottom:12px;">
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Imposto Anual</div>
          <div style="font-size:22px;font-weight:700;color:#222;">${fmt(r.anual)}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Imposto Mensal</div>
          <div style="font-size:22px;font-weight:700;color:#222;">${fmt(r.mensal)}</div>
        </div>
      </div>
      <div style="font-size:12px;color:#666;margin-bottom:12px;">${r.detalhe}</div>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;">
        <tbody>${itensHTML(r.itens)}</tbody>
      </table>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório Tributário — ${empresa || "GJ Hub Contábil"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; background: #fff; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body style="max-width:800px;margin:0 auto;padding:32px 24px;">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f5a623;padding-bottom:20px;margin-bottom:24px;">
    <div>
      <div style="font-size:22px;font-weight:800;color:#f5a623;">GJ Treinamentos Contábeis</div>
      <div style="font-size:13px;color:#888;margin-top:2px;">GJ Hub Contábil</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#888;">Emitido em</div>
      <div style="font-size:13px;font-weight:600;">${dataAtual}</div>
    </div>
  </div>

  <!-- Dados da simulação -->
  <div style="background:#f8f8f8;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
    <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Dados da Simulação</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div><span style="color:#888;font-size:12px;">Empresa:</span><br/><strong>${empresa || "Não informado"}</strong></div>
      <div><span style="color:#888;font-size:12px;">Atividade:</span><br/><strong>${atividadeLabel}</strong></div>
      <div><span style="color:#888;font-size:12px;">Faturamento Anual:</span><br/><strong>${fmt(faturamentoAnual)}</strong></div>
      <div><span style="color:#888;font-size:12px;">Faturamento Mensal:</span><br/><strong>${fmt(faturamentoAnual / 12)}</strong></div>
      <div><span style="color:#888;font-size:12px;">Folha de Pagamento Mensal:</span><br/><strong>${fmt(folha)}</strong></div>
      <div><span style="color:#888;font-size:12px;">Custos e Despesas Mensais:</span><br/><strong>${fmt(custos)}</strong></div>
    </div>
  </div>

  <!-- Regime recomendado -->
  <div style="background:linear-gradient(135deg,#f5a623,#c8831a);border-radius:12px;padding:20px 24px;margin-bottom:20px;color:#fff;">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.85;margin-bottom:6px;">Regime Mais Vantajoso</div>
    <div style="font-size:26px;font-weight:800;margin-bottom:4px;">${melhor.regime}</div>
    <div style="display:flex;gap:32px;margin-top:10px;">
      <div>
        <div style="font-size:11px;opacity:0.8;">Imposto Anual</div>
        <div style="font-size:20px;font-weight:700;">${fmt(melhor.anual)}</div>
      </div>
      <div>
        <div style="font-size:11px;opacity:0.8;">Imposto Mensal</div>
        <div style="font-size:20px;font-weight:700;">${fmt(melhor.mensal)}</div>
      </div>
      <div>
        <div style="font-size:11px;opacity:0.8;">Alíquota Efetiva</div>
        <div style="font-size:20px;font-weight:700;">${pct(melhor.aliqEfetiva)}</div>
      </div>
    </div>
  </div>

  <!-- Economia -->
  ${economia > 0 ? `
  <div style="background:#dcfce7;border:2px solid #22c55e;border-radius:10px;padding:14px 20px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
    <span style="font-size:24px;">💰</span>
    <div>
      <div style="font-size:13px;color:#166534;font-weight:600;">Economia em relação ao regime mais caro</div>
      <div style="font-size:22px;font-weight:800;color:#15803d;">${fmt(economia)} por ano</div>
      <div style="font-size:12px;color:#166534;">${fmt(economia / 12)} por mês</div>
    </div>
  </div>` : ""}

  <!-- Cards dos regimes -->
  <div style="margin-bottom:20px;">
    <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:14px;text-transform:uppercase;letter-spacing:1px;">Comparativo Detalhado</div>
    ${resultados.map(cardRegime).join("")}
  </div>

  <!-- Disclaimer -->
  <div style="border-top:1px solid #eee;padding-top:16px;font-size:11px;color:#999;line-height:1.6;">
    <strong>Aviso Legal:</strong> Este relatório tem finalidade exclusivamente informativa e educacional.
    Os valores apresentados são estimativas baseadas nas alíquotas vigentes e nos dados informados.
    Não substitui a análise de um contador habilitado. Consulte sempre um profissional contábil antes
    de tomar decisões tributárias. GJ Treinamentos Contábeis não se responsabiliza por decisões
    tomadas com base neste relatório.
  </div>

</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
}
