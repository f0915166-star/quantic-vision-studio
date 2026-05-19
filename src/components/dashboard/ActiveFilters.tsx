import { motion, AnimatePresence } from "framer-motion";
import { useData } from "@/lib/data-store";
import { X, RotateCcw } from "lucide-react";

export function ActiveFilters() {
  const { filters, toggleFilter, setDateRange, reset } = useData();
  const items: { dim: "categorias" | "tipos" | "biens" | "responsables"; label: string; value: string }[] = [];
  filters.categorias.forEach(v => items.push({ dim: "categorias", label: "Categoría", value: v }));
  filters.tipos.forEach(v => items.push({ dim: "tipos", label: "Tipo", value: v }));
  filters.biens.forEach(v => items.push({ dim: "biens", label: "Bien", value: v }));
  filters.responsables.forEach(v => items.push({ dim: "responsables", label: "Responsable", value: v }));
  const hasDate = filters.dateFrom || filters.dateTo;
  const any = items.length > 0 || hasDate;
  if (!any) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel px-4 py-3 flex items-center gap-2 flex-wrap"
    >
      <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-medium">Filtros activos</span>
      <div className="h-4 w-px bg-border" />
      <AnimatePresence mode="popLayout">
        {items.map(it => (
          <motion.button
            layout
            key={`${it.dim}-${it.value}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => toggleFilter(it.dim, it.value)}
            className="chip chip-active hover:bg-primary/30 group"
          >
            <span className="opacity-70 text-[10px]">{it.label}:</span>
            <span className="font-medium truncate max-w-[180px]">{it.value || "(sin valor)"}</span>
            <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </motion.button>
        ))}
        {hasDate && (
          <motion.button
            layout
            key="date"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setDateRange(null, null)}
            className="chip chip-active group"
          >
            <span className="opacity-70 text-[10px]">Periodo:</span>
            <span className="font-mono">{filters.dateFrom ?? "···"} → {filters.dateTo ?? "···"}</span>
            <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </motion.button>
        )}
      </AnimatePresence>
      <div className="ml-auto" />
      <button
        onClick={reset}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
      >
        <RotateCcw className="w-3 h-3" /> Limpiar todo
      </button>
    </motion.div>
  );
}
