import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Não autenticado" });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Token inválido" });

  const { busca = "" } = req.query;

  let query = supabaseAdmin
    .from("simulacoes_reforma")
    .select("id, razao_social, cnpj, cnae, uf, regime, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (busca) {
    query = query.ilike("razao_social", `%${busca}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Quota do mês atual
  const mes = new Date().toISOString().slice(0, 7);
  const { data: quota } = await supabaseAdmin
    .from("quota_reforma")
    .select("count")
    .eq("user_id", user.id)
    .eq("mes", mes)
    .maybeSingle();

  // Plano
  const { data: assinatura } = await supabaseAdmin
    .from("assinaturas")
    .select("plano, status")
    .eq("user_id", user.id)
    .in("status", ["ativo", "trial"])
    .maybeSingle();

  return res.status(200).json({
    simulacoes: data || [],
    quota: {
      usado: quota?.count || 0,
      limite: assinatura?.plano === "especialista" ? null : 30,
      plano:  assinatura?.plano || "essencial",
    },
  });
}
