import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import rateLimit from 'express-rate-limit';
import { azureAdConfig } from '../config/azureAd';

const client = jwksClient({
  jwksUri: azureAdConfig.jwksUri,
  cache: true,
  cacheMaxAge: 86400000,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);

      const signingKey = key?.getPublicKey();

      if (!signingKey) {
        return reject(new Error('No se pudo obtener la signing key'));
      }

      resolve(signingKey);
    });
  });
}

export interface AuthRequest extends Request {
  user?: {
    oid: string;
    email: string;
    name: string;
    roles?: string[];
    tid: string;
  };
}

function normalizeAudience(aud: string | string[] | undefined): string[] {
  if (!aud) return [];
  return Array.isArray(aud) ? aud : [aud];
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación',
        code: 'NO_TOKEN',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decodedHeader = jwt.decode(token, { complete: true });

    if (!decodedHeader || !decodedHeader.header.kid) {
      res.status(401).json({
        success: false,
        error: 'Token inválido - no se pudo decodificar',
        code: 'TOKEN_DECODE_ERROR',
      });
      return;
    }

    const signingKey = await getSigningKey(decodedHeader.header.kid);

    const decoded = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      clockTolerance: azureAdConfig.clockTolerance,
      audience: azureAdConfig.audience,
      issuer: azureAdConfig.validIssuers,
    }) as any;

    if (decoded.tid !== azureAdConfig.tenantId) {
      res.status(403).json({
        success: false,
        error: 'Token no pertenece al tenant autorizado',
        code: 'INVALID_TENANT',
      });
      return;
    }

    const audiences = normalizeAudience(decoded.aud);

    if (!audiences.includes(azureAdConfig.audience)) {
      res.status(401).json({
        success: false,
        error: 'Audience inválido',
        code: 'INVALID_AUDIENCE',
        expected: azureAdConfig.audience,
        received: decoded.aud,
      });
      return;
    }

    req.user = {
      oid: decoded.oid || decoded.sub,
      email: decoded.email || decoded.preferred_username || '',
      name: decoded.name || decoded.preferred_username || '',
      roles: decoded.roles || [],
      tid: decoded.tid,
    };

    next();
  } catch (error: any) {
    console.error('Error en autenticación:', {
      name: error.name,
      message: error.message,
    });

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: 'Token inválido',
        code: 'TOKEN_INVALID',
        message: error.message,
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Error de autenticación',
      code: 'AUTH_ERROR',
      message: error.message,
    });
  }
}

export async function validateUserInDB(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Usuario no autenticado',
    });
    return;
  }

  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso',
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}

export const userRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  keyGenerator: (req: AuthRequest) => {
    return req.user?.oid || req.ip || 'anonymous';
  },
  message: {
    success: false,
    error: 'Demasiadas peticiones, intenta de nuevo más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
