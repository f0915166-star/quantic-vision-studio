// rows: [catIdx, areaIdx, bienIdx, respIdx, equipoIdx, conceptoIdx, fecha, cantidad, costo, unidadIdx]
export type RawRow = [number, number, number, number, number, number, string, number, number, number];

export interface DataPayload {
  cats: string[];
  areas: string[];
  biens: string[];
  resps: string[];
  equipos: string[];
  conceptos: string[];
  unidades: string[];
  rows: RawRow[];
  meta?: { generated: string; n: number };
}

// Esquema de negocio: BIEN · CATEGORIA · FECHA_MOVIMIENTO · COSTO_TOTAL · CONCEPTO · AREA_RESPONSABLE · RESPONSABLE · UNIDAD_MEDIDA
// + EQUIPO derivado de CONCEPTO (clave para análisis de flota móvil)
export interface Movement {
  categoria: string;
  area: string;
  bien: string;
  responsable: string;
  equipo: string;
  concepto: string;
  fecha: string;
  cantidad: number;
  costo: number;
  unidad: string;
}

export interface FilterState {
  categorias: Set<string>;
  areas: Set<string>;
  equipos: Set<string>;
  biens: Set<string>;
  responsables: Set<string>;
  dateFrom: string | null;
  dateTo: string | null;
}

export const emptyFilters = (): FilterState => ({
  categorias: new Set(),
  areas: new Set(),
  equipos: new Set(),
  biens: new Set(),
  responsables: new Set(),
  dateFrom: null,
  dateTo: null,
});

export const hasAnyFilter = (f: FilterState) =>
  f.categorias.size + f.areas.size + f.equipos.size + f.biens.size + f.responsables.size > 0 ||
  !!f.dateFrom || !!f.dateTo;
