import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./api-error-messages.js";
import "./issue-13-access-page.js";
import "./climbcrew-enhancements.js";
import "./issue-11.css";
import "./issue-13-access-page.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
