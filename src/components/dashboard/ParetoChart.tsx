import { useMemo } from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCompact, fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

export function ParetoChart({ data }: { data: Movement[] }) {
  const { toggleFilter, filters } = useData();
  const series = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data) m.set(r.bien, (m.get(r.bien) ?? 0) + r.costo);
    const arr = Array.from(m.entries()).map(([bien, costo]) => ({ bien, costo })).sort((a, b) => b.costo - a.costo).slice(0, 15);
    const total = arr.reduce((s, x) => s + x.costo, 0);
    let acc = 0;
    return arr.map(x => { acc += x.costo; return { ...x, pct: total ? (acc / total) * 100 : 0, short: x.bien.length > 22 ? x.bien.slice(0, 22) + "…" : x.bien }; });
  }, [data]);

  return (
    <ChartPanel title="Análisis Pareto — Top bienes" subtitle="80/20: los pocos vitales del costo total" kicker="Pareto 80/20">
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="short" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false}
            angle={-35} textAnchor="end" interval={0} height={60} />
          <YAxis yAxisId="l" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtCompact} width={55} scale="log" domain={[100, 'dataMax']} allowDataOverflow />
          <YAxis yAxisId="r" orientation="right" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} width={35} />
          <Tooltip
            cursor={{ fill: "oklch(0.78 0.18 165 / 0.08)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { bien: string; costo: number; pct: number };
              return (
                <div className="panel px-3 py-2 text-xs font-mono max-w-xs">
                  <div className="font-semibold mb-1 break-words">{p.bien}</div>
                  <div className="flex justify-between gap-6"><span>Costo</span><span className="text-primary">{fmtCurrency(p.costo)}</span></div>
                  <div className="flex justify-between gap-6"><span>Acumulado</span><span className="text-[color:var(--color-warning)]">{p.pct.toFixed(1)}%</span></div>
                </div>
              );
            }}
          />
          <Bar yAxisId="l" dataKey="costo" radius={[6, 6, 0, 0]} cursor="pointer"
            onClick={(d) => toggleFilter("biens", (d as { bien: string }).bien)}>
            {series.map((s, i) => {
              const isMax = i === 0;
              const selected = filters.biens.has(s.bien);
              return (
                <Cell key={s.bien}
                  fill={isMax || selected ? "var(--color-chart-4)" : "var(--color-chart-2)"}
                  fillOpacity={filters.biens.size === 0 || selected ? 1 : 0.25} />
              );
            })}
          </Bar>
          <Line yAxisId="r" type="monotone" dataKey="pct" stroke="var(--color-chart-3)" strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-chart-3)" }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
