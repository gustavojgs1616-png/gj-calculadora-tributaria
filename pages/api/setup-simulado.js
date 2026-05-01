import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // Cria tabela de histórico
    await supabaseAdmin.rpc("exec", { sql: "" }); // dummy
  } catch (_) {}

  // Tenta inserir para verificar se tabela existe
  const { error: checkError } = await supabaseAdmin
    .from("simulados_historico")
    .select("id")
    .limit(1);

  if (!checkError) {
    return res.status(200).json({ ok: true, message: "Tabela já existe." });
  }

  // Tabela não existe — criar via postgres direto
  const { error } = await supabaseAdmin.rpc("create_simulados_table");

  if (error) {
    // Tenta via query raw
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY }
    });
    return res.status(200).json({ message: "Use o SQL abaixo no Supabase SQL Editor", sql: CREATE_SQL });
  }

  return res.status(200).json({ ok: true });
}

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS simulados_historico (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  data_realizado timestamptz DEFAULT now(),
  modo text NOT NULL,
  total_questoes int NOT NULL,
  corretas int NOT NULL,
  erradas int NOT NULL,
  em_branco int NOT NULL,
  percentual int NOT NULL,
  tempo_segundos int,
  aprovado boolean NOT NULL,
  por_area jsonb
);
ALTER TABLE simulados_historico ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY usuario_le ON simulados_historico FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY usuario_insere ON simulados_historico FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;
