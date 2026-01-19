// src/pages/Profile/index.tsx
import { route } from "preact-router";
import { Edit, LogOut, Star, Calendar, FileText } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import { PlanBadge } from "../../components/gc/PlanBadge";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./style.css";

export default function Profile() {
  const { user, profile, isPremium, premiumUntil, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm("Tem certeza que deseja sair?")) {
      await logout();
      route("/app/login", true);
    }
  };

  const getAvatarUrl = () => {
    if (user?.photoURL) return user.photoURL;
    if (profile?.photoURL) return profile.photoURL;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.displayName || user?.displayName || user?.email || "U"
    )}&background=6366f1&color=fff&size=128`;
  };

  const getDisplayName = () => {
    return profile?.displayName || user?.displayName || user?.email || "Usuário";
  };

  const premiumDate = premiumUntil
    ? (premiumUntil instanceof Date ? premiumUntil : new Date(premiumUntil))
    : null;

  const formattedPremiumDate = premiumDate
    ? premiumDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  return (
    <PageWrapper
      title="Meu Perfil"
      subtitle="Gerencie suas informações e status de assinatura"
    >
      <div class="gc-profile-page">
        <div class="gc-content animate-slide-up">
          <div className="gc-card gc-profile-card">
            <div className="gc-profile-header">
              <div className="gc-profile-avatar-wrapper">
                <img
                  src={getAvatarUrl()}
                  alt="Avatar"
                  className="gc-profile-avatar"
                />
              </div>
              <div className="gc-profile-info">
                <div className="gc-profile-name">{getDisplayName()}</div>
                <div className="gc-profile-email">{user?.email || profile?.email || "—"}</div>
                <div className="gc-profile-badge">
                  <PlanBadge isPremium={isPremium} />
                </div>
              </div>
            </div>

            <div className="gc-profile-details">
              {isPremium && premiumDate && (
                <div className="gc-profile-detail-item">
                  <div className="gc-profile-detail-label">
                    <Star size={16} />
                    Premium até
                  </div>
                  <div className="gc-profile-detail-value">{formattedPremiumDate}</div>
                </div>
              )}

              {profile?.createdAt && (
                <div className="gc-profile-detail-item">
                  <div className="gc-profile-detail-label">
                    <Calendar size={16} />
                    Conta criada em
                  </div>
                  <div className="gc-profile-detail-value">
                    {new Date(profile.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </div>
                </div>
              )}

              {profile?.editaisProcessados !== undefined && (
                <div className="gc-profile-detail-item">
                  <div className="gc-profile-detail-label">
                    <FileText size={16} />
                    Editais processados
                  </div>
                  <div className="gc-profile-detail-value">{profile.editaisProcessados}</div>
                </div>
              )}
            </div>

            <div className="gc-profile-actions">
              <button
                className="gc-btn-secondary gc-profile-action-button"
                onClick={() => route("/app/profile/edit", true)}
              >
                <Edit size={18} />
                Editar Perfil
              </button>
              <button
                className="gc-btn-secondary gc-profile-action-button"
                onClick={() => route("/app/premium-status", true)}
              >
                <Star size={18} />
                Status Premium
              </button>
              <button
                className="gc-btn-danger gc-profile-action-button"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
