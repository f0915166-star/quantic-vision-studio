import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCurrency, fmtCompact, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";
import { Fuel } from "lucide-react";

// Mismos colores que EquipoChart: combustible = chart-1, repuestos = chart-3
// Nota: en la BD "Repuestos" agrupa todas las categorías ≠ COMBUSTIBLE
// (FILTRO, ACEITE, EPP, etc.), por eso el click setea el filtro como conjunto.
export function CategoriaDonut({ data, allData }: { data: Movement[]; allData: Movement[] }) {
  const { setFilter, filters } = useData();
  const active = filters.categorias;

  // Lista completa de categorías "repuesto" (todas menos COMBUSTIBLE) del universo
  const repuestoCats = useMemo(() => {
    const s = new Set<string>();
    for (const r of allData) if (r.categoria !== "COMBUSTIBLE") s.add(r.categoria);
    return Array.from(s);
  }, [allData]);

  const agg = useMemo(() => {
    let combustible = 0, repuestos = 0;
    let nC = 0, nR = 0;
    for (const r of data) {
      if (r.categoria === "COMBUSTIBLE") { combustible += r.costo; nC += 1; }
      else { repuestos += r.costo; nR += 1; }
    }
    const total = combustible + repuestos;
    const arr = [
      { key: "COMBUSTIBLE", label: "Combustible", costo: combustible, n: nC, fill: "var(--color-chart-1)" },
      { key: "REPUESTOS", label: "Repuestos", costo: repuestos, n: nR, fill: "var(--color-chart-3)" },
    ];
    return arr.map(x => ({ ...x, pct: total ? (x.costo / total) * 100 : 0 }));
  }, [data]);

  // Estado visual: ¿este slice está activo según los filtros actuales?
  const isActive = (key: string) => {
    if (active.size === 0) return true;
    if (key === "COMBUSTIBLE") return active.has("COMBUSTIBLE");
    // REPUESTOS activo si hay al menos una categoría no-combustible seleccionada
    for (const c of active) if (c !== "COMBUSTIBLE") return true;
    return false;
  };

  const handleClick = (key: string) => {
    if (key === "COMBUSTIBLE") {
      // Toggle solo combustible
      if (active.size === 1 && active.has("COMBUSTIBLE")) setFilter("categorias", []);
      else setFilter("categorias", ["COMBUSTIBLE"]);
    } else {
      // Toggle todas las categorías de repuesto
      const hasAnyRep = Array.from(active).some(c => c !== "COMBUSTIBLE");
      if (hasAnyRep && !active.has("COMBUSTIBLE")) setFilter("categorias", []);
      else setFilter("categorias", repuestoCats);
    }
  };

  const total = agg.reduce((s, x) => s + x.costo, 0);
  const totalN = agg.reduce((s, x) => s + x.n, 0);

  return (
    <ChartPanel
      title="Combustible vs Repuestos"
      subtitle="Distribución total del costo por categoría"
      kicker={<span className="inline-flex items-center gap-1"><Fuel className="w-3 h-3" /> Categoría</span>}
      exportData={() => ({
        filename: "categoria-donut.csv",
        csv: "categoria,costo,movimientos,porcentaje\n" +
          agg.map(r => `"${r.label}",${r.costo.toFixed(2)},${r.n},${r.pct.toFixed(2)}`).join("\n"),
      })}
    >
      <div className="relative h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={agg}
              dataKey="costo"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={66}
              outerRadius={104}
              paddingAngle={2}
              stroke="var(--color-background)"
              strokeWidth={2}
              onClick={(d) => handleClick((d as { key: string }).key)}
              cursor="pointer"
            >
              {agg.map((d) => (
                <Cell
                  key={d.key}
                  fill={d.fill}
                  fillOpacity={isActive(d.key) ? 1 : 0.25}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active: a, payload }) => {
                if (!a || !payload?.length) return null;
                const p = payload[0].payload as { label: string; costo: number; n: number; pct: number };
                return (
                  <div className="panel px-3 py-2 text-xs font-mono">
                    <div className="font-semibold mb-1">{p.label}</div>
                    <div className="flex justify-between gap-6"><span>Costo</span><span className="text-primary">{fmtCurrency(p.costo)}</span></div>
                    <div className="flex justify-between gap-6"><span>%</span><span className="text-[color:var(--color-warning)]">{p.pct.toFixed(1)}%</span></div>
                    <div className="flex justify-between gap-6 text-muted-foreground"><span>Movs</span><span>{p.n}</span></div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Total</div>
          <div className="text-xl font-bold tabular-nums">{fmtCompact(total)}</div>
          <div className="text-[10px] font-mono text-muted-foreground">{totalN} movs</div>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {agg.map((d) => (
          <li
            key={d.key}
            onClick={() => handleClick(d.key)}
            className="flex items-center gap-2 text-xs cursor-pointer group"
          >
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.fill }} />
            <span className="flex-1 truncate font-semibold group-hover:text-primary transition-colors">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">{d.pct.toFixed(1)}%</span>
            <span className="tabular-nums text-foreground/80 text-[11px] font-mono">{fmtCurrency(d.costo)}</span>
          </li>
        ))}
      </ul>
    </ChartPanel>
  );
}
