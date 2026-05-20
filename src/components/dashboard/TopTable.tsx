import { useMemo, useState } from "react";
import { ChartPanel } from "./ChartPanel";
import { fmtCurrency, fmtCompact, useData } from "@/lib/data-store";
import type { Movement } from "@/lib/data-types";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

type SortKey = "bien" | "concepto" | "cant" | "unidad" | "fecha" | "costo";

export function TopTable({ data }: { data: Movement[] }) {
  const { toggleFilter, filters } = useData();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("costo");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const PAGE = 10;

  const agg = useMemo(() => {
    const m = new Map<string, { bien: string; concepto: string; cant: number; costo: number; n: number; fecha: string; conceptos: Map<string, number>; unidades: Map<string, number> }>();
    for (const r of data) {
      const cur = m.get(r.bien) ?? { bien: r.bien, concepto: "", cant: 0, costo: 0, n: 0, fecha: "", conceptos: new Map<string, number>(), unidades: new Map<string, number>() };
      cur.cant += r.cantidad; cur.costo += r.costo; cur.n += 1;
      if (r.fecha && r.fecha > cur.fecha) cur.fecha = r.fecha;
      if (r.concepto) cur.conceptos.set(r.concepto, (cur.conceptos.get(r.concepto) ?? 0) + 1);
      if (r.unidad) cur.unidades.set(r.unidad, (cur.unidades.get(r.unidad) ?? 0) + 1);
      m.set(r.bien, cur);
    }
    return Array.from(m.values()).map(x => {
      let top = ""; let best = 0;
      x.conceptos.forEach((v, k) => { if (v > best) { best = v; top = k; } });
      let uTop = ""; let uBest = 0;
      x.unidades.forEach((v, k) => { if (v > uBest) { uBest = v; uTop = k; } });
      return { bien: x.bien, concepto: top, cant: x.cant, unidad: uTop, fecha: x.fecha, costo: x.costo, n: x.n };
    });
  }, [data]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? agg.filter(r => r.bien.toLowerCase().includes(s) || r.concepto.toLowerCase().includes(s)) : agg;
  }, [agg, q]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey] as number | string; const bv = b[sortKey] as number | string;
      if (typeof av === "number" && typeof bv === "number") return dir === "asc" ? av - bv : bv - av;
      return dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [filtered, sortKey, dir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE));
  const pageData = sorted.slice(page * PAGE, page * PAGE + PAGE);

  const setSort = (k: SortKey) => {
    if (k === sortKey) setDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setDir("desc"); }
    setPage(0);
  };

  return (
    <ChartPanel
      title="Ranking de bienes"
      subtitle={`${fmtCompact(sorted.length)} bienes únicos · click en una fila para filtrar`}
      kicker="Detalle operativo"
      exportData={() => ({
        filename: "ranking_bienes.csv",
        csv: "bien,concepto,cantidad,unidad,ultima_fecha,costo_total\n" + sorted.map(r => `"${r.bien.replace(/"/g, '""')}","${r.concepto.replace(/"/g, '""')}",${r.cant},${r.unidad},${r.fecha},${r.costo}`).join("\n"),
      })}
      actions={
        <div className="relative mr-1">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="Buscar bien…"
            className="bg-secondary/60 border border-border rounded-md text-xs pl-7 pr-2 py-1 w-44 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border">
              {([["bien", "Bien"], ["concepto", "Concepto"], ["cant", "Cantidad"], ["unidad", "Unidad"], ["costo", "Costo total"]] as [SortKey, string][]).map(([k, l]) => (
                <th key={k} className="py-2 px-2 font-medium">
                  <button onClick={() => setSort(k)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    {l} <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-primary" : "opacity-40"}`} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map(r => {
              const active = filters.biens.has(r.bien);
              return (
                <tr key={r.bien}
                  onClick={() => toggleFilter("biens", r.bien)}
                  className={`border-b border-border/40 cursor-pointer transition-colors hover:bg-primary/5 ${active ? "bg-primary/10" : ""}`}>
                  <td className="py-2 px-2 w-[420px] max-w-[460px] truncate font-medium" title={r.bien}>{r.bien}</td>
                  <td className="py-2 px-2 text-muted-foreground max-w-[280px] truncate" title={r.concepto}>{r.concepto}</td>
                  <td className="py-2 px-2 font-mono tabular-nums">{fmtCompact(r.cant)}</td>
                  <td className="py-2 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.unidad}</td>
                  <td className="py-2 px-2 font-mono tabular-nums text-primary">{fmtCurrency(r.costo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
        <span>{page * PAGE + 1}–{Math.min(sorted.length, (page + 1) * PAGE)} de {sorted.length}</span>
        <div className="flex items-center gap-1">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <span className="font-mono px-2">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </ChartPanel>
  );
}
