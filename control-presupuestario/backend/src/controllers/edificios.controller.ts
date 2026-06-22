import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query, queryOne } from '../config/database';
import { 
  Edificio, 
  CreateEdificioDTO, 
  UpdateEdificioDTO,
  ApiResponse 
} from '../types';

// GET /api/v1/edificios - Listar todos los edificios
export async function getEdificios(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { activo } = req.query;
    
    let sql = 'SELECT * FROM edificios';
    const params: any[] = [];
    
    if (activo !== undefined) {
      sql += ' WHERE activo = ?';
      params.push(activo === 'true' ? 1 : 0);
    }
    
    sql += ' ORDER BY codigo';
    
    const edificios = await query<Edificio>(sql, params);
    
    const response: ApiResponse<Edificio[]> = {
      success: true,
      data: edificios,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error obteniendo edificios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener edificios',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// GET /api/v1/edificios/:id - Obtener un edificio por ID
export async function getEdificioById(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    
    const edificio = await queryOne<Edificio>(
      'SELECT * FROM edificios WHERE id = ?',
      [id]
    );
    
    if (!edificio) {
      res.status(404).json({
        success: false,
        error: 'Edificio no encontrado',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    const response: ApiResponse<Edificio> = {
      success: true,
      data: edificio,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error obteniendo edificio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener edificio',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// POST /api/v1/edificios - Crear un nuevo edificio
export async function createEdificio(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const dto: CreateEdificioDTO = req.body;
    
    // Validar que no exista un edificio con el mismo código
    const existe = await queryOne(
      'SELECT id FROM edificios WHERE codigo = ?',
      [dto.codigo]
    );
    
    if (existe) {
      res.status(400).json({
        success: false,
        error: 'Ya existe un edificio con ese código',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    // Insertar el nuevo edificio
    const sql = `
      INSERT INTO edificios (codigo, nombre, descripcion)
      VALUES (?, ?, ?)
    `;
    
    const [result]: any = await query(sql, [
      dto.codigo,
      dto.nombre,
      dto.descripcion || null,
    ]);
    
    // Obtener el edificio recién creado
    const nuevoEdificio = await queryOne<Edificio>(
      'SELECT * FROM edificios WHERE id = ?',
      [result.insertId]
    );
    
    const response: ApiResponse<Edificio> = {
      success: true,
      data: nuevoEdificio!,
      message: 'Edificio creado exitosamente',
      timestamp: new Date().toISOString(),
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    console.error('Error creando edificio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear edificio',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// PUT /api/v1/edificios/:id - Actualizar un edificio
export async function updateEdificio(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const dto: UpdateEdificioDTO = req.body;
    
    // Verificar que el edificio existe
    const edificio = await queryOne<Edificio>(
      'SELECT * FROM edificios WHERE id = ?',
      [id]
    );
    
    if (!edificio) {
      res.status(404).json({
        success: false,
        error: 'Edificio no encontrado',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    // Construir el UPDATE dinámicamente
    const updates: string[] = [];
    const params: any[] = [];
    
    if (dto.nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(dto.nombre);
    }
    
    if (dto.descripcion !== undefined) {
      updates.push('descripcion = ?');
      params.push(dto.descripcion);
    }
    
    if (dto.activo !== undefined) {
      updates.push('activo = ?');
      params.push(dto.activo ? 1 : 0);
    }
    
    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No se proporcionaron campos para actualizar',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    params.push(id);
    
    const sql = `UPDATE edificios SET ${updates.join(', ')} WHERE id = ?`;
    await query(sql, params);
    
    // Obtener el edificio actualizado
    const edificioActualizado = await queryOne<Edificio>(
      'SELECT * FROM edificios WHERE id = ?',
      [id]
    );
    
    const response: ApiResponse<Edificio> = {
      success: true,
      data: edificioActualizado!,
      message: 'Edificio actualizado exitosamente',
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error actualizando edificio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar edificio',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// DELETE /api/v1/edificios/:id - Eliminar (desactivar) un edificio
export async function deleteEdificio(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    
    // Verificar que el edificio existe
    const edificio = await queryOne<Edificio>(
      'SELECT * FROM edificios WHERE id = ?',
      [id]
    );
    
    if (!edificio) {
      res.status(404).json({
        success: false,
        error: 'Edificio no encontrado',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    // En lugar de eliminar, desactivar
    await query(
      'UPDATE edificios SET activo = 0 WHERE id = ?',
      [id]
    );
    
    const response: ApiResponse = {
      success: true,
      message: 'Edificio desactivado exitosamente',
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error eliminando edificio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar edificio',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// GET /api/v1/edificios/:id/stats - Estadísticas de un edificio
export async function getEdificioStats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { anio } = req.query;
    
    const anioActual = anio ? parseInt(anio as string) : new Date().getFullYear();
    
    const stats = await queryOne(`
      SELECT 
        e.codigo,
        e.nombre,
        COALESCE(SUM(p.monto_planificado), 0) AS presupuesto_total,
        COALESCE(SUM(g.monto), 0) AS gastado_total,
        (COALESCE(SUM(p.monto_planificado), 0) - COALESCE(SUM(g.monto), 0)) AS disponible
      FROM edificios e
      LEFT JOIN presupuesto p ON p.edificio_id = e.id AND p.anio = ?
      LEFT JOIN gastos_reales g ON g.edificio_id = e.id AND g.anio = ?
      WHERE e.id = ?
      GROUP BY e.id
    `, [anioActual, anioActual, id]);
    
    if (!stats) {
      res.status(404).json({
        success: false,
        error: 'Edificio no encontrado',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
