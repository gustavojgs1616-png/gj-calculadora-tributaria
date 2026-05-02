import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [senha, setSenha]               = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [loading, setLoading]           = useState(false);
  const [erro, setErro]                 = useState("");
  const [sucesso, setSucesso]           = useState(false);
  const [sessionOk, setSessionOk]       = useState(false);
  const [verificando, setVerificando]   = useState(true);

  useEffect(() => {
    // 1. Tenta pegar sessão já existente (caso o token já foi processado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionOk(true);
        setVerificando(false);
      }
    });

    // 2. Escuta evento PASSWORD_RECOVERY — Supabase dispara quando processa o hash da URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionOk(true);
        setVerificando(false);
      }
      // Segurança: SIGNED_IN sozinho não libera (evita falso positivo de usuário logado)
    });

    // 3. Timeout de segurança — 8s para dar tempo ao Supabase processar
    const timeout = setTimeout(() => {
      setVerificando(false);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setErro(error.message || "Erro ao atualizar a senha. Tente novamente.");
    } else {
      setSucesso(true);
      setTimeout(() => router.push("/home"), 2500);
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Redefinir Senha — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 24px",
        background: "radial-gradient(ellipse at 30% 20%, #0a0e3a 0%, #000433 50%, #00031F 100%)",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img src="/logo.png" alt="GJ Hub Contábil" style={{ width: 60, height: 60, borderRadius: 16, margin: "0 auto 16px", display: "block", objectFit: "contain" }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F6FF" }}>GJ Hub Contábil</div>
            <div style={{ fontSize: 13, color: "#808CFF", marginTop: 4, fontWeight: 600 }}>Hub do Contador</div>
          </div>

          <div style={{
            background: "#00031F", border: "1px solid #E0E3FF18", borderRadius: 16,
            padding: 32, boxShadow: "0 0 60px #DF9F2010",
          }}>

            {/* Estado: verificando token */}
            {verificando ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
                <p style={{ color: "#808CFF", fontSize: 14 }}>Verificando link de recuperação...</p>
              </div>

            /* Estado: link inválido */
            ) : !sessionOk ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F5F6FF", marginBottom: 10 }}>
                  Link inválido ou expirado
                </h2>
                <p style={{ fontSize: 13, color: "#6670B8", lineHeight: 1.6, marginBottom: 24 }}>
                  Este link de recuperação não é mais válido.<br />Solicite um novo email de recuperação.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                    background: "linear-gradient(135deg, #DF9F20, #B27F1A)", border: "none",
                    color: "#000", cursor: "pointer",
                  }}
                >
                  Ir para o login
                </button>
              </div>

            /* Estado: sucesso */
            ) : sucesso ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F5F6FF", marginBottom: 8 }}>
                  Senha atualizada!
                </h2>
                <p style={{ fontSize: 13, color: "#6670B8", lineHeight: 1.6 }}>
                  Sua senha foi redefinida com sucesso. Redirecionando...
                </p>
              </div>

            /* Estado: formulário */
            ) : (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#F5F6FF" }}>
                  Redefinir senha
                </h2>
                <p style={{ fontSize: 13, color: "#6670B8", marginBottom: 24, lineHeight: 1.5 }}>
                  Escolha uma nova senha para sua conta.
                </p>

                {erro && (
                  <div style={{
                    background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8,
                    padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fca5a5",
                  }}>
                    {erro}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#808CFF", marginBottom: 6 }}>
                      Nova senha
                    </label>
                    <input
                      type="password" required minLength={6}
                      value={senha} onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      style={{
                        width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
                        background: "#0a0d2e", border: "1px solid #E0E3FF25", color: "#F5F6FF",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#808CFF", marginBottom: 6 }}>
                      Confirmar nova senha
                    </label>
                    <input
                      type="password" required minLength={6}
                      value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)}
                      placeholder="Repita a senha"
                      style={{
                        width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
                        background: "#0a0d2e", border: "1px solid #E0E3FF25", color: "#F5F6FF",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    type="submit" disabled={loading}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                      background: loading ? "#1a1c3a" : "linear-gradient(135deg, #DF9F20, #B27F1A)",
                      border: "none", color: loading ? "#6670B8" : "#000",
                      cursor: loading ? "not-allowed" : "pointer", marginTop: 4, transition: "all 0.15s",
                    }}
                  >
                    {loading ? "Salvando..." : "Salvar nova senha"}
                  </button>
                </form>

                <div style={{ marginTop: 20, textAlign: "center" }}>
                  <button
                    onClick={() => router.push("/login")}
                    style={{ background: "none", border: "none", color: "#6670B8", fontSize: 13, cursor: "pointer" }}
                  >
                    ← Voltar para o login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
