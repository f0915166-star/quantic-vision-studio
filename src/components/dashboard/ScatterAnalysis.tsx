import { useMemo } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCompact, fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

// Scatter: por bien -> total cantidad vs costo total, tamaño = #movimientos
export function ScatterAnalysis({ data }: { data: Movement[] }) {
  const { toggleFilter } = useData();
  const points = useMemo(() => {
    const m = new Map<string, { bien: string; categoria: string; cant: number; costo: number; n: number }>();
    for (const r of data) {
      const cur = m.get(r.bien) ?? { bien: r.bien, categoria: r.categoria, cant: 0, costo: 0, n: 0 };
      cur.cant += r.cantidad; cur.costo += r.costo; cur.n += 1;
      m.set(r.bien, cur);
    }
    return Array.from(m.values()).filter(x => x.costo > 0 && x.cant > 0);
  }, [data]);

  return (
    <ChartPanel title="Dispersión cantidad × costo" subtitle="Cada punto = un bien. Tamaño = nº movimientos" kicker="Scatter analytics">
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
          <XAxis type="number" dataKey="cant" name="Cantidad" stroke="var(--color-muted-foreground)" fontSize={10}
            tickFormatter={fmtCompact} scale="log" domain={["auto", "auto"]} tickLine={false} axisLine={false} />
          <YAxis type="number" dataKey="costo" name="Costo" stroke="var(--color-muted-foreground)" fontSize={10}
            tickFormatter={fmtCompact} scale="log" domain={["auto", "auto"]} tickLine={false} axisLine={false} width={55} />
          <ZAxis type="number" dataKey="n" range={[20, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { bien: string; categoria: string; cant: number; costo: number; n: number };
              return (
                <div className="panel px-3 py-2 text-xs font-mono max-w-xs">
                  <div className="font-semibold mb-1 break-words">{p.bien}</div>
                  <div className="text-[10px] text-muted-foreground mb-1">{p.categoria}</div>
                  <div className="flex justify-between gap-6"><span>Cantidad</span><span>{fmtCompact(p.cant)}</span></div>
                  <div className="flex justify-between gap-6"><span>Costo</span><span className="text-primary">{fmtCurrency(p.costo)}</span></div>
                  <div className="flex justify-between gap-6 text-muted-foreground"><span>Movs</span><span>{p.n}</span></div>
                </div>
              );
            }}
          />
          <Scatter data={points} fill="var(--color-chart-2)" fillOpacity={0.55} stroke="var(--color-chart-2)"
            onClick={(d) => toggleFilter("biens", (d as { bien: string }).bien)} cursor="pointer" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
