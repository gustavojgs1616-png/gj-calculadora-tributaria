import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { user_id, modo, total_questoes, corretas, erradas, em_branco, percentual, tempo_segundos, aprovado, por_area } = req.body;
  if (!user_id) return res.status(401).json({ error: "Não autorizado." });

  const { data, error } = await supabaseAdmin
    .from("simulados_historico")
    .insert({ user_id, modo, total_questoes, corretas, erradas, em_branco, percentual, tempo_segundos, aprovado, por_area })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
}
