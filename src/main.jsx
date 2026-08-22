import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/typography.css";
import "./styles/global.css";
import "./styles/utilities.css";
import "./components/brand/logo.css";
import "./components/ui/primitives.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
