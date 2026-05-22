import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCompact, fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";
import { Truck } from "lucide-react";

// Top equipos móviles por COSTO_TOTAL (combustible + repuestos)
export function EquipoChart({ data }: { data: Movement[] }) {
  const { filters, toggleFilter } = useData();
  const active = filters.equipos;

  const agg = useMemo(() => {
    const m = new Map<string, { equipo: string; costo: number; combustible: number; repuestos: number; n: number }>();
    for (const r of data) {
      const cur = m.get(r.equipo) ?? { equipo: r.equipo, costo: 0, combustible: 0, repuestos: 0, n: 0 };
      cur.costo += r.costo; cur.n += 1;
      if (r.categoria === "COMBUSTIBLE") cur.combustible += r.costo;
      else cur.repuestos += r.costo;
      m.set(r.equipo, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.costo - a.costo)
      .map(x => ({ ...x, short: x.equipo.length > 44 ? x.equipo.slice(0, 44) + "…" : x.equipo }));
  }, [data]);

  const CustomTick = ({ x, y, payload, index }: { x?: number; y?: number; payload?: { value: string }; index?: number }) => {
    const label = payload?.value ?? "";
    const isTop = (index ?? 99) < 3;
    const equipo = agg[index ?? 0]?.equipo ?? label;
    const isActive = active.size === 0 || active.has(equipo);
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-14}
          y={0}
          dy={4}
          textAnchor="end"
          fill={isActive ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
          fontSize={isTop ? 10.8 : 9.9}
          fontWeight={isTop ? 700 : 600}
          style={{ letterSpacing: isTop ? "0.02em" : "0.01em" }}
        >
          {label}
        </text>
      </g>
    );
  };


  return (
    <ChartPanel
      title="Costo total por Equipo Móvil"
      kicker={<span className="inline-flex items-center gap-1"><Truck className="w-3 h-3" /> Flota</span>}
      exportData={() => ({
        filename: "equipos.csv",
        csv: "equipo,combustible,repuestos,costo_total,movimientos\n" +
          agg.map(r => `"${r.equipo}",${r.combustible.toFixed(2)},${r.repuestos.toFixed(2)},${r.costo.toFixed(2)},${r.n}`).join("\n"),
      })}
    >
      <div className="w-full">
        <ResponsiveContainer width="100%" height={Math.max(420, agg.length * 22)}>
          <BarChart data={agg} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }} barCategoryGap={3}>
            <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" horizontal={false} />
            <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
            <YAxis dataKey="short" type="category" stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} width={320} interval={0} tick={<CustomTick />} />
            <Tooltip
              cursor={{ fill: "oklch(0.78 0.18 165 / 0.08)" }}
              content={({ active: a, payload }) => {
                if (!a || !payload?.length) return null;
                const p = payload[0].payload as { equipo: string; combustible: number; repuestos: number; costo: number; n: number };
                const pctC = p.costo ? (p.combustible / p.costo) * 100 : 0;
                return (
                  <div className="panel px-3 py-2 text-xs font-mono max-w-xs">
                    <div className="font-semibold mb-1 break-words text-foreground">{p.equipo}</div>
                    <div className="flex justify-between gap-6"><span style={{color:"var(--color-chart-1)"}}>● Combustible</span><span>{fmtCurrency(p.combustible)}</span></div>
                    <div className="flex justify-between gap-6"><span style={{color:"var(--color-chart-3)"}}>● Repuestos</span><span>{fmtCurrency(p.repuestos)}</span></div>
                    <div className="border-t border-border mt-1 pt-1 flex justify-between gap-6"><span>Total</span><span className="text-primary">{fmtCurrency(p.costo)}</span></div>
                    <div className="flex justify-between gap-6 text-muted-foreground"><span>% Combust.</span><span>{pctC.toFixed(1)}%</span></div>
                    <div className="flex justify-between gap-6 text-muted-foreground"><span>Movs</span><span>{p.n}</span></div>
                  </div>
                );
              }}
            />
            <Bar dataKey="combustible" stackId="a" fill="var(--color-chart-1)" cursor="pointer"
              onClick={(d) => toggleFilter("equipos", (d as { equipo: string }).equipo)}>
              {agg.map(d => (
                <Cell key={`c-${d.equipo}`} fillOpacity={active.size === 0 || active.has(d.equipo) ? 1 : 0.25} />
              ))}
            </Bar>
            <Bar dataKey="repuestos" stackId="a" radius={[0, 6, 6, 0]} fill="var(--color-chart-3)" cursor="pointer"
              onClick={(d) => toggleFilter("equipos", (d as { equipo: string }).equipo)}>
              {agg.map((d) => (
                <Cell key={`r-${d.equipo}`}
                  fillOpacity={active.size === 0 || active.has(d.equipo) ? 1 : 0.25}
                  stroke="transparent"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-muted-foreground mt-2">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{background:"var(--color-chart-1)"}}/> Combustible</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{background:"var(--color-chart-3)"}}/> Repuestos</span>
      </div>
    </ChartPanel>
  );
}
