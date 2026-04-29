import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // login | cadastro | recuperar
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/calculadora");
    });
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro(error.message === "Invalid login credentials" ? "Email ou senha incorretos." : error.message);
    else router.push("/calculadora");
    setLoading(false);
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    const { error } = await supabase.auth.signUp({ email, password: senha });
    if (error) setErro(error.message);
    else setSucesso("Cadastro realizado! Verifique seu email para confirmar a conta.");
    setLoading(false);
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/calculadora`,
    });
    if (error) setErro(error.message);
    else setSucesso("Email de recuperação enviado! Verifique sua caixa de entrada.");
    setLoading(false);
  };

  const titulos = { login: "Entrar", cadastro: "Criar conta", recuperar: "Recuperar senha" };
  const handlers = { login: handleLogin, cadastro: handleCadastro, recuperar: handleRecuperar };

  return (
    <>
      <Head>
        <title>GJ Calculadora Tributária — Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", background: "radial-gradient(ellipse at top, #1a1000 0%, #0a0a0f 60%)",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg, #f5a623, #c8831a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 28, boxShadow: "0 0 40px #f5a62355",
            }}>
              ⚖️
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f5a623" }}>GJ Treinamentos Contábeis</div>
            <div style={{ color: "#6b6b8a", fontSize: 13, marginTop: 4 }}>Calculadora Tributária</div>
          </div>

          {/* Card */}
          <div className="card" style={{ boxShadow: "0 0 60px #f5a62315" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{titulos[mode]}</h2>

            {erro && (
              <div style={{
                background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8,
                padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fca5a5",
              }}>{erro}</div>
            )}
            {sucesso && (
              <div style={{
                background: "#22c55e22", border: "1px solid #22c55e", borderRadius: 8,
                padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#86efac",
              }}>{sucesso}</div>
            )}

            <form onSubmit={handlers[mode]} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">Email</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              {mode !== "recuperar" && (
                <div>
                  <label className="label">Senha</label>
                  <input
                    type="password" required value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••" minLength={6}
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: "100%", marginTop: 4 }}
              >
                {loading ? "Aguarde..." : titulos[mode]}
              </button>
            </form>

            {/* Links de navegação */}
            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#6b6b8a", display: "flex", flexDirection: "column", gap: 8 }}>
              {mode === "login" && (
                <>
                  <button onClick={() => { setMode("recuperar"); setErro(""); setSucesso(""); }}
                    style={{ background: "none", color: "#6b6b8a", fontSize: 13, padding: 0 }}>
                    Esqueci minha senha
                  </button>
                  <span>
                    Não tem conta?{" "}
                    <button onClick={() => { setMode("cadastro"); setErro(""); setSucesso(""); }}
                      style={{ background: "none", color: "#f5a623", fontSize: 13, padding: 0, fontWeight: 600 }}>
                      Criar conta gratuita
                    </button>
                  </span>
                </>
              )}
              {mode === "cadastro" && (
                <span>
                  Já tem conta?{" "}
                  <button onClick={() => { setMode("login"); setErro(""); setSucesso(""); }}
                    style={{ background: "none", color: "#f5a623", fontSize: 13, padding: 0, fontWeight: 600 }}>
                    Entrar
                  </button>
                </span>
              )}
              {mode === "recuperar" && (
                <button onClick={() => { setMode("login"); setErro(""); setSucesso(""); }}
                  style={{ background: "none", color: "#f5a623", fontSize: 13, padding: 0, fontWeight: 600 }}>
                  ← Voltar para o login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
