import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./legacy/api-error-messages.js";
import "./legacy/issue-13-access-page.js";
import "./legacy/admin-user-management.js";
import "./legacy/climbcrew-enhancements.js";
import "./styles/issue-11.css";
import "./styles/issue-13-access-page.css";
import "./styles/issue-16-routes.css";
import "./styles/admin-user-management.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);


