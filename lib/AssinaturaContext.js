import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { temAcesso } from "./planos";

const AssinaturaContext = createContext(null);

function diasRestantes(dataExpiracao) {
  if (!dataExpiracao) return null;
  const diff = new Date(dataExpiracao) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function planoExpirou(dataExpiracao) {
  if (!dataExpiracao) return true;
  return new Date(dataExpiracao) < new Date();
}

export function AssinaturaProvider({ children }) {
  const [assinatura, setAssinatura] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let iniciado = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      iniciado = true;
      if (session?.user) buscarAssinatura(session.user);
      else { setAssinatura(null); setCarregando(false); }
    });

    // Fallback SSR
    const timer = setTimeout(() => {
      if (!iniciado) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) buscarAssinatura(session.user);
          else setCarregando(false);
        });
      }
    }, 300);

    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const buscarAssinatura = async (user) => {
    setCarregando(true);

    // ── 1. Busca assinatura pelo user_id ──────────────────────────────────────
    const { data: rows } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("user_id", user.id)
      .order("data_expiracao", { ascending: false })
      .limit(5);

    // Também tenta pelo e-mail (para compras feitas antes do cadastro)
    const { data: rowsEmail } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("email", user.email)
      .order("data_expiracao", { ascending: false })
      .limit(5);

    // Une os resultados e remove duplicatas pelo id
    const todas = [...(rows || []), ...(rowsEmail || [])];
    const unicas = Object.values(Object.fromEntries(todas.map((r) => [r.id, r])));

    // ── 2. Procura o melhor registro ──────────────────────────────────────────

    // Plano pago ativo e não expirado
    const pago = unicas.find(
      (r) => r.status === "ativo" && !planoExpirou(r.data_expiracao)
    );
    if (pago) {
      // Se o user_id ainda não está vinculado, vincula agora
      if (!pago.user_id) {
        await supabase
          .from("assinaturas")
          .update({ user_id: user.id, updated_at: new Date().toISOString() })
          .eq("id", pago.id);
      }
      setAssinatura(pago);
      setCarregando(false);
      return;
    }

    // Plano inadimplente mas ainda dentro da data de expiração
    const inadimplente = unicas.find(
      (r) => r.status === "inadimplente" && !planoExpirou(r.data_expiracao)
    );
    if (inadimplente) {
      setAssinatura(inadimplente);
      setCarregando(false);
      return;
    }

    // Trial ativo
    const trial = unicas.find(
      (r) => r.status === "trial" && !planoExpirou(r.data_expiracao)
    );
    if (trial) {
      setAssinatura(trial);
      setCarregando(false);
      return;
    }

    // Qualquer registro expirado/cancelado → plano free com acesso só a notícias
    const qualquer = unicas[0];
    setAssinatura(
      qualquer
        ? { ...qualquer, plano: "free", _motivo: "expirado" }
        : { plano: "free", status: "free" }
    );
    setCarregando(false);
  };

  // ── Valores derivados ────────────────────────────────────────────────────────
  const isTrial       = assinatura?.status === "trial";
  const isInadimplente = assinatura?.status === "inadimplente";
  const diasTrial     = isTrial ? diasRestantes(assinatura?.data_expiracao) : null;

  // Plano efetivo: se trial expirou ou plano expirou → free
  const planoEfetivo = (() => {
    if (!assinatura) return "free";
    if (isTrial && diasTrial === 0) return "free";
    if (planoExpirou(assinatura.data_expiracao) && assinatura.status !== "trial") return "free";
    return assinatura.plano || "free";
  })();

  const pode = (ferramenta) => temAcesso(planoEfetivo, ferramenta);

  return (
    <AssinaturaContext.Provider value={{
      assinatura,
      carregando,
      pode,
      isTrial,
      isInadimplente,
      diasTrial,
      planoEfetivo,
    }}>
      {children}
    </AssinaturaContext.Provider>
  );
}

export function useAssinatura() {
  return useContext(AssinaturaContext);
}
