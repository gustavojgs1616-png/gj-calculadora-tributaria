import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAssinatura } from "../lib/AssinaturaContext";
import CardBloqueado from "../components/CardBloqueado";
import { DOCUMENTOS } from "../lib/modelos_documentos";

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

export default function DocumentosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { pode, carregando: carregandoPlano } = useAssinatura();
  const [docAtivo, setDocAtivo] = useState(DOCUMENTOS[0]);
  const [campos, setCampos] = useState({});
  const [gerado, setGerado] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/"); return; }
      setUser(session.user);
    });
  }, [router]);

  useEffect(() => {
    // Limpa campos ao trocar de documento
    setCampos({});
    setGerado(false);
  }, [docAtivo.id]);

  const handleCampo = (id, tipo, valor) => {
    const mascarado = tipo === "cnpj" || tipo === "cpf" ? aplicarMascara(tipo, valor) : valor;
    setCampos((prev) => ({ ...prev, [id]: mascarado }));
  };

  const camposPreenchidos = () =>
    docAtivo.campos.every((c) => campos[c.id] && campos[c.id].trim() !== "");

  const gerarDocumento = () => {
    const html = docAtivo.gerarHTML(campos);
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
        <title>Gerador de Documentos — GJ Contábil Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout user={user}>
        <div style={{ padding: "32px 28px", maxWidth: 1100, margin: "0 auto" }}>

          {/* Cabeçalho */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Gerador de Documentos</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Preencha os dados e gere o documento em PDF na hora — sem precisar de Word.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>

            {/* ── Painel esquerdo: lista de documentos ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
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
                      padding: "12px 14px", borderRadius: 10, textAlign: "left",
                      background: ativo ? "var(--primary-glow)" : "var(--bg-card)",
                      border: ativo ? "1px solid var(--primary)" : "1px solid var(--border)",
                      color: ativo ? "var(--primary)" : "var(--text)",
                      cursor: "pointer", transition: "all 0.15s",
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

            {/* ── Painel direito: formulário ── */}
            <div className="card" style={{ padding: "28px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 28 }}>{docAtivo.icone}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{docAtivo.titulo}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{docAtivo.descricao}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
                {docAtivo.campos.map((campo) => (
                  <div key={campo.id}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                      {campo.label}
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
                        style={{ width: "100%" }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Aviso de campos obrigatórios */}
              {!camposPreenchidos() && (
                <div style={{
                  padding: "12px 16px", background: "var(--bg-input)",
                  border: "1px solid var(--border)", borderRadius: 8,
                  fontSize: 12, color: "var(--muted)", marginBottom: 20,
                }}>
                  Preencha todos os campos para gerar o documento.
                </div>
              )}

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  className="btn-primary"
                  onClick={gerarDocumento}
                  disabled={!camposPreenchidos()}
                  style={{
                    padding: "13px 32px", fontSize: 15,
                    opacity: camposPreenchidos() ? 1 : 0.4,
                    cursor: camposPreenchidos() ? "pointer" : "not-allowed",
                  }}
                >
                  Gerar PDF
                </button>

                {gerado && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, color: "#22c55e", fontWeight: 600,
                  }}>
                    <span></span> Documento gerado! Verifique a janela de impressão.
                  </div>
                )}
              </div>

              <div style={{ marginTop: 16, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
                O documento será aberto em uma nova janela pronto para impressão ou salvar como PDF.
                Revise o conteúdo antes de assinar.
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
