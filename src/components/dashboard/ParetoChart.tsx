import { useMemo } from "react";
import type { Movement } from "@/lib/data-types";
import { fmtCurrency, fmtCompact, useData } from "@/lib/data-store";
import { ChartPanel } from "./ChartPanel";
import { motion } from "framer-motion";

export function ParetoChart({ data }: { data: Movement[] }) {
  const { filters, toggleFilter } = useData();

  const top = useMemo(() => {
    const m = new Map<string, { bien: string; costo: number; n: number; cantidad: number; unidad: string }>();
    for (const r of data) {
      const cur = m.get(r.bien) ?? { bien: r.bien, costo: 0, n: 0, cantidad: 0, unidad: r.unidad ?? "" };
      cur.costo += r.costo;
      cur.n += 1;
      cur.cantidad += r.cantidad ?? 0;
      if (!cur.unidad && r.unidad) cur.unidad = r.unidad;
      m.set(r.bien, cur);
    }
    const arr = Array.from(m.values()).sort((a, b) => b.costo - a.costo);
    const max = arr[0]?.costo ?? 1;
    return arr.map(x => ({ ...x, pct: (x.costo / max) * 100 }));
  }, [data]);

  return (
    <ChartPanel
      title="Bienes con mayor costo"
      
      kicker="Bienes"
      exportData={() => ({
        filename: "top-bienes.csv",
        csv:
          "bien,costo,movimientos,cantidad,unidad\n" +
          top.map(r => `"${r.bien.replace(/"/g, '""')}",${r.costo},${r.n},${r.cantidad},"${(r.unidad ?? "").replace(/"/g, '""')}"`).join("\n"),
      })}
    >
      <div className="space-y-1.5 h-[420px] overflow-y-auto pr-1 -mr-1">
        {top.length === 0 && (
          <div className="text-xs text-muted-foreground py-6 text-center">Sin datos para el filtro actual.</div>
        )}
        {top.map((r, i) => {
          const isActive = filters.biens.has(r.bien);
          return (
            <button
              key={r.bien}
              onClick={() => toggleFilter("biens", r.bien)}
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
                  <div className="text-xs font-medium truncate">{r.bien || "(sin bien)"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {fmtCompact(r.n)} movs · {fmtCompact(r.cantidad)}{r.unidad ? ` ${r.unidad}` : ""}
                  </div>
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
