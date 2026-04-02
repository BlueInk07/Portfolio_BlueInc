import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import "./index.css";

const Projects = lazy(() => import("./pages/Projects"));
const UIUX = lazy(() => import("./pages/UIUX"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/uiux" element={<UIUX />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
