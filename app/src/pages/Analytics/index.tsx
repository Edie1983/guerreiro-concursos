// src/pages/Analytics/index.tsx
import { useEffect, useMemo } from 'preact/hooks';
import { route } from 'preact-router';
import { ArrowLeft, FileText, BookOpen, Calendar, TrendingUp } from 'preact-feather';
import { useAuth } from '../../contexts/AuthContext';
import { CardAnalytics } from '../../components/analytics/CardAnalytics';
import { StreakBar } from '../../components/analytics/StreakBar';
import { MiniChart7 } from '../../components/analytics/MiniChart7';
import { Timeline } from '../../components/analytics/Timeline';
import { PremiumStatusBanner } from '../../components/gc/PremiumStatusBanner';
import { PageWrapper } from '../../components/layout/PageWrapper';
import './style.css';

export default function Analytics() {
  const { user, profile, analytics, loadingProfile, refreshProfile } = useAuth();

  useEffect(() => {
    if (user && !loadingProfile) {
      refreshProfile().catch(console.error);
    }
  }, [user, loadingProfile, refreshProfile]);

  const lastActivityFormatted = useMemo(() => {
    if (!analytics?.lastActivity) return 'Nunca';
    const date = analytics.lastActivity;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [analytics?.lastActivity]);

  if (!user) {
    return (
      <PageWrapper title="Minha Evolução" subtitle="Acompanhe seu progresso e conquistas">
        <div class="gc-analytics-empty">
          <div class="gc-analytics-empty-text">Faça login para ver sua evolução</div>
        </div>
      </PageWrapper>
    );
  }

  if (loadingProfile || !analytics || !profile) {
    return (
      <PageWrapper title="Minha Evolução" subtitle="Acompanhe seu progresso e conquistas">
        <div class="gc-analytics-loading">Carregando...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Minha Evolução"
      subtitle="Acompanhe seu progresso e conquistas"
    >
      <div class="gc-analytics-page">
        <PremiumStatusBanner />

        {/* Main Content */}
        <div class="gc-analytics-content animate-slide-up">
        {/* Cards de Estatísticas */}
        <div class="gc-analytics-grid">
          <CardAnalytics
            title="Editais Processados"
            value={analytics.editaisProcessados}
            icon={<FileText size={24} />}
            gradient="premium"
          />
          <CardAnalytics
            title="Disciplinas Estudadas"
            value={analytics.disciplinasVistas}
            icon={<BookOpen size={24} />}
            gradient="free"
          />
          <CardAnalytics
            title="Semanas Criadas"
            value={analytics.semanasCriadas}
            icon={<Calendar size={24} />}
            gradient="free"
          />
          <CardAnalytics
            title="Dias Ativos"
            value={analytics.diasAtivos}
            icon={<TrendingUp size={24} />}
            gradient="premium"
            subtitle={lastActivityFormatted !== 'Nunca' ? `Última atividade: ${lastActivityFormatted}` : undefined}
          />
        </div>

        {/* Streak Bar */}
        <StreakBar diasAtivos={analytics.diasAtivos} />

        {/* Gráfico dos Últimos 7 Dias */}
        {profile.historicoAtividade && profile.historicoAtividade.length > 0 && (
          <MiniChart7 historico={profile.historicoAtividade} />
        )}

        {/* Timeline */}
        <Timeline
          createdAt={profile.createdAt}
          editaisProcessados={analytics.editaisProcessados}
          disciplinasVistas={analytics.disciplinasVistas}
          semanasCriadas={analytics.semanasCriadas}
        />
      </div>
    </div>
    </PageWrapper>
  );
}






