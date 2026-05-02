import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import { PLANOS } from "../lib/planos";

// ── Mensagem de feedback ───────────────────────────────────────────────────────
function Msg({ msg }) {
  if (!msg) return null;
  const ok = msg.tipo === "ok";
  return (
    <div style={{
      marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      background: ok ? "#22c55e18" : "#ef444418",
      border: `1px solid ${ok ? "#22c55e" : "#ef4444"}`,
      color: ok ? "#86efac" : "#fca5a5",
    }}>
      {ok ? "✓ " : "⚠ "}{msg.texto}
    </div>
  );
}

// ── Card de seção ──────────────────────────────────────────────────────────────
function Card({ icon, titulo, subtitulo, children }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 16, padding: "24px 28px", marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "var(--primary-glow)", border: "1px solid var(--primary)40",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{titulo}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{subtitulo}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Campo de input ─────────────────────────────────────────────────────────────
function Campo({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
          background: "var(--bg-input)", border: "1px solid var(--border)",
          color: "var(--text)", outline: "none", boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = "var(--primary)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PerfilPage() {
  const router = useRouter();
  const { assinatura, isTrial, diasTrial } = useAssinatura();
  const [user, setUser]       = useState(null);
  const fileInputRef          = useRef(null);

  // Foto
  const [avatarUrl, setAvatarUrl]           = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [msgAvatar, setMsgAvatar]           = useState(null);

  // Informações pessoais
  const [nome, setNome]             = useState("");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [msgNome, setMsgNome]       = useState(null);

  // Segurança
  const [senhaAtual, setSenhaAtual]       = useState("");
  const [novaSenha, setNovaSenha]         = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [msgSenha, setMsgSenha]           = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setUser(session.user);
      const meta = session.user.user_metadata || {};
      setNome(meta.nome_completo || "");
      setAvatarUrl(meta.avatar_url || null);
    });
  }, [router]);

  // ── Foto de perfil ─────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      setMsgAvatar({ tipo: "erro", texto: "Arquivo muito grande. Máximo 2MB." });
      return;
    }
    const tipos = ["image/jpeg", "image/png", "image/webp"];
    if (!tipos.includes(file.type)) {
      setMsgAvatar({ tipo: "erro", texto: "Formato inválido. Use JPG, PNG ou WEBP." });
      return;
    }

    setUploadingAvatar(true);
    setMsgAvatar(null);

    const ext = file.name.split(".").pop().toLowerCase();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setMsgAvatar({ tipo: "erro", texto: "Erro ao enviar foto. Tente novamente." });
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      setAvatarUrl(url);
      setMsgAvatar({ tipo: "ok", texto: "Foto atualizada com sucesso!" });
      setTimeout(() => setMsgAvatar(null), 3000);
    }
    setUploadingAvatar(false);
  };

  // ── Salvar nome ────────────────────────────────────────────────────────────
  const salvarNome = async () => {
    if (!nome.trim()) return;
    setSalvandoNome(true);
    setMsgNome(null);
    const { error } = await supabase.auth.updateUser({ data: { nome_completo: nome.trim() } });
    setMsgNome(error
      ? { tipo: "erro", texto: "Erro ao salvar. Tente novamente." }
      : { tipo: "ok",  texto: "Nome atualizado com sucesso!" }
    );
    setSalvandoNome(false);
    setTimeout(() => setMsgNome(null), 3000);
  };

  // ── Alterar senha ──────────────────────────────────────────────────────────
  const alterarSenha = async () => {
    setMsgSenha(null);
    if (!senhaAtual) { setMsgSenha({ tipo: "erro", texto: "Informe a senha atual." }); return; }
    if (novaSenha.length < 6) { setMsgSenha({ tipo: "erro", texto: "A nova senha deve ter pelo menos 6 caracteres." }); return; }
    if (novaSenha !== confirmarSenha) { setMsgSenha({ tipo: "erro", texto: "As senhas não coincidem." }); return; }

    setSalvandoSenha(true);

    // Verifica senha atual re-autenticando
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email, password: senhaAtual,
    });
    if (authError) {
      setMsgSenha({ tipo: "erro", texto: "Senha atual incorreta." });
      setSalvandoSenha(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) {
      setMsgSenha({ tipo: "erro", texto: "Erro ao alterar senha. Tente novamente." });
    } else {
      setMsgSenha({ tipo: "ok", texto: "Senha alterada com sucesso!" });
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      setTimeout(() => setMsgSenha(null), 3000);
    }
    setSalvandoSenha(false);
  };

  if (!user) return null;

  const iniciais = nome
    ? nome.trim().split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()
    : user.email?.slice(0, 2).toUpperCase();

  const planoAtual = assinatura ? PLANOS[assinatura.plano] : null;

  return (
    <>
      <Head>
        <title>Meu Perfil — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 680, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Meu Perfil</h1>
            <p style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>
              Gerencie suas informações pessoais e segurança
            </p>
          </div>

          {/* ── Plano atual ── */}
          {planoAtual && (
            <div style={{
              background: `${planoAtual.cor}12`,
              border: `1px solid ${planoAtual.cor}40`,
              borderRadius: 14, padding: "14px 20px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: planoAtual.cor, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: planoAtual.cor }}>
                    Plano {planoAtual.nome} {isTrial ? `· Trial (${diasTrial} dias restantes)` : "· Ativo"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => router.push("/assinatura")}
                style={{
                  padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: `${planoAtual.cor}20`, border: `1px solid ${planoAtual.cor}50`,
                  color: planoAtual.cor, cursor: "pointer",
                }}
              >
                Ver planos →
              </button>
            </div>
          )}

          {/* ── Foto de Perfil ── */}
          <Card icon="👤" titulo="Foto de Perfil" subtitulo="Escolha uma foto para seu perfil (máx. 2MB)">
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              {/* Avatar */}
              <div style={{
                width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
                background: avatarUrl ? "transparent" : "linear-gradient(135deg,#808CFF,#4a55e8)",
                border: "3px solid var(--primary)40",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 800, color: "#fff", overflow: "hidden",
              }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : iniciais
                }
              </div>

              {/* Botão + info */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                    background: uploadingAvatar ? "var(--bg-input)" : "var(--primary-glow)",
                    border: "1px solid var(--primary)", color: "var(--primary)",
                    cursor: uploadingAvatar ? "not-allowed" : "pointer",
                  }}
                >
                  {uploadingAvatar ? "Enviando..." : "📷 Escolher Foto"}
                </button>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                  Formatos: JPG, PNG ou WEBP · Tamanho máximo: 2MB
                </div>
              </div>
            </div>
            <Msg msg={msgAvatar} />
          </Card>

          {/* ── Informações Pessoais ── */}
          <Card icon="📝" titulo="Informações Pessoais" subtitulo="Atualize seu nome de exibição">
            <Campo
              label="Nome Completo"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome completo"
            />
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, marginTop: -8 }}>
              Email: <strong style={{ color: "var(--text)" }}>{user.email}</strong>
            </div>
            <button
              onClick={salvarNome}
              disabled={salvandoNome || !nome.trim()}
              style={{
                padding: "11px 28px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: salvandoNome || !nome.trim()
                  ? "var(--bg-input)"
                  : "linear-gradient(135deg, #DF9F20, #B27F1A)",
                border: "none",
                color: salvandoNome || !nome.trim() ? "var(--muted)" : "#000",
                cursor: salvandoNome || !nome.trim() ? "not-allowed" : "pointer",
              }}
            >
              {salvandoNome ? "Salvando..." : "Salvar Alterações"}
            </button>
            <Msg msg={msgNome} />
          </Card>

          {/* ── Segurança ── */}
          <Card icon="🔒" titulo="Segurança" subtitulo="Altere sua senha de acesso">
            <Campo
              label="Senha Atual"
              type="password"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              placeholder="Digite sua senha atual"
            />
            <Campo
              label="Nova Senha"
              type="password"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <Campo
              label="Confirmar Nova Senha"
              type="password"
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha"
            />
            <button
              onClick={alterarSenha}
              disabled={salvandoSenha}
              style={{
                padding: "11px 28px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: salvandoSenha ? "var(--bg-input)" : "linear-gradient(135deg, #DF9F20, #B27F1A)",
                border: "none",
                color: salvandoSenha ? "var(--muted)" : "#000",
                cursor: salvandoSenha ? "not-allowed" : "pointer",
              }}
            >
              {salvandoSenha ? "Alterando..." : "Alterar Senha"}
            </button>
            <Msg msg={msgSenha} />
          </Card>

        </div>
      </Layout>
    </>
  );
}
