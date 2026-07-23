import fs from "node:fs";

const appPath = "frontend/src/App.jsx";
const enhancementsPath = "frontend/src/climbcrew-enhancements.js";
const validatorPath = "scripts/validate-source.mjs";

function replaceText(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Évolution impossible : motif introuvable (${label})`);
  }
  return source.replace(search, replacement);
}

function replaceRegex(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Évolution impossible : motif introuvable (${label})`);
  }
  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

let app = fs.readFileSync(appPath, "utf8");

app = replaceText(
  app,
  `function fullName(p) {
  return p ? \`\${p.nom} \${p.prenom}\`.trim() : "";
}
`,
  `function fullName(p) {
  return p ? \`\${p.nom} \${p.prenom}\`.trim() : "";
}

function formatRouteName(route) {
  const opener = String(route?.nomOuvreur || "").trim();
  const name = String(route?.nomVoie || "").trim();
  const label = [opener, name].filter(Boolean).join(" · ");
  return label || (route?.numeroVoieUnique ? \`#\${route.numeroVoieUnique}\` : "Voie");
}
`,
  "fonction de libellé des voies"
);

app = replaceRegex(
  app,
  /  function addParticipantsToSession\(sessionId, participantIds\) \{[\s\S]*?\n  function removeParticipantFromSession/,
  `  function addParticipantToSession(sessionId, participantId) {
    const requestedId = String(participantId || "");
    if (!requestedId) return;

    const currentSession =
      state.sessions.find((s) => s.id === sessionId) ||
      buildDefaultSession(sessionId);

    const currentParticipantIds = currentSession.participantIds.map(String);
    const occupied =
      currentParticipantIds.length +
      (currentSession.encadrantId ? 1 : 0) +
      (currentSession.referentId ? 1 : 0);

    if (occupied >= MAX_PARTICIPANTS || currentParticipantIds.includes(requestedId)) return;

    const updatedSession = {
      ...currentSession,
      participantIds: [...currentParticipantIds, requestedId],
    };

    setState((prev) => {
      const exists = prev.sessions.some((s) => s.id === sessionId);
      return {
        ...prev,
        sessions: exists
          ? prev.sessions.map((s) => (s.id === sessionId ? updatedSession : s))
          : [...prev.sessions, updatedSession],
      };
    });

    syncSessionToApi(updatedSession);
  }

  function removeParticipantFromSession`,
  "inscription unitaire"
);

app = replaceRegex(
  app,
  /          <form\n            className="inline-field add-participant-field multi-signup"[\s\S]*?          <\/form>/,
  `          <div className="inline-field add-participant-field">
            <label>Inscription</label>
            <select
              defaultValue=""
              disabled={availableParticipants.length === 0 || occupied >= MAX_PARTICIPANTS}
              onChange={(event) => {
                const participantId = event.currentTarget.value;
                if (!participantId) return;
                addParticipantToSession(session.id, participantId);
                event.currentTarget.value = "";
              }}
            >
              <option value="">
                {availableParticipants.length === 0 ? "Aucune personne disponible" : "S'inscrire"}
              </option>
              {availableParticipants
                .sort((a, b) => fullName(a).localeCompare(fullName(b), "fr"))
                .map((p) => (
                  <option key={p.id} value={p.id}>{fullName(p)}</option>
                ))}
            </select>
          </div>`,
  "champ d'inscription simple"
);

app = replaceText(
  app,
  `        .remove-button { background: #000; color: #fff; border: 1px solid rgba(255,255,255,.3); }
        .remove-button:hover { background: #111827; }
`,
  `        .remove-button { background: transparent; color: #000000; border: 0; border-radius: 0; padding: 0 4px; font-size: 20px; line-height: 1; box-shadow: none; }
        .remove-button:hover { background: transparent; color: #000000; }
`,
  "croix noire des inscriptions"
);

app = replaceText(
  app,
  `        .route-card { color: #111827; border: 1px solid rgba(0,0,0,.1); border-radius: 14px; padding: 12px; }
`,
  `        .route-card { color: #111827; border: 1px solid rgba(0,0,0,.1); border-radius: 14px; padding: 12px; }
        .route-card strong,
        .passport-row .participant-name { color: inherit !important; }
`,
  "contraste des fonds colorés"
);

app = replaceText(
  app,
  `{realisationModalRoute.nomVoie || "Voie sans nom"} · Corde {realisationModalRoute.numeroCorde} · {realisationModalRoute.cotationAjustee}`,
  `{formatRouteName(realisationModalRoute)} · Corde {realisationModalRoute.numeroCorde} · {realisationModalRoute.cotationAjustee}`,
  "libellé de voie dans la fenêtre de réalisation"
);

app = replaceText(
  app,
  `value={\`\${realisationModalRoute.nomVoie || "Sans nom"} · Corde \${realisationModalRoute.numeroCorde} · \${realisationModalRoute.cotationAjustee}\`}`,
  `value={\`\${formatRouteName(realisationModalRoute)} · Corde \${realisationModalRoute.numeroCorde} · \${realisationModalRoute.cotationAjustee}\`}`,
  "champ voie de la fenêtre de réalisation"
);

app = replaceText(
  app,
  `{state.ropes.map((rope) => {`,
  `{state.ropes.filter((rope) => state.routes.some((route) => route.numeroCorde === rope.numeroCorde)).map((rope) => {`,
  "masquage des cordes vides"
);

app = replaceText(
  app,
  `<strong>Corde {route.numeroCorde} · {route.cotationAjustee} · {route.nomVoie || "Sans nom"} · {route.nomOuvreur}</strong>`,
  `<strong>Corde {route.numeroCorde} · {route.cotationAjustee} · {formatRouteName(route)}</strong>`,
  "ordre ouvreur et nom dans les voies"
);

app = replaceText(
  app,
  `{route?.nomVoie || \`#\${route?.numeroVoieUnique}\` || "Voie inconnue"}`,
  `{route ? formatRouteName(route) : "Voie inconnue"}`,
  "libellé de voie dans la progression"
);

app = replaceText(
  app,
  `{r.nomVoie || \`#\${r.numeroVoieUnique}\`} · corde {r.numeroCorde} · {r.cotationAjustee}`,
  `{formatRouteName(r)} · corde {r.numeroCorde} · {r.cotationAjustee}`,
  "libellé de voie dans la liste de progression"
);

app = replaceText(
  app,
  `async function updateRealisationInApi(realisationId, patch) {
  if (!USE_API || !authToken) return;
  await authApiFetch(\`/realisations/\${realisationId}\`, authToken, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}
`,
  `async function updateRealisationInApi(realisationId, patch) {
  if (!USE_API || !authToken) return;
  await authApiFetch(\`/realisations/\${realisationId}\`, authToken, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

async function deleteRealisation(realisation) {
  if (!realisation?.id) return;

  const route = routesById[realisation.voieId];
  const routeLabel = route ? formatRouteName(route) : "la voie concernée";
  const dateLabel = realisation.dateRealisation
    ? formatDateShortFr(realisation.dateRealisation.slice(0, 10))
    : "date inconnue";

  if (!window.confirm(\`Supprimer définitivement la réalisation « \${routeLabel} » du \${dateLabel} ?\`)) return;

  const previousRealisations = state.realisations;
  setState((prev) => ({
    ...prev,
    realisations: prev.realisations.filter((item) => item.id !== realisation.id),
  }));
  setOpenTimelineRealisationId((current) => (current === realisation.id ? null : current));

  try {
    if (USE_API) {
      await authApiFetch(\`/realisations/\${encodeURIComponent(realisation.id)}\`, authToken, {
        method: "DELETE",
      });
    }
  } catch (error) {
    setState((prev) => ({ ...prev, realisations: previousRealisations }));
    alert(\`Suppression impossible : \${error.message || error}\`);
  }
}
`,
  "suppression d'une réalisation"
);

app = replaceText(
  app,
  `                          <button
                            className="secondary"
                            onClick={() => setOpenTimelineRealisationId(isOpen ? null : realisation.id)}
                          >
                            {isOpen ? "Masquer" : "Détails"}
                          </button>`,
  `                          <div className="group">
                            <button
                              className="secondary"
                              onClick={() => setOpenTimelineRealisationId(isOpen ? null : realisation.id)}
                            >
                              {isOpen ? "Masquer" : "Détails"}
                            </button>
                            <button className="danger" onClick={() => deleteRealisation(realisation)}>
                              Supprimer
                            </button>
                          </div>`,
  "bouton de suppression dans la progression"
);

app = app.replace(
  "Dans les voies, le fond reprend la couleur des prises ; le texte des voies blanches est noir, l’ocre est affiché en marron et un cadre rouge signale une voie uniquement en moulinette.",
  "Dans les voies, le fond reprend la couleur des prises ; le texte des voies blanches et jaunes est noir et un cadre rouge signale une voie uniquement en moulinette."
);

fs.writeFileSync(appPath, app, "utf8");

let enhancements = fs.readFileSync(enhancementsPath, "utf8");
enhancements = replaceRegex(
  enhancements,
  /\n    \.multi-signup \{[\s\S]*?\n    \.signup-option input \{[\s\S]*?\n    \}\n/,
  "\n",
  "styles de sélection multiple devenus inutiles"
);

enhancements = replaceText(
  enhancements,
  `    .session-participant-list .remove-button {
      width: 24px !important;
      min-width: 24px !important;
      height: 24px !important;
      min-height: 24px !important;
      font-size: 16px !important;
    }
`,
  `    .session-participant-list .remove-button {
      width: 24px !important;
      min-width: 24px !important;
      height: 24px !important;
      min-height: 24px !important;
      padding: 0 !important;
      font-size: 20px !important;
      line-height: 1 !important;
      color: #000000 !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }
`,
  "style de la croix noire"
);

enhancements = enhancements.replace(
  "Pour les voies, le texte est noir sur blanc, l’ocre apparaît sur fond marron et un cadre rouge indique une voie uniquement en moulinette.",
  "Pour les voies, le texte est noir sur les fonds blancs et jaunes, et un cadre rouge indique une voie uniquement en moulinette."
);
fs.writeFileSync(enhancementsPath, enhancements, "utf8");

let validator = fs.readFileSync(validatorPath, "utf8");
validator = replaceText(
  validator,
  `const backend = fs.readFileSync("backend/server.js", "utf8");
`,
  `if (app.includes("multi-signup") || app.includes('name="participantIds"')) fail("la sélection multiple des inscriptions est encore présente");
if (app.includes("Sans nom") || app.includes("Voie sans nom")) fail("un libellé Sans nom est encore affiché");
if (!app.includes("function formatRouteName(route)")) fail("formatage ouvreur puis nom de voie absent");
if (!app.includes("async function deleteRealisation(realisation)")) fail("suppression de réalisation absente de la progression");
if (!app.includes("state.ropes.filter((rope) => state.routes.some")) fail("les cordes vides ne sont pas masquées");

const enhancements = fs.readFileSync("frontend/src/climbcrew-enhancements.js", "utf8");
if (enhancements.includes("l’ocre apparaît sur fond marron")) fail("mention ocre sur fond marron encore présente dans la FAQ");

const backend = fs.readFileSync("backend/server.js", "utf8");
`,
  "contrôles des nouvelles évolutions"
);
validator = replaceText(
  validator,
  `if (!backend.includes("const newlyAddedParticipantIds")) fail("contrôle des nouvelles inscriptions en séance libre absent");
`,
  `if (!backend.includes("const newlyAddedParticipantIds")) fail("contrôle des nouvelles inscriptions en séance libre absent");
if (!backend.includes('app.delete("/realisations/:id"')) fail("API de suppression des réalisations absente");
`,
  "contrôle de l'API de suppression"
);
fs.writeFileSync(validatorPath, validator, "utf8");

for (const temporaryPath of [
  ".github/scripts/apply-evolutions-20260723.mjs",
  ".github/workflows/apply-evolutions-20260723.yml",
]) {
  fs.rmSync(temporaryPath, { force: true });
}

console.log("Évolutions ClimbCrew du 23 juillet appliquées.");
