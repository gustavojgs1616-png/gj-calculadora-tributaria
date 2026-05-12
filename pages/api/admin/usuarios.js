/**
 * API Admin — Gestão de Usuários
 * Acesso exclusivo: gustavo_jgs@hotmail.com
 *
 * GET  /api/admin/usuarios  → lista TODOS os usuários (pagos + free sem assinatura)
 * PATCH /api/admin/usuarios → atualiza plano/status/expiracao
 */

import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "gustavo_jgs@hotmail.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verificarAdmin(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  if (user.email !== ADMIN_EMAIL) return null;
  return user;
}

export default async function handler(req, res) {
  const admin = await verificarAdmin(req);
  if (!admin) return res.status(403).json({ error: "Acesso negado." });

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === "GET") {

    // 1. Todas as assinaturas
    const { data: assinaturas, error: errAss } = await supabase
      .from("assinaturas")
      .select("*")
      .order("created_at", { ascending: false });
    if (errAss) return res.status(500).json({ error: errAss.message });

    // 2. Todos os usuários do Auth
    let authUsers = [];
    try {
      const { data: authData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      authUsers = authData?.users || [];
    } catch (_) {}

    // 3. Mapas auxiliares
    const idsComAssinatura = new Set(
      assinaturas.filter((a) => a.user_id).map((a) => a.user_id)
    );
    const emailsComAssinatura = new Set(
      assinaturas.map((a) => a.email?.toLowerCase()).filter(Boolean)
    );

    // Mapa id → dados do Auth (nome + último acesso)
    const authMap = {};
    authUsers.forEach((u) => {
      authMap[u.id] = {
        nome: u.user_metadata?.nome || u.email?.split("@")[0] || "—",
        ultimo_acesso: u.last_sign_in_at || null,
      };
    });

    // Mapa email → dados do Auth (fallback quando user_id não bate)
    const authEmailMap = {};
    authUsers.forEach((u) => {
      if (u.email) authEmailMap[u.email.toLowerCase()] = {
        nome: u.user_metadata?.nome || u.email?.split("@")[0] || "—",
        ultimo_acesso: u.last_sign_in_at || null,
        id: u.id,
      };
    });

    // 4. Usuários Auth sem nenhuma assinatura = Free puro
    const freePuros = authUsers
      .filter((u) =>
        !idsComAssinatura.has(u.id) &&
        !emailsComAssinatura.has(u.email?.toLowerCase())
      )
      .map((u) => ({
        id: `free_${u.id}`,
        user_id: u.id,
        email: u.email,
        nome: authMap[u.id]?.nome || "—",
        plano: "free",
        status: "free",
        created_at: u.created_at,
        ultimo_acesso: u.last_sign_in_at || null,
        data_expiracao: null,
        data_inicio: null,
        kiwify_subscription_id: null,
        kiwify_order_id: null,
        _free_puro: true,
      }));

    // 5. Assinaturas com nome + último acesso resolvidos
    const nomesMap = {};
    authUsers.forEach((u) => {
      nomesMap[u.id] = u.user_metadata?.nome || u.email?.split("@")[0] || "—";
    });

    // Deriva periodicidade a partir da diferença entre data_inicio e data_expiracao
    function derivarPeriodicidade(data_inicio, data_expiracao) {
      if (!data_inicio || !data_expiracao) return null;
      const dias = Math.round(
        (new Date(data_expiracao) - new Date(data_inicio)) / (1000 * 60 * 60 * 24)
      );
      if (dias <= 45)  return "mensal";
      if (dias >= 300) return "anual";
      return null;
    }

    const comAssinatura = assinaturas.map((a) => {
      const auth = authMap[a.user_id] || authEmailMap[a.email?.toLowerCase()] || {};
      return {
        ...a,
        nome: auth.nome || a.email?.split("@")[0] || "—",
        ultimo_acesso: auth.ultimo_acesso || null,
        periodicidade: derivarPeriodicidade(a.data_inicio, a.data_expiracao),
      };
    });

    // 6. Lista unificada: pagos + free
    const todos = [...comAssinatura, ...freePuros].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    // ── Métricas ──────────────────────────────────────────────────────────────
    const agora = new Date();

    // Conta todos com status "ativo" (independente de data_expiracao para não sumir do painel)
    const ativos = comAssinatura.filter((u) => u.status === "ativo");
    const trial  = comAssinatura.filter((u) => u.status === "trial");
    const inadimplentes = comAssinatura.filter((u) => u.status === "inadimplente");
    const cancelados    = comAssinatura.filter((u) => u.status === "cancelado");
    const expirados     = comAssinatura.filter(
      (u) => u.status === "ativo" && u.data_expiracao && new Date(u.data_expiracao) <= agora
    );

    // Free = sem assinatura ativa OU com plano free explícito
    const totalFree = freePuros.length +
      comAssinatura.filter((u) => u.plano === "free" || u.status === "free").length;

    const porPlano = {
      free:         totalFree,
      essencial:    ativos.filter((u) => u.plano === "essencial").length,
      profissional: ativos.filter((u) => u.plano === "profissional").length,
      especialista: ativos.filter((u) => u.plano === "especialista").length,
    };

    // Novos (por created_at do Auth — mais preciso)
    const seteDiasAtras = new Date(agora - 7 * 24 * 60 * 60 * 1000);
    const inicioDia = new Date(agora); inicioDia.setHours(0, 0, 0, 0);

    // "Hoje" calculado em BRT (UTC-3): meia-noite BRT = 03:00 UTC
    const horaUTC = agora.getUTCHours();
    const inicioDiaBRT = new Date(agora);
    inicioDiaBRT.setUTCHours(3, 0, 0, 0);
    if (horaUTC < 3) inicioDiaBRT.setUTCDate(inicioDiaBRT.getUTCDate() - 1);

    const novosHoje     = authUsers.filter((u) => new Date(u.created_at) >= inicioDiaBRT).length;
    const novosSeteDias = authUsers.filter((u) => new Date(u.created_at) > seteDiasAtras).length;

    return res.status(200).json({
      usuarios: todos,
      metricas: {
        total:         authUsers.length,
        ativos:        ativos.length,
        trial:         trial.length,
        free:          totalFree,
        inadimplentes: inadimplentes.length,
        cancelados:    cancelados.length,
        expirados:     expirados.length,
        porPlano,
        novosHoje,
        novosSeteDias,
      },
    });
  }

  // ── PATCH ─────────────────────────────────────────────────────────────────
  if (req.method === "PATCH") {
    const { id, plano, status, data_expiracao } = req.body;
    if (!id) return res.status(400).json({ error: "ID obrigatório." });

    // ID sintético (free_puro) — precisa criar registro antes de editar
    if (String(id).startsWith("free_")) {
      const user_id = String(id).replace("free_", "");
      // Busca e-mail do usuário no Auth
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user_id);
      if (!authUser) return res.status(404).json({ error: "Usuário não encontrado." });

      const expiracao = data_expiracao
        ? new Date(data_expiracao).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from("assinaturas").insert({
        user_id,
        email:           authUser.email,
        plano:           plano || "essencial",
        status:          status || "ativo",
        data_inicio:     new Date().toISOString(),
        data_expiracao:  expiracao,
        updated_at:      new Date().toISOString(),
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ID real — update normal
    const updates = { updated_at: new Date().toISOString() };
    if (plano !== undefined)          updates.plano = plano;
    if (status !== undefined)         updates.status = status;
    if (data_expiracao !== undefined) updates.data_expiracao = data_expiracao
      ? new Date(data_expiracao).toISOString()
      : null;

    const { error } = await supabase
      .from("assinaturas")
      .update(updates)
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { id, user_id } = req.body;
    if (!id && !user_id) return res.status(400).json({ error: "ID obrigatório." });

    // 1. Remove da tabela assinaturas (se tiver registro real)
    if (id && !String(id).startsWith("free_")) {
      const { error: errDel } = await supabase
        .from("assinaturas")
        .delete()
        .eq("id", id);
      if (errDel) return res.status(500).json({ error: errDel.message });
    }

    // 2. Remove do Supabase Auth (exclui a conta completamente)
    const uid = user_id || (String(id).startsWith("free_") ? String(id).replace("free_", "") : null);
    if (uid) {
      const { error: errAuth } = await supabase.auth.admin.deleteUser(uid);
      if (errAuth) return res.status(500).json({ error: errAuth.message });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Método não permitido." });
}
