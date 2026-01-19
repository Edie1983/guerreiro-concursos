// src/app.tsx
import { Router, Route, route } from "preact-router";
import { useEffect, useRef } from "preact/hooks";
import { useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home/index";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import UploadEdital from "./pages/UploadEdital/index";
import Processamento from "./pages/Processamento/index";
import DetalhesEdital from "./pages/DetalhesEdital/index";
import MapaTatico from "./pages/MapaTatico/index";
import Cronograma from "./pages/Cronograma/index";
import Planos from "./pages/Planos/index";
import Upgrade from "./pages/Upgrade/index";
import PremiumStatus from "./pages/PremiumStatus/index";
import Termos from "./pages/Termos/index";
import Privacidade from "./pages/Privacidade/index";
import Suporte from "./pages/Suporte/index";
import Profile from "./pages/Profile/index";
import ProfileEdit from "./pages/Profile/Edit";
import ProfileEditais from "./pages/Profile/Editais";
import Analytics from "./pages/Analytics/index";
import Recompensas from "./pages/Recompensas/index";
import Flashcards from "./pages/Flashcards/index";
import FlashcardsDisciplina from "./pages/Flashcards/Disciplina";
import FlashcardsEstudar from "./pages/Flashcards/Estudar";
import { Paywall } from "./components/gc/Paywall";
import { AppLayout } from "./components/Layout/AppLayout";
import { PublicLayout } from "./components/layout/PublicLayout";

// Componente para rotas públicas (SEM Sidebar/Topbar)
function PublicRoute({ component: Component, ...rest }: any) {
  return (
    <PublicLayout>
      <Component {...rest} />
    </PublicLayout>
  );
}

// Componente para proteger rotas
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Evita loop de redirect: só redireciona uma vez
    if (!loading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      route("/app/login", true);
    }
  }, [user, loading]);

  useEffect(() => {
    // Reset flag quando usuário loga
    if (!loading && user) {
      hasRedirected.current = false;
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Aguarda redirect
  }

  return (
    <AppLayout>
      <Component {...rest} />
    </AppLayout>
  );
}

export function App() {
  return (
    <Router>
      {/* Rotas principais (protegidas - requerem login) */}
      <Route
        path="/app"
        component={(props: any) => <ProtectedRoute component={Home} {...props} />}
      />
      <Route
        path="/app/"
        component={(props: any) => <ProtectedRoute component={Home} {...props} />}
      />
      <Route
        path="/app/upload"
        component={(props: any) => <ProtectedRoute component={UploadEdital} {...props} />}
      />
      <Route
        path="/app/processamento"
        component={(props: any) => <ProtectedRoute component={Processamento} {...props} />}
      />
      <Route
        path="/app/edital/:id"
        component={(props: any) => <ProtectedRoute component={DetalhesEdital} {...props} />}
      />
      {/* Rotas premium - requerem login E assinatura premium */}
      <Route
        path="/app/edital/:id/mapa"
        component={(props: any) => (
          <ProtectedRoute
            component={(p: any) => (
              <Paywall>
                <MapaTatico {...p} />
              </Paywall>
            )}
            {...props}
          />
        )}
      />
      <Route
        path="/app/edital/:id/cronograma"
        component={(props: any) => (
          <ProtectedRoute
            component={(p: any) => (
              <Paywall>
                <Cronograma {...p} />
              </Paywall>
            )}
            {...props}
          />
        )}
      />
      <Route
        path="/app/planos"
        component={(props: any) => <ProtectedRoute component={Planos} {...props} />}
      />
      <Route
        path="/app/upgrade"
        component={(props: any) => <ProtectedRoute component={Upgrade} {...props} />}
      />
      <Route
        path="/app/premium-status"
        component={(props: any) => <ProtectedRoute component={PremiumStatus} {...props} />}
      />
      <Route
        path="/app/termos"
        component={(props: any) => <ProtectedRoute component={Termos} {...props} />}
      />
      <Route
        path="/app/privacidade"
        component={(props: any) => <ProtectedRoute component={Privacidade} {...props} />}
      />
      <Route
        path="/app/suporte"
        component={(props: any) => <ProtectedRoute component={Suporte} {...props} />}
      />
      <Route
        path="/app/profile"
        component={(props: any) => <ProtectedRoute component={Profile} {...props} />}
      />
      <Route
        path="/app/profile/edit"
        component={(props: any) => <ProtectedRoute component={ProfileEdit} {...props} />}
      />
      <Route
        path="/app/profile/editais"
        component={(props: any) => <ProtectedRoute component={ProfileEditais} {...props} />}
      />
      <Route
        path="/app/analytics"
        component={(props: any) => <ProtectedRoute component={Analytics} {...props} />}
      />
      <Route
        path="/app/recompensas"
        component={(props: any) => <ProtectedRoute component={Recompensas} {...props} />}
      />
      {/* Rotas de Flashcards - requerem login E assinatura premium */}
      <Route
        path="/app/flashcards"
        component={(props: any) => (
          <ProtectedRoute
            component={Flashcards}
            {...props}
          />
        )}
      />
      <Route
        path="/app/flashcards/:disciplina"
        component={(props: any) => (
          <ProtectedRoute
            component={(p: any) => (
              <Paywall>
                <FlashcardsDisciplina disciplina={p.disciplina} {...p} />
              </Paywall>
            )}
            {...props}
          />
        )}
      />
      <Route
        path="/app/flashcards/estudar/:disciplina"
        component={(props: any) => (
          <ProtectedRoute
            component={(p: any) => (
              <Paywall>
                <FlashcardsEstudar disciplina={p.disciplina} {...p} />
              </Paywall>
            )}
            {...props}
          />
        )}
      />

      {/* Rotas de auth (públicas - SEM Sidebar/Topbar) */}
      <Route
        path="/app/login"
        component={(props: any) => <PublicRoute component={Login} {...props} />}
      />
      <Route
        path="/app/register"
        component={(props: any) => <PublicRoute component={Register} {...props} />}
      />
    </Router>
  );
}
