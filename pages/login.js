import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/home");
    });
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setErro("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      if (error.message === "Invalid login credentials") setErro("Email ou senha incorretos.");
      else if (error.message === "Email not confirmed") setErro("Email ainda não confirmado. Entre em contato com o suporte ou aguarde a confirmação.");
      else setErro(error.message);
    }
    else router.push("/home");
    setLoading(false);
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true); setErro(""); setSucesso("");

    let json;
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha, nome }),
      });
      json = await res.json();
      if (!res.ok) {
        setErro(json.error || "Erro ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
      setLoading(false);
      return;
    }

    // Faz login automático após cadastro bem-sucedido
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (loginError) {
      // Conta criada mas login automático falhou — pede para entrar manualmente
      setSucesso("Conta criada com sucesso! Agora faça login para entrar.");
      setMode("login");
    } else {
      router.push("/home");
    }
    setLoading(false);
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setLoading(true); setErro("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setErro(error.message);
    else setSucesso("Email de recuperação enviado! Verifique sua caixa de entrada.");
    setLoading(false);
  };

  const titulos = { login: "Entrar na plataforma", cadastro: "Criar conta gratuita", recuperar: "Recuperar senha" };
  const handlers = { login: handleLogin, cadastro: handleCadastro, recuperar: handleRecuperar };

  return (
    <>
      <Head>
        <title>GJ Hub Contábil — Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{
        minHeight: "100vh", display: "flex",
        background: "radial-gradient(ellipse at 30% 20%, #0a0e3a 0%, #000433 50%, #00031F 100%)",
      }}>
        {/* Painel esquerdo */}
        <div style={{
          flex: 1, display: "none", flexDirection: "column", justifyContent: "center",
          padding: "60px 48px", borderRight: "1px solid #E0E3FF18",
          background: "linear-gradient(160deg, #00031F 0%, #000433 100%)",
        }} className="login-panel-left">
          <div style={{ marginBottom: 48 }}>
            <img src="/logo.png" alt="GJ Hub Contábil" style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 32, objectFit: "contain" }} />
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#F5F6FF", lineHeight: 1.2, marginBottom: 12 }}>
              GJ Hub Contábil
            </h1>
            <p style={{ fontSize: 16, color: "#6670B8", lineHeight: 1.7 }}>
              Compare Simples Nacional, Lucro Presumido e Lucro Real em segundos. Descubra qual regime gera mais economia para sua empresa.
            </p>
          </div>
          {[
            { icon: "⚖️", text: "Comparação dos 3 regimes tributários" },
            { icon: "📄", text: "Relatório PDF profissional" },
            { icon: "📊", text: "Histórico de simulações" },
            { icon: "💰", text: "Calcule a economia real" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: "#DF9F2022",
                border: "1px solid #DF9F2044", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>{f.icon}</div>
              <span style={{ fontSize: 14, color: "#EBECFF" }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Formulário */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px",
        }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            {/* Logo mobile */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <img src="/logo.png" alt="GJ Hub Contábil" style={{ width: 60, height: 60, borderRadius: 16, margin: "0 auto 16px", display: "block", objectFit: "contain" }} />
              <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F6FF" }}>GJ Hub Contábil</div>
              <div style={{ fontSize: 13, color: "#808CFF", marginTop: 4, fontWeight: 600 }}>Hub do Contador</div>
            </div>

            {/* Card */}
            <div style={{
              background: "#00031F", border: "1px solid #E0E3FF18", borderRadius: 16,
              padding: 32, boxShadow: "0 0 60px #DF9F2010",
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: "#F5F6FF" }}>{titulos[mode]}</h2>

              {erro && (
                <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
                  {erro}
                </div>
              )}
              {sucesso && (
                <div style={{ background: "#22c55e22", border: "1px solid #22c55e", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#86efac" }}>
                  {sucesso}
                </div>
              )}

              <form onSubmit={handlers[mode]} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {mode === "cadastro" && (
                  <div>
                    <label className="label">Nome</label>
                    <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" minLength={2} />
                  </div>
                )}
                <div>
                  <label className="label">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                {mode !== "recuperar" && (
                  <div>
                    <label className="label">Senha</label>
                    <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" minLength={6} />
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: 4 }}>
                  {loading ? "Aguarde..." : titulos[mode]}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#6670B8", display: "flex", flexDirection: "column", gap: 10 }}>
                {mode === "login" && (
                  <>
                    <button onClick={() => { setMode("recuperar"); setErro(""); setSucesso(""); setNome(""); }}
                      style={{ background: "none", color: "#6670B8", fontSize: 13, padding: 0 }}>Esqueci minha senha</button>
                    <span>Não tem conta?{" "}
                      <button onClick={() => { setMode("cadastro"); setErro(""); setSucesso(""); setNome(""); }}
                        style={{ background: "none", color: "#DF9F20", fontSize: 13, padding: 0, fontWeight: 700 }}>Criar conta gratuita</button>
                    </span>
                  </>
                )}
                {mode === "cadastro" && (
                  <span>Já tem conta?{" "}
                    <button onClick={() => { setMode("login"); setErro(""); setSucesso(""); setNome(""); }}
                      style={{ background: "none", color: "#DF9F20", fontSize: 13, padding: 0, fontWeight: 700 }}>Entrar</button>
                  </span>
                )}
                {mode === "recuperar" && (
                  <button onClick={() => { setMode("login"); setErro(""); setSucesso(""); }}
                    style={{ background: "none", color: "#DF9F20", fontSize: 13, padding: 0, fontWeight: 700 }}>← Voltar para login</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé legal */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          textAlign: "center", padding: "12px 24px",
          fontSize: 11, color: "#6670B840",
          borderTop: "1px solid #E0E3FF08",
          background: "#00031Fcc",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
        }}>
          <Link href="/privacidade" style={{ color: "#808CFF80", textDecoration: "none" }}
            onMouseEnter={e => e.target.style.color = "#808CFF"}
            onMouseLeave={e => e.target.style.color = "#808CFF80"}>
            Privacidade
          </Link>
          <span style={{ color: "#E0E3FF15" }}>|</span>
          <Link href="/termos" style={{ color: "#808CFF80", textDecoration: "none" }}
            onMouseEnter={e => e.target.style.color = "#808CFF"}
            onMouseLeave={e => e.target.style.color = "#808CFF80"}>
            Termos de Uso
          </Link>
        </div>
      </div>
    </>
  );
}
