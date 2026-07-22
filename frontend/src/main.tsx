import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./styles/base.css";
import "./styles/auth.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/responsive.css";
import "./styles/theme.css";

const root = document.getElementById("root");
if (!root) throw new Error("Élément racine introuvable");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
