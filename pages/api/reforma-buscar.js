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

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID obrigatório" });

  const { data, error } = await supabaseAdmin
    .from("simulacoes_reforma")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return res.status(404).json({ error: "Simulação não encontrada" });

  return res.status(200).json({ simulacao: data });
}
