import Head from "next/head";
import { useRouter } from "next/router";

export default function Privacidade() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Política de Privacidade — GJ Hub Contábil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 30% 20%, #0a0e3a 0%, #000433 50%, #00031F 100%)",
        color: "#E0E3FF",
        fontFamily: "'Saira', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          borderBottom: "1px solid #E0E3FF12",
          padding: "20px 28px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <button onClick={() => router.back()} style={{
            background: "none", border: "1px solid #E0E3FF20", color: "#808CFF",
            borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer",
          }}>← Voltar</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F5F6FF" }}>GJ Hub Contábil</div>
            <div style={{ fontSize: 11, color: "#808CFF" }}>Política de Privacidade</div>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 28px 80px" }}>

          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#F5F6FF", marginBottom: 8 }}>
            Política de Privacidade
          </h1>
          <p style={{ color: "#6670B8", fontSize: 13, marginBottom: 40 }}>
            Última atualização: 30 de abril de 2025
          </p>

          <Secao titulo="1. Identificação do Controlador">
            <p>O <strong>GJ Hub Contábil</strong> é operado por <strong>GJ Treinamentos Contábeis</strong>,
            inscrita no CNPJ sob o nº <strong>40.625.266/0001-44</strong>, com sede na cidade de
            <strong> São Paulo/SP</strong>.</p>
            <p>Para questões relacionadas à privacidade e proteção de dados, entre em contato pelo e-mail:
            <strong> contato@gjsolucoescontabeis.com.br</strong></p>
          </Secao>

          <Secao titulo="2. Quais dados coletamos">
            <p>Coletamos os seguintes dados pessoais para a prestação dos nossos serviços:</p>
            <Lista itens={[
              "Endereço de e-mail — utilizado para criação de conta, autenticação e comunicações do serviço",
              "Dados de uso da plataforma — simulações realizadas, ferramentas acessadas e histórico de atividade",
              "Dados inseridos nas ferramentas — informações de empresas simuladas (CNPJ, faturamento, regime tributário), que são de responsabilidade do usuário",
              "Informações de pagamento — processadas exclusivamente pela Kiwify; não armazenamos dados de cartão de crédito",
              "Dados técnicos — endereço IP, tipo de navegador e sistema operacional, coletados automaticamente para segurança e diagnóstico",
            ]} />
          </Secao>

          <Secao titulo="3. Finalidade do tratamento">
            <p>Os dados coletados são utilizados para:</p>
            <Lista itens={[
              "Autenticação e controle de acesso à plataforma",
              "Prestação das ferramentas contábeis e tributárias contratadas",
              "Envio de comunicações transacionais (recuperação de senha, confirmação de cadastro)",
              "Melhoria contínua da plataforma e correção de erros",
              "Cumprimento de obrigações legais e regulatórias",
              "Prevenção de fraudes e garantia da segurança da plataforma",
            ]} />
          </Secao>

          <Secao titulo="4. Base legal para o tratamento (LGPD)">
            <p>O tratamento dos seus dados pessoais é realizado com fundamento nas seguintes bases legais previstas na Lei nº 13.709/2018 (LGPD):</p>
            <Lista itens={[
              "Execução de contrato: para viabilizar o acesso aos serviços contratados",
              "Legítimo interesse: para segurança da plataforma, prevenção de fraudes e melhoria dos serviços",
              "Cumprimento de obrigação legal: quando exigido por lei ou regulamento aplicável",
              "Consentimento: para envio de comunicações de marketing, quando aplicável",
            ]} />
          </Secao>

          <Secao titulo="5. Compartilhamento de dados">
            <p>Seus dados podem ser compartilhados com os seguintes terceiros, estritamente para viabilizar a prestação dos serviços:</p>
            <Lista itens={[
              "Supabase Inc. — infraestrutura de banco de dados e autenticação",
              "Vercel Inc. — hospedagem e entrega da aplicação",
              "Resend Inc. — envio de e-mails transacionais",
              "Kiwify — processamento de pagamentos e gestão de assinaturas",
            ]} />
            <p style={{ marginTop: 12 }}>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing sem seu consentimento explícito.</p>
          </Secao>

          <Secao titulo="6. Retenção de dados">
            <p>Seus dados são mantidos pelo período necessário para a prestação dos serviços contratados e cumprimento de obrigações legais:</p>
            <Lista itens={[
              "Dados de conta: enquanto a conta estiver ativa",
              "Dados de simulações: até 2 anos após o encerramento da conta",
              "Registros de acesso (logs): por 6 meses, conforme exigência do Marco Civil da Internet",
              "Dados fiscais e financeiros: por 5 anos, conforme legislação tributária brasileira",
            ]} />
          </Secao>

          <Secao titulo="7. Seus direitos como titular (LGPD)">
            <p>Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <Lista itens={[
              "Confirmação da existência de tratamento dos seus dados",
              "Acesso aos dados pessoais que mantemos sobre você",
              "Correção de dados incompletos, inexatos ou desatualizados",
              "Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos",
              "Portabilidade dos dados a outro fornecedor de serviço",
              "Eliminação dos dados pessoais tratados com base no consentimento",
              "Informação sobre as entidades com as quais compartilhamos seus dados",
              "Revogação do consentimento a qualquer momento",
            ]} />
            <p style={{ marginTop: 12 }}>Para exercer qualquer desses direitos, entre em contato pelo e-mail <strong>contato@gjsolucoescontabeis.com.br</strong>. Responderemos em até 15 dias úteis.</p>
          </Secao>

          <Secao titulo="8. Segurança dos dados">
            <p>Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, perda, alteração ou divulgação indevida, incluindo:</p>
            <Lista itens={[
              "Criptografia de dados em trânsito (HTTPS/TLS)",
              "Autenticação segura via Supabase Auth",
              "Controle de acesso baseado em funções (Row Level Security)",
              "Senhas armazenadas em formato criptografado (nunca em texto plano)",
            ]} />
          </Secao>

          <Secao titulo="9. Cookies e tecnologias semelhantes">
            <p>Utilizamos cookies e tecnologias similares para:</p>
            <Lista itens={[
              "Manter sua sessão autenticada na plataforma",
              "Lembrar suas preferências de uso",
              "Garantir a segurança da sua conta",
            ]} />
            <p style={{ marginTop: 12 }}>Não utilizamos cookies de rastreamento para publicidade de terceiros.</p>
          </Secao>

          <Secao titulo="10. Alterações nesta política">
            <p>Podemos atualizar esta Política de Privacidade periodicamente. Quando houver alterações relevantes, notificaremos você por e-mail ou por aviso na plataforma. O uso continuado dos serviços após a notificação constitui aceite das alterações.</p>
          </Secao>

          <Secao titulo="11. Contato e DPO">
            <p>Para dúvidas, solicitações ou reclamações relacionadas ao tratamento dos seus dados pessoais:</p>
            <div style={{
              background: "#E0E3FF08", border: "1px solid #E0E3FF15",
              borderRadius: 12, padding: "16px 20px", marginTop: 12,
            }}>
              <div style={{ fontSize: 14, color: "#F5F6FF", marginBottom: 4 }}><strong>GJ Treinamentos Contábeis</strong></div>
              <div style={{ fontSize: 13, color: "#808CFF" }}>CNPJ: 40.625.266/0001-44</div>
              <div style={{ fontSize: 13, color: "#808CFF" }}>São Paulo/SP</div>
              <div style={{ fontSize: 13, color: "#808CFF" }}>E-mail: contato@gjsolucoescontabeis.com.br</div>
            </div>
            <p style={{ marginTop: 12 }}>Você também pode registrar reclamações perante a Autoridade Nacional de Proteção de Dados (ANPD) em <strong>gov.br/anpd</strong>.</p>
          </Secao>

          <div style={{
            marginTop: 48, padding: "20px 24px",
            background: "#E0E3FF06", border: "1px solid #E0E3FF10",
            borderRadius: 12, fontSize: 12, color: "#6670B8", lineHeight: 1.7,
          }}>
            Esta Política de Privacidade foi elaborada em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014) e demais normas aplicáveis.
          </div>
        </div>
      </div>
    </>
  );
}

function Secao({ titulo, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#808CFF", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #E0E3FF10" }}>
        {titulo}
      </h2>
      <div style={{ fontSize: 14, color: "#C8CBFF", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function Lista({ itens }) {
  return (
    <ul style={{ paddingLeft: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {itens.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", listStyle: "none" }}>
          <span style={{ color: "#808CFF", flexShrink: 0, marginTop: 2 }}>▸</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
