import type { AuthUser } from "../domain/types";
import type { TabDefinition, TabKey } from "./tabs";
import { ThemeSelect } from "./theme-select";

interface SidebarProps {
  open: boolean;
  activeTab: TabKey;
  tabs: TabDefinition[];
  user: AuthUser;
  onClose(): void;
  onSelect(tab: TabKey): void;
  onLogout(): void;
  onThemeChange(theme: AuthUser["themePreference"]): void;
}

export function Sidebar({
  open,
  activeTab,
  tabs,
  user,
  onClose,
  onSelect,
  onLogout,
  onThemeChange,
}: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fermer"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo-climbcrew.png" alt="" className="sidebar-logo" />
            <span>ClimbCrew</span>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Fermer
          </button>
        </div>
        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={`side-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => {
                onSelect(tab.key);
                onClose();
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-account">
          <strong>
            {user.prenom} {user.nom}
          </strong>
          <span className="small">{user.email}</span>
          <ThemeSelect value={user.themePreference} onChange={onThemeChange} />
          <button type="button" className="secondary" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
