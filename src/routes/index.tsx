import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { DataProvider } from "@/lib/data-store";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { askDashboard } from "@/lib/chat.functions";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  useEffect(() => {
    window.__askDashboard__ = async (question: string, context: string) => {
      const r = await askDashboard({ data: { question, context } });
      return r.answer;
    };
  }, []);
  return (
    <DataProvider>
      <DashboardShell />
    </DataProvider>
  );
}
