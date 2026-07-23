import fs from "node:fs";

const appPath = "frontend/src/App.jsx";
const serverPath = "backend/server.js";

let app = fs.readFileSync(appPath, "utf8");
let server = fs.readFileSync(serverPath, "utf8");

function replaceOnce(source, search, replacement, label) {
  const firstIndex = source.indexOf(search);
  if (firstIndex === -1) {
    throw new Error(`Motif introuvable pour ${label}`);
  }
  if (source.indexOf(search, firstIndex + search.length) !== -1) {
    throw new Error(`Motif présent plusieurs fois pour ${label}`);
  }
  return source.replace(search, replacement);
}

app = replaceOnce(
  app,
  'const APP_VERSION_LABEL = "Version 2026-07-18.2";',
  'const APP_VERSION_LABEL = "Version 2026-07-23.1";',
  "version frontend"
);

app = replaceOnce(
  app,
  `const THEME_OPTIONS = [
  { value: "auto", label: "Automatique" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
];`,
  `const THEME_OPTIONS = [
  { value: "auto", label: "Automatique" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "fun", label: "Fun" },
];`,
  "option de thème Fun"
);

app = replaceOnce(
  app,
  '  if (value === "light" || value === "dark") return value;',
  '  if (["light", "dark", "fun"].includes(value)) return value;',
  "résolution du thème Fun"
);

app = replaceOnce(
  app,
  `  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  /**`,
  `  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const applyTheme = () => {
      const resolvedTheme = resolveThemePreference(themePreference);
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.dataset.themePreference = themePreference;
      localStorage.setItem(THEME_PREFERENCE_KEY, themePreference);
    };

    applyTheme();

    if (themePreference !== "auto" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => applyTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", onSystemThemeChange);
    }

    mediaQuery.addListener(onSystemThemeChange);
    return () => mediaQuery.removeListener(onSystemThemeChange);
  }, [themePreference]);

  /**`,
  "application et mémorisation du thème"
);

app = replaceOnce(
  app,
  `        setAuthUser(data.user);
        if (data.user?.role === "admin") {`,
  `        setAuthUser(data.user);
        if (data.user?.theme_preference) {
          setThemePreference(data.user.theme_preference);
        }
        if (data.user?.role === "admin") {`,
  "restauration du thème utilisateur"
);

app = replaceOnce(
  app,
  "  function renderSessionCard(session) {",
  "  function renderSessionCard(session, compact = false) {",
  "signature carte séance"
);

app = replaceOnce(
  app,
  '      <div className="card session-card" key={session.id}>',
  '      <div className={`card session-card ${compact ? "session-card-compact" : ""}`} key={session.id}>',
  "classe carte séance compacte"
);

app = replaceOnce(
  app,
  `            {viewMode === "jour" ? (
              <div className="stack">{daySessions.map(renderSessionCard)}</div>
            ) : (
              <div className="grid five">
                {weekSessions.map((day) => (
                  <div className="card" key={day.date}>
                    <div className="card-header"><h3>{formatDateFr(day.date)}</h3></div>
                    <div className="stack">
                      {day.sessions.map((session) => {
                        const inscrits = session.participantIds.map((id) => participantsById[id]).filter(Boolean);
                        const occupied = inscrits.length + (session.encadrantId ? 1 : 0) + (session.referentId ? 1 : 0);
                        return (
                          <div className="subcard" key={session.id}>
                            <div className="card-header">
                              <strong>{session.slot}</strong>
                              <span className="badge">{occupied}/{MAX_PARTICIPANTS}</span>
                            </div>
                            <div className="small">Statut : {session.status}</div>
                            {session.encadrantId && <div className="small">Encadrant : {fullName(participantsById[session.encadrantId])}</div>}
                            {session.referentId && <div className="small">Référent : {fullName(participantsById[session.referentId])}</div>}
                            <div className="stack" style={{ marginTop: 8 }}>
                              {inscrits.length === 0 ? <div className="small">Aucun inscrit</div> : inscrits.map((p) => <div className="participant-row passport-row" key={p.id} style={getPassportStyle(p)}><span className="participant-name">{fullName(p)}</span></div>)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}`,
  `            {viewMode === "jour" ? (
              <div className="stack">{daySessions.map((session) => renderSessionCard(session))}</div>
            ) : (
              <div className="week-grid" aria-label="Semaine interactive">
                {weekSessions.map((day) => (
                  <section className="week-day-card" key={day.date}>
                    <div className="week-day-header">
                      <h3>{formatDateFr(day.date)}</h3>
                      <button
                        className="secondary week-day-open"
                        onClick={() => {
                          setSelectedDate(day.date);
                          ensureSessionsForDate(day.date);
                          setViewMode("jour");
                        }}
                      >
                        Ouvrir le jour
                      </button>
                    </div>
                    <div className="week-day-sessions">
                      {day.sessions.map((session) => renderSessionCard(session, true))}
                    </div>
                  </section>
                ))}
              </div>
            )}`,
  "vue semaine interactive"
);

app = replaceOnce(
  app,
  `        {visibleTabs.map((item) => (
          <button
            key={item.key}
            className={\`side-tab \${tab === item.key ? "active" : ""}\`}
            onClick={() => {
              setTab(item.key);
              setSidebarOpen(false);
            }}
          >
            {item.label}
          </button>
        ))}
        {authUser && (`,
  `        {visibleTabs.map((item) => (
          <button
            key={item.key}
            className={\`side-tab \${tab === item.key ? "active" : ""}\`}
            onClick={() => {
              setTab(item.key);
              setSidebarOpen(false);
            }}
          >
            {item.label}
          </button>
        ))}
        <div className="sidebar-theme">
          <label htmlFor="sidebar-theme-selector">Ambiance</label>
          <select
            id="sidebar-theme-selector"
            value={themePreference}
            onChange={(event) => handleThemePreferenceChange(event.target.value)}
          >
            {THEME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        {authUser && (`,
  "sélecteur de thème latéral"
);

app = replaceOnce(
  app,
  `            <div className="brand">
              <img src="/logo-climbcrew.png" alt="Logo ClimbCrew" className="app-logo" />
              <div>
                <h1>ClimbCrew</h1>
              </div>
            </div>

          </div>`,
  `            <div className="brand">
              <img src="/logo-climbcrew.png" alt="Logo ClimbCrew" className="app-logo" />
              <div>
                <h1>ClimbCrew</h1>
              </div>
            </div>

            <div className="theme-selector-inline">
              <label htmlFor="header-theme-selector">Ambiance</label>
              <select
                id="header-theme-selector"
                value={themePreference}
                onChange={(event) => handleThemePreferenceChange(event.target.value)}
              >
                {THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>`,
  "sélecteur de thème en en-tête"
);

app = replaceOnce(
  app,
  `  --theme-sidebar-bg: rgba(2,6,23,.95);
  --theme-accent: #22d3ee;
  --theme-stat-bg: rgba(2,6,23,.48);`,
  `  --theme-sidebar-bg: rgba(2,6,23,.95);
  --theme-accent: #22d3ee;
  --theme-accent-text: #082f49;
  --theme-stat-bg: rgba(2,6,23,.48);`,
  "texte accent thème sombre"
);

app = replaceOnce(
  app,
  `  --theme-sidebar-bg: rgba(255,255,255,.98);
  --theme-accent: #0b4a9d;
  --theme-stat-bg: rgba(248,250,252,.95);
}

body {`,
  `  --theme-sidebar-bg: rgba(255,255,255,.98);
  --theme-accent: #0b4a9d;
  --theme-accent-text: #ffffff;
  --theme-stat-bg: rgba(248,250,252,.95);
}

:root[data-theme="fun"] {
  --theme-page-bg: #fff7ed;
  --theme-app-bg: linear-gradient(135deg,#fff7ed,#fef3c7,#fce7f3);
  --theme-card-bg: rgba(255,255,255,.94);
  --theme-card-soft: rgba(255,247,237,.96);
  --theme-card-border: rgba(249,115,22,.28);
  --theme-text: #292524;
  --theme-text-muted: #7c2d12;
  --theme-input-bg: #ffffff;
  --theme-input-border: rgba(249,115,22,.35);
  --theme-sidebar-bg: rgba(255,247,237,.98);
  --theme-accent: #f97316;
  --theme-accent-text: #ffffff;
  --theme-stat-bg: rgba(254,243,199,.78);
}

body {`,
  "variables du thème Fun"
);

app = replaceOnce(
  app,
  `        .faq-item { padding: 12px 0; border-bottom: 1px solid rgba(148,163,184,.2); }
        @media (max-width: 1100px) {`,
  `        .faq-item { padding: 12px 0; border-bottom: 1px solid rgba(148,163,184,.2); }
        .week-grid { display: grid; grid-template-columns: repeat(5, minmax(240px, 1fr)); gap: 12px; align-items: start; overflow-x: auto; padding-bottom: 8px; }
        .week-day-card { min-width: 0; padding: 12px; border-radius: 18px; background: var(--theme-card-soft); border: 1px solid var(--theme-card-border); }
        .week-day-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
        .week-day-header h3 { margin: 0; font-size: 16px; }
        .week-day-open { padding: 7px 9px; font-size: 12px; white-space: nowrap; }
        .week-day-sessions { display: grid; gap: 10px; }
        .session-card-compact { margin-top: 0; padding: 10px; border-radius: 15px; }
        .session-card-compact .session-form-row { grid-template-columns: 1fr; gap: 7px; margin-bottom: 9px; }
        .session-card-compact .inline-field { grid-template-columns: 1fr; gap: 5px; }
        .session-card-compact .inline-field label { font-size: 10px; }
        .session-card-compact .card-header h3 { font-size: 15px; text-transform: capitalize; }
        .session-card-compact .session-participant-list { gap: 6px; }
        .sidebar-theme { margin-top: 4px; padding-top: 12px; border-top: 1px solid var(--theme-card-border); }
        .sidebar-theme label { margin-bottom: 6px; }
        @media (min-width: 701px) and (max-width: 1199px) {
          .week-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); overflow-x: visible; }
        }
        @media (max-width: 1100px) {`,
  "mise en page responsive de la semaine"
);

app = replaceOnce(
  app,
  `          .grid.five, .grid.four, .grid.three, .grid.two { grid-template-columns: 1fr; }
        }

        @media (max-width: 420px) {`,
  `          .grid.five, .grid.four, .grid.three, .grid.two { grid-template-columns: 1fr; }
          .week-grid { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; margin: 0 -8px; padding: 0 8px 10px; -webkit-overflow-scrolling: touch; }
          .week-day-card { flex: 0 0 min(92vw, 430px); scroll-snap-align: start; }
          .week-day-header { position: sticky; top: 64px; z-index: 2; padding: 4px 0; background: var(--theme-card-soft); }
          .theme-selector-inline { display: none; }
        }

        @media (max-width: 420px) {`,
  "semaine mobile glissable"
);

app = replaceOnce(
  app,
  `:root[data-theme="light"] .app-logo,
:root[data-theme="light"] .sidebar-logo {
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15,23,42,.08);
}`,
  `button:not(.danger):not(.secondary):not(.ghost),
.side-tab.active,
.bottom-tab.active {
  background: var(--theme-accent) !important;
  color: var(--theme-accent-text) !important;
}

:root[data-theme="fun"] .hero,
:root[data-theme="fun"] .toolbar,
:root[data-theme="fun"] .card,
:root[data-theme="fun"] .week-day-card {
  box-shadow: 0 16px 40px rgba(249,115,22,.12);
}

:root[data-theme="light"] .app-logo,
:root[data-theme="light"] .sidebar-logo,
:root[data-theme="fun"] .app-logo,
:root[data-theme="fun"] .sidebar-logo {
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15,23,42,.08);
}`,
  "application des accents de thème"
);

server = replaceOnce(
  server,
  '  const allowed = new Set(["auto", "light", "dark"]);',
  '  const allowed = new Set(["auto", "light", "dark", "fun"]);',
  "validation backend du thème Fun"
);

const requiredAppMarkers = [
  '{ value: "fun", label: "Fun" }',
  'className="week-grid"',
  'renderSessionCard(session, true)',
  ':root[data-theme="fun"]',
  'sidebar-theme-selector',
  'header-theme-selector',
];

for (const marker of requiredAppMarkers) {
  if (!app.includes(marker)) throw new Error(`Contrôle final échoué : ${marker}`);
}
if (!server.includes('["auto", "light", "dark", "fun"]')) {
  throw new Error("Contrôle final backend échoué");
}

fs.writeFileSync(appPath, app);
fs.writeFileSync(serverPath, server);

fs.rmSync("scripts/apply-ui-evolutions.mjs", { force: true });
fs.rmSync(".github/workflows/apply-ui-evolutions.yml", { force: true });

console.log("Évolutions UI appliquées avec succès.");
