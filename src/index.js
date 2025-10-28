import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";

import App from "./App";

//npm start in console to launch the app
//npm run deploy to deploy new version to github pages

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);