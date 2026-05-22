import { useMemo } from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import type { Movement } from "@/lib/data-types";
import { fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

// Paleta extendida: 8 hues base × variaciones de luminosidad/croma para evitar
// colores repetidos. Ordenada para alternar familias y maximizar contraste vecinal.
const COLORS = [
  "hsl(8 68% 52%)",    // terracotta
  "hsl(195 45% 38%)",  // deep teal
  "hsl(38 78% 56%)",   // warm amber
  "hsl(220 28% 32%)",  // slate indigo
  "hsl(160 35% 42%)",  // sage
  "hsl(280 22% 52%)",  // dusty plum
  "hsl(25 55% 58%)",   // clay
  "hsl(210 30% 50%)",  // steel blue
  "hsl(15 60% 42%)",   // burnt sienna
  "hsl(185 38% 48%)",  // muted cyan
  "hsl(45 70% 48%)",   // mustard
  "hsl(235 22% 45%)",  // indigo mid
  "hsl(150 30% 55%)",  // soft mint
  "hsl(300 18% 42%)",  // deep mauve
  "hsl(30 45% 48%)",   // bronze
  "hsl(200 35% 60%)",  // sky steel
  "hsl(0 50% 60%)",    // rose clay
  "hsl(175 32% 32%)",  // dark teal
  "hsl(50 60% 65%)",   // soft gold
  "hsl(250 25% 55%)",  // periwinkle
  "hsl(140 28% 38%)",  // forest
  "hsl(265 28% 62%)",  // lavender
  "hsl(18 48% 65%)",   // peach
  "hsl(205 40% 28%)",  // navy depth
  "hsl(168 28% 50%)",  // jade
  "hsl(35 35% 38%)",   // umber
  "hsl(290 30% 70%)",  // pale orchid
  "hsl(190 50% 28%)",  // petrol
];

// Compresión visual: raíz cuadrada reduce el dominio del cuadro más grande
// y da más espacio a las categorías menores sin alterar el dato real.
const COMPRESSION = 0.62;

export function TreemapChart({ data }: { data: Movement[] }) {
  const { toggleFilter } = useData();
  const tree = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data) m.set(r.categoria, (m.get(r.categoria) ?? 0) + r.costo);
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, size], i) => ({
        name,
        size,
        weight: Math.pow(size, COMPRESSION), // tamaño visual comprimido
        fill: COLORS[i % COLORS.length],
      }));
  }, [data]);

  return (
    <ChartPanel title="Costos por categoría" kicker="Composición">
      <ResponsiveContainer width="100%" height={340}>
        <Treemap
          data={tree}
          dataKey="weight"
          stroke="var(--color-background)"
          animationDuration={400}
          content={((props: unknown) => {
            const { x, y, width, height, name, fill, size } = props as {
              x: number; y: number; width: number; height: number; name?: string; fill?: string; size?: number;
            };
            if (!name || width <= 0 || height <= 0) return <g />;
            // Tamaños tipográficos adaptativos según área del rectángulo
            const minDim = Math.min(width, height);
            const nameFont = Math.max(10, Math.min(16, Math.round(minDim / 10)));
            const costFont = Math.max(9, Math.min(12, Math.round(minDim / 14)));
            const showName = width > 44 && height > 22;
            const showCost = width > 70 && height > 44;
            const padX = 8;
            const padY = nameFont + 6;
            // Truncado simple para nombres largos en cajas chicas
            const maxChars = Math.max(4, Math.floor((width - padX * 2) / (nameFont * 0.6)));
            const display = name.length > maxChars ? name.slice(0, maxChars - 1) + "…" : name;
            return (
              <g style={{ cursor: "pointer" }} onClick={() => toggleFilter("categorias", name)}>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={fill}
                  fillOpacity={0.92}
                  stroke="var(--color-background)"
                  strokeWidth={2}
                  rx={6}
                />
                {showName && (
                  <text
                    x={x + padX}
                    y={y + padY}
                    fontSize={nameFont}
                    fontWeight={800}
                    fill="#ffffff"
                    stroke="rgba(0,0,0,0.55)"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    style={{ letterSpacing: "0.02em", textTransform: "uppercase" }}
                  >
                    {display}
                  </text>
                )}
                {showCost && (
                  <text
                    x={x + padX}
                    y={y + padY + costFont + 4}
                    fontSize={costFont}
                    fontFamily="monospace"
                    fontWeight={700}
                    fill="#ffffff"
                    stroke="rgba(0,0,0,0.55)"
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    fillOpacity={0.95}
                  >
                    {fmtCurrency(size ?? 0)}
                  </text>
                )}
              </g>
            );

          }) as never}
        >
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
