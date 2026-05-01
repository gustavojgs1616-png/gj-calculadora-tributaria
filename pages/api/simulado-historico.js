import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { user_id } = req.query;
  if (!user_id) return res.status(401).json({ error: "Não autorizado." });

  const { data, error } = await supabaseAdmin
    .from("simulados_historico")
    .select("*")
    .eq("user_id", user_id)
    .order("data_realizado", { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
}
