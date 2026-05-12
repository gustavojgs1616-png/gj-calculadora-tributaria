/**
 * Disparo único — oferta 20% para todos os usuários Free
 * GET /api/admin/disparo-free?secret=gj_disparo_2026
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM         = "GJ Hub Contábil <contato@gjtreinamentoscontabeis.com>";
const LINK_STARTER = "https://pay.kiwify.com.br/mE2zB5V";
const LINK_PLANOS  = "https://pro.gjtreinamentoscontabeis.com/page";

function emailOferta(nome) {
  const primeiroNome = (nome || "contador").split(" ")[0];
  return {
    subject: `${primeiroNome}, 20% de desconto no GJ Hub — válido por 48h ⏳`,
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

  <!-- Logo -->
  <tr>
    <td align="center" style="padding:0 0 16px 0;">
      <span style="font-size:13px;font-weight:bold;color:#5b67d8;letter-spacing:2px;text-transform:uppercase;">GJ HUB CONTÁBIL</span>
    </td>
  </tr>

  <!-- Header dourado -->
  <tr>
    <td bgcolor="#b45309" style="background-color:#b45309;border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
      <div style="font-size:42px;margin-bottom:14px;">🎁</div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:bold;margin:0 0 12px;line-height:1.3;font-family:Arial,Helvetica,sans-serif;">
        Oferta exclusiva para você, ${primeiroNome}
      </h1>
      <table cellpadding="0" cellspacing="0" border="0" align="center">
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:20px;padding:7px 24px;">
            <span style="color:#b45309;font-size:14px;font-weight:bold;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">🔥 20% DE DESCONTO · 48 HORAS</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Corpo branco -->
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:36px 40px;">

      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;">
        Você está no plano Free do GJ Hub Contábil e quero te dar uma oportunidade especial para desbloquear todas as ferramentas que os contadores mais usam no dia a dia.
      </p>

      <!-- Caixa da oferta -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td bgcolor="#fffbeb" style="background-color:#fffbeb;border-radius:12px;padding:28px 24px;text-align:center;border:2px solid #fbbf24;">
            <p style="color:#92400e;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;">Plano Starter — Primeiro mês</p>
            <p style="color:#9ca3af;font-size:16px;text-decoration:line-through;margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;">R$ 47/mês</p>
            <p style="color:#111827;font-size:44px;font-weight:bold;margin:0;line-height:1.1;font-family:Arial,Helvetica,sans-serif;">R$ 37,60<span style="font-size:16px;font-weight:normal;color:#6b7280;">/mês</span></p>
            <p style="color:#6b7280;font-size:14px;margin:12px 0 22px;font-family:Arial,Helvetica,sans-serif;">
              Use o cupom <strong style="color:#92400e;font-size:16px;letter-spacing:1px;">GJFREE20</strong> ao assinar
            </p>
            <a href="${LINK_STARTER}" style="display:inline-block;background-color:#d97706;color:#ffffff;font-size:16px;font-weight:bold;padding:15px 44px;border-radius:8px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">
              Assinar com 20% off →
            </a>
          </td>
        </tr>
      </table>

      <!-- O que inclui -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td bgcolor="#f8fafc" style="background-color:#f8fafc;border-radius:10px;padding:22px 24px;border:1px solid #e5e7eb;">
            <p style="color:#4f46e5;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;">✅ O que você desbloqueia no Starter</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;">🧮 <strong>Simulador Tributário</strong> — Simples vs Lucro Presumido vs Lucro Real com PDF</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;">📅 <strong>Calendário Fiscal</strong> — FGTS, DAS, IRRF, DCTF, PIS/COFINS e mais</p>
            <p style="color:#1f2937;font-size:14px;margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;">💼 <strong>Vagas de Contabilidade</strong> — LinkedIn, Catho, Indeed, Gupy e mais</p>
            <p style="color:#1f2937;font-size:14px;margin:0;font-family:Arial,Helvetica,sans-serif;">📰 <strong>Portal de Notícias</strong> — Legislação, CFC, Reforma Tributária em tempo real</p>
          </td>
        </tr>
      </table>

      <!-- Ver todos os planos -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <a href="${LINK_PLANOS}" style="color:#4f46e5;font-size:13px;font-family:Arial,Helvetica,sans-serif;text-decoration:underline;">
              Ver todos os planos (Pro e Elite) →
            </a>
          </td>
        </tr>
      </table>

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;">
        ⏳ Oferta válida por 48h · Sem fidelidade · Cancele quando quiser · 7 dias de garantia
      </p>

    </td>
  </tr>

  <!-- Rodapé -->
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
}

export default async function handler(req, res) {
  if (req.query.secret !== "gj_disparo_2026") {
    return res.status(401).json({ error: "Não autorizado." });
  }

  // 1. Busca todos os usuários que NÃO têm assinatura ativa/trial
  const { data: assinaturas } = await supabase
    .from("assinaturas")
    .select("email")
    .in("status", ["ativo", "trial"]);

  const emailsAssinantes = new Set((assinaturas || []).map(a => a.email?.toLowerCase()));

  // 2. Busca todos os usuários do auth (via admin API)
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 500 });
  if (usersError) return res.status(500).json({ error: usersError.message });

  // 3. Filtra apenas Free (não está na lista de assinantes)
  const freeUsers = users.filter(u => !emailsAssinantes.has(u.email?.toLowerCase()));

  const enviados = [];
  const erros = [];

  // 4. Envia para cada um com delay de 300ms para evitar rate limit
  for (const u of freeUsers) {
    const nome = u.user_metadata?.nome || u.user_metadata?.full_name || u.email?.split("@")[0] || "contador";
    const { subject, html } = emailOferta(nome);

    try {
      await resend.emails.send({ from: FROM, to: u.email, subject, html });
      enviados.push(u.email);
    } catch (e) {
      erros.push({ email: u.email, erro: e.message });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return res.status(200).json({
    ok: true,
    total_free: freeUsers.length,
    enviados: enviados.length,
    erros: erros.length,
    lista_enviados: enviados,
    lista_erros: erros,
  });
}
