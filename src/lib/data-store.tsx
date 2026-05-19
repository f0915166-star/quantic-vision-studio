import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import type { DataPayload, FilterState, Movement } from "./data-types";
import { emptyFilters } from "./data-types";

interface Ctx {
  loading: boolean;
  error: string | null;
  all: Movement[];
  filtered: Movement[];
  filters: FilterState;
  toggleFilter: (dim: keyof Omit<FilterState, "dateFrom" | "dateTo">, value: string) => void;
  setFilter: (dim: keyof Omit<FilterState, "dateFrom" | "dateTo">, values: string[]) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  reset: () => void;
  lastUpdated: Date | null;
}

const DataCtx = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [all, setAll] = useState<Movement[]>([]);
  const [filters, setFilters] = useState<FilterState>(emptyFilters());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/data/consolidado.json")
      .then(r => r.json() as Promise<DataPayload>)
      .then(p => {
        if (!alive) return;
        const movements: Movement[] = p.rows.map(r => ({
          categoria: p.cats[r[0]],
          tipo: p.tipos[r[1]],
          bien: p.biens[r[2]],
          responsable: p.resps[r[3]],
          fecha: r[4],
          cantidad: r[5],
          costo: r[6],
        }));
        setAll(movements);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(e => { if (alive) { setError(String(e)); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const { categorias, tipos, biens, responsables, dateFrom, dateTo } = filters;
    return all.filter(m => {
      if (categorias.size && !categorias.has(m.categoria)) return false;
      if (tipos.size && !tipos.has(m.tipo)) return false;
      if (biens.size && !biens.has(m.bien)) return false;
      if (responsables.size && !responsables.has(m.responsable)) return false;
      if (dateFrom && m.fecha < dateFrom) return false;
      if (dateTo && m.fecha > dateTo) return false;
      return true;
    });
  }, [all, filters]);

  const toggleFilter = useCallback((dim: keyof Omit<FilterState, "dateFrom" | "dateTo">, value: string) => {
    setFilters(prev => {
      const next = new Set(prev[dim] as Set<string>);
      if (next.has(value)) next.delete(value); else next.add(value);
      return { ...prev, [dim]: next };
    });
  }, []);

  const setFilter = useCallback((dim: keyof Omit<FilterState, "dateFrom" | "dateTo">, values: string[]) => {
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
