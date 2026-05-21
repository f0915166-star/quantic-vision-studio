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
import { TopTable } from "@/components/dashboard/TopTable";
import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { Activity, DollarSign, Truck, Layers, Filter, Radio, TrendingUp, CalendarRange } from "lucide-react";

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
    return { costo, bienes, equipos, resps, n: filtered.length, delta, avgMonth, monthsCount, peakLabel, peakVal };
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

  const pctOfTotal = all.length ? (filtered.length / all.length) * 100 : 0;
  const activeCount = filters.categorias.size + filters.equipos.size + filters.areas.size + filters.biens.size + filters.responsables.size;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="px-4 lg:px-8 h-16 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="panel px-3 py-1.5 flex items-center gap-2 text-xs font-semibold hover:panel-glow transition-all">
            <Filter className="w-3.5 h-3.5 text-primary" /> Filtros
            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] font-mono">{activeCount}</span>
            )}
          </button>

          <div className="flex items-center gap-2 ml-1">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.78_0.18_165)] to-[oklch(0.55_0.2_265)] flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Activity className="w-4 h-4 text-background" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight leading-none">NEXUS<span className="text-primary">·</span>OPS</h1>
              <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">Fleet Cost Intelligence</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 ml-4 px-3 py-1 rounded-full bg-success/10 border border-success/30">
            <Radio className="w-3 h-3 text-[color:var(--color-success)] animate-pulse" />
            <span className="text-[10px] font-mono text-[color:var(--color-success)] uppercase tracking-wider">Live</span>
            <span className="text-[10px] font-mono text-muted-foreground">{lastUpdated?.toLocaleTimeString("es-PE")}</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-xs font-mono">
              <Stat label="Universo" value={fmtCompact(all.length)} />
              <Stat label="En vista" value={fmtCompact(filtered.length)} accent />
              <Stat label="% activo" value={`${pctOfTotal.toFixed(1)}%`} />
            </div>
          </div>
        </div>
      </header>

      <FilterSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="px-4 lg:px-8 py-6 space-y-5 max-w-[1800px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between gap-4 flex-wrap mb-1">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">Dashboard ejecutivo</div>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mt-1">
                Costos de <span className="text-gradient">Repuestos & Combustible</span> · Flota móvil
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filtered.length === all.length
                  ? "Vista completa · Cualquier elemento es interactivo y filtra todo el tablero"
                  : `Filtro activo · ${fmtCompact(filtered.length)} de ${fmtCompact(all.length)} movimientos`}
              </p>
            </div>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors panel px-3 py-1.5">
              Reset visual
            </button>
          </div>
        </motion.div>

        <ActiveFilters />

        {/* KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Costo total" value={fmtCurrency(stats.costo)} sublabel="vs primer semestre" delta={stats.delta} icon={<DollarSign className="w-4 h-4" />} accent="primary" />
          <KpiCard label="Promedio mensual" value={fmtCurrency(stats.avgMonth)} sublabel={`${stats.monthsCount} meses activos`} icon={<TrendingUp className="w-4 h-4" />} accent="accent" />
          <KpiCard label="Mes pico" value={stats.peakLabel} sublabel={fmtCurrency(stats.peakVal)} icon={<CalendarRange className="w-4 h-4" />} accent="warning" />
          <KpiCard label="Movimientos" value={fmtCompact(stats.n)} sublabel="registros operativos" icon={<Activity className="w-4 h-4" />} accent="accent" />
          <KpiCard label="Equipos móviles" value={fmtCompact(stats.equipos)} sublabel={`${stats.resps} responsables`} icon={<Truck className="w-4 h-4" />} accent="info" />
          <KpiCard label="Bienes únicos" value={fmtCompact(stats.bienes)} sublabel="SKUs operativos" icon={<Layers className="w-4 h-4" />} accent="warning" />
        </div>


        {/* ROW 2: tendencia mensual full */}
        <TrendChart data={filtered} />

        {/* ROW 3: FLOTA — equipo móvil (70%) + Áreas donut (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          <div className="lg:col-span-7"><EquipoChart data={filtered} /></div>
          <div className="lg:col-span-3"><AreaDonut data={filtered} /></div>
        </div>

        {/* ROW 4: Pareto + Treemap (bienes y categorías) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ParetoChart data={filtered} />
          <TreemapChart data={filtered} />
        </div>

        {/* ROW 5: Responsables */}
        <div className="grid grid-cols-1 gap-4">
          <ResponsableRanking data={filtered} />
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${accent ? "text-primary font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
