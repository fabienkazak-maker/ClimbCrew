import React from "react";
import { getVisibleTabs } from "./navigation.js";

export default function AppShell({
  title = "ClimbCrew",
  isAdmin = false,
  children,
}) {
  const tabs = getVisibleTabs({ isAdmin });

  return (
    <div data-app-shell="true">
      <header style={{ display: "none" }} aria-hidden="true">
        <h1>{title}</h1>
        <nav>
          <ul>
            {tabs.map((tab) => (
              <li key={tab.key}>{tab.label}</li>
            ))}
          </ul>
        </nav>
      </header>
      {children}
    </div>
  );
}
