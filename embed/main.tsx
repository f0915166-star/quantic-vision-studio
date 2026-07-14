import "@/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DataProvider } from "@/lib/data-store";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DataPayload } from "@/lib/data-types";
import bundledData from "../public/data/consolidado.json";

// Data embebida al build — sin fetch, funciona con file://
if (typeof window !== "undefined" && !window.__EMBED_DATA__) {
  window.__EMBED_DATA__ = bundledData as unknown as DataPayload;
}

declare global {
  interface Window {
    __EMBED_DATA__?: DataPayload;
    google?: {
      script?: {
        run?: {
          withSuccessHandler: (cb: (json: string) => void) => {
            withFailureHandler: (cb: (err: unknown) => void) => {
              getSpreadsheetDataJSON: () => void;
            };
          };
        };
      };
    };
  }
}

function mount() {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <DataProvider initialData={window.__EMBED_DATA__}>
        <DashboardShell />
      </DataProvider>
    </StrictMode>,
  );
}

function showError(msg: string) {
  const el = document.getElementById("root");
  if (el) {
    el.innerHTML = `<div style="padding:24px;font-family:system-ui;color:#c44">Error cargando datos: ${msg}</div>`;
  }
}

// Apps Script mode: pull data via google.script.run
if (typeof window !== "undefined" && window.google?.script?.run) {
  window.google.script.run
    .withSuccessHandler((json: string) => {
      try {
        window.__EMBED_DATA__ = JSON.parse(json) as DataPayload;
        mount();
      } catch (e) {
        showError(String(e));
      }
    })
    .withFailureHandler((err) => showError(String(err)))
    .getSpreadsheetDataJSON();
} else {
  mount();
}
