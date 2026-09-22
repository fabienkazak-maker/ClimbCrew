import { useState } from "react";

const PLANNING_VIEW_KEY = "climbcrew-planning-view";

function getInitialPlanningView() {
  if (typeof window === "undefined") return "jour";

  const savedView = window.localStorage.getItem(PLANNING_VIEW_KEY);
  if (savedView === "jour" || savedView === "semaine") return savedView;

  return typeof window.matchMedia === "function" && window.matchMedia("(min-width: 1200px)").matches
    ? "semaine"
    : "jour";
}

export function useAppUiState({ useApi }) {
  const [tab, setTab] = useState("inscriptions");
  const [viewModeState, setViewModeState] = useState(getInitialPlanningView);
  const setViewMode = (mode) => {
    setViewModeState(mode);
    if (typeof window !== "undefined" && (mode === "jour" || mode === "semaine")) {
      window.localStorage.setItem(PLANNING_VIEW_KEY, mode);
    }
  };
  const viewMode = viewModeState;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statsSortField, setStatsSortField] = useState("name");
  const [statsSortDirection, setStatsSortDirection] = useState("asc");
  const [wallOfFameSexFilter, setWallOfFameSexFilter] = useState("all");
  const [recentlyAddedParticipantIds, setRecentlyAddedParticipantIds] = useState([]);
  const [adminInput, setAdminInput] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [routeError, setRouteError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [, setSyncMessage] = useState(useApi ? "API activée" : "Mode local");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  return {
    tab, setTab, viewMode, setViewMode, sidebarOpen, setSidebarOpen,
    statsSortField, setStatsSortField, statsSortDirection, setStatsSortDirection,
    wallOfFameSexFilter, setWallOfFameSexFilter, recentlyAddedParticipantIds, setRecentlyAddedParticipantIds,
    adminInput, setAdminInput, adminUnlocked, setAdminUnlocked, adminError, setAdminError,
    routeError, setRouteError, importMessage, setImportMessage, setSyncMessage,
    confirmationMessage, setConfirmationMessage, isSyncing, setIsSyncing,
  };
}
