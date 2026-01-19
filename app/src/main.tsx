// src/main.tsx
import { render } from "preact";
import { App } from "./app";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import "./styles/style_main.css";

// Importa runners DEV-only (expõe window.runPdfSuite e window.runCronogramaPreview)
// Import dinâmico protegido por guard DEV - não entra no build de produção
if (import.meta.env.DEV) {
  // Usa void para não bloquear render (import é assíncrono mas não precisa aguardar)
  void import("./dev/runPdfSuite");
  void import("./dev/runCronogramaPreview");
}

render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById("app")!
);
