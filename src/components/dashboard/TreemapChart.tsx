import { useMemo } from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-chart-6)", "var(--color-chart-7)", "var(--color-chart-8)"];

export function TreemapChart({ data }: { data: Movement[] }) {
  const { toggleFilter } = useData();
  const tree = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data) m.set(r.categoria, (m.get(r.categoria) ?? 0) + r.costo);
    return Array.from(m.entries()).map(([name, size], i) => ({ name, size, fill: COLORS[i % COLORS.length] }));
  }, [data]);

  return (
    <ChartPanel title="Treemap proporcional" subtitle="Tamaño = costo total. Click para filtrar" kicker="Composición">
      <ResponsiveContainer width="100%" height={320}>
        <Treemap data={tree} dataKey="size" stroke="var(--color-background)" strokeWidth={2}
          content={(props: unknown) => {
            const { x, y, width, height, name, fill, size } = props as { x: number; y: number; width: number; height: number; name: string; fill: string; size: number };
            return (
              <g style={{ cursor: "pointer" }} onClick={() => toggleFilter("categorias", name)}>
                <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.85} stroke="var(--color-background)" strokeWidth={2} rx={4} />
                {width > 70 && height > 30 && (
                  <>
                    <text x={x + 8} y={y + 18} fontSize={11} fontWeight={600} fill="oklch(0.15 0.02 250)">{name}</text>
                    <text x={x + 8} y={y + 32} fontSize={10} fontFamily="monospace" fill="oklch(0.15 0.02 250 / 0.7)">{fmtCurrency(size)}</text>
                  </>
                )}
              </g>
            );
          }}>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { name: string; size: number };
              return (
                <div className="panel px-3 py-2 text-xs font-mono">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-primary">{fmtCurrency(p.size)}</div>
                </div>
              );
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
