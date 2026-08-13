import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function badgeBinaryRuntimePlugin() {
  return {
    name: "badge-binary-runtime",
    apply: "build",
    transform(code, id) {
      if (!id.endsWith("/components/ParticipantBadges.jsx")) return null;

      const source = "return `data:image/png;base64,${base64}`;";
      const replacement = "return '/badges/badges-sprite-binary.png?v=260813008';";

      if (!code.includes(source)) {
        throw new Error("Le point de remplacement du sprite des badges est introuvable.");
      }

      return code.replace(source, replacement);
    },
  };
}

export default defineConfig({
  plugins: [react(), badgeBinaryRuntimePlugin()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://backend-dev:3000",
        changeOrigin: true,
      },
    },
  },
});
