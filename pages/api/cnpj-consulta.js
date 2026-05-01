// Consulta CNPJ completa — dados cadastrais + Simples Nacional
// Fonte primária: publica.cnpj.ws (base mais completa)
// Fallback: brasilapi.com.br

function normalizarCnpjWs(data) {
  const e = data.estabelecimento || {};
  const tel1 = [e.ddd1, e.telefone1].filter(Boolean).join("");
  const tel2 = [e.ddd2, e.telefone2].filter(Boolean).join("");
  const cnae = e.atividade_principal || {};
  const cnaesSecundarios = (e.atividades_secundarias || []).map((c) => ({
    codigo: c.id,
    descricao: c.descricao,
  }));
  const socios = (data.socios || []).map((s) => ({
    nome_socio: s.nome,
    qualificacao_socio: s.qualificacao_socio?.descricao || "",
    cnpj_cpf_do_socio: s.cpf_cnpj_socio || "",
    data_entrada_sociedade: s.data_entrada || null,
  }));

  const s = data.simples || {};

  return {
    // Identificação
    cnpj: e.cnpj || "",
    razao_social: data.razao_social || "",
    nome_fantasia: e.nome_fantasia || "",
    // Cadastro
    data_abertura: e.data_inicio_atividade || null,
    descricao_natureza_juridica: data.natureza_juridica?.descricao || "",
    porte: data.porte?.descricao || "",
    capital_social: parseFloat(data.capital_social || 0),
    descricao_situacao_cadastral: e.situacao_cadastral || "",
    data_situacao_cadastral: e.data_situacao_cadastral || null,
    // Endereço
    tipo_logradouro: e.tipo_logradouro || "",
    logradouro: e.logradouro || "",
    numero: e.numero || "",
    complemento: e.complemento || "",
    bairro: e.bairro || "",
    municipio: e.cidade?.nome || "",
    uf: e.estado?.sigla || "",
    cep: e.cep || "",
    // Contato
    ddd_telefone_1: tel1,
    ddd_telefone_2: tel2,
    email: e.email || "",
    // Atividade
    cnae_fiscal: cnae.subclasse || cnae.id || "",
    cnae_fiscal_descricao: cnae.descricao || "",
    cnaes_secundarios: cnaesSecundarios,
    // Sócios
    qsa: socios,
    // Simples Nacional
    simples: {
      simples_optante:       s.simples === "Sim",
      simples_data_opcao:    s.data_opcao_simples    || null,
      simples_data_exclusao: s.data_exclusao_simples || null,
      simei_optante:         s.mei === "Sim",
      simei_data_opcao:      s.data_opcao_mei        || null,
      simei_data_exclusao:   s.data_exclusao_mei     || null,
    },
    fonte: "cnpj.ws",
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { cnpj } = req.query;
  const cnpjLimpo = (cnpj || "").replace(/\D/g, "");
  if (cnpjLimpo.length !== 14)
    return res.status(400).json({ error: "CNPJ inválido" });

  // ── Fonte primária: publica.cnpj.ws ────────────────────────────────────────
  try {
    const r = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjLimpo}`, {
      headers: { "User-Agent": "GJContabilPro/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (r.ok) {
      const data = await r.json();
      return res.status(200).json(normalizarCnpjWs(data));
    }
    if (r.status === 404) {
      // Tenta BrasilAPI antes de desistir
    } else {
      throw new Error(`cnpj.ws HTTP ${r.status}`);
    }
  } catch (e) {
    console.warn("[cnpj-consulta] cnpj.ws falhou:", e.message);
  }

  // ── Fallback: BrasilAPI ────────────────────────────────────────────────────
  try {
    const r2 = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
      headers: { "User-Agent": "GJContabilPro/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (r2.ok) {
      const data2 = await r2.json();
      // BrasilAPI não tem Simples — retorna com simples null
      return res.status(200).json({ ...data2, simples: null, fonte: "brasilapi" });
    }
    if (r2.status === 404) {
      return res.status(404).json({ error: "CNPJ não encontrado na base da Receita Federal." });
    }
    throw new Error(`brasilapi HTTP ${r2.status}`);
  } catch (e) {
    console.warn("[cnpj-consulta] brasilapi falhou:", e.message);
  }

  return res.status(503).json({ error: "Serviço indisponível. Tente novamente em instantes." });
}
