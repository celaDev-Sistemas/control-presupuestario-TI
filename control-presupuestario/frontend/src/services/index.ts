import { get, post, put, del } from './api';

// ─────────────────────────────────────────────────────────────────
// CUENTAS
// ─────────────────────────────────────────────────────────────────
export interface Cuenta {
  id: string;
  codigo: string;
  nombre: string;
  cuenta_padre_id?: string;
  nivel: number;
  tipo: 'GRUPO' | 'CUENTA' | 'SUBCUENTA';
  permite_movimientos: boolean;
  orden: number;
  activo: boolean;
}
export interface CuentaArbol extends Cuenta {
  hijos?: CuentaArbol[];
}

export const cuentasService = {
  async getAll(): Promise<Cuenta[]> {
    const r = await get<Cuenta[]>('/cuentas');
    return r.data ?? [];
  },
  async getArbol(): Promise<CuentaArbol[]> {
    const r = await get<CuentaArbol[]>('/cuentas/arbol');
    return r.data ?? [];
  },
};

// ─────────────────────────────────────────────────────────────────
// PRESUPUESTO
// ─────────────────────────────────────────────────────────────────
export interface PresupuestoItem {
  id: string;
  edificio_id: string;
  cuenta_id: string;
  anio: number;
  mes: number;
  monto_planificado: number;
  moneda: 'HNL' | 'USD';
  comentario?: string;
  aprobado: boolean;
  aprobado_por?: string;
  // Joins
  edificio_codigo?: string;
  edificio_nombre?: string;
  cuenta_codigo?: string;
  cuenta_nombre?: string;
}

export interface PresupuestoFiltros {
  edificio_id?: string;
  cuenta_id?: string;
  anio?: number;
  mes?: number;
}

export const presupuestoService = {
  async getAll(filtros?: PresupuestoFiltros): Promise<PresupuestoItem[]> {
    const r = await get<PresupuestoItem[]>('/presupuesto', { params: filtros });
    return r.data ?? [];
  },
  async create(dto: Partial<PresupuestoItem>): Promise<PresupuestoItem> {
    const r = await post<PresupuestoItem>('/presupuesto', dto);
    return r.data!;
  },
  async update(id: string, dto: Partial<PresupuestoItem>): Promise<PresupuestoItem> {
    const r = await put<PresupuestoItem>(`/presupuesto/${id}`, dto);
    return r.data!;
  },
  async delete(id: string): Promise<void> {
    await del(`/presupuesto/${id}`);
  },
  async aprobar(id: string, aprobado: boolean): Promise<void> {
    await put(`/presupuesto/${id}/aprobar`, { aprobado });
  },
};

// ─────────────────────────────────────────────────────────────────
// GASTOS REALES
// ─────────────────────────────────────────────────────────────────
export interface Gasto {
  id: string;
  edificio_id: string;
  cuenta_id: string;
  anio: number;
  mes: number;
  fecha_gasto: string;
  monto: number;
  moneda: 'HNL' | 'USD';
  proveedor?: string;
  numero_factura?: string;
  descripcion: string;
  documento_url?: string;
  registrado_por: string;
  // Joins
  edificio_nombre?: string;
  cuenta_nombre?: string;
  cuenta_codigo?: string;
}

export interface GastoFiltros {
  edificio_id?: string;
  cuenta_id?: string;
  anio?: number;
  mes?: number;
}

export const gastosService = {
  async getAll(filtros?: GastoFiltros): Promise<Gasto[]> {
    const r = await get<Gasto[]>('/gastos', { params: filtros });
    return r.data ?? [];
  },
  async create(dto: Partial<Gasto>): Promise<Gasto> {
    const r = await post<Gasto>('/gastos', dto);
    return r.data!;
  },
  async update(id: string, dto: Partial<Gasto>): Promise<Gasto> {
    const r = await put<Gasto>(`/gastos/${id}`, dto);
    return r.data!;
  },
  async delete(id: string): Promise<void> {
    await del(`/gastos/${id}`);
  },
};

// ─────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  presupuesto_total: number;
  gastado_total: number;
  disponible_total: number;
  porcentaje_ejecutado: number;
  numero_edificios: number;
  presupuesto_pendiente_aprobacion: number;
}

export interface ComparativoMensual {
  mes: number;
  mes_nombre: string;
  presupuestado: number;
  real: number;
}

export interface ResumenEdificio {
  edificio_codigo: string;
  edificio_nombre: string;
  presupuesto_anual: number;
  gasto_anual: number;
  disponible: number;
  porcentaje_ejecutado: number;
}

export const dashboardService = {
  async getStats(anio: number): Promise<DashboardStats> {
    const r = await get<DashboardStats>('/dashboard/stats', { params: { anio } });
    return r.data!;
  },
  async getComparativoMensual(anio: number, edificioId?: string): Promise<ComparativoMensual[]> {
    const r = await get<ComparativoMensual[]>('/dashboard/mensual', {
      params: { anio, edificio_id: edificioId },
    });
    return r.data ?? [];
  },
  async getResumenEdificios(anio: number): Promise<ResumenEdificio[]> {
    const r = await get<ResumenEdificio[]>('/dashboard/edificios', { params: { anio } });
    return r.data ?? [];
  },
};

// ─────────────────────────────────────────────────────────────────
// REPORTES
// ─────────────────────────────────────────────────────────────────
export const reportesService = {
  async exportarExcel(anio: number, edificioIds?: string[]): Promise<Blob> {
    const response = await get<Blob>('/reportes/excel', {
      params: { anio, edificio_ids: edificioIds?.join(',') },
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
export const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export function formatMoney(amount: number, currency: 'HNL' | 'USD' = 'HNL'): string {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function porcent(gastado: number, presupuestado: number): number {
  if (!presupuestado || presupuestado === 0) return 0;
  return Math.round((gastado / presupuestado) * 100);
}
