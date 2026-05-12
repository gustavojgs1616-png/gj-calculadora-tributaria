/**
 * Teste — envia os 3 e-mails da régua de nurturing para um endereço
 * GET /api/admin/teste-nurturing?secret=gj_disparo_2026&email=contato@gjtreinamentoscontabeis.com
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM         = "GJ Hub Contábil <contato@gjtreinamentoscontabeis.com>";
const LINK_PLANOS  = "https://pro.gjtreinamentoscontabeis.com/assinatura";
const LINK_HUB     = "https://pro.gjtreinamentoscontabeis.com/home";
const LINK_STARTER = "https://pay.kiwify.com.br/mE2zB5V";

const NOME = "Gustavo";

// ── E-mail 1: Boas-vindas ────────────────────────────────────────────────────
const email1 = {
  subject: `${NOME}, seu acesso ao GJ Hub Contábil está ativo 🎉`,
  html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bem-vindo ao GJ Hub Contábil</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <tr>
    <td align="center" style="padding:0 0 16px 0;">
      <span style="font-size:13px;font-weight:bold;color:#5b67d8;letter-spacing:2px;text-transform:uppercase;">GJ HUB CONTÁBIL</span>
    </td>
  </tr>
  <tr>
    <td bgcolor="#4f46e5" style="background-color:#4f46e5;border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
      <div style="font-size:40px;margin-bottom:14px;">🚀</div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:bold;margin:0 0 8px;line-height:1.3;font-family:Arial,Helvetica,sans-serif;">Bem-vindo ao GJ Hub Contábil!</h1>
      <p style="color:#c7d2fe;font-size:14px;margin:0;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">Seu acesso gratuito está ativo. Explore à vontade.</p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 40px;">
      <p style="color:#111827;font-size:16px;font-weight:bold;margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;">Olá, ${NOME}! 👋</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;">
        Você agora tem acesso ao <strong style="color:#111827;">Portal de Notícias Contábeis</strong> — atualizado diariamente com tudo que muda na legislação tributária, fiscal e trabalhista brasileira.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td bgcolor="#f0fdf4" style="background-color:#f0fdf4;border-radius:10px;padding:18px 20px;border-left:4px solid #16a34a;">
            <p style="color:#15803d;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;">✅ Disponível no seu plano Free</p>
            <p style="color:#1f2937;font-size:14px;margin:0;font-family:Arial,Helvetica,sans-serif;">📰 <strong>Portal de Notícias</strong> — Legislação, Simples Nacional, CFC, Reforma Tributária</p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td bgcolor="#fffbeb" style="background-color:#fffbeb;border-radius:10px;padding:18px 20px;border-left:4px solid #d97706;">
            <p style="color:#92400e;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;">🔒 Desbloqueie com um plano pago</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 7px;font-family:Arial,Helvetica,sans-serif;">📊 Simulador Tributário — Simples vs Lucro Presumido vs Lucro Real</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 7px;font-family:Arial,Helvetica,sans-serif;">📄 Gerador de Documentos — Contratos, Declarações, Propostas em PDF</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 7px;font-family:Arial,Helvetica,sans-serif;">👔 Rescisão Trabalhista — Cálculo completo com FGTS e IRRF</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 7px;font-family:Arial,Helvetica,sans-serif;">🔄 Simulador da Reforma Tributária — IBS + CBS</p>
            <p style="color:#1f2937;font-size:14px;margin:0;font-family:Arial,Helvetica,sans-serif;">🎓 Simulado CFC · Cálculo do ICMS-ST · Simulador IRPF</p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <a href="${LINK_HUB}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:bold;padding:15px 40px;border-radius:8px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">
              Acessar o Hub →
            </a>
          </td>
        </tr>
      </table>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;">
        Qualquer dúvida, basta responder este e-mail.
      </p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#f9fafb" style="background-color:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0;font-family:Arial,Helvetica,sans-serif;">GJ Hub Contábil · GJ Treinamentos Contábeis</p>
      <p style="color:#6b7280;font-size:12px;margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;">contato@gjtreinamentoscontabeis.com</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
};

// ── E-mail 2: Dia 3 ──────────────────────────────────────────────────────────
const email2 = {
  subject: `${NOME}, veja como outros contadores estão economizando 2h por dia`,
  html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>3 ferramentas que contadores usam todo dia</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <tr>
    <td align="center" style="padding:0 0 16px 0;">
      <span style="font-size:13px;font-weight:bold;color:#5b67d8;letter-spacing:2px;text-transform:uppercase;">GJ HUB CONTÁBIL</span>
    </td>
  </tr>
  <tr>
    <td bgcolor="#4f46e5" style="background-color:#4f46e5;border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
      <div style="font-size:40px;margin-bottom:14px;">⏱️</div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:bold;margin:0 0 8px;line-height:1.3;font-family:Arial,Helvetica,sans-serif;">3 ferramentas que contadores usam todo dia</h1>
      <p style="color:#c7d2fe;font-size:14px;margin:0;font-family:Arial,Helvetica,sans-serif;">Disponíveis agora no GJ Hub Contábil</p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 40px;">
      <p style="color:#111827;font-size:16px;font-weight:bold;margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;">Olá, ${NOME}!</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;">
        Já faz 3 dias que você está no hub. Quero te mostrar o que os contadores que assinam estão usando no dia a dia para trabalhar mais rápido:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
        <tr>
          <td bgcolor="#f9fafb" style="background-color:#f9fafb;border-radius:10px;padding:20px 22px;border:1px solid #e5e7eb;border-left:4px solid #16a34a;">
            <p style="color:#15803d;font-size:14px;font-weight:bold;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">📊 Simulador Tributário</p>
            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif;">Insere o faturamento do cliente e o sistema calcula automaticamente a carga no Simples Nacional, Lucro Presumido e Lucro Real — e aponta qual é o mais vantajoso. Gera histórico de simulações.</p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
        <tr>
          <td bgcolor="#f9fafb" style="background-color:#f9fafb;border-radius:10px;padding:20px 22px;border:1px solid #e5e7eb;border-left:4px solid #0891b2;">
            <p style="color:#0e7490;font-size:14px;font-weight:bold;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">📄 Gerador de Documentos</p>
            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif;">Preenche um formulário e gera em PDF: contratos de prestação de serviços, procurações, declarações de faturamento, pró-labore, propostas comerciais e recibos de honorários. Sem Word, sem perda de tempo.</p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td bgcolor="#f9fafb" style="background-color:#f9fafb;border-radius:10px;padding:20px 22px;border:1px solid #e5e7eb;border-left:4px solid #4f46e5;">
            <p style="color:#4338ca;font-size:14px;font-weight:bold;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">👔 Rescisão Trabalhista</p>
            <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;font-family:Arial,Helvetica,sans-serif;">Calcula todas as verbas rescisórias — saldo de salário, 13º, férias + 1/3, FGTS, INSS e IRRF — com tabelas 2025 atualizadas. Gera o Termo de Rescisão em PDF na hora.</p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <a href="${LINK_PLANOS}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:bold;padding:15px 40px;border-radius:8px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">
              Ver planos e preços →
            </a>
          </td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:13px;text-align:center;margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;">
        Plano Starter a partir de R$ 47/mês · Cancele quando quiser
      </p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#f9fafb" style="background-color:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0;font-family:Arial,Helvetica,sans-serif;">GJ Hub Contábil · GJ Treinamentos Contábeis</p>
      <p style="color:#6b7280;font-size:12px;margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;">contato@gjtreinamentoscontabeis.com</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
};

// ── E-mail 3: Dia 7 — Oferta ─────────────────────────────────────────────────
const email3 = {
  subject: `${NOME}, 20% de desconto — oferta válida por 48h ⏳`,
  html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Oferta especial — 20% de desconto</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <tr>
    <td align="center" style="padding:0 0 16px 0;">
      <span style="font-size:13px;font-weight:bold;color:#5b67d8;letter-spacing:2px;text-transform:uppercase;">GJ HUB CONTÁBIL</span>
    </td>
  </tr>
  <tr>
    <td bgcolor="#b45309" style="background-color:#b45309;border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
      <div style="font-size:40px;margin-bottom:14px;">🎁</div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:bold;margin:0 0 12px;line-height:1.3;font-family:Arial,Helvetica,sans-serif;">Oferta especial para você, ${NOME}</h1>
      <table cellpadding="0" cellspacing="0" border="0" align="center">
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:20px;padding:6px 22px;">
            <span style="color:#b45309;font-size:13px;font-weight:bold;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">🔥 20% DE DESCONTO · 48 HORAS</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 40px;">
      <p style="color:#111827;font-size:16px;font-weight:bold;margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;">Olá, ${NOME}!</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;">
        Você está há 7 dias no GJ Hub Contábil e quero te dar uma oportunidade especial para conhecer tudo que a plataforma pode oferecer ao seu escritório.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td bgcolor="#fffbeb" style="background-color:#fffbeb;border-radius:12px;padding:28px 24px;text-align:center;border:2px solid #fbbf24;">
            <p style="color:#92400e;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;">Plano Starter — Primeiro mês</p>
            <p style="color:#9ca3af;font-size:16px;margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;"><s>R$ 47/mês</s></p>
            <p style="color:#111827;font-size:42px;font-weight:bold;margin:0 0 4px;line-height:1.1;font-family:Arial,Helvetica,sans-serif;">R$ 37,60<span style="font-size:16px;font-weight:normal;color:#6b7280;">/mês</span></p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;">
              Use o cupom <strong style="color:#92400e;font-size:15px;letter-spacing:1px;">GJFREE20</strong> ao assinar
            </p>
            <a href="${LINK_STARTER}" style="display:inline-block;background-color:#d97706;color:#ffffff;font-size:15px;font-weight:bold;padding:15px 40px;border-radius:8px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">
              Assinar com 20% off →
            </a>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
        <tr>
          <td bgcolor="#f8fafc" style="background-color:#f8fafc;border-radius:10px;padding:20px 22px;border:1px solid #e5e7eb;">
            <p style="color:#4f46e5;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;">✅ O que você desbloqueia no Starter</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">📊 Simulador Tributário completo</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">📅 Calendário Fiscal com alertas</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;">🔍 Consulta Fiscal (CNPJ, NCM, CFOP, CST)</p>
            <p style="color:#1f2937;font-size:14px;margin:0;font-family:Arial,Helvetica,sans-serif;">📰 Portal de Notícias Contábeis</p>
          </td>
        </tr>
      </table>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;">
        ⏳ Oferta válida por 48h · Sem fidelidade · Cancele quando quiser · 7 dias de garantia
      </p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#f9fafb" style="background-color:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0;font-family:Arial,Helvetica,sans-serif;">GJ Hub Contábil · GJ Treinamentos Contábeis</p>
      <p style="color:#6b7280;font-size:12px;margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;">contato@gjtreinamentoscontabeis.com</p>
      <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;">Você recebe este e-mail por ser cadastrado no GJ Hub Contábil.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`,
};

export default async function handler(req, res) {
  if (req.query.secret !== "gj_disparo_2026") {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const destino = req.query.email || "contato@gjtreinamentoscontabeis.com";
  const resultados = [];

  const emails = [
    { id: "D+1 — Boas-vindas", ...email1 },
    { id: "D+3 — Ferramentas", ...email2 },
    { id: "D+7 — Oferta 20%", ...email3 },
  ];

  for (const e of emails) {
    try {
      await resend.emails.send({ from: FROM, to: destino, subject: e.subject, html: e.html });
      resultados.push({ id: e.id, ok: true });
    } catch (err) {
      resultados.push({ id: e.id, ok: false, erro: err.message });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  return res.status(200).json({ ok: true, destino, resultados });
}
