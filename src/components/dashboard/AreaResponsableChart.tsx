import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCompact, fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

const PALETTE = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"].map(c => `var(--color-${c})`);

export function AreaResponsableChart({ data }: { data: Movement[] }) {
  const { filters, toggleFilter } = useData();
  const active = filters.areas;

  const agg = useMemo(() => {
    const m = new Map<string, { area: string; costo: number; n: number }>();
    for (const r of data) {
      const cur = m.get(r.area) ?? { area: r.area, costo: 0, n: 0 };
      cur.costo += r.costo; cur.n += 1;
      m.set(r.area, cur);
    }
    const arr = Array.from(m.values()).sort((a, b) => b.costo - a.costo);
    const total = arr.reduce((s, x) => s + x.costo, 0);
    return arr.map(x => ({ ...x, pct: total ? (x.costo / total) * 100 : 0 }));
  }, [data]);

  return (
    <ChartPanel
      title="Costo por Área Responsable"
      subtitle="Asignación operativa del gasto. Click para aislar"
      kicker="Distribución por área"
      exportData={() => ({
        filename: "areas.csv",
        csv: "area,costo,movimientos,porcentaje\n" + agg.map(r => `${r.area},${r.costo},${r.n},${r.pct.toFixed(2)}`).join("\n"),
      })}
    >
      <ResponsiveContainer width="100%" height={Math.max(260, agg.length * 44)}>
        <BarChart data={agg} layout="vertical" margin={{ top: 4, right: 60, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" horizontal={false} />
          <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
          <YAxis dataKey="area" type="category" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={170} />
          <Tooltip
            cursor={{ fill: "oklch(0.78 0.18 165 / 0.08)" }}
            content={({ active: a, payload }) => {
              if (!a || !payload?.length) return null;
              const p = payload[0].payload as { area: string; costo: number; n: number; pct: number };
              return (
                <div className="panel px-3 py-2 text-xs font-mono">
                  <div className="font-semibold mb-1">{p.area}</div>
                  <div className="flex justify-between gap-6"><span>Costo</span><span className="text-primary">{fmtCurrency(p.costo)}</span></div>
                  <div className="flex justify-between gap-6"><span>% del total</span><span className="text-[color:var(--color-warning)]">{p.pct.toFixed(1)}%</span></div>
                  <div className="flex justify-between gap-6 text-muted-foreground"><span>Movs</span><span>{p.n}</span></div>
                </div>
              );
            }}
          />
          <Bar dataKey="costo" radius={[0, 6, 6, 0]} onClick={(d) => toggleFilter("areas", (d as { area: string }).area)} cursor="pointer">
            {agg.map((d, i) => (
              <Cell key={d.area}
                fill={PALETTE[i % PALETTE.length]}
                fillOpacity={active.size === 0 || active.has(d.area) ? 1 : 0.25}
                stroke={active.has(d.area) ? "var(--color-foreground)" : "transparent"}
                strokeWidth={1.5}
              />
            ))}
            <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v.toFixed(1)}%`}
              style={{ fill: "var(--color-muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
