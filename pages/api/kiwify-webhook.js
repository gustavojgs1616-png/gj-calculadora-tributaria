/**
 * Kiwify Webhook Handler — GJ Hub Contábil
 *
 * Payload real do Kiwify (campos com letra maiúscula):
 *   webhook_event_type  — tipo do evento
 *   Customer.email      — e-mail do cliente
 *   Customer.full_name  — nome completo
 *   Subscription.id     — ID da assinatura
 *   Subscription.plan.name      — nome do plano/oferta
 *   Subscription.plan.frequency — "monthly" | "yearly"
 *   checkout_link       — URL com código do checkout (usado p/ detectar plano)
 *   order_id            — ID do pedido
 *   subscription_id     — ID da assinatura (atalho)
 *
 * Eventos tratados:
 *   order_approved        → ativa plano + envia e-mail de boas-vindas
 *   subscription_renewed  → renova período
 *   subscription_canceled → cancela e rebaixa para Free
 *   order_refunded        → idem
 *   order_chargeback      → idem
 *   subscription_overdue  → marca como inadimplente (mantém acesso até expirar)
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { Resend } from "resend";

export const config = { api: { bodyParser: false } };

// ── Clientes ────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Mapeamento de checkout codes → plano / meses ────────────────────────────
// SOMENTE os 6 checkouts do produto "GJ Hub Contábil"
const CHECKOUT_PLANO = {
  NAhXR65:  { plano: "essencial",    meses: 12 }, // Essencial Anual
  mE2zB5V:  { plano: "essencial",    meses: 1  }, // Essencial Mensal
  "6Rppp7j":{ plano: "profissional", meses: 12 }, // Profissional Anual
  RBCmS4k:  { plano: "profissional", meses: 1  }, // Profissional Mensal
  xXQpNPy:  { plano: "especialista", meses: 12 }, // Especialista Anual
  GRNueqT:  { plano: "especialista", meses: 1  }, // Especialista Mensal
};

// Conjunto de checkout codes válidos (para lookup rápido)
const CHECKOUT_CODES_VALIDOS = new Set(Object.keys(CHECKOUT_PLANO));

// Palavras-chave que identificam o produto GJ Hub Contábil pelo nome
// (normalizado sem acentos para comparação segura)
const PALAVRAS_PRODUTO_HUB = ["gj hub contabil", "hub contabil", "gj hub"];

// Planos reconhecidos pelo nome da oferta (Simples Nacional dos nossos planos)
const PLANO_NOMES_VALIDOS = ["essencial", "profissional", "especialista"];

/**
 * Verifica se o evento é realmente do produto GJ Hub Contábil.
 * Usa três camadas de verificação (defense-in-depth):
 *   1. checkout_link contém um dos 6 códigos conhecidos → aprovado direto
 *   2. Nome do produto contém palavras-chave do Hub
 *   3. Nome do plano/oferta contém tipo (essencial/profissional/especialista)
 *      E periodicidade (mensal/anual)
 */
function isProdutoAutorizado(ev) {
  // 1. Checkout code reconhecido → definitivamente nosso produto
  const link = ev?.checkout_link || "";
  for (const code of CHECKOUT_CODES_VALIDOS) {
    if (link.includes(code)) return true;
  }

  // Helper: normaliza string (minúsculas + remove acentos)
  const norm = (s) =>
    (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // 2. Nome do produto contém palavras-chave do GJ Hub Contábil
  const nomeProduto = norm(
    ev?.Product?.name   ||
    ev?.product?.name   ||
    ev?.product_name    || ""
  );
  for (const palavra of PALAVRAS_PRODUTO_HUB) {
    if (nomeProduto.includes(palavra)) return true;
  }

  // 3. Nome do plano contém tipo reconhecido + periodicidade
  const nomePlano = norm(
    ev?.Subscription?.plan?.name ||
    ev?.Offer?.name              ||
    ev?.offer?.name              ||
    ev?.plan?.name               || ""
  );
  const temTipo = PLANO_NOMES_VALIDOS.some((p) => nomePlano.includes(p));
  const temFreq =
    nomePlano.includes("mensal")   ||
    nomePlano.includes("anual")    ||
    nomePlano.includes("monthly")  ||
    nomePlano.includes("yearly");
  if (temTipo && temFreq) return true;

  return false;
}

const PLANO_LABELS = {
  essencial:    { nome: "Essencial",    cor: "#22c55e", ferramentas: "Portal de Notícias, Simulador Tributário e Calendário Fiscal" },
  profissional: { nome: "Profissional", cor: "#818cf8", ferramentas: "tudo do Essencial + Consulta CNPJ, Gerador de Documentos e Calculadora de Honorários" },
  especialista: { nome: "Especialista", cor: "#DF9F20", ferramentas: "acesso completo a todas as 9 ferramentas do hub" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function lerBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function validarAssinatura(req, rawBody) {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  if (!secret) return true; // sem segredo configurado → aceita tudo

  const sig = req.query?.signature;
  if (!sig) return false;

  const hmac = crypto.createHmac("sha1", secret).update(rawBody).digest("hex");
  if (hmac.length !== sig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(sig));
}

/** Detecta plano e quantidade de meses a partir do payload Kiwify */
function detectarPlanoMeses(ev) {
  // 1. Pelo código embutido no checkout_link (mais confiável)
  const link = ev?.checkout_link || "";
  for (const [code, info] of Object.entries(CHECKOUT_PLANO)) {
    if (link.includes(code)) return info;
  }

  // 2. Pelo nome do plano/oferta (Subscription.plan.name)
  const nomePlano = (
    ev?.Subscription?.plan?.name ||
    ev?.Offer?.name ||
    ev?.offer?.name ||
    ev?.plan?.name ||
    ""
  ).toLowerCase();

  let plano = "essencial"; // padrão seguro
  if (nomePlano.includes("especialista")) plano = "especialista";
  else if (nomePlano.includes("profissional")) plano = "profissional";

  // 3. Periodicidade
  const freq = (ev?.Subscription?.plan?.frequency || "").toLowerCase();
  let meses = 1;
  if (
    freq.includes("year") || freq.includes("annual") ||
    nomePlano.includes("anual") || nomePlano.includes("yearly")
  ) {
    meses = 12;
  }

  console.warn(`[webhook] checkout_link não mapeado — plano=${plano} meses=${meses} link="${link}" nomePlano="${nomePlano}"`);
  return { plano, meses };
}

function expiracaoEm(meses) {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d.toISOString();
}

/** Upsert robusto: tenta update, se não existir faz insert */
async function salvarAssinatura(registro) {
  const { email } = registro;

  // Verifica se já existe registro para esse e-mail
  const { data: existente, error: errSelect } = await supabase
    .from("assinaturas")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (errSelect) {
    console.error("[webhook] erro ao buscar assinatura existente:", errSelect.message);
  }

  if (existente?.id) {
    const { error } = await supabase
      .from("assinaturas")
      .update(registro)
      .eq("email", email);
    if (error) console.error("[webhook] erro ao ATUALIZAR assinatura:", error.message, "email:", email);
    else console.log("[webhook] assinatura ATUALIZADA para", email);
    return !error;
  } else {
    const { error } = await supabase
      .from("assinaturas")
      .insert(registro);
    if (error) console.error("[webhook] erro ao INSERIR assinatura:", error.message, "email:", email);
    else console.log("[webhook] assinatura INSERIDA para", email);
    return !error;
  }
}

/** Busca o user_id do Supabase Auth para um e-mail (se já tiver conta) */
async function buscarUserId(email) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error || !data?.users) return null;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    return found?.id || null;
  } catch {
    return null;
  }
}

// ── E-mail de boas-vindas ────────────────────────────────────────────────────
async function enviarBoasVindas(email, nomeCliente, plano) {
  const info = PLANO_LABELS[plano] || PLANO_LABELS.essencial;
  const nome = (nomeCliente || "Contador(a)").split(" ")[0];
  const url  = "https://pro.gjtreinamentoscontabeis.com";

  const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#00031F;border:1px solid #E0E3FF18;border-radius:16px;padding:40px 32px;color:#E0E3FF;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:22px;font-weight:900;color:#F5F6FF;margin-bottom:4px;">GJ Hub Contábil</div>
    <div style="font-size:12px;color:#808CFF;">Hub do Contador</div>
  </div>
  <h2 style="font-size:20px;font-weight:800;color:#F5F6FF;margin-bottom:8px;">Bem-vindo(a), ${nome}! 🎉</h2>
  <p style="font-size:14px;color:#C8CBFF;line-height:1.7;margin-bottom:24px;">
    Sua assinatura do <strong style="color:${info.cor};">Plano ${info.nome}</strong> foi confirmada com sucesso.<br/>
    Você agora tem acesso a: <strong style="color:#F5F6FF;">${info.ferramentas}</strong>.
  </p>
  <div style="background:${info.cor}12;border:1px solid ${info.cor}30;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
    <div style="font-size:11px;font-weight:700;color:${info.cor};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Como acessar a plataforma</div>
    <ol style="font-size:13px;color:#C8CBFF;line-height:2.2;margin:0;padding-left:18px;">
      <li>Acesse <strong style="color:#F5F6FF;">${url}</strong></li>
      <li>Clique em <strong style="color:#F5F6FF;">"Criar conta gratuita"</strong></li>
      <li>Cadastre-se com <strong style="color:${info.cor};">${email}</strong></li>
      <li>Seu plano <strong style="color:${info.cor};">${info.nome}</strong> será ativado automaticamente!</li>
    </ol>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="background:${info.cor};color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;display:inline-block;">
      Acessar o GJ Hub Contábil →
    </a>
  </div>
  <p style="font-size:13px;color:#6670B8;line-height:1.7;margin-bottom:4px;">
    <strong style="color:#C8CBFF;">Importante:</strong> use exatamente o e-mail <strong style="color:${info.cor};">${email}</strong> ao criar sua conta.
  </p>
  <p style="font-size:13px;color:#6670B8;line-height:1.7;">Dúvidas? <strong style="color:#808CFF;">contato@gjtreinamentoscontabeis.com</strong></p>
  <hr style="border:none;border-top:1px solid #E0E3FF12;margin:28px 0;"/>
  <p style="font-size:11px;color:#6670B840;text-align:center;line-height:1.6;">
    &copy; 2025 GJ Treinamentos Contábeis — CNPJ 40.625.266/0001-44<br/>São Paulo/SP
  </p>
</div>`;

  try {
    await resend.emails.send({
      from: "GJ Hub Contábil <contato@gjtreinamentoscontabeis.com>",
      to: email,
      subject: `Bem-vindo(a) ao GJ Hub Contábil — Plano ${info.nome} ativado! 🎉`,
      html,
    });
    console.log("[webhook] e-mail de boas-vindas enviado →", email);
  } catch (err) {
    console.error("[webhook] erro ao enviar e-mail:", err.message);
  }
}

// ── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // 1. Lê body bruto (necessário para validar HMAC)
  const rawBody = await lerBody(req);

  // 2. Valida assinatura HMAC
  if (!validarAssinatura(req, rawBody)) {
    console.warn("[webhook] assinatura inválida:", req.query);
    return res.status(401).json({ error: "Assinatura inválida" });
  }

  // 3. Parse JSON
  let ev;
  try {
    ev = JSON.parse(rawBody);
  } catch {
    console.error("[webhook] body não é JSON:", rawBody.slice(0, 200));
    return res.status(400).json({ error: "JSON inválido" });
  }

  // 4. Extrai campos principais (Kiwify usa letras maiúsculas nos objetos)
  const tipo  = ev?.webhook_event_type || ev?.event || ev?.type || "";
  const email = (
    ev?.Customer?.email ||
    ev?.customer?.email ||
    ev?.buyer?.email    || ""
  ).toLowerCase().trim();

  const nome = (
    ev?.Customer?.full_name  ||
    ev?.Customer?.first_name ||
    ev?.customer?.name       ||
    ev?.buyer?.name          || ""
  ).trim();

  const kiwifySubId = ev?.Subscription?.id || ev?.subscription_id || null;
  const kiwifyOrdId = ev?.order_id || null;

  console.log(`[webhook] tipo="${tipo}" | email="${email}" | nome="${nome}" | orderId="${kiwifyOrdId}"`);

  if (!email) {
    console.error("[webhook] e-mail ausente. Chaves recebidas:", Object.keys(ev).join(", "));
    return res.status(400).json({ error: "e-mail ausente" });
  }

  // 5. Valida se o evento é do produto GJ Hub Contábil (barreira de segurança)
  if (!isProdutoAutorizado(ev)) {
    const nomeProd = ev?.Product?.name || ev?.product?.name || ev?.product_name || "desconhecido";
    console.warn(
      `[webhook] PRODUTO NÃO AUTORIZADO — ignorando "${tipo}" para "${email}". ` +
      `Produto: "${nomeProd}" | checkout_link: "${ev?.checkout_link || ""}"`
    );
    // Retorna 200 para Kiwify não ficar re-tentando o evento
    return res.status(200).json({ ok: true, aviso: "produto não autorizado para este webhook" });
  }

  // 6. Detecta plano e período a partir do checkout_link ou nome do plano
  const { plano, meses } = detectarPlanoMeses(ev);
  console.log(`[webhook] plano="${plano}" | meses=${meses}`);

  // ── COMPRA APROVADA ─────────────────────────────────────────────────────────
  if (["order_approved", "order.approved"].includes(tipo)) {
    const userId = await buscarUserId(email);

    const registro = {
      email,
      plano,
      status:                 "ativo",
      kiwify_subscription_id: kiwifySubId,
      kiwify_order_id:        kiwifyOrdId,
      data_inicio:            new Date().toISOString(),
      data_expiracao:         expiracaoEm(meses),
      updated_at:             new Date().toISOString(),
      ...(userId ? { user_id: userId } : {}),
    };

    const ok = await salvarAssinatura(registro);
    if (ok) await enviarBoasVindas(email, nome, plano);
    return res.status(200).json({ ok: true, evento: tipo, plano, meses });
  }

  // ── ASSINATURA RENOVADA ─────────────────────────────────────────────────────
  if (["subscription_renewed", "subscription.renewed"].includes(tipo)) {
    const userId = await buscarUserId(email);

    // Busca data_expiracao atual para renovar A PARTIR DA data vigente (não de hoje)
    const { data: atual } = await supabase
      .from("assinaturas")
      .select("data_expiracao")
      .eq("email", email)
      .maybeSingle();

    const baseExpiracao = atual?.data_expiracao && new Date(atual.data_expiracao) > new Date()
      ? new Date(atual.data_expiracao)
      : new Date();

    baseExpiracao.setMonth(baseExpiracao.getMonth() + meses);

    const registro = {
      email,
      plano,
      status:                 "ativo",
      kiwify_subscription_id: kiwifySubId,
      kiwify_order_id:        kiwifyOrdId,
      data_expiracao:         baseExpiracao.toISOString(),
      updated_at:             new Date().toISOString(),
      ...(userId ? { user_id: userId } : {}),
    };

    await salvarAssinatura(registro);
    console.log(`[webhook] renovação — plano ${plano} +${meses}m para ${email}`);
    return res.status(200).json({ ok: true, evento: tipo, plano, meses });
  }

  // ── CANCELAMENTO / REEMBOLSO / CHARGEBACK ──────────────────────────────────
  const isCancelamento = [
    "subscription_canceled", "subscription_cancelled",
    "subscription.canceled", "subscription.cancelled",
    "order_refunded",        "order.refunded",
    "order_chargeback",      "order.chargeback",
  ].includes(tipo);

  if (isCancelamento) {
    const { error } = await supabase
      .from("assinaturas")
      .update({ status: "cancelado", updated_at: new Date().toISOString() })
      .eq("email", email);

    if (error) console.error("[webhook] erro ao cancelar:", error.message);
    else console.log(`[webhook] cancelado (${tipo}) → ${email}`);
    return res.status(200).json({ ok: true, evento: tipo });
  }

  // ── INADIMPLÊNCIA (assinatura atrasada) ────────────────────────────────────
  if (["subscription_overdue", "subscription.overdue", "subscription_delayed"].includes(tipo)) {
    await supabase
      .from("assinaturas")
      .update({ status: "inadimplente", updated_at: new Date().toISOString() })
      .eq("email", email);

    console.log(`[webhook] inadimplente → ${email}`);
    return res.status(200).json({ ok: true, evento: tipo });
  }

  // ── Evento não tratado (não bloqueia, apenas loga) ─────────────────────────
  console.log(`[webhook] evento não tratado: "${tipo}" para ${email}`);
  return res.status(200).json({ ok: true, evento: tipo, aviso: "evento não tratado" });
}
