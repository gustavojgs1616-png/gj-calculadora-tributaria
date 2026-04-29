// ─── Utilitários ───────────────────────────────────────────────────────────────
function hoje() {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function maskCNPJ(v = "") {
  return v.replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

function maskCPF(v = "") {
  return v.replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}

function estiloBase() {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: #fff; padding: 40px 60px; line-height: 1.8; }
      .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #000; padding-bottom: 16px; }
      .header h1 { font-size: 15pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
      .header p { font-size: 10pt; color: #444; margin-top: 4px; }
      h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 24px 0 8px; }
      p { margin-bottom: 12px; text-align: justify; }
      .clausula { margin-bottom: 20px; }
      .clausula-titulo { font-weight: bold; }
      .assinaturas { margin-top: 60px; display: flex; justify-content: space-between; gap: 40px; }
      .assinatura-bloco { flex: 1; text-align: center; border-top: 1px solid #000; padding-top: 8px; font-size: 10pt; }
      .rodape { margin-top: 40px; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 12px; }
      .destaque { font-weight: bold; }
      ul { margin: 8px 0 12px 24px; }
      li { margin-bottom: 4px; }
      @media print { body { padding: 20px 40px; } }
    </style>`;
}

// ─── Modelos ───────────────────────────────────────────────────────────────────

export const DOCUMENTOS = [
  {
    id: "contrato_servicos",
    titulo: "Contrato de Prestação de Serviços Contábeis",
    icone: "📄",
    descricao: "Contrato completo entre contador e cliente com serviços, honorários e cláusulas.",
    campos: [
      { id: "nome_escritorio",   label: "Nome do Escritório / Contador",  tipo: "text",   placeholder: "Ex: GJ Contabilidade Ltda" },
      { id: "cnpj_escritorio",   label: "CNPJ do Escritório",             tipo: "cnpj",   placeholder: "00.000.000/0000-00" },
      { id: "crc_contador",      label: "Número do CRC",                  tipo: "text",   placeholder: "Ex: CRC/SP 123456" },
      { id: "endereco_escritorio",label: "Endereço do Escritório",         tipo: "text",   placeholder: "Rua, número, cidade - UF" },
      { id: "nome_cliente",      label: "Nome / Razão Social do Cliente",  tipo: "text",   placeholder: "Ex: Empresa ABC Ltda" },
      { id: "cnpj_cliente",      label: "CNPJ do Cliente",                tipo: "cnpj",   placeholder: "00.000.000/0000-00" },
      { id: "endereco_cliente",  label: "Endereço do Cliente",            tipo: "text",   placeholder: "Rua, número, cidade - UF" },
      { id: "regime_tributario", label: "Regime Tributário",              tipo: "select", opcoes: ["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"] },
      { id: "valor_honorario",   label: "Valor Mensal dos Honorários (R$)", tipo: "text", placeholder: "Ex: 850,00" },
      { id: "dia_vencimento",    label: "Dia de Vencimento",              tipo: "text",   placeholder: "Ex: 10" },
      { id: "data_inicio",       label: "Data de Início do Contrato",     tipo: "text",   placeholder: "Ex: 01/01/2026" },
      { id: "prazo_aviso",       label: "Prazo de Aviso Prévio (dias)",   tipo: "text",   placeholder: "Ex: 30" },
      { id: "cidade_contrato",   label: "Cidade para o Foro",             tipo: "text",   placeholder: "Ex: São Paulo" },
      { id: "uf_foro",           label: "UF do Foro",                     tipo: "text",   placeholder: "Ex: SP" },
    ],
    gerarHTML: (f) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Contrato de Serviços Contábeis</title>${estiloBase()}</head><body>
      <div class="header">
        <h1>Contrato de Prestação de Serviços Contábeis</h1>
        <p>${f.nome_escritorio} — ${f.cnpj_escritorio}</p>
      </div>

      <p>Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente <span class="destaque">Contrato de Prestação de Serviços Contábeis</span>, que se regerá pelas cláusulas seguintes e pelos preceitos de direito aplicáveis:</p>

      <h2>Das Partes</h2>
      <p><span class="destaque">CONTRATADA:</span> ${f.nome_escritorio}, inscrita no CNPJ sob o nº ${f.cnpj_escritorio}, com sede em ${f.endereco_escritorio}, registrada no ${f.crc_contador}, doravante denominada simplesmente CONTRATADA.</p>
      <p><span class="destaque">CONTRATANTE:</span> ${f.nome_cliente}, inscrita no CNPJ sob o nº ${f.cnpj_cliente}, com sede em ${f.endereco_cliente}, doravante denominada simplesmente CONTRATANTE.</p>

      <div class="clausula">
        <h2>Cláusula 1ª — Do Objeto</h2>
        <p>O presente contrato tem por objeto a prestação de serviços contábeis, fiscais e trabalhistas pela CONTRATADA à CONTRATANTE, enquadrada no regime tributário de <span class="destaque">${f.regime_tributario}</span>, compreendendo:</p>
        <ul>
          <li>Escrituração contábil e fiscal</li>
          <li>Apuração de impostos e encargos sociais</li>
          <li>Entrega de obrigações acessórias</li>
          <li>Elaboração e transmissão de declarações</li>
          <li>Folha de pagamento e gestão trabalhista</li>
          <li>Assessoria e orientação tributária</li>
        </ul>
      </div>

      <div class="clausula">
        <h2>Cláusula 2ª — Dos Honorários</h2>
        <p>Pelos serviços ora contratados, a CONTRATANTE pagará à CONTRATADA o valor mensal de <span class="destaque">R$ ${f.valor_honorario}</span>, com vencimento todo dia <span class="destaque">${f.dia_vencimento}</span> de cada mês.</p>
        <p>O não pagamento dos honorários no prazo estipulado sujeitará a CONTRATANTE à multa de 2% (dois por cento) sobre o valor devido, acrescida de juros moratórios de 1% (um por cento) ao mês e atualização monetária pelo IGPM/FGV.</p>
      </div>

      <div class="clausula">
        <h2>Cláusula 3ª — Das Obrigações da CONTRATANTE</h2>
        <p>São obrigações da CONTRATANTE:</p>
        <ul>
          <li>Fornecer todos os documentos necessários até o 5º dia útil de cada mês</li>
          <li>Manter seus dados cadastrais atualizados junto à CONTRATADA</li>
          <li>Comunicar imediatamente qualquer alteração societária ou operacional</li>
          <li>Manter saldo disponível para o pagamento de impostos e encargos</li>
          <li>Assinar documentos e declarações no prazo solicitado pela CONTRATADA</li>
        </ul>
      </div>

      <div class="clausula">
        <h2>Cláusula 4ª — Das Obrigações da CONTRATADA</h2>
        <p>São obrigações da CONTRATADA:</p>
        <ul>
          <li>Executar os serviços com zelo, competência e dentro dos prazos legais</li>
          <li>Manter sigilo absoluto sobre as informações da CONTRATANTE</li>
          <li>Comunicar eventuais irregularidades ou riscos identificados</li>
          <li>Manter-se atualizada quanto à legislação tributária vigente</li>
        </ul>
      </div>

      <div class="clausula">
        <h2>Cláusula 5ª — Do Prazo e da Rescisão</h2>
        <p>O presente contrato entra em vigor em <span class="destaque">${f.data_inicio}</span>, por prazo indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio de <span class="destaque">${f.prazo_aviso} (${f.prazo_aviso} dias)</span>.</p>
        <p>A rescisão imotivada pela CONTRATANTE não exclui as obrigações de pagamento dos serviços já prestados, incluindo o período de aviso prévio.</p>
      </div>

      <div class="clausula">
        <h2>Cláusula 6ª — Do Foro</h2>
        <p>As partes elegem o foro da Comarca de <span class="destaque">${f.cidade_contrato}/${f.uf_foro}</span> para dirimir quaisquer controvérsias oriundas do presente contrato, renunciando a qualquer outro, por mais privilegiado que seja.</p>
      </div>

      <p>E por estarem justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma, na presença de duas testemunhas.</p>
      <p style="text-align:center; margin-top: 8px;">${f.cidade_contrato}, ${hoje()}</p>

      <div class="assinaturas">
        <div class="assinatura-bloco">${f.nome_escritorio}<br/>${f.cnpj_escritorio}<br/><small>CONTRATADA</small></div>
        <div class="assinatura-bloco">${f.nome_cliente}<br/>${f.cnpj_cliente}<br/><small>CONTRATANTE</small></div>
      </div>
      <div class="assinaturas" style="margin-top:40px;">
        <div class="assinatura-bloco">Testemunha 1<br/><small>CPF: ___________________</small></div>
        <div class="assinatura-bloco">Testemunha 2<br/><small>CPF: ___________________</small></div>
      </div>

      <div class="rodape">Documento gerado pelo GJ Contábil Pro — ${hoje()}</div>
    </body></html>`,
  },

  {
    id: "procuracao_pgfn",
    titulo: "Procuração PGFN",
    icone: "⚖️",
    descricao: "Procuração para o contador representar o cliente perante a Receita Federal e PGFN.",
    campos: [
      { id: "nome_outorgante",    label: "Nome / Razão Social do Outorgante", tipo: "text", placeholder: "Ex: Empresa ABC Ltda" },
      { id: "cnpj_outorgante",    label: "CNPJ do Outorgante",               tipo: "cnpj", placeholder: "00.000.000/0000-00" },
      { id: "endereco_outorgante",label: "Endereço do Outorgante",            tipo: "text", placeholder: "Rua, número, cidade - UF" },
      { id: "nome_representante", label: "Nome do Representante Legal",       tipo: "text", placeholder: "Nome do sócio/diretor" },
      { id: "cpf_representante",  label: "CPF do Representante Legal",        tipo: "cpf",  placeholder: "000.000.000-00" },
      { id: "nome_outorgado",     label: "Nome do Contador (Outorgado)",      tipo: "text", placeholder: "Ex: João da Silva" },
      { id: "cpf_outorgado",      label: "CPF do Contador",                  tipo: "cpf",  placeholder: "000.000.000-00" },
      { id: "crc_outorgado",      label: "CRC do Contador",                  tipo: "text", placeholder: "Ex: CRC/SP 123456" },
      { id: "cidade",             label: "Cidade",                           tipo: "text", placeholder: "Ex: São Paulo" },
    ],
    gerarHTML: (f) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Procuração PGFN</title>${estiloBase()}</head><body>
      <div class="header">
        <h1>Procuração</h1>
        <p>Para fins de representação perante a Receita Federal do Brasil e PGFN</p>
      </div>

      <p><span class="destaque">OUTORGANTE:</span> ${f.nome_outorgante}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${f.cnpj_outorgante}, com sede em ${f.endereco_outorgante}, neste ato representada por ${f.nome_representante}, CPF nº ${f.cpf_representante}.</p>

      <p><span class="destaque">OUTORGADO:</span> ${f.nome_outorgado}, contador inscrito no ${f.crc_outorgado}, CPF nº ${f.cpf_outorgado}.</p>

      <h2>Poderes Conferidos</h2>
      <p>Pelo presente instrumento, o OUTORGANTE nomeia e constitui seu bastante procurador o OUTORGADO, a quem confere amplos poderes para:</p>
      <ul>
        <li>Representar a outorgante perante a Receita Federal do Brasil em todos os seus órgãos</li>
        <li>Representar perante a Procuradoria Geral da Fazenda Nacional — PGFN</li>
        <li>Acessar o Portal e-CAC e transmitir declarações</li>
        <li>Requerer certidões, consultar débitos e situação fiscal</li>
        <li>Solicitar parcelamentos e renegociações de débitos fiscais</li>
        <li>Protocolar documentos, recursos e impugnações</li>
        <li>Praticar todos os atos necessários ao fiel cumprimento deste mandato</li>
      </ul>

      <p>Esta procuração é válida por <span class="destaque">1 (um) ano</span> a contar da data de sua assinatura, podendo ser revogada a qualquer tempo por instrumento escrito.</p>

      <p style="text-align:center; margin-top: 24px;">${f.cidade}, ${hoje()}</p>

      <div class="assinaturas">
        <div class="assinatura-bloco">${f.nome_representante}<br/>CPF: ${f.cpf_representante}<br/><small>OUTORGANTE</small></div>
        <div class="assinatura-bloco">${f.nome_outorgado}<br/>${f.crc_outorgado}<br/><small>OUTORGADO</small></div>
      </div>

      <div class="rodape">Documento gerado pelo GJ Contábil Pro — ${hoje()}</div>
    </body></html>`,
  },

  {
    id: "declaracao_nao_optante",
    titulo: "Declaração de Não Optante pelo Simples Nacional",
    icone: "📋",
    descricao: "Declaração formal de que a empresa não é optante pelo Simples Nacional.",
    campos: [
      { id: "razao_social",     label: "Razão Social da Empresa",      tipo: "text", placeholder: "Ex: Empresa ABC Ltda" },
      { id: "cnpj",             label: "CNPJ",                         tipo: "cnpj", placeholder: "00.000.000/0000-00" },
      { id: "regime_atual",     label: "Regime Tributário Atual",      tipo: "select", opcoes: ["Lucro Presumido", "Lucro Real"] },
      { id: "nome_responsavel", label: "Nome do Responsável Legal",    tipo: "text", placeholder: "Nome do sócio/diretor" },
      { id: "cpf_responsavel",  label: "CPF do Responsável Legal",     tipo: "cpf",  placeholder: "000.000.000-00" },
      { id: "cargo_responsavel",label: "Cargo do Responsável",         tipo: "text", placeholder: "Ex: Sócio-Administrador" },
      { id: "cidade",           label: "Cidade",                       tipo: "text", placeholder: "Ex: São Paulo" },
    ],
    gerarHTML: (f) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Declaração de Não Optante</title>${estiloBase()}</head><body>
      <div class="header">
        <h1>Declaração de Não Optante pelo Simples Nacional</h1>
      </div>

      <p>${f.razao_social}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${f.cnpj}, por seu representante legal abaixo assinado, <span class="destaque">DECLARA</span>, para os devidos fins de direito, que:</p>

      <p>1. A empresa acima qualificada <span class="destaque">NÃO É OPTANTE</span> pelo Regime Especial Unificado de Arrecadação de Tributos e Contribuições devidos pelas Microempresas e Empresas de Pequeno Porte — <span class="destaque">SIMPLES NACIONAL</span>;</p>

      <p>2. A empresa encontra-se atualmente enquadrada no regime tributário de <span class="destaque">${f.regime_atual}</span>, nos termos da legislação fiscal vigente;</p>

      <p>3. As informações prestadas nesta declaração são verdadeiras, estando o declarante ciente de que a prestação de informações falsas sujeita o responsável às penalidades previstas em lei, incluindo as disposições do art. 299 do Código Penal Brasileiro.</p>

      <p>Por ser expressão da verdade, assina a presente declaração.</p>

      <p style="text-align:center; margin-top: 24px;">${f.cidade}, ${hoje()}</p>

      <div class="assinaturas" style="justify-content: center;">
        <div class="assinatura-bloco" style="max-width: 300px;">
          ${f.nome_responsavel}<br/>
          CPF: ${f.cpf_responsavel}<br/>
          <small>${f.cargo_responsavel} — ${f.razao_social}</small>
        </div>
      </div>

      <div class="rodape">Documento gerado pelo GJ Contábil Pro — ${hoje()}</div>
    </body></html>`,
  },

  {
    id: "carta_apresentacao",
    titulo: "Carta de Apresentação ao Cliente",
    icone: "✉️",
    descricao: "Carta formal apresentando o escritório e seus serviços a um novo cliente.",
    campos: [
      { id: "nome_escritorio",  label: "Nome do Escritório",            tipo: "text", placeholder: "Ex: GJ Contabilidade" },
      { id: "nome_contador",    label: "Nome do Contador Responsável",  tipo: "text", placeholder: "Ex: João da Silva" },
      { id: "crc",              label: "CRC",                           tipo: "text", placeholder: "Ex: CRC/SP 123456" },
      { id: "telefone",         label: "Telefone / WhatsApp",           tipo: "text", placeholder: "Ex: (11) 99999-9999" },
      { id: "email_escritorio", label: "E-mail do Escritório",          tipo: "text", placeholder: "Ex: contato@escritorio.com.br" },
      { id: "nome_cliente",     label: "Nome / Razão Social do Cliente",tipo: "text", placeholder: "Ex: Empresa XYZ" },
      { id: "cidade",           label: "Cidade",                        tipo: "text", placeholder: "Ex: São Paulo" },
    ],
    gerarHTML: (f) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Carta de Apresentação</title>${estiloBase()}</head><body>
      <div class="header">
        <h1>${f.nome_escritorio}</h1>
        <p>${f.crc} | ${f.telefone} | ${f.email_escritorio}</p>
      </div>

      <p style="text-align:right;">${f.cidade}, ${hoje()}</p>

      <p><span class="destaque">À</span><br/>${f.nome_cliente}</p>

      <p>Prezado(a) cliente,</p>

      <p>É com grande satisfação que o <span class="destaque">${f.nome_escritorio}</span> se apresenta como seu parceiro estratégico para a gestão contábil, fiscal e trabalhista do seu negócio.</p>

      <p>Nosso escritório conta com profissionais devidamente registrados no Conselho Regional de Contabilidade, com vasta experiência em atendimento a empresas dos mais diversos segmentos e regimes tributários.</p>

      <p>Dentre os serviços que oferecemos, destacamos:</p>
      <ul>
        <li>Contabilidade gerencial e societária</li>
        <li>Planejamento e assessoria tributária (Simples Nacional, Lucro Presumido e Lucro Real)</li>
        <li>Gestão de folha de pagamento e obrigações trabalhistas</li>
        <li>Entrega de todas as obrigações acessórias (SPED, eSocial, DCTF, ECD, ECF)</li>
        <li>Abertura, alteração e encerramento de empresas</li>
        <li>Assessoria em regimes especiais e recuperação de créditos tributários</li>
      </ul>

      <p>Colocamo-nos à disposição para apresentar nossa proposta de honorários personalizada, sem compromisso, de acordo com as necessidades específicas da sua empresa.</p>

      <p>Agradecemos sua atenção e ficamos no aguardo de um contato.</p>

      <p style="margin-top: 32px;">Atenciosamente,</p>

      <div class="assinaturas" style="justify-content: flex-start; margin-top: 16px;">
        <div class="assinatura-bloco" style="max-width: 280px; text-align: left; border: none;">
          <strong>${f.nome_contador}</strong><br/>
          ${f.crc}<br/>
          ${f.nome_escritorio}<br/>
          ${f.telefone}<br/>
          ${f.email_escritorio}
        </div>
      </div>

      <div class="rodape">Documento gerado pelo GJ Contábil Pro — ${hoje()}</div>
    </body></html>`,
  },

  {
    id: "declaracao_mei",
    titulo: "Declaração MEI",
    icone: "🏪",
    descricao: "Declaração de enquadramento e condição de Microempreendedor Individual.",
    campos: [
      { id: "nome_mei",      label: "Nome Completo do MEI",         tipo: "text", placeholder: "Ex: Maria da Silva" },
      { id: "cpf_mei",       label: "CPF do MEI",                   tipo: "cpf",  placeholder: "000.000.000-00" },
      { id: "cnpj_mei",      label: "CNPJ do MEI",                  tipo: "cnpj", placeholder: "00.000.000/0000-00" },
      { id: "nome_fantasia", label: "Nome Fantasia (se houver)",     tipo: "text", placeholder: "Ex: Maria Costura" },
      { id: "atividade",     label: "Atividade Principal",          tipo: "text", placeholder: "Ex: Costureiro(a) em estabelecimento" },
      { id: "endereco",      label: "Endereço do Negócio",          tipo: "text", placeholder: "Rua, número, cidade - UF" },
      { id: "finalidade",    label: "Finalidade da Declaração",     tipo: "text", placeholder: "Ex: Abertura de conta bancária PJ" },
      { id: "cidade",        label: "Cidade",                       tipo: "text", placeholder: "Ex: São Paulo" },
    ],
    gerarHTML: (f) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Declaração MEI</title>${estiloBase()}</head><body>
      <div class="header">
        <h1>Declaração de Microempreendedor Individual</h1>
      </div>

      <p>Eu, <span class="destaque">${f.nome_mei}</span>, inscrito(a) no CPF sob o nº <span class="destaque">${f.cpf_mei}</span>, Microempreendedor Individual registrado(a) no CNPJ sob o nº <span class="destaque">${f.cnpj_mei}</span>${f.nome_fantasia ? `, nome fantasia <strong>${f.nome_fantasia}</strong>` : ""}, com atividade principal de <span class="destaque">${f.atividade}</span>, estabelecido(a) em ${f.endereco}, <span class="destaque">DECLARO</span>, para fins de <span class="destaque">${f.finalidade}</span>, que:</p>

      <p>1. Estou devidamente enquadrado(a) como <span class="destaque">Microempreendedor Individual — MEI</span>, nos termos do art. 18-A da Lei Complementar nº 123/2006, com todos os registros em situação regular;</p>

      <p>2. Exerço minhas atividades de forma autônoma, recolhendo os tributos devidos através do Documento de Arrecadação do Simples Nacional — DAS MEI, de forma regular;</p>

      <p>3. As informações aqui prestadas são verdadeiras, e estou ciente de que a prestação de informações falsas configura crime nos termos do art. 299 do Código Penal.</p>

      <p>Por ser verdade, firmo a presente declaração.</p>

      <p style="text-align:center; margin-top: 24px;">${f.cidade}, ${hoje()}</p>

      <div class="assinaturas" style="justify-content: center;">
        <div class="assinatura-bloco" style="max-width: 300px;">
          ${f.nome_mei}<br/>
          CPF: ${f.cpf_mei}<br/>
          <small>MEI — CNPJ: ${f.cnpj_mei}</small>
        </div>
      </div>

      <div class="rodape">Documento gerado pelo GJ Contábil Pro — ${hoje()}</div>
    </body></html>`,
  },

  {
    id: "carta_encerramento",
    titulo: "Carta de Encerramento de Contrato",
    icone: "📪",
    descricao: "Comunicado formal de encerramento da relação contratual entre contador e cliente.",
    campos: [
      { id: "nome_escritorio",   label: "Nome do Escritório / Contador", tipo: "text", placeholder: "Ex: GJ Contabilidade" },
      { id: "nome_cliente",      label: "Nome / Razão Social do Cliente", tipo: "text", placeholder: "Ex: Empresa ABC Ltda" },
      { id: "cnpj_cliente",      label: "CNPJ do Cliente",               tipo: "cnpj", placeholder: "00.000.000/0000-00" },
      { id: "data_encerramento", label: "Data de Encerramento",          tipo: "text", placeholder: "Ex: 31/03/2026" },
      { id: "quem_encerra",      label: "Quem está encerrando",          tipo: "select", opcoes: ["O escritório contábil", "O cliente"] },
      { id: "motivo",            label: "Motivo (opcional)",             tipo: "text", placeholder: "Ex: encerramento das atividades" },
      { id: "nome_contador",     label: "Nome do Contador Responsável",  tipo: "text", placeholder: "Ex: João da Silva" },
      { id: "cidade",            label: "Cidade",                        tipo: "text", placeholder: "Ex: São Paulo" },
    ],
    gerarHTML: (f) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Carta de Encerramento</title>${estiloBase()}</head><body>
      <div class="header">
        <h1>Carta de Encerramento de Contrato Contábil</h1>
        <p>${f.nome_escritorio}</p>
      </div>

      <p style="text-align:right;">${f.cidade}, ${hoje()}</p>
      <p><span class="destaque">À</span><br/>${f.nome_cliente}<br/>CNPJ: ${f.cnpj_cliente}</p>

      <p>Prezado(a) cliente,</p>

      <p>Por meio da presente, ${f.quem_encerra === "O escritório contábil" ? `o escritório <strong>${f.nome_escritorio}</strong> comunica` : `comunicamos o recebimento de sua solicitação de encerramento`} o encerramento da relação contratual de prestação de serviços contábeis${f.motivo ? ` em virtude de <strong>${f.motivo}</strong>` : ""}, com data efetiva em <span class="destaque">${f.data_encerramento}</span>.</p>

      <p>Informamos que, até a data de encerramento acima indicada, todos os serviços contratados serão devidamente concluídos, incluindo:</p>
      <ul>
        <li>Entrega de todas as obrigações acessórias com vencimento até ${f.data_encerramento}</li>
        <li>Apuração e informação dos impostos devidos até a data de encerramento</li>
        <li>Disponibilização de todos os arquivos digitais, livros e documentos contábeis</li>
        <li>Orientações necessárias para a transição ao novo escritório</li>
      </ul>

      <p>Solicitamos a quitação de eventuais honorários em aberto até a data de ${f.data_encerramento}, bem como a regularização de qualquer pendência documental.</p>

      <p>Agradecemos a parceria e confiança depositada em nossos serviços ao longo do período de atendimento, desejando muito sucesso em sua trajetória.</p>

      <p style="margin-top: 32px;">Atenciosamente,</p>

      <div class="assinaturas" style="justify-content: flex-start; margin-top: 16px;">
        <div class="assinatura-bloco" style="max-width: 280px;">
          ${f.nome_contador}<br/>
          <small>${f.nome_escritorio}</small>
        </div>
      </div>

      <div class="rodape">Documento gerado pelo GJ Contábil Pro — ${hoje()}</div>
    </body></html>`,
  },
];
