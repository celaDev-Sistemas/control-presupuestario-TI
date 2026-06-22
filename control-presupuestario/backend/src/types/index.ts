// ============================================
// TIPOS DE BASE DE DATOS
// ============================================

export interface Edificio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

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
  created_at: Date;
  updated_at: Date;
}

export interface AnioFiscal {
  id: string;
  anio: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  activo: boolean;
  bloqueado: boolean;
  created_at: Date;
}

export interface Presupuesto {
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
  fecha_aprobacion?: Date;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface GastoReal {
  id: string;
  edificio_id: string;
  cuenta_id: string;
  anio: number;
  mes: number;
  fecha_gasto: Date;
  monto: number;
  moneda: 'HNL' | 'USD';
  proveedor?: string;
  numero_factura?: string;
  descripcion: string;
  documento_url?: string;
  centro_costo?: string;
  registrado_por: string;
  fecha_registro: Date;
  updated_at: Date;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  azure_ad_id?: string;
  rol: 'ADMIN' | 'GESTOR' | 'VIEWER';
  departamento?: string;
  activo: boolean;
  ultimo_acceso?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UsuarioEdificio {
  id: string;
  usuario_id: string;
  edificio_id: string;
  puede_leer: boolean;
  puede_escribir: boolean;
  puede_aprobar: boolean;
  created_at: Date;
}

export interface Auditoria {
  id: string;
  usuario_id?: string;
  tabla: string;
  registro_id: string;
  accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'APPROVE';
  datos_anteriores?: any;
  datos_nuevos?: any;
  ip_address?: string;
  user_agent?: string;
  fecha: Date;
}

// ============================================
// TIPOS PARA VISTAS
// ============================================

export interface PresupuestoVsReal {
  edificio_codigo: string;
  edificio_nombre: string;
  cuenta_codigo: string;
  cuenta_nombre: string;
  anio: number;
  mes: number;
  monto_planificado: number;
  monto_real: number;
  diferencia: number;
  porcentaje_ejecutado: number;
  moneda: 'HNL' | 'USD';
}

export interface ResumenAnualEdificio {
  edificio_codigo: string;
  edificio_nombre: string;
  anio: number;
  presupuesto_anual: number;
  gasto_anual: number;
  disponible: number;
  porcentaje_ejecutado: number;
}

export interface CuentaConJerarquia extends Cuenta {
  ruta: string;
  ruta_nombres: string;
  hijos?: CuentaConJerarquia[];
}

// ============================================
// DTOs (Data Transfer Objects) para API
// ============================================

export interface CreateEdificioDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface UpdateEdificioDTO {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface CreateCuentaDTO {
  codigo: string;
  nombre: string;
  cuenta_padre_id?: string;
  tipo: 'GRUPO' | 'CUENTA' | 'SUBCUENTA';
  permite_movimientos?: boolean;
  orden?: number;
}

export interface UpdateCuentaDTO {
  nombre?: string;
  cuenta_padre_id?: string;
  permite_movimientos?: boolean;
  orden?: number;
  activo?: boolean;
}

export interface CreatePresupuestoDTO {
  edificio_id: string;
  cuenta_id: string;
  anio: number;
  mes: number;
  monto_planificado: number;
  moneda: 'HNL' | 'USD';
  comentario?: string;
}

export interface UpdatePresupuestoDTO {
  monto_planificado?: number;
  comentario?: string;
}

export interface AprobarPresupuestoDTO {
  aprobado: boolean;
}

export interface CreateGastoRealDTO {
  edificio_id: string;
  cuenta_id: string;
  anio: number;
  mes: number;
  fecha_gasto: string; // YYYY-MM-DD
  monto: number;
  moneda: 'HNL' | 'USD';
  proveedor?: string;
  numero_factura?: string;
  descripcion: string;
  documento_url?: string;
  centro_costo?: string;
}

export interface UpdateGastoRealDTO {
  fecha_gasto?: string;
  monto?: number;
  proveedor?: string;
  numero_factura?: string;
  descripcion?: string;
  documento_url?: string;
  centro_costo?: string;
}

// ============================================
// TIPOS PARA FILTROS Y QUERIES
// ============================================

export interface PresupuestoFilters {
  edificio_id?: string;
  cuenta_id?: string;
  anio?: number;
  mes?: number;
  aprobado?: boolean;
  moneda?: 'HNL' | 'USD';
}

export interface GastoRealFilters {
  edificio_id?: string;
  cuenta_id?: string;
  anio?: number;
  mes?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  proveedor?: string;
  moneda?: 'HNL' | 'USD';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// TIPOS PARA REPORTES Y DASHBOARDS
// ============================================

export interface DashboardStats {
  presupuesto_total_anio: number;
  gastado_total_anio: number;
  disponible_total: number;
  porcentaje_ejecutado: number;
  numero_edificios: number;
  gastos_pendientes_aprobacion: number;
  ultimas_modificaciones: number;
}

export interface ComparativoMensual {
  mes: number;
  mes_nombre: string;
  presupuestado: number;
  real: number;
  diferencia: number;
  porcentaje: number;
}

export interface TopGastos {
  cuenta_nombre: string;
  cuenta_codigo: string;
  total_gastado: number;
  porcentaje_del_total: number;
}

// ============================================
// TIPOS PARA RESPUESTAS DE API
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// ============================================
// TIPOS PARA EXCEL IMPORT/EXPORT
// ============================================

export interface ExcelImportRow {
  edificio_codigo: string;
  cuenta_codigo: string;
  mes: number;
  monto: number;
  comentario?: string;
}

export interface ExcelExportOptions {
  anio: number;
  edificio_ids?: string[];
  incluir_real?: boolean;
  formato?: 'simple' | 'detallado';
}
