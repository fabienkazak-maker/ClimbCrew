export const AUTH_LOGIN_INLINE_STYLE = `
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 14px;
    background: linear-gradient(180deg, #f6f8fc 0%, #eef2f7 100%);
  }

  .auth-card {
    width: min(460px, 100%);
    padding: 18px;
    border-radius: 20px;
    background: rgba(255,255,255,.96);
    border: 1px solid rgba(148,163,184,.18);
    box-shadow: 0 18px 50px rgba(15,23,42,.10);
    color: #0f172a;
  }

  .auth-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 10px;
  }

  .auth-page .app-logo {
    width: 72px;
    height: 72px;
    object-fit: contain;
    border-radius: 18px;
    background: #ffffff;
    padding: 6px;
    box-shadow: 0 10px 30px rgba(15,23,42,.10);
  }

  .auth-brand h1,
  .auth-brand p {
    margin: 0;
    text-align: center;
  }

  .auth-switcher {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 14px;
  }

  .auth-switcher button {
    min-height: 40px;
    padding: 8px 10px;
    border-radius: 12px;
  }

  .auth-card .grid.two {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .auth-card label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    text-transform: none;
    letter-spacing: 0;
  }

  .auth-card input,
  .auth-card select {
    width: 100%;
    min-height: 44px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(148,163,184,.25);
    background: #ffffff;
    color: #0f172a;
    box-sizing: border-box;
  }

  .auth-submit-row {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-start;
  }

  .auth-submit-row button {
    min-width: 160px;
  }

  @media (max-width: 480px) {
    .auth-card {
      width: min(100%, 380px);
      padding: 14px;
    }

    .auth-page .app-logo {
      width: 64px;
      height: 64px;
    }

    .auth-switcher {
      grid-template-columns: 1fr;
    }

    .auth-submit-row button {
      width: 100%;
      min-width: 0;
    }
  }
`;

export const THEME_PREFERENCE_KEY = "climbcrew-theme-preference";

export const THEME_OPTIONS = [
  { value: "auto", label: "Automatique" },
  { value: "craie_ardoise", label: "Craie & Ardoise" },
  { value: "ocean_mineral", label: "OcAcan minAcral" },
  { value: "foret_mousse", label: "ForA mousse" },
  { value: "terre_cuite", label: "Terre cuite" },
  { value: "aurore_alpine", label: "Aurore alpine" },
  { value: "lavande_nocturne", label: "Lavande nocturne" },
  { value: "sable_corde", label: "Sable & Corde" },
  { value: "bloc_neon", label: "Bloc nAcon" },
  { value: "glacier", label: "Glacier" },
  { value: "cristal", label: "Cristal" },
];

const THEME_VALUES = THEME_OPTIONS.filter((option) => option.value !== "auto").map((option) => option.value);

function getSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "craie_ardoise";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "lavande_nocturne" : "craie_ardoise";
}

export function resolveThemePreference(value) {
  if (THEME_VALUES.includes(value)) return value;
  if (value === "light") return "craie_ardoise";
  if (value === "dark") return "lavande_nocturne";
  if (value === "fun") return "bloc_neon";
  return getSystemTheme();
}
