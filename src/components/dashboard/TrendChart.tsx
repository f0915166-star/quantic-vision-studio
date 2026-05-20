import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCompact, fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

function monthKey(d: string) { return d.slice(0, 7); }
const MES_ABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
function fmtMonthLabel(k: string) {
  const [y, m] = k.split("-").map(Number);
  if (!y || !m) return k;
  return `${MES_ABBR[m - 1]} ${String(y).slice(2)}`;
}

export function TrendChart({ data }: { data: Movement[] }) {
  const { setDateRange, filters } = useData();
  const series = useMemo(() => {
    const map = new Map<string, { mes: string; costo: number; cantidad: number; n: number }>();
    for (const m of data) {
      const k = monthKey(m.fecha);
      if (!k) continue;
      const cur = map.get(k) ?? { mes: k, costo: 0, cantidad: 0, n: 0 };
      cur.costo += m.costo; cur.cantidad += m.cantidad; cur.n += 1;
      map.set(k, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [data]);

  const avg = series.length ? series.reduce((s, x) => s + x.costo, 0) / series.length : 0;

  return (
    <ChartPanel
      title="Tendencia mensual de costo"
      subtitle="Click en un mes para filtrar el periodo"
      kicker="Time series"
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 28 }}
          onClick={(e) => {
            const m = (e as { activeLabel?: string })?.activeLabel;
            if (!m) return;
            const from = `${m}-01`;
            const [y, mo] = m.split("-").map(Number);
            const lastDay = new Date(y, mo, 0).getDate();
            const to = `${m}-${String(lastDay).padStart(2, "0")}`;
            if (filters.dateFrom === from && filters.dateTo === to) setDateRange(null, null);
            else setDateRange(from, to);
          }}>
          <defs>
            <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false}
            interval={0} angle={-45} textAnchor="end" height={50} tickMargin={8} tickFormatter={fmtMonthLabel} />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtCompact} width={50} />
          <ReferenceLine y={avg} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.5}
            label={{ value: `Promedio ${fmtCompact(avg)}`, fill: "var(--color-muted-foreground)", fontSize: 10, position: "insideTopRight" }} />
          <Tooltip
            cursor={{ stroke: "var(--color-primary)", strokeWidth: 1, strokeDasharray: "3 3" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { costo: number; cantidad: number; n: number };
              return (
                <div className="panel px-3 py-2 text-xs font-mono">
                  <div className="text-muted-foreground uppercase tracking-wider text-[10px] mb-1">{fmtMonthLabel(String(label))}</div>
                  <div className="flex items-center justify-between gap-6">
                    <span>Costo</span><span className="text-primary font-semibold">{fmtCurrency(p.costo)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span>Cantidad</span><span>{fmtCompact(p.cantidad)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6 text-muted-foreground">
                    <span>Movimientos</span><span>{p.n}</span>
                  </div>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="costo" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#gCost)" activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-background)" }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
