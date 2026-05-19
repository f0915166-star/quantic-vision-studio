import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCompact, fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

const COLORS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"].map(c => `var(--color-${c})`);

export function CategoryBar({ data }: { data: Movement[] }) {
  const { filters, toggleFilter } = useData();
  const active = filters.categorias;

  const agg = useMemo(() => {
    const m = new Map<string, { categoria: string; costo: number; cantidad: number; n: number }>();
    for (const r of data) {
      const cur = m.get(r.categoria) ?? { categoria: r.categoria, costo: 0, cantidad: 0, n: 0 };
      cur.costo += r.costo; cur.cantidad += r.cantidad; cur.n += 1;
      m.set(r.categoria, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.costo - a.costo);
  }, [data]);

  return (
    <ChartPanel
      title="Costo por categoría"
      subtitle="Click en una barra para filtrar"
      kicker="Distribución"
      exportData={() => ({
        filename: "categorias.csv",
        csv: "categoria,costo,cantidad,movimientos\n" + agg.map(r => `${r.categoria},${r.costo},${r.cantidad},${r.n}`).join("\n"),
      })}
    >
      <ResponsiveContainer width="100%" height={Math.max(280, agg.length * 22)}>
        <BarChart data={agg} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" horizontal={false} />
          <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
          <YAxis dataKey="categoria" type="category" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={150} />
          <Tooltip
            cursor={{ fill: "oklch(0.78 0.18 165 / 0.08)" }}
            content={({ active: a, payload }) => {
              if (!a || !payload?.length) return null;
              const p = payload[0].payload as { categoria: string; costo: number; cantidad: number; n: number };
              return (
                <div className="panel px-3 py-2 text-xs font-mono">
                  <div className="font-semibold mb-1">{p.categoria}</div>
                  <div className="flex justify-between gap-6"><span>Costo</span><span className="text-primary">{fmtCurrency(p.costo)}</span></div>
                  <div className="flex justify-between gap-6"><span>Cantidad</span><span>{fmtCompact(p.cantidad)}</span></div>
                  <div className="flex justify-between gap-6 text-muted-foreground"><span>Movs</span><span>{p.n}</span></div>
                </div>
              );
            }}
          />
          <Bar dataKey="costo" radius={[0, 6, 6, 0]} onClick={(d) => toggleFilter("categorias", (d as { categoria: string }).categoria)} cursor="pointer">
            {agg.map((d, i) => (
              <Cell key={d.categoria}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={active.size === 0 || active.has(d.categoria) ? 1 : 0.25}
                stroke={active.has(d.categoria) ? "var(--color-foreground)" : "transparent"}
                strokeWidth={1.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
