import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ReferenceArea,
  LabelList,
} from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCompact, fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

export function ParetoChart({ data }: { data: Movement[] }) {
  const { toggleFilter, filters } = useData();

  const { series, total, vitalCount, period } = useMemo(() => {
    const m = new Map<string, number>();
    let minF = "", maxF = "";
    for (const r of data) {
      m.set(r.bien, (m.get(r.bien) ?? 0) + r.costo);
      if (r.fecha) {
        if (!minF || r.fecha < minF) minF = r.fecha;
        if (!maxF || r.fecha > maxF) maxF = r.fecha;
      }
    }
    const grandTotal = Array.from(m.values()).reduce((s, v) => s + v, 0);
    const arr = Array.from(m.entries())
      .map(([bien, costo]) => ({ bien, costo }))
      .sort((a, b) => b.costo - a.costo)
      .slice(0, 15);
    let acc = 0;
    const s = arr.map(x => {
      acc += x.costo;
      return {
        ...x,
        pct: grandTotal ? (acc / grandTotal) * 100 : 0,
        share: grandTotal ? (x.costo / grandTotal) * 100 : 0,
        short: x.bien.length > 22 ? x.bien.slice(0, 22) + "…" : x.bien,
      };
    });
    const vc = s.findIndex(x => x.pct >= 80);
    return {
      series: s,
      total: grandTotal,
      vitalCount: vc === -1 ? s.length : vc + 1,
      period: minF && maxF ? `${minF} → ${maxF}` : "",
    };
  }, [data]);

  return (
    <ChartPanel
      title="Análisis Pareto — Top bienes"
      subtitle={`80/20 sobre costo total (PEN)${period ? ` · ${period}` : ""} · ${vitalCount} ítem${vitalCount === 1 ? "" : "s"} concentran ≥80%`}
      kicker="Pareto 80/20"
    >
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={series} margin={{ top: 24, right: 16, left: 8, bottom: 70 }}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" vertical={false} />

          {/* Zona "pocos vitales" (≤80%) */}
          {vitalCount > 0 && (
            <ReferenceArea
              x1={series[0]?.short}
              x2={series[Math.max(0, vitalCount - 1)]?.short}
              yAxisId="r"
              y1={0}
              y2={100}
              fill="var(--color-chart-4)"
              fillOpacity={0.06}
              stroke="var(--color-chart-4)"
              strokeOpacity={0.25}
              strokeDasharray="3 3"
            />
          )}

          <XAxis
            dataKey="short"
            stroke="var(--color-muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
            height={70}
          />
          <YAxis
            yAxisId="l"
            stroke="var(--color-muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `S/ ${fmtCompact(v)}`}
            width={70}
            label={{ value: "Costo (PEN)", angle: -90, position: "insideLeft", offset: 10, fill: "var(--color-muted-foreground)", fontSize: 10 }}
          />
          <YAxis
            yAxisId="r"
            orientation="right"
            stroke="var(--color-muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v}%`}
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            width={40}
            label={{ value: "Acumulado", angle: 90, position: "insideRight", offset: 10, fill: "var(--color-muted-foreground)", fontSize: 10 }}
          />

          <Tooltip
            cursor={{ fill: "oklch(0.78 0.18 165 / 0.08)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { bien: string; costo: number; pct: number; share: number };
              return (
                <div className="panel px-3 py-2 text-xs font-mono max-w-xs">
                  <div className="font-semibold mb-1 break-words text-foreground">{p.bien}</div>
                  <div className="flex justify-between gap-6"><span>Costo</span><span className="text-primary">{fmtCurrency(p.costo)}</span></div>
                  <div className="flex justify-between gap-6"><span>% del total</span><span>{p.share.toFixed(1)}%</span></div>
                  <div className="flex justify-between gap-6"><span>Acumulado</span><span className="text-[color:var(--color-warning,#f59e0b)]">{p.pct.toFixed(1)}%</span></div>
                  <div className="border-t border-border mt-1 pt-1 text-[10px] text-muted-foreground">Total analizado: {fmtCurrency(total)}</div>
                </div>
              );
            }}
          />

          {/* Línea de referencia 80% */}
          <ReferenceLine
            yAxisId="r"
            y={80}
            stroke="var(--color-chart-4)"
            strokeDasharray="6 4"
            strokeWidth={1.6}
            label={{
              value: "Umbral 80%",
              position: "insideTopRight",
              fill: "var(--color-chart-4)",
              fontSize: 10,
              fontWeight: 700,
            }}
          />

          <Bar
            yAxisId="l"
            dataKey="costo"
            radius={[6, 6, 0, 0]}
            cursor="pointer"
            onClick={d => toggleFilter("biens", (d as { bien: string }).bien)}
          >
            {series.map((s, i) => {
              const isVital = i < vitalCount;
              const selected = filters.biens.has(s.bien);
              return (
                <Cell
                  key={s.bien}
                  fill={isVital ? "var(--color-chart-4)" : "var(--color-chart-2)"}
                  fillOpacity={filters.biens.size === 0 || selected ? 1 : 0.25}
                />
              );
            })}
            <LabelList
              dataKey="share"
              position="top"
              fontSize={9}
              fill="var(--color-foreground)"
              formatter={(v: number) => (v >= 3 ? `${v.toFixed(0)}%` : "")}
            />
          </Bar>

          <Line
            yAxisId="r"
            type="monotone"
            dataKey="pct"
            stroke="var(--color-chart-3)"
            strokeWidth={2.2}
            dot={{ r: 3, fill: "var(--color-chart-3)" }}
            activeDot={{ r: 5 }}
          >
            <LabelList
              dataKey="pct"
              position="top"
              fontSize={9}
              fill="var(--color-chart-3)"
              formatter={(v: number) => `${v.toFixed(0)}%`}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[10px] font-mono text-muted-foreground mt-2">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-chart-4)" }} /> Pocos vitales (≤80%)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-chart-2)" }} /> Muchos triviales</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-[2px]" style={{ background: "var(--color-chart-3)" }} /> % acumulado</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 border-t border-dashed" style={{ borderColor: "var(--color-chart-4)" }} /> Umbral 80%</span>
      </div>
    </ChartPanel>
  );
}
