import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import CardBloqueado from "../components/CardBloqueado";
import { DOCUMENTOS } from "../lib/modelos_documentos";

// ── Mapeamento: campo do formulário → chave do perfil ────────────────────────
const MAPA_PERFIL = {
  nome_escritorio:     "nome",
  cnpj_escritorio:     "cnpj",
  crc_contador:        "crc",
  crc_outorgado:       "crc",
  crc:                 "crc",
  nome_outorgado:      "nome_contador",
  nome_contador:       "nome_contador",
  endereco_escritorio: "endereco",
  telefone:            "telefone",
  email_escritorio:    "email",
  cidade:              "cidade",
  cidade_contrato:     "cidade",
  uf_foro:             "uf",
  // Aditivo
  chave_pix:           "chave_pix",
};

const PERFIL_VAZIO = {
  nome: "", nome_contador: "", cnpj: "", crc: "",
  endereco: "", telefone: "", email: "", cidade: "", uf: "",
  chave_pix: "",
  cor: "#DF9F20", logo: "",
};

function aplicarMascara(tipo, valor) {
  const v = valor.replace(/\D/g, "");
  if (tipo === "cnpj") {
    return v.replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  }
  if (tipo === "cpf") {
    return v.replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  }
  return valor;
}

// ── Painel do Perfil do Escritório ───────────────────────────────────────────
function PainelPerfil({ perfil, onChange, onSalvar, salvo }) {
  const [aberto, setAberto] = useState(!perfil.nome);
  const logoInputRef = useRef(null);

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Logo deve ter no máximo 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange("logo", ev.target.result);
    reader.readAsDataURL(file);
  };

  const campo = (label, chave, placeholder, tipo = "text") => (
    <div key={chave}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={tipo}
        placeholder={placeholder}
        value={perfil[chave] || ""}
        onChange={(e) => {
          let v = e.target.value;
          if (chave === "cnpj") {
            v = v.replace(/\D/g, "")
              .replace(/^(\d{2})(\d)/, "$1.$2")
              .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
              .replace(/\.(\d{3})(\d)/, ".$1/$2")
              .replace(/(\d{4})(\d)/, "$1-$2")
              .slice(0, 18);
          }
          onChange(chave, v);
        }}
        style={{ width: "100%", fontSize: 14 }}
      />
    </div>
  );

  return (
    <div style={{
      marginBottom: 20,
      background: "var(--bg-card)",
      border: perfil.nome ? "1px solid var(--primary)40" : "1px solid var(--border)",
      borderRadius: 14,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>

      {/* ── Header colapsável ── */}
      <button
        onClick={() => setAberto((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {/* Preview do logo ou ícone padrão */}
          {perfil.logo
            ? <img src={perfil.logo} alt="Logo" style={{ height: 36, width: 36, objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)", background: "#fff", padding: 2 }} />
            : <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏢</div>
          }
          <div style={{ textAlign: "left", minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {perfil.nome || "Perfil do Escritório"}
            </div>
            <div style={{ fontSize: 11, color: perfil.nome ? "var(--primary)" : "var(--muted)" }}>
              {perfil.nome
                ? "✓ Configurado — documentos saem com sua marca"
                : "Configure uma vez e seus documentos saem personalizados"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {perfil.cor && (
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: perfil.cor, border: "2px solid var(--border)", flexShrink: 0 }} />
          )}
          <span style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1 }}>{aberto ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* ── Conteúdo expandível ── */}
      {aberto && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "20px 18px" }}>

          {/* Upload de logo */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Logotipo do Escritório
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Preview */}
              <div style={{
                width: 80, height: 80, borderRadius: 12, flexShrink: 0,
                background: perfil.logo ? "#fff" : "var(--bg-hover)",
                border: `2px dashed ${perfil.logo ? "var(--primary)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s",
              }} onClick={() => logoInputRef.current?.click()}>
                {perfil.logo
                  ? <img src={perfil.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} />
                  : <span style={{ fontSize: 28 }}>📷</span>
                }
              </div>

              {/* Botões */}
              <div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  style={{
                    display: "block", padding: "9px 18px", borderRadius: 8, marginBottom: 8,
                    background: "var(--primary-glow)", border: "1px solid var(--primary)",
                    color: "var(--primary)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    width: "100%",
                  }}
                >
                  {perfil.logo ? "Trocar logo" : "Fazer upload"}
                </button>
                {perfil.logo && (
                  <button
                    onClick={() => onChange("logo", "")}
                    style={{
                      display: "block", padding: "7px 18px", borderRadius: 8,
                      background: "transparent", border: "1px solid var(--border)",
                      color: "var(--muted)", fontSize: 12, cursor: "pointer", width: "100%",
                    }}
                  >
                    Remover logo
                  </button>
                )}
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>PNG, JPG ou SVG · máx. 2 MB</div>
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: "none" }} />
          </div>

          {/* Campos do escritório */}
          <div className="doc-fields-grid">
            {campo("Nome do Escritório / Contador", "nome", "Ex: GJ Contabilidade Ltda")}
            {campo("CNPJ do Escritório", "cnpj", "00.000.000/0000-00")}
            {campo("CRC", "crc", "Ex: CRC/SP 123456")}
            {campo("Nome do Contador Responsável", "nome_contador", "Ex: João da Silva")}
            {campo("Endereço Completo", "endereco", "Rua, número, cidade - UF")}
            {campo("Telefone / WhatsApp", "telefone", "Ex: (11) 99999-9999")}
            {campo("E-mail", "email", "Ex: contato@escritorio.com.br")}
            {campo("Cidade padrão", "cidade", "Ex: São Paulo")}
            {campo("UF", "uf", "Ex: SP")}
            {campo("Chave PIX", "chave_pix", "Ex: CNPJ, e-mail ou telefone")}
          </div>

          {/* Cor da marca */}
          <div style={{ marginTop: 4, marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              Cor da Marca (usada nos documentos)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {["#DF9F20", "#1a56db", "#16a34a", "#dc2626", "#7c3aed", "#0891b2", "#1a1a1a"].map((c) => (
                <button key={c} onClick={() => onChange("cor", c)} style={{
                  width: 30, height: 30, borderRadius: "50%", background: c, border: "none",
                  cursor: "pointer", flexShrink: 0,
                  boxShadow: perfil.cor === c ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${c}` : "none",
                  transition: "box-shadow 0.15s",
                }} />
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "var(--muted)" }}>
                <input type="color" value={perfil.cor || "#DF9F20"} onChange={(e) => onChange("cor", e.target.value)}
                  style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border)", padding: 2, cursor: "pointer", background: "var(--bg-input)" }} />
                Personalizada
              </label>
            </div>
          </div>

          {/* Botão salvar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={onSalvar}
              style={{
                padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                border: "none", color: "#fff",
                boxShadow: "0 4px 16px var(--primary-glow)",
              }}
            >
              💾 Salvar Perfil
            </button>
            {salvo && (
              <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
                ✓ Salvo! Seus documentos já estão personalizados.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DocumentosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [docAtivo, setDocAtivo] = useState(DOCUMENTOS[0]);
  const [campos, setCampos] = useState({});
  const [gerado, setGerado] = useState(false);

  // Perfil do escritório
  const [perfil, setPerfil] = useState(PERFIL_VAZIO);
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  // Carrega perfil do localStorage
  useEffect(() => {
    try {
      const salvo = localStorage.getItem("gj-perfil-escritorio");
      if (salvo) setPerfil(JSON.parse(salvo));
    } catch { /* ignore */ }
  }, []);

  // Auto-preenche campos do formulário com dados do perfil
  useEffect(() => {
    setCampos({});
    setGerado(false);
  }, [docAtivo.id]);

  useEffect(() => {
    if (!perfil.nome) return;
    setCampos((prev) => {
      const novos = { ...prev };
      docAtivo.campos.forEach(({ id }) => {
        const chavePerfil = MAPA_PERFIL[id];
        if (chavePerfil && perfil[chavePerfil] && !prev[id]) {
          novos[id] = perfil[chavePerfil];
        }
      });
      return novos;
    });
  }, [docAtivo.id, perfil]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
  }, [router]);

  const handleCampo = (id, tipo, valor) => {
    const mascarado = tipo === "cnpj" || tipo === "cpf" ? aplicarMascara(tipo, valor) : valor;
    setCampos((prev) => ({ ...prev, [id]: mascarado }));
  };

  const handlePerfilChange = (chave, valor) => {
    setPerfil((prev) => ({ ...prev, [chave]: valor }));
    setPerfilSalvo(false);
  };

  const salvarPerfil = () => {
    localStorage.setItem("gj-perfil-escritorio", JSON.stringify(perfil));
    setPerfilSalvo(true);
    // Re-aplica auto-fill
    setCampos((prev) => {
      const novos = { ...prev };
      docAtivo.campos.forEach(({ id }) => {
        const chavePerfil = MAPA_PERFIL[id];
        if (chavePerfil && perfil[chavePerfil]) {
          novos[id] = perfil[chavePerfil];
        }
      });
      return novos;
    });
    setTimeout(() => setPerfilSalvo(false), 4000);
  };

  const camposPreenchidos = () =>
    docAtivo.campos.every((c) => campos[c.id] && campos[c.id].trim() !== "");

  const gerarDocumento = () => {
    const html = docAtivo.gerarHTML(campos, perfil);
    const janela = window.open("", "_blank");
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 600);
    setGerado(true);
  };

  if (!user || carregandoPlano) return null;
  if (!pode("documentos")) return (
    <Layout user={user}>
      <CardBloqueado ferramenta="documentos" planoNecessario="essencial" />
    </Layout>
  );

  return (
    <>
      <Head>
        <title>Gerador de Documentos — GJ Hub Contábil</title>
      </Head>
      <Layout user={user}>
        <div className="doc-page-wrap">

          {/* Cabeçalho */}
          <div className="doc-header">
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Gerador de Documentos</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Preencha os dados e gere o documento em PDF na hora — sem precisar de Word.
            </p>
          </div>

          {/* ── Perfil do Escritório ── */}
          <PainelPerfil
            perfil={perfil}
            onChange={handlePerfilChange}
            onSalvar={salvarPerfil}
            salvo={perfilSalvo}
          />

          {/* ── Chips mobile: seletor de modelo ── */}
          <div className="doc-chips-row">
            {DOCUMENTOS.map((doc) => {
              const ativo = docAtivo.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setDocAtivo(doc)}
                  className={`doc-chip${ativo ? " doc-chip--ativo" : ""}`}
                >
                  <span style={{ fontSize: 16 }}>{doc.icone}</span>
                  <span>{doc.titulo}</span>
                </button>
              );
            })}
          </div>

          {/* ── Layout desktop: sidebar + formulário ── */}
          <div className="doc-layout">

            {/* Sidebar: lista de modelos */}
            <div className="doc-sidebar">
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Modelos disponíveis
              </div>
              {DOCUMENTOS.map((doc) => {
                const ativo = docAtivo.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setDocAtivo(doc)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "12px 14px", borderRadius: 10, textAlign: "left", width: "100%",
                      background: ativo ? "var(--primary-glow)" : "var(--bg-card)",
                      border: ativo ? "1px solid var(--primary)" : "1px solid var(--border)",
                      color: ativo ? "var(--primary)" : "var(--text)",
                      cursor: "pointer", transition: "all 0.15s", marginBottom: 6,
                    }}
                    onMouseEnter={e => { if (!ativo) e.currentTarget.style.borderColor = "var(--primary)"; }}
                    onMouseLeave={e => { if (!ativo) e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{doc.icone}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>{doc.titulo}</div>
                      <div style={{ fontSize: 11, color: ativo ? "var(--primary)" : "var(--muted)", marginTop: 3, lineHeight: 1.4 }}>{doc.descricao}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Formulário */}
            <div className="doc-form-panel card">

              {/* Cabeçalho do doc */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 26 }}>{docAtivo.icone}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{docAtivo.titulo}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{docAtivo.descricao}</div>
                </div>
              </div>

              {/* Aviso de perfil configurado */}
              {perfil.nome && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
                  padding: "10px 14px", borderRadius: 9,
                  background: "var(--primary-glow)", border: "1px solid var(--primary)40",
                }}>
                  {perfil.logo && <img src={perfil.logo} alt="" style={{ height: 22, width: 22, objectFit: "contain", borderRadius: 4, background: "#fff" }} />}
                  <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
                    Os dados de <strong>{perfil.nome}</strong> foram pré-preenchidos automaticamente.
                  </span>
                </div>
              )}

              {/* Campos */}
              <div className="doc-fields-grid">
                {docAtivo.campos.map((campo) => (
                  <div key={campo.id}>
                    <label style={{
                      display: "block", fontSize: 11, fontWeight: 700,
                      color: "var(--muted)", textTransform: "uppercase",
                      letterSpacing: "0.07em", marginBottom: 6,
                    }}>
                      {campo.label}
                      {MAPA_PERFIL[campo.id] && perfil[MAPA_PERFIL[campo.id]] && (
                        <span style={{ marginLeft: 6, fontSize: 9, color: "var(--primary)", fontWeight: 700, letterSpacing: 0 }}>AUTO</span>
                      )}
                    </label>
                    {campo.tipo === "select" ? (
                      <select
                        value={campos[campo.id] || ""}
                        onChange={(e) => handleCampo(campo.id, campo.tipo, e.target.value)}
                        style={{ width: "100%" }}
                      >
                        <option value="">Selecione...</option>
                        {campo.opcoes.map((op) => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={campo.placeholder}
                        value={campos[campo.id] || ""}
                        onChange={(e) => handleCampo(campo.id, campo.tipo, e.target.value)}
                        maxLength={campo.tipo === "cnpj" ? 18 : campo.tipo === "cpf" ? 14 : undefined}
                        style={{
                          width: "100%",
                          borderColor: MAPA_PERFIL[campo.id] && perfil[MAPA_PERFIL[campo.id]] ? "var(--primary)40" : undefined,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Aviso campos obrigatórios */}
              {!camposPreenchidos() && (
                <div style={{
                  padding: "12px 16px", background: "var(--bg-input)",
                  border: "1px solid var(--border)", borderRadius: 8,
                  fontSize: 12, color: "var(--muted)", marginBottom: 20,
                }}>
                  Preencha todos os campos para gerar o documento.
                </div>
              )}

              {/* Botão gerar */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  onClick={gerarDocumento}
                  disabled={!camposPreenchidos()}
                  style={{
                    padding: "13px 32px", fontSize: 15, flex: "1 1 auto",
                    opacity: camposPreenchidos() ? 1 : 0.4,
                    cursor: camposPreenchidos() ? "pointer" : "not-allowed",
                  }}
                >
                  📄 Gerar PDF
                </button>
                {gerado && (
                  <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
                    ✓ Documento gerado!
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
                O documento abrirá em nova janela pronto para impressão ou salvar como PDF. Revise antes de assinar.
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
