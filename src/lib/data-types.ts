export type RawRow = [number, number, number, number, string, number, number];
// [catIdx, tipoIdx, bienIdx, respIdx, fecha, cantidad, costo]

export interface DataPayload {
  cats: string[];
  tipos: string[];
  biens: string[];
  resps: string[];
  rows: RawRow[];
}

// Esquema de negocio expuesto en UI:
// BIEN · CATEGORIA · FECHA_MOVIMIENTO · COSTO_TOTAL · CONCEPTO · AREA_RESPONSABLE · RESPONSABLE
export interface Movement {
  categoria: string;       // CATEGORIA
  concepto: string;        // CONCEPTO  (ej: "SALIDA A PRODUCCIÓN")
  area: string;            // AREA_RESPONSABLE (derivado del concepto)
  bien: string;            // BIEN
  responsable: string;     // RESPONSABLE
  fecha: string;           // FECHA_MOVIMIENTO (ISO yyyy-mm-dd)
  cantidad: number;
  costo: number;           // COSTO_TOTAL
}

export interface FilterState {
  categorias: Set<string>;
  conceptos: Set<string>;
  areas: Set<string>;
  biens: Set<string>;
  responsables: Set<string>;
  dateFrom: string | null;
  dateTo: string | null;
}

export const emptyFilters = (): FilterState => ({
  categorias: new Set(),
  conceptos: new Set(),
  areas: new Set(),
  biens: new Set(),
  responsables: new Set(),
  dateFrom: null,
  dateTo: null,
});

export const hasAnyFilter = (f: FilterState) =>
  f.categorias.size + f.conceptos.size + f.areas.size + f.biens.size + f.responsables.size > 0 ||
  !!f.dateFrom ||
  !!f.dateTo;

// Deriva el área responsable a partir del concepto de movimiento.
export function deriveArea(concepto: string): string {
  const c = (concepto || "").toUpperCase();
  if (c.includes("PRODUCCI")) return "PRODUCCIÓN";
  if (c.includes("VENTA") || c.includes("ADMINISTRA")) return "VENTAS Y ADMINISTRACIÓN";
  if (c.includes("ACTIVO")) return "ACTIVO FIJO";
  if (c.includes("DEVOLUCI")) return "DEVOLUCIÓN PROVEEDOR";
  if (c.includes("MANTEN")) return "MANTENIMIENTO";
  return "OTROS";
}
