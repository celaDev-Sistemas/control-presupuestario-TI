import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { validateAzureAdConfig } from './config/azureAd';
import { userRateLimiter } from './middleware/auth';

// Importar rutas
import edificiosRoutes from './routes/edificios.routes';
// TODO: Importar más rutas cuando las crees

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Security headers
app.use(helmet());

// CORS
const corsOptions = {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(userRateLimiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await testConnection();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbConnected ? 'connected' : 'disconnected',
    version: '1.0.0',
  });
});

// ============================================
// RUTAS DE LA API
// ============================================

app.use(`${API_PREFIX}/edificios`, edificiosRoutes);

// TODO: Agregar más rutas
// app.use(`${API_PREFIX}/cuentas`, cuentasRoutes);
// app.use(`${API_PREFIX}/presupuesto`, presupuestoRoutes);
// app.use(`${API_PREFIX}/gastos`, gastosRoutes);
// app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
// app.use(`${API_PREFIX}/reportes`, reportesRoutes);
// app.use(`${API_PREFIX}/usuarios`, usuariosRoutes);

// ============================================
// RUTA 404
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ERROR HANDLER GLOBAL
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error no manejado:', err);
  
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================

async function startServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Validar configuración de Azure AD
    validateAzureAdConfig();
    
    // Verificar conexión a la base de datos
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ Servidor iniciado correctamente');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}${API_PREFIX}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('📝 Endpoints disponibles:');
      console.log(`   GET    ${API_PREFIX}/edificios`);
      console.log(`   POST   ${API_PREFIX}/edificios`);
      console.log(`   GET    ${API_PREFIX}/edificios/:id`);
      console.log(`   PUT    ${API_PREFIX}/edificios/:id`);
      console.log(`   DELETE ${API_PREFIX}/edificios/:id`);
      console.log('');
      console.log('🔐 Autenticación: Azure AD (Bearer token requerido)');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
startServer();

export default app;
