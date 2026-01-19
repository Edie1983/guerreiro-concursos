// src/pages/Profile/Edit.tsx
import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { Save, X } from "preact-feather";
import { useAuth } from "../../contexts/AuthContext";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { Toast } from "../../components/common/feedback/Toast";
import { PageWrapper } from "../../components/layout/PageWrapper";
import "./edit.css";

export default function ProfileEdit() {
  const { user, profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; photoURL?: string }>({});

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setPhotoURL(profile.photoURL || "");
    } else if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [profile, user]);

  const validate = (): boolean => {
    const newErrors: { displayName?: string; photoURL?: string } = {};

    if (displayName.trim().length < 2) {
      newErrors.displayName = "O nome deve ter pelo menos 2 caracteres";
    }

    if (photoURL && photoURL.trim() !== "") {
      try {
        new URL(photoURL);
      } catch {
        newErrors.photoURL = "URL inválida";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setToastMessage("Por favor, corrija os erros antes de salvar");
      setShowToast(true);
      return;
    }

    if (!user) {
      setToastMessage("Usuário não autenticado");
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        photoURL: photoURL.trim() || undefined,
      });
      setToastMessage("Perfil atualizado com sucesso!");
      setShowToast(true);
      setTimeout(() => {
        route("/app/profile", true);
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      setToastMessage("Erro ao atualizar perfil. Tente novamente.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    route("/app/profile", true);
  };

  const getAvatarUrl = () => {
    if (photoURL && photoURL.trim() !== "") return photoURL;
    if (user?.photoURL) return user.photoURL;
    if (profile?.photoURL) return profile.photoURL;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName || user?.email || "U"
    )}&background=6366f1&color=fff&size=128`;
  };

  return (
    <PageWrapper
      title="Editar Perfil"
      subtitle="Mantenha seus dados sempre atualizados"
    >
      <div class="gc-profile-edit-page">
        <div class="gc-content">
          <div className="gc-card gc-profile-edit-card">
            <div className="gc-profile-edit-avatar-section">
              <div className="gc-profile-edit-avatar-wrapper">
                <img
                  src={getAvatarUrl()}
                  alt="Avatar preview"
                  className="gc-profile-edit-avatar"
                />
              </div>
              <p className="gc-profile-edit-avatar-hint">
                O avatar será atualizado automaticamente quando você salvar
              </p>
            </div>

            <div className="gc-profile-edit-form">
              <Input
                label="Nome"
                type="text"
                value={displayName}
                onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
                placeholder="Seu nome completo"
                maxLength={100}
              />
              {errors.displayName && (
                <div className="gc-profile-edit-error">{errors.displayName}</div>
              )}

              <Input
                label="URL da Foto (opcional)"
                type="url"
                value={photoURL}
                onInput={(e) => setPhotoURL((e.target as HTMLInputElement).value)}
                placeholder="https://exemplo.com/foto.jpg"
              />
              {errors.photoURL && (
                <div className="gc-profile-edit-error">{errors.photoURL}</div>
              )}

              <Input
                label="Email"
                type="email"
                value={user?.email || profile?.email || ""}
                disabled
                placeholder="Email não pode ser alterado"
              />
              <p className="gc-profile-edit-hint">
                O email não pode ser alterado por questões de segurança
              </p>
            </div>

            <div className="gc-profile-edit-actions">
              <Button variant="secondary" onClick={handleCancel} disabled={loading}>
                <X size={18} />
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={loading}>
                <Save size={18} />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
        <Toast
          message={toastMessage || ""}
          show={showToast}
          onClose={() => {
            setShowToast(false);
            setToastMessage(null);
          }}
        />
      </div>
    </PageWrapper>
  );
}
