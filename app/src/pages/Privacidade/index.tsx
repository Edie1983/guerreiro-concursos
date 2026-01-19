// src/pages/Privacidade/index.tsx
import { route } from "preact-router";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./style.css";

export default function Privacidade() {
  return (
    <PageWrapper
      title="Política de Privacidade"
      subtitle="Transparência total sobre como cuidamos dos seus dados"
    >
      <div class="gc-legal-page">
        <div class="gc-content">
          <div class="gc-card gc-legal-card">
            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">1. Dados Coletados</h2>
              <p class="gc-legal-text">
                Coletamos informações que você nos fornece diretamente, como email e senha para autenticação. 
                Também armazenamos dados relacionados aos editais que você processa, incluindo conteúdo extraído e metadados.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">2. Armazenamento</h2>
              <p class="gc-legal-text">
                Utilizamos o Firebase (Google) para armazenar seus dados de forma segura. 
                Os dados são criptografados em trânsito e em repouso. 
                Cada usuário tem acesso apenas aos seus próprios dados.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">3. Retenção de Dados</h2>
              <p class="gc-legal-text">
                Mantemos seus dados enquanto sua conta estiver ativa. 
                Você pode solicitar a exclusão de sua conta e dados a qualquer momento através da página de Suporte.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">4. Direitos do Usuário</h2>
              <p class="gc-legal-text">
                Você tem o direito de acessar, corrigir ou excluir seus dados pessoais. 
                Também pode solicitar uma cópia dos dados que mantemos sobre você. 
                Entre em contato através da página de Suporte para exercer esses direitos.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">5. Compartilhamento</h2>
              <p class="gc-legal-text">
                Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto quando necessário para fornecer o serviço 
                (ex: Firebase) ou quando exigido por lei.
              </p>
            </section>

            <section class="gc-legal-section">
              <h2 class="gc-legal-section-title">6. Contato</h2>
              <p class="gc-legal-text">
                Para questões sobre privacidade ou para exercer seus direitos, entre em contato através da página de Suporte.
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
