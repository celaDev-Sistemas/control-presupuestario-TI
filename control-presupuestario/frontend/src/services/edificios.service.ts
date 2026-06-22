import { get, post, put, del } from './api';

// ============================================
// TIPOS
// ============================================

export interface Edificio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface EdificioStats {
  codigo: string;
  nombre: string;
  presupuesto_total: number;
  gastado_total: number;
  disponible: number;
}

// ============================================
// SERVICIO DE EDIFICIOS
// ============================================

export const edificiosService = {
  // GET /api/v1/edificios - Listar todos
  async getAll(activo?: boolean): Promise<Edificio[]> {
    const params = activo !== undefined ? { activo: activo.toString() } : {};
    const response = await get<Edificio[]>('/edificios', { params });
    return response.data || [];
  },
  
  // GET /api/v1/edificios/:id - Obtener por ID
  async getById(id: string): Promise<Edificio | null> {
    const response = await get<Edificio>(`/edificios/${id}`);
    return response.data || null;
  },
  
  // POST /api/v1/edificios - Crear nuevo
  async create(data: CreateEdificioDTO): Promise<Edificio> {
    const response = await post<Edificio>('/edificios', data);
    if (!response.data) {
      throw new Error('No se pudo crear el edificio');
    }
    return response.data;
  },
  
  // PUT /api/v1/edificios/:id - Actualizar
  async update(id: string, data: UpdateEdificioDTO): Promise<Edificio> {
    const response = await put<Edificio>(`/edificios/${id}`, data);
    if (!response.data) {
      throw new Error('No se pudo actualizar el edificio');
    }
    return response.data;
  },
  
  // DELETE /api/v1/edificios/:id - Desactivar
  async delete(id: string): Promise<void> {
    await del(`/edificios/${id}`);
  },
  
  // GET /api/v1/edificios/:id/stats - Estadísticas
  async getStats(id: string, anio?: number): Promise<EdificioStats> {
    const params = anio ? { anio: anio.toString() } : {};
    const response = await get<EdificioStats>(`/edificios/${id}/stats`, { params });
    if (!response.data) {
      throw new Error('No se pudieron obtener las estadísticas');
    }
    return response.data;
  },
};

// Hook personalizado para usar con React Query
export function useEdificiosQueries() {
  return {
    // Query key factories
    all: ['edificios'] as const,
    lists: () => [...useEdificiosQueries().all, 'list'] as const,
    list: (filters: { activo?: boolean }) => 
      [...useEdificiosQueries().lists(), filters] as const,
    details: () => [...useEdificiosQueries().all, 'detail'] as const,
    detail: (id: string) => [...useEdificiosQueries().details(), id] as const,
    stats: (id: string, anio?: number) => 
      [...useEdificiosQueries().detail(id), 'stats', anio] as const,
  };
}
