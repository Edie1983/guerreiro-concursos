// src/pages/Suporte/index.tsx
import { route } from "preact-router";
import { Mail, MessageCircle, Clock, HelpCircle } from "preact-feather";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./style.css";

export default function Suporte() {
  return (
    <PageWrapper
      title="Suporte"
      subtitle="Estamos aqui para ajudar você a conquistar sua vaga"
    >
      <div class="gc-legal-page">
        <div class="gc-content">
          <div class="gc-card gc-support-card">
            <h2 class="gc-support-title">Entre em Contato</h2>
            <div class="gc-support-contact-grid">
              <div class="gc-support-contact-item">
                <Mail size={24} />
                <div>
                  <div class="gc-support-contact-label">Email</div>
                  <div class="gc-support-contact-value">suporte@guerreiroconcursos.com</div>
                </div>
              </div>
              <div class="gc-support-contact-item">
                <MessageCircle size={24} />
                <div>
                  <div class="gc-support-contact-label">WhatsApp</div>
                  <div class="gc-support-contact-value">(11) 99999-9999</div>
                </div>
              </div>
              <div class="gc-support-contact-item">
                <Clock size={24} />
                <div>
                  <div class="gc-support-contact-label">Horário de Atendimento</div>
                  <div class="gc-support-contact-value">Segunda a Sexta, 9h às 18h</div>
                </div>
              </div>
            </div>
          </div>

          <div class="gc-card gc-support-card">
            <h2 class="gc-support-title">
              <HelpCircle size={20} />
              Perguntas Frequentes
            </h2>
            <div class="gc-support-faq">
              <div class="gc-support-faq-item">
                <div class="gc-support-faq-question">Como faço upload de um edital?</div>
                <div class="gc-support-faq-answer">
                  Vá para a página "Upload de Edital", selecione o arquivo PDF e clique em "Enviar e Processar". 
                  O sistema irá extrair e organizar o conteúdo automaticamente.
                </div>
              </div>

              <div class="gc-support-faq-item">
                <div class="gc-support-faq-question">Qual é o limite de editais no plano Free?</div>
                <div class="gc-support-faq-answer">
                  O plano Free permite até 2 editais. Para uploads ilimitados, faça upgrade para Premium.
                </div>
              </div>

              <div class="gc-support-faq-item">
                <div class="gc-support-faq-question">Meu PDF não está sendo processado corretamente</div>
                <div class="gc-support-faq-answer">
                  Certifique-se de que o PDF contém texto selecionável (não é uma imagem escaneada). 
                  PDFs escaneados precisam de OCR antes do upload. Se o problema persistir, entre em contato.
                </div>
              </div>

              <div class="gc-support-faq-item">
                <div class="gc-support-faq-question">Como cancelar minha assinatura Premium?</div>
                <div class="gc-support-faq-answer">
                  Entre em contato através do email ou WhatsApp acima para solicitar o cancelamento. 
                  Você continuará tendo acesso até o fim do período pago.
                </div>
              </div>

              <div class="gc-support-faq-item">
                <div class="gc-support-faq-question">Posso deletar meus editais?</div>
                <div class="gc-support-faq-answer">
                  Sim, você pode deletar seus editais a qualquer momento. 
                  A funcionalidade de exclusão estará disponível em breve na interface.
                </div>
              </div>
            </div>
          </div>

          <div class="gc-card gc-support-card">
            <h2 class="gc-support-title">Links Rápidos</h2>
            <div class="gc-support-links">
              <button class="gc-support-link-btn" onClick={() => route("/app/termos", true)}>
                Termos de Uso
              </button>
              <button class="gc-support-link-btn" onClick={() => route("/app/privacidade", true)}>
                Política de Privacidade
              </button>
              <button class="gc-support-link-btn" onClick={() => route("/app/planos", true)}>
                Planos e Preços
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
