import React from "react";
import { createPortal } from "react-dom";
import Challenges from "../pages/Challenges.jsx";
import { apiFetch } from "../lib/api.js";
import { getStoredActiveTab, TAB_CHANGE_EVENT } from "../lib/tab-navigation.js";

const PAGE_REGISTRY = Object.freeze({
  challenges: Challenges,
});

function useActiveTab() {
  const [activeTab, setActiveTab] = React.useState(getStoredActiveTab);

  React.useEffect(() => {
    const onTabChange = (event) => {
      setActiveTab(event?.detail?.tab || getStoredActiveTab());
    };
    window.addEventListener(TAB_CHANGE_EVENT, onTabChange);
    return () => window.removeEventListener(TAB_CHANGE_EVENT, onTabChange);
  }, []);

  return activeTab;
}

function useShellTarget(active) {
  const [target, setTarget] = React.useState(null);

  React.useEffect(() => {
    if (!active) {
      setTarget(null);
      return undefined;
    }

    const resolveTarget = () => {
      const shell = document.querySelector(".shell");
      if (shell) setTarget(shell);
      return shell;
    };

    if (resolveTarget()) return undefined;

    const observer = new MutationObserver(() => {
      if (resolveTarget()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [active]);

  return target;
}

function useAdminStatus(active) {
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (!active) return undefined;
    let mounted = true;
    apiFetch("/auth/me")
      .then((data) => {
        if (mounted) setIsAdmin(data?.user?.role === "admin");
      })
      .catch(() => {
        if (mounted) setIsAdmin(false);
      });
    return () => { mounted = false; };
  }, [active]);

  return isAdmin;
}

export default function AppPageOutlet() {
  const activeTab = useActiveTab();
  const PageComponent = PAGE_REGISTRY[activeTab] || null;
  const target = useShellTarget(Boolean(PageComponent));
  const isAdmin = useAdminStatus(Boolean(PageComponent));

  if (!PageComponent || !target) return null;
  return createPortal(<PageComponent isAdmin={isAdmin} />, target);
}
