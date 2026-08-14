import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export function makeRealisationRatingOptional(code) {
  const replacements = [
    [
      "if (!newRealisation.participantId || !newRealisation.selectedDay || !newRealisation.voieId || !newRealisation.rating) {",
      "if (!newRealisation.participantId || !newRealisation.selectedDay || !newRealisation.voieId) {",
    ],
    [
      "alert(\"Sélectionne un jour, un participant, une voie et une note de 1 à 5 étoiles.\");",
      "alert(\"Sélectionne un jour, un participant et une voie.\");",
    ],
    [
      "rating: newRealisation.rating,",
      "...(newRealisation.rating ? { rating: newRealisation.rating } : {}),",
    ],
    [
      "<label>Évaluation de la voie</label>",
      "<label>Évaluation de la voie (facultative)</label>",
    ],
    [
      "disabled={!newRealisation.selectedDay || !newRealisation.participantId || !newRealisation.voieId || !newRealisation.rating || modalEligibleParticipants.length === 0}",
      "disabled={!newRealisation.selectedDay || !newRealisation.participantId || !newRealisation.voieId || modalEligibleParticipants.length === 0}",
    ],
  ];

  let transformed = code;
  for (const [source, replacement] of replacements) {
    if (!transformed.includes(source)) {
      throw new Error(`Point de transformation introuvable pour l'évaluation facultative : ${source}`);
    }
    transformed = transformed.replace(source, replacement);
  }

  const consensusBlock = /\s*<div>\s*<label>Cotation consensus<\/label>\s*<input value=\{realisationModalRoute \? routeAggregatesById\[realisationModalRoute\.id\]\?\.consensusGrade \|\| "Non calculée" : "Choisir une voie"\} readOnly \/>\s*<\/div>/;
  if (!consensusBlock.test(transformed)) {
    throw new Error("Le bloc Cotation consensus de la saisie de réalisation est introuvable.");
  }
  transformed = transformed.replace(consensusBlock, "");

  return transformed;
}

function optionalRealisationRatingPlugin() {
  return {
    name: "optional-realisation-rating",
    enforce: "pre",
    transform(code, id) {
      const cleanId = String(id || "").split("?")[0];
      if (!cleanId.endsWith("/src/App.jsx")) return null;
      return makeRealisationRatingOptional(code);
    },
  };
}

export default defineConfig({
  plugins: [optionalRealisationRatingPlugin(), react()],
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
