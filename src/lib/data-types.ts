export type RawRow = [number, number, number, number, string, number, number];
// [catIdx, tipoIdx, bienIdx, respIdx, fecha, cantidad, costo]

export interface DataPayload {
  cats: string[];
  tipos: string[];
  biens: string[];
  resps: string[];
  rows: RawRow[];
}

export interface Movement {
  categoria: string;
  tipo: string;
  bien: string;
  responsable: string;
  fecha: string;
  cantidad: number;
  costo: number;
}

export interface FilterState {
  categorias: Set<string>;
  tipos: Set<string>;
  biens: Set<string>;
  responsables: Set<string>;
  dateFrom: string | null;
  dateTo: string | null;
}

export const emptyFilters = (): FilterState => ({
  categorias: new Set(),
  tipos: new Set(),
  biens: new Set(),
  responsables: new Set(),
  dateFrom: null,
  dateTo: null,
});

export const hasAnyFilter = (f: FilterState) =>
  f.categorias.size + f.tipos.size + f.biens.size + f.responsables.size > 0 ||
  !!f.dateFrom ||
  !!f.dateTo;
