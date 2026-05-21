import { useMemo } from "react";
import type { Movement } from "@/lib/data-types";
import { fmtCurrency, fmtCompact, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";
import { motion } from "framer-motion";

export function ResponsableRanking({ data }: { data: Movement[] }) {
  const { filters, toggleFilter } = useData();
  const top = useMemo(() => {
    const m = new Map<string, { responsable: string; costo: number; n: number; bienes: Set<string> }>();
    for (const r of data) {
      const cur = m.get(r.responsable) ?? { responsable: r.responsable, costo: 0, n: 0, bienes: new Set() };
      cur.costo += r.costo; cur.n += 1; cur.bienes.add(r.bien);
      m.set(r.responsable, cur);
    }
    const arr = Array.from(m.values()).sort((a, b) => b.costo - a.costo);
    const max = arr[0]?.costo ?? 1;
    return arr.map(x => ({ ...x, bienesN: x.bienes.size, pct: (x.costo / max) * 100 }));
  }, [data]);

  return (
    <ChartPanel
      title="Top responsables por costo"
      subtitle="Ranking de impacto individual. Click para drill-down"
      kicker="Accountability"
      exportData={() => ({
        filename: "responsables.csv",
        csv: "responsable,costo,movimientos,bienes_unicos\n" + top.map(r => `"${r.responsable}",${r.costo},${r.n},${r.bienesN}`).join("\n"),
      })}
    >
      <div className="space-y-1.5 h-[420px] overflow-y-auto pr-1 -mr-1">
        {top.length === 0 && <div className="text-xs text-muted-foreground py-6 text-center">Sin datos para el filtro actual.</div>}
        {top.map((r, i) => {
          const isActive = filters.responsables.has(r.responsable);
          return (
            <button
              key={r.responsable}
              onClick={() => toggleFilter("responsables", r.responsable)}
              className={`w-full text-left rounded-md px-3 py-2 transition-all relative overflow-hidden border ${isActive ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-secondary/40"}`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${r.pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 opacity-15"
                style={{
                  background: `linear-gradient(90deg, var(--color-chart-${(i % 8) + 1}), transparent)`,
                }}
              />
              <div className="relative flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{r.responsable || "(sin responsable)"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{fmtCompact(r.n)} movs · {r.bienesN} bienes</div>
                </div>
                <div className="text-xs font-mono tabular-nums text-primary font-semibold">{fmtCurrency(r.costo)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </ChartPanel>
  );
}
