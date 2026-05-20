import { useMemo } from "react";
import type { Movement } from "@/lib/data-types";
import { fmtCurrency, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";

// Heatmap: mes (col) x CATEGORIA (row), valor = COSTO_TOTAL
export function HeatmapChart({ data }: { data: Movement[] }) {
  const { toggleFilter, filters, setDateRange } = useData();
  const { months, rows, matrix, max } = useMemo(() => {
    const monthsSet = new Set<string>();
    const rowsSet = new Set<string>();
    const m = new Map<string, number>();
    for (const r of data) {
      const mes = r.fecha?.slice(0, 7);
      if (!mes) continue;
      monthsSet.add(mes); rowsSet.add(r.categoria);
      const k = `${r.categoria}|${mes}`;
      m.set(k, (m.get(k) ?? 0) + r.costo);
    }
    const months = Array.from(monthsSet).sort();
    // ordenar categorías por costo total descendente
    const totals = new Map<string, number>();
    Array.from(rowsSet).forEach(c => {
      let t = 0;
      months.forEach(mo => { t += m.get(`${c}|${mo}`) ?? 0; });
      totals.set(c, t);
    });
    const rows = Array.from(rowsSet).sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
    let max = 0;
    const matrix = rows.map(c => months.map(mo => {
      const v = m.get(`${c}|${mo}`) ?? 0; if (v > max) max = v; return v;
    }));
    return { months, rows, matrix, max };
  }, [data]);

  const colorFor = (v: number) => {
    if (!v) return "oklch(0.22 0.018 250)";
    const t = Math.pow(v / max, 0.5);
    return `oklch(${0.3 + t * 0.45} ${0.05 + t * 0.18} ${165 - t * 30})`;
  };

  const MES_ABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const labelFor = (k: string) => {
    const [y, mo] = k.split("-").map(Number);
    return y && mo ? `${MES_ABBR[mo - 1]} ${String(y).slice(2)}` : k;
  };

  return (
    <ChartPanel title="Mapa de calor — Categoría × Mes" subtitle="Intensidad del COSTO_TOTAL por mes. Click en una categoría o mes para filtrar" kicker="Heatmap temporal">
      <div className="overflow-auto -mx-2 px-2">
        <div className="inline-block min-w-full">
          {/* Header de meses con rotación contenida */}
          <div className="grid" style={{ gridTemplateColumns: `220px repeat(${months.length}, minmax(38px, 1fr))` }}>
            <div className="h-16" />
            {months.map(mo => (
              <div key={mo} className="h-16 flex items-end justify-center pb-1">
                <button
                  onClick={() => {
                    const [y, m] = mo.split("-").map(Number);
                    const last = new Date(y, m, 0).getDate();
                    setDateRange(`${mo}-01`, `${mo}-${String(last).padStart(2, "0")}`);
                  }}
                  className="text-[10px] text-muted-foreground font-mono font-semibold whitespace-nowrap hover:text-primary transition-colors origin-bottom-left"
                  style={{ transform: "rotate(-55deg) translateX(4px)" }}>
                  {labelFor(mo)}
                </button>
              </div>
            ))}
            {rows.map((c, i) => (
              <div key={c} className="contents">
                <button onClick={() => toggleFilter("categorias", c)}
                  className={`text-[10px] font-medium pr-2 py-1 text-right truncate hover:text-primary transition-colors ${filters.categorias.has(c) ? "text-primary" : ""}`}>
                  {c}
                </button>
                {months.map((mo, j) => {
                  const v = matrix[i][j];
                  return (
                    <button key={mo} title={`${c} · ${labelFor(mo)}\n${fmtCurrency(v)}`}
                      onClick={() => toggleFilter("categorias", c)}
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
