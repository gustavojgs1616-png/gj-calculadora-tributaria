import { useRouter } from "next/router";
import { PLANOS } from "../lib/planos";

export default function CardBloqueado({ ferramenta, planoNecessario }) {
  const router = useRouter();
  const plano = PLANOS[planoNecessario] || PLANOS.profissional;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", textAlign: "center",
      padding: "80px 32px", maxWidth: 480, margin: "60px auto",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: `${plano.cor}18`,
        border: `2px solid ${plano.cor}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, marginBottom: 24,
      }}>
        🔒
      </div>

      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
        Ferramenta bloqueada
      </div>
      <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 8 }}>
        Esta ferramenta está disponível a partir do
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: `${plano.cor}18`, color: plano.cor,
        padding: "6px 16px", borderRadius: 20,
        fontSize: 14, fontWeight: 800, marginBottom: 28,
      }}>
        🔐 Plano {plano.nome}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          className="btn-primary"
          onClick={() => router.push("/assinatura")}
          style={{ padding: "12px 28px" }}
        >
          Ver planos e fazer upgrade →
        </button>
        <button
          className="btn-ghost"
          onClick={() => router.back()}
          style={{ padding: "12px 20px" }}
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
