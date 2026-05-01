// Consulta Optantes Simples Nacional — server-side para evitar CORS
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { cnpj } = req.query;
  const cnpjLimpo = (cnpj || "").replace(/\D/g, "");
  if (cnpjLimpo.length !== 14) return res.status(400).json({ error: "CNPJ inválido" });

  try {
    const r = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjLimpo}`, {
      headers: { "User-Agent": "GJContabilPro/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const data = await r.json();
    const s = data?.simples;

    if (!s) {
      return res.status(200).json({ simples_optante: null, erro: "Sem dados de Simples" });
    }

    // Campos reais retornados pela API publica.cnpj.ws:
    // s.simples        = "Sim" | "Não"
    // s.mei            = "Sim" | "Não"
    // s.data_opcao_simples   = "YYYY-MM-DD" | null
    // s.data_exclusao_simples= "YYYY-MM-DD" | null
    // s.data_opcao_mei       = "YYYY-MM-DD" | null
    // s.data_exclusao_mei    = "YYYY-MM-DD" | null

    return res.status(200).json({
      simples_optante:       s.simples === "Sim",
      simples_data_opcao:    s.data_opcao_simples    || null,
      simples_data_exclusao: s.data_exclusao_simples || null,
      simei_optante:         s.mei === "Sim",
      simei_data_opcao:      s.data_opcao_mei        || null,
      simei_data_exclusao:   s.data_exclusao_mei     || null,
      fonte: "cnpj.ws",
    });

  } catch (e) {
    console.warn("[cnpj-simples] falhou:", e.message);
    return res.status(200).json({ simples_optante: null, erro: e.message });
  }
}
