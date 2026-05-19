import { useMemo } from "react";
import type { Movement } from "@/lib/data-types";
import { fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

// Heatmap: mes (col) x categoria (row), valor = costo
export function HeatmapChart({ data }: { data: Movement[] }) {
  const { toggleFilter, filters, setDateRange } = useData();
  const { months, cats, matrix, max } = useMemo(() => {
    const monthsSet = new Set<string>();
    const catsSet = new Set<string>();
    const m = new Map<string, number>(); // `${cat}|${mes}` -> costo
    for (const r of data) {
      const mes = r.fecha?.slice(0, 7);
      if (!mes) continue;
      monthsSet.add(mes); catsSet.add(r.categoria);
      const k = `${r.categoria}|${mes}`;
      m.set(k, (m.get(k) ?? 0) + r.costo);
    }
    const months = Array.from(monthsSet).sort();
    const cats = Array.from(catsSet).sort();
    let max = 0;
    const matrix = cats.map(c => months.map(mo => {
      const v = m.get(`${c}|${mo}`) ?? 0; if (v > max) max = v; return v;
    }));
    return { months, cats, matrix, max };
  }, [data]);

  const colorFor = (v: number) => {
    if (!v) return "oklch(0.22 0.018 250)";
    const t = Math.pow(v / max, 0.5);
    return `oklch(${0.3 + t * 0.45} ${0.05 + t * 0.18} ${165 - t * 30})`;
  };

  return (
    <ChartPanel title="Mapa de calor — Categoría × Mes" subtitle="Intensidad del costo. Click para filtrar" kicker="Heatmap">
      <div className="overflow-auto -mx-2 px-2">
        <div className="inline-block min-w-full">
          <div className="grid" style={{ gridTemplateColumns: `160px repeat(${months.length}, minmax(38px, 1fr))` }}>
            <div />
            {months.map(mo => (
              <button key={mo}
                onClick={() => {
                  const [y, m] = mo.split("-").map(Number);
                  const last = new Date(y, m, 0).getDate();
                  setDateRange(`${mo}-01`, `${mo}-${String(last).padStart(2, "0")}`);
                }}
                className="text-[9px] text-muted-foreground font-mono text-center py-1 hover:text-foreground transition-colors -rotate-90 origin-center"
                style={{ writingMode: "horizontal-tb" }}>
                {mo}
              </button>
            ))}
            {cats.map((c, i) => (
              <div key={c} className="contents">
                <button onClick={() => toggleFilter("categorias", c)}
                  className={`text-[10px] font-medium pr-2 py-1 text-right truncate hover:text-primary transition-colors ${filters.categorias.has(c) ? "text-primary" : ""}`}>
                  {c}
                </button>
                {months.map((mo, j) => {
                  const v = matrix[i][j];
                  return (
                    <button key={mo} title={`${c} · ${mo}\n${fmtCurrency(v)}`}
                      onClick={() => {
                        toggleFilter("categorias", c);
                      }}
                      className="aspect-square m-px rounded-[3px] transition-transform hover:scale-110 hover:ring-1 hover:ring-primary relative group"
                      style={{ background: colorFor(v) }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground font-mono">
        <span>0</span>
        <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(90deg, oklch(0.22 0.018 250), oklch(0.55 0.15 145), oklch(0.78 0.18 165))" }} />
        <span>{fmtCurrency(max)}</span>
      </div>
    </ChartPanel>
  );
}
