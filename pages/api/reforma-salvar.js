import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Limite mensal por plano
const LIMITES = { essencial: 0, profissional: 30, especialista: Infinity };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Autenticação via token Bearer
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Não autenticado" });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Token inválido" });

  const { dados, resultados, modoEdicao, simulacaoId } = req.body;
  if (!dados || !resultados) return res.status(400).json({ error: "Dados incompletos" });

  // ── Busca assinatura do usuário ──────────────────────────────────────────
  const { data: assinatura } = await supabaseAdmin
    .from("assinaturas")
    .select("plano, status")
    .eq("user_id", user.id)
    .in("status", ["ativo", "trial"])
    .maybeSingle();

  const plano = assinatura?.plano || "essencial";

  // Essencial não tem acesso
  if (plano === "essencial") {
    return res.status(403).json({ error: "Plano Essencial não inclui o Simulador da Reforma. Faça upgrade." });
  }

  // ── Verificação de quota (apenas profissional) ────────────────────────────
  if (plano === "profissional" && !modoEdicao) {
    const mes = new Date().toISOString().slice(0, 7); // "2026-04"

    const { data: quota } = await supabaseAdmin
      .from("quota_reforma")
      .select("count")
      .eq("user_id", user.id)
      .eq("mes", mes)
      .maybeSingle();

    const usado = quota?.count || 0;
    const limite = LIMITES.profissional;

    if (usado >= limite) {
      return res.status(429).json({
        error: "Limite mensal atingido",
        usado,
        limite,
        upgrade: true,
      });
    }

    // Incrementa quota
    await supabaseAdmin
      .from("quota_reforma")
      .upsert(
        { user_id: user.id, mes, count: usado + 1 },
        { onConflict: "user_id,mes" }
      );
  }

  // ── Salva ou atualiza simulação ──────────────────────────────────────────
  const registro = {
    user_id:      user.id,
    razao_social: dados.razaoSocial || "",
    cnpj:         dados.cnpj        || "",
    cnae:         dados.cnae        || "",
    uf:           dados.uf          || "",
    municipio:    dados.municipio   || "",
    regime:       dados.regime,
    dados:        dados,
    resultados:   resultados,
    updated_at:   new Date().toISOString(),
  };

  let resultado;
  if (modoEdicao && simulacaoId) {
    const { data, error } = await supabaseAdmin
      .from("simulacoes_reforma")
      .update(registro)
      .eq("id", simulacaoId)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    resultado = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from("simulacoes_reforma")
      .insert(registro)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    resultado = data;
  }

  return res.status(200).json({ ok: true, id: resultado.id });
}
