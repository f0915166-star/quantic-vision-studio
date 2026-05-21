import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCompact, fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

const PALETTE = [
  "var(--color-chart-4)",
  "var(--color-chart-2)",
  "var(--color-chart-1)",
  "var(--color-chart-3)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

export function ParetoChart({ data }: { data: Movement[] }) {
  const { toggleFilter, filters } = useData();

  const series = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data) m.set(r.bien, (m.get(r.bien) ?? 0) + r.costo);
    const sorted = Array.from(m.entries())
      .map(([bien, costo]) => ({ bien, costo }))
      .sort((a, b) => b.costo - a.costo);
    const arr = sorted.slice(0, 10);
    const rest = sorted.slice(10);
    if (rest.length) {
      arr.push({ bien: "Otros", costo: rest.reduce((s, x) => s + x.costo, 0) });
    }
    const total = arr.reduce((s, x) => s + x.costo, 0);
    let acc = 0;
    return arr.map((x, i) => {
      acc += x.costo;
      return {
        ...x,
        pct: total ? (acc / total) * 100 : 0,
        share: total ? (x.costo / total) * 100 : 0,
        short: x.bien.length > 34 ? x.bien.slice(0, 34) + "…" : x.bien,
        fill: PALETTE[i % PALETTE.length],
      };
    });
  }, [data]);

  return (
    <ChartPanel
      title="Análisis Pareto — Top bienes"
      subtitle="80/20: los pocos vitales del costo total"
      kicker="Pareto 80/20"
      exportData={() => ({
        filename: "pareto-bienes.csv",
        csv: "bien,costo,share,acumulado\n" + series.map(r => `"${r.bien}",${r.costo.toFixed(2)},${r.share.toFixed(2)},${r.pct.toFixed(2)}`).join("\n"),
      })}
    >
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={series} layout="vertical" margin={{ top: 4, right: 70, left: 0, bottom: 0 }} barCategoryGap={4}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" horizontal={false} />
          <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
          <YAxis dataKey="short" type="category" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={220} interval={0} />
          <Tooltip
            cursor={{ fill: "oklch(0.78 0.18 165 / 0.08)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { bien: string; costo: number; pct: number; share: number };
              return (
                <div className="panel px-3 py-2 text-xs font-mono max-w-xs">
                  <div className="font-semibold mb-1 break-words">{p.bien}</div>
                  <div className="flex justify-between gap-6"><span>Costo</span><span className="text-primary">{fmtCurrency(p.costo)}</span></div>
                  <div className="flex justify-between gap-6"><span>% del total</span><span className="text-[color:var(--color-warning)]">{p.share.toFixed(1)}%</span></div>
                  <div className="flex justify-between gap-6 text-muted-foreground"><span>Acumulado</span><span>{p.pct.toFixed(1)}%</span></div>
                </div>
              );
            }}
          />
          <Bar dataKey="costo" radius={[0, 6, 6, 0]} cursor="pointer"
            onClick={(d) => toggleFilter("biens", (d as { bien: string }).bien)}>
            {series.map((s) => {
              const selected = filters.biens.has(s.bien);
              return (
                <Cell key={s.bien}
                  fill={s.fill}
                  fillOpacity={filters.biens.size === 0 || selected ? 1 : 0.25}
                  stroke={selected ? "var(--color-foreground)" : "transparent"}
                  strokeWidth={1.2}
                />
              );
            })}
            <LabelList dataKey="costo" position="right" formatter={(v: number) => fmtCompact(v)}
              style={{ fill: "var(--color-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
