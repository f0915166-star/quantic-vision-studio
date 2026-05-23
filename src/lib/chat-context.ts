import type { Movement, FilterState } from "./data-types";

const MES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function topN(map: Map<string, number>, n: number) {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export function buildDashboardContext(filtered: Movement[], filters: FilterState): string {
  if (!filtered.length) return "No hay datos disponibles con los filtros actuales.";

  const total = filtered.reduce((s, r) => s + r.costo, 0);
  const n = filtered.length;
  const fechas = filtered.map(r => r.fecha).filter(Boolean).sort();
  const desde = fechas[0] ?? "—";
  const hasta = fechas[fechas.length - 1] ?? "—";

  const eq = new Map<string, number>();
  const ar = new Map<string, number>();
  const bi = new Map<string, number>();
  const re = new Map<string, number>();
  const ca = new Map<string, number>();
  const mes = new Map<string, number>();
  for (const r of filtered) {
    eq.set(r.equipo, (eq.get(r.equipo) ?? 0) + r.costo);
    ar.set(r.area, (ar.get(r.area) ?? 0) + r.costo);
    bi.set(r.bien, (bi.get(r.bien) ?? 0) + r.costo);
    re.set(r.responsable, (re.get(r.responsable) ?? 0) + r.costo);
    ca.set(r.categoria, (ca.get(r.categoria) ?? 0) + r.costo);
    const k = r.fecha?.slice(0, 7);
    if (k) mes.set(k, (mes.get(k) ?? 0) + r.costo);
  }

  const fmt = (n: number) => `S/. ${n.toLocaleString("es-PE", { maximumFractionDigits: 0 })}`;
  const pct = (v: number) => `${((v / total) * 100).toFixed(1)}%`;

  const list = (label: string, m: Map<string, number>, n: number) =>
    `${label}:\n` + topN(m, n).map(([k, v]) => `  - ${k}: ${fmt(v)} (${pct(v)})`).join("\n");

  const meses = Array.from(mes.entries()).sort(([a], [b]) => a.localeCompare(b));
  const tendencia = meses.map(([k, v]) => {
    const [y, mm] = k.split("-");
    return `  - ${MES[Number(mm) - 1]} ${y.slice(2)}: ${fmt(v)}`;
  }).join("\n");

  const activeFilters: string[] = [];
  if (filters.categorias.size) activeFilters.push(`Categorías: ${Array.from(filters.categorias).join(", ")}`);
  if (filters.areas.size) activeFilters.push(`Áreas: ${Array.from(filters.areas).join(", ")}`);
  if (filters.equipos.size) activeFilters.push(`Equipos: ${Array.from(filters.equipos).join(", ")}`);
  if (filters.biens.size) activeFilters.push(`Bienes: ${Array.from(filters.biens).join(", ")}`);
  if (filters.responsables.size) activeFilters.push(`Responsables: ${Array.from(filters.responsables).join(", ")}`);
  if (filters.dateFrom || filters.dateTo) activeFilters.push(`Rango: ${filters.dateFrom ?? "—"} → ${filters.dateTo ?? "—"}`);

  return [
    `RESUMEN GENERAL`,
    `Período: ${desde} → ${hasta}`,
    `Movimientos: ${n}`,
    `Costo total: ${fmt(total)}`,
    `Promedio mensual: ${fmt(meses.length ? total / meses.length : 0)} (${meses.length} meses)`,
    ``,
    `FILTROS ACTIVOS:`,
    activeFilters.length ? activeFilters.map(f => `  - ${f}`).join("\n") : "  - Ninguno (vista global)",
    ``,
    list("TOP EQUIPOS", eq, 10),
    ``,
    list("TOP ÁREAS RESPONSABLES", ar, 10),
    ``,
    list("TOP BIENES", bi, 10),
    ``,
    list("TOP RESPONSABLES", re, 10),
    ``,
    list("CATEGORÍAS", ca, 10),
    ``,
    `TENDENCIA MENSUAL:`,
    tendencia,
  ].join("\n");
}
