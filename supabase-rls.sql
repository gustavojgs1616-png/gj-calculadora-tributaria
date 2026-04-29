-- ═══════════════════════════════════════════════════════
-- RLS — Tabela assinaturas
-- Cole isso no SQL Editor do Supabase e clique em Run
-- ═══════════════════════════════════════════════════════

-- 1. Ativar RLS na tabela
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

-- 2. Usuário só vê a própria assinatura
CREATE POLICY "usuario_le_propria_assinatura"
ON assinaturas
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Usuário não pode inserir/alterar diretamente (só via service_role)
CREATE POLICY "apenas_service_role_escreve"
ON assinaturas
FOR ALL
USING (false)
WITH CHECK (false);

-- Obs: o webhook usa o cliente supabaseAdmin (service_role),
-- que ignora RLS e consegue escrever normalmente.
