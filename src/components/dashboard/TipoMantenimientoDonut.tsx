import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCurrency, fmtCompact, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";
import { Wrench } from "lucide-react";

const COLORS: Record<string, string> = {
  PREVENTIVO: "var(--color-chart-2)",
  CORRECTIVO: "var(--color-chart-1)",
  OTROS: "var(--color-chart-7)",
};
const FALLBACK = [
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-8)",
];

export function TipoMantenimientoDonut({ data }: { data: Movement[] }) {
  const { toggleFilter, filters } = useData();
  const active = filters.tipos;
  const agg = useMemo(() => {
    const m = new Map<string, { key: string; costo: number; n: number }>();
    for (const r of data) {
      const k = (r.tipo || "—").toString().toUpperCase();
      const cur = m.get(k) ?? { key: k, costo: 0, n: 0 };
      cur.costo += r.costo;
      cur.n += 1;
      m.set(k, cur);
    }
    const arr = Array.from(m.values()).sort((a, b) => b.costo - a.costo);
    const total = arr.reduce((s, x) => s + x.costo, 0);
    return arr.map((x, i) => ({
      ...x,
      pct: total ? (x.costo / total) * 100 : 0,
      fill: COLORS[x.key] ?? FALLBACK[i % FALLBACK.length],
    }));
  }, [data]);

  const total = agg.reduce((s, x) => s + x.costo, 0);
  const totalN = agg.reduce((s, x) => s + x.n, 0);

  return (
    <ChartPanel
      title="Costos por Tipo de Mantenimiento"
      kicker={<span className="inline-flex items-center gap-1"><Wrench className="w-3 h-3" /> Tipo</span>}
      exportData={() => ({
        filename: "tipo-mantenimiento-donut.csv",
        csv: "tipo,costo,movimientos,porcentaje\n" +
          agg.map(r => `"${r.key}",${r.costo.toFixed(2)},${r.n},${r.pct.toFixed(2)}`).join("\n"),
      })}
    >
      <div className="relative h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={agg}
              dataKey="costo"
              nameKey="key"
              cx="50%"
              cy="50%"
              innerRadius={66}
              outerRadius={104}
              paddingAngle={2}
              stroke="var(--color-background)"
              strokeWidth={2}
              onClick={(d) => toggleFilter("tipos", (d as { key: string }).key)}
              cursor="pointer"
            >
              {agg.map((d) => (
                <Cell
                  key={d.key}
                  fill={d.fill}
                  fillOpacity={active.size === 0 || active.has(d.key) ? 1 : 0.25}
                />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ zIndex: 100, outline: "none", pointerEvents: "none" }}
              allowEscapeViewBox={{ x: true, y: true }}
              offset={16}
              content={({ active: a, payload }) => {
                if (!a || !payload?.length) return null;
                const p = payload[0].payload as { key: string; costo: number; n: number; pct: number; fill: string };
                return (
                  <div className="rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl px-3 py-2 text-xs font-mono min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-border">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.fill }} />
                      <span className="font-semibold text-foreground uppercase tracking-wide text-[11px]">{p.key}</span>
                    </div>
                    <div className="flex justify-between gap-6"><span className="text-muted-foreground">Costo</span><span className="text-foreground font-semibold">{fmtCurrency(p.costo)}</span></div>
                    <div className="flex justify-between gap-6"><span className="text-muted-foreground">%</span><span className="text-foreground">{p.pct.toFixed(1)}%</span></div>
                    <div className="flex justify-between gap-6"><span className="text-muted-foreground">Movs</span><span className="text-foreground">{p.n}</span></div>
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
          <li key={d.key} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.fill }} />
            <span className="flex-1 truncate font-semibold">{d.key}</span>
            <span className="tabular-nums text-muted-foreground">{d.pct.toFixed(1)}%</span>
            <span className="tabular-nums text-foreground/80 text-[11px] font-mono">{fmtCurrency(d.costo)}</span>
          </li>
        ))}
      </ul>
    </ChartPanel>
  );
}
