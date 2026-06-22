import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { azureAdConfig } from '../config/azureAd';

// Cliente JWKS para obtener las keys públicas de Azure AD
const client = jwksClient({
  jwksUri: azureAdConfig.jwksUri,
  cache: true,
  cacheMaxAge: 86400000, // 24 horas
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

// Función para obtener la key de firma
function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
      } else {
        const signingKey = key?.getPublicKey();
        if (signingKey) {
          resolve(signingKey);
        } else {
          reject(new Error('No se pudo obtener la signing key'));
        }
      }
    });
  });
}

// Interface extendida para el Request con usuario
export interface AuthRequest extends Request {
  user?: {
    oid: string;           // Object ID de Azure AD
    email: string;
    name: string;
    roles?: string[];
    tid: string;           // Tenant ID
  };
}

// Middleware principal de autenticación
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'No se proporcionó token de autenticación' 
      });
      return;
    }
    
    const token = authHeader.substring(7); // Remover "Bearer "
    
    // Decodificar el header del JWT para obtener el kid
    const decodedHeader = jwt.decode(token, { complete: true });
    
    if (!decodedHeader || !decodedHeader.header.kid) {
      res.status(401).json({ 
        error: 'Token inválido - no se pudo decodificar' 
      });
      return;
    }
    
    // Obtener la key pública correspondiente
    const signingKey = await getSigningKey(decodedHeader.header.kid);
    
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, signingKey, {
      audience: azureAdConfig.audience,
      issuer: azureAdConfig.issuer,
      algorithms: ['RS256'],
      clockTolerance: azureAdConfig.clockTolerance,
    }) as any;
    
    // Validar que sea del tenant correcto
    if (decoded.tid !== azureAdConfig.tenantId) {
      res.status(403).json({ 
        error: 'Token no pertenece al tenant autorizado' 
      });
      return;
    }
    
    // Extraer información del usuario
    req.user = {
      oid: decoded.oid || decoded.sub,
      email: decoded.email || decoded.preferred_username,
      name: decoded.name,
      roles: decoded.roles || [],
      tid: decoded.tid,
    };
    
    next();
    
  } catch (error: any) {
    console.error('Error en autenticación:', error);
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        error: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    } else {
      res.status(401).json({ 
        error: 'Error de autenticación',
        message: error.message 
      });
    }
  }
}

// Middleware opcional: validar que el usuario esté en la BD
export async function validateUserInDB(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }
    
    // Aquí puedes agregar lógica para verificar que el usuario
    // existe en tu tabla de usuarios y está activo
    // Por ahora, simplemente continúa
    
    next();
  } catch (error) {
    console.error('Error validando usuario en BD:', error);
    res.status(500).json({ error: 'Error validando usuario' });
  }
}

// Middleware: validar roles
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }
    
    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({ 
        error: 'No tienes permisos para acceder a este recurso',
        requiredRoles: allowedRoles 
      });
      return;
    }
    
    next();
  };
}

// Middleware: rate limiting por usuario
import rateLimit from 'express-rate-limit';

export const userRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  keyGenerator: (req: AuthRequest) => {
    return req.user?.oid || req.ip || 'anonymous';
  },
  message: 'Demasiadas peticiones desde este usuario, intenta de nuevo más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});
