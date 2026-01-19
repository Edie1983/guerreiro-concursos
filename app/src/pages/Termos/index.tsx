// src/pages/Termos/index.tsx
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./style.css";

export default function Termos() {
  return (
    <PageWrapper
      title="Termos de Uso"
      subtitle="Regras e condições para o uso seguro da plataforma"
    >
      <div class="gc-legal-page">
        <div class="gc-content">
          <div class="gc-card gc-legal-card">
            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">1. Escopo do Serviço</h2>
              <p class="gc-legal-text">
                O Guerreiro Concursos é uma plataforma que oferece ferramentas para organização e estudo de editais de concursos públicos. 
                O serviço inclui processamento de PDFs, geração de mapas táticos e cronogramas de estudo.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">2. Conta do Usuário</h2>
              <p class="gc-legal-text">
                Ao criar uma conta, você é responsável por manter a segurança de suas credenciais. 
                Você não deve compartilhar sua conta com terceiros. 
                É sua responsabilidade notificar-nos imediatamente sobre qualquer uso não autorizado.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">3. Uso Aceitável</h2>
              <p class="gc-legal-text">
                Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos. 
                É proibido usar o serviço para qualquer atividade ilegal, fraudulenta ou que viole direitos de terceiros.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">4. Isenção de Responsabilidade</h2>
              <p class="gc-legal-text">
                O serviço é fornecido "como está", sem garantias de qualquer tipo. 
                Não garantimos que o serviço será ininterrupto, seguro ou livre de erros. 
                Você usa o serviço por sua conta e risco.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">5. Mudanças nos Termos</h2>
              <p class="gc-legal-text">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                Alterações significativas serão comunicadas aos usuários. 
                O uso continuado do serviço após as mudanças constitui aceitação dos novos termos.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">6. Contato</h2>
              <p class="gc-legal-text">
                Para questões sobre estes termos, entre em contato através da página de Suporte.
              </p>
            </section>

            <div class="gc-legal-footer">
              <p class="gc-legal-footer-text">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
