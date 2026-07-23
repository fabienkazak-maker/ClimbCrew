import { useState } from "react";
import { AchievementModal } from "./achievements/achievement-modal";
import { AccountsView } from "./admin/accounts-view";
import { LogsView } from "./admin/logs-view";
import { useAdminData } from "./admin/use-admin-data";
import { useAuth } from "./auth/auth-context";
import { useClimbData } from "./data/data-context";
import { FaqView } from "./faq/faq-view";
import { Sidebar } from "./navigation/sidebar";
import { TABS, type TabKey } from "./navigation/tabs";
import { AdministrationView } from "./participants/administration-view";
import { ProgressionView } from "./progression/progression-view";
import { RoutesView } from "./routes/routes-view";
import { SessionsView } from "./sessions/sessions-view";
import { StatisticsView } from "./statistics/statistics-view";

export function AppContent() {
  const auth = useAuth();
  const { syncStatus } = useClimbData();
  const admin = useAdminData();
  const [tab, setTab] = useState<TabKey>("inscriptions");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [achievementRouteId, setAchievementRouteId] = useState<string | null>(
    null,
  );
  if (!auth.user) return null;
  const tabs = TABS.filter(
    (item) => !item.adminOnly || auth.user?.role === "admin",
  );

  return (
    <div className="app">
      <Sidebar
        open={sidebarOpen}
        activeTab={tab}
        tabs={tabs}
        user={auth.user}
        onClose={() => setSidebarOpen(false)}
        onSelect={setTab}
        onLogout={() => void auth.logout()}
        onThemeChange={(theme) => void auth.updateTheme(theme)}
      />
      <header className="hero">
        <button
          type="button"
          className="menu-button"
          onClick={() => setSidebarOpen(true)}
        >
          Menu
        </button>
        <img
          src="/logo-climbcrew.png"
          alt="Logo ClimbCrew"
          className="app-logo"
        />
        <div className="hero-title">
          <h1>ClimbCrew</h1>
          <span className="small">{syncStatus}</span>
        </div>
        <button type="button" onClick={() => setAchievementRouteId("")}>
          Nouvelle réalisation
        </button>
      </header>
      <main className="shell">
        {tab === "inscriptions" && <SessionsView />}
        {tab === "voies" && (
          <RoutesView onAchievement={setAchievementRouteId} />
        )}
        {tab === "progression" && <ProgressionView />}
        {tab === "administration" && <AdministrationView />}
        {tab === "comptes" && <AccountsView admin={admin} />}
        {tab === "logs" && <LogsView admin={admin} />}
        {tab === "statistiques" && <StatisticsView />}
        {tab === "faq" && <FaqView />}
      </main>
      {achievementRouteId !== null && (
        <AchievementModal
          initialRouteId={achievementRouteId}
          onClose={() => setAchievementRouteId(null)}
        />
      )}
    </div>
  );
}
