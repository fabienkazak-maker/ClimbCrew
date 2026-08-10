import { TABS } from "../config/app-shell-config.js";

export const APP_TABS = TABS;

export function getVisibleTabs({ isAdmin = false } = {}) {
  return APP_TABS.filter((tab) => !tab.adminOnly || isAdmin);
}
