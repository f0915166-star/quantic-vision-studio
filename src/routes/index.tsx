import { createFileRoute } from "@tanstack/react-router";
import { DataProvider } from "@/lib/data-store";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/")({
  component: () => (
    <DataProvider>
      <DashboardShell />
    </DataProvider>
  ),
});
