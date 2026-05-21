import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCurrency, fmtCompact, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";
import { PieChart as PieIcon } from "lucide-react";

// Paleta distinta a la del gráfico de equipos (combustible/repuestos)
// para evitar que se confunda Producción con Combustible.
const PALETTE = [
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
  "var(--color-chart-2)",
  "var(--color-chart-4)",
];

export function AreaDonut({ data }: { data: Movement[] }) {
  const { toggleFilter, filters } = useData();
  const active = filters.areas;

  const agg = useMemo(() => {
    const m = new Map<string, { area: string; costo: number; n: number }>();
    for (const r of data) {
      const cur = m.get(r.area) ?? { area: r.area, costo: 0, n: 0 };
      cur.costo += r.costo;
      cur.n += 1;
      m.set(r.area, cur);
    }
    const arr = Array.from(m.values()).sort((a, b) => b.costo - a.costo);
    const total = arr.reduce((s, x) => s + x.costo, 0);
    return arr.map((x, i) => ({
      ...x,
      pct: total ? (x.costo / total) * 100 : 0,
      fill: PALETTE[i % PALETTE.length],
    }));
  }, [data]);

  const total = agg.reduce((s, x) => s + x.costo, 0);
  const totalN = agg.reduce((s, x) => s + x.n, 0);

  return (
    <ChartPanel
      title="Producción vs Mantenimiento"
      subtitle="Distribución del costo por área. Click para filtrar"
      kicker={<span className="inline-flex items-center gap-1"><PieIcon className="w-3 h-3" /> Áreas</span>}
      exportData={() => ({
        filename: "areas-donut.csv",
        csv: "area,costo,movimientos,porcentaje\n" +
          agg.map(r => `"${r.area}",${r.costo.toFixed(2)},${r.n},${r.pct.toFixed(2)}`).join("\n"),
      })}
    >
      <div className="relative h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={agg}
              dataKey="costo"
              nameKey="area"
              cx="50%"
              cy="50%"
              innerRadius={88}
              outerRadius={135}
              paddingAngle={2}
              stroke="var(--color-background)"
              strokeWidth={2}
              onClick={(d) => toggleFilter("areas", (d as { area: string }).area)}
              cursor="pointer"
            >
              {agg.map((d) => (
                <Cell
                  key={d.area}
                  fill={d.fill}
                  fillOpacity={active.size === 0 || active.has(d.area) ? 1 : 0.25}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active: a, payload }) => {
                if (!a || !payload?.length) return null;
                const p = payload[0].payload as { area: string; costo: number; n: number; pct: number };
                return (
                  <div className="panel px-3 py-2 text-xs font-mono">
                    <div className="font-semibold mb-1">{p.area}</div>
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
            key={d.area}
            onClick={() => toggleFilter("areas", d.area)}
            className="flex items-center gap-2 text-xs cursor-pointer group"
          >
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.fill }} />
            <span className="flex-1 truncate font-semibold group-hover:text-primary transition-colors">{d.area}</span>
            <span className="tabular-nums text-muted-foreground">{d.pct.toFixed(1)}%</span>
            <span className="tabular-nums text-foreground/80 text-[11px] font-mono">{fmtCurrency(d.costo)}</span>
          </li>
        ))}
      </ul>
    </ChartPanel>
  );
}
