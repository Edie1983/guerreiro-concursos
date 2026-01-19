import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  optimizeDeps: {
    include: [
      "preact",
      "preact/hooks",
      "preact/jsx-runtime",
      "preact-router",
      "zustand"
    ],
    exclude: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime"
    ],
  },
});
