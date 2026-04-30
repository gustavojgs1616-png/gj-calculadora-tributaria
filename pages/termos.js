import Head from "next/head";
import { useRouter } from "next/router";

export default function Termos() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Termos de Uso — GJ Hub Contábil</title>
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
            <div style={{ fontSize: 11, color: "#808CFF" }}>Termos de Uso</div>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 28px 80px" }}>

          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#F5F6FF", marginBottom: 8 }}>
            Termos de Uso
          </h1>
          <p style={{ color: "#6670B8", fontSize: 13, marginBottom: 40 }}>
            Última atualização: 30 de abril de 2025
          </p>

          <Secao titulo="1. Aceitação dos termos">
            <p>Ao acessar ou utilizar o <strong>GJ Hub Contábil</strong>, você concorda integralmente com estes Termos de Uso. Se não concordar com qualquer disposição, não utilize a plataforma.</p>
            <p>Estes termos constituem um contrato legal entre você e a <strong>GJ Treinamentos Contábeis</strong> (CNPJ 40.625.266/0001-44), operadora da plataforma GJ Hub Contábil.</p>
          </Secao>

          <Secao titulo="2. Descrição do serviço">
            <p>O GJ Hub Contábil é uma plataforma SaaS (Software as a Service) voltada para contadores, estudantes e profissionais de contabilidade, que oferece as seguintes ferramentas:</p>
            <Lista itens={[
              "Simulador Tributário — comparação entre Simples Nacional, Lucro Presumido e Lucro Real",
              "Simulador da Reforma Tributária — impacto da LC 214/2025 (IBS/CBS)",
              "Calendário Fiscal — obrigações fiscais mensais e anuais",
              "Consulta CNPJ — dados cadastrais via Receita Federal",
              "Calculadora de Honorários Contábeis",
              "Gerador de Documentos Contábeis",
              "Calculadora de ICMS-ST",
              "Simulado para o Exame de Suficiência CFC",
              "Portal de Notícias Contábeis",
            ]} />
            <p style={{ marginTop: 12 }}>As ferramentas disponíveis variam conforme o plano contratado.</p>
          </Secao>

          <Secao titulo="3. Cadastro e conta de usuário">
            <p>Para utilizar a plataforma, você deverá criar uma conta fornecendo um endereço de e-mail válido. Você é responsável por:</p>
            <Lista itens={[
              "Manter a confidencialidade de suas credenciais de acesso",
              "Todas as atividades realizadas com sua conta",
              "Notificar imediatamente qualquer uso não autorizado da sua conta",
              "Fornecer informações verdadeiras e atualizadas no cadastro",
            ]} />
            <p style={{ marginTop: 12 }}>É vedado compartilhar credenciais de acesso entre múltiplos usuários. Cada conta é de uso pessoal e intransferível.</p>
          </Secao>

          <Secao titulo="4. Planos e pagamento">
            <p>O GJ Hub Contábil oferece os seguintes planos:</p>
            <Lista itens={[
              "Free — acesso gratuito ao portal de notícias",
              "Essencial — ferramentas básicas para o dia a dia contábil",
              "Profissional — ferramentas completas para contadores e escritórios",
              "Especialista — acesso total + simulado CFC e novidades em primeira mão",
            ]} />
            <p style={{ marginTop: 12 }}>Os pagamentos são processados pela plataforma Kiwify. Ao contratar um plano pago, você autoriza a cobrança recorrente na periodicidade escolhida (mensal ou anual).</p>
            <p>Os preços podem ser atualizados mediante aviso prévio de 30 dias por e-mail. A continuidade do uso após o aviso constitui aceite dos novos valores.</p>
          </Secao>

          <Secao titulo="5. Cancelamento e reembolso">
            <p>Você pode cancelar sua assinatura a qualquer momento, sem multa ou fidelidade:</p>
            <Lista itens={[
              "O cancelamento pode ser solicitado pelo e-mail contato@gjsolucoescontabeis.com.br ou diretamente na plataforma Kiwify",
              "Após o cancelamento, o acesso às ferramentas pagas permanece ativo até o fim do período já pago",
              "Reembolsos serão concedidos nos casos previstos pelo Código de Defesa do Consumidor (CDC), incluindo o direito de arrependimento de 7 dias para compras realizadas online",
              "Solicitações de reembolso devem ser feitas em até 7 dias corridos após a contratação",
            ]} />
          </Secao>

          <Secao titulo="6. Uso aceitável">
            <p>Você concorda em utilizar a plataforma somente para fins lícitos e de acordo com estes Termos. É expressamente vedado:</p>
            <Lista itens={[
              "Utilizar a plataforma para fins ilegais, fraudulentos ou que violem direitos de terceiros",
              "Tentar acessar áreas restritas da plataforma ou de outros usuários",
              "Realizar engenharia reversa, descompilar ou extrair o código-fonte da aplicação",
              "Utilizar bots, scrapers ou qualquer automação para acessar a plataforma sem autorização",
              "Reproduzir, redistribuir ou revender o conteúdo da plataforma sem autorização expressa",
              "Inserir dados maliciosos, vírus ou código prejudicial na plataforma",
              "Compartilhar sua conta com terceiros",
            ]} />
          </Secao>

          <Secao titulo="7. Natureza estimativa das simulações">
            <p>As ferramentas de simulação tributária do GJ Hub Contábil têm caráter exclusivamente <strong>estimativo e educacional</strong>. Os resultados apresentados:</p>
            <Lista itens={[
              "São baseados nas informações fornecidas pelo usuário e na legislação vigente no momento do cálculo",
              "Não constituem consultoria tributária, contábil ou jurídica",
              "Podem não refletir a totalidade das variáveis aplicáveis a cada caso concreto",
              "Não substituem a análise de um profissional contábil habilitado",
            ]} />
            <p style={{ marginTop: 12 }}>A GJ Treinamentos Contábeis não se responsabiliza por decisões tomadas com base exclusiva nas simulações realizadas na plataforma.</p>
          </Secao>

          <Secao titulo="8. Propriedade intelectual">
            <p>Todo o conteúdo da plataforma — incluindo textos, interfaces, algoritmos, logotipos e código-fonte — é de propriedade da GJ Treinamentos Contábeis e está protegido pela legislação de propriedade intelectual brasileira.</p>
            <p>Os dados inseridos pelo usuário nas ferramentas permanecem de sua propriedade. Ao utilizar a plataforma, você nos concede licença limitada para processar esses dados com o único objetivo de prestar os serviços contratados.</p>
          </Secao>

          <Secao titulo="9. Disponibilidade e manutenção">
            <p>Envidamos os melhores esforços para manter a plataforma disponível 24 horas por dia, 7 dias por semana. Contudo, não garantimos disponibilidade ininterrupta, podendo ocorrer:</p>
            <Lista itens={[
              "Manutenções programadas, com aviso prévio sempre que possível",
              "Interrupções por fatores externos fora do nosso controle (infraestrutura de terceiros, força maior)",
              "Atualizações e melhorias que possam causar indisponibilidade temporária",
            ]} />
          </Secao>

          <Secao titulo="10. Limitação de responsabilidade">
            <p>Na máxima extensão permitida pela legislação aplicável, a GJ Treinamentos Contábeis não será responsável por:</p>
            <Lista itens={[
              "Danos indiretos, incidentais ou consequentes decorrentes do uso da plataforma",
              "Perdas financeiras decorrentes de decisões baseadas nas simulações realizadas",
              "Interrupções no serviço causadas por terceiros ou força maior",
              "Danos causados por uso indevido da plataforma pelo usuário",
            ]} />
            <p style={{ marginTop: 12 }}>Nossa responsabilidade total, em qualquer hipótese, fica limitada ao valor pago pelo usuário nos últimos 3 meses de assinatura.</p>
          </Secao>

          <Secao titulo="11. Rescisão">
            <p>Podemos suspender ou encerrar sua conta, sem aviso prévio, nos seguintes casos:</p>
            <Lista itens={[
              "Violação destes Termos de Uso",
              "Uso fraudulento ou abusivo da plataforma",
              "Inadimplência no pagamento da assinatura",
              "Determinação judicial ou de autoridade competente",
            ]} />
            <p style={{ marginTop: 12 }}>Você pode encerrar sua conta a qualquer momento pelo e-mail contato@gjsolucoescontabeis.com.br.</p>
          </Secao>

          <Secao titulo="12. Alterações nos termos">
            <p>Reservamo-nos o direito de atualizar estes Termos de Uso a qualquer momento. Alterações relevantes serão comunicadas por e-mail com antecedência mínima de 10 dias. O uso continuado após a vigência das alterações constitui aceite.</p>
          </Secao>

          <Secao titulo="13. Lei aplicável e foro">
            <p>Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil, em especial pelo Código de Defesa do Consumidor (Lei nº 8.078/1990), pelo Marco Civil da Internet (Lei nº 12.965/2014) e pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
            <p>Fica eleito o foro da comarca de <strong>São Paulo/SP</strong> para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
          </Secao>

          <Secao titulo="14. Contato">
            <div style={{
              background: "#E0E3FF08", border: "1px solid #E0E3FF15",
              borderRadius: 12, padding: "16px 20px", marginTop: 4,
            }}>
              <div style={{ fontSize: 14, color: "#F5F6FF", marginBottom: 4 }}><strong>GJ Treinamentos Contábeis</strong></div>
              <div style={{ fontSize: 13, color: "#808CFF" }}>CNPJ: 40.625.266/0001-44</div>
              <div style={{ fontSize: 13, color: "#808CFF" }}>São Paulo/SP</div>
              <div style={{ fontSize: 13, color: "#808CFF" }}>E-mail: contato@gjsolucoescontabeis.com.br</div>
            </div>
          </Secao>

          <div style={{
            marginTop: 48, padding: "20px 24px",
            background: "#E0E3FF06", border: "1px solid #E0E3FF10",
            borderRadius: 12, fontSize: 12, color: "#6670B8", lineHeight: 1.7,
          }}>
            Estes Termos de Uso foram elaborados em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/1990), Marco Civil da Internet (Lei nº 12.965/2014), Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e demais normas aplicáveis ao direito digital brasileiro.
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
