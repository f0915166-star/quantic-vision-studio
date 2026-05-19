import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "@/lib/data-store";
import { Filter, Calendar, Tags, Users, Boxes, ChevronDown, X } from "lucide-react";

export function FilterSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { all, filters, toggleFilter, setDateRange } = useData();
  const [section, setSection] = useState<"cat" | "tipo" | "resp" | null>("cat");

  const counts = useMemo(() => {
    const c = { cats: new Map<string, number>(), tipos: new Map<string, number>(), resps: new Map<string, number>() };
    for (const r of all) {
      c.cats.set(r.categoria, (c.cats.get(r.categoria) ?? 0) + 1);
      c.tipos.set(r.tipo, (c.tipos.get(r.tipo) ?? 0) + 1);
      c.resps.set(r.responsable, (c.resps.get(r.responsable) ?? 0) + 1);
    }
    return c;
  }, [all]);

  const sortFn = (m: Map<string, number>) => Array.from(m.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 lg:hidden"
          />
          <motion.aside
            initial={{ x: -360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -360, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="fixed left-4 top-20 bottom-4 w-[340px] panel panel-glow z-40 flex flex-col overflow-hidden"
          >
            <header className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Filtros avanzados</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="p-4 border-b border-border space-y-2">
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Periodo
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={filters.dateFrom ?? ""}
                  onChange={e => setDateRange(e.target.value || null, filters.dateTo)}
                  className="bg-secondary/60 border border-border rounded-md text-xs px-2 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none" />
                <input type="date" value={filters.dateTo ?? ""}
                  onChange={e => setDateRange(filters.dateFrom, e.target.value || null)}
                  className="bg-secondary/60 border border-border rounded-md text-xs px-2 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Section icon={<Tags className="w-3 h-3" />} label="Categoría" open={section === "cat"} onToggle={() => setSection(s => s === "cat" ? null : "cat")}
                count={filters.categorias.size}>
                <Chips items={sortFn(counts.cats)} active={filters.categorias} onToggle={v => toggleFilter("categorias", v)} />
              </Section>
              <Section icon={<Boxes className="w-3 h-3" />} label="Tipo de movimiento" open={section === "tipo"} onToggle={() => setSection(s => s === "tipo" ? null : "tipo")}
                count={filters.tipos.size}>
                <Chips items={sortFn(counts.tipos)} active={filters.tipos} onToggle={v => toggleFilter("tipos", v)} />
              </Section>
              <Section icon={<Users className="w-3 h-3" />} label="Responsable" open={section === "resp"} onToggle={() => setSection(s => s === "resp" ? null : "resp")}
                count={filters.responsables.size}>
                <Chips items={sortFn(counts.resps).slice(0, 50)} active={filters.responsables} onToggle={v => toggleFilter("responsables", v)} />
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ icon, label, open, onToggle, count, children }: { icon: React.ReactNode; label: string; open: boolean; onToggle: () => void; count: number; children: React.ReactNode }) {
  return (
    <div className="border-b border-border">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors">
        <div className="flex items-center gap-2 text-xs font-semibold">
          {icon} {label}
          {count > 0 && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-mono">{count}</span>}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="p-3 pt-0 max-h-72 overflow-y-auto">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chips({ items, active, onToggle }: { items: [string, number][]; active: Set<string>; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([v, n]) => (
        <button key={v} onClick={() => onToggle(v)}
          className={`chip ${active.has(v) ? "chip-active" : ""} hover:border-primary/50 max-w-full`}>
          <span className="truncate max-w-[180px]">{v || "(sin valor)"}</span>
          <span className="text-[10px] opacity-60 font-mono">{n}</span>
        </button>
      ))}
    </div>
  );
}
