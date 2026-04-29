import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { temAcesso } from "./planos";

const AssinaturaContext = createContext(null);

export function AssinaturaProvider({ children }) {
  const [assinatura, setAssinatura] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        buscarAssinatura(session.user);
      } else {
        setAssinatura(null);
        setCarregando(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) buscarAssinatura(session.user);
      else setCarregando(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const buscarAssinatura = async (user) => {
    setCarregando(true);

    const { data } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ativo")
      .order("data_expiracao", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setAssinatura(data);
      setCarregando(false);
      return;
    }

    // Período de testes: provisiona automaticamente o plano Especialista
    const expiracao = new Date();
    expiracao.setFullYear(expiracao.getFullYear() + 1);

    const { data: nova } = await supabase
      .from("assinaturas")
      .upsert({
        user_id: user.id,
        email: user.email,
        plano: "especialista",
        status: "ativo",
        data_inicio: new Date().toISOString(),
        data_expiracao: expiracao.toISOString(),
      }, { onConflict: "user_id" })
      .select()
      .single();

    setAssinatura(nova || null);
    setCarregando(false);
  };

  const pode = (ferramenta) => temAcesso(assinatura?.plano, ferramenta);

  return (
    <AssinaturaContext.Provider value={{ assinatura, carregando, pode }}>
      {children}
    </AssinaturaContext.Provider>
  );
}

export function useAssinatura() {
  return useContext(AssinaturaContext);
}
