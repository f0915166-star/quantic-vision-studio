import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DataProvider, useData, fmtCurrency, fmtCompact } from "@/lib/data-store";
import { ActiveFilters } from "@/components/dashboard/ActiveFilters";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { ParetoChart } from "@/components/dashboard/ParetoChart";

import { TreemapChart } from "@/components/dashboard/TreemapChart";

import { ResponsableRanking } from "@/components/dashboard/ResponsableRanking";
import { EquipoChart } from "@/components/dashboard/EquipoChart";
import { AreaDonut } from "@/components/dashboard/AreaDonut";
import { CategoriaDonut } from "@/components/dashboard/CategoriaDonut";
import { TopTable } from "@/components/dashboard/TopTable";
import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { Activity, DollarSign, Truck, Layers, Filter, TrendingUp, CalendarRange } from "lucide-react";

export const Route = createFileRoute("/")({
  component: () => (
    <DataProvider>
      <DashboardShell />
    </DataProvider>
  ),
});

function DashboardShell() {
  const { loading, error, all, filtered, lastUpdated, filters, reset } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = useMemo(() => {
    const costo = filtered.reduce((s, r) => s + r.costo, 0);
    const bienes = new Set(filtered.map(r => r.bien)).size;
    const equipos = new Set(filtered.map(r => r.equipo)).size;
    const resps = new Set(filtered.map(r => r.responsable)).size;
    const dates = filtered.map(r => r.fecha).filter(Boolean).sort();
    let delta: number | undefined;
    if (dates.length > 10) {
      const mid = dates[Math.floor(dates.length / 2)];
      let a = 0, b = 0;
      for (const r of filtered) (r.fecha < mid ? a += r.costo : b += r.costo);
      if (a > 0) delta = ((b - a) / a) * 100;
    }
    // Equipo y bien con mayor costo
    const equipoMap = new Map<string, number>();
    const bienMap = new Map<string, number>();
    for (const r of filtered) {
      equipoMap.set(r.equipo, (equipoMap.get(r.equipo) ?? 0) + r.costo);
      bienMap.set(r.bien, (bienMap.get(r.bien) ?? 0) + r.costo);
    }
    let topEquipo = ""; let topEquipoVal = 0;
    equipoMap.forEach((v, k) => { if (v > topEquipoVal) { topEquipoVal = v; topEquipo = k; } });
    let topBien = ""; let topBienVal = 0;
    bienMap.forEach((v, k) => { if (v > topBienVal) { topBienVal = v; topBien = k; } });
    // Mes pico + promedio mensual
    const MES_ABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const monthly = new Map<string, number>();
    for (const r of filtered) {
      const k = r.fecha?.slice(0, 7);
      if (!k) continue;
      monthly.set(k, (monthly.get(k) ?? 0) + r.costo);
    }
    const monthsCount = monthly.size;
    const avgMonth = monthsCount ? costo / monthsCount : 0;
    let peakKey = ""; let peakVal = 0;
    monthly.forEach((v, k) => { if (v > peakVal) { peakVal = v; peakKey = k; } });
    const peakLabel = peakKey
      ? `${MES_ABBR[Number(peakKey.slice(5, 7)) - 1]} ${peakKey.slice(2, 4)}`
      : "—";
    return { costo, bienes, equipos, resps, n: filtered.length, delta, avgMonth, monthsCount, peakLabel, peakVal, topEquipo, topEquipoVal, topBien, topBienVal };
  }, [filtered]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground font-mono">Cargando datos operativos…</div>
        </div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-destructive">Error: {error}</div>;

  
  const activeCount = filters.categorias.size + filters.equipos.size + filters.areas.size + filters.biens.size + filters.responsables.size;

  const todayText = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen">
      <FilterSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* TOP HEADER — estilo Norlima */}
      <header
        className="sticky top-0 z-40 px-4 lg:px-8 py-3 text-white"
        style={{
          background:
            "linear-gradient(115deg, hsl(25 45% 11%) 0%, hsl(25 38% 19%) 55%, hsl(20 50% 25%) 100%)",
          boxShadow: "0 10px 30px -14px hsl(25 35% 8% / 0.6)",
          borderBottom: "1px solid hsl(6 72% 48% / 0.4)",
        }}
      >
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center min-w-0">
            <div
              className="flex items-center justify-center font-bold tracking-tight shrink-0"
              style={{
                height: 46, minWidth: 46, padding: "0 13px", borderRadius: 10,
                background: "linear-gradient(135deg, hsl(6 80% 54%), hsl(12 78% 42%))",
                color: "#fff", fontFamily: "Outfit, sans-serif",
                fontSize: 16, letterSpacing: "0.6px",
                boxShadow: "0 6px 18px -6px hsl(6 72% 38% / 0.7)",
              }}
            >
              NORLIMA
            </div>
            <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.16)", margin: "0 16px" }} className="hidden sm:block" />
            <div className="flex flex-col min-w-0">
              <h1 className="font-bold leading-tight text-white whitespace-nowrap" style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.18rem", letterSpacing: "0.3px" }}>
                Costos de <span style={{ color: "hsl(6 80% 64%)" }}>Repuestos & Combustible</span> · Flota móvil
              </h1>
              <p className="text-[0.65rem] font-medium uppercase whitespace-nowrap" style={{ letterSpacing: "0.12em", color: "rgba(255,255,255,0.48)" }}>
                Planta Lark · Inversiones Norlima S.A.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="relative inline-flex items-center gap-1.5 text-[11px] font-semibold transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 8,
                padding: "0.38rem 0.7rem",
                color: "rgba(255,255,255,0.9)",
              }}
              title="Filtros"
            >
              <Filter className="w-3.5 h-3.5" style={{ color: "hsl(42 92% 62%)" }} />
              
              {activeCount > 0 && (
                <span
                  className="rounded-full px-1.5 text-[10px] font-mono font-bold"
                  style={{ background: "hsl(6 80% 54%)", color: "#fff" }}
                >
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 lg:px-8 py-6 space-y-5 max-w-[1800px] mx-auto">


        <ActiveFilters />

        {/* KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Costo total" value={fmtCurrency(stats.costo)} sublabel="vs primer semestre" delta={stats.delta} icon={<DollarSign className="w-4 h-4" />} accent="primary" />
          <KpiCard label="Promedio mensual" value={fmtCurrency(stats.avgMonth)} sublabel={`${stats.monthsCount} meses activos`} icon={<TrendingUp className="w-4 h-4" />} accent="accent" />
          <KpiCard label="Mes pico" value={stats.peakLabel} sublabel={fmtCurrency(stats.peakVal)} icon={<CalendarRange className="w-4 h-4" />} accent="warning" />
          <KpiCard label="Movimientos" value={fmtCompact(stats.n)} sublabel="registros operativos" icon={<Activity className="w-4 h-4" />} accent="accent" />
          <KpiCard label="Equipo más costoso" value={stats.topEquipo ? (stats.topEquipo.length > 22 ? stats.topEquipo.slice(0, 22) + "…" : stats.topEquipo) : "—"} sublabel={fmtCurrency(stats.topEquipoVal)} icon={<Truck className="w-4 h-4" />} accent="info" />
          <KpiCard label="Bien más costoso" value={stats.topBien ? (stats.topBien.length > 22 ? stats.topBien.slice(0, 22) + "…" : stats.topBien) : "—"} sublabel={fmtCurrency(stats.topBienVal)} icon={<Layers className="w-4 h-4" />} accent="warning" />
        </div>


        {/* ROW 2: tendencia mensual full */}
        <TrendChart data={filtered} />

        {/* ROW 3: FLOTA — equipo móvil + 2 donuts, en equilibrio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6"><EquipoChart data={filtered} /></div>
          <div className="lg:col-span-3"><AreaDonut data={filtered} /></div>
          <div className="lg:col-span-3"><CategoriaDonut data={filtered} allData={all} /></div>
        </div>

        {/* ROW 4: Pareto + Responsables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ParetoChart data={filtered} />
          <ResponsableRanking data={filtered} />
        </div>

        {/* ROW 5: Treemap full width */}
        <div className="grid grid-cols-1 gap-4">
          <TreemapChart data={filtered} />
        </div>


        {/* ROW 6: tabla detalle */}
        <TopTable data={filtered} />

        <footer className="text-center text-[11px] text-muted-foreground font-mono py-6">
          NEXUS·OPS v1.1 · Esquema BIEN · CATEGORIA · FECHA_MOVIMIENTO · COSTO_TOTAL · CONCEPTO · AREA_RESPONSABLE · RESPONSABLE · Última sincronización {lastUpdated?.toLocaleString("es-PE")}
        </footer>
      </main>
    </div>
  );
}

