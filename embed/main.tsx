import "@/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DataProvider } from "@/lib/data-store";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import data from "../public/data/consolidado.json";
import type { DataPayload } from "@/lib/data-types";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <DataProvider initialData={data as unknown as DataPayload}>
      <DashboardShell />
    </DataProvider>
  </StrictMode>,
);
