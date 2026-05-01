import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password, nome } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha obrigatórios." });
  }
  if (!nome || nome.trim().length < 2) {
    return res.status(400).json({ error: "Informe seu nome completo." });
  }

  // 1. Cria o usuário (sem precisar de confirmação de e-mail)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome: nome.trim() },
  });

  if (error) {
    console.error("[signup] createUser error:", error.message);
    if (
      error.message.includes("already registered") ||
      error.message.includes("already been registered") ||
      error.message.includes("User already registered")
    ) {
      return res.status(400).json({ error: "Este email já está cadastrado." });
    }
    return res.status(400).json({ error: error.message });
  }

  const userId = data.user.id;

  // 2. Verifica se o usuário já pagou antes de se cadastrar (compra antes do cadastro)
  const { data: assinaturaPaga } = await supabaseAdmin
    .from("assinaturas")
    .select("id, plano")
    .eq("email", email)
    .eq("status", "ativo")
    .maybeSingle();

  if (assinaturaPaga) {
    // Vincula o user_id à assinatura já existente — acesso imediato ao plano comprado
    const { error: vincError } = await supabaseAdmin
      .from("assinaturas")
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq("email", email)
      .eq("status", "ativo");

    if (vincError) console.error("[signup] vínculo assinatura erro:", vincError.message);
    else console.log(`[signup] assinatura ${assinaturaPaga.plano} vinculada ao user ${userId}`);

  } else {
    // 3. Sem compra prévia — cria trial de 3 dias Especialista
    const expiracao = new Date();
    expiracao.setDate(expiracao.getDate() + 3);

    const { error: trialError } = await supabaseAdmin
      .from("assinaturas")
      .upsert(
        {
          user_id: userId,
          email,
          plano: "especialista",
          status: "trial",
          data_inicio: new Date().toISOString(),
          data_expiracao: expiracao.toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (trialError) console.error("[signup] upsert trial error:", trialError.message);
  }

  return res.status(200).json({ user: data.user });
}
