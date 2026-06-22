import dotenv from 'dotenv';

dotenv.config();

export const azureAdConfig = {
  tenantId: process.env.AZURE_AD_TENANT_ID!,
  clientId: process.env.AZURE_AD_CLIENT_ID!,
  audience: process.env.AZURE_AD_AUDIENCE || process.env.AZURE_AD_CLIENT_ID!,
  issuer: process.env.AZURE_AD_ISSUER || 
    `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
  
  // Endpoints útiles
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`,
  tokenEndpoint: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
  
  // Scopes requeridos
  requiredScopes: ['access_as_user'],
  
  // Validación
  validateIssuer: true,
  validateAudience: true,
  validateLifetime: true,
  clockTolerance: 300, // 5 minutos de tolerancia para clock skew
};

// Validar que las variables requeridas estén presentes
export function validateAzureAdConfig(): void {
  const required = [
    'AZURE_AD_TENANT_ID',
    'AZURE_AD_CLIENT_ID',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas para Azure AD: ${missing.join(', ')}`
    );
  }
  
  console.log('✅ Configuración de Azure AD validada');
}

export default azureAdConfig;
