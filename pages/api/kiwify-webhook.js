import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const config = { api: { bodyParser: false } };

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function lerBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function validarAssinatura(rawBody, signature) {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret configurado, passa (dev)
  if (!signature) return false;
  const hmac = crypto.createHmac("sha1", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

function detectarPlano(nomeProduto = "") {
  const n = nomeProduto.toLowerCase();
  if (n.includes("especialista")) return "especialista";
  if (n.includes("profissional")) return "profissional";
  return "essencial";
}

function calcularExpiracao(meses = 12) {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return d.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await lerBody(req);

  const signature = req.headers["x-kiwify-signature"] || req.headers["x-webhook-signature"] || "";
  if (!validarAssinatura(rawBody, signature)) {
    return res.status(401).json({ error: "Assinatura inválida" });
  }

  let evento;
  try {
    evento = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "JSON inválido" });
  }

  const tipo  = evento?.event || evento?.type;
  const dados = evento?.data  || evento;

  const email       = dados?.customer?.email || dados?.buyer?.email;
  const nomeProduto = dados?.product?.name   || dados?.plan?.name || "";
  const kiwifySubId = dados?.subscription?.id || dados?.id || null;
  const kiwifyOrdId = dados?.id || null;

  if (!email) return res.status(400).json({ error: "email ausente" });

  const plano = detectarPlano(nomeProduto);

  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const usuario = users?.users?.find((u) => u.email === email);
  const userId  = usuario?.id || null;

  if (["order.approved", "subscription.active", "subscription.renewed"].includes(tipo)) {
    await supabaseAdmin.from("assinaturas").upsert(
      {
        user_id:                userId,
        email,
        plano,
        status:                 "ativo",
        kiwify_subscription_id: kiwifySubId,
        kiwify_order_id:        kiwifyOrdId,
        data_inicio:            new Date().toISOString(),
        data_expiracao:         calcularExpiracao(12),
        updated_at:             new Date().toISOString(),
      },
      { onConflict: "email" }
    );
  }

  if (["subscription.cancelled", "subscription.inactive", "subscription.expired"].includes(tipo)) {
    await supabaseAdmin
      .from("assinaturas")
      .update({ status: "cancelado", updated_at: new Date().toISOString() })
      .eq("email", email);
  }

  return res.status(200).json({ ok: true });
}
