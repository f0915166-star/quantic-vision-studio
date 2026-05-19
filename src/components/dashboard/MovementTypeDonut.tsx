import { useMemo } from "react";
import type { Movement } from "@/lib/data-types";
import { fmtCompact, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

export function MovementTypeDonut({ data }: { data: Movement[] }) {
  const { toggleFilter, filters } = useData();
  const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

  const segments = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data) m.set(r.tipo, (m.get(r.tipo) ?? 0) + r.costo);
    const arr = Array.from(m.entries()).map(([tipo, costo]) => ({ tipo, costo }));
    const total = arr.reduce((s, x) => s + x.costo, 0) || 1;
    return arr.sort((a, b) => b.costo - a.costo).map((x, i) => ({ ...x, pct: x.costo / total, color: COLORS[i % COLORS.length] }));
  }, [data]);

  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <ChartPanel title="Tipos de movimiento" subtitle="Click para filtrar por tipo" kicker="Operación">
      <div className="flex items-center gap-6">
        <svg viewBox="-100 -100 200 200" className="w-44 h-44 shrink-0 -rotate-90">
          <circle cx={0} cy={0} r={R} fill="none" stroke="var(--color-surface-2)" strokeWidth={22} />
          {segments.map(s => {
            const len = s.pct * C;
            const dasharray = `${len} ${C - len}`;
            const el = (
              <circle key={s.tipo} cx={0} cy={0} r={R} fill="none"
                stroke={s.color}
                strokeWidth={filters.tipos.has(s.tipo) ? 26 : 22}
                strokeOpacity={filters.tipos.size === 0 || filters.tipos.has(s.tipo) ? 1 : 0.3}
                strokeDasharray={dasharray}
                strokeDashoffset={-offset}
                style={{ transition: "stroke-width 0.2s, stroke-opacity 0.2s, stroke-dashoffset 0.4s", cursor: "pointer" }}
                onClick={() => toggleFilter("tipos", s.tipo)}
              />
            );
            offset += len;
            return el;
          })}
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fill="var(--color-foreground)"
            fontSize={10} fontFamily="monospace" transform="rotate(90)" className="font-semibold">
            {fmtCompact(segments.reduce((s, x) => s + x.costo, 0))}
          </text>
        </svg>
        <ul className="flex-1 space-y-2 text-xs">
          {segments.map(s => (
            <li key={s.tipo}>
              <button
                onClick={() => toggleFilter("tipos", s.tipo)}
                className={`w-full flex items-center gap-2 group hover:text-foreground transition-colors ${filters.tipos.has(s.tipo) ? "text-foreground" : "text-muted-foreground"}`}>
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                <span className="truncate flex-1 text-left">{s.tipo}</span>
                <span className="font-mono tabular-nums">{(s.pct * 100).toFixed(1)}%</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </ChartPanel>
  );
}
