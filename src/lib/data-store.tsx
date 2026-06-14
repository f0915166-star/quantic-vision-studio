import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import type { DataPayload, FilterState, Movement } from "./data-types";
import { emptyFilters } from "./data-types";

type Dim = "categorias" | "areas" | "equipos" | "biens" | "responsables" | "tipos";

interface Ctx {
  loading: boolean;
  error: string | null;
  all: Movement[];
  filtered: Movement[];
  filters: FilterState;
  toggleFilter: (dim: Dim, value: string) => void;
  setFilter: (dim: Dim, values: string[]) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  reset: () => void;
  lastUpdated: Date | null;
  filteredExcluding: (dim: Dim) => Movement[];
}

const DataCtx = createContext<Ctx | null>(null);

function hydrate(p: DataPayload): Movement[] {
  return p.rows.map(r => ({
    categoria: p.cats[r[0]],
    area: p.areas[r[1]],
    bien: p.biens[r[2]],
    responsable: p.resps[r[3]],
    equipo: p.equipos[r[4]],
    concepto: p.conceptos[r[5]],
    fecha: r[6],
    cantidad: r[7],
    costo: r[8],
    unidad: p.unidades?.[r[9]] ?? "",
    tipo: p.tipos?.[r[10]] ?? "—",
  }));
}

declare global {
  interface Window { __EMBED_DATA__?: DataPayload }
}

export function DataProvider({ children, initialData }: { children: ReactNode; initialData?: DataPayload }) {
  const embed = initialData ?? (typeof window !== "undefined" ? window.__EMBED_DATA__ : undefined);
  const [loading, setLoading] = useState(!embed);
  const [error, setError] = useState<string | null>(null);
  const [all, setAll] = useState<Movement[]>(() => embed ? hydrate(embed) : []);
  const [filters, setFilters] = useState<FilterState>(emptyFilters());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(embed ? new Date() : null);

  useEffect(() => {
    if (embed) return;
    let alive = true;
    fetch("/data/consolidado.json")
      .then(r => r.json() as Promise<DataPayload>)
      .then(p => {
        if (!alive) return;
        setAll(hydrate(p));
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(e => { if (alive) { setError(String(e)); setLoading(false); } });
    return () => { alive = false; };
  }, [embed]);

  const filtered = useMemo(() => {
    const { categorias, areas, equipos, biens, responsables, tipos, dateFrom, dateTo } = filters;
    return all.filter(m => {
      if (categorias.size && !categorias.has(m.categoria)) return false;
      if (areas.size && !areas.has(m.area)) return false;
      if (equipos.size && !equipos.has(m.equipo)) return false;
      if (biens.size && !biens.has(m.bien)) return false;
      if (responsables.size && !responsables.has(m.responsable)) return false;
      if (tipos.size && !tipos.has(m.tipo)) return false;
      if (dateFrom && m.fecha < dateFrom) return false;
      if (dateTo && m.fecha > dateTo) return false;
      return true;
    });
  }, [all, filters]);

  const toggleFilter = useCallback((dim: Dim, value: string) => {
    setFilters(prev => {
      const next = new Set(prev[dim] as Set<string>);
      if (next.has(value)) next.delete(value); else next.add(value);
      return { ...prev, [dim]: next };
    });
  }, []);

  const setFilter = useCallback((dim: Dim, values: string[]) => {
    setFilters(prev => ({ ...prev, [dim]: new Set(values) }));
  }, []);

  const setDateRange = useCallback((from: string | null, to: string | null) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }));
  }, []);

  const reset = useCallback(() => setFilters(emptyFilters()), []);

  return (
    <DataCtx.Provider value={{ loading, error, all, filtered, filters, toggleFilter, setFilter, setDateRange, reset, lastUpdated }}>
      {children}
    </DataCtx.Provider>
  );
}

export const useData = () => {
  const c = useContext(DataCtx);
  if (!c) throw new Error("useData must be inside DataProvider");
  return c;
};

export const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(n);
export const fmtNumber = (n: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 }).format(n);
export const fmtCompact = (n: number) =>
  new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 }).format(n);
